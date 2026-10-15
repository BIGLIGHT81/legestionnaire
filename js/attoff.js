'use strict';
/* نماذج المواظبة الرسمية وغياب الموظفين (من ملفات الإدارة):
   - «المواظبة الشهرية للمتعلمين» (النموذج الرسمي: هيئة التدريس، المستويات، الحجرات، نسبة المواظبة، الأوضاع الأخرى، الأمازيغية، الخصاص، الإحصاءات)
   - سجل غياب الموظفين ← بيان إحصائي لتغيبات الموظفين، لائحة التتبع الشهري للغياب
   - استفسار + إشعار بالاستلام، طلب رخصة، طلب شهادة إدارية (عربية/فرنسية)، محضر استئناف العمل، وصل استلام شهادة طبية */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, num, r2, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');

  function migrate(db) {
    const o = db.attoff = db.attoff || {};
    o.abs = Array.isArray(o.abs) ? o.abs : [];
    o.years = o.years && typeof o.years === 'object' ? o.years : {};
    o.abs.forEach(a => { a.id = a.id || uid('ab'); });
  }
  const AO = () => { migrate(DB); return DB.attoff; };
  const store = sy => { const y = AO().years; return y[sy] || (y[sy] = {}); };

  /* ---------- helpers ---------- */
  const MONTHS = () => (window.Attend && Attend.MONTHS) || [['09', 'شتنبر'], ['10', 'أكتوبر'], ['11', 'نونبر'], ['12', 'دجنبر'], ['01', 'يناير'], ['02', 'فبراير'], ['03', 'مارس'], ['04', 'أبريل'], ['05', 'ماي'], ['06', 'يونيو']];
  const mName = mm => (MONTHS().find(x => x[0] === mm) || [0, mm])[1];
  const monthYear = (sy, mm) => (+mm >= 9 ? MK.syStart(sy) : MK.syStart(sy) + 1);
  const defMonth = sy => { const m = MK.syRef(sy).slice(5, 7); return MONTHS().some(x => x[0] === m) ? m : (m === '07' || m === '08' ? '06' : '09'); };
  const monthOpts = () => MONTHS().map(([k, l]) => [k, l]);
  const sexOf = e => e.sex || (/ة\s*$/.test(nm(e.firstAr)) ? 'F' : 'M');
  const emps = () => (typeof staffEmps === 'function' ? staffEmps() : sortedEmps());   // 1.9.4: without the pre-school educators
  const cat = e => K.E.cat(e);
  const teachersIn = () => emps().filter(e => (cat(e) === 'teacher' && !nm(e.assigned)) || cat(e) === 'assigned');
  const teachersOut = () => emps().filter(e => cat(e) === 'teacher' && nm(e.assigned));
  const lvDigits = e => (window.Board ? Board.levelDigits(e) : []);
  const unitIdx = u => { const l = window.Board ? Board.unitNames() : []; const i = l.findIndex(x => Board.sameU(x, u)); return i < 0 ? 99 : i; };
  const dayDiff = (a, b) => { if (!a || !b) return 0; const d = Math.round((new Date(b) - new Date(a)) / 864e5) + 1; return d > 0 ? d : 0; };
  const evDays = e => (nm(e.days) !== '' ? num(e.days) : dayDiff(e.from, e.to));
  const evLabel = e => `${e.emp || '؟'} — ${e.from ? ldate(e.from) : ''} (${evDays(e)} ي) — ${e.kind === 'u' ? 'غير مبرر' : (e.type || 'مبرر')}`;
  const evs = () => AO().abs.slice().sort((a, b) => String(a.from || '').localeCompare(String(b.from || '')));
  // 1.9.4: the monthly statements also take every absence registered in «سجل الغياب والرخص» (leave requests, medical
  // certificates, inquiries, manual entries), not only the register of this page; an absence over two months is cut per month
  const recEvs = () => { try { return (typeof absenceEntries === 'function' ? absenceEntries() : []).map(a => { const e = (DB.employees || []).find(x => x.id === a.rec.empId); const r = nm(a.reason);
    const u = a.just ? a.just === 'u' : /غير مبرر|^غياب$|تغيب/.test(r) && !/رخص|إذن/.test(r); return { id: 'rec:' + a.rec.id, emp: e ? fullName(e) : ((a.rec.snap || {}).name || ''), from: a.from, to: a.to || a.from, kind: u ? 'u' : 'j', type: u ? '' : r.replace(/^رخصة\s*/, ''), reason: u ? r : '' }; }).filter(x => x.emp && x.from); } catch (_) { return []; } };
  const allEvs = () => { const seen = new Set(), out = [];
    evs().concat(recEvs()).forEach(x => { const k = MK.hkey(x.emp) + '|' + x.from; if (seen.has(k)) return; seen.add(k); out.push(x); });
    return out.sort((a, b) => String(a.from || '').localeCompare(String(b.from || ''))); };
  const inMonth = (sy, mm) => { const y = monthYear(sy, mm), last = new Date(Date.UTC(y, +mm, 0)).getUTCDate(), m1 = `${y}-${mm}-01`, m2 = `${y}-${mm}-${String(last).padStart(2, '0')}`;
    return allEvs().map(x => { const f = String(x.from || ''), t = String(x.to || x.from || ''); if (!f || f > m2 || t < m1) return null;
      if (f >= m1 && t <= m2) return x; const f2 = f > m1 ? f : m1, t2 = t < m2 ? t : m2; return Object.assign({}, x, { from: f2, to: t2, days: '' }); }).filter(Boolean); };
  const evsOf = (name, mm, sy) => inMonth(sy, mm).filter(x => MK.hkey(x.emp) === MK.hkey(name));
  const evById = id => AO().abs.find(x => x.id === id) || null;
  const empOf = name => K.E.byName(name) || {};
  const dots = (v, n) => nm(v) || '.'.repeat(n || 18);
  const hd = (cells, cls) => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: cls || 'd' })));
  const kvT = pairs => {
    const rows = [];
    for (let i = 0; i < pairs.length; i += 2) { const a = pairs[i], b = pairs[i + 1] || ['', '']; rows.push(tr([{ t: a[0], c: 'k' }, { t: a[1] }, { t: b[0], c: b[0] ? 'k' : '' }, { t: b[1] }])); }
    return { table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:20%"><col style="width:30%"><col style="width:20%"><col style="width:30%"></colgroup>', rows } };
  };
  const kv2T = pairs => ({ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:30%"><col style="width:70%"></colgroup>', rows: pairs.map(a => tr([{ t: a[0], c: 'k' }, { t: a[1] }])) } });
  const gridDef = (k, l, cols, o) => Object.assign({ k, l, t: 'grid', cols, widths: cols.map(() => '1fr') }, o || {});
  const P = (h, st) => ({ html: `<p class="sb-p"${st ? ` style="${st}"` : ''}>${h}</p>` });
  const dirName = () => S().director || '..........';

  const DOCS = [];
  const add = d => DOCS.push(d);
  const evField = { k: 'evt', l: 'من سجل غياب الموظفين (اختياري)', t: 'select', opts: () => [['', '— إدخال يدوي —']].concat(evs().map(e => [e.id, evLabel(e)])) };
  // the identity of the employee + the dates of the chosen absence (what is typed wins over the register)
  const who = f => { const ev = evById(f.evt) || {}; const name = nm(f.name) || ev.emp || ''; return { name, e: empOf(name), ev, from: f.from || ev.from || '', to: f.to || ev.to || '', days: nm(f.days) !== '' ? f.days : (ev.from ? evDays(ev) : ''), type: nm(f.type) || ev.type || '', reason: ev.reason || '' }; };

  /* =================== المواظبة الشهرية للمتعلمين =================== */
  const distribute = (m, f, k, i) => ({ m: Math.floor(m / k) + (i < m % k ? 1 : 0), f: Math.floor(f / k) + (i < f % k ? 1 : 0) });
  function formRows(sy) {
    const arr = window.Pupils ? Pupils.current(sy) : [];
    const T = teachersIn().slice().sort((a, b) => unitIdx(a.unit) - unitIdx(b.unit) || fullName(a).localeCompare(fullName(b), 'ar'));
    const cnt = {};
    T.forEach(e => lvDigits(e).forEach(d => { const k = `${MK.hkey(e.unit)}|${d}`; (cnt[k] = cnt[k] || []).push(e.id); }));
    return T.map(e => {
      const per = {}; let tm = 0, tf = 0;
      lvDigits(e).forEach(d => {
        const c = window.Pupils ? Pupils.cnt(arr, p => p.lvl === 'P' + d && (!e.unit || Board.sameU(p.unit, e.unit))) : { m: 0, f: 0 };
        const ids = cnt[`${MK.hkey(e.unit)}|${d}`] || [e.id];
        const x = distribute(c.m, c.f, ids.length, ids.indexOf(e.id));
        per[d] = { t: x.m + x.f, f: x.f }; tm += x.m; tf += x.f;
      });
      return { e, per, t: tm + tf, f: tf, unit: e.unit || '', n: lvDigits(e).length };
    });
  }
  const thresholds = { 1: 45, 2: 38, 3: 15 };
  add({
    k: 'ao_form', t: 'المواظبة الشهرية للمتعلمين (النموذج الرسمي)', grp: 'pu', d: 'النموذج الرسمي الشهري: هيئة التدريس، أعداد التلاميذ حسب المستوى، الحجرات، نسبة المواظبة، الأوضاع الأخرى، الأمازيغية، الخصاص والإحصاءات.', auto: 'لوائح الموظفين والتلاميذ وإحصاء المواظبة', page: 'a4l',
    init: (s, sy) => ({ mm: defMonth(sy), phone: s.phone || '', deficit: [], rooms: [], mode: [], extra: [['', '', '', '', '', '']], outside: [['', '', '', '', '', '']], amz: [['', '', '', '', '', '']], lack: [['', '', '', '', '']] }),
    defs: (f, sy) => [{ k: 'mm', l: 'شهر المواظبة', t: 'select', opts: monthOpts, half: true }, { k: 'phone', l: 'الهاتف', half: true, dir: 'ltr' },
      { note: 'الأعداد تُحسب من لوائح التلاميذ (توزع بالتساوي إذا اشترك أستاذان في المستوى والوحدة)، ونسب المواظبة من خانة «المواظبة الشهرية». لتغيير الفائض/الخصاص أو الحجرات أو صيغة العمل لكل أستاذ أضف سطرا بنفس الاسم أدناه.' },
      gridDef('rooms', 'تعديلات لكل أستاذ(ة): الفائض/الخصاص، الحجرات المستعملة، صيغة العمل', ['الأستاذ(ة)', 'الفائض/الخصاص', 'الحجرات المستعملة', 'صيغة العمل'], { widths: ['2fr', '1fr', '1fr', '1fr'], list: ['k2Emps'] }),
      gridDef('extra', 'مكلفون بمهام الإدارة والخدمات ومدرسون في وضعيات أخرى (إضافة يدوية)', ['الاسم والنسب', 'رقم التأجير', 'الإطار', 'الوحدة', 'المهمة أو مدة الرخصة', 'ملاحظات'], { widths: ['1.6fr', '.9fr', '.8fr', '.9fr', '1.2fr', '1fr'], list: ['k2Emps'], link: { src: 'emp', cols: { ppr: 1, cadre: 2, unit: 3 } } }),
      gridDef('outside', 'المكلفون خارج المؤسسة (إضافة يدوية)', ['الاسم والنسب', 'رقم التأجير', 'الإطار', 'مؤسسة التكليف', 'المرجع (رقم التكليف وتاريخه)', 'ملاحظات'], { widths: ['1.6fr', '.9fr', '.8fr', '1.1fr', '1.3fr', '1fr'], list: ['k2Emps'], link: { src: 'emp', cols: { ppr: 1, cadre: 2 } } }),
      gridDef('amz', 'أساتذة اللغة الأمازيغية (إضافة يدوية)', ['اسم الأستاذ(ة)', 'رقم التأجير', 'الوحدة المدرسية', 'عدد الأقسام المدرسة', 'عدد الساعات', 'ملاحظات'], { widths: ['1.6fr', '.9fr', '1.1fr', '.8fr', '.8fr', '1fr'], list: ['k2Emps'], link: { src: 'emp', cols: { ppr: 1, unit: 2 } } }),
      gridDef('lack', 'الخصاص', ['سبب الخصاص', 'عدد الأقسام بدون أستاذ', 'المستوى/المستويات', 'عدد التلاميذ', 'الحل المؤقت'], { widths: ['1.3fr', '.9fr', '1fr', '.8fr', '1.3fr'] })],
    build: (s, f, sy) => {
      const mm = f.mm || defMonth(sy), rows = formRows(sy), ovr = {}; (f.rooms || []).forEach(r => { if (nm(r[0])) ovr[MK.hkey(r[0])] = r; });
      const rate = u => { const r = window.Attend && Attend.unitRate ? Attend.unitRate(sy, mm, u) : null; return r == null ? null : r; };
      const units = []; rows.forEach(r => { let g = units.find(x => MK.hkey(x.u) === MK.hkey(r.unit)); if (!g) units.push(g = { u: r.unit, rows: [] }); g.rows.push(r); });
      const rates = units.map(g => rate(g.u)).filter(x => x != null);
      const general = rates.length ? r2(rates.reduce((a, b) => a + b, 0) / rates.length) : null;
      const L = [1, 2, 3, 4, 5, 6];
      const head = `<tr><th rowspan="3" class="d">ر.ت</th><th rowspan="3" class="d">الوحدة المدرسية</th><th rowspan="3" class="d">الفائض/ الخصاص (1)</th><th rowspan="3" class="d">اسم الأستاذ(ة)</th><th rowspan="3" class="d">رقم التأجير</th><th rowspan="3" class="d">التكوين</th><th colspan="2" class="d">وضعية الأستاذ(ة)</th><th rowspan="3" class="d">لغة التدريس</th><th colspan="14" class="d">عدد التلاميذ حسب المستوى المدرس</th><th rowspan="3" class="d">الحجرات المستعملة</th><th rowspan="3" class="d">صيغة العمل</th><th rowspan="3" class="d">نسبة المواظبة %</th></tr>`
        + `<tr><th rowspan="2" class="d">أصلي</th><th rowspan="2" class="d">مكلف من (2)</th>${L.map(d => `<th colspan="2" class="d">المستوى ${['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'][d - 1]}</th>`).join('')}<th colspan="2" class="d">المجموع</th></tr>`
        + `<tr>${L.concat([0]).map(() => '<th class="d">المج.</th><th class="d">إناث</th>').join('')}</tr>`;
      let n = 0; const body = []; const tot = { t: 0, f: 0 };
      units.forEach(g => g.rows.forEach((r, i) => {
        n++; const e = r.e, o = ovr[MK.hkey(fullName(e))] || [];
        const orig = nm(e.status) === 'مكلف' || cat(e) === 'assigned';
        const cells = [n];
        if (i === 0) { cells.push({ t: g.u || '', c: 'b', r: g.rows.length }); cells.push({ t: nm(o[1]) || '0', r: g.rows.length }); }
        else if (nm(o[1])) { /* per-teacher deficit overrides the unit value only on the first row */ }
        cells.push({ t: fullName(e), c: 'r b nw' }, e.ppr || '', e.formation || '', orig ? '' : '✓', orig ? (e.origin || '✓') : '', e.teachLang || '');
        L.forEach(d => { const x = r.per[d]; cells.push(x && x.t ? x.t : '', x && x.t ? x.f : ''); });
        cells.push({ t: r.t || '', c: 'b' }, { t: r.t ? r.f : '', c: 'b' }, nm(o[2]) || '1', nm(o[3]) || '');
        if (i === 0) { const rt = rate(g.u); cells.push({ t: rt == null ? '' : rt.toFixed(2), c: 'b', r: g.rows.length }); }
        tot.t += r.t; tot.f += r.f;
        body.push(tr(cells));
      }));
      const sumL = d => rows.reduce((a, r) => a + ((r.per[d] || {}).t || 0), 0), sumF = d => rows.reduce((a, r) => a + ((r.per[d] || {}).f || 0), 0);
      body.push(tr([{ t: 'المجموع', s: 9, c: 'd b' }].concat(L.reduce((a, d) => a.concat([{ t: sumL(d) || '', c: 'd b' }, { t: sumF(d) || '', c: 'd b' }]), [])).concat([{ t: tot.t, c: 'd b' }, { t: tot.f, c: 'd b' }, { t: '', s: 3, c: 'd' }])));
      const main = { table: { cls: 'sb-t cmp xs', head, rows: body } };

      const NOT = { 1: '', 2: '' };
      const adminRows = emps().filter(e => ['admin', 'other', 'preschool'].includes(cat(e)) && !(cat(e) === 'other' && !nm(e.task)))
        .map(e => [fullName(e), e.ppr || '', e.cadre || '', e.unit || '', nm(e.task) || e.cadre || '', '']);
      const absRows = teachersIn().concat(teachersOut()).reduce((a, e) => a.concat(evsOf(fullName(e), mm, sy).map(ev => [fullName(e), e.ppr || '', e.cadre || '', e.unit || '', `${evDays(ev)} أيام`, ev.kind === 'u' ? (ev.reason || 'غياب غير مبرر') : (ev.type ? 'رخصة ' + ev.type : ev.reason || '')])), []);
      const oth = adminRows.concat(absRows).concat((f.extra || []).filter(r => nm(r[0])));
      const out = teachersOut().map(e => [fullName(e), e.ppr || '', e.cadre || '', e.assigned || '', '', '']).concat((f.outside || []).filter(r => nm(r[0])));
      const amzE = emps().filter(e => /أمازيغ|امازيغ/.test(`${e.subject || ''} ${e.teachLang || ''}`)).map(e => [fullName(e), e.ppr || '', e.unit || '', '', '', '']).concat((f.amz || []).filter(r => nm(r[0])));
      const lack = (f.lack || []).filter(r => r.some(nm));
      const mk = (cols, list, min, w) => tbl(hd(cols), list.map((r, i) => tr([i + 1].concat(r.map(x => ({ t: x, c: 'sm' }))))).concat(Array.from({ length: Math.max(0, min - list.length) }, (_, i) => tr([list.length + i + 1].concat(Array.from({ length: w }, () => ''))))), 'cmp');
      const s1 = mk(['ر.ت', 'الاسم والنسب', 'رقم التأجير', 'الإطار', 'الوحدة المدرسية', 'المهمة أو مدة الرخصة', 'ملاحظات'], oth, 2, 6);
      const s2 = mk(['ر.ت', 'الاسم والنسب', 'رقم التأجير', 'الإطار', 'مؤسسة التكليف', 'المرجع (رقم التكليف وتاريخه)', 'ملاحظات'], out, 1, 6);
      const s3 = mk(['ر.ت', 'اسم الأستاذ(ة)', 'رقم التأجير', 'الوحدة المدرسية', 'عدد الأقسام المدرسة', 'عدد الساعات', 'ملاحظات'], amzE, 1, 6);
      const s4 = mk(['ر.ت', 'سبب الخصاص', 'عدد الأقسام بدون أستاذ', 'المستوى/المستويات', 'عدد التلاميذ', 'الحل المؤقت'], lack, 1, 5);
      // statistics of the teaching staff
      const lang = e => { const x = nm(e.formation); if (/معرب/.test(x)) return 'ar'; if (/مزدوج|مفرنس/.test(x)) return 'mix'; return e.teachLang === 'عربية' ? 'ar' : 'mix'; };
      const stat = list => { const c = { ar: { m: 0, f: 0 }, mix: { m: 0, f: 0 } }; list.forEach(e => { c[lang(e)][sexOf(e) === 'F' ? 'f' : 'm']++; }); return c; };
      const a = stat(teachersIn()), b = stat(teachersOut());
      const sr = (label, c) => tr([{ t: label, c: 'k b r' }, c.ar.m, c.ar.f, c.ar.m + c.ar.f, c.mix.m, c.mix.f, c.mix.m + c.mix.f, c.ar.m + c.mix.m, c.ar.f + c.mix.f, c.ar.m + c.ar.f + c.mix.m + c.mix.f]);
      const sa = { ar: { m: a.ar.m + b.ar.m, f: a.ar.f + b.ar.f }, mix: { m: a.mix.m + b.mix.m, f: a.mix.f + b.mix.f } };
      const st1 = tbl(`<tr><th rowspan="2" class="d">فئات هيئة التدريس حسب لغة التدريس</th><th colspan="3" class="d">المعربون</th><th colspan="3" class="d">المزدوجون</th><th colspan="3" class="d">المجموع العام</th></tr><tr>${'<th class="d">ذكور</th><th class="d">إناث</th><th class="d">المجموع</th>'.repeat(3)}</tr>`,
        [sr('العاملون بالأقسام من المدرسين القارين بالمؤسسة', a), sr('المكلفون خارج المؤسسة من المدرسين القارين', b), sr('المجموع', sa)], 'cmp');
      const byN = k => rows.filter(r => r.n === k), few = (k, th) => [byN(k).filter(r => r.t < th).length, byN(k).filter(r => r.t >= th).length];
      const cl = [1, 2, 3, 4, 5, 6].map(k => (thresholds[k] ? few(k, thresholds[k]) : [byN(k).length]));
      const st2 = tbl(`<tr><th rowspan="2" class="d">مجموع عدد الأقسام</th>${[1, 2, 3, 4, 5, 6].map(k => `<th colspan="${thresholds[k] ? 2 : 1}" class="d">أقسام بـ ${['مستوى واحد', 'مستويين', 'ثلاث مستويات', 'أربعة مستويات', 'خمسة مستويات', 'ست مستويات'][k - 1]}</th>`).join('')}</tr><tr>${[1, 2, 3].map(k => `<th class="d">أقل من ${thresholds[k]} تلميذا</th><th class="d">${thresholds[k]} فما فوق</th>`).join('')}<th class="d">العدد</th><th class="d">العدد</th><th class="d">العدد</th></tr>`,
        [tr([{ t: rows.length, c: 'b' }].concat(cl.reduce((x, c) => x.concat(c), [])))], 'cmp');
      const blocks = [
        kvT([['رمز المؤسسة', s.code || '..........'], ['الجماعة', s.commune || ''], ['الهاتف', f.phone || s.phone || ''], ['المواظبة الشهرية لشهر', `${mName(mm)} ${monthYear(sy, mm)}`], ['الموسم الدراسي', syText(sy)], ['النسبة العامة للمواظبة', general == null ? '..........' : `${general.toFixed(2)}%`]]),
        main, { html: '<div style="font-size:8pt;margin:1mm 0">(1) الفائض أو الخصاص بناء على البنية التربوية — (2) المؤسسة الأصلية للأستاذ(ة) المكلف(ة).</div>' },
        { before: SB.cap('المكلفون بمهام الإدارة والخدمات والمدرسون الموجودون في وضعيات أخرى (3)', 'r'), table: s1.table }, { before: SB.cap('المكلفون خارج المؤسسة', 'r'), table: s2.table },
        { before: SB.cap('أساتذة اللغة الأمازيغية', 'r'), table: s3.table }, { before: SB.cap('الخصاص', 'r'), table: s4.table },
        { before: SB.cap('إحصاء هيئة التدريس', 'r'), table: st1.table }, { before: SB.cap('إحصاء الأقسام', 'r'), table: st2.table }];
      return { title: 'المواظبة الشهرية للمتعلمين', sub: `${mName(mm)} ${monthYear(sy, mm)} — الموسم الدراسي ${syText(sy)}`, page: 'a4l', blocks, sign: SB.sign(s, { right: '', left: 'توقيع مدير المؤسسة' }).replace('class="sb-sign"', 'class="sb-sign" style="min-height:10mm;margin-top:.5mm"') };
    }
  });

  /* =================== بيان إحصائي لتغيبات الموظفين =================== */
  add({
    k: 'ao_stat', t: 'بيان إحصائي لتغيبات الموظفين', grp: 'st', d: 'شهريا: لكل موظف أيام الغياب المبررة (نوع الرخصة والتواريخ) وغير المبررة والمجموع. يُرسل إلى المديرية في اليوم الرابع من الشهر الموالي.', auto: 'سجل غياب الموظفين ولائحة الموظفين', page: 'a4l',
    init: (s, sy) => ({ mm: defMonth(sy), city: s.city || '', date: '', work: '' }),
    defs: () => [{ k: 'mm', l: 'الشهر', t: 'select', opts: monthOpts, half: true }, { k: 'work', l: 'أيام العمل في الشهر (فارغ = تُحسب تلقائيا دون الآحاد والعطل)', t: 'num', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }, { note: 'تُسجَّل التغيبات في «سجل غياب الموظفين» بالصفحة الرئيسية لهذه الخانة، وتُجمع هنا تلقائيا حسب الشهر.' }],
    build: (s, f, sy) => {
      const mm = f.mm || defMonth(sy);
      // 1.9.4: attendance rate = 1 - working days of absence / working days of the month (Sundays and holidays left out)
      const H = holSet(sy), [m1, m2] = monthSpan(sy, mm), td = Dx.todayIso(), mEnd = m2 > td && m1 <= td ? td : m2, W = num(f.work) || workDays(m1, mEnd, sy, H);
      const grp = list => list.map(e => {
        const E = evsOf(fullName(e), mm, sy), J = E.filter(x => x.kind !== 'u'), U = E.filter(x => x.kind === 'u');
        const jd = J.reduce((a, x) => a + evDays(x), 0), ud = U.reduce((a, x) => a + evDays(x), 0);
        const wd = E.reduce((a, x) => a + workDays(x.from, x.to, sy, H), 0);
        return { e, jd, ud, wd, J, U, note: E.map(x => x.reason).filter(Boolean).join('، ') };
      });
      const gRate = list => (list.length && W ? rateTxt(list.reduce((a, g) => a + g.wd, 0), W * list.length) : '');
      const teach = grp(teachersIn().concat(teachersOut())), others = grp(emps().filter(e => !['teacher', 'assigned'].includes(cat(e))));
      const rowOf = (g, i) => tr([i + 1, { t: fullName(g.e), c: 'r b' }, g.e.ppr || '', { t: g.e.cadre || '', c: 'sm' }, { t: g.e.task || (['teacher', 'assigned'].includes(cat(g.e)) ? 'التدريس' : ''), c: 'sm' },
        g.jd || '', { t: g.J.map(x => x.type).filter(Boolean).join('، '), c: 'sm' }, { t: g.J[0] && g.J[0].from ? ldate(g.J[0].from) : '', c: 'sm' }, { t: g.J[0] && g.J[0].to ? ldate(g.J[0].to) : '', c: 'sm' },
        g.ud || '', { t: g.U[0] && g.U[0].from ? ldate(g.U[0].from) : '', c: 'sm' }, { t: g.U[0] && g.U[0].to ? ldate(g.U[0].to) : '', c: 'sm' }, { t: g.jd + g.ud || '0', c: 'b' }, { t: rateTxt(g.wd, W), c: g.wd ? 'b' : 'sm' }, { t: g.note, c: 'sm' }]);
      const totRow = (label, list) => tr([{ t: label, s: 5, c: 'd b' }, { t: list.reduce((a, g) => a + g.jd, 0) || 0, c: 'd b' }, { t: '', s: 3, c: 'd' }, { t: list.reduce((a, g) => a + g.ud, 0) || 0, c: 'd b' }, { t: '', s: 2, c: 'd' }, { t: list.reduce((a, g) => a + g.jd + g.ud, 0) || 0, c: 'd b' }, { t: gRate(list), c: 'd b' }, { t: '', c: 'd' }]);
      const sec = t => tr([{ t, s: 15, c: 'k b' }]);
      const rows = [sec('هيئة التدريس')].concat(teach.map(rowOf), [totRow('المجموع', teach), sec('الفئات الأخرى')], others.map(rowOf), [totRow('المجموع', others), totRow('المجموع العام', teach.concat(others))]);
      const head = `<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">أسماء العاملين بالمؤسسة</th><th rowspan="2" class="d">رقم التأجير</th><th rowspan="2" class="d">الإطار</th><th rowspan="2" class="d">المهمة</th><th colspan="4" class="d">الغيابات المبررة</th><th colspan="3" class="d">الغيابات غير المبررة (2)</th><th rowspan="2" class="d">مجموع أيام الغياب (3)=(1)+(2)</th><th rowspan="2" class="d">نسبة الحضور (4)</th><th rowspan="2" class="d">ملاحظات</th></tr><tr><th class="d">عدد الأيام (1)</th><th class="d">المبرر (نوع الرخصة)</th><th class="d">من</th><th class="d">إلى</th><th class="d">عدد الأيام</th><th class="d">من</th><th class="d">إلى</th></tr>`;
      return { title: `بيان إحصائي لتغيبات الموظفين خلال شهر: ${mName(mm)} ${monthYear(sy, mm)}`, sub: '', page: 'a4l', blocks: [tbl(head, rows, 'cmp'), { html: `<div style="font-size:8.5pt;margin-top:1mm">(4) نسبة الحضور = 100% − (أيام العمل التي تغيب فيها الموظف ÷ أيام العمل في الشهر: <b>${W}</b> يوما، دون الآحاد والعطل). — * يرسل إلى المديرية الإقليمية في اليوم الرابع من الشهر الموالي.</div>` }],
        sign: SB.sign(s, { right: `التاريخ: ${esc(f.date ? ldate(f.date) : '..........')}`, left: 'التوقيع (مدير المؤسسة): ' }) };
    }
  });

  add({
    k: 'ao_list', t: 'لائحة التتبع الشهري للغياب', grp: 'st', d: 'لائحة المتغيبين خلال الشهر: فترة الغياب والمدة والسبب.', auto: 'سجل غياب الموظفين', page: 'a4',
    init: (s, sy) => ({ mm: defMonth(sy), city: s.city || '', date: '' }),
    defs: () => [{ k: 'mm', l: 'الشهر', t: 'select', opts: monthOpts, half: true }, { k: 'city', l: 'وحرر في', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f, sy) => {
      const mm = f.mm || defMonth(sy), key = `${monthYear(sy, mm)}-${mm}`;
      const list = inMonth(sy, mm);
      const rows = list.map((x, i) => { const e = empOf(x.emp); return tr([i + 1, e.ppr || '', { t: x.emp, c: 'r b' }, { t: e.cadre || '', c: 'sm' }, { t: x.from ? ldate(x.from) : '', c: 'sm' }, { t: x.to ? ldate(x.to) : '', c: 'sm' }, evDays(x) || '', { t: x.kind === 'u' ? (x.reason || 'غير مبرر') : [x.type ? 'رخصة ' + x.type : '', x.reason].filter(Boolean).join(' — '), c: 'sm' }]); });
      for (let i = rows.length; i < 12; i++) rows.push(tr([i + 1, '', '', '', '', '', '', { t: '', st: 'height:7mm' }]));
      const head = `<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">رقم التأجير</th><th rowspan="2" class="d">الاسم الكامل</th><th rowspan="2" class="d">الإطار</th><th colspan="2" class="d">فترة الغياب</th><th rowspan="2" class="d">المدة بالأيام</th><th rowspan="2" class="d">سبب التغيب</th></tr><tr><th class="d">من</th><th class="d">إلى</th></tr>`;
      return { title: `لائحة التتبع الشهري للغياب خلال شهر: ${mName(mm)} ${monthYear(sy, mm)}`, sub: '', page: 'a4', blocks: [tbl(head, rows, 'cmp')], sign: SB.sign(s, { right: `وحرر في: ${esc(f.city || s.city || '')} ${esc(f.date ? ldate(f.date) : '..........')}`, left: 'توقيع وطابع السيد مدير المؤسسة' }) };
    }
  });

  /* =================== 1.9.4: التتبع الشامل لغياب الموظفين (الموسم كله) =================== */
  // every absence known to the program: the register of this section + the documents / manual entries of «الغياب والرخص»
  const allAbs = () => {
    const out = [], seen = new Set();
    const push = (name, from, to, days, kind, type) => {
      if (!from) return; const k = MK.hkey(name) + '|' + from + '|' + (to || ''); if (seen.has(k)) return; seen.add(k);
      if (!to) { const n = Math.max(1, Math.round(num(days) || 1)); const d = new Date(from + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n - 1); to = d.toISOString().slice(0, 10); }
      out.push({ name, from, to, kind, type });
    };
    AO().abs.forEach(x => push(nm(x.emp), x.from, x.to, x.days, x.kind === 'u' ? 'u' : 'j', nm(x.type) || (x.kind === 'u' ? 'غير مبرر' : 'رخصة')));
    try { (typeof absenceEntries === 'function' ? absenceEntries() : []).forEach(a => { const e = (DB.employees || []).find(x => x.id === a.rec.empId); const n = e ? fullName(e) : ((a.rec.snap || {}).name || ''); push(n, a.from, a.to, '', a.just ? (a.just === 'u' ? 'u' : 'j') : /غير مبرر|غياب$|^غياب\b|تغيب/.test(a.reason || '') && !/رخص/.test(a.reason || '') ? 'u' : 'j', a.reason || ''); }); } catch (_) {}
    return out;
  };
  // 1.9.4: working days of a period (Sundays and the school holidays of the settings left out), for the attendance rate
  const holSet = sy => { const set = new Set(); try { (window.Holidays ? Holidays.forSy(sy) : []).forEach(h => { if (!h.from) return; const d = new Date(h.from + 'T00:00:00Z'), e = new Date((h.to || h.from) + 'T00:00:00Z'); for (let i = 0; d <= e && i < 60; i++, d.setUTCDate(d.getUTCDate() + 1)) set.add(d.toISOString().slice(0, 10)); }); } catch (_) {} return set; };
  const workDays = (a, b, sy, H) => { if (!a || !b || a > b) return 0; H = H || holSet(sy); let n = 0; const d = new Date(a + 'T00:00:00Z'), e = new Date(b + 'T00:00:00Z'); for (let i = 0; d <= e && i < 400; i++, d.setUTCDate(d.getUTCDate() + 1)) { if (d.getUTCDay() !== 0 && !H.has(d.toISOString().slice(0, 10))) n++; } return n; };
  const rateTxt = (abs, W) => (W > 0 ? Math.max(0, Math.min(100, 100 - abs * 100 / W)).toFixed(2) + '%' : '');
  const ovDays = (a1, a2, b1, b2) => { const x = a1 > b1 ? a1 : b1, y = a2 < b2 ? a2 : b2; return x <= y ? dayDiff(x, y) : 0; };
  const YM = () => MONTHS().concat([['07', 'يوليوز']]);
  const monthSpan = (sy, mm) => { const y = monthYear(sy, mm); const last = new Date(Date.UTC(y, +mm, 0)).getUTCDate(); return [`${y}-${mm}-01`, `${y}-${mm}-${String(last).padStart(2, '0')}`]; };
  add({
    k: 'ao_year', t: 'التتبع الشامل لغياب الموظفين (الموسم الدراسي)', grp: 'sy', d: 'جدول شامل لكل الموظفين: أيام الغياب في كل شهر من شتنبر إلى يوليوز، مجموع المبرر وغير المبرر، عدد الحالات وأنواع الرخص، ونسبة الحضور.', auto: 'سجل غياب الموظفين + خانة «الغياب والرخص» + لائحة الموظفين', page: 'a4l',
    init: (s, sy) => ({ who: 'all', only: '', city: s.city || '', date: '', work: '' }),
    defs: () => [{ k: 'who', l: 'الموظفون', t: 'select', opts: [['all', 'كل الموظفين'], ['abs', 'المتغيبون فقط'], ['teach', 'هيئة التدريس فقط'], ['other', 'الفئات الأخرى فقط']], half: true },
      { k: 'work', l: 'أيام العمل في الموسم (فارغ = تُحسب تلقائيا دون الآحاد والعطل)', t: 'num', half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      { note: 'يجمع هذا الجدول كل التغيبات المسجلة في البرنامج (سجل غياب الموظفين بهذه الخانة، وطلبات الرخص والشواهد الطبية والاستفسارات والغيابات المسجلة في «الغياب والرخص»)، موزعة على أشهر الموسم الدراسي.' }],
    build: (s, f, sy) => {
      const A = allAbs(), M = YM(), H = holSet(sy);
      const [ys] = monthSpan(sy, '09'), [, ye0] = monthSpan(sy, '06'), td = Dx.todayIso(), ye = td >= ys && td < ye0 ? td : ye0, W = num(f.work) || workDays(ys, ye, sy, H);
      let list = emps();
      if (f.who === 'teach') list = list.filter(e => ['teacher', 'assigned'].includes(cat(e)));
      if (f.who === 'other') list = list.filter(e => !['teacher', 'assigned'].includes(cat(e)));
      const rowsD = list.map(e => {
        const mine = A.filter(x => MK.hkey(x.name) === MK.hkey(fullName(e)));
        const per = M.map(([mm]) => { const [a, b] = monthSpan(sy, mm); return mine.reduce((t, x) => t + ovDays(x.from, x.to, a, b), 0); });
        const [y1] = monthSpan(sy, '09'), [, y2] = monthSpan(sy, '07');
        const inY = mine.filter(x => ovDays(x.from, x.to, y1, y2) > 0);
        const jd = inY.filter(x => x.kind !== 'u').reduce((t, x) => t + ovDays(x.from, x.to, y1, y2), 0), ud = inY.filter(x => x.kind === 'u').reduce((t, x) => t + ovDays(x.from, x.to, y1, y2), 0);
        const types = Array.from(new Set(inY.map(x => nm(x.type)).filter(Boolean)));
        const wd = inY.reduce((t, x) => t + workDays(x.from > ys ? x.from : ys, x.to < ye ? x.to : ye, sy, H), 0);
        return { e, per, jd, ud, wd, n: inY.length, types };
      }).filter(r => f.who !== 'abs' || r.jd + r.ud > 0);
      const rows = rowsD.map((r, i) => tr([i + 1, { t: fullName(r.e), c: 'r b' }, { t: r.e.ppr || '', c: 'sm' }, { t: r.e.cadre || '', c: 'sm' }].concat(r.per.map(d => ({ t: d || '', c: d ? 'b' : '' })),
        [{ t: r.jd || '', c: 'b' }, { t: r.ud || '', c: r.ud ? 'b red' : '' }, { t: r.jd + r.ud || '0', c: 'b' }, r.n || '', { t: r.types.join('، '), c: 'sm' }, { t: rateTxt(r.wd, W), c: r.wd ? 'b' : 'sm' }])));
      const sum = k => rowsD.reduce((t, r) => t + r[k], 0);
      rows.push(tr([{ t: 'المجموع', s: 4, c: 'd b' }].concat(M.map((_, i) => ({ t: rowsD.reduce((t, r) => t + r.per[i], 0) || '0', c: 'd b' })), [{ t: sum('jd') || '0', c: 'd b' }, { t: sum('ud') || '0', c: 'd b' }, { t: sum('jd') + sum('ud') || '0', c: 'd b' }, { t: sum('n') || '0', c: 'd b' }, { t: '', c: 'd' }, { t: rowsD.length && W ? rateTxt(sum('wd'), W * rowsD.length) : '', c: 'd b' }])));
      const head = `<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">الاسم الكامل</th><th rowspan="2" class="d">رقم التأجير</th><th rowspan="2" class="d">الإطار</th><th colspan="${M.length}" class="d">أيام الغياب حسب الشهر</th><th rowspan="2" class="d">المبرر</th><th rowspan="2" class="d">غير المبرر</th><th rowspan="2" class="d">المجموع</th><th rowspan="2" class="d">عدد الحالات</th><th rowspan="2" class="d">أنواع الرخص والأسباب</th><th rowspan="2" class="d">نسبة الحضور</th></tr><tr>${M.map(([, l]) => `<th class="d">${l}</th>`).join('')}</tr>`;
      const who = { abs: ' (المتغيبون)', teach: ' (هيئة التدريس)', other: ' (الفئات الأخرى)' }[f.who] || '';
      return { title: `التتبع الشامل لغياب الموظفين${who} — الموسم الدراسي ${syText(sy)}`, sub: '', page: 'a4l', blocks: [tbl(head, rows, 'cmp'), { html: `<div style="font-size:8.5pt;margin-top:1mm">نسبة الحضور = 100% − (أيام العمل التي تغيب فيها الموظف ÷ أيام العمل في الموسم إلى غاية ${esc(ldate(ye))}: <b>${W}</b> يوما، دون الآحاد والعطل المدرسية).</div>` }],
        sign: SB.sign(s, { right: `حرر ب: ${esc(f.city || s.city || '')} ${esc(f.date ? ldate(f.date) : '..........')}`, left: 'توقيع وطابع السيد مدير المؤسسة' }) };
    }
  });

  /* =================== النماذج الفردية =================== */
  const common = [evField, { k: 'name', l: 'الاسم (يُملأ منه رقم التأجير والإطار...)', half: true, list: 'k2Emps' }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }];
  const initC = s => ({ evt: '', name: '', city: s.city || '', date: '' });
  const dateLine = (s, f) => `${esc(f.city || s.city || '')} في: ${esc(f.date ? ldate(f.date) : '..........')}`;

  add({
    k: 'ao_query', t: 'استفسار عن التغيب (مع إشعار بالاستلام)', grp: 'fq', d: 'استفسار للموظف المتغيب بدون إذن قبل الخصم من الأجر (المرسوم 2.99.1216) وإشعار بالاستلام.', auto: 'سجل غياب الموظفين', page: 'a4',
    init: s => Object.assign(initC(s), { from: '', to: '', days: '' }),
    defs: () => common.concat([{ k: 'from', l: 'من (تاريخ بداية الغياب)', t: 'date', half: true }, { k: 'to', l: 'إلى', t: 'date', half: true }, { k: 'days', l: 'مدة التغيب بالأيام', t: 'num', half: true }]),
    build: (s, f) => {
      const w = who(f), e = w.e;
      return { title: 'استفسار', sub: '', page: 'a4', sign: false,
        blocks: [kvT([['المؤسسة', s.school || ''], ['من', `مدير ${s.school || ''}`], ['إلى السيد(ة)', dots(w.name)], ['رقم التأجير', dots(e.ppr, 12)], ['المرجع', 'المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (2000/05/10)'], ['مدة التغيب', w.days ? `${w.days} أيام` : '..........']]),
          P('<b>الموضوع:</b> استفسار.'), P('سلام تام بوجود مولانا الإمام المؤيد بالله،'),
          P(`وبعد، لقد بلغ إلى علمي أنك(م) تغيبت(م) عن عملك(م) خلال الفترة المتراوحة ما بين: من: <b>${esc(w.from ? ldate(w.from) : '..........')}</b> إلى: <b>${esc(w.to ? ldate(w.to) : '..........')}</b> بدون إشعار أو إذن سابق، الشيء الذي يتنافى والقوانين الجاري بها العمل.`),
          P('لذا، وقبل اتخاذ قرار الخصم من مرتبك(م) طبقا لمقتضيات المرسوم المشار إليه في المرجع أعلاه ولاسيما المادة 4 منه، يشرفني أن أطلب منك(م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى 15 يوما ابتداء من تاريخ توصلك(م) بهذا الاستفسار.'), P('والسلام.'),
          { html: `<div style="display:flex;justify-content:space-between;margin:3mm 0"><span>التاريخ: ${dateLine(s, f)}</span><b>توقيع الرئيس المباشر:</b></div>` },
          { html: '<div style="border-top:1.5px dashed #555;margin:6mm 0 4mm"></div>' },
          { html: `<div style="border:1.2px solid #1f3864;padding:3mm 4mm"><div style="font-weight:800;color:#1f3864;margin-bottom:2mm">إشعار باستلام استفسار:</div><div style="line-height:2.1">يشهد السيد (ة): <b>${esc(dots(w.name, 30))}</b> &nbsp;&nbsp; رقم التأجير: <b>${esc(dots(e.ppr, 12))}</b><br>أنه توصل(ت) باستفسار عن التغيب خلال الفترة المتراوحة: من: ${esc(w.from ? ldate(w.from) : '..........')} إلى: ${esc(w.to ? ldate(w.to) : '..........')}<br>التاريخ: .................. &nbsp;&nbsp;&nbsp;&nbsp; التوقيع: ..........................</div></div>` }] };
    }
  });

  const LEAVES = ['مرضية', 'أغراض شخصية', 'استثنائية', 'ولادة', 'الأبوة'];
  const DUR = n => (n === 1 ? '1 يوم' : n === 2 ? 'يومان' : `${n} أيام`);
  add({
    k: 'ao_leave', t: 'طلب رخصة', grp: 'fm', d: 'طلب رخصة (مرضية، أغراض شخصية، استثنائية، ولادة، الأبوة) مع رأي المدير وجدول رخص الاثني عشر شهرا الأخيرة.', auto: 'لائحة الموظفين وسجل الغياب', page: 'a4',
    init: s => Object.assign(initC(s), { type: 'مرضية', days: '', from: '', stop: '', opinion: '' }),
    defs: () => common.concat([{ k: 'type', l: 'نوع الرخصة', t: 'select', opts: LEAVES, half: true }, { k: 'days', l: 'مدتها بالأيام', t: 'num', half: true }, { k: 'from', l: 'ابتداء من', t: 'date', half: true }, { k: 'stop', l: 'تاريخ توقيف الموظف عن العمل', t: 'date', half: true }, { k: 'opinion', l: 'رأي السيد المدير' }]),
    build: (s, f) => {
      const w = who(f), e = w.e, days = num(w.days);
      const from = w.from, back = from ? from : '';
      const past = evs().filter(x => MK.hkey(x.emp) === MK.hkey(w.name) && (!from || (x.from < from && x.from >= `${+from.slice(0, 4) - 1}${from.slice(4)}`)));
      const hist = past.map((x, i) => tr([i + 1, { t: x.from ? `${ldate(x.from)}${x.to ? ' — ' + ldate(x.to) : ''}` : '', c: 'sm' }, `${evDays(x)} أيام`, { t: x.kind === 'u' ? (x.reason || 'غير مبرر') : [x.type, x.reason].filter(Boolean).join(' — '), c: 'sm' }]));
      for (let i = hist.length; i < 4; i++) hist.push(tr([i + 1, '', '', { t: '', st: 'height:7mm' }]));
      return { title: 'طلب رخصة', sub: '', page: 'a4', sign: SB.sign(s, { right: `حرر ب: ${dateLine(s, f)}`, left: 'توقيع رئيس المؤسسة' }),
        blocks: [kvT([['الاسم الكامل', dots(w.name)], ['رقم التأجير', dots(e.ppr, 12)], ['الإطار', dots(e.cadre, 14)], ['تاريخ الازدياد', e.birth ? ldate(e.birth) : '..........'], ['العنوان الشخصي للموظف', dots(e.address, 30)], ['المؤسسة', s.school || '']]),
          P(`<b>نوع الرخصة:</b> ${esc(LEAVES.includes(w.type) ? w.type : (w.type || '..........'))} &nbsp;&nbsp; <b>مدتها:</b> ${esc(days ? DUR(days) : '..........')} &nbsp;&nbsp; <b>ابتداء من:</b> ${esc(back ? ldate(back) : '..........')}`),
          P('يشرفني أن أطلب من سيادتكم الموافقة على منحي الرخصة المذكورة أعلاه، مرفقة بالوثائق المبررة عند الاقتضاء. وتقبلوا فائق التقدير والاحترام.'),
          { html: `<div style="display:flex;justify-content:space-between;margin:2mm 0 4mm"><span>حرر ب: ${dateLine(s, f)}</span><b>توقيع الموظف: ..............</b></div>` },
          { html: `<div style="border:1px solid #4472c4;padding:2mm 3mm;min-height:20mm"><b style="color:#1f3864">رأي السيد المدير:</b> ${esc(f.opinion || '')}<div style="margin-top:3mm"><b>تاريخ توقيف الموظف عن العمل:</b> ${esc(f.stop ? ldate(f.stop) : '..........')}</div></div>` },
          { before: SB.cap('جدول الرخص والتغيبات التي استفاد منها الموظف خلال 12 شهرا الأخيرة', 'r'), table: { cls: 'sb-t cmp', head: hd(['ر.ت', 'الفترة', 'المدة', 'السبب']), rows: hist } }] };
    }
  });

  const CERTS = [['work', 'شهادة العمل'], ['workFr', 'شهادة العمل باللغة الفرنسية'], ['duty', 'بيان الالتزام'], ['dutyFr', 'بيان الالتزام باللغة الفرنسية']];
  add({
    k: 'ao_cert', t: 'طلب شهادة إدارية (عمل / التزام)', grp: 'fm', d: 'طلب شهادة العمل أو بيان الالتزام (عربية أو فرنسية) موجه لمصلحة الموارد البشرية بالمديرية.', auto: 'لائحة الموظفين', page: 'a4',
    init: s => ({ name: '', city: s.city || '', date: '', cert: 'work', no: '', sent: '' }),
    defs: () => [{ k: 'name', l: 'الموظف(ة)', half: true, list: 'k2Emps' }, { k: 'cert', l: 'الشهادة المطلوبة', t: 'select', opts: CERTS, half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true }, { k: 'sent', l: 'أُرسل بتاريخ', t: 'date', half: true }, { k: 'no', l: 'تحت عدد', half: true }],
    build: (s, f) => {
      const e = empOf(f.name), label = (CERTS.find(c => c[0] === f.cert) || CERTS[0])[1], fr = /Fr$/.test(f.cert);
      return { title: 'طلب شهادة إدارية', sub: 'الحمد لله وحده', page: 'a4', sign: SB.sign(s, { right: 'إمضاء الموظف', left: 'توقيع وطابع رئيس المؤسسة', noDate: true }),
        blocks: [{ html: `<div style="text-align:left;font-weight:700;margin:0 0 2mm">${dateLine(s, f)}</div>` },
          kvT([['الاسم العائلي', dots(e.lastAr)], ['Nom', dots(e.lastFr)], ['الاسم الشخصي', dots(e.firstAr)], ['Prénom', dots(e.firstFr)], ['الرقم المالي', dots(e.ppr, 12)], ['تاريخ الازدياد', e.birth ? ldate(e.birth) : '..........'], ['رقم ب.ت.و', dots(e.cin, 12)], ['تاريخ التوظيف', e.hire ? ldate(e.hire) : '..........'], ['الإطار', dots(e.cadre, 14)], ['المهمة', dots(e.task, 14)], ['مقر العمل الأصلي', dots(e.origin || s.school, 14)], ['مؤسسة التكليف (1)', dots(e.assigned, 14)]]),
          kv2T([['إلى', 'مصلحة الموارد البشرية — مكتب تتبع الحياة الإدارية للموظفين'], ['تحت إشراف السيد مدير', s.directorate || s.school || ''], ['الموضوع (2)', `طلب ${label}${fr ? ' — (يُكتب الاسم الكامل بالحروف اللاتينية)' : ''}`]]),
          P('سلام تام بوجود مولانا الإمام،'), P('وبعد، يشرفني أن أطلب من سيادتكم موافاتي بالشهادة المذكورة في الموضوع أعلاه قصد الإدلاء بها لأغراض إدارية.'),
          { html: `<div style="font-size:9pt;margin-top:4mm;line-height:1.8">أرسل بتاريخ: ${esc(f.sent ? ldate(f.sent) : '..........')} &nbsp;&nbsp; تحت عدد: ${esc(f.no || '..........')}<br>(1): ضرورة الإشارة إلى مؤسسة التكليف إذا كان المعني مكلفا خارج مقر عمله الأصلي.<br>(2): في حالة طلب وثيقة باللغة الفرنسية ينبغي الإشارة إلى ذلك في الموضوع مع كتابة الاسم الكامل بالحروف اللاتينية.<br>* يعتمد هذا المطبوع لطلب شهادة إدارية واحدة.</div>` }] };
    }
  });

  const RESUME = ['استئناف العمل بعد رخصة مرض قصيرة الأمد', 'استئناف العمل بعد رخصة مرض متوسطة الأمد', 'استئناف العمل بعد رخصة مرض طويلة الأمد', 'استئناف العمل بعد رخصة الولادة', 'استئناف العمل بعد رخصة الأبوة', 'استئناف العمل بعد رخصة استثنائية', 'استئناف العمل بعد الاستيداع', 'استئناف العمل بعد الإلحاق', 'استئناف العمل بعد انهاء تكليف بمهمة', 'استئناف العمل بعد تغيب أو انقطاع العمل'];
  add({
    k: 'ao_resume', t: 'محضر استئناف العمل', grp: 'fq', d: 'شهادة استئناف الموظف عمله بعد رخصة أو تغيب أو إلحاق (10 حالات).', auto: 'لائحة الموظفين وسجل الغياب', page: 'a4',
    init: s => Object.assign(initC(s), { cas: RESUME[0], resume: '', after: '', days: '', phone: '' }),
    defs: () => common.concat([{ k: 'cas', l: 'الحالة', t: 'select', opts: RESUME }, { k: 'resume', l: 'تاريخ استئناف العمل', t: 'date', half: true }, { k: 'days', l: 'مدة الغياب (أيام)', t: 'num', half: true }, { k: 'after', l: 'بعد (تفصيل)', half: true }, { k: 'phone', l: 'الهاتف', half: true, dir: 'ltr' }]),
    build: (s, f) => {
      const w = who(f), e = w.e;
      return { title: 'محضر استئناف العمل', sub: f.cas, page: 'a4', sign: SB.sign(s, { three: ['توقيع المعني(ة) بالأمر', 'توقيع وملاحظة الرئيس المباشر', `حرر في: ${dateLine(s, f)}`] }),
        blocks: [P(`أنا الموقع أسفله: <b>${esc(dirName())}</b> مدير مؤسسة: <b>${esc(s.school || '')}</b>`), P('أشهد أن السيد(ة):'),
          kvT([['الاسم الشخصي', dots(e.firstAr)], ['الاسم العائلي', dots(e.lastAr)], ['Nom', dots(e.lastFr)], ['رقم التأجير', dots(e.ppr, 12)], ['الإطار', dots(e.cadre, 14)], ['الدرجة', dots(e.grade, 8)], ['بطاقة التعريف الوطنية', dots(e.cin, 12)], ['المهام الإدارية أو التربوية', dots(e.task, 14)], ['العنوان الشخصي', dots(e.address, 24)], ['الهاتف', dots(f.phone || e.phone, 12)]]),
          P(`قد استأنف(ت) عمله(ها) بتاريخ: <b>${esc(f.resume ? ldate(f.resume) : '..........')}</b> بعد: <b>${esc(nm(f.after) || f.cas.replace('استئناف العمل بعد ', ''))}</b> لمدة: <b>${esc(w.days ? DUR(num(w.days)) : '..........')}</b>.`),
          P(`<b>الحالة:</b> ${esc(f.cas)}`)] };
    }
  });

  add({
    k: 'ao_receipt', t: 'وصل استلام شهادة طبية', grp: 'fm', d: 'وصل تسلم المدير شهادة طبية (أو تمديدها) داخل الآجال القانونية.', auto: 'لائحة الموظفين وسجل الغياب', page: 'a4',
    init: s => Object.assign(initC(s), { kind: 'شهادة طبية مسلمة من الطبيب السيد(ة) :', doctor: '', got: '', from: '', days: '', addr: '', notes: 'تسلمت الشهادة الطبية داخل الآجال القانونية' }),
    defs: () => common.concat([{ k: 'kind', l: 'النوع', t: 'select', opts: ['شهادة طبية مسلمة من الطبيب السيد(ة) :', 'تمديد شهادة طبية مسلمة من الطبيب السيد(ة) :'] }, { k: 'doctor', l: 'الطبيب', half: true }, { k: 'got', l: 'تاريخ التسلم', t: 'date', half: true }, { k: 'from', l: 'ابتداء من', t: 'date', half: true }, { k: 'days', l: 'المدة بالأيام', t: 'num', half: true }, { k: 'addr', l: 'العنوان الشخصي أثناء فترة المرض' }, { k: 'notes', l: 'ملاحظات', t: 'area', rows: 2 }]),
    build: (s, f) => {
      const w = who(f), e = w.e;
      return { title: 'وصل استلام شهادة', sub: '', page: 'a4', sign: SB.sign(s, { right: 'توقيع المدلى بالشهادة(ات) الطبية', left: 'توقيع وخاتم الرئيس المباشر', noDate: true }),
        blocks: [P(`أنا الممضي أسفله: <b>${esc(dirName())}</b> مدير مؤسسة: <b>${esc(s.school || '')}</b>`), P(`أشهد أني تسلمت بتاريخ (1): <b>${esc(f.got ? ldate(f.got) : '..........')}</b> من طرف السيد(ة): <b>${esc(dots(w.name, 24))}</b>`),
          P(`${esc(f.kind)} <b>${esc(dots(f.doctor, 24))}</b> ابتداء من: <b>${esc((w.from) ? ldate(w.from) : '..........')}</b> لمدة: <b>${esc(w.days ? DUR(num(w.days)) : '..........')}</b>`),
          kvT([['تتعلق بالسيد(ة)', dots(w.name)], ['الرقم المالي', dots(e.ppr, 12)], ['رقم بطاقة تعريفه الوطنية', dots(e.cin, 12)], ['الإطار', dots(e.cadre, 14)], ['مادة التدريس', dots(e.subject, 14)], ['العنوان الشخصي أثناء فترة المرض', dots(f.addr || e.address, 24)]]),
          P(`<b>ملاحظات:</b> ${esc(f.notes || '')}`), P(`حرر بتاريخ: ${dateLine(s, f)}`),
          { html: '<div style="font-size:9pt;margin-top:3mm">(1) تاريخ تسلم الشهادة الطبية من طرف المدير أو الرئيس المباشر.</div>' }] };
    }
  });

  /* =================== the register & the pages =================== */
  const C = K.center({
    id: 'attoffSt', title: 'النماذج الرسمية لغياب الموظفين', icon: '🗂️', route: 'attoffStDoc', hubRoute: 'attoffSt', years: () => Object.keys(AO().years),
    // 1.9.4: sub-headings (tabs) — the monthly statements, the follow-up of the year, the inquiry / resumption, the leaves and certificates
    groups: [['st', 'غياب الموظفين — البيانات الشهرية', 'تُجمع من سجل غياب الموظفين ومن «سجل الغياب والرخص»'], ['sy', 'غياب الموظفين — التتبع الشامل للموسم'], ['fq', 'غياب الموظفين — الاستفسار واستئناف العمل'], ['fm', 'غياب الموظفين — الرخص والشواهد']], groupTabs: true,
    intro: 'سجّل غياب كل موظف مرة واحدة في «سجل غياب الموظفين» أدناه، ثم اختر الوثيقة المطلوبة: البيان الإحصائي الشهري، لائحة التتبع الشهري، التتبع الشامل للموسم، الاستفسار، طلب الرخصة، محضر الاستئناف... وستُملأ تلقائيا.',
    docs: () => DOCS.filter(d => d.grp !== 'pu'), store: sy => store(sy),
    hubButtons: () => `<button class="btn" id="aoBack">${ic('back')} الغياب والرخص</button>`,
    onHub: v => {
      const b = $('#aoBack', v); if (b) b.onclick = () => go('absences');
      const h = v.querySelector('.page-h');
      h.insertAdjacentHTML('afterend', `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>سجل غياب الموظفين</h3><span class="sp"></span><button class="btn pri sm" id="aoAdd">${ic('plus')} تسجيل غياب</button></div><div class="card-b" id="aoReg"></div></div>`);
      const reg = K.crud($('#aoReg', v), {
        list: () => AO().abs, empty: 'لا توجد تغيبات مسجلة بعد. اضغط «تسجيل غياب».', addTitle: 'تسجيل غياب موظف', editTitle: 'تعديل التغيب',
        defaults: () => ({ emp: '', from: Dx.todayIso(), to: '', days: '', kind: 'j', type: 'مرضية', reason: '', ref: '' }),
        cols: [{ k: 'emp', l: 'الموظف(ة)', list: 'k2Emps', req: true }, { k: 'from', l: 'من', t: 'date', req: true }, { k: 'to', l: 'إلى', t: 'date' }, { k: 'days', l: 'عدد الأيام', t: 'num', show: r => esc(String(evDays(r) || '')) },
          { k: 'kind', l: 'النوع', t: 'select', opts: [['j', 'غياب مبرر (رخصة)'], ['u', 'غياب غير مبرر']], show: r => (r.kind === 'u' ? '<span class="red">غير مبرر</span>' : 'مبرر') }, { k: 'type', l: 'نوع الرخصة', list: 'aoTypes' }, { k: 'reason', l: 'السبب / ملاحظات', t: 'area', full: true, hide: false }, { k: 'ref', l: 'مرجع الشهادة/القرار', hide: true }],
        beforeSave: d => { if (nm(d.days) === '' && d.from && d.to) d.days = String(dayDiff(d.from, d.to)); },
        onChange: () => { persist(); }
      });
      const dlx = document.createElement('div'); dlx.innerHTML = `<datalist id="aoTypes">${LEAVES.map(x => `<option value="${x}">`).join('')}</datalist>`; v.appendChild(dlx);
      $('#aoAdd', v).onclick = () => reg.add();
    }
  });

  // 1.9.4: the button «وثائق المواظبة والغياب» of the pupils' attendance opens the pupils' documents only (the staff forms are in «الموظفون»)
  const CP = K.center({
    id: 'attoff', title: 'وثائق مواظبة التلاميذ', icon: '🗂️', route: 'attoffDoc', hubRoute: 'attoff', years: () => Object.keys(AO().years),
    groups: [['pu', 'مواظبة المتعلمين', 'النموذج الرسمي الشهري المعتمد']],
    intro: 'وثائق مواظبة التلاميذ: النموذج الرسمي الشهري للمواظبة (يُحسب من لوائح التلاميذ ومن «إحصاء مواظبة التلاميذ»)، مع الوصول السريع إلى تقارير المواظبة وسجل غياب التلاميذ. <span class="muted">نماذج غياب الموظفين توجد في خانة «الموظفون».</span>',
    docs: () => DOCS.filter(d => d.grp === 'pu' && !(window.Cyc && Cyc.isSec())), store: sy => store(sy),
    hubButtons: () => `<button class="btn" id="aoBack">${ic('back')} إحصاء مواظبة التلاميذ</button><button class="btn" id="aoReg">${ic('cal')} سجل غياب التلاميذ</button>`,
    onHub: v => {
      const b = $('#aoBack', v); if (b) b.onclick = () => go('attend');
      const r = $('#aoReg', v); if (r) r.onclick = () => go('absreg');
      const h = v.querySelector('.hub-grid');
      if (h && window.pageAttendDoc) h.insertAdjacentHTML('beforeend', `<div class="card hub-card" id="aoRep"><div class="hub-t">تقارير ومبيانات المواظبة</div><div class="hub-d">توزيع الغياب شهريا حسب الوحدة والمستوى، النسب والمبيانات (من «إحصاء مواظبة التلاميذ»).</div><div class="hub-a">${ic('check')} إحصاء مواظبة التلاميذ</div></div>
        <div class="card hub-card" id="aoAbs"><div class="hub-t">سجل غياب التلاميذ ووثائقه</div><div class="hub-d">الغياب اليومي لكل تلميذ(ة)، الغياب المتواصل، مراسلات الأولياء.</div><div class="hub-a">${ic('check')} سجل غياب التلاميذ</div></div>`);
      const x = $('#aoRep', v); if (x) x.onclick = () => go('attendDoc');
      const y = $('#aoAbs', v); if (y) y.onclick = () => go('absreg');
    }
  });

  window.Attoff = { migrate, DOCS: () => DOCS, evs };
  window.pageAttoff = (v, a) => { migrate(DB); CP.hub(v, a); };
  window.pageAttoffDoc = (v, a) => { migrate(DB); (DOCS.some(d => d.k === (a || {}).kind && d.grp !== 'pu') ? C : CP).doc(v, a); };
  window.pageAttoffSt = (v, a) => { migrate(DB); C.hub(v, a); };
  window.pageAttoffStDoc = (v, a) => { migrate(DB); C.doc(v, a); };
})();
