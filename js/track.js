'use strict';
/* 1.9.3 — «شبكة تتبع العمل التربوي بالمؤسسة» (خانة الوثائق): جدول بالأساتذة (مصنفين حسب الوحدة المدرسية) وبمهام قابلة للإضافة
   (الأبواب المفتوحة، الورشات التذكيرية، الروائز، تسليم استعمال الزمن، غياب الشهر…). كل خلية: فارغة ← منجز (وجه مبتسم أخضر فاتح) ← غير منجز (غ م).
   Data: DB.track = { years: { [sy]: { grids: [{ id, title, period, inspector, upd, cols: [{ id, name }], rows: [{ id, name, unit, st: { [colId]: 0|1|2 } }] }] } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const hd = cells => K.thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const root = () => { const t = (DB.track = DB.track && typeof DB.track === 'object' ? DB.track : {}); t.years = t.years && typeof t.years === 'object' ? t.years : {}; return t; };
  const grids = sy => { const y = root().years; const o = y[sy] || (y[sy] = {}); o.grids = Array.isArray(o.grids) ? o.grids : []; return o.grids; };
  const findG = (sy, id) => grids(sy).find(g => g.id === id);

  const PRESET_COLS = ['الأبواب المفتوحة واستقبال التلاميذ', 'الورشات التذكيرية', 'تمرير روائز الموضعة القبلية', 'تسليم شبكة نتائج الرائز القبلي', 'تسليم استعمال الزمن (الدعم المكثف)', 'غياب شهر شتنبر'];
  const SUGGEST = ['تسليم استعمال الزمن العام', 'تسليم التوزيع السنوي للدروس', 'تسليم خطة الدعم والمعالجة', 'تسليم لائحة التلاميذ المتعثرين', 'مسك نقط المراقبة المستمرة', 'تسليم تقرير نتائج الأسدس', 'تسليم الوثائق التربوية (دفتر النصوص، سجل التقويم)',
    'تمرير روائز الموضعة البعدية', 'تسليم شبكة نتائج الرائز البعدي', 'إعداد المجلة الحائطية / أركان القسم', 'تسليم بطاقة الأستاذ(ة)', 'غياب شهر أكتوبر', 'غياب شهر نونبر', 'غياب شهر دجنبر', 'غياب شهر يناير', 'غياب شهر فبراير', 'غياب شهر مارس', 'غياب شهر أبريل', 'غياب شهر ماي', 'غياب شهر يونيو'];
  const colId = () => uid('tc');

  /* ---------- state icons ---------- */
  const smiley = z => `<svg viewBox="0 0 24 24" width="${z || 17}" height="${z || 17}" style="vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10.6" fill="#9be59a" stroke="#38a343" stroke-width="1.4"/><circle cx="8.4" cy="9.6" r="1.35" fill="#1d6a26"/><circle cx="15.6" cy="9.6" r="1.35" fill="#1d6a26"/><path d="M6.8 14.2c1.2 2.7 3.1 3.8 5.2 3.8s4-1.1 5.2-3.8" fill="none" stroke="#1d6a26" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  // 1.9.4: «غير منجز» = red sad face (instead of the letters غ م)
  const sad = z => `<svg viewBox="0 0 24 24" width="${z || 17}" height="${z || 17}" style="vertical-align:middle" xmlns="http://www.w3.org/2000/svg"><circle cx="12" cy="12" r="10.6" fill="#f28b8b" stroke="#c0151f" stroke-width="1.4"/><circle cx="8.4" cy="9.6" r="1.35" fill="#7a0a10"/><circle cx="15.6" cy="9.6" r="1.35" fill="#7a0a10"/><path d="M6.8 17.6c1.2-2.7 3.1-3.8 5.2-3.8s4 1.1 5.2 3.8" fill="none" stroke="#7a0a10" stroke-width="1.7" stroke-linecap="round"/></svg>`;
  const NOT = sad();
  const cellHtml = v => (v === 1 ? smiley() : v === 2 ? NOT : '');

  /* ---------- the rows: teachers of the school, grouped by unit ---------- */
  const unitOrder = () => (window.Units ? Units.names() : []);
  const unitRank = u => { const i = unitOrder().findIndex(x => K.U.same(x, u)); return i < 0 ? 999 : i; };
  const teacherRows = () => K.E.teachers().map(e => ({ id: uid('tr'), eid: e.id, name: fullName(e), unit: nm(e.unit), st: {} }));
  function addTeachers(g) {
    let n = 0;
    teacherRows().forEach(r => { if (!g.rows.some(x => (x.eid && x.eid === r.eid) || nm(x.name) === nm(r.name))) { g.rows.push(r); n++; } });
    sortRows(g); return n;
  }
  function sortRows(g) { g.rows.sort((a, b) => unitRank(a.unit) - unitRank(b.unit) || nm(a.unit).localeCompare(nm(b.unit), 'ar') || nm(a.name).localeCompare(nm(b.name), 'ar')); }
  // new teachers / changed units of the employees list are followed without losing the ticks
  function sync(g) { g.rows.forEach(r => { const e = r.eid && DB.employees.find(x => x.id === r.eid); if (e) { r.name = fullName(e); r.unit = nm(e.unit) || r.unit; } }); }

  function newGrid(sy, kind, memo) {
    const g = { id: uid('tg'), title: 'شبكة تتبع العمل التربوي بالمؤسسة خلال', period: kind === 'sem2' ? 'الأسدوس الثاني' : 'الأسدوس الأول', inspector: '', upd: Dx.todayIso(), cols: [], rows: [] };
    if (kind === 'sem1') g.cols = PRESET_COLS.map(n => ({ id: colId(), name: n }));
    if (kind === 'sem2') g.cols = ['مسك نقط المراقبة المستمرة', 'تسليم تقرير نتائج الأسدس', 'تسليم خطة الدعم والمعالجة', 'تسليم الوثائق التربوية (دفتر النصوص، سجل التقويم)', 'غياب شهر ماي'].map(n => ({ id: colId(), name: n }));
    if (memo) g.cols.push({ id: colId(), name: memo });
    addTeachers(g);
    grids(sy).push(g); persist(); return g;
  }
  const progress = g => { const tot = g.rows.length * g.cols.length; if (!tot) return 0; let d = 0; g.rows.forEach(r => g.cols.forEach(c => { if ((r.st || {})[c.id] === 1) d++; })); return Math.round(d * 100 / tot); };

  /* ---------- printed grid ---------- */
  function build(s, g, sy) {
    sync(g);
    const unit = g.unitFilter || '';
    const rows = g.rows.filter(r => !unit || K.U.same(r.unit, unit));
    const hasUnit = rows.some(r => nm(r.unit));
    const nc = g.cols.length, wTask = Math.max(5.5, (hasUnit ? 66 : 76) / Math.max(1, nc));
    const colg = `<colgroup><col style="width:4%">${hasUnit ? '<col style="width:11%">' : ''}<col style="width:${hasUnit ? 19 : 20}%">${g.cols.map(() => `<col style="width:${wTask}%">`).join('')}</colgroup>`;
    const head = hd(['ر.ت'].concat(hasUnit ? ['الوحدة المدرسية'] : [], ['الأستاذ(ة)'], g.cols.map(c => c.name)));
    const body = rows.map((r, i) => tr([i + 1].concat(hasUnit ? [{ t: r.unit, c: 'b' }] : [], [{ t: r.name, c: 'r' }], g.cols.map(c => { const v = (r.st || {})[c.id] || 0; return { h: cellHtml(v), c: v === 1 ? 'tk-ok' : v === 2 ? 'tk-no' : '' }; }))));
    const t = `${nm(g.title)} ${nm(g.period)}: ${syText(sy)}`;
    const legend = `<div class="tk-leg"><span>${smiley(13)} : منجز</span><span>${sad(13)} : غير منجز</span><span>خانة فارغة : في طور الإنجاز</span><span class="up">آخر تحيين بتاريخ: ${esc(K.ldate(g.upd || Dx.todayIso()))}</span></div>`;
    const blocks = [{ table: { cls: 'sb-t cmp tk-t', head, colgroup: colg, rows: body }, minRows: 3 }, { html: legend }];
    const sign = SB.sign(s, { three: [`السيد مدير المؤسسة:<br><span style="font-weight:400">${esc(s.director || '')}</span>`, '', `السيد المفتش المواكب:<br><span style="font-weight:400">${esc(g.inspector || '')}</span>`] });
    return { page: 'a4l', pages: MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, esc(t)), blocks: blocks.concat([{ html: sign }]) }) };
  }
  Dx.modCss += `
  .tbl.sb-t.tk-t th{font-size:8.6pt;line-height:1.3;padding:1mm .8mm}.tbl.sb-t.tk-t td{height:7mm;padding:.4mm 1mm;font-size:9.6pt}
  .tbl.sb-t.tk-t td.tk-ok{background:#e4f8e2}.tbl.sb-t.tk-t td.tk-no{background:#f9c9c9}
  .tk-leg{display:flex;flex-wrap:wrap;gap:6mm;align-items:center;margin:2mm 0 1mm;font-size:9.6pt}.tk-leg .up{margin-inline-start:auto;font-weight:700}`;

  /* ---------- editor (interactive grid + preview) ---------- */
  function editor(v, arg) {
    const sy = MK.curSy();
    let g = findG(sy, arg && arg.id);
    if (!g) return go('track');
    MK.docPage(v, {
      title: 'شبكة تتبع العمل التربوي', icon: '🙂', modes: false, flow: true, state: {}, word: false,
      back: () => go('track'),
      fname: () => `${g.title} ${g.period} ${syText(sy)}`,
      build: () => build(S(), g, sy),
      form: (box, st, refresh) => {
        const ed = box.closest('.editor'); if (ed) ed.classList.add('tk-wide');
        const save = () => { g.upd = Dx.todayIso(); persist(); refresh(); };
        const draw = () => {
          sync(g);
          const units = Array.from(new Set(g.rows.map(r => nm(r.unit)).filter(Boolean)));
          const memos = window.Memos && Memos.list ? Memos.list(sy) : [];
          box.innerHTML = `
            <div class="fgrid">
              <div class="fld full"><label>عنوان الشبكة</label><input class="inp" data-f="title" value="${esc(g.title)}"></div>
              <div class="fld"><label>الفترة</label><input class="inp" data-f="period" value="${esc(g.period)}" list="tkPer"><datalist id="tkPer"><option value="الأسدوس الأول"><option value="الأسدوس الثاني"><option value="الموسم الدراسي"><option value="شهر ..."></datalist></div>
              <div class="fld"><label>السيد المفتش المواكب</label><input class="inp" data-f="inspector" value="${esc(g.inspector || '')}"></div>
              <div class="fld"><label>تاريخ آخر تحيين</label><input class="inp" type="date" data-f="upd" value="${esc(g.upd || '')}"></div>
              <div class="fld"><label>طباعة وحدة واحدة</label><select class="inp" data-f="unitFilter"><option value="">كل الوحدات</option>${units.map(u => `<option ${g.unitFilter === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>
            </div>
            <div class="sec-t" style="margin-top:12px">المهام (أعمدة الشبكة) — أضف ما تشاء</div>
            <div class="tk-cols">${g.cols.map((c, i) => `<span class="tk-chip"><button class="btn sm icon" data-mv="${i}:-1" title="تقديم" ${i ? '' : 'disabled'}>▸</button><input class="inp" data-cn="${i}" value="${esc(c.name)}"><button class="btn sm icon" data-mv="${i}:1" title="تأخير" ${i < g.cols.length - 1 ? '' : 'disabled'}>◂</button><button class="btn sm danger icon" data-cd="${i}" title="حذف المهمة">✕</button></span>`).join('') || '<span class="muted">لا توجد مهام بعد</span>'}</div>
            <div class="btn-row" style="margin-top:6px"><button class="btn sm" data-add="">${ic('plus')} مهمة جديدة</button>
              <select class="inp" id="tkSug" style="width:auto;max-width:260px"><option value="">+ مهمة مقترحة…</option>${SUGGEST.filter(x => !g.cols.some(c => c.name === x)).map(x => `<option>${esc(x)}</option>`).join('')}</select>
              ${memos.length ? `<select class="inp" id="tkMemo" style="width:auto;max-width:260px"><option value="">+ مهمة من مذكرة داخلية…</option>${memos.map((m, i) => `<option value="${i}">${esc(m.title)}</option>`).join('')}</select>` : ''}</div>
            <div class="sec-t" style="margin-top:12px">الأساتذة والموظفون ${g.rows.length ? `<span class="muted" style="font-weight:400">— الإنجاز ${progress(g)}%</span>` : ''}</div>
            <div class="btn-row" style="margin-bottom:6px"><button class="btn sm" id="tkEmps">${ic('users')} إدراج الأساتذة من لائحة الموظفين</button><button class="btn sm pri" id="tkPick">${ic('plus')} إضافة موظف(ين)</button><button class="btn sm" id="tkRow">${ic('plus')} إضافة صف فارغ</button><button class="btn sm" id="tkClear">إفراغ كل الخانات</button></div>
            <div class="muted" style="font-size:12px;margin-bottom:5px">انقر على الخانة للتغيير: فارغة ← ${smiley(13)} منجز ← ${sad(13)} غير منجز. انقر على عنوان المهمة لتحديد العمود كله «منجز».</div>
            <div class="tk-scroll"><table class="tk-grid"><thead><tr><th>ر.ت</th><th>الوحدة</th><th>الأستاذ(ة)</th>${g.cols.map((c, i) => `<th class="tk-h" data-col="${i}" title="تحديد العمود كله منجز">${esc(c.name)}</th>`).join('')}<th></th></tr></thead>
              <tbody>${g.rows.map((r, ri) => `<tr><td>${ri + 1}</td><td><input class="inp" data-ru="${ri}" value="${esc(r.unit || '')}" list="k2Units"></td><td><input class="inp" data-rn="${ri}" value="${esc(r.name)}" list="k2Emps"></td>${g.cols.map((c, ci) => { const x = (r.st || {})[c.id] || 0; return `<td class="tk-c s${x}" data-c="${ri}:${ci}">${cellHtml(x)}</td>`; }).join('')}<td><button class="btn sm danger icon" data-rd="${ri}" title="حذف هذا الموظف من الشبكة">✕</button></td></tr>`).join('') || `<tr><td colspan="${g.cols.length + 4}" class="muted" style="padding:14px;text-align:center">لا توجد صفوف: اضغط «إدراج الأساتذة من لائحة الموظفين»</td></tr>`}</tbody></table></div>
            ${K.dl('k2Units', K.U.names())}${K.dl('k2Emps', K.E.names())}`;
          wire();
        };
        const wire = () => {
          box.querySelectorAll('[data-f]').forEach(el => el.onchange = () => { g[el.dataset.f] = el.value; save(); if (el.dataset.f === 'unitFilter') draw(); });
          box.querySelectorAll('[data-cn]').forEach(el => el.onchange = () => { g.cols[+el.dataset.cn].name = nm(el.value); save(); });
          box.querySelectorAll('[data-mv]').forEach(b => b.onclick = () => { const [i, d] = b.dataset.mv.split(':').map(Number); const [x] = g.cols.splice(i, 1); g.cols.splice(i + d, 0, x); save(); draw(); });
          box.querySelectorAll('[data-cd]').forEach(b => b.onclick = async () => { const i = +b.dataset.cd; if (!await confirmBox(`حذف المهمة <b>${esc(g.cols[i].name)}</b> من الشبكة؟`, 'حذف')) return; g.cols.splice(i, 1); save(); draw(); });
          box.querySelector('[data-add]').onclick = () => { g.cols.push({ id: colId(), name: 'مهمة جديدة' }); save(); draw(); const ins = box.querySelectorAll('[data-cn]'); if (ins.length) { ins[ins.length - 1].focus(); ins[ins.length - 1].select(); } };
          const sug = box.querySelector('#tkSug'); sug.onchange = () => { if (sug.value) { g.cols.push({ id: colId(), name: sug.value }); save(); draw(); } };
          const mm = box.querySelector('#tkMemo'); if (mm) mm.onchange = () => { if (mm.value !== '') { const m = Memos.list(sy)[+mm.value]; g.cols.push({ id: colId(), name: m.subject || m.title }); save(); draw(); } };
          box.querySelector('#tkEmps').onclick = () => { const n = addTeachers(g); save(); draw(); toast(n ? `أدرج ${n} أستاذ(ة)` : 'كل الأساتذة مدرجون'); };
          box.querySelector('#tkRow').onclick = () => { g.rows.push({ id: uid('tr'), eid: '', name: '', unit: '', st: {} }); save(); draw(); };
          box.querySelector('#tkClear').onclick = async () => { if (!await confirmBox('إفراغ كل خانات الشبكة؟', 'إفراغ')) return; g.rows.forEach(r => { r.st = {}; }); save(); draw(); };
          box.querySelectorAll('[data-ru]').forEach(el => el.onchange = () => { g.rows[+el.dataset.ru].unit = nm(el.value); save(); });
          box.querySelectorAll('[data-rn]').forEach(el => el.onchange = () => { const r = g.rows[+el.dataset.rn]; r.name = nm(el.value); const e = K.E.byName(r.name); if (e) { r.eid = e.id; r.unit = r.unit || nm(e.unit); } save(); draw(); });
          box.querySelectorAll('[data-rd]').forEach(b => b.onclick = async () => { const r = g.rows[+b.dataset.rd]; if (nm(r.name) && !await confirmBox(`حذف <b>${esc(r.name)}</b> من الشبكة؟`, 'حذف')) return; g.rows.splice(+b.dataset.rd, 1); save(); draw(); });
          // 1.9.4: any employee of the list (teachers, administration, assigned staff…) can be added to the grid
          box.querySelector('#tkPick').onclick = () => {
            const inG = e => g.rows.some(x => (x.eid && x.eid === e.id) || nm(x.name) === nm(fullName(e)));
            const L = (DB.employees || []).filter(e => nm(fullName(e)) && !inG(e)).sort((a, b) => unitRank(a.unit) - unitRank(b.unit) || nm(fullName(a)).localeCompare(nm(fullName(b)), 'ar'));
            if (!L.length) return toast('كل الموظفين مدرجون في الشبكة');
            const body = document.createElement('div');
            body.innerHTML = `<div class="btn-row" style="margin-bottom:8px"><input class="inp" id="tpQ" placeholder="بحث بالاسم..." style="flex:1"><button type="button" class="btn sm" id="tpAll">تحديد الكل</button><button type="button" class="btn sm" id="tpNone">إلغاء التحديد</button></div>
              <div style="max-height:52vh;overflow:auto">${L.map(e => `<label class="chk" data-nm="${esc(fullName(e))}" style="display:flex;gap:8px;align-items:center;padding:5px 4px;border-bottom:1px solid var(--line,#eee)"><input type="checkbox" value="${esc(e.id)}"> <b>${esc(fullName(e))}</b> <span class="muted" style="font-size:12px">${esc([e.cadre, e.unit].filter(Boolean).join(' — '))}</span></label>`).join('')}</div>`;
            body.querySelector('#tpQ').oninput = ev => { const q = nm(ev.target.value); body.querySelectorAll('[data-nm]').forEach(l => { l.style.display = !q || l.dataset.nm.includes(q) ? 'flex' : 'none'; }); };
            body.querySelector('#tpAll').onclick = () => body.querySelectorAll('[data-nm]').forEach(l => { if (l.style.display !== 'none') l.querySelector('input').checked = true; });
            body.querySelector('#tpNone').onclick = () => body.querySelectorAll('input[type=checkbox]').forEach(c => { c.checked = false; });
            modal({ title: 'إضافة موظفين إلى الشبكة', body, actions: [{ label: ic('plus') + ' إضافة', cls: 'pri', onClick: m => {
              const ids = Array.from(body.querySelectorAll('input[type=checkbox]:checked')).map(c => c.value);
              if (!ids.length) { toast('اختر موظفا واحدا على الأقل', true); return false; }
              ids.forEach(id => { const e = DB.employees.find(x => x.id === id); if (e) g.rows.push({ id: uid('tr'), eid: e.id, name: fullName(e), unit: nm(e.unit), st: {} }); });
              save(); draw(); toast(`أضيف ${ids.length} موظف(ة)`);
            } }, { label: 'إلغاء' }] });
          };
          box.querySelectorAll('.tk-c').forEach(td => td.onclick = () => {
            const [ri, ci] = td.dataset.c.split(':').map(Number), r = g.rows[ri], c = g.cols[ci];
            r.st = r.st || {}; r.st[c.id] = ((r.st[c.id] || 0) + 1) % 3;
            td.className = 'tk-c s' + r.st[c.id]; td.innerHTML = cellHtml(r.st[c.id]); save();
          });
          box.querySelectorAll('.tk-h').forEach(th => th.onclick = () => { const c = g.cols[+th.dataset.col]; g.rows.forEach(r => { r.st = r.st || {}; r.st[c.id] = 1; }); save(); draw(); });
        };
        draw();
      }
    });
  }

  /* ---------- list of the grids ---------- */
  function list(v) {
    const sy = MK.curSy(), L = grids(sy);
    v.innerHTML = `<div class="page-h"><button class="btn" id="tkBack">${ic('back')} رجوع</button><h1>شبكة تتبع العمل التربوي بالمؤسسة</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span></div>
      <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">شبكة تُبيّن لكل أستاذ(ة) (حسب الوحدة المدرسية) ما أنجزه من المهام المطلوبة منه: <b>الأبواب المفتوحة، الورشات التذكيرية، روائز الموضعة، تسليم استعمال الزمن، غياب الشهر…</b> وتستطيع إضافة أي مهمة جديدة في أي وقت (حتى انطلاقا من مذكرة داخلية). الخانة المنجزة تظهر بوجه مبتسم أخضر فاتح، وتُطبع الشبكة بتوقيع المدير والمفتش المواكب.</div>
      <div class="sec-t" style="margin:6px 0 8px">إنشاء شبكة جديدة</div>
      <div class="hub-grid">
        <div class="card hub-card" data-new="sem1"><div class="hub-t">شبكة الأسدوس الأول</div><div class="hub-d">بمهام الدخول المدرسي: الأبواب المفتوحة، الورشات، الروائز، استعمال الزمن، غياب شتنبر.</div><div class="hub-a">${ic('plus')} إنشاء</div></div>
        <div class="card hub-card" data-new="sem2"><div class="hub-t">شبكة الأسدوس الثاني</div><div class="hub-d">مسك النقط، تقرير النتائج، خطة الدعم، الوثائق التربوية.</div><div class="hub-a">${ic('plus')} إنشاء</div></div>
        <div class="card hub-card" data-new="blank"><div class="hub-t">شبكة فارغة</div><div class="hub-d">ابدأ بالأساتذة فقط وأضف المهام التي تريد.</div><div class="hub-a">${ic('plus')} إنشاء</div></div></div>
      ${L.length ? `<div class="sec-t" style="margin:16px 0 8px">شبكات الموسم</div><div class="hub-grid">${L.map(g => `<div class="card hub-card" data-open="${g.id}"><div class="hub-t">${esc(g.title)} ${esc(g.period)}</div><div class="hub-d">${g.cols.length} مهمة — ${g.rows.length} أستاذ(ة) — الإنجاز ${progress(g)}%</div>
        <div class="hub-a"><button class="btn sm danger" data-del="${g.id}" onclick="event.stopPropagation()">حذف</button></div></div>`).join('')}</div>` : ''}`;
    $('#tkBack').onclick = () => go('documents', { cat: 'follow' });
    v.querySelectorAll('[data-new]').forEach(c => c.onclick = () => { const g = newGrid(sy, c.dataset.new); go('trackDoc', { id: g.id }); });
    v.querySelectorAll('[data-open]').forEach(c => c.onclick = () => go('trackDoc', { id: c.dataset.open }));
    v.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => { if (!await confirmBox('حذف هذه الشبكة نهائيا؟', 'حذف')) return; const a = grids(sy); a.splice(a.findIndex(x => x.id === b.dataset.del), 1); persist(); list(v); });
  }
  window.Track = { grids: grids, progress, summary: sy => { const L = grids(sy || MK.curSy()); return { n: L.length, avg: L.length ? Math.round(L.reduce((a, g) => a + progress(g), 0) / L.length) : 0 }; } };
  window.pageTrack = (v) => list(v);
  window.pageTrackDoc = (v, a) => editor(v, a);
})();
