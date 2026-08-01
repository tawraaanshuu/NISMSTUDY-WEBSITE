#!/usr/bin/env bash
# Deploy the payment functions, set their secrets, and take the ready courses live.
#
# Everything here is idempotent — running it twice is safe.
#
# Secrets are read from a file, never from the command line, so they do not end
# up in your shell history or in `ps` output while the script runs.
#
#   cp tools/secrets.env.example tools/secrets.env    # then fill it in
#   chmod 600 tools/secrets.env
#   bash tools/deploy.sh
#
# tools/secrets.env is git-ignored. Nothing in it is ever printed.

set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO="$(dirname "$HERE")"
ENV_FILE="${SECRETS_FILE:-$HERE/secrets.env}"
PROJECT_REF="${PROJECT_REF:-yzmctktxzpzdfhdubwjs}"

if [[ ! -f "$ENV_FILE" ]]; then
  echo "No secrets file at $ENV_FILE"
  echo "Copy tools/secrets.env.example to tools/secrets.env and fill it in."
  exit 1
fi

# shellcheck disable=SC1090
set -a; source "$ENV_FILE"; set +a

need() {
  if [[ -z "${!1:-}" ]]; then
    echo "Missing $1 in $ENV_FILE"
    exit 1
  fi
}
need SUPABASE_ACCESS_TOKEN
need RAZORPAY_KEY_ID
need RAZORPAY_KEY_SECRET
need RAZORPAY_WEBHOOK_SECRET

SUPA=(npx -y supabase@latest)
export SUPABASE_ACCESS_TOKEN

echo "==> 1/4  Deploying Edge Functions"
cd "$REPO"
# The webhook must NOT verify a Supabase JWT: Razorpay does not send one, and
# its HMAC signature is what authenticates the request.
"${SUPA[@]}" functions deploy razorpay-create-order --project-ref "$PROJECT_REF"
"${SUPA[@]}" functions deploy razorpay-webhook      --project-ref "$PROJECT_REF" --no-verify-jwt

echo "==> 2/4  Setting function secrets"
"${SUPA[@]}" secrets set --project-ref "$PROJECT_REF" \
  "RAZORPAY_KEY_ID=$RAZORPAY_KEY_ID" \
  "RAZORPAY_KEY_SECRET=$RAZORPAY_KEY_SECRET" \
  "RAZORPAY_WEBHOOK_SECRET=$RAZORPAY_WEBHOOK_SECRET" >/dev/null
echo "    3 secrets set (values not shown)"

echo "==> 3/4  Running supabase/fix_2026-08-01.sql"
python3 - <<'PY'
import json, os, urllib.request

ref = os.environ.get("PROJECT_REF", "yzmctktxzpzdfhdubwjs")
token = os.environ["SUPABASE_ACCESS_TOKEN"]
sql = open("supabase/fix_2026-08-01.sql").read()

req = urllib.request.Request(
    f"https://api.supabase.com/v1/projects/{ref}/database/query",
    data=json.dumps({"query": sql}).encode(),
    headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
)
try:
    body = urllib.request.urlopen(req, timeout=120).read().decode()
except urllib.error.HTTPError as exc:
    print("    FAILED:", exc.read().decode()[:400])
    raise SystemExit(1)

try:
    rows = json.loads(body)
except json.JSONDecodeError:
    rows = []

if isinstance(rows, list) and rows and isinstance(rows[0], dict):
    print(f"    {'exam':52} {'live':>5} {'price':>6} {'days':>5} {'questions':>10}")
    for r in rows:
        print(f"    {str(r.get('title'))[:50]:52} {str(r.get('is_live')):>5} "
              f"{r.get('price_inr'):>6} {r.get('access_days'):>5} {r.get('questions'):>10}")
else:
    print("    applied")
PY

echo "==> 4/4  Re-enabling the buy button in config.js"
cd "$REPO"
python3 - <<'PY'
import re
src = open("config.js").read()
if "functionsUrl: ''" in src:
    src = src.replace(
        "  functionsUrl: '',",
        "  functionsUrl: 'https://yzmctktxzpzdfhdubwjs.supabase.co/functions/v1',")
    open("config.js", "w").write(src)
    print("    enabled — commit and push to deploy")
else:
    print("    already enabled")
PY

echo
echo "Done. Remaining manual step: add the Razorpay webhook."
echo "  Razorpay Dashboard -> Settings -> Webhooks -> Add"
echo "  URL:    https://$PROJECT_REF.supabase.co/functions/v1/razorpay-webhook"
echo "  Secret: the same RAZORPAY_WEBHOOK_SECRET from your secrets file"
echo "  Events: payment.captured, order.paid, payment.failed"
