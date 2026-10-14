'use strict';
/* بطاقة التلاميذ — pupils of the school year imported from Massar («لائحة التلاميذ» per class, any number of files at once),
   movements (الوافدون، المغادرون، المنقطعون، غير الملتحقين، المفصولون، الناجحون، المكررون) from Massar statistics lists or typed,
   statistics and charts by unit, level, gender and age, printable lists, statistics and pupil cards. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();
  const { LV, SB, COL } = window.K;
  const nh = s => MK.hkey(s);
  // 1.9.3: in the collège / lycée the school is one independent institution: no school units, no pre-school, no primary wording
  // 1.9.4: SEC = one independent institution (no school units: collège / lycée / independent primary school); SECL = secondary cycle (no pre-school stage, secondary levels)
  const SEC = () => !!(window.Cyc && Cyc.single());
  const SECL = () => !!(window.Cyc && Cyc.isSec());
  const secUnit = () => { const s0 = typeof S === 'function' ? S() : {}; return String((s0 && s0.school) || '').trim() || 'المؤسسة'; };

  const CATS = [
    { k: 'joined', l: 'الوافدون (الملتحقون)', sh: 'الوافدون', rx: /الوافد|الملتحقين|المنتقلين الى|المستقبلين/ },
    { k: 'left', l: 'المغادرون (المنتقلون)', sh: 'المغادرون', rx: /المغادر|المنتقلين|المنقولين|المغادرين/ },
    { k: 'drop', l: 'المنقطعون', sh: 'المنقطعون', rx: /المنقطع/ },
    { k: 'notjoined', l: 'غير الملتحقين', sh: 'غير الملتحقين', rx: /غير\s*الملتحق|الغير\s*الملتحق|غير\s*ملتحق/ },
    { k: 'expelled', l: 'المفصولون', sh: 'المفصولون', rx: /المفصول/ },
    { k: 'repeat', l: 'المكررون', sh: 'المكررون', rx: /المكرر|الراسب/ },
    { k: 'success', l: 'الناجحون', sh: 'الناجحون', rx: /الناجح/ },
    // 1.9.3
    { k: 'transit', l: 'في طور التحويل', sh: 'في طور التحويل', rx: /طور\s*التحويل/ },
    { k: 'threat', l: 'المهددون بالفصل', sh: 'المهددون بالفصل', rx: /المهدد/ },
    { k: 'disab', l: 'في وضعية إعاقة', sh: 'وضعية إعاقة', rx: /إعاق|اعاق/ },
    { k: 'merged', l: 'المدمجون', sh: 'المدمجون', rx: /المدمج/ }
  ];
  const CAT = Object.fromEntries(CATS.map(c => [c.k, c]));
  const OUT = ['left', 'drop', 'notjoined', 'expelled']; // not counted in the current situation
  const catOfTitle = t => { t = String(t || ''); if (/غير\s*الملتحق|الغير\s*الملتحق|غير\s*ملتحق/.test(t)) return 'notjoined'; const c = CATS.find(x => x.k !== 'notjoined' && x.rx.test(t)); return c ? c.k : ''; };

  function migrate(db) {
    const p = db.pupils = db.pupils || {};
    p.years = p.years && typeof p.years === 'object' ? p.years : {};
    p.alias = p.alias && typeof p.alias === 'object' ? p.alias : {};
  }
  const PD = () => DB.pupils;
  // secondary cycles: every pupil / movement / list belongs to the institution itself (one «unit», never shown)
  function normSec() {
    try {
      if (!SEC() || !DB || !DB.pupils) return;
      const u = secUnit();
      Object.values(DB.pupils.years || {}).forEach(y => {
        ['pupils', 'moves', 'lists'].forEach(k => (y[k] || []).forEach(r => { if (r.unit !== u) r.unit = u; }));
        if ((y.pupils || []).length || (y.moves || []).length || (y.lists || []).length) { if (!y.units || y.units.length !== 1 || y.units[0] !== u) y.units = [u]; }
      });
    } catch (e) {}
  }
  const Y = (sy, create) => { const y = PD().years[sy] || (create ? (PD().years[sy] = {}) : null); if (y) { y.lists = y.lists || []; y.pupils = y.pupils || []; y.moves = y.moves || []; y.units = y.units || []; } return y || { lists: [], pupils: [], moves: [], units: [] }; };
  const curSy = () => MK.curSy();
  const gAr = g => (g === 'F' ? 'أنثى' : g === 'M' ? 'ذكر' : '');
  const gOf = v => { const s = String(v || '').trim(); return /^(أنثى|انثى|انثي|أنثي|f|fille|féminin|feminin|إ|ث)$/i.test(s) ? 'F' : /^(ذكر|m|garçon|garcon|masculin|ذ)$/i.test(s) ? 'M' : ''; };
  const fullN = p => `${p.last || ''} ${p.first || ''}`.trim();
  const isoD = v => { v = String(v == null ? '' : v).trim(); if (!v) return ''; const d = normDate(v); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : v; };

  /* ---------- school units ---------- */
  // display order: the central school first, then in the order of import
  // 1.9.4: the units registered in the settings (الإعدادات ← الوحدات المدرسية ورموز GRESA) are always offered, even before any list of theirs is imported
  const REG = () => (SEC() || typeof DB === 'undefined' || !DB || !DB.board || !Array.isArray(DB.board.units) ? [] : DB.board.units.filter(u => String(u.name || '').trim()));
  const regUnits = () => REG().map(u => String(u.name).trim());
  const regOf = n => REG().find(x => K.U.same(x.name, n) || nh(x.name) === nh(n)) || null;
  const gresaOfUnit = n => { const u = regOf(n); return u ? String(u.gresa || '').trim() : ''; };
  const canonUnit = n => { const u = regOf(n); return u ? String(u.name).trim() : n; };
  const unitsOf = sy => {
    // 1.9.4: when the units are written in the settings, they are the units (the pupils of a unit written otherwise in Massar join it)
    const fixed = K.U.names && DB.board && Array.isArray(DB.board.units) && DB.board.units.some(u => String(u.name || '').trim());
    if (fixed) { const o = DB.board.units.map(u => String(u.name || '').trim()).filter(Boolean); const y = Y(sy); y.pupils.concat(y.moves).forEach(p => { if (p.unit && !o.some(u => K.U.same(u, p.unit))) { const c = K.U.canon(p.unit); if (!o.includes(c) && c === p.unit) o.push(p.unit); } }); return o; }
    const y = Y(sy); const o = []; const add = u => { if (u && !o.includes(u)) o.push(u); }; y.units.forEach(add); regUnits().forEach(add); y.pupils.forEach(p => add(p.unit)); y.moves.forEach(m => add(m.unit)); return o;
  };
  const allUnitNames = () => { const o = []; Object.keys(PD().years).sort().reverse().forEach(sy => unitsOf(sy).forEach(u => { if (!o.includes(u)) o.push(u); })); return o; };
  // «م.م الشهيد الحسين بن علي-سيدي بلقاسم» / «فرعية أساكا-الشهيد الحسين بن علي» -> «سيدي بلقاسم» / «أساكا»
  const PREF = /^(م\.م|م\/م|م م|مجموعة مدارس|مجموعة المدارس|فرعية|الفرعية|مدرسة|المدرسة|وحدة|الوحدة|مركزية|المركزية|م\.|م)\s+/;
  const strip = t => { let x = String(t || '').trim(), y; do { y = x; x = x.replace(PREF, '').trim(); } while (x !== y); return x; };
  function unitNamesFor(insts) {
    const parts = insts.map(n => String(n || '').split(/\s*-\s*/).map(strip).filter(Boolean));
    // the school's own name: the part shared by most institutions
    const cnt = {};
    parts.forEach(ps => Array.from(new Set(ps.map(nh))).forEach(k => { cnt[k] = (cnt[k] || 0) + 1; }));
    const core = insts.length > 1 ? Object.keys(cnt).filter(k => cnt[k] === insts.length) : [];
    const out = {};
    insts.forEach((n, i) => {
      if (PD().alias[n]) { out[n] = PD().alias[n]; return; }
      const raw = String(n || '').split(/\s*-\s*/);
      if (raw.length >= 2 && /^\s*(فرعية|الفرعية|وحدة|الوحدة)/.test(raw[0])) { out[n] = strip(raw[0]); return; }
      if (raw.length >= 2 && /^\s*(م\.م|م\/م|م م|مجموعة مدارس|مجموعة المدارس)/.test(raw[0])) { out[n] = strip(raw[raw.length - 1]); return; }
      const rest = parts[i].filter(x => !core.includes(nh(x)));
      out[n] = rest.length ? rest.join(' - ') : (parts[i].length > 1 ? parts[i][parts[i].length - 1] : strip(n));
    });
    return out;
  }
  const isCentral = inst => /^\s*(م\.م|م\/م|مجموعة مدارس)/.test(inst || '');
  // the registered unit that the institution name of a Massar list points to («م.م الشهيد الحسين بن علي-سيدي بلقاسم» -> «سيدي بلقاسم»)
  function unitOfInstName(inst) {
    const k = nh(inst); let best = null;
    REG().forEach(u => { const t = nh(strip(u.name)); if (t.length >= 3 && k.includes(t) && (!best || t.length > best.t.length)) best = { t, n: String(u.name).trim() }; });
    if (best) return best.n;
    if (isCentral(inst)) { const c = REG().find(u => /مركزي/.test(u.name)); if (c) return String(c.name).trim(); }
    return '';
  }
  // 1.9.4: a school unit renamed (here or in the settings) follows everywhere in the pupils' data
  function renameUnit(old, n) {
    old = String(old || '').trim(); n = String(n || '').trim(); if (!old || !n || old === n) return;
    migrate(DB);
    Object.values(PD().years).forEach(yy => { ['pupils', 'moves', 'lists'].forEach(k => (yy[k] || []).forEach(p => { if (p.unit === old) p.unit = n; })); yy.units = Array.from(new Set((yy.units || []).map(u => (u === old ? n : u)))); });
    Object.keys(PD().alias).forEach(k => { if (PD().alias[k] === old) PD().alias[k] = n; });
  }

  /* ---------- Massar files ---------- */
  function readSheet(rows, name, file) {
    const cell = (r, c) => String(((rows[r] || [])[c]) == null ? '' : rows[r][c]).trim();
    // the meta block (academy, school, level, class, year) sits above the header row of the table
    let top0 = 9;
    for (let i = 0; i < Math.min(rows.length, 40); i++) { const r = (rows[i] || []).map(x => nh(x)); if (r.some(x => x === 'الرمز' || x === 'رقمالتلميذ' || x === 'رمزمسار' || x === 'codemassar')) { top0 = Math.min(9, i); break; } }
    const top = rows.slice(0, top0).map(r => (r || []).map(x => String(x == null ? '' : x).trim()));
    // label -> value of the meta block (label cells are followed by their value)
    const meta = rx => { for (const r of top) for (let j = 0; j < r.length; j++) if (rx.test(r[j])) { for (let k = j + 1; k < r.length; k++) if (r[k] && !/[:：]\s*$/.test(r[k])) return r[k]; } return ''; };
    const title = top.map(r => r.filter(Boolean).join(' ')).find(t => /لائحة|لوحة/.test(t)) || '';
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 40) && hi < 0; i++) {
      const r = (rows[i] || []).map(x => nh(x));
      if (r.some(x => x === 'الرمز' || x === 'رقمالتلميذ' || x === 'رمزمسار' || x === 'codemassar') && r.some(x => /^النسب|^الاسم$|^الاسم|^nom/.test(x))) hi = i;
    }
    if (hi < 0) return null;
    const H = (rows[hi] || []).map(x => nh(x));
    const col = test => H.findIndex(test);
    const c = { code: col(x => x === 'الرمز' || x === 'رقمالتلميذ' || x === 'رمزمسار' || x === 'codemassar'), last: col(x => /^النسب/.test(x) || x === 'nom'), first: col(x => x === 'الاسم' || x === 'prenom'),
      g: col(x => x === 'النوع' || x === 'الجنس' || x === 'sexe'), birth: col(x => /^تاريخالازدياد|^تاريخالولاده|^datedenaissance/.test(x)), place: col(x => /^مكانالازدياد|^مكانالولاده|^lieudenaissance/.test(x)),
      // 1.9.3: transfer lists (arrivals / departures), disabilities, combined name
      full: col(x => x === 'الاسموالنسب'), tdate: col(x => /^تاريخالتحويل/.test(x)), ttype: col(x => /^نوعالتحويل/.test(x)), rdate: col(x => /^تاريخالاستقبال/.test(x)),
      orig: col(x => /^الموسسهالاصليه/.test(x)), recv: col(x => /^موسسهالاستقبال/.test(x)), odir: col(x => /^مالاقليميه/.test(x)), oacad: col(x => /^(الاكاديميه|اكاديميه)(الاصليه|الاستقبال)/.test(x)),
      dis: col(x => /^نوعالاعاقه|^الاعاقه|^نوعالاحتياج/.test(x)), lv2: col(x => x === 'المستوي'),
      // 1.9.4: Massar «ElevesNonInscrits» / categories exports: status of the pupil, school of the row, class, parent phone / address, measures taken
      stat: col(x => /^وضعيهالتلميذ|^الوضعيه$/.test(x)), rinst: col(x => x === 'الموسسه'), rgresa: col(x => x === 'رمزالموسسه'), rcls: col(x => x === 'القسم'),
      phone: col(x => /^هاتفالولي|^هاتفالوالي|^هاتفوليالامر/.test(x)), addr: col(x => /^عنوانوليالامر|^العنوان/.test(x)), acts: col(x => /^الاجراءاتالمتخذه/.test(x)), fate: col(x => x === 'مال' || x === 'المال') };
    const pupils = [];
    rows.slice(hi + 1).forEach(r => {
      const g = k => (c[k] < 0 ? '' : String((r || [])[c[k]] == null ? '' : r[c[k]]).trim());
      const code = g('code').toUpperCase();
      let last = g('last'), first = g('first');
      if (c.full >= 0 && !last && !first) {
        // «أيت شريف عبدالرحمان»: the family name keeps its prefix (أيت، بن، أبو، مولاي…)
        const w = g('full').split(/\s+/).filter(Boolean); last = w.shift() || '';
        while (w.length > 1 && /^(أيت|آيت|ايت|إيت|بن|ابن|بنت|أبو|ابو|بو|ولد|أولاد|اولاد|الحاج|مولاي|مولى|سيدي|لالة|ال)$/.test(last.split(' ').pop())) last += ' ' + w.shift();
        first = w.join(' ');
      }
      if (!code && !last && !first) return;
      if (/^(الرمز|رقمالتلميذ|رمزمسار|codemassar)$/.test(nh(code)) || /^النسب/.test(nh(last))) return; // header repeated on every page of the export
      if (/^\d+$/.test(code) && !last) return;
      if (!code && !(last || first)) return;
      if (!code && /^(المجموع|مجموع|العدد|عدد|total)/i.test(String(last || first).trim())) return;
      const o = { code, last, first, g: gOf(g('g')), birth: isoD(g('birth')), place: g('place') };
      const ex = { date: isoD(g('tdate')), ttype: g('ttype'), rdate: isoD(g('rdate')), orig: g('orig'), recv: g('recv'), odir: g('odir'), oacad: g('oacad'), dis: g('dis'), lvlName: g('lv2'),
        status: g('stat'), rinst: g('rinst'), gresa: g('rgresa'), rcls: g('rcls'), phone: g('phone'), addr: g('addr'), acts: g('acts'), fate: g('fate') };
      Object.keys(ex).forEach(k => { if (ex[k]) o[k] = ex[k]; });
      pupils.push(o);
    });
    const cls = meta(/^:?\s*القسم\s*:?$|القسم\s*:/) || '';
    const sy = (meta(/السنة الدراسية|الموسم الدراسي/) || '').replace(/\s/g, '');
    // 1.9.4: the category is read from the title, else from the file / sheet name (ElevesNonInscrits, EleveAbandon...), else from the status column
    const stats = Array.from(new Set(pupils.map(o => catOfTitle(o.status)).filter(Boolean)));
    const cat = catOfTitle(title) || catOfFileName(file) || catOfFileName(name) || (stats.length === 1 && pupils.every(o => !o.status || catOfTitle(o.status)) ? stats[0] : '');
    if (cat) pupils.forEach(o => { if (o.rcls && !o.cls0) o.cls0 = o.rcls; });
    else for (let i = pupils.length - 1; i >= 0; i--) if (!pupils[i].code) pupils.splice(i, 1); // the enrolled lists need the Massar code
    return {
      file, sheet: name, title, kind: cat ? 'stat' : 'list', cat,
      academy: meta(/الأكاديمية/), directorate: meta(/المديرية/), commune: meta(/الجماعة/), inst: meta(/المؤسسة/),
      lvlLabel: meta(/المستوى/), cls: cls || (cat ? '' : name), sy: /^\d{4}\/\d{4}$/.test(sy) ? sy : '', pupils
    };
  }
  // sheet names of the transfers workbook (التحويلات.xlsx) and Massar lists named after their category
  // Massar export names (French): ElevesNonInscrits, ElevesAbandon, ElevesExclus, ElevesRedoublants, ElevesMenaces...
  const catOfFileName = n => { const t = String(n || '').toLowerCase().replace(/[\s_\-.]/g, ''); return /noninscri|nonintegr|غيرالملتحق|غيرملتحق/.test(t) ? 'notjoined' : /abandon|decroch|المنقطع/.test(t) ? 'drop' : /exclu|المفصول/.test(t) ? 'expelled' : /menac|المهدد/.test(t) ? 'threat' : /redoubl|المكرر/.test(t) ? 'repeat' : /handicap|اعاق|إعاق/.test(t) ? 'disab' : ''; };
  const catOfSheetName = n => { n = nh(n); return /طورالتحويل/.test(n) ? 'transit' : /المغادر/.test(n) ? 'left' : /الوافد/.test(n) ? 'joined' : ''; };
  async function importMassar(opts) {
    opts = opts && (opts.cats !== undefined || opts.unit || opts.board) ? opts : {};   // (a click event is not a set of options)
    if (!window.api.openTables) return toast('الاستيراد المتعدد غير متوفر', true);
    const res = await window.api.openTables();
    if (!res || !res.files) return;
    let found = [];
    const boards = [];
    res.files.forEach(f => (f.sheets || []).forEach(sh => {
      const bd = window.Pupils2 && Pupils2.readBoard ? Pupils2.readBoard(sh.rows || [], f.name) : null;
      if (bd) { boards.push(bd); return; }
      const p = readSheet(sh.rows || [], sh.name, f.name);
      if (!p) return;
      if (p.kind === 'list' && catOfSheetName(sh.name) && nh(p.cls) === nh(sh.name)) { p.kind = 'stat'; p.cat = catOfSheetName(sh.name); p.cls = ''; }
      found.push(p);
    }));
    // 1.9.4: a Massar file exported without any pupil (only the title and the header row) is said clearly
    const empty = found.filter(p => !p.pupils.length).map(p => p.file + (p.sheet && !/^sheet\d*$/i.test(p.sheet) ? ' (' + p.sheet + ')' : ''));
    found = found.filter(p => p.pupils.length);
    if (!found.length && !boards.length && empty.length) return modal({ title: 'لائحة فارغة', body: `<p style="margin-top:0;line-height:1.9">الملف <b>${esc(empty.join('، '))}</b> لا يحتوي على أي تلميذ: فيه عنوان اللائحة ورأس الجدول فقط، ولم يصدّر مسار أي سطر تحته.</p><p class="muted" style="line-height:1.9;margin-bottom:0">في منظومة مسار (لائحة غير الملتحقين): <b>الحياة المدرسية ← الهدر المدرسي ← آلية اليقظة</b>، اختر المستوى (أو «جميع المستويات») ثم اضغط «بحث» وتأكد أن التلاميذ ظاهرون في الجدول، وبعدها اضغط «تصدير»، ثم استورد الملف الجديد.</p>`, actions: [{ label: 'حسنا' }] });
    if (empty.length) setTimeout(() => toast('ملفات فارغة لم تُستورد (لا تلميذ فيها): ' + empty.join('، '), true), 400);
    if (opts.cats) {
      const n0 = found.length; found = found.filter(p => p.kind === 'stat' && opts.cats.includes(p.cat));
      if (!found.length && !boards.length) return toast(n0 ? 'الملفات المختارة لا تحتوي على لوائح هذه الفئة' : 'لم يتم العثور على لوائح مسار', true);
    }
    if (!found.length && boards.length) {
      const sy0 = boards[0].sy || curSy(), y = Y(sy0, true); boards.forEach(b => window.Pupils2.addBoard(y, b)); MK.setSy(sy0); persist();
      go('pupils', { tab: opts.board ? 'moves' : 'dash', dash: 'school' }); return toast(`تم استيراد لوحة إحصاء التمدرس من مسار${boards.length > 1 ? ` (${boards.length} لوحات مجمعة)` : ''}: ${y.board.rows.reduce((a, r) => a + (+r.totT || 0), 0)} تلميذ(ة) متمدرس(ة)`);
    }
    if (!found.length) return toast('لم يتم العثور على لوائح مسار (لائحة التلاميذ: الرمز، النسب، الإسم، النوع، تاريخ الإزدياد...)', true);
    const instOf = (p, r) => (p.kind === 'stat' ? (p.cat === 'joined' ? r.recv : p.cat === 'left' ? r.orig : '') || r.rinst : '') || p.inst;
    const insts = Array.from(new Set(found.flatMap(p => [p.inst].concat(p.kind === 'stat' ? p.pupils.map(r => instOf(p, r)) : [])).filter(Boolean)));
    const names = SEC() ? Object.fromEntries(insts.map(n => [n, secUnit()])) : unitNamesFor(insts);
    if (!SEC()) insts.forEach(n => { const r = unitOfInstName(n); if (opts.unit && !PD().alias[n]) names[n] = opts.unit; else if (r && !PD().alias[n]) names[n] = r; else names[n] = canonUnit(names[n]); });
    const sys = Array.from(new Set(found.map(p => p.sy).filter(Boolean)));
    const target0 = sys.length === 1 ? sys[0] : curSy();
    const lists = found.filter(p => p.kind === 'list'), stats = found.filter(p => p.kind === 'stat');
    const nP = lists.reduce((a, p) => a + p.pupils.length, 0), nM = stats.reduce((a, p) => a + p.pupils.length, 0);
    const body = document.createElement('div');
    const hasData = Y(target0).pupils.length > 0;
    body.innerHTML = `<p style="margin-top:0;line-height:1.8">تم العثور على <b>${lists.length}</b> لائحة تلاميذ (${nP} تلميذ(ة))${stats.length ? ` و<b>${stats.length}</b> لائحة فئات/تحويلات (${nM} تلميذ(ة))` : ''}${boards.length ? ` ولوحة إحصاء التمدرس` : ''} في <b>${res.files.length}</b> ملف${res.errors && res.errors.length ? ` — تعذرت قراءة: ${esc(res.errors.join('، '))}` : ''}.</p>
      <div class="fgrid"><div class="fld"><label>الموسم الدراسي</label><select class="inp" id="pmSy">${MK.syList(sys).map(y => `<option value="${y}" ${y === target0 ? 'selected' : ''}>${MK.syDash(y)}</option>`).join('')}</select></div>
        ${lists.length ? `<div class="fld"><label>طريقة استيراد لوائح التلاميذ</label><select class="inp" id="pmMode"><option value="merge">إضافة وتحيين (حسب رمز مسار)</option><option value="replace" ${hasData ? '' : 'selected'}>تعويض لوائح هذا الموسم بهذه الملفات</option></select></div>` : '<input type="hidden" id="pmMode" value="merge">'}</div>
      ${SEC() ? '' : `<div class="sec-t">ربط كل مؤسسة في ملفات مسار بوحدة مدرسية</div>
      <p class="muted" style="font-size:12.5px;line-height:1.8;margin:0 0 8px">اختر الوحدة من الوحدات المسجلة في الإعدادات${regUnits().length ? ` (${regUnits().map(u => esc(u) + (gresaOfUnit(u) ? ' — ' + esc(gresaOfUnit(u)) : '')).join('، ')})` : ''}. تُقترح الوحدة تلقائيا حسب اسم المؤسسة، ويمكنك تغييرها أو كتابة اسم جديد.</p>
      <div class="fgrid">${insts.map((n, i) => `<div class="fld"><label style="font-weight:500">${esc(n)}</label><input class="inp" data-inst="${i}" list="puRegUnits" value="${esc(names[n])}"></div>`).join('')}</div>
      <datalist id="puRegUnits">${regUnits().map(u => `<option value="${esc(u)}">`).join('')}</datalist>`}
      <div class="sec-t">اللوائح</div>
      <div class="ag-wrap" style="max-height:34vh"><table class="tbl compact"><thead><tr><th>الملف</th>${SEC() ? '' : '<th>الوحدة</th>'}<th>القسم</th><th>المستويات</th><th>النوع</th><th>العدد</th></tr></thead><tbody>
        ${found.map(p => { const lv = p.kind === 'list' ? (LV.ofClass(p.cls).length ? LV.ofClass(p.cls) : [LV.fromLabel(p.lvlLabel)].filter(Boolean)) : [LV.fromLabel(p.lvlLabel)].filter(Boolean); return `<tr><td class="muted" style="font-size:12px">${esc(p.file)}</td>${SEC() ? '' : `<td>${esc(names[p.inst] || p.inst || '')}</td>`}<td dir="ltr" style="text-align:right">${esc(p.cls || '—')}</td>
          <td>${esc(lv.map(LV.sh).join(' + ') || p.lvlLabel)}</td><td>${p.kind === 'list' ? 'لائحة التلاميذ (المتمدرسون)' : `<span class="k2-pill out">${esc(CAT[p.cat].sh)}</span>`}</td><td class="num">${p.pupils.length}</td></tr>`; }).join('')}
      </tbody></table></div>
      <p class="muted" style="font-size:12px;line-height:1.7;margin-bottom:0">كل فئة تُحفظ منعزلة عن لائحة التلاميذ المتمدرسين (الوافدون، المغادرون، المنقطعون، غير الملتحقين، المهددون بالفصل...). ${SEC() ? 'تعوض اللوائح المستوردة معطيات نفس الفئة والمستوى، ولا يتكرر التلميذ في نفس الفئة.' : 'في الأقسام المشتركة (مثلا 1APG-2APG) يقدر البرنامج مستوى كل تلميذ حسب سنة الازدياد، ويمكنك تصحيحه من «لائحة التلاميذ». تعوض اللوائح المستوردة معطيات نفس الفئة والوحدة والمستوى، ولا يتكرر التلميذ في نفس الفئة.'}</p>`;
    modal({ title: 'استيراد لوائح مسار', size: 'xl', body, actions: [{ label: ic('up') + ' استيراد', cls: 'pri', onClick: m => {
      const sy = $('#pmSy', m).value, mode = $('#pmMode', m).value;
      if (!SEC()) insts.forEach((n, i) => { const v = $(`[data-inst="${i}"]`, m).value.trim(); if (v) { names[n] = v; PD().alias[n] = v; } });
      apply(sy, mode, lists, stats, names);
      normSec();
      boards.forEach(b => { window.Pupils2.addBoard(Y(sy, true), b); });
      MK.setSy(sy);
      persist(); try { toCerts(sy, true); } catch (e) {}
      const only = !lists.length && stats.length ? Array.from(new Set(stats.map(p => p.cat))) : [];
      go('pupils', only.length === 1 ? { tab: 'moves', cat: only[0] } : { tab: only.length ? 'moves' : 'list' });
      toast(`تم استيراد ${nP ? nP + ' تلميذ(ة) من ' + lists.length + ' لائحة' : ''}${nP && nM ? ' و' : ''}${nM ? nM + ' حالة (فئات/تحويلات)' : ''}`);
    } }, { label: 'إلغاء' }] });
  }
  function apply(sy, mode, lists, stats, names) {
    const y = Y(sy, true);
    const old = new Map(y.pupils.map(p => [p.code, p]));
    if (mode === 'replace' && lists.length) { y.lists = []; y.pupils = []; }
    const now = new Date().toISOString();
    const instOf = (p, r) => (p.cat === 'joined' ? r.recv : p.cat === 'left' ? r.orig : '') || r.rinst || p.inst;
    const unitOfInst = inst => (SEC() ? secUnit() : (names[inst] || PD().alias[inst] || (inst ? unitNamesFor([inst])[inst] : '') || 'المؤسسة'));
    const dflt = r => ((r && r.code && (y.pupils.find(x => x.code === r.code) || {}).unit) || y.units[0] || (SEC() ? secUnit() : 'المؤسسة'));
    const unitOfRow = (p, r) => { const i = instOf(p, r); return i ? unitOfInst(i) : dflt(r); };
    const unitOrder = [];
    lists.forEach(p => { const u = unitOfInst(p.inst); if (!unitOrder.some(x => x.u === u)) unitOrder.push({ u, c: isCentral(p.inst) }); });
    stats.forEach(p => { p.pupils.forEach(r => { const i = instOf(p, r); if (!i) return; const u = unitOfInst(i); if (!unitOrder.some(x => x.u === u)) unitOrder.push({ u, c: isCentral(i) }); }); });
    unitOrder.sort((a, b) => (b.c ? 1 : 0) - (a.c ? 1 : 0)).forEach(({ u }) => { if (!y.units.includes(u)) y.units.push(u); });
    if (unitOrder.some(x => x.c)) { const c = unitOrder.find(x => x.c).u; y.units = [c].concat(y.units.filter(u => u !== c)); }
    lists.forEach(p => {
      const unit = unitOfInst(p.inst);
      let levels = LV.ofClass(p.cls);
      if (!levels.length) { const l = LV.fromLabel(p.lvlLabel); if (l) levels = [l]; }
      const L = { id: uid('pl'), file: p.file, sheet: p.sheet, inst: p.inst, unit, cls: p.cls, lvlLabel: p.lvlLabel, levels, n: p.pupils.length, at: now };
      y.lists = y.lists.filter(x => !(x.unit === unit && x.cls === p.cls));
      y.lists.push(L);
      p.pupils.forEach((r, ri) => {
        r.ord = ri + 1; // 1.9.4: rank of the pupil in the Massar list of the class (the lists keep the Massar order)
        const prev = y.pupils.find(x => x.code === r.code) || (mode === 'replace' ? old.get(r.code) : null);
        const keep = prev && prev.lsrc === 'man' && levels.includes(prev.lvl);
        // 1.9.4: the level written for the pupil in the Massar file (column «المستوى») wins over the guess by age of a combined class
        const own = LV.fromLabel(r.lvlName || '');
        const lvl = keep ? prev.lvl : own || LV.guess(levels, r.birth, sy);
        const o = Object.assign({}, prev || { id: uid('pp') }, r, { unit, cls: p.cls, lvl, lsrc: keep ? 'man' : own ? 'file' : levels.length > 1 ? 'age' : 'one', listId: L.id });
        if (prev && y.pupils.includes(prev)) Object.assign(prev, o); else y.pupils.push(o);
      });
    });
    // categories (arrivals, departures, dropouts, not joined, threatened, disabilities…) and transfer lists: kept apart from the pupils lists
    // 1.9.4: all the sheets / files of one import are taken together. Before, a second sheet of the same category (one sheet per level or
    // per class, often without a readable level for «غير الملتحقين») erased the pupils just added by the first one: only the last sheet stayed.
    const all = [];
    stats.forEach(p => p.pupils.forEach(r => {
      const unit = unitOfRow(p, r);
      const base0 = r.code ? y.pupils.find(x => x.code === r.code) : null;
      const lvl = LV.fromLabel(r.lvlName) || LV.fromLabel(p.lvlLabel) || (base0 && base0.lvl) || '';
      all.push({ p, r, unit, lvl });
    }));
    const groups = new Set(all.map(x => x.p.cat + '|' + x.unit + '|' + x.lvl));
    y.moves = y.moves.filter(m => !(m.src === 'file' && groups.has(m.cat + '|' + m.unit + '|' + m.lvl)));
    const seen = new Set();
    all.forEach(({ p, r, unit, lvl }) => {
      const key = p.cat + '|' + (r.code || (nh(r.last) + ' ' + nh(r.first) + '|' + (r.birth || '')));
      if (seen.has(key)) return; // the same pupil twice in the selected files
      seen.add(key);
      if (r.code) y.moves = y.moves.filter(m => !(m.cat === p.cat && m.code === r.code));
      const base = (r.code && y.pupils.find(x => x.code === r.code)) || {};
      const o = Object.assign({ id: uid('pm'), cat: p.cat, unit, lvl, src: 'file', date: '', file: p.file }, r, { g: r.g || base.g || '', birth: r.birth || base.birth || '', place: r.place || base.place || '', cls: base.cls || r.rcls || '' });
      delete o.lvlName; delete o.rcls; delete o.cls0; y.moves.push(o);
    });
  }

  /* ---------- calculations ---------- */
  const movesOf = (sy, cat) => Y(sy).moves.filter(m => !cat || m.cat === cat);
  // current pupils: the lists minus the pupils marked as gone (dropped out, left, not joined, expelled)
  function current(sy) {
    const gone = new Set(Y(sy).moves.filter(m => OUT.includes(m.cat) && m.code).map(m => m.code));
    return Y(sy).pupils.filter(p => !gone.has(p.code));
  }
  const levelsOf = (sy, arr) => LV.sort(Array.from(new Set((arr || Y(sy).pupils).map(p => p.lvl).filter(Boolean))));
  const cnt = (arr, f) => { let m = 0, w = 0; arr.forEach(p => { if (f && !f(p)) return; if (p.g === 'F') w++; else m++; }); return { m, f: w, t: m + w }; };
  const ageOf = (p, sy) => LV.age(p.birth, sy);
  // two cycles: pre-school (DEPE / PS1 / PS2: «أطفال التعليم الأولي») and primary school («تلاميذ التعليم الابتدائي»)
  const stageOf = l => ((LV.byK(l) || {}).pre ? 'pre' : 'pri');
  const inStage = (p, st) => !st || stageOf(p.lvl) === st;
  const ST = { '': { n: 'التلاميذ', one: 'تلميذ(ة)', t: 'كل الأسلاك' }, pre: { n: 'الأطفال', one: 'طفل(ة)', t: 'التعليم الأولي' }, pri: { n: 'التلاميذ', one: 'تلميذ(ة)', get t() { const c = (typeof S === 'function' && DB ? S().cycle : '') || ''; return /إعدادي/.test(c) ? 'التعليم الثانوي الإعدادي' : /تأهيلي/.test(c) ? 'التعليم الثانوي التأهيلي' : 'التعليم الابتدائي'; } } };
  let stage = '';
  const curS = (sy, st) => current(sy).filter(p => inStage(p, st == null ? stage : st));
  const movesS = (sy, cat, st) => movesOf(sy, cat).filter(m => inStage(m, st == null ? stage : st));
  function summary() {
    migrate(DB); normSec();
    const sy = curSy(), arr = current(sy);
    if (!Y(sy).pupils.length) return { n: 0 };
    const c = cnt(arr);
    const lv = levelsOf(sy, arr);
    const nPre = SECL() ? 0 : arr.filter(p => stageOf(p.lvl) === 'pre').length;
    return { n: c.t, pre: nPre, pri: c.t - nPre, f: c.f, fp: K.pct(c.f, c.t, 1), units: SEC() ? 0 : unitsOf(sy).length, classes: Y(sy).lists.length,
      joined: movesOf(sy, 'joined').length, left: movesOf(sy, 'left').length, drop: movesOf(sy, 'drop').length, notjoined: movesOf(sy, 'notjoined').length,
      chart: K.bars(lv.map(LV.sh), [{ name: 'ذكور', color: COL.m, vals: lv.map(l => cnt(arr, p => p.lvl === l).m) }, { name: 'إناث', color: COL.f, vals: lv.map(l => cnt(arr, p => p.lvl === l).f) }], { w: 420, h: 150, fs: 8.5 }) };
  }
  // everyone known for a school year (pupils of the imported lists + people of the movements), normalised for pickers
  function people(sy) {
    sy = sy || curSy();
    let y = Y(sy);
    if (!y.pupils.length && !y.moves.length) { const k = Object.keys(PD().years).sort().reverse().find(s => (PD().years[s].pupils || []).length || (PD().years[s].moves || []).length); if (k) { sy = k; y = Y(k); } }
    const seen = new Set(), out = [];
    const add = (p, mv) => {
      const name = fullN(p); if (!name && !p.code) return;
      const key = p.code ? 'c' + String(p.code).toUpperCase() : 'n' + nh(name);
      if (seen.has(key)) return; seen.add(key);
      out.push({ name, last: p.last || '', first: p.first || '', code: String(p.code || '').toUpperCase(), g: p.g || '', gender: gAr(p.g), birth: p.birth || '', place: p.place || '', unit: p.unit || '', cls: p.cls || '', lvl: p.lvl || '', lvlSh: LV.sh(p.lvl), pre: !!(LV.byK(p.lvl) || {}).pre, move: mv ? (CAT[p.cat] || {}).sh || '' : '' });
    };
    y.pupils.forEach(p => add(p, 0)); y.moves.forEach(m => add(m, 1));
    return out.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  }
  // 1.9.4: exact level of the pupils of the combined classes («أقسام مشتركة»): the level is known by their Massar code in the other Massar files
  // already imported (results of the continuous assessment, tests): the guess by age is replaced. A level chosen by hand is never changed.
  function exactLevels(sy) {
    const m = new Map();
    try { const cc = DB.cc && DB.cc.years && DB.cc.years[sy]; if (cc) Object.values(cc).forEach(arr => (Array.isArray(arr) ? arr : []).forEach(c => { if (c && c.lvl) (c.pupils || []).forEach(p => { if (p.code) m.set(String(p.code).toUpperCase(), c.lvl); }); })); } catch (_) {}
    try { const rz = DB.roaiz && DB.roaiz.years && DB.roaiz.years[sy]; if (Array.isArray(rz)) rz.forEach(g => { const l = LV.fromLabel(g.level || ''); if (l) (g.pupils || []).forEach(p => { const c = String(p.id || p.code || '').toUpperCase(); if (c && !m.has(c)) m.set(c, l); }); }); } catch (_) {}
    try { Y(sy).moves.forEach(mv => { const l = LV.fromLabel(mv.lvlName || ''); if (l && mv.code && !m.has(mv.code)) m.set(mv.code, l); }); } catch (_) {}
    return m;
  }
  function refineLevels(sy) {
    const y = Y(sy), ex = exactLevels(sy); let n = 0;
    y.pupils.forEach(p => {
      if (p.lsrc === 'man' || p.lsrc === 'file') return;
      const l = ex.get(String(p.code || '').toUpperCase()); if (!l) return;
      const L = y.lists.find(x => x.id === p.listId), ok = !L || !(L.levels || []).length || L.levels.includes(l);
      if (!ok) return;
      if (p.lvl !== l) n++;
      p.lvl = l; p.lsrc = 'file';
    });
    return { changed: n, guessed: y.pupils.filter(p => p.lsrc === 'age').length };
  }
  // 1.9.4: the order of the Massar lists (class, then the rank in the list) — for the registers of absence and the class lists
  function massarOrder(arr, sy) {
    const all = Y(sy || curSy()).pupils, pos = new Map(all.map((p, i) => [p, i]));
    const cpos = new Map(); all.forEach(p => { if (!cpos.has(p.cls)) cpos.set(p.cls, cpos.size); });
    return arr.slice().sort((a, b) => ((cpos.get(a.cls) ?? 1e6) - (cpos.get(b.cls) ?? 1e6)) || ((a.ord || 1e6) - (b.ord || 1e6)) || ((pos.get(a) ?? 1e9) - (pos.get(b) ?? 1e9)));
  }
  window.Pupils = { massarOrder, refineLevels, exactLevels, migrate, summary, people, toCerts, renameUnit, gresaOf: gresaOfUnit, regUnit: regOf, unitNames: () => { migrate(DB); return unitsOf(curSy()); }, current, unitsOf, levelsOf, cnt, movesOf, CATS, Y: sy => Y(sy) };


  /* ---------- 1.9.2: same family name (siblings) ---------- */
  const famKey = p => nh(String(p.last || '').replace(/\s+/g, ' ').trim());
  // groups of current pupils sharing a family name (2 or more), optionally within one unit
  function famGroups(sy, st, unit) {
    const m = new Map();
    current(sy).filter(p => inStage(p, st) && (!unit || K.U.same(p.unit, unit))).forEach(p => { const k = famKey(p); if (!k) return; if (!m.has(k)) m.set(k, []); m.get(k).push(p); });
    return Array.from(m.values()).filter(g => g.length > 1).sort((a, b) => String(a[0].last).localeCompare(String(b[0].last), 'ar'));
  }
  function docFam(s, sy, f) {
    const units = unitsOf(sy), groups = famGroups(sy, f.stage, f.unit);
    const rows = []; let n = 0;
    groups.forEach(g => g.slice().sort((a, b) => LV.idx(a.lvl) - LV.idx(b.lvl) || String(a.cls).localeCompare(String(b.cls))).forEach((p, i) => {
      rows.push(`<tr${i === 0 ? ' style="border-top:2px solid #2c56a6"' : ''}>${i === 0 ? `<td rowspan="${g.length}">${++n}</td><td rowspan="${g.length}" class="r"><b>${esc(g[0].last)}</b><br><span class="sm">${g.length} تلاميذ</span></td>` : ''}<td class="r">${esc(p.first)}</td><td>${gAr(p.g)}</td><td dir="ltr">${esc(p.cls)}</td><td>${esc(LV.sh(p.lvl))}</td>${units.length > 1 ? `<td>${esc(p.unit)}</td>` : ''}${i === 0 ? `<td rowspan="${g.length}"></td>` : ''}</tr>`);
    }));
    const blocks = [{ table: { cls: 'sb-t', head: `<tr><th style="width:5%">ر.ت</th><th style="width:17%">الاسم العائلي</th><th>الاسم الشخصي</th><th style="width:7%">النوع</th><th style="width:11%">القسم</th><th style="width:12%">المستوى</th>${units.length > 1 ? '<th style="width:14%">الوحدة</th>' : ''}<th style="width:16%">التوقيت المشترك / ملاحظات</th></tr>`, rows, minRows: 1 } }];
    return { title: 'لائحة التلاميذ المشتركين في الاسم العائلي', sub: `الموسم الدراسي ${esc(sy)}${f.unit ? ' — ' + esc(f.unit) : ''} — ${groups.length} أسرة، ${groups.reduce((a, g) => a + g.length, 0)} تلميذ(ة)`, blocks, page: 'a4', sign: true };
  }

  /* ---------- 1.9.2: parents' information (أب / أم / ولي أمر) — import and export in the layout of Massar's «Tuteur» file ---------- */
  const GF = ['cin', 'first', 'last', 'firstFr', 'lastFr', 'job', 'phone', 'addr'];
  const GL = { cin: 'ر.ب.و', first: 'الإسم بالعربية', last: 'النسب بالعربية', firstFr: 'الإسم بالفرنسية', lastFr: 'النسب بالفرنسية', job: 'المهنة', phone: 'الهاتف', addr: 'العنوان' };
  const GR = [['tutor', 'معلومات عن ولي الامر'], ['father', 'معلومات عن الأب'], ['mother', 'معلومات عن الأم']];
  const gName = o => o ? [o.first, o.last].filter(Boolean).join(' ') : '';
  const hasG = o => !!o && GF.some(k => o[k]);
  const gPhone = p => { const g = p.guard || {}; return [g.tutor, g.mother, g.father].map(o => o && o.phone).find(Boolean) || ''; };
  function guardForm(p, after) {
    p.guard = p.guard || {};
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin-top:0"><b>${esc(fullN(p))}</b> — ${esc(p.cls || '')}</p>
      <div class="fld"><label>نوع الوصاية</label><select class="inp" id="gT"><option value=""></option>${['أب', 'أم', 'وصي'].map(x => `<option ${p.guard.type === x ? 'selected' : ''}>${x}</option>`).join('')}</select></div>
      ${GR.map(([k, l]) => `<div class="sec-t">${l}</div><div class="fgrid">${GF.map(f => `<div class="fld ${f === 'addr' ? 'full' : ''}"><label>${GL[f]}</label><input class="inp" data-g="${k}.${f}" ${['cin', 'firstFr', 'lastFr', 'phone'].includes(f) ? 'dir="ltr"' : ''} value="${esc(((p.guard[k] || {})[f]) || '')}"></div>`).join('')}</div>`).join('')}`;
    modal({ title: 'معلومات الأولياء', size: 'lg', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: m => {
      p.guard.type = $('#gT', m).value;
      $$('[data-g]', m).forEach(i => { const [k, f] = i.dataset.g.split('.'); (p.guard[k] = p.guard[k] || {})[f] = i.value.trim(); });
      persist(); after && after(); toast('تم حفظ معلومات الأولياء');
    } }, { label: 'إلغاء' }] });
  }
  // parse a Massar «Tuteur» export: two header rows ("معلومات عن الأب" ... then ر.ب.و / الإسم...), numeric id (hidden col. A), code, names
  function readGuardSheet(rows) {
    const R = rows.map(r => (r || []).map(x => String(x == null ? '' : x).trim()));
    const hi = R.findIndex((r, i) => i < 25 && r.some(x => /معلومات\s*عن\s*(الأب|الاب)/.test(x)));
    if (hi < 0) return null;
    const H = R[hi];
    const start = rx => H.findIndex(x => rx.test(x));
    const st = { tutor: start(/ولي\s*الامر|ولي\s*الأمر/), father: start(/عن\s*(الأب|الاب)/), mother: start(/عن\s*(الأم|الام)/) };
    const col = rx => H.findIndex(x => rx.test(nh(x)));
    const cCode = col(/^رقمالتلميذ$/), cLast = col(/^النسببالعربي[هة]$/), cFirst = col(/^الاسمبالعربي[هة]$/), cType = col(/^نوعالوصاي[هة]$/);
    const meta = rx => { for (const r of R.slice(0, hi)) for (let j = 0; j < r.length; j++) if (rx.test(r[j])) { for (let k = j + 1; k < r.length; k++) if (r[k]) return r[k]; } return ''; };
    const out = [];
    R.slice(hi + 2).forEach(r => {
      if (!r.some(Boolean)) return;
      const o = { mid: /^\d{5,}$/.test(r[0]) ? r[0] : '', code: cCode >= 0 ? r[cCode].toUpperCase() : '', last: cLast >= 0 ? r[cLast] : '', first: cFirst >= 0 ? r[cFirst] : '', type: cType >= 0 ? r[cType] : '', guard: {} };
      GR.forEach(([k]) => { if (st[k] < 0) return; const g = {}; GF.forEach((f, i) => { const v = r[st[k] + i]; if (v) g[f] = v; }); if (Object.keys(g).length) o.guard[k] = g; });
      if (o.mid || o.code || o.last || Object.keys(o.guard).length) out.push(o);
    });
    return { rows: out, cls: meta(/^\s*القسم/), level: meta(/^\s*المستوى/) };
  }
  async function importGuards(sy, after) {
    const sheets = await MK.openTable(); if (!sheets) return;
    const y = Y(sy), all = [];
    sheets.forEach(sh => { const g = readGuardSheet(sh.rows); if (g) all.push(g); });
    if (!all.length) return toast('لم يتم العثور على ملف معلومات الأولياء (معلومات عن الأب / الأم / ولي الأمر)', true);
    let n = 0, un = 0, byMid = 0, byOrder = 0; const miss = [];
    const nameKey = (l, f) => nh(l + ' ' + f);
    all.forEach(g => {
      const inCls = y.pupils.filter(p => g.cls && p.cls === g.cls);
      const useOrder = !g.rows.some(r => r.mid && y.pupils.some(p => p.mid === r.mid)) && !g.rows.some(r => r.code || r.last) && inCls.length === g.rows.length && inCls.length > 0;
      g.rows.forEach((r, i) => {
        let p = (r.code && y.pupils.find(x => x.code === r.code)) || (r.mid && y.pupils.find(x => x.mid === r.mid)) || ((r.last || r.first) && y.pupils.find(x => nameKey(x.last, x.first) === nameKey(r.last, r.first))) || null;
        if (p && r.mid && !p.mid) { p.mid = r.mid; byMid++; }
        if (!p && useOrder) { p = inCls[i]; byOrder++; if (p && r.mid) p.mid = r.mid; }
        if (!p) { un++; if (miss.length < 8) miss.push(r.code || r.mid || nameKey(r.last, r.first)); return; }
        p.guard = p.guard || {};
        if (r.type) p.guard.type = r.type;
        Object.entries(r.guard).forEach(([k, v]) => { p.guard[k] = Object.assign({}, p.guard[k] || {}, v); });
        n++;
      });
    });
    persist();
    toast(`تم تحيين معلومات الأولياء لـ ${n} تلميذ(ة)${byOrder ? ` (${byOrder} بمطابقة الترتيب داخل القسم: راجعها)` : ''}${un ? `، وتعذر ربط ${un} سطرا (${miss.join('، ')}) لأن الملف لا يحمل رمز مسار ولا الاسم` : ''}`, un > 0);
    after && after();
  }
  async function exportGuards(sy, list) {
    const y = Y(sy);
    const head1 = ['', '', 'رقم التلميذ', 'النسب بالعربية', 'الإسم بالعربية', 'نوع الوصاية'];
    GR.forEach(([, l]) => { head1.push(l); for (let i = 1; i < GF.length; i++) head1.push(''); });
    const head2 = ['', '', '', '', '', ''];
    GR.forEach(() => GF.forEach(f => head2.push(GL[f])));
    const rows = [['الأكاديمية :', S().academy || '', 'المديرية الإقليمية :', S().directorate || ''], ['المؤسسة :', S().school || '', 'السنة الدراسية', sy], [], head1, head2];
    list.forEach(p => { const g = p.guard || {}; rows.push([p.mid || '', '', p.code, p.last, p.first, g.type || ''].concat(...GR.map(([k]) => GF.map(f => (g[k] || {})[f] || '')))); });
    const widths = [10, 4, 14, 16, 16, 10].concat(...GR.map(() => [10, 14, 14, 14, 14, 12, 12, 24]));
    const r = await window.api.saveXlsx(rows, `معلومات_الأولياء_${MK.syDash(sy)}.xlsx`, 'Tuteur', widths);
    if (r && r.ok) toast('تم تصدير معلومات الأولياء (نفس ترتيب أعمدة ملف مسار)');
  }
  function tabGuard(b, sy) {
    const y = Y(sy), units = unitsOf(sy), cls = Array.from(new Set(y.pupils.filter(p => !flt.unit || K.U.same(p.unit, flt.unit)).map(p => p.cls).filter(Boolean)));
    if (flt.cls && !cls.includes(flt.cls)) flt.cls = '';
    b.innerHTML = `<div class="card"><div class="toolbar">
        <div class="search">${ic('search')}<input class="inp" id="gq" placeholder="بحث بالاسم أو اسم الأب/الأم أو الهاتف..." value="${esc(flt.q)}"></div>
        ${SEC() ? '' : `<select class="inp" id="gu" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${flt.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`}
        <select class="inp" id="gc" style="width:auto" dir="ltr"><option value="">كل الأقسام</option>${cls.map(u => `<option ${flt.cls === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
        <span style="flex:1"></span><span class="muted" id="gn"></span>
        <button class="btn sm" id="gImp">${ic('up')} استيراد (ملف مسار)</button><button class="btn sm" id="gExp">${ic('down')} تصدير Excel</button></div>
      <p class="muted" style="margin:8px 16px 0;font-size:12.5px;line-height:1.8">حمّل من مسار ملف «معلومات الأولياء» (Tuteur) لكل قسم ثم اضغط «استيراد»: يربط البرنامج كل سطر بالتلميذ برمز مسار أو بالاسم، ويحفظ معلومات الأب والأم وولي الأمر. ويمكنك تعديل أي تلميذ يدويا أو تصدير المعطيات إلى Excel.</p>
      <div id="gT" style="overflow:auto"></div></div>`;
    const list = () => { const q = nh(flt.q); return current(sy).filter(p => inStage(p, stage) && (!flt.unit || K.U.same(p.unit, flt.unit)) && (!flt.cls || p.cls === flt.cls) && (!q || nh([fullN(p), gName((p.guard || {}).father), gName((p.guard || {}).mother), gName((p.guard || {}).tutor), gPhone(p)].join(' ')).includes(q)))
      .sort((a, c) => units.indexOf(a.unit) - units.indexOf(c.unit) || String(a.cls).localeCompare(String(c.cls)) || fullN(a).localeCompare(fullN(c), 'ar')); };
    const draw = () => {
      const L = list(), nG = L.filter(p => p.guard && GR.some(([k]) => hasG(p.guard[k]))).length;
      $('#gn').textContent = `${L.length} ${ST[stage].one} — ${nG} لهم معلومات أولياء`;
      $('#gT').innerHTML = L.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>الاسم والنسب</th><th>القسم</th><th>الأب</th><th>الأم</th><th>الولي / الوصي</th><th>الهاتف</th><th></th></tr></thead><tbody>
        ${L.slice(0, 1500).map((p, i) => { const g = p.guard || {}; return `<tr data-id="${p.id}"><td class="muted num">${i + 1}</td><td><b>${esc(fullN(p))}</b></td><td dir="ltr" style="text-align:right;font-size:12px">${esc(p.cls)}</td>
          <td>${esc(gName(g.father))}</td><td>${esc(gName(g.mother))}</td><td>${esc(gName(g.tutor))}${g.type ? ` <span class="muted">(${esc(g.type)})</span>` : ''}</td><td class="num" dir="ltr" style="text-align:right">${esc(gPhone(p))}</td>
          <td class="act"><button class="btn sm" data-a="g">${ic('edit')} تعديل</button></td></tr>`; }).join('')}</tbody></table>` : '<div class="empty-state">لا توجد نتائج</div>';
      $$('#gT tr[data-id]').forEach(tr => { const p = y.pupils.find(x => x.id === tr.dataset.id); $('[data-a=g]', tr).onclick = () => guardForm(p, draw); });
    };
    $('#gq').oninput = e => { flt.q = e.target.value; draw(); };
    if ($('#gu')) $('#gu').onchange = e => { flt.unit = e.target.value; flt.cls = ''; go('pupils'); };
    $('#gc').onchange = e => { flt.cls = e.target.value; draw(); };
    $('#gImp').onclick = () => importGuards(sy, () => go('pupils', { tab: 'guard' }));
    $('#gExp').onclick = () => exportGuards(sy, list());
    draw();
  }
  /* ================================================================= */
  let tab = 'list';
  const flt = { q: '', unit: '', cls: '', lvl: '', g: '', est: false, fam: false };
  window.pagePupils = function (v, arg) {
    migrate(DB); normSec();
    if (SECL()) stage = ''; if (SEC()) { flt.unit = ''; flt.munit = ''; flt.dunit = ''; }
    if (arg && arg.tab) tab = arg.tab;
    if (arg && arg.cat) flt.mcat = arg.cat;
    if (arg && arg.dash) flt.dash = arg.dash;
    const sy = curSy(), y = Y(sy);
    const T = [['list', 'المتمدرسون (لائحة التلاميذ)'], ['moves', 'الفئات والحركية (الوافدون، المغادرون، المنقطعون...)'], ['dash', 'لوحات الإحصاء'], ['guard', 'معلومات الأولياء'], ['stats', 'الإحصائيات والمبيانات'], ['classes', SEC() ? 'اللوائح المستوردة (الأقسام)' : 'اللوائح المستوردة والوحدات']];
    const c = cnt(current(sy));
    v.innerHTML = `<div class="page-h"><h1>بطاقة التلاميذ</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))} — ${y.pupils.length ? splitText(sy, c) : 'لا توجد لوائح بعد'}</span><span class="sp"></span>
        <button class="btn" id="puDocs">${ic('print')} الوثائق</button>
        <button class="btn" id="puExp" ${y.pupils.length ? '' : 'disabled'}>${ic('down')} تصدير Excel</button>
        <button class="btn danger" id="puWipe" title="مسح اللوائح المحمّلة من مسار (التلاميذ، الأقسام، الفئات والحركية) كليا أو جزئيا" ${hasMassar() ? '' : 'disabled'}>${ic('trash')} المسح الكلي</button>
        <button class="btn pri" id="puImp">${ic('up')} استيراد لوائح مسار</button></div>
      ${!SECL() && y.pupils.length && Y(sy).pupils.some(p => stageOf(p.lvl) === 'pre') ? stageBar(sy) : ''}
      <div class="mk-tabs"><div class="seg" id="puTabs">${T.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div id="puBody"></div>`;
    $$('#puTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; go('pupils'); });
    $$('#puStage button').forEach(b => b.onclick = () => { stage = b.dataset.s; go('pupils'); });
    $('#puImp').onclick = importMassar;
    $('#puWipe').onclick = () => wipeMassar(sy);
    $('#puExp').onclick = () => exportXlsx(sy);
    $('#puDocs').onclick = () => go('pupilDoc', { kind: 'stats', stage });
    if (!y.pupils.length && !['moves', 'dash'].includes(tab)) return emptyState($('#puBody'));
    ({ list: tabList, guard: tabGuard, stats: tabStats, moves: (bb, ss) => window.Pupils2.tabCats(bb, ss), dash: (bb, ss) => window.Pupils2.tabDash(bb, ss), classes: tabClasses })[tab]($('#puBody'), sy);
  };
  function splitText(sy, c) {
    const arr = current(sy), pre = SECL() ? 0 : arr.filter(p => stageOf(p.lvl) === 'pre').length;
    return pre ? `${arr.length - pre} تلميذ(ة) بالابتدائي و${pre} طفل(ة) بالتعليم الأولي، منهم ${c.f} إناث` : `${c.t} تلميذ(ة)، منهم ${c.f} إناث`;
  }
  function stageBar(sy) {
    const arr = current(sy), n = st => arr.filter(p => inStage(p, st)).length;
    return `<div class="mk-tabs" style="margin-bottom:8px"><div class="seg" id="puStage">${['', 'pre', 'pri'].map(k => `<button data-s="${k}" class="${stage === k ? 'on' : ''}">${k === '' ? 'الكل' : ST[k].t} <small>${n(k)}</small></button>`).join('')}</div>
      <span class="muted" style="font-size:12px">يفصل البرنامج بين أطفال التعليم الأولي (روض الأطفال، الأولى أولي، الثانية أولي) وتلاميذ التعليم الابتدائي</span></div>`;
  }
  // 1.9.4: gives the pupils (ids) to one of the units registered in the settings (or any known unit); the classes that move entirely follow
  function linkToUnit(sy, ids, after, title) {
    const y = Y(sy), set = new Set(ids), units = unitsOf(sy);
    if (!set.size) return toast('لا يوجد تلاميذ معروضون لربطهم', true);
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin-top:0;line-height:1.8">${title || `ربط <b>${set.size}</b> تلميذ(ة) بوحدة مدرسية`}. تنتقل معهم الأقسام التي يكتمل نقل جميع تلاميذها.</p>
      <div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="lkU">${units.map(u => `<option value="${esc(u)}">${esc(u)}${gresaOfUnit(u) ? ' — GRESA ' + esc(gresaOfUnit(u)) : ''}${regOf(u) ? '' : ' (غير مسجلة في الإعدادات)'}</option>`).join('')}</select></div>`;
    modal({ title: 'ربط التلاميذ بوحدة مدرسية', size: 'sm', body, actions: [{ label: 'ربط', cls: 'pri', onClick: m => {
      const u = $('#lkU', m).value; if (!u) return false;
      let n = 0;
      y.pupils.forEach(p => { if (set.has(p.id) && p.unit !== u) { p.unit = u; n++; } });
      y.lists.forEach(l => { const mine = y.pupils.filter(p => p.listId === l.id); if (mine.length && mine.every(p => K.U.same(p.unit, u))) l.unit = u; });
      if (!y.units.includes(u)) y.units.push(u);
      persist(); toast(`تم ربط ${n} تلميذ(ة) بالوحدة «${u}»`); if (after) after(u); else go('pupils');
    } }, { label: 'إلغاء' }] });
  }
  // the units registered in the settings, each with its GRESA code (shown when nothing is imported yet)
  function unitStrip(sy) {
    const L = REG(); if (!L.length) return '';
    const y = Y(sy);
    return `<div class="card" style="margin-top:12px"><div class="card-h"><h3>الوحدات المدرسية المسجلة في الإعدادات</h3></div><div class="card-b">
      ${L.map(u => `<div class="btn-row" style="margin-bottom:6px"><b>${esc(u.name)}</b>${u.gresa ? `<span class="k2-pill">GRESA ${esc(u.gresa)}</span>` : '<span class="muted" style="font-size:12px">بلا رمز GRESA</span>'}<span class="muted">${y.pupils.filter(p => K.U.same(p.unit, u.name)).length} تلميذ(ة)</span><span style="flex:1"></span><button class="btn sm" data-impu="${esc(u.name)}">${ic('up')} استيراد لوائح هذه الوحدة</button></div>`).join('')}
      <p class="muted" style="font-size:12px;margin:6px 0 0">تُسجَّل الوحدات ورموز GRESA في «الإعدادات ← الوحدات المدرسية». عند الاستيراد تُقترح الوحدة المناسبة لكل ملف حسب اسم المؤسسة.</p></div></div>`;
  }
  function bindStrip(b) { $$('[data-impu]', b).forEach(x => x.onclick = () => importMassar({ unit: x.dataset.impu })); }
  function emptyState(b) {
    const other = Object.keys(PD().years).filter(s => Y(s).pupils.length).sort().reverse();
    b.innerHTML = `<div class="card"><div class="empty-state" style="line-height:2">
      <div style="font-size:40px">🎒</div>
      <b>لا توجد لوائح تلاميذ لهذا الموسم بعد.</b><br>
      حمّل من منظومة مسار «لائحة التلاميذ» لكل قسم (${SEC() ? 'ملف Excel لكل قسم أو ملف واحد بورقة لكل قسم' : 'ملف Excel لكل وحدة مدرسية، ورقة لكل قسم'})، واللوائح الإحصائية (المنقطعون، غير الملتحقين، الوافدون، المغادرون...)،
      ثم اضغط «استيراد لوائح مسار» واختر كل الملفات دفعة واحدة (أكثر من 10 ملفات).
      ${other.length ? `<br><span class="muted">مواسم أخرى فيها لوائح: ${other.map(s => `<a class="lk-f" data-sy="${s}">${MK.syDash(s)}</a>`).join(' ، ')}</span>` : ''}
      <div style="margin-top:10px"><button class="btn pri" id="puImp2">${ic('up')} استيراد لوائح مسار</button></div></div></div>${SEC() ? '' : unitStrip(curSy())}`;
    $('#puImp2', b).onclick = importMassar;
    bindStrip(b);
    $$('[data-sy]', b).forEach(a => a.onclick = () => { MK.setSy(a.dataset.sy); go('pupils'); });
  }

  /* ---------- list ---------- */
  function tabList(b, sy) {
    const y = Y(sy), units = unitsOf(sy), cur = current(sy), lv = levelsOf(sy, cur).filter(l => !stage || stageOf(l) === stage);
    if (flt.lvl && stage && stageOf(flt.lvl) !== stage) flt.lvl = '';
    const gone = new Map(y.moves.filter(m => m.code).map(m => [m.code, m]));
    const classes = Array.from(new Set(cur.filter(p => !flt.unit || K.U.same(p.unit, flt.unit)).map(p => p.cls).filter(Boolean)));
    if (flt.unit && !units.includes(flt.unit)) flt.unit = '';
    if (flt.cls && !classes.includes(flt.cls)) flt.cls = '';
    const nEst = cur.filter(p => p.lsrc === 'age').length;
    const nOut = y.pupils.length - cur.length;
    const chips = SEC() || units.length < 2 ? '' : `<div class="u-chips">${[''].concat(units).map(u => { const n = u ? cur.filter(p => K.U.same(p.unit, u)).length : cur.length, g = u ? gresaOfUnit(u) : ''; return `<button type="button" class="u-chip ${flt.unit === u ? 'on' : ''}" data-u="${esc(u)}"><b>${u ? esc(u) : 'كل الوحدات'}</b><span>${n} تلميذ(ة)${g ? ' · GRESA ' + esc(g) : ''}</span></button>`; }).join('')}</div>`;
    b.innerHTML = chips + `<div class="card"><div class="toolbar">
        <div class="search">${ic('search')}<input class="inp" id="pq" placeholder="بحث بالاسم أو رمز مسار أو مكان الازدياد..." value="${esc(flt.q)}"></div>
        ${SEC() ? '' : `<select class="inp" id="pu" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${flt.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`}
        <select class="inp" id="pc" style="width:auto" dir="ltr"><option value="">كل الأقسام</option>${classes.map(u => `<option ${flt.cls === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
        <select class="inp" id="pl" style="width:auto"><option value="">كل المستويات</option>${lv.map(l => `<option value="${l}" ${flt.lvl === l ? 'selected' : ''}>${esc(LV.ar(l))}</option>`).join('')}</select>
        <select class="inp" id="pg" style="width:auto"><option value="">الجنس</option><option value="M" ${flt.g === 'M' ? 'selected' : ''}>ذكور</option><option value="F" ${flt.g === 'F' ? 'selected' : ''}>إناث</option></select>
        ${nEst ? `<label class="chk"><input type="checkbox" id="pe" ${flt.est ? 'checked' : ''}> المستويات المقدرة فقط (${nEst})</label>` : ''}
        <label class="chk" title="يعرض التلاميذ الذين يتقاسمون الاسم العائلي (إخوة) مجمعين ليسهل وضعهم في نفس التوقيت"><input type="checkbox" id="pf" ${flt.fam ? 'checked' : ''}> الأسماء العائلية المتشابهة فقط</label>
        <span style="flex:1"></span><span class="muted" id="pn"></span>
        <button class="btn sm" id="pPrn">${ic('print')} طباعة اللائحة</button>
        ${SEC() ? '' : `<button class="btn sm" id="pLink" title="ربط التلاميذ المعروضين (حسب التصفية الحالية) بوحدة مدرسية مسجلة في الإعدادات">${ic('edit')} ربط بوحدة</button>`}<button class="btn sm" id="pCards">${ic('print')} بطاقات التلاميذ</button><button class="btn sm danger" id="pDelAll" title="حذف التلاميذ المعروضين (حسب التصفية الحالية) نهائيا">${ic('trash')} حذف المعروضين</button>${flt.fam ? `<button class="btn sm" id="pFam">${ic('print')} طباعة لائحة الإخوة</button>` : ''}</div>
      <div class="k2-note" style="margin:10px 16px 0;font-size:12.5px;line-height:1.8">هذه اللائحة تخص <b>المتمدرسين حاليا</b> فقط. الوافدون والمغادرون والمنقطعون وغير الملتحقين والمهددون بالفصل وغيرهم معزولون كل فئة لوحدها في خانة <a class="lk-f" id="pToCats">«الفئات والحركية»</a>${nOut > 0 ? ` (${nOut} تلميذ(ة) مستثنى من هذه اللائحة لأنه مغادر أو منقطع أو غير ملتحق)` : ''}.</div>
      ${nEst ? `<div class="k2-warn" style="margin:10px 16px 0">${ic('alert')}<span>في الأقسام المشتركة قدّر البرنامج مستوى <b>${nEst}</b> تلميذ(ة) حسب سنة الازدياد (العلامة ≈). تحقق منه وصححه من الخانة «المستوى» عند الحاجة: يحفظ التصحيح ولا يتغير عند إعادة الاستيراد.</span></div>` : ''}
      <div id="pT" style="overflow:auto"></div></div>`;
    const famSet = flt.fam ? new Set(famGroups(sy, stage, flt.unit).flat().map(p => p.id)) : null;
    const list = () => {
      const q = nh(flt.q);
      const L0 = cur.filter(p => (!famSet || famSet.has(p.id)) && inStage(p, stage) && (!flt.unit || K.U.same(p.unit, flt.unit)) && (!flt.cls || p.cls === flt.cls) && (!flt.lvl || p.lvl === flt.lvl) && (!flt.g || p.g === flt.g) && (!flt.est || p.lsrc === 'age')
        && (!q || nh([fullN(p), p.code, p.place].join(' ')).includes(q)))
        ;
      return L0.sort(flt.fam ? ((a, c) => String(a.last).localeCompare(String(c.last), 'ar') || LV.idx(a.lvl) - LV.idx(c.lvl) || String(a.cls).localeCompare(String(c.cls)))
        : ((a, c) => units.indexOf(a.unit) - units.indexOf(c.unit) || String(a.cls).localeCompare(String(c.cls)) || LV.idx(a.lvl) - LV.idx(c.lvl) || fullN(a).localeCompare(fullN(c), 'ar')));
    };
    const draw = () => {
      const L = list();
      $('#pn').textContent = `${L.length} ${ST[stage].one} — ذكور ${L.filter(p => p.g !== 'F').length} / إناث ${L.filter(p => p.g === 'F').length}`;
      $('#pT').innerHTML = L.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>رمز مسار</th><th>الاسم والنسب</th><th>الجنس</th><th>تاريخ الازدياد</th><th>السن</th><th>مكان الازدياد</th>${SEC() ? '' : '<th>الوحدة</th>'}<th>القسم</th><th>المستوى</th><th>الوضعية</th><th></th></tr></thead><tbody>
        ${L.slice(0, 1500).map((p, i) => { const lvs = (y.lists.find(l => l.id === p.listId) || {}).levels || [p.lvl]; const m = gone.get(p.code); return `<tr data-id="${p.id}"><td class="muted num">${i + 1}</td><td class="num" dir="ltr" style="text-align:right">${esc(p.code)}</td>
          <td><b>${esc(fullN(p))}</b></td><td>${gAr(p.g)}</td><td class="num nw">${esc(fmtDate(p.birth))}</td><td class="num">${ageOf(p, sy) == null ? '' : ageOf(p, sy)}</td><td class="muted" style="font-size:12px">${esc(p.place || '')}</td>
          ${SEC() ? '' : `<td>${esc(p.unit)}</td>`}<td dir="ltr" style="text-align:right;font-size:12px">${esc(p.cls)}</td>
          <td>${lvs.length > 1 ? `<select class="k2-sel" data-lvl="${p.id}">${lvs.map(l => `<option value="${l}" ${l === p.lvl ? 'selected' : ''}>${esc(LV.sh(l))}${p.lsrc === 'age' && l === p.lvl ? ' ≈' : ''}</option>`).join('')}</select>` : esc(LV.sh(p.lvl))}${!SEC() && stageOf(p.lvl) === 'pre' ? ' <span class="k2-pill in">أولي</span>' : ''}</td>
          <td>${m ? `<span class="k2-pill ${OUT.includes(m.cat) ? 'out' : 'in'}">${esc(CAT[m.cat].sh)}</span>` : ''}</td>
          <td class="act"><button class="btn sm" data-a="mv" title="تسجيل حركة: منقطع، مغادر...">حركة</button> <button class="btn sm" data-a="card" title="بطاقة التلميذ">${ic('print')}</button> <button class="btn sm danger icon" data-a="del" title="حذف هذا التلميذ">${ic('trash')}</button></td></tr>`; }).join('')}
        </tbody></table>${L.length > 1500 ? '<div class="muted" style="padding:8px 16px">تعرض أول 1500 نتيجة: استعمل البحث أو التصفية.</div>' : ''}` : '<div class="empty-state">لا توجد نتائج مطابقة</div>';
      $$('#pT [data-lvl]').forEach(sel => sel.onchange = () => { const p = y.pupils.find(x => x.id === sel.dataset.lvl); p.lvl = sel.value; p.lsrc = 'man'; persist(); draw(); });
      $$('#pT tr[data-id]').forEach(tr => {
        const p = y.pupils.find(x => x.id === tr.dataset.id);
        $('[data-a=mv]', tr).onclick = () => moveForm(sy, null, p, draw);
        $('[data-a=card]', tr).onclick = () => go('pupilDoc', { kind: 'cards', ids: [p.id] });
        $('[data-a=del]', tr).onclick = async () => { if (await confirmBox(`حذف التلميذ(ة) <b>${esc(fullN(p))}</b> من لوائح هذا الموسم؟`, 'حذف')) { y.pupils = y.pupils.filter(x => x !== p); persist(); go('pupils'); } };
      });
    };
    $('#pq').oninput = e => { flt.q = e.target.value; draw(); };
    if ($('#pu')) $('#pu').onchange = e => { flt.unit = e.target.value; flt.cls = ''; go('pupils'); };
    $('#pc').onchange = e => { flt.cls = e.target.value; draw(); };
    $('#pl').onchange = e => { flt.lvl = e.target.value; draw(); };
    $('#pg').onchange = e => { flt.g = e.target.value; draw(); };
    if ($('#pe')) $('#pe').onchange = e => { flt.est = e.target.checked; draw(); };
    $('#pf').onchange = e => { flt.fam = e.target.checked; go('pupils'); };
    $('#pToCats').onclick = () => go('pupils', { tab: 'moves' });
    $('#pDelAll').onclick = async () => {
      const L = list(); if (!L.length) return toast('لا يوجد تلاميذ معروضون');
      const all = !flt.q && !flt.unit && !flt.cls && !flt.lvl && !flt.g && !flt.est && !flt.fam && !stage;
      if (!await confirmBox(`حذف نهائي لـ <b>${L.length}</b> تلميذ(ة) ${all ? '(كل تلاميذ هذا الموسم)' : 'المعروضين حسب التصفية الحالية'}؟<br><span class="muted">يمكنك إعادة استيراد لوائح مسار في أي وقت.</span>`, 'حذف الكل')) return;
      const ids = new Set(L.map(p => p.id)); y.pupils = y.pupils.filter(p => !ids.has(p.id));
      y.lists = y.lists.filter(l => y.pupils.some(p => p.listId === l.id)); persist(); toast(`تم حذف ${L.length} تلميذ(ة)`); go('pupils');
    };
    $('#pPrn').onclick = () => go('pupilDoc', { kind: 'list', unit: flt.unit, cls: flt.cls, lvl: flt.lvl, stage });
    $('#pCards').onclick = () => go('pupilDoc', { kind: 'cards', ids: list().map(p => p.id) });
    if ($('#pLink')) $('#pLink').onclick = () => linkToUnit(sy, list().map(p => p.id));
    $$('.u-chip', b).forEach(x => x.onclick = () => { flt.unit = x.dataset.u; flt.cls = ''; go('pupils'); });
    if ($('#pFam')) $('#pFam').onclick = () => go('pupilDoc', { kind: 'fam', unit: flt.unit, stage });
    draw();
  }

  /* ---------- statistics ---------- */
  // pre-school children and primary pupils side by side (by unit)
  function cycleCard(sy, units) {
    const arr = current(sy), g3 = c => `<td class="num">${c.m}</td><td class="num">${c.f}</td><td class="num"><b>${c.t}</b></td>`;
    const row = (label, f) => `<tr><td><b>${esc(label)}</b></td>${['pre', 'pri'].map(k => g3(cnt(arr, p => stageOf(p.lvl) === k && f(p)))).join('')}${g3(cnt(arr, f))}</tr>`;
    return `<div class="card" style="margin-top:14px"><div class="card-h"><h3>التوزيع حسب السلك: التعليم الأولي والتعليم الابتدائي</h3></div><div style="overflow:auto"><table class="tbl compact att-mx"><thead><tr><th rowspan="2">الوحدة المدرسية</th><th colspan="3">أطفال التعليم الأولي</th><th colspan="3">تلاميذ التعليم الابتدائي</th><th colspan="3">المجموع</th></tr><tr>${'<th>ذ</th><th>إ</th><th>م</th>'.repeat(3)}</tr></thead><tbody>
      ${units.map(u => row(u, p => K.U.same(p.unit, u))).join('')}<tr class="att-tot"><td>المجموع</td>${['pre', 'pri'].map(k => g3(cnt(arr, p => stageOf(p.lvl) === k))).join('')}${g3(cnt(arr))}</tr></tbody></table></div></div>`;
  }
  // the classes of a list of pupils, in the order of their levels
  const clsList = arr => Array.from(new Set(arr.map(p => p.cls).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
  function tabStats(b, sy) {
    const arr = curS(sy), units = unitsOf(sy).filter(u => arr.some(p => K.U.same(p.unit, u))), lv = levelsOf(sy, arr), W = ST[stage].n;
    const all = cnt(arr);
    const ages = arr.map(p => ageOf(p, sy)).filter(a => a != null);
    const avg = ages.length ? (ages.reduce((a, c) => a + c, 0) / ages.length).toFixed(1) : '-';
    const over = arr.filter(p => { const a = ageOf(p, sy), o = (LV.byK(p.lvl) || {}).off; return a != null && o != null && a > o + 1; }).length;
    const kpi = (n, t, cls) => `<div class="k2-kpi ${cls || ''}"><div class="n">${n}</div><div class="t">${t}</div></div>`;
    const g3 = c => `<td class="num">${c.m}</td><td class="num">${c.f}</td><td class="num"><b>${c.t}</b></td>`;
    const ageMin = ages.length ? Math.min(...ages) : 0, ageMax = ages.length ? Math.max(...ages) : 0;
    const ageList = []; for (let a = ageMin; a <= ageMax; a++) ageList.push(a);
    b.innerHTML = `<div class="card"><div class="k2-kpis">
        ${kpi(all.t, 'عدد ' + W, 'green')}${kpi(all.m, 'الذكور', 'blue')}${kpi(all.f, 'الإناث', 'pink')}${kpi(K.pct(all.f, all.t, 1), 'نسبة الإناث')}
        ${SEC() ? '' : kpi(units.length, 'الوحدات المدرسية')}${kpi(Y(sy).lists.filter(l => (l.levels || []).some(k => !stage || stageOf(k) === stage)).length, 'الأقسام')}${kpi(avg, 'متوسط السن')}${kpi(`${over} (${K.pct(over, all.t, 1)})`, 'متأخرون بسنتين فأكثر', over ? 'red' : '')}
      </div></div>
      ${!SECL() && !stage && Y(sy).pupils.some(p => stageOf(p.lvl) === 'pre') ? cycleCard(sy, units) : ''}
      <div class="k2-two" style="margin-top:14px">
        <div class="card"><div class="card-h"><h3>${W} حسب المستوى والجنس</h3></div><div class="card-b">${K.bars(lv.map(LV.sh), [{ name: 'ذكور', color: COL.m, vals: lv.map(l => cnt(arr, p => p.lvl === l).m) }, { name: 'إناث', color: COL.f, vals: lv.map(l => cnt(arr, p => p.lvl === l).f) }], { h: 240 })}</div></div>
        ${SEC() ? (cl => `<div class="card"><div class="card-h"><h3>${W} حسب القسم والجنس</h3></div><div class="card-b">${K.bars(cl, [{ name: 'ذكور', color: COL.m, vals: cl.map(c => cnt(arr, p => p.cls === c).m) }, { name: 'إناث', color: COL.f, vals: cl.map(c => cnt(arr, p => p.cls === c).f) }], { h: 240, fs: cl.length > 12 ? 7 : cl.length > 7 ? 8.5 : 10 })}</div></div>`)(clsList(arr))
        : `<div class="card"><div class="card-h"><h3>${W} حسب الوحدة المدرسية والجنس</h3></div><div class="card-b">${K.bars(units, [{ name: 'ذكور', color: COL.m, vals: units.map(u => cnt(arr, p => K.U.same(p.unit, u)).m) }, { name: 'إناث', color: COL.f, vals: units.map(u => cnt(arr, p => K.U.same(p.unit, u)).f) }], { h: 240, fs: units.length > 5 ? 8.5 : 10 })}</div></div>`}
        <div class="card"><div class="card-h"><h3>التوزيع حسب السن (في 31 دجنبر ${MK.syStart(sy)})</h3></div><div class="card-b">${K.bars(ageList.map(a => a + ' س'), [{ name: 'ذكور', color: COL.m, vals: ageList.map(a => cnt(arr, p => ageOf(p, sy) === a).m) }, { name: 'إناث', color: COL.f, vals: ageList.map(a => cnt(arr, p => ageOf(p, sy) === a).f) }], { h: 240 })}</div></div>
        <div class="card"><div class="card-h"><h3>نسبة الإناث حسب المستوى %</h3></div><div class="card-b">${K.bars(lv.map(LV.sh), [{ name: 'نسبة الإناث %', color: COL.g, vals: lv.map(l => { const c = cnt(arr, p => p.lvl === l); return c.t ? +(c.f / c.t * 100).toFixed(1) : 0; }) }], { h: 240, fmt: v => v.toFixed(1) })}</div></div>
      </div>
      ${SEC() ? `<div class="card" style="margin-top:14px"><div class="card-h"><h3>${W} حسب المستوى والقسم والجنس</h3></div><div style="overflow:auto">
        <table class="tbl compact att-mx"><thead><tr><th>المستوى</th><th>القسم</th><th>ذ</th><th>إ</th><th>م</th></tr></thead><tbody>
          ${lv.map(l => { const cl = clsList(arr.filter(p => p.lvl === l)); return cl.map((c, i) => `<tr><td>${i ? '' : `<b>${esc(LV.sh(l))}</b>`}</td><td dir="ltr" style="text-align:right">${esc(c)}</td>${g3(cnt(arr, p => p.lvl === l && p.cls === c))}</tr>`).join('') + `<tr class="att-tot"><td colspan="2">مجموع ${esc(LV.sh(l))}</td>${g3(cnt(arr, p => p.lvl === l))}</tr>`; }).join('')}
          <tr class="att-tot"><td colspan="2">المجموع العام</td>${g3(all)}</tr></tbody></table></div></div>` : `
      <div class="card" style="margin-top:14px"><div class="card-h"><h3>${W} حسب الوحدة المدرسية والمستوى والجنس</h3></div><div style="overflow:auto">
        <table class="tbl compact att-mx"><thead><tr><th rowspan="2">المستوى</th>${units.map(u => `<th colspan="3">${esc(u)}</th>`).join('')}<th colspan="3">المجموع</th></tr>
          <tr>${units.concat(['']).map(() => '<th>ذ</th><th>إ</th><th>م</th>').join('')}</tr></thead><tbody>
          ${lv.map(l => `<tr><td><b>${esc(LV.sh(l))}</b></td>${units.map(u => g3(cnt(arr, p => K.U.same(p.unit, u) && p.lvl === l))).join('')}${g3(cnt(arr, p => p.lvl === l))}</tr>`).join('')}
          <tr class="att-tot"><td>المجموع</td>${units.map(u => g3(cnt(arr, p => K.U.same(p.unit, u)))).join('')}${g3(all)}</tr></tbody></table></div></div>`}
      <div class="card" style="margin-top:14px"><div class="card-h"><h3>${W} حسب السن والمستوى</h3></div><div style="overflow:auto">
        <table class="tbl compact att-mx"><thead><tr><th>المستوى \\ السن</th>${ageList.map(a => `<th>${a}</th>`).join('')}<th>المجموع</th><th>متوسط السن</th></tr></thead><tbody>
          ${lv.map(l => { const L = arr.filter(p => p.lvl === l); const ag = L.map(p => ageOf(p, sy)).filter(a => a != null); return `<tr><td><b>${esc(LV.sh(l))}</b></td>${ageList.map(a => { const n = L.filter(p => ageOf(p, sy) === a).length; const o = (LV.byK(l) || {}).off; return `<td class="num ${n && o != null && a > o + 1 ? 'att-hot' : ''}">${n || ''}</td>`; }).join('')}<td class="num"><b>${L.length}</b></td><td class="num">${ag.length ? (ag.reduce((x, c) => x + c, 0) / ag.length).toFixed(1) : '-'}</td></tr>`; }).join('')}
          <tr class="att-tot"><td>المجموع</td>${ageList.map(a => `<td class="num">${arr.filter(p => ageOf(p, sy) === a).length || ''}</td>`).join('')}<td class="num">${arr.length}</td><td class="num">${avg}</td></tr></tbody></table>
        <p class="muted" style="font-size:12px;padding:0 16px 10px;margin:6px 0 0">السن محسوب في 31 دجنبر من السنة الأولى للموسم الدراسي. الخانات بالأحمر: تلاميذ يفوق سنهم السن العادي للمستوى بسنتين فأكثر. التلاميذ المسجلون كمنقطعين أو مغادرين أو غير ملتحقين لا يحتسبون في هذه الإحصائيات.</p></div></div>
      <div class="btn-row" style="margin-top:14px">
        <button class="btn" data-doc="stats">${ic('print')} إحصاء التلاميذ حسب الجنس</button><button class="btn" data-doc="age">${ic('print')} التوزيع حسب السن</button>
        <button class="btn" data-doc="girls">${ic('print')} نسبة تمدرس الفتاة</button><button class="btn" data-doc="new1">${ic('print')} المسجلون الجدد بالسنة الأولى</button></div>`;
    $$('[data-doc]', b).forEach(x => x.onclick = () => go('pupilDoc', { kind: x.dataset.doc, stage }));
  }

  /* ---------- movements ---------- */
  function tabMoves(b, sy) {
    const y = Y(sy), units = unitsOf(sy);
    const by = c => movesS(sy, c.k).length;
    b.innerHTML = `<div class="card"><div class="k2-kpis">${CATS.map(c => `<div class="k2-kpi ${OUT.includes(c.k) && by(c) ? 'red' : ''}"><div class="n">${by(c)}</div><div class="t">${c.l}</div></div>`).join('')}</div>
      <div class="toolbar"><select class="inp" id="mc" style="width:auto"><option value="">كل الفئات</option>${CATS.map(c => `<option value="${c.k}" ${flt.mcat === c.k ? 'selected' : ''}>${c.l}</option>`).join('')}</select>
        ${SEC() ? '' : `<select class="inp" id="mu" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${flt.munit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`}
        <span style="flex:1"></span>
        <button class="btn sm" id="mPrn">${ic('print')} جدول التتبع الدوري للحركية</button><button class="btn sm" id="mList">${ic('print')} طباعة اللائحة</button>
        <button class="btn sm" id="mImp">${ic('up')} استيراد اللوائح الإحصائية</button><button class="btn sm pri" id="mAdd">${ic('plus')} إضافة حالة</button></div>
      <div id="mT"></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.8">اللوائح الإحصائية لمسار (لائحة التلاميذ المنقطعين، الغير الملتحقين، الناجحين، المفصولين...) تستورد من «استيراد لوائح مسار» مع لوائح الأقسام. يمكن أيضا إضافة حالة يدويا أو من زر «حركة» في لائحة التلاميذ. التلاميذ المنقطعون والمغادرون وغير الملتحقين والمفصولون لا يحتسبون في «الوضعية الحالية».</p>
      ${!flt.mcat || flt.mcat === 'notjoined' || flt.mcat === 'drop' || flt.mcat === 'threat' ? `<div class="roz-steps" style="margin-top:10px">${ic('list')} <b>لائحة غير الملتحقين (والمنقطعين والمهددين بالانقطاع) من مسار:</b> <span class="st">الحياة المدرسية</span> ← <span class="st">الهدر المدرسي</span> ← <span class="st">آلية اليقظة</span> ← اختر المستوى (أو جميع المستويات) ← <span class="st">بحث</span> ← <span class="st">تصدير</span>، ثم «استيراد اللوائح الإحصائية».</div>` : ''}`;
    const draw = () => {
      const L = y.moves.filter(m => inStage(m, stage) && (!flt.mcat || m.cat === flt.mcat) && (!flt.munit || K.U.same(m.unit, flt.munit))).sort((a, c) => CATS.findIndex(x => x.k === a.cat) - CATS.findIndex(x => x.k === c.cat) || units.indexOf(a.unit) - units.indexOf(c.unit) || LV.idx(a.lvl) - LV.idx(c.lvl));
      $('#mT').innerHTML = L.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>الفئة</th><th>رمز مسار</th><th>الاسم والنسب</th><th>الجنس</th><th>تاريخ الازدياد</th>${SEC() ? '' : '<th>الوحدة</th>'}<th>المستوى</th><th>التاريخ</th><th>ملاحظة</th><th></th></tr></thead><tbody>
        ${L.map((m, i) => `<tr data-id="${m.id}"><td class="muted num">${i + 1}</td><td><span class="k2-pill ${OUT.includes(m.cat) ? 'out' : 'in'}">${esc(CAT[m.cat].sh)}</span></td><td class="num" dir="ltr" style="text-align:right">${esc(m.code || '')}</td>
          <td><b>${esc(fullN(m))}</b></td><td>${gAr(m.g)}</td><td class="num">${esc(fmtDate(m.birth))}</td>${SEC() ? '' : `<td>${esc(m.unit || '')}</td>`}<td>${esc(LV.sh(m.lvl))}</td><td class="num">${esc(fmtDate(m.date))}</td><td class="muted">${esc(m.note || (m.src === 'file' ? 'من مسار' : ''))}</td>
          <td class="act"><button class="btn sm" data-a="e">${ic('edit')}</button> <button class="btn sm danger icon" data-a="d">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>`
        : '<div class="empty-state">لا توجد حالات مسجلة</div>';
      $$('#mT tr[data-id]').forEach(tr => {
        const m = y.moves.find(x => x.id === tr.dataset.id);
        $('[data-a=e]', tr).onclick = () => moveForm(sy, m, null, () => go('pupils'));
        $('[data-a=d]', tr).onclick = async () => { if (await confirmBox(`حذف حالة <b>${esc(fullN(m))}</b> (${esc(CAT[m.cat].sh)})؟`, 'حذف')) { y.moves = y.moves.filter(x => x !== m); persist(); go('pupils'); } };
      });
    };
    $('#mc').onchange = e => { flt.mcat = e.target.value; draw(); };
    if ($('#mu')) $('#mu').onchange = e => { flt.munit = e.target.value; draw(); };
    $('#mAdd').onclick = () => moveForm(sy, null, null, () => go('pupils'));
    $('#mImp').onclick = importMassar;
    $('#mPrn').onclick = () => go('pupilDoc', { kind: 'moves' });
    $('#mList').onclick = () => go('pupilDoc', { kind: 'movelist', cat: flt.mcat || '' });
    draw();
  }
  function moveForm(sy, m, p, after, preset) {
    const y = Y(sy, true);
    const d = m ? Object.assign({}, m) : p ? { cat: 'drop', code: p.code, last: p.last, first: p.first, g: p.g, birth: p.birth, place: p.place, unit: p.unit, lvl: p.lvl, cls: p.cls, date: MK.syRef(sy), note: '' }
      : { cat: 'joined', g: 'M', unit: SEC() ? secUnit() : (unitsOf(sy)[0] || ''), lvl: levelsOf(sy)[0] || firstLv(), date: MK.syRef(sy) };
    if (preset) Object.assign(d, preset);
    const body = document.createElement('div');
    const pickLink = { src: 'pupil', keys: { code: 'code' }, post: (f, r) => { const x = r.rec; f.last = x.last; f.first = x.first; if (x.g) f.g = x.g; if (x.birth) f.birth = x.birth; if (x.place) f.place = x.place; if (x.unit) f.unit = x.unit; if (x.lvl) f.lvl = x.lvl; if (x.cls) f.cls = x.cls; } };
    K.form(body, [
      { k: 'cat', l: 'الفئة', t: 'select', opts: CATS.map(c => [c.k, c.l]) },
      ...(m ? [] : [{ k: 'pick', l: 'اختيار التلميذ(ة) من بطاقة التلاميذ (اكتب الاسم أو رقم مسار فتُملأ باقي المعطيات تلقائيا)', list: 'k2Pupils', link: pickLink, ph: 'ابحث بالاسم أو برمز مسار...' }]),
      { k: 'date', l: 'التاريخ', t: 'date', half: 1 }, { k: 'code', l: 'رمز مسار', half: 1, dir: 'ltr', list: 'k2Codes', link: pickLink },
      { k: 'last', l: 'النسب', half: 1 }, { k: 'first', l: 'الاسم', half: 1 },
      { k: 'g', l: 'الجنس', t: 'select', opts: [['M', 'ذكر'], ['F', 'أنثى']], half: 1 }, { k: 'birth', l: 'تاريخ الازدياد', t: 'date', half: 1 },
      ...(SEC() ? [] : [{ k: 'unit', l: 'الوحدة المدرسية', list: 'k2Units', half: 1 }]), { k: 'lvl', l: 'المستوى', t: 'select', opts: LV.ALL.filter(l => !SEC() || Cyc.has(l.k)).map(l => [l.k, l.ar]), half: SEC() ? 0 : 1 },
      { k: 'ttype', l: 'نوع التحويل (وافد / مغادر)', half: 1 }, { k: 'dis', l: 'نوع الإعاقة (وضعية إعاقة)', half: 1 },
      { k: 'orig', l: 'المؤسسة الأصلية', half: 1 }, { k: 'recv', l: 'مؤسسة الاستقبال', half: 1 },
      { k: 'note', l: 'ملاحظة (السبب...)' }], d);
    modal({ title: m ? 'تعديل حالة' : 'تسجيل حالة (حركية التلاميذ)', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (!String(d.last || d.first || d.code || '').trim()) { toast('المرجو كتابة اسم التلميذ(ة) أو رمز مسار', true); return false; }
      d.code = String(d.code || '').trim().toUpperCase(); delete d.pick;
      if (SEC()) d.unit = secUnit();
      if (m) Object.assign(m, d); else y.moves.push(Object.assign({ id: uid('pm'), src: 'man' }, d));
      persist(); after && after(); toast('تم الحفظ');
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- imported lists & units ---------- */
  function tabClasses(b, sy) {
    const y = Y(sy), units = unitsOf(sy);
    const regOn = !SEC() && REG().length > 0;
    b.innerHTML = `${units.map(u => { const L = y.lists.filter(l => K.U.same(l.unit, u)); const c = cnt(y.pupils.filter(p => K.U.same(p.unit, u))); const gr = SEC() ? '' : gresaOfUnit(u); return `<div class="card" style="margin-bottom:12px"><div class="toolbar">${SEC() ? '<b style="font-size:15px">الأقسام</b>' : `<b style="font-size:15px">${esc(u)}</b>${gr ? `<span class="k2-pill">GRESA ${esc(gr)}</span>` : ''}${regOn && !regOf(u) ? '<span class="k2-pill out" title="هذا الاسم غير مسجل في الإعدادات: اربطه بوحدة مسجلة">غير مسجلة في الإعدادات</span>' : ''}`}
        <span class="muted">${L.length} قسم — ${c.t} تلميذ(ة) (ذ ${c.m} / إ ${c.f})${SECL() ? '' : (np => np ? ` — منهم ${np} طفل(ة) بالتعليم الأولي` : '')(y.pupils.filter(p => K.U.same(p.unit, u) && stageOf(p.lvl) === 'pre').length)}</span><span style="flex:1"></span>
        ${SEC() ? '' : `${regOn && !regOf(u) ? `<button class="btn sm pri" data-lkunit="${esc(u)}">${ic('edit')} ربط بوحدة مسجلة</button>` : ''}<button class="btn sm" data-impu="${esc(u)}">${ic('up')} استيراد لوائح</button><button class="btn sm" data-ren="${esc(u)}">${ic('edit')} تغيير الاسم</button>${units.indexOf(u) ? `<button class="btn sm icon" data-upu="${esc(u)}" title="أعلى">▲</button>` : ''}`}</div>
      <table class="tbl compact"><thead><tr><th>القسم</th><th>المستويات</th><th>الذكور</th><th>الإناث</th><th>المجموع</th><th>الملف المستورد</th><th></th></tr></thead><tbody>
        ${L.length || SEC() ? '' : `<tr><td colspan="7" class="muted" style="text-align:center;padding:10px">لا توجد أقسام لهذه الوحدة بعد — استورد لوائحها من مسار أو انقل إليها أقساما من وحدات أخرى.</td></tr>`}
        ${L.map(l => { const cc = cnt(y.pupils.filter(p => p.listId === l.id)); return `<tr data-l="${l.id}"><td dir="ltr" style="text-align:right"><b>${esc(l.cls)}</b></td><td>${esc((l.levels || []).map(LV.sh).join(' + '))}${SEC() || units.length < 2 ? '' : `<br><select class="inp" data-mvu style="width:auto;font-size:12px;padding:2px 6px" title="نقل هذا القسم وتلاميذه إلى وحدة أخرى">${units.map(x => `<option value="${esc(x)}" ${x === l.unit ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>`}</td><td class="num">${cc.m}</td><td class="num">${cc.f}</td><td class="num"><b>${cc.t}</b></td>
          <td class="muted" style="font-size:12px">${esc(l.file || '')} — ${esc(l.sheet || '')}</td><td class="act"><button class="btn sm" data-a="p">${ic('print')} اللائحة</button> <button class="btn sm danger icon" data-a="d">${ic('trash')}</button></td></tr>`; }).join('')}
      </tbody></table></div>`; }).join('')}
      <div class="card"><div class="card-b btn-row"><button class="btn" id="reEst">إعادة تقدير المستويات حسب السن (عدا ما صُحح يدويا)</button>
        <button class="btn" id="toCerts">${ic('cap')} تحيين سجل «الشواهد المدرسية» بتلاميذ هذا الموسم</button>
        <span style="flex:1"></span><button class="btn danger" id="clrY">${ic('trash')} مسح لوائح هذا الموسم</button></div></div>`;
    $$('[data-ren]', b).forEach(x => x.onclick = () => {
      const old = x.dataset.ren;
      const body = `<div class="fld"><label>الاسم الجديد للوحدة المدرسية</label><input class="inp" id="nn" value="${esc(old)}"></div>`;
      modal({ title: 'تغيير اسم الوحدة', size: 'sm', body, actions: [{ label: 'حفظ', cls: 'pri', onClick: m => {
        const n = $('#nn', m).value.trim(); if (!n || n === old) return;
        renameUnit(old, n); const rg = regOf(old); if (rg) rg.name = n;
        persist(); go('pupils');
      } }, { label: 'إلغاء' }] });
    });
    bindStrip(b);
    $$('[data-lkunit]', b).forEach(x => x.onclick = () => { const u = x.dataset.lkunit; linkToUnit(sy, y.pupils.filter(p => p.unit === u).map(p => p.id), u2 => { if (u2 !== u) { y.moves.forEach(m => { if (m.unit === u) m.unit = u2; }); y.lists.forEach(l => { if (l.unit === u) l.unit = u2; }); y.units = y.units.filter(x => x !== u); } persist(); go('pupils'); }, `ربط جميع تلاميذ «${esc(u)}» (<b>${y.pupils.filter(p => p.unit === u).length}</b>)`); });
    $$('tr[data-l] [data-mvu]', b).forEach(sel => sel.onchange = () => {
      const l = y.lists.find(x => x.id === sel.closest('tr').dataset.l), u = sel.value; if (!l || !u) return;
      y.pupils.forEach(p => { if (p.listId === l.id) p.unit = u; }); l.unit = u; if (!y.units.includes(u)) y.units.push(u);
      persist(); toast(`تم نقل القسم ${l.cls} إلى الوحدة «${u}»`); go('pupils');
    });
    $$('[data-upu]', b).forEach(x => x.onclick = () => { const u = x.dataset.upu, a = unitsOf(sy), i = a.indexOf(u); a.splice(i, 1); a.splice(i - 1, 0, u); y.units = a; persist(); go('pupils'); });
    $$('tr[data-l]', b).forEach(tr => {
      const l = y.lists.find(x => x.id === tr.dataset.l);
      $('[data-a=p]', tr).onclick = () => go('pupilDoc', { kind: 'list', unit: l.unit, cls: l.cls });
      $('[data-a=d]', tr).onclick = async () => { if (await confirmBox(`حذف القسم <b dir="ltr">${esc(l.cls)}</b> ${SEC() ? '' : `(${esc(l.unit)}) `}وتلاميذه من لوائح هذا الموسم؟`, 'حذف')) { y.lists = y.lists.filter(x => x !== l); y.pupils = y.pupils.filter(p => p.listId !== l.id); persist(); go('pupils'); } };
    });
    $('#reEst').onclick = () => { let n = 0; y.pupils.forEach(p => { if (p.lsrc === 'man') return; const l = y.lists.find(x => x.id === p.listId); if (!l) return; const v = LV.guess(l.levels || [], p.birth, sy); if (v !== p.lvl) { p.lvl = v; n++; } }); persist(); go('pupils'); toast(`تمت إعادة التقدير (${n} تغيير)`); };
    $('#toCerts').onclick = () => toCerts(sy);
    $('#clrY').onclick = () => wipeMassar(sy, 'yr');
  }
  /* ---------- «المسح الكلي»: wipe what was loaded from Massar (the pupils' lists, the categories / movements, the whole season, all seasons) ---------- */
  const seasonsWithData = () => Object.keys((PD() || {}).years || {}).filter(k => { const z = PD().years[k] || {}; return (z.pupils || []).length || (z.moves || []).length || (z.lists || []).length || (z.board && z.board.rows && z.board.rows.length); }).sort();
  const hasMassar = () => seasonsWithData().length > 0;
  function wipeMassar(sy, pre) {
    const P = PD(), y = Y(sy), seasons = seasonsWithData();
    const n = y.pupils.length, m = y.moves.length, nl = y.lists.length, hasBd = !!(y.board && y.board.rows && y.board.rows.length);
    const nAll = seasons.reduce((a, k) => a + ((P.years[k] || {}).pupils || []).length, 0), mAll = seasons.reduce((a, k) => a + ((P.years[k] || {}).moves || []).length, 0);
    const syT = MK.syDash(sy);
    const OPT = [
      ['pup', 'تلاميذ لوائح الأقسام (المتمدرسون)', `موسم ${syT}: ${n} تلميذ(ة) في ${nl} قسم. تبقى الفئات والحركية.`, n + nl],
      ['mov', 'الفئات والحركية (الوافدون، المغادرون، المنقطعون، غير الملتحقين...)', `موسم ${syT}: ${m} حالة. يبقى المتمدرسون.`, m],
      ['yr', 'كل معطيات مسار لهذا الموسم', `موسم ${syT}: التلاميذ والأقسام والفئات والحركية${hasBd ? ' ولوحة مسار المستوردة' : ''}.`, n + nl + m + (hasBd ? 1 : 0)],
      ['all', 'كل معطيات مسار في جميع المواسم', seasons.length ? `${seasons.length} موسم: ${nAll} تلميذ(ة) و${mAll} حالة.` : 'لا توجد معطيات.', seasons.length]
    ];
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin:0 0 10px;line-height:1.9">اختر ما تريد مسحه من اللوائح المحمّلة من منظومة مسار. المسح <b>نهائي</b>، ويمكنك بعده إعادة استيراد لوائح مسار في أي وقت.</p>
      ${OPT.map(([k, t, d, c]) => `<label class="pw-opt" style="display:flex;gap:10px;align-items:flex-start;border:1px solid var(--line,#d8dfd9);border-radius:10px;padding:9px 12px;margin:0 0 8px;${c ? 'cursor:pointer' : 'opacity:.55'}">
        <input type="radio" name="pwk" value="${k}" ${c ? '' : 'disabled'} ${pre === k && c ? 'checked' : ''} style="margin-top:5px"><span><b>${t}</b><br><span class="muted" style="font-size:12.5px">${d}</span></span></label>`).join('')}
      <p class="muted" style="font-size:12.5px;line-height:1.8;margin:6px 0 0">لا يُمسح أي شيء آخر: الموظفون، الوثائق، الشواهد المدرسية (ملفات الأرشيف)، مواظبة التلاميذ، والاشتراكات (أداءاتها مرتبطة برمز مسار فتعود مع إعادة الاستيراد).</p>`;
    modal({ title: 'المسح الكلي للوائح التلاميذ المحمّلة من مسار', body, actions: [{ label: ic('trash') + ' متابعة', cls: 'danger', onClick: async () => {
      const r = $('input[name=pwk]:checked', body); if (!r) { toast('اختر ما تريد مسحه', true); return false; }
      const k = r.value, o = OPT.find(x => x[0] === k);
      if (!await confirmBox(`تأكيد أخير: مسح «<b>${o[1]}</b>»؟<br><span class="muted">${o[2]}</span><br><br><b>لا يمكن التراجع عن هذا المسح.</b>`, 'نعم، امسح')) return false;
      if (k === 'pup') { y.pupils = []; y.lists = []; if (!y.moves.length) y.units = []; }
      else if (k === 'mov') { y.moves = []; if (!y.pupils.length) y.units = []; }
      else if (k === 'yr') delete P.years[sy];
      else { P.years = {}; P.alias = {}; }
      persist(); toast('تم المسح: ' + o[1]); go('pupils');
    } }, { label: 'إلغاء' }] });
  }
  // the certificates' register gets the pupils of the year (current pupils, updated by code Massar)
  function toCerts(sy, silent) {
    if (!DB.certs) return;
    const L = current(sy); let a = 0, u = 0;
    const skip = new Set((DB.certs.skip || []).map(c => String(c).toUpperCase()));
    L.forEach(p => {
      if (silent && skip.has(p.code)) return;
      let x = DB.certs.students.find(s => s.code && String(s.code).toUpperCase() === p.code);
      const o = { name: fullN(p), gender: gAr(p.g), birth: p.birth, birthPlace: p.place, level: LV.name(p.lvl), branch: LV.branchOfClass(p.cls), schoolYear: sy, unit: p.unit, code: p.code, status: 'current' };
      if (x) { Object.keys(o).forEach(k => { if (o[k]) x[k] = o[k]; }); u++; } else { DB.certs.students.push(Object.assign({ id: uid('st') }, o)); a++; }
    });
    if (!silent) DB.certs.skip = (DB.certs.skip || []).filter(c => !L.some(p => p.code === String(c).toUpperCase()));
    if (a || u) persist();
    if (!silent) toast(`سجل الشواهد المدرسية: أضيف ${a} تلميذ(ة) وحُيّن ${u}`);
    return { added: a, updated: u };
  }
  async function exportXlsx(sy) {
    const y = Y(sy), units = unitsOf(sy);
    const head = ['ر.ت', 'رمز مسار', 'النسب', 'الاسم', 'النوع', 'تاريخ الازدياد', 'مكان الازدياد', 'السن', 'القسم', 'المستوى'].concat(SEC() ? [] : ['الوحدة المدرسية']).concat(SECL() ? [] : ['السلك']);
    const sheets = (SEC() ? [secUnit()] : units).map(u => ({ name: SEC() ? 'التلاميذ' : u, widths: [6, 14, 18, 18, 8, 14, 22, 6, 16, 16, 20, 16], rows: [head].concat(y.pupils.filter(p => SEC() || K.U.same(p.unit, u)).sort((a, b) => String(a.cls).localeCompare(String(b.cls)) || LV.idx(a.lvl) - LV.idx(b.lvl) || fullN(a).localeCompare(fullN(b), 'ar'))
      .map((p, i) => [String(i + 1), p.code, p.last, p.first, gAr(p.g), fmtDate(p.birth), p.place || '', ageOf(p, sy) == null ? '' : ageOf(p, sy), p.cls, LV.ar(p.lvl)].concat(SEC() ? [] : [p.unit]).concat(SECL() ? [] : [ST[stageOf(p.lvl)].t]))) }));
    const r = await window.api.saveXlsxBook(sheets, `بطاقة_التلاميذ_${MK.syDash(sy)}.xlsx`);
    if (r && r.ok) toast(SEC() ? 'تم التصدير إلى Excel' : 'تم التصدير إلى Excel (ورقة لكل وحدة مدرسية)');
  }

  /* ================================================================= */
  /* documents (board style) */
  const g3c = c => `<td>${c.m}</td><td>${c.f}</td><td class="s">${c.t}</td>`;
  // إحصاء التلاميذ حسب الجنس (levels x units)
  function docGender(s, sy, o) {
    o = o || {};
    const st = SECL() ? '' : (o.stage || ''), arr = curS(sy, st), units = SEC() ? [] : unitsOf(sy).filter(u => arr.some(p => K.U.same(p.unit, u))), lv = levelsOf(sy, arr);
    const all = cnt(arr);
    if (SEC()) {
      // a collège / lycée: by level and class (no school units)
      const sh = c => `<td class="s">${c.m}</td><td class="s">${c.f}</td><td class="t">${c.t}</td>`;
      const hd = '<tr><th class="d">المستوى</th><th class="d">القسم</th><th class="d">ذكور</th><th class="d">إناث</th><th class="d">المجموع</th></tr>';
      const rws = [];
      lv.forEach(l => { const cl = clsList(arr.filter(p => p.lvl === l)); cl.forEach((c, i) => rws.push(`<tr><td class="k">${i ? '' : esc(LV.sh(l))}</td><td dir="ltr">${esc(c)}</td>${g3c(cnt(arr, p => p.lvl === l && p.cls === c))}</tr>`)); rws.push(`<tr><td class="k" colspan="2">مجموع ${esc(LV.sh(l))}</td>${sh(cnt(arr, p => p.lvl === l))}</tr>`); });
      rws.push(`<tr><td class="k" colspan="2">المجموع العام</td><td class="s">${all.m}</td><td class="s">${all.f}</td><td class="g">${all.t}</td></tr>`);
      const cl0 = clsList(arr);
      const c1 = K.bars(cl0, [{ name: 'ذكور', color: COL.m, vals: cl0.map(c => cnt(arr, p => p.cls === c).m) }, { name: 'إناث', color: COL.f, vals: cl0.map(c => cnt(arr, p => p.cls === c).f) }], { w: 560, h: 210, title: 'حسب القسم', fs: cl0.length > 12 ? 7 : cl0.length > 7 ? 8.5 : 10 });
      const c2 = K.bars(lv.map(LV.sh), [{ name: 'ذكور', color: COL.m, vals: lv.map(l => cnt(arr, p => p.lvl === l).m) }, { name: 'إناث', color: COL.f, vals: lv.map(l => cnt(arr, p => p.lvl === l).f) }], { w: 560, h: 210, title: 'حسب المستوى', fs: 9 });
      return { title: 'إحصاء التلاميذ حسب الجنس', sub: `الموسم الدراسي ${esc(sy)}`, blocks: [SB.tbl(hd, rws, rws.length > 16 ? 'cmp' : ''), `<div class="sb-g2" style="margin-top:2mm"><div>${c1}</div><div>${c2}</div></div>`] };
    }
    const head = `<tr><th rowspan="2" class="d">المستويات</th>${units.map(u => `<th colspan="3" class="d">${esc(u)}</th>`).join('')}<th colspan="3" class="d">المجموع</th></tr><tr>${units.map(() => '<th>ذ</th><th>إ</th><th>المجموع</th>').join('')}<th>ذ</th><th>إ</th><th>المجموع</th></tr>`;
    const rows = lv.map(l => `<tr><td class="k">${esc(LV.sh(l))}</td>${units.map(u => g3c(cnt(arr, p => K.U.same(p.unit, u) && p.lvl === l))).join('')}${(c => `<td>${c.m}</td><td>${c.f}</td><td class="y">${c.t}</td>`)(cnt(arr, p => p.lvl === l))}</tr>`)
      .concat([`<tr><td class="k">المجموع</td>${units.map(u => (c => `<td class="s">${c.m}</td><td class="s">${c.f}</td><td class="t">${c.t}</td>`)(cnt(arr, p => K.U.same(p.unit, u)))).join('')}<td class="s">${all.m}</td><td class="s">${all.f}</td><td class="g">${all.t}</td></tr>`]);
    const chart = K.bars(units, [{ name: 'ذكور', color: COL.m, vals: units.map(u => cnt(arr, p => K.U.same(p.unit, u)).m) }, { name: 'إناث', color: COL.f, vals: units.map(u => cnt(arr, p => K.U.same(p.unit, u)).f) }], { w: 560, h: 210, title: 'إحصاء التلاميذ حسب الجنس', fs: units.length > 6 ? 8.5 : 10 });
    const chart2 = K.bars(lv.map(LV.sh), [{ name: 'ذكور', color: COL.m, vals: lv.map(l => cnt(arr, p => p.lvl === l).m) }, { name: 'إناث', color: COL.f, vals: lv.map(l => cnt(arr, p => p.lvl === l).f) }], { w: 560, h: 210, title: 'حسب المستوى', fs: 9 });
    return { title: `إحصاء ${ST[st].n} حسب الجنس${st ? ' — ' + ST[st].t : ''}`, sub: `الموسم الدراسي ${esc(sy)}`, blocks: [SB.tbl(head, rows, units.length > 5 ? 'cmp' : ''), `<div class="sb-g2" style="margin-top:2mm"><div>${chart}</div><div>${chart2}</div></div>`] };
  }
  // توزيع التلاميذ حسب السن والمستوى والجنس
  function docAge(s, sy, o) {
    const st = (o && o.stage) || '', arr = curS(sy, st), lv = levelsOf(sy, arr);
    const ages = arr.map(p => ageOf(p, sy)).filter(a => a != null);
    const a0 = ages.length ? Math.min(...ages) : 0, a1 = ages.length ? Math.max(...ages) : 0;
    const AL = []; for (let a = a0; a <= a1; a++) AL.push(a);
    const head = `<tr><th rowspan="2" class="d">المستوى</th>${AL.map(a => `<th colspan="2" class="d">${a} سنوات</th>`).join('')}<th colspan="3" class="d">المجموع</th></tr><tr>${AL.map(() => '<th>ذ</th><th>إ</th>').join('')}<th>ذ</th><th>إ</th><th>م</th></tr>`;
    const rows = lv.map(l => `<tr><td class="k">${esc(LV.sh(l))}</td>${AL.map(a => { const c = cnt(arr, p => p.lvl === l && ageOf(p, sy) === a); return `<td>${c.m || ''}</td><td>${c.f || ''}</td>`; }).join('')}${g3c(cnt(arr, p => p.lvl === l))}</tr>`)
      .concat([`<tr><td class="k">المجموع</td>${AL.map(a => { const c = cnt(arr, p => ageOf(p, sy) === a); return `<td class="s">${c.m}</td><td class="s">${c.f}</td>`; }).join('')}<td class="s">${cnt(arr).m}</td><td class="s">${cnt(arr).f}</td><td class="g">${arr.length}</td></tr>`]);
    const chart = K.bars(AL.map(a => a + ' سنوات'), [{ name: 'ذكور', color: COL.m, vals: AL.map(a => cnt(arr, p => ageOf(p, sy) === a).m) }, { name: 'إناث', color: COL.f, vals: AL.map(a => cnt(arr, p => ageOf(p, sy) === a).f) }], { w: 900, h: 200, title: 'التوزيع حسب السن والجنس' });
    return { title: `توزيع ${ST[st].n} حسب السن والمستوى والجنس${st ? ' — ' + ST[st].t : ''}`, sub: `الموسم الدراسي ${esc(sy)} — السن في 31 دجنبر ${MK.syStart(sy)}`, blocks: [SB.tbl(head, rows, AL.length > 8 ? 'cmp' : ''), chart] };
  }
  // نسبة تمدرس الفتاة
  function docGirls(s, sy, o) {
    const st = SECL() ? '' : ((o && o.stage) || ''), arr = current(sy), lv = levelsOf(sy, arr).filter(l => SECL() || (st === 'pre' ? stageOf(l) === 'pre' : stageOf(l) !== 'pre'));
    const L = lv.length ? lv : levelsOf(sy, arr);
    const tot = cnt(arr, p => L.includes(p.lvl));
    const head = `<tr><th></th>${L.map(l => `<th>${esc(LV.sh(l))}</th>`).join('')}<th>المجموع</th></tr>`;
    const rows = [`<tr><td class="k">المجموع</td>${L.map(l => `<td>${cnt(arr, p => p.lvl === l).t}</td>`).join('')}<td class="s">${tot.t}</td></tr>`,
      `<tr><td class="k">الإناث منهم</td>${L.map(l => `<td>${cnt(arr, p => p.lvl === l).f}</td>`).join('')}<td class="s">${tot.f}</td></tr>`,
      `<tr><td class="k">النسبة المئوية</td>${L.map(l => { const c = cnt(arr, p => p.lvl === l); return `<td>${K.pct(c.f, c.t)}</td>`; }).join('')}<td class="g">${K.pct(tot.f, tot.t)}</td></tr>`];
    const c1 = K.bars(L.map(LV.sh), [{ name: 'المجموع', color: COL.m, vals: L.map(l => cnt(arr, p => p.lvl === l).t) }, { name: 'عدد الإناث', color: COL.o, vals: L.map(l => cnt(arr, p => p.lvl === l).f) }], { w: 520, h: 230, title: `تمدرس الفتاة برسم الموسم الدراسي ${sy}` });
    const c2 = K.bars(L.map(LV.sh), [{ name: 'نسبة الإناث %', color: COL.g, vals: L.map(l => { const c = cnt(arr, p => p.lvl === l); return c.t ? +(c.f / c.t * 100).toFixed(2) : 0; }) }], { w: 520, h: 230, title: 'نسبة تمدرس الفتاة حسب المستوى %', fmt: v => v.toFixed(2) + '%' });
    return { title: `نسبة تمدرس الفتاة برسم الموسم الدراسي ${esc(sy)}${st === 'pre' ? ' — التعليم الأولي' : ''}`, blocks: [SB.tbl(head, rows, 'big'), `<div class="sb-g2" style="margin-top:3mm"><div class="sb-box">${c1}</div><div class="sb-box">${c2}</div></div>`] };
  }
  // إحصاء المسجلين الجدد بالسنة الأولى (حسب سنة الازدياد)
  const firstLv = () => (window.Cyc && Cyc.isSec() ? Cyc.levels()[0] : 'P1');
  const firstTitle = () => { const k = window.Cyc ? Cyc.kind() : 'pri'; return k === 'lyc' ? 'بالجذع المشترك' : k === 'col' ? 'بالسنة الأولى من التعليم الثانوي الإعدادي' : 'بالسنة الأولى من التعليم الابتدائي'; };
  function docNew1(s, sy) {
    const fl = firstLv(), rep = new Set(movesOf(sy, 'repeat').map(m => m.code).filter(Boolean));
    const arr = current(sy).filter(p => p.lvl === fl && !rep.has(p.code));
    const units = SEC() ? clsList(arr) : unitsOf(sy), same = (p, u) => (SEC() ? p.cls === u : K.U.same(p.unit, u));
    const y0 = MK.syStart(sy) - ((LV.byK(fl) || { off: 6 }).off - 1); // early entry, normal, late
    const YS = [y0, y0 - 1, y0 - 2];
    const byY = (p, yy, i) => { const b = +String(p.birth || '').slice(0, 4); return i === 2 ? b && b <= yy : b === yy; };
    const head = `<tr><th rowspan="2" class="d">${SEC() ? 'القسم' : 'المؤسسة'}</th>${YS.map((yy, i) => `<th colspan="3" class="d">مواليد ${yy}${i === 2 ? ' وما قبل' : ''}</th>`).join('')}<th colspan="3" class="d">المجموع</th></tr><tr>${YS.concat([0]).map(() => '<th>ذكور</th><th>إناث</th><th>مجموع</th>').join('')}</tr>`;
    const rows = units.map(u => `<tr><td class="k">${esc(u)}</td>${YS.map((yy, i) => g3c(cnt(arr, p => same(p, u) && byY(p, yy, i)))).join('')}${g3c(cnt(arr, p => same(p, u)))}</tr>`)
      .concat([`<tr><td class="k">المجموع</td>${YS.map((yy, i) => (c => `<td class="s">${c.m}</td><td class="s">${c.f}</td><td class="t">${c.t}</td>`)(cnt(arr, p => byY(p, yy, i)))).join('')}${(c => `<td class="s">${c.m}</td><td class="s">${c.f}</td><td class="g">${c.t}</td>`)(cnt(arr))}</tr>`]);
    const ttl = `إحصاء المسجلين الجدد ${firstTitle()}`;
    const chart = K.bars(units, [{ name: 'ذكور', color: COL.m, vals: units.map(u => cnt(arr, p => same(p, u)).m) }, { name: 'إناث', color: COL.f, vals: units.map(u => cnt(arr, p => same(p, u)).f) }], { w: 620, h: 200, title: ttl });
    return { title: ttl, sub: `الموسم الدراسي ${esc(sy)}`, blocks: [SB.tbl(head, rows), `<div class="sb-box" style="width:70%;margin:2mm auto 0">${chart}</div>`,
      `<div class="sb-note">تلاميذ ${esc(LV.name ? LV.name(fl) : (LV.byK(fl) || {}).ar || '')}${rep.size ? ' باستثناء المكررين' : ''}، حسب سنة الازدياد.</div>`] };
  }
  // جدول التتبع الدوري للإحصاء وحركية التلاميذ
  function docMoves(s, sy, o) {
    const st = SECL() ? '' : ((o && o.stage) || ''), units = SEC() ? [] : unitsOf(sy), cur = curS(sy, st), mv = Y(sy).moves.filter(m => inStage(m, st));
    const C4 = ['joined', 'left', 'notjoined', 'drop'].concat(Y(sy).moves.some(m => m.cat === 'merged') ? ['merged'] : []);
    const head = `<tr>${SEC() ? '' : '<th rowspan="2" class="d">الوحدات المدرسية</th>'}<th rowspan="2" class="d">المستوى</th>${C4.map(c => `<th colspan="3" class="d">${esc(CAT[c].sh)}</th>`).join('')}<th colspan="3" class="d">الوضعية الحالية</th></tr>
      <tr>${C4.concat(['x']).map(() => '<th>الذكور</th><th>الإناث</th><th>المجموع</th>').join('')}</tr>`;
    const rows = [];
    units.forEach(u => {
      const lv = LV.sort(Array.from(new Set(Y(sy).pupils.filter(p => K.U.same(p.unit, u) && inStage(p, st)).map(p => p.lvl).concat(mv.filter(m => K.U.same(m.unit, u)).map(m => m.lvl)).filter(Boolean))));
      lv.forEach((l, i) => rows.push(`<tr><td class="k" style="${i ? 'border-top-color:#e7e6e6' : ''}">${i ? '' : esc(u)}</td><td class="k">${esc(LV.sh(l))}</td>${C4.map(c => g3c(cnt(mv, m => m.cat === c && K.U.same(m.unit, u) && m.lvl === l))).join('')}${(cc => `<td>${cc.m}</td><td>${cc.f}</td><td class="y">${cc.t}</td>`)(cnt(cur, p => K.U.same(p.unit, u) && p.lvl === l))}</tr>`));
    });
    if (SEC()) LV.sort(Array.from(new Set(cur.map(p => p.lvl).concat(mv.map(m => m.lvl)).filter(Boolean)))).forEach(l => rows.push(`<tr><td class="k">${esc(LV.sh(l))}</td>${C4.map(c => g3c(cnt(mv, m => m.cat === c && m.lvl === l))).join('')}${(cc => `<td>${cc.m}</td><td>${cc.f}</td><td class="y">${cc.t}</td>`)(cnt(cur, p => p.lvl === l))}</tr>`));
    rows.push(`<tr><td class="k" colspan="${SEC() ? 1 : 2}">المجموع</td>${C4.map(c => (cc => `<td class="s">${cc.m}</td><td class="s">${cc.f}</td><td class="t">${cc.t}</td>`)(cnt(mv, m => m.cat === c))).join('')}${(cc => `<td class="s">${cc.m}</td><td class="s">${cc.f}</td><td class="g">${cc.t}</td>`)(cnt(cur))}</tr>`);
    return { title: `جدول التتبع الدوري للإحصاء وحركية ${ST[st].n}${st ? ' — ' + ST[st].t : ''}`, sub: `الموسم الدراسي ${esc(sy)} — في ${esc(fmtDate(MK.syRef(sy)))}`, blocks: [SB.tbl(head, rows, 'cmp')] };
  }
  // لائحة فئة من الحركية
  function docMoveList(s, sy, cat, st) {
    if (SECL()) st = '';
    const L = Y(sy).moves.filter(m => inStage(m, st) && (!cat || m.cat === cat));
    const units = unitsOf(sy);
    L.sort((a, b) => CATS.findIndex(x => x.k === a.cat) - CATS.findIndex(x => x.k === b.cat) || units.indexOf(a.unit) - units.indexOf(b.unit) || LV.idx(a.lvl) - LV.idx(b.lvl));
    const rows = L.map((m, i) => `<tr><td>${i + 1}</td>${cat ? '' : `<td>${esc(CAT[m.cat].sh)}</td>`}<td class="ltr">${esc(m.code || '')}</td><td class="r b">${esc(fullN(m))}</td><td>${gAr(m.g)}</td><td>${esc(fmtDate(m.birth))}</td>${SEC() ? '' : `<td>${esc(m.unit || '')}</td>`}<td>${esc(LV.sh(m.lvl))}</td><td>${esc(fmtDate(m.date))}</td><td class="r sm">${esc(m.note || '')}</td></tr>`);
    if (!rows.length) rows.push(`<tr><td colspan="${(cat ? 9 : 10) - (SEC() ? 1 : 0)}">لا شيء يذكر</td></tr>`);
    const head = `<tr><th style="width:5%">ر.ت</th>${cat ? '' : '<th>الفئة</th>'}<th>رمز مسار</th><th>الاسم والنسب</th><th>الجنس</th><th>تاريخ الازدياد</th>${SEC() ? '' : '<th>الوحدة المدرسية</th>'}<th>المستوى</th><th>التاريخ</th><th>ملاحظات</th></tr>`;
    return { title: cat ? `لائحة ${ST[st || ''].n} ${esc(CAT[cat].sh)}` : `لائحة حركية ${ST[st || ''].n}`, sub: `الموسم الدراسي ${esc(sy)}${st ? ' — ' + ST[st].t : ''}`, page: 'a4', blocks: [SB.tbl(head, rows)] };
  }
  // لائحة التلاميذ (per class / unit / level)
  function docList(s, sy, f) {
    const units = unitsOf(sy);
    const L = current(sy).filter(p => inStage(p, f.stage) && (!f.unit || K.U.same(p.unit, f.unit)) && (!f.cls || p.cls === f.cls) && (!f.lvl || p.lvl === f.lvl))
      .sort((a, b) => units.indexOf(a.unit) - units.indexOf(b.unit) || String(a.cls).localeCompare(String(b.cls)) || LV.idx(a.lvl) - LV.idx(b.lvl) || fullN(a).localeCompare(fullN(b), 'ar'));
    const groups = [];
    L.forEach(p => { const k = p.unit + '|' + p.cls; let g = groups.find(x => x.k === k); if (!g) groups.push(g = { k, unit: p.unit, cls: p.cls, list: [] }); g.list.push(p); });
    const blocks = [];
    groups.forEach((g, gi) => {
      const c = cnt(g.list);
      const lv = LV.sort(Array.from(new Set(g.list.map(p => p.lvl))));
      blocks.push({ html: `<div class="sb-cap r" style="${gi ? 'margin-top:4mm' : ''}">${SEC() ? '' : `الوحدة المدرسية: ${esc(g.unit)} — `}القسم: <span dir="ltr">${esc(g.cls)}</span> — المستوى: ${esc(lv.map(LV.sh).join(' + '))} — العدد: ${c.t} (ذ ${c.m} / إ ${c.f})</div>`, keepNext: true });
      blocks.push({ table: { cls: 'sb-t', head: `<tr><th style="width:5%">ر.ت</th><th style="width:14%">رمز مسار</th><th>النسب</th><th>الاسم</th><th style="width:7%">النوع</th><th style="width:12%">تاريخ الازدياد</th><th style="width:18%">مكان الازدياد</th>${lv.length > 1 ? '<th style="width:9%">المستوى</th>' : ''}</tr>`,
        rows: g.list.map((p, i) => `<tr><td>${i + 1}</td><td class="ltr">${esc(p.code)}</td><td class="r">${esc(p.last)}</td><td class="r">${esc(p.first)}</td><td>${gAr(p.g)}</td><td>${esc(fmtDate(p.birth))}</td><td class="sm">${esc(p.place || '')}</td>${lv.length > 1 ? `<td class="sm">${esc(LV.sh(p.lvl))}</td>` : ''}</tr>`) } });
    });
    if (!blocks.length) blocks.push('<div class="c">لا توجد معطيات</div>');
    return { title: !SECL() && f.stage === 'pre' ? 'لائحة أطفال التعليم الأولي' : 'لائحة التلاميذ', sub: `الموسم الدراسي ${esc(sy)}${!SEC() && f.unit ? ' — ' + esc(f.unit) : ''}${!SECL() && f.stage === 'pri' ? ' — التعليم الابتدائي' : ''}`, page: 'a4', blocks };
  }
  // بطاقات التلاميذ: 10 per A4 portrait page
  Dx.modCss += `
  .pc-grid{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:52mm;gap:3mm 4mm;margin:-2mm -3mm 0}
  .pc{border:1.3px solid #2c56a6;border-radius:3mm;overflow:hidden;display:flex;flex-direction:column;font-size:8.6pt;line-height:1.45;background:#fff}
  .pc-h{background:linear-gradient(180deg,#5e8fdc,#2c56a6);color:#fff;text-align:center;font-weight:700;font-size:8.4pt;padding:.8mm 2mm;line-height:1.35}
  .pc-h img{display:block;width:100%;height:auto;max-height:15mm;object-fit:fill;background:#fff}
  .pc-t{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:11pt;color:#0e2a66;margin:.6mm 0 .2mm}
  .pc-b{display:flex;gap:2mm;padding:0 2.5mm 1.5mm;flex:1}
  .pc-ph{width:20mm;height:25mm;border:1px dashed #6b8fd0;border-radius:1.5mm;display:flex;align-items:center;justify-content:center;color:#8aa3d6;font-size:7pt;flex:none;margin-top:.5mm}
  .pc-f{flex:1}.pc-f div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pc-f b{font-weight:700}
  `;
  /* 1.9.4: the letterhead is printed on EVERY card. The full image (up to 1.2 MB once encoded) repeated on hundreds of cards made a document of several
     hundred MB and froze / crashed the whole program (grey screen). Now a small reduced copy is made once (kept in memory) and, for the preview / print / PDF,
     it is written ONCE in a style rule used by all the cards (the size of the document no longer depends on the number of cards). Word needs real pictures: reduced <img>. */
  const lhThumbs = new Map();
  const lhKey = u => u.length + ':' + u.slice(0, 40) + u.slice(-40);
  function lhThumb(url) { // -> null while it is being prepared, {url, ratio} when ready, {url:''} if impossible
    if (!url) return { url: '' };
    const k = lhKey(url); let e = lhThumbs.get(k);
    if (e) return e.ready ? e : null;
    e = { ready: false, url: '', ratio: 0, wait: [] }; lhThumbs.set(k, e);
    const done = (u, r) => { e.url = u; e.ratio = r || 0; e.ready = true; e.wait.splice(0).forEach(f => { try { f(e); } catch (x) {} }); };
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const sc = Math.min(1, 640 / img.naturalWidth), c = document.createElement('canvas');
          c.width = Math.max(1, Math.round(img.naturalWidth * sc)); c.height = Math.max(1, Math.round(img.naturalHeight * sc));
          const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
          done(c.toDataURL('image/jpeg', 0.8), c.width / c.height);
        } catch (x) { done('', 0); }
      };
      img.onerror = () => done('', 0);
      img.src = url;
    } catch (x) { done('', 0); }
    return null;
  }
  // resolves when the reduced letterhead is ready (so that print / PDF / Word never use the text fallback by mistake)
  const lhReady = url => new Promise(res => { const e = lhThumb(url); if (e) return res(e); lhThumbs.get(lhKey(url)).wait.push(res); });
  let cardsRefresh = null;
  function docCards(s, sy, ids, word) {
    const set = ids ? new Set(ids) : null;
    const L = (ids ? Y(sy).pupils : current(sy)).filter(p => !set || set.has(p.id));
    const useImg = s.headerMode === 'image' && s.letterhead;
    const th = useImg ? lhThumb(s.letterhead) : { url: '' };
    if (useImg && !th && cardsRefresh) lhThumbs.get(lhKey(s.letterhead)).wait.push(() => { try { cardsRefresh(); } catch (x) {} });
    // Word needs the picture in every card: beyond ~20 MB of pictures the plain text header is used instead (the program would stall)
    const img = !!(th && th.url) && !(word && th.url.length * L.length > 20e6);
    // header: 95 mm wide card, picture height follows its ratio (at most 15 mm), stretched like the original <img>
    const hh = img ? Math.min(15, 95 / Math.max(0.5, th.ratio || 6)).toFixed(1) : 0;
    const once = img && !word ? `<style>.pc-h.im{padding:0;background:#fff url(${th.url}) 0 0/100% 100% no-repeat;height:${hh}mm}</style>` : '';
    const hdr = img ? (word ? `<img src="${esc(th.url)}">` : '') : `المملكة المغربية — ${esc(s.ministry || '')}<br>${esc(s.school || '')}`;
    const card = p => `<div class="pc"><div class="pc-h${img && !word ? ' im' : ''}" ${img && word ? 'style="padding:0;background:#fff"' : ''}>${hdr}</div><div class="pc-t">${!SECL() && stageOf(p.lvl) === 'pre' ? 'بطاقة الطفل(ة) — التعليم الأولي' : 'بطاقة التلميذ(ة)'} — ${esc(sy)}</div>
      <div class="pc-b"><div class="pc-f"><div>الاسم والنسب: <b>${esc(fullN(p))}</b></div><div>رمز مسار: <b dir="ltr">${esc(p.code)}</b></div><div>تاريخ ومكان الازدياد: <b>${esc(fmtDate(p.birth))}</b> ${esc(p.place || '')}</div>
        <div>المستوى: <b>${esc(LV.ar(p.lvl))}</b> — القسم: <b dir="ltr">${esc(p.cls || '')}</b></div>${SEC() ? '' : `<div>الوحدة المدرسية: <b>${esc(p.unit || '')}</b></div>`}</div><div class="pc-ph">صورة</div></div></div>`;
    const pages = [];
    for (let i = 0; i < Math.max(1, L.length); i += 10) pages.push(`${i === 0 ? once : ''}<div class="pc-grid">${L.slice(i, i + 10).map(card).join('')}</div>`);
    return pages;
  }

  const DOCS = {
    stats: { t: 'إحصاء التلاميذ حسب الجنس', f: (s, sy, st) => docGender(s, sy, st) }, age: { t: 'التوزيع حسب السن والمستوى', f: (s, sy, st) => docAge(s, sy, st) }, girls: { t: 'نسبة تمدرس الفتاة', f: (s, sy, st) => docGirls(s, sy, st) },
    new1: { get t() { return (window.Cyc && Cyc.kind() === 'lyc') ? 'المسجلون الجدد بالجذع المشترك' : 'المسجلون الجدد بالسنة الأولى'; }, f: docNew1 }, moves: { t: 'جدول التتبع الدوري للحركية', f: (s, sy, st) => docMoves(s, sy, st) }, school: { t: 'لوحة إحصاء التمدرس', f: (s, sy, st) => Pupils2.docs.school(s, sy, st) }, threat: { t: 'لائحة وإحصاء التلاميذ المهددين بالفصل', f: (s, sy, st) => Pupils2.docs.threat(s, sy, st) },
    disab: { t: 'إحصاء ولائحة التلاميذ في وضعية إعاقة', f: (s, sy, st) => Pupils2.docs.disab(s, sy, st) }, xfer: { t: 'لائحة التحويلات (الوافدون / المغادرون / في طور التحويل)', f: (s, sy, st) => Pupils2.docs.xfer(s, sy, st) },
    movelist: { t: 'لائحة الحركية (حسب الفئة)', f: (s, sy, st) => (['joined', 'left', 'transit'].includes(st.cat) ? Pupils2.docs.xfer(s, sy, st) : docMoveList(s, sy, st.cat, st.stage)) },
    list: { t: 'لائحة التلاميذ', f: (s, sy, st) => docList(s, sy, st) }, fam: { t: 'لائحة الأسماء العائلية المتشابهة (الإخوة)', f: (s, sy, st) => docFam(s, sy, st) }, cards: { t: 'بطاقات التلاميذ', f: null }
  };
  window.Pupils.docs = { gender: docGender, age: docAge, girls: docGirls, new1: docNew1, moves: docMoves };
  window.pagePupilDoc = function (v, arg) {
    migrate(DB); normSec();
    arg = arg || {};
    const sy0 = curSy();
    MK.docPage(v, {
      title: 'وثائق بطاقة التلاميذ', icon: '🎒', modes: false, flow: true,
      state: { kind: arg.kind || 'stats', unit: arg.unit || '', cls: arg.cls || '', lvl: arg.lvl || '', cat: arg.cat || (arg.kind === 'xfer' ? 'joined' : ''), ids: arg.ids || null, sy: sy0, stage: SECL() ? '' : (arg.stage != null ? arg.stage : stage), src: arg.src || '' },
      back: () => go('pupils'),
      beforeOutput: async st => { if (st.kind === 'cards') { const s0 = S(); if (s0.headerMode === 'image' && s0.letterhead) await lhReady(s0.letterhead); } },
      form: (box, st, refresh) => {
        cardsRefresh = refresh;
        const draw = () => {
          const units = unitsOf(st.sy), classes = Array.from(new Set(Y(st.sy).pupils.filter(p => !st.unit || K.U.same(p.unit, st.unit)).map(p => p.cls)));
          box.innerHTML = `<div class="sec-t">الوثيقة</div><div class="fld"><select class="inp" id="dk">${Object.entries(DOCS).map(([k, d]) => `<option value="${k}" ${k === st.kind ? 'selected' : ''}>${d.t}</option>`).join('')}</select></div>
            ${['cards', 'new1'].includes(st.kind) || SECL() ? '' : `<div class="fld"><label>السلك</label><select class="inp" id="ds">${['', 'pre', 'pri'].map(k => `<option value="${k}" ${k === st.stage ? 'selected' : ''}>${k ? ST[k].t : 'كل الأسلاك (الأولي والابتدائي)'}</option>`).join('')}</select></div>`}
            <div class="fld"><label>الموسم الدراسي</label><select class="inp" id="dy">${MK.syList(Object.keys(PD().years)).map(y => `<option value="${y}" ${y === st.sy ? 'selected' : ''}>${MK.syDash(y)}</option>`).join('')}</select></div>
            ${!SEC() && ['list', 'fam', 'school', 'threat', 'disab'].includes(st.kind) ? `<div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="du"><option value="">الكل</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>` : ''}
            ${st.kind === 'list' || st.kind === 'fam' ? `<div class="fld"><label>القسم</label><select class="inp" id="dc" dir="ltr"><option value="">الكل</option>${classes.map(u => `<option ${u === st.cls ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>` : ''}
            ${st.kind === 'movelist' || st.kind === 'xfer' ? `<div class="fld"><label>الفئة</label><select class="inp" id="dm">${st.kind === 'movelist' ? '<option value="">كل الفئات</option>' : ''}${CATS.filter(c => st.kind === 'movelist' || ['joined', 'left', 'transit'].includes(c.k)).map(c => `<option value="${c.k}" ${c.k === st.cat ? 'selected' : ''}>${c.l}</option>`).join('')}</select></div>` : ''}
            ${st.kind === 'cards' ? `<p class="muted" style="font-size:12px">${st.ids ? st.ids.length : Y(st.sy).pupils.length} بطاقة (10 في كل صفحة A4). اختر التلاميذ من «لائحة التلاميذ» (تصفية حسب ${SEC() ? 'القسم أو المستوى' : 'الوحدة أو القسم'}) ثم «بطاقات التلاميذ».</p>` : ''}
            <p class="muted" style="font-size:12px;line-height:1.7">تحسب الإحصائيات تلقائيا من لوائح مسار المستوردة، دون احتساب المنقطعين والمغادرين وغير الملتحقين. السن محسوب في 31 دجنبر ${MK.syStart(st.sy)}.</p>`;
          $('#dk', box).onchange = e => { st.kind = e.target.value; draw(); refresh(); };
          if ($('#ds', box)) $('#ds', box).onchange = e => { st.stage = e.target.value; refresh(); };
          $('#dy', box).onchange = e => { st.sy = e.target.value; st.ids = null; draw(); refresh(); };
          if ($('#du', box)) $('#du', box).onchange = e => { st.unit = e.target.value; st.cls = ''; draw(); refresh(); };
          if ($('#dc', box)) $('#dc', box).onchange = e => { st.cls = e.target.value; refresh(); };
          if ($('#dm', box)) $('#dm', box).onchange = e => { st.cat = e.target.value; refresh(); };
        };
        draw();
      },
      build: st => {
        const s = S();
        if (st.kind === 'cards') return { page: 'a4', pages: docCards(s, st.sy, st.ids, st.out === 'word') };
        const d = DOCS[st.kind].f(s, st.sy, st);
        return { page: d.page || 'a4l', pages: SB.pages(s, d) };
      },
      fname: st => `${DOCS[st.kind].t}${st.stage && !['cards', 'new1'].includes(st.kind) ? '_' + ST[st.stage].t.replace(/\s+/g, '_') : ''}_${MK.syDash(st.sy)}`
    });
  };
  // 1.9.3: internals shared with pupils2.js (categories, transfers, dashboards)
  window.Pupils.X = { Y, PD, current, CATS, CAT, OUT, cnt, levelsOf, unitsOf, movesOf, fullN, gAr, gOf, stageOf, inStage, ageOf, isoD, moveForm, nh, flt, ST, readSheet, unitNamesFor, importMassar, catOfSheetName, curSy,
    get stage() { return stage; }, exportXlsx };
})();
