/**
 * GET /api/bb-status — does not expose the key.
 * Returns whether Browserbase credentials work.
 */
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(204).end();

  const key = process.env.BROWSERBASE_API_KEY;
  const projectId = process.env.BROWSERBASE_PROJECT_ID || null;

  if (!key) {
    return res.status(200).json({
      configured: false,
      valid: false,
      message: "BROWSERBASE_API_KEY missing in Vercel env",
    });
  }

  try {
    const r = await fetch("https://api.browserbase.com/v1/sessions?status=COMPLETED", {
      headers: {
        "X-BB-API-Key": key,
        "x-bb-api-key": key,
        ...(projectId ? { "x-bb-project-id": projectId } : {}),
      },
    });
    const text = await r.text();

    if (r.status === 401 || r.status === 403) {
      return res.status(200).json({
        configured: true,
        valid: false,
        status: r.status,
        message: "Key rejected by Browserbase — paste a fresh API key from the dashboard",
        projectIdSet: Boolean(projectId),
      });
    }

    return res.status(200).json({
      configured: true,
      valid: r.ok || r.status === 200,
      status: r.status,
      message: r.ok ? "Browserbase credentials OK — full agent mode available" : "Unexpected response",
      projectIdSet: Boolean(projectId),
    });
  } catch (e) {
    return res.status(200).json({
      configured: true,
      valid: false,
      message: String(e.message || e),
    });
  }
}
