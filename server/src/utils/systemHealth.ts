// server/src/utils/systemHealth.ts
import axios from "axios";

export async function checkUrl(url: string, timeout = 7000) {
  try {
    const res = await axios.get(url, { timeout });
    return { ok: true, status: res.status, data: typeof res.data === "string" ? res.data.slice(0, 300) : res.data };
  } catch (err: any) {
    return { ok: false, error: err.message || String(err) };
  }
}

export async function runHealthChecks(config: { frontend?: string; backend?: string; aiTestEndpoint?: string }) {
  const results: any = {};
  if (config.frontend) results.frontend = await checkUrl(config.frontend);
  if (config.backend) results.backend = await checkUrl(config.backend);
  if (config.aiTestEndpoint) {
    try {
      const r = await axios.post(config.aiTestEndpoint, { message: "health-check" }, { timeout: 8000 });
      results.ai = { ok: true, status: r.status, data: r.data };
    } catch (err: any) {
      results.ai = { ok: false, error: err.message || String(err) };
    }
  }
  return results;
}
