'use strict';
/* 1.9.3 — التقارير اليومية للأنشطة المنجزة (الوثائق ← المتابعة والتتبع والحراسة) على نموذج «التقرير اليومي» المعتمد:
   حركة التلاميذ (الوافدون، المغادرون، غير الملتحقون، المنقطعون)، عدد التلاميذ وعدد التغيبات، غياب الأطر ونوع الرخصة، التأخرات، استئناف العمل،
   الأنشطة التربوية والثقافية والرياضية، التأطير التربوي، الزيارات المختلفة، الحوادث المدرسية، مختلفات.
   Tout est relié: les mouvements des élèves (بطاقة التلاميذ)، l'absence des élèves (سجل غياب التلاميذ)، les absences / congés / permissions / reprises du personnel
   (الغياب والرخص)، les activités (الاحتفالات والأنشطة المنجزة). Chaque jour est conservé séparément + une synthèse mensuelle.
   Data: DB.dayrep = { years: { [sy]: { dr_day: { date, unit, days: { [iso]: { no, o_*, acts, sup, vis, inc, misc } } } } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const today = () => Dx.todayIso();
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const hd = cells => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  const addD = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const dow = iso => new Date(iso + 'T00:00:00Z').getUTCDay();          // 0 Sunday … 6 Saturday
  const nextWork = iso => { let d = addD(iso, 1); while (dow(d) === 0 || dow(d) === 6) d = addD(d, 1); return d; };
  const dayLabel = iso => `${K.dayName(iso)} ${ldate(iso)}`;

  const root = () => { const g = (DB.dayrep = DB.dayrep && typeof DB.dayrep === 'object' ? DB.dayrep : {}); g.years = g.years && typeof g.years === 'object' ? g.years : {}; return g; };
  const ST = sy => { const y = root().years; return y[sy] || (y[sy] = {}); };
  const MANUAL = ['no', 'o_arr', 'o_dep', 'o_nj', 'o_dr', 'o_pup', 'o_abs', 'acts', 'sup', 'vis', 'inc', 'misc'];
  const blankRows = (n, w) => Array.from({ length: n }, () => Array(w).fill(''));
  const DEF = { no: () => '', o_arr: () => '', o_dep: () => '', o_nj: () => '', o_dr: () => '', o_pup: () => '', o_abs: () => '', acts: () => blankRows(2, 5), sup: () => blankRows(2, 5), vis: () => blankRows(2, 4), inc: () => blankRows(2, 6), misc: () => '' };
  const dayStore = sy => { const st = ST(sy); const d = st.dr_day = st.dr_day || {}; d.days = d.days && typeof d.days === 'object' ? d.days : {}; return d; };
  const savedDay = (sy, iso) => (dayStore(sy).days || {})[iso] || null;
  const clampDay = (sy, iso) => iso || today();
  const unitOk = (e, unit) => !unit || !e || !e.unit || (window.Board ? Board.sameU(e.unit, unit) : e.unit === unit);

  /* ---------- everything the application already knows about a day ---------- */
  function autoOf(sy, iso, unit) {
    const out = { arr: 0, dep: 0, nj: 0, dr: 0, pup: 0, abs: 0, absLate: 0, staff: [], late: [], back: [], acts: [], hasAbs: false };
    if (!iso) return out;
    const P = window.Pupils;
    if (P) {
      const cnt = cat => P.movesOf(sy, cat).filter(m => m.date === iso && (!unit || K.U.same(m.unit, unit))).length;
      out.arr = cnt('joined'); out.dep = cnt('left'); out.nj = cnt('notjoined'); out.dr = cnt('drop');
      out.pup = P.current(sy).filter(p => !unit || K.U.same(p.unit, unit)).length;
    }
    if (window.AbsReg) { const c = AbsReg.dayCount(sy, iso, unit); out.abs = c.abs; out.absLate = c.late; out.hasAbs = c.classes > 0; }
    // staff away on that date (leave, medical certificate, unjustified absence, …)
    const seen = new Set();
    if (typeof absenceEntries === 'function') {
      absenceEntries().forEach(a => {
        const e = empById(a.rec.empId);
        if (!unitOk(e, unit)) return;
        if (a.from <= iso && iso <= a.to) { const k = a.rec.empId + a.from; if (!seen.has(k)) { seen.add(k); out.staff.push({ name: recName(a.rec), reason: a.reason, from: a.from, to: a.to }); } }
        else if (a.to < iso && nextWork(a.to) === iso) out.back.push({ name: recName(a.rec), date: iso, after: a.reason, empId: a.rec.empId });
      });
    }
    // permissions of a few hours = lateness / short absence
    (DB.records || []).forEach(r => {
      const f = r.f || {};
      if (r.type === 'permission' && (f.timeFrom || f.timeTo) && f.from <= iso && iso <= (f.to || f.from)) {
        if (!unitOk(empById(r.empId), unit)) return;
        out.late.push({ name: recName(r), dur: `${f.timeFrom || '..'} - ${f.timeTo || '..'}` });
      }
      if (r.type === 'resume' && f.resumeDate === iso && unitOk(empById(r.empId), unit) && !out.back.some(b => b.empId === r.empId)) out.back.push({ name: recName(r), date: iso, after: f.afterType || '', empId: r.empId });
    });
    // activities whose technical card was sent that day
    if (window.Events) {
      try { Events.done(sy).filter(x => x.f.date === iso).forEach(x => out.acts.push([nm(x.f.title) || x.c.name, nm(x.f.unit), nm(x.f.sup), nm(x.f.target), nm(x.f.period)])); } catch (_) {}
    }
    return out;
  }
  // value shown for a counter: the user's correction when typed, the automatic figure otherwise
  const pick = (ov, auto) => (nm(ov) !== '' ? nm(ov) : String(auto));
  const rankNo = (sy, iso) => { const days = Object.keys(dayStore(sy).days || {}).filter(d => d < iso); return days.length + 1; };

  const rows3 = (list, w, min) => { const o = list.slice(); while (o.length < min) o.push(Array(w).fill('')); return o; };
  const cell = (v, c) => ({ t: v == null ? '' : String(v), c: c || '', st: 'height:5.6mm;padding-top:.4mm;padding-bottom:.4mm' });

  const DOCS = [];
  DOCS.push({
    k: 'dr_day', t: 'التقرير اليومي للأنشطة المنجزة', grp: 'dr_a', d: 'تقرير يوم واحد: حركة التلاميذ والغياب والتأخرات واستئناف العمل والأنشطة والتأطير والزيارات والحوادث — يُملأ تلقائيا ويحفظ لكل يوم على حدة.', auto: 'بطاقة التلاميذ، سجل غياب التلاميذ، الغياب والرخص، الأنشطة المنجزة', page: 'a4',
    init: () => Object.assign({ date: today(), unit: '' }, Object.fromEntries(MANUAL.map(k => [k, DEF[k]()]))),
    defs: (f, sy) => {
      const A = autoOf(sy, f.date, f.unit);
      const units = window.K && K.U ? K.U.names() : [];
      return [
        { note: 'اختر التاريخ فتُحمَّل بيانات ذلك اليوم المحفوظة سابقا (أو تفتح ورقة جديدة). الأعداد والجداول الأولى تُحسب تلقائيا من بقية البرنامج، واكتب رقما في أي خانة لتصحيحه.' },
        { sec: 'اليوم' },
        { k: 'date', l: 'تاريخ التقرير', t: 'date', half: true }, { k: 'no', l: `رقم التقرير (فارغ = ${rankNo(sy, f.date)} تلقائيا)`, half: true },
        units.length > 1 ? { k: 'unit', l: 'الوحدة المدرسية (فارغ = كل المؤسسة)', list: 'k2Units' } : null,
        { sec: 'حركة التلاميذ (فارغ = تلقائي)' },
        { k: 'o_arr', l: `الوافدون (تلقائي: ${A.arr})`, t: 'num', half: true }, { k: 'o_dep', l: `المغادرون (تلقائي: ${A.dep})`, t: 'num', half: true },
        { k: 'o_nj', l: `غير ملتحق (تلقائي: ${A.nj})`, t: 'num', half: true }, { k: 'o_dr', l: `منقطع (تلقائي: ${A.dr})`, t: 'num', half: true },
        { k: 'o_pup', l: `عدد التلاميذ (تلقائي: ${A.pup})`, t: 'num', half: true }, { k: 'o_abs', l: `عدد التغيبات (تلقائي من سجل الغياب: ${A.abs})`, t: 'num', half: true },
        { t: 'html', html: `<div class="muted" style="font-size:12.2px;line-height:1.9;margin:4px 0">الأطر الغائبة اليوم: <b>${A.staff.length}</b> — المستأنفون: <b>${A.back.length}</b> — الإذن بالتغيب لساعات: <b>${A.late.length}</b>. هذه القوائم تُؤخذ من «الغياب والرخص» ولا تحتاج إلى إدخال.</div>` },
        { sec: 'الأنشطة التربوية والثقافية والرياضية' }, { note: A.acts.length ? `يُدرج تلقائيا ${A.acts.length} نشاط منجز بتاريخ هذا اليوم من «الاحتفالات والأنشطة المنجزة».` : 'تُدرج تلقائيا الأنشطة التي أُرسلت بطاقتها التقنية بتاريخ هذا اليوم؛ أضف هنا بقية الأنشطة.' },
        window.Budget.gridDef('acts', 'أنشطة أخرى', ['نوع النشاط', 'المكان', 'التأطير', 'الفئة المستهدفة', 'ملاحظات'], { widths: ['1.6fr', '1fr', '1.2fr', '1fr', '1.2fr'] }),
        { sec: 'التأطير التربوي' }, window.Budget.gridDef('sup', 'زيارات التأطير', ['نوع الزيارة', 'اسم السيد المؤطر', 'اسم الأستاذ', 'الأقسام', 'ملاحظات'], { widths: ['1.2fr', '1.4fr', '1.4fr', '.9fr', '1.2fr'] }),
        { sec: 'زيارات مختلفة' }, window.Budget.gridDef('vis', 'زيارات', ['نوع الزيارة', 'أعضاء اللجنة', 'موضوع الزيارة', 'ملاحظات'], { widths: ['1.2fr', '1.6fr', '1.6fr', '1.2fr'] }),
        { sec: 'الحوادث المدرسية' }, window.Budget.gridDef('inc', 'حوادث', ['اسم التلميذ', 'نوع الحادثة', 'الأستاذ المؤطر', 'التوقيت', 'مكان الحادثة', 'ملاحظات'], { widths: ['1.4fr', '1.1fr', '1.2fr', '.7fr', '1fr', '1fr'], types: ['text', 'text', 'text', 'text', 'text', 'text'] }),
        { sec: 'مختلفات' }, { k: 'misc', l: 'ملاحظات أخرى', t: 'area', rows: 3 }
      ].filter(Boolean);
    },
    onSave: (k, f, sy, store) => {
      const days = store.days = store.days && typeof store.days === 'object' ? store.days : {};
      if (k === 'date') {
        const d = days[f.date] || {};
        MANUAL.forEach(m => { f[m] = d[m] !== undefined ? d[m] : DEF[m](); store[m] = f[m]; });
        return 'redraw';
      }
      if (MANUAL.includes(k)) { const d = days[f.date] = days[f.date] || {}; d[k] = f[k]; }
      return k === 'unit' ? 'redraw' : null;
    },
    build: (s, f, sy) => {
      const iso = clampDay(sy, f.date), A = autoOf(sy, iso, nm(f.unit));
      const cnt = pick;
      const head2 = thr([{ t: 'الوافدون', c: 'd' }, { t: 'المغادرون', c: 'd' }, { t: 'غير ملتحق', c: 'd' }, { t: 'منقطع', c: 'd' }, { t: 'عدد التلاميذ', c: 'd' }, { t: 'عدد التغيبات', c: 'd' }]);
      const counts = { table: { cls: 'sb-t cmp', head: head2, rows: [tr([cell(cnt(f.o_arr, A.arr), 'b'), cell(cnt(f.o_dep, A.dep), 'b'), cell(cnt(f.o_nj, A.nj), 'b'), cell(cnt(f.o_dr, A.dr), 'b'), cell(cnt(f.o_pup, A.pup), 'b'), cell(cnt(f.o_abs, A.abs), 'b')])] } };
      // staff: absence | lateness | resume of work (side by side)
      const n = Math.max(A.staff.length, A.late.length, A.back.length, 3);
      const rows = [];
      for (let i = 0; i < n; i++) {
        const a = A.staff[i], l = A.late[i], b = A.back[i];
        rows.push(tr([cell(a ? a.name : '', 'r b'), cell(a ? a.reason : '', 'sm'), cell(a ? Dx.fmtDate(a.from) : '', 'sm nw'), cell(a ? Dx.fmtDate(a.to) : '', 'sm nw'), cell(l ? l.name : '', 'r b'), cell(l ? l.dur : '', 'sm'), cell(b ? b.name : '', 'r b'), cell(b ? Dx.fmtDate(b.date) : '', 'sm nw')]));
      }
      const head = thr([{ t: 'الغياب', c: 'd', s: 4 }, { t: 'التأخرات', c: 'd', s: 2 }, { t: 'استئناف العمل', c: 'd', s: 2 }]) + thr(['الاسم والنسب', 'نوع الرخصة', 'من', 'إلى', 'الاسم والنسب', 'المدة', 'الاسم والنسب', 'التاريخ'].map(t => ({ t, c: 'd' })));
      const staff = { table: { cls: 'sb-t cmp', head, rows, colgroup: '<colgroup><col style="width:16%"><col style="width:13%"><col style="width:9.5%"><col style="width:9.5%"><col style="width:16%"><col style="width:13%"><col style="width:14%"><col style="width:9%"></colgroup>' } };
      const mk = (cap, headers, list, w, min, widths, cls) => [{ before: SB.cap(cap, 'dr-cap'), table: { cls: 'sb-t cmp', head: hd(headers), rows: rows3(list, w, min).map(r => tr(r.map((v, j) => cell(v, j === 0 ? 'r b' : 'sm')))), colgroup: `<colgroup>${widths.map(x => `<col style="width:${x}%">`).join('')}</colgroup>` }, minRows: 2 }];
      const acts = A.acts.concat((f.acts || []).filter(r => r.some(x => nm(x))));
      const sup = (f.sup || []).filter(r => r.some(x => nm(x)));
      const vis = (f.vis || []).filter(r => r.some(x => nm(x)));
      const inc = (f.inc || []).filter(r => r.some(x => nm(x)));
      const no = nm(f.no) || rankNo(sy, iso);
      const blocks = [{ html: `<div class="dr-line"><span>التقرير اليومي رقم: <b>${esc(no)}</b></span><span>ليوم: <b>${esc(dayLabel(iso))}</b></span></div>`, keepNext: true }, counts, { html: '<div style="height:1.5mm"></div>' }, staff]
        .concat(mk('الأنشطة التربوية والثقافية والرياضية', ['نوع النشاط', 'المكان', 'التأطير', 'الفئة المستهدفة', 'ملاحظات'], acts, 5, 2, [26, 18, 20, 18, 18]))
        .concat(mk('التأطير التربوي', ['نوع الزيارة', 'اسم السيد المؤطر', 'اسم الأستاذ', 'الأقسام', 'ملاحظات'], sup, 5, 2, [20, 24, 24, 14, 18]))
        .concat(mk('زيارات مختلفة', ['نوع الزيارة', 'أعضاء اللجنة', 'موضوع الزيارة', 'ملاحظات'], vis, 4, 2, [22, 30, 30, 18]))
        .concat(mk('الحوادث المدرسية', ['اسم التلميذ', 'نوع الحادثة', 'الأستاذ المؤطر', 'التوقيت', 'مكان الحادثة', 'ملاحظات'], inc, 6, 2, [22, 18, 20, 10, 15, 15]))
        .concat([{ html: `${SB.cap('مختلفات', 'dr-cap')}<div class="dr-misc">${esc(nm(f.misc)).replace(/\n/g, '<br>')}</div>`, keepNext: false }]);
      return { title: 'التقرير اليومي', sub: `الموسم الدراسي ${syText(sy)}${nm(f.unit) ? ' — ' + f.unit : ''}`, page: 'a4', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }), blocks };
    }
  });

  /* ---------- monthly summary: every working day of a month, from the application + the saved daily reports ---------- */
  const months = sy => { const a = MK.syStart(sy), out = []; for (let i = 0; i < 12; i++) { const m = ((8 + i) % 12) + 1, y = a + (8 + i >= 12 ? 1 : 0); out.push([`${y}-${String(m).padStart(2, '0')}`, `${Dx.MONTHS[m - 1]} ${y}`]); } return out; };
  const defMonth = sy => { const ym = today().slice(0, 7), L = months(sy); return (L.find(x => x[0] === ym) || L[0])[0]; };
  DOCS.push({
    k: 'dr_month', t: 'الحصيلة الشهرية للأنشطة المنجزة', grp: 'dr_a', d: 'جدول بكل أيام الشهر: غياب الأطر، التأخرات، استئناف العمل، تغيبات التلاميذ، الوافدون والمغادرون، الأنشطة والزيارات والحوادث، مع المجاميع.', auto: 'التقارير اليومية المحفوظة وبقية أقسام البرنامج', page: 'a4l',
    init: (s, sy) => ({ month: defMonth(sy), unit: '' }),
    defs: (f, sy) => [{ note: 'يُحسب تلقائيا لكل يوم عمل من الشهر. تُضاف بيانات التقارير اليومية المحفوظة (الأنشطة، التأطير، الزيارات، الحوادث).' }, { k: 'month', l: 'الشهر', t: 'select', opts: months(sy) }, { k: 'unit', l: 'الوحدة المدرسية (فارغ = كل المؤسسة)', list: 'k2Units' }],
    build: (s, f, sy) => {
      const ym = nm(f.month) || defMonth(sy), [Y, M] = ym.split('-').map(Number), last = new Date(Date.UTC(Y, M, 0)).getUTCDate();
      const days = dayStore(sy).days || {}, unit = nm(f.unit);
      const tot = { st: 0, late: 0, back: 0, abs: 0, arr: 0, dep: 0, act: 0, sup: 0, vis: 0, inc: 0 }, rows = [];
      for (let d = 1; d <= last; d++) {
        const iso = `${ym}-${String(d).padStart(2, '0')}`, w = dow(iso); if (w === 0 || w === 6) continue;
        const A = autoOf(sy, iso, unit), D = days[iso] || {};
        const L = x => (Array.isArray(x) ? x.filter(r => r.some(c => nm(c))).length : 0);
        const v = { st: A.staff.length, late: A.late.length, back: A.back.length, abs: nm(D.o_abs) !== '' ? +D.o_abs || 0 : A.abs, arr: nm(D.o_arr) !== '' ? +D.o_arr || 0 : A.arr, dep: nm(D.o_dep) !== '' ? +D.o_dep || 0 : A.dep, act: A.acts.length + L(D.acts), sup: L(D.sup), vis: L(D.vis), inc: L(D.inc) };
        Object.keys(tot).forEach(k => { tot[k] += v[k]; });
        if (!Object.values(v).some(x => x) && !days[iso]) continue;
        rows.push(tr([cell(dayLabel(iso), 'r'), cell(v.st || '', ''), cell(v.late || '', ''), cell(v.back || '', ''), cell(v.abs || '', ''), cell(v.arr || '', ''), cell(v.dep || '', ''), cell(v.act || '', ''), cell(v.sup || '', ''), cell(v.vis || '', ''), cell(v.inc || '', '')]));
      }
      rows.push(tr([{ t: 'المجموع', c: 'd b' }].concat(['st', 'late', 'back', 'abs', 'arr', 'dep', 'act', 'sup', 'vis', 'inc'].map(k => ({ t: String(tot[k]), c: 'd b' })))));
      const label = (months(sy).find(x => x[0] === ym) || [0, ym])[1];
      return { title: 'الحصيلة الشهرية للأنشطة المنجزة', sub: `شهر ${label} — الموسم الدراسي ${syText(sy)}${unit ? ' — ' + unit : ''}`, page: 'a4l', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }),
        blocks: [{ table: { cls: 'sb-t cmp', head: hd(['اليوم', 'الأطر الغائبة', 'الإذن لساعات', 'استئناف العمل', 'تغيبات التلاميذ', 'الوافدون', 'المغادرون', 'الأنشطة', 'زيارات التأطير', 'زيارات مختلفة', 'الحوادث']), rows, colgroup: `<colgroup><col style="width:19%">${'<col style="width:8.1%">'.repeat(10)}</colgroup>` }, minRows: 2 }] };
    }
  });

  Dx.modCss += `
  .dr-line{display:flex;justify-content:space-between;gap:6mm;font-size:12pt;margin:0 0 1.6mm;padding:1mm 3mm;border:1px solid #4472c4;border-radius:2mm;background:#eef3fb}
  .dr-cap{font-size:10.5pt!important;margin:1.6mm 0 .6mm!important;padding:0!important}
  .dr-misc{min-height:12mm;border:1px solid #4472c4;padding:2mm 3mm;font-size:10.5pt;line-height:1.7}`;

  let C = null;
  function center() {
    if (C) return C;
    C = K.center({
      id: 'dayrep', title: 'التقارير اليومية للأنشطة المنجزة', icon: '📋', route: 'dayrepDoc', hubRoute: 'dayrep', noSy: true, docLabel: 'التقرير',
      groups: [['dr_a', 'التقرير اليومي والحصيلة الشهرية']],
      docs: DOCS, store: sy => ST(sy), years: () => [MK.curSy()],
      intro: 'التقرير اليومي على النموذج المعتمد: حركة التلاميذ (الوافدون، المغادرون، غير الملتحق، المنقطع)، عدد التلاميذ والتغيبات، غياب الأطر والتأخرات واستئناف العمل، الأنشطة والتأطير والزيارات والحوادث. تُملأ الأعداد والقوائم تلقائيا من «بطاقة التلاميذ» و«سجل غياب التلاميذ» و«الغياب والرخص» و«الأنشطة المنجزة»، ويُحفظ كل يوم على حدة، مع حصيلة شهرية.'
    });
    return C;
  }
  window.DayRep = { autoOf, summary: () => ({ days: Object.keys(dayStore(MK.curSy()).days || {}).length }) };
  window.pageDayRep = (v, a) => { center().hub(v, a); };
  window.pageDayRepDoc = (v, a) => { center().doc(v, a); };
})();
