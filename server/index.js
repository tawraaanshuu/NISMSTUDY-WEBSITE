import http from 'node:http';
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const PORT = Number(process.env.PORT || 8787);
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'qwen3:14b';
const OLLAMA_THINK = process.env.OLLAMA_THINK === 'true';
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
    'Access-Control-Allow-Headers': 'Content-Type',
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

function buildMessages(question, history, contextChunks) {
  const context = contextChunks
    .map((chunk, idx) => `Source ${idx + 1}: ${chunk.source}\n${chunk.content}`)
    .join('\n\n---\n\n');

  return [
    {
      role: 'system',
      content: [
        'You are the NISMSTUDY website assistant.',
        'Answer only from the provided NISMSTUDY context and the visible conversation.',
        'Be concise, practical, and student-friendly.',
        'Do not claim affiliation with NISM, SEBI, NSE, NSE Academy, BSE, or any regulator.',
        'If the context does not contain the answer, say you do not have enough information and ask the user to email info@nismstudy.in.',
        'For payment, login, access, refund, or account-specific issues, direct the user to info@nismstudy.in.',
        'Never invent course availability, prices, exam rules, passing marks, dates, or regulatory facts.',
        'Do not include hidden reasoning, chain-of-thought, or analysis tags in the final answer.'
      ].join(' ')
    },
    ...history,
    {
      role: 'user',
      content: `NISMSTUDY context:\n${context || 'No matching context was found.'}\n\nUser question: ${question}`
    }
  ];
}

async function callOllama(messages) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        stream: false,
        // Reasoning models (qwen3, deepseek-r1) otherwise emit hundreds of
        // thinking tokens before answering. Measured on CPU: 108s -> 13s.
        // Ignored by models that do not support it.
        think: OLLAMA_THINK,
        messages,
        options: {
          temperature: Number(process.env.OLLAMA_TEMPERATURE || 0.2),
          top_p: Number(process.env.OLLAMA_TOP_P || 0.9),
          num_ctx: Number(process.env.OLLAMA_NUM_CTX || 8192),
          // Generation is the bottleneck on CPU: every token costs ~0.4s on a
          // 14B model, so 420 tokens alone is ~3 minutes. Keep answers short.
          num_predict: Number(process.env.OLLAMA_NUM_PREDICT || 220)
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
    return String(data?.message?.content || '').trim();
  } finally {
    clearTimeout(timeout);
  }
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

  const knowledge = await loadKnowledge();
  const contextChunks = retrieveContext(message, knowledge);
  const history = normalizeHistory(body.history);
  const answer = await callOllama(buildMessages(message, history, contextChunks));

  return sendJson(res, 200, {
    answer,
    model: OLLAMA_MODEL,
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
