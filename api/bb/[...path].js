/**
 * Proxies Browserbase agent API calls.
 * Env: BROWSERBASE_API_KEY, BROWSERBASE_PROJECT_ID (optional)
 *
 * Client calls /api/bb/agents/runs etc. — we forward to Browserbase
 * with the secret key attached.
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    return res.status(204).end();
  }

  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "BROWSERBASE_API_KEY not configured" });
  }

  const pathParts = req.query.path;
  const rel = Array.isArray(pathParts) ? pathParts.join("/") : (pathParts || "");
  // Prefer official Browserbase API base; agents paths vary by product version
  const base = process.env.BROWSERBASE_API_BASE || "https://www.browserbase.com/v1";
  const target = `${base.replace(/\/$/, "")}/${rel}${req.url.includes("?") ? "?" + req.url.split("?")[1] : ""}`;

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${key}`,
    "x-bb-api-key": key,
  };
  if (process.env.BROWSERBASE_PROJECT_ID) {
    headers["x-bb-project-id"] = process.env.BROWSERBASE_PROJECT_ID;
  }

  let body;
  if (req.method !== "GET" && req.method !== "HEAD") {
    body = typeof req.body === "string" ? req.body : JSON.stringify(req.body || {});
  }

  try {
    const upstream = await fetch(target, {
      method: req.method,
      headers,
      body,
    });
    const text = await upstream.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
    res.status(upstream.status).send(text);
  } catch (err) {
    res.status(502).json({ error: "Browserbase proxy failed", message: String(err.message || err) });
  }
}
