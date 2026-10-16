'use strict';
/* 1.9.2 — طلب وبعث الملفات (خانة «الوثائق»): مراسلات بين مؤسستين بالصيغة الإدارية الرسمية
   - طلب / بعث ملف ووثائق تلميذ(ة) أو أكثر (شهادة المغادرة)
   - طلب / بعث الملف الإداري والتربوي للأستاذ(ة)، طلب جزء منه، إخبار ببعثه
   الصيغة: «تحت إشراف السيد المدير الإقليمي للأكاديمية الجهوية للتربية والتكوين ... بالمديرية الإقليمية ...»
   سطر واحد إذا كانت المؤسستان من نفس المديرية، وسطران (المرسل ثم المرسل إليه) إذا اختلفت المديريتان.
   window.Letter: مكونات الرسالة الإدارية (مستعملة أيضا في الامتحانات والدعم الممتد). */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { tr, thr } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const nAr = t => nm(t).replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ');

  /* ---------- the regions (academies) and their provincial directorates ---------- */
  const REGIONS = {
    'سوس ماسة': ['أكادير إداوتنان', 'إنزكان آيت ملول', 'اشتوكة آيت باها', 'تارودانت', 'تيزنيت', 'طاطا'],
    'مراكش آسفي': ['مراكش', 'الحوز', 'شيشاوة', 'الصويرة', 'قلعة السراغنة', 'الرحامنة', 'آسفي', 'اليوسفية'],
    'كلميم واد نون': ['كلميم', 'أسا الزاك', 'طانطان', 'سيدي إفني'],
    'العيون الساقية الحمراء': ['العيون', 'بوجدور', 'طرفاية', 'السمارة'],
    'الداخلة وادي الذهب': ['وادي الذهب', 'أوسرد'],
    'درعة تافيلالت': ['الرشيدية', 'ورزازات', 'ميدلت', 'تنغير', 'زاكورة'],
    'الدار البيضاء سطات': ['الدار البيضاء أنفا', 'الفداء مرس السلطان', 'عين السبع الحي المحمدي', 'الحي الحسني', 'عين الشق', 'سيدي البرنوصي', 'مولاي رشيد', 'ابن امسيك', 'المحمدية', 'النواصر', 'مديونة', 'برشيد', 'سطات', 'سيدي بنور', 'الجديدة', 'بنسليمان'],
    'الرباط سلا القنيطرة': ['الرباط', 'سلا', 'الصخيرات تمارة', 'القنيطرة', 'الخميسات', 'سيدي قاسم', 'سيدي سليمان'],
    'فاس مكناس': ['فاس', 'مكناس', 'الحاجب', 'إفران', 'مولاي يعقوب', 'صفرو', 'بولمان', 'تاونات', 'تازة'],
    'بني ملال خنيفرة': ['بني ملال', 'أزيلال', 'الفقيه بن صالح', 'خنيفرة', 'خريبكة'],
    'طنجة تطوان الحسيمة': ['طنجة أصيلة', 'المضيق الفنيدق', 'تطوان', 'الفحص أنجرة', 'العرائش', 'الحسيمة', 'شفشاون', 'وزان'],
    'الشرق': ['وجدة أنكاد', 'الناظور', 'الدريوش', 'جرادة', 'بركان', 'تاوريرت', 'جرسيف', 'فجيج']
  };
  const ALL_DIRS = [].concat(...Object.values(REGIONS));
  const regionOfDir = d => { const k = nAr(d).replace(/^ب|^ل/, ''); for (const [r, L] of Object.entries(REGIONS)) if (L.some(x => nAr(x) === k || nAr(x) === nAr(d))) return r; return ''; };
  const myDir = s => Dx.placeOfDir(s.directorate) || nm(s.directorate);
  const myReg = s => nm(Dx.regionOf(s.academy)).replace(/^جهة\s+/, '') || regionOfDir(myDir(s));
  const sameDir = (a, b) => !!nm(b) && nAr(a).replace(/\s/g, '') === nAr(b).replace(/\s/g, '');
  const ACAD = 'الأكاديمية الجهوية للتربية والتكوين';

  /* ---------- the parts of an administrative letter ---------- */
  // who supervises: one provincial director (same directorate) or the two of them (sender first)
  function supervision(s, f) {
    const d1 = myDir(s), r1 = myReg(s), d2 = nm(f.ddir) || d1, r2 = nm(f.dreg) || regionOfDir(d2) || r1;
    const two = f.supMode === 'two' || (f.supMode !== 'one' && !sameDir(d1, d2));
    const line = (r, d) => `المدير الإقليمي للأكاديمية الجهوية للتربية والتكوين ${r || '..........'} بالمديرية الإقليمية ${d || '..........'}`;
    return two ? [`تحت إشراف السيد ${line(r1, d1)}`, `والسيد ${line(r2, d2)}`] : [`تحت إشراف السيد ${line(r1, d1)}`];
  }
  const LCSS = `
  .lt{font-size:11.6pt;line-height:1.75}
  .lt-top{display:flex;justify-content:space-between;align-items:flex-start;margin:0 0 3mm;font-weight:700}
  /* 1.9.3: the recipient (المرسل إليه) is written BELOW the sender, not on the same level */
  .lt-ft{display:block;margin:0 0 3.5mm;text-align:center}
  .lt-from{margin:0 0 2.6mm}
  .lt-from div,.lt-to div{line-height:1.6}.lt-from .h,.lt-to .h{font-weight:700}
  .lt-to{text-align:center}.lt-sup{font-size:10.4pt;line-height:1.55;margin-top:1mm;font-weight:600}
  .lt-subj{margin:2mm 0 1mm}.lt-subj b{text-decoration:underline;text-underline-offset:1.2mm}
  .lt-ref{margin:0 0 1mm;padding-right:4mm;font-size:10.6pt}
  .lt-salam{text-align:center;font-weight:700;margin:3mm 0 2mm;font-size:12.4pt}
  .lt-body{text-align:justify;margin:0 0 2.5mm;text-indent:8mm}
  .lt .tbl td,.lt .tbl th{height:9mm;font-size:11pt}.lt .tbl th{background:#e9edf5}
  .lt-close{text-align:center;margin:4mm 0 2mm}
  .lt-sign{display:flex;justify-content:flex-end;margin-top:3mm;min-height:28mm}.lt-sign>div{width:75mm;text-align:center;font-weight:700}
  .lt-cc{font-size:9.6pt;margin-top:2mm;line-height:1.6}`;
  Dx.modCss += LCSS;
  // o: { s, f, subject, refs: [..], body, table: {head, rows}, close, sign, noSalam, extra (html after the table) }
  function letterBlocks(o) {
    const s = o.s, f = o.f || {};
    const date = f.date ? K.ldate(f.date) : '....................';
    const d1 = myDir(s), r1 = myReg(s), d2 = nm(f.ddir), r2 = nm(f.dreg) || regionOfDir(d2);
    const two = !sameDir(d1, d2 || d1) || f.supMode === 'two';
    const B = [];
    B.push({ html: `<div class="lt-top"><div>رقـــم الإرسال: <span dir="ltr">${esc(nm(f.no) || '.......')}</span></div><div>${esc(f.city || s.city || '..........')} في: ${esc(date)}</div></div>` });
    const to = o.to || [`إلى السيد: ${esc(nm(f.destTitle) || 'مدير')} ${esc(nm(f.dest) || '....................')}`].concat(d2 ? [`المديرية الإقليمية ${esc(d2)}`] : []).concat(two && r2 && nAr(r2) !== nAr(r1) ? [`${ACAD} لجهة ${esc(r2)}`] : []);
    B.push({ html: `<div class="lt-ft"><div class="lt-from"><div class="h">من مدير: ${esc(s.school || '..........')}</div><div>المديرية الإقليمية ${esc(d1 || '..........')}</div><div>${ACAD} ${esc(r1 || '')}</div></div>
      <div class="lt-to">${to.map((t, i) => `<div class="${i ? '' : 'h'}">${t}</div>`).join('')}${o.noSup ? '' : `<div class="lt-sup">${supervision(s, f).map(esc).join('<br>')}</div>`}</div></div>` });
    B.push({ html: `<div class="lt-subj"><b>الموضــــوع:</b> ${esc(o.subject)}</div>`, keepNext: true });
    (o.refs || []).filter(Boolean).forEach((r, i, a) => B.push({ html: `<div class="lt-ref">${i ? '' : `<b>${a.length > 1 ? 'المراجع' : 'المرجع'}:</b> `}${a.length > 1 ? '- ' : ''}${esc(r)}</div>` }));
    if (!o.noSalam) B.push({ html: '<div class="lt-salam">سلام تام بوجود مولانا الإمام المؤيد بالله</div>' });
    if (o.body) B.push({ html: `<p class="lt-body">${o.body}</p>`, keepNext: !!o.table });
    if (o.table) B.push({ table: { cls: 'lt-t', head: o.table.head, rows: o.table.rows }, minRows: 3 });
    if (o.extra) B.push({ html: o.extra });
    B.push({ html: `<div class="lt-close">${esc(o.close == null ? 'وتقبلوا فائق التقدير والاحترام، والسلام.' : o.close)}</div>` });
    B.push({ html: `<div class="lt-sign"><div>${esc(o.sign || 'توقيع وخاتم رئيس المؤسسة')}</div></div>` });
    if (o.cc) B.push({ html: `<div class="lt-cc">${o.cc}</div>` });
    return B;
  }
  const letterPages = (s, blocks) => MK.flowPages({ page: 'a4', cls: 'lt', head: `<div class="mk-hdr">${Dx.header(s)}</div>`, blocks });
  // fields shared by every letter: number, date, addressee, supervision
  const letterInit = s => ({ no: '', city: s.city || '', date: Dx.todayIso(), destTitle: 'مدير', dest: '', ddir: '', dreg: '', supMode: 'auto' });
  const letterDefs = (dest) => [
    { sec: 'المراسلة' }, { k: 'no', l: 'رقم الإرسال', half: true, ph: 'مثال: 085/26', dir: 'ltr' }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'city', l: 'حرر ب', half: true },
    { sec: dest || 'المؤسسة المرسل إليها' },
    { k: 'destTitle', l: 'إلى السيد', half: true, ph: 'مدير' }, { k: 'dest', l: 'المؤسسة', half: true, ph: 'م/م ... أو مدرسة ...' },
    { k: 'ddir', l: 'المديرية الإقليمية للمؤسسة', half: true, list: 'flDirs', dls: { flDirs: () => ALL_DIRS } }, { k: 'dreg', l: 'الجهة (الأكاديمية)', half: true, list: 'flRegs', dls: { flRegs: () => Object.keys(REGIONS) }, ph: 'تُعرف تلقائيا من المديرية' },
    { k: 'supMode', l: 'صيغة «تحت إشراف»', t: 'select', opts: [['auto', 'تلقائي: مدير إقليمي واحد إذا كانت المؤسستان من نفس المديرية، واثنان إذا اختلفتا'], ['one', 'مدير إقليمي واحد (نفس المديرية)'], ['two', 'المديران الإقليميان (مديريتان مختلفتان)']] },
    { t: 'html', html: f => `<div class="muted" style="font-size:12px;line-height:1.8;background:#f4f7fb;border-radius:6px;padding:6px 9px">${supervision(S(), f).map(esc).join('<br>')}</div>` }];

  /* ---------- people ---------- */
  const pupilOf = name => { const r = K.PP.resolve('pupil', name); return r ? r.rec : null; };
  const empOf = name => K.E.byName(name);
  const isF = name => { const e = empOf(name); if (e) return e.sex === 'F'; return /ة$/.test(nm(name).split(' ')[0]) || /ة$/.test(nm(name).split(' ').pop()); };
  const pupilsWord = (rows, def) => {
    const g = rows.map(r => { const p = pupilOf(r[0]); return p ? p.g : ''; });
    const n = rows.length, f = g.filter(x => x === 'F').length, m = g.filter(x => x === 'M').length;
    if (n <= 1) return { one: true, w: m ? 'تلميذ' : f ? 'تلميذة' : 'تلميذ(ة)', the: m ? 'التلميذ' : f ? 'التلميذة' : 'التلميذ(ة)' };
    if (n === 2) return { w: f === 2 ? 'تلميذتين' : 'تلميذين', the: f === 2 ? 'التلميذتين' : 'التلميذين' };
    return { w: `${n} تلاميذ`, the: 'التلاميذ' };
  };
  const tWord = rows => {
    if (rows.length > 1) return { the: 'الأساتذة', of: 'للأساتذة', fem: false };
    const f = rows[0] && isF(rows[0][0]);
    return { the: f ? 'الأستاذة' : 'الأستاذ', of: f ? 'للأستاذة' : 'للأستاذ', fem: f };
  };

  const DOCS = [];
  const add = d => DOCS.push(d);
  const PUP_COLS = ['الاسم الكامل', 'الرقم الوطني (مسار)', 'تاريخ المغادرة', 'المستوى الدراسي', 'رقم شهادة المغادرة', 'تاريخها', 'المؤسسة المعنية', 'مديريتها'];
  const pupGrid = () => ({ k: 'rows', l: 'التلاميذ (اكتب الاسم أو رقم مسار فتُملأ باقي الخانات) — «المؤسسة المعنية»: المؤسسة الأصلية للوافد أو المستقبلة للمغادر', t: 'grid', cols: PUP_COLS, widths: ['1.4fr', '1fr', '.75fr', '.9fr', '.7fr', '.7fr', '1.2fr', '.8fr'], list: ['k2Pupils', 'k2Codes', null, null, null, null, null, 'flDirs'], dirs: [null, 'ltr', null, null, 'ltr', null, null, null],
    link: { src: 'pupil', n: 0, cols: { code: 1, lvl: 3 }, post: (row, r) => { if (r.rec && r.rec.lvl) row[3] = K.LV.ar(r.rec.lvl); } } });
  const pupTable = (rows, sy) => ({
    head: thr(['ر.ت', 'الاسم الكامل', 'الرقم الوطني', 'تاريخ المغادرة', `المستوى الدراسي ${MK.syDash(sy).replace('-', '/')}`]),
    rows: rows.map((r, i) => tr([i + 1, { t: r[0], c: 'b' }, { t: r[1], st: 'direction:ltr' }, MK.showDate(r[2]), r[3]]))
  });
  const fromMoves = (cat, sy) => (window.Pupils ? Pupils.movesOf(sy, cat) : []).map(m => [`${m.last || ''} ${m.first || ''}`.trim(), m.code || '', MK.showDate(m.date || ''), K.LV.ar(m.lvl), '', '', nm(cat === 'joined' ? m.orig : m.recv), nm(m.odir)]);
  const pupRows = f => (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
  // 1.9.4: one letter for each pupil (addressed to his own school), or the pupils of the same school gathered in one letter, or one letter as typed;
  // «only» prints the letter of one pupil
  const SPLIT = [['pupil', 'مراسلة مستقلة لكل تلميذ(ة) (موجهة إلى مؤسسته)'], ['school', 'تلاميذ نفس المؤسسة في مراسلة واحدة'], ['one', 'مراسلة واحدة لكل التلاميذ (المؤسسة المكتوبة أعلاه)']];
  const splitDefs = f => [{ sec: 'المراسلات' }, { k: 'split', l: 'طريقة الإنجاز', t: 'select', opts: SPLIT, half: true },
    { k: 'only', l: 'الطبع', t: 'select', opts: [['', 'كل المراسلات']].concat(pupRows(f || {}).map(r => [nm(r[1]) || nm(r[0]), `${nm(r[0])}${nm(r[6]) ? ' — ' + nm(r[6]) : ''}`])), half: true }];
  function lettersOf(f) {
    const rows = pupRows(f), mode = f.split || 'pupil';
    let G;
    if (mode === 'one') G = [{ rows, dest: '', ddir: '' }];
    else if (mode === 'school') { G = []; rows.forEach(r => { const k = nm(r[6]) || nm(f.dest); let g = G.find(x => x.k === k); if (!g) G.push(g = { k, rows: [], dest: nm(r[6]), ddir: nm(r[7]) }); g.rows.push(r); }); }
    else G = rows.map(r => ({ rows: [r], dest: nm(r[6]), ddir: nm(r[7]) }));
    if (nm(f.only)) G = G.filter(g => g.rows.some(r => (nm(r[1]) || nm(r[0])) === nm(f.only))).map(g => (mode === 'pupil' ? g : Object.assign({}, g, { rows: g.rows })));
    return (G.length ? G : [{ rows: [], dest: '', ddir: '' }]).map(g => ({ rows: g.rows, f: Object.assign({}, f, g.dest ? { dest: g.dest } : {}, g.ddir ? { ddir: g.ddir, dreg: '' } : {}) }));
  }
  const manyPages = (s, L, one) => { const out = []; L.forEach((x, i) => one(x).forEach((p, j) => out.push(i && !j ? `<div class="docx-pb"></div>${p}` : p))); return out; };

  add({
    k: 'fl_preq', t: 'طلب ملف ووثائق تلميذ(ة)', grp: 'p', d: 'مراسلة المؤسسة الأصلية لطلب الملف المدرسي لتلميذ(ة) أو أكثر التحقوا بالمؤسسة (شهادة المغادرة).', auto: 'بطاقة التلاميذ (الوافدون) ومعطيات المؤسسة', page: 'a4',
    init: s => Object.assign(letterInit(s), { split: 'pupil', only: '', rows: [['', '', '', '', '', '', '', '']] }),
    defs: f => letterDefs('المؤسسة الأصلية للتلميذ(ة) (عند المراسلة الواحدة، أو إذا لم تُكتب في الجدول)').concat(splitDefs(f), [{ sec: 'التلاميذ' }, { t: 'html', html: '<button type="button" class="btn sm" data-act="mv">إضافة الوافدين المسجلين في بطاقة التلاميذ</button>' }, pupGrid()]),
    act: { mv: (f, sy, c) => { const r = fromMoves('joined', sy); if (!r.length) return c.toast('لا يوجد وافدون مسجلون في بطاقة التلاميذ لهذا الموسم', true); f.rows = r; c.save('rows'); } },
    build: (s, f0, sy) => ({ page: 'a4', pages: manyPages(s, lettersOf(f0), ({ rows, f }) => {
      const w = pupilsWord(rows);
      const refs = rows.filter(r => nm(r[4])).map(r => `شهادة المغادرة رقم ${nm(r[4])}${nm(r[5]) ? ' بتاريخ ' + MK.showDate(r[5]) : ''}${rows.length > 1 ? ' (' + nm(r[0]) + ')' : ''}`);
      return letterPages(s, letterBlocks({ s, f, subject: `طلب ملف ووثائق ${w.one && rows[0] ? (w.w === 'تلميذة' ? 'التلميذة' : w.w === 'تلميذ' ? 'التلميذ' : 'التلميذ(ة)') + ' ' + nm(rows[0][0]) : w.w}`, refs,
        body: `وبعد، يشرفني أن ألتمس من سيادتكم موافاتي بملف ووثائق ${w.the} المسجل${w.one ? (w.the === 'التلميذة' ? 'ة' : w.the === 'التلميذ' ? '' : '(ة)') : 'ين'} بمؤسستكم سابقا والملتحق${w.one ? (w.the === 'التلميذة' ? 'ة' : w.the === 'التلميذ' ? '' : '(ة)') : 'ين'} بمؤسستنا:`,
        table: pupTable(rows, sy) }));
    }) })
  });
  add({
    k: 'fl_psend', t: 'بعث ملف ووثائق تلميذ(ة)', grp: 'p', d: 'إرسال الملف المدرسي لتلميذ(ة) أو أكثر غادروا المؤسسة إلى المؤسسة المستقبلة، جوابا على طلبها.', auto: 'بطاقة التلاميذ (المغادرون) ومعطيات المؤسسة', page: 'a4',
    init: s => Object.assign(letterInit(s), { reqDate: '', reqNo: '', split: 'pupil', only: '', rows: [['', '', '', '', '', '', '', '']] }),
    defs: f => letterDefs('المؤسسة المستقبلة للتلميذ(ة) (عند المراسلة الواحدة، أو إذا لم تُكتب في الجدول)').concat([{ sec: 'طلبهم في الموضوع (اختياري)' }, { k: 'reqDate', l: 'بتاريخ', t: 'date', half: true }, { k: 'reqNo', l: 'تحت رقم', half: true, dir: 'ltr' }], splitDefs(f), [
      { sec: 'التلاميذ' }, { t: 'html', html: '<button type="button" class="btn sm" data-act="mv">إضافة المغادرين المسجلين في بطاقة التلاميذ</button>' }, pupGrid()]),
    act: { mv: (f, sy, c) => { const r = fromMoves('left', sy); if (!r.length) return c.toast('لا يوجد مغادرون مسجلون في بطاقة التلاميذ لهذا الموسم', true); f.rows = r; c.save('rows'); } },
    build: (s, f0, sy) => ({ page: 'a4', pages: manyPages(s, lettersOf(f0), ({ rows, f }) => {
      const w = pupilsWord(rows);
      const refs = [f.reqDate || nm(f.reqNo) ? `طلبكم في الموضوع${f.reqDate ? ' بتاريخ ' + K.ldate(f.reqDate) : ''}${nm(f.reqNo) ? ' تحت رقم ' + nm(f.reqNo) : ''}` : ''];
      return letterPages(s, letterBlocks({ s, f, subject: `بعث ملف ووثائق ${w.one && rows[0] ? (w.the === 'التلميذ(ة)' ? 'التلميذ(ة)' : w.the) + ' ' + nm(rows[0][0]) : w.w}`, refs,
        body: `وبعد، يشرفني أن أوافيكم بملف ووثائق ${w.the} المشار إلي${w.one ? (w.the === 'التلميذة' ? 'ها' : w.the === 'التلميذ' ? 'ه' : 'ه(ا)') : 'هم'} في الجدول أسفله:`, table: pupTable(rows, sy) }));
    }) })
  });

  /* ---------- teachers ---------- */
  const T_COLS = ['الاسم الكامل', 'رقم التأجير', 'الإطار', 'ملاحظات'];
  const tGrid = () => ({ k: 'rows', l: 'الأستاذ(ة) — اكتب الاسم فيُملأ رقم التأجير والإطار من لائحة الموظفين', t: 'grid', cols: T_COLS, widths: ['1.4fr', '.8fr', '1.2fr', '1.4fr'], list: ['k2Emps', null, null, null], dirs: [null, 'ltr', null, null], link: { src: 'emp', n: 0, cols: { ppr: 1, cadre: 2 } } });
  const tRows = f => (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
  const tTable = (rows, notes) => {
    const hasN = notes || rows.some(r => nm(r[3]));
    return { head: thr(['الاسم الكامل', 'رقم التأجير', 'الإطار'].concat(hasN ? ['ملاحظات'] : [])), rows: rows.map(r => tr([{ t: r[0], c: 'b' }, { t: r[1] }, { t: r[2] }].concat(hasN ? [{ t: r[3] || '', c: 'sm' }] : []))) };
  };
  const tInit = s => Object.assign(letterInit(s), { ref: '', rows: [['', '', '', '']] });
  const refDef = ph => ({ k: 'ref', l: 'المرجع (اختياري)', ph: ph || 'مثال: نتيجة الحركة الانتقالية الوطنية لأطر هيئة التربية والتعليم لسنة 2026' });
  const kinds = [
    { k: 'fl_treq', t: 'طلب الملف الإداري والتربوي للأستاذ(ة)', d: 'طلب ملف الأستاذ(ة) الملتحق(ة) بالمؤسسة من مؤسسته(ا) السابقة (الحركة الانتقالية، إعادة الانتشار...).',
      subj: w => `طلب الملف الإداري والتربوي ${w.of}`, body: w => `وبعد، يشرفني أن ألتمس من سيادتكم موافاتي بالملف الإداري والتربوي ${w.of}:` },
    { k: 'fl_tpart', t: 'طلب جزء من الملف الإداري والتربوي والاجتماعي', d: 'طلب النسخة الأصلية لجزء من ملف الأستاذ(ة) خلال مدة تكليفه(ا) بمؤسسة أخرى.', notes: 1,
      subj: w => `طلب جزء من الملف الإداري والتربوي والاجتماعي ${w.of}`, body: w => `وبعد، يشرفني أن أطلب منكم موافاتي بالنسخة الأصلية لجزء من الملف التربوي والإداري والاجتماعي ${w.of} المذكور${w.fem ? 'ة' : ''} أسفله خلال مدة ${w.fem ? 'تكليفها' : 'تكليفه'} بمؤسستكم:` },
    { k: 'fl_tsend', t: 'بعث الملف الإداري والتربوي للأستاذ(ة)', d: 'إرسال ملف الأستاذ(ة) المنتقل(ة) إلى مؤسسته(ا) الجديدة.',
      subj: w => `بعث الملف الإداري والتربوي ${w.of}`, body: w => `وبعد، يشرفني أن أوافي سيادتكم بالملف الإداري والتربوي ${w.of}:` },
    { k: 'fl_tinfo', t: 'إخبار ببعث الملف الإداري والتربوي (جواب)', d: 'جواب على مراسلة: إخبار المؤسسة بأن ملف الأستاذ(ة) بُعث سابقا (تاريخ ورقم الإرسال).', sent: 1,
      subj: w => `في شأن بعث الملف الإداري والتربوي ${w.of}`, body: (w, f) => `وبعد، يشرفني أن أخبركم أنني بعثت ملف ${w.the} المشار إلي${w.fem ? 'ها' : 'ه'} في الجدول أسفله بتاريخ ${f.sentDate ? K.ldate(f.sentDate) : '..........'} تحت رقم الإرسال: ${esc(nm(f.sentNo) || '..........')}.` }
  ];
  kinds.forEach(T => add({
    k: T.k, t: T.t, grp: 't', d: T.d, auto: 'لائحة الموظفين ومعطيات المؤسسة', page: 'a4',
    init: (s, sy) => Object.assign(tInit(s), T.notes ? { rows: [['', '', '', `مكلف(ة) بمؤسستكم خلال الموسم الدراسي ${MK.syDash(sy).replace('-', '/')}`]] } : {}, T.sent ? { sentDate: '', sentNo: '', ref2: '' } : {}),
    defs: () => letterDefs().concat([{ sec: 'الأستاذ(ة)' }, tGrid(), refDef(T.sent ? 'مثال: مراسلتكم رقم 75/26 بتاريخ 08/06/2026' : '')]
      .concat(T.sent ? [{ k: 'ref2', l: 'مرجع ثان (اختياري)' }, { k: 'sentDate', l: 'تاريخ البعث السابق', t: 'date', half: true }, { k: 'sentNo', l: 'رقم الإرسال السابق', half: true, dir: 'ltr' }] : [])),
    build: (s, f) => {
      const rows = tRows(f), w = tWord(rows.length ? rows : [['']]);
      return { page: 'a4', pages: letterPages(s, letterBlocks({ s, f, subject: T.subj(w) + (rows.length === 1 && nm(rows[0][0]) ? ' ' + nm(rows[0][0]) : ''), refs: [nm(f.ref), nm(f.ref2)],
        body: T.body(w, f), table: tTable(rows.length ? rows : [['', '', '', '']], T.notes) })) };
    }
  }));

  /* ---------- store & pages ---------- */
  function migrate(db) { const o = db.files = db.files || {}; o.years = o.years && typeof o.years === 'object' ? o.years : {}; }
  const store = sy => { migrate(DB); const y = DB.files.years; return y[sy] || (y[sy] = {}); };
  let C = null;
  const center = () => C || (C = K.center({
    id: 'files', title: 'طلب وبعث الملفات', icon: '📨', route: 'filesDoc', hubRoute: 'documents', docLabel: 'المراسلة',
    groups: [['p', 'ملفات التلاميذ'], ['t', 'ملفات الأساتذة']], docs: () => DOCS, store, years: () => Object.keys(store && DB.files ? DB.files.years : {})
  }));
  window.Letter = { blocks: letterBlocks, pages: letterPages, init: letterInit, defs: letterDefs, supervision, REGIONS, regionOfDir, myDir, myReg };
  window.Files = { migrate, DOCS: () => DOCS };
  window.pageFilesDoc = (v, a) => { migrate(DB); center().doc(v, a); };
})();
