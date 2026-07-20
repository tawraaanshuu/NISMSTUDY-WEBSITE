# NISMSTUDY Ollama Chat API

Production API for the NISMSTUDY chat widget. The browser calls this service, and this service calls Ollama locally.

## Local Run

```sh
cd server
npm start
```

Defaults:

```sh
PORT=8787
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:14b
```

Test:

```sh
curl http://127.0.0.1:8787/health
curl -X POST http://127.0.0.1:8787/api/chat \
  -H 'Content-Type: application/json' \
  -d '{"message":"How long do I get access?"}'
```

## Production Shape

Use a VPS for `api.nismstudy.in`:

1. Install Ollama on the VPS.
2. Pull the model: `ollama pull qwen3:14b`.
3. Run Ollama bound to localhost only.
4. Run this API with systemd or Docker.
5. Put Nginx or Caddy in front of it with HTTPS.
6. Point `api.nismstudy.in` DNS to the VPS.
7. Keep Cloudflare Pages serving `nismstudy.in`.

Do not expose Ollama port `11434` to the public internet. Only this API should be public.

## Environment

```sh
PORT=8787
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=qwen3:14b
ALLOWED_ORIGINS=https://nismstudy.in,https://www.nismstudy.in
RATE_LIMIT_MAX=20
RATE_LIMIT_WINDOW_MS=60000
REQUEST_TIMEOUT_MS=120000
```

## Knowledge Base

Edit files in `server/knowledge/`. Use simple Markdown sections. The API reloads knowledge files roughly once per minute.

The current implementation uses dependency-free lexical retrieval. For a larger knowledge base, upgrade this layer to embeddings and a vector database, but keep the same `/api/chat` contract for the frontend.
