'use strict';
/* 1.9.4 — استثمار نتائج المراقبة المستمرة (للمؤسسات غير الرائدة):
   استيراد ملفات «معدل نقط المراقبة المستمرة» من مسار (MoyenneCc_*.xlsx: ملف لكل قسم/مستوى، دفعة واحدة) ثم استثمارها على صعيد
   المؤسسة والمستوى والقسم: الثلاثة الأوائل، الحاصلون على المعدل حسب الجنس، أعلى/أدنى/المعدل الملاحظ، قرارات مجالس الأقسام،
   درجات التحكم في كل مادة، توزيع المعدلات على الفئات، لائحة الاستحقاق، لوائح التلاميذ المقترحين للدعم حسب المواد، ومحضر مجلس القسم.
   الجنس يُقرأ من بطاقة التلاميذ (رمز مسار) أو من ملفات «لائحة التلاميذ» المستوردة مع النقط.
   Data: DB.cc = { years: { [sy]: { s1: [cls], s2: [cls] } }, cfg: { pass, dec: [[name, op, v]], ok, mid } }
     cls = { id, file, inst, level, lvl, cls, sy, session, subjects:[names], pupils:[{ code, name, g, n:[notes], avg }] } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, ldate, bars, COL } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const nh = s => MK.hkey(s);
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const num = v => { const x = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/\s/g, '')); return isFinite(x) ? x : null; };
  const f2 = v => (v == null || !isFinite(v) ? '' : (Math.round(v * 100) / 100).toFixed(2));
  const pc = (a, b) => (b ? (a * 100 / b).toFixed(1) + '%' : '—');
  const npc = (a, b) => ({ h: `<bdi>${a}</bdi> <span style="font-size:.88em;color:#444">(<bdi dir="ltr">${pc(a, b)}</bdi>)</span>` });
  const SESS = [['s1', 'الدورة الأولى'], ['s2', 'الدورة الثانية']];
  const DEC0 = [['تنويه', 'ge', 8], ['تشجيع', 'ge', 7], ['لوحة الشرف', 'ge', 6], ['تنبيه', 'lt', 5], ['إنذار', 'lt', 4], ['توبيخ', 'lt', 2]];

  function migrate(db) {
    const c = db.cc = db.cc && typeof db.cc === 'object' ? db.cc : {};
    c.years = c.years && typeof c.years === 'object' ? c.years : {};
    c.cfg = Object.assign({ pass: 5, ok: 6, mid: 5, dec: DEC0.map(x => x.slice()) }, c.cfg || {});
  }
  const CC = () => { migrate(DB); return DB.cc; };
  const Y = sy => { const y = CC().years; const o = y[sy] || (y[sy] = {}); SESS.forEach(([k]) => { o[k] = Array.isArray(o[k]) ? o[k] : []; }); return o; };
  // scale of the notes: /10 in the primary school, /20 otherwise (thresholds follow)
  const scaleOf = list => (list.some(c => c.pupils.some(p => (p.avg || 0) > 10.001 || (p.n || []).some(x => (x || 0) > 10.001))) ? 20 : 10);
  const tv = (v, sc) => (sc === 20 ? v * 2 : v);
  const gAr = g => (g === 'F' ? 'أنثى' : g === 'M' ? 'ذكر' : '');

  /* ---------- import ---------- */
  function readMoy(rows, file, sheet) {
    const S = r => (rows[r] || []).map(x => nm(x));
    let hi = -1;
    for (let i = 0; i < Math.min(rows.length, 25) && hi < 0; i++) { const r = S(i).map(nh); if (r.includes('رقمالتلميذ') && r.some(x => x === 'المعدل')) hi = i; }
    if (hi < 0) return null;
    const H = S(hi), Hn = H.map(nh);
    const meta = rx => { for (let i = 0; i < hi; i++) { const r = S(i); for (let j = 0; j < r.length; j++) if (rx.test(r[j])) { for (let k = j + 1; k < r.length; k++) if (r[k] && !/[:：]\s*$/.test(r[k]) && !rx.test(r[k])) return r[k]; } } return ''; };
    const ci = Hn.indexOf('رقمالتلميذ'), ni = Hn.findIndex(x => /^اسمالتلميذ|^الاسموالنسب|^الاسم$/.test(x)), ai = Hn.indexOf('المعدل');
    const subjCols = []; for (let j = Math.max(ci, ni) + 1; j < ai; j++) if (H[j]) subjCols.push(j);
    const pupils = [];
    rows.slice(hi + 1).forEach(r => {
      const code = nm((r || [])[ci]).toUpperCase(); if (!code || !/^[A-Z]\d{6,}/.test(code)) return;
      const n = subjCols.map(j => num((r || [])[j]));
      let avg = num((r || [])[ai]);
      if (avg == null) { const v = n.filter(x => x != null); avg = v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; }
      pupils.push({ code, name: nm((r || [])[ni]), g: '', n, avg });
    });
    if (!pupils.length) return null;
    const ses = meta(/الدورة/);
    const level = meta(/المستوى/), cls = meta(/القسم/);
    return { id: uid('cc'), file, sheet, inst: meta(/مؤسسة|المؤسسة/), level, lvl: K.LV.fromLabel(level), cls: cls && !/^Export/i.test(cls) ? cls : sheet, sy: (meta(/السنة الدراسية/) || '').replace(/\s/g, ''),
      session: /الثاني|الثانية|2/.test(ses) ? 's2' : 's1', subjects: subjCols.map(j => H[j]), pupils };
  }
  // «لائحة التلاميذ» of Massar: only the gender of each pupil is taken
  function readList(rows) {
    const out = {};
    let hi = -1, ci = -1, gi = -1;
    for (let i = 0; i < Math.min(rows.length, 25) && hi < 0; i++) { const r = (rows[i] || []).map(nh); const c = r.findIndex(x => x === 'الرمز' || x === 'رقمالتلميذ'), g = r.findIndex(x => x === 'النوع' || x === 'الجنس'); if (c >= 0 && g >= 0) { hi = i; ci = c; gi = g; } }
    if (hi < 0) return out;
    rows.slice(hi + 1).forEach(r => { const c = nm((r || [])[ci]).toUpperCase(); const g = nm((r || [])[gi]); if (c) out[c] = /أنثى|انثى|^f/i.test(g) ? 'F' : /ذكر|^m/i.test(g) ? 'M' : ''; });
    return out;
  }
  const genderFromPupils = (sy, code) => { try { const p = (window.Pupils ? Pupils.Y(sy).pupils : []).find(x => x.code === code); return p ? (p.g === 'F' ? 'F' : 'M') : ''; } catch (_) { return ''; } };
  async function importFiles(v) {
    const res = await window.api.openTables();
    if (!res || !res.files) return;
    const found = [], genders = {};
    res.files.forEach(f => (f.sheets || []).forEach(sh => {
      const c = readMoy(sh.rows || [], f.name, sh.name);
      if (c) found.push(c); else Object.assign(genders, readList(sh.rows || []));
    }));
    if (!found.length) return toast('لم يتم العثور على ملفات «معدل نقط المراقبة المستمرة» (رقم التلميذ، اسم التلميذ، المواد، المعدل)', true);
    const sys = Array.from(new Set(found.map(c => c.sy).filter(x => /^\d{4}\/\d{4}$/.test(x))));
    const sy = sys.length === 1 ? sys[0] : MK.curSy();
    let nG = 0;
    found.forEach(c => c.pupils.forEach(p => { p.g = genders[p.code] || genderFromPupils(sy, p.code) || ''; if (p.g) nG++; }));
    // 1.9.4: level and class from the imported pupils lists (by the Massar code), in every cycle
    try { if (window.Pupils && Pupils.locate) found.forEach(c => { const L = Pupils.locate(c.pupils.map(p => p.code), sy); if (L.lvl) { c.lvl = L.lvl; c.level = K.LV.ar(L.lvl); } if (L.cls && (!c.cls || c.cls === c.sheet)) c.cls = L.cls; }); } catch (_) {}
    const nP = found.reduce((a, c) => a + c.pupils.length, 0);
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin-top:0;line-height:1.8">تم العثور على <b>${found.length}</b> لائحة (قسم / مستوى) فيها <b>${nP}</b> تلميذ(ة)، الجنس معروف لـ <b>${nG}</b> منهم${nG < nP ? ' <span class="muted">(أضف ملفات «لائحة التلاميذ» من مسار أو استورد بطاقة التلاميذ لمعرفة جنس الباقين)</span>' : ''}.</p>
      <div class="fgrid"><div class="fld"><label>الموسم الدراسي</label><select class="inp" id="ccSy">${MK.syList(sys).map(y => `<option value="${y}" ${y === sy ? 'selected' : ''}>${MK.syDash(y)}</option>`).join('')}</select></div>
      <div class="fld"><label>الدورة</label><select class="inp" id="ccSe"><option value="">كما في الملفات</option>${SESS.map(([k, l]) => `<option value="${k}">${l}</option>`).join('')}</select></div></div>
      <div class="ag-wrap" style="max-height:40vh"><table class="tbl compact"><thead><tr><th>الملف</th><th>المستوى</th><th>القسم</th><th>الدورة</th><th>المواد</th><th>التلاميذ</th></tr></thead><tbody>
      ${found.map(c => `<tr><td class="muted" style="font-size:12px">${esc(c.file)}</td><td>${esc(c.level)}</td><td dir="ltr" style="text-align:right">${esc(c.cls)}</td><td>${SESS.find(x => x[0] === c.session)[1]}</td><td class="num">${c.subjects.length}</td><td class="num">${c.pupils.length}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted" style="font-size:12px">لائحة مستوردة لنفس المستوى والقسم والدورة تعوض السابقة.</p>`;
    modal({ title: 'استيراد معدلات المراقبة المستمرة', size: 'xl', body, actions: [{ label: ic('up') + ' استيراد', cls: 'pri', onClick: m => {
      const y = $('#ccSy', m).value, se = $('#ccSe', m).value;
      found.forEach(c => { const k = se || c.session; c.session = k; const arr = Y(y)[k]; const i = arr.findIndex(x => x.lvl === c.lvl && x.level === c.level && x.cls === c.cls); if (i >= 0) arr.splice(i, 1, c); else arr.push(c); });
      MK.setSy(y); persist(); state.ses = se || found[0].session; toast(`تم استيراد ${nP} تلميذ(ة) من ${found.length} لائحة`); go('cceval');
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- computations ---------- */
  const decOf = (avg, cfg, sc) => {
    if (avg == null) return '';
    const D = cfg.dec || DEC0;
    const ge = D.filter(d => d[1] === 'ge').sort((a, b) => b[2] - a[2]).find(d => avg >= tv(+d[2], sc));
    if (ge) return ge[0];
    const lt = D.filter(d => d[1] === 'lt').sort((a, b) => a[2] - b[2]).find(d => avg < tv(+d[2], sc));
    return lt ? lt[0] : '';
  };
  const mastery = (v, cfg, sc) => (v == null ? '' : v >= tv(+cfg.ok, sc) ? 'ok' : v >= tv(+cfg.mid, sc) ? 'mid' : 'no');
  function model(sy, ses, f) {
    const all = Y(sy)[ses] || [];
    const list = all.filter(c => (!f.lvl || c.lvl === f.lvl || c.level === f.lvl) && (!f.cls || c.id === f.cls));
    const sc = scaleOf(all.length ? all : list), cfg = CC().cfg;
    const subjects = []; list.forEach(c => c.subjects.forEach(s => { if (!subjects.includes(s)) subjects.push(s); }));
    const P = []; list.forEach(c => c.pupils.forEach(p => P.push(Object.assign({ cls: c.cls, level: c.level, lvl: c.lvl, cid: c.id, notes: Object.fromEntries(c.subjects.map((s, j) => [s, p.n[j]])) }, p))));
    P.forEach(p => { p.dec = decOf(p.avg, cfg, sc); });
    const pass = tv(+cfg.pass, sc);
    const G = sel => { const a = P.filter(sel); const by = g => a.filter(p => p.g === g); return { m: by('M').length, f: by('F').length, t: a.length }; };
    const cntAll = G(() => true), cntPass = G(p => (p.avg || 0) >= pass);
    const stat = arr => { const v = arr.filter(x => x != null); return v.length ? { max: Math.max(...v), min: Math.min(...v), avg: v.reduce((a, b) => a + b, 0) / v.length, n: v.length } : { max: null, min: null, avg: null, n: 0 }; };
    const byG = g => stat(P.filter(p => !g || p.g === g).map(p => p.avg));
    const ranked = P.filter(p => p.avg != null).sort((a, b) => b.avg - a.avg || String(a.name).localeCompare(String(b.name), 'ar'));
    ranked.forEach((p, i) => { p.rank = i && ranked[i - 1].avg === p.avg ? ranked[i - 1].rank : i + 1; });
    const decs = (cfg.dec || DEC0).map(d => ({ n: d[0], ...G(p => p.dec === d[0]) }));
    const subj = ['المعدل'].concat(subjects).map(s => { const vals = P.map(p => (s === 'المعدل' ? p.avg : p.notes[s])).filter(x => x != null); const st = stat(vals);
      const m = { ok: 0, mid: 0, no: 0 }; vals.forEach(v => { m[mastery(v, cfg, sc)]++; });
      const B = sc === 20 ? [[16, 21], [14, 16], [12, 14], [10, 12], [8, 10], [6, 8], [4, 6], [0, 4]] : [[8, 11], [7, 8], [6, 7], [5, 6], [4, 5], [3, 4], [2, 3], [0, 2]];
      return { s, ...st, m, buckets: B.map(([a, b]) => ({ l: `[${String(a).padStart(2, '0')}-${String(Math.min(b, sc)).padStart(2, '0')}${b > sc ? ']' : '['}`, n: vals.filter(v => v >= a && v < b).length })) }; });
    const support = subjects.map(s => ({ s, list: P.filter(p => p.notes[s] != null && p.notes[s] < pass).sort((a, b) => a.notes[s] - b.notes[s]) }));
    return { list, sc, pass, subjects, P, cntAll, cntPass, all: byG(''), boys: byG('M'), girls: byG('F'), ranked, decs, subj, support, cfg };
  }

  /* ---------- the page ---------- */
  const state = { ses: 's1', lvl: '', cls: '' };
  function page(v) {
    const sy = MK.curSy(), y = Y(sy);
    if (!y[state.ses].length) { const other = SESS.find(([k]) => y[k].length); if (other) state.ses = other[0]; }
    const L = y[state.ses];
    const levels = Array.from(new Set(L.map(c => c.lvl || c.level))).sort((a, b) => K.LV.idx(a) - K.LV.idx(b));
    if (state.lvl && !levels.includes(state.lvl)) state.lvl = '';
    const classes = L.filter(c => !state.lvl || (c.lvl || c.level) === state.lvl);
    if (state.cls && !classes.some(c => c.id === state.cls)) state.cls = '';
    const M = model(sy, state.ses, { lvl: state.lvl, cls: state.cls });
    const kpi = (v1, l, c) => `<div class="card" style="padding:12px 14px;text-align:center"><div style="font-size:24px;font-weight:800;color:${c || '#0e5a4a'}">${v1}</div><div class="muted" style="font-size:12.5px">${l}</div></div>`;
    v.innerHTML = `<div><div class="page-h"><h1>استثمار نتائج المراقبة المستمرة</h1><span class="sub">المؤسسات غير الرائدة — الموسم ${esc(MK.syDash(sy))}</span><span class="sp"></span>
      <button class="btn pri" id="ccImp">${ic('up')} استيراد معدلات مسار (MoyenneCc)</button>${L.length ? `<button class="btn" id="ccDoc">${ic('print')} الوثائق والطباعة</button><button class="btn" id="ccCfg">${ic('gear')} الحدود والقرارات</button><button class="btn danger" id="ccDel">${ic('trash')} مسح الدورة</button>` : ''}</div>
      <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">استورد من منظومة مسار ملفات <b>«معدل نقط المراقبة المستمرة»</b> (ملف لكل قسم، أي عدد دفعة واحدة)، ويمكن إضافة ملفات <b>«لائحة التلاميذ»</b> لمعرفة جنس كل تلميذ(ة) (وإلا يُقرأ من بطاقة التلاميذ). يُحسب الاستثمار على صعيد المؤسسة والمستوى والقسم: الأوائل، الحاصلون على المعدل، قرارات مجالس الأقسام، درجات التحكم، توزيع المعدلات، لائحة الاستحقاق، لوائح الدعم حسب المواد ومحضر مجلس القسم.</div>
      <div class="seg" id="ccSes" style="margin-bottom:10px">${SESS.map(([k, l]) => `<button data-s="${k}" class="${state.ses === k ? 'on' : ''}">${l} (${y[k].length})</button>`).join('')}</div>
      ${L.length ? `<div class="card" style="margin-bottom:12px"><div class="card-b btn-row" style="gap:8px;flex-wrap:wrap"><select class="inp" id="ccL" style="width:auto"><option value="">كل المستويات (المؤسسة)</option>${levels.map(l => `<option value="${esc(l)}" ${state.lvl === l ? 'selected' : ''}>${esc(K.LV.byK(l) ? K.LV.ar(l) : l)}</option>`).join('')}</select>
        <select class="inp" id="ccC" style="width:auto"><option value="">كل الأقسام</option>${classes.map(c => `<option value="${c.id}" ${state.cls === c.id ? 'selected' : ''}>${esc(c.cls)} — ${esc(K.LV.byK(c.lvl) ? K.LV.sh(c.lvl) : c.level)}</option>`).join('')}</select><span class="sp"></span><span class="muted">سلم التنقيط: /${M.sc} — عتبة المعدل ${M.pass}</span></div></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:12px">${kpi(M.cntAll.t, 'عدد التلاميذ')}${kpi(M.cntPass.t, 'الحاصلون على المعدل')}${kpi(pc(M.cntPass.t, M.cntAll.t), 'نسبة النجاح', '#2e86c1')}${kpi(pc(M.cntPass.f, M.cntAll.f), 'نسبة الإناث الحاصلات على المعدل', '#c2185b')}${kpi(f2(M.all.avg), 'المعدل الملاحظ')}${kpi(f2(M.all.max) + ' / ' + f2(M.all.min), 'أعلى / أدنى معدل')}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div class="card"><div class="card-h"><h3>الثلاثة الأوائل</h3></div><div class="card-b"><table class="tbl compact"><thead><tr><th>الرتبة</th><th>الاسم والنسب</th><th>القسم</th><th>النوع</th><th>المعدل</th></tr></thead><tbody>${M.ranked.slice(0, 3).map(p => `<tr><td class="num b">${p.rank}</td><td>${esc(p.name)}</td><td dir="ltr">${esc(p.cls)}</td><td>${gAr(p.g)}</td><td class="num b">${f2(p.avg)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card"><div class="card-h"><h3>قرارات مجالس الأقسام</h3></div><div class="card-b"><table class="tbl compact"><thead><tr><th>القرار</th><th>ذكور</th><th>إناث</th><th>المجموع</th><th>النسبة</th></tr></thead><tbody>${M.decs.map(d => `<tr><td>${esc(d.n)}</td><td class="num">${d.m}</td><td class="num">${d.f}</td><td class="num b">${d.t}</td><td class="num">${pc(d.t, M.cntAll.t)}</td></tr>`).join('')}</tbody></table></div></div>
        <div class="card" style="grid-column:1/-1"><div class="card-h"><h3>المعدل الملاحظ ودرجات التحكم حسب المواد</h3></div><div class="card-b">${bars(M.subj.map(s => s.s), [{ name: 'متحكم', color: COL.g, vals: M.subj.map(s => s.m.ok) }, { name: 'متوسط', color: COL.o, vals: M.subj.map(s => s.m.mid) }, { name: 'غير متحكم', color: '#c0392b', vals: M.subj.map(s => s.m.no) }], { w: 900, h: 250, fs: 9 })}</div></div>
      </div>` : '<div class="empty-state">لا توجد معدلات مستوردة لهذه الدورة بعد. اضغط «استيراد معدلات مسار».</div>'}</div>`;
    $('#ccImp').onclick = () => importFiles(v);
    $$('#ccSes button').forEach(b => b.onclick = () => { state.ses = b.dataset.s; state.lvl = ''; state.cls = ''; page(v); });
    if ($('#ccL')) $('#ccL').onchange = e => { state.lvl = e.target.value; state.cls = ''; page(v); };
    if ($('#ccC')) $('#ccC').onchange = e => { state.cls = e.target.value; page(v); };
    if ($('#ccDoc')) $('#ccDoc').onclick = () => go('ccevalDoc', { ses: state.ses, lvl: state.lvl, cls: state.cls });
    if ($('#ccCfg')) $('#ccCfg').onclick = () => cfgDialog(() => page(v));
    if ($('#ccDel')) $('#ccDel').onclick = async () => { if (!await confirmBox(`مسح كل معدلات ${SESS.find(x => x[0] === state.ses)[1]} لهذا الموسم؟`, 'مسح')) return; Y(sy)[state.ses] = []; persist(); page(v); };
  }
  function cfgDialog(done) {
    const c = CC().cfg, d = c.dec.map(x => x.slice());
    const body = document.createElement('div');
    body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.8">الحدود محددة على سلم 10 (التعليم الابتدائي) وتُضاعف تلقائيا إذا كانت النقط على 20. هذه قيم افتراضية قابلة للتعديل حسب قرارات مجالس الأقسام.</p>
      <div class="fgrid"><div class="fld"><label>عتبة الحصول على المعدل</label><input class="inp" type="number" step="0.25" id="cP" value="${c.pass}"></div><div class="fld"><label>متحكم ابتداء من</label><input class="inp" type="number" step="0.25" id="cO" value="${c.ok}"></div><div class="fld"><label>متوسط ابتداء من</label><input class="inp" type="number" step="0.25" id="cM" value="${c.mid}"></div></div>
      <div class="sec-t">قرارات مجالس الأقسام</div>${d.map((x, i) => `<div style="display:grid;grid-template-columns:1fr 140px 100px;gap:6px;margin-bottom:5px"><input class="inp" data-n="${i}" value="${esc(x[0])}"><select class="inp" data-o="${i}"><option value="ge" ${x[1] === 'ge' ? 'selected' : ''}>المعدل ≥</option><option value="lt" ${x[1] === 'lt' ? 'selected' : ''}>المعدل &lt;</option></select><input class="inp" type="number" step="0.25" data-v="${i}" value="${x[2]}"></div>`).join('')}`;
    modal({ title: 'الحدود وقرارات مجالس الأقسام', body, actions: [{ label: ic('check') + ' حفظ', cls: 'pri', onClick: () => {
      c.pass = +$('#cP', body).value || 5; c.ok = +$('#cO', body).value || 6; c.mid = +$('#cM', body).value || 5;
      c.dec = d.map((x, i) => [$(`[data-n="${i}"]`, body).value.trim(), $(`[data-o="${i}"]`, body).value, +$(`[data-v="${i}"]`, body).value || 0]).filter(x => x[0]);
      persist(); done && done(); } }, { label: 'استرجاع القيم الافتراضية', onClick: () => { CC().cfg = { pass: 5, ok: 6, mid: 5, dec: DEC0.map(x => x.slice()) }; persist(); done && done(); } }, { label: 'إلغاء' }] });
  }

  /* ---------- documents ---------- */
  const KINDS = [['inst', 'استثمار النتائج على صعيد المؤسسة'], ['level', 'استثمار النتائج على صعيد المستوى'], ['class', 'استثمار نقط القسم'], ['merit', 'لائحة الاستحقاق'], ['support', 'لوائح التلاميذ المقترحين للدعم حسب المواد'], ['council', 'محضر مجلس القسم (القرارات)'], ['subj', 'تحليل النتائج حسب المواد']];
  function docPage(v, arg) {
    arg = arg || {};
    const sy = MK.curSy();
    MK.docPage(v, {
      title: 'استثمار نتائج المراقبة المستمرة', icon: '📊', modes: false, flow: true,
      state: { kind: arg.kind || (arg.cls ? 'class' : arg.lvl ? 'level' : 'inst'), ses: arg.ses || state.ses, lvl: arg.lvl || '', cls: arg.cls || '', city: S().city || '', date: Dx.todayIso() },
      back: () => go('cceval'),
      fname: st => (KINDS.find(k => k[0] === st.kind) || KINDS[0])[1],
      form: (box, st, refresh) => {
        const draw = () => {
          const L = Y(sy)[st.ses] || [];
          const levels = Array.from(new Set(L.map(c => c.lvl || c.level)));
          const classes = L.filter(c => !st.lvl || (c.lvl || c.level) === st.lvl);
          box.innerHTML = `<div class="sec-t">الوثيقة</div><div class="fld"><select class="inp" id="dK">${KINDS.map(([k, l]) => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="fld"><label>الدورة</label><select class="inp" id="dS">${SESS.map(([k, l]) => `<option value="${k}" ${st.ses === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            <div class="fld"><label>المستوى</label><select class="inp" id="dL"><option value="">${st.kind === 'level' ? 'كل المستويات (صفحة لكل مستوى)' : 'كل المستويات'}</option>${levels.map(l => `<option value="${esc(l)}" ${st.lvl === l ? 'selected' : ''}>${esc(K.LV.byK(l) ? K.LV.ar(l) : l)}</option>`).join('')}</select></div>
            <div class="fld"><label>القسم</label><select class="inp" id="dC"><option value="">${['class', 'council', 'support'].includes(st.kind) ? 'كل الأقسام (صفحة لكل قسم)' : 'كل الأقسام'}</option>${classes.map(c => `<option value="${c.id}" ${st.cls === c.id ? 'selected' : ''}>${esc(c.cls)} — ${esc(K.LV.byK(c.lvl) ? K.LV.sh(c.lvl) : c.level)}</option>`).join('')}</select></div>
            <div class="fgrid"><div class="fld"><label>حرر ب</label><input class="inp" id="dCi" value="${esc(st.city)}"></div><div class="fld"><label>التاريخ</label><input class="inp" type="date" id="dD" value="${esc(st.date)}"></div></div>`;
          $('#dK', box).onchange = e => { st.kind = e.target.value; draw(); refresh(); };
          $('#dS', box).onchange = e => { st.ses = e.target.value; st.lvl = ''; st.cls = ''; draw(); refresh(); };
          $('#dL', box).onchange = e => { st.lvl = e.target.value; st.cls = ''; draw(); refresh(); };
          $('#dC', box).onchange = e => { st.cls = e.target.value; refresh(); };
          $('#dCi', box).oninput = e => { st.city = e.target.value; refresh(); };
          $('#dD', box).onchange = e => { st.date = e.target.value; refresh(); };
        };
        draw(); refresh();
      },
      build: st => build(S(), sy, st)
    });
  }
  const sesName = k => (SESS.find(x => x[0] === k) || SESS[0])[1];
  const lvName = l => (K.LV.byK(l) ? K.LV.ar(l) : l);
  const hd = cells => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  function statBlocks(M, scope) {
    const top = tbl(hd(['الرتبة', 'الاسم والنسب', 'القسم', 'النوع', 'المعدل']), M.ranked.slice(0, 3).map(p => tr([p.rank, { t: p.name, c: 'r b' }, { h: `<bdi dir="ltr">${esc(p.cls)}</bdi>` }, gAr(p.g), { t: f2(p.avg), c: 'b' }])), 'cmp');
    const st1 = tbl(hd(['', 'ذكور', 'إناث', 'المجموع']), [tr([{ t: 'عدد التلاميذ', c: 'k' }, M.cntAll.m, M.cntAll.f, { t: M.cntAll.t, c: 'b' }]), tr([{ t: 'الحاصلون على المعدل', c: 'k' }, M.cntPass.m, M.cntPass.f, { t: M.cntPass.t, c: 'b' }]),
      tr([{ t: 'النسبة', c: 'k' }, pc(M.cntPass.m, M.cntAll.m), pc(M.cntPass.f, M.cntAll.f), { t: pc(M.cntPass.t, M.cntAll.t), c: 'b' }])], 'cmp');
    const st2 = tbl(hd(['', 'ذكور', 'إناث', scope]), [['أعلى معدل', 'max'], ['أدنى معدل', 'min'], ['المعدل الملاحظ', 'avg']].map(([l, k]) => tr([{ t: l, c: 'k' }, f2(M.boys[k]), f2(M.girls[k]), { t: f2(M.all[k]), c: 'b' }])), 'cmp');
    const dec = tbl(hd(['قرارات مجالس الأقسام', 'ذكور', 'إناث', 'المجموع', 'النسبة']), M.decs.map(d => tr([{ t: d.n, c: 'k' }, d.m, d.f, { t: d.t, c: 'b' }, pc(d.t, M.cntAll.t)])), 'cmp');
    const mas = tbl(hd(['درجة التحكم'].concat(M.subj.map(s => s.s))), [['متحكم', 'ok'], ['متوسط', 'mid'], ['غير متحكم', 'no']].map(([l, k]) => tr([{ t: l, c: 'k' }].concat(M.subj.map(s => npc(s.m[k], s.n))))), 'cmp sm');
    const sst = tbl(hd([''].concat(M.subj.map(s => s.s))), [['أعلى نقطة', 'max'], ['أدنى نقطة', 'min'], ['المعدل الملاحظ', 'avg']].map(([l, k]) => tr([{ t: l, c: 'k' }].concat(M.subj.map(s => f2(s[k]))))), 'cmp sm');
    return [{ html: '<div class="sb-cap">لائحة بأسماء الثلاثة الأوائل</div>' }, top, { html: '<div class="sb-cap" style="margin-top:2mm">إحصائيات</div>' }, st1, st2,
      dec, { html: '<div class="sb-cap" style="margin-top:2mm">النتائج حسب المواد</div>' }, sst, mas,
      { html: bars(M.subj.map(s => s.s), [{ name: 'متحكم', color: COL.g, vals: M.subj.map(s => s.m.ok) }, { name: 'متوسط', color: COL.o, vals: M.subj.map(s => s.m.mid) }, { name: 'غير متحكم', color: '#c0392b', vals: M.subj.map(s => s.m.no) }], { w: 960, h: 230, fs: 9 }) }];
  }
  function build(s, sy, st) {
    const L = Y(sy)[st.ses] || [];
    const sign = SB.sign(s, { right: `<span class="d">حرر ب: ${esc(st.city || s.city || '')} في: ${esc(ldate(st.date || Dx.todayIso()))}</span>`, left: 'توقيع وطابع مدير(ة) المؤسسة' });
    const sub = `${sesName(st.ses)} — الموسم الدراسي ${syText(sy)}`;
    const pages = (title, blocks, page) => MK.flowPages({ page: page || 'a4', cls: 'sb', head: SB.head(s, title, sub), blocks: blocks.concat([{ html: sign }]) });
    if (!L.length) return { page: 'a4', pages: pages('استثمار نتائج المراقبة المستمرة', [{ html: '<p class="sb-p" style="text-align:center">لا توجد معدلات مستوردة لهذه الدورة.</p>' }]) };
    const levels = Array.from(new Set(L.map(c => c.lvl || c.level))).sort((a, b) => K.LV.idx(a) - K.LV.idx(b));
    const classes = L.filter(c => (!st.lvl || (c.lvl || c.level) === st.lvl) && (!st.cls || c.id === st.cls));
    const K2 = st.kind;
    if (K2 === 'inst') return { page: 'a4', pages: pages('استثمار النتائج على صعيد المؤسسة', statBlocks(model(sy, st.ses, {}), 'المؤسسة')) };
    if (K2 === 'level') return { page: 'a4', pages: (st.lvl ? [st.lvl] : levels).flatMap(l => pages(`استثمار نقط المراقبة المستمرة — مستوى: ${lvName(l)}`, statBlocks(model(sy, st.ses, { lvl: l }), 'المستوى'))) };
    if (K2 === 'subj') { const M = model(sy, st.ses, { lvl: st.lvl, cls: st.cls });
      const B = M.subj[0].buckets.map(b => b.l);
      return { page: 'a4l', pages: pages(`تحليل النتائج حسب المواد${st.lvl ? ' — ' + lvName(st.lvl) : ''}`, [tbl(hd(['المادة', 'أعلى نقطة', 'أدنى نقطة', 'المعدل الملاحظ', 'متحكم', 'متوسط', 'غير متحكم'].concat(B)), M.subj.map(x => tr([{ t: x.s, c: 'k' }, f2(x.max), f2(x.min), { t: f2(x.avg), c: 'b' }, npc(x.m.ok, x.n), npc(x.m.mid, x.n), npc(x.m.no, x.n)].concat(x.buckets.map(b => b.n)))), 'cmp sm'),
        { html: bars(M.subj.map(x => x.s), [{ name: 'المعدل الملاحظ', color: COL.m, vals: M.subj.map(x => +f2(x.avg) || 0) }], { w: 1000, h: 220, fs: 9 }) },
        { html: `<p class="sb-note">سلم التنقيط /${M.sc}. متحكم ≥ ${tv(+M.cfg.ok, M.sc)}، متوسط ≥ ${tv(+M.cfg.mid, M.sc)}، غير متحكم &lt; ${tv(+M.cfg.mid, M.sc)} (حدود افتراضية قابلة للتعديل).</p>` }], 'a4l') }; }
    if (K2 === 'merit') { const M = model(sy, st.ses, { lvl: st.lvl, cls: st.cls });
      return { page: 'a4', pages: pages(`لائحة الاستحقاق${st.lvl ? ' — ' + lvName(st.lvl) : ''}`, [tbl(hd(['الرتبة', 'رقم مسار', 'الاسم والنسب', 'القسم', 'النوع', 'المعدل', 'القرار']), M.ranked.map(p => tr([{ t: p.rank, c: 'b' }, { h: `<bdi dir="ltr">${esc(p.code)}</bdi>`, c: 'sm' }, { t: p.name, c: 'r b' }, { h: `<bdi dir="ltr">${esc(p.cls)}</bdi>`, c: 'sm' }, gAr(p.g), { t: f2(p.avg), c: 'b' }, { t: p.dec, c: 'sm' }])), 'cmp')]) }; }
    // one page (or more) per class
    const per = (c, fn) => { const M = model(sy, st.ses, { cls: c.id }); return pages(fn.t(c), fn.b(M, c), fn.p); };
    if (K2 === 'class') return { page: 'a4l', pages: classes.flatMap(c => per(c, { t: c2 => `استثمار نقط القسم: ${c2.cls} — ${lvName(c2.lvl || c2.level)}`, b: (M, c2) => [tbl(hd(['ر.ت', 'الاسم والنسب', 'رقم مسار', 'الجنس'].concat(c2.subjects, ['المعدل', 'القرار', 'الرتبة'])),
      c2.pupils.map((p, i) => { const q = M.P.find(x => x.code === p.code) || {}; return tr([i + 1, { t: p.name, c: 'r b' }, { h: `<bdi dir="ltr">${esc(p.code)}</bdi>`, c: 'sm' }, gAr(p.g)].concat(p.n.map(x => f2(x)), [{ t: f2(p.avg), c: 'b' }, { t: q.dec || '', c: 'sm' }, q.rank || ''])); }), 'cmp sm')].concat(statBlocks(M, 'القسم').slice(2)), p: 'a4l' })).concat(classes.length ? [] : pages('استثمار نقط القسم', [])) , };
    if (K2 === 'support') return { page: 'a4', pages: classes.flatMap(c => per(c, { t: c2 => `لوائح التلاميذ المقترحين للدعم حسب المواد — القسم: ${c2.cls}`, b: M => [{ html: `<p class="sb-p">التلاميذ الحاصلون على أقل من ${M.pass} في المادة (مرتبون من الأضعف):</p>` }].concat(M.support.filter(x => x.list.length).map(x => ({ html: `<div class="sb-box" style="margin:1mm 0"><h4>${esc(x.s)} (${x.list.length})</h4><div style="columns:3;font-size:10pt;line-height:1.7">${x.list.map(p => `${esc(p.name)} <b>${f2(p.notes[x.s])}</b>`).join('<br>')}</div></div>` })), M.support.every(x => !x.list.length) ? [{ html: '<p class="sb-p" style="text-align:center">لا يوجد تلاميذ تحت العتبة في أي مادة.</p>' }] : []) })) };
    if (K2 === 'council') return { page: 'a4', pages: classes.flatMap(c => per(c, { t: c2 => `قرار مجلس القسم — القسم: ${c2.cls} (${lvName(c2.lvl || c2.level)})`, b: M => [tbl(hd(['ر.ت', 'الاسم والنسب', 'رقم مسار', 'الجنس', 'المعدل', 'قرار مجلس القسم', 'الرتبة']), M.P.map((p, i) => tr([i + 1, { t: p.name, c: 'r b' }, { h: `<bdi dir="ltr">${esc(p.code)}</bdi>`, c: 'sm' }, gAr(p.g), { t: f2(p.avg), c: 'b' }, { t: p.dec, c: 'b' }, p.rank || ''])), 'cmp'),
      tbl(hd(['القرار', 'ذكور', 'إناث', 'المجموع', 'النسبة']), M.decs.map(d => tr([{ t: d.n, c: 'k' }, d.m, d.f, { t: d.t, c: 'b' }, pc(d.t, M.cntAll.t)])), 'cmp'),
      { html: '<div class="sb-sign three" style="margin-top:4mm"><div>أعضاء مجلس القسم</div><div>الأستاذ(ة)</div><div>رئيس(ة) مجلس القسم</div></div>' }] })) };
    return { page: 'a4', pages: pages('استثمار النتائج', []) };
  }

  window.CCEval = { migrate, readMoy, readList, model: (sy, ses, f) => model(sy, ses || 's1', f || {}), Y };
  window.pageCceval = v => { migrate(DB); page(v); };
  window.pageCcevalDoc = (v, a) => { migrate(DB); docPage(v, a); };
})();
