'use strict';
/* الميزانية — core: data store, shared helpers, the expense-register factory and the hub.
   The four bodies (التعاونية المدرسية، الجمعية الرياضية المدرسية، جمعية دعم مدرسة النجاح، الأندية التربوية)
   register themselves from bcoop.js / bsport.js / bnjah.js / bclubs.js with Budget.reg({ groups, docs, card, dash }). */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, num, r2, money } = window.K;

  function migrate(db) {
    const b = db.budget = db.budget || {};
    b.years = b.years && typeof b.years === 'object' ? b.years : {};
    b.clubs = Array.isArray(b.clubs) ? b.clubs : [];
    b.clubs.forEach(c => { c.id = c.id || uid('cl'); });
  }
  const BD = () => { migrate(DB); return DB.budget; };
  const store = sy => { const y = BD().years; return y[sy] || (y[sy] = {}); };
  const hasYear = sy => { const y = BD().years[sy]; return !!y && Object.keys(y).length > 0; };

  const parts = [];
  const reg = p => { parts.push(p); };
  const allDocs = () => parts.reduce((a, p) => a.concat(p.docs()), []);

  const prevSy = sy => { const a = MK.syStart(sy); return `${a - 1}/${a}`; };
  const dh = n => `${r2(n) < 0 ? '\u200E' : ''}${money(n)} درهم`;   // a negative amount keeps its minus sign on the left of the figure inside right-to-left text
  const m2 = n => money(n);
  const sumCol = (rows, c) => r2((rows || []).reduce((a, r) => a + num(r[c]), 0));
  const pupilsCount = sy => {
    if (!window.Pupils) return { m: '', f: '', t: '' };
    const arr = Pupils.current(sy);
    return arr.length ? Pupils.cnt(arr) : { m: '', f: '', t: '' };
  };
  const dateLong = iso => (iso ? K.ldate(iso) : '..........');

  /* effective fields of a document (automatic filling + the user's corrections), usable from any other document */
  const fldsOf = (d, sy) => Object.assign({}, d.init ? d.init(S(), sy, {}) : {}, store(sy)[d.k] || {});
  const F = (key, sy) => {
    const d = allDocs().find(x => x.k === key);
    return d ? fldsOf(d, sy || MK.curSy()) : {};
  };
  const rowsOf = (key, sy, name) => (F(key, sy)[name || 'rows'] || []);

  /* ---------- tables ---------- */
  const kv = pairs => {
    const rows = [];
    for (let i = 0; i < pairs.length; i += 2) {
      const a = pairs[i], b = pairs[i + 1] || ['', ''];
      rows.push(tr([{ t: a[0], c: 'k' }, { t: a[1] }, { t: b[0], c: b[0] ? 'k' : '' }, { t: b[1] }]));
    }
    return { table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:21%"><col style="width:29%"><col style="width:21%"><col style="width:29%"></colgroup>', rows } };
  };
  const kv2 = pairs => ({ table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:34%"><col style="width:66%"></colgroup>', rows: pairs.map(a => tr([{ t: a[0], c: 'k' }, { t: a[1] }])) } });
  const hd = (cells, cls) => thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: cls || 'd' })));
  const gridDef = (k, l, cols, o) => Object.assign({ k, l, t: 'grid', cols, widths: cols.map(() => '1fr') }, o || {});
  const blankRows = (rows, min, width, numbered) => {
    const out = rows.slice();
    for (let i = rows.length; i < min; i++) out.push(tr(Array.from({ length: width }, (_, j) => (j === 0 && numbered !== false ? { t: String(i + 1) } : { t: '', st: 'height:7mm' }))));
    return out;
  };
  const idLine = s => [s.school, s.commune ? 'جماعة ' + s.commune : '', s.directorate].filter(Boolean).join(' — ');

  /* ---------- expense register (one per spending domain) ----------
     o: { k, t, grp, title, d, label, allocated(sy) | null, top(sy, spent, f) -> pairs, signer, min } */
  function regDoc(o) {
    return {
      k: o.k, t: o.t, grp: o.grp, d: o.d || 'سجل المصاريف المؤرخة مع المجموع والباقي بعد الصرف.', auto: o.auto || 'ميزانية الموسم الدراسي المختار', page: 'a4',
      init: () => ({ rows: [['', '', ''], ['', '', ''], ['', '', ''], ['', '', '']] }),
      defs: () => [{ note: 'سجّل كل عملية صرف على حدة (التاريخ، نوعية المصروف، المبلغ). تُحسب المجاميع والباقي تلقائيا وتنتقل إلى التقرير المالي وبطاقة التتبع.' },
        gridDef('rows', 'عمليات الصرف', ['التاريخ', 'نوعية المصاريف', 'المبلغ المصروف (درهم)'], { widths: ['1fr', '2.6fr', '1.1fr'], types: ['date', 'text', 'num'] })],
      build: (s, f, sy) => {
        const R = (f.rows || []).filter(r => r[0] || String(r[1] || '').trim() || num(r[2]));
        const spent = sumCol(R, 2);
        const al = o.allocated ? o.allocated(sy) : null;
        const pairs = o.top ? o.top(sy, spent, f) : [['الموسم الدراسي', MK.syDash(sy)], ['المؤسسة', s.school || ''], ['الرصيد المخصص للمجال', dh(al)], ['مصاريف المجال', dh(spent)], ['الباقي بعد الصرف', dh(al - spent)]];
        const rows = R.map((r, i) => tr([i + 1, r[0] ? K.ldate(r[0]) : '', { t: r[1], c: 'r' }, { t: m2(num(r[2])), c: 'ltr' }]));
        const full = blankRows(rows, o.min || 16, 4);
        full.push(tr([{ t: 'المجموع', s: 3, c: 'd b' }, { t: m2(spent), c: 'ltr d b' }]));
        return { title: o.title || o.t, page: 'a4', sign: SB.sign(s, { right: o.signer || 'إمضاء منسق(ة) التعاونية', left: 'إمضاء رئيس المؤسسة' }),
          blocks: [kv(pairs.length % 2 ? pairs.concat([['', '']]) : pairs), tbl(hd(['ر.ت', 'التاريخ', 'نوعية المصاريف', 'المبلغ المصروف']), full, 'big')] };
      }
    };
  }
  const spentOf = (key, sy) => sumCol(rowsOf(key, sy), 2);

  /* ---------- the document centres (hub + live editor) ----------
     1.9.3: the finance parts (التعاونية، الجمعية الرياضية، جمعية النجاح، السجلات الرسمية) stay in «الميزانية» (التدبير المالي والمادي), while the
     clubs and the celebrations / activities cards moved to «الحياة المدرسية»; all of them share the same yearly store, so nothing is lost. */
  const LIFE = ['clubs', 'events'];
  const partsOf = ids => parts.filter(p => ids.includes(p.id));
  const centres = {};
  function centreOf(key, ids, cfg) {
    if (centres[key]) return centres[key];
    const ps = () => partsOf(typeof ids === 'function' ? ids() : ids);
    const docsOfParts = () => ps().reduce((a, p) => a.concat(p.docs()), []);
    const groups0 = () => ps().reduce((a, p) => a.concat(p.groups), []);
    // the cooperative registers are tagged «(الابتدائي)» only in the primary cycle
    const groups = () => (window.Cyc && Cyc.isSec() ? groups0().map(g => [g[0], String(g[1]).replace(' (الابتدائي)', ''), g[2]]) : groups0());
    centres[key] = K.center(Object.assign({
      groups, docs: docsOfParts, store: sy => store(sy), years: () => Object.keys(BD().years),
      onHub: v => {
        const sy = MK.curSy();
        const cards = ps().map(p => (p.card ? p.card(sy) : null)).filter(Boolean);
        const html = `<div class="bd-sum">${cards.map(c => `<div class="card bd-card"><div class="bd-t">${c.title}</div>${c.rows.map(r => `<div class="kv-r"><span>${r[0]}</span><b class="${r[2] || ''}">${r[1]}</b></div>`).join('')}</div>`).join('')}</div>`;
        const h = v.querySelector('.page-h');
        if (h) h.insertAdjacentHTML('afterend', html);
      }
    }, cfg));
    return centres[key];
  }
  const center = () => centreOf('budget', () => parts.filter(p => !LIFE.includes(p.id)).map(p => p.id), {
    id: 'budget', title: 'الميزانية', icon: '💰', route: 'budgetDoc', hubRoute: 'budget',
    intro: 'مالية التعاونية المدرسية والجمعية الرياضية وجمعية دعم مدرسة النجاح في مكان واحد: أدخل معطيات كل هيأة مرة واحدة وستنتقل تلقائيا إلى كل وثائقها (مشروع الصرف، دفاتر المصاريف، التقرير المالي، بطاقة التتبع، محاضر التحويل...). كل الوثائق بنفس تصميم السبورة المرجعية وجاهزة للطبع أو PDF.'
  });
  const clubsCentre = () => centreOf('clubs', ['clubs'], {
    id: 'clubs', title: 'الأندية التربوية', icon: '🎭', route: 'clubsDoc', hubRoute: 'clubs',
    intro: 'لائحة الأندية التربوية وميزانية أنشطتها وبطاقة جاهزة لكل نادٍ (الأهداف، الأنشطة المبرمجة، الشركاء، الفرص والإكراهات). تُحفظ المعطيات مع معطيات الموسم الدراسي ولا يُعاد إدخالها.'
  });
  const eventsCentre = () => centreOf('events', ['events'], {
    id: 'events', title: 'الاحتفالات والأنشطة المنجزة', icon: '🎉', route: 'eventsDoc', hubRoute: 'events',
    intro: 'بطائق تقنية جاهزة للاحتفال بالأعياد والمناسبات الوطنية والدينية والدولية وكل الأنشطة المنجزة بالمؤسسة، على نموذج المديرية، مع بيان الإرسال وحصيلة الأنشطة.'
  });

  // ids: the parts to count (default: the finance parts); «life»: clubs + activities
  function summary(which) {
    const sy = MK.curSy();
    const ps = which === 'life' ? partsOf(LIFE) : parts.filter(p => !LIFE.includes(p.id));
    return { rows: ps.reduce((a, p) => a.concat(p.dash ? p.dash(sy) : []), []) };
  }

  window.Budget = { migrate, store, hasYear, reg, F, rowsOf, spentOf, prevSy, dh, m2, sumCol, pupilsCount, dateLong, kv, kv2, hd, gridDef, blankRows, idLine, regDoc, summary, docs: allDocs, center, clubsCentre, eventsCentre };
  window.pageBudget = (v, a) => { migrate(DB); center().hub(v, a); };
  window.pageBudgetDoc = (v, a) => { migrate(DB); center().doc(v, a); };
  window.pageClubs = (v, a) => { migrate(DB); clubsCentre().hub(v, a); };
  window.pageClubsDoc = (v, a) => { migrate(DB); clubsCentre().doc(v, a); };
  window.pageEvents = (v, a) => { migrate(DB); eventsCentre().hub(v, a); };
  window.pageEventsDoc = (v, a) => { migrate(DB); eventsCentre().doc(v, a); };
})();
