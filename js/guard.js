'use strict';
/* 1.9.3 — جداول الحراسة (الوثائق): جدول لكل وحدة مدرسية على نموذج المؤسسة — الفترة الصباحية والمسائية، لكل يوم: الاسم الكامل، رقم التأجير، التوقيع —
   مع «توجيهات هامة» قابلة للتعديل. Les tableaux sont reliés à tout le reste de l'application:
   - les Employés (liste des enseignants de l'unité → rotation automatique, numéro de solde rempli automatiquement),
   - les Unités scolaires et le cycle (primaire: une feuille par unité; collège / lycée: une feuille pour l'établissement),
   - les Absences et congés (حراسة اليوم: الغائب وبديله، وتنبيه عند تسجيل غياب أو رخصة لأستاذ(ة) مكلف(ة) بالحراسة),
   - la السبورة المرجعية (جدول الحراسة اليومية), les مذكرات داخلية (مذكرة الحراسة) et les statistiques par enseignant.
   Data: DB.guard = { years: { [sy]: { g_<unit>: { am, pm, per, minRows, rows: [[day, am1.., pm1..]], rules } } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const nh = s => MK.hkey(s);
  const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const kind = () => (window.Cyc ? Cyc.kind() : 'pri');
  const grp = () => !!(window.Cyc ? Cyc.group() : true);       // 1.9.4: primary school GROUP (with school units)
  const HOURS = () => (kind() === 'pri' ? ['من 8:30 إلى 13:10', 'من 13:30 إلى 18:10'] : ['من 8:00 إلى 12:00', 'من 14:00 إلى 18:00']);
  const RULES = [
    'يحضر الأستاذ (ة) المكلف بالحراسة قبل بداية الحصة على الأقل ب 15 دقيقة ولا يغادر المؤسسة إلا بعد خروج آخر تلميذ(ة)؛',
    'يتولى الأستاذ (ة) المكلف بالحراسة توزيع التلاميذ على الأقسام في حالة غياب أستاذهم أو أستاذتهم؛',
    'في حالة غياب الأستاذ(ة) المكلف بالحراسة تنتقل إلى أحد الأساتذة الذين يعملون معه في نفس التوقيت والذي يليه في الترتيب؛',
    'يحرص الأستاذ(ة) المكلف(ة) بالحراسة على التواجد المستمر بساحة المؤسسة والممرات خلال فترات الاستراحة، لضمان أمن التلاميذ وسلامتهم؛',
    'يمنع خروج أي تلميذ(ة) من المؤسسة خلال أوقات الدراسة إلا بإذن من الإدارة؛',
    'يتدخل الأستاذ(ة) المكلف(ة) بالحراسة فورا لفض أي مشاجرة أو نزاع بين التلاميذ، ويشعر الإدارة بالأمر؛',
    'في حالة تعرض تلميذ(ة) لحادثة أو وعكة صحية، يبادر الأستاذ(ة) المكلف(ة) بالحراسة إلى إسعافه وإخبار الإدارة فورا لاتخاذ الإجراء المناسب؛',
    'يسهر الأستاذ(ة) المكلف(ة) بالحراسة على ضبط الدخول والخروج من بوابة المؤسسة، ويمنع ولوج أي شخص غريب عنها دون ترخيص؛',
    'يدون كل حادث أو ملاحظة طارئة، مع بيان التاريخ والتوقيت والإجراء المتخذ؛',
    'يتولى الأستاذ(ة) المكلف(ة) بالحراسة اخبار الإدارة بالتلاميذ المتأخرين؛',
    'يراقب الأستاذ(ة) المكلف(ة) بالحراسة الممرات والمرافق الصحية أثناء سريان الحصص لتفادي تسكع التلاميذ خارج الأقسام دون مبرر؛',
    'يتعين على الأساتذة(ات) المكلفين(ات) بالحراسة التنسيق فيما بينهم لضمان استمرارية المراقبة دون انقطاع طيلة اليوم الدراسي؛',
    'يخبر الأستاذ(ة) المكلف(ة) بالحراسة الإدارة فورا عند ملاحظة أي عطب أو تلف في التجهيزات أو البنية التحتية للمؤسسة؛',
    'يمتنع الأستاذ(ة) المكلف(ة) بالحراسة عن كل ما من شأنه صرف انتباهه عن مهمة المراقبة طيلة مدة الحراسة.',
    'يحتفظ كل أستاذ(ة) بنسخة من هذا الجدول ضمن وثائقه التربوية؛'];

  const root = () => { const g = (DB.guard = DB.guard && typeof DB.guard === 'object' ? DB.guard : {}); g.years = g.years && typeof g.years === 'object' ? g.years : {}; return g; };
  const ST = sy => { const y = root().years; return y[sy] || (y[sy] = {}); };
  const unitsList = () => { if (!grp()) return [S().school || 'المؤسسة']; const n = K.U.names(); return n.length ? n : [S().school || 'المؤسسة']; };
  const keyOf = u => 'g_' + nh(u);
  // teachers of a unit (primary) or of the whole school (collège / lycée)
  const teachersOf = unit => {
    const all = K.E.teachers();
    if (!grp()) return all;
    const L = all.filter(e => e.unit && K.U.same(e.unit, unit));
    return L.length ? L : (unitsList().length === 1 ? all : []);
  };
  const pad = (a, n) => { const o = a.slice(0, n); while (o.length < n) o.push(''); return o; };
  const N = f => Math.max(1, Math.min(3, +f.per || 1));
  // balanced rotation: every day, `per` teachers in the morning and `per` in the afternoon (Saturday left empty)
  function rota(T, per) {
    const names = T.map(e => fullName(e)); let i = 0;
    return DAYS.map((d, di) => {
      const a = [], p = [];
      if (names.length && di < 5) { for (let k = 0; k < per; k++) a.push(names[(i++) % names.length]); for (let k = 0; k < per; k++) p.push(names[(i++) % names.length]); }
      return [d].concat(pad(a, per), pad(p, per));
    });
  }
  function reshape(rows, per) {
    return (rows || []).map(r => { const old = Math.max(1, Math.floor((r.length - 1) / 2)); return [r[0]].concat(pad(r.slice(1, 1 + old).filter(nm), per), pad(r.slice(1 + old, 1 + 2 * old).filter(nm), per)); });
  }
  const slotsOf = f => { const n = N(f); return (f.rows || []).map(r => ({ day: r[0], am: r.slice(1, 1 + n).map(nm).filter(Boolean), pm: r.slice(1 + n, 1 + 2 * n).map(nm).filter(Boolean) })); };
  const pprOf = name => { const e = K.E.byName(name); return e && e.ppr ? e.ppr : ''; };
  const syText = sy => MK.syDash(sy).replace('-', '/');

  /* ---------- absences: who is away on a date (records of «الرخص والغياب») ---------- */
  function absentOn(name, iso) {
    const e = K.E.byName(name); if (!e) return null;
    for (const r of DB.records || []) {
      if (r.empId !== e.id) continue;
      const a = typeof absenceOf === 'function' ? absenceOf(r) : null;
      if (a && a.from <= iso && iso <= a.to) return a;
    }
    return null;
  }
  const dayIdx = iso => { const d = new Date(iso + 'T00:00:00Z'); if (isNaN(d)) return -1; const w = d.getUTCDay(); return w === 0 ? -1 : w - 1; };   // Monday = 0 … Saturday = 5; Sunday = -1

  /* ---------- documents ---------- */
  let C = null;
  const docOf = u => unitDocs().find(d => d.k === keyOf(u));
  const fieldsOf = (u, sy) => { const d = docOf(u); return d ? center().flds(d, sy || MK.curSy()) : null; };

  function sheetBlocks(s, f, u, sy) {
    const n = Math.max(1, +f.minRows || 1), rows = [];
    slotsOf(f).forEach(sl => {
      const m = Math.max(sl.am.length, sl.pm.length, n);
      for (let i = 0; i < m; i++) {
        const a = sl.am[i] || '', p = sl.pm[i] || '', cells = [];
        if (i === 0) cells.push({ t: sl.day, c: 'k b', r: m });
        cells.push({ t: a, c: 'r b' }, { t: a ? pprOf(a) : '', c: 'ltr' }, { t: '' }, { t: p, c: 'r b' }, { t: p ? pprOf(p) : '', c: 'ltr' }, { t: '' });
        rows.push(tr(cells));
      }
    });
    const head = `<tr><th rowspan="2" class="d" style="width:11%">الأيام</th><th colspan="3" class="d">الفترة الصباحية ${esc(f.am || '')}</th><th colspan="3" class="d">الفترة المسائية ${esc(f.pm || '')}</th></tr>
      <tr>${['الاسم الكامل', 'رقم التأجير', 'التوقيع', 'الاسم الكامل', 'رقم التأجير', 'التوقيع'].map(t => `<th>${t}</th>`).join('')}</tr>`;
    const colgroup = '<colgroup><col style="width:11%"><col style="width:20%"><col style="width:10%"><col style="width:10%"><col style="width:20%"><col style="width:10%"><col style="width:10%"></colgroup>';
    const L = nm(f.rules).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
    const B = [{ table: { cls: 'sb-t gd-t', head, colgroup, rows }, minRows: 99 }];
    if (L.length) { B.push({ html: '<div class="gd-h">توجيهات هامة :</div>', keepNext: true }); L.forEach(x => B.push({ html: `<div class="gd-li">${esc(x)}</div>` })); }
    B.push(SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }));
    return B;
  }
  function sheetPages(s, f, u, sy) {
    const sub = `الموسم الدراسي: ${esc(syText(sy))}${grp() ? ` &nbsp;—&nbsp; الوحدة المدرسية: ${esc(u)}` : ''}`;
    return MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'جدول الحراسة', sub), blocks: sheetBlocks(s, f, u, sy) });
  }
  const ruleDef = { k: 'rules', l: 'توجيهات هامة (سطر لكل توجيه — تُطبع تحت الجدول)', t: 'area', rows: 10 };
  const gridCols = f => { const n = N(f); const one = (w, i) => `${w}${n > 1 ? ' ' + (i + 1) : ''}`; return ['اليوم'].concat(Array.from({ length: n }, (_, i) => one('صباحا', i)), Array.from({ length: n }, (_, i) => one('مساء', i))); };
  function unitDoc(u) {
    return {
      k: keyOf(u), t: `جدول الحراسة — ${u}`, grp: 'g_units', page: 'a4',
      d: 'أساتذة الحراسة صباحا ومساء لكل يوم: الاسم الكامل، رقم التأجير، التوقيع، مع التوجيهات.', auto: 'لائحة الموظفين (أساتذة الوحدة) والوحدات المدرسية — تناوب تلقائي قابل للتعديل',
      init: () => { const H = HOURS(); return { am: H[0], pm: H[1], per: '1', minRows: '1', rows: rota(teachersOf(u), 1), rules: RULES.join('\n') }; },
      defs: f => {
        const cols = gridCols(f);
        return [{ sec: 'الفترتان والحراس' },
          { k: 'am', l: 'الفترة الصباحية', half: true }, { k: 'pm', l: 'الفترة المسائية', half: true },
          { k: 'per', l: 'عدد الحراس في كل فترة', t: 'select', half: true, opts: [['1', 'أستاذ(ة) واحد(ة)'], ['2', 'أستاذان / أستاذتان'], ['3', 'ثلاثة أساتذة']] },
          { k: 'minRows', l: 'أقل عدد أسطر لكل يوم في الطبع', t: 'select', half: true, opts: [['1', 'سطر واحد'], ['2', 'سطران'], ['3', '3 أسطر']] },
          { t: 'html', html: '<div class="btn-row"><button type="button" class="btn sm" data-act="rota">توليد التناوب تلقائيا من أساتذة الوحدة</button><button type="button" class="btn sm" data-act="clear">تفريغ الجدول</button><button type="button" class="btn sm" data-act="memo">إنشاء مذكرة داخلية بالحراسة</button></div>' },
          Budget.gridDef('rows', 'أسماء الحراس — اختر من لائحة الموظفين (رقم التأجير يُملأ تلقائيا عند الطبع)', cols, { widths: ['.8fr'].concat(cols.slice(1).map(() => '1.3fr')), list: [null].concat(cols.slice(1).map(() => 'k2Emps')), fixed: true }),
          { sec: 'التوجيهات' }, ruleDef];
      },
      onSave: (k, f, sy, store) => { if (k === 'per') { f.rows = reshape(f.rows, N(f)); store.rows = f.rows; return 'redraw'; } return null; },
      act: {
        rota: (f, sy, c) => { f.rows = rota(teachersOf(u), N(f)); c.save('rows'); c.toast('تم توليد التناوب'); },
        clear: (f, sy, c) => { f.rows = DAYS.map(d => [d].concat(pad([], 2 * N(f)))); c.save('rows'); },
        memo: (f, sy, c) => memoFor(sy)
      },
      build: (s, f, sy) => ({ page: 'a4', pages: sheetPages(s, f, u, sy) })
    };
  }
  const unitDocs = () => unitsList().map(unitDoc);

  /* all units in one file (one page per unit) */
  const allDoc = () => ({
    k: 'g_all', t: 'جداول الحراسة لجميع الوحدات', grp: 'g_all', page: 'a4', d: grp() ? 'جميع جداول الحراسة في ملف واحد: صفحة لكل وحدة مدرسية.' : 'جدول الحراسة للمؤسسة.', auto: 'جداول الوحدات',
    init: () => ({}), defs: () => [{ note: 'تجمع كل جداول الحراسة المعبأة في ملف واحد، صفحة لكل وحدة مدرسية. عدّل كل جدول من خانته.' }],
    build: (s, f, sy) => ({ page: 'a4', pages: [].concat(...unitsList().map(u => sheetPages(s, fieldsOf(u, sy), u, sy))) })
  });

  /* teachers on guard / absent on a given day, with the substitute proposed (the next teacher on duty in the same period, then any free teacher of the unit) */
  function dayPlan(sy, iso) {
    const di = dayIdx(iso), out = [];
    unitsList().forEach(u => {
      const f = fieldsOf(u, sy); if (!f || di < 0) { out.push({ unit: u, rows: [] }); return; }
      const sl = slotsOf(f)[di] || { am: [], pm: [] }, all = sl.am.concat(sl.pm), rows = [];
      const free = teachersOf(u).map(e => fullName(e)).filter(n => !all.some(x => nh(x) === nh(n)) && !absentOn(n, iso));
      [['صباحا', sl.am], ['مساء', sl.pm]].forEach(([per, L]) => L.forEach((n, i) => {
        const ab = absentOn(n, iso);
        let sub = '';
        if (ab) sub = L.slice(i + 1).concat(L.slice(0, i)).find(x => !absentOn(x, iso)) || free[0] || '';
        rows.push({ per, name: n, ppr: pprOf(n), absent: ab ? ab.reason : '', sub });
      }));
      out.push({ unit: u, rows });
    });
    return out;
  }
  const dayDoc = () => ({
    k: 'g_day', t: 'حراسة يوم محدد (الغياب والبدلاء)', grp: 'g_all', page: 'a4',
    d: 'حراسة اليوم بكل وحدة: المكلفون بالحراسة، الغائبون حسب «الرخص والغياب» وبديل كل غائب.', auto: 'جداول الحراسة + الرخص والغياب',
    init: () => ({ date: Dx.todayIso() }),
    defs: f => [{ k: 'date', l: 'التاريخ', t: 'date' }, { note: 'يُحتسب الغياب تلقائيا من «الرخص والغياب» (رخص، شواهد طبية، غياب). البديل المقترح: الأستاذ(ة) الموالي(ة) في نفس الفترة، ثم أي أستاذ(ة) غير مكلف(ة) وحاضر(ة) بالوحدة.' }],
    build: (s, f, sy) => {
      const iso = f.date || Dx.todayIso(), di = dayIdx(iso), plan = dayPlan(sy, iso);
      const rows = [];
      plan.forEach(p => {
        if (!p.rows.length) { rows.push(tr([{ t: p.unit, c: 'k b' }, { t: di < 0 ? 'لا حراسة في هذا اليوم' : 'لم يُحدد حراس لهذا اليوم', s: 5, c: 'gr' }])); return; }
        p.rows.forEach((r, i) => rows.push(tr((i === 0 ? [{ t: p.unit, c: 'k b', r: p.rows.length }] : []).concat([{ t: r.per }, { t: r.name, c: 'r b' }, { t: r.ppr, c: 'ltr' }, { t: r.absent ? 'غائب(ة): ' + r.absent : 'حاضر(ة)', c: r.absent ? 'b' : '' }, { t: r.absent ? (r.sub || '—') : '' , c: 'r' }]))));
      });
      const head = thr(['الوحدة', 'الفترة', 'الأستاذ(ة) المكلف(ة)', 'رقم التأجير', 'الحالة', 'البديل المقترح'].map(t => ({ t, c: 'd' })));
      return { title: `الحراسة ليوم ${K.dayName(iso)} ${ldate(iso)}`, sub: `الموسم الدراسي: ${esc(syText(sy))}`, page: 'a4', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }), blocks: [SB.tbl(head, rows, 'big gd-t')] };
    }
  });

  /* guard half-days per teacher (to balance the load) */
  function stats(sy) {
    const m = new Map();
    unitsList().forEach(u => {
      const f = fieldsOf(u, sy); if (!f) return;
      slotsOf(f).forEach((sl, di) => [['am', sl.am], ['pm', sl.pm]].forEach(([per, L]) => L.forEach(n => {
        const k = nh(n); let o = m.get(k); if (!o) { o = { name: n, unit: u, d: [0, 0, 0, 0, 0, 0], am: 0, pm: 0 }; m.set(k, o); }
        o.d[di]++; o[per]++;
      })));
    });
    return Array.from(m.values()).sort((a, b) => a.unit.localeCompare(b.unit, 'ar') || a.name.localeCompare(b.name, 'ar'));
  }
  const statsDoc = () => ({
    k: 'g_stats', t: 'إحصاء حصص الحراسة لكل أستاذ(ة)', grp: 'g_all', page: 'a4l',
    d: 'عدد حصص الحراسة (صباحا ومساء) لكل أستاذ(ة) خلال الأسبوع لضمان عدالة التوزيع.', auto: 'جداول الحراسة والموظفين',
    init: () => ({}), defs: () => [{ note: 'يُحسب تلقائيا من جداول الحراسة. العمود الأخير ينبه إلى من يتجاوز المعدل بأكثر من حصة.' }],
    build: (s, f, sy) => {
      const L = stats(sy), avg = L.length ? L.reduce((a, x) => a + x.am + x.pm, 0) / L.length : 0;
      const rows = L.map((x, i) => { const t = x.am + x.pm; return tr([i + 1, { t: x.name, c: 'r b' }, { t: pprOf(x.name), c: 'ltr' }, { t: x.unit, c: 'r sm' }].concat(x.d.map(v => v || ''), [x.am, x.pm, { t: t, c: 'b' }, { t: t > avg + 1 ? 'أكثر من المعدل' : t < avg - 1 ? 'أقل من المعدل' : '', c: 'sm' }])); });
      const head = thr(['ر.ت', 'الأستاذ(ة)', 'رقم التأجير', 'الوحدة'].concat(DAYS, ['صباحا', 'مساء', 'المجموع', 'ملاحظة']).map(t => ({ t, c: 'd' })));
      return { title: 'إحصاء حصص الحراسة الأسبوعية', sub: `الموسم الدراسي: ${esc(syText(sy))} — المعدل: ${avg.toFixed(1)} حصة لكل أستاذ(ة)`, page: 'a4l', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }), blocks: [SB.tbl(head, rows.length ? rows : [tr(Array(14).fill(''))], 'big gd-t')] };
    }
  });

  /* internal memo «الحراسة التربوية» filled with the schedule */
  function memoFor(sy) {
    if (!window.Memos) return toast('المذكرات الداخلية غير متوفرة', true);
    const it = Memos.create('guard');
    const rows = [];
    unitsList().forEach(u => { const f = fieldsOf(u, sy); if (!f) return; slotsOf(f).forEach(sl => { if (sl.am.length || sl.pm.length) rows.push([u, sl.day, sl.am.join('، '), sl.pm.join('، ')]); }); });
    const st = ((DB.memos.years[sy] = DB.memos.years[sy] || {}));
    st['m_' + it.id] = Object.assign(st['m_' + it.id] || {}, { cap1: 'جدول الحراسة', head1: [grp() ? 'الوحدة المدرسية' : 'الفضاء', 'اليوم', 'الفترة الصباحية', 'الفترة المسائية'].join(' | '), t1: rows.length ? rows : [['', '', '', '']] });
    persist(); go('memosDoc', { kind: 'm_' + it.id });
  }

  const docs = () => unitDocs().concat([allDoc(), dayDoc(), statsDoc()]);
  function center() {
    if (C) return C;
    C = K.center({
      id: 'guard', title: 'جداول الحراسة', icon: '🛡️', route: 'guardDoc', hubRoute: 'guard', noSy: true, docLabel: 'الجدول',
      get groups() { return [['g_units', grp() ? 'جداول الحراسة حسب الوحدة المدرسية' : 'جدول حراسة المؤسسة'], ['g_all', 'ملفات مجمعة وربط بالغياب والإحصاء']]; },
      docs, store: sy => ST(sy), years: () => [MK.curSy()],
      intro: 'جدول الحراسة لكل وحدة مدرسية على نموذج المؤسسة (الفترة الصباحية والمسائية: الاسم، رقم التأجير، التوقيع، ثم التوجيهات). يُملأ تلقائيا بتناوب عادل بين أساتذة كل وحدة من لائحة الموظفين، ورقم التأجير يُؤخذ من ملف الموظف. مرتبط بالرخص والغياب (حراسة اليوم وبديل الغائب)، وبالسبورة المرجعية، وبالمذكرات الداخلية، ويُنبه عند تسجيل غياب أستاذ(ة) مكلف(ة) بالحراسة.'
    });
    return C;
  }
  Dx.modCss += `
  .gd-t td{height:9mm;font-size:10pt}.gd-t td.k{background:#eef3fb;text-align:center}.gd-t td.gr{background:#f2f2f2;color:#555;text-align:center}
  .gd-h{font-weight:700;font-size:11pt;margin:2.5mm 0 1mm}
  .gd-li{font-size:9.6pt;line-height:1.55;margin:0 0 .5mm;padding-inline-start:4mm;position:relative}.gd-li:before{content:'◆';position:absolute;inset-inline-start:0;font-size:6.5pt;top:1mm}`;

  /* ---------- API for the other sections ---------- */
  const API = {
    // schedule {unit: [{day, am:[names], pm:[names]}]}
    slots(sy) { const o = {}; unitsList().forEach(u => { const f = fieldsOf(u, sy || MK.curSy()); if (f) o[u] = slotsOf(f); }); return o; },
    // true when the schedule (saved or generated automatically) has at least one guard duty
    any() { try { return Object.values(API.slots()).some(L => L.some(sl => sl.am.length || sl.pm.length)); } catch (e) { return false; } },
    // rows for the reference board: [day, cell per unit name] (morning «ص:» / afternoon «م:»)
    boardRows(names, sy) {
      const S0 = API.slots(sy);
      const units = Object.keys(S0);
      return DAYS.map((d, di) => [d].concat(names.map(n => {
        const u = units.find(x => K.U.same(x, n)) || (units.length === 1 ? units[0] : null);
        const sl = u && S0[u][di]; if (!sl) return '';
        return sl.am.map(x => 'ص: ' + x).concat(sl.pm.map(x => 'م: ' + x)).join(' / ');
      })));
    },
    // guard duties of an employee: [{day, period, unit}]
    forEmp(name, sy) { const k = nh(name), out = []; const S0 = API.slots(sy); Object.keys(S0).forEach(u => S0[u].forEach(sl => { if (sl.am.some(x => nh(x) === k)) out.push({ day: sl.day, period: 'صباحا', unit: u }); if (sl.pm.some(x => nh(x) === k)) out.push({ day: sl.day, period: 'مساء', unit: u }); })); return out; },
    // warning text when an absence / leave of an employee covers guard duties (with the proposed substitute)
    note(empId, from, to) {
      const e = empById(empId); if (!e || !from || !to) return '';
      const nameE = fullName(e), duties = API.forEmp(nameE); if (!duties.length) return '';
      const sy = MK.curSy(), hits = [];
      for (let t = new Date(from + 'T00:00:00Z'), end = new Date(to + 'T00:00:00Z'), n = 0; t <= end && n < 120; t.setUTCDate(t.getUTCDate() + 1), n++) {
        const iso = t.toISOString().slice(0, 10), di = dayIdx(iso); if (di < 0) continue;
        duties.filter(d => d.day === DAYS[di]).forEach(d => hits.push({ iso, ...d }));
      }
      if (!hits.length) return '';
      const days = Array.from(new Set(hits.map(h => h.day + ' ' + h.period)));
      // substitute for the first day (the plan counts this absence only once it is saved)
      return `تنبيه: ${nameE} مكلف(ة) بالحراسة (${days.slice(0, 4).join('، ')}${days.length > 4 ? '…' : ''}) خلال هذه المدة — راجع «جداول الحراسة ← حراسة يوم محدد» لتعيين البديل.`;
    },
    dayPlan, units: unitsList,
    summary() { const sy = MK.curSy(), st = stats(sy); return { sy, units: unitsList().length, teachers: st.length, slots: st.reduce((a, x) => a + x.am + x.pm, 0) }; }
  };
  window.Guard = API;
  window.pageGuard = (v, a) => { center().hub(v, a); };
  window.pageGuardDoc = (v, a) => { center().doc(v, a); };
})();
