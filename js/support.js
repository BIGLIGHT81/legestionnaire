'use strict';
/* 1.9.2 — الدعم الممتد (مؤسسات الريادة): الأساتذة المتدخلون (مربوطون بلائحة الموظفين وبالحساب البنكي RIB لكل أستاذ(ة))،
   الساعات الإضافية الشهرية والكشف الشهري «Liste des enseignants intervenant dans les établissements pionniers – indemnité des heures
   supplémentaires» بنفس نموذج المديرية، المجموعات واستعمال الزمن، التلاميذ المستفيدون (من استثمار الروائز أو بطاقة التلاميذ)،
   دفتر الحصص، سجل الحضور، بطاقة التتبع، التكليف والتقرير. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };
  function migrate(db) { const o = db.support = db.support || {}; o.years = o.years && typeof o.years === 'object' ? o.years : {}; }
  const Y = sy => { migrate(DB); const y = DB.support.years[sy] || (DB.support.years[sy] = {}); ['teachers', 'hours', 'groups', 'pupils', 'log'].forEach(k => { if (!y[k] || typeof y[k] !== 'object') y[k] = {}; }); return y; };
  const MONTHS = [['09', 'شتنبر', 'SEPTEMBRE'], ['10', 'أكتوبر', 'OCTOBRE'], ['11', 'نونبر', 'NOVEMBRE'], ['12', 'دجنبر', 'DECEMBRE'], ['01', 'يناير', 'JANVIER'], ['02', 'فبراير', 'FEVRIER'], ['03', 'مارس', 'MARS'], ['04', 'أبريل', 'AVRIL'], ['05', 'ماي', 'MAI'], ['06', 'يونيو', 'JUIN']];
  const yearOf = (sy, mm) => (+mm >= 9 ? MK.syStart(sy) : MK.syStart(sy) + 1);
  const QUAL = ['PERMANENT', 'ETUDIENT ESEF', 'ETUDIENT CRMEF', 'AUTRES'];
  const SUBJ = ['اللغة العربية', 'اللغة الفرنسية', 'الرياضيات'];
  const LEVELS = { 'اللغة العربية': ['مبتدئ', 'حرف', 'مقطع', 'كلمة', 'جملة', 'فقرة', 'أقصوصة', 'نص'], 'اللغة الفرنسية': ['débutant', 'lettre', 'graphème complexe', 'syllabe', 'mot simple', 'mot avancé', 'phrase', 'texte'], 'الرياضيات': ['مبتدئ', 'رقم واحد', 'رقمان', 'جمع', 'طرح', 'ضرب', 'قسمة', 'تحدي'] };
  const T = { name: 0, ppr: 1, cin: 2, scale: 3, nom: 4, prenom: 5, qual: 6, rib: 7 };
  const teachers = sy => (Y(sy).teachers.rows || []).filter(r => nm(r[0]));
  const groups = sy => (Y(sy).groups.rows || []).filter(r => nm(r[0]));
  const pupils = sy => (Y(sy).pupils.rows || []).filter(r => nm(r[0]));
  const logRows = sy => (Y(sy).log.rows || []).filter(r => nm(r[0]) || nm(r[2]));
  const emp = n => K.E.byName(n);
  const ribOf = r => nm(r[T.rib]) || nm((emp(r[0]) || {}).rib);
  // hours of a teacher in a month: typed in «الساعات» first, otherwise the sum of the sessions of the log
  const hoursOf = (sy, name, mm) => {
    const h = (Y(sy).hours.rows || []).find(r => nm(r[0]) === nm(name));
    const i = MONTHS.findIndex(m => m[0] === mm);
    if (h && nm(h[1 + i]) !== '') return num(h[1 + i]);
    const y = yearOf(sy, mm);
    return logRows(sy).filter(r => nm(r[2]) === nm(name) && String(r[0] || '').startsWith(`${y}-${mm}`)).reduce((a, r) => a + num(r[3]), 0);
  };
  const defMonth = sy => { const m = MK.syRef(sy).slice(5, 7); return MONTHS.some(x => x[0] === m) ? m : '06'; };

  const DOCS = [];
  const add = d => DOCS.push(d);
  const dirSign = s => SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' });

  /* ---------- data steps ---------- */
  add({
    k: 'teachers', t: 'الأساتذة المتدخلون (والحساب البنكي)', grp: 'd', d: 'الأساتذة المتدخلون في الدعم الممتد مربوطون بلائحة الموظفين: رقم التأجير، البطاقة الوطنية، السلم، الاسم بالفرنسية والحساب البنكي (RIB).', auto: 'لائحة الموظفين (RIB من بطاقة الموظف)', page: 'a4l',
    init: () => ({ rows: [] }),
    defs: () => [{ t: 'html', html: '<button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة</button>' },
      { note: 'اكتب الاسم فتُملأ باقي الخانات من بطاقة الموظف. الحساب البنكي (RIB) المكتوب هنا يُحفظ أيضا في بطاقة الموظف ويُستعمل في كل الكشوف.' },
      { k: 'rows', l: 'الأساتذة', t: 'grid', cols: ['الاسم الكامل', 'رقم التأجير', 'CIN', 'السلم', 'Nom', 'Prénom', 'Qualité', 'RIB (24 رقما)'], widths: ['1.3fr', '.75fr', '.7fr', '.45fr', '.8fr', '.8fr', '.9fr', '1.5fr'],
        list: ['k2Emps', null, null, 'spScale', null, null, 'spQual', null], dirs: [null, 'ltr', 'ltr', 'ltr', 'ltr', 'ltr', 'ltr', 'ltr'], dls: { spScale: ['10', '11', 'HE'], spQual: QUAL },
        link: { src: 'emp', n: 0, cols: { ppr: 1, cin: 2 }, post: (row, r) => { const e = r.rec || {}; row[3] = row[3] || e.scale || ''; row[4] = row[4] || String(e.lastFr || '').toUpperCase(); row[5] = row[5] || e.firstFr || ''; row[6] = row[6] || 'AUTRES'; row[7] = row[7] || e.rib || ''; } } }],
    act: { all: (f, sy, c) => { f.rows = K.E.teachers().map(e => [fullName(e), e.ppr || '', e.cin || '', e.scale || '', String(e.lastFr || '').toUpperCase(), e.firstFr || '', 'AUTRES', e.rib || '']); c.save('rows'); } },
    onSave: (k, f) => { if (k !== 'rows') return; (f.rows || []).forEach(r => { const e = emp(r[0]); const rib = nm(r[T.rib]).replace(/\s/g, ''); if (e && rib && e.rib !== rib) e.rib = rib; }); },
    build: (s, f, sy) => {
      const rows = teachers(sy).map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, r[1], { t: r[2], c: 'ltr' }, r[3], { t: r[4], c: 'ltr' }, { t: r[5], c: 'ltr' }, { t: r[6], c: 'sm' }, { t: ribOf(r), c: 'ltr sm' }]));
      return { title: 'لائحة الأساتذة المتدخلين في الدعم الممتد', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: dirSign(s), blocks: [tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'CIN', 'السلم', 'Nom', 'Prénom', 'Qualité', 'RIB']), rows.length ? rows : [tr(new Array(9).fill(''))], 'cmp')] };
    }
  });
  add({
    k: 'hours', t: 'الساعات الإضافية الشهرية', grp: 'd', d: 'عدد ساعات الدعم الممتد لكل أستاذ(ة) في كل شهر (تُكتب، أو تُحسب تلقائيا من دفتر الحصص إذا تُركت فارغة).', auto: 'دفتر الحصص', page: 'a4l',
    init: () => ({ rows: [] }),
    defs: (f, sy) => [{ t: 'html', html: '<button type="button" class="btn sm" data-act="sync">ملء الجدول بالأساتذة المتدخلين</button>' }, { note: 'خانة فارغة = مجموع الحصص المسجلة في دفتر الحصص لذلك الشهر.' },
      { k: 'rows', l: 'الساعات', t: 'grid', cols: ['الأستاذ(ة)'].concat(MONTHS.map(m => m[1])), widths: ['1.4fr'].concat(MONTHS.map(() => '.5fr')), types: ['ro'].concat(MONTHS.map(() => 'num')), fixed: true }],
    act: { sync: (f, sy, c) => { const old = f.rows || []; f.rows = teachers(sy).map(t => { const o = old.find(r => nm(r[0]) === nm(t[0])) || []; return [t[0]].concat(MONTHS.map((m, i) => o[1 + i] || '')); }); c.save('rows'); } },
    build: (s, f, sy) => {
      const L = teachers(sy);
      const rows = L.map((t, i) => { const v = MONTHS.map(m => hoursOf(sy, t[0], m[0])); return tr([i + 1, { t: t[0], c: 'r b' }].concat(v.map(x => x || '')).concat([{ t: v.reduce((a, b) => a + b, 0), c: 'b' }])); });
      const tot = MONTHS.map(m => L.reduce((a, t) => a + hoursOf(sy, t[0], m[0]), 0));
      rows.push(tr([{ t: 'المجموع', s: 2 }].concat(tot).concat([tot.reduce((a, b) => a + b, 0)]), 'tot'));
      return { title: 'الحصيلة السنوية لساعات الدعم الممتد', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: dirSign(s), blocks: [tbl(thr(['ر.ت', 'الأستاذ(ة)'].concat(MONTHS.map(m => m[1])).concat(['المجموع'])), rows, 'cmp')] };
    }
  });
  add({
    k: 'groups', t: 'المجموعات واستعمال الزمن', grp: 'd', d: 'مجموعات الدعم الممتد حسب المادة والمستوى، الأستاذ(ة) المتدخل(ة)، اليوم والتوقيت والقاعة.', auto: 'الأساتذة المتدخلون', page: 'a4l',
    init: () => ({ rows: [['المجموعة 1', 'اللغة العربية', 'كلمة', '', 'الاثنين', '15:00-16:00', '']] }),
    defs: () => [{ k: 'rows', l: 'المجموعات', t: 'grid', cols: ['المجموعة', 'المادة', 'المستوى', 'الأستاذ(ة)', 'اليوم', 'التوقيت', 'القاعة'], widths: ['.9fr', '1fr', '.8fr', '1.2fr', '.7fr', '.8fr', '.5fr'], list: [null, 'spSubj', 'spLv', 'k2Emps', 'spDays', null, null], dirs: [null, null, null, null, null, 'ltr', null],
      dls: { spSubj: SUBJ, spLv: [].concat(...Object.values(LEVELS)), spDays: K.DAYS } }],
    build: (s, f, sy) => {
      const G = groups(sy), P = pupils(sy);
      return { title: 'توزيع مجموعات الدعم الممتد واستعمال الزمن', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: dirSign(s), blocks: [tbl(thr(['المجموعة', 'المادة', 'المستوى', 'الأستاذ(ة)', 'اليوم', 'التوقيت', 'القاعة', 'عدد التلاميذ']),
        G.map(g => tr([{ t: g[0], c: 'b' }, g[1], g[2], g[3], g[4], { t: g[5], c: 'ltr' }, g[6], P.filter(p => nm(p[4]) === nm(g[0])).length])), 'big')] };
    }
  });
  add({
    k: 'pupils', t: 'التلاميذ المستفيدون', grp: 'd', d: 'التلاميذ المستفيدون من الدعم الممتد، من نتائج استثمار الروائز (دون المستوى المستهدف) أو من بطاقة التلاميذ، مع المجموعة والمستوى.', auto: 'استثمار الروائز وبطاقة التلاميذ', page: 'a4',
    init: () => ({ rows: [] }),
    defs: () => [{ t: 'html', html: window.Cyc && Cyc.isSec() ? '' : '<button type="button" class="btn sm pri" data-act="roaiz">من استثمار الروائز (آخر فئة مستوردة)</button>' },
      { k: 'rows', l: 'المستفيدون', t: 'grid', cols: ['الاسم الكامل', 'رمز مسار', 'القسم', 'المادة', 'المجموعة', 'المستوى عند البداية', 'المستوى الحالي'], widths: ['1.4fr', '.9fr', '.6fr', '.9fr', '.8fr', '.8fr', '.8fr'],
        list: ['k2Pupils', 'k2Codes', null, 'spSubj', null, 'spLv', 'spLv'], dirs: [null, 'ltr', 'ltr', null, null, null, null], dls: { spSubj: SUBJ, spLv: [].concat(...Object.values(LEVELS)) }, link: { src: 'pupil', n: 0, cols: { code: 1, cls: 2 } } }],
    act: { roaiz: (f, sy, c) => {
      const R = (DB.roaiz && DB.roaiz.years && DB.roaiz.years[sy]) || [];
      const ph = ['post', 'c6', 'c5', 'c4', 'c3', 'c2', 'c1', 'pre'].find(p => R.some(g => g.phase === p));
      if (!ph) return c.toast('لا توجد نتائج روائز مستوردة لهذا الموسم (خانة استثمار الروائز)', true);
      const out = [];
      R.filter(g => g.phase === ph).forEach(g => (g.pupils || []).forEach(p => [['ar', 'اللغة العربية'], ['fr', 'اللغة الفرنسية'], ['math', 'الرياضيات']].forEach(([k, n]) => {
        const v = String(p[k] || '').trim().toLowerCase(), L = LEVELS[n]; const i = L.indexOf(v);
        if (v && i >= 0 && i < L.length - 2) out.push([p.name, '', g.level || '', n, '', p[k], p[k]]);
      })));
      if (!out.length) return c.toast('كل التلاميذ في المستويين الأخيرين حسب آخر الروائز', true);
      f.rows = out; c.save('rows'); c.toast(`أضيف ${out.length} مستفيدا (حسب المادة) من نتائج الروائز`);
    } },
    build: (s, f, sy) => {
      const P = pupils(sy);
      const blocks = SUBJ.concat(['']).map(sj => { const L = P.filter(p => sj ? p[3] === sj : !SUBJ.includes(p[3])); if (!L.length) return ''; return { before: SB.cap(sj || 'مواد أخرى', 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'رمز مسار', 'القسم', 'المجموعة', 'المستوى عند البداية', 'المستوى الحالي']), rows: L.map((p, i) => tr([i + 1, { t: p[0], c: 'r b' }, { t: p[1], c: 'ltr' }, p[2], p[4], p[5], p[6]])) } }; });
      return { title: 'لائحة التلاميذ المستفيدين من الدعم الممتد', sub: `الموسم الدراسي ${MK.syDash(sy)} — العدد: ${P.length}`, page: 'a4', sign: dirSign(s), blocks: blocks.some(Boolean) ? blocks : [tbl(thr(['ر.ت', 'الاسم الكامل', 'رمز مسار', 'القسم', 'المجموعة']), [tr(['', '', '', '', { t: '', st: 'height:8mm' }])])] };
    }
  });
  add({
    k: 'log', t: 'دفتر حصص الدعم الممتد', grp: 'd', d: 'تسجيل كل حصة: التاريخ، المجموعة، الأستاذ(ة)، المدة بالساعات، الأنشطة وعدد الحاضرين (يُحسب منه عدد الساعات الشهرية).', auto: 'المجموعات', page: 'a4l',
    init: () => ({ rows: [['', '', '', '1', '', '']] }),
    defs: (f, sy) => [{ k: 'rows', l: 'الحصص', t: 'grid', cols: ['التاريخ', 'المجموعة', 'الأستاذ(ة)', 'المدة (س)', 'الأنشطة / الكفايات', 'الحاضرون'], widths: ['.8fr', '.8fr', '1.2fr', '.5fr', '1.6fr', '.5fr'], types: ['date', 'text', 'text', 'num', 'text', 'num'], list: [null, 'spGroups', 'k2Emps', null, null, null], dls: { spGroups: () => groups(sy).map(g => g[0]) } }],
    build: (s, f, sy) => {
      const L = logRows(sy).slice().sort((a, b) => String(a[0]).localeCompare(String(b[0])));
      return { title: 'دفتر تتبع حصص الدعم الممتد', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: dirSign(s), blocks: [tbl(thr(['ر.ت', 'التاريخ', 'المجموعة', 'الأستاذ(ة)', 'المدة', 'الأنشطة / الكفايات المستهدفة', 'الحاضرون', 'توقيع الأستاذ(ة)']),
        (L.length ? L : [['', '', '', '', '', '']]).map((r, i) => tr([i + 1, MK.showDate(r[0]), r[1], r[2], r[3], { t: r[4], c: 'r sm' }, r[5], ''])), 'cmp')] };
    }
  });

  /* ---------- documents ---------- */
  add({
    k: 'sp_monthly', t: 'الكشف الشهري للساعات الإضافية (Liste des enseignants intervenant)', grp: 'o', d: 'النموذج الشهري للمديرية: الأساتذة المتدخلون في مؤسسات الريادة — تعويض الساعات الإضافية (رقم التأجير، CIN، السلم، Qualité، RIB، عدد الساعات).', auto: 'الأساتذة المتدخلون والساعات وبطاقات الموظفين', page: 'a4l',
    init: (s, sy) => ({ mm: defMonth(sy), cycle: /إعدادي/.test(s.cycle || '') ? 'SECONDAIRE COLLEGIAL' : 'PRIMAIRE', school: s.schoolFr || '', all: '' }),
    defs: () => [{ k: 'mm', l: 'الشهر', t: 'select', opts: MONTHS.map(m => [m[0], m[1]]), half: true }, { k: 'cycle', l: 'Cycle', half: true, dir: 'ltr' }, { k: 'school', l: 'Établissement scolaire (بالفرنسية)', dir: 'ltr' },
      { k: 'all', l: 'الأساتذة', t: 'select', opts: [['', 'من لهم ساعات في هذا الشهر فقط'], ['1', 'كل الأساتذة المتدخلين']] }],
    build: (s, f, sy) => {
      const mm = f.mm || defMonth(sy), M = MONTHS.find(m => m[0] === mm) || MONTHS[0];
      const L = teachers(sy).filter(t => f.all || hoursOf(sy, t[0], mm) > 0);
      const rows = L.map((t, i) => { const e = emp(t[0]) || {}; return tr([i + 1, nm(t[1]) || e.ppr || '', { t: nm(t[2]) || e.cin || '', c: 'ltr' }, nm(t[3]) || e.scale || '', { t: t[0], c: 'b' }, { t: nm(t[4]) || String(e.lastFr || '').toUpperCase(), c: 'ltr' }, { t: nm(t[5]) || e.firstFr || '', c: 'ltr' }, t[6] || 'AUTRES', { t: ribOf(t), c: 'ltr' }, { t: hoursOf(sy, t[0], mm) || '', c: 'b' }]); });
      for (let i = rows.length; i < 6; i++) rows.push(tr(['', '', '', '', '', '', '', '', '', { t: '', st: 'height:8mm' }]));
      const head = `<tr><th class="d">N°</th><th class="d">N° de SOM</th><th class="d">CIN</th><th class="d">Echelle (10;11;HE)</th><th class="d">الاسم الكامل</th><th class="d">Nom</th><th class="d">Prénom</th><th class="d">Qualité</th><th class="d">RIB</th><th class="d">Nombre d’heures supplémentaires*</th></tr>`;
      const ttl = `<div class="sp-fr" dir="ltr"><div>Établissement scolaire : <b>${esc(nm(f.school) || s.schoolFr || s.school || '')}</b></div><div>Liste des enseignants intervenant dans les établissements pionniers – indemnité des heures supplémentaires</div><div>Cycle : <b>${esc(f.cycle || 'PRIMAIRE')}</b> &nbsp; - &nbsp; pour le mois : <b>${M[2]} ${yearOf(sy, mm)}</b></div></div>`;
      const pages = MK.flowPages({ page: 'a4l', cls: 'sb', head: `<div class="mk-hdr">${Dx.header(s)}</div>${ttl}`, blocks: [tbl(head, rows, 'cmp sp-t'),
        { html: '<div class="sp-sg" dir="ltr"><div>Signature du Directeur / de la Directrice de l’établissement :</div><div>Signature du chef de service :</div><div>Signature du sous-ordonnateur :</div></div>' }] });
      return { page: 'a4l', pages };
    }
  });
  add({ k: 'sp_attend', t: 'سجل حضور المستفيدين (لكل مجموعة)', grp: 'o', d: 'ورقة حضور شهرية لكل مجموعة: أسماء التلاميذ وخانات الحصص.', auto: 'المستفيدون والمجموعات', page: 'a4l', init: (s, sy) => ({ mm: defMonth(sy), n: '8' }),
    defs: () => [{ k: 'mm', l: 'الشهر', t: 'select', opts: MONTHS.map(m => [m[0], m[1]]), half: true }, { k: 'n', l: 'عدد خانات الحصص', t: 'num', half: true }],
    build: (s, f, sy) => {
      const n = Math.max(1, Math.min(16, parseInt(f.n, 10) || 8)), M = MONTHS.find(m => m[0] === f.mm) || MONTHS[0];
      const G = groups(sy).length ? groups(sy) : [['—', '', '', '', '', '', '']];
      const pages = [];
      G.forEach((g, gi) => { const L = pupils(sy).filter(p => nm(p[4]) === nm(g[0])); const P = MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'سجل حضور المستفيدين من الدعم الممتد', `${esc(g[0])} — ${esc(g[1] || '')} ${g[2] ? '(' + esc(g[2]) + ')' : ''} — الأستاذ(ة): ${esc(g[3] || '..........')} — شهر ${M[1]} ${yearOf(sy, M[0])}`), blocks: [
        tbl(thr(['ر.ت', 'الاسم الكامل', 'القسم'].concat(Array.from({ length: n }, (x, i) => `ح${i + 1}<br>../..`)).concat(['ملاحظات'])), (L.length ? L : new Array(10).fill(['', '', ''])).map((p, i) => tr([i + 1, { t: p[0], c: 'r b' }, p[2]].concat(new Array(n).fill('')).concat(['']))), 'cmp'), dirSign(s)] });
        P.forEach((p, j) => pages.push(j || !gi ? p : `<div class="docx-pb"></div>${p}`)); });
      return { page: 'a4l', pages };
    } });
  add({ k: 'sp_card', t: 'بطاقة التتبع الفردية للتلميذ(ة)', grp: 'o', d: 'بطاقة لكل مستفيد(ة): المادة، المجموعة، المستوى عند البداية والمستوى الحالي وملاحظات الأستاذ(ة) (4 بطاقات في الصفحة).', auto: 'المستفيدون', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const P = pupils(sy).length ? pupils(sy) : [['', '', '', '', '', '', '']];
      const one = p => `<div class="sp-card"><div class="h">بطاقة التتبع الفردية — الدعم الممتد ${esc(MK.syDash(sy))}</div><div class="g"><div>الاسم: <b>${esc(p[0] || '..........')}</b></div><div>رمز مسار: <b dir="ltr">${esc(p[1])}</b></div><div>القسم: ${esc(p[2])}</div><div>المادة: <b>${esc(p[3])}</b></div><div>المجموعة: ${esc(p[4])}</div><div>المستوى عند البداية: <b>${esc(p[5])}</b></div></div>
        <table><tr><th>التقويم</th><th>التاريخ</th><th>المستوى</th><th>ملاحظات</th></tr>${['المرحلة 1', 'المرحلة 2', 'المرحلة 3', 'نهاية الدعم'].map((x, i) => `<tr><td>${x}</td><td></td><td>${i === 3 ? esc(p[6] || '') : ''}</td><td></td></tr>`).join('')}</table></div>`;
      const pages = []; for (let i = 0; i < P.length; i += 4) pages.push(`<div class="mk-hdr">${Dx.header(s)}</div><div class="sp-cards">${P.slice(i, i + 4).map(one).join('')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'sp_assign', t: 'تكليف الأساتذة بالدعم الممتد', grp: 'o', d: 'مذكرة تكليف لكل أستاذ(ة) متدخل(ة) بمجموعاته(ا) واستعمال الزمن.', auto: 'الأساتذة والمجموعات', page: 'a4', init: () => ({ who: '', from: '' }),
    defs: (f, sy) => [{ k: 'who', l: 'الأستاذ(ة)', t: 'select', opts: [['', 'كل الأساتذة المتدخلين']].concat(teachers(sy).map(t => [t[0], t[0]])) }, { k: 'from', l: 'ابتداء من', t: 'date' }],
    build: (s, f, sy) => {
      const L = teachers(sy).filter(t => !f.who || t[0] === f.who), pages = [];
      (L.length ? L : [['']]).forEach((t, i) => { const G = groups(sy).filter(g => nm(g[3]) === nm(t[0])); const e = emp(t[0]) || {}; const fem = e.sex === 'F';
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'مذكرة تكليف', 'الدعم الممتد — مؤسسات الريادة'), blocks: [
          { html: `<div class="sb-pv"><p>بناء على المذكرات المنظمة لعملية الدعم الممتد بمؤسسات الريادة، وعلى مقتضيات المشروع المندمج للمؤسسة، يكلف مدير(ة) المؤسسة ${fem ? 'الأستاذة' : 'الأستاذ'}: <b>${esc(t[0] || '..........')}</b> — رقم التأجير: <b>${esc(nm(t[1]) || e.ppr || '..........')}</b></p>
            <p>بتأطير حصص الدعم الممتد لفائدة التلاميذ المستفيدين ابتداء من: <b>${esc(f.from ? K.ldate(f.from) : '..........')}</b> وفق الجدول التالي:</p></div>` },
          tbl(thr(['المجموعة', 'المادة', 'المستوى', 'اليوم', 'التوقيت', 'القاعة']), (G.length ? G : [['', '', '', '', '', '', '']]).map(g => tr([{ t: g[0], c: 'b' }, g[1], g[2], g[4], { t: g[5], c: 'ltr' }, g[6]])), 'big'),
          { html: '<p class="sb-p">ويتعين عليه(ا) تدوين الحصص المنجزة في دفتر تتبع الحصص وتتبع تقدم المتعلمين، وتعتمد الساعات المنجزة في الكشف الشهري للتعويض عن الساعات الإضافية.</p>' }, SB.sign(s, { right: 'توقيع المعني(ة) بالأمر', left: 'توقيع وخاتم مدير(ة) المؤسسة' })] });
        P.forEach((p, j) => pages.push(j || !i ? p : `<div class="docx-pb"></div>${p}`)); });
      return { page: 'a4', pages };
    } });
  add({ k: 'sp_report', t: 'تقرير حول الدعم الممتد', grp: 'o', d: 'تقرير تركيبي: عدد المستفيدين حسب المادة، المجموعات، الساعات المنجزة، تطور المستويات، الصعوبات والاقتراحات (قابل للتحرير في Word).', auto: 'كل معطيات الدعم الممتد', page: 'a4',
    init: () => ({ diff: '', prop: '' }), defs: () => [{ k: 'diff', l: 'الصعوبات', t: 'area', rows: 3 }, { k: 'prop', l: 'الاقتراحات', t: 'area', rows: 3 }],
    build: (s, f, sy) => {
      const P = pupils(sy), G = groups(sy), Tt = teachers(sy);
      const hrs = Tt.reduce((a, t) => a + MONTHS.reduce((b, m) => b + hoursOf(sy, t[0], m[0]), 0), 0);
      const prog = sj => { const L = P.filter(p => p[3] === sj), lv = LEVELS[sj] || []; const up = L.filter(p => lv.indexOf(String(p[6]).toLowerCase()) > lv.indexOf(String(p[5]).toLowerCase())).length; return [L.length, up, K.pct(up, L.length, 1)]; };
      return { title: 'تقرير حول الدعم الممتد', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4', sign: dirSign(s), blocks: [
        tbl(thr(['المؤشر', 'القيمة']), [tr([{ t: 'عدد المجموعات', c: 'k' }, G.length]), tr([{ t: 'عدد الأساتذة المتدخلين', c: 'k' }, Tt.length]), tr([{ t: 'عدد المستفيدين (حسب المادة)', c: 'k' }, P.length]), tr([{ t: 'مجموع الساعات المنجزة', c: 'k' }, hrs])], 'big'),
        { before: SB.cap('تطور مستويات المستفيدين'), table: { cls: 'sb-t big', head: thr(['المادة', 'المستفيدون', 'تحسن مستواهم', 'النسبة']), rows: SUBJ.map(sj => tr([{ t: sj, c: 'k' }].concat(prog(sj)))) } },
        { html: `<div class="rp-h">الصعوبات</div><p class="sb-p">${esc(nm(f.diff) || '..............................................................................')}</p><div class="rp-h">الاقتراحات</div><p class="sb-p">${esc(nm(f.prop) || '..............................................................................')}</p>` }] };
    } });

  Dx.modCss += `
  .sp-fr{text-align:center;font-family:Arial,'Liberation Sans',sans-serif;font-size:11pt;line-height:1.55;margin:1mm 0 3mm;border:1.2px solid #1f3864;border-radius:2mm;padding:1.5mm 3mm;background:#eef2fa}
  .tbl.sp-t{direction:ltr}.sp-t td{height:8mm;font-size:9pt}
  .sp-sg{display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm;margin-top:4mm;min-height:24mm;font-family:Arial,'Liberation Sans',sans-serif;font-size:9.6pt;font-weight:700;text-align:center}
  .sp-cards{display:grid;grid-template-columns:1fr 1fr;gap:4mm}.sp-card{border:1.3px solid #1f3864;border-radius:2mm;padding:2mm 3mm;font-size:9.6pt;line-height:1.6}
  .sp-card .h{font-weight:700;color:#1f3864;text-align:center;border-bottom:1px solid #4472c4;margin-bottom:1mm}.sp-card .g{display:grid;grid-template-columns:1fr 1fr;column-gap:3mm}
  .sp-card table{width:100%;border-collapse:collapse;margin-top:1.5mm;font-size:8.6pt}.sp-card th,.sp-card td{border:1px solid #4f7fc4;height:7mm;text-align:center}.sp-card th{background:#d9e2f3}`;

  let CC = null;
  const center = () => CC || (CC = K.center({
    id: 'support', title: 'الدعم الممتد', icon: '🧩', route: 'supportDoc', hubRoute: 'support', docLabel: 'الخطوة / الوثيقة',
    groups: [['d', 'المعطيات (بالترتيب)', 'كل خطوة تُحفظ وتُطبع'], ['o', 'الوثائق والكشوف']], docs: () => DOCS, store: sy => Y(sy), years: () => Object.keys((DB.support || {}).years || {}),
    intro: 'الدعم الممتد بمؤسسات الريادة: أضف الأساتذة المتدخلين (تُملأ معطياتهم والحساب البنكي RIB من بطاقة الموظف)، ثم المجموعات والتلاميذ المستفيدين (من نتائج استثمار الروائز)، وسجّل الحصص في دفتر الحصص أو الساعات مباشرة؛ ويُستخرج الكشف الشهري للساعات الإضافية بنفس نموذج المديرية جاهزا للطباعة أو Word.',
    hubButtons: () => (window.Cyc && Cyc.isSec() ? '' : `<button class="btn" id="spRoaiz">${ic('target')} استثمار الروائز</button>`),
    onHub: v => { const b = $('#spRoaiz', v); if (b) b.onclick = () => go('roaiz'); }
  }));
  window.Support = { migrate, DOCS: () => DOCS, hoursOf };
  window.pageSupport = (v, a) => { migrate(DB); center().hub(v, a); };
  window.pageSupportDoc = (v, a) => { migrate(DB); center().doc(v, a); };
})();
