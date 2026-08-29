/**
 * Browserbase pass-through proxy.
 * /api/bb/:path* → https://api.browserbase.com/v1/:path*
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-BB-API-Key");
    return res.status(204).end();
  }

  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: "BROWSERBASE_API_KEY not configured on Vercel",
      hint: "Dashboard → Settings → API Key",
    });
  }

  let rel = (req.query.p || req.query.path || "").toString();
  if (Array.isArray(req.query.p)) rel = req.query.p.join("/");
  rel = rel.replace(/^\/+/, "");

  const incoming = new URL(req.url, "http://localhost");
  incoming.searchParams.delete("p");
  incoming.searchParams.delete("path");
  const qs = incoming.searchParams.toString();

  const base = (process.env.BROWSERBASE_API_BASE || "https://api.browserbase.com/v1").replace(/\/$/, "");
  const target = `${base}/${rel}${qs ? `?${qs}` : ""}`;

  const headers = {
    "Content-Type": "application/json",
    "X-BB-API-Key": key,
    "x-bb-api-key": key,
  };
  if (process.env.BROWSERBASE_PROJECT_ID) {
    headers["x-bb-project-id"] = process.env.BROWSERBASE_PROJECT_ID;
  }

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    let raw = req.body;
    if (raw && typeof raw === "object") {
      if (rel === "sessions" && process.env.BROWSERBASE_PROJECT_ID && !raw.projectId) {
        raw = { ...raw, projectId: process.env.BROWSERBASE_PROJECT_ID };
      }
      if (rel === "agents/runs" || rel.startsWith("agents/runs")) {
        if (!raw.browserSettings) {
          raw = { ...raw, browserSettings: { proxies: true } };
        }
        if (process.env.BROWSERBASE_PROJECT_ID && !raw.projectId) {
          raw = { ...raw, projectId: process.env.BROWSERBASE_PROJECT_ID };
        }
      }
      body = JSON.stringify(raw);
    } else if (typeof raw === "string") {
      body = raw;
    } else {
      body = "{}";
    }
  }

  try {
    const upstream = await fetch(target, { method: req.method, headers, body });
    const text = await upstream.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    return res.status(upstream.status).send(text);
  } catch (err) {
    return res.status(502).json({
      error: "Browserbase proxy failed",
      message: String(err.message || err),
      target,
    });
  }
}
