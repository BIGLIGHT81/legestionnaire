'use strict';
/* 1.9 shared toolkit: active school year, board-style documents (السبورة المرجعية design), grouped bar charts,
   generic form builder and list editor, Moroccan levels, school units, money formatting and amounts in words. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();

  /* ================= school year (الموسم الدراسي) ================= */
  const SY_RX = /^(\d{4})\/(\d{4})$/;
  const autoSy = () => MK.schoolYear(today());
  // 1.9.4: DB is a top-level `let` of app.js (a global binding, not a property of window): read it by name
  const gDB = () => { try { return typeof DB !== 'undefined' ? DB : null; } catch (_) { return null; } };
  MK.curSy = () => { const g = gDB() && gDB().settings; const v = g && g.sy; return v && SY_RX.test(v) ? v : autoSy(); };
  MK.isAutoSy = () => !(gDB() && gDB().settings && SY_RX.test(gDB().settings.sy || ''));
  // '' = follow the calendar (changes by itself on the 1st of September)
  MK.setSy = sy => { if (!gDB()) return; gDB().settings.sy = sy && SY_RX.test(sy) && sy !== autoSy() ? sy : ''; persist(); };
  MK.syDash = sy => String(sy || '').replace('/', '-');
  MK.syBoundsOf = sy => { const m = SY_RX.exec(sy || '') || SY_RX.exec(autoSy()); return { from: `${m[1]}-09-01`, to: `${m[2]}-08-31` }; };
  MK.syStart = sy => +(SY_RX.exec(sy || '') || SY_RX.exec(autoSy()))[1];
  // a reference date inside the active school year: today when it belongs to it, otherwise its first / last day
  MK.syRef = sy => { const b = MK.syBoundsOf(sy || MK.curSy()), t = today(); return t < b.from ? b.from : t > b.to ? b.to : t; };
  MK.syList = extra => {
    const y = MK.syStart(autoSy()), set = new Set();
    for (let i = y + 1; i >= 2015; i--) set.add(`${i}/${i + 1}`);
    (extra || []).forEach(s => { if (SY_RX.test(s || '')) set.add(s); });
    set.add(MK.curSy());
    return Array.from(set).sort().reverse();
  };

  /* ================= numbers & money ================= */
  // accepts 1234,5 / 1234.5 / 1 234,50 / 1.234,50 / 1,234.50
  const num = v => {
    let s = String(v == null ? '' : v).replace(/[\s\u00A0\u202F]/g, '');
    const c = s.lastIndexOf(','), d = s.lastIndexOf('.');
    s = c >= 0 && d >= 0 ? (c > d ? s.replace(/\./g, '').replace(',', '.') : s.replace(/,/g, '')) : s.replace(',', '.');
    const n = parseFloat(s); return isFinite(n) ? n : 0;
  };
  const r2 = n => Math.round((+n || 0) * 100) / 100;
  // 1 234,50 — thousands separator is a NO-BREAK SPACE (U+00A0): in a right-to-left cell an ordinary space splits the figure into
  // separate runs (1234,50 showed «234,50 1»); a no-break space keeps all the digits in ONE left-to-right run and never wraps inside a figure
  const money = (n, dash) => {
    n = r2(n);
    if (dash && !n) return '-';
    const neg = n < 0; n = Math.abs(n);
    const [i, d] = n.toFixed(2).split('.');
    return (neg ? '-' : '') + i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0') + ',' + d;
  };
  const pct = (a, b, d) => (b ? (a / b * 100).toFixed(d == null ? 2 : d) : (0).toFixed(d == null ? 2 : d)) + '%';

  // amounts in Arabic words (تفقيط): 1250.5 -> «ألف ومائتان وخمسون درهما وخمسون سنتيما»
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const TEENS = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUND = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function w999(n) {
    const h = Math.floor(n / 100), r = n % 100, parts = [];
    if (h) parts.push(HUND[h]);
    if (r) {
      if (r < 10) parts.push(ONES[r]);
      else if (r < 20) parts.push(TEENS[r - 10]);
      else { const u = r % 10, t = Math.floor(r / 10); parts.push(u ? `${ONES[u]} و${TENS[t]}` : TENS[t]); }
    }
    return parts.join(' و');
  }
  function scale(n, one, two, few, many) {
    if (n === 1) return one;
    if (n === 2) return two;
    const r = n % 100;
    if (n >= 3 && n <= 10) return `${w999(n)} ${few}`;
    if (r >= 3 && r <= 10 && n > 100) return `${w999(n)} ${few}`;
    if (r === 0 || r === 1 || r === 2) return `${w999(n)} ${one}`;
    return `${w999(n)} ${many}`;
  }
  function intWords(n) {
    n = Math.floor(Math.abs(n));
    if (!n) return 'صفر';
    const parts = [];
    const mil = Math.floor(n / 1e6), th = Math.floor(n % 1e6 / 1000), rest = n % 1000;
    if (mil) parts.push(scale(mil, 'مليون', 'مليونان', 'ملايين', 'مليونا'));
    if (th) parts.push(scale(th, 'ألف', 'ألفان', 'آلاف', 'ألفا'));
    if (rest) parts.push(w999(rest));
    return parts.join(' و');
  }
  const unitWord = (n, one, two, few, many) => { const r = n % 100; if (n === 1) return one; if (n === 2) return two; if (r >= 3 && r <= 10) return few; if (r === 0 || r === 1 || r === 2) return one; return many; };
  function tafqit(v) {
    const n = r2(Math.abs(num(v)));
    const d = Math.floor(n), c = Math.round((n - d) * 100);
    let s = '';
    if (d === 1) s = 'درهم واحد';
    else if (d === 2) s = 'درهمان';
    else if (d) s = `${intWords(d)} ${unitWord(d, 'درهم', 'درهمان', 'دراهم', 'درهما')}`;
    if (c) s += `${s ? ' و' : ''}${c === 1 ? 'سنتيم واحد' : c === 2 ? 'سنتيمان' : `${intWords(c)} ${unitWord(c, 'سنتيم', 'سنتيمان', 'سنتيمات', 'سنتيما')}`}`;
    return s || 'صفر درهم';
  }

  /* ================= levels (Massar codes) ================= */
  // off: normal age of the level at the start of the school year (born in startYear - off)
  const LEVELS = [
    { k: 'DEPE', ar: 'روض الأطفال (DEPE)', sh: 'روض الأطفال', off: 3, pre: 1 },
    { k: 'PS1', ar: 'الأولى أولي', sh: 'الأولى أولي', off: 4, pre: 1 },
    { k: 'PS2', ar: 'الثانية أولي', sh: 'الثانية أولي', off: 5, pre: 1 },
    { k: 'P1', ar: 'الأول ابتدائي', sh: 'الأول', off: 6 }, { k: 'P2', ar: 'الثاني ابتدائي', sh: 'الثاني', off: 7 },
    { k: 'P3', ar: 'الثالث ابتدائي', sh: 'الثالث', off: 8 }, { k: 'P4', ar: 'الرابع ابتدائي', sh: 'الرابع', off: 9 },
    { k: 'P5', ar: 'الخامس ابتدائي', sh: 'الخامس', off: 10 }, { k: 'P6', ar: 'السادس ابتدائي', sh: 'السادس', off: 11 },
    { k: 'C1', ar: 'الأولى إعدادي', sh: 'الأولى إعدادي', off: 12 }, { k: 'C2', ar: 'الثانية إعدادي', sh: 'الثانية إعدادي', off: 13 },
    { k: 'C3', ar: 'الثالثة إعدادي', sh: 'الثالثة إعدادي', off: 14 },
    { k: 'TC', ar: 'الجذع المشترك', sh: 'الجذع المشترك', off: 15 }, { k: 'B1', ar: 'الأولى باكالوريا', sh: 'الأولى باك', off: 16 },
    { k: 'B2', ar: 'الثانية باكالوريا', sh: 'الثانية باك', off: 17 }
  ];
  const LVK = Object.fromEntries(LEVELS.map(l => [l.k, l]));
  const ORD_M = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const ORD_F = ['الأولى', 'الثانية', 'الثالثة'];
  const nh = s => MK.hkey(s);
  const LV = {
    ALL: LEVELS, byK: k => LVK[k] || null,
    ar: k => (LVK[k] ? LVK[k].ar : (k || '')), sh: k => (LVK[k] ? LVK[k].sh : (k || '')),
    idx: k => { const i = LEVELS.findIndex(l => l.k === k); return i < 0 ? 99 : i; },
    sort: ks => ks.slice().sort((a, b) => LV.idx(a) - LV.idx(b)),
    // levels of a Massar class code: «1APG-2APG», «DEPE-PS1-PS2», «4APG-5APG-6APG», «1APIC», «TCS»...
    ofClass(code) {
      const out = [];
      String(code || '').toUpperCase().split(/[-_ /+]+/).forEach(t => {
        let m;
        if (/^DEPE/.test(t)) out.push('DEPE');
        else if ((m = /^PS(\d)/.exec(t))) out.push(m[1] === '1' ? 'PS1' : 'PS2');
        else if (/^(MS|GS)$/.test(t)) out.push(t === 'MS' ? 'PS1' : 'PS2');
        else if ((m = /^(\d)A(SC|C|PIC)/.exec(t))) out.push('C' + m[1]);   // collège first: «1APIC» (Massar: 1ère année collège, parcours international) is not «1AP»
        else if ((m = /^(\d)AP/.exec(t))) out.push('P' + m[1]);
        else if (/^TC/.test(t)) out.push('TC');
        else if ((m = /^(\d)BAC/.exec(t))) out.push('B' + m[1]);
      });
      return Array.from(new Set(out.filter(k => LVK[k])));
    },
    // «الأول ابتدائي عام», « الثانية أولي », «المستوى الثالث», «3»...
    fromLabel(label) {
      const s = String(label || '').replace(/\s+/g, ' ').trim();
      if (!s) return '';
      const n = nh(s);
      if (/dep|صغري|روضالاطفال$/.test(n)) return 'DEPE';
      // secondary levels first: «الأولى إعدادي» / «الأولى باكالوريا» contain «أولى» like the pre-school levels do
      if (/اعدادي/.test(n)) { const i = ORD_F.findIndex(o => n.includes(nh(o))); return i >= 0 ? 'C' + (i + 1) : ''; }
      if (/جذع/.test(n)) return 'TC';
      if (/باك|بكالوريا/.test(n)) return /ثاني/.test(n) ? 'B2' : 'B1';
      if (/اولي|تمهيدي|روض/.test(n) && !/ابتدا/.test(n)) return /ثاني/.test(n) ? 'PS2' : 'PS1';
      for (let i = 5; i >= 0; i--) if (n.includes(nh(ORD_M[i]))) return 'P' + (i + 1);
      const d = /^\d$/.exec(s); if (d && +d[0] >= 1 && +d[0] <= 6) return 'P' + d[0];
      return '';
    },
    // name used on certificates and lists (the Massar label «DEPE» is not a school level name)
    name: k => (k === 'DEPE' ? 'روض الأطفال' : LV.ar(k)),
    // number of the level inside its stage, for «الثالثة إعدادي (03)»: the pre-school levels, the 6 primary levels, the 3 collège levels,
    // the two baccalaureate years (the common core «الجذع المشترك» has no number)
    no: k => ({ PS1: 1, PS2: 2, P1: 1, P2: 2, P3: 3, P4: 4, P5: 5, P6: 6, C1: 1, C2: 2, C3: 3, B1: 1, B2: 2 }[k] || 0),
    // pathways (الشعب والمسالك) of the qualifying cycle: suggestions for the field and Massar suffixes (TCS, 1BACSE, 2BACSVT...)
    BRANCHES: {
      TC: ['العلمي', 'الآداب والعلوم الإنسانية', 'التكنولوجي', 'الأصيل'],
      B1: ['العلوم التجريبية', 'العلوم الرياضية', 'الآداب والعلوم الإنسانية', 'العلوم الاقتصادية والتدبير', 'العلوم والتكنولوجيات الكهربائية', 'العلوم والتكنولوجيات الميكانيكية', 'العلوم الزراعية', 'العلوم الشرعية', 'اللغة العربية'],
      B2: ['العلوم الفيزيائية', 'علوم الحياة والأرض', 'العلوم الرياضية أ', 'العلوم الرياضية ب', 'الآداب', 'العلوم الإنسانية', 'العلوم الاقتصادية', 'علوم التدبير المحاسباتي', 'العلوم والتكنولوجيات الكهربائية', 'العلوم والتكنولوجيات الميكانيكية', 'العلوم الزراعية', 'العلوم الشرعية', 'اللغة العربية']
    },
    // «TCS» -> الجذع المشترك العلمي, «1BACSE» -> العلوم التجريبية, «2BACSVT» -> علوم الحياة والأرض (only the usual codes; anything else stays empty to be typed)
    branchOfClass(code) {
      const MAP = {
        TC: { S: 'العلمي', SC: 'العلمي', SCI: 'العلمي', LSH: 'الآداب والعلوم الإنسانية', L: 'الآداب والعلوم الإنسانية', T: 'التكنولوجي', TECH: 'التكنولوجي', O: 'الأصيل', OR: 'الأصيل', ORI: 'الأصيل' },
        B1: { SE: 'العلوم التجريبية', SM: 'العلوم الرياضية', LSH: 'الآداب والعلوم الإنسانية', L: 'الآداب والعلوم الإنسانية', SEG: 'العلوم الاقتصادية والتدبير', STE: 'العلوم والتكنولوجيات الكهربائية', STM: 'العلوم والتكنولوجيات الميكانيكية', SA: 'العلوم الزراعية', SAGR: 'العلوم الزراعية' },
        B2: { PC: 'العلوم الفيزيائية', SVT: 'علوم الحياة والأرض', SMA: 'العلوم الرياضية أ', SMB: 'العلوم الرياضية ب', LET: 'الآداب', L: 'الآداب', SH: 'العلوم الإنسانية', LSH: 'الآداب والعلوم الإنسانية', SEC: 'العلوم الاقتصادية', ECO: 'العلوم الاقتصادية', SGC: 'علوم التدبير المحاسباتي', GC: 'علوم التدبير المحاسباتي', STE: 'العلوم والتكنولوجيات الكهربائية', STM: 'العلوم والتكنولوجيات الميكانيكية', SA: 'العلوم الزراعية', SAGR: 'العلوم الزراعية' }
      };
      let out = '';
      String(code || '').toUpperCase().split(/[-_ /+]+/).forEach(t => {
        let m;
        if (out) return;
        if ((m = /^TC([A-Z]*)\d*$/.exec(t)) && m[1]) out = MAP.TC[m[1]] || '';
        else if ((m = /^([12])BAC([A-Z]*)\d*$/.exec(t)) && m[2]) out = MAP['B' + m[1]][m[2]] || '';
      });
      return out;
    },
    // a typed or imported level text of the secondary cycles: «الثانية باكالوريا علوم رياضية», «الجذع المشترك العلمي», «2BACSVT»
    // -> { k, level, branch }; null when it is not one (primary and free texts are kept as typed)
    splitLabel(label) {
      const s = String(label || '').replace(/\s+/g, ' ').trim();
      if (!s) return null;
      const cut = r => r.replace(/^[\s\-–—:،,/]+/, '').replace(/^(?:مسلك|شعبة|المسلك|الشعبة)\s*/, '').trim();
      let m;
      if (/^[A-Za-z0-9\-_ /+]+$/.test(s) && !/\s/.test(s.replace(/[-_/+]/g, ''))) {
        const ks = LV.ofClass(s).filter(k => /^(C|TC|B)/.test(k));
        if (ks.length === 1) return { k: ks[0], level: LV.ar(ks[0]), branch: LV.branchOfClass(s) };
      }
      if ((m = /^(?:الجذع المشترك|جذع مشترك)(.*)$/.exec(s))) return { k: 'TC', level: LV.ar('TC'), branch: cut(m[1]) };
      if ((m = /^(الأولى|الاولى|الأول|الثانية|الثاني)\s*(?:من\s+)?(?:سلك\s+)?(?:باكالوريا|بكالوريا|باك)(.*)$/.exec(s))) return { k: /ثان/.test(m[1]) ? 'B2' : 'B1', level: LV.ar(/ثان/.test(m[1]) ? 'B2' : 'B1'), branch: cut(m[2]) };
      if ((m = /^(الأولى|الاولى|الثانية|الثالثة)\s*(?:اعدادي|إعدادي)(.*)$/.exec(s))) { const k = /ثالث/.test(m[1]) ? 'C3' : /ثان/.test(m[1]) ? 'C2' : 'C1'; return { k, level: LV.ar(k), branch: cut(m[2]) }; }
      return null;
    },
    birthYear: (k, sy) => (LVK[k] ? MK.syStart(sy) - LVK[k].off : null),
    // level of a pupil inside a multi-level class, from the birth year (closest normal age)
    guess(levels, birth, sy) {
      if (!levels.length) return '';
      if (levels.length === 1) return levels[0];
      const y = +String(birth || '').slice(0, 4);
      if (!y) return levels[0];
      let best = levels[0], bd = 1e9;
      levels.forEach(k => { const d = Math.abs(LV.birthYear(k, sy) - y); if (d < bd || (d === bd && LV.idx(k) > LV.idx(best))) { bd = d; best = k; } });
      return best;
    },
    // age on 31 December of the first year of the school year (usual convention of school statistics)
    age: (birth, sy) => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(birth || ''); if (!m) return null; return MK.syStart(sy) - +m[1]; }
  };

  /* ================= school units (الوحدات المدرسية) ================= */
  const U = {
    // display names known by the application (pupils lists, attendance, certificates), in a stable order
    names() {
      const out = [];
      const add = n => { n = String(n || '').trim(); if (n && !out.some(x => nh(x) === nh(n))) out.push(n); };
      if (DB.board && Array.isArray(DB.board.units)) DB.board.units.forEach(u => add(u.name));
      if (window.Pupils && Pupils.unitNames) Pupils.unitNames().forEach(add);
      if (DB.attend && Array.isArray(DB.attend.units)) DB.attend.units.forEach(u => add(u.name));
      return out;
    },
    same: (a, b) => { const x = nh(String(a || '').replace(/^(وحدة|فرعية|مركزية)\s*/, '')), y = nh(String(b || '').replace(/^(وحدة|فرعية|مركزية)\s*/, '')); return !!x && x === y; }
  };

  /* ================= employees helpers ================= */
  const E = {
    byName(name) { const k = nh(name); if (!k) return null; return DB.employees.find(e => nh(fullName(e)) === k || nh(`${e.lastAr || ''} ${e.firstAr || ''}`) === k) || null; },
    names: () => sortedEmps().map(e => fullName(e)),
    teachers: () => sortedEmps().filter(e => (e.cat ? e.cat === 'teacher' || e.cat === 'assigned' : isTeacher(e))),
    cat(e) {
      if (e.cat) return e.cat;
      const c = String(e.cadre || '');
      if (/مدير|متصرف|ملحق|حارس عام|مقتصد|ناظر/.test(c)) return 'admin';
      if (/مربي|مربية|أولي/.test(c)) return 'preschool';
      if (/عون|منظف|حارس/.test(c)) return 'other';
      return isTeacher(e) ? (e.assigned ? 'assigned' : 'teacher') : 'other';
    }
  };
  const CATS = [['admin', 'هيئة الإدارة'], ['teacher', 'هيئة التدريس'], ['assigned', 'أستاذ(ة) مكلف(ة) بالمؤسسة'], ['preschool', 'مربي(ة) التعليم الأولي'], ['other', 'أطر وأعوان آخرون']];
  const dl = (id, vals) => `<datalist id="${id}">${Array.from(new Set(vals.filter(Boolean))).map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;

  /* ================= people pickers: pupils (Massar) + employees, shared by every form ================= */
  const PP = {
    pupils: () => (window.Pupils && Pupils.people ? Pupils.people(MK.curSy()) : []),
    pLabel: p => [p.code, p.cls, p.unit, p.move].filter(Boolean).join(' · '),
    eLabel: e => [e.cadre, e.ppr].filter(Boolean).join(' · '),
    byName(n, L) { const k = nh(n); if (!k) return null; return (L || PP.pupils()).find(p => nh(p.name) === k || nh(`${p.first} ${p.last}`) === k) || null; },
    byCode(c, L) { const k = String(c || '').trim().toUpperCase(); if (!k) return null; return (L || PP.pupils()).find(p => p.code === k) || null; },
    // value typed or picked (a name or a Massar code) -> { kind, rec, name }
    resolve(src, v) {
      v = String(v == null ? '' : v).trim(); if (!v) return null;
      const P = () => { const L = PP.pupils(), p = PP.byName(v, L) || PP.byCode(v, L); return p ? { kind: 'pupil', rec: p, name: p.name } : null; };
      const Em = () => { const e = E.byName(v); return e ? { kind: 'emp', rec: e, name: fullName(e) } : null; };
      return src === 'pupil' ? P() : src === 'emp' ? Em() : (Em() || P());
    },
    attr(r, key) {
      const x = r.rec;
      if (r.kind === 'pupil') return ({ name: x.name, code: x.code, cls: x.cls, unit: x.unit, lvl: x.lvlSh, birth: x.birth, gender: x.gender, place: x.place })[key] || '';
      return ({ name: r.name, cls: x.cadre, unit: x.unit, ppr: x.ppr, cin: x.cin, cadre: x.cadre, grade: x.grade, task: x.task, phone: x.phone, email: x.email })[key] || '';
    },
    // option lists
    options(id) {
      const opt = (v, l) => `<option value="${esc(v)}"${l ? ` label="${esc(l)}"` : ''}>`;
      if (id === 'k2Emps') return sortedEmps().map(e => opt(fullName(e), PP.eLabel(e))).join('');
      const P = PP.pupils();
      if (id === 'k2Pupils') return P.map(p => opt(p.name, PP.pLabel(p))).join('');
      if (id === 'k2Codes') return P.filter(p => p.code).map(p => opt(p.code, p.name)).join('');
      if (id === 'k2People') { const seen = new Set(); const o = []; sortedEmps().forEach(e => { const n = fullName(e); seen.add(nh(n)); o.push(opt(n, 'موظف(ة)' + (e.cadre ? ' · ' + e.cadre : ''))); }); P.forEach(p => { if (!seen.has(nh(p.name))) o.push(opt(p.name, 'تلميذ(ة) · ' + PP.pLabel(p))); }); return o.join(''); }
      return '';
    },
    // fill the cells (grid) / fields (form) declared by `link` once a person is recognised
    fill(link, r, get, set) {
      Object.keys(link.cols || link.keys || {}).forEach(k => { if (k === 'code' && r.kind !== 'pupil') return; const v = PP.attr(r, k); if (v) set(k, v); });
    }
  };
  const LISTS = ['k2Pupils', 'k2People', 'k2Codes'];

  /* ================= board-style documents ================= */
  Dx.modCss += `
  .sb{font-size:10pt;line-height:1.45}
  .sb-ttl{position:relative;height:14.5mm;margin:1mm 3mm 3mm;border-radius:3.5mm;background:linear-gradient(180deg,#5e8fdc 0%,#3f6fc4 52%,#2c56a6 100%);border:.45mm solid #23488d}
  .sb-ttl .e1{position:absolute;left:6.5%;right:6.5%;top:1.3mm;bottom:1.3mm;border-radius:50%;background:#fff}
  .sb-ttl .e2{position:absolute;left:15%;right:15%;top:2.3mm;bottom:2.3mm;border-radius:50%;background:linear-gradient(180deg,#e9f0fa,#d3e0f3)}
  .sb-ttl .t{position:relative;z-index:1;height:100%;display:flex;align-items:center;justify-content:center;text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;color:#0e2a66;padding:0 17%;line-height:1.12}
  .page-a4 .sb-ttl{margin:1mm 0 3mm}
  .sb-sub{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:13pt;color:#0e2a66;margin:-1.5mm 0 2mm}
  .sb-cap{text-align:center;font-weight:700;font-size:11pt;color:#1f3864;margin:2mm 0 1mm}
  .sb-cap.r{text-align:right}
  .tbl.sb-t{font-size:9.2pt;line-height:1.28}
  .tbl.sb-t th,.tbl.sb-t td{border:1px solid #4f7fc4;padding:.7mm 1mm;height:6.1mm}
  .tbl.sb-t th{background:#d9e2f3;color:#1f3864;font-weight:700}
  .tbl.sb-t th.d,.tbl.sb-t td.d{background:#b4c6e7}
  .tbl.sb-t td.k{background:#e7e6e6;font-weight:700}
  .tbl.sb-t td.s{background:#d9e2f3;font-weight:700}
  .tbl.sb-t td.t{background:#8eaadb;font-weight:700}
  .tbl.sb-t td.g,.tbl.sb-t th.g{background:#ffff00;font-weight:700;color:#000}
  .tbl.sb-t td.y{background:#ffffcc;font-weight:700}
  .tbl.sb-t td.gr{background:#d0cece}
  .tbl.sb-t tr.tot td{background:#d9e2f3;font-weight:700}
  .tbl.sb-t td.r,.tbl.sb-t th.r{text-align:right}.tbl.sb-t td.l{text-align:left}
  .tbl.sb-t td.sm{font-size:8pt}.tbl.sb-t td.xs{font-size:7.2pt}.tbl.sb-t td.b{font-weight:700}.tbl.sb-t td.nw{white-space:nowrap}
  .tbl.sb-t td.ltr{direction:ltr}
  .tbl.sb-t.big td{height:7.4mm}.tbl.sb-t.cmp td{height:5.2mm;padding:.35mm .8mm}.tbl.sb-t.cmp{font-size:8.4pt}
  .sb-kv{width:100%}.sb-kv td.k{background:#d9e2f3;color:#1f3864;font-weight:700;white-space:nowrap}
  .sb-box{border:1.3px solid #4472c4;border-radius:2.2mm;padding:1.4mm 2mm;background:#f6f8fd}
  .sb-box h4{margin:0 0 1mm;text-align:center;font-size:10.5pt;color:#1f3864;text-decoration:underline;text-underline-offset:1mm}
  .sb-g2{display:grid;grid-template-columns:1fr 1fr;gap:4mm;align-items:start}.sb-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:3mm;align-items:start}
  .sb-sign{display:grid;grid-template-columns:1fr 1fr;gap:6mm;margin-top:3mm;font-weight:700;font-size:10.5pt;min-height:18mm}
  .sb-sign>div{text-align:center}.sb-sign .d{font-weight:400;font-size:9.6pt}
  .sb-sign.one{grid-template-columns:1fr}.sb-sign.one>div{text-align:right}
  .sb-sign.three{grid-template-columns:1fr 1fr 1fr}
  .sb-note{font-size:8.4pt;line-height:1.5;margin-top:1.5mm;color:#222}
  .sb-chart{display:block;margin:1mm auto 0;max-width:100%}
  .sb-p{line-height:1.9;margin:0 0 1mm;text-align:justify}
  .sb-p .v{font-weight:700}
  .sb-dots{display:inline-block;min-width:30mm;border-bottom:1px dotted #444;height:1em;vertical-align:baseline}
  .sb-chk{display:inline-block;width:3.4mm;height:3.4mm;border:1px solid #1f3864;text-align:center;line-height:3.1mm;font-size:8pt;font-weight:700}
  .sb-pv{font-size:10.6pt;line-height:1.85}
  .sb-pv p{margin:0 0 1.2mm}
  .sb-foot{text-align:center;font-size:8.6pt;color:#1f3864;border-top:1px solid #4472c4;padding-top:.8mm;margin-top:1.5mm}
  `;
  const ttlSize = t => { const n = String(t || '').length; return n > 70 ? 11 : n > 55 ? 12.5 : n > 42 ? 14 : n > 30 ? 15.5 : 17; };
  const SB = {
    title: (t, size) => `<div class="sb-ttl"><div class="e1"></div><div class="e2"></div><div class="t" style="font-size:${size || ttlSize(t)}pt">${t}</div></div>`,
    sub: t => t ? `<div class="sb-sub">${t}</div>` : '',
    cap: (t, cls) => `<div class="sb-cap ${cls || ''}">${t}</div>`,
    head: (s, title, sub) => `<div class="mk-hdr">${Dx.header(s)}</div>${SB.title(title)}${SB.sub(sub)}`,
    // signature row; o.left (default: head of the school), o.right (date line / second signature)
    sign: (s, o) => {
      o = o || {};
      const left = o.left == null ? 'توقيع رئيس المؤسسة' : o.left;
      const right = o.right != null ? o.right : (o.noDate ? '' : `<span class="d">حرر ب: ${esc(o.city || s.city || '')} &nbsp; في: ${esc(fmtDate(o.date || today()))}</span>`);
      if (o.three) return `<div class="sb-sign three">${o.three.map(x => `<div>${x}</div>`).join('')}</div>`;
      return `<div class="sb-sign"><div>${right}</div><div>${left}</div></div>`;
    },
    foot: s => { const p = [s.school, s.commune ? 'جماعة ' + s.commune : '', s.directorate, s.phone ? 'الهاتف: ' + s.phone : ''].filter(Boolean); return p.length ? `<div class="sb-foot">${esc(p.join(' - '))}</div>` : ''; },
    // full document: o = { title, sub, page ('a4l'|'a4'), blocks, sign (html | false) }
    pages(s, o) {
      const blocks = (o.blocks || []).slice();
      if (o.sign !== false) blocks.push(o.sign || SB.sign(s));
      return MK.flowPages({ page: o.page || 'a4l', cls: 'sb', head: SB.head(s, o.title, o.sub), blocks });
    },
    tbl: (head, rows, cls) => ({ table: { cls: 'sb-t ' + (cls || ''), head, rows } })
  };

  /* grouped bar chart: cats [labels], series [{name, color, vals}], o: {w, h, title, fmt, pctOf} */
  function bars(cats, series, o) {
    o = o || {};
    const W = o.w || 640, H = o.h || 230, padB = 40, padT = o.title ? 30 : 16, padS = 34, legH = 16;
    const all = series.reduce((a, s) => a.concat(s.vals.map(v => +v || 0)), []);
    const max = Math.max(o.min || 1, ...all) * 1.18;
    const n = cats.length || 1, gw = (W - padS - 10) / n, bw = Math.min(26, gw * 0.78 / Math.max(1, series.length));
    const y = v => padT + (H - padT - padB - legH) * (1 - v / max);
    const base = H - padB - legH;
    let s = `<svg class="sb-chart" viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="MAJ, NSA, sans-serif" direction="ltr">`;
    if (o.title) s += `<text x="${W / 2}" y="17" font-size="13" font-weight="700" text-anchor="middle" direction="rtl" fill="#1f3864">${esc(o.title)}</text>`;
    const ticks = 4;
    for (let t = 0; t <= ticks; t++) { const v = max * t / ticks, yy = y(v); s += `<line x1="${padS}" x2="${W - 6}" y1="${yy}" y2="${yy}" stroke="#d9dee8" stroke-width="0.7"/><text x="${padS - 4}" y="${yy + 3.5}" font-size="9" text-anchor="end" fill="#555">${v < 10 ? v.toFixed(1) : Math.round(v)}</text>`; }
    cats.forEach((c, i) => {
      const cx = W - 6 - gw * (i + .5);
      const x0 = cx - bw * series.length / 2;
      series.forEach((se, j) => {
        const v = +se.vals[i] || 0, x = x0 + bw * (series.length - 1 - j);
        s += `<rect x="${x + 1}" y="${y(v)}" width="${bw - 2}" height="${Math.max(0, base - y(v))}" fill="${se.color}" rx="1.2"/>`;
        if (o.labels !== false) s += `<text x="${x + bw / 2}" y="${y(v) - 3}" font-size="${bw < 14 ? 7.5 : 9}" text-anchor="middle" font-weight="700" fill="#222">${o.fmt ? o.fmt(v, i, j) : (Number.isInteger(v) ? v : v.toFixed(1))}</text>`;
      });
      s += `<text x="${cx}" y="${base + 14}" font-size="${o.fs || 10}" text-anchor="middle" direction="rtl" fill="#111">${esc(c)}</text>`;
    });
    s += `<line x1="${padS}" x2="${W - 6}" y1="${base}" y2="${base}" stroke="#333" stroke-width="1"/>`;
    // legend
    let lx = W / 2 + series.length * 45;
    series.forEach(se => { s += `<rect x="${lx - 12}" y="${H - 13}" width="10" height="10" fill="${se.color}"/><text x="${lx - 16}" y="${H - 4.5}" font-size="10" text-anchor="start" direction="rtl" fill="#222">${esc(se.name)}</text>`; lx -= 90; });
    return s + '</svg>';
  }
  const COL = { m: '#4472c4', f: '#ff3399', t: '#a5a5a5', g: '#70ad47', o: '#ed7d31', d: '#264478' };

  /* ================= generic form builder (side panel / modal) =================
     defs: [{sec}|{note}|{k, l, t: text|num|money|date|area|select|checks|grid|html, half, ph, opts, rows, cols, list, dir, hint}] */
  function fieldHtml(d, f) {
    if (d.sec) return `<div class="sec-t full">${d.sec}</div>`;
    if (d.note) return `<p class="muted full" style="font-size:12px;line-height:1.7;margin:-4px 0 8px">${d.note}</p>`;
    if (d.t === 'html') return `<div class="${d.half ? '' : 'full'}">${typeof d.html === 'function' ? d.html(f) : d.html}</div>`;
    const lab = d.l ? `<label>${d.l}</label>` : '';
    const v = f[d.k];
    const cls = `fld ${d.half ? '' : 'full'}`;
    const dir = d.dir ? ` dir="${d.dir}"` : '';
    const hint = d.hint ? `<span class="hint">${d.hint}</span>` : '';
    switch (d.t) {
      case 'area': return `<div class="${cls}">${lab}<textarea class="inp" data-k="${d.k}" rows="${d.rows || 3}" placeholder="${esc(d.ph || '')}">${esc(v || '')}</textarea>${hint}</div>`;
      case 'color': return `<div class="${cls}">${lab}<input class="inp" type="color" data-k="${d.k}" value="${esc(/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#16325f')}" style="height:36px;padding:2px">${hint}</div>`;
      case 'date': return `<div class="${cls}">${lab}<input class="inp" type="date" data-k="${d.k}" value="${esc(v || '')}">${hint}</div>`;
      case 'num': case 'money': return `<div class="${cls}">${lab}<input class="inp" type="number" ${d.t === 'money' ? 'step="0.01"' : 'step="1"'} data-k="${d.k}" value="${esc(v == null ? '' : v)}" placeholder="${esc(d.ph || '')}">${hint}</div>`;
      case 'select': return `<div class="${cls}">${lab}<select class="inp" data-k="${d.k}">${(typeof d.opts === 'function' ? d.opts() : d.opts).map(o => { const [k, l] = Array.isArray(o) ? o : [o, o]; return `<option value="${esc(k)}" ${String(v == null ? '' : v) === String(k) ? 'selected' : ''}>${esc(l)}</option>`; }).join('')}</select>${hint}</div>`;
      case 'checks': return `<div class="${cls}">${lab}<div class="k2-checks">${d.opts.map((o, i) => `<label class="chk"><input type="checkbox" data-ck="${d.k}" data-i="${i}" ${v && v[i] ? 'checked' : ''}> ${esc(o)}</label>`).join('')}</div>${hint}</div>`;
      case 'grid': {
        const rows = v || [];
        const tpl = `grid-template-columns:${(d.widths || d.cols.map(() => '1fr')).join(' ')} 28px`;
        return `<div class="${cls}">${lab}<div class="k2-grid">
          <div class="k2-gh" style="${tpl}">${d.cols.map(c => `<span>${c}</span>`).join('')}<span></span></div>
          ${rows.map((r, i) => `<div class="k2-gr" style="${tpl}">${d.cols.map((c, j) => { const ty = (d.types || [])[j] || 'text'; return `<input class="inp" ${ty === 'num' ? 'type="number" step="any"' : ty === 'date' ? 'type="date"' : ty === 'ro' ? 'readonly tabindex="-1" style="background:#f3f5f9"' : ''} data-g="${d.k}" data-r="${i}" data-c="${j}" value="${esc(r[j] == null ? '' : (ty === 'ro' && d.rofmt ? d.rofmt(r[j]) : r[j]))}" ${d.list && d.list[j] ? `list="${d.list[j]}"` : ''} ${(d.dirs || [])[j] ? `dir="${d.dirs[j]}"` : ''}>`; }).join('')}
            ${d.fixed ? '<span></span>' : `<button type="button" class="btn sm danger icon" data-gdel="${d.k}" data-r="${i}" title="حذف السطر">✕</button>`}</div>`).join('')}
          </div>${d.fixed ? '' : `<div class="btn-row" style="margin-top:6px"><button type="button" class="btn sm" data-gadd="${d.k}">${ic('plus')} إضافة سطر</button>${d.extraBtn || ''}</div>`}${hint}</div>`;
      }
      default: return `<div class="${cls}">${lab}<input class="inp" data-k="${d.k}" value="${esc(v == null ? '' : v)}" placeholder="${esc(d.ph || '')}" ${d.list ? `list="${d.list}"` : ''}${dir}>${hint}</div>`;
    }
  }
  function form(box, defs, f, onChange, extra) {
    const D = () => (typeof defs === 'function' ? defs() : defs);
    const draw = () => {
      const sc = box.scrollTop;
      box.innerHTML = (extra ? extra() : '') + `<div class="fgrid">${D().map(d => fieldHtml(d, f)).join('')}</div>
        ${dl('k2Units', U.names())}${D().map(d => (d.dls ? Object.keys(d.dls).map(id => dl(id, typeof d.dls[id] === 'function' ? d.dls[id]() : d.dls[id])).join('') : '')).join('')}`;
      { const ids = ['k2Emps'].concat(LISTS).filter(id => box.innerHTML.includes('list="' + id + '"')); if (ids.length) box.insertAdjacentHTML('beforeend', ids.map(id => `<datalist id="${id}">${PP.options(id)}</datalist>`).join('')); }
      box.scrollTop = sc;
      if (box.onDraw) box.onDraw();
    };
    const changed = k => { if (onChange) onChange(k); };
    box.oninput = e => {
      const el = e.target, ds = el.dataset;
      if (ds.k && el.tagName !== 'SELECT') { f[ds.k] = el.value; changed(ds.k); }
      else if (ds.g) { const row = f[ds.g][+ds.r]; row[+ds.c] = el.value; if (box.onGrid) box.onGrid(ds.g, +ds.r, +ds.c, el); changed(ds.g); }
    };
    // a person picked in a name (or Massar code) cell/field fills the related cells/fields declared by `link`
    const linked = el => {
      const ds = el.dataset;
      if (ds.g) {
        const d = D().find(x => x.k === ds.g); if (!d || !d.link) return false;
        const L = d.link, c = +ds.c, nc = L.n || 0, cc = L.cols && L.cols.code != null ? L.cols.code : -1;
        if (c !== nc && c !== cc) return false;
        const r = PP.resolve(L.src || 'any', el.value); if (!r) return false;
        const row = f[ds.g][+ds.r];
        if (c === cc && r.kind === 'pupil') row[nc] = r.name;
        PP.fill(L, r, null, (k, v) => { const j = k === 'name' ? nc : L.cols[k]; if (j != null && j >= 0) row[j] = k === 'birth' ? fmtDate(v) : v; });
        if (L.post) L.post(row, r);
        draw(); changed(ds.g); return true;
      }
      if (ds.k) {
        const LK = D().filter(x => x.link), isC = x => !!(x.link.keys && x.link.keys.code === ds.k);
        const d = LK.find(x => x.k === ds.k && !isC(x)) || LK.find(x => x.k !== ds.k && isC(x)) || LK.find(x => x.k === ds.k);
        if (!d) return false;
        const L = d.link, isCode = d.k !== ds.k && isC(d);
        const r = PP.resolve(L.src || 'any', el.value); if (!r) return false;
        if (isCode && r.kind === 'pupil') f[d.k] = r.name;
        PP.fill(L, r, null, (k, v) => { const key = k === 'name' ? d.k : L.keys[k]; if (!key) return; const td = D().find(x => x.k === key); f[key] = (k === 'birth' && !(td && td.t === 'date')) ? fmtDate(v) : v; });
        if (L.post) L.post(f, r);
        draw(); changed(d.k); return true;
      }
      return false;
    };
    box.onchange = e => {
      const el = e.target, ds = el.dataset;
      if ((ds.g || (ds.k && el.tagName !== 'SELECT')) && linked(el)) return;
      if (ds.ck) { f[ds.ck] = f[ds.ck] || []; f[ds.ck][+ds.i] = el.checked; changed(ds.ck); }
      else if (el.tagName === 'SELECT' && ds.k) { f[ds.k] = el.value; changed(ds.k); if (box.onSelect) box.onSelect(ds.k, el.value); }
    };
    box.onclick = e => {
      const el = e.target.closest('button'); if (!el) return;
      const ds = el.dataset;
      if (ds.gadd) { const d = D().find(x => x.k === ds.gadd); f[ds.gadd] = f[ds.gadd] || []; f[ds.gadd].push(d.cols.map(() => '')); draw(); changed(ds.gadd); }
      else if (ds.gdel) { f[ds.gdel].splice(+ds.r, 1); draw(); changed(ds.gdel); }
    };
    draw();
    return draw;
  }

  /* ================= list editor (table + add / edit / delete in a modal) =================
     o: { list: () => array, cols: [{k, l, t, opts, list, dir, req, show(row) -> html, hide (not in table)}], empty, onChange, reorder, title, defaults, afterEdit(o) } */
  function crud(box, o) {
    const cols = o.cols;
    const draw = () => {
      const arr = o.list();
      const shown = cols.filter(c => !c.hide);
      box.innerHTML = arr.length ? `<table class="tbl compact"><thead><tr><th style="width:34px">#</th>${shown.map(c => `<th>${c.l}</th>`).join('')}<th></th></tr></thead><tbody>
        ${arr.map((r, i) => `<tr data-i="${i}"><td class="muted num">${i + 1}</td>${shown.map(c => `<td${c.dir === 'ltr' ? ' dir="ltr" style="text-align:right"' : ''}>${c.show ? c.show(r) : esc(c.t === 'date' ? fmtDate(r[c.k]) : (c.t === 'select' && c.opts ? ((c.opts.find(x => (Array.isArray(x) ? x[0] : x) === r[c.k]) || [])[1] || r[c.k] || '') : r[c.k]) || '')}</td>`).join('')}
          <td class="act">${o.reorder !== false ? `<button class="btn sm icon" data-a="up" ${i ? '' : 'disabled'} title="أعلى">▲</button> ` : ''}<button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}
        </tbody></table>` : `<div class="empty-state" style="padding:22px">${o.empty || 'لا توجد عناصر بعد'}</div>`;
      $$('tr[data-i]', box).forEach(tr => {
        const i = +tr.dataset.i;
        $$('[data-a]', tr).forEach(b => b.onclick = async () => {
          const a = o.list();
          if (b.dataset.a === 'edit') return edit(i);
          if (b.dataset.a === 'up' && i > 0) { const [x] = a.splice(i, 1); a.splice(i - 1, 0, x); persist(); draw(); o.onChange && o.onChange(); }
          if (b.dataset.a === 'del' && await confirmBox(`حذف <b>${esc(a[i][cols[0].k] || '')}</b>؟`, 'حذف')) { a.splice(i, 1); persist(); draw(); o.onChange && o.onChange(); }
        });
        tr.ondblclick = () => edit(i);
      });
    };
    const edit = i => {
      const a = o.list();
      const d = i == null ? Object.assign({}, typeof o.defaults === 'function' ? o.defaults() : (o.defaults || {})) : Object.assign({}, a[i]);
      const body = document.createElement('div');
      const defs = cols.filter(c => !c.noEdit).map(c => Object.assign({ half: c.t !== 'area' && !c.full }, c));
      form(body, defs, d, k => { if (o.onField) o.onField(k, d, body); });
      modal({ title: i == null ? (o.addTitle || 'إضافة') : (o.editTitle || 'تعديل'), body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
        const miss = cols.find(c => c.req && !String(d[c.k] || '').trim());
        if (miss) { toast(`المرجو ملء خانة «${miss.l}»`, true); return false; }
        Object.keys(d).forEach(k => { if (typeof d[k] === 'string') d[k] = d[k].trim(); });
        if (o.beforeSave) o.beforeSave(d);
        if (i == null) a.push(d); else Object.assign(a[i], d);
        persist(); draw(); o.onChange && o.onChange();
      } }, { label: 'إلغاء' }] });
    };
    draw();
    return { draw, add: () => edit(null) };
  }

  Dx.modCss += ''; // (kept for symmetry)
  window.K = { num, r2, money, pct, tafqit, intWords, LV, U, E, PP, CATS, dl, SB, bars, COL, form, fieldHtml, crud };
})();
