// Creates a Razorpay order for a signed-in student.
//
// The only reason this runs on a server is that two things must never be in
// the browser: the Razorpay key secret, and the decision about how much to
// charge. The client sends a course id and nothing else — the price is read
// from the database here. A client that posts {"amount": 1} gets ignored,
// because it is never asked for an amount.
//
// Deploy: Supabase Dashboard -> Edge Functions -> new function
//         "razorpay-create-order", paste this file.
// Secrets required (Dashboard -> Edge Functions -> Secrets):
//   RAZORPAY_KEY_ID       rzp_test_... or rzp_live_...
//   RAZORPAY_KEY_SECRET   never leaves this function
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ACCESS_DAYS = 15;
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json({ error: "POST only" }, 405);

  const keyId = Deno.env.get("RAZORPAY_KEY_ID");
  const keySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
  if (!keyId || !keySecret) {
    return json({ error: "Payment is not configured yet." }, 503);
  }

  // Who is asking. The anon key alone is not enough — we want the user's JWT.
  const authHeader = req.headers.get("Authorization") ?? "";
  const jwt = authHeader.replace(/^Bearer\s+/i, "");
  if (!jwt) return json({ error: "Sign in first." }, 401);

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const { data: userData, error: userError } = await admin.auth.getUser(jwt);
  const user = userData?.user;
  if (userError || !user) return json({ error: "Sign in first." }, 401);

  let courseId = "";
  try {
    courseId = String((await req.json())?.course_id ?? "");
  } catch {
    return json({ error: "Bad request." }, 400);
  }
  if (!courseId) return json({ error: "No course selected." }, 400);

  // Price and liveness come from the database, never from the caller.
  const { data: course, error: courseError } = await admin
    .from("courses")
    .select("id, title, price_inr, access_days, is_published")
    .eq("id", courseId)
    .maybeSingle();

  if (courseError || !course) return json({ error: "Exam not found." }, 404);
  if (!course.is_published) return json({ error: "This exam is not on sale." }, 403);

  // Refuse to sell an exam whose question bank is not loaded. This is the same
  // rule the site renders, enforced where it cannot be bypassed.
  const { count: questionCount } = await admin
    .from("questions")
    .select("id, quizzes!inner(course_id)", { count: "exact", head: true })
    .eq("quizzes.course_id", course.id);

  if ((questionCount ?? 0) < 1) {
    return json({ error: "This exam is not ready for sale yet." }, 403);
  }

  // Already has active access? Do not take the money twice.
  const { data: existing } = await admin
    .from("enrollments")
    .select("access_until")
    .eq("user_id", user.id)
    .eq("course_id", course.id)
    .gt("access_until", new Date().toISOString())
    .maybeSingle();

  if (existing) {
    return json({ error: "You already have active access to this exam." }, 409);
  }

  const amountPaise = Math.round(Number(course.price_inr) * 100);
  if (!Number.isFinite(amountPaise) || amountPaise < 100) {
    return json({ error: "This exam is not priced correctly. Please contact support." }, 500);
  }

  // Razorpay receipts are capped at 40 characters.
  const receipt = `ns_${user.id.slice(0, 8)}_${Date.now().toString(36)}`.slice(0, 40);

  const orderResponse = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
      // The webhook arrives with no session, so it reads who and what from
      // these notes rather than trusting anything the browser sends back.
      notes: {
        user_id: user.id,
        course_id: course.id,
        access_days: String(course.access_days ?? ACCESS_DAYS),
      },
    }),
  });

  if (!orderResponse.ok) {
    console.error("razorpay order failed", await orderResponse.text());
    return json({ error: "Could not start the payment. Please try again." }, 502);
  }

  const order = await orderResponse.json();

  // Record the attempt now so an unfinished payment is still traceable.
  await admin.from("payments").insert({
    user_id: user.id,
    course_id: course.id,
    amount_inr: Number(course.price_inr),
    status: "created",
    order_id: order.id,
    provider: "razorpay",
    raw_payload: order,
  });

  return json({
    order_id: order.id,
    amount: order.amount,
    currency: order.currency,
    key_id: keyId,
    course_title: course.title,
    user_email: user.email,
  });
});
