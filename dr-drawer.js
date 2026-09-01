/* Paper drawer for ANGVEY Deep Research */
(function(){
  function ensure(){
    if(document.getElementById('dr-drawer'))return;
    var s=document.createElement('style');
    s.textContent='#dr-drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:9000;opacity:0;pointer-events:none;transition:opacity .2s}#dr-drawer-overlay.open{opacity:1;pointer-events:auto}#dr-drawer{position:fixed;top:0;right:0;height:100%;width:min(420px,94vw);background:#111113;border-left:1px solid #2D2D30;z-index:9001;transform:translateX(100%);transition:transform .25s ease;display:flex;flex-direction:column;box-shadow:-16px 0 48px rgba(0,0,0,.5)}#dr-drawer.open{transform:translateX(0)}.dr-dh{display:flex;justify-content:space-between;gap:12px;padding:16px;border-bottom:1px solid #1F1F23}.dr-db{flex:1;overflow:auto;padding:16px}.dr-df{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #1F1F23}.dr-btn{flex:1;padding:10px;border-radius:10px;border:1px solid #2D2D30;background:#1C1C1F;color:#E4E4E7;font-size:.78rem;font-weight:600;text-align:center;text-decoration:none}.dr-btn.primary{background:#8B5CF6;border-color:#8B5CF6;color:#fff}';
    document.head.appendChild(s);
    var ov=document.createElement('div');ov.id='dr-drawer-overlay';
    var dr=document.createElement('div');dr.id='dr-drawer';
    dr.innerHTML='<div class="dr-dh"><div style="min-width:0;flex:1"><div id="dr-d-src" style="font-size:.65rem;font-weight:700;color:#F59E0B;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px"></div><div id="dr-d-title" style="font-size:.95rem;font-weight:700;color:#FAFAFA;line-height:1.35"></div></div><button id="dr-d-close" style="width:32px;height:32px;border-radius:8px;border:1px solid #2D2D30;background:#1C1C1F;color:#A1A1AA;cursor:pointer">\u2715</button></div><div class="dr-db"><div id="dr-d-meta" style="font-size:.75rem;color:#71717A;margin-bottom:12px;line-height:1.5"></div><div style="font-size:.68rem;font-weight:700;color:#52525B;text-transform:uppercase;margin-bottom:8px">Abstract</div><div id="dr-d-abs" style="font-size:.84rem;color:#D4D4D8;line-height:1.65"></div></div><div class="dr-df"><a class="dr-btn" id="dr-d-abs-link" target="_blank" rel="noopener">Open abstract</a><a class="dr-btn primary" id="dr-d-pdf" target="_blank" rel="noopener">Open PDF</a></div>';
    document.body.appendChild(ov);document.body.appendChild(dr);
    function close(){ov.classList.remove('open');dr.classList.remove('open')}
    ov.onclick=close;document.getElementById('dr-d-close').onclick=close;
    document.addEventListener('keydown',function(e){if(e.key==='Escape')close()});
  }
  window.__angveyOpenPaper=function(p){
    ensure();if(!p)return;
    document.getElementById('dr-d-src').textContent=(p.source||'Paper')+(p.year?' \u00b7 '+p.year:'');
    document.getElementById('dr-d-title').textContent=p.title||'Untitled';
    var m=[];if(p.authors&&p.authors.length)m.push(p.authors.join(', '));if(p.venue)m.push(p.venue);if(p.citations!=null)m.push(p.citations+' citations');
    document.getElementById('dr-d-meta').textContent=m.join(' \u00b7 ')||'';
    document.getElementById('dr-d-abs').textContent=p.abstract||'No abstract available.';
    var a=document.getElementById('dr-d-abs-link'),f=document.getElementById('dr-d-pdf');
    if(p.url){a.href=p.url;a.style.display=''}else a.style.display='none';
    if(p.pdf){f.href=p.pdf;f.style.display='';f.textContent='Open PDF'}else if(p.url){f.href=p.url;f.textContent='Open source';f.style.display=''}else f.style.display='none';
    document.getElementById('dr-drawer-overlay').classList.add('open');
    document.getElementById('dr-drawer').classList.add('open');
  };
  document.addEventListener('click',function(e){
    var chip=e.target.closest('.dr-paper-chip');
    if(!chip)return;
    var papers=window.__angveyLastPapers;
    if(!papers||!papers.length)return;
    var idx=-1;
    var src=chip.querySelector('.src');
    if(src){var m=src.textContent.match(/\[(\d+)\]/);if(m)idx=+m[1]-1}
    if(idx>=0&&papers[idx]){
      e.preventDefault();e.stopPropagation();
      window.__angveyOpenPaper(papers[idx]);
    }
  },true);
  var ofetch=window.fetch;
  window.fetch=function(){
    var args=arguments;
    return ofetch.apply(this,args).then(function(res){
      try{
        var u=typeof args[0]==='string'?args[0]:(args[0]&&args[0].url)||'';
        if(u.indexOf('/api/deep-research')!==-1){
          res.clone().json().then(function(d){if(d&&d.papers)window.__angveyLastPapers=d.papers}).catch(function(){});
        }
      }catch(e){}
      return res;
    });
  };
})();
