/**
 * Proxies Tavily web search. Key stays on server (TAVILY_API_KEY).
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.TAVILY_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "TAVILY_API_KEY not configured" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }
  if (!body || typeof body !== "object") {
    return res.status(400).json({ error: "Missing body" });
  }

  const payload = {
    api_key: key,
    query: body.query || "",
    search_depth: body.search_depth || "advanced",
    max_results: body.max_results || 6,
    include_answer: body.include_answer !== false,
  };

  const upstream = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await upstream.text();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
  res.status(upstream.status).send(data);
}
