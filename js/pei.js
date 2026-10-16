'use strict';
/* 1.9.4 — مشروع المؤسسة المندمج (as in Massar «مشروع المؤسسة المندمج»):
   إعداد المشروع: فريق القيادة، التقييم الذاتي، متابعة التقييم الذاتي، المؤشرات الإستراتيجية، التقييم الذاتي وخطة العمل (استيراد / تصدير مع مسار)،
   خطة العمل (ملء ذكي ومراقب بنفس قواعد ملف مسار)، وثيقة الميزانية، وثيقة خطة العمل؛
   الإطلاع على المشروع المصادق عليه: تتبع المشروع، تتبع معايير المشروع وخطط العمل؛ المحاضر.
   Massar files: ExportAutoEvaluationLabelisation (sheet EvaluationLabilisation) and ExportPlanActionLabelisation (sheet PlanActionLabelisation).
   They are given back to Massar as they came, with only the cells of the school written in place (the hidden ids, lists, formulas and
   protection are kept): answers + ResponseId, comment, operations + ActionId; priority, amounts, contributor, domain, line, type, dates
   + the matching ids of Massar (an id that is not known for sure is left empty, as in a file filled by hand in Excel). */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { SB, tr, thr } = window.K;
  const SEED = window.PEI_SEED || { axes: [], pa: { prio: ['1', '2', '3'], contrib: [], doms: [], types: [] }, ids: {} };

  /* ---------- small helpers ---------- */
  const norm = s => String(s == null ? '' : s).replace(/[ ‏‎\t\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
  const loose = s => norm(s).replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه').replace(/[ًٌٍَُِّْـ]/g, '');
  const num = v => { if (v === '' || v == null) return null; const n = +String(v).replace(/\s/g, '').replace(',', '.'); return isFinite(n) ? n : null; };
  const N = v => num(v) || 0;
  const money = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US').replace(/,/g, ' ');
  const dh = n => `${money(n)} د`;
  const syl = sy => MK.syDash(sy).replace('-', '/');
  const pc = (a, b) => (b ? Math.round(a / b * 100) : 0);
  // Excel serial date <-> ISO date
  const EPOCH = Date.UTC(1899, 11, 30);
  const isoOf = v => {
    if (v == null || v === '') return '';
    const s = String(v).trim();
    let m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(s); if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`;
    if (/^\d+(\.\d+)?$/.test(s)) { const d = new Date(EPOCH + Math.floor(+s) * 864e5); return d.toISOString().slice(0, 10); }
    return '';
  };
  const serialOf = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - EPOCH) / 864e5) : null; };
  const dmy = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : ''; };
  const colL = i => { let s = ''; i++; while (i > 0) { const m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; };
  // the category of an answer, from its wording (yes / partly / no)
  const cat = t => { t = norm(t); if (!t) return ''; if (/^(لا|كلا)([\s،,.:]|$)/.test(t)) return 'no'; if (/^(نسبيا|جزئيا|بشكل جزئي|أحيانا|احيانا)/.test(t)) return 'part'; if (/^نعم/.test(t)) return /(لكن|غير|لا يتناسب|ولكن|بعض)/.test(t) ? 'part' : 'yes'; return 'part'; };
  const CAT_L = { yes: 'إيجابي', part: 'جزئي', no: 'سلبي' };

  /* ---------- data ---------- */
  function migrate(db) { db.pei = db.pei || {}; if (!db.pei.years || typeof db.pei.years !== 'object') db.pei.years = {}; if (!db.pei.ids) db.pei.ids = {}; }
  function Y(sy) {
    migrate(DB);
    const y = DB.pei.years[sy] || (DB.pei.years[sy] = {});
    if (!y.ev) y.ev = {}; if (!Array.isArray(y.ops)) y.ops = []; if (!y.ind) y.ind = {}; if (!y.pv) y.pv = {}; if (!y.info) y.info = {}; if (!y.files) y.files = {};
    return y;
  }
  // the referential of the year: the one of the files imported for that year, else the last imported one, else the one of the program
  const REF = sy => { const y = Y(sy); return { axes: y.refAxes || DB.pei.refAxes || SEED.axes, pa: y.refPa || DB.pei.refPa || SEED.pa }; };
  const QC = new WeakMap();
  function QS(sy) {
    const axes = REF(sy).axes;
    if (QC.has(axes)) return QC.get(axes);
    const out = [];
    axes.forEach((a, ai) => (a.c || []).forEach((c, ci) => (c.q || []).forEach(q => out.push(Object.assign({ ax: a.n, cr: c.n, ai, ci }, q)))));
    QC.set(axes, out);
    return out;
  }
  const qOf = (sy, id) => QS(sy).find(q => +q.id === +id) || null;
  const qIdx = sy => { const m = new Map(); QS(sy).forEach((q, i) => m.set(+q.id, i)); return m; };
  const answerOf = (sy, qid) => { const e = Y(sy).ev[qid] || {}, q = qOf(sy, qid); if (e.r && q) { const r = (q.r || []).find(x => +x[0] === +e.r); if (r) return r[2]; } return e.a || ''; };
  const newOp = (qid, t) => ({ id: uid('po'), qid: +qid, aid: '', t: t || '', G: '', H: '', I: '', Ia: true, J: '', K: '', L: '', M: '', N: '', O: '', P: '', st: '', fu: {} });
  const opsOf = (sy, qid) => Y(sy).ops.filter(o => +o.qid === +qid);
  function sortedOps(sy) {
    const ix = qIdx(sy), L = Y(sy).ops;
    return L.map((o, i) => [o, i]).sort((a, b) => ((ix.has(+a[0].qid) ? ix.get(+a[0].qid) : 1e4) - (ix.has(+b[0].qid) ? ix.get(+b[0].qid) : 1e4)) || a[1] - b[1]).map(x => x[0]);
  }
  const opNo = (sy, o) => opsOf(sy, o.qid).indexOf(o) + 1;
  // the place of an operation that is not in the referential (imported from a plan file only)
  const placeOf = (sy, o) => { const q = qOf(sy, o.qid); return q ? { ax: q.ax, cr: q.cr, sub: q.t } : { ax: o.ax || '', cr: o.cr || '', sub: o.sub || '' }; };

  /* ---------- the lists of the action plan (exact strings of Massar) ---------- */
  const PA = sy => REF(sy).pa;
  const domNames = sy => (PA(sy).doms || []).map(d => d[0]);
  const linesOf = (sy, L) => { const d = (PA(sy).doms || []).find(x => norm(x[0]) === norm(L)); return d ? d[1] : []; };
  const exact = (list, v) => (list || []).find(x => norm(x) === norm(v)) || (list || []).find(x => loose(x) === loose(v));
  // an operation entrusted to the directorate / the academy (loose: for the suggestions) — and the exact test of the formula of Massar
  // (SEARCH("المديرية") and SEARCH("الأكاديمية"|"الاكاديمية"): the item «تسند للمديرية…» of the list does not contain «المديرية», so for it too the total amount is required)
  const isDir = j => /مديرية/.test(norm(j)) && /(أكاديمية|اكاديمية)/.test(norm(j));
  const isDirF = j => { const t = String(j == null ? '' : j); return t.includes('المديرية') && (t.includes('الأكاديمية') || t.includes('الاكاديمية')); };
  const PRIO = [['1', 'الأولوية 1 — عمليات درجة أهميتها مرتفعة لا يمكن تأجيلها'], ['2', 'الأولوية 2 — عمليات درجة أهميتها مرتفعة ويمكن تأجيلها'], ['3', 'الأولوية 3 — عمليات يمكن تأجيلها']];
  // ids of Massar for the lists (reference tables, the same for all the schools): the known ones + those learnt from the imported files
  function idOf(k, text, dom) {
    const m = Object.assign({}, (SEED.ids || {})[k] || {}, ((DB.pei && DB.pei.ids) || {})[k] || {});
    return m[k === 'cib' ? norm(dom) + '|' + norm(text) : norm(text)];
  }
  function learnIds(rows, C) {
    const L = DB.pei.ids;
    const put = (k, key, v) => { if (!key || v === '' || v == null || !isFinite(+v)) return; (L[k] = L[k] || {})[key] = +v; };
    rows.forEach(r => {
      if (!r || !String(r[C.aid] || '').trim()) return;
      put('prio', norm(r[C.G]), r[C.V]); put('contrib', norm(r[C.J]), r[C.W]); put('dom', norm(r[C.L]), r[C.X]); put('type', norm(r[C.N]), r[C.Z]);
      if (norm(r[C.L]) && norm(r[C.M])) put('cib', norm(r[C.L]) + '|' + norm(r[C.M]), r[C.Y]);
    });
  }

  /* ---------- the rule of Massar for the amounts (column BudgetValidation of the file) + the other checks ---------- */
  function check(sy, o) {
    const E = [], W = [];
    const H = num(o.H), I = num(o.I), K = num(o.K), J = norm(o.J), e = v => v === '' || v == null;
    if (!norm(o.t)) E.push('نص العملية فارغ');
    const dirOnly = isDirF(o.J) && e(o.H) && e(o.I) && e(o.K);
    const okAmt = dirOnly || (H != null && H > 0 && (e(o.I) || (I != null && I >= 0)) && (e(o.K) || (K != null && K >= 0)) && N(I) + N(K) <= H && (N(K) === 0 || !!J));
    if (!okAmt) {
      if (H == null || H <= 0) E.push(isDir(J) ? 'المبلغ الإجمالي (الكلفة التقديرية) مطلوب ويجب أن يكون أكبر من 0، حتى للعملية التي تسند للمديرية الإقليمية أو الأكاديمية (ميزانية الجمعية يمكن أن تكون 0)' : 'المبلغ الإجمالي مطلوب ويجب أن يكون أكبر من 0');
      else if (N(I) + N(K) > H) E.push(`ميزانية جمعية النجاح + قيمة المساهمة (${money(N(I) + N(K))}) تتجاوز المبلغ الإجمالي (${money(H)})`);
      else if (N(K) > 0 && !J) E.push('حدد جهة المساهمة في التمويل أو الإنجاز');
      else E.push('المبالغ غير مقبولة في مسار');
    }
    if (!o.G) E.push('الأولوية غير محددة');
    if (!norm(o.L)) E.push('مجال الصرف غير محدد');
    else if (!exact(domNames(sy), o.L)) E.push('مجال الصرف غير موجود في لائحة مسار');
    if (!norm(o.M)) E.push('سطر الصرف غير محدد');
    else if (norm(o.L) && !exact(linesOf(sy, exact(domNames(sy), o.L) || o.L), o.M)) E.push('سطر الصرف لا ينتمي إلى مجال الصرف المختار');
    if (J && !exact(PA(sy).contrib, J)) E.push('جهة المساهمة غير موجودة في لائحة مسار');
    if (!norm(o.N) && !dirOnly) W.push('نوع المساهمة غير محدد (مالية / عينية)');
    if (o.O && o.P && o.O > o.P) E.push('تاريخ البداية بعد تاريخ النهاية');
    if (!o.O || !o.P) W.push('تاريخ البداية أو النهاية غير محدد');
    if (H > 0 && !J && N(I) < H && okAmt) W.push(`جزء من المبلغ (${money(H - N(I))}) دون تمويل: حدد جهة المساهمة أو عدّل ميزانية جمعية النجاح`);
    if (J && N(K) === 0 && !isDir(J) && H > 0 && N(I) >= H) W.push('جهة مساهمة دون قيمة مساهمة');
    return { E, W, ok: !E.length };
  }

  /* ---------- smart filling: domain and line of spending from the wording of the operation ---------- */
  const R_EQ = /(تجهيزات|التجهيزات|معدات|المعدات|الأثاث|الاثاث|مكبر|مسلاط|طابع|حاسوب|كاميرا|كاميرات|الأبواب|الابواب|أبواب|ابواب|النوافذ|نوافذ|شبابيك|الأقفال|الاقفال)/;
  const ACQ = /^(اقتناء|شراء)/;
  const RULES = [
    [/(صيانة|إصلاح|اصلاح|ترميم|صباغة|طلاء|تبليط|تهيئة|التشققات|تشققات|الشقوق|التصدعات|السور|سور|المرافق الصحية|المراحيض|الشبكة الكهربائية|السباكة|أبواب|ابواب|شبابيك|بناء|سقيفة)/, /صيانة وإصلاح/,
      t => /(تزيين|جداري|التشوير|تشوير|اليافطات|لافتات|تركيب)/.test(t) ? /تركيب/ : R_EQ.test(t) ? /صيانة وإصلاح تجهيزات/ : /البنيات المادية/, ACQ],
    [/(تزيين|جداري|التشوير|تشوير|اليافطات|لافتات|تركيب)/, /صيانة وإصلاح/, /تركيب/, /(مسلاط|مكبر|الصوت|طابع|حاسوب|سبورة)/],
    [/(جوائز|جائزة|المتفوقين|المتميزين|التميز|الأولمبياد|الاولمبياد|المبدعين|الإبداع|الابداع|الابتكار)/, /التميز/, t => /(حفل|استقبال)/.test(t) ? /الحفلات/ : /(طبع|نسخ)/.test(t) ? /الطبع/ : /الجوائز/],
    [/(طابع|حاسوب|حواسيب|معلومات|مسلاط|عاكس|الإنترنت|الانترنت|سبورة تفاعلية)/, /^التجهيزات/, /معلوماتية/],
    [/(مكبر|مكبرات|الصوت|سمعي|بصري|شاشة|تلفاز)/, /^التجهيزات/, /سمعية/],
    [/(الإسعاف|الاسعاف|إسعافات|اسعافات|الاسعابات|الإسعافات|الاسعافات)/, /^التجهيزات/, /طبية/],
    [/(مكتبة|المكتبات|رفوف|الرفوف|خزانة|خزانات|مكاتب|طاولات|كراسي|أثاث|الأثاث|الاثاث|ستائر|سبورات)/, /^التجهيزات/, /مكتبي/],
    [/(تكييف|مكيف|مروح|مدفأة|المدافئ|التدفئة|تدفئة)/, /^التجهيزات/, /تكييف/],
    [/(موسيق)/, /^التجهيزات/, /موسيقية/],
    [/(بستن|المساحات الخضراء|الأشجار|غرس|حديقة|البستان)/, /^التجهيزات/, /البستنة/],
    [/(الوسائل التعليمية|وسائل تعليمية|ديداكتيك|العدة|لوازم الأنشطة|الرياضية|البدنية|ألعاب)/, /^التجهيزات/, /ديداكتيكية/],
    [/(اقتناء|شراء|توفير)\s.*(المعدات|معدات|التجهيزات|تجهيزات|عتاد)/, /^التجهيزات/, /ديداكتيكية/],
    [/(تكوين|تكوينية|ورشة|ورشات)/, /التدبير والشراكة/, /التكوين/],
    [/(اتفاقية|اتفاقيات)/, /التدبير والشراكة/, /التنبر/],
    [/(تنظيف|النظافة|المواد|مواد|لوازم مكتبية|استهلاك|حاويات|مداد|أوراق|الورق)/, /التدبير والشراكة/, /عتاد صغير/],
    [/(الإنصات|الانصات|الوساطة|النفسي|نفسية)/, /الدعم النفسي/, t => /(طبيب|الأطباء)/.test(t) ? /الأطباء/ : /مطبوعات/],
    [/(نظارات|النظارات|البصر|طبية|الطبية|فحوصات|فحص|الصحية|النقل المدرسي|الإطعام|الاطعام|محافظ|أدوات مدرسية|الأدوات المدرسية|الاجتماعي|اجتماعي)/, /الدعم الاجتماعي/,
      t => /(طبيب|الأطباء)/.test(t) ? /الأطباء/ : /النقل المدرسي/.test(t) ? /النقل المدرسي/ : /تنقل/.test(t) ? /التنقل/ : /اللوازم الطبية/],
    [/(التوجيه)/, /التوجيه/, /مطبوعات/],
    [/(احتفال|حفل|الأيام الوطنية|تظاهرة|تظاهرات|مهرجان|الأعياد|عيد|المناسبات)/, /التظاهرات/, /الحفلات/],
    [/(الدعم التربوي|التعثر|الدعم المكثف|القراءة|الأنشطة الاعتيادية|معالجة|الدعم)/, /الدعم التربوي/, t => /(ساعات|تعويض)/.test(t) ? /تعويضات/ : /(وثائق|كتب|كراسات|قصص)/.test(t) ? /وثائق/ : /مطبوعات/],
    [/(النادي|الأندية|نادي|أندية|الحياة المدرسية|الموازية)/, /الأندية/, t => /(تنقل|رحلة|خرجة|خرجات)/.test(t) ? /التنقل/ : /(حفل|استقبال)/.test(t) ? /الحفلات/ : /(ألبسة|بذل|أقمصة|لباس)/.test(t) ? /الألبسة/ : /(وثائق|كتب)/.test(t) ? /وثائق/ : /مطبوعات/],
    [/(لقاء|لقاءات|اجتماع|اجتماعات|مجالس|التواصل|تواصلية|الأبواب المفتوحة|مسار|الشراكة|شراكة|مخطط|برنامج)/, /التدبير والشراكة/, /مطبوعات/],
    [/(طوارئ|الطوارئ|أزمة|الأزمات|غير متوقعة|استثنائية)/, /استثنائية/, /./],
    [/(اقتناء|شراء)/, /^التجهيزات/, /مكتبي/]
  ];
  function suggest(sy, o) {
    const doms = domNames(sy), t = norm(o.t);
    const pickD = re => doms.find(n => re.test(norm(n)));
    const pickL = (d, re) => linesOf(sy, d).find(l => re.test(norm(l)));
    if (isDir(o.J)) { const d = pickD(/خاص بالأكاديمية/); const l = d && pickL(d, /خاص بالأكاديمية/); if (d && l) return { L: d, M: l }; }
    for (const [re, dre, lre, not] of RULES) {
      if (!re.test(t) || (not && not.test(t))) continue;
      const d = pickD(dre); if (!d) continue;
      const l = pickL(d, typeof lre === 'function' ? lre(t) : lre) || linesOf(sy, d)[0];
      if (l) return { L: d, M: l };
    }
    return null;
  }
  const prioOf = (sy, o) => ({ no: '1', part: '2', yes: '3' })[cat(answerOf(sy, o.qid))] || '1';
  const defDates = sy => { const y1 = MK.syStart(sy); return { O: `${y1}-09-01`, P: `${y1 + 1}-06-30` }; };
  // fill what is empty, never what was entered
  function smartFill(sy, o, what) {
    let n = 0; const set = (k, v) => { if (v != null && v !== '' && (o[k] === '' || o[k] == null)) { o[k] = v; n++; } };
    if (!what || what.prio) set('G', prioOf(sy, o));
    if (!what || what.dom) { const s = !norm(o.L) || !norm(o.M) ? suggest(sy, o) : null; if (s) { if (!norm(o.L)) { o.L = s.L; n++; } if (!norm(o.M) && norm(o.L) === norm(s.L)) { o.M = s.M; n++; } } }
    if (!what || what.type) { if (!norm(o.N) && (N(o.H) > 0 || !isDir(o.J))) set('N', exact(PA(sy).types, 'مالية') || ' مالية'); }
    if (!what || what.dates) { const d = defDates(sy); set('O', d.O); set('P', d.P); }
    if ((!what || what.amt) && o.Ia !== false && N(o.H) > 0 && (o.I === '' || o.I == null)) { o.I = isDir(o.J) ? '0' : String(Math.max(0, N(o.H) - N(o.K))); n++; }
    return n;
  }
  // amounts: the budget of the association follows the total minus the contribution, until it is typed by hand
  function onAmount(o, f) {
    if (f === 'I') { if (o.I !== '') { o.Ia = false; return; } o.Ia = true; }
    // an operation entrusted to the directorate / academy: nothing from the budget of the association, unless typed
    if (o.Ia !== false && (f === 'H' || f === 'K' || f === 'J' || f === 'I')) { const H = num(o.H); o.I = H == null ? '' : isDir(o.J) ? '0' : String(Math.max(0, H - N(o.K))); }
  }
  // the budget of the association brought within the envelope: priority 3 is reduced first, then 2, then 1 (steps of 50 DH)
  function fitPlan(sy, env, apply) {
    const ops = Y(sy).ops.filter(o => N(o.I) > 0), step = 50;
    const tot = ops.reduce((a, o) => a + N(o.I), 0);
    let over = tot - env; const out = new Map();
    if (!(env > 0) || over <= 0) return { tot, after: tot, n: 0 };
    for (const p of ['', '3', '2', '1']) {
      if (over <= 0) break;
      const grp = ops.filter(o => String(o.G || '') === p); const g = grp.reduce((a, o) => a + N(o.I), 0); if (!g) continue;
      const k = Math.min(1, over / g);
      let removed = 0;
      grp.forEach(o => { const old = N(o.I); let ni = Math.floor(old * (1 - k) / step) * step; if (ni < step && old >= step) ni = step; if (ni > old) ni = old; out.set(o, ni); removed += old - ni; });
      over -= removed;
    }
    // what was cut beyond the need (rounding) is given back by steps of 50 to the operations of the first priorities
    if (over < 0) {
      const order = Array.from(out.keys()).sort((a, b) => String(a.G || '9').localeCompare(String(b.G || '9')) || N(b.I) - N(a.I));
      let room = -over;
      for (const o of order) { while (room >= step && out.get(o) + step <= N(o.I)) { out.set(o, out.get(o) + step); room -= step; } if (room < step) break; }
      over = -room;
    }
    const after = tot - Array.from(out.entries()).reduce((a, [o, ni]) => a + N(o.I) - ni, 0);
    let n = 0;
    if (apply) out.forEach((ni, o) => { const d = N(o.I) - ni; if (!d) return; o.I = String(ni); o.Ia = false; o.H = String(Math.max(0, N(o.H) - d)); n++; });
    else out.forEach((ni, o) => { if (N(o.I) !== ni) n++; });
    return { tot, after, n };
  }
  const totals = sy => {
    const T = { H: 0, I: 0, K: 0, ops: 0, err: 0, warn: 0, by: {} };
    Y(sy).ops.forEach(o => { T.ops++; T.H += N(o.H); T.I += N(o.I); T.K += N(o.K); const c = check(sy, o); if (!c.ok) T.err++; else if (c.W.length) T.warn++; const j = norm(o.J); if (j) T.by[j] = (T.by[j] || 0) + N(o.K); });
    return T;
  };

  /* ---------- Massar files: reading ---------- */
  const hdrRow = (rows, word) => { for (let i = 0; i < Math.min(rows.length, 60); i++) if ((rows[i] || []).some(c => norm(c) === word)) return i; return -1; };
  const metaOf = rows => {
    const m = {}, near = (re) => { for (const r of rows.slice(0, 20)) for (let j = 0; j < (r || []).length; j++) if (re.test(norm(r[j]))) { for (let k = j + 1; k < r.length; k++) if (norm(r[k])) return norm(r[k]); } return ''; };
    m.code = near(/^رمز المؤسسة/); m.year = near(/^السنة الدراسية/); m.school = near(/^اسم المؤسسة/); m.dir = near(/^المديرية الإقليمية/); m.acad = near(/^الأكاديمية الجهوية/); m.commune = near(/^الجماعة/);
    return m;
  };
  function parseEvalFile(f) {
    const sh = (f.sheets || []).find(s => { const h = hdrRow(s.rows || [], 'QuestionId'); return h >= 0 && (s.rows[h] || []).some(c => norm(c) === 'ResponseId'); });
    if (!sh) return null;
    const rows = sh.rows, h = hdrRow(rows, 'QuestionId'), H = rows[h].map(norm);
    const fi = re => H.findIndex(x => re.test(x));
    const C = { ax: fi(/^المحاور/), cr: fi(/^المعايير$/), sub: fi(/المعايير الفرعية/), ans: fi(/^الأجوبة/), com: fi(/^تعليق/), q: H.indexOf('QuestionId'), r: H.indexOf('ResponseId'), ops: [], aid: [] };
    for (let k = 1; k <= 10; k++) { C.ops.push(H.findIndex(x => x.replace(/\s/g, '') === 'العملية' + k)); C.aid.push(H.indexOf('ActionId' + k)); }
    // referential of the answers (hidden sheet)
    const R = {};
    const rs = (f.sheets || []).find(s => { const r0 = (s.rows || [])[0] || []; return norm(r0[0]) === 'QuestionId' && r0.map(norm).includes('ResponseId'); });
    if (rs) { const r0 = rs.rows[0].map(norm), cQ = 0, cR = r0.indexOf('ResponseId'), cS = r0.indexOf('Score'), cD = r0.indexOf('Dropdown'), cA = r0.indexOf('Reponse Ar');
      rs.rows.slice(1).forEach(r => { const q = +num((r || [])[cQ]); if (!q) return; const t = cD >= 0 && String(r[cD] || '') !== '' ? String(r[cD]) : String(r[cA] || ''); (R[q] = R[q] || []).push([+num(r[cR]), +num(r[cS]) || 0, t]); }); }
    const axes = [], items = []; let ax = null, cr = null;
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || [], qid = num(r[C.q]); if (!qid) continue;
      if (norm(r[C.ax])) { ax = { n: String(r[C.ax]), c: [] }; axes.push(ax); }
      if (!ax) { ax = { n: '', c: [] }; axes.push(ax); }
      if (norm(r[C.cr]) || !cr) { cr = { n: String(r[C.cr] || ''), q: [] }; ax.c.push(cr); }
      cr.q.push({ id: qid, t: String(r[C.sub] || ''), r: R[qid] || [] });
      const ops = [], slots = [];
      C.ops.forEach((c, k) => { const raw = c >= 0 ? String(r[c] == null ? '' : r[c]) : ''; const aid = C.aid[k] >= 0 ? num(r[C.aid[k]]) : null; slots.push([raw, aid ? String(aid) : '']); const t = norm(raw).replace(/^العملية\s*\d+\s*[:：]\s*/, ''); if (t) ops.push({ t, aid: aid ? String(aid) : '' }); });
      items.push({ row: i + 1, qid, rid: num(r[C.r]) || '', ans: String(r[C.ans] == null ? '' : r[C.ans]), com: String(r[C.com] == null ? '' : r[C.com]), ops, slots });
    }
    if (!items.length) return null;
    return { kind: 'ev', sheet: sh.name, axes, items, meta: metaOf(rows), C: { ans: colL(C.ans), com: colL(C.com), r: colL(C.r), ops: C.ops.map(c => (c >= 0 ? colL(c) : '')), aid: C.aid.map(c => (c >= 0 ? colL(c) : '')) } };
  }
  const PCOLS = { ax: 'المحور', cr: 'المعيار', sub: 'السؤال / المعيار الفرعي', ev: 'التقييم', no: 'رقم العملية', t: 'العملية', G: 'الأولوية', H: 'المبلغ الإجمالي بالدرهم', I: 'ميزانية جمعية دعم مدرسة النجاح', J: 'جهة المساهمة في التمويل أو الإنجاز', K: 'قيمة المساهمة', L: 'مجالات الصرف', M: 'أسطر الصرف', N: 'نوع المساهمة', O: 'تاريخ البداية', P: 'تاريخ النهاية', st: 'وضعية العملية', msg: 'رسالة الرفض',
    eq: 'EvaluationQuestionId', aid: 'ActionId', q: 'QuestionId', V: 'PrioriteId', W: 'ContributionId', X: 'DomaineSoutienId', Y: 'DomaineCibleId', Z: 'TypeContributionId', AA: 'StatutId' };
  const PFIX = { ax: 0, cr: 1, sub: 2, ev: 3, no: 4, t: 5, G: 6, H: 7, I: 8, J: 9, K: 10, L: 11, M: 12, N: 13, O: 14, P: 15, st: 16, msg: 17, eq: 18, aid: 19, q: 20, V: 21, W: 22, X: 23, Y: 24, Z: 25, AA: 26 };
  function parsePlanFile(f) {
    const sh = (f.sheets || []).find(s => { const h = hdrRow(s.rows || [], 'ActionId'); return h >= 0 && (s.rows[h] || []).some(c => norm(c) === 'DomaineCibleId'); });
    if (!sh) return null;
    const rows = sh.rows, h = hdrRow(rows, 'ActionId'), H = rows[h].map(norm);
    const C = {};
    Object.entries(PCOLS).forEach(([k, n]) => { const i = H.findIndex(x => x === n || x.replace(/\s/g, '') === n.replace(/\s/g, '')); C[k] = i >= 0 ? i : PFIX[k]; });
    // the lists (hidden sheets)
    const shOf = n => (f.sheets || []).find(s => s.name === n);
    const col0 = n => { const s = shOf(n); return s ? (s.rows || []).map(r => (r || [])[0]).filter(x => x !== '' && x != null).map(String) : null; };
    let pa = null;
    const cib = col0('RefDomainesCible'), ds = shOf('RefDomainesSoutien');
    if (cib && ds) {
      const doms = (ds.rows || []).filter(r => r && norm(r[0])).map(r => { const m = /\$A\$(\d+):\$A\$(\d+)/.exec(String(r[1] || '')); return [String(r[0]), m ? cib.slice(+m[1] - 1, +m[2]) : []]; });
      pa = { prio: col0('RefPriorites') || ['1', '2', '3'], contrib: col0('RefContributions') || [], doms, types: col0('RefTypesContribution') || [] };
    }
    const items = []; let ax = '', cr = '', sub = '', ev = '';
    for (let i = h + 1; i < rows.length; i++) {
      const r = rows[i] || [];
      if (norm(r[C.ax])) ax = String(r[C.ax]); if (norm(r[C.cr])) cr = String(r[C.cr]);
      if (norm(r[C.sub])) { sub = String(r[C.sub]); ev = String(r[C.ev] || ''); }
      const aid = num(r[C.aid]); if (!aid) continue;
      const g = k => (r[C[k]] == null ? '' : String(r[C[k]]));
      items.push({ row: i + 1, aid: String(aid), qid: num(r[C.q]) || '', eq: g('eq'), ax, cr, sub, ev, no: g('no'), t: norm(g('t')), G: norm(g('G')), H: num(g('H')) == null ? '' : String(num(g('H'))), I: num(g('I')) == null ? '' : String(num(g('I'))), J: g('J'), K: num(g('K')) == null ? '' : String(num(g('K'))),
        L: g('L'), M: g('M'), N: g('N'), O: isoOf(g('O')), P: isoOf(g('P')), st: norm(g('st')), msg: norm(g('msg')), ids: { V: g('V'), W: g('W'), X: g('X'), Y: g('Y'), Z: g('Z') } });
    }
    if (!items.length && !pa) return null;
    return { kind: 'pa', sheet: sh.name, items, pa, meta: metaOf(rows), rows: rows.slice(h + 1), C, cols: Object.fromEntries(Object.entries(C).map(([k, i]) => [k, colL(i)])) };
  }

  /* ---------- importing ---------- */
  async function importFiles(sy, want, re) {
    if (!window.api.openTables) return toast('الاستيراد غير متوفر في هذه النسخة', true);
    const res = await window.api.openTables();
    if (!res || !res.files) return;
    const y = Y(sy); let nE = 0, nP = 0; const msgs = [], wrong = [];
    for (const f of res.files) {
      const pe = parseEvalFile(f), pp = pe ? null : parsePlanFile(f);
      if (pe && want !== 'pa') { applyEval(sy, pe, f); nE++; msgs.push(`التقييم الذاتي: ${pe.items.length} معيارا فرعيا، ${pe.items.filter(x => x.rid).length} جوابا، ${pe.items.reduce((a, x) => a + x.ops.length, 0)} عملية`); if (pe.meta.year && pe.meta.year.replace(/\s/g, '') !== sy) msgs.push(`تنبيه: الملف يخص الموسم ${pe.meta.year}`); }
      else if (pp && want !== 'ev') { const r = applyPlan(sy, pp, f); nP++; msgs.push(`خطة العمل: ${pp.items.length} عملية (${r.matched} مطابقة، ${r.added} جديدة)`); if (pp.meta.year && pp.meta.year.replace(/\s/g, '') !== sy) msgs.push(`تنبيه: الملف يخص الموسم ${pp.meta.year}`); }
      else wrong.push(f.name);
    }
    if (!nE && !nP) return toast(want === 'ev' ? 'لم يتم العثور على ملف التقييم الذاتي. صدّره من مسار: مشروع المؤسسة المندمج ← التقييم الذاتي – استيراد / تصدير ← تصدير (ExportAutoEvaluationLabelisation).' : want === 'pa' ? 'لم يتم العثور على ملف خطة العمل. صدّره من مسار: مشروع المؤسسة المندمج ← خطة العمل – استيراد / تصدير ← تصدير (ExportPlanActionLabelisation).' : 'الملفات المختارة ليست من ملفات مشروع المؤسسة المندمج المصدرة من مسار.', true);
    persist(); re && re();
    toast(msgs.join(' — ') + (wrong.length ? ` — ملفات غير معنية: ${wrong.length}` : ''));
  }
  function keepFile(y, k, f, p) { y.files[k] = { name: f.name, b64: f.b64 || '', sheet: p.sheet, at: Dx.todayIso(), meta: p.meta, cols: p.C || p.cols }; }
  function applyEval(sy, p, f) {
    const y = Y(sy);
    y.refAxes = p.axes; DB.pei.refAxes = p.axes;
    keepFile(y, 'ev', f, p);
    y.files.ev.rows = p.items.map(it => [it.qid, it.row]);
    y.files.ev.cols = p.C;
    y.files.ev.orig = Object.fromEntries(p.items.map(it => [it.qid, { r: it.rid || '', c: it.com, slots: it.slots }]));
    p.items.forEach(it => {
      const q = qOf(sy, it.qid), e = y.ev[it.qid] = y.ev[it.qid] || {};
      // the answer of Massar is its ResponseId (a text without id is kept as it is, and given back unchanged unless it is changed here)
      e.r = it.rid ? +it.rid : ''; e.a = it.ans; e.c = it.com; delete e.u;
      void q;
      // the operations: matched by their ActionId, then by their wording; those of the file come in the order of the file
      const mine = opsOf(sy, it.qid), used = new Set();
      it.ops.forEach(x => {
        let o = (x.aid && mine.find(m => m.aid === x.aid)) || mine.find(m => !used.has(m) && !m.aid && loose(m.t) === loose(x.t));
        if (!o) { o = newOp(it.qid, x.t); y.ops.push(o); }
        used.add(o); o.t = x.t; if (x.aid) o.aid = x.aid;
      });
      // operations of the program that the file does not have any more (removed in Massar): removed if they came from Massar
      mine.filter(m => !used.has(m) && m.aid).forEach(m => { y.ops.splice(y.ops.indexOf(m), 1); });
    });
  }
  function applyPlan(sy, p, f) {
    const y = Y(sy); let matched = 0, added = 0;
    if (p.pa) { y.refPa = p.pa; DB.pei.refPa = p.pa; }
    learnIds(p.rows, p.C);
    keepFile(y, 'pa', f, p);
    y.files.pa.rows = p.items.map(it => [it.aid, it.row]);
    y.files.pa.cols = p.cols;
    y.files.pa.orig = Object.fromEntries(p.items.map(it => [it.aid, { t: it.t, G: it.G, H: it.H, I: it.I, J: norm(it.J), K: it.K, L: norm(it.L), M: norm(it.M), N: norm(it.N), O: it.O, P: it.P, ids: it.ids }]));
    p.items.forEach(it => {
      let o = y.ops.find(m => m.aid === it.aid) || y.ops.find(m => !m.aid && +m.qid === +it.qid && loose(m.t) === loose(it.t));
      if (o) matched++; else { o = newOp(it.qid || 0, it.t); y.ops.push(o); added++; }
      o.aid = it.aid; if (it.t) o.t = it.t;
      if (!qOf(sy, o.qid)) { o.ax = it.ax; o.cr = it.cr; o.sub = it.sub; }
      if (it.ev && !(y.ev[o.qid] && (y.ev[o.qid].r || y.ev[o.qid].a))) { const q = qOf(sy, o.qid), rr = q && (q.r || []).find(x => norm(x[2]) === norm(it.ev)); y.ev[o.qid] = Object.assign(y.ev[o.qid] || {}, { r: rr ? rr[0] : '', a: it.ev }); }
      ['G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].forEach(k => { o[k] = it[k]; });
      o.Ia = o.I === '' ? !(num(o.H) > 0) : N(o.I) === Math.max(0, N(o.H) - N(o.K));
      o.st = it.st; o.msg = it.msg;
    });
    return { matched, added };
  }

  /* ---------- exporting (the original file written in place) ---------- */
  // only what differs from the file of Massar is written (the rest of the file stays byte for byte as Massar made it)
  function evalCells(sy) {
    const y = Y(sy), F = y.files.ev; if (!F || !F.b64) return null;
    const C = F.cols, cells = {}, warn = [], orig = F.orig || {}; let nA = 0, nO = 0, nW = 0;
    const put = (col, row, v) => { if (col) { cells[col + row] = v; nW++; } };
    (F.rows || []).forEach(([qid, row]) => {
      const q = qOf(sy, qid), e = y.ev[qid] || {}, w = orig[qid] || { r: '', c: '', slots: [] };
      if (e.r) nA++;
      if (q && (q.r || []).length && e.u && String(e.r || '') !== String(w.r || '')) {
        const r = e.r ? q.r.find(x => +x[0] === +e.r) : null;
        put(C.ans, row, r ? r[2] : ''); put(C.r, row, r ? +r[0] : '');
      }
      if (norm(e.c) !== norm(w.c)) put(C.com, row, e.c || '');
      const ops = opsOf(sy, qid);
      if (ops.length > 10) warn.push(`المعيار الفرعي «${norm(q ? q.t : qid).slice(0, 60)}»: ${ops.length} عمليات (الحد الأقصى في ملف مسار 10، تُصدَّر الأولى فقط)`);
      for (let k = 0; k < 10; k++) {
        const o = ops[k], was = w.slots[k] || ['', ''];
        const t = o && norm(o.t) ? `العملية${k + 1}: ${norm(o.t)}` : '';
        if (norm(t) !== norm(was[0])) put(C.ops[k], row, t);
        const aid = o && o.aid ? +o.aid : '';
        if (String(aid) !== String(was[1] || '')) put(C.aid[k], row, aid);
        if (t) nO++;
      }
    });
    return { cells, warn, nA, nO, nW };
  }
  function planCells(sy) {
    const y = Y(sy), F = y.files.pa; if (!F || !F.b64) return null;
    const C = F.cols, cells = {}, orig = F.orig || {}, rowOf = new Map(F.rows || []), err = [], warn = [];
    let n = 0, nW = 0;
    const byAid = new Map(y.ops.filter(o => o.aid).map(o => [o.aid, o]));
    const numv = v => (num(v) == null ? '' : num(v));
    rowOf.forEach((row, aid) => {
      const o = byAid.get(aid);
      if (!o) { warn.push(`العملية رقم ${aid} موجودة في ملف مسار وغير موجودة في البرنامج: تُركت كما هي`); return; }
      const c = check(sy, o);
      if (!c.ok) err.push(`«${norm(o.t).slice(0, 70)}»: ${c.E.join('، ')}`);
      const was = orig[aid] || { ids: {} };
      // the exact items of the lists of Massar
      const v = { t: norm(o.t), G: o.G ? exact(PA(sy).prio, o.G) || String(o.G) : '', H: numv(o.H), I: numv(o.I), J: norm(o.J) ? exact(PA(sy).contrib, o.J) || o.J : '', K: numv(o.K) };
      v.L = norm(o.L) ? exact(domNames(sy), o.L) || o.L : ''; v.M = norm(o.M) ? exact(linesOf(sy, v.L), o.M) || o.M : ''; v.N = norm(o.N) ? exact(PA(sy).types, o.N) || o.N : '';
      v.O = serialOf(o.O) == null ? '' : serialOf(o.O); v.P = serialOf(o.P) == null ? '' : serialOf(o.P);
      const same = k => (['H', 'I', 'K'].includes(k) ? numv(was[k]) === v[k] : ['O', 'P'].includes(k) ? (was[k] || '') === (o[k] || '') : norm(was[k]) === norm(v[k]));
      const put = (k, x) => { if (C[k]) { cells[C[k] + row] = x; nW++; } };
      ['t', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P'].forEach(k => { if (!same(k)) put(k, v[k]); });
      // the ids of Massar follow the texts: a changed text gets the id known for it, or none (as a file filled by hand in Excel)
      const id = x => (x == null ? '' : x);
      if (!same('G')) put('V', v.G ? id(idOf('prio', v.G)) : '');
      if (!same('J')) put('W', v.J ? id(idOf('contrib', v.J)) : '');
      if (!same('L')) put('X', v.L ? id(idOf('dom', v.L)) : '');
      if (!same('L') || !same('M')) put('Y', v.M ? id(idOf('cib', v.M, v.L)) : '');
      if (!same('N')) put('Z', v.N ? id(idOf('type', v.N)) : '');
      n++;
    });
    const missing = y.ops.filter(o => !o.aid || !rowOf.has(o.aid));
    if (missing.length) warn.push(`${missing.length} عملية غير موجودة في ملف مسار (أضيفت في البرنامج بعد تصدير الملف): صدّر أولا ملف التقييم الذاتي إلى مسار ثم أعد تصدير ملف خطة العمل من مسار واستورده هنا.`);
    return { cells, err, warn, n, nW };
  }
  async function exportFile(sy, k) {
    const y = Y(sy), F = y.files[k];
    if (!F || !F.b64) return toast(k === 'ev' ? 'استورد أولا ملف التقييم الذاتي المصدَّر من مسار' : 'استورد أولا ملف خطة العمل المصدَّر من مسار', true);
    const R = k === 'ev' ? evalCells(sy) : planCells(sy);
    const lines = [].concat((R.err || []).map(x => '⛔ ' + x), (R.warn || []).map(x => '⚠ ' + x));
    if (R.err && R.err.length) {
      const ok = await confirmBox(`<b>${R.err.length} عملية لا تحترم قواعد مسار</b> وسيرفضها مسار عند الاستيراد:<div style="max-height:240px;overflow:auto;font-size:12.5px;line-height:1.8;margin-top:6px">${lines.slice(0, 40).map(esc).join('<br>')}</div><p>التصدير رغم ذلك؟</p>`, 'تصدير', false);
      if (!ok) return;
    }
    if (!window.api.patchXlsxMany) return toast('التصدير غير متوفر في هذه النسخة', true);
    const r = await window.api.patchXlsxMany([{ b64: F.b64, sheet: F.sheet, cells: R.cells, name: F.name.replace(/\.xlsx?$/i, '') + '_معبأ.xlsx' }]);
    if (r && r.ok && (r.done || []).length) {
      y.files[k].out = Dx.todayIso(); persist();
      toast(`تم إنشاء ملف مسار المعبأ (${k === 'ev' ? `${R.nA} جوابا و${R.nO} عملية` : `${R.n} عملية`}) في: ${r.dir || ''}`);
      if (R.warn && R.warn.length) setTimeout(() => toast(R.warn[0], true), 400);
    } else if (r && r.ok === false) { /* cancelled */ } else toast('تعذر إنشاء الملف', true);
  }

  /* ---------- strategic indicators ---------- */
  const GOALS = [
    { k: 'g1', t: 'مضاعفة نسبة التلميذات والتلاميذ في السلك الابتدائي المتحكمين في التعلمات الأساس', i: 'نسبة تحسن الأداء في التعلمات الأساس: العربية، الفرنسية والرياضيات' },
    { k: 'g2', t: 'تقليص الهدر المدرسي بنسبة الثلث (1/3)', i: 'نسبة الهدر المدرسي بالمؤسسة' },
    { k: 'g3', t: 'مضاعفة نسبة التلميذات والتلاميذ المستفيدين من الأنشطة الموازية', i: 'متوسط عدد ساعات الأنشطة الموازية لكل تلميذ(ة) / نسبة المستفيدين' }
  ];
  const SUBJ3 = [['ar', 'اللغة العربية'], ['fr', 'اللغة الفرنسية'], ['math', 'الرياضيات']];
  const LV6 = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const DROP = [['nr', 'نسبة التلاميذ غير المعاد تسجيلهم'], ['ex', 'نسبة التلاميذ المستبعدين'], ['lf', 'نسبة التلاميذ الذين تركوا النظام التعليمي']];
  const indYears = sy => { const y1 = MK.syStart(sy); return [y1, y1 + 1, y1 + 2]; };
  const IND = sy => { const y = Y(sy), I = y.ind; I.g1 = I.g1 || { cur: {}, exp: {} }; I.g2 = I.g2 || { cur: {}, exp: {} }; I.g3 = I.g3 || { cur: '', exp: {} }; return I; };
  const avg = a => { const v = a.filter(x => x !== '' && x != null && isFinite(+x)).map(Number); return v.length ? v.reduce((s, x) => s + x, 0) / v.length : null; };
  function g1FromRoaiz(sy) {
    if (!window.Roaiz || !Roaiz.groups || !Roaiz.dashModel) return null;
    const G = Roaiz.groups(sy); if (!G.length) return null;
    const phase = G.some(g => g.phase === 'post') ? 'post' : 'pre';
    const acc = {};
    const RX = [/الأول/, /الثاني/, /الثالث/, /الرابع/, /الخامس/, /السادس/];
    Array.from(new Set(G.filter(g => g.phase === phase).map(g => g.level))).forEach(lv => {
      const m = Roaiz.dashModel(sy, { level: lv }, phase), ds = RX.map((re, i) => (re.test(String(lv)) || new RegExp(`${i + 1}\\s*AP`, 'i').test(String(lv)) ? i + 1 : 0)).filter(Boolean);
      ds.forEach(d => (m.bySubj || []).forEach(x => { const a = (acc[d] = acc[d] || {}), s = (a[x.s.k] = a[x.s.k] || { mas: 0, n: 0 }); s.mas += x.mas || 0; s.n += x.n || 0; }));
    });
    const cur = {};
    Object.entries(acc).forEach(([d, o]) => { cur[d] = {}; SUBJ3.forEach(([k]) => { if (o[k] && o[k].n) cur[d][k] = String(Math.round(o[k].mas / o[k].n * 100)); }); });
    return Object.keys(cur).length ? { cur, phase } : null;
  }
  function suggestTargets(sy) {
    const I = IND(sy), Ys = indYears(sy);
    SUBJ3.forEach(([k]) => { const c = avg([1, 2, 3, 4, 5, 6].map(d => (I.g1.cur[d] || {})[k])); if (c == null) return; const T = Math.min(100, 2 * c); Ys.forEach((yy, i) => { (I.g1.exp[yy] = I.g1.exp[yy] || {})[k] = String(Math.round(c + (T - c) * (i + 1) / 3)); }); });
    const d = DROP.reduce((a, [k]) => a + N(I.g2.cur[k]), 0);
    if (DROP.some(([k]) => I.g2.cur[k] !== '' && I.g2.cur[k] != null)) Ys.forEach((yy, i) => { I.g2.exp[yy] = String(Math.round(d * (1 - (i + 1) / 9) * 10) / 10); });
    if (I.g3.cur !== '' && I.g3.cur != null) Ys.forEach((yy, i) => { I.g3.exp[yy] = String(Math.round(N(I.g3.cur) * (1 + (i + 1) / 3) * 10) / 10); });
  }

  /* ---------- the team ---------- */
  const ROLES = () => ['مدير(ة) المؤسسة — رئيس(ة) جمعية دعم مدرسة النجاح', 'أستاذ(ة) ممثل(ة) جمعية دعم مدرسة النجاح', 'أستاذ(ة) منسق(ة) الحياة المدرسية']
    .concat(window.Cyc && Cyc.isSec() ? [] : ['أستاذ(ة) ممثل(ة) التعاونية المدرسية'])
    .concat(['أستاذ(ة) ممثل(ة) الجمعية الرياضية المدرسية', 'أستاذ(ة) منسق(ة) الأندية التربوية', 'أستاذ(ة) ممثل(ة) خلية اليقظة', 'رئيس(ة) جمعية أمهات وآباء وأولياء التلاميذ', 'ممثل(ة) التلاميذ']);
  const director = () => { const L = typeof staffEmps === 'function' ? staffEmps() : []; const e = L.find(x => /مدير/.test(String(x.cadre || '') + ' ' + String(x.task || ''))); return e ? [fullName(e), e.ppr || ''] : [S().director || '', '']; };
  const teamOf = sy => { const y = Y(sy); if (Array.isArray(y.team) && y.team.length) return y.team; const d = director(); return ROLES().map((q, i) => (i === 0 ? [d[0], d[1], q] : ['', '', q])); };

  /* ---------- the follow-up ---------- */
  const FU = [['', 'لم تنطلق'], ['run', 'في طور الإنجاز'], ['done', 'منجزة'], ['post', 'مؤجلة'], ['drop', 'ملغاة']];
  const fuL = k => (FU.find(x => x[0] === (k || '')) || FU[0])[1];
  const fuPct = o => { const f = o.fu || {}; if (f.s === 'done') return 100; if (f.p !== '' && f.p != null && isFinite(+f.p)) return Math.max(0, Math.min(100, +f.p)); return f.s === 'run' ? 50 : 0; };
  function critStats(sy) {
    const M = new Map();
    sortedOps(sy).forEach(o => {
      const p = placeOf(sy, o), key = p.ax + '|' + p.cr;
      const r = M.get(key) || M.set(key, { ax: p.ax, cr: p.cr, n: 0, done: 0, run: 0, none: 0, post: 0, drop: 0, pct: 0, H: 0, I: 0, sp: 0 }).get(key);
      const s = (o.fu || {}).s || ''; r.n++; r[s === 'done' ? 'done' : s === 'run' ? 'run' : s === 'post' ? 'post' : s === 'drop' ? 'drop' : 'none']++; r.pct += fuPct(o); r.H += N(o.H); r.I += N(o.I); r.sp += N((o.fu || {}).sp);
    });
    return Array.from(M.values()).map(r => Object.assign(r, { avg: r.n ? Math.round(r.pct / r.n) : 0 }));
  }

  /* ---------- the page ---------- */
  const st = { sy: '', part: 'prep', sub: { prep: 'team', view: 'follow' }, open: {}, flt: '', q: '', ax: '' };
  const PARTS = [['prep', 'إعداد المشروع'], ['view', 'الإطلاع على المشروع المصادق عليه'], ['pv', 'المحاضر']];
  const SUBS = { prep: [['team', 'فريق القيادة'], ['eval', 'التقييم الذاتي'], ['evf', 'متابعة التقييم الذاتي'], ['ind', 'المؤشرات الإستراتيجية'], ['evx', 'التقييم الذاتي – استيراد / تصدير'], ['pax', 'خطة العمل – استيراد / تصدير'], ['plan', 'خطة العمل']],
    view: [['follow', 'تتبع المشروع'], ['crit', 'تتبع معايير المشروع وخطط العمل']] };
  const stage = sy => { const p = Y(sy).pv; return (p.cp || {}).d ? 'مصادق عليه من طرف اللجنة الإقليمية' : (p.dp || {}).d ? 'مصادق عليه من طرف المديرية الإقليمية' : (p.cg || {}).d ? 'مصادق عليه من طرف مجلس التدبير' : 'في طور الإعداد'; };
  let saveT = null;
  const later = () => { clearTimeout(saveT); saveT = setTimeout(() => persist(), 500); };

  window.pagePei = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    if (arg.part) st.part = arg.part;
    if (arg.sub) st.sub[st.part] = arg.sub;
    if (arg.sy) st.sy = arg.sy;
    const sy = st.sy || (st.sy = MK.curSy()), part = st.part, cur = st.sub[part];
    const years = MK.syList(Object.keys(DB.pei.years));
    const T = totals(sy);
    v.innerHTML = `<div class="page-h"><div><h2>مشروع المؤسسة المندمج — ${esc((PARTS.find(x => x[0] === part) || PARTS[0])[1])}</h2>
        <div class="muted">${esc(stage(sy))} · ${QS(sy).length} معيارا فرعيا · ${T.ops} عملية · المبلغ الإجمالي ${dh(T.H)} · ميزانية جمعية دعم مدرسة النجاح ${dh(T.I)}</div></div>
      <div class="btn-row"><select class="inp" id="peY" style="width:auto">${years.map(x => `<option value="${x}" ${x === sy ? 'selected' : ''}>${esc(syl(x))}</option>`).join('')}</select>
      <button class="btn pri" id="peDocs">${ic('print')} الوثائق والطبع</button></div></div>
      ${part === 'pv' ? '' : `<div class="mk-tabs"><div class="seg pe-seg" id="peTabs">${SUBS[part].map(([k, l], i) => `<button data-t="${k}" class="${cur === k ? 'on' : ''}"><b class="pe-n">${i + 1}</b> ${l}</button>`).join('')}${part === 'prep' ? `<button data-doc="budget"><b class="pe-n">8</b> وثيقة الميزانية</button><button data-doc="plan"><b class="pe-n">9</b> وثيقة خطة العمل</button>` : ''}</div></div>`}
      <div id="peBody"></div>`;
    $('#peY', v).onchange = e => { st.sy = e.target.value; window.pagePei(v); };
    $('#peDocs', v).onclick = () => go('peiDoc', { kind: part === 'pv' ? 'pv_cg' : part === 'view' ? (cur === 'crit' ? 'crit' : 'follow') : ({ team: 'team', eval: 'eval', evf: 'evf', ind: 'ind', plan: 'plan' })[cur] || 'plan' });
    $$('#peTabs button[data-t]', v).forEach(b => b.onclick = () => go('pei', { part, sub: b.dataset.t }));
    $$('#peTabs button[data-doc]', v).forEach(b => b.onclick = () => go('peiDoc', { kind: b.dataset.doc }));
    const b = $('#peBody', v);
    const re = () => { const main = document.querySelector('.main'), s2 = main ? main.scrollTop : 0; window.pagePei(v); if (main) main.scrollTop = s2; };
    if (part === 'pv') return pvTab(b, sy);
    ({ team: teamTab, eval: evalTab, evf: evfTab, ind: indTab, evx: evxTab, pax: paxTab, plan: planTab, follow: followTab, crit: critTab })[cur](b, sy, re);
  };

  /* ----- 1. the leading team ----- */
  function teamTab(b, sy, re) {
    const y = Y(sy), L = teamOf(sy).map(r => r.slice()), units = (K.unitList ? K.unitList() : []).map(u => u.name);
    y.coord = y.coord || {};
    b.innerHTML = `<div class="card"><div class="card-h"><h3>لائحة فريق القيادة</h3></div><div class="card-b">
      <p class="muted" style="margin-top:0;font-size:12.8px">يتكون فريق القيادة من مدير(ة) المؤسسة وممثلين عن الأطر التربوية والجمعيات والمجالس، وأمهات وآباء وأولياء التلاميذ (كما في «فريق القيادة» بمنظومة مسار). اختر الاسم من لائحة الموظفين ليُملأ رقم التأجير تلقائيا.</p>
      <table class="tbl"><thead><tr><th style="width:36px">ر.ت</th><th>الإسم والنسب</th><th style="width:130px">رقم التأجير</th><th>الصفة داخل الفريق</th><th style="width:40px"></th></tr></thead><tbody>
      ${L.map((r, i) => `<tr data-i="${i}"><td class="num">${i + 1}</td><td><input class="inp pe-tm" data-c="0" list="k2Emps" value="${esc(r[0] || '')}"></td><td><input class="inp pe-tm" data-c="1" value="${esc(r[1] || '')}" dir="ltr"></td><td><input class="inp pe-tm" data-c="2" list="peRoles" value="${esc(r[2] || '')}"></td><td><button class="btn sm danger icon" data-del="${i}">✕</button></td></tr>`).join('')}
      </tbody></table>
      <div class="btn-row" style="margin-top:8px"><button class="btn sm" id="peTAdd">${ic('plus')} إضافة عضو</button><button class="btn sm" id="peTDef">${ic('hist')} التركيبة النموذجية</button><span class="sp"></span><button class="btn sm" data-go="team">${ic('print')} وثيقة فريق القيادة</button><button class="btn sm" data-go="pv_team">${ic('print')} محضر تشكيل فريق القيادة</button></div></div></div>
      ${units.length > 1 ? `<div class="card" style="margin-top:12px"><div class="card-h"><h3>منسقو الوحدات المدرسية</h3></div><div class="card-b"><div class="pe-g3">${units.map(u => `<div class="fld"><label>${esc(u)}</label><input class="inp pe-co" data-u="${esc(u)}" list="k2Emps" value="${esc(y.coord[u] || '')}"></div>`).join('')}</div></div></div>` : ''}
      <datalist id="k2Emps">${K.PP.options('k2Emps')}</datalist><datalist id="peRoles">${ROLES().map(r => `<option value="${esc(r)}">`).join('')}</datalist>`;
    const save = () => { y.team = L; persist(); };
    $$('.pe-tm', b).forEach(el => el.onchange = () => {
      const i = +el.closest('tr').dataset.i, c = +el.dataset.c; L[i][c] = el.value.trim();
      if (c === 0) { const e = K.E.byName(el.value); if (e) { L[i][1] = e.ppr || L[i][1]; save(); return re(); } }
      save();
    });
    $$('[data-del]', b).forEach(el => el.onclick = () => { L.splice(+el.dataset.del, 1); save(); re(); });
    $('#peTAdd', b).onclick = () => { L.push(['', '', '']); save(); re(); };
    $('#peTDef', b).onclick = async () => { if (!(await confirmBox('العودة إلى التركيبة النموذجية لفريق القيادة؟', 'العودة'))) return; y.team = null; persist(); re(); };
    $$('.pe-co', b).forEach(el => el.onchange = () => { y.coord[el.dataset.u] = el.value.trim(); persist(); });
    $$('[data-go]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.go }));
  }

  /* ----- 2. self-evaluation ----- */
  function evalTab(b, sy, re) {
    const y = Y(sy), Q = QS(sy);
    const done = Q.filter(q => (y.ev[q.id] || {}).r || ((q.r || []).length === 0 && norm((y.ev[q.id] || {}).a))).length;
    const flt = st.flt, qq = loose(st.q);
    const show = q => { const e = y.ev[q.id] || {}, ops = opsOf(sy, q.id); if (flt === 'todo' && (e.r || !(q.r || []).length)) return false; if (flt === 'ops' && !ops.length) return false; if (flt === 'need' && !((['no', 'part'].includes(cat(answerOf(sy, q.id)))) && !ops.length)) return false; if (qq && !loose(q.t + ' ' + ops.map(o => o.t).join(' ')).includes(qq)) return false; return true; };
    const qHtml = q => {
      const e = y.ev[q.id] || {}, ops = opsOf(sy, q.id), A = answerOf(sy, q.id), c = cat(A);
      return `<div class="pe-q" data-q="${q.id}"><div class="pe-qt"><div class="pe-qtt">${esc(norm(q.t))}</div>
        ${(q.r || []).length ? `<select class="inp pe-a pe-c-${c}"><option value="">— الجواب —</option>${q.r.map(r => `<option value="${r[0]}" ${+e.r === +r[0] ? 'selected' : ''}>${esc(norm(r[2]))}</option>`).join('')}</select>` : `<div class="pe-insp">${A ? esc(norm(A)) : 'يُعبأ هذا المعيار في مسار بتنسيق مع المفتش(ة) التربوي(ة)'}</div>`}
        <input class="inp pe-cm" placeholder="تعليق عام (اختياري)" value="${esc(e.c || '')}"></div>
        <div class="pe-qo"><div class="pe-ol">${ops.map((o, i) => `<div class="pe-oi" data-o="${o.id}"><span class="pe-on">${i + 1}</span><input class="inp pe-ot" value="${esc(o.t)}" placeholder="نص العملية"><button class="btn sm danger icon" data-odel="${o.id}" title="حذف العملية">✕</button></div>`).join('')}</div>
        ${ops.length < 10 ? `<button class="btn sm" data-oadd="${q.id}">${ic('plus')} عملية</button>` : '<span class="muted" style="font-size:12px">الحد الأقصى: 10 عمليات</span>'}</div></div>`;
    };
    const axes = REF(sy).axes;
    b.innerHTML = `<div class="pe-bar-row"><div class="pe-kpi"><span>المعايير الفرعية المجاب عنها</span><b>${done} / ${Q.length}</b><div class="pe-bar"><i style="width:${pc(done, Q.length)}%"></i></div></div>
        <div class="pe-kpi"><span>العمليات المقترحة</span><b>${y.ops.length}</b></div><div class="pe-kpi"><span>أجوبة سلبية أو جزئية دون عملية</span><b class="${QS(sy).filter(q => ['no', 'part'].includes(cat(answerOf(sy, q.id))) && !opsOf(sy, q.id).length).length ? 'pe-c-no' : ''}">${QS(sy).filter(q => ['no', 'part'].includes(cat(answerOf(sy, q.id))) && !opsOf(sy, q.id).length).length}</b></div>
        <div class="btn-row pe-flt"><select class="inp" id="peF" style="width:auto"><option value="">كل المعايير الفرعية</option><option value="todo" ${flt === 'todo' ? 'selected' : ''}>غير المجاب عنها</option><option value="need" ${flt === 'need' ? 'selected' : ''}>جواب سلبي أو جزئي دون عملية</option><option value="ops" ${flt === 'ops' ? 'selected' : ''}>التي لها عمليات</option></select><input class="inp" id="peQ" placeholder="بحث..." value="${esc(st.q)}" style="max-width:200px"></div></div>
      ${!Q.length ? '<div class="empty">لا يوجد مرجع للتقييم الذاتي. استورد ملف التقييم الذاتي المصدَّر من مسار.</div>' : ''}
      ${axes.map((a, ai) => { const qs = (a.c || []).reduce((s, c) => s.concat(c.q || []), []); const dn = qs.filter(q => (y.ev[q.id] || {}).r).length;
        return `<details class="pe-ax" data-ax="${ai}" ${st.open['a' + ai] !== false ? 'open' : ''}><summary><b>المحور: ${esc(norm(a.n))}</b> <span class="muted">— ${dn} / ${qs.length}</span></summary>
        ${(a.c || []).map(c => { const vis = (c.q || []).map(q => Object.assign({}, qOf(sy, q.id) || q)).filter(show); return vis.length ? `<div class="card pe-cr"><div class="card-h"><h3>${esc(norm(c.n))}</h3></div><div class="card-b">${vis.map(qHtml).join('')}</div></div>` : ''; }).join('')}</details>`; }).join('')}`;
    b.addEventListener('toggle', e => { const d = e.target; if (d.classList && d.classList.contains('pe-ax')) st.open['a' + d.dataset.ax] = d.open; }, true);
    $('#peF', b).onchange = e => { st.flt = e.target.value; re(); };
    $('#peQ', b).onchange = e => { st.q = e.target.value; re(); };
    b.addEventListener('change', e => {
      const el = e.target, qd = el.closest('.pe-q'); if (!qd) return;
      const qid = +qd.dataset.q, ev = y.ev[qid] = y.ev[qid] || {};
      if (el.classList.contains('pe-a')) { const q = qOf(sy, qid), r = (q.r || []).find(x => +x[0] === +el.value); ev.r = r ? r[0] : ''; ev.a = r ? r[2] : ''; ev.u = true; el.className = 'inp pe-a pe-c-' + cat(ev.a); persist(); }
      else if (el.classList.contains('pe-cm')) { ev.c = el.value.trim(); persist(); }
      else if (el.classList.contains('pe-ot')) { const o = y.ops.find(x => x.id === el.closest('.pe-oi').dataset.o); if (o) { o.t = el.value.trim(); persist(); } }
    });
    b.addEventListener('click', async e => {
      const a = e.target.closest('[data-oadd]'), d = e.target.closest('[data-odel]');
      if (a) { const o = newOp(+a.dataset.oadd, ''); y.ops.push(o); persist(); re(); const inp = b.ownerDocument.querySelector(`.pe-oi[data-o="${o.id}"] input`); if (inp) inp.focus(); }
      if (d) { const o = y.ops.find(x => x.id === d.dataset.odel); if (!o) return; if ((N(o.H) || o.aid) && !(await confirmBox(`حذف العملية «${esc(norm(o.t))}»${o.aid ? ' (عملية مسجلة في مسار)' : ''}؟`, 'حذف'))) return; y.ops.splice(y.ops.indexOf(o), 1); persist(); re(); }
    });
  }

  /* ----- 3. follow-up of the self-evaluation ----- */
  function evStats(sy) {
    const y = Y(sy);
    return REF(sy).axes.map(a => ({ n: a.n, crit: (a.c || []).map(c => {
      const r = { n: c.n, q: (c.q || []).length, ans: 0, yes: 0, part: 0, no: 0, ops: 0, need: 0, H: 0 };
      (c.q || []).forEach(q => { const A = answerOf(sy, q.id), k = cat(A), ops = opsOf(sy, q.id); if (A) { r.ans++; r[k]++; } r.ops += ops.length; r.H += ops.reduce((s, o) => s + N(o.H), 0); if ((k === 'no' || k === 'part') && !ops.length) r.need++; });
      void y; return r;
    }) }));
  }
  function evfTab(b, sy, re) {
    const S0 = evStats(sy), all = S0.reduce((a, x) => a.concat(x.crit), []), sum = k => all.reduce((s, r) => s + r[k], 0);
    const need = QS(sy).filter(q => ['no', 'part'].includes(cat(answerOf(sy, q.id))) && !opsOf(sy, q.id).length);
    const todo = QS(sy).filter(q => (q.r || []).length && !answerOf(sy, q.id));
    b.innerHTML = `<div class="pe-bar-row">${[['المعايير الفرعية', sum('q')], ['المجاب عنها', `${sum('ans')} (${pc(sum('ans'), sum('q'))}%)`], ['أجوبة إيجابية', sum('yes')], ['أجوبة جزئية', sum('part')], ['أجوبة سلبية', sum('no')], ['العمليات', sum('ops')], ['الكلفة الإجمالية', dh(sum('H'))]].map(([l, x]) => `<div class="pe-kpi"><span>${l}</span><b>${x}</b></div>`).join('')}</div>
      <div class="card"><div class="card-b"><table class="tbl compact"><thead><tr><th>المحور / المعيار</th><th>المعايير الفرعية</th><th>المجاب عنها</th><th>إيجابي</th><th>جزئي</th><th>سلبي</th><th>العمليات</th><th>دون عملية رغم الحاجة</th><th>الكلفة (د)</th><th style="width:140px">نسبة التعبئة</th></tr></thead><tbody>
      ${S0.map(a => `<tr class="pe-axr"><td colspan="10"><b>${esc(norm(a.n))}</b></td></tr>${a.crit.map(r => `<tr><td>${esc(norm(r.n))}</td><td class="num">${r.q}</td><td class="num">${r.ans}</td><td class="num pe-c-yes">${r.yes}</td><td class="num pe-c-part">${r.part}</td><td class="num pe-c-no">${r.no}</td><td class="num">${r.ops}</td><td class="num ${r.need ? 'pe-c-no b' : ''}">${r.need}</td><td class="num">${money(r.H)}</td><td><div class="pe-bar"><i style="width:${pc(r.ans, r.q)}%"></i></div></td></tr>`).join('')}`).join('')}
      </tbody></table><p class="muted" style="font-size:12px;margin:6px 0 0">التصنيف (إيجابي / جزئي / سلبي) تقريبي حسب صيغة الجواب المختار («نعم…»، «نسبيا…»، «لا…»).</p></div></div>
      ${need.length ? `<div class="card" style="margin-top:12px"><div class="card-h"><h3>معايير فرعية بجواب سلبي أو جزئي دون أي عملية (${need.length})</h3></div><div class="card-b"><ul class="pe-ul">${need.map(q => `<li><b>${esc(norm(q.cr))}</b>: ${esc(norm(q.t))} — <span class="pe-c-${cat(answerOf(sy, q.id))}">${esc(norm(answerOf(sy, q.id)))}</span></li>`).join('')}</ul><div class="btn-row"><button class="btn sm" id="peGoNeed">${ic('edit')} إضافة العمليات في «التقييم الذاتي»</button></div></div></div>` : ''}
      ${todo.length ? `<div class="card" style="margin-top:12px"><div class="card-h"><h3>معايير فرعية دون جواب (${todo.length})</h3></div><div class="card-b"><ul class="pe-ul">${todo.map(q => `<li><b>${esc(norm(q.cr))}</b>: ${esc(norm(q.t))}</li>`).join('')}</ul></div></div>` : ''}`;
    const g = $('#peGoNeed', b); if (g) g.onclick = () => { st.flt = 'need'; go('pei', { part: 'prep', sub: 'eval' }); };
    void re;
  }

  /* ----- 4. strategic indicators ----- */
  function indTab(b, sy, re) {
    const I = IND(sy), Ys = indYears(sy), y1 = Ys[0];
    const inp = (path, v, ph) => `<input class="inp pe-in" data-p="${path}" type="number" min="0" step="0.1" value="${esc(v == null ? '' : v)}" placeholder="${ph || '%'}">`;
    b.innerHTML = `<p class="muted" style="margin:0 0 10px;line-height:1.8">الأهداف الإستراتيجية الثلاثة لمشروع المؤسسة المندمج (خارطة الطريق 2022-2026) ومؤشراتها: الوضعية الحالية (${y1}) والقيم المتوقعة للسنوات ${Ys.join(' و')}. يمكن ملء الوضعية الحالية للهدف الأول من نتائج الروائز، واقتراح القيم المتوقعة حسب الهدف (المضاعفة أو التقليص بالثلث).</p>
      <div class="btn-row" style="margin-bottom:10px"><button class="btn sm" id="peRz">${ic('hist')} ملء الوضعية الحالية للهدف 1 من الروائز</button><button class="btn sm" id="peTg">💡 اقتراح القيم المتوقعة</button><span class="sp"></span><button class="btn sm" data-go="ind">${ic('print')} وثيقة المؤشرات الإستراتيجية</button></div>
      <div class="card"><div class="card-h"><h3>الهدف 1: ${esc(GOALS[0].t)}</h3></div><div class="card-b"><p class="muted" style="margin-top:0">المؤشر: ${esc(GOALS[0].i)}</p>
        <table class="tbl compact"><thead><tr><th>الوضعية الحالية ${y1}</th>${SUBJ3.map(([, n]) => `<th>${n} (%)</th>`).join('')}</tr></thead><tbody>
        ${LV6.map((l, i) => `<tr><td>المستوى ${l}</td>${SUBJ3.map(([k]) => `<td>${inp(`g1.cur.${i + 1}.${k}`, (I.g1.cur[i + 1] || {})[k])}</td>`).join('')}</tr>`).join('')}
        </tbody></table>
        <table class="tbl compact" style="margin-top:8px"><thead><tr><th>المؤشرات المتوقعة</th>${SUBJ3.map(([, n]) => `<th>${n} (%)</th>`).join('')}</tr></thead><tbody>
        ${Ys.map(yy => `<tr><td>سنة ${yy}</td>${SUBJ3.map(([k]) => `<td>${inp(`g1.exp.${yy}.${k}`, (I.g1.exp[yy] || {})[k])}</td>`).join('')}</tr>`).join('')}</tbody></table></div></div>
      <div class="card" style="margin-top:12px"><div class="card-h"><h3>الهدف 2: ${esc(GOALS[1].t)}</h3></div><div class="card-b"><p class="muted" style="margin-top:0">المؤشر: ${esc(GOALS[1].i)}</p>
        <div class="pe-g3">${DROP.map(([k, l]) => `<div class="fld"><label>${l} — ${y1} (%)</label>${inp(`g2.cur.${k}`, I.g2.cur[k])}</div>`).join('')}</div>
        <div class="pe-g3">${Ys.map(yy => `<div class="fld"><label>نسبة الهدر المتوقعة لسنة ${yy} (%)</label>${inp(`g2.exp.${yy}`, I.g2.exp[yy])}</div>`).join('')}</div></div></div>
      <div class="card" style="margin-top:12px"><div class="card-h"><h3>الهدف 3: ${esc(GOALS[2].t)}</h3></div><div class="card-b"><p class="muted" style="margin-top:0">المؤشر: ${esc(GOALS[2].i)}</p>
        <div class="pe-g3"><div class="fld"><label>الوضعية الحالية ${y1}</label>${inp('g3.cur', I.g3.cur, '')}</div><div class="fld"><label>الوحدة</label><select class="inp" id="peU3"><option value="%" ${I.g3.u !== 'h' ? 'selected' : ''}>نسبة مئوية (%)</option><option value="h" ${I.g3.u === 'h' ? 'selected' : ''}>عدد الساعات</option></select></div></div>
        <div class="pe-g3">${Ys.map(yy => `<div class="fld"><label>القيمة المتوقعة لسنة ${yy}</label>${inp(`g3.exp.${yy}`, I.g3.exp[yy], '')}</div>`).join('')}</div></div></div>`;
    $$('.pe-in', b).forEach(el => el.onchange = () => {
      const p = el.dataset.p.split('.'); let o = I; for (let i = 0; i < p.length - 1; i++) { if (typeof o[p[i]] !== 'object' || o[p[i]] == null) o[p[i]] = {}; o = o[p[i]]; } o[p[p.length - 1]] = el.value; persist();
    });
    $('#peU3', b).onchange = e => { I.g3.u = e.target.value === 'h' ? 'h' : '%'; persist(); };
    $('#peRz', b).onclick = () => { const r = g1FromRoaiz(sy); if (!r) return toast('لا توجد نتائج روائز مستوردة لهذا الموسم (التقويم والدعم ← الروائز التشخيصية)', true); I.g1.cur = r.cur; persist(); re(); toast(`تم الملء من نتائج ${r.phase === 'post' ? 'الموضعة البعدية' : 'الموضعة القبلية'} (نسبة التحكم حسب المستوى والمادة)`); };
    $('#peTg', b).onclick = () => { suggestTargets(sy); persist(); re(); toast('تم اقتراح القيم المتوقعة: مضاعفة نسب التحكم والمستفيدين وتقليص الهدر بالثلث في أفق ثلاث سنوات'); };
    $$('[data-go]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.go }));
  }

  /* ----- 5/6. import / export with Massar ----- */
  function fileCard(sy, k) {
    const F = Y(sy).files[k], ev = k === 'ev';
    const name = ev ? 'ExportAutoEvaluationLabelisation' : 'ExportPlanActionLabelisation';
    const steps = ev ? ['في مسار: مشروع المؤسسة المندمج ← إعداد المشروع ← التقييم الذاتي – استيراد / تصدير ← «تصدير».', 'هنا: «استيراد ملف مسار» (الأجوبة والتعاليق والعمليات وأرقامها في مسار).', 'املأ الأجوبة والعمليات في «التقييم الذاتي».', '«تصدير الملف المعبأ»: نفس ملف مسار، تُكتب فيه الخانات فقط مع الحفاظ على المعرفات واللوائح والحماية.', 'في مسار: «استيراد» الملف المعبأ.']
      : ['بعد استيراد التقييم الذاتي في مسار (لتُنشأ العمليات وأرقامها): مشروع المؤسسة المندمج ← خطة العمل – استيراد / تصدير ← «تصدير».', 'هنا: «استيراد ملف مسار».', 'املأ «خطة العمل»: الأولوية والمبالغ وجهة المساهمة ومجال وسطر الصرف ونوع المساهمة والتواريخ (مراقبة فورية بقواعد مسار).', '«تصدير الملف المعبأ» ثم استيراده في مسار.'];
    const R = F && F.b64 ? (ev ? evalCells(sy) : planCells(sy)) : null;
    return `<div class="card"><div class="card-h"><h3>${ev ? 'التقييم الذاتي' : 'خطة العمل'} — ملف مسار ${name}</h3></div><div class="card-b">
      <ol class="pe-steps">${steps.map(s => `<li>${s}</li>`).join('')}</ol>
      ${F ? `<table class="tbl compact pe-file"><tbody><tr><th>الملف المستورد</th><td dir="ltr">${esc(F.name)}</td></tr><tr><th>تاريخ الاستيراد</th><td>${esc(fmtDate(F.at))}</td></tr>
        ${F.meta ? `<tr><th>المؤسسة</th><td>${esc([F.meta.school, F.meta.code].filter(Boolean).join(' — '))}</td></tr><tr><th>السنة الدراسية</th><td>${esc(F.meta.year || '')}${F.meta.year && F.meta.year.replace(/\s/g, '') !== sy ? ' <span class="pe-c-no">(مختلفة عن الموسم المختار)</span>' : ''}</td></tr>` : ''}
        <tr><th>ما سيُكتب في الملف</th><td>${R ? (ev ? `${R.nA} جوابا، ${R.nO} عملية` : `${R.n} عملية`) : '—'}${F.out ? ` — آخر تصدير: ${esc(fmtDate(F.out))}` : ''}</td></tr></tbody></table>
        ${R && ((R.err || []).length || (R.warn || []).length) ? `<div class="pe-msgs">${(R.err || []).slice(0, 12).map(x => `<div class="e">⛔ ${esc(x)}</div>`).join('')}${(R.err || []).length > 12 ? `<div class="e">… و${R.err.length - 12} أخرى</div>` : ''}${(R.warn || []).map(x => `<div class="w">⚠ ${esc(x)}</div>`).join('')}</div>` : (R ? '<div class="pe-msgs"><div class="ok">✔ جاهز للتصدير: كل العمليات تحترم قواعد مسار</div></div>' : '')}`
        : '<div class="empty" style="padding:14px">لم يُستورد أي ملف بعد.</div>'}
      <div class="btn-row" style="margin-top:10px"><button class="btn" data-imp="${k}">${ic('inbox')} استيراد ملف مسار</button><button class="btn pri" data-exp="${k}" ${F && F.b64 ? '' : 'disabled'}>${ic('outbox')} تصدير الملف المعبأ إلى مسار</button>
      ${F ? `<button class="btn sm danger" data-forget="${k}">${ic('trash')} إزالة الملف</button>` : ''}</div></div></div>`;
  }
  function ioTab(b, sy, re, k) {
    b.innerHTML = fileCard(sy, k);
    $$('[data-imp]', b).forEach(el => el.onclick = () => importFiles(sy, el.dataset.imp, re));
    $$('[data-exp]', b).forEach(el => el.onclick = () => exportFile(sy, el.dataset.exp));
    $$('[data-forget]', b).forEach(el => el.onclick = async () => { if (!(await confirmBox('إزالة ملف مسار المستورد؟ تبقى الأجوبة والعمليات المسجلة في البرنامج.', 'إزالة'))) return; delete Y(sy).files[el.dataset.forget]; persist(); re(); });
  }
  const evxTab = (b, sy, re) => ioTab(b, sy, re, 'ev');
  const paxTab = (b, sy, re) => ioTab(b, sy, re, 'pa');

  /* ----- 7. the action plan ----- */
  const opt = (list, cur, empty) => `${empty != null ? `<option value="">${esc(empty)}</option>` : ''}${list.map(x => { const [v, l] = Array.isArray(x) ? x : [x, norm(x)]; return `<option value="${esc(v)}" ${norm(v) === norm(cur) && norm(cur) !== '' ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}${cur && !list.some(x => norm(Array.isArray(x) ? x[0] : x) === norm(cur)) ? `<option value="${esc(cur)}" selected>${esc(norm(cur))} ⚠</option>` : ''}`;
  function opRow(sy, o) {
    const c = check(sy, o), Ld = exact(domNames(sy), o.L) || o.L, sg = suggest(sy, o);
    const sgOk = sg && (norm(sg.L) !== norm(o.L) || norm(sg.M) !== norm(o.M));
    const dirOnly = isDir(o.J) && !num(o.H);
    return `<div class="pe-op ${c.ok ? (c.W.length ? 'warn' : 'ok') : 'err'}" data-o="${o.id}">
      <div class="r1"><span class="pe-on" title="رقم العملية">${opNo(sy, o)}</span><textarea class="inp" data-f="t" rows="1" placeholder="نص العملية">${esc(o.t)}</textarea>
        <div><label>الأولوية</label><select class="inp" data-f="G">${opt(PRIO.map(([v]) => [v, 'الأولوية ' + v]), o.G, '—')}</select></div>
        <span class="pe-st">${c.ok ? (c.W.length ? '⚠' : '✔') : '⛔'}${o.aid ? `<small dir="ltr" title="رقم العملية في مسار">#${esc(o.aid)}</small>` : '<small title="عملية جديدة غير مسجلة بعد في مسار">جديدة</small>'}</span></div>
      <div class="r2"><div><label>المبلغ الإجمالي (د)</label><input class="inp" data-f="H" type="number" min="0" step="50" value="${esc(o.H)}"></div>
        <div><label>ميزانية جمعية دعم مدرسة النجاح (د)</label><input class="inp ${o.Ia !== false ? 'pe-auto' : ''}" data-f="I" type="number" min="0" step="50" value="${esc(o.I)}" title="${o.Ia !== false ? 'تُحسب تلقائيا: المبلغ الإجمالي − قيمة المساهمة' : 'قيمة مدخلة يدويا (أفرغها للعودة إلى الحساب التلقائي)'}"></div>
        <div><label>جهة المساهمة في التمويل أو الإنجاز</label><select class="inp" data-f="J">${opt(PA(sy).contrib, o.J, '— لا توجد —')}</select></div>
        <div><label>قيمة المساهمة (د)</label><input class="inp" data-f="K" type="number" min="0" step="50" value="${esc(o.K)}" ${norm(o.J) ? '' : 'placeholder="—"'}></div></div>
      <div class="r3"><div><label>مجال الصرف</label><select class="inp" data-f="L">${opt(domNames(sy), o.L, '— اختر —')}</select></div>
        <div><label>سطر الصرف</label><select class="inp" data-f="M">${opt(linesOf(sy, Ld), o.M, norm(o.L) ? '— اختر —' : '— اختر المجال أولا —')}</select></div>
        <div><label>نوع المساهمة</label><select class="inp" data-f="N">${opt(PA(sy).types, o.N, '—')}</select></div>
        <div><label>تاريخ البداية</label><input class="inp" data-f="O" type="date" value="${esc(o.O)}"></div><div><label>تاريخ النهاية</label><input class="inp" data-f="P" type="date" value="${esc(o.P)}"></div></div>
      ${c.E.length || c.W.length || sgOk || o.msg ? `<div class="pe-msg">${c.E.map(x => `<span class="e">⛔ ${esc(x)}</span>`).join('')}${c.W.map(x => `<span class="w">⚠ ${esc(x)}</span>`).join('')}${o.msg ? `<span class="e">رسالة الرفض في مسار: ${esc(o.msg)}</span>` : ''}
        ${sgOk && !dirOnly ? `<button class="btn sm pe-sg" data-sg="${o.id}" title="اقتراح حسب نص العملية">💡 ${esc(norm(sg.L))} ← ${esc(norm(sg.M))}</button>` : ''}</div>` : ''}</div>`;
  }
  function planTab(b, sy, re) {
    const y = Y(sy), ops = sortedOps(sy), env = num(y.env);
    const T = totals(sy);
    const axes = Array.from(new Set(ops.map(o => placeOf(sy, o).ax)));
    const flt = st.pflt || '', fax = st.ax, qq = loose(st.pq || '');
    const show = o => { const c = check(sy, o); if (flt === 'err' && c.ok) return false; if (flt === 'warn' && (!c.ok || !c.W.length)) return false; if (flt === 'new' && o.aid) return false; if (/^p\d$/.test(flt) && String(o.G) !== flt[1]) return false; if (fax && placeOf(sy, o).ax !== fax) return false; if (qq && !loose(o.t).includes(qq)) return false; return true; };
    const bar = () => { const T2 = totals(sy), e2 = num(Y(sy).env), over = e2 ? T2.I - e2 : 0;
      return `<div class="pe-kpi"><span>العمليات</span><b>${T2.ops}</b></div><div class="pe-kpi"><span>المبلغ الإجمالي</span><b>${dh(T2.H)}</b></div>
        <div class="pe-kpi ${over > 0 ? 'bad' : ''}"><span>ميزانية جمعية دعم مدرسة النجاح${e2 ? ` / الغلاف ${dh(e2)}` : ''}</span><b>${dh(T2.I)}</b>${e2 ? `<div class="pe-bar ${over > 0 ? 'bad' : ''}"><i style="width:${Math.min(100, pc(T2.I, e2))}%"></i></div><small>${over > 0 ? `تجاوز: ${dh(over)}` : `المتبقي: ${dh(-over)}`}</small>` : ''}</div>
        <div class="pe-kpi"><span>مساهمات الشركاء</span><b>${dh(T2.K)}</b></div><div class="pe-kpi ${T2.err ? 'bad' : 'good'}"><span>غير مقبولة في مسار</span><b>${T2.err}</b></div><div class="pe-kpi"><span>تنبيهات</span><b>${T2.warn}</b></div>`; };
    let lastAx = null, lastQ = null;
    const body = ops.filter(show).map(o => {
      const p = placeOf(sy, o); let h = '';
      if (p.ax !== lastAx) { h += `<div class="pe-axh">المحور: ${esc(norm(p.ax))}</div>`; lastAx = p.ax; lastQ = null; }
      if (+o.qid !== lastQ) { const A = answerOf(sy, o.qid); h += `<div class="pe-qh"><div><small>${esc(norm(p.cr))}</small><b>${esc(norm(p.sub))}</b></div>${A ? `<span class="pe-c-${cat(A)}">${esc(norm(A))}</span>` : ''}</div>`; lastQ = +o.qid; }
      return h + opRow(sy, o);
    }).join('');
    b.innerHTML = `<div class="pe-bar-row" id="peSum">${bar()}</div>
      <div class="card pe-tools"><div class="card-b"><div class="pe-g4">
        <div class="fld"><label>الغلاف المالي المرصود لجمعية دعم مدرسة النجاح (د)</label><input class="inp" id="peEnv" type="number" min="0" step="100" value="${esc(y.env || '')}" placeholder="مثال: 100000"></div>
        <div class="fld"><label>عرض</label><select class="inp" id="pePF"><option value="">كل العمليات</option><option value="err" ${flt === 'err' ? 'selected' : ''}>غير المقبولة في مسار ⛔</option><option value="warn" ${flt === 'warn' ? 'selected' : ''}>التي بها تنبيه ⚠</option><option value="new" ${flt === 'new' ? 'selected' : ''}>الجديدة (غير المسجلة في مسار)</option>${PRIO.map(([v]) => `<option value="p${v}" ${flt === 'p' + v ? 'selected' : ''}>الأولوية ${v}</option>`).join('')}</select></div>
        <div class="fld"><label>المحور</label><select class="inp" id="pePA"><option value="">كل المحاور</option>${axes.map(a => `<option value="${esc(a)}" ${a === fax ? 'selected' : ''}>${esc(norm(a))}</option>`).join('')}</select></div>
        <div class="fld"><label>بحث في العمليات</label><input class="inp" id="pePQ" value="${esc(st.pq || '')}"></div></div>
        <div class="btn-row" style="margin-top:6px"><button class="btn sm pri" id="peSmart" title="يملأ الخانات الفارغة فقط: الأولوية حسب التقييم، مجال وسطر الصرف حسب نص العملية، نوع المساهمة، تواريخ الموسم، ميزانية الجمعية">💡 ملء ذكي للخانات الفارغة</button>
          <button class="btn sm" id="peDates">${ic('cal')} تواريخ الموسم للجميع</button><button class="btn sm" id="peFit" ${env ? '' : 'disabled'} title="تقليص ميزانية الجمعية حسب الأولويات (3 ثم 2 ثم 1) لتطابق الغلاف المرصود">⚖ ملاءمة المبالغ مع الغلاف</button>
          <span class="sp"></span><button class="btn sm" data-go="pax">${ic('outbox')} تصدير إلى مسار</button><button class="btn sm" data-doc="plan">${ic('print')} وثيقة خطة العمل</button><button class="btn sm" data-doc="budget">${ic('print')} وثيقة الميزانية</button></div></div></div>
      ${!ops.length ? `<div class="empty">لا توجد عمليات. أضف العمليات في «التقييم الذاتي» (لكل معيار فرعي) أو استورد ملف خطة العمل المصدَّر من مسار.</div>` : body || '<div class="empty">لا توجد عمليات ضمن هذا العرض.</div>'}`;
    const refreshSum = () => { const s = $('#peSum', b); if (s) s.innerHTML = bar(); };
    // the row is drawn again once the focus has moved (Tab from one amount to the next keeps working)
    const redraw = o => setTimeout(() => {
      const el = b.querySelector(`.pe-op[data-o="${o.id}"]`); if (!el || !el.isConnected) return refreshSum();
      const act = document.activeElement, fk = act && el.contains(act) && act.dataset ? act.dataset.f : null;
      const tmp = document.createElement('div'); tmp.innerHTML = opRow(sy, o); const nw = tmp.firstElementChild;
      el.replaceWith(nw);
      if (fk) { const f2 = nw.querySelector(`[data-f="${fk}"]`); if (f2) f2.focus(); }
      const t = nw.querySelector('textarea'); if (t) { t.style.height = 'auto'; t.style.height = Math.max(34, t.scrollHeight) + 'px'; }
      refreshSum();
    }, 0);
    $('#peEnv', b).onchange = e => { y.env = e.target.value; persist(); re(); };
    $('#pePF', b).onchange = e => { st.pflt = e.target.value; re(); };
    $('#pePA', b).onchange = e => { st.ax = e.target.value; re(); };
    $('#pePQ', b).onchange = e => { st.pq = e.target.value; re(); };
    $('#peSmart', b).onclick = () => { let n = 0; y.ops.forEach(o => { n += smartFill(sy, o); }); persist(); re(); toast(n ? `تم ملء ${n} خانة فارغة (راجع الاقتراحات قبل التصدير)` : 'لا توجد خانات فارغة قابلة للملء التلقائي'); };
    $('#peDates', b).onclick = async () => { const d = defDates(sy); if (!(await confirmBox(`تطبيق تاريخ البداية ${dmy(d.O)} وتاريخ النهاية ${dmy(d.P)} على جميع العمليات؟`, 'تطبيق', false))) return; y.ops.forEach(o => { o.O = d.O; o.P = d.P; }); persist(); re(); };
    $('#peFit', b).onclick = async () => {
      const r = fitPlan(sy, num(y.env), false);
      if (!r.n) return toast(r.tot <= num(y.env) ? 'ميزانية الجمعية داخل الغلاف المرصود' : 'تعذرت الملاءمة', r.tot > num(y.env));
      if (!(await confirmBox(`ميزانية الجمعية الحالية: <b>${dh(r.tot)}</b> — الغلاف: <b>${dh(num(y.env))}</b><br>سيتم تقليص <b>${r.n}</b> عملية بدءا بالأولوية 3 ثم 2 ثم 1 (بأجزاء 50 درهما، مع تعديل المبلغ الإجمالي بنفس القدر)، لتصبح الميزانية <b>${dh(r.after)}</b>.`, 'ملاءمة', false))) return;
      fitPlan(sy, num(y.env), true); persist(); re(); toast('تمت ملاءمة المبالغ مع الغلاف المرصود');
    };
    $$('[data-go]', b).forEach(el => el.onclick = () => go('pei', { part: 'prep', sub: el.dataset.go }));
    $$('[data-doc]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.doc }));
    b.addEventListener('change', e => {
      const el = e.target, f = el.dataset.f, od = el.closest('.pe-op'); if (!f || !od) return;
      const o = y.ops.find(x => x.id === od.dataset.o); if (!o) return;
      let v = el.value;
      if (f === 't') v = v.trim();
      o[f] = v;
      if (f === 'L') { o.M = ''; const one = linesOf(sy, v); if (one.length === 1) o.M = one[0]; }
      if (f === 'J' && !norm(v)) { o.K = ''; }
      if (f === 'J' && isDir(v)) { const s = suggest(sy, o); if (s && !norm(o.L)) { o.L = s.L; o.M = s.M; } }
      if (['H', 'I', 'K', 'J'].includes(f)) onAmount(o, f);
      if (f === 'H' && N(o.H) > 0 && !norm(o.N)) o.N = exact(PA(sy).types, 'مالية') || o.N;
      later(); redraw(o);
    });
    b.addEventListener('click', e => {
      const s = e.target.closest('[data-sg]'); if (!s) return;
      const o = y.ops.find(x => x.id === s.dataset.sg), g = o && suggest(sy, o); if (!g) return;
      o.L = g.L; o.M = g.M; persist(); redraw(o);
    });
    b.addEventListener('input', e => { if (e.target.tagName === 'TEXTAREA') { e.target.style.height = 'auto'; e.target.style.height = e.target.scrollHeight + 'px'; } });
    $$('.pe-op textarea', b).forEach(t => { t.style.height = 'auto'; t.style.height = Math.max(34, t.scrollHeight) + 'px'; });
  }

  /* ----- the approved project: follow-up ----- */
  function followTab(b, sy, re) {
    const y = Y(sy), ops = sortedOps(sy);
    const done = ops.filter(o => (o.fu || {}).s === 'done').length, pAvg = ops.length ? Math.round(ops.reduce((a, o) => a + fuPct(o), 0) / ops.length) : 0;
    const sp = ops.reduce((a, o) => a + N((o.fu || {}).sp), 0), I = ops.reduce((a, o) => a + N(o.I), 0), H = ops.reduce((a, o) => a + N(o.H), 0);
    const flt = st.fflt || '';
    let lastAx = null;
    b.innerHTML = `${stage(sy) === 'في طور الإعداد' ? '<p class="pe-note">لم تُسجَّل بعد مصادقة على المشروع (المحاضر). يمكن مع ذلك تتبع إنجاز العمليات.</p>' : ''}
      <div class="pe-bar-row">${[['العمليات', ops.length], ['المنجزة', `${done} (${pc(done, ops.length)}%)`], ['في طور الإنجاز', ops.filter(o => (o.fu || {}).s === 'run').length], ['لم تنطلق', ops.filter(o => !(o.fu || {}).s).length], ['نسبة الإنجاز الإجمالية', pAvg + '%'], ['المصروف / المبرمج', `${dh(sp)} / ${dh(H)}`]].map(([l, x]) => `<div class="pe-kpi"><span>${l}</span><b>${x}</b></div>`).join('')}</div>
      <div class="btn-row" style="margin-bottom:8px"><select class="inp" id="peFF" style="width:auto">${[['', 'كل العمليات']].concat(FU.map(([k, l]) => ['s' + k, l])).map(([k, l]) => `<option value="${k}" ${flt === k ? 'selected' : ''}>${l}</option>`).join('')}</select><span class="sp"></span><button class="btn sm" data-doc="follow">${ic('print')} وثيقة تتبع المشروع</button></div>
      <div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact pe-fu"><thead><tr><th>العملية</th><th>الأولوية</th><th>المبلغ (د)</th><th>ميزانية الجمعية (د)</th><th>الحالة</th><th style="width:80px">الإنجاز %</th><th style="width:110px">المصروف (د)</th><th style="width:140px">تاريخ الإنجاز</th><th>ملاحظات</th></tr></thead><tbody>
      ${ops.filter(o => !flt || ('s' + ((o.fu || {}).s || '')) === flt).map(o => { const p = placeOf(sy, o), f = o.fu || {}; const h = p.ax !== lastAx ? `<tr class="pe-axr"><td colspan="9"><b>${esc(norm(p.ax))}</b></td></tr>` : ''; lastAx = p.ax;
        return `${h}<tr data-o="${o.id}"><td><small class="muted">${esc(norm(p.cr))}</small><br>${esc(norm(o.t))}</td><td class="num">${esc(o.G || '')}</td><td class="num">${money(N(o.H))}</td><td class="num">${money(N(o.I))}</td>
          <td><select class="inp pe-fs" data-k="s">${FU.map(([k, l]) => `<option value="${k}" ${(f.s || '') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></td>
          <td><input class="inp pe-fs" data-k="p" type="number" min="0" max="100" step="5" value="${esc(f.s === 'done' ? 100 : (f.p ?? ''))}" placeholder="${fuPct(o)}"></td><td><input class="inp pe-fs" data-k="sp" type="number" min="0" step="10" value="${esc(f.sp ?? '')}"></td>
          <td><input class="inp pe-fs" data-k="d" type="date" value="${esc(f.d || '')}"></td><td><input class="inp pe-fs" data-k="n" value="${esc(f.n || '')}"></td></tr>`; }).join('') || '<tr><td colspan="9" class="muted">لا توجد عمليات</td></tr>'}
      </tbody></table></div></div>`;
    void I;
    $('#peFF', b).onchange = e => { st.fflt = e.target.value; re(); };
    $$('[data-doc]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.doc }));
    $$('.pe-fs', b).forEach(el => el.onchange = () => {
      const o = y.ops.find(x => x.id === el.closest('tr').dataset.o); if (!o) return;
      o.fu = o.fu || {}; o.fu[el.dataset.k] = el.value;
      if (el.dataset.k === 's' && el.value === 'done') { o.fu.p = '100'; if (!o.fu.d) o.fu.d = Dx.todayIso(); if (!o.fu.sp) o.fu.sp = String(N(o.H)); }
      if (el.dataset.k === 'p' && +el.value >= 100) o.fu.s = 'done'; else if (el.dataset.k === 'p' && +el.value > 0 && !o.fu.s) o.fu.s = 'run';
      persist(); re();
    });
  }
  function critTab(b, sy, re) {
    const R = critStats(sy);
    let lastAx = null;
    b.innerHTML = `<div class="btn-row" style="margin-bottom:8px"><span class="muted">تقدم إنجاز خطط العمل حسب كل معيار من معايير المشروع (من «تتبع المشروع»).</span><span class="sp"></span><button class="btn sm" data-doc="crit">${ic('print')} وثيقة تتبع المعايير</button></div>
      <div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>المعيار</th><th>العمليات</th><th>منجزة</th><th>في طور الإنجاز</th><th>لم تنطلق</th><th>مؤجلة / ملغاة</th><th>المبرمج (د)</th><th>المصروف (د)</th><th style="width:170px">نسبة الإنجاز</th></tr></thead><tbody>
      ${R.map(r => { const h = r.ax !== lastAx ? `<tr class="pe-axr"><td colspan="9"><b>${esc(norm(r.ax))}</b></td></tr>` : ''; lastAx = r.ax;
        return `${h}<tr><td>${esc(norm(r.cr))}</td><td class="num">${r.n}</td><td class="num pe-c-yes">${r.done}</td><td class="num pe-c-part">${r.run}</td><td class="num">${r.none}</td><td class="num">${r.post + r.drop}</td><td class="num">${money(r.H)}</td><td class="num">${money(r.sp)}</td><td><div class="pe-bar"><i style="width:${r.avg}%"></i></div><small>${r.avg}%</small></td></tr>`; }).join('') || '<tr><td colspan="9" class="muted">لا توجد عمليات</td></tr>'}
      </tbody></table></div></div>`;
    $$('[data-doc]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.doc }));
    void re;
  }
  function pvTab(b, sy) {
    const p = Y(sy).pv;
    const C = [['pv_cg', 'محضر مصادقة مجلس التدبير', 'مصادقة أعضاء مجلس التدبير على مشروع المؤسسة المندمج (نموذج مسار) مع لائحة الأعضاء المصادقين.', 'cg'],
      ['pv_dp', 'محضر مصادقة المديرية الإقليمية على المشروع وميزانيته', 'دراسة المشروع وميزانيته من طرف المديرية الإقليمية: معطيات المشروع، القرار، الملاحظات وتوقيعات اللجنة.', 'dp'],
      ['pv_cp', 'محضر مصادقة اللجنة الإقليمية على المشاريع وميزانيتها', 'مصادقة اللجنة الإقليمية على مشروع المؤسسة وميزانيته وتحديد الدعم المالي المرصود.', 'cp'],
      ['pv_team', 'محضر تشكيل فريق قيادة المشروع', 'اجتماع تشكيل فريق قيادة مشروع المؤسسة المندمج ولائحة الحاضرين.', 'team'],
      ['card', 'البطاقة التقنية لمشروع المؤسسة المندمج', 'عنوان المشروع ورؤيته وأهدافه الإستراتيجية وكلفته، مع التقرير المشترك مع مواكب(ة) جماعة الممارسة المهنية.', 'card']];
    b.innerHTML = `<div class="doc-cards">${C.map(([k, t, d, s]) => `<div class="card doc-card" data-k="${k}"><div class="e">📜</div><div><h3>${t}</h3><p>${d}</p>${(p[s] || {}).d ? `<p class="pe-c-yes" style="margin:4px 0 0">✔ بتاريخ ${esc(fmtDate(p[s].d))}</p>` : ''}</div></div>`).join('')}</div>`;
    $$('[data-k]', b).forEach(el => el.onclick = () => go('peiDoc', { kind: el.dataset.k }));
  }

  /* ================= printable documents ================= */
  const KINDS = [['team', 'وثيقة فريق القيادة'], ['eval', 'معايير التقييم الذاتي'], ['evf', 'متابعة التقييم الذاتي'], ['ind', 'المؤشرات الإستراتيجية للمشروع'], ['plan', 'وثيقة خطة العمل'], ['budget', 'وثيقة الميزانية'], ['contrib', 'وثيقة مجموع المساهمات'],
    ['follow', 'تتبع المشروع'], ['crit', 'تتبع معايير المشروع وخطط العمل'], ['pv_cg', 'محضر مصادقة مجلس التدبير'], ['pv_dp', 'محضر مصادقة المديرية الإقليمية على المشروع وميزانيته'], ['pv_cp', 'محضر مصادقة اللجنة الإقليمية على المشاريع وميزانيتها'], ['pv_team', 'محضر تشكيل فريق قيادة المشروع'], ['card', 'البطاقة التقنية للمشروع والتقرير المشترك']];
  const LAND = ['plan', 'follow', 'eval'];
  const idBox = (s, sy, extra) => `<table class="sb-t pe-id"><tbody>${[['الأكاديمية الجهوية', s.academy || ''], ['المديرية الإقليمية', s.directorate || ''], ['الجماعة', s.commune || ''], ['المؤسسة', s.school || ''], ['رمز المؤسسة', s.gresa || ''], ['السنة الدراسية', syl(sy)]].concat(extra || [])
    .reduce((a, x, i, A) => { if (i % 2 === 0) a.push(tr([{ t: x[0], c: 'pe-k' }, { t: x[1], c: 'b r' }].concat(A[i + 1] ? [{ t: A[i + 1][0], c: 'pe-k' }, { t: A[i + 1][1], c: 'b r' }] : [{ t: '', s: 2 }]))); return a; }, []).join('')}</tbody></table>`;
  const H4 = ts => thr(ts.map(t => ({ t, c: 'd' })));
  const mDH = (n, c) => ({ h: `<span dir="ltr">${money(n)} DH</span>`, c: 'nw ' + (c || '') });
  const cg = mm => `<colgroup>${mm.map(w => `<col style="width:${w}mm">`).join('')}</colgroup>`;
  const teamRows = sy => teamOf(sy).filter(r => norm(r[0]) || norm(r[2]));
  const members = (txt, def) => { const L = String(txt || '').split('\n').map(l => l.split('|').map(x => x.trim())).filter(r => r.some(Boolean)); return L.length ? L : def; };
  const asTxt = rows => rows.map(r => r.filter((x, i) => i < 3).join(' | ')).join('\n');
  const cgDef = sy => { try { if (window.Council) return Council.comp(sy).mgmt.filter(r => norm(r[0]) || norm(r[2])).map(r => [r[0] || '', r[2] || '', r[1] || '']); } catch (e) {} return [[S().director || '', 'مدير المؤسسة — رئيس المجلس', '']]; };
  const DP_DEF = [['', 'المدير(ة) الإقليمي(ة) أو من ينوب عنه(ا)'], ['', 'رئيس(ة) مصلحة تأطير المؤسسات التعليمية والتوجيه'], ['', 'رئيس(ة) مصلحة الشؤون الإدارية والمالية'], ['', 'المفتش(ة) التربوي(ة) المواكب(ة)'], ['', 'مواكب(ة) جماعة الممارسة المهنية']];
  const CP_DEF = [['', 'المدير(ة) الإقليمي(ة) — رئيس(ة) اللجنة'], ['', 'رئيس(ة) مصلحة الشؤون التربوية'], ['', 'رئيس(ة) مصلحة تأطير المؤسسات التعليمية والتوجيه'], ['', 'رئيس(ة) مصلحة الشؤون الإدارية والمالية'], ['', 'ممثل(ة) هيئة التفتيش والتأطير والمراقبة والتقييم'], ['', 'ممثل(ة) مديري المؤسسات التعليمية']];
  const signTbl = (rows, cols) => SB.tbl(H4(['ر.ت'].concat(cols, ['التوقيع'])), rows.map((r, i) => tr([i + 1].concat(cols.map((c, j) => ({ t: r[j] || '', c: j === 0 ? 'b r' : 'r' })), [{ t: '', c: 'pe-sig' }]))), 'big');
  function buildDoc(s, f) {
    const sy = f.sy, y = Y(sy), kind = f.kind, title = (KINDS.find(k => k[0] === kind) || KINDS[0])[1];
    const pages = o => SB.pages(s, Object.assign({ title, sub: `مشروع المؤسسة المندمج — الموسم الدراسي ${esc(syl(sy))}`, page: LAND.includes(kind) ? 'a4l' : 'a4' }, o));
    const ops = sortedOps(sy);
    if (kind === 'team') {
      const rows = teamRows(sy).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'ltr' }, { t: r[2], c: 'r' }]));
      const co = Object.entries(y.coord || {}).filter(([, n]) => norm(n));
      return pages({ blocks: [idBox(s, sy), SB.cap('لائحة فريق القيادة'), SB.tbl(H4(['ر.ت', 'الإسم والنسب', 'رقم التأجير', 'الصفة']), rows.length ? rows : [tr(['', '', '', ''])], 'big')].concat(co.length ? [SB.cap('منسقو الوحدات المدرسية'), SB.tbl(H4(['الوحدة المدرسية', 'المنسق(ة)']), co.map(([u, n]) => tr([{ t: u, c: 'b r' }, { t: n, c: 'r' }])), 'cmp')] : []) });
    }
    if (kind === 'eval' || kind === 'plan') {
      const blocks = [idBox(s, sy)];
      if (kind === 'plan') blocks.push(SB.tbl(H4(['الأولوية', 'القيمة', 'التوصيف']), PRIO.map(([v, l]) => tr([`الأولوية ${v}`, v, { t: l.split('— ')[1], c: 'r' }])), 'cmp pe-leg'));
      const byQ = new Map(); ops.forEach(o => { const k = +o.qid; (byQ.get(k) || byQ.set(k, []).get(k)).push(o); });
      // the axes and criteria, with the sub-criteria that have an answer or an operation
      const groups = [];
      REF(sy).axes.forEach(a => (a.c || []).forEach(c => { const qs = (c.q || []).filter(q => (kind === 'eval' ? answerOf(sy, q.id) || byQ.has(+q.id) : byQ.has(+q.id))); if (qs.length) groups.push({ ax: a.n, cr: c.n, qs: qs.map(q => ({ id: +q.id, t: q.t })) }); }));
      const orphan = ops.filter(o => !qOf(sy, o.qid)); if (orphan.length) { const M = new Map(); orphan.forEach(o => { const k = (o.ax || '') + '|' + (o.cr || ''); (M.get(k) || M.set(k, { ax: o.ax || '', cr: o.cr || '', qs: [] }).get(k)).qs.some(q => q.id === +o.qid) || M.get(k).qs.push({ id: +o.qid, t: o.sub || '' }); }); M.forEach(g => groups.push(g)); }
      // one table for the whole document (it is cut between the pages row by row): the axes and the criteria are coloured rows
      const nc = kind === 'eval' ? 4 : 13, rows = []; let lastAx = null;
      groups.forEach(g => {
        if (g.ax !== lastAx) { rows.push(tr([{ t: 'المحور: ' + norm(g.ax), c: 'b r pe-axc', s: nc }])); lastAx = g.ax; }
        rows.push(tr([{ t: 'المعيار: ' + norm(g.cr), c: 'b r pe-crc', s: nc }]));
        g.qs.forEach(q => {
          const L = byQ.get(q.id) || [], A = answerOf(sy, q.id);
          if (kind === 'eval') { rows.push(tr([{ t: norm(q.t), c: 'r b' }, { t: norm(A), c: 'r' }, { h: L.length ? L.map((o, i) => `${i + 1}. ${esc(norm(o.t))}`).join('<br>') : '—', c: 'r' }, { t: (y.ev[q.id] || {}).c || '', c: 'r sm' }])); return; }
          L.forEach((o, i) => rows.push(tr([{ t: i ? '' : norm(q.t), c: 'r b' + (i ? ' pe-cont' : '') }, { t: i ? '' : norm(A), c: 'r sm' + (i ? ' pe-cont' : '') }, i + 1, { t: norm(o.t), c: 'r' }, o.G || '', { t: num(o.H) == null ? '' : money(o.H), c: 'nw' }, { t: num(o.I) == null ? '' : money(o.I), c: 'nw' }, { t: norm(o.J), c: 'r sm' }, { t: num(o.K) == null ? '' : money(o.K), c: 'nw' }, { t: norm(o.L), c: 'r sm' }, { t: norm(o.M), c: 'r sm' }, dmy(o.O), dmy(o.P)])));
        });
      });
      if (rows.length) blocks.push(kind === 'eval' ? { table: { cls: 'sb-t cmp pe-ev', head: H4(['المعيار الفرعي', 'التقييم', 'العمليات المقترحة', 'تعليق']), rows, colgroup: cg([62, 58, 110, 35]) } }
        : { table: { cls: 'sb-t cmp pe-pl', head: H4(['المعيار الفرعي', 'التقييم', 'رقم', 'العملية', 'الأولوية', 'المبلغ', 'ميزانية جمعية النجاح', 'الجهة المساهمة', 'قيمة المساهمة', 'مجالات الصرف', 'أسطر الصرف', 'تاريخ البداية', 'تاريخ النهاية']), rows, colgroup: cg([30, 26, 7, 42, 11, 14, 15, 22, 14, 24, 30, 16, 16]) } });
      if (kind === 'plan') { const T = totals(sy); blocks.push(SB.tbl(H4(['العمليات', 'المبلغ الإجمالي', 'ميزانية جمعية دعم مدرسة النجاح', 'مساهمات الشركاء']), [tr([T.ops, { t: dh(T.H), c: 'nw b' }, { t: dh(T.I), c: 'nw b' }, { t: dh(T.K), c: 'nw b' }])], 'cmp')); }
      if (groups.length === 0) blocks.push('<p class="sb-p">لا توجد معطيات بعد.</p>');
      return pages({ blocks });
    }
    if (kind === 'evf') {
      const S0 = evStats(sy), rows = [];
      S0.forEach(a => { rows.push(tr([{ t: norm(a.n), c: 'b r pe-axc', s: 8 }])); a.crit.forEach(r => rows.push(tr([{ t: norm(r.n), c: 'r' }, r.q, r.ans, r.yes, r.part, r.no, r.ops, { t: money(r.H), c: 'nw' }]))); });
      const all = S0.reduce((x, a) => x.concat(a.crit), []), sm = k => all.reduce((t, r) => t + r[k], 0);
      rows.push(tr([{ t: 'المجموع', c: 'b' }, sm('q'), sm('ans'), sm('yes'), sm('part'), sm('no'), sm('ops'), { t: money(sm('H')), c: 'nw b' }], 'tot'));
      return pages({ blocks: [idBox(s, sy), SB.tbl(H4(['المعيار', 'المعايير الفرعية', 'المجاب عنها', 'إيجابي', 'جزئي', 'سلبي', 'العمليات', 'الكلفة (د)']), rows, 'cmp'), `<p class="sb-p" style="font-size:9pt">نسبة التعبئة: ${pc(sm('ans'), sm('q'))}% — التصنيف حسب صيغة الجواب («نعم…» إيجابي، «نسبيا…» جزئي، «لا…» سلبي).</p>`] });
    }
    if (kind === 'ind') {
      const I = IND(sy), Ys = indYears(sy), y1 = Ys[0], v = x => (x === '' || x == null ? '' : x + ' %');
      const blocks = [idBox(s, sy)];
      blocks.push(SB.tbl(H4(['الهدف 1', GOALS[0].t]), [tr([{ t: 'المؤشر', c: 'b' }, { t: GOALS[0].i, c: 'r' }])], 'cmp pe-gl'));
      blocks.push(SB.tbl(H4([`الوضعية الحالية ${y1}`].concat(SUBJ3.map(x => x[1]))), LV6.map((l, i) => tr([`المستوى ${l}`].concat(SUBJ3.map(([k]) => v((I.g1.cur[i + 1] || {})[k]))))).concat(Ys.map(yy => tr([{ t: `المؤشرات المتوقعة لسنة ${yy}`, c: 'b' }].concat(SUBJ3.map(([k]) => ({ t: v((I.g1.exp[yy] || {})[k]), c: 'b' })))))), 'cmp'));
      blocks.push(SB.tbl(H4(['الهدف 2', GOALS[1].t]), [tr([{ t: 'المؤشر', c: 'b' }, { t: GOALS[1].i, c: 'r' }])], 'cmp pe-gl'));
      blocks.push(SB.tbl(H4([`الوضعية الحالية ${y1}`, 'النسبة']), DROP.map(([k, l]) => tr([{ t: l, c: 'r' }, v(I.g2.cur[k])])).concat(Ys.map(yy => tr([{ t: `المؤشرات المتوقعة لسنة ${yy}`, c: 'b r' }, { t: v(I.g2.exp[yy]), c: 'b' }]))), 'cmp'));
      const u3 = x => (x === '' || x == null ? '' : x + (I.g3.u === 'h' ? ' ساعة' : ' %'));
      blocks.push(SB.tbl(H4(['الهدف 3', GOALS[2].t]), [tr([{ t: 'المؤشر', c: 'b' }, { t: GOALS[2].i, c: 'r' }])], 'cmp pe-gl'));
      blocks.push(SB.tbl(H4(['', 'القيمة']), [tr([{ t: `الوضعية الحالية ${y1}`, c: 'r' }, u3(I.g3.cur)])].concat(Ys.map(yy => tr([{ t: `المؤشرات المتوقعة لسنة ${yy}`, c: 'b r' }, { t: u3(I.g3.exp[yy]), c: 'b' }]))), 'cmp'));
      return pages({ blocks });
    }
    if (kind === 'budget') {
      const M = new Map();
      ops.filter(o => norm(o.L) || N(o.I) || N(o.K)).forEach(o => { const L = norm(o.L) || 'مجال غير محدد', Ln = norm(o.M) || 'سطر غير محدد'; const d = M.get(L) || M.set(L, new Map()).get(L); const r = d.get(Ln) || d.set(Ln, { I: 0, K: 0 }).get(Ln); r.I += N(o.I); r.K += N(o.K); });
      const order = domNames(sy).map(norm); const doms = Array.from(M.keys()).sort((a, b) => (order.indexOf(a) + 1 || 99) - (order.indexOf(b) + 1 || 99));
      const rows = []; let tI = 0, tK = 0;
      doms.forEach(d => { const L = Array.from(M.get(d).entries()); let sI = 0, sK = 0;
        L.forEach(([ln, r], i) => { sI += r.I; sK += r.K; rows.push(tr([{ t: i ? '' : d, c: 'b r pe-dm' + (i ? ' pe-cont' : '') }, { t: ln, c: 'r' }, mDH(r.I), mDH(r.K)])); });
        rows.push(tr([{ t: '', c: 'pe-dm pe-cont' }, { t: 'المجموع الجزئي', c: 'b pe-sub' }, mDH(sI, 'b pe-sub'), mDH(sK, 'b pe-sub')])); tI += sI; tK += sK; });
      rows.push(tr([{ t: 'المجموع العام', c: 'b pe-tot', s: 2 }, mDH(tI, 'b pe-tot'), mDH(tK, 'b pe-tot')]));
      const env = num(y.env);
      return pages({ blocks: [idBox(s, sy), SB.tbl(H4(['المجالات', 'بنود الميزانية', 'منحة جمعية مدرسة النجاح', 'مساهمات أخرى']), rows.length > 1 ? rows : [tr(['', '', '', ''])], 'cmp pe-bud')].concat(env ? [`<p class="sb-p">الغلاف المالي المرصود لجمعية دعم مدرسة النجاح: <b>${dh(env)}</b> — المبرمج: <b>${dh(tI)}</b> — ${tI > env ? `التجاوز: <b>${dh(tI - env)}</b>` : `المتبقي: <b>${dh(env - tI)}</b>`}</p>`] : []) });
    }
    if (kind === 'contrib') {
      const T = totals(sy), C = PA(sy).contrib.length ? PA(sy).contrib : Object.keys(T.by);
      const used = C.filter(c => ops.some(o => norm(o.J) === norm(c)));
      const rows = used.map(c => tr([{ t: norm(c), c: 'b r' }, { t: isDir(c) && !T.by[norm(c)] ? '' : money(T.by[norm(c)] || 0), c: 'nw' }]));
      return pages({ blocks: [idBox(s, sy), SB.cap('إجمالي المساهمات'), SB.tbl(H4(['الجهة المساهمة', 'المبلغ بالدرهم']), rows.length ? rows : [tr(['—', ''])], 'big'),
        SB.tbl(H4(['', '']), [tr([{ t: 'إجمالي المبلغ للجهات المساهمة بالدرهم', c: 'b r' }, { t: money(T.K), c: 'nw b' }]), tr([{ t: 'إجمالي ميزانية جمعية مدرسة النجاح بالدرهم', c: 'b r' }, { t: money(T.I), c: 'nw b' }]), tr([{ t: 'الكلفة الإجمالية للمشروع بالدرهم', c: 'b r' }, { t: money(T.H), c: 'nw b' }])], 'big pe-nohead'),
        `<p class="sb-p">وضعية المشروع: <b>${esc(stage(sy))}</b></p>`] });
    }
    if (kind === 'follow') {
      const rows = []; let lastAx = null;
      ops.forEach(o => { const p = placeOf(sy, o), fu = o.fu || {}; if (p.ax !== lastAx) { rows.push(tr([{ t: norm(p.ax), c: 'b r pe-axc', s: 10 }])); lastAx = p.ax; }
        rows.push(tr([{ t: norm(p.cr), c: 'r sm' }, { t: norm(o.t), c: 'r' }, o.G || '', { t: money(N(o.H)), c: 'nw' }, { t: money(N(o.I)), c: 'nw' }, fuL(fu.s), fuPct(o) + '%', { t: fu.sp ? money(fu.sp) : '', c: 'nw' }, fu.d ? fmtDate(fu.d) : '', { t: fu.n || '', c: 'r sm' }])); });
      const H = ops.reduce((a, o) => a + N(o.H), 0), sp = ops.reduce((a, o) => a + N((o.fu || {}).sp), 0), avgP = ops.length ? Math.round(ops.reduce((a, o) => a + fuPct(o), 0) / ops.length) : 0;
      rows.push(tr([{ t: 'المجموع', c: 'b', s: 3 }, { t: money(H), c: 'nw b' }, { t: money(ops.reduce((a, o) => a + N(o.I), 0)), c: 'nw b' }, `${ops.filter(o => (o.fu || {}).s === 'done').length} منجزة`, avgP + '%', { t: money(sp), c: 'nw b' }, '', ''], 'tot'));
      return pages({ blocks: [idBox(s, sy), { table: { cls: 'sb-t cmp pe-fu', head: H4(['المعيار', 'العملية', 'الأولوية', 'المبلغ (د)', 'ميزانية الجمعية (د)', 'الحالة', 'الإنجاز', 'المصروف (د)', 'تاريخ الإنجاز', 'ملاحظات']), rows, colgroup: cg([42, 72, 12, 18, 18, 20, 13, 18, 20, 32]) } }] });
    }
    if (kind === 'crit') {
      const R = critStats(sy), rows = []; let lastAx = null;
      R.forEach(r => { if (r.ax !== lastAx) { rows.push(tr([{ t: norm(r.ax), c: 'b r pe-axc', s: 8 }])); lastAx = r.ax; } rows.push(tr([{ t: norm(r.cr), c: 'r' }, r.n, r.done, r.run, r.none, r.post + r.drop, { t: `${money(r.sp)} / ${money(r.H)}`, c: 'nw' }, { h: `<div class="pe-pbar"><i style="width:${r.avg}%"></i></div>${r.avg}%` }])); });
      return pages({ blocks: [idBox(s, sy), SB.tbl(H4(['المعيار', 'العمليات', 'منجزة', 'في طور الإنجاز', 'لم تنطلق', 'مؤجلة / ملغاة', 'المصروف / المبرمج (د)', 'نسبة الإنجاز']), rows.length ? rows : [tr(['—'])], 'cmp')] });
    }
    const P = k => (y.pv[k] = y.pv[k] || {});
    const ldate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${Dx.MONTHS[+m[2] - 1]} ${m[1]}` : '……………………'; };
    const T = totals(sy);
    if (kind === 'pv_cg') {
      const p = P('cg'), M = members(p.m, cgDef(sy));
      const intro = `<div class="sb-pv"><p>اجتمع أعضاء مجلس تدبير ${esc(s.school || 'المؤسسة')}${s.commune ? ' بجماعة ' + esc(s.commune) : ''} يوم ${esc(ldate(p.d))}${p.place ? ' ب' + esc(p.place) : ''}، للتداول بشأن مشروع المؤسسة المندمج للموسم الدراسي ${esc(syl(sy))} الذي أعده فريق القيادة استنادا إلى نتائج التقييم الذاتي، ${p.dec === 'maj' ? 'وتمت المصادقة عليه بالأغلبية' : 'وتمت المصادقة عليه بالإجماع'}.</p>
        <p>يشهد أعضاء مجلس التدبير الموقعون في اللائحة رفقته أن مشروع المؤسسة المندمج:</p></div>`;
      return pages({ title: 'محضر المصادقة على مشروع المؤسسة المندمج من طرف مجلس التدبير', page: 'a4', sign: SB.sign(s, { left: 'توقيع وخاتم رئيس المجلس', date: p.d || undefined }),
        blocks: [SB.tbl(H4(['', '', '', '']), [tr([{ t: 'المديرية الإقليمية', c: 'pe-k' }, { t: s.directorate || '', c: 'b r' }, { t: 'التاريخ', c: 'pe-k' }, p.d ? fmtDate(p.d) : '']), tr([{ t: 'المؤسسة', c: 'pe-k' }, { t: s.school || '', c: 'b r' }, { t: 'رمز GRESA', c: 'pe-k' }, { t: s.gresa || '', c: 'ltr b' }])], 'cmp pe-nohead'), intro,
          SB.tbl(H4(['', '']), [['قد تمت صياغته بمنهجية تشاركية؛'], ['يستجيب للمعايير المطلوبة؛'], ['يحترم الإطار الميزانياتي التوقعي' + (T.I ? ` (ميزانية جمعية دعم مدرسة النجاح: ${dh(T.I)}، الكلفة الإجمالية: ${dh(T.H)})` : '') + '؛'], ['أنهم اطلعوا على المشروع وناقشوه وصادقوا عليه.']].map((r, i) => tr([i + 1, { t: r[0], c: 'r' }])), 'cmp pe-nohead'),
          '<div class="sb-pv"><p>وبذلك يلتمسون من السيد(ة) مدير(ة) المؤسسة إرساله إلى المديرية الإقليمية من أجل المصادقة والحصول على الدعم المالي المرصود.</p></div>',
          SB.cap('لائحة أعضاء مجلس التدبير المصادقين'), signTbl(M, ['الاسم والنسب', 'الصفة', 'رقم التأجير'])].concat(norm(p.abs) ? [SB.cap('المتغيبون'), SB.tbl(H4(['ر.ت', 'الاسم والنسب', 'أسباب الغياب']), members(p.abs, []).map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1] || '', c: 'r' }])), 'cmp')] : []) });
    }
    if (kind === 'pv_dp' || kind === 'pv_cp') {
      const dp = kind === 'pv_dp', p = P(dp ? 'dp' : 'cp'), M = members(p.m, dp ? DP_DEF : CP_DEF), env = num(p.amt) || num(y.env);
      const DEC = dp ? [['ok', 'المصادقة على المشروع وميزانيته'], ['mod', 'المصادقة على المشروع مع إدخال التعديلات المشار إليها'], ['back', 'إرجاع المشروع إلى المؤسسة لاستكماله وإعادة عرضه']] : [['ok', 'المصادقة على المشروع وميزانيته ورصد الدعم المالي'], ['mod', 'المصادقة مع ملاحظات'], ['back', 'عدم المصادقة وإرجاع المشروع']];
      const dec = p.dec || 'ok';
      const info = SB.tbl(H4(['', '']), [['المؤسسة التعليمية', s.school || ''], ['رمز المؤسسة', s.gresa || ''], ['الجماعة', s.commune || ''], ['مدير(ة) المؤسسة', s.director || ''], ['عدد العمليات المبرمجة', String(T.ops)], ['الكلفة الإجمالية للمشروع', dh(T.H)], ['ميزانية جمعية دعم مدرسة النجاح', dh(T.I)], ['مساهمات الشركاء', dh(T.K)]].concat(env ? [['الدعم المالي المرصود', dh(env)]] : []).map(r => tr([{ t: r[0], c: 'pe-k' }, { t: r[1], c: 'b r' }])), 'cmp pe-nohead');
      const head = `<div class="sb-pv"><p>${dp ? 'اجتمعت لجنة المديرية الإقليمية' : 'اجتمعت اللجنة الإقليمية للمصادقة على مشاريع المؤسسات المندمجة'}${s.directorate ? ' ب' + esc(s.directorate) : ''} يوم ${esc(ldate(p.d))}${p.place ? ' ب' + esc(p.place) : ''}، ${dp ? 'لدراسة مشروع المؤسسة المندمج وميزانيته' : 'لدراسة مشاريع المؤسسات التعليمية وميزانياتها'} برسم الموسم الدراسي ${esc(syl(sy))}، وذلك طبقا للدليل الإجرائي لمشروع المؤسسة المندمج.</p><p>وبعد الاطلاع على وثائق المشروع (التقييم الذاتي، خطة العمل، وثيقة الميزانية ومحضر مصادقة مجلس التدبير${(Y(sy).pv.cg || {}).d ? ' بتاريخ ' + esc(fmtDate(Y(sy).pv.cg.d)) : ''})، تقرر ما يلي:</p></div>`;
      const decH = `<div class="sb-pv">${DEC.map(([k, l]) => `<p><span class="sb-chk">${k === dec ? '✓' : ''}</span> ${l}</p>`).join('')}${norm(p.obs) ? `<p><b>ملاحظات وتوصيات اللجنة:</b> ${esc(p.obs)}</p>` : '<p><b>ملاحظات وتوصيات اللجنة:</b> ……………………………………………………………………………………</p>'}</div>`;
      return pages({ title: dp ? 'محضر مصادقة المديرية الإقليمية على مشروع المؤسسة المندمج وميزانيته' : 'محضر مصادقة اللجنة الإقليمية على مشاريع المؤسسات وميزانيتها', page: 'a4', sign: false,
        blocks: [head, info, SB.cap('قرار اللجنة'), decH, SB.cap(dp ? 'أعضاء اللجنة' : 'أعضاء اللجنة الإقليمية'), signTbl(M, ['الاسم والنسب', 'الصفة']), SB.sign(s, { left: dp ? 'المدير(ة) الإقليمي(ة)' : 'رئيس(ة) اللجنة الإقليمية', date: p.d || undefined, city: s.directorate || s.city })] });
    }
    if (kind === 'pv_team') {
      const p = P('team'), M = teamRows(sy), pres = members(p.m, M.map(r => [r[0], r[2], r[1]]));
      return pages({ title: 'محضر اجتماع لتشكيل فريق قيادة مشروع المؤسسة المندمج', page: 'a4', sign: SB.sign(s, { left: 'مدير(ة) المؤسسة', date: p.d || undefined }),
        blocks: [`<div class="sb-pv"><p>تطبيقا لأحكام القانون الإطار رقم 51.17 المتعلق بمنظومة التربية والتكوين والبحث العلمي، وتفعيلا لالتزامات خارطة الطريق 2022-2026 «من أجل مدرسة عمومية ذات جودة للجميع» الرامية إلى تحقيق أهدافها الإستراتيجية الثلاثة: مضاعفة نسبة تلميذات وتلاميذ السلك الابتدائي المتحكمين في التعلمات الأساس، تقليص نسبة الهدر المدرسي، ومضاعفة نسبة المستفيدات والمستفيدين من الأنشطة الموازية،</p>
          <p>انعقد يوم ${esc(ldate(p.d))}${p.place ? ' ب' + esc(p.place) : ''} اجتماع لتشكيل فريق قيادة مشروع المؤسسة المندمج للموسم الدراسي ${esc(syl(sy))} بحضور الأطر التربوية والإدارية العاملة بالمؤسسة وممثلي جمعية أمهات وآباء وأولياء التلاميذ والمتعلمين. وبعد عرض حول سيرورة إعداد المشروع وتفعيله، ومسطرة المصادقة، وتمويل المشروع، والبرمجة الزمنية، وآليات المواكبة والتتبع، وبنيات الحكامة، ونقاش مستفيض، خلص الجمع إلى التشكيلة التالية لفريق القيادة:</p></div>`,
          SB.tbl(H4(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الصفة']), M.map((r, i) => tr([i + 1, { t: r[0], c: 'b r' }, { t: r[1], c: 'ltr' }, { t: r[2], c: 'r' }])), 'cmp'),
          SB.cap('الحاضرون'), signTbl(pres, ['الاسم والنسب', 'الصفة', 'رقم التأجير'])] });
    }
    if (kind === 'card') {
      const p = P('card'), goals = [p.g1 || GOALS[0].t, p.g2 || GOALS[1].t, p.g3 || GOALS[2].t];
      const rows = [['اسم المؤسسة', s.school || ''], ['رمز المؤسسة', s.gresa || ''], ['اسم مدير(ة) المؤسسة', s.director || ''], ['هاتف المدير(ة)', p.tel || s.phone || ''], ['جماعة الممارسة المهنية ومقرها', p.cop || ''], ['منسق(ة) / مواكب(ة) جماعة الممارسة المهنية', p.acc || ''], ['عنوان المشروع المندمج', p.title || ''], ['مدة المشروع', `الموسم الدراسي ${syl(sy)}`], ['الرؤية المحلية لمشروع المؤسسة', p.vision || '']]
        .map(r => tr([{ t: r[0], c: 'pe-k' }, { t: r[1], c: 'r b' }])).concat(goals.map((g, i) => tr([{ t: `الهدف الإستراتيجي ${['الأول', 'الثاني', 'الثالث'][i]}`, c: 'pe-k' }, { t: g, c: 'r' }]))).concat([tr([{ t: 'الكلفة الإجمالية', c: 'pe-k' }, { t: dh(T.H) + ` (منها ميزانية جمعية دعم مدرسة النجاح: ${dh(T.I)}، ومساهمات الشركاء: ${dh(T.K)})`, c: 'r b' }])]);
      const ITEMS = ['تحديد المرجعيات المؤطرة لمشروع المؤسسة المندمج', 'اعتماد منهجية المراحل الست لبناء المشروع', 'يهدف المشروع إلى تجويد التعلمات والنجاح المدرسي', 'تشخيص وضعية المؤسسة (التقييم الذاتي)', 'الأهداف الإستراتيجية للمشروع', 'مقاربة النوع والإدماج الاجتماعي', 'نتائج منتظرة واضحة وواقعية', 'إجراءات وعمليات مضبوطة في مخطط عمل واضح وإجرائي', 'المشروع يغطي مشاريع تنزيل القانون الإطار 51.17', 'اعتماد المشروع على موارد (بشرية ومالية...) واقعية', 'اعتماد مؤشرات واضحة للضبط والتقويم', 'تحديد خطة للانتقال إلى مشروع مطور'];
      return pages({ title: 'البطاقة التقنية لمشروع المؤسسة المندمج', page: 'a4', sign: SB.sign(s, { left: 'مواكب(ة) جماعة الممارسة المهنية', right: '<b>توقيع مدير(ة) المؤسسة</b>' }),
        blocks: [SB.tbl(H4(['', '']), rows, 'cmp pe-nohead'), SB.cap('التقرير المشترك بين مدير(ة) المؤسسة ومواكب(ة) جماعة الممارسة المهنية'),
          `<div class="sb-pv"><p>قام الفريق الإداري والتربوي بإيداع مشروع المؤسسة للموسم ${esc(syl(sy))} تحت عنوان: <b>${esc(p.title || '……………………………………')}</b>. يتوخى هذا المشروع تحقيق النتائج التالية: ${esc(p.res || '……………………………………………………………………')}</p></div>`,
          SB.tbl(H4(['عناصر مصادقة المواكب', 'محقق', 'نسبي', 'غير محقق', 'ملاحظات']), ITEMS.map(t => tr([{ t, c: 'r' }, '', '', '', ''])), 'cmp')] });
    }
    return ['<p>—</p>'];
  }
  // fields of the documents (forms of the preview page)
  const FORMS = {
    pv_cg: [['d', 'تاريخ الاجتماع', 'date'], ['place', 'مكان الاجتماع'], ['dec', 'المصادقة', 'sel', [['all', 'بالإجماع'], ['maj', 'بالأغلبية']]], ['m', 'أعضاء مجلس التدبير (سطر لكل عضو: الاسم | الصفة | رقم التأجير)', 'area', sy => asTxt(cgDef(sy))], ['abs', 'المتغيبون (الاسم | سبب الغياب)', 'area']],
    pv_dp: [['d', 'تاريخ المصادقة', 'date'], ['place', 'المكان'], ['dec', 'القرار', 'sel', [['ok', 'المصادقة على المشروع وميزانيته'], ['mod', 'المصادقة مع تعديلات'], ['back', 'إرجاع المشروع لاستكماله']]], ['amt', 'الدعم المالي المرصود (د)', 'num'], ['obs', 'ملاحظات وتوصيات', 'area'], ['m', 'أعضاء اللجنة (الاسم | الصفة)', 'area', () => asTxt(DP_DEF)]],
    pv_cp: [['d', 'تاريخ المصادقة', 'date'], ['place', 'المكان'], ['dec', 'القرار', 'sel', [['ok', 'المصادقة ورصد الدعم المالي'], ['mod', 'المصادقة مع ملاحظات'], ['back', 'عدم المصادقة']]], ['amt', 'الدعم المالي المرصود (د)', 'num'], ['obs', 'ملاحظات وتوصيات', 'area'], ['m', 'أعضاء اللجنة الإقليمية (الاسم | الصفة)', 'area', () => asTxt(CP_DEF)]],
    pv_team: [['d', 'تاريخ الاجتماع', 'date'], ['place', 'مكان الاجتماع'], ['m', 'الحاضرون (الاسم | الصفة | رقم التأجير) — فارغ = أعضاء فريق القيادة', 'area']],
    card: [['title', 'عنوان المشروع المندمج'], ['vision', 'الرؤية المحلية لمشروع المؤسسة', 'area'], ['g1', 'الهدف الإستراتيجي الأول'], ['g2', 'الهدف الإستراتيجي الثاني'], ['g3', 'الهدف الإستراتيجي الثالث'], ['res', 'النتائج المنتظرة', 'area'], ['tel', 'هاتف المدير(ة)'], ['cop', 'جماعة الممارسة المهنية ومقرها'], ['acc', 'منسق(ة) / مواكب(ة) جماعة الممارسة المهنية']]
  };
  const PVK = { pv_cg: 'cg', pv_dp: 'dp', pv_cp: 'cp', pv_team: 'team', card: 'card' };
  window.pagePeiDoc = function (v, arg) {
    migrate(DB);
    const sy0 = st.sy || MK.curSy();
    MK.docPage(v, {
      title: 'وثائق مشروع المؤسسة المندمج', icon: '🎯', modes: false, word: true, state: { sy: sy0, kind: (arg && arg.kind) || 'plan' },
      back: () => go('pei', { part: /^(pv_|card)/.test((arg && arg.kind) || '') ? 'pv' : /^(follow|crit)$/.test((arg && arg.kind) || '') ? 'view' : 'prep' }),
      form: function form(box, s0, refresh) {
        const F = FORMS[s0.kind] || [], p = PVK[s0.kind] ? (Y(s0.sy).pv[PVK[s0.kind]] = Y(s0.sy).pv[PVK[s0.kind]] || {}) : null;
        box.innerHTML = `<div class="fld"><label>الوثيقة</label><select class="inp" id="pdK">${KINDS.map(([k, l]) => `<option value="${k}" ${k === s0.kind ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          <div class="fld"><label>الموسم الدراسي</label><select class="inp" id="pdY">${MK.syList(Object.keys(DB.pei.years)).map(x => `<option value="${x}" ${x === s0.sy ? 'selected' : ''}>${esc(syl(x))}</option>`).join('')}</select></div>
          ${F.map(([k, l, t, o]) => { const val = p[k] == null ? '' : p[k]; return t === 'area' ? `<div class="fld"><label>${l}</label><textarea class="inp" data-k="${k}" rows="${k === 'm' ? 7 : 3}" placeholder="${esc(typeof o === 'function' ? o(s0.sy) : '')}">${esc(val)}</textarea></div>`
            : t === 'sel' ? `<div class="fld"><label>${l}</label><select class="inp" data-k="${k}">${o.map(([a, b2]) => `<option value="${a}" ${String(val || o[0][0]) === a ? 'selected' : ''}>${b2}</option>`).join('')}</select></div>`
            : `<div class="fld"><label>${l}</label><input class="inp" data-k="${k}" type="${t === 'date' ? 'date' : t === 'num' ? 'number' : 'text'}" value="${esc(val)}"></div>`; }).join('')}
          ${p && FORMS[s0.kind].some(x => x[0] === 'm' && x[3]) ? '<p class="hint" style="font-size:12px">الخانة الفارغة تأخذ القيم المقترحة الظاهرة بداخلها.</p>' : ''}`;
        $('#pdK', box).onchange = e => { s0.kind = e.target.value; form(box, s0, refresh); refresh(); };
        $('#pdY', box).onchange = e => { s0.sy = e.target.value; form(box, s0, refresh); refresh(); };
        $$('[data-k]', box).forEach(el => { el.oninput = el.onchange = () => { p[el.dataset.k] = el.value; later(); refresh(); }; });
      },
      build: s0 => ({ page: LAND.includes(s0.kind) ? 'a4l' : 'a4', pages: buildDoc(S(), s0) }),
      fname: s0 => (KINDS.find(k => k[0] === s0.kind) || KINDS[0])[1].replace(/\s+/g, '_') + '_' + MK.syDash(s0.sy)
    });
  };

  /* ---------- styles ---------- */
  Dx.modCss += `
  .pe-id td{padding:1.2mm 2mm}.pe-id .pe-k,.sb-t .pe-k{background:#dbe5f1;font-weight:700;width:30mm;text-align:right}
  .pe-dax{background:#b4c6e7;color:#1f3864;font-weight:700;padding:1.2mm 2mm;margin-top:3mm;border:1px solid #1f3864;font-size:10.5pt}
  .pe-dcr{background:#d9d9d9;font-weight:700;padding:1mm 2mm;border:1px solid #777;border-top:0;font-size:9.6pt}
  .sb-t.pe-pl td,.sb-t.pe-pl th{font-size:7.6pt;padding:.6mm .8mm}.sb-t td.pe-cont{border-top-color:transparent}
  .sb-t.pe-ev td{font-size:8.6pt}.sb-t .pe-axc{background:#b4c6e7;color:#1f3864}.sb-t .pe-crc{background:#e7e6e6}
  .sb-t.pe-bud .pe-sub{background:#bfbfbf}.sb-t.pe-bud .pe-tot{background:#ffff00}.sb-t.pe-bud .pe-dm{background:#f2f2f2;width:38mm}
  .sb-t.pe-nohead thead{display:none}.sb-t.pe-gl th{background:#1f3864;color:#fff}.sb-t.pe-leg{width:60%;margin:0 auto 2mm}
  .sb-t td.pe-sig{width:30mm;height:9mm}.sb-t.pe-fu td{font-size:8pt}
  .pe-pbar{display:inline-block;width:22mm;height:2.6mm;border:1px solid #1f3864;vertical-align:middle;margin-inline-end:1.5mm}.pe-pbar i{display:block;height:100%;background:#2f7d32}`;
  { const c = document.createElement('style'); c.textContent = `
  .pe-seg{flex-wrap:wrap}.pe-n{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:50%;background:var(--sec,#a4570b);color:#fff;font-size:11px;margin-inline-end:4px}
  .pe-bar-row{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 12px;align-items:stretch}
  .pe-kpi{background:var(--card,#fff);border:1px solid var(--line,#dde3ea);border-radius:10px;padding:8px 12px;min-width:120px;display:flex;flex-direction:column;gap:3px}
  .pe-kpi span{font-size:12px;color:var(--muted,#5b6573)}.pe-kpi b{font-size:17px}.pe-kpi small{font-size:11.5px}.pe-kpi.bad{border-color:#e0a2a2;background:#fff6f6}.pe-kpi.good b{color:#1f7a45}.pe-kpi.bad b{color:#b42318}
  .pe-flt{margin-inline-start:auto;align-items:center}
  .pe-bar{height:7px;border-radius:5px;background:#e9edf2;overflow:hidden;min-width:90px}.pe-bar i{display:block;height:100%;background:var(--sec,#a4570b)}.pe-bar.bad i{background:#c0392b}
  .pe-ax{margin:0 0 10px}.pe-ax>summary{cursor:pointer;padding:9px 12px;background:var(--secl,#f6efe6);border-radius:10px;font-size:14.5px}
  .pe-cr{margin-top:10px}.pe-q{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:10px;padding:10px 0;border-top:1px solid #eef1f5}.pe-q:first-child{border-top:0}
  .pe-qt{display:flex;flex-direction:column;gap:6px}.pe-qtt{font-weight:600;line-height:1.7}.pe-insp{font-size:12.5px;color:#5b6573;background:#f5f7fa;border-radius:8px;padding:6px 8px}
  .pe-oi{display:flex;gap:6px;align-items:center;margin-bottom:5px}.pe-oi input{flex:1}.pe-on{display:inline-flex;align-items:center;justify-content:center;min-width:24px;height:24px;border-radius:7px;background:#eef2f7;font-weight:700;font-size:12px}
  .pe-c-yes{color:#1f7a45}.pe-c-part{color:#9a6700}.pe-c-no{color:#b42318}select.pe-c-yes,select.pe-c-part,select.pe-c-no{font-weight:600}
  .pe-axr td{background:var(--secl,#f6efe6)}.pe-ul{margin:0;padding-inline-start:20px;line-height:1.9;font-size:13px}
  .pe-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}.pe-g4{display:grid;grid-template-columns:1.2fr 1fr 1fr 1fr;gap:8px}
  .pe-steps{margin:0 0 10px;padding-inline-start:20px;line-height:1.9;font-size:13px}.pe-file th{width:180px;text-align:right}
  .pe-msgs{margin-top:8px;font-size:12.8px;line-height:1.8;max-height:260px;overflow:auto}.pe-msgs .e{color:#b42318}.pe-msgs .w{color:#9a6700}.pe-msgs .ok{color:#1f7a45;font-weight:600}
  .pe-tools{margin-bottom:10px}.pe-axh{margin:14px 0 6px;padding:8px 12px;background:var(--sec,#a4570b);color:#fff;border-radius:9px;font-weight:700}
  .pe-qh{display:flex;justify-content:space-between;gap:10px;align-items:flex-end;margin:10px 2px 4px;font-size:13px}.pe-qh small{display:block;color:#5b6573}.pe-qh b{font-size:13.5px}.pe-qh span{font-size:12px;max-width:45%;text-align:left}
  .pe-op{border:1px solid #e3e8ef;border-inline-start:4px solid #1f7a45;border-radius:10px;padding:8px 10px;margin:0 0 8px;background:var(--card,#fff)}
  .pe-op.err{border-inline-start-color:#c0392b;background:#fffafa}.pe-op.warn{border-inline-start-color:#d4a017}
  .pe-op .r1{display:grid;grid-template-columns:30px minmax(0,1fr) 120px 70px;gap:8px;align-items:end}.pe-op textarea{resize:vertical;min-height:34px;line-height:1.6}
  .pe-op .r2{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:6px}.pe-op .r3{display:grid;grid-template-columns:1.1fr 1.5fr .7fr .8fr .8fr;gap:8px;margin-top:6px}
  .pe-op label{font-size:11.5px;color:#5b6573;display:block;margin-bottom:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pe-op .pe-auto{background:#f4f8f4}.pe-st{text-align:center;font-size:16px;line-height:1.2}.pe-st small{display:block;font-size:10.5px;color:#5b6573}
  .pe-msg{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px;font-size:12.3px;align-items:center}.pe-msg .e{color:#b42318}.pe-msg .w{color:#9a6700}.pe-sg{font-size:12px}
  .pe-note{background:#fff8e6;border:1px solid #f0d58a;border-radius:9px;padding:8px 12px;margin:0 0 10px;font-size:13px}
  .pe-fu input,.pe-fu select{min-width:0;width:100%}
  @media (max-width:900px){.pe-q{grid-template-columns:1fr}.pe-op .r2,.pe-op .r3,.pe-g4,.pe-g3{grid-template-columns:1fr 1fr}.pe-op .r1{grid-template-columns:30px 1fr 90px}.pe-st{display:none}}`; document.head.appendChild(c); }

  window.Pei = { part: () => st.part || 'prep', migrate, check, suggest, smartFill, fitPlan, parseEvalFile, parsePlanFile, evalCells, planCells, totals, year: Y, QS, isoOf, serialOf, importFiles: (sy, w) => importFiles(sy || st.sy || MK.curSy(), w), KINDS,
    summary: sy => { sy = sy || MK.curSy(); const T = totals(sy); return { ops: T.ops, H: T.H, I: T.I, err: T.err, q: QS(sy).length }; } };
})();
