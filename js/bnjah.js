'use strict';
/* الميزانية ← جمعية دعم مدرسة النجاح: مسك المحاسبة (يومية العمليات، سجل البنك، سجل الصندوق، أبواب المداخيل والمصاريف)،
   الميزانية التقديرية، التقرير المالي السنوي، وصل استلام، أمر بالأداء، محضر المصادقة، لائحة الحاجيات */
(function () {
  const B = window.Budget;
  const { esc } = window.Docs;
  const { SB, tr, tbl, num, r2, ldate, tafqit, textBlocks, tokens } = window.K;
  const { dh, m2, kv, kv2, hd, gridDef, blankRows, sumCol } = B;

  // Chapters follow «دليل مسطري التدبير المالي لجمعيات دعم مدرسة النجاح» (resources §2, spending domains §3.1)
  const INC = ['مداخيل قارة: واجب الانخراط السنوي للأعضاء', 'مداخيل الأنشطة: اشتراكات المستفيدين', 'مداخيل الأنشطة: مقابل الخدمات', 'مداخيل الأنشطة: مقابل المنتوجات', 'المنح: منحة المديرية الإقليمية (مشروع المؤسسة)', 'المنح: منح المجالس الترابية', 'المنح: القطاع الخاص والمؤسسات الشريكة', 'المنح: منحة الإدارة المركزية', 'الهبات والتبرعات', 'مداخيل استثنائية'];
  const LINES = {
    'نفقات الأندية التربوية': ['كراء أو شراء الأغطية والألبسة الخاصة بالأندية (المسرح، الفنون التشكيلية...)', 'مصاريف الحفلات والاستقبال المتعلقة بأنشطة الأندية', 'مصاريف التواصل والنشر والكتب والمراجع والخرجات الدراسية', 'مكتريات صغيرة مرتبطة بخدمات التنشيط'],
    'نفقات التظاهرات المدرسية': ['المساهمة في مصاريف تنقل وتغذية التلاميذ المشاركين في التظاهرات', 'المساهمة في نفقات التغذية المرتبطة بالاستقبالات', 'كراء معدات المناسبات والملصقات'],
    'نفقات تشجيع التميز والإبداع والابتكار': ['توزيع الجوائز على التلاميذ المتميزين', 'توزيع الجوائز على الأطر التربوية والإدارية لتشجيع الإبداع والابتكار', 'الطبع والنسخ والتصوير الخاصة بعمليات التميز والإبداع'],
    'نفقات التوجيه': ['مصاريف التنقل والطبع والنشر والاستنساخ', 'مصاريف الحفلات والاستقبال والتواصل', 'مساعدة المتعلمين على بناء مشروعهم الشخصي'],
    'نفقات الدعم التربوي': ['شراء وطبع ونسخ مراجع وعدد الدعم', 'الأدوات والوسائل اللازمة لتفعيل برامج الدعم'],
    'نفقات الدعم الاجتماعي والتربوي': ['المساهمة في شراء الملابس واللوازم المدرسية', 'دعم الصحة المدرسية (نظارات طبية، سماعات...)', 'الدعم النفسي: لوازم خلية الإنصات والوساطة والمطبوعات والنقل', 'إنتاج وتصوير مواد رقمية (بعد موافقة المدير الإقليمي)'],
    'نفقات التدبير والشراكة': ['مصاريف اللوازم المكتبية والتعليمية والمعلوماتية الصغيرة (أقراص مدمجة، حبر الطابعة...)', 'مصاريف اللوازم الطبية (Kits médicaux)', 'نقل البضائع', 'مصاريف البريد والبنك واستنساخ الوثائق', 'تكوين الأطر التربوية والإدارية (بعد موافقة المدير الإقليمي)'],
    'نفقات التجهيزات': ['عتاد خاص بذوي الاحتياجات الخاصة', 'تجهيزات القاعة متعددة التخصصات ذات الكلفة المحدودة', 'معدات المكتبة والمعلوميات والرياضة والسمعي البصري والبستنة والموسيقى', 'عتاد خلية الإنصات والوساطة وقاعة الموارد'],
    'نفقات الصيانة الوقائية وأعمال التأهيل الخفيف': ['لوازم صحية', 'العقاقير والصباغة', 'صيانة وإصلاح تجهيزات المؤسسة وتركيب الأثاث', 'لوازم النظافة والتطهير وصيانة المرافق الصحية'],
    'نفقات استثنائية': ['نفقات ناتجة عن ظروف استثنائية (انهيار سور أو عطب مفاجئ) بعد موافقة المدير الإقليمي']
  };
  const EXP = Object.keys(LINES);
  const CEIL = { equip: 20000, grantMin: 100000, grantMax: 160000, cashOp: 1500, cashBox: 5000 };
  const nm = t => String(t || '').trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const isCash = r => /صندوق|نقد|caisse|cash/i.test(String(r || ''));
  const member = (sy, role) => { const r = window.Board ? Board.members(sy, 'najah').find(x => x[2] === role && nm(x[0])) : null; return r ? r[0] : ''; };

  /* ---------- the ledger ---------- */
  function calc(sy) {
    const f = B.F('nj_base', sy), J = (B.F('nj_journal', sy).rows || []).filter(r => r[0] || nm(r[2]) || num(r[5]) || num(r[6]));
    const incCh = (f.incCh || []).filter(r => nm(r[0])), expCh = (f.expCh || []).filter(r => nm(r[0]));
    const sort = J.slice().sort((a, b) => String(a[0] || '9999').localeCompare(String(b[0] || '9999')));
    const carryBank = num(f.carryBank), carryCash = num(f.carryCash);
    const sumBy = (pred, c) => r2(J.filter(pred).reduce((a, r) => a + num(r[c]), 0));
    const bankIn = sumBy(r => !isCash(r[3]), 5), bankOut = sumBy(r => !isCash(r[3]), 6), cashIn = sumBy(r => isCash(r[3]), 5), cashOut = sumBy(r => isCash(r[3]), 6);
    const chapter = (list, col) => {
      const rows = list.map(r => ({ n: r[0], est: num(r[1]), real: sumBy(x => nm(x[4]) === nm(r[0]), col) }));
      const known = new Set(list.map(r => nm(r[0])));
      const other = sumBy(x => !known.has(nm(x[4])), col);
      if (other) rows.push({ n: 'أبواب غير مصنفة', est: 0, real: other });
      rows.forEach(r => { r.diff = r2(r.real - r.est); });
      return rows;
    };
    const inc = chapter(incCh, 5), exp = chapter(expCh, 6);
    const income = r2(bankIn + cashIn), expense = r2(bankOut + cashOut);
    return { f, J, sort, carryBank, carryCash, bankIn, bankOut, cashIn, cashOut, bankEnd: r2(carryBank + bankIn - bankOut), cashEnd: r2(carryCash + cashIn - cashOut), inc, exp, income, expense,
      estInc: r2(inc.reduce((a, r) => a + r.est, 0)), estExp: r2(exp.reduce((a, r) => a + r.est, 0)) };
  }
  const prevEnd = sy => { const p = B.prevSy(sy); if (!B.hasYear(p) || !B.store(p).nj_base) return { bank: '', cash: '' }; const c = calc(p); return { bank: String(c.bankEnd), cash: String(c.cashEnd) }; };
  const chapters = sy => { const f = B.F('nj_base', sy); return (f.incCh || []).concat(f.expCh || []).map(r => r[0]).filter(nm); };

  const DOCS = [];
  const add = d => DOCS.push(d);
  const head = (s, c) => kv([['الجمعية', c.f.name || ''], ['المؤسسة', s.school || ''], ['الحساب البنكي', `${c.f.bank || ''} ${c.f.bankAcc || ''}`.trim() || '..........'], ['رقم وصل الإيداع', c.f.approvalNo || '..........']]);
  const signT = s => SB.sign(s, { three: ['أمين مال الجمعية', 'رئيس الجمعية', 'رئيس المؤسسة'] });

  add({
    k: 'nj_base', t: 'معطيات الجمعية والأبواب والتقديرات', grp: 'nj_a', d: 'تعريف الجمعية، الحساب البنكي، الأرصدة المنقولة، أبواب المداخيل والمصاريف وتقديراتها.', auto: 'مكتب الجمعية (السبورة المرجعية) وأرصدة السنة السابقة',
    init: (s, sy) => { const pe = prevEnd(sy); return { name: `جمعية دعم مدرسة النجاح — ${s.school || ''}`.trim(), approvalNo: '', created: '', bank: '', bankAcc: '', president: member(sy, 'الرئيس'), secretary: member(sy, 'الكاتب'), treasurer: member(sy, 'الأمين'), carryBank: pe.bank, carryCash: pe.cash, incCh: INC.map(n => [n, '']), expCh: EXP.map(n => [n, '']) }; },
    defs: () => [{ sec: 'الجمعية' }, { k: 'name', l: 'اسم الجمعية' }, { k: 'approvalNo', l: 'رقم وصل الإيداع القانوني', half: true }, { k: 'created', l: 'تاريخ التأسيس', t: 'date', half: true }, { k: 'president', l: 'الرئيس', half: true, list: 'k2Emps' }, { k: 'secretary', l: 'الكاتب', half: true, list: 'k2Emps' }, { k: 'treasurer', l: 'أمين المال', half: true, list: 'k2Emps' },
      { k: 'bank', l: 'البنك', half: true }, { k: 'bankAcc', l: 'رقم الحساب البنكي', half: true, dir: 'ltr' },
      { sec: 'الأرصدة المنقولة من السنة الماضية' }, { k: 'carryBank', l: 'الرصيد بالبنك', t: 'money', half: true }, { k: 'carryCash', l: 'الرصيد بالصندوق', t: 'money', half: true },
      { sec: 'أبواب المداخيل (وتقديراتها للسنة)' }, { note: 'الأبواب الجاهزة اقتراحات قابلة للتعديل والإضافة؛ تُستعمل أسماؤها في يومية العمليات والتقرير المالي.' }, gridDef('incCh', '', ['الباب', 'المبلغ التقديري'], { widths: ['2.4fr', '1fr'], types: ['text', 'num'] }),
      { sec: 'أبواب المصاريف (وتقديراتها للسنة)' }, gridDef('expCh', '', ['الباب', 'المبلغ التقديري'], { widths: ['2.4fr', '1fr'], types: ['text', 'num'] })],
    build: (s, f, sy) => {
      const c = calc(sy);
      return { title: 'معطيات جمعية دعم مدرسة النجاح', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: signT(s),
        blocks: [head(s, c), kv([['الرئيس', f.president || ''], ['الكاتب', f.secretary || ''], ['أمين المال', f.treasurer || ''], ['تاريخ التأسيس', f.created ? ldate(f.created) : '..........'], ['الرصيد المنقول بالبنك', dh(c.carryBank)], ['الرصيد المنقول بالصندوق', dh(c.carryCash)]]),
          SB.cap('أبواب المداخيل'), tbl(hd(['ر.ت', 'الباب', 'التقدير']), c.inc.map((r, i) => tr([i + 1, { t: r.n, c: 'r' }, { t: m2(r.est), c: 'ltr' }])), 'cmp'),
          SB.cap('أبواب المصاريف'), tbl(hd(['ر.ت', 'الباب', 'التقدير']), c.exp.map((r, i) => tr([i + 1, { t: r.n, c: 'r' }, { t: m2(r.est), c: 'ltr' }])), 'cmp')] };
    }
  });

  add({
    k: 'nj_journal', t: 'يومية العمليات المالية', grp: 'nj_a', d: 'سجّل كل عملية (مدخول أو مصروف) مرة واحدة؛ تنتقل إلى سجل البنك والصندوق والتقرير المالي.', auto: 'أبواب الجمعية', page: 'a4l',
    init: () => ({ rows: [['', '', '', 'البنك', '', '', ''], ['', '', '', 'البنك', '', '', ''], ['', '', '', 'الصندوق', '', '', '']] }),
    defs: (f, sy) => [{ note: 'السجل: «البنك» أو «الصندوق». الباب: اختر من أبواب الجمعية. اكتب المبلغ في خانة «مداخيل» أو «مصاريف».' },
      gridDef('rows', 'العمليات', ['التاريخ', 'المرجع', 'العملية', 'السجل', 'الباب', 'مداخيل', 'مصاريف'], { widths: ['.95fr', '.75fr', '1.8fr', '.8fr', '1.5fr', '.8fr', '.8fr'], types: ['date', 'text', 'text', 'text', 'text', 'num', 'num'], list: [null, null, null, 'nj_reg', 'nj_ch', null, null], dls: { nj_reg: ['البنك', 'الصندوق'], nj_ch: () => chapters(sy) } })],
    build: (s, f, sy) => {
      const c = calc(sy);
      const rows = c.sort.map((r, i) => tr([i + 1, r[0] ? ldate(r[0]) : '', { t: r[1], c: 'sm' }, { t: r[2], c: 'r' }, r[3], { t: r[4], c: 'sm' }, { t: num(r[5]) ? m2(num(r[5])) : '', c: 'ltr' }, { t: num(r[6]) ? m2(num(r[6])) : '', c: 'ltr' }]));
      rows.push(tr([{ t: 'المجموع', s: 6, c: 'd b' }, { t: m2(c.income), c: 'd b ltr' }, { t: m2(c.expense), c: 'd b ltr' }]));
      return { title: 'يومية العمليات المالية', sub: `جمعية دعم مدرسة النجاح — الموسم الدراسي ${syText(sy)}`, page: 'a4l', sign: signT(s),
        blocks: [tbl(hd(['ر.ت', 'التاريخ', 'المرجع', 'العملية', 'السجل', 'الباب', 'مداخيل', 'مصاريف']), rows.length > 1 ? rows : blankRows([], 12, 8).concat(rows), 'cmp')] };
    }
  });

  const registerDoc = (k, t, cash) => add({
    k, t, grp: 'nj_a', d: cash ? 'سجل عمليات الصندوق مع الرصيد التراكمي.' : 'سجل عمليات الحساب البنكي مع الرصيد التراكمي.', auto: 'يومية العمليات', page: 'a4l',
    init: () => ({}), defs: () => [{ note: 'يُحسب تلقائيا من «يومية العمليات المالية».' }],
    build: (s, f, sy) => {
      const c = calc(sy), list = c.sort.filter(r => isCash(r[3]) === cash);
      let bal = cash ? c.carryCash : c.carryBank;
      const rows = [tr([{ t: 'الرصيد المنقول من السنة الماضية', s: 7, c: 'r b' }, { t: m2(bal), c: 'ltr b' }])]
        .concat(list.map((r, i) => { bal = r2(bal + num(r[5]) - num(r[6])); return tr([i + 1, r[0] ? ldate(r[0]) : '', { t: r[1], c: 'sm' }, { t: r[2], c: 'r' }, { t: r[4], c: 'sm' }, { t: num(r[5]) ? m2(num(r[5])) : '', c: 'ltr' }, { t: num(r[6]) ? m2(num(r[6])) : '', c: 'ltr' }, { t: m2(bal), c: 'ltr b' }]); }));
      const inn = cash ? c.cashIn : c.bankIn, out = cash ? c.cashOut : c.bankOut;
      rows.push(tr([{ t: 'المجموع', s: 5, c: 'd b' }, { t: m2(inn), c: 'd b ltr' }, { t: m2(out), c: 'd b ltr' }, { t: m2(bal), c: 'd b ltr' }]));
      return { title: t, sub: `جمعية دعم مدرسة النجاح — الموسم الدراسي ${syText(sy)}`, page: 'a4l', sign: signT(s),
        blocks: [tbl(hd(['ر.ت', 'التاريخ', 'المرجع', 'العملية', 'الباب', 'مداخيل', 'مصاريف', 'الرصيد']), rows, 'cmp')] };
    }
  });
  registerDoc('nj_bank', 'سجل الحساب البنكي', false);
  registerDoc('nj_cashbook', 'سجل الصندوق', true);

  add({
    k: 'nj_budget', t: 'الميزانية التقديرية للسنة', grp: 'nj_b', d: 'تقديرات المداخيل والمصاريف حسب الأبواب، تُعرض على الجمع العام.', auto: 'أبواب الجمعية وتقديراتها', page: 'a4',
    init: () => ({ n: '' }), defs: () => [{ note: 'تُعدَّل التقديرات من «معطيات الجمعية والأبواب». الرصيد المنقول يُضاف إلى المداخيل.' }],
    build: (s, f, sy) => {
      const c = calc(sy), carry = r2(c.carryBank + c.carryCash), totalIn = r2(c.estInc + carry);
      const mk = (list, tot) => list.map((r, i) => tr([i + 1, { t: r.n, c: 'r b' }, { t: m2(r.est), c: 'ltr' }])).concat([tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(tot), c: 'd b ltr' }])]);
      return { title: 'الميزانية التقديرية', sub: `جمعية دعم مدرسة النجاح — السنة الدراسية ${syText(sy)}`, page: 'a4', sign: signT(s),
        blocks: [SB.cap('المداخيل المتوقعة'), tbl(hd(['ر.ت', 'الباب', 'المبلغ']), mk(c.inc, c.estInc), 'cmp'), kv2([['الرصيد المنقول (بنك + صندوق)', dh(carry)], ['مجموع الموارد', dh(totalIn)]]),
          SB.cap('المصاريف المتوقعة'), tbl(hd(['ر.ت', 'الباب', 'المبلغ']), mk(c.exp, c.estExp), 'cmp'), kv2([['الفرق (الموارد − المصاريف)', dh(totalIn - c.estExp)]])] };
    }
  });

  add({
    k: 'nj_report', t: 'التقرير المالي السنوي', grp: 'nj_b', d: 'التقديرات مقابل المنجز لكل باب، والأرصدة النهائية بالبنك والصندوق.', auto: 'يومية العمليات وأبواب الجمعية', page: 'a4',
    init: (s) => ({ city: s.city || '', date: '' }), defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }],
    build: (s, f, sy) => {
      const c = calc(sy);
      const mk = (list, ti, tr_) => list.map((r, i) => tr([i + 1, { t: r.n, c: 'r b' }, { t: m2(r.est), c: 'ltr' }, { t: m2(r.real), c: 'ltr' }, { t: m2(r.diff), c: 'ltr' }])).concat([tr([{ t: 'المجموع', s: 2, c: 'd b' }, { t: m2(ti), c: 'd b ltr' }, { t: m2(tr_), c: 'd b ltr' }, { t: m2(r2(tr_ - ti)), c: 'd b ltr' }])]);
      return { title: 'التقرير المالي السنوي', sub: `جمعية دعم مدرسة النجاح — السنة الدراسية ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { three: ['أمين مال الجمعية', 'رئيس الجمعية', `حرر ب ${esc(f.city || s.city || '')} في ${esc(f.date ? ldate(f.date) : '..........')}`] }),
        blocks: [head(s, c), SB.cap('المداخيل'), tbl(hd(['ر.ت', 'الباب', 'التقديرات', 'المنجز', 'الفرق']), mk(c.inc, c.estInc, c.income), 'cmp'), SB.cap('المصاريف'), tbl(hd(['ر.ت', 'الباب', 'التقديرات', 'المنجز', 'الفرق']), mk(c.exp, c.estExp, c.expense), 'cmp'),
          SB.cap('الوضعية النهائية'), tbl(hd(['', 'المنقول', 'المداخيل', 'المصاريف', 'الرصيد النهائي']), [tr([{ t: 'البنك', c: 'k b' }, { t: m2(c.carryBank), c: 'ltr' }, { t: m2(c.bankIn), c: 'ltr' }, { t: m2(c.bankOut), c: 'ltr' }, { t: m2(c.bankEnd), c: 'ltr b' }]), tr([{ t: 'الصندوق', c: 'k b' }, { t: m2(c.carryCash), c: 'ltr' }, { t: m2(c.cashIn), c: 'ltr' }, { t: m2(c.cashOut), c: 'ltr' }, { t: m2(c.cashEnd), c: 'ltr b' }]),
            tr([{ t: 'المجموع', c: 'd b' }, { t: m2(r2(c.carryBank + c.carryCash)), c: 'd b ltr' }, { t: m2(c.income), c: 'd b ltr' }, { t: m2(c.expense), c: 'd b ltr' }, { t: m2(r2(c.bankEnd + c.cashEnd)), c: 'd b ltr' }])], 'cmp')] };
    }
  });

  /* receipt & payment order — two copies on the page */
  const twice = html => ({ html: `${html('الأصل')}<div style="border-top:1px dashed #777;margin:5mm 0 4mm"></div>${html('نسخة')}` });
  const paper = (title, tag, rows) => `<div style="border:1.2px solid #1f3864;padding:3mm 4mm"><div style="display:flex;justify-content:space-between;font-weight:700;color:#1f3864;margin-bottom:2mm"><span>${title}</span><span>${tag}</span></div>${rows}</div>`;
  add({
    k: 'nj_receipt', t: 'وصل استلام مبلغ (مدخول)', grp: 'nj_c', d: 'وصل بنسختين لكل مبلغ يُستلم، مع المبلغ بالحروف.', auto: 'أبواب الجمعية', page: 'a4',
    init: (s, sy) => ({ no: '', date: '', payer: '', amount: '', reason: '', mode: 'نقدا', chapter: '' }),
    defs: (f, sy) => [{ k: 'no', l: 'رقم الوصل', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'payer', l: 'استُلم من', half: true }, { k: 'amount', l: 'المبلغ (درهم)', t: 'money', half: true }, { k: 'reason', l: 'بيان الدفع', half: false }, { k: 'mode', l: 'طريقة الأداء', half: true, list: 'nj_mode' }, { k: 'chapter', l: 'الباب', half: true, list: 'nj_ch2', dls: { nj_mode: ['نقدا', 'شيك', 'تحويل بنكي'], nj_ch2: () => chapters(sy) } }],
    build: (s, f, sy) => {
      const row = (a, b) => `<div style="margin:1.6mm 0"><b>${a}</b> ${esc(b)}</div>`;
      const body = tag => paper('وصل استلام مبلغ', `${esc(tag)} — رقم: ${esc(f.no || '......')}`,
        row('استلمت جمعية دعم مدرسة النجاح من السيد(ة):', f.payer || '..................................') + row('مبلغا قدره:', `${f.amount ? m2(num(f.amount)) + ' درهم' : '...........'}`) + row('بالحروف:', f.amount ? tafqit(f.amount) : '..................................') +
        row('وذلك مقابل:', f.reason || '..................................') + row('طريقة الأداء:', `${f.mode || ''}${f.chapter ? ' — الباب: ' + f.chapter : ''}`) +
        `<div style="display:flex;justify-content:space-between;margin-top:4mm"><span>${esc(s.city || '')} في: ${esc(f.date ? ldate(f.date) : '..........')}</span><span>توقيع أمين المال</span></div><div style="height:14mm"></div>`);
      return { title: 'وصل استلام مبلغ', sub: `جمعية دعم مدرسة النجاح — ${esc(s.school || '')}`, page: 'a4', sign: false, blocks: [twice(body)] };
    }
  });
  add({
    k: 'nj_order', t: 'أمر بالأداء (مصروف)', grp: 'nj_c', d: 'أمر بصرف مبلغ لفائدة مستفيد مع المبلغ بالحروف وتوقيعات الرئيس وأمين المال.', auto: 'أبواب الجمعية', page: 'a4',
    init: () => ({ no: '', date: '', who: '', amount: '', reason: '', mode: 'شيك', ref: '', chapter: '' }),
    defs: (f, sy) => [{ k: 'no', l: 'رقم الأمر', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'who', l: 'المستفيد', half: true }, { k: 'amount', l: 'المبلغ (درهم)', t: 'money', half: true }, { k: 'reason', l: 'موضوع الصرف' }, { k: 'mode', l: 'طريقة الأداء', half: true, list: 'nj_mode2' }, { k: 'ref', l: 'رقم الشيك/المرجع', half: true }, { k: 'chapter', l: 'الباب', list: 'nj_ch3', dls: { nj_mode2: ['شيك', 'نقدا', 'تحويل بنكي'], nj_ch3: () => chapters(sy) } }],
    build: (s, f, sy) => {
      const row = (a, b) => `<div style="margin:1.8mm 0"><b>${a}</b> ${esc(b)}</div>`;
      const body = tag => paper('أمر بالأداء', `${esc(tag)} — رقم: ${esc(f.no || '......')}`,
        row('يؤدى من حساب جمعية دعم مدرسة النجاح لفائدة:', f.who || '..................................') + row('مبلغ:', f.amount ? `${m2(num(f.amount))} درهم (${tafqit(f.amount)})` : '...........') + row('في موضوع:', f.reason || '..................................') +
        row('طريقة الأداء:', `${f.mode || ''}${f.ref ? ' رقم ' + f.ref : ''}${f.chapter ? ' — الباب: ' + f.chapter : ''}`) +
        `<div style="display:flex;justify-content:space-between;margin-top:4mm;text-align:center"><span>${esc(s.city || '')} في: ${esc(f.date ? ldate(f.date) : '..........')}</span><span>أمين المال</span><span>رئيس الجمعية</span><span>المستفيد</span></div><div style="height:14mm"></div>`);
      return { title: 'أمر بالأداء', sub: `جمعية دعم مدرسة النجاح — ${esc(s.school || '')}`, page: 'a4', sign: false, blocks: [twice(body)] };
    }
  });

  const MIN_BODY = `# التقرير الأدبي:
تلا رئيس الجمعية التقرير الأدبي للسنة الدراسية {{sy}} متضمنا أهم الأنشطة التربوية والاجتماعية التي ساهمت الجمعية في إنجازها لفائدة التلاميذ، وتمت المصادقة عليه.
# التقرير المالي:
قدم أمين المال التقرير المالي للسنة الدراسية {{sy}}، وأوضح أن مجموع المداخيل بلغ {{income}} وأن مجموع المصاريف بلغ {{expense}}، وأن الرصيد النهائي هو {{bank}} بالحساب البنكي و{{cash}} بالصندوق. وبعد المناقشة تمت المصادقة عليه.
# مناقشة حاجيات المؤسسة وبرمجة ميزانية السنة المقبلة:
تدارس الأعضاء حاجيات المؤسسة من التجهيزات واللوازم والأنشطة، واقترحوا ترتيبها حسب الأولوية في حدود موارد الجمعية، وصادقوا على الميزانية التقديرية للسنة المقبلة.
# ما استجد من أعمال:
لم يتقدم أي عضو بنقطة أخرى، ورفعت الجلسة في الساعة {{endtime}} بعد تلاوة التوصيات.`;
  add({
    k: 'nj_minutes', t: 'محضر الجمع العام: المصادقة على التقريرين الأدبي والمالي', grp: 'nj_c', d: 'محضر جاهز بالأرقام المحسوبة (مداخيل، مصاريف، أرصدة) قابل للتعديل.', auto: 'المحاسبة والمكتب', page: 'a4',
    init: (s, sy) => ({ city: s.city || '', date: '', time: 'العاشرة صباحا', endtime: 'الثانية عشرة زوالا', place: s.school || '', members: '', body: MIN_BODY }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'تاريخ الجمع العام', t: 'date', half: true }, { k: 'time', l: 'ساعة الافتتاح', half: true }, { k: 'endtime', l: 'ساعة الاختتام', half: true }, { k: 'place', l: 'المكان', half: true }, { k: 'members', l: 'عدد الحاضرين', t: 'num', half: true },
      { note: 'المقاطع المسبوقة بـ # عناوين. تُستبدل {{income}} {{expense}} {{bank}} {{cash}} {{sy}} بالأرقام المحسوبة.' }, { k: 'body', l: 'نص المحضر', t: 'area', rows: 14 }],
    build: (s, f, sy) => {
      const c = calc(sy), ctx = tokens({ income: dh(c.income), expense: dh(c.expense), bank: dh(c.bankEnd), cash: dh(c.cashEnd), endtime: f.endtime });
      const blocks = [{ html: `<div style="text-align:left;font-weight:700;margin:0 0 2mm">${esc(f.city || s.city || '')} في: ${esc(f.date ? ldate(f.date) : '..........')}</div>` },
        { html: `<p class="sb-p">في يوم ${esc(f.date ? K.dayName(f.date) + ' ' + ldate(f.date) : '..........')} على الساعة ${esc(f.time || '..........')} اجتمع أعضاء جمعية دعم مدرسة النجاح بـ ${esc(f.place || s.school || '')}، بحضور ${esc(f.members || '......')} عضوا، وذلك لدراسة جدول الأعمال التالي: التقرير الأدبي، التقرير المالي، حاجيات المؤسسة والميزانية المقبلة.</p>` }]
        .concat(textBlocks(f.body, ctx));
      return { title: 'محضر الجمع العام للجمعية', sub: `جمعية دعم مدرسة النجاح — السنة الدراسية ${syText(sy)}`, page: 'a4', blocks, sign: SB.sign(s, { right: 'كاتب الجمعية', left: 'رئيس الجمعية' }) };
    }
  });

  add({
    k: 'nj_needs', t: 'لائحة حاجيات المؤسسة وتقدير كلفتها', grp: 'nj_c', d: 'الحاجيات المقترحة من الجمع العام مع الكمية والكلفة والأولوية.', auto: 'تُملأ يدويا', page: 'a4',
    init: () => ({ rows: [['', '', '', '', ''], ['', '', '', '', ''], ['', '', '', '', '']] }),
    defs: () => [gridDef('rows', 'الحاجيات', ['الحاجة', 'الكمية', 'ثمن الوحدة', 'الأولوية', 'ملاحظات'], { widths: ['2fr', '.6fr', '.8fr', '.7fr', '1.2fr'], types: ['text', 'num', 'num', 'text', 'text'] })],
    build: (s, f, sy) => {
      const R = (f.rows || []).filter(r => nm(r[0]));
      const rows = R.map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, r[1], { t: m2(num(r[2])), c: 'ltr' }, { t: m2(num(r[1]) * num(r[2])), c: 'ltr' }, r[3], { t: r[4], c: 'sm' }]));
      const tot = r2(R.reduce((a, r) => a + num(r[1]) * num(r[2]), 0));
      rows.push(tr([{ t: 'المجموع', s: 4, c: 'd b' }, { t: m2(tot), c: 'd b ltr' }, { t: '', s: 2, c: 'd' }]));
      return { title: 'لائحة حاجيات المؤسسة', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: SB.sign(s, { right: 'رئيس الجمعية', left: 'رئيس المؤسسة' }), blocks: [tbl(hd(['ر.ت', 'الحاجة', 'الكمية', 'ثمن الوحدة', 'الكلفة', 'الأولوية', 'ملاحظات']), blankRows(rows.slice(0, -1), 10, 7).concat(rows.slice(-1)), 'big')] };
    }
  });

  /* ---------- 1.9.2: spending procedure documents (guide §2.3) + accounts audit ---------- */
  const procHead = (s, c) => head(s, c);
  const blankLines = n => Array.from({ length: n }, () => '<div style="border-bottom:1px dotted #666;height:7mm"></div>').join('');
  add({
    k: 'nj_lines', t: 'جدول مجالات الصرف وبنودها (مرجع الدليل)', grp: 'nj_b', d: 'المجالات العشرة للصرف وبنود كل مجال حسب دليل مسطري التدبير المالي، مع السقوف والمساطر.', auto: 'الدليل المرجعي', page: 'a4',
    init: () => ({}), defs: () => [{ note: 'مرجع للاطلاع والطباعة. الأبواب المعتمدة في اليومية تُعدّل من «معطيات الجمعية».' }],
    build: (s, f, sy) => ({ title: 'مجالات الصرف وبنودها', sub: 'جمعية دعم مدرسة النجاح — حسب دليل مسطري التدبير المالي', page: 'a4', sign: signT(s), blocks: [
      tbl(hd(['ر.ت', 'المجال', 'البنود']), EXP.map((k, i) => tr([i + 1, { t: k, c: 'r b' }, { t: LINES[k].join(' — '), c: 'r sm' }])), 'cmp'),
      kv2([['سقف مقتنيات التجهيزات السنوية', dh(CEIL.equip)], ['منحة المديرية الإقليمية (سقف)', `بين ${m2(CEIL.grantMin)} و ${m2(CEIL.grantMax)} درهم`], ['صندوق صغير', `بين 500 و ${m2(CEIL.cashBox)} درهم (العملية الواحدة ≤ ${m2(CEIL.cashOp)})`]]),
      { html: '<div class="sb-note">الخطوات: التعبير عن الحاجة ← طلب عروض أثمان (3 ممونين على الأقل، أجل 15 يوما) ← لجنة البت (الأقل ثمنا) ← سند الطلب ← التسليم (سند التسليم) ← الفاتورة «عمل منجز / قابل للأداء» ← الأداء بالشيك أو التحويل (أو سند الصندوق) ← التسجيل في اليومية وسجل البنك/الصندوق.</div>' }] })
  });
  add({
    k: 'nj_devis', t: 'طلب عروض أثمان (Demande de devis)', grp: 'nj_d', d: 'مراسلة إلى ممون (ثلاثة على الأقل) لتقديم عرض ثمن مع تحديد المواصفات وأجل الرد.', auto: 'معطيات الجمعية', page: 'a4',
    init: (s) => ({ city: s.city || '', date: '', supplier: '', object: '', deadline: '15', specs: [['', '', '']] }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'supplier', l: 'الممون' }, { k: 'object', l: 'موضوع الطلب' }, { k: 'deadline', l: 'أجل الرد (بالأيام، 15 على الأكثر)', t: 'num', half: true },
      gridDef('specs', 'المواصفات المطلوبة', ['المادة / الخدمة', 'المواصفات', 'الكمية'], { widths: ['1.5fr', '2fr', '.6fr'], types: ['text', 'text', 'num'] })],
    build: (s, f, sy) => { const c = calc(sy), R = (f.specs || []).filter(r => nm(r[0]));
      return { title: 'طلب عروض أثمان', sub: `جمعية دعم مدرسة النجاح — ${esc(s.school || '')}`, page: 'a4', sign: SB.sign(s, { right: `حرر ب ${esc(f.city || '')} في ${esc(f.date ? ldate(f.date) : '..........')}`, left: 'رئيس الجمعية' }), blocks: [
        { html: `<p class="sb-p">إلى السيد(ة) الممون: <b>${esc(f.supplier || '..............................')}</b></p><p class="sb-p">الموضوع: <b>${esc(f.object || '..............................')}</b></p><p class="sb-p">تهم جمعية دعم مدرسة النجاح للمؤسسة المذكورة اقتناء الحاجيات الآتية، ويرجى موافاتنا بعرض الثمن مفصلا (بالضريبة وبدونها) داخل أجل أقصاه <b>${esc(f.deadline || '15')}</b> يوما من تاريخ هذا الطلب، علما أن الطلب وجه إلى ثلاثة ممونين على الأقل.</p>` },
        tbl(hd(['ر.ت', 'المادة / الخدمة', 'المواصفات', 'الكمية']), R.length ? R.map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, { t: r[1], c: 'r' }, r[2]])) : blankLines(1) && [tr(['1', '', '', '']), tr(['2', '', '', '']), tr(['3', '', '', ''])], 'cmp')] }; }
  });
  add({
    k: 'nj_pv', t: 'محضر لجنة البت في عروض الأثمان', grp: 'nj_d', d: 'محضر اللجنة (ثلاثة أعضاء على الأقل) التي تعتمد العرض الأقل ثمنا بعد مقارنة العروض.', auto: 'مكتب الجمعية', page: 'a4',
    init: (s) => ({ city: s.city || '', date: '', object: '', members: '', offers: [['', '', ''], ['', '', ''], ['', '', '']], chosen: '' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'object', l: 'موضوع الاقتناء' }, { k: 'members', l: 'أعضاء اللجنة (مفصولة بفاصلة)', t: 'area', rows: 2 },
      gridDef('offers', 'العروض المتوصل بها', ['الممون', 'المبلغ (درهم)', 'ملاحظات'], { widths: ['2fr', '1fr', '1.5fr'], types: ['text', 'num', 'text'] }), { k: 'chosen', l: 'الممون المعتمد (الأقل ثمنا)' }],
    build: (s, f, sy) => { const R = (f.offers || []).filter(r => nm(r[0])), low = R.slice().sort((a, b) => num(a[1]) - num(b[1]))[0], who = f.chosen || (low ? low[0] : '');
      return { title: 'محضر لجنة البت في عروض الأثمان', sub: `جمعية دعم مدرسة النجاح — ${esc(s.school || '')}`, page: 'a4', sign: SB.sign(s, { three: ['أمين مال الجمعية', 'رئيس الجمعية', 'عضو اللجنة'] }), blocks: [
        { html: `<p class="sb-p">في يوم ${esc(f.date ? ldate(f.date) : '..........')}، اجتمعت اللجنة المنبثقة عن مكتب الجمعية والمكونة من: <b>${esc(f.members || '..............................')}</b> للبت في عروض الأثمان المتعلقة بـ <b>${esc(f.object || '..............................')}</b>.</p><p class="sb-p">وبعد فتح العروض ودراستها ومقارنتها تبين ما يلي:</p>` },
        tbl(hd(['ر.ت', 'الممون', 'المبلغ', 'ملاحظات']), R.length ? R.map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, { t: m2(num(r[1])), c: 'ltr' }, { t: r[2], c: 'sm' }])) : [tr(['1', '', '', '']), tr(['2', '', '', '']), tr(['3', '', '', ''])], 'cmp'),
        { html: `<p class="sb-p">وعليه، اعتمدت اللجنة عرض الممون <b>${esc(who || '..............................')}</b> باعتباره الأقل ثمنا (le moins disant) والمطابق للمواصفات المطلوبة. ${R.length && R.length < 3 ? '<b>(تنبيه: عدد العروض أقل من ثلاثة)</b>' : ''}</p>` }] }; }
  });
  const slip = (k, t, d, title, rows) => add({
    k, t, grp: 'nj_d', d, auto: 'معطيات الجمعية', page: 'a4',
    init: () => ({ no: '', date: '', supplier: '', object: '', amount: '', pvref: '' }),
    defs: (f, sy) => [{ k: 'no', l: 'الرقم', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'supplier', l: 'الممون / المستفيد' }, { k: 'object', l: 'الموضوع (المواد أو الخدمات)', t: 'area', rows: 2 }, { k: 'amount', l: 'المبلغ (درهم)', t: 'money', half: true }, { k: 'pvref', l: 'مرجع محضر اللجنة / الفاتورة', half: true }, { k: 'chapter', l: 'المجال', t: 'select', opts: [['', '—']].concat(EXP.map(x => [x, x])) }],
    build: (s, f, sy) => { const row = (a, b) => `<div style="margin:1.8mm 0"><b>${a}</b> ${esc(b)}</div>`;
      const body = tag => paper(title, `${esc(tag)} — رقم: ${esc(f.no || '......')}`, rows(f, row, s));
      return { title, sub: `جمعية دعم مدرسة النجاح — ${esc(s.school || '')}`, page: 'a4', sign: false, blocks: [twice(body)] }; }
  });
  const foot = (s, f, who) => `<div style="display:flex;justify-content:space-between;margin-top:4mm"><span>${esc(s.city || '')} في: ${esc(f.date ? ldate(f.date) : '..........')}</span><span>${who}</span></div><div style="height:12mm"></div>`;
  slip('nj_bc', 'سند الطلب (Bon de commande)', 'سند طلب موجه إلى الممون الذي وقع عليه الاختيار، بنسختين.', 'سند الطلب', (f, row, s) => row('تطلب جمعية دعم مدرسة النجاح من السيد(ة):', f.supplier || '..................') + row('تزويدها بـ:', f.object || '..................') + row('بمبلغ إجمالي قدره:', f.amount ? `${m2(num(f.amount))} درهم (${tafqit(f.amount)})` : '..................') + row('المرجع:', `${f.pvref || '......'}${f.chapter ? ' — المجال: ' + f.chapter : ''}`) + foot(s, f, 'رئيس الجمعية / أمين المال'));
  slip('nj_bl', 'سند التسليم (Bon de livraison)', 'يوقعه أمين المال بعد معاينة السلع أو الخدمات ومطابقتها لسند الطلب.', 'سند التسليم', (f, row, s) => row('سلم السيد(ة):', f.supplier || '..................') + row('إلى جمعية دعم مدرسة النجاح:', f.object || '..................') + row('بموجب سند الطلب / المرجع:', f.pvref || '......') + row('وقد عاينها أمين المال وتأكد من مطابقتها للمواصفات المطلوبة.', '') + foot(s, f, 'الممون وأمين المال'));
  slip('nj_caisse', 'سند الصندوق (Bon de caisse)', 'لنفقات صغيرة بالصندوق (ما بين 500 و 5000 درهم، والعملية الواحدة لا تتجاوز 1500 درهم).', 'سند الصندوق', (f, row, s) => row('يؤدى من صندوق جمعية دعم مدرسة النجاح للسيد(ة):', f.supplier || '..................') + row('مبلغ:', f.amount ? `${m2(num(f.amount))} درهم (${tafqit(f.amount)})` : '..................') + (num(f.amount) > CEIL.cashOp ? '<div style="color:#b91c1c;font-weight:700">تنبيه: المبلغ يتجاوز سقف العملية الواحدة بالصندوق (1500 درهم).</div>' : '') + row('لأجل:', f.object || '..................') + row('المرجع:', f.pvref || '......') + foot(s, f, 'أمين المال — المستفيد'));

  /* audit of the accounts */
  function audit(sy) {
    const c = calc(sy), out = [], bad = (t, x) => out.push(['خطأ', t, x]), warn = (t, x) => out.push(['تنبيه', t, x]), ok = (t, x) => out.push(['سليم', t, x]);
    const J = c.sort, known = new Set(chapters(sy).map(nm));
    const noRef = J.filter(r => !nm(r[1])), noDate = J.filter(r => !r[0]), noCh = J.filter(r => !nm(r[4])), unk = J.filter(r => nm(r[4]) && !known.has(nm(r[4])));
    const both = J.filter(r => num(r[5]) && num(r[6])), empty = J.filter(r => !num(r[5]) && !num(r[6]));
    noDate.length ? bad('عمليات بدون تاريخ', `${noDate.length} عملية`) : ok('جميع العمليات مؤرخة', '');
    noRef.length ? warn('عمليات بدون مرجع الإثبات (فاتورة، سند، شيك)', `${noRef.length} عملية — يجب الإشارة إلى مرجع الأداء`) : ok('جميع العمليات لها مرجع', '');
    noCh.length ? warn('عمليات بدون باب أو مجال', `${noCh.length} عملية`) : ok('جميع العمليات مصنفة', '');
    unk.length && warn('أبواب خارج لائحة الجمعية', Array.from(new Set(unk.map(r => nm(r[4])))).join('، '));
    both.length && bad('عمليات تحمل مدخولا ومصروفا معا', `${both.length} عملية: افصلها في سطرين`);
    empty.length && warn('عمليات بدون مبلغ', `${empty.length}`);
    // duplicate references
    const seen = {}, dup = []; J.forEach(r => { const k = nm(r[1]); if (k) { if (seen[k]) dup.push(k); seen[k] = 1; } });
    dup.length && warn('مراجع مكررة (تحقق من تسجيل الأداء مرتين)', Array.from(new Set(dup)).join('، '));
    // running balances
    [['البنك', false, c.carryBank], ['الصندوق', true, c.carryCash]].forEach(([n, cash, start]) => { let b = start, min = start, at = ''; J.filter(r => isCash(r[3]) === cash).forEach(r => { b = r2(b + num(r[5]) - num(r[6])); if (b < min) { min = b; at = r[0] || ''; } }); min < 0 ? bad(`رصيد ${n} سالب`, `أدنى رصيد ${m2(min)} درهم${at ? ' بتاريخ ' + ldate(at) : ''}: تحقق من الترتيب الزمني أو من عمليات الصرف بدون تمويل`) : ok(`رصيد ${n} لم يصبح سالبا`, ''); });
    // cash rules
    const bigCash = J.filter(r => isCash(r[3]) && num(r[6]) > CEIL.cashOp);
    bigCash.length ? warn('نفقات بالصندوق تتجاوز سقف العملية (1500 د)', bigCash.map(r => `${m2(num(r[6]))} (${nm(r[2]) || nm(r[1])})`).join('، ')) : ok('نفقات الصندوق في حدود السقف', '');
    c.cashEnd > CEIL.cashBox && warn('رصيد الصندوق يتجاوز سقف الصندوق الصغير (5000 د)', `الرصيد ${m2(c.cashEnd)}: يجب إيداع الفائض في الحساب البنكي`);
    // estimates and ceilings
    c.exp.filter(r => r.est && r.real > r.est).forEach(r => warn('صرف يتجاوز التقدير', `${r.n}: المنجز ${m2(r.real)} > التقدير ${m2(r.est)}`));
    const eq = c.exp.filter(r => /التجهيز/.test(r.n)).reduce((a, r) => a + r.real, 0);
    eq > CEIL.equip ? bad('سقف مقتنيات التجهيزات متجاوز', `${m2(eq)} > ${m2(CEIL.equip)} درهم سنويا`) : ok('مقتنيات التجهيزات في حدود 20 000 درهم', `${m2(eq)}`);
    const gr = c.inc.filter(r => /منحة المديرية/.test(r.n)).reduce((a, r) => a + r.real, 0);
    gr > CEIL.grantMax && warn('منحة المديرية الإقليمية تتجاوز السقف (160 000 د)', m2(gr));
    // consistency: totals by chapter = totals by register
    const byCh = r2(c.inc.reduce((a, r) => a + r.real, 0)), byReg = c.income;
    Math.abs(byCh - byReg) > 0.005 ? bad('عدم تطابق مجموع المداخيل حسب الأبواب مع السجلين', `${m2(byCh)} ≠ ${m2(byReg)}`) : ok('مجموع المداخيل متطابق بين الأبواب والسجلين', '');
    const bx = r2(c.exp.reduce((a, r) => a + r.real, 0)); Math.abs(bx - c.expense) > 0.005 ? bad('عدم تطابق مجموع المصاريف', `${m2(bx)} ≠ ${m2(c.expense)}`) : ok('مجموع المصاريف متطابق بين الأبواب والسجلين', '');
    if (!J.length) warn('لا توجد عمليات مسجلة بعد', '');
    return out;
  }
  add({
    k: 'nj_audit', t: 'افتحاص الحسابات (مراجعة آلية)', grp: 'nj_b', d: 'مراجعة آلية لليومية: مراجع الإثبات، الأرصدة، سقوف الصندوق والتجهيزات، تجاوز التقديرات، وتطابق المجاميع.', auto: 'يومية العمليات', page: 'a4',
    init: () => ({}), defs: () => [{ note: 'تُنجز المراجعة تلقائيا من اليومية والأبواب والتقديرات، وتقارن بالسقوف الواردة في دليل التدبير المالي.' }],
    build: (s, f, sy) => { const A = audit(sy), n = k => A.filter(x => x[0] === k).length;
      return { title: 'تقرير افتحاص حسابات الجمعية', sub: `جمعية دعم مدرسة النجاح — الموسم الدراسي ${syText(sy)}`, page: 'a4', sign: signT(s), blocks: [
        kv2([['أخطاء', String(n('خطأ'))], ['تنبيهات', String(n('تنبيه'))], ['نقاط سليمة', String(n('سليم'))]]),
        tbl(hd(['ر.ت', 'الحالة', 'البند المفحوص', 'التفاصيل']), A.sort((a, b) => ['خطأ', 'تنبيه', 'سليم'].indexOf(a[0]) - ['خطأ', 'تنبيه', 'سليم'].indexOf(b[0])).map((r, i) => tr([i + 1, { t: r[0], c: r[0] === 'سليم' ? '' : 'b' }, { t: r[1], c: 'r' }, { t: r[2], c: 'r sm' }])), 'cmp')] }; }
  });

  B.reg({
    id: 'najah',
    groups: [['nj_a', 'جمعية دعم مدرسة النجاح — المحاسبة (يومية، بنك، صندوق)', 'سجّل العمليات مرة واحدة'], ['nj_d', 'مسطرة الصرف (حسب دليل التدبير المالي)', 'من الحاجة إلى الأداء'], ['nj_b', 'جمعية دعم مدرسة النجاح — الميزانية والتقارير'], ['nj_c', 'جمعية دعم مدرسة النجاح — الوصولات والمحاضر']],
    docs: () => DOCS,
    card: sy => { const c = calc(sy); return { title: 'جمعية دعم مدرسة النجاح', rows: [['المداخيل', dh(c.income)], ['المصاريف', dh(c.expense)], ['رصيد البنك', dh(c.bankEnd), c.bankEnd < 0 ? 'bad' : 'ok'], ['رصيد الصندوق', dh(c.cashEnd), c.cashEnd < 0 ? 'bad' : 'ok'], ['العمليات المسجلة', String(c.J.length)]] }; },
    dash: sy => { const c = calc(sy); return [['جمعية النجاح: البنك + الصندوق', dh(r2(c.bankEnd + c.cashEnd)), c.bankEnd < 0 || c.cashEnd < 0 ? 'bad' : '']]; }
  });
  window.Najah = { calc, audit };
})();
