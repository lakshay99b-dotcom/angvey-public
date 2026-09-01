/**
 * Deep Research — arXiv + Semantic Scholar
 * Multi-query expansion for better relevance.
 */
function stripHtml(s) {
  return String(s || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&/g, "&")
    .replace(/</g, "<")
    .replace(/>/g, ">")
    .replace(/"/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function expandQueries(topic) {
  const t = topic.trim().replace(/\?+$/, "");
  const queries = new Set();
  queries.add(t);

  if (/black\s*hole/i.test(t) && /(universe|cosmos|cosmolog|big\s*bang|birth|born|originate|origin|create|creation)/i.test(t)) {
    queries.add("black hole cosmology");
    queries.add('"universe inside a black hole"');
    queries.add('"black hole universe"');
    queries.add("cosmological natural selection Smolin");
    queries.add("Poplawski torsion cosmology black hole");
    queries.add("baby universe black hole");
    queries.add("Schwarzschild cosmology interior universe");
  }
  if (/holograph|ads.?cft/i.test(t)) {
    queries.add("holographic principle AdS/CFT cosmology");
  }
  if (/multiverse|many.world/i.test(t)) {
    queries.add("multiverse cosmology inflation");
  }
  if (/dark\s*matter/i.test(t)) {
    queries.add("dark matter particle physics review");
  }
  if (/transformer|attention|llm|large language/i.test(t)) {
    if (/attention/i.test(t)) queries.add("scaled dot product attention transformer");
    if (/vision/i.test(t)) queries.add("vision transformer attention");
  }

  const stop = new Set([
    "what","is","the","a","an","of","in","on","for","to","from","how","does","do","are",
    "theory","which","that","this","with","about","explain","describe","tell","me","please",
  ]);
  const keywords = t
    .toLowerCase()
    .replace(/[^a-z0-9\s\-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  if (keywords.length >= 2) {
    queries.add(keywords.slice(0, 8).join(" "));
  }

  return [...queries].slice(0, 6);
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
    const cats = [];
    const catRe = /<category[^>]*term="([^"]+)"/gi;
    let cm;
    while ((cm = catRe.exec(part))) cats.push(cm[1]);
    if (title) {
      entries.push({
        title,
        authors: authors.slice(0, 10),
        year: published ? published.slice(0, 4) : "",
        date: published,
        abstract: summary.slice(0, 1800),
        url: id || pdf,
        pdf: pdf || (id && id.includes("arxiv.org") ? id.replace("/abs/", "/pdf/") + ".pdf" : null),
        source: "arXiv",
        categories: cats.slice(0, 5),
      });
    }
  }
  return entries;
}

async function searchArxivOnce(query, max = 5) {
  const q = encodeURIComponent(`all:${query}`);
  const url = `https://export.arxiv.org/api/query?search_query=${q}&start=0&max_results=${max}&sortBy=relevance&sortOrder=descending`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "ANGVEY-DeepResearch/1.1 (research; +https://angvey-public.vercel.app)",
    },
  });
  if (!res.ok) return [];
  return parseArxivAtom(await res.text());
}

async function searchArxiv(topic, maxTotal = 10) {
  const queries = expandQueries(topic);
  const per = Math.max(3, Math.ceil(maxTotal / Math.min(queries.length, 3)));
  const batches = await Promise.all(
    queries.slice(0, 4).map((q) => searchArxivOnce(q, per).catch(() => []))
  );
  return batches.flat();
}

async function searchSemanticScholar(topic, max = 8) {
  const queries = expandQueries(topic).slice(0, 2);
  const all = [];
  for (const q of queries) {
    try {
      const fields =
        "title,abstract,year,authors,url,externalIds,venue,citationCount";
      const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(q)}&limit=${max}&fields=${fields}`;
      const res = await fetch(url, {
        headers: { "User-Agent": "ANGVEY-DeepResearch/1.1" },
      });
      if (!res.ok) continue;
      const data = await res.json();
      const papers = Array.isArray(data.data) ? data.data : [];
      for (const p of papers) {
        if (!p || !p.title) continue;
        const authors = (p.authors || [])
          .map((a) => a.name)
          .filter(Boolean)
          .slice(0, 10);
        const arxivId = p.externalIds?.ArXiv;
        const url =
          p.url ||
          (arxivId ? `https://arxiv.org/abs/${arxivId}` : null) ||
          (p.externalIds?.DOI ? `https://doi.org/${p.externalIds.DOI}` : null) ||
          "";
        all.push({
          title: p.title,
          authors,
          year: p.year ? String(p.year) : "",
          date: p.year ? String(p.year) : "",
          abstract: (p.abstract || "").slice(0, 1800),
          url,
          pdf: arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : null,
          venue: p.venue || "",
          citations: p.citationCount ?? null,
          source: "Semantic Scholar",
          categories: [],
        });
      }
    } catch (_) {}
  }
  return all;
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

function scorePaper(topic, p) {
  const stop = new Set([
    "what","is","the","a","an","of","in","on","for","to","from","how","does","do",
    "are","theory","which","that","this","with","about","and","or",
  ]);
  const words = topic
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !stop.has(w));
  const hay = ((p.title || "") + " " + (p.abstract || "")).toLowerCase();
  let score = 0;
  for (const w of words) {
    if (hay.includes(w)) score += 2;
    if ((p.title || "").toLowerCase().includes(w)) score += 3;
  }
  if (/black.?hole.?cosmolog|baby.?universe|poplawski|smolin|cosmological natural/i.test(hay)) {
    score += 15;
  }
  if (p.citations) score += Math.min(5, Math.log10(p.citations + 1));
  return score;
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
    if (p.categories?.length) ctx += `Categories: ${p.categories.join(", ")}\n`;
    if (p.url) ctx += `URL: ${p.url}\n`;
    if (p.pdf) ctx += `PDF: ${p.pdf}\n`;
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
    const queries = expandQueries(topic);
    const [arxiv, s2] = await Promise.all([
      searchArxiv(topic, 12).catch(() => []),
      searchSemanticScholar(topic, 8).catch(() => []),
    ]);

    let papers = dedupePapers([...arxiv, ...s2]);
    papers.sort((a, b) => scorePaper(topic, b) - scorePaper(topic, a));
    papers = papers.slice(0, 12);
    const ctx = buildContext(topic, papers);

    return res.status(200).json({
      ok: true,
      topic,
      queries,
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
