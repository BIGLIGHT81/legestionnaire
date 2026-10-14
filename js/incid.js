'use strict';
/* 1.9.4 — الحوادث المدرسية (شؤون التلاميذ) وحوادث المصلحة (الموظفون)، وفق المذكرة الوزارية 071X19 (04 يوليوز 2019)
   في شأن تدبير ملفات الحوادث المدرسية وحوادث الشغل والمصلحة.
   - سجل لكل نوع (DB.incid.school / DB.incid.service) تُملأ منه كل الوثائق.
   - الحوادث المدرسية: إشعار فوري، التصريح بالحادثة، تقرير المدير، إشعار ولي الأمر، ورقة الاتصال بالإسعاف، الوصل، ورقة إرسال الملف، بيان الحوادث.
   - حوادث المصلحة: تقرير عن حادثة مصلحة (نموذج المؤسسة)، التصريح، ورقة الاتصال بالإسعاف، الوصل، ورقة إرسال الملف، طلب استرجاع المصاريف الطبية، البيان السنوي. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');

  function migrate(db) {
    const o = db.incid = db.incid && typeof db.incid === 'object' ? db.incid : {};
    o.school = Array.isArray(o.school) ? o.school : [];
    o.service = Array.isArray(o.service) ? o.service : [];
    o.years = o.years && typeof o.years === 'object' ? o.years : {};
    o.svYears = o.svYears && typeof o.svYears === 'object' ? o.svYears : {};
    o.school.forEach(a => { a.id = a.id || uid('is'); }); o.service.forEach(a => { a.id = a.id || uid('iv'); });
  }
  const IN = () => { migrate(DB); return DB.incid; };
  const store = (k, sy) => { const y = IN()[k]; return y[sy] || (y[sy] = {}); };

  /* ---------- shared helpers ---------- */
  const dots = (v, n) => (nm(v) ? `<b>${esc(v)}</b>` : `<span class="sb-dots" style="min-width:${n || 30}mm"></span>`);
  const P = (h, st) => ({ html: `<p class="sb-p"${st ? ` style="${st}"` : ''}>${h}</p>` });
  const kvT = pairs => ({ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:22%"><col style="width:28%"><col style="width:22%"><col style="width:28%"></colgroup>',
    rows: (() => { const r = []; for (let i = 0; i < pairs.length; i += 2) { const a = pairs[i], b = pairs[i + 1] || ['', '']; r.push(tr([{ t: a[0], c: 'k' }, { h: a[1] == null ? '' : String(a[1]) }, { t: b[0], c: b[0] ? 'k' : '' }, { h: b[1] == null ? '' : String(b[1]) }])); } return r; })() } });
  const kv1 = pairs => ({ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:30%"><col style="width:70%"></colgroup>', rows: pairs.map(a => tr([{ t: a[0], c: 'k' }, { h: a[1] }])) } });
  const box = (t, inner) => ({ html: `<div class="sb-box" style="margin:1.5mm 0"><h4>${t}</h4>${inner}</div>` });
  const chk = on => `<span class="sb-chk">${on ? 'X' : ''}</span>`;
  const time = t => nm(t) ? `<bdi dir="ltr">${esc(t)}</bdi>` : '....:....';
  const dateL = d => (d ? esc(ldate(d)) : '..........');
  const asDoc = (s, o) => ({ page: o.page || 'a4', pages: SB.pages(s, o) });
  const hdrOnly = s => `<div class="mk-hdr">${Dx.header(s)}</div>`;
  // a letter (no title band): header, then blocks
  const letter = (s, blocks) => ({ page: 'a4', pages: MK.flowPages({ page: 'a4', cls: 'sb', head: hdrOnly(s), blocks }) });
  const withL = t => { t = nm(t); if (!t) return ''; return t.startsWith('ال') ? 'لل' + t.slice(2) : 'ل' + t; };
  const recipient = (s, lines) => ({ html: `<div class="addr-l b" style="width:66%;margin:2mm auto;text-align:center;line-height:1.65;font-weight:700">${lines.filter(Boolean).map(x => `<div>${x}</div>`).join('')}</div>` });
  const subj = t => ({ html: `<p class="sb-p" style="font-weight:700;margin-top:2mm">الموضوع: ${t}</p>` });
  const salut = { html: '<p class="sb-p" style="text-align:center;font-weight:700">سلام تام بوجود مولانا الإمام دام له النصر والتأييد</p>' };
  const topLine = (s, f, ref) => ({ html: `<div style="display:flex;justify-content:space-between;font-weight:700;margin:1mm 0 2mm"><span>${ref || ''}</span><span>${esc(f.city || s.city || '')} في: ${dateL(f.date)}</span></div>` });
  const AMB = [['15', 'الوقاية المدنية (سيارة الإسعاف)'], ['141', 'الإسعاف الطبي المستعجل SAMU'], ['19', 'الشرطة'], ['177', 'الدرك الملكي']];
  const PLACES = ['داخل المؤسسة (الفصل)', 'داخل المؤسسة (الساحة)', 'داخل المؤسسة (المرافق)', 'خط التنقل بين المؤسسة ومقر السكن', 'أثناء خرجة أو رحلة', 'أثناء نشاط رياضي أو تربوي منظم', 'أخرى'];

  /* =================== school accidents (pupils) =================== */
  const SA = () => IN().school.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const saById = id => IN().school.find(x => x.id === id) || null;
  const saLabel = a => `${a.pupil || '؟'} — ${a.date ? ldate(a.date) : ''}${a.place ? ' — ' + a.place : ''}`;
  const saField = { k: 'evt', l: 'الحادثة (من سجل الحوادث المدرسية)', t: 'select', opts: () => [['', '— اختر حادثة مسجلة —']].concat(SA().map(a => [a.id, saLabel(a)])) };
  const pupilOf = name => { const r = K.PP.resolve('pupil', name); return r ? r.rec : {}; };
  // the accident: the register entry + what is typed in the document (typed wins)
  const SAF = ['pupil', 'date', 'time', 'place', 'activity', 'desc', 'injury', 'aid', 'amb', 'ambTime', 'hosp', 'escort', 'parent', 'parentPhone', 'witness', 'ins', 'teacher', 'notes'];
  const acc = f => { const a = saById(f.evt) || {}; const o = {}; SAF.forEach(k => { o[k] = nm(f[k]) || nm(a[k]); }); const p = pupilOf(o.pupil); o.code = nm(a.code) || p.code || ''; o.cls = nm(a.cls) || p.cls || ''; o.unit = p.unit || ''; o.birth = nm(a.birth) || p.birth || ''; o.g = nm(a.g) || (p.gender === 'F' || p.gender === 'أنثى' ? 'F' : p.gender ? 'M' : ''); o.lvl = p.lvlSh || ''; return o; };
  const isF = o => o.g === 'F' || /أنثى|F/.test(o.g || '');
  const pupilWord = o => (isF(o) ? 'التلميذة' : 'التلميذ');
  const overrideDefs = () => [
    { sec: 'تفاصيل (تُملأ من السجل ويمكن تعديلها هنا)' },
    { k: 'pupil', l: 'التلميذ(ة)', list: 'k2Pupils', half: true }, { k: 'date', l: 'تاريخ الحادثة', t: 'date', half: true },
    { k: 'time', l: 'الساعة', half: true, dir: 'ltr', ph: '10:30' }, { k: 'place', l: 'مكان الحادثة', half: true, list: 'incPlaces' },
    { k: 'desc', l: 'ظروف الحادثة ووصفها الدقيق', t: 'area', rows: 4 }, { k: 'injury', l: 'نوع الإصابة', half: true }, { k: 'aid', l: 'الإسعافات الأولية المقدمة', half: true }];
  const DOCS = [];
  const add = d => DOCS.push(d);
  const inst = s => esc(s.school || '');

  add({
    k: 'sa_notice', t: 'إشعار بوقوع حادثة مدرسية (فوري)', grp: 'n', d: 'إشعار مديرية الشؤون القانونية والمنازعات على وجه الاستعجال عبر المديرية الإقليمية والأكاديمية (المذكرة 071X19).', auto: 'سجل الحوادث المدرسية وبطاقة التلاميذ', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), ref: '' }),
    defs: () => [saField, { k: 'ref', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }].concat(overrideDefs()),
    build: (s, f) => { const o = acc(f); return letter(s, [topLine(s, f, `رقم الإرسال: ${esc(f.ref || '........')}`),
      recipient(s, ['من مدير(ة) ' + inst(s), 'إلى', 'السيد المدير الإقليمي ' + esc(withL(s.academy)), esc(s.directorate ? 'ب' + nm(s.directorate).replace(/^المديرية الإقليمية\s*/, 'المديرية الإقليمية ') : ''), 'مصلحة الشؤون القانونية والتواصل والشراكة', '<span style="font-weight:400">قصد إشعار مديرية الشؤون القانونية والمنازعات</span>']),
      subj('إشعار بوقوع حادثة مدرسية'), salut,
      P(`وبعد، يشرفني أن أخبركم أن ${pupilWord(o)} ${dots(o.pupil, 50)} ${o.code ? `رقم مسار <bdi dir="ltr"><b>${esc(o.code)}</b></bdi>` : ''} ${o.cls ? `بالقسم <bdi dir="ltr">${esc(o.cls)}</bdi>` : ''} تعرض${isF(o) ? 'ت' : ''} لحادثة مدرسية يوم ${dateL(o.date)} على الساعة ${time(o.time)} ${o.place ? 'ب' + esc(o.place.replace(/^ب/, '')) : ''}.`),
      P(`<b>ظروف الحادثة:</b> ${o.desc ? esc(o.desc) : dots('', 140)}`), P(`<b>نوع الإصابة:</b> ${dots(o.injury, 80)} &nbsp; <b>الإجراءات المتخذة:</b> ${dots([o.aid, o.amb === 'yes' ? 'نقل المصاب(ة) بسيارة الإسعاف' + (o.hosp ? ' إلى ' + o.hosp : '') : ''].filter(Boolean).join('، '), 60)}`),
      P('وسيتم موافاتكم بملف الحادثة كاملا فور استيفائه لجميع الوثائق الضرورية.'),
      { html: '<p class="sb-p" style="text-align:center;font-weight:700;margin-top:3mm">والسلام</p>' }, SB.sign(s, { right: '', left: 'توقيع وطابع مدير(ة) المؤسسة' })]); }
  });

  /* the official form «تصريح بحادثة مدرسية» (model supplied by the school): pupil, supervisor, declaration, circumstances,
     up to three witnesses with their testimony and signature, report of the head of the school, sketch of the place attached */
  const L = (lbl, v, w) => `<span class="dc-l">${lbl}:</span> ${nm(v) ? `<b>${esc(v)}</b>` : `<span class="sb-dots" style="min-width:${w || 40}mm"></span>`}`;
  const lines = (txt, n) => { const t = nm(txt); return t ? `<div class="dc-txt">${esc(t).replace(/\n/g, '<br>')}</div>` : Array.from({ length: n }, () => '<div class="dc-dl"></div>').join(''); };
  add({
    k: 'sa_decl', t: 'التصريح بالحادثة المدرسية', grp: 'n', d: 'النموذج الرسمي «تصريح بحادثة مدرسية»: التلميذ(ة) المصاب(ة)، المكلف(ة) بالحراسة، ظروف الحادث، شهود الحادث وشهاداتهم، وتقرير رئيس(ة) المؤسسة.', auto: 'سجل الحوادث المدرسية وبطاقة التلاميذ', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), wit: [['', '', '', ''], ['', '', '', ''], ['', '', '', '']] }),
    defs: () => [saField, { k: 'city', l: 'حرر في', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }].concat(overrideDefs(), [
      { k: 'reg', l: 'رقم التسجيل (اختياري: رقم مسار افتراضيا)', half: true, dir: 'ltr' }, { k: 'addr', l: 'عنوان التلميذ(ة)', half: true },
      { sec: 'المكلف(ة) بالحراسة' }, { k: 'teacher', l: 'السيد(ة)', half: true, list: 'k2Emps' }, { k: 'supRole', l: 'بصفته(ا)', half: true },
      { k: 'wit', l: 'شهود الحادث (حتى ثلاثة)', t: 'grid', cols: ['الاسم والنسب', 'القسم', 'رقم التسجيل', 'شهادته'], widths: ['1.3fr', '.6fr', '.7fr', '2fr'] },
      { k: 'dirRep', l: 'تقرير رئيس(ة) المؤسسة', t: 'area', rows: 4 }]),
    build: (s, f) => { const o = acc(f), e = K.E.byName(o.teacher) || {}; const W = (f.wit || []).concat([[], [], []]).slice(0, 3);
      const wit = W.map((w, wi) => `<div class="dc-w"><div class="dc-r"><b>${wi + 1}-</b> ${L('الاسم والنسب', w[0], 60)} &nbsp; ${L('القسم', w[1], 22)}</div><div class="dc-r">${L('رقم التسجيل', w[2], 30)}</div>
        <div class="dc-r">${L('شهادته', '', 1).replace('<span class="sb-dots" style="min-width:1mm"></span>', '')}</div>${lines(w[3], 3)}<div class="dc-sig">الإمضاء:</div></div>`).join('');
      const html = `<div class="dc">
        <div class="dc-t">‹‹ تصريح بحادثة مدرسية ››</div>
        <div class="dc-h">التلميذ(ة) المصاب(ة):</div>
        <div class="dc-r">${L('الاسم والنسب', o.pupil, 60)} &nbsp; ${L('المؤسسة', s.school, 45)}</div>
        <div class="dc-r">${L('القسم', [o.lvl, o.cls].filter(Boolean).join(' / '), 40)} &nbsp; ${L('رقم التسجيل', nm(f.reg) || o.code, 30)}</div>
        <div class="dc-r">${L('العنوان', f.addr, 150)}</div>
        <div class="dc-h">المكلف(ة) بالحراسة:</div>
        <div class="dc-r">${L('السيد(ة)', o.teacher, 50)} &nbsp; ${L('بصفته(ا)', f.supRole || e.cadre, 40)} &nbsp; ${L('رقم التأجير', e.ppr, 25)}</div>
        <div class="dc-r">يصرح للسيد(ة) المدير(ة) أن الحادثة وقعت يوم ${o.date ? `<b>${esc(ldate(o.date))}</b>` : '<span class="sb-dots" style="min-width:40mm"></span>'} ${L('على الساعة', o.time, 20)} ${L('بالمكان التالي', o.place, 50)}</div>
        <div class="dc-h">ظروف الحادث:</div>${lines(o.desc, 3)}
        <div class="dc-sig c">إمضاء المكلف(ة) بالحراسة:</div>
        <div class="dc-h">شهود الحادث:</div></div>${wit}<div class="dc">
        <div class="dc-h">تقرير رئيس(ة) المؤسسة:</div>${lines(f.dirRep, 5)}
        <div class="dc-r dc-end"><span>حرر في: ${nm(f.city || s.city) ? `<b>${esc(f.city || s.city)}</b>` : '<span class="sb-dots"></span>'}</span><span>بتاريخ: ${f.date ? `<b>${esc(ldate(f.date))}</b>` : '<span class="sb-dots"></span>'}</span></div>
        <div class="dc-sig c">إمضاء رئيس(ة) المؤسسة:</div>
        <div class="dc-note">يرفق التقرير بتصميم يبين مكان وقوع الحادث وموقع المكلف بالحراسة.</div></div>`;
      // 1.9.4: in blocks — a long declaration continues on a second page instead of losing its end (report and signature of the director)
      const parts = html.split('\x01'), ws = parts[1].split('<div class="dc-w">').filter(Boolean).map(w => ({ html: '<div class="dc"><div class="dc-w">' + w + '</div>' }));
      return letter(s, [{ html: parts[0] }, ...ws, { html: parts[2] }]); }
  });
  Dx.modCss += `
  .dc{font-size:11pt;line-height:1.75}.dc-t{text-align:center;font-weight:700;font-size:15pt;text-decoration:underline;margin:0 0 2mm}
  .dc-h{font-weight:700;text-decoration:underline;margin:2mm 0 .5mm}.dc-r{margin:.3mm 0}.dc-l{font-weight:400}
  .dc-dl{border-bottom:1px dotted #333;height:6.2mm}.dc-txt{text-align:justify;border-bottom:1px dotted #333;padding-bottom:.5mm}
  .dc-w{margin:1mm 0 1.5mm;padding-inline-start:4mm}.dc-sig{font-weight:700;margin:1mm 0 3mm}.dc-sig.c{text-align:center}
  .dc-end{display:flex;justify-content:space-between;margin-top:3mm}.dc-note{font-size:9.6pt;margin-top:2mm}`;

  add({
    k: 'sa_report', t: 'تقرير عن حادثة مدرسية', grp: 'n', d: 'تقرير مدير المؤسسة إلى المديرية الإقليمية (مصلحة الشؤون القانونية) بتفاصيل الحادثة ونتائج الفحوصات الأولية.', auto: 'سجل الحوادث المدرسية', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), ref: '' }),
    defs: () => [saField, { k: 'ref', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }].concat(overrideDefs(), [{ k: 'result', l: 'نتائج الفحوصات الأولية / الحالة الصحية', t: 'area', rows: 2 }]),
    build: (s, f) => { const o = acc(f); return letter(s, [topLine(s, f, `رقم الإرسال: ${esc(f.ref || '........')}`), recipient(s, ['من رئيس المؤسسة', 'إلى السيد المدير الإقليمي', esc(s.directorate || ''), 'مصلحة الشؤون القانونية والتواصل والشراكة']),
      subj('تقرير عن حادثة مدرسية.'), salut,
      P(`وبعد، علاقة بالموضوع أعلاه، يشرفني أن أضع بين أيديكم تقرير الحادثة المدرسية التي تعرض${isF(o) ? 'ت' : ''} لها ${pupilWord(o)} ${dots(o.pupil, 50)} ${o.code ? `رقم مسار <bdi dir="ltr">${esc(o.code)}</bdi>` : ''} ${o.cls ? `المسجل${isF(o) ? 'ة' : ''} بالقسم <bdi dir="ltr">${esc(o.cls)}</bdi>` : ''}، وهذه تفاصيلها:`, 'text-indent:8mm'),
      P(`في يوم ${dateL(o.date)} على الساعة ${time(o.time)}${o.place ? '، ' + esc(o.place) : ''}${o.activity ? '، أثناء ' + esc(o.activity) : ''}: ${o.desc ? esc(o.desc) : dots('', 160)}`),
      P(`وقد أسفرت الحادثة عن: ${dots(o.injury, 90)}. ${o.aid ? 'وقُدمت للمصاب(ة) الإسعافات الأولية التالية: ' + esc(o.aid) + '.' : ''} ${o.amb === 'yes' ? `وتم الاتصال بالإسعاف${o.ambTime ? ' على الساعة ' + time(o.ambTime) : ''}${o.hosp ? '، ونُقل' + (isF(o) ? 'ت' : '') + ' المصاب' + (isF(o) ? 'ة' : '') + ' إلى ' + esc(o.hosp) : ''}${o.escort ? ' برفقة ' + esc(o.escort) : ''}.` : ''} ${o.parent ? 'كما تم إخبار ولي الأمر السيد(ة) ' + esc(o.parent) + '.' : ''}`),
      f.result ? P(esc(f.result)) : P(''),
      { html: '<p class="sb-p" style="text-align:center;font-weight:700;margin-top:3mm">وتقبلوا في الختام فائق التقدير والاحترام<br>والسلام</p>' }, SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة:' })]); }
  });

  add({
    k: 'sa_parent', t: 'إشعار ولي الأمر بالحادثة', grp: 'n', d: 'إخبار ولي الأمر بالحادثة وبالوثائق المطلوبة لاستكمال ملف الحادثة (الشهادة الطبية، عقد الازدياد، البطاقة الوطنية للأب).', auto: 'سجل الحوادث المدرسية', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso() }),
    defs: () => [saField, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'parent', l: 'ولي الأمر', half: true }, { k: 'days', l: 'أجل إحضار الوثائق (أيام)', t: 'num', half: true }].concat(overrideDefs()),
    build: (s, f) => { const o = acc(f); return letter(s, [topLine(s, f, ''), recipient(s, ['من مدير(ة) ' + inst(s), `إلى السيد(ة): ${o.parent ? esc(o.parent) : '..............................'}`, `ولي أمر ${pupilWord(o)}: ${esc(o.pupil || '..............................')}`]),
      subj('إشعار بحادثة مدرسية'), salut,
      P(`وبعد، يؤسفني أن أخبركم أن ${isF(o) ? 'ابنتكم' : 'ابنكم'} ${pupilWord(o)} ${dots(o.pupil, 50)} تعرض${isF(o) ? 'ت' : ''} لحادثة مدرسية يوم ${dateL(o.date)} على الساعة ${time(o.time)}${o.place ? '، ' + esc(o.place) : ''}، نتج عنها: ${dots(o.injury, 60)}.`, 'text-indent:8mm'),
      P(`وقصد تسوية ملف الحادثة في إطار الضمان المدرسي، المرجو موافاة إدارة المؤسسة${f.days ? ' داخل أجل ' + esc(f.days) + ' أيام' : ' في أقرب الآجال'} بالوثائق التالية:`),
      { html: `<ul class="sb-p" style="margin:0 8mm 2mm;line-height:1.9">${['الشهادة الطبية الأولية التي تصف بدقة نوع الإصابة (مصادق عليها من طرف اللجنة الطبية الإقليمية)', 'الملف الطبي ووثائق المصاريف (الوصفات الطبية، الفواتير، الأشعة...) بأصولها', 'نسختان من عقد الازدياد', 'نسختان مصادق عليهما من البطاقة الوطنية للتعريف لولي الأمر (وما يثبت الكفالة أو الحضانة إذا كان الولي غير الأب)'].map(x => `<li>${x}</li>`).join('')}</ul>` },
      { html: '<p class="sb-p" style="text-align:center;font-weight:700;margin-top:2mm">وتقبلوا فائق التقدير والاحترام، والسلام</p>' }, SB.sign(s, { right: '', left: 'توقيع وطابع مدير(ة) المؤسسة' })]); }
  });

  /* ---------- ambulance call sheet (school & service) ---------- */
  const ambDefs = (field, who) => [field, { k: 'callTime', l: 'ساعة الاتصال', half: true, dir: 'ltr', ph: '10:35' }, { k: 'num', l: 'الرقم المتصل به', t: 'select', opts: AMB.map(([n, l]) => [n, `${n} — ${l}`]).concat([['other', 'رقم آخر']]), half: true },
    { k: 'numOther', l: 'رقم آخر (اختياري)', half: true, dir: 'ltr' }, { k: 'caller', l: 'المتصل (الاسم والصفة)', half: true }, { k: 'said', l: 'المعلومات المبلغة', t: 'area', rows: 2 },
    { k: 'arrive', l: 'ساعة وصول الإسعاف', half: true, dir: 'ltr' }, { k: 'leave', l: 'ساعة مغادرة المؤسسة', half: true, dir: 'ltr' }, { k: 'hosp', l: 'وجهة النقل (المستشفى / المستوصف)', half: true }, { k: 'escort', l: 'المرافق(ة)', half: true },
    { k: 'crew', l: 'رقم سيارة الإسعاف / اسم المسعف', half: true }, { k: 'informed', l: `تم إخبار ${who}`, half: true, list: 'incInformed' }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }];
  function ambSheet(s, f, o, who) {
    const n = f.num === 'other' ? nm(f.numOther) : nm(f.num);
    const label = (AMB.find(x => x[0] === n) || [n, ''])[1];
    return asDoc(s, { title: 'ورقة الاتصال بالإسعاف', sub: `${who} — ${o.name ? esc(o.name) : ''}`, page: 'a4', blocks: [
      kvT([['المؤسسة', esc(s.school || '')], ['الهاتف', `<bdi dir="ltr">${esc(s.phone || '')}</bdi>`], ['العنوان / الجماعة', esc([s.address, s.commune].filter(Boolean).join(' — '))], ['المدير(ة)', esc(s.director || '')]]),
      { html: '<div class="sb-cap" style="margin-top:2mm">المصاب(ة)</div>' },
      kvT([['الاسم الكامل', `<b>${esc(o.name || '')}</b>`], [o.idLabel, `<bdi dir="ltr">${esc(o.id || '')}</bdi>`], ['تاريخ الحادثة', dateL(o.date)], ['ساعة الحادثة', time(o.time)], ['مكان الحادثة', esc(o.place || '')], ['نوع الإصابة', esc(o.injury || '')]]),
      { html: '<div class="sb-cap" style="margin-top:2mm">الاتصال</div>' },
      kvT([['ساعة الاتصال', time(f.callTime)], ['الرقم المتصل به', n ? `<b><bdi dir="ltr">${esc(n)}</bdi></b> ${esc(label)}` : ''], ['المتصل', esc(f.caller || s.director || '')], ['ساعة وصول الإسعاف', time(f.arrive)], ['ساعة مغادرة المؤسسة', time(f.leave)], ['وجهة النقل', esc(f.hosp || o.hosp || '')], ['المرافق(ة)', esc(f.escort || o.escort || '')], ['سيارة الإسعاف / المسعف', esc(f.crew || '')]]),
      kv1([['المعلومات المبلغة للإسعاف', esc(f.said || '') || '<div style="height:14mm"></div>'], ['تم إخبار', esc(f.informed || '')]]),
      { html: `<div class="sb-box" style="margin-top:2mm;font-size:9.6pt;line-height:1.7"><h4>أرقام النجدة</h4>${AMB.map(([x, l]) => `<span style="display:inline-block;min-width:44%"><b><bdi dir="ltr">${x}</bdi></b> : ${esc(l)}</span>`).join('')}</div>` }],
      sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} في: ${dateL(f.date)}`, left: 'توقيع مدير(ة) المؤسسة' }) });
  }
  // 1.9.4: the model of the schools — the pupil's card handed to the ambulance (two copies on the sheet), signed by the general supervisor / the director
  const isSecC = () => { try { return typeof isSecCycle === 'function' && isSecCycle(); } catch (_) { return false; } };
  const AMB_SIG = () => [['gs', 'إمضاء الحارس(ة) العام(ة)'], ['dir', 'إمضاء مدير(ة) المؤسسة'], ['both', 'الحارس العام ومدير المؤسسة']];
  function ambCard(s, f, o, sy) {
    const p = pupilOf(o.pupil), g = p.guard || {}, fa = g.father || {}, who = [fa.first, fa.last].filter(Boolean).join(' ');
    const row = (l, v, w) => `<div class="inc-af"><b>${l} :</b> ${v ? `<span class="v">${v}</span>` : `<span class="sb-dots" style="min-width:${w || 110}mm"></span>`}</div>`;
    const birth = [o.birth ? dateL(o.birth) : '', esc(p.place || p.birthPlace || '')].filter(Boolean).join(' ب');
    const sig = f.sig || (isSecC() ? 'gs' : 'dir');
    const sigH = sig === 'both' ? '<div class="inc-as two"><div>إمضاء الحارس(ة) العام(ة)</div><div>إمضاء مدير(ة) المؤسسة</div></div>' : `<div class="inc-as"><div>${sig === 'gs' ? 'إمضاء الحارس(ة) العام(ة)' : 'إمضاء مدير(ة) المؤسسة'}</div></div>`;
    const one = `<div class="inc-amb">${hdrOnly(s)}
      <div class="inc-amb-sy">الموسم الدراسي : <b>${esc(MK.syDash(sy).replace('-', '/'))}</b></div>
      <div class="inc-amb-t">ورقة الاتصال بالإسعاف</div>
      ${row('الاسم الكامل', o.pupil ? `<b>${esc(o.pupil)}</b>` : '')}${row('القسم', esc(o.cls || ''), 60)}${row('رقم مسار', o.code ? `<bdi dir="ltr">${esc(o.code)}</bdi>` : '', 60)}
      ${row('تاريخ ومكان الازدياد', birth, 90)}${row('اسم الأب', esc(f.father || who), 90)}${row('العنوان العائلي', esc(f.addr || p.address || g.address || fa.address || ''), 100)}
      ${row('الهاتف', (f.tel || o.parentPhone || fa.phone || g.phone) ? `<bdi dir="ltr">${esc(f.tel || o.parentPhone || fa.phone || g.phone)}</bdi>` : '', 70)}
      ${f.more ? row('معلومات صحية / ملاحظات', esc(f.more)) : ''}
      <div class="inc-af"><b>حرر ب${esc(f.city || s.city || '')} بتاريخ :</b> ${f.date ? dateL(f.date) : '<span class="sb-dots" style="min-width:40mm"></span>'}</div>
      ${sigH}</div>`;
    const n = f.copies === '1' ? 1 : 2;
    return { page: 'a4', pages: [`<div class="page-a4 sb inc-ambp">${n === 2 ? `${one}<div class="inc-cut">✂</div>${one}` : one}</div>`] };
  }
  add({
    k: 'sa_amb', t: 'ورقة الاتصال بالإسعاف', grp: 'a', d: 'بطاقة التلميذ(ة) المصاب(ة) التي تسلم للإسعاف (نموذج المؤسسات، نسختان في الورقة): الاسم، القسم، رقم مسار، الازدياد، اسم الأب، العنوان، الهاتف — أو ورقة مفصلة لتسجيل الاتصال والنقل.', auto: 'سجل الحوادث المدرسية وبطاقة التلاميذ', page: 'a4',
    init: s => ({ model: 'card', copies: '2', city: s.city || '', date: Dx.todayIso(), num: '15', caller: s.director || '' }),
    defs: f => (f && f.model === 'full' ? [{ k: 'model', l: 'النموذج', t: 'select', opts: [['card', 'نموذج المؤسسة: بطاقة التلميذ للإسعاف (نسختان)'], ['full', 'ورقة مفصلة: الاتصال والنقل وأرقام النجدة']] }].concat(ambDefs(saField, 'ولي الأمر'))
      : [{ k: 'model', l: 'النموذج', t: 'select', opts: [['card', 'نموذج المؤسسة: بطاقة التلميذ للإسعاف (نسختان)'], ['full', 'ورقة مفصلة: الاتصال والنقل وأرقام النجدة']] }, saField,
        { note: 'تملأ المعطيات من سجل الحوادث المدرسية وبطاقة التلاميذ (معلومات الأولياء)، ويمكن كتابتها أو تعويضها هنا.' },
        { k: 'father', l: 'اسم الأب', half: true }, { k: 'tel', l: 'الهاتف', half: true, dir: 'ltr' }, { k: 'addr', l: 'العنوان العائلي' }, { k: 'more', l: 'معلومات صحية / ملاحظات (اختياري)' },
        { k: 'sig', l: 'التوقيع', t: 'select', half: true, opts: () => [['', isSecC() ? 'الحارس العام (افتراضي)' : 'مدير المؤسسة (افتراضي)']].concat(AMB_SIG()) }, { k: 'copies', l: 'عدد النسخ في الورقة', t: 'select', half: true, opts: [['2', 'نسختان'], ['1', 'نسخة واحدة']] },
        { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }]),
    build: (s, f, sy) => { const o = acc(f); return f.model === 'full' ? ambSheet(s, f, { name: o.pupil, idLabel: 'رقم مسار', id: o.code, date: o.date, time: o.time, place: o.place, injury: o.injury, hosp: o.hosp, escort: o.escort }, 'حادثة مدرسية') : ambCard(s, f, o, sy || MK.curSy()); }
  });

  /* ---------- receipt (school & service) ---------- */
  const RC_SA = [['docs', 'وصل تسلم وثائق ملف الحادثة من ولي الأمر'], ['hand', 'وصل تسليم التلميذ(ة) لولي الأمر بعد الحادثة'], ['amb', 'وصل تسليم المصاب(ة) لطاقم الإسعاف']];
  const SA_DOCS = ['التصريح بالحادثة', 'الشهادة الطبية الأولية', 'الملف الطبي (الوصفات، الفواتير، الأشعة...)', 'نسختان من عقد الازدياد', 'نسختان من البطاقة الوطنية لولي الأمر (مصادق عليهما)', 'وصل التأمين (الضمان المدرسي)', 'وثيقة الكفالة أو الحضانة'];
  function receipt(s, f, o, kindLabel, docsList, who) {
    const k = f.kind || 'docs';
    const items = String(f.items || '').split('\n').map(nm).filter(Boolean);
    const L = items.length ? items : docsList.filter((_, i) => (f.pick || [])[i]);
    const one = `<div class="inc-rc">
      <div class="inc-rc-t">${esc(kindLabel)}</div>
      ${k === 'docs' ? `<p class="sb-p">يشهد مدير(ة) ${inst(s)} أنه تسلم من السيد(ة): ${dots(f.from || o.parent, 50)}${o.staff ? '' : '، ولي(ة) أمر'} ${who} ${o.staff && nm(f.from || o.parent) === nm(o.name) ? '' : dots(o.name, 50)} الوثائق التالية المتعلقة بملف الحادثة المؤرخة في ${dateL(o.date)}:</p>
        <ol class="sb-p" style="margin:0 8mm 1mm">${(L.length ? L : ['', '', '']).map(x => `<li>${x ? esc(x) : '<span class="sb-dots" style="min-width:110mm"></span>'}</li>`).join('')}</ol>`
      : k === 'hand' ? `<p class="sb-p">أنا الموقع(ة) أسفله: ${dots(f.from || o.parent, 50)} ولي(ة) أمر ${who} ${dots(o.name, 50)}، أشهد أني تسلمت ${isF(o) ? 'ابنتي' : 'ابني'} من إدارة ${inst(s)} يوم ${dateL(f.date)} على الساعة ${time(f.at)} إثر الحادثة التي تعرض${isF(o) ? 'ت' : ''} لها، وأنني اطلعت على ظروفها والإسعافات المقدمة.</p>`
      : `<p class="sb-p">يشهد السيد(ة): ${dots(f.from, 50)} عن طاقم الإسعاف ${f.crew ? '(' + esc(f.crew) + ')' : ''} أنه تسلم المصاب(ة) ${dots(o.name, 50)} من إدارة ${inst(s)} يوم ${dateL(f.date)} على الساعة ${time(f.at)} قصد نقله(ا) إلى ${dots(f.hosp || o.hosp, 50)}.</p>`}
      <div class="inc-rc-s"><div>${k === 'hand' ? 'توقيع ولي الأمر' : k === 'amb' ? 'توقيع المسعف' : 'توقيع المسلِّم'}</div><div>حرر ب: ${esc(f.city || s.city || '')} في: ${dateL(f.date)}</div><div>توقيع وخاتم مدير(ة) المؤسسة</div></div>
    </div>`;
    return { page: 'a4', pages: [`<div class="page-a4 sb inc-rcp">${hdrOnly(s)}${one}<div class="inc-cut">✂</div>${hdrOnly(s)}${one}</div>`] };
  }
  add({
    k: 'sa_rcpt', t: 'ورقة الوصل', grp: 'a', d: 'وصل تسلم وثائق ملف الحادثة، أو وصل تسليم التلميذ(ة) لوليه، أو وصل تسليمه لطاقم الإسعاف — نسختان في الورقة.', auto: 'سجل الحوادث المدرسية', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), kind: 'docs', pick: SA_DOCS.map((_, i) => i < 5) }),
    defs: () => [saField, { k: 'kind', l: 'نوع الوصل', t: 'select', opts: RC_SA, half: true }, { k: 'from', l: 'المسلِّم / المتسلم (الاسم)', half: true }, { k: 'at', l: 'الساعة', half: true, dir: 'ltr' }, { k: 'hosp', l: 'وجهة النقل (لوصل الإسعاف)', half: true }, { k: 'crew', l: 'سيارة الإسعاف', half: true },
      { k: 'pick', l: 'الوثائق المتسلمة', t: 'checks', opts: SA_DOCS }, { k: 'items', l: 'أو اكتب لائحة الوثائق (سطر لكل وثيقة)', t: 'area', rows: 2 }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f) => { const o = acc(f); return receipt(s, f, { name: o.pupil, date: o.date, parent: o.parent, hosp: o.hosp, g: o.g }, (RC_SA.find(x => x[0] === (f.kind || 'docs')) || RC_SA[0])[1], SA_DOCS, pupilWord(o)); }
  });

  add({
    k: 'sa_file', t: 'ورقة إرسال ملف الحادثة المدرسية', grp: 'f', d: 'ورقة إرسال الملف إلى المديرية مع التأكد من استيفاء كل الوثائق (التصريح، الملف الطبي، عقد الازدياد، البطاقة الوطنية للأب...).', auto: 'سجل الحوادث المدرسية', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), ref: '', pick: SA_DOCS.map((_, i) => i < 6) }),
    defs: () => [saField, { k: 'ref', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'pick', l: 'مكونات الملف المرفقة', t: 'checks', opts: SA_DOCS.concat(['نسخة موجزة من رسم الوفاة وشهادة طبية أصلية للوفاة (عند الوفاة)', 'تقرير اللجنة الطبية الإقليمية (نسبة العجز البدني الدائم)']) }],
    build: (s, f) => { const o = acc(f); const all = SA_DOCS.concat(['نسخة موجزة من رسم الوفاة وشهادة طبية أصلية للوفاة (عند الوفاة)', 'تقرير اللجنة الطبية الإقليمية (نسبة العجز البدني الدائم)']);
      const rows = all.map((d, i) => tr([i + 1, { t: d, c: 'r' }, { h: chk((f.pick || [])[i]) }, (f.pick || [])[i] ? '1' : '']));
      return letter(s, [topLine(s, f, `رقم الإرسال: ${esc(f.ref || '........')}`), recipient(s, ['من مدير(ة) ' + inst(s), 'إلى', 'السيد المدير الإقليمي', esc(s.directorate || ''), 'مصلحة الشؤون القانونية والتواصل والشراكة']),
        { html: '<div class="sb-cap" style="text-align:center;font-size:13pt;margin:2mm 0">ورقة إرسال</div>' },
        subj(`ملف الحادثة المدرسية التي تعرض${isF(o) ? 'ت' : ''} لها ${pupilWord(o)} ${esc(o.pupil || '..........')} بتاريخ ${dateL(o.date)}`),
        tbl(thr([{ t: 'ر.ت', c: 'd' }, { t: 'الوثائق المرسلة', c: 'd' }, { t: 'مرفقة', c: 'd' }, { t: 'العدد', c: 'd' }]), rows, 'cmp'),
        P('قصد الدراسة والتسوية في إطار ظهير 26 أكتوبر 1942 أو اتفاقية الضمان المدرسي (المذكرة الوزارية 071X19).', 'margin-top:2mm'),
        SB.sign(s, { right: '', left: 'توقيع وطابع مدير(ة) المؤسسة' })]); }
  });

  add({
    k: 'sa_list', t: 'بيان الحوادث المدرسية المسجلة', grp: 'f', d: 'بيان بكل الحوادث المدرسية المسجلة بالمؤسسة خلال الدورة أو الموسم (يرفع في نهاية كل دورة دراسية).', auto: 'سجل الحوادث المدرسية', page: 'a4l',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), per: 'sy' }),
    defs: () => [{ k: 'per', l: 'الفترة', t: 'select', opts: [['sy', 'الموسم الدراسي كاملا'], ['s1', 'الدورة الأولى'], ['s2', 'الدورة الثانية']], half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f, sy) => { const y0 = MK.syStart(sy); const rng = f.per === 's1' ? [`${y0}-09-01`, `${y0 + 1}-01-31`] : f.per === 's2' ? [`${y0 + 1}-02-01`, `${y0 + 1}-08-31`] : [`${y0}-09-01`, `${y0 + 1}-08-31`];
      const L = IN().school.filter(a => a.date && a.date >= rng[0] && a.date <= rng[1]).sort((a, b) => a.date.localeCompare(b.date));
      const rows = L.map((a, i) => { const o = acc({ evt: a.id }); return tr([i + 1, { t: o.pupil, c: 'r b' }, { t: o.code, c: 'sm' }, { t: [o.lvl, o.cls].filter(Boolean).join(' / '), c: 'sm' }, { t: ldate(o.date), c: 'sm' }, { t: o.place, c: 'sm' }, { t: o.injury, c: 'sm' }, { t: o.amb === 'yes' ? 'نعم' : '', c: 'sm' }, { t: o.ins, c: 'sm' }, { t: a.status || '', c: 'sm' }]); });
      for (let i = rows.length; i < 6; i++) rows.push(tr([i + 1, '', '', '', '', '', '', '', '', { t: '', st: 'height:7mm' }]));
      return asDoc(s, { title: `بيان الحوادث المدرسية المسجلة — ${{ s1: 'الدورة الأولى', s2: 'الدورة الثانية' }[f.per] || 'الموسم الدراسي'} ${syText(sy)}`, page: 'a4l', blocks: [tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم مسار', 'المستوى / القسم', 'تاريخ الحادثة', 'المكان', 'نوع الإصابة', 'الإسعاف', 'وصل التأمين', 'وضعية الملف'].map(t => ({ t, c: 'd' }))), rows, 'cmp'),
        P(`عدد الحوادث المسجلة: <b>${L.length}</b>`, 'margin-top:1.5mm')], sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} في: ${dateL(f.date)}`, left: 'توقيع وطابع مدير(ة) المؤسسة' }) }); }
  });

  /* =================== service accidents (staff) =================== */
  const SV = () => IN().service.slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || '')));
  const svById = id => IN().service.find(x => x.id === id) || null;
  const svLabel = a => `${a.emp || '؟'} — ${a.date ? ldate(a.date) : ''}${a.kind ? ' — ' + a.kind : ''}`;
  const svField = { k: 'evt', l: 'الحادثة (من سجل حوادث المصلحة)', t: 'select', opts: () => [['', '— اختر حادثة مسجلة —']].concat(SV().map(a => [a.id, svLabel(a)])) };
  const SVF = ['emp', 'date', 'time', 'place', 'kind', 'vehicle', 'desc', 'injury', 'others', 'aid', 'amb', 'ambTime', 'hosp', 'escort', 'police', 'witness', 'cert', 'certDays', 'result', 'notes'];
  const svc = f => { const a = svById(f.evt) || {}; const o = {}; SVF.forEach(k => { o[k] = nm(f[k]) || nm(a[k]); }); const e = K.E.byName(o.emp) || {}; o.e = e; o.ppr = e.ppr || ''; o.cadre = e.cadre || ''; o.unit = e.unit || ''; o.fem = e.sex === 'F'; return o; };
  const svDefs = () => [
    { sec: 'تفاصيل (تُملأ من السجل ويمكن تعديلها هنا)' },
    { k: 'emp', l: 'الموظف(ة) المصاب(ة)', list: 'k2Emps', half: true }, { k: 'date', l: 'تاريخ الحادثة', t: 'date', half: true }, { k: 'time', l: 'الساعة', half: true, dir: 'ltr' }, { k: 'place', l: 'مكان الحادثة', half: true },
    { k: 'kind', l: 'نوع الحادثة', t: 'select', opts: ['', 'حادثة سير في طريق العمل (الذهاب أو الإياب)', 'حادثة داخل مقر العمل', 'حادثة أثناء القيام بمهمة', 'أخرى'], half: true }, { k: 'vehicle', l: 'وسيلة التنقل', half: true },
    { k: 'desc', l: 'تفاصيل الحادثة', t: 'area', rows: 5 }, { k: 'injury', l: 'الإصابات', half: true }, { k: 'others', l: 'مرافقون / مصابون آخرون', half: true }];
  const svWho = o => `${o.fem ? 'السيدة' : 'السيد'} ${dots(o.emp, 45)}${o.ppr ? ` رقم التأجير <bdi dir="ltr"><b>${esc(o.ppr)}</b></bdi>` : ''}${o.cadre ? `، ${esc(o.cadre)}` : ''}`;
  const SV_DOCS = ['التصريح بالحادثة', 'تقرير رئيس المؤسسة', 'الشهادة الطبية الأولية', 'محضر الضابطة القضائية أو وصل معاينة الحادثة (حادثة سير)', 'شهادات الشهود', 'نسخة من البطاقة الوطنية للتعريف', 'شهادات التمديد وشهادة الشفاء أو استئناف العمل', 'نسخة من آخر ورقة الأداء'];
  const SDOCS = [];
  const sadd = d => SDOCS.push(d);

  sadd({
    k: 'sv_report', t: 'تقرير عن حادثة مصلحة', grp: 'n', d: 'تقرير رئيس المؤسسة إلى المديرية الإقليمية (مصلحة الشؤون القانونية والتواصل والشراكة) بتفاصيل الحادثة — على نموذج المؤسسة.', auto: 'سجل حوادث المصلحة ولائحة الموظفين', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), ref: '' }),
    defs: () => [svField, { k: 'ref', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }].concat(svDefs(), [{ k: 'result', l: 'نتائج الفحوصات الأولية / الحالة الصحية', t: 'area', rows: 3 }]),
    build: (s, f) => { const o = svc(f); return letter(s, [topLine(s, f, `رقم الإرسال: ${esc(f.ref || '........')}`), recipient(s, ['من رئيس المؤسسة', 'إلى السيد المدير الإقليمي', esc(s.directorate || ''), 'مصلحة الشؤون القانونية والتواصل والشراكة']),
      subj('تقرير عن حادثة مصلحة.'), salut,
      P(`وبعد، علاقة بالموضوع أعلاه، يشرفني أن أضع بين أيديكم تقرير الحادثة التي تعرض${o.fem ? 'ت' : ''} لها ${svWho(o)}${o.unit ? ` والذي يعمل بوحدة ${esc(o.unit)}` : ''}${o.others ? ` (رفقة ${esc(o.others)})` : ''}، وهذه تفاصيلها:`, 'text-indent:8mm'),
      P(`في يوم ${dateL(o.date)} على الساعة ${time(o.time)}${o.place ? '، ' + esc(o.place) : ''}${o.kind ? ' (' + esc(o.kind) + ')' : ''}${o.vehicle ? '، على متن ' + esc(o.vehicle) : ''}: ${o.desc ? esc(o.desc) : dots('', 160)}`),
      P(`وأسفرت الحادثة عن: ${dots(o.injury, 90)}.${o.police ? ' وقد حضر لمعاينة الحادثة: ' + esc(o.police) + '.' : ''}${o.amb === 'yes' ? ` وتم نقل المصاب${o.fem ? 'ة' : ''} بسيارة الإسعاف${o.hosp ? ' إلى ' + esc(o.hosp) : ''} لتلقي الإسعافات الضرورية.` : ''}`),
      o.result ? P(esc(o.result)) : P(''),
      { html: '<p class="sb-p" style="text-align:center;font-weight:700;margin-top:3mm">وتقبلوا في الختام فائق التقدير والاحترام<br>والسلام</p>' }, SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة:' })]); }
  });

  sadd({
    k: 'sv_decl', t: 'التصريح بحادثة مصلحة', grp: 'n', d: 'التصريح بالحادثة: هوية الموظف، تاريخ وساعة ومكان الحادثة، ظروفها، الشهود، الإصابات والشهادة الطبية الأولية.', auto: 'سجل حوادث المصلحة ولائحة الموظفين', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso() }),
    defs: () => [svField, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }].concat(svDefs(), [{ k: 'witness', l: 'الشهود', half: true }, { k: 'police', l: 'الجهة التي عاينت الحادثة', half: true }, { k: 'cert', l: 'الشهادة الطبية الأولية (الطبيب / التاريخ)', half: true }, { k: 'certDays', l: 'مدة العجز المؤقت (أيام)', t: 'num', half: true }]),
    build: (s, f) => { const o = svc(f), e = o.e; return asDoc(s, { title: 'التصريح بحادثة مصلحة', page: 'a4', blocks: [
      { html: '<div class="sb-cap">I. الموظف(ة) المصاب(ة)</div>' },
      kvT([['الاسم الكامل', `<b>${esc(o.emp)}</b>`], ['رقم التأجير', `<bdi dir="ltr">${esc(o.ppr)}</bdi>`], ['رقم البطاقة الوطنية', `<bdi dir="ltr">${esc(e.cin || '')}</bdi>`], ['تاريخ الازدياد', e.birth ? esc(ldate(e.birth)) : ''], ['الإطار', esc(o.cadre)], ['الدرجة', esc(e.grade || '')], ['المهمة', esc(e.task || '')], ['مقر العمل', esc(e.unit || s.school || '')], ['العنوان الشخصي', esc(e.address || '')], ['الهاتف', `<bdi dir="ltr">${esc(e.phone || '')}</bdi>`]]),
      { html: '<div class="sb-cap" style="margin-top:2mm">II. الحادثة</div>' },
      kvT([['التاريخ', dateL(o.date)], ['الساعة', time(o.time)], ['المكان', esc(o.place)], ['نوع الحادثة', esc(o.kind)], ['وسيلة التنقل', esc(o.vehicle)], ['الجهة التي عاينت الحادثة', esc(o.police)], ['الشهود', esc(o.witness)], ['مرافقون / مصابون آخرون', esc(o.others)]]),
      kv1([['ظروف الحادثة', esc(o.desc) || '<div style="height:24mm"></div>'], ['الإصابات', esc(o.injury)], ['الشهادة الطبية الأولية', esc([o.cert, o.certDays ? 'مدة العجز: ' + o.certDays + ' يوما' : ''].filter(Boolean).join(' — '))]]),
      { html: `<div class="sb-sign three" style="margin-top:4mm"><div>توقيع المعني(ة) بالأمر</div><div></div><div>توقيع وخاتم رئيس المؤسسة</div></div>` }],
      sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} في: ${dateL(f.date)}`, left: '' }) }); }
  });

  sadd({
    k: 'sv_amb', t: 'ورقة الاتصال بالإسعاف', grp: 'a', d: 'تسجيل الاتصال بالإسعاف إثر حادثة موظف: ساعة الاتصال، الرقم، ساعة الوصول، وجهة النقل والمرافق.', auto: 'سجل حوادث المصلحة', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), num: '15', caller: s.director || '' }),
    defs: () => ambDefs(svField, 'أسرة المعني(ة)'),
    build: (s, f) => { const o = svc(f); return ambSheet(s, f, { name: o.emp, idLabel: 'رقم التأجير', id: o.ppr, date: o.date, time: o.time, place: o.place, injury: o.injury, hosp: o.hosp, escort: o.escort }, 'حادثة مصلحة'); }
  });

  const RC_SV = [['docs', 'وصل تسلم وثائق ملف حادثة المصلحة'], ['cert', 'وصل تسلم الشهادة الطبية (حادثة مصلحة)'], ['amb', 'وصل تسليم المصاب(ة) لطاقم الإسعاف']];
  sadd({
    k: 'sv_rcpt', t: 'ورقة الوصل', grp: 'a', d: 'وصل تسلم الشهادة الطبية أو وثائق ملف حادثة المصلحة، أو وصل تسليم المصاب لطاقم الإسعاف — نسختان في الورقة.', auto: 'سجل حوادث المصلحة', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), kind: 'docs', pick: SV_DOCS.map((_, i) => i < 3) }),
    defs: () => [svField, { k: 'kind', l: 'نوع الوصل', t: 'select', opts: RC_SV, half: true }, { k: 'from', l: 'المسلِّم / المتسلم (الاسم)', half: true }, { k: 'at', l: 'الساعة', half: true, dir: 'ltr' }, { k: 'hosp', l: 'وجهة النقل', half: true }, { k: 'crew', l: 'سيارة الإسعاف', half: true },
      { k: 'pick', l: 'الوثائق المتسلمة', t: 'checks', opts: SV_DOCS }, { k: 'items', l: 'أو اكتب لائحة الوثائق (سطر لكل وثيقة)', t: 'area', rows: 2 }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f) => { const o = svc(f); const kind = f.kind === 'cert' ? 'docs' : f.kind; const items = f.kind === 'cert' && !nm(f.items) ? Object.assign({}, f, { kind, items: 'الشهادة الطبية الأولية' + (o.certDays ? ' (' + o.certDays + ' يوما)' : '') }) : Object.assign({}, f, { kind });
      return receipt(s, items, { name: o.emp, date: o.date, parent: o.emp, hosp: o.hosp, g: o.fem ? 'F' : 'M', staff: true }, (RC_SV.find(x => x[0] === (f.kind || 'docs')) || RC_SV[0])[1], SV_DOCS, o.fem ? 'الموظفة' : 'الموظف'); }
  });

  sadd({
    k: 'sv_file', t: 'ورقة إرسال ملف حادثة المصلحة', grp: 'f', d: 'ورقة إرسال الملف مع التأكد من استيفاء الوثائق المنصوص عليها في المذكرة 100 (25/06/2007).', auto: 'سجل حوادث المصلحة', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), ref: '', pick: SV_DOCS.map((_, i) => i < 4) }),
    defs: () => [svField, { k: 'ref', l: 'رقم الإرسال', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'pick', l: 'مكونات الملف المرفقة', t: 'checks', opts: SV_DOCS }],
    build: (s, f) => { const o = svc(f); const rows = SV_DOCS.map((d, i) => tr([i + 1, { t: d, c: 'r' }, { h: chk((f.pick || [])[i]) }, (f.pick || [])[i] ? '1' : '']));
      return letter(s, [topLine(s, f, `رقم الإرسال: ${esc(f.ref || '........')}`), recipient(s, ['من رئيس المؤسسة', 'إلى', 'السيد المدير الإقليمي', esc(s.directorate || ''), 'مصلحة الشؤون القانونية والتواصل والشراكة']),
        { html: '<div class="sb-cap" style="text-align:center;font-size:13pt;margin:2mm 0">ورقة إرسال</div>' },
        subj(`ملف حادثة المصلحة التي تعرض${o.fem ? 'ت' : ''} لها ${svWho(o)} بتاريخ ${dateL(o.date)}`),
        tbl(thr([{ t: 'ر.ت', c: 'd' }, { t: 'الوثائق المرسلة', c: 'd' }, { t: 'مرفقة', c: 'd' }, { t: 'العدد', c: 'd' }]), rows, 'cmp'),
        P('قصد عرض الملف على أنظار اللجنة الطبية الإقليمية ولجنة الإعفاء، وفق المذكرة الوزارية 071X19 والمذكرة 100 الصادرة بتاريخ 25/06/2007.', 'margin-top:2mm'),
        SB.sign(s, { right: '', left: 'توقيع وطابع رئيس المؤسسة' })]); }
  });

  sadd({
    k: 'sv_refund', t: 'طلب استرجاع المصاريف الطبية', grp: 'f', d: 'طلب الموظف المصاب استرجاع الصوائر والأتعاب الطبية (منشور رئيس الحكومة 10/2018 والمذكرة 159X18) مع لائحة الوثائق المرفقة.', auto: 'سجل حوادث المصلحة ولائحة الموظفين', page: 'a4',
    init: s => ({ city: s.city || '', date: Dx.todayIso(), amount: '' }),
    defs: () => [svField, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'amount', l: 'المبلغ الإجمالي للمصاريف (درهم)', t: 'money', half: true }, { k: 'bills', l: 'لائحة الوصفات والفواتير (سطر لكل وثيقة)', t: 'area', rows: 4 }].concat(svDefs().slice(0, 3)),
    build: (s, f) => { const o = svc(f), e = o.e; const B = String(f.bills || '').split('\n').map(nm).filter(Boolean);
      return { page: 'a4', pages: MK.flowPages({ page: 'a4', cls: 'sb', head: '', blocks: [
        { html: `<div style="display:flex;justify-content:space-between;font-weight:700;margin:2mm 0 3mm"><div style="line-height:1.8">الاسم الكامل: ${esc(o.emp || '')}<br>الإطار: ${esc(o.cadre)}<br>رقم التأجير: <bdi dir="ltr">${esc(o.ppr)}</bdi><br>مقر العمل: ${esc(e.unit || s.school || '')}</div><div>${esc(f.city || s.city || '')} في: ${dateL(f.date)}</div></div>` },
        recipient(s, ['إلى السيد المدير الإقليمي', esc(s.directorate || ''), 'مصلحة الشؤون القانونية والتواصل والشراكة', 'على يد السيد مدير ' + inst(s)]),
        subj('طلب استرجاع الصوائر والأتعاب الطبية المترتبة عن حادثة مصلحة'), salut,
        P(`وبعد، يشرفني أن أتقدم لسيادتكم بطلب استرجاع الصوائر والأتعاب الطبية المترتبة عن حادثة المصلحة التي تعرضت لها بتاريخ ${dateL(o.date)}${f.amount ? `، والبالغ مجموعها <b><bdi dir="ltr">${esc(Number(f.amount).toLocaleString('fr-FR'))}</bdi> درهم</b>` : ''}، طبقا لمنشور السيد رئيس الحكومة عدد 10/2018 بتاريخ 11 يونيو 2018 والمذكرة الوزارية عدد 159X18 بتاريخ 14 نونبر 2018.`, 'text-indent:8mm'),
        P('وتجدون رفقته الوثائق التالية:'),
        { html: `<ol class="sb-p" style="margin:0 8mm 2mm;line-height:1.9"><li>شهادة طبية أو تقرير طبي يحدد الحالة الصحية ونوع العلاجات التي تستدعيها</li><li>أصول الوصفات الطبية والفواتير المفصلة والوثائق المثبتة للمصاريف${B.length ? ':' : ''}${B.length ? `<ul>${B.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}</li></ol>` },
        { html: '<p class="sb-p" style="text-align:center;font-weight:700;margin-top:2mm">وفي انتظار قبول طلبي، تقبلوا مني فائق التقدير والاحترام</p>' },
        { html: `<div class="sb-sign"><div>رأي رئيس المؤسسة وتوقيعه</div><div>توقيع المعني(ة) بالأمر</div></div>` }] }) }; }
  });

  sadd({
    k: 'sv_list', t: 'البيان السنوي لحوادث المصلحة', grp: 'f', d: 'بيان بكل حوادث المصلحة المسجلة بالمؤسسة خلال الموسم الدراسي (يرفع في نهاية كل دورة).', auto: 'سجل حوادث المصلحة', page: 'a4l',
    init: s => ({ city: s.city || '', date: Dx.todayIso() }),
    defs: () => [{ k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f, sy) => { const y0 = MK.syStart(sy); const L = IN().service.filter(a => a.date && a.date >= `${y0}-09-01` && a.date <= `${y0 + 1}-08-31`).sort((a, b) => a.date.localeCompare(b.date));
      const rows = L.map((a, i) => { const o = svc({ evt: a.id }); return tr([i + 1, { t: o.emp, c: 'r b' }, { t: o.ppr, c: 'sm' }, { t: o.cadre, c: 'sm' }, { t: ldate(o.date), c: 'sm' }, { t: o.kind, c: 'sm' }, { t: o.injury, c: 'sm' }, { t: o.certDays || '', c: 'sm' }, { t: a.status || '', c: 'sm' }]); });
      for (let i = rows.length; i < 6; i++) rows.push(tr([i + 1, '', '', '', '', '', '', '', { t: '', st: 'height:7mm' }]));
      return asDoc(s, { title: `البيان السنوي لحوادث المصلحة — الموسم الدراسي ${syText(sy)}`, page: 'a4l', blocks: [tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الإطار', 'تاريخ الحادثة', 'نوع الحادثة', 'الإصابات', 'مدة العجز (أيام)', 'وضعية الملف'].map(t => ({ t, c: 'd' }))), rows, 'cmp'), P(`عدد الحوادث المسجلة: <b>${L.length}</b>`, 'margin-top:1.5mm')],
        sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} في: ${dateL(f.date)}`, left: 'توقيع وطابع رئيس المؤسسة' }) }); }
  });

  Dx.modCss += `
  .inc-rcp{display:flex;flex-direction:column}.inc-rc{border:1.3px dashed #555;border-radius:2.5mm;padding:2.5mm 5mm;margin:1mm 0 1.5mm;font-size:11pt}
  .inc-rc-t{text-align:center;font-weight:700;font-size:14pt;text-decoration:underline;margin-bottom:1.5mm}
  .inc-rc-s{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;text-align:center;font-weight:700;font-size:10pt;margin-top:3mm;min-height:16mm}
  .inc-ambp{display:flex;flex-direction:column;justify-content:flex-start;gap:0}.inc-ambp .inc-cut{margin:1.2mm 0}.inc-amb{border:1.2px solid #333;border-radius:2mm;padding:1.5mm 5mm 1.5mm;height:132mm;box-sizing:border-box;display:flex;flex-direction:column;font-size:11.5pt;overflow:hidden}
  .inc-amb .mk-hdr{zoom:.7}.inc-amb-sy{text-align:left;font-weight:700;margin:-1mm 0 1.5mm}.inc-amb-t{background:#ef8f22;color:#fff;font-weight:700;text-align:center;border-radius:3mm;padding:1.6mm;font-size:14pt;margin:0 0 2.5mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .inc-af{margin:.7mm 0;line-height:1.45}.inc-af .v{border-bottom:1px dotted #777;padding:0 2mm}.inc-as{margin-top:auto;border-top:1px solid #333;padding-top:1mm;min-height:24mm;box-sizing:border-box;text-align:center;font-weight:700;display:flex;justify-content:center}.inc-as.two{justify-content:space-around}
  .inc-cut{text-align:center;color:#777;font-size:10pt;border-top:1px dashed #999;line-height:1;margin:1.5mm 0}
  .inc-rcp .mk-hdr .hdr-v2,.inc-rcp .mk-hdr{transform-origin:top center}`;

  /* =================== the pages =================== */
  const dl = (id, list) => `<datalist id="${id}">${list.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`;
  const C = K.center({
    id: 'incid', title: 'الحوادث المدرسية', icon: '🩹', route: 'incidDoc', hubRoute: 'incid', years: () => [],
    groups: [['n', 'التصريح والإشعار والتقرير', 'المذكرة الوزارية 071X19'], ['a', 'الإسعاف والوصولات'], ['f', 'ملف الحادثة والبيانات']],
    intro: 'سجّل الحادثة مرة واحدة في «سجل الحوادث المدرسية» أدناه (التلميذ(ة) من بطاقة التلاميذ، التاريخ، المكان، الظروف، الإصابة، الإسعاف...)، ثم اختر الوثيقة: الإشعار الفوري، التصريح بالحادثة، تقرير المدير، إشعار ولي الأمر، ورقة الاتصال بالإسعاف، الوصل، ورقة إرسال الملف وبيان الحوادث. <span class="muted">المرجع: المذكرة الوزارية 071X19 بتاريخ 04 يوليوز 2019 في شأن تدبير ملفات الحوادث المدرسية وحوادث الشغل والمصلحة.</span>',
    docs: () => DOCS, store: sy => store('years', sy),
    onHub: v => {
      const h = v.querySelector('.page-h');
      h.insertAdjacentHTML('afterend', `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>سجل الحوادث المدرسية</h3><span class="sp"></span><button class="btn pri sm" id="isAdd">${ic('plus')} تسجيل حادثة</button></div><div class="card-b" id="isReg"></div></div>${dl('incPlaces', PLACES)}`);
      const reg = K.crud($('#isReg', v), {
        list: () => IN().school, empty: 'لا توجد حوادث مسجلة. اضغط «تسجيل حادثة».', addTitle: 'تسجيل حادثة مدرسية', editTitle: 'تعديل الحادثة',
        defaults: () => ({ pupil: '', date: Dx.todayIso(), time: '', place: PLACES[1], activity: '', desc: '', injury: '', aid: '', amb: 'no', ambTime: '', hosp: '', escort: '', parent: '', parentPhone: '', witness: '', teacher: '', ins: '', status: 'في طور الإعداد', notes: '' }),
        cols: [{ k: 'pupil', l: 'التلميذ(ة)', list: 'k2Pupils', req: true }, { k: 'date', l: 'التاريخ', t: 'date', req: true }, { k: 'time', l: 'الساعة', dir: 'ltr', hide: true }, { k: 'place', l: 'المكان', list: 'incPlaces' },
          { k: 'activity', l: 'النشاط أثناء الحادثة', hide: true }, { k: 'teacher', l: 'المكلف(ة) بالحراسة / الأستاذ(ة) المسؤول(ة)', list: 'k2Emps', hide: true },
          { k: 'desc', l: 'ظروف الحادثة (وصف دقيق)', t: 'area', full: true, hide: true }, { k: 'injury', l: 'نوع الإصابة' }, { k: 'aid', l: 'الإسعافات الأولية', hide: true },
          { k: 'amb', l: 'الاتصال بالإسعاف', t: 'select', opts: [['no', 'لا'], ['yes', 'نعم']], show: r => (r.amb === 'yes' ? 'نعم' : '—') }, { k: 'ambTime', l: 'ساعة الاتصال بالإسعاف', dir: 'ltr', hide: true }, { k: 'hosp', l: 'وجهة النقل', hide: true }, { k: 'escort', l: 'المرافق(ة)', hide: true },
          { k: 'parent', l: 'ولي الأمر', hide: true }, { k: 'parentPhone', l: 'هاتف ولي الأمر', dir: 'ltr', hide: true }, { k: 'witness', l: 'الشهود', hide: true }, { k: 'ins', l: 'رقم وصل التأمين', hide: true },
          { k: 'status', l: 'وضعية الملف', list: 'incStatus' }, { k: 'notes', l: 'ملاحظات', t: 'area', full: true, hide: true }],
        onChange: () => persist()
      });
      v.insertAdjacentHTML('beforeend', dl('incStatus', ['في طور الإعداد', 'أُرسل إلى المديرية', 'في طور التسوية', 'تمت التسوية']) + dl('incInformed', ['ولي الأمر', 'أسرة المعني(ة)', 'المديرية الإقليمية', 'السلطة المحلية']));
      $('#isAdd', v).onclick = () => reg.add();
    }
  });
  const CS = K.center({
    id: 'svcacc', title: 'حوادث المصلحة', icon: '🚑', route: 'svcAccDoc', hubRoute: 'svcAcc', years: () => [],
    groups: [['n', 'التقرير والتصريح', 'المذكرة الوزارية 071X19'], ['a', 'الإسعاف والوصولات'], ['f', 'الملف والبيانات']],
    intro: 'حادثة المصلحة هي التي يتعرض لها الموظف أثناء أو بمناسبة مزاولة عمله، أو في فترات الذهاب والإياب بين السكن ومقر العمل دون تغيير الاتجاه. سجّل الحادثة مرة واحدة في السجل أدناه، ثم اختر الوثيقة: تقرير عن حادثة مصلحة، التصريح، ورقة الاتصال بالإسعاف، الوصل، ورقة إرسال الملف، طلب استرجاع المصاريف الطبية والبيان السنوي.',
    docs: () => SDOCS, store: sy => store('svYears', sy),
    onHub: v => {
      const h = v.querySelector('.page-h');
      h.insertAdjacentHTML('afterend', `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>سجل حوادث المصلحة</h3><span class="sp"></span><button class="btn pri sm" id="ivAdd">${ic('plus')} تسجيل حادثة</button></div><div class="card-b" id="ivReg"></div></div>`);
      const reg = K.crud($('#ivReg', v), {
        list: () => IN().service, empty: 'لا توجد حوادث مسجلة. اضغط «تسجيل حادثة».', addTitle: 'تسجيل حادثة مصلحة', editTitle: 'تعديل الحادثة',
        defaults: () => ({ emp: '', date: Dx.todayIso(), time: '', place: '', kind: 'حادثة سير في طريق العمل (الذهاب أو الإياب)', vehicle: '', desc: '', injury: '', others: '', aid: '', amb: 'no', hosp: '', escort: '', police: '', witness: '', cert: '', certDays: '', result: '', status: 'في طور الإعداد', notes: '' }),
        cols: [{ k: 'emp', l: 'الموظف(ة)', list: 'k2Emps', req: true }, { k: 'date', l: 'التاريخ', t: 'date', req: true }, { k: 'time', l: 'الساعة', dir: 'ltr', hide: true }, { k: 'place', l: 'المكان' },
          { k: 'kind', l: 'نوع الحادثة', t: 'select', opts: ['حادثة سير في طريق العمل (الذهاب أو الإياب)', 'حادثة داخل مقر العمل', 'حادثة أثناء القيام بمهمة', 'أخرى'] }, { k: 'vehicle', l: 'وسيلة التنقل', hide: true },
          { k: 'desc', l: 'تفاصيل الحادثة', t: 'area', full: true, hide: true }, { k: 'injury', l: 'الإصابات' }, { k: 'others', l: 'مرافقون / مصابون آخرون', hide: true },
          { k: 'amb', l: 'الإسعاف', t: 'select', opts: [['no', 'لا'], ['yes', 'نعم']], show: r => (r.amb === 'yes' ? 'نعم' : '—') }, { k: 'hosp', l: 'وجهة النقل', hide: true }, { k: 'police', l: 'الجهة التي عاينت الحادثة', hide: true }, { k: 'witness', l: 'الشهود', hide: true },
          { k: 'cert', l: 'الشهادة الطبية الأولية', hide: true }, { k: 'certDays', l: 'مدة العجز (أيام)', t: 'num', hide: true }, { k: 'result', l: 'نتائج الفحوصات الأولية', t: 'area', full: true, hide: true },
          { k: 'status', l: 'وضعية الملف', list: 'incStatus' }, { k: 'notes', l: 'ملاحظات', t: 'area', full: true, hide: true }],
        onChange: () => persist()
      });
      v.insertAdjacentHTML('beforeend', dl('incStatus', ['في طور الإعداد', 'أُرسل إلى المديرية', 'عُرض على اللجنة الطبية', 'في طور التسوية', 'تمت التسوية']) + dl('incInformed', ['ولي الأمر', 'أسرة المعني(ة)', 'المديرية الإقليمية', 'السلطة المحلية']));
      $('#ivAdd', v).onclick = () => reg.add();
    }
  });

  window.Incid = { migrate, school: () => IN().school, service: () => IN().service, DOCS: () => DOCS, SDOCS: () => SDOCS };
  window.pageIncid = (v, a) => { migrate(DB); C.hub(v, a); };
  window.pageIncidDoc = (v, a) => { migrate(DB); C.doc(v, a); };
  window.pageSvcAcc = (v, a) => { migrate(DB); CS.hub(v, a); };
  window.pageSvcAccDoc = (v, a) => { migrate(DB); CS.doc(v, a); };
})();
