"""LLM backend. Ollama is the one that runs on this machine; the interface is
kept small so another backend can be dropped in without touching the pipeline.

Two decisions here matter more than anything else, both learned by measuring
on the target box (Intel Ultra 5 125U, 14 threads, no GPU):

1. Use a NON-THINKING model. qwen3:4b spent 600 tokens reasoning in prose
   before answering `{"ok":true}` and still returned no JSON, at 3.0 tok/s.
   On a CPU every reasoning token is paid for in wall-clock minutes.

2. Constrain decoding with a JSON SCHEMA (Ollama's `format` field). This makes
   invalid JSON structurally impossible, which removes the retry-and-repair
   loop entirely — and a retry on this hardware costs minutes, not milliseconds.
"""

from __future__ import annotations

import json
import time
import urllib.error
import urllib.request

DEFAULT_HOST = "http://127.0.0.1:11434"
DEFAULT_MODEL = "qwen2.5:3b-instruct"

# The shape every generation call is forced to produce.
MCQ_SCHEMA = {
    "type": "object",
    "properties": {
        "questions": {
            "type": "array",
            "items": {
                "type": "object",
                "properties": {
                    "question": {"type": "string"},
                    "options": {
                        "type": "array",
                        "items": {"type": "string"},
                        "minItems": 4,
                        "maxItems": 4,
                    },
                    "correct": {"type": "string", "enum": ["A", "B", "C", "D"]},
                    "explanation": {"type": "string"},
                },
                "required": ["question", "options", "correct", "explanation"],
            },
        }
    },
    "required": ["questions"],
}


class OllamaError(RuntimeError):
    pass


def _default_threads() -> int:
    """Leave two threads for the rest of the machine, use the rest."""
    import os
    total = os.cpu_count() or 4
    return max(2, total - 2)


class Ollama:
    def __init__(self, model: str = DEFAULT_MODEL, host: str = DEFAULT_HOST,
                 temperature: float = 0.55, num_ctx: int = 4096,
                 timeout: int = 1800, num_thread: int | None = None):
        self.model = model
        self.host = host.rstrip("/")
        self.temperature = temperature
        self.num_ctx = num_ctx
        self.timeout = timeout
        # Ollama's default thread count is chosen from performance cores, which
        # on a hybrid Intel part (2 P + 10 E here) leaves most of the CPU idle —
        # observed at 191% of a possible 1400%. Set this explicitly.
        self.num_thread = num_thread or _default_threads()
        self.tokens_out = 0
        self.seconds = 0.0
        self.calls = 0

    def _post(self, path: str, body: dict) -> dict:
        req = urllib.request.Request(
            f"{self.host}{path}",
            data=json.dumps(body).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=self.timeout) as resp:
            return json.loads(resp.read().decode())

    def available(self) -> tuple[bool, str]:
        try:
            tags = self._post("/api/show", {"model": self.model})
        except urllib.error.HTTPError as exc:
            if exc.code == 404:
                return False, f"model {self.model!r} is not pulled — run: ollama pull {self.model}"
            return False, f"ollama returned HTTP {exc.code}"
        except Exception as exc:
            return False, f"cannot reach ollama at {self.host} ({exc}) — run: ollama serve"
        fam = (tags.get("details") or {}).get("family", "?")
        return True, f"{self.model} ready (family {fam})"

    def generate_mcqs(self, system: str, user: str, max_tokens: int = 1400,
                      retries: int = 2) -> list[dict]:
        """Return a list of MCQ dicts. Schema-constrained, so parsing is safe."""
        body = {
            "model": self.model,
            "messages": [
                {"role": "system", "content": system},
                {"role": "user", "content": user},
            ],
            "stream": False,
            "format": MCQ_SCHEMA,
            "options": {
                "temperature": self.temperature,
                "num_ctx": self.num_ctx,
                "num_predict": max_tokens,
                "repeat_penalty": 1.05,
                "num_thread": self.num_thread,
            },
        }

        last = ""
        for attempt in range(retries + 1):
            started = time.time()
            try:
                data = self._post("/api/chat", body)
            except Exception as exc:
                last = str(exc)
                if attempt == retries:
                    raise OllamaError(f"generation failed: {last}") from exc
                time.sleep(2 * (attempt + 1))
                continue

            self.calls += 1
            self.seconds += time.time() - started
            self.tokens_out += int(data.get("eval_count") or 0)

            content = (data.get("message") or {}).get("content", "")
            try:
                parsed = json.loads(content)
            except json.JSONDecodeError as exc:
                # Should be unreachable with a schema, but a truncated response
                # (num_predict hit mid-object) still lands here.
                last = f"invalid JSON: {exc}"
                if attempt == retries:
                    return []
                continue

            items = parsed.get("questions") if isinstance(parsed, dict) else parsed
            return items if isinstance(items, list) else []

        return []

    @property
    def rate(self) -> float:
        return self.tokens_out / self.seconds if self.seconds else 0.0
