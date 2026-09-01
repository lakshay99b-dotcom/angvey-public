/**
 * ANGVEY Deep Research client enhancer
 * - Tools menu toggle
 * - Real SciSpace-style progress steps
 * - Grounded context injection
 * - Ensures research chats are saved to IndexedDB
 * - Engaging paper chips + drawer
 */
(function () {
  'use strict';

  const DR_CSS = `
#dr-tools-menu{position:absolute;bottom:calc(100% + 8px);left:0;min-width:220px;background:#161618;border:1px solid #2D2D30;border-radius:14px;padding:8px;box-shadow:0 12px 32px rgba(0,0,0,.55);z-index:40;display:none}
#dr-tools-menu.open{display:block}
.dr-tool-item{display:flex;align-items:center;gap:10px;width:100%;padding:10px 12px;border-radius:10px;border:none;background:transparent;color:#D4D4D8;font-size:.8rem;font-weight:500;cursor:pointer;text-align:left}
.dr-tool-item:hover{background:rgba(255,255,255,.05)}
.dr-tool-item.on{background:rgba(245,158,11,.12);color:#FBBF24}
.dr-tool-item .ic{width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#1C1C1F;border:1px solid #2D2D30;flex-shrink:0}
.dr-tool-item.on .ic{border-color:rgba(245,158,11,.4);background:rgba(245,158,11,.1)}
.dr-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:99px;font-size:.65rem;font-weight:700;letter-spacing:.04em;background:rgba(245,158,11,.12);color:#FBBF24;border:1px solid rgba(245,158,11,.25);margin-bottom:6px}
.dr-prog{background:#0F0F12;border:1px solid #1F1F23;border-radius:14px;padding:14px 16px;width:100%;max-width:640px;animation:fup .16s ease}
.dr-prog-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.dr-prog-title{display:flex;align-items:center;gap:8px;font-size:.8rem;font-weight:600;color:#FBBF24}
.dr-prog-meta{font-size:.7rem;color:#52525B}
.dr-step{display:flex;align-items:flex-start;gap:10px;font-size:.76rem;color:#71717A;line-height:1.45;padding:5px 0;animation:fup .14s ease}
.dr-step.live{color:#FDE68A}
.dr-step.done{color:#A1A1AA}
.dr-step .dot{width:8px;height:8px;min-width:8px;border-radius:50%;margin-top:5px;background:#3F3F46}
.dr-step.live .dot{background:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.2);animation:bb-pulse 1.4s ease-in-out infinite}
.dr-step.done .dot{background:#34D399;box-shadow:none;animation:none}
.dr-papers{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.dr-paper-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:9px;background:#1C1C1F;border:1px solid #2D2D30;font-size:.68rem;color:#D4D4D8;cursor:pointer;max-width:100%;transition:border-color .14s,background .14s}
.dr-paper-chip:hover{border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.08)}
.dr-paper-chip .src{color:#F59E0B;font-weight:700;flex-shrink:0}
.dr-paper-chip .ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}
.dr-hook{margin-top:8px;padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(139,92,246,.06));border:1px solid rgba(245,158,11,.18);font-size:.72rem;color:#D4D4D8;line-height:1.5}
`;

  function injectCSS() {
    if (document.getElementById('dr-css')) return;
    const s = document.createElement('style');
    s.id = 'dr-css';
    s.textContent = DR_CSS;
    document.head.appendChild(s);
  }

  function ready(fn) {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn);
    else fn();
  }

  window.__angveyDeepResearchOn = false;
  window.__angveyLastPapers = [];

  function findToolsButton() {
    const candidates = Array.from(document.querySelectorAll('button'));
    return candidates.find(b => /\bTools\b/i.test(b.textContent || '')) || null;
  }

  function ensureToolsMenu() {
    injectCSS();
    const toolsBtn = findToolsButton();
    if (!toolsBtn) return null;
    let wrap = toolsBtn.parentElement;
    if (!wrap) return null;
    wrap.style.position = 'relative';

    let menu = document.getElementById('dr-tools-menu');
    if (!menu) {
      menu = document.createElement('div');
      menu.id = 'dr-tools-menu';
      menu.innerHTML = `
        <button type="button" class="dr-tool-item" id="tool-deep-research">
          <span class="ic">
            <svg fill="none" height="14" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="14"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg>
          </span>
          <span style="flex:1">
            <div style="font-weight:600">Deep Research</div>
            <div style="font-size:.68rem;color:#71717A;margin-top:1px">arXiv · Semantic Scholar · OpenAlex</div>
          </span>
        </button>`;
      wrap.appendChild(menu);

      toolsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.classList.toggle('open');
      });
      document.addEventListener('click', (e) => {
        if (!menu.contains(e.target) && e.target !== toolsBtn) menu.classList.remove('open');
      });

      const item = document.getElementById('tool-deep-research');
      item.addEventListener('click', () => {
        window.__angveyDeepResearchOn = !window.__angveyDeepResearchOn;
        item.classList.toggle('on', window.__angveyDeepResearchOn);
        toolsBtn.style.color = window.__angveyDeepResearchOn ? '#F59E0B' : '';
        toolsBtn.style.borderColor = window.__angveyDeepResearchOn ? 'rgba(245,158,11,.45)' : '';
        toolsBtn.style.background = window.__angveyDeepResearchOn ? 'rgba(245,158,11,.1)' : '';
        menu.classList.remove('open');
      });
    }
    return menu;
  }

  async function deepResearchSearch(topic) {
    const res = await fetch('/api/deep-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try { const j = await res.json(); msg = j.error || msg; } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }
  window.__angveyDeepResearchSearch = deepResearchSearch;

  function addDeepResearchProgress(query) {
    const chatMsgs = document.getElementById('chat-msgs');
    if (!chatMsgs) return null;
    const row = document.createElement('div');
    row.className = 'mr a';
    row.id = 'dr-progress-row';
    const start = Date.now();
    row.innerHTML = `
      <div class="aav"><img src="https://i.ibb.co/QvGDpxgQ/Screenshot-2026-04-26-204928.png" alt="" onerror="this.style.display='none'"/></div>
      <div class="abody" style="max-width:640px;width:100%">
        <div class="dr-badge">🔬 DEEP RESEARCH</div>
        <div class="dr-prog">
          <div class="dr-prog-hd">
            <div class="dr-prog-title">
              <span class="search-prog-spin" id="dr-spin"></span>
              <span id="dr-title">Researching academic sources…</span>
            </div>
            <span class="dr-prog-meta" id="dr-meta"></span>
          </div>
          <div id="dr-steps"></div>
          <div class="dr-papers" id="dr-papers"></div>
          <div class="dr-hook" id="dr-hook" style="display:none"></div>
        </div>
        <div class="bb prose hide" id="dr-answer" style="margin-top:10px"></div>
        <div class="macts hide" id="dr-acts"><button class="cbtn" id="dr-copy" type="button">Copy</button></div>
      </div>`;
    chatMsgs.appendChild(row);
    try { chatMsgs.parentElement.scrollTop = chatMsgs.parentElement.scrollHeight; } catch (_) {}

    const stepsEl = row.querySelector('#dr-steps');
    const papersEl = row.querySelector('#dr-papers');
    const titleEl = row.querySelector('#dr-title');
    const metaEl = row.querySelector('#dr-meta');
    const spinEl = row.querySelector('#dr-spin');
    const answerEl = row.querySelector('#dr-answer');
    const actsEl = row.querySelector('#dr-acts');
    const copyBtn = row.querySelector('#dr-copy');
    const hookEl = row.querySelector('#dr-hook');
    let _raw = '';
    const stepNodes = [];

    copyBtn.addEventListener('click', () => {
      if (!_raw) return;
      navigator.clipboard.writeText(_raw).then(() => {
        copyBtn.textContent = 'Copied!';
        setTimeout(() => { copyBtn.textContent = 'Copy'; }, 1600);
      }).catch(() => {});
    });

    function addStep(text, state) {
      const el = document.createElement('div');
      el.className = 'dr-step' + (state === 'live' ? ' live' : state === 'done' ? ' done' : '');
      el.innerHTML = `<span class="dot"></span><span class="txt">${esc(text)}</span>`;
      stepsEl.appendChild(el);
      stepNodes.push(el);
      try { chatMsgs.parentElement.scrollTop = chatMsgs.parentElement.scrollHeight; } catch (_) {}
      return el;
    }

    function setStepState(el, state, text) {
      if (!el) return;
      el.className = 'dr-step' + (state === 'live' ? ' live' : state === 'done' ? ' done' : '');
      if (text) el.querySelector('.txt').textContent = text;
    }

    function finishHeader(ok, paperCount) {
      const elapsed = ((Date.now() - start) / 1000).toFixed(1);
      titleEl.textContent = ok
        ? (paperCount ? `Grounded in ${paperCount} papers` : 'Research complete')
        : 'Research finished with limited sources';
      metaEl.textContent = `${elapsed}s`;
      if (spinEl) {
        spinEl.className = '';
        spinEl.innerHTML = ok
          ? `<svg fill="none" height="12" stroke="#F59E0B" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24" width="12"><path d="M20 6 9 17l-5-5"/></svg>`
          : `<svg fill="none" height="12" stroke="#FBBF24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>`;
      }
    }

    function showPapers(papers) {
      papersEl.innerHTML = '';
      (papers || []).slice(0, 10).forEach((p, i) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'dr-paper-chip';
        chip.innerHTML = `<span class="src">[${i + 1}]</span><span class="ttl">${esc(p.title || 'Untitled')}</span>`;
        chip.title = `${p.source || ''} ${p.year || ''} — click for abstract`;
        chip.addEventListener('click', () => {
          if (typeof window.__angveyOpenPaper === 'function') window.__angveyOpenPaper(p);
        });
        papersEl.appendChild(chip);
      });
      if ((papers || []).length) {
        hookEl.style.display = '';
        hookEl.innerHTML = `📚 <strong>${papers.length} papers</strong> retrieved from arXiv, Semantic Scholar & OpenAlex. Click any chip to read the abstract without leaving ANGVEY.`;
      }
    }

    // Seed real first steps immediately
    addStep(`Formulating academic search from: “${truncate(query, 72)}”`, 'live');

    return {
      mark(i, state, text) {
        if (stepNodes[i]) setStepState(stepNodes[i], state, text);
      },
      next(text) {
        // complete previous live steps
        stepNodes.forEach(n => {
          if (n.classList.contains('live')) setStepState(n, 'done');
        });
        return addStep(text, 'live');
      },
      showPapers,
      finishHeader,
      set(text, cursor) {
        _raw = text || '';
        answerEl.classList.remove('hide');
        actsEl.classList.remove('hide');
        let html = _raw;
        if (typeof marked !== 'undefined') {
          try { html = marked.parse(_raw); } catch (_) {}
        }
        answerEl.innerHTML = html;
        if (cursor) answerEl.classList.add('cur');
        else answerEl.classList.remove('cur');
        // KaTeX if available
        try {
          if (window.renderMathInElement) {
            window.renderMathInElement(answerEl, {
              delimiters: [
                { left: '$$', right: '$$', display: true },
                { left: '$', right: '$', display: false },
                { left: '\\(', right: '\\)', display: false },
                { left: '\\[', right: '\\]', display: true },
              ],
              throwOnError: false,
            });
          }
        } catch (_) {}
        try { chatMsgs.parentElement.scrollTop = chatMsgs.parentElement.scrollHeight; } catch (_) {}
      },
      setError(msg) {
        answerEl.classList.remove('hide');
        answerEl.classList.add('err');
        answerEl.innerHTML = msg;
      },
    };
  }

  function esc(s) {
    return String(s || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
  function truncate(s, n) {
    s = String(s || '');
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  function patchSend() {
    if (typeof window.send !== 'function') return false;
    if (window.__angveyDRPatched) return true;
    const orig = window.send;
    window.send = async function (rawText) {
      const text = (rawText || (document.getElementById('ci') || {}).value || '').trim();
      if (!text) return;
      if (!window.__angveyDeepResearchOn) {
        return orig.apply(this, arguments);
      }

      // Research path — must save chat like normal flow
      const inputEl = document.getElementById('ci');
      const chatMsgs = document.getElementById('chat-msgs');

      // Access shared state if exposed; otherwise soft-fallback
      try {
        if (typeof busy !== 'undefined' && busy) return;
      } catch (_) {}

      // Use original helpers when available
      const doLock = typeof lock === 'function' ? lock : () => {};
      const doUnlock = typeof unlock === 'function' ? unlock : () => {};
      const doShow = typeof showView === 'function' ? showView : () => {};
      const doAddUser = typeof addUser === 'function' ? addUser : (t) => {
        if (!chatMsgs) return;
        const d = document.createElement('div');
        d.className = 'mr u';
        d.innerHTML = `<div class="bb">${esc(t)}</div>`;
        chatMsgs.appendChild(d);
      };

      // Ensure session exists + persist
      try {
        if (typeof activeId !== 'undefined' && !activeId && typeof sessions !== 'undefined') {
          const id = Date.now().toString();
          const ttl = text.length > 46 ? text.slice(0, 43) + '…' : text;
          activeId = id;
          const sess = { id, title: ttl, messages: [], createdAt: Date.now() };
          sessions.push(sess);
          if (typeof dbPut === 'function') {
            try { await dbPut('sessions', sess); } catch (_) {}
          }
          if (typeof renderHistory === 'function') renderHistory();
        }
      } catch (_) {}

      doShow('chat');
      if (inputEl) { inputEl.value = ''; inputEl.style.height = 'auto'; }
      doLock();
      doAddUser(text);

      // Push user message into hist + save immediately
      try {
        if (typeof hist !== 'undefined') {
          hist.push({ role: 'user', content: text });
          if (typeof activeId !== 'undefined' && typeof sessions !== 'undefined') {
            const sessNow = sessions.find(x => x.id === activeId);
            if (sessNow) {
              sessNow.messages = [...hist];
              if (typeof dbPut === 'function') {
                try { await dbPut('sessions', sessNow); } catch (_) {}
              }
              if (typeof renderHistory === 'function') renderHistory();
            }
          }
        }
      } catch (_) {}

      const progress = addDeepResearchProgress(text);
      let data = null;
      try {
        progress.next('Querying arXiv API for matching preprints');
        progress.next('Querying Semantic Scholar graph');
        progress.next('Querying OpenAlex open knowledge base');
        data = await deepResearchSearch(text);
        const counts = data.counts || {};
        progress.mark(0, 'done');
        progress.mark(1, 'done', `arXiv · ${counts.arxiv || 0} hits`);
        progress.mark(2, 'done', `Semantic Scholar · ${counts.semanticScholar || 0} hits`);
        progress.mark(3, 'done', `OpenAlex · ${counts.openAlex || 0} hits`);
        progress.next(`Deduplicating & ranking ${counts.unique || (data.papers || []).length} unique papers`);
        window.__angveyLastPapers = data.papers || [];
        progress.showPapers(data.papers || []);
        progress.mark(4, 'done');
        progress.next('Synthesizing answer grounded only in retrieved papers');
        progress.finishHeader(true, (data.papers || []).length);
      } catch (err) {
        progress.next(`Search issue: ${err.message || err}`);
        progress.finishHeader(false, 0);
        data = { ctx: '', papers: [] };
      }

      const ctx = (data && data.ctx) || '';
      const grounded = ctx
        ? `${text}\n\n[Deep Research academic context — ground your answer in these papers only:]\n${ctx}`
        : text;

      // Replace last user hist content with grounded payload for the model
      try {
        if (typeof hist !== 'undefined' && hist.length) {
          hist[hist.length - 1] = { role: 'user', content: grounded };
        }
      } catch (_) {}

      // Stream via chat API
      let fullText = '';
      try {
        const sys = (typeof buildSys === 'function' && typeof profile !== 'undefined')
          ? buildSys(profile)
          : 'You are ANGVEY. Answer using the provided academic papers. Use markdown. Cite [n].';

        const messages = (typeof hist !== 'undefined') ? hist : [{ role: 'user', content: grounded }];
        const res = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: 'qwen/qwen3.8-27b',
            max_tokens: 1024,
            temperature: 0.55,
            stream: true,
            messages: [{ role: 'system', content: sys + '\n\nWhen Deep Research context is present, ground claims in those papers and cite them as [1], [2], etc. Prefer theories that appear in the retrieved abstracts.' }, ...messages],
          }),
        });

        if (!res.ok) {
          let m = `HTTP ${res.status}`;
          try { const j = await res.json(); m = j?.error?.message || j?.error || m; } catch (_) {}
          throw new Error(m);
        }

        progress.set('', true);
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = '';
        outer: while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          const lines = buf.split('\n');
          buf = lines.pop() ?? '';
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith('data:')) continue;
            const raw = t.slice(5).trim();
            if (raw === '[DONE]') break outer;
            try {
              const o = JSON.parse(raw);
              const d = o?.choices?.[0]?.delta?.content;
              if (d) {
                fullText += d;
                progress.set(fullText, true);
              }
              if (o?.choices?.[0]?.finish_reason) break outer;
            } catch (_) {}
          }
        }
        progress.set(fullText || 'No answer generated from the retrieved papers.', false);

        // Persist assistant reply
        try {
          if (typeof hist !== 'undefined' && fullText) {
            // store clean user text in history for display continuity
            if (hist.length) hist[hist.length - 1] = { role: 'user', content: text };
            hist.push({ role: 'assistant', content: fullText });
            if (typeof activeId !== 'undefined' && typeof sessions !== 'undefined') {
              const s = sessions.find(x => x.id === activeId);
              if (s) {
                s.messages = [...hist];
                if (typeof dbPut === 'function') {
                  try { await dbPut('sessions', s); } catch (_) {}
                }
                if (typeof renderHistory === 'function') renderHistory();
              }
            }
          }
        } catch (_) {}
      } catch (err) {
        progress.setError(`<strong>Could not complete research answer</strong><br><code>${esc(err.message)}</code>`);
      } finally {
        doUnlock();
      }
    };
    window.__angveyDRPatched = true;
    return true;
  }

  function boot() {
    injectCSS();
    ensureToolsMenu();
    // Retry patch until send exists (main script may load after us)
    let tries = 0;
    const iv = setInterval(() => {
      ensureToolsMenu();
      if (patchSend() || ++tries > 40) clearInterval(iv);
    }, 250);

    // Load paper drawer
    if (!document.querySelector('script[src*="dr-drawer"]')) {
      const s = document.createElement('script');
      s.src = './dr-drawer.js';
      document.body.appendChild(s);
    }

    // KaTeX for math in research answers
    if (!document.getElementById('katex-css')) {
      const l = document.createElement('link');
      l.id = 'katex-css';
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      document.head.appendChild(l);
      const s1 = document.createElement('script');
      s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
      document.body.appendChild(s1);
      const s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js';
      document.body.appendChild(s2);
    }
  }

  ready(boot);
})();
