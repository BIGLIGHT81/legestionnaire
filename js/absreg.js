'use strict';
/* 1.9.2 — سجل غياب التلاميذ (على نمط سجل الأستاذ «ورقة ضبط الغياب بالشبكة»):
   الثانوي: خمسة أيام × ثماني حصص (8-9 … 11-12، 2-3 … 5-6)، الابتدائي: خمسة أيام × فترتان (صباحا ومساء).
   Entry by clicking cells (غ غياب غير مبرر → ب مبرر → ت تأخر → فارغ). Printable weekly sheet, monthly class statistics, individual absence card. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl } = window.K;

  const isSec = () => /إعدادي|تأهيلي/.test(S().cycle || '');
  const SESS = () => isSec() ? ['8-9', '9-10', '10-11', '11-12', '2-3', '3-4', '4-5', '5-6'] : ['صباحا', 'مساء'];
  const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
  const CODES = ['', 'غ', 'ب', 'ت']; // '' present, غ absent, ب justified, ت late
  const CODE_NAME = { 'غ': 'غياب غير مبرر', 'ب': 'غياب مبرر', 'ت': 'تأخر' };

  function migrate(db) { const a = db.absreg = db.absreg || {}; a.years = a.years && typeof a.years === 'object' ? a.years : {}; }
  const Y = sy => { migrate(DB); return DB.absreg.years[sy] || (DB.absreg.years[sy] = { weeks: {} }); };
  const iso = d => d.toISOString().slice(0, 10);
  const monday = s => { const d = new Date((s || iso(new Date())) + 'T00:00:00Z'); const w = (d.getUTCDay() + 6) % 7; d.setUTCDate(d.getUTCDate() - w); return iso(d); };
  const addDays = (s, n) => { const d = new Date(s + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return iso(d); };
  const pkey = p => p.code || p.mid || `${p.last}|${p.first}`;
  const nameOf = p => `${p.last || ''} ${p.first || ''}`.trim();
  const classes = sy => Array.from(new Set((window.Pupils ? Pupils.current(sy) : []).map(p => p.cls).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
  // 1.9.4: the pupils in the order of the Massar list of the class (not alphabetical)
  const pupilsOf = (sy, cls) => { const L = (window.Pupils ? Pupils.current(sy) : []).filter(p => p.cls === cls); return Pupils.massarOrder ? Pupils.massarOrder(L, sy) : L; };
  const week = (sy, wk, cls, create) => { const W = Y(sy).weeks; const w = W[wk] || (create ? (W[wk] = {}) : null); if (!w) return null; return w[cls] || (create ? (w[cls] = {}) : null); };
  const rowOf = (sy, wk, cls, k, create) => { const c = week(sy, wk, cls, create); if (!c) return null; const n = 5 * SESS().length; let r = c[k]; if (!r && create) r = c[k] = '.'.repeat(n); if (r && r.length < n) r = c[k] = r.padEnd(n, '.'); return r || null; };
  const codeAt = (r, i) => { const c = r ? r[i] : '.'; return c === 'A' ? 'غ' : c === 'J' ? 'ب' : c === 'L' ? 'ت' : ''; };
  const LET = { 'غ': 'A', 'ب': 'J', 'ت': 'L', '': '.' };
  function setCell(sy, wk, cls, k, i, code) { const r = rowOf(sy, wk, cls, k, true); const a = r.split(''); a[i] = LET[code] || '.'; const s = a.join(''); const c = week(sy, wk, cls, true); if (/^\.+$/.test(s)) delete c[k]; else c[k] = s; }

  // totals of a stored row over a day range
  const tally = (r, from, to) => { const o = { a: 0, j: 0, l: 0, days: 0 }; const n = SESS().length; if (!r) return o; for (let d = 0; d < 5; d++) { let any = false; for (let s = 0; s < n; s++) { const c = r[d * n + s]; if (c === 'A') { o.a++; any = true; } else if (c === 'J') { o.j++; any = true; } else if (c === 'L') o.l++; } if (any) o.days++; } return o; };

  /* ---------- statistics of a month of a class ---------- */
  function monthStats(sy, cls, ym) {
    const P = pupilsOf(sy, cls), n = SESS().length, out = P.map(p => ({ p, a: 0, j: 0, l: 0, days: 0 }));
    const W = Y(sy).weeks, ds = new Set();
    Object.keys(W).forEach(wk => {
      const c = W[wk][cls]; if (!c) return;
      for (let d = 0; d < 5; d++) {
        const dt = addDays(wk, d); if (dt.slice(0, 7) !== ym) continue;
        out.forEach(o => { const r = c[pkey(o.p)]; if (!r) return; let any = false; for (let s = 0; s < n; s++) { const ch = r[d * n + s]; if (ch === 'A') { o.a++; any = true; } else if (ch === 'J') { o.j++; any = true; } else if (ch === 'L') o.l++; } if (any) o.days++; });
      }
    });
    // open days = days with at least one recorded absence in the class or whose week exists
    Object.keys(W).forEach(wk => { if (!W[wk][cls]) return; for (let d = 0; d < 5; d++) { const dt = addDays(wk, d); if (dt.slice(0, 7) === ym) ds.add(dt); } });
    return { rows: out, openDays: ds.size, sessions: n };
  }

  /* ---------- the page ---------- */
  const st = { sy: '', cls: '', wk: '' };
  window.pageAbsReg = function (v) {
    migrate(DB);
    const sy = st.sy || (st.sy = MK.curSy()), cl = classes(sy);
    if (!st.cls || !cl.includes(st.cls)) st.cls = cl[0] || '';
    const wk = st.wk = monday(st.wk || iso(new Date()));
    const P = pupilsOf(sy, st.cls), S0 = SESS(), n = S0.length;
    v.innerHTML = `<div class="page-h"><div><h2>سجل غياب التلاميذ</h2><div class="muted">${isSec() ? 'ورقة ضبط الغياب بالشبكة: 5 أيام × 8 حصص' : 'سجل الغياب: 5 أيام × فترتان (صباحا ومساء)'} — انقر على الخانة لتسجيل: غ (غير مبرر) ← ب (مبرر) ← ت (تأخر) ← فارغ</div></div>
      <div class="btn-row"><button class="btn" id="arDoc">${ic('print')} طباعة الورقة والإحصاءات</button><button class="btn" id="arVs">${ic('file')} ${isSec() ? 'الحراسة العامة: المراسلات والاستدعاءات' : 'مراسلات المتغيبين والاستدعاءات'}</button></div></div>
      <div class="card"><div class="card-b"><div class="btn-row" style="flex-wrap:wrap;gap:8px">
        <select class="inp" id="arC" style="width:auto">${cl.map(c => `<option ${c === st.cls ? 'selected' : ''}>${esc(c)}</option>`).join('') || '<option value="">— لا أقسام —</option>'}</select>
        <button class="btn sm" id="arP">‹ الأسبوع السابق</button><input class="inp" type="date" id="arW" value="${wk}" style="width:auto"><button class="btn sm" id="arN">الأسبوع التالي ›</button>
        <span class="muted">من ${esc(MK.showDate(wk))} إلى ${esc(MK.showDate(addDays(wk, 4)))}</span></div></div></div>
      ${P.length ? `<div class="card" style="margin-top:10px"><div class="card-b" style="overflow:auto;max-height:68vh"><table class="tbl ar-t" style="font-size:12px"><thead><tr><th rowspan="2">ر.ت</th><th rowspan="2" style="min-width:150px">اسم التلميذ(ة)</th>${DAYS.map(d => `<th colspan="${n}">${d} ${esc(MK.showDate(addDays(wk, DAYS.indexOf(d))).slice(0, 5))}</th>`).join('')}<th rowspan="2">غ</th><th rowspan="2">ب</th><th rowspan="2">ت</th></tr>
        <tr>${DAYS.map(() => S0.map(s => `<th style="font-size:10px;padding:2px 3px">${s}</th>`).join('')).join('')}</tr></thead><tbody>
        ${P.map((p, i) => { const k = pkey(p), r = rowOf(sy, wk, st.cls, k, false), t = tally(r); return `<tr data-k="${esc(k)}"><td class="num">${i + 1}</td><td class="b" style="white-space:nowrap">${esc(nameOf(p))}</td>${Array.from({ length: 5 * n }, (_, j) => { const c = codeAt(r, j); return `<td class="ar-c${c ? ' c' + LET[c] : ''}" data-i="${j}" style="cursor:pointer;text-align:center;min-width:22px;${c === 'غ' ? 'background:#fecaca' : c === 'ب' ? 'background:#bbf7d0' : c === 'ت' ? 'background:#fde68a' : ''}${j % n === 0 ? ';border-right:2px solid #94a3b8' : ''}">${c}</td>`; }).join('')}<td class="num t-a">${t.a || ''}</td><td class="num t-j">${t.j || ''}</td><td class="num t-l">${t.l || ''}</td></tr>`; }).join('')}
        </tbody></table></div></div>` : `<div class="card" style="margin-top:10px"><div class="card-b muted">لا توجد لائحة تلاميذ. استورد لوائح التلاميذ (Massar) من «بطاقة التلاميذ» أولا.</div></div>`}`;
    const re = () => window.pageAbsReg(v);
    $('#arC', v).onchange = e => { st.cls = e.target.value; re(); };
    $('#arW', v).onchange = e => { st.wk = e.target.value; re(); };
    $('#arP', v).onclick = () => { st.wk = addDays(wk, -7); re(); };
    $('#arN', v).onclick = () => { st.wk = addDays(wk, 7); re(); };
    $('#arDoc', v).onclick = () => go('absregDoc', { sy, cls: st.cls, wk });
    $('#arVs', v).onclick = () => go('vschool');
    const tb = $('.ar-t tbody', v);
    if (tb) tb.onclick = e => {
      const td = e.target.closest('.ar-c'); if (!td) return;
      const tr0 = td.parentNode, k = tr0.dataset.k, i = +td.dataset.i;
      const cur = codeAt(rowOf(sy, wk, st.cls, k, false), i), nx = CODES[(CODES.indexOf(cur) + 1) % CODES.length];
      setCell(sy, wk, st.cls, k, i, nx); persist();
      const c = nx; td.textContent = c; td.style.background = c === 'غ' ? '#fecaca' : c === 'ب' ? '#bbf7d0' : c === 'ت' ? '#fde68a' : '';
      const t = tally(rowOf(sy, wk, st.cls, k, false)); tr0.querySelector('.t-a').textContent = t.a || ''; tr0.querySelector('.t-j').textContent = t.j || ''; tr0.querySelector('.t-l').textContent = t.l || '';
    };
  };

  /* ---------- documents ---------- */
  const monthsOf = sy => { const y = MK.syStart(sy); return [[y, 9], [y, 10], [y, 11], [y, 12], [y + 1, 1], [y + 1, 2], [y + 1, 3], [y + 1, 4], [y + 1, 5], [y + 1, 6]].map(([a, b]) => `${a}-${String(b).padStart(2, '0')}`); };
  const MN = ['', 'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  const ymName = ym => `${MN[+ym.slice(5)]} ${ym.slice(0, 4)}`;

  function sheetDoc(s, sy, cls, wk, filled) {
    const P = pupilsOf(sy, cls), n = SESS().length;
    const head = `<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">اسم التلميذ(ة)</th>${DAYS.map((d, i) => `<th colspan="${n}" class="d">${d}<br><span style="font-weight:400;font-size:7pt">${esc(MK.showDate(addDays(wk, i)).slice(0, 5))}</span></th>`).join('')}</tr><tr>${DAYS.map(() => SESS().map(x => `<th class="d" style="font-size:6.5pt;padding:0">${x}</th>`).join('')).join('')}</tr>`;
    const rows = (P.length ? P : Array.from({ length: 35 }, () => null)).map((p, i) => { const r = p && filled ? rowOf(sy, wk, cls, pkey(p), false) : null; return `<tr><td>${i + 1}</td><td class="r b" style="white-space:nowrap">${esc(p ? nameOf(p) : '')}</td>${Array.from({ length: 5 * n }, (_, j) => `<td style="${j % n === 0 ? 'border-right:1.4px solid #000;' : ''}width:${n > 2 ? 5.3 : 14}mm">${esc(codeAt(r, j))}</td>`).join('')}</tr>`; });
    return SB.pages(s, { title: 'ورقة ضبط الغياب بالشبكة', sub: `القسم: ${esc(cls || '..........')} — من ${esc(MK.showDate(wk))} إلى ${esc(MK.showDate(addDays(wk, 4)))} — الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4l',
      blocks: [{ table: { cls: 'sb-t cmp ar-sheet', head, rows } }, { html: '<div class="sb-note">الرموز: غ = غياب غير مبرر — ب = غياب مبرر — ت = تأخر.</div>' }], sign: SB.sign(s, { right: 'توقيع الأستاذ(ة)', left: 'توقيع الحارس العام / المدير' }) });
  }
  /* 1.9.4 — «ورقة الغياب» على نموذج مسار (لوحة التتبع اليومي للغياب): ثلاثة أيام في كل ورقة A4، حصص كل يوم، التلاميذ بترتيب لائحة مسار،
     عدد الذكور والإناث والمجموع، أيام العطل من «لائحة العطل» (خانة مظللة)، الغيابات المسجلة في السجل، وأستاذ(ة) القسم من الإسناد (الموظفون). */
  const teachersOf = (sy, cls) => {
    try {
      const R = window.Teach && Teach.rows ? Teach.rows(sy) : [];
      const k = MK.hkey(cls), out = [];
      R.forEach(r => { const t = String(r[2] || '').split(/[،,;؛\s+]+/).map(x => MK.hkey(x)).filter(Boolean); if (t.includes(k) || MK.hkey(r[2] || '').includes(k)) out.push(String(r[0]).trim()); });
      return Array.from(new Set(out));
    } catch (_) { return []; }
  };
  const holName = (sy, d) => { try { const L = window.Holidays && Holidays.forSy ? Holidays.forSy(sy) : []; const h = L.find(x => x.from && d >= x.from && d <= (x.to || x.from)); return h ? (h.name || h.label || h.t || 'عطلة') : ''; } catch (_) { return ''; } };
  function massarSheet(s, sy, cls, wk, filled, rowsMin) {
    const P = pupilsOf(sy, cls), S0 = SESS(), n = S0.length;
    const g = { m: P.filter(p => p.g !== 'F').length, f: P.filter(p => p.g === 'F').length };
    const T = teachersOf(sy, cls);
    const dmy = d => d.split('-').reverse().join('-');
    const syT = MK.syDash(sy);
    const pages = [];
    [[0, 1, 2], [3, 4]].forEach(days => {
      const dates = days.map(i => addDays(wk, i));
      const hol = dates.map(d => holName(sy, d));
      const lab = isSec() ? S0.map((x, i) => String((i % 4) + 1)) : S0.map(x => (x === 'صباحا' ? 'ص' : 'م'));
      const head = `<tr><th rowspan="2" class="d ms-n">ر.ت</th><th rowspan="2" class="d ms-c">رقم التلميذ</th><th rowspan="2" class="d ms-nm">الاسم والنسب</th>
        ${days.map((di, k) => `<th colspan="${n + 1}" class="d ms-day">${DAYS[di]} <span class="ms-dt">${esc(dmy(dates[k]))}</span></th>`).join('')}</tr>
        <tr>${days.map(() => `${lab.map((l, i) => `<th class="ms-s${isSec() && i === 4 ? ' ms-pm' : ''}">${l}</th>`).join('')}<th class="ms-v"><span>المتغيبون</span></th>`).join('')}</tr>`;
      const list = P.length ? P : Array.from({ length: rowsMin || 30 }, () => null);
      const cnt = days.map(() => Array.from({ length: n }, () => 0)), abs = days.map(() => 0);
      const body = list.map((p, i) => {
        const r = p && filled ? rowOf(sy, wk, cls, pkey(p), false) : null;
        return `<tr><td>${i + 1}</td><td class="ms-c" dir="ltr">${esc(p ? p.code || '' : '')}</td><td class="r ms-nm">${esc(p ? nameOf(p) : '')}</td>${days.map((di, k) => {
          if (hol[k]) return `<td colspan="${n + 1}" class="ms-hol"></td>`;
          let any = false;
          const cells = Array.from({ length: n }, (_, j) => { const c = codeAt(r, di * n + j); if (c === 'غ' || c === 'ب') { any = true; cnt[k][j]++; } return `<td class="${isSec() && j === 4 ? 'ms-pm' : ''}">${c}</td>`; }).join('');
          if (any) abs[k]++;
          return cells + `<td class="ms-v">${any ? '×' : ''}</td>`;
        }).join('')}</tr>`;
      }).join('');
      const foot = `<tr class="ms-f"><td colspan="3" class="b">عدد المتغيبين</td>${days.map((di, k) => hol[k] ? `<td colspan="${n + 1}" class="ms-hol">${esc(hol[k])}</td>` : cnt[k].map(x => `<td>${filled && P.length ? x || '' : ''}</td>`).join('') + `<td class="b">${filled && P.length ? abs[k] || '' : ''}</td>`).join('')}</tr>
        <tr class="ms-f"><td colspan="3" class="b">توقيع الأستاذ(ة)${T.length ? `<div class="ms-tn">${esc(T.join(' / '))}</div>` : ''}</td>${days.map((di, k) => `<td colspan="${n + 1}" class="${hol[k] ? 'ms-hol' : ''}" style="height:11mm"></td>`).join('')}</tr>`;
      pages.push(`<div class="ms-page${list.length > 44 ? ' ms-xdense' : list.length > 34 ? ' ms-dense' : ''}">
        <div class="ms-top">
          <div class="ms-hd">${Dx.header(s)}</div>
          <table class="ms-box"><tr><th colspan="3">السنة الدراسية : ${esc(syT)}</th></tr><tr><th>ذكور</th><th>إناث</th><th>المجموع</th></tr><tr><td>${P.length ? g.m : ''}</td><td>${P.length ? g.f : ''}</td><td>${P.length ? P.length : ''}</td></tr></table>
        </div>
        <div class="ms-ttl"><div class="ms-cls">القسم : <b dir="ltr">${esc(cls || '..........')}</b>${T.length ? ` &nbsp; الأستاذ(ة) : <b>${esc(T.join(' / '))}</b>` : ''}</div><div class="ms-name">ورقة الغياب</div><div class="ms-rng">من <b dir="ltr">${esc(dmy(dates[0]))}</b> إلى <b dir="ltr">${esc(dmy(dates[dates.length - 1]))}</b></div></div>
        <table class="ms-t">${head}${body}${foot}</table>
        <div class="ms-note">الرموز: غ = غياب غير مبرر — ب = غياب مبرر — ت = تأخر — × = تلميذ(ة) متغيب(ة) خلال اليوم.${isSec() ? ' الحصص: 1-4 صباحا، 1-4 مساء.' : ' ص = الفترة الصباحية، م = الفترة المسائية.'}</div>
      </div>`);
    });
    return pages;
  }
  function monthDoc(s, sy, cls, ym) {
    const M = monthStats(sy, cls, ym), rows = M.rows.map((o, i) => tr([i + 1, { t: nameOf(o.p), c: 'r b' }, o.a || '', o.j || '', o.a + o.j || '', o.days || '', o.l || '']));
    const tot = M.rows.reduce((x, o) => ({ a: x.a + o.a, j: x.j + o.j, l: x.l + o.l, d: x.d + o.days }), { a: 0, j: 0, l: 0, d: 0 });
    rows.push(tr([{ t: 'المجموع', s: 2, c: 'd b' }, tot.a, tot.j, tot.a + tot.j, tot.d, tot.l]));
    const hrs = M.openDays * M.sessions * M.rows.length, rate = hrs ? ((tot.a + tot.j) / hrs * 100).toFixed(2) + '%' : '';
    return SB.pages(s, { title: `إحصاء الغياب — ${ymName(ym)}`, sub: `القسم: ${esc(cls)} — الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4', blocks: [
      tbl(thr(['ر.ت', 'اسم التلميذ(ة)', 'حصص غير مبررة', 'حصص مبررة', 'مجموع الحصص', 'أيام الغياب', 'التأخرات'].map(t => ({ t, c: 'd' }))), rows, 'big'),
      { html: `<p class="sb-p">أيام الدراسة المسجلة: <b>${M.openDays}</b> — عدد التلاميذ: <b>${M.rows.length}</b> — نسبة الغياب: <b>${rate || '..........'}</b></p>` }], sign: SB.sign(s, { right: 'الأستاذ(ة) المكلف(ة)', left: 'الحارس العام / المدير' }) });
  }
  function cardDoc(s, sy, cls, only) {
    const P = pupilsOf(sy, cls).filter(p => !only || pkey(p) === only), months = monthsOf(sy), pages = [];
    P.forEach(p => {
      const rows = months.map(ym => { const m = monthStats(sy, cls, ym).rows.find(o => pkey(o.p) === pkey(p)) || { a: 0, j: 0, l: 0, days: 0 }; return tr([{ t: ymName(ym), c: 'k' }, m.a || '', m.j || '', m.a + m.j || '', m.days || '', m.l || '']); });
      const T = months.reduce((x, ym) => { const m = monthStats(sy, cls, ym).rows.find(o => pkey(o.p) === pkey(p)); return m ? { a: x.a + m.a, j: x.j + m.j, d: x.d + m.days, l: x.l + m.l } : x; }, { a: 0, j: 0, d: 0, l: 0 });
      rows.push(tr([{ t: 'المجموع', c: 'd b' }, T.a, T.j, T.a + T.j, T.d, T.l]));
      SB.pages(s, { title: 'بطاقة الغياب', sub: `${esc(nameOf(p))} — رمز مسار: ${esc(p.code || '')} — القسم: ${esc(cls)} — الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4', blocks: [tbl(thr(['الشهر', 'حصص غير مبررة', 'حصص مبررة', 'المجموع', 'أيام الغياب', 'التأخرات'].map(t => ({ t, c: 'd' }))), rows, 'big')], sign: SB.sign(s, { right: 'ولي الأمر (إطلاع)', left: 'الحارس العام / المدير' }) }).forEach((pg, i) => pages.push(pg));
    });
    return pages;
  }

  window.pageAbsRegDoc = function (v, arg) {
    migrate(DB); arg = arg || {};
    const sy0 = arg.sy || st.sy || MK.curSy(), cl = classes(sy0);
    MK.docPage(v, {
      title: 'سجل غياب التلاميذ', icon: '📋', modes: false, word: true, state: { kind: 'sheet', sy: sy0, cls: arg.cls || st.cls || cl[0] || '', wk: arg.wk || monday(), ym: (arg.wk || iso(new Date())).slice(0, 7), filled: '1', pupil: '' },
      back: () => go('absreg'),
      form: (box, s0, refresh) => {
        const draw = () => {
          const P = pupilsOf(s0.sy, s0.cls);
          box.innerHTML = `<div class="fld"><label>الوثيقة</label><select class="inp" id="aK"><option value="massar" ${s0.kind === 'massar' ? 'selected' : ''}>ورقة الغياب — لوحة التتبع اليومي (نموذج مسار)</option><option value="sheet" ${s0.kind === 'sheet' ? 'selected' : ''}>ورقة ضبط الغياب بالشبكة (أسبوع)</option><option value="month" ${s0.kind === 'month' ? 'selected' : ''}>إحصاء الغياب الشهري للقسم</option><option value="card" ${s0.kind === 'card' ? 'selected' : ''}>بطاقة الغياب (لكل تلميذ)</option></select></div>
            <div class="fld"><label>القسم</label><select class="inp" id="aC">${cl.map(c => `<option ${c === s0.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
            ${s0.kind === 'sheet' || s0.kind === 'massar' ? `<div class="fld"><label>الأسبوع (يبدأ يوم الإثنين)</label><input class="inp" type="date" id="aW" value="${s0.wk}"></div><div class="fld"><label>المحتوى</label><select class="inp" id="aF"><option value="1" ${s0.filled === '1' ? 'selected' : ''}>بالغيابات المسجلة</option><option value="0" ${s0.filled === '0' ? 'selected' : ''}>فارغة (للتعبئة اليدوية)</option></select></div>` : ''}
            ${s0.kind === 'month' ? `<div class="fld"><label>الشهر</label><select class="inp" id="aM">${monthsOf(s0.sy).map(m => `<option value="${m}" ${m === s0.ym ? 'selected' : ''}>${ymName(m)}</option>`).join('')}</select></div>` : ''}
            ${s0.kind === 'card' ? `<div class="fld"><label>التلميذ(ة)</label><select class="inp" id="aP"><option value="">كل تلاميذ القسم</option>${P.map(p => `<option value="${esc(pkey(p))}" ${pkey(p) === s0.pupil ? 'selected' : ''}>${esc(nameOf(p))}</option>`).join('')}</select></div>` : ''}`;
          const b = (id, k, rd) => { const el = $(id, box); if (el) el.onchange = e => { s0[k] = e.target.value; if (k === 'wk') s0.ym = s0.wk.slice(0, 7); if (rd) draw(); refresh(); }; };
          b('#aK', 'kind', true); b('#aC', 'cls', true); b('#aW', 'wk'); b('#aF', 'filled'); b('#aM', 'ym'); b('#aP', 'pupil');
        };
        draw();
      },
      build: s0 => {
        const sc = S();
        if (s0.kind === 'massar') return { page: 'a4', pages: massarSheet(sc, s0.sy, s0.cls, monday(s0.wk), s0.filled === '1') };
        if (s0.kind === 'month') return { page: 'a4', pages: monthDoc(sc, s0.sy, s0.cls, s0.ym) };
        if (s0.kind === 'card') return { page: 'a4', pages: cardDoc(sc, s0.sy, s0.cls, s0.pupil) };
        return { page: 'a4l', pages: sheetDoc(sc, s0.sy, s0.cls, monday(s0.wk), s0.filled === '1') };
      },
      fname: s0 => 'غياب_' + (s0.cls || '')
    });
  };
  Dx.modCss = (Dx.modCss || '') + `.ar-sheet td,.ar-sheet th{padding:.5mm .3mm;font-size:8pt;text-align:center}.ar-sheet tr{height:6.4mm}
  .ms-page{display:flex;flex-direction:column;height:100%;font-size:9pt}
  .ms-top{display:flex;align-items:flex-start;gap:3mm}.ms-hd{flex:1;zoom:.72}.ms-box{border-collapse:collapse;font-size:8.5pt;margin-top:1mm}.ms-box th,.ms-box td{border:1px solid #000;padding:.4mm 2.5mm;text-align:center}
  .ms-ttl{display:flex;align-items:center;justify-content:space-between;margin:1.5mm 0}.ms-name{border:2px solid #000;border-radius:2mm;padding:.6mm 10mm;font-weight:700;font-size:13pt}.ms-cls,.ms-rng{font-size:9.5pt}
  .ms-t{width:100%;border-collapse:collapse;table-layout:fixed}.ms-t th,.ms-t td{border:1px solid #000;padding:0 .3mm;text-align:center;font-size:7.6pt;height:5.2mm;overflow:hidden;white-space:nowrap}
  .ms-t th{background:#eef2f6}.ms-t .ms-n{width:6mm}.ms-t .ms-c{width:19mm;font-size:7pt}.ms-t .ms-nm{width:38mm;text-align:right}.ms-t .ms-day{font-size:8.5pt}.ms-dt{font-weight:400;font-size:7.2pt}
  .ms-t .ms-v{width:5mm;background:#f6f6f6}.ms-t th.ms-v span{display:inline-block;transform:rotate(-90deg);font-size:6.5pt;white-space:nowrap}.ms-t th.ms-v{height:14mm}
  .ms-t .ms-pm{border-right:2px solid #000}.ms-t .ms-hol{background:repeating-linear-gradient(45deg,#e9e9e9 0 2mm,#fff 2mm 4mm);font-weight:700;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ms-f td{height:7mm}.ms-tn{font-weight:400;font-size:7pt;white-space:normal}.ms-dense .ms-t td{height:4.1mm;font-size:7pt}.ms-xdense .ms-t td{height:3.5mm;font-size:6.6pt}.ms-note{font-size:7.5pt;margin-top:1mm;color:#333}`;
  /* 1.9.3 — pupils absent / late on a given date (read by the daily report): { abs, unj, just, late, classes } */
  function dayCount(sy, dateIso, unit) {
    const o = { abs: 0, unj: 0, just: 0, late: 0, classes: 0, pupils: 0 };
    migrate(DB);
    const yr = DB.absreg.years[sy]; if (!yr || !yr.weeks) return o;
    const W = yr.weeks[monday(dateIso)], d = (new Date(dateIso + 'T00:00:00Z').getUTCDay() + 6) % 7, n = SESS().length;
    if (!W || d > 4) return o;
    Object.keys(W).forEach(cls => {
      const PL = pupilsOf(sy, cls).filter(p => !unit || K.U.same(p.unit, unit));
      if (unit && !PL.length) return;
      o.classes++; o.pupils += PL.length;
      Object.values(W[cls] || {}).forEach(r => {
        let a = 0, j = 0, l = 0;
        for (let k = 0; k < n; k++) { const ch = (r || '')[d * n + k]; if (ch === 'A') a = 1; else if (ch === 'J') j = 1; else if (ch === 'L') l = 1; }
        if (a || j) o.abs++;
        if (a) o.unj++; else if (j) o.just++;
        if (l) o.late++;
      });
    });
    return o;
  }
  /* 1.9.3 — continuous absence of a pupil (read by «الحراسة العامة»): a day counts as absent when the pupil is marked غ / ب in at least `min` sessions
     of the day (default: half of the day's sessions). Consecutive school days are chained over week-ends and the school holidays of the year. */
  const dow0 = s => (new Date(s + 'T00:00:00Z').getUTCDay() + 6) % 7;          // Monday = 0 … Sunday = 6
  const holFn = sy => { let L = []; try { L = window.Holidays && Holidays.forSy ? Holidays.forSy(sy) : []; } catch (_) { L = []; } return d => L.some(h => h.from && d >= h.from && d <= (h.to || h.from)); };
  const nextSchoolDay = (d, isHol) => { let x = addDays(d, 1), g = 0; while ((dow0(x) > 4 || isHol(x)) && g++ < 80) x = addDays(x, 1); return x; };
  function spans(sy, cls, o) {
    o = o || {}; migrate(DB);
    const n = SESS().length, min = Math.max(1, +o.min || Math.ceil(n / 2)), asOf = o.asOf || iso(new Date()), isHol = holFn(sy);
    const W = Y(sy).weeks, wks = Object.keys(W).filter(w => W[w][cls]).sort();
    return pupilsOf(sy, cls).map((p, i) => {
      const k = pkey(p), days = [];
      wks.forEach(wk => {
        const r = (W[wk][cls] || {})[k]; if (!r) return;
        for (let d = 0; d < 5; d++) { let c = 0; for (let s = 0; s < n; s++) { const ch = r[d * n + s]; if (ch === 'A' || ch === 'J') c++; } if (c >= min) days.push(addDays(wk, d)); }
      });
      const streaks = [];
      days.forEach(d => { const t = streaks[streaks.length - 1]; if (t && nextSchoolDay(t.to, isHol) === d) { t.to = d; t.n++; } else streaks.push({ from: d, to: d, n: 1 }); });
      const last = streaks[streaks.length - 1] || null;
      const longest = streaks.reduce((a, b) => (!a || b.n > a.n ? b : a), null);
      return { p, no: i + 1, key: k, days, total: days.length, streaks, last, longest, ongoing: !!last && nextSchoolDay(last.to, isHol) >= asOf };
    });
  }
  // pupils with a mark on one date: { p, cls, no, a, j, l, firstLate, firstAbs }
  function dayList(sy, dateIso) {
    migrate(DB);
    const out = [], yr = DB.absreg.years[sy]; if (!yr || !yr.weeks) return out;
    const W = yr.weeks[monday(dateIso)], d = dow0(dateIso), n = SESS().length;
    if (!W || d > 4) return out;
    Object.keys(W).sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true })).forEach(cls => {
      pupilsOf(sy, cls).forEach((p, i) => {
        const r = (W[cls] || {})[pkey(p)]; if (!r) return;
        let a = 0, j = 0, l = 0, fl = -1, fa = -1;
        for (let k = 0; k < n; k++) { const ch = r[d * n + k]; if (ch === 'A') { a++; if (fa < 0) fa = k; } else if (ch === 'J') { j++; if (fa < 0) fa = k; } else if (ch === 'L') { l++; if (fl < 0) fl = k; } }
        if (a || j || l) out.push({ p, cls, no: i + 1, a, j, l, firstLate: fl, firstAbs: fa });
      });
    });
    return out;
  }
  // start time of a session of the day («8-9» -> 8:00, «2-3» -> 14:00, primary: morning 8:30 / afternoon 13:30)
  const sessStart = i => { const L = SESS()[i]; if (!L) return ''; if (!isSec()) return i === 0 ? '8:30' : '13:30'; const h = parseInt(L, 10); return (h < 8 ? h + 12 : h) + ':00'; };
  window.AbsReg = { migrate, monthStats, tally, classes, pupilsOf, dayCount, spans, dayList, sessStart, pkey, monday, addDays, nextSchoolDay: (d, sy) => nextSchoolDay(d, holFn(sy || MK.curSy())), sessions: SESS, isHol: (d, sy) => holFn(sy || MK.curSy())(d), isSec };
})();
