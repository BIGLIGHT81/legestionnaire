'use strict';
/* 1.9.3 — المذكرات الداخلية: مذكرات مدير المؤسسة إلى الأطر التربوية (بقوالب جاهزة مستخلصة من النماذج المعتمدة)،
   ترقيم تلقائي «NN/YY»، موضوع ومراجع ونص وجداول قابلة للتعديل، لائحة توقيع الأساتذة تلقائيا من الموظفين، وسجل المذكرات.
   Data: DB.memos = { years: { [sy]: { items: [{ id, tpl, no0, date0 }], m_<id>: { edited fields } } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, tbl, ldate, num } = window.K;
  const TP = window.MemoTpl;
  const dots = '..........';
  const nm = t => String(t == null ? '' : t).trim();
  const today = () => Dx.todayIso();
  const hd = cells => K.thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));

  const root = () => { const m = (DB.memos = DB.memos && typeof DB.memos === 'object' ? DB.memos : {}); m.years = m.years && typeof m.years === 'object' ? m.years : {}; return m; };
  const ST = sy => { const y = root().years; const o = y[sy] || (y[sy] = {}); o.items = Array.isArray(o.items) ? o.items : []; return o; };
  const items = sy => ST(sy).items;
  const tplOf = id => TP.list.find(t => t.id === id) || TP.list[0];

  /* ---------- memos from the activities of the school (الاحتفالات والأنشطة المنجزة) ---------- */
  const lines = t => nm(t).split(/\r?\n|[؛;]\s*/).map(x => x.trim()).filter(Boolean);
  const AG = [['n', 'المناسبات الوطنية'], ['r', 'المناسبات الدينية'], ['i', 'الأيام العالمية'], ['e', 'أنشطة المؤسسة']];
  function actSources(sy) {
    const E = window.Events, B = window.Budget; if (!E || !B) return [];
    const out = E.OCC.map(x => ({ key: 'ev_' + x[0], g: x[1], name: x[2], why: x[3], acts: x[4], clubs: x[5] }));
    ((DB.budget && DB.budget.events) || []).filter(e => nm(e.name)).forEach(e => out.push({ key: 'ev_x_' + e.id, g: 'e', name: e.name, why: '', acts: '', clubs: '' }));
    return out.map(o => { const f = B.F(o.key, sy) || {}; return Object.assign(o, { f, done: !!(nm(f.period) || (f.date && nm(f.no))) }); });
  }
  const verbOf = o => (o.g === 'e' ? 'تنظيم ' + o.name : /^ذكرى/.test(o.name) ? 'تخليد ' + o.name : 'الاحتفال ب' + o.name);
  // the memo of an activity: its subject, text, tasks table and deadlines are drawn from the activity (occasion card) and stay editable
  function actFields(it, s, sy) {
    const o = actSources(sy).find(x => x.key === it.act); if (!o) return null;
    const f = o.f || {}, a = MK.syStart(sy), SY = `${a}/${a + 1}`;
    const acts = (Array.isArray(f.acts) ? f.acts.map(r => nm(r && r[0])).filter(Boolean) : []).concat([]);
    const list = acts.length ? acts : lines(o.acts);
    const when = nm(f.period) || dots, place = nm(f.place);
    const why = nm(f.why || o.why).replace(/^وبعد[،,]?\s*/, '');
    const clubs = nm(f.clubs || o.clubs);
    const body = [`وبعد، ${why ? why + '، ' : ''}يشرفني أن أخبر السيدات والسادة الأطر التربوية العاملة بالمؤسسة بأنه تقرر ${verbOf(o)} ${nm(f.period) ? 'وذلك ' + when : 'وذلك يوم ' + dots}${place ? ' ب' + place : ''}${clubs ? '، بمشاركة ' + clubs : ''}، وفق الأنشطة التالية:`]
      .concat(list.map(x => '- ' + x), ['', 'ونظرا لأهمية هذا النشاط، أرجو منكم الحرص على التنسيق فيما بينكم لإنجازه في أحسن الظروف، وموافاة الإدارة ببطاقة تقنية مرفقة بالصور في أجل أقصاه ' + dots + '.']).join('\n');
    const sup = nm(f.sup) && !/جميع الأطر/.test(nm(f.sup)) ? nm(f.sup) : '';
    return { subject: 'في شأن ' + verbOf(o), refs: ['البرنامج السنوي للمؤسسة برسم الموسم الدراسي ' + SY, 'البرنامج السنوي للأندية التربوية برسم الموسم الدراسي ' + SY],
      body, t1: { cap: 'توزيع المهام على الأطر', head: ['النشاط', 'المكلف(ة)', 'الأندية المشاركة', 'ملاحظات'], rows: (list.length ? list : ['']).map(x => [x, sup, '', '']) },
      sig: 'teachers', closing: 'respect', salam: 'imam' };
  }

  const ctxOf = (s, sy) => {
    const a = MK.syStart(sy), kind = window.Cyc ? Cyc.kind(s) : 'pri';
    const grp = kind === 'pri' && !(window.Cyc && Cyc.single(s));          // 1.9.4: «pri» = primary school GROUP (school units); an independent school speaks of classes
    return { s, kind, pri: grp, SY: `${a}/${a + 1}`, PSY: `${a - 1}/${a}`, units: grp && window.Units ? Units.names() : [] };
  };
  const heads = t => nm(t).split(/\s*\|\s*/).map(x => x.trim()).filter(Boolean);
  const nameCol = h => /المكلف|الأستاذ|اسم|المنسق|المؤطر/.test(h) ? 'k2Emps' : /الوحدة/.test(h) ? 'k2Units' : null;

  /* ---------- numbering «NN/YY»: next free number of the calendar year across all school years ---------- */
  function allNos() {
    const out = [];
    Object.keys(root().years).forEach(sy => { const st = ST(sy); st.items.forEach(it => { const r = st['m_' + it.id]; out.push(nm((r && r.no != null ? r.no : it.no0) || '')); }); });
    return out;
  }
  function nextNo(year) {
    const yy = String(year || new Date().getFullYear()).slice(-2);
    let max = 0;
    allNos().forEach(n => { const m = /^0*(\d+)\s*\/\s*(?:20)?(\d{2})$/.exec(n.replace(/\s+/g, '')); if (m && m[2] === yy) max = Math.max(max, +m[1]); });
    return String(max + 1).padStart(2, '0') + '/' + yy;
  }

  /* ---------- fields of a memo ---------- */
  function initFor(it, s, sy) {
    const t = Object.assign({}, tplOf(it.tpl).make(ctxOf(s, sy)), (it.act && actFields(it, s, sy)) || {});
    const c1 = t.t1 || null, c2 = t.t2 || null;
    return {
      no: it.no0 || nextNo(), city: s.city || '', date: it.date0 || today(), from: 'مدير المؤسسة', to: 'السيدات والسادة الأطر التربوية العاملة بالمؤسسة',
      subject: t.subject || '', refs: (t.refs || []).join('\n'), salam: t.salam || 'imam', body: t.body || '',
      cap1: c1 ? c1.cap : '', head1: c1 ? c1.head.join(' | ') : '', t1: c1 ? c1.rows.map(r => r.slice()) : [],
      body2: t.body2 || '',
      cap2: c2 ? c2.cap : '', head2: c2 ? c2.head.join(' | ') : '', t2: c2 ? c2.rows.map(r => r.slice()) : [],
      closing: t.closing || 'respect', sigMode: t.sig || 'teachers', sigUnit: '', sigRows: '15', sigTitle: '', signer: 'توقيع رئيس المؤسسة'
    };
  }
  const fieldsOf = (it, sy) => {
    const s = S(), base = initFor(it, s, sy), saved = ST(sy)['m_' + it.id] || {};
    return Object.assign({}, base, saved);
  };
  const titleOf = (it, sy) => { const f = fieldsOf(it, sy); return `مذكرة ${nm(f.no) || '…'} — ${nm(f.subject).replace(/^في شأن\s*/, '') || tplOf(it.tpl).name}`; };

  /* ---------- the form ---------- */
  const SIG_MODES = [['teachers', 'لائحة الأساتذة (تلقائيا من الموظفين)'], ['blank', 'لائحة فارغة للتوقيع'], ['none', 'بدون لائحة']];
  const TO = ['السيدات والسادة الأطر التربوية العاملة بالمؤسسة', 'السيدات والسادة الأستاذات والأساتذة العاملين بالمؤسسة', 'السادة الأطر التربوية العاملة بالمجموعة المدرسية', 'السيدات والسادة الأطر العاملة بالمؤسسة', 'السيدات والسادة المكلفين بالتنسيق بالوحدات المدرسية'];
  function tableDefs(k, hk, ck, f, label) {
    const hs = heads(f[hk]);
    f[k] = Array.isArray(f[k]) ? f[k] : [];
    if (hs.length) f[k] = f[k].map(r => { const a = Array.isArray(r) ? r.slice(0, hs.length) : []; while (a.length < hs.length) a.push(''); return a; });
    const defs = [{ sec: label }, { k: ck, l: 'عنوان الجدول (اختياري)' }, { k: hk, l: 'عناوين الأعمدة (افصل بينها بـ « | »)', ph: 'الوحدة | المكلف(ة) بالتنسيق | التاريخ' }];
    if (hs.length) defs.push(Object.assign(Budget.gridDef(k, 'صفوف الجدول', hs, { widths: hs.map(() => '1fr'), list: hs.map(nameCol) })));
    return defs;
  }
  function defsFor(it, f) {
    return [{ sec: 'رأس المذكرة' },
      { k: 'no', l: 'رقم المذكرة', half: true, ph: '01/26' }, { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'بتاريخ', t: 'date', half: true },
      { k: 'from', l: 'من', half: true }, { k: 'to', l: 'إلى', list: 'memoTo', dls: { memoTo: TO } },
      { k: 'subject', l: 'الموضوع', t: 'area', rows: 2 },
      { k: 'refs', l: 'المراجع (سطر لكل مرجع)', t: 'area', rows: 3 },
      { sec: 'نص المذكرة' },
      { k: 'salam', l: 'عبارة السلام', t: 'select', opts: Object.keys(TP.SALAM).map(k => [k, TP.SALAM[k]]) },
      { note: 'اكتب النص كما تشاء: «# عنوان» لعنوان فرعي، «- ...» لنقطة، وأي سطر آخر فقرة. اترك سطرا فارغا بين الفقرات.' },
      { k: 'body', l: 'النص قبل الجدول', t: 'area', rows: 12 }]
      .concat(tableDefs('t1', 'head1', 'cap1', f, 'الجدول الأول (اختياري)'))
      .concat([{ k: 'body2', l: 'النص بعد الجدول', t: 'area', rows: 4 }])
      .concat(tableDefs('t2', 'head2', 'cap2', f, 'جدول ثان (اختياري)'))
      .concat([{ sec: 'الختام والتوقيعات' },
        { k: 'closing', l: 'عبارة الختام', t: 'select', opts: [['respect', TP.CLOSING.respect], ['info', TP.CLOSING.info], ['both', TP.CLOSING.both], ['none', 'بدون عبارة ختام']] },
        { k: 'sigMode', l: 'لائحة توقيع الأساتذة', t: 'select', opts: SIG_MODES },
        { k: 'sigUnit', l: 'الأساتذة المدرجون', t: 'select', half: true, opts: [['', 'كل الأساتذة']].concat((window.Units ? Units.names() : []).map(n => [n, 'أساتذة ' + n])) },
        { k: 'sigRows', l: 'عدد الأسطر الأدنى', t: 'num', half: true },
        { k: 'sigTitle', l: 'عنوان اللائحة (اختياري: «التوقيعات»)' }, { k: 'signer', l: 'التوقيع أسفل المذكرة' },
        { sec: 'إجراءات' },
        { t: 'html', html: `<div class="btn-row"><button type="button" class="btn sm" data-act="num">ترقيم تلقائي (الرقم الموالي)</button><button type="button" class="btn sm" data-act="dup">نسخ المذكرة</button>${it.act ? '<button type="button" class="btn sm" data-act="refresh" title="يعيد كتابة الموضوع والنص وجدول المهام من بطاقة النشاط (فترة الإنجاز، الأندية، الأنشطة المنجزة)">تحديث من بطاقة النشاط</button>' : ''}<button type="button" class="btn sm danger" data-act="del">حذف المذكرة</button></div>` }]);
  }

  /* ---------- the printed memo ---------- */
  const teachersOf = unit => K.E.teachers().filter(e => !unit || K.U.same(e.unit, unit));
  function sigTable(s, f) {
    const mode = f.sigMode || 'teachers';
    if (mode === 'none') return null;
    const min = Math.max(0, num(f.sigRows) || 0);
    const emps = mode === 'teachers' ? teachersOf(f.sigUnit) : [];
    const rows = emps.map((e, i) => tr([String(i + 1).padStart(2, '0'), { t: fullName(e), c: 'r b' }, e.ppr || '', '', '']));
    for (let i = rows.length; i < min; i++) rows.push(tr([String(i + 1).padStart(2, '0'), '', '', '', ''].map((x, j) => (j ? { t: '', st: 'height:7mm' } : x))));
    if (!rows.length) return null;
    return { before: nm(f.sigTitle) ? SB.cap(esc(f.sigTitle), 'r') : '', minRows: 3, table: { cls: 'sb-t cmp mm-sig', head: hd(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'التوقيع', 'ملاحظات']), colgroup: '<colgroup><col style="width:7%"><col style="width:34%"><col style="width:17%"><col style="width:21%"><col style="width:21%"></colgroup>', rows } };
  }
  function tableBlock(f, k, hk, ck) {
    const hs = heads(f[hk]); if (!hs.length) return null;
    const rows = (f[k] || []).filter(r => (r || []).some(x => nm(x)));
    if (!rows.length) return null;
    const body = rows.map(r => tr(hs.map((_, j) => { const v = nm(r[j]); return { t: v, c: j === 0 || v.length > 28 ? 'r' + (j === 0 ? ' b' : '') : '' }; })));
    return { before: nm(f[ck]) ? SB.cap(esc(f[ck]), 'r') : '', minRows: rows.length <= 9 ? 99 : 2, table: { cls: 'sb-t cmp', head: hd(hs), rows: body } };
  }
  function build(s, f, sy) {
    const head = `<div class="mk-hdr">${Dx.header(s)}</div>`;
    const B = [];
    B.push({ html: `<div class="mm-meta"><div>${esc(f.city || s.city || '')} في: ${esc(f.date ? ldate(f.date) : dots)}</div><div>مذكرة داخلية رقم: <b>${esc(nm(f.no) || '....../..')}</b></div></div>` });
    B.push({ html: `<div class="mm-ft"><div><b>من:</b> ${esc(f.from || '')}</div><div><b>إلى:</b> ${esc(f.to || '')}</div></div>` });
    B.push({ html: `<div class="mm-sub"><b>الموضوع:</b> ${esc(nm(f.subject))}</div>`, keepNext: true });
    const refs = nm(f.refs).split(/\r?\n/).map(x => x.replace(/^[-–•]\s*/, '').trim()).filter(Boolean);
    if (refs.length) B.push({ html: `<div class="mm-ref"><b>${refs.length > 1 ? 'المراجع' : 'المرجع'}:</b><ul>${refs.map(r => `<li>${esc(r)}</li>`).join('')}</ul></div>` });
    B.push({ html: `<p class="mm-sal">${esc(TP.SALAM[f.salam] || TP.SALAM.imam)}</p>`, keepNext: true });
    K.textBlocks(f.body, {}).forEach(b => B.push(b));
    const t1 = tableBlock(f, 't1', 'head1', 'cap1'); if (t1) B.push(t1);
    K.textBlocks(f.body2, {}).forEach(b => B.push(b));
    const t2 = tableBlock(f, 't2', 'head2', 'cap2'); if (t2) B.push(t2);
    const cl = TP.CLOSING[f.closing == null ? 'respect' : f.closing];
    if (cl) B.push({ html: `<p class="mm-cl">${esc(cl)}</p>`, keepNext: true });
    const sg = sigTable(s, f); if (sg) B.push(sg);
    B.push(SB.sign(s, { right: '', left: nm(f.signer) || 'توقيع رئيس المؤسسة' }));
    return { page: 'a4', pages: MK.flowPages({ page: 'a4', cls: 'sb', head, blocks: B }) };
  }

  /* ---------- create / duplicate / delete ---------- */
  function create(tpl, from, act) {
    const sy = MK.curSy(), st = ST(sy);
    const it = { id: uid('mm'), tpl, no0: nextNo(), date0: today() };
    if (act) it.act = act;
    st.items.push(it);
    if (from) { const f = JSON.parse(JSON.stringify(from)); f.no = it.no0; f.date = it.date0; st['m_' + it.id] = f; }
    persist();
    return it;
  }
  function docFor(it) {
    return {
      k: 'm_' + it.id, t: titleOf(it, MK.curSy()), grp: 'm_mine', d: tplOf(it.tpl).name, auto: (window.Cyc && Cyc.single()) ? 'الموظفين ومعطيات المؤسسة' : 'الموظفين والوحدات المدرسية ومعطيات المؤسسة', page: 'a4',
      init: (s, sy) => initFor(it, s, sy),
      defs: (f) => defsFor(it, f),
      onSave: k => (k === 'head1' || k === 'head2' || k === 'sigMode' ? 'redraw' : null),
      act: {
        num: (f, sy, c) => { f.no = nextNo(f.date ? +String(f.date).slice(0, 4) : undefined); c.save('no'); c.toast('الرقم: ' + f.no); },
        refresh: async (f, sy, c) => {
          const a = actFields(it, S(), sy); if (!a) return c.toast('بطاقة النشاط غير متوفرة', true);
          if (!await confirmBox('إعادة كتابة <b>الموضوع والنص وجدول المهام</b> انطلاقا من بطاقة النشاط؟ ستضيع التعديلات اليدوية في هذه الخانات.', 'تحديث', false)) return;
          f.subject = a.subject; f.body = a.body; f.t1 = a.t1.rows.map(r => r.slice()); f.cap1 = a.t1.cap; f.head1 = a.t1.head.join(' | ');
          ['subject', 'body', 't1', 'cap1', 'head1'].forEach(k => c.save(k)); c.toast('تم تحديث المذكرة من بطاقة النشاط');
        },
        dup: async (f, sy, c) => { const n = create(it.tpl, f, it.act); c.toast('تم نسخ المذكرة'); go('memosDoc', { kind: 'm_' + n.id }); },
        del: async (f, sy, c) => {
          if (!await confirmBox(`حذف المذكرة <b>${esc(nm(f.no))}</b> نهائيا؟`, 'حذف')) return;
          const st = ST(sy); st.items = st.items.filter(x => x.id !== it.id); delete st['m_' + it.id]; persist(); toast('تم حذف المذكرة'); go('memos');
        }
      },
      build
    };
  }
  const registerDoc = () => ({
    k: 'm_register', t: 'سجل المذكرات الداخلية', grp: 'm_reg', d: 'لائحة مرقمة بكل مذكرات الموسم: الرقم، التاريخ، الموضوع، الجهة الموجهة إليها.', auto: 'المذكرات المنشأة', page: 'a4l',
    init: () => ({}), defs: () => [{ note: 'يُملأ السجل تلقائيا من المذكرات المنشأة خلال الموسم الدراسي.' }],
    build: (s, f, sy) => {
      const L = items(sy).map(it => fieldsOf(it, sy)).sort((a, b) => nm(a.date).localeCompare(nm(b.date)) || nm(a.no).localeCompare(nm(b.no), 'en', { numeric: true }));
      const rows = L.map((x, i) => tr([i + 1, nm(x.no), x.date ? ldate(x.date) : '', { t: nm(x.subject).replace(/^في شأن\s*/, ''), c: 'r b' }, { t: nm(x.to), c: 'r sm' }, '']));
      for (let i = rows.length; i < 12; i++) rows.push(tr([String(i + 1), { t: '', st: 'height:7.5mm' }, '', '', '', '']));
      return { title: 'سجل المذكرات الداخلية', sub: `الموسم الدراسي ${MK.syDash(sy)} — عدد المذكرات: ${L.length}`, page: 'a4l', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }),
        blocks: [tbl(hd(['ر.ت', 'رقم المذكرة', 'التاريخ', 'الموضوع', 'الموجهة إلى', 'ملاحظات']), rows, 'cmp')] };
    }
  });

  /* ---------- the hub ---------- */
  let C = null;
  const docs = () => items(MK.curSy()).map(docFor).concat([registerDoc()]);
  function center() {
    if (C) return C;
    C = K.center({
      id: 'memos', title: 'المذكرات الداخلية', icon: '📝', route: 'memosDoc', hubRoute: 'memos', noSy: true, docLabel: 'المذكرة',
      groups: [['m_mine', 'مذكرات الموسم'], ['m_reg', 'السجل']], docs, store: sy => ST(sy), years: () => [MK.curSy()],
      intro: 'مذكرات مدير المؤسسة إلى الأطر التربوية: اختر قالبا جاهزا (الأبواب المفتوحة، الروائز، اللقاءات التواصلية، نهاية الأسدس والسنة، الفروض والامتحانات، الحراسة…) فتُنشأ مذكرة مرقمة تلقائيا (NN/YY) بموضوعها ومراجعها ونصها وجداولها، وتُرفق بلائحة توقيع الأساتذة المستخرجة من الموظفين. كل شيء قابل للتعديل.',
      onHub: v => {
        const sy = MK.curSy(), n = items(sy).length;
        if (!n) { const first = v.querySelector('.page-h'); }
        const gal = `<div class="sec-t" style="margin:18px 0 8px">إنشاء مذكرة جديدة — اختر قالبا<span class="muted" style="font-weight:400;font-size:12px"> — الرقم الموالي: <b dir="ltr">${nextNo()}</b></span></div>
          ${Object.keys(TP.groups).map(g => { const L = TP.list.filter(t => t.g === g); return L.length ? `<div class="muted" style="margin:10px 0 5px;font-size:12.5px;font-weight:700">${TP.groups[g]}</div><div class="hub-grid">${L.map(t => `<div class="card hub-card mm-new" data-tpl="${t.id}"><div class="hub-t">${esc(t.name)}</div><div class="hub-d">${esc(t.desc)}</div><div class="hub-a">${ic('plus')} إنشاء مذكرة</div></div>`).join('')}</div>` : ''; }).join('')}`;
        const asrc = actSources(sy);
        if (asrc.length) v.insertAdjacentHTML('beforeend', `<div class="sec-t" style="margin:18px 0 8px">مذكرة حسب نشاط منجز بالمؤسسة<span class="muted" style="font-weight:400;font-size:12px"> — اختر النشاط أو المناسبة فتُحرَّر المذكرة من بطاقته (الأنشطة، فترة الإنجاز، الأندية) ويمكن تعديل كل شيء بعد ذلك</span></div>
          <div class="card mm-act"><div class="mm-act-bar"><input class="inp" id="mmAq" placeholder="ابحث عن نشاط أو مناسبة…"><div class="seg" id="mmAg">${[['', 'الكل'], ['done', 'المنجزة (' + asrc.filter(x => x.done).length + ')']].concat(AG).map(([k, l]) => `<button data-g="${k}" class="${k === '' ? 'on' : ''}">${l}</button>`).join('')}</div></div><div class="mm-act-list" id="mmAl"></div></div>`);
        if (asrc.length) {
          let g = '', q = '';
          const made = key => items(sy).filter(it => it.act === key).length;
          const drawA = () => {
            const L = asrc.filter(x => (g === 'done' ? x.done : !g || x.g === g) && (!q || MK.hkey(x.name).includes(MK.hkey(q))));
            $('#mmAl', v).innerHTML = L.length ? L.map(x => `<div class="mm-act-r"><div><b>${esc(x.name)}</b><div class="muted" style="font-size:11.5px">${esc((AG.find(a => a[0] === x.g) || [])[1] || '')}${x.done ? ` · <span class="mm-ok">منجز${nm(x.f.period) ? ' — ' + esc(x.f.period) : ''}</span>` : ''}${made(x.key) ? ` · ${made(x.key)} مذكرة منشأة` : ''}</div></div><button class="btn sm pri" data-ak="${x.key}">إنشاء مذكرة</button></div>`).join('') : '<p class="muted" style="margin:10px 4px">لا توجد أنشطة مطابقة. أضف أنشطتك الخاصة من «الميزانية ← الأندية ← الاحتفالات والأنشطة المنجزة ← سجل الأنشطة المنجزة».</p>';
            $$('#mmAl [data-ak]', v).forEach(b => b.onclick = () => { const it = create('activity', null, b.dataset.ak); go('memosDoc', { kind: 'm_' + it.id }); });
          };
          $$('#mmAg button', v).forEach(b => b.onclick = () => { g = b.dataset.g; $$('#mmAg button', v).forEach(x => x.classList.toggle('on', x === b)); drawA(); });
          $('#mmAq', v).oninput = e => { q = e.target.value.trim(); drawA(); };
          drawA();
        }
        v.insertAdjacentHTML('beforeend', gal);
        v.querySelectorAll('.mm-new').forEach(c => c.onclick = () => { const it = create(c.dataset.tpl); go('memosDoc', { kind: 'm_' + it.id }); });
        if (!n) { const h = v.querySelector('.sec-t'); }
      }
    });
    return C;
  }
  Dx.modCss += `
  .mm-meta{display:flex;justify-content:space-between;align-items:baseline;font-size:11pt;margin:1mm 0 1.5mm}
  .mm-ft{font-size:11pt;line-height:1.75;margin:0 0 1mm;text-align:center}.mm-ft div{margin:0}
  .mm-sub{border:1.2px solid #1f3864;background:#eef3fb;padding:1.3mm 3mm;font-size:11.5pt;line-height:1.7;margin:1.5mm 0 2mm;border-radius:1.5mm;text-align:justify}
  .mm-ref{font-size:9.6pt;line-height:1.55;margin:0 0 2mm}.mm-ref ul{margin:.3mm 0 0;padding:0 5mm 0 0;list-style:disc}.mm-ref li{margin:0 0 .3mm}
  .mm-sal{text-align:center;font-weight:700;font-size:11pt;margin:1.5mm 0 1mm}
  .mm-cl{text-align:center;font-size:10.8pt;margin:2mm 0 2mm;font-weight:700}
  .tbl.sb-t.mm-sig td{height:7mm}`;
  // light list for other modules (e.g. the work-tracking grid can turn a memo into a task column)
  const list = sy => { sy = sy || MK.curSy(); return items(sy).map(it => ({ id: it.id, title: titleOf(it, sy), subject: nm(fieldsOf(it, sy).subject).replace(/^في شأن\s*/, '') })); };
  window.Memos = { nextNo, items, create, center, list };
  window.pageMemos = (v, a) => { center().hub(v, a); };
  window.pageMemosDoc = (v, a) => { center().doc(v, a); };
})();
