'use strict';
/* 1.9.4 — التدبير التربوي ← «روائز الموضعة وتشخيص التعلمات» (السلك الثانوي):
   استيراد نتائج تشخيص التعلمات / روائز الموضعة من مسار (لكل قسم ولكل مادة: البنود Item 1، Item 2… بقيمة 1 = متحكم فيه، 0 = غير متحكم فيه،
   والغياب)، ثم الاستثمار: شبكة تفريغ القسم مع الإحصائيات تحت الشبكة (الحاصلون على 1 و0 حسب البند والنوع)، إجمالي المستوى، مقارنة القبلي
   والبعدي، لائحة المعنيين بالدعم ومجموعات الدعم حسب البند، والحصيلة على صعيد المؤسسة. المستوى والقسم والنوع يؤخذون من لوائح التلاميذ (رمز مسار).
   Data: DB.ptest = { years: { [sy]: [{ id, file, subj, phase, cls, lvl, items: [names], pupils: [{ code, name, g, abs, v: [0|1|null] }] }] } } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const { SB, tr, thr, tbl, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const nh = t => MK.hkey(t);
  const R = () => { const c = (DB.ptest = DB.ptest && typeof DB.ptest === 'object' ? DB.ptest : {}); c.years = c.years && typeof c.years === 'object' ? c.years : {}; return c; };
  const Y = sy => { const y = R().years; return y[sy] || (y[sy] = []); };
  const PH = { pre: 'رائز الموضعة القبلي', post: 'رائز الموضعة البعدي', diag: 'تشخيص التعلمات' };
  const SUBJ = ['اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الرياضيات', 'علوم الحياة والأرض', 'الفيزياء والكيمياء', 'الاجتماعيات', 'التربية الإسلامية', 'المعلوميات', 'التكنولوجيا الصناعية'];
  const pc = (a, b) => (b ? (a * 100 / b).toFixed(1).replace(/\.0$/, '') + '%' : '—');
  const pcn = (a, b) => (b ? a * 100 / b : 0);
  const sy0 = () => MK.curSy();
  const LV = () => K.LV;

  /* ---------- import ---------- */
  const isItem = v => /^\s*(item|بند|البند|المهارة|الكفاية|compétence|competence|q)\s*\d+/i.test(nm(v));
  const isCode = v => /^[A-Z]\d{8,10}$/i.test(nm(v));
  const isCls = v => /^\d\s*(APIC|ASC|AC|APG|BAC|TC)[A-Z]*\s*-\s*\d+$/i.test(nm(v)) || /^(TC|[12]BAC)[A-Z]*-\d+$/i.test(nm(v));
  const phaseOf = t => (/بعدي|post/i.test(t) ? 'post' : /قبلي|pre|pré/i.test(t) ? 'pre' : 'diag');
  const subjOf = t => { const n = nh(t); const s = SUBJ.find(x => n.includes(nh(x)) || n.includes(nh(x.replace(/^اللغة\s+/, '')))); if (s) return s; if (/math/i.test(t)) return 'الرياضيات'; if (/fran[cç]ais/i.test(t)) return 'اللغة الفرنسية'; if (/arabe/i.test(t)) return 'اللغة العربية'; if (/anglais|english/i.test(t)) return 'اللغة الإنجليزية'; return ''; };
  // one sheet: the header row holds the items («Item 1 – Fractions»…) and «الغياب»; each pupil row holds a Massar code
  function readSheet(rows, file, sheet) {
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 40) && hi < 0; i++) if ((rows[i] || []).filter(isItem).length >= 1) hi = i;
    if (hi < 0) return [];
    const H = (rows[hi] || []).map(nm);
    const itemCols = []; H.forEach((h, j) => { if (isItem(h)) itemCols.push(j); });
    const seen = {}; const items = itemCols.map(j => { const b = H[j].replace(/\s+/g, ' ').trim(); seen[b] = (seen[b] || 0) + 1; return seen[b] > 1 ? `${b} (${seen[b]})` : b; });
    const absC = H.findIndex(h => /^الغياب$|^غائب|absen/i.test(h));
    const top = rows.slice(0, hi + 1).map(r => (r || []).map(nm).join(' ')).join(' ') + ' ' + file + ' ' + sheet;
    const subj = subjOf(top), phase = phaseOf(top);
    const metaCls = (() => { for (let i = 0; i <= hi; i++) for (const c of rows[i] || []) if (isCls(c)) return nm(c).replace(/\s+/g, ''); return ''; })();
    const out = [];
    rows.slice(hi + 1).forEach(r => {
      r = r || []; const ci = r.findIndex(isCode); if (ci < 0) return;
      const code = nm(r[ci]).toUpperCase();
      const name = nm(r[ci + 1]) && !/^\d+$/.test(nm(r[ci + 1])) ? nm(r[ci + 1]) : nm(r[ci - 1]);
      const clsCells = r.filter(c => isCls(nm(c).replace(/_\d+$/, ''))).map(c => nm(c).replace(/_\d+$/, '').replace(/\s+/g, ''));
      const abs = absC >= 0 ? /^(نعم|غ|غائب|x|oui|1)$/i.test(nm(r[absC])) : false;
      const v = itemCols.map(j => { const x = nm(r[j]); if (x === '') return null; const n = Number(x.replace(',', '.')); return isFinite(n) ? (n > 0 ? 1 : 0) : (/^(ت|متحكم|✓|oui|acquis)/i.test(x) ? 1 : 0); });
      out.push({ code, name, abs: abs || v.every(x => x == null), v, cls0: clsCells[clsCells.length - 1] || metaCls });
    });
    return out.length ? [{ file, sheet, subj, phase, items, pupils: out }] : [];
  }
  // level, class and gender from the imported pupils lists (by the Massar code), else from the file
  function enrich(rec, sy) {
    const by = new Map(); try { Object.values((DB.pupils && DB.pupils.years) || {}).forEach(y0 => (y0.pupils || []).forEach(p => { const c = nm(p.code).toUpperCase(); if (c && !by.has(c)) by.set(c, p); })); (Pupils.Y(sy).pupils || []).forEach(p => by.set(nm(p.code).toUpperCase(), p)); } catch (_) {}
    rec.pupils.forEach(p => { const x = by.get(p.code); if (x) { p.cls = x.cls || p.cls0; p.lvl = x.lvl || ''; p.g = x.g || ''; if (!p.name) p.name = `${x.last || ''} ${x.first || ''}`.trim(); } else { p.cls = p.cls0; p.lvl = (LV().ofClass(p.cls0)[0]) || ''; } });
  }
  async function importFiles() {
    const res = await window.api.openTables();
    if (!res || !res.files) return;
    const sy = sy0(), found = [];
    res.files.forEach(f => (f.sheets || []).forEach(sh => readSheet(sh.rows || [], f.name, sh.name).forEach(x => found.push(x))));
    if (!found.length) return toast('لم يتم العثور على نتائج روائز (أعمدة Item 1، Item 2… ورقم التلميذ)', true);
    let nP = 0, nR = 0, noSubj = 0;
    found.forEach(x => {
      enrich(x, sy);
      if (!x.subj) noSubj++;
      // one record per class (a file can hold several classes)
      const byC = {}; x.pupils.forEach(p => { (byC[p.cls || '—'] = byC[p.cls || '—'] || []).push(p); });
      Object.keys(byC).forEach(c => {
        const L = byC[c], lvl = (() => { const n = {}; L.forEach(p => { if (p.lvl) n[p.lvl] = (n[p.lvl] || 0) + 1; }); return Object.keys(n).sort((a, b) => n[b] - n[a])[0] || (LV().ofClass(c)[0] || ''); })();
        const subj = x.subj || 'مادة غير محددة';
        const arr = Y(sy), i = arr.findIndex(r => r.cls === c && r.subj === subj && r.phase === x.phase);
        const rec = { id: i >= 0 ? arr[i].id : uid('pt'), file: x.file, subj, phase: x.phase, cls: c, lvl, items: x.items, pupils: L.map(p => ({ code: p.code, name: p.name, g: p.g || '', abs: p.abs, v: p.v })), at: new Date().toISOString() };
        if (i >= 0) arr[i] = rec; else arr.push(rec);
        nP += L.length; nR++;
      });
    });
    persist(); go('ptest');
    toast(`تم استيراد ${nP} تلميذ(ة) في ${nR} قسم/مادة${noSubj ? ` — ${noSubj} ملف دون مادة محددة` : ''}`);
  }

  /* ---------- statistics ---------- */
  const recsOf = (sy, f) => Y(sy).filter(r => (!f.subj || r.subj === f.subj) && (!f.phase || r.phase === f.phase) && (!f.lvl || r.lvl === f.lvl) && (!f.cls || r.cls === f.cls));
  const thrOf = (n, t) => Math.max(1, Math.min(n, +t || Math.ceil(n / 2)));
  function stat(list, nItems) {
    const pres = list.filter(p => !p.abs), o = { n: list.length, abs: list.length - pres.length, pres: pres.length, item: [], f: pres.filter(p => p.g === 'F').length, m: pres.filter(p => p.g === 'M').length };
    for (let i = 0; i < nItems; i++) {
      const ok = pres.filter(p => p.v[i] === 1), ko = pres.filter(p => p.v[i] === 0);
      o.item.push({ ok: ok.length, ko: ko.length, okF: ok.filter(p => p.g === 'F').length, okM: ok.filter(p => p.g === 'M').length, koF: ko.filter(p => p.g === 'F').length, koM: ko.filter(p => p.g === 'M').length });
    }
    return o;
  }
  const score = p => p.v.filter(x => x === 1).length;
  const lvName = k => (k ? LV().ar(k) : 'مستوى غير محدد');
  const sortCls = (a, b) => String(a).localeCompare(String(b), 'fr', { numeric: true });

  /* ---------- page ---------- */
  const st = { subj: '', phase: '', lvl: '' };
  function page(v) {
    const sy = sy0(), all = Y(sy);
    const subjs = Array.from(new Set(all.map(r => r.subj))), lvls = LV().sort(Array.from(new Set(all.map(r => r.lvl).filter(Boolean))));
    const L = recsOf(sy, st);
    const cards = (() => {
      const key = r => `${r.subj}|${r.phase}|${r.lvl}`; const G = {};
      L.forEach(r => { (G[key(r)] = G[key(r)] || []).push(r); });
      return Object.keys(G).sort().map(k => {
        const R0 = G[k], r0 = R0[0], P = R0.reduce((a, r) => a.concat(r.pupils), []), S = stat(P, r0.items.length);
        const avg = S.pres && r0.items.length ? S.item.reduce((a, x) => a + x.ok, 0) * 100 / (S.pres * r0.items.length) : 0;
        return `<div class="card" style="margin-bottom:12px"><div class="card-h"><h3>${esc(r0.subj)} — ${esc(lvName(r0.lvl))} <span class="muted" style="font-weight:400;font-size:12.5px">(${esc(PH[r0.phase])})</span></h3><span class="sp"></span>
          <span class="muted" style="font-size:12.5px">${R0.length} قسم — ${S.n} تلميذ(ة)، الحاضرون ${S.pres}، الغائبون ${S.abs} — نسبة التحكم الإجمالية <b style="color:${avg >= 50 ? '#1e8449' : '#c0392b'}">${avg.toFixed(1)}%</b></span></div>
          <div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>البند</th><th>الحاصلون على 1</th><th>نسبة التحكم</th><th>الحاصلون على 0</th><th style="min-width:180px"></th></tr></thead><tbody>
          ${r0.items.map((it, i) => { const x = S.item[i], p = pcn(x.ok, x.ok + x.ko); return `<tr><td dir="ltr" style="text-align:right">${esc(it)}</td><td class="num">${x.ok}</td><td class="num"><b>${pc(x.ok, x.ok + x.ko)}</b></td><td class="num">${x.ko}</td><td><div style="height:10px;border-radius:5px;background:#f1d4d4"><div style="height:10px;border-radius:5px;width:${p.toFixed(0)}%;background:${p >= 50 ? '#27ae60' : '#e67e22'}"></div></div></td></tr>`; }).join('')}
          </tbody></table></div></div>`;
      }).join('');
    })();
    v.innerHTML = `<div class="page-h"><h1>روائز الموضعة وتشخيص التعلمات</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="ptDocs">${ic('print')} الوثائق والشبكات</button>${all.length ? `<button class="btn danger" id="ptClr">${ic('trash')} مسح نتائج الموسم</button>` : ''}<button class="btn pri" id="ptImp">${ic('up')} استيراد النتائج من مسار</button></div>
      <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">استورد ملفات نتائج تشخيص التعلمات / روائز الموضعة المصدرة من منظومة مسار (لكل قسم ولكل مادة: البنود Item 1، Item 2… بقيمة 1 أو 0، والغياب). يُحدَّد <b>المستوى والقسم والنوع من لوائح التلاميذ</b> المستوردة (رقم مسار). بعد الاستيراد: نسب التحكم حسب البند والمستوى، شبكات التفريغ، إجمالي المستوى، مقارنة القبلي والبعدي، ولائحة المعنيين بالدعم ومجموعاتهم.</div>
      ${all.length ? `<div class="card" style="margin-bottom:12px"><div class="card-b btn-row" style="gap:8px;flex-wrap:wrap">
        <select class="inp" id="ptS" style="width:auto"><option value="">كل المواد</option>${subjs.map(x => `<option ${st.subj === x ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select>
        <select class="inp" id="ptP" style="width:auto"><option value="">كل الروائز</option>${Object.keys(PH).filter(k => all.some(r => r.phase === k)).map(k => `<option value="${k}" ${st.phase === k ? 'selected' : ''}>${PH[k]}</option>`).join('')}</select>
        <select class="inp" id="ptL" style="width:auto"><option value="">كل المستويات</option>${lvls.map(k => `<option value="${k}" ${st.lvl === k ? 'selected' : ''}>${esc(lvName(k))}</option>`).join('')}</select></div></div>${cards || '<div class="empty-state">لا توجد نتائج لهذا الاختيار.</div>'}`
        : '<div class="empty-state">لم تُستورد نتائج بعد. اضغط «استيراد النتائج من مسار».</div>'}`;
    $('#ptImp', v).onclick = importFiles;
    $('#ptDocs', v).onclick = () => go('ptestDoc', { kind: 'pt_grid' });
    if ($('#ptClr', v)) $('#ptClr', v).onclick = async () => { if (!(await confirmBox('مسح كل نتائج الروائز المستوردة لهذا الموسم؟', 'مسح'))) return; R().years[sy] = []; persist(); go('ptest'); };
    [['#ptS', 'subj'], ['#ptP', 'phase'], ['#ptL', 'lvl']].forEach(([id, k]) => { const el = $(id, v); if (el) el.onchange = () => { st[k] = el.value; go('ptest'); }; });
  }

  /* ---------- documents ---------- */
  const DOCS = [];
  const add = d => DOCS.push(d);
  const subjOpts = sy => [['', 'كل المواد']].concat(Array.from(new Set(Y(sy).map(r => r.subj))).map(x => [x, x]));
  const phOpts = () => [['', 'كل الروائز']].concat(Object.keys(PH).map(k => [k, PH[k]]));
  const lvOpts = sy => [['', 'كل المستويات']].concat(LV().sort(Array.from(new Set(Y(sy).map(r => r.lvl).filter(Boolean)))).map(k => [k, lvName(k)]));
  const clsOpts = sy => [['', 'كل الأقسام']].concat(Array.from(new Set(Y(sy).map(r => r.cls))).sort(sortCls).map(c => [c, c]));
  const baseDefs = (sy, cls) => [{ k: 'subj', l: 'المادة', t: 'select', half: true, opts: () => subjOpts(sy) }, { k: 'phase', l: 'الرائز', t: 'select', half: true, opts: phOpts },
    { k: 'lvl', l: 'المستوى', t: 'select', half: true, opts: () => lvOpts(sy) }].concat(cls ? [{ k: 'cls', l: 'القسم', t: 'select', half: true, opts: () => clsOpts(sy) }] : []);
  const empty = () => [{ html: '<p class="sb-p" style="text-align:center">لا توجد نتائج مستوردة لهذا الاختيار: استورد نتائج الروائز من مسار في «روائز الموضعة وتشخيص التعلمات».</p>' }];
  const capOf = r => `${esc(r.subj)} — ${esc(PH[r.phase])} — القسم: <bdi dir="ltr">${esc(r.cls)}</bdi> (${esc(lvName(r.lvl))})`;

  add({
    k: 'pt_grid', t: 'شبكة تفريغ النتائج والإحصائيات تحت الشبكة (لكل قسم ومادة)', grp: 'g', page: 'a4l',
    d: 'لكل قسم ومادة: التلاميذ والبنود (1 = متحكم فيه، 0 = غير متحكم فيه)، الغياب، عدد البنود المتحكم فيها، ثم تحت الشبكة: الحاصلون على 1 وعلى 0 لكل بند (العدد والنسبة) حسب النوع.',
    auto: 'نتائج الروائز المستوردة ولوائح التلاميذ',
    init: () => ({ subj: '', phase: '', lvl: '', cls: '', thr: '' }),
    defs: (f, sy) => baseDefs(sy, true).concat([{ k: 'thr', l: 'عتبة التحكم (عدد البنود، فارغ = نصف البنود)', t: 'num', half: true }]),
    build: (s, f, sy) => {
      const L = recsOf(sy, f).sort((a, b) => sortCls(a.cls, b.cls) || a.subj.localeCompare(b.subj, 'ar'));
      const pages = [];
      L.forEach(r => {
        const n = r.items.length, T = thrOf(n, f.thr), S = stat(r.pupils, n);
        const rows = r.pupils.map((p, i) => tr([i + 1, { t: p.code, c: 'sm', st: 'direction:ltr' }, { t: p.name, c: 'r b nw' }, { t: p.g === 'F' ? 'أنثى' : p.g === 'M' ? 'ذكر' : '', c: 'sm' }, p.abs ? { t: 'غائب(ة)', c: 'red b' } : '']
          .concat(r.items.map((_, j) => (p.abs || p.v[j] == null ? '' : { t: String(p.v[j]), c: p.v[j] ? 'b' : 'red b' })),
            [p.abs ? '' : { t: `${score(p)}/${n}`, c: 'b' }, p.abs ? '' : { t: score(p) >= T ? 'متحكم(ة)' : 'في حاجة إلى دعم', c: score(p) >= T ? 'sm' : 'red sm' }])));
        const it = k => r.items.map((_, j) => S.item[j][k]);
        const sumRow = (label, k, tot) => tr([{ t: label, s: 5, c: 'd b' }].concat(it(k).map((x, j) => ({ t: tot === 'pc' ? pc(x, S.item[j].ok + S.item[j].ko) : String(x), c: 'd b' })), [{ t: '', s: 2, c: 'd' }]));
        rows.push(sumRow('الحاصلون على 1', 'ok'), sumRow('النسبة', 'ok', 'pc'), sumRow('الحاصلون على 1 — إناث', 'okF'), sumRow('الحاصلون على 1 — ذكور', 'okM'), sumRow('الحاصلون على 0', 'ko'), sumRow('النسبة', 'ko', 'pc'));
        const head = thr(['ر.ت', 'رقم التلميذ', 'اسم التلميذ', 'النوع', 'الغياب'].concat(r.items.map(x => ({ t: x, c: 'd', st: 'font-size:7.5pt;direction:ltr' })), ['المجموع', 'الوضعية']).map(t => (typeof t === 'object' ? t : { t, c: 'd' })));
        const ok = r.pupils.filter(p => !p.abs && score(p) >= T).length;
        pages.push(...MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'شبكة تفريغ النتائج', `${capOf(r)} — الموسم الدراسي ${MK.syDash(sy)}`),
          blocks: [tbl(head, rows, 'cmp'), { html: `<div class="sb-note">المسجلون: <b>${S.n}</b> — الحاضرون: <b>${S.pres}</b> (إناث ${S.f}، ذكور ${S.m}) — الغائبون: <b>${S.abs}</b> — المتحكمون (${T} بنود فأكثر من ${n}): <b>${ok}</b> (${pc(ok, S.pres)}) — في حاجة إلى دعم: <b>${S.pres - ok}</b> (${pc(S.pres - ok, S.pres)}).</div>` }],
          sign: SB.sign(s, { right: 'الأستاذ(ة)', left: 'مدير(ة) المؤسسة' }) }));
      });
      return { page: 'a4l', pages: pages.length ? pages : MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'شبكة تفريغ النتائج'), blocks: empty() }) };
    }
  });

  add({
    k: 'pt_level', t: 'إجمالي المستوى: نتائج البنود حسب المستوى والمادة والأقسام', grp: 'a', page: 'a4',
    d: 'لكل مستوى ومادة: الحاصلون على 1 و0 لكل بند (العدد والنسبة، إناث وذكور)، الغياب، ثم نسبة التحكم في كل بند حسب الأقسام، مع ترتيب البنود من الأضعف إلى الأقوى.',
    auto: 'نتائج الروائز المستوردة',
    init: () => ({ subj: '', phase: '', lvl: '' }), defs: (f, sy) => baseDefs(sy, false),
    build: (s, f, sy) => {
      const L = recsOf(sy, f), G = {};
      L.forEach(r => { const k = `${r.lvl}|${r.subj}|${r.phase}`; (G[k] = G[k] || []).push(r); });
      const blocks = [];
      Object.keys(G).sort().forEach(k => {
        const R0 = G[k].sort((a, b) => sortCls(a.cls, b.cls)), r0 = R0[0], n = r0.items.length, P = R0.reduce((a, r) => a.concat(r.pupils), []), S = stat(P, n);
        blocks.push({ before: SB.cap(`${esc(lvName(r0.lvl))} — ${esc(r0.subj)} — ${esc(PH[r0.phase])}: ${S.n} تلميذ(ة)، الحاضرون ${S.pres}، الغائبون ${S.abs}`, 'r'), keepNext: true,
          table: tbl(thr(['البند', 'الحاصلون على 1', 'النسبة', 'إناث', 'ذكور', 'الحاصلون على 0', 'النسبة', 'إناث', 'ذكور'].map(t => ({ t, c: 'd' }))),
            r0.items.map((it, j) => { const x = S.item[j], t = x.ok + x.ko; return tr([{ t: it, c: 'r b', st: 'direction:ltr' }, x.ok, { t: pc(x.ok, t), c: 'b' }, x.okF, x.okM, x.ko, { t: pc(x.ko, t), c: x.ko * 2 > t ? 'red b' : '' }, x.koF, x.koM]); }), 'cmp').table });
        blocks.push({ before: SB.cap('نسبة التحكم في كل بند حسب الأقسام', 'r'), keepNext: true,
          table: tbl(thr(['القسم', 'الحاضرون'].concat(r0.items.map(x => ({ t: x, c: 'd', st: 'font-size:7.5pt;direction:ltr' })), ['المعدل']).map(t => (typeof t === 'object' ? t : { t, c: 'd' }))),
            R0.map(r => { const s1 = stat(r.pupils, n); const ps = s1.item.map(x => pcn(x.ok, x.ok + x.ko)); return tr([{ t: r.cls, c: 'b', st: 'direction:ltr' }, s1.pres].concat(s1.item.map(x => pc(x.ok, x.ok + x.ko)), [{ t: (ps.reduce((a, b) => a + b, 0) / (ps.length || 1)).toFixed(1) + '%', c: 'b' }])); }), 'cmp').table });
        const order = r0.items.map((it, j) => [it, pcn(S.item[j].ok, S.item[j].ok + S.item[j].ko)]).sort((a, b) => a[1] - b[1]);
        blocks.push({ html: `<div class="sb-note">البنود من الأضعف إلى الأقوى: ${order.map(([it, p]) => `<bdi dir="ltr">${esc(it)}</bdi> (${p.toFixed(1)}%)`).join(' ← ')}</div>` });
      });
      return { title: 'إجمالي المستوى — نتائج الروائز حسب البنود', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4', blocks: blocks.length ? blocks : empty(), sign: SB.sign(s, { right: '', left: 'مدير(ة) المؤسسة' }) };
    }
  });

  add({
    k: 'pt_cmp', t: 'مقارنة الرائز القبلي والرائز البعدي (التطور حسب البند)', grp: 'a', page: 'a4',
    d: 'لكل مستوى ومادة: نسبة التحكم في كل بند قبل الدعم وبعده والتطور بالنقط، ونسبة المتحكمين، مع مبيان.',
    auto: 'نتائج الرائزين القبلي والبعدي المستوردة',
    init: () => ({ subj: '', lvl: '' }), defs: (f, sy) => baseDefs(sy, false).filter(d => d.k !== 'phase'),
    build: (s, f, sy) => {
      const blocks = [], keys = Array.from(new Set(recsOf(sy, f).map(r => `${r.lvl}|${r.subj}`))).sort();
      keys.forEach(k => {
        const [lvl, subj] = k.split('|'), A = recsOf(sy, { lvl, subj, phase: 'pre' }), B = recsOf(sy, { lvl, subj, phase: 'post' });
        if (!A.length || !B.length) return;
        const items = A[0].items, SA = stat(A.reduce((a, r) => a.concat(r.pupils), []), items.length), SB2 = stat(B.reduce((a, r) => a.concat(r.pupils), []), items.length);
        const rows = items.map((it, j) => { const a = pcn(SA.item[j].ok, SA.item[j].ok + SA.item[j].ko), b = SB2.item[j] ? pcn(SB2.item[j].ok, SB2.item[j].ok + SB2.item[j].ko) : 0, d = b - a;
          return tr([{ t: it, c: 'r b', st: 'direction:ltr' }, a.toFixed(1) + '%', b.toFixed(1) + '%', { t: (d >= 0 ? '+' : '') + d.toFixed(1), c: d >= 0 ? 'b' : 'red b' }]); });
        blocks.push({ before: SB.cap(`${esc(lvName(lvl))} — ${esc(subj)}: قبلي ${SA.pres} حاضر(ة) / بعدي ${SB2.pres} حاضر(ة)`, 'r'), keepNext: true, table: tbl(thr(['البند', 'نسبة التحكم (القبلي)', 'نسبة التحكم (البعدي)', 'التطور (نقط)'].map(t => ({ t, c: 'd' }))), rows, 'cmp').table });
        try { blocks.push({ html: K.bars(items.map((x, j) => String(j + 1)), [{ name: 'القبلي', color: '#c0392b', vals: items.map((_, j) => +pcn(SA.item[j].ok, SA.item[j].ok + SA.item[j].ko).toFixed(1)) }, { name: 'البعدي', color: '#27ae60', vals: items.map((_, j) => SB2.item[j] ? +pcn(SB2.item[j].ok, SB2.item[j].ok + SB2.item[j].ko).toFixed(1) : 0) }], { h: 150 }) }); } catch (_) {}
      });
      return { title: 'مقارنة نتائج الرائز القبلي والرائز البعدي', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4', blocks: blocks.length ? blocks : [{ html: '<p class="sb-p" style="text-align:center">يلزم استيراد نتائج الرائز القبلي والرائز البعدي لنفس المستوى والمادة.</p>' }], sign: SB.sign(s, { right: '', left: 'مدير(ة) المؤسسة' }) };
    }
  });

  add({
    k: 'pt_support', t: 'لائحة التلاميذ المعنيين بالدعم ومجموعات الدعم حسب البند', grp: 's', page: 'a4',
    d: 'لكل قسم ومادة: التلاميذ دون عتبة التحكم مع البنود غير المتحكم فيها، ثم مجموعة دعم لكل بند (التلاميذ الحاصلون على 0).',
    auto: 'نتائج الروائز المستوردة',
    init: () => ({ subj: '', phase: '', lvl: '', cls: '', thr: '' }),
    defs: (f, sy) => baseDefs(sy, true).concat([{ k: 'thr', l: 'عتبة التحكم (عدد البنود، فارغ = نصف البنود)', t: 'num', half: true }]),
    build: (s, f, sy) => {
      const blocks = [];
      recsOf(sy, f).sort((a, b) => sortCls(a.cls, b.cls)).forEach(r => {
        const n = r.items.length, T = thrOf(n, f.thr), need = r.pupils.filter(p => !p.abs && score(p) < T);
        blocks.push({ before: SB.cap(`${capOf(r)} — المعنيون بالدعم: ${need.length}`, 'r'), keepNext: true,
          table: tbl(thr(['ر.ت', 'رقم التلميذ', 'الاسم الكامل', 'المجموع', 'البنود غير المتحكم فيها'].map(t => ({ t, c: 'd' }))),
            (need.length ? need : [null]).map((p, i) => (p ? tr([i + 1, { t: p.code, c: 'sm', st: 'direction:ltr' }, { t: p.name, c: 'r b' }, `${score(p)}/${n}`, { t: r.items.filter((_, j) => p.v[j] === 0).join('، '), c: 'sm', st: 'direction:ltr;text-align:right' }]) : tr([{ t: 'لا يوجد تلميذ(ة) دون العتبة', s: 5 }]))), 'cmp').table });
        const grp = r.items.map((it, j) => [it, r.pupils.filter(p => !p.abs && p.v[j] === 0)]).filter(([, L]) => L.length);
        if (grp.length) blocks.push({ html: `<div class="sb-note"><b>مجموعات الدعم حسب البند:</b> ${grp.map(([it, L]) => `<div style="margin:1mm 0"><bdi dir="ltr"><b>${esc(it)}</b></bdi> (${L.length}): ${L.map(p => esc(p.name)).join('، ')}</div>`).join('')}</div>` });
      });
      return { title: 'لائحة التلاميذ المعنيين بالدعم', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4', blocks: blocks.length ? blocks : empty(), sign: SB.sign(s, { right: 'الأستاذ(ة)', left: 'مدير(ة) المؤسسة' }) };
    }
  });

  add({
    k: 'pt_inst', t: 'الحصيلة على صعيد المؤسسة (المواد والمستويات)', grp: 'a', page: 'a4',
    d: 'جدول تركيبي: لكل مادة ومستوى ورائز: عدد الأقسام والتلاميذ والغائبين، نسبة التحكم الإجمالية، نسبة المتحكمين، والبند الأضعف.',
    auto: 'نتائج الروائز المستوردة',
    init: () => ({ phase: '', thr: '' }), defs: () => [{ k: 'phase', l: 'الرائز', t: 'select', half: true, opts: phOpts }, { k: 'thr', l: 'عتبة التحكم (عدد البنود، فارغ = نصف البنود)', t: 'num', half: true }],
    build: (s, f, sy) => {
      const G = {}; recsOf(sy, f).forEach(r => { const k = `${r.subj}|${r.lvl}|${r.phase}`; (G[k] = G[k] || []).push(r); });
      const rows = Object.keys(G).sort().map(k => {
        const R0 = G[k], r0 = R0[0], n = r0.items.length, P = R0.reduce((a, r) => a.concat(r.pupils), []), S = stat(P, n), T = thrOf(n, f.thr);
        const avg = S.pres && n ? S.item.reduce((a, x) => a + x.ok, 0) * 100 / (S.pres * n) : 0, ok = P.filter(p => !p.abs && score(p) >= T).length;
        const w = r0.items.map((it, j) => [it, pcn(S.item[j].ok, S.item[j].ok + S.item[j].ko)]).sort((a, b) => a[1] - b[1])[0] || ['', 0];
        return tr([{ t: r0.subj, c: 'r b' }, lvName(r0.lvl), { t: PH[r0.phase], c: 'sm' }, R0.length, S.n, S.abs, { t: avg.toFixed(1) + '%', c: 'b' }, pc(ok, S.pres), { t: `${w[0]} (${w[1].toFixed(1)}%)`, c: 'sm', st: 'direction:ltr' }]);
      });
      return { title: 'حصيلة نتائج الروائز على صعيد المؤسسة', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4',
        blocks: rows.length ? [tbl(thr(['المادة', 'المستوى', 'الرائز', 'الأقسام', 'التلاميذ', 'الغائبون', 'نسبة التحكم', 'نسبة المتحكمين', 'البند الأضعف'].map(t => ({ t, c: 'd' }))), rows, 'cmp')] : empty(), sign: SB.sign(s, { right: '', left: 'مدير(ة) المؤسسة' }) };
    }
  });

  const C = K.center({
    id: 'ptest', title: 'وثائق روائز الموضعة وتشخيص التعلمات', icon: '🧪', route: 'ptestDoc', hubRoute: 'ptestHub', years: () => Object.keys(R().years),
    groups: [['g', 'شبكات التفريغ'], ['a', 'التحليل والحصيلة'], ['s', 'الدعم']], groupTabs: true,
    docs: () => DOCS, store: sy => { const y = (R().docs = R().docs || {}); return y[sy] || (y[sy] = {}); },
    hubButtons: () => `<button class="btn" id="ptBack">${ic('back')} النتائج</button>`,
    onHub: v => { const b = $('#ptBack', v); if (b) b.onclick = () => go('ptest'); }
  });
  window.PTest = { readSheet, Y };
  window.pagePTest = v => page(v);
  window.pagePTestHub = (v, a) => C.hub(v, a);
  window.pagePTestDoc = (v, a) => C.doc(v, a);
})();
