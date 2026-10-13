'use strict';
/* 1.9.4 — لغة البرنامج: العربية (الأصل) أو الفرنسية.
   La traduction couvre toute l'interface (menus, onglets, boutons, formulaires, tableaux, fenêtres, messages) : chaque texte affiché
   est remplacé à la volée à partir du dictionnaire `I18N_FR` (js/i18n_fr.js). Les documents administratifs officiels générés
   (aperçus et impressions) restent dans leur langue d'origine. Les nombres d'un texte sont gardés (clé normalisée « # »). */
(function () {
  const AR = /[؀-ۿ]/;
  const SKIP = 'iframe, .page-a4, .page-a4l, .sheet, textarea, [contenteditable="true"], .no-i18n, .wm';
  let lang = 'ar', DICT = null, PATS = null, obs = null, busy = false;
  const norm = s => String(s || '').replace(/\s+/g, ' ').trim();
  const load = () => {
    if (DICT) return;
    DICT = new Map();
    const src = window.I18N_FR || {};
    Object.keys(src).forEach(k => DICT.set(norm(k), src[k]));
    // patterns written with {0} {1}... (dynamic parts: names, counts)
    PATS = Object.keys(window.I18N_FR_PAT || {}).map(k => {
      const parts = k.split(/\{\d+\}/).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
      return { rx: new RegExp('^' + parts.join('(.+?)') + '$'), fr: window.I18N_FR_PAT[k] };
    });
  };
  const DELIM = /(\s+(?:—|–|·|\|)\s+|\s*(?::|،|؛|\n)\s*)/;
  function tr(s) {
    const n = norm(s); if (!n || !AR.test(n)) return null;
    let v = DICT.get(n); if (v != null) return v;
    // numbers kept: «الموسم الدراسي 2026-2027» -> key «الموسم الدراسي #-#»
    const nums = n.match(/\d+/g);
    if (nums) { v = DICT.get(n.replace(/\d+/g, '#')); if (v != null) { let i = 0; return v.replace(/#/g, () => (nums[i++] != null ? nums[i - 1] : '#')); } }
    for (const p of PATS) { const m = p.rx.exec(n); if (m) return p.fr.replace(/\{(\d+)\}/g, (_, i) => { const x = m[+i + 1] || ''; return tr(x) || x; }); }
    // an icon / symbol before the text («🩹 الحوادث المدرسية», «✔ متمكن»)
    const pm = /^([^\u0600-\u06FF\w«(]+)(.+)$/u.exec(n);
    if (pm && AR.test(pm[2])) { const r = tr(pm[2]); if (r != null) return pm[1] + r; }
    // «label: value», «a — b», «(x)»: each piece
    const parts = n.split(DELIM);
    if (parts.length > 1) {
      let hit = false;
      const out = parts.map(p => { if (!AR.test(p)) return p; const q = p.trim(); const t = DICT.get(q) || (q.match(/\d/) ? (() => { const ns = q.match(/\d+/g); const w = DICT.get(q.replace(/\d+/g, '#')); if (w == null) return null; let i = 0; return w.replace(/#/g, () => ns[i++] || '#'); })() : null); if (t != null) { hit = true; return p.replace(q, t); } return p; }).join('');
      if (hit) return out;
    }
    return null;
  }
  const skipEl = el => !el || el.closest(SKIP) || /^(SCRIPT|STYLE|TEXTAREA)$/.test(el.tagName);
  function textNode(t) {
    const p = t.parentElement; if (skipEl(p)) return;
    const v = t.nodeValue; if (!AR.test(v)) return;
    const r = tr(v); if (r == null) return;
    const lead = v.match(/^\s*/)[0], trail = v.match(/\s*$/)[0];
    t.__ar = v; t.nodeValue = lead + r + trail;
  }
  function attrs(el) {
    if (skipEl(el)) return;
    ['placeholder', 'title', 'label'].forEach(a => { const v = el.getAttribute && el.getAttribute(a); if (v && AR.test(v)) { const r = tr(v); if (r != null) el.setAttribute(a, r); } });
  }
  function walk(root) {
    if (!root) return;
    if (root.nodeType === 3) return textNode(root);
    if (root.nodeType !== 1 || skipEl(root)) return;
    attrs(root);
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT, { acceptNode: n => (n.nodeType === 1 && n.closest && n.matches && n.matches(SKIP) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT) });
    const L = []; while (w.nextNode()) L.push(w.currentNode);
    L.forEach(n => (n.nodeType === 3 ? textNode(n) : attrs(n)));
  }
  function start() {
    load();
    document.documentElement.setAttribute('dir', 'ltr'); document.documentElement.setAttribute('lang', 'fr');
    document.body.classList.add('lang-fr');
    busy = true; walk(document.body); busy = false;
    if (obs) obs.disconnect();
    obs = new MutationObserver(ms => {
      if (busy) return; busy = true;
      try { ms.forEach(m => { if (m.type === 'characterData') textNode(m.target); else if (m.type === 'attributes') attrs(m.target); else m.addedNodes.forEach(walk); }); } finally { busy = false; }
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'label'] });
  }
  function stop() {
    if (obs) obs.disconnect(); obs = null;
    const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT); while (w.nextNode()) { const t = w.currentNode; if (t.__ar != null) { t.nodeValue = t.__ar; delete t.__ar; } }
    document.documentElement.setAttribute('dir', 'rtl'); document.documentElement.setAttribute('lang', 'ar');
    document.body.classList.remove('lang-fr');
  }
  window.I18N = {
    get: () => lang,
    // applied at start-up (settings.lang) and from the settings page; the page is redrawn by the caller
    set(l) { lang = l === 'fr' ? 'fr' : 'ar'; if (lang === 'fr') start(); else stop(); },
    t: s => (lang === 'fr' ? (load(), tr(s) || s) : s),
    tr: s => { load(); return tr(s); },
    size: () => { load(); return DICT.size; }
  };
})();
