/* ANGVEY Deep Research bootstrap */
(function () {
  function load(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }
  /* Known-good client (KaTeX + progress + paper grounding) */
  var CORE = 'https://cdn.jsdelivr.net/gh/lakshay99b-dotcom/angvey-public@732a04b08023d90fa166611e9823ec77865d4a49/deep-research-app.js';
  fetch(CORE)
    .then(function (r) { return r.text(); })
    .then(function (code) {
      try { (0, eval)(code); } catch (e) { console.error('DR core', e); }
      return load('./dr-drawer.js');
    })
    .catch(function (e) {
      console.error('DR bootstrap', e);
      load('./dr-drawer.js');
    });
})();
