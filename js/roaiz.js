'use strict';
/* استثمار الروائز — exploitation of the placement tests (روائز الموضعة) of the Riyada support groups.
   Imports many "Export Groupe de Soutien" Excel files at once, then shows, for each subject, the
   distribution of pupils across the TARL parcours levels by gender, with percentages, charts and printable reports. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const today = () => Dx.todayIso();

  // subjects and their ordered parcours categories (weakest -> strongest)
  const SUBJ = [
    { k: 'ar', name: 'اللغة العربية', order: ['مبتدئ', 'حرف', 'مقطع', 'كلمة', 'جملة', 'فقرة', 'أقصوصة', 'نص'] },
    { k: 'fr', name: 'اللغة الفرنسية', order: ['débutant', 'lettre', 'graphème complexe', 'syllabe', 'mot simple', 'mot avancé', 'phrase (d.p)', 'phrase', 'texte'] },
    { k: 'math', name: 'الرياضيات', order: ['مبتدئ', 'رقم واحد', 'رقمان', 'جمع', 'طرح', 'ضرب', 'قسمة', 'مسألة', 'تحدي'] }
  ];
  const SUBJ_BY = Object.fromEntries(SUBJ.map(s => [s.k, s]));
  const norm = v => String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, ' ');
  const orderIdx = (s, cat) => { const i = s.order.indexOf(norm(cat)); return i < 0 ? 100 + s.order.length : i; };
  // the tests are split into categories: placement tests before / after, and the continuous assessment of stages 1..6
  const STG = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
  const PH = [{ k: 'pre', n: 'روائز الموضعة القبلية', s: 'الموضعة القبلية', c: '#c0392b' }, { k: 'post', n: 'روائز الموضعة البعدية', s: 'الموضعة البعدية', c: '#27ae60' }]
    .concat(STG.map((w, i) => ({ k: 'c' + (i + 1), n: `المراقبة المستمرة — المرحلة ${w}`, s: `المرحلة ${i + 1}`, c: ['#2e86c1', '#8e44ad', '#e67e22', '#16a085', '#d4ac0d', '#7f8c8d'][i] })));
  const PH_BY = Object.fromEntries(PH.map(p => [p.k, p]));
  // 1.9.4: the placement tests (before / after) and the six continuous-assessment stages are two separate families: never mixed
  const famOf = k => (/^c\d/.test(k || '') ? 'cc' : 'pp');
  const phOf = k => PH_BY[k] || PH[0];
  const STG_RX = [/(?:^|[^\d])1(?!\d)|أولى|اولى|1\s*(?:ère|ere|re)/i, /(?:^|[^\d])2(?!\d)|ثانية|ثانيه|2\s*(?:ème|eme)/i, /(?:^|[^\d])3(?!\d)|ثالثة|ثالثه|3\s*(?:ème|eme)/i, /(?:^|[^\d])4(?!\d)|رابعة|رابعه|4\s*(?:ème|eme)/i, /(?:^|[^\d])5(?!\d)|خامسة|خامسه|5\s*(?:ème|eme)/i, /(?:^|[^\d])6(?!\d)|سادسة|سادسه|6\s*(?:ème|eme)/i];
  // phase of a file from its name / sheet name / the rows above the table ('' when nothing says it)
  function detectPhase(...texts) {
    const t = texts.join(' ');
    const m = t.match(/(?:المرحلة|مرحلة|étape|etape|phase)\s*(?:ال)?\s*([^\s،,;:()\-_.]{1,12})/i);
    if (m) { const i = STG_RX.findIndex(rx => rx.test(m[1])); if (i >= 0) return 'c' + (i + 1); }
    if (/(?:ال)?قبلي(?:ة)?|pr[eé][\s_-]?(?:test|positionnement|evaluation)|diagnostic/i.test(t)) return 'pre';
    if (/(?:ال)?بعدي(?:ة)?|post[\s_-]?(?:test|positionnement|evaluation)/i.test(t)) return 'post';
    return '';
  }
  const COLORS = ['#c0392b', '#e67e22', '#e3b505', '#2e86c1', '#27ae60', '#8e44ad', '#16a085', '#7f8c8d'];

  function migrate(db) {
    const r = db.roaiz = db.roaiz || {};
    r.years = r.years && typeof r.years === 'object' ? r.years : {};
    Object.keys(r.years).forEach(y => (r.years[y] || []).forEach(g => { if (!g.phase || !PH_BY[g.phase]) g.phase = 'pre'; }));
  }
  window.Roaiz = { importFiles: () => importFiles(), migrate, summary, dashModel: (sy, f, phase, by) => dashModel(sy, f || {}, phase, by || 'subj') };
  const RD = () => DB.roaiz;
  const syDash = sy => String(sy || '').replace('/', '-');
  const curSy = () => window.MK ? MK.curSy() : '';
  const groupsAll = sy => RD().years[sy] || [];
  const groupsOf = sy => groupsAll(sy);
  const groupsIn = (sy, ph) => groupsOf(sy).filter(g => g.phase === ph);
  const years = () => MK.syList(Object.keys(RD().years));
  const gender = g => /^(أنثى|انثى|أنثي|انثي|f|fille|féminin|feminin|ث)$/i.test(String(g || '').trim()) ? 'أنثى' : /^(ذكر|m|garçon|garcon|masculin|ذ)$/i.test(String(g || '').trim()) ? 'ذكر' : '';
  const ORD = { 1: 'الأول', 2: 'الثاني', 3: 'الثالث', 4: 'الرابع', 5: 'الخامس', 6: 'السادس' };
  const levelFromSheet = n => { const ds = (String(n || '').match(/(\d)\s*AP/gi) || []).map(x => +x.match(/\d/)[0]); return ds.length ? ds.map(d => ORD[d] || d).join(' و') : String(n || '').replace(/^TARL-?/i, '').trim(); };


  /* ---------- import ---------- */
  function parseSheet(rows) {
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 30) && hi < 0; i++) if ((rows[i] || []).some(c => String(c).trim() === 'رقم التلميذ')) hi = i;
    if (hi < 0) return null;
    const head = {}; (rows[hi] || []).forEach((c, j) => { const t = String(c == null ? '' : c).trim(); if (t && head[t] == null) head[t] = j; });
    const idc = head['رقم التلميذ'], nmc = head['الإسم الكامل'] != null ? head['الإسم الكامل'] : head['الاسم الكامل'], gc = head['النوع'];
    const sc = { ar: head['اللغة العربية'], fr: head['اللغة الفرنسية'], math: head['الرياضيات'] };
    if (idc == null) return null;
    // 1.9.4: «Résultats de Soutien des élèves» (ListResultSoutien): the subjects are on the row above, one column per category marked «X»,
    // the kind of test in «نوع الاختبار» (رائز الموضعة القبلي / البعدي) and the group of levels in «مجموعة الاختبار»
    if (sc.ar == null && sc.fr == null && sc.math == null) return (rows[hi] || []).some(c => /رائز الموضعة/.test(String(c))) ? parseDual(rows, hi, idc, nmc) : parseMarks(rows, hi, head, idc, nmc);
    // meta above the header: المؤسسة / السنة الدراسية (value in the next non-empty cell of the same row)
    const meta = lbl => { for (let i = 0; i < hi; i++) { const row = rows[i] || []; for (let j = 0; j < row.length; j++) { if (String(row[j]).trim() === lbl) { for (let k = j + 1; k < row.length; k++) { const v = String(row[k] == null ? '' : row[k]).trim(); if (v) return v; } } } } return ''; };
    // parcours row (contains "parcours" / "المسار") just above the header
    let pr = -1; for (let i = Math.max(0, hi - 4); i < hi; i++) if ((rows[i] || []).some(c => /parcours|المسار/i.test(String(c)))) pr = i;
    const parc = k => { const j = sc[k]; return pr >= 0 && j != null ? String((rows[pr] || [])[j] == null ? '' : (rows[pr] || [])[j]).trim() : ''; };
    const pupils = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const row = rows[i] || [];
      const id = String(row[idc] == null ? '' : row[idc]).trim();
      if (!id || id === 'رقم التلميذ') continue;
      const name = nmc != null ? String(row[nmc] == null ? '' : row[nmc]).trim() : '';
      if (!name) continue;
      const val = k => sc[k] != null ? String(row[sc[k]] == null ? '' : row[sc[k]]).trim() : '';
      pupils.push({ id, name, g: gender(gc != null ? row[gc] : ''), ar: val('ar'), fr: val('fr'), math: val('math') });
    }
    const top = rows.slice(0, hi + 1).map(r => (r || []).join(' ')).join(' ');
    return { top, unit: meta('المؤسسة'), sy: meta('السنة الدراسية'), parcours: { ar: parc('ar'), fr: parc('fr'), math: parc('math') }, pupils };
  }

  function parseMarks(rows, hi, head, idc, nmc) {
    const top = rows[hi - 1] || [], cats = rows[hi] || [], txt = c => String(c == null ? '' : c).trim();
    const KEYS = [['ar', /^اللغة العربية$/], ['fr', /^اللغة الفرنسية$/], ['math', /^الرياضيات$/]];
    const starts = []; top.forEach((c, j) => { const t = txt(c); if (t) starts.push([j, t]); });
    const spans = {}; KEYS.forEach(([k, rx]) => { const i = starts.findIndex(x => rx.test(x[1])); if (i < 0) return; const a = starts[i][0], b = i + 1 < starts.length ? starts[i + 1][0] : a + 12; spans[k] = []; for (let j = a; j < b; j++) if (txt(cats[j])) spans[k].push([j, txt(cats[j])]); });
    if (!Object.keys(spans).length) return null;
    const absc = starts.find(x => /^الغياب$/.test(x[1])), tc = starts.find(x => /^الأستاذ|^الاستاذ/.test(x[1]));
    const meta = lbl => { for (let i = 0; i < hi; i++) { const row = rows[i] || []; for (let j = 0; j < row.length; j++) { if (txt(row[j]) === lbl) { for (let k = j + 1; k < row.length; k++) { const v = txt(row[k]); if (v) return v; } } } } return ''; };
    const pupils = [];
    for (let i = hi + 1; i < rows.length; i++) {
      const row = rows[i] || [], id = txt(row[idc]); if (!id || id === 'رقم التلميذ') continue;
      const name = nmc != null ? txt(row[nmc]) : ''; if (!name) continue;
      const val = k => { const f = (spans[k] || []).filter(([j]) => /^x$/i.test(txt(row[j]))).pop(); return f ? f[1] : ''; };   // several «X»: the highest category
      pupils.push({ id, name, g: '', ar: val('ar'), fr: val('fr'), math: val('math'), abs: absc ? /^x$/i.test(txt(row[absc[0]])) : false, teacher: tc ? txt(row[tc[0]]) : '', cls: head['القسم'] != null ? txt(row[head['القسم']]) : '' });
    }
    const t = rows.slice(0, hi + 1).map(r => (r || []).join(' ')).join(' ');
    return { top: t + ' ' + meta('نوع الاختبار'), unit: meta('المؤسسة'), sy: meta('السنة الدراسية'), level: meta('مجموعة الاختبار'), parcours: { ar: '', fr: '', math: '' }, pupils };
  }
  // 1.9.4: «ExportNiveauxApprentissage» (sheets TARL-1APG-2APG…): for every subject two columns «رائز الموضعة القبلي» and «رائز الموضعة البعدي»
  // with the category of each pupil, and the level expected for the group («TaRL المستوى المتوقع»): one sheet gives the before AND the after groups
  function parseDual(rows, hi, idc, nmc) {
    const txt = c => String(c == null ? '' : c).trim(), top = rows[hi - 1] || [], H = rows[hi] || [];
    const KEYS = [['ar', /^اللغة العربية$/], ['fr', /^اللغة الفرنسية$/], ['math', /^الرياضيات$/]];
    const starts = []; top.forEach((c, j) => { if (txt(c)) starts.push([j, txt(c)]); });
    const col = { pre: {}, post: {} };
    KEYS.forEach(([k, rx]) => { const i = starts.findIndex(x => rx.test(x[1])); if (i < 0) return; const a = starts[i][0], b = i + 1 < starts.length ? starts[i + 1][0] : a + 3;
      for (let j = a; j < b; j++) { const t = txt(H[j]); if (/القبلي/.test(t)) col.pre[k] = j; else if (/البعدي/.test(t)) col.post[k] = j; } });
    const meta = lbl => { for (let i = 0; i < hi; i++) { const row = rows[i] || []; for (let j = 0; j < row.length; j++) { if (txt(row[j]) === lbl) { for (let k = j + 1; k < row.length; k++) { const v = txt(row[k]); if (v) return v; } } } } return ''; };
    // expected level: the row of «المستوى المتوقع» names the subjects, the next row gives the category
    const parc = { ar: '', fr: '', math: '' };
    const er = rows.findIndex((r, i) => i < hi && (r || []).some(c => /المستوى المتوقع/.test(txt(c))));
    if (er >= 0) (rows[er] || []).forEach((c, j) => { const k = (KEYS.find(([, rx]) => rx.test(txt(c))) || [])[0]; if (k) parc[k] = txt((rows[er + 1] || [])[j]); });
    const mk = ph => { const out = []; for (let i = hi + 1; i < rows.length; i++) { const row = rows[i] || [], id = txt(row[idc]), name = nmc != null ? txt(row[nmc]) : ''; if (!id || !name || id === 'رقم التلميذ') continue;
      const v = k => (col[ph][k] != null ? txt(row[col[ph][k]]) : ''); const p = { id, name, g: '', ar: v('ar'), fr: v('fr'), math: v('math') }; if (p.ar || p.fr || p.math) out.push(p); } return out; };
    const t = rows.slice(0, hi + 1).map(r => (r || []).join(' ')).join(' ');
    return { dual: true, top: t, unit: meta('المؤسسة'), sy: meta('السنة الدراسية'), level: '', parcours: parc, pre: mk('pre'), post: mk('post'), pupils: [{}] };
  }
  // the gender of the pupils of a file without a gender column: from the pupils card (Massar code)
  function fillGender(groups) {
    const P = window.Pupils && Pupils.people ? Pupils.people(curSy()) : [], by = new Map(P.map(p => [String(p.code).toUpperCase(), p]));
    groups.forEach(g => g.pupils.forEach(p => { if (!p.g) { const q = by.get(String(p.id).toUpperCase()); if (q) p.g = q.g === 'F' ? 'أنثى' : q.g === 'M' ? 'ذكر' : ''; } }));
  }
  async function importFiles() {
    if (!window.api.openTables) return toast('الاستيراد المتعدد غير متوفر في هذه النسخة', true);
    const res = await window.api.openTables();
    if (!res || !res.files) return;
    const groups = [];
    let syFound = '';
    const l1 = [];   // 1.9.4: sheets of the first level test, imported in the same operation
    res.files.forEach(f => {
      (f.sheets || []).forEach(sh => {
        const rows = (sh.rows || []).map(r => (r || []).map(x => x == null ? '' : x));
        const p = parseSheet(rows);
        if (!p || !p.pupils.length) { const q = window.RoaizX && RoaizX.parseL1 ? RoaizX.parseL1(rows, sh.name, f.name, f.b64) : null; if (q) l1.push(q); return; }
        if (!syFound && /^\d{4}\s*\/\s*\d{4}$/.test(p.sy)) syFound = p.sy.replace(/\s/g, '');
        if (p.dual) { ['pre', 'post'].forEach(ph => { if (p[ph].length) groups.push({ id: uid('rg'), file: f.name, sheet: sh.name, phase: ph, unit: p.unit || f.name.replace(/\.xlsx?$/i, ''), level: levelFromSheet(sh.name), parcours: p.parcours, pupils: p[ph] }); }); if (!syFound && /^\d{4}\s*\/\s*\d{4}$/.test(p.sy)) syFound = p.sy.replace(/\s/g, ''); return; }
        groups.push({ id: uid('rg'), file: f.name, sheet: sh.name, phase: detectPhase(f.name, sh.name, p.top), unit: p.unit || f.name.replace(/\.xlsx?$/i, ''), level: levelFromSheet(p.level || sh.name), parcours: p.parcours, pupils: p.pupils });
      });
    });
    fillGender(groups);
    // 1.9.4: the same Massar export downloaded several times (…_1, …_5…) must not double the pupils
    let nDup = 0;
    { const seen = new Set(); const keep = []; groups.forEach(g => { const k = [g.phase, g.unit, g.level, g.pupils.map(x => x.id || x.name).sort().join(',')].join('|'); if (seen.has(k)) { nDup++; return; } seen.add(k); keep.push(g); }); groups.length = 0; keep.forEach(g => groups.push(g)); }
    if (!groups.length && l1.length) {
      const n = RoaizX.applyL1(curSy(), l1); persist(); state.tab = 'l1'; go('roaiz', { tab: 'l1' });
      return toast(`تم استيراد نتائج رائز المستوى الأول: ${l1.filter(q => q.phase !== 'post').length} ملف للتقييم القبلي و${l1.filter(q => q.phase === 'post').length} ملف للتقييم البعدي (تمييز تلقائي من الخانة D4 لملف مسار)`);
    }
    if (!groups.length) return toast(`لم يتم العثور على معطيات الروائز في ${res.files.length} ملف. تأكد من ملفات «Export Groupe de Soutien» أو ملفات مسار: الدعم التربوي TARL ← 6- نتائج رائز الموضعة القبلي والبعدي ← تصدير.${res.errors && res.errors.length ? ' (تعذرت قراءة ' + res.errors.length + ' ملف)' : ''}`, true);
    const sy = syFound || curSy();
    const nP = groups.reduce((s, g) => s + g.pupils.length, 0);
    const units = Array.from(new Set(groups.map(g => g.unit)));
    const undet = groups.filter(g => !g.phase);
    const body = document.createElement('div');
    const phCount = () => PH.map(p => [p, groups.filter(g => g.phase === p.k)]).filter(x => x[1].length);
    body.innerHTML = `<p style="margin:0 0 8px;line-height:1.8">تم العثور على <b>${groups.length}</b> مجموعة دعم (${units.length} وحدة مدرسية، ${nP} تلميذ(ة)) من <b>${res.files.length}</b> ملف، للموسم <b>${esc(syDash(sy))}</b>.</p>
      ${undet.length ? `<div class="fld"><label>${undet.length === groups.length ? 'فئة هذه الروائز' : `فئة الملفات التي لم يتعرف عليها البرنامج (${undet.length})`}</label>
        <select class="inp" id="iPh">${PH.map(p => `<option value="${p.k}" ${p.k === state.phase ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select></div>` : ''}
      ${l1.length ? `<p style="margin:0 0 8px">ونتائج <b>رائز المستوى الأول (تقييم التعليم الأولي)</b>: ${l1.filter(q => q.phase !== 'post').length} ملف قبلي و${l1.filter(q => q.phase === 'post').length} ملف بعدي — ${l1.reduce((t, q) => t + q.pupils.length, 0)} تلميذ(ة) (تُضاف إلى تبويب «المستوى الأول»).</p>` : ''}
      ${nDup ? `<p class="muted" style="margin:0 0 8px;font-size:12.5px">تم تجاهل ${nDup} مجموعة مكررة (نفس الملف مستورد أكثر من مرة).</p>` : ''}
      <div id="iSum" class="muted" style="font-size:12.5px;line-height:1.9"></div>`;
    const sum = () => {
      undet.forEach(g => { g.phase = ($('#iPh', body) || {}).value || state.phase; });
      const lines = phCount().map(([p, a]) => `<div>• <b>${esc(p.n)}</b>: ${a.length} مجموعة (${a.reduce((t, g) => t + g.pupils.length, 0)} تلميذ)${groupsIn(sy, p.k).length ? ` — يوجد حاليا ${groupsIn(sy, p.k).length} مجموعة` : ''}</div>`);
      $('#iSum', body).innerHTML = lines.join('') + (lines.some(x => /يوجد حاليا/.test(x)) ? '<div style="margin-top:4px">اختر «استبدال» لتعويض معطيات هذه الفئات فقط، أو «إضافة» للإبقاء عليها وإضافة المجموعات الجديدة. باقي الفئات لا تُمس.</div>' : '');
    };
    sum();
    if ($('#iPh', body)) $('#iPh', body).onchange = sum;
    const run = mode => {
      sum();
      const ph = new Set(groups.map(g => g.phase));
      const keep = mode === 'add' ? groupsAll(sy) : groupsAll(sy).filter(g => !ph.has(g.phase));
      RD().years[sy] = keep.concat(groups);
      const n1 = l1.length ? RoaizX.applyL1(sy, l1) : 0;
      state.sy = sy; MK.setSy(sy); if (ph.size === 1) state.phase = Array.from(ph)[0]; persist(); go('roaiz');
      toast(`تم استيراد ${groups.length} مجموعة دعم (${nP} تلميذ)${n1 ? ` ونتائج رائز المستوى الأول (${n1} تلميذ)` : ''}`);
    };
    const existing = groupsAll(sy).some(g => groups.some(x => x.phase === g.phase)) || groupsAll(sy).length;
    modal({ title: 'استيراد استثمار الروائز', body, actions: [
      { label: ic('up') + (existing ? ' استبدال' : ' استيراد'), cls: 'pri', onClick: () => run('replace') },
      ...(existing ? [{ label: ic('plus') + ' إضافة', onClick: () => run('add') }] : []),
      { label: 'إلغاء' }] });
  }

  /* ---------- aggregation ---------- */
  const matchG = (g, f) => (!f.phase || g.phase === f.phase) && (!f.unit || g.unit === f.unit) && (!f.level || g.level === f.level);
  function pupilsFor(sy, f) { return groupsOf(sy).filter(g => matchG(g, f)).reduce((a, g) => a.concat(g.pupils.map(p => Object.assign({ unit: g.unit, level: g.level, phase: g.phase }, p))), []); }
  // distribution of one subject: [{cat, m, f, total, pct}], ordered; plus totals
  function distribution(pupils, subjKey) {
    const s = SUBJ_BY[subjKey];
    const map = new Map();
    let m = 0, f = 0, tot = 0;
    pupils.forEach(p => {
      const raw = (p[subjKey] || '').trim(); if (!raw) return;
      const key = norm(raw);
      if (!map.has(key)) map.set(key, { cat: raw, m: 0, f: 0 });
      const e = map.get(key); if (p.g === 'ذكر') { e.m++; m++; } else if (p.g === 'أنثى') { e.f++; f++; } tot++;
    });
    const rows = Array.from(map.values()).map(e => ({ cat: e.cat, m: e.m, f: e.f, total: e.m + e.f }))
      .sort((a, b) => orderIdx(s, a.cat) - orderIdx(s, b.cat) || b.total - a.total);
    rows.forEach(r => { r.pct = tot ? r.total / tot * 100 : 0; });
    return { rows, total: tot, m, f };
  }

  function summary() {
    migrate(DB);
    const sy = curSy();
    const gs = groupsOf(sy);
    const pupils = gs.reduce((a, g) => a.concat(g.pupils), []);
    const units = new Set(gs.map(g => g.unit));
    return { sy, groups: gs.length, units: units.size, pupils: pupils.length, phases: PH.filter(p => gs.some(g => g.phase === p.k)).length };
  }

  /* ================================================================= */
  const state = { tab: 'dash', sy: null, unit: '', level: '', subj: 'ar', phase: 'pre' };
  window.pageRoaiz = function (v, arg) {
    migrate(DB);
    if (arg && arg.tab) state.tab = arg.tab;
    if (arg && arg.phase) state.phase = arg.phase;
    state.sy = curSy();
    const all = groupsOf(state.sy), gs = all.filter(g => g.phase === state.phase), ph = phOf(state.phase);
    const CC = famOf(state.phase) === 'cc';
    const T = CC ? [['dash', 'لوحة القيادة'], ['stats', 'الإحصاء والمبيانات'], ['units', 'حسب الوحدة والمستوى'], ['cats', 'المقارنة بين الفئات'], ['cmp', 'المقارنة بين المراحل'], ['rep6', 'التقارير (كل مرحلة، المقارنة، المراحل الست)']]
      : [['dash', 'لوحة القيادة'], ['stats', 'الإحصاء والمبيانات'], ['lists', 'لوائح مجموعات الدعم'], ['units', 'حسب الوحدة والمستوى'], ['cmp', 'المقارنة بين القبلية والبعدية'], ['evo', 'القبلي والبعدي حسب المستويات'], ['rep6', 'التقارير (القبلية، البعدية، المقارنة)'], ['l1', 'المستوى الأول (رائز المستوى الأول)']];
    if (!T.some(t => t[0] === state.tab)) state.tab = 'dash';
    // 1.9.4: every category has its own colour (big buttons, ✔, message; the whole page takes the colour of the chosen category)
    const nOf = k => all.filter(g => g.phase === k).reduce((t, g) => t + g.pupils.length, 0);
    const chip = p => `<button data-p="${p.k}" class="rz-b ${state.phase === p.k ? 'on' : ''}" style="--c:${p.c};--cl:${p.c}24"><span class="t">${esc(p.s)}</span><span class="n">${nOf(p.k)}</span>${state.phase === p.k ? '<span class="ck">✔</span>' : ''}</button>`;
    const multi = ['cmp', 'evo', 'cats', 'rep6'].includes(state.tab);
    v.innerHTML = `<div class="rz-wrap" style="--stc:${ph.c};--stl:${ph.c}1f"><div class="page-h"><h1>استثمار الروائز <span class="rz-tag">${esc(ph.s)}</span></h1>
        <select class="inp" id="rSy" style="width:auto">${years().map(y => `<option value="${y}" ${y === state.sy ? 'selected' : ''}>الموسم الدراسي ${esc(syDash(y))}</option>`).join('')}</select>
        <span class="sub">${esc(ph.n)}: ${gs.length} مجموعة — ${gs.reduce((s, g) => s + g.pupils.length, 0)} تلميذ(ة)</span><span class="sp"></span>
        <button class="btn" id="rSup">🧩 الدعم الممتد</button>
        <button class="btn" id="rImp">${ic('up')} استيراد ملفات الروائز</button>
        ${all.length ? `<button class="btn pri" id="rPrn">${ic('print')} طباعة الاستثمار</button>` : ''}${gs.length ? ` <button class="btn danger sm" id="rClr">${ic('trash')} مسح هذه الفئة</button>` : ''}</div>
      <div class="rz-phs"><div class="rz-grp"><div class="rz-gt">روائز الموضعة</div><div class="rz-row two" id="rPh1">${PH.slice(0, 2).map(chip).join('')}</div></div>
        <div class="rz-grp"><div class="rz-gt">المراقبة المستمرة — المراحل الست</div><div class="rz-row six" id="rPh2">${PH.slice(2).map(chip).join('')}</div></div></div>
      <div class="rz-msg">${multi ? (CC ? 'هذا التبويب يقارن بين مراحل المراقبة المستمرة فقط (اختر المراحل أسفله)؛ المرحلة المختارة' : 'هذا التبويب يقارن بين الموضعة القبلية والموضعة البعدية فقط؛ الفئة المختارة') : 'تعرض جميع الإحصائيات والمبيانات واللوائح والوثائق الآن'}: <b>${esc(ph.n)}</b> — ${gs.reduce((t, g) => t + g.pupils.length, 0)} تلميذ(ة)</div>
      ${all.length ? MASSAR_STEPS_() : ''}
      ${all.length || state.tab === 'l1' || window.RoaizX ? `<div class="mk-tabs"><div class="seg" id="rTabs">${T.filter(([k]) => all.length || k === 'l1').map(([k, l]) => `<button data-t="${k}" class="${state.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>` : ''}
      <div id="rBody"></div></div>`;
    $('#rSy').onchange = e => { state.sy = e.target.value; MK.setSy(state.sy); state.unit = ''; state.level = ''; go('roaiz'); };
    $('#rImp').onclick = importFiles;
    $('#rSup').onclick = () => go('support');
    if ($('#rPrn')) $('#rPrn').onclick = () => go('roaizDoc', { sy: state.sy, unit: state.tab === 'dash' ? dstate.unit : state.unit, level: state.tab === 'dash' ? dstate.level : state.level, phase: state.phase, kind: state.tab === 'cmp' ? 'cmp' : state.tab === 'evo' ? 'evo' : ['cats', 'rep6'].includes(state.tab) ? 'rep6' : state.tab === 'dash' ? 'dash' : 'stat', stages: CC ? selStages() : null, dash: Object.assign({}, dstate) });
    if ($('#rClr')) $('#rClr').onclick = async () => { if (await confirmBox(`مسح معطيات «${esc(ph.n)}» لموسم <b>${esc(syDash(state.sy))}</b> (باقي الفئات لا تُمس)؟`, 'مسح')) { RD().years[state.sy] = groupsAll(state.sy).filter(g => g.phase !== state.phase); persist(); go('roaiz'); } };
    $$('#rPh1 button, #rPh2 button').forEach(b => b.onclick = () => { const was = famOf(state.phase); state.phase = b.dataset.p; state.unit = ''; state.level = ''; if (famOf(state.phase) !== was) { state.tab = 'dash'; state.stg = null; } go('roaiz'); });
    $$('#rTabs button').forEach(b => b.onclick = () => { state.tab = b.dataset.t; go('roaiz'); });
    if (state.tab === 'l1' && window.RoaizX) return RoaizX.renderL1($('#rBody'));
    if (state.tab === 'cmp' && all.length) return tabCompare($('#rBody'));
    if (state.tab === 'evo' && all.length) return tabEvo($('#rBody'), 'pp');
    if (state.tab === 'cats' && all.length) return tabEvo($('#rBody'), 'cc');
    if (state.tab === 'rep6' && all.length) return tabRep6($('#rBody'));
    if (state.tab === 'dash' && gs.length) { tabDash($('#rBody')); if (!CC) { const h = mergedCard(state.sy, {}); if (h) $('#rBody').insertAdjacentHTML('beforeend', h); } return; }
    if (!gs.length) { $('#rBody').innerHTML = emptyState(); $('#rImpBig') && ($('#rImpBig').onclick = importFiles); return; }
    ({ stats: tabStats, lists: tabLists, units: tabUnits, cmp: tabStats, dash: tabStats })[state.tab]($('#rBody'));
  };
  // the stages chosen for the comparisons and the report (default: the stages with data up to the chosen stage)
  function selStages() {
    const withD = STAGES().filter(p => groupsIn(state.sy, p.k).length).map(p => p.k);
    if (Array.isArray(state.stg)) { const v = state.stg.filter(k => withD.includes(k)); if (v.length) return v; }
    const cur = +String(state.phase).slice(1) || 6;
    const d = withD.filter(k => +k.slice(1) <= cur); return d.length > 1 ? d : withD;
  }
  function stagePicker(b, onChange) {
    const sel = selStages(), box = document.createElement('div'); box.className = 'card rz-pick';
    box.innerHTML = `<div class="card-b"><b>المراحل المعنية بالمقارنة:</b> ${STAGES().map(p => { const has = groupsIn(state.sy, p.k).length; return `<label class="rz-pk ${sel.includes(p.k) ? 'on' : ''} ${has ? '' : 'off'}" style="--c:${p.c}"><input type="checkbox" data-sk="${p.k}" ${sel.includes(p.k) ? 'checked' : ''} ${has ? '' : 'disabled'}> ${esc(p.s)}${has ? '' : ' <small>(لا معطيات)</small>'}</label>`; }).join('')}
      <span class="sp"></span><button class="btn sm" data-sa="prev">المراحل السابقة حتى ${esc(phOf(state.phase).s)}</button><button class="btn sm" data-sa="all">كل المراحل</button></div>`;
    b.prepend(box);
    $$('[data-sk]', box).forEach(c => c.onchange = () => { state.stg = $$('[data-sk]', box).filter(x => x.checked).map(x => x.dataset.sk); go('roaiz'); });
    $$('[data-sa]', box).forEach(x => x.onclick = () => { state.stg = x.dataset.sa === 'all' ? STAGES().map(p => p.k) : null; go('roaiz'); });
  }
  // 1.9.4: the reports: one per category (each stage / before / after) and the comparative reports, each family on its own
  function tabRep6(b) {
    const CC = famOf(state.phase) === 'cc', st = CC ? selStages() : null;
    const card = (t, d, c, act, dis) => `<div class="rz-rep" style="--c:${c}"><div class="t">${t}</div><div class="d">${d}</div><button class="btn sm pri" data-rep='${JSON.stringify(act)}' ${dis ? 'disabled' : ''}>${ic('print')} ${dis ? 'لا توجد معطيات' : 'معاينة وطباعة'}</button></div>`;
    const one = p => card(`تقرير ${esc(p.n.replace('روائز ', ''))}`, 'لوحة القيادة (نسبة التحكم، التوزيع A/B/C/D، الوحدات المدرسية، خلاصات) + جداول ومبيانات كل مادة', p.c, { kind: 'phrep', phase: p.k }, !groupsIn(state.sy, p.k).length);
    const L = CC ? STAGES() : PH.slice(0, 2);
    b.innerHTML = `<div class="card"><div class="card-h"><h3>${CC ? 'تقارير المراقبة المستمرة — تقرير لكل مرحلة' : 'تقارير روائز الموضعة'}</h3></div><div class="card-b rz-reps">${L.map(one).join('')}</div></div>
      <div class="card"><div class="card-h"><h3>التقارير المقارنة</h3></div><div class="card-b rz-reps">${CC
        ? card('تقرير المقارنة بين المراحل المختارة', `المراحل: ${st.map(k => esc(phOf(k).s)).join(' ، ') || '—'} (غيّرها من خانات الاختيار أعلاه)`, '#1f3864', { kind: 'cmp', stages: st }, st.length < 2)
          + card('تقرير المراحل الست', 'تتبع تطور الكفايات: المؤشرات، تطور الفئات A/B/C/D ونسبة التحكم عبر المراحل، حسب المادة والمستوى', '#0e5a4a', { kind: 'rep6', stages: st }, !st.length)
        : card('تقرير المقارنة بين الموضعة القبلية والبعدية', 'لكل مادة: نسبة التلاميذ في كل فئة في الرائزين، مع المبيانات', '#1f3864', { kind: 'cmp' }, !(groupsIn(state.sy, 'pre').length && groupsIn(state.sy, 'post').length))
          + card('رائز المستوى الأول والقبلي والبعدي حسب المستويات', 'نسبة التحكم الموحدة: رائز المستوى الأول (تقييم التعليم الأولي) والموضعة القبلية والبعدية حسب المستويات، ثم التفاصيل لكل مادة', '#0e5a4a', { kind: 'evo' }, !l1M(state.sy) && !l1M(state.sy, 'post') && !(groupsIn(state.sy, 'pre').length || groupsIn(state.sy, 'post').length))}</div></div><div id="r6Body"></div>`;
    if (CC) stagePicker(b);
    $$('[data-rep]', b).forEach(x => x.onclick = () => { const a = JSON.parse(x.dataset.rep); go('roaizDoc', Object.assign({ sy: state.sy, unit: state.unit, phase: a.phase || state.phase, by: 'subj' }, a)); });
    if (CC) tabEvo($('#r6Body'), 'cc', true);
  };

  // 1.9.4: the placement tests (before / after) come from the TaRL support, the six continuous-monitoring stages from the competences file
  { const c = document.createElement('style'); c.textContent = `
    .rz-b .t{white-space:nowrap}.rz-phs{display:grid;grid-template-columns:2.4fr 5fr;gap:12px;margin-bottom:8px}.rz-grp{background:#fff;border:1px solid var(--line,#dfe6e3);border-radius:12px;padding:8px 10px}
    .rz-gt{font-weight:700;font-size:12.5px;color:#46534f;margin-bottom:6px}.rz-row{display:grid;gap:8px}.rz-row.two{grid-template-columns:1fr 1fr}.rz-row.six{grid-template-columns:repeat(6,1fr)}
    .rz-b{position:relative;display:flex;align-items:center;justify-content:space-between;gap:6px;padding:9px 10px;border-radius:10px;border:2px solid var(--c);background:#fff;color:var(--c);cursor:pointer;font-family:inherit;font-weight:700;font-size:13.5px;transition:.15s}
    .rz-b .n{background:var(--cl);border-radius:10px;padding:1px 8px;font-size:12px}.rz-b:hover{background:var(--cl)}
    .rz-b.on{background:var(--c);color:#fff;box-shadow:0 4px 12px rgba(0,0,0,.2);transform:translateY(-1px)}.rz-b.on .n{background:rgba(255,255,255,.28);color:#fff}
    .rz-b .ck{position:absolute;top:-8px;left:-8px;background:#fff;color:var(--c);border:2px solid var(--c);border-radius:50%;width:20px;height:20px;display:flex;align-items:center;justify-content:center;font-size:11px}
    .rz-msg{background:var(--stl);border-right:5px solid var(--stc);border-radius:8px;padding:7px 12px;margin-bottom:10px;font-size:13px}.rz-msg b{color:var(--stc)}
    .rz-tag{display:inline-block;background:var(--stc);color:#fff;border-radius:14px;padding:2px 12px;font-size:14px;vertical-align:middle;margin-right:6px}
    .rz-wrap .seg button.on{background:var(--stc);border-color:var(--stc);color:#fff}.rz-wrap .card{border-top:3px solid var(--stc)}.rz-wrap .tbl thead th{background:var(--stl)}
    .rz-wrap .att-kpis b{color:var(--stc)}
    .rz-reps{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}.rz-rep{border:2px solid var(--c);border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}.rz-rep .t{font-weight:800;color:var(--c);font-size:14px}.rz-rep .d{font-size:12px;color:#555;flex:1;line-height:1.7}.rz-rep .btn{align-self:flex-start}
    .rz-pick .card-b{display:flex;flex-wrap:wrap;gap:8px;align-items:center}.rz-pk{display:inline-flex;align-items:center;gap:4px;border:2px solid var(--c);color:var(--c);border-radius:16px;padding:3px 10px;font-weight:700;font-size:13px;cursor:pointer}.rz-pk.on{background:var(--c);color:#fff}.rz-pk.off{opacity:.45;cursor:default}.rz-pk input{accent-color:#fff}
    @media(max-width:900px){.rz-phs{grid-template-columns:1fr}.rz-row.six{grid-template-columns:repeat(3,1fr)}}`; document.head.appendChild(c); }
  const MASSAR_STEPS_ = () => {
    const st = a => a.map(x => `<span class="st">${x}</span>`).join(' ← ');
    const cc = /^c\d/.test(state.phase || '');
    return `<div class="roz-steps">${ic('list')} <b>مصدر الملفات${cc ? ' (المراقبة المستمرة — المراحل الست)' : ' (روائز الموضعة القبلية والبعدية)'}:</b> اتبع المسار التالي في منظومة مسار:
    ${cc ? st(['التمدرس', 'التقييم', 'ملف الكفايات', 'تصدير واستيراد مستويات التحكم', 'مسك الخانات', 'تصدير البيانات'])
      : st(['الحياة المدرسية', 'الدعم التربوي', 'الدعم التربوي TaRL', 'استيراد وتصدير مستويات التعلم', 'مسك الخانات', 'تصدير'])}،
    ثم استورد الملفات المصدرة هنا بزر «استيراد ملفات الروائز»${cc ? ' واختر المرحلة المعنية' : ''}.</div>`;
  };
  const emptyState = () => `<div class="card"><div class="card-b" style="text-align:center;padding:38px 20px">
      <div style="font-size:40px">📊</div><h3 style="margin:10px 0 6px">${esc(phOf(state.phase).n)}</h3>
      <p class="muted" style="max-width:560px;margin:0 auto 16px;line-height:1.8">استورد ملفات «Export Groupe de Soutien» الخاصة بمجموعات الدعم (يمكن اختيار أكثر من 30 ملف مرة واحدة). يستخرج البرنامج تلقائيا توزيع التلاميذ حسب مسارات كل مادة (اللغة العربية، اللغة الفرنسية، الرياضيات) والجنس، مع النسب والمبيانات.</p>
      <div style="max-width:640px;margin:0 auto 16px;text-align:right">${MASSAR_STEPS_()}</div>
      <button class="btn pri" id="rImpBig">${ic('up')} استيراد ملفات الروائز</button></div></div>`;

  /* ---------- filters bar ---------- */
  function filterBar(b, onChange, allPh) {
    const gs = allPh ? groupsOf(state.sy).filter(g => famOf(g.phase) === famOf(state.phase)) : groupsIn(state.sy, state.phase);
    const units = Array.from(new Set(gs.map(g => g.unit)));
    const levels = Array.from(new Set(gs.filter(g => !state.unit || g.unit === state.unit).map(g => g.level)));
    b.innerHTML = `<div class="toolbar">
        <select class="inp" id="fU" style="width:auto"><option value="">كل الوحدات المدرسية</option>${units.map(u => `<option ${state.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
        <select class="inp" id="fL" style="width:auto"><option value="">كل المستويات</option>${levels.map(l => `<option ${state.level === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <span style="flex:1"></span><span class="muted" id="fCount"></span></div>`;
    $('#fU', b).onchange = e => { state.unit = e.target.value; state.level = ''; onChange(); };
    $('#fL', b).onchange = e => { state.level = e.target.value; onChange(); };
  }

  /* ---------- stats + charts ---------- */
  function tabStats(b) {
    b.innerHTML = `<div class="card" id="rFilt"></div><div id="rStats"></div>`;
    const draw = () => {
      const pupils = pupilsFor(state.sy, state);
      $('#fCount') && ($('#fCount').textContent = `${pupils.length} تلميذ(ة)`);
      const male = pupils.filter(p => p.g === 'ذكر').length, fem = pupils.filter(p => p.g === 'أنثى').length;
      $('#rStats').innerHTML = `<div class="card"><div class="card-b"><div class="att-kpis big">
          <span>عدد التلاميذ: <b>${pupils.length}</b></span><span>ذكور: <b>${male}</b></span><span>إناث: <b>${fem}</b></span>
          <span>مجموعات الدعم: <b>${groupsOf(state.sy).filter(g => matchG(g, state)).length}</b></span></div></div></div>
        ${SUBJ.map(s => subjCard(pupils, s)).join('')}`;
    };
    filterBar($('#rFilt'), draw);
    draw();
  }
  function subjCard(pupils, s) {
    const d = distribution(pupils, s.k);
    if (!d.total) return `<div class="card"><div class="card-h"><h3>${esc(s.name)}</h3></div><div class="card-b"><div class="empty-state">لا توجد معطيات لهذه المادة</div></div></div>`;
    const rows = d.rows.map((r, i) => `<tr><td class="b" style="border-right:4px solid ${COLORS[i % COLORS.length]}">${esc(r.cat)}</td><td class="num">${r.m}</td><td class="num">${r.f}</td><td class="num"><b>${r.total}</b></td><td class="num">${r.pct.toFixed(2)}%</td></tr>`).join('');
    return `<div class="card"><div class="card-h"><h3>${esc(s.name)}</h3><span class="sp" style="flex:1"></span><span class="muted">${d.total} تلميذ(ة) — ذكور ${d.m} / إناث ${d.f}</span></div>
      <div class="card-b"><div class="roz-two"><div><table class="tbl compact"><thead><tr><th>المستوى / الفئة</th><th>ذكور</th><th>إناث</th><th>المجموع</th><th>النسبة %</th></tr></thead>
        <tbody>${rows}<tr class="att-tot"><td>المجموع</td><td class="num">${d.m}</td><td class="num">${d.f}</td><td class="num">${d.total}</td><td class="num">100%</td></tr></tbody></table></div>
        <div>${MK.svgBars(d.rows.map(r => ({ label: r.cat, v: r.pct })), { w: 480, h: 240, fs: d.rows.length > 6 ? 8 : 9.5, color: '#2e86c1', min: 10 })}</div></div></div></div>`;
  }

  /* ---------- per unit / level matrix ---------- */
  function tabUnits(b) {
    b.innerHTML = `<div class="card" id="rFilt2"></div><div id="rMx"></div>`;
    const draw = () => {
      const gs = groupsOf(state.sy).filter(g => matchG(g, state));
      $('#fCount') && ($('#fCount').textContent = `${gs.length} مجموعة`);
      $('#rMx').innerHTML = SUBJ.map(s => {
        const cats = orderedCats(gs.reduce((a, g) => a.concat(g.pupils), []), s);
        if (!cats.length) return '';
        const rowFor = (label, pupils) => { const d = distribution(pupils, s.k); const by = Object.fromEntries(d.rows.map(r => [norm(r.cat), r.total])); return `<tr><td class="b">${esc(label)}</td>${cats.map(c => `<td class="num">${by[norm(c)] || ''}</td>`).join('')}<td class="num"><b>${d.total}</b></td></tr>`; };
        const units = Array.from(new Set(gs.map(g => g.unit)));
        const body = units.map(u => rowFor(u, gs.filter(g => g.unit === u).reduce((a, g) => a.concat(g.pupils), []))).join('');
        return `<div class="card"><div class="card-h"><h3>${esc(s.name)} — حسب الوحدة المدرسية</h3></div><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>الوحدة</th>${cats.map(c => `<th>${esc(c)}</th>`).join('')}<th>المجموع</th></tr></thead>
          <tbody>${body}<tr class="att-tot">${rowFor('المجموع', gs.reduce((a, g) => a.concat(g.pupils), [])).replace('<td class="b">المجموع</td>', '<td>المجموع</td>')}</tbody></table></div></div>`;
      }).join('');
    };
    filterBar($('#rFilt2'), draw);
    draw();
  }
  function orderedCats(pupils, s) { const d = distribution(pupils, s.k); return d.rows.map(r => r.cat); }

  /* ---------- comparison between the categories (before / after / stages) ---------- */
  // [{ p, pupils }] of the categories that have data, in the order pre, post, stage 1..6
  const phasesData = (sy, f) => PH.filter(p => famOf(p.k) === famOf(f.phase || state.phase) && (!f.stages || !f.stages.length || f.stages.includes(p.k)) && groupsIn(sy, p.k).length).map(p => ({ p, pupils: pupilsFor(sy, { phase: p.k, unit: f.unit, level: f.level }) }));
  // for one subject: ordered categories, and per phase { total, by[cat] }
  function cmpSubject(list, s) {
    const dist = list.map(x => distribution(x.pupils, s.k));
    const cats = []; dist.forEach(d => d.rows.forEach(r => { if (!cats.some(c => norm(c) === norm(r.cat))) cats.push(r.cat); }));
    cats.sort((a, b) => orderIdx(s, a) - orderIdx(s, b));
    const by = dist.map(d => Object.fromEntries(d.rows.map(r => [norm(r.cat), r])));
    return { cats, dist, by };
  }
  function tabCompare(b) {
    b.innerHTML = `<div class="card" id="rFilt3"></div><div id="rCmp"></div>`;
    const CC = famOf(state.phase) === 'cc';
    if (CC) stagePicker(b);
    const draw = () => {
      const list = phasesData(state.sy, Object.assign({}, state, { stages: CC ? selStages() : null })).filter(x => x.pupils.length);
      $('#fCount') && ($('#fCount').textContent = `${list.length} فئة بها معطيات`);
      if (list.length < 2) { $('#rCmp').innerHTML = `<div class="card"><div class="card-b empty-state" style="line-height:1.9">${CC ? 'للمقارنة اختر مرحلتين على الأقل من مراحل المراقبة المستمرة (يجب أن تكون معطياتهما مستوردة).' : 'للمقارنة استورد معطيات الموضعة القبلية والموضعة البعدية معا.'}${list.length ? `<br>الفئة المتوفرة حاليا: <b>${esc(list[0].p.n)}</b>` : ''}</div></div>`; return; }
      $('#rCmp').innerHTML = `<div class="card"><div class="card-b"><div class="att-kpis big">${list.map(x => `<span style="border-right:4px solid ${x.p.c}">${esc(x.p.s)}: <b>${x.pupils.length}</b> تلميذ(ة)</span>`).join('')}</div></div></div>`
        + SUBJ.map(s => {
          const c = cmpSubject(list, s);
          if (!c.cats.length) return '';
          const head = `<tr><th rowspan="2">المستوى / الفئة</th>${list.map(x => `<th colspan="2" style="border-bottom:3px solid ${x.p.c}">${esc(x.p.s)}</th>`).join('')}</tr><tr>${list.map(() => '<th>العدد</th><th>%</th>').join('')}</tr>`;
          const rows = c.cats.map(cat => `<tr><td class="b">${esc(cat)}</td>${list.map((x, i) => { const r = c.by[i][norm(cat)]; return `<td class="num">${r ? r.total : ''}</td><td class="num">${r ? r.pct.toFixed(1) : ''}</td>`; }).join('')}</tr>`).join('');
          const tot = `<tr class="att-tot"><td>المجموع</td>${list.map((x, i) => `<td class="num">${c.dist[i].total}</td><td class="num">${c.dist[i].total ? '100' : ''}</td>`).join('')}</tr>`;
          const chart = K.bars(c.cats, list.map((x, i) => ({ name: x.p.s, color: x.p.c, vals: c.cats.map(cat => { const r = c.by[i][norm(cat)]; return r ? +r.pct.toFixed(1) : 0; }) })), { w: 640, h: 230, fs: c.cats.length > 7 ? 8.5 : 10, fmt: v => (v ? v : '') });
          return `<div class="card"><div class="card-h"><h3>${esc(s.name)} — نسبة التلاميذ (%) في كل فئة</h3></div><div class="card-b"><div class="roz-two"><div style="overflow:auto"><table class="tbl compact"><thead>${head}</thead><tbody>${rows}${tot}</tbody></table></div><div>${chart}</div></div></div></div>`;
        }).join('');
    };
    filterBar($('#rFilt3'), draw, true);
    draw();
  }


  /* ---------- 1.9.4: before / after per level, and the competences followed across the six stages ---------- */
  const LV_ORD = ['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'];
  const lvRank = l => { const i = LV_ORD.findIndex(x => String(l || '').startsWith(x)); return i < 0 ? 50 : i; };
  const STAGES = () => PH.filter(p => /^c\d/.test(p.k));
  const sgn = d => (d == null ? '—' : `<bdi dir="ltr">${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)}</bdi>`);
  function evoModel(sy, f) {
    const base = { unit: f.unit || '', g: f.g || '' };
    // all the levels from the first to the sixth are always shown (a level without data shows «—»), then any other level label of the files
    const levels = Array.from(new Set(LV_ORD.concat(groupsOf(sy).filter(g => !base.unit || g.unit === base.unit).map(g => g.level)))).sort((a, b) => lvRank(a) - lvRank(b) || String(a).localeCompare(String(b), 'ar'));
    const hasPre = groupsIn(sy, 'pre').length > 0, hasPost = groupsIn(sy, 'post').length > 0;
    // before / after: per subject, per level: mastery rate, share of the weakest band (D), and the progress
    const pp = SUBJ.map(sj => {
      const rows = levels.map(l => {
        const a = dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'pre'), [sj.k]), b = dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'post'), [sj.k]);
        return { l, a, b, d: a.rate != null && b.rate != null ? b.rate - a.rate : null };
      });
      const a = dstat(dpupils(sy, base, 'pre'), [sj.k]), b = dstat(dpupils(sy, base, 'post'), [sj.k]);
      return { sj, rows, tot: { a, b, d: a.rate != null && b.rate != null ? b.rate - a.rate : null } };
    }).filter(x => x.rows.some(r => r.a.n || r.b.n));
    // the six stages: per subject, the share of pupils at each step of the ladder (the competences), the mastery rate per stage and per level
    const stgAny = STAGES().some(p => groupsIn(sy, p.k).length), stg = stgAny ? STAGES().filter(p => !f.stages || !f.stages.length || f.stages.includes(p.k)) : []; // the six stages are always shown once one of them has data
    const cc = SUBJ.map(sj => {
      const per = stg.map(p => { const pu = dpupils(sy, base, p.k).filter(x => String(x[sj.k] || '').trim()); const d = distribution(pu, sj.k); return { p, d, by: Object.fromEntries(d.rows.map(r => [norm(r.cat), r])), st: dstat(pu, [sj.k]) }; });
      const cats = []; per.forEach(x => x.d.rows.forEach(r => { if (!cats.some(c => norm(c) === norm(r.cat))) cats.push(r.cat); }));
      cats.sort((a, b) => orderIdx(sj, a) - orderIdx(sj, b));
      const lv = levels.map(l => ({ l, v: stg.map(p => dstat(dpupils(sy, Object.assign({}, base, { level: l }), p.k), [sj.k]).rate) })); // all six levels
      return { sj, per, cats, lv };
    }).filter(x => x.cats.length);
    // indicators (all subjects together): mastery, bands, pupils who moved up / stayed / went down on the ladder (same pupil number in both tests)
    const K3 = SUBJ.map(x => x.k);
    const moves = (A, B) => {
      const m = new Map(A.map(p => [String(p.id || '').trim(), p])); const o = { up: 0, same: 0, down: 0, n: 0, pupils: 0 };
      B.forEach(pb => { const pa = m.get(String(pb.id || '').trim()); if (!pa || !String(pb.id || '').trim()) return; let any = false;
        K3.forEach(k => { const sj = SUBJ_BY[k], i = sj.order.indexOf(norm(pa[k])), j = sj.order.indexOf(norm(pb[k])); if (i < 0 || j < 0) return; any = true; o.n++; if (j > i) o.up++; else if (j < i) o.down++; else o.same++; });
        if (any) o.pupils++; });
      ['up', 'same', 'down'].forEach(k => { o['p' + k] = o.n ? o[k] / o.n * 100 : null; });
      return o;
    };
    const ind = { pre: dstat(dpupils(sy, base, 'pre'), K3), post: dstat(dpupils(sy, base, 'post'), K3) };
    ind.gain = ind.pre.rate != null && ind.post.rate != null ? ind.post.rate - ind.pre.rate : null;
    ind.mv = hasPre && hasPost ? moves(dpupils(sy, base, 'pre'), dpupils(sy, base, 'post')) : null;
    ind.lv = levels.map(l => ({ l, a: dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'pre'), K3).rate, b: dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'post'), K3).rate }));
    const st = stg.map(p => Object.assign({ p }, dstat(dpupils(sy, base, p.k), K3))), stD = st.filter(x => x.n);
    const sind = { st, has: stD.length, first: stD[0] || null, last: stD.length > 1 ? stD[stD.length - 1] : null };
    sind.gain = sind.first && sind.last ? sind.last.rate - sind.first.rate : null;
    sind.mv = sind.first && sind.last ? moves(dpupils(sy, base, sind.first.p.k), dpupils(sy, base, sind.last.p.k)) : null;
    sind.lv = levels.map(l => ({ l, v: stg.map(p => dstat(dpupils(sy, Object.assign({}, base, { level: l }), p.k), K3).rate) }));
    return { levels, hasPre, hasPost, pp, stg, cc, ind, sind };
  }
  const kpi = (t, v, c, sub) => `<div class="rz-k" style="border-top:4px solid ${c || '#1f3864'}"><div class="rz-kt">${t}</div><div class="rz-kv" style="color:${c || '#1f3864'}">${v}</div>${sub ? `<div class="rz-ks">${sub}</div>` : ''}</div>`;
  // 1.9.4: the level-one test (تقييم التعليم الأولي) merged with the placement tests: its mastery rate next to the before / after rates
  const l1M = (sy, which) => { try { if (!window.RoaizX || !RoaizX.l1Mastery) return null; const m = RoaizX.l1Mastery(sy, '', which); return m && m.n ? m : null; } catch (_) { return null; } };
  const L1C = '#16a085';
  function l1Parts(sy) {
    const m0 = l1M(sy), m1 = l1M(sy, 'post'), m = m1 || m0; if (!m) return [];
    const kp = `<div class="rz-kpis">${m0 ? kpi('المستوى الأول — التقييم القبلي', pcH(m0.rate), PH_BY.pre.c, `${m0.pupils} تلميذ(ة)${m0.abs ? ` — ${m0.abs} غائب(ة)` : ''}`) : ''}${m1 ? kpi('المستوى الأول — التقييم البعدي', pcH(m1.rate), PH_BY.post.c, `${m1.pupils} تلميذ(ة)`) : ''}${m0 && m1 ? kpi('التطور (نقطة)', sgn(m1.rate - m0.rate), gainC(m1.rate - m0.rate)) : ''}${m.rateF != null ? kpi('الإناث', pcH(m.rateF), '#c2185b') : ''}${m.rateM != null ? kpi('الذكور', pcH(m.rateM), '#1f5fa8') : ''}${m.yes != null ? kpi('استفادوا من التعليم الأولي', pcH(m.yes), '#d35400', `${m.nYes} تلميذ(ة)`) : ''}${m.no != null ? kpi('لم يستفيدوا من التعليم الأولي', pcH(m.no), '#7f8c8d', `${m.nNo} تلميذ(ة)`) : ''}</div>`;
    const D = (m0 || m1).domains.map((d, i) => ({ n: d.n, a: m0 ? m0.domains[i].rate : null, b: m1 ? m1.domains[i].rate : null })).filter(d => d.a != null || d.b != null);
    const ch = K.bars(D.map(d => (d.n.length > 22 ? d.n.slice(0, 21) + '…' : d.n)), [m0 ? { name: 'القبلي', color: PH_BY.pre.c, vals: D.map(d => (d.a == null ? 0 : +d.a.toFixed(1))) } : null, m1 ? { name: 'البعدي', color: PH_BY.post.c, vals: D.map(d => (d.b == null ? 0 : +d.b.toFixed(1))) } : null].filter(Boolean), { w: 600, h: 230, fs: 8.5, fmt: v => (v ? v : '') });
    return [kp, `<div class="rz-one" style="max-width:640px">${ch}<div class="rz-cap">رائز المستوى الأول — نسبة الكفايات المكتسبة حسب المجال (القبلي والبعدي)</div></div>`];
  }
  // one table of the mastery rates of every placement test: level one (L1 test), before and after (TaRL) per level
  function mergedRows(sy, f) {
    const m = l1M(sy), mp = l1M(sy, 'post'), K3 = SUBJ.map(x => x.k), base = { unit: (f && f.unit) || '' };
    const lv = Array.from(new Set(LV_ORD.concat(groupsOf(sy).filter(g => famOf(g.phase) === 'pp').map(g => g.level)))).sort((a, b) => lvRank(a) - lvRank(b));
    const rows = lv.map(l => { const a = dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'pre'), K3), b = dstat(dpupils(sy, Object.assign({}, base, { level: l }), 'post'), K3); const one = lvRank(l) === 0; return { l, l1: one && m ? m.rate : null, l1p: one && mp ? mp.rate : null, a: a.rate, b: b.rate, na: a.pupils, nb: b.pupils, n1: one && m ? m.pupils : 0, n1p: one && mp ? mp.pupils : 0 }; })
      .filter(r => r.l1 != null || r.l1p != null || r.a != null || r.b != null);
    return { rows, m };
  }
  const mergedHead = '<tr><th>المستوى</th><th style="border-bottom:3px solid ' + L1C + '">رائز المستوى الأول — القبلي</th><th style="border-bottom:3px solid ' + L1C + '">رائز المستوى الأول — البعدي</th><th style="border-bottom:3px solid #c0392b">الموضعة القبلية</th><th style="border-bottom:3px solid #27ae60">الموضعة البعدية</th><th>التطور (نقطة)</th></tr>';
  const mergedRow = r => { const first = r.a != null ? r.a : r.l1, last = r.b != null ? r.b : r.l1p, d = first != null && last != null ? last - first : null; return `<tr><td class="b">${esc(r.l)}</td><td class="num">${r.l1 == null ? '—' : pcH(r.l1) + ` <small class="muted">(${r.n1})</small>`}</td><td class="num">${r.l1p == null ? '—' : pcH(r.l1p) + ` <small class="muted">(${r.n1p})</small>`}</td><td class="num">${r.a == null ? '—' : pcH(r.a) + ` <small class="muted">(${r.na})</small>`}</td><td class="num">${r.b == null ? '—' : pcH(r.b) + ` <small class="muted">(${r.nb})</small>`}</td><td class="num"><b>${sgn(d)}</b></td></tr>`; };
  function mergedCard(sy, f) {
    const R = mergedRows(sy, f); if (!R.rows.length) return '';
    const ch = K.bars(R.rows.map(r => r.l), [{ name: 'المستوى الأول القبلي', color: '#76d7c4', vals: R.rows.map(r => (r.l1 == null ? 0 : +r.l1.toFixed(1))) }, { name: 'المستوى الأول البعدي', color: L1C, vals: R.rows.map(r => (r.l1p == null ? 0 : +r.l1p.toFixed(1))) }, { name: 'القبلية', color: PH_BY.pre.c, vals: R.rows.map(r => (r.a == null ? 0 : +r.a.toFixed(1))) }, { name: 'البعدية', color: PH_BY.post.c, vals: R.rows.map(r => (r.b == null ? 0 : +r.b.toFixed(1))) }], { w: 600, h: 220, fs: 10, fmt: v => (v ? v : '') });
    return `<div class="card"><div class="card-h"><h3>نسبة التحكم الموحدة: رائز المستوى الأول والموضعة القبلية والبعدية حسب المستويات</h3></div><div class="card-b">${RZK_CSS}${screenParts(l1Parts(sy))}<div class="roz-two"><div style="overflow:auto"><table class="tbl compact"><thead>${mergedHead}</thead><tbody>${R.rows.map(mergedRow).join('')}</tbody></table><p class="muted" style="font-size:11.5px;line-height:1.7">رائز المستوى الأول: نسبة الكفايات «المكتسبة» (13 كفاية في 6 مجالات). الموضعة: نسبة التحكم في المواد الثلاث. التطور = البعدي − القبلي (للمستوى الأول: رائز المستوى الأول البعدي − القبلي عند غياب روائز الموضعة). يميز البرنامج ملفات القبلي والبعدي تلقائيا: «نوع الاختبار» في ملفات نتائج الدعم، والخانة D4 في ملفات تقييم التعليم الأولي (1 = قبلي، 2 = بعدي).</p></div><div>${ch}</div></div></div></div>`;
  }
  const gainC = d => (d == null ? '#7f8c8d' : d >= 0 ? '#1e8449' : '#c0392b');
  const mvBars = (mv, w) => hbarsSvg([{ label: 'تحسن مستواهم', v: mv.pup, c: '#27ae60' }, { label: 'حافظوا على مستواهم', v: mv.psame, c: '#2e86c1' }, { label: 'تراجع مستواهم', v: mv.pdown, c: '#c0392b' }], { w: w || 480, labW: 140 });
  // indicators as parts: [kpis, chart, chart…] (joined on the screen, one block each in print)
  function ppParts(m) {
    const I = m.ind; if (!I.pre.n && !I.post.n) return [];
    const out = [`<div class="rz-kpis">${kpi('نسبة التحكم — القبلي', pcH(I.pre.rate), PH_BY.pre.c, `${I.pre.pupils} تلميذ(ة)`)}${kpi('نسبة التحكم — البعدي', pcH(I.post.rate), PH_BY.post.c, `${I.post.pupils} تلميذ(ة)`)}${kpi('الربح (نقطة)', sgn(I.gain), gainC(I.gain))}${kpi('الفئة D (الأضعف) — البعدي', `${pcH(I.post.pD)}`, '#c0392b', `القبلي: ${pcH(I.pre.pD)}`)}${I.mv && I.mv.n ? kpi('تحسن مستواهم', pcH(I.mv.pup), '#27ae60', `${I.mv.pupils} تلميذ(ة) في الرائزين`) : ''}</div>`];
    out.push(`<div class="rz-one">${K.bars(I.lv.map(x => x.l), [{ name: 'القبلي', color: PH_BY.pre.c, vals: I.lv.map(x => x.a == null ? 0 : +x.a.toFixed(1)) }, { name: 'البعدي', color: PH_BY.post.c, vals: I.lv.map(x => x.b == null ? 0 : +x.b.toFixed(1)) }], { w: 600, h: 220, fs: 10, fmt: v => (v ? v : '') })}<div class="rz-cap">نسبة التحكم الإجمالية (المواد الثلاث) حسب المستوى</div></div>`);
    out.push(`<div class="rz-one">${stackedSvg([Object.assign({ label: 'الموضعة القبلية' }, I.pre), Object.assign({ label: 'الموضعة البعدية' }, I.post)], { w: 560, labW: 150 })}<div class="rz-cap">توزيع النتائج على الفئات A / B / C / D</div></div>`);
    if (I.mv && I.mv.n) out.push(`<div class="rz-one">${mvBars(I.mv)}<div class="rz-cap">حركية التلاميذ بين الرائزين (${I.mv.n} نتيجة لنفس التلميذ في نفس المادة)</div></div>`);
    return out;
  }
  function ccParts(m) {
    const S2 = m.sind; if (!S2.has) return [];
    const evo = lineSvg(S2.st.map(x => ({ t: x.p.s, n: x.n ? x.pupils : null })), BK.map(b => ({ name: 'الفئة ' + b, c: BAND[b].c, vals: S2.st.map(x => x['p' + b]) })).concat([{ name: 'نسبة التحكم', c: '#1f3864', w: 3, dash: '5 3', vals: S2.st.map(x => x.rate), nolabel: true }]), { w: 600, h: 250 });
    const lvs = S2.lv.filter(r => r.v.some(v => v != null));
    const out = [`<div class="rz-kpis">${kpi('المراحل المستوردة', `<bdi dir="ltr">${S2.has} / 6</bdi>`, '#1f3864')}${S2.first ? kpi('نسبة التحكم — ' + S2.first.p.s, pcH(S2.first.rate), S2.first.p.c) : ''}${S2.last ? kpi('نسبة التحكم — ' + S2.last.p.s, pcH(S2.last.rate), S2.last.p.c) : ''}${kpi('التطور (نقطة)', sgn(S2.gain), gainC(S2.gain), S2.last ? `${S2.first.p.s} ← ${S2.last.p.s}` : 'مرحلة واحدة')}${S2.mv && S2.mv.n ? kpi('تحسن مستواهم', pcH(S2.mv.pup), '#27ae60', `${S2.mv.pupils} تلميذ(ة)`) : ''}</div>`,
      `<div class="rz-one">${evo}<div class="rz-cap">تطور الفئات A / B / C / D ونسبة التحكم عبر المراحل الست</div></div>`];
    if (lvs.length) out.push(`<div class="rz-one">${lineSvg(m.stg.map(p => ({ t: p.s })), lvs.map((r, i) => ({ name: r.l, c: ['#2e86c1', '#8e44ad', '#e67e22', '#16a085', '#c0392b', '#7f8c8d'][i % 6], vals: r.v, nolabel: true })), { w: 600, h: 240 })}<div class="rz-cap">تطور نسبة التحكم حسب المستوى عبر المراحل</div></div>`);
    if (S2.mv && S2.mv.n) out.push(`<div class="rz-one">${mvBars(S2.mv)}<div class="rz-cap">حركية التلاميذ بين ${S2.first.p.s} و${S2.last.p.s}</div></div>`);
    return out;
  }
  const screenParts = a => (a.length ? a[0] + `<div class="rz-grid2">${a.slice(1).map(x => `<div>${x}</div>`).join('')}</div>` : '');
  const RZK_CSS = '<style>.rz-grid2{display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));gap:10px;margin-bottom:10px}.rz-kpis{display:flex;flex-wrap:wrap;gap:8px;margin:4px 0 10px}.rz-k{flex:1 1 130px;background:#f7f9fb;border:1px solid #e1e6ea;border-radius:8px;padding:7px 10px;text-align:center}.rz-kt{font-size:11.5px;color:#555}.rz-kv{font-size:20px;font-weight:700;margin-top:2px}.rz-ks{font-size:10.5px;color:#777}@media print{.rz-k{padding:2mm;border-radius:2mm}.rz-kv{font-size:14pt}.rz-kt{font-size:9pt}}</style>';
  const ppChart = (x, w) => K.bars(x.rows.map(r => r.l), [{ name: 'القبلي', color: PH_BY.pre.c, vals: x.rows.map(r => r.a.rate == null ? 0 : +r.a.rate.toFixed(1)) }, { name: 'البعدي', color: PH_BY.post.c, vals: x.rows.map(r => r.b.rate == null ? 0 : +r.b.rate.toFixed(1)) }], { w: w || 600, h: 210, fs: 10, fmt: v => (v ? v : '') });
  const ppHead = '<tr><th rowspan="2">المستوى</th><th colspan="3">الموضعة القبلية</th><th colspan="3">الموضعة البعدية</th><th rowspan="2">تطور نسبة التحكم (نقطة)</th></tr><tr><th>التلاميذ</th><th>نسبة التحكم</th><th>الفئة D</th><th>التلاميذ</th><th>نسبة التحكم</th><th>الفئة D</th></tr>';
  const ppRow = (l, r, cls) => `<tr${cls ? ` class="${cls}"` : ''}><td class="b">${esc(l)}</td><td class="num">${r.a.pupils || '—'}</td><td class="num">${pcH(r.a.rate)}</td><td class="num">${pcH(r.a.pD)}</td><td class="num">${r.b.pupils || '—'}</td><td class="num">${pcH(r.b.rate)}</td><td class="num">${pcH(r.b.pD)}</td><td class="num ${r.d == null ? '' : r.d >= 0 ? 'rz-up' : 'rz-dn'}"><b>${sgn(r.d)}</b></td></tr>`;
  const ccHead = (x, first) => `<tr><th>${first}</th>${x.per.map(y => `<th style="border-bottom:3px solid ${y.p.c}">${esc(y.p.s)}</th>`).join('')}${x.per.length > 1 ? '<th>التطور</th>' : ''}</tr>`;
  const ccCatRows = x => x.cats.map(c => { const v = x.per.map(y => (y.by[norm(c)] ? y.by[norm(c)].pct : null)); const f0 = v.find(z => z != null), l0 = [...v].reverse().find(z => z != null); const d = x.per.length > 1 ? (l0 || 0) - (f0 || 0) : null;
    return `<tr><td class="b">${esc(c)}${isMaster(x.sj, c) ? ' ✓' : ''}</td>${v.map(z => `<td class="num">${z == null ? '' : `<bdi dir="ltr">${z.toFixed(1)}%</bdi>`}</td>`).join('')}${x.per.length > 1 ? `<td class="num">${sgn(d)}</td>` : ''}</tr>`; }).join('')
    + `<tr class="att-tot tot"><td>نسبة التحكم</td>${x.per.map(y => `<td class="num"><b>${pcH(y.st.rate)}</b></td>`).join('')}${x.per.length > 1 ? `<td class="num"><b>${(() => { const v = x.per.map(y => y.st.rate).filter(z => z != null); return sgn(v.length > 1 ? v[v.length - 1] - v[0] : null); })()}</b></td>` : ''}</tr>`
    + `<tr><td class="muted">التلاميذ</td>${x.per.map(y => `<td class="num muted">${y.d.total}</td>`).join('')}${x.per.length > 1 ? '<td></td>' : ''}</tr>`;
  const ccLvRows = x => x.lv.map(r => { const f0 = r.v.find(z => z != null), l0 = [...r.v].reverse().find(z => z != null); return `<tr><td class="b">${esc(r.l)}</td>${r.v.map(z => `<td class="num">${pcH(z)}</td>`).join('')}${x.per.length > 1 ? `<td class="num">${sgn(r.v.filter(z => z != null).length > 1 ? l0 - f0 : null)}</td>` : ''}</tr>`; }).join('');
  const ccChart = (m, w) => lineSvg(m.stg.map(p => ({ t: p.s })), m.cc.map(x => ({ name: x.sj.name.replace('اللغة ', ''), c: SUBJ_COL[x.sj.k], w: 2.4, vals: x.per.map(y => y.st.rate) })), { w: w || 600, h: 240 });
  function tabEvo(b, part, noPick) {
    b.innerHTML = `<div class="card" id="rFiltE"></div><div id="rEvo"></div>`;
    if (part === 'cc' && !noPick) stagePicker(b);
    const draw = () => {
      const m = evoModel(state.sy, Object.assign({}, state, { stages: part === 'cc' ? selStages() : null }));
      $('#fCount') && ($('#fCount').textContent = `${m.levels.length} مستوى`);
      let h = '';
      if (part !== 'cc') { h += `<div class="card"><div class="card-h"><h3>المقارنة بين الموضعة القبلية والبعدية حسب المستويات</h3></div><div class="card-b">`;
      if (!m.hasPre || !m.hasPost) h += `<div class="empty-state" style="line-height:1.9">للمقارنة استورد ملفات الموضعة القبلية والموضعة البعدية معا.${m.hasPre ? ' (المتوفر: القبلية فقط)' : m.hasPost ? ' (المتوفر: البعدية فقط)' : ''}</div>`;
      else h += RZK_CSS + screenParts(ppParts(m)) + m.pp.map(x => `<h4 style="margin:10px 0 6px">${esc(x.sj.name)}</h4><div class="roz-two"><div style="overflow:auto"><table class="tbl compact"><thead>${ppHead}</thead><tbody>${x.rows.map(r => ppRow(r.l, r)).join('')}${ppRow('المجموع', x.tot, 'att-tot')}</tbody></table></div><div>${ppChart(x)}</div></div>`).join('');
      h += '</div></div>'; }
      if (part === 'pp') { $('#rEvo').innerHTML = mergedCard(state.sy, state) + h; return; }
      h += `<div class="card"><div class="card-h"><h3>المقارنة بين الفئات (درجات الكفاية A / B / C / D) عبر مراحل المراقبة المستمرة</h3></div><div class="card-b">`;
      if (!m.stg.length) h += `<div class="empty-state" style="line-height:1.9">لا توجد بعد معطيات المراقبة المستمرة. استورد ملفات كل مرحلة واختر المرحلة المعنية عند الاستيراد.</div>`;
      else {
        h += `<div class="muted" style="font-size:12.5px;margin-bottom:6px">المراحل المتوفرة: ${m.stg.map(p => `<b style="color:${p.c}">${esc(p.s)}</b>`).join(' ، ')} — نسبة التلاميذ في كل درجة من درجات الكفاية (✓ = بلغ عتبة التحكم).</div>`;
        h += RZK_CSS + screenParts(ccParts(m)) + `<div style="max-width:640px">${ccChart(m)}</div><div class="rz-cap">تطور نسبة التحكم حسب المادة عبر المراحل</div>`;
        h += m.cc.map(x => `<h4 style="margin:12px 0 6px">${esc(x.sj.name)}</h4><div class="roz-two"><div style="overflow:auto"><table class="tbl compact"><thead>${ccHead(x, 'درجة الكفاية')}</thead><tbody>${ccCatRows(x)}</tbody></table></div>
          <div style="overflow:auto">${x.lv.length ? `<table class="tbl compact"><thead>${ccHead(x, 'المستوى (نسبة التحكم)')}</thead><tbody>${ccLvRows(x)}</tbody></table>` : ''}</div></div>`).join('');
      }
      $('#rEvo').innerHTML = h + '</div></div>';
    };
    filterBar($('#rFiltE'), draw, true);
    const fl = $('#fL'); if (fl) fl.parentNode && (fl.style.display = 'none');
    draw();
  }
  function evoReport(s, sy, f, part) {
    const m = evoModel(sy, f);
    if (part === 'cc') { m.hasPre = false; m.hasPost = false; }
    if (part === 'pp') { m.stg = []; }
    const blocks = [`<div class="mk-info">الموسم الدراسي: <b>${esc(syDash(sy))}</b>${f.unit ? ' — الوحدة: ' + esc(f.unit) : ''}</div>`];
    if (m.hasPre && m.hasPost) ppParts(m).forEach((h, i) => blocks.push({ html: (i ? '' : RZK_CSS + `<div class="rp-h">مؤشرات المقارنة بين الموضعة القبلية والبعدية</div>`) + (i ? `<div class="c" style="width:140mm;margin:0 auto">${h}</div>` : h) }));
    if (part !== 'cc') { const R = mergedRows(sy, f); if (R.rows.length) {
      l1Parts(sy).forEach((h, i) => blocks.push({ html: (i ? '' : RZK_CSS + '<div class="rp-h">رائز المستوى الأول (تقييم التعليم الأولي) — نسبة التحكم</div>') + (i ? `<div class="c" style="width:140mm;margin:0 auto">${h}</div>` : h) }));
      blocks.push({ before: '<div class="rp-h">نسبة التحكم الموحدة: رائز المستوى الأول والموضعة القبلية والبعدية حسب المستويات</div>', keepNext: true, table: { cls: 'roz-pt', head: mergedHead, rows: R.rows.map(r => mergedRow(r).replace(/ class="num[^"]*"/g, '').replace(/<small class="muted">/g, '<small>')), minRows: 1 } });
    } }
    if (m.hasPre && m.hasPost) m.pp.forEach(x => {
      blocks.push({ before: `<div class="rp-h">المقارنة بين الموضعة القبلية والبعدية حسب المستويات — ${esc(x.sj.name)}</div>`, keepNext: true, table: { cls: 'roz-pt', head: ppHead, rows: x.rows.map(r => ppRow(r.l, r)).concat([ppRow('المجموع', x.tot, 'tot')]).map(r => r.replace(/ class="num[^"]*"/g, '').replace(/<td class="b">/, '<td class="r b">')), minRows: 1 } });
      blocks.push(`<div class="c" style="width:150mm;margin:0 auto">${ppChart(x, 640)}</div>`);
    });
    if (m.stg.length) {
      ccParts(m).forEach((h, i) => blocks.push({ html: (i ? '' : RZK_CSS + `<div class="rp-h">مؤشرات تتبع تطور الكفايات عبر مراحل المراقبة المستمرة</div>`) + (i ? `<div class="c" style="width:140mm;margin:0 auto">${h}</div>` : h) }));
      blocks.push({ html: `<div class="rp-h">تطور نسبة التحكم حسب المادة</div><div class="c" style="width:150mm;margin:0 auto">${ccChart(m, 640)}</div>` });
      m.cc.forEach(x => {
        blocks.push({ before: `<div class="rp-h">${esc(x.sj.name)} — نسبة التلاميذ في كل درجة من درجات الكفاية</div>`, keepNext: true, table: { cls: 'roz-pt', head: ccHead(x, 'درجة الكفاية'), rows: ccCatRows(x).split('</tr>').filter(r => r.trim()).map(r => (r + '</tr>').replace(/ class="num[^"]*"/g, '')), minRows: 1 } });
        if (x.lv.length) blocks.push({ before: `<div class="rp-h">${esc(x.sj.name)} — نسبة التحكم حسب المستوى</div>`, keepNext: true, table: { cls: 'roz-pt', head: ccHead(x, 'المستوى'), rows: ccLvRows(x).split('</tr>').filter(r => r.trim()).map(r => (r + '</tr>').replace(/ class="num[^"]*"/g, '')), minRows: 1 } });
      });
    }
    if (blocks.length === 1) blocks.push('<p style="text-align:center">لا توجد معطيات: استورد ملفات الموضعة القبلية والبعدية أو مراحل المراقبة المستمرة.</p>');
    blocks.push({ html: K.SB.sign(s, { right: "" }) });
    return { page: 'a4', pages: MK.flowPages({ page: 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">${part === 'cc' ? 'تقرير المراحل الست للمراقبة المستمرة — تتبع تطور الكفايات' : part === 'pp' ? 'المقارنة بين الموضعة القبلية والبعدية حسب المستويات' : 'القبلي والبعدي حسب المستويات وتطور الكفايات'}</div>`, blocks }) };
  }

  /* ---------- lists of support groups ---------- */
  function tabLists(b) {
    const gs = groupsIn(state.sy, state.phase);
    b.innerHTML = `<div class="card"><table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>الوحدة المدرسية</th><th>المستوى</th><th>الملف</th><th class="num">التلاميذ</th><th></th></tr></thead><tbody>
      ${gs.map((g, i) => `<tr data-id="${g.id}"><td class="muted num">${i + 1}</td><td><b>${esc(g.unit)}</b></td><td>${esc(g.level)}</td><td class="muted" dir="ltr" style="text-align:right">${esc(g.file)}</td><td class="num">${g.pupils.length}</td>
        <td class="act"><button class="btn sm pri" data-a="print">${ic('print')} لائحة</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $$('tr[data-id]', b).forEach(tr => { const g = gs.find(x => x.id === tr.dataset.id); $('[data-a=print]', tr).onclick = () => go('roaizDoc', { sy: state.sy, groupId: g.id }); });
  }


  /* ================================================================= */
  /* لوحة القيادة (1.9.3) — tableau de bord of the placement tests, inspired by the «Taux de maîtrise» report:
     mastery gauge, mastery rate per subject, evolution of the A / B / C / D rates across the periods (placement tests,
     continuous assessment), stacked distributions (subject / unit / level / support group / gender / period), ranking of the units.
     Filters: year (sidebar), unit, level, support group, period (chips above), subject, gender.
     Definitions (shown on the page): the ladder of each subject (e.g. مبتدئ … نص) is cut into four equal bands, A = the highest quarter … D = the lowest;
     «نسبة التحكم» = share of the results that reach the mastery threshold of the subject (adjustable). */
  const BK = ['A', 'B', 'C', 'D'];
  const BAND = { A: { c: '#27ae60', t: 'A (الربع الأعلى من سلم المسار)' }, B: { c: '#2e86c1', t: 'B' }, C: { c: '#e67e22', t: 'C' }, D: { c: '#c0392b', t: 'D (الربع الأدنى)' } };
  const THR0 = { ar: 'فقرة', fr: 'phrase', math: 'قسمة' };
  const cfgThr = () => { const c = (RD().cfg = RD().cfg && typeof RD().cfg === 'object' ? RD().cfg : {}); c.thr = c.thr && typeof c.thr === 'object' ? c.thr : {}; return c.thr; };
  const thrOf = s => { const v = norm(cfgThr()[s.k] || THR0[s.k]); return s.order.indexOf(v) >= 0 ? v : norm(THR0[s.k]); };
  const bandOf = (s, cat) => { const i = s.order.indexOf(norm(cat)); return i < 0 ? '' : BK[3 - Math.min(3, Math.floor(i * 4 / s.order.length))]; };
  const isMaster = (s, cat) => { const i = s.order.indexOf(norm(cat)); return i >= 0 && i >= s.order.indexOf(thrOf(s)); };
  const dstate = { unit: '', level: '', group: '', subj: '', g: '', by: 'subj' };
  const subjKeys = f => (f.subj ? [f.subj] : SUBJ.map(x => x.k));
  const pc = v => (v == null ? '—' : v.toFixed(1) + '%');
  const pcH = v => (v == null ? '—' : `<bdi dir="ltr">${v.toFixed(1)}%</bdi>`);
  const gLabel = id => { const g = groupsOf(state.sy).find(x => x.id === id); return g ? `${g.unit} — ${g.level}` : ''; };
  // results (pupil x subject) of the selected groups; each result is on the ladder of its subject or ignored
  function dpupils(sy, f, phase) {
    return groupsOf(sy).filter(g => (!phase || g.phase === phase) && (!f.unit || g.unit === f.unit) && (!f.level || g.level === f.level) && (!f.group || g.id === f.group))
      .reduce((a, g) => a.concat(g.pupils.map(p => Object.assign({ unit: g.unit, level: g.level, phase: g.phase, gid: g.id }, p))), []).filter(p => !f.g || p.g === f.g);
  }
  function dstat(pupils, keys) {
    const o = { n: 0, A: 0, B: 0, C: 0, D: 0, mas: 0, pupils: 0, all: pupils.length };
    pupils.forEach(p => {
      let any = false;
      keys.forEach(k => { const sj = SUBJ_BY[k], raw = String(p[k] || '').trim(); if (!raw) return; const b = bandOf(sj, raw); if (!b) return; o.n++; o[b]++; if (isMaster(sj, raw)) o.mas++; any = true; });
      if (any) o.pupils++;
    });
    o.rate = o.n ? o.mas / o.n * 100 : null;
    BK.forEach(b => { o['p' + b] = o.n ? o[b] / o.n * 100 : null; });
    return o;
  }
  const phasesWith = (sy, ph) => PH.filter(p => famOf(p.k) === famOf(ph == null ? state.phase : ph) && groupsIn(sy, p.k).length);

  /* ---- SVG charts (also used by the printed report) ---- */
  const SVG0 = (W, H, cls) => `<svg class="mk-chart ${cls || ''}" viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="MAJ, NSA, sans-serif" direction="ltr">`;
  function gaugeSvg(v, o) {
    o = o || {};
    const W = 260, H = 150, cx = 130, cy = 118, r = 92, sw = 22, has = v != null && isFinite(v);
    const P = a => [cx + r * Math.cos(a), cy - r * Math.sin(a)];
    const arc = (a0, a1) => { const A = P(a0), B = P(a1); return `M${A[0].toFixed(1)} ${A[1].toFixed(1)} A${r} ${r} 0 0 1 ${B[0].toFixed(1)} ${B[1].toFixed(1)}`; };
    const col = !has ? '#bbb' : v < 50 ? '#c0392b' : v < 70 ? '#e67e22' : '#27ae60';
    let s = SVG0(W, H, 'rz-gauge') + `<path d="${arc(Math.PI, 0)}" fill="none" stroke="#e6e9e8" stroke-width="${sw}"/>`;
    if (has && v > 0) s += `<path d="${arc(Math.PI, Math.PI - Math.PI * Math.min(99.99, v) / 100)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    s += `<text x="${cx}" y="${cy - 8}" font-size="30" font-weight="700" text-anchor="middle" fill="${col}">${has ? v.toFixed(1) + '%' : '—'}</text>`;
    s += `<text x="${cx - r}" y="${cy + 16}" font-size="9.5" text-anchor="middle" fill="#666">0%</text><text x="${cx + r}" y="${cy + 16}" font-size="9.5" text-anchor="middle" fill="#666">100%</text>`;
    if (o.label) s += `<text x="${cx}" y="${cy + 14}" font-size="11" text-anchor="middle" direction="rtl" fill="#333">${esc(o.label)}</text>`;
    return s + '</svg>';
  }
  // horizontal bars (percentages), first item at the top; labels on the right (RTL)
  function hbarsSvg(items, o) {
    o = o || {};
    const W = o.w || 520, rowH = o.rowH || 30, padT = 8, labW = o.labW || 150, x0 = 46, x1 = W - labW - 8, H = padT + items.length * rowH + 20;
    let s = SVG0(W, H, 'rz-hbars');
    [0, 25, 50, 75, 100].forEach(t => { const x = x1 - (x1 - x0) * t / 100; s += `<line x1="${x}" x2="${x}" y1="${padT}" y2="${H - 16}" stroke="#e0e4e2" stroke-width="0.8"/><text x="${x}" y="${H - 4}" font-size="8.5" text-anchor="middle" fill="#666">${t}%</text>`; });
    items.forEach((it, i) => {
      const y = padT + i * rowH;
      s += `<text x="${W - 6}" y="${y + rowH / 2 + 4}" font-size="${o.fs || 11}" text-anchor="start" direction="rtl" fill="#111">${esc(it.label)}</text>`;
      if (it.v == null || !isFinite(it.v)) { s += `<text x="${(x0 + x1) / 2}" y="${y + rowH / 2 + 4}" font-size="10" text-anchor="middle" fill="#999">لا معطيات</text>`; return; }
      const L = (x1 - x0) * Math.min(100, Math.max(0, it.v)) / 100;
      s += `<rect x="${x1 - L}" y="${y + 5}" width="${Math.max(1, L)}" height="${rowH - 10}" fill="${it.c || o.color || '#2e86c1'}" rx="2"/><text x="${x1 - L - 4}" y="${y + rowH / 2 + 4}" font-size="10.5" font-weight="700" text-anchor="end" fill="#222">${it.v.toFixed(1)}%</text>`;
    });
    return s + '</svg>';
  }
  // 100% stacked bars of the bands A (right) … D (left)
  function stackedSvg(rows, o) {
    o = o || {};
    const W = o.w || 560, rowH = o.rowH || 30, padT = 6, labW = o.labW || 170, x0 = 14, x1 = W - labW - 8, H = padT + rows.length * rowH + 28;
    let s = SVG0(W, H, 'rz-stack');
    rows.forEach((r, i) => {
      const y = padT + i * rowH, tot = r.n;
      s += `<text x="${W - 6}" y="${y + rowH / 2 + 4}" font-size="${o.fs || 10.5}" text-anchor="start" direction="rtl" fill="#111">${esc(r.label)}</text>`;
      if (!tot) { s += `<text x="${(x0 + x1) / 2}" y="${y + rowH / 2 + 4}" font-size="10" text-anchor="middle" fill="#999">لا معطيات</text>`; return; }
      let x = x1;
      BK.forEach(b => { const w = (x1 - x0) * r[b] / tot; if (!(w > 0)) return; x -= w; s += `<rect x="${x.toFixed(1)}" y="${y + 4}" width="${w.toFixed(1)}" height="${rowH - 8}" fill="${BAND[b].c}"/>`; if (w > 24) s += `<text x="${(x + w / 2).toFixed(1)}" y="${y + rowH / 2 + 3.5}" font-size="9.5" font-weight="700" fill="#fff" text-anchor="middle">${(r[b] / tot * 100).toFixed(0)}%</text>`; });
    });
    BK.forEach((b, j) => { const lx = x1 - j * 52; s += `<rect x="${lx - 10}" y="${H - 16}" width="10" height="10" fill="${BAND[b].c}"/><text x="${lx - 14}" y="${H - 7}" font-size="10" text-anchor="end" fill="#222">${b}</text>`; });
    return s + '</svg>';
  }
  // evolution across the periods; the first period on the right
  function lineSvg(xs, series, o) {
    o = o || {};
    const W = o.w || 560, H = o.h || 250, padL = 36, padR = 14, padT = 14, padB = 56, n = xs.length, step = (W - padL - padR) / Math.max(1, n);
    const X = i => W - padR - step * (i + 0.5), Y = v => padT + (H - padT - padB) * (1 - v / 100);
    let s = SVG0(W, H, 'rz-line');
    [0, 25, 50, 75, 100].forEach(t => { s += `<line x1="${padL}" x2="${W - padR}" y1="${Y(t)}" y2="${Y(t)}" stroke="#e0e4e2" stroke-width="0.8"/><text x="${padL - 4}" y="${Y(t) + 3.5}" font-size="9" text-anchor="end" fill="#666">${t}</text>`; });
    xs.forEach((x, i) => { s += `<text x="${X(i)}" y="${H - padB + 14}" font-size="${n > 6 ? 8.5 : 9.5}" text-anchor="middle" direction="rtl" fill="#111">${esc(x.t)}</text>`; if (x.n != null) s += `<text x="${X(i)}" y="${H - padB + 26}" font-size="8" text-anchor="middle" fill="#777">(${x.n})</text>`; });
    series.forEach(se => {
      let d = '', open = false;
      se.vals.forEach((v, i) => { if (v == null) { open = false; return; } d += `${open ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)} `; open = true; });
      if (d) s += `<path d="${d}" fill="none" stroke="${se.c}" stroke-width="${se.w || 2}"${se.dash ? ` stroke-dasharray="${se.dash}"` : ''}/>`;
      se.vals.forEach((v, i) => { if (v == null) return; s += `<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="${se.w > 2 ? 3.6 : 3}" fill="${se.c}"/>`; if (n <= 8 && !se.nolabel) s += `<text x="${X(i).toFixed(1)}" y="${(Y(v) - 6).toFixed(1)}" font-size="8.5" font-weight="700" text-anchor="middle" fill="${se.c}">${v.toFixed(0)}</text>`; });
    });
    series.forEach((se, j) => { const lx = W - padR - j * 78; s += `<rect x="${lx - 22}" y="${H - 14}" width="14" height="3" fill="${se.c}"/><text x="${lx - 26}" y="${H - 8}" font-size="9.5" text-anchor="start" direction="rtl" fill="#222">${esc(se.name)}</text>`; });
    return s + '</svg>';
  }

  /* ---- model ---- */
  function stackRows(sy, f, phase, by) {
    const keys = subjKeys(f), cur = dpupils(sy, f, phase), mk = (label, pupils, ks) => Object.assign({ label }, dstat(pupils, ks || keys));
    if (by === 'subj') return SUBJ.filter(x => !f.subj || f.subj === x.k).map(x => mk(x.name, cur, [x.k]));
    if (by === 'g') return [['ذكر', 'ذكور'], ['أنثى', 'إناث']].map(([g, l]) => mk(l, cur.filter(p => p.g === g)));
    if (by === 'phase') return phasesWith(sy, phase).map(p => mk(p.s, dpupils(sy, f, p.k)));
    const key = { unit: p => p.unit, level: p => p.level, group: p => p.gid }[by] || (p => p.unit);
    const labels = new Map(); cur.forEach(p => { if (!labels.has(key(p))) labels.set(key(p), by === 'group' ? gLabel(p.gid) : key(p)); });
    return Array.from(labels, ([k, l]) => mk(l, cur.filter(p => key(p) === k))).sort((a, b) => (b.rate == null ? -1 : b.rate) - (a.rate == null ? -1 : a.rate));
  }
  const BY = [['subj', 'المادة'], ['unit', 'الوحدة المدرسية'], ['level', 'المستوى'], ['group', 'مجموعة الدعم'], ['g', 'الجنس'], ['phase', 'الفئة الزمنية']];
  // ranking of the units: mastery per subject, overall, and the progress between the first and the last period
  function unitRows(sy, f, phase) {
    const cur = dpupils(sy, f, phase), units = Array.from(new Set(cur.map(p => p.unit))), phs = phasesWith(sy, phase);
    return units.map(u => {
      const pu = cur.filter(p => K.U.same(p.unit, u));
      const r = { unit: u, pupils: pu.length, all: dstat(pu, subjKeys(f)), subj: SUBJ.map(x => dstat(pu, [x.k]).rate) };
      const ev = phs.map(p => dstat(dpupils(sy, Object.assign({}, f, { unit: u }), p.k), subjKeys(f)).rate).filter(v => v != null);
      r.delta = ev.length > 1 ? ev[ev.length - 1] - ev[0] : null;
      return r;
    }).sort((a, b) => (b.all.rate == null ? -1 : b.all.rate) - (a.all.rate == null ? -1 : a.all.rate));
  }
  function dashModel(sy, f, phase, by) {
    const keys = subjKeys(f), cur = dpupils(sy, f, phase), all = dstat(cur, keys), phs = phasesWith(sy, phase);
    const bySubj = SUBJ.filter(x => !f.subj || f.subj === x.k).map(x => Object.assign({ s: x }, dstat(cur, [x.k])));
    const gend = [['ذكر', 'ذكور'], ['أنثى', 'إناث']].map(([g, l]) => Object.assign({ g, l }, dstat(cur.filter(p => p.g === g), keys)));
    const evo = phs.map(p => Object.assign({ p }, dstat(dpupils(sy, f, p.k), keys)));
    const stack = stackRows(sy, f, phase, by), units = unitRows(sy, f, phase);
    return { keys, cur, all, bySubj, gend, evo, stack, units, phs };
  }
  // sentences written from the figures
  function insights(m, f, phase) {
    const out = [], L = [];
    if (!m.all.n) return ['لا توجد نتائج مصنفة ضمن المرشحات الحالية.'];
    out.push(`نسبة التحكم الإجمالية في «${phOf(phase).n}»: ${pc(m.all.rate)} (${m.all.mas} من ${m.all.n} نتيجة بلغت عتبة التحكم).`);
    const sj = m.bySubj.filter(x => x.rate != null).sort((a, b) => b.rate - a.rate);
    if (sj.length > 1) out.push(`أعلى مادة: ${sj[0].s.name} (${pc(sj[0].rate)})، وأضعفها: ${sj[sj.length - 1].s.name} (${pc(sj[sj.length - 1].rate)}).`);
    const gm = m.gend.filter(x => x.rate != null);
    if (gm.length === 2) { const d = gm[0].rate - gm[1].rate; out.push(Math.abs(d) < 0.5 ? 'لا فرق يذكر بين الذكور والإناث في نسبة التحكم.' : `الفرق بين الجنسين: ${Math.abs(d).toFixed(1)} نقطة لصالح ${d > 0 ? 'الذكور' : 'الإناث'}.`); }
    const ev = m.evo.filter(x => x.rate != null);
    if (ev.length > 1) { const d = ev[ev.length - 1].rate - ev[0].rate; out.push(`التطور من «${ev[0].p.s}» إلى «${ev[ev.length - 1].p.s}»: ${d >= 0 ? '+' : '−'}${Math.abs(d).toFixed(1)} نقطة في نسبة التحكم.`); }
    const un = m.units.filter(x => x.all.rate != null);
    if (un.length > 1) out.push(`أعلى وحدة مدرسية: ${un[0].unit} (${pc(un[0].all.rate)})، وأدناها: ${un[un.length - 1].unit} (${pc(un[un.length - 1].all.rate)}).`);
    if (m.all.pD > 25) out.push(`تنبيه: ${pc(m.all.pD)} من النتائج في الفئة D (الربع الأدنى من السلم)، وهي أولى بالدعم المكثف.`);
    void L;
    return out;
  }
  const SUBJ_COL = { ar: '#2e86c1', fr: '#8e44ad', math: '#e67e22' };
  // the pieces of the dashboard (screen and print)
  function dashParts(sy, f, phase, by, big) {
    const m = dashModel(sy, f, phase, by), W = big ? 430 : 520;
    const evoSeries = BK.map(b => ({ name: 'الفئة ' + b, c: BAND[b].c, vals: m.evo.map(x => x['p' + b]), nolabel: false })).concat([{ name: 'نسبة التحكم', c: '#1f3864', w: 3, dash: '5 3', vals: m.evo.map(x => x.rate), nolabel: true }]);
    const gtxt = m.gend.filter(x => x.n).map(x => `${x.l}: <b>${pcH(x.rate)}</b>`).join(' — ');
    return {
      m,
      kpi: `<div class="att-kpis big"><span>عدد التلاميذ: <b>${m.cur.length}</b></span><span>ذكور: <b>${m.cur.filter(p => p.g === 'ذكر').length}</b></span><span>إناث: <b>${m.cur.filter(p => p.g === 'أنثى').length}</b></span>
        <span>الوحدات المدرسية: <b>${new Set(m.cur.map(p => p.unit)).size}</b></span><span>مجموعات الدعم: <b>${new Set(m.cur.map(p => p.gid)).size}</b></span><span>النتائج المصنفة: <b>${m.all.n}</b></span></div>`,
      gauge: gaugeSvg(m.all.rate, { label: '' }) + `<div class="rz-cap">نسبة التحكم الإجمالية${gtxt ? `<br><small>${gtxt}</small>` : ''}</div>`,
      bars: hbarsSvg(m.bySubj.map(x => ({ label: `${x.s.name}${x.n ? ` (${x.pupils})` : ''}`, v: x.rate, c: SUBJ_COL[x.s.k] })), { w: W, labW: 140 }) + `<div class="rz-cap">نسبة التحكم حسب المادة <small>(عتبة التحكم: ${m.bySubj.map(x => `${x.s.name.replace('اللغة ', '')} ← ${esc((x.s.order[x.s.order.indexOf(thrOf(x.s))] || ''))}`).join(' · ')})</small></div>`,
      evo: m.evo.length ? lineSvg(m.evo.map(x => ({ t: x.p.s, n: x.pupils })), evoSeries, { w: big ? 600 : W + 40, h: 260 }) + `<div class="rz-cap">تطور نسب الفئات A / B / C / D ونسبة التحكم عبر الفئات الزمنية</div>` : '',
      stack: stackedSvg(m.stack, { w: big ? 600 : W + 40, labW: 180 }) + `<div class="rz-cap">توزيع النتائج حسب الفئات A / B / C / D — حسب ${BY.find(x => x[0] === by)[1]}</div>`,
      rank: m.units.length ? `<table class="tbl compact rz-rank"><thead><tr><th>الوحدة المدرسية</th><th>التلاميذ</th>${SUBJ.map(x => `<th>${esc(x.name.replace('اللغة ', ''))}</th>`).join('')}<th>الإجمالي</th><th>التطور</th></tr></thead><tbody>
        ${m.units.map(r => `<tr><td class="b">${esc(r.unit)}</td><td class="num">${r.pupils}</td>${r.subj.map(v => `<td class="num">${pcH(v)}</td>`).join('')}<td class="num"><b>${pcH(r.all.rate)}</b></td><td class="num ${r.delta == null ? '' : r.delta >= 0 ? 'rz-up' : 'rz-dn'}">${r.delta == null ? '—' : `<span dir="ltr">${r.delta >= 0 ? '▲ +' : '▼ −'}${Math.abs(r.delta).toFixed(1)}</span>`}</td></tr>`).join('')}</tbody></table>` : '',
      notes: insights(m, f, phase)
    };
  }
  const DEFS_TXT = 'كيف تُقرأ المؤشرات: يُقسم سلم مسار كل مادة (مثلا مبتدئ ← نص) إلى أربع فئات متساوية: A الربع الأعلى … D الربع الأدنى. «نسبة التحكم» = نسبة النتائج التي بلغت عتبة التحكم للمادة (قابلة للتعديل). تُحتسب النتائج بالزوج (تلميذ، مادة) ولا تدخل الخانات الفارغة أو غير المعروفة.';

  function tabDash(b) {
    const sy = state.sy, f = dstate, phase = state.phase;
    b.innerHTML = `<div class="card" id="rzF"></div><div id="rzB"></div>`;
    const gsAll = groupsOf(sy).filter(g => famOf(g.phase) === famOf(phase));
    const units = Array.from(new Set(gsAll.map(g => g.unit)));
    const levels = Array.from(new Set(gsAll.filter(g => !f.unit || g.unit === f.unit).map(g => g.level)));
    const grps = gsAll.filter(g => g.phase === phase && (!f.unit || g.unit === f.unit) && (!f.level || g.level === f.level));
    if (f.unit && !units.includes(f.unit)) f.unit = '';
    if (f.level && !levels.includes(f.level)) f.level = '';
    const opt = (v, l, cur) => `<option value="${esc(v)}" ${cur === v ? 'selected' : ''}>${esc(l)}</option>`;
    $('#rzF').innerHTML = `<div class="toolbar rz-bar">
        <select class="inp" id="zU" style="width:auto"><option value="">كل الوحدات المدرسية</option>${units.map(u => opt(u, u, f.unit)).join('')}</select>
        <select class="inp" id="zL" style="width:auto"><option value="">كل المستويات</option>${levels.map(l => opt(l, l, f.level)).join('')}</select>
        <select class="inp" id="zG" style="width:auto"><option value="">كل مجموعات الدعم</option>${grps.map(g => opt(g.id, `${g.unit} — ${g.level}`, f.group)).join('')}</select>
        <select class="inp" id="zS" style="width:auto"><option value="">كل المواد</option>${SUBJ.map(x => opt(x.k, x.name, f.subj)).join('')}</select>
        <select class="inp" id="zX" style="width:auto"><option value="">الجنسان</option>${opt('ذكر', 'ذكور', f.g)}${opt('أنثى', 'إناث', f.g)}</select>
        <button class="btn sm" id="zR">↺ إعادة الضبط</button></div>
      <details class="rz-thr"><summary>⚙ عتبة التحكم لكل مادة (المستوى الذي يُعتبر عنده التلميذ متحكما)</summary><div class="rz-thr-b">${SUBJ.map(x => `<label>${esc(x.name)}: <select class="inp" data-thr="${x.k}" style="width:auto">${x.order.map(c => `<option value="${esc(c)}" ${thrOf(x) === c ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></label>`).join('')}</div></details>`;
    const draw = () => {
      const P = dashParts(sy, f, phase, f.by);
      const hasData = P.m.all.n > 0;
      $('#rzB').innerHTML = `${P.kpi.replace('class="att-kpis big"', 'class="att-kpis big rz-kpi card"')}
        ${hasData ? '' : '<div class="card"><div class="card-b empty-state">لا توجد نتائج ضمن هذه المرشحات في «' + esc(phOf(phase).n) + '».</div></div>'}
        <div class="rz-grid"><div class="card rz-c"><div class="card-b">${P.gauge}</div></div><div class="card rz-c"><div class="card-b">${P.bars}</div></div></div>
        ${P.evo ? `<div class="card rz-c"><div class="card-b">${P.evo}</div></div>` : ''}
        <div class="card rz-c"><div class="card-h"><h3>التوزيع حسب الفئات A / B / C / D</h3><span style="flex:1"></span><label class="muted" style="font-size:12.5px">التجميع حسب <select class="inp" id="zBy" style="width:auto">${BY.map(([k, l]) => opt(k, l, f.by)).join('')}</select></label></div><div class="card-b">${P.stack}</div></div>
        ${P.rank ? `<div class="card"><div class="card-h"><h3>ترتيب الوحدات المدرسية</h3></div><div class="card-b" style="overflow:auto">${P.rank}</div></div>` : ''}
        <div class="card"><div class="card-h"><h3>خلاصات</h3></div><div class="card-b"><ul class="rz-notes">${P.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><p class="muted" style="font-size:12px;line-height:1.8;margin:8px 0 0">${esc(DEFS_TXT)}</p></div></div>`;
      $('#zBy', b).onchange = e => { f.by = e.target.value; draw(); };
      $('#fCount') && ($('#fCount').textContent = '');
    };
    const re = () => go('roaiz', { tab: 'dash' });
    $('#zU', b).onchange = e => { f.unit = e.target.value; f.level = ''; f.group = ''; re(); };
    $('#zL', b).onchange = e => { f.level = e.target.value; f.group = ''; re(); };
    $('#zG', b).onchange = e => { f.group = e.target.value; draw(); };
    $('#zS', b).onchange = e => { f.subj = e.target.value; draw(); };
    $('#zX', b).onchange = e => { f.g = e.target.value; draw(); };
    $('#zR', b).onclick = () => { Object.assign(dstate, { unit: '', level: '', group: '', subj: '', g: '' }); re(); };
    $$('[data-thr]', b).forEach(el => el.onchange = () => { cfgThr()[el.dataset.thr] = el.value; persist(); draw(); });
    draw();
  }
  // printed dashboard (A4 portrait)
  function dashReport(s, sy, f, phase, by) {
    const P = dashParts(sy, f, phase, by, true);
    const scope = [f.unit && `الوحدة: ${f.unit}`, f.level && `المستوى: ${f.level}`, f.group && `المجموعة: ${gLabel(f.group)}`, f.subj && `المادة: ${SUBJ_BY[f.subj].name}`, f.g && `الجنس: ${f.g === 'ذكر' ? 'ذكور' : 'إناث'}`].filter(Boolean).join(' — ');
    const blocks = [`<div class="mk-info">الفئة: <b>${esc(phOf(phase).n)}</b> — الموسم الدراسي: <b>${esc(syDash(sy))}</b>${scope ? ' — ' + esc(scope) : ''}</div>`, { html: P.kpi.replace('att-kpis big', 'att-kpi rz-kp') },
      { html: `<div class="rz-row"><div class="rz-col" style="flex:.8">${P.gauge}</div><div class="rz-col" style="flex:1.2">${P.bars}</div></div>` }];
    if (P.evo) blocks.push({ html: `<div class="rz-one">${P.evo}</div>` });
    blocks.push({ html: `<div class="rz-one">${P.stack}</div>` });
    if (by !== 'unit' && P.m.units.length > 1) blocks.push({ html: `<div class="rz-one">${stackedSvg(stackRows(sy, f, phase, 'unit'), { w: 600, labW: 180 })}<div class="rz-cap">توزيع النتائج حسب الفئات — حسب الوحدة المدرسية</div></div>` });
    if (P.rank) blocks.push({ html: '<div class="rp-h">ترتيب الوحدات المدرسية</div>' + P.rank.replace('tbl compact rz-rank', 'rz-pt') });
    blocks.push({ html: `<div class="rz-notes-p"><div class="rp-h">خلاصات</div><ul>${P.notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul><p class="rz-defs">${esc(DEFS_TXT)}</p></div>` });
    return MK.flowPages({ page: 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">لوحة قيادة استثمار الروائز</div>`, blocks });
  }

  /* ================================================================= */
  /* documents */
  const GN = g => g === 'أنثى' ? 'أنثى' : g === 'ذكر' ? 'ذكر' : '';
  // the report of one category: the dashboard (indicators, distribution, units, insights) then the tables and charts of every subject, under one title
  function phaseReport(s, sy, f) {
    const t = `تقرير ${phOf(f.phase).n.replace('روائز ', '')}`;
    const A = dashReport(s, sy, { unit: f.unit, level: f.level, group: '', subj: '', g: '' }, f.phase, f.by || 'subj').map(p => p.replace('لوحة قيادة استثمار الروائز', esc(t) + ' — المؤشرات'));
    const B = statReport(s, sy, f).map(p => p.replace(`استثمار ${esc(phOf(f.phase).n)}`, esc(t) + ' — الجداول والمبيانات حسب المواد'));
    return A.concat(B);
  }
  function statReport(s, sy, f) {
    const pupils = pupilsFor(sy, f);
    const scope = [f.unit && `الوحدة: ${f.unit}`, f.level && `المستوى: ${f.level}`].filter(Boolean).join(' — ');
    const blocks = [`<div class="mk-info">الفئة: <b>${esc(phOf(f.phase).n)}</b> — الموسم الدراسي: <b>${esc(syDash(sy))}</b>${scope ? ' — ' + esc(scope) : ''} — عدد التلاميذ: <b>${pupils.length}</b> (ذكور ${pupils.filter(p => p.g === 'ذكر').length} / إناث ${pupils.filter(p => p.g === 'أنثى').length})</div>`];
    SUBJ.forEach(s2 => {
      const d = distribution(pupils, s2.k);
      if (!d.total) return;
      const rows = d.rows.map((r, i) => `<tr><td class="r b">${esc(r.cat)}</td><td>${r.m}</td><td>${r.f}</td><td><b>${r.total}</b></td><td>${r.pct.toFixed(2)}%</td></tr>`)
        .concat([`<tr class="tot"><td class="r">المجموع</td><td>${d.m}</td><td>${d.f}</td><td>${d.total}</td><td>100%</td></tr>`]);
      blocks.push({ before: `<div class="rp-h">استثمار المعطيات — مادة: ${esc(s2.name)}</div>`, keepNext: true,
        table: { cls: 'roz-pt', head: '<tr><th style="width:34%">المستوى / الفئة</th><th>ذكور</th><th>إناث</th><th>المجموع</th><th>النسبة %</th></tr>', rows, minRows: 1 } });
      blocks.push(`<div class="c">${MK.svgBars(d.rows.map(r => ({ label: r.cat, v: r.pct })), { w: 560, h: 150, fs: d.rows.length > 6 ? 7.5 : 9, color: '#2e86c1', min: 10 })}</div>`);
    });
    return MK.flowPages({ page: 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">استثمار ${esc(phOf(f.phase).n)}</div>`, blocks });
  }
  function listReport(s, g) {
    const rows = g.pupils.map((p, i) => `<tr><td>${i + 1}</td><td class="num" dir="ltr">${esc(p.id)}</td><td class="r b">${esc(p.name)}</td><td>${esc(GN(p.g))}</td><td class="r">${esc(p.ar)}</td><td class="r">${esc(p.fr)}</td><td class="r">${esc(p.math)}</td></tr>`);
    const m = g.pupils.filter(p => p.g === 'ذكر').length, f = g.pupils.filter(p => p.g === 'أنثى').length;
    return MK.flowPages({ page: 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">لائحة مجموعة الدعم</div>
        <div class="mk-info">الوحدة المدرسية: <b>${esc(g.unit)}</b> — المستوى: <b>${esc(g.level)}</b> — الفئة: <b>${esc(phOf(g.phase).n)}</b> — المجموع: <b>${g.pupils.length}</b> (ذكور ${m} / إناث ${f})${g.parcours && (g.parcours.ar || g.parcours.fr || g.parcours.math) ? `<br>المسار: عربية ${esc(g.parcours.ar || '-')} · فرنسية ${esc(g.parcours.fr || '-')} · رياضيات ${esc(g.parcours.math || '-')}` : ''}</div>`,
      blocks: [{ table: { cls: 'roz-pt', head: '<tr><th style="width:6%">ر.ت</th><th style="width:15%">رقم التلميذ</th><th>الإسم الكامل</th><th style="width:8%">النوع</th><th style="width:15%">اللغة العربية</th><th style="width:15%">اللغة الفرنسية</th><th style="width:13%">الرياضيات</th></tr>', rows, minRows: 1 } }] });
  }

  function compareReport(s, sy, f) {
    const list = phasesData(sy, f).filter(x => x.pupils.length);
    const land = list.length > 3;
    const scope = [f.unit && `الوحدة: ${f.unit}`, f.level && `المستوى: ${f.level}`].filter(Boolean).join(' — ');
    const blocks = [`<div class="mk-info">الموسم الدراسي: <b>${esc(syDash(sy))}</b>${scope ? ' — ' + esc(scope) : ''} — ${list.map(x => `${esc(x.p.s)}: <b>${x.pupils.length}</b>`).join(' — ')}</div>`];
    SUBJ.forEach(s2 => {
      const c = cmpSubject(list, s2);
      if (!c.cats.length) return;
      const rows = c.cats.map(cat => `<tr><td class="r b">${esc(cat)}</td>${list.map((x, i) => { const r = c.by[i][norm(cat)]; return `<td>${r ? r.total : ''}</td><td>${r ? r.pct.toFixed(1) + '%' : ''}</td>`; }).join('')}</tr>`)
        .concat([`<tr class="tot"><td class="r">المجموع</td>${list.map((x, i) => `<td>${c.dist[i].total}</td><td>${c.dist[i].total ? '100%' : ''}</td>`).join('')}</tr>`]);
      blocks.push({ before: `<div class="rp-h">مقارنة الفئات — مادة: ${esc(s2.name)}</div>`, keepNext: true,
        table: { cls: 'roz-pt', head: `<tr><th rowspan="2" style="width:22%">المستوى / الفئة</th>${list.map(x => `<th colspan="2">${esc(x.p.s)}</th>`).join('')}</tr><tr>${list.map(() => '<th>العدد</th><th>%</th>').join('')}</tr>`, rows, minRows: 1 } });
      blocks.push(`<div class="c" style="width:150mm;margin:0 auto">${K.bars(c.cats, list.map((x, i) => ({ name: x.p.s, color: x.p.c, vals: c.cats.map(cat => { const r = c.by[i][norm(cat)]; return r ? +r.pct.toFixed(1) : 0; }) })), { w: 640, h: 200, fs: c.cats.length > 7 ? 8 : 9.5, fmt: v => (v ? v : '') })}</div>`);
    });
    return { page: land ? 'a4l' : 'a4', pages: MK.flowPages({ page: land ? 'a4l' : 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">${famOf(f.phase) === 'cc' ? 'المقارنة بين مراحل المراقبة المستمرة' : 'المقارنة بين الموضعة القبلية والموضعة البعدية'}</div>`, blocks }) };
  }

  window.pageRoaizDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    const g0 = arg.groupId ? groupsOf(arg.sy).find(x => x.id === arg.groupId) : null;
    MK.docPage(v, {
      title: g0 ? 'لائحة مجموعة الدعم' : 'استثمار الروائز', icon: '📊', modes: false, flow: true,
      state: { sy: arg.sy || state.sy || curSy(), unit: arg.unit || '', level: arg.level || '', groupId: arg.groupId || '', phase: arg.phase || state.phase || 'pre', stages: arg.stages || null, kind: arg.kind || 'stat', subj: (arg.dash || {}).subj || '', g: (arg.dash || {}).g || '', by: (arg.dash || {}).by || 'subj', group: (arg.dash || {}).group || '' },
      back: () => go('roaiz'),
      form: (box, st, refresh) => {
        if (st.groupId) { box.innerHTML = `<p class="muted" style="line-height:1.8">لائحة مجموعة دعم واحدة. للرجوع إلى الاستثمار العام أغلق هذه الوثيقة.</p>`; return; }
        const gs = st.kind === 'cmp' || st.kind === 'dash' || st.kind === 'evo' ? groupsOf(st.sy) : groupsIn(st.sy, st.phase);
        const units = Array.from(new Set(gs.map(g => g.unit)));
        const levels = Array.from(new Set(gs.filter(g => !st.unit || g.unit === st.unit).map(g => g.level)));
        const cnt = k => groupsIn(st.sy, k).length;
        box.innerHTML = `<div class="sec-t">الوثيقة</div>
          <div class="fld"><select class="inp" id="dK"><option value="phrep" ${st.kind === 'phrep' ? 'selected' : ''}>${famOf(st.phase) === 'cc' ? 'تقرير المرحلة' : 'تقرير الفئة (القبلية أو البعدية)'} (لوحة القيادة + الجداول والمبيانات)</option><option value="stat" ${st.kind === 'stat' ? 'selected' : ''}>استثمار فئة واحدة (جداول ومبيانات)</option><option value="cmp" ${st.kind === 'cmp' ? 'selected' : ''}>${famOf(st.phase) === 'cc' ? 'المقارنة بين المراحل المختارة' : 'المقارنة بين الموضعة القبلية والبعدية'}</option><option value="dash" ${st.kind === 'dash' ? 'selected' : ''}>لوحة القيادة (نسبة التحكم، التطور، التوزيع A/B/C/D)</option>${famOf(st.phase) === 'cc' ? `<option value="rep6" ${st.kind === 'rep6' || st.kind === 'evo' ? 'selected' : ''}>تقرير المراحل الست (تتبع تطور الكفايات)</option>` : `<option value="evo" ${st.kind === 'evo' || st.kind === 'rep6' ? 'selected' : ''}>القبلي والبعدي حسب المستويات</option>`}</select></div>
          ${famOf(st.phase) === 'cc' && ['cmp', 'rep6', 'evo'].includes(st.kind) ? `<div class="fld"><label>المراحل</label><div class="btn-row" style="flex-wrap:wrap">${STAGES().map(p => `<label class="chk"><input type="checkbox" data-dst="${p.k}" ${(st.stages || STAGES().map(x => x.k)).includes(p.k) ? 'checked' : ''} ${groupsIn(st.sy, p.k).length ? '' : 'disabled'}> ${esc(p.s)}</label>`).join('')}</div></div>` : ''}
          ${st.kind === 'stat' || st.kind === 'dash' || st.kind === 'phrep' ? `<div class="fld"><label>${famOf(st.phase) === 'cc' ? 'المرحلة' : 'الفئة'}</label><select class="inp" id="dP">${PH.filter(p => famOf(p.k) === famOf(st.phase)).map(p => `<option value="${p.k}" ${st.phase === p.k ? 'selected' : ''}>${esc(p.n)}${cnt(p.k) ? ` (${cnt(p.k)})` : ' — لا معطيات'}</option>`).join('')}</select></div>` : ''}
          <div class="sec-t">نطاق الاستثمار</div>
          <div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="dU"><option value="">كل الوحدات</option>${units.map(u => `<option ${st.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>
          <div class="fld"><label>المستوى</label><select class="inp" id="dL"><option value="">كل المستويات</option>${levels.map(l => `<option ${st.level === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          ${st.kind === 'dash' ? `<div class="fgrid"><div class="fld"><label>المادة</label><select class="inp" id="dS"><option value="">كل المواد</option>${SUBJ.map(x => `<option value="${x.k}" ${st.subj === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
            <div class="fld"><label>الجنس</label><select class="inp" id="dG"><option value="">الجنسان</option><option value="ذكر" ${st.g === 'ذكر' ? 'selected' : ''}>ذكور</option><option value="أنثى" ${st.g === 'أنثى' ? 'selected' : ''}>إناث</option></select></div></div>
            <div class="fld"><label>تجميع مبيان التوزيع حسب</label><select class="inp" id="dB">${BY.map(([k, l]) => `<option value="${k}" ${st.by === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : ''}
          <p class="muted" style="font-size:12px;line-height:1.7">${st.kind === 'dash' ? 'يُطبع مؤشر نسبة التحكم والنسب حسب المادة وتطور الفئات A/B/C/D عبر الفئات الزمنية وتوزيع النتائج وترتيب الوحدات المدرسية وخلاصات مكتوبة.' : st.kind === 'cmp' ? 'يُطبع لكل مادة جدول يقارن توزيع التلاميذ (العدد والنسبة) بين الفئات التي بها معطيات، مع مبيان.' : 'يُطبع لكل مادة جدول التوزيع حسب المستوى والجنس مع النسب والمبيان.'}</p>`;
        $$('[data-dst]', box).forEach(c => c.onchange = () => { st.stages = $$('[data-dst]', box).filter(x => x.checked).map(x => x.dataset.dst); refresh(); });
        const reopen = () => go('roaizDoc', { sy: st.sy, unit: st.unit, level: st.level, phase: st.phase, kind: st.kind, stages: st.stages, dash: { subj: st.subj, g: st.g, by: st.by, group: st.group } });
        $('#dK', box).onchange = e => { st.kind = e.target.value; st.unit = ''; st.level = ''; reopen(); };
        if ($('#dP', box)) $('#dP', box).onchange = e => { st.phase = e.target.value; st.unit = ''; st.level = ''; reopen(); };
        $('#dU', box).onchange = e => { st.unit = e.target.value; st.level = ''; reopen(); };
        $('#dL', box).onchange = e => { st.level = e.target.value; refresh(); };
        if ($('#dS', box)) { $('#dS', box).onchange = e => { st.subj = e.target.value; refresh(); }; $('#dG', box).onchange = e => { st.g = e.target.value; refresh(); }; $('#dB', box).onchange = e => { st.by = e.target.value; refresh(); }; }
      },
      build: st => (!st.groupId && st.kind === 'phrep' ? { page: 'a4', pages: phaseReport(S(), st.sy, st) } : !st.groupId && (st.kind === 'evo' || st.kind === 'rep6') ? evoReport(S(), st.sy, st, famOf(st.phase) === 'cc' ? 'cc' : 'pp') : !st.groupId && st.kind === 'cmp' ? compareReport(S(), st.sy, st) : { page: 'a4', pages: st.groupId ? listReport(S(), g0) : st.kind === 'dash' ? dashReport(S(), st.sy, { unit: st.unit, level: st.level, group: st.group, subj: st.subj, g: st.g }, st.phase, st.by) : statReport(S(), st.sy, st) }),
      fname: st => st.groupId ? 'لائحة_مجموعة_الدعم' : st.kind === 'phrep' ? 'تقرير_' + phOf(st.phase).n.replace(/\s+/g, '_').replace(/—/g, '') + '_' + syDash(st.sy) : st.kind === 'rep6' || (st.kind === 'evo' && famOf(st.phase) === 'cc') ? 'تقرير_المراحل_الست_' + syDash(st.sy) : st.kind === 'evo' ? 'القبلي_والبعدي_حسب_المستويات_' + syDash(st.sy) : st.kind === 'dash' ? 'لوحة_قيادة_الروائز_' + syDash(st.sy) : (st.kind === 'cmp' ? 'مقارنة_فئات_الروائز_' : 'استثمار_' + phOf(st.phase).s.replace(/\s+/g, '_') + '_') + syDash(st.sy)
    });
  };
})();
