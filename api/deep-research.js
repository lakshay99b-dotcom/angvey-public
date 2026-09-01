/**
 * Deep Research API — free academic search
 * Sources: arXiv, Semantic Scholar, OpenAlex
 * Returns ranked papers + markdown context for grounded answers
 */
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let topic = '';
  if (req.method === 'GET') {
    topic = String(req.query?.q || req.query?.topic || '').trim();
  } else {
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = {}; }
    }
    topic = String(body?.topic || body?.q || body?.query || '').trim();
  }
  if (!topic) return res.status(400).json({ error: 'Missing topic' });

  try {
    const queries = expandQueries(topic);
    const [arxivLists, s2Lists, openAlexLists] = await Promise.all([
      Promise.all(queries.slice(0, 4).map(q => searchArxiv(q).catch(() => []))),
      Promise.all(queries.slice(0, 3).map(q => searchSemanticScholar(q).catch(() => []))),
      Promise.all(queries.slice(0, 2).map(q => searchOpenAlex(q).catch(() => []))),
    ]);

    const arxiv = arxivLists.flat();
    const s2 = s2Lists.flat();
    const openalex = openAlexLists.flat();
    const papers = dedupePapers([...arxiv, ...s2, ...openalex]);
    const ranked = rankPapers(papers, topic).slice(0, 16);
    const ctx = buildContext(topic, ranked);

    return res.status(200).json({
      ok: true,
      topic,
      queries,
      counts: { arxiv: arxiv.length, semanticScholar: s2.length, openAlex: openalex.length, unique: ranked.length },
      papers: ranked,
      ctx,
    });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}

/* ── Query expansion for academic precision ── */
function expandQueries(raw) {
  const q = raw.replace(/\s+/g, ' ').trim();
  const lower = q.toLowerCase();
  const out = new Set([q]);

  // Core academic phrasing
  out.add(`"${q}"`);

  // Black hole cosmology / universe from black hole family
  if (/universe.*(black\s*hole|singularity)|black\s*hole.*(universe|cosmos|cosmology|birth|born|originate|baby)/i.test(lower)
      || /universe from (a )?black hole/i.test(lower)
      || /black hole cosmolog/i.test(lower)
      || /baby universe/i.test(lower)
      || /universe inside (a )?black hole/i.test(lower)) {
    [
      'black hole cosmology',
      'universe inside black hole',
      'baby universe black hole',
      'Poplawski torsion cosmology',
      'Smolin cosmological natural selection',
      'black hole bounce cosmology',
      'Einstein-Cartan cosmology black hole',
      'universe born from black hole',
      'Nonsingular black hole cosmology',
    ].forEach(x => out.add(x));
  }

  // Generic physics/math boosts
  if (/theory|hypothesis|model|mechanism/i.test(lower)) {
    out.add(q.replace(/\bwhat is\b/i, '').trim());
  }

  // Strip conversational fillers
  const cleaned = q
    .replace(/^(what is|what's|explain|tell me about|describe|how does|how do)\s+/i, '')
    .replace(/\?+$/, '')
    .trim();
  if (cleaned && cleaned !== q) out.add(cleaned);

  return [...out].slice(0, 8);
}

/* ── arXiv ── */
async function searchArxiv(query) {
  const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=12&sortBy=relevance&sortOrder=descending`;
  const res = await fetch(url, { headers: { 'User-Agent': 'ANGVEY-DeepResearch/1.0' } });
  if (!res.ok) return [];
  const xml = await res.text();
  return parseArxivAtom(xml);
}

function parseArxivAtom(xml) {
  const entries = [];
  const blocks = xml.split(/<entry>/).slice(1);
  for (const block of blocks) {
    const title = textBetween(block, '<title>', '</title>').replace(/\s+/g, ' ').trim();
    const summary = textBetween(block, '<summary>', '</summary>').replace(/\s+/g, ' ').trim();
    const id = textBetween(block, '<id>', '</id>').trim();
    const published = textBetween(block, '<published>', '</published>').trim();
    const year = published ? published.slice(0, 4) : '';
    const authors = [];
    const authorBlocks = block.split(/<author>/).slice(1);
    for (const ab of authorBlocks) {
      const name = textBetween(ab, '<name>', '</name>').trim();
      if (name) authors.push(name);
    }
    let pdf = '';
    const linkMatch = block.match(/<link[^>]*title="pdf"[^>]*href="([^"]+)"/i)
      || block.match(/<link[^>]*href="([^"]+)"[^>]*title="pdf"/i);
    if (linkMatch) pdf = linkMatch[1];
    else if (id.includes('arxiv.org')) pdf = id.replace('/abs/', '/pdf/') + '.pdf';

    if (title) {
      entries.push({
        title,
        abstract: summary.slice(0, 1200),
        authors: authors.slice(0, 8),
        year,
        source: 'arXiv',
        url: id || '',
        pdf: pdf || '',
        venue: 'arXiv',
        citations: null,
      });
    }
  }
  return entries;
}

function textBetween(s, a, b) {
  const i = s.indexOf(a);
  if (i < 0) return '';
  const j = s.indexOf(b, i + a.length);
  if (j < 0) return s.slice(i + a.length);
  return s.slice(i + a.length, j);
}

/* ── Semantic Scholar ── */
async function searchSemanticScholar(query) {
  const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${encodeURIComponent(query)}&limit=10&fields=title,abstract,year,authors,url,openAccessPdf,citationCount,venue,externalIds`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'ANGVEY-DeepResearch/1.0',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const papers = Array.isArray(data?.data) ? data.data : [];
  return papers.map(p => {
    const arxivId = p.externalIds?.ArXiv;
    const pdf = p.openAccessPdf?.url
      || (arxivId ? `https://arxiv.org/pdf/${arxivId}.pdf` : '');
    const url = p.url
      || (arxivId ? `https://arxiv.org/abs/${arxivId}` : '')
      || '';
    return {
      title: (p.title || '').trim(),
      abstract: (p.abstract || '').slice(0, 1200),
      authors: (p.authors || []).map(a => a.name).filter(Boolean).slice(0, 8),
      year: p.year ? String(p.year) : '',
      source: 'Semantic Scholar',
      url,
      pdf,
      venue: p.venue || 'Semantic Scholar',
      citations: typeof p.citationCount === 'number' ? p.citationCount : null,
    };
  }).filter(p => p.title);
}

/* ── OpenAlex (open knowledge base) ── */
async function searchOpenAlex(query) {
  const url = `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per_page=8&sort=relevance_score:desc`;
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'mailto:angvey@example.com',
      Accept: 'application/json',
    },
  });
  if (!res.ok) return [];
  const data = await res.json();
  const works = Array.isArray(data?.results) ? data.results : [];
  return works.map(w => {
    const authors = (w.authorships || [])
      .map(a => a?.author?.display_name)
      .filter(Boolean)
      .slice(0, 8);
    const pdf = w.primary_location?.pdf_url
      || w.open_access?.oa_url
      || '';
    const landing = w.primary_location?.landing_page_url
      || w.ids?.openalex
      || '';
    return {
      title: (w.title || w.display_name || '').trim(),
      abstract: invertOpenAlexAbstract(w.abstract_inverted_index).slice(0, 1200),
      authors,
      year: w.publication_year ? String(w.publication_year) : '',
      source: 'OpenAlex',
      url: landing,
      pdf,
      venue: w.primary_location?.source?.display_name || 'OpenAlex',
      citations: typeof w.cited_by_count === 'number' ? w.cited_by_count : null,
    };
  }).filter(p => p.title);
}

function invertOpenAlexAbstract(inv) {
  if (!inv || typeof inv !== 'object') return '';
  const pairs = [];
  for (const [word, positions] of Object.entries(inv)) {
    for (const pos of positions) pairs.push([pos, word]);
  }
  pairs.sort((a, b) => a[0] - b[0]);
  return pairs.map(p => p[1]).join(' ');
}

/* ── Dedupe + rank ── */
function normalizeTitle(t) {
  return String(t || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function dedupePapers(list) {
  const seen = new Set();
  const out = [];
  for (const p of list) {
    const key = normalizeTitle(p.title);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

function rankPapers(papers, topic) {
  const terms = topic.toLowerCase().split(/\W+/).filter(t => t.length > 2);
  return papers
    .map(p => {
      const hay = `${p.title} ${p.abstract}`.toLowerCase();
      let score = 0;
      for (const t of terms) if (hay.includes(t)) score += 2;
      if (p.abstract && p.abstract.length > 80) score += 1;
      if (p.citations) score += Math.min(5, Math.log10(p.citations + 1));
      if (p.pdf) score += 0.5;
      if (/black.?hole|cosmolog|universe|singularity|poplawski|smolin/i.test(hay)) score += 3;
      return { ...p, _score: score };
    })
    .sort((a, b) => b._score - a._score)
    .map(({ _score, ...rest }) => rest);
}

function buildContext(topic, papers) {
  if (!papers.length) {
    return `No academic papers were retrieved for: "${topic}". Answer carefully and note the lack of retrieved sources.`;
  }
  const lines = [
    `You are answering using ONLY the retrieved academic papers below about: "${topic}".`,
    `Ground every claim in these sources. Cite as [1], [2], etc. If the papers do not support a claim, say so clearly.`,
    `Prefer theories explicitly discussed in the abstracts (e.g. black hole cosmology, baby universes, Poplawski, Smolin) when present.`,
    '',
    'RETRIEVED PAPERS:',
  ];
  papers.forEach((p, i) => {
    const n = i + 1;
    const authors = (p.authors || []).slice(0, 4).join(', ');
    lines.push(`[${n}] ${p.title}`);
    lines.push(`    Source: ${p.source}${p.year ? ' · ' + p.year : ''}${p.venue ? ' · ' + p.venue : ''}`);
    if (authors) lines.push(`    Authors: ${authors}`);
    if (p.citations != null) lines.push(`    Citations: ${p.citations}`);
    if (p.url) lines.push(`    URL: ${p.url}`);
    if (p.abstract) lines.push(`    Abstract: ${p.abstract}`);
    lines.push('');
  });
  return lines.join('\n');
}
