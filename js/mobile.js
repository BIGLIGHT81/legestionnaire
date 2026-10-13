'use strict';
/* نسخة الهاتف: شريط علوي بزر القائمة، القائمة الجانبية كدرج منزلق، تسجيل عامل الخدمة (العمل دون إنترنت) */
(function () {
  const bar = document.createElement('div');
  bar.className = 'm-bar';
  bar.innerHTML = '<button type="button" id="mMenu" aria-label="القائمة">☰</button><img src="assets/icon256.png" alt=""><div class="m-t" id="mTitle">Le Gestionnaire</div><button type="button" id="mSearch" aria-label="بحث">⌕</button>';
  const ov = document.createElement('div'); ov.className = 'm-ov';
  document.body.appendChild(bar); document.body.appendChild(ov);
  const close = () => document.body.classList.remove('nav-open');
  document.getElementById('mMenu').onclick = () => document.body.classList.toggle('nav-open');
  document.getElementById('mSearch').onclick = () => { close(); if (window.Tools && Tools.openSearch) Tools.openSearch(); };
  ov.onclick = close;
  // a choice in the menu closes it
  document.querySelector('.side').addEventListener('click', e => { if (e.target.closest('a,[data-r],.nav-i,.nav-item,button')) setTimeout(close, 120); });
  // title of the page in the top bar
  const upd = () => { const h = document.querySelector('#view h1'); document.getElementById('mTitle').textContent = h ? h.textContent.trim() : 'Le Gestionnaire'; };
  new MutationObserver(upd).observe(document.getElementById('view'), { childList: true });
  // back button of the phone closes an open window or the menu first
  window.addEventListener('popstate', () => { if (document.body.classList.contains('nav-open')) close(); });
  // offline: the whole application is kept in the phone after the first opening
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {
      reg.addEventListener('updatefound', () => {
        const w = reg.installing;
        if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { try { toast('تحديث جديد للتطبيق جاهز: أغلق التطبيق وأعد فتحه'); } catch (_) {} } });
      });
    }).catch(() => {}));
  }
})();
