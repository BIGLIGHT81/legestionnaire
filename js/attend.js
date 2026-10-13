'use strict';
/* إحصاء مواظبة التلاميذ — monthly attendance statistics per school unit and level:
   number of pupils, absent pupils and days of absence; absence rate = days of absence ÷ (pupils × school days) × 100.
   Monthly sheet, yearly summary, Excel import (the school's workbook: one sheet per month) and export. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const today = () => Dx.todayIso();

  const MONTHS = [['09', 'شتنبر'], ['10', 'أكتوبر'], ['11', 'نونبر'], ['12', 'دجنبر'], ['01', 'يناير'], ['02', 'فبراير'], ['03', 'مارس'], ['04', 'أبريل'], ['05', 'ماي'], ['06', 'يونيو']];
  const MNAME = Object.fromEntries(MONTHS);
  const monthYear = (sy, mm) => +mm >= 9 ? +String(sy).slice(0, 4) : +String(sy).slice(5, 9);
  const monthLabel = (sy, mm) => `${MNAME[mm]} ${monthYear(sy, mm)}`;
  const syDash = sy => String(sy || '').replace('/', '-');
  // names of the levels of the school's cycle (settings → السلك): primary / collège / lycée
  const lvName = k => (/^(DEPE|PS\d|P\d)/.test(k) ? K.LV.sh(k) : K.LV.ar(k));
  const levelsFor = cycle => Cyc.levels(Cyc.kind({ cycle })).filter(k => !/^(DEPE|PS)/.test(k)).map(lvName);
  const DEFAULT_SETS = ['pri', 'col', 'lyc'].map(k => levelsFor(k === 'col' ? 'إعدادي' : k === 'lyc' ? 'تأهيلي' : 'ابتدائي'));

  function migrate(db) {
    const a = db.attend = db.attend || {};
    a.units = Array.isArray(a.units) ? a.units : [];
    a.levels = Array.isArray(a.levels) ? a.levels : [];
    a.years = a.years && typeof a.years === 'object' ? a.years : {};
    if (!(+a.days > 0)) a.days = 20;
    if (a.alert == null || !isFinite(+a.alert)) a.alert = 5;
  }
  const AD = () => DB.attend;
  // collège / lycée: the school is one independent institution — a single "unit" carrying the school's name (no school-group units)
  const SEC = () => !!(window.Cyc && Cyc.single());
  const schoolName = () => { const s0 = typeof S === 'function' ? S() : {}; return String((s0 && s0.school) || '').trim() || 'المؤسسة'; };
  function normSec() {
    try {
      if (!SEC()) return;
      const a = AD(), n = schoolName();
      if (!a.units.length) return;
      if (a.units.length > 1) {                       // units left over from a primary-school setup: add them up into the school
        const first = a.units[0];
        Object.values(a.years).forEach(y => Object.values(y).forEach(m => {
          const v = m.v = m.v || {}, tgt = v[first.id] = v[first.id] || {};
          a.units.slice(1).forEach(u => {
            Object.keys(v[u.id] || {}).forEach(l => {
              const c = v[u.id][l], t = tgt[l] = tgt[l] || {};
              ['p', 'a', 'd'].forEach(f => { if (isNum(c[f])) t[f] = (isNum(t[f]) ? +t[f] : 0) + (+c[f]); });
            });
            delete v[u.id];
          });
        }));
        a.units = [first];
      }
      if (a.units[0].name !== n) a.units[0].name = n;
    } catch (e) { /* keep the data as it is */ }
  }
  const hasData = () => Object.values(AD().years).some(y => Object.values(y).some(m => Object.keys(m.v || {}).length));
  // first use: units of the pupils register (or of the certificates, or one unit), levels of the school's cycle;
  // when the cycle of the school changes (settings) and nothing was entered yet, the default levels follow it
  function ensureLists() {
    const a = AD();
    if (!a.units.length) {
      const fromPupils = window.Pupils && Pupils.unitNames ? Pupils.unitNames() : [];
      const fromCerts = DB.certs && Array.isArray(DB.certs.students) ? Array.from(new Set(DB.certs.students.map(x => x.unit).filter(Boolean))) : [];
      (SEC() ? [schoolName()] : fromPupils.length ? fromPupils : fromCerts.length ? fromCerts : ['المركزية']).forEach(n => a.units.push({ id: uid('au'), name: n }));
    }
    normSec();
    const want = levelsFor(S().cycle);
    if (a.levels.length && !hasData()) {
      const cur = a.levels.map(l => l.name);
      const stale = DEFAULT_SETS.some(set => set.length === cur.length && set.every((n, i) => n === cur[i]) && set.join('|') !== want.join('|'));
      if (stale) a.levels = [];
    }
    if (!a.levels.length) want.forEach(n => a.levels.push({ id: uid('al'), name: n }));
  }
  const unitNames = () => { migrate(DB); normSec(); return AD().units.map(u => u.name); };
  window.Attend = { migrate, unitNames };

  /* ---------- data & calculations ---------- */
  const isNum = x => x !== '' && x != null && isFinite(+x);
  const monthOf = (sy, mm, create) => {
    const y = AD().years[sy] || (create ? (AD().years[sy] = {}) : null);
    if (!y) return null;
    if (!y[mm] && create) y[mm] = { days: AD().days, v: {} };
    return y[mm] || null;
  };
  const cellOf = (m, u, l) => (((m || {}).v || {})[u] || {})[l] || {};
  // aggregate over units × levels of one month
  function agg(m, us, ls) {
    let p = 0, a = 0, d = 0, nd = 0, np = 0, na = 0;
    us.forEach(u => ls.forEach(l => {
      const c = cellOf(m, u, l);
      if (isNum(c.p)) { p += +c.p; np++; }
      if (isNum(c.a)) { a += +c.a; na++; }
      if (isNum(c.d)) { d += +c.d; nd++; }
    }));
    const days = m ? +m.days || 0 : 0;
    const rate = nd && p > 0 && days > 0 ? d / (p * days) * 100 : null;
    return { p, a, d, nd, np, na, days, rate, filled: nd > 0 || np > 0, abs: nd > 0 || na > 0 };
  }
  // yearly: months whose rate is known, weighted by pupils × school days
  function aggYear(sy, us, ls) {
    let a = 0, d = 0, w = 0, days = 0, n = 0;
    MONTHS.forEach(([mm]) => {
      const r = agg(monthOf(sy, mm), us, ls);
      if (r.rate == null) return;
      a += r.a; d += r.d; w += r.p * r.days; days += r.days; n++;
    });
    return { a, d, days, n, rate: w > 0 ? d / w * 100 : null };
  }
  const U = () => AD().units.map(u => u.id), L = () => AD().levels.map(l => l.id);
  const fmtR = r => r == null ? '-' : r.toFixed(2);
  const fmtP = r => r == null ? '-' : (100 - r).toFixed(2);
  const hot = r => r != null && r > +AD().alert;
  const yearsList = () => {
    return MK.syList(Object.keys(AD().years));
  };
  // dashboard figures: the last month with a known rate, the yearly rate, the monthly rates
  window.Attend.summary = () => {
    migrate(DB);
    const sy0 = MK.curSy();
    if (!AD().units.length || !AD().levels.length) return { sy: sy0, n: 0, rate: null, last: null, monthly: [] };
    const monthly = MONTHS.map(([k]) => ({ label: MNAME[k], k, v: agg(monthOf(sy0, k), U(), L()).rate }));
    const lastM = monthly.filter(m => m.v != null).pop();
    const y = aggYear(sy0, U(), L());
    return { sy: sy0, n: y.n, rate: y.rate, last: lastM ? { label: monthLabel(sy0, lastM.k), rate: lastM.v } : null, monthly, alert: +AD().alert, units: AD().units.length };
  };
  window.Attend.fmt = r => fmtR(r);
  window.Attend.MONTHS = MONTHS;
  // attendance rate (100 - absence rate) of a month for one unit (by name) or for the whole school
  window.Attend.unitRate = (sy, mm, unitName) => {
    migrate(DB); const m = monthOf(sy, mm); if (!m) return null;
    const u = AD().units.find(x => x.name === unitName); if (!u) return null;
    const r = agg(m, [u.id], L()).rate; return r == null ? null : +(100 - r).toFixed(2);
  };
  window.Attend.allRate = (sy, mm) => { migrate(DB); const m = monthOf(sy, mm); if (!m) return null; const r = agg(m, U(), L()).rate; return r == null ? null : +(100 - r).toFixed(2); };
  const defaultMonth = () => { const m = MK.syRef(sy || MK.curSy()).slice(5, 7); return MNAME[m] ? m : (m === '07' || m === '08' ? '06' : '09'); };

  /* ================================================================= */
  let tab = 'month', sy = null, mm = null;
  window.pageAttend = function (v, arg) {
    migrate(DB); ensureLists();
    if (arg && arg.tab) tab = arg.tab;
    sy = MK.curSy();
    if (!mm) mm = defaultMonth();
    const T = [['month', 'المواظبة الشهرية'], ['summary', 'ملخص الغياب'], ['settings', SEC() ? 'المستويات والأقسام' : 'الوحدات والمستويات']];
    v.innerHTML = `<div class="page-h"><h1>إحصاء مواظبة التلاميذ</h1>
        <select class="inp" id="aSy" style="width:auto">${yearsList().map(y => `<option value="${y}" ${y === sy ? 'selected' : ''}>الموسم الدراسي ${syDash(y)}</option>`).join('')}</select>
        <span class="sp"></span>
        <button class="btn" id="aOff">${ic('file')} وثائق المواظبة والغياب</button>
        <button class="btn" id="aImp">${ic('up')} استيراد Excel</button>
        <button class="btn" id="aExp">${ic('down')} تصدير Excel</button>
        <button class="btn" id="aPrS">${ic('print')} ملخص الغياب</button>
        <button class="btn pri" id="aPrM">${ic('print')} المواظبة الشهرية</button></div>
      <div class="mk-tabs"><div class="seg" id="aTabs">${T.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div id="aBody"></div>`;
    $$('#aTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; go('attend'); });
    $('#aSy').onchange = e => { sy = e.target.value; MK.setSy(sy); go('attend'); };
    $('#aOff').onclick = () => go('attoff');
    $('#aImp').onclick = importBook;
    $('#aExp').onclick = exportBook;
    $('#aPrM').onclick = () => go('attendDoc', { kind: 'month', sy, mm });
    $('#aPrS').onclick = () => go('attendDoc', { kind: 'year', sy });
    ({ month: tabMonth, summary: tabSummary, settings: tabSettings })[tab]($('#aBody'));
  };

  /* ---------- monthly entry ---------- */
  function tabMonth(b) {
    const units = AD().units, levels = AD().levels;
    const chip = k => { const r = agg(monthOf(sy, k), U(), L()); return `<button data-m="${k}" class="${k === mm ? 'on' : ''}">${MNAME[k]}${r.rate != null ? ` <small class="${hot(r.rate) ? 'att-hot' : ''}">${fmtR(r.rate)}%</small>` : r.filled ? ' <small>•</small>' : ''}</button>`; };
    const m0 = monthOf(sy, mm);
    b.innerHTML = `<div class="card"><div class="toolbar"><div class="seg att-months" id="aMon">${MONTHS.map(([k]) => chip(k)).join('')}</div></div>
      <div class="att-bar">
        <label>عدد أيام الدراسة خلال ${esc(monthLabel(sy, mm))}: <input class="inp" type="number" min="1" max="31" id="aDays" value="${esc(m0 ? m0.days : AD().days)}"></label>
        <button class="btn sm pri" id="aFromP" title="${SEC() ? 'يملأ عمود «عدد التلاميذ» من بطاقة التلاميذ حسب المستوى، ويمكن تعديله بعد ذلك كل شهر' : 'يملأ عمود «عدد التلاميذ» من بطاقة التلاميذ حسب الوحدة والمستوى، ويمكن تعديله بعد ذلك كل شهر'}">${ic('pupil')} نقل أعداد التلاميذ من بطاقة التلاميذ</button>
        <button class="btn sm" id="aCopy" title="أعداد التلاميذ لا تتغير عادة من شهر لآخر">${ic('copy')} نقل أعداد التلاميذ من الشهر السابق</button>
        <button class="btn sm danger" id="aClr">${ic('trash')} مسح معطيات الشهر</button>
        <span style="flex:1"></span>
        <div class="att-kpis" id="aKpi"></div>
      </div>
      <div class="att-units">${units.map(u => `<div class="att-u" data-u="${u.id}"><div class="att-uh"><b>${esc(u.name)}</b><span data-c="ur-${u.id}"></span></div>
        <table class="att-in"><thead><tr><th>المستوى</th><th>عدد التلاميذ</th><th>عدد المتغيبين</th><th>أيام الغياب</th><th>نسبة الغياب %</th></tr></thead><tbody>
        ${levels.map(l => { const c = cellOf(m0, u.id, l.id); return `<tr><td class="lv">${esc(l.name)}</td>${['p', 'a', 'd'].map(f => `<td><input type="number" min="0" step="1" class="inp" data-u="${u.id}" data-l="${l.id}" data-f="${f}" value="${isNum(c[f]) ? +c[f] : ''}"></td>`).join('')}<td class="num" data-c="lr-${u.id}-${l.id}"></td></tr>`; }).join('')}
        </tbody><tfoot><tr><td>المجموع</td><td data-c="tp-${u.id}"></td><td data-c="ta-${u.id}"></td><td data-c="td-${u.id}"></td><td data-c="tr-${u.id}"></td></tr></tfoot></table></div>`).join('')}</div>
      <p class="muted" style="font-size:12px;margin:2px 16px 14px">الخانات تملأ لكل ${SEC() ? 'مستوى' : 'وحدة مدرسية ومستوى'}: عدد التلاميذ، عدد التلاميذ المتغيبين، ومجموع أيام الغياب خلال الشهر. النسبة = أيام الغياب ÷ (عدد التلاميذ × أيام الدراسة) × 100، والنسب التي تتجاوز ${esc(AD().alert)}% تظهر بالأحمر.</p></div>
      <div class="card" style="margin-top:14px"><div class="card-b" id="aSum"></div></div>`;
    $$('#aMon button').forEach(x => x.onclick = () => { mm = x.dataset.m; go('attend'); });
    const calc = () => {
      const m = monthOf(sy, mm);
      const set = (k, t, h) => { const el = $(`[data-c="${k}"]`, b); if (el) { el.textContent = t; el.classList.toggle('att-hot', !!h); } };
      units.forEach(u => {
        levels.forEach(l => { const r = agg(m, [u.id], [l.id]); set(`lr-${u.id}-${l.id}`, fmtR(r.rate), hot(r.rate)); });
        const r = agg(m, [u.id], L());
        set(`tp-${u.id}`, r.np ? r.p : ''); set(`ta-${u.id}`, r.abs ? r.a : ''); set(`td-${u.id}`, r.nd ? r.d : ''); set(`tr-${u.id}`, fmtR(r.rate), hot(r.rate));
        set(`ur-${u.id}`, r.rate == null ? '' : `نسبة الغياب ${fmtR(r.rate)}%`, hot(r.rate));
      });
      // checks: absent pupils <= pupils, days of absence <= pupils × school days
      $$('input[data-f]', b).forEach(inp => {
        const c = cellOf(m, inp.dataset.u, inp.dataset.l);
        const days = m ? +m.days || 0 : 0;
        const bad = inp.dataset.f === 'a' ? (isNum(c.a) && isNum(c.p) && +c.a > +c.p) : inp.dataset.f === 'd' ? (isNum(c.d) && isNum(c.p) && days > 0 && +c.d > +c.p * days) : false;
        inp.classList.toggle('bad', bad);
        inp.title = bad ? (inp.dataset.f === 'a' ? 'عدد المتغيبين أكبر من عدد التلاميذ' : 'أيام الغياب أكبر من (عدد التلاميذ × أيام الدراسة)') : '';
      });
      const r = agg(m, U(), L());
      $('#aKpi').innerHTML = `<span>التلاميذ: <b>${r.np ? r.p : '-'}</b></span><span>المتغيبون: <b>${r.abs ? r.a : '-'}</b></span><span>أيام الغياب: <b>${r.nd ? r.d : '-'}</b></span>
        <span>نسبة الغياب: <b class="${hot(r.rate) ? 'att-hot' : ''}">${fmtR(r.rate)}%</b></span><span>نسبة الحضور: <b>${fmtP(r.rate)}%</b></span>`;
      $('#aSum').innerHTML = monthSummaryHtml(m);
      const ch = $(`#aMon button[data-m="${mm}"]`);
      if (ch) ch.innerHTML = `${MNAME[mm]}${r.rate != null ? ` <small class="${hot(r.rate) ? 'att-hot' : ''}">${fmtR(r.rate)}%</small>` : r.filled ? ' <small>•</small>' : ''}`;
    };
    $$('input[data-f]', b).forEach(inp => {
      inp.oninput = () => {
        const m = monthOf(sy, mm, true);
        const u = inp.dataset.u, l = inp.dataset.l, f = inp.dataset.f;
        const val = inp.value.trim();
        m.v[u] = m.v[u] || {}; m.v[u][l] = m.v[u][l] || {};
        if (val === '' || !isFinite(+val)) delete m.v[u][l][f]; else m.v[u][l][f] = Math.max(0, Math.round(+val));
        persist(); calc();
      };
      inp.onkeydown = e => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const all = $$('input[data-f]', b); const i = all.indexOf(inp);
        // Enter: same column, next level (then the next column)
        const same = all.filter(x => x.dataset.u === inp.dataset.u && x.dataset.f === inp.dataset.f);
        const j = same.indexOf(inp);
        const nx = same[j + 1] || all[i + 1];
        if (nx) { nx.focus(); nx.select(); }
      };
      inp.onfocus = () => inp.select();
    });
    $('#aDays').oninput = e => { const m = monthOf(sy, mm, true); const n = +e.target.value; m.days = n > 0 ? Math.round(n) : ''; persist(); calc(); };
    $('#aCopy').onclick = () => {
      const i = MONTHS.findIndex(x => x[0] === mm);
      if (i <= 0) return toast('لا يوجد شهر سابق في هذا الموسم', true);
      const prev = monthOf(sy, MONTHS[i - 1][0]);
      if (!prev || !agg(prev, U(), L()).np) return toast(`لا توجد أعداد التلاميذ في شهر ${MNAME[MONTHS[i - 1][0]]}`, true);
      const m = monthOf(sy, mm, true);
      let n = 0;
      U().forEach(u => L().forEach(l => { const c = cellOf(prev, u, l); if (isNum(c.p)) { m.v[u] = m.v[u] || {}; m.v[u][l] = m.v[u][l] || {}; m.v[u][l].p = +c.p; n++; } }));
      persist(); go('attend'); toast(`تم نقل أعداد التلاميذ (${n} خانة) من شهر ${MNAME[MONTHS[i - 1][0]]}`);
    };
    $('#aFromP').onclick = () => fromPupils();
    $('#aClr').onclick = async () => {
      if (!await confirmBox(`مسح جميع معطيات شهر <b>${esc(monthLabel(sy, mm))}</b>؟`, 'مسح')) return;
      if (AD().years[sy]) delete AD().years[sy][mm];
      persist(); go('attend');
    };
    calc();
  }

  /* ---------- pupil counts from the pupils register (بطاقة التلاميذ) ---------- */
  // pupil-card level keys (P1, C2, TC...) covered by a row of the table: «الأول»، «الأولى إعدادي»، «الأول + الثاني»
  function codesOfLevel(name) {
    const kind = Cyc.kind();
    const out = [];
    String(name || '').split(/\s*[+،,\/]\s*|\s+و\s*/).filter(Boolean).forEach(pt => {
      let k = K.LV.fromLabel(pt);
      if (!k && kind === 'col') k = K.LV.fromLabel(pt + ' إعدادي');
      if (k) out.push(k);
    });
    if (!out.length) { const k = K.LV.fromLabel(name); if (k) out.push(k); }
    return Array.from(new Set(out));
  }
  const lastDayIso = (sy0, mm0) => { const y = monthYear(sy0, mm0); return `${y}-${mm0}-${String(new Date(y, +mm0, 0).getDate()).padStart(2, '0')}`; };
  const okDate = d => /^\d{4}-\d{2}-\d{2}$/.test(String(d || ''));
  // pupils present in the school: the current ones, or — as of the end of the month — taking the dates of
  // departures / drop-outs (still present before their date) and of arrivals (not yet present before their date) into account
  function pupilsAt(sy0, mm0, asOf) {
    const X = Pupils.X, y = X.Y(sy0);
    if (!asOf) return X.current(sy0);
    const end = lastDayIso(sy0, mm0);
    const out = new Map(), late = new Set();
    y.moves.forEach(m => {
      if (!m.code) return;
      if (X.OUT.includes(m.cat) && okDate(m.date)) out.set(m.code, m.date);
      if (m.cat === 'joined' && okDate(m.date) && m.date > end) late.add(m.code);
    });
    const goneAny = new Set(y.moves.filter(m => X.OUT.includes(m.cat) && m.code).map(m => m.code));
    return y.pupils.filter(p => {
      if (late.has(p.code)) return false;
      if (!goneAny.has(p.code)) return true;
      return out.has(p.code) && out.get(p.code) > end;      // left after the end of the month: still counted
    });
  }
  function planFromPupils(sy0, mm0, asOf) {
    const arr = pupilsAt(sy0, mm0, asOf);
    const units = AD().units, levels = AD().levels;
    const pu = Array.from(new Set(arr.map(p => p.unit || '')));
    const unitMap = {};                       // pupil-card unit -> attendance unit id
    const addUnits = [];
    pu.forEach(n => {
      if (SEC() && units.length) { unitMap[n] = units[0].id; return; }          // one institution: every pupil belongs to it
      let u = units.find(x => K.U.same(x.name, n));
      if (!u && !n && units.length === 1) u = units[0];
      if (!u && n) { u = addUnits.find(x => K.U.same(x.name, n)); if (!u) { u = { id: uid('au'), name: n }; addUnits.push(u); } }
      if (u) unitMap[n] = u.id;
    });
    const codesBy = new Map(levels.map(l => [l.id, codesOfLevel(l.name)]));
    const covered = new Set(); codesBy.forEach(c => c.forEach(k => covered.add(k)));
    const addLevels = [];
    Array.from(new Set(arr.map(p => p.lvl).filter(Boolean))).forEach(k => { if (!covered.has(k)) addLevels.push({ id: uid('al'), name: lvName(k), k }); });
    addLevels.forEach(l => codesBy.set(l.id, [l.k]));
    const levelOfCode = {}; codesBy.forEach((cs, id) => cs.forEach(k => { if (!levelOfCode[k]) levelOfCode[k] = id; }));
    const counts = {};                        // unitId -> levelId -> n
    let used = 0, lost = 0;
    arr.forEach(p => {
      const u = unitMap[p.unit || ''], l = levelOfCode[p.lvl];
      if (!u || !l) { lost++; return; }
      counts[u] = counts[u] || {}; counts[u][l] = (counts[u][l] || 0) + 1; used++;
    });
    return { arr, counts, addUnits, addLevels, codesBy, used, lost, total: arr.length };
  }
  function fromPupils() {
    migrate(DB);
    if (!window.Pupils || !Pupils.X) return toast('بطاقة التلاميذ غير متوفرة', true);
    if (!Pupils.X.Y(sy).pupils.length) return toast(`لا توجد لوائح تلاميذ للموسم ${syDash(sy)} في «بطاقة التلاميذ». استورد لوائح مسار أولا.`, true);
    const base = planFromPupils(sy, mm, false);
    if (!base.total) return toast('جميع التلاميذ في بطاقة التلاميذ مصنفون ضمن المغادرين أو المنقطعين أو غير الملتحقين', true);
    const body = document.createElement('div');
    const render = () => {
      const asOf = $('#apAs', body) ? $('#apAs', body).checked : true;
      const pl = planFromPupils(sy, mm, asOf);
      const un = pl.addUnits.map(u => u.name), ln = pl.addLevels.map(l => l.name);
      body.innerHTML = `<p style="margin:0 0 8px;line-height:1.9">سيتم نقل عدد التلاميذ من «بطاقة التلاميذ» إلى شهر <b>${esc(monthLabel(sy, mm))}</b> حسب ${SEC() ? '' : 'الوحدة المدرسية و'}المستوى: <b>${pl.used}</b> تلميذ(ة).
        <br><span class="muted">لا تتغير خانات «المتغيبين» و«أيام الغياب»، ويمكن تعديل الأعداد يدويا بعد ذلك في أي شهر.</span></p>
        <label style="display:flex;gap:8px;align-items:flex-start;margin:8px 0"><input type="checkbox" id="apAs" ${asOf ? 'checked' : ''}><span>حسب الوضعية في نهاية الشهر (يراعى تاريخ المغادرة والانقطاع والالتحاق إن كان مسجلا)</span></label>
        ${pl.lost ? `<p class="att-hot" style="margin:6px 0">${pl.lost} تلميذ(ة) لم يمكن إدراجهم (${SEC() ? 'مستوى غير معروف' : 'وحدة أو مستوى غير معروف'}).</p>` : ''}
        ${un.length || ln.length ? `<p style="margin:6px 0;line-height:1.8">سيضاف إلى الجدول ما هو موجود في بطاقة التلاميذ وغير موجود فيه: ${un.length ? `<b>وحدات:</b> ${esc(un.join('، '))}. ` : ''}${ln.length ? `<b>مستويات:</b> ${esc(ln.join('، '))}.` : ''}</p>` : ''}`;
      $('#apAs', body).onchange = render;
      body._plan = pl;
    };
    render();
    modal({ title: 'نقل أعداد التلاميذ من بطاقة التلاميذ', size: 'sm', body, actions: [
      { label: 'نقل الأعداد', cls: 'pri', onClick: () => {
        const pl = body._plan, a = AD();
        pl.addUnits.forEach(u => a.units.push({ id: u.id, name: u.name }));
        pl.addLevels.forEach(l => a.levels.push({ id: l.id, name: l.name }));
        // keep the levels in the natural order when every row maps to a level of the pupil card
        if (pl.addLevels.length) {
          const idx = l => { const cs = codesOfLevel(l.name); return cs.length ? Math.min(...cs.map(K.LV.idx)) : 999; };
          a.levels = a.levels.map((l, i) => ({ l, i })).sort((x, y) => (idx(x.l) - idx(y.l)) || (x.i - y.i)).map(x => x.l);
        }
        const m = monthOf(sy, mm, true);
        let n = 0;
        a.units.forEach(u => a.levels.forEach(l => {
          const cs = pl.codesBy.get(l.id) || codesOfLevel(l.name);
          if (!cs.length) return;                                 // free-text rows keep their own numbers
          const c = ((pl.counts[u.id] || {})[l.id]) || 0;
          m.v[u.id] = m.v[u.id] || {}; m.v[u.id][l.id] = m.v[u.id][l.id] || {};
          if (c) { m.v[u.id][l.id].p = c; n++; } else delete m.v[u.id][l.id].p;
        }));
        persist(); go('attend');
        toast(`تم نقل أعداد ${pl.used} تلميذ(ة) من بطاقة التلاميذ (${n} خانة)`);
      } }, { label: 'إلغاء' }] });
  }
  window.Attend.fromPupils = (sy0, mm0, asOf) => { migrate(DB); ensureLists(); return planFromPupils(sy0, mm0, asOf); };

  function monthSummaryHtml(m) {
    const units = AD().units, levels = AD().levels;
    const row = (lbl, r, cls) => `<tr class="${cls || ''}"><td><b>${esc(lbl)}</b></td><td class="num">${r.np ? r.p : '-'}</td><td class="num">${r.abs ? r.a : '-'}</td><td class="num">${r.nd ? r.d : '-'}</td>
      <td class="num ${hot(r.rate) ? 'att-hot' : ''}">${fmtR(r.rate)}</td><td class="num">${fmtP(r.rate)}</td></tr>`;
    const head = t => `<thead><tr><th>${t}</th><th>عدد التلاميذ</th><th>عدد المتغيبين</th><th>عدد أيام الغياب</th><th>نسبة الغياب %</th><th>نسبة الحضور %</th></tr></thead>`;
    if (SEC()) return `<div><div class="sec-t">حسب المستوى — ${esc(monthLabel(sy, mm))}</div><table class="tbl compact">${head('المستوى')}<tbody>
      ${levels.map(l => row(l.name, agg(m, U(), [l.id]))).join('')}${row('المجموع / النسبة العامة', agg(m, U(), L()), 'att-tot')}</tbody></table></div>`;
    return `<div class="att-two"><div><div class="sec-t">حسب الوحدة المدرسية — ${esc(monthLabel(sy, mm))}</div><table class="tbl compact">${head('الوحدة المدرسية')}<tbody>
      ${units.map(u => row(u.name, agg(m, [u.id], L()))).join('')}${row('المجموع / النسبة العامة', agg(m, U(), L()), 'att-tot')}</tbody></table></div>
      <div><div class="sec-t">حسب المستوى</div><table class="tbl compact">${head('المستوى')}<tbody>
      ${levels.map(l => row(l.name, agg(m, U(), [l.id]))).join('')}${row('المجموع', agg(m, U(), L()), 'att-tot')}</tbody></table></div></div>`;
  }

  /* ---------- yearly summary ---------- */
  function tabSummary(b) {
    const units = AD().units, levels = AD().levels;
    const ya = aggYear(sy, U(), L());
    const mrow = ([k]) => { const r = agg(monthOf(sy, k), U(), L()); return `<tr><td><b>${esc(monthLabel(sy, k))}</b></td><td class="num">${r.np ? r.p : '-'}</td><td class="num">${r.abs ? r.a : '-'}</td><td class="num">${r.nd ? r.d : '-'}</td><td class="num">${r.filled ? r.days : '-'}</td><td class="num ${hot(r.rate) ? 'att-hot' : ''}">${fmtR(r.rate)}</td><td class="num">${fmtP(r.rate)}</td></tr>`; };
    const matrix = (title, items, f) => `<div class="sec-t">${title}</div><div style="overflow:auto"><table class="tbl compact att-mx"><thead><tr><th></th>${MONTHS.map(([k]) => `<th>${MNAME[k]}</th>`).join('')}<th>السنة</th></tr></thead><tbody>
      ${items.map(it => { const ids = f(it); return `<tr><td><b>${esc(it.name)}</b></td>${MONTHS.map(([k]) => { const r = agg(monthOf(sy, k), ids.u, ids.l).rate; return `<td class="num ${hot(r) ? 'att-hot' : ''}">${fmtR(r)}</td>`; }).join('')}<td class="num"><b>${fmtR(aggYear(sy, ids.u, ids.l).rate)}</b></td></tr>`; }).join('')}
      <tr class="att-tot"><td><b>النسبة العامة</b></td>${MONTHS.map(([k]) => { const r = agg(monthOf(sy, k), U(), L()).rate; return `<td class="num ${hot(r) ? 'att-hot' : ''}">${fmtR(r)}</td>`; }).join('')}<td class="num"><b>${fmtR(ya.rate)}</b></td></tr></tbody></table></div>`;
    b.innerHTML = `<div class="card"><div class="card-b">
      <div class="att-kpis big"><span>الأشهر المملوءة: <b>${ya.n}</b> من 10</span><span>أيام الغياب: <b>${ya.d}</b></span><span>نسبة الغياب السنوية: <b class="${hot(ya.rate) ? 'att-hot' : ''}">${fmtR(ya.rate)}%</b></span><span>نسبة الحضور السنوية: <b>${fmtP(ya.rate)}%</b></span></div>
      <div class="att-two"><div><div class="sec-t">الحصيلة الشهرية والسنوية</div><table class="tbl compact"><thead><tr><th>الشهر</th><th>عدد التلاميذ</th><th>عدد المتغيبين</th><th>عدد أيام الغياب</th><th>أيام الدراسة</th><th>نسبة الغياب %</th><th>نسبة الحضور %</th></tr></thead><tbody>
        ${MONTHS.map(mrow).join('')}<tr class="att-tot"><td><b>الحصيلة السنوية</b></td><td class="num">-</td><td class="num">${ya.n ? ya.a : '-'}</td><td class="num">${ya.n ? ya.d : '-'}</td><td class="num">${ya.n ? ya.days : '-'}</td><td class="num ${hot(ya.rate) ? 'att-hot' : ''}"><b>${fmtR(ya.rate)}</b></td><td class="num"><b>${fmtP(ya.rate)}</b></td></tr></tbody></table></div>
      <div><div class="sec-t">نسبة الغياب % حسب الشهر</div>${MK.svgBars(MONTHS.map(([k]) => ({ label: MNAME[k], v: agg(monthOf(sy, k), U(), L()).rate })), { alert: +AD().alert, h: 240 })}</div></div>
      ${SEC() ? '' : matrix('نسبة الغياب % حسب الوحدة المدرسية لكل شهر', units, u => ({ u: [u.id], l: L() }))}
      ${matrix('نسبة الغياب % حسب المستوى لكل شهر', levels, l => ({ u: U(), l: [l.id] }))}
      <p class="muted" style="font-size:12px;margin-top:10px">النسبة السنوية تحتسب من الشهور المملوءة فقط: مجموع أيام الغياب ÷ مجموع (عدد التلاميذ × أيام الدراسة) × 100. العلامة «-» تعني أن معطيات الشهر لم تدخل بعد.</p>
    </div></div>`;
  }

  /* ---------- settings: units & levels ---------- */
  function tabSettings(b) {
    const list = (key, title, hint) => `<div class="card"><div class="card-b"><div class="sec-t">${title}</div><p class="muted" style="font-size:12px;margin:-2px 0 10px">${hint}</p>
      <div class="att-list" data-k="${key}">${AD()[key].map((x, i, arr) => `<div class="att-li" data-id="${x.id}"><span class="muted num">${i + 1}</span><input class="inp" value="${esc(x.name)}">
        <button class="btn sm icon" data-a="up" ${i ? '' : 'disabled'} title="أعلى">▲</button><button class="btn sm icon" data-a="dn" ${i < arr.length - 1 ? '' : 'disabled'} title="أسفل">▼</button>
        <button class="btn sm danger icon" data-a="del" title="حذف">${ic('trash')}</button></div>`).join('')}</div>
      <div class="btn-row" style="margin-top:8px"><input class="inp" placeholder="${key === 'units' ? 'اسم الوحدة المدرسية الجديدة' : 'المستوى الجديد (مثال: الأول + الثاني)'}" data-new="${key}" style="max-width:300px"><button class="btn sm" data-add="${key}">${ic('plus')} إضافة</button></div></div></div>`;
    b.innerHTML = `<div class="att-two"${SEC() ? ' style="grid-template-columns:1fr;max-width:760px"' : ''}>${SEC() ? '' : list('units', 'الوحدات المدرسية', 'تظهر كأعمدة في المواظبة الشهرية، وتستعمل أيضا في تقارير التواصل مع الشركاء (توزيع المهام على الوحدات).')}
      ${list('levels', 'المستويات / الأقسام', 'تظهر كأسطر. في الأقسام المشتركة يمكن اعتماد أسطر مثل «الأول + الثاني».')}</div>
      <div class="card" style="margin-top:14px"><div class="card-b"><div class="fgrid" style="max-width:640px">
        <div class="fld"><label>عدد أيام الدراسة الافتراضي في الشهر</label><input class="inp" type="number" min="1" max="31" id="sDays" value="${esc(AD().days)}"></div>
        <div class="fld"><label>عتبة التنبيه (نسبة الغياب %)</label><input class="inp" type="number" min="0" step="0.5" id="sAlert" value="${esc(AD().alert)}"></div></div></div></div>`;
    $$('.att-list', b).forEach(box => {
      const key = box.dataset.k, arr = AD()[key];
      $$('.att-li', box).forEach(row => {
        const x = arr.find(y => y.id === row.dataset.id);
        $('input', row).onchange = e => { const n = e.target.value.trim(); if (!n) { e.target.value = x.name; return; } x.name = n; persist(); };
        $$('[data-a]', row).forEach(btn => btn.onclick = async () => {
          const i = arr.indexOf(x);
          if (btn.dataset.a === 'up' && i > 0) { arr.splice(i, 1); arr.splice(i - 1, 0, x); }
          if (btn.dataset.a === 'dn' && i < arr.length - 1) { arr.splice(i, 1); arr.splice(i + 1, 0, x); }
          if (btn.dataset.a === 'del') {
            if (arr.length === 1) return toast('يجب الإبقاء على عنصر واحد على الأقل', true);
            if (!await confirmBox(`حذف <b>${esc(x.name)}</b>؟ ستحذف معطياته في جميع الأشهر.`, 'حذف')) return;
            arr.splice(i, 1);
            Object.values(AD().years).forEach(y => Object.values(y).forEach(m => {
              if (key === 'units') delete m.v[x.id]; else Object.values(m.v).forEach(o => delete o[x.id]);
            }));
          }
          persist(); go('attend');
        });
      });
    });
    $$('[data-add]', b).forEach(btn => btn.onclick = () => {
      const key = btn.dataset.add, inp = $(`[data-new="${key}"]`, b), n = inp.value.trim();
      if (!n) return inp.focus();
      AD()[key].push({ id: uid(key === 'units' ? 'au' : 'al'), name: n }); persist(); go('attend');
    });
    $$('[data-new]', b).forEach(inp => inp.onkeydown = e => { if (e.key === 'Enter') $(`[data-add="${inp.dataset.new}"]`, b).click(); });
    $('#sDays').onchange = e => { const n = +e.target.value; if (n > 0) { AD().days = Math.round(n); persist(); } };
    $('#sAlert').onchange = e => { const n = +e.target.value; if (n >= 0) { AD().alert = n; persist(); } };
  }

  /* ---------- Excel ---------- */
  const MONTH_RX = [['09', /شتنبر|سبتمبر/], ['10', /أكتوبر|اكتوبر|أكتوبر/], ['11', /نونبر|نوفمبر/], ['12', /دجنبر|ديسمبر/], ['01', /يناير|جانفي/], ['02', /فبراير|فيفري/], ['03', /مارس/], ['04', /أبريل|ابريل|إبريل|أفريل/], ['05', /ماي|مايو/], ['06', /يونيو|يونيه|جوان/]];
  const monthOfName = n => { const f = MONTH_RX.find(([, rx]) => rx.test(String(n || ''))); return f ? f[0] : null; };
  const toNum = v => { const s = String(v == null ? '' : v).trim().replace(',', '.'); return s !== '' && isFinite(+s) ? +s : null; };
  // one month sheet of the school's workbook
  function parseMonth(rows) {
    let hr = -1, gA = -1, gD = -1, gP = -1, lc = -1;
    for (let i = 0; i < Math.min(rows.length, 40) && hr < 0; i++) {
      const r = rows[i] || [];
      let a = -1, d = -1, p = -1, l = -1;
      r.forEach((c, j) => {
        c = String(c || '');
        if (/المتغيبين|المتغيبون/.test(c)) { if (a < 0) a = j; } else if (/أيام الغياب|ايام الغياب/.test(c)) { if (d < 0) d = j; } else if (/عدد التلاميذ|عدد المتعلمين/.test(c)) { if (p < 0) p = j; } else if (/المستوي|المستوى|الأقسام|القسم/.test(c) && !/نسبة|%/.test(c)) { if (l < 0) l = j; }
      });
      if (a >= 0 && d >= 0 && p >= 0) { hr = i; gA = a; gD = d; gP = p; lc = l; }
    }
    if (hr < 0) return null;
    const starts = [gA, gD, gP, lc].filter(x => x >= 0).sort((x, y) => x - y);
    const width = (rows[hr + 1] || []).length;
    const range = s => { const nx = starts.find(x => x > s); return [s, nx == null ? Math.max(width, s + 1) : nx]; };
    const names = s => { const [a, z] = range(s); const o = []; for (let j = a; j < z; j++) { const n = String((rows[hr + 1] || [])[j] || '').trim(); if (n && toNum(n) == null) o.push([n, j]); } return o; };
    const uA = names(gA), uD = names(gD), uP = names(gP);
    const units = uP.length ? uP : uA;
    const colFor = (list, n) => { const f = list.find(x => MK.hkey(x[0]) === MK.hkey(n)); return f ? f[1] : -1; };
    const out = { units: units.map(x => x[0]), levels: [], vals: {}, days: null };
    for (let i = hr + 2; i < rows.length; i++) {
      const r = rows[i] || [];
      let lv = lc >= 0 ? String(r[lc] || '').trim() : '';
      if (!lv) { const t = r.map(x => String(x || '').trim()).filter(x => x && toNum(x) == null); lv = t[t.length - 1] || ''; }
      if (!lv || /المجموع|نسبة|مجموع/.test(lv)) break;
      out.levels.push(lv);
      units.forEach(([n]) => {
        const g = c => c < 0 ? null : toNum(r[c]);
        out.vals[n + '\u0001' + lv] = { p: g(colFor(uP, n)), a: g(colFor(uA, n)), d: g(colFor(uD, n)) };
      });
    }
    // school days of the month: the number next to «عدد أيام الدراسة»
    rows.forEach(r => (r || []).forEach((c, j) => {
      if (out.days != null || !/أيام الدراسة|ايام الدراسة/.test(String(c || ''))) return;
      let best = null, bd = 1e9;
      (r || []).forEach((x, k) => { const v = toNum(x); if (k !== j && v != null && v >= 1 && v <= 31 && Number.isInteger(v)) { const dd = Math.abs(k - j) - (k > j ? .5 : 0); if (dd < bd) { bd = dd; best = v; } } });
      out.days = best;
    }));
    return out;
  }
  async function importBook() {
    const sheets = await MK.openTable(); if (!sheets) return;
    let syF = null;
    sheets.some(sh => sh.rows.slice(0, 12).some(r => (r || []).some(c => { const m = /(20\d{2})\s*[-/–]\s*(20\d{2})/.exec(String(c || '')); if (m && +m[2] === +m[1] + 1) { syF = `${m[1]}/${m[2]}`; return true; } return false; })));
    const months = [];
    sheets.forEach(sh => {
      let k = monthOfName(sh.name);
      if (!k) { const t = sh.rows.slice(0, 12).map(r => (r || []).join(' ')).join(' '); if (!/المواظبة|الغياب/.test(t)) return; k = monthOfName(t.replace(/الموسم الدراسي/g, '')); }
      if (!k || months.some(x => x.k === k)) return;
      const p = parseMonth(sh.rows);
      if (p && p.units.length && p.levels.length) months.push(Object.assign({ k }, p));
    });
    if (!months.length) return toast('لم يتم العثور على أوراق الأشهر (شتنبر، أكتوبر...) بالشكل المعتمد: عدد التلاميذ المتغيبين، عدد أيام الغياب، عدد التلاميذ' + (SEC() ? ' لكل مستوى.' : ' لكل وحدة.'), true);
    const target = syF || sy;
    // levels with no pupils in any month are left out (e.g. empty rows of combined classes)
    const allUnits = [], allLevels = [];
    months.forEach(m => { m.units.forEach(u => { if (!allUnits.includes(u)) allUnits.push(u); }); m.levels.forEach(l => { if (!allLevels.includes(l)) allLevels.push(l); }); });
    const usedLevel = l => months.some(m => m.units.some(u => { const c = m.vals[u + '\u0001' + l]; return c && ((c.p || 0) > 0 || (c.d || 0) > 0 || (c.a || 0) > 0); }));
    const levels = allLevels.filter(usedLevel);
    const filled = m => m.units.some(u => levels.some(l => { const c = m.vals[u + '\u0001' + l]; return c && ((c.p || 0) > 0 || (c.d || 0) > 0 || (c.a || 0) > 0); }));
    const fm = months.filter(filled);
    if (!fm.length) return toast('الملف لا يتضمن أي معطيات مملوءة', true);
    const hasData = Object.values(AD().years).some(y => Object.values(y).some(m => Object.keys(m.v || {}).length));
    const ok = await confirmBox(`استيراد مواظبة الموسم <b>${esc(syDash(target))}</b>: ${fm.length} شهر(أشهر) (${fm.map(m => MNAME[m.k]).join('، ')})، ${SEC() ? '' : allUnits.length + ' وحدة مدرسية و'}${levels.length} مستوى.<br><span class="muted">تعوض معطيات هذه الأشهر في البرنامج بمعطيات الملف.</span>`, 'استيراد', false);
    if (!ok) return;
    const a = AD();
    if (!hasData) { a.units = []; a.levels = []; }
    const idOf = (arr, n, pre) => { let x = arr.find(y => MK.hkey(y.name) === MK.hkey(n)); if (!x) { x = { id: uid(pre), name: n }; arr.push(x); } return x.id; };
    const uId = Object.fromEntries(allUnits.map(n => [n, idOf(a.units, n, 'au')]));
    const lId = Object.fromEntries(levels.map(n => [n, idOf(a.levels, n, 'al')]));
    a.years[target] = a.years[target] || {};
    fm.forEach(m => {
      const o = a.years[target][m.k] = { days: m.days || a.days, v: {} };
      m.units.forEach(u => levels.forEach(l => {
        const c = m.vals[u + '\u0001' + l]; if (!c) return;
        const e = {}; ['p', 'a', 'd'].forEach(f => { if (c[f] != null) e[f] = Math.max(0, Math.round(c[f])); });
        if (Object.keys(e).length) { o.v[uId[u]] = o.v[uId[u]] || {}; o.v[uId[u]][lId[l]] = e; }
      }));
    });
    sy = target; MK.setSy(target); normSec();
    const withAbs = fm.filter(m => m.units.some(u => levels.some(l => { const c = m.vals[u + '\u0001' + l]; return c && (c.a != null || c.d != null); })));
    mm = withAbs.length ? withAbs[withAbs.length - 1].k : defaultMonth();
    persist(); go('attend', { tab: 'month' });
    toast(`تم استيراد ${fm.length} شهر(أشهر) من ملف المواظبة`);
  }
  // export: the same layout as the school's workbook (summary + one sheet per month), importable again
  async function exportBook() {
    const units = AD().units, levels = AD().levels, n = units.length;
    const R = r => r == null ? '-' : +r.toFixed(2);
    const blank = k => Array.from({ length: k }, () => '');
    const sheets = [];
    const ya = aggYear(sy, U(), L());
    const sum = [[`ملخص الغياب – الموسم الدراسي ${syDash(sy)}`], [S().school || ''], [],
      ['الشهر', 'عدد التلاميذ', 'عدد المتغيبين', 'عدد أيام الغياب', 'أيام الدراسة', 'نسبة الغياب %', 'نسبة الحضور %']]
      .concat(MONTHS.map(([k]) => { const r = agg(monthOf(sy, k), U(), L()); return [monthLabel(sy, k), r.np ? r.p : '-', r.abs ? r.a : '-', r.nd ? r.d : '-', r.filled ? r.days : '-', R(r.rate), r.rate == null ? '-' : +(100 - r.rate).toFixed(2)]; }))
      .concat([['الحصيلة السنوية', '-', ya.n ? ya.a : '-', ya.n ? ya.d : '-', ya.n ? ya.days : '-', R(ya.rate), ya.rate == null ? '-' : +(100 - ya.rate).toFixed(2)], [],
        [SEC() ? 'نسبة الغياب % حسب المستوى لكل شهر' : 'نسبة الغياب % حسب الوحدة المدرسية لكل شهر'], [SEC() ? 'المستوى' : 'الوحدة المدرسية'].concat(MONTHS.map(x => x[1]), ['السنة'])])
      .concat(SEC() ? levels.map(l => [l.name].concat(MONTHS.map(([k]) => R(agg(monthOf(sy, k), U(), [l.id]).rate)), [R(aggYear(sy, U(), [l.id]).rate)]))
        : units.map(u => [u.name].concat(MONTHS.map(([k]) => R(agg(monthOf(sy, k), [u.id], L()).rate)), [R(aggYear(sy, [u.id], L()).rate)])))
      .concat([['النسبة العامة'].concat(MONTHS.map(([k]) => R(agg(monthOf(sy, k), U(), L()).rate)), [R(ya.rate)]), [],
        ['ملاحظة: نسبة الغياب = عدد أيام الغياب ÷ (عدد التلاميذ × عدد أيام الدراسة) × 100. النسبة السنوية تحتسب من الشهور المملوءة فقط.']]);
    sheets.push({ name: 'ملخص الغياب', rows: sum, widths: [24, 14, 14, 14, 12, 14, 14, 12, 12, 12, 12] });
    MONTHS.forEach(([k]) => {
      const m = monthOf(sy, k);
      const v = (u, l, f) => { const c = cellOf(m, u, l); return isNum(c[f]) ? +c[f] : ''; };
      const rows = [[`المواظبة الشهرية للموسم الدراسي ${syDash(sy)}`], [monthLabel(sy, k)],
        ['نسبة الغياب بالمستوى %', 'عدد التلاميذ المتغيبين بكل قسم'].concat(blank(n - 1), ['عدد أيام الغياب بكل قسم'], blank(n - 1), ['عدد التلاميذ'], blank(n - 1), ['المستويات']),
        [''].concat(units.map(u => u.name), units.map(u => u.name), units.map(u => u.name), [''])];
      levels.forEach(l => rows.push([R(agg(m, U(), [l.id]).rate)].concat(units.map(u => v(u.id, l.id, 'a')), units.map(u => v(u.id, l.id, 'd')), units.map(u => v(u.id, l.id, 'p')), [l.name])));
      const tot = f => units.map(u => { const r = agg(m, [u.id], L()); return f === 'p' ? (r.np ? r.p : '') : f === 'd' ? (r.nd ? r.d : '') : (r.abs ? r.a : ''); });
      const all = agg(m, U(), L());
      rows.push([R(all.rate)].concat(tot('a'), tot('d'), tot('p'), ['المجموع']));
      if (!SEC()) rows.push(['', 'نسبة الغياب بالوحدة ←'].concat(blank(n - 1), units.map(u => R(agg(m, [u.id], L()).rate)), blank(n), ['نسبة الغياب بالوحدة %']));
      rows.push([R(all.rate), 'النسبة العامة للغياب']);
      rows.push([all.rate == null ? '-' : +(100 - all.rate).toFixed(2), 'النسبة العامة للحضور']);
      rows.push(['', 'عدد أيام الدراسة خلال الشهر', m && m.days ? +m.days : +AD().days]);
      sheets.push({ name: MNAME[k], rows, widths: [14].concat(blank(3 * n).map(() => 11), [18]) });
    });
    const r = await window.api.saveXlsxBook(sheets, `المواظبة_${syDash(sy)}.xlsx`);
    if (r && r.ok) toast('تم التصدير إلى Excel (ملخص الغياب + ورقة لكل شهر)');
  }

  /* ================================================================= */
  /* documents */
  const sign = s => `<div class="att-sign"><div></div><div class="c"><div>حرر ب: ${esc(s.city || '')} &nbsp; في: ${esc(Dx.fmtDate(today()))}</div><div class="b">توقيع وإمضاء المدير(ة)</div></div></div>`;
  const tdR = r => `<td class="${hot(r) ? 'hot' : ''}">${fmtR(r)}</td>`;
  function monthDoc(s, sy0, mm0) {
    const m = monthOf(sy0, mm0), units = AD().units, levels = AD().levels, n = units.length;
    const all = agg(m, U(), L());
    const cnt = (r, f) => f === 'p' ? (r.np ? r.p : '') : f === 'd' ? (r.nd ? r.d : '') : (r.abs ? r.a : '');
    const sm = n > 5 ? ' style="font-size:7.4pt"' : '';
    const head = `<tr><th rowspan="2">المستويات</th><th colspan="${n}">عدد التلاميذ</th><th colspan="${n}">عدد التلاميذ المتغيبين</th><th colspan="${n}">عدد أيام الغياب</th><th rowspan="2">نسبة الغياب بالمستوى %</th></tr>
      <tr>${[0, 1, 2].map(() => units.map(u => `<th${sm}>${esc(u.name)}</th>`).join('')).join('')}</tr>`;
    const rows = levels.map(l => `<tr><td class="b">${esc(l.name)}</td>${['p', 'a', 'd'].map(f => units.map(u => `<td>${cnt(agg(m, [u.id], [l.id]), f)}</td>`).join('')).join('')}${tdR(agg(m, U(), [l.id]).rate)}</tr>`)
      .concat([`<tr class="tot"><td>المجموع</td>${['p', 'a', 'd'].map(f => units.map(u => `<td>${cnt(agg(m, [u.id], L()), f)}</td>`).join('')).join('')}${tdR(all.rate)}</tr>`,
        `<tr class="tot"><td>نسبة الغياب بالوحدة %</td><td colspan="${2 * n}" style="font-weight:400;font-size:8pt">النسبة = أيام الغياب ÷ (عدد التلاميذ × أيام الدراسة) × 100</td>${units.map(u => tdR(agg(m, [u.id], L()).rate)).join('')}<td></td></tr>`]);
    const uTbl = `<table class="tbl att-tbl"><thead><tr><th>الوحدة المدرسية</th><th>عدد التلاميذ</th><th>المتغيبون</th><th>أيام الغياب</th><th>نسبة الغياب %</th><th>نسبة الحضور %</th></tr></thead><tbody>
      ${units.map(u => { const r = agg(m, [u.id], L()); return `<tr><td class="b">${esc(u.name)}</td><td>${cnt(r, 'p')}</td><td>${cnt(r, 'a')}</td><td>${cnt(r, 'd')}</td>${tdR(r.rate)}<td>${fmtP(r.rate)}</td></tr>`; }).join('')}
      <tr class="tot"><td>المجموع</td><td>${cnt(all, 'p')}</td><td>${cnt(all, 'a')}</td><td>${cnt(all, 'd')}</td>${tdR(all.rate)}<td>${fmtP(all.rate)}</td></tr></tbody></table>`;
    const chart = MK.svgBars(units.map(u => ({ label: u.name, v: agg(m, [u.id], L()).rate })), { alert: +AD().alert, w: 520, h: 185, fs: n > 6 ? 8.5 : 10 });
    if (SEC()) {                                   // collège / lycée: one institution — the table is by level only
      const lr = l => { const r = agg(m, U(), [l.id]); return `<tr><td class="b">${esc(l.name)}</td><td>${cnt(r, 'p')}</td><td>${cnt(r, 'a')}</td><td>${cnt(r, 'd')}</td>${tdR(r.rate)}<td>${fmtP(r.rate)}</td></tr>`; };
      const hd = `<tr><th>المستويات</th><th>عدد التلاميذ</th><th>عدد التلاميذ المتغيبين</th><th>عدد أيام الغياب</th><th>نسبة الغياب %</th><th>نسبة الحضور %</th></tr>`;
      const tot = `<tr class="tot"><td>المجموع</td><td>${cnt(all, 'p')}</td><td>${cnt(all, 'a')}</td><td>${cnt(all, 'd')}</td>${tdR(all.rate)}<td>${fmtP(all.rate)}</td></tr>`;
      const lchart = MK.svgBars(levels.map(l => ({ label: l.name, v: agg(m, U(), [l.id]).rate })), { alert: +AD().alert, w: 520, h: 185, fs: levels.length > 6 ? 8.5 : 10 });
      return MK.flowPages({ page: 'a4l', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">المواظبة الشهرية — ${esc(monthLabel(sy0, mm0))}</div>
          <div class="mk-info">الموسم الدراسي: <b>${esc(syDash(sy0))}</b> &nbsp;—&nbsp; عدد أيام الدراسة خلال الشهر: <b>${m && m.days ? esc(m.days) : '-'}</b></div>`,
        blocks: [{ table: { cls: 'att-tbl', head: hd, rows: levels.map(lr).concat([tot]) } },
          `<div style="display:grid;grid-template-columns:1fr 1.4fr;gap:5mm;align-items:center;margin-top:2mm"><div class="att-kpi"><span>النسبة العامة للغياب: <b class="${hot(all.rate) ? 'hot' : ''}">${fmtR(all.rate)}%</b></span><span>النسبة العامة للحضور: <b>${fmtP(all.rate)}%</b></span></div>
            <div><div class="c b" style="font-size:9pt">نسبة الغياب % حسب المستوى</div>${lchart}</div></div>`,
          sign(s)] });
    }
    return MK.flowPages({ page: 'a4l', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">المواظبة الشهرية — ${esc(monthLabel(sy0, mm0))}</div>
        <div class="mk-info">الموسم الدراسي: <b>${esc(syDash(sy0))}</b> &nbsp;—&nbsp; عدد أيام الدراسة خلال الشهر: <b>${m && m.days ? esc(m.days) : '-'}</b></div>`,
      blocks: [{ table: { cls: 'att-tbl', head, rows } },
        `<div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm;align-items:start;margin-top:2mm"><div>${uTbl}<div class="att-kpi"><span>النسبة العامة للغياب: <b class="${hot(all.rate) ? 'hot' : ''}">${fmtR(all.rate)}%</b></span><span>النسبة العامة للحضور: <b>${fmtP(all.rate)}%</b></span></div></div>
          <div><div class="c b" style="font-size:9pt">نسبة الغياب % حسب الوحدة المدرسية</div>${chart}</div></div>`,
        sign(s)] });
  }
  function yearDoc(s, sy0) {
    const units = AD().units, levels = AD().levels;
    const ya = aggYear(sy0, U(), L());
    const mrows = MONTHS.map(([k]) => { const r = agg(monthOf(sy0, k), U(), L()); return `<tr><td class="b">${esc(monthLabel(sy0, k))}</td><td>${r.np ? r.p : '-'}</td><td>${r.abs ? r.a : '-'}</td><td>${r.nd ? r.d : '-'}</td><td>${r.filled ? r.days : '-'}</td>${tdR(r.rate)}<td>${fmtP(r.rate)}</td></tr>`; })
      .concat([`<tr class="tot"><td>الحصيلة السنوية</td><td>-</td><td>${ya.n ? ya.a : '-'}</td><td>${ya.n ? ya.d : '-'}</td><td>${ya.n ? ya.days : '-'}</td>${tdR(ya.rate)}<td>${fmtP(ya.rate)}</td></tr>`]);
    const mTbl = `<table class="tbl att-tbl"><thead><tr><th>الشهر</th><th>عدد التلاميذ</th><th>عدد المتغيبين</th><th>أيام الغياب</th><th>أيام الدراسة</th><th>نسبة الغياب %</th><th>نسبة الحضور %</th></tr></thead><tbody>${mrows.join('')}</tbody></table>`;
    const chart = MK.svgBars(MONTHS.map(([k]) => ({ label: MNAME[k], v: agg(monthOf(sy0, k), U(), L()).rate })), { alert: +AD().alert, w: 520, h: 230, fs: 9 });
    const mx = (title, items, f) => ({ before: `<div class="tcap" style="font-size:9.5pt">${title}</div>`, keepNext: true, table: { cls: 'att-tbl',
      head: `<tr><th></th>${MONTHS.map(([k]) => `<th>${MNAME[k]}</th>`).join('')}<th>السنة</th></tr>`,
      rows: items.map(it => { const ids = f(it); return `<tr><td class="b">${esc(it.name)}</td>${MONTHS.map(([k]) => tdR(agg(monthOf(sy0, k), ids.u, ids.l).rate)).join('')}${tdR(aggYear(sy0, ids.u, ids.l).rate)}</tr>`; })
        .concat([`<tr class="tot"><td>النسبة العامة</td>${MONTHS.map(([k]) => tdR(agg(monthOf(sy0, k), U(), L()).rate)).join('')}${tdR(ya.rate)}</tr>`]) } });
    return MK.flowPages({ page: 'a4l', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">ملخص غياب التلاميذ — الموسم الدراسي ${esc(syDash(sy0))}</div>`,
      blocks: [`<div style="display:grid;grid-template-columns:1.1fr 1fr;gap:5mm;align-items:start"><div><div class="tcap" style="font-size:9.5pt">الحصيلة الشهرية والسنوية</div>${mTbl}</div><div><div class="tcap" style="font-size:9.5pt">نسبة الغياب % حسب الشهر</div>${chart}</div></div>`,
        `<div class="att-kpi"><span>نسبة الغياب السنوية: <b class="${hot(ya.rate) ? 'hot' : ''}">${fmtR(ya.rate)}%</b></span><span>نسبة الحضور السنوية: <b>${fmtP(ya.rate)}%</b></span><span>الأشهر المحتسبة: <b>${ya.n}</b></span></div>`,
        ...(SEC() ? [] : [mx('نسبة الغياب % حسب الوحدة المدرسية لكل شهر', units, u => ({ u: [u.id], l: L() }))]),
        mx('نسبة الغياب % حسب المستوى لكل شهر', levels, l => ({ u: U(), l: [l.id] })),
        `<div class="small" style="margin-top:1.5mm">نسبة الغياب = عدد أيام الغياب ÷ (عدد التلاميذ × عدد أيام الدراسة) × 100. النسبة السنوية تحتسب من الشهور المملوءة فقط، والعلامة «-» تعني أن معطيات الشهر لم تدخل بعد.</div>`,
        sign(s)] });
  }

  window.pageAttendDoc = function (v, arg) {
    migrate(DB); ensureLists();
    arg = arg || {};
    MK.docPage(v, {
      title: arg.kind === 'year' ? 'ملخص غياب التلاميذ' : 'المواظبة الشهرية للتلاميذ', icon: '📊', modes: false, flow: true,
      state: { kind: arg.kind || 'month', sy: arg.sy || sy || MK.curSy(), mm: arg.mm || mm || defaultMonth() },
      back: () => go('attend'),
      form: (box, st, refresh) => {
        box.innerHTML = `<div class="sec-t">الوثيقة</div><div class="fld"><select class="inp" id="dK"><option value="month" ${st.kind === 'month' ? 'selected' : ''}>المواظبة الشهرية</option><option value="year" ${st.kind === 'year' ? 'selected' : ''}>ملخص الغياب (الموسم الدراسي)</option></select></div>
          <div class="fld"><label>الموسم الدراسي</label><select class="inp" id="dY">${yearsList().map(y => `<option value="${y}" ${y === st.sy ? 'selected' : ''}>${syDash(y)}</option>`).join('')}</select></div>
          <div class="fld" id="dMf" style="${st.kind === 'month' ? '' : 'display:none'}"><label>الشهر</label><select class="inp" id="dM">${MONTHS.map(([k, n]) => `<option value="${k}" ${k === st.mm ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
          <p class="muted" style="font-size:12px;line-height:1.7">تحسب النسب تلقائيا من المعطيات المدخلة في «إحصاء مواظبة التلاميذ». النسب التي تتجاوز ${esc(AD().alert)}% تظهر بالأحمر.</p>`;
        $('#dK', box).onchange = e => { st.kind = e.target.value; $('#dMf', box).style.display = st.kind === 'month' ? '' : 'none'; refresh(); };
        $('#dY', box).onchange = e => { st.sy = e.target.value; refresh(); };
        $('#dM', box).onchange = e => { st.mm = e.target.value; refresh(); };
      },
      build: st => ({ page: 'a4l', pages: st.kind === 'year' ? yearDoc(S(), st.sy) : monthDoc(S(), st.sy, st.mm) }),
      fname: st => st.kind === 'year' ? `ملخص_الغياب_${syDash(st.sy)}` : `المواظبة_${MNAME[st.mm]}_${monthYear(st.sy, st.mm)}`
    });
  };
})();
