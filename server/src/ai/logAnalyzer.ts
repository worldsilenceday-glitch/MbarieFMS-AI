// server/src/ai/logAnalyzer.ts
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import { notifyBoth } from "../utils/notify";

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const logsPath = process.env.LOG_FILE_PATH || path.join(__dirname, "../../logs/app.log");
const client = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

function readRecentLogs(maxBytes = 200 * 1024) {
  try {
    const stats = fs.statSync(logsPath);
    const start = Math.max(0, stats.size - maxBytes);
    const fd = fs.openSync(logsPath, "r");
    const buf = Buffer.alloc(Math.min(maxBytes, stats.size));
    fs.readSync(fd, buf, 0, buf.length, start);
    fs.closeSync(fd);
    return buf.toString("utf8");
  } catch (err: any) {
    return `Unable to read log file: ${err?.message || err}`;
  }
}

export async function analyzeLogsAndNotify() {
  const logSnippet = readRecentLogs();
  if (!client) {
    const fallback = `OpenAI key missing. Log excerpt:\n\n${logSnippet.slice(0, 2000)}`;
    await notifyBoth("Log Analyzer: OpenAI key missing", fallback);
    return;
  }

  const prompt = `You are an operations AI. Summarize the following server logs, highlight any errors, unusual spikes, or repeated stack traces, and give 3 prioritized remediation steps. Also provide a confidence number between 0 and 1.\n\nLogs:\n${logSnippet}`;

  try {
    const res = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
    });

    const summary = res?.choices?.[0]?.message?.content || "No summary returned";
    await notifyBoth("Daily Log Analysis", summary);
  } catch (err: any) {
    await notifyBoth("Log Analyzer Error", `Failed to analyze logs: ${err.message || String(err)}`);
  }
}
