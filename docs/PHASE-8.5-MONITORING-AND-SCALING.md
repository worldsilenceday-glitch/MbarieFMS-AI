# Phase 8.5 — Monitoring & Scaling (Mbarie FMS AI)

## Purpose
Add continuous monitoring, automated analysis, and self-healing escalation to Mbarie FMS AI.

## Files added
- server/src/routes/health.ts
- server/src/utils/notify.ts
- server/src/utils/systemHealth.ts
- server/src/ai/logAnalyzer.ts
- server/src/cron/scheduler.ts
- .github/workflows/verify-deploy.yml

## Env vars to set (Railway / Netlify / GitHub secrets)
OPENAI_API_KEY
NOTIFY_WEBHOOK_URL
ADMIN_EMAIL
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASS
FRONTEND_URL
BACKEND_URL
MONITOR_CRON  (ex: "0 6 * * *" for daily at 06:00)

## Local test steps
1. Install deps:
   ```bash
   cd server
   npm install axios node-cron nodemailer openai
   ```

2. Add env vars to `server/.env` (local dev).

3. Start server:

   ```bash
   npm run dev   # from server
   ```

4. Hit endpoints:

   * `GET http://localhost:3001/api/system/status`
   * `GET http://localhost:3001/api/system/health`
   * `POST http://localhost:3001/api/system/notify-test` with optional body `{ "title":"x","message":"y" }`

## Notes

* If Railway does not allow background workers, configure the scheduler as a separate Railway worker service or use GitHub Actions cron to call the health endpoints.
* For large log files, consider rotating logs or using a managed logging service.
