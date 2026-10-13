'use strict';
/* إدارة العتاد والوسائل التعليمية — equipment (equip.js) and consumables stock: items, sources, arrivals (الواردات), deliveries (الصادرات),
   balances, receipt report per beneficiary (محضر تسلم), registers and reports. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();
  const num = v => MK.num(v), q = v => MK.fmtQty(v);

  const DEFAULT_SOURCES = ['المديرية الإقليمية', 'الأكاديمية الجهوية', 'جمعية دعم مدرسة النجاح', 'الجمعية الرياضية المدرسية', 'التعاونية المدرسية',
    'الجماعة الترابية', 'السلطة المحلية', 'المحسنون', 'محضر تسلم المهام', 'شركة النظافة', 'شركة الحراسة'];
  const SUGGESTED = ['Marqueur pour tableau magnétique', "Recharge d'encre pour marqueur", 'Brosse pour tableau magnétique', 'Rame de papier A4 blanc',
    'Rame de papier A3 blanc', 'Cartouche toner', 'Craie (boîte de 10)', 'Craie (boîte de 100)', 'Brosse pour tableau noir', 'Chemise bulle (paquet de 250)',
    'Chemise cartonnée (paquet de 100)', 'Règle de tableau', 'Équerre de tableau', "Rapporteur d'angle pour tableau", 'Compas de tableau', 'Drapeau',
    'Lampe économique', 'Robinet de service', 'Corbeille en plastique', 'Serrure et cadenas', 'Balai en fibre de nylon avec manche', 'Raclette en caoutchouc avec manche'];
  const OTHER_USE = 'صادر غير مسجل (استعمال المؤسسة)';

  function migrate(db) {
    const s = db.stock = db.stock || {};
    s.items = Array.isArray(s.items) ? s.items : [];
    s.sources = Array.isArray(s.sources) ? s.sources : DEFAULT_SOURCES.slice();
    s.benefs = Array.isArray(s.benefs) ? s.benefs : [];
    s.ins = Array.isArray(s.ins) ? s.ins : [];
    s.outs = Array.isArray(s.outs) ? s.outs : [];
    s.equip = Array.isArray(s.equip) ? s.equip : [];
    s.equipKinds = Array.isArray(s.equipKinds) ? s.equipKinds : [];
    if (!s.pvTitle) s.pvTitle = 'محضر تسلم المواد واللوازم المدرسية';
    // one employee list for the whole application: beneficiaries kept apart by early 1.8 builds move to «الموظفون»
    if (s.benefs.length && Array.isArray(db.employees)) {
      s.benefs.forEach(b => {
        const e = empFor(db, b.name, b.ppr, b.role).e;
        s.outs.forEach(o => { if (o.benef && o.benef.benefId === b.id) { delete o.benef.benefId; Object.assign(o.benef, { empId: e.id }); } });
      });
      s.benefs = [];
    }
  }
  window.Stock = { migrate };
  // employee matching a name (+ pay number), created in the employees list when missing
  function empFor(db, name, ppr, role) {
    name = String(name || '').trim(); ppr = String(ppr || '').replace(/\.0+$/, '').trim();
    const k = MK.hkey(name);
    let e = (ppr && db.employees.find(x => String(x.ppr || '') === ppr))
      || (k && db.employees.find(x => MK.hkey(fullName(x)) === k || MK.hkey((x.lastAr || '') + (x.firstAr || '')) === k));
    if (e) return { e, created: false };
    const sp = name.indexOf(' ');
    e = { id: uid('e'), firstAr: sp > 0 ? name.slice(0, sp) : name, lastAr: sp > 0 ? name.slice(sp + 1) : '', ppr };
    if (role) e.task = role;
    db.employees.push(e);
    return { e, created: true };
  }

  const SD = () => DB.stock;
  const key = s => MK.hkey(s);
  const itemById = id => SD().items.find(i => i.id === id);
  const itemName = id => (itemById(id) || {}).name || '—';
  const itemUnit = id => (itemById(id) || {}).unit || '';
  const itemByName = n => { const k = key(n); return k ? SD().items.find(i => key(i.name) === k) : null; };
  const sortedItems = () => SD().items.slice().sort((a, b) => a.name.localeCompare(b.name, 'fr', { sensitivity: 'base', numeric: true }));

  /* ---------- balances ---------- */
  // status of an item for [from, to]: before = opening + movements before `from`
  function sums(itemId, from, to) {
    const it = itemById(itemId);
    let before = num(it && it.opening), inn = 0, out = 0;
    SD().ins.forEach(r => { if (r.itemId !== itemId) return; const x = num(r.qty); if (from && r.date < from) before += x; else if (!to || r.date <= to) inn += x; });
    SD().outs.forEach(r => { if (r.itemId !== itemId) return; const x = num(r.qty); if (from && r.date < from) before -= x; else if (!to || r.date <= to) out += x; });
    return { before, inn, out, after: before + inn - out };
  }
  const balance = itemId => sums(itemId).after;
  // dashboard figures
  window.Stock.summary = () => {
    migrate(DB);
    const items = SD().items.filter(used);
    const eq = SD().equip || [];
    return { items: items.length, empty: items.filter(it => balance(it.id) <= 0).length, ins: SD().ins.length, outs: SD().outs.length,
      equip: eq.length, assigned: eq.filter(r => r.empId).length, broken: eq.filter(r => r.status === 'panne').length };
  };
  // an item that was in stock at some point (opening balance or arrivals)
  const used = it => num(it.opening) > 0 || SD().ins.some(r => r.itemId === it.id);
  // the running balance (by date) must never go below zero
  function check(itemId, ins, outs, opening) {
    const it = itemById(itemId);
    let bal = opening != null ? num(opening) : num(it && it.opening);
    const ev = [];
    ins.forEach(r => { if (r.itemId === itemId) ev.push([r.date || '', 0, num(r.qty)]); });
    outs.forEach(r => { if (r.itemId === itemId) ev.push([r.date || '', 1, -num(r.qty)]); });
    ev.sort((a, b) => a[0].localeCompare(b[0]) || a[1] - b[1]);
    for (const e of ev) { bal += e[2]; if (bal < -1e-9) return { ok: false, date: e[0], bal }; }
    return { ok: true, bal };
  }
  const checkMsg = (itemId, c) => `لا توجد كمية كافية من «${esc(itemName(itemId))}»: الرصيد سيصبح ${q(c.bal)} بتاريخ ${fmtDate(c.date)}`;

  /* ---------- beneficiaries ---------- */
  // options: employees, other beneficiaries, unregistered use
  function benefOptions() {
    const emps = sortedEmps().map(e => ({ k: 'e:' + e.id, name: fullName(e), ppr: e.ppr || '', role: e.cadre || e.task || '' }));
    return { emps };
  }
  const benefFromKey = k => {
    if (!k) return null;
    if (k === 'x:other') return { name: OTHER_USE, ppr: '', role: '' };
    const [t, id] = k.split(':');
    if (t === 'e') { const e = empById(id); return e ? { empId: e.id, name: fullName(e), ppr: e.ppr || '', role: e.cadre || e.task || '' } : null; }
    if (t === 'b') { const b = SD().benefs.find(x => x.id === id); return b ? { benefId: b.id, name: b.name, ppr: b.ppr || '', role: b.role || '' } : null; }
    return null;
  };
  const benefKeyOf = b => !b ? '' : b.empId ? 'e:' + b.empId : b.benefId ? 'b:' + b.benefId : b.name === OTHER_USE ? 'x:other' : 'n:' + b.name;
  // current name/ppr (employee data may have been edited since)
  const benefLive = b => {
    if (b && b.empId) { const e = empById(b.empId); if (e) return { name: fullName(e), ppr: e.ppr || '', role: e.cadre || e.task || '' }; }
    if (b && b.benefId) { const x = SD().benefs.find(y => y.id === b.benefId); if (x) return { name: x.name, ppr: x.ppr || '', role: x.role || '' }; }
    return b || { name: '—', ppr: '' };
  };
  const benefSelect = (id, sel) => {
    const { emps } = benefOptions();
    const o = x => `<option value="${esc(x.k)}" ${x.k === sel ? 'selected' : ''}>${esc(x.name)}${x.ppr ? ' — ' + esc(x.ppr) : ''}</option>`;
    const free = sel && sel.startsWith('n:') ? `<option value="${esc(sel)}" selected>${esc(sel.slice(2))}</option>` : '';
    return `<select class="inp" id="${id}"><option value=""></option>
      ${emps.length ? `<optgroup label="الموظفون">${emps.map(o).join('')}</optgroup>` : ''}
      <optgroup label="أخرى">${free}<option value="x:other" ${sel === 'x:other' ? 'selected' : ''}>${OTHER_USE}</option><option value="x:new">+ إضافة موظف(ة) جديد(ة) إلى لائحة الموظفين...</option></optgroup></select>`;
  };

  /* ================================================================= */
  let tab = 'equip';
  const flt = { from: '', to: '', item: '', src: '', q: '' };
  const resetPeriod = () => { const b = MK.syBoundsOf(MK.curSy()); flt.from = b.from; flt.to = MK.syRef(); };

  window.pageStock = function (v, arg) {
    migrate(DB);
    if (arg && arg.tab) tab = arg.tab;
    if (!flt.from && !flt.to && !flt.all) resetPeriod();
    if (window.Equip) Equip.migrate(DB);
    const TABS = [['equip', 'العتاد والأجهزة'], ['status', 'وضعية المخزون'], ['ins', 'سجل الواردات'], ['outs', 'سجل الصادرات'], ['settings', 'المواد والإعدادات']];
    const eq = tab === 'equip';
    v.innerHTML = `
      <div class="page-h"><h1>إدارة العتاد والوسائل التعليمية</h1><span class="sub">${eq ? `${(SD().equip || []).length} جهاز — ${(SD().equip || []).filter(r => r.empId).length} مسلم` : `${SD().items.length} مادة — ${SD().ins.length} وارد — ${SD().outs.length} صادر`}</span><span class="sp"></span>
        ${eq ? '' : `<button class="btn" id="sRep">${ic('print')} المحاضر والتقارير</button>
        <button class="btn" id="sIn">${ic('inbox')} تسجيل وارد</button>
        <button class="btn pri" id="sOut">${ic('outbox')} تسليم مواد</button>`}</div>
      <div class="mk-tabs"><div class="seg" id="sTabs">${TABS.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div id="sBody"></div>`;
    $$('#sTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; go('stock'); });
    const body = $('#sBody');
    if (eq) return window.Equip.tab(body);
    $('#sIn').onclick = () => inForm(null, () => go('stock'));
    $('#sOut').onclick = () => outForm(null, () => go('stock'));
    $('#sRep').onclick = () => go('stockDoc', { kind: tab === 'ins' ? 'ins' : tab === 'outs' ? 'outs' : 'status' });
    ({ status: tabStatus, ins: tabIns, outs: tabOuts, settings: tabSettings })[tab](body);
  };

  const periodBar = extra => `<div class="toolbar mk-period">
      <label>الفترة من</label><input type="date" class="inp" id="pFrom" value="${esc(flt.from)}">
      <label>إلى</label><input type="date" class="inp" id="pTo" value="${esc(flt.to)}">
      <button class="btn sm" id="pSy">الموسم الحالي</button><button class="btn sm" id="pAll">كل الفترات</button>
      ${extra || ''}</div>`;
  const bindPeriod = (root, draw) => {
    $('#pFrom', root).onchange = e => { flt.from = e.target.value; flt.all = !flt.from && !flt.to; draw(); };
    $('#pTo', root).onchange = e => { flt.to = e.target.value; flt.all = !flt.from && !flt.to; draw(); };
    $('#pSy', root).onclick = () => { flt.all = false; resetPeriod(); $('#pFrom', root).value = flt.from; $('#pTo', root).value = flt.to; draw(); };
    $('#pAll', root).onclick = () => { flt.from = ''; flt.to = ''; flt.all = true; $('#pFrom', root).value = ''; $('#pTo', root).value = ''; draw(); };
  };
  const inPeriod = d => (!flt.from || d >= flt.from) && (!flt.to || d <= flt.to);
  const itemFilterSel = () => `<select class="inp" id="fItem" style="width:auto;max-width:260px"><option value="">كل المواد</option>${sortedItems().map(i => `<option value="${i.id}" ${flt.item === i.id ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select>`;

  /* ---------- status ---------- */
  function statusRows(from, to) {
    return sortedItems().map(i => ({ it: i, ...sums(i.id, from, to) }));
  }
  function tabStatus(b) {
    b.innerHTML = `<div class="card">${periodBar(`<span class="sp" style="flex:1"></span><button class="btn sm" id="xSt">${ic('down')} تصدير Excel</button><button class="btn sm" id="pSt">${ic('print')} طباعة الوضعية</button>`)}
      <div class="card-b kpis" id="stK"></div><div id="stT"></div></div>`;
    const draw = () => {
      const rows = statusRows(flt.from, flt.to);
      const out0 = rows.filter(r => r.after <= 0 && used(r.it)).length, low = rows.filter(r => r.after > 0 && num(r.it.min) > 0 && r.after <= num(r.it.min)).length;
      $('#stK').innerHTML = `<div>عدد المواد: <b>${rows.length}</b></div><div>الوارد خلال الفترة: <b>${q(rows.reduce((s, r) => s + r.inn, 0))}</b></div>
        <div>المنصرف خلال الفترة: <b>${q(rows.reduce((s, r) => s + r.out, 0))}</b></div><div>مواد نفدت: <b style="color:var(--red)">${out0}</b></div>${low ? `<div>تحت الحد الأدنى: <b style="color:var(--gold)">${low}</b></div>` : ''}`;
      $('#stT').innerHTML = rows.length ? `<table class="tbl"><thead><tr><th style="width:40px">#</th><th>المادة</th><th>الوحدة</th><th>الرصيد السابق</th><th>الوارد</th><th>المنصرف</th><th>الرصيد الحالي</th><th></th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr data-id="${r.it.id}"><td class="muted num">${i + 1}</td><td><b>${esc(r.it.name)}</b></td><td class="muted">${esc(r.it.unit || '')}</td>
          <td class="num">${q(r.before)}</td><td class="num" style="color:${r.inn ? 'var(--pri)' : 'inherit'}">${q(r.inn)}</td><td class="num" style="color:${r.out ? 'var(--red)' : 'inherit'}">${q(r.out)}</td>
          <td class="num"><b>${q(r.after)}</b> ${r.after <= 0 && used(r.it) ? '<span class="tag inquiry">نفد</span>' : (num(r.it.min) > 0 && r.after <= num(r.it.min) ? '<span class="tag certificate">منخفض</span>' : '')}</td>
          <td class="act"><button class="btn sm" data-a="in">${ic('inbox')} وارد</button> <button class="btn sm" data-a="out">${ic('outbox')} تسليم</button> <button class="btn sm" data-a="who">المستفيدون</button></td></tr>`).join('')}
        </tbody></table>` : `<div class="empty-state">لا توجد مواد بعد. أضف المواد من «المواد والإعدادات» أو سجل وارداً جديداً، أو استورد بياناتك من Excel.</div>`;
      $$('#stT tr[data-id]').forEach(tr => $$('[data-a]', tr).forEach(btn => btn.onclick = () => {
        const id = tr.dataset.id;
        if (btn.dataset.a === 'in') inForm(null, draw, { itemId: id });
        if (btn.dataset.a === 'out') outForm(null, draw, { itemId: id });
        if (btn.dataset.a === 'who') go('stockDoc', { kind: 'item', itemId: id });
      }));
    };
    bindPeriod(b, draw);
    $('#xSt').onclick = exportStatus;
    $('#pSt').onclick = () => go('stockDoc', { kind: 'status' });
    draw();
  }

  /* ---------- arrivals ---------- */
  function tabIns(b) {
    b.innerHTML = `<div class="card">${periodBar()}
      <div class="toolbar">${itemFilterSel()}
        <select class="inp" id="fSrc" style="width:auto;max-width:240px"><option value="">كل المصادر</option>${SD().sources.map(s => `<option ${flt.src === s ? 'selected' : ''}>${esc(s)}</option>`).join('')}</select>
        <span style="flex:1"></span><button class="btn sm" id="xIn">${ic('down')} تصدير Excel</button><button class="btn sm" id="pIn">${ic('print')} طباعة السجل</button></div>
      <div id="inT"></div></div>`;
    const draw = () => {
      const list = SD().ins.filter(r => inPeriod(r.date) && (!flt.item || r.itemId === flt.item) && (!flt.src || r.source === flt.src))
        .sort((a, c) => (c.date || '').localeCompare(a.date || '') || (c.created || '').localeCompare(a.created || ''));
      $('#inT').innerHTML = list.length ? `<table class="tbl"><thead><tr><th style="width:40px">#</th><th>تاريخ الوصول</th><th>المادة</th><th>المصدر</th><th>الكمية</th><th>المرجع</th><th></th></tr></thead><tbody>
        ${list.map((r, i) => `<tr data-id="${r.id}"><td class="muted num">${list.length - i}</td><td class="num">${fmtDate(r.date)}</td><td><b>${esc(itemName(r.itemId))}</b></td><td>${esc(r.source || '')}</td>
          <td class="num"><b>${q(r.qty)}</b> <small class="muted">${esc(itemUnit(r.itemId))}</small></td><td class="muted">${esc(r.ref || '')}${r.note ? ` <small>(${esc(r.note)})</small>` : ''}</td>
          <td class="act"><button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>`
        : '<div class="empty-state">لا توجد واردات خلال هذه الفترة</div>';
      $$('#inT tr[data-id]').forEach(tr => {
        const r = SD().ins.find(x => x.id === tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          if (btn.dataset.a === 'edit') inForm(r, draw);
          if (btn.dataset.a === 'del') {
            const c = check(r.itemId, SD().ins.filter(x => x.id !== r.id), SD().outs);
            if (!c.ok) return toast('لا يمكن حذف هذا الوارد: ' + checkMsg(r.itemId, c).replace(/<[^>]+>/g, ''), true);
            if (!await confirmBox(`حذف وارد <b>${esc(itemName(r.itemId))}</b> (${q(r.qty)}) بتاريخ ${fmtDate(r.date)}؟`, 'حذف')) return;
            SD().ins = SD().ins.filter(x => x.id !== r.id); persist(); draw(); toast('تم الحذف');
          }
        });
      });
    };
    bindPeriod(b, draw);
    $('#fItem').onchange = e => { flt.item = e.target.value; draw(); };
    $('#fSrc').onchange = e => { flt.src = e.target.value; draw(); };
    $('#xIn').onclick = exportIns;
    $('#pIn').onclick = () => go('stockDoc', { kind: 'ins', itemId: flt.item, src: flt.src });
    draw();
  }

  /* ---------- deliveries ---------- */
  function tabOuts(b) {
    b.innerHTML = `<div class="card">${periodBar()}
      <div class="toolbar">${itemFilterSel()}
        <div class="search">${ic('search')}<input class="inp" id="fQ" placeholder="بحث باسم المستفيد أو رقم التأجير..." value="${esc(flt.q)}"></div>
        <span style="flex:1"></span><button class="btn sm" id="xOut">${ic('down')} تصدير Excel</button><button class="btn sm" id="pOut">${ic('print')} تقرير المواد المسلمة</button></div>
      <div id="outT"></div></div>`;
    const draw = () => {
      const qq = flt.q.trim().toLowerCase();
      const list = SD().outs.filter(r => inPeriod(r.date) && (!flt.item || r.itemId === flt.item) && (!qq || (benefLive(r.benef).name + ' ' + (benefLive(r.benef).ppr || '')).toLowerCase().includes(qq)))
        .sort((a, c) => (c.date || '').localeCompare(a.date || '') || (c.created || '').localeCompare(a.created || ''));
      $('#outT').innerHTML = list.length ? `<table class="tbl"><thead><tr><th style="width:40px">#</th><th>تاريخ التسليم</th><th>المستفيد(ة)</th><th>رقم التأجير</th><th>المادة</th><th>الكمية</th><th></th></tr></thead><tbody>
        ${list.map((r, i) => { const bl = benefLive(r.benef); return `<tr data-id="${r.id}"><td class="muted num">${list.length - i}</td><td class="num">${fmtDate(r.date)}</td><td><b>${esc(bl.name)}</b></td><td class="num">${esc(bl.ppr || '')}</td>
          <td>${esc(itemName(r.itemId))}</td><td class="num"><b>${q(r.qty)}</b> <small class="muted">${esc(itemUnit(r.itemId))}</small></td>
          <td class="act"><button class="btn sm" data-a="pv">${ic('print')} المحضر</button> <button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`; }).join('')}</tbody></table>`
        : '<div class="empty-state">لا توجد مواد مسلمة خلال هذه الفترة</div>';
      $$('#outT tr[data-id]').forEach(tr => {
        const r = SD().outs.find(x => x.id === tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          if (btn.dataset.a === 'pv') go('stockDoc', { kind: 'pv', benefKey: benefKeyOf(r.benef), from: r.date, to: r.date, batch: r.batch });
          if (btn.dataset.a === 'edit') outForm(r, draw);
          if (btn.dataset.a === 'del') {
            if (!await confirmBox(`حذف تسليم <b>${esc(itemName(r.itemId))}</b> (${q(r.qty)}) إلى ${esc(benefLive(r.benef).name)}؟`, 'حذف')) return;
            SD().outs = SD().outs.filter(x => x.id !== r.id); persist(); draw(); toast('تم الحذف');
          }
        });
      });
    };
    bindPeriod(b, draw);
    $('#fItem').onchange = e => { flt.item = e.target.value; draw(); };
    $('#fQ').oninput = e => { flt.q = e.target.value; draw(); };
    $('#xOut').onclick = exportOuts;
    $('#pOut').onclick = () => go('stockDoc', { kind: 'outs', itemId: flt.item });
    draw();
  }

  /* ---------- arrival form (several items at once) ---------- */
  function inForm(rec, after, preset) {
    const body = document.createElement('div');
    const lines = rec ? [{ item: itemName(rec.itemId), qty: rec.qty }] : [{ item: preset && preset.itemId ? itemName(preset.itemId) : '', qty: '' }];
    body.innerHTML = `<div class="fgrid">
      <div class="fld"><label>تاريخ الوصول <span style="color:var(--red)">*</span></label><input class="inp" type="date" id="iDate" value="${esc(rec ? rec.date : today())}"></div>
      <div class="fld"><label>المصدر <span style="color:var(--red)">*</span></label><input class="inp" id="iSrc" list="iSrcL" value="${esc(rec ? rec.source : (SD().sources[0] || ''))}"><datalist id="iSrcL">${SD().sources.map(s => `<option value="${esc(s)}">`).join('')}</datalist></div>
      <div class="fld"><label>المرجع (رقم الإرسالية / المحضر...)</label><input class="inp" id="iRef" value="${esc(rec ? rec.ref || '' : '')}"></div>
      <div class="fld"><label>ملاحظة</label><input class="inp" id="iNote" value="${esc(rec ? rec.note || '' : '')}"></div>
      <div class="full sec-t">المواد الواردة</div>
      <div class="full"><table class="mk-lines-t"><thead><tr><th>المادة</th><th style="width:120px">الكمية</th><th style="width:44px"></th></tr></thead><tbody id="iLines"></tbody></table>
        <datalist id="iItemsL">${sortedItems().map(i => `<option value="${esc(i.name)}">`).join('')}</datalist>
        ${rec ? '' : `<button class="btn sm" id="iAdd" style="margin-top:6px">${ic('plus')} إضافة سطر</button>`}
        <div class="hint muted" style="font-size:11.5px;margin-top:6px">اكتب اسم المادة أو اختره من القائمة. المادة غير الموجودة تضاف تلقائيا إلى لائحة المواد.</div></div></div>`;
    const drawLines = () => {
      $('#iLines', body).innerHTML = lines.map((l, i) => `<tr><td><input class="inp" data-i="${i}" data-f="item" list="iItemsL" value="${esc(l.item)}"></td>
        <td><input class="inp" type="number" min="0" step="any" data-i="${i}" data-f="qty" value="${esc(l.qty)}"></td>
        <td>${lines.length > 1 ? `<button class="btn sm danger icon" data-rm="${i}">${ic('trash')}</button>` : ''}</td></tr>`).join('');
      $$('[data-f]', body).forEach(el => el.oninput = () => { lines[+el.dataset.i][el.dataset.f] = el.value; });
      $$('[data-rm]', body).forEach(el => el.onclick = () => { lines.splice(+el.dataset.rm, 1); drawLines(); });
    };
    drawLines();
    if ($('#iAdd', body)) $('#iAdd', body).onclick = () => { lines.push({ item: '', qty: '' }); drawLines(); const ins = $$('[data-f=item]', body); ins[ins.length - 1].focus(); };
    modal({ title: rec ? 'تعديل وارد' : 'تسجيل وارد', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      const date = $('#iDate', body).value, source = $('#iSrc', body).value.trim(), ref = $('#iRef', body).value.trim(), note = $('#iNote', body).value.trim();
      if (!date) { toast('المرجو إدخال تاريخ الوصول', true); return false; }
      if (!source) { toast('المرجو تحديد المصدر', true); return false; }
      const ok = lines.filter(l => String(l.item).trim() || String(l.qty).trim());
      if (!ok.length) { toast('أضف مادة واحدة على الأقل', true); return false; }
      for (const l of ok) {
        if (!String(l.item).trim()) { toast('المرجو كتابة اسم المادة في كل سطر', true); return false; }
        if (!(num(l.qty) > 0)) { toast('الكمية يجب أن تكون أكبر من صفر: ' + l.item, true); return false; }
      }
      const added = [];
      const resolve = n => { let it = itemByName(n); if (!it) { it = { id: uid('it'), name: String(n).trim(), unit: '', opening: 0, min: '' }; SD().items.push(it); added.push(it.name); } return it; };
      if (!SD().sources.some(s => key(s) === key(source))) SD().sources.push(source);
      const now = new Date().toISOString();
      if (rec) {
        const it = resolve(ok[0].item);
        const nr = Object.assign({}, rec, { itemId: it.id, qty: num(ok[0].qty), date, source, ref, note });
        for (const id of new Set([rec.itemId, it.id])) {
          const c = check(id, SD().ins.map(x => x.id === rec.id ? nr : x), SD().outs);
          if (!c.ok) { toast('لا يمكن هذا التعديل: ' + checkMsg(id, c).replace(/<[^>]+>/g, ''), true); return false; }
        }
        Object.assign(rec, nr, { updated: now });
      } else {
        ok.forEach(l => { const it = resolve(l.item); SD().ins.push({ id: uid('in'), itemId: it.id, qty: num(l.qty), date, source, ref, note, created: now }); });
      }
      persist(); after && after();
      toast(rec ? 'تم حفظ التعديل' : `تم تسجيل ${ok.length} وارد${added.length ? ` (مواد جديدة: ${added.join('، ')})` : ''}`);
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- delivery form ---------- */
  function outForm(rec, after, preset) {
    if (!SD().items.length) return toast('أضف المواد وسجل الواردات أولا', true);
    const body = document.createElement('div');
    let bkey = rec ? benefKeyOf(rec.benef) : (preset && preset.benefKey) || '';
    const lines = rec ? [{ itemId: rec.itemId, qty: rec.qty }] : [{ itemId: preset && preset.itemId || '', qty: '' }];
    body.innerHTML = `<div class="fgrid">
      <div class="fld full"><label>المستفيد(ة) <span style="color:var(--red)">*</span></label><div id="oBen">${benefSelect('oBenSel', bkey)}</div>
        <div id="oNew" style="display:none;margin-top:8px"><div class="fgrid"><input class="inp" id="oNewFirst" placeholder="الاسم الشخصي"><input class="inp" id="oNewLast" placeholder="الاسم العائلي"></div>
          <input class="inp" id="oNewPpr" placeholder="رقم التأجير" style="margin-top:8px"><div class="hint muted" style="font-size:11.5px;margin-top:4px">يضاف إلى لائحة الموظفين (يمكن إتمام معطياته من صفحة «الموظفون»).</div></div></div>
      <div class="fld"><label>تاريخ التسليم <span style="color:var(--red)">*</span></label><input class="inp" type="date" id="oDate" value="${esc(rec ? rec.date : today())}"></div>
      <div class="fld"><label>ملاحظة</label><input class="inp" id="oNote" value="${esc(rec ? rec.note || '' : '')}"></div>
      <div class="full sec-t">المواد المسلمة</div>
      <div class="full"><table class="mk-lines-t"><thead><tr><th>المادة</th><th style="width:110px">الكمية</th><th style="width:110px">المتوفر حاليا</th><th style="width:44px"></th></tr></thead><tbody id="oLines"></tbody></table>
        ${rec ? '' : `<button class="btn sm" id="oAdd" style="margin-top:6px">${ic('plus')} إضافة سطر</button>`}</div></div>`;
    const avail = id => { if (!id) return ''; let b = balance(id); if (rec && rec.itemId === id) b += num(rec.qty); return b; };
    const drawLines = () => {
      const opts = sel => `<option value=""></option>${sortedItems().map(i => `<option value="${i.id}" ${i.id === sel ? 'selected' : ''}>${esc(i.name)} (${q(avail(i.id))})</option>`).join('')}`;
      $('#oLines', body).innerHTML = lines.map((l, i) => `<tr><td><select class="inp" data-i="${i}" data-f="itemId">${opts(l.itemId)}</select></td>
        <td><input class="inp" type="number" min="0" step="any" data-i="${i}" data-f="qty" value="${esc(l.qty)}"></td>
        <td class="num" style="text-align:center">${l.itemId ? `<b style="color:${avail(l.itemId) > 0 ? 'var(--pri)' : 'var(--red)'}">${q(avail(l.itemId))}</b> <small class="muted">${esc(itemUnit(l.itemId))}</small>` : ''}</td>
        <td>${lines.length > 1 ? `<button class="btn sm danger icon" data-rm="${i}">${ic('trash')}</button>` : ''}</td></tr>`).join('');
      $$('[data-f]', body).forEach(el => {
        el.oninput = () => { lines[+el.dataset.i][el.dataset.f] = el.value; };
        if (el.tagName === 'SELECT') el.onchange = () => { lines[+el.dataset.i].itemId = el.value; drawLines(); };
      });
      $$('[data-rm]', body).forEach(el => el.onclick = () => { lines.splice(+el.dataset.rm, 1); drawLines(); });
    };
    drawLines();
    const benSel = () => $('#oBenSel', body);
    const onBen = () => { $('#oNew', body).style.display = benSel().value === 'x:new' ? '' : 'none'; if (benSel().value === 'x:new') $('#oNewFirst', body).focus(); };
    benSel().onchange = onBen;
    if ($('#oAdd', body)) $('#oAdd', body).onclick = () => { lines.push({ itemId: '', qty: '' }); drawLines(); };
    const save = () => {
      let k = benSel().value;
      if (k === 'x:new') {
        const firstAr = $('#oNewFirst', body).value.trim(), lastAr = $('#oNewLast', body).value.trim(), ppr = $('#oNewPpr', body).value.trim();
        if (!firstAr || !lastAr) { toast('المرجو كتابة الاسم الشخصي والعائلي للموظف(ة)', true); return null; }
        const dup = ppr && DB.employees.find(x => String(x.ppr || '') === ppr);
        if (dup) { toast('رقم التأجير مستعمل لموظف آخر: ' + fullName(dup), true); return null; }
        const ne = { id: uid('e'), firstAr, lastAr, ppr };
        DB.employees.push(ne); k = 'e:' + ne.id;
      }
      const benef = k && k.startsWith('n:') ? { name: k.slice(2), ppr: '' } : benefFromKey(k);
      if (!benef) { toast('المرجو اختيار المستفيد(ة)', true); return null; }
      const date = $('#oDate', body).value, note = $('#oNote', body).value.trim();
      if (!date) { toast('المرجو إدخال تاريخ التسليم', true); return null; }
      const ok = lines.filter(l => l.itemId || String(l.qty).trim());
      if (!ok.length) { toast('أضف مادة واحدة على الأقل', true); return null; }
      for (const l of ok) {
        if (!l.itemId) { toast('المرجو اختيار المادة في كل سطر', true); return null; }
        if (!(num(l.qty) > 0)) { toast('الكمية يجب أن تكون أكبر من صفر', true); return null; }
      }
      const now = new Date().toISOString();
      const batch = rec ? rec.batch : uid('bt');
      const news = ok.map(l => ({ id: rec ? rec.id : uid('out'), itemId: l.itemId, qty: num(l.qty), date, benef, note, batch, created: rec ? rec.created : now }));
      const outs2 = SD().outs.filter(x => !rec || x.id !== rec.id).concat(news);
      for (const id of new Set(news.map(n => n.itemId).concat(rec ? [rec.itemId] : []))) {
        const c = check(id, SD().ins, outs2);
        if (!c.ok) { toast(checkMsg(id, c).replace(/<[^>]+>/g, ''), true); return null; }
      }
      if (rec) Object.assign(rec, news[0], { updated: now }); else SD().outs.push(...news);
      persist(); after && after();
      toast(rec ? 'تم حفظ التعديل' : `تم تسجيل تسليم ${news.length} مادة إلى ${benef.name}`);
      return { benef, date, batch };
    };
    modal({ title: rec ? 'تعديل تسليم' : 'تسليم مواد لمستفيد(ة)', body, actions: [
      { label: ic('save') + ' حفظ', cls: 'pri', onClick: () => !!save() || false },
      ...(rec ? [] : [{ label: ic('print') + ' حفظ وطباعة المحضر', onClick: () => { const r = save(); if (!r) return false; go('stockDoc', { kind: 'pv', benefKey: benefKeyOf(r.benef), from: r.date, to: r.date, batch: r.batch }); } }]),
      { label: 'إلغاء' }] });
    onBen();
  }

  /* ---------- settings: items, sources, other beneficiaries ---------- */
  function tabSettings(b) {
    b.innerHTML = `<div class="settings-grid">
      <div class="card"><div class="card-h"><h3>المواد واللوازم</h3><span style="flex:1"></span>
          ${SD().items.length < 3 ? `<button class="btn sm" id="sugg">إضافة القائمة المقترحة</button>` : ''}<button class="btn sm pri" id="addIt">${ic('plus')} إضافة مادة</button></div>
        <div id="itT"></div></div>
      <div class="grid">
        <div class="card"><div class="card-h"><h3>استيراد من Excel</h3></div><div class="card-b">
          <p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.8">يمكن استيراد بياناتك من ملف Excel لبرنامج تدبير المخزون (بصيغة xlsm أو xlsx)، أو من أي ملف Excel يحتوي على الأعمدة:
            <b>المواد</b>، <b>المصدر</b>. وإذا احتوى الملف على لائحة الأساتذة أو على سجلي الواردات والصادرات فسيتم استيرادها أيضا (الأساتذة يضافون إلى لائحة الموظفين).</p>
          <div class="btn-row"><button class="btn" id="impSt">${ic('up')} استيراد ملف Excel</button><button class="btn" id="tplSt">${ic('down')} نموذج فارغ</button></div></div></div>
        <div class="card"><div class="card-h"><h3>المصادر</h3></div><div class="card-b"><div class="chips" id="srcC"></div>
          <div class="btn-row" style="margin-top:10px"><input class="inp" id="srcN" placeholder="مصدر جديد..." style="flex:1"><button class="btn sm" id="srcA">${ic('plus')} إضافة</button></div></div></div>
        <div class="card"><div class="card-h"><h3>المستفيدون</h3><span style="flex:1"></span><button class="btn sm" id="bnA">${ic('users')} لائحة الموظفين (${DB.employees.length})</button></div>
          <div class="card-b muted" style="font-size:12.5px;line-height:1.8">المستفيدون من المواد هم موظفو المؤسسة المسجلون في صفحة «الموظفون»: لائحة واحدة للتطبيق كاملا.
            لإضافة مستفيد(ة) أضفه(ا) في «الموظفون» أو مباشرة من نافذة «تسليم مواد».</div></div>
        <div class="card"><div class="card-h"><h3>المحضر</h3></div><div class="card-b">
          <div class="fld"><label>عنوان محضر التسلم</label><input class="inp" id="pvT" value="${esc(SD().pvTitle)}"></div></div></div>
      </div></div>`;
    const drawItems = () => {
      const list = sortedItems();
      $('#itT').innerHTML = list.length ? `<div style="max-height:calc(100vh - 260px);overflow:auto"><table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>المادة</th><th>الوحدة</th><th title="الرصيد عند بداية استعمال البرنامج">الرصيد الأولي</th><th>الحد الأدنى</th><th>الرصيد</th><th></th></tr></thead><tbody>
        ${list.map((i, n) => `<tr data-id="${i.id}"><td class="muted num">${n + 1}</td><td><b>${esc(i.name)}</b></td><td class="muted">${esc(i.unit || '')}</td><td class="num">${q(i.opening)}</td><td class="num muted">${i.min ? q(i.min) : ''}</td><td class="num"><b>${q(balance(i.id))}</b></td>
          <td class="act"><button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty-state">لا توجد مواد. أضف مادة أو استعمل «القائمة المقترحة» أو استورد من Excel.</div>';
      $$('#itT tr[data-id]').forEach(tr => {
        const it = itemById(tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          if (btn.dataset.a === 'edit') itemForm(it, drawItems);
          if (btn.dataset.a === 'del') {
            const n = SD().ins.filter(x => x.itemId === it.id).length + SD().outs.filter(x => x.itemId === it.id).length;
            if (n) return toast(`لا يمكن حذف هذه المادة: مستعملة في ${n} عملية (وارد/صادر). احذف العمليات أولا.`, true);
            if (!await confirmBox(`حذف المادة <b>${esc(it.name)}</b>؟`, 'حذف')) return;
            SD().items = SD().items.filter(x => x.id !== it.id); persist(); drawItems();
          }
        });
      });
    };
    const drawSrc = () => {
      $('#srcC').innerHTML = SD().sources.map((s, i) => `<span class="chip">${esc(s)}<button data-i="${i}" title="حذف">✕</button></span>`).join('') || '<span class="muted">لا توجد مصادر</span>';
      $$('#srcC [data-i]').forEach(x => x.onclick = () => { SD().sources.splice(+x.dataset.i, 1); persist(); drawSrc(); });
    };
    $('#addIt').onclick = () => itemForm(null, drawItems);
    if ($('#sugg')) $('#sugg').onclick = () => {
      let n = 0; SUGGESTED.forEach(name => { if (!itemByName(name)) { SD().items.push({ id: uid('it'), name, unit: '', opening: 0, min: '' }); n++; } });
      persist(); go('stock', { tab: 'settings' }); toast(`أضيفت ${n} مادة`);
    };
    $('#srcA').onclick = () => { const s = $('#srcN').value.trim(); if (!s) return; if (!SD().sources.some(x => key(x) === key(s))) SD().sources.push(s); $('#srcN').value = ''; persist(); drawSrc(); };
    $('#srcN').onkeydown = e => { if (e.key === 'Enter') $('#srcA').click(); };
    $('#bnA').onclick = () => go('employees');
    $('#pvT').oninput = e => { SD().pvTitle = e.target.value; persist(); };
    $('#impSt').onclick = importStock;
    $('#tplSt').onclick = async () => {
      const rows = [['المواد', 'الوحدة', 'الرصيد الأولي', 'المصدر']];
      for (let i = 0; i < 40; i++) rows.push(['', '', '', '']);
      const r = await window.api.saveXlsx(rows, 'نموذج_المخزون.xlsx', 'الإعدادات', [36, 12, 14, 30]);
      if (r.ok) toast('تم حفظ النموذج: املأه ثم استورده');
    };
    drawItems(); drawSrc();
  }
  function itemForm(it, after) {
    const d = it || { name: '', unit: '', opening: '', min: '' };
    const body = `<div class="fgrid"><div class="fld full"><label>اسم المادة <span style="color:var(--red)">*</span></label><input class="inp" id="tN" value="${esc(d.name)}"></div>
      <div class="fld"><label>الوحدة (علبة، رزمة، قطعة...)</label><input class="inp" id="tU" value="${esc(d.unit || '')}"></div>
      <div class="fld"><label>الرصيد الأولي (قبل التسجيل في البرنامج)</label><input class="inp" type="number" min="0" step="any" id="tO" value="${esc(d.opening || '')}"></div>
      <div class="fld"><label>الحد الأدنى للتنبيه (اختياري)</label><input class="inp" type="number" min="0" step="any" id="tM" value="${esc(d.min || '')}"></div></div>`;
    modal({ title: it ? 'تعديل مادة' : 'إضافة مادة', size: 'sm', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: m => {
      const name = $('#tN', m).value.trim();
      if (!name) { toast('المرجو كتابة اسم المادة', true); return false; }
      const dup = itemByName(name);
      if (dup && dup !== it) { toast('هذه المادة موجودة في القائمة', true); return false; }
      const opening = num($('#tO', m).value);
      if (it) { const c = check(it.id, SD().ins, SD().outs, opening); if (!c.ok) { toast('لا يمكن هذا الرصيد الأولي: ' + checkMsg(it.id, c).replace(/<[^>]+>/g, ''), true); return false; } }
      const o = { name, unit: $('#tU', m).value.trim(), opening, min: $('#tM', m).value.trim() };
      if (it) Object.assign(it, o); else SD().items.push(Object.assign({ id: uid('it') }, o));
      persist(); after && after(); toast('تم الحفظ');
    } }, { label: 'إلغاء' }] });
  }
  /* ---------- Excel import (stock settings file, or the whole Excel stock program) ---------- */
  const IMP = MK.matcher({
    item: ['المواد', 'المادة', 'اسم المادة', 'Article', 'Désignation', 'Produit'], unit: ['الوحدة', 'Unité'], opening: ['الرصيد الأولي', 'الرصيد السابق', 'أرصدة سابقة'],
    source: ['المصدر', 'المصادر', 'Source'], benef: ['الأساتذة', 'الأستاذ', 'الأستاذ(ة)', 'المستفيد', 'المستفيد(ة)', 'المستفيدون', 'الاسم الكامل'],
    ppr: ['رقم التأجير', 'الرقم المالي', 'PPR'], qty: ['الكمية', 'Quantité'], dIn: ['تاريخ الوصول', 'تاريخ الورود'], dOut: ['تاريخ التسليم'], ref: ['المرجع']
  });
  async function importStock() {
    const sheets = await MK.openTable(); if (!sheets) return;
    const cnt = { items: 0, sources: 0, emps: 0, ins: 0, outs: 0, dup: 0 };
    const resolveItem = n => { let it = itemByName(n); if (!it) { it = { id: uid('it'), name: n, unit: '', opening: 0, min: '' }; SD().items.push(it); cnt.items++; } return it; };
    const addSource = s => { if (s && !SD().sources.some(x => key(x) === key(s))) { SD().sources.push(s); cnt.sources++; } };
    const findBenef = (name, ppr) => {
      if (key(name) === key('صادر غير مسجل') || key(name) === key(OTHER_USE)) return { name: OTHER_USE, ppr: '' };
      const r = empFor(DB, name, ppr); if (r.created) cnt.emps++;
      return { empId: r.e.id, name: fullName(r.e), ppr: r.e.ppr || '', role: r.e.cadre || '' };
    };
    const sig = new Set(SD().ins.map(r => ['i', r.itemId, r.date, num(r.qty), key(r.source)].join('|')).concat(SD().outs.map(r => ['o', r.itemId, r.date, num(r.qty), key(benefLive(r.benef).name)].join('|'))));
    let used = 0;
    sheets.forEach(sh => {
      const h = MK.headerRow(sh.rows, IMP, 2); if (!h) return;
      const col = {}; h.map.forEach((k, i) => { if (k && col[k] == null) col[k] = i; });
      const g = (r, k) => (col[k] == null ? '' : String(r[col[k]] == null ? '' : r[col[k]]).trim());
      const rows = sh.rows.slice(h.hi + 1);
      const now = new Date().toISOString();
      if (col.qty != null && col.item != null && col.dIn != null) {          // arrivals register
        used++;
        rows.forEach(r => {
          const n = g(r, 'item'), qty = num(g(r, 'qty')); if (!n || !(qty > 0)) return;
          const it = resolveItem(n), date = normDate(g(r, 'dIn')) || today(), src = g(r, 'source');
          addSource(src);
          const s = ['i', it.id, date, qty, key(src)].join('|'); if (sig.has(s)) { cnt.dup++; return; } sig.add(s);
          SD().ins.push({ id: uid('in'), itemId: it.id, qty, date, source: src, ref: g(r, 'ref'), note: '', created: now }); cnt.ins++;
        });
      } else if (col.qty != null && col.item != null && col.dOut != null) {  // deliveries register
        used++;
        rows.forEach(r => {
          const n = g(r, 'item'), qty = num(g(r, 'qty')), who = g(r, 'benef'); if (!n || !(qty > 0) || !who) return;
          const it = resolveItem(n), date = normDate(g(r, 'dOut')) || today(), benef = findBenef(who, g(r, 'ppr'));
          const s = ['o', it.id, date, qty, key(benef.name)].join('|'); if (sig.has(s)) { cnt.dup++; return; } sig.add(s);
          SD().outs.push({ id: uid('out'), itemId: it.id, qty, date, benef, note: '', batch: 'imp' + date + key(benef.name), created: now }); cnt.outs++;
        });
      } else if (col.item != null || col.source != null || col.benef != null) { // lists
        used++;
        rows.forEach(r => {
          const n = g(r, 'item');
          if (n) { const ex = itemByName(n); const it = resolveItem(n); if (!ex) { it.unit = g(r, 'unit'); it.opening = num(g(r, 'opening')); } }
          addSource(g(r, 'source'));
          const who = g(r, 'benef'); if (who) findBenef(who, g(r, 'ppr'));
        });
      }
    });
    if (!used) return toast('لم يتم العثور على أعمدة معروفة (المواد، المصدر، الأساتذة، رقم التأجير...)', true);
    persist(); go('stock', { tab: 'settings' });
    const neg = SD().items.filter(i => !check(i.id, SD().ins, SD().outs).ok).length;
    toast(`تم الاستيراد: ${cnt.items} مادة، ${cnt.sources} مصدر، ${cnt.ins} وارد، ${cnt.outs} صادر${cnt.emps ? `، وأضيف ${cnt.emps} موظف(ة) إلى لائحة الموظفين` : ''}${cnt.dup ? ` (تم تجاهل ${cnt.dup} عملية مكررة)` : ''}`);
    if (neg) setTimeout(() => toast(`تنبيه: ${neg} مادة رصيدها سالب. أدخل «الرصيد الأولي» لهذه المواد من «المواد والإعدادات».`, true), 600);
  }

  /* ---------- Excel export ---------- */
  async function exportStatus() {
    const rows = [['ر.ت', 'المادة', 'الوحدة', 'الرصيد السابق', 'الوارد', 'المنصرف', 'الرصيد الحالي']]
      .concat(statusRows(flt.from, flt.to).map((r, i) => [String(i + 1), r.it.name, r.it.unit || '', q(r.before), q(r.inn), q(r.out), q(r.after)]));
    const r = await window.api.saveXlsx(rows, `وضعية_المخزون_${flt.to || today()}.xlsx`, 'وضعية المخزون', [6, 40, 12, 14, 12, 12, 14]);
    if (r.ok) toast('تم التصدير إلى Excel');
  }
  async function exportIns() {
    const list = SD().ins.filter(r => inPeriod(r.date)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const rows = [['ر.ت', 'المادة', 'المصدر', 'الكمية', 'تاريخ الوصول', 'المرجع', 'ملاحظة']].concat(list.map((r, i) => [String(i + 1), itemName(r.itemId), r.source || '', q(r.qty), fmtDate(r.date), r.ref || '', r.note || '']));
    const r = await window.api.saveXlsx(rows, 'سجل_الواردات.xlsx', 'سجل الواردات', [6, 40, 30, 10, 14, 20, 24]);
    if (r.ok) toast('تم التصدير إلى Excel');
  }
  async function exportOuts() {
    const list = SD().outs.filter(r => inPeriod(r.date)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const rows = [['ر.ت', 'المستفيد(ة)', 'رقم التأجير', 'المادة', 'الكمية', 'تاريخ التسليم', 'ملاحظة']].concat(list.map((r, i) => { const b = benefLive(r.benef); return [String(i + 1), b.name, b.ppr || '', itemName(r.itemId), q(r.qty), fmtDate(r.date), r.note || '']; }));
    const r = await window.api.saveXlsx(rows, 'سجل_الصادرات.xlsx', 'سجل الصادرات', [6, 30, 14, 40, 10, 14, 24]);
    if (r.ok) toast('تم التصدير إلى Excel');
  }

  /* ================================================================= */
  /* documents */
  const KINDS = [['pv', 'محضر تسلم المواد (لمستفيد)'], ['status', 'وضعية المخزون'], ['outs', 'تقرير حول اللوازم والمواد المسلمة'],
    ['item', 'تقرير المستفيدين من مادة'], ['ins', 'سجل الواردات']];
  const period = (f, t) => f && t ? `خلال الفترة من ${fmtDate(f)} إلى ${fmtDate(t)}` : f ? `ابتداء من ${fmtDate(f)}` : t ? `إلى غاية ${fmtDate(t)}` : '';
  const topItem = () => { const c = {}; SD().outs.forEach(r => { c[r.itemId] = (c[r.itemId] || 0) + 1; }); const best = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; return best || sortedItems()[0].id; };
  const syOf = st => MK.schoolYear(st.to || st.date || today());

  function pvPages(s, st) {
    const b = st.benefKey ? (st.benefKey.startsWith('n:') ? { name: st.benefKey.slice(2) } : benefFromKey(st.benefKey)) : null;
    const bl = b ? benefLive(b) : { name: '', ppr: '', role: '' };
    const list = !b ? [] : SD().outs.filter(r => benefKeyOf(r.benef) === st.benefKey && (st.batch ? r.batch === st.batch : ((!st.from || r.date >= st.from) && (!st.to || r.date <= st.to))))
      .sort((x, y) => (x.date || '').localeCompare(y.date || ''));
    const per = 10;
    const chunks = []; for (let i = 0; i < Math.max(1, list.length); i += per) chunks.push(list.slice(i, i + per));
    return chunks.map((ch, ci) => {
      const rows = ch.map((r, i) => `<tr><td>${ci * per + i + 1}</td><td class="r">${esc(itemName(r.itemId))}</td><td>${q(r.qty)} ${esc(itemUnit(r.itemId))}</td><td>${fmtDate(r.date)}</td></tr>`);
      while (rows.length < Math.min(per, Math.max(8, ch.length))) rows.push('<tr><td></td><td></td><td></td><td></td></tr>');
      return `
      ${Dx.header(s)}
      <div class="title-box" style="font-size:13.5pt">${esc(SD().pvTitle)}</div>
      <div class="c b" style="margin-top:-1.5mm;margin-bottom:1.5mm">الموسم الدراسي: ${esc(MK.schoolYear(st.date || today()))}</div>
      <div class="mk-lines">
        <p class="b">أنا الموقع(ة) أسفله:</p>
        <p>السيد(ة): ${Dx.V(bl.name, 'b')} &nbsp; رقم التأجير: ${Dx.V(bl.ppr)}</p>
        ${bl.role ? `<p>الصفة: ${Dx.V(bl.role)}</p>` : ''}
        <p>أشهد أني تسلمت من مدير(ة) المؤسسة: ${Dx.V(s.school, 'b')} المواد التالية:</p>
      </div>
      <table class="tbl mk-pv-t"><thead><tr><th style="width:9%">ر.ت</th><th>المادة</th><th style="width:19%">الكمية</th><th style="width:22%">تاريخ التسليم</th></tr></thead><tbody>${rows.join('')}</tbody></table>
      ${chunks.length > 1 ? `<div class="c small">(${ci + 1} / ${chunks.length})</div>` : ''}
      <p class="l mt">حرر ب: ${Dx.V(st.city || s.city)} &nbsp; في: ${Dx.D(st.date)}</p>
      <div class="sigs"><div>توقيع المستفيد(ة)</div><div>توقيع وخاتم مدير(ة) المؤسسة</div></div>
      <div class="spacer"></div>`;
    });
  }

  function reportPages(s, st) {
    const sign = MK.signBlock(s, { city: st.city, date: st.date });
    const info = html => `<div class="mk-info">${html}</div>`;
    if (st.kind === 'status') {
      const rows = statusRows(st.from, st.to).map((r, i) => [i + 1, `<b>${esc(r.it.name)}</b>`, esc(r.it.unit || ''), q(r.before), q(r.inn), q(r.out), `<b>${q(r.after)}</b>`]);
      return MK.tablePages({ s, title: `وضعية المخزون بتاريخ: ${fmtDate(st.to || today())}`, info: info(`الموسم الدراسي: <b>${syOf(st)}</b> — ${period(st.from, st.to)}`),
        cols: [{ h: 'ر.ت', w: '7%' }, { h: 'المادة', cls: 'r' }, { h: 'الوحدة', w: '10%' }, { h: 'الرصيد السابق', w: '11%' }, { h: 'الوارد', w: '10%' }, { h: 'المنصرف', w: '10%' }, { h: 'الرصيد الحالي', w: '11%' }],
        rows, sign, minRows: 10 });
    }
    if (st.kind === 'ins') {
      const list = SD().ins.filter(r => (!st.from || r.date >= st.from) && (!st.to || r.date <= st.to) && (!st.itemId || r.itemId === st.itemId) && (!st.src || r.source === st.src))
        .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const rows = list.map((r, i) => [i + 1, fmtDate(r.date), esc(itemName(r.itemId)), esc(r.source || ''), `${q(r.qty)} ${esc(itemUnit(r.itemId))}`, esc(r.ref || '')]);
      return MK.tablePages({ s, title: 'سجل الواردات', info: info(`الموسم الدراسي: <b>${syOf(st)}</b> — ${period(st.from, st.to)}${st.itemId ? ` — المادة: <b>${esc(itemName(st.itemId))}</b>` : ''}${st.src ? ` — المصدر: <b>${esc(st.src)}</b>` : ''}`),
        cols: [{ h: 'ر.ت', w: '7%' }, { h: 'تاريخ الوصول', w: '13%' }, { h: 'المادة', cls: 'r' }, { h: 'المصدر', w: '22%', cls: 'sm' }, { h: 'الكمية', w: '11%' }, { h: 'المرجع', w: '14%', cls: 'sm' }],
        rows, sign, minRows: 10 });
    }
    if (st.kind === 'outs') {
      const list = SD().outs.filter(r => (!st.from || r.date >= st.from) && (!st.to || r.date <= st.to) && (!st.itemId || r.itemId === st.itemId))
        .sort((a, b) => (a.date || '').localeCompare(b.date || '') || benefLive(a.benef).name.localeCompare(benefLive(b.benef).name, 'ar'));
      const rows = list.map((r, i) => { const b = benefLive(r.benef); return [i + 1, fmtDate(r.date), esc(b.name), esc(b.ppr || ''), esc(itemName(r.itemId)), `${q(r.qty)} ${esc(itemUnit(r.itemId))}`]; });
      return MK.tablePages({ s, title: 'تقرير حول اللوازم والمواد المسلمة', info: info(`الموسم الدراسي: <b>${syOf(st)}</b> — ${period(st.from, st.to)}${st.itemId ? ` — المادة: <b>${esc(itemName(st.itemId))}</b>` : ''}`),
        cols: [{ h: 'ر.ت', w: '7%' }, { h: 'تاريخ التسليم', w: '13%' }, { h: 'المستفيد(ة)', cls: 'r', w: '27%' }, { h: 'رقم التأجير', w: '12%' }, { h: 'المادة', cls: 'r' }, { h: 'الكمية', w: '10%' }],
        rows, sign, minRows: 10 });
    }
    if (st.kind === 'item') {
      const list = SD().outs.filter(r => r.itemId === st.itemId && (!st.from || r.date >= st.from) && (!st.to || r.date <= st.to)).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
      const rows = list.map((r, i) => { const b = benefLive(r.benef); return [i + 1, esc(b.name), esc(b.ppr || ''), `${q(r.qty)} ${esc(itemUnit(r.itemId))}`, fmtDate(r.date), '']; });
      const tot = list.reduce((x, r) => x + num(r.qty), 0);
      return MK.tablePages({ s, title: 'تقرير المستفيدين من المادة', info: info(`المادة: <b>${esc(itemName(st.itemId))}</b> — الموسم الدراسي: <b>${syOf(st)}</b> — ${period(st.from, st.to)}`),
        cols: [{ h: 'ر.ت', w: '7%' }, { h: 'المستفيد(ة)', cls: 'r' }, { h: 'رقم التأجير', w: '14%' }, { h: 'الكمية', w: '12%' }, { h: 'تاريخ التسليم', w: '15%' }, { h: 'التوقيع', w: '18%' }],
        rows, foot: `<table class="tbl mk-tbl"><tr class="tot"><td class="r">مجموع الكمية المسلمة</td><td style="width:30%">${q(tot)} ${esc(itemUnit(st.itemId))}</td></tr></table>`, sign, minRows: 10 });
    }
    return [''];
  }

  window.pageStockDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    const b = MK.syBounds(today());
    const st0 = { kind: arg.kind || 'status', from: arg.from != null ? arg.from : (flt.all ? '' : flt.from || b.from), to: arg.to != null ? arg.to : (flt.all ? '' : flt.to || today()),
      itemId: arg.itemId || '', src: arg.src || '', benefKey: arg.benefKey || '', batch: arg.batch || '', date: arg.kind === 'pv' && arg.to ? arg.to : today(), city: S().city || '' };
    if (st0.kind === 'item' && !st0.itemId && SD().items.length) st0.itemId = topItem();
    MK.docPage(v, {
      word: true,
      title: 'المحاضر والتقارير — الوسائل التعليمية', icon: '📦', modes: st0.kind === 'pv', state: st0,
      back: () => go('stock'),
      form: (box, st, refresh) => {
        const draw = () => {
          const benefs = [];
          const seen = new Set();
          SD().outs.slice().sort((x, y) => (y.date || '').localeCompare(x.date || '')).forEach(r => { const k = benefKeyOf(r.benef); if (!seen.has(k)) { seen.add(k); benefs.push([k, benefLive(r.benef).name]); } });
          benefs.sort((x, y) => x[1].localeCompare(y[1], 'ar'));
          box.innerHTML = `<div class="sec-t">نوع الوثيقة</div>
            <div class="fld"><select class="inp" id="dK">${KINDS.map(([k, l]) => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            ${st.kind === 'pv' ? `<div class="fld"><label>المستفيد(ة)</label><select class="inp" id="dB"><option value=""></option>${benefs.map(([k, n]) => `<option value="${esc(k)}" ${k === st.benefKey ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
              ${st.batch ? `<label class="chk" style="margin-bottom:10px"><input type="checkbox" id="dBatch" checked> المواد المسلمة في هذه العملية فقط</label>` : ''}` : ''}
            ${st.kind === 'item' || st.kind === 'ins' || st.kind === 'outs' ? `<div class="fld"><label>المادة</label><select class="inp" id="dI">${st.kind === 'item' ? '' : '<option value="">كل المواد</option>'}${sortedItems().map(i => `<option value="${i.id}" ${i.id === st.itemId ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>` : ''}
            ${st.kind === 'ins' ? `<div class="fld"><label>المصدر</label><select class="inp" id="dS"><option value="">كل المصادر</option>${SD().sources.map(x => `<option ${x === st.src ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>` : ''}
            <div class="sec-t">الفترة</div>
            <div class="fgrid"><div class="fld"><label>من</label><input class="inp" type="date" id="dF" value="${esc(st.from)}" ${st.kind === 'pv' && st.batch ? 'disabled' : ''}></div>
              <div class="fld"><label>إلى</label><input class="inp" type="date" id="dT" value="${esc(st.to)}" ${st.kind === 'pv' && st.batch ? 'disabled' : ''}></div></div>
            <div class="sec-t">التحرير</div>
            <div class="fgrid"><div class="fld"><label>حرر ب</label><input class="inp" id="dC" value="${esc(st.city)}"></div>
              <div class="fld"><label>في (التاريخ)</label><input class="inp" type="date" id="dD" value="${esc(st.date)}"></div></div>`;
          $('#dK', box).onchange = e => {
            st.kind = e.target.value;
            if (st.kind === 'item' && !st.itemId && SD().items.length) st.itemId = topItem();
            if (st.kind !== 'pv') st.batch = '';
            go('stockDoc', Object.assign({}, st));
          };
          const bind = (id, k, ev) => { const el = $(id, box); if (el) el[ev || 'onchange'] = e => { st[k] = e.target.value; refresh(); }; };
          bind('#dB', 'benefKey'); bind('#dI', 'itemId'); bind('#dS', 'src'); bind('#dF', 'from'); bind('#dT', 'to'); bind('#dC', 'city', 'oninput'); bind('#dD', 'date');
          if ($('#dBatch', box)) $('#dBatch', box).onchange = e => { if (!e.target.checked) { st.batch = ''; draw(); refresh(); } };
        };
        draw();
      },
      build: st => {
        const s = S();
        if (st.kind === 'pv') return { page: 'two', pages: pvPages(s, st), cls: 'mk-pv' };
        return { page: 'a4', pages: reportPages(s, st) };
      },
      validate: st => {
        if (st.kind === 'pv' && !st.benefKey) { toast('المرجو اختيار المستفيد(ة)', true); return false; }
        if (st.kind === 'item' && !st.itemId) { toast('المرجو اختيار المادة', true); return false; }
        return true;
      },
      fname: st => (KINDS.find(k => k[0] === st.kind) || ['', 'وثيقة'])[1] + (st.kind === 'pv' && st.benefKey ? '_' + ((benefFromKey(st.benefKey) || { name: st.benefKey.slice(2) }).name) : '')
    });
  };
})();
