'use strict';
/* 1.9.4 — الواردات والصادرات والأرشيف (مكتب الضبط):
   - حفظ المذكرات الوزارية والجهوية والإقليمية وكل المراسلات الواردة: تاريخ الورود، رقم التسجيل (تلقائي لكل سنة)، المرجع، الموضوع، المصدر.
   - الصادرات من المؤسسة إلى المصالح: رقم الإرسال (تلقائي)، المرسل إليه، الموضوع، المرفقات.
   - تصنيف كل وثيقة في الأرشيف (صنف + رقم أرشيف تلقائي داخل الصنف) مع إمكانية إرفاق نسخة ممسوحة (PDF / صورة).
   - الطبع: سجل الواردات، سجل الصادرات، فهرس الأرشيف، بطاقة إحالة.
   Data: DB.mail = { items: [{ id, dir:'in'|'out', year, no, regDate, kind, party, ref, refDate, subject, cat, arch, box, action, notes, file:{name,size,b64} }], cats: [[code, name]] } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();

  const KINDS_IN = ['مذكرة وزارية', 'مذكرة جهوية (الأكاديمية)', 'مذكرة إقليمية (المديرية)', 'مراسلة', 'منشور / دورية', 'قرار', 'إرسالية', 'استدعاء', 'طلب', 'شكاية', 'أخرى'];
  const KINDS_OUT = ['مراسلة', 'تقرير', 'ورقة إرسال', 'جواب', 'محضر', 'طلب', 'بيان / إحصاء', 'أخرى'];
  const CATS0 = [['01', 'الموارد البشرية'], ['02', 'الشؤون التربوية'], ['03', 'شؤون التلاميذ'], ['04', 'التقويم والامتحانات'], ['05', 'التدبير المالي والمادي'], ['06', 'البنايات والتجهيز'], ['07', 'الحياة المدرسية والشراكة'], ['08', 'الصحة والسلامة'], ['09', 'مختلفات']];
  const PARTIES = ['الوزارة', 'الأكاديمية الجهوية للتربية والتكوين', 'المديرية الإقليمية', 'مصلحة الموارد البشرية', 'مصلحة الشؤون التربوية', 'مصلحة الشؤون القانونية والتواصل والشراكة', 'مصلحة التخطيط والخريطة المدرسية', 'مصلحة الشؤون الإدارية والمالية', 'السلطة المحلية', 'الجماعة', 'جمعية آباء وأمهات وأولياء التلاميذ'];

  function migrate(db) {
    const m = db.mail = db.mail && typeof db.mail === 'object' ? db.mail : {};
    m.items = Array.isArray(m.items) ? m.items : [];
    m.cats = Array.isArray(m.cats) && m.cats.length ? m.cats : CATS0.map(x => x.slice());
    m.items.forEach(x => { x.id = x.id || uid('ml'); x.dir = x.dir === 'out' ? 'out' : 'in'; });
  }
  const ML = () => { migrate(DB); return DB.mail; };
  const yearOf = d => +(String(d || Dx.todayIso()).slice(0, 4)) || new Date().getFullYear();
  const nextNo = (dir, y) => ML().items.filter(x => x.dir === dir && +x.year === y).reduce((m, x) => Math.max(m, +x.no || 0), 0) + 1;
  const nextArch = cat => ML().items.filter(x => x.cat === cat).reduce((m, x) => Math.max(m, +(String(x.arch || '').split('/').pop()) || 0), 0) + 1;
  const regNo = x => (x.no ? `${x.no}/${x.year}` : '');
  const catName = c => (ML().cats.find(x => x[0] === c) || [c, ''])[1];
  const archNo = x => (x.cat ? `${x.cat}/${String(x.arch || '').split('/').pop() || '?'}` : '');
  const kb = n => (n > 1048576 ? (n / 1048576).toFixed(1) + ' م.ب' : Math.max(1, Math.round(n / 1024)) + ' ك.ب');

  /* ---------- the edit dialog ---------- */
  function edit(it, dir, done) {
    const isNew = !it;
    const y0 = yearOf(Dx.todayIso());
    const f = it ? JSON.parse(JSON.stringify(it)) : { id: uid('ml'), dir, year: y0, no: nextNo(dir, y0), regDate: Dx.todayIso(), kind: dir === 'in' ? KINDS_IN[0] : KINDS_OUT[0], party: dir === 'in' ? 'المديرية الإقليمية' : 'المديرية الإقليمية', ref: '', refDate: '', subject: '', cat: '', arch: '', box: '', action: '', notes: '', file: null };
    const body = document.createElement('div');
    const D = () => [
      { k: 'no', l: dir === 'in' ? 'رقم التسجيل (الورود)' : 'رقم الإرسال', t: 'num', half: true, hint: `تلقائي لكل سنة — السنة ${f.year}` },
      { k: 'regDate', l: dir === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال', t: 'date', half: true },
      { k: 'kind', l: 'النوع', half: true, list: dir === 'in' ? 'mlKindsIn' : 'mlKindsOut' },
      { k: 'party', l: dir === 'in' ? 'المصدر (الجهة المرسلة)' : 'المرسل إليه', half: true, list: 'mlParties' },
      { k: 'ref', l: dir === 'in' ? 'رقم المذكرة / المراسلة الأصلي' : 'المرجع', half: true, dir: 'ltr' },
      { k: 'refDate', l: 'تاريخها', t: 'date', half: true },
      { k: 'subject', l: 'الموضوع', t: 'area', rows: 2 },
      { sec: 'الأرشيف' },
      { k: 'cat', l: 'صنف الأرشيف', t: 'select', opts: [['', '— بدون تصنيف —']].concat(ML().cats.map(([c, n]) => [c, `${c} — ${n}`])), half: true },
      { k: 'arch', l: 'رقم الأرشيف داخل الصنف', half: true, hint: 'يُعطى تلقائيا عند اختيار الصنف' },
      { k: 'box', l: 'مكان الحفظ (الملف / الرف / الصندوق)', half: true },
      { k: 'action', l: dir === 'in' ? 'الإجراء / الإحالة (إلى من)' : 'المرفقات', half: true },
      { k: 'notes', l: 'ملاحظات', t: 'area', rows: 2 }];
    const draw = () => {
      K.form(box, D, f, k => { if (k === 'regDate') { const y = yearOf(f.regDate); if (y !== +f.year) { f.year = y; if (isNew) f.no = nextNo(dir, y); draw(); } } if (k === 'cat') { f.arch = f.cat ? String(nextArch(f.cat)) : ''; draw(); } });
      fileBox();
    };
    const box = document.createElement('div');
    const fb = document.createElement('div');
    const fileBox = () => {
      fb.innerHTML = `<div class="sec-t" style="margin-top:8px">النسخة الممسوحة (اختياري)</div>
        <div class="btn-row" style="align-items:center">${f.file ? `<span class="tag" style="font-size:12.5px">📎 ${esc(f.file.name)} (${kb(f.file.size || 0)})</span><button type="button" class="btn sm" id="mlSave">${ic('down')} حفظ نسخة</button><button type="button" class="btn sm danger" id="mlDel">إزالة</button>` : ''}
          <button type="button" class="btn sm" id="mlAtt">${ic('up')} ${f.file ? 'تعويض الملف' : 'إرفاق ملف (PDF / صورة / Word)'}</button></div>
        <p class="muted" style="font-size:12px;margin:4px 0 0">يُحفظ الملف داخل معطيات البرنامج (15 م.ب كحد أقصى) ويُنقل مع النسخ الاحتياطية.</p>`;
      $('#mlAtt', fb).onclick = async () => { const r = await window.api.openAny('مذكرة / مراسلة'); if (!r) return; if (r.error) return toast('الملف كبير جدا (أكثر من 15 م.ب)', true); f.file = r; fileBox(); };
      if ($('#mlSave', fb)) $('#mlSave', fb).onclick = () => window.api.saveBin(f.file.b64, f.file.name);
      if ($('#mlDel', fb)) $('#mlDel', fb).onclick = () => { f.file = null; fileBox(); };
    };
    body.appendChild(box); body.appendChild(fb);
    body.insertAdjacentHTML('beforeend', `<datalist id="mlKindsIn">${KINDS_IN.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="mlKindsOut">${KINDS_OUT.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="mlParties">${PARTIES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`);
    draw();
    modal({ title: (isNew ? 'تسجيل ' : 'تعديل ') + (dir === 'in' ? 'وارد' : 'صادر'), size: 'lg', body, actions: [
      { label: ic('check') + ' حفظ', cls: 'pri', onClick: () => {
        if (!nm(f.subject)) { toast('اكتب موضوع الوثيقة', true); return false; }
        f.no = +f.no || nextNo(dir, +f.year); f.year = yearOf(f.regDate);
        if (ML().items.some(x => x.id !== f.id && x.dir === dir && +x.year === +f.year && +x.no === +f.no)) { toast(`الرقم ${f.no}/${f.year} مستعمل من قبل`, true); return false; }
        if (f.cat && !nm(f.arch)) f.arch = String(nextArch(f.cat));
        const i = ML().items.findIndex(x => x.id === f.id);
        if (i >= 0) ML().items[i] = f; else ML().items.push(f);
        persist(); toast('تم الحفظ'); done && done(); } },
      it ? { label: 'حذف', cls: 'danger', onClick: async () => { if (!await confirmBox('حذف هذا التسجيل نهائيا؟', 'حذف')) return false; ML().items = ML().items.filter(x => x.id !== f.id); persist(); done && done(); } } : null,
      { label: 'إلغاء' }].filter(Boolean) });
  }

  /* ---------- the page ---------- */
  const st = { dir: 'in', y: '', cat: '', q: '', kind: '' };
  function page(v, arg) {
    if (arg && arg.dir) st.dir = arg.dir;
    const all = ML().items;
    const years = Array.from(new Set(all.map(x => +x.year).concat([yearOf()]))).sort((a, b) => b - a);
    if (!st.y) st.y = String(years[0]);
    const L = all.filter(x => (st.dir === 'arch' ? !!x.cat : x.dir === st.dir) && (st.dir === 'arch' || !st.y || +x.year === +st.y) && (!st.cat || x.cat === st.cat) && (!st.kind || x.kind === st.kind)
      && (!st.q || [x.subject, x.party, x.ref, x.kind, regNo(x), archNo(x), x.notes, x.box].join(' ').toLowerCase().includes(st.q.toLowerCase())))
      .sort((a, b) => st.dir === 'arch' ? String(a.cat).localeCompare(String(b.cat)) || (+String(a.arch).split('/').pop() || 0) - (+String(b.arch).split('/').pop() || 0) : (+b.year - +a.year) || (+b.no - +a.no));
    const cnt = d => all.filter(x => x.dir === d && +x.year === +st.y).length;
    const kinds = Array.from(new Set(all.filter(x => x.dir === st.dir).map(x => x.kind).filter(Boolean)));
    v.innerHTML = `<div class="page-h"><h1>الواردات والصادرات والأرشيف</h1><span class="sub">مكتب الضبط</span><span class="sp"></span>
        ${st.dir !== 'arch' ? `<button class="btn pri" id="mlNew">${ic('plus')} ${st.dir === 'in' ? 'تسجيل وارد (مذكرة / مراسلة)' : 'تسجيل صادر'}</button>` : ''}
        <button class="btn" id="mlPrint">${ic('print')} ${st.dir === 'in' ? 'سجل الواردات' : st.dir === 'out' ? 'سجل الصادرات' : 'فهرس الأرشيف'}</button>
        <button class="btn" id="mlCats">${ic('gear')} أصناف الأرشيف</button></div>
      <div class="seg" id="mlDir" style="margin-bottom:10px"><button data-d="in">الواردات (${cnt('in')})</button><button data-d="out">الصادرات (${cnt('out')})</button><button data-d="arch">الأرشيف المصنف (${all.filter(x => x.cat).length})</button></div>
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="flex-wrap:wrap;align-items:center;gap:8px">
        ${st.dir !== 'arch' ? `<select class="inp" id="mlY" style="width:auto">${years.map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select>` : ''}
        <select class="inp" id="mlC" style="width:auto"><option value="">كل الأصناف</option>${ML().cats.map(([c, n]) => `<option value="${esc(c)}" ${st.cat === c ? 'selected' : ''}>${esc(c)} — ${esc(n)}</option>`).join('')}</select>
        ${st.dir !== 'arch' && kinds.length ? `<select class="inp" id="mlK" style="width:auto"><option value="">كل الأنواع</option>${kinds.map(k => `<option ${st.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>` : ''}
        <input class="inp" id="mlQ" placeholder="بحث: الموضوع، الرقم، المرجع، الجهة..." value="${esc(st.q)}" style="max-width:300px"><span class="sp"></span><span class="muted">${L.length} وثيقة</span></div></div>
      <div class="card"><div id="mlT"></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.8">رقم التسجيل يُعطى تلقائيا لكل سنة (مثلا <b dir="ltr">12/2026</b>)، وكذلك رقم الأرشيف داخل كل صنف (مثلا <b dir="ltr">02/7</b>). يمكن إرفاق النسخة الممسوحة لكل مذكرة أو مراسلة والرجوع إليها أو حفظ نسخة منها في أي وقت.</p>`;
    $('#mlT').innerHTML = L.length ? `<table class="tbl"><thead><tr>${st.dir === 'arch' ? '<th>رقم الأرشيف</th><th>الصنف</th><th>وارد/صادر</th>' : `<th>${st.dir === 'in' ? 'رقم التسجيل' : 'رقم الإرسال'}</th><th>${st.dir === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال'}</th>`}<th>النوع</th><th>${st.dir === 'out' ? 'المرسل إليه' : 'المصدر'}</th><th>المرجع</th><th>الموضوع</th>${st.dir === 'arch' ? '<th>مكان الحفظ</th>' : '<th>الأرشيف</th>'}<th></th></tr></thead><tbody>
      ${L.map(x => `<tr data-id="${x.id}">${st.dir === 'arch' ? `<td class="num b" dir="ltr">${esc(archNo(x))}</td><td>${esc(catName(x.cat))}</td><td>${x.dir === 'in' ? 'وارد ' : 'صادر '}<span class="muted" dir="ltr">${esc(regNo(x))}</span></td>` : `<td class="num b" dir="ltr">${esc(regNo(x))}</td><td class="num">${esc(Dx.fmtDate(x.regDate))}</td>`}
        <td>${esc(x.kind || '')}</td><td>${esc(x.party || '')}</td><td dir="ltr" style="text-align:right">${esc(x.ref || '')}${x.refDate ? `<br><span class="muted">${esc(Dx.fmtDate(x.refDate))}</span>` : ''}</td><td>${esc(x.subject || '')}</td>
        <td>${st.dir === 'arch' ? esc(x.box || '') : x.cat ? `<span class="tag" dir="ltr">${esc(archNo(x))}</span>` : '<span class="muted">—</span>'}</td>
        <td class="act">${x.file ? `<button class="btn sm" data-f="${x.id}" title="${esc(x.file.name)}">📎</button>` : ''}<button class="btn sm" data-s="${x.id}" title="بطاقة إحالة">${ic('print')}</button><button class="btn sm" data-e="${x.id}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table>`
      : `<div class="empty-state">${st.dir === 'arch' ? 'لا توجد وثائق مصنفة في الأرشيف بعد (اختر صنفا عند تسجيل وارد أو صادر).' : 'لا توجد تسجيلات في هذه السنة.'}</div>`;
    $$('#mlDir button').forEach(b => { b.classList.toggle('on', b.dataset.d === st.dir); b.onclick = () => { st.dir = b.dataset.d; st.kind = ''; page(v); }; });
    if ($('#mlY')) $('#mlY').onchange = e => { st.y = e.target.value; page(v); };
    $('#mlC').onchange = e => { st.cat = e.target.value; page(v); };
    if ($('#mlK')) $('#mlK').onchange = e => { st.kind = e.target.value; page(v); };
    $('#mlQ').oninput = e => { st.q = e.target.value; clearTimeout(page.t); page.t = setTimeout(() => { page(v); const q = $('#mlQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); };
    if ($('#mlNew')) $('#mlNew').onclick = () => edit(null, st.dir, () => page(v));
    $$('[data-e]', v).forEach(b => b.onclick = () => { const x = all.find(i => i.id === b.dataset.e); edit(x, x.dir, () => page(v)); });
    $$('[data-f]', v).forEach(b => b.onclick = () => { const x = all.find(i => i.id === b.dataset.f); if (x && x.file) window.api.saveBin(x.file.b64, x.file.name); });
    $$('[data-s]', v).forEach(b => b.onclick = () => go('mailDoc', { kind: 'slip', id: b.dataset.s }));
    $('#mlPrint').onclick = () => go('mailDoc', { kind: st.dir === 'arch' ? 'arch' : st.dir, y: st.y, cat: st.cat });
    $('#mlCats').onclick = () => cats(() => page(v));
  }
  function cats(done) {
    const L = ML().cats.map(x => x.slice());
    const body = document.createElement('div');
    const draw = () => {
      body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.5px">رمز الصنف يسبق رقم الأرشيف (مثلا 02/7). يمكنك تعديل الأصناف أو إضافة أصناف جديدة.</p>
        ${L.map((c, i) => `<div style="display:grid;grid-template-columns:80px 1fr 34px;gap:6px;margin-bottom:5px"><input class="inp" data-c="${i}" value="${esc(c[0])}" dir="ltr"><input class="inp" data-n="${i}" value="${esc(c[1])}"><button class="btn sm danger icon" data-x="${i}">✕</button></div>`).join('')}
        <button class="btn sm" id="mcAdd">${ic('plus')} صنف جديد</button>`;
      $$('[data-c]', body).forEach(el => el.oninput = () => { L[+el.dataset.c][0] = el.value.trim(); });
      $$('[data-n]', body).forEach(el => el.oninput = () => { L[+el.dataset.n][1] = el.value.trim(); });
      $$('[data-x]', body).forEach(b => b.onclick = () => { if (ML().items.some(x => x.cat === L[+b.dataset.x][0])) return toast('صنف مستعمل في الأرشيف: لا يمكن حذفه', true); L.splice(+b.dataset.x, 1); draw(); });
      $('#mcAdd', body).onclick = () => { L.push([String(L.length + 1).padStart(2, '0'), '']); draw(); };
    };
    draw();
    modal({ title: 'أصناف الأرشيف', body, actions: [{ label: ic('check') + ' حفظ', cls: 'pri', onClick: () => { ML().cats = L.filter(c => c[0] && c[1]); persist(); done && done(); } }, { label: 'إلغاء' }] });
  }

  /* ---------- printed registers ---------- */
  function docPage(v, arg) {
    arg = arg || {};
    const kind = arg.kind || 'in';
    const it = ML().items.find(x => x.id === arg.id);
    const titles = { in: 'سجل الواردات', out: 'سجل الصادرات', arch: 'فهرس الأرشيف', slip: 'بطاقة إحالة / تأشير' };
    MK.docPage(v, {
      title: titles[kind], icon: '🗄️', modes: false, flow: true, state: { y: arg.y || String(yearOf()), cat: arg.cat || '', to: '', note: '' },
      back: () => go('mail', { dir: kind === 'slip' ? (it ? it.dir : 'in') : kind }),
      fname: st => `${titles[kind]}_${st.y || ''}`,
      form: (box, st, refresh) => {
        const years = Array.from(new Set(ML().items.map(x => +x.year).concat([yearOf()]))).sort((a, b) => b - a);
        box.innerHTML = kind === 'slip' ? `<div class="fld"><label>يحال إلى</label><input class="inp" id="mdTo" list="k2Emps"></div><div class="fld"><label>التأشيرة / التعليمات</label><textarea class="inp" id="mdN" rows="3"></textarea></div>${K.dl ? K.dl('k2Emps', K.E.names()) : ''}`
          : `${kind !== 'arch' ? `<div class="fld"><label>السنة</label><select class="inp" id="mdY">${years.map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>` : ''}
            <div class="fld"><label>الصنف</label><select class="inp" id="mdC"><option value="">كل الأصناف</option>${ML().cats.map(([c, n]) => `<option value="${esc(c)}" ${st.cat === c ? 'selected' : ''}>${esc(c)} — ${esc(n)}</option>`).join('')}</select></div>`;
        if ($('#mdY', box)) $('#mdY', box).onchange = e => { st.y = e.target.value; refresh(); };
        if ($('#mdC', box)) $('#mdC', box).onchange = e => { st.cat = e.target.value; refresh(); };
        if ($('#mdTo', box)) $('#mdTo', box).oninput = e => { st.to = e.target.value; refresh(); };
        if ($('#mdN', box)) $('#mdN', box).oninput = e => { st.note = e.target.value; refresh(); };
        refresh();
      },
      build: st => {
        const s = S();
        if (kind === 'slip') {
          const x = it || {};
          return { page: 'a4', pages: MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'بطاقة إحالة / تأشير'), blocks: [
            { table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:28%"><col style="width:72%"></colgroup>', rows: [
              ['رقم التسجيل', `<bdi dir="ltr">${esc(regNo(x))}</bdi>`], [x.dir === 'out' ? 'تاريخ الإرسال' : 'تاريخ الورود', esc(Dx.fmtDate(x.regDate))], ['النوع', esc(x.kind || '')], [x.dir === 'out' ? 'المرسل إليه' : 'المصدر', esc(x.party || '')],
              ['المرجع', `<bdi dir="ltr">${esc(x.ref || '')}</bdi> ${x.refDate ? esc(Dx.fmtDate(x.refDate)) : ''}`], ['الموضوع', `<b>${esc(x.subject || '')}</b>`], ['رقم الأرشيف', `<bdi dir="ltr">${esc(archNo(x))}</bdi> ${x.cat ? esc(catName(x.cat)) : ''}`],
              ['يحال إلى', esc(st.to || x.action || '')], ['التأشيرة / التعليمات', `${esc(st.note || '')}<div style="height:26mm"></div>`]].map(([a, b]) => tr([{ t: a, c: 'k' }, { h: b }])) } },
            SB.sign(s, { right: '<span class="d">توقيع المعني(ة) بالتسلم</span>', left: 'تأشيرة مدير(ة) المؤسسة' })] }) };
        }
        const L = ML().items.filter(x => (kind === 'arch' ? !!x.cat : x.dir === kind && +x.year === +st.y) && (!st.cat || x.cat === st.cat))
          .sort((a, b) => kind === 'arch' ? String(a.cat).localeCompare(String(b.cat)) || (+String(a.arch).split('/').pop() || 0) - (+String(b.arch).split('/').pop() || 0) : (+a.no - +b.no));
        let head, rows;
        if (kind === 'arch') {
          head = thr(['رقم الأرشيف', 'الصنف', 'وارد / صادر', 'التاريخ', 'الجهة', 'المرجع', 'الموضوع', 'مكان الحفظ'].map(t => ({ t, c: 'd' })));
          rows = L.map(x => tr([{ h: `<bdi dir="ltr">${esc(archNo(x))}</bdi>`, c: 'b' }, { t: catName(x.cat), c: 'sm' }, { h: `${x.dir === 'in' ? 'وارد' : 'صادر'} <bdi dir="ltr">${esc(regNo(x))}</bdi>`, c: 'sm' }, { t: ldate(x.regDate), c: 'sm' }, { t: x.party || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(x.ref || '')}</bdi>`, c: 'sm' }, { t: x.subject || '', c: 'r' }, { t: x.box || '', c: 'sm' }]));
        } else {
          head = thr([kind === 'in' ? 'رقم التسجيل' : 'رقم الإرسال', kind === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال', 'النوع', kind === 'in' ? 'المصدر' : 'المرسل إليه', 'المرجع وتاريخه', 'الموضوع', kind === 'in' ? 'الإحالة / الإجراء' : 'المرفقات', 'رقم الأرشيف'].map(t => ({ t, c: 'd' })));
          rows = L.map(x => tr([{ h: `<bdi dir="ltr">${esc(regNo(x))}</bdi>`, c: 'b' }, { t: ldate(x.regDate), c: 'sm' }, { t: x.kind || '', c: 'sm' }, { t: x.party || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(x.ref || '')}</bdi>${x.refDate ? ' — ' + esc(ldate(x.refDate)) : ''}`, c: 'sm' }, { t: x.subject || '', c: 'r' }, { t: x.action || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(archNo(x))}</bdi>`, c: 'sm' }]));
        }
        for (let i = rows.length; i < 10; i++) rows.push(tr(Array.from({ length: 8 }, (_, j) => (j === 7 ? { t: '', st: 'height:7mm' } : ''))));
        const t = kind === 'arch' ? `فهرس الأرشيف${st.cat ? ' — ' + st.cat + ' ' + catName(st.cat) : ''}` : `${titles[kind]} — سنة ${st.y}${st.cat ? ' — ' + catName(st.cat) : ''}`;
        return { page: 'a4l', pages: SB.pages(s, { title: t, page: 'a4l', blocks: [tbl(head, rows, 'cmp')], sign: SB.sign(s, { left: 'توقيع وطابع مدير(ة) المؤسسة' }) }) };
      }
    });
  }

  window.Mail = { migrate, items: () => ML().items, regNo, archNo };
  window.pageMail = (v, a) => { migrate(DB); page(v, a); };
  window.pageMailDoc = (v, a) => { migrate(DB); docPage(v, a); };
})();
