/* Deep Research loader - stitches parts */
(function(){
  function run(code){ try { (0,eval)(code); } catch(e){ console.error('DR load', e); } }
  Promise.all([
    fetch('./dr-part1.js').then(function(r){return r.text()}),
    fetch('./dr-part2.js').then(function(r){return r.text()})
  ]).then(function(parts){ run(parts[0]+parts[1]); }).catch(function(e){ console.error(e); });
})();
