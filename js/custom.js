'use strict';
/* 1.9.2 — تخصيص الوثائق: نسخ مخصصة من وثائق خانة «الوثائق» حسب خصوصيات كل مؤسسة، مع بقاء النموذج الأصلي كما هو.
   A variant = { id, type, name, rules }: rules = { rep: [[find, replace]…], top, bot, font, scale, hideHdr }.
   Rules are applied to the generated document (text nodes, extra paragraphs, font), so the original templates are never touched. */
(function () {
  const list = () => { const s = (DB.settings = DB.settings || {}); return (s.docVariants = Array.isArray(s.docVariants) ? s.docVariants : []); };
  const byType = type => list().filter(v => v.type === type);
  const byId = id => list().find(v => v.id === id) || null;
  const empty = () => ({ rep: [], top: '', bot: '', font: '', scale: 100, hideHdr: false });
  const isEmpty = r => !r || (!r.html && !(r.rep || []).some(p => p && p[0]) && !r.top && !r.bot && !r.font && (+r.scale || 100) === 100 && !r.hideHdr);

  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const paras = (t, cls) => String(t || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean).map(x => `<p class="${cls}" style="margin:1.2mm 0;text-align:justify">${escH(x)}</p>`).join('');

  function apply(html, rules) {
    // 1.9.4: a document edited in the full editor is kept as it was edited
    if (rules && rules.html) return rules.html;
    if (isEmpty(rules)) return html;
    let doc;
    try { doc = new DOMParser().parseFromString(html, 'text/html'); } catch (_) { return html; }
    const reps = (rules.rep || []).filter(p => p && p[0]);
    if (reps.length) {
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
      const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
      nodes.forEach(n => { let t = n.nodeValue; reps.forEach(([a, b]) => { if (t.includes(a)) t = t.split(a).join(b == null ? '' : b); }); if (t !== n.nodeValue) n.nodeValue = t; });
    }
    const copies = Array.from(doc.querySelectorAll('.copy'));
    const pg = Array.from(doc.querySelectorAll('.page-a4,.page-a4l'));
    const add = (c, top, bot) => {
      if (top) { const d = doc.createElement('div'); d.className = 'cx-top'; d.innerHTML = paras(rules.top, 'cx-p'); const h = c.querySelector('[class*="hdr"],[class*="head"]'); if (h && h.parentNode === c) h.after(d); else c.prepend(d); }
      if (bot) { const d = doc.createElement('div'); d.className = 'cx-bot'; d.innerHTML = paras(rules.bot, 'cx-p'); c.append(d); }
    };
    if (copies.length) copies.forEach(c => add(c, !!rules.top, !!rules.bot));
    else if (pg.length) { add(pg[0], !!rules.top, false); add(pg[pg.length - 1], false, !!rules.bot); }
    else add(doc.body, !!rules.top, !!rules.bot);
    let css = '';
    if (rules.font) css += `body,.copy,.copy *,.page-a4,.page-a4 *,.page-a4l,.page-a4l *{font-family:'${String(rules.font).replace(/['"<>;{}]/g, '')}','MAJ','NSA',serif !important}`;
    const sc = +rules.scale || 100;
    if (sc !== 100) css += `.copy{font-size:${(9.6 * sc / 100).toFixed(2)}pt !important}.copy p,.copy td,.copy th,.copy div{font-size:inherit}`;
    if (rules.hideHdr) css += `.copy [class*="hdr"],.page-a4 [class*="hdr"],.page-a4l [class*="hdr"]{display:none !important}`;
    if (css) { const st = doc.createElement('style'); st.textContent = css; doc.head.appendChild(st); }
    return '<!DOCTYPE html>' + doc.documentElement.outerHTML;
  }

  // text lines of a generated document (to pick the wording to change)
  function lines(html) {
    try {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT), out = [], seen = new Set();
      while (w.nextNode()) { const t = w.currentNode.nodeValue.replace(/\s+/g, ' ').trim(); if (t.length >= 4 && !seen.has(t) && !/^[\d\s\/\-.:]+$/.test(t)) { seen.add(t); out.push(t); } }
      return out;
    } catch (_) { return []; }
  }

  // 1.9.4: «تخصيص النموذج» opens the full Word-like editor; the former rules dialog stays available as «الوضع البسيط».
  function dialog(o) {
    const { type, title, v, html, cb } = o;
    if (!window.WordEdit) return simple(o);
    const del = async () => { if (!await confirmBox('ستُحذف النسخة المخصصة ويبقى النموذج الأصلي. متابعة؟', 'حذف')) return false; const i = list().indexOf(v); if (i >= 0) list().splice(i, 1); persist(); toast('حُذفت النسخة المخصصة'); cb && cb(null); return true; };
    WordEdit.open({ html: (v && v.rules && v.rules.html) || apply(html || '', v && v.rules), title, v,
      onSimple: () => simple(o), onDelete: v ? del : null,
      onSave: (name, h) => {
        let nv = v && v.rules && v.rules.html ? v : null;
        if (!nv) { nv = { id: uid('dv'), type, name, rules: { html: h }, created: new Date().toISOString() }; list().push(nv); } else { nv.name = name; nv.rules = { html: h }; }
        persist(); cb && cb(nv);
      } });
  }
  // dialog: v = existing variant or null (new). cb(variant) after save.
  function simple({ type, title, v, html, cb }) {
    if (v && v.rules && v.rules.html) v = null; // an edited copy cannot be changed with rules: a new copy is created
    const r = Object.assign(empty(), JSON.parse(JSON.stringify((v && v.rules) || {})));
    if (!r.rep.length) r.rep = [['', '']];
    const body = document.createElement('div');
    const L = lines(html || '').slice(0, 120);
    const draw = () => {
      body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.8px;line-height:1.8">النموذج الأصلي يبقى كما هو دائما. هنا تُنشئ <b>نسخة خاصة بمؤسستك</b> منه: بدّل أي عبارة بعبارة أخرى، أضف فقرة في أعلى الوثيقة أو أسفلها، وغيّر الخط وحجمه. تظهر النسخة في صفحة «الوثائق» بجانب الأصل.</p>
        <div class="fld"><label>اسم النسخة المخصصة</label><input class="inp" id="cxN" value="${escH((v && v.name) || ('نسخة ' + (title || '')))}"></div>
        <div class="sec-t">تبديل العبارات</div>
        <div id="cxR">${r.rep.map((p, i) => `<div style="display:grid;grid-template-columns:1fr 1fr 32px;gap:6px;margin-bottom:5px"><input class="inp cx-f" data-i="${i}" placeholder="العبارة الحالية في الوثيقة" value="${escH(p[0])}" list="cxL"><input class="inp cx-r" data-i="${i}" placeholder="العبارة البديلة (اتركها فارغة للحذف)" value="${escH(p[1])}"><button type="button" class="btn sm danger icon" data-del="${i}">✕</button></div>`).join('')}</div>
        <datalist id="cxL">${L.map(t => `<option value="${escH(t)}">`).join('')}</datalist>
        <div class="btn-row"><button type="button" class="btn sm" id="cxAdd">+ إضافة تبديل</button></div>
        <p class="muted" style="font-size:12px;margin:4px 0 8px">انقر في خانة «العبارة الحالية» لاختيار نص من الوثيقة الحالية، أو اكتب جزءا منه. يعمل التبديل في كل مكان تظهر فيه العبارة.</p>
        <div class="sec-t">فقرات إضافية</div>
        <div class="fld"><label>فقرة تُضاف أعلى الوثيقة (بعد الترويسة)</label><textarea class="inp" id="cxT" rows="2">${escH(r.top)}</textarea></div>
        <div class="fld"><label>فقرة تُضاف أسفل الوثيقة</label><textarea class="inp" id="cxB" rows="2">${escH(r.bot)}</textarea></div>
        <div class="sec-t">الشكل</div>
        <div class="fgrid"><div class="fld"><label>الخط</label><select class="inp" id="cxF"></select></div><div class="fld"><label>حجم الخط %</label><input class="inp" type="number" min="70" max="140" step="5" id="cxS" value="${+r.scale || 100}"></div></div>
        <label class="chk"><input type="checkbox" id="cxH" ${r.hideHdr ? 'checked' : ''}> إخفاء الترويسة (للطباعة على ورق مروّس)</label>`;
      const sel = body.querySelector('#cxF'); const fonts = ['', 'MAJ', 'Amiri', 'NSA'].concat(CX.fonts);
      sel.innerHTML = Array.from(new Set(fonts)).map(f => `<option value="${escH(f)}" ${f === r.font ? 'selected' : ''}>${f || 'الخط الافتراضي'}</option>`).join('');
      const sync = () => { r.rep = Array.from(body.querySelectorAll('.cx-f')).map((el, i) => [el.value, body.querySelectorAll('.cx-r')[i].value]); r.top = body.querySelector('#cxT').value; r.bot = body.querySelector('#cxB').value; r.font = sel.value; r.scale = +body.querySelector('#cxS').value || 100; r.hideHdr = body.querySelector('#cxH').checked; };
      body.querySelector('#cxAdd').onclick = () => { sync(); r.rep.push(['', '']); draw(); };
      body.querySelectorAll('[data-del]').forEach(b => b.onclick = () => { sync(); r.rep.splice(+b.dataset.del, 1); if (!r.rep.length) r.rep = [['', '']]; draw(); });
      body.sync = sync;
    };
    draw();
    modal({ title: 'تخصيص الوثيقة: ' + title, size: 'lg', body, actions: [
      { label: ic('check') + (v ? ' حفظ التعديلات' : ' حفظ كنسخة مخصصة'), cls: 'pri', onClick: () => {
        body.sync(); r.rep = r.rep.filter(p => p[0]);
        const name = body.querySelector('#cxN').value.trim() || ('نسخة ' + title);
        let nv = v; if (!nv) { nv = { id: uid('dv'), type, name, rules: r, created: new Date().toISOString() }; list().push(nv); } else { nv.name = name; nv.rules = r; }
        persist(); toast('تم حفظ النسخة المخصصة'); cb && cb(nv); } },
      v ? { label: 'حذف هذه النسخة', cls: 'danger', onClick: async () => { if (!await confirmBox('ستُحذف النسخة المخصصة ويبقى النموذج الأصلي. متابعة؟', 'حذف')) return false; const i = list().indexOf(v); if (i >= 0) list().splice(i, 1); persist(); toast('حُذفت النسخة المخصصة'); cb && cb(null); } } : null,
      { label: 'إلغاء' }].filter(Boolean) });
  }
  const CX = { list, byType, byId, apply, lines, dialog, simple, isEmpty, fonts: [] };
  if (window.api && window.api.fontsList) window.api.fontsList().then(l => { if (Array.isArray(l)) CX.fonts = l; }).catch(() => {});
  window.DocCustom = CX;
})();
