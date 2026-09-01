/* ANGVEY Deep Research: progress + paper grounding + KaTeX */
(function(){
function ready(fn){if(document.readyState!=='loading')fn();else document.addEventListener('DOMContentLoaded',fn)}
function loadKatex(){
  if(window.katex&&window.renderMathInElement)return Promise.resolve();
  return new Promise(function(resolve){
    if(!document.querySelector('link[data-angvey-katex]')){
      var l=document.createElement('link');l.rel='stylesheet';
      l.href='https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css';
      l.setAttribute('data-angvey-katex','1');document.head.appendChild(l);
    }
    function ls(src){return new Promise(function(res){
      if(document.querySelector('script[src="'+src+'"]'))return res();
      var s=document.createElement('script');s.src=src;s.onload=res;s.onerror=function(){res()};document.head.appendChild(s);
    })}
    ls('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js').then(function(){
      return ls('https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/contrib/auto-render.min.js');
    }).then(resolve);
  });
}
function renderMath(root){
  if(!window.renderMathInElement||!root)return;
  try{window.renderMathInElement(root,{delimiters:[
    {left:'$$',right:'$$',display:true},{left:'\\[',right:'\\]',display:true},
    {left:'$',right:'$',display:false},{left:'\\(',right:'\\)',display:false}
  ],throwOnError:false,strict:'ignore'});}catch(e){}
}
function installMathHooks(){
  loadKatex().then(function(){
    var msgs=document.getElementById('chat-msgs');if(!msgs)return;
    new MutationObserver(function(ms){
      ms.forEach(function(m){m.addedNodes.forEach(function(n){
        if(n.nodeType!==1)return;
        if(n.classList&&(n.classList.contains('bb')||n.classList.contains('prose')))renderMath(n);
        if(n.querySelectorAll)n.querySelectorAll('.bb,.prose,.dr-answer').forEach(renderMath);
      })});
    }).observe(msgs,{childList:true,subtree:true});
    setInterval(function(){
      msgs.querySelectorAll('.bb,.dr-answer').forEach(function(el){
        if(el.querySelector('.katex'))return;
        if(/\$|\\\(|\\\[/.test(el.textContent||''))renderMath(el);
      });
    },800);
  });
}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function addPanel(){
  var chatMsgs=document.getElementById('chat-msgs');if(!chatMsgs)return null;
  var row=document.createElement('div');row.className='mr a';row.id='dr-panel-row';
  var start=Date.now();
  row.innerHTML='<div class="aav"><img src="https://i.ibb.co/QvGDpxgQ/Screenshot-2026-04-26-204928.png" alt="" onerror="this.style.display=\'none\'"/></div><div class="abody" style="max-width:640px;width:100%"><div style="background:#0F0F12;border:1px solid #1F1F23;border-radius:14px;overflow:hidden"><div style="display:flex;align-items:center;justify-content:space-between;padding:10px 14px;border-bottom:1px solid #1F1F23;background:#111113"><div style="display:flex;align-items:center;gap:8px;font-size:.78rem;font-weight:600;color:#F59E0B"><span class="dr-spin" style="width:12px;height:12px;border:1.5px solid rgba(245,158,11,.25);border-top-color:#F59E0B;border-radius:50%;animation:dr-spin .7s linear infinite;display:inline-block"></span><span id="dr-status">Deep Research</span></div><span id="dr-meta" style="font-size:.68rem;color:#52525B"></span></div><ul id="dr-steps" style="list-style:none;margin:0;padding:10px 14px;display:flex;flex-direction:column;gap:7px;max-height:240px;overflow-y:auto"></ul><div id="dr-papers" style="display:none;padding:0 14px 12px;border-top:1px solid #1F1F23"></div></div></div>';
  chatMsgs.appendChild(row);
  if(!document.getElementById('dr-spin-style')){
    var st=document.createElement('style');st.id='dr-spin-style';
    st.textContent='@keyframes dr-spin{to{transform:rotate(360deg)}}.dr-step{display:flex;gap:8px;font-size:.72rem;color:#71717A;line-height:1.45}.dr-step.live{color:#FBBF24}.dr-step.done{color:#A1A1AA}.dr-paper-chip{display:block;font-size:.7rem;color:#D4D4D8;padding:7px 9px;border-radius:8px;background:rgba(245,158,11,.06);border:1px solid rgba(245,158,11,.18);margin-top:6px;text-decoration:none}.dr-paper-chip .src{color:#F59E0B;font-size:.65rem;font-weight:600}';
    document.head.appendChild(st);
  }
  var stepsEl=row.querySelector('#dr-steps'),statusEl=row.querySelector('#dr-status'),metaEl=row.querySelector('#dr-meta'),papersEl=row.querySelector('#dr-papers'),spinEl=row.querySelector('.dr-spin');
  function scrollBot(){var cv=document.getElementById('chat-view');if(cv)requestAnimationFrame(function(){cv.scrollTop=cv.scrollHeight})}
  function ic(k){if(k==='done')return '\u2713';if(k==='fail')return '!';if(k==='read')return '\uD83D\uDCC4';if(k==='write')return '\u270F\uFE0F';return '\uD83D\uDD0D'}
  function markDone(){stepsEl.querySelectorAll('.dr-step.live').forEach(function(el){el.classList.remove('live');el.classList.add('done')})}
  return{
    step:function(text,kind){markDone();var li=document.createElement('li');li.className='dr-step live';li.innerHTML='<span>'+ic(kind||'search')+'</span><span>'+text+'</span>';stepsEl.appendChild(li);scrollBot()},
    setStatus:function(t,m){if(t)statusEl.textContent=t;if(m!=null)metaEl.textContent=m},
    showPapers:function(papers){
      papersEl.style.display='block';
      var h='<div style="font-size:.68rem;font-weight:600;color:#71717A;margin:8px 0 4px">PAPERS RETRIEVED ('+papers.length+')</div>';
      papers.slice(0,8).forEach(function(p,i){
        h+='<a class="dr-paper-chip" href="'+esc(p.url||p.pdf||'#')+'" target="_blank" rel="noopener"><span class="src">['+(i+1)+'] '+esc(p.source||'')+(p.year?' \u00b7 '+esc(p.year):'')+'</span><br>'+esc((p.title||'').slice(0,100))+'</a>';
      });
      papersEl.innerHTML=h;scrollBot();
    },
    finish:function(ok){
      markDone();
      statusEl.textContent=ok?'Sources ready \u2014 generating answer':'Research ended';
      metaEl.textContent=((Date.now()-start)/1000).toFixed(1)+'s';
      if(spinEl){spinEl.style.animation='none';spinEl.textContent=ok?'\u2713':'!';spinEl.style.border='none';spinEl.style.color=ok?'#34D399':'#FBBF24'}
    },
    fail:function(msg){this.step(msg||'Search failed','fail');this.finish(false)}
  };
}
function buildPrompt(topic,dr){
  var papers=dr.papers||[],lines=[];
  lines.push('[DEEP RESEARCH] Answer ONLY from the papers below (live arXiv + Semantic Scholar).');
  lines.push('Do NOT use training memory for paper claims. Cite [1],[2],\u2026');
  lines.push('Use markdown. Math: $inline$ and $$display$$ LaTeX. End with **Sources**.');
  lines.push('');lines.push('QUESTION: '+topic);lines.push('');
  lines.push('PAPERS ('+papers.length+'):');
  if(!papers.length)lines.push('(none \u2014 say so, do not invent citations)');
  papers.forEach(function(p,i){
    lines.push('');
    lines.push('['+(i+1)+'] '+(p.title||'')+' | '+(p.source||'')+(p.year?' | '+p.year:''));
    if(p.authors&&p.authors.length)lines.push('Authors: '+p.authors.join(', '));
    if(p.url)lines.push('URL: '+p.url);
    if(p.abstract)lines.push('Abstract: '+p.abstract);
  });
  return lines.join('\n');
}
ready(function(){
  installMathHooks();
  var buttons=[].slice.call(document.querySelectorAll('button'));
  var toolsBtn=buttons.find(function(b){return (b.textContent||'').trim()==='Tools'});
  if(!toolsBtn)return;
  var wrap=document.createElement('div');wrap.id='tools-wrap';wrap.style.position='relative';
  toolsBtn.parentNode.insertBefore(wrap,toolsBtn);wrap.appendChild(toolsBtn);toolsBtn.id='tools-btn';
  var menu=document.createElement('div');menu.id='tools-menu';
  menu.style.cssText='position:absolute;bottom:calc(100% + 8px);left:0;z-index:80;min-width:220px;padding:6px;border-radius:12px;background:#161618;border:1px solid #2D2D30;box-shadow:0 16px 40px rgba(0,0,0,.55);display:none;flex-direction:column;gap:2px';
  menu.innerHTML='<button type="button" id="tool-deep-research" style="display:flex;gap:10px;padding:10px 12px;border-radius:9px;cursor:pointer;border:none;background:transparent;text-align:left;width:100%;color:#D4D4D8;font-family:inherit"><span style="width:28px;height:28px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:rgba(245,158,11,.12)">\uD83D\uDCDA</span><span><div style="font-size:.78rem;font-weight:600;color:#E4E4E7">Deep Research</div><div style="font-size:.68rem;color:#71717A">arXiv + Semantic Scholar</div></span></button>';
  wrap.appendChild(menu);
  var on=false;
  var st=document.createElement('style');st.textContent='.dr-on{color:#F59E0B!important;background:rgba(245,158,11,.12)!important}';document.head.appendChild(st);
  toolsBtn.addEventListener('click',function(e){e.stopPropagation();menu.style.display=menu.style.display==='flex'?'none':'flex'});
  document.addEventListener('click',function(e){if(!e.target.closest('#tools-wrap'))menu.style.display='none'});
  document.getElementById('tool-deep-research').addEventListener('click',function(){
    on=!on;window.__angveyDeepResearchOn=on;toolsBtn.classList.toggle('dr-on',on);
    toolsBtn.title=on?'Deep Research ON':'Tools';menu.style.display='none';
  });
  window.__angveyDeepResearchSearch=async function(topic){
    var res=await fetch('/api/deep-research',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({topic:topic})});
    if(!res.ok){var err=await res.json().catch(function(){return{}});throw new Error(err.error||err.message||('HTTP '+res.status))}
    return res.json();
  };
  async function runDR(text){
    var chatMsgs=document.getElementById('chat-msgs');
    var chatView=document.getElementById('chat-view'),heroView=document.getElementById('hero-view');
    if(chatView&&heroView){heroView.classList.add('hide');chatView.classList.remove('hide');var s=document.getElementById('suggs');if(s)s.classList.add('hide')}
    var inputEl=document.getElementById('ci');if(inputEl){inputEl.value='';inputEl.style.height='auto'}
    if(chatMsgs){var ud=document.createElement('div');ud.className='mr u';ud.innerHTML='<div class="bb">'+esc(text).replace(/\n/g,'<br>')+'</div>';chatMsgs.appendChild(ud)}
    var panel=addPanel();if(!panel)return;
    panel.setStatus('Deep Research','arXiv \u00b7 Semantic Scholar');
    panel.step('Formulating academic search query from your question','search');
    var dr=null;
    try{
      await new Promise(function(r){setTimeout(r,150)});
      panel.step('Querying arXiv API for preprints matching the topic','search');
      var p=window.__angveyDeepResearchSearch(text);
      await new Promise(function(r){setTimeout(r,250)});
      panel.step('Querying Semantic Scholar graph (papers, venues, citations)','search');
      dr=await p;
      var a=(dr.sources&&dr.sources.arxiv)||0,b=(dr.sources&&dr.sources.semanticScholar)||0;
      panel.step('Fetched '+a+' results from arXiv + '+b+' from Semantic Scholar','done');
      panel.step('Deduplicating titles and ranking by relevance','read');
      var papers=dr.papers||[];
      if(papers.length){panel.showPapers(papers);panel.step('Extracted abstracts from '+papers.length+' unique papers','read')}
      else panel.step('No matching papers \u2014 answer will note the coverage gap','read');
      panel.step('Synthesizing answer grounded only in retrieved papers','write');
      panel.finish(true);
    }catch(e){panel.fail(String(e.message||e));dr={papers:[]}}
    var grounded=buildPrompt(text,dr||{papers:[]});
    var answerRow=document.createElement('div');answerRow.className='mr a';
    answerRow.innerHTML='<div class="aav"><img src="https://i.ibb.co/QvGDpxgQ/Screenshot-2026-04-26-204928.png" alt="" onerror="this.style.display=\'none\'"/></div><div class="abody"><div class="bb prose dr-answer"></div><div class="macts"><button class="cbtn" type="button">Copy</button></div></div>';
    if(chatMsgs)chatMsgs.appendChild(answerRow);
    var bubble=answerRow.querySelector('.bb'),copyBtn=answerRow.querySelector('.cbtn'),fullText='';
    copyBtn.addEventListener('click',function(){if(!fullText)return;navigator.clipboard.writeText(fullText).then(function(){copyBtn.textContent='Copied!';setTimeout(function(){copyBtn.textContent='Copy'},1500)}).catch(function(){})});
    function setBubble(txt,cur){
      fullText=txt||'';
      var html=fullText;
      if(typeof marked!=='undefined'&&marked.parse){try{html=marked.parse(fullText)}catch(e){}}
      else html=esc(fullText).replace(/\n/g,'<br>');
      bubble.innerHTML=html;if(cur)bubble.classList.add('cur');else bubble.classList.remove('cur');
      renderMath(bubble);var cv=document.getElementById('chat-view');if(cv)cv.scrollTop=cv.scrollHeight;
    }
    try{
      var sys='You are ANGVEY in DEEP RESEARCH mode. Answer ONLY using papers in the user message. Cite [n]. Markdown + $ / $$ LaTeX. Never invent papers.';
      var res=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({model:'qwen/qwen3.8-27b',max_tokens:1024,temperature:0.35,stream:true,messages:[{role:'system',content:sys},{role:'user',content:grounded}]})});
      if(!res.ok){var m='HTTP '+res.status;try{var j=await res.json();m=(j.error&&(j.error.message||j.error))||m}catch(e){}throw new Error(m)}
      setBubble('',true);
      var reader=res.body.getReader(),decoder=new TextDecoder(),buf='';
      outer:while(true){
        var chunk=await reader.read();if(chunk.done)break;
        buf+=decoder.decode(chunk.value,{stream:true});
        var lines=buf.split('\n');buf=lines.pop()||'';
        for(var i=0;i<lines.length;i++){
          var line=lines[i].trim();if(!line.startsWith('data:'))continue;
          var raw=line.slice(5).trim();if(raw==='[DONE]')break outer;
          try{var o=JSON.parse(raw);var d=o.choices&&o.choices[0]&&o.choices[0].delta&&o.choices[0].delta.content;if(d)setBubble(fullText+d,true);if(o.choices&&o.choices[0]&&o.choices[0].finish_reason)break outer}catch(e){}
        }
      }
      setBubble(fullText,false);
    }catch(err){bubble.classList.add('err');bubble.innerHTML='<strong>Research answer failed</strong><br><code>'+esc(err.message||err)+'</code>'}
  }
  var orig=null,tries=0;
  var iv=setInterval(function(){
    tries++;
    if(typeof send==='function'&&send!==orig){
      orig=send;
      send=async function(rawText,apiText){
        var text=(rawText||(document.getElementById('ci')&&document.getElementById('ci').value)||'').trim();
        if(window.__angveyDeepResearchOn&&text&&!apiText)return runDR(text);
        return orig(rawText,apiText);
      };
      clearInterval(iv);
    }
    if(tries>60)clearInterval(iv);
  },200);
});
})();
