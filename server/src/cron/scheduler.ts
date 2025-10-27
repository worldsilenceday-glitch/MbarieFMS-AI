// server/src/cron/scheduler.ts
import cron from "node-cron";
import { analyzeLogsAndNotify } from "../ai/logAnalyzer";
import { runHealthChecks } from "../utils/systemHealth";
import { notifyBoth } from "../utils/notify";

const FRONTEND_URL = process.env.FRONTEND_URL || process.env.VITE_SERVER_URL || "";
const BACKEND_URL = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || "3001"}`;

export function startScheduler() {
  const scheduleExpr = process.env.MONITOR_CRON || "0 6 * * *"; // default daily at 06:00
  cron.schedule(scheduleExpr, async () => {
    const runAt = new Date().toISOString();
    try {
      await notifyBoth("Scheduler Run Started", `Running scheduled health checks: ${runAt}`);
      const health = await runHealthChecks({
        frontend: FRONTEND_URL,
        backend: `${BACKEND_URL}/api/system/status`,
        aiTestEndpoint: `${BACKEND_URL}/api/ai/test`,
      });
      await notifyBoth("Scheduled Health Results", JSON.stringify(health, null, 2));
      await analyzeLogsAndNotify();
      await notifyBoth("Scheduler Run Completed", `Run completed at ${new Date().toISOString()}`);
    } catch (err: any) {
      await notifyBoth("Scheduler Error", `Scheduler failed: ${err.message || String(err)}`);
    }
  });

  console.log(`[monitor] Scheduler started with cron expression: ${scheduleExpr}`);
}
