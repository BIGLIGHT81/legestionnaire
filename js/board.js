'use strict';
/* السبورة المرجعية — the reference board documents of the school (same blue design, letterhead full width),
   filled automatically from the employees list, the pupils lists and the settings; every cell can be corrected. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { SB, LV, COL, tr, thr, tbl, cell } = window.K;
  const nh = s => MK.hkey(s);

  function migrate(db) {
    const b = db.board = db.board || {};
    b.units = Array.isArray(b.units) ? b.units : [];
    b.years = b.years && typeof b.years === 'object' ? b.years : {};
    b.units.forEach(u => { u.id = u.id || uid('bu'); });
  }
  const BD = () => { migrate(DB); return DB.board; };
  const store = sy => { const y = BD().years; return y[sy] || (y[sy] = {}); };

  /* ---------- units ---------- */
  const UF = ['name', 'gresa', 'created', 'opened', 'area', 'distance', 'rooms'];
  function seedUnits() {
    const names = K.U.names();
    return (names.length ? names : []).map(n => ({ name: n, gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' }));
  }
  const units = () => (BD().units.length ? BD().units : seedUnits());
  const unitNames = () => units().map(u => u.name);
  const sameU = (a, b) => K.U.same(a, b);

  /* ---------- employees ---------- */
  const emps = () => sortedEmps();
  const catOf = e => K.E.cat(e);
  const unitIdx = u => { const l = unitNames(); const i = l.findIndex(x => sameU(x, u)); return i < 0 ? 99 : i; };
  const byUnit = list => list.slice().sort((a, b) => unitIdx(a.unit) - unitIdx(b.unit) || fullName(a).localeCompare(fullName(b), 'ar'));
  const teachers = () => byUnit(emps().filter(e => catOf(e) === 'teacher'));
  const assigned = () => byUnit(emps().filter(e => catOf(e) === 'assigned'));
  const admins = () => emps().filter(e => catOf(e) === 'admin');
  const preschool = () => byUnit((typeof allEmpsSorted === 'function' ? allEmpsSorted() : emps()).filter(e => catOf(e) === 'preschool'));   // 1.9.4: the educators are not in the staff lists, only in their own tables
  const secNow = () => !!(window.Cyc && Cyc.single());      // 1.9.4: one independent institution (collège / lycée / independent primary school): no school units
  const secLvl = () => typeof S === 'function' && /إعدادي|تأهيلي/.test((S().cycle || ''));   // secondary cycle (levels, 8 sessions a day, no pre-school)
  const director = () => emps().find(e => /مدير/.test(e.cadre || e.task || '')) || admins()[0] || null;
  const levelDigits = e => Array.from(new Set((String(e.levels || '').match(/[1-6١-٦]/g) || []).map(c => '١٢٣٤٥٦'.includes(c) ? '١٢٣٤٥٦'.indexOf(c) + 1 : +c))).sort();
  const shortUnit = n => String(n || '').replace(/^(مركزية|وحدة|فرعية)\s*/, '').trim();
  const jobOf = e => {
    if (/مدير/.test(e.cadre || e.task || '') || catOf(e) === 'admin') return 'مدير المؤسسة';
    const u = e.unit && !secNow() ? (/مركزي/.test(e.unit) ? 'بالمركزية' : 'بوحدة ' + shortUnit(e.unit)) : '';
    return `${/ة\s*$/.test(String(e.firstAr || '').trim()) || e.sex === 'F' ? 'أستاذة' : 'أستاذ'} ${u}`.trim();
  };
  const pupCount = (e, sy) => {
    if (!window.Pupils) return '';
    const arr = Pupils.current(sy), ds = levelDigits(e);
    if (!ds.length || !arr.length) return '';
    return ds.map(d => Pupils.cnt(arr, p => p.lvl === 'P' + d && (!e.unit || sameU(p.unit, e.unit))).t).join('+');
  };
  const fd = v => (v ? fmtDate(v) : '');

  /* ---------- association members (shared with the budget part) ---------- */
  const ASSOC = [
    ['najah', 'جمعية دعم مدرسة النجاح'], ['sport', 'الجمعية الرياضية المدرسية'], ['coop', 'التعاونية المدرسية']
  ];
  const ROLES = {
    najah: ['الرئيس', 'نائب الرئيس', 'الأمين', 'نائب الأمين', 'الكاتب'],
    sport: ['الرئيس', 'نائب الرئيس', 'الأمين', 'نائب الأمين', 'الكاتب', 'نائب الكاتب'],
    coop: ['الرئيس', 'نائب الرئيس', 'المنسق', 'الكاتب', 'الأمين']
  };
  const memberRow = e => [fullName(e), jobOf(e), '', e.ppr || '', e.cin || '', e.phone || '', `${S().school || ''}${e.unit ? ' ' + e.unit : ''}`.trim()];
  function defaultBureau(key) {
    const d = director();
    return ROLES[key].map((role, i) => {
      if (i === 0 && d) { const r = memberRow(d); r[2] = role; return r; }
      return ['', '', role, '', '', '', ''];
    });
  }
  const members = (sy, key) => { const f = store(sy).assoc || {}; return Array.isArray(f[key]) ? f[key] : defaultBureau(key); };

  /* ---------- the documents ---------- */
  const SIGN = s => SB.sign(s, { right: '' });
  const hdrs = (cells, cls) => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: cls || '' })));
  const kvTable = (pairs, cols) => {
    const rows = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const a = pairs[i], b = pairs[i + 1] || ['', ''];
      rows.push(tr([{ t: a[0], c: 'k' }, { t: a[1] }, { t: b[0], c: b[0] ? 'k' : '' }, { t: b[1] }]));
    }
    return { table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:16%"><col style="width:34%"><col style="width:16%"><col style="width:34%"></colgroup>', rows } };
  };
  const rowspanGroups = (items, keyOf) => { // [{item, first, span}]
    const out = []; let i = 0;
    while (i < items.length) { let j = i; while (j < items.length && keyOf(items[j]) === keyOf(items[i])) j++; items.slice(i, j).forEach((it, n) => out.push({ it, first: n === 0, span: j - i })); i = j; }
    return out;
  };
  const gridDef = (k, l, cols, o) => Object.assign({ k, l, t: 'grid', cols, widths: cols.map(() => '1fr') }, o || {});
  const DAYS6 = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const DOCS = [];
  const add = d => DOCS.push(d);

  /* 1 — التعريف بالمؤسسة */
  add({
    k: 'intro', t: 'التعريف بالمؤسسة', grp: 'a', get d() { return secNow() ? 'بطاقة تعريف المؤسسة.' : 'بطاقة تعريف المؤسسة والوحدات المدرسية التابعة لها.'; }, auto: 'إعدادات المؤسسة ولوائح الموظفين',
    init: (s, sy) => ({
      school: s.school || '', gresa: s.gresa || '', commune: s.commune || '', directorate: s.directorate || '', academy: s.academy || '', phone: s.phone || '', email: s.email || '', address: s.address || '',
      domain: 'قروي', type: 'مختلطة', cycle: s.cycle || 'الابتدائي', created: '', opened: '', area: '', code: '', rooms: '', staff: String(admins().length + teachers().length + assigned().length),
      units: units().map(u => UF.map(k => u[k] || ''))
    }),
    defs: f => [
      { sec: 'معطيات المؤسسة' }, { k: 'school', l: 'اسم المؤسسة', half: true }, { k: 'code', l: 'رمز المؤسسة', half: true }, { k: 'gresa', l: 'رمز GRESA', half: true }, { k: 'commune', l: 'الجماعة', half: true },
      { k: 'directorate', l: 'المديرية', half: true }, { k: 'academy', l: 'الأكاديمية', half: true }, { k: 'address', l: 'العنوان' }, { k: 'phone', l: 'الهاتف', half: true, dir: 'ltr' }, { k: 'email', l: 'البريد الإلكتروني', half: true, dir: 'ltr' },
      { k: 'domain', l: 'المجال', half: true }, { k: 'type', l: 'نوع المؤسسة', half: true }, { k: 'cycle', l: 'السلك', half: true }, { k: 'created', l: 'تاريخ الإحداث', half: true }, { k: 'opened', l: 'تاريخ الافتتاح', half: true },
      { k: 'area', l: 'المساحة', half: true }, { k: 'rooms', l: 'عدد القاعات', half: true }, { k: 'staff', l: 'عدد الأطر التربوية', half: true },
      ...(secNow() ? [] : [{ sec: 'الوحدات المدرسية (تُستعمل أسماؤها في كل وثائق السبورة والمجالس)' },
        gridDef('units', '', ['الوحدة', 'رمز GRESA', 'تاريخ الإحداث', 'تاريخ الافتتاح', 'المساحة', 'البعد عن المركزية', 'عدد القاعات'], { widths: ['1.5fr', '1fr', '1fr', '1fr', '.9fr', '1.1fr', '.7fr'], list: ['k2Units'] })])
    ],
    onSave: (k, f) => {
      if (k !== 'units') return;
      const old = BD().units;
      BD().units = f.units.filter(r => String(r[0] || '').trim()).map((r, i) => { const o = { id: (old[i] && old[i].id) || uid('bu') }; UF.forEach((x, j) => { o[x] = String(r[j] == null ? '' : r[j]).trim(); }); return o; });
    },
    build: (s, f, sy) => {
      const U = f.units.filter(r => String(r[0] || '').trim());
      const staffOf = n => emps().filter(e => e.unit && sameU(e.unit, n) && ['teacher', 'assigned', 'admin'].includes(catOf(e))).length;
      const rows = [['رمز GRESA', 1], ['تاريخ الإحداث', 2], ['تاريخ الافتتاح', 3], ['المساحة الإجمالية', 4], ['البعد عن المركزية', 5], ['عدد القاعات البيداغوجية', 6]]
        .map(([l, i]) => tr([{ t: l, c: 'k' }].concat(U.map(r => ({ t: r[i] || '', c: 'ltr' })))))
        .concat([tr([{ t: 'عدد الأطر التربوية', c: 'k' }].concat(U.map(r => ({ t: String(staffOf(r[0])).padStart(2, '0') }))))]);
      const head = thr([{ t: '', c: 'd' }].concat(U.map(r => ({ t: /^(وحدة|مركزية|فرعية)/.test(r[0]) ? r[0] : 'وحدة ' + r[0], c: 'd' }))));
      return {
        title: 'التعريف بالمؤسسة', sign: SIGN(s),
        blocks: [kvTable([['اسم المؤسسة', f.school], ['رمزها', f.code], ['رمز GRESA', f.gresa], ['الجماعة', f.commune], ['المديرية', f.directorate], ['الأكاديمية', f.academy], ['الهاتف', f.phone], ['البريد الإلكتروني', f.email],
          ['العنوان', f.address], ['المجال', f.domain], ['نوع المؤسسة', f.type], ['السلك', f.cycle], ['تاريخ الإحداث', f.created], ['تاريخ الافتتاح', f.opened], ['المساحة', f.area], ['عدد القاعات', f.rooms], ['عدد الأطر التربوية', f.staff]]),
          ...(secNow() ? [] : [SB.cap('الوحدات المدرسية التابعة لها'), tbl(head, rows, 'cmp')])]
      };
    }
  });

  /* 2 — تركيبة الجمعيات */
  const asCols = ['الاسم والنسب', 'المهمة', 'الصفة', 'رقم التأجير', 'ر.ب.ت.و', 'الهاتف', 'العنوان'];
  add({
    k: 'assoc', t: 'تركيبة الجمعيات الفاعلة بالمؤسسة', grp: 'a', d: 'مكاتب جمعية دعم مدرسة النجاح والجمعية الرياضية والتعاونية المدرسية.', auto: 'لوائح الموظفين (اختر الاسم فتُملأ بقية الخانات)',
    init: () => ({ najah: defaultBureau('najah'), sport: defaultBureau('sport'), coop: defaultBureau('coop') }),
    defs: () => ASSOC.filter(([k]) => !(k === 'coop' && secNow())).map(([k, l]) => gridDef(k, l, asCols, {
      widths: ['1.5fr', '1.3fr', '1fr', '.9fr', '.9fr', '1fr', '1.6fr'], list: ['k2Emps'],
      fill: r => { const e = K.E.byName(r[0]); if (!e) return null; const m = memberRow(e); return [m[0], r[1] || m[1], r[2], m[3], m[4], m[5], m[6]]; }
    })),
    build: (s, f) => ({
      title: 'تركيبة الجمعيات الفاعلة بالمؤسسة', sign: SIGN(s),
      blocks: ASSOC.filter(([k]) => !(k === 'coop' && secNow())).map(([k, l]) => tbl(thr([{ t: l, c: 'd', s: 8 }]) + thr(['ر.ت'].concat(asCols).map(t => ({ t, c: 'd' }))),
        (f[k] || []).filter(r => r.some(x => String(x || '').trim())).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'sm' }, r[2], r[3], { t: r[4], c: 'ltr' }, { t: r[5], c: 'nw' }, { t: r[6], c: 'xs r' }]))))
    })
  });

  /* 3 — أوقات العمل */
  add({
    k: 'hours', t: 'أوقات عمل الأطر التربوية', grp: 'a', get d() { return secNow() ? 'التوقيت الأسبوعي لكل أستاذ(ة).' : 'التوقيت الأسبوعي لكل أستاذ(ة) بكل وحدة مدرسية.'; }, get auto() { return secNow() ? 'لائحة هيئة التربية والتعليم' : 'لائحة هيئة التربية والتعليم مرتبة حسب الوحدة المدرسية'; },
    init: (s, sy) => {
      const dh = 'من 8:30 إلى 14:30';
      return { defH: dh, rows: byUnit(teachers().concat(assigned())).map(e => [e.unit || '', fullName(e)].concat(DAYS6.map((d, i) => (i < 5 ? dh : '')))) };
    },
    defs: f => [
      { k: 'defH', l: 'التوقيت المعتاد (للتعبئة السريعة)', half: true, ph: 'من 8:30 إلى 14:30' },
      { t: 'html', half: true, html: `<label>&nbsp;</label><button type="button" class="btn sm" data-act="applyH">تطبيق على الاثنين–الجمعة لكل الأساتذة</button>` },
      gridDef('rows', 'التوقيت الأسبوعي', ['الوحدة', 'الاسم'].concat(DAYS6), { widths: ['1fr', '1.4fr'].concat(DAYS6.map(() => '1.1fr')), list: ['k2Units', 'k2Emps'] })
    ],
    act: { applyH: (f, sy, c) => { f.rows.forEach(r => { for (let i = 2; i < 7; i++) r[i] = f.defH; }); c.save('rows'); } },
    build: (s, f, sy) => {
      const rows = rowspanGroups(f.rows.filter(r => String(r[1] || '').trim()), r => nh(r[0]));
      const head = thr([{ t: '', c: 'd' }, { t: 'أسماء الأساتذة', c: 'd' }].concat(DAYS6.map(d => ({ t: d, c: 'd' }))));
      return {
        title: `أوقات عمل الأطر التربوية خلال الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, sign: SIGN(s),
        blocks: [tbl(head, rows.map(({ it, first, span }) => tr((first ? [{ t: it[0], c: 'k', r: span }] : []).concat([{ t: it[1], c: 'b r' }]).concat(it.slice(2, 8).map(x => (String(x || '').trim() ? { t: x, c: 'sm nw' } : { t: '', c: 'gr' }))))), 'cmp')]
      };
    }
  });

  /* 4 — جدولة مسار والامتحانات */
  // 1.9.3: the dates of the certified exams follow the cycle (primary: ministerial decree 017.26; collège / lycée: to fill from the decree of the year)
  const certRows = b => {
    const k = window.Cyc ? Cyc.kind() : 'pri', dots = '..........';
    if (k === 'col') return [[`${dots} يناير ${b}`, 'إجراء الامتحان الموحد المحلي لنيل شهادة السلك الإعدادي (الثالثة إعدادي)'], [dots, 'انتهاء مسك نقط الامتحان الموحد المحلي'], [`${dots} يونيو ${b}`, 'إجراء الامتحان الجهوي الموحد لنيل شهادة السلك الإعدادي'], [dots, 'انتهاء مسك نقط الامتحان الجهوي الموحد']];
    if (k === 'lyc') return [[`${dots} يناير ${b}`, 'إجراء الامتحان الموحد المحلي (الأولى باكالوريا)'], [`${dots} يونيو ${b}`, 'إجراء الامتحان الجهوي الموحد (الأولى باكالوريا)'], [`${dots} يونيو ${b}`, 'إجراء الامتحان الوطني الموحد لنيل شهادة الباكالوريا (الثانية باكالوريا)'], [`${dots} يوليوز ${b}`, 'الدورة الاستدراكية للامتحان الوطني الموحد']];
    return [[`18 و19 يناير ${b}`, 'إجراء الامتحان الموحد المحلي لنيل شهادة الدروس الابتدائية'], [`20 يناير ${b}`, 'انتهاء مسك نقط الامتحان الموحد المحلي'],
      [`من 21 إلى 24 يونيو ${b}`, 'الإعداد الجماعي للامتحان الموحد الإقليمي'], [`25 و26 يونيو ${b}`, 'إجراء الامتحان الموحد الإقليمي لنيل شهادة الدروس الابتدائية'], [`30 يونيو ${b}`, 'انتهاء مسك نقط الامتحان الموحد الإقليمي']];
  };
  add({
    k: 'massar', t: 'الجدولة الزمنية لمنظومة مسار والامتحانات', grp: 'a', d: 'مواعيد الفروض ومسك النقط والامتحانات الإشهادية والكفاءة المهنية.',
    init: (s, sy) => {
      const a = MK.syStart(sy), b = a + 1;
      // 1.9.2: dates of the ministerial decree (2026/2027: decree n° 017.26); other years: same calendar, to check against the decree
      return {
        ops: [['ابتداء من الأسبوع 7', 'إجراء الفرض', 'الفرض الأول', 'الأسدوس الأول'], ['ابتداء من الأسبوع 7', 'مسك النقط', '', ''], [`من 4 إلى 9 يناير ${b}`, 'إجراء آخر فروض المراقبة المستمرة', 'الفرض الأخير', ''],
          [`قبل 16 يناير ${b}`, 'انتهاء مسك آخر فروض المراقبة المستمرة', '', ''], [`ابتداء من 21 يناير ${b}`, 'استصدار بيانات النقط عبر منظومة مسار', '', ''], [`21 و22 يناير ${b} / 23 يناير ${b}`, 'عقد مجالس الأقسام / توزيع بيانات النقط على المتعلمين', '', ''],
          ['ابتداء من الأسبوع 24', 'إجراء الفرض', 'الفرض الأول', 'الأسدوس الثاني'], ['ابتداء من الأسبوع 24', 'مسك النقط', '', ''], [`ما بين 14 و19 يونيو ${b}`, 'إجراء آخر فروض المراقبة المستمرة', 'الفرض الأخير', ''],
          [`قبل 22 يونيو ${b}`, 'انتهاء مسك آخر فروض المراقبة المستمرة', '', ''], [`ابتداء من فاتح يوليوز ${b}`, 'استصدار بيانات النقط عبر منظومة مسار', '', ''], [`1 و2 يوليوز ${b} / 3 يوليوز ${b}`, 'عقد مجالس الأقسام لنهاية السنة / توزيع بيانات النقط', '', '']],
        cert: certRows(b),
        pro: [[a === 2026 ? 'السبت 5 دجنبر 2026' : `.......... دجنبر ${a}`, `إجراء امتحانات الكفاءة المهنية برسم دورة ${a}`], ['لم يحدد التاريخ', 'امتحان التأهيل المهني']]
      };
    },
    defs: () => [gridDef('ops', 'المراقبة المستمرة ومسك النقط', ['الموعد', 'العملية', 'الفرض', 'الأسدوس'], { widths: ['1.6fr', '1.6fr', '1fr', '1fr'] }),
      gridDef('cert', 'مواعيد الامتحانات الإشهادية', ['الموعد', 'الامتحان'], { widths: ['1fr', '2fr'] }), gridDef('pro', 'امتحانات الكفاءة المهنية والتأهيل المهني', ['الموعد', 'الامتحان'], { widths: ['1fr', '2fr'] })],
    build: (s, f, sy) => {
      const ops = f.ops.map((r, i) => { const sem = r[3]; return tr([{ t: r[0], c: 'sm' }, { t: r[1], c: 'b' }, { t: r[2] }, sem ? { t: sem, c: 'k', r: 6 } : { h: '', c: 'x' }]); });
      // the semester cell spans 6 rows: drop the empty placeholders
      // the semester cell spans its own rows (up to the next semester)
      const spanOf = i => { let n = 1; while (i + n < f.ops.length && !String(f.ops[i + n][3] || '').trim()) n++; return n; };
      const rowsOps = []; f.ops.forEach((r, i) => { rowsOps.push(`<tr>${cell({ t: r[0], c: 'sm' }, 'td')}${cell({ t: r[1], c: 'b' }, 'td')}${cell({ t: r[2] }, 'td')}${r[3] || i === 0 ? cell({ t: r[3], c: 'k', r: spanOf(i) }, 'td') : ''}</tr>`); });
      const t1 = tbl(thr(['الموعد', 'العمليات', 'الفرض', 'الأسدوس'].map(t => ({ t, c: 'd' }))), rowsOps, 'cmp');
      const t2 = tbl(thr(['الموعد', 'الامتحان'].map(t => ({ t, c: 'd' }))), f.cert.map(r => tr([{ t: r[0], c: 'sm' }, { t: r[1], c: 'b' }])), 'big');
      const t3 = tbl(thr(['الموعد', 'الامتحان'].map(t => ({ t, c: 'd' }))), f.pro.map(r => tr([{ t: r[0], c: 'sm' }, { t: r[1], c: 'b' }])), 'big');
      return {
        title: `منظومة مسار: الجدولة الزمنية لمختلف العمليات برسم السنة الدراسية ${esc(MK.syDash(sy).replace('-', ' / '))}`, sign: SIGN(s),
        blocks: [`<div class="sb-g2"><div>${SB.cap('المراقبة المستمرة ومسك النقط')}<table class="tbl sb-t cmp"><thead>${t1.table.head}</thead><tbody>${rowsOps.join('')}</tbody></table></div>
          <div>${SB.cap('مواعيد الامتحانات الإشهادية')}<table class="tbl sb-t big"><thead>${t2.table.head}</thead><tbody>${t2.table.rows.join('')}</tbody></table>
          ${SB.cap('تواريخ امتحانات الكفاءة المهنية والتأهيل المهني')}<table class="tbl sb-t big"><thead>${t3.table.head}</thead><tbody>${t3.table.rows.join('')}</tbody></table></div></div>`]
      };
    }
  });

  /* 5 — اللائحة الاسمية مع التنقيط */
  add({
    k: 'scoring', t: 'اللائحة الاسمية لهيئة التربية والتعليم مقرونة بمعايير التنقيط', grp: 'a', d: 'ترتيب الأساتذة حسب الأقدمية في الوظيفة والمديرية والمؤسسة.', auto: 'تواريخ التوظيف والالتحاق بالمديرية وبالمؤسسة من لائحة الموظفين',
    init: (s, sy) => ({ ref: String(MK.syStart(sy) + 1), kp: '1', kd: '1', ks: '2', assignedToo: '' }),
    defs: () => [{ k: 'ref', l: 'سنة الاحتساب (تُطرح منها سنة كل تاريخ)', half: true, t: 'num' }, { k: 'kp', l: 'نقط كل سنة بالوظيفة', half: true, t: 'num' }, { k: 'kd', l: 'نقط كل سنة بالمديرية', half: true, t: 'num' }, { k: 'ks', l: 'نقط كل سنة بالمؤسسة', half: true, t: 'num' },
      { note: 'الأساتذة المدرجون هم من فئة «هيئة التربية والتعليم». تحتسب النقط = (سنة الاحتساب − سنة التاريخ) × المعامل، ويرتب الأساتذة تنازليا حسب مجموع النقط.' }],
    build: (s, f, sy) => {
      const ref = +f.ref || MK.syStart(sy) + 1, kp = +f.kp, kd = +f.kd, ks = +f.ks;
      const yrs = d => { const y = K.yearOf(d); return y ? Math.max(0, ref - y) : null; };
      const L = teachers().map(e => {
        const a = yrs(e.hire), b = yrs(e.dirDate), c = yrs(e.affDate);
        const pa = a == null ? null : a * kp, pb = b == null ? null : b * kd, pc = c == null ? null : c * ks;
        return { e, a, b, c, pa, pb, pc, tot: (pa || 0) + (pb || 0) + (pc || 0) };
      }).sort((x, y) => y.tot - x.tot);
      const v = x => (x == null ? '' : x);
      const head = thr(['ر.ت', 'لغة التكوين', 'الاسم والنسب', 'تاريخ الازدياد', 'رقم التأجير', 'تاريخ التوظيف', 'السنة', 'النقط', 'تاريخ الالتحاق بالمديرية', 'السنة', 'النقط', 'تاريخ الالتحاق بالمؤسسة', 'السنة', 'النقط', 'مجموع النقط', 'الترتيب'].map((t, i) => ({ t, c: i === 14 || i === 15 ? 'g' : 'd' })));
      const rows = L.map((x, i) => tr([i + 1, x.e.formation || '', { t: fullName(x.e), c: 'b r nw' }, fd(x.e.birth), x.e.ppr || '', fd(x.e.hire), K.yearOf(x.e.hire) || '', v(x.pa), fd(x.e.dirDate), K.yearOf(x.e.dirDate) || '', v(x.pb), fd(x.e.affDate), K.yearOf(x.e.affDate) || '', v(x.pc), { t: x.tot, c: 'y' }, { t: i + 1, c: 'y' }]));
      return { title: 'اللائحة الاسمية لهيئة التربية والتعليم بالمؤسسة مقرونة بمعايير التنقيط', sign: SIGN(s), blocks: [tbl(head, rows, 'cmp')] };
    }
  });

  /* 6 — لائحة العاملين */
  add({
    k: 'staff', t: 'لائحة العاملين بالمؤسسة', grp: 'a', get d() { return secNow() ? 'الإدارة، هيئة التربية والتعليم مع الأقسام وعدد التلاميذ، الأساتذة المكلفون.' : 'الإدارة، هيئة التربية والتعليم مع المستويات وعدد التلاميذ، المكلفون، مربو التعليم الأولي.'; }, auto: 'لائحة الموظفين ولوائح التلاميذ',
    init: () => ({ show: ['1', '1', '1', '1'] }),
    defs: () => [{ k: 'show', l: 'الأجزاء المعروضة', t: 'checks', opts: ['هيئة الإدارة التربوية والتدبير', 'هيئة التربية والتعليم', 'الأساتذة المكلفون بالمؤسسة'].concat(secLvl() ? [] : ['مربو ومربيات التعليم الأولي']) }],
    build: (s, f, sy) => {
      const on = i => (f.show || [])[i] !== false && (f.show || [])[i] !== '' ;
      const blocks = [];
      const sch = S();
      blocks.push(`<div class="sb-g2" style="font-weight:700;font-size:10pt;margin-bottom:1mm"><div>المؤسسة: ${esc(sch.school || '')}</div><div style="text-align:left">${sch.phone ? 'الهاتف: ' + esc(sch.phone) : ''}</div></div>`);
      if (on(0)) {
        blocks.push(tbl(thr(['هيئة الإدارة التربوية والتدبير', 'الاسم الكامل', 'رقم التأجير', 'تاريخ التوظيف', 'الإطار والدرجة', 'تاريخها', 'الرتبة', 'تاريخها', 'تاريخ الالتحاق بالمؤسسة'].map(t => ({ t, c: 'd' }))),
          admins().map((e, i) => tr([i + 1, { t: fullName(e), c: 'b r' }, e.ppr || '', fd(e.hire), `${e.cadre || ''} ${e.grade || ''}`.trim(), fd(e.gradeDate), e.echelon || '', fd(e.echelonDate), fd(e.affDate)]))));
      }
      if (on(1)) {
        const L = teachers();
        const head = `<tr><th rowspan="2" class="d">ر.ت</th>${secNow() ? '' : '<th rowspan="2" class="d">الوحدة المدرسية</th>'}<th rowspan="2" class="d">اسم الأستاذ(ة)</th><th rowspan="2" class="d">رقم التأجير</th><th colspan="2" class="d">اللغة</th><th rowspan="2" class="d">تاريخ التوظيف</th><th rowspan="2" class="d">تاريخ الالتحاق بالمؤسسة</th><th rowspan="2" class="d">الدرجة</th><th rowspan="2" class="d">الرتبة</th><th rowspan="2" class="d">تاريخها</th><th rowspan="2" class="d">التفتيش</th><th rowspan="2" class="d">تاريخها</th><th rowspan="2" class="d">المستوى</th><th rowspan="2" class="d">التلاميذ</th></tr><tr><th>التكوين</th><th>التدريس</th></tr>`;
        const g = secNow() ? L.map(e => ({ it: e, first: false, span: 1 })) : rowspanGroups(L, e => nh(e.unit));
        blocks.push({ before: SB.cap('هيئة التربية والتعليم'), table: { cls: 'sb-t cmp', head, rows: g.map(({ it: e, first, span }, i) => tr([{ t: i + 1, c: 'gr' }].concat(first ? [{ t: shortUnit(e.unit), c: 'k', r: span }] : []).concat([{ t: fullName(e), c: 'b r nw' }, e.ppr || '', e.formation || '', e.teachLang || '', fd(e.hire), fd(e.affDate), e.grade || '', e.echelon || '', fd(e.echelonDate), e.inspScore || '', fd(e.inspDate), { t: String(e.levels || '').replace(/\s+/g, ''), c: 'sm' }, pupCount(e, sy)]))) }, keepNext: true });
      }
      if (on(2) && assigned().length) {
        blocks.push({ before: SB.cap('الأساتذة المكلفون بالمؤسسة'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الوحدة المدرسية', 'الاسم الكامل', 'رقم التأجير', 'تاريخ التوظيف', 'لغة التدريس', 'الأقسام المسندة', 'عدد التلاميذ', 'المؤسسة الأصلية', 'تاريخ التكليف', 'أسباب التكليف'].filter(t => !(secNow() && t === 'الوحدة المدرسية')).map(t => ({ t, c: 'd' }))),
          rows: assigned().map((e, i) => tr([i + 1].concat(secNow() ? [] : [shortUnit(e.unit)], [{ t: fullName(e), c: 'b r' }, e.ppr || '', fd(e.hire), e.teachLang || '', String(e.levels || '').replace(/\s+/g, ''), pupCount(e, sy), e.origin || '', fd(e.assignDate), { t: e.assignReason || '', c: 'sm' }]))) }, keepNext: true });
      }
      if (on(3) && !secLvl() && preschool().length) {
        blocks.push({ before: SB.cap('مربيات ومربو التعليم الأولي'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'ر.ب.ت.و', 'تاريخ الالتحاق بالمؤسسة', 'آخر شهادة دراسية', 'آخر شهادة مهنية', 'التجربة بالتعليم الأولي', 'الوحدة المدرسية'].map(t => ({ t, c: 'd' }))),
          rows: preschool().map((e, i) => { const y = K.yearOf(e.affDate); const n = y ? Math.max(0, MK.syStart(sy) + 1 - y) : null; return tr([String(i + 1).padStart(2, '0'), { t: fullName(e), c: 'b r' }, { t: e.cin || '', c: 'ltr' }, fd(e.affDate), e.diploma || '', e.proDiploma || '--------', n == null ? '' : K.WORD_NUM(n), shortUnit(e.unit)]); }) }, keepNext: true });
      }
      return { title: `لائحة العاملين بالمؤسسة ${esc(MK.syDash(sy).replace('-', ' / '))}`, sign: SIGN(s), blocks };
    }
  });

  /* 7 — خلية اليقظة والإنصات والمصالحة */
  const vigDefault = () => {
    const d = director(), T = teachers();
    const first = []; unitNames().forEach(n => { const e = T.find(x => x.unit && sameU(x.unit, n)); if (e) first.push(e); });
    const rows = [];
    if (d) rows.push([fullName(d), 'مدير المؤسسة', 'مشرف الخلية', d.phone || '', d.email || '']);
    first.forEach((e, i) => rows.push([fullName(e), jobOf(e), i === 0 ? 'منسق الخلية' : 'عضو الخلية', e.phone || '', e.email || '']));
    return rows;
  };
  const vigFill = r => { const e = K.E.byName(r[0]); if (!e) return null; return [r[0], r[1] || jobOf(e), r[2], e.phone || r[3], e.email || r[4]]; };
  add({
    k: 'vigil', t: 'خلية اليقظة وخلية الإنصات والمصالحة', grp: 'a', d: 'أعضاء الخليتين وصفاتهم وبيانات الاتصال بهم.', auto: 'لائحة الموظفين (أول أستاذ بكل وحدة)',
    init: () => { const v = vigDefault(); return { vig: v, ecoute: v.map(r => r.slice()) }; },
    defs: () => [gridDef('vig', 'أعضاء خلية اليقظة', ['الاسم الكامل', 'المهمة', 'الصفة', 'الهاتف', 'البريد الإلكتروني'], { widths: ['1.5fr', '1.3fr', '1fr', '1fr', '1.6fr'], list: ['k2Emps'], fill: vigFill }),
      gridDef('ecoute', 'أعضاء خلية الإنصات والمصالحة', ['الاسم الكامل', 'الإطار', 'الصفة', 'الهاتف', 'البريد الإلكتروني'], { widths: ['1.5fr', '1.3fr', '1fr', '1fr', '1.6fr'], list: ['k2Emps'], fill: vigFill })],
    build: (s, f, sy) => {
      const dsy = esc(MK.syDash(sy).replace('-', '/'));
      const mk = (rows, third) => tbl(thr(['الاسم الكامل', third, 'الصفة', 'الهاتف', 'البريد الإلكتروني'].map(t => ({ t, c: 'd' }))), rows.filter(r => String(r[0] || '').trim()).map(r => tr([{ t: r[0], c: 'k b' }, r[1], r[2], { t: r[3], c: 'ltr nw' }, { t: r[4], c: 'ltr sm' }])), 'big');
      return { title: `أعضاء خلية اليقظة وخلية الإنصات والمصالحة — الموسم الدراسي ${dsy}`, sign: SIGN(s), blocks: [SB.cap(`أعضاء خلية اليقظة الموسم الدراسي ${dsy}`), mk(f.vig, 'المهمة'), SB.cap(`أعضاء خلية الإنصات والمصالحة الموسم الدراسي ${dsy}`), mk(f.ecoute, 'الإطار')] };
    }
  });

  /* 8 — تركيبة المجالس (shared with مجالس المؤسسة) */
  add({
    k: 'councilComp', t: 'تركيبة مجالس المؤسسة', grp: 'a', d: 'أعضاء مجلس التدبير والمجلس التربوي والمجالس التعليمية ومجالس الأقسام.', auto: 'لائحة الموظفين والمستويات المسندة (تعدل من «مجالس المؤسسة»)',
    init: () => ({}),
    defs: () => [{ note: 'تركيبة المجالس تُعدّل من خانة «المجالس التقنية ← تركيبة المجالس». هذه الوثيقة تعرضها بتصميم السبورة المرجعية.' }],
    build: (s, f, sy) => (window.Council ? Council.compositionDoc(s, sy) : { title: 'تركيبة المجالس التقنية للمؤسسة', blocks: [] })
  });

  /* 9 — pupils statistics (from بطاقة التلاميذ) */
  const pu = (k, t, d) => add({
    k: 'pu_' + k, t, grp: 'b', get d() { return typeof d === 'function' ? d() : d; }, auto: 'لوائح مسار المستوردة في «بطاقة التلاميذ»', init: () => ({}), defs: () => [{ note: 'تُحسب هذه الوثيقة تلقائيا من لوائح التلاميذ المستوردة. لتصحيح الأرقام عدّل اللوائح أو الحركية في «بطاقة التلاميذ».' }],
    build: (s, f, sy) => { if (!window.Pupils || !Pupils.Y(sy).pupils.length) return { title: t, blocks: [`<p class="sb-p" style="text-align:center;margin-top:20mm">لا توجد لوائح تلاميذ لهذا الموسم. استورد لوائح مسار من خانة «بطاقة التلاميذ».</p>`] }; return Pupils.docs[k] ? Pupils.docs[k](s, sy) : Pupils2.docs[k](s, sy, {}); }
  });
  pu('gender', 'إحصاء التلاميذ حسب الجنس', () => secNow() ? 'عدد الذكور والإناث بكل مستوى مع مبيانات.' : 'عدد الذكور والإناث بكل مستوى وكل وحدة مدرسية مع مبيانات.');
  pu('age', 'توزيع التلاميذ حسب السن', 'التوزيع حسب السن والمستوى والجنس.');
  pu('moves', 'جدول التتبع الدوري للإحصاء وحركية التلاميذ', 'الوافدون والمغادرون والمنقطعون وغير الملتحقين.');
  pu('girls', 'نسبة تمدرس الفتاة', 'نسبة الإناث بكل مستوى مع مبيانات.');
  pu('new1', 'إحصاء المسجلين الجدد بالسنة الأولى', 'حسب سنة الازدياد والوحدة والجنس.');
  Object.defineProperty(DOCS[DOCS.length - 1], 't', { get() { return (window.Cyc && Cyc.kind() === 'lyc') ? 'إحصاء المسجلين الجدد بالجذع المشترك' : 'إحصاء المسجلين الجدد بالسنة الأولى'; }, configurable: true });
  pu('school', 'لوحة إحصاء التمدرس', 'التلاميذ حسب الوحدة والمستوى والجنس مع الحركية (الوافدون، المغادرون، المنقطعون، غير الملتحقين).');
  pu('xfer', 'لائحة التحويلات (الوافدون / المغادرون / في طور التحويل)', 'مستوردة من لوائح مسار في «بطاقة التلاميذ».');
  pu('disab', 'إحصاء ولائحة التلاميذ في وضعية إعاقة', 'حسب نوع الإعاقة والمستوى والجنس.');
  pu('threat', 'لائحة وإحصاء التلاميذ المهددين بالفصل', 'مستوردة من لائحة مسار «المهددون بالفصل».');

  /* 10 — التأمين المدرسي */
  add({
    k: 'insurance', t: 'إحصاء المنخرطين في التأمين المدرسي', grp: 'b', get d() { return secNow() ? 'عدد المؤمَّنين بكل مستوى حسب الجنس.' : 'عدد المؤمَّنين بكل وحدة مدرسية حسب الجنس.'; }, auto: 'عدد التلاميذ بلوائح مسار (كل تلميذ منخرط ما لم تعدل الأرقام)',
    init: (s, sy) => secNow() ? ({ rows: Cyc.levels().map(k => { const c = window.Pupils ? Pupils.cnt(Pupils.current(sy), p => p.lvl === k) : { m: '', f: '' }; return [LV.ar(k), String(c.m), String(c.f)]; }) }) : ({ rows: unitNames().map(n => { const c = window.Pupils ? Pupils.cnt(Pupils.current(sy), p => sameU(p.unit, n)) : { m: '', f: '' }; return [n, String(c.m), String(c.f)]; }) }),
    defs: () => [secNow() ? gridDef('rows', 'المؤمَّنون بكل مستوى', ['المستوى', 'الذكور', 'الإناث'], { widths: ['2fr', '1fr', '1fr'], types: ['text', 'num', 'num'] })
      : gridDef('rows', 'المؤمَّنون بكل وحدة', ['الوحدة المدرسية', 'الذكور', 'الإناث'], { widths: ['2fr', '1fr', '1fr'], list: ['k2Units'], types: ['text', 'num', 'num'] })],
    build: (s, f, sy) => {
      const R = f.rows.filter(r => String(r[0] || '').trim());
      const m = R.reduce((a, r) => a + (+r[1] || 0), 0), w = R.reduce((a, r) => a + (+r[2] || 0), 0);
      const head = `<tr><th rowspan="2" class="d">${secNow() ? 'المستوى' : 'الوحدة المدرسية'}</th><th colspan="2" class="d">الجنس</th><th rowspan="2" class="d">المجموع</th></tr><tr><th>الذكور</th><th>الإناث</th></tr>`;
      const rows = R.map(r => tr([{ t: secNow() || /^(وحدة|مركزية|فرعية)/.test(r[0]) ? r[0] : 'وحدة ' + r[0], c: 'k' }, +r[1] || 0, +r[2] || 0, { t: (+r[1] || 0) + (+r[2] || 0), c: 'y' }]))
        .concat([tr([{ t: 'المجموع', c: 'k' }, { t: m, c: 's' }, { t: w, c: 's' }, { t: m + w, c: 'g' }])]);
      return { title: `إحصاء المنخرطين في التأمين برسم الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, sign: SB.sign(s, { right: '', left: 'توقيع رئيس الجمعية' }), blocks: [tbl(head, rows, 'big')] };
    }
  });

  /* 11 — الحراسة اليومية */
  const supDefault = () => {
    if (window.Guard && Guard.any()) return Guard.boardRows(unitNames());   // linked to «جداول الحراسة» (الوثائق)
    const U = unitNames(), T = teachers().concat(assigned());
    return DAYS6.map((d, di) => [d].concat(U.map(n => {
      if (di === 5) return '';
      const L = T.filter(e => e.unit && sameU(e.unit, n)).map(e => fullName(e));
      return L.length ? L[di % L.length] : '';
    })));
  };
  add({
    k: 'supervision', noSec: true, t: 'جدول الحراسة اليومية للتلاميذ', grp: 'a', d: 'أستاذ(ة) الحراسة لكل يوم بكل وحدة مدرسية.', auto: 'جداول الحراسة (الوثائق) أو لائحة الأساتذة بكل وحدة (تناوب تلقائي قابل للتعديل)',
    init: () => ({ rows: supDefault(), per: unitNames().map(n => [n, 'الفترة من 8:30 إلى 14:30']) }),
    defs: f => [{ t: 'html', html: `<button type="button" class="btn sm" data-act="rota">توليد التناوب تلقائيا (من جداول الحراسة أو لائحة الأساتذة)</button>` },
      gridDef('per', 'التوقيت المقصود بكل وحدة', ['الوحدة', 'الفترة'], { widths: ['1fr', '2fr'], list: ['k2Units'] }),
      gridDef('rows', 'الحراسة', ['اليوم'].concat((f.per || []).map(r => r[0] || '—')), { widths: ['.8fr'].concat((f.per || []).map(() => '1.2fr')), list: [null].concat((f.per || []).map(() => 'k2Emps')), fixed: true })],
    act: { rota: (f, sy, c) => { if (window.Guard && Guard.any()) { f.rows = Guard.boardRows((f.per || []).map(r => r[0])); c.save('rows'); return; } const U = (f.per || []).map(r => r[0]); const T = teachers().concat(assigned()); f.rows = DAYS6.map((d, di) => [d].concat(U.map(n => { if (di === 5) return ''; const L = T.filter(e => e.unit && sameU(e.unit, n)).map(e => fullName(e)); return L.length ? L[di % L.length] : ''; }))); c.save('rows'); } },
    build: (s, f, sy) => {
      const per = f.per || [];
      const head = `<tr><th rowspan="2" class="d">الأيام</th><th colspan="${per.length}" class="d">الوحدات المدرسية</th></tr><tr>${per.map(r => `<th>${esc(r[0])}</th>`).join('')}</tr><tr><th class="d"></th>${per.map(r => `<th class="sm" style="background:#f2f2f2;font-weight:400">${esc(r[1] || '')}</th>`).join('')}</tr>`;
      const rows = (f.rows || []).map((r, di) => tr([{ t: r[0], c: 'k' }].concat(per.map((p, i) => (String(r[i + 1] || '').trim() ? { t: r[i + 1], c: 'sm' } : { t: '', c: 'gr' })))));
      return { title: 'جدول الحراسة اليومية للتلاميذ', sign: SB.sign(s, { right: '', left: 'توقيع السيد رئيس المؤسسة' }), blocks: [tbl(head, rows, 'big')] };
    }
  });

  /* 12 — برنامج عمل المدير */
  const MONTHS = Dx.MONTHS;
  function genDirector(f) {
    const U = unitNames().filter(n => !/مركزي/.test(n)); if (!U.length) return [];
    const rows = []; let d = new Date(f.from + 'T12:00:00'); const end = new Date(f.to + 'T12:00:00'); const wd = +f.wd;
    if (isNaN(d) || isNaN(end)) return [];
    while (d.getDay() !== wd) d.setDate(d.getDate() + 1);
    const cnt = {}; let i = 0;
    while (d <= end) { const iso = Dx.isoOf(d), mk = iso.slice(0, 7); cnt[mk] = (cnt[mk] || 0) + 1; rows.push([iso, String(cnt[mk]), 'فرعية ' + shortUnit(U[i % U.length]), '']); i++; d.setDate(d.getDate() + 7); }
    return rows;
  }
  add({
    k: 'director', noSec: true, t: 'برنامج عمل المدير (الزيارات الميدانية للفرعيات)', grp: 'a', d: 'برنامج زيارة الفرعيات أسبوعا بأسبوع خلال الأسدوس.', auto: 'الوحدات المدرسية',
    init: (s, sy) => { const o = { sem: 'الأسدس الثاني', from: `${MK.syStart(sy) + 1}-02-01`, to: `${MK.syStart(sy) + 1}-06-30`, wd: '3', rest: 'الثلاثاء صباحا — الخميس مساء' }; o.rows = genDirector(o); return o; },
    defs: f => [{ k: 'sem', l: 'الأسدس', half: true }, { k: 'rest', l: 'أنصاف أيام الراحة', half: true }, { k: 'from', l: 'من', t: 'date', half: true }, { k: 'to', l: 'إلى', t: 'date', half: true },
      { k: 'wd', l: 'يوم الزيارة', t: 'select', half: true, opts: [['1', 'الاثنين'], ['2', 'الثلاثاء'], ['3', 'الأربعاء'], ['4', 'الخميس'], ['5', 'الجمعة'], ['6', 'السبت']] },
      { t: 'html', half: true, html: `<label>&nbsp;</label><button type="button" class="btn sm pri" data-act="gen">توليد البرنامج (تناوب الفرعيات)</button>` },
      gridDef('rows', 'الزيارات', ['التاريخ', 'الأسبوع', 'الفرعية (صباحا)', 'الفرعية (مساء)'], { widths: ['1fr', '.6fr', '1.4fr', '1.4fr'], types: ['date', 'text', 'text', 'text'], list: [null, null, 'k2Units', 'k2Units'] })],
    act: { gen: (f, sy, c) => { if (!unitNames().filter(n => !/مركزي/.test(n)).length) { c.toast('لا توجد وحدات فرعية. أضف الوحدات من «التعريف بالمؤسسة».', true); return; } f.rows = genDirector(f); c.save('rows'); } },
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => r[0]);
      const g = rowspanGroups(R, r => r[0].slice(0, 7));
      const head = `<tr><th rowspan="2" class="d">أنصاف أيام الراحة</th><th colspan="2" class="d">الفرعيات المقصودة</th><th rowspan="2" class="d">التاريخ</th><th rowspan="2" class="d">الأسابيع</th><th rowspan="2" class="d">الشهور</th></tr><tr><th>مساء</th><th>صباحا</th></tr>`;
      const rows = g.map(({ it: r, first, span }, i) => tr((i === 0 ? [{ t: f.rest, c: 'k', r: g.length }] : []).concat([{ t: r[3] }, { t: r[2], c: 'b' }, fd(r[0]), r[1]]).concat(first ? [{ t: MONTHS[+r[0].slice(5, 7) - 1], c: 'k', r: span }] : [])));
      return { title: `برنامج عمل المدير: ${esc(f.sem)} الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, sign: SIGN(s), blocks: [tbl(head, rows, 'cmp')] };
    }
  });

  /* 13 — مكاتب التعاونيات */
  const coopDefault = sy => teachers().concat(assigned()).map(e => {
    const ds = levelDigits(e); const arr = window.Pupils ? Pupils.current(sy) : [];
    const c = window.Pupils && ds.length ? Pupils.cnt(arr, p => ds.some(d => p.lvl === 'P' + d) && (!e.unit || sameU(p.unit, e.unit))) : { m: '', f: '' };
    return [fullName(e), ds.join('+'), String(c.m), String(c.f), '', '', ''];
  });
  add({
    k: 'coopOffices', noSec: true, t: 'أعضاء مكاتب التعاونيات الفصلية والتعاونية المدرسية', grp: 'a', d: 'مكتب تعاونية كل قسم (رئيس، كاتب، أمين) ومكتب التعاونية المدرسية.', auto: 'الأساتذة والمستويات وأعداد التلاميذ',
    init: (s, sy) => ({ classes: coopDefault(sy), office: [['الرئيس', '', '', ''], ['نائبه', '', '', ''], ['الكاتب', '', '', ''], ['نائبه', '', '', ''], ['الأمين', '', '', ''], ['نائبه', '', '', ''], ['مستشار', '', '', ''], ['مستشار', '', '', ''], ['مستشار', '', '', '']] }),
    defs: () => [gridDef('classes', 'مكاتب تعاونيات الأقسام', ['الأستاذ(ة)', 'المستوى', 'ذ', 'إ', 'الرئيس', 'الكاتب', 'الأمين'], { widths: ['1.5fr', '.7fr', '.5fr', '.5fr', '1.1fr', '1.1fr', '1.1fr'], list: ['k2Emps', null, null, null, 'k2Pupils', 'k2Pupils', 'k2Pupils'] }),
      gridDef('office', 'مكتب التعاونية المدرسية (تلاميذ)', ['المهمة', 'الاسم الكامل', 'المستوى', 'الوحدة'], { widths: ['.8fr', '1.5fr', '1fr', '1fr'], list: [null, 'k2People', null, 'k2Units'], link: { src: 'any', n: 1, cols: { lvl: 2, unit: 3 } } })],
    build: (s, f) => {
      const t1 = tbl(`<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">الأستاذ(ة)</th><th rowspan="2" class="d">المستوى الدراسي</th><th colspan="2" class="d">عدد التلاميذ</th><th colspan="3" class="d">أعضاء مكتب تعاونية القسم</th></tr><tr><th>ذ</th><th>إ</th><th>الرئيس</th><th>الكاتب</th><th>الأمين</th></tr>`,
        f.classes.filter(r => String(r[0] || '').trim()).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, r[1], r[2], r[3], { t: r[4], c: 'sm' }, { t: r[5], c: 'sm' }, { t: r[6], c: 'sm' }])), 'cmp');
      const t2 = tbl(thr(['المهمة', 'الاسم الكامل', 'المستوى', 'الوحدة'].map(t => ({ t, c: 'd' }))), f.office.map(r => tr([{ t: r[0], c: 'k b' }, r[1], r[2], r[3]])), 'cmp');
      return { title: 'أعضاء مكاتب التعاونيات الفصلية والتعاونية المدرسية', sign: SB.sign(s, { right: '', left: 'توقيع السيد مدير المؤسسة' }), blocks: [SB.cap('أعضاء مكتب تعاونية القسم'), t1, SB.cap('أعضاء مكتب التعاونية المدرسية'), t2] };
    }
  });


  /* 12 — وثائق مستوردة من أقسام أخرى للبرنامج (الغياب والرخص، سجل غياب التلاميذ، العطل، الأنشطة، التتبع، الاشتراكات) */
  const syTxt = sy => esc(MK.syDash(sy).replace('-', '/'));
  const sy0 = sy => +String(sy).slice(0, 4);
  const noData = (title, msg) => ({ title, blocks: [`<p class="sb-p" style="text-align:center;margin-top:20mm">${msg}</p>`] });
  const imp = d => add(Object.assign({ grp: 'c', init: () => ({}) }, d));
  const numCell = (v, c) => ({ t: v === 0 || v ? v : '', c: c || '' });

  imp({
    k: 'x_staffAbs', t: 'حصيلة غياب الأطر (الرخص والغياب)', d: 'عدد حالات الغياب وأيامه لكل موظف(ة) مع التفصيل حسب السبب.', auto: 'خانة «الرخص والغياب» (كل الأسباب المسجلة)',
    init: (s, sy) => ({ from: `${sy0(sy)}-09-01`, to: `${sy0(sy) + 1}-08-31` }),
    defs: () => [{ note: 'تُحسب هذه الوثيقة تلقائيا من خانة «الرخص والغياب» (غياب، رخص مرضية، ولادة، استثنائية، تكليف بمهمة…). غيّر الفترة لإحصاء شهر أو أسدس.' },
      { k: 'from', l: 'من', t: 'date', half: true }, { k: 'to', l: 'إلى', t: 'date', half: true }],
    build: (s, f, sy) => {
      const from = f.from || `${sy0(sy)}-09-01`, to = f.to || `${sy0(sy) + 1}-08-31`, by = new Map();
      absenceEntries().forEach(a => {
        const o = overlap(a.from, a.to, from, to); if (!o) return;
        const e = empById(a.rec.empId) || {}, key = a.rec.empId || recName(a.rec), why = a.reason || 'غياب';
        const r = by.get(key) || { name: recName(a.rec), unit: e.unit || '', n: 0, days: 0, why: {} };
        r.n++; r.days += o.days; r.why[why] = (r.why[why] || 0) + o.days; by.set(key, r);
      });
      const L = Array.from(by.values()).sort((p, q) => p.name.localeCompare(q.name, 'ar'));
      const title = `حصيلة غياب الأطر من ${fmtDate(from)} إلى ${fmtDate(to)}`;
      if (!L.length) return noData(title, 'لا يوجد غياب مسجل خلال هذه الفترة في خانة «الرخص والغياب».');
      const rows = L.map((r, i) => tr([{ t: i + 1, c: 'gr' }, { t: r.name, c: 'b r' }, { t: shortUnit(r.unit), c: 'sm' }, r.n, { t: r.days, c: 'y' },
        { t: Object.entries(r.why).map(([k, v]) => `${k} (${v})`).join('، '), c: 'sm r' }]));
      rows.push(tr([{ t: 'المجموع', s: 3, c: 'd b' }, { t: L.reduce((a, r) => a + r.n, 0), c: 's' }, { t: L.reduce((a, r) => a + r.days, 0), c: 'g' }, { t: '', c: 'd' }]));
      return { title, sign: SIGN(s), blocks: [tbl(hdrs(['ر.ت', 'الاسم الكامل', 'الوحدة', 'عدد الحالات', 'مجموع الأيام', 'التفصيل حسب السبب (الأيام)'], 'd'), rows, 'cmp')] };
    }
  });

  imp({
    k: 'x_pupAbs', t: 'حصيلة غياب التلاميذ الشهرية (سجل الغياب)', d: 'غياب كل قسم شهرا بشهر (حصص الغياب المبرر وغير المبرر).', auto: 'سجل غياب التلاميذ',
    defs: () => [{ note: 'تُحسب هذه الوثيقة تلقائيا من «سجل غياب التلاميذ». الأرقام بالحصص (' + (secLvl() ? '8 حصص في اليوم' : 'فترتان في اليوم') + ') والمجموع هو الغياب المبرر وغير المبرر.' }],
    build: (s, f, sy) => {
      const title = `حصيلة غياب التلاميذ برسم الموسم الدراسي ${syTxt(sy)}`;
      if (!window.AbsReg) return noData(title, 'سجل غياب التلاميذ غير متوفر.');
      const cl = AbsReg.classes(sy), y = sy0(sy);
      if (!cl.length) return noData(title, 'لا توجد لوائح تلاميذ لهذا الموسم. استورد لوائح مسار من «بطاقة التلاميذ» ثم سجّل الغياب.');
      const yms = [9, 10, 11, 12, 1, 2, 3, 4, 5, 6].map(m => `${m >= 9 ? y : y + 1}-${String(m).padStart(2, '0')}`);
      const data = cl.map(c => ({ c, n: AbsReg.pupilsOf(sy, c).length, m: yms.map(ym => { const st = AbsReg.monthStats(sy, c, ym); return { open: st.openDays, v: st.rows.reduce((t, o) => t + o.a + o.j, 0) }; }) }));
      const keep = yms.map((ym, i) => data.some(d => d.m[i].open > 0 || d.m[i].v > 0));
      if (!keep.some(Boolean)) return noData(title, 'لا يوجد غياب مسجل بعد في «سجل غياب التلاميذ».');
      const cols = yms.map((ym, i) => i).filter(i => keep[i]);
      const head = thr([{ t: 'القسم', c: 'd' }, { t: 'التلاميذ', c: 'd' }].concat(cols.map(i => ({ t: Dx.MONTHS[+yms[i].slice(5) - 1], c: 'd' }))).concat([{ t: 'المجموع', c: 'd' }]));
      const rows = data.map(d => { const tot = cols.reduce((t, i) => t + d.m[i].v, 0); return tr([{ t: d.c, c: 'k' }, d.n].concat(cols.map(i => (d.m[i].open ? d.m[i].v : { t: '', c: 'gr' }))).concat([{ t: tot, c: 'y' }])); });
      const colTot = cols.map(i => data.reduce((t, d) => t + d.m[i].v, 0));
      rows.push(tr([{ t: 'المجموع', c: 'd b' }, { t: data.reduce((t, d) => t + d.n, 0), c: 's' }].concat(colTot.map(v => ({ t: v, c: 's' }))).concat([{ t: colTot.reduce((a, b) => a + b, 0), c: 'g' }])));
      return { title, sign: SIGN(s), blocks: [tbl(head, rows, 'cmp')] };
    }
  });

  imp({
    k: 'x_holidays', t: 'العطل المدرسية والتقويم الدراسي', d: 'الفترات البينية والعطل الرسمية للموسم الدراسي.', auto: 'خانة «العطل المدرسية» في الإعدادات',
    defs: () => [{ note: 'تُجلب العطل من «العطل المدرسية» (الإعدادات)، ويمكن تعديل اللائحة هناك.' }],
    build: (s, f, sy) => {
      const title = `العطل المدرسية برسم الموسم الدراسي ${syTxt(sy)}`;
      if (!window.Holidays) return noData(title, 'لائحة العطل غير متوفرة.');
      Holidays.migrate(DB);
      const L = Holidays.forSy(String(sy).replace('-', '/'));
      if (!L.length) return noData(title, 'لا توجد عطل مسجلة لهذا الموسم. أضفها من «العطل المدرسية» في الإعدادات.');
      return { title, sign: SIGN(s), blocks: [tbl(hdrs(['ر.ت', 'العطلة', 'التاريخ', 'المدة (أيام)'], 'd'), L.map((h, i) => tr([{ t: i + 1, c: 'gr' }, { t: h.name, c: 'b r' }, { t: h.when || fmtDate(h.from), c: 'sm' }, { t: h.days || '', c: 'y' }])), 'cmp')] };
    }
  });

  imp({
    k: 'x_events', t: 'الأنشطة والاحتفالات المنجزة بالمؤسسة', d: 'قائمة الأنشطة التي أُنجزت بطاقاتها التقنية مع تاريخها والفئة المستهدفة.', auto: 'البطائق التقنية للأنشطة والاحتفالات (الميزانية ← الأنشطة)',
    defs: () => [{ note: 'تُجلب من البطائق التقنية المنجزة في خانة «الاحتفالات والأنشطة المنجزة».' }],
    build: (s, f, sy) => {
      const title = `الأنشطة والاحتفالات المنجزة برسم الموسم الدراسي ${syTxt(sy)}`;
      const D = window.Events ? Events.done(sy) : [];
      if (!D.length) return noData(title, 'لم تُنجز بعد أي بطاقة تقنية. ابدأ من «الميزانية ← الاحتفالات والأنشطة المنجزة».');
      const rows = D.slice().sort((p, q) => String(p.f.date || '9').localeCompare(String(q.f.date || '9')))
        .map((x, i) => tr([{ t: i + 1, c: 'gr' }, { t: x.f.title || x.c.name, c: 'b r' }, { t: x.f.date ? fmtDate(x.f.date) : (x.f.period || ''), c: 'sm' }, { t: x.f.target || '', c: 'sm' }, { t: x.f.sup || '', c: 'sm' }]));
      return { title, sign: SIGN(s), blocks: [tbl(hdrs(['ر.ت', 'النشاط', 'التاريخ', 'الفئة المستهدفة', 'المشرف'], 'd'), rows, 'cmp')] };
    }
  });

  imp({
    k: 'x_track', t: 'نسبة إنجاز شبكات تتبع العمل التربوي', d: 'تقدم كل شبكة تتبع (عدد الأساتذة والمهام ونسبة الإنجاز).', auto: 'شبكات «تتبع العمل التربوي» (الوثائق)',
    defs: () => [{ note: 'تُحسب من شبكات «شبكة تتبع العمل التربوي بالمؤسسة»: كل مهمة منجزة تُحتسب في نسبة الإنجاز.' }],
    build: (s, f, sy) => {
      const title = `نسبة إنجاز شبكات تتبع العمل التربوي برسم الموسم الدراسي ${syTxt(sy)}`;
      const G = window.Track ? Track.grids(sy).filter(g => g.rows && g.cols) : [];
      if (!G.length) return noData(title, 'لا توجد شبكات تتبع. أنشئها من «الوثائق ← شبكة تتبع العمل التربوي».');
      const rows = G.map((g, i) => tr([{ t: i + 1, c: 'gr' }, { t: `${g.title || 'شبكة التتبع'} ${g.period || ''}`.trim(), c: 'b r' }, g.rows.length, g.cols.length, { t: `${Track.progress(g)}%`, c: 'y' }]));
      return { title, sign: SIGN(s), blocks: [tbl(hdrs(['ر.ت', 'الشبكة', 'الأساتذة', 'المهام', 'نسبة الإنجاز'], 'd'), rows, 'cmp')] };
    }
  });

  imp({
    k: 'x_dues', t: 'حصيلة الاشتراكات والتسجيل (التأمين، التعاونية، الجمعية الرياضية)', d: 'عدد المنخرطين ومبالغ الاشتراكات حسب نوع الاشتراك.', auto: 'خانة «الاشتراكات والتسجيل»',
    defs: () => [{ note: 'تُحسب من خانة «الاشتراكات والتسجيل»: عدد التلاميذ الذين أدّوا كل اشتراك ومجموع المبالغ المستخلصة.' }],
    build: (s, f, sy) => {
      const title = `حصيلة الاشتراكات برسم الموسم الدراسي ${syTxt(sy)}`;
      const arr = window.Pupils ? Pupils.current(sy) : [];
      if (!arr.length || !window.Dues) return noData(title, 'لا توجد لوائح تلاميذ لهذا الموسم. استورد لوائح مسار من «بطاقة التلاميذ».');
      const st = Dues.stats(sy, arr), LB = { ins: 'التأمين المدرسي', coop: 'التعاونية المدرسية', sport: 'الجمعية الرياضية المدرسية' };
      const keys = Object.keys(st).filter(k => st[k].tot > 0);
      const rows = keys.map((k, i) => tr([{ t: LB[k] || k, c: 'k' }, st[k].tot, { t: st[k].n, c: 'y' }, `${st[k].tot ? Math.round(st[k].n * 100 / st[k].tot) : 0}%`, { t: Math.round(st[k].sum * 100) / 100, c: 'ltr y' }]));
      return { title, sign: SIGN(s), blocks: [tbl(hdrs(['نوع الاشتراك', 'التلاميذ المعنيون', 'المنخرطون', 'النسبة', 'المبلغ المستخلص (درهم)'], 'd'), rows, 'cmp')] };
    }
  });

  const SUBG = { intro: 'a1', massar: 'a1', director: 'a1', supervision: 'a1', hours: 'a2', scoring: 'a2', staff: 'a2', assoc: 'a3', councilComp: 'a3', vigil: 'a3', coopOffices: 'a3' };
  const subg = () => DOCS.forEach(d => { if (d.grp === 'a') d.grp = SUBG[d.k] || 'a1'; });   // also the documents added by other modules (decree, organisation)
  const C = K.center({
    id: 'board', title: 'السبورة المرجعية', icon: '📋', route: 'boardDoc', hubRoute: 'board',
    // 1.9.4: sub-headings (tabs) of the reference board
    groups: [['a1', 'التعريف بالمؤسسة والتنظيم التربوي', 'تُملأ تلقائيا من الإعدادات'], ['a2', 'الأطر والعاملون بالمؤسسة', 'تُملأ تلقائيا من لوائح الموظفين'], ['a3', 'الجمعيات والمجالس والخلايا'], ['b', 'إحصائيات التلاميذ', 'تُحسب من بطاقة التلاميذ'], ['c', 'وثائق مستوردة من أقسام البرنامج', 'الغياب والرخص، سجل غياب التلاميذ، العطل، الأنشطة، التتبع، الاشتراكات']],
    intro: 'وثائق السبورة المرجعية للمؤسسة بنفس التصميم والألوان، والترويسة ممتدة على عرض الصفحة من اليمين إلى اليسار. تُملأ البيانات تلقائيا من لائحة الموظفين ولوائح التلاميذ، ويمكنك تعديل أي خانة ثم الطباعة أو حفظ الملف PDF.',
    docs: () => (subg(), DOCS.filter(d => !(d.noSec && secNow()))), store: sy => store(sy), groupTabs: true
  });
  window.Board = { migrate, units, unitNames, members, defaultBureau, ASSOC, teachers, assigned, admins, preschool, director, levelDigits, jobOf, shortUnit, sameU, store, DOCS: () => DOCS,
    summary: () => ({ docs: DOCS.length }) };
  window.pageBoard = (v, a) => { migrate(DB); C.hub(v, a); };
  window.pageBoardDoc = (v, a) => { migrate(DB); C.doc(v, a); };
})();
