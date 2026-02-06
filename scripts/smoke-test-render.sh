#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <base_url>"
  echo "Example: $0 https://empower-ckm-navigator.onrender.com"
  exit 1
fi

BASE_URL="${1%/}"
COOKIE_JAR="$(mktemp)"
SESSION_OUT="$(mktemp)"
CHAT_OUT="$(mktemp)"

cleanup() {
  rm -f "$COOKIE_JAR"
  rm -f "$SESSION_OUT"
  rm -f "$CHAT_OUT"
}
trap cleanup EXIT

echo "==> Health check"
HEALTH_JSON="$(curl -sS "$BASE_URL/api/health")"
echo "$HEALTH_JSON"

if ! printf '%s' "$HEALTH_JSON" | grep -q '"status"[[:space:]]*:[[:space:]]*"ok"'; then
  echo "Health check failed: expected status=ok"
  exit 1
fi

echo "==> Session init"
SESSION_STATUS="$(curl -sS -o "$SESSION_OUT" -w '%{http_code}' -X POST "$BASE_URL/api/session/init" -c "$COOKIE_JAR")"
cat "$SESSION_OUT"
if [[ "$SESSION_STATUS" != "200" ]]; then
  echo "Session init failed with HTTP $SESSION_STATUS"
  exit 1
fi

echo "==> Rate limit"
RATE_JSON="$(curl -sS "$BASE_URL/api/rate-limit" -b "$COOKIE_JAR")"
echo "$RATE_JSON"
if ! printf '%s' "$RATE_JSON" | grep -q '"limit"'; then
  echo "Rate limit endpoint missing expected fields"
  exit 1
fi

echo "==> Chat endpoint sanity"
CHAT_STATUS="$(curl -sS -o "$CHAT_OUT" -w '%{http_code}' -X POST "$BASE_URL/api/chat" \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -d '{"query":"What is CKM health?","context":"Educational content sample","language":"en"}')"
cat "$CHAT_OUT"

if [[ "$CHAT_STATUS" != "200" && "$CHAT_STATUS" != "503" ]]; then
  echo "Unexpected chat status: $CHAT_STATUS (expected 200 or 503 fallback)"
  exit 1
fi

echo "Smoke test passed for $BASE_URL"
