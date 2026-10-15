'use strict';
/* 1.9.2 — خلية اليقظة (محاربة الهدر المدرسي) وخلية الإنصات والوساطة.
   Two document centers (same engine as «مجالس المؤسسة»): composition, roles, pupils at risk of dropping out, individual action plans,
   follow-up of pupils who stop attending, minutes, yearly programme (vigilance cell); composition, register of cases, minutes and mediation record (listening cell). */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { SB, tr, thr, tbl } = window.K;

  function migrate(db) {
    const c = db.cells = db.cells || {};
    c.years = c.years && typeof c.years === 'object' ? c.years : {};
  }
  const store = (kind, sy) => { migrate(DB); const y = DB.cells.years; const o = y[sy] || (y[sy] = {}); return o[kind] || (o[kind] = {}); };
  const B = () => window.Board;
  const named = rows => (rows || []).filter(r => String(r[0] || '').trim());
  const dsy = sy => esc(MK.syDash(sy).replace('-', '/'));
  const gridDef = (k, l, cols, o) => Object.assign({ k, l, t: 'grid', cols, widths: cols.map(() => '1fr') }, o || {});
  const SIGN = (s, left, right) => SB.sign(s, { right: right || '', left: left || 'توقيع مدير المؤسسة' });
  const lines = v => (Array.isArray(v) ? v : String(v || '').split(/\r?\n/)).map(x => String(x).trim()).filter(Boolean);
  const dateLine = (s, f) => `<div style="text-align:left;font-weight:700">${esc(f.city || s.city || '')} في: ${esc(K.ldate(f.date))}</div>`;
  const pupLink = n => ({ src: 'pupil', n: n || 0, cols: {} });

  /* ---------- composition defaults ---------- */
  const person = (e, role, cap) => [e ? fullName(e) : '', role || (e && B() ? B().jobOf(e) : ''), cap, e ? (e.phone || '') : '', e ? (e.email || '') : ''];
  const vigRoles = () => ['منسق الخلية', 'الحارس العام', 'المختص الاجتماعي', 'المستشار في التوجيه التربوي', 'منسق الحياة المدرسية', 'منسق التربية البدنية', 'أستاذ(ة) الرياضيات', 'أستاذ(ة) اللغة الفرنسية', 'أستاذ(ة) اللغة العربية'];
  function vigDefault() {
    const d = B() && B().director ? B().director() : null;
    const rows = [person(d, 'مدير المؤسسة', 'مشرف الخلية')];
    vigRoles().forEach((r, i) => rows.push(['', r, i === 0 ? 'منسق الخلية' : 'عضو الخلية', '', '']));
    return rows;
  }
  function listenDefault() {
    const d = B() && B().director ? B().director() : null;
    const rows = [person(d, 'مدير المؤسسة', 'مشرف الخلية'), ['', 'أستاذ(ة)', 'منسق الخلية', '', '']];
    for (let i = 0; i < 4; i++) rows.push(['', 'أستاذ(ة)', 'عضو الخلية', '', '']);
    return rows;
  }
  const fillRow = r => { const e = K.E.byName(r[0]); if (!e) return null; return [r[0], r[1] || (B() ? B().jobOf(e) : ''), r[2], e.phone || r[3], e.email || r[4]]; };
  const COMP_COLS = ['الاسم الكامل', 'المهمة', 'الصفة', 'الهاتف', 'البريد الإلكتروني'];
  const compDef = (k, l) => gridDef(k, l, COMP_COLS, { widths: ['1.5fr', '1.3fr', '1fr', '1fr', '1.6fr'], list: ['k2Emps'], fill: fillRow });
  const compTable = rows => tbl(thr(['ر.ت', 'الاسم والنسب', 'المهمة', 'الصفة', 'الهاتف', 'البريد الإلكتروني'].map(t => ({ t, c: 'd' }))),
    named(rows).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, r[1], r[2], { t: r[3], c: 'ltr nw' }, { t: r[4], c: 'ltr sm' }])), 'big');
  const sigTable = (rows, date) => ({ before: SB.cap(`توقيع أعضاء الخلية في الاجتماع المنعقد بتاريخ ${esc(K.ldate(date))}`, 'r'), table: { cls: 'sb-t big', head: thr(['ر.ت', 'الاسم والنسب', 'المهمة', 'الصفة', 'رقم التأجير', 'التوقيع'].map(t => ({ t, c: 'd' }))),
    rows: named(rows).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, r[1], r[2], (K.E.byName(r[0]) || {}).ppr || '', ''])) } });
  const members = (sy, kind) => { const f = store(kind, sy).comp; return (f || (kind === 'vigil' ? vigDefault() : listenDefault())); };

  /* =============================================================
     خلية اليقظة
     ============================================================= */
  const VDOCS = [];
  const vadd = d => VDOCS.push(d);
  const DEFAULT_DATE = sy => `${MK.syStart(sy)}-10-15`;

  vadd({
    k: 'comp', t: 'تركيبة خلية اليقظة', grp: 'v', d: 'أعضاء الخلية وصفاتهم وهواتفهم (المدير مشرف، منسق الخلية، الحارس العام، المختص الاجتماعي، المستشار في التوجيه...).', auto: 'لائحة الموظفين',
    init: () => ({ comp: vigDefault() }),
    defs: () => [{ note: 'اختر الاسم من لائحة الموظفين فيُملأ الهاتف والبريد تلقائيا. يمكن إضافة أي عضو.' }, compDef('comp', 'أعضاء خلية اليقظة')],
    build: (s, f, sy) => ({ title: `تركيبة خلية اليقظة`, sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s), blocks: [compTable(f.comp)] })
  });

  const ROLES = [
    ['مدير المؤسسة', 'يترأس خلية اليقظة ويضمن اشتغالها الجيد؛ يعبئ كل عضو ويبين مسؤوليته؛ يتتبع وضعية الهدر المدرسي بالمؤسسة؛ يعبئ السلطات والشركاء المحليين؛ يتواصل مع خلية اليقظة الإقليمية؛ يضمن سرية المعطيات وحماية المعلومات الشخصية للتلاميذ.'],
    ['الحارس العام', 'يضمن التتبع اليومي للغياب والتأخرات؛ يعطي معلومات عن الوضعية الأسرية والاجتماعية وعن سلوكات التلاميذ؛ يتواصل مع آباء وأولياء التلاميذ؛ يضمن تواصلا مستمرا مع التلاميذ المعرضين للهدر خارج القسم.'],
    ['منسق خلية اليقظة', 'يبرمج حصص اشتغال الخلية بتنسيق مع المدير وباقي الأعضاء؛ يحضر ويحين المعلومات الأساسية (لوائح التلاميذ، خطط العمل الفردية)؛ يحضر تقارير الحصص؛ يضمن التواصل السهل بين الأعضاء.'],
    ['المختص الاجتماعي', 'ينجز مواكبة شخصية للتلاميذ المعرضين للهدر قبل الانقطاع (ضعف تقدير الذات، صراعات أسرية أو مدرسية...) وللمنقطعين بغرض إعادة إدماجهم؛ يقترح تسجيلهم في الأنشطة الموازية وورشات المهارات النفسية الاجتماعية؛ يعبئ المتدخلين المختصين؛ ينظم مقابلات مع الأولياء.'],
    ['المستشار في التوجيه التربوي', 'يحدد التلاميذ الذين يحتاجون إلى مواكبة تخصصية في التوجيه التربوي؛ ينجز المقابلات الفردية ويرصد المؤشرات النوعية؛ ينظم لقاءات مع الأولياء.'],
    ['أساتذة المواد الأساسية (الرياضيات، الفرنسية، العربية)', 'يحددون التلاميذ الذين يحتاجون إلى الدعم التربوي بالنظر إلى أدائهم؛ يعطون معلومات عن المواظبة والسلوك داخل القسم؛ يمكنهم الانخراط في حصص الدعم التربوي وتنظيم مقابلات مع الأولياء.'],
    ['منسق الحياة المدرسية', 'يجمع المعلومات عن التلاميذ المعرضين للهدر من الأساتذة ومؤطري الأنشطة الموازية؛ يعطي معلومات تكميلية عن وضعيتهم الاجتماعية والنفسية؛ يقترح تسجيلهم في بعض الأنشطة الموازية.'],
    ['منسق التربية البدنية', 'يجمع المعلومات عن التلاميذ المعرضين للهدر من مؤطري الأنشطة الرياضية؛ يعطي معلومات تكميلية؛ يقترح تسجيلهم في بعض الأنشطة الرياضية.']
  ];
  vadd({
    k: 'roles', t: 'أدوار أعضاء خلية اليقظة', grp: 'v', d: 'أدوار كل عضو وتكامل التدخلات (حسب دليل التكوين الإقليمي لخلايا اليقظة).', auto: 'نص مرجعي قابل للتعديل',
    init: () => ({ rows: ROLES.map(r => r.slice()) }),
    defs: () => [gridDef('rows', 'العضو وأدواره', ['العضو', 'الأدوار'], { widths: ['1fr', '3fr'] })],
    build: (s, f, sy) => ({ title: 'أدوار أعضاء خلية اليقظة', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s),
      blocks: [tbl(thr(['العضو', 'الأدوار والمهام'].map(t => ({ t, c: 'd' }))), named(f.rows).map(r => tr([{ t: r[0], c: 'b r' }, { t: r[1], c: 'r' }])), 'big')] })
  });

  const RISK_COLS = ['رمز مسار', 'الاسم والنسب', 'القسم', 'معيار الرصد', 'المكلف بالتشخيص', 'ملاحظات'];
  vadd({
    k: 'risk', t: 'لائحة التلاميذ المعرضين لخطر الهدر المدرسي', grp: 'v', d: 'التلاميذ المرصودون (معطيات تاريخية، غياب، رصد نوعي) والعضو المكلف بتشخيص وضعية كل واحد.', auto: 'بطاقة التلاميذ (اختر التلميذ فيُملأ القسم)',
    init: (s, sy) => ({ city: s.city || '', date: DEFAULT_DATE(sy), rows: [] }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      gridDef('rows', 'التلاميذ المعرضون للهدر', RISK_COLS, { widths: ['1fr', '1.6fr', '.8fr', '1.3fr', '1.2fr', '1fr'], dirs: ['ltr', null, 'ltr', null, null, null], list: ['k2Codes', 'k2Pupils', null, ['معطيات تاريخية (مسار)', 'غياب متكرر', 'تعثر دراسي', 'وضعية اجتماعية', 'سلوك وعدم انضباط', 'رصد نوعي'], 'k2Emps', null],
        link: { src: 'pupil', n: 1, cols: { code: 0, cls: 2 } } })],
    build: (s, f, sy) => ({ title: 'لائحة التلاميذ المعرضين لخطر الهدر المدرسي', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s),
      blocks: [dateLine(s, f), { before: '', table: { cls: 'sb-t big', head: thr(['ر.ت'].concat(RISK_COLS).map(t => ({ t, c: 'd' }))), minRows: 10,
        rows: named(f.rows.map(r => [r[1], r[0], r[2], r[3], r[4], r[5]])).map((r, i) => tr([i + 1, { t: r[1], c: 'ltr nw' }, { t: r[0], c: 'b r' }, r[2], r[3], r[4], r[5]])) } }] })
  });

  const PLAN_COLS = ['الاسم والنسب', 'القسم', 'نوع المواكبة', 'المسؤول عن التنفيذ', 'تاريخ البدء', 'تاريخ التتبع', 'النتيجة'];
  const SUPPORT = ['الدعم التربوي', 'مواكبة نفسية اجتماعية', 'مواكبة تخصصية في التوجيه', 'أنشطة موازية', 'أنشطة رياضية', 'مقابلة مع الولي', 'تعبئة الشركاء'];
  vadd({
    k: 'plans', t: 'خطط العمل الفردية', grp: 'v', d: 'لكل تلميذ معرض للهدر: نوع المواكبة (دعم تربوي، نفسية اجتماعية، توجيه، أنشطة موازية...) والمسؤول وتواريخ التتبع.', auto: 'بطاقة التلاميذ ولائحة الموظفين',
    init: (s, sy) => ({ city: s.city || '', date: `${MK.syStart(sy)}-11-15`, rows: [] }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      gridDef('rows', 'خطط العمل الفردية', PLAN_COLS, { widths: ['1.5fr', '.8fr', '1.4fr', '1.2fr', '1fr', '1fr', '1.1fr'], dirs: [null, 'ltr', null, null, null, null, null], list: ['k2Pupils', null, SUPPORT, 'k2Emps', null, null, ['قيد التنفيذ', 'تحسن', 'لا تغيير', 'انقطاع', 'إعادة إدماج']],
        link: { src: 'pupil', n: 0, cols: { cls: 1 } } })],
    build: (s, f, sy) => ({ title: 'خطط العمل الفردية للتلاميذ المعرضين لخطر الهدر المدرسي', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4l', sign: SIGN(s),
      blocks: [dateLine(s, f), { before: '', table: { cls: 'sb-t big', head: thr(['ر.ت'].concat(PLAN_COLS).map(t => ({ t, c: 'd' }))), minRows: 10,
        rows: named(f.rows).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'ltr nw' }, r[2], r[3], r[4] ? fmtDate(r[4]) : '', r[5] ? fmtDate(r[5]) : '', r[6]])) } }] })
  });

  vadd({
    k: 'card', t: 'بطاقة خطة العمل الفردية لتلميذ(ة)', grp: 'v', d: 'بطاقة من صفحة واحدة: التشخيص، الأهداف، التدخلات والتتبع والتواصل مع الولي.', auto: 'بطاقة التلاميذ',
    init: (s, sy) => ({ pupil: '', code: '', cls: '', date: `${MK.syStart(sy)}-11-15`, diag: '', goals: '', acts: [['', '', '', '']], follow: '', parent: '' }),
    defs: () => [{ k: 'pupil', l: 'التلميذ(ة)', list: 'k2Pupils', link: { src: 'pupil', keys: { code: 'code', cls: 'cls' } } }, { k: 'code', l: 'رمز مسار', half: true, dir: 'ltr', list: 'k2Codes', link: { src: 'pupil', keys: { code: 'code', cls: 'cls' } } }, { k: 'cls', l: 'القسم', half: true }, { k: 'date', l: 'تاريخ التشخيص', t: 'date', half: true },
      { k: 'diag', l: 'التشخيص (الصعوبات والأسباب)', t: 'area', rows: 4 }, { k: 'goals', l: 'الأهداف', t: 'area', rows: 3 },
      gridDef('acts', 'التدخلات', ['التدخل', 'المسؤول', 'الأجل', 'النتيجة'], { widths: ['2fr', '1.2fr', '1fr', '1fr'] }),
      { k: 'follow', l: 'التتبع (تواريخ ومخرجات)', t: 'area', rows: 3 }, { k: 'parent', l: 'التواصل مع الولي', t: 'area', rows: 2 }],
    build: (s, f, sy) => {
      const box = (t, v) => `<div style="border:1.2px solid #000;border-radius:2mm;margin:2mm 0"><div style="background:#d9e2f3;font-weight:700;padding:.6mm 3mm;border-bottom:1.2px solid #000">${t}</div><div style="padding:2mm 3mm;min-height:20mm;line-height:1.9;white-space:pre-wrap">${esc(v || '')}</div></div>`;
      return { title: 'بطاقة خطة العمل الفردية', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s, 'توقيع منسق خلية اليقظة'),
        blocks: [tbl('', [tr([{ t: 'التلميذ(ة)', c: 'k' }, f.pupil, { t: 'رمز مسار', c: 'k' }, { t: f.code, c: 'ltr' }]), tr([{ t: 'القسم', c: 'k' }, f.cls, { t: 'تاريخ التشخيص', c: 'k' }, K.ldate(f.date)])], 'kv big'),
          box('التشخيص', f.diag), box('الأهداف', f.goals),
          tbl(thr(['التدخل', 'المسؤول', 'الأجل', 'النتيجة'].map(t => ({ t, c: 'd' }))), (f.acts && f.acts.length ? f.acts : [['', '', '', '']]).concat([['', '', '', ''], ['', '', '', '']]).map(r => tr(r.map(x => ({ t: x, c: 'r' })))), 'big'),
          box('التتبع', f.follow), box('التواصل مع الولي', f.parent)] };
    }
  });

  const DROP_COLS = ['الاسم والنسب', 'القسم', 'ساعات الغياب غير المبرر (الأسبوع)', 'تاريخ إشعار الولي', 'تاريخ مقابلة الولي', 'الإجراء / النتيجة'];
  vadd({
    k: 'drop', t: 'تتبع التلاميذ في طور الانقطاع', grp: 'v', d: 'التلاميذ الذين تجاوزوا عتبة الغياب: إشعار الأولياء، المقابلة، تعبئة الوسطاء أو السلطات المحلية، إعادة الإدماج.', auto: 'بطاقة التلاميذ',
    init: (s, sy) => ({ city: s.city || '', date: `${MK.syStart(sy)}-12-15`, thr: '6', rows: [] }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'thr', l: 'عتبة الغياب غير المبرر في الأسبوع (ساعات)', half: true },
      gridDef('rows', 'التلاميذ في طور الانقطاع', DROP_COLS, { widths: ['1.5fr', '.8fr', '1fr', '1fr', '1fr', '1.6fr'], dirs: [null, 'ltr', null, null, null, null], list: ['k2Pupils', null, null, null, null, ['إشعار الأولياء', 'مقابلة مع الولي', 'تعبئة الوسطاء الجماعاتيين أو السلطات', 'عاد إلى الدراسة', 'انقطع نهائيا']],
        link: { src: 'pupil', n: 0, cols: { cls: 1 } } })],
    build: (s, f, sy) => ({ title: 'تتبع التلاميذ في طور الانقطاع عن الدراسة', sub: `الموسم الدراسي ${dsy(sy)} — عتبة الغياب: ${esc(f.thr)} ساعات غير مبررة في الأسبوع`, page: 'a4l', sign: SIGN(s),
      blocks: [dateLine(s, f), { before: '', table: { cls: 'sb-t big', head: thr(['ر.ت'].concat(DROP_COLS).map(t => ({ t, c: 'd' }))), minRows: 10,
        rows: named(f.rows).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'ltr nw' }, r[2], r[3] ? fmtDate(r[3]) : '', r[4] ? fmtDate(r[4]) : '', r[5]])) } }] })
  });

  vadd({
    k: 'minutes', t: 'محضر اجتماع خلية اليقظة', grp: 'v', d: 'جدول الأعمال والمداولات والتوصيات ولائحة توقيع الأعضاء.', auto: 'تركيبة الخلية',
    init: (s, sy) => ({ city: s.city || '', date: DEFAULT_DATE(sy), time: '15:00', place: s.school || 'المؤسسة', secretary: '',
      agenda: 'تحيين لائحة التلاميذ المعرضين لخطر الهدر المدرسي؛\nمصادقة الخلية على التشخيص وخطط العمل الفردية؛\nتتبع الغياب اليومي للتلاميذ في طور الانقطاع؛\nالتواصل مع آباء وأولياء التلاميذ وتعبئة الشركاء.',
      body: 'انعقد بـ{{school}} يوم {{date}} على الساعة {{time}} اجتماع لخلية اليقظة لمناقشة نقط جدول الأعمال أعلاه.\nفي البداية رحب السيد(ة) مدير(ة) المؤسسة بأعضاء الخلية، وبعد ذلك تم تقديم حصيلة الرصد والتتبع، وفتح نقاش مستفيض خلص الاجتماع إلى ما يلي:\n- اعتماد لائحة التلاميذ المعرضين لخطر الهدر المدرسي وتكليف الأعضاء بتشخيص وضعية كل تلميذ؛\n- المصادقة على خطط العمل الفردية وتفعيلها ابتداء من التاريخ المحدد؛\n- إشعار الأولياء بغياب أبنائهم كلما تجاوزوا عتبة الغياب غير المبرر؛\n- عقد اجتماع تتبع لاحق لتقييم نتائج المواكبة.' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'تاريخ الاجتماع', t: 'date', half: true }, { k: 'time', l: 'الساعة', half: true }, { k: 'place', l: 'المكان', half: true }, { k: 'secretary', l: 'المقرر(ة)', list: 'k2Emps' },
      { k: 'agenda', l: 'جدول الأعمال (سطر لكل نقطة)', t: 'area', rows: 5 }, { k: 'body', l: 'نص المحضر', t: 'area', rows: 12 }],
    build: (s, f, sy) => {
      const ctx = K.tokens({ school: s.school, date: `${K.dayName(f.date)} ${K.ldate(f.date)}`, time: f.time });
      const ag = lines(f.agenda);
      return { title: 'محضر اجتماع أعضاء خلية اليقظة', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s, 'توقيع مدير المؤسسة', `المقرر(ة)${f.secretary ? ': ' + esc(f.secretary) : ''}`),
        blocks: [dateLine(s, f), `<p class="sb-p"><b>جدول الأعمال:</b></p>`, ...ag.map(x => `<p class="sb-p rp-li">${esc(x)}</p>`), ...K.textBlocks(f.body, ctx), sigTable(members(sy, 'vigil'), f.date)] };
    }
  });

  const PROG = [['منتصف أكتوبر', 'اجتماع الخلية: تحيين لائحة التلاميذ المعرضين للهدر وتوزيع التشخيص على الأعضاء'], ['من منتصف أكتوبر إلى بداية نونبر', 'مقابلات التشخيص مع التلاميذ (15 دقيقة) من طرف المختص الاجتماعي والمستشار في التوجيه والحارس العام'], ['منتصف نونبر', 'اجتماع الخلية: المصادقة على التشخيص وخطط العمل الفردية'],
    ['ابتداء من منتصف نونبر', 'تفعيل خطط العمل الفردية والتواصل مع أولياء التلاميذ المعرضين للهدر'], ['ابتداء من دجنبر', 'التتبع اليومي للغياب ورصد التلاميذ في طور الانقطاع (عتبة 6 ساعات غير مبررة في الأسبوع)'], ['شهريا', 'اجتماع تتبع لتفعيل الخطط وتحيين اللوائح'], ['نهاية كل دورة', 'تقرير حصيلة عن الهدر المدرسي ونتائج المواكبة']];
  vadd({
    k: 'programme', t: 'برمجة اشتغال خلية اليقظة', grp: 'v', d: 'الجدولة الزمنية للرصد والتشخيص وخطط العمل والتتبع خلال السنة الدراسية.', auto: 'نص مرجعي قابل للتعديل',
    init: () => ({ rows: PROG.map(r => r.slice()) }),
    defs: () => [gridDef('rows', 'البرمجة', ['الفترة', 'المهمة'], { widths: ['1fr', '3fr'] })],
    build: (s, f, sy) => ({ title: 'برمجة اشتغال خلية اليقظة', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s),
      blocks: [tbl(thr(['ر.ت', 'الفترة', 'المهمة'].map(t => ({ t, c: 'd' }))), named(f.rows).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'r' }])), 'big')] })
  });

  vadd({
    k: 'report', t: 'تقرير حصيلة خلية اليقظة', grp: 'v', d: 'أرقام الهدر المدرسي (من الحركية في بطاقة التلاميذ) وحصيلة المواكبة وتوصيات الخلية.', auto: 'بطاقة التلاميذ (المنقطعون وغير الملتحقين والمغادرون) وخطط العمل الفردية',
    init: (s, sy) => ({ city: s.city || '', date: `${MK.syStart(sy) + 1}-01-20`, period: 'الدورة الأولى', actions: '', reco: '' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'period', l: 'الفترة', half: true },
      { k: 'actions', l: 'حصيلة المواكبة (مقابلات، حصص دعم، أنشطة...)', t: 'area', rows: 5 }, { k: 'reco', l: 'التوصيات', t: 'area', rows: 4 }],
    build: (s, f, sy) => {
      const P = window.Pupils, mv = k => (P ? P.movesOf(sy, k).length : 0), cur = P ? P.current(sy).length : 0;
      const plans = ((store('vigil', sy).plans || {}).rows || []).filter(r => String(r[0] || '').trim());
      const risk = ((store('vigil', sy).risk || {}).rows || []).filter(r => String(r[1] || '').trim());
      const kv = [['التلاميذ الحاليون', cur], ['التلاميذ المعرضون لخطر الهدر (المرصودون)', risk.length], ['خطط العمل الفردية المنجزة', plans.length], ['المنقطعون', mv('drop')], ['غير الملتحقين', mv('notjoined')], ['المغادرون', mv('left')], ['الوافدون', mv('joined')]];
      return { title: 'تقرير حصيلة خلية اليقظة', sub: `الموسم الدراسي ${dsy(sy)} — ${esc(f.period)}`, page: 'a4', sign: SIGN(s),
        blocks: [dateLine(s, f), tbl(thr(['المؤشر', 'العدد'].map(t => ({ t, c: 'd' }))), kv.map(([k, v]) => tr([{ t: k, c: 'b r' }, v])), 'big'), `<p class="sb-p" style="margin-top:3mm"><b>حصيلة المواكبة:</b></p>`, ...K.textBlocks(f.actions || '.....................................................................', K.tokens({})), `<p class="sb-p"><b>التوصيات:</b></p>`, ...K.textBlocks(f.reco || '.....................................................................', K.tokens({}))] };
    }
  });

  /* =============================================================
     خلية الإنصات والوساطة
     ============================================================= */
  const LDOCS = [];
  const ladd = d => LDOCS.push(d);
  ladd({
    k: 'comp', t: 'تركيبة خلية الإنصات والوساطة', grp: 'l', d: 'أعضاء الخلية (مشرف، منسق، أعضاء) مع الهاتف والبريد الإلكتروني.', auto: 'لائحة الموظفين',
    init: () => ({ comp: listenDefault() }),
    defs: () => [{ note: 'اختر الاسم من لائحة الموظفين فيُملأ الهاتف والبريد تلقائيا.' }, compDef('comp', 'أعضاء خلية الإنصات والوساطة')],
    build: (s, f, sy) => ({ title: 'تركيبة خلية الإنصات والوساطة', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s), blocks: [compTable(f.comp)] })
  });

  const CASE_COLS = ['تاريخ الاستماع', 'الاسم والنسب', 'القسم', 'موضوع الحالة', 'عضو الخلية المستمع', 'الإجراء المتخذ', 'المآل'];
  ladd({
    k: 'register', t: 'سجل حالات الإنصات والوساطة', grp: 'l', d: 'تدوين الحالات المستمع إليها (تاريخ، تلميذ(ة)، موضوع، إجراء، مآل). وثيقة سرية.', auto: 'بطاقة التلاميذ ولائحة الموظفين',
    init: () => ({ rows: [] }),
    defs: () => [{ note: 'وثيقة سرية: لا تُسلَّم إلا لمدير المؤسسة وأعضاء الخلية، ولا تُنقل المعطيات الشخصية خارجها.' },
      gridDef('rows', 'الحالات', CASE_COLS, { widths: ['1fr', '1.5fr', '.8fr', '1.5fr', '1.2fr', '1.4fr', '1fr'], dirs: [null, null, 'ltr', null, null, null, null], list: [null, 'k2Pupils', null, ['سلوك وعدم انضباط', 'عنف أو تنمر', 'صعوبات أسرية', 'صعوبات دراسية', 'غياب متكرر', 'مشكل نفسي'], 'k2Emps', ['استماع وإرشاد', 'وساطة بين تلميذين', 'استدعاء الولي', 'إحالة على مختص', 'إحالة على مدير المؤسسة'], ['حُلّت', 'قيد المتابعة', 'أُحيلت']],
        link: { src: 'pupil', n: 1, cols: { cls: 2 } } })],
    build: (s, f, sy) => ({ title: 'سجل حالات الإنصات والوساطة', sub: `الموسم الدراسي ${dsy(sy)} — سري`, page: 'a4l', sign: SIGN(s),
      blocks: [{ before: '', table: { cls: 'sb-t big', head: thr(['ر.ت'].concat(CASE_COLS).map(t => ({ t, c: 'd' }))), minRows: 12,
        rows: (f.rows || []).filter(r => String(r[1] || '').trim()).map((r, i) => tr([i + 1, r[0] ? fmtDate(r[0]) : '', { t: r[1], c: 'b r' }, { t: r[2], c: 'ltr nw' }, r[3], r[4], r[5], r[6]])) } }] })
  });

  ladd({
    k: 'minutes', t: 'محضر اجتماع خلية الإنصات والوساطة', grp: 'l', d: 'جدول الأعمال والمداولات والتوصيات وتوقيع الأعضاء.', auto: 'تركيبة الخلية',
    init: (s, sy) => ({ city: s.city || '', date: DEFAULT_DATE(sy), time: '15:00', secretary: '',
      agenda: 'تقديم حصيلة الحالات المستمع إليها؛\nدراسة الحالات التي تستدعي وساطة أو إحالة؛\nتتبع التلاميذ المواكبين؛\nالتنسيق مع خلية اليقظة والأسر.',
      body: 'انعقد بـ{{school}} يوم {{date}} على الساعة {{time}} اجتماع لخلية الإنصات والوساطة لمناقشة نقط جدول الأعمال أعلاه.\nبعد الترحيب بالأعضاء، تم عرض الحالات المسجلة والإجراءات المتخذة بشأنها، وفتح نقاش خلص إلى ما يلي:\n- مواصلة الاستماع إلى التلاميذ في إطار من السرية واحترام الكرامة؛\n- اعتماد الوساطة في النزاعات بين التلاميذ قبل اللجوء إلى الإجراءات التأديبية؛\n- إحالة الحالات المعقدة على المختصين والتنسيق مع الأولياء؛\n- عقد اجتماع تتبع لاحق.' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'تاريخ الاجتماع', t: 'date', half: true }, { k: 'time', l: 'الساعة', half: true }, { k: 'secretary', l: 'المقرر(ة)', half: true, list: 'k2Emps' },
      { k: 'agenda', l: 'جدول الأعمال (سطر لكل نقطة)', t: 'area', rows: 5 }, { k: 'body', l: 'نص المحضر', t: 'area', rows: 12 }],
    build: (s, f, sy) => {
      const ctx = K.tokens({ school: s.school, date: `${K.dayName(f.date)} ${K.ldate(f.date)}`, time: f.time });
      return { title: 'محضر اجتماع أعضاء خلية الإنصات والوساطة', sub: `الموسم الدراسي ${dsy(sy)}`, page: 'a4', sign: SIGN(s, 'توقيع مدير المؤسسة', `المقرر(ة)${f.secretary ? ': ' + esc(f.secretary) : ''}`),
        blocks: [dateLine(s, f), `<p class="sb-p"><b>جدول الأعمال:</b></p>`, ...lines(f.agenda).map(x => `<p class="sb-p rp-li">${esc(x)}</p>`), ...K.textBlocks(f.body, ctx), sigTable(members(sy, 'listen'), f.date)] };
    }
  });

  ladd({
    k: 'mediation', t: 'محضر وساطة وصلح', grp: 'l', d: 'محضر جلسة وساطة بين طرفين (تلميذان أو تلميذ وأستاذ...): الوقائع، الاتفاق، التزامات الطرفين وتوقيعاتهما.', auto: 'بطاقة التلاميذ ولائحة الموظفين',
    init: (s, sy) => ({ city: s.city || '', date: DEFAULT_DATE(sy), time: '10:00', p1: '', c1: '', p2: '', c2: '', mediator: '', facts: '', agree: '', follow: '' }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'time', l: 'الساعة', half: true }, { k: 'mediator', l: 'الوسيط(ة)', half: true, list: 'k2Emps' },
      { k: 'p1', l: 'الطرف الأول', half: true, list: 'k2People' }, { k: 'c1', l: 'قسمه / صفته', half: true }, { k: 'p2', l: 'الطرف الثاني', half: true, list: 'k2People' }, { k: 'c2', l: 'قسمه / صفته', half: true },
      { k: 'facts', l: 'الوقائع', t: 'area', rows: 4 }, { k: 'agree', l: 'الاتفاق والتزامات الطرفين', t: 'area', rows: 4 }, { k: 'follow', l: 'التتبع', t: 'area', rows: 2 }],
    build: (s, f, sy) => ({ title: 'محضر وساطة وصلح', sub: `الموسم الدراسي ${dsy(sy)} — سري`, page: 'a4', sign: SIGN(s, 'توقيع الوسيط(ة)'),
      blocks: [dateLine(s, f), tbl('', [tr([{ t: 'الطرف الأول', c: 'k' }, f.p1, { t: 'القسم / الصفة', c: 'k' }, f.c1]), tr([{ t: 'الطرف الثاني', c: 'k' }, f.p2, { t: 'القسم / الصفة', c: 'k' }, f.c2]), tr([{ t: 'الوسيط(ة)', c: 'k' }, f.mediator, { t: 'الساعة', c: 'k' }, f.time])], 'kv big'),
        `<p class="sb-p"><b>الوقائع:</b></p>`, ...K.textBlocks(f.facts || '.....................................................................', K.tokens({})), `<p class="sb-p"><b>الاتفاق والتزامات الطرفين:</b></p>`, ...K.textBlocks(f.agree || '.....................................................................', K.tokens({})),
        `<p class="sb-p"><b>التتبع:</b></p>`, ...K.textBlocks(f.follow || '.....................................................................', K.tokens({})),
        tbl(thr(['الطرف الأول', 'الطرف الثاني', 'ولي الأمر (إن اقتضى الحال)'].map(t => ({ t, c: 'd' }))), [tr(['', '', ''])], 'big')] })
  });

  /* ---------- centers ---------- */
  // 1.9.4: each cell has its own sub-sections (tabs of the hub)
  const VG = [['v_org', 'خلية اليقظة — التركيبة والتنظيم', 'تركيبة الخلية وأدوار أعضائها وبرمجة اشتغالها'], ['v_trk', 'خلية اليقظة — الرصد والمواكبة', 'التلاميذ المعرضون لخطر الهدر وخطط العمل الفردية وتتبع المنقطعين'], ['v_rep', 'خلية اليقظة — الاجتماعات والحصيلة']];
  const LG = [['l_org', 'خلية الإنصات والمصالحة — التركيبة والاجتماعات'], ['l_lis', 'خلية الإنصات والمصالحة — الإنصات', 'سجل الحالات (وثيقة سرية)'], ['l_med', 'خلية الإنصات والمصالحة — الوساطة والمصالحة']];
  const VMAP = { comp: 'v_org', roles: 'v_org', programme: 'v_org', risk: 'v_trk', plans: 'v_trk', card: 'v_trk', drop: 'v_trk', minutes: 'v_rep', report: 'v_rep' };
  const LMAP = { comp: 'l_org', minutes: 'l_org', register: 'l_lis', mediation: 'l_med' };
  VDOCS.forEach(d => { d.grp = VMAP[d.k] || 'v_rep'; }); LDOCS.forEach(d => { d.grp = LMAP[d.k] || 'l_org'; });
  const mk = (id, title, icon, route, hub, groups, DOCS, kind, intro) => K.center({ id, title, icon, route, hubRoute: hub, groups, groupTabs: true, intro, docs: () => DOCS, store: sy => store(kind, sy) });
  const CV = mk('vigil', 'خلية اليقظة', '🛡️', 'vigilDoc', 'vigil', VG, VDOCS, 'vigil',
    'خلية اليقظة هي المحرك لرصد التلاميذ المعرضين لخطر الهدر المدرسي أو في طور الانقطاع والتكفل بهم. ابدأ ب«تركيبة الخلية» ثم «لائحة التلاميذ المعرضين» و«خطط العمل الفردية». تُحفظ المعطيات وتبقى سرية على حاسوبك.');
  const CL = mk('listen', 'خلية الإنصات والمصالحة', '👂', 'listenDoc', 'listen', LG, LDOCS, 'listen',
    'خلية الإنصات والوساطة تستقبل التلاميذ والأسر وتعالج المشاكل بالحوار والوساطة قبل أي إجراء تأديبي. معطياتها سرية.');
  window.Cells = { migrate, store, VDOCS: () => VDOCS, LDOCS: () => LDOCS, summary: () => ({ docs: VDOCS.length + LDOCS.length }) };
  window.pageVigil = (v, a) => { migrate(DB); CV.hub(v, a); };
  window.pageVigilDoc = (v, a) => { migrate(DB); CV.doc(v, a); };
  window.pageListen = (v, a) => { migrate(DB); CL.hub(v, a); };
  window.pageListenDoc = (v, a) => { migrate(DB); CL.doc(v, a); };
})();
