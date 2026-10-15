'use strict';
/* 1.9.4 — التأطير والتتبع: السجل الرقمي للزيارات التفقدية والتتبع التربوي للأساتذة بمختلف الوحدات المدرسية.
   Each visit: date, teacher, school unit, class / level, kind, the state of the pedagogical documents and registers (the daily note book,
   the attendance register, the pupils' copybooks, the lesson sheets and planning, the timetable, the follow-up of the previous
   recommendations, + any item added by the school), the observations on the practices, the recommendations.
   The recommendations of the previous visit of the same teacher are shown when a new visit is written (follow-up).
   Data: DB.visits = { items: { [sy]: [{ id, date, eid, name, unit, cls, kind, time, subj, chk: { [itemId]: 'ok'|'part'|'no' }, cn: { [itemId]: note }, obs, recs, prevNote }] }, extra: [names] } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const root = () => { const v = (DB.visits = DB.visits && typeof DB.visits === 'object' ? DB.visits : {}); v.items = v.items && typeof v.items === 'object' ? v.items : {}; v.extra = Array.isArray(v.extra) ? v.extra : []; return v; };
  const list = sy => { const r = root().items; return (r[sy] = Array.isArray(r[sy]) ? r[sy] : []); };
  const ITEMS = [
    ['note', 'المذكرة اليومية', 'تحيينها وانتظام مسكها'],
    ['abs', 'سجل الغياب والمواظبة', 'ضبطه وتحيينه'],
    ['cahier', 'دفاتر التلاميذ', 'انتظام تصحيحها وتتبعها'],
    ['prep', 'جذاذات الدروس والتخطيط التربوي', 'توفرها وملاءمتها'],
    ['time', 'استعمال الزمن', 'توفره والالتزام به'],
    ['prev', 'التوجيهات والتوصيات السابقة', 'مدى احترامها وتنفيذها']
  ];
  const items = () => ITEMS.concat(root().extra.map((n, i) => ['x' + i, n, '']));
  const ST = { ok: ['متوفر ومحين', '#1e8449', '✔'], part: ['متوفر غير محين / غير منتظم', '#d68910', '◐'], no: ['غير متوفر', '#c0392b', '✘'] };
  const KINDS = ['زيارة تفقدية', 'زيارة تتبع تربوي', 'حضور حصة دراسية', 'زيارة مواكبة', 'زيارة مشتركة مع المفتش(ة)'];
  const score = v => { const c = Object.values(v.chk || {}).filter(x => ST[x]); return c.length ? Math.round(c.reduce((a, x) => a + (x === 'ok' ? 1 : x === 'part' ? .5 : 0), 0) / c.length * 100) : null; };
  const teachersL = () => (window.Board ? Board.teachers().concat(Board.assigned(), Board.preschool()) : DB.employees || []);
  const fullN = e => (Dx.fullName ? Dx.fullName(e) : [e.firstAr, e.lastAr].filter(Boolean).join(' '));
  const ld = iso => (window.K && K.ldate ? K.ldate(iso) : iso);
  const prevOf = (sy, v) => list(sy).filter(x => x.id !== v.id && (x.eid ? x.eid === v.eid : nm(x.name) === nm(v.name)) && String(x.date || '') < String(v.date || '9999')).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0] || null;
  const unitOk = (a, b) => (window.K && K.U ? K.U.same(a, b) : nm(a) === nm(b));
  const st = { sy: '', unit: '', eid: '' };

  /* ---------- the visit form ---------- */
  function form(sy, v0, done) {
    const v = v0 ? JSON.parse(JSON.stringify(v0)) : { id: uid('vs'), date: Dx.todayIso(), eid: '', name: '', unit: '', cls: '', kind: KINDS[0], time: '', subj: '', chk: {}, cn: {}, obs: '', recs: '', prevNote: '' };
    const T = teachersL();
    const body = document.createElement('div');
    const draw = () => {
      const prev = prevOf(sy, v);
      body.innerHTML = `<div class="fgrid">
          <div class="fld"><label>تاريخ الزيارة</label><input type="date" class="inp" data-f="date" value="${esc(v.date)}"></div>
          <div class="fld"><label>الساعة</label><input class="inp" data-f="time" value="${esc(v.time)}" dir="ltr" placeholder="09:00"></div>
          <div class="fld"><label>الأستاذ(ة)</label><select class="inp" data-f="eid"><option value="">— اختر —</option>${T.map(e => `<option value="${e.id}" ${e.id === v.eid ? 'selected' : ''}>${esc(fullN(e))}${e.unit ? ' — ' + esc(e.unit) : ''}</option>`).join('')}<option value="__" ${!v.eid && v.name ? 'selected' : ''}>اسم آخر…</option></select></div>
          <div class="fld" ${!v.eid && v.name ? '' : 'hidden'} id="vsOther"><label>الاسم</label><input class="inp" data-f="name" value="${esc(v.eid ? '' : v.name)}"></div>
          <div class="fld"><label>الوحدة المدرسية</label>${K.unitSelect('data-f="unit"', v.unit, { empty: '' })}</div>
          <div class="fld"><label>القسم / المستوى</label><input class="inp" data-f="cls" value="${esc(v.cls)}"></div>
          <div class="fld"><label>نوع الزيارة</label><select class="inp" data-f="kind">${KINDS.map(k => `<option ${k === v.kind ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          <div class="fld"><label>المادة / الحصة (اختياري)</label><input class="inp" data-f="subj" value="${esc(v.subj)}"></div></div>
        ${K.dl ? K.dl('vsUnits', window.K && K.U ? K.U.names() : []) : ''}
        ${prev ? `<div class="vs-prev"><b>توصيات الزيارة السابقة (${esc(ld(prev.date))}):</b><div>${esc(prev.recs || '— لا توجد توصيات مسجلة —').replace(/\n/g, '<br>')}</div></div>` : ''}
        <div class="sec-t" style="margin-top:10px">الوثائق والسجلات التربوية</div>
        <table class="tbl compact vs-chk"><thead><tr><th>الوثيقة / السجل</th>${Object.entries(ST).map(([k, [l, c, i]]) => `<th style="color:${c}">${i} ${l}</th>`).join('')}<th>ملاحظة</th></tr></thead><tbody>
        ${items().map(([id, n, d]) => `<tr><td><b>${esc(n)}</b>${d ? `<div class="muted" style="font-size:11.5px">${esc(d)}</div>` : ''}</td>${Object.keys(ST).map(k => `<td style="text-align:center"><input type="radio" name="vs_${id}" value="${k}" ${v.chk[id] === k ? 'checked' : ''}></td>`).join('')}<td><input class="inp" data-cn="${id}" value="${esc(v.cn[id] || '')}"></td></tr>`).join('')}</tbody></table>
        <div class="btn-row" style="margin:6px 0"><button type="button" class="btn sm" id="vsAllOk">✔ الكل متوفر ومحين</button><button type="button" class="btn sm" id="vsClr">إفراغ</button><button type="button" class="btn sm" id="vsAddItem">${ic('plus')} وثيقة أخرى للتأشير</button></div>
        ${prev ? `<div class="fld"><label>تتبع تنفيذ توصيات الزيارة السابقة</label><textarea class="inp" rows="2" data-f="prevNote" placeholder="ما الذي نُفذ من التوصيات السابقة وما الذي لم يُنفذ">${esc(v.prevNote)}</textarea></div>` : ''}
        <div class="fld"><label>ملاحظات حول الممارسات المهنية والتربوية</label><textarea class="inp" rows="3" data-f="obs">${esc(v.obs)}</textarea></div>
        <div class="fld"><label>التوجيهات والتوصيات</label><textarea class="inp" rows="3" data-f="recs" placeholder="توصية في كل سطر">${esc(v.recs)}</textarea></div>`;
      body.querySelectorAll('[data-f]').forEach(el => el.onchange = el.oninput = () => {
        const k = el.dataset.f;
        if (k === 'eid') {
          if (el.value === '__') { v.eid = ''; body.querySelector('#vsOther').hidden = false; return; }
          v.eid = el.value; const e = T.find(x => x.id === v.eid); if (e) { v.name = fullN(e); v.unit = v.unit || nm(e.unit); } draw(); return;
        }
        v[k] = el.value; if (k === 'date' && el.type === 'date') draw();
      });
      body.querySelectorAll('input[type=radio]').forEach(r => r.onchange = () => { v.chk[r.name.slice(3)] = r.value; });
      body.querySelectorAll('[data-cn]').forEach(el => el.oninput = () => { v.cn[el.dataset.cn] = el.value; });
      body.querySelector('#vsAllOk').onclick = () => { items().forEach(([id]) => { v.chk[id] = 'ok'; }); draw(); };
      body.querySelector('#vsClr').onclick = () => { v.chk = {}; draw(); };
      body.querySelector('#vsAddItem').onclick = async () => { const n = prompt0 ? await prompt0('اسم الوثيقة أو السجل الذي يؤشر عليه في كل الزيارات (مثلا: سجل النقط، دفتر النصوص)') : ''; if (nm(n)) { root().extra.push(nm(n)); persist(); draw(); } };
    };
    draw();
    modal({ title: v0 ? 'تعديل الزيارة' : 'تسجيل زيارة جديدة', size: 'xl', body, actions: [{ label: ic('save') + ' حفظ الزيارة', cls: 'pri', onClick: () => {
      if (!v.date) { toast('أدخل تاريخ الزيارة', true); return false; }
      if (!v.eid && !nm(v.name)) { toast('اختر الأستاذ(ة)', true); return false; }
      const L = list(sy), i = L.findIndex(x => x.id === v.id); if (i >= 0) L[i] = v; else L.push(v);
      persist(); toast('تم حفظ الزيارة في السجل'); if (done) done();
    } }, { label: 'إلغاء' }] });
  }
  // a small text prompt (inside the app, no browser dialog)
  const prompt0 = q => new Promise(res => { const b = document.createElement('div'); b.innerHTML = `<p style="margin-top:0">${esc(q)}</p><input class="inp" id="vsQ">`; modal({ title: 'إضافة', body: b, actions: [{ label: 'إضافة', cls: 'pri', onClick: () => res(b.querySelector('#vsQ').value) }, { label: 'إلغاء', onClick: () => res('') }] }); setTimeout(() => { const i = b.querySelector('#vsQ'); if (i) i.focus(); }, 50); });

  /* ---------- the page ---------- */
  const filtered = sy => list(sy).filter(v => (!st.unit || unitOk(v.unit, st.unit)) && (!st.eid || v.eid === st.eid)).sort((a, b) => String(b.date).localeCompare(String(a.date)));
  function page(v) {
    st.sy = st.sy || MK.curSy();
    const sy = st.sy, L = filtered(sy), all = list(sy);
    const units = Array.from(new Set(all.map(x => nm(x.unit)).filter(Boolean)));
    const T = teachersL(), seen = new Set(all.map(x => x.eid).filter(Boolean));
    const notVisited = T.filter(e => !seen.has(e.id));
    const avg = (() => { const s2 = L.map(score).filter(x => x != null); return s2.length ? Math.round(s2.reduce((a, b) => a + b, 0) / s2.length) : null; })();
    v.innerHTML = `<div class="page-h"><h1>سجل الزيارات التفقدية والتتبع التربوي</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn pri" id="vsNew">${ic('plus')} زيارة جديدة</button><button class="btn" id="vsPrint">${ic('print')} طباعة</button></div>
      <div class="card" style="padding:10px 14px;margin-bottom:10px;line-height:1.85;font-size:13px">وثّق الزيارات المنجزة لأساتذة مختلف الوحدات المدرسية: تاريخ الزيارة، الأستاذ(ة)، الوحدة والقسم، التأشير على توفر الوثائق والسجلات التربوية وتحيينها (المذكرة اليومية، سجل الغياب والمواظبة، دفاتر التلاميذ، الجذاذات والتخطيط، استعمال الزمن، احترام التوصيات السابقة)، ملاحظات الممارسات المهنية والتوصيات. تظهر توصيات الزيارة السابقة تلقائيا عند تسجيل زيارة جديدة لنفس الأستاذ(ة).</div>
      <div class="att-kpis big" style="margin-bottom:10px"><span>الزيارات: <b>${L.length}</b></span><span>الأساتذة المزورون: <b>${new Set(L.map(x => x.eid || x.name)).size}</b></span><span>لم يُزاروا بعد: <b>${notVisited.length}</b></span><span>نسبة توفر الوثائق وتحيينها: <b>${avg == null ? '—' : avg + '%'}</b></span></div>
      <div class="toolbar" style="margin-bottom:8px"><select class="inp" id="vsU" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
        <select class="inp" id="vsE" style="width:auto"><option value="">كل الأساتذة</option>${T.filter(e => seen.has(e.id)).map(e => `<option value="${e.id}" ${e.id === st.eid ? 'selected' : ''}>${esc(fullN(e))}</option>`).join('')}</select></div>
      ${L.length ? `<div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>التاريخ</th><th>الأستاذ(ة)</th><th>الوحدة</th><th>القسم</th><th>نوع الزيارة</th>${items().map(([, n]) => `<th style="font-size:11px">${esc(n)}</th>`).join('')}<th>النسبة</th><th></th></tr></thead><tbody>
        ${L.map(x => { const sc = score(x); return `<tr><td>${esc(ld(x.date))}</td><td class="b">${esc(x.name)}</td><td>${esc(x.unit)}</td><td>${esc(x.cls)}</td><td>${esc(x.kind)}</td>${items().map(([id]) => { const s2 = ST[(x.chk || {})[id]]; return `<td style="text-align:center;color:${s2 ? s2[1] : '#aaa'};font-weight:700" title="${s2 ? s2[0] : 'لم يؤشر'}">${s2 ? s2[2] : '·'}</td>`; }).join('')}<td class="num"><b style="color:${sc == null ? '#888' : sc >= 75 ? '#1e8449' : sc >= 50 ? '#d68910' : '#c0392b'}">${sc == null ? '—' : sc + '%'}</b></td>
          <td style="white-space:nowrap"><button class="btn sm" data-ed="${x.id}">${ic('edit')}</button><button class="btn sm" data-pr="${x.id}" title="بطاقة الزيارة">${ic('print')}</button><button class="btn sm danger" data-del="${x.id}">${ic('trash')}</button></td></tr>`; }).join('')}</tbody></table></div></div>`
        : '<div class="empty-state">لا توجد زيارات مسجلة بعد. اضغط «زيارة جديدة».</div>'}
      ${notVisited.length ? `<div class="sec-t" style="margin-top:12px">أساتذة لم تسجل لهم زيارة هذا الموسم (${notVisited.length})</div><div class="muted" style="line-height:1.9">${notVisited.map(e => esc(fullN(e)) + (e.unit ? ` <small>(${esc(e.unit)})</small>` : '')).join('، ')}</div>` : ''}`;
    const again = () => page(v);
    $('#vsNew', v).onclick = () => form(sy, null, again);
    $('#vsPrint', v).onclick = () => go('visitsDoc', { kind: 'reg' });
    $('#vsU', v).onchange = e => { st.unit = e.target.value; again(); };
    $('#vsE', v).onchange = e => { st.eid = e.target.value; again(); };
    $$('[data-ed]', v).forEach(b => b.onclick = () => form(sy, list(sy).find(x => x.id === b.dataset.ed), again));
    $$('[data-pr]', v).forEach(b => b.onclick = () => go('visitsDoc', { kind: 'one', id: b.dataset.pr }));
    $$('[data-del]', v).forEach(b => b.onclick = async () => { if (!(await confirmBox('حذف هذه الزيارة من السجل؟', 'حذف'))) return; const a = list(sy); a.splice(a.findIndex(x => x.id === b.dataset.del), 1); persist(); again(); });
  }

  /* ---------- documents ---------- */
  const SB = () => K.SB;
  const thr = cells => K.thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  function oneDoc(s, sy, x) {
    const prev = prevOf(sy, x), sc = score(x);
    const rows = items().map(([id, n, d]) => { const k = (x.chk || {})[id]; return `<tr><td class="r b">${esc(n)}${d ? ` <span style="font-weight:400;font-size:8.6pt">(${esc(d)})</span>` : ''}</td>${Object.keys(ST).map(kk => `<td>${k === kk ? '<b style="font-size:12pt">✔</b>' : ''}</td>`).join('')}<td class="r">${esc((x.cn || {})[id] || '')}</td></tr>`; });
    const para = (t, txt, h) => `<div class="vs-box"><div class="vs-bt">${t}</div><div class="vs-bb" style="min-height:${h}mm">${esc(txt || '').replace(/\n/g, '<br>')}</div></div>`;
    return SB().pages(s, { title: 'بطاقة زيارة تفقدية / تتبع تربوي', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4', blocks: [
      { html: `<table class="tbl sb-t vs-kv"><tbody><tr><td class="r b">الأستاذ(ة)</td><td class="r">${esc(x.name)}</td><td class="r b">تاريخ الزيارة</td><td class="r">${esc(ld(x.date))}${x.time ? ' — ' + esc(x.time) : ''}</td></tr>
        <tr><td class="r b">الوحدة المدرسية</td><td class="r">${esc(x.unit)}</td><td class="r b">القسم / المستوى</td><td class="r">${esc(x.cls)}</td></tr>
        <tr><td class="r b">نوع الزيارة</td><td class="r">${esc(x.kind)}</td><td class="r b">المادة / الحصة</td><td class="r">${esc(x.subj)}</td></tr></tbody></table>` },
      { html: '<div class="sb-cap" style="margin-top:2mm">التأشير على الوثائق والسجلات التربوية</div>' },
      { table: { cls: 'sb-t vs-t', head: thr([{ t: 'الوثيقة / السجل', c: 'd' }].concat(Object.values(ST).map(([l]) => ({ t: l, c: 'd' })), [{ t: 'ملاحظة', c: 'd' }])), colgroup: '<colgroup><col style="width:34%"><col style="width:12%"><col style="width:14%"><col style="width:11%"><col></colgroup>', rows }, minRows: 1 },
      { html: `<p class="sb-p" style="margin:1mm 0">نسبة توفر الوثائق وتحيينها: <b>${sc == null ? '—' : sc + '%'}</b></p>` },
      prev ? { html: para(`توصيات الزيارة السابقة (${esc(ld(prev.date))}) ومدى تنفيذها`, [prev.recs, x.prevNote ? '— التتبع: ' + x.prevNote : ''].filter(Boolean).join('\n'), 12) } : null,
      { html: para('ملاحظات حول الممارسات المهنية والتربوية', x.obs, 18) },
      { html: para('التوجيهات والتوصيات', x.recs, 18) }].filter(Boolean),
      sign: SB().sign(s, { three: ['توقيع الأستاذ(ة)<br><span style="font-weight:400">(اطلعت)</span>', `حرر ب: ${esc(s.city || '')} في: ${esc(ld(x.date))}`, 'توقيع مدير(ة) المؤسسة'] }) });
  }
  function regDoc(s, sy) {
    const L = filtered(sy).slice().reverse(), IT = items();
    const rows = L.map((x, i) => `<tr><td>${i + 1}</td><td>${esc(ld(x.date))}</td><td class="r b">${esc(x.name)}</td><td>${esc(x.unit)}</td><td>${esc(x.cls)}</td><td>${esc(x.kind)}</td>${IT.map(([id]) => { const s2 = ST[(x.chk || {})[id]]; return `<td style="color:${s2 ? s2[1] : '#999'};font-weight:700">${s2 ? s2[2] : ''}</td>`; }).join('')}<td><b>${score(x) == null ? '' : score(x) + '%'}</b></td><td class="r" style="font-size:8pt">${esc(String(x.recs || '').split('\n').filter(Boolean).slice(0, 2).join(' — '))}</td></tr>`);
    // per teacher: number of visits, last visit, average
    const by = new Map(); L.forEach(x => { const k = x.eid || x.name; const o = by.get(k) || { name: x.name, unit: x.unit, n: 0, last: '', sc: [] }; o.n++; if (String(x.date) > o.last) o.last = x.date; const s2 = score(x); if (s2 != null) o.sc.push(s2); by.set(k, o); });
    const rows2 = Array.from(by.values()).sort((a, b) => String(a.unit).localeCompare(String(b.unit), 'ar') || a.name.localeCompare(b.name, 'ar')).map((o, i) => `<tr><td>${i + 1}</td><td class="r b">${esc(o.name)}</td><td>${esc(o.unit)}</td><td>${o.n}</td><td>${esc(ld(o.last))}</td><td><b>${o.sc.length ? Math.round(o.sc.reduce((a, b) => a + b, 0) / o.sc.length) + '%' : '—'}</b></td></tr>`);
    const legend = `<div class="sb-note">${Object.values(ST).map(([l, c, i]) => `<b style="color:${c}">${i}</b> ${l}`).join(' &nbsp;—&nbsp; ')} — النسبة: متوفر ومحين = 1، غير محين = 0.5، غير متوفر = 0.</div>`;
    return SB().pages(s, { title: 'سجل الزيارات التفقدية والتتبع التربوي للأساتذة', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${st.unit ? ' — ' + esc(st.unit) : ''}`, page: 'a4l', blocks: [
      { table: { cls: 'sb-t cmp vs-reg', head: thr(['ر.ت', 'التاريخ', 'الأستاذ(ة)', 'الوحدة', 'القسم', 'نوع الزيارة'].concat(IT.map(x => x[1]), ['النسبة', 'أهم التوصيات'])), rows }, minRows: 4 }, { html: legend },
      rows2.length ? { before: '<div class="sb-cap" style="margin-top:3mm">حصيلة الزيارات حسب الأستاذ(ة)</div>', keepNext: true, table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الأستاذ(ة)', 'الوحدة', 'عدد الزيارات', 'آخر زيارة', 'متوسط النسبة']), rows: rows2 }, minRows: 1 } : null].filter(Boolean),
      sign: SB().sign(s, {}) });
  }
  Dx.modCss += `
  .vs-kv td{padding:1.4mm 2mm}.vs-kv td.b{width:18%;background:#f1f4f8}.tbl.sb-t.vs-t td{height:6.4mm;padding:.3mm 1.2mm}.tbl.sb-t.vs-reg th{font-size:8pt;line-height:1.25}
  .vs-box{border:1px solid #333;border-radius:2mm;margin:2mm 0;overflow:hidden}.vs-bt{background:#eef2f7;font-weight:700;padding:1mm 2.5mm;border-bottom:1px solid #333;-webkit-print-color-adjust:exact;print-color-adjust:exact}.vs-bb{padding:1.5mm 2.5mm;line-height:1.7}`;
  const css = document.createElement('style');
  css.textContent = '.vs-chk td,.vs-chk th{vertical-align:middle}.vs-chk input[type=radio]{width:18px;height:18px}.vs-prev{background:#fff8e6;border:1px solid #f0d58a;border-radius:8px;padding:8px 12px;margin:8px 0;line-height:1.8;font-size:13px}';
  document.head.appendChild(css);

  window.pageVisits = v => page(v);
  window.pageVisitsDoc = function (v, arg) {
    arg = arg || {};
    const sy = st.sy || MK.curSy();
    MK.docPage(v, {
      title: arg.kind === 'one' ? 'بطاقة الزيارة' : 'سجل الزيارات التفقدية', icon: '📋', modes: false, flow: true, state: { id: arg.id || '' },
      back: () => go('visits'),
      form: box => { box.innerHTML = `<p class="muted" style="line-height:1.8">${arg.kind === 'one' ? 'بطاقة زيارة واحدة: معطيات الزيارة، التأشير على الوثائق، الملاحظات والتوصيات وتوقيع الأستاذ(ة) والمدير.' : 'السجل حسب المرشحات المختارة في صفحة السجل (الوحدة / الأستاذ)، مع حصيلة الزيارات حسب الأستاذ(ة).'}</p>`; },
      build: s0 => { const s = S(); if (arg.kind === 'one') { const x = list(sy).find(y => y.id === arg.id); return { page: 'a4', pages: x ? oneDoc(s, sy, x) : [] }; } return { page: 'a4l', pages: regDoc(s, sy) }; },
      fname: () => (arg.kind === 'one' ? 'بطاقة_زيارة' : 'سجل_الزيارات_التفقدية')
    });
  };
  window.Visits = { list, score, items, summary: () => { const sy = MK.curSy(), L = list(sy); return { n: L.length, t: new Set(L.map(x => x.eid || x.name)).size }; } };
})();
