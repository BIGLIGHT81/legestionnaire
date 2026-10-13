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
    { k: 'math', name: 'الرياضيات', order: ['مبتدئ', 'رقم واحد', 'رقمان', 'جمع', 'طرح', 'ضرب', 'قسمة', 'تحدي'] }
  ];
  const SUBJ_BY = Object.fromEntries(SUBJ.map(s => [s.k, s]));
  const norm = v => String(v == null ? '' : v).trim().toLowerCase().replace(/\s+/g, ' ');
  const orderIdx = (s, cat) => { const i = s.order.indexOf(norm(cat)); return i < 0 ? 100 + s.order.length : i; };
  // the tests are split into categories: placement tests before / after, and the continuous assessment of stages 1..6
  const STG = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'];
  const PH = [{ k: 'pre', n: 'روائز الموضعة القبلية', s: 'الموضعة القبلية', c: '#c0392b' }, { k: 'post', n: 'روائز الموضعة البعدية', s: 'الموضعة البعدية', c: '#27ae60' }]
    .concat(STG.map((w, i) => ({ k: 'c' + (i + 1), n: `المراقبة المستمرة — المرحلة ${w}`, s: `المرحلة ${i + 1}`, c: ['#2e86c1', '#8e44ad', '#e67e22', '#16a085', '#d4ac0d', '#7f8c8d'][i] })));
  const PH_BY = Object.fromEntries(PH.map(p => [p.k, p]));
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
  const groupsOf = sy => RD().years[sy] || [];
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
    if (idc == null || (sc.ar == null && sc.fr == null && sc.math == null)) return null;
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
        groups.push({ id: uid('rg'), file: f.name, sheet: sh.name, phase: detectPhase(f.name, sh.name, p.top), unit: p.unit || f.name.replace(/\.xlsx?$/i, ''), level: levelFromSheet(sh.name), parcours: p.parcours, pupils: p.pupils });
      });
    });
    if (!groups.length && l1.length) {
      const n = RoaizX.applyL1(curSy(), l1); persist(); state.tab = 'l1'; go('roaiz', { tab: 'l1' });
      return toast(`تم استيراد نتائج رائز المستوى الأول: ${l1.length} ملف — ${RoaizX.l1Pupils(curSy()).length} تلميذ(ة) في ${(DB.roaizx.years[curSy()].l1.src || []).length} قسم`);
    }
    if (!groups.length) return toast(`لم يتم العثور على معطيات الروائز في ${res.files.length} ملف. تأكد من ملفات «Export Groupe de Soutien».${res.errors && res.errors.length ? ' (تعذرت قراءة ' + res.errors.length + ' ملف)' : ''}`, true);
    const sy = syFound || curSy();
    const nP = groups.reduce((s, g) => s + g.pupils.length, 0);
    const units = Array.from(new Set(groups.map(g => g.unit)));
    const undet = groups.filter(g => !g.phase);
    const body = document.createElement('div');
    const phCount = () => PH.map(p => [p, groups.filter(g => g.phase === p.k)]).filter(x => x[1].length);
    body.innerHTML = `<p style="margin:0 0 8px;line-height:1.8">تم العثور على <b>${groups.length}</b> مجموعة دعم (${units.length} وحدة مدرسية، ${nP} تلميذ(ة)) من <b>${res.files.length}</b> ملف، للموسم <b>${esc(syDash(sy))}</b>.</p>
      ${undet.length ? `<div class="fld"><label>${undet.length === groups.length ? 'فئة هذه الروائز' : `فئة الملفات التي لم يتعرف عليها البرنامج (${undet.length})`}</label>
        <select class="inp" id="iPh">${PH.map(p => `<option value="${p.k}" ${p.k === state.phase ? 'selected' : ''}>${esc(p.n)}</option>`).join('')}</select></div>` : ''}
      ${l1.length ? `<p style="margin:0 0 8px">ونتائج <b>رائز المستوى الأول (تقييم التعليم الأولي)</b>: ${l1.length} قسم — ${l1.reduce((t, q) => t + q.pupils.length, 0)} تلميذ(ة) (تُضاف إلى تبويب «المستوى الأول»).</p>` : ''}
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
      const keep = mode === 'add' ? groupsOf(sy) : groupsOf(sy).filter(g => !ph.has(g.phase));
      RD().years[sy] = keep.concat(groups);
      const n1 = l1.length ? RoaizX.applyL1(sy, l1) : 0;
      state.sy = sy; MK.setSy(sy); if (ph.size === 1) state.phase = Array.from(ph)[0]; persist(); go('roaiz');
      toast(`تم استيراد ${groups.length} مجموعة دعم (${nP} تلميذ)${n1 ? ` ونتائج رائز المستوى الأول (${n1} تلميذ)` : ''}`);
    };
    const existing = groupsOf(sy).some(g => groups.some(x => x.phase === g.phase)) || groupsOf(sy).length;
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
    const T = [['dash', 'لوحة القيادة'], ['stats', 'الإحصاء والمبيانات'], ['lists', 'لوائح مجموعات الدعم'], ['units', 'حسب الوحدة والمستوى'], ['cmp', 'المقارنة بين الفئات'], ['l1', 'المستوى الأول (رائز المستوى الأول)']];
    const dashPh = () => { const l = phasesWith(state.sy).pop(); return l ? l.k : state.phase; };
    const chip = p => { const n = all.filter(g => g.phase === p.k).reduce((t, g) => t + g.pupils.length, 0); return `<button data-p="${p.k}" class="${state.phase === p.k ? 'on' : ''}">${esc(p.s)}${n ? ` <small>${n}</small>` : ''}</button>`; };
    v.innerHTML = `<div class="page-h"><h1>استثمار الروائز</h1>
        <select class="inp" id="rSy" style="width:auto">${years().map(y => `<option value="${y}" ${y === state.sy ? 'selected' : ''}>الموسم الدراسي ${esc(syDash(y))}</option>`).join('')}</select>
        <span class="sub">${esc(ph.n)}: ${gs.length} مجموعة — ${gs.reduce((s, g) => s + g.pupils.length, 0)} تلميذ(ة)</span><span class="sp"></span>
        <button class="btn" id="rSup">🧩 الدعم الممتد</button>
        <button class="btn" id="rImp">${ic('up')} استيراد ملفات الروائز</button>
        ${all.length ? `<button class="btn pri" id="rPrn">${ic('print')} طباعة الاستثمار</button>` : ''}${gs.length ? ` <button class="btn danger sm" id="rClr">${ic('trash')} مسح هذه الفئة</button>` : ''}</div>
      <div class="card roz-ph"><div><b>روائز الموضعة</b><div class="seg" id="rPh1">${PH.slice(0, 2).map(chip).join('')}</div></div>
        <div><b>المراقبة المستمرة</b><div class="seg" id="rPh2">${PH.slice(2).map(chip).join('')}</div></div></div>
      ${all.length || state.tab === 'l1' || window.RoaizX ? `<div class="mk-tabs"><div class="seg" id="rTabs">${T.filter(([k]) => all.length || k === 'l1').map(([k, l]) => `<button data-t="${k}" class="${state.tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>` : ''}
      <div id="rBody"></div>`;
    $('#rSy').onchange = e => { state.sy = e.target.value; MK.setSy(state.sy); state.unit = ''; state.level = ''; go('roaiz'); };
    $('#rImp').onclick = importFiles;
    $('#rSup').onclick = () => go('support');
    if ($('#rPrn')) $('#rPrn').onclick = () => go('roaizDoc', { sy: state.sy, unit: state.tab === 'dash' ? dstate.unit : state.unit, level: state.tab === 'dash' ? dstate.level : state.level, phase: state.phase, kind: state.tab === 'cmp' ? 'cmp' : state.tab === 'dash' ? 'dash' : 'stat', dash: Object.assign({}, dstate) });
    if ($('#rClr')) $('#rClr').onclick = async () => { if (await confirmBox(`مسح معطيات «${esc(ph.n)}» لموسم <b>${esc(syDash(state.sy))}</b> (باقي الفئات لا تُمس)؟`, 'مسح')) { RD().years[state.sy] = all.filter(g => g.phase !== state.phase); persist(); go('roaiz'); } };
    $$('#rPh1 button, #rPh2 button').forEach(b => b.onclick = () => { state.phase = b.dataset.p; state.unit = ''; state.level = ''; go('roaiz'); });
    $$('#rTabs button').forEach(b => b.onclick = () => { state.tab = b.dataset.t; go('roaiz'); });
    if (state.tab === 'l1' && window.RoaizX) return RoaizX.renderL1($('#rBody'));
    if (state.tab === 'cmp' && all.length) return tabCompare($('#rBody'));
    if (state.tab === 'dash' && all.length) { if (!gs.length) { state.phase = dashPh(); return go('roaiz', { tab: 'dash' }); } return tabDash($('#rBody')); }
    if (!gs.length) { $('#rBody').innerHTML = emptyState(); $('#rImpBig') && ($('#rImpBig').onclick = importFiles); return; }
    ({ stats: tabStats, lists: tabLists, units: tabUnits, cmp: tabStats, dash: tabStats })[state.tab]($('#rBody'));
  };

  const emptyState = () => `<div class="card"><div class="card-b" style="text-align:center;padding:38px 20px">
      <div style="font-size:40px">📊</div><h3 style="margin:10px 0 6px">${esc(phOf(state.phase).n)}</h3>
      <p class="muted" style="max-width:560px;margin:0 auto 16px;line-height:1.8">استورد ملفات «Export Groupe de Soutien» الخاصة بمجموعات الدعم (يمكن اختيار أكثر من 30 ملف مرة واحدة). يستخرج البرنامج تلقائيا توزيع التلاميذ حسب مسارات كل مادة (اللغة العربية، اللغة الفرنسية، الرياضيات) والجنس، مع النسب والمبيانات.</p>
      <button class="btn pri" id="rImpBig">${ic('up')} استيراد ملفات الروائز</button></div></div>`;

  /* ---------- filters bar ---------- */
  function filterBar(b, onChange, allPh) {
    const gs = allPh ? groupsOf(state.sy) : groupsIn(state.sy, state.phase);
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
  const phasesData = (sy, f) => PH.filter(p => groupsIn(sy, p.k).length).map(p => ({ p, pupils: pupilsFor(sy, { phase: p.k, unit: f.unit, level: f.level }) }));
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
    const draw = () => {
      const list = phasesData(state.sy, state).filter(x => x.pupils.length);
      $('#fCount') && ($('#fCount').textContent = `${list.length} فئة بها معطيات`);
      if (list.length < 2) { $('#rCmp').innerHTML = `<div class="card"><div class="card-b empty-state" style="line-height:1.9">للمقارنة استورد معطيات فئتين على الأقل (مثلا الموضعة القبلية والموضعة البعدية، أو مراحل المراقبة المستمرة).${list.length ? `<br>الفئة المتوفرة حاليا: <b>${esc(list[0].p.n)}</b>` : ''}</div></div>`; return; }
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
  const phasesWith = sy => PH.filter(p => groupsIn(sy, p.k).length);

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
    if (by === 'phase') return phasesWith(sy).map(p => mk(p.s, dpupils(sy, f, p.k)));
    const key = { unit: p => p.unit, level: p => p.level, group: p => p.gid }[by] || (p => p.unit);
    const labels = new Map(); cur.forEach(p => { if (!labels.has(key(p))) labels.set(key(p), by === 'group' ? gLabel(p.gid) : key(p)); });
    return Array.from(labels, ([k, l]) => mk(l, cur.filter(p => key(p) === k))).sort((a, b) => (b.rate == null ? -1 : b.rate) - (a.rate == null ? -1 : a.rate));
  }
  const BY = [['subj', 'المادة'], ['unit', 'الوحدة المدرسية'], ['level', 'المستوى'], ['group', 'مجموعة الدعم'], ['g', 'الجنس'], ['phase', 'الفئة الزمنية']];
  // ranking of the units: mastery per subject, overall, and the progress between the first and the last period
  function unitRows(sy, f, phase) {
    const cur = dpupils(sy, f, phase), units = Array.from(new Set(cur.map(p => p.unit))), phs = phasesWith(sy);
    return units.map(u => {
      const pu = cur.filter(p => p.unit === u);
      const r = { unit: u, pupils: pu.length, all: dstat(pu, subjKeys(f)), subj: SUBJ.map(x => dstat(pu, [x.k]).rate) };
      const ev = phs.map(p => dstat(dpupils(sy, Object.assign({}, f, { unit: u }), p.k), subjKeys(f)).rate).filter(v => v != null);
      r.delta = ev.length > 1 ? ev[ev.length - 1] - ev[0] : null;
      return r;
    }).sort((a, b) => (b.all.rate == null ? -1 : b.all.rate) - (a.all.rate == null ? -1 : a.all.rate));
  }
  function dashModel(sy, f, phase, by) {
    const keys = subjKeys(f), cur = dpupils(sy, f, phase), all = dstat(cur, keys), phs = phasesWith(sy);
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
    const gsAll = groupsOf(sy);
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
    return { page: land ? 'a4l' : 'a4', pages: MK.flowPages({ page: land ? 'a4l' : 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">المقارنة بين فئات الروائز</div>`, blocks }) };
  }

  window.pageRoaizDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    const g0 = arg.groupId ? groupsOf(arg.sy).find(x => x.id === arg.groupId) : null;
    MK.docPage(v, {
      title: g0 ? 'لائحة مجموعة الدعم' : 'استثمار الروائز', icon: '📊', modes: false, flow: true,
      state: { sy: arg.sy || state.sy || curSy(), unit: arg.unit || '', level: arg.level || '', groupId: arg.groupId || '', phase: arg.phase || state.phase || 'pre', kind: arg.kind || 'stat', subj: (arg.dash || {}).subj || '', g: (arg.dash || {}).g || '', by: (arg.dash || {}).by || 'subj', group: (arg.dash || {}).group || '' },
      back: () => go('roaiz'),
      form: (box, st, refresh) => {
        if (st.groupId) { box.innerHTML = `<p class="muted" style="line-height:1.8">لائحة مجموعة دعم واحدة. للرجوع إلى الاستثمار العام أغلق هذه الوثيقة.</p>`; return; }
        const gs = st.kind === 'cmp' || st.kind === 'dash' ? groupsOf(st.sy) : groupsIn(st.sy, st.phase);
        const units = Array.from(new Set(gs.map(g => g.unit)));
        const levels = Array.from(new Set(gs.filter(g => !st.unit || g.unit === st.unit).map(g => g.level)));
        const cnt = k => groupsIn(st.sy, k).length;
        box.innerHTML = `<div class="sec-t">الوثيقة</div>
          <div class="fld"><select class="inp" id="dK"><option value="stat" ${st.kind === 'stat' ? 'selected' : ''}>استثمار فئة واحدة (جداول ومبيانات)</option><option value="cmp" ${st.kind === 'cmp' ? 'selected' : ''}>المقارنة بين الفئات (قبلي ← بعدي ← المراقبة المستمرة)</option><option value="dash" ${st.kind === 'dash' ? 'selected' : ''}>لوحة القيادة (نسبة التحكم، التطور، التوزيع A/B/C/D)</option></select></div>
          ${st.kind === 'stat' || st.kind === 'dash' ? `<div class="fld"><label>الفئة</label><select class="inp" id="dP">${PH.map(p => `<option value="${p.k}" ${st.phase === p.k ? 'selected' : ''}>${esc(p.n)}${cnt(p.k) ? ` (${cnt(p.k)})` : ' — لا معطيات'}</option>`).join('')}</select></div>` : ''}
          <div class="sec-t">نطاق الاستثمار</div>
          <div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="dU"><option value="">كل الوحدات</option>${units.map(u => `<option ${st.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>
          <div class="fld"><label>المستوى</label><select class="inp" id="dL"><option value="">كل المستويات</option>${levels.map(l => `<option ${st.level === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>
          ${st.kind === 'dash' ? `<div class="fgrid"><div class="fld"><label>المادة</label><select class="inp" id="dS"><option value="">كل المواد</option>${SUBJ.map(x => `<option value="${x.k}" ${st.subj === x.k ? 'selected' : ''}>${esc(x.name)}</option>`).join('')}</select></div>
            <div class="fld"><label>الجنس</label><select class="inp" id="dG"><option value="">الجنسان</option><option value="ذكر" ${st.g === 'ذكر' ? 'selected' : ''}>ذكور</option><option value="أنثى" ${st.g === 'أنثى' ? 'selected' : ''}>إناث</option></select></div></div>
            <div class="fld"><label>تجميع مبيان التوزيع حسب</label><select class="inp" id="dB">${BY.map(([k, l]) => `<option value="${k}" ${st.by === k ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select></div>` : ''}
          <p class="muted" style="font-size:12px;line-height:1.7">${st.kind === 'dash' ? 'يُطبع مؤشر نسبة التحكم والنسب حسب المادة وتطور الفئات A/B/C/D عبر الفئات الزمنية وتوزيع النتائج وترتيب الوحدات المدرسية وخلاصات مكتوبة.' : st.kind === 'cmp' ? 'يُطبع لكل مادة جدول يقارن توزيع التلاميذ (العدد والنسبة) بين الفئات التي بها معطيات، مع مبيان.' : 'يُطبع لكل مادة جدول التوزيع حسب المستوى والجنس مع النسب والمبيان.'}</p>`;
        const reopen = () => go('roaizDoc', { sy: st.sy, unit: st.unit, level: st.level, phase: st.phase, kind: st.kind, dash: { subj: st.subj, g: st.g, by: st.by, group: st.group } });
        $('#dK', box).onchange = e => { st.kind = e.target.value; st.unit = ''; st.level = ''; reopen(); };
        if ($('#dP', box)) $('#dP', box).onchange = e => { st.phase = e.target.value; st.unit = ''; st.level = ''; reopen(); };
        $('#dU', box).onchange = e => { st.unit = e.target.value; st.level = ''; reopen(); };
        $('#dL', box).onchange = e => { st.level = e.target.value; refresh(); };
        if ($('#dS', box)) { $('#dS', box).onchange = e => { st.subj = e.target.value; refresh(); }; $('#dG', box).onchange = e => { st.g = e.target.value; refresh(); }; $('#dB', box).onchange = e => { st.by = e.target.value; refresh(); }; }
      },
      build: st => (!st.groupId && st.kind === 'cmp' ? compareReport(S(), st.sy, st) : { page: 'a4', pages: st.groupId ? listReport(S(), g0) : st.kind === 'dash' ? dashReport(S(), st.sy, { unit: st.unit, level: st.level, group: st.group, subj: st.subj, g: st.g }, st.phase, st.by) : statReport(S(), st.sy, st) }),
      fname: st => st.groupId ? 'لائحة_مجموعة_الدعم' : st.kind === 'dash' ? 'لوحة_قيادة_الروائز_' + syDash(st.sy) : (st.kind === 'cmp' ? 'مقارنة_فئات_الروائز_' : 'استثمار_' + phOf(st.phase).s.replace(/\s+/g, '_') + '_') + syDash(st.sy)
    });
  };
})();
