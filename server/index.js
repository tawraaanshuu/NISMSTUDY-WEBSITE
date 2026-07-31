import http from 'node:http';
import os from 'node:os';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { toolsFor, runTool } from './tools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
// qwen3:14b was measured at 2.3 tok/s on this CPU, and qwen3:4b still emitted
// reasoning prose instead of answering. qwen2.5:3b-instruct is roughly twice
// as fast, does not think out loud, and supports tool calling — which the
// bigger model's speed made impossible to use anyway.
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen2.5:3b-instruct';
const OLLAMA_THINK = process.env.OLLAMA_THINK === 'true';
// Ollama sizes its own thread count from performance cores, which on a hybrid
// Intel part means 2 of 14 — measured at 191% CPU out of a possible 1400%.
// Setting this explicitly was worth more than any other tuning here.
const OLLAMA_NUM_THREAD = Number(process.env.OLLAMA_NUM_THREAD || 0)
  || Math.max(2, (os.cpus()?.length || 4) - 2);
// How many times the model may call a tool before it must answer. Two rounds
// covers "look up my access, then look up the course" without letting a
// confused model loop for minutes on a CPU.
const MAX_TOOL_ROUNDS = Number(process.env.MAX_TOOL_ROUNDS || 2);
// Fewer chunks = a shorter prompt = less prompt-processing time, which matters
// a lot on CPU-only hosts.
const CONTEXT_CHUNKS = Number(process.env.CONTEXT_CHUNKS || 4);
const KNOWLEDGE_DIR = process.env.KNOWLEDGE_DIR || path.join(__dirname, 'knowledge');
const MAX_BODY_BYTES = Number(process.env.MAX_BODY_BYTES || 12_000);
const REQUEST_TIMEOUT_MS = Number(process.env.REQUEST_TIMEOUT_MS || 180_000);
const RATE_LIMIT_WINDOW_MS = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || 20);
const ALLOWED_ORIGINS = new Set(
  (process.env.ALLOWED_ORIGINS || [
    // The site is served from GitHub Pages. Without this origin every browser
    // request is blocked by CORS before it reaches any of the logic below.
    'https://tawraaanshuu.github.io',
    'https://nismstudy.in',
    'https://www.nismstudy.in',
    'http://localhost:8080',
    'http://127.0.0.1:8080'
  ].join(','))
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

const buckets = new Map();
let knowledgeCache = {
  loadedAt: 0,
  chunks: [],
  files: []
};

function sendJson(res, status, payload, headers = {}) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...headers
  });
  res.end(JSON.stringify(payload));
}

function corsHeaders(req) {
  const origin = req.headers.origin;
  if (!origin || !ALLOWED_ORIGINS.has(origin)) return {};
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    // Authorization is needed so a signed-in student's Supabase token can
    // reach the personal tools.
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin'
  };
}

function getClientIp(req) {
  const cfIp = req.headers['cf-connecting-ip'];
  if (cfIp) return String(cfIp);
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket.remoteAddress || 'unknown';
}

function checkRateLimit(req) {
  const now = Date.now();
  const ip = getClientIp(req);
  const bucket = buckets.get(ip) || { resetAt: now + RATE_LIMIT_WINDOW_MS, count: 0 };
  if (now > bucket.resetAt) {
    bucket.resetAt = now + RATE_LIMIT_WINDOW_MS;
    bucket.count = 0;
  }
  bucket.count += 1;
  buckets.set(ip, bucket);
  return bucket.count <= RATE_LIMIT_MAX;
}

async function readRequestBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (Buffer.byteLength(body) > MAX_BODY_BYTES) {
      throw Object.assign(new Error('Request body too large'), { status: 413 });
    }
  }
  return body ? JSON.parse(body) : {};
}

function tokenize(value) {
  const stopWords = new Set([
    'the', 'and', 'for', 'with', 'from', 'this', 'that', 'your', 'you', 'are',
    'can', 'how', 'what', 'when', 'where', 'why', 'does', 'have', 'about',
    'nism', 'nismstudy'
  ]);
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 2 && !stopWords.has(token));
}

function splitIntoChunks(source, text) {
  const paragraphs = String(text || '')
    .replace(/\r\n/g, '\n')
    .split(/\n{2,}/)
    .map((item) => item.trim())
    .filter(Boolean);

  const chunks = [];
  let current = '';
  for (const paragraph of paragraphs) {
    if ((current + '\n\n' + paragraph).length > 1_100 && current) {
      chunks.push(current);
      current = paragraph;
    } else {
      current = current ? `${current}\n\n${paragraph}` : paragraph;
    }
  }
  if (current) chunks.push(current);

  return chunks.map((content, index) => ({
    source,
    index,
    content,
    tokens: tokenize(content)
  }));
}

async function loadKnowledge(force = false) {
  const now = Date.now();
  if (!force && knowledgeCache.chunks.length && now - knowledgeCache.loadedAt < 60_000) {
    return knowledgeCache;
  }

  const files = (await readdir(KNOWLEDGE_DIR))
    .filter((name) => /\.(md|txt)$/i.test(name))
    .sort();

  const chunks = [];
  for (const file of files) {
    const absolute = path.join(KNOWLEDGE_DIR, file);
    const text = await readFile(absolute, 'utf8');
    chunks.push(...splitIntoChunks(file, text));
  }

  knowledgeCache = { loadedAt: now, chunks, files };
  return knowledgeCache;
}

/* ------------------------------------------------- workbook search (a tool) */

// Built by server/build-workbook-index.py from the same chapter/section chunks
// the MCQ agent uses. Loaded once; it is a few MB and never changes at runtime.
let workbookIndex = null;

async function loadWorkbooks() {
  if (workbookIndex) return workbookIndex;
  const file = path.join(KNOWLEDGE_DIR, 'workbooks.jsonl');
  try {
    const raw = await readFile(file, 'utf8');
    workbookIndex = raw
      .split('\n')
      .filter(Boolean)
      .map((line) => {
        const row = JSON.parse(line);
        return { ...row, tokens: new Set(tokenize(`${row.section} ${row.text}`)) };
      });
    console.log(`Workbook index: ${workbookIndex.length} chunks`);
  } catch {
    console.warn('No workbooks.jsonl — run server/build-workbook-index.py');
    workbookIndex = [];
  }
  return workbookIndex;
}

async function searchWorkbook(query, exam = '') {
  const index = await loadWorkbooks();
  if (!index.length) {
    return { error: 'The workbook index has not been built on this server.' };
  }

  const wanted = tokenize(query);
  if (!wanted.length) return { results: [] };

  const rank = (needle) => {
    const out = [];
    for (const chunk of index) {
      if (needle && !chunk.exam.toLowerCase().includes(needle)) continue;
      let score = 0;
      for (const token of wanted) if (chunk.tokens.has(token)) score += 1;
      if (score) out.push({ chunk, score: score / wanted.length });
    }
    return out.sort((a, b) => b.score - a.score);
  };

  // The model guesses the `exam` argument, and it guesses wrong: asked what
  // dematerialisation means it searched "Equity Derivatives", where the term
  // barely appears, and then told the student no material existed. A filter
  // must never be able to turn a wrong guess into "nothing found", so a narrow
  // search that comes back empty is retried across every workbook.
  const examNeedle = exam.trim().toLowerCase();
  let scored = examNeedle ? rank(examNeedle) : rank('');
  let widened = false;
  if (examNeedle && !scored.length) {
    scored = rank('');
    widened = true;
  }

  // Three excerpts is the most a 3B model uses well, and every extra one costs
  // real seconds of prompt processing on a CPU.
  return {
    results: scored.slice(0, 3).map(({ chunk }) => ({
      exam: chunk.exam,
      chapter: `${chunk.chapter}. ${chunk.chapter_title}`,
      section: chunk.section || null,
      pages: chunk.pages,
      excerpt: chunk.text.slice(0, 900)
    })),
    ...(widened
      ? { note: `Nothing matched in "${exam}", so all workbooks were searched. `
               + 'Cite the exam named in each result, not the one you asked for.' }
      : {})
  };
}

function retrieveContext(question, knowledge) {
  const queryTokens = tokenize(question);
  if (!queryTokens.length) return knowledge.chunks.slice(0, 5);
  const querySet = new Set(queryTokens);

  const matches = knowledge.chunks
    .map((chunk) => {
      let score = 0;
      for (const token of chunk.tokens) {
        if (querySet.has(token)) score += 2;
        for (const query of querySet) {
          if (token.includes(query) || query.includes(token)) score += 0.5;
        }
      }
      return { ...chunk, score };
    })
    .filter((chunk) => chunk.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, CONTEXT_CHUNKS);

  return matches.length ? matches : knowledge.chunks.slice(0, CONTEXT_CHUNKS);
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  return history
    .filter((item) => ['user', 'assistant'].includes(item?.role) && item?.content)
    .slice(-8)
    .map((item) => ({
      role: item.role,
      content: String(item.content).slice(0, 900)
    }));
}

function buildMessages(question, history, contextChunks, signedIn) {
  const context = contextChunks
    .map((chunk, idx) => `Source ${idx + 1}: ${chunk.source}\n${chunk.content}`)
    .join('\n\n---\n\n');

  return [
    {
      role: 'system',
      content: [
        'You are the NISMSTUDY website assistant, helping students preparing for',
        "India's NISM certification exams.",
        '',
        'You have tools. Use them instead of guessing:',
        '- Anything about what is sold or what it costs -> list_courses.',
        '- Anything about a syllabus topic or what a term means -> search_workbook.',
        signedIn
          ? '- Anything about "my" access, expiry, scores or progress -> get_my_access or get_my_progress.'
          : '- The student is NOT signed in, so you cannot see their account. If they ask about their own access or scores, ask them to sign in first.',
        '',
        'Rules:',
        'Answer only from tool results, the NISMSTUDY context below, and the conversation.',
        'Never invent prices, availability, exam rules, passing marks, dates or regulatory facts.',
        'If a tool says an exam is not on sale, say so plainly rather than quoting a price for it.',
        'When you explain a syllabus topic from a workbook, name the exam and chapter you took it from.',
        'Do not claim affiliation with NISM, SEBI, NSE, NSE Academy, BSE or any regulator.',
        'For payment, refund or account problems you cannot resolve, point to info@nismstudy.in.',
        'Be concise: two or three short sentences unless asked for detail.',
        'Never output reasoning, analysis tags, or the raw JSON a tool returned.'
      ].join(' ')
    },
    ...history,
    {
      role: 'user',
      content: context
        ? `NISMSTUDY site information:\n${context}\n\nStudent question: ${question}`
        : `Student question: ${question}`
    }
  ];
}

async function callOllama(messages, tools = null) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        ...(tools && tools.length ? { tools } : {}),
        // Reasoning models (qwen3, deepseek-r1) otherwise emit hundreds of
        // thinking tokens before answering. Measured on CPU: 108s -> 13s.
        // Ignored by models that do not support it.
        think: OLLAMA_THINK,
        messages,
        options: {
          temperature: Number(process.env.OLLAMA_TEMPERATURE || 0.2),
          top_p: Number(process.env.OLLAMA_TOP_P || 0.9),
          num_ctx: Number(process.env.OLLAMA_NUM_CTX || 8192),
          num_thread: OLLAMA_NUM_THREAD,
          // Generation is the bottleneck on CPU, so keep answers short.
          num_predict: Number(process.env.OLLAMA_NUM_PREDICT || 260)
        },
        keep_alive: process.env.OLLAMA_KEEP_ALIVE || '10m'
      }),
      signal: controller.signal
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Ollama returned ${response.status}: ${text.slice(0, 300)}`);
    }

    const data = await response.json();
    // The whole message is returned, not just its text, because the caller
    // needs to see whether the model asked for a tool.
    return data?.message || { content: '' };
  } finally {
    clearTimeout(timeout);
  }
}

// Let the model call tools, feed the results back, and let it answer. Capped
// at MAX_TOOL_ROUNDS: an unbounded loop on a CPU is a hung request, and a 3B
// model will occasionally ask for the same tool forever.
async function runAgent(messages, tools, context) {
  const used = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round += 1) {
    const offer = round < MAX_TOOL_ROUNDS ? tools : null;
    const message = await callOllama(messages, offer);
    const calls = message.tool_calls || [];

    if (!calls.length) {
      return { answer: String(message.content || '').trim(), used };
    }

    messages.push(message);

    for (const call of calls) {
      const name = call?.function?.name;
      let args = call?.function?.arguments ?? {};
      if (typeof args === 'string') {
        try { args = JSON.parse(args); } catch { args = {}; }
      }

      let result;
      try {
        result = await runTool(name, args, context);
      } catch (error) {
        console.error(`tool ${name} failed:`, error.message);
        result = { error: 'That lookup failed. Suggest emailing info@nismstudy.in.' };
      }

      used.push(name);
      messages.push({
        role: 'tool',
        // Ollama echoes the name back on some versions and not others.
        name: name || 'tool',
        content: JSON.stringify(result).slice(0, 4_000)
      });
    }
  }

  // Out of rounds with no prose answer.
  const final = await callOllama(messages, null);
  return { answer: String(final.content || '').trim(), used };
}

async function handleChat(req, res, headers) {
  if (!checkRateLimit(req)) {
    return sendJson(res, 429, { error: 'Too many requests. Please try again shortly.' }, headers);
  }

  const body = await readRequestBody(req);
  const message = String(body.message || '').trim();
  if (message.length < 2) {
    return sendJson(res, 400, { error: 'Message is required.' }, headers);
  }
  if (message.length > 700) {
    return sendJson(res, 400, { error: 'Message is too long.' }, headers);
  }

  // The student's Supabase token, if their browser sent one. Personal tools
  // run AS this token, so row-level security decides what may be read — the
  // model is never trusted to scope a query to the right person.
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '') || null;

  const knowledge = await loadKnowledge();
  const contextChunks = retrieveContext(message, knowledge);
  const history = normalizeHistory(body.history);
  const tools = toolsFor(Boolean(token));

  const { answer, used } = await runAgent(
    buildMessages(message, history, contextChunks, Boolean(token)),
    tools,
    { token, searchWorkbook }
  );

  return sendJson(res, 200, {
    answer: answer || 'I could not put an answer together. Please email info@nismstudy.in.',
    model: OLLAMA_MODEL,
    tools_used: used,
    sources: [...new Set(contextChunks.map((chunk) => chunk.source))]
  }, headers);
}

const server = http.createServer(async (req, res) => {
  const headers = corsHeaders(req);

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);

    if (req.method === 'GET' && ['/health', '/api/chat/health'].includes(url.pathname)) {
      const knowledge = await loadKnowledge();
      return sendJson(res, 200, {
        ok: true,
        model: OLLAMA_MODEL,
        knowledgeFiles: knowledge.files
      }, headers);
    }

    if (req.method === 'POST' && url.pathname === '/api/chat') {
      return await handleChat(req, res, headers);
    }

    return sendJson(res, 404, { error: 'Not found.' }, headers);
  } catch (error) {
    const status = error.status || 500;
    console.error(error);
    return sendJson(res, status, {
      error: status === 500 ? 'Chat service failed.' : error.message
    }, headers);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`NISMSTUDY chat API listening on port ${PORT}`);
  console.log(`Using Ollama model ${OLLAMA_MODEL}`);
});
