/**
 * ANGVEY Deep Research
 * Tools button fix: bind the real toolbar button, no open/close race on mobile
 */
(function () {
  'use strict';

  const DR_CSS = `
#dr-tools-backdrop{
  display:none;position:fixed;inset:0;z-index:12000;
  background:rgba(0,0,0,.55);
}
#dr-tools-backdrop.open{display:block}

#dr-tools-menu{
  position:fixed;z-index:12001;
  min-width:280px;max-width:min(340px,94vw);
  background:#161618;border:1px solid #2D2D30;border-radius:14px;
  padding:10px;box-shadow:0 16px 48px rgba(0,0,0,.65);
  display:none;
}
#dr-tools-menu.open{display:block}

@media (max-width:860px){
  #dr-tools-menu{
    left:0 !important;right:0 !important;bottom:0 !important;top:auto !important;
    width:100% !important;max-width:100% !important;min-width:0 !important;
    border-radius:18px 18px 0 0;
    padding:14px 14px calc(18px + env(safe-area-inset-bottom,0px));
  }
  #dr-tools-menu .dr-sheet-handle{
    display:block;width:40px;height:4px;border-radius:99px;
    background:#3F3F46;margin:2px auto 14px;
  }
  .dr-tool-item{padding:16px 14px;min-height:56px;font-size:.95rem}
}
@media (min-width:861px){
  #dr-tools-menu .dr-sheet-handle{display:none}
}

.dr-tool-item{
  display:flex;align-items:center;gap:12px;width:100%;
  padding:12px 12px;border-radius:12px;border:none;background:transparent;
  color:#D4D4D8;font-size:.88rem;font-weight:500;cursor:pointer;text-align:left;
  touch-action:manipulation;
}
.dr-tool-item:active{background:rgba(255,255,255,.07)}
.dr-tool-item.on{background:rgba(245,158,11,.12);color:#FBBF24}
.dr-tool-item .ic{
  width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  background:#1C1C1F;border:1px solid #2D2D30;flex-shrink:0;
}
.dr-tool-item.on .ic{border-color:rgba(245,158,11,.45);background:rgba(245,158,11,.12)}

#angvey-research-btn{
  display:inline-flex;align-items:center;justify-content:center;
  min-height:40px;min-width:40px;padding:0 10px;border-radius:10px;
  border:1px solid #3F3F46;background:transparent;color:#A1A1AA;
  font-size:.95rem;cursor:pointer;touch-action:manipulation;
  -webkit-tap-highlight-color:rgba(245,158,11,.25);
  position:relative;z-index:60;pointer-events:auto !important;
}
#angvey-research-btn.on{
  color:#FBBF24;border-color:rgba(245,158,11,.5);background:rgba(245,158,11,.14);
}

button.dr-tools-live{
  position:relative !important;z-index:60 !important;
  pointer-events:auto !important;
  touch-action:manipulation !important;
  min-height:40px !important;
  -webkit-tap-highlight-color:rgba(245,158,11,.25);
}
button.dr-tools-live.dr-on{
  color:#FBBF24 !important;
  border-color:rgba(245,158,11,.5) !important;
  background:rgba(245,158,11,.14) !important;
}

.dr-badge{display:inline-flex;align-items:center;gap:5px;padding:3px 8px;border-radius:99px;font-size:.65rem;font-weight:700;letter-spacing:.04em;background:rgba(245,158,11,.12);color:#FBBF24;border:1px solid rgba(245,158,11,.25);margin-bottom:6px}
.dr-prog{background:#0F0F12;border:1px solid #1F1F23;border-radius:14px;padding:14px 16px;width:100%;max-width:640px}
.dr-prog-hd{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}
.dr-prog-title{display:flex;align-items:center;gap:8px;font-size:.8rem;font-weight:600;color:#FBBF24}
.dr-prog-meta{font-size:.7rem;color:#52525B}
.dr-step{display:flex;align-items:flex-start;gap:10px;font-size:.76rem;color:#71717A;line-height:1.45;padding:5px 0}
.dr-step.live{color:#FDE68A}
.dr-step.done{color:#A1A1AA}
.dr-step .dot{width:8px;height:8px;min-width:8px;border-radius:50%;margin-top:5px;background:#3F3F46}
.dr-step.live .dot{background:#F59E0B;box-shadow:0 0 0 3px rgba(245,158,11,.2)}
.dr-step.done .dot{background:#34D399}
.dr-papers{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}
.dr-paper-chip{display:inline-flex;align-items:center;gap:6px;padding:6px 10px;border-radius:9px;background:#1C1C1F;border:1px solid #2D2D30;font-size:.68rem;color:#D4D4D8;cursor:pointer;max-width:100%;touch-action:manipulation}
.dr-paper-chip .src{color:#F59E0B;font-weight:700;flex-shrink:0}
.dr-paper-chip .ttl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:280px}
.dr-hook{margin-top:8px;padding:10px 12px;border-radius:10px;background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(139,92,246,.06));border:1px solid rgba(245,158,11,.18);font-size:.72rem;color:#D4D4D8;line-height:1.5}
#dr-mode-pill{display:none;align-items:center;gap:6px;padding:4px 10px;border-radius:99px;font-size:.68rem;font-weight:700;background:rgba(245,158,11,.12);color:#FBBF24;border:1px solid rgba(245,158,11,.3);margin-right:6px}
#dr-mode-pill.on{display:inline-flex}
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
  let drBusy = false;
  let lastToggleAt = 0;

  function openAngveyDB() {
    return new Promise((resolve, reject) => {
      try {
        const r = indexedDB.open('angvey_db', 3);
        r.onupgradeneeded = (e) => {
          const d = e.target.result;
          if (!d.objectStoreNames.contains('sessions')) d.createObjectStore('sessions', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('profile')) d.createObjectStore('profile', { keyPath: 'id' });
          if (!d.objectStoreNames.contains('config')) d.createObjectStore('config', { keyPath: 'k' });
        };
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      } catch (e) {
        reject(e);
      }
    });
  }

  async function saveSession(sess) {
    try {
      const db = await openAngveyDB();
      await new Promise((res, rej) => {
        const tx = db.transaction('sessions', 'readwrite');
        tx.objectStore('sessions').put(sess);
        tx.oncomplete = () => res();
        tx.onerror = () => rej(tx.error);
      });
    } catch (_) {}
    try {
      if (Array.isArray(window.sessions)) {
        const i = window.sessions.findIndex((s) => s.id === sess.id);
        if (i >= 0) window.sessions[i] = sess;
        else window.sessions.push(sess);
      }
      if (typeof window.renderHistory === 'function') window.renderHistory();
    } catch (_) {}
  }

  /** The original Tools button in the input toolbar (no id in source HTML). */
  function findToolsButton() {
    // Prefer already-tagged
    let btn = document.querySelector('button.dr-tools-live');
    if (btn) return btn;

    const candidates = Array.from(document.querySelectorAll('button'));
    btn = candidates.find((b) => {
      if (b.id === 'angvey-research-btn' || b.id === 'tool-deep-research') return false;
      const t = (b.textContent || '').replace(/\s+/g, ' ').trim();
      return t === 'Tools' || /^Tools$/i.test(t);
    });
    return btn || null;
  }

  function setResearchOn(on) {
    window.__angveyDeepResearchOn = !!on;
    const item = document.getElementById('tool-deep-research');
    if (item) item.classList.toggle('on', on);
    const toolsBtn = findToolsButton();
    if (toolsBtn) toolsBtn.classList.toggle('dr-on', on);
    const researchBtn = document.getElementById('angvey-research-btn');
    if (researchBtn) researchBtn.classList.toggle('on', on);
    const pill = document.getElementById('dr-mode-pill');
    if (pill) pill.classList.toggle('on', on);
  }

  function isMenuOpen() {
    const menu = document.getElementById('dr-tools-menu');
    return !!(menu && menu.classList.contains('open'));
  }

  function closeToolsMenu() {
    const menu = document.getElementById('dr-tools-menu');
    const bd = document.getElementById('dr-tools-backdrop');
    if (menu) menu.classList.remove('open');
    if (bd) bd.classList.remove('open');
  }

  function openToolsMenu() {
    const menu = document.getElementById('dr-tools-menu');
    const bd = document.getElementById('dr-tools-backdrop');
    const toolsBtn = findToolsButton();
    if (!menu) return;

    const mobile = window.matchMedia('(max-width:860px)').matches;
    if (mobile) {
      menu.style.left = '';
      menu.style.top = '';
      menu.style.bottom = '';
      if (bd) bd.classList.add('open');
    } else if (toolsBtn) {
      const r = toolsBtn.getBoundingClientRect();
      const menuW = 280;
      let left = r.left;
      if (left + menuW > window.innerWidth - 8) left = Math.max(8, window.innerWidth - menuW - 8);
      menu.style.left = left + 'px';
      menu.style.bottom = window.innerHeight - r.top + 8 + 'px';
      menu.style.top = 'auto';
      if (bd) bd.classList.remove('open');
    }

    menu.classList.add('open');
  }

  /** Debounced toggle — stops mobile touchend+click from opening then closing. */
  function toggleToolsMenu(e) {
    if (e) {
      try {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      } catch (_) {}
    }
    const now = Date.now();
    if (now - lastToggleAt < 400) return;
    lastToggleAt = now;

    if (isMenuOpen()) closeToolsMenu();
    else openToolsMenu();
  }

  function ensureUI() {
    injectCSS();

    const toolsBtn = findToolsButton();
    if (!toolsBtn) return false;

    // Harden existing Tools button — do NOT hide/replace it
    toolsBtn.classList.add('dr-tools-live');
    toolsBtn.type = 'button';
    toolsBtn.style.pointerEvents = 'auto';
    toolsBtn.style.zIndex = '60';
    toolsBtn.style.position = 'relative';
    toolsBtn.style.minHeight = '40px';
    toolsBtn.style.touchAction = 'manipulation';

    if (!toolsBtn.__drBound) {
      toolsBtn.__drBound = true;
      // Single path: click only (iOS synthesizes click after touch).
      // Do NOT also bind touchend — that caused open-then-close.
      toolsBtn.addEventListener('click', toggleToolsMenu, true);
      // Backup for stubborn WebViews
      toolsBtn.onclick = function (e) {
        toggleToolsMenu(e);
        return false;
      };
    }

    // Research one-tap toggle next to Tools
    if (!document.getElementById('angvey-research-btn') && toolsBtn.parentElement) {
      const rb = document.createElement('button');
      rb.type = 'button';
      rb.id = 'angvey-research-btn';
      rb.title = 'Deep Research on/off';
      rb.setAttribute('aria-label', 'Deep Research');
      rb.textContent = '🔬';
      toolsBtn.parentElement.insertBefore(rb, toolsBtn.nextSibling);
      rb.addEventListener(
        'click',
        function (e) {
          try {
            e.preventDefault();
            e.stopPropagation();
          } catch (_) {}
          setResearchOn(!window.__angveyDeepResearchOn);
          closeToolsMenu();
        },
        true
      );
    }

    // Backdrop
    if (!document.getElementById('dr-tools-backdrop')) {
      const bd = document.createElement('div');
      bd.id = 'dr-tools-backdrop';
      document.body.appendChild(bd);
      bd.addEventListener(
        'click',
        function (e) {
          e.preventDefault();
          closeToolsMenu();
        },
        true
      );
    }

    // Menu on body (never clipped by input overflow)
    if (!document.getElementById('dr-tools-menu')) {
      const menu = document.createElement('div');
      menu.id = 'dr-tools-menu';
      menu.innerHTML =
        '<div class="dr-sheet-handle"></div>' +
        '<button type="button" class="dr-tool-item" id="tool-deep-research">' +
        '<span class="ic"><svg fill="none" height="16" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="16"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/><path d="M11 8v6"/><path d="M8 11h6"/></svg></span>' +
        '<span style="flex:1"><div style="font-weight:600">Deep Research</div>' +
        '<div style="font-size:.7rem;color:#71717A;margin-top:2px">arXiv · Semantic Scholar · OpenAlex</div></span>' +
        '</button>';
      document.body.appendChild(menu);

      document.getElementById('tool-deep-research').addEventListener(
        'click',
        function (e) {
          e.preventDefault();
          e.stopPropagation();
          setResearchOn(!window.__angveyDeepResearchOn);
          closeToolsMenu();
        },
        true
      );
    }

    if (!window.__drDocCloseBound) {
      window.__drDocCloseBound = true;
      document.addEventListener(
        'click',
        function (e) {
          if (Date.now() - lastToggleAt < 450) return;
          const menuEl = document.getElementById('dr-tools-menu');
          const btn = findToolsButton();
          if (!menuEl || !menuEl.classList.contains('open')) return;
          if (menuEl.contains(e.target)) return;
          if (btn && (btn === e.target || btn.contains(e.target))) return;
          if (e.target && e.target.id === 'angvey-research-btn') return;
          closeToolsMenu();
        },
        true
      );
    }

    if (!document.getElementById('dr-mode-pill')) {
      const sendBtn = document.getElementById('send-btn');
      if (sendBtn && sendBtn.parentElement) {
        const pill = document.createElement('span');
        pill.id = 'dr-mode-pill';
        pill.textContent = '🔬 Research';
        sendBtn.parentElement.insertBefore(pill, sendBtn);
      }
    }

    return true;
  }

  async function deepResearchSearch(topic) {
    const res = await fetch('/api/deep-research', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic }),
    });
    if (!res.ok) {
      let msg = 'HTTP ' + res.status;
      try {
        const j = await res.json();
        msg = j.error || msg;
      } catch (_) {}
      throw new Error(msg);
    }
    return res.json();
  }
  window.__angveyDeepResearchSearch = deepResearchSearch;

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

  function scrollChat() {
    try {
      const cv = document.getElementById('chat-view');
      if (cv) cv.scrollTop = cv.scrollHeight;
    } catch (_) {}
  }

  function showChatView() {
    try {
      if (typeof window.showView === 'function') window.showView('chat');
    } catch (_) {}
    const hero = document.getElementById('hero-view');
    const chat = document.getElementById('chat-view');
    const suggs = document.getElementById('suggs');
    if (hero) hero.classList.add('hide');
    if (chat) chat.classList.remove('hide');
    if (suggs) suggs.classList.add('hide');
  }

  function addUserBubble(text) {
    try {
      if (typeof window.addUser === 'function') {
        window.addUser(text);
        return;
      }
    } catch (_) {}
    const chatMsgs = document.getElementById('chat-msgs');
    if (!chatMsgs) return;
    const d = document.createElement('div');
    d.className = 'mr u';
    d.innerHTML = '<div class="bb">' + esc(text).replace(/\n/g, '<br>') + '</div>';
    chatMsgs.appendChild(d);
    scrollChat();
  }

  function setBusy(on) {
    drBusy = on;
    try {
      if (on && typeof window.lock === 'function') window.lock();
      if (!on && typeof window.unlock === 'function') window.unlock();
    } catch (_) {}
    const sendBtn = document.getElementById('send-btn');
    const stopBtn = document.getElementById('stop-btn');
    if (sendBtn) {
      sendBtn.disabled = on;
      if (on) sendBtn.classList.add('hide');
      else sendBtn.classList.remove('hide');
    }
    if (stopBtn) {
      if (on) stopBtn.classList.remove('hide');
      else stopBtn.classList.add('hide');
    }
  }

  function addDeepResearchProgress(query) {
    const chatMsgs = document.getElementById('chat-msgs');
    if (!chatMsgs) return null;
    const row = document.createElement('div');
    row.className = 'mr a';
    row.id = 'dr-progress-row';
    const start = Date.now();
    row.innerHTML =
      '<div class="aav"><img src="https://i.ibb.co/QvGDpxgQ/Screenshot-2026-04-26-204928.png" alt="" onerror="this.style.display=\'none\'"/></div>' +
      '<div class="abody" style="max-width:640px;width:100%">' +
      '<div class="dr-badge">🔬 DEEP RESEARCH</div>' +
      '<div class="dr-prog">' +
      '<div class="dr-prog-hd"><div class="dr-prog-title"><span class="search-prog-spin" id="dr-spin"></span><span id="dr-title">Researching academic sources…</span></div>' +
      '<span class="dr-prog-meta" id="dr-meta"></span></div>' +
      '<div id="dr-steps"></div><div class="dr-papers" id="dr-papers"></div>' +
      '<div class="dr-hook" id="dr-hook" style="display:none"></div></div>' +
      '<div class="bb prose hide" id="dr-answer" style="margin-top:10px"></div>' +
      '<div class="macts hide" id="dr-acts"><button class="cbtn" id="dr-copy" type="button">Copy</button></div></div>';
    chatMsgs.appendChild(row);
    scrollChat();

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

    copyBtn.addEventListener('click', function () {
      if (!_raw) return;
      navigator.clipboard.writeText(_raw).then(function () {
        copyBtn.textContent = 'Copied!';
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
        }, 1600);
      }).catch(function () {});
    });

    function addStep(text, state) {
      const el = document.createElement('div');
      el.className = 'dr-step' + (state === 'live' ? ' live' : state === 'done' ? ' done' : '');
      el.innerHTML = '<span class="dot"></span><span class="txt">' + esc(text) + '</span>';
      stepsEl.appendChild(el);
      stepNodes.push(el);
      scrollChat();
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
        ? paperCount
          ? 'Grounded in ' + paperCount + ' papers'
          : 'Research complete'
        : 'Research finished with limited sources';
      metaEl.textContent = elapsed + 's';
      if (spinEl) {
        spinEl.className = '';
        spinEl.innerHTML = ok
          ? '<svg fill="none" height="12" stroke="#F59E0B" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" viewBox="0 0 24 24" width="12"><path d="M20 6 9 17l-5-5"/></svg>'
          : '<svg fill="none" height="12" stroke="#FBBF24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" viewBox="0 0 24 24" width="12"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m0 4h.01"/></svg>';
      }
    }

    function showPapers(papers) {
      papersEl.innerHTML = '';
      (papers || []).slice(0, 12).forEach(function (p, i) {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'dr-paper-chip';
        chip.innerHTML =
          '<span class="src">[' +
          (i + 1) +
          ']</span><span class="ttl">' +
          esc(p.title || 'Untitled') +
          '</span>';
        chip.addEventListener('click', function () {
          if (typeof window.__angveyOpenPaper === 'function') window.__angveyOpenPaper(p);
        });
        papersEl.appendChild(chip);
      });
      if ((papers || []).length) {
        hookEl.style.display = '';
        hookEl.innerHTML =
          '📚 <strong>' +
          papers.length +
          ' papers</strong> — tap a chip for abstract.';
      }
    }

    addStep('Formulating academic search from: “' + truncate(query, 72) + '”', 'live');

    return {
      completeLive: function () {
        stepNodes.forEach(function (n) {
          if (n.classList.contains('live')) setStepState(n, 'done');
        });
      },
      next: function (text) {
        this.completeLive();
        return addStep(text, 'live');
      },
      showPapers: showPapers,
      finishHeader: finishHeader,
      set: function (text, cursor) {
        _raw = text || '';
        answerEl.classList.remove('hide');
        actsEl.classList.remove('hide');
        var html = _raw;
        if (typeof marked !== 'undefined') {
          try {
            html = marked.parse(_raw);
          } catch (_) {}
        }
        answerEl.innerHTML = html;
        if (cursor) answerEl.classList.add('cur');
        else answerEl.classList.remove('cur');
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
        scrollChat();
      },
      setError: function (msg) {
        answerEl.classList.remove('hide');
        answerEl.classList.add('err');
        answerEl.innerHTML = msg;
      },
    };
  }

  async function runDeepResearch(text) {
    if (!text || drBusy) return;
    var inputEl = document.getElementById('ci');

    var sessionId = null;
    try {
      if (window.activeId) sessionId = window.activeId;
    } catch (_) {}
    if (!sessionId) sessionId = Date.now().toString();

    var title = text.length > 46 ? text.slice(0, 43) + '…' : text;
    var messages = [];

    try {
      var db = await openAngveyDB();
      var existing = await new Promise(function (res) {
        var tx = db.transaction('sessions', 'readonly');
        var req = tx.objectStore('sessions').get(sessionId);
        req.onsuccess = function () {
          res(req.result || null);
        };
        req.onerror = function () {
          res(null);
        };
      });
      if (existing && Array.isArray(existing.messages)) messages = existing.messages.slice();
    } catch (_) {}

    showChatView();
    if (inputEl) {
      inputEl.value = '';
      inputEl.style.height = 'auto';
    }
    setBusy(true);
    addUserBubble(text);

    messages.push({ role: 'user', content: text });
    var sess = {
      id: sessionId,
      title: title,
      messages: messages.slice(),
      createdAt: Date.now(),
      research: true,
    };
    await saveSession(sess);
    try {
      window.activeId = sessionId;
    } catch (_) {}

    var progress = addDeepResearchProgress(text);
    var data = { ctx: '', papers: [], counts: {} };

    try {
      progress.next('Querying arXiv API for matching preprints');
      await new Promise(function (r) {
        setTimeout(r, 150);
      });
      progress.next('Querying Semantic Scholar graph');
      await new Promise(function (r) {
        setTimeout(r, 100);
      });
      progress.next('Querying OpenAlex open knowledge base');

      data = await deepResearchSearch(text);
      var counts = data.counts || {};
      progress.completeLive();
      progress.next(
        'Fetched ' +
          (counts.arxiv || 0) +
          ' arXiv + ' +
          (counts.semanticScholar || 0) +
          ' S2 + ' +
          (counts.openAlex || 0) +
          ' OpenAlex'
      );
      progress.completeLive();
      progress.next('Ranking ' + (counts.unique || (data.papers || []).length) + ' unique papers');
      window.__angveyLastPapers = data.papers || [];
      progress.showPapers(data.papers || []);
      progress.completeLive();
      progress.next('Synthesizing grounded answer');
      progress.finishHeader(true, (data.papers || []).length);
    } catch (err) {
      progress.next('Search issue: ' + (err.message || err));
      progress.finishHeader(false, 0);
    }

    var ctx = data.ctx || '';
    var grounded = ctx
      ? text +
        '\n\n[Deep Research academic context — ground your answer in these papers only:]\n' +
        ctx
      : text;

    var fullText = '';
    try {
      var apiMessages = messages.slice(0, -1).concat([{ role: 'user', content: grounded }]);
      var res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'qwen/qwen3.8-27b',
          max_tokens: 1024,
          temperature: 0.55,
          stream: true,
          messages: [
            {
              role: 'system',
              content:
                'You are ANGVEY, an academic research partner. When Deep Research context is present, ground every claim in those papers and cite them as [1], [2], etc. Prefer theories that appear in the retrieved abstracts. Use clear markdown. If papers do not support a claim, say so.',
            },
          ].concat(apiMessages),
        }),
      });

      if (!res.ok) {
        var m = 'HTTP ' + res.status;
        try {
          var j = await res.json();
          m = (j && j.error && j.error.message) || (j && j.error) || m;
        } catch (_) {}
        throw new Error(m);
      }

      progress.set('', true);
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      outer: while (true) {
        var chunk = await reader.read();
        if (chunk.done) break;
        buf += decoder.decode(chunk.value, { stream: true });
        var lines = buf.split('\n');
        buf = lines.pop() || '';
        for (var li = 0; li < lines.length; li++) {
          var line = lines[li].trim();
          if (line.indexOf('data:') !== 0) continue;
          var raw = line.slice(5).trim();
          if (raw === '[DONE]') break outer;
          try {
            var o = JSON.parse(raw);
            var d =
              o &&
              o.choices &&
              o.choices[0] &&
              o.choices[0].delta &&
              o.choices[0].delta.content;
            if (d) {
              fullText += d;
              progress.set(fullText, true);
            }
            if (o && o.choices && o.choices[0] && o.choices[0].finish_reason) break outer;
          } catch (_) {}
        }
      }
      progress.completeLive();
      progress.set(fullText || 'No answer generated from the retrieved papers.', false);

      if (fullText) {
        messages.push({ role: 'assistant', content: fullText });
        await saveSession({
          id: sessionId,
          title: title,
          messages: messages,
          createdAt: sess.createdAt || Date.now(),
          research: true,
        });
      }
    } catch (err) {
      progress.setError(
        '<strong>Could not complete research answer</strong><br><code>' + esc(err.message) + '</code>'
      );
    } finally {
      setBusy(false);
    }
  }

  function getSendFn() {
    if (typeof window.send === 'function') return window.send;
    try {
      if (typeof send === 'function') return send;
    } catch (_) {}
    return null;
  }

  function patchSend() {
    if (window.__angveyDRPatched) return true;
    var orig = getSendFn();
    if (!orig) return false;

    var wrapped = async function (rawText) {
      var text = (rawText || (document.getElementById('ci') || {}).value || '').trim();
      if (!text) return;
      if (window.__angveyDeepResearchOn) return runDeepResearch(text);
      return orig.apply(this, arguments);
    };

    try {
      window.send = wrapped;
    } catch (_) {}
    try {
      send = wrapped;
    } catch (_) {}

    window.__angveyDRPatched = true;
    return true;
  }

  function hookInputDirectly() {
    var sendBtn = document.getElementById('send-btn');
    var inputEl = document.getElementById('ci');
    if (!sendBtn || sendBtn.__drHooked) return;
    sendBtn.__drHooked = true;

    sendBtn.addEventListener(
      'click',
      function (e) {
        if (!window.__angveyDeepResearchOn) return;
        e.preventDefault();
        e.stopImmediatePropagation();
        runDeepResearch(((inputEl && inputEl.value) || '').trim());
      },
      true
    );

    if (inputEl && !inputEl.__drHooked) {
      inputEl.__drHooked = true;
      inputEl.addEventListener(
        'keydown',
        function (e) {
          if (!window.__angveyDeepResearchOn) return;
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.stopImmediatePropagation();
            runDeepResearch((inputEl.value || '').trim());
          }
        },
        true
      );
    }
  }

  function boot() {
    injectCSS();
    ensureUI();
    hookInputDirectly();

    var tries = 0;
    var iv = setInterval(function () {
      ensureUI();
      hookInputDirectly();
      if (patchSend() || ++tries > 80) clearInterval(iv);
    }, 200);

    if (!document.querySelector('script[src*="dr-drawer"]')) {
      var s = document.createElement('script');
      s.src = './dr-drawer.js';
      document.body.appendChild(s);
    }

    if (!document.getElementById('katex-css')) {
      var l = document.createElement('link');
      l.id = 'katex-css';
      l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      document.head.appendChild(l);
      var s1 = document.createElement('script');
      s1.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js';
      document.body.appendChild(s1);
      var s2 = document.createElement('script');
      s2.src = 'https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js';
      document.body.appendChild(s2);
    }
  }

  ready(boot);
})();
