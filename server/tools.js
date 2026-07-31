// What the assistant can actually do, as opposed to what it can recite.
//
// A retrieval-only bot answers "how many days do I have left?" with the
// general policy — fifteen — which is not the student's answer. These tools
// let it look the real answer up.
//
// Two rules hold throughout:
//
//  1. Anything student-specific runs as the STUDENT, using the Supabase JWT
//     their browser sent. Row-level security then does the authorisation, so a
//     confused model physically cannot read someone else's enrolment. The
//     service-role key is never used here.
//  2. A signed-out visitor simply has no personal tools. They are not offered
//     and then refused; they are absent from the tool list entirely.

const SUPABASE_URL = process.env.SUPABASE_URL
  || 'https://yzmctktxzpzdfhdubwjs.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY
  || 'sb_publishable_BT1BJ5IKC7OArjTBdUBjkA_CjBZiFVf';

const PRICE_INR = Number(process.env.PRICE_INR || 329);
const ACCESS_DAYS = Number(process.env.ACCESS_DAYS || 15);

async function rest(path, token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token || SUPABASE_ANON_KEY}`
    }
  });
  if (!response.ok) {
    throw new Error(`Supabase ${response.status}: ${(await response.text()).slice(0, 200)}`);
  }
  return response.json();
}

function daysLeft(iso) {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

/* ----------------------------------------------------------------- schemas */

export const PUBLIC_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'list_courses',
      description:
        'List the NISM exams NISMSTUDY sells, with price and whether each is on '
        + 'sale yet. Use for any question about what is available, what it costs, '
        + 'or whether a particular exam is covered.',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_workbook',
      description:
        'Search the official NISM exam workbooks for an explanation of a syllabus '
        + 'topic. Use whenever the student asks what something means or how '
        + 'something works in the exam syllabus, rather than about their account.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The topic to look up.' },
          exam: {
            type: 'string',
            description: 'Optional exam to narrow to, e.g. "Equity Derivatives".'
          }
        },
        required: ['query']
      }
    }
  }
];

export const STUDENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'get_my_access',
      description:
        'The exams this signed-in student has bought, and how many days of '
        + 'access remain on each. Use for "what do I have", "when does my access '
        + 'expire", "how long do I have left".',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_my_progress',
      description:
        'How many mock papers this student has completed and their best score. '
        + 'Use for "how am I doing", "what did I score", "which papers have I done".',
      parameters: { type: 'object', properties: {}, required: [] }
    }
  }
];

/* --------------------------------------------------------------- executors */

async function listCourses() {
  const rows = await rest(
    'courses?select=title,slug,price_inr,access_days,is_live,is_published'
    + '&is_published=eq.true&order=title'
  );

  const liveSlugs = (process.env.LIVE_COURSE_SLUGS
    || 'nism-series-i-currency-derivatives,'
     + 'nism-series-v-a-mutual-fund-distributors,'
     + 'nism-series-viii-equity-derivatives'
  ).split(',').map((s) => s.trim()).filter(Boolean);

  const sellable = (c) => c.is_live === true || liveSlugs.includes(c.slug);

  // Returned as two separate lists, not one list with an `on_sale: false`
  // flag. A 3B model reliably ignores the flag and prints every row under one
  // price heading — observed doing exactly that, quoting Rs 329 for five exams
  // that cannot be bought. Only the sellable list carries a price at all, so
  // there is no price for the model to attach to an unavailable exam.
  // Key names are chosen to read naturally if the model quotes them back —
  // it printed the literal string "not_yet_available" to a student once.
  return {
    available_to_buy_now: rows.filter(sellable).map((c) => ({
      exam: c.title,
      price: `Rs ${PRICE_INR}`,
      access_days: ACCESS_DAYS
    })),
    coming_soon: rows.filter((c) => !sellable(c)).map((c) => c.title),
    note: 'Describe the coming_soon exams as "coming soon". They cannot be '
        + 'bought and have no price, but their workbooks are already free to '
        + 'download from the Free Materials page.'
  };
}

async function getMyAccess(token) {
  if (!token) return { error: 'not signed in' };
  const rows = await rest(
    'enrollments?select=access_until,courses(title)&order=access_until.desc',
    token
  );
  const active = rows
    .filter((r) => new Date(r.access_until).getTime() > Date.now())
    .map((r) => ({
      exam: r.courses?.title || 'Unknown exam',
      days_left: daysLeft(r.access_until),
      expires: new Date(r.access_until).toISOString().slice(0, 10)
    }));

  return active.length
    ? { active }
    : { active: [], note: 'This student has not bought any exam yet.' };
}

async function getMyProgress(token) {
  if (!token) return { error: 'not signed in' };

  const attempts = await rest(
    'exam_attempts?select=score,status,quiz_id,submitted_at'
    + '&status=eq.submitted&order=submitted_at.desc&limit=100',
    token
  );
  if (!attempts.length) {
    return { completed: 0, note: 'No mock papers completed yet.' };
  }

  const quizIds = [...new Set(attempts.map((a) => a.quiz_id))];
  const papers = await rest(
    `quizzes?select=id,title,max_marks,total_questions&id=in.(${quizIds.join(',')})`,
    token
  );
  const byId = Object.fromEntries(papers.map((p) => [p.id, p]));

  let best = null;
  for (const a of attempts) {
    const paper = byId[a.quiz_id];
    const max = Number(paper?.max_marks || paper?.total_questions || 0);
    if (max > 0 && a.score != null) {
      const pct = Math.round((Number(a.score) / max) * 100);
      if (best === null || pct > best) best = pct;
    }
  }

  return {
    completed: attempts.length,
    distinct_papers: quizIds.length,
    best_score_percent: best,
    last_attempt: attempts[0]?.submitted_at?.slice(0, 10) || null
  };
}

/* ------------------------------------------------------------- dispatching */

export function toolsFor(hasSession) {
  return hasSession ? [...PUBLIC_TOOLS, ...STUDENT_TOOLS] : PUBLIC_TOOLS;
}

export async function runTool(name, args, { token, searchWorkbook }) {
  switch (name) {
    case 'list_courses':
      return listCourses();
    case 'get_my_access':
      return getMyAccess(token);
    case 'get_my_progress':
      return getMyProgress(token);
    case 'search_workbook':
      return searchWorkbook(String(args?.query || ''), String(args?.exam || ''));
    default:
      return { error: `no such tool: ${name}` };
  }
}
