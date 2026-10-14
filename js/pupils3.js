'use strict';
/* 1.9.4 — بطاقة التلاميذ ← «البنية التربوية»: صورة كاملة ومترابطة للمؤسسة (الابتدائي):
   مجموع التلاميذ / التعليم الأولي / التعليم الابتدائي بالألوان، ثم الوحدات المدرسية برمز GRESA الخاص بكل وحدة، ثم الأقسام والمستويات،
   مع ربط كل قسم بالأستاذ(ة) المسند(ة) إليه (توزيع الأساتذة / لائحة الموظفين) أو بالمربي(ة) (مربو التعليم الأولي)،
   ولوحة مراقبة جودة المعطيات (تلاميذ دون وحدة، وحدات دون رمز GRESA، أقسام دون أستاذ(ة)، أطر دون وحدة...) ووثيقة «البنية التربوية للمؤسسة».
   The data are the pupils card (Massar lists), the units of the settings (name + GRESA), the teachers' assignment (Teach),
   the employees and the pre-school educators (Presch). Nothing is stored here: everything is computed. */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const X = () => window.Pupils.X;
  const LV = () => K.LV;
  const SEC = () => !!(window.Cyc && Cyc.single());
  const COLS = { all: '#0e5a4a', pre: '#d35400', pri: '#1f5fa8' };
  const LIGHT = { all: '#e8f4ef', pre: '#fff1e3', pri: '#e8f0fb' };
  const fullN = e => (Dx.fullName ? Dx.fullName(e) : [e.firstAr, e.lastAr].filter(Boolean).join(' '));
  const keyCls = c => String(c || '').toUpperCase().replace(/\s+/g, '').replace(/[\/\\_.]/g, '-');
  const digitsOf = s => (String(s || '').match(/\d/g) || []);
  const stOf = l => X().stageOf(l);

  /* ---------- the model ---------- */
  function model(sy, stage) {
    const x = X(), y = x.Y(sy), cur = x.current(sy), inSt = p => !stage || stOf(p.lvl) === stage;
    const reg = window.Units ? Units.list() : [];
    const names = reg.map(u => u.name);
    cur.forEach(p => { if (p.unit && !names.some(n => K.U.same(n, p.unit))) names.push(p.unit); });
    // teachers: the assignment of «توزيع الأساتذة» first, else the employees (unit + levels of their card)
    const asg = window.Teach && Teach.rows ? Teach.rows(sy) : [];
    const teachers = (K.E.teachers() || []).map(e => {
      const r = asg.find(a => nm(a[0]) === nm(fullN(e)));
      return { e, name: fullN(e), unit: nm(r ? r[1] : '') || (window.Teach && Teach.unitOfEmp ? Teach.unitOfEmp(e) : nm(e.unit)), cls: nm(r ? r[2] : '') || nm(e.levels), src: r ? 'asg' : 'emp' };
    });
    asg.forEach(r => { if (!teachers.some(t => nm(t.name) === nm(r[0]))) teachers.push({ e: null, name: nm(r[0]), unit: nm(r[1]), cls: nm(r[2]), src: 'asg' }); });
    const eds = window.Presch ? Presch.eds() : [];
    const matchCls = (txt, c, lvls) => {
      const t = String(txt || ''); if (!t) return false;
      const parts = t.split(/[،,;+\s]+/).map(keyCls).filter(Boolean);
      if (parts.includes(keyCls(c))) return true;
      // «المستوى 2» / «2 و 3» / «الثاني»: the class goes with its level
      const d = (lvls || []).map(l => String(l).replace(/\D/g, '')).filter(Boolean);
      const td = digitsOf(t.replace(/\d+\s*[-\/]\s*\d+/g, m => m.split(/[-\/]/)[0]));
      return !!d.length && d.every(k => td.includes(k)) && !parts.some(p => /\d+-\d+/.test(p));
    };
    const units = names.map(n => {
      const u = reg.find(r => K.U.same(r.name, n)) || null;
      const P = cur.filter(p => K.U.same(p.unit, n));
      const PS = P.filter(inSt);
      const clsNames = Array.from(new Set(PS.map(p => p.cls).filter(Boolean))).sort((a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true }));
      const T = teachers.filter(t => t.unit && K.U.same(t.unit, n)), E = eds.filter(e => e.unit && K.U.same(e.unit, n));
      const classes = clsNames.map(c => {
        const L = PS.filter(p => p.cls === c), lvls = LV().sort(Array.from(new Set(L.map(p => p.lvl).filter(Boolean))));
        const pre = lvls.length && lvls.every(l => stOf(l) === 'pre');
        const list = y.lists.find(l => l.cls === c && K.U.same(l.unit, n));
        let staff = [];
        if (pre) { staff = E.filter(e => matchCls(e.levels, c, lvls)); if (!staff.length && E.length === 1) staff = E; staff = staff.map(e => ({ name: fullN(e), kind: 'ed', org: e.org || '' })); }
        else { staff = T.filter(t => matchCls(t.cls, c, lvls)).map(t => ({ name: t.name, kind: 't', src: t.src })); }
        const cc = X().cnt(L);
        return { cls: c, lvls, pre, list, staff, m: cc.m, f: cc.f, t: cc.t };
      });
      const c0 = X().cnt(PS), cPre = X().cnt(P.filter(p => stOf(p.lvl) === 'pre')), cPri = X().cnt(P.filter(p => stOf(p.lvl) !== 'pre'));
      return { name: n, gresa: u ? u.gresa : '', reg: !!u, P, c: c0, cPre, cPri, classes, T, E: E.map(e => ({ name: fullN(e), org: e.org || '', levels: e.levels || '' })) };
    }).filter(u => u.reg || u.P.length);
    // levels × units
    const lv = LV().sort(Array.from(new Set(cur.filter(inSt).map(p => p.lvl).filter(Boolean))));
    const tot = { all: X().cnt(cur), pre: X().cnt(cur.filter(p => stOf(p.lvl) === 'pre')), pri: X().cnt(cur.filter(p => stOf(p.lvl) !== 'pre')) };
    const ncls = st => new Set(cur.filter(p => !st || (st === 'pre' ? stOf(p.lvl) === 'pre' : stOf(p.lvl) !== 'pre')).map(p => p.unit + '|' + p.cls)).size;
    // checks of the data
    const issues = [];
    const add = (lvl, t, n, act) => { if (n) issues.push({ lvl, t, n, act }); };
    add('err', 'تلاميذ دون وحدة مدرسية', cur.filter(p => !p.unit).length, 'classes');
    add('err', 'وحدات في لوائح التلاميذ غير مسجلة في الإعدادات', units.filter(u => !u.reg).length, 'classes');
    if (!SEC()) add('warn', 'وحدات مدرسية دون رمز GRESA', units.filter(u => u.reg && !u.gresa).length, 'settings');
    add('warn', 'أقسام الابتدائي دون أستاذ(ة) مسند(ة)', units.reduce((a, u) => a + u.classes.filter(c => !c.pre && !c.staff.length).length, 0), 'teach');
    add('warn', 'أقسام التعليم الأولي دون مرب(ية)', units.reduce((a, u) => a + u.classes.filter(c => c.pre && !c.staff.length).length, 0), 'presch');
    add('warn', 'أساتذة دون وحدة مدرسية', teachers.filter(t => !t.unit).length, 'teach');
    add('warn', 'مربون دون وحدة مدرسية', eds.filter(e => !e.unit).length, 'presch');
    add('info', 'تلاميذ مستوى غير محدد', cur.filter(p => !p.lvl).length, 'list');
    return { units, lv, tot, ncls, issues, teachers, eds, cur, inSt };
  }

  /* ---------- the tab ---------- */
  const big = (k, title, c, ncl, icon, nu) => `<button class="ps3-big ps3-${k} ${(X().stage || '') === (k === 'all' ? '' : k) ? 'on' : ''}" data-st3="${k === 'all' ? '' : k}" style="--c:${COLS[k]};--l:${LIGHT[k]}">
      <div class="i">${icon}</div><div class="b"><div class="t">${title}</div><div class="n">${c.t}</div><div class="s">ذكور ${c.m} — إناث ${c.f}${c.t ? ` (${Math.round(c.f * 1000 / c.t) / 10}%)` : ''}</div><div class="s">${ncl} قسم${nu != null ? ` — ${nu} وحدة` : ''}</div></div>${(X().stage || '') === (k === 'all' ? '' : k) ? '<span class="ck">✔</span>' : ''}</button>`;
  const pill = l => { const p = stOf(l) === 'pre'; return `<span class="ps3-pill" style="background:${p ? LIGHT.pre : LIGHT.pri};color:${p ? COLS.pre : COLS.pri}">${esc(LV().sh(l))}</span>`; };
  function tab(b, sy) {
    const st = X().stage || '', M = model(sy, st), x = X();
    const showPre = !SEC() && M.tot.pre.t > 0;
    b.innerHTML = `
      <div class="ps3-bigs">${big('all', 'مجموع التلاميذ', M.tot.all, M.ncls(''), '📊', M.units.length)}${showPre || !SEC() ? big('pre', 'تلاميذ التعليم الأولي', M.tot.pre, M.ncls('pre'), '🧸') : ''}${big('pri', 'تلاميذ ' + (x.ST.pri.t || 'التعليم الابتدائي'), M.tot.pri, M.ncls('pri'), '🎒')}</div>
      ${M.issues.length ? `<div class="card ps3-q"><div class="card-h"><h3>🛡️ مراقبة جودة المعطيات</h3><span class="muted" style="font-size:12px">لتكون كل الإحصائيات والوثائق صحيحة</span></div><div class="card-b">${M.issues.map(i => `<div class="ps3-qi ${i.lvl}"><b>${i.n}</b> ${esc(i.t)}<button class="btn sm" data-fix="${i.act}">${i.act === 'settings' ? 'الإعدادات' : i.act === 'teach' ? 'توزيع الأساتذة' : i.act === 'presch' ? 'مربو التعليم الأولي' : i.act === 'list' ? 'لائحة التلاميذ' : 'الوحدات والأقسام'}</button></div>`).join('')}</div></div>`
        : '<div class="card ps3-q ok"><div class="card-b">✅ المعطيات مترابطة: كل التلاميذ في وحدات مسجلة، لكل وحدة رمز GRESA، ولكل قسم أستاذ(ة) أو مرب(ية).</div></div>'}
      <div class="ps3-tb"><button class="btn sm pri" id="ps3Prn">${ic('print')} طباعة «البنية التربوية للمؤسسة»</button><span class="muted" style="font-size:12px">الألوان: <b style="color:${COLS.pre}">التعليم الأولي</b> — <b style="color:${COLS.pri}">${esc(x.ST.pri.t)}</b></span></div>
      ${M.units.map(u => unitCard(u, st)).join('') || '<div class="empty-state">لا توجد وحدات مدرسية ولا لوائح تلاميذ بعد.</div>'}
      ${M.lv.length && M.units.length > 1 ? levelsCard(M) : ''}`;
    $$('[data-st3]', b).forEach(x2 => x2.onclick = () => { K.ST.cur = x2.dataset.st3; go('pupils', { tab: 'struct' }); });
    $$('[data-fix]', b).forEach(x2 => x2.onclick = () => { const a = x2.dataset.fix; if (a === 'settings') go('settings'); else if (a === 'teach') go('teach'); else if (a === 'presch') go('presch'); else go('pupils', { tab: a === 'list' ? 'list' : 'classes' }); });
    $('#ps3Prn', b).onclick = () => go('pupilDoc', { kind: 'struct', stage: st });
    $$('[data-ucls]', b).forEach(x2 => x2.onclick = () => { x.flt.unit = x2.dataset.u; x.flt.cls = x2.dataset.ucls; go('pupils', { tab: 'list' }); });
  }
  function unitCard(u, st) {
    const c = u.c, staffT = u.T, staffE = u.E;
    return `<div class="card ps3-u"><div class="ps3-uh"><div><div class="ps3-un">🏫 ${esc(u.name)}</div>
        <div class="ps3-ug">${SEC() ? '' : u.gresa ? `رمز GRESA: <b dir="ltr">${esc(u.gresa)}</b>` : `<span class="ps3-miss">رمز GRESA غير مسجل — أضفه في الإعدادات</span>`}${u.reg ? '' : ' <span class="ps3-miss">وحدة غير مسجلة في الإعدادات</span>'}</div></div>
        <div class="ps3-uk"><span><b>${c.t}</b> تلميذ(ة)</span><span>إناث <b>${c.f}</b></span>${!SEC() && u.cPre.t ? `<span style="color:${COLS.pre}">الأولي <b>${u.cPre.t}</b></span>` : ''}<span style="color:${COLS.pri}">${esc(X().ST.pri.t.replace('التعليم ', ''))} <b>${u.cPri.t}</b></span><span>الأقسام <b>${u.classes.length}</b></span><span>الأساتذة <b>${staffT.length}</b></span>${staffE.length ? `<span>المربون <b>${staffE.length}</b></span>` : ''}</div></div>
      ${u.classes.length ? `<div style="overflow:auto"><table class="tbl compact ps3-t"><thead><tr><th>القسم</th><th>المستوى / المستويات</th><th>السلك</th><th>ذكور</th><th>إناث</th><th>المجموع</th><th>الأستاذ(ة) / المربي(ة)</th><th></th></tr></thead><tbody>
        ${u.classes.map(k => `<tr class="${k.pre ? 'pre' : 'pri'}"><td dir="ltr" style="text-align:right"><b>${esc(k.cls)}</b></td><td>${k.lvls.map(pill).join(' ')}</td><td><span class="ps3-dot" style="background:${k.pre ? COLS.pre : COLS.pri}"></span>${k.pre ? 'التعليم الأولي' : esc(X().ST.pri.t)}</td><td class="num">${k.m}</td><td class="num">${k.f}</td><td class="num"><b>${k.t}</b></td>
          <td>${k.staff.length ? k.staff.map(sx => `${esc(sx.name)}${sx.kind === 'ed' && sx.org ? ` <small class="muted">(${esc(sx.org.replace('المؤسسة المغربية للنهوض بالتعليم الأولي', 'FMPS'))})</small>` : ''}`).join('، ') : `<span class="ps3-miss">${k.pre ? 'لا مرب(ية)' : 'غير مسند'}</span>`}</td>
          <td><button class="btn sm" data-u="${esc(u.name)}" data-ucls="${esc(k.cls)}" title="لائحة تلاميذ القسم">👁</button></td></tr>`).join('')}
        <tr class="att-tot"><td colspan="3">المجموع</td><td class="num">${c.m}</td><td class="num">${c.f}</td><td class="num">${c.t}</td><td colspan="2"></td></tr></tbody></table></div>` : '<div class="muted" style="padding:8px 14px">لا توجد أقسام لهذه الوحدة في هذا الاختيار.</div>'}
      ${staffT.length || staffE.length ? `<div class="ps3-staff">${staffT.length ? `<div><b>هيئة التدريس:</b> ${staffT.map(t => `<span class="ps3-chip">${esc(t.name)}${t.cls ? ` <small>${esc(t.cls)}</small>` : ''}</span>`).join('')}</div>` : ''}${staffE.length ? `<div><b>مربو التعليم الأولي:</b> ${staffE.map(e => `<span class="ps3-chip pre">${esc(e.name)}${e.levels ? ` <small>${esc(e.levels)}</small>` : ''}</span>`).join('')}</div>` : ''}</div>` : ''}</div>`;
  }
  function levelsCard(M) {
    const U = M.units.filter(u => u.classes.length);
    const cell = (u, l) => X().cnt(u.P.filter(p => p.lvl === l));
    return `<div class="card"><div class="card-h"><h3>المستويات حسب الوحدات المدرسية</h3></div><div class="card-b" style="overflow:auto"><table class="tbl compact ps3-t"><thead><tr><th>المستوى</th>${U.map(u => `<th>${esc(u.name)}${u.gresa ? `<br><small dir="ltr">${esc(u.gresa)}</small>` : ''}</th>`).join('')}<th>المجموع</th><th>منهم إناث</th></tr></thead><tbody>
      ${M.lv.map(l => { const T = X().cnt(M.cur.filter(p => p.lvl === l)); return `<tr class="${stOf(l) === 'pre' ? 'pre' : 'pri'}"><td>${pill(l)}</td>${U.map(u => { const c = cell(u, l); return `<td class="num">${c.t || ''}</td>`; }).join('')}<td class="num"><b>${T.t}</b></td><td class="num">${T.f}</td></tr>`; }).join('')}
      <tr class="att-tot"><td>المجموع</td>${U.map(u => `<td class="num">${u.c.t}</td>`).join('')}<td class="num">${M.cur.filter(M.inSt).length}</td><td class="num">${M.cur.filter(M.inSt).filter(p => p.g === 'F').length}</td></tr></tbody></table></div></div>`;
  }

  /* ---------- the printed document ---------- */
  function doc(s, sy, o) {
    const st = o.stage || '', M = model(sy, st), x = X();
    const blocks = [];
    const kv = (a, b2, c) => `<td style="background:${c};-webkit-print-color-adjust:exact;print-color-adjust:exact"><b>${a}</b><br><span style="font-size:15pt;font-weight:700">${b2}</span></td>`;
    blocks.push({ html: `<table class="tbl sb-t ps3-kt"><tbody><tr>${kv('مجموع التلاميذ', `${M.tot.all.t} <small>(إ ${M.tot.all.f})</small>`, LIGHT.all)}${!SEC() ? kv('التعليم الأولي', `${M.tot.pre.t} <small>(إ ${M.tot.pre.f})</small>`, LIGHT.pre) : ''}${kv(esc(x.ST.pri.t), `${M.tot.pri.t} <small>(إ ${M.tot.pri.f})</small>`, LIGHT.pri)}${kv('الوحدات المدرسية', M.units.length, '#f3f3f3')}${kv('الأقسام', M.ncls(st), '#f3f3f3')}</tr></tbody></table>` });
    M.units.forEach(u => {
      blocks.push({ before: `<div class="sb-cap r" style="margin-top:3mm">🏫 ${esc(u.name)}${SEC() ? '' : ` — رمز GRESA: <bdi dir="ltr">${esc(u.gresa || '……')}</bdi>`} — ${u.c.t} تلميذ(ة) (إناث ${u.c.f})${u.cPre.t && !SEC() ? ` — الأولي ${u.cPre.t}` : ''}</div>`, keepNext: true,
        table: { cls: 'sb-t cmp', head: K.thr(['القسم', 'المستوى / المستويات', 'السلك', 'ذكور', 'إناث', 'المجموع', 'الأستاذ(ة) / المربي(ة)'].map(t => ({ t, c: 'd' }))),
          rows: u.classes.map(k => `<tr><td class="b" dir="ltr">${esc(k.cls)}</td><td>${esc(k.lvls.map(l => LV().sh(l)).join(' + '))}</td><td style="color:${k.pre ? COLS.pre : COLS.pri};font-weight:700">${k.pre ? 'الأولي' : 'الابتدائي'}</td><td>${k.m}</td><td>${k.f}</td><td class="b">${k.t}</td><td class="r sm">${esc(k.staff.map(sx => sx.name).join('، ')) || '—'}</td></tr>`)
            .concat([`<tr class="tot"><td colspan="3">المجموع</td><td>${u.c.m}</td><td>${u.c.f}</td><td>${u.c.t}</td><td class="r sm">${u.T.length} أستاذ(ة)${u.E.length ? ` — ${u.E.length} مرب(ية)` : ''}</td></tr>`]) }, minRows: 1 });
    });
    if (M.lv.length && M.units.length > 1) {
      const U = M.units.filter(u => u.classes.length);
      blocks.push({ before: '<div class="sb-cap r" style="margin-top:3mm">المستويات حسب الوحدات المدرسية</div>', keepNext: true,
        table: { cls: 'sb-t cmp', head: K.thr(['المستوى'].concat(U.map(u => u.name + (u.gresa ? ' (' + u.gresa + ')' : '')), ['المجموع', 'إناث']).map(t => ({ t, c: 'd' }))),
          rows: M.lv.map(l => { const T = X().cnt(M.cur.filter(p => p.lvl === l)); return `<tr><td class="b" style="color:${stOf(l) === 'pre' ? COLS.pre : COLS.pri}">${esc(LV().sh(l))}</td>${U.map(u => `<td>${X().cnt(u.P.filter(p => p.lvl === l)).t || ''}</td>`).join('')}<td class="b">${T.t}</td><td>${T.f}</td></tr>`; }) }, minRows: 1 });
    }
    return { title: 'البنية التربوية للمؤسسة' + (st === 'pre' ? ' — التعليم الأولي' : st === 'pri' ? ' — ' + x.ST.pri.t : ''), sub: `الموسم الدراسي ${esc(sy)} — الوحدات المدرسية ورموز GRESA، الأقسام والمستويات والأطر`, page: 'a4', blocks };
  }
  Dx.modCss += `.ps3-kt td{text-align:center;padding:2mm;border:1px solid #9bb}`;
  const css = document.createElement('style');
  css.textContent = `
  .ps3-bigs{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px;margin-bottom:12px}
  .ps3-big{position:relative;display:flex;gap:12px;align-items:center;text-align:right;padding:14px 16px;border-radius:14px;border:2px solid var(--c);background:var(--l);cursor:pointer;font-family:inherit;color:#223;transition:.15s}
  .ps3-big .i{font-size:34px}.ps3-big .t{font-weight:800;color:var(--c);font-size:14.5px}.ps3-big .n{font-size:30px;font-weight:800;color:var(--c);line-height:1.1}.ps3-big .s{font-size:12px;color:#445}
  .ps3-big.on{background:var(--c);color:#fff;box-shadow:0 6px 16px rgba(0,0,0,.2)}.ps3-big.on .t,.ps3-big.on .n,.ps3-big.on .s{color:#fff}
  .ps3-big .ck{position:absolute;top:-9px;left:-9px;background:#fff;color:var(--c);border:2px solid var(--c);border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:13px}
  .ps3-q{margin-bottom:12px;border-right:5px solid #d68910}.ps3-q.ok{border-right-color:#1e8449}.ps3-qi{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:8px;margin-bottom:4px;font-size:13px}
  .ps3-qi.err{background:#fdecea}.ps3-qi.err b{color:#c0392b}.ps3-qi.warn{background:#fff6e0}.ps3-qi.warn b{color:#b9770e}.ps3-qi.info{background:#eef4fb}.ps3-qi .btn{margin-right:auto}
  .ps3-tb{display:flex;align-items:center;gap:12px;margin:0 0 10px}
  .ps3-u{margin-bottom:12px;overflow:hidden}.ps3-uh{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;background:#f6f9f8;border-bottom:1px solid var(--line,#e3e8e6)}
  .ps3-un{font-weight:800;font-size:16px}.ps3-ug{font-size:12.5px;color:#445;margin-top:2px}.ps3-uk{display:flex;gap:12px;flex-wrap:wrap;font-size:13px}.ps3-uk b{font-size:15px}
  .ps3-miss{color:#c0392b;font-weight:700;font-size:12px}.ps3-pill{display:inline-block;border-radius:10px;padding:1px 8px;font-size:12px;font-weight:700;margin:1px}
  .ps3-dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-left:5px;vertical-align:middle}
  .ps3-t tr.pre td:first-child{border-right:4px solid ${COLS.pre}}.ps3-t tr.pri td:first-child{border-right:4px solid ${COLS.pri}}
  .ps3-staff{padding:8px 14px;font-size:12.5px;line-height:2;border-top:1px dashed var(--line,#e3e8e6)}.ps3-chip{display:inline-block;background:${LIGHT.pri};border-radius:12px;padding:0 9px;margin:0 3px 3px 0}.ps3-chip.pre{background:${LIGHT.pre}}.ps3-chip small{color:#667}`;
  document.head.appendChild(css);
  window.Pupils3 = { tab, model, doc };
})();
