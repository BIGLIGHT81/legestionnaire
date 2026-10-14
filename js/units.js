'use strict';
/* 1.9.3 — سجل الوحدات المدرسية ورمز GRESA لكل وحدة.
   يعتمد على لائحة الوحدات المشتركة DB.board.units (التي تستعملها السبورة المرجعية والمجالس)، ويُستعمل في:
   مركز الامتحان (اختيار أي وحدة مدرسية مع رمزها)، استيراد معطيات الموظفين من منظومة Esise (ربط ملف XML بالوحدة برمز GRESA)،
   وبطاقة التعريف بالمؤسسة. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const nh = s => MK.hkey(s);
  const clean = v => String(v == null ? '' : v).trim();
  const normCode = v => clean(v).toUpperCase().replace(/\s+/g, '');

  function reg() {
    if (window.Board && Board.migrate) Board.migrate(DB); else { DB.board = DB.board || {}; DB.board.units = Array.isArray(DB.board.units) ? DB.board.units : []; }
    return DB.board.units;
  }
  // the units of the school: the shared registry, else the names known by the application
  function list() {
    if (isSec()) normSec();
    const r = reg();
    const out = r.map(u => ({ name: clean(u.name), gresa: normCode(u.gresa), id: u.id })).filter(u => u.name);
    if (!out.length) K.U.names().forEach(n => out.push({ name: n, gresa: '' }));
    // 1.9.3: the main unit keeps the GRESA code of the institution when no code was typed for it
    const g0 = normCode(S().gresa);
    if (g0 && out.length && !out.some(u => u.gresa === g0)) { const c = out.find(u => /مركزي/.test(u.name) && !u.gresa) || (out.length === 1 ? out[0] : null); if (c) c.gresa = g0; }
    return out;
  }
  const names = () => list().map(u => u.name);
  const gresaOf = name => { const u = list().find(x => K.U.same(x.name, name) || nh(x.name) === nh(name)); return u ? u.gresa : ''; };
  const byGresa = code => { const c = normCode(code); if (!c) return null; return list().find(u => u.gresa === c) || null; };
  function ensure(name) {
    name = clean(name); if (!name) return null;
    let r = reg();
    if (!r.length) { K.U.names().forEach(n => r.push({ id: uid('bu'), name: n, gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' })); r = reg(); }
    let u = r.find(x => K.U.same(x.name, name) || nh(x.name) === nh(name)) || r.find(x => K.U.canon(name) === x.name);
    // 1.9.4: the units of the settings are fixed: an import never adds a unit
    if (!u && r.length && reg().some(x => clean(x.name))) return null;
    if (!u) { u = { id: uid('bu'), name, gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' }; r.push(u); }
    return u;
  }
  function set(name, gresa) { const u = ensure(name); if (!u) return null; u.gresa = normCode(gresa); persist(); return u; }
  // exam centre / document choices: the school itself (main code) then each unit
  const centerOptions = () => {
    const s = S(), out = [['', isSec() ? '— اختيار المركز —' : '— اختيار من الوحدات المدرسية —']];
    if (!isSec()) list().forEach(u => out.push([u.name, u.name + (u.gresa ? ' (' + u.gresa + ')' : '')]));
    if (s.school) out.push(['__school', s.school + (s.gresa ? ' (' + normCode(s.gresa) + ')' : '')]);
    return out;
  };
  const centerOf = key => {
    const s = S();
    if (key === '__school') return { name: s.school || '', code: normCode(s.gresa) };
    const u = list().find(x => x.name === key); if (!u) return null;
    const short = String(u.name).replace(/^(مركزية|وحدة|فرعية)\s*/, '');
    const full = /^(مركزية|وحدة|فرعية)/.test(u.name) ? u.name : 'وحدة ' + short;
    return { name: `${s.school || ''} — ${full}`.replace(/^ — /, ''), code: u.gresa || '' };
  };

  /* ---------- settings card ---------- */
  function card(box) {
    if (isSec()) { box.innerHTML = ''; box.style.display = 'none'; return; }     // one institution: its name and GRESA code are in «معطيات المؤسسة»
    box.style.display = '';
    const draw = () => {
      const L = reg().length ? reg() : list();
      box.innerHTML = `<div class="card-h"><h3>الوحدات المدرسية ورموز GRESA</h3></div><div class="card-b">
        <p class="muted" style="margin:0 0 8px;font-size:12.5px;line-height:1.7">لكل وحدة مدرسية (المركزية والفرعيات) رمز GRESA الخاص بها. تُستعمل الرموز في اختيار مركز الامتحان، وفي ربط ملفات Esise المستوردة (XML) بالوحدة المناسبة، وفي بطاقة التعريف بالمؤسسة.</p>
        <div id="unRows">${L.length ? L.map((u, i) => `<div class="btn-row" style="margin-bottom:6px;flex-wrap:nowrap"><input class="inp" data-un="${i}" data-f="name" value="${esc(u.name)}" placeholder="اسم الوحدة (مثال: مركزية سيدي بلقاسم)" style="flex:1.6"><input class="inp" data-un="${i}" data-f="gresa" value="${esc(u.gresa || '')}" placeholder="GRESA" dir="ltr" style="flex:.7;min-width:92px;text-transform:uppercase"><button class="btn sm danger icon" data-undel="${i}" title="حذف">✕</button></div>`).join('') : '<div class="muted" style="font-size:12.5px">لا توجد وحدات بعد: أضف الوحدة المركزية والفرعيات.</div>'}</div>
        <div class="btn-row" style="margin-top:6px"><button class="btn sm" id="unAdd">${ic('plus')} إضافة وحدة</button><button class="btn sm" id="unSync">${ic('hist')} جلب الوحدات من بطاقة التلاميذ</button></div></div>`;
      const R = () => { reg(); if (!DB.board.units.length) list().forEach(u => ensure(u.name)); return DB.board.units; };
      box.querySelectorAll('[data-un]').forEach(el => el.onchange = () => {
        const r = R(), i = +el.dataset.un; if (!r[i]) return;
        const was = clean(r[i].name);
        r[i][el.dataset.f] = el.dataset.f === 'gresa' ? normCode(el.value) : clean(el.value);
        // 1.9.4: a unit renamed here follows in the pupils' lists (same name everywhere)
        if (el.dataset.f === 'name' && was && r[i].name && was !== r[i].name && window.Pupils && Pupils.renameUnit) { try { Pupils.renameUnit(was, r[i].name); } catch (e) {} }
        if (el.dataset.f === 'gresa') el.value = r[i].gresa;
        persist();
      });
      box.querySelectorAll('[data-undel]').forEach(b => b.onclick = async () => {
        const r = R(), i = +b.dataset.undel; if (!r[i]) return;
        if (!await confirmBox(`حذف الوحدة <b>${esc(r[i].name)}</b> من السجل؟`, 'حذف')) return;
        r.splice(i, 1); persist(); draw();
      });
      box.querySelector('#unAdd').onclick = () => { R().push({ id: uid('bu'), name: '', gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' }); draw(); const ins = box.querySelectorAll('[data-f=name]'); if (ins.length) ins[ins.length - 1].focus(); };
      box.querySelector('#unSync').onclick = () => { const r = R(); let n = 0; K.U.names().forEach(x => { if (!r.some(u => K.U.same(u.name, x))) { r.push({ id: uid('bu'), name: x, gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' }); n++; } }); persist(); draw(); toast(n ? `أضيفت ${n} وحدة` : 'كل الوحدات موجودة'); };
    };
    draw();
  }

  /* ---------- collège / lycée: the school is one independent institution ----------
     Its only «unit» is the school itself (name + its own GRESA code): the shared registry, the employees and the certificates are aligned on it,
     so that no document or list ever speaks of school units or of a «central» school (a primary-school-group notion). */
  const isSec = () => !!(window.Cyc && Cyc.single());      // «no school units» (collège / lycée / independent primary school)
  const secName = () => clean(S().school) || 'المؤسسة';
  function normSec() {
    try {
      if (!isSec() || typeof DB === "undefined" || !DB) return false;
      const n = secName(), g = normCode(S().gresa);
      let ch = false;
      const b = DB.board = DB.board || {}; b.units = Array.isArray(b.units) ? b.units : [];
      const u0 = b.units[0];
      if (b.units.length !== 1 || u0.name !== n || (g && u0.gresa !== g)) {
        const u = Object.assign({ id: uid('bu'), gresa: '', created: '', opened: '', area: '', distance: '', rooms: '' }, u0 || {});
        u.name = n; if (g) u.gresa = g; b.units = [u]; ch = true;
      }
      (DB.employees || []).forEach(e => { if (e.unit !== n) { e.unit = n; ch = true; } if (e.alsoAt) { delete e.alsoAt; ch = true; } if (e.unitServices) { delete e.unitServices; ch = true; } });
      if (DB.certs && Array.isArray(DB.certs.students)) DB.certs.students.forEach(x => { if (x.unit !== n) { x.unit = n; ch = true; } });
      return ch;
    } catch (e) { return false; }
  }

  /* ---------- cycle of the school (settings): every section adapts to it ---------- */
  const Cyc = {
    kind(s) { const c = String((s || (typeof S === 'function' ? S() : {})).cycle || ''); return /تأهيل|تاهيل/.test(c) ? 'lyc' : /إعداد|اعداد/.test(c) ? 'col' : 'pri'; },
    isSec(s) { return Cyc.kind(s) !== 'pri'; },
    // 1.9.4: one independent institution = collège / lycée, or a primary school chosen as «مدرسة مستقلة» (settings → orgMode:'single').
    // Everything that speaks of school units (central school, branches, one GRESA code per unit) is hidden; a primary «مجموعة مدرسية» keeps them.
    single(s) { s = s || (typeof S === 'function' ? S() : {}); return Cyc.kind(s) !== 'pri' || String(s.orgMode || '') === 'single'; },
    group(s) { return !Cyc.single(s); },
    orgLabel(s) { s = s || (typeof S === 'function' ? S() : {}); return Cyc.kind(s) !== 'pri' ? 'مؤسسة مستقلة' : Cyc.single(s) ? 'مدرسة مستقلة (دون وحدات مدرسية)' : 'مجموعة مدرسية (مركزية وفرعيات)'; },
    label(k) { k = k || Cyc.kind(); return k === 'lyc' ? 'التعليم الثانوي التأهيلي' : k === 'col' ? 'التعليم الثانوي الإعدادي' : 'التعليم الابتدائي'; },
    // Massar level keys of the cycle
    levels(k) { k = k || Cyc.kind(); return k === 'lyc' ? ['TC', 'B1', 'B2'] : k === 'col' ? ['C1', 'C2', 'C3'] : ['DEPE', 'PS1', 'PS2', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6']; },
    // the level of the certified exam
    certLevels(k) { k = k || Cyc.kind(); return k === 'lyc' ? ['B1', 'B2'] : k === 'col' ? ['C3'] : ['P6']; },
    stageOf(lvl) { lvl = String(lvl || ''); return /^(DEPE|PS)/.test(lvl) ? 'pre' : /^P\d/.test(lvl) ? 'pri' : /^C\d/.test(lvl) ? 'col' : lvl ? 'lyc' : 'pri'; },
    has(lvl, k) { return Cyc.levels(k).includes(lvl); },
    // word used for «teacher / professor» etc.
    teacher(k) { return (k || Cyc.kind()) === 'pri' ? 'أستاذ(ة)' : 'أستاذ(ة)'; },
    sessionsPerDay(k) { return (k || Cyc.kind()) === 'pri' ? 2 : 8; }
  };
  window.Cyc = Cyc;
  window.Units = { list, names, gresaOf, byGresa, ensure, set, centerOptions, centerOf, card, normCode, normSec };
})();
