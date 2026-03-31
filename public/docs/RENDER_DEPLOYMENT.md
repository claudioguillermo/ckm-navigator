# Render Deployment Runbook (Single-Service)

This runbook deploys the app as one Render Web Service so collaborators can use one URL for both frontend and API.

## 1) Prerequisites

- Repository is available on GitHub/GitLab.
- `server.js` and `package.json` are in the repo root.
- Node.js engine is `>=18` (already set in `package.json`).

## 2) Create Render service

1. In Render, click **New +** -> **Web Service**.
2. Connect your repo.
3. Use these settings:
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Auto-Deploy: `On`
4. Select a Starter/Free plan for initial collaborator testing.

Optional: if you use Render Blueprint, deploy using `render.yaml` from this repository.

## 3) Environment variables

Set these in Render service settings:

- `NODE_ENV=production`
- `SESSION_COOKIE_SAMESITE=lax`
- `SESSION_SECRET=<strong random secret (32+ bytes)>`
- `QWEN_API_KEY=<real key>`
- `ALLOWED_ORIGINS=https://<your-service>.onrender.com`

Notes:
- `PORT` is provided by Render automatically. Keep app behavior as `process.env.PORT`.
- Do not put any secrets in client-side JS or committed files.

## 4) CORS/origin hardening

After first deploy, copy the exact Render URL and set:

- `ALLOWED_ORIGINS=https://<exact-render-host>.onrender.com`

Redeploy after saving env vars.

## 5) Smoke test checklist

Replace `<base_url>` with your Render URL.

### API health

```bash
curl -sS <base_url>/api/health
```

Expected:
- JSON response with `"status":"ok"`

### Session init + rate limit status

```bash
curl -i -X POST <base_url>/api/session/init -c cookies.txt
curl -sS <base_url>/api/rate-limit -b cookies.txt
```

Expected:
- Session init returns 200 and sets cookie.
- Rate limit returns `limit`, `remaining`, and `resetTime`.

### Chat fallback behavior when key missing

If `QWEN_API_KEY` is not set, chat endpoint should return fallback-compatible response instead of crashing UI.

```bash
curl -i -X POST <base_url>/api/chat \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"query":"What is CKM?","context":"educational context","language":"en"}'
```

Expected:
- Non-500 behavior for missing key (`503` fallback response).

### Browser checks

- Open app URL in Chrome and Safari.
- Navigate Home/Curriculum/Clinic.
- Open chat sidebar and send a test message.
- Verify no repeated session-init errors in console.

## 6) Collaborator feedback workflow

Share this script with collaborators:

1. Open `<base_url>`.
2. Complete one module.
3. Ask one chatbot question.
4. File feedback with:
   - Browser/device
   - Page/feature
   - Repro steps
   - Expected vs actual
   - Screenshot

Use GitHub Issue template: `Collaborator Feedback`.

## 7) Safe iteration model

- Keep auto-deploy enabled on `main` for quick fixes.
- For risky changes, use a branch-based preview service first.
- Keep a simple changelog note for each collaborator-visible fix.
