'use strict';
/* التواصل مع الشركاء — annual programme of the communication stations (Riyada schools guide), reports of the
   communication days with families (4 meetings), synthesis reports of the open days and of the reminder workshops,
   minutes of the meetings with the parents' association bureau, attendance lists; association bureau & partners. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();
  const CB = Dx.CB;

  function migrate(db) {
    const p = db.partners = db.partners || {};
    p.reports = Array.isArray(p.reports) ? p.reports : [];
    p.members = Array.isArray(p.members) ? p.members : [];
    p.others = Array.isArray(p.others) ? p.others : [];
    if (p.assocName == null) p.assocName = '';
  }
  window.Partners = { migrate };
  const PD = () => DB.partners;
  const syDash = sy => String(sy || '').replace('/', '-');
  const y1 = sy => +String(sy).slice(0, 4), y2 = sy => +String(sy).slice(5, 9);
  const nextSy = sy => `${y2(sy)}/${y2(sy) + 1}`;
  const lines = t => String(t || '').split('\n').map(x => x.trim().replace(/^[-•*·▪]\s*/, '')).filter(Boolean);
  const ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع'];
  const LEVELS6 = ['السنة الأولى', 'السنة الثانية', 'السنة الثالثة', 'السنة الرابعة', 'السنة الخامسة', 'السنة السادسة'];

  // the programme follows the guide of the pioneer schools (primary); in the collège / qualifying cycle the levels and the words of the cycle are used
  const kindNow = () => (window.Cyc ? Cyc.kind() : 'pri');
  const lvRows = () => { const k = kindNow(); return k === 'lyc' ? ['الجذع المشترك', 'الأولى باكالوريا', 'الثانية باكالوريا'] : k === 'col' ? ['الأولى إعدادي', 'الثانية إعدادي', 'الثالثة إعدادي'] : LEVELS6; };
  function adapt(t) {
    const k = kindNow();
    if (k === 'pri' || typeof t !== 'string') return t;
    const last = k === 'col' ? 'الثالثة إعدادي' : 'الثانية باكالوريا';
    return t.replace(/بسلك التعليم الابتدائي|بالتعليم الابتدائي/g, m => (m.startsWith('بسلك') ? 'بسلك ' : 'ب') + Cyc.label(k))
      .replace(/لمفتشي التعليم الابتدائي/g, 'لمفتشي ' + (k === 'col' ? 'التعليم الثانوي الإعدادي' : 'التعليم الثانوي التأهيلي'))
      .replace(/مدارس الريادة/g, 'مؤسسات الريادة').replace(/المؤسسة الابتدائية الرائدة/g, 'المؤسسة الرائدة').replace(/الريادة – الابتدائي/g, k === 'col' ? 'الريادة – الإعدادي' : 'الريادة – التأهيلي')
      .replace(/بين المدرسة والأسرة/g, 'بين المؤسسة والأسرة')
      .replace(/السنوات الأولى إلى الخامسة ابتدائي/g, k === 'col' ? 'السنتين الأولى والثانية إعدادي' : 'الجذع المشترك والأولى باكالوريا')
      .replace(/السنة السادسة ابتدائي/g, 'السنة ' + last).replace(/السنة السادسة/g, 'السنة ' + last)
      .replace(/الانتقال إلى السلك الإعدادي/g, k === 'col' ? 'الانتقال إلى السلك الثانوي التأهيلي' : 'مسالك التعليم العالي والتكوين المهني')
      .replace(/التعريف بالسلك الإعدادي والانتقال/g, k === 'col' ? 'التعريف بالسلك التأهيلي والانتقال' : 'التعريف بمسالك التعليم العالي والانتقال')
      .replace(/مسالك التوجيه والسلك الإعدادي/g, k === 'col' ? 'مسالك التوجيه والسلك التأهيلي' : 'مسالك التوجيه والتعليم العالي');
  }
  const adaptDeep = o => Array.isArray(o) ? o.map(adaptDeep) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, adaptDeep(v)])) : adapt(o);
  const units = () => { const u = window.Attend ? Attend.unitNames() : []; if (u.length) return u; const c = DB.certs && DB.certs.students ? Array.from(new Set(DB.certs.students.map(x => x.unit).filter(Boolean))) : []; return c.length ? c : [S().school || 'المؤسسة']; };
  const dirName = s => String(s.directorate || '').replace(/^\s*المديرية\s+الإقليمية\s*/, '').replace(/^ل(?=[اأإآ])/, '').trim() || String(s.directorate || '');
  const president = () => { const m = PD().members.find(x => /رئيس/.test(x.role || '') && !/نائب/.test(x.role || '')); return m ? m.name : ''; };
  const assocFull = s => PD().assocName || `جمعية أمهات وآباء وأولياء تلاميذ ${s.school || ''}`.trim();

  /* ---------- annual programme (guide of the Riyada schools) ---------- */
  const STATIONS = [
    { k: 'ws', m: 'شتنبر', act: 'الورشات التذكيرية', axis: 'تيسير تدبير انطلاق السنة الدراسية: روائز الموضعة القبلية، الدعم والمعالجة، تقاسم العروض بين الأستاذات والأساتذة.', type: 'workshops', who: 'الأستاذات والأساتذة والأطر الإدارية' },
    { k: 'od1', m: 'شتنبر', act: 'الأبواب المفتوحة الأولى', axis: 'تقديم نموذج المؤسسة ومراحل السنة الدراسية، وبرمجة أنشطة السنة بإشراك الأسر وفعاليات المجتمع المحلي والشركاء.', type: 'opendoors', n: 0 },
    { k: 'm1', m: 'أكتوبر', act: 'اللقاء الأول للأسر', axis: 'عرض نتائج الدعم المكثف ومناقشة التقدم المحرز، والصحة المدرسية والوقاية من الصعوبات الصحية المؤثرة على التعلمات (المحطة التواصلية الثانية).', type: 'meeting', main: 'st2', n: 0 },
    { k: 'm2', m: 'دجنبر', act: 'اللقاء الثاني للأسر', axis: 'لقاءات فردية مع أسر التلميذات والتلاميذ خاصة الذين تعترضهم صعوبات.', type: 'meeting', n: 1 },
    { k: 'od2', m: 'فبراير', act: 'الأبواب المفتوحة الثانية', axis: 'عرض النتائج المرحلية ومؤشرات التعلمات، وتتبع مدى إنجاز الأنشطة المبرمجة مع الأسر وفعاليات المجتمع المحلي والشركاء.', type: 'opendoors', n: 1 },
    { k: 'm3', m: 'مارس', act: 'اللقاء الثالث للأسر', axis: 'لقاءات فردية مع أسر التلميذات والتلاميذ خاصة الذين تعترضهم صعوبات.', type: 'meeting', n: 2 },
    { k: 'm4', m: 'ماي', act: 'اللقاء الرابع للأسر', axis: 'لقاءات فردية مع أسر التلميذات والتلاميذ خاصة الذين تعترضهم صعوبات.', type: 'meeting', n: 3 },
    { k: 'od3', m: 'يونيو', act: 'الأبواب المفتوحة الختامية', axis: 'تقديم النتائج النهائية للسنة وتثمين جهود التلميذات والتلاميذ والأسر، وتقاسم برنامج الأنشطة الصيفية ولائحة اللوازم المدرسية وتوجيهات الاستعداد للموسم المقبل، مع الانفتاح على فعاليات المجتمع المحلي والشركاء؛ بالإضافة إلى لقاء خاص مع أسر تلميذات وتلاميذ السنة السادسة حول الانتقال إلى السلك الإعدادي.', type: 'opendoors', n: 2 }
  ];
  const stByK = k => STATIONS.find(x => x.k === k);
  const TYPES = {
    meeting: { label: 'تقرير اللقاء التواصلي', short: 'تقرير اللقاء', icon: '🗣️' },
    opendoors: { label: 'التقرير التركيبي للأبواب المفتوحة', short: 'التقرير التركيبي', icon: '🚪' },
    workshops: { label: 'التقرير التركيبي للورشات التذكيرية', short: 'التقرير التركيبي', icon: '🧑‍🏫' },
    pv: { label: 'محضر اللقاء مع مكتب جمعية الآباء', short: 'محضر الجمعية', icon: '📝' },
    presence: { label: 'لائحة الحضور', short: 'لائحة الحضور', icon: '📋' },
    invite: { label: 'دعوات الحضور', short: 'دعوات الحضور', icon: '✉️' },
    st2: { label: 'التقرير التركيبي للمحطة التواصلية الثانية', short: 'التقرير التركيبي للمحطة', icon: '📑' },
    agm: { label: 'إخبار بانعقاد الجمع العام للجمعية', short: 'إخبار بالجمع العام', icon: '📣' }
  };
  // documents of a station
  const DOCS_OF = st => st.main === 'st2' ? ['invite', 'st2', 'pv', 'presence'] : st.type === 'meeting' ? ['invite', 'meeting', 'pv', 'presence'] : ['invite', st.type, 'presence'];

  /* ---------- default contents ---------- */
  const MEET = [
    { sub: sy => `محطة أكتوبر / نونبر ${y1(sy)}`, obj: 'عرض ومناقشة نتائج التقويم التشخيصي وما بعد مرحلة الدعم المكثف، وإرساء حوار بناء بين المؤسسة والأسرة قصد تتبع مسار التلاميذ ومعالجة الصعوبات المتبقية، وترسيخ مبدأ المسؤولية المشتركة في تتبع التعلمات.',
      axes: sy => ['عرض نتائج التقويم التشخيصي قبل وبعد الدعم المكثف', `التعريف بنموذج مؤسسات الريادة ومراحل السنة الدراسية ${sy}`, 'عرض مؤشرات التقدم المحرز ونوعية التعثرات المتبقية', 'تقديم برنامج الدعم المؤسساتي طيلة السنة', 'مناقشة الالتزامات المشتركة بين الأسرة والمدرسة', 'توجيهات منزلية لمواكبة الأبناء بعد اللقاء'],
      stats: { title: 'نتائج الدعم المكثف – ملخص إحصائي', cols: ['المستوى', 'عدد التلاميذ', 'عدد المستفيدين', 'نسبة الاستفادة %'], rows: () => lvRows(), calcAt: 3, calc: r => pct(r[2], r[1], r[3]) } },
    { sub: sy => `محطة دجنبر ${y1(sy)}`, obj: 'إجراء لقاءات فردية مع أسر التلاميذ الذين يتعرضون لصعوبات دراسية، قصد التشخيص الدقيق للوضعيات الفردية ومناقشة آليات الدعم المؤسساتي الملائم، وتفعيل المواكبة المنزلية الممنهجة لكل تلميذ في وضعية صعوبة.',
      axes: () => ['استقبال أمهات وآباء وأولياء الأمور بشكل فردي داخل الأقسام', 'تقديم مسارات الأداء الفردي لكل تلميذ باستخدام شبكة التتبع', 'مناقشة نوعية الصعوبات (قرائية / حسابية / سلوكية)', 'تقديم الدعم المؤسساتي المبرمج لكل حالة', 'الاتفاق على توجيهات منزلية محددة لكل أسرة', 'تتبع التزامات الأسر بعد اللقاء الفردي'],
      stats: { title: 'بيانات اللقاءات الفردية', cols: ['الوحدة', 'عدد اللقاءات', 'المستوى الدراسي', 'نوع الصعوبة'], rows: () => units(), total: [1] } },
    { sub: sy => `محطة مارس ${y2(sy)}`, obj: 'تقديم وعرض النتائج المرحلية ومؤشرات التعلمات في نهاية الأسدس الأول وبداية الثاني، وإجراء لقاءات فردية مع أسر التلاميذ الذين تعترضهم صعوبات دراسية، وحث الأسر على المواكبة المنزلية المستمرة ودعم الاستعداد للمرحلة القادمة.',
      axes: () => ['عرض النتائج المرحلية ومؤشرات التعلم للأسدس الأول', 'تقديم حصيلة الدعم الممتد ومستوى التقدم في كل مادة', 'مناقشة الوضعية الدراسية لكل تلميذ مع وليه (لقاءات فردية)', 'عرض ملخص عن مشروع المؤسسة المندمج وأهدافه', 'توجيهات للأسر حول مواكبة الأبناء خلال الأسدس الثاني', 'لقاء خاص بأولياء السنة السادسة: التعريف بالسلك الإعدادي والانتقال'],
      stats: { title: 'مؤشرات التعلم – نتائج الأسدس الأول', cols: ['المستوى', 'اللغة العربية', 'الرياضيات', 'اللغة الفرنسية', 'العلوم', 'نسبة النجاح %', 'الاتقان %'], rows: () => lvRows() } },
    { sub: sy => `المحطة الختامية – ماي ${y2(sy)}`, obj: sy => `تقديم حصيلة نهاية السنة الدراسية وتثمين جهود التلاميذ والأسر، والاحتفاء بنتائج الدعم الممتد والبرنامج المؤسساتي، وتقديم توجيهات عملية للاستعداد للدخول المدرسي ${nextSy(sy)}، وإجراء لقاء خاص بأولياء أمور تلاميذ السنة السادسة حول الانتقال إلى السلك الإعدادي.`,
      axes: sy => ['تقديم الحصيلة النهائية للسنة الدراسية ونتائج نهاية السنة', 'الاحتفاء بالتلاميذ المتفوقين وتثمين مجهودات الأسر', 'حصيلة مشروع المؤسسة المندمج ومؤشرات التعلم النهائية', 'توجيهات الأنشطة الصيفية: القراءة / المراجعة / الأنشطة الثقافية', `إرشادات للاستعداد للدخول المدرسي ${nextSy(sy)}`, 'لقاء خاص بأولياء السنة السادسة: مسالك التوجيه والسلك الإعدادي'],
      stats: { title: 'البيانات الإجمالية لنهاية السنة', cols: ['المستوى', 'عدد التلاميذ', 'الناجحون', 'المكررون', 'نسبة النجاح %', 'نسبة الاتقان %'], rows: () => lvRows(), calcAt: 4, calc: r => pct(r[2], r[1], r[4]), total: [1, 2, 3], totalCalc: t => pct(t[2], t[1], '') } }
  ];
  // percentage column filled automatically when left empty
  function pct(a, b, typed) {
    if (String(typed || '').trim()) return typed;
    const x = parseFloat(String(a || '').replace(',', '.')), y = parseFloat(String(b || '').replace(',', '.'));
    return isFinite(x) && isFinite(y) && y > 0 ? String(+(x / y * 100).toFixed(2)) : '';
  }
  const meetN = f => f && f.n >= 0 && f.n < 4 ? +f.n : Math.max(0, ORD.findIndex(o => String((f && f.t1) || '').includes(o)));
  const meetTargets = () => MEET_TARGETS0.map(adapt);
  const MEET_TARGETS0 = ['أمهات وآباء وأولياء السنوات الأولى إلى الخامسة ابتدائي', 'أمهات وآباء وأولياء السنة السادسة ابتدائي', 'جمعية أمهات وآباء وأولياء التلاميذ', 'فعاليات المجتمع المدني والشركاء المحليون'];
  const OD_TARGETS = ['أمهات وآباء وأولياء أمور التلميذات والتلاميذ', 'فعاليات المجتمع المحلي والشركاء', 'جمعية أمهات وآباء وأولياء أمور التلاميذ'];
  const WS_TARGETS = ['الأستاذات والأساتذة بالمؤسسة', 'الأطر الإدارية', 'هيئة التأطير والمراقبة التربوية'];
  const OD = [
    { t1: 'التقرير التركيبي للمحطة الأولى للأبواب المفتوحة', t2: sy => `الأبواب المفتوحة المواكبة للدخول المدرسي ${sy} بمؤسسات الريادة بسلك التعليم الابتدائي`,
      obj: sy => [`تقديم أهم مستجدات الدخول المدرسي برسم السنة الدراسية ${sy}، والتعريف ببرنامج الأسابيع الأولى؛`, 'التأكيد على أهمية الالتحاق الفعلي والمواظبة المنتظمة منذ بداية السنة الدراسية؛', 'تقديم روائز الموضعة القبلية وأهدافها، وشرح برنامج الدعم المكثف وأهمية المواظبة على حصصه؛', 'تقديم المعلومات المتعلقة بالكتب واللوازم المدرسية والإجراءات المتخذة لضمان توفرها؛', 'تقديم أهداف التعلم والأولويات التربوية للسنة الدراسية، وكذا مشروع المؤسسة المندمج وأهم الأنشطة المبرمجة؛', 'توضيح دور الأسرة في المواكبة اليومية لبناتها وأبنائها، والتعريف بقنوات ومواعيد التواصل مع المؤسسة؛', 'التحقق من أرقام هواتف أمهات وآباء وأولياء أمور التلميذات والتلاميذ وتحيينها أو تسجيلها عند الاقتضاء؛', 'فتح باب النقاش مع الأسر وفعاليات المجتمع المحلي والشركاء، وتلقي ملاحظاتهم وأسئلتهم ومقترحاتهم.'] },
    { t1: 'التقرير التركيبي للمحطة الثانية للأبواب المفتوحة', t2: sy => `الأبواب المفتوحة الثانية برسم السنة الدراسية ${sy} بمؤسسات الريادة بسلك التعليم الابتدائي`,
      obj: () => ['عرض النتائج المرحلية ومؤشرات التعلمات للأسدس الأول؛', 'تتبع مدى إنجاز الأنشطة المبرمجة مع الأسر وفعاليات المجتمع المحلي والشركاء؛', 'تقاسم حصيلة الدعم الممتد وبرنامج الأسدس الثاني؛', 'تعزيز دور الأسرة في المواكبة اليومية وتتبع المواظبة؛', 'فتح باب النقاش مع الأسر وفعاليات المجتمع المحلي والشركاء، وتلقي ملاحظاتهم وأسئلتهم ومقترحاتهم.'] },
    { t1: 'التقرير التركيبي للأبواب المفتوحة الختامية', t2: sy => `الأبواب المفتوحة الختامية للسنة الدراسية ${sy} بمؤسسات الريادة بسلك التعليم الابتدائي`,
      obj: sy => ['تقديم النتائج النهائية للسنة الدراسية وتثمين جهود التلميذات والتلاميذ والأسر؛', 'تقاسم برنامج الأنشطة الصيفية ولائحة اللوازم المدرسية؛', `تقديم توجيهات الاستعداد للموسم الدراسي ${nextSy(sy)}؛`, 'الانفتاح على فعاليات المجتمع المحلي والشركاء؛', 'عقد لقاء خاص مع أسر تلميذات وتلاميذ السنة السادسة حول الانتقال إلى السلك الإعدادي.'] }
  ];
  const PV_AGENDA = [
    ['استقبال أعضاء مكتب الجمعية والتعريف ببرنامج مدارس الريادة ومراحل السنة الدراسية', 'عرض نتائج التلاميذ قبل وبعد مرحلة الدعم المكثف ومناقشة التقدم المحرز', 'إرساء حوار بين المؤسسة والجمعية قصد تتبع مسار التلاميذ ومعالجة الصعوبات المتبقية', 'ترسيخ مبدأ المسؤولية المشتركة بين المدرسة والأسرة في تتبع التعلمات', 'التداول في آليات التواصل الدائم بين المؤسسة ومكتب الجمعية'],
    ['تقديم نتائج التقييمات المرحلية الأولى وتحليل مؤشرات الأداء في كل مستوى دراسي', 'تحديد لائحة التلاميذ الذين لا يزالون في حاجة إلى الدعم المؤسساتي والتواصل مع أسرهم', 'إعداد جدولة اللقاءات الفردية مع أسر التلاميذ ذوي الصعوبات المستمرة', 'مناقشة آليات تعزيز المرافقة المنزلية وانخراط الأسر في متابعة أداء أبنائهم', 'برمجة أنشطة دعم التحصيل في إطار برنامج الريادة بالتنسيق مع الجمعية'],
    ['عرض النتائج المرحلية ومؤشرات التعلمات في الفصلين الأول والثاني', 'تقييم مدى تطور أداء التلاميذ ذوي الصعوبات في ضوء الدعم المقدم', 'إعداد لقاءات فردية مع أسر التلاميذ الذين تعترضهم صعوبات مستمرة', 'مناقشة مقترحات الجمعية لتعزيز انخراط الأسر في مشروع المؤسسة المندمج', 'التخطيط للأبواب المفتوحة الربيعية وتحديد أدوار الجمعية في التنظيم والاستقبال'],
    ['عرض التقييم الشامل لنتائج السنة الدراسية ومسار الارتقاء التعليمي للتلاميذ', 'إعداد اللقاءات الفردية الأخيرة مع أسر التلاميذ الذين تعترضهم صعوبات مستمرة', 'تقييم مسيرة الشراكة بين المؤسسة والجمعية خلال السنة الدراسية وتثمين جهود الأسر', 'مناقشة البرنامج التحضيري للأبواب المفتوحة الختامية ودور الجمعية في التنظيم', 'رصد المقترحات والتوصيات لتطوير الشراكة بين المدرسة والأسرة في السنة الدراسية المقبلة']
  ];
  // 1.9.4: wording of the minutes of the four meetings with the association bureau (model minutes of a pioneer school), editable
  const PV_TIME = ['10:00 صباحا', '17:00 مساء', '14:00 بعد الزوال', '18:00 مساء'];
  const PV_ANS = (n, sy, dir, pres) => {
    const D = dir ? `مدير المؤسسة السيد(ة) ${dir}` : 'مدير(ة) المؤسسة', P = pres ? `رئيس الجمعية السيد ${pres}` : 'رئيس الجمعية';
    return [[
      `استقبل ${D} أعضاء مكتب جمعية أمهات وآباء وأولياء التلاميذ، ورحب بحضورهم، ثم قدم عرضا موجزا حول نموذج مدارس الريادة وأهدافه الكبرى، مع استعراض المحطات الأساسية للسنة الدراسية ${syDash(sy)} وآفاق التطور المتوقع على مستوى تحصيل التلاميذ.`,
      'عرض الأساتذة الحاضرون نتائج التقييم التشخيصي المجرى قبل انطلاق مرحلة الدعم المكثف، وقارنوها بالنتائج المحققة في نهاية تلك المرحلة. وقد أبدى أعضاء الجمعية ارتياحهم للتحسن الملحوظ في مستوى التلاميذ، وأبدوا استعدادهم للمساهمة في استدامة هذا التقدم من خلال المرافقة المنزلية.',
      'جرى تداول مفتوح بين الطرفين حول آليات التواصل المنتظم، وأكد مدير المؤسسة على أهمية الإخطار المبكر لأسر التلاميذ الذين يسجلون تعثرا في التعلمات. واتفق على برمجة لقاءات فردية مع أسر هؤلاء التلاميذ خلال الفصل الدراسي الأول.',
      `أكد ${P} أن الجمعية ستعمل على توعية الأسر بأهمية المتابعة المنزلية المنتظمة، وضبط الغياب، وتشجيع الأبناء على القراءة الذاتية. في المقابل، تعهد المدير بتزويد أولياء الأمور بتقارير دورية واضحة حول مستوى أبنائهم.`,
      'اتفق على استخدام مجموعات التواصل الإلكتروني لتبادل المستجدات، وتحديد اجتماع شهري منتظم بين مدير المؤسسة ورئيس الجمعية، مع الحرص على توثيق كل اجتماع بمحضر رسمي.',
      'أثار أحد أعضاء الجمعية مسألة توفير ظروف الاستقبال الملائمة داخل المؤسسة، وأبدى المدير استعداده لمعالجة الأمر في أقرب الآجال. ولم تسجل ملاحظات أخرى ذات طابع استعجالي.'
    ], [
      'قدم مدير المؤسسة نتائج التقييمات المرحلية للفصل الأول مرفوقة بتحليل مفصل لمؤشرات الأداء في مختلف المستويات، مع إبراز المواد التي يسجل فيها التلاميذ صعوبات متكررة. وأشار المدير إلى أن نسبة نجاح المؤسسة تسير وفق المسار المرسوم في إطار برنامج مدارس الريادة.',
      'تم تحديد قائمة بالتلاميذ الذين لا يزالون يعانون من تعثرات عميقة في التعلمات، واتفق على إرسال إشعارات فردية لأسرهم لاستدعائهم إلى لقاءات خاصة. وأبدى رئيس الجمعية استعداده للمساعدة في إيصال الدعوات إلى الأسر غير المتجاوبة.',
      'تمت برمجة اللقاءات الفردية مع أسر التلاميذ المعنيين خلال الأسبوعين الأخيرين من شهر دجنبر، على أن تجرى هذه اللقاءات في إطار منظم يضم الأستاذ(ة) وولي الأمر المعني.',
      'أكد أعضاء الجمعية على ضرورة نشر ثقافة المتابعة المنزلية بين الأسر، واقترح رئيس الجمعية تنظيم ورشة توعوية لفائدة الآباء حول أساليب الدعم المنزلي البسيطة والفعالة. ورحب المدير بالمقترح وتعهد بتوفير الإمكانيات اللازمة.',
      'تم الاتفاق على برمجة أنشطة دعم إضافية في المواد الأساسية، مع إشراك الجمعية في التواصل مع المتطوعين من الأسر القادرة على المساهمة. وسيعد الأساتذة جدولا زمنيا تفصيليا لهذه الأنشطة.',
      'تمت الإشارة إلى ضرورة تفعيل الصندوق الاجتماعي للجمعية لدعم الأسر الهشة في اقتناء اللوازم المدرسية. ووعد رئيس الجمعية بعرض الموضوع على الجمعية العامة في أقرب اجتماع.'
    ], [
      'استعرض مدير المؤسسة أمام مكتب الجمعية نتائج الفصلين الدراسيين الأول والثاني، مشيرا إلى التحسن الملموس في مستوى عدد كبير من التلاميذ مقارنة بالتقييم التشخيصي الأولي. كما تم تقديم تحليل مقارن لمؤشرات التعلمات في اللغة العربية واللغة الفرنسية والرياضيات باعتبارها محاور برنامج الريادة.',
      'تبين من خلال شبكات التتبع أن غالبية التلاميذ الذين كانوا يسجلون تعثرات قد حققوا تقدما ملموسا، في حين لا تزال حالات محدودة تستوجب تدخلا مكثفا. وقد أبدى أعضاء الجمعية ارتياحهم للنتائج المحققة، وثمنوا جهود الفريق التربوي.',
      'تمت إعادة برمجة لقاءات فردية مع أسر التلاميذ الذين لا يزالون يعانون من صعوبات في التعلمات، مع تحديد توصيات عملية لكل حالة على حدة تشمل أساليب الدعم المنزلي والإحالة إلى الدعم المؤسساتي عند الاقتضاء.',
      'قدم رئيس الجمعية جملة من المقترحات العملية أبرزها: تنظيم زيارات أسرية للفضاءات التعليمية، وإشراك الأولياء في تصميم ركن القراءة بالمكتبة المدرسية. ورحب المدير بهذه المقترحات وأكد أنها ستدرج في مشروع المؤسسة المندمج.',
      'تم الاتفاق على برمجة الأبواب المفتوحة الثانية خلال شهر أبريل، على أن تتولى الجمعية الإشراف على استقبال الأسر وتوزيع البرنامج، فيما سيتكفل الأساتذة بعرض أعمال التلاميذ وتقديم نتائج الدورة الأولى.',
      'طالب أحد أعضاء الجمعية بتخصيص لوحة إعلانية للجمعية داخل المؤسسة. كما أثار المدير موضوع الانضباط في مواعيد الحضور وأوصى أعضاء الجمعية بتحسيس الأسر بأهمية الوقت المدرسي.'
    ], [
      `قدم مدير المؤسسة تقريرا شاملا لنتائج السنة الدراسية ${String(sy || '').replace('-', '/')}، مستعرضا مسار ارتقاء التلاميذ منذ التقييم التشخيصي الأولي وصولا إلى التقييمات الختامية. وأشار إلى أن المؤسسة حققت تقدما ملموسا في المؤشرات الأساسية لبرنامج مدارس الريادة.`,
      'تم الاتفاق على برمجة الجولة الأخيرة من اللقاءات الفردية مع أسر التلاميذ الذين لا يزالون يحتاجون إلى متابعة، مع تزويد كل أسرة بتقرير تفصيلي حول وضع ابنها وتوصيات للاستعداد للسنة الدراسية القادمة.',
      'أجرى الطرفان تقييما شاملا لمسيرة الشراكة طوال السنة الدراسية، وأبدى رئيس الجمعية ارتياحه للتنسيق الوثيق مع الإدارة التربوية. وثمن مدير المؤسسة دور الجمعية في تعبئة الأسر ورفع نسبة حضورها في اللقاءات التواصلية.',
      'تمت دراسة البرنامج الكامل للأبواب المفتوحة الختامية وتوزيع المهام بين الفريق التربوي ومكتب الجمعية. وستتولى الجمعية التواصل مع الشركاء المحليين وتنسيق حضور ممثلي الجماعة الترابية والسلطة المحلية.',
      'رصدت جملة من التوصيات أبرزها: توسيع قاعدة مشاركة الأسر في اللقاءات التواصلية، وتفعيل دور الجمعية في الدعم المادي للتلاميذ المحتاجين، وتطوير آليات التواصل الرقمي بين المؤسسة والأسر. وستدرج هذه التوصيات في مشروع المؤسسة للسنة المقبلة.',
      `شكر ${P} مدير المؤسسة والفريق التربوي على جهودهم المتواصلة طوال السنة الدراسية، مؤكدا أن الجمعية ستواصل دعمها للمؤسسة في تحقيق أهداف برنامج مدارس الريادة. وقد اختتم الاجتماع في جو من التفاؤل والتعاون البناء.`
    ]][n];
  };
  const PV_MONTH = sy => [`أكتوبر ${y1(sy)}`, `دجنبر ${y1(sy)}`, `مارس ${y2(sy)}`, `ماي ${y2(sy)}`];
  const PRES_TITLE = (k, sy) => ({
    ws: `الورشات التذكيرية لفائدة الأستاذات والأساتذة — الدخول المدرسي ${sy}`,
    od1: `تنظيم الأبواب المفتوحة الأولى للدخول المدرسي ${sy} مع أمهات وآباء وأولياء تلميذات وتلاميذ مؤسسات الريادة`,
    od2: `الأبواب المفتوحة الثانية مع أمهات وآباء وأولياء تلميذات وتلاميذ المؤسسة — ${sy}`,
    od3: `الأبواب المفتوحة الختامية مع أمهات وآباء وأولياء تلميذات وتلاميذ المؤسسة — ${sy}`,
    m1: 'اللقاء التواصلي الأول مع أمهات وآباء وأولياء التلاميذ', m2: 'اللقاء التواصلي الثاني مع أمهات وآباء وأولياء التلاميذ',
    m3: 'اللقاء التواصلي الثالث مع أمهات وآباء وأولياء التلاميذ', m4: 'اللقاء التواصلي الرابع مع أمهات وآباء وأولياء التلاميذ'
  })[k] || 'لقاء تواصلي';

  // dashboard figures: stations of the school year with their main report, the next station
  window.Partners.summary = () => {
    migrate(DB);
    const sy0 = MK.curSy();
    const main = st => st.main || st.type;
    const done = STATIONS.filter(st => PD().reports.some(r => r.sy === sy0 && r.station === st.k && r.type === main(st)));
    const ORDER = ['شتنبر', 'أكتوبر', 'نونبر', 'دجنبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو'];
    const mi = ORDER.indexOf(Dx.MONTHS[+today().slice(5, 7) - 1]);
    const next = STATIONS.find(st => !done.includes(st) && ORDER.indexOf(st.m) >= (mi < 0 ? 0 : mi)) || STATIONS.find(st => !done.includes(st));
    return { sy: sy0, total: STATIONS.length, done: done.length, next: next ? { m: next.m, act: next.act } : null, docs: PD().reports.filter(r => r.sy === sy0).length, members: PD().members.length, others: PD().others.length };
  };
  const lastOf = (type, pred) => PD().reports.filter(r => r.type === type && (!pred || pred(r))).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0];
  const defaults = (type, k, sy) => adaptDeep(defaults0(type, k, sy));
  function defaults0(type, k, sy) {
    const s = S();
    const st = stByK(k) || {};
    const base = { place: s.city || '', date: today() };
    if (type === 'meeting') {
      const n = st.n == null ? 0 : st.n, M = MEET[n];
      const prev = lastOf('meeting');
      const dist = prev && prev.f.dist && prev.f.dist.length ? prev.f.dist.map(r => [r[0], r[1], r[2], '', '']) : units().map(u => [u, '', '', '', '']);
      return Object.assign(base, { n, t1: `تقرير اللقاء التواصلي ${ORD[n]}${n === 3 ? ' (الختامي)' : ''}`, t2: M.sub(sy), t3: `مع أمهات وآباء وأولياء أمور التلميذات والتلاميذ — الموسم الدراسي ${sy} — مؤسسات الريادة بالتعليم الابتدائي`,
        directorate: dirName(s), school: s.school || '', kind: (prev && prev.f.kind) || 'الريادة – الابتدائي', when: '', memo: '', parents: '', women: '', men: '', staff: '', civil: '',
        dist, obj: typeof M.obj === 'function' ? M.obj(sy) : M.obj, targets: [true, true, true, true],
        axes: M.axes(sy).map(a => [a, '']), indivN: '', indiv: '', stats: M.stats.rows().map(r => [r].concat(M.stats.cols.slice(1).map(() => ''))),
        inter: 0, interTxt: '', questions: '', staffNotes: '', constraints: '', acts: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']], concl: '', impr: 0, imprTxt: '',
        sigDir: s.director || '', sigAssoc: president(), sigDate: '', photos: [] });
    }
    if (type === 'opendoors') {
      const n = st.n == null ? 0 : st.n, O = OD[n];
      const obj = O.obj(sy);
      return Object.assign(base, { t1: O.t1, t2: O.t2(sy), academy: s.academy || '', directorate: s.directorate || '', school: s.school || '', dates: '',
        parents: '', pW: '', pM: '', actors: '', aW: '', aM: '', others: '', oW: '', oM: '', intro: 'تم تنظيم الأبواب المفتوحة بالمؤسسة، لفائدة أمهات وآباء وأولياء أمور التلميذات والتلاميذ وفعاليات المجتمع المحلي والشركاء بهدف:',
        obj: obj.join('\n'), targets: [true, true, true], phoneChecked: '', phoneUpdated: '', phoneLeft: '', axes: obj.map(x => x.replace(/[؛.]$/, '')).join('\n'), axesOther: '',
        nFam: '', nQ: '', nStaff: '', nPart: '', nCons: '', pActs: '', pPart: '', pDead: '', pFollow: '', concl: '', impr: 0, imprTxt: '',
        sigDir: s.director || '', sigAssoc: president(), photos: [] });
    }
    if (type === 'workshops') {
      return Object.assign(base, { t1: 'التقرير التركيبي للورشات التذكيرية', t2: `في إطار تيسير تدبير انطلاق السنة الدراسية بمدارس الريادة بسلك التعليم الابتدائي - الموسم الدراسي ${sy}`,
        wplace: units()[0] || '', dates: '', teachers: '', tW: '', tM: '', admins: '', adW: '', adM: '', others: '', trainers: '',
        intro: 'تم تنظيم الورشات التذكيرية بمدارس الريادة، لفائدة الأستاذات والأساتذة والأطر الإدارية بهدف:',
        obj: [`تيسير تدبير انطلاق السنة الدراسية ${sy} بمدارس الريادة بسلك التعليم الابتدائي؛`, 'توحيد التصور حول طريقة تدبير لقاءات التقاسم على صعيد المؤسسات؛', 'توحيد التنظيم التربوي لفترة الدعم والمعالجة في بداية السنة الدراسية؛', 'تقاسم الموجهات المنبثقة عن اللقاء الإقليمي لمفتشي التعليم الابتدائي؛', 'توحيد برمجة تقاسم العروض بين الأستاذات والأساتذة، وبرمجة استقبال التلميذات والتلاميذ.'].join('\n'),
        targets: [true, false, false], program: '', axes: '', axesOther: '', nT: '', nQ: '', nAdm: '', nCons: '', pActs: '', pPart: '', pDead: '', pFollow: '', concl: '', impr: 0, imprTxt: '',
        sigDir: s.director || '', sigCoord: '', photos: [] });
    }
    if (type === 'pv') {
      const n = st.n == null ? -1 : st.n;
      const mem = PD().members.map(m => [m.name || '', m.role || '', '']);
      const att = [[s.director || '', 'مدير(ة) المؤسسة', '']].concat(mem.filter(m => m[0] !== s.director));
      const ans = n < 0 ? [] : PV_ANS(n, sy, s.director || '', president());
      return Object.assign(base, { title: n < 0 ? 'محضر اجتماع' : `محضر اللقاء التواصلي ${ORD[n]} - ${PV_MONTH(sy)[n]}`, sub: `مع مكتب ${assocFull(s)}`, time: n < 0 ? '' : PV_TIME[n], where: units()[0] || '', attCol: 'role',
        agenda: n < 0 ? [{ q: '', a: '' }] : PV_AGENDA[n].map((q, i) => ({ q, a: ans[i] || '' })), misc: ans[5] || '', att: att.length > 1 ? att : att.concat([['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']]), minRows: 8,
        sigRap: '', sigDir: s.director || '', sigPres: president() });
    }
    if (type === 'st2') {
      return Object.assign(base, { t1: 'التقرير التركيبي للمحطة التواصلية الثانية', t2: `اللقاءات التواصلية لاختتام فترة الدعم المكثف بمؤسسات الريادة بسلك التعليم الابتدائي — السنة الدراسية ${String(sy).replace('-', '/')}`,
        academy: s.academy || '', directorate: s.directorate || '', school: s.school || '', dates: '', parents: '', pW: '', pM: '', actors: '', aW: '', aM: '', others: '', oW: '', oM: '',
        intro: 'تم تنظيم المحطة التواصلية الثانية لفائدة أمهات وآباء وأولياء أمور التلميذات والتلاميذ، وبمشاركة جمعية أمهات وآباء وأولياء أمور التلميذات والتلاميذ، بهدف:',
        obj: ST2.obj.join('\n'), targets: [true, true], indivN: '', indivFam: '', indivAbs: '', indivActs: '',
        ax1: ST2.ax1.join('\n'), ax2: ST2.ax2.join('\n'), axesOther: '', nFam: '', nQ: '', nStaff: '', nPart: '', nCons: '',
        acts: ST2.acts.join('\n'), pActs: '', pPart: '', pDead: '', pFollow: '', conclL: ST2.concl.join('\n'), concl: '', impr: 0, imprTxt: '', photos: [],
        sigDir: s.director || '', sigAssoc: president(), sigRole: 'رئيس ج.آ.أ.ت', sigRap: '', repDate: '' });
    }
    if (type === 'invite') {
      const kind = st.type || '';
      const evt = kind === 'meeting' ? `اللقاء التواصلي ${ORD[st.n]} مع أمهات وآباء وأولياء التلاميذ` : kind === 'opendoors' ? `${st.act} بالمؤسسة` : kind === 'workshops' ? 'الورشات التذكيرية لفائدة الأستاذات والأساتذة' : 'اجتماع مكتب الجمعية';
      const ag = kind === 'meeting' ? MEET[st.n].axes(sy).slice(0, 4) : kind === 'opendoors' ? OD[st.n].obj(sy).slice(0, 4).map(x => x.replace(/[؛.]$/, '')) : [];
      const to = kind === 'workshops' ? 'staff' : kind ? 'parents' : 'assoc';
      if (st.main === 'st2') return Object.assign(base, { to: 'parents', cls: '', copies: 10, one: '', perPage: 2, layout: 'official', from: 'school',
        evt: 'المحطة التواصلية الثانية مع أمهات وآباء وأولياء أمور التلميذات والتلاميذ', mdate: '', time: '', where: s.school || units()[0] || '', agenda: ST2.inv.join('\n'),
        intro: INV_OFFICIAL, outro: 'إن حضوركم ومشاركتكم يسهمان في مواكبة تعلم وصحة بناتنا وأبنائنا وتعزيز تقدمهم الدراسي.', indiv: '1', indivDay: '', indivTime: '',
        sigWho: 'dir', sigName: '', tear: '', guard: '1' });
      return Object.assign(base, { to, cls: '', copies: 10, one: '', perPage: to === 'parents' ? 3 : 2, layout: 'letter', guard: '1', indiv: '', indivDay: '', indivTime: '', from: to === 'assoc' ? 'assoc' : 'school', evt,
        mdate: '', time: '', where: units()[0] || '', agenda: ag.join('\n'),
        intro: INV_INTRO, outro: to === 'parents' ? INV_OUT_P : INV_OUT, sigWho: to === 'assoc' ? 'pres' : 'dir', sigName: to === 'assoc' ? president() : (s.director || ''), tear: to === 'parents' });
    }
    if (type === 'agm') {
      return Object.assign(base, { assoc: assocFull(s), commune: s.commune || '', to: '', kind: 'العادي التجديدي', subject: 'إخبار بانعقاد الجمع العام العادي التجديدي لأعضاء الجمعية',
        mdate: '', time: 'الحادية عشرة صباحا', where: units()[0] || '', agenda: ['التقريران الأدبي والمالي ومناقشتهما والمصادقة عليهما', 'تجديد مكتب الجمعية', 'مختلفات'].join('\n'),
        body: AGM_BODY, sigName: president(), copy: '' });
    }
    // presence list
    return Object.assign(base, { title: PRES_TITLE(k, sy), unit: '', col4: 'رقم ب ت و', fill: '', rows: 30 });
  }

  /* ================================================================= */
  let tab = 'prog', sy = null;
  const yearsList = () => MK.syList(PD().reports.map(r => r.sy));
  const docsOf = (k, type) => PD().reports.filter(r => r.sy === sy && r.station === k && (!type || r.type === type));
  const repTitle = r => { const f = r.f || {}; return r.type === 'st2' ? [f.t1, f.t2].filter(Boolean).join(' — ') : r.type === 'meeting' || r.type === 'opendoors' || r.type === 'workshops' ? [f.t1, f.t2].filter(Boolean).join(' — ') : r.type === 'pv' ? f.title : r.type === 'invite' ? `دعوات الحضور: ${f.evt || ''}` : r.type === 'agm' ? (f.subject || TYPES.agm.label) : `${TYPES.presence.label}: ${f.title || ''}`; };

  window.pagePartners = function (v, arg) {
    migrate(DB);
    if (arg && arg.tab) tab = arg.tab;
    sy = MK.curSy();
    const T = [['prog', 'البرمجة السنوية للمحطات التواصلية'], ['reports', 'التقارير والمحاضر'], ['assoc', 'الجمعية والشركاء']];
    v.innerHTML = `<div class="page-h"><h1>التواصل مع الشركاء</h1>
        <select class="inp" id="pSy" style="width:auto">${yearsList().map(y => `<option value="${y}" ${y === sy ? 'selected' : ''}>الموسم الدراسي ${syDash(y)}</option>`).join('')}</select>
        <span class="sp"></span><button class="btn pri" id="pNew">${ic('plus')} وثيقة جديدة</button></div>
      <div class="mk-tabs"><div class="seg" id="pTabs">${T.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div id="pBody"></div>`;
    $$('#pTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; go('partners'); });
    $('#pSy').onchange = e => { sy = e.target.value; MK.setSy(sy); go('partners'); };
    $('#pNew').onclick = newDocBox;
    ({ prog: tabProg, reports: tabReports, assoc: tabAssoc })[tab]($('#pBody'));
  };

  function newDocBox() {
    const body = document.createElement('div');
    body.innerHTML = `<div class="fld"><label>نوع الوثيقة</label><select class="inp" id="nT">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t.label}</option>`).join('')}</select></div>
      <div class="fld"><label>المحطة التواصلية</label><select class="inp" id="nS"></select></div>`;
    const fill = () => {
      const t = $('#nT', body).value;
      const list = STATIONS.filter(st => DOCS_OF(st).includes(t));
      $('#nS', body).innerHTML = list.map(st => `<option value="${st.k}">${st.m} — ${st.act}</option>`).join('') + (['presence', 'pv', 'invite', 'agm'].includes(t) ? `<option value="">${t === 'agm' ? 'الجمع العام للجمعية' : 'لقاء / اجتماع آخر'}</option>` : '');
    };
    modal({ title: 'وثيقة جديدة', body, actions: [{ label: ic('plus') + ' إنشاء', cls: 'pri', onClick: () => { go('partnerDoc', { type: $('#nT', body).value, station: $('#nS', body).value, sy }); } }, { label: 'إلغاء' }] });
    $('#nT', body).onchange = fill; fill();
  }

  function tabProg(b) {
    b.innerHTML = `<div class="card"><table class="tbl compact"><thead><tr><th style="width:80px">الشهر</th><th style="width:190px">النشاط</th><th>المحور الأساسي</th><th style="width:330px">الوثائق</th></tr></thead><tbody>
      ${STATIONS.map(st => `<tr><td><b>${st.m}</b></td><td><b>${esc(st.act)}</b>${st.who ? `<br><small class="muted">${esc(st.who)}</small>` : ''}</td><td class="muted" style="font-size:12.5px;line-height:1.7">${esc(adapt(st.axis))}</td>
        <td>${DOCS_OF(st).map(t => { const ds = docsOf(st.k, t); return `<div class="pp-doc">${ds.length ? `${ic('check', 'style="width:16px;height:16px;color:var(--pri)"')} ` : '<span class="pp-dot"></span>'}<span class="lbl">${TYPES[t].short}</span>
          ${ds.map(r => `<button class="btn sm" data-open="${r.id}" title="فتح">${fmtDate(r.date) || 'فتح'}</button>`).join('')}<button class="btn sm ${ds.length ? '' : 'pri'}" data-new="${t}|${st.k}">${ic('plus')}${ds.length ? '' : ' إنشاء'}</button></div>`; }).join('')}</td></tr>`).join('')}
      </tbody></table></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.8">البرمجة حسب دليل الأبواب المفتوحة واللقاءات التواصلية بمؤسسات الريادة: تنظم الأبواب المفتوحة ثلاث مرات على الأقل في السنة، واللقاءات مع الأسر أربع مرات على الأقل. لكل محطة: التقرير (أو التقرير التركيبي)، محضر اللقاء مع مكتب الجمعية، ولائحة الحضور.</p>`;
    $$('[data-open]', b).forEach(x => x.onclick = () => go('partnerDoc', { id: x.dataset.open }));
    $$('[data-new]', b).forEach(x => x.onclick = () => { const [t, k] = x.dataset.new.split('|'); go('partnerDoc', { type: t, station: k, sy }); });
  }

  function tabReports(b) {
    const list = PD().reports.filter(r => r.sy === sy).sort((a, c) => (c.date || '').localeCompare(a.date || '') || (c.updated || '').localeCompare(a.updated || ''));
    b.innerHTML = `<div class="card">${list.length ? `<table class="tbl compact"><thead><tr><th style="width:110px">التاريخ</th><th style="width:200px">النوع</th><th>العنوان</th><th style="width:150px">المحطة</th><th></th></tr></thead><tbody>
      ${list.map(r => { const st = stByK(r.station); return `<tr data-id="${r.id}"><td class="num">${fmtDate(r.date)}</td><td>${TYPES[r.type].icon} ${TYPES[r.type].label}</td><td><b>${esc(repTitle(r))}</b></td><td class="muted">${st ? esc(st.act) : '—'}</td>
        <td class="act"><button class="btn sm pri" data-a="open">${ic('edit')} فتح</button> <button class="btn sm" data-a="dup" title="نسخة جديدة من هذه الوثيقة">${ic('copy')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`; }).join('')}
      </tbody></table>` : `<div class="empty-state">لا توجد وثائق لهذا الموسم بعد. ابدأ من «البرمجة السنوية» أو «وثيقة جديدة».</div>`}</div>`;
    $$('tr[data-id]', b).forEach(tr => {
      const r = PD().reports.find(x => x.id === tr.dataset.id);
      $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
        if (btn.dataset.a === 'open') go('partnerDoc', { id: r.id });
        if (btn.dataset.a === 'dup') { const c = JSON.parse(JSON.stringify(r)); Object.assign(c, { id: uid('pr'), created: new Date().toISOString(), updated: new Date().toISOString() }); PD().reports.push(c); persist(); go('partnerDoc', { id: c.id }); }
        if (btn.dataset.a === 'del' && await confirmBox(`حذف <b>${esc(repTitle(r))}</b>؟`, 'حذف')) { PD().reports = PD().reports.filter(x => x.id !== r.id); persist(); go('partners'); }
      });
      tr.ondblclick = () => go('partnerDoc', { id: r.id });
    });
  }

  function tabAssoc(b) {
    const s = S();
    const tbl = (key, cols, empty) => { const arr = PD()[key]; return arr.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th>${cols.map(c => `<th>${c[1]}</th>`).join('')}<th></th></tr></thead><tbody>
      ${arr.map((m, i) => `<tr data-i="${i}"><td class="muted num">${i + 1}</td>${cols.map(c => `<td${c[2] ? ' class="num" dir="ltr" style="text-align:right"' : ''}>${esc(m[c[0]] || '')}</td>`).join('')}
        <td class="act"><button class="btn sm icon" data-a="up" ${i ? '' : 'disabled'}>▲</button> <button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty-state">${empty}</div>`; };
    const MC = [['name', 'الاسم والنسب'], ['role', 'الصفة'], ['phone', 'الهاتف', 1], ['cin', 'رقم ب ت و', 1]];
    const OC = [['name', 'الاسم / الهيئة'], ['role', 'الصفة / المجال'], ['phone', 'الهاتف', 1], ['note', 'ملاحظات']];
    b.innerHTML = `<div class="card"><div class="card-b"><div class="fld" style="max-width:640px"><label>اسم الجمعية</label><input class="inp" id="aName" value="${esc(PD().assocName)}" placeholder="${esc(assocFull(s))}"></div></div></div>
      <div class="card" style="margin-top:14px"><div class="toolbar"><b>مكتب جمعية أمهات وآباء وأولياء التلاميذ</b><span style="flex:1"></span><button class="btn sm pri" data-add="members">${ic('plus')} إضافة عضو</button></div>
        <div data-t="members">${tbl('members', MC, 'أضف أعضاء مكتب الجمعية: يظهرون تلقائيا في محاضر اللقاءات (الحاضرون) وفي لوائح الحضور.')}</div></div>
      <div class="card" style="margin-top:14px"><div class="toolbar"><b>الشركاء وفعاليات المجتمع المحلي</b><span style="flex:1"></span><button class="btn sm" data-add="others">${ic('plus')} إضافة شريك</button></div>
        <div data-t="others">${tbl('others', OC, 'الجماعة الترابية، السلطة المحلية، الجمعيات المحلية، المركز الصحي...')}</div></div>`;
    $('#aName').onchange = e => { PD().assocName = e.target.value.trim(); persist(); };
    const edit = (key, i) => {
      const cols = key === 'members' ? MC : OC;
      const x = i == null ? {} : PD()[key][i];
      const body = document.createElement('div');
      body.innerHTML = `<div class="fgrid">${cols.map(c => `<div class="fld ${c[0] === 'note' ? 'full' : ''}"><label>${c[1]}</label><input class="inp" data-k="${c[0]}" ${c[2] ? 'dir="ltr"' : ''} value="${esc(x[c[0]] || '')}" ${c[0] === 'role' && key === 'members' ? 'list="roleL"' : ''}${c[0] === 'name' ? ' list="ppEmps"' : ''}></div>`).join('')}</div>
        <datalist id="roleL">${['رئيس الجمعية', 'نائب الرئيس', 'أمين المال', 'نائب الأمين', 'الكاتب العام', 'نائب الكاتب', 'مستشار(ة)'].map(o => `<option value="${o}">`).join('')}</datalist><datalist id="ppEmps">${K.PP.options('k2Emps')}</datalist>`;
      // a school employee picked as a member / partner fills the role (cadre), phone and ID number
      const nameEl = $('[data-k="name"]', body);
      if (nameEl) nameEl.onchange = () => {
        const e = K.E.byName(nameEl.value); if (!e) return;
        const put = (k, v) => { const el = $(`[data-k="${k}"]`, body); if (el && v && !el.value.trim()) el.value = v; };
        nameEl.value = fullName(e); put('phone', e.phone); put('cin', e.cin); put('role', e.cadre);
      };
      modal({ title: i == null ? 'إضافة' : 'تعديل', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
        const o = {}; $$('[data-k]', body).forEach(el => { o[el.dataset.k] = el.value.trim(); });
        if (!o.name) { toast('المرجو كتابة الاسم', true); return false; }
        if (i == null) PD()[key].push(o); else Object.assign(PD()[key][i], o);
        persist(); go('partners');
      } }, { label: 'إلغاء' }] });
    };
    $$('[data-add]', b).forEach(x => x.onclick = () => edit(x.dataset.add));
    $$('[data-t]', b).forEach(box => $$('tr[data-i]', box).forEach(tr => {
      const key = box.dataset.t, i = +tr.dataset.i;
      $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
        const arr = PD()[key];
        if (btn.dataset.a === 'edit') return edit(key, i);
        if (btn.dataset.a === 'up' && i > 0) { const [x] = arr.splice(i, 1); arr.splice(i - 1, 0, x); persist(); go('partners'); }
        if (btn.dataset.a === 'del' && await confirmBox(`حذف <b>${esc(arr[i].name)}</b>؟`, 'حذف')) { arr.splice(i, 1); persist(); go('partners'); }
      });
    }));
  }

  /* ================================================================= */
  /* form builder (right panel) */
  function shrinkJpeg(dataUrl, maxW) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, (maxW || 1100) / Math.max(img.naturalWidth, img.naturalHeight * 1.3));
        const c = document.createElement('canvas');
        c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
        res(c.toDataURL('image/jpeg', 0.72));
      };
      img.onerror = () => rej(new Error('صورة غير صالحة'));
      img.src = dataUrl;
    });
  }
  function fieldHtml(d, f) {
    if (d.sec) return `<div class="sec-t full">${d.sec}</div>`;
    if (d.note) return `<p class="muted full" style="font-size:12px;line-height:1.7;margin:-4px 0 8px">${d.note}</p>`;
    const lab = d.l ? `<label>${d.l}</label>` : '';
    const v = f[d.k];
    const cls = `fld ${d.half ? '' : 'full'}`;
    switch (d.t) {
      case 'area': return `<div class="${cls}">${lab}<textarea class="inp" data-k="${d.k}" rows="${d.rows || 3}" placeholder="${esc(d.ph || '')}">${esc(v || '')}</textarea>${d.hint ? `<span class="hint">${d.hint}</span>` : ''}</div>`;
      case 'date': return `<div class="${cls}">${lab}<input class="inp" type="date" data-k="${d.k}" value="${esc(v || '')}"></div>`;
      case 'num': return `<div class="${cls}">${lab}<input class="inp" type="number" min="0" data-k="${d.k}" value="${esc(v == null ? '' : v)}" placeholder="${esc(d.ph || '')}"></div>`;
      case 'radio': return `<div class="${cls}">${lab}<div class="seg pp-seg">${d.opts.map((o, i) => `<button type="button" data-rk="${d.k}" data-v="${i}" class="${+v === i ? 'on' : ''}">${o}</button>`).join('')}</div></div>`;
      case 'checks': return `<div class="${cls}">${lab}${d.opts.map((o, i) => `<label class="chk" style="margin:3px 0"><input type="checkbox" data-ck="${d.k}" data-i="${i}" ${v && v[i] ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div>`;
      case 'grid': {
        const rows = v || [];
        const wide = d.cols.length > 3 && !d.compact;
        return `<div class="${cls}">${lab}<div class="pp-grid ${wide ? 'wide' : ''}" style="--n:${d.cols.length}">
          ${!wide ? `<div class="pp-gh">${d.cols.map(c => `<span>${c}</span>`).join('')}<span></span></div>` : ''}
          ${rows.map((r, i) => `<div class="pp-gr">${d.cols.map((c, j) => `<input class="inp" data-g="${d.k}" data-r="${i}" data-c="${j}" value="${esc(r[j] || '')}" placeholder="${esc(wide || d.ph ? c : '')}" ${d.list && d.list[j] ? `list="${d.list[j]}"` : ''}>`).join('')}
            ${d.fixed ? '<span></span>' : `<button type="button" class="btn sm danger icon" data-gdel="${d.k}" data-r="${i}" title="حذف السطر">✕</button>`}</div>`).join('')}
          </div>${d.fixed ? '' : `<button type="button" class="btn sm" data-gadd="${d.k}" style="margin-top:6px">${ic('plus')} إضافة سطر</button>`}${d.hint ? `<span class="hint">${d.hint}</span>` : ''}</div>`;
      }
      case 'agenda': return `<div class="${cls}">${lab}${(v || []).map((it, i) => `<div class="pp-ag"><div class="pp-agh"><b>${i + 1}.</b><input class="inp" data-ag="${d.k}" data-r="${i}" data-c="q" value="${esc(it.q || '')}" placeholder="النقطة"><button type="button" class="btn sm danger icon" data-agdel="${d.k}" data-r="${i}">✕</button></div>
          <textarea class="inp" data-ag="${d.k}" data-r="${i}" data-c="a" rows="3" placeholder="ما راج في هذه النقطة / القرارات المتخذة">${esc(it.a || '')}</textarea></div>`).join('')}
        <button type="button" class="btn sm" data-agadd="${d.k}">${ic('plus')} إضافة نقطة</button></div>`;
      case 'photos': return `<div class="${cls}">${lab}<div class="pp-ph">${(v || []).map((p, i) => `<div><img src="${p}"><button type="button" class="btn sm danger icon" data-phdel="${d.k}" data-r="${i}">✕</button></div>`).join('')}</div>
        ${(v || []).length < 6 ? `<button type="button" class="btn sm" data-phadd="${d.k}">${ic('plus')} إضافة صورة</button>` : ''}<span class="hint">إلى 6 صور (تصغر تلقائيا).</span></div>`;
      case 'select': return `<div class="${cls}">${lab}<select class="inp" data-k="${d.k}">${d.opts.map(([k, l]) => `<option value="${esc(k)}" ${String(v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>`;
      default: return `<div class="${cls}">${lab}<input class="inp" data-k="${d.k}" value="${esc(v == null ? '' : v)}" placeholder="${esc(d.ph || '')}" ${d.list ? `list="${d.list}"` : ''}></div>`;
    }
  }
  function buildForm(box, defs, f, refresh, extra) {
    const draw = () => {
      const sc = box.scrollTop;
      box.innerHTML = (extra ? extra() : '') + `<div class="fgrid">${defs().map(d => fieldHtml(d, f)).join('')}</div>
        <datalist id="ppEmps">${sortedEmps().map(e => `<option value="${esc(fullName(e))}">`).join('')}</datalist>
        <datalist id="ppUnits">${units().map(u => `<option value="${esc(u)}">`).join('')}</datalist>`;
      box.scrollTop = sc;
      if (box.onDraw) box.onDraw();
    };
    box.oninput = e => {
      const el = e.target, ds = el.dataset;
      if (ds.k) f[ds.k] = el.type === 'number' ? el.value : el.value;
      else if (ds.g) { f[ds.g][+ds.r][+ds.c] = el.value; }
      else if (ds.ag) { f[ds.ag][+ds.r][ds.c] = el.value; }
      else return;
      refresh();
    };
    box.onchange = e => {
      const el = e.target, ds = el.dataset;
      if (ds.ck) { f[ds.ck] = f[ds.ck] || []; f[ds.ck][+ds.i] = el.checked; refresh(); }
      else if (el.tagName === 'SELECT' && ds.k) { f[ds.k] = el.value; refresh(); if (box.onSelect) box.onSelect(ds.k); }
    };
    box.onclick = async e => {
      const el = e.target.closest('button'); if (!el) return;
      const ds = el.dataset;
      if (ds.rk) { f[ds.rk] = +ds.v; $$(`[data-rk="${ds.rk}"]`, box).forEach(b => b.classList.toggle('on', b === el)); refresh(); return; }
      if (ds.gadd) { const d = defs().find(x => x.k === ds.gadd); f[ds.gadd].push(d.cols.map(() => '')); draw(); refresh(); return; }
      if (ds.gdel) { f[ds.gdel].splice(+ds.r, 1); draw(); refresh(); return; }
      if (ds.agadd) { f[ds.agadd].push({ q: '', a: '' }); draw(); refresh(); return; }
      if (ds.agdel) { f[ds.agdel].splice(+ds.r, 1); draw(); refresh(); return; }
      if (ds.phdel) { f[ds.phdel].splice(+ds.r, 1); draw(); refresh(); return; }
      if (ds.phadd) {
        const raw = await window.api.openImage(); if (!raw) return;
        try { f[ds.phadd] = f[ds.phadd] || []; f[ds.phadd].push(await shrinkJpeg(raw, 1100)); draw(); refresh(); } catch (err) { toast(err.message, true); }
      }
    };
    draw();
    return draw;
  }

  const SIG_IMPR = ['إيجابي', 'متوسط', 'ضعيف'];
  const ST2_TARGETS = ['أمهات وآباء وأولياء أمور التلميذات والتلاميذ', 'جمعية أمهات وآباء وأولياء أمور التلاميذ'];
  // 1.9.4 — invitations: {اللقاء} {اليوم} {التاريخ} {الساعة} {المكان} are replaced by the data of the meeting
  const INV_INTRO = 'وبعد، يشرفني أن أدعوكم لحضور {اللقاء}، الذي سينعقد يوم {اليوم} {التاريخ} على الساعة {الساعة} ب{المكان}، وذلك لتدارس النقاط التالية:';
  const INV_OUT_P = 'ونظرا لأهمية هذا اللقاء في تتبع المسار الدراسي لابنكم (ابنتكم)، أرجو منكم الحرص على الحضور في الموعد المحدد.';
  const INV_OUT = 'ونظرا لأهمية هذا اللقاء، أرجو منكم الحرص على الحضور في الموعد المحدد.';
  const AGM_BODY = 'وبعد، يشرفني أن أخبركم بانعقاد {الجمع} لمكتب {الجمعية} ب{المكان} وذلك يوم {اليوم} {التاريخ} على الساعة {الساعة}.';
  // 1.9.4 — second communication station, closing the intensive support period + school health
  const ST2 = {
    obj: ['تقاسم حصيلة فترة الدعم المكثف والتقدم المحرز في التعلمات', 'شرح بيان نتائج الدعم المكثف للأسر في إطار لقاءات فردية مع الأستاذات والأساتذة', 'تحديد الحاجات والتعثرات التي ما تزال تستدعي المواكبة', 'تعريف الأسر بالتدابير المبرمجة بعد فترة الدعم المكثف', 'تحسيس الأسر بأهمية الصحة المدرسية وعلاقتها بالتعلم والمواظبة', 'تقاسم أهم رسائل الوقاية والعادات الصحية السليمة', 'تعزيز التواصل والتعاون بين الأسرة والمؤسسة'],
    ax1: ['تقديم حصيلة فترة الدعم المكثف والتقدم المحرز', 'شرح نتائج التلميذات والتلاميذ قبل وبعد الدعم', 'توضيح الجوانب التي تحسنت والحاجات التي ما تزال تستدعي التعزيز', 'تقديم التدابير المبرمجة لمواصلة المواكبة', 'التأكيد على أهمية المواظبة والمتابعة الأسرية'],
    ax2: ['توضيح العلاقة بين صحة الطفل والتعلم والمواظبة', 'تقاسم رسائل التوعية والوقاية من الأمراض', 'التأكيد على أهمية التلقيح والنظافة وتتبع الحالة الصحية للطفل', 'التعريف بأهمية التواصل مع المؤسسة عند وجود صعوبات صحية قد تؤثر على التعلم', 'التذكير بتفعيل استمارة ملاحظة بعض الصعوبات المؤثرة على التعلمات عبر منظومة مسار'],
    acts: ['التواصل مع الأسر التي لم تتمكن من حضور اللقاءات', 'مواصلة تتبع التلميذات والتلاميذ الذين ما تزال لديهم حاجات في التعلمات', 'تتبع تنفيذ التوصيات المتفق عليها خلال اللقاءات الفردية', 'مواصلة التواصل مع الأسر بشأن تقدم بناتها وأبنائها', 'استكمال تعبئة المعطيات المتعلقة بالصعوبات المؤثرة على التعلمات عبر منظومة مسار', 'التواصل الفردي مع الأسر المعنية عند رصد صعوبات قد تستدعي مواكبة صحية', 'مواصلة أنشطة التوعية والتحسيس في مجال الصحة المدرسية', 'تتبع المبادرات المتفق عليها مع جمعية الآباء والشركاء'],
    concl: ['تحسين التواصل الفردي مع الأسر', 'مواصلة مواكبة التلميذات والتلاميذ الذين ما تزال لديهم حاجات في التعلمات', 'تعزيز المواظبة والمتابعة الأسرية', 'تحسين استثمار بيان نتائج الدعم المكثف في التواصل مع الأسر', 'تعزيز التوعية بالصحة المدرسية والوقاية', 'تتبع الحالات التي قد تستدعي مواكبة صحية', 'تطوير مساهمة جمعية الآباء والشركاء في التعبئة والتوعية'],
    inv: ['تقديم حصيلة فترة الدعم المكثف والتقدم المحرز في التعلمات', 'تقاسم وشرح بيان نتائج الدعم المكثف الخاص بالتلميذ(ة) في إطار لقاء فردي مع الأستاذ(ة)', 'توضيح التدابير المبرمجة لمواصلة المواكبة', 'تقديم أهم الرسائل المتعلقة بالصحة المدرسية والوقاية', 'تعزيز التواصل والتعاون بين الأسرة والمؤسسة', 'فتح المجال لتساؤلات وملاحظات الأسر']
  };
  const INV_OFFICIAL = 'في إطار تنزيل مشروع مؤسسات الريادة، وتنفيذا لبرنامج التواصل والتعبئة مع أمهات وآباء وأولياء أمور التلميذات والتلاميذ، تتشرف إدارة المؤسسة بدعوتكم لحضور {اللقاء}، المنظمة بعد انتهاء فترة الدعم المكثف، برسم السنة الدراسية {السنة}.';
  const INV_TO = [['parents', 'أمهات وآباء وأولياء التلاميذ'], ['assoc', 'أعضاء مكتب الجمعية'], ['staff', 'موظفو المؤسسة (الأطر الإدارية والتربوية)'], ['others', 'الشركاء وفعاليات المجتمع المحلي'], ['one', 'جهة واحدة / شخص واحد']];
  const FORMS = {
    meeting: f => { const M = MEET[meetN(f)]; return [
      { sec: 'العنوان' }, { k: 't1', l: 'العنوان' }, { k: 't2', l: 'المحطة' }, { k: 't3', l: 'سطر ثالث', t: 'area', rows: 2 },
      { sec: '1- المعطيات العامة' }, { k: 'school', l: 'المؤسسة', half: 1 }, { k: 'directorate', l: 'المديرية الإقليمية', half: 1 }, { k: 'when', l: 'تاريخ / توقيت اللقاء', half: 1, ph: 'مثال: السبت 08 نونبر ابتداء من 11:30' }, { k: 'kind', l: 'نوع المؤسسة', half: 1 },
      { k: 'memo', l: 'مرجع المذكرة الداخلية', half: 1 }, { k: 'parents', l: 'إجمالي أولياء الأمور المشاركين', t: 'num', half: 1, ph: 'تلقائي: النساء + الرجال' }, { k: 'women', l: 'عدد النساء', t: 'num', half: 1 }, { k: 'men', l: 'عدد الرجال', t: 'num', half: 1 },
      { k: 'staff', l: 'أطر المؤسسة الحاضرون', t: 'num', half: 1 }, { k: 'civil', l: 'فاعلون من المجتمع المدني', t: 'num', half: 1 },
      { sec: '2- توزيع المهام على الوحدات المدرسية' }, { k: 'dist', t: 'grid', cols: ['الوحدة المدرسية', 'المكلف(ة) بالتنسيق', 'المكلف(ة) بالتوثيق', 'التاريخ والتوقيت', 'ملاحظات'], list: ['ppUnits', 'ppEmps', 'ppEmps'] },
      { sec: '3- أهداف اللقاء والفئات المستهدفة' }, { k: 'obj', l: 'أهداف اللقاء', t: 'area', rows: 4 }, { k: 'targets', l: 'الفئات المستهدفة', t: 'checks', opts: meetTargets() },
      { sec: '4- محاور العروض والنقاش' }, { k: 'axes', l: 'أولا: اللقاء الجماعي مع أولياء الأمور', t: 'grid', cols: ['محور اللقاء', 'ما تم عرضه / مخرجات النقاش'] },
      { k: 'indivN', l: 'ثانيا: عدد اللقاءات الفردية المنجزة', t: 'num', half: 1 }, { k: 'indiv', l: 'أبرز المواضيع المطروحة خلال اللقاءات الفردية', t: 'area', hint: 'سطر لكل موضوع' },
      { k: 'stats', l: `4-ب- ${M.stats.title}`, t: 'grid', cols: M.stats.cols, compact: M.stats.cols.length > 4, hint: M.stats.calc ? 'النسب تحتسب تلقائيا إذا تركت فارغة.' : '' },
      { sec: '5- الملاحظات والتفاعلات' }, { k: 'inter', l: 'تفاعل الأسر مع اللقاء', t: 'radio', opts: SIG_IMPR }, { k: 'interTxt', l: 'تفصيل', t: 'area', rows: 2 },
      { k: 'questions', l: 'أهم الأسئلة المطروحة من طرف أولياء الأمور', t: 'area', hint: 'سطر لكل سؤال' }, { k: 'staffNotes', l: 'ملاحظات الأطر التربوية والإدارية', t: 'area' }, { k: 'constraints', l: 'الإكراهات والعوائق المسجلة إن وجدت', t: 'area' },
      { sec: '6- الأنشطة والالتزامات المتفق عليها' }, { k: 'acts', t: 'grid', cols: ['النشاط / الالتزام', 'آجال التنفيذ', 'الجهة المسؤولة'] },
      { sec: '7- الخلاصات والتوصيات' }, { k: 'concl', t: 'area', rows: 4, hint: 'سطر لكل خلاصة أو توصية' },
      { sec: '8- الانطباع العام عن اللقاء' }, { k: 'impr', t: 'radio', opts: SIG_IMPR }, { k: 'imprTxt', l: 'تعليل (اختياري)', t: 'area', rows: 2 },
      { sec: '9- التوقيعات' }, { k: 'sigDir', l: 'اسم مدير(ة) المؤسسة', half: 1 }, { k: 'sigAssoc', l: 'ممثل الجمعية / المجتمع المحلي', half: 1 }, { k: 'sigDate', l: 'تاريخ التحرير والإمضاء (اختياري)', half: 1 }, { k: 'date', l: 'تاريخ الوثيقة (السجل)', t: 'date', half: 1 },
      { sec: 'صور توثيقية' }, { k: 'photos', t: 'photos' }]; },
    opendoors: () => [
      { sec: 'العنوان' }, { k: 't1', l: 'العنوان' }, { k: 't2', l: 'العنوان الفرعي', t: 'area', rows: 2 },
      { sec: '1- المعطيات العامة' }, { k: 'academy', l: 'الأكاديمية الجهوية للتربية والتكوين' }, { k: 'directorate', l: 'المديرية الإقليمية' }, { k: 'school', l: adapt('المؤسسة الابتدائية الرائدة') }, { k: 'dates', l: 'تاريخ/تواريخ اللقاء(ات)', t: 'area', rows: 2 },
      { k: 'parents', l: 'عدد أولياء الأمور المشاركين', ph: 'تلقائي: النساء + الرجال' }, { k: 'pW', l: 'النساء', t: 'num', half: 1 }, { k: 'pM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'actors', l: 'عدد الفاعلين التربويين (المدير، الأساتذة ...)', ph: 'تلقائي: النساء + الرجال' }, { k: 'aW', l: 'النساء', t: 'num', half: 1 }, { k: 'aM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'others', l: 'فاعلون آخرون (الجماعة الترابية، الجمعيات المحلية...)' }, { k: 'oW', l: 'النساء', t: 'num', half: 1 }, { k: 'oM', l: 'الرجال', t: 'num', half: 1 },
      { sec: '2- موضوع وأهداف الأبواب المفتوحة' }, { k: 'intro', l: 'تقديم', t: 'area', rows: 2 }, { k: 'obj', l: 'الأهداف', t: 'area', rows: 6, hint: 'سطر لكل هدف' },
      { k: 'targets', l: 'الفئات المستهدفة', t: 'checks', opts: OD_TARGETS },
      { k: 'phoneChecked', l: 'عدد أرقام الهواتف التي تم التحقق منها', t: 'num', half: 1 }, { k: 'phoneUpdated', l: 'عدد الأرقام التي تم تحيينها أو تسجيلها', t: 'num', half: 1 }, { k: 'phoneLeft', l: 'عدد الحالات التي تحتاج إلى استكمال', t: 'num', half: 1 },
      { sec: '3- أهم محاور العروض أو النقاش' }, { k: 'axes', l: 'المحاور', t: 'area', rows: 5, hint: 'سطر لكل محور' }, { k: 'axesOther', l: 'محاور أخرى تم تناولها', t: 'area', rows: 2 },
      { sec: '4- أهم الملاحظات والتفاعلات' }, { k: 'nFam', l: 'تفاعلات وملاحظات الأسر', t: 'area' }, { k: 'nQ', l: 'أهم الأسئلة المطروحة من طرف الأسر', t: 'area' }, { k: 'nStaff', l: 'تفاعلات وملاحظات الأطر التربوية والإدارية', t: 'area' },
      { k: 'nPart', l: 'تفاعلات وملاحظات فعاليات المجتمع المحلي والشركاء', t: 'area' }, { k: 'nCons', l: 'الإكراهات المسجلة، إن وجدت', t: 'area', rows: 2 },
      { sec: '5- الأنشطة المخطط لها' }, { note: 'مثلا: مواصلة تعبئة الأسر التي لم تحضر، تتبع الالتحاق والمواظبة، التواصل مع أسر المتغيبين، استكمال تحيين أرقام الهواتف، تتبع صعوبات الكتب واللوازم...' },
      { k: 'pActs', l: 'أهم الإجراءات المتفق بشأنها', t: 'area' }, { k: 'pPart', l: 'الجهات أو الشركاء المساهمون', t: 'area', rows: 2 }, { k: 'pDead', l: 'آجال التنفيذ أو التتبع', t: 'area', rows: 2 }, { k: 'pFollow', l: 'ملاحظات حول التتبع', t: 'area', rows: 2 },
      { sec: '6- الخلاصات والتوصيات' }, { k: 'concl', t: 'area', rows: 4 },
      { sec: '7- انطباعات الحضور حول اللقاء(ات)' }, { k: 'impr', t: 'radio', opts: SIG_IMPR }, { k: 'imprTxt', l: 'تعليل مختصر (اختياري)', t: 'area', rows: 2 },
      { sec: '8- بعض الصور' }, { k: 'photos', t: 'photos' },
      { sec: 'التوقيعات' }, { k: 'sigDir', l: 'اسم مدير المؤسسة', half: 1 }, { k: 'sigAssoc', l: 'ممثل جمعية الآباء / المجتمع المحلي', half: 1 }, { k: 'date', l: 'تاريخ الوثيقة (السجل)', t: 'date', half: 1 }],
    workshops: () => [
      { sec: 'العنوان' }, { k: 't1', l: 'العنوان' }, { k: 't2', l: 'العنوان الفرعي', t: 'area', rows: 2 },
      { sec: '1- المعطيات العامة' }, { k: 'wplace', l: 'المكان', list: 'ppUnits' }, { k: 'dates', l: 'تاريخ/تواريخ الورشات', t: 'area', rows: 2 },
      { k: 'teachers', l: 'عدد الأستاذات والأساتذة المشاركين', ph: 'تلقائي: النساء + الرجال' }, { k: 'tW', l: 'النساء', t: 'num', half: 1 }, { k: 'tM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'admins', l: 'عدد الأطر الإدارية المشاركة' }, { k: 'adW', l: 'النساء', t: 'num', half: 1 }, { k: 'adM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'others', l: 'فاعلون آخرون', t: 'area', rows: 2 }, { k: 'trainers', l: 'الأساتذة المؤطرون لأشغال الورشات', t: 'area', rows: 2 },
      { sec: '2- موضوع وأهداف الورشات التذكيرية' }, { k: 'intro', l: 'تقديم', t: 'area', rows: 2 }, { k: 'obj', l: 'الأهداف', t: 'area', rows: 5, hint: 'سطر لكل هدف' },
      { k: 'targets', l: 'الفئات المستهدفة', t: 'checks', opts: WS_TARGETS }, { k: 'program', l: 'برنامج الورشات والاستقبال حسب الأيام', t: 'area', rows: 4, hint: 'سطر لكل يوم، مثال: اليوم الأول (الخميس 03 شتنبر): ...' },
      { sec: '3- أهم محاور الورشات التذكيرية' }, { k: 'axes', l: 'المحاور', t: 'area', rows: 5 }, { k: 'axesOther', l: 'محاور أخرى تم تناولها', t: 'area', rows: 2 },
      { sec: '4- أهم الملاحظات والتفاعلات' }, { k: 'nT', l: 'تفاعلات وملاحظات الأستاذات والأساتذة', t: 'area' }, { k: 'nQ', l: 'أهم الأسئلة أو الاستفسارات المطروحة', t: 'area' }, { k: 'nAdm', l: 'تفاعلات وملاحظات الأطر الإدارية', t: 'area' }, { k: 'nCons', l: 'الإكراهات المسجلة، إن وجدت', t: 'area', rows: 2 },
      { sec: '5- الأنشطة المخطط لها' }, { k: 'pActs', l: 'أهم الإجراءات المتفق بشأنها', t: 'area' }, { k: 'pPart', l: 'الجهات أو الشركاء المساهمون', t: 'area', rows: 2 }, { k: 'pDead', l: 'آجال التنفيذ أو التتبع', t: 'area', rows: 2 }, { k: 'pFollow', l: 'ملاحظات حول التتبع', t: 'area', rows: 2 },
      { sec: '6- الخلاصات والتوصيات' }, { k: 'concl', t: 'area', rows: 4 },
      { sec: '7- انطباعات الحضور' }, { k: 'impr', t: 'radio', opts: SIG_IMPR }, { k: 'imprTxt', l: 'تعليل مختصر (اختياري)', t: 'area', rows: 2 },
      { sec: '8- بعض الصور' }, { k: 'photos', t: 'photos' },
      { sec: 'التوقيعات' }, { k: 'sigDir', l: 'اسم مدير المؤسسة', half: 1 }, { k: 'sigCoord', l: 'اسم منسق(ة) المؤسسة (عند الاقتضاء)', half: 1, list: 'ppEmps' }, { k: 'date', l: 'تاريخ الوثيقة (السجل)', t: 'date', half: 1 }],
    pv: f => [
      { sec: 'المحضر' }, { k: 'place', l: 'المكان (حرر ب)', half: 1 }, { k: 'date', l: 'التاريخ', t: 'date', half: 1 }, { k: 'title', l: 'العنوان' }, { k: 'sub', l: 'سطر ثان' },
      { k: 'time', l: 'الساعة', half: 1, ph: '17:00 مساء' }, { k: 'where', l: 'مكان اللقاء', half: 1, list: 'ppUnits' },
      { sec: 'جدول أعمال اللقاء' }, { k: 'agenda', t: 'agenda' }, { k: 'misc', l: 'مختلفات', t: 'area', rows: 3 },
      { sec: 'الحاضرون' }, { note: 'تملأ تلقائيا من «مكتب الجمعية» (خانة الجمعية والشركاء). النص الافتراضي لكل نقطة مقترح وقابل للتعديل الكامل.' },
      { k: 'attCol', l: 'العمود الثالث في جدول الحاضرين', t: 'select', half: 1, opts: [['role', 'الصفة'], ['ppr', 'رقم التأجير'], ['cin', 'رقم البطاقة الوطنية']] },
      { k: 'att', t: 'grid', cols: ['الاسم والنسب', f.attCol === 'ppr' ? 'رقم التأجير' : f.attCol === 'cin' ? 'رقم ب.ت.و' : 'الصفة', 'ملاحظات'] },
      { k: 'minRows', l: 'عدد الأسطر الأدنى في جدول الحاضرين', t: 'num', half: 1 },
      { sec: 'التوقيعات' }, { k: 'sigRap', l: 'المقرر', half: 1 }, { k: 'sigDir', l: 'مدير المؤسسة', half: 1 }, { k: 'sigPres', l: 'رئيس الجمعية', half: 1 }],
    invite: f => {
      // 1.9.4: a school group chooses the school unit(s) invited: the parents of its pupils, its teachers
      const grpU = !(window.Cyc && Cyc.single()), inU = p => !f.iunit || (window.K && K.U ? K.U.same(p.unit, f.iunit) : p.unit === f.iunit);
      const cls = window.Pupils ? Array.from(new Set(Pupils.current(MK.curSy()).filter(inU).map(p => p.cls).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'ar', { numeric: true })) : [];
      return [
        { sec: 'الدعوة' }, { k: 'to', l: 'المدعوون', t: 'select', opts: INV_TO },
        grpU && (f.to === 'parents' || f.to === 'staff') ? { k: 'iunit', l: 'الوحدة المدرسية', t: 'select', half: 1, opts: [['', 'كل الوحدات المدرسية']].concat(((window.K && K.unitList ? K.unitList().map(u => u.name) : []).concat(window.Pupils && Pupils.unitNames ? Pupils.unitNames() : [])).filter((u, i, a) => u && a.findIndex(x => (window.K && K.U ? K.U.same(x, u) : x === u)) === i).map(u => [u, u])) } : null,
        f.to === 'parents' ? { k: 'cls', l: 'دعوة اسمية لأولياء تلاميذ', t: 'select', half: 1, opts: [['', 'دعوة عامة (بدون أسماء)'], ['*', 'كل التلاميذ'], ...cls.map(c => [c, 'القسم: ' + c])] } : null,
        (f.to === 'parents' && !f.cls) ? { k: 'copies', l: 'عدد النسخ', t: 'num', half: 1 } : null,
        f.to === 'one' ? { k: 'one', l: 'إلى السيد(ة)', ph: 'مثال: السيد رئيس المجلس الجماعي' } : null,
        f.to === 'parents' && !cls.length ? { note: 'لاستعمال الدعوات الاسمية استورد لوائح التلاميذ في خانة «التلاميذ».' } : null,
        { k: 'evt', l: 'اللقاء / الاجتماع', ph: 'اللقاء التواصلي الأول مع أمهات وآباء وأولياء التلاميذ' },
        { k: 'mdate', l: 'تاريخ اللقاء', t: 'date', half: 1 }, { k: 'time', l: 'الساعة', half: 1, ph: 'العاشرة صباحا' }, { k: 'where', l: 'المكان', list: 'ppUnits' },
        { k: 'intro', l: 'نص الدعوة', t: 'area', rows: 3, hint: 'تعوض تلقائيا: {اللقاء} {اليوم} {التاريخ} {الساعة} {المكان} {السنة}' },
        { k: 'agenda', l: f.layout === 'official' ? 'يهدف هذا اللقاء إلى (سطر لكل هدف)' : 'جدول الأعمال (نقطة في كل سطر، اتركه فارغا لحذفه)', t: 'area', rows: 4 }, { k: 'outro', l: 'خاتمة', t: 'area', rows: 2 },
        f.to === 'parents' ? { k: 'guard', l: 'اسم الولي في الدعوة (من «معلومات الأولياء»)', t: 'select', half: 1, opts: [['1', 'نعم: اسم الولي / الأب / الأم'], ['', 'لا: ولي أمر التلميذ(ة) فقط']] } : null,
        f.to === 'parents' ? { k: 'indiv', l: 'موعد اللقاء الفردي مع الأستاذ(ة)', t: 'select', half: 1, opts: [['', 'بدون'], ['1', 'نعم']] } : null,
        f.to === 'parents' && f.indiv ? { k: 'indivDay', l: 'يوم اللقاء الفردي (اختياري)', half: 1, ph: 'يترك فارغا ليملأه الأستاذ(ة)' } : null,
        f.to === 'parents' && f.indiv ? { k: 'indivTime', l: 'ساعة اللقاء الفردي (اختياري)', half: 1 } : null,
        { sec: 'الشكل والتوقيع' }, { k: 'layout', l: 'النموذج', t: 'select', half: 1, opts: [['official', 'النموذج الرسمي: دعوتان في ورقة أفقية'], ['letter', 'رسالة (1 إلى 3 دعوات في الصفحة)']] },
        { k: 'from', l: 'الترويسة', t: 'select', half: 1, opts: [['school', 'ترويسة المؤسسة'], ['assoc', 'ترويسة الجمعية']] },
        f.layout === 'official' ? null : { k: 'perPage', l: 'عدد الدعوات في الصفحة', t: 'select', half: 1, opts: [['1', 'دعوة واحدة'], ['2', 'دعوتان'], ['3', 'ثلاث دعوات']] },
        { k: 'sigWho', l: 'الموقع', t: 'select', half: 1, opts: [['dir', 'مدير(ة) المؤسسة'], ['pres', 'رئيس الجمعية']] }, { k: 'sigName', l: 'اسم الموقع (اختياري)', half: 1 },
        { k: 'place', l: 'حرر ب', half: 1 }, { k: 'date', l: 'تاريخ الدعوة', t: 'date', half: 1 },
        f.to === 'parents' ? { k: 'tear', l: 'قسيمة إشعار بالتوصل (تقتطع وترجع)', t: 'select', half: 1, opts: [['', 'بدون'], ['1', 'نعم']] } : null
      ].filter(Boolean);
    },
    st2: () => [
      { sec: 'العنوان' }, { k: 't1', l: 'العنوان' }, { k: 't2', l: 'العنوان الفرعي', t: 'area', rows: 2 },
      { sec: '1- المعطيات العامة' }, { k: 'academy', l: 'الأكاديمية الجهوية للتربية والتكوين' }, { k: 'directorate', l: 'المديرية الإقليمية' }, { k: 'school', l: 'المؤسسة الابتدائية الرائدة' }, { k: 'dates', l: 'تاريخ/تواريخ اللقاء(ات)', t: 'area', rows: 2 },
      { k: 'parents', l: 'عدد أولياء الأمور المشاركين', ph: 'تلقائي: النساء + الرجال' }, { k: 'pW', l: 'النساء', t: 'num', half: 1 }, { k: 'pM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'actors', l: 'عدد الفاعلين التربويين (المدير، الأساتذة ...)', ph: 'تلقائي' }, { k: 'aW', l: 'النساء', t: 'num', half: 1 }, { k: 'aM', l: 'الرجال', t: 'num', half: 1 },
      { k: 'others', l: 'فاعلون آخرون (الجماعة الترابية، الجمعيات المحلية...)' }, { k: 'oW', l: 'النساء', t: 'num', half: 1 }, { k: 'oM', l: 'الرجال', t: 'num', half: 1 },
      { sec: '2- موضوع وأهداف اللقاءات' }, { k: 'intro', l: 'تقديم', t: 'area', rows: 2 }, { k: 'obj', l: 'الأهداف (سطر لكل هدف)', t: 'area', rows: 6 }, { k: 'targets', l: 'الفئات المستهدفة', t: 'checks', opts: ST2_TARGETS },
      { k: 'indivN', l: 'عدد اللقاءات الفردية المنجزة', t: 'num', half: 1 }, { k: 'indivFam', l: 'عدد الأسر التي استفادت من لقاء فردي', t: 'num', half: 1 }, { k: 'indivAbs', l: 'عدد الأسر التي لم تتمكن من حضور اللقاء الفردي', t: 'num', half: 1 },
      { k: 'indivActs', l: 'الإجراءات المبرمجة للتواصل معها', t: 'area', rows: 2 },
      { sec: '3- أهم محاور العروض أو النقاش' }, { k: 'ax1', l: 'أولا: نتائج فترة الدعم المكثف', t: 'area', rows: 5 }, { k: 'ax2', l: 'ثانيا: الصحة المدرسية', t: 'area', rows: 5 }, { k: 'axesOther', l: 'محاور أخرى تم تناولها', t: 'area', rows: 2 },
      { sec: '4- أهم الملاحظات والتفاعلات' }, { k: 'nFam', l: 'تفاعلات وملاحظات الأسر', t: 'area' }, { k: 'nQ', l: 'أهم الأسئلة المطروحة من طرف الأسر', t: 'area' }, { k: 'nStaff', l: 'تفاعلات وملاحظات الأطر التربوية والإدارية', t: 'area' },
      { k: 'nPart', l: 'تفاعلات وملاحظات فعاليات المجتمع المحلي والشركاء', t: 'area' }, { k: 'nCons', l: 'الإكراهات المسجلة، إن وجدت', t: 'area', rows: 2 },
      { sec: '5- الإجراءات المبرمجة بعد المحطة' }, { k: 'acts', l: 'الإجراءات (سطر لكل إجراء)', t: 'area', rows: 6 }, { k: 'pActs', l: 'أهم الإجراءات المتفق بشأنها', t: 'area' }, { k: 'pPart', l: 'الجهات أو الشركاء المساهمون', t: 'area', rows: 2 },
      { k: 'pDead', l: 'آجال التنفيذ أو التتبع', t: 'area', rows: 2 }, { k: 'pFollow', l: 'ملاحظات حول التتبع', t: 'area', rows: 2 },
      { sec: '6- الخلاصات والتوصيات' }, { k: 'conclL', l: 'المحاور (سطر لكل محور)', t: 'area', rows: 5 }, { k: 'concl', l: 'خلاصات وتوصيات أخرى', t: 'area', rows: 3 },
      { sec: '7- انطباعات الحضور حول اللقاء(ات)' }, { k: 'impr', t: 'radio', opts: SIG_IMPR }, { k: 'imprTxt', l: 'تعليل مختصر (اختياري)', t: 'area', rows: 2 },
      { sec: '8- بعض الصور' }, { k: 'photos', t: 'photos' },
      { sec: 'التوقيعات' }, { k: 'sigDir', l: 'اسم مدير المؤسسة', half: 1 }, { k: 'sigAssoc', l: 'اسم ممثل جمعية الآباء / ممثل المجتمع المحلي', half: 1 }, { k: 'sigRole', l: 'الصفة', half: 1 },
      { k: 'sigRap', l: 'اسم المقرر (عند الاقتضاء)', half: 1, list: 'ppEmps' }, { k: 'repDate', l: 'تاريخ تحرير التقرير', t: 'date', half: 1 }, { k: 'date', l: 'تاريخ الوثيقة (السجل)', t: 'date', half: 1 }],
    agm: () => [
      { sec: 'الإخبار' }, { k: 'assoc', l: 'اسم الجمعية' }, { k: 'commune', l: 'الجماعة', half: 1 }, { k: 'to', l: 'إلى السيد(ة) (اختياري)', half: 1, ph: 'مثال: السيد قائد قيادة ...' },
      { k: 'place', l: 'حرر ب', half: 1 }, { k: 'date', l: 'التاريخ', t: 'date', half: 1 },
      { k: 'kind', l: 'نوع الجمع العام', t: 'select', half: 1, opts: [['العادي', 'العادي'], ['العادي التجديدي', 'العادي التجديدي'], ['الاستثنائي', 'الاستثنائي'], ['التأسيسي', 'التأسيسي']] },
      { k: 'subject', l: 'الموضوع' }, { k: 'mdate', l: 'تاريخ الانعقاد', t: 'date', half: 1 }, { k: 'time', l: 'الساعة', half: 1 }, { k: 'where', l: 'المكان', list: 'ppUnits' },
      { k: 'body', l: 'النص', t: 'area', rows: 4, hint: 'تعوض تلقائيا: {الجمع} {الجمعية} {اليوم} {التاريخ} {الساعة} {المكان}' },
      { k: 'agenda', l: 'جدول الأعمال (اختياري، نقطة في كل سطر)', t: 'area', rows: 3 }, { k: 'sigName', l: 'رئيس الجمعية', half: 1 }, { k: 'copy', l: 'نسخة إلى (سطر لكل جهة، اختياري)', t: 'area', rows: 2 }],
    presence: () => [
      { sec: 'لائحة الحضور' }, { k: 'place', l: 'المكان', half: 1 }, { k: 'date', l: 'التاريخ', t: 'date', half: 1 }, { k: 'title', l: 'موضوع اللقاء', t: 'area', rows: 2 }, { k: 'unit', l: 'الوحدة المدرسية (اختياري)', list: 'ppUnits' },
      { k: 'col4', l: 'عنوان العمود الرابع', half: 1, list: 'ppC4' }, { k: 'rows', l: 'عدد الأسطر الفارغة', t: 'num', half: 1 },
      { k: 'fill', l: 'ملء اللائحة مسبقا', t: 'select', opts: [['', 'لائحة فارغة'], ['emps', 'موظفو المؤسسة'], ['assoc', 'أعضاء مكتب الجمعية'], ['others', 'الشركاء وفعاليات المجتمع المحلي']] },
      { note: 'تنقسم اللائحة تلقائيا على عدة صفحات مع تكرار رأس الجدول.' }]
  };

  /* ================================================================= */
  /* rendering */
  const dots = n => Array.from({ length: n || 2 }, () => '<div class="rp-dots"></div>').join('');
  const H = t => ({ html: `<div class="rp-h">${t}</div>`, keepNext: true });
  const SH = t => ({ html: `<div class="rp-sh">${t}</div>`, keepNext: true });
  const items = (t, n) => { const ls = lines(t); return ls.length ? ls.map(x => `<div class="rp-li">${esc(x)}</div>`) : [dots(n)]; };
  const paras = (t, n) => { const ls = lines(t); return ls.length ? ls.map(x => `<div class="rp-p">${esc(x)}</div>`) : [dots(n)]; };
  const longDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${+m[3]} ${Dx.MONTHS[+m[2] - 1]} ${m[1]}` : String(iso || ''); };
  const val = (x, w) => String(x == null ? '' : x).trim() ? `<b>${esc(x)}</b>` : `<span class="v empty" style="min-width:${w || 24}mm"></span>`;
  const sumOf = (a, b) => { const x = parseFloat(a), y = parseFloat(b); return isFinite(x) || isFinite(y) ? String((isFinite(x) ? x : 0) + (isFinite(y) ? y : 0)) : ''; };
  const cbs = (opts, v) => `<div class="rp-cbs">${opts.map((o, i) => `<span>${CB(v && v[i])} ${esc(o)}</span>`).join('')}</div>`;
  const radio = v => `<div class="rp-cbs">${SIG_IMPR.map((o, i) => `<span>${CB(+v === i)} ${o}</span>`).join('')}</div>`;
  const photos = p => { const a = []; for (let i = 0; i < (p || []).length; i += 2) a.push(`<div class="rp-photos">${p.slice(i, i + 2).map(x => `<img src="${x}">`).join('')}</div>`); return a; };
  const titleBox = f => `<div class="rp-t"><div class="t1">${esc(f.t1 || '')}</div>${f.t2 ? `<div class="t2">${esc(f.t2)}</div>` : ''}${f.t3 ? `<div class="t3">${esc(f.t3)}</div>` : ''}</div>`;
  const head = (s, f) => `<div class="mk-hdr">${Dx.header(s)}</div>${titleBox(f)}`;

  function renderMeeting(s, f) {
    const M = MEET[meetN(f)];
    const parents = String(f.parents || '').trim() || sumOf(f.women, f.men);
    const g = (k, v) => `<td class="k">${k}</td><td>${String(v == null ? '' : v).trim() ? esc(v) : ''}</td>`;
    const B = [H('1- المعطيات العامة'),
      `<table class="tbl rp-g"><tbody><tr>${g('المديرية الإقليمية:', f.directorate)}${g('المؤسسة:', f.school)}</tr><tr>${g('نوع المؤسسة:', f.kind)}${g('تاريخ / توقيت اللقاء:', f.when)}</tr>
        <tr>${g('مرجع المذكرة الداخلية:', f.memo)}${g('إجمالي أولياء الأمور المشاركين:', parents)}</tr><tr>${g('عدد الرجال:', f.men)}${g('عدد النساء:', f.women)}</tr><tr>${g('فاعلون من المجتمع المدني:', f.civil)}${g('أطر المؤسسة الحاضرون:', f.staff)}</tr></tbody></table>`,
      H('2- توزيع المهام على الوحدات المدرسية'),
      { table: { head: '<tr><th>الوحدة المدرسية</th><th>المكلف(ة) بالتنسيق</th><th>المكلف(ة) بالتوثيق</th><th>التاريخ والتوقيت</th><th>ملاحظات</th></tr>', rows: (f.dist || []).map(r => `<tr>${[0, 1, 2, 3, 4].map(j => `<td${j < 3 ? ' class="r"' : ''}>${esc(r[j] || '')}</td>`).join('')}</tr>`) } },
      H('3- أهداف اللقاء'), ...paras(f.obj, 2), SH('الفئات المستهدفة:'), cbs(meetTargets(), f.targets),
      H('4- محاور العروض والنقاش'), SH('أولاً: اللقاء الجماعي مع أولياء الأمور'),
      { table: { head: '<tr><th style="width:42%">محور اللقاء</th><th>ما تم عرضه / مخرجات النقاش</th></tr>', rows: (f.axes || []).map(r => `<tr><td class="r b">${esc(r[0] || '')}</td><td class="r">${esc(r[1] || '')}</td></tr>`) } },
      SH('ثانياً: اللقاءات الفردية مع الأسر'), `<div class="rp-kv"><span><span class="lb">عدد اللقاءات الفردية المنجزة:</span> ${val(f.indivN)}</span></div>`,
      `<div class="lb">أبرز المواضيع المطروحة خلال اللقاءات الفردية:</div>`, ...items(f.indiv, 2)];
    // station table
    const ST = M.stats, rows = (f.stats || []).map(r => { const c = r.slice(); if (ST.calc) c[ST.calcAt] = ST.calc(c); return c; });
    let trs = rows.map(r => `<tr>${ST.cols.map((_, j) => `<td class="${j ? '' : 'r b'}">${esc(r[j] || '')}</td>`).join('')}</tr>`);
    if (ST.total) {
      const t = ST.cols.map((_, j) => j === 0 ? 'المجموع الإجمالي' : ST.total.includes(j) ? (rows.some(r => isFinite(parseFloat(r[j]))) ? String(rows.reduce((a, r) => a + (parseFloat(r[j]) || 0), 0)) : '') : '');
      if (ST.totalCalc) t[ST.calcAt] = ST.totalCalc(t);
      trs = trs.concat([`<tr class="tot">${t.map((x, j) => `<td class="${j ? '' : 'r'}" style="font-weight:700;background:#f2f2f2">${esc(x)}</td>`).join('')}</tr>`]);
    }
    B.push({ before: `<div class="rp-sh">4-ب- ${ST.title}</div>`, table: { head: `<tr>${ST.cols.map(c => `<th>${c}</th>`).join('')}</tr>`, rows: trs } });
    B.push(H('5- الملاحظات والتفاعلات'), SH('تفاعل الأسر مع اللقاء:'), radio(f.inter), ...paras(f.interTxt, 1),
      SH('أهم الأسئلة المطروحة من طرف أولياء الأمور:'), ...items(f.questions, 2), SH('ملاحظات الأطر التربوية والإدارية:'), ...items(f.staffNotes, 2),
      SH('الإكراهات والعوائق المسجلة إن وجدت:'), ...items(f.constraints, 2),
      H('6- الأنشطة والالتزامات المتفق عليها'),
      { table: { head: '<tr><th style="width:8%">رقم</th><th>النشاط / الالتزام</th><th style="width:22%">آجال التنفيذ</th><th style="width:24%">الجهة المسؤولة</th></tr>', rows: (f.acts || []).map((r, i) => `<tr><td>${MK.pad2(i + 1)}</td><td class="r">${esc(r[0] || '')}</td><td>${esc(r[1] || '')}</td><td>${esc(r[2] || '')}</td></tr>`) } },
      H('7- الخلاصات والتوصيات'), ...items(f.concl, 3),
      H('8- الانطباع العام عن اللقاء'), radio(f.impr), SH('تعليل (اختياري):'), ...paras(f.imprTxt, 2));
    if ((f.photos || []).length) B.push(H('صور توثيقية'), ...photos(f.photos));
    B.push(H('9- التوقيعات والمصادقة'),
      `<div class="rp-sig" style="grid-template-columns:1fr 1fr 1fr"><div>اسم مدير(ة) المؤسسة<div class="nm">${esc(f.sigDir || '')}</div></div><div>ممثل الجمعية / المجتمع المحلي<div class="nm">${esc(f.sigAssoc || '')}</div></div><div>تاريخ التحرير والإمضاء<div class="nm">${esc(f.sigDate || '')}</div></div></div>
       <div class="rp-note">يرفق هذا التقرير بـ: لائحة الحاضرين · صور توثيقية · يُرسل إلى إدارة المؤسسة</div>`);
    return { head: head(s, f), blocks: B };
  }

  function renderSynth(s, f, ws) {
    const kv = (l, v, w) => `<span><span class="lb">${l}</span> ${val(v, w)}</span>`;
    const B = [H('1- المعطيات العامة')];
    if (ws) {
      B.push(`<div class="rp-kv">${kv('المكان:', f.wplace, 60)}</div>`, `<div class="rp-kv">${kv('تاريخ/تواريخ الورشات:', f.dates, 80)}</div>`,
        `<div class="rp-kv">${kv('عدد الأستاذات والأساتذة المشاركين:', String(f.teachers || '').trim() || sumOf(f.tW, f.tM))}${kv('عدد النساء:', f.tW, 12)}${kv('عدد الرجال:', f.tM, 12)}</div>`,
        `<div class="rp-kv">${kv('عدد الأطر الإدارية المشاركة:', String(f.admins || '').trim() || sumOf(f.adW, f.adM))}${kv('عدد النساء:', f.adW, 12)}${kv('عدد الرجال:', f.adM, 12)}</div>`,
        `<div class="rp-kv">${kv('فاعلون آخرون:', f.others, 80)}</div>`, `<div class="rp-kv">${kv('الأساتذة المؤطرون لأشغال الورشات:', f.trainers, 70)}</div>`);
    } else {
      B.push(`<div class="rp-kv">${kv('الأكاديمية الجهوية للتربية والتكوين:', f.academy, 90)}</div>`, `<div class="rp-kv">${kv('المديرية الإقليمية:', f.directorate, 90)}</div>`, `<div class="rp-kv">${kv(adapt('المؤسسة الابتدائية الرائدة:'), f.school, 90)}</div>`,
        `<div class="rp-kv">${kv('تاريخ/تواريخ اللقاء(ات):', f.dates, 90)}</div>`,
        `<div class="rp-kv">${kv('عدد أولياء الأمور المشاركين:', String(f.parents || '').trim() || sumOf(f.pW, f.pM))}${kv('عدد النساء:', f.pW, 12)}${kv('عدد الرجال:', f.pM, 12)}</div>`,
        `<div class="rp-kv">${kv('عدد الفاعلين التربويين (المدير، الأساتذة ...):', String(f.actors || '').trim() || sumOf(f.aW, f.aM))}${kv('عدد النساء:', f.aW, 12)}${kv('عدد الرجال:', f.aM, 12)}</div>`,
        `<div class="rp-kv">${kv('فاعلون آخرون (الجماعة الترابية، الجمعيات المحلية...):', f.others, 40)}${kv('عدد النساء:', f.oW, 12)}${kv('عدد الرجال:', f.oM, 12)}</div>`);
    }
    B.push(H(ws ? '2- موضوع وأهداف الورشات التذكيرية' : '2- موضوع وأهداف الأبواب المفتوحة'), SH(ws ? 'أهداف الورشات التذكيرية:' : 'أهداف الأبواب المفتوحة:'), ...paras(f.intro, 1), ...items(f.obj, 3),
      SH('الفئات المستهدفة'), `<div class="rp-p">${ws ? 'تم تنظيم الورشات التذكيرية لفائدة الفئات الآتية:' : 'تم تنظيم اللقاءات التواصلية لفائدة الفئات الآتية:'}</div>`, cbs(ws ? WS_TARGETS : OD_TARGETS, f.targets));
    if (ws) B.push(SH('برنامج الورشات التذكيرية والاستقبال حسب الأيام'), ...items(f.program, 3));
    else B.push(SH('تحيين معطيات الاتصال بالأسر'), `<div class="rp-kv">${kv('عدد أرقام هواتف أولياء الأمور التي تم التحقق منها:', f.phoneChecked, 16)}</div>`, `<div class="rp-kv">${kv('عدد الأرقام التي تم تحيينها أو تسجيلها:', f.phoneUpdated, 16)}</div>`, `<div class="rp-kv">${kv('عدد الحالات التي ما تزال تحتاج إلى استكمال:', f.phoneLeft, 16)}</div>`);
    B.push(H(ws ? '3- أهم محاور الورشات التذكيرية' : '3- أهم محاور العروض أو النقاش'), `<div class="rp-p">${ws ? 'تم خلال الورشات تناول المحاور الآتية:' : 'تم خلال اللقاء تناول المحاور الآتية:'}</div>`, ...items(f.axes, 3), SH('محاور أخرى تم تناولها:'), ...paras(f.axesOther, 2),
      H('4- أهم الملاحظات والتفاعلات'));
    const notes = ws ? [['تفاعلات وملاحظات الأستاذات والأساتذة:', f.nT], ['أهم الأسئلة أو الاستفسارات المطروحة:', f.nQ], ['تفاعلات وملاحظات الأطر الإدارية:', f.nAdm], ['الإكراهات المسجلة، إن وجدت:', f.nCons]]
      : [['تفاعلات وملاحظات الأسر:', f.nFam], ['أهم الأسئلة المطروحة من طرف الأسر:', f.nQ], ['تفاعلات وملاحظات الأطر التربوية والإدارية:', f.nStaff], ['تفاعلات وملاحظات فعاليات المجتمع المحلي والشركاء:', f.nPart], ['الإكراهات المسجلة، إن وجدت:', f.nCons]];
    notes.forEach(([l, t]) => B.push(SH(l), ...paras(t, 2)));
    B.push(H('5- الأنشطة المخطط لها'));
    [['أهم الإجراءات المتفق بشأنها:', f.pActs], ['الجهات أو الشركاء المساهمون:', f.pPart], ['آجال التنفيذ أو التتبع:', f.pDead], ['ملاحظات حول التتبع:', f.pFollow]].forEach(([l, t]) => B.push(SH(l), ...paras(t, 2)));
    B.push(H('6- الخلاصات والتوصيات'), ...paras(f.concl, 3), H(ws ? '7- انطباعات الحضور حول الورشات' : '7- انطباعات الحضور حول اللقاء(ات)'), radio(f.impr), SH('تعليل مختصر (اختياري):'), ...paras(f.imprTxt, 2));
    if ((f.photos || []).length) B.push(H(ws ? '8- بعض الصور عن الورشات التذكيرية' : '8- بعض الصور عن الأبواب المفتوحة'), ...photos(f.photos));
    B.push(`<div class="rp-sig" style="grid-template-columns:1fr 1fr"><div>اسم مدير المؤسسة:<div class="nm">${esc(f.sigDir || '')}</div></div><div>${ws ? 'اسم منسق(ة) المؤسسة (عند الاقتضاء):' : 'اسم ممثل جمعية أمهات وآباء وأولياء أمور التلاميذ / ممثل المجتمع المحلي:'}<div class="nm">${esc(ws ? f.sigCoord || '' : f.sigAssoc || '')}</div></div></div>`);
    return { head: head(s, f), blocks: B };
  }

  function renderPv(s, f) {
    const att = (f.att || []).filter(r => r.some(x => String(x || '').trim()));
    const minR = Math.max(0, +f.minRows || 0);
    while (att.length < minR) att.push(['', '', '']);
    const B = [`<div class="rp-kv"><span><span class="lb">الساعة:</span> ${val(f.time, 30)}</span><span style="margin-right:auto"><span class="lb">المكان:</span> ${val(f.where, 40)}</span></div>`,
      { html: '<div class="rp-sh" style="font-size:11pt">جدول أعمال اللقاء:</div>', keepNext: true }];
    (f.agenda || []).forEach((it, i) => {
      B.push({ html: `<div class="rp-ol"><span class="n">${i + 1}.</span><b>${esc(it.q || '')}${it.q && !/[:：]$/.test(it.q) ? ':' : ''}</b></div>`, keepNext: true });
      B.push(...(lines(it.a).length ? lines(it.a).map(x => `<div class="rp-p" style="padding-right:6mm">${esc(x)}</div>`) : [`<div style="padding-right:6mm">${dots(2)}</div>`]));
    });
    B.push(SH('مختلفات:'), ...paras(f.misc, 2),
      `<div class="c b" style="margin-top:3mm;font-size:11pt">توقيع محضر الاجتماع</div><div class="rp-sig3"><div>المقرر<div style="font-weight:400">${esc(f.sigRap || '')}</div></div><div>مدير المؤسسة<div style="font-weight:400">${esc(f.sigDir || '')}</div></div><div>رئيس الجمعية<div style="font-weight:400">${esc(f.sigPres || '')}</div></div></div>`,
      { before: '<div class="c b" style="font-size:11pt;margin:2mm 0 1mm">الحاضرون</div>', minRows: Math.min(att.length, 12), table: { head: `<tr><th style="width:7%">ر.ت</th><th style="width:30%">الاسم والنسب</th><th style="width:20%">${f.attCol === 'ppr' ? 'رقم التأجير' : f.attCol === 'cin' ? 'رقم ب.ت.و' : 'الصفة'}</th><th style="width:22%">التوقيع</th><th>ملاحظات</th></tr>`,
        rows: att.map((r, i) => `<tr style="height:9mm"><td>${i + 1}</td><td class="r">${esc(r[0] || '')}</td><td>${esc(r[1] || '')}</td><td></td><td>${esc(r[2] || '')}</td></tr>`) } });
    return { head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="rp-place">${esc(f.place || '')} في: ${f.date ? esc(longDate(f.date)) : '....................'}</div>
      <div class="rp-ttl">${esc(f.title || '')}</div><div class="rp-ttl2">${esc(f.sub || '')}</div>`, blocks: B };
  }

  function renderPresence(s, f) {
    let pre = [];
    if (f.fill === 'emps') pre = sortedEmps().map(e => [fullName(e), e.cadre || '', e.cin || '']);
    if (f.fill === 'assoc') pre = PD().members.map(m => [m.name, m.role || '', m.cin || m.phone || '']);
    if (f.fill === 'others') pre = PD().others.map(m => [m.name, m.role || '', m.phone || '']);
    const n = Math.max(pre.length, 0) + Math.max(0, +f.rows || 0);
    const rows = Array.from({ length: Math.max(n, 1) }, (_, i) => { const r = pre[i] || ['', '', '']; return `<tr style="height:9.2mm"><td>${i + 1}</td><td class="r">${esc(r[0])}</td><td>${esc(r[1])}</td><td dir="ltr">${esc(r[2])}</td><td></td></tr>`; });
    return { head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="rp-place">${esc(f.place || '')} بتاريخ: ${f.date ? esc(longDate(f.date)) : '....................'}</div>
        <div class="rp-ttl2" style="font-size:12pt;margin-top:1mm">${esc(f.title || '')}</div>${f.unit ? `<div class="c" style="margin-bottom:1mm">الوحدة المدرسية: <b>${esc(f.unit)}</b></div>` : ''}<div class="mk-title" style="margin-top:1mm">لائحة الحضور</div>`,
      blocks: [{ minRows: 4, table: { head: `<tr><th style="width:7%">ر.ت</th><th style="width:34%">الاسم الكامل</th><th style="width:22%">الصفة</th><th style="width:15%">${esc(f.col4 || 'رقم ب ت و')}</th><th>التوقيع</th></tr>`, rows } }] };
  }

  function renderSt2(s, f) {
    const kv = (l, v, w) => `<span><span class="lb">${l}</span> ${val(v, w)}</span>`;
    const B = [H('1- المعطيات العامة'),
      `<div class="rp-kv">${kv('الأكاديمية الجهوية للتربية والتكوين:', f.academy, 90)}</div>`, `<div class="rp-kv">${kv('المديرية الإقليمية:', f.directorate, 90)}</div>`, `<div class="rp-kv">${kv('المؤسسة الابتدائية الرائدة:', f.school, 90)}</div>`,
      `<div class="rp-kv">${kv('تاريخ/تواريخ اللقاء(ات):', f.dates, 90)}</div>`,
      `<div class="rp-kv">${kv('عدد أولياء الأمور المشاركين:', String(f.parents || '').trim() || sumOf(f.pW, f.pM))}${kv('عدد النساء:', f.pW, 12)}${kv('عدد الرجال:', f.pM, 12)}</div>`,
      `<div class="rp-kv">${kv('عدد الفاعلين التربويين (المدير، الأساتذة ...):', String(f.actors || '').trim() || sumOf(f.aW, f.aM))}${kv('عدد النساء:', f.aW, 12)}${kv('عدد الرجال:', f.aM, 12)}</div>`,
      `<div class="rp-kv">${kv('فاعلون آخرون (الجماعة الترابية، الجمعيات المحلية...):', f.others, 40)}${kv('عدد النساء:', f.oW, 12)}${kv('عدد الرجال:', f.oM, 12)}</div>`,
      H('2- موضوع وأهداف اللقاءات'), ...paras(f.intro, 1), ...items(f.obj, 3),
      SH('الفئات المستهدفة'), '<div class="rp-p">تم تنظيم اللقاءات التواصلية لفائدة الفئات الآتية:</div>', cbs(ST2_TARGETS, f.targets),
      SH('تنظيم اللقاءات الفردية مع الأسر'), `<div class="rp-kv">${kv('عدد اللقاءات الفردية المنجزة:', f.indivN, 16)}</div>`, `<div class="rp-kv">${kv('عدد الأسر التي استفادت من لقاء فردي:', f.indivFam, 16)}</div>`,
      `<div class="rp-kv">${kv('عدد الأسر التي لم تتمكن من حضور اللقاء الفردي:', f.indivAbs, 16)}</div>`, '<div class="lb">الإجراءات المبرمجة للتواصل معها:</div>', ...paras(f.indivActs, 2),
      H('3- أهم محاور العروض أو النقاش'), '<div class="rp-p">تم خلال المحطة تناول المحاور الآتية:</div>', SH('أولا: نتائج فترة الدعم المكثف'), ...items(f.ax1, 3), SH('ثانيا: الصحة المدرسية'), ...items(f.ax2, 3),
      SH('محاور أخرى تم تناولها:'), ...paras(f.axesOther, 2), H('4- أهم الملاحظات والتفاعلات')];
    [['تفاعلات وملاحظات الأسر:', f.nFam], ['أهم الأسئلة المطروحة من طرف الأسر:', f.nQ], ['تفاعلات وملاحظات الأطر التربوية والإدارية:', f.nStaff], ['تفاعلات وملاحظات فعاليات المجتمع المحلي والشركاء:', f.nPart], ['الإكراهات المسجلة، إن وجدت:', f.nCons]].forEach(([l, t]) => B.push(SH(l), ...paras(t, 2)));
    B.push(H('5- الإجراءات المبرمجة بعد المحطة'), '<div class="rp-p">أهم الإجراءات المتفق بشأنها:</div>', ...items(f.acts, 3));
    [['أهم الإجراءات المتفق بشأنها:', f.pActs], ['الجهات أو الشركاء المساهمون:', f.pPart], ['آجال التنفيذ أو التتبع:', f.pDead], ['ملاحظات حول التتبع:', f.pFollow]].forEach(([l, t]) => { if (lines(t).length) B.push(SH(l), ...paras(t, 1)); });
    B.push(H('6- الخلاصات والتوصيات'), '<div class="rp-p">أهم الخلاصات والتوصيات الناتجة عن المحطة التواصلية، خاصة ما يتعلق بـ:</div>', ...items(f.conclL, 3), ...(lines(f.concl).length ? paras(f.concl, 1) : []),
      H('7- انطباعات الحضور حول اللقاء(ات)'), radio(f.impr), SH('تعليل مختصر (اختياري):'), ...paras(f.imprTxt, 2));
    if ((f.photos || []).length) B.push(H('8- بعض الصور'), ...photos(f.photos));
    B.push(`<div class="rp-sig" style="grid-template-columns:1fr 1fr"><div>اسم مدير المؤسسة:<div class="nm">${esc(f.sigDir || '')}</div><div style="margin-top:8mm">التاريخ والتوقيع:</div></div>
      <div>اسم ممثل جمعية أمهات وآباء وأولياء أمور التلاميذ / ممثل المجتمع المحلي:<div class="nm">${esc(f.sigAssoc || '')}</div><div class="nm">الصفة: ${esc(f.sigRole || '')}</div><div style="margin-top:4mm">التاريخ والتوقيع:</div></div></div>
      <div class="rp-kv" style="margin-top:3mm">${kv('اسم المقرر (عند الاقتضاء):', f.sigRap, 50)}${kv('تاريخ تحرير التقرير:', f.repDate ? longDate(f.repDate) : '', 30)}${kv('الإمضاء:', '', 30)}</div>`);
    return { head: `<div class="mk-hdr">${Dx.header(s)}</div>${titleBox(f)}`, blocks: B };
  }
  // the guardian of a pupil (Massar «Tuteur» information imported in the pupils' file)
  function guardianOf(p) {
    const g = p.guard || {}, nmOf = o => (o ? [o.first, o.last].filter(Boolean).join(' ') : '');
    const pick = g.type === 'أم' ? [['mother', 'السيدة'], ['tutor', 'السيد(ة)'], ['father', 'السيد']] : g.type === 'أب' ? [['father', 'السيد'], ['tutor', 'السيد(ة)'], ['mother', 'السيدة']] : [['tutor', 'السيد(ة)'], ['father', 'السيد'], ['mother', 'السيدة']];
    for (const [k, t] of pick) { const n = nmOf(g[k]); if (n) return { name: n, title: t, phone: (g[k] && g[k].phone) || '' }; }
    return null;
  }

  /* ---------- 1.9.4: invitations (several per sheet) ---------- */
  const DAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayOf = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? DAYS[new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()] : ''; };
  const fillTok = (t, map) => String(t || '').replace(/\{([^{}]+)\}/g, (m, k) => (map[k] != null ? map[k] : m));
  const DOTS = '..............';
  const compactHdr = s => `<div class="iv-hdr"><div>المملكة المغربية</div><div>${esc(s.academy || '')}</div><div>${esc(s.directorate || '')}</div><div><b>${esc(s.school || '')}</b></div></div>`;
  const assocHdr = (name, commune) => `<div class="iv-hdr iv-as"><div><b>${esc(name || '')}</b></div>${commune ? `<div>جماعة ${esc(String(commune).replace(/^جماعة\s+/, ''))}</div>` : ''}</div>`;
  /* o = { hdr, place, date, to: [addressee lines…] (one invitation each), subject, body: [paragraph html…], agenda: [..], outro, sigTitle, sigName, perPage, tear, tearTxt } */
  function invitePages(o) {
    const n = Math.max(1, Math.min(3, +o.perPage || 1));
    const H = { 1: 270, 2: 133, 3: 87.5 }[n];
    const one = to => `<div class="iv iv${n}" style="height:${H}mm"><div class="iv-top">${o.hdr}
      <div class="iv-pl">${esc(o.place || '')} في: ${o.date ? esc(longDate(o.date)) : '....................'}</div></div>
      ${to ? `<div class="iv-to">إلى ${to}</div>` : ''}
      <div class="iv-sub"><u>الموضوع</u>: ${esc(o.subject || '')}</div>
      <div class="iv-sal">سلام تام بوجود مولانا الإمام المؤيد بالله،</div>
      ${(o.body || []).map(p => `<div class="iv-p">${p}</div>`).join('')}
      ${(o.agenda || []).length ? `<ol class="iv-ag">${o.agenda.map(a => `<li>${esc(a)}</li>`).join('')}</ol>` : ''}
      ${o.outro ? `<div class="iv-p">${esc(o.outro)}</div>` : ''}<div class="iv-end"><div class="iv-p">وتقبلوا فائق التقدير والاحترام.</div>
      <div class="iv-sig">${/مدير|رئيس(?:\(ة\))? المؤسسة/.test(o.sigTitle || '') ? `<span data-stm>${esc(o.sigTitle)}</span>` : esc(o.sigTitle || '')}${o.sigName ? `<div>${esc(o.sigName)}</div>` : ''}</div></div>
      ${o.tear ? `<div class="iv-tear"><span>✂</span>${o.tearTxt || ''}</div>` : ''}${o.copy && o.copy.length ? `<div class="iv-cp"><u>نسخة إلى</u>: ${o.copy.map(esc).join('، ')}</div>` : ''}</div>`;
    const list = (o.to && o.to.length ? o.to : ['']);
    const pages = [];
    for (let i = 0; i < list.length; i += n) pages.push(`<!--cls:rp iv-pg-->${list.slice(i, i + n).map(one).join('<div class="iv-cut"></div>')}`);
    return pages;
  }
  window.Partners.invitePages = invitePages;
  Dx.modCss += `
  .iv-pg{display:block}.iv{position:relative;overflow:hidden;display:flex;flex-direction:column;font-size:11.5pt;line-height:1.55;box-sizing:border-box;padding:0 2mm}
  .iv2{font-size:10.8pt;line-height:1.45}.iv3{font-size:9.8pt;line-height:1.32}
  .iv-top{display:flex;justify-content:space-between;align-items:flex-start;gap:4mm;margin:0 0 1.2mm}
  .iv-hdr{text-align:center;font-size:.84em;line-height:1.25;max-width:62%}.iv-hdr b{font-size:1.08em}
  .iv-pl{text-align:left;font-weight:700;align-self:flex-end;white-space:nowrap}.iv-to{text-align:center;margin:0 0 1mm;font-size:1.04em}
  .iv-sub{text-align:center;font-weight:700;margin:0 0 1mm}.iv-sal{text-align:center;margin:0 0 .6mm}
  .iv-p{text-align:justify;text-indent:6mm;margin:0 0 .6mm}.iv-ag{margin:0 0 .6mm;padding:0 12mm 0 0}.iv-ag li{margin:0}
  .iv-end{display:flex;justify-content:space-between;align-items:flex-start;gap:6mm}.iv-end .iv-p{flex:1}
  .iv-sig{text-align:center;font-weight:700;margin:0 8mm 0 4mm;min-width:45mm}.iv-sig div{font-weight:400}
  .iv-tear{margin-top:auto;border-top:1.2px dashed #333;padding-top:1.2mm;font-size:.84em;position:relative}.iv-tear span{position:absolute;top:-3.1mm;right:2mm;background:#fff;font-size:11pt}
  .iv-cp{margin-top:auto;font-size:.88em}
  .iv-cut{height:0;border-top:1.2px dashed #777;margin:2mm 0}
  .ivo-row{display:grid;grid-template-columns:1fr 1fr;gap:6mm;height:188mm}
  .ivo{border:1.3px dashed #555;padding:2.5mm 4.5mm;font-size:9.3pt;line-height:1.36;overflow:hidden;display:flex;flex-direction:column}.ivo-empty{border-color:transparent}
  .ivo-hdr{text-align:center;font-size:7.6pt;line-height:1.2;margin:0 auto 1mm}.ivo-hdr img{height:9mm;display:block;margin:.5mm auto}
  .ivo-t{text-align:center;color:#1f5fa8;font-weight:700;font-size:10pt;margin:.5mm 0}.ivo-sub{font-weight:700;margin:.5mm 0 1.2mm;font-size:9.6pt}
  .ivo-to{margin:0 0 1mm}.ivo-p{text-align:justify;margin:0 0 .5mm}.ivo-ag{margin:0 0 1mm;padding-right:5mm}.ivo-ag li{margin:0}
  .ivo-kv{margin:.2mm 0}.ivo-sig{margin-top:auto;padding-top:2mm;text-align:center;line-height:1.7}
  .iv1 .iv-top{margin-bottom:8mm}.iv1 .iv-hdr{font-size:.95em}.iv1 .iv-to{margin:2mm 0 4mm}.iv1 .iv-sub{margin:2mm 0 4mm;font-size:1.06em}.iv1 .iv-sal{margin-bottom:3mm}.iv1 .iv-p{margin-bottom:2mm}
  .iv1 .iv-end{flex-direction:column}.iv1 .iv-sig{align-self:flex-end;margin-top:8mm}`;
  window.Partners.compactHdr = compactHdr;
  function renderInvite(s, f) {
    const map = { 'السنة': String(MK.curSy()).replace('-', '/'), 'اللقاء': `<b>${esc(f.evt || DOTS)}</b>`, 'اليوم': f.mdate ? esc(dayOf(f.mdate)) : DOTS, 'التاريخ': `<b>${f.mdate ? esc(longDate(f.mdate)) : DOTS}</b>`, 'الساعة': `<b>${esc(f.time || DOTS)}</b>`, 'المكان': `<b>${esc(f.where || DOTS)}</b>` };
    let to = [];
    const sir = 'السيد(ة)';
    if (f.to === 'parents') {
      if (!f.cls) to = Array.from({ length: Math.max(1, Math.min(300, +f.copies || 1)) }, () => `${sir} ولي(ة) أمر التلميذ(ة): ${'.'.repeat(40)} القسم: ${'.'.repeat(12)}`);
      else {
        const L = (window.Pupils ? Pupils.current(MK.curSy()) : []).filter(p => (f.cls === '*' || p.cls === f.cls) && (!f.iunit || (window.K && K.U ? K.U.same(p.unit, f.iunit) : p.unit === f.iunit))).sort((a, b) => String(a.cls || '').localeCompare(String(b.cls || ''), 'ar', { numeric: true }) || `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`, 'ar'));
        to = L.map(p => { const gd = f.guard ? guardianOf(p) : null; const pup = `${p.g === 'F' ? 'التلميذة' : 'التلميذ'}: <b>${esc(`${p.last || ''} ${p.first || ''}`.trim())}</b>${p.cls ? ` — القسم: <b>${esc(p.cls)}</b>` : ''}${p.unit && units().length > 1 ? ` — ${esc(p.unit)}` : ''}`;
          return gd ? `${gd.title}: <b>${esc(gd.name)}</b>، ولي(ة) أمر ${pup}` : `${sir} ولي(ة) أمر ${pup}`; });
        if (!to.length) to = [`${sir} ولي(ة) أمر التلميذ(ة): ${'.'.repeat(40)}`];
      }
    } else if (f.to === 'assoc') to = PD().members.filter(m => m.name).map(m => `${sir}: <b>${esc(m.name)}</b>${m.role ? ` — ${esc(m.role)}` : ''}`);
    else if (f.to === 'others') to = PD().others.filter(m => m.name).map(m => `${sir}: <b>${esc(m.name)}</b>${m.role ? ` — ${esc(m.role)}` : ''}`);
    else if (f.to === 'staff') to = sortedEmps().filter(e => (!(window.K && K.E && K.E.cat) || ['admin', 'teacher', 'assigned'].includes(K.E.cat(e))) && (!f.iunit || !e.unit || (window.K && K.U ? K.U.same(e.unit, f.iunit) : e.unit === f.iunit))).map(e => `${/^(F|f|أنثى|انثى)$/.test(String(e.sex || '')) || (!e.sex && (/ة\s*$/.test(String(e.firstAr || '').trim()) || /أستاذة|مديرة|متصرفة|ملحقة/.test(String(e.cadre || '')))) ? 'السيدة' : 'السيد'}: <b>${esc(fullName(e))}</b>${e.cadre ? ` — ${esc(e.cadre)}` : ''}`);
    else to = [f.one ? `<b>${esc(f.one)}</b>` : `${sir}: ${'.'.repeat(50)}`];
    if (!to.length) to = [`${sir}: ${'.'.repeat(50)}`];
    const hdr = f.from === 'assoc' ? assocHdr(assocFull(s), s.commune) : compactHdr(s);
    if (f.layout === 'official') return officialInvite(s, f, to, map, hdr);
    const pupilLbl = f.cls ? '' : '';
    const ag = lines(f.agenda);
    let intro = fillTok(esc(f.intro || ''), map);
    if (!ag.length) intro = intro.replace(/،?\s*وذلك لتدارس النقاط التالية\s*:?\s*$/, '.');
    return { page: 'a4', cls: 'rp', pages: invitePages({ hdr, place: f.place, date: f.date, to, subject: `دعوة لحضور ${f.evt || ''}`, body: [intro],
      agenda: ag, outro: f.outro, sigTitle: f.sigWho === 'pres' ? 'رئيس الجمعية' : 'مدير(ة) المؤسسة', sigName: f.sigName, perPage: f.perPage,
      tear: f.to === 'parents' && !!f.tear, tearTxt: `إشعار بالتوصل — أنا الموقع(ة) أسفله ولي(ة) أمر التلميذ(ة): ${'.'.repeat(36)}${pupilLbl} أشهد أنني توصلت بالدعوة لحضور ${esc(f.evt || '')}. التوقيع: ${'.'.repeat(20)}` }) };
  }
  // the official invitation model: two A5 invitations side by side on a landscape sheet
  function officialInvite(s, f, to, map, hdr) {
    const ag = lines(f.agenda);
    const emb = f.from === 'assoc' ? hdr : `<div class="ivo-hdr"><div>المملكة المغربية</div><img src="assets/emblem.png"><div>${esc(String(s.ministry || 'وزارة التربية الوطنية والتعليم الأولي والرياضة'))}</div><div>${esc(s.academy || '')}</div><div>${esc(s.directorate || '')}</div><div><b>${esc(s.school || '')}</b></div></div>`;
    const one = t => `<div class="ivo">${emb}
      <div class="ivo-t">دعوة لحضور ${esc(f.evt || '')}</div>
      <div class="ivo-sub">الموضوع: دعوة لحضور ${esc(f.evt || '')} برسم السنة الدراسية ${esc(String(MK.curSy()).replace('-', '/'))}</div>
      ${t ? `<div class="ivo-to">إلى ${t}</div>` : ''}
      <div class="ivo-p">السلام عليكم ورحمة الله وبركاته،</div>
      <div class="ivo-p">${fillTok(esc(f.intro || ''), map)}</div>
      ${ag.length ? `<div class="ivo-p" style="margin-top:1.5mm">ويهدف هذا اللقاء إلى:</div><ul class="ivo-ag">${ag.map(a => `<li>${esc(a)}${/[؛.]$/.test(a) ? '' : '؛'}</li>`).join('')}</ul>` : ''}
      <div class="ivo-kv"><b>تاريخ اللقاء:</b> ${f.mdate ? `${esc(dayOf(f.mdate))} ${esc(longDate(f.mdate))}` : DOTS + DOTS}</div>
      <div class="ivo-kv"><b>الساعة:</b> ${esc(f.time || DOTS + DOTS)}</div>
      <div class="ivo-kv"><b>المكان:</b> ${esc(f.where || DOTS + DOTS)}</div>
      ${f.indiv ? `<div class="ivo-kv" style="margin-top:2mm"><b>موعد اللقاء الفردي مع الأستاذ(ة):</b></div><div class="ivo-kv">اليوم: ${esc(f.indivDay || DOTS + '....')} &nbsp; الساعة: ${esc(f.indivTime || DOTS)}</div>` : ''}
      ${f.outro ? `<div class="ivo-p" style="margin-top:2mm">${esc(f.outro)}</div>` : ''}
      <div class="ivo-sig"><div>الإمضاء: ${f.sigName ? esc(f.sigName) : DOTS + DOTS}</div>${f.sigWho === 'pres' ? '<div>رئيس الجمعية</div>' : '<div data-stm>مدير(ة) المؤسسة (خاتم المؤسسة)</div>'}</div></div>`;
    const list = to.length ? to : [''];
    const pages = [];
    for (let i = 0; i < list.length; i += 2) pages.push(`<!--cls:rp ivo-pg--><div class="ivo-row">${one(list[i])}${list[i + 1] != null ? one(list[i + 1]) : '<div class="ivo ivo-empty"></div>'}</div>`);
    return { page: 'a4l', cls: 'rp', pages };
  }
  function renderAgm(s, f) {
    const map = { 'الجمع': `<b>الجمع العام ${esc(f.kind || '')}</b>`, 'الجمعية': esc(f.assoc || ''), 'اليوم': f.mdate ? esc(dayOf(f.mdate)) : DOTS, 'التاريخ': `<b>${f.mdate ? esc(longDate(f.mdate)) : DOTS}</b>`, 'الساعة': `<b>${esc(f.time || DOTS)}</b>`, 'المكان': `<b>${esc(f.where || DOTS)}</b>` };
    const ag = lines(f.agenda);
    return { page: 'a4', cls: 'rp', pages: invitePages({ hdr: assocHdr(f.assoc, f.commune), place: f.place, date: f.date, to: f.to ? [`<b>${esc(f.to)}</b>`] : [''], subject: f.subject,
      body: [fillTok(esc(f.body || ''), map)].concat(ag.length ? ['وذلك وفق جدول الأعمال التالي:'] : []), agenda: ag, outro: '', sigTitle: 'توقيع رئيس الجمعية', sigName: f.sigName, perPage: 1, copy: lines(f.copy) }) };
  }

  const RENDER = { st2: renderSt2, invite: renderInvite, agm: renderAgm, meeting: renderMeeting, opendoors: (s, f) => renderSynth(s, f, false), workshops: (s, f) => renderSynth(s, f, true), pv: renderPv, presence: renderPresence };

  window.pagePartnerDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    let rec = arg.id ? PD().reports.find(r => r.id === arg.id) : null;
    if (arg.id && !rec) return go('partners');
    const type = rec ? rec.type : arg.type || 'meeting';
    const st0 = rec ? { id: rec.id, type, station: rec.station, sy: rec.sy, f: JSON.parse(JSON.stringify(rec.f)) }
      : { id: '', type, station: arg.station || '', sy: arg.sy || sy || MK.curSy(), f: defaults(type, arg.station || '', arg.sy || sy || MK.curSy()) };
    const save = st => {
      const now = new Date().toISOString();
      if (st.id) { const r = PD().reports.find(x => x.id === st.id); if (r) Object.assign(r, { f: JSON.parse(JSON.stringify(st.f)), date: st.f.date || r.date, updated: now }); }
      else {
        const r = { id: uid('pr'), type: st.type, station: st.station, sy: st.sy, date: st.f.date || today(), f: JSON.parse(JSON.stringify(st.f)), created: now, updated: now };
        PD().reports.push(r); st.id = r.id;
      }
      persist();
    };
    const T = TYPES[type];
    let ctl = null;
    const leave = async () => {
      const st = ctl.st;
      if (st.id) save(st);
      else if (await confirmBox('حفظ الوثيقة في «التقارير والمحاضر» قبل الخروج؟', 'حفظ', false)) save(st);
      go('partners', { tab: rec ? 'reports' : 'prog' });
    };
    ctl = MK.docPage(v, {
      title: T.label, icon: T.icon, modes: false, flow: true, state: st0, word: true, saveLabel: 'حفظ',
      back: () => leave(),
      form: (box, st, refresh) => {
        const stn = stByK(st.station);
        box.onSelect = () => draw && draw();
        const draw = buildForm(box, () => FORMS[type](st.f), st.f, refresh, () => `<div class="emp-chip" style="margin-bottom:10px">${ic('users', 'style="width:22px;height:22px;color:var(--pri)"')}<div><b>${esc(T.label)}</b><br>${stn ? `${esc(stn.m)} — ${esc(stn.act)} — ` : ''}الموسم الدراسي ${esc(syDash(st.sy))}${st.id ? '' : ' — <span style="color:var(--gold)">غير محفوظ بعد</span>'}</div></div>`);
      },
      build: st => { const r = RENDER[type](S(), st.f); if (r.pages) return r; return { page: 'a4', cls: 'rp', pages: MK.flowPages({ page: 'a4', cls: 'rp', head: r.head, blocks: r.blocks }) }; },
      beforeOutput: async st => { save(st); return true; },
      onSave: async st => { save(st); toast('تم الحفظ في «التقارير والمحاضر»'); },
      fname: st => type === 'invite' ? `دعوات_${st.f.evt || ''}` : type === 'presence' ? `لائحة_الحضور_${st.f.date || ''}` : (st.f.t1 || st.f.title || T.label)
    });
  };
})();
