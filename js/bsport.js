'use strict';
/* الميزانية ← الجمعية الرياضية المدرسية: معطيات الجمعية، محضر استخلاص وتوزيع واجب الاشتراك (65/10/5/20)،
   طلب الإذن بالصرف (12 مجالا)، دفاتر المصاريف السبعة، موجز التقرير المالي */
(function () {
  const B = window.Budget;
  const { esc } = window.Docs;
  const { SB, tr, tbl, num, r2, ldate } = window.K;
  const { dh, m2, kv, kv2, hd, gridDef, blankRows, sumCol } = B;

  const SPLIT = [['الجمعية الرياضية المدرسية', '65', ''], ['فرع الجامعة بالمديرية الإقليمية', '10', ''], ['فرع الجامعة بالأكاديمية', '5', ''], ['الجامعة الملكية المغربية للرياضة المدرسية', '20', '']];
  const SPEND = ['مصاريف تسيير الجمعية الرياضية المدرسية', 'شراء العتاد الرياضي', 'صيانة وإصلاح العتاد الرياضي', 'إصلاح وصيانة المرافق الرياضية', 'شراء ألبسة رياضية لفرق المؤسسة', 'شراء أدوات الصيدلة', 'تنظيم تظاهرات رياضية على صعيد المؤسسة', 'نقل فرق المؤسسة', 'تغذية فرق المؤسسة', 'شراء الجوائز لتشجيع التلاميذ المتفوقين', 'حفلات استقبال وتكريم الأبطال الفائزين', 'شراء الكتب والمجلات المختصة'];
  const REG = [['أدوات المكتب', 'أدوات المكتب'], ['لوازم رياضية', 'اللوازم الرياضية'], ['العدو الريفي', 'الأنشطة الرياضية: العدو الريفي'], ['كرة القدم', 'الأنشطة الرياضية: كرة القدم'], ['الرياضات الجماعية', 'الأنشطة الرياضية: الرياضات الجماعية'], ['الرياضات الفردية', 'الأنشطة الرياضية: الرياضات الفردية'], ['مختلفات', 'مختلفات']];
  const nm = t => String(t || '').trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const member = (sy, role) => { const r = window.Board ? Board.members(sy, 'sport').find(x => x[2] === role && nm(x[0])) : null; return r ? r[0] : ''; };

  function calc(sy) {
    const f = B.F('sp_base', sy);
    const subs = num(f.subs), fee = num(f.fee), income = r2(subs * fee);
    const split = (f.split || []).filter(r => nm(r[0])).map(r => ({ n: r[0], p: num(r[1]), acc: r[2] || '', amt: r2(income * num(r[1]) / 100) }));
    const mine = split[0] ? split[0].amt : 0;
    const carry = num(f.carry), avail = r2(carry + mine);
    const regs = REG.map(([, t], i) => ({ n: t, spent: B.spentOf('sp_r' + (i + 1), sy) }));
    const spent = r2(regs.reduce((a, r) => a + r.spent, 0));
    return { f, subs, fee, income, split, mine, carry, avail, regs, spent, left: r2(avail - spent) };
  }
  const prevCarry = sy => { const p = B.prevSy(sy); return B.hasYear(p) && B.store(p).sp_base ? String(calc(p).left) : ''; };

  const DOCS = [];
  const add = d => DOCS.push(d);
  const head = (s, f) => kv([['الجمعية الرياضية', f.name || ''], ['تاريخ التأسيس', f.created ? ldate(f.created) : '..........'], ['اسم الرئيس', f.president || '..........'], ['اسم الأمين', f.treasurer || '..........']]);
  const signAmin = s => SB.sign(s, { right: 'توقيع الأمين', left: 'توقيع وخاتم رئيس الجمعية الرياضية' });

  add({
    k: 'sp_base', t: 'معطيات الجمعية الرياضية المدرسية', grp: 'sp_a', d: 'تُدخل مرة واحدة: المكتب، عدد المشتركين وقيمة الاشتراك، الرصيد المنقول ونسب التوزيع.', auto: 'لوائح التلاميذ ومكتب الجمعية (السبورة المرجعية) وأرصدة السنة السابقة',
    init: (s, sy) => {
      const p = B.pupilsCount(sy);
      return { name: `الجمعية الرياضية المدرسية لمؤسسة ${s.school || ''}`.trim(), created: '', president: member(sy, 'الرئيس'), treasurer: member(sy, 'الأمين'), pm: String(p.m), pf: String(p.f), subs: String(p.t || ''), fee: '20', carry: prevCarry(sy),
        office: 'مكتب الارتقاء بالرياضة المدرسية', split: SPLIT.map(r => r.slice()) };
    },
    defs: () => [{ sec: 'الجمعية' }, { k: 'name', l: 'اسم الجمعية' }, { k: 'created', l: 'تاريخ التأسيس', t: 'date', half: true }, { k: 'office', l: 'المكتب المختص بالمديرية', half: true }, { k: 'president', l: 'اسم الرئيس', half: true, list: 'k2Emps' }, { k: 'treasurer', l: 'اسم الأمين', half: true, list: 'k2Emps' },
      { sec: 'التلاميذ والاشتراكات' }, { k: 'pm', l: 'الذكور المسجلون', t: 'num', half: true }, { k: 'pf', l: 'الإناث المسجلات', t: 'num', half: true }, { k: 'subs', l: 'عدد التلاميذ المشتركين', t: 'num', half: true }, { k: 'fee', l: 'واجب الاشتراك السنوي لكل تلميذ (درهم)', t: 'money', half: true, hint: 'القيمة الافتراضية 20 درهما كما في النموذج المعتمد، عدّلها حسب سلكك' },
      { k: 'carry', l: 'الباقي من السنة المنصرمة (درهم)', t: 'money' },
      { sec: 'توزيع واجب الاشتراك' }, gridDef('split', '', ['الهيأة', 'النسبة %', 'رقم الحساب البريدي/البنكي'], { widths: ['2fr', '.7fr', '1.6fr'], types: ['text', 'num', 'text'], dirs: [null, null, 'ltr'], fixed: true })],
    build: (s, f, sy) => {
      const c = calc(sy);
      const sp = c.split.map(r => tr([{ t: r.n, c: 'r b' }, `${r.p}%`, { t: m2(r.amt), c: 'ltr' }, { t: r.acc, c: 'ltr sm' }]));
      sp.push(tr([{ t: 'المجموع', c: 'd b' }, { t: `${r2(c.split.reduce((a, r) => a + r.p, 0))}%`, c: 'd b' }, { t: m2(r2(c.split.reduce((a, r) => a + r.amt, 0))), c: 'd b ltr' }, { t: '', c: 'd' }]));
      return { title: 'معطيات الجمعية الرياضية المدرسية', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: signAmin(s),
        blocks: [head(s, f), kv([['عدد التلاميذ المسجلين', `${(num(f.pm) + num(f.pf)) || ''} (ذكور ${f.pm || 0} / إناث ${f.pf || 0})`], ['عدد التلاميذ المشتركين', String(c.subs || '')], ['واجب الاشتراك السنوي', dh(c.fee)], ['مجموع مداخيل الاشتراكات', dh(c.income)], ['الباقي من السنة المنصرمة', dh(c.carry)], ['الرصيد القابل للصرف', dh(c.avail)]]),
          tbl(hd(['الهيأة', 'النسبة', 'المبلغ', 'رقم الحساب']), sp, 'cmp')] };
    }
  });

  add({
    k: 'sp_split', t: 'محضر استخلاص وتوزيع واجب الاشتراك السنوي', grp: 'sp_a', d: 'يُعبأ في ثلاث نسخ مع تواصيل التحويل: حصة الجمعية (65%) وفرعا الجامعة والجامعة الملكية.', auto: 'معطيات الجمعية الرياضية', page: 'a4',
    init: (s, sy) => ({ city: s.city || '', date: '', d0: '', d1: '', d2: '', d3: '' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }].concat(SPLIT.map((r, i) => ({ k: 'd' + i, l: 'تاريخ تحويل: ' + r[0], t: 'date', half: true }))),
    build: (s, f, sy) => {
      const c = calc(sy), cf = c.f;
      const rows = c.split.map((r, i) => tr([{ t: `${r.n} (${r.p}%)`, c: 'r b' }, { t: m2(r.amt), c: 'ltr' }, f['d' + i] ? ldate(f['d' + i]) : '', { t: r.acc, c: 'ltr sm' }]));
      return { title: 'محضر استخلاص وتوزيع واجب الاشتراك السنوي بالجمعية الرياضية المدرسية', sub: 'الجامعة الملكية المغربية للرياضة المدرسية', page: 'a4', sign: SB.sign(s, { three: ['أمين مال الجمعية الرياضية', 'مسؤول المصالح الاقتصادية', 'رئيس الجمعية الرياضية'] }),
        blocks: [kv([['المديرية الإقليمية', s.directorate || ''], ['البلدة', s.city || s.commune || ''], ['الجمعية الرياضية المدرسية لمؤسسة', s.school || ''], ['السلك', s.cycle || 'تعليم ابتدائي'], ['مجموع التلاميذ المسجلين', String((num(cf.pm) + num(cf.pf)) || '')], ['ذكور / إناث', `${cf.pm || 0} / ${cf.pf || 0}`], ['قيمة واجب الاشتراك السنوي', dh(c.fee)], ['مجموع مداخيل الجمعية من الاشتراكات', dh(c.income)]]),
          tbl(hd(['تحويل الحصص', 'المبلغ المحول', 'تاريخ التحويل', 'رقم الحساب البريدي/البنكي']), rows, 'big'),
          { html: `<p class="sb-p" style="margin-top:3mm">وحرر ب: ${esc(f.city || s.city || '..........')} في: ${esc(f.date ? ldate(f.date) : '..........')}</p><p class="sb-p"><b>ملحوظة:</b> يعبأ المطبوع في ثلاث نسخ وكل نسخة مصحوبة بتواصيل التحويل.</p>` }] };
    }
  });

  add({
    k: 'sp_auth', t: 'طلب الإذن بالصرف من مداخيل الجمعية الرياضية', grp: 'sp_a', d: 'المبالغ المقترحة لكل مجال من المجالات الاثني عشر والرصيد قبل وبعد الصرف.', auto: 'معطيات الجمعية الرياضية', page: 'a4',
    init: (s, sy) => ({ no: '', date: '', amounts: SPEND.map(n => [n, '']) }),
    defs: () => [{ k: 'no', l: 'تحت عدد', half: true }, { k: 'date', l: 'أُرسل بتاريخ', t: 'date', half: true }, gridDef('amounts', 'المبالغ المقترحة حسب المجال', ['المجال', 'المبلغ المقترح (درهم)'], { widths: ['2.2fr', '1fr'], types: ['ro', 'num'], fixed: true })],
    build: (s, f, sy) => {
      const c = calc(sy), A = f.amounts || SPEND.map(n => [n, '']);
      const tot = sumCol(A, 1);
      const rows = SPEND.map((n, i) => tr([i + 1, { t: n, c: 'r b' }, { t: num((A[i] || [])[1]) ? m2(num(A[i][1])) : '', c: 'ltr' }, ''])).concat([tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(tot), c: 'd b ltr' }, { t: '', c: 'd' }])]);
      return { title: 'طلب الإذن بالصرف من مداخيل الجمعية الرياضية', sub: `للموسم الدراسي ${syText(sy)}`, page: 'a4', sign: signAmin(s),
        blocks: [head(s, c.f), tbl(hd(['ر.ت', 'المجالات', 'المبالغ المقترحة', 'خاص بالمديرية']), rows, 'cmp'),
          kv([['الباقي من السنة المنصرمة', dh(c.carry)], ['مداخيل السنة الجارية', dh(c.mine)], ['المجموع', dh(c.avail)], ['المبلغ المراد صرفه', dh(tot)], ['الباقي', dh(c.avail - tot)], ['أرسل بتاريخ / تحت عدد', `${f.date ? ldate(f.date) : '..........'} / ${f.no || '..........'}`]])] };
    }
  });

  REG.forEach(([, t], i) => add(B.regDoc({
    k: 'sp_r' + (i + 1), t: `دفتر مصاريف: ${t}`, grp: 'sp_b', title: `مصاريف الجمعية الرياضية: ${t}`, d: `عمليات الصرف المؤرخة لمجال «${t}».`, auto: 'رصيد الجمعية من معطياتها', signer: 'توقيع الأمين',
    top: (sy, spent) => { const c = calc(sy); return [['رصيد الجمعية', dh(c.avail)], ['مجموع مصاريف الجمعية', dh(c.spent)], ['مصاريف هذا المجال', dh(spent)], ['الباقي بعد الصرف', dh(c.left)]]; }
  })));

  add({
    k: 'sp_summary', t: 'موجز التقرير المالي للجمعية الرياضية', grp: 'sp_a', d: 'المصاريف حسب المجالات السبعة والرصيد المتبقي إلى غاية آخر عملية.', auto: 'دفاتر المصاريف السبعة', page: 'a4',
    init: () => ({ date: '' }), defs: () => [{ k: 'date', l: 'التاريخ (فارغ = تاريخ اليوم)', t: 'date' }],
    build: (s, f, sy) => {
      const c = calc(sy);
      const rows = c.regs.map((r, i) => tr([i + 1, { t: r.n, c: 'r b' }, { t: m2(r.spent), c: 'ltr' }, '']));
      rows.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(c.spent), c: 'd b ltr' }, { t: '', c: 'd' }]));
      return { title: 'موجز التقرير المالي إلى غاية آخر عملية', sub: `للموسم الدراسي ${syText(sy)} — التاريخ: ${ldate(f.date || window.Docs.todayIso())}`, page: 'a4', sign: signAmin(s),
        blocks: [head(s, c.f), tbl(hd(['ر.ت', 'المجالات', 'المبالغ المصروفة', 'ملاحظات']), rows, 'cmp'),
          kv2([['الباقي من السنة المنصرمة', dh(c.carry)], ['مداخيل السنة الجارية', dh(c.mine)], ['المجموع', dh(c.avail)], ['المبلغ المصروف', dh(c.spent)], ['الباقي', dh(c.left)]])] };
    }
  });

  B.reg({
    id: 'sport',
    groups: [['sp_a', 'الجمعية الرياضية المدرسية — الحسابات والمراسلات', 'تُحسب من معطيات الجمعية'], ['sp_b', 'الجمعية الرياضية المدرسية — دفاتر المصاريف']],
    docs: () => DOCS,
    card: sy => { const c = calc(sy); return { title: 'الجمعية الرياضية المدرسية', rows: [['مداخيل الاشتراكات', dh(c.income)], ['حصة الجمعية (65%)', dh(c.mine)], ['الرصيد القابل للصرف', dh(c.avail)], ['المصاريف', dh(c.spent)], ['الباقي', dh(c.left), c.left < 0 ? 'bad' : 'ok']] }; },
    dash: sy => { const c = calc(sy); return [['الجمعية الرياضية: الباقي', dh(c.left), c.left < 0 ? 'bad' : '']]; }
  });
  window.Sport = { calc };
})();
