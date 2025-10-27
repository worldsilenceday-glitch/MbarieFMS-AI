// server/src/routes/health.ts
import express from "express";
import { notifyBoth } from "../utils/notify";

const router = express.Router();

router.get("/status", async (req, res) => {
  const now = new Date().toISOString();
  const payload = {
    frontend: process.env.FRONTEND_URL ? "Configured" : "Not configured",
    backend: "OK",
    database: process.env.DATABASE_URL ? "Configured" : "Not configured",
    notifications: process.env.NOTIFY_WEBHOOK_URL ? "Configured" : "Not configured",
    aiAgents: process.env.OPENAI_API_KEY ? "Enabled" : "Disabled",
    timestamp: now,
  };
  res.json(payload);
});

router.get("/health", (req, res) => res.send("ok"));

router.post("/notify-test", async (req, res) => {
  const { title = "Test Notification", message = "This is a test from Mbarie FMS monitor" } = req.body || {};
  try {
    await notifyBoth(title, message);
    res.json({ ok: true, sent: true });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err.message || String(err) });
  }
});

export default router;
