/**
 * Full Browserbase Agent runner (server-side).
 * POST { "task": "..." } → creates run, polls until done, returns result.
 * Env: BROWSERBASE_API_KEY, optional BROWSERBASE_PROJECT_ID
 */
const BB = "https://api.browserbase.com/v1";

function headers(key) {
  const h = {
    "Content-Type": "application/json",
    "X-BB-API-Key": key,
    "x-bb-api-key": key,
  };
  if (process.env.BROWSERBASE_PROJECT_ID) {
    h["x-bb-project-id"] = process.env.BROWSERBASE_PROJECT_ID;
  }
  return h;
}

async function bb(path, key, opts = {}) {
  const res = await fetch(`${BB}${path}`, {
    ...opts,
    headers: { ...headers(key), ...(opts.headers || {}) },
  });
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { ok: res.ok, status: res.status, data };
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractResult(run, messages) {
  if (!run) return null;
  const r = run.result ?? run.output ?? run.response;
  if (typeof r === "string" && r.trim()) return r;
  if (r && typeof r === "object") {
    if (r.summary) return r.summary;
    try { return JSON.stringify(r, null, 2); } catch { /* */ }
  }
  if (Array.isArray(messages)) {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i]?.message || messages[i];
      const content = m?.content;
      if (typeof content === "string" && content.trim()) return content;
      if (Array.isArray(content)) {
        const text = content.filter((p) => p?.type === "text" && p.text).map((p) => p.text).join("\n");
        if (text.trim()) return text;
      }
    }
  }
  return null;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.BROWSERBASE_API_KEY;
  if (!key) {
    return res.status(500).json({
      error: "BROWSERBASE_API_KEY not set",
      hint: "Add it in Vercel → Project → Settings → Environment Variables",
    });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { return res.status(400).json({ error: "Invalid JSON" }); }
  }
  const task = (body?.task || body?.prompt || "").trim();
  if (!task) return res.status(400).json({ error: "Missing task" });

  const createBody = {
    task,
    browserSettings: {
      proxies: body?.proxies !== false,
    },
  };
  if (process.env.BROWSERBASE_PROJECT_ID) {
    createBody.projectId = process.env.BROWSERBASE_PROJECT_ID;
  }

  const created = await bb("/agents/runs", key, {
    method: "POST",
    body: JSON.stringify(createBody),
  });

  if (!created.ok) {
    return res.status(created.status).json({
      error: "Browserbase rejected agent run",
      status: created.status,
      detail: created.data,
      hint:
        created.status === 401
          ? "API key invalid — copy a fresh key from browserbase.com dashboard"
          : created.status === 402 || created.status === 403
            ? "Plan/credits issue — check Browserbase billing"
            : "See detail",
    });
  }

  const runId =
    created.data.runId ||
    created.data.run_id ||
    created.data.id;
  const agentId =
    created.data.agentId ||
    created.data.agent_id;

  if (!runId) {
    return res.status(502).json({ error: "No runId in Browserbase response", detail: created.data });
  }

  const terminal = new Set(["COMPLETED", "FAILED", "TIMED_OUT", "STOPPED", "ERROR"]);
  let status = "PENDING";
  let run = created.data;
  let messages = [];
  const maxPolls = Math.min(Number(body?.maxPolls) || 60, 90);

  for (let i = 0; i < maxPolls; i++) {
    await sleep(1500);
    const got = await bb(`/agents/runs/${runId}`, key, { method: "GET" });
    if (got.ok) {
      run = got.data;
      status = String(run.status || status).toUpperCase();
    }
    const msg = await bb(`/agents/runs/${runId}/messages?limit=50`, key, { method: "GET" });
    if (msg.ok) {
      messages = Array.isArray(msg.data) ? msg.data : (msg.data?.data || msg.data?.messages || []);
    }
    if (terminal.has(status)) break;
  }

  const ok = status === "COMPLETED";
  const result = extractResult(run, messages);
  const sessionId = run.sessionId || run.session_id || null;

  let liveUrl = null;
  if (sessionId) {
    const dbg = await bb(`/sessions/${sessionId}/debug`, key, { method: "GET" });
    if (dbg.ok) {
      liveUrl =
        dbg.data.debuggerFullscreenUrl ||
        dbg.data.debuggerUrl ||
        dbg.data.pages?.[0]?.debuggerFullscreenUrl ||
        null;
    }
  }

  return res.status(ok ? 200 : 422).json({
    ok,
    status,
    runId,
    agentId: agentId || null,
    sessionId,
    liveUrl,
    result: result || (ok ? "Task finished (no text result)." : `Agent ended with status ${status}`),
    messageCount: messages.length,
  });
}
