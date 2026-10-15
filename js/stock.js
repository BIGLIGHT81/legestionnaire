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
  // 1.9.4: more usual sources of the arrivals, grouped (any other source can be typed)
  const SOURCE_GROUPS = [
    ['الوزارة والأكاديمية والمديرية', ['المديرية الإقليمية', 'الأكاديمية الجهوية', 'الوزارة (المصالح المركزية)', 'برنامج مؤسسات الريادة', 'برنامج تيسير / مليون محفظة', 'مصلحة الشؤون الإدارية والمالية', 'مركز الموارد / المخزن الإقليمي']],
    ['الجمعيات المدرسية والشركاء', ['جمعية دعم مدرسة النجاح', 'الجمعية الرياضية المدرسية', 'التعاونية المدرسية', 'جمعية آباء وأمهات وأولياء التلاميذ', 'جمعية مدنية شريكة', 'المؤسسة المغربية للنهوض بالتعليم الأولي']],
    ['الجماعات والسلطات والمبادرات', ['الجماعة الترابية', 'المجلس الإقليمي', 'المجلس الجهوي', 'السلطة المحلية', 'المبادرة الوطنية للتنمية البشرية']],
    ['هبات ومصادر أخرى', ['المحسنون', 'مقاولة / شركة مواطنة', 'هبة من موظف(ة) أو ولي(ة) أمر', 'مؤسسة تعليمية أخرى', 'اقتناء بميزانية المؤسسة']],
    ['التسليم والمناولة', ['محضر تسلم المهام', 'شركة النظافة', 'شركة الحراسة', 'شركة الإطعام المدرسي']]];
  const ALL_SOURCES = SOURCE_GROUPS.reduce((a, g) => a.concat(g[1]), []);
  const SUGGESTED = ['Marqueur pour tableau magnétique', "Recharge d'encre pour marqueur", 'Brosse pour tableau magnétique', 'Rame de papier A4 blanc',
    'Rame de papier A3 blanc', 'Cartouche toner', 'Craie (boîte de 10)', 'Craie (boîte de 100)', 'Brosse pour tableau noir', 'Chemise bulle (paquet de 250)',
    'Chemise cartonnée (paquet de 100)', 'Règle de tableau', 'Équerre de tableau', "Rapporteur d'angle pour tableau", 'Compas de tableau', 'Drapeau',
    'Lampe économique', 'Robinet de service', 'Corbeille en plastique', 'Serrure et cadenas', 'Balai en fibre de nylon avec manche', 'Raclette en caoutchouc avec manche'];
  const OTHER_USE = 'صادر غير مسجل (استعمال المؤسسة)';

  function migrate(db) {
    const s = db.stock = db.stock || {};
    s.items = Array.isArray(s.items) ? s.items : [];
    s.sources = Array.isArray(s.sources) ? s.sources : DEFAULT_SOURCES.slice();
    if (!s.srcV) { ALL_SOURCES.forEach(x => { if (!s.sources.includes(x)) s.sources.push(x); }); s.srcV = 2; }   // 1.9.4: the new usual sources, once
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

  /* ---------- 1.9.4: indicators of the material management (التدبير المادي) ---------- */
  const CATS = ['لوازم السبورة والقسم', 'لوازم مكتبية وورق', 'مواد الطباعة والمعلوميات', 'مواد التنظيف والنظافة', 'مواد الصيانة والإصلاح', 'تجهيزات ومعدات صغيرة', 'أعلام ورموز ومناسبات', 'أخرى'];
  const catGuess = n => { const t = String(n || '').toLowerCase();
    return /marqueur|craie|brosse|tableau|règle|regle|équerre|equerre|compas|rapporteur|طباشير|سبورة|قلم/.test(t) ? CATS[0] : /papier|rame|chemise|stylo|cahier|classeur|agrafe|ورق|ملف/.test(t) ? CATS[1]
      : /toner|encre|cartouche|imprim|usb|clé|cle|حبر|طابعة/.test(t) ? CATS[2] : /balai|raclette|savon|javel|détergent|detergent|serpill|corbeille|poubelle|منظف|مكنسة|صابون/.test(t) ? CATS[3]
      : /robinet|serrure|cadenas|lampe|ampoule|vis|clou|peinture|صنبور|قفل|مصباح|صباغة/.test(t) ? CATS[4] : /drapeau|علم/.test(t) ? CATS[6] : CATS[7]; };
  const catOf = it => (it && it.cat) || catGuess(it && it.name);
  const priceOf = it => num(it && it.price) || 0;
  const dDays = (a, b) => Math.max(1, Math.round((new Date(b + 'T00:00:00Z') - new Date(a + 'T00:00:00Z')) / 864e5) + 1);
  const ymOf = d => String(d || '').slice(0, 7);
  const MONTHS_AR = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  const ymName = ym => { const [y, m] = ym.split('-').map(Number); return `${MONTHS_AR[m - 1]} ${String(y).slice(2)}`; };
  // everything is computed from the registers (opening balance, arrivals, deliveries) for the period [from, to]
  function analytics(from, to) {
    const all = SD().ins.concat(SD().outs).map(r => r.date).filter(Boolean).sort();
    const f = from || all[0] || today(), t = to || today(), months = Math.max(1, dDays(f, t) / 30.44);
    const inP = r => (!from || r.date >= from) && (!to || r.date <= to);
    const INS = SD().ins.filter(inP), OUTS = SD().outs.filter(inP);
    const rows = sortedItems().filter(it => used(it) || SD().outs.some(r => r.itemId === it.id)).map(it => {
      const x = sums(it.id, from, to), ins = INS.filter(r => r.itemId === it.id), outs = OUTS.filter(r => r.itemId === it.id);
      const avgM = x.out / months, cover = avgM > 0 ? x.after / avgM : (x.after > 0 ? Infinity : 0), stockAvg = (x.before + x.after) / 2;
      const lastIn = (SD().ins.filter(r => r.itemId === it.id).map(r => r.date).sort().pop()) || '', lastOut = (SD().outs.filter(r => r.itemId === it.id).map(r => r.date).sort().pop()) || '';
      const benefs = new Set(outs.map(r => benefKeyOf(r.benef))).size, avail = x.before + x.inn;
      const ck = check(it.id, SD().ins, SD().outs);
      const status = x.after <= 0 ? 'out' : (num(it.min) > 0 && x.after <= num(it.min)) || cover < 1 ? 'crit' : cover < 2 ? 'low' : !x.out ? 'idle' : 'ok';
      return { it, ...x, nIn: ins.length, nOut: outs.length, avgM, cover, turn: stockAvg > 0 ? x.out / stockAvg : 0, use: avail > 0 ? x.out / avail : 0, lastIn, lastOut, benefs, status, ck, price: priceOf(it), cat: catOf(it) };
    });
    // months of the period (at most the last 12)
    const yms = []; { let d = new Date(f.slice(0, 7) + '-01T00:00:00Z'); const e = new Date(t.slice(0, 7) + '-01T00:00:00Z'); for (let i = 0; d <= e && i < 60; i++, d.setUTCMonth(d.getUTCMonth() + 1)) yms.push(d.toISOString().slice(0, 7)); }
    const M = yms.slice(-12).map(ym => ({ ym, inn: INS.filter(r => ymOf(r.date) === ym).reduce((a, r) => a + num(r.qty), 0), out: OUTS.filter(r => ymOf(r.date) === ym).reduce((a, r) => a + num(r.qty), 0) }));
    const by = (list, keyF, valF) => { const m = new Map(); list.forEach(r => { const k = keyF(r); if (!k) return; const o = m.get(k) || { k, q: 0, n: 0, items: new Set(), v: 0 }; o.q += num(r.qty); o.n++; o.items.add(r.itemId); o.v += num(r.qty) * priceOf(itemById(r.itemId)); m.set(k, o); }); return Array.from(m.values()).sort((a, b) => b.q - a.q); };
    const src = by(INS, r => r.source || 'غير محدد');
    const ben = by(OUTS, r => benefLive(r.benef).name || '—');
    const cats = CATS.map(c => { const R = rows.filter(r => r.cat === c); return { c, n: R.length, inn: R.reduce((a, r) => a + r.inn, 0), out: R.reduce((a, r) => a + r.out, 0), val: R.reduce((a, r) => a + r.after * r.price, 0) }; }).filter(x => x.n);
    // unusual consumption: a beneficiary who took more than twice the average quantity of an item
    const unusual = [];
    rows.forEach(r => { const per = new Map(); OUTS.filter(o => o.itemId === r.it.id).forEach(o => { const k = benefLive(o.benef).name; per.set(k, (per.get(k) || 0) + num(o.qty)); });
      if (per.size < 3) return; const avg = Array.from(per.values()).reduce((a, b) => a + b, 0) / per.size; per.forEach((v, k) => { if (v > 2 * avg && v - avg >= 2) unusual.push({ it: r.it, who: k, q: v, avg }); }); });
    const T = { items: rows.length, inn: rows.reduce((a, r) => a + r.inn, 0), out: rows.reduce((a, r) => a + r.out, 0), nIn: INS.length, nOut: OUTS.length,
      out0: rows.filter(r => r.status === 'out').length, crit: rows.filter(r => r.status === 'crit').length, low: rows.filter(r => r.status === 'low').length, idle: rows.filter(r => r.status === 'idle').length,
      benefs: ben.length, sources: src.length, val: rows.reduce((a, r) => a + Math.max(0, r.after) * r.price, 0), valOut: OUTS.reduce((a, r) => a + num(r.qty) * priceOf(itemById(r.itemId)), 0),
      priced: rows.some(r => r.price > 0), neg: rows.filter(r => !r.ck.ok).length, months, from: f, to: t };
    T.use = T.inn + rows.reduce((a, r) => a + r.before, 0) > 0 ? T.out / (T.inn + rows.reduce((a, r) => a + r.before, 0)) : 0;
    T.health = rows.length ? Math.round(rows.filter(r => r.status === 'ok' || r.status === 'idle').length * 100 / rows.length) : 0;
    return { rows, M, src, ben, cats, unusual, T };
  }
  const STATUS = { out: ['نفد', '#c62828', '#fdecea'], crit: ['حرج', '#d35400', '#fdf0e6'], low: ['منخفض', '#b9770e', '#fdf7e3'], ok: ['كاف', '#1e8449', '#e8f6ee'], idle: ['راكد', '#607d8b', '#eef1f3'] };
  const avgTxt = v => (!v ? '—' : v < 1 ? v.toFixed(2).replace('.', ',') : q(+v.toFixed(1)));
  const covTxt = c => (c === Infinity ? '∞' : c <= 0 ? '0' : c >= 24 ? '+24' : c.toFixed(1));
  const dh = v => (Math.round(v * 100) / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' د';
  // small SVG charts (no external library)
  function hbarsSvg(list, o) {
    o = o || {}; const W = o.w || 520, rowH = 22, lab = o.lab || 170, max = Math.max(1, ...list.map(x => x.v));
    return `<svg viewBox="0 0 ${W} ${list.length * rowH + 6}" width="100%" style="max-width:${W}px;direction:ltr" xmlns="http://www.w3.org/2000/svg" font-family="Tajawal,Arial" font-size="11">${list.map((x, i) => { const w = Math.max(1, (W - lab - 60) * x.v / max), y = i * rowH + 3;
      return `<text x="${W - 4}" y="${y + 14}" text-anchor="end" fill="#333">${esc(String(x.l).slice(0, 34))}</text><rect x="${W - lab - 8 - w}" y="${y + 3}" width="${w}" height="${rowH - 8}" rx="3" fill="${x.c || o.c || '#2e75b6'}"/><text x="${W - lab - 12 - w}" y="${y + 14}" text-anchor="end" fill="#333" font-weight="700">${esc(o.fmt ? o.fmt(x.v) : q(x.v))}</text>`; }).join('')}</svg>`;
  }
  function monthsSvg(M) {
    const W = 560, H = 190, pad = 26, n = Math.max(1, M.length), max = Math.max(1, ...M.map(x => Math.max(x.inn, x.out))), bw = (W - 2 * pad) / n;
    const y = v => H - pad - (H - 2 * pad - 8) * v / max;
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;direction:ltr" xmlns="http://www.w3.org/2000/svg" font-family="Tajawal,Arial" font-size="10">
      <line x1="${pad}" y1="${H - pad}" x2="${W - pad}" y2="${H - pad}" stroke="#bbb"/>${M.map((x, i) => { const x0 = pad + i * bw + bw * .12, w = bw * .36;
        return `<rect x="${x0}" y="${y(x.inn)}" width="${w}" height="${H - pad - y(x.inn)}" fill="#2e75b6" rx="2"/><rect x="${x0 + w + 2}" y="${y(x.out)}" width="${w}" height="${H - pad - y(x.out)}" fill="#e67e22" rx="2"/>
        ${x.inn ? `<text x="${x0 + w / 2}" y="${y(x.inn) - 2}" text-anchor="middle" fill="#2e75b6">${q(x.inn)}</text>` : ''}${x.out ? `<text x="${x0 + w * 1.5 + 2}" y="${y(x.out) - 2}" text-anchor="middle" fill="#c0581a">${q(x.out)}</text>` : ''}
        <text x="${pad + i * bw + bw / 2}" y="${H - 9}" text-anchor="middle" fill="#444">${ymName(x.ym)}</text>`; }).join('')}
      <rect x="${W - 160}" y="4" width="10" height="10" fill="#2e75b6"/><text x="${W - 146}" y="13" text-anchor="start">الوارد</text><rect x="${W - 90}" y="4" width="10" height="10" fill="#e67e22"/><text x="${W - 76}" y="13" text-anchor="start">المنصرف</text></svg>`;
  }
  function donutSvg(list) {
    const PAL = ['#2e75b6', '#e67e22', '#27ae60', '#8e44ad', '#c0392b', '#16a085', '#d4ac0d', '#7f8c8d'], tot = list.reduce((a, x) => a + x.v, 0) || 1;
    let a0 = -Math.PI / 2; const R = 70, r = 42, cx = 90, cy = 90;
    const arcs = list.map((x, i) => { const a1 = a0 + 2 * Math.PI * x.v / tot, big = a1 - a0 > Math.PI ? 1 : 0, p = (ang, rr) => `${cx + rr * Math.cos(ang)} ${cy + rr * Math.sin(ang)}`;
      const d = x.v / tot >= .9999 ? `M ${cx - R} ${cy} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0 M ${cx - r} ${cy} a ${r} ${r} 0 1 1 ${2 * r} 0 a ${r} ${r} 0 1 1 ${-2 * r} 0`
        : `M ${p(a0, R)} A ${R} ${R} 0 ${big} 1 ${p(a1, R)} L ${p(a1, r)} A ${r} ${r} 0 ${big} 0 ${p(a0, r)} Z`; a0 = a1; return `<path d="${d}" fill="${PAL[i % PAL.length]}" fill-rule="evenodd"/>`; });
    return `<div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap"><svg viewBox="0 0 180 180" width="160" height="160" xmlns="http://www.w3.org/2000/svg">${arcs.join('')}<text x="90" y="95" text-anchor="middle" font-size="14" font-weight="700" font-family="Tajawal,Arial">${q(tot)}</text></svg>
      <div style="font-size:12px;line-height:1.9">${list.map((x, i) => `<div><span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${PAL[i % PAL.length]};margin-left:6px"></span>${esc(x.l)}: <b>${q(x.v)}</b> (${Math.round(x.v * 100 / tot)}%)</div>`).join('')}</div></div>`;
  }
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
  let tab = 'dash';
  const flt = { from: '', to: '', item: '', src: '', q: '' };
  const resetPeriod = () => { const b = MK.syBoundsOf(MK.curSy()); flt.from = b.from; flt.to = MK.syRef(); };

  window.pageStock = function (v, arg) {
    migrate(DB);
    if (arg && arg.tab) tab = arg.tab;
    if (!flt.from && !flt.to && !flt.all) resetPeriod();
    if (window.Equip) Equip.migrate(DB);
    const TABS = [['dash', 'لوحة المؤشرات والتحليل'], ['equip', 'العتاد والأجهزة'], ['status', 'وضعية المخزون'], ['ins', 'سجل الواردات'], ['outs', 'سجل الصادرات'], ['settings', 'المواد والإعدادات']];
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
    $('#sRep').onclick = () => go('stockDoc', { kind: tab === 'ins' ? 'ins' : tab === 'outs' ? 'outs' : tab === 'dash' ? 'analytic' : 'status' });
    ({ dash: tabDash, status: tabStatus, ins: tabIns, outs: tabOuts, settings: tabSettings })[tab](body);
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

  /* ---------- 1.9.4: dashboard of indicators ---------- */
  const dst = { st: '' };
  const tile = (v, l, c, sub2) => `<div class="card" style="padding:12px 14px;border-top:4px solid ${c || 'var(--sec, #0f6e5a)'}"><div style="font-size:24px;font-weight:800;color:${c || 'inherit'}">${v}</div><div style="font-size:12.5px;font-weight:700">${l}</div>${sub2 ? `<div class="muted" style="font-size:11.5px">${sub2}</div>` : ''}</div>`;
  const badge = k => `<span style="display:inline-block;padding:1px 9px;border-radius:10px;font-size:11.5px;font-weight:700;color:${STATUS[k][1]};background:${STATUS[k][2]}">${STATUS[k][0]}</span>`;
  function tabDash(b) {
    b.innerHTML = `<div class="card" style="margin-bottom:12px">${periodBar(`<span class="sp" style="flex:1"></span><button class="btn sm" id="xAn">${ic('down')} تصدير المؤشرات Excel</button><button class="btn sm pri" id="pAn">${ic('print')} التقرير التحليلي</button>`)}</div><div id="anB"></div>`;
    const draw = () => {
      const A = analytics(flt.from, flt.to), T = A.T;
      if (!A.rows.length) { $('#anB', b).innerHTML = '<div class="empty-state">لا توجد معطيات بعد: أضف المواد وسجل الواردات والصادرات (أو استورد ملف برنامج تدبير المخزون من «المواد والإعدادات»).</div>'; return; }
      const al = [];
      A.rows.filter(r => r.status === 'out').forEach(r => al.push(['#c62828', `نفدت المادة <b>${esc(r.it.name)}</b>${r.avgM ? ` (معدل الاستهلاك ${q(r.avgM.toFixed(1))} ${esc(r.it.unit || '')} في الشهر)` : ''}: يلزم التزود.`]));
      A.rows.filter(r => r.status === 'crit').forEach(r => al.push(['#d35400', `<b>${esc(r.it.name)}</b>: الرصيد ${q(r.after)} ${esc(r.it.unit || '')} يكفي ${covTxt(r.cover)} شهر${num(r.it.min) > 0 && r.after <= num(r.it.min) ? ` — تحت الحد الأدنى (${q(r.it.min)})` : ''}.`]));
      A.rows.filter(r => !r.ck.ok).forEach(r => al.push(['#8e44ad', `<b>${esc(r.it.name)}</b>: صادر قبل وصول الكمية (الرصيد ${q(r.ck.bal)} بتاريخ ${fmtDate(r.ck.date)}) — راجع التواريخ أو أدخل الرصيد الأولي.`]));
      A.unusual.slice(0, 8).forEach(u => al.push(['#b9770e', `استهلاك مرتفع: <b>${esc(u.who)}</b> تسلم ${q(u.q)} من «${esc(u.it.name)}» (المعدل ${q(u.avg.toFixed(1))}).`]));
      A.rows.filter(r => r.status === 'idle' && r.after > 0).slice(0, 6).forEach(r => al.push(['#607d8b', `مادة راكدة: <b>${esc(r.it.name)}</b> (${q(r.after)} ${esc(r.it.unit || '')}) لم تُسلم خلال الفترة.`]));
      const L = A.rows.filter(r => !dst.st || r.status === dst.st).sort((x, y) => ['out', 'crit', 'low', 'ok', 'idle'].indexOf(x.status) - ['out', 'crit', 'low', 'ok', 'idle'].indexOf(y.status) || x.cover - y.cover);
      $('#anB', b).innerHTML = `
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;margin-bottom:12px">
          ${tile(T.items, 'مواد متداولة', '#0f6e5a', `${A.cats.length} صنف`)}
          ${tile(q(T.inn), 'الكمية الواردة', '#2e75b6', `${T.nIn} عملية — ${T.sources} مصدر`)}
          ${tile(q(T.out), 'الكمية المنصرفة', '#e67e22', `${T.nOut} عملية — ${T.benefs} مستفيد(ة)`)}
          ${tile(Math.round(T.use * 100) + '%', 'نسبة الاستهلاك', '#8e44ad', 'المنصرف ÷ (الرصيد السابق + الوارد)')}
          ${tile(T.health + '%', 'مؤشر سلامة المخزون', T.health >= 70 ? '#1e8449' : T.health >= 40 ? '#b9770e' : '#c62828', 'مواد بوضعية كافية')}
          ${tile(T.out0, 'مواد نفدت', T.out0 ? '#c62828' : '#1e8449')}
          ${tile(T.crit, 'مواد في وضعية حرجة', T.crit ? '#d35400' : '#1e8449', 'تكفي أقل من شهر أو تحت الحد الأدنى')}
          ${tile(T.low, 'مواد منخفضة', T.low ? '#b9770e' : '#1e8449', 'تكفي أقل من شهرين')}
          ${T.priced ? tile(dh(T.val), 'قيمة المخزون الحالي', '#16a085', `قيمة المنصرف: ${dh(T.valOut)}`) : ''}
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:12px;margin-bottom:12px">
          <div class="card"><div class="card-h"><h3>الوارد والمنصرف حسب الشهر</h3></div><div class="card-b">${monthsSvg(A.M)}</div></div>
          <div class="card"><div class="card-h"><h3>أكثر المواد استهلاكا</h3></div><div class="card-b">${hbarsSvg(A.rows.filter(r => r.out).sort((x, y) => y.out - x.out).slice(0, 8).map(r => ({ l: r.it.name, v: r.out })), { c: '#e67e22' }) || '<span class="muted">لا صادرات</span>'}</div></div>
          <div class="card"><div class="card-h"><h3>الواردات حسب المصدر</h3></div><div class="card-b">${A.src.length ? donutSvg(A.src.slice(0, 7).map(x => ({ l: x.k, v: x.q })).concat(A.src.length > 7 ? [{ l: 'مصادر أخرى', v: A.src.slice(7).reduce((a, x) => a + x.q, 0) }] : [])) : '<span class="muted">لا واردات</span>'}</div></div>
          <div class="card"><div class="card-h"><h3>المستفيدون الأكثر تسلما</h3></div><div class="card-b">${A.ben.length ? hbarsSvg(A.ben.slice(0, 8).map(x => ({ l: x.k, v: x.q })), { c: '#8e44ad' }) : '<span class="muted">لا صادرات</span>'}</div></div>
        </div>
        ${al.length ? `<div class="card" style="margin-bottom:12px;border-color:#f0c36d"><div class="card-h"><h3>⚠️ تنبيهات وتوصيات (${al.length})</h3></div><div class="card-b" style="line-height:1.9;font-size:13px">${al.map(([c, t]) => `<div style="border-right:4px solid ${c};padding:2px 10px;margin-bottom:4px">${t}</div>`).join('')}</div></div>` : ''}
        <div class="card"><div class="card-h"><h3>مؤشرات كل مادة</h3><span class="sp"></span><div class="seg" id="anSt">${[['', 'الكل']].concat(Object.keys(STATUS).map(k => [k, STATUS[k][0]])).map(([k, l]) => `<button data-s="${k}" class="${dst.st === k ? 'on' : ''}">${l} (${k ? A.rows.filter(r => r.status === k).length : A.rows.length})</button>`).join('')}</div></div>
          <div style="overflow:auto"><table class="tbl compact"><thead><tr><th>المادة</th><th>الصنف</th><th>الرصيد السابق</th><th>الوارد</th><th>المنصرف</th><th>الرصيد الحالي</th><th>معدل الاستهلاك الشهري</th><th>التغطية (شهر)</th><th>معدل الدوران</th><th>المستفيدون</th><th>آخر وارد</th><th>آخر تسليم</th>${T.priced ? '<th>القيمة</th>' : ''}<th>الوضعية</th></tr></thead><tbody>
          ${L.map(r => `<tr data-id="${r.it.id}"><td><b>${esc(r.it.name)}</b> <small class="muted">${esc(r.it.unit || '')}</small></td><td class="muted" style="font-size:11.5px">${esc(r.cat)}</td><td class="num">${q(r.before)}</td><td class="num" style="color:#2e75b6">${q(r.inn)}</td><td class="num" style="color:#c0581a">${q(r.out)}</td><td class="num"><b>${q(r.after)}</b></td>
            <td class="num">${avgTxt(r.avgM)}</td><td class="num"><b>${covTxt(r.cover)}</b></td><td class="num">${r.turn ? r.turn.toFixed(2) : '—'}</td><td class="num">${r.benefs || '—'}</td><td class="num" style="font-size:11.5px">${r.lastIn ? fmtDate(r.lastIn) : '—'}</td><td class="num" style="font-size:11.5px">${r.lastOut ? fmtDate(r.lastOut) : '—'}</td>${T.priced ? `<td class="num">${r.price ? dh(Math.max(0, r.after) * r.price) : '—'}</td>` : ''}<td>${badge(r.status)}</td></tr>`).join('')}
          </tbody></table></div>
          <div class="muted" style="font-size:11.5px;padding:8px 14px;line-height:1.8">معدل الاستهلاك الشهري = المنصرف خلال الفترة ÷ عدد أشهرها (${T.months.toFixed(1)} شهر). التغطية = الرصيد الحالي ÷ معدل الاستهلاك الشهري. معدل الدوران = المنصرف ÷ متوسط الرصيد. الوضعية: نفد (الرصيد صفر)، حرج (تكفي أقل من شهر أو تحت الحد الأدنى)، منخفض (أقل من شهرين)، كاف، راكد (لم تُسلم خلال الفترة).</div></div>`;
      $$('#anSt [data-s]', b).forEach(x => x.onclick = () => { dst.st = x.dataset.s; draw(); });
      $$('#anB tr[data-id]', b).forEach(x => x.ondblclick = () => go('stockDoc', { kind: 'card', itemId: x.dataset.id }));
    };
    bindPeriod(b, draw); draw();
    $('#pAn', b).onclick = () => go('stockDoc', { kind: 'analytic' });
    $('#xAn', b).onclick = async () => {
      const A = analytics(flt.from, flt.to);
      const rows = [['المادة', 'الوحدة', 'الصنف', 'الرصيد السابق', 'الوارد', 'المنصرف', 'الرصيد الحالي', 'معدل الاستهلاك الشهري', 'التغطية (شهر)', 'معدل الدوران', 'المستفيدون', 'آخر وارد', 'آخر تسليم', 'ثمن الوحدة', 'القيمة', 'الوضعية']]
        .concat(A.rows.map(r => [r.it.name, r.it.unit || '', r.cat, q(r.before), q(r.inn), q(r.out), q(r.after), r.avgM.toFixed(2), covTxt(r.cover), r.turn.toFixed(2), String(r.benefs), r.lastIn ? fmtDate(r.lastIn) : '', r.lastOut ? fmtDate(r.lastOut) : '', r.price ? String(r.price) : '', r.price ? (Math.max(0, r.after) * r.price).toFixed(2) : '', STATUS[r.status][0]]));
      const x = await window.api.saveXlsx(rows, `مؤشرات_المخزون_${flt.to || today()}.xlsx`, 'المؤشرات', [34, 10, 22, 12, 10, 10, 12, 14, 12, 12, 11, 13, 13, 11, 12, 10]);
      if (x && x.ok) toast('تم التصدير إلى Excel');
    };
  }

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
      <div class="fld"><label>المصدر <span style="color:var(--red)">*</span></label>${(() => {
        const cur = rec ? rec.source || '' : '', known = SD().sources, other = known.filter(x => !ALL_SOURCES.includes(x));
        const sec = !!(window.Cyc && Cyc.isSec()), grp = SOURCE_GROUPS.map(([g, L]) => [g, L.filter(x => known.includes(x) && !(sec && x !== cur && /التعاونية المدرسية|التعليم الأولي/.test(x)))]).filter(([, L]) => L.length).concat(other.length ? [['مصادر أضفتها', other]] : []);
        const isOther = !!cur && !known.includes(cur);
        return `<select class="inp" id="iSrcS"><option value="">— اختر المصدر —</option>${grp.map(([g, L]) => `<optgroup label="${esc(g)}">${L.map(x => `<option ${x === cur ? 'selected' : ''}>${esc(x)}</option>`).join('')}</optgroup>`).join('')}<option value="__other" ${isOther ? 'selected' : ''}>✎ مصدر آخر (يكتب)…</option></select>
          <input class="inp" id="iSrc" placeholder="اكتب المصدر الآخر" value="${esc(isOther ? cur : '')}" style="margin-top:6px;${isOther ? '' : 'display:none'}">`;
      })()}</div>
      <div class="fld"><label>المرجع (رقم الإرسالية / المحضر...)</label><input class="inp" id="iRef" value="${esc(rec ? rec.ref || '' : '')}"></div>
      <div class="fld"><label>ملاحظة</label><input class="inp" id="iNote" value="${esc(rec ? rec.note || '' : '')}"></div>
      <div class="full sec-t">المواد الواردة</div>
      <div class="full"><table class="mk-lines-t"><thead><tr><th>المادة</th><th style="width:120px">الكمية</th><th style="width:44px"></th></tr></thead><tbody id="iLines"></tbody></table>
        <datalist id="iItemsL">${sortedItems().map(i => `<option value="${esc(i.name)}">`).join('')}</datalist>
        ${rec ? '' : `<button class="btn sm" id="iAdd" style="margin-top:6px">${ic('plus')} إضافة سطر</button>`}
        <div class="hint muted" style="font-size:11.5px;margin-top:6px">اختر المادة من اللائحة (مواد المؤسسة أو المواد المقترحة)، أو «✚ مادة جديدة» لكتابة اسمها ووحدتها: تضاف تلقائيا إلى لائحة المواد.</div></div></div>`;
    const drawLines = () => {
      // 1.9.4: the material is chosen in a list (materials of the school, then suggested ones) or added («✚ مادة جديدة»)
      const mine = sortedItems().map(x => x.name), sugg = SUGGESTED.filter(x => !mine.some(m => key(m) === key(x)));
      const pick = l => { const known = mine.concat(sugg).some(x => key(x) === key(l.item)); return l.isNew || (l.item && !known) ? '__new' : l.item; };
      const selH = (l, i) => `<select class="inp" data-i="${i}" data-f="pick"><option value="">— اختر المادة —</option>${mine.length ? `<optgroup label="مواد المؤسسة">${mine.map(x => `<option ${pick(l) === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</optgroup>` : ''}${sugg.length ? `<optgroup label="مواد مقترحة">${sugg.map(x => `<option ${pick(l) === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</optgroup>` : ''}<option value="__new" ${pick(l) === '__new' ? 'selected' : ''}>✚ مادة جديدة (تكتب)…</option></select>
        ${pick(l) === '__new' ? `<div style="display:flex;gap:6px;margin-top:5px"><input class="inp" data-i="${i}" data-f="item" placeholder="اسم المادة الجديدة" value="${esc(l.item)}" style="flex:2"><input class="inp" data-i="${i}" data-f="unit" placeholder="الوحدة (علبة، رزمة…)" value="${esc(l.unit || '')}" style="flex:1"></div>` : ''}`;
      $('#iLines', body).innerHTML = lines.map((l, i) => `<tr><td>${selH(l, i)}</td>
        <td><input class="inp" type="number" min="0" step="any" data-i="${i}" data-f="qty" value="${esc(l.qty)}"></td>
        <td>${lines.length > 1 ? `<button class="btn sm danger icon" data-rm="${i}">${ic('trash')}</button>` : ''}</td></tr>`).join('');
      $$('#iLines [data-f]', body).forEach(el => { if (el.dataset.f === 'pick') return; el.oninput = () => { lines[+el.dataset.i][el.dataset.f] = el.value; }; });
      $$('#iLines [data-f=pick]', body).forEach(el => el.onchange = () => { const l = lines[+el.dataset.i]; if (el.value === '__new') { l.isNew = true; l.item = ''; } else { l.isNew = false; l.item = el.value; } drawLines(); if (l.isNew) { const x = $(`[data-f=item][data-i="${el.dataset.i}"]`, body); if (x) x.focus(); } });
      $$('[data-rm]', body).forEach(el => el.onclick = () => { lines.splice(+el.dataset.rm, 1); drawLines(); });
    };
    drawLines();
    if ($('#iAdd', body)) $('#iAdd', body).onclick = () => { lines.push({ item: '', qty: '' }); drawLines(); const ins = $$('[data-f=pick]', body); ins[ins.length - 1].focus(); };
    modal({ title: rec ? 'تعديل وارد' : 'تسجيل وارد', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      const sel = $('#iSrcS', body).value, date = $('#iDate', body).value, source = sel === '__other' ? $('#iSrc', body).value.trim() : sel, ref = $('#iRef', body).value.trim(), note = $('#iNote', body).value.trim();
      if (!date) { toast('المرجو إدخال تاريخ الوصول', true); return false; }
      if (!source) { toast('المرجو تحديد المصدر', true); return false; }
      const ok = lines.filter(l => String(l.item).trim() || String(l.qty).trim());
      if (!ok.length) { toast('أضف مادة واحدة على الأقل', true); return false; }
      for (const l of ok) {
        if (!String(l.item).trim()) { toast('المرجو كتابة اسم المادة في كل سطر', true); return false; }
        if (!(num(l.qty) > 0)) { toast('الكمية يجب أن تكون أكبر من صفر: ' + l.item, true); return false; }
      }
      const added = [];
      const unitOf = n => { const l = ok.find(x => key(x.item) === key(n)); return l && l.unit ? String(l.unit).trim() : ''; };
      const resolve = n => { let it = itemByName(n); if (!it) { it = { id: uid('it'), name: String(n).trim(), unit: unitOf(n), opening: 0, min: '' }; SD().items.push(it); added.push(it.name); } return it; };
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
    const sS = $('#iSrcS', body), sO = $('#iSrc', body);
    if (sS) sS.onchange = () => { const o = sS.value === '__other'; sO.style.display = o ? '' : 'none'; if (o) sO.focus(); };
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
      <div class="fld"><label>الحد الأدنى للتنبيه (اختياري)</label><input class="inp" type="number" min="0" step="any" id="tM" value="${esc(d.min || '')}"></div>
      <div class="fld"><label>الصنف</label><select class="inp" id="tC">${CATS.map(c => `<option ${c === (d.cat || catGuess(d.name)) ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="fld"><label>ثمن الوحدة بالدرهم (اختياري — لقيمة المخزون)</label><input class="inp" type="number" min="0" step="any" id="tP" value="${esc(d.price || '')}"></div></div>`;
    modal({ title: it ? 'تعديل مادة' : 'إضافة مادة', size: 'sm', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: m => {
      const name = $('#tN', m).value.trim();
      if (!name) { toast('المرجو كتابة اسم المادة', true); return false; }
      const dup = itemByName(name);
      if (dup && dup !== it) { toast('هذه المادة موجودة في القائمة', true); return false; }
      const opening = num($('#tO', m).value);
      if (it) { const c = check(it.id, SD().ins, SD().outs, opening); if (!c.ok) { toast('لا يمكن هذا الرصيد الأولي: ' + checkMsg(it.id, c).replace(/<[^>]+>/g, ''), true); return false; } }
      const o = { name, unit: $('#tU', m).value.trim(), opening, min: $('#tM', m).value.trim(), cat: $('#tC', m).value, price: $('#tP', m).value.trim() };
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
  const KINDS = [['analytic', 'التقرير التحليلي لتدبير المخزون (المؤشرات والتنبيهات)'], ['pv', 'محضر تسلم المواد (لمستفيد)'], ['status', 'وضعية المخزون'], ['outs', 'تقرير حول اللوازم والمواد المسلمة'],
    ['item', 'تقرير المستفيدين من مادة'], ['card', 'بطاقة المخزون (حركة مادة يوما بيوم)'], ['benef', 'جدول استهلاك المستفيدين حسب المواد'], ['sources', 'حصيلة الواردات حسب المصدر'], ['ins', 'سجل الواردات']];
  // 1.9.4: the analytical documents (flowing pages with the header of the school)
  function anaPages(s, st) {
    const { tr, thr, tbl, SB } = window.K, A = analytics(st.from, st.to), T = A.T, sub0 = `الموسم الدراسي: ${syOf(st)} — ${period(st.from, st.to)}`;
    const H = t => SB.head(s, t, sub0), sign = SB.sign(s, { right: `حرر ب: ${esc(st.city || s.city || '')} في: ${st.date ? fmtDate(st.date) : '..........'}`, left: 'توقيع وخاتم مدير(ة) المؤسسة' });
    const flow = (t, blocks, page) => MK.flowPages({ page: page || 'a4', cls: 'sb', head: H(t), blocks: blocks.length ? blocks : [{ html: '<p class="sb-p" style="text-align:center">لا توجد معطيات لهذه الفترة.</p>' }], sign });
    if (st.kind === 'analytic') {
      const kv = (a, b) => `<td class="k b">${a}</td><td class="b">${b}</td>`;
      const blocks = [{ html: `<table class="sb-t cmp"><tbody><tr>${kv('المواد المتداولة', T.items)}${kv('الكمية الواردة', `${q(T.inn)} (${T.nIn} عملية)`)}${kv('الكمية المنصرفة', `${q(T.out)} (${T.nOut} عملية)`)}</tr>
          <tr>${kv('المصادر', T.sources)}${kv('المستفيدون', T.benefs)}${kv('نسبة الاستهلاك', Math.round(T.use * 100) + '%')}</tr>
          <tr>${kv('مواد نفدت', T.out0)}${kv('مواد حرجة / منخفضة', `${T.crit} / ${T.low}`)}${kv('مؤشر سلامة المخزون', T.health + '%')}</tr>${T.priced ? `<tr>${kv('قيمة المخزون', dh(T.val))}${kv('قيمة المنصرف', dh(T.valOut))}${kv('مدة الفترة', T.months.toFixed(1) + ' شهر')}</tr>` : ''}</tbody></table>` },
        { html: SB.cap('الوارد والمنصرف حسب الشهر', 'r') + `<div style="text-align:center">${monthsSvg(A.M)}</div>` },
        { before: SB.cap('مؤشرات كل مادة', 'r'), table: tbl(thr(['المادة', 'الرصيد السابق', 'الوارد', 'المنصرف', 'الرصيد الحالي', 'الاستهلاك الشهري', 'التغطية (شهر)', 'المستفيدون', 'الوضعية'].map(t => ({ t, c: 'd' }))),
          A.rows.map(r => tr([{ t: `${r.it.name}${r.it.unit ? ' (' + r.it.unit + ')' : ''}`, c: 'r b' }, q(r.before), q(r.inn), q(r.out), { t: q(r.after), c: 'b' }, avgTxt(r.avgM), covTxt(r.cover), r.benefs || '—', { t: STATUS[r.status][0], c: r.status === 'out' || r.status === 'crit' ? 'red b' : 'b' }])), 'cmp').table },
        { before: SB.cap('حسب الصنف', 'r'), table: tbl(thr(['الصنف', 'عدد المواد', 'الوارد', 'المنصرف'].concat(T.priced ? ['قيمة المخزون'] : []).map(t => ({ t, c: 'd' }))), A.cats.map(c => tr([{ t: c.c, c: 'r b' }, c.n, q(c.inn), q(c.out)].concat(T.priced ? [dh(c.val)] : []))), 'cmp').table }];
      const al = A.rows.filter(r => r.status === 'out' || r.status === 'crit').map(r => `${esc(r.it.name)}: ${r.status === 'out' ? 'نفدت — يلزم التزود' : `الرصيد ${q(r.after)} يكفي ${covTxt(r.cover)} شهر`}`)
        .concat(A.unusual.slice(0, 6).map(u => `استهلاك مرتفع لـ ${esc(u.who)} من «${esc(u.it.name)}»: ${q(u.q)} (المعدل ${q(u.avg.toFixed(1))})`))
        .concat(A.rows.filter(r => r.status === 'idle' && r.after > 0).slice(0, 6).map(r => `مادة راكدة: ${esc(r.it.name)} (${q(r.after)})`));
      if (al.length) blocks.push({ html: SB.cap('التنبيهات والتوصيات', 'r') + `<div class="sb-p" style="line-height:1.8">${al.map(x => `• ${x}`).join('<br>')}</div>` });
      return flow('التقرير التحليلي لتدبير المخزون والوسائل التعليمية', blocks);
    }
    if (st.kind === 'card') {
      const it = itemById(st.itemId); if (!it) return flow('بطاقة المخزون', []);
      const ev = [];
      SD().ins.filter(r => r.itemId === it.id).forEach(r => ev.push({ d: r.date || '', t: 0, who: r.source || '', ref: r.ref || '', inn: num(r.qty), out: 0 }));
      SD().outs.filter(r => r.itemId === it.id).forEach(r => { const b = benefLive(r.benef); ev.push({ d: r.date || '', t: 1, who: b.name + (b.ppr ? ' — ' + b.ppr : ''), ref: '', inn: 0, out: num(r.qty) }); });
      ev.sort((a, b) => a.d.localeCompare(b.d) || a.t - b.t);
      let bal = num(it.opening); const rows = [tr([{ t: '', c: 'sm' }, { t: 'الرصيد الأولي', c: 'r b', s: 2 }, '', '', '', { t: q(bal), c: 'b' }])];
      let ti = 0, to2 = 0;
      ev.forEach(e => { bal += e.inn - e.out; if ((st.from && e.d < st.from) || (st.to && e.d > st.to)) return; ti += e.inn; to2 += e.out;
        rows.push(tr([{ t: fmtDate(e.d), c: 'sm' }, { t: e.t ? 'تسليم' : 'وارد', c: e.t ? 'sm' : 'sm b' }, { t: e.who, c: 'r sm' }, { t: e.ref, c: 'sm' }, e.inn ? { t: q(e.inn), c: 'b' } : '', e.out ? { t: q(e.out), c: 'red b' } : '', { t: q(bal), c: bal < 0 ? 'red b' : 'b' }])); });
      rows.push(tr([{ t: 'المجموع خلال الفترة', s: 4, c: 'd b' }, { t: q(ti), c: 'd b' }, { t: q(to2), c: 'd b' }, { t: q(bal), c: 'd b' }]));
      const r0 = A.rows.find(x => x.it.id === it.id);
      return flow(`بطاقة المخزون: ${esc(it.name)}`, [{ html: `<div class="sb-note">الوحدة: <b>${esc(it.unit || '—')}</b> — الصنف: <b>${esc(catOf(it))}</b> — الحد الأدنى: <b>${it.min ? q(it.min) : '—'}</b>${r0 ? ` — معدل الاستهلاك الشهري: <b>${q(+r0.avgM.toFixed(1))}</b> — التغطية: <b>${covTxt(r0.cover)}</b> شهر — الوضعية: <b>${STATUS[r0.status][0]}</b>` : ''}</div>` },
        tbl(thr(['التاريخ', 'العملية', 'المصدر / المستفيد(ة)', 'المرجع', 'الوارد', 'المنصرف', 'الرصيد'].map(t => ({ t, c: 'd' }))), rows, 'cmp')]);
    }
    if (st.kind === 'benef') {
      const top = A.rows.filter(r => r.out).sort((a, b) => b.out - a.out).slice(0, 7);
      const per = new Map();
      SD().outs.filter(r => (!st.from || r.date >= st.from) && (!st.to || r.date <= st.to)).forEach(r => { const b = benefLive(r.benef), k = b.name; const o = per.get(k) || { b, m: {}, n: 0, other: 0 }; o.n++; if (top.some(t => t.it.id === r.itemId)) o.m[r.itemId] = (o.m[r.itemId] || 0) + num(r.qty); else o.other += num(r.qty); per.set(k, o); });
      const L = Array.from(per.values()).sort((a, b) => a.b.name.localeCompare(b.b.name, 'ar'));
      const rows = L.map((o, i) => tr([i + 1, { t: o.b.name, c: 'r b' }, { t: o.b.ppr || '', c: 'sm' }].concat(top.map(t => o.m[t.it.id] ? q(o.m[t.it.id]) : ''), [o.other ? q(o.other) : '', o.n])));
      rows.push(tr([{ t: 'المجموع', s: 3, c: 'd b' }].concat(top.map(t => ({ t: q(t.out), c: 'd b' })), [{ t: q(L.reduce((a, o) => a + o.other, 0)), c: 'd b' }, { t: L.reduce((a, o) => a + o.n, 0), c: 'd b' }])));
      return flow('جدول استهلاك المستفيدين حسب المواد', [tbl(thr(['ر.ت', 'المستفيد(ة)', 'رقم التأجير'].concat(top.map(t => ({ t: t.it.name, c: 'd', st: 'font-size:7.5pt' })), ['مواد أخرى', 'عدد العمليات']).map(t => (typeof t === 'object' ? t : { t, c: 'd' }))), rows, 'cmp')], 'a4l');
    }
    if (st.kind === 'sources') {
      const INS = SD().ins.filter(r => (!st.from || r.date >= st.from) && (!st.to || r.date <= st.to));
      const blocks = A.src.map(x => { const its = {}; INS.filter(r => (r.source || 'غير محدد') === x.k).forEach(r => { its[r.itemId] = (its[r.itemId] || 0) + num(r.qty); });
        return { before: SB.cap(`${esc(x.k)}: ${x.n} عملية — ${q(x.q)} وحدة`, 'r'), keepNext: true, table: tbl(thr(['المادة', 'الكمية', 'الوحدة'].map(t => ({ t, c: 'd' }))), Object.keys(its).sort((a, b) => its[b] - its[a]).map(id => tr([{ t: itemName(id), c: 'r b' }, q(its[id]), itemUnit(id)])), 'cmp').table }; });
      return flow('حصيلة الواردات حسب المصدر', blocks);
    }
    return [''];
  }
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
    if ((st0.kind === 'item' || st0.kind === 'card') && !st0.itemId && SD().items.length) st0.itemId = topItem();
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
            ${st.kind === 'item' || st.kind === 'card' || st.kind === 'ins' || st.kind === 'outs' ? `<div class="fld"><label>المادة</label><select class="inp" id="dI">${st.kind === 'item' || st.kind === 'card' ? '' : '<option value="">كل المواد</option>'}${sortedItems().map(i => `<option value="${i.id}" ${i.id === st.itemId ? 'selected' : ''}>${esc(i.name)}</option>`).join('')}</select></div>` : ''}
            ${st.kind === 'ins' ? `<div class="fld"><label>المصدر</label><select class="inp" id="dS"><option value="">كل المصادر</option>${SD().sources.map(x => `<option ${x === st.src ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></div>` : ''}
            <div class="sec-t">الفترة</div>
            <div class="fgrid"><div class="fld"><label>من</label><input class="inp" type="date" id="dF" value="${esc(st.from)}" ${st.kind === 'pv' && st.batch ? 'disabled' : ''}></div>
              <div class="fld"><label>إلى</label><input class="inp" type="date" id="dT" value="${esc(st.to)}" ${st.kind === 'pv' && st.batch ? 'disabled' : ''}></div></div>
            <div class="sec-t">التحرير</div>
            <div class="fgrid"><div class="fld"><label>حرر ب</label><input class="inp" id="dC" value="${esc(st.city)}"></div>
              <div class="fld"><label>في (التاريخ)</label><input class="inp" type="date" id="dD" value="${esc(st.date)}"></div></div>`;
          $('#dK', box).onchange = e => {
            st.kind = e.target.value;
            if ((st.kind === 'item' || st.kind === 'card') && !st.itemId && SD().items.length) st.itemId = topItem();
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
        if (['analytic', 'card', 'benef', 'sources'].includes(st.kind)) return { page: st.kind === 'benef' ? 'a4l' : 'a4', pages: anaPages(s, st) };
        return { page: 'a4', pages: reportPages(s, st) };
      },
      validate: st => {
        if (st.kind === 'pv' && !st.benefKey) { toast('المرجو اختيار المستفيد(ة)', true); return false; }
        if ((st.kind === 'item' || st.kind === 'card') && !st.itemId) { toast('المرجو اختيار المادة', true); return false; }
        return true;
      },
      fname: st => (KINDS.find(k => k[0] === st.kind) || ['', 'وثيقة'])[1] + (st.kind === 'pv' && st.benefKey ? '_' + ((benefFromKey(st.benefKey) || { name: st.benefKey.slice(2) }).name) : '')
    });
  };
})();
