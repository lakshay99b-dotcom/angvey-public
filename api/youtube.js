/**
 * Proxies YouTube Data API v3 search. Key stays on server (YOUTUBE_API_KEY).
 */
export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    return res.status(500).json({ error: "YOUTUBE_API_KEY not configured" });
  }

  const q = (req.query.q || "").toString();
  const maxResults = (req.query.maxResults || "5").toString();
  if (!q) return res.status(400).json({ error: "Missing q" });

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("key", key);
  url.searchParams.set("q", q);
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("maxResults", maxResults);
  url.searchParams.set("safeSearch", "moderate");

  const upstream = await fetch(url.toString());
  const data = await upstream.text();
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Content-Type", upstream.headers.get("content-type") || "application/json");
  res.status(upstream.status).send(data);
}
