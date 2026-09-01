/**
 * Deep Research — free academic sources (no paid API keys).
 * Sources: arXiv (official API) + Semantic Scholar (free).
 * POST { "topic": "..." } → { papers: [...], ctx: "markdown context" }
 */
function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseArxivAtom(xml) {
  const entries = [];
  const parts = xml.split("<entry>").slice(1);
  for (const part of parts) {
    const get = (tag) => {
      const m = part.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
      return m ? stripHtml(m[1]) : "";
    };
    const id = get("id");
    const title = get("title");
    const summary = get("summary");
    const published = get("published").slice(0, 10);
    const authors = [];
    const authorBlocks = part.split("<author>").slice(1);
    for (const ab of authorBlocks) {
      const nm = ab.match(/<name>([\s\S]*?)<\/name>/i);
      if (nm) authors.push(stripHtml(nm[1]));
    }
    let pdf = "";
    const linkMatch =
      part.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/i) ||
      part.match(/<link[^>]*href="([^"]+)"[^>]*title="pdf"/i) ||
      part.match(/<link[^>]*rel="alternate"[^>]*href="([^"]+)"/i);
    if (linkMatch) pdf = linkMatch[1];
    const absUrl = id || pdf;
    if (title) {
      entries.push({
        title,
        authors: authors.slice(0, 8),
        year: published ? published.slice(0, 4) : "",
        date: published,
        abstract: summary.slice(0, 1400),
        url: absUrl,
        pdf: pdf || null,
        source: "arXiv",
      });
    }
  }
  return entries;
}

async function searchArxiv(topic, max = 8) {
  const q = encodeURIComponent(`all:${topic}`);
  const url = `https://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=${max}&sortBy=relevance&sortOrder=descending`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "ANGVEY-DeepResearch/1.0 (research; +https://angvey-public.vercel.app)",
    },
  });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseArxivAtom(xml);
}

async function searchSemanticScholar(topic, max = 8) {
  const q = encodeURIComponent(topic);
  const fields =
    "title,abstract,year,authors,url,externalIds,venue,citationCount";
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${q}&limit=${max}&fields=${fields}`;
  const res = await fetch(url, {
    headers: { "User-Agent": "ANGVEY-DeepResearch/1.0" },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const papers = Array.isArray(data.data) ? data.data : [];
  return papers
    .filter((p) => p && p.title)
    .map((p) => {
      const authors = (p.authors || [])
        .map((a) => a.name)
        .filter(Boolean)
        .slice(0, 8);
      const arxivId = p.externalIds?.ArXiv;
      const url =
        p.url ||
        (arxivId ? `https://arxiv.org/abs/${arxivId}` : null) ||
        (p.externalIds?.DOI
          ? `https://doi.org/${p.externalIds.DOI}`
          : null) ||
        "";
      return {
        title: p.title,
        authors,
        year: p.year ? String(p.year) : "",
        date: p.year ? String(p.year) : "",
        abstract: (p.abstract || "").slice(0, 1400),
        url,
        pdf: arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null,
        venue: p.venue || "",
        citations: p.citationCount ?? null,
        source: "Semantic Scholar",
      };
    });
}

function dedupePapers(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = (p.title || "")
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "")
      .slice(0, 80);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function buildContext(topic, papers) {
  let ctx = `DEEP RESEARCH MODE — answer ONLY from the papers below.\n`;
  ctx += `Topic: "${topic}"\n`;
  ctx += `Rules: Cite as [1],[2],… Do not invent papers. If coverage is thin, say so. Use $...$ / $$...$$ for math.\n\n`;
  if (!papers.length) {
    ctx += "No academic papers found for this topic.\n";
    return ctx;
  }
  papers.forEach((p, i) => {
    ctx += `--- [${i + 1}] ${p.source} ---\n`;
    ctx += `Title: ${p.title}\n`;
    if (p.authors?.length) ctx += `Authors: ${p.authors.join(", ")}\n`;
    if (p.year) ctx += `Year: ${p.year}\n`;
    if (p.venue) ctx += `Venue: ${p.venue}\n`;
    if (p.citations != null) ctx += `Citations: ${p.citations}\n`;
    if (p.url) ctx += `URL: ${p.url}\n`;
    if (p.abstract) ctx += `Abstract: ${p.abstract}\n`;
    ctx += `\n`;
  });
  return ctx;
}

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: "Invalid JSON" });
    }
  }
  const topic = (body?.topic || body?.query || "").trim();
  if (!topic) return res.status(400).json({ error: "Missing topic" });
  if (topic.length > 300) return res.status(400).json({ error: "Topic too long" });

  try {
    const [arxiv, s2] = await Promise.all([
      searchArxiv(topic, 8).catch(() => []),
      searchSemanticScholar(topic, 8).catch(() => []),
    ]);

    const papers = dedupePapers([...arxiv, ...s2]).slice(0, 12);
    const ctx = buildContext(topic, papers);

    return res.status(200).json({
      ok: true,
      topic,
      count: papers.length,
      papers,
      ctx,
      sources: {
        arxiv: arxiv.length,
        semanticScholar: s2.length,
      },
    });
  } catch (err) {
    return res.status(502).json({
      error: "Deep research failed",
      message: String(err.message || err),
    });
  }
}
