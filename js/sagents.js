'use strict';
/* 1.9.4 — الموارد البشرية ← «أعوان الحراسة والنظافة» (شركات المناولة):
   - بطاقة لكل عون(ة): الصنف (حراسة / نظافة / طبخ وإطعام...)، الشركة المشغلة، رقم الصفقة / العقد، الوحدة المدرسية (من الإعدادات)، الفترة، الهاتف...
   - تتبع القيام بالأعمال يوما بيوم: الحضور (حاضر، غائب، متأخر) والمهام المنجزة لكل عون(ة) وملاحظات.
   - الحصيلة الشهرية لكل عون(ة) ولكل شركة، والوثائق: لائحة الأعوان، بطاقة العون(ة)، ورقة التتبع الشهري، تقرير تقييم الخدمة المقدمة للشركة.
   Data: DB.sagents = { agents: [{ id, last, first, cin, phone, type, company, contract, unit, shift, start, end, note }], logs: { 'YYYY-MM-DD': { agentId: { p: 'p'|'a'|'l'|'c', t: [bool], n } } } } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const R = () => { const c = (DB.sagents = DB.sagents && typeof DB.sagents === 'object' ? DB.sagents : {}); c.agents = Array.isArray(c.agents) ? c.agents : []; c.logs = c.logs && typeof c.logs === 'object' ? c.logs : {}; return c; };
  const TYPES = {
    guard: { n: 'عون(ة) الحراسة', pl: 'أعوان الحراسة', c: '#5b3fb0', bg: '#efeafb', ic: '🛡️',
      tasks: ['الحضور في الفترة المحددة', 'مراقبة الباب الرئيسي وتسجيل الزوار', 'جولات تفقدية داخل المؤسسة ومحيطها', 'فتح وإغلاق الأبواب والنوافذ والإنارة', 'حماية الممتلكات والتبليغ عن كل حادث'] },
    clean: { n: 'عون(ة) النظافة', pl: 'أعوان النظافة', c: '#0b7a8a', bg: '#e3f4f6', ic: '🧹',
      tasks: ['تنظيف الحجرات الدراسية', 'تنظيف المرافق الصحية وتعقيمها', 'تنظيف الساحة والممرات', 'تنظيف الإدارة والقاعات الأخرى', 'إفراغ سلات المهملات والتخلص من النفايات'] },
    cook: { n: 'عون(ة) الطبخ والإطعام', pl: 'أعوان الطبخ والإطعام', c: '#c2410c', bg: '#fdeee6', ic: '🍲',
      tasks: ['تحضير الوجبات في الوقت المحدد', 'احترام شروط النظافة وحفظ الصحة', 'تنظيف المطبخ والأواني', 'تتبع المخزون الغذائي'] },
    other: { n: 'عون(ة) آخر', pl: 'أعوان آخرون', c: '#455a64', bg: '#eceff1', ic: '🧰', tasks: ['القيام بالمهام المحددة في العقد'] }
  };
  const PRES = { p: ['حاضر(ة)', '#1f8a4c'], l: ['متأخر(ة)', '#b9770e'], a: ['غائب(ة)', '#c62828'], c: ['عطلة / رخصة', '#607d8b'] };
  const SHIFTS = ['نهاري', 'ليلي', 'صباحي', 'مسائي', 'نهاري وليلي (بالتناوب)', 'نهاية الأسبوع والعطل'];
  const name = a => `${nm(a.last)} ${nm(a.first)}`.trim();
  const today = () => Dx.todayIso();
  const companies = () => Array.from(new Set(R().agents.map(a => nm(a.company)).filter(Boolean))).sort();
  const T = a => TYPES[a.type] || TYPES.other;
  const logOf = (d, id) => ((R().logs[d] || {})[id]) || null;
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  const monthDays = ym => { const [y, m] = ym.split('-').map(Number); const n = new Date(y, m, 0).getDate(); return Array.from({ length: n }, (_, i) => `${ym}-${String(i + 1).padStart(2, '0')}`); };
  const monthName = ym => { const [y, m] = ym.split('-').map(Number); return `${MONTHS[m - 1]} ${y}`; };
  const isWork = iso => new Date(iso + 'T12:00:00').getDay() !== 0;
  // the month of one agent: days recorded, present, late, absent, rate of the tasks done
  function monthStat(a, ym) {
    const o = { days: 0, p: 0, l: 0, a: 0, c: 0, done: 0, todo: 0 };
    monthDays(ym).forEach(d => { const x = logOf(d, a.id); if (!x) return; o.days++; o[x.p || 'p']++; if (x.p !== 'a' && x.p !== 'c') { const n = T(a).tasks.length; o.todo += n; o.done += (x.t || []).filter(Boolean).length; } });
    o.rate = o.todo ? Math.round(o.done / o.todo * 100) : null;
    return o;
  }
  const st = { v: 'list', type: '', company: '', unit: '', q: '', date: '', ym: '' };

  /* ---------- the card of an agent ---------- */
  function edit(a0, done) {
    const a = a0 ? JSON.parse(JSON.stringify(a0)) : { id: uid('sa'), last: '', first: '', cin: '', phone: '', type: st.type || 'guard', company: companies()[0] || '', contract: '', unit: (K.unitList()[0] || {}).name || '', shift: 'نهاري', start: '', end: '', note: '' };
    const body = document.createElement('div'), box = document.createElement('div'); body.appendChild(box);
    const D = () => [
      { sec: 'الهوية' }, { k: 'last', l: 'الاسم العائلي', half: true }, { k: 'first', l: 'الاسم الشخصي', half: true },
      { k: 'cin', l: 'رقم البطاقة الوطنية', half: true, dir: 'ltr' }, { k: 'phone', l: 'الهاتف', half: true, dir: 'ltr' },
      { sec: 'المهمة والشركة المشغلة' }, { k: 'type', l: 'الصنف', t: 'select', opts: Object.keys(TYPES).map(k => [k, TYPES[k].n]), half: true },
      { k: 'company', l: 'الشركة المشغلة (المناولة)', half: true, list: 'saCo', ph: 'اسم الشركة نائلة الصفقة', dls: { saCo: companies } },
      { k: 'contract', l: 'رقم الصفقة / سند الطلب / العقد', half: true, dir: 'ltr' }, { k: 'unit', l: 'الوحدة المدرسية', list: 'k2Units', half: true },
      { k: 'shift', l: 'فترة العمل', half: true, list: 'saSh', dls: { saSh: SHIFTS } }, { k: 'start', l: 'تاريخ بداية العمل بالمؤسسة', t: 'date', half: true },
      { k: 'end', l: 'تاريخ نهاية العقد', t: 'date', half: true }, { k: 'note', l: 'ملاحظات', t: 'area', rows: 2 }];
    K.form(box, D, a);
    modal({ title: a0 ? 'بطاقة ' + T(a).n : 'إضافة عون(ة)', size: 'lg', body, actions: [
      { label: ic('check') + ' حفظ', cls: 'pri', onClick: () => {
        if (!name(a)) { toast('اكتب الاسم', true); return false; }
        if (!nm(a.company)) { toast('حدد الشركة المشغلة', true); return false; }
        const L = R().agents, i = L.findIndex(x => x.id === a.id); if (i >= 0) L[i] = a; else L.push(a);
        persist(); toast('تم الحفظ'); done && done(); } },
      a0 ? { label: 'حذف', cls: 'danger', onClick: async () => { if (!await confirmBox('حذف هذا العون(ة) وتتبعه؟', 'حذف')) return false; R().agents = R().agents.filter(x => x.id !== a.id); Object.values(R().logs).forEach(d => { delete d[a.id]; }); persist(); done && done(); } } : null,
      { label: 'إلغاء' }].filter(Boolean) });
  }

  const filtered = () => R().agents.filter(a => (!st.type || a.type === st.type) && (!st.company || nm(a.company) === st.company) && (!st.unit || K.U.same(a.unit, st.unit))
    && (!st.q || [name(a), a.cin, a.company, a.unit, a.phone].join(' ').toLowerCase().includes(st.q.toLowerCase())))
    .sort((x, y) => Object.keys(TYPES).indexOf(x.type) - Object.keys(TYPES).indexOf(y.type) || nm(x.company).localeCompare(nm(y.company)) || name(x).localeCompare(name(y), 'ar'));

  /* ---------- the page ---------- */
  function page(v, arg) {
    if (arg && arg.v) st.v = arg.v;
    if (!st.date) st.date = today();
    if (!st.ym) st.ym = today().slice(0, 7);
    const all = R().agents, L = filtered();
    const cnt = k => all.filter(a => a.type === k).length;
    const tl = { list: 'بطاقات الأعوان', log: 'تتبع القيام بالأعمال', sum: 'الحصيلة الشهرية' };
    v.innerHTML = `<div class="page-h"><h1>أعوان الحراسة والنظافة</h1><span class="sub">${tl[st.v]} — شركات المناولة</span><span class="sp"></span>
        <button class="btn pri" id="saAdd">${ic('plus')} إضافة عون(ة)</button><button class="btn" id="saDoc">${ic('print')} الوثائق</button></div>
      <div class="seg" id="saV" style="margin-bottom:10px">${Object.keys(tl).map(k => `<button data-v="${k}" class="${st.v === k ? 'on' : ''}">${tl[k]}</button>`).join('')}</div>
      <div class="sa-kpi">${Object.keys(TYPES).filter(k => k !== 'other' || cnt(k)).map(k => `<button data-ty="${k}" class="${st.type === k ? 'on' : ''}" style="--c:${TYPES[k].c};--b:${TYPES[k].bg}"><i>${TYPES[k].ic}</i><b>${cnt(k)}</b><span>${TYPES[k].pl}</span></button>`).join('')}
        <button data-ty="" class="${!st.type ? 'on' : ''}" style="--c:#0f6e5a;--b:#e7f1ee"><i>👥</i><b>${all.length}</b><span>كل الأعوان (${companies().length} شركة)</span></button></div>
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="flex-wrap:wrap;align-items:center;gap:8px">
        <select class="inp" id="saCo" style="width:auto"><option value="">كل الشركات</option>${companies().map(c => `<option ${st.company === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>
        ${K.unitList().length > 1 ? K.unitSelect('id="saU" style="width:auto"', st.unit, { all: 'كل الوحدات' }) : ''}
        ${st.v === 'log' ? `<input type="date" class="inp" id="saD" value="${esc(st.date)}" style="width:auto"><button class="btn sm" id="saPrev">‹ اليوم السابق</button><button class="btn sm" id="saNext">اليوم الموالي ›</button>` : ''}
        ${st.v === 'sum' ? `<input type="month" class="inp" id="saM" value="${esc(st.ym)}" style="width:auto">` : ''}
        ${st.v === 'list' ? `<input class="inp" id="saQ" placeholder="بحث: الاسم، الشركة، الوحدة..." value="${esc(st.q)}" style="max-width:260px">` : ''}
        <span class="sp"></span><span class="muted">${L.length} عون(ة)</span></div></div>
      <div id="saB"></div>`;
    const re = () => page(v);
    const B = $('#saB', v);
    if (!all.length) B.innerHTML = `<div class="card"><div class="empty-state">لا يوجد أعوان بعد. أضف أعوان الحراسة والنظافة مع الشركة المشغلة لكل واحد(ة)، ثم تتبع حضورهم والمهام المنجزة يوميا.</div></div>`;
    else if (st.v === 'list') listView(B, L, re);
    else if (st.v === 'log') logView(B, L, re);
    else sumView(B, L);
    $$('#saV button', v).forEach(b => b.onclick = () => go('sagents', { v: b.dataset.v }));
    $$('[data-ty]', v).forEach(b => b.onclick = () => { st.type = b.dataset.ty; re(); });
    $('#saCo', v).onchange = e => { st.company = e.target.value; re(); };
    if ($('#saU', v)) $('#saU', v).onchange = e => { st.unit = e.target.value; re(); };
    if ($('#saQ', v)) $('#saQ', v).oninput = e => { st.q = e.target.value; clearTimeout(page.t); page.t = setTimeout(() => { re(); const q = $('#saQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); };
    if ($('#saD', v)) { $('#saD', v).onchange = e => { st.date = e.target.value || today(); re(); }; const mv = n => { const d = new Date(Date.parse(st.date + 'T12:00:00') + n * 864e5); st.date = d.toISOString().slice(0, 10); re(); }; $('#saPrev', v).onclick = () => mv(-1); $('#saNext', v).onclick = () => mv(1); }
    if ($('#saM', v)) $('#saM', v).onchange = e => { st.ym = e.target.value || today().slice(0, 7); re(); };
    $('#saAdd', v).onclick = () => edit(null, re);
    $('#saDoc', v).onclick = () => go('sagentsDoc', { kind: st.v === 'sum' ? 'eval' : st.v === 'log' ? 'month' : 'list' });
  }
  function listView(B, L, re) {
    B.innerHTML = L.length ? `<div class="sa-cards">${L.map(a => { const t = T(a), s = monthStat(a, today().slice(0, 7)); return `<div class="card sa-card" style="--c:${t.c};--b:${t.bg}" data-e="${a.id}">
        <div class="sa-h"><span class="sa-ic">${t.ic}</span><div><b>${esc(name(a))}</b><div class="muted">${t.n}${a.shift ? ' — ' + esc(a.shift) : ''}</div></div></div>
        <div class="kv-r"><span>الشركة المشغلة</span><b>${esc(a.company || '—')}</b></div>
        ${a.contract ? `<div class="kv-r"><span>الصفقة / العقد</span><b dir="ltr">${esc(a.contract)}</b></div>` : ''}
        <div class="kv-r"><span>الوحدة المدرسية</span><b>${esc(a.unit || '—')}${a.unit && window.Units && Units.gresaOf(a.unit) ? ` <span class="muted" dir="ltr">${esc(Units.gresaOf(a.unit))}</span>` : ''}</b></div>
        ${a.phone ? `<div class="kv-r"><span>الهاتف</span><b dir="ltr">${esc(a.phone)}</b></div>` : ''}
        <div class="kv-r"><span>هذا الشهر</span><b>${s.days ? `${s.p + s.l} يوم حضور — ${s.a} غياب${s.rate != null ? ` — المهام ${s.rate}%` : ''}` : '<span class="muted">لا تتبع بعد</span>'}</b></div>
        <div class="btn-row" style="margin-top:6px"><button class="btn sm" data-c="${a.id}">${ic('print')} البطاقة</button><button class="btn sm" data-e="${a.id}">${ic('edit')} تعديل</button></div></div>`; }).join('')}</div>` : '<div class="card"><div class="empty-state">لا نتائج.</div></div>';
    $$('[data-e]', B).forEach(b => b.onclick = e => { e.stopPropagation(); edit(R().agents.find(a => a.id === b.dataset.e), re); });
    $$('[data-c]', B).forEach(b => b.onclick = e => { e.stopPropagation(); go('sagentsDoc', { kind: 'card', id: b.dataset.c }); });
  }
  function logView(B, L, re) {
    const d = st.date, logs = R().logs;
    const dn = new Date(d + 'T12:00:00').toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const types = Object.keys(TYPES).filter(k => L.some(a => a.type === k));
    B.innerHTML = `<div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="align-items:center"><b>${esc(dn)}</b>${isWork(d) ? '' : '<span class="tag">يوم الأحد</span>'}<span class="sp"></span>
        <button class="btn sm" id="saAllP">${ic('check')} الكل حاضر + كل المهام منجزة</button><button class="btn sm" id="saCopy">نسخ تتبع اليوم السابق</button></div></div>
      ${types.map(k => { const t = TYPES[k], A = L.filter(a => a.type === k); return `<div class="card sa-log" style="--c:${t.c};--b:${t.bg};margin-bottom:10px"><div class="sa-lh">${t.ic} ${t.pl} (${A.length})</div>
        <div style="overflow:auto"><table class="tbl compact"><thead><tr><th>العون(ة)</th><th>الشركة / الوحدة</th><th>الحضور</th>${t.tasks.map((x, i) => `<th class="sa-th" title="${esc(x)}">${i + 1}. ${esc(x)}</th>`).join('')}<th>ملاحظات</th></tr></thead><tbody>
        ${A.map(a => { const x = logOf(d, a.id) || {}; const off = x.p === 'a' || x.p === 'c'; return `<tr data-a="${a.id}"><td class="b">${esc(name(a))}</td><td class="muted" style="font-size:12px">${esc(a.company || '')}<br>${esc(a.unit || '')}</td>
          <td><select class="inp sa-p" data-p="${a.id}" style="width:auto;color:${(PRES[x.p] || ['', '#333'])[1]}"><option value="">—</option>${Object.keys(PRES).map(p => `<option value="${p}" ${x.p === p ? 'selected' : ''}>${PRES[p][0]}</option>`).join('')}</select></td>
          ${t.tasks.map((_, i) => `<td style="text-align:center"><input type="checkbox" data-t="${a.id}" data-i="${i}" ${(x.t || [])[i] ? 'checked' : ''} ${off ? 'disabled' : ''}></td>`).join('')}
          <td><input class="inp" data-n="${a.id}" value="${esc(x.n || '')}" placeholder="ملاحظة..." style="min-width:160px"></td></tr>`; }).join('')}</tbody></table></div></div>`; }).join('')}
      <p class="muted" style="font-size:12.5px;line-height:1.8">يُحفظ التتبع مباشرة. تُستعمل هذه المعطيات في الحصيلة الشهرية وفي «تقرير تقييم الخدمة» الموجه للشركة المشغلة.</p>`;
    const rec = id => { const D = (logs[d] = logs[d] || {}); return (D[id] = D[id] || { p: '', t: [], n: '' }); };
    let saveT = null; const save = () => { clearTimeout(saveT); saveT = setTimeout(persist, 300); };
    $$('[data-p]', B).forEach(s => s.onchange = () => { const r = rec(s.dataset.p); r.p = s.value; if (r.p === 'p' && !(r.t || []).some(Boolean)) { const a = R().agents.find(x => x.id === s.dataset.p); r.t = T(a).tasks.map(() => true); } save(); re(); });
    $$('[data-t]', B).forEach(c => c.onchange = () => { const r = rec(c.dataset.t); r.t = r.t || []; r.t[+c.dataset.i] = c.checked; if (!r.p) r.p = 'p'; save(); });
    $$('[data-n]', B).forEach(i => i.oninput = () => { rec(i.dataset.n).n = i.value; save(); });
    $('#saAllP', B).onclick = () => { L.forEach(a => { const r = rec(a.id); r.p = 'p'; r.t = T(a).tasks.map(() => true); }); persist(); re(); };
    $('#saCopy', B).onclick = () => { let p = new Date(Date.parse(d + 'T12:00:00') - 864e5); if (p.getDay() === 0) p = new Date(+p - 864e5); const pd = p.toISOString().slice(0, 10), P = logs[pd]; if (!P) return toast('لا يوجد تتبع لليوم السابق', true); L.forEach(a => { if (P[a.id]) { const r = rec(a.id); r.p = P[a.id].p; r.t = (P[a.id].t || []).slice(); } }); persist(); re(); };
  }
  function sumView(B, L) {
    const ym = st.ym;
    const byCo = {}; L.forEach(a => { const c = nm(a.company) || '—'; (byCo[c] = byCo[c] || []).push(a); });
    B.innerHTML = Object.keys(byCo).sort().map(c => `<div class="card" style="margin-bottom:10px"><div class="card-h"><b>${esc(c)}</b><span class="muted"> — ${monthName(ym)}</span><span class="sp"></span><button class="btn sm" data-ev="${esc(c)}">${ic('print')} تقرير تقييم الخدمة</button></div>
      <table class="tbl compact"><thead><tr><th>العون(ة)</th><th>الصنف</th><th>أيام التتبع</th><th>حضور</th><th>تأخر</th><th>غياب</th><th>عطلة / رخصة</th><th>نسبة إنجاز المهام</th></tr></thead><tbody>
      ${byCo[c].map(a => { const s = monthStat(a, ym); return `<tr><td class="b">${esc(name(a))}</td><td><span class="sa-tag" style="--c:${T(a).c};--b:${T(a).bg}">${T(a).n}</span></td><td class="num">${s.days}</td><td class="num">${s.p}</td><td class="num">${s.l}</td><td class="num" style="color:${s.a ? '#c62828' : ''}">${s.a}</td><td class="num">${s.c}</td>
        <td><div class="sa-bar"><span style="width:${s.rate || 0}%;background:${s.rate == null ? '#ccc' : s.rate >= 80 ? '#1f8a4c' : s.rate >= 50 ? '#b9770e' : '#c62828'}"></span></div>${s.rate == null ? '—' : s.rate + '%'}</td></tr>`; }).join('')}</tbody></table></div>`).join('');
    $$('[data-ev]', B).forEach(b => b.onclick = () => go('sagentsDoc', { kind: 'eval', company: b.dataset.ev, ym }));
  }

  /* ---------- documents ---------- */
  function docPage(v, arg) {
    arg = arg || {};
    const titles = { list: 'لائحة أعوان الحراسة والنظافة', card: 'بطاقة عون(ة)', month: 'ورقة التتبع الشهري للأعوان', eval: 'تقرير تقييم الخدمة المقدمة' };
    const kind = titles[arg.kind] ? arg.kind : 'list';
    MK.docPage(v, {
      title: titles[kind], icon: '🛡️', modes: false, flow: true,
      state: { company: arg.company || '', ym: arg.ym || st.ym || today().slice(0, 7), id: arg.id || '', type: '' },
      back: () => go('sagents', { v: kind === 'eval' ? 'sum' : kind === 'month' ? 'log' : 'list' }),
      fname: s2 => `${titles[kind]}_${s2.company || ''}_${s2.ym || ''}`,
      form: (box, s2, refresh) => {
        box.innerHTML = kind === 'card' ? `<div class="fld"><label>العون(ة)</label><select class="inp" id="sdA">${R().agents.map(a => `<option value="${a.id}" ${a.id === s2.id ? 'selected' : ''}>${esc(name(a))} — ${esc(T(a).n)}</option>`).join('')}</select></div>`
          : `<div class="fld"><label>الشركة المشغلة</label><select class="inp" id="sdC"><option value="">كل الشركات</option>${companies().map(c => `<option ${c === s2.company ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
            <div class="fld"><label>الصنف</label><select class="inp" id="sdT"><option value="">كل الأصناف</option>${Object.keys(TYPES).map(k => `<option value="${k}" ${s2.type === k ? 'selected' : ''}>${TYPES[k].pl}</option>`).join('')}</select></div>
            ${kind !== 'list' ? `<div class="fld"><label>الشهر</label><input type="month" class="inp" id="sdM" value="${esc(s2.ym)}"></div>` : ''}`;
        if ($('#sdA', box)) { if (!s2.id && R().agents[0]) s2.id = R().agents[0].id; $('#sdA', box).onchange = e => { s2.id = e.target.value; refresh(); }; }
        if ($('#sdC', box)) $('#sdC', box).onchange = e => { s2.company = e.target.value; refresh(); };
        if ($('#sdT', box)) $('#sdT', box).onchange = e => { s2.type = e.target.value; refresh(); };
        if ($('#sdM', box)) $('#sdM', box).onchange = e => { s2.ym = e.target.value; refresh(); };
        refresh();
      },
      build: s2 => {
        const s = S(), { SB, tr, thr, tbl } = K;
        const A = R().agents.filter(a => (!s2.company || nm(a.company) === s2.company) && (!s2.type || a.type === s2.type)).sort((x, y) => nm(x.company).localeCompare(nm(y.company)) || x.type.localeCompare(y.type) || name(x).localeCompare(name(y), 'ar'));
        const co = s2.company ? ` — شركة ${s2.company}` : '';
        if (kind === 'card') {
          const a = R().agents.find(x => x.id === s2.id) || R().agents[0] || {}; const t = T(a);
          return { page: 'a4', pages: SB.pages(s, { page: 'a4', title: 'بطاقة ' + t.n, blocks: [{ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:32%"><col style="width:68%"></colgroup>', rows: [
            ['الاسم الكامل', name(a)], ['رقم البطاقة الوطنية', a.cin || ''], ['الهاتف', a.phone || ''], ['الصنف', t.n], ['الشركة المشغلة', a.company || ''], ['رقم الصفقة / العقد', a.contract || ''],
            ['الوحدة المدرسية', `${a.unit || ''}${a.unit && window.Units && Units.gresaOf(a.unit) ? ' — GRESA ' + Units.gresaOf(a.unit) : ''}`], ['فترة العمل', a.shift || ''], ['بداية العمل بالمؤسسة', a.start ? K.ldate(a.start) : ''], ['نهاية العقد', a.end ? K.ldate(a.end) : ''],
            ['المهام المنوطة', t.tasks.map((x, i) => `${i + 1}. ${x}`).join(' — ')], ['ملاحظات', a.note || '']].map(([k, v2]) => tr([{ t: k, c: 'k' }, { t: v2 }])) } }],
            sign: SB.sign(s, { right: 'توقيع المعني(ة) بالأمر', left: 'توقيع وخاتم رئيس المؤسسة' }) }) };
        }
        if (kind === 'list') {
          const head = thr(['ر.ت', 'الاسم الكامل', 'ر.ب.و', 'الصنف', 'الشركة المشغلة', 'الصفقة / العقد', 'الوحدة المدرسية', 'فترة العمل', 'الهاتف'].map(t => ({ t, c: 'd' })));
          const rows = A.map((a, i) => tr([i + 1, { t: name(a), c: 'b' }, { h: `<bdi dir="ltr">${esc(a.cin || '')}</bdi>` }, { t: T(a).n, c: 'sm' }, a.company || '', { h: `<bdi dir="ltr">${esc(a.contract || '')}</bdi>`, c: 'sm' }, { t: a.unit || '', c: 'sm' }, { t: a.shift || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(a.phone || '')}</bdi>`, c: 'sm' }]));
          return { page: 'a4l', pages: SB.pages(s, { page: 'a4l', title: 'لائحة أعوان الحراسة والنظافة' + co, blocks: [tbl(head, rows, 'cmp')] }) };
        }
        if (kind === 'month') {
          const D = monthDays(s2.ym).filter(isWork);
          const head = thr([{ t: 'العون(ة)', c: 'd' }].concat(D.map(d => ({ t: d.slice(8), c: 'd' }))).concat([{ t: 'ح', c: 'd' }, { t: 'غ', c: 'd' }, { t: 'المهام', c: 'd' }]));
          const rows = A.map(a => { const s3 = monthStat(a, s2.ym); return tr([{ t: name(a), c: 'b' }].concat(D.map(d => { const x = logOf(d, a.id); return { t: x ? ({ p: '✓', l: 'ت', a: 'غ', c: 'ع' })[x.p] || '' : '', st: x && x.p === 'a' ? 'color:#c62828;font-weight:700' : '' }; })).concat([s3.p + s3.l, s3.a, s3.rate == null ? '' : s3.rate + '%'])); });
          return { page: 'a4l', pages: SB.pages(s, { page: 'a4l', title: `ورقة التتبع الشهري لأعوان الحراسة والنظافة — ${monthName(s2.ym)}${co}`, blocks: [tbl(head, rows, 'cmp sa-month'), { html: '<div class="sb-p" style="font-size:9pt">✓ حاضر(ة) — ت متأخر(ة) — غ غائب(ة) — ع عطلة / رخصة. «المهام»: نسبة المهام المنجزة خلال أيام الحضور.</div>' }] }) };
        }
        // eval: the monthly evaluation of the service given by the company
        const head = thr(['ر.ت', 'العون(ة)', 'الصنف', 'أيام الحضور', 'التأخر', 'الغياب', 'نسبة إنجاز المهام', 'التقدير'].map(t => ({ t, c: 'd' })));
        const appr = r => (r == null ? '' : r >= 90 ? 'ممتاز' : r >= 75 ? 'حسن' : r >= 50 ? 'متوسط' : 'ضعيف');
        let tp = 0, ta = 0, td = 0, tt = 0;
        const rows = A.map((a, i) => { const s3 = monthStat(a, s2.ym); tp += s3.p + s3.l; ta += s3.a; td += s3.done; tt += s3.todo; return tr([i + 1, { t: name(a), c: 'b' }, { t: T(a).n, c: 'sm' }, s3.p + s3.l, s3.l, s3.a, s3.rate == null ? '' : s3.rate + '%', appr(s3.rate)]); });
        const gr = tt ? Math.round(td / tt * 100) : null;
        const notes = []; A.forEach(a => monthDays(s2.ym).forEach(d => { const x = logOf(d, a.id); if (x && nm(x.n)) notes.push(`${K.ldate(d)} — ${name(a)}: ${nm(x.n)}`); }));
        return { page: 'a4', pages: SB.pages(s, { page: 'a4', title: `تقرير تقييم الخدمة المقدمة — ${monthName(s2.ym)}`, sub: s2.company ? 'الشركة المشغلة: ' + s2.company : '', blocks: [tbl(head, rows, 'cmp'),
          { html: `<p class="sb-p"><b>الحصيلة:</b> ${tp} يوم حضور و${ta} يوم غياب خلال الشهر، ونسبة إنجاز المهام المحددة: <b>${gr == null ? '—' : gr + '%'}</b> (${appr(gr) || 'بدون تقدير'}).</p>` },
          { html: `<div class="sb-cap r">الملاحظات المسجلة خلال الشهر</div>${notes.length ? notes.slice(0, 40).map(n => `<div class="rp-li sb-p">${esc(n)}</div>`).join('') : '<p class="sb-p">لا توجد ملاحظات.</p>'}` },
          { html: '<div class="sb-cap r">رأي رئيس المؤسسة</div><div style="border:1px solid #999;min-height:24mm"></div>' }],
          sign: SB.sign(s, { left: 'توقيع وخاتم رئيس المؤسسة' }) }) };
      }
    });
  }

  { const c = document.createElement('style'); c.textContent = `
    .sa-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:10px}
    .sa-kpi button{display:grid;grid-template-columns:auto 1fr;align-items:center;gap:2px 10px;border:1px solid var(--c);border-radius:12px;background:var(--b);padding:10px 14px;cursor:pointer;text-align:right;font:inherit}
    .sa-kpi button i{font-style:normal;font-size:26px;grid-row:span 2}.sa-kpi b{font-size:22px;color:var(--c);line-height:1}.sa-kpi span{font-weight:700;font-size:12.5px;color:#333}
    .sa-kpi button.on{background:var(--c);box-shadow:0 2px 8px rgba(0,0,0,.18)}.sa-kpi button.on b,.sa-kpi button.on span{color:#fff}
    .sa-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:10px}
    .sa-card{padding:12px 14px;border-top:4px solid var(--c);cursor:default}.sa-h{display:flex;gap:10px;align-items:center;margin-bottom:6px}
    .sa-ic{width:38px;height:38px;border-radius:10px;background:var(--b);display:flex;align-items:center;justify-content:center;font-size:20px}
    .sa-log{border-top:4px solid var(--c)}.sa-lh{background:var(--b);color:var(--c);font-weight:700;padding:8px 14px}
    .sa-th{font-size:11px;max-width:110px;white-space:normal;line-height:1.3}
    .sa-tag{display:inline-block;padding:1px 9px;border-radius:12px;background:var(--b);color:var(--c);font-weight:700;font-size:12px}
    .sa-bar{display:inline-block;width:80px;height:8px;background:#eee;border-radius:4px;overflow:hidden;vertical-align:middle;margin-inline-end:6px}.sa-bar span{display:block;height:100%}`; document.head.appendChild(c); }
  Dx.modCss += `.sa-month td,.sa-month th{font-size:8pt;padding:.4mm .5mm!important;text-align:center}`;
  window.SAgents = { list: () => R().agents, TYPES, monthStat, summary: () => ({ n: R().agents.length, firms: companies().join('، ') }) };
  window.pageSAgents = (v, a) => page(v, a);
  window.pageSAgentsDoc = (v, a) => docPage(v, a);
})();
