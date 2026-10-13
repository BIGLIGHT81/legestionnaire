'use strict';
/* 1.9.3 — الميزانية ← «السجلات» الرسمية لجمعية دعم مدرسة النجاح والجمعية الرياضية المدرسية والتعاونية المدرسية:
   سجل الأعضاء/المنخرطين، سجل محاضر الاجتماعات، سجل الجرد (الممتلكات والعتاد)، سجل الوارد والصادر، سجل الأنشطة المنجزة، وسجل الصندوق (للجمعية الرياضية والتعاونية؛
   لجمعية دعم النجاح سجلا البنك والصندوق موجودان في وثائقها). تُملأ تلقائيا ما أمكن: المكتب من السبورة المرجعية، المنخرطون والمؤدون من «الاشتراكات والتسجيل»،
   الصندوق من معطيات الهيأة ودفاتر مصاريفها، الأنشطة من «الاحتفالات والأنشطة المنجزة»، والمراسلات من وثائق الهيأة. */
(function () {
  const B = window.Budget;
  const { esc } = window.Docs;
  const { SB, tr, num, r2, ldate } = window.K;
  const { dh, m2, kv, hd, gridDef, blankRows } = B;
  const nm = t => String(t == null ? '' : t).trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const hasBoard = () => !!window.Board;
  const sortByDate = (a, b) => String(a.d || '9999').localeCompare(String(b.d || '9999'));

  // a table with fixed column widths (percentages)
  const tblw = (head, rows, widths, cls) => ({ table: { cls: 'sb-t ' + (cls || 'cmp'), head, rows, colgroup: `<colgroup>${widths.map(w => `<col style="width:${w}%">`).join('')}</colgroup>` } });
  const blank = (n, w) => Array.from({ length: n }, () => tr(Array.from({ length: w }, () => ({ t: '', st: 'height:8mm' }))));
  const pad = (rows, min, w) => { const out = rows.slice(); for (let i = rows.length; i < min; i++) out.push(blank(1, w)[0]); return out; };

  /* ---------- the three bodies ---------- */
  const A = {
    nj: { pre: 'nj', board: 'najah', name: 'جمعية دعم مدرسة النجاح', grp: 'rg_nj', sign: s => SB.sign(s, { three: ['أمين مال الجمعية', 'رئيس الجمعية', 'رئيس المؤسسة'] }) },
    sp: { pre: 'sp', board: 'sport', name: 'الجمعية الرياضية المدرسية', grp: 'rg_sp', sign: s => SB.sign(s, { right: 'توقيع الأمين', left: 'توقيع وخاتم رئيس الجمعية الرياضية' }) },
    cp: { pre: 'cp', board: 'coop', name: 'التعاونية المدرسية', grp: 'rg_cp', sign: s => SB.sign(s, { right: 'إمضاء منسق(ة) التعاونية', left: 'إمضاء رئيس المؤسسة' }) }
  };
  const DOCS = [];
  const add = d => DOCS.push(d);
  const title = (a, sy) => `${a.name} — الموسم الدراسي ${syText(sy)}`;

  /* ---------- 1. register of members / bureau ---------- */
  Object.values(A).forEach(a => add({
    k: `rg_${a.pre}_bureau`, t: `سجل أعضاء ${a.name} ومنخرطيها`, grp: a.grp, d: 'يُدرج أعضاء المكتب تلقائيا من السبورة المرجعية، وتُضاف هنا بقية الأعضاء والمنخرطين بتاريخ انخراطهم وواجبه ورقم وصله.', auto: 'مكتب الهيأة (السبورة المرجعية)', page: 'a4l',
    init: () => ({ rows: [['', '', '', '', '', '', '', ''], ['', '', '', '', '', '', '', '']] }),
    defs: () => [{ note: 'أعضاء المكتب يظهرون تلقائيا من «السبورة المرجعية ← مكاتب الجمعيات». أضف هنا الأعضاء المنخرطين الآخرين فقط (الاسم، الصفة، الإطار، ب.ت.و، الهاتف، تاريخ الانخراط، الواجب، رقم الوصل).' },
      gridDef('rows', 'منخرطون آخرون', ['الاسم الكامل', 'الصفة', 'الإطار / الوظيفة', 'رقم ب.ت.و', 'الهاتف', 'تاريخ الانخراط', 'واجب الانخراط', 'رقم الوصل'], { widths: ['1.6fr', '.9fr', '1fr', '.8fr', '.9fr', '.9fr', '.7fr', '.7fr'], types: ['text', 'text', 'text', 'text', 'text', 'date', 'num', 'text'], dirs: [null, null, null, 'ltr', 'ltr', null, null, 'ltr'] })],
    build: (s, f, sy) => {
      const mem = (hasBoard() ? Board.members(sy, a.board) : []).filter(r => nm(r[0]));
      const rows = mem.map(r => [0, { t: r[0], c: 'r b' }, { t: r[2], c: 'sm' }, { t: r[1], c: 'sm' }, { t: r[4], c: 'ltr' }, { t: r[5], c: 'ltr' }, '', '', '', '']);
      (f.rows || []).filter(r => nm(r[0])).forEach(r => rows.push([0, { t: r[0], c: 'r b' }, { t: r[1], c: 'sm' }, { t: r[2], c: 'sm' }, { t: r[3], c: 'ltr' }, { t: r[4], c: 'ltr' }, r[5] ? ldate(r[5]) : '', { t: num(r[6]) ? m2(num(r[6])) : '', c: 'ltr' }, { t: r[7], c: 'ltr' }, '']));
      return { title: `سجل أعضاء ${a.name} ومنخرطيها`, sub: title(a, sy), page: 'a4l', sign: a.sign(s),
        blocks: [tblw(hd(['ر.ت', 'الاسم الكامل', 'الصفة', 'الإطار / الوظيفة', 'رقم ب.ت.و', 'الهاتف', 'تاريخ الانخراط', 'واجب الانخراط', 'رقم الوصل', 'التوقيع']), numbered(rows, 10, 10), [4, 20, 10, 12, 9, 9, 9, 7, 7, 13])] };
    }
  }));
  // number the rows (first cell) and add blank lines up to a minimum
  function numbered(rows, min, w) {
    const out = rows.map((cells, i) => tr([{ t: String(i + 1) }].concat(cells.slice(1))));
    for (let i = out.length; i < min; i++) out.push(tr(Array.from({ length: w }, (_, j) => ({ t: j === 0 ? String(i + 1) : '', st: 'height:8mm' }))));
    return out;
  }

  /* ---------- 2. register of subscribers (sport + cooperative) — linked to «الاشتراكات والتسجيل» ---------- */
  [['sp', 'sport', 'سجل المنخرطين في الجمعية الرياضية المدرسية'], ['cp', 'coop', 'سجل المنخرطين في التعاونية المدرسية']].forEach(([pre, item, ttl]) => {
    const a = A[pre];
    add({
      k: `rg_${pre}_subs`, t: ttl, grp: a.grp, d: 'يُملأ تلقائيا من «الاشتراكات والتسجيل»: التلاميذ المؤدون للانخراط مع المبلغ وتاريخ الأداء ورقم الوصل، حسب القسم.', auto: 'الاشتراكات والتسجيل ولوائح التلاميذ', page: 'a4',
      init: () => ({ unit: '', mode: 'المنخرطون المؤدون فقط' }),
      defs: () => [{ note: 'يُؤخذ من لائحة التلاميذ الحاليين وما سُجل في «الاشتراكات والتسجيل». لتسجيل أداء تلميذ افتح تلك الخانة.' }, ...(window.Cyc && Cyc.isSec() ? [] : [{ k: 'unit', l: 'الوحدة المدرسية (فارغ = كل الوحدات)', list: 'k2Units' }]), { k: 'mode', l: 'المعروض', t: 'select', opts: ['المنخرطون المؤدون فقط', 'كل التلاميذ (مع خانة الأداء)'] }],
      build: (s, f, sy) => {
        const all = window.Pupils ? Pupils.current(sy) : [];
        const dues = window.Dues;
        const stageOk = p => item !== 'coop' || /^P\d/.test(String(p.lvl || ''));
        let L = all.filter(p => stageOk(p) && (!nm(f.unit) || (window.Board ? Board.sameU(p.unit, f.unit) : p.unit === f.unit)));
        L = L.slice().sort((x, y) => String(x.cls || '').localeCompare(String(y.cls || ''), 'fr', { numeric: true }) || `${x.last} ${x.first}`.localeCompare(`${y.last} ${y.first}`, 'ar'));
        const onlyPaid = !/كل التلاميذ/.test(nm(f.mode));
        const P = L.map(p => ({ p, r: dues ? dues.paid(sy, p, item) : null }));
        const shown = onlyPaid ? P.filter(x => x.r) : P;
        const sum = r2(P.reduce((t, x) => t + (x.r ? num(x.r.a) : 0), 0)), n = P.filter(x => x.r).length;
        const rows = shown.map((x, i) => tr([i + 1, { t: x.p.code || '', c: 'ltr sm' }, { t: `${x.p.last || ''} ${x.p.first || ''}`.trim(), c: 'r b' }, { t: x.p.cls || '', c: 'sm' }, x.r ? (x.r.d ? ldate(x.r.d) : '') : '', { t: x.r && num(x.r.a) ? m2(num(x.r.a)) : '', c: 'ltr' }, { t: x.r && x.r.n ? x.r.n : '', c: 'ltr' }, '']));
        rows.push(tr([{ t: `المجموع: ${n} منخرطا من أصل ${P.length} تلميذا`, s: 5, c: 'd b' }, { t: m2(sum), c: 'd b ltr' }, { t: '', c: 'd', s: 2 }]));
        return { title: ttl, sub: title(a, sy) + (nm(f.unit) ? ' — ' + f.unit : ''), page: 'a4', sign: a.sign(s),
          blocks: [tblw(hd(['ر.ت', 'رمز مسار', 'الاسم الكامل', 'القسم', 'تاريخ الأداء', 'المبلغ', 'رقم الوصل', 'التوقيع']), rows, [5, 13, 28, 10, 13, 10, 10, 11], 'cmp')] };
      }
    });
  });

  /* ---------- 3. cash register (sport + cooperative) ---------- */
  const expLines = (prefix, labels, sy) => {
    const out = [];
    labels.forEach((lab, i) => (B.rowsOf(prefix + (i + 1), sy) || []).forEach(r => { if (r[0] || nm(r[1]) || num(r[2])) out.push({ d: r[0] || '', t: nm(r[1]), lab, a: num(r[2]) }); }));
    return out.sort(sortByDate);
  };
  const cashBlocks = (carry, carryLabel, incomes, exps) => {
    let bal = carry;
    const rows = [tr([{ t: carryLabel, s: 6, c: 'r b' }, { t: m2(bal), c: 'ltr b' }])];
    let n = 0, tin = 0, tout = 0;
    incomes.forEach(r => { bal = r2(bal + r.a); tin = r2(tin + r.a); rows.push(tr([++n, r.d ? ldate(r.d) : '', { t: r.t, c: 'r' }, { t: r.lab || '', c: 'sm' }, { t: m2(r.a), c: 'ltr' }, '', { t: m2(bal), c: 'ltr b' }])); });
    exps.forEach(r => { bal = r2(bal - r.a); tout = r2(tout + r.a); rows.push(tr([++n, r.d ? ldate(r.d) : '', { t: r.t, c: 'r' }, { t: r.lab || '', c: 'sm' }, '', { t: m2(r.a), c: 'ltr' }, { t: m2(bal), c: 'ltr b' }])); });
    rows.push(tr([{ t: 'المجموع', s: 4, c: 'd b' }, { t: m2(tin), c: 'd b ltr' }, { t: m2(tout), c: 'd b ltr' }, { t: m2(bal), c: 'd b ltr' }]));
    return { rows, bal };
  };
  const cashHead = hd(['ر.ت', 'التاريخ', 'البيان', 'المجال', 'مداخيل', 'مصاريف', 'الرصيد']);
  add({
    k: 'rg_sp_cash', t: 'سجل الصندوق للجمعية الرياضية المدرسية', grp: A.sp.grp, d: 'الرصيد المنقول ثم حصة الجمعية من الاشتراكات ثم عمليات الصرف من دفاتر المصاريف السبعة مرتبة بالتاريخ، مع الرصيد التراكمي.', auto: 'معطيات الجمعية الرياضية ودفاتر مصاريفها', page: 'a4l',
    init: () => ({}), defs: () => [{ note: 'يُحسب تلقائيا من «معطيات الجمعية الرياضية» ودفاتر المصاريف.' }],
    build: (s, f, sy) => {
      const c = window.Sport.calc(sy);
      const inc = c.mine ? [{ d: '', t: 'حصة الجمعية من واجب الاشتراك السنوي', lab: 'الاشتراكات', a: c.mine }] : [];
      const x = cashBlocks(c.carry, 'الرصيد المنقول من السنة الماضية', inc, expLines('sp_r', c.regs.map(r => r.n), sy));
      return { title: 'سجل الصندوق', sub: title(A.sp, sy), page: 'a4l', sign: A.sp.sign(s), blocks: [tblw(cashHead, pad(x.rows.slice(0, -1), 9, 7).concat(x.rows.slice(-1)), [5, 12, 36, 18, 10, 10, 9])] };
    }
  });
  add({
    k: 'rg_cp_cash', t: 'سجل الصندوق للتعاونية المدرسية', grp: A.cp.grp, d: 'الرصيد المنقول ثم حصة المؤسسة من الانخراطات ثم عمليات الصرف من دفاتر المجالات مرتبة بالتاريخ، مع الرصيد التراكمي.', auto: 'معطيات التعاونية ودفاتر مصاريفها', page: 'a4l',
    init: () => ({}), defs: () => [{ note: 'يُحسب تلقائيا من «معطيات التعاونية» ودفاتر المصاريف. الحساب البريدي يتتبع في بطاقة التتبع.' }],
    build: (s, f, sy) => {
      const c = window.Coop.calc(sy);
      const inc = c.rows.filter(r => r.sc).map(r => ({ d: '', t: 'حصة المؤسسة من ' + r.name, lab: 'الانخراطات', a: r.sc }));
      const x = cashBlocks(c.carryCash, 'الرصيد المنقول بالصندوق من السنة الماضية', inc, expLines('cp_r', c.doms.map(d => d.n), sy));
      return { title: 'سجل الصندوق', sub: title(A.cp, sy), page: 'a4l', sign: A.cp.sign(s), blocks: [tblw(cashHead, pad(x.rows.slice(0, -1), 9, 7).concat(x.rows.slice(-1)), [5, 12, 36, 18, 10, 10, 9])] };
    }
  });

  /* ---------- 4. minutes register ---------- */
  const MEET = ['اجتماع المكتب', 'الجمع العام التأسيسي', 'الجمع العام العادي', 'الجمع العام الاستثنائي', 'اجتماع لجنة البت', 'اجتماع تجديد المكتب'];
  Object.values(A).forEach(a => add({
    k: `rg_${a.pre}_minutes`, t: 'سجل محاضر الاجتماعات', grp: a.grp, d: 'رقم المحضر وتاريخه ونوع الاجتماع وجدول أعماله وقراراته وعدد الحاضرين.', auto: 'تُسجل المحاضر هنا بالتتابع', page: 'a4l',
    init: () => ({ rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']] }),
    defs: () => [{ note: 'سجّل كل اجتماع بالتتابع. الأرقام تُحتسب تلقائيا.' }, gridDef('rows', 'الاجتماعات', ['التاريخ', 'نوع الاجتماع', 'جدول الأعمال', 'أهم القرارات والتوصيات', 'عدد الحاضرين'], { widths: ['.9fr', '1.1fr', '2fr', '2.2fr', '.6fr'], types: ['date', 'text', 'text', 'text', 'num'], list: [null, `rg_meet`, null, null, null], dls: { rg_meet: MEET } })],
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => r[0] || nm(r[1]) || nm(r[2]) || nm(r[3]));
      const rows = R.map((r, i) => [String(i + 1), r[0] ? ldate(r[0]) : '', { t: r[1], c: 'sm' }, { t: r[2], c: 'r' }, { t: r[3], c: 'r' }, r[4] || '', '']);
      return { title: 'سجل محاضر الاجتماعات', sub: title(a, sy), page: 'a4l', sign: a.sign(s),
        blocks: [tblw(hd(['رقم المحضر', 'التاريخ', 'نوع الاجتماع', 'جدول الأعمال', 'أهم القرارات والتوصيات', 'الحاضرون', 'توقيع الكاتب']), numbered(rows, 9, 7), [7, 10, 13, 25, 29, 7, 9])] };
    }
  }));

  /* ---------- 5. inventory register ---------- */
  const INV = { nj: ['حواسيب ولوازم معلوماتية', 'آلة النسخ والطابعة', 'أثاث ومعدات مكتبية', 'تجهيزات القاعة متعددة التخصصات'], sp: ['كرات القدم', 'كرات اليد', 'كرات السلة', 'كرات الطائرة', 'صفارات وميقاتيات', 'حبال وأقماع وحواجز', 'ألبسة رياضية', 'أدوات الصيدلة والإسعافات'], cp: ['لوازم مكتبية', 'ألعاب تربوية', 'كتب ومجلات', 'منتوجات التعاونية', 'أدوات الأنشطة الفنية'] };
  Object.values(A).forEach(a => add({
    k: `rg_${a.pre}_assets`, t: 'سجل الجرد (الممتلكات والعتاد)', grp: a.grp, d: 'العتاد والممتلكات: العدد وتاريخ الاقتناء ومصدره وقيمته وحالته.', auto: 'أسماء العتاد المقترحة قابلة للتعديل', page: 'a4l',
    init: () => ({ rows: INV[a.pre].map(n => [n, '', '', 'شراء', '', 'جيدة', '']).concat([['', '', '', '', '', '', '']]) }),
    defs: () => [{ note: 'أسماء العتاد المقترحة قابلة للتعديل والحذف والإضافة؛ اكتب العدد وتاريخ الاقتناء وقيمته.' }, gridDef('rows', 'العتاد والممتلكات', ['البيان', 'العدد', 'تاريخ الاقتناء', 'مصدر الاقتناء', 'القيمة (درهم)', 'الحالة', 'ملاحظات'], { widths: ['2fr', '.5fr', '.9fr', '.9fr', '.8fr', '.8fr', '1.4fr'], types: ['text', 'num', 'date', 'text', 'num', 'text', 'text'], list: [null, null, null, 'rg_src', null, 'rg_st', null], dls: { rg_src: ['شراء', 'هبة', 'تحويل', 'إنتاج'], rg_st: ['جيدة', 'متوسطة', 'متلاشية', 'مفقودة'] } })],
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => nm(r[0]));
      const tq = R.reduce((t, r) => t + num(r[1]), 0), tv = r2(R.reduce((t, r) => t + num(r[4]), 0));
      const rows = R.map((r, i) => [String(i + 1), { t: r[0], c: 'r b' }, r[1] || '', r[2] ? ldate(r[2]) : '', { t: r[3], c: 'sm' }, { t: num(r[4]) ? m2(num(r[4])) : '', c: 'ltr' }, { t: r[5], c: 'sm' }, { t: r[6], c: 'sm' }]);
      const body = numbered(rows, 9, 8);
      body.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: tq ? String(tq) : '', c: 'd b' }, { t: '', c: 'd', s: 2 }, { t: tv ? m2(tv) : '', c: 'd b ltr' }, { t: '', c: 'd', s: 2 }]));
      return { title: 'سجل الجرد', sub: title(a, sy), page: 'a4l', sign: a.sign(s),
        blocks: [tblw(hd(['ر.ت', 'البيان', 'العدد', 'تاريخ الاقتناء', 'مصدر الاقتناء', 'القيمة', 'الحالة', 'ملاحظات']), body, [5, 28, 7, 12, 11, 10, 10, 17])] };
    }
  }));

  /* ---------- 6. incoming / outgoing mail (linked to the body's own letters) ---------- */
  const autoMail = (a, sy) => {
    const out = [];
    const take = (key, label, kind) => { const f = B.F(key, sy) || {}; if (nm(f.no) || f.date) out.push({ d: f.date || '', type: kind, no: nm(f.no), who: 'المدير الإقليمي', sub: label }); };
    if (a.pre === 'sp') { take('sp_auth', 'طلب الإذن بالصرف من مداخيل الجمعية الرياضية', 'صادر'); }
    if (a.pre === 'cp') { take('cp_transfer', 'إعلام بتحويل مبلغ إلى فرع جمعية التعاون', 'صادر'); }
    if (a.pre === 'nj') { const f = B.F('nj_order', sy) || {}; if (nm(f.no) || f.date) out.push({ d: f.date || '', type: 'صادر', no: nm(f.no), who: 'الأمين', sub: 'أمر بالأداء' }); }
    return out;
  };
  Object.values(A).forEach(a => add({
    k: `rg_${a.pre}_mail`, t: 'سجل الوارد والصادر', grp: a.grp, d: 'تُسجَّل المراسلات الواردة والصادرة بأرقامها وتواريخها؛ تُدرج تلقائيا مراسلات الهيأة المسجلة في وثائقها.', auto: 'وثائق الهيأة (رقم وتاريخ الإرسال)', page: 'a4l',
    init: () => ({ rows: [['', 'وارد', '', '', '', ''], ['', 'صادر', '', '', '', '']] }),
    defs: () => [{ note: 'المراسلات التي سُجل رقمها وتاريخها في وثائق الهيأة (الطلب، الإعلام بالتحويل...) تظهر تلقائيا؛ أضف هنا البقية.' }, gridDef('rows', 'المراسلات', ['التاريخ', 'النوع', 'الرقم', 'المرسل / المرسل إليه', 'الموضوع', 'الإجراء المتخذ'], { widths: ['.9fr', '.7fr', '.7fr', '1.5fr', '2fr', '1.3fr'], types: ['date', 'text', 'text', 'text', 'text', 'text'], list: [null, 'rg_kind', null, null, null, null], dls: { rg_kind: ['وارد', 'صادر'] } })],
    build: (s, f, sy) => {
      const L = autoMail(a, sy).concat((f.rows || []).filter(r => r[0] || nm(r[2]) || nm(r[3]) || nm(r[4])).map(r => ({ d: r[0] || '', type: nm(r[1]), no: nm(r[2]), who: nm(r[3]), sub: nm(r[4]), act: nm(r[5]) }))).sort(sortByDate);
      const rows = L.map((r, i) => [String(i + 1), r.d ? ldate(r.d) : '', { t: r.type, c: 'sm' }, { t: r.no, c: 'ltr' }, { t: r.who, c: 'r' }, { t: r.sub, c: 'r' }, { t: r.act || '', c: 'sm' }]);
      return { title: 'سجل الوارد والصادر', sub: title(a, sy), page: 'a4l', sign: a.sign(s),
        blocks: [tblw(hd(['ر.ت', 'التاريخ', 'النوع', 'الرقم', 'المرسل / المرسل إليه', 'الموضوع', 'الإجراء المتخذ']), numbered(rows, 10, 7), [5, 11, 8, 9, 22, 30, 15])] };
    }
  }));

  /* ---------- 7. activities register (linked to «الاحتفالات والأنشطة المنجزة») ---------- */
  const SRC = ['حسب نوع الهيأة (تلقائي)', 'كل الأنشطة المنجزة بالمؤسسة', 'بدون أنشطة تلقائية'];
  const KIND = { sp: /رياض|دوري|مباراة|عدو|كرة|بطولة/, cp: /تعاون|نظاف|شجرة|بيئ|غرس|مجلة|ركن/, nj: null };
  Object.values(A).forEach(a => add({
    k: `rg_${a.pre}_acts`, t: 'سجل الأنشطة المنجزة', grp: a.grp, d: 'الأنشطة المنجزة بتاريخها والمستفيدين وكلفتها؛ تُدرج تلقائيا من «الاحتفالات والأنشطة المنجزة» (حسب نوع الهيأة) وتُضاف أنشطة أخرى يدويا.', auto: 'الاحتفالات والأنشطة المنجزة (الأندية التربوية)', page: 'a4l',
    init: () => ({ src: SRC[0], rows: [['', '', '', '', ''], ['', '', '', '', '']] }),
    defs: () => [{ note: 'تُؤخذ الأنشطة التي أُنجزت بطاقتها التقنية (لها فترة إنجاز) من «الميزانية ← الأندية التربوية ← الاحتفالات والأنشطة المنجزة».' }, { k: 'src', l: 'الأنشطة التلقائية', t: 'select', opts: SRC },
      gridDef('rows', 'أنشطة أخرى', ['التاريخ', 'النشاط', 'المستفيدون', 'الكلفة (درهم)', 'ملاحظات'], { widths: ['.9fr', '2.2fr', '1.2fr', '.8fr', '1.2fr'], types: ['date', 'text', 'text', 'num', 'text'] })],
    build: (s, f, sy) => {
      const mode = nm(f.src) || SRC[0];
      let auto = [];
      if (window.Events && mode !== SRC[2]) {
        auto = Events.done(sy).map(x => ({ d: x.f.date || '', per: nm(x.f.period), t: nm(x.f.title) || x.c.name, who: nm(x.f.target), c: x.c.name }))
          .filter(x => mode === SRC[1] || !KIND[a.pre] || KIND[a.pre].test(x.t + ' ' + x.c));
      }
      const L = auto.map(x => ({ d: x.d, per: x.per, t: x.t, who: x.who, cost: '', note: 'من البطاقة التقنية' }))
        .concat((f.rows || []).filter(r => r[0] || nm(r[1])).map(r => ({ d: r[0] || '', per: '', t: nm(r[1]), who: nm(r[2]), cost: num(r[3]), note: nm(r[4]) }))).sort(sortByDate);
      const rows = L.map((r, i) => [String(i + 1), r.d ? ldate(r.d) : r.per, { t: r.t, c: 'r b' }, { t: r.who, c: 'sm' }, { t: num(r.cost) ? m2(num(r.cost)) : '', c: 'ltr' }, { t: r.note, c: 'sm' }]);
      const tot = r2(L.reduce((t, r) => t + num(r.cost), 0));
      const body = numbered(rows, 9, 6);
      body.push(tr([{ t: 'المجموع', s: 4, c: 'd b' }, { t: tot ? m2(tot) : '', c: 'd b ltr' }, { t: '', c: 'd' }]));
      return { title: 'سجل الأنشطة المنجزة', sub: title(a, sy), page: 'a4l', sign: a.sign(s),
        blocks: [tblw(hd(['ر.ت', 'التاريخ / الفترة', 'النشاط', 'المستفيدون', 'الكلفة', 'ملاحظات']), body, [5, 15, 36, 18, 10, 16])] };
    }
  }));

  B.reg({
    id: 'regs',
    groups: [['rg_nj', 'جمعية دعم مدرسة النجاح — السجلات', 'سجل الأعضاء، المحاضر، الجرد، الوارد والصادر، الأنشطة (سجلا البنك والصندوق ضمن وثائق الجمعية)'],
      ['rg_sp', 'الجمعية الرياضية المدرسية — السجلات', 'سجل المنخرطين (من الاشتراكات)، الصندوق، المحاضر، الجرد، الوارد والصادر، الأنشطة'],
      ['rg_cp', 'التعاونية المدرسية (الابتدائي) — السجلات', 'سجل المنخرطين (من الاشتراكات)، الصندوق، المحاضر، الجرد، الوارد والصادر، الأنشطة']],
    docs: () => DOCS
  });
  window.AssocRegs = { docs: () => DOCS };
})();
