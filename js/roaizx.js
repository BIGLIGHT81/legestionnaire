'use strict';
/* 1.9.4 — الروائز (تكملة):
   • رائز المستوى الأول = «تقييم التعليم الأولي» لمسار (13 كفاية في 6 مجالات، مكتسب / غير مكتسب، الغياب، الاستفادة من التعليم الأولي)، يستورد مع باقي الروائز
     وتعاد ملفات مسار نفسها مملوءة بالنتائج. (سابقا: شبكة إدخال لكل قسم (التلاميذ من بطاقة التلاميذ) بكفايات قابلة للتعديل في العربية والفرنسية والرياضيات،
     ثلاث درجات (متمكن / في طور التمكن / غير متمكن)، مع نتائج حسب الكفاية والجنس والقسم.
   • تقرير تمرير الروائز: الموضعة القبلية والبعدية ومراحل المراقبة المستمرة (المشاركة حسب المستوى، الظروف، الصعوبات، النتائج، التوصيات).
   • شبكات تفريغ الروائز: شبكة لكل قسم ولكل مادة بأسماء التلاميذ (لوائح مسار) وترويسة المؤسسة، لكل المستويات.
   Data: DB.roaizx = { years: { [sy]: { l1: { items: { ar:[{id,t}], fr:[...], math:[...] }, marks: { [code]: { [itemId]: 1|2|3 } }, extra: [{ code, name, g, cls }] }, docs: {} } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, ldate, bars, COL } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const pc = (a, b) => (b ? (a * 100 / b).toFixed(1) + '%' : '—');
  const npc = (a, b) => ({ h: `<bdi>${a}</bdi> <span style="font-size:.86em;color:#444">(<bdi dir="ltr">${pc(a, b)}</bdi>)</span>` });

  const SUBJ = [
    { k: 'ar', n: 'اللغة العربية', cats: ['مبتدئ', 'حرف', 'مقطع', 'كلمة', 'جملة', 'فقرة', 'أقصوصة', 'نص'] },
    { k: 'fr', n: 'اللغة الفرنسية', cats: ['Débutant', 'Lettre', 'Graphème complexe', 'Syllabe', 'Mot simple', 'Mot avancé', 'Phrase (d.p)', 'Phrase', 'Texte'] },
    { k: 'math', n: 'الرياضيات', cats: ['مبتدئ', 'رقم واحد', 'رقمان', 'جمع', 'طرح', 'ضرب', 'قسمة', 'تحدي'] }
  ];
  const PH = [['pre', 'روائز الموضعة القبلية'], ['post', 'روائز الموضعة البعدية']].concat(['الأولى', 'الثانية', 'الثالثة', 'الرابعة', 'الخامسة', 'السادسة'].map((w, i) => ['c' + (i + 1), `المراقبة المستمرة — المرحلة ${w}`]));
  const phName = k => (PH.find(x => x[0] === k) || PH[0])[1];
  // default competencies of the first level test (editable: the attachment of the request was not received)
  /* the first level test = «تقييم التعليم الأولي» of Massar (Evaluation Prescolaire): 13 competencies in 6 domains, marked
     «مكتسب / غير مكتسب» (Aquis / Non aquis), with «غائب» and «الاستفادة من التعليم الأولي»; ids = the hidden Massar item ids */
  const L1G = [['d1', 'استكشاف الذات والمحيط البيئي والتكنولوجي'], ['d2', 'بناء الأدوات الأساس لتنظيم التفكير'], ['d3', 'بناء أدوات التعبير اللغوي والتواصل'],
    ['d4', 'تطوير السلوك الحسي الحركي'], ['d5', 'بناء القيم وقواعد العيش المشترك'], ['d6', 'تنمية الذوق الفني والجمالي']].map(([k, n]) => ({ k, n }));
  const L1_ITEMS = {
    d1: [[548, 'أسمي مرافق من المحيط', 'E'], [549, 'أميز الحواس الخمسة', 'S']],
    d2: [[550, 'أميز الأشكال', 'F'], [551, 'أقرأ الأعداد', 'Ch']],
    d3: [[552, 'أقدم نفسي: أسمع كيف قدم عمر نفسه وأفعل مثله', '0'], [553, 'أقرأ حروفا', 'LAr'], [554, 'Je lis des lettres en majuscule', 'LFr']],
    d4: [[555, 'أتبع تعليمات تتطلب حركات كبيرة', 'M'], [556, 'أتبع تعليمات تتطلب حركات دقيقة', 'Gf']],
    d5: [[559, 'أميز السلوكات الحسنة والسلوكات السيئة', 'Com'], [560, 'أحفظ سورة قصيرة', 'R']],
    d6: [[557, 'أحفظ نشيدا', 'EA1'], [558, 'أعبر عن ذوقي بالتلوين', 'EA2']]
  };
  const defItems = () => Object.fromEntries(Object.entries(L1_ITEMS).map(([k, a]) => [k, a.map(([mid, t, code]) => ({ id: 'x' + mid, t, code, mid }))]));
  const LVLS = [[3, 'مكتسب', '#27ae60', '✔'], [1, 'غير مكتسب', '#c0392b', '✘']];
  const LV_ANY = LVLS.concat([[2, 'في طور الاكتساب', '#e67e22', '~']]);
  const allItems = L1 => L1G.flatMap(g => (L1.items[g.k] || []).map(it => Object.assign({ g: g.k }, it)));

  function migrate(db) {
    const r = db.roaizx = db.roaizx && typeof db.roaizx === 'object' ? db.roaizx : {};
    r.years = r.years && typeof r.years === 'object' ? r.years : {};
  }
  const RX = () => { migrate(DB); return DB.roaizx; };
  const Y = sy => { const y = RX().years; const o = y[sy] || (y[sy] = {}); o.docs = o.docs || {};
    const l1 = o.l1 = o.l1 || {};
    if (!l1.items || !l1.items.d1) l1.items = defItems();   // former draft (ar / fr / math) replaced by the Massar model
    l1.marks = l1.marks || {}; l1.extra = Array.isArray(l1.extra) ? l1.extra : []; l1.info = l1.info || {}; l1.src = Array.isArray(l1.src) ? l1.src : []; return o; };
  const pupils = (sy, lvl) => { const P = window.Pupils ? Pupils.current(sy) : []; return P.filter(p => !lvl || p.lvl === lvl).map(p => ({ code: p.code, name: nm(`${p.last || ''} ${p.first || ''}`) || p.name || '', g: p.g === 'F' ? 'F' : 'M', cls: p.cls || '', unit: p.unit || '', lvl: p.lvl })); };
  const l1Pupils = sy => {
    const L1 = Y(sy).l1, all = pupils(sy), seen = new Set();
    const inSrc = new Set(L1.src.flatMap(x => Object.keys(x.rows || {})).concat(Object.keys(L1.marks)));
    const out = all.filter(p => p.lvl === 'P1' || inSrc.has(String(p.code).toUpperCase())).map(p => { seen.add(String(p.code).toUpperCase()); return p; })
      .concat(L1.extra.filter(x => !seen.has(String(x.code).toUpperCase())).map(x => Object.assign({ lvl: 'P1', unit: '' }, x)));
    return out.sort((a, b) => String(a.cls).localeCompare(String(b.cls)) || String(a.name).localeCompare(String(b.name), 'ar'));
  };
  const classesOf = list => Array.from(new Set(list.map(p => p.cls || '—')));
  const gAr = g => (g === 'F' ? 'أنثى' : g === 'M' ? 'ذكر' : '—');

  /* ---------- level 1: entry page ---------- */
  const st1 = { cls: '' };
  function pageL1(v, emb) {
    if (emb !== undefined) st1.emb = !!emb;
    const sy = MK.curSy(), y = Y(sy), L1 = y.l1;
    const all = l1Pupils(sy), cls = classesOf(all);
    if (!st1.cls || !cls.includes(st1.cls)) st1.cls = cls[0] || '';
    const list = all.filter(p => (p.cls || '—') === st1.cls);
    const items = allItems(L1);
    const info = c => L1.info[c] || {};
    const cell = (code, it) => { const x = (L1.marks[code] || {})[it.id] || 0; const l = LV_ANY.find(z => z[0] === x); return `<td class="l1c s${x}" data-p="${esc(code)}" data-i="${it.id}" title="${l ? l[1] : 'فارغ'}">${l ? `<span style="color:${l[2]};font-weight:800">${l[3]}</span>` : ''}</td>`; };
    const nOk = code => items.filter(it => (L1.marks[code] || {})[it.id] === 3).length;
    v.innerHTML = `<div class="${st1.emb ? 'btn-row' : 'page-h'}" style="${st1.emb ? 'margin:0 0 10px;align-items:center' : ''}">${st1.emb ? '<b style="font-size:15px">رائز المستوى الأول (تقييم التعليم الأولي)</b>' : '<h1>رائز المستوى الأول (تقييم التعليم الأولي)</h1>'}<span class="sub">الموسم ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="l1Imp">${ic('up')} استيراد ملفات مسار</button>${L1.src.length ? `<button class="btn" id="l1Exp">${ic('down')} ملفات مسار المعبأة (${L1.src.length})</button>` : ''}
        <button class="btn" id="l1Items">${ic('edit')} الكفايات</button><button class="btn" id="l1Add">${ic('plus')} تلميذ(ة)</button><button class="btn pri" id="l1Doc">${ic('print')} النتائج والشبكات</button></div>
      <div class="card" style="padding:10px 14px;margin-bottom:10px;line-height:1.85;font-size:12.8px">استورد ملفات «تقييم التعليم الأولي» (EvaluationPrescolaire) المحملة من مسار لكل قسم — مع باقي ملفات الروائز أو من هنا — ثم انقر على الخانات: فارغة ← <b style="color:#27ae60">✔ مكتسب</b> ← <b style="color:#c0392b">✘ غير مكتسب</b>. زر «ملفات مسار المعبأة» يعيد نفس ملفات مسار مملوءة بالنتائج (Aquis / Non aquis، والغياب X) جاهزة للرفع في منظومة مسار.</div>
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="gap:8px;flex-wrap:wrap">
        ${cls.length ? `<select class="inp" id="l1C" style="width:auto">${cls.map(c => `<option ${c === st1.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select>` : ''}<span class="sp"></span><span class="muted">${list.length} تلميذ(ة) في القسم — انقر على عنوان كفاية لوضع «مكتسب» لكل القسم</span></div></div>
      ${list.length ? `<div class="card"><div class="tk-scroll"><table class="tk-grid l1g"><thead>
        <tr><th rowspan="2">ر.ت</th><th rowspan="2">الاسم والنسب</th><th rowspan="2">غائب</th><th rowspan="2">التعليم الأولي</th>${L1G.map(g => { const n = (L1.items[g.k] || []).length; return n ? `<th colspan="${n}" class="l1d">${esc(g.n)}</th>` : ''; }).join('')}<th rowspan="2">مكتسب</th></tr>
        <tr>${items.map(it => `<th class="l1h" data-col="${it.id}" title="${esc(it.t)}">${esc(it.t)}${it.code ? ` <small dir="ltr">(${esc(it.code)})</small>` : ''}</th>`).join('')}</tr></thead>
        <tbody>${list.map((p, i) => { const f = info(p.code); return `<tr class="${f.abs ? 'l1abs' : ''}"><td>${i + 1}</td><td style="text-align:right;white-space:nowrap"><b>${esc(p.name)}</b></td>
          <td class="l1t" data-abs="${esc(p.code)}">${f.abs ? '<b style="color:#c0392b">X</b>' : ''}</td><td class="l1t" data-pre="${esc(p.code)}">${esc(f.pre || '—')}</td>
          ${items.map(it => cell(p.code, it)).join('')}<td class="b">${nOk(p.code)}/${items.length}</td></tr>`; }).join('')}</tbody></table></div></div>`
      : `<div class="empty-state">لا يوجد تلاميذ في المستوى الأول. استورد ملفات «تقييم التعليم الأولي» من مسار، أو لوائح التلاميذ في «بطاقة التلاميذ».</div>`}`;
    const again = () => pageL1(v);
    if ($('#l1C')) $('#l1C').onchange = e => { st1.cls = e.target.value; again(); };
    $$('.l1c', v).forEach(td => td.onclick = () => {
      const m = L1.marks[td.dataset.p] = L1.marks[td.dataset.p] || {};
      const cur = m[td.dataset.i] || 0, nx = cur === 0 ? 3 : cur === 3 ? 1 : 0;
      if (nx) m[td.dataset.i] = nx; else delete m[td.dataset.i];
      const l = LV_ANY.find(z => z[0] === nx); td.className = 'l1c s' + nx; td.innerHTML = l ? `<span style="color:${l[2]};font-weight:800">${l[3]}</span>` : ''; td.title = l ? l[1] : 'فارغ';
      td.parentElement.lastElementChild.textContent = `${nOk(td.dataset.p)}/${items.length}`;
      clearTimeout(pageL1.t); pageL1.t = setTimeout(persist, 400);
    });
    $$('[data-abs]', v).forEach(td => td.onclick = () => { const f = L1.info[td.dataset.abs] = L1.info[td.dataset.abs] || {}; f.abs = !f.abs; persist(); again(); });
    $$('[data-pre]', v).forEach(td => td.onclick = () => { const f = L1.info[td.dataset.pre] = L1.info[td.dataset.pre] || {}; const i = PRE_OPTS.indexOf(f.pre); f.pre = PRE_OPTS[(i + 1) % PRE_OPTS.length]; persist(); again(); });
    $$('.l1h', v).forEach(th => th.onclick = () => { list.forEach(p => { if (!info(p.code).abs) (L1.marks[p.code] = L1.marks[p.code] || {})[th.dataset.col] = 3; }); persist(); again(); });
    $('#l1Doc').onclick = () => go('roaizxDoc', { kind: 'l1_res' });
    $('#l1Imp').onclick = () => (window.Roaiz && Roaiz.importFiles ? Roaiz.importFiles() : null);
    if ($('#l1Exp')) $('#l1Exp').onclick = () => exportMassar(sy);
    $('#l1Add').onclick = () => {
      const f = { name: '', code: '', g: 'M', cls: st1.cls || '' }; const box = document.createElement('div');
      K.form(box, [{ k: 'name', l: 'الاسم والنسب' }, { k: 'code', l: 'رقم مسار (اختياري)', half: true, dir: 'ltr' }, { k: 'g', l: 'الجنس', t: 'select', opts: [['M', 'ذكر'], ['F', 'أنثى']], half: true }, { k: 'cls', l: 'القسم', half: true }], f);
      modal({ title: 'إضافة تلميذ(ة) للمستوى الأول', body: box, actions: [{ label: ic('check') + ' إضافة', cls: 'pri', onClick: () => { if (!nm(f.name)) { toast('اكتب الاسم', true); return false; } f.code = nm(f.code).toUpperCase() || uid('l1'); L1.extra.push({ code: f.code, name: nm(f.name), g: f.g, cls: nm(f.cls) || '—' }); persist(); again(); } }, { label: 'إلغاء' }] });
    };
    $('#l1Items').onclick = () => {
      const I = JSON.parse(JSON.stringify(L1.items)); const body = document.createElement('div');
      const draw = () => {
        body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.5px">كفايات «تقييم التعليم الأولي» كما في ملفات مسار (تُحدَّث تلقائيا عند الاستيراد). حذف كفاية يحذف خاناتها.</p>${L1G.map(g => `<div class="sec-t">${esc(g.n)}</div>${(I[g.k] || []).map((it, i) => `<div style="display:grid;grid-template-columns:1fr 34px;gap:6px;margin-bottom:4px"><input class="inp" data-s="${g.k}" data-i="${i}" value="${esc(it.t)}"><button type="button" class="btn sm danger icon" data-x="${g.k}:${i}">✕</button></div>`).join('')}<button type="button" class="btn sm" data-a="${g.k}">${ic('plus')} كفاية</button>`).join('')}`;
        $$('[data-s]', body).forEach(el => el.oninput = () => { I[el.dataset.s][+el.dataset.i].t = el.value; });
        $$('[data-x]', body).forEach(b => b.onclick = () => { const [k, i] = b.dataset.x.split(':'); I[k].splice(+i, 1); draw(); });
        $$('[data-a]', body).forEach(b => b.onclick = () => { const k = b.dataset.a; (I[k] = I[k] || []).push({ id: uid(k), t: '' }); draw(); });
      };
      draw();
      modal({ title: 'كفايات رائز المستوى الأول', size: 'lg', body, actions: [{ label: ic('check') + ' حفظ', cls: 'pri', onClick: () => { Object.keys(I).forEach(k => { I[k] = I[k].filter(x => nm(x.t)); }); L1.items = I; persist(); again(); } },
        { label: 'كفايات مسار الافتراضية', onClick: () => { L1.items = defItems(); persist(); again(); } }, { label: 'إلغاء' }] });
    };
  }
  // the Massar files of the classes, filled with the marks of the program (same files, values written in place)
  async function exportMassar(sy) {
    const L1 = Y(sy).l1;
    if (!L1.src.length) return toast('استورد أولا ملفات «تقييم التعليم الأولي» من مسار', true);
    if (!window.api.patchXlsxMany) return toast('غير متوفر في هذه النسخة', true);
    let nAll = 0;
    const used = {};
    const items = L1.src.filter(x => x.b64).map(src => {
      const cells = {};
      Object.entries(src.rows || {}).forEach(([code, r]) => {
        const m = L1.marks[code] || {}, f = L1.info[code] || {};
        if (src.absCol) cells[src.absCol + r] = f.abs ? 'X' : '';
        Object.entries(src.cols || {}).forEach(([id, col]) => { const x = f.abs ? 0 : m[id]; cells[col + r] = x === 3 ? 'Aquis' : x === 1 ? 'Non aquis' : ''; if (x === 3 || x === 1) nAll++; });
      });
      let name = String(src.file || 'EvaluationPrescolaire.xlsx'); const k = name.toLowerCase();
      if (used[k]) name = name.replace(/(\.xlsx)?$/i, `_${String(src.cls || '').replace(/[^\w-]+/g, '') || 'classe'}_${++used[k]}.xlsx`); else used[k] = 1;
      return { b64: src.b64, sheet: src.sheet, cells, name };
    });
    const r = await window.api.patchXlsxMany(items);
    if (r && r.ok) toast(`تم حفظ ${r.done.length} ملف مسار معبأ (${nAll} نتيجة) في: ${r.dir}${r.errors && r.errors.length ? ` — تعذر: ${r.errors.join('، ')}` : ''}`);
  }
  Dx.modCss += `.l1g td.l1c{cursor:pointer;min-width:46px;text-align:center;font-size:17px}.l1g td.l1c:hover{outline:2px solid #4472c4;outline-offset:-2px}.l1g .s3{background:#e4f8e2}.l1g .s2{background:#fff1dd}.l1g .s1{background:#fde2e2}.l1g th.l1h{cursor:pointer;font-size:11px;max-width:110px;min-width:70px;white-space:normal;line-height:1.3}.l1g th.l1d{font-size:11.5px;background:#e3ece8}.l1g td.l1t{cursor:pointer;text-align:center;min-width:44px}.l1g tr.l1abs td{background:#f3f3f3;color:#888}
  .tbl.sb-t.rx-g td{height:6.6mm;padding:0 .8mm}.tbl.sb-t.rx-g th{font-size:8.6pt;padding:.8mm .5mm}`;

  /* ---------- level 1: results ---------- */
  function l1Stats(sy, cls) {
    const y = Y(sy), list = l1Pupils(sy).filter(p => !cls || (p.cls || '—') === cls).filter(p => !(y.l1.info[p.code] || {}).abs);
    return L1G.map(g => ({ s: g, items: (y.l1.items[g.k] || []).map(it => {
      const c = { 3: { M: 0, F: 0, U: 0 }, 2: { M: 0, F: 0, U: 0 }, 1: { M: 0, F: 0, U: 0 } }; let n = 0;
      list.forEach(p => { const x = (y.l1.marks[p.code] || {})[it.id]; if (x) { c[x][p.g === 'F' || p.g === 'M' ? p.g : 'U']++; n++; } });
      return { it, c, n };
    }) }));
  }
  // pupils tested / absent, and the mean acquisition by pre-school attendance
  function l1Summary(sy, cls) {
    const y = Y(sy), L1 = y.l1, all = l1Pupils(sy).filter(p => !cls || (p.cls || '—') === cls), items = allItems(L1);
    const abs = all.filter(p => (L1.info[p.code] || {}).abs), pres = all.filter(p => !(L1.info[p.code] || {}).abs);
    const grp = pred => { const P = pres.filter(pred); let ok = 0, n = 0; P.forEach(p => items.forEach(it => { const x = (L1.marks[p.code] || {})[it.id]; if (x) { n++; if (x === 3) ok++; } })); return { p: P.length, ok, n }; };
    const preOf = p => nm((L1.info[p.code] || {}).pre);
    const vals = Array.from(new Set(pres.map(preOf).filter(Boolean))).sort((a, b) => (PRE_OPTS.indexOf(a) + 1 || 99) - (PRE_OPTS.indexOf(b) + 1 || 99));
    return { all: all.length, abs: abs.length, pres: pres.length, F: pres.filter(p => p.g === 'F').length,
      by: vals.map(v => [v, grp(p => preOf(p) === v)]), yes: grp(p => !!preOf(p) && preOf(p) !== 'لا'), no: grp(p => preOf(p) === 'لا'), unk: grp(p => !preOf(p)), tot: grp(() => true) };
  }

  /* ---------- documents ---------- */
  const store = sy => Y(sy).docs;
  const DOCS = [];
  const add = d => DOCS.push(d);
  const hd = cells => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  const levelOpts = () => [['', 'كل المستويات']].concat(K.LV.ALL.filter(l => /^P[1-6]$|^C[1-3]$/.test(l.k)).map(l => [l.k, l.ar]));
  const clsOpts = (sy, lvl) => [['', 'كل الأقسام']].concat(classesOf(pupils(sy, lvl)).map(c => [c, c]));

  add({
    k: 'l1_res', t: 'نتائج رائز المستوى الأول (تقييم التعليم الأولي)', grp: 'l1', d: 'لكل كفاية: عدد ونسبة «مكتسب» و«غير مكتسب» حسب الجنس، الحاضرون والغائبون، والنتائج حسب الاستفادة من التعليم الأولي، مع مبيان لكل مجال.', auto: 'ملفات مسار وشبكة الإدخال', page: 'a4l',
    init: s => ({ cls: '', city: s.city || '', date: Dx.todayIso() }),
    defs: (f, sy) => [{ k: 'cls', l: 'القسم', t: 'select', opts: () => [['', 'كل أقسام المستوى الأول']].concat(classesOf(l1Pupils(sy)).map(c => [c, c])), half: true }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f, sy) => {
      const R = l1Stats(sy, f.cls), S = l1Summary(sy, f.cls);
      const G = R.some(r => r.items.some(x => LVLS.some(l => x.c[l[0]].M + x.c[l[0]].F)));   // gender known (pupils' file imported)
      const rate = g => (g.n ? npc(g.ok, g.n) : '—');
      const blocks = [{ html: `<p class="sb-p">عدد التلاميذ: <b>${S.all}</b> — الحاضرون: <b>${S.pres}</b>${G ? ` (منهم <b>${S.F}</b> إناث)` : ''} — الغائبون: <b>${S.abs}</b>${f.cls ? ` — القسم <bdi dir="ltr">${esc(f.cls)}</bdi>` : ''}</p>` },
        tbl(hd(['الاستفادة من التعليم الأولي', 'عدد التلاميذ', 'نسبة الكفايات المكتسبة']), S.by.map(([v, g]) => [v === 'لا' ? 'لا (لم يستفيدوا)' : v, g]).concat(S.yes.p && S.by.length > 2 ? [['مجموع المستفيدين', S.yes]] : [], S.unk.p ? [['غير محدد', S.unk]] : []).map(([l, g]) => tr([{ t: l, c: 'k' }, g.p, rate(g)])).concat([tr([{ t: 'المجموع', c: 'k b' }, { t: S.tot.p, c: 'b' }, rate(S.tot)])]), 'cmp sm')];
      R.forEach(r => {
        if (!r.items.length) return;
        blocks.push({ html: `<div class="sb-cap" style="margin-top:1.5mm">${esc(r.s.n)}</div>` });
        blocks.push(G ? tbl(`<tr><th rowspan="2" class="d">الكفاية</th>${LVLS.map(l => `<th colspan="3" class="d">${l[1]}</th>`).join('')}<th rowspan="2" class="d">المقيسون</th></tr><tr>${LVLS.map(() => '<th class="d">ذ</th><th class="d">إ</th><th class="d">المجموع (النسبة)</th>').join('')}</tr>`,
          r.items.map(x => tr([{ t: x.it.t, c: 'r b' }].concat(LVLS.flatMap(l => [x.c[l[0]].M, x.c[l[0]].F, npc(x.c[l[0]].M + x.c[l[0]].F + x.c[l[0]].U, x.n)]), [x.n]))), 'cmp sm')
          : tbl(hd(['الكفاية'].concat(LVLS.map(l => `${l[1]} (النسبة)`), ['المقيسون'])), r.items.map(x => tr([{ t: x.it.t, c: 'r b' }].concat(LVLS.map(l => npc(x.c[l[0]].M + x.c[l[0]].F + x.c[l[0]].U, x.n)), [x.n]))), 'cmp sm'));
      });
      const IT = R.flatMap(r => r.items);
      if (IT.some(x => x.n)) blocks.push({ html: bars(IT.map(x => (x.it.code ? x.it.code + ' ' : '') + (x.it.t.length > 18 ? x.it.t.slice(0, 17) + '…' : x.it.t)), LVLS.map(l => ({ name: l[1], color: l[2], vals: IT.map(x => x.c[l[0]].M + x.c[l[0]].F + x.c[l[0]].U) })), { w: 1000, h: 210, fs: 7.5, title: 'توزيع النتائج حسب الكفاية' }) });
      return { title: 'نتائج رائز المستوى الأول — تقييم التعليم الأولي', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4l', blocks, sign: SB.sign(s, { right: `<span class="d">حرر ب: ${esc(f.city || s.city || '')} في: ${esc(ldate(f.date || Dx.todayIso()))}</span>`, left: 'توقيع وطابع مدير(ة) المؤسسة' }) };
    }
  });
  add({
    k: 'l1_grid', t: 'شبكة تفريغ رائز المستوى الأول (تقييم التعليم الأولي)', grp: 'l1', d: 'شبكة لكل قسم بأسماء التلاميذ والكفايات الثلاث عشرة والغياب والاستفادة من التعليم الأولي (فارغة للتفريغ اليدوي أو مملوءة من الإدخال).', auto: 'ملفات مسار وبطاقة التلاميذ', page: 'a4l',
    init: () => ({ cls: '', fill: 'yes' }),
    defs: (f, sy) => [{ k: 'cls', l: 'القسم', t: 'select', opts: () => [['', 'كل الأقسام (صفحة لكل قسم)']].concat(classesOf(l1Pupils(sy)).map(c => [c, c])), half: true }, { k: 'fill', l: 'الخانات', t: 'select', opts: [['yes', 'مملوءة من الإدخال'], ['no', 'فارغة']], half: true }],
    build: (s, f, sy) => {
      const y = Y(sy), all = l1Pupils(sy), C = f.cls ? [f.cls] : classesOf(all), items = allItems(y.l1);
      const pages = [];
      C.forEach(c => {
        const list = all.filter(p => (p.cls || '—') === c);
        const rows = list.map((p, i) => { const inf = y.l1.info[p.code] || {}; return tr([i + 1, { t: p.name, c: 'r b' }, gAr(p.g), f.fill === 'no' ? '' : (inf.abs ? 'X' : ''), f.fill === 'no' ? '' : (inf.pre || '')].concat(items.map(it => { const x = f.fill === 'no' || inf.abs ? 0 : ((y.l1.marks[p.code] || {})[it.id] || 0); const l = LV_ANY.find(z => z[0] === x); return { h: l ? `<b style="color:${l[2]}">${l[3]}</b>` : '' }; }))); });
        for (let i = rows.length; i < 8; i++) rows.push(tr([i + 1, '', '', '', ''].concat(items.map(() => ''))));
        const head = `<tr><th rowspan="2" class="d">ر.ت</th><th rowspan="2" class="d">الاسم والنسب</th><th rowspan="2" class="d">الجنس</th><th rowspan="2" class="d">غائب</th><th rowspan="2" class="d">التعليم الأولي</th>${L1G.map(g => { const n = (y.l1.items[g.k] || []).length; return n ? `<th colspan="${n}" class="d" style="font-size:7.4pt">${esc(g.n)}</th>` : ''; }).join('')}</tr><tr>${items.map((it, i) => `<th class="d" style="font-size:7.6pt">${i + 1}</th>`).join('')}</tr>`;
        const legend = `<div class="sb-note" style="font-size:8pt;line-height:1.5">${items.map((it, i) => `<b>${i + 1}.</b> ${esc(it.t)}`).join(' — ')}<br>${LVLS.map(l => `<b style="color:${l[2]}">${l[3]}</b> ${l[1]}`).join(' &nbsp;&nbsp; ')} &nbsp;&nbsp; <b>X</b> غائب</div>`;
        pages.push(...MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'شبكة تفريغ رائز المستوى الأول — تقييم التعليم الأولي', `القسم: ${c} — الموسم الدراسي ${syText(sy)}`), blocks: [tbl(head, rows, 'cmp rx-g'), { html: legend }, { html: SB.sign(s, { right: '<span class="d">توقيع الأستاذ(ة)</span>', left: 'توقيع مدير(ة) المؤسسة' }) }] }));
      });
      return { page: 'a4l', pages: pages.length ? pages : MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'شبكة تفريغ رائز المستوى الأول'), blocks: [{ html: '<p class="sb-p" style="text-align:center">لا يوجد تلاميذ في المستوى الأول.</p>' }] }) };
    }
  });

  // participation per level of a phase: enrolled (pupils lists) / tested (imported results of the phase)
  function participation(sy, ph) {
    const groups = ((DB.roaiz || {}).years || {})[sy] || [];
    const G = groups.filter(g => (g.phase || 'pre') === ph);
    const P = window.Pupils ? Pupils.current(sy) : [];
    const lvls = Array.from(new Set(P.map(p => p.lvl).filter(l => /^P[2-6]$|^P1$|^C/.test(l)))).sort((a, b) => K.LV.idx(a) - K.LV.idx(b));
    const lvOfGroup = g => { const t = String(g.level || ''); const m = t.match(/الأول|الثاني|الثالث|الرابع|الخامس|السادس/g) || []; const map = { الأول: 'P1', الثاني: 'P2', الثالث: 'P3', الرابع: 'P4', الخامس: 'P5', السادس: 'P6' }; return m.map(x => map[x]); };
    const tested = {}; G.forEach(g => { const ls = lvOfGroup(g); (g.pupils || []).forEach(p => { const l = ls.length === 1 ? ls[0] : (P.find(x => x.code === p.id || x.code === p.code) || {}).lvl || ls[0] || '?'; tested[l] = (tested[l] || 0) + 1; }); });
    const rows = lvls.map(l => { const e = P.filter(p => p.lvl === l).length, t = tested[l] || 0; return { l, e, t }; });
    const dist = SUBJ.map(s => { const c = {}; G.forEach(g => (g.pupils || []).forEach(p => { const v = nm(p[s.k]); if (v) c[v] = (c[v] || 0) + 1; })); return { s, c, n: Object.values(c).reduce((a, b) => a + b, 0) }; });
    return { rows, groups: G.length, dist };
  }
  const distTbl = d => {
    const idx = c => { const i = d.s.cats.findIndex(x => x.toLowerCase() === String(c).toLowerCase()); return i < 0 ? 99 : i; };
    const keys = Object.keys(d.c).sort((a, b) => idx(a) - idx(b));
    return tbl(hd([d.s.n].concat(keys, ['المجموع'])), [tr([{ t: 'العدد (النسبة)', c: 'k' }].concat(keys.map(c => npc(d.c[c], d.n)), [{ t: d.n, c: 'b' }]))], 'cmp sm');
  };
  add({
    k: 'rx_report', t: 'تقرير تمرير الروائز', grp: 'rp', d: 'تقرير عن تمرير روائز الموضعة القبلية أو البعدية أو مراحل المراقبة المستمرة: الفترة، المشاركة حسب المستوى، الظروف، الصعوبات، النتائج والتوصيات.', auto: 'لوائح التلاميذ ونتائج الروائز المستوردة', page: 'a4',
    init: s => ({ ph: 'pre', from: '', to: '', city: s.city || '', date: Dx.todayIso(), staff: '', cond: 'مرت عملية التمرير في ظروف عادية، وفق التوجيهات والجدولة الزمنية المحددة، وبتعبئة جميع الأساتذة المعنيين.', diff: '', acts: '', reco: '' }),
    defs: () => [{ k: 'ph', l: 'المحطة', t: 'select', opts: PH, half: true }, { k: 'from', l: 'من', t: 'date', half: true }, { k: 'to', l: 'إلى', t: 'date', half: true }, { k: 'staff', l: 'الأساتذة المشرفون على التمرير', half: true, list: 'k2Emps' },
      { k: 'cond', l: 'ظروف التمرير', t: 'area', rows: 3 }, { k: 'diff', l: 'الصعوبات المسجلة', t: 'area', rows: 3 }, { k: 'acts', l: 'الإجراءات المتخذة', t: 'area', rows: 3 }, { k: 'reco', l: 'الخلاصات والتوصيات', t: 'area', rows: 3 }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }],
    build: (s, f, sy) => {
      const R = participation(sy, f.ph || 'pre'); const te = R.rows.reduce((a, r) => a + r.e, 0), tt = R.rows.reduce((a, r) => a + r.t, 0);
      const para = (t, v) => [{ html: `<div class="sb-cap" style="margin-top:2mm">${t}</div>` }, { html: `<p class="sb-p">${esc(v || '').replace(/\n/g, '<br>') || '<span class="sb-dots" style="min-width:170mm"></span><br><span class="sb-dots" style="min-width:170mm"></span>'}</p>` }];
      return { title: `تقرير تمرير ${phName(f.ph || 'pre')}`, sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4', blocks: [
        { html: `<p class="sb-p">تطبيقا للتوجيهات الخاصة بتقويم المكتسبات والدعم، تم تمرير <b>${esc(phName(f.ph || 'pre'))}</b> بالمؤسسة${f.from ? ` خلال الفترة الممتدة من <b>${esc(ldate(f.from))}</b>` : ''}${f.to ? ` إلى <b>${esc(ldate(f.to))}</b>` : ''}${f.staff ? `، تحت إشراف: ${esc(f.staff)}` : ''}.</p>` },
        { html: '<div class="sb-cap">1. المشاركة حسب المستوى</div>' },
        tbl(hd(['المستوى', 'عدد التلاميذ المسجلين', 'عدد الممتحنين', 'عدد غير الممتحنين', 'نسبة المشاركة']), R.rows.map(r => tr([{ t: K.LV.ar(r.l), c: 'k' }, r.e, r.t, Math.max(0, r.e - r.t), { h: `<bdi dir="ltr">${pc(r.t, r.e)}</bdi>` }])).concat([tr([{ t: 'المجموع', c: 'k b' }, { t: te, c: 'b' }, { t: tt, c: 'b' }, { t: Math.max(0, te - tt), c: 'b' }, { h: `<b><bdi dir="ltr">${pc(tt, te)}</bdi></b>` }])]), 'cmp'),
        { html: '<div class="sb-cap" style="margin-top:2mm">2. النتائج (توزيع التلاميذ على المستويات)</div>' }].concat(
        R.dist.filter(d => d.n).map(distTbl),
        R.dist.some(d => d.n) ? [] : [{ html: '<p class="sb-note">لم تُستورد بعد نتائج هذه المحطة في «استثمار النتائج (الروائز)»: تُملأ الأعداد يدويا أو بعد الاستيراد.</p>' }],
        para('3. ظروف التمرير', f.cond), para('4. الصعوبات المسجلة', f.diff), para('5. الإجراءات المتخذة', f.acts), para('6. الخلاصات والتوصيات', f.reco)),
        sign: SB.sign(s, { right: `<span class="d">حرر ب: ${esc(f.city || s.city || '')} في: ${esc(ldate(f.date || Dx.todayIso()))}</span>`, left: 'توقيع وطابع مدير(ة) المؤسسة' }) };
    }
  });
  add({
    k: 'rx_grid', t: 'شبكات تفريغ الروائز', grp: 'rp', d: 'شبكة تفريغ لكل قسم ولكل مادة (العربية، الفرنسية، الرياضيات) بأسماء التلاميذ من لوائح مسار وترويسة المؤسسة — كل المستويات.', auto: 'بطاقة التلاميذ', page: 'a4l',
    init: () => ({ ph: 'pre', lvl: '', cls: '', subj: 'all', teacher: '' }),
    defs: (f, sy) => [{ k: 'ph', l: 'المحطة', t: 'select', opts: PH, half: true }, { k: 'subj', l: 'المادة', t: 'select', opts: [['all', 'كل المواد (صفحة لكل مادة)']].concat(SUBJ.map(s => [s.k, s.n])), half: true },
      { k: 'lvl', l: 'المستوى', t: 'select', opts: levelOpts, half: true }, { k: 'cls', l: 'القسم', t: 'select', opts: () => clsOpts(sy, f.lvl), half: true }, { k: 'teacher', l: 'الأستاذ(ة) (اختياري)', half: true, list: 'k2Emps' }],
    onSave: k => (k === 'lvl' ? 'redraw' : null),
    build: (s, f, sy) => {
      const P = pupils(sy, f.lvl).filter(p => p.lvl !== 'P1' || f.lvl === 'P1').filter(p => !f.cls || p.cls === f.cls);
      const C = classesOf(P).sort(), SS = f.subj === 'all' || !f.subj ? SUBJ : SUBJ.filter(x => x.k === f.subj);
      const pages = [];
      C.forEach(c => SS.forEach(sb => {
        const list = P.filter(p => (p.cls || '—') === c).sort((a, b) => String(a.name).localeCompare(String(b.name), 'ar'));
        const lv = Array.from(new Set(list.map(p => K.LV.sh(p.lvl)))).join(' + ');
        const rows = list.map((p, i) => tr([i + 1, { h: `<bdi dir="ltr">${esc(p.code)}</bdi>`, c: 'sm' }, { t: p.name, c: 'r b' }, gAr(p.g), { t: K.LV.sh(p.lvl), c: 'sm' }].concat(sb.cats.map(() => ''), [''])));
        for (let i = rows.length; i < 10; i++) rows.push(tr([i + 1, '', '', '', ''].concat(sb.cats.map(() => ''), [{ t: '', st: 'height:6.6mm' }])));
        pages.push(...MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, `شبكة تفريغ ${phName(f.ph || 'pre')} — ${sb.n}`, `القسم: ${c}${lv ? ' (' + lv + ')' : ''}${f.teacher ? ' — الأستاذ(ة): ' + f.teacher : ''} — الموسم الدراسي ${syText(sy)}`),
          blocks: [tbl(hd(['ر.ت', 'رقم مسار', 'الاسم والنسب', 'الجنس', 'المستوى'].concat(sb.cats, ['ملاحظات'])), rows, 'cmp rx-g'), { html: `<div class="sb-note">ضع علامة X في خانة المستوى الذي بلغه كل تلميذ(ة) في ${esc(sb.n)}.</div>` }, { html: SB.sign(s, { right: '<span class="d">توقيع الأستاذ(ة)</span>', left: 'توقيع مدير(ة) المؤسسة' }) }] }));
      }));
      return { page: 'a4l', pages: pages.length ? pages : MK.flowPages({ page: 'a4l', cls: 'sb', head: SB.head(s, 'شبكات تفريغ الروائز'), blocks: [{ html: '<p class="sb-p" style="text-align:center">لا توجد لوائح تلاميذ: استورد لوائح مسار في «بطاقة التلاميذ».</p>' }] }) };
    }
  });

  const C = K.center({
    id: 'roaizx', title: 'تقارير الروائز وشبكات التفريغ', icon: '🧾', route: 'roaizxDoc', hubRoute: 'roaizx', years: () => Object.keys(RX().years),
    groups: [['rp', 'تقارير وشبكات الروائز', 'الموضعة القبلية والبعدية والمراقبة المستمرة'], ['l1', 'رائز المستوى الأول']],
    intro: 'شبكات التفريغ تُعد من لوائح التلاميذ المستوردة من مسار (لكل قسم ولكل مادة، بترويسة المؤسسة)، وتقرير التمرير يُملأ تلقائيا بالمشاركة حسب المستوى ونتائج المحطة إن كانت مستوردة في «استثمار النتائج (الروائز)». رائز المستوى الأول له شبكة إدخال خاصة.',
    docs: () => DOCS, store: sy => store(sy),
    hubButtons: () => `<button class="btn pri" id="rxL1">${ic('edit')} إدخال نتائج رائز المستوى الأول</button><button class="btn" id="rxBack">${ic('back')} استثمار النتائج (الروائز)</button>`,
    onHub: v => { $('#rxL1', v).onclick = () => go('roaiz', { tab: 'l1' }); $('#rxBack', v).onclick = () => go('roaiz'); }
  });

  /* 1.9.4 — the first level test is imported with the other test files (same import operation): a Massar «Evaluation Prescolaire»
     sheet (one per class): رمز / الإسم / النسب / غائب / الاستفادة من التعليم الاولي, then one column per competency («... - CODE»),
     the Massar item ids in a hidden row above the header. The original file is kept to be given back filled. */
  const PRE_OPTS = ['لا', 'سنة كاملة', 'سنتين كاملتين', 'ثلاث سنوات كاملة'];   // «الاستفادة من التعليم الأولي» in Massar
  const markOf = v => { const t = nm(v).toLowerCase(); if (!t) return 0; if (/non|غير/.test(t)) return 1; if (/aquis|acquis|مكتسب/.test(t)) return 3; return 0; };
  const colL = j => { let s = ''; j++; while (j) { const m = (j - 1) % 26; s = String.fromCharCode(65 + m) + s; j = Math.floor((j - 1) / 26); } return s; };
  function parseL1(rows, sheetName, fileName, b64) {
    const T = rows.map(r => (r || []).map(x => nm(x)));
    if (!T.slice(0, 12).some(r => r.some(c => /Evaluation\s*Pr[eé]scolaire|الاستفادة من التعليم/i.test(c)))) return null;
    const hi = T.findIndex((r, i) => i < 25 && r.includes('رمز') && r.some(c => /^(الإسم|الاسم)$/.test(c)));
    if (hi < 0) return null;
    const H = T[hi], at = rx => H.findIndex(c => rx.test(c));
    const idc = at(/^رمز$/), fc = at(/^(الإسم|الاسم)$/), lc = at(/^النسب$/), ac = at(/^غائب$/), pc0 = at(/الاستفادة من التعليم/);
    let ir = -1; for (let i = hi; i < Math.min(T.length, hi + 4) && ir < 0; i++) if (T[i].filter(c => / - \S+$/.test(c)).length >= 3) ir = i;
    if (ir < 0) return null;
    const idRow = T.slice(0, hi).reverse().find(r => r.filter(c => /^\d{2,6}$/.test(c)).length >= 3) || [];
    let dom = '';
    const cols = T[ir].map((c, j) => { const d = nm((T[ir - 1] || [])[j]); if (d && ir - 1 > hi - 1) dom = d; const m = / - (\S+)$/.exec(c); return m ? { j, t: nm(c.slice(0, m.index)), code: m[1], mid: /^\d+$/.test(idRow[j] || '') ? +idRow[j] : 0, dom } : null; }).filter(Boolean);
    const cid = (T.slice(0, hi).find(r => /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(r[0] || '')) || [])[0] || '';
    let cls = ''; T.slice(0, hi).forEach(r => r.forEach((c, j) => { if (/^Classe\s*:?$/i.test(c)) cls = r.slice(j + 1).find(Boolean) || cls; }));
    const pupils = [];
    for (let i = ir + 1; i < T.length; i++) {
      const r = T[i], code = (r[idc] || '').toUpperCase(); if (!code) continue;
      const marks = {}; cols.forEach(c => { const m = markOf(r[c.j]); if (m) marks[c.j] = m; });
      pupils.push({ code, name: nm(`${lc >= 0 ? r[lc] : ''} ${fc >= 0 ? r[fc] : ''}`), abs: ac >= 0 && /^x$/i.test(r[ac] || ''), pre: pc0 >= 0 ? (r[pc0] || '') : '', row: i + 1, marks });
    }
    return pupils.length || cols.length ? { cols, pupils, cls, cid, file: fileName, sheet: sheetName, b64: b64 || '', absCol: ac >= 0 ? colL(ac) : '' } : null;
  }
  function applyL1(sy, parsed) {
    const L1 = Y(sy).l1; let n = 0;
    const P = window.Pupils ? Pupils.current(sy) : [];
    parsed.forEach(Q => {
      const idOf = {}, flat = () => allItems(L1);
      Q.cols.forEach(c => {
        let it = flat().find(x => (c.mid && x.mid === c.mid) || (c.code && x.code === c.code));
        if (!it) { const g = (L1G.find(x => nm(c.dom) && nm(x.n).replace(/\s+/g, ' ') === nm(c.dom).replace(/\s+/g, ' ')) || L1G[0]).k; it = { id: c.mid ? 'x' + c.mid : uid('l1i'), t: c.t, code: c.code, mid: c.mid }; (L1.items[g] = L1.items[g] || []).push(it); }
        else { if (c.t) it.t = c.t; }
        idOf[c.j] = it.id;
      });
      const rowsOf = {}, colsOf = {};
      // one Massar class = one id (a blank and a filled download of the same class are the same class); classes sharing a label are numbered
      const same = x => (Q.cid && x.cid ? x.cid === Q.cid : x.file === Q.file && x.sheet === Q.sheet);
      const prev = L1.src.find(same);
      let label = prev ? prev.cls : (Q.cls || '—');
      if (!prev) { const n = L1.src.filter(x => String(x.cls0 || x.cls) === (Q.cls || '—')).length; if (n) label = `${Q.cls || '—'} (${n + 1})`; }
      Q.cols.forEach(c => { colsOf[idOf[c.j]] = colL(c.j); });
      Q.pupils.forEach(p => {
        const m = L1.marks[p.code] = L1.marks[p.code] || {};
        Object.entries(p.marks).forEach(([j, v]) => { m[idOf[j]] = v; });
        const inf = L1.info[p.code] = L1.info[p.code] || {}; if (p.abs) inf.abs = true; if (p.pre) inf.pre = p.pre;
        if (!P.some(x => String(x.code).toUpperCase() === p.code)) { const e = L1.extra.find(x => x.code === p.code); if (e) e.cls = label; else L1.extra.push({ code: p.code, name: p.name, g: '', cls: label }); }
        rowsOf[p.code] = p.row; n++;
      });
      L1.src = L1.src.filter(x => !same(x)).concat([{ cid: Q.cid, cls0: Q.cls || '—', file: Q.file, sheet: Q.sheet, cls: label, b64: Q.b64, rows: rowsOf, cols: colsOf, absCol: Q.absCol, date: Dx.todayIso() }]);
    });
    return n;
  }
  // 1.9.4: the level-one test as a mastery rate (share of «مكتسب» among the competences marked), overall, by domain, by gender and by pre-school attendance
  function l1Mastery(sy, cls) {
    const st = l1Stats(sy, cls), sm = l1Summary(sy, cls), pc = (a, b) => (b ? a / b * 100 : null);
    let ok = 0, n = 0, okF = 0, nF = 0, okM = 0, nM = 0;
    const domains = st.map(d => { let o = 0, t = 0; d.items.forEach(x => { [3, 2, 1].forEach(k => { const c = x.c[k], s2 = c.M + c.F + c.U; t += s2; if (k === 3) { o += s2; okF += c.F; okM += c.M; } nF += c.F; nM += c.M; }); }); ok += o; n += t; return { k: d.s.k, n: d.s.n, ok: o, total: t, rate: pc(o, t) }; });
    return { pupils: sm.pres, all: sm.all, abs: sm.abs, rate: pc(ok, n), n, rateF: pc(okF, nF), rateM: pc(okM, nM), domains, yes: pc(sm.yes.ok, sm.yes.n), no: pc(sm.no.ok, sm.no.n), nYes: sm.yes.p, nNo: sm.no.p };
  }
  window.RoaizX = { migrate, l1Pupils, l1Stats, l1Summary, l1Mastery, participation, DOCS: () => DOCS, parseL1, applyL1, exportMassar, renderL1: v => { migrate(DB); pageL1(v, true); } };
  window.pageRoaizx = (v, a) => { migrate(DB); C.hub(v, a); };
  window.pageRoaizxDoc = (v, a) => { migrate(DB); C.doc(v, a); };
  window.pageLevel1 = v => { migrate(DB); pageL1(v, false); };
})();
