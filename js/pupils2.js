'use strict';
/* 1.9.3 — بطاقة التلاميذ (تتمة)
   • الفئات معزولة كل واحدة لوحدها (الوافدون، المغادرون، في طور التحويل، المنقطعون، غير الملتحقين، المفصولون، المهددون بالفصل،
     وضعية إعاقة، المدمجون، المكررون، الناجحون) مع الحذف الكلي لكل فئة؛
   • استيراد لوائح الوافدين والمغادرين من مسار (أي عدد من الملفات) وملف «التحويلات.xlsx» (نسخ/لصق من مسار) وتصديرهما؛
   • لوحة إحصاء التمدرس (محسوبة من اللوائح ومقارنة بلوحة مسار المستوردة)، لوحة حركية التلاميذ، المهددون بالفصل، وضعية الإعاقة. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { LV, SB, COL } = window.K;
  const X = () => window.Pupils.X;
  const SEC = () => !!(window.Cyc && Cyc.single());   // collège / lycée: one independent institution, no school units
  const unitLbl = u => (SEC() ? '' : `${u ? esc(u) : 'كل الوحدات'} — `);
  const nh = s => MK.hkey(s);
  const TR = ['joined', 'left', 'transit'];
  const ORDER = ['joined', 'left', 'transit', 'drop', 'notjoined', 'expelled', 'threat', 'disab', 'merged', 'repeat', 'success'];
  const sum = a => a.reduce((s, v) => s + (+v || 0), 0);
  const uniq = a => Array.from(new Set(a));
  const fx = n => (Math.round(n * 100) / 100).toString();
  // 1.9.4: the stage chosen in the stage bar (الكل / التعليم الأولي / التعليم الابتدائي) filters every tab, board and document
  const curStage = st => (SEC() && window.Cyc && Cyc.kind && Cyc.kind() !== 'pri' ? '' : st != null ? st : (X().stage || ''));
  const inSt = (lvl, st) => !st || ((LV.byK(lvl) || {}).pre ? 'pre' : 'pri') === st;
  const stTitle = st => (st === 'pre' ? ' — التعليم الأولي' : st === 'pri' ? ' — ' + (X().ST.pri.t || 'التعليم الابتدائي') : '');

  /* ---------- Massar «لوحة إحصاء التمدرس» file ---------- */
  function readBoard(rows, file) {
    const R = (rows || []).map(r => (r || []).map(v => String(v == null ? '' : v).trim()));
    if (!R.slice(0, 6).some(r => r.some(c => /لوحة\s*إحصاء\s*التمدرس/.test(c)))) return null;
    const meta = rx => { for (const r of R.slice(0, 10)) for (let j = 0; j < r.length; j++) if (rx.test(r[j])) { for (let k = j + 1; k < r.length; k++) if (r[k] && !/[:：]\s*$/.test(r[k])) return r[k]; } return ''; };
    const out = [], K12 = ['newT', 'newF', 'repT', 'repF', 'totT', 'totF', 'classes', 'avg', 'njT', 'njF', 'trT', 'trF'];
    R.forEach(r => {
      const li = r.findIndex(Boolean); if (li < 0) return;
      const lvl = LV.fromLabel(r[li]);
      const nums = r.slice(li + 1).filter(v => v !== '').map(v => +String(v).replace(',', '.'));
      if (!lvl || nums.length < 12 || nums.some(isNaN)) return;
      const o = { lvl, label: r[li] }; K12.forEach((k, i) => { o[k] = nums[i]; }); out.push(o);
    });
    if (!out.length) return null;
    const sy = (meta(/السنة الدراسية/) || '').replace(/\s/g, '');
    return { file, at: new Date().toISOString(), sy: /^\d{4}\/\d{4}$/.test(sy) ? sy : '', inst: meta(/^مؤسسة/), rows: out };
  }

  /* ---------- data of the schooling board ---------- */
  function schoolData(sy, unit, st) {
    st = curStage(st);
    const x = X(), y = x.Y(sy), cur = x.current(sy).filter(p => (!unit || K.U.same(p.unit, unit)) && inSt(p.lvl, st));
    const rep = new Set(x.movesOf(sy, 'repeat').map(m => m.code).filter(Boolean));
    const mv = c => x.movesOf(sy, c).filter(m => (!unit || K.U.same(m.unit, unit)) && inSt(m.lvl, st));
    const lv = LV.sort(uniq(cur.map(p => p.lvl).concat(mv('notjoined').map(m => m.lvl), mv('transit').map(m => m.lvl)).filter(Boolean)));
    const nc = l => y.lists.filter(c => (!unit || c.unit === unit) && (c.levels || []).includes(l)).reduce((a, c) => a + 1 / ((c.levels || []).length || 1), 0);
    const rows = lv.map(l => {
      const T = x.cnt(cur, p => p.lvl === l), R = x.cnt(cur, p => p.lvl === l && rep.has(p.code));
      const NJ = x.cnt(mv('notjoined'), m => m.lvl === l), TRN = x.cnt(mv('transit'), m => m.lvl === l), c = nc(l);
      return { lvl: l, label: LV.ar(l), newT: T.t - R.t, newF: T.f - R.f, repT: R.t, repF: R.f, totT: T.t, totF: T.f, classes: c, avg: c ? Math.round(T.t / c * 10) / 10 : 0, njT: NJ.t, njF: NJ.f, trT: TRN.t, trF: TRN.f };
    });
    const tot = { lvl: '', label: 'المجموع' };
    ['newT', 'newF', 'repT', 'repF', 'totT', 'totF', 'classes', 'njT', 'njF', 'trT', 'trF'].forEach(k => { tot[k] = sum(rows.map(r => r[k])); });
    tot.avg = tot.classes ? Math.round(tot.totT / tot.classes * 10) / 10 : 0;
    return { rows, tot };
  }
  function schoolTable(d, withTot) {
    const h2 = '<th class="d">المجموع</th><th class="d">الإناث منهم</th>';
    const head = `<tr><th rowspan="3" class="d">المستوى</th><th colspan="6" class="d">المتمدرسون</th><th rowspan="3" class="d">عدد الأقسام</th><th rowspan="3" class="d">معدل التلاميذ بالقسم</th><th colspan="2" rowspan="2" class="d">غير ملتحقين</th><th colspan="2" rowspan="2" class="d">في طور التحويل</th></tr>
      <tr><th colspan="2" class="d">الجدد</th><th colspan="2" class="d">المكررون</th><th colspan="2" class="d">المجموع</th></tr><tr>${h2.repeat(5)}</tr>`;
    const row = (r, tot) => `<tr><td class="k">${esc(r.label)}</td>${['newT', 'newF', 'repT', 'repF'].map(k => `<td>${r[k]}</td>`).join('')}<td class="${tot ? 't' : 's'}">${r.totT}</td><td>${r.totF}</td><td>${fx(r.classes)}</td><td>${r.avg || ''}</td>${['njT', 'njF', 'trT', 'trF'].map(k => `<td>${r[k]}</td>`).join('')}</tr>`;
    return { head, rows: d.rows.map(r => row(r)).concat(withTot === false ? [] : [row(d.tot, true)]) };
  }
  // board imported from Massar, with the difference against the program's own count
  function compareTable(d, board, st) {
    board = Object.assign({}, board, { rows: board.rows.filter(r => inSt(r.lvl, curStage(st))) });
    const by = Object.fromEntries(board.rows.map(r => [r.lvl, r]));
    const head = '<tr><th class="d">المستوى</th><th class="d">المتمدرسون (مسار)</th><th class="d">المتمدرسون (البرنامج)</th><th class="d">الفرق</th><th class="d">الإناث (مسار)</th><th class="d">الإناث (البرنامج)</th><th class="d">الأقسام (مسار)</th><th class="d">غير ملتحقين (مسار / البرنامج)</th><th class="d">في طور التحويل (مسار / البرنامج)</th></tr>';
    const lv = LV.sort(uniq(d.rows.map(r => r.lvl).concat(board.rows.map(r => r.lvl))));
    const rows = lv.map(l => {
      const a = by[l] || {}, b = d.rows.find(r => r.lvl === l) || {}, diff = (b.totT || 0) - (a.totT || 0);
      return `<tr><td class="k">${esc(LV.ar(l))}</td><td>${a.totT == null ? '—' : a.totT}</td><td>${b.totT == null ? 0 : b.totT}</td><td style="font-weight:700;color:${diff ? '#c0151f' : '#1d7a35'}">${diff ? (diff > 0 ? '+' : '') + diff : '✓'}</td><td>${a.totF == null ? '—' : a.totF}</td><td>${b.totF == null ? 0 : b.totF}</td><td>${a.classes == null ? '—' : fx(a.classes)}</td><td>${a.njT == null ? '—' : a.njT} / ${b.njT || 0}</td><td>${a.trT == null ? '—' : a.trT} / ${b.trT || 0}</td></tr>`;
    });
    return { head, rows };
  }
  // 1.9.4: the boards imported from Massar (one per institution of the file); their sum is the board of the school
  const K12 = ['newT', 'newF', 'repT', 'repF', 'totT', 'totF', 'classes', 'njT', 'njF', 'trT', 'trF'];
  function mergeBoards(L) {
    const by = {}; L.forEach(b => b.rows.forEach(r => { const o = by[r.lvl] || (by[r.lvl] = { lvl: r.lvl, label: r.label }); K12.forEach(k => { o[k] = (o[k] || 0) + (+r[k] || 0); }); }));
    const rows = LV.sort(Object.keys(by)).map(l => { const o = by[l]; o.avg = o.classes ? Math.round(o.totT / o.classes * 10) / 10 : 0; return o; });
    return { file: L.map(b => b.file).filter(Boolean).join('، '), at: (L[L.length - 1] || {}).at, sy: (L[0] || {}).sy, inst: L.map(b => b.inst).filter(Boolean).join(' + '), rows };
  }
  function addBoard(y, b) { y.boards = (Array.isArray(y.boards) ? y.boards : y.board ? [y.board] : []).filter(x => (x.inst || x.file) !== (b.inst || b.file)); y.boards.push(b); y.board = mergeBoards(y.boards); }
  const boardData = (bd, st) => { st = curStage(st); bd = Object.assign({}, bd, { rows: bd.rows.filter(r => inSt(r.lvl, st)) }); const tot = { lvl: '', label: 'المجموع' }; K12.forEach(k => { tot[k] = sum(bd.rows.map(r => +r[k] || 0)); }); tot.avg = tot.classes ? Math.round(tot.totT / tot.classes * 10) / 10 : 0; return { rows: bd.rows.map(r => Object.assign({ label: LV.ar(r.lvl) || r.label }, r)), tot }; };
  function boardCard(y, sy) {
    const bd = y.board && y.board.rows && y.board.rows.length ? y.board : null;
    if (!bd) return `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>لوحة إحصاء التمدرس (مسار)</h3><span style="flex:1"></span><button class="btn sm pri" id="bdImp">${ic('up')} استيراد لوحة مسار (StatistiquesScolarite)</button></div>
      <p class="muted" style="font-size:12.5px;line-height:1.8;padding:0 16px 10px;margin:0">في مسار: تمدرس التلاميذ ← إحصاء التمدرس ← طباعة (ملف StatistiquesScolarite.xlsx). يمكن استيراد ملف لكل مؤسسة/وحدة: تُجمع الأرقام تلقائيا (الجدد، المكررون، المجموع والإناث منهم، عدد الأقسام، معدل التلاميذ بالقسم، غير الملتحقين، في طور التحويل).</p></div>`;
    const d = boardData(bd), t = schoolTable(d), T = d.tot, BL = Array.isArray(y.boards) ? y.boards : [bd];
    return `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>لوحة إحصاء التمدرس (مسار)${esc(stTitle(curStage()))}</h3><span class="muted" style="font-size:12px">${esc(bd.inst || '')} — ${esc(fmtDate((bd.at || '').slice(0, 10)))}</span><span style="flex:1"></span>
        <button class="btn sm" id="bdImp">${ic('up')} استيراد / إضافة لوحة</button><button class="btn sm" id="bdPrn">${ic('print')} طباعة</button><button class="btn sm danger" id="bdDel">${ic('trash')} حذف</button></div>
      <div class="k2-kpis">${kpi(T.totT, 'المتمدرسون', 'green')}${kpi(T.totF, 'الإناث منهم', 'pink')}${kpi(T.newT, 'الجدد')}${kpi(T.repT, 'المكررون')}${kpi(fx(T.classes), 'عدد الأقسام')}${kpi(T.avg || '—', 'معدل التلاميذ بالقسم')}${kpi(T.njT, 'غير ملتحقين', T.njT ? 'red' : '')}${kpi(T.trT, 'في طور التحويل')}</div>
      <div style="overflow:auto;padding:0 16px 12px"><table class="tbl compact att-mx"><thead>${t.head}</thead><tbody>${t.rows.join('')}</tbody></table></div>
      ${BL.length > 1 ? `<p class="muted" style="font-size:12px;padding:0 16px 10px;margin:0">مجموع ${BL.length} لوحات: ${BL.map(b => esc(b.inst || b.file || '')).join('، ')}</p>` : ''}</div>`;
  }
  function bindBoard(b, y, sy, back) {
    if ($('#bdImp', b)) $('#bdImp', b).onclick = () => X().importMassar({ board: true });
    if ($('#bdPrn', b)) $('#bdPrn', b).onclick = () => go('pupilDoc', { kind: 'school', src: 'massar', stage: curStage() });
    if ($('#bdDel', b)) $('#bdDel', b).onclick = async () => { if (await confirmBox('حذف لوحة (لوحات) مسار المستوردة لهذا الموسم؟', 'حذف')) { delete y.board; delete y.boards; persist(); back(); } };
  }
  function docSchool(s, sy, o) {
    o = o || {};
    { const y0 = X().Y(sy); if ((o.src === 'massar' || !X().current(sy).length) && y0.board && y0.board.rows && y0.board.rows.length) { const d = boardData(y0.board, o.stage || ''), t = schoolTable(d);
      const chart = K.bars(d.rows.map(r => LV.sh(r.lvl)), [{ name: 'ذكور', color: COL.m, vals: d.rows.map(r => r.totT - r.totF) }, { name: 'إناث', color: COL.f, vals: d.rows.map(r => r.totF) }], { w: 620, h: 200, title: 'المتمدرسون حسب المستوى والجنس' });
      return { title: 'لوحة إحصاء التمدرس' + stTitle(o.stage || ''), sub: `الموسم الدراسي ${esc(sy)}${y0.board.inst ? ' — ' + esc(y0.board.inst) : ''}`, blocks: [SB.tbl(t.head, t.rows, 'cmp'), `<div class="sb-box" style="width:72%;margin:2mm auto 0">${chart}</div>`, '<div class="sb-note">المصدر: لوحة إحصاء التمدرس المستوردة من منظومة مسار (تمدرس التلاميذ ← إحصاء التمدرس).</div>'] }; } }
    o = o || {};
    const x = X(), d = schoolData(sy, o.unit || '', o.stage || ''), t = schoolTable(d), y = x.Y(sy);
    const chart = d.rows.length ? K.bars(d.rows.map(r => LV.sh(r.lvl)), [{ name: 'ذكور', color: COL.m, vals: d.rows.map(r => r.totT - r.totF) }, { name: 'إناث', color: COL.f, vals: d.rows.map(r => r.totF) }], { w: 620, h: 200, title: 'المتمدرسون حسب المستوى والجنس' }) : '';
    const blocks = [SB.tbl(t.head, t.rows, 'cmp'), chart ? `<div class="sb-box" style="width:72%;margin:2mm auto 0">${chart}</div>` : ''];
    if (o.board !== false && y.board && y.board.rows && y.board.rows.length) { const c = compareTable(d, y.board, o.stage || ''); blocks.push({ html: `<div class="sb-cap r" style="margin-top:3mm">مقارنة مع لوحة مسار المستوردة (${esc(y.board.file || '')})</div>`, keepNext: true }, SB.tbl(c.head, c.rows, 'cmp')); }
    blocks.push(`<div class="sb-note">الأرقام محسوبة من لوائح التلاميذ المستوردة من مسار (دون المغادرين والمنقطعين وغير الملتحقين). المكررون حسب لائحة المكررين، وعدد الأقسام: القسم المشترك يُقسم على مستوياته.</div>`);
    return { title: 'لوحة إحصاء التمدرس' + stTitle(o.stage || ''), sub: `الموسم الدراسي ${esc(sy)}${o.unit ? ' — ' + esc(o.unit) : ''}`, blocks };
  }

  /* ---------- statistics of one category by level and gender (threatened, disabilities…) ---------- */
  function catStats(sy, cat, unit, st) {
    st = curStage(st);
    const x = X(), L = x.movesOf(sy, cat).filter(m => (!unit || K.U.same(m.unit, unit)) && inSt(m.lvl, st));
    const lv = LV.sort(uniq(L.map(m => m.lvl).filter(Boolean)));
    const types = uniq(L.map(m => m.dis).filter(Boolean));
    return { L, lv, types, tot: x.cnt(L) };
  }
  function docCatDash(s, sy, o, cat) {
    const x = X(), st = catStats(sy, cat, SEC() ? '' : (o.unit || ''), o.stage || ''), C = x.CAT[cat], units = SEC() ? [] : x.unitsOf(sy).filter(u => st.L.some(m => K.U.same(m.unit, u)));
    const g3 = c => `<td>${c.m}</td><td>${c.f}</td><td class="s">${c.t}</td>`;
    const head = `<tr><th rowspan="2" class="d">المستوى</th>${units.map(u => `<th colspan="3" class="d">${esc(u)}</th>`).join('')}<th colspan="3" class="d">المجموع</th></tr><tr>${units.concat(['']).map(() => '<th>ذ</th><th>إ</th><th>م</th>').join('')}</tr>`;
    const rows = st.lv.map(l => `<tr><td class="k">${esc(LV.sh(l))}</td>${units.map(u => g3(x.cnt(st.L, m => m.lvl === l && K.U.same(m.unit, u)))).join('')}${g3(x.cnt(st.L, m => m.lvl === l))}</tr>`)
      .concat([`<tr><td class="k">المجموع</td>${units.map(u => g3(x.cnt(st.L, m => K.U.same(m.unit, u)))).join('')}${g3(st.tot)}</tr>`]);
    const blocks = [SB.tbl(head, rows, units.length > 4 ? 'cmp' : '')];
    if (cat === 'disab' && st.types.length) {
      blocks.push({ html: `<div class="sb-cap r" style="margin-top:3mm">التوزيع حسب نوع الإعاقة</div>`, keepNext: true });
      blocks.push(SB.tbl('<tr><th class="d">نوع الإعاقة</th><th>ذكور</th><th>إناث</th><th>المجموع</th></tr>', st.types.map(t => { const c = x.cnt(st.L, m => m.dis === t); return `<tr><td class="k r">${esc(t)}</td><td>${c.m}</td><td>${c.f}</td><td class="s">${c.t}</td></tr>`; }), ''));
    }
    const lr = st.L.slice().sort((a, b) => LV.idx(a.lvl) - LV.idx(b.lvl) || String(a.cls || '').localeCompare(String(b.cls || '')) || x.fullN(a).localeCompare(x.fullN(b), 'ar'));
    blocks.push({ html: `<div class="sb-cap r" style="margin-top:3mm">اللائحة الاسمية (${st.tot.t})</div>`, keepNext: true });
    blocks.push(SB.tbl(`<tr><th style="width:5%">ر.ت</th><th>رمز مسار</th><th>الاسم والنسب</th><th>الجنس</th><th>تاريخ الازدياد</th><th>المستوى</th><th>القسم</th>${SEC() ? '' : '<th>الوحدة</th>'}${cat === 'disab' ? '<th>نوع الإعاقة</th>' : '<th>ملاحظة</th>'}</tr>`,
      lr.map((m, i) => `<tr><td>${i + 1}</td><td class="ltr">${esc(m.code || '')}</td><td class="r b">${esc(x.fullN(m))}</td><td>${x.gAr(m.g)}</td><td>${esc(fmtDate(m.birth))}</td><td>${esc(LV.sh(m.lvl))}</td><td class="ltr">${esc(m.cls || '')}</td>${SEC() ? '' : `<td>${esc(m.unit || '')}</td>`}<td class="r">${esc((cat === 'disab' ? m.dis : m.note) || '')}</td></tr>`).concat(lr.length ? [] : [`<tr><td colspan="${SEC() ? 8 : 9}">لا شيء يذكر</td></tr>`]), ''));
    return { title: (cat === 'threat' ? 'لائحة التلاميذ المهددين بالفصل' : 'إحصاء وتمدرس التلاميذ في وضعية إعاقة') + stTitle(o.stage || ''), sub: `الموسم الدراسي ${esc(sy)}${!SEC() && o.unit ? ' — ' + esc(o.unit) : ''}`, blocks, page: 'a4' };
  }

  /* ---------- transfer lists (arrivals / departures / in transfer) ---------- */
  function docXfer(s, sy, o) {
    const x = X(), cat = o.cat || 'joined', C = x.CAT[cat], units = x.unitsOf(sy);   // (one unit in a collège / lycée)
    const L = x.Y(sy).moves.filter(m => m.cat === cat && x.inStage(m, o.stage || '')).sort((a, b) => units.indexOf(a.unit) - units.indexOf(b.unit) || String(a.date || '').localeCompare(String(b.date || '')) || x.fullN(a).localeCompare(x.fullN(b), 'ar'));
    const other = cat === 'left' ? 'مؤسسة الاستقبال' : 'المؤسسة الأصلية';
    const head = `<tr><th style="width:4%">ر.ت</th><th>رمز مسار</th><th>الاسم والنسب</th><th>المستوى</th>${SEC() ? '' : '<th>الوحدة</th>'}<th>تاريخ التحويل</th><th>نوع التحويل</th>${cat === 'transit' ? '' : `<th>${other}</th><th>المديرية / الأكاديمية</th>`}</tr>`;
    const rows = L.map((m, i) => `<tr><td>${i + 1}</td><td class="ltr">${esc(m.code || '')}</td><td class="r b">${esc(x.fullN(m))}</td><td>${esc(LV.sh(m.lvl))}</td>${SEC() ? '' : `<td>${esc(m.unit || '')}</td>`}<td>${esc(fmtDate(m.date))}</td><td>${esc(m.ttype || '')}</td>${cat === 'transit' ? '' : `<td class="r sm">${esc((cat === 'left' ? m.recv : m.orig) || '')}</td><td class="r sm">${esc([m.odir, m.oacad].filter(Boolean).join(' — '))}</td>`}</tr>`);
    if (!rows.length) rows.push(`<tr><td colspan="${(cat === 'transit' ? 7 : 9) - (SEC() ? 1 : 0)}">لا شيء يذكر</td></tr>`);
    const c = x.cnt(L);
    return { title: `لائحة التحويلات (${C.sh})`, sub: `الموسم الدراسي ${esc(sy)} — العدد: ${c.t} (ذكور ${c.m} / إناث ${c.f})`, page: 'a4l', blocks: [SB.tbl(head, rows, 'cmp')] };
  }

  /* ---------- exports ---------- */
  const row9 = (m, x) => [m.code || '', x.fullN(m), x.gAr(m.g), fmtDate(m.birth), LV.ar(m.lvl), m.unit || '', m.cls || '', fmtDate(m.date), m.ttype || '', m.orig || '', m.recv || '', [m.odir, m.oacad].filter(Boolean).join(' — '), m.dis || '', m.note || ''];
  async function exportCat(sy, cat) {
    const x = X(), L = x.movesOf(sy, cat), C = x.CAT[cat];
    if (!L.length) return toast('لا توجد حالات في هذه الفئة', true);
    const head = ['ر.ت', 'رمز مسار', 'الاسم والنسب', 'النوع', 'تاريخ الازدياد', 'المستوى', 'الوحدة المدرسية', 'القسم', 'التاريخ', 'نوع التحويل', 'المؤسسة الأصلية', 'مؤسسة الاستقبال', 'المديرية / الأكاديمية', 'نوع الإعاقة', 'ملاحظة'];
    const noU = a => (SEC() ? a.filter((_, i) => i !== 6) : a);   // no «الوحدة المدرسية» column in a collège / lycée
    const r = await window.api.saveXlsx([noU(head)].concat(L.map((m, i) => noU([String(i + 1)].concat(row9(m, x))))), `${C.sh}_${MK.syDash(sy)}.xlsx`, C.sh, noU([6, 14, 24, 8, 12, 16, 20, 12, 12, 14, 28, 28, 28, 18, 24]));
    if (r && r.ok) toast('تم التصدير إلى Excel');
  }
  // the transfers workbook (التحويلات.xlsx): paste Massar's tables into the sheets «الوافدون», «المغادرون», «تلاميذ في طور التحويل» then import it
  async function exportTransfers(sy) {
    const x = X(), mv = c => x.movesOf(sy, c);
    const sh = (name, head, rows, widths) => ({ name, rows: [head].concat(rows), widths });
    const sheets = [
      sh('لائحة الوافدون', ['رقم التلميذ', 'الاسم والنسب', 'تاريخ الازدياد', 'الجنس', 'المستوى', 'المؤسسة الاصلية', 'تاريخ التحويل', 'نوع التحويل', 'تاريخ الاستقبال'],
        mv('joined').map(m => [m.code || '', x.fullN(m), fmtDate(m.birth), x.gAr(m.g), LV.ar(m.lvl), m.orig || '', fmtDate(m.date), m.ttype || '', fmtDate(m.rdate || m.date)]), [14, 26, 14, 8, 20, 34, 14, 14, 14]),
      sh('تلاميذ في طور التحويل', ['رقم التلميذ', 'النسب', 'الإسم', 'تاريخ التحويل', 'نوع التحويل'], mv('transit').map(m => [m.code || '', m.last || '', m.first || '', fmtDate(m.date), m.ttype || '']), [14, 18, 18, 14, 14]),
      sh('المغادرون', ['رقم التلميذ', 'النسب', 'الإسم', 'تاريخ التحويل', 'نوع التحويل', 'المؤسسة الأصلية', 'مؤسسة الإستقبال', 'م. الإقليمية الاستقبال', 'أكاديمية الإستقبال'],
        mv('left').map(m => [m.code || '', m.last || '', m.first || '', fmtDate(m.date), m.ttype || '', m.orig || m.unit || '', m.recv || '', m.odir || '', m.oacad || '']), [14, 18, 18, 14, 14, 34, 34, 22, 22]),
      sh('الوافدون', ['رقم التلميذ', 'النسب', 'الإسم', 'تاريخ التحويل', 'نوع التحويل', 'مؤسسة الإستقبال', 'المؤسسة الأصلية', 'م. الإقليمية الأصلية', 'الأكاديمية الأصلية'],
        mv('joined').map(m => [m.code || '', m.last || '', m.first || '', fmtDate(m.date), m.ttype || '', m.recv || m.unit || '', m.orig || '', m.odir || '', m.oacad || '']), [14, 18, 18, 14, 14, 34, 34, 22, 22]),
      { name: 'تعليمات', widths: [110], rows: [['طريقة الاستعمال'], ['1) من مسار: افتح لائحة التحويلات (الوافدون / المغادرون / في طور التحويل)، حدد الجدول كاملا بما فيه عناوين الأعمدة وانسخه (Ctrl+C).'],
        ['2) في هذا الملف: الصق (Ctrl+V) في الورقة المناسبة ابتداء من الخانة A1 (الوافدون، المغادرون، تلاميذ في طور التحويل). يمكن تكرار العملية لكل مستوى مع الصق اللوائح الواحدة تحت الأخرى.'],
        ['3) في البرنامج: بطاقة التلاميذ ← الفئات والحركية ← «استيراد ملف التحويلات». يتعرف البرنامج على الأوراق من أسمائها ولا يكرر التلميذ في نفس الفئة.'],
        ['4) ورقة «لائحة الوافدون» تحمل معطيات إضافية (تاريخ الازدياد، الجنس، المستوى، تاريخ الاستقبال) ويمكن ملؤها يدويا.']] }
    ];
    const r = await window.api.saveXlsxBook(sheets, `التحويلات_${MK.syDash(sy)}.xlsx`);
    if (r && r.ok) toast('تم حفظ ملف التحويلات (4 أوراق + تعليمات)');
  }

  /* ---------- tab: the categories, each one isolated ---------- */
  function tabCats(b, sy) {
    const x = X(), y = x.Y(sy), units = x.unitsOf(sy), f = x.flt;
    if (SEC()) f.munit = '';
    const n = c => x.movesOf(sy, c).filter(m => x.inStage(m, x.stage)).length;
    if (!f.mcat || !x.CAT[f.mcat]) f.mcat = ORDER.find(c => n(c)) || 'joined';
    const cat = f.mcat, C = x.CAT[cat], isTr = TR.includes(cat), isOut = x.OUT.includes(cat);
    const note = {
      joined: 'تلاميذ وفدوا على المؤسسة (تحويل فردي أو جماعي). حمّل من مسار «لائحة التحويلات (الوافدون)» لكل مستوى — أي عدد من الملفات دفعة واحدة — أو الصق اللوائح في ملف «التحويلات.xlsx» ثم استورده.',
      left: 'تلاميذ غادروا المؤسسة إلى مؤسسة أخرى. لا يُحتسبون ضمن المتمدرسين ولا في الغياب والإحصاءات الأخرى.',
      transit: 'تلاميذ في طور التحويل (لم يكتمل تحويلهم بعد في مسار).',
      drop: 'تلاميذ منقطعون عن الدراسة. لا يُحتسبون ضمن المتمدرسين.', notjoined: 'تلاميذ مسجلون لم يلتحقوا بالمؤسسة. لا يُحتسبون ضمن المتمدرسين.', expelled: 'تلاميذ مفصولون. لا يُحتسبون ضمن المتمدرسين.',
      threat: 'تلاميذ مهددون بالفصل (لائحة مسار «لائحة المهددين بالفصل»). يبقون ضمن المتمدرسين.', disab: 'تلاميذ في وضعية إعاقة (لائحة مسار أو إدخال يدوي مع نوع الإعاقة). يبقون ضمن المتمدرسين.', merged: 'تلاميذ مدمجون.',
      repeat: 'التلاميذ المكررون (تحتسب في «الجدد/المكررون»).', success: 'التلاميذ الناجحون.' }[cat] || '';
    b.innerHTML = boardCard(y, sy) + `<div class="card"><div class="cat-chips">${ORDER.map(c => `<button class="cat-chip ${c === cat ? 'on' : ''} ${x.OUT.includes(c) ? 'out' : ''}" data-c="${c}"><span class="n">${n(c)}</span>${esc(x.CAT[c].l)}</button>`).join('')}</div>
      <div class="toolbar"><div class="search">${ic('search')}<input class="inp" id="cq" placeholder="بحث بالاسم أو رمز مسار..." value="${esc(f.mq || '')}"></div>
        ${SEC() ? '' : `<select class="inp" id="cu" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${f.munit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`}
        <span class="muted" id="cn"></span><span style="flex:1"></span>
        <button class="btn sm pri" id="cImp">${ic('up')} ${isTr ? 'استيراد ملفات مسار (وافدون / مغادرون) — أي عدد' : 'استيراد لوائح مسار'}</button>
        ${isTr ? `<button class="btn sm" id="cXi">${ic('up')} استيراد ملف التحويلات.xlsx</button><button class="btn sm" id="cXe">${ic('down')} ملف التحويلات.xlsx (نموذج / تصدير)</button>` : ''}
        <button class="btn sm" id="cAdd">${ic('plus')} إضافة حالة</button><button class="btn sm" id="cExp">${ic('down')} تصدير Excel</button>
        <button class="btn sm" id="cPrn">${ic('print')} طباعة اللائحة</button><button class="btn sm danger" id="cDel">${ic('trash')} حذف كل «${esc(C.sh)}»</button></div>
      <div class="k2-note" style="margin:0 16px 8px;font-size:12.5px;line-height:1.8">${isOut ? '<span class="k2-pill out">مستثنى من المتمدرسين</span> ' : ''}${esc(note)}</div>
      <div id="cT" style="overflow:auto"></div></div>`;
    const list = () => { const q = nh(f.mq || ''); return y.moves.filter(m => m.cat === cat && x.inStage(m, x.stage) && (!f.munit || m.unit === f.munit) && (!q || nh([x.fullN(m), m.code, m.note, m.orig, m.recv].join(' ')).includes(q)))
      .sort((a, c) => units.indexOf(a.unit) - units.indexOf(c.unit) || LV.idx(a.lvl) - LV.idx(c.lvl) || String(a.date || '').localeCompare(String(c.date || '')) || x.fullN(a).localeCompare(x.fullN(c), 'ar')); };
    const draw = () => {
      const L = list();
      const cc = x.cnt(L); $('#cn').textContent = `${L.length} حالة — ذكور ${cc.m} / إناث ${cc.f}`;
      const xc = cat === 'left' ? m => m.recv : m => m.orig;
      $('#cT').innerHTML = L.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>رمز مسار</th><th>الاسم والنسب</th><th>الجنس</th><th>تاريخ الازدياد</th>${SEC() ? '' : '<th>الوحدة</th>'}<th>المستوى</th>
        ${isTr ? `<th>تاريخ التحويل</th><th>نوع التحويل</th>${cat === 'transit' ? '' : `<th>${cat === 'left' ? 'مؤسسة الاستقبال' : 'المؤسسة الأصلية'}</th>`}` : cat === 'disab' ? '<th>نوع الإعاقة</th><th>التاريخ</th>' : '<th>التاريخ</th><th>ملاحظة</th>'}<th></th></tr></thead><tbody>
        ${L.slice(0, 2000).map((m, i) => `<tr data-id="${m.id}"><td class="muted num">${i + 1}</td><td class="num" dir="ltr" style="text-align:right">${esc(m.code || '')}</td><td><b>${esc(x.fullN(m))}</b></td><td>${x.gAr(m.g)}</td><td class="num nw">${esc(fmtDate(m.birth))}</td>${SEC() ? '' : `<td>${esc(m.unit || '')}</td>`}<td>${esc(LV.sh(m.lvl))}</td>
          ${isTr ? `<td class="num nw">${esc(fmtDate(m.date))}</td><td>${esc(m.ttype || '')}</td>${cat === 'transit' ? '' : `<td class="muted" style="font-size:12px">${esc(xc(m) || '')}</td>`}` : cat === 'disab' ? `<td>${esc(m.dis || '')}</td><td class="num nw">${esc(fmtDate(m.date))}</td>` : `<td class="num nw">${esc(fmtDate(m.date))}</td><td class="muted" style="font-size:12px">${esc(m.note || '')}</td>`}
          <td class="act"><button class="btn sm" data-a="e">${ic('edit')}</button> <button class="btn sm danger icon" data-a="d">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>` : `<div class="empty-state" style="line-height:2">لا توجد حالات في فئة «${esc(C.l)}»<br><span class="muted" style="font-size:12.5px">استورد لوائح مسار أو أضف حالة يدويا.</span></div>`;
      $$('#cT tr[data-id]').forEach(tr => {
        const m = y.moves.find(z => z.id === tr.dataset.id);
        $('[data-a=e]', tr).onclick = () => x.moveForm(sy, m, null, () => go('pupils', { tab: 'moves' }));
        $('[data-a=d]', tr).onclick = async () => { if (await confirmBox(`حذف حالة <b>${esc(x.fullN(m))}</b> (${esc(C.sh)})؟`, 'حذف')) { y.moves = y.moves.filter(z => z !== m); persist(); go('pupils', { tab: 'moves' }); } };
      });
    };
    bindBoard(b, y, sy, () => go('pupils', { tab: 'moves' }));
    $$('.cat-chip', b).forEach(c => c.onclick = () => { f.mcat = c.dataset.c; go('pupils', { tab: 'moves' }); });
    $('#cq').oninput = e => { f.mq = e.target.value; draw(); };
    if ($('#cu')) $('#cu').onchange = e => { f.munit = e.target.value; draw(); };
    $('#cImp').onclick = () => x.importMassar({ cats: isTr ? TR : [cat] });
    if (isTr) { $('#cXi').onclick = () => x.importMassar({ cats: TR }); $('#cXe').onclick = () => exportTransfers(sy); }
    $('#cAdd').onclick = () => x.moveForm(sy, null, null, () => go('pupils', { tab: 'moves' }), { cat });
    $('#cExp').onclick = () => exportCat(sy, cat);
    $('#cPrn').onclick = () => go('pupilDoc', { kind: isTr ? 'xfer' : 'movelist', cat, stage: x.stage });
    $('#cDel').onclick = async () => {
      const k = n(cat); if (!k) return toast('لا توجد حالات لحذفها');
      if (!await confirmBox(`حذف نهائي لكل حالات فئة <b>${esc(C.l)}</b> (${k} حالة) من هذا الموسم؟${isOut ? '<br><span class="muted">سيعود هؤلاء التلاميذ إلى لائحة المتمدرسين إن كانوا ضمن لوائح الأقسام.</span>' : ''}`, 'حذف الكل')) return;
      y.moves = y.moves.filter(m => m.cat !== cat); persist(); toast(`تم حذف ${k} حالة`); go('pupils', { tab: 'moves' });
    };
    draw();
  }

  /* ---------- tab: dashboards ---------- */
  const kpi = (n, t, cls) => `<div class="k2-kpi ${cls || ''}"><div class="n">${n}</div><div class="t">${t}</div></div>`;
  function tabDash(b, sy) {
    const x = X(), f = x.flt, units = x.unitsOf(sy), y = x.Y(sy);
    if (SEC()) f.dunit = '';
    f.dash = f.dash || 'school';
    const V = [['school', 'لوحة إحصاء التمدرس'], ['move', 'لوحة حركية التلاميذ'], ['threat', 'المهددون بالفصل'], ['disab', 'التلاميذ في وضعية إعاقة']];
    b.innerHTML = `<div class="mk-tabs" style="margin-bottom:10px"><div class="seg" id="dvTabs">${V.map(([k, l]) => `<button data-v="${k}" class="${f.dash === k ? 'on' : ''}">${l}</button>`).join('')}</div>
      ${SEC() ? '' : `<select class="inp" id="dvUnit" style="width:auto;margin-inline-start:12px"><option value="">كل الوحدات المدرسية</option>${units.map(u => `<option ${f.dunit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>`}</div><div id="dvBody"></div>`;
    $$('#dvTabs button', b).forEach(bt => bt.onclick = () => { f.dash = bt.dataset.v; go('pupils', { tab: 'dash' }); });
    if ($('#dvUnit')) $('#dvUnit').onchange = e => { f.dunit = e.target.value; go('pupils', { tab: 'dash' }); };
    const box = $('#dvBody'), unit = f.dunit || '';
    if (f.dash === 'school') return viewSchool(box, sy, unit);
    if (f.dash === 'move') return viewMove(box, sy, unit);
    return viewCat(box, sy, unit, f.dash);
  }
  function viewSchool(box, sy, unit) {
    const x = X(), y = x.Y(sy), d = schoolData(sy, unit), t = schoolTable(d);
    if (!d.rows.length && y.board && y.board.rows && y.board.rows.length) { box.innerHTML = boardCard(y, sy); bindBoard(box, y, sy, () => go('pupils', { tab: 'dash' })); return; }
    const T = d.tot, pct = T.totT ? Math.round(T.totF * 1000 / T.totT) / 10 : 0;
    const bd = y.board && y.board.rows && y.board.rows.length ? y.board : null;
    box.innerHTML = `<div class="card"><div class="k2-kpis">${kpi(T.totT, 'التلاميذ المتمدرسون', 'green')}${kpi(T.totT - T.totF, 'الذكور', 'blue')}${kpi(T.totF, 'الإناث', 'pink')}${kpi(pct + '%', 'نسبة الإناث')}${kpi(T.newT, 'الجدد')}${kpi(T.repT, 'المكررون')}
        ${kpi(fx(T.classes), 'عدد الأقسام')}${kpi(T.avg || '—', 'معدل التلاميذ بالقسم')}${kpi(T.njT, 'غير ملتحقين', T.njT ? 'red' : '')}${kpi(T.trT, 'في طور التحويل')}</div>
      <div class="toolbar"><span class="muted">${unitLbl(unit)}الموسم ${esc(MK.syDash(sy))}</span><span style="flex:1"></span>
        <button class="btn sm" id="dvImp">${ic('up')} استيراد لوحة مسار (StatistiquesScolarite)</button><button class="btn sm pri" id="dvPrn">${ic('print')} طباعة اللوحة</button></div>
      ${d.rows.length ? `<div style="overflow:auto;padding:0 16px 12px"><table class="tbl compact att-mx"><thead>${t.head}</thead><tbody>${t.rows.join('')}</tbody></table></div>` : '<div class="empty-state">استورد لوائح التلاميذ من مسار لحساب لوحة التمدرس</div>'}</div>
      ${d.rows.length ? `<div class="k2-two" style="margin-top:14px"><div class="card"><div class="card-h"><h3>المتمدرسون حسب المستوى والجنس</h3></div><div class="card-b">${K.bars(d.rows.map(r => LV.sh(r.lvl)), [{ name: 'ذكور', color: COL.m, vals: d.rows.map(r => r.totT - r.totF) }, { name: 'إناث', color: COL.f, vals: d.rows.map(r => r.totF) }], { w: 480, h: 200 })}</div></div>
        <div class="card"><div class="card-h"><h3>الجدد والمكررون وغير الملتحقين</h3></div><div class="card-b">${K.bars(d.rows.map(r => LV.sh(r.lvl)), [{ name: 'الجدد', color: COL.g, vals: d.rows.map(r => r.newT) }, { name: 'المكررون', color: COL.o, vals: d.rows.map(r => r.repT) }, { name: 'غير ملتحقين', color: COL.t, vals: d.rows.map(r => r.njT) }], { w: 480, h: 200 })}</div></div></div>` : ''}
      ${bd ? (c => `<div class="card" style="margin-top:14px"><div class="card-h"><h3>مقارنة بلوحة مسار المستوردة</h3><span class="muted" style="font-size:12px">${esc(bd.file || '')} — ${esc(fmtDate((bd.at || '').slice(0, 10)))}</span><span style="flex:1"></span><button class="btn sm danger" id="dvDelBd">${ic('trash')} حذف اللوحة المستوردة</button></div>
        <div style="overflow:auto;padding:0 16px 12px"><table class="tbl compact att-mx"><thead>${c.head}</thead><tbody>${c.rows.join('')}</tbody></table></div>
        <p class="muted" style="font-size:12px;padding:0 16px 10px;margin:0">الفرق (✓ = مطابق) بين أرقام مسار وأرقام لوائح التلاميذ المستوردة: راجع التلاميذ الجدد أو المغادرين إن وُجد اختلاف.</p></div>`)(compareTable(d, bd)) : ''}`;
    $('#dvImp').onclick = () => x.importMassar();
    $('#dvPrn').onclick = () => go('pupilDoc', { kind: 'school', unit, stage: curStage() });
    if ($('#dvDelBd')) $('#dvDelBd').onclick = async () => { if (await confirmBox('حذف لوحة مسار المستوردة؟', 'حذف')) { delete y.board; persist(); go('pupils', { tab: 'dash' }); } };
  }
  function viewMove(box, sy, unit) {
    const x = X(), y = x.Y(sy), C = ['joined', 'left', 'transit', 'notjoined', 'drop', 'merged', 'expelled'];
    const st = curStage(), inU = p => (!unit || K.U.same(p.unit, unit)) && inSt(p.lvl, st);
    const mv = y.moves.filter(inU);
    const lv = LV.sort(uniq(mv.map(m => m.lvl).filter(Boolean).concat(x.current(sy).filter(inU).map(p => p.lvl))));
    const cur = x.cnt(x.current(sy).filter(inU));
    const c = k => x.cnt(mv, m => m.cat === k);
    // by month (September → August) of the transfer date
    const MN = ['شتنبر', 'أكتوبر', 'نونبر', 'دجنبر', 'يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت'], mi = d => { const m = /^\d{4}-(\d{2})/.exec(d || ''); return m ? (+m[1] + 3) % 12 : -1; };
    const byM = k => MN.map((_, i) => mv.filter(m => m.cat === k && mi(m.date) === i).length);
    const types = uniq(mv.filter(m => TR.includes(m.cat) && m.ttype).map(m => m.ttype));
    const head = `<tr><th rowspan="2" class="d">المستوى</th>${C.slice(0, 6).map(k => `<th colspan="3" class="d">${esc(x.CAT[k].sh)}</th>`).join('')}<th colspan="3" class="d">المتمدرسون حاليا</th></tr><tr>${C.slice(0, 6).concat(['']).map(() => '<th>ذ</th><th>إ</th><th>م</th>').join('')}</tr>`;
    const g3 = q => `<td>${q.m}</td><td>${q.f}</td><td class="s">${q.t}</td>`;
    const curL = x.current(sy).filter(inU);
    const rows = lv.map(l => `<tr><td class="k">${esc(LV.sh(l))}</td>${C.slice(0, 6).map(k => g3(x.cnt(mv, m => m.cat === k && m.lvl === l))).join('')}${g3(x.cnt(curL, p => p.lvl === l))}</tr>`)
      .concat([`<tr class="att-tot"><td>المجموع</td>${C.slice(0, 6).map(k => g3(c(k))).join('')}${g3(cur)}</tr>`]);
    box.innerHTML = `<div class="card"><div class="k2-kpis">${kpi(cur.t, 'المتمدرسون حاليا', 'green')}${C.map(k => kpi(c(k).t, x.CAT[k].l, x.OUT.includes(k) && c(k).t ? 'red' : '')).join('')}</div>
      <div class="toolbar"><span class="muted">${unitLbl(unit)}الموسم ${esc(MK.syDash(sy))}</span><span style="flex:1"></span>
        <button class="btn sm" id="mvImp">${ic('up')} استيراد لوائح الحركية من مسار</button><button class="btn sm" id="mvPrn">${ic('print')} جدول التتبع الدوري (طباعة)</button></div>
      ${lv.length ? `<div style="overflow:auto;padding:0 16px 12px"><table class="tbl compact att-mx"><thead>${head}</thead><tbody>${rows.join('')}</tbody></table></div>` : '<div class="empty-state">لا توجد معطيات للحركية بعد</div>'}</div>
      ${lv.length ? `<div class="k2-two" style="margin-top:14px"><div class="card"><div class="card-h"><h3>الوافدون والمغادرون حسب المستوى</h3></div><div class="card-b">${K.bars(lv.map(LV.sh), [{ name: 'الوافدون', color: COL.g, vals: lv.map(l => x.cnt(mv, m => m.cat === 'joined' && m.lvl === l).t) }, { name: 'المغادرون', color: COL.o, vals: lv.map(l => x.cnt(mv, m => m.cat === 'left' && m.lvl === l).t) }, { name: 'المنقطعون', color: '#c0392b', vals: lv.map(l => x.cnt(mv, m => m.cat === 'drop' && m.lvl === l).t) }], { w: 480, h: 200 })}</div></div>
        <div class="card"><div class="card-h"><h3>تطور الوافدين والمغادرين خلال السنة (حسب تاريخ التحويل)</h3></div><div class="card-b">${K.bars(MN.slice(0, 10), [{ name: 'الوافدون', color: COL.g, vals: byM('joined').slice(0, 10) }, { name: 'المغادرون', color: COL.o, vals: byM('left').slice(0, 10) }], { w: 480, h: 200, fs: 9 })}</div></div></div>
        ${types.length ? `<div class="card" style="margin-top:14px"><div class="card-h"><h3>أنواع التحويل</h3></div><div class="card-b" style="display:flex;gap:10px;flex-wrap:wrap">${types.map(t => `<span class="k2-pill in">${esc(t)}: <b>${mv.filter(m => TR.includes(m.cat) && m.ttype === t).length}</b></span>`).join('')}</div></div>` : ''}` : ''}`;
    $('#mvImp').onclick = () => x.importMassar({ cats: C.concat(['threat', 'disab']) });
    $('#mvPrn').onclick = () => go('pupilDoc', { kind: 'moves', stage: st });
  }
  function viewCat(box, sy, unit, cat) {
    const x = X(), st = catStats(sy, cat, unit), C = x.CAT[cat];
    const cur = x.cnt(x.current(sy).filter(p => (!unit || K.U.same(p.unit, unit)) && inSt(p.lvl, curStage()))), pc = cur.t ? Math.round(st.tot.t * 1000 / cur.t) / 10 : 0;
    box.innerHTML = `<div class="card"><div class="k2-kpis">${kpi(st.tot.t, C.l, cat === 'threat' && st.tot.t ? 'red' : 'blue')}${kpi(st.tot.m, 'الذكور')}${kpi(st.tot.f, 'الإناث', 'pink')}${kpi(pc + '%', 'من المتمدرسين')}${cat === 'disab' ? kpi(st.types.length, 'أنواع الإعاقة') : ''}</div>
      <div class="toolbar"><span class="muted">${SEC() ? '' : (unit ? esc(unit) : 'كل الوحدات')}</span><span style="flex:1"></span>
        <button class="btn sm" id="vcImp">${ic('up')} استيراد لائحة مسار</button><button class="btn sm" id="vcAdd">${ic('plus')} إضافة تلميذ(ة)</button><button class="btn sm" id="vcAll">فتح اللائحة الاسمية</button><button class="btn sm pri" id="vcPrn">${ic('print')} طباعة اللوحة واللائحة</button></div>
      ${st.lv.length ? `<div class="k2-two" style="padding:0 16px 14px"><div><table class="tbl compact att-mx"><thead><tr><th>المستوى</th><th>ذ</th><th>إ</th><th>المجموع</th></tr></thead><tbody>${st.lv.map(l => { const q = x.cnt(st.L, m => m.lvl === l); return `<tr><td><b>${esc(LV.sh(l))}</b></td><td class="num">${q.m}</td><td class="num">${q.f}</td><td class="num"><b>${q.t}</b></td></tr>`; }).join('')}
          <tr class="att-tot"><td>المجموع</td><td class="num">${st.tot.m}</td><td class="num">${st.tot.f}</td><td class="num">${st.tot.t}</td></tr></tbody></table>
          ${cat === 'disab' && st.types.length ? `<div class="sec-t">حسب نوع الإعاقة</div><table class="tbl compact att-mx"><tbody>${st.types.map(t => `<tr><td>${esc(t)}</td><td class="num"><b>${x.cnt(st.L, m => m.dis === t).t}</b></td></tr>`).join('')}</tbody></table>` : ''}</div>
        <div>${K.bars(st.lv.map(LV.sh), [{ name: 'ذكور', color: COL.m, vals: st.lv.map(l => x.cnt(st.L, m => m.lvl === l).m) }, { name: 'إناث', color: COL.f, vals: st.lv.map(l => x.cnt(st.L, m => m.lvl === l).f) }], { w: 460, h: 200 })}</div></div>`
        : `<div class="empty-state" style="line-height:2">لا توجد حالات ${esc(C.l)}<br><span class="muted" style="font-size:12.5px">${cat === 'threat' ? 'حمّل من مسار «لائحة المهددين بالفصل» ثم استوردها.' : 'استورد لائحة مسار أو أضف تلميذا مع نوع الإعاقة.'}</span></div>`}</div>`;
    $('#vcImp').onclick = () => x.importMassar({ cats: [cat] });
    $('#vcAdd').onclick = () => x.moveForm(sy, null, null, () => go('pupils', { tab: 'dash' }), { cat });
    $('#vcAll').onclick = () => go('pupils', { tab: 'moves', cat });
    $('#vcPrn').onclick = () => go('pupilDoc', { kind: cat === 'threat' ? 'threat' : 'disab', unit, stage: curStage() });
  }

  window.Pupils2 = { readBoard, addBoard, mergeBoards, tabCats, tabDash, exportTransfers, exportCat, schoolData,
    docs: { school: docSchool, threat: (s, sy, o) => docCatDash(s, sy, o, 'threat'), disab: (s, sy, o) => docCatDash(s, sy, o, 'disab'), xfer: docXfer } };
})();
