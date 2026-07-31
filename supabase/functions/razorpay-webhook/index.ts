// Grants exam access after Razorpay confirms a payment.
//
// This is the only thing in the system allowed to create an enrollment. It is
// reached server-to-server by Razorpay, never by a browser, and it believes
// nothing until the HMAC signature over the raw request body verifies against
// the webhook secret. That is what stops someone granting themselves access by
// replaying a success URL — which is exactly what the old payment-success.html
// let anyone do.
//
// Deploy: Supabase Dashboard -> Edge Functions -> new function
//         "razorpay-webhook", paste this file.
//         Then set "Verify JWT" to OFF for this function — Razorpay does not
//         send a Supabase JWT. The signature check is the authentication.
// Secrets required:
//   RAZORPAY_WEBHOOK_SECRET   the secret you type when creating the webhook
// Razorpay Dashboard -> Settings -> Webhooks -> add:
//   URL:    https://<project>.supabase.co/functions/v1/razorpay-webhook
//   Events: payment.captured, order.paid, payment.failed

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const DEFAULT_ACCESS_DAYS = 15;

function hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Constant-time comparison. A fast-exit compare leaks how much of a forged
// signature was correct, which is enough to reconstruct one byte at a time.
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function signatureIsValid(raw: string, signature: string, secret: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(raw));
  return safeEqual(hex(mac), signature.trim().toLowerCase());
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("POST only", { status: 405 });

  const secret = Deno.env.get("RAZORPAY_WEBHOOK_SECRET");
  if (!secret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return new Response("not configured", { status: 503 });
  }

  // Read the body as raw text. Parsing and re-serialising would change the
  // bytes and the signature would never match.
  const raw = await req.text();
  const signature = req.headers.get("x-razorpay-signature") ?? "";
  if (!signature || !(await signatureIsValid(raw, signature, secret))) {
    console.warn("rejected webhook with bad signature");
    return new Response("invalid signature", { status: 401 });
  }

  let event: any;
  try {
    event = JSON.parse(raw);
  } catch {
    return new Response("bad json", { status: 400 });
  }

  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );

  const kind = String(event?.event ?? "");
  const payment = event?.payload?.payment?.entity;
  const order = event?.payload?.order?.entity;
  const notes = payment?.notes ?? order?.notes ?? {};
  const orderId = payment?.order_id ?? order?.id ?? null;

  if (kind === "payment.failed") {
    if (orderId) {
      await admin.from("payments")
        .update({ status: "failed", raw_payload: event })
        .eq("order_id", orderId);
    }
    return new Response("ok", { status: 200 });
  }

  if (kind !== "payment.captured" && kind !== "order.paid") {
    // Acknowledge anything else so Razorpay stops retrying it.
    return new Response("ignored", { status: 200 });
  }

  const userId = String(notes.user_id ?? "");
  const courseId = String(notes.course_id ?? "");
  if (!userId || !courseId) {
    console.error("paid event with no user_id/course_id in notes", orderId);
    return new Response("ok", { status: 200 });
  }

  const days = Number(notes.access_days) > 0
    ? Number(notes.access_days)
    : DEFAULT_ACCESS_DAYS;

  // Extend from whichever is later: now, or access the student already holds.
  const { data: existing } = await admin
    .from("enrollments")
    .select("id, access_until")
    .eq("user_id", userId)
    .eq("course_id", courseId)
    .maybeSingle();

  const now = Date.now();
  const base = existing?.access_until
    ? Math.max(now, new Date(existing.access_until).getTime())
    : now;
  const accessUntil = new Date(base + days * 86_400_000).toISOString();

  if (existing?.id) {
    await admin.from("enrollments")
      .update({ access_until: accessUntil })
      .eq("id", existing.id);
  } else {
    await admin.from("enrollments")
      .insert({ user_id: userId, course_id: courseId, access_until: accessUntil });
  }

  // Razorpay retries until it gets a 2xx, so the same event can arrive more
  // than once. Keying the update on order_id makes a repeat a no-op rather
  // than a second grant.
  // Only columns confirmed to exist on this table are written. The Razorpay
  // payment id lives inside raw_payload rather than its own column, because
  // `payments` has no payment_id column in this database.
  if (orderId) {
    await admin.from("payments")
      .update({ status: "paid", raw_payload: event })
      .eq("order_id", orderId);
  }

  console.log(`granted ${courseId} to ${userId} until ${accessUntil}`);
  return new Response("ok", { status: 200 });
});
