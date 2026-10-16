'use strict';
/* 1.9.4 — الواردات والصادرات والأرشيف (مكتب الضبط):
   - حفظ المذكرات الوزارية والجهوية والإقليمية وكل المراسلات الواردة: تاريخ الورود، رقم التسجيل (تلقائي لكل سنة)، المرجع، الموضوع، المصدر.
   - الصادرات من المؤسسة إلى المصالح: رقم الإرسال (تلقائي)، المرسل إليه، الموضوع، المرفقات.
   - تصنيف كل وثيقة في الأرشيف (صنف + رقم أرشيف تلقائي داخل الصنف) مع إمكانية إرفاق نسخة ممسوحة (PDF / صورة).
   - الطبع: سجل الواردات، سجل الصادرات، فهرس الأرشيف، بطاقة إحالة.
   Data: DB.mail = { items: [{ id, dir:'in'|'out', year, no, regDate, kind, party, ref, refDate, subject, cat, arch, box, action, notes, file:{name,size,b64} }], cats: [[code, name]] } */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl, ldate } = window.K;
  const nm = t => String(t == null ? '' : t).trim();

  const KINDS_IN = ['مذكرة وزارية', 'مذكرة جهوية (الأكاديمية)', 'مذكرة إقليمية (المديرية)', 'مراسلة', 'منشور / دورية', 'قرار', 'إرسالية', 'استدعاء', 'طلب', 'شكاية', 'أخرى'];
  const KINDS_OUT = ['مراسلة', 'تقرير', 'ورقة إرسال', 'جواب', 'محضر', 'طلب', 'بيان / إحصاء', 'أخرى'];
  const CATS0 = [['01', 'الموارد البشرية'], ['02', 'الشؤون التربوية'], ['03', 'شؤون التلاميذ'], ['04', 'التقويم والامتحانات'], ['05', 'التدبير المالي والمادي'], ['06', 'البنايات والتجهيز'], ['07', 'الحياة المدرسية والشراكة'], ['08', 'الصحة والسلامة'], ['09', 'مختلفات']];
  const PARTIES = ['الوزارة', 'الأكاديمية الجهوية للتربية والتكوين', 'المديرية الإقليمية', 'مصلحة الموارد البشرية', 'مصلحة الشؤون التربوية', 'مصلحة الشؤون القانونية والتواصل والشراكة', 'مصلحة التخطيط والخريطة المدرسية', 'مصلحة الشؤون الإدارية والمالية', 'السلطة المحلية', 'الجماعة', 'جمعية آباء وأمهات وأولياء التلاميذ'];

  // 1.9.4: the services of the directorate: every incoming / outgoing item is linked to a service (registers, filters and covers of the files per service)
  const SVC0 = ['المذكرات الوزارية', 'المذكرات الأكاديمية', 'الكتابة الخاصة', 'مصلحة تدبير الموارد البشرية', 'مصلحة الشؤون التربوية', 'مصلحة تأطير المؤسسات والتوجيه', 'مصلحة التخطيط والخريطة المدرسية', 'مصلحة الشؤون الإدارية والمالية', 'مصلحة البناءات والتجهيز والممتلكات', 'مصلحة الشراكة والشؤون القانونية والتواصل', 'المركز الإقليمي لمنظومة الإعلام', 'المركز الإقليمي للامتحانات'];
  const nA = t => nm(t).replace(/[إأآ]/g, 'ا').replace(/ة/g, 'ه').replace(/\s+/g, ' ');
  const svcGuess = x => {
    const S0 = ML().svcs, txt = nA([x.party, x.kind, x.subject].join(' '));
    const hit = S0.find(v => { const k = nA(v).replace(/^(مصلحه|المركز الاقليمي ل?|المذكرات)\s*/, ''); return k.length > 3 && txt.includes(k.split(' ').slice(0, 2).join(' ')); });
    if (hit) return hit;
    if (/وزاري/.test(x.kind)) return S0.find(v => /الوزارية/.test(v)) || '';
    if (/جهوي|اكاديمي/.test(nA(x.kind + ' ' + x.party))) return S0.find(v => /الأكاديمية/.test(v)) || '';
    if (/موارد البشري|موظف|رخص|تغيب/.test(txt)) return S0.find(v => /الموارد البشرية/.test(v)) || '';
    if (/امتحان|امتحانات/.test(txt)) return S0.find(v => /للامتحانات|للإمتحانات/.test(v)) || '';
    if (/مسار|منظومه|احصاء|الاعلام/.test(txt)) return S0.find(v => /الإعلام/.test(v)) || '';
    return '';
  };
  const svcOf = x => x.svc || '';
  function migrate(db) {
    const m = db.mail = db.mail && typeof db.mail === 'object' ? db.mail : {};
    m.items = Array.isArray(m.items) ? m.items : [];
    m.cats = Array.isArray(m.cats) && m.cats.length ? m.cats : CATS0.map(x => x.slice());
    m.svcs = Array.isArray(m.svcs) && m.svcs.length ? m.svcs : SVC0.slice();
    m.items.forEach(x => { x.id = x.id || uid('ml'); x.dir = x.dir === 'out' ? 'out' : 'in'; });
    m.dos = Array.isArray(m.dos) ? m.dos : [];
  }
  const ML = () => { migrate(DB); return DB.mail; };
  const yearOf = d => +(String(d || Dx.todayIso()).slice(0, 4)) || new Date().getFullYear();
  const nextNo = (dir, y) => ML().items.filter(x => x.dir === dir && +x.year === y).reduce((m, x) => Math.max(m, +x.no || 0), 0) + 1;
  const nextArch = cat => ML().items.filter(x => x.cat === cat).reduce((m, x) => Math.max(m, +(String(x.arch || '').split('/').pop()) || 0), 0) + 1;
  const regNo = x => (x.no ? `${x.no}/${x.year}` : '');
  const catName = c => (ML().cats.find(x => x[0] === c) || [c, ''])[1];
  const archNo = x => (x.cat ? `${x.cat}/${String(x.arch || '').split('/').pop() || '?'}` : '');
  const kb = n => (n > 1048576 ? (n / 1048576).toFixed(1) + ' م.ب' : Math.max(1, Math.round(n / 1024)) + ' ك.ب');

  /* ---------- the edit dialog ---------- */
  function edit(it, dir, done) {
    const isNew = !it;
    const y0 = yearOf(Dx.todayIso());
    const f = it ? JSON.parse(JSON.stringify(it)) : { id: uid('ml'), dir, year: y0, no: nextNo(dir, y0), regDate: Dx.todayIso(), kind: dir === 'in' ? KINDS_IN[0] : KINDS_OUT[0], party: dir === 'in' ? 'المديرية الإقليمية' : 'المديرية الإقليمية', ref: '', refDate: '', subject: '', cat: '', arch: '', box: '', action: '', notes: '', file: null };
    const body = document.createElement('div');
    const D = () => [
      { k: 'no', l: dir === 'in' ? 'رقم التسجيل (الورود)' : 'رقم الإرسال', t: 'num', half: true, hint: `تلقائي لكل سنة — السنة ${f.year}` },
      { k: 'regDate', l: dir === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال', t: 'date', half: true },
      { k: 'kind', l: 'النوع', half: true, list: dir === 'in' ? 'mlKindsIn' : 'mlKindsOut' },
      { k: 'party', l: dir === 'in' ? 'المصدر (الجهة المرسلة)' : 'المرسل إليه', half: true, list: 'mlParties' },
      { k: 'ref', l: dir === 'in' ? 'رقم المذكرة / المراسلة الأصلي' : 'المرجع', half: true, dir: 'ltr' },
      { k: 'refDate', l: 'تاريخها', t: 'date', half: true },
      { k: 'subject', l: 'الموضوع', t: 'area', rows: 2 },
      { k: 'svc', l: 'المصلحة المعنية (ملف المصلحة)', t: 'select', opts: [['', '— بدون —']].concat(ML().svcs.map(v => [v, v])), hint: 'تقترح تلقائيا من المصدر / النوع / الموضوع' },
      { sec: 'الأرشيف' },
      { k: 'cat', l: 'صنف الأرشيف', t: 'select', opts: [['', '— بدون تصنيف —']].concat(ML().cats.map(([c, n]) => [c, `${c} — ${n}`])), half: true },
      { k: 'arch', l: 'رقم الأرشيف داخل الصنف', half: true, hint: 'يُعطى تلقائيا عند اختيار الصنف' },
      { k: 'box', l: 'مكان الحفظ (الملف / الرف / الصندوق)', half: true },
      { k: 'action', l: dir === 'in' ? 'الإجراء / الإحالة (إلى من)' : 'المرفقات', half: true },
      { k: 'notes', l: 'ملاحظات', t: 'area', rows: 2 }];
    const draw = () => {
      K.form(box, D, f, k => { if (['party', 'kind', 'subject'].includes(k) && !f._svcSet) { const g = svcGuess(f); if (g && g !== f.svc) { f.svc = g; draw(); return; } } if (k === 'svc') f._svcSet = 1; if (k === 'regDate') { const y = yearOf(f.regDate); if (y !== +f.year) { f.year = y; if (isNew) f.no = nextNo(dir, y); draw(); } } if (k === 'cat') { f.arch = f.cat ? String(nextArch(f.cat)) : ''; draw(); } });
      fileBox();
    };
    const box = document.createElement('div');
    const fb = document.createElement('div');
    const fileBox = () => {
      fb.innerHTML = `<div class="sec-t" style="margin-top:8px">النسخة الممسوحة (اختياري)</div>
        <div class="btn-row" style="align-items:center">${f.file ? `<span class="tag" style="font-size:12.5px">📎 ${esc(f.file.name)} (${kb(f.file.size || 0)})</span><button type="button" class="btn sm" id="mlSave">${ic('down')} حفظ نسخة</button><button type="button" class="btn sm danger" id="mlDel">إزالة</button>` : ''}
          <button type="button" class="btn sm" id="mlAtt">${ic('up')} ${f.file ? 'تعويض الملف' : 'إرفاق ملف (PDF / صورة / Word)'}</button></div>
        <p class="muted" style="font-size:12px;margin:4px 0 0">يُحفظ الملف داخل معطيات البرنامج (15 م.ب كحد أقصى) ويُنقل مع النسخ الاحتياطية.</p>`;
      $('#mlAtt', fb).onclick = async () => { const r = await window.api.openAny('مذكرة / مراسلة'); if (!r) return; if (r.error) return toast('الملف كبير جدا (أكثر من 15 م.ب)', true); f.file = r; fileBox(); };
      if ($('#mlSave', fb)) $('#mlSave', fb).onclick = () => window.api.saveBin(f.file.b64, f.file.name);
      if ($('#mlDel', fb)) $('#mlDel', fb).onclick = () => { f.file = null; fileBox(); };
    };
    body.appendChild(box); body.appendChild(fb);
    body.insertAdjacentHTML('beforeend', `<datalist id="mlKindsIn">${KINDS_IN.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="mlKindsOut">${KINDS_OUT.map(x => `<option value="${esc(x)}">`).join('')}</datalist><datalist id="mlParties">${PARTIES.map(x => `<option value="${esc(x)}">`).join('')}</datalist>`);
    draw();
    modal({ title: (isNew ? 'تسجيل ' : 'تعديل ') + (dir === 'in' ? 'وارد' : 'صادر'), size: 'lg', body, actions: [
      { label: ic('check') + ' حفظ', cls: 'pri', onClick: () => {
        if (!nm(f.subject)) { toast('اكتب موضوع الوثيقة', true); return false; }
        f.no = +f.no || nextNo(dir, +f.year); f.year = yearOf(f.regDate); delete f._svcSet;
        if (ML().items.some(x => x.id !== f.id && x.dir === dir && +x.year === +f.year && +x.no === +f.no)) { toast(`الرقم ${f.no}/${f.year} مستعمل من قبل`, true); return false; }
        if (f.cat && !nm(f.arch)) f.arch = String(nextArch(f.cat));
        const i = ML().items.findIndex(x => x.id === f.id);
        if (i >= 0) ML().items[i] = f; else ML().items.push(f);
        persist(); toast('تم الحفظ'); done && done(); } },
      it ? { label: 'حذف', cls: 'danger', onClick: async () => { if (!await confirmBox('حذف هذا التسجيل نهائيا؟', 'حذف')) return false; ML().items = ML().items.filter(x => x.id !== f.id); persist(); done && done(); } } : null,
      { label: 'إلغاء' }].filter(Boolean) });
  }


  /* ---------- 1.9.4: the school files (الملفات المدرسية): request the file of an arriving pupil / send the file of a leaving pupil.
     DB.mail.dos = [{ id, type:'req'|'send', year, rno, date, mailId, dest, ddir, theirNo, theirDate, rows:[[name, code, reg, level, certNo, certDate, note]], done, doneDate, doneRef, inId, notes }]
     Every request / sending is also registered in the outgoing register (رقم الإرسال), the reception of a requested file in the incoming one. */
  const DOS_T = { req: { n: 'طلب ملف مدرسي', sh: 'طلب', subj: 'طلب وثائق مدرسية', c: '#1d6fd8', bg: '#e6f0fd', done: 'تم التوصل بالملف', wait: 'في انتظار الملف' },
    send: { n: 'إرسال ملف مدرسي', sh: 'إرسال', subj: 'إرسال وثائق مدرسية', c: '#1f8a4c', bg: '#e5f5ec', done: 'تم التوصل (إشعار)', wait: 'مرسل' } };
  const DOS_COLS = ['الاسم والنسب', 'الرقم الوطني (مسار)', 'ر. التسجيل', 'المستوى', 'شهادة المغادرة رقم', 'بتاريخ', 'ملاحظات إضافية'];
  const dosRows = f => (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
  const dosNextNo = (type, y) => ML().dos.filter(x => x.type === type && +x.year === +y).reduce((m, x) => Math.max(m, +x.rno || 0), 0) + 1;
  const dosMail = f => ML().items.find(x => x.id === f.mailId);
  const pad2 = n => (n ? String(n).padStart(2, '0') : '');
  const dosNo = f => { const it = dosMail(f); return it && it.no ? `${pad2(it.no)}/${it.year}` : ''; };
  const pupG = name => { const r = K.PP && K.PP.resolve ? K.PP.resolve('pupil', name) : null; return r && r.rec ? r.rec.g : ''; };
  const dosWord = rows => {
    const g = rows.map(r => pupG(r[0])), n = rows.length, F = g.filter(x => x === 'F').length, M = g.filter(x => x === 'M').length;
    if (n <= 1) return M ? 'التلميذ' : F ? 'التلميذة' : 'التلميذ(ة)';
    if (n === 2) return F === 2 ? 'التلميذتين' : 'التلميذين';
    return 'التلاميذ';
  };
  const dosNames = f => dosRows(f).map(r => nm(r[0])).filter(Boolean).join('، ');
  const ALL_DIRS = () => (window.Letter && Letter.REGIONS ? [].concat(...Object.values(Letter.REGIONS)) : []);
  // keeps the linked outgoing record (رقم الإرسال) in step with the request / sending
  function dosSync(f) {
    const y = yearOf(f.date), cat = ML().cats.some(c => c[0] === '03') ? '03' : '';
    const subject = `${DOS_T[f.type].subj}${dosNames(f) ? ' — ' + dosNames(f) : ''}`;
    let it = dosMail(f);
    if (!it) {
      it = { id: uid('ml'), dir: 'out', year: y, no: nextNo('out', y), regDate: f.date, kind: f.type === 'req' ? 'طلب' : 'ورقة إرسال', party: '', ref: '', refDate: '', subject: '', cat, arch: cat ? String(nextArch(cat)) : '', box: '', action: '', notes: '', file: null, svc: '' };
      ML().items.push(it); f.mailId = it.id;
    } else if (+it.year !== y) { it.year = y; it.no = nextNo('out', y); }
    Object.assign(it, { regDate: f.date, party: nm(f.dest) ? `مدير(ة) ${nm(f.dest)}` : 'مؤسسة تعليمية', subject, action: f.type === 'send' ? `الملفات المدرسية (${dosRows(f).length})` : '', ref: f.type === 'send' ? nm(f.theirNo) : '', refDate: f.type === 'send' ? (f.theirDate || '') : '', dos: f.id });
  }
  function dosEdit(x, type, done) {
    const isNew = !x, y0 = yearOf(Dx.todayIso());
    const f = x ? JSON.parse(JSON.stringify(x)) : { id: uid('ds'), type, year: y0, rno: dosNextNo(type, y0), date: Dx.todayIso(), dest: '', ddir: '', theirNo: '', theirDate: '', rows: [['', '', '', '', '', '', '']], done: false, doneDate: '', doneRef: '', notes: '' };
    const T = DOS_T[f.type];
    const used = new Set(ML().dos.filter(d => d.type === f.type && d.id !== f.id).reduce((a, d) => a.concat(dosRows(d).map(r => nm(r[1]).toUpperCase()).filter(Boolean)), []));
    const D = () => [
      { sec: f.type === 'req' ? 'الطلب' : 'الإرسال' },
      { k: 'rno', l: f.type === 'req' ? 'طلب رقم' : 'إرسال رقم', t: 'num', half: true, hint: `تسلسلي لكل سنة — السنة ${f.year}` },
      { k: 'date', l: 'التاريخ', t: 'date', half: true, hint: x && dosNo(x) ? `رقم الإرسال في سجل الصادرات: ${dosNo(x)}` : 'يُسجَّل تلقائيا في سجل الصادرات ويأخذ رقم الإرسال' },
      { sec: f.type === 'req' ? 'المؤسسة الأصلية (المطلوب منها الملف)' : 'المؤسسة المستقبلة (المرسل إليها الملف)' },
      { k: 'dest', l: 'إلى السيد(ة) مدير(ة)', half: true, ph: 'مجموعة مدارس ... / م.م ...', list: 'dsSch' },
      { k: 'ddir', l: 'المديرية الإقليمية للمؤسسة', half: true, list: 'dsDirs', ph: 'فارغ = نفس المديرية' },
      ...(f.type === 'send' ? [{ k: 'theirNo', l: 'طلبهم رقم (اختياري)', half: true, dir: 'ltr' }, { k: 'theirDate', l: 'بتاريخ', t: 'date', half: true }] : []),
      { sec: 'التلاميذ' },
      { k: 'rows', l: 'اكتب الاسم أو رقم مسار فتُملأ باقي الخانات من بطاقة التلاميذ', t: 'grid', cols: DOS_COLS, widths: ['1.5fr', '1fr', '.6fr', '.9fr', '.8fr', '.9fr', '1fr'], types: [null, null, null, null, null, 'date', null], list: ['k2Pupils', 'k2Codes', null, null, null, null, null], dirs: [null, 'ltr', 'ltr', null, 'ltr', null, null],
        link: { src: 'pupil', n: 0, cols: { code: 1, lvl: 3 }, post: (row, r) => { if (r.rec && r.rec.lvl) row[3] = K.LV.ar(r.rec.lvl); } },
        extraBtn: `<button type="button" class="btn sm" data-dsmv="1">${ic('plus')} ${f.type === 'req' ? 'إضافة الوافدين المسجلين في بطاقة التلاميذ' : 'إضافة المغادرين المسجلين في بطاقة التلاميذ'}</button>` },
      { k: 'notes', l: 'ملاحظات', t: 'area', rows: 2 }];
    const body = document.createElement('div'), box = document.createElement('div');
    body.appendChild(box);
    const schools = () => Array.from(new Set(ML().dos.map(d => nm(d.dest)).concat(window.Pupils && Pupils.movesOf ? Pupils.movesOf(MK.curSy()).map(m => nm(m.orig || m.recv)) : []).filter(Boolean)));
    const draw = K.form(box, D, f, k => { if (k === 'date') { const y = yearOf(f.date); if (y !== +f.year) { f.year = y; if (isNew) f.rno = dosNextNo(f.type, y); draw(); } } });
    const lists = () => `<datalist id="dsDirs">${ALL_DIRS().map(o => `<option value="${esc(o)}">`).join('')}</datalist><datalist id="dsSch">${schools().map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
    box.onDraw = () => box.insertAdjacentHTML('beforeend', lists()); box.onDraw();
    body.addEventListener('click', e => {
      if (!e.target.closest('[data-dsmv]')) return;
      const L = window.Pupils && Pupils.movesOf ? Pupils.movesOf(MK.curSy(), f.type === 'req' ? 'joined' : 'left') : [];
      const sch = m => nm(f.type === 'req' ? m.orig : m.recv);
      if (!L.length) return toast(f.type === 'req' ? 'لا يوجد وافدون مسجلون في بطاقة التلاميذ لهذا الموسم' : 'لا يوجد مغادرون مسجلون في بطاقة التلاميذ لهذا الموسم', true);
      const have = new Set(dosRows(f).map(r => nm(r[1]).toUpperCase()).filter(Boolean));
      let M = L.filter(m => !have.has(String(m.code || '').toUpperCase()) && !used.has(String(m.code || '').toUpperCase()));
      if (nm(f.dest)) { const k = nA(f.dest); const S2 = M.filter(m => sch(m) && (nA(sch(m)).includes(k) || k.includes(nA(sch(m))))); if (S2.length) M = S2; }
      else { const c = {}; M.forEach(m => { const v = sch(m); if (v) c[v] = (c[v] || 0) + 1; }); const top = Object.keys(c).sort((a, b) => c[b] - c[a])[0]; if (top) { f.dest = top; M = M.filter(m => sch(m) === top); } }
      if (!M.length) return toast('كل التلاميذ المسجلين أضيفوا من قبل (في هذا الطلب أو في طلب سابق)', true);
      f.rows = dosRows(f).concat(M.map(m => [`${m.last || ''} ${m.first || ''}`.trim(), m.code || '', '', K.LV.ar(m.lvl), '', '', '']));
      draw(); toast(`تمت إضافة ${M.length} تلميذ(ة)`);
    });
    modal({ title: `${isNew ? '' : 'تعديل '}${T.n}`, size: 'lg', body, actions: [
      { label: ic('check') + ' حفظ', cls: 'pri', onClick: () => {
        f.rows = dosRows(f);
        if (!f.rows.length) { toast('أضف تلميذا واحدا على الأقل', true); f.rows = [['', '', '', '', '', '', '']]; draw(); return false; }
        if (!nm(f.dest)) { toast('اكتب اسم المؤسسة', true); return false; }
        f.year = yearOf(f.date); f.rno = +f.rno || dosNextNo(f.type, f.year);
        if (ML().dos.some(d => d.id !== f.id && d.type === f.type && +d.year === +f.year && +d.rno === +f.rno)) { toast(`الرقم ${f.rno} مستعمل من قبل في هذه السنة`, true); return false; }
        dosSync(f);
        const i = ML().dos.findIndex(d => d.id === f.id); if (i >= 0) ML().dos[i] = f; else ML().dos.push(f);
        persist(); toast(`تم الحفظ — رقم الإرسال ${dosNo(f)}`); done && done(f); } },
      x ? { label: 'حذف', cls: 'danger', onClick: async () => { if (!await confirmBox('حذف هذا الملف وتسجيله في الصادرات (والواردات إن وجد)؟', 'حذف')) return false; ML().dos = ML().dos.filter(d => d.id !== f.id); ML().items = ML().items.filter(it => it.id !== f.mailId && it.id !== f.inId); persist(); done && done(); } } : null,
      { label: 'إلغاء' }].filter(Boolean) });
  }
  // the requested file arrived (registered in the incoming register) / the receiving school acknowledged the file sent
  function dosDone(x, done) {
    const T = DOS_T[x.type], f = { doneDate: x.doneDate || Dx.todayIso(), doneRef: x.doneRef || '', reg: x.type === 'req' && !x.inId ? '1' : '' };
    const body = document.createElement('div');
    K.form(body, () => [{ k: 'doneDate', l: x.type === 'req' ? 'تاريخ التوصل بالملف' : 'تاريخ الإشعار بالتوصل', t: 'date', half: true }, { k: 'doneRef', l: 'رقم إرساليتهم (اختياري)', half: true, dir: 'ltr' },
      ...(x.type === 'req' && !x.inId ? [{ k: 'reg', l: 'التسجيل في سجل الواردات', t: 'select', opts: [['1', 'نعم، يسجل تلقائيا كوارد'], ['', 'لا']] }] : [])], f);
    modal({ title: T.done, body, actions: [
      { label: ic('check') + ' تأكيد', cls: 'pri', onClick: () => {
        x.done = true; x.doneDate = f.doneDate; x.doneRef = f.doneRef;
        if (f.reg === '1') { const y = yearOf(f.doneDate), it = { id: uid('ml'), dir: 'in', year: y, no: nextNo('in', y), regDate: f.doneDate, kind: 'إرسالية', party: `مدير(ة) ${nm(x.dest)}`, ref: nm(f.doneRef), refDate: '', subject: `التوصل بالوثائق المدرسية — ${dosNames(x)}`, cat: ML().cats.some(c => c[0] === '03') ? '03' : '', arch: '', box: '', action: 'تضاف إلى ملفات التلاميذ', notes: '', file: null, svc: '', dos: x.id }; if (it.cat) it.arch = String(nextArch(it.cat)); ML().items.push(it); x.inId = it.id; }
        persist(); toast('تم'); done && done(); } },
      x.done ? { label: 'إلغاء الحالة', onClick: () => { x.done = false; x.doneDate = ''; persist(); done && done(); } } : null,
      { label: 'إغلاق' }].filter(Boolean) });
  }
  const dst = { type: '', stat: '' };
  function dosPage(v, years, seg, bindSeg) {
    const all = ML().dos;
    const L = all.filter(x => (!st.y || +x.year === +st.y) && (!dst.type || x.type === dst.type) && (!dst.stat || (dst.stat === 'done' ? x.done : !x.done))
      && (!st.q || [x.dest, x.ddir, dosNo(x), x.rno, x.notes].concat(dosRows(x).map(r => r.join(' '))).join(' ').toLowerCase().includes(st.q.toLowerCase())))
      .sort((a, b) => String(b.date).localeCompare(String(a.date)) || (+b.rno - +a.rno));
    const yy = all.filter(x => +x.year === +st.y), c = (t, d) => yy.filter(x => x.type === t && (d == null || !!x.done === d)).length;
    const tag = x => `<span class="ds-tag" style="--c:${DOS_T[x.type].c};--b:${DOS_T[x.type].bg}">${DOS_T[x.type].sh}</span>`;
    v.innerHTML = `<div class="page-h"><h1>الملفات المدرسية (طلب وإرسال)</h1><span class="sub">الضبط — شؤون التلاميذ</span><span class="sp"></span>
        <button class="btn pri" id="dsReq">${ic('plus')} طلب ملف مدرسي</button><button class="btn pri" id="dsSend" style="background:#1f8a4c;border-color:#1f8a4c">${ic('plus')} إرسال ملف مدرسي</button>
        <button class="btn" id="dsReg">${ic('print')} سجل الملفات المدرسية</button></div>
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="flex-wrap:wrap;align-items:center;gap:8px"><b>مراسلات الملفات والوثائق:</b>
        <button class="btn sm" id="dsL1">${ic('file')} طلب ملف ووثائق تلميذ(ة)</button><button class="btn sm" id="dsL2">${ic('file')} بعث ملف ووثائق تلميذ(ة)</button>
        <span class="muted" style="font-size:12px">مراسلة مستقلة لكل تلميذ(ة)، أو تلاميذ نفس المؤسسة في مراسلة واحدة.</span></div></div>
      ${seg}
      <div class="ds-kpi">
        <div style="--c:${DOS_T.req.c};--b:${DOS_T.req.bg}"><b>${c('req')}</b><span>طلبات الملفات (الوافدون)</span><i>${c('req', false)} في الانتظار — ${c('req', true)} توصلنا بها</i></div>
        <div style="--c:${DOS_T.send.c};--b:${DOS_T.send.bg}"><b>${c('send')}</b><span>ملفات مرسلة (المغادرون)</span><i>${c('send', true)} أشعرت بالتوصل</i></div>
        <div style="--c:#7a5af8;--b:#efebff"><b>${yy.reduce((t, x) => t + dosRows(x).length, 0)}</b><span>تلميذ(ة) معني(ة)</span><i>سنة ${esc(st.y)}</i></div></div>
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="flex-wrap:wrap;align-items:center;gap:8px">
        <select class="inp" id="mlY" style="width:auto">${years.map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
        <select class="inp" id="dsT" style="width:auto"><option value="">الطلبات والإرسالات</option><option value="req" ${dst.type === 'req' ? 'selected' : ''}>طلبات الملفات</option><option value="send" ${dst.type === 'send' ? 'selected' : ''}>الملفات المرسلة</option></select>
        <select class="inp" id="dsS" style="width:auto"><option value="">كل الحالات</option><option value="wait" ${dst.stat === 'wait' ? 'selected' : ''}>في الانتظار</option><option value="done" ${dst.stat === 'done' ? 'selected' : ''}>تم التوصل</option></select>
        <input class="inp" id="mlQ" placeholder="بحث: التلميذ، رقم مسار، المؤسسة..." value="${esc(st.q)}" style="max-width:300px"><span class="sp"></span><span class="muted">${L.length} ملف</span></div></div>
      <div class="card"><div id="mlT">${L.length ? `<table class="tbl"><thead><tr><th></th><th>الرقم</th><th>التاريخ</th><th>رقم الإرسال</th><th>المؤسسة</th><th>التلاميذ</th><th>الحالة</th><th></th></tr></thead><tbody>
        ${L.map(x => `<tr><td>${tag(x)}</td><td class="num b">${esc(String(x.rno || ''))}</td><td class="num">${esc(Dx.fmtDate(x.date))}</td><td class="num" dir="ltr">${esc(dosNo(x))}</td>
          <td>${esc(x.dest || '')}${x.ddir ? `<div class="muted" style="font-size:12px">مديرية ${esc(x.ddir)}</div>` : ''}</td>
          <td style="font-size:12.5px;line-height:1.7">${dosRows(x).map(r => `${esc(r[0])}${r[1] ? ` <span class="muted" dir="ltr">${esc(r[1])}</span>` : ''}`).join('<br>')}</td>
          <td>${x.done ? `<span class="tag" style="background:#e5f5ec;color:#1f7a45">${DOS_T[x.type].done}</span><div class="muted" style="font-size:11.5px">${esc(Dx.fmtDate(x.doneDate))}</div>` : `<button class="btn sm" data-dd="${x.id}">${x.type === 'req' ? 'في الانتظار — تسجيل التوصل' : 'مرسل — تسجيل الإشعار'}</button>`}</td>
          <td class="act"><button class="btn sm" data-dp="${x.id}" title="طبع المراسلة">${ic('print')}</button>${x.done ? `<button class="btn sm" data-dd="${x.id}" title="الحالة">✓</button>` : ''}<button class="btn sm" data-de="${x.id}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table>`
        : `<div class="empty-state">لا توجد طلبات أو إرسالات ملفات مدرسية في هذه السنة. استعمل «طلب ملف مدرسي» لتلميذ(ة) وافد(ة)، أو «إرسال ملف مدرسي» لتلميذ(ة) مغادر(ة).</div>`}</div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.8">كل طلب أو إرسال يسجل تلقائيا في سجل الصادرات (رقم الإرسال) وفي صنف «شؤون التلاميذ» بالأرشيف، والتوصل بالملف المطلوب يسجل في سجل الواردات. يمكن ملء التلاميذ من الوافدين أو المغادرين المسجلين في بطاقة التلاميذ.</p>`;
    bindSeg();
    const re = () => page(v);
    $('#mlY').onchange = e => { st.y = e.target.value; re(); };
    $('#dsT').onchange = e => { dst.type = e.target.value; re(); };
    $('#dsS').onchange = e => { dst.stat = e.target.value; re(); };
    $('#mlQ').oninput = e => { st.q = e.target.value; clearTimeout(page.t); page.t = setTimeout(() => { re(); const q = $('#mlQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); };
    $('#dsReq').onclick = () => dosEdit(null, 'req', f => { re(); if (f) go('mailDoc', { kind: 'dos', id: f.id }); });
    $('#dsSend').onclick = () => dosEdit(null, 'send', f => { re(); if (f) go('mailDoc', { kind: 'dos', id: f.id }); });
    $('#dsReg').onclick = () => go('mailDoc', { kind: 'dosreg', y: st.y });
    $('#dsL1').onclick = () => go('filesDoc', { kind: 'fl_preq' });
    $('#dsL2').onclick = () => go('filesDoc', { kind: 'fl_psend' });
    $$('[data-de]', v).forEach(b => b.onclick = () => dosEdit(all.find(x => x.id === b.dataset.de), null, re));
    $$('[data-dd]', v).forEach(b => b.onclick = () => dosDone(all.find(x => x.id === b.dataset.dd), re));
    $$('[data-dp]', v).forEach(b => b.onclick = () => go('mailDoc', { kind: 'dos', id: b.dataset.dp }));
  }
  // the letter, laid out as the model used by the schools (header, numbers, from / to, supervision, references, table, frame of the mail office)
  function dosLetter(s, x) {
    const T = DOS_T[x.type], rows = dosRows(x), w = dosWord(rows), date = Dx.fmtDate(x.date);
    const sup = window.Letter && Letter.supervision ? Letter.supervision(s, { ddir: x.ddir, supMode: 'auto' }) : [];
    const refs = rows.filter(r => nm(r[4])).map(r => `<tr><td class="k">المراجع:</td><td>شهادة المغادرة رقم: <b dir="ltr">${esc(nm(r[4]))}</b>${rows.length > 1 ? ` <span class="nm">(${esc(nm(r[0]))})</span>` : ''}</td><td>بتـــاريخ: <b>${esc(r[5] ? Dx.fmtDate(r[5]) : '')}</b></td></tr>`);
    if (x.type === 'send' && (nm(x.theirNo) || x.theirDate)) refs.unshift(`<tr><td class="k">المراجع:</td><td>طلبكم رقم: <b dir="ltr">${esc(nm(x.theirNo))}</b></td><td>بتـــاريخ: <b>${esc(x.theirDate ? Dx.fmtDate(x.theirDate) : '')}</b></td></tr>`);
    const refsH = refs.length ? `<table class="ds-refs">${refs.map((r, i) => i ? r.replace('<td class="k">المراجع:</td>', '<td class="k"></td>') : r).join('')}</table>` : '';
    const body = x.type === 'req' ? `وبعد، يشرفني أن أطلب منكم موافاتي بالوثائق المدرسية ${w === 'التلاميذ' ? 'للتلاميذ' : 'لل' + w.slice(2)} ${rows.length > 1 ? 'المبينة أسماؤهم' : 'المبين(ة) اسمه(ا)'} في الجدول أسفله:`
      : `وبعد، يشرفني أن أبعث إليكم رفقته بالوثائق المدرسية الخاصة ب${w} ${rows.length > 1 ? 'المبينة أسماؤهم' : 'المبين(ة) اسمه(ا)'} في الجدول أسفله${nm(x.theirNo) || x.theirDate ? '، وذلك جوابا على طلبكم المشار إليه في المرجع أعلاه' : ''}:`;
    const tRows = rows.map((r, i) => tr([i + 1, { t: r[0], c: 'b' }, { h: `<bdi dir="ltr">${esc(nm(r[2]))}</bdi>` }, r[3] || '', { h: `<bdi dir="ltr">${esc(nm(r[1]))}</bdi>` }, { t: r[6] || '', c: 'sm' }]));
    for (let i = rows.length; i < Math.max(3, rows.length + 1); i++) tRows.push(tr([i + 1, '', '', '', '', '']));
    const B = [
      { html: `<div class="ds-top"><div class="ds-n"><div>رقم الإرسال: <b dir="ltr">${esc(dosNo(x) || '........')}</b></div><div>بتاريخ: <b>${esc(date)}</b></div></div>
        <div class="ds-ft"><div><span class="l">من مدير(ة):</span><span class="bx">${esc(s.school || '')}</span></div><div><span class="l">إلى السيد(ة) مدير(ة):</span><span class="bx">${esc(x.dest || '')}</span></div></div>
        <div class="ds-d">${esc(s.city || '')} في: <b>${esc(date)}</b></div></div>` },
      { html: `<div class="ds-sup">${sup.map(t => `<div>${esc(t)}</div>`).join('')}</div>` },
      { html: `<div class="ds-rno"><span>${x.type === 'req' ? 'طلب' : 'إرسال'} رقم ${esc(String(x.rno || ''))}</span></div><div class="ds-subj"><span>الموضوع: ${esc(T.subj)}</span></div>`, keepNext: true },
      refsH ? { html: refsH } : null,
      { html: '<div class="ds-salam">سلام تام بوجود مولانا الإمام المؤيد بالله</div>' },
      { html: `<p class="ds-body">${body}</p>`, keepNext: true },
      { table: { cls: 'ds-t', head: thr(['ر.ت', 'الاسم والنسب', 'ر. التسجيل', 'المستوى', 'الرقم الوطني', 'ملاحظات إضافية']), rows: tRows } },
      { html: '<div class="ds-close">وتقبلوا فائق الاحترام والتقدير، والسلام.</div>' },
      { html: `<div class="ds-foot"><div class="ds-bo"><div class="h">إطار خاص بمكتب الضبط</div><div class="ln">تاريخ التوصل: ......................</div><div class="ln">رقم التسجيل بالواردات: ..............</div></div><div class="ds-sg">خاتم وتوقيع المدير(ة)</div></div>` }].filter(Boolean);
    return MK.flowPages({ page: 'a4', cls: 'ds', head: `<div class="mk-hdr">${Dx.header(s)}</div>`, blocks: B });
  }
  Dx.modCss += `
  .ds{font-size:11.4pt;line-height:1.7}
  .ds-top{display:grid;grid-template-columns:auto 1fr auto;gap:4mm;align-items:start;margin:0 0 2mm;font-weight:700}
  .ds-n div{white-space:nowrap}.ds-d{white-space:nowrap;font-size:11pt}
  .ds-ft div{display:flex;align-items:center;gap:2mm;margin-bottom:1.2mm}.ds-ft .l{white-space:nowrap}
  .ds-ft .bx{flex:1;border:.35mm solid #000;padding:.4mm 3mm;min-height:7mm;text-align:center;font-weight:700}
  .ds-sup{font-size:10.2pt;line-height:1.55;font-weight:600;margin:1mm 0 2mm}.ds-sup div{border-bottom:.2mm dotted #999;padding:.4mm 0}
  .ds-rno{margin:1mm 0}.ds-rno span{display:inline-block;border:.35mm solid #000;padding:.2mm 4mm;font-weight:700}
  .ds-subj{text-align:center;margin:2mm 0 3mm}.ds-subj span{display:inline-block;border:.45mm solid #000;padding:1mm 8mm;font-family:'MAJT','Amiri',serif;font-size:19pt;font-weight:700;line-height:1.3}
  .ds-refs{border-collapse:collapse;margin:0 0 1mm;width:100%}.ds-refs td{padding:.3mm 1.5mm;vertical-align:top}.ds-refs td.k{font-weight:700;width:18mm;white-space:nowrap}.ds-refs .nm{font-size:10pt;color:#333}
  .ds-salam{text-align:center;font-weight:700;margin:3mm 0 1.5mm;font-size:12.4pt}
  .ds-body{text-align:justify;margin:0 0 2.5mm;text-indent:8mm}
  .ds .tbl td,.ds .tbl th{height:8.5mm;font-size:11pt}.ds .tbl th{background:#e9edf5}
  .ds-close{text-align:center;margin:4mm 0 3mm;font-weight:700}
  .ds-foot{display:grid;grid-template-columns:1.15fr 1fr;gap:8mm;margin-top:2mm}
  .ds-bo{border:.35mm solid #000;min-height:34mm;padding:1.5mm 3mm}.ds-bo .h{font-weight:700;text-decoration:underline;margin-bottom:2mm}.ds-bo .ln{font-size:10.4pt;margin-top:1.5mm}
  .ds-sg{text-align:center;font-weight:700;text-decoration:underline;padding-top:8mm}
`;

  /* ---------- the page ---------- */
  const st = { dir: 'in', y: '', cat: '', q: '', kind: '', svc: '' };
  function page(v, arg) {
    if (arg && arg.dir) st.dir = arg.dir;
    const all = ML().items;
    const years = Array.from(new Set(all.map(x => +x.year).concat([yearOf()]))).sort((a, b) => b - a);
    if (!st.y) st.y = String(years[0]);
    const L = all.filter(x => (st.dir === 'arch' ? !!x.cat : x.dir === st.dir) && (st.dir === 'arch' || !st.y || +x.year === +st.y) && (!st.cat || x.cat === st.cat) && (!st.kind || x.kind === st.kind) && (!st.svc || (st.svc === '__none' ? !svcOf(x) : svcOf(x) === st.svc))
      && (!st.q || [x.subject, x.party, x.ref, x.kind, regNo(x), archNo(x), x.notes, x.box].join(' ').toLowerCase().includes(st.q.toLowerCase())))
      .sort((a, b) => st.dir === 'arch' ? String(a.cat).localeCompare(String(b.cat)) || (+String(a.arch).split('/').pop() || 0) - (+String(b.arch).split('/').pop() || 0) : (+b.year - +a.year) || (+b.no - +a.no));
    const cnt = d => all.filter(x => x.dir === d && +x.year === +st.y).length;
    const kinds = Array.from(new Set(all.filter(x => x.dir === st.dir).map(x => x.kind).filter(Boolean)));
    const seg = `<div class="seg" id="mlDir" style="margin-bottom:10px"><button data-d="in">الواردات (${cnt('in')})</button><button data-d="out">الصادرات (${cnt('out')})</button><button data-d="arch">الأرشيف المصنف (${all.filter(x => x.cat).length})</button><button data-d="svc">حسب المصالح</button><button data-d="dos">الملفات المدرسية (${ML().dos.filter(x => +x.year === +st.y).length})</button></div>`;
    const bindSeg = () => $$('#mlDir button').forEach(b => { b.classList.toggle('on', b.dataset.d === st.dir); b.onclick = () => { st.kind = ''; if ((b.dataset.d === 'dos') !== (st.dir === 'dos')) return go('mail', { dir: b.dataset.d }); st.dir = b.dataset.d; page(v); }; });
    if (st.dir === 'dos') return dosPage(v, years, seg, bindSeg);
    v.innerHTML = `<div class="page-h"><h1>الواردات والصادرات والأرشيف</h1><span class="sub">الضبط</span><span class="sp"></span>
        ${st.dir !== 'arch' && st.dir !== 'svc' ? `<button class="btn pri" id="mlNew">${ic('plus')} ${st.dir === 'in' ? 'تسجيل وارد (مذكرة / مراسلة)' : 'تسجيل صادر'}</button>` : ''}
        <button class="btn" id="mlPrint">${ic('print')} ${st.dir === 'in' ? 'سجل الواردات' : st.dir === 'out' ? 'سجل الصادرات' : 'فهرس الأرشيف'}</button>
        <button class="btn" id="mlCov" title="واجهات ملفات الواردات والصادرات لكل مصلحة">${ic('file')} واجهات ملفات المصالح</button>
        <button class="btn" id="mlSv">${ic('gear')} المصالح</button><button class="btn" id="mlCats">${ic('gear')} أصناف الأرشيف</button></div>
      ${seg}
      <div class="card" style="margin-bottom:10px"><div class="card-b btn-row" style="flex-wrap:wrap;align-items:center;gap:8px">
        ${st.dir !== 'arch' ? `<select class="inp" id="mlY" style="width:auto">${years.map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select>` : ''}
        <select class="inp" id="mlS" style="width:auto"><option value="">كل المصالح</option>${ML().svcs.map(v => `<option ${st.svc === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}<option value="__none" ${st.svc === '__none' ? 'selected' : ''}>بدون مصلحة</option></select>
        <select class="inp" id="mlC" style="width:auto"><option value="">كل الأصناف</option>${ML().cats.map(([c, n]) => `<option value="${esc(c)}" ${st.cat === c ? 'selected' : ''}>${esc(c)} — ${esc(n)}</option>`).join('')}</select>
        ${st.dir !== 'arch' && kinds.length ? `<select class="inp" id="mlK" style="width:auto"><option value="">كل الأنواع</option>${kinds.map(k => `<option ${st.kind === k ? 'selected' : ''}>${esc(k)}</option>`).join('')}</select>` : ''}
        <input class="inp" id="mlQ" placeholder="بحث: الموضوع، الرقم، المرجع، الجهة..." value="${esc(st.q)}" style="max-width:300px"><span class="sp"></span><span class="muted">${L.length} وثيقة</span></div></div>
      <div class="card"><div id="mlT"></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px;line-height:1.8">رقم التسجيل يُعطى تلقائيا لكل سنة (مثلا <b dir="ltr">12/2026</b>)، وكذلك رقم الأرشيف داخل كل صنف (مثلا <b dir="ltr">02/7</b>). يمكن إرفاق النسخة الممسوحة لكل مذكرة أو مراسلة والرجوع إليها أو حفظ نسخة منها في أي وقت.</p>`;
    if (st.dir === 'svc') {
      const yy = all.filter(x => +x.year === +st.y), row = v => { const X = yy.filter(x => (v === '' ? !svcOf(x) : svcOf(x) === v)); return [X.filter(x => x.dir === 'in').length, X.filter(x => x.dir === 'out').length]; };
      $('#mlT').innerHTML = `<table class="tbl"><thead><tr><th>المصلحة</th><th>الواردات</th><th>الصادرات</th><th>المجموع</th><th></th></tr></thead><tbody>${ML().svcs.concat(['']).map(v => { const [a, b] = row(v); return v === '' && !a && !b ? '' : `<tr><td class="b">${esc(v || 'بدون مصلحة')}</td><td class="num">${a}</td><td class="num">${b}</td><td class="num b">${a + b}</td><td class="act"><button class="btn sm" data-sv="${esc(v || '__none')}" data-sd="in">الواردات</button><button class="btn sm" data-sv="${esc(v || '__none')}" data-sd="out">الصادرات</button><button class="btn sm" data-sp="${esc(v || '__none')}">${ic('print')}</button></td></tr>`; }).join('')}</tbody></table>`;
      $$('[data-sv]', v).forEach(b => b.onclick = () => { st.svc = b.dataset.sv; st.dir = b.dataset.sd; page(v); });
      $$('[data-sp]', v).forEach(b => b.onclick = () => go('mailDoc', { kind: 'in', y: st.y, svc: b.dataset.sp }));
    } else
    $('#mlT').innerHTML = L.length ? `<table class="tbl"><thead><tr>${st.dir === 'arch' ? '<th>رقم الأرشيف</th><th>الصنف</th><th>وارد/صادر</th>' : `<th>${st.dir === 'in' ? 'رقم التسجيل' : 'رقم الإرسال'}</th><th>${st.dir === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال'}</th>`}<th>النوع</th><th>${st.dir === 'out' ? 'المرسل إليه' : 'المصدر'}</th><th>المرجع</th><th>الموضوع</th>${st.dir === 'arch' ? '<th>مكان الحفظ</th>' : '<th>الأرشيف</th>'}<th></th></tr></thead><tbody>
      ${L.map(x => `<tr data-id="${x.id}">${st.dir === 'arch' ? `<td class="num b" dir="ltr">${esc(archNo(x))}</td><td>${esc(catName(x.cat))}</td><td>${x.dir === 'in' ? 'وارد ' : 'صادر '}<span class="muted" dir="ltr">${esc(regNo(x))}</span></td>` : `<td class="num b" dir="ltr">${esc(regNo(x))}</td><td class="num">${esc(Dx.fmtDate(x.regDate))}</td>`}
        <td>${esc(x.kind || '')}</td><td>${esc(x.party || '')}</td><td dir="ltr" style="text-align:right">${esc(x.ref || '')}${x.refDate ? `<br><span class="muted">${esc(Dx.fmtDate(x.refDate))}</span>` : ''}</td><td>${esc(x.subject || '')}</td>
        <td>${st.dir === 'arch' ? esc(x.box || '') : x.cat ? `<span class="tag" dir="ltr">${esc(archNo(x))}</span>` : '<span class="muted">—</span>'}</td>
        <td class="act">${x.file ? `<button class="btn sm" data-f="${x.id}" title="${esc(x.file.name)}">📎</button>` : ''}<button class="btn sm" data-s="${x.id}" title="بطاقة إحالة">${ic('print')}</button><button class="btn sm" data-e="${x.id}">${ic('edit')}</button></td></tr>`).join('')}</tbody></table>`
      : `<div class="empty-state">${st.dir === 'arch' ? 'لا توجد وثائق مصنفة في الأرشيف بعد (اختر صنفا عند تسجيل وارد أو صادر).' : 'لا توجد تسجيلات في هذه السنة.'}</div>`;
    bindSeg();
    if ($('#mlY')) $('#mlY').onchange = e => { st.y = e.target.value; page(v); };
    $('#mlC').onchange = e => { st.cat = e.target.value; page(v); };
    $('#mlS').onchange = e => { st.svc = e.target.value; page(v); };
    $('#mlSv').onclick = () => svcs(() => page(v));
    $('#mlCov').onclick = () => go('mailDoc', { kind: 'covers' });
    if ($('#mlK')) $('#mlK').onchange = e => { st.kind = e.target.value; page(v); };
    $('#mlQ').oninput = e => { st.q = e.target.value; clearTimeout(page.t); page.t = setTimeout(() => { page(v); const q = $('#mlQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 250); };
    if ($('#mlNew')) $('#mlNew').onclick = () => edit(null, st.dir, () => page(v));
    $$('[data-e]', v).forEach(b => b.onclick = () => { const x = all.find(i => i.id === b.dataset.e); edit(x, x.dir, () => page(v)); });
    $$('[data-f]', v).forEach(b => b.onclick = () => { const x = all.find(i => i.id === b.dataset.f); if (x && x.file) window.api.saveBin(x.file.b64, x.file.name); });
    $$('[data-s]', v).forEach(b => b.onclick = () => go('mailDoc', { kind: 'slip', id: b.dataset.s }));
    $('#mlPrint').onclick = () => go('mailDoc', { kind: st.dir === 'arch' ? 'arch' : st.dir === 'svc' ? 'in' : st.dir, y: st.y, cat: st.cat, svc: st.svc });
    $('#mlCats').onclick = () => cats(() => page(v));
  }
  function svcs(done) {
    const body = document.createElement('div');
    body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.8">المصالح التي تربط بها الواردات والصادرات (سطر لكل مصلحة). عند تسجيل وارد أو صادر يقترح البرنامج المصلحة تلقائيا. زر «ربط تلقائي» يربط التسجيلات القديمة التي ليس لها مصلحة.</p><textarea class="inp" rows="14" id="svT">${esc(ML().svcs.join('\n'))}</textarea>`;
    modal({ title: 'المصالح', body, actions: [{ label: ic('check') + ' حفظ', cls: 'pri', onClick: () => { const L = $('#svT', body).value.split(/\n/).map(nm).filter(Boolean); if (!L.length) { toast('اكتب مصلحة واحدة على الأقل', true); return false; } ML().svcs = Array.from(new Set(L)); persist(); done && done(); } },
      { label: 'ربط تلقائي للتسجيلات بدون مصلحة', onClick: () => { let n = 0; ML().items.forEach(x => { if (!x.svc) { const g = svcGuess(x); if (g) { x.svc = g; n++; } } }); persist(); toast(`تم ربط ${n} تسجيلا بمصالحها`); done && done(); } }, { label: 'إلغاء' }] });
  }
  function cats(done) {
    const L = ML().cats.map(x => x.slice());
    const body = document.createElement('div');
    const draw = () => {
      body.innerHTML = `<p class="muted" style="margin-top:0;font-size:12.5px">رمز الصنف يسبق رقم الأرشيف (مثلا 02/7). يمكنك تعديل الأصناف أو إضافة أصناف جديدة.</p>
        ${L.map((c, i) => `<div style="display:grid;grid-template-columns:80px 1fr 34px;gap:6px;margin-bottom:5px"><input class="inp" data-c="${i}" value="${esc(c[0])}" dir="ltr"><input class="inp" data-n="${i}" value="${esc(c[1])}"><button class="btn sm danger icon" data-x="${i}">✕</button></div>`).join('')}
        <button class="btn sm" id="mcAdd">${ic('plus')} صنف جديد</button>`;
      $$('[data-c]', body).forEach(el => el.oninput = () => { L[+el.dataset.c][0] = el.value.trim(); });
      $$('[data-n]', body).forEach(el => el.oninput = () => { L[+el.dataset.n][1] = el.value.trim(); });
      $$('[data-x]', body).forEach(b => b.onclick = () => { if (ML().items.some(x => x.cat === L[+b.dataset.x][0])) return toast('صنف مستعمل في الأرشيف: لا يمكن حذفه', true); L.splice(+b.dataset.x, 1); draw(); });
      $('#mcAdd', body).onclick = () => { L.push([String(L.length + 1).padStart(2, '0'), '']); draw(); };
    };
    draw();
    modal({ title: 'أصناف الأرشيف', body, actions: [{ label: ic('check') + ' حفظ', cls: 'pri', onClick: () => { ML().cats = L.filter(c => c[0] && c[1]); persist(); done && done(); } }, { label: 'إلغاء' }] });
  }

  /* ---------- printed registers ---------- */
  function docPage(v, arg) {
    arg = arg || {};
    const kind = arg.kind || 'in';
    const it = ML().items.find(x => x.id === arg.id);
    const titles = { in: 'سجل الواردات', out: 'سجل الصادرات', arch: 'فهرس الأرشيف', slip: 'بطاقة إحالة / تأشير', covers: 'واجهات ملفات المصالح', dos: 'مراسلة الملف المدرسي', dosreg: 'سجل الملفات المدرسية' };
    const dx = ML().dos.find(x => x.id === arg.id);
    if (kind === 'dos' && dx) titles.dos = `${DOS_T[dx.type].n} رقم ${dx.rno}`;
    MK.docPage(v, {
      title: titles[kind], icon: '🗄️', modes: false, flow: true, state: { y: arg.y || String(yearOf()), cat: arg.cat || '', svc: arg.svc || '', to: '', note: '', cdir: 'both', per: '4', sel: '' },
      back: () => go('mail', { dir: kind === 'slip' ? (it ? it.dir : 'in') : kind === 'covers' ? 'svc' : /^dos/.test(kind) ? 'dos' : kind }),
      fname: st => `${titles[kind]}_${st.y || ''}`,
      form: (box, st, refresh) => {
        const years = Array.from(new Set(ML().items.map(x => +x.year).concat([yearOf()]))).sort((a, b) => b - a);
        if (kind === 'dos') {
          box.innerHTML = dx ? `<div class="btn-row"><button type="button" class="btn" id="mdE">${ic('edit')} تعديل المعطيات</button></div><p class="muted" style="font-size:12px;line-height:1.7">رقم الإرسال <b dir="ltr">${esc(dosNo(dx))}</b> مسجل في سجل الصادرات.</p>` : '<p class="muted">هذا الملف غير موجود.</p>';
          if ($('#mdE', box)) $('#mdE', box).onclick = () => dosEdit(dx, null, () => go('mailDoc', { kind: 'dos', id: dx.id }));
          refresh(); return;
        }
        if (kind === 'dosreg') {
          box.innerHTML = `<div class="fld"><label>السنة</label><select class="inp" id="mdY">${Array.from(new Set(ML().dos.map(x => +x.year).concat([yearOf()]))).sort((a, b) => b - a).map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>
            <div class="fld"><label>النوع</label><select class="inp" id="mdT"><option value="">الطلبات والإرسالات</option><option value="req" ${st.cat === 'req' ? 'selected' : ''}>طلبات الملفات (الوافدون)</option><option value="send" ${st.cat === 'send' ? 'selected' : ''}>الملفات المرسلة (المغادرون)</option></select></div>`;
          $('#mdY', box).onchange = e => { st.y = e.target.value; refresh(); };
          $('#mdT', box).onchange = e => { st.cat = e.target.value; refresh(); };
          refresh(); return;
        }
        if (kind === 'covers') {
          box.innerHTML = `<div class="fld"><label>الملفات</label><select class="inp" id="mdD"><option value="both" ${st.cdir === 'both' ? 'selected' : ''}>الصادرات والواردات</option><option value="in" ${st.cdir === 'in' ? 'selected' : ''}>الواردات فقط</option><option value="out" ${st.cdir === 'out' ? 'selected' : ''}>الصادرات فقط</option></select></div>
            <div class="fld"><label>عدد الواجهات في الصفحة</label><select class="inp" id="mdP">${['1', '2', '3', '4', '5'].map(n => `<option ${st.per === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div>
            <div class="fld"><label>المصلحة</label><select class="inp" id="mdS"><option value="">كل المصالح</option>${ML().svcs.map(v => `<option ${st.sel === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}</select></div>
            <p class="muted" style="font-size:12px;line-height:1.7">واجهة (ملصق) لكل ملف: اسم المصلحة بخط كبير، ثم «صادرات / واردات الموسم الدراسي». تعدل لائحة المصالح من زر «المصالح».</p>`;
          $('#mdD', box).onchange = e => { st.cdir = e.target.value; refresh(); };
          $('#mdP', box).onchange = e => { st.per = e.target.value; refresh(); };
          $('#mdS', box).onchange = e => { st.sel = e.target.value; refresh(); };
          refresh(); return;
        }
        box.innerHTML = kind === 'slip' ? `<div class="fld"><label>يحال إلى</label><input class="inp" id="mdTo" list="k2Emps"></div><div class="fld"><label>التأشيرة / التعليمات</label><textarea class="inp" id="mdN" rows="3"></textarea></div>${K.dl ? K.dl('k2Emps', K.E.names()) : ''}`
          : `${kind !== 'arch' ? `<div class="fld"><label>السنة</label><select class="inp" id="mdY">${years.map(y => `<option ${+st.y === y ? 'selected' : ''}>${y}</option>`).join('')}</select></div>` : ''}
            ${kind !== 'arch' ? `<div class="fld"><label>المصلحة</label><select class="inp" id="mdS"><option value="">كل المصالح</option>${ML().svcs.map(v => `<option ${st.svc === v ? 'selected' : ''}>${esc(v)}</option>`).join('')}<option value="__none" ${st.svc === '__none' ? 'selected' : ''}>بدون مصلحة</option></select></div>` : ''}
            <div class="fld"><label>الصنف</label><select class="inp" id="mdC"><option value="">كل الأصناف</option>${ML().cats.map(([c, n]) => `<option value="${esc(c)}" ${st.cat === c ? 'selected' : ''}>${esc(c)} — ${esc(n)}</option>`).join('')}</select></div>`;
        if ($('#mdY', box)) $('#mdY', box).onchange = e => { st.y = e.target.value; refresh(); };
        if ($('#mdC', box)) $('#mdC', box).onchange = e => { st.cat = e.target.value; refresh(); };
        if ($('#mdS', box)) $('#mdS', box).onchange = e => { st.svc = e.target.value; refresh(); };
        if ($('#mdTo', box)) $('#mdTo', box).oninput = e => { st.to = e.target.value; refresh(); };
        if ($('#mdN', box)) $('#mdN', box).oninput = e => { st.note = e.target.value; refresh(); };
        refresh();
      },
      build: st => {
        const s = S();
        if (kind === 'dos') return { page: 'a4', pages: dx ? dosLetter(s, dx) : [] };
        if (kind === 'dosreg') {
          const L = ML().dos.filter(x => +x.year === +st.y && (!st.cat || x.type === st.cat)).sort((a, b) => String(a.date).localeCompare(String(b.date)) || a.type.localeCompare(b.type) || (+a.rno - +b.rno));
          const rows = [];
          L.forEach(x => { const R = dosRows(x); R.forEach((r, j) => rows.push(tr((j ? [] : [{ t: DOS_T[x.type].sh, c: 'b', r: R.length }, { t: String(x.rno || ''), r: R.length }, { h: `<bdi dir="ltr">${esc(dosNo(x))}</bdi>`, r: R.length }, { t: ldate(x.date), c: 'sm', r: R.length }, { t: x.dest || '', c: 'sm', r: R.length }]).concat([{ t: r[0], c: 'r' }, { h: `<bdi dir="ltr">${esc(nm(r[1]))}</bdi>`, c: 'sm' }, { t: r[3] || '', c: 'sm' }, { t: nm(r[4]) ? `${nm(r[4])}${r[5] ? ' — ' + Dx.fmtDate(r[5]) : ''}` : '', c: 'sm' }])
            .concat(j ? [] : [{ t: x.done ? `${DOS_T[x.type].done} ${Dx.fmtDate(x.doneDate)}` : DOS_T[x.type].wait, c: 'sm', r: R.length }])))); });
          for (let i = rows.length; i < 10; i++) rows.push(tr(Array.from({ length: 10 }, (_, j) => (j === 9 ? { t: '', st: 'height:7mm' } : ''))));
          const head = thr(['النوع', 'الرقم', 'رقم الإرسال', 'التاريخ', 'المؤسسة', 'التلميذ(ة)', 'الرقم الوطني', 'المستوى', 'شهادة المغادرة', 'الحالة'].map(t => ({ t, c: 'd' })));
          return { page: 'a4l', pages: SB.pages(s, { title: `سجل الملفات المدرسية (طلب وإرسال) — سنة ${st.y}${st.cat ? ' — ' + (st.cat === 'req' ? 'طلبات الملفات' : 'الملفات المرسلة') : ''}`, page: 'a4l', blocks: [tbl(head, rows, 'cmp')], sign: SB.sign(s, { left: 'توقيع وطابع مدير(ة) المؤسسة' }) }) };
        }
        if (kind === 'covers') {
          const sy = MK.curSy(), syT = MK.syDash(sy).replace('-', '/'), V = st.sel ? [st.sel] : ML().svcs, dirs = st.cdir === 'both' ? ['out', 'in'] : [st.cdir];
          const items = []; V.forEach(v => dirs.forEach(d => items.push([v, d])));
          const per = Math.max(1, +st.per || 4), pages = [];
          for (let i = 0; i < items.length; i += per) pages.push(`<div class="ml-covs" style="--n:${per}">${items.slice(i, i + per).map(([v, d]) => `<div class="ml-cov"><div class="n" style="font-size:${Math.min(60, Math.max(24, 200 / per + 14 - Math.max(0, v.length - 18) * (6 / per)))}pt">${esc(v)}</div><div class="d">${d === 'out' ? 'صادرات' : 'واردات'} الموسم الدراسي ${esc(syT)}</div><div class="s">${esc(s.school || '')}</div></div>`).join('')}</div>`);
          return { page: 'a4', pages };
        }
        if (kind === 'slip') {
          const x = it || {};
          return { page: 'a4', pages: MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'بطاقة إحالة / تأشير'), blocks: [
            { table: { cls: 'sb-t kv cmp', head: '', colgroup: '<colgroup><col style="width:28%"><col style="width:72%"></colgroup>', rows: [
              ['رقم التسجيل', `<bdi dir="ltr">${esc(regNo(x))}</bdi>`], [x.dir === 'out' ? 'تاريخ الإرسال' : 'تاريخ الورود', esc(Dx.fmtDate(x.regDate))], ['النوع', esc(x.kind || '')], [x.dir === 'out' ? 'المرسل إليه' : 'المصدر', esc(x.party || '')],
              ['المرجع', `<bdi dir="ltr">${esc(x.ref || '')}</bdi> ${x.refDate ? esc(Dx.fmtDate(x.refDate)) : ''}`], ['الموضوع', `<b>${esc(x.subject || '')}</b>`], ['رقم الأرشيف', `<bdi dir="ltr">${esc(archNo(x))}</bdi> ${x.cat ? esc(catName(x.cat)) : ''}`],
              ['يحال إلى', esc(st.to || x.action || '')], ['التأشيرة / التعليمات', `${esc(st.note || '')}<div style="height:26mm"></div>`]].map(([a, b]) => tr([{ t: a, c: 'k' }, { h: b }])) } },
            SB.sign(s, { right: '<span class="d">توقيع المعني(ة) بالتسلم</span>', left: 'تأشيرة مدير(ة) المؤسسة' })] }) };
        }
        const L = ML().items.filter(x => (kind === 'arch' ? !!x.cat : x.dir === kind && +x.year === +st.y) && (!st.cat || x.cat === st.cat) && (kind === 'arch' || !st.svc || (st.svc === '__none' ? !svcOf(x) : svcOf(x) === st.svc)))
          .sort((a, b) => kind === 'arch' ? String(a.cat).localeCompare(String(b.cat)) || (+String(a.arch).split('/').pop() || 0) - (+String(b.arch).split('/').pop() || 0) : (+a.no - +b.no));
        let head, rows;
        if (kind === 'arch') {
          head = thr(['رقم الأرشيف', 'الصنف', 'وارد / صادر', 'التاريخ', 'الجهة', 'المرجع', 'الموضوع', 'مكان الحفظ'].map(t => ({ t, c: 'd' })));
          rows = L.map(x => tr([{ h: `<bdi dir="ltr">${esc(archNo(x))}</bdi>`, c: 'b' }, { t: catName(x.cat), c: 'sm' }, { h: `${x.dir === 'in' ? 'وارد' : 'صادر'} <bdi dir="ltr">${esc(regNo(x))}</bdi>`, c: 'sm' }, { t: ldate(x.regDate), c: 'sm' }, { t: x.party || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(x.ref || '')}</bdi>`, c: 'sm' }, { t: x.subject || '', c: 'r' }, { t: x.box || '', c: 'sm' }]));
        } else {
          head = thr([kind === 'in' ? 'رقم التسجيل' : 'رقم الإرسال', kind === 'in' ? 'تاريخ الورود' : 'تاريخ الإرسال', 'النوع', kind === 'in' ? 'المصدر' : 'المرسل إليه', 'المرجع وتاريخه', 'الموضوع', kind === 'in' ? 'الإحالة / الإجراء' : 'المرفقات', 'رقم الأرشيف'].map(t => ({ t, c: 'd' })));
          rows = L.map(x => tr([{ h: `<bdi dir="ltr">${esc(regNo(x))}</bdi>`, c: 'b' }, { t: ldate(x.regDate), c: 'sm' }, { t: x.kind || '', c: 'sm' }, { t: x.party || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(x.ref || '')}</bdi>${x.refDate ? ' — ' + esc(ldate(x.refDate)) : ''}`, c: 'sm' }, { t: x.subject || '', c: 'r' }, { t: x.action || '', c: 'sm' }, { h: `<bdi dir="ltr">${esc(archNo(x))}</bdi>`, c: 'sm' }]));
        }
        for (let i = rows.length; i < 10; i++) rows.push(tr(Array.from({ length: 8 }, (_, j) => (j === 7 ? { t: '', st: 'height:7mm' } : ''))));
        const t = kind === 'arch' ? `فهرس الأرشيف${st.cat ? ' — ' + st.cat + ' ' + catName(st.cat) : ''}` : `${titles[kind]} — سنة ${st.y}${st.cat ? ' — ' + catName(st.cat) : ''}${kind !== 'arch' && st.svc && st.svc !== '__none' ? ' — ' + st.svc : ''}`;
        return { page: 'a4l', pages: SB.pages(s, { title: t, page: 'a4l', blocks: [tbl(head, rows, 'cmp')], sign: SB.sign(s, { left: 'توقيع وطابع مدير(ة) المؤسسة' }) }) };
      }
    });
  }

  Dx.modCss += `.ml-covs{display:flex;flex-direction:column;height:100%;gap:2mm;margin:-4mm -4mm}.ml-cov{flex:1;border:2px solid #000;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2mm 4mm;overflow:hidden}
  .ml-cov .n{font-family:'MAJT','Amiri',serif;font-weight:700;line-height:1.15}.ml-cov .d{font-size:13pt;font-weight:700;margin-top:1.5mm}.ml-cov .s{font-size:9.5pt;color:#555;margin-top:.5mm}`;
  { const c = document.createElement('style'); c.textContent = `
  .ds-tag{display:inline-block;padding:1px 9px;border-radius:20px;font-weight:700;font-size:12px;color:var(--c);background:var(--b);border:1px solid var(--c)}
  .ds-kpi{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin-bottom:10px}
  .ds-kpi>div{border-radius:10px;padding:10px 14px;background:var(--b);border-inline-start:5px solid var(--c);display:flex;flex-direction:column}
  .ds-kpi b{font-size:24px;color:var(--c);line-height:1.1}.ds-kpi span{font-weight:700}.ds-kpi i{font-style:normal;font-size:12px;color:#555}`; document.head.appendChild(c); }
  window.Mail = { migrate, svcGuess, items: () => ML().items, regNo, archNo, dos: () => ML().dos, dosNo };
  window.pageMail = (v, a) => { migrate(DB); if (!(a && a.dir) && st.dir === 'dos') st.dir = 'in'; page(v, a); };
  window.pageMailDoc = (v, a) => { migrate(DB); docPage(v, a); };
})();
