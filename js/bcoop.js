'use strict';
/* الميزانية ← التعاونية المدرسية: معطيات التعاونية، توزيع المداخيل (حصة الفرع/المؤسسة)، مشروع الصرف، دفاتر المصاريف الخمسة،
   التقرير المالي، بطاقة تتبع الحسابات، بيان الاشتراك، إعلام التحويل، محاضر التأسيس والتجديد، بطاقة المنسق، برنامج العمل، بطاقة الأسبوع الوطني */
(function () {
  const B = window.Budget;
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, num, r2, money, ldate, dayName } = window.K;
  const { dh, m2, kv, kv2, hd, gridDef, blankRows, sumCol } = B;

  const DOM = ['النشاط الاجتماعي', 'النشاط الثقافي', 'الإصلاح والصيانة والتجهيز', 'الورشات الفنية والتربوية', 'البستنة والتربية البيئية'];
  const DOM_PCT = [30, 20, 20, 20, 10];
  // [type, share to the directorate branch %, share to the school %] — the usual rules of the cooperative workbook (all editable)
  const INC = [['بطاقة المتعاون الصغير', '60', '40'], ['بطاقة المتعاون الكبير', '60', '40'], ['الدفتر المدرسي', '92.5', '7.5'], ['الملف المدرسي', '92.5', '7.5'], ['الصور', '40', '60'], ['مداخيل العرض الفني', '0', '100'], ['مداخيل أخرى', '0', '100']];
  const sch = () => S();
  const isSecC = () => !!(window.Cyc && Cyc.single());           // collège / lycée: one institution, no school units
  const teachers = () => (window.Board ? Board.teachers().concat(Board.assigned()) : []);
  const pupilsOf = (e, sy) => {
    if (!window.Pupils) return '';
    const ds = Board.levelDigits(e), arr = Pupils.current(sy);
    if (!ds.length || !arr.length) return '';
    return String(Pupils.cnt(arr, p => ds.some(d => p.lvl === 'P' + d) && (!e.unit || Board.sameU(p.unit, e.unit))).t);
  };

  /* ---------- the figures of the year ---------- */
  function calc(sy) {
    const f = B.F('cp_base', sy);
    const rows = (f.inc || []).filter(r => String(r[0] || '').trim()).map(r => {
      const price = num(r[1]), cnt = num(r[2]);
      const amt = String(r[3] == null ? '' : r[3]).trim() !== '' ? num(r[3]) : r2(price * cnt);
      const bp = num(r[4]);
      const br = r2(amt * bp / 100);
      return { name: r[0], price, cnt, amt, bp, sp: r2(100 - bp), br, sc: r2(amt - br) };
    });
    const gross = r2(rows.reduce((a, r) => a + r.amt, 0)), toBranch = r2(rows.reduce((a, r) => a + r.br, 0)), toSchool = r2(gross - toBranch);
    const carryCash = num(f.carryCash), carryPostal = num(f.carryPostal), carry = r2(carryCash + carryPostal);
    const avail = r2(carry + toSchool);
    const doms = (f.dom || []).filter(r => String(r[0] || '').trim()).map((r, i) => ({ n: r[0], p: num(r[1]), amt: r2(avail * num(r[1]) / 100), spent: B.spentOf('cp_r' + (i + 1), sy) }));
    doms.forEach(d => { d.left = r2(d.amt - d.spent); });
    const spent = r2(doms.reduce((a, d) => a + d.spent, 0));
    const cashEnd = r2(carryCash + toSchool - spent), postalEnd = carryPostal;
    return { f, rows, gross, toBranch, toSchool, carryCash, carryPostal, carry, avail, doms, spent, left: r2(avail - spent), cashEnd, postalEnd };
  }
  const prevEnd = sy => {
    const p = B.prevSy(sy);
    if (!B.hasYear(p) || !(B.store(p).cp_base)) return { cash: '', postal: '' };
    const c = calc(p);
    return { cash: String(c.cashEnd), postal: String(c.postalEnd) };
  };
  const syText = sy => MK.syDash(sy).replace('-', '/');

  const DOCS = [];
  const add = d => DOCS.push(d);
  const coordOf = sy => { const r = window.Board ? Board.members(sy, 'coop').find(x => x[2] === 'المنسق' && String(x[0] || '').trim()) : null; return r ? r[0] : ''; };
  const coopHead = (s, c) => kv([['المؤسسة', s.school || ''], ['رقم التعاونية المدرسية', c.f.coopNo || '..........'], ['رقم الحساب البريدي', c.f.postal || '..........'], ['رمز المؤسسة', c.f.code || '..........']]);
  const nm = t => String(t || '').trim();

  /* 1 — معطيات التعاونية */
  add({
    k: 'cp_base', t: 'معطيات التعاونية المدرسية وتوزيع المداخيل', grp: 'cp_a', d: 'تُدخل مرة واحدة: رقم التعاونية، الحساب البريدي، المداخيل (بطاقة المتعاون، الدفتر المدرسي...) ونسب التوزيع.', auto: 'لوائح التلاميذ والموظفين، وأرصدة السنة السابقة',
    init: (s, sy) => {
      const p = B.pupilsCount(sy), pe = prevEnd(sy);
      return {
        coopNo: '', postal: '', code: s.code || '', created: '', coord: coordOf(sy), branch: s.directorate ? `جمعية تنمية التعاون المدرسي - فرع ${s.directorate}` : '', branchPostal: '',
        pm: String(p.m), pf: String(p.f), classes: String(teachers().length || ''), carryCash: pe.cash, carryPostal: pe.postal,
        inc: INC.map((r, i) => [r[0], i === 0 ? '10' : '', i === 0 ? String(p.t || '') : '', '', r[1], r[2]]),
        dom: DOM.map((n, i) => [n, String(DOM_PCT[i])])
      };
    },
    defs: () => [
      { sec: 'التعريف بالتعاونية' }, { k: 'coopNo', l: 'رقم التعاونية المدرسية', half: true, ph: 'ت.م.أ ...' }, { k: 'code', l: 'رمز المؤسسة', half: true }, { k: 'postal', l: 'رقم الحساب البريدي للتعاونية', half: true, dir: 'ltr' }, { k: 'created', l: 'تاريخ تأسيس/تجديد التعاونية', t: 'date', half: true },
      { k: 'branch', l: 'فرع جمعية تنمية التعاون المدرسي', half: true }, { k: 'branchPostal', l: 'رقم الحساب البريدي للفرع', half: true, dir: 'ltr' }, { k: 'coord', l: 'منسق(ة) التعاونية', half: true, list: 'k2Emps' }, { k: 'classes', l: 'عدد الأقسام', t: 'num', half: true },
      { k: 'pm', l: 'عدد التلاميذ الذكور', t: 'num', half: true }, { k: 'pf', l: 'عدد التلميذات الإناث', t: 'num', half: true },
      { sec: 'الأرصدة المنقولة من السنة الماضية (قد تكون سالبة)' }, { k: 'carryCash', l: 'المنقول نقدا', t: 'money', half: true }, { k: 'carryPostal', l: 'المنقول بالحساب البريدي', t: 'money', half: true },
      { sec: 'مداخيل التعاونية' }, { note: 'المبلغ = القيمة × العدد (اترك خانة المبلغ فارغة ليُحسب تلقائيا، أو اكتب مبلغا إجماليا مباشرة كمداخيل العرض الفني). النسبتان قابلتان للتعديل: مثلا بطاقة المتعاون 60% للفرع و40% للمؤسسة.' },
      gridDef('inc', '', ['نوع الأداء', 'القيمة', 'العدد', 'المبلغ الإجمالي', '% للفرع', '% للمؤسسة'], { widths: ['1.6fr', '.7fr', '.7fr', '1fr', '.7fr', '.8fr'], types: ['text', 'num', 'num', 'num', 'num', 'num'] }),
      { sec: 'مجالات الصرف ونسبها' }, gridDef('dom', '', ['المجال', 'النسبة المخصصة %'], { widths: ['2fr', '1fr'], types: ['text', 'num'], fixed: true })
    ],
    build: (s, f, sy) => {
      const c = calc(sy);
      const rows = c.rows.map(r => tr([{ t: r.name, c: 'r b' }, { t: r.price ? m2(r.price) : '', c: 'ltr' }, r.cnt || '', { t: m2(r.amt), c: 'ltr' }, `${r.bp}%`, { t: m2(r.br), c: 'ltr' }, `${r.sp}%`, { t: m2(r.sc), c: 'ltr b' }]));
      rows.push(tr([{ t: 'المجموع', s: 3, c: 'd b' }, { t: m2(c.gross), c: 'd b ltr' }, { t: '', c: 'd' }, { t: m2(c.toBranch), c: 'd b ltr' }, { t: '', c: 'd' }, { t: m2(c.toSchool), c: 'd b ltr' }]));
      const dom = c.doms.map((d, i) => tr([i + 1, { t: d.n, c: 'r b' }, `${d.p}%`, { t: m2(d.amt), c: 'ltr' }]));
      dom.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: `${r2(c.doms.reduce((a, d) => a + d.p, 0))}%`, c: 'd b' }, { t: m2(r2(c.doms.reduce((a, d) => a + d.amt, 0))), c: 'd b ltr' }]));
      return {
        title: 'معطيات التعاونية المدرسية وتوزيع المداخيل', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'إمضاء منسق(ة) التعاونية', left: 'إمضاء رئيس المؤسسة' }),
        blocks: [kv([['المؤسسة', s.school || ''], ['رمز المؤسسة', f.code || ''], ['رقم التعاونية', f.coopNo || ''], ['الحساب البريدي', f.postal || ''], ['عدد التلاميذ', `${(num(f.pm) + num(f.pf)) || ''} (ذكور ${f.pm || 0} / إناث ${f.pf || 0})`], ['عدد الأقسام', f.classes || ''], ['فرع الجمعية', f.branch || ''], ['حساب الفرع', f.branchPostal || '']]),
          SB.cap('مداخيل التعاونية وتوزيعها بين الفرع والمؤسسة'),
          tbl(hd(['نوع الأداء', 'القيمة', 'العدد', 'المجموع', '% الفرع', 'حصة الفرع', '% المؤسسة', 'حصة المؤسسة']), rows, 'cmp'),
          kv([['الرصيد المنقول نقدا', dh(c.carryCash)], ['الرصيد المنقول بالحساب البريدي', dh(c.carryPostal)], ['حصة المؤسسة من مداخيل السنة', dh(c.toSchool)], ['المبلغ القابل للصرف', dh(c.avail)]]),
          SB.cap('توزيع المبلغ القابل للصرف على المجالات'),
          tbl(hd(['ر.ت', 'المجال', 'النسبة', 'المبلغ المخصص']), dom, 'cmp')]
      };
    }
  });

  /* 2 — مشروع الصرف */
  add({
    k: 'cp_spend', t: 'مشروع صرف ميزانية التعاونية المدرسية', grp: 'cp_a', d: 'يُرفع إلى المديرية: المنقول + المداخيل المرتقبة وتوزيعها على المجالات الخمسة.', auto: 'معطيات التعاونية', page: 'a4',
    init: () => ({ n1: '', n2: '', n3: '', n4: '', n5: '' }),
    defs: () => [{ note: 'المبالغ تُحسب من «معطيات التعاونية». يمكن كتابة ملاحظة لكل مجال تظهر في الجدول.' }].concat(DOM.map((n, i) => ({ k: 'n' + (i + 1), l: 'ملاحظة: ' + n, half: true }))),
    build: (s, f, sy) => {
      const c = calc(sy);
      const rows = c.doms.map((d, i) => tr([i + 1, { t: d.n, c: 'r b' }, `${d.p}%`, { t: m2(d.amt), c: 'ltr' }, { t: f['n' + (i + 1)] || '-----------', c: 'sm' }]));
      rows.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: `${r2(c.doms.reduce((a, d) => a + d.p, 0))}%`, c: 'd b' }, { t: m2(r2(c.doms.reduce((a, d) => a + d.amt, 0))), c: 'd b ltr' }, { t: '', c: 'd' }]));
      return {
        title: 'مشروع صرف ميزانية التعاونية المدرسية', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'إمضاء منشطة التعاونية المدرسية', left: 'إمضاء المدير وطابع المؤسسة' }),
        blocks: [kv([['رقم التعاونية المدرسية', c.f.coopNo || '..........'], ['المؤسسة', s.school || ''], ['رقم الحساب البريدي', c.f.postal || '..........'], ['المنقول عن السنة الماضية', dh(c.carry)], ['مجموع المداخيل المرتقبة خلال السنة المدرسية', dh(c.toSchool)], ['المجموع', dh(c.avail)]]),
          tbl(hd(['ر.ت', 'المجالات', 'النسبة المخصصة', 'المبلغ المخصص للمجال', 'ملاحظات']), rows, 'big'),
          { html: `<div style="border:1px solid #4472c4;min-height:30mm;margin-top:3mm;padding:2mm 3mm;font-weight:700;color:#1f3864">ملاحظات المديرية الإقليمية:</div>` }]
      };
    }
  });

  /* 3-7 — دفاتر المصاريف */
  DOM.forEach((n, i) => add(B.regDoc({
    k: 'cp_r' + (i + 1), t: `دفتر مصاريف: ${n}`, grp: 'cp_b', title: `مصاريف مجال ${n}`, d: `عمليات الصرف المؤرخة لمجال «${n}» والباقي بعد الصرف.`, auto: 'المبلغ المخصص للمجال من معطيات التعاونية',
    allocated: sy => (calc(sy).doms[i] || { amt: 0 }).amt,
    top: (sy, spent) => { const al = (calc(sy).doms[i] || { amt: 0 }).amt; return [['السنة الدراسية', syText(sy)], ['المؤسسة', S().school || ''], ['الرصيد المخصص للمجال', dh(al)], ['مصاريف المجال', dh(spent)], ['الباقي بعد الصرف', dh(al - spent)], ['', '']]; }
  })));

  /* 8 — التقرير المالي */
  add({
    k: 'cp_report', t: 'التقرير المالي للتعاونية المدرسية', grp: 'cp_a', d: 'نهاية السنة: المخصص والمصروف والباقي لكل مجال، والرصيد النقدي والبريدي.', auto: 'معطيات التعاونية ودفاتر المصاريف', page: 'a4',
    init: (s, sy) => ({ city: s.city || '', date: '', postalEnd: '', n1: '', n2: '', n3: '', n4: '', n5: '' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }, { k: 'postalEnd', l: 'الباقي في الحساب البريدي (اتركه فارغا للحساب التلقائي)', t: 'money' }]
      .concat(DOM.map((n, i) => ({ k: 'n' + (i + 1), l: 'ملاحظة: ' + n, half: true }))),
    build: (s, f, sy) => {
      const c = calc(sy), postal = nm(f.postalEnd) !== '' ? num(f.postalEnd) : c.postalEnd;
      const rows = c.doms.map((d, i) => tr([{ t: `${i + 1}- ${d.n}`, c: 'r b' }, `${d.p}%`, { t: m2(d.amt), c: 'ltr' }, { t: m2(d.spent), c: 'ltr' }, { t: m2(d.left), c: `ltr ${d.left < 0 ? 'b' : ''}` }, { t: f['n' + (i + 1)] || '', c: 'sm' }]));
      rows.push(tr([{ t: 'المجموع', c: 'd b' }, { t: `${r2(c.doms.reduce((a, d) => a + d.p, 0))}%`, c: 'd b' }, { t: m2(r2(c.doms.reduce((a, d) => a + d.amt, 0))), c: 'd b ltr' }, { t: m2(c.spent), c: 'd b ltr' }, { t: m2(c.left), c: 'd b ltr' }, { t: '', c: 'd' }]));
      return {
        title: 'التقرير المالي للتعاونية المدرسية', sub: `السنة الدراسية ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { city: f.city, date: f.date || undefined, right: `حرر ب: ${esc(f.city || s.city || '')} بتاريخ: ${esc(f.date ? K.ldate(f.date) : '..........')}`, left: 'إمضاء المدير(ة) وطابع المؤسسة' }),
        blocks: [kv([['المؤسسة', s.school || ''], ['رقم التعاونية المدرسية', c.f.coopNo || '..........'], ['رقم الحساب البريدي', c.f.postal || '..........'], ['مجموع التلاميذ', String((num(c.f.pm) + num(c.f.pf)) || '..........')]]),
          tbl(hd(['المجالات', 'النسبة المخصصة', 'المبلغ المخصص للمجال', 'المصاريف', 'الباقي بعد الصرف', 'ملاحظات']), rows, 'big'),
          SB.cap('الباقي في آخر السنة الدراسية'),
          kv2([['نقدا', dh(c.cashEnd)], ['في الحساب الجاري', dh(postal)], ['المجموع', dh(r2(c.cashEnd + postal))]]),
          { html: `<div style="display:flex;gap:4mm;margin-top:3mm"><div style="flex:1;border:1px solid #4472c4;min-height:34mm;padding:2mm 3mm;font-weight:700;color:#1f3864">إطار خاص بالمديرية الإقليمية:<br>ملاحظات: ..........................................</div><div style="flex:1;border:1px solid #4472c4;min-height:34mm;padding:2mm 3mm;font-weight:700;color:#1f3864">رئيس مكتب تنمية الأنشطة الاجتماعية والثقافية:<br><br>إمضاء السيد المدير الإقليمي:</div></div>` }]
      };
    }
  });

  /* 9 — بطاقة تتبع الحسابات */
  add({
    k: 'cp_track', t: 'بطاقة تتبع حسابات التعاونية المدرسية', grp: 'cp_a', d: 'المداخيل نقدا/بريديا والمصاريف بحسب المجالات والميزان.', auto: 'معطيات التعاونية ودفاتر المصاريف', page: 'a4',
    init: () => ({}), defs: () => [{ note: 'بطاقة تُحسب كلها تلقائيا من «معطيات التعاونية» ودفاتر المصاريف الخمسة.' }],
    build: (s, f, sy) => {
      const c = calc(sy);
      const inc = [tr([1, { t: 'مجموع الرصيد السابق', c: 'r b' }, { t: m2(c.carryCash), c: 'ltr' }, { t: m2(c.carryPostal), c: 'ltr' }, { t: m2(c.carry), c: 'ltr b' }, ''])]
        .concat(c.rows.map((r, i) => tr([i + 2, { t: r.name, c: 'r' }, { t: m2(r.sc), c: 'ltr' }, { t: m2(0), c: 'ltr' }, { t: m2(r.sc), c: 'ltr' }, { t: r.br ? `حصة المؤسسة (${r.sp}%)` : '', c: 'sm' }])));
      inc.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(r2(c.carryCash + c.toSchool)), c: 'd b ltr' }, { t: m2(c.carryPostal), c: 'd b ltr' }, { t: m2(c.avail), c: 'd b ltr' }, { t: '', c: 'd' }]));
      const exp = c.doms.map((d, i) => tr([i + 1, { t: `مجال ${d.n}`, c: 'r' }, { t: m2(d.spent), c: 'ltr' }, { t: m2(0), c: 'ltr' }, { t: m2(d.spent), c: 'ltr' }, '']));
      exp.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(c.spent), c: 'd b ltr' }, { t: m2(0), c: 'd b ltr' }, { t: m2(c.spent), c: 'd b ltr' }, { t: '', c: 'd' }]));
      const bal = [tr([{ t: 'نقدا', c: 'b' }, { t: m2(r2(c.carryCash + c.toSchool)), c: 'ltr' }, { t: 'نقدا', c: 'b' }, { t: m2(c.spent), c: 'ltr' }, { t: m2(c.cashEnd), c: 'ltr b' }]),
        tr([{ t: 'بالحساب البريدي', c: 'b' }, { t: m2(c.carryPostal), c: 'ltr' }, { t: 'بالحساب البريدي', c: 'b' }, { t: m2(0), c: 'ltr' }, { t: m2(c.postalEnd), c: 'ltr b' }])];
      return {
        title: 'بطاقة تتبع حسابات التعاونية المدرسية', sub: `السنة الدراسية ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'إمضاء منسق(ة) التعاونية', left: 'إمضاء رئيس المؤسسة' }),
        blocks: [kv([['المؤسسة', s.school || ''], ['رقم الحساب البريدي', c.f.postal || '..........'], ['رقم التعاونية المدرسية', c.f.coopNo || '..........'], ['مجموع التلاميذ', String((num(c.f.pm) + num(c.f.pf)) || '..........')]]),
          SB.cap('المداخيل'), tbl(hd(['ر.ت', 'نوع المداخيل', 'نقدا', 'بالحساب البريدي', 'المجاميع', 'ملاحظات']), inc, 'cmp'),
          SB.cap('المصاريف'), tbl(hd(['ر.ت', 'نوع المصاريف', 'نقدا', 'بالحساب البريدي', 'المجاميع', 'ملاحظات']), exp, 'cmp'),
          SB.cap('الميزان'), tbl(hd(['نوع المداخيل', 'المجموع', 'نوع المصاريف', 'المجموع', 'الباقي']), bal, 'cmp')]
      };
    }
  });

  /* 10 — بيان اشتراك المتعاونين */
  add({
    k: 'cp_subs', t: 'بيان اشتراك المتعاونين على صعيد المؤسسة', grp: 'cp_a', d: 'لكل أستاذ(ة): المستوى وعدد التلاميذ وعدد المشتركين والمبلغ.', auto: 'لائحة الأساتذة ولوائح التلاميذ', page: 'a4',
    init: (s, sy) => ({ rows: teachers().map(e => { const n = pupilsOf(e, sy); return [fullName(e), Board.levelDigits(e).join('+'), n, n]; }) }),
    defs: () => [{ note: 'عدد المشتركين يساوي عدد التلاميذ افتراضيا؛ عدّله إن لم يشترك الجميع. المبلغ = عدد المشتركين × قيمة بطاقة المتعاون.' },
      gridDef('rows', 'الأساتذة', ['الأستاذ(ة)', 'المستوى', 'عدد التلاميذ', 'عدد المشتركين'], { widths: ['2fr', '.8fr', '.9fr', '.9fr'], types: ['text', 'text', 'num', 'num'], list: ['k2Emps'], fill: r => { const e = K.E.byName(r[0]); if (!e) return null; const n = pupilsOf(e, MK.curSy()); return [r[0], Board.levelDigits(e).join('+'), n, n]; } })],
    build: (s, f, sy) => {
      const c = calc(sy), price = num((c.f.inc && c.f.inc[0] && c.f.inc[0][1]) || 0);
      const R = (f.rows || []).filter(r => nm(r[0]));
      const rows = R.map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, r[1], r[2], r[3], { t: m2(num(r[3]) * price), c: 'ltr' }, '']));
      rows.push(tr([{ t: 'المجموع', s: 3, c: 'd b' }, { t: String(sumCol(R, 2)), c: 'd b' }, { t: String(sumCol(R, 3)), c: 'd b' }, { t: m2(sumCol(R, 3) * price), c: 'd b ltr' }, { t: '', c: 'd' }]));
      return { title: 'بيان اشتراك المتعاونين على صعيد المؤسسة', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'توقيع منسق(ة) التعاونية', left: 'توقيع السيد مدير المؤسسة' }),
        blocks: [tbl(hd(['ر.ت', 'اسم الأستاذ(ة)', 'المستوى الدراسي', 'عدد التلاميذ', 'عدد المشتركين', `المبلغ (${m2(price)} درهم للمشترك)`, 'ملاحظات']), blankRows(rows.slice(0, -1), 14, 7).concat(rows.slice(-1)), 'big')] };
    }
  });

  /* 11 — إعلام بتحويل مبلغ */
  add({
    k: 'cp_transfer', t: 'إعلام بتحويل مبلغ إلى فرع جمعية التعاون', grp: 'cp_a', d: 'مراسلة المديرية بتحويل حصة الفرع إلى حسابه البريدي (التفصيل حسب نوع الأداء).', auto: 'معطيات التعاونية', page: 'a4',
    init: (s, sy) => ({ no: '', city: s.city || '', date: '', amount: '', moNo: '', moDate: '', office: '', note: '' }),
    defs: () => [{ k: 'no', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }, { k: 'amount', l: 'المبلغ المحول (فارغ = حصة الفرع المحسوبة)', t: 'money', half: true },
      { k: 'moNo', l: 'بواسطة حوالة رقم', half: true }, { k: 'moDate', l: 'بتاريخ الحوالة', t: 'date', half: true }, { k: 'office', l: 'من مكتب البريد', half: true }, { k: 'note', l: 'ملحوظة (مثال: مقابل الدفتر المدرسي والملف المدرسي)', half: true }],
    build: (s, f, sy) => {
      const c = calc(sy), amount = nm(f.amount) !== '' ? num(f.amount) : c.toBranch;
      const L = t => ({ html: `<p class="sb-p"${t.st ? ` style="${t.st}"` : ''}>${t.h}</p>` });
      const rows = c.rows.map(r => tr([{ t: r.name, c: 'r' }, r.cnt || '', { t: m2(r.br), c: 'ltr' }]));
      rows.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(c.toBranch), c: 'd b ltr' }]));
      return { title: 'إعلام بتحويل مبلغ', sub: '', page: 'a4', sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} بتاريخ: ${esc(f.date ? K.ldate(f.date) : '..........')}`, left: 'إمضاء رئيس المؤسسة' }),
        blocks: [kv([['من مدير', s.school || ''], ['المديرية الإقليمية', s.directorate || ''], ['إلى السيد', 'المدير الإقليمي للوزارة'], ['رقم الإرسال', f.no || '..........']]),
          L({ h: `<b>الموضوع:</b> إعلام بتحويل مبلغ. &nbsp; <b>إلى:</b> مكتب تنمية الأنشطة الاجتماعية والثقافية — ${esc(s.directorate || '')}` }),
          L({ h: 'سلام تام بوجود مولانا الإمام،' }),
          L({ h: `وبعد، فعلاقة بالموضوع أعلاه، يشرفني أن أخبركم أن إدارة المؤسسة قامت بتحويل المبلغ المحدد أسفله إلى الحساب البريدي الخاص بالفرع${f.note ? ' (' + esc(f.note) + ')' : ''}.` }),
          kv2([['رقم الحساب البريدي للتعاونية المدرسية', c.f.postal || '..........'], ['قيمة المبلغ المحول', `${dh(amount)} (${K.tafqit(amount)})`], ['للحساب البريدي رقم', c.f.branchPostal || '..........'], ['الخاص بجمعية تنمية التعاون المدرسي - فرع', c.f.branch || '..........'],
            ['بواسطة حوالة رقم / بتاريخ', `${f.moNo || '..........'} &nbsp;/&nbsp; ${f.moDate ? K.ldate(f.moDate) : '..........'}`.replace(/&nbsp;/g, ' ')], ['من مكتب البريد', f.office || '..........']]),
          tbl(hd(['من أجل', 'العدد', 'المبلغ بالدرهم']), rows, 'cmp'),
          L({ h: 'وتقبلوا أسمى عبارات التقدير والاحترام.' })] };
    }
  });

  /* 12 — بطاقة التحويل */
  add({
    k: 'cp_card', t: 'بطاقة التحويل لحساب جمعية تنمية التعاون المدرسي', grp: 'cp_a', d: 'بطاقة التحويل السنوية: عدد المنخرطين، قيمة الاشتراك والمبلغ المحول (نسبة الفرع).', auto: 'معطيات التعاونية', page: 'a4',
    init: () => ({ date: '' }), defs: () => [{ k: 'date', l: 'تاريخ التحويل', t: 'date' }],
    build: (s, f, sy) => {
      const c = calc(sy), r0 = c.rows[0] || { bp: 60, br: 0, amt: 0, price: 0 };
      return { title: 'بطاقة التحويل لحساب جمعية تنمية التعاون المدرسي', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'توقيع منسق التعاونية', left: 'توقيع رئيس المؤسسة', noDate: false }),
        blocks: [kv([['المؤسسة', `${s.school || ''}${s.commune ? ' - جماعة: ' + s.commune : ''}`], ['المديرية الإقليمية', s.directorate || ''], ['عدد التلاميذ المنخرطين', `${r0.cnt || (num(c.f.pm) + num(c.f.pf)) || ''} (ذكور ${c.f.pm || 0} / إناث ${c.f.pf || 0})`], ['عدد الأقسام بالمؤسسة', c.f.classes || ''],
          ['قيمة واجب الاشتراك السنوي', `${m2(r0.price)} درهما`], ['رمز المؤسسة', c.f.code || ''], ['مجموع مداخيل التعاونية من الاشتراكات', dh(r0.amt)], ['تاريخ تجديد التعاونية', c.f.created ? K.ldate(c.f.created) : '..........']]),
          tbl(hd(['العملية', 'المبلغ', 'تاريخ التحويل']), [tr([{ t: `نسبة ${r0.bp}% من مداخيل التعاونية المدرسية الموسم الدراسي ${syText(sy)}`, c: 'r' }, { t: dh(r0.br), c: 'ltr' }, f.date ? K.ldate(f.date) : ''])], 'big'),
          tbl('', [tr([{ t: 'المبلغ الإجمالي المحول:', c: 'k' }, { t: dh(r0.br), c: 'ltr b' }])], 'kv cmp')] };
    }
  });

  /* 13 — محضر تجديد مكتب التعاونية */
  const BUREAU = ['الرئيس', 'نائبه', 'الكاتب', 'نائبه', 'الأمين', 'نائبه', 'مستشار', 'مستشار', 'مستشار'];
  add({
    k: 'cp_renew', t: 'محضر تجديد مكتب التعاونية المدرسية', grp: 'cp_c', d: 'معلومات عامة، الجمع العام، ولائحة أعضاء المكتب المسير من التلاميذ.', auto: 'معطيات التعاونية ومكتب التعاونية من السبورة المرجعية', page: 'a4',
    init: (s, sy) => {
      const bo = window.Board ? (Board.store(sy).coopOffices || {}).office : null;
      const c = calc(sy);
      return { date: '', place: s.school || '', tCount: '', pCount: '', cashBal: String(c.cashEnd || ''), postalBal: String(c.postalEnd || ''), rows: (bo && bo.length ? bo : BUREAU.map(r => [r, '', '', ''])).map(r => r.slice(0, 4)) };
    },
    defs: () => [{ k: 'date', l: 'تاريخ انعقاد الجمع العام', t: 'date', half: true }, { k: 'place', l: 'المكان', half: true }, { k: 'tCount', l: 'عدد الحاضرين من الأساتذة', t: 'num', half: true }, { k: 'pCount', l: 'عدد الحاضرين من التلاميذ', t: 'num', half: true }, { k: 'cashBal', l: 'الرصيد المالي نقدا', t: 'money', half: true }, { k: 'postalBal', l: 'الرصيد بالحساب البريدي', t: 'money', half: true },
      gridDef('rows', 'لائحة أعضاء المكتب المسير', ['المهمة', 'الاسم الكامل', 'المستوى', 'الوحدة'], { widths: ['.8fr', '1.6fr', '.9fr', '1.2fr'], list: [null, 'k2People', null, 'k2Units'], link: { src: 'any', n: 1, cols: { lvl: 2, unit: 3 } } })],
    build: (s, f, sy) => {
      const c = calc(sy), R = (f.rows || []);
      let seenC = 0; const nC = R.filter(r => /مستشار/.test(r[0])).length;
      const rows = R.map(r => {
        const cons = /مستشار/.test(r[0]);
        const first = cons && seenC++ === 0;
        return tr((cons ? (first ? [{ t: 'مستشارون', c: 'k b', r: nC }] : []) : [{ t: r[0], c: 'k b' }]).concat([{ t: r[1], c: 'r b' }, r[2], r[3]]));
      });
      return { title: 'محضر تجديد مكتب التعاونية المدرسية', sub: `السنة الدراسية ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'منسق(ة) التعاونية', left: 'مدير المؤسسة' }),
        blocks: [SB.cap('معلومات عامة', 'r'), kv([['المؤسسة', `${s.school || ''}${s.commune ? ' - جماعة: ' + s.commune : ''}`], ['عدد الأقسام بالمؤسسة', c.f.classes || ''], ['عدد التلاميذ المنخرطين', String(num(c.f.pm) + num(c.f.pf) || '')], ['رمز المؤسسة', c.f.code || ''], ['تاريخ تأسيس التعاونية', c.f.created ? K.ldate(c.f.created) : ''], ['رقم التعاونية', c.f.coopNo || ''], ['رقم حسابها البريدي', c.f.postal || ''], ['الرصيد المالي بالحساب البريدي', m2(num(f.postalBal))], ['الرصيد المالي نقدا', m2(num(f.cashBal))], ['', '']]),
          SB.cap('تجديد المكتب الإداري للتعاونية المدرسية', 'r'), kv([['تاريخ انعقاد الجمع العام', f.date ? K.ldate(f.date) : '..........'], ['المكان', f.place || ''], ['عدد الحاضرين من الأساتذة', f.tCount || ''], ['عدد الحاضرين من التلاميذ', f.pCount || '']]),
          SB.cap('لائحة أعضاء المكتب المسير للتعاونية المدرسية', 'r'), tbl(hd(['المهمة', 'الاسم الكامل', 'المستوى', 'الوحدة']), rows, 'big')] };
    }
  });

  /* 14 — محضر تأسيس تعاونية القسم (صفحة لكل قسم) */
  const ACT = ['مكتبة', 'المجلة الحائطية', 'تراسل', 'هوايات', 'مسابقات', 'متحف', 'بستنة'];
  add({
    k: 'cp_class', t: 'محضر تأسيس تعاونية القسم', grp: 'cp_c', d: 'نموذج لكل قسم (صفحة لكل أستاذ) ليملأه التلاميذ عند انتخاب مكتب تعاونية القسم.', auto: 'لائحة الأساتذة', page: 'a4',
    init: (s, sy) => ({ city: s.city || '', date: '', time: '', other: '', rows: teachers().map(e => isSecC() ? [fullName(e), e.ppr || '', e.teachLang || '', Board.levelDigits(e).join('+')] : [fullName(e), e.ppr || '', e.teachLang || '', e.unit || '', Board.levelDigits(e).join('+')]) }),
    defs: () => [{ note: 'تُطبع صفحة لكل سطر من الجدول أسفله (احذف الأسطر التي لا تحتاجها). اترك التاريخ والساعة فارغين لتُكتبا بخط اليد.' }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'تاريخ الاجتماع', t: 'date', half: true }, { k: 'time', l: 'الساعة', half: true }, { k: 'other', l: 'نشاطات أخرى', half: true },
      isSecC() ? gridDef('rows', 'الأقسام', ['الأستاذ(ة)', 'رقم التأجير', 'لغة التدريس', 'المستوى'], { widths: ['1.6fr', '.9fr', '.8fr', '.7fr'], list: ['k2Emps'], fill: r => { const e = K.E.byName(r[0]); return e ? [r[0], e.ppr || '', e.teachLang || '', Board.levelDigits(e).join('+')] : null; } })
        : gridDef('rows', 'الأقسام', ['الأستاذ(ة)', 'رقم التأجير', 'لغة التدريس', 'الوحدة المدرسية', 'المستوى'], { widths: ['1.6fr', '.9fr', '.8fr', '1.1fr', '.7fr'], list: ['k2Emps', null, null, 'k2Units'], fill: r => { const e = K.E.byName(r[0]); return e ? [r[0], e.ppr || '', e.teachLang || '', e.unit || '', Board.levelDigits(e).join('+')] : null; } })],
    build: (s, f, sy) => {
      const code = calc(sy).f.code || s.code || '..........';
      const sec = isSecC(), LI = sec ? 3 : 4;
      const R = (f.rows || []).filter(r => nm(r[0]) || (!sec && nm(r[3])) || nm(r[LI]));
      if (!R.length) R.push(sec ? ['', '', '', ''] : ['', '', '', '', '']);
      const ds = f.date ? ldate(f.date) : '..................';
      let pages = [];
      R.forEach(r => {
        const blocks = [
          { html: `<div style="text-align:left;font-weight:700;margin:0 0 2mm">${esc(f.city || s.city || '')} في: ${esc(f.date ? ldate(f.date) : '.............')}</div>` },
          kv([['المؤسسة', s.school || ''], ['رمزها', code]].concat(sec ? [] : [['الوحدة المدرسية', r[3] || '..................']], [['القسم', r[LI] ? `المستوى ${r[LI]}` : '..................'], ['اسم الأستاذ(ة)', r[0] || '..................'], ['رقم التأجير', r[1] || '..............'], ['لغة التدريس', r[2] || '..............'], ['', '']])),
          { html: `<p class="sb-p" style="margin-top:3mm">اجتمع تلاميذ هذا القسم يوم: ${esc(f.date ? dayName(f.date) + ' ' + ds : '..................')} على الساعة: ${esc(f.time || '.............')} لتأسيس تعاونية قسمهم طبقا لما جاء في المذكرة الوزارية رقم 202 الصادرة بتاريخ 31/10/1975، وانتخبوا مكتبا يتكون من سبعة أعضاء، وهم:</p>`, keepNext: true },
          tbl('', [['الرئيس(ة)', 'نائبه(ا)'], ['الكاتب(ة)', 'نائبه(ا)'], ['الأمين(ة)', 'نائبه(ا)']].map(p => tr([{ t: p[0], c: 'k b' }, { t: '', st: 'height:9mm' }, { t: p[1], c: 'k b' }, '']))
            .concat([tr([{ t: 'المستشار(ة)', c: 'k b' }, { t: '', s: 3, st: 'height:9mm' }])]), 'kv'),
          SB.cap('نشاطات تعاونية القسم', 'r'),
          tbl(hd(ACT), [tr(ACT.map(() => ({ h: '<span class="sb-chk" style="width:5mm;height:5mm"></span>', st: 'height:10mm' })))], 'cmp'),
          { html: `<p class="sb-p" style="margin-top:3mm">نشاطات أخرى: ${esc(f.other || '................................................................................')}</p>` }];
        const sign = SB.sign(s, { three: ['رئيس(ة) التعاونية', 'كاتب(ة) التعاونية', 'أستاذ(ة) القسم'] });
        pages = pages.concat(SB.pages(s, { title: 'محضر تأسيس تعاونية القسم', sub: `السنة الدراسية ${syText(sy)}`, page: 'a4', blocks, sign }));
      });
      return { pages, page: 'a4' };
    }
  });

  /* 15 — بطاقة منسق التعاونية */
  add({
    k: 'cp_coord', t: 'بطاقة منسق(ة) التعاونية', grp: 'cp_c', d: 'معطيات المنسق(ة): الإطار، لغة التدريس، مجالات الاهتمام والتداريب.', auto: 'لائحة الموظفين (اختر الاسم ثم «تعبئة من اللائحة»)', page: 'a4',
    init: (s, sy) => { const n = coordOf(sy); const e = n ? K.E.byName(n) : null; return { name: n, ppr: e ? e.ppr || '' : '', cadre: e ? e.cadre || '' : '', lang: e ? e.teachLang || '' : '', study: '', phone: e ? e.phone || '' : '', interests: [false, false, false, false, false, false], rows: [['', '', ''], ['', '', ''], ['', '', '']] }; },
    defs: () => [{ k: 'name', l: 'الاسم الكامل', half: true, list: 'k2Emps', link: { src: 'emp', keys: { ppr: 'ppr', cadre: 'cadre', phone: 'phone' } } }, { t: 'html', half: true, html: '<label>&nbsp;</label><button type="button" class="btn sm pri" data-act="fill">تعبئة من لائحة الموظفين</button>' },
      { k: 'ppr', l: 'رقم التأجير', half: true }, { k: 'cadre', l: 'الإطار', half: true }, { k: 'lang', l: 'لغة التدريس', half: true }, { k: 'study', l: 'المستوى الدراسي', half: true }, { k: 'phone', l: 'الهاتف الشخصي', half: true, dir: 'ltr' },
      { k: 'interests', l: 'مجالات الاهتمام', t: 'checks', opts: ['المجال الثقافي', 'المجال البيئي', 'المجال الرياضي', 'المجال الاجتماعي', 'المجال الصحي', 'المجال الفني'] },
      gridDef('rows', 'التداريب التي شارك فيها', ['نوع التدريب', 'التاريخ', 'المكان'], { widths: ['2fr', '.8fr', '1fr'] })],
    act: { fill: (f, sy, c) => { const e = K.E.byName(f.name); if (!e) { c.toast('اختر اسما من لائحة الموظفين أولا', true); return; } f.ppr = e.ppr || ''; f.cadre = e.cadre || ''; f.lang = e.teachLang || ''; f.phone = e.phone || ''; ['ppr', 'cadre', 'lang', 'phone'].forEach(k => c.save(k)); } },
    build: (s, f, sy) => {
      const ints = ['المجال الثقافي', 'المجال البيئي', 'المجال الرياضي', 'المجال الاجتماعي', 'المجال الصحي', 'المجال الفني'].filter((_, i) => (f.interests || [])[i]);
      const R = (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
      return { title: 'بطاقة منسق التعاونية', sub: '', page: 'a4', sign: SB.sign(s, { right: 'توقيع المنسق(ة)', left: 'إمضاء رئيس المؤسسة', noDate: true }),
        blocks: [kv([['المؤسسة', s.school || ''], ['الموسم الدراسي', MK.syDash(sy)]]), kv([['الاسم الكامل', f.name || ''], ['رقم التأجير', f.ppr || ''], ['الإطار', f.cadre || ''], ['لغة التدريس', f.lang || ''], ['المستوى الدراسي', f.study || ''], ['الهاتف الشخصي', f.phone || '']]),
          SB.cap('مجالات الاهتمام', 'r'), { html: `<p class="sb-p">${esc(ints.join('، ') || '..............................................................')}</p>` },
          SB.cap('التداريب التي شارك فيها', 'r'), tbl(hd(['نوع التدريب', 'التاريخ', 'المكان']), blankRows(R.map(r => tr([{ t: r[0], c: 'r' }, r[1], r[2]])), 5, 3, false), 'big')] };
    }
  });

  /* 16 — برنامج العمل السنوي */
  const PROG = [['أكتوبر', 'اجتماعي', 'لقاءات تواصلية مع الأسر'], ['نونبر', 'ثقافي تربوي', 'الاحتفال بذكرى المسيرة الخضراء وعيد الاستقلال'], ['دجنبر', 'تربوي فني', 'أناشيد ومسابقات في الرسم وحملة نظافة لفضاء ومحيط المؤسسة'], ['يناير', 'فني ثقافي', 'عرض مسرحيات وسكيتشات'], ['فبراير', 'ثقافي', 'مسابقات ثقافية'],
    ['مارس', 'اجتماعي صحي', 'حملة تحسيسية حول التضامن والتغذية المتوازنة لضمان صحة جيدة'], ['أبريل', 'رياضي', 'مقابلة في كرة القدم'], ['ماي', 'فني ثقافي', 'تنظيم أيام ربيعية وألعاب في الهواء الطلق'], ['يونيو', 'ثقافي فني تربوي', 'تنظيم حفل التميز']];
  add({
    k: 'cp_prog', t: 'برنامج العمل السنوي للتعاونية المدرسية', grp: 'cp_c', d: 'جدول الأنشطة شهرا بشهر: نوعها وموضوعها والمسؤولون عنها.', auto: 'اقتراحات قابلة للتعديل', page: 'a4',
    init: () => ({ rows: PROG.map(r => r.concat(['جميع أساتذة المؤسسة'])) }),
    defs: () => [{ note: 'اقتراحات جاهزة مستوحاة من برنامج سنوي نموذجي؛ عدّلها أو أضف أسطرا. الأسطر المتتالية لنفس الشهر تُدمج.' }, gridDef('rows', 'الأنشطة', ['الشهر', 'نوعية الأنشطة', 'موضوعها', 'المسؤول عنها'], { widths: ['.7fr', '1fr', '2fr', '1.4fr'] })],
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => nm(r[0]) || nm(r[2]));
      const rows = []; let i = 0;
      while (i < R.length) { let j = i; while (j < R.length && R[j][0] === R[i][0] && nm(R[i][0])) j++; if (j === i) j = i + 1; R.slice(i, j).forEach((r, n) => rows.push(tr((n === 0 ? [{ t: r[0], c: 'k b', r: j - i }] : []).concat([{ t: r[1], c: 'sm' }, { t: r[2], c: 'r' }, { t: r[3], c: 'sm' }])))); i = j; }
      return { title: 'برنامج العمل السنوي للتعاونية المدرسية', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'توقيع المنسق(ة)', left: 'إمضاء رئيس المؤسسة', noDate: true }), blocks: [tbl(hd(['التاريخ', 'نوعية الأنشطة', 'موضوعها', 'المسؤول عنها']), rows, 'big')] };
    }
  });

  /* 17 — بطاقة الأسبوع الوطني للتعاون المدرسي */
  const WEEK = [['تعاونية القسم', 'انتخاب أعضاء تعاونية القسم مع إشراك جميع التلاميذ في ذلك، واحترام ضوابط التعاونية.'], ['المجلة الحائطية ومتحف القسم', 'إعداد وتجديد المجلة الحائطية ومتحف القسم وإعداد ركن خاص بالقصص المدرسية.'], ['الأنشطة البيئية', 'تنظيف فضاء القسم والتحسيس بأهمية نظافته باستمرار، والعناية بالمغروسات.'], ['الأنشطة الثقافية', 'أنشطة ثقافية متنوعة: التلوين، أنشطة في الحساب والرياضيات، شريط فيديو حول الأسبوع.'], ['أنشطة رياضية', 'مسابقات رياضية: الجري، رمي الكرة لأبعد مسافة...']];
  add({
    k: 'cp_week', t: 'البطاقة التقنية لأنشطة الأسبوع الوطني للتعاون المدرسي', grp: 'cp_c', get d() { return isSecC() ? 'بطاقة المؤسسة: المنجَزات والتواريخ والمستفيدون.' : 'بطاقة لكل وحدة مدرسية: المنجَزات والتواريخ والمستفيدون.'; }, get auto() { return isSecC() ? 'لائحة الأساتذة' : 'الوحدات المدرسية ولائحة الأساتذة'; }, page: 'a4',
    init: (s, sy) => { const u = window.Board && !isSecC() ? Board.unitNames()[0] || '' : ''; const t = teachers().filter(e => !u || Board.sameU(e.unit, u)); return { unit: u, tNames: t.map(fullName).join(' - '), tCount: String(t.length || ''), pupils: isSecC() ? 'جميع تلاميذ المؤسسة' : 'جميع تلاميذ الوحدة المدرسية', from: '', to: '', who: isSecC() ? 'تلاميذ المؤسسة' : 'تلاميذ الوحدة', dur: 'حصص الأنشطة الموازية والتربية البدنية ونصف ساعة قبل نهاية الحصص الرسمية', rows: WEEK.map(r => r.slice()) }; },
    defs: () => [].concat(isSecC() ? [] : [{ k: 'unit', l: 'الوحدة المدرسية', half: true, list: 'k2Units' }], [{ k: 'tCount', l: 'عدد المدرسين', t: 'num', half: true }, { k: 'tNames', l: 'الأساتذة', t: 'area', rows: 2 }, { k: 'pupils', l: 'عدد التلاميذ', half: true }, { k: 'who', l: 'المستفيدون', half: true }, { k: 'from', l: 'من (تاريخ الإنجاز)', t: 'date', half: true }, { k: 'to', l: 'إلى', t: 'date', half: true }, { k: 'dur', l: 'المدة', t: 'area', rows: 2 },
      gridDef('rows', 'الأنشطة المنجزة', ['المجال', 'الأنشطة'], { widths: ['1fr', '2.6fr'] })]),
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
      return { title: 'بطاقة تقنية لأنشطة الأسبوع الوطني للتعاون المدرسي', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { three: ['الأستاذ(ة)', 'السيد المدير', 'السيد المفتش'] }),
        blocks: [kv2([['المؤسسة', s.school || '']].concat(isSecC() ? [] : [['الوحدة المدرسية', f.unit || '']], [['الأساتذة', f.tNames || ''], ['عدد المدرسين / عدد التلاميذ', `${f.tCount || ''} / ${f.pupils || ''}`], ['تاريخ الإنجاز', f.from ? `من ${ldate(f.from)}${f.to ? ' إلى ' + ldate(f.to) : ''}` : '..........'], ['المستفيدون', f.who || ''], ['المدة', f.dur || '']])),
          tbl(hd(['المجال', 'الأنشطة المنجزة']), R.map(r => tr([{ t: r[0], c: 'k b' }, { t: r[1], c: 'r' }])), 'big')] };
    }
  });

  B.reg({
    id: 'coop',
    groups: [['cp_a', 'التعاونية المدرسية — الحسابات والمراسلات المالية', 'تُحسب من معطيات التعاونية'], ['cp_b', 'التعاونية المدرسية — دفاتر المصاريف حسب المجالات'], ['cp_c', 'التعاونية المدرسية — المحاضر والبطاقات']],
    docs: () => DOCS,
    card: sy => { const c = calc(sy); return { title: 'التعاونية المدرسية', rows: [['مداخيل الاشتراكات', dh(c.gross)], ['حصة الفرع', dh(c.toBranch)], ['حصة المؤسسة + المنقول', dh(c.avail)], ['المصاريف', dh(c.spent)], ['الباقي', dh(c.left), c.left < 0 ? 'bad' : 'ok']] }; },
    dash: sy => { const c = calc(sy); return [['التعاونية: المصاريف', dh(c.spent)], ['التعاونية: الباقي', dh(c.left), c.left < 0 ? 'bad' : '']]; },
    calc, endBalance: sy => { const c = calc(sy); return { cash: c.cashEnd, postal: c.postalEnd }; }
  });
  window.Coop = { calc };
})();
