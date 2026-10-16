'use strict';
/* 1.9.4 — «المؤشرات والمبيانات»: لوحة قيادة موسعة (عشرات المؤشرات والمبيانات) قابلة للطباعة وPDF وWord.
   Every figure is computed from the data already in the application (employees, absences, pupils, teachers, attendance, documents, certificates, clubs,
   partners, budget, stock, plan ...). A section without data is left out; the sections to print are chosen in the side panel. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const num = v => (+v || 0);
  const SECX = () => !!(window.Cyc && Cyc.isSec());
  const PAL = ['#2e75b6', '#c55a11', '#548235', '#bf9000', '#7030a0', '#2f9ea8', '#a5a5a5', '#c00000', '#1f3864', '#7f6000'];
  const C = { m: '#2e75b6', f: '#e0457b', ok: '#548235', bad: '#c0392b', t: '#8e9aaf', g: '#548235', o: '#ed7d31' };
  const pc = (a, b, d) => (b ? (a / b * 100).toFixed(d == null ? 1 : d).replace(/\.0+$/, '') + '%' : '—');
  const f1 = n => (Number.isInteger(n) ? String(n) : (+n).toFixed(1).replace(/\.0$/, ''));
  const safe = (fn, d) => { try { const r = fn(); return r == null ? d : r; } catch (e) { return d; } };
  const yrs = d => { const t = Date.parse(d || ''); return isFinite(t) ? (Date.now() - t) / 31557600000 : null; };
  const avg = a => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  const cutS = (t, n) => { t = nm(t); return t.length > n ? t.slice(0, n - 1) + '…' : t; };

  /* ---------- SVG charts (RTL: the first item is on the right / at the top) ---------- */
  const SV = (W, H, cls) => `<svg class="dh-ch ${cls || ''}" viewBox="0 0 ${W} ${H}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="MAJ, NSA, sans-serif" direction="ltr">`;
  const none = (txt) => `<div class="dh-empty">${esc(txt || 'لا معطيات')}</div>`;
  // ring with the legend on its right: items [{label, v, c}]
  function donut(items, o) {
    o = o || {};
    items = items.filter(x => num(x.v) > 0);
    const tot = items.reduce((a, x) => a + num(x.v), 0);
    if (!tot) return none();
    const W = o.w || 330, rowH = 17, H = Math.max(o.h || 150, 12 + items.length * rowH), cx = 74, cy = H / 2, R = 62, r = 38;
    let s = SV(W, H, 'dh-donut'), a0 = -Math.PI / 2;
    const P = (rad, a) => `${(cx + rad * Math.cos(a)).toFixed(2)} ${(cy + rad * Math.sin(a)).toFixed(2)}`;
    items.forEach((it, i) => {
      const c = it.c || PAL[i % PAL.length], v = num(it.v), ang = v / tot * Math.PI * 2;
      if (items.length === 1) s += `<circle cx="${cx}" cy="${cy}" r="${(R + r) / 2}" fill="none" stroke="${c}" stroke-width="${R - r}"/>`;
      else { const a1 = a0 + ang, big = ang > Math.PI ? 1 : 0; s += `<path d="M ${P(R, a0)} A ${R} ${R} 0 ${big} 1 ${P(R, a1)} L ${P(r, a1)} A ${r} ${r} 0 ${big} 0 ${P(r, a0)} Z" fill="${c}" stroke="#fff" stroke-width="1"/>`; a0 = a1; }
    });
    s += `<text x="${cx}" y="${cy + 2}" font-size="17" font-weight="700" text-anchor="middle" fill="#1f3864">${f1(tot)}</text><text x="${cx}" y="${cy + 15}" font-size="8.5" text-anchor="middle" fill="#666" direction="rtl">${esc(o.unit || 'المجموع')}</text>`;
    const y0 = (H - items.length * rowH) / 2;
    items.forEach((it, i) => {
      const y = y0 + i * rowH + 11;
      s += `<rect x="${W - 12}" y="${y - 9}" width="10" height="10" rx="2" fill="${it.c || PAL[i % PAL.length]}"/><text x="${W - 16}" y="${y}" font-size="10" text-anchor="start" direction="rtl" fill="#111">${esc(cutS(it.label, 20))}</text><text x="150" y="${y}" font-size="9.5" text-anchor="start" font-weight="700" fill="#333">${f1(num(it.v))} · ${pc(num(it.v), tot, 0)}</text>`;
    });
    return s + '</svg>';
  }
  // horizontal bars of absolute values (or percentages with o.pct): items [{label, v, c}]
  function hbar(items, o) {
    o = o || {};
    items = items.filter(x => x && x.v != null && isFinite(x.v));
    if (!items.length) return none();
    const W = o.w || 330, rowH = o.rowH || 19, labW = o.labW || 130, padT = 4, x0 = 40, x1 = W - labW - 6, H = padT + items.length * rowH + 4;
    const max = o.pct ? 100 : Math.max(o.min || 1, ...items.map(x => num(x.v)));
    let s = SV(W, H, 'dh-hbar');
    items.forEach((it, i) => {
      const y = padT + i * rowH, v = num(it.v), L = Math.max(v > 0 ? 1.5 : 0, (x1 - x0) * Math.min(max, v) / max);
      s += `<text x="${W - 4}" y="${y + rowH / 2 + 3.5}" font-size="${o.fs || 10}" text-anchor="start" direction="rtl" fill="#111">${esc(cutS(it.label, o.cut || 24))}</text>`;
      s += `<rect x="${x1 - (x1 - x0)}" y="${y + 3}" width="${x1 - x0}" height="${rowH - 6}" fill="#f1f3f7" rx="2"/>`;
      s += `<rect x="${x1 - L}" y="${y + 3}" width="${L}" height="${rowH - 6}" fill="${it.c || o.color || C.m}" rx="2"/>`;
      s += `<text x="${x0 - 3}" y="${y + rowH / 2 + 3.5}" font-size="9.5" font-weight="700" text-anchor="end" fill="#222">${o.fmt ? o.fmt(v) : f1(v) + (o.pct ? '%' : '')}</text>`;
    });
    return s + '</svg>';
  }
  // vertical bars (one or two series) with K.bars: cats [labels], series [{name, color, vals}]
  const vbars = (cats, series, o) => (cats.length && series.some(se => se.vals.some(v => num(v) > 0)) ? K.bars(cats, series, Object.assign({ w: 330, h: 170, fs: 9, min: 1 }, o || {})) : none());
  // half ring (percentage)
  function gauge(v, label, o) {
    o = o || {};
    const has = v != null && isFinite(v), W = 200, H = 112, cx = 100, cy = 92, r = 70, sw = 16;
    const arc = (a0, a1) => `M ${(cx + r * Math.cos(a0)).toFixed(1)} ${(cy - r * Math.sin(a0)).toFixed(1)} A ${r} ${r} 0 0 1 ${(cx + r * Math.cos(a1)).toFixed(1)} ${(cy - r * Math.sin(a1)).toFixed(1)}`;
    const col = o.color || (has && o.low ? (v >= 75 ? C.ok : v >= 50 ? C.o : C.bad) : C.m);
    let s = SV(W, H, 'dh-gauge') + `<path d="${arc(Math.PI, 0)}" fill="none" stroke="#e6e9ee" stroke-width="${sw}"/>`;
    if (has && v > 0) s += `<path d="${arc(Math.PI, Math.PI - Math.PI * Math.min(99.99, v) / 100)}" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    s += `<text x="${cx}" y="${cy - 14}" font-size="26" font-weight="700" text-anchor="middle" fill="${col}">${has ? f1(+v.toFixed(1)) + '%' : '—'}</text><text x="${cx}" y="${cy + 6}" font-size="10" text-anchor="middle" direction="rtl" fill="#333">${esc(label || '')}</text>`;
    return s + '</svg>';
  }

  /* ---------- HTML pieces ---------- */
  // KPI cells: [{v, l, c: 'red'|'green'}], cols per row
  function kpis(list, cols) {
    list = list.filter(Boolean);
    if (!list.length) return '';
    cols = cols || 5;
    let h = '<table class="dh-k">';
    for (let i = 0; i < list.length; i += cols) {
      const row = list.slice(i, i + cols);
      h += '<tr>' + row.map(k => `<td class="${(k.c || '') + (String(k.v).replace(/<[^>]*>/g, '').length > 9 ? ' lg' : '')}"><b>${k.v == null || k.v === '' ? '—' : k.v}</b><span>${k.l}</span></td>`).join('') + new Array(cols - row.length).fill('<td class="e"></td>').join('') + '</tr>';
    }
    return h + '</table>';
  }
  // charts side by side: [{t, h}]
  function charts(list) {
    list = list.filter(Boolean);
    if (!list.length) return '';
    return `<table class="dh-c"><tr>${list.map(c => `<td><div class="dh-ct">${c.t}</div>${c.h}</td>`).join('')}${list.length === 1 ? '<td class="e"></td>' : ''}</tr></table>`;
  }
  const head = t => ({ html: `<div class="dh-h">${t}</div>`, keepNext: true });
  const blk = h => (h ? { html: h } : null);

  /* ---------- the data of the school ---------- */
  function ctx(sy) {
    const E = (DB.employees || []).filter(e => !(typeof isEdu === 'function' && isEdu(e))), bd = safe(() => MK.syBoundsOf(sy), { from: '', to: '' }), y0 = safe(() => MK.syStart(sy), new Date().getFullYear());
    if (window.Pupils && Pupils.summary) safe(() => Pupils.summary());
    const P = window.Pupils ? safe(() => Pupils.current(sy), []) : [];
    const single = !!(window.Cyc && Cyc.single());
    return { s: S(), sy, E, bd, y0, P, single, T: window.Board ? safe(() => Board.teachers(), []) : [] };
  }
  const MN = () => Dx.MONTHS || ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  const SYM = c => [[c.y0, 9], [c.y0, 10], [c.y0, 11], [c.y0, 12], [c.y0 + 1, 1], [c.y0 + 1, 2], [c.y0 + 1, 3], [c.y0 + 1, 4], [c.y0 + 1, 5], [c.y0 + 1, 6]];
  const SYL = c => SYM(c).map(([y, m]) => MN()[m - 1]);
  const count = (arr, f) => { const m = new Map(); arr.forEach(x => { const k = f(x); if (k == null || k === '') return; m.set(k, (m.get(k) || 0) + 1); }); return Array.from(m.entries()).sort((a, b) => b[1] - a[1]); };
  const top = (m, n, f) => m.slice(0, n).map(([k, v], i) => ({ label: f ? f(k) : k, v, c: PAL[i % PAL.length] }));
  const band = (vals, edges, labels) => labels.map((l, i) => vals.filter(v => v >= edges[i] && v < edges[i + 1]).length);

  /* ---------- the sections ---------- */
  const SECS = [];
  const sec = d => SECS.push(d);

  sec({ k: 'gen', t: 'المؤشرات العامة للمؤسسة',
    has: () => true,
    build: c => {
      const A = safe(() => absenceEntries().filter(a => a.to >= c.bd.from && a.from <= c.bd.to), []);
      const days = A.reduce((t, a) => { const o = overlap(a.from, a.to, c.bd.from, c.bd.to); return t + (o ? o.days : 0); }, 0);
      const PU = window.Pupils && Pupils.summary ? safe(() => Pupils.summary(), { n: 0 }) : { n: 0 };
      const T = c.T.length || c.E.filter(e => /أستاذ|استاذ/.test(e.cadre || '')).length;
      const at = window.Attend && Attend.summary ? safe(() => Attend.summary(), null) : null;
      const docs = (DB.records || []).filter(r => r.type !== 'absence' && (r.created || '').slice(0, 10) >= c.bd.from && (r.created || '').slice(0, 10) <= c.bd.to).length;
      const D = window.Teach && Teach.distribution ? safe(() => Teach.distribution(c.sy), null) : null;
      return [head('المؤشرات العامة للمؤسسة'), blk(kpis([
        { v: c.E.length, l: 'عدد الموظفين' }, { v: T, l: 'هيئة التربية والتعليم' }, { v: PU.n || '—', l: 'عدد التلاميذ' }, { v: PU.n ? PU.classes : '—', l: 'عدد الأقسام' },
        { v: PU.n && T ? f1(PU.n / T) : '—', l: 'تلميذ(ة) لكل أستاذ(ة)' },
        ...(c.single ? [] : [{ v: D ? D.units.filter(u => u.mine.length || u.c.t).length || '—' : '—', l: 'الوحدات المدرسية' }]),
        { v: safe(() => absentToday().length, 0), l: 'غائبون اليوم', c: safe(() => absentToday().length, 0) ? 'red' : '' },
        { v: A.length, l: 'حالات الغياب خلال الموسم' }, { v: days, l: 'أيام الغياب خلال الموسم' },
        { v: at && at.rate != null ? f1(+num(at.rate).toFixed(2)) + '%' : '—', l: 'نسبة غياب التلاميذ (السنوية)', c: at && at.rate != null && at.alert && at.rate > at.alert ? 'red' : '' },
        { v: at && at.rate != null ? f1(+(100 - at.rate).toFixed(2)) + '%' : '—', l: 'نسبة حضور التلاميذ (السنوية)', c: 'green' },
        ...(() => { const sr = window.Attoff && Attoff.staffRate ? safe(() => Attoff.staffRate(c.sy, Dx.todayIso().slice(5, 7)), null) : null; return sr ? [{ v: f1(+sr.rate.toFixed(2)) + '%', l: 'نسبة حضور الموظفين (الشهر الحالي)', c: 'green' }] : []; })(),
        { v: docs, l: 'وثائق إدارية خلال الموسم' }, { v: safe(() => ((DB.certs || {}).issued || []).length, 0), l: 'شواهد مدرسية مسلمة' },
        { v: safe(() => window.Holidays ? Holidays.summary().count : '—', '—'), l: 'عطل الموسم المدرسي' }
      ], 5))];
    } });

  sec({ k: 'staff', t: 'الموظفون والأطر', has: c => c.E.length > 0,
    build: c => {
      const E = c.E, M = E.filter(e => e.sex === 'M').length, F = E.filter(e => e.sex === 'F').length;
      const ages = E.map(e => yrs(e.birth)).filter(a => a != null && a > 15 && a < 90);
      const sen = E.map(e => yrs(e.hire)).filter(a => a != null && a >= 0 && a < 60);
      const B = window.Board ? { t: safe(() => Board.teachers().length, 0), a: safe(() => Board.admins().length, 0), as: safe(() => Board.assigned().length, 0), p: safe(() => Board.preschool().length, 0) } : { t: 0, a: 0, as: 0, p: 0 };
      const other = Math.max(0, E.length - B.t - B.a - B.as);
      const eb = [0, 30, 40, 50, 60, 200], el = ['أقل من 30', '30–39', '40–49', '50–59', '60 فأكثر'];
      const ageBy = sx => band(E.filter(e => e.sex === sx).map(e => yrs(e.birth)).filter(a => a != null && a > 15 && a < 90), eb, el);
      const sb = [0, 5, 10, 20, 30, 100], sl = ['أقل من 5', '5–9', '10–19', '20–29', '30 فأكثر'];
      const FL = [['ppr', 'رقم التأجير'], ['cin', 'البطاقة الوطنية'], ['birth', 'تاريخ الازدياد'], ['hire', 'تاريخ التوظيف'], ['phone', 'الهاتف'], ['email', 'البريد الإلكتروني'], ['address', 'العنوان'], ['rib', 'الحساب البنكي (RIB)']];
      const comp = FL.map(([k, l]) => ({ label: l, v: E.length ? E.filter(e => nm(e[k])).length / E.length * 100 : 0, c: PAL[0] }));
      const lang = count(E.filter(e => nm(e.teachLang)), e => e.teachLang), st = count(E.filter(e => nm(e.status)), e => e.status);
      return [head('الموظفون والأطر'),
        blk(kpis([{ v: E.length, l: 'مجموع الموظفين' }, { v: B.t, l: 'هيئة التربية والتعليم' }, { v: B.a, l: 'هيئة الإدارة التربوية والتدبير' }, { v: B.as, l: 'أساتذة مكلفون' }, 
          { v: other, l: 'أطر وأعوان آخرون' }, { v: E.length ? pc(F, M + F) : '—', l: 'نسبة الإناث' }, { v: ages.length ? f1(+avg(ages).toFixed(1)) : '—', l: 'متوسط العمر (سنة)' },
          { v: sen.length ? f1(+avg(sen).toFixed(1)) : '—', l: 'متوسط الأقدمية (سنة)' }, { v: ages.filter(a => a >= 55).length, l: 'بلغوا 55 سنة فأكثر', c: ages.filter(a => a >= 55).length ? 'red' : '' }], 5)),
        blk(charts([{ t: 'التوزيع حسب الجنس', h: donut([{ label: 'ذكور', v: M, c: C.m }, { label: 'إناث', v: F, c: C.f }, { label: 'غير محدد', v: E.length - M - F, c: C.t }], { unit: 'موظف(ة)' }) },
          { t: 'التوزيع حسب الفئة', h: donut([{ label: 'هيئة التربية والتعليم', v: B.t }, { label: 'هيئة الإدارة التربوية والتدبير', v: B.a }, { label: 'مكلفون', v: B.as }, { label: 'آخرون', v: other }], { unit: 'موظف(ة)' }) }])),
        blk(charts([{ t: 'الفئات العمرية حسب الجنس', h: vbars(el, [{ name: 'ذكور', color: C.m, vals: ageBy('M') }, { name: 'إناث', color: C.f, vals: ageBy('F') }]) },
          { t: 'الأقدمية في الوظيفة (سنوات)', h: vbars(sl, [{ name: 'عدد الموظفين', color: C.g, vals: band(sen, sb, sl) }]) }])),
        blk(charts([{ t: 'الإطار (الأكثر تمثيلا)', h: hbar(top(count(E.filter(e => nm(e.cadre)), e => e.cadre), 8), { labW: 150, cut: 30 }) },
          { t: 'الدرجة', h: hbar(top(count(E.filter(e => nm(e.grade)), e => 'الدرجة ' + e.grade), 8), { labW: 100 }) }])),
        (lang.length || st.length) ? blk(charts([lang.length ? { t: 'لغة التدريس', h: donut(lang.map(([k, v], i) => ({ label: k, v, c: PAL[i] })), { unit: 'أستاذ(ة)' }) } : null, st.length ? { t: 'وضعية الأساتذة', h: donut(st.map(([k, v], i) => ({ label: k, v, c: PAL[i] })), { unit: 'أستاذ(ة)' }) } : null])) : null,
        blk(charts([{ t: 'اكتمال بطائق الموظفين (% من الموظفين)', h: hbar(comp, { pct: true, labW: 130 }) }, { t: 'مستوى اكتمال المعطيات', h: gauge(comp.length ? avg(comp.map(x => x.v)) : null, 'متوسط الاكتمال', { low: true }) }]))];
    } });

  sec({ k: 'abs', t: 'الغياب والرخص', has: c => safe(() => absenceEntries().length, 0) > 0,
    build: c => {
      const A = absenceEntries().map(a => { const o = overlap(a.from, a.to, c.bd.from, c.bd.to); return o ? Object.assign({}, a, { d: o.days }) : null; }).filter(Boolean);
      const days = A.reduce((t, a) => t + a.d, 0), emp = a => empById(a.rec.empId) || {};
      const med = A.filter(a => /مرضية|رخصة مرض|مرض/.test(a.reason));
      const monthly = SYM(c).map(([y, m]) => safe(() => monthRows(y, m).reduce((t, r) => t + r.days, 0), 0));
      const people = new Set(A.map(a => a.rec.empId)).size;
      const byR = Array.from(A.reduce((m, a) => { const k = cutS(nm(a.reason) || 'غير محدد', 30); m.set(k, (m.get(k) || 0) + a.d); return m; }, new Map()).entries()).sort((a, b) => b[1] - a[1]);
      const byE = Array.from(A.reduce((m, a) => { const k = recName(a.rec); m.set(k, (m.get(k) || 0) + a.d); return m; }, new Map()).entries()).sort((a, b) => b[1] - a[1]);
      const byC = Array.from(A.reduce((m, a) => { const k = cutS(emp(a).cadre || (a.rec.snap && a.rec.snap.cadre) || 'غير محدد', 30); m.set(k, (m.get(k) || 0) + a.d); return m; }, new Map()).entries()).sort((a, b) => b[1] - a[1]);
      const sx = ['M', 'F'].map(s => A.filter(a => emp(a).sex === s).reduce((t, a) => t + a.d, 0));
      const today = safe(() => absentToday(), []);
      const longest = A.reduce((m, a) => Math.max(m, a.d), 0);
      return [head('الغياب والرخص'),
        blk(kpis([{ v: today.length, l: 'غائبون اليوم', c: today.length ? 'red' : '' }, { v: A.length, l: 'حالات الغياب خلال الموسم' }, { v: days, l: 'مجموع أيام الغياب' }, { v: A.length ? f1(+(days / A.length).toFixed(1)) : '—', l: 'متوسط مدة الحالة (يوم)' },
          { v: people, l: 'موظفون غابوا مرة على الأقل' }, { v: med.length, l: 'رخص مرضية' }, { v: med.reduce((t, a) => t + a.d, 0), l: 'أيام الرخص المرضية' }, { v: longest, l: 'أطول غياب (يوم)' },
          { v: c.E.length ? f1(+(days / c.E.length).toFixed(1)) : '—', l: 'أيام الغياب لكل موظف(ة)' }, { v: pc(people, c.E.length), l: 'نسبة الموظفين المتغيبين' }], 5)),
        blk(charts([{ t: 'أيام الغياب حسب الأشهر', h: vbars(SYL(c), [{ name: 'أيام الغياب', color: C.o, vals: monthly }], { w: 400, h: 175, fs: 8.5 }) }, { t: 'التوزيع حسب الجنس (أيام)', h: donut([{ label: 'ذكور', v: sx[0], c: C.m }, { label: 'إناث', v: sx[1], c: C.f }], { unit: 'يوم', w: 260 }) }])),
        blk(charts([{ t: 'أسباب الغياب (أيام)', h: hbar(top(byR, 7), { labW: 125, cut: 24 }) }, { t: 'الموظفون الأكثر غيابا (أيام)', h: hbar(top(byE, 7), { labW: 125, cut: 22 }) }])),
        blk(charts([{ t: 'أيام الغياب حسب الإطار', h: hbar(top(byC, 6), { labW: 150, cut: 30 }) }]))];
    } });

  sec({ k: 'pup', t: 'التلاميذ', has: c => c.P.length > 0,
    build: c => {
      const P = c.P, cn = (arr, f) => Pupils.cnt(arr, f), tot = cn(P), sy = c.sy, LV = K.LV;
      const lv = Pupils.levelsOf(sy, P), Y = Pupils.Y(sy), classes = new Map();
      P.forEach(p => { const k = nm(p.cls) || 'بدون قسم'; classes.set(k, (classes.get(k) || 0) + 1); });
      const ages = P.map(p => ({ a: LV.age(p.birth, sy), g: p.g })).filter(x => x.a != null && x.a >= 2 && x.a <= 25);
      const amin = ages.length ? Math.min(...ages.map(x => x.a)) : 0, amax = ages.length ? Math.max(...ages.map(x => x.a)) : -1, al = []; for (let a = amin; a <= amax; a++) al.push(a);
      const mv = k => safe(() => Pupils.movesOf(sy, k).length, 0);
      const units = c.single ? [] : safe(() => Pupils.unitsOf(sy), []);
      const pre = P.filter(p => (LV.byK(p.lvl) || {}).pre).length;
      const cl = Array.from(classes.entries()).sort((a, b) => b[1] - a[1]);
      return [head('التلاميذ'),
        blk(kpis([{ v: tot.t, l: 'مجموع التلاميذ' }, { v: tot.m, l: 'الذكور' }, { v: tot.f, l: 'الإناث' }, { v: pc(tot.f, tot.t), l: 'نسبة الإناث' }, { v: Y.lists.length, l: 'عدد الأقسام' },
          { v: Y.lists.length ? f1(+(tot.t / Y.lists.length).toFixed(1)) : '—', l: 'متوسط التلاميذ في القسم' }, { v: cl.length ? cl[0][1] : '—', l: 'أكبر قسم (تلميذ)' }, { v: cl.length ? cl[cl.length - 1][1] : '—', l: 'أصغر قسم (تلميذ)' },
          ...(c.single ? [] : [{ v: units.length, l: 'الوحدات المدرسية' }]), ...(SECX() ? [] : [{ v: pre ? pre : '—', l: 'أطفال التعليم الأولي' }]),
          { v: mv('joined'), l: 'الوافدون' }, { v: mv('left'), l: 'المغادرون' }, { v: mv('drop'), l: 'المنقطعون', c: mv('drop') ? 'red' : '' }, { v: mv('notjoined'), l: 'غير الملتحقين', c: mv('notjoined') ? 'red' : '' },
          { v: ages.length ? f1(+avg(ages.map(x => x.a)).toFixed(1)) : '—', l: 'متوسط السن (سنة)' }], 5)),
        blk(charts([{ t: 'التلاميذ حسب المستوى والجنس', h: vbars(lv.map(LV.sh), [{ name: 'ذكور', color: C.m, vals: lv.map(l => cn(P, p => p.lvl === l).m) }, { name: 'إناث', color: C.f, vals: lv.map(l => cn(P, p => p.lvl === l).f) }], { w: 400, h: 175 }) },
          { t: 'التوزيع حسب الجنس', h: donut([{ label: 'ذكور', v: tot.m, c: C.m }, { label: 'إناث', v: tot.f, c: C.f }], { unit: 'تلميذ(ة)', w: 260 }) }])),
        blk(charts([{ t: 'التلاميذ حسب السن والجنس', h: vbars(al.map(a => a + ' س'), [{ name: 'ذكور', color: C.m, vals: al.map(a => ages.filter(x => x.a === a && x.g !== 'F').length) }, { name: 'إناث', color: C.f, vals: al.map(a => ages.filter(x => x.a === a && x.g === 'F').length) }], { w: 400, h: 170, fs: 8.5 }) },
          { t: 'الحركة (وافدون، مغادرون، منقطعون...)', h: vbars(['الوافدون', 'المغادرون', 'المنقطعون', 'غير الملتحقين'], [{ name: 'التلاميذ', color: C.o, vals: [mv('joined'), mv('left'), mv('drop'), mv('notjoined')] }], { w: 260, h: 170, fs: 8.5 }) }])),
        blk(charts([{ t: 'أكبر الأقسام (عدد التلاميذ)', h: hbar(top(cl, 8), { labW: 90, cut: 14 }) },
          !c.single && units.length > 1 ? { t: 'التلاميذ حسب الوحدة المدرسية', h: hbar(units.map((u, i) => ({ label: u, v: P.filter(p => K.U.same(p.unit, u)).length, c: PAL[i % PAL.length] })), { labW: 120, cut: 20 }) } : null]))];
    } });

  sec({ k: 'teach', t: 'الأساتذة وتوزيعهم على الوحدات والأقسام', has: c => c.T.length > 0,
    build: c => {
      const D = window.Teach && Teach.distribution ? safe(() => Teach.distribution(c.sy), null) : null, T = c.T, nP = c.P.length;
      const grp = !c.single && D && D.units.some(u => u.mine.length || u.c.t);
      const U = grp ? D.units.filter(u => u.mine.length || u.c.t || u.gresa) : [];
      const sub = count(T.filter(e => nm(e.subject) || nm(e.teachLang)), e => nm(e.subject) || nm(e.teachLang));
      const lv = count(T.filter(e => nm(e.levels)), e => nm(e.levels));
      const linked = D ? D.T.length - D.none.length : 0;
      const L = [{ v: T.length, l: 'الأساتذة' }, { v: nP ? f1(+(nP / T.length).toFixed(1)) : '—', l: 'تلميذ(ة) لكل أستاذ(ة)' }];
      if (grp) { L.push({ v: U.length, l: 'الوحدات المدرسية' }, { v: linked, l: 'أساتذة مرتبطون بوحدة' }, { v: D.none.length, l: 'غير مرتبطين بوحدة', c: D.none.length ? 'red' : '' }, { v: U.reduce((a, u) => a + u.also.length, 0) || '—', l: 'خدمة بأكثر من وحدة' }); }
      const names = e => nm(e.subject) || nm(e.teachLang) || 'غير محدد';
      return [head('الأساتذة وتوزيعهم على الوحدات والأقسام'), blk(kpis(L, 5)),
        grp ? blk(charts([{ t: 'الأساتذة حسب الوحدة', h: hbar(U.map((u, i) => ({ label: u.name, v: u.mine.length, c: PAL[i % PAL.length] })), { labW: 115, cut: 20 }) },
          { t: 'التلاميذ حسب الوحدة', h: hbar(U.map((u, i) => ({ label: u.name, v: u.c.t, c: PAL[i % PAL.length] })), { labW: 115, cut: 20 }) }])) : null,
        grp ? blk(charts([{ t: 'تلميذ(ة) لكل أستاذ(ة) حسب الوحدة', h: hbar(U.filter(u => u.mine.length).map((u, i) => ({ label: u.name, v: +(u.c.t / u.mine.length).toFixed(1), c: PAL[i % PAL.length] })), { labW: 115, cut: 20 }) },
          { t: 'الأقسام حسب الوحدة', h: hbar(U.map((u, i) => ({ label: u.name, v: u.classes, c: PAL[i % PAL.length] })), { labW: 115, cut: 20 }) }])) : null,
        blk(charts([sub.length ? { t: 'المادة / لغة التدريس', h: donut(sub.slice(0, 7).map(([k, v], i) => ({ label: k, v, c: PAL[i] })), { unit: 'أستاذ(ة)' }) } : null,
          lv.length ? { t: 'المستويات المسندة', h: hbar(top(lv, 6), { labW: 100, cut: 18 }) } : null]))];
    } });

  // 1.9.4: the pre-school attendance has its own section (primary school)
  const attSec = (k, t, sc, has) => sec({ k, get t() { return t(); }, has, build: c => attBuild(c, sc, t()) });
  attSec('att', () => (attPreOn() ? 'مواظبة تلاميذ التعليم الابتدائي' : 'مواظبة التلاميذ'), 'pri', c => !!(window.Attend && Attend.summary && safe(() => Attend.summary().n, 0) > 0));
  attSec('attPre', () => 'مواظبة أطفال التعليم الأولي', 'pre', c => attPreOn() && safe(() => Attend.summary('pre').n, 0) > 0);
  function attPreOn() { return !!(window.Attend && Attend.hasPre && (typeof isPriCycle !== 'function' || isPriCycle()) && safe(() => Attend.hasPre(), false)); }
  function attBuild(c, sc, ttl) {
    {
      const A = Attend.summary(sc), ms = (A.monthly || []).filter(m => m.v != null), hi = ms.reduce((b, m) => (!b || m.v > b.v ? m : b), null), lo = ms.reduce((b, m) => (!b || m.v < b.v ? m : b), null);
      const hot = ms.filter(m => A.alert && m.v > A.alert).length;
      return [head(ttl),
        blk(kpis([{ v: A.rate == null ? '—' : f1(+num(A.rate).toFixed(2)) + '%', l: 'نسبة الغياب السنوية', c: A.alert && A.rate > A.alert ? 'red' : '' }, { v: A.rate == null ? '—' : f1(+(100 - A.rate).toFixed(2)) + '%', l: 'نسبة الحضور السنوية', c: 'green' },
          { v: A.last ? f1(+num(A.last.rate).toFixed(2)) + '%' : '—', l: A.last ? `نسبة الغياب (${A.last.label})` : 'آخر شهر' }, { v: A.last ? f1(+(100 - A.last.rate).toFixed(2)) + '%' : '—', l: A.last ? `نسبة الحضور (${A.last.label})` : 'نسبة الحضور', c: 'green' }, { v: `${A.n} من 10`, l: 'الأشهر المملوءة' },
          { v: A.alert ? f1(+A.alert) + '%' : '—', l: 'عتبة الإنذار' }, { v: hi ? hi.label : '—', l: hi ? `أعلى شهر غيابا (${f1(+hi.v.toFixed(2))}%)` : 'أعلى شهر غيابا', c: 'red' },
          { v: lo ? lo.label : '—', l: lo ? `أدنى شهر غيابا (${f1(+lo.v.toFixed(2))}%)` : 'أدنى شهر غيابا', c: 'green' }, { v: hot, l: 'أشهر فوق العتبة', c: hot ? 'red' : '' }], 4)),
        blk(charts([{ t: sc === 'pre' ? 'نسبة غياب أطفال التعليم الأولي شهريا (%)' : 'نسبة غياب التلاميذ شهريا (%)', h: MK.svgBars(A.monthly, { alert: A.alert, w: 420, h: 150, fs: 8.5 }) }, { t: 'نسبة الحضور السنوية', h: gauge(A.rate == null ? null : 100 - A.rate, 'الحضور', { low: true }) }]))];
    }
  }

  sec({ k: 'doc', t: 'الوثائق الإدارية', has: c => (DB.records || []).some(r => r.type !== 'absence'),
    build: c => {
      const R = (DB.records || []).filter(r => r.type !== 'absence'), inSy = R.filter(r => { const d = (r.created || '').slice(0, 10); return d >= c.bd.from && d <= c.bd.to; });
      const ty = r => (typeof typeTitle === 'function' ? typeTitle(r.type) : r.type);
      const months = SYM(c).map(([y, m]) => inSy.filter(r => (r.created || '').slice(0, 7) === `${y}-${String(m).padStart(2, '0')}`).length);
      const byT = count(inSy, ty), busy = months.indexOf(Math.max(...months));
      const emps = new Set(inSy.map(r => r.empId).filter(Boolean)).size;
      return [head('الوثائق الإدارية'),
        blk(kpis([{ v: R.length, l: 'مجموع الوثائق في السجل' }, { v: inSy.length, l: 'وثائق الموسم الدراسي' }, { v: byT.length, l: 'أنواع الوثائق المستعملة' }, { v: emps, l: 'موظفون استفادوا من وثائق' },
          { v: inSy.length && months.some(Boolean) ? SYL(c)[busy] : '—', l: 'أكثر الأشهر إنجازا للوثائق' }, { v: byT.length ? byT[0][0] : '—', l: 'أكثر الوثائق إنجازا' }], 3)),
        blk(charts([{ t: 'الوثائق حسب النوع', h: hbar(top(byT, 8), { labW: 140, cut: 28 }) }, { t: 'الوثائق المنجزة حسب الأشهر', h: vbars(SYL(c), [{ name: 'الوثائق', color: C.m, vals: months }], { w: 400, h: 170, fs: 8.5 }) }]))];
    } });

  sec({ k: 'cert', t: 'الشواهد المدرسية (الأرشيف)', has: c => !!((DB.certs || {}).issued || []).length || !!((DB.certs || {}).students || []).length,
    build: c => {
      const D = DB.certs || {}, S0 = D.students || [], I = D.issued || [], cur = S0.filter(x => x.status === 'current').length, y = new Date().getFullYear();
      const ys = []; for (let i = 5; i >= 0; i--) ys.push(y - i);
      const kinds = count(I, r => ({ left: 'شهادة مغادرة', school: 'شهادة مدرسية', enroll: 'شهادة تمدرس' }[r.kind] || r.kind || 'شهادة'));
      return [head('الشواهد المدرسية (الأرشيف)'),
        blk(kpis([{ v: S0.length, l: 'التلاميذ في السجل' }, { v: cur, l: 'متمدرسون حاليا' }, { v: S0.length - cur, l: 'مغادرون / سابقون' }, { v: I.length, l: 'مجموع الشواهد المسلمة' }, { v: I.filter(r => +r.year === y).length, l: `شواهد سنة ${y}` }], 5)),
        blk(charts([{ t: 'الشواهد المسلمة حسب السنوات', h: vbars(ys.map(String), [{ name: 'الشواهد', color: C.g, vals: ys.map(a => I.filter(r => +r.year === a).length) }], { w: 330, h: 160 }) },
          { t: 'أنواع الشواهد', h: donut(kinds.slice(0, 6).map(([k, v], i) => ({ label: k, v, c: PAL[i] })), { unit: 'شهادة' }) }]))];
    } });

  sec({ k: 'life', t: 'الحياة المدرسية والشركاء', has: c => !!(window.Budget || window.Partners),
    build: c => {
      const BL = window.Budget && Budget.summary ? safe(() => Budget.summary('life').rows, []) : [], P = window.Partners && Partners.summary ? safe(() => Partners.summary(), null) : null, H = window.Holidays ? safe(() => Holidays.summary(), null) : null;
      const k = BL.map(r => ({ v: r[1], l: r[0], c: r[2] === 'red' ? 'red' : r[2] === 'green' ? 'green' : '' }));
      if (P) k.push({ v: P.members, l: 'أعضاء مكتب الجمعية' }, { v: P.others, l: 'الشركاء المسجلون' }, { v: P.docs, l: 'وثائق الشراكة (تقارير، محاضر...)' });
      if (H) k.push({ v: H.count, l: 'عطل الموسم' }, { v: H.next ? esc(H.next.name) : '—', l: H.next ? `العطلة القادمة (${esc(H.next.days)})` : 'لا عطل قادمة' });
      if (!k.length) return [];
      return [head('الحياة المدرسية والشركاء'), blk(kpis(k, 5)),
        P ? blk(charts([{ t: 'إنجاز المحطات التواصلية مع الشركاء', h: gauge(P.total ? P.done / P.total * 100 : null, `${P.done} من ${P.total} محطة`, { low: true }) }, { t: 'حالة المحطات التواصلية', h: donut([{ label: 'منجزة', v: P.done, c: C.ok }, { label: 'غير منجزة', v: Math.max(0, P.total - P.done), c: C.t }], { unit: 'محطة', w: 260 }) }])) : null];
    } });

  sec({ k: 'fin', t: 'التدبير المالي والعتاد', has: c => !!(window.Budget || window.Stock),
    build: c => {
      const B = window.Budget && Budget.summary ? safe(() => Budget.summary().rows, []) : [], S1 = window.Stock && Stock.summary ? safe(() => Stock.summary(), null) : null;
      const k = B.map(r => ({ v: r[1], l: r[0], c: r[2] === 'red' ? 'red' : r[2] === 'green' ? 'green' : '' }));
      if (S1) k.push({ v: S1.equip, l: 'عتاد مسجل' }, { v: S1.assigned, l: 'عتاد مسلم للموظفين' }, { v: S1.broken, l: 'عتاد معطل', c: S1.broken ? 'red' : '' }, { v: S1.items, l: 'مواد في المخزون' }, { v: S1.empty, l: 'مواد نفدت', c: S1.empty ? 'red' : '' }, { v: S1.ins, l: 'عمليات التوريد' }, { v: S1.outs, l: 'عمليات الصرف' });
      if (!k.length || (S1 && !S1.equip && !S1.items && !B.length)) return [];
      return [head('التدبير المالي والعتاد'), blk(kpis(k, 5)),
        S1 && S1.equip ? blk(charts([{ t: 'وضعية العتاد', h: donut([{ label: 'مسلم للموظفين', v: S1.assigned, c: C.m }, { label: 'غير مسلم', v: Math.max(0, S1.equip - S1.assigned - S1.broken), c: C.t }, { label: 'معطل', v: S1.broken, c: C.bad }], { unit: 'قطعة' }) },
          { t: 'وضعية المخزون', h: donut([{ label: 'متوفرة', v: Math.max(0, S1.items - S1.empty), c: C.ok }, { label: 'نفدت', v: S1.empty, c: C.bad }], { unit: 'مادة', w: 260 }) }])) : null];
    } });

  // 1.9.4: the pre-school educators: a section of their own (not in the staff statistics)
  sec({ k: 'presch', t: 'مربيات ومربو التعليم الأولي', has: c => !SECX() && (DB.employees || []).some(e => typeof isEdu === 'function' && isEdu(e)),
    build: c => {
      const L = (DB.employees || []).filter(e => isEdu(e)), F = L.filter(e => e.sex === 'F').length;
      const org = o => (/النهوض/.test(o || '') ? 'FMPS' : /زاكورة/.test(o || '') ? 'زاكورة' : (o || 'غير محدد'));
      const byO = {}; L.forEach(e => { const k = org(e.org); byO[k] = (byO[k] || 0) + 1; });
      const byU = {}; L.forEach(e => { const k = e.unit || 'غير محدد'; byU[k] = (byU[k] || 0) + 1; });
      return [head('مربيات ومربو التعليم الأولي'),
        blk(kpis([{ v: L.length, l: 'مجموع المربيات والمربين' }, { v: F, l: 'المربيات' }, { v: L.length - F, l: 'المربون' }, { v: Object.keys(byO).length, l: 'الجهات المشغلة' }].concat(c.single ? [] : [{ v: Object.keys(byU).length, l: 'الوحدات المدرسية' }]), 5)),
        blk(charts([{ t: 'التوزيع حسب الجهة المشغلة', h: donut(Object.keys(byO).map((k, i) => ({ label: k, v: byO[k], c: PAL[i % PAL.length] })), { unit: 'مرب(ية)' }) }].concat(c.single ? [] : [{ t: 'التوزيع حسب الوحدة المدرسية', h: hbar(Object.keys(byU).map(k => ({ label: k, v: byU[k], c: PAL[0] })), { labW: 150, cut: 30 }) }])))];
    } });

  sec({ k: 'roaiz', t: 'استثمار الروائز', has: c => !SECX() && !!(window.Roaiz && Roaiz.summary && safe(() => Roaiz.summary().groups, 0) > 0),
    build: c => {
      const R = Roaiz.summary();
      return [head('استثمار الروائز'), blk(kpis([{ v: `${R.phases} من 8`, l: 'الفئات المستوردة' }, { v: R.groups, l: 'مجموعات الدعم' }, { v: c.single ? '—' : R.units, l: 'الوحدات المدرسية' }, { v: R.pupils, l: 'التلاميذ المعنيون' }, { v: c.P.length ? pc(R.pupils, c.P.length) : '—', l: 'نسبة التلاميذ المعنيين' }], 5)),
        blk(charts([{ t: 'الفئات المستوردة من 8', h: gauge(R.phases / 8 * 100, `${R.phases} من 8 فئات`, { low: true }) }]))];
    } });

  sec({ k: 'plan', t: 'برنامج عمل المؤسسة', has: c => !!(window.Plan && safe(() => Plan.summary().stations, 0) > 0),
    build: c => {
      const f = Plan.year(c.sy), S2 = f.secs || [], n = S2.reduce((a, s) => a + (s.rows || []).length, 0), rv = S2.reduce((a, s) => a + (s.rows || []).filter(r => r.rv).length, 0);
      return [head('برنامج عمل المؤسسة'), blk(kpis([{ v: S2.length, l: 'المحاور' }, { v: n, l: 'المحطات' }, { v: rv, l: 'محطات تنتظر مراجعة التاريخ', c: rv ? 'red' : '' }, { v: S2.reduce((a, s) => a + (s.rows || []).reduce((b, r) => b + String(r.ops || '').split(/\r?\n/).filter(x => x.trim()).length, 0), 0), l: 'العمليات والأنشطة المبرمجة' }], 4)),
        blk(charts([{ t: 'المحطات حسب المحاور', h: hbar(S2.map((s, i) => ({ label: cutS(s.h, 28), v: (s.rows || []).length, c: PAL[i % PAL.length] })), { labW: 170, cut: 30, w: 400 }) }]))];
    } });

  /* ---------- the document ---------- */
  const Dd = () => { DB.dash = DB.dash && typeof DB.dash === 'object' ? DB.dash : {}; return DB.dash; };
  const picked = () => { const d = Dd(); if (!Array.isArray(d.secs) || d.secs.length !== SECS.length) d.secs = SECS.map(() => true); return d.secs; };
  function blocks(sy) {
    const c = ctx(sy), P = picked(), out = [];
    SECS.forEach((x, i) => {
      if (!P[i]) return;
      let h = false; try { h = x.has(c); } catch (e) { h = false; }
      if (!h) return;
      try { (x.build(c) || []).forEach(b => b && out.push(b)); } catch (e) { out.push(head(x.t), { html: none('تعذر حساب هذا القسم: ' + esc(e && e.message || e)) }); }
    });
    if (!out.length) out.push({ html: none('لا معطيات بعد: أدخل معطيات المؤسسة لتظهر المؤشرات والمبيانات هنا.') });
    const note = nm(Dd().note);
    if (note) out.push({ html: `<div class="sb-note">${esc(note)}</div>` });
    return out;
  }
  function pages(s, sy) {
    return SB.pages(s, { page: 'a4', title: 'المؤشرات والمبيانات', sub: `الموسم الدراسي ${MK.syDash(sy)}${s.school ? ' — ' + s.school : ''}`, blocks: blocks(sy), sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }) });
  }
  window.pageDash = function (v) {
    const sy0 = MK.curSy();
    MK.docPage(v, {
      title: 'المؤشرات والمبيانات', icon: '📊', modes: false, flow: true,
      state: { sy: sy0 },
      back: () => go('home'),
      form: (box, st, refresh) => {
        const c = ctx(st.sy), has = SECS.map(x => { try { return !!x.has(c); } catch (e) { return false; } });
        const f = Dd(); picked();
        const defs = () => [{ sec: 'الأقسام المراد إدراجها' },
          { note: 'تُحسب كل المؤشرات والمبيانات تلقائيا من معطيات البرنامج (الموظفون، الغياب، التلاميذ، الأساتذة، المواظبة، الوثائق، الشواهد، الأندية والشركاء، الميزانية والعتاد...). القسم الذي لا معطيات له لا يظهر في الوثيقة. اختر الأقسام ثم اضغط «طباعة» أو «PDF» أو «Word».' },
          { k: 'secs', l: '', t: 'checks', opts: SECS.map((x, i) => ((x.k === 'presch' || x.k === 'attPre') && SECX() ? null : cycT(x.t) + (has[i] ? '' : ' (لا معطيات بعد)'))) },
          { k: 'note', l: 'ملاحظة أسفل الوثيقة', t: 'area', rows: 2 }];
        let t = null;
        K.form(box, defs, f, () => { clearTimeout(t); t = setTimeout(() => persist(), 300); refresh(); });
      },
      build: st => ({ page: 'a4', pages: pages(S(), st.sy) }),
      fname: st => `المؤشرات_والمبيانات_${MK.syDash(st.sy)}`
    });
  };

  // small figures for the home page: the absences of the year, the staff by category, the pupils by level
  function mini() {
    const sy = MK.curSy(), c = ctx(sy), out = [];
    try {
      if (c.E.length) {
        const B = window.Board ? { t: Board.teachers().length, a: Board.admins().length, as: Board.assigned().length, p: Board.preschool().length } : { t: 0, a: 0, as: 0, p: 0 };
        out.push({ t: 'الموظفون حسب الفئة', h: donut([{ label: 'هيئة التربية والتعليم', v: B.t }, { label: 'هيئة الإدارة التربوية والتدبير', v: B.a }, { label: 'مكلفون', v: B.as }, { label: 'آخرون', v: Math.max(0, c.E.length - B.t - B.a - B.as) }], { unit: 'موظف(ة)', w: 330 }) });
      }
    } catch (e) { /* ignore */ }
    try {
      if (safe(() => absenceEntries().length, 0)) out.push({ t: 'أيام غياب الموظفين حسب الأشهر', h: vbars(SYL(c), [{ name: 'أيام الغياب', color: C.o, vals: SYM(c).map(([y, m]) => safe(() => monthRows(y, m).reduce((t, r) => t + r.days, 0), 0)) }], { w: 400, h: 170, fs: 8.5 }) });
    } catch (e) { /* ignore */ }
    try {
      if (c.P.length) { const LV = K.LV, lv = Pupils.levelsOf(sy, c.P); out.push({ t: 'التلاميذ حسب المستوى', h: vbars(lv.map(LV.sh), [{ name: 'ذكور', color: C.m, vals: lv.map(l => Pupils.cnt(c.P, p => p.lvl === l).m) }, { name: 'إناث', color: C.f, vals: lv.map(l => Pupils.cnt(c.P, p => p.lvl === l).f) }], { w: 400, h: 170 }) }); }
    } catch (e) { /* ignore */ }
    return out;
  }
  Dx.modCss += `
  .dh-h{font-weight:700;font-size:12pt;margin:3mm 0 1.6mm;padding:.8mm 2.4mm;background:#e3ecf7;border-right:2.4mm solid #1f4e79;line-height:1.5;color:#12294a}
  .dh-k{width:100%;border-collapse:separate;border-spacing:1.2mm;table-layout:fixed;margin:0}
  .dh-k td{border:1px solid #c9d3e3;background:#f7f9fd;text-align:center;padding:1.3mm .8mm;vertical-align:middle;height:12.5mm}
  .dh-k td b{display:block;font-size:13.5pt;line-height:1.25;color:#1f3864;overflow-wrap:anywhere}
  .dh-k td span{display:block;font-size:7.4pt;line-height:1.3;color:#333}
  .dh-k td.lg b{font-size:9.5pt;line-height:1.3}.dh-k td.red b{color:#b3261e}.dh-k td.green b{color:#2e7d32}.dh-k td.e{border:0;background:none}
  .dh-c{width:100%;border-collapse:separate;border-spacing:1.2mm;table-layout:fixed;margin:0}
  .dh-c td{vertical-align:top;border:1px solid #d6dde9;padding:1mm 1.4mm;background:#fff}.dh-c td.e{border:0;background:none}
  .dh-ct{font-weight:700;font-size:8.8pt;text-align:center;color:#1f3864;margin:0 0 .6mm;line-height:1.4}
  .dh-ch{display:block;width:100%;height:auto;max-height:62mm}
  .dh-empty{text-align:center;color:#777;font-size:8.5pt;padding:5mm 0}`;
  window.Dash = { SECS: () => SECS, blocks, mini, donut, hbar, gauge };
})();
