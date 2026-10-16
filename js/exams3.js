'use strict';
/* 1.9.4 — «تدبير الامتحانات الإشهادية» على طريقة برنامج Gestion Exam V26.11 (مع الإبقاء على كل ما هو متميز في البرنامج):
   - مسار العمل المرقم (1 تهييئ المعطيات … 10 توزيع المراقبين، 11 البحث عن مترشح) في رأس صفحة الامتحان؛
   - الاستدعاءات: استدعاءات المترشحين بنموذجيها (الاستدعاءات 1: اثنان في الصفحة، الاستدعاءات 2: صفحة كاملة بالتوجيهات وجدولة الامتحان)
     مع التصفية حسب القاعة أو القسم أو المؤسسة الأصلية وختم رئيس المركز أو مدير المؤسسة الأصلية؛ استدعاءات المراقبين (تكليف بمهمة مراقبة الإجراء)
     بمراجع المرسوم 2-23-827 والقرار المشترك 145-24 وجدول حصص كل أستاذ(ة) (اليوم، المادة، من، إلى، الفترة، القاعة، الدور: أساسي / احتياطي)؛
     محضر استلام استدعاءات المراقبين؛ لوائح المترشحين حسب المؤسسة الأصلية ومحضر الاستلام لكل مؤسسة؛
   - طاقم الامتحان: استيراد الأساتذة من Excel (أساتذة المؤسسات الأخرى، أرقام المهام 1-6 لبرنامج Gestion Exam)، الجنس والحساب البنكي، إحصائيات الطاقم؛
   - القاعات: توليد قاعات الامتحان حسب المسالك / الشعب؛ الحراسة: الاحتياطيون بكل مادة أو بنسبة الاحتياط، وحصة واحدة في نصف اليوم (exams2.js)؛
   - وثائق جديدة: ورقة المراقبين المداومين، بيان التعويضات عن الإشراف على تنظيم الامتحان، البحث عن مترشح (بطاقة شاملة). */
(function () {
  if (!window.Exams || !Exams.X) return;
  const X = Exams.X, Dx = window.Docs, { esc } = Dx, { SB, tr, thr, tbl } = window.K;
  const { Y, info, cands, subjects, rooms, staff, guardRows, byRoom, sub, signHead, C, isF, examTitle, levelName, add, kv, sessOf, sortRooms, pb, dots, nm, num, ROLES, results, f2 } = X;
  const DOCS = X.DOCS;
  const docOf = k => DOCS.find(d => d.k === k);
  const hdr = s => `<div class="mk-hdr">${Dx.header(s)}</div>`;
  const cutLine = '<div class="ex-cut"></div>';
  const today = () => K.ldate(Dx.todayIso());
  const tMin = t => { const m = /(\d{1,2})\s*[:hHس.]\s*(\d{0,2})/.exec(nm(t)); return m ? +m[1] * 60 + (+m[2] || 0) : null; };
  const period = sj => { const a = tMin(sj[2]); return a == null ? '' : a < 13 * 60 ? 'صباحا' : 'مساء'; };
  const dayDate = sj => (sj[1] ? `${K.dayName(sj[1])} ${MK.showDate(sj[1])}` : '');
  const tracksOf = sj => String(sj[5] || '').split(/[،,;+\/]| و /).map(nm).filter(Boolean);
  const trackHit = (c, sj) => { const T = tracksOf(sj); if (!T.length) return true; const t = nm(c[C.track]); return !t || T.some(x => t.includes(x) || x.includes(t)); };
  const emp = n => (K.E && K.E.byName ? K.E.byName(n) : null);
  const sexOf = r => { const e = emp(r[0]); const g = (e && e.sex) || nm(r[6]); return /^F$|أنثى|انثى/i.test(g) ? 'F' : /^M$|ذكر/i.test(g) ? 'M' : ''; };
  const ribOf = r => nm(r[7]) || nm((emp(r[0]) || {}).rib);
  const origins = sy => Array.from(new Set(cands(sy).map(c => nm(c[C.origin])).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar'));
  const myRows = (sy, n) => guardRows(sy).filter(g => nm(g[2]) === nm(n) || nm(g[3]) === nm(n));
  const isRes = g => g[1] === 'احتياط';

  /* ================= 1. the staff of the exam (طاقم الامتحان) ================= */
  // the functions of Gestion Exam (fonction 1-6) and their names
  const GE_FN = { 1: 'رئيس مركز الامتحان', 2: 'مراقب(ة) الإجراء', 3: 'الكتابة', 4: 'طاقم النظافة', 5: 'التصحيح', 6: 'أخرى' };
  ['أخرى', 'الأمن', 'المداومة'].forEach(r => { if (!ROLES.includes(r)) ROLES.push(r); });
  const SH = MK.matcher({
    name: ['الاسم الكامل', 'الإسم الكامل', 'الاسم والنسب', 'الإسم والنسب', 'الاسم و النسب', 'الأستاذ', 'الأستاذ(ة)', 'اسم الأستاذ', 'ensg', 'Nom complet', 'NomComplet'],
    ppr: ['رقم التأجير', 'doti', 'PPR', 'Som', 'SOM'], cadre: ['الإطار', 'المادة', 'مادة التخصص', 'التخصص', 'Matiere', 'matiere', 'Spécialité'],
    wp: ['المؤسسة', 'مقر العمل', 'المؤسسة الأصلية', 'Etab', 'Etablissement'], g: ['الجنس', 'النوع', 'Sexe'], role: ['المهمة', 'الدور', 'fonction', 'Fonction'],
    rib: ['الحساب البنكي', 'رقم الحساب البنكي', 'RIB'], off: ['غير متوفر', 'غير متاح']
  });
  async function importStaff(f, sy, c) {
    const sheets = await MK.openTable(); if (!sheets) return;
    const rows = f.rows = f.rows || []; let n = 0;
    const has = new Set(rows.map(r => MK.hkey(r[0])));
    // the sheet «Professeurs» of Gestion Exam first, then any sheet with a names column
    sheets.slice().sort((a, b) => (/prof/i.test(b.name || '') ? 1 : 0) - (/prof/i.test(a.name || '') ? 1 : 0)).forEach(sh => {
      const h = MK.headerRow(sh.rows, SH, 3); if (!h || h.map.indexOf('name') < 0) return;
      const ix = k => h.map.indexOf(k);
      sh.rows.slice(h.hi + 1).forEach(r => {
        const g = k => (ix(k) >= 0 ? nm(r[ix(k)]) : '');
        const name = g('name'); if (!name || has.has(MK.hkey(name))) return;
        let role = g('role'); if (/^\d$/.test(role)) role = GE_FN[role] || ''; if (!role) role = ROLES[1];
        const sx = g('g'); const gender = /^(f|2|أنثى|انثى)$/i.test(sx) ? 'أنثى' : /^(m|1|ذكر)$/i.test(sx) ? 'ذكر' : sx;
        rows.push([name, g('ppr'), g('cadre'), role, g('wp'), g('off'), gender, g('rib')]); has.add(MK.hkey(name)); n++;
      });
    });
    if (!n) return c.toast('لم يتم العثور على لائحة أساتذة (الاسم الكامل، رقم التأجير، المؤسسة، المادة...) في الملف', true);
    c.save('rows'); c.redraw && c.redraw(); c.toast(`تم استيراد ${n} عضوا إلى طاقم مركز الامتحان`);
  }
  const fillFromCards = f => { (f.rows || []).forEach(r => { const e = emp(r[0]); if (!e) return; if (!nm(r[6]) && e.sex) r[6] = e.sex === 'F' ? 'أنثى' : 'ذكر'; if (!nm(r[7]) && e.rib) r[7] = e.rib; if (!nm(r[1]) && e.ppr) r[1] = e.ppr; }); };
  const staffDoc = docOf('staff');
  if (staffDoc) {
    staffDoc.d = 'أعضاء المركز ومهامهم (رئيس المركز، مراقبو الإجراء، الكتابة، طاقم النظافة، التصحيح، المداومون...): من لائحة الموظفين أو باستيراد أساتذة المؤسسات الأخرى من Excel، مع الجنس والحساب البنكي.';
    staffDoc.defs = () => [{ t: 'html', html: '<div class="btn-row"><button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة كمراقبين</button><button type="button" class="btn sm pri" data-act="imp">استيراد الأساتذة من Excel</button><button type="button" class="btn sm" data-act="cards">الجنس والحساب البنكي من بطاقات الموظفين</button></div>' },
      { k: 'rows', l: 'الطاقم', t: 'grid', cols: ['الاسم الكامل', 'رقم التأجير', 'الإطار / المادة', 'المهمة', 'مقر العمل', 'غير متوفر (أرقام الحصص)', 'الجنس', 'الحساب البنكي (RIB)'], widths: ['1.3fr', '.7fr', '1fr', '.95fr', '.9fr', '.6fr', '.5fr', '1.1fr'],
        list: ['k2Emps', null, null, 'exRoles', null, null, 'exSex', null], dirs: [null, 'ltr', null, null, null, 'ltr', null, 'ltr'], dls: { exRoles: ROLES, exSex: ['ذكر', 'أنثى'] },
        link: { src: 'emp', n: 0, cols: { ppr: 1, cadre: 2 }, post: (row, r) => { const e = r.rec || {}; row[6] = row[6] || (e.sex === 'F' ? 'أنثى' : e.sex === 'M' ? 'ذكر' : ''); row[7] = row[7] || e.rib || ''; } } },
      { note: 'ملف Excel: الأعمدة الاسم الكامل، رقم التأجير، المؤسسة، المادة، الجنس، المهمة (يمكن كتابة رقم المهمة كما في Gestion Exam: 1 رئيس المركز، 2 مراقب الإجراء، 3 الكتابة، 4 طاقم النظافة، 5 التصحيح، 6 أخرى). «غير متوفر» = أرقام الحصص (مثال: 2,5).' }];
    staffDoc.act = Object.assign({}, staffDoc.act || {}, {
      all: (f, sy, c) => { const I = info(sy), old = f.rows || [], has = new Set(old.map(r => MK.hkey(r[0])));
        const add2 = (K.E.teachers() || []).filter(e => !has.has(MK.hkey(fullName(e)))).map(e => [fullName(e), e.ppr || '', e.subject || e.cadre || '', ROLES[1], S().school || '', '', e.sex === 'F' ? 'أنثى' : e.sex === 'M' ? 'ذكر' : '', e.rib || '']);
        f.rows = (old.some(r => /رئيس مركز الامتحان/.test(r[3] || '')) || !nm(I.head) ? [] : [[I.head, '', 'مدير(ة) المؤسسة', ROLES[0], S().school || '', '', '', '']]).concat(old, add2); c.save('rows'); c.redraw && c.redraw(); },
      imp: (f, sy, c) => importStaff(f, sy, c),
      cards: (f, sy, c) => { fillFromCards(f); c.save('rows'); c.redraw && c.redraw(); c.toast('تم ملء الجنس والحساب البنكي من بطاقات الموظفين'); }
    });
  }
  add({ k: 'ex_staffstats', t: 'معطيات إحصائية حول طاقم مركز الامتحان', grp: 's', d: 'عدد أعضاء الطاقم حسب المهمة والجنس، وحسب مقر العمل (المؤسسة الأصلية)، وحاجيات الحراسة.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const St = staff(sy), G = guardRows(sy);
      const roles = Array.from(new Set(St.map(r => nm(r[3]) || 'غير محددة')));
      const rr = roles.map(ro => { const L = St.filter(r => (nm(r[3]) || 'غير محددة') === ro); return tr([{ t: ro, c: 'b r' }, L.filter(r => sexOf(r) === 'M').length, L.filter(r => sexOf(r) === 'F').length, { t: L.length, c: 'b' }]); });
      rr.push(tr([{ t: 'المجموع', c: 'b' }, St.filter(r => sexOf(r) === 'M').length, St.filter(r => sexOf(r) === 'F').length, St.length], 'tot'));
      const wps = Array.from(new Set(St.map(r => nm(r[4]) || '—'))).sort((a, b) => a.localeCompare(b, 'ar'));
      const wr = wps.map(w => { const L = St.filter(r => (nm(r[4]) || '—') === w); return tr([{ t: w, c: 'r b' }, L.length, L.filter(r => G.some(g => nm(g[2]) === nm(r[0]) || nm(g[3]) === nm(r[0]))).length, G.filter(g => L.some(r => nm(g[2]) === nm(r[0]) || nm(g[3]) === nm(r[0]))).length]); });
      return { title: 'معطيات إحصائية حول طاقم مركز الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [SB.cap('حسب المهمة والجنس'), tbl(thr(['المهمة', 'الذكور', 'الإناث', 'المجموع']), rr, 'big'),
        SB.cap('حسب مقر العمل'), tbl(thr(['المؤسسة / مقر العمل', 'عدد الأعضاء', 'منهم مكلفون بالحراسة', 'عدد حصص الحراسة']), wr.length ? wr : [tr(['', '', '', ''])], 'big')] };
    } });

  /* ================= 2. rooms generated by track (توليد قاعات الامتحان على الشعب) ================= */
  const roomsDoc = docOf('rooms');
  if (roomsDoc) {
    const defs0 = roomsDoc.defs, init0 = roomsDoc.init;
    roomsDoc.init = (...a) => Object.assign(init0 ? init0(...a) : {}, { capDef: '20' });
    roomsDoc.defs = (f, sy) => [{ k: 'capDef', l: 'السعة الافتراضية للقاعة', t: 'num', half: true },
      { t: 'html', half: true, html: '<label>&nbsp;</label><button type="button" class="btn sm" data-act="gen">توليد قاعات الامتحان حسب المسالك / الشعب</button>' }].concat(defs0 ? defs0(f, sy) : []);
    roomsDoc.act = Object.assign({}, roomsDoc.act || {}, {
      gen: async (f, sy, c) => {
        const L = cands(sy), cap = Math.max(1, parseInt(f.capDef, 10) || 20);
        if (!L.length) return c.toast('استورد المترشحين أولا', true);
        if ((f.rows || []).some(r => nm(r[0])) && !(await confirmBox('تعويض لائحة القاعات الحالية بقاعات مولدة حسب المسالك / الشعب؟', 'توليد', false))) return;
        const by = new Map(); L.forEach(x => { const t = nm(x[C.track]); by.set(t, (by.get(t) || 0) + 1); });
        const out = []; let n = 1;
        Array.from(by.entries()).sort((a, b) => a[0].localeCompare(b[0], 'ar')).forEach(([t, cnt]) => {
          const k = Math.ceil(cnt / cap), per = Math.ceil(cnt / k);
          for (let i = 0; i < k; i++) out.push([String(n++), String(per), by.size > 1 ? t : '']);
        });
        f.rows = out; c.save('rows'); c.redraw && c.redraw();
        c.toast(`تم توليد ${out.length} قاعة (${by.size > 1 ? by.size + ' مسالك' : 'مسلك واحد'}) — اضغط بعدها «التوزيع الذكي للمترشحين على القاعات»`);
      }
    });
  }

  /* ================= 3. the candidates' convocations (الاستدعاءات 1 و 2) ================= */
  const GUIDE = ['على المترشح(ة) أن يحضر إلى مركز الامتحان نصف ساعة على الأقل قبل الوقت المخصص لإجراء الاختبار مصحوبا بهذا الاستدعاء وبطاقة التعريف (أو ما يثبت الهوية).',
    'لا يسمح للمترشح(ة) مطلقا بالدخول إلى قاعة الامتحان بعد توزيع مواضيع الامتحان، وكل تأخر يتحمل المترشح(ة) وحده عواقبه.',
    'ضرورة إحضار جميع اللوازم الخاصة باجتياز الامتحان (أقلام، مسطرة...)، ويمنع تبادل الأدوات داخل القاعة.',
    'كل مترشح(ة) ضبط يحمل هاتفا نقالا أو أية آلة إلكترونية يمكن استعمالها من أجل الغش داخل قاعات أو فضاءات مركز الامتحان، ولو لم تكن مشغلة، يعتبر غاشا.',
    'كل مترشح(ة) ضبط في حالة غش ستطبق في حقه القوانين الجاري بها العمل (القانون رقم 02.13 المتعلق بزجر الغش في الامتحانات المدرسية).',
    'يجب الجلوس في المكان المخصص (رقم الطاولة)، وكتابة رقم الامتحان والمعلومات المطلوبة في المكان المخصص لها في ورقة التحرير دون أي علامة مميزة.',
    'لا يسمح بمغادرة القاعة قبل مرور نصف الوقت المخصص للاختبار، ويوقع المترشح(ة) في محضر التوقيعات عند تسليم ورقة تحريره.'];
  const candTable = (sy, c) => { const ss = subjects(sy).filter(sj => trackHit(c, sj));
    return `<table class="sb-t cmp ex-cg-t"><thead>${thr(['اليوم', 'التاريخ', 'المادة', 'من', 'إلى', 'الفترة'])}</thead><tbody>${ss.length ? ss.map(sj => tr([sj[1] ? K.dayName(sj[1]) : '', MK.showDate(sj[1]), { t: sj[0], c: 'b' }, { t: sj[2] || '', c: 'ltr' }, { t: sj[3] || '', c: 'ltr' }, period(sj)])).join('') : tr(['', '', '', '', '', ''])}</tbody></table>`; };
  const candId = (I, c) => `<table class="sb-t kv cmp ex-cg-id"><colgroup><col style="width:20%"><col style="width:32%"><col style="width:18%"><col style="width:30%"></colgroup><tbody>
    ${tr([{ t: 'الاسم والنسب', c: 'k' }, { t: dots(c[C.name], 26), c: 'b' }, { t: 'رقم الامتحان', c: 'k' }, { h: `<b class="ex-cg-no">${esc(dots(c[C.no], 6))}</b>` }])}
    ${tr([{ t: 'الرقم الوطني', c: 'k' }, { t: c[C.code] || '', c: 'ltr' }, { t: 'تاريخ الازدياد', c: 'k' }, c[C.birth] || ''])}
    ${tr([{ t: 'المؤسسة الأصلية', c: 'k' }, c[C.origin] || '', { t: 'القسم', c: 'k' }, c[C.cls] || ''])}
    ${nm(c[C.track]) ? tr([{ t: 'المسلك / الشعبة', c: 'k' }, { t: c[C.track], s: 3 }]) : ''}
    ${tr([{ t: 'مركز الامتحان', c: 'k' }, { t: I.center || '', c: 'b' }, { t: 'القاعة / الطاولة', c: 'k' }, { h: `<b class="ex-cg-no">${esc(dots(c[C.room], 3))}</b>${nm(c[C.desk]) ? ` — الطاولة ${esc(c[C.desk])}` : ''}` }])}</tbody></table>`;
  const signer = (f, I) => (f.signer === 'school' ? 'خاتم وتوقيع مدير(ة) المؤسسة الأصلية' : 'خاتم وتوقيع رئيس(ة) مركز الامتحان');
  const convDoc = docOf('ex_convoc');
  if (convDoc) {
    const build0 = convDoc.build;
    convDoc.d = 'استدعاء فردي لكل مترشح(ة) بثلاثة نماذج: «الاستدعاءات 1» (استدعاءان في الصفحة)، «الاستدعاءات 2» (صفحة كاملة بجدولة الامتحان والتوجيهات العامة)، أو النموذج المختصر (3 في الصفحة)، مع التصفية حسب القاعة أو القسم أو المؤسسة الأصلية.';
    convDoc.init = () => ({ fmt: 'ge1', by: '', val: '', signer: 'center', order: 'no' });
    convDoc.onSave = k => (k === 'by' ? 'redraw' : undefined);
    convDoc.defs = (f, sy) => {
      const vals = f && f.by === 'room' ? Array.from(byRoom(sy).keys()).sort(sortRooms) : f && f.by === 'cls' ? Array.from(new Set(cands(sy).map(c => nm(c[C.cls])).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true })) : f && f.by === 'origin' ? origins(sy) : [];
      return [{ k: 'fmt', l: 'النموذج', t: 'select', opts: [['ge1', 'الاستدعاءات 1 — استدعاءان في الصفحة'], ['ge2', 'الاستدعاءات 2 — صفحة كاملة بالتوجيهات'], ['c3', 'النموذج المختصر — 3 في الصفحة']] },
        { k: 'by', l: 'المترشحون', t: 'select', opts: [['', 'كل المترشحين'], ['room', 'حسب القاعة'], ['cls', 'حسب القسم'], ['origin', 'حسب المؤسسة الأصلية']], half: true },
        ...(vals.length ? [{ k: 'val', l: 'الاختيار', t: 'select', opts: [['', 'الكل (مرتبة)']].concat(vals.map(v => [v, v])), half: true }] : []),
        { k: 'order', l: 'الترتيب', t: 'select', opts: [['no', 'رقم الامتحان'], ['name', 'الاسم'], ['cls', 'القسم ثم الاسم']], half: true },
        { k: 'signer', l: 'الختم والتوقيع', t: 'select', opts: [['center', 'رئيس(ة) مركز الامتحان'], ['school', 'مدير(ة) المؤسسة الأصلية (استدعاءات مختومة)']], half: true }];
    };
    const listOf = (f, sy) => {
      let L = cands(sy).slice();
      const key = f.by === 'room' ? C.room : f.by === 'cls' ? C.cls : f.by === 'origin' ? C.origin : -1;
      if (key >= 0 && nm(f.val)) L = L.filter(c => nm(c[key]) === nm(f.val));
      const byN = (a, b) => nm(a[C.name]).localeCompare(nm(b[C.name]), 'ar'), byNo = (a, b) => (parseInt(a[C.no], 10) || 0) - (parseInt(b[C.no], 10) || 0);
      L.sort(f.order === 'name' ? byN : f.order === 'cls' ? (a, b) => nm(a[C.cls]).localeCompare(nm(b[C.cls]), 'ar', { numeric: true }) || byN(a, b) : byNo);
      if (key >= 0 && !nm(f.val)) L.sort((a, b) => nm(a[key]).localeCompare(nm(b[key]), 'ar', { numeric: true }) || 0);
      return L;
    };
    convDoc.build = (s, f, sy) => {
      if (f.fmt === 'c3' || !f.fmt) { const keep = Y(sy).cands.rows; try { if (f.by && nm(f.val)) Y(sy).cands.rows = listOf(f, sy); return build0(s, f, sy); } finally { Y(sy).cands.rows = keep; } }
      const I = info(sy), L = listOf(f, sy), list = L.length ? L : [new Array(10).fill('')];
      const head = `<div class="ex-cg-h"><b>استدعاء</b><span>لاجتياز ${esc(examTitle(I))}</span><span>دورة: ${esc(I.session)} — المستوى: ${esc(levelName(I.level))}</span></div>`;
      const sign = `<div class="ex-cg-s"><span>حرر ب${esc(s.city || '')} في: ${esc(today())}</span><b>${esc(signer(f, I))}</b></div>`;
      if (f.fmt === 'ge2') return { page: 'a4', pages: list.map((c, i) => `${i ? '<div class="docx-pb"></div>' : ''}${hdr(s)}<div class="ex-cg full">${head}${candId(I, c)}
        <div class="ex-cg-c">جــــدولــة الامتحـــان</div>${candTable(sy, c)}<div class="ex-cg-c">توجيهات عامة للمترشح(ة)</div><ol class="ex-cg-g">${GUIDE.map(g => `<li>${esc(g)}</li>`).join('')}</ol>${sign}</div>`) };
      const one = c => `<div class="ex-cg">${hdr(s)}${head}${candId(I, c)}${candTable(sy, c)}<div class="ex-cg-n">${GUIDE.slice(0, 4).map(g => '- ' + esc(g)).join(' ')}</div>${sign}</div>`;
      const pages = []; for (let i = 0; i < list.length; i += 2) pages.push(`<div class="ex-cgs">${list.slice(i, i + 2).map(one).join(cutLine)}</div>`);
      return { page: 'a4', pages };
    };
  }

  /* ================= 4. the invigilators' convocation (تكليف بمهمة مراقبة الإجراء) ================= */
  const GE_REFS = ['المرسوم رقم 2-23-827 بتاريخ 23 فبراير 2024 بشأن الإشراف على تنظيم بعض الامتحانات والمباريات بالوزارة المكلفة بالتربية الوطنية؛',
    'القرار المشترك رقم 145-24 بتاريخ 31 أكتوبر 2024 المتعلق بتحديد مقدار التعويض عن الإشراف على تنظيم بعض الامتحانات؛',
    'المقرر الوزاري بشأن دفتر مساطر امتحانات نيل الشهادة المعنية؛', 'المذكرات الوزارية والجهوية والإقليمية المنظمة للامتحان.'].join('\n');
  const asgDoc = docOf('ex_assign');
  if (asgDoc) {
    asgDoc.t = 'استدعاء المراقبين: تكليف بمهمة مراقبة الإجراء (لكل عضو)';
    asgDoc.d = 'استدعاء / تكليف فردي لكل عضو من الطاقم (نموذج Gestion Exam): المراجع (المرسوم 2-23-827 والقرار المشترك 145-24)، المهمة، وجدول حصصه: اليوم والتاريخ، المادة، من، إلى، الفترة، القاعة، الدور (أساسي / احتياطي).';
    asgDoc.init = () => ({ who: '', refs: GE_REFS, only: '' });
    asgDoc.defs = (f, sy) => [{ k: 'who', l: 'العضو', t: 'select', opts: [['', 'كل أعضاء الطاقم (استدعاء لكل واحد)']].concat(staff(sy).map(r => [r[0], `${r[0]} — ${nm(r[3]) || ''}`])) },
      { k: 'only', l: 'الأعضاء المعنيون', t: 'select', opts: [['', 'كل الطاقم'], ['g', 'المكلفون بالحراسة فقط']], half: true },
      { k: 'refs', l: 'المراجع (سطر لكل مرجع)', t: 'area', rows: 4 }];
    asgDoc.build = (s, f, sy) => {
      const I = info(sy), ss = subjects(sy);
      let L = staff(sy).filter(r => !f.who || r[0] === f.who); if (f.only === 'g') L = L.filter(r => myRows(sy, r[0]).length);
      const refs = String(f.refs == null ? GE_REFS : f.refs).split('\n').map(nm).filter(Boolean);
      const pages = [];
      (L.length ? L : [['', '', '', ROLES[1], '']]).forEach((r, i) => {
        const mine = myRows(sy, r[0]).slice().sort((a, b) => (+a[0]) - (+b[0]));
        const role = nm(r[3]) || 'مراقب(ة) الإجراء', guard = /مراقب|احتياط/.test(role) || mine.length;
        const rows = mine.length ? mine.map(g => { const sj = sessOf(sy, g[0]); return tr([{ t: dayDate(sj) }, { t: sj[0], c: 'b' }, { t: sj[2] || '', c: 'ltr' }, { t: sj[3] || '', c: 'ltr' }, period(sj), { t: isRes(g) ? '—' : g[1], c: 'b' }, isRes(g) ? 'احتياطي(ة)' : 'أساسي(ة)']); })
          : ss.map(sj => tr([{ t: dayDate(sj) }, { t: sj[0], c: 'b' }, { t: sj[2] || '', c: 'ltr' }, { t: sj[3] || '', c: 'ltr' }, period(sj), '', guard ? '' : role]));
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: hdr(s), blocks: [
          { html: `<div class="sb-pv ex-sv"><p style="text-align:left">${esc(s.city || '')} في: ${esc(today())}</p>
            <p class="c"><b>من السيد(ة) رئيس(ة) مركز الامتحان:</b> ${esc(I.head || '')} — ${esc(I.center || '')}</p>
            <p class="c"><b>إلـــــــى السيد(ة):</b> ${esc(dots(r[0], 30))} — <b>رقم التأجير:</b> <span dir="ltr">${esc(dots(r[1], 10))}</span>${nm(r[4]) ? ` — <b>مقر العمل:</b> ${esc(r[4])}` : ''}</p>
            <p><b>الموضوع:</b> تكليف بمهمة ${esc(role === 'مراقب(ة) الإجراء' ? 'مراقبة الإجراء' : role)}.</p>
            ${refs.length ? `<p><b>المراجع:</b></p><ol class="ex-sv-r">${refs.map(x => `<li>${esc(x)}</li>`).join('')}</ol>` : ''}
            <p class="c"><b>سلام تام بوجود مولانا الإمام دام له النصر والتأييد؛</b></p>
            <p>وبعد، فتبعا للمراجع المشار إليها أعلاه، وفي إطار تنظيم ${esc(examTitle(I))} — دورة ${esc(I.session)} —، يشرفني أن أخبركم بأنه تقرر تكليفكم بمهمة <b>${esc(role)}</b> بمركز الامتحان <b>${esc(I.center || '')}</b>${guard ? '، وذلك وفق تاريخ وتوقيت الحصص التالية' : ' طيلة أيام الامتحان'}:</p></div>` },
          { before: SB.cap(guard ? 'تاريخ وتوقيت حصص الأستاذ(ة)' : 'أيام الامتحان'), table: { cls: 'sb-t cmp', head: thr(['اليوم والتاريخ', 'المادة', 'من', 'إلى', 'الفترة', 'القاعة', 'الدور']), rows } },
          { html: `<div class="sb-note">- يتعين الحضور إلى مركز الامتحان نصف ساعة على الأقل قبل انطلاق كل حصة، والتوقيع في محضر الحضور. - يبقى الأستاذ(ة) الاحتياطي(ة) رهن إشارة رئيس المركز طيلة الحصة. - يمنع استعمال الهاتف النقال داخل قاعات الامتحان. - كل تغيب يجب أن يبرر لرئيس المركز قبل موعد الحصة.</div>` },
          { html: '<p class="sb-p" style="text-align:center">وتقبلوا فائق التقدير والاحترام، والسلام.</p>' }, SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان' })] });
        P.forEach((p, j) => pages.push(j || !i ? p : pb(p)));
      });
      return { page: 'a4', pages };
    };
  }
  add({ k: 'ex_convrecv', t: 'محضر استلام استدعاءات المراقبين', grp: 's', d: 'لائحة أعضاء الطاقم يوقع فيها كل واحد(ة) عند استلام استدعائه (تكليفه)، مع عدد حصصه وتاريخ الاستلام.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4', init: () => ({ only: '' }),
    defs: () => [{ k: 'only', l: 'الأعضاء', t: 'select', opts: [['', 'كل الطاقم'], ['g', 'المكلفون بالحراسة فقط']] }],
    build: (s, f, sy) => {
      let L = staff(sy); if (f.only === 'g') L = L.filter(r => myRows(sy, r[0]).length);
      const rows = L.map((r, i) => { const G = myRows(sy, r[0]); return tr([i + 1, { t: r[0], c: 'r b' }, { t: r[1], c: 'ltr' }, { t: r[4] || '', c: 'sm' }, { t: r[3] || '', c: 'sm' }, G.filter(g => !isRes(g)).length || '', G.filter(isRes).length || '', '', { t: '', st: 'width:20%' }]); });
      return { title: 'محضر استلام استدعاءات المراقبين', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        { html: `<p class="sb-p">يشهد أعضاء طاقم مركز الامتحان <b>${esc(info(sy).center || '')}</b> الموقعون أسفله أنهم تسلموا استدعاءاتهم (تكليفاتهم) مع جدول حصصهم.</p>` },
        tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'مقر العمل', 'المهمة', 'حصص أساسية', 'حصص احتياطية', 'تاريخ الاستلام', 'التوقيع']), rows.length ? rows : [tr(['', '', '', '', '', '', '', '', { t: '', st: 'height:8mm' }])], 'cmp')] };
    } });

  /* ================= 5. the origin schools: lists and receipts (لوائح المترشحين بالمؤسسة / محضر الاستلام) ================= */
  add({ k: 'ex_origin', t: 'لوائح المترشحين حسب المؤسسة الأصلية', grp: 'k', d: 'لائحة لكل مؤسسة أصلية بأرقام الامتحان والقاعات، تُسلم لمدير(ة) المؤسسة مع الاستدعاءات المختومة، مع جدول توزيع المترشحين على مركز الامتحان.', auto: 'لائحة المترشحين', page: 'a4', init: () => ({ school: '' }),
    defs: (f, sy) => [{ k: 'school', l: 'المؤسسة الأصلية', t: 'select', opts: [['', 'كل المؤسسات (صفحة لكل مؤسسة) + جدول التوزيع']].concat(origins(sy).map(o => [o, o])) }],
    build: (s, f, sy) => {
      const L = cands(sy), O = nm(f.school) ? [nm(f.school)] : origins(sy), pages = [];
      if (!nm(f.school)) {
        const rows = O.map(o => { const A = L.filter(c => nm(c[C.origin]) === o); const ns = A.map(c => parseInt(c[C.no], 10)).filter(isFinite); return tr([{ t: o, c: 'r b' }, A.filter(c => !isF(c[C.g])).length, A.filter(c => isF(c[C.g])).length, { t: A.length, c: 'b' }, ns.length ? Math.min(...ns) : '', ns.length ? Math.max(...ns) : '', { t: Array.from(new Set(A.map(c => nm(c[C.room])).filter(Boolean))).sort(sortRooms).join('، '), c: 'sm' }]); });
        rows.push(tr([{ t: 'المجموع', c: 'b' }, L.filter(c => !isF(c[C.g])).length, L.filter(c => isF(c[C.g])).length, L.length, '', '', ''], 'tot'));
        pages.push(...MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'جدول توزيع المترشحين على مركز الامتحان حسب المؤسسات الأصلية', sub(sy)), blocks: [tbl(thr(['المؤسسة الأصلية', 'الذكور', 'الإناث', 'المجموع', 'أول رقم امتحان', 'آخر رقم امتحان', 'القاعات']), rows, 'big'), signHead(s)] }));
      }
      O.forEach(o => {
        const A = L.filter(c => nm(c[C.origin]) === o).sort((a, b) => nm(a[C.cls]).localeCompare(nm(b[C.cls]), 'ar', { numeric: true }) || (parseInt(a[C.no], 10) || 0) - (parseInt(b[C.no], 10) || 0));
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'لائحة المترشحين بالمؤسسة', `${sub(sy)}<br>المؤسسة الأصلية: ${esc(o)} — عدد المترشحين: ${A.length} (الإناث: ${A.filter(c => isF(c[C.g])).length})`), blocks: [
          tbl(thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'الرقم الوطني', 'القسم', 'القاعة', 'الطاولة']), A.map((c, i) => tr([i + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r b' }, { t: c[C.code], c: 'ltr' }, c[C.cls], { t: c[C.room], c: 'b' }, c[C.desk] || ''])), 'cmp'),
          SB.sign(s, { right: 'خاتم وتوقيع رئيس(ة) مركز الامتحان', left: 'توقيع مدير(ة) المؤسسة (الاستلام)' })] });
        P.forEach((p, i) => pages.push(i || !pages.length ? p : pb(p)));
      });
      if (!pages.length) pages.push(`${hdr(s)}<p class="sb-p">لا توجد مؤسسات أصلية في لائحة المترشحين.</p>`);
      return { page: 'a4', pages };
    } });
  const rcpDoc = docOf('ex_receipt');
  if (rcpDoc) {
    const build0 = rcpDoc.build;
    rcpDoc.d = 'يشهد فيه مدير(ة) المؤسسة الأصلية باستلام لوائح أرقام الامتحان والاستدعاءات المختومة من رئيس المركز — محضر لكل مؤسسة أصلية بعدد مترشحيها.';
    rcpDoc.defs = (f, sy) => [{ k: 'school', l: 'المؤسسة الأصلية', t: 'select', opts: [['', 'كل المؤسسات الأصلية (محضر لكل مؤسسة)']].concat(origins(sy).map(o => [o, o])), half: true }, { k: 'n', l: 'عدد المترشحين (فارغ = تلقائي)', t: 'num', half: true }];
    rcpDoc.build = (s, f, sy) => {
      const O = nm(f.school) ? [nm(f.school)] : origins(sy);
      if (!O.length) return build0(s, f, sy);
      const pages = [];
      O.forEach((o, i) => { const n = nm(f.n) && nm(f.school) ? f.n : String(cands(sy).filter(c => nm(c[C.origin]) === o).length); const d = build0(s, Object.assign({}, f, { school: o, n }), sy);
        MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, d.title, d.sub), blocks: d.blocks.concat([d.sign]) }).forEach((p, j) => pages.push(i && !j ? pb(p) : p)); });
      return { page: 'a4', pages };
    };
  }

  /* ================= 6. the teachers on duty (المراقبون المداومون خلال الامتحان) ================= */
  add({ k: 'ex_duty', t: 'ورقة المراقبين المداومين خلال الامتحان', grp: 'e', d: 'لكل فترة (صباحا / مساء) من أيام الامتحان: المواد، الأستاذ(ة) المداوم(ة) (المهمة «مداوم(ة)» في الطاقم بالتناوب)، ملاحظاته وتوقيعه.', auto: 'الجدولة وطاقم المركز', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const ss = subjects(sy), D = staff(sy).filter(r => /مداوم|المداومة/.test(r[3] || '')).map(r => r[0]);
      const halves = []; ss.forEach(sj => { const k = `${sj[1] || ''}|${period(sj)}`; let h = halves.find(x => x.k === k); if (!h) halves.push(h = { k, sj, L: [] }); h.L.push(sj); });
      halves.sort((a, b) => a.k.localeCompare(b.k));
      const rows = halves.map((h, i) => tr([{ t: dayDate(h.sj) }, h.L[0] ? period(h.L[0]) : '', { t: h.L.map(x => `${x[0]} (${x[2] || ''}${x[3] ? '-' + x[3] : ''})`).join('، '), c: 'sm' }, { t: D.length ? D[i % D.length] : '', c: 'b' }, { t: '', st: 'height:16mm;width:30%' }, { t: '', st: 'width:14%' }]));
      return { title: 'المراقبون المداومون خلال الامتحان', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        tbl(thr(['اليوم والتاريخ', 'الفترة', 'المواد والتوقيت', 'الأستاذ(ة) المداوم(ة)', 'ملاحظات الأستاذ(ة) المداوم(ة)', 'التوقيع']), rows.length ? rows : [tr(['', '', '', '', { t: '', st: 'height:16mm' }, ''])], 'cmp'),
        { html: '<div class="sb-note">يسهر الأستاذ(ة) المداوم(ة) على تتبع سير الحصص، ويسجل كل حدث يقع خلال إجراء الاختبارات (تأخر، غياب مراقب، حالة غش، ملاحظة حول الموضوع...) ويخبر رئيس المركز فورا.</div>' }] };
    } });

  /* ================= 7. the allowances (التعويض عن الإشراف على تنظيم الامتحان) ================= */
  const examDays = sy => Array.from(new Set(subjects(sy).map(r => r[1]).filter(Boolean))).length;
  add({ k: 'ex_pay', t: 'بيان التعويضات عن الإشراف على تنظيم الامتحان', grp: 's', d: 'لكل عضو من الطاقم: المهمة، عدد الحصص أو الأيام، المقدار حسب المهمة (يُدخل حسب القرار المشترك 145-24)، المبلغ، والحساب البنكي، مع المجموع العام.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4l',
    init: (s, sy) => ({ unit: 'sess', rates: Array.from(new Set(staff(sy).map(r => nm(r[3])).filter(Boolean))).map(r => [r, '']), noRes: '' }),
    defs: (f, sy) => { if (f) { const old = f.rates || []; const R = Array.from(new Set(staff(sy).map(r => nm(r[3])).filter(Boolean))); f.rates = R.map(r => [r, ((old.find(o => nm(o[0]) === r) || [])[1]) || '']); }
      return [{ k: 'unit', l: 'وحدة الاحتساب', t: 'select', opts: [['sess', 'الحصة (مراقبو الإجراء) / اليوم (باقي المهام)'], ['day', 'اليوم لكل المهام']], half: true },
        { k: 'noRes', l: 'حصص الاحتياط', t: 'select', opts: [['', 'تحتسب'], ['1', 'لا تحتسب']], half: true },
        { k: 'rates', l: 'المقدار حسب المهمة (درهم للحصة أو لليوم)', t: 'grid', cols: ['المهمة', 'المقدار (درهم)'], widths: ['1.4fr', '.6fr'], types: ['text', 'num'], fixed: true },
        { note: 'المراجع: المرسوم رقم 2-23-827 بتاريخ 23 فبراير 2024 بشأن الإشراف على تنظيم بعض الامتحانات والمباريات، والقرار المشترك رقم 145-24 بتاريخ 31 أكتوبر 2024 المتعلق بتحديد مقدار التعويض. أدخل المقادير المعمول بها في دورتكم.' }]; },
    build: (s, f, sy) => {
      const St = staff(sy), days = examDays(sy), rate = r => num(((f.rates || []).find(o => nm(o[0]) === nm(r[3])) || [])[1]) || 0;
      let tot = 0;
      const rows = St.map((r, i) => {
        const G = myRows(sy, r[0]).filter(g => !(f.noRes === '1' && isRes(g)));
        const guard = /مراقب|احتياط/.test(r[3] || '') && f.unit !== 'day';
        const n = guard ? G.length : (G.length ? Array.from(new Set(G.map(g => sessOf(sy, g[0])[1]))).length : days);
        const amt = n * rate(r); tot += amt;
        return tr([i + 1, { t: r[0], c: 'r b' }, { t: r[1], c: 'ltr' }, { t: r[2] || '', c: 'sm' }, { t: r[3] || '', c: 'sm' }, `${n} ${guard ? 'حصة' : 'يوم'}`, rate(r) ? f2(rate(r)) : '', { t: amt ? f2(amt) : '', c: 'b' }, { t: ribOf(r), c: 'ltr sm' }, { t: '', st: 'width:11%' }]);
      });
      rows.push(tr([{ t: 'المجموع العام', c: 'b', s: 7 }, { t: tot ? f2(tot) : '', c: 'b' }, '', ''], 'tot'));
      return { title: 'بيان التعويضات عن الإشراف على تنظيم الامتحان', sub: sub(sy), page: 'a4l', sign: SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز الامتحان' }), blocks: [
        tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الإطار / المادة', 'المهمة', 'عدد الحصص / الأيام', 'المقدار', 'المبلغ (درهم)', 'الحساب البنكي (RIB)', 'التوقيع']), rows, 'cmp'),
        { html: '<div class="sb-note">طبقا للمرسوم رقم 2-23-827 بتاريخ 23 فبراير 2024 بشأن الإشراف على تنظيم بعض الامتحانات والمباريات بالوزارة المكلفة بالتربية الوطنية، والقرار المشترك رقم 145-24 بتاريخ 31 أكتوبر 2024 المتعلق بتحديد مقدار التعويض.</div>' }] };
    } });

  /* ================= 8. search a candidate (بحث عن المترشح) ================= */
  const findC = (sy, q) => { q = nm(q); if (!q) return null; const L = cands(sy), k = MK.hkey(q); return L.find(c => nm(c[C.no]) === q) || L.find(c => nm(c[C.code]).toUpperCase() === q.toUpperCase()) || L.find(c => MK.hkey(c[C.name]) === k) || L.find(c => MK.hkey(c[C.name]).includes(k)) || null; };
  add({ k: 'ex_find', t: 'البحث عن مترشح (بطاقة شاملة)', grp: 'k', d: 'ابحث برقم الامتحان أو الرقم الوطني أو الاسم: المعطيات، القاعة والطاولة، جدولة موادّه مع مراقبي قاعته في كل حصة، والنتيجة إن وُجدت.', auto: 'المترشحون والجدولة والحراسة', page: 'a4', init: () => ({ q: '' }),
    defs: (f, sy) => [{ k: 'q', l: 'رقم الامتحان أو الرقم الوطني أو الاسم', list: 'exFindL', dls: { exFindL: () => cands(sy).slice(0, 3000).map(c => c[C.name]) } }],
    build: (s, f, sy) => {
      const I = info(sy), c = findC(sy, f.q);
      if (!c) return { title: 'البحث عن مترشح', sub: sub(sy), page: 'a4', blocks: [{ html: `<p class="sb-p">${nm(f.q) ? `لا يوجد مترشح بهذا الرقم أو الاسم: <b>${esc(f.q)}</b>` : 'اكتب رقم الامتحان أو الرقم الوطني أو اسم المترشح(ة) في خانة البحث.'}</p>` }] };
      const G = guardRows(sy), R = (results(sy) || []).find(r => r.c === c);
      const ss = subjects(sy).map((sj, i) => [sj, i]).filter(([sj]) => trackHit(c, sj));
      const rows = ss.map(([sj, i]) => { const g = G.find(x => +x[0] === i + 1 && nm(x[1]) === nm(c[C.room])) || []; return tr([{ t: dayDate(sj) }, { t: sj[0], c: 'b' }, { t: `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`, c: 'ltr' }, period(sj), { t: [g[2], g[3]].filter(nm).join(' / '), c: 'sm' }, R && R.marks[i] != null ? f2(R.marks[i]) : '']); });
      return { title: 'بطاقة مترشح(ة)', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [
        kv([['الاسم الكامل', c[C.name]], ['رقم الامتحان', c[C.no]], ['الرقم الوطني', c[C.code]], ['تاريخ الازدياد', c[C.birth]], ['الجنس', c[C.g]], ['القسم', c[C.cls]], ['المؤسسة الأصلية', c[C.origin]], ['المسلك / الشعبة', c[C.track]], ['مركز الامتحان', I.center], ['القاعة / الطاولة', `${nm(c[C.room])}${nm(c[C.desk]) ? ' / ' + c[C.desk] : ''}`]]),
        SB.cap('جدولة مواد المترشح(ة) ومراقبو قاعته'), tbl(thr(['اليوم والتاريخ', 'المادة', 'التوقيت', 'الفترة', 'المراقبون', 'النقطة']), rows.length ? rows : [tr(['', '', '', '', '', ''])], 'big'),
        R && R.fin != null ? { html: `<div class="ex-verd ${R.ok ? 'ok' : 'bad'}">المعدل العام: ${f2(R.fin)} — ${R.ok ? 'ناجح(ة)' : 'غير ناجح(ة)'}</div>` } : ''].filter(Boolean) };
    } });

  /* ================= 9. the workflow of Gestion Exam (مسار العمل) on the exam page ================= */
  const STEPS = [['info', 'تهييئ المعطيات'], ['subjects', 'المواد والمسالك'], ['cands', 'استيراد المترشحين'], ['rooms', 'توزيع المترشحين'], ['subjects', 'ضبط الجدولة'],
    ['ex_convoc', 'الاستدعاءات واللوائح'], ['ex_sign', 'مختلف المحاضر'], ['staff', 'طاقم الامتحان'], ['guards', 'توزيع المراقبين'], ['ex_assign', 'استدعاءات المراقبين'], ['ex_find', 'بحث عن مترشح']];
  const pageExams0 = window.pageExams;
  window.pageExams = (v, a) => {
    pageExams0(v, a);
    try {
      const at = v.querySelector('.ex-ai') || v.querySelector('.page-h'); if (!at) return;
      at.insertAdjacentHTML('afterend', `<div class="card ex-wf"><span class="ex-wf-t">مسار العمل</span>${STEPS.map(([k, l], i) => `<button class="ex-wf-s" data-exstep="${k}"><b>${i + 1}</b>${esc(l)}</button>`).join('<i>‹</i>')}</div>`);
      v.querySelectorAll('[data-exstep]').forEach(b => { b.onclick = () => go('examsDoc', { kind: b.dataset.exstep }); });
    } catch (e) { /* never blocks the page */ }
  };

  Dx.modCss += `
  .ex-cgs{display:flex;flex-direction:column;height:100%}.ex-cgs>.ex-cg{flex:1;overflow:hidden}.ex-cg{font-size:9.6pt;line-height:1.45}.ex-cgs .ex-cg .mk-hdr{zoom:.72;margin:0}.ex-cgs .ex-cg td,.ex-cgs .ex-cg th{padding:.35mm 1.2mm!important;font-size:8.6pt;line-height:1.25}.ex-cgs .ex-cg-h{padding:.4mm 3mm}.ex-cgs .ex-cg-h b{font-size:13pt}.ex-cgs .ex-cg-s{min-height:11mm}
  .ex-cg-h{display:flex;justify-content:space-between;align-items:center;border:1.4px solid #1f3864;border-radius:2mm;padding:1mm 3mm;color:#1f3864;margin:1mm 0}.ex-cg-h b{font-size:15pt}.ex-cg-id{margin:1mm 0}.ex-cg-no{font-size:13pt}
  .ex-cg-t{width:100%;margin:1mm 0}.ex-cg-n{font-size:7.8pt;color:#333}.ex-cg-s{display:flex;justify-content:space-between;align-items:flex-start;min-height:15mm;margin-top:1mm}.ex-cg-s b{text-align:center}
  .ex-cg.full{font-size:11pt;line-height:1.6}.ex-cg.full .ex-cg-h b{font-size:20pt}.ex-cg.full .ex-cg-no{font-size:16pt}.ex-cg-c{text-align:center;font-weight:700;font-size:12.5pt;color:#1f3864;margin:2.5mm 0 1mm;text-decoration:underline}
  .ex-cg-g{font-size:10.4pt;line-height:1.75;padding-right:6mm;margin:0}.ex-cg.full .ex-cg-s{min-height:28mm;margin-top:4mm}
  .ex-sv{font-size:11pt;line-height:1.8}.ex-sv .c{text-align:center}.ex-sv-r{margin:0 0 1mm;padding-right:7mm;font-size:10pt;line-height:1.6}`;
  { const c = document.createElement('style'); c.textContent = `
    .ex-wf{display:flex;align-items:center;flex-wrap:wrap;gap:4px;padding:8px 12px;margin-bottom:12px}.ex-wf-t{font-weight:700;margin-inline-end:6px}.ex-wf>i{color:#9aa5b1;font-style:normal}
    .ex-wf-s{border:1px solid var(--line,#d6dde5);background:var(--card,#fff);border-radius:16px;padding:3px 10px 3px 4px;cursor:pointer;font:inherit;font-size:12.5px;display:inline-flex;align-items:center;gap:5px;color:inherit}
    .ex-wf-s b{background:var(--sec,#0f6e5a);color:#fff;border-radius:50%;width:19px;height:19px;display:inline-flex;align-items:center;justify-content:center;font-size:11px}.ex-wf-s:hover{border-color:var(--sec,#0f6e5a)}`; document.head.appendChild(c); }
  window.Exams3 = { importStaff, findC, GE_REFS };
})();
