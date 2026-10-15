'use strict';
/* 1.9.2 — تدبير الامتحان الإشهادي: الامتحان الموحد على صعيد المؤسسة أو الامتحان الموحد الإقليمي للمستوى الإشهادي
   (السادس ابتدائي، أو الأولى/الثانية/الثالثة إعدادي).
   المعطيات (لكل موسم): info (نوع الامتحان، المستوى، الدورة، مركز الامتحان...)، cands (المترشحون، استيراد ملف GEXA أو من بطاقة التلاميذ)،
   subjects (جدولة الامتحان)، rooms (القاعات وتوزيع أرقام الامتحان)، staff (طاقم المركز)، guards (توزيع المراقبين)، marks (النقط).
   كل خطوة من خطوات الإعداد وثيقة في «مركز الوثائق» تعدّل المعطيات المشتركة، والوثائق الأخرى تُملأ منها تلقائيا. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, LV } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; };

  function migrate(db) { const e = db.exams = db.exams || {}; e.years = e.years && typeof e.years === 'object' ? e.years : {}; }
  const Y = sy => {
    migrate(DB); const y = DB.exams.years[sy] || (DB.exams.years[sy] = {});
    ['info', 'cands', 'subjects', 'rooms', 'staff', 'guards', 'marks'].forEach(k => { if (!y[k] || typeof y[k] !== 'object') y[k] = {}; });
    return y;
  };
  // 1.9.3: the certified exams follow the cycle chosen in the settings (primary: 6th year; collège: only 3rd year; lycée: 1st and 2nd baccalauréat)
  const ALL_TYPES = [['local', 'الامتحان الموحد على صعيد المؤسسة'], ['prov', 'الامتحان الموحد الإقليمي'], ['reg', 'الامتحان الجهوي الموحد'], ['nat', 'الامتحان الوطني الموحد (الثانية باكالوريا)']];
  const ALL_LEVELS = [['P6', 'السادس ابتدائي'], ['C1', 'الأولى إعدادي'], ['C2', 'الثانية إعدادي'], ['C3', 'الثالثة إعدادي'], ['TC', 'الجذع المشترك'], ['B1', 'الأولى باكالوريا'], ['B2', 'الثانية باكالوريا']];
  const kindNow = () => (window.Cyc ? Cyc.kind() : 'pri');
  // 1.9.4: «كل الأسلاك»: any certified level / type (a school can be the centre of an exam of another cycle)
  const allC = () => { try { return !!(DB.exams && DB.exams.allCycles); } catch (e) { return false; } };
  const levelsFor = k => allC() ? ALL_LEVELS.slice() : ALL_LEVELS.filter(l => (k || kindNow()) === 'lyc' ? /^B/.test(l[0]) : (k || kindNow()) === 'col' ? l[0] === 'C3' : l[0] === 'P6');
  const typesFor = k => { if (allC()) return ALL_TYPES.slice(); k = k || kindNow(); return k === 'lyc' ? [['local', 'الامتحان الموحد المحلي (على صعيد المؤسسة)'], ['reg', 'الامتحان الجهوي الموحد (الأولى باكالوريا)'], ['nat', 'الامتحان الوطني الموحد (الثانية باكالوريا)']]
    : k === 'col' ? [['local', 'الامتحان الموحد المحلي (على صعيد المؤسسة)'], ['reg', 'الامتحان الجهوي الموحد (الثالثة إعدادي)']] : [['local', 'الامتحان الموحد على صعيد المؤسسة'], ['prov', 'الامتحان الموحد الإقليمي']]; };
  const TYPES = ALL_TYPES, LEVELS = ALL_LEVELS;
  // a second mark column (local exam of 3AC / regional exam of the 1st year of the baccalauréat) when the average combines three parts
  const hasLoc = I => I.type === 'nat' || (I.type === 'reg' && I.level !== 'B1');
  const isCol = l => /^C/.test(l || '');
  const SUBJ = {
    P6: [['اللغة العربية', 2], ['اللغة الفرنسية', 1], ['الرياضيات', 2], ['النشاط العلمي', 1], ['التربية الإسلامية', 1], ['الاجتماعيات', 1]],
    C1: [['اللغة العربية', 3], ['اللغة الفرنسية', 3], ['الرياضيات', 3], ['التربية الإسلامية', 2], ['الاجتماعيات', 2], ['علوم الحياة والأرض', 2], ['الفيزياء والكيمياء', 2], ['اللغة الإنجليزية', 2]],
    B1: [['اللغة العربية', 2], ['اللغة الفرنسية', 2], ['اللغة الإنجليزية', 2], ['الفلسفة', 2], ['التربية الإسلامية', 1], ['الرياضيات', 4], ['علوم الحياة والأرض', 3], ['الفيزياء والكيمياء', 3]],
    B2: [['اللغة العربية', 2], ['اللغة الفرنسية', 2], ['اللغة الإنجليزية', 2], ['الفلسفة', 2], ['التربية الإسلامية', 1], ['الرياضيات', 7], ['علوم الحياة والأرض', 5], ['الفيزياء والكيمياء', 7]],
    C3: [['اللغة العربية', 3], ['اللغة الفرنسية', 3], ['الرياضيات', 3], ['التربية الإسلامية', 2], ['الاجتماعيات', 2], ['علوم الحياة والأرض', 2], ['الفيزياء والكيمياء', 2], ['اللغة الإنجليزية', 2]]
  };
  // 1.9.4: the subjects proposed follow the cycle, the level and the kind of exam (they stay editable)
  const defSubj = I => (I.level === 'P6' && I.type === 'prov' ? [['اللغة العربية والتربية الإسلامية', 2], ['الرياضيات', 2], ['اللغة الفرنسية', 1]]
    : I.level === 'B1' && I.type === 'reg' ? [['اللغة العربية', 2], ['اللغة الفرنسية', 2], ['التربية الإسلامية', 2], ['التاريخ والجغرافيا', 2]]
      : SUBJ[I.level] || SUBJ.C1);
  const ROLES = ['رئيس مركز الامتحان', 'مراقب(ة) الإجراء', 'مراقب(ة) احتياطي(ة)', 'ملاحظ(ة)', 'الكتابة', 'مكلف بجناح', 'مداوم(ة)', 'مراقب(ة) الجودة', 'حارس أمن', 'التصحيح', 'رئيس مركز التصحيح', 'كتابة مركز التصحيح', 'منسق(ة) المسك', 'طاقم النظافة', 'أخرى'];
  // explanations that follow the cycle of the settings
  const WEIGHTS = ' (غيّر النسب حسب المذكرة المعمول بها: اترك أحد الأجزاء فارغا ليُهمل).';
  const noteCalc = () => { const k = kindNow(); return k === 'lyc' ? 'الأولى باكالوريا: «الامتحان الموحد المحلي» أو «الامتحان الجهوي الموحد». الثانية باكالوريا: «الامتحان الوطني الموحد» (المعدل العام = 25% مراقبة مستمرة + 25% امتحان جهوي + 50% امتحان وطني)' + WEIGHTS
    : k === 'col' ? 'الثالثة إعدادي: «الامتحان الموحد المحلي» (على صعيد المؤسسة) أو «الامتحان الجهوي الموحد»، وفي الجهوي يُحتسب المعدل بنسبة 30% مراقبة مستمرة + 30% امتحان محلي + 40% امتحان جهوي (المعدل = (3×م.م + 3×م.ل + 4×م.ج) ÷ 10، والنجاح من 10/20)' + WEIGHTS
      : 'السادس ابتدائي: اختر «الامتحان الموحد على صعيد المؤسسة» أو «الامتحان الموحد الإقليمي».' + WEIGHTS; };
  const introTxt = () => { const k = kindNow(); return 'الامتحان الإشهادي حسب السلك المختار في الإعدادات: ' + (k === 'lyc' ? 'الأولى والثانية باكالوريا (محلي أو جهوي ووطني)' : k === 'col' ? 'الثالثة إعدادي فقط (محلي وجهوي)' : 'السادس ابتدائي (موحد على صعيد المؤسسة أو إقليمي)')
    + (k === 'pri' ? '. يمكن اختيار أي وحدة مدرسية مركزا للامتحان.' : '. يمكن اعتماد المؤسسة مركزا للامتحان أو كتابة اسم ورمز مركز آخر.') + ' ابدأ بالمعطيات العامة، ثم استورد لائحة المترشحين (ملف Excel المستخرج من منظومة الامتحانات/مسار: «لائحة المترشحين حسب مركز الامتحان») أو أضفهم من بطاقة التلاميذ، ثم الجدولة والقاعات وطاقم المركز وتوزيع المراقبين؛ بعدها تُملأ كل الاستدعاءات واللوائح والمحاضر تلقائيا، وتُحتسب النتائج بعد إدخال النقط.'; };
  const info = sy => {
    const s = S(), i = Y(sy).info, k = kindNow();
    const lv = levelsFor(k).map(x => x[0]), ty = typesFor(k).map(x => x[0]);
    let level = i.level || (k === 'lyc' ? 'B2' : k === 'col' ? 'C3' : 'P6');
    if (!lv.includes(level) && !i.keepLevel) level = lv[lv.length - 1];       // the level follows the cycle of the settings
    let type = i.type || 'local'; if (!ty.includes(type) && !i.keepLevel) type = ty[0];
    const I0 = { type, level };
    const three = hasLoc(I0);   // 3AC: MG = (3·MC + 3·ML + 4·MR) / 10 (30% + 30% + 40%); 2BAC: 25% continuous + 25% regional (1BAC) + 50% national
    const bac = /^B/.test(level), colg = isCol(level) || bac;
    return Object.assign({ type, level, session: `يونيو ${MK.syStart(sy) + 1}`, center: s.school || '', code: s.gresa || '', head: s.director || '', first: '1',
      wcc: type === 'nat' ? '25' : three ? '30' : level === 'B1' ? '0' : '50', wloc: type === 'nat' ? '25' : '30', wex: type === 'nat' ? '50' : level === 'B1' ? '100' : three ? '40' : '50', pass: colg ? '10' : '5', max: colg ? '20' : '10' }, i, I0);
  };
  const typeName = t => (ALL_TYPES.find(x => x[0] === t) || ALL_TYPES[0])[1];
  const levelName = l => (ALL_LEVELS.find(x => x[0] === l) || ALL_LEVELS[0])[1];
  const examTitle = I => (I.level === 'B2' ? (I.type === 'nat' ? 'الامتحان الوطني الموحد لنيل شهادة الباكالوريا' : `${typeName(I.type)} — الثانية باكالوريا`) : I.level === 'B1' ? (I.type === 'reg' ? 'الامتحان الجهوي الموحد للسنة الأولى من سلك الباكالوريا' : `${typeName(I.type)} — الأولى باكالوريا`)
    : I.type === 'reg' ? 'الامتحان الجهوي الموحد لنيل شهادة السلك الإعدادي' : I.level === 'C3' ? `${typeName(I.type)} لنيل شهادة السلك الإعدادي` : I.level === 'P6' ? `${typeName(I.type)} لنيل شهادة الدروس الابتدائية` : `${typeName(I.type)} — ${levelName(I.level)}`);
  // rows of the shared tables
  const cands = sy => (Y(sy).cands.rows || []).filter(r => nm(r[1]) || nm(r[2]));
  const subjects = sy => (Y(sy).subjects.rows || []).filter(r => nm(r[0]));
  const rooms = sy => (Y(sy).rooms.rows || []).filter(r => nm(r[0]));
  const staff = sy => (Y(sy).staff.rows || []).filter(r => nm(r[0]));
  const C = { no: 0, name: 1, code: 2, g: 3, birth: 4, cls: 5, room: 6, origin: 7, track: 8, desk: 9 };
  const CAND_COLS = ['رقم الامتحان', 'الاسم الكامل', 'الرقم الوطني', 'الجنس', 'تاريخ الازدياد', 'القسم', 'القاعة', 'المؤسسة الأصلية', 'المسلك / الشعبة', 'رقم الطاولة'];
  const isF = g => /أنثى|انثى|^f$|^F$|إناث/.test(nm(g));
  const sortRooms = (a, b) => String(a).localeCompare(String(b), 'ar', { numeric: true });
  const byRoom = sy => { const m = new Map(); rooms(sy).forEach(r => m.set(nm(r[0]), [])); cands(sy).forEach(c => { const k = nm(c[C.room]) || '—'; if (!m.has(k)) m.set(k, []); m.get(k).push(c); }); return m; };
  const sessLabel = r => `${r[1] ? K.dayName(r[1]) + ' ' + MK.showDate(r[1]) : ''} ${r[2] ? 'من ' + r[2] : ''}${r[3] ? ' إلى ' + r[3] : ''}`.trim();
  const dots = (v, n) => nm(v) || '.'.repeat(n || 16);

  /* ---------- import of the candidates list (GEXA / Massar export «لائحة المترشحين حسب مركز الامتحان») ---------- */
  const HM = MK.matcher({
    no: ['رقم الامتحان', 'رقم الإمتحان', 'ر.امتحان', 'ر الامتحان', 'ر الإمتحان', 'NumeroExam'], name: ['الاسم الكامل', 'الإسم الكامل', 'الاسم والنسب', 'الإسم و النسب', 'الإسم والنسب', 'Nom complet'], code: ['الرقم الوطني', 'رمز مسار', 'رقم مسار', 'CNE', 'code massar'],
    g: ['الجنس', 'النوع', 'Sexe'], birth: ['تاريخ الإزدياد', 'تاريخ الازدياد', 'Date de naissance'], cls: ['القسم', 'Classe'], room: ['قاعة الإمتحان', 'قاعة الامتحان', 'القاعة', 'Salle'],
    origin: ['المؤسسة', 'المؤسسة الأصلية', 'المؤسسة الاصلية', 'مؤسسة الأصل', 'Etablissement'], center: ['مركز الامتحان'], ccode: ['رمز مركز الامتحان'], level: ['المستوى']
  });
  async function importCands(f, sy, c) {
    const sheets = await MK.openTable(); if (!sheets) return;
    const out = []; let center = '', ccode = '', level = '';
    sheets.forEach(sh => {
      const h = MK.headerRow(sh.rows, HM, 3); if (!h) return;
      const ix = k => h.map.indexOf(k);
      sh.rows.slice(h.hi + 1).forEach(r => {
        const g = k => (ix(k) >= 0 ? nm(r[ix(k)]) : '');
        if (!g('name') && !g('code')) return;
        out.push([g('no'), g('name'), g('code').toUpperCase(), g('g'), g('birth'), g('cls'), g('room').replace(/^\d+-\s*Salle\s*/i, '').replace(/^(\d+)-(\d+)$/, '$2') || g('room'), g('origin'), g('level'), '']);
        center = center || g('center'); ccode = ccode || g('ccode'); level = level || g('level');
      });
    });
    { const lv = new Set(out.map(r => r[8]).filter(Boolean)); if (lv.size <= 1 && !Array.from(lv).some(t => /مسار|أصيل|اصيل|مهني|شعبة|مسلك|علوم|آداب|اداب|رياض|خيار/.test(t))) out.forEach(r => { r[8] = ''; }); }
    if (!out.length) return c.toast('لم يتم العثور على لائحة المترشحين (رقم الامتحان، الاسم الكامل، الرقم الوطني...) في الملف', true);
    f.rows = out; c.save('rows');
    const I = Y(sy).info;
    if (center && !I.center) I.center = center; if (ccode && !I.code) I.code = ccode;
    if (level && !I.level && /باك|bac/i.test(level)) I.level = /الثانية|2|ثاني/.test(level) ? 'B2' : 'B1';
    else if (level && !I.level) I.level = /الأولى|الاولى|1/.test(level) && /إعدادي|اعدادي/.test(level) ? 'C1' : /الثانية|2/.test(level) && /إعدادي|اعدادي/.test(level) ? 'C2' : /إعدادي|اعدادي/.test(level) ? 'C3' : 'P6';
    // the rooms of the file
    const rs = Array.from(new Set(out.map(r => r[C.room]).filter(Boolean))).sort(sortRooms);
    if (rs.length && !rooms(sy).length) { Y(sy).rooms.rows = rs.map(x => [x, String(out.filter(r => r[C.room] === x).length)]); }
    persist(); c.toast(`تم استيراد ${out.length} مترشحا`);
  }
  function fromPupils(f, sy, c) {
    const lv = info(sy).level;
    const L = (window.Pupils ? Pupils.current(sy) : []).filter(p => p.lvl === lv).sort((a, b) => String(a.cls).localeCompare(String(b.cls), 'ar', { numeric: true }) || `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`, 'ar'));
    if (!L.length) return c.toast(`لا يوجد تلاميذ ${levelName(lv)} في بطاقة التلاميذ لهذا الموسم`, true);
    f.rows = L.map(p => ['', `${p.last || ''} ${p.first || ''}`.trim(), p.code || '', p.g === 'F' ? 'أنثى' : p.g === 'M' ? 'ذكر' : '', MK.showDate(p.birth || ''), p.cls || '', '', S().school || '']);
    c.save('rows'); c.toast(`أضيف ${L.length} مترشحا من بطاقة التلاميذ`);
  }
  // exam numbers and rooms: candidates in the order of the list, rooms filled one after the other
  function distribute(f, sy, c) {
    const rs = rooms(sy); const L = Y(sy).cands.rows || [];
    if (!rs.length) return c.toast('أدخل القاعات وسعتها أولا', true);
    let first = parseInt(info(sy).first, 10); if (!isFinite(first)) first = 1;
    let ri = 0, used = 0;
    L.filter(r => nm(r[1]) || nm(r[2])).forEach((r, i) => {
      while (ri < rs.length - 1 && used >= (parseInt(rs[ri][1], 10) || 20)) { ri++; used = 0; }
      r[C.no] = String(first + i); r[C.room] = nm(rs[ri][0]); used++;
    });
    persist(); c.toast('تم ترقيم المترشحين وتوزيعهم على القاعات');
  }
  // invigilation: two invigilators per room and per session (+ reserves), the fewest sessions first
  function guards(f, sy, c) {
    const ss = subjects(sy), rs = rooms(sy);
    const pool = staff(sy).filter(r => /مراقب/.test(r[3] || 'مراقب'));
    if (!ss.length || !rs.length) return c.toast('أدخل جدولة الامتحان والقاعات أولا', true);
    if (pool.length < 2) return c.toast('أضف المراقبين في «طاقم مركز الامتحان» (المهمة: مراقب(ة) الإجراء)', true);
    const reserve = Math.max(0, parseInt(f.reserve, 10) || 0);
    const cnt = new Map(pool.map(p => [p[0], 0])), last = new Map();
    const rows = [];
    ss.forEach((s, si) => {
      const busy = new Set();
      const pick = room => {
        const L = pool.map(p => p[0]).filter(n => !busy.has(n)).sort((a, b) => cnt.get(a) - cnt.get(b) || (last.get(a) === room) - (last.get(b) === room));
        const n = L[0] || ''; if (n) { busy.add(n); cnt.set(n, cnt.get(n) + 1); last.set(n, room); } return n;
      };
      rs.forEach(r => rows.push([String(si + 1), nm(r[0]), pick(nm(r[0])), pick(nm(r[0])), '']));
      for (let k = 0; k < reserve; k++) rows.push([String(si + 1), 'احتياط', pick('احتياط'), '', '']);
    });
    f.rows = rows; c.save('rows'); c.toast('تم توزيع المراقبين على القاعات والحصص');
  }
  const guardRows = sy => (Y(sy).guards.rows || []).filter(r => nm(r[0]));
  const sessOf = (sy, i) => subjects(sy)[(parseInt(i, 10) || 1) - 1] || ['', '', '', '', ''];

  /* ---------- results ---------- */
  function results(sy) {
    const I = info(sy), ss = subjects(sy), M = Y(sy).marks.rows || [];
    const mx = num(I.max) || 10, pass = num(I.pass) || mx / 2, wcc = num(I.wcc) == null ? 50 : num(I.wcc), wex = num(I.wex) == null ? 50 : num(I.wex), wloc = num(I.wloc) == null ? 30 : num(I.wloc), reg = hasLoc(I);
    return cands(sy).map(c => {
      const m = M.find(r => nm(r[0]) === nm(c[C.no]) && nm(c[C.no])) || M.find(r => nm(r[1]) === nm(c[C.name])) || [];
      const cc = num(m[2]);
      let sw = 0, sc = 0, miss = 0;
      ss.forEach((s, i) => { const v = num(m[3 + i]), w = num(s[4]) || 1; if (v == null) miss++; else { sw += w; sc += v * w; } });
      const ex = sw ? sc / sw : null;
      const loc = reg ? num(m[3 + ss.length]) : null;
      let fin = null;
      if (ex != null) { let a = ex * wex, b = wex; if (cc != null) { a += cc * wcc; b += wcc; } if (reg && loc != null) { a += loc * wloc; b += wloc; } fin = a / (b || 100); }
      return { c, cc, loc, marks: ss.map((s, i) => num(m[3 + i])), ex, fin, miss, ok: fin != null && fin >= pass && !miss };
    });
  }
  const f2 = v => (v == null ? '' : (Math.round(v * 100) / 100).toFixed(2));
  const mention = (v, mx) => { if (v == null) return ''; const r = v / mx * 20; return r >= 16 ? 'حسن جدا' : r >= 14 ? 'حسن' : r >= 12 ? 'مستحسن' : r >= 10 ? 'مقبول' : ''; };

  /* ---------- documents ---------- */
  const DOCS = [];
  const add = d => DOCS.push(d);
  const sub = (sy) => { const I = info(sy); return `${examTitle(I)} — دورة ${I.session} — المستوى: ${levelName(I.level)}`; };
  const pb = html => `<div class="docx-pb"></div>${html}`;
  const kv = pairs => ({ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:22%"><col style="width:28%"><col style="width:22%"><col style="width:28%"></colgroup>', rows: (() => { const o = []; for (let i = 0; i < pairs.length; i += 2) { const a = pairs[i], b = pairs[i + 1] || ['', '']; o.push(tr([{ t: a[0], c: 'k' }, { t: a[1] }, { t: b[0], c: b[0] ? 'k' : '' }, { t: b[1] }])); } return o; })() } });
  const signHead = s => SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان' });

  // --- 1. general data (also: بطاقة مركز الامتحان)
  add({
    k: 'info', t: 'المعطيات العامة وبطاقة مركز الامتحان', grp: 'd', d: 'نوع الامتحان (على صعيد المؤسسة أو إقليمي)، المستوى الإشهادي، الدورة، مركز الامتحان ورئيسه، طريقة احتساب المعدل.', auto: 'معطيات المؤسسة', page: 'a4',
    init: (s, sy) => info(sy),
    onSave: (k, f, sy, st) => {
      if (k === 'allc') { DB.exams.allCycles = !!f.allc; if (f.allc) { Y(sy).info.keepLevel = true; } return 'redraw'; }
      if (k === 'centerUnit') { const c = f.centerUnit ? Units.centerOf(f.centerUnit) : null; if (c) { f.center = c.name; f.code = c.code; st.center = c.name; st.code = c.code; } return 'redraw'; }
    },
    defs: () => [{ sec: 'الامتحان' }, { k: 'allc', l: 'الأسلاك', t: 'select', opts: [['', 'حسب سلك المؤسسة في الإعدادات'], ['1', 'كل الأسلاك (الابتدائي، الإعدادي، التأهيلي)']], half: true }, { k: 'type', l: 'نوع الامتحان', t: 'select', opts: () => typesFor() }, { k: 'level', l: 'المستوى الإشهادي', t: 'select', opts: () => levelsFor(), half: true }, { k: 'session', l: 'الدورة', half: true },
      { sec: 'مركز الامتحان' }, { k: 'centerUnit', l: (window.Cyc ? Cyc.group() : kindNow() === 'pri') ? 'اختيار المركز من الوحدات المدرسية (تُملأ الخانتان التاليتان تلقائيا)' : 'اعتماد المؤسسة مركزا للامتحان (تُملأ الخانتان التاليتان تلقائيا)', t: 'select', opts: () => Units.centerOptions() }, { k: 'center', l: 'مركز الامتحان', half: true }, { k: 'code', l: 'رمز المركز (GRESA)', half: true, dir: 'ltr' }, { k: 'head', l: 'رئيس(ة) مركز الامتحان', half: true, list: 'k2Emps' }, { k: 'first', l: 'أول رقم امتحان', t: 'num', half: true },
      { sec: 'احتساب النتائج' }, { k: 'max', l: 'النقطة القصوى', t: 'num', half: true }, { k: 'pass', l: 'معدل النجاح', t: 'num', half: true },
      { k: 'wcc', l: 'نسبة المراقبة المستمرة %', t: 'num', half: true }, { k: 'wex', l: 'نسبة الامتحان الموحد (أو الجهوي) %', t: 'num', half: true }, { k: 'wloc', l: 'نسبة الامتحان المحلي % (الجهوي فقط)', t: 'num', half: true },
      { note: noteCalc() }],
    build: (s, f, sy) => {
      const I = info(sy), L = cands(sy), fN = L.filter(c => isF(c[C.g])).length;
      const st = staff(sy).map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, r[1], { t: r[2], c: 'sm' }, { t: r[3], c: 'sm' }]));
      return { title: 'بطاقة مركز الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        kv([['نوع الامتحان', typeName(I.type)], ['المستوى', levelName(I.level)], ['الدورة', I.session], ['الموسم الدراسي', MK.syDash(sy)], ['مركز الامتحان', I.center], ['رمز المركز', I.code], ['رئيس(ة) المركز', I.head], ['المديرية الإقليمية', s.directorate || ''],
          ['عدد المترشحين', String(L.length)], ['منهم الإناث', String(fN)], ['عدد القاعات', String(rooms(sy).length)], ['عدد المواد', String(subjects(sy).length)]]),
        SB.cap('طاقم مركز الامتحان'), tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الإطار / المادة', 'المهمة أثناء الامتحان']), st.length ? st : [tr(['', '', '', '', { t: '', st: 'height:8mm' }])], 'cmp'),
        { html: '<div class="sb-note">(*) يتعين تحديد المهمة المنوطة بكل عضو داخل مركز الامتحان.</div>' }] };
    }
  });
  // --- 2. candidates
  add({
    k: 'cands', t: 'المترشحون (استيراد ولائحة)', grp: 'd', d: 'استيراد لائحة المترشحين من ملف Excel (GEXA / مسار: لائحة المترشحين حسب مركز الامتحان) أو من بطاقة التلاميذ، مع لائحة المترشحين حسب الأقسام.', auto: 'ملف GEXA أو بطاقة التلاميذ', page: 'a4',
    init: () => ({ rows: [] }),
    defs: () => [{ t: 'html', html: '<div class="btn-row"><button type="button" class="btn sm pri" data-act="imp">استيراد ملف المترشحين (Excel)</button><button type="button" class="btn sm" data-act="pup">من بطاقة التلاميذ</button><button type="button" class="btn sm" data-act="dist">ترقيم وتوزيع على القاعات</button></div>' },
      { k: 'rows', l: 'لائحة المترشحين', t: 'grid', cols: CAND_COLS, widths: ['.55fr', '1.4fr', '.95fr', '.5fr', '.8fr', '.65fr', '.5fr', '.95fr', '.8fr', '.45fr'], dirs: ['ltr', null, 'ltr', null, null, 'ltr', null, null, null, 'ltr'], list: [null, 'k2Pupils', 'k2Codes', null, null, null, null, null, null, null],
        link: { src: 'pupil', n: 1, cols: { code: 2, gender: 3, birth: 4, cls: 5 } } }],
    act: { imp: (f, sy, c) => importCands(f, sy, c), pup: (f, sy, c) => fromPupils(f, sy, c), dist: (f, sy, c) => { distribute(f, sy, c); c.redraw(); } },
    build: (s, f, sy) => {
      const L = cands(sy).slice().sort((a, b) => String(a[C.cls]).localeCompare(String(b[C.cls]), 'ar', { numeric: true }) || String(a[C.no]).localeCompare(String(b[C.no]), 'ar', { numeric: true }));
      const rows = L.map((c, i) => tr([i + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r b' }, { t: c[C.code], c: 'ltr' }, c[C.g], { t: c[C.birth], c: 'sm' }, c[C.cls], c[C.room]]));
      return { title: 'لائحة المترشحين حسب الأقسام', sub: sub(sy), page: 'a4', sign: signHead(s),
        blocks: [{ html: `<div class="sb-cap">عدد المترشحين: ${L.length} — الإناث: ${L.filter(c => isF(c[C.g])).length}</div>` }, tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'الرقم الوطني', 'الجنس', 'تاريخ الازدياد', 'القسم', 'القاعة']), rows.length ? rows : [tr(['', '', '', '', '', '', '', { t: '', st: 'height:8mm' }])], 'cmp')] };
    }
  });
  // --- 3. timetable
  add({
    k: 'subjects', t: 'جدولة الامتحان (المواد والتوقيت)', grp: 'd', d: 'مواد الامتحان وتواريخها ومواقيتها ومعاملاتها، وتُطبع جدولة الامتحان للتعليق.', auto: 'المواد الافتراضية للمستوى', page: 'a4',
    init: (s, sy) => ({ rows: defSubj(info(sy)).map(([n, w]) => [n, '', '', '', String(w), '']) }),
    defs: () => [{ k: 'rows', l: 'المواد', t: 'grid', cols: ['المادة', 'التاريخ', 'من', 'إلى', 'المعامل', 'المسالك المعنية (فارغ = الكل)'], widths: ['1.4fr', '1fr', '.55fr', '.55fr', '.45fr', '1.2fr'], types: ['text', 'date', 'text', 'text', 'num', 'text'], dirs: [null, null, 'ltr', 'ltr', null, null] },
      { note: 'اكتب التوقيت هكذا: 08:30 . ترتيب المواد هنا هو ترتيب الحصص في جدول الحراسة والمحاضر.' }],
    build: (s, f, sy) => {
      const rows = subjects(sy).map((r, i) => tr([i + 1, { t: r[1] ? K.dayName(r[1]) : '' }, { t: MK.showDate(r[1]) }, { t: r[0], c: 'b' }, { t: r[2] ? `من ${r[2]} إلى ${r[3] || ''}` : '', c: 'ltr' }, r[4]]));
      return { title: 'جدولة الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [tbl(thr(['ر.ت', 'اليوم', 'التاريخ', 'المادة', 'التوقيت', 'المعامل']), rows, 'big'),
        { html: '<div class="sb-note">- الحضور إلى مركز الامتحان نصف ساعة على الأقل قبل انطلاق كل مادة. - يمنع منعا كليا إحضار الهاتف النقال أو أي آلة إلكترونية.</div>' }] };
    }
  });
  // --- 4. rooms
  add({
    k: 'rooms', t: 'القاعات وتوزيع أرقام الامتحان', grp: 'd', d: 'القاعات وسعتها، ثم ترقيم المترشحين وتوزيعهم آليا على القاعات (أول وآخر رقم امتحان بكل قاعة).', auto: 'لائحة المترشحين', page: 'a4',
    init: () => ({ rows: [['1', '20'], ['2', '20']] }),
    defs: () => [{ k: 'rows', l: 'القاعات', t: 'grid', cols: ['القاعة', 'السعة (عدد المترشحين)'], widths: ['1fr', '1fr'], types: ['text', 'num'] },
      { t: 'html', html: '<button type="button" class="btn sm pri" data-act="dist">ترقيم المترشحين وتوزيعهم على القاعات</button>' }, { note: 'يبدأ الترقيم من «أول رقم امتحان» المحدد في المعطيات العامة. إذا استوردت ملف GEXA فالأرقام والقاعات جاهزة ولا حاجة للتوزيع.' }],
    act: { dist: (f, sy, c) => distribute(f, sy, c) },
    build: (s, f, sy) => {
      const m = byRoom(sy); const rows = [];
      Array.from(m.keys()).sort(sortRooms).forEach(k => { const L = m.get(k); const ns = L.map(c => parseInt(c[C.no], 10)).filter(isFinite); rows.push(tr([{ t: k, c: 'b' }, ns.length ? Math.min(...ns) : '', ns.length ? Math.max(...ns) : '', L.filter(c => !isF(c[C.g])).length, L.filter(c => isF(c[C.g])).length, { t: L.length, c: 'b' }])); });
      const L = cands(sy);
      rows.push(tr([{ t: 'المجموع', c: 'b' }, '', '', L.filter(c => !isF(c[C.g])).length, L.filter(c => isF(c[C.g])).length, L.length], 'tot'));
      return { title: 'لائحة توزيع المترشحين على قاعات الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [tbl(thr(['القاعة', 'أول رقم امتحان', 'آخر رقم امتحان', 'الذكور', 'الإناث', 'المجموع']), rows, 'big')] };
    }
  });
  // --- 5. staff
  add({
    k: 'staff', t: 'طاقم مركز الامتحان', grp: 'd', d: 'أعضاء المركز ومهامهم (رئيس المركز، المراقبون، الكتابة، المداومون...)، تُملأ من لائحة الموظفين.', auto: 'لائحة الموظفين', page: 'a4',
    init: () => ({ rows: [] }),
    defs: () => [{ t: 'html', html: '<button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة كمراقبين</button>' },
      { k: 'rows', l: 'الطاقم', t: 'grid', cols: ['الاسم الكامل', 'رقم التأجير', 'الإطار / المادة', 'المهمة', 'مقر العمل', 'غير متوفر (أرقام الحصص)'], widths: ['1.3fr', '.75fr', '1.05fr', '.95fr', '.95fr', '.75fr'], list: ['k2Emps', null, null, 'exRoles', null, null], dirs: [null, 'ltr', null, null, null, 'ltr'], dls: { exRoles: ROLES },
        link: { src: 'emp', n: 0, cols: { ppr: 1, cadre: 2 } } }],
    act: { all: (f, sy, c) => { const I = info(sy); f.rows = [[I.head, '', 'مدير(ة) المؤسسة', ROLES[0], S().school || '']].concat(K.E.teachers().map(e => [fullName(e), e.ppr || '', e.subject || e.cadre || '', ROLES[1], S().school || ''])); c.save('rows'); } },
    build: (s, f, sy) => {
      const rows = staff(sy).map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, r[1], { t: r[2], c: 'sm' }, { t: r[3], c: 'sm' }, { t: r[4], c: 'sm' }, '']));
      return { title: 'لائحة طاقم مركز الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الإطار / المادة', 'المهمة', 'مقر العمل', 'التوقيع']), rows.length ? rows : [tr(['', '', '', '', '', '', { t: '', st: 'height:8mm' }])], 'cmp')] };
    }
  });
  // --- 6. invigilation
  add({
    k: 'guards', t: 'توزيع المراقبين على القاعات (جدول الحراسة)', grp: 'd', d: 'توزيع آلي متوازن لمراقبين اثنين بكل قاعة وفي كل حصة مع الاحتياط، قابل للتعديل، وجدول الحراسة للتعليق.', auto: 'الجدولة والقاعات وطاقم المركز', page: 'a4l',
    init: () => ({ reserve: '1', rows: [] }),
    defs: (f, sy) => [{ k: 'reserve', l: 'عدد الاحتياطيين في كل حصة', t: 'num', half: true }, { t: 'html', half: true, html: '<label>&nbsp;</label><button type="button" class="btn sm pri" data-act="gen">توزيع المراقبين آليا</button>' },
      { note: `الحصص: ${subjects(sy).map((r, i) => `${i + 1}) ${esc(r[0])}`).join(' — ') || 'أدخل جدولة الامتحان أولا'}` },
      { k: 'rows', l: 'التوزيع (رقم الحصة، القاعة، المراقبون)', t: 'grid', cols: ['الحصة', 'القاعة', 'المراقب(ة) 1', 'المراقب(ة) 2', 'ملاحظة'], widths: ['.45fr', '.6fr', '1.3fr', '1.3fr', '.8fr'], list: [null, null, 'k2Emps', 'k2Emps', null] }],
    act: { gen: (f, sy, c) => guards(f, sy, c) },
    build: (s, f, sy) => {
      const G = guardRows(sy), ss = subjects(sy);
      const blocks = [];
      ss.forEach((sj, si) => {
        const L = G.filter(r => +r[0] === si + 1); if (!L.length) return;
        blocks.push({ before: SB.cap(`الحصة ${si + 1}: ${esc(sj[0])} — ${esc(sessLabel(sj))}`, 'r'), table: { cls: 'sb-t cmp', head: thr(['القاعة', 'المراقب(ة) الأول(ى)', 'المراقب(ة) الثاني(ة)', 'ملاحظة']), rows: L.map(r => tr([{ t: r[1], c: 'b' }, r[2], r[3], { t: r[4], c: 'sm' }])) } });
      });
      if (!blocks.length) blocks.push({ html: '<p class="sb-p">اضغط «توزيع المراقبين آليا» بعد إدخال الجدولة والقاعات وطاقم المركز.</p>' });
      return { title: 'جدول توزيع المراقبين على قاعات الامتحان', sub: sub(sy), page: 'a4l', sign: signHead(s), blocks };
    }
  });
  // --- 7. marks
  add({
    k: 'marks', t: 'النقط والنتائج (محضر المداولات)', grp: 'd', d: 'إدخال معدل المراقبة المستمرة ونقط مواد الامتحان، واحتساب المعدل العام والنتيجة والميزة، ومحضر النتائج.', auto: 'لائحة المترشحين والمواد', page: 'a4l',
    init: () => ({ rows: [] }),
    defs: (f, sy) => {
      const ss = subjects(sy);
      return [{ t: 'html', html: '<button type="button" class="btn sm pri" data-act="sync">ملء الجدول بلائحة المترشحين</button>' },
        { note: `النقط من ${esc(info(sy).max)}. الأعمدة: رقم الامتحان، الاسم، معدل المراقبة المستمرة، ثم المواد بنفس ترتيب الجدولة.` },
        { k: 'rows', l: 'النقط', t: 'grid', cols: ['رقم', 'الاسم', 'م.المستمرة'].concat(ss.map(r => r[0])).concat(hasLoc(info(sy)) ? [info(sy).type === 'nat' ? 'م.الامتحان الجهوي (1 باك)' : 'م.الامتحان المحلي'] : []), widths: ['.5fr', '1.4fr', '.55fr'].concat(ss.map(() => '.5fr')).concat(info(sy).type === 'reg' ? ['.6fr'] : []), types: ['ro', 'ro', 'num'].concat(ss.map(() => 'num')).concat(info(sy).type === 'reg' ? ['num'] : []), fixed: true }];
    },
    act: { sync: (f, sy, c) => { const old = f.rows || []; f.rows = cands(sy).map(cd => { const o = old.find(r => nm(r[0]) === nm(cd[C.no]) && nm(r[0])) || old.find(r => nm(r[1]) === nm(cd[C.name])) || []; return [cd[C.no], cd[C.name]].concat(subjects(sy).map((x, i) => '').concat(['', '']).map((x, i) => o[2 + i] || '')); }); c.save('rows'); } },
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), R = results(sy), mx = num(I.max) || 10;
      const rows = R.slice().sort((a, b) => (b.fin == null ? -1 : b.fin) - (a.fin == null ? -1 : a.fin)).map((r, i) => tr([i + 1, { t: r.c[C.no], c: 'b' }, { t: r.c[C.name], c: 'r b' }, f2(r.cc)].concat(I.type === 'reg' ? [f2(r.loc)] : []).concat(r.marks.map(v => f2(v))).concat([{ t: f2(r.ex), c: 'b' }, { t: f2(r.fin), c: 'b' }, { t: r.fin == null ? '' : r.ok ? 'ناجح(ة)' : 'غير ناجح(ة)', c: r.ok ? 'b' : '' }, { t: r.ok ? mention(r.fin, mx) : '', c: 'sm' }])));
      const ok = R.filter(r => r.ok), fem = R.filter(r => isF(r.c[C.g]));
      return { title: 'محضر المداولات ونتائج الامتحان', sub: sub(sy), page: 'a4l', sign: SB.sign(s, { three: ['أعضاء لجنة المداولات', '', 'خاتم وتوقيع رئيس(ة) مركز الامتحان'] }), blocks: [
        { html: `<div class="sb-cap">المترشحون: ${R.length} — الناجحون: ${ok.length} (${K.pct(ok.length, R.length, 1)}) — الإناث الناجحات: ${ok.filter(r => isF(r.c[C.g])).length} من ${fem.length} — المعدل العام = (المراقبة المستمرة × ${esc(I.wcc)}%${I.type === 'reg' ? ` + الامتحان المحلي × ${esc(I.wloc)}%` : ''} + الامتحان × ${esc(I.wex)}%)</div>` },
        tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'م.المستمرة'].concat(hasLoc(I) ? [I.type === 'nat' ? 'م.الجهوي' : 'م.المحلي'] : []).concat(ss.map(r => r[0])).concat(['معدل الامتحان', 'المعدل العام', 'النتيجة', 'الميزة'])), rows.length ? rows : [tr(new Array(8 + ss.length + (I.type === 'reg' ? 1 : 0)).fill(''))], 'cmp')] };
    }
  });

  /* ---------- the documents of the centre ---------- */
  const roomPages = (s, sy, title, bodyOf, o) => {
    const m = byRoom(sy); const keys = Array.from(m.keys()).sort(sortRooms);
    const pages = [];
    (keys.length ? keys : ['—']).forEach(k => {
      const P = MK.flowPages({ page: (o && o.page) || 'a4', cls: 'sb', head: SB.head(s, title, `${sub(sy)}<br>القاعة: ${esc(k)} — عدد المترشحين: ${(m.get(k) || []).length}`), blocks: bodyOf(k, m.get(k) || []) });
      P.forEach((p, i) => pages.push(i ? p : pb(p)));
    });
    return { page: (o && o.page) || 'a4', pages };
  };
  add({ k: 'ex_byroom', t: 'لوائح المترشحين حسب القاعات (للتعليق)', grp: 'o', d: 'لائحة لكل قاعة بأرقام الامتحان والأسماء، تُعلق على باب القاعة.', auto: 'لائحة المترشحين والقاعات', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => roomPages(s, sy, 'لائحة المترشحين حسب قاعات الامتحان', (k, L) => [tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'الرقم الوطني', 'تاريخ الازدياد']), L.map((c, i) => tr([i + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r b' }, { t: c[C.code], c: 'ltr' }, c[C.birth]])), 'big'), SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان' })]) });
  add({ k: 'ex_sign', t: 'محضر توقيعات المترشحين (لكل قاعة ومادة)', grp: 'o', d: 'ورقة توقيع المترشحين عند تسليم أوراق التحرير، مع توقيعات المراقبين.', auto: 'المترشحون، القاعات، الجدولة', page: 'a4',
    init: () => ({ subj: '1' }), defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: [['all', 'كل المواد (صفحة لكل قاعة ومادة)']].concat(subjects(sy).map((r, i) => [String(i + 1), r[0]])) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), idx = f.subj === 'all' ? ss.map((x, i) => i) : [(parseInt(f.subj, 10) || 1) - 1];
      const pages = [];
      idx.forEach(i => { const sj = ss[i] || ['', '', '', '', '']; const r = roomPages(s, sy, 'محضر توقيعات المترشحين', (k, L) => [{ html: `<div class="sb-cap">المادة: ${esc(sj[0])} — ${esc(sessLabel(sj))}</div>` },
        tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'الرقم الوطني', 'التوقيع']), L.map((c, j) => tr([j + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r b' }, { t: c[C.code], c: 'ltr' }, { t: '', st: 'width:30%' }])), 'big'),
        { html: '<div class="sb-note">ملاحظة: لا يمكن السماح للمترشح بالتوقيع إلا بعد انتهائه من الاختبار، أي عند تسليم ورقة تحريره للمراقب الذي يتأكد من تطابق المعلومات.</div>' }, SB.sign(s, { three: ['المراقب(ة) الأول(ى): الاسم والتوقيع', 'المراقب(ة) الثاني(ة): الاسم والتوقيع', 'خاتم رئيس(ة) المركز'] })]); pages.push(...r.pages); });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_convoc', t: 'استدعاءات المترشحين', grp: 'o', d: 'استدعاء فردي لكل مترشح(ة): رقم الامتحان، القاعة، مواقيت المواد والتوجيهات العامة (3 استدعاءات في الصفحة).', auto: 'المترشحون والجدولة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), L = cands(sy);
      const one = c => `<div class="ex-cv"><div class="ex-cv-h"><b>${esc(s.directorate || '')}</b><span>${esc(examTitle(I))} — دورة ${esc(I.session)}</span><b>استدعاء</b></div>
        <div class="ex-cv-g"><div>الاسم والنسب: <b>${esc(c[C.name])}</b></div><div>رقم الامتحان: <b class="big">${esc(c[C.no] || '....')}</b></div><div>الرقم الوطني: <b dir="ltr">${esc(c[C.code])}</b></div><div>تاريخ الازدياد: ${esc(c[C.birth])}</div><div>مركز الامتحان: <b>${esc(I.center)}</b></div><div>القاعة: <b class="big">${esc(c[C.room] || '...')}</b></div></div>
        <table class="ex-cv-t"><tr>${ss.map(r => `<th>${esc(r[0])}</th>`).join('')}</tr><tr>${ss.map(r => `<td>${esc(r[1] ? K.dayName(r[1]) + ' ' + MK.showDate(r[1]) : '')}<br><span dir="ltr">${esc(r[2] || '')}${r[3] ? ' - ' + esc(r[3]) : ''}</span></td>`).join('')}</tr></table>
        <div class="ex-cv-n">- الحضور إلى مركز الامتحان نصف ساعة على الأقل قبل الوقت المخصص مصحوبا بهذا الاستدعاء. - لا يسمح بالدخول إلى القاعة بعد توزيع المواضيع. - كل مترشح ضبط يحمل هاتفا نقالا أو آلة إلكترونية يعتبر غاشا ولو لم تكن مشغلة. - كل من ثبت في حقه الغش يعاقب طبقا للقوانين الجاري بها العمل.</div>
        <div class="ex-cv-s">خاتم وتوقيع رئيس(ة) مركز الامتحان</div></div>`;
      const pages = []; const list = L.length ? L : [['', '', '', '', '', '', '', '']];
      for (let i = 0; i < list.length; i += 3) pages.push(`<div class="mk-hdr">${Dx.header(s)}</div>${list.slice(i, i + 3).map(one).join('')}`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_labels', t: 'ملصقات ترقيم الطاولات والقاعات', grp: 'o', d: 'ملصق لكل طاولة (رقم الامتحان والاسم والقاعة) — 12 في الصفحة — وملصق كبير لكل قاعة.', auto: 'المترشحون والقاعات', page: 'a4', init: () => ({ kind: 'desk' }),
    defs: () => [{ k: 'kind', l: 'النوع', t: 'select', opts: [['desk', 'ملصقات الطاولات'], ['room', 'ملصقات القاعات']] }],
    build: (s, f, sy) => {
      const I = info(sy);
      if (f.kind === 'room') { const m = byRoom(sy); return { page: 'a4l', pages: Array.from(m.keys()).sort(sortRooms).map((k, i) => { const L = m.get(k); const ns = L.map(c => parseInt(c[C.no], 10)).filter(isFinite); return `${i ? '<div class="docx-pb"></div>' : ''}<div class="mk-hdr">${Dx.header(s)}</div><div class="ex-room"><div class="t">قاعة الامتحان</div><div class="n">${esc(k)}</div><div class="r">أرقام الامتحان: من <b>${ns.length ? Math.min(...ns) : '...'}</b> إلى <b>${ns.length ? Math.max(...ns) : '...'}</b> — عدد المترشحين: ${L.length}</div><div class="r">${esc(examTitle(I))} — دورة ${esc(I.session)}</div></div>`; }) }; }
      const L = cands(sy), pages = [];
      for (let i = 0; i < Math.max(1, L.length); i += 12) pages.push(`<div class="ex-lb">${L.slice(i, i + 12).map(c => `<div><div class="no">${esc(c[C.no])}</div><div class="nm">${esc(c[C.name])}</div><div class="rm">القاعة ${esc(c[C.room])} — ${esc(I.center)}</div></div>`).join('')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_absent', t: 'محضر ضبط غياب المترشحين', grp: 'o', d: 'لكل مادة: عدد المترشحين والغائبين بكل قاعة وأرقام امتحان المتغيبين.', auto: 'القاعات والجدولة', page: 'a4', init: () => ({ subj: 'all' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: [['all', 'كل المواد']].concat(subjects(sy).map((r, i) => [String(i + 1), r[0]])) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), m = byRoom(sy), keys = Array.from(m.keys()).sort(sortRooms);
      const idx = f.subj === 'all' ? ss.map((x, i) => i) : [(parseInt(f.subj, 10) || 1) - 1];
      const blocks = [];
      idx.forEach(i => { const sj = ss[i] || ['']; blocks.push({ before: SB.cap(`المادة: ${esc(sj[0] || '')} — ${esc(sessLabel(sj))}`, 'r'), table: { cls: 'sb-t', head: thr(['القاعة', 'أول رقم', 'آخر رقم', 'عدد المترشحين', 'عدد الغائبين', 'أرقام امتحان المتغيبين']), rows: keys.map(k => { const L = m.get(k), ns = L.map(c => parseInt(c[C.no], 10)).filter(isFinite); return tr([{ t: k, c: 'b' }, ns.length ? Math.min(...ns) : '', ns.length ? Math.max(...ns) : '', L.length, '', { t: '', st: 'width:34%' }]); }) } }); });
      return { title: 'محضر ضبط غياب المترشحين', sub: sub(sy), page: 'a4', sign: signHead(s), blocks };
    } });
  /* ---------- 1.9.4: documents of the regional exam of the collège (model of the centres: technical sheet, covers of the room files, rules poster,
     minutes of closing / opening the envelopes, handover of the exam papers, collective absence sheet, follow-up of the absences) ---------- */
  const rng = L => { const ns = L.map(c => parseInt(c[C.no], 10)).filter(isFinite); return ns.length ? [Math.min(...ns), Math.max(...ns)] : ['', '']; };
  const subjOpts = sy => [['all', 'كل المواد (صفحة لكل مادة)']].concat(subjects(sy).map((r, i) => [String(i + 1), r[0]]));
  const subjIdx = (f, sy) => { const ss = subjects(sy); return f.subj === 'all' || !f.subj ? (ss.length ? ss.map((x, i) => i) : [0]) : [(parseInt(f.subj, 10) || 1) - 1]; };
  const sjDate = sj => (sj[1] ? K.dayName(sj[1]) + ' ' + MK.showDate(sj[1]) : '....................');
  const gCount = L => { let m = 0, w = 0; L.forEach(c => (isF(c[C.g]) ? w++ : m++)); return { m, w, t: m + w }; };
  add({ k: 'ex_tech', t: 'البطاقة التقنية لمركز الامتحان', grp: 'o', d: 'توزيع المترشحين حسب الجنس، وعلى القاعات (من رقم إلى رقم، ذكور / إناث)، وحسب المؤسسة الأصلية والأقسام، مع جدولة الامتحان.', auto: 'المترشحون، القاعات، الجدولة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), L = cands(sy), m = byRoom(sy), keys = Array.from(m.keys()).sort(sortRooms), g = gCount(L);
      const grp = key => { const mm = new Map(); L.forEach(c => { const k = nm(c[key]) || '—'; if (!mm.has(k)) mm.set(k, []); mm.get(k).push(c); }); return Array.from(mm.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'ar', { numeric: true })); };
      const cls = grp(C.cls), org = grp(C.origin);
      return { title: 'البطاقة التقنية لمركز الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        kv([['مركز الامتحان', I.center], ['الرمز', I.code], ['رئيس(ة) المركز', I.head], ['الدورة', I.session], ['عدد القاعات', keys.length], ['عدد الأقسام', cls.length]]),
        { before: SB.cap('توزيع مجموع المترشحين حسب الجنس', 'r'), table: { cls: 'sb-t big', head: thr(['الذكور', 'الإناث', 'المجموع', 'نسبة الإناث']), rows: [tr([g.m, g.w, { t: g.t, c: 'b' }, g.t ? Math.round(g.w / g.t * 1000) / 10 + '%' : ''])] } },
        { before: SB.cap('توزيع المترشحين على القاعات حسب أرقام الامتحان', 'r'), table: { cls: 'sb-t', head: thr(['القاعة', 'من', 'إلى', 'ذكور', 'إناث', 'المجموع']), rows: keys.map(k => { const X = m.get(k), r = rng(X), q = gCount(X); return tr([{ t: k, c: 'b' }, r[0], r[1], q.m, q.w, { t: q.t, c: 'b' }]); }).concat([`<tr class="tot"><td>المجموع</td><td></td><td></td><td>${g.m}</td><td>${g.w}</td><td>${g.t}</td></tr>`]) } },
        org.length > 1 || (org[0] && org[0][0] !== '—') ? { before: SB.cap('توزيع المترشحين حسب المؤسسة الأصلية', 'r'), table: { cls: 'sb-t', head: thr(['المؤسسة الأصلية', 'ذكور', 'إناث', 'المجموع']), rows: org.map(([k, X]) => { const q = gCount(X); return tr([{ t: k, c: 'r b' }, q.m, q.w, { t: q.t, c: 'b' }]); }) } } : null,
        cls.length ? { before: SB.cap('توزيع المترشحين حسب الأقسام', 'r'), table: { cls: 'sb-t', head: thr(['القسم', 'ذكور', 'إناث', 'المجموع']), rows: cls.map(([k, X]) => { const q = gCount(X); return tr([{ t: k, c: 'b' }, q.m, q.w, { t: q.t, c: 'b' }]); }) } } : null,
        { before: SB.cap('جدولة الامتحان', 'r'), table: { cls: 'sb-t', head: thr(['التاريخ', 'المادة', 'من الساعة', 'إلى الساعة']), rows: subjects(sy).map(r => tr([sjDate(r), { t: r[0], c: 'b' }, { t: r[2], c: 'ltr' }, { t: r[3], c: 'ltr' }])) } }].filter(Boolean) };
    } });
  add({ k: 'ex_covers', t: 'واجهات ملفات القاعات', grp: 'o', d: 'واجهة ملف (غلاف) لكل قاعة: المركز، الامتحان، الدورة، رقم القاعة، عدد المترشحين وأرقامهم من … إلى … (واجهتان في الصفحة).', auto: 'المترشحون والقاعات', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), m = byRoom(sy), keys = Array.from(m.keys()).sort(sortRooms);
      const one = k => { const L = m.get(k) || [], r = rng(L); return `<div class="ex-cov"><div class="h">${esc(s.directorate || '')}<br><b>${esc(I.center)}</b></div><div class="t">${esc(examTitle(I))}</div><div class="d">دورة ${esc(I.session)}</div>
        <div class="rm"><span>الـقـاعـة</span><b>${esc(k)}</b></div><div class="g"><div>عدد المترشحين: <b>${L.length}</b></div><div>أرقامهم من: <b>${r[0]}</b> إلى: <b>${r[1]}</b></div></div></div>`; };
      const pages = []; const K2 = keys.length ? keys : ['—'];
      for (let i = 0; i < K2.length; i += 2) pages.push(`<div class="ex-covs">${K2.slice(i, i + 2).map(one).join('<div class="ex-cut"></div>')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_rules', t: 'ملصق التوجيهات الهامة ومحاربة الغش', grp: 'o', d: 'ملصق يعلق بالقاعات والممرات: الحضور نصف ساعة قبل الموعد، اللوازم، منع الآلات الرقمية، عقوبات الغش.', auto: 'المعطيات العامة', page: 'a4', init: () => ({ extra: '' }),
    defs: () => [{ k: 'extra', l: 'توجيهات إضافية (سطر لكل توجيه)', t: 'area', rows: 3 }],
    build: (s, f, sy) => {
      const I = info(sy);
      const R0 = ['الحضور إلى مركز الامتحان نصف ساعة قبل موعد انطلاق الاختبار في كل مادة.', 'كل تأخر يتحمل المترشح(ة) وحده عواقبه، ولا يسمح بالدخول بعد توزيع المواضيع.', 'ضرورة إحضار الاستدعاء وبطاقة التعريف وجميع اللوازم الخاصة باجتياز الامتحان.', 'يمنع منعا كليا إحضار أو استعمال الهواتف المحمولة والآلات الرقمية ولو كانت غير مشغلة.', 'يمنع تبادل الأدوات أو التواصل بين المترشحين داخل القاعة.', 'لا يسمح بمغادرة القاعة قبل انصرام نصف المدة المخصصة للاختبار.'].concat(String(f.extra || '').split(/\n/).map(nm).filter(Boolean));
      return { page: 'a4', pages: [`<div class="mk-hdr">${Dx.header(s)}</div><div class="ex-rules"><div class="e">${esc(examTitle(I))} — دورة ${esc(I.session)}</div><div class="t">توجيهات هامة</div><div class="w">على المترشحات والمترشحين الالتزام بما يلي:</div>
        <ul>${R0.map(x => `<li>${esc(x)}</li>`).join('')}</ul><div class="f">⚠ كل مترشح(ة) ضبط في حالة غش ستطبق في حقه القوانين الجاري بها العمل<br><small>(القانون رقم 02.13 المتعلق بزجر الغش في الامتحانات المدرسية)</small></div></div>`] };
    } });
  const envPV = open => ({ k: open ? 'ex_envopen' : 'ex_envclose', t: open ? 'محضر فتح أظرفة موضوع الامتحان' : 'محضر إغلاق أظرفة أوراق التحرير', grp: 'p', d: open ? 'لكل مادة: تاريخ وتوقيت الحصة، عدد الأظرفة المفتوحة وساعة الفتح، أعضاء اللجنة وتوقيعاتهم، ملاحظات الأستاذ(ة) المداوم(ة).' : 'لكل مادة: عدد أظرفة أوراق التحرير المغلقة وساعة الإغلاق، أعضاء اللجنة وتوقيعاتهم والملاحظات.', auto: 'الجدولة وطاقم المركز', page: 'a4', init: () => ({ subj: 'all' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), St = staff(sy), pages = [];
      const com = [St.find(r => /رئيس/.test(r[3]))].concat(St.filter(r => /الكتابة|ملاحظ/.test(r[3]))).filter(Boolean).slice(0, 6);
      subjIdx(f, sy).forEach(i => {
        const sj = ss[i] || ['', '', '', '', ''];
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, open ? 'محضر فتح أظرفة موضوع مادة الامتحان' : 'محضر إغلاق أظرفة أوراق التحرير', sub(sy)), blocks: [
          { html: `<div class="sb-pv"><p>المـادة: <b>${esc(sj[0] || '....................')}</b> &nbsp;&nbsp; التاريخ: <b>${esc(sjDate(sj))}</b>${open ? ` &nbsp;&nbsp; توقيت الحصة: <b dir="ltr">${esc(sj[2] || '.....')} - ${esc(sj[3] || '.....')}</b>` : ''}</p>
            <p>${open ? 'تم فتح أظرفة موضوع الامتحان وعددها' : 'تم إغلاق وتوقيع أظرفة أوراق التحرير وعددها'}: .................. على الساعة: ..................</p><p>بحضور أعضاء اللجنة المكونة من السيدات والسادة:</p></div>` },
          tbl(thr(['ر.ت', 'الاسم والنسب', 'رقم التأجير', 'الصفة', 'التوقيع']), Array.from({ length: 6 }, (x, j) => { const r = com[j] || []; return tr([j + 1, { t: r[0] || '', c: 'r b' }, r[1] || '', r[3] || '', { t: '', st: 'width:24%' }]); }), 'big'),
          { html: `<div class="vs-box ex-box"><div class="vs-bt">ملاحظات عامة</div><div class="vs-bb" style="min-height:24mm"></div></div>${open ? '<div class="vs-box ex-box"><div class="vs-bt">ملاحظات الأستاذ(ة) المداوم(ة)</div><div class="vs-bb" style="min-height:16mm"></div></div>' : ''}` },
          open ? SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان', right: 'اسم وتوقيع الأستاذ(ة) المداوم(ة)' }) : signHead(s)] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p)));
      });
      return { page: 'a4', pages };
    } });
  add(envPV(false)); add(envPV(true));
  add({ k: 'ex_handover', t: 'لائحة تسليم أوراق الامتحان (لكل مادة)', grp: 'p', d: 'لكل قاعة: عدد المترشحين، عدد الأوراق المسلمة، عدد الغائبين وأرقامهم، وتوقيع المراقبين (أسماؤهم من جدول الحراسة).', auto: 'القاعات وجدول الحراسة', page: 'a4', init: () => ({ subj: 'all' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), m = byRoom(sy), keys = Array.from(m.keys()).sort(sortRooms), G = guardRows(sy), pages = [];
      subjIdx(f, sy).forEach(i => {
        const sj = ss[i] || ['', '', '', '', ''];
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'لائحة تسليم أوراق الامتحان', `${sub(sy)}<br>المادة: ${esc(sj[0] || '..........')} — ${esc(sessLabel(sj))}`), blocks: [
          tbl(thr(['القاعة', 'عدد المترشحين', 'عدد الأوراق المسلمة', 'عدد الغائبين', 'أرقامهم', 'المراقب(ة) 1 والتوقيع', 'المراقب(ة) 2 والتوقيع']), keys.map(k => { const g = G.find(r => +r[0] === i + 1 && nm(r[1]) === k) || []; return tr([{ t: k, c: 'b' }, (m.get(k) || []).length, '', '', { t: '', st: 'width:16%' }, { t: g[2] || '', c: 'sm' }, { t: g[3] || '', c: 'sm' }]); }), 'big'),
          SB.sign(s, { left: 'توقيع رئيس(ة) المركز', right: 'المسؤول(ة) عن الكتابة' })] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p)));
      });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_absgrid', t: 'ورقة التغيبات الجماعية (لكل قاعة)', grp: 'o', d: 'لائحة التوقيع ومراقبة حضور وغياب المترشحين لكل قاعة: رقم الامتحان والاسم وخانة لكل مادة.', auto: 'المترشحون، القاعات، الجدولة', page: 'a4l', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const ss = subjects(sy);
      return roomPages(s, sy, 'لائحة التوقيع ومراقبة حضور وغياب المترشحين', (k, L) => [tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل'].concat(ss.map(r => r[0]))), L.map((c, j) => tr([j + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r b nw' }].concat(ss.map(() => '')))), 'cmp'),
        SB.sign(s, { left: 'توقيع رئيس(ة) المركز', right: 'توقيع المسؤول(ة) عن الكتابة' })], { page: 'a4l' });
    } });
  add({ k: 'ex_abstrack', t: 'تتبع غياب المترشحين حسب القسم والمادة', grp: 'o', d: 'جدول تجميعي: لكل قسم (أو مؤسسة أصلية) عدد المترشحين وعدد الغائبين في كل مادة.', auto: 'المترشحون والجدولة', page: 'a4l', init: () => ({ by: 'cls' }),
    defs: () => [{ k: 'by', l: 'حسب', t: 'select', opts: [['cls', 'القسم'], ['origin', 'المؤسسة الأصلية']] }],
    build: (s, f, sy) => {
      const ss = subjects(sy), key = f.by === 'origin' ? C.origin : C.cls, mm = new Map();
      cands(sy).forEach(c => { const k = nm(c[key]) || '—'; mm.set(k, (mm.get(k) || 0) + 1); });
      const rows = Array.from(mm.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'ar', { numeric: true })).map(([k, n]) => tr([{ t: k, c: 'b' }, n].concat(ss.map(() => ''))));
      rows.push(`<tr class="tot"><td>المجموع</td><td>${cands(sy).length}</td>${ss.map(() => '<td></td>').join('')}</tr>`);
      return { title: 'تتبع غياب المترشحين', sub: sub(sy), page: 'a4l', sign: SB.sign(s, { left: 'توقيع رئيس(ة) المركز', right: 'توقيع المسؤول(ة) عن الكتابة' }), blocks: [tbl(thr([f.by === 'origin' ? 'المؤسسة الأصلية' : 'القسم', 'عدد المترشحين'].concat(ss.map(r => r[0]))), rows, 'big')] };
    } });
  add({ k: 'ex_guardpv', t: 'محضر حراسة الامتحان (لكل قاعة)', grp: 'o', d: 'محضر سير الاختبار بكل قاعة: المادة، التوقيت، المراقبون، عدد المترشحين والمتغيبين والأحداث.', auto: 'جدول الحراسة', page: 'a4', init: () => ({ subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjects(sy).map((r, i) => [String(i + 1), r[0]]).concat([['all', 'كل المواد']]) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), idx = f.subj === 'all' ? ss.map((x, i) => i) : [(parseInt(f.subj, 10) || 1) - 1], G = guardRows(sy), m = byRoom(sy);
      const pages = [];
      idx.forEach(i => Array.from(m.keys()).sort(sortRooms).forEach(k => {
        const sj = ss[i] || ['', '', '', '', '']; const g = G.find(r => +r[0] === i + 1 && nm(r[1]) === k) || [];
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'محضر حراسة الامتحان', sub(sy)), blocks: [
          { html: `<div class="sb-pv"><p>لقد تم إجراء اختبار مادة: <b>${esc(sj[0])}</b> يوم ${esc(sj[1] ? K.dayName(sj[1]) + ' ' + MK.showDate(sj[1]) : '..........')} ابتداء من الساعة: <b dir="ltr">${esc(sj[2] || '.....')}</b> إلى الساعة: <b dir="ltr">${esc(sj[3] || '.....')}</b></p>
            <p>بالقاعة: <b>${esc(k)}</b> تحت مراقبة السيدين(تين): <b>${esc(dots(g[2]))}</b> و <b>${esc(dots(g[3]))}</b></p>
            <p>عدد المترشحين بالقاعة: <b>${(m.get(k) || []).length}</b> — عدد الحاضرين: .......... — عدد المتغيبين: ..........</p><p>وتخلف المترشحون الآتية أرقامهم: ........................................................................</p>
            <p>تنبيه هام: ينبغي الإشارة إلى كل حدث وقع خلال إجراء الاختبار: ......................................................................................................................................................</p></div>` },
          SB.sign(s, { three: ['المراقب(ة) الأول(ى)', 'المراقب(ة) الثاني(ة)', 'إمضاء رئيس(ة) المركز'] })] });
        P.forEach((p, j) => pages.push(j ? p : pb(p)));
      }));
      return { page: 'a4', pages: pages.length ? pages : [''] };
    } });
  add({ k: 'ex_assign', t: 'تكليف بمهمة مراقبة الإجراء (لكل مراقب)', grp: 'o', d: 'رسالة تكليف فردية لكل عضو من الطاقم مع جدول حصصه (التاريخ، المادة، التوقيت، القاعة).', auto: 'جدول الحراسة وطاقم المركز', page: 'a4', init: () => ({ who: '', ref: 'المقرر الوزاري بشأن دفتر مساطر الامتحانات' }),
    defs: (f, sy) => [{ k: 'who', l: 'العضو', t: 'select', opts: [['', 'كل أعضاء الطاقم (رسالة لكل واحد)']].concat(staff(sy).map(r => [r[0], r[0]])) }, { k: 'ref', l: 'المرجع' }],
    build: (s, f, sy) => {
      const I = info(sy), G = guardRows(sy), ss = subjects(sy);
      const L = staff(sy).filter(r => !f.who || r[0] === f.who);
      const pages = [];
      (L.length ? L : [['', '', '', ROLES[1], '']]).forEach((r, i) => {
        const mine = G.filter(g => g[2] === r[0] || g[3] === r[0]);
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: `<div class="mk-hdr">${Dx.header(s)}</div>`, blocks: [
          { html: `<div class="sb-pv"><p style="text-align:left">${esc(s.city || '')} في: ${esc(K.ldate(Dx.todayIso()))}</p><p style="text-align:center"><b>من السيد(ة) رئيس(ة) مركز الامتحان:</b> ${esc(I.head || '')}</p><p style="text-align:center"><b>إلى السيد(ة):</b> ${esc(dots(r[0], 30))} — رقم التأجير: ${esc(dots(r[1], 10))}</p>
            <p><b>الموضوع:</b> تكليف بمهمة ${esc(nm(r[3]) || 'مراقبة الإجراء')}.</p><p><b>المرجع:</b> ${esc(f.ref || '')}.</p><p style="text-align:center"><b>سلام تام بوجود مولانا الإمام دام له النصر والتأييد</b></p>
            <p>وبعد، فعلاقة بالموضوع والمرجع المشار إليه أعلاه، يشرفني إخباركم أنه تقرر تكليفكم بمهمة <b>${esc(nm(r[3]) || 'مراقبة الإجراء')}</b> خلال فترة ${esc(examTitle(I))}، دورة ${esc(I.session)}، بمركز الامتحان <b>${esc(I.center)}</b>، لذا يتعين عليكم الالتحاق بمركز الامتحان وفق الجدولة التالية:</p></div>` },
          tbl(thr(['التاريخ', 'المادة', 'التوقيت', 'القاعة', 'الدور']), mine.length ? mine.map(g => { const sj = sessOf(sy, g[0]); return tr([MK.showDate(sj[1]), { t: sj[0], c: 'b' }, { t: `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`, c: 'ltr' }, g[1], g[2] === r[0] ? 'مراقب(ة) أول(ى)' : g[1] === 'احتياط' ? 'احتياط' : 'مراقب(ة) ثان(ية)']); }) : ss.map(sj => tr([MK.showDate(sj[1]), { t: sj[0], c: 'b' }, { t: `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`, c: 'ltr' }, '', ''])), 'big'),
          { html: '<div class="sb-note">(*) يجب الحضور إلى مركز الامتحان نصف ساعة على الأقل قبل الوقت المخصص. (*) لا يسمح بالهاتف النقال داخل قاعة الامتحان بعد توزيع المواضيع.</div>' },
          { html: '<p class="sb-p" style="text-align:center">والسلام.</p>' }, SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان' })] });
        P.forEach((p, j) => pages.push(j || !i ? p : pb(p)));
      });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_gstats', t: 'إحصائيات حصص المراقبة', grp: 'o', d: 'عدد الحصص لكل مراقب(ة): أساسي واحتياط، صباحا ومساء.', auto: 'جدول الحراسة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const G = guardRows(sy);
      const am = g => { const t = nm(sessOf(sy, g[0])[2]); const h = parseInt(t, 10); return !t || h < 13; };
      const rows = staff(sy).map((r, i) => { const mine = G.filter(g => g[2] === r[0] || g[3] === r[0]); const res = mine.filter(g => g[1] === 'احتياط'), base = mine.filter(g => g[1] !== 'احتياط');
        return tr([i + 1, { t: r[0], c: 'r b' }, r[1], base.filter(am).length, res.filter(am).length, base.filter(g => !am(g)).length, res.filter(g => !am(g)).length, { t: mine.length, c: 'b' }]); });
      return { title: 'إحصائيات لعدد حصص المراقبة', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [tbl(`<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">الأستاذ(ة)</th><th rowspan="2" class="d">رقم التأجير</th><th colspan="2" class="d">صباحا</th><th colspan="2" class="d">مساء</th><th rowspan="2" class="d">إجمالي الحراسات</th></tr><tr><th class="d">أساسي</th><th class="d">احتياطي</th><th class="d">أساسي</th><th class="d">احتياطي</th></tr>`, rows, 'cmp')] };
    } });
  /* ---------- 1.9.4: census of the invigilation hours and lists of the secretariat of the exam centre and of the correction centre (model of the directorate) ---------- */
  const tMin = t => { const m = /(\d{1,2})\s*[:hHس.]\s*(?:د\s*)?(\d{0,2})/.exec(nm(t)); return m ? +m[1] * 60 + (+m[2] || 0) : null; };
  const sessH = sj => { const a = tMin(sj[2]), b = tMin(sj[3]); return a != null && b != null && b > a ? (b - a) / 60 : 0; };
  const empOf = n => (K.E && K.E.byName ? K.E.byName(n) : null) || {};
  const fmtH = h => (Math.round(h * 100) / 100).toString().replace('.', ',');
  add({ k: 'ex_ghours', t: 'إحصاء ساعات الحراسة (مراقبو الإجراء)', grp: 'o', d: 'لكل مراقب(ة): رقم التأجير، رقم البطاقة الوطنية، المؤسسة الأصلية، مادة التدريس، عدد ساعات الحراسة (من جدول الحراسة ومواقيت المواد)، المداومة، ملاحظات — على نموذج المديرية.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4l', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), G = guardRows(sy);
      const L = staff(sy).filter(r => /مراقب|مداوم|ملاحظ/.test(r[3] || 'مراقب'));
      const rows = L.map((r, i) => {
        const e = empOf(r[0]), mine = G.filter(g => g[2] === r[0] || g[3] === r[0]), h = mine.reduce((t, g) => t + sessH(sessOf(sy, g[0])), 0);
        return tr([i + 1, { t: r[0], c: 'r b' }, r[1] || e.ppr || '', { t: e.cin || '', c: 'ltr' }, { t: r[4] || e.origin || s.school || '', c: 'sm' }, { t: e.subject || r[2] || '', c: 'sm' }, { t: h ? fmtH(h) : '', c: 'b' }, /مداوم/.test(r[3] || '') ? 'نعم' : 'لا', '']);
      });
      const tot = L.reduce((t, r) => t + G.filter(g => g[2] === r[0] || g[3] === r[0]).reduce((a, g) => a + sessH(sessOf(sy, g[0])), 0), 0);
      if (rows.length) rows.push(`<tr class="tot"><td colspan="6">المجموع</td><td>${fmtH(tot)}</td><td></td><td></td></tr>`);
      return { title: `إحصاء ساعات الحراسة خلال ${esc(examTitle(I))} — دورة ${esc(I.session)}`, sub: `مركز الامتحان: ${esc(I.center || '..........')}${I.code ? ' — ' + esc(I.code) : ''}`, page: 'a4l', sign: signHead(s),
        blocks: [{ table: { cls: 'sb-t', head: thr(['ر.ت', 'الإسم الكامل', 'رقم التأجير', 'رقم بطاقة التعريف', 'المؤسسة الأصلية', 'مادة التدريس', 'عدد ساعات الحراسة', 'مداومة: نعم/لا', 'ملاحظات']), rows }, minRows: 12 }] };
    } });
  const secList = corr => ({ k: corr ? 'ex_seccorr' : 'ex_secexam', t: corr ? 'لائحة أعضاء الكتابة — مركز التصحيح' : 'لائحة أعضاء الكتابة — مركز الإجراء', grp: corr ? 'r' : 'o',
    d: corr ? 'رئيس مركز التصحيح، كتابة مركز التصحيح، منسق(ة) المسك: الاسم، رقم التأجير، رقم البطاقة الوطنية، الإطار، المهمة.' : 'رئيس المركز وأعضاء كتابة المركز: الاسم، رقم التأجير، رقم البطاقة الوطنية، الإطار، المهمة.', auto: 'طاقم المركز ولائحة الموظفين', page: 'a4',
    init: () => ({ center: '' }), defs: (f, sy) => [{ k: 'center', l: corr ? 'مركز التصحيح' : 'مركز الامتحان', ph: corr ? 'اسم مركز التصحيح' : info(sy).center }],
    build: (s, f, sy) => {
      const I = info(sy), rx = corr ? /تصحيح|المسك/ : /^رئيس مركز الامتحان|الكتابة|كتابة المركز/;
      let L = staff(sy).filter(r => rx.test(r[3] || '') && !(corr ? false : /تصحيح/.test(r[3] || '')));
      const def = corr ? ['رئيس مركز التصحيح', 'كتابة مركز التصحيح', 'منسق(ة) المسك'] : ['رئيس المركز', 'كتابة المركز', 'كتابة المركز'];
      const rows = (L.length ? L : def.map(t => ['', '', '', t])).map((r, i) => { const e = empOf(r[0]); return tr([i + 1, { t: r[0], c: 'r b' }, r[1] || e.ppr || '', { t: e.cin || '', c: 'ltr' }, { t: e.cadre || r[2] || '', c: 'sm' }, { t: /^رئيس مركز الامتحان$/.test(r[3]) ? 'رئيس المركز' : /^الكتابة$/.test(r[3]) ? 'كتابة المركز' : r[3] || '', c: 'b' }, { t: '', st: 'width:18%' }]); });
      return { title: `لائحة أعضاء الكتابة خلال ${esc(examTitle(I))} — دورة ${esc(I.session)}`, sub: `${corr ? 'مركز التصحيح' : 'مركز الامتحان'}: ${esc(nm(f.center) || (corr ? '..........' : I.center || '..........'))}`, page: 'a4',
        sign: corr ? SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' }) : signHead(s),
        blocks: [{ table: { cls: 'sb-t big', head: thr(['ر.ت', 'الإسم الكامل', 'رقم التأجير', 'رقم بطاقة التعريف', 'الإطار', 'المهمة', 'التوقيع']), rows }, minRows: 3 }] };
    } });
  add(secList(false)); add(secList(true));
  const pvText = (k, t, lines) => add({ k, t, grp: 'p', d: 'محضر رسمي يُملأ بمركز الامتحان ويوقعه أعضاء اللجنة.', auto: 'معطيات الامتحان', page: 'a4', init: () => ({ subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjects(sy).map((r, i) => [String(i + 1), r[0]]) }],
    build: (s, f, sy) => { const sj = sessOf(sy, f.subj); return { title: t, sub: sub(sy), page: 'a4', sign: SB.sign(s, { three: ['أعضاء اللجنة: الأسماء والتوقيعات', '', 'خاتم وتوقيع رئيس(ة) المركز'] }), blocks: [kv([['المادة', sj[0]], ['التاريخ', MK.showDate(sj[1])], ['التوقيت', `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`], ['مركز الامتحان', info(sy).center]]), { html: `<div class="sb-pv">${lines(sj, sy)}</div>` }, tbl(thr(['ر.ت', 'الاسم الكامل', 'الصفة', 'التوقيع']), [1, 2, 3, 4].map(i => tr([i, '', '', { t: '', st: 'height:9mm' }])), 'big')] }; } });
  pvText('ex_open', 'محضر فتح أظرفة المواضيع', () => '<p>تم فتح أظرفة مواضيع الامتحان وعددها: .................. على الساعة: .................. بحضور أعضاء اللجنة المكونة من السيدات والسادة أسفله، وقد تمت معاينة سلامة الأظرفة وأختامها.</p><p>ملاحظات: ..........................................................................................................</p>');
  pvText('ex_close', 'محضر إغلاق أظرفة أوراق التحرير', () => '<p>تم إغلاق وتوقيع أظرفة أوراق التحرير وعددها: .................. على الساعة: .................. بحضور أعضاء اللجنة المكونة من السيدات والسادة أسفله.</p><p>عدد الأوراق بكل ظرف مطابق لعدد الحاضرين. ملاحظات: ......................................................................................</p>');
  add({ k: 'ex_proc', t: 'مطبوع الإجراء (لكل قاعة وحصة)', grp: 'p', d: 'يملؤه المسؤولون عن الإجراء ويسلمونه لرئيس المركز عند نهاية الحصة.', auto: 'معطيات الامتحان', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => ({ title: 'مطبوع الإجراء', sub: sub(sy), page: 'a4', sign: SB.sign(s, { three: ['الاسم الكامل للمسؤول(ة) عن الإجراء', 'الإطار والمهمة', 'التوقيع'] }), blocks: [{ html: `<div class="sb-pv">
      <p>المرجو من المسؤولين عن الإجراء تعبئة هذا المطبوع بكل عناية وتسليمه إلى رئيس مركز الامتحان عند نهاية حصة الإجراء.</p>
      <p>قاعة الامتحان: .......... — المادة: ............................ — فترة التمرير: صباحا ☐ بعد الزوال ☐</p>
      <p>العدد الإجمالي للمترشحين: .......... — عدد المتغيبين منهم: .......... — عدد المتأخرين: .......... — المتأخرون الذين لم يسمح لهم بالاجتياز: ..........</p>
      <p>توقيت بداية إنجاز الامتحان: .......... — توقيت نهاية إنجاز الامتحان: ..........</p>
      <p>هل وقع حدث أو أحداث أثرت على السير العادي لإجراء الاختبار؟ نعم ☐ لا ☐ — في حالة الجواب بنعم، صف تلك الأحداث باقتضاب: ............................................................................................</p>
      <p>هل زاركم أحد الملاحظين خلال اجتياز الاختبار؟ نعم ☐ لا ☐ — هل زاركم رئيس مركز الامتحان؟ نعم ☐ لا ☐</p>
      <p>ما تقييمكم للظروف التي تم فيها اجتياز الاختبار (القاعة وتجهيزاتها، الجوانب التنظيمية، سلوكات المترشحين...)؟ ............................................................................................</p>
      <p>هل تم ضبط حالة أو حالات غش؟ نعم ☐ لا ☐ (في حالة الجواب بنعم، يرجى تعبئة تقرير الغش لكل حالة على حدة)</p>
      <p>ملاحظات أخرى واقتراحات: ............................................................................................</p></div>` }] }) });
  add({ k: 'ex_fraud', t: 'تقرير الغش (لكل حالة)', grp: 'p', d: 'تقرير حالة غش: المادة، التوقيت، المترشح، الوسيلة المستعملة، الإجراء المتخذ ورد فعل المترشح.', auto: 'معطيات الامتحان', page: 'a4', init: () => ({ no: '' }),
    defs: () => [{ k: 'no', l: 'رقم امتحان المترشح الغاش (اختياري)', dir: 'ltr' }],
    build: (s, f, sy) => { const c = cands(sy).find(x => nm(x[C.no]) === nm(f.no)) || []; const cb = '☐'; return { title: 'تقرير الغش', sub: sub(sy), page: 'a4', sign: SB.sign(s, { three: ['المراقب(ة) الأول(ى)', 'المراقب(ة) الثاني(ة)', 'خاتم وتوقيع رئيس المركز بعد الاطلاع'] }), blocks: [{ html: `<div class="sb-pv">
      <p>المرجو من المسؤولين عن الإجراء تعبئة هذا المطبوع بكل عناية، لكل حالة غش على حدة، وتسليمه إلى رئيس مركز الامتحان عند نهاية حصة الإجراء.</p>
      <p>1. تاريخ إجراء الامتحان: ................ 2. المستوى: ${esc(levelName(info(sy).level))} 3. المادة: ............................</p>
      <p>4. المدة الزمنية المخصصة: ...... س ...... د 5. توقيت بداية الإنجاز: .......... 6. توقيت ضبط حالة الغش: ..........</p>
      <p>7. الاسم الكامل للمترشح الغاش: <b>${esc(dots(c[C.name], 30))}</b> 8. رقم امتحانه: <b>${esc(dots(c[C.no], 8))}</b> — القاعة: ${esc(dots(c[C.room], 6))}</p>
      <p>9. اسم المترشح المساهم في عملية الغش (إن وجد) ورقم امتحانه: ............................................</p>
      <p>10. الوسيلة المستعملة في الغش: ${cb} وثيقة مطبوعة أو مكتوبة باليد ${cb} ورقة تحرير أو تسويد أحد المترشحين ${cb} الهاتف النقال ${cb} وسيلة أخرى، حددها: ..........</p>
      <p>11. الإجراء المتخذ في حق هذا التلميذ: ${cb} الاقتصار على سحب وسيلة الغش ${cb} سحب وسيلة الغش مع تنبيه شفوي ${cb} إخراج الغاش من قاعة الامتحان ${cb} آخر: ..........</p>
      <p>12. رد فعل المترشح: ${cb} انضبط للإجراء والتزم الصمت ${cb} احتج شفويا دون ألفاظ نابية ${cb} احتج شفويا باستعمال ألفاظ نابية أو غير أخلاقية ${cb} هدد باستعمال العنف المادي</p>
      <p>13. إضافات لتوضيح ملابسات عملية الغش: ......................................................................................................................................................</p></div>` }] }; } });
  add({ k: 'ex_report', t: 'تقرير حول سير الامتحان', grp: 'p', d: 'تقرير رئيس المركز: فتح الأظرفة، عملية الحراسة، الحالات المسجلة، الزيارات، الملاحظات (قابل للتحرير في Word).', auto: 'معطيات الامتحان', page: 'a4',
    init: () => ({ open: 'تم فتح أظرفة المواضيع في الوقت المحدد وبحضور أعضاء اللجنة، وكانت سليمة.', guard: 'مرت عملية الحراسة في ظروف عادية وبانضباط تام للمراقبين.', cases: 'لا شيء يذكر.', visits: '', other: '' }),
    defs: () => [{ k: 'open', l: 'فتح الأظرفة', t: 'area', rows: 2 }, { k: 'guard', l: 'عملية الحراسة', t: 'area', rows: 2 }, { k: 'cases', l: 'الحالات المسجلة بخصوص المواضيع', t: 'area', rows: 2 }, { k: 'visits', l: 'الزيارات التي تمت بالمركز', t: 'area', rows: 2 }, { k: 'other', l: 'ملاحظات أخرى', t: 'area', rows: 2 }],
    build: (s, f, sy) => { const L = cands(sy); return { title: 'تقرير حول سير الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [kv([['مركز الامتحان', info(sy).center], ['عدد المترشحين', String(L.length)], ['عدد القاعات', String(rooms(sy).length)], ['عدد المواد', String(subjects(sy).length)]]),
      ...[['فتح الأظرفة', f.open], ['عملية الحراسة', f.guard], ['الحالات المسجلة بخصوص المواضيع', f.cases], ['الزيارات التي تمت بالمركز أثناء إجراء الامتحانات', f.visits], ['ملاحظات أخرى', f.other]].map(([h, t]) => ({ html: `<div class="rp-h">${esc(h)}</div><p class="sb-p">${esc(nm(t) || '..............................................................................................................')}</p>` }))] }; } });
  add({ k: 'ex_receipt', t: 'محضر الاستلام (لوائح واستدعاءات)', grp: 'p', d: 'يشهد فيه مدير المؤسسة الأصلية باستلام لوائح أرقام الامتحان والاستدعاءات المختومة من رئيس المركز.', auto: 'معطيات الامتحان', page: 'a4', init: () => ({ school: '', n: '' }),
    defs: () => [{ k: 'school', l: 'المؤسسة الأصلية', half: true }, { k: 'n', l: 'عدد المترشحين', t: 'num', half: true }],
    build: (s, f, sy) => { const I = info(sy); return { title: 'محضر الاستلام', sub: sub(sy), page: 'a4', sign: SB.sign(s, { right: 'خاتم وتوقيع رئيس(ة) مركز الامتحان', left: 'خاتم وتوقيع مدير(ة) المؤسسة' }), blocks: [{ html: `<div class="sb-pv"><p>أنا الموقع(ة) أسفله، بصفتي مدير(ة) مؤسسة: <b>${esc(nm(f.school) || s.school || '')}</b></p>
      <p>أشهد أني استلمت من رئيس(ة) مركز الامتحان: <b>${esc(I.center)}</b></p><p>- لوائح أرقام الامتحان حسب القسم؛</p><p>- استدعاءات مختومة للمترشحين.</p>
      <p>للمستوى الإشهادي: <b>${esc(levelName(I.level))}</b> لدورة: <b>${esc(I.session)}</b> — عدد المترشحين: <b>${esc(nm(f.n) || String(cands(sy).length))}</b></p><p>حرر ب${esc(s.city || '')} في: ${esc(K.ldate(Dx.todayIso()))}</p></div>` }] }; } });
  add({ k: 'ex_marksheet', t: 'محضر التنقيط (لكل قاعة ومادة)', grp: 'r', d: 'ورقة التنقيط للمصحح(ة): أرقام الامتحان والنقطة بالأرقام وبالحروف وتوقيع المصحح.', auto: 'المترشحون والقاعات', page: 'a4', init: () => ({ subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjects(sy).map((r, i) => [String(i + 1), r[0]]) }],
    build: (s, f, sy) => { const sj = sessOf(sy, f.subj), mx = info(sy).max; return roomPages(s, sy, 'محضر التنقيط', (k, L) => [{ html: `<div class="sb-cap">المادة: ${esc(sj[0])} — النقطة من ${esc(mx)}</div>` }, tbl(thr(['ر.ت', 'رقم الامتحان', `النقطة / ${mx}`, 'النقطة بالحروف', 'ملاحظة']), L.map((c, i) => tr([i + 1, { t: c[C.no], c: 'b' }, '', { t: '', st: 'width:35%' }, ''])), 'big'), SB.sign(s, { right: 'توقيع المصحح(ة)', left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' })]); } });
  add({ k: 'ex_stats', t: 'إحصائيات النتائج', grp: 'r', d: 'نسب النجاح حسب الجنس والقسم، توزيع المعدلات، ومبيان.', auto: 'النقط', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const R = results(sy), I = info(sy), mx = num(I.max) || 10;
      const g = (L) => [L.length, L.filter(r => r.ok).length, K.pct(L.filter(r => r.ok).length, L.length, 1)];
      const M = R.filter(r => !isF(r.c[C.g])), F = R.filter(r => isF(r.c[C.g]));
      const classes = Array.from(new Set(R.map(r => r.c[C.cls]).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'ar', { numeric: true }));
      const bands = [[0, .4], [.4, .5], [.5, .6], [.6, .7], [.7, .8], [.8, 1.01]];
      return { title: 'إحصائيات نتائج الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        tbl(thr(['الفئة', 'المترشحون', 'الناجحون', 'نسبة النجاح']), [tr([{ t: 'الذكور', c: 'k' }].concat(g(M))), tr([{ t: 'الإناث', c: 'k' }].concat(g(F))), tr([{ t: 'المجموع', c: 'k' }].concat(g(R)), 'tot')], 'big'),
        classes.length ? { before: SB.cap('حسب الأقسام'), table: { cls: 'sb-t', head: thr(['القسم', 'المترشحون', 'الناجحون', 'نسبة النجاح']), rows: classes.map(c => tr([{ t: c, c: 'k' }].concat(g(R.filter(r => r.c[C.cls] === c))))) } } : '',
        { before: SB.cap('توزيع المعدلات العامة'), table: { cls: 'sb-t', head: thr(bands.map(([a, b]) => `${f2(a * mx)} - ${b > 1 ? f2(mx) : f2(b * mx)}`)), rows: [tr(bands.map(([a, b]) => R.filter(r => r.fin != null && r.fin >= a * mx && r.fin < b * mx).length))] } },
        { html: K.bars(['الذكور', 'الإناث', 'المجموع'], [{ name: 'المترشحون', color: K.COL.t, vals: [M.length, F.length, R.length] }, { name: 'الناجحون', color: K.COL.g, vals: [g(M)[1], g(F)[1], g(R)[1]] }], { w: 560, h: 220 }) }] };
    } });

  /* ---------- 1.9.2: professional results pack ---------- */
  const rk = R => { const L = R.filter(r => r.fin != null).sort((a, b) => b.fin - a.fin || String(a.c[C.name]).localeCompare(String(b.c[C.name]), 'ar')); let pos = 0, last = null, i = 0; L.forEach(r => { i++; if (last === null || r.fin !== last) { pos = i; last = r.fin; } r.rank = pos; }); return L; };
  const stat = a => { a = a.filter(v => v != null); if (!a.length) return null; const m = a.reduce((x, y) => x + y, 0) / a.length; return { n: a.length, m, mn: Math.min(...a), mx: Math.max(...a), sd: Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length) }; };
  const dec = (r, I) => r.fin == null ? 'غير مكتمل' : r.miss ? 'غائب(ة) في مادة' : r.ok ? 'ناجح(ة)' : 'غير ناجح(ة)';
  add({ k: 'ex_rank', t: 'لائحة الاستحقاق (الترتيب العام والأوائل)', grp: 'r', d: 'ترتيب المترشحين حسب المعدل العام مع الميزة، ولائحة الأوائل.', auto: 'النقط', page: 'a4', init: () => ({ top: '10', only: 'all' }),
    defs: () => [{ k: 'top', l: 'عدد الأوائل في لائحة التميز', t: 'num', half: true }, { k: 'only', l: 'المعروضون', t: 'select', half: true, opts: [['all', 'كل المترشحين'], ['ok', 'الناجحون فقط']] }],
    build: (s, f, sy) => {
      const I = info(sy), mx = num(I.max) || 10, R = rk(results(sy)), L = f.only === 'ok' ? R.filter(r => r.ok) : R, n = Math.max(1, parseInt(f.top, 10) || 10);
      const row = r => tr([r.rank, { t: r.c[C.no], c: 'b' }, { t: r.c[C.name], c: 'r b' }, r.c[C.cls] || '', { t: f2(r.fin), c: 'b' }, { t: r.ok ? mention(r.fin, mx) : '', c: 'sm' }, dec(r, I)]);
      const H = thr(['الرتبة', 'رقم الامتحان', 'الاسم الكامل', 'القسم', 'المعدل العام', 'الميزة', 'النتيجة']);
      return { title: 'لائحة الاستحقاق', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [SB.cap(`لائحة التميز: الأوائل (${Math.min(n, R.length)})`), tbl(H, R.slice(0, n).map(row).concat(R.length ? [] : [tr(['', '', '', '', '', '', ''])]), 'big'), SB.cap('الترتيب العام'), tbl(H, L.map(row).concat(L.length ? [] : [tr(['', '', '', '', '', '', ''])]), 'cmp')] };
    } });
  add({ k: 'ex_byclass', t: 'النتائج حسب الأقسام', grp: 'r', d: 'لائحة نتائج لكل قسم (صفحة مستقلة): المعدل العام والنتيجة والميزة وإحصاء القسم.', auto: 'النقط', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), mx = num(I.max) || 10, R = rk(results(sy)), cl = Array.from(new Set(R.map(r => r.c[C.cls] || '—'))).sort((a, b) => String(a).localeCompare(String(b), 'ar', { numeric: true })), pages = [];
      (cl.length ? cl : ['—']).forEach(k => {
        const L = results(sy).filter(r => (r.c[C.cls] || '—') === k), ok = L.filter(r => r.ok);
        MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, `نتائج القسم ${k}`, sub(sy)), blocks: [{ html: `<div class="sb-cap">المترشحون: ${L.length} — الناجحون: ${ok.length} (${K.pct(ok.length, L.length, 1)})</div>` },
          tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'المعدل العام', 'النتيجة', 'الميزة']), L.map((r, i) => tr([i + 1, { t: r.c[C.no], c: 'b' }, { t: r.c[C.name], c: 'r b' }, f2(r.fin), dec(r, I), { t: r.ok ? mention(r.fin, mx) : '', c: 'sm' }])).concat(L.length ? [] : [tr(['', '', '', '', '', ''])]), 'big'), signHead(s)] }).forEach((p, i) => pages.push(i ? p : pb(p)));
      });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_subjstat', t: 'إحصائيات المواد (المتوسط والتشتت)', grp: 'r', d: 'لكل مادة: عدد المنقطين، المتوسط، أعلى وأدنى نقطة، الانحراف المعياري ونسبة من نالوا المعدل.', auto: 'النقط', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), R = results(sy), pass = num(I.pass) || (num(I.max) || 10) / 2;
      const rows = ss.map((x, i) => { const v = R.map(r => r.marks[i]), t = stat(v); const ab = R.length - (t ? t.n : 0); return tr([{ t: x[0], c: 'k' }, t ? t.n : 0, ab, t ? f2(t.m) : '', t ? f2(t.mx) : '', t ? f2(t.mn) : '', t ? f2(t.sd) : '', t ? K.pct(v.filter(y => y != null && y >= pass).length, t.n, 1) : '']); });
      const ex = stat(R.map(r => r.ex)), fin = stat(R.map(r => r.fin));
      rows.push(tr([{ t: 'معدل الامتحان', c: 'k' }, ex ? ex.n : 0, '', ex ? f2(ex.m) : '', ex ? f2(ex.mx) : '', ex ? f2(ex.mn) : '', ex ? f2(ex.sd) : '', ''], 'tot'), tr([{ t: 'المعدل العام', c: 'k' }, fin ? fin.n : 0, '', fin ? f2(fin.m) : '', fin ? f2(fin.mx) : '', fin ? f2(fin.mn) : '', fin ? f2(fin.sd) : '', fin ? K.pct(R.filter(r => r.ok).length, fin.n, 1) : ''], 'tot'));
      return { title: 'إحصائيات المواد', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [tbl(thr(['المادة', 'المنقَّطون', 'الغائبون', 'المتوسط', 'أعلى نقطة', 'أدنى نقطة', 'الانحراف المعياري', `نسبة ≥ ${f2(pass)}`]), rows, 'big'),
        { html: K.bars(ss.map(x => x[0]), [{ name: 'متوسط المادة', color: K.COL.t, vals: ss.map((x, i) => { const t = stat(R.map(r => r.marks[i])); return t ? Math.round(t.m * 100) / 100 : 0; }) }], { w: 600, h: 230 }) }] };
    } });
  add({ k: 'ex_transcript', t: 'كشوف النقط الفردية (لكل مترشح)', grp: 'r', d: 'كشف نقط لكل مترشح(ة): نقط المواد والمعاملات والمعدلات والنتيجة والميزة والرتبة، بنسختين في الصفحة.', auto: 'النقط', page: 'a4', init: () => ({ cls: '' }),
    defs: (f, sy) => [{ k: 'cls', l: 'القسم', t: 'select', opts: [['', 'كل الأقسام']].concat(Array.from(new Set(cands(sy).map(c => c[C.cls]).filter(Boolean))).sort().map(x => [x, x])) }],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), mx = num(I.max) || 10, all = results(sy); rk(all);
      const R = all.filter(r => !f.cls || r.c[C.cls] === f.cls);
      const card = r => `<div class="ex-cv"><div class="ex-cv-h"><b>${esc(examTitle(I))}</b><b>كشف النقط</b></div>
        <div class="ex-cv-g"><div>الاسم الكامل: <b>${esc(r.c[C.name])}</b><br>رقم الامتحان: <b>${esc(r.c[C.no])}</b> — الرقم الوطني: <b dir="ltr">${esc(r.c[C.code] || '')}</b></div><div>القسم: <b>${esc(r.c[C.cls] || '')}</b><br>الدورة: ${esc(I.session)}</div></div>
        <table class="ex-cv-t"><thead><tr><th>المادة</th>${ss.map(x => `<th>${esc(x[0])}</th>`).join('')}</tr></thead><tbody><tr><td>النقطة / ${esc(mx)}</td>${r.marks.map(v => `<td>${f2(v)}</td>`).join('')}</tr><tr><td>المعامل</td>${ss.map(x => `<td>${esc(x[4] || 1)}</td>`).join('')}</tr></tbody></table>
        <div class="ex-cv-g"><div>المراقبة المستمرة: <b>${f2(r.cc)}</b>${hasLoc(I) ? ` — ${I.type === 'nat' ? 'الامتحان الجهوي' : 'الامتحان المحلي'}: <b>${f2(r.loc)}</b>` : ''} — معدل الامتحان: <b>${f2(r.ex)}</b></div><div class="big">المعدل العام: <b>${f2(r.fin)}</b></div></div>
        <div class="ex-cv-g"><div>النتيجة: <b>${esc(dec(r, I))}</b> ${r.ok ? '— الميزة: <b>' + esc(mention(r.fin, mx) || 'بدون') + '</b>' : ''}</div><div>الرتبة: <b>${r.rank || ''}</b> / ${all.filter(x => x.fin != null).length}</div></div>
        <div class="ex-cv-s">خاتم وتوقيع ${esc(I.head ? 'رئيس(ة) المركز: ' + I.head : 'رئيس(ة) مركز الامتحان')}</div></div>`;
      const pages = [];
      for (let i = 0; i < R.length; i += 3) pages.push(`<div class="mk-page-inner">${R.slice(i, i + 3).map(card).join('')}</div>`);
      return { page: 'a4', pages: pages.length ? pages : [`<div class="mk-page-inner">${esc('لا توجد نتائج بعد')}</div>`] };
    } });
  add({ k: 'ex_fail', t: 'لائحة غير الناجحين والمترشحين الغائبين', grp: 'r', d: 'المترشحون الذين لم ينالوا معدل النجاح أو تغيبوا في مادة، مع المعدل ونقص النقط.', auto: 'النقط', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), pass = num(I.pass) || (num(I.max) || 10) / 2, L = results(sy).filter(r => !r.ok);
      return { title: 'لائحة غير الناجحين', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [{ html: `<div class="sb-cap">العدد: ${L.length} — معدل النجاح: ${f2(pass)}</div>` },
        tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'القسم', 'المعدل العام', 'النقص عن النجاح', 'الحالة']), L.map((r, i) => tr([i + 1, { t: r.c[C.no], c: 'b' }, { t: r.c[C.name], c: 'r b' }, r.c[C.cls] || '', f2(r.fin), r.fin == null ? '' : f2(Math.max(0, pass - r.fin)), dec(r, I)])).concat(L.length ? [] : [tr(['', '', '', '', '', '', ''])]), 'big')] };
    } });

  Dx.modCss += `
  .ex-cv{border:1.3px solid #1f3864;border-radius:2mm;padding:2mm 3mm;margin:0 0 3mm;font-size:9.6pt;line-height:1.55;break-inside:avoid}
  .ex-cv-h{display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid #4472c4;padding-bottom:1mm;margin-bottom:1.2mm;color:#1f3864}.ex-cv-h b:last-child{font-size:13pt}
  .ex-cv-g{display:grid;grid-template-columns:1.4fr 1fr;column-gap:4mm}.ex-cv-g .big{font-size:13pt}
  .ex-cv-t{width:100%;border-collapse:collapse;margin:1.2mm 0;font-size:8.4pt;text-align:center}.ex-cv-t th,.ex-cv-t td{border:1px solid #4f7fc4;padding:.4mm .6mm}.ex-cv-t th{background:#d9e2f3}
  .ex-cv-n{font-size:7.8pt;line-height:1.45;color:#222}.ex-cv-s{text-align:left;font-weight:700;margin-top:1mm;min-height:9mm}
  .ex-lb{display:grid;grid-template-columns:1fr 1fr 1fr;grid-auto-rows:44mm;gap:3mm}.ex-lb>div{border:1.4px dashed #1f3864;border-radius:2mm;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2mm}
  .ex-lb .no{font-size:34pt;font-weight:700;color:#1f3864;line-height:1.1}.ex-lb .nm{font-size:12pt;font-weight:700}.ex-lb .rm{font-size:9pt;color:#333}
  .ex-covs{display:flex;flex-direction:column;height:100%}.ex-cut{border-top:1px dashed #888;margin:3mm 0}.ex-cov{flex:1;border:2.5px double #1f3864;border-radius:4mm;padding:6mm;display:flex;flex-direction:column;align-items:center;justify-content:space-around;text-align:center;color:#1f3864}
  .ex-cov .h{font-size:13pt;line-height:1.6}.ex-cov .t{font-size:17pt;font-weight:700}.ex-cov .d{font-size:13pt}.ex-cov .rm{display:flex;align-items:center;gap:8mm;font-size:26pt;font-weight:700}.ex-cov .rm b{font-size:64pt;border:2px solid #1f3864;border-radius:4mm;min-width:38mm;padding:0 6mm}.ex-cov .g{font-size:15pt;line-height:1.9}
  .ex-rules{border:3px solid #c0392b;border-radius:5mm;padding:7mm 9mm;margin-top:4mm;color:#1b1b1b}.ex-rules .e{text-align:center;font-weight:700;color:#1f3864;font-size:13pt}.ex-rules .t{text-align:center;font-size:36pt;font-weight:700;color:#c0392b;margin:3mm 0}.ex-rules .w{font-size:15pt;font-weight:700;margin-bottom:3mm}
  .ex-rules ul{font-size:15.5pt;line-height:1.75;padding-right:8mm;margin:0}.ex-rules li{margin-bottom:2.5mm}.ex-rules .f{margin-top:6mm;background:#fdecea;border:1.5px solid #c0392b;border-radius:3mm;padding:4mm;text-align:center;font-size:16pt;font-weight:700;color:#c0392b;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ex-rules .f small{font-size:11pt;color:#555}
  .ex-box{border:1px solid #333;border-radius:2mm;margin:2mm 0;overflow:hidden}.ex-box .vs-bt{background:#eef2f7;font-weight:700;padding:1mm 2.5mm;border-bottom:1px solid #333}
  .ex-room{text-align:center;margin-top:8mm;color:#1f3864}.ex-room .t{font-size:34pt;font-weight:700}.ex-room .n{font-size:110pt;font-weight:700;line-height:1.1}.ex-room .r{font-size:16pt;margin-top:2mm}
  .docx-pb{display:none}`;

  const store = sy => Y(sy);
  // 1.9.4: the groups of the documents (the smart layer «exams2.js» adds its own and re-orders the documents)
  const GROUPS = [['d', 'إعداد الامتحان (بالترتيب)', 'كل خطوة تعدّل المعطيات المشتركة وتُطبع'], ['o', 'وثائق مركز الامتحان', 'تُملأ تلقائيا'], ['p', 'المحاضر والمطبوعات'], ['r', 'التصحيح والنتائج']];
  let CC = null;
  const center = () => CC || (CC = K.center({
    id: 'exams', title: 'تدبير الامتحان الإشهادي', icon: '📝', route: 'examsDoc', hubRoute: 'exams', docLabel: 'الخطوة / الوثيقة',
    groups: () => GROUPS, groupTabs: true,
    docs: () => { const I = info(MK.curSy()), k = kindNow(); return DOCS.filter(d => !d.when || d.when(I, k)); }, store, years: () => Object.keys((DB.exams || {}).years || {}),
    intro: () => introTxt(),
    hubButtons: () => { const sy = MK.curSy(), L = cands(sy); return `<span class="tag2">${esc(typeName(info(sy).type))} — ${esc(levelName(info(sy).level))} — المترشحون: ${L.length}</span>`; }
  }));
  window.Exams = { migrate, DOCS: () => DOCS, results, cands, info,
    // 1.9.4: the internals used by the smart layer (exams2.js)
    X: { Y, info, cands, subjects, rooms, staff, guardRows, byRoom, sub, signHead, C, CAND_COLS, isF, examTitle, levelName, typeName, add, kv, roomPages, sessLabel, sessOf, sortRooms,
      results, f2, rng, kindNow, defSubj, subjOpts, subjIdx, sjDate, gCount, pb, dots, ROLES, GROUPS, DOCS, hasLoc, mention, num, nm, SUBJ, ALL_LEVELS, ALL_TYPES, center: () => center() } };
  window.pageExams = (v, a) => { migrate(DB); center().hub(v, a); };
  window.pageExamsDoc = (v, a) => { migrate(DB); center().doc(v, a); };
})();
