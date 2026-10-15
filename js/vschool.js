'use strict';
/* 1.9.3 — «الحراسة العامة»: مراسلات أولياء الأمور والاستدعاءات والالتزامات وأوراق الحراسة اليومية، مقتبسة من «عدة الحراسة العامة» ومعتمدة على بقية البرنامج.
   Les formulaires s'adaptent au cycle choisi dans «الإعدادات» (ابتدائي: «إدارة المؤسسة»؛ إعدادي / تأهيلي: «الحراسة العامة»).
   Tout est relié:
   - سجل غياب التلاميذ  → الغياب المتواصل (أسبوع / أسبوعان / شهر) يولّد تلقائيا مراسلات المتغيبين والاستدعاءات؛ المتأخرون يولّدون «ورقة الدخول»؛
     ساعات الغياب المبرر وغير المبرر تحسب «نقطة المواظبة» ونسبة المواظبة الشهرية؛ العطل المدرسية لا تقطع تواصل الغياب
   - بطاقة التلاميذ → اسم ولي الأمر ورقم بطاقته وعنوانه وهاتفه، القسم والرقم الترتيبي، والتلاميذ غير الملتحقين
   - الموظفون → أسماء الأساتذة ومواد تدريسهم في إشعار المخالفة وتقرير الأستاذ(ة)
   Data: DB.vschool = { cfg: { t1, t2, t3, gs }, years: { [sy]: { <doc key>: fields } } } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  const today = () => Dx.todayIso();
  const fd = iso => (iso ? Dx.fmtDate(iso) : '');
  const kind = () => (window.Cyc ? Cyc.kind() : 'pri');
  const isSec = () => kind() !== 'pri';
  const syText = sy => MK.syDash(sy).replace('-', '/');
  const hk = s => MK.hkey(s);
  const AR = () => window.AbsReg;

  /* ---------- wording: depends on the cycle of the school ---------- */
  const WD = () => {
    const k = kind(), sec = k !== 'pri';
    const inst = k === 'lyc' ? 'الثانوية التأهيلية' : k === 'col' ? 'الثانوية الإعدادية' : 'المدرسة';
    return {
      sec, inst, office: sec ? 'الحراسة العامة' : 'إدارة المؤسسة', refLbl: sec ? 'الحراسة العامة رقم' : 'الصادر رقم',
      gsT: sec ? 'الحارس(ة) العام(ة)' : 'مدير(ة) المؤسسة', dirT: 'السيد(ة) مدير(ة) ' + inst, bureau: sec ? 'مكتب الحراسة العامة' : 'مكتب الإدارة',
      sign: sec ? 'توقيع الحارس(ة) العام(ة)' : 'توقيع رئيس المؤسسة', supT: sec ? 'الحارس العام' : 'مدير(ة) المؤسسة'
    };
  };
  // gendered words (M / F / unknown)
  const W3 = {
    son: ['ابنكم', 'ابنتكم', 'ابنكم (ابنتكم)'], sonI: ['ابني', 'ابنتي', 'ابني (ابنتي)'], pupil: ['التلميذ', 'التلميذة', 'التلميذ(ة)'],
    abs: ['تغيب', 'تغيبت', 'تغيب (ت)'], hisAbs: ['غيابه', 'غيابها', 'غيابه (ها)'], join: ['التحاقه', 'التحاقها', 'التحاقه (ها)'],
    him: ['عليه', 'عليها', 'عليه (ها)'], come: ['يعود', 'تعود', 'يعود (تعود)'], attend: ['يحضر', 'تحضر', 'يحضر (تحضر)'], sess: ['حصصه', 'حصصها', 'حصصه (ها)'],
    fromHim: ['منه', 'منها', 'منه (ها)'], respect: ['يحترم', 'تحترم', 'يحترم (تحترم)'], study: ['يدرس', 'تدرس', 'يدرس (تدرس)'], will: ['لن يعود', 'لن تعود', 'لن يعود (تعود)']
  };
  const gw = (key, g) => W3[key][g === 'M' ? 0 : g === 'F' ? 1 : 2];

  /* ---------- data ---------- */
  const root = () => {
    const g = (DB.vschool = DB.vschool && typeof DB.vschool === 'object' ? DB.vschool : {});
    g.years = g.years && typeof g.years === 'object' ? g.years : {};
    g.cfg = g.cfg && typeof g.cfg === 'object' ? g.cfg : {};
    const c = g.cfg; if (!(+c.t1 > 0)) c.t1 = 5; if (!(+c.t2 > 0)) c.t2 = 10; if (!(+c.t3 > 0)) c.t3 = 22; if (typeof c.gs !== 'string') c.gs = '';
    return g;
  };
  const CFG = () => root().cfg;
  const ST = sy => { const y = root().years; return y[sy] || (y[sy] = {}); };

  /* ---------- pupils and guardians ---------- */
  const fullN = p => `${p.last || ''} ${p.first || ''}`.trim();
  const allPupils = sy => (window.Pupils && Pupils.Y ? Pupils.Y(sy).pupils : []) || [];
  function findPupil(sy, o) {
    const L = allPupils(sy), c = nm(o.code).toUpperCase();
    if (c) { const x = L.find(p => String(p.code || '').toUpperCase() === c); if (x) return x; }
    const k = hk(o.name || ''); if (!k) return null;
    return L.find(p => hk(fullN(p)) === k || hk(`${p.first || ''} ${p.last || ''}`) === k) || null;
  }
  const gOf = o => (o ? [o.first, o.last].filter(Boolean).join(' ') : '');
  // the person in charge: the type chosen in the pupil card (أب / أم / وصي), else the tutor, else the father, else the mother
  function guardOf(p) {
    const g = (p && p.guard) || {};
    const order = g.type === 'أب' ? ['father', 'tutor', 'mother'] : g.type === 'أم' ? ['mother', 'tutor', 'father'] : g.type === 'وصي' ? ['tutor', 'father', 'mother'] : ['tutor', 'father', 'mother'];
    const pick = order.map(k => g[k]).find(o => o && (gOf(o) || o.cin));
    return pick ? { name: gOf(pick), cin: pick.cin || '', addr: pick.addr || '', phone: pick.phone || '' } : { name: '', cin: '', addr: '', phone: '' };
  }
  const rankOf = (sy, p) => { if (!p || !p.cls || !AR()) return ''; const i = AR().pupilsOf(sy, p.cls).findIndex(q => AR().pkey(q) === AR().pkey(p)); return i >= 0 ? String(i + 1) : ''; };
  const lvlShort = p => { const r = window.Pupils && Pupils.people ? Pupils.people(MK.curSy()).find(x => x.code && x.code === String(p.code || '').toUpperCase()) : null; return r ? r.lvlSh : ''; };
  function caseOf(sy, p, x) {
    p = p || {}; const g = guardOf(p);
    return Object.assign({ name: fullN(p), code: p.code || '', cls: p.cls || '', no: rankOf(sy, p), g: p.g || '', gd: g.name, cin: g.cin, addr: g.addr, phone: g.phone, lvl: lvlShort(p), birth: p.birth || '', from: '', to: '', n: 0 }, x || {});
  }
  // a manual row: [pupil, class, number, from, to]
  function rowCase(sy, r) {
    const p = findPupil(sy, { name: r[0] });
    const c = p ? caseOf(sy, p) : { name: '', code: '', cls: '', no: '', g: '', gd: '', cin: '', addr: '', phone: '', lvl: '', birth: '', from: '', to: '', n: 0 };
    c.name = nm(r[0]) || c.name; if (nm(r[1])) c.cls = nm(r[1]); if (nm(r[2])) c.no = nm(r[2]);
    c.from = r[3] || ''; c.to = r[4] || ''; return c;
  }
  const hasRow = r => (r || []).some(x => nm(x));
  // fields filled when a pupil is chosen in a form
  const PUP_KEYS = ['code', 'cls', 'no', 'g', 'gd', 'cin', 'addr', 'phone', 'lvl', 'birth'];
  function fillPupil(f, rec) {
    const sy = MK.curSy(), p = findPupil(sy, { code: rec.code, name: rec.name }) || { first: rec.first, last: rec.last, code: rec.code, cls: rec.cls, g: rec.g };
    const c = caseOf(sy, p);
    PUP_KEYS.forEach(k => { if (k === 'cls' && f.cls && !rec.cls) return; f[k] = c[k] || ''; });
    if (!c.cls && rec.cls) f.cls = rec.cls;
  }
  const pupLink = { src: 'pupil', keys: { code: 'code', cls: 'cls' }, post: (f, r) => fillPupil(f, r.rec) };
  const pupGrid = { src: 'pupil', n: 0, cols: { cls: 1 }, post: (row, r) => { const p = findPupil(MK.curSy(), { code: r.rec.code, name: r.rec.name }); row[2] = p ? rankOf(MK.curSy(), p) : ''; } };
  const keepPupil = (store, f) => PUP_KEYS.forEach(k => { store[k] = f[k]; });

  /* ---------- small html helpers ---------- */
  const dot = (v, w) => (nm(v) ? `<b>${esc(v)}</b>` : `<span class="vs-dt" style="min-width:${w || 30}mm">&nbsp;</span>`);
  const cb = on => `<span class="cb">${on ? '✕' : ''}</span>`;
  const refNo = (f, i) => { const r = nm(f.ref); if (!r) return dot('', 16); return /^\d+$/.test(r) ? String(+r + i) : esc(r); };
  const gsName = f => nm(f.gs) || nm(CFG().gs);
  // 1.9.4: with the digital stamp, room is kept under the signature (the stamp never covers the next letter)
  const stmRoom = W => { try { const c = window.Stamp && Stamp.cfg(); return c && c.on && Stamp.LABEL.test(W.sign) ? ` style="padding-bottom:${(c.h + 1).toFixed(1)}mm"` : ''; } catch (_) { return ''; } };
  const signHtml = (W, f) => `<div class="vs-sg"${stmRoom(W)}><div>${W.sign}${gsName(f) ? `<br><span class="nm">${esc(gsName(f))}</span>` : ''}</div></div>`;
  const topHtml = (s, W, f, no) => `<div class="vs-top"><div></div><div class="vs-fr">من إدارة ${esc(s.school || W.inst)}<br>بـ: ${dot(nm(f.city) || s.city, 26)}<br>${W.refLbl}: ${no}</div><div class="vs-dd">في: ${esc(fd(f.date))}</div></div>`;
  const toLine = c => `<div class="vs-to">إلى السيد(ة): ${dot(c.gd, 70)}</div>`;
  const letterBlocks = (arr) => arr.map(h => ({ html: `<div class="vs-let">${h}</div>` }));
  const flow = (blocks, page) => MK.flowPages({ page: page || 'a4', cls: 'vs', head: '', blocks, pno: false });

  const DOCS = [];
  const classOpts = () => [['', 'كل الأقسام']].concat((AR() ? AR().classes(MK.curSy()) : []).map(c => [c, c]));
  const clsOnly = () => (AR() ? AR().classes(MK.curSy()) : []).map(c => [c, c]);
  const BLANK = () => ({ name: '', code: '', cls: '', no: '', g: '', gd: '', cin: '', addr: '', phone: '', lvl: '', birth: '', from: '', to: '', n: 0 });
  const dateKeep = (k, store) => { if (k === 'date') delete store.date; };           // the date of a letter restarts at today's date next time
  const SHARED = k => (k === 't1' || k === 't2' || k === 't3' || k === 'gs');
  const shareCfg = (k, f) => { if (SHARED(k)) { const c = CFG(); if (k === 'gs') c.gs = nm(f.gs); else if (+f[k] > 0) c[k] = +f[k]; } };

  /* ===================== 1. continuous absence ===================== */
  const STAGES = [['1', 'المراسلة الأولى — التغيب لمدة أسبوع'], ['2', 'المراسلة الثانية — التغيب لمدة أسبوعين'], ['3', 'المراسلة الثالثة — التغيب لمدة شهر والتشطيب من اللوائح']];
  const thrOf = (f, st) => Math.max(1, +f['t' + st] || CFG()['t' + st]);
  function absCases(sy, f, stage) {
    const lo = thrOf(f, stage), hi = stage < 3 ? thrOf(f, stage + 1) : Infinity, out = [];
    if (f.src === 'man' || !AR()) return out;
    (nm(f.cls) ? [f.cls] : AR().classes(sy)).forEach(c => {
      AR().spans(sy, c, { asOf: f.date || today() }).forEach(x => {
        const st = f.cur === 'all' ? x.longest : (x.ongoing ? x.last : null);
        if (!st || st.n < lo || st.n >= hi) return;
        out.push(caseOf(sy, x.p, { no: String(x.no), from: st.from, to: st.to, n: st.n }));
      });
    });
    return out;
  }
  function absLetter(s, f, c, i) {
    const W = WD(), st = +f.stage || 1, g = c.g;
    const subj = st === 1 ? 'إشعار بتغيب تلميذ(ة)' : st === 2 ? 'إشعار ثان بتغيب تلميذ(ة)' : 'إشعار بالتشطيب لانقطاع تلميذ(ة) عن الدراسة';
    const intro = `<p class="vs-p">يؤسفني أن أخبركم أن ${gw('son', g)} ${gw('pupil', g)}: ${dot(c.name, 64)}</p>
      <p class="vs-p">قسم: ${dot(c.cls, 22)} رقم: ${dot(c.no, 12)} ${gw('abs', g)} عن الدراسة ${st === 1 ? 'منذ أسبوع' : st === 2 ? 'منذ أسبوعين' : 'لمدة شهر واحد ويوم'}،</p>
      <p class="vs-p">من: ${dot(fd(c.from), 32)} إلى: ${dot(fd(c.to), 32)}</p>`;
    const end = st < 3
      ? `<p class="vs-p">وعليه، فإني أدعوكم للحضور إلى المؤسسة في أقرب وقت ممكن، لتبرير ${gw('hisAbs', g)}.</p>
         <p class="vs-p">كما أدعوكم للقيام بكل ما من شأنه العمل على ${gw('join', g)} للدراسة بالمؤسسة.</p>`
      : `<p class="vs-p">وعليه، فإنه تم التشطيب ${gw('him', g)} من لوائح المؤسسة، ابتداء من: ${dot(fd(f.strike), 40)}</p>`;
    return topHtml(s, W, f, refNo(f, i)) + toLine(c) + `<div class="vs-obj">الموضوع: <u>${subj}</u></div>` + intro + end + signHtml(W, f);
  }
  DOCS.push({
    k: 'vs_abs', t: 'مراسلات المتغيبين (أسبوع / أسبوعان / التشطيب)', grp: 'vs_a', page: 'a4',
    d: 'ثلاث مراسلات إلى أولياء الأمور بحسب مدة الغياب المتواصل (أسبوع، أسبوعان، شهر وإنذار بالتشطيب)، ثلاث مراسلات في الصفحة الواحدة، تُولَّد لكل متغيب تلقائيا.',
    auto: 'سجل غياب التلاميذ (الغياب المتواصل مع تجاوز العطل) وبطاقة التلاميذ (ولي الأمر والقسم والرقم)',
    init: (s, sy) => ({ stage: '1', src: 'auto', cls: '', cur: 'cur', city: s.city || '', date: today(), ref: '', gs: '', strike: '', t1: String(CFG().t1), t2: String(CFG().t2), t3: String(CFG().t3), blanks: '3', rows: [] }),
    defs: (f, sy) => {
      const n = absCases(sy, f, +f.stage || 1).length;
      return [
        { note: 'تُحسب مدة الغياب من «سجل غياب التلاميذ»: يُعدّ اليوم غيابا إذا سُجل غياب (غ أو ب) في نصف حصص اليوم على الأقل. تتصل الأيام الدراسية ببعضها فوق نهاية الأسبوع والعطل المدرسية.' },
        { sec: 'نوع المراسلة ومصدر اللائحة' },
        { k: 'stage', l: 'المراسلة', t: 'select', opts: STAGES },
        { k: 'src', l: 'مصدر لائحة التلاميذ', t: 'select', half: true, opts: [['auto', 'تلقائيا من سجل غياب التلاميذ + اللائحة اليدوية'], ['man', 'اللائحة اليدوية فقط']] },
        { k: 'cls', l: 'القسم', t: 'select', half: true, opts: classOpts },
        { k: 'cur', l: 'الغياب المحتسب', t: 'select', half: true, opts: [['cur', 'الغياب المتواصل الجاري (إلى تاريخ المراسلة)'], ['all', 'أطول فترة غياب متواصل مسجلة']] },
        { t: 'html', half: true, html: `<div class="muted" style="font-size:12.2px;line-height:1.9;margin-top:22px">${f.src === 'man' ? 'اللائحة اليدوية فقط.' : `عدد المتغيبين المستوفين للمرحلة المختارة: <b>${n}</b>`}</div>` },
        { k: 't1', l: 'عتبة المراسلة الأولى (أيام دراسية متواصلة)', t: 'num', half: true }, { k: 't2', l: 'عتبة المراسلة الثانية', t: 'num', half: true },
        { k: 't3', l: 'عتبة المراسلة الثالثة (التشطيب)', t: 'num', half: true }, { k: 'strike', l: 'تاريخ التشطيب (المراسلة الثالثة)', t: 'date', half: true },
        { sec: 'بيانات المراسلة' },
        { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
        { k: 'ref', l: 'رقم الصادر (يزداد تلقائيا مع كل مراسلة)', half: true }, { k: 'gs', l: `اسم ${WD().supT} (يُحفظ لكل الوثائق)`, half: true, ph: CFG().gs },
        { k: 'blanks', l: 'عدد النسخ الفارغة إن لم يوجد تلميذ', t: 'num', half: true },
        window.Budget.gridDef('rows', 'تلاميذ إضافيون (إدخال يدوي)', ['التلميذ(ة)', 'القسم', 'الرقم', 'من', 'إلى'], { widths: ['1.7fr', '.8fr', '.5fr', '1fr', '1fr'], types: ['text', 'text', 'text', 'date', 'date'], list: ['k2Pupils'], link: pupGrid })
      ];
    },
    onSave: (k, f, sy, store) => { dateKeep(k, store); shareCfg(k, f); return (k === 'stage' || k === 'src' || k === 'cls' || k === 'cur') ? 'redraw' : null; },
    build: (s, f, sy) => {
      const st = +f.stage || 1, cases = absCases(sy, f, st).concat((f.rows || []).filter(hasRow).map(r => rowCase(sy, r)));
      const list = cases.length ? cases : Array.from({ length: Math.max(1, Math.min(9, +f.blanks || 3)) }, BLANK);
      return { pages: flow(letterBlocks(list.map((c, i) => absLetter(s, f, c, i)))), page: 'a4' };
    }
  });

  /* ===================== 2. never joined ===================== */
  function njCases(sy, f) {
    if (f.src === 'man') return [];
    const mv = window.Pupils ? Pupils.movesOf(sy, 'notjoined') : [];
    return mv.map(m => { const p = findPupil(sy, { code: m.code, name: fullN(m) }) || m; const c = caseOf(sy, p); c.no = ''; if (!c.cls) c.cls = c.lvl; return c; });
  }
  DOCS.push({
    k: 'vs_nj', t: 'مراسلة غير الملتحقين', grp: 'vs_a', page: 'a4',
    d: 'مراسلة إلى ولي أمر التلميذ(ة) الذي لم يلتحق بالدراسة منذ بداية السنة، مع إنذار بالتشطيب في حال استمرار الغياب — تُولَّد من لائحة غير الملتحقين في بطاقة التلاميذ.',
    auto: 'بطاقة التلاميذ (غير الملتحقين وبيانات ولي الأمر)',
    init: (s, sy) => ({ src: 'auto', city: s.city || '', date: today(), ref: '', gs: '', until: 'اليوم', blanks: '3', rows: [] }),
    defs: (f, sy) => [
      { note: 'تُستخرج لائحة غير الملتحقين من «بطاقة التلاميذ ← غير الملتحقون»، ويُضاف اسم ولي الأمر وعنوانه تلقائيا إن كانت معلوماته مسجلة.' },
      { k: 'src', l: 'مصدر اللائحة', t: 'select', half: true, opts: [['auto', 'تلقائيا من بطاقة التلاميذ + اللائحة اليدوية'], ['man', 'اللائحة اليدوية فقط']] },
      { k: 'until', l: 'عبارة نهاية الغياب', t: 'select', half: true, opts: ['اليوم', 'الآن'] },
      { t: 'html', html: `<div class="muted" style="font-size:12.2px;margin:2px 0 6px">عدد غير الملتحقين المسجلين: <b>${njCases(sy, f).length}</b></div>` },
      { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      { k: 'ref', l: 'رقم الصادر (يزداد تلقائيا)', half: true }, { k: 'gs', l: `اسم ${WD().supT} (يُحفظ لكل الوثائق)`, half: true, ph: CFG().gs },
      { k: 'blanks', l: 'عدد النسخ الفارغة إن لم يوجد تلميذ', t: 'num', half: true },
      window.Budget.gridDef('rows', 'تلاميذ إضافيون (إدخال يدوي)', ['التلميذ(ة)', 'القسم', 'الرقم'], { widths: ['1.8fr', '.9fr', '.6fr'], list: ['k2Pupils'], link: pupGrid })
    ],
    onSave: (k, f, sy, store) => { dateKeep(k, store); shareCfg(k, f); return k === 'src' ? 'redraw' : null; },
    build: (s, f, sy) => {
      const W = WD(), cases = njCases(sy, f).concat((f.rows || []).filter(hasRow).map(r => rowCase(sy, r)));
      const list = cases.length ? cases : Array.from({ length: Math.max(1, Math.min(9, +f.blanks || 3)) }, BLANK);
      return { page: 'a4', pages: flow(letterBlocks(list.map((c, i) => { const g = c.g;
        return topHtml(s, W, f, refNo(f, i)) + toLine(c) + `<div class="vs-obj">الموضوع: <u>إشعار بعدم التحاق تلميذ(ة) بالدراسة</u></div>
          <p class="vs-p">يؤسفني أن أخبركم أن ${gw('son', g)} ${gw('pupil', g)}: ${dot(c.name, 64)}</p>
          <p class="vs-p">قسم: ${dot(c.cls, 22)} رقم: ${dot(c.no, 12)} ${gw('abs', g)} عن الدراسة منذ بداية السنة الدراسية إلى ${esc(f.until || 'اليوم')}.</p>
          <p class="vs-p">وعليه، فإني أدعوكم للقيام بكل ما من شأنه العمل على ${gw('join', g)} للدراسة بالمؤسسة.</p>
          <p class="vs-p">وفي حال استمرار غياب ${gw('son', g)}، فإنه سيتم التشطيب ${gw('him', g)} من لوائح المؤسسة.</p>` + signHtml(W, f); }))) };
    }
  });

  /* ===================== 3. summons ===================== */
  const REASONS = [['abs', 'تغيب التلميذ(ة)'], ['lat', 'تأخرات التلميذ(ة) المتكررة'], ['beh', 'سلوك التلميذ(ة)'], ['stu', 'مستوى التلميذ(ة) الدراسي'], ['oth', 'موضوع آخر (يكتب أدناه)']];
  function sumCases(sy, f) {
    if (f.src === 'man' || f.reason !== 'abs' || !AR()) return [];
    const lo = Math.max(1, +f.minDays || 3), out = [];
    (nm(f.cls) ? [f.cls] : AR().classes(sy)).forEach(c => AR().spans(sy, c, { asOf: f.date || today() }).forEach(x => {
      if (x.ongoing && x.last && x.last.n >= lo) out.push(caseOf(sy, x.p, { no: String(x.no), from: x.last.from, to: x.last.to, n: x.last.n }));
    }));
    return out;
  }
  DOCS.push({
    k: 'vs_sum', t: 'استدعاء ولي الأمر', grp: 'vs_a', page: 'a4',
    get d() { return 'استدعاء ولي أمر التلميذ(ة) للحضور إلى ' + WD().bureau + ' بسبب الغياب أو التأخر أو السلوك أو المستوى الدراسي، ثلاثة استدعاءات في الصفحة.'; },
    auto: 'سجل غياب التلاميذ (من تجاوز مدة الغياب المحددة) وبطاقة التلاميذ',
    init: (s, sy) => ({ reason: 'abs', other: '', src: 'auto', cls: '', minDays: '3', city: s.city || '', date: today(), when: '', hour: '', gs: '', blanks: '3', rows: [] }),
    defs: (f, sy) => [
      { k: 'reason', l: 'سبب الاستدعاء', t: 'select', opts: REASONS },
      f.reason === 'oth' ? { k: 'other', l: 'موضوع الاستدعاء', ph: 'مثال: مشاركة ابنكم في مشاجرة داخل المؤسسة' } : null,
      f.reason === 'abs' ? { k: 'src', l: 'مصدر اللائحة', t: 'select', half: true, opts: [['auto', 'تلقائيا من سجل غياب التلاميذ + اللائحة اليدوية'], ['man', 'اللائحة اليدوية فقط']] } : null,
      f.reason === 'abs' ? { k: 'minDays', l: 'الحد الأدنى لأيام الغياب المتواصل', t: 'num', half: true } : null,
      f.reason === 'abs' ? { k: 'cls', l: 'القسم', t: 'select', half: true, opts: classOpts } : null,
      f.reason === 'abs' ? { t: 'html', half: true, html: `<div class="muted" style="font-size:12.2px;margin-top:22px">عدد المستدعين تلقائيا: <b>${sumCases(sy, f).length}</b></div>` } : null,
      { sec: 'الموعد والبيانات' },
      { k: 'when', l: 'تاريخ الحضور (اختياري)', t: 'date', half: true }, { k: 'hour', l: 'الساعة (اختياري)', half: true, ph: '10:00' },
      { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'تاريخ الاستدعاء', t: 'date', half: true },
      { k: 'gs', l: `اسم ${WD().supT} (يُحفظ لكل الوثائق)`, half: true, ph: CFG().gs }, { k: 'blanks', l: 'عدد النسخ الفارغة إن لم يوجد تلميذ', t: 'num', half: true },
      window.Budget.gridDef('rows', 'تلاميذ إضافيون (إدخال يدوي)', ['التلميذ(ة)', 'القسم', 'الرقم', 'تغيب منذ يوم', ''], { widths: ['1.7fr', '.8fr', '.5fr', '1fr', '.01fr'], types: ['text', 'text', 'text', 'date', 'ro'], list: ['k2Pupils'], link: pupGrid })
    ].filter(Boolean),
    onSave: (k, f, sy, store) => { dateKeep(k, store); shareCfg(k, f); return (k === 'reason' || k === 'src' || k === 'cls') ? 'redraw' : null; },
    build: (s, f, sy) => {
      const W = WD(), cases = sumCases(sy, f).concat((f.rows || []).filter(hasRow).map(r => rowCase(sy, r)));
      const list = cases.length ? cases : Array.from({ length: Math.max(1, Math.min(9, +f.blanks || 3)) }, BLANK);
      const subj = { abs: 'استدعاء في شأن تغيب ابنكم (ابنتكم)', lat: 'استدعاء في شأن تأخرات ابنكم (ابنتكم)', beh: 'استدعاء في شأن سلوك ابنكم (ابنتكم)', stu: 'استدعاء في شأن المستوى الدراسي لابنكم (ابنتكم)', oth: nm(f.other) || 'استدعاء' }[f.reason || 'abs'];
      return { page: 'a4', pages: flow(letterBlocks(list.map((c, i) => { const g = c.g;
        const why = f.reason === 'abs' ? `بتغيبات ${gw('son', g)} ${dot(c.name, 46)} قسم: ${dot(c.cls, 18)} والذي ${gw('abs', g)} منذ يوم: ${dot(fd(c.from), 30)}`
          : f.reason === 'lat' ? `بتأخرات ${gw('son', g)} ${dot(c.name, 46)} قسم: ${dot(c.cls, 18)} المتكررة`
          : f.reason === 'beh' ? `بسلوك ${gw('son', g)} ${dot(c.name, 46)} قسم: ${dot(c.cls, 18)}`
          : f.reason === 'stu' ? `بمستوى ${gw('son', g)} ${dot(c.name, 46)} قسم: ${dot(c.cls, 18)} الدراسي`
          : `بخصوص ${gw('son', g)} ${dot(c.name, 46)} قسم: ${dot(c.cls, 18)}`;
        return topHtml(s, W, f, dot('', 14)).replace(`${W.refLbl}: ${dot('', 14)}`, `${W.refLbl}: ${dot('', 14)}`) + toLine(c) + `<div class="vs-obj">الموضوع: <u>${esc(subj)}</u></div>
          <p class="vs-p">وبعد، يؤسفني أن أستدعيكم للحضور إلى ${W.bureau} قصد إخباركم ${why}.</p>
          ${f.when || f.hour ? `<p class="vs-p">وذلك يوم: <b>${esc(f.when ? K.dayName(f.when) + ' ' + fd(f.when) : '..........')}</b>${f.hour ? ` على الساعة: <b>${esc(f.hour)}</b>` : ''}.</p>` : ''}
          <p class="vs-p">وبه وجب الإخبار والسلام.</p>` + signHtml(W, f); }))) };
    }
  });

  /* ===================== 4. entry slip + doctor slip ===================== */
  const prevDay = (iso, sy) => { let d = AR().addDays(iso, -1), g = 0; while (g++ < 60) { const w = (new Date(d + 'T00:00:00Z').getUTCDay() + 6) % 7; if (w < 5 && !AR().isHol(d, sy)) return d; d = AR().addDays(d, -1); } return iso; };
  function inRows(sy, f) {
    const out = [];
    if (f.mode === 'late' || f.mode === 'prev') {
      const day = f.mode === 'late' ? f.date : prevDay(f.date, sy);
      (AR() ? AR().dayList(sy, day) : []).filter(x => f.mode === 'late' ? x.l > 0 : (x.a + x.j) > 0).forEach(x => out.push({ name: fullN(x.p), cls: x.cls, time: '' }));
    }
    (f.rows || []).filter(hasRow).forEach(r => out.push({ name: nm(r[0]), cls: nm(r[1]), time: nm(r[2]) }));
    return out;
  }
  const slipPages = (list, mk, per) => { const rows = []; for (let i = 0; i < list.length; i += 2) rows.push(`<div class="vs-row">${mk(list[i])}${list[i + 1] ? mk(list[i + 1]) : '<div></div>'}</div>`); return flow(rows.map(h => ({ html: h })), 'a4'); };
  DOCS.push({
    k: 'vs_in', t: 'ورقة الدخول إلى القسم', grp: 'vs_b', page: 'a4',
    d: 'إذن بالدخول إلى القسم للتلميذ(ة) المتأخر أو العائد بعد غياب، ثماني أوراق في الصفحة قابلة للقص — تُولَّد لمتأخري اليوم من سجل الغياب.',
    auto: 'سجل غياب التلاميذ (المتأخرون في يوم محدد، أو الغائبون في آخر يوم دراسة سابق)',
    init: (s, sy) => ({ mode: AR() ? 'late' : 'blank', date: today(), copies: '8', rows: [] }),
    defs: (f, sy) => [
      { k: 'mode', l: 'محتوى الأوراق', t: 'select', opts: [['late', 'المتأخرون في التاريخ المحدد (من سجل غياب التلاميذ)'], ['prev', 'الغائبون في آخر يوم دراسة قبل التاريخ المحدد (إذن العودة)'], ['man', 'اللائحة اليدوية فقط'], ['blank', 'أوراق فارغة للتعبئة بخط اليد']] },
      { k: 'date', l: 'التاريخ (يوم الدخول)', t: 'date', half: true }, f.mode === 'blank' ? { k: 'copies', l: 'عدد الأوراق', t: 'num', half: true } : { t: 'html', half: true, html: `<div class="muted" style="font-size:12.2px;margin-top:22px">عدد الأوراق الجاهزة: <b>${inRows(sy, f).length}</b></div>` },
      window.Budget.gridDef('rows', 'تلاميذ إضافيون (إدخال يدوي)', ['التلميذ(ة)', 'القسم', 'الساعة'], { widths: ['1.8fr', '.9fr', '.7fr'], list: ['k2Pupils'], link: { src: 'pupil', n: 0, cols: { cls: 1 } } })
    ],
    onSave: (k, f, sy, store) => { dateKeep(k, store); return k === 'mode' ? 'redraw' : null; },
    build: (s, f, sy) => {
      const W = WD(), L = f.mode === 'blank' ? Array.from({ length: Math.max(1, Math.min(40, +f.copies || 8)) }, () => ({ name: '', cls: '', time: '' })) : inRows(sy, f);
      const list = L.length ? L : Array.from({ length: 8 }, () => ({ name: '', cls: '', time: '' }));
      const day = f.date ? `${K.dayName(f.date)} ${fd(f.date)}` : '';
      return { page: 'a4', pages: slipPages(list, c => `<div class="vs-slip"><div class="h">${esc(s.school || W.inst)}</div>
        <div>يسمح للتلميذ(ة): ${dot(c.name, 44)}</div><div>قسم: ${dot(c.cls, 24)}</div><div>بالدخول إلى القسم يوم: ${f.mode === 'blank' ? dot('', 40) : `<b>${esc(day)}</b>`}</div>
        <div>على الساعة: ${dot(c.time, 26)}</div><div class="ft">${W.office}</div></div>`) };
    }
  });
  DOCS.push({
    k: 'vs_med', t: 'ورقة زيارة الطبيب', grp: 'vs_b', page: 'a4',
    d: 'إذن لتلميذ(ة) بزيارة مصلحة الوقاية المدرسية بالمستوصف للفحص — تُطبع لتلاميذ قسم كامل أو للائحة تختارها أو فارغة.',
    auto: 'بطاقة التلاميذ (لوائح الأقسام)',
    init: (s, sy) => ({ mode: 'man', cls: '', city: s.city || '', date: today(), copies: '8', rows: [] }),
    defs: (f, sy) => [
      { k: 'mode', l: 'محتوى الأوراق', t: 'select', opts: [['man', 'اللائحة اليدوية'], ['cls', 'كل تلاميذ القسم المختار'], ['blank', 'أوراق فارغة للتعبئة بخط اليد']] },
      f.mode === 'cls' ? { k: 'cls', l: 'القسم', t: 'select', half: true, opts: clsOnly } : null,
      f.mode === 'blank' ? { k: 'copies', l: 'عدد الأوراق', t: 'num', half: true } : null,
      { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      window.Budget.gridDef('rows', 'التلاميذ', ['التلميذ(ة)', 'القسم'], { widths: ['1.9fr', '1fr'], list: ['k2Pupils'], link: { src: 'pupil', n: 0, cols: { cls: 1 } } })
    ].filter(Boolean),
    onSave: (k, f, sy, store) => { dateKeep(k, store); return k === 'mode' ? 'redraw' : null; },
    build: (s, f, sy) => {
      const W = WD();
      let list = (f.rows || []).filter(hasRow).map(r => ({ name: nm(r[0]), cls: nm(r[1]) }));
      if (f.mode === 'cls' && AR() && nm(f.cls)) list = AR().pupilsOf(sy, f.cls).map(p => ({ name: fullN(p), cls: p.cls })).concat(list);
      if (f.mode === 'blank') list = Array.from({ length: Math.max(1, Math.min(40, +f.copies || 8)) }, () => ({ name: '', cls: '' }));
      if (!list.length) list = Array.from({ length: 8 }, () => ({ name: '', cls: '' }));
      return { page: 'a4', pages: slipPages(list, c => `<div class="vs-slip"><div class="h u">ورقة زيارة الطبيب</div>
        <div>يسمح للتلميذ(ة): ${dot(c.name, 44)}</div><div>القسم: ${dot(c.cls, 26)}</div><div>بزيارة مصلحة الوقاية المدرسية بالمستوصف للفحص</div>
        <div>${esc(nm(f.city) || s.city || '')} في: ${f.date ? `<b>${esc(fd(f.date))}</b>` : dot('', 30)}</div>
        <div class="ft two"><span>تأشيرة السيد الطبيب</span><span>الإدارة</span></div></div>`) };
    }
  });

  /* ===================== 5. forms: notice of a violation, teacher's report ===================== */
  const MEAS = ['إحضار ولي أمره قصد إخباره وملاقاتي شخصيا', 'إحضار ولي أمره وتوقيع التزام مصادق عليه', 'إحالته على مجلس القسم / المجلس الانضباطي', 'إجراء آخر يقترحه الأستاذ(ة)'];
  const teacherLink = { src: 'emp', keys: {}, post: (f, r) => { if (r.rec && r.rec.subject) f.subject = r.rec.subject; } };
  DOCS.push({
    k: 'vs_notice', get t() { return WD().sec ? 'إشعار الحراسة العامة بمخالفة تلميذ(ة)' : 'إشعار الإدارة بمخالفة تلميذ(ة)'; }, grp: 'vs_c', page: 'a4',
    get d() { return 'نموذج يملؤه الأستاذ(ة) عند توجيه تلميذ(ة) إلى ' + WD().office + ': المخالفة، الإجراءات المقترحة، وخانة الإجراءات التي اتخذتها ' + WD().office + ' — نسختان في الصفحة.'; },
    auto: 'الموظفون (الأستاذ ومادته) وبطاقة التلاميذ (القسم والرقم)',
    init: (s, sy) => ({ teacher: '', subject: '', day: today(), from: '', to: '', pupil: '', code: '', cls: '', no: '', viol: '', meas: [], other: '', done: '', copies: '2' }),
    defs: (f, sy) => [
      { sec: 'الأستاذ(ة) والحصة' },
      { k: 'teacher', l: 'من الأستاذ(ة)', list: 'k2Emps', link: teacherLink }, { k: 'subject', l: 'المادة', half: true },
      { k: 'day', l: 'ليوم', t: 'date', half: true }, { k: 'from', l: 'الحصة: من', half: true, ph: '9:00' }, { k: 'to', l: 'إلى', half: true, ph: '10:00' },
      { sec: 'التلميذ(ة) والمخالفة' },
      { k: 'pupil', l: 'التلميذ(ة)', list: 'k2Pupils', link: pupLink }, { k: 'code', l: 'رمز مسار', half: true, dir: 'ltr', list: 'k2Codes', link: pupLink }, { k: 'cls', l: 'القسم', half: true }, { k: 'no', l: 'الرقم', half: true },
      { k: 'viol', l: 'المخالفة المرتكبة', t: 'area', rows: 3 },
      { k: 'meas', l: 'الإجراءات التي يلتمسها الأستاذ(ة)', t: 'checks', opts: MEAS }, { k: 'other', l: 'الإجراء الآخر المقترح', ph: 'يكتب إن حدد الخيار الأخير' },
      { k: 'done', l: 'الإجراءات التي اتخذتها ' + WD().office + ' (تُترك فارغة للتعبئة اليدوية)', t: 'area', rows: 2 },
      { k: 'copies', l: 'عدد النسخ في الصفحة', t: 'select', half: true, opts: [['1', 'نسخة واحدة'], ['2', 'نسختان']] }
    ],
    onSave: (k, f, sy, store) => { if (k === 'pupil' || k === 'code') keepPupil(store, f); if (k === 'teacher') store.subject = f.subject; return null; },
    build: (s, f, sy) => {
      const W = WD(), g = f.g;
      const one = `<div class="vs-form"><div class="vs-fh"><div>المؤسسة: <b>${esc(s.school || '')}</b></div><div>من الأستاذ(ة): ${dot(f.teacher, 46)}</div></div>
        <div class="vs-fh"><div>المادة: ${dot(f.subject, 36)}</div><div>الحصة: من ${dot(f.from, 16)} إلى ${dot(f.to, 16)}</div><div>ليوم: ${f.day ? `<b>${esc(K.dayName(f.day) + ' ' + fd(f.day))}</b>` : dot('', 34)}</div></div>
        <div class="vs-ft">إشعار ${W.office} بمخالفة تلميذ(ة)</div>
        <p class="vs-p">أخبر ${W.office} أنني وجهت إليها ${gw('pupil', g)}: ${dot(f.pupil, 58)} من القسم: ${dot(f.cls, 20)} رقم: ${dot(f.no, 10)}</p>
        <p class="vs-p">لارتكابه المخالفة التالية: ${nm(f.viol) ? `<b>${esc(f.viol)}</b>` : dot('', 120)}</p>
        ${nm(f.viol) ? '' : `<p class="vs-p">${dot('', 175)}</p>`}
        <p class="vs-p">لذا، ألتمس من ${W.office} اتخاذ الإجراءات التالية في حقه:</p>
        ${MEAS.map((m, i) => `<div class="vs-ck">${cb(f.meas && f.meas[i])} ${esc(m)}${i === 3 ? `: ${nm(f.other) ? `<b>${esc(f.other)}</b>` : dot('', 66)}` : ''}</div>`).join('')}
        <div class="vs-sg"><div>توقيع الأستاذ(ة)</div></div>
        <div class="vs-gs">الإجراءات التي اتخذتها ${W.office}: ${nm(f.done) ? `<b>${esc(f.done)}</b>` : dot('', 110)}${nm(f.done) ? '' : `<br>${dot('', 175)}`}</div>
        <div class="vs-sg"><div>توقيع ${W.sec ? 'الحارس العام' : 'مدير(ة) المؤسسة'}</div></div></div>`;
      const n = f.copies === '1' ? 1 : 2;
      return { page: 'a4', pages: flow(Array.from({ length: n }, () => ({ html: one + '<div class="vs-cut"></div>' })), 'a4') };
    }
  });
  DOCS.push({
    k: 'vs_rep', t: 'تقرير الأستاذ(ة) في حق تلميذ(ة)', grp: 'vs_c', page: 'a4',
    get d() { return 'تقرير يرفعه الأستاذ(ة) إلى مدير(ة) المؤسسة بشأن سلوك عرقل سير الدرس، مع الإجراءات الملتمسة وملاحظات ' + WD().supT + '.'; },
    auto: 'الموظفون وبطاقة التلاميذ',
    init: (s, sy) => ({ city: s.city || '', date: today(), teacher: '', subject: '', room: '', title: '', pupil: '', code: '', cls: '', no: '', beh: '', day: '', hour: '', meas: [], remark: '' }),
    defs: (f, sy) => [
      { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true },
      { k: 'teacher', l: 'من الأستاذ(ة)', list: 'k2Emps', link: teacherLink }, { k: 'subject', l: 'مادة التدريس', half: true }, { k: 'room', l: 'القاعة', half: true },
      { k: 'title', l: 'الموضوع', ph: 'تقرير في حق تلميذ(ة)' },
      { sec: 'التلميذ(ة) والسلوك' },
      { k: 'pupil', l: 'التلميذ(ة)', list: 'k2Pupils', link: pupLink }, { k: 'code', l: 'رمز مسار', half: true, dir: 'ltr', list: 'k2Codes', link: pupLink }, { k: 'cls', l: 'القسم', half: true }, { k: 'no', l: 'الرقم', half: true },
      { k: 'beh', l: 'السلوك الذي عرقل به سير الدرس', t: 'area', rows: 4 }, { k: 'day', l: 'يوم', t: 'date', half: true }, { k: 'hour', l: 'على الساعة', half: true, ph: '10:00' },
      { k: 'meas', l: 'أطلب منكم', t: 'checks', opts: ['تنبيه التلميذ(ة)', 'استدعاء ولي أمر التلميذ(ة)', 'توقيع ولي أمر التلميذ(ة) لالتزام', 'عرض التلميذ(ة) على المجلس الانضباطي'] },
      { k: 'remark', l: `ملاحظات ${WD().supT} (تُترك فارغة للتعبئة اليدوية)`, t: 'area', rows: 2 }
    ],
    onSave: (k, f, sy, store) => { dateKeep(k, store); if (k === 'pupil' || k === 'code') keepPupil(store, f); if (k === 'teacher') store.subject = f.subject; return null; },
    build: (s, f, sy) => {
      const W = WD(), g = f.g, M = ['تنبيه التلميذ(ة)', 'استدعاء ولي أمر التلميذ(ة)', 'توقيع ولي أمر التلميذ(ة) لالتزام', 'عرض التلميذ(ة) على المجلس الانضباطي'];
      const dayTxt = f.day ? `${K.dayName(f.day)} ${fd(f.day)}` : '';
      return { title: 'تقرير في حق تلميذ(ة)', sub: nm(f.title) || '', page: 'a4', sign: false, blocks: [
        { html: `<div class="vs-rp"><div class="r1"><span>في ${esc(fd(f.date))}</span></div>
          <div>من الأستاذ(ة): ${dot(f.teacher, 70)}</div><div>مادة التدريس: ${dot(f.subject, 60)} &nbsp; القاعة: ${dot(f.room, 22)}</div>
          <div class="to">إلى ${W.dirT}</div>
          <div class="vs-obj">الموضوع: <u>${esc(nm(f.title) || 'تقرير في حق تلميذ(ة)')}</u></div>
          <p class="vs-c">سلام تام بوجود مولانا الإمام، دام له العز والنصر، وبعد:</p>
          <p class="vs-p">يؤسفني أن أتقدم إليكم بهذا التقرير في حق ${gw('pupil', g)}: ${dot(f.pupil, 66)}</p>
          <p class="vs-p">قسم: ${dot(f.cls, 22)} رقم: ${dot(f.no, 12)}</p>
          <p class="vs-p">ويتمثل السلوك الذي عرقل به ${gw('pupil', g)} سير الدرس في:</p>
          <div class="vs-box">${nm(f.beh) ? esc(f.beh).replace(/\n/g, '<br>') : ''}</div>
          <p class="vs-p">يوم: ${dot(dayTxt, 52)} على الساعة: ${dot(f.hour, 20)}</p>
          <p class="vs-p">وعليه، فإني أطلب منكم:</p>
          ${M.map((m, i) => `<div class="vs-ck">${cb(f.meas && f.meas[i])} ${esc(m)}</div>`).join('')}
          <p class="vs-c">وفي الأخير، تقبلوا مني فائق الاحترام والتقدير. والسلام</p>
          <div class="vs-sg"><div>توقيع الأستاذ(ة)</div></div>
          <div class="vs-cut"></div>
          <p class="vs-p"><b>ملاحظات ${W.supT}:</b></p>
          <div class="vs-box s">${nm(f.remark) ? esc(f.remark).replace(/\n/g, '<br>') : ''}</div>
          <div class="vs-sg"><div>توقيع ${W.sec ? 'الحارس(ة) العام(ة)' : 'مدير(ة) المؤسسة'}</div></div></div>` }] };
    }
  });

  /* ===================== 6. guardian's commitment + request of re-integration ===================== */
  const G_KEYS = ['gd', 'cin', 'addr', 'phone'];
  const guardianDefs = () => [
    { sec: 'ولي الأمر' },
    { k: 'gd', l: 'الاسم والنسب لولي الأمر' }, { k: 'cin', l: 'رقم بطاقة التعريف الوطنية', half: true, dir: 'ltr' }, { k: 'cinPl', l: 'صادرة ب', half: true },
    { k: 'addr', l: 'عنوان السكن' }, { k: 'phone', l: 'الهاتف', half: true, dir: 'ltr' },
    { sec: 'التلميذ(ة)' },
    { k: 'pupil', l: 'الاسم الكامل للتلميذ(ة)', list: 'k2Pupils', link: pupLink }, { k: 'code', l: 'رمز مسار', half: true, dir: 'ltr', list: 'k2Codes', link: pupLink },
    { k: 'cls', l: 'القسم', half: true }, { k: 'no', l: 'الرقم', half: true }
  ];
  const guardianBlock = (f, W) => `<table class="vs-kv"><tr><td class="k">الاسم والنسب لولي الأمر</td><td>${nm(f.gd) ? esc(f.gd) : ''}</td></tr><tr><td class="k">رقم بطاقة التعريف الوطنية</td><td dir="ltr" style="text-align:right">${esc(nm(f.cin))}${nm(f.cinPl) ? ` &nbsp;—&nbsp; ${esc(f.cinPl)}` : ''}</td></tr><tr><td class="k">عنوان السكن</td><td>${esc(nm(f.addr))}</td></tr><tr><td class="k">الهاتف</td><td dir="ltr" style="text-align:right">${esc(nm(f.phone))}</td></tr></table>`;
  DOCS.push({
    k: 'vs_eng', t: 'التزام ولي الأمر', grp: 'vs_c', page: 'a4',
    d: 'التزام يوقعه ولي الأمر بعدم تكرار سلوك ابنه (ابنته) وبحضور جميع الحصص، في صيغتين: التزام بسلوك محدد، أو التزام بمخالفات متعددة (سوء السلوك، الغياب، ضعف التحصيل، مخالفة القانون الداخلي).',
    auto: 'بطاقة التلاميذ (ولي الأمر ورقم بطاقته وعنوانه وهاتفه والقسم والرقم)',
    init: (s, sy) => ({ form: 'a', city: s.city || '', date: today(), gd: '', cin: '', cinPl: '', addr: '', phone: '', pupil: '', code: '', cls: '', no: '', g: '', beh: '', viol: [true, true, true, true] }),
    defs: (f, sy) => [
      { k: 'form', l: 'صيغة الالتزام', t: 'select', opts: [['a', 'التزام بعدم تكرار السلوك وبحضور جميع الحصص'], ['b', 'التزام بعدم تكرار المخالفات (قائمة مخالفات)']] },
      { k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }
    ].concat(guardianDefs()).concat([
      f.form === 'b' ? { k: 'viol', l: 'المخالفات التي اطلع عليها ولي الأمر', t: 'checks', opts: ['سوء السلوك وإثارة الشغب', 'الغياب المتكرر بدون مبرر', 'عدم الاهتمام بالتحصيل الدراسي', 'مخالفة بنود القانون الداخلي للمؤسسة'] }
        : { k: 'beh', l: 'السلوك الذي بدر من التلميذ(ة)', t: 'area', rows: 3 }
    ]),
    onSave: (k, f, sy, store) => { dateKeep(k, store); if (k === 'pupil' || k === 'code') keepPupil(store, f); return k === 'form' ? 'redraw' : null; },
    build: (s, f, sy) => {
      const W = WD(), g = f.g, A = f.form !== 'b';
      const head = `<p class="vs-p"><b>أنا الموقع(ة) أسفله:</b></p>${guardianBlock(f, W)}`;
      const body = A
        ? `<p class="vs-p">ألتزم بأن ${gw('sonI', g)}: الاسم الكامل للتلميذ(ة) ${dot(f.pupil, 64)}</p>
           <p class="vs-p">القسم: ${dot(f.cls, 24)} الرقم: ${dot(f.no, 12)} بـ ${esc(s.school || W.inst)}</p>
           <p class="vs-p">${gw('will', g)} لتكرار ما بدر ${gw('fromHim', g)} من سلوك، والمتمثل في:</p>
           <div class="vs-box">${nm(f.beh) ? esc(f.beh).replace(/\n/g, '<br>') : ''}</div>
           <p class="vs-p">كما ألتزم بأن ${gw('attend', g)} جميع ${gw('sess', g)} المبرمجة في استعمال الزمان الخاص ${g === 'F' ? 'بها' : g === 'M' ? 'به' : 'به (ها)'}، حتى نهاية السنة الدراسية.</p>`
        : `<p class="vs-p">أشهد أنا الموقع(ة) أسفله أنني ولي أمر التلميذ(ة): ${dot(f.pupil, 60)} قسم: ${dot(f.cls, 18)} رقم تسجيله: ${dot(f.no, 12)}، وقد اطلعت على مخالفاته والمتمثلة في:</p>
           ${['سوء السلوك وإثارة الشغب', 'الغياب المتكرر بدون مبرر', 'عدم الاهتمام بالتحصيل الدراسي', 'مخالفة بنود القانون الداخلي للمؤسسة'].map((m, i) => `<div class="vs-ck">${cb(f.viol && f.viol[i])} ${m}</div>`).join('')}
           <p class="vs-p">ولأجل هذا أتعهد بعدم تكرار ذلك، كما آذن لإدارة المؤسسة باتخاذ الإجراءات التي تنص عليها القوانين والأنظمة بالمؤسسات التربوية.</p>`;
      return { title: A ? 'التزام' : 'إلـــتــزام', sub: esc(s.school || ''), page: 'a4', sign: SB.sign(s, { city: f.city, date: f.date, left: 'توقيع ولي الأمر (مصادق عليه)' }),
        blocks: [{ html: `<div class="vs-doc">${head}${body}</div>` }] };
    }
  });
  DOCS.push({
    k: 'vs_reint', t: 'طلب إدماج (استعطاف) تلميذ(ة)', grp: 'vs_c', page: 'a4',
    d: 'طلب يقدمه ولي الأمر لقبول عودة ابنه (ابنته) إلى الدراسة بعد التشطيب أو الانقطاع، مع التزام باحترام القانون الداخلي وبحضور الحصص.',
    auto: 'بطاقة التلاميذ (ولي الأمر والقسم والمستوى وتاريخ الازدياد)',
    init: (s, sy) => ({ city: s.city || '', date: today(), gd: '', cin: '', cinPl: '', addr: '', phone: '', pupil: '', code: '', cls: '', no: '', lvl: '', birth: '', g: '' }),
    defs: (f, sy) => [{ k: 'city', l: 'بـ (المدينة)', half: true }, { k: 'date', l: 'التاريخ', t: 'date', half: true }].concat(guardianDefs()).concat([{ k: 'lvl', l: 'المستوى', half: true }, { k: 'birth', l: 'تاريخ الازدياد', half: true }]),
    onSave: (k, f, sy, store) => { dateKeep(k, store); if (k === 'pupil' || k === 'code') keepPupil(store, f); return null; },
    build: (s, f, sy) => {
      const W = WD(), g = f.g;
      return { title: 'طلب إدماج', sub: esc(s.school || ''), page: 'a4', sign: SB.sign(s, { city: f.city, date: f.date, left: 'توقيع ولي الأمر (مصادق عليه)' }), blocks: [{ html: `<div class="vs-doc">
        <p class="vs-p"><b>أنا الموقع(ة) أسفله:</b></p>${guardianBlock(f, W)}
        <p class="vs-p">أطلب منكم قبول طلب الاستعطاف الخاص ب${gw('sonI', g)}:</p>
        <p class="vs-p">الاسم الكامل للتلميذ(ة): ${dot(f.pupil, 70)}</p>
        <p class="vs-p">القسم: ${dot(f.cls, 24)} المستوى: ${dot(f.lvl, 24)} تاريخ الازدياد: ${dot(f.birth ? (/^\d{4}-/.test(f.birth) ? fd(f.birth) : f.birth) : '', 30)}</p>
        <p class="vs-p">للعودة للدراسة بمؤسستكم ${esc(s.school || W.inst)}.</p>
        <p class="vs-p">وفي حالة قبولكم لطلبي هذا، فإني ألتزم بأن ${gw('respect', g)} ${gw('sonI', g)} القانون الداخلي للمؤسسة، وأن ${gw('study', g)} بجد واجتهاد.</p>
        <p class="vs-p">كما ألتزم بأن ${gw('attend', g)} جميع ${gw('sess', g)} المبرمجة في استعمال الزمان الخاص ${g === 'F' ? 'بها' : g === 'M' ? 'به' : 'به (ها)'}، حتى نهاية السنة الدراسية.</p></div>` }] };
    }
  });

  /* ===================== 7. attendance and conduct mark (collège / lycée) ===================== */
  const semMonths = (sy, sem) => { const y = MK.syStart(sy), L = sem === '2' ? [[y + 1, 2], [y + 1, 3], [y + 1, 4], [y + 1, 5], [y + 1, 6]] : [[y, 9], [y, 10], [y, 11], [y, 12], [y + 1, 1]]; return L.map(([a, b]) => ({ ym: `${a}-${String(b).padStart(2, '0')}`, name: Dx.MONTHS[b - 1] })); };
  const r2 = x => Math.round(x * 100) / 100;
  const show = x => (Number.isInteger(x) ? String(x) : String(r2(x)));
  const REMARKS = [[18, 'تلميذ(ة) مواظب(ة) حسن(ة) السلوك'], [16, 'تلميذ(ة) حريص على زمن تعلمه'], [14, 'مزيدا من الحرص على زمنك المدرسي'], [12, 'تلميذ(ة) كثير(ة) الغياب'], [11, 'غيابات كثيرة جدا تؤثر على التحصيل الدراسي'], [10, 'تلميذ(ة) متماد(ية) في الغياب رغم سلوكه(ا) الحسن'], [8, 'تلميذ(ة) متماد(ية) في الغياب في حاجة إلى التتبع والمواكبة'], [-1, 'غياب شبه مستمر وسلوك في حاجة إلى الضبط']];
  const remarkOf = o => (REMARKS.find(([t]) => o >= t) || REMARKS[REMARKS.length - 1])[1];
  function attRows(sy, f, cls) {
    const M = semMonths(sy, f.sem), per = Math.max(0.5, +f.perPoint || 4), perRep = +f.perRep >= 0 ? +f.perRep : 1;
    const stats = M.map(m => AR().monthStats(sy, cls, m.ym).rows);
    const reps = new Map(); (f.rep || []).filter(hasRow).forEach(r => reps.set(hk(r[0]), Math.max(0, +r[2] || 0)));
    return AR().pupilsOf(sy, cls).map((p, i) => {
      const hrs = M.map((m, j) => { const o = stats[j].find(x => AR().pkey(x.p) === AR().pkey(p)) || { a: 0, j: 0 }; return o.a + o.j; });
      const just = M.reduce((a, m, j) => a + ((stats[j].find(x => AR().pkey(x.p) === AR().pkey(p)) || { j: 0 }).j), 0);
      const real = hrs.reduce((a, b) => a + b, 0), counted = real - just;
      const A = Math.max(0, r2(10 - counted / per)), n = reps.get(hk(fullN(p))) || 0, ded = r2(n * perRep), B = Math.max(0, r2(10 - ded)), T = r2(A + B);
      return { i: i + 1, p, hrs, real, just, counted, A, n, ded, B, T, rem: remarkOf(T) };
    });
  }
  DOCS.push({
    k: 'vs_att', t: 'نقطة المواظبة والسلوك', grp: 'vs_d', page: 'a4l', sec: true,
    d: 'جدول المواظبة والسلوك لكل قسم: ساعات الغياب شهريا، المبرر وغير المبرر، نقطة المواظبة (من 10) ونقطة السلوك (من 10) والمجموع من 20 مع الملاحظة.',
    auto: 'سجل غياب التلاميذ (ساعات الغياب المبرر وغير المبرر شهريا)',
    init: (s, sy) => ({ cls: '__all', sem: '1', perPoint: '4', perRep: '1', rep: [] }),
    defs: (f, sy) => [
      { note: 'نقطة المواظبة = 10 − (ساعات الغياب غير المبرر ÷ عدد الساعات المقابلة لنقطة واحدة). نقطة السلوك = 10 − (عدد التقارير × النقط المخصومة عن كل تقرير). تُحسب ساعات الغياب من «سجل غياب التلاميذ» (كل حصة = ساعة).' },
      { k: 'cls', l: 'القسم', t: 'select', half: true, opts: () => [['__all', 'كل الأقسام']].concat(clsOnly()) }, { k: 'sem', l: 'الدورة', t: 'select', half: true, opts: [['1', 'الدورة الأولى (شتنبر ← يناير)'], ['2', 'الدورة الثانية (فبراير ← يونيو)']] },
      { k: 'perPoint', l: 'ساعات الغياب غير المبرر التي تخصم نقطة واحدة', t: 'num', half: true }, { k: 'perRep', l: 'النقط المخصومة عن كل تقرير', t: 'num', half: true },
      window.Budget.gridDef('rep', 'التقارير المحررة في حق التلاميذ (عدد التقارير)', ['التلميذ(ة)', 'القسم', 'عدد التقارير'], { widths: ['1.8fr', '.9fr', '.8fr'], types: ['text', 'text', 'num'], list: ['k2Pupils'], link: { src: 'pupil', n: 0, cols: { cls: 1 } } })
    ],
    onSave: (k) => (k === 'cls' || k === 'sem' ? 'redraw' : null),
    build: (s, f, sy) => {
      const M = semMonths(sy, f.sem), cl = f.cls === '__all' || !f.cls ? AR().classes(sy) : [f.cls], blocks = [];
      const head = thr([{ t: 'ر.ت', c: 'd', r: 2 }, { t: 'الاسم والنسب', c: 'd', r: 2 }, { t: 'المواظبة (ساعات الغياب)', c: 'd', s: 5 + 3 }, { t: 'نقطة المواظبة', c: 'd', r: 2 }, { t: 'السلوك', c: 'd', s: 3 }, { t: 'نقطة المواظبة والسلوك', c: 'd', r: 2 }, { t: 'الملاحظة', c: 'd', r: 2 }])
        + thr(M.map(m => ({ t: m.name, c: 'd' })).concat(['المجموع الحقيقي', 'الغياب المبرر', 'المجموع المحتسب', 'عدد التقارير', 'النقط المخصومة', 'نقطة السلوك'].map(t => ({ t, c: 'd' }))));
      // the header above has an extra «السلوك» group: columns are laid out by the cells below
      const cg = `<colgroup><col style="width:3.4%"><col style="width:15%">${M.map(() => '<col style="width:4.6%">').join('')}<col style="width:5%"><col style="width:5%"><col style="width:5%"><col style="width:5.2%"><col style="width:4.4%"><col style="width:4.8%"><col style="width:5%"><col style="width:6%"><col style="width:12.3%"></colgroup>`;
      cl.forEach(c => {
        const R = attRows(sy, f, c); if (!R.length) return;
        const rows = R.map(o => tr([o.i, { t: fullN(o.p), c: 'r b nw' }].concat(o.hrs.map(h => h || '')).concat([o.real || '', o.just || '', o.counted || '', { t: show(o.A), c: 'y' }, o.n || '', o.ded || '', { t: show(o.B), c: 'y' }, { t: show(o.T), c: 'g' }, { t: o.rem, c: 'sm xs' }])));
        const n = R.length, avg = r2(R.reduce((a, o) => a + o.T, 0) / n);
        rows.push(tr([{ t: `المجموع / المعدل — ${n} تلميذ(ة)`, s: 2 + M.length, c: 'd b' }, { t: String(R.reduce((a, o) => a + o.real, 0)), c: 'd b' }, { t: String(R.reduce((a, o) => a + o.just, 0)), c: 'd b' }, { t: String(R.reduce((a, o) => a + o.counted, 0)), c: 'd b' }, { t: show(r2(R.reduce((a, o) => a + o.A, 0) / n)), c: 'd b' }, { t: String(R.reduce((a, o) => a + o.n, 0)), c: 'd b' }, { t: '', c: 'd' }, { t: show(r2(R.reduce((a, o) => a + o.B, 0) / n)), c: 'd b' }, { t: show(avg), c: 'd b' }, { t: '', c: 'd' }]));
        blocks.push({ before: SB.cap(`القسم: ${esc(c)} — الدورة ${f.sem === '2' ? 'الثانية' : 'الأولى'}`, 'r'), table: { cls: 'sb-t cmp', head, rows, colgroup: cg }, minRows: 2 });
      });
      if (!blocks.length) blocks.push({ html: '<p class="sb-p">لا توجد لوائح تلاميذ. استورد لوائح التلاميذ من «بطاقة التلاميذ» وسجل الغياب في «سجل غياب التلاميذ» أولا.</p>' });
      return { title: 'نقطة المواظبة والسلوك', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4l', sign: SB.sign(s, { right: WD().sec ? 'الحارس(ة) العام(ة)' : 'أستاذ(ة) القسم', left: 'توقيع رئيس المؤسسة' }), blocks };
    }
  });

  /* ===================== 8. school attendance statistics (daily / monthly / term) ===================== */
  DOCS.push({
    k: 'vs_rate', t: 'إحصاء الغياب والمواظبة بالمؤسسة', grp: 'vs_d', page: 'a4l',
    d: 'عدد التلاميذ المتغيبين كل يوم ونسبة الغياب، ثم نسبة الغياب الشهري ونسبة المواظبة لكل شهر ولكل دورة — يُحسب من سجل غياب التلاميذ.',
    auto: 'سجل غياب التلاميذ وبطاقة التلاميذ والعطل المدرسية',
    init: (s, sy) => ({ sem: '1', unit: '' }),
    defs: (f, sy) => [
      { note: 'تُحسب نسبة الغياب اليومي = عدد التلاميذ الذين سُجل لهم غياب (غ أو ب) في ذلك اليوم ÷ عدد تلاميذ الأقسام التي فُتح سجلها في أسبوع ذلك اليوم. لا تُحتسب العطل ونهايات الأسبوع.' },
      { k: 'sem', l: 'الدورة', t: 'select', half: true, opts: [['1', 'الدورة الأولى (شتنبر ← يناير)'], ['2', 'الدورة الثانية (فبراير ← يونيو)']] },
      ...(window.Cyc && Cyc.single() ? [] : [{ k: 'unit', l: 'الوحدة المدرسية (فارغ = كل المؤسسة)', half: true, list: 'k2Units' }])
    ],
    build: (s, f, sy) => {
      const M = semMonths(sy, f.sem), unit = nm(f.unit), A = AR();
      const pupils = (window.Pupils ? Pupils.current(sy) : []).filter(p => !unit || K.U.same(p.unit, unit)).length;
      const data = M.map(m => {
        const [Y0, M0] = m.ym.split('-').map(Number), last = new Date(Date.UTC(Y0, M0, 0)).getUTCDate(), days = [];
        for (let d = 1; d <= last; d++) {
          const iso = `${m.ym}-${String(d).padStart(2, '0')}`, w = (new Date(iso + 'T00:00:00Z').getUTCDay() + 6) % 7;
          if (w > 4 || A.isHol(iso, sy)) { days[d] = null; continue; }
          const c = A.dayCount(sy, iso, unit);
          days[d] = c.classes > 0 && c.pupils > 0 ? { n: c.abs, pct: c.abs / c.pupils * 100 } : null;
        }
        const ok = days.filter(Boolean), rate = ok.length ? ok.reduce((a, x) => a + x.pct, 0) / ok.length : null;
        return { m, days, rate, att: rate == null ? null : 100 - rate, open: ok.length };
      });
      const head = thr([{ t: 'الأيام', c: 'd', r: 2 }].concat(M.map(m => ({ t: `شهر ${m.name}`, c: 'd', s: 2 })))) + thr(M.map(() => [{ t: 'العدد', c: 'd' }, { t: 'النسبة %', c: 'd' }]).flat());
      const rows = [];
      for (let d = 1; d <= 31; d++) rows.push(tr([{ t: String(d), c: 'k' }].concat(data.map(x => { const v = x.days[d]; const bad = d > (x.days.length - 1); return v ? [{ t: String(v.n) }, { t: r2(v.pct).toFixed(2) }] : [{ t: '', c: bad || x.days[d] === null ? 'gr' : '' }, { t: '', c: bad || x.days[d] === null ? 'gr' : '' }]; }).flat())));
      const fmt = v => (v == null ? '' : r2(v).toFixed(2));
      const withData = data.filter(x => x.att != null), term = withData.length ? withData.reduce((a, x) => a + x.att, 0) / withData.length : null;
      const termAbs = withData.length ? 100 - term : null, openAll = data.reduce((a, x) => a + x.open, 0);
      // summary first: one column per month + the term
      const sHead = thr([{ t: '', c: 'd' }].concat(M.map(m => ({ t: `شهر ${m.name}`, c: 'd' }))).concat([{ t: 'الدورة', c: 'd' }]));
      const sRows = [
        tr([{ t: 'أيام الدراسة المسجلة', c: 'k' }].concat(data.map(x => ({ t: String(x.open || '') }))).concat([{ t: String(openAll || ''), c: 'd b' }])),
        tr([{ t: 'نسبة الغياب الشهري %', c: 'k' }].concat(data.map(x => ({ t: fmt(x.rate) }))).concat([{ t: fmt(termAbs), c: 'd b' }])),
        tr([{ t: 'نسبة المواظبة %', c: 'g b' }].concat(data.map(x => ({ t: fmt(x.att), c: 'g b' }))).concat([{ t: fmt(term), c: 'g b' }]))
      ];
      return { title: 'إحصاء الغياب والمواظبة', sub: `الدورة ${f.sem === '2' ? 'الثانية' : 'الأولى'} — الموسم الدراسي ${syText(sy)}${unit ? ' — ' + esc(unit) : ''}`, page: 'a4l', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }),
        blocks: [{ html: `<div class="vs-line"><span>عدد التلاميذ: <b>${pupils}</b></span><span>نسبة المواظبة في الدورة: <b>${term == null ? '..........' : r2(term).toFixed(2) + '%'}</b></span></div>`, keepNext: true },
          { table: { cls: 'sb-t cmp', head: sHead, rows: sRows, colgroup: `<colgroup><col style="width:18%">${M.map(() => '<col style="width:13.7%">').join('')}<col style="width:13.5%"></colgroup>` }, minRows: 3 },
          { html: '<div style="height:2mm"></div>' },
          { table: { cls: 'sb-t cmp', head, rows, colgroup: `<colgroup><col style="width:14%">${M.map(() => '<col style="width:8.6%"><col style="width:8.6%">').join('')}</colgroup>` }, minRows: 4 }] };
    }
  });

  /* ===================== 9. follow-up of the supervised assignments (collège / lycée) ===================== */
  const SUBJ_COL = ['العربية', 'الفرنسية', 'الإنجليزية', 'الاجتماعيات', 'التربية الإسلامية', 'الرياضيات', 'علوم الحياة والأرض', 'العلوم الفيزيائية', 'التربية البدنية', 'المعلوميات', 'التربية التشكيلية', 'التربية الأسرية', 'التكنولوجيا'];
  const SUBJ_LYC = ['العربية', 'الفرنسية', 'الإنجليزية', 'الاجتماعيات', 'التربية الإسلامية', 'الرياضيات', 'علوم الحياة والأرض', 'الفيزياء والكيمياء', 'التربية البدنية', 'الفلسفة', 'المعلوميات'];
  const subjOf = f => { const L = nm(f.subjects).split(/[\n،,;]+/).map(nm).filter(Boolean); return L.length ? L : (kind() === 'lyc' ? SUBJ_LYC : SUBJ_COL); };
  DOCS.push({
    k: 'vs_hw', t: 'تتبع إنجاز الفروض المحروسة', grp: 'vs_d', page: 'a4l', sec: true,
    d: 'جدول بكل الأقسام والمواد يبين الفروض المحروسة المنجزة في كل مادة (الفرض 1، 2، 3…)، لمتابعة إنجاز المراقبة المستمرة داخل المؤسسة.',
    auto: 'لوائح الأقسام (بطاقة التلاميذ)',
    init: (s, sy) => ({ subjects: '', n: '3', ecls: '', cur: [], hw: {} }),
    defs: (f, sy) => {
      const L = subjOf(f), n = Math.max(1, Math.min(5, +f.n || 3)), classes = AR() ? AR().classes(sy) : [];
      if (!f.ecls || !classes.includes(f.ecls)) f.ecls = classes[0] || '';
      f.hw = f.hw && typeof f.hw === 'object' ? f.hw : {};
      f.cur = (f.hw[f.ecls] || []).slice();
      return [
        { note: 'اختر القسم ثم ضع علامة أمام الفروض المنجزة في كل مادة. يظهر الجدول الكامل للأقسام في المعاينة.' },
        { k: 'n', l: 'عدد الفروض في كل مادة', t: 'num', half: true }, { k: 'subjects', l: 'المواد (افصل بينها بفاصلة، فارغ = المواد المعتادة للسلك)', t: 'area', rows: 2, ph: SUBJ_COL.join('، ') },
        { sec: 'تسجيل الفروض المنجزة' },
        { k: 'ecls', l: 'القسم', t: 'select', opts: () => clsOnly() },
        { k: 'cur', l: 'الفروض المنجزة في هذا القسم', t: 'checks', opts: L.flatMap(sj => Array.from({ length: n }, (_, i) => `${sj} — الفرض ${i + 1}`)) }
      ];
    },
    onSave: (k, f, sy, store) => {
      if (k === 'cur' && f.ecls) { f.hw = f.hw || {}; f.hw[f.ecls] = f.cur.slice(); store.hw = f.hw; return null; }
      if (k === 'ecls') { f.cur = ((f.hw || {})[f.ecls] || []).slice(); return 'redraw'; }
      return null;
    },
    build: (s, f, sy) => {
      const L = subjOf(f), n = Math.max(1, Math.min(5, +f.n || 3)), cl = AR() ? AR().classes(sy) : [], hw = f.hw || {};
      const head = thr([{ t: 'القسم', c: 'd', r: 2 }].concat(L.map(sj => ({ t: sj, c: 'd', s: n })))) + thr(L.map(() => Array.from({ length: n }, (_, i) => ({ t: String(i + 1), c: 'd' }))).flat());
      const w = (86 / (L.length * n)).toFixed(2);
      const rows = (cl.length ? cl : ['']).map(c => { const a = hw[c] || []; return tr([{ t: c, c: 'k b nw' }].concat(L.flatMap((sj, si) => Array.from({ length: n }, (_, i) => ({ t: a[si * n + i] ? '✔' : '', c: a[si * n + i] ? 'y' : '' }))))); });
      const done = cl.reduce((a, c) => a + (hw[c] || []).filter(Boolean).length, 0), total = cl.length * L.length * n;
      return { title: 'تتبع إنجاز الفروض المحروسة', sub: `الموسم الدراسي ${syText(sy)}`, page: 'a4l', sign: SB.sign(s, { right: '', left: 'توقيع رئيس المؤسسة' }),
        blocks: [{ html: `<div class="vs-line"><span>الأقسام: <b>${cl.length}</b></span><span>الفروض المنجزة: <b>${done}</b> من <b>${total}</b>${total ? ` (${Math.round(done / total * 100)}%)` : ''}</span></div>`, keepNext: true },
          { table: { cls: 'sb-t cmp vs-hw', head, rows, colgroup: `<colgroup><col style="width:8%">${L.flatMap(() => Array.from({ length: n }, () => `<col style="width:${w}%">`)).join('')}</colgroup>` }, minRows: 3 }] };
    }
  });

  /* ---------- print styles ---------- */
  Dx.modCss += `
  .vs{font-size:11pt;line-height:1.7}
  .vs-let{padding:0 1mm 2.6mm;margin:0 0 3.2mm;border-bottom:1.3px dashed #555;font-size:10.6pt;line-height:1.7}
  .vs-top{display:grid;grid-template-columns:1fr auto 1fr;align-items:start;font-weight:700;font-size:10pt;line-height:1.6;margin:0 0 1mm}.vs-fr{text-align:center}.vs-dd{text-align:left}
  .vs-to{margin:.3mm 0;font-weight:700;text-align:center}.vs-obj{margin:.4mm 0 .8mm;font-weight:700}.vs-obj u{text-underline-offset:1mm}
  .vs-p{margin:0 0 .5mm;text-align:justify}.vs-c{text-align:center;font-weight:700;margin:1.6mm 0}
  .vs-sg{display:flex;justify-content:flex-end;padding-left:10mm;font-weight:700;margin-top:1mm;text-align:center}.vs-sg .nm{font-weight:400;font-size:9.6pt}
  .vs-dt{display:inline-block;border-bottom:1px dotted #333;min-width:30mm;height:4.4mm;vertical-align:bottom}
  .vs-row{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin:0 0 5mm}
  .vs-slip{border:1.2px dashed #222;border-radius:2mm;padding:3mm 4.5mm 2.5mm;font-size:11pt;line-height:1.95;min-height:55mm;display:flex;flex-direction:column}
  .vs-slip .h{text-align:center;font-weight:700;font-size:11.8pt;line-height:1.5;margin-bottom:.6mm}.vs-slip .h.u{text-decoration:underline;text-underline-offset:1mm}
  .vs-slip .ft{margin-top:auto;text-align:left;font-weight:700;padding-left:8mm}.vs-slip .ft.two{display:flex;justify-content:space-between;padding:0 6mm}
  .vs-form{font-size:10.4pt;line-height:1.75}.vs-fh{display:flex;justify-content:space-between;gap:4mm;margin:0 0 .6mm}
  .vs-ft{text-align:center;font-weight:700;font-size:12pt;margin:.8mm 0 .6mm;text-decoration:underline;text-underline-offset:1mm}
  .vs-ck{margin:0 6mm .3mm 0}.vs-ck .cb{margin-left:2mm}
  .vs-gs{margin-top:1.4mm}.vs-cut{border-top:1.3px dashed #555;margin:2.4mm 0 3.4mm}
  .vs-box{border:1px solid #333;border-radius:1.4mm;min-height:20mm;padding:1.6mm 2.6mm;margin:0 0 1.4mm;line-height:1.9}.vs-box.s{min-height:14mm}
  .vs-rp{font-size:11.4pt;line-height:1.85}.vs-rp .r1{text-align:left;font-weight:700}.vs-rp .to{font-weight:700;margin:1mm 0}
  .vs-doc{font-size:12pt;line-height:2}.vs-kv{width:100%;border-collapse:collapse;margin:1mm 0 2mm}.vs-kv td{border:1px solid #333;padding:1mm 2.4mm;height:8mm}.vs-kv td.k{background:#eef1f7;font-weight:700;width:34%;white-space:nowrap}
  .vs-line{display:flex;justify-content:space-between;gap:6mm;font-size:11pt;margin:0 0 1.6mm;padding:1mm 3mm;border:1px solid #4472c4;border-radius:2mm;background:#eef3fb}
  .tbl.sb-t.vs-hw td,.tbl.sb-t.vs-hw th{padding:.2mm;font-size:7.2pt;height:5.6mm}.tbl.sb-t.vs-hw th{font-size:6.6pt;line-height:1.15}`;

  /* ---------- the centre ---------- */
  let C = null;
  const docs = () => DOCS.filter(d => !d.sec || isSec());
  const GROUPS = () => [['vs_a', 'مراسلات أولياء الأمور'], ['vs_b', 'أوراق الحراسة اليومية'], ['vs_c', 'التقارير والالتزامات'], ['vs_d', 'المواظبة والغياب']];
  // pupils currently absent without interruption (read by the hub and by the documents page)
  function alerts(sy) {
    const out = []; if (!AR()) return out;
    const lo = CFG().t1;
    AR().classes(sy).forEach(c => AR().spans(sy, c, { asOf: today() }).forEach(x => { if (x.ongoing && x.last && x.last.n >= lo) out.push({ name: fullN(x.p), cls: c, n: x.last.n, from: x.last.from, stage: x.last.n >= CFG().t3 ? 3 : x.last.n >= CFG().t2 ? 2 : 1 }); }));
    return out.sort((a, b) => b.n - a.n);
  }
  function center() {
    if (C) return C;
    C = K.center({
      id: 'vschool', title: WD().sec ? 'الحراسة العامة' : 'حراسة التلاميذ', icon: '🛡️', route: 'vschoolDoc', hubRoute: 'vschool', noSy: true, docLabel: 'الوثيقة',
      groups: GROUPS(), docs, store: sy => ST(sy), years: () => [MK.curSy()],
      intro: 'مراسلات أولياء الأمور (المتغيبون، غير الملتحقين، الاستدعاءات)، أوراق الحراسة اليومية (الدخول إلى القسم، زيارة الطبيب)، إشعار المخالفة وتقرير الأستاذ(ة) والتزام ولي الأمر وطلب الإدماج، ثم المواظبة والغياب. تُولَّد اللوائح تلقائيا من «سجل غياب التلاميذ» و«بطاقة التلاميذ»، وتتكيف الصيغ مع سلك المؤسسة المحدد في «الإعدادات».',
      onHub: v => {
        const sy = MK.curSy(), A = alerts(sy), box = document.createElement('div');
        box.className = 'card'; box.style.cssText = 'padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px';
        const c = [1, 2, 3].map(k => A.filter(x => x.stage === k).length);
        box.innerHTML = A.length
          ? `<b>التلاميذ المتغيبون حاليا بشكل متواصل:</b> ${c[0]} في المرحلة الأولى (${CFG().t1} أيام فأكثر)، ${c[1]} في الثانية (${CFG().t2} أيام فأكثر)، ${c[2]} في الثالثة (${CFG().t3} يوما فأكثر).
            <div class="muted" style="font-size:12px">${A.slice(0, 8).map(x => `${esc(x.name)} (${esc(x.cls)} — ${x.n} يوما منذ ${esc(Dx.fmtDate(x.from))})`).join(' · ')}${A.length > 8 ? ` · و${A.length - 8} آخرون` : ''}</div>`
          : '<span class="muted">لا يوجد تلميذ مسجل في حالة غياب متواصل حاليا (يُحسب من «سجل غياب التلاميذ»).</span>';
        const h = v.querySelector('.page-h'); if (h) h.after(box);
      }
    });
    return C;
  }
  window.VSchool = { alerts, absCases, guardOf, findPupil, caseOf, DOCS: () => docs().map(d => d.k), summary: () => ({ alerts: alerts(MK.curSy()).length }) };
  window.pageVSchool = (v, a) => { C = null; center().hub(v, a); };
  window.pageVSchoolDoc = (v, a) => { C = null; center().doc(v, a); };
})();
