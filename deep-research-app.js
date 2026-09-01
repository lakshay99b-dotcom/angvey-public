/* Deep Research enhancer for ANGVEY */
(function () {
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }
  ready(function () {
    var buttons = Array.prototype.slice.call(document.querySelectorAll('button'));
    var toolsBtn = buttons.find(function (b) {
      return (b.textContent || '').trim() === 'Tools';
    });
    if (!toolsBtn) return;

    var wrap = document.createElement('div');
    wrap.className = 'tools-wrap';
    wrap.id = 'tools-wrap';
    wrap.style.position = 'relative';
    toolsBtn.parentNode.insertBefore(wrap, toolsBtn);
    wrap.appendChild(toolsBtn);
    toolsBtn.id = 'tools-btn';
    toolsBtn.title = 'Tools';

    var menu = document.createElement('div');
    menu.id = 'tools-menu';
    menu.setAttribute('role', 'menu');
    menu.style.cssText = 'position:absolute;bottom:calc(100% + 8px);left:0;z-index:80;min-width:220px;padding:6px;border-radius:12px;background:#161618;border:1px solid #2D2D30;box-shadow:0 16px 40px rgba(0,0,0,.55);display:none;flex-direction:column;gap:2px;';
    menu.innerHTML = '<button type="button" id="tool-deep-research" role="menuitem" style="display:flex;align-items:flex-start;gap:10px;padding:10px 12px;border-radius:9px;cursor:pointer;border:none;background:transparent;text-align:left;width:100%;color:#D4D4D8;font-family:inherit;">' +
      '<span style="width:28px;height:28px;border-radius:8px;flex-shrink:0;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,.12);color:#F59E0B;">📚</span>' +
      '<span><div style="font-size:.78rem;font-weight:600;color:#E4E4E7;margin-bottom:2px;">Deep Research</div>' +
      '<div style="font-size:.68rem;color:#71717A;line-height:1.35;">arXiv + Semantic Scholar, free</div></span></button>';
    wrap.appendChild(menu);

    var deepResearchOn = false;
    var style = document.createElement('style');
    style.textContent = '.dr-on{color:#F59E0B !important;background:rgba(245,158,11,.12) !important;border-color:rgba(245,158,11,.35) !important;}';
    document.head.appendChild(style);

    toolsBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      menu.style.display = menu.style.display === 'flex' ? 'none' : 'flex';
    });
    document.addEventListener('click', function (e) {
      if (!e.target.closest('#tools-wrap')) menu.style.display = 'none';
    });

    document.getElementById('tool-deep-research').addEventListener('click', function () {
      deepResearchOn = !deepResearchOn;
      window.__angveyDeepResearchOn = deepResearchOn;
      toolsBtn.classList.toggle('dr-on', deepResearchOn);
      toolsBtn.title = deepResearchOn ? 'Deep Research ON' : 'Tools';
      menu.style.display = 'none';
    });

    window.__angveyDeepResearchSearch = async function (topic) {
      var res = await fetch('/api/deep-research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic })
      });
      if (!res.ok) {
        var err = await res.json().catch(function () { return {}; });
        throw new Error(err.error || err.message || ('HTTP ' + res.status));
      }
      return res.json();
    };

    var origSend = null;
    var patchTries = 0;
    var iv = setInterval(function () {
      patchTries++;
      if (typeof send === 'function' && send !== origSend) {
        origSend = send;
        send = async function (rawText) {
          var text = (rawText || (document.getElementById('ci') && document.getElementById('ci').value) || '').trim();
          if (window.__angveyDeepResearchOn && text) {
            try {
              var dr = await window.__angveyDeepResearchSearch(text);
              if (dr && dr.ok && dr.ctx) {
                var augmented = text + '\n\n[Deep research academic context:]\n' + dr.ctx;
                return origSend(text, augmented);
              }
            } catch (e) {
              console.warn('Deep research failed', e);
            }
          }
          return origSend(rawText);
        };
        clearInterval(iv);
      }
      if (patchTries > 40) clearInterval(iv);
    }, 250);
  });
})();
