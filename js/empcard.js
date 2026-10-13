'use strict';
/* 1.9.2 — صور الموظفين + البطاقة الشخصية للأستاذ(ة) (نموذج: معلومات شخصية، إدارية، مهنية، الشواهد الدراسية، الخدمات السابقة).
   The photo is stored on the employee (`photo`, a small JPEG data URL); the card is printed one per page. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;

  /* ---- photo helper: pick an image, crop to 3:4 and shrink (keeps data.json small) ---- */
  function fitPhoto(dataUrl, W = 270, H = 360) {
    return new Promise(res => {
      const im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = W; c.height = H;
        const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H);
        const r = Math.max(W / im.width, H / im.height), w = im.width * r, h = im.height * r;
        g.drawImage(im, (W - w) / 2, (H - h) * 0.3, w, h);   // keep the upper part (faces)
        res(c.toDataURL('image/jpeg', 0.86));
      };
      im.onerror = () => res(null);
      im.src = dataUrl;
    });
  }
  async function pickPhoto() {
    const d = await window.api.openImage();
    if (!d) return null;
    const p = await fitPhoto(d);
    if (!p) toast('تعذرت قراءة الصورة', true);
    return p;
  }
  const initials = e => ((e.firstAr || e.firstFr || '').trim()[0] || '') + ((e.lastAr || e.lastFr || '').trim()[0] || '');

  /* ---- the card ---- */
  const CSS = `
  .ec{font-family:'MAJ','Amiri',serif;font-size:11.5pt;line-height:1.55;height:100%;box-sizing:border-box;border:1.6px solid #000;padding:2.5mm 3mm;display:flex;flex-direction:column;position:relative}
  .ec table{border-collapse:collapse;width:100%}
  .ec-h{display:grid;grid-template-columns:1fr 1.05fr 1fr;border:1.4px solid #000;border-radius:2mm;margin-bottom:2mm}
  .ec-h>div{padding:1.5mm 2.5mm;font-size:10.5pt;line-height:1.55}.ec-h>div+div{border-inline-start:1.4px solid #000}
  .ec-h .c{text-align:center}.ec-h .c img{height:15mm;display:block;margin:0 auto 1mm}
  .ec-h .t{font-family:'MAJT','Amiri',serif;font-weight:700;font-size:14.5pt;line-height:1.4}
  .ec-s{font-family:'MAJT','Amiri',serif;font-weight:700;font-size:12.5pt;border-top:1.4px solid #000;border-bottom:1.4px solid #000;padding:0 1mm;margin:1.5mm 0 1mm;text-decoration:underline;text-underline-offset:1mm}
  .ec-l{display:flex;gap:2mm;align-items:baseline;margin:.6mm 0;padding-inline-start:5mm;position:relative}
  .ec-l:before{content:'◆';position:absolute;inset-inline-start:0;font-size:8pt;top:1.6mm}
  .ec-l .k{white-space:nowrap}.ec-l .v{flex:1;min-width:8mm;border-bottom:1px dotted #333;font-weight:700;padding:0 1.5mm;min-height:5.2mm}
  .ec-g{display:flex;gap:4mm}.ec-g>.ec-l{flex:1}
  .ec-ph{position:absolute;inset-inline-end:3mm;top:0;width:27mm;height:35mm;border:1.3px solid #000;border-radius:3.5mm;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:10pt;background:#fff}
  .ec-ph img{width:100%;height:100%;object-fit:cover;display:block}
  .ec-p{position:relative;min-height:36mm}.ec-p.ph>*:not(.ec-ph){margin-inline-end:31mm}
  .ec-t th,.ec-t td{border:1px solid #000;text-align:center;font-size:10pt;padding:.4mm 1mm;height:6.4mm}.ec-t th{color:#0a5c8f;background:#eef6fb}
  `;
  if (Dx) Dx.modCss = (Dx.modCss || '') + CSS;

  const ln = (k, v) => `<div class="ec-l"><span class="k">${k}:</span><span class="v">${v ? esc(v) : ''}</span></div>`;
  const dt = (k, a, b) => `<div class="ec-l"><span class="k">${k}:</span><span class="v">${a ? esc(a) : ''}</span><span class="k">؛ تاريخها:</span><span class="v" style="max-width:34mm;flex:none">${b ? esc(fmtDate(b)) : ''}</span></div>`;
  const D = x => x ? fmtDate(x) : '';

  function card(s, e, o) {
    const sy = o.sy || MK.curSy(), svc = (e.services && e.services.length ? e.services : []).slice(0, 8);
    const rows = []; for (let i = 0; i < Math.max(5, svc.length); i++) { const r = svc[i] || {}; rows.push(`<tr><td style="width:7%;color:#0a8f5a;font-weight:700">${i + 1}</td><td>${esc(r.inst || '')}</td><td>${esc(r.dir || '')}</td><td>${esc(r.acad || '')}</td><td>${r.from ? esc(fmtDate(r.from)) : ''}</td><td>${r.to ? esc(fmtDate(r.to)) : ''}</td><td>${esc(r.note || '')}</td></tr>`); }
    const photo = o.photo !== false;
    const nm = Dx.fullName ? Dx.fullName(e) : [e.firstAr, e.lastAr].filter(Boolean).join(' ');
    return `<div class="ec">
      <div class="ec-h">
        <div><b>الأكاديمية الجهوية:</b> ${esc(Dx.regionOf ? (s.academy || '') : (s.academy || ''))}<br><b>المديرية الإقليمية:</b> ${esc(s.directorate || '')}<br><b>المؤسسة:</b> ${esc(s.school || '')}</div>
        <div class="c"><img src="assets/emblem.png" alt=""><div class="t">البطاقة الشخصية<br>للأستاذ(ة)</div></div>
        <div><b>الموسم الدراسي:</b> ${esc(MK.syDash(sy))}<br><b>الأستاذ(ة):</b> ${esc(nm)}</div>
      </div>
      <div class="ec-s">I. معلومات شخصية:</div>
      <div class="ec-p ${photo ? 'ph' : ''}">${photo ? `<div class="ec-ph">${e.photo ? `<img src="${e.photo}" alt="">` : 'الصورة'}</div>` : ''}
        <div class="ec-g">${ln('الاسم الشخصي', e.firstAr)}${ln('الاسم العائلي', e.lastAr)}</div>
        <div class="ec-g">${ln('تاريخ الازدياد', D(e.birth))}${ln('مكان الازدياد', e.birthPlace)}</div>
        <div class="ec-g">${ln('الحالة العائلية', e.marital)}${ln('الهاتف', e.phone)}</div>
        ${ln('رقم البطاقة الوطنية', e.cin)}
        ${ln('العنوان الشخصي الحالي', e.address)}
      </div>
      <div class="ec-s">II. معلومات إدارية:</div>
      <div class="ec-g">${ln('رقم التأجير', e.ppr)}${ln('الإطار', e.cadre)}</div>
      <div class="ec-g">${ln('تاريخ التوظيف', D(e.hire))}${ln('تاريخ الترسيم', D(e.tenure))}</div>
      ${dt('الدرجة', e.grade, e.gradeDate)}
      ${dt('الرتبة', e.echelon, e.echelonDate)}
      <div class="ec-s">III. معلومات مهنية:</div>
      <div class="ec-g">${ln('تاريخ الالتحاق بالمؤسسة', D(e.affDate))}${ln('تاريخ التعيين بالنيابة', D(e.dirDate))}</div>
      <div class="ec-g">${ln('تاريخ التكليف بالمؤسسة: من', D(e.asgFrom))}${ln('إلى', D(e.asgTo))}</div>
      <div class="ec-g">${ln('تاريخ التعيين بالأكاديمية', D(e.acadDate))}${ln('مادة التدريس', e.subject)}</div>
      ${dt('نقطة آخر تفتيش', e.inspScore, e.inspDate)}
      <div class="ec-s">IV. الشواهد الدراسية:</div>
      ${dt('الباكالوريا', e.bac, e.bacDate)}
      ${dt('الإجازة', e.licence || e.diploma, e.licDate)}
      ${dt('شواهد أخرى', e.otherCert, e.otherDate)}
      ${ln('التخصص', e.spec)}
      ${dt('مركز التكوين', e.trainCenter, e.gradDate)}
      ${ln('لغة التكوين / لغة التدريس', [e.formation, e.teachLang].filter(Boolean).join(' / '))}
      <div class="ec-s">V. بيان الخدمات السابقة:</div>
      <table class="ec-t"><thead><tr><th>ر.ت</th><th>المؤسسة</th><th>النيابة</th><th>الأكاديمية</th><th>من</th><th>إلى</th><th>ملاحظات</th></tr></thead><tbody>${rows.join('')}</tbody></table>
    </div>`;
  }

  const emps = () => (typeof sortedEmps === 'function' ? sortedEmps() : DB.employees);

  window.pageEmpCard = function (v, arg) {
    arg = arg || {};
    const st0 = { empId: arg.empId || '', all: !!arg.all, photo: true, sy: MK.curSy() };
    MK.docPage(v, {
      title: 'البطاقة الشخصية للأستاذ(ة)', icon: '🪪', modes: false, state: st0, word: true,
      back: () => go('employees'),
      form: (box, st, refresh) => {
        const draw = () => {
          const list = emps(), e = list.find(x => x.id === st.empId) || null;
          box.innerHTML = `<div class="sec-t">الموظف(ة)</div>
            <div class="fld"><select class="inp" id="ecE"><option value="__all" ${st.all ? 'selected' : ''}>كل الموظفين (بطاقة لكل واحد)</option>${list.map(x => `<option value="${x.id}" ${!st.all && x.id === st.empId ? 'selected' : ''}>${esc(Dx.fullName ? Dx.fullName(x) : x.firstAr + ' ' + x.lastAr)}</option>`).join('')}</select></div>
            <label class="chk"><input type="checkbox" id="ecP" ${st.photo ? 'checked' : ''}> إظهار الصورة</label>
            ${!st.all && e ? `<div class="sec-t" style="margin-top:12px">صورة الموظف(ة)</div>
              <div class="btn-row"><button class="btn sm" id="ecPh">${ic('up')} ${e.photo ? 'تغيير الصورة' : 'إضافة صورة'}</button>${e.photo ? `<button class="btn sm danger" id="ecPhD">${ic('trash')} حذف</button>` : ''}</div>
              <div class="sec-t" style="margin-top:12px">الخدمات السابقة</div>
              <div id="ecSv"></div><div class="btn-row"><button class="btn sm" id="ecSvA">${ic('plus')} إضافة سطر</button></div>
              <p class="muted" style="font-size:12px;line-height:1.7">باقي المعطيات (الحالة العائلية، الترسيم، الشواهد...) تُعدل من «تعديل» في صفحة الموظفين.</p>` : ''}`;
          $('#ecE', box).onchange = ev => { if (ev.target.value === '__all') { st.all = true; } else { st.all = false; st.empId = ev.target.value; } draw(); refresh(); };
          $('#ecP', box).onchange = ev => { st.photo = ev.target.checked; refresh(); };
          if (!st.all && e) {
            $('#ecPh', box).onclick = async () => { const p = await pickPhoto(); if (p) { e.photo = p; persist(); draw(); refresh(); } };
            if ($('#ecPhD', box)) $('#ecPhD', box).onclick = () => { delete e.photo; persist(); draw(); refresh(); };
            const sv = () => {
              e.services = e.services || [];
              $('#ecSv', box).innerHTML = e.services.map((r, i) => `<div class="fgrid" style="border-bottom:1px dashed var(--line);padding-bottom:6px;margin-bottom:6px">
                ${[['inst', 'المؤسسة'], ['dir', 'النيابة'], ['acad', 'الأكاديمية']].map(([k, l]) => `<div class="fld"><label>${l}</label><input class="inp" data-i="${i}" data-k="${k}" value="${esc(r[k] || '')}"></div>`).join('')}
                ${[['from', 'من'], ['to', 'إلى']].map(([k, l]) => `<div class="fld"><label>${l}</label><input class="inp" type="date" data-i="${i}" data-k="${k}" value="${esc(r[k] || '')}"></div>`).join('')}
                <div class="fld"><label>ملاحظات</label><input class="inp" data-i="${i}" data-k="note" value="${esc(r.note || '')}"></div>
                <button class="btn sm danger icon" data-del="${i}" title="حذف السطر">${ic('trash')}</button></div>`).join('');
              $$('#ecSv [data-k]', box).forEach(inp => inp.oninput = () => { e.services[+inp.dataset.i][inp.dataset.k] = inp.value; persist(); refresh(); });
              $$('#ecSv [data-del]', box).forEach(b => b.onclick = () => { e.services.splice(+b.dataset.del, 1); persist(); sv(); refresh(); });
            };
            sv();
            $('#ecSvA', box).onclick = () => { (e.services = e.services || []).push({}); persist(); sv(); refresh(); };
          }
        };
        if (!st.empId && !st.all) { const f = emps()[0]; if (f) st.empId = f.id; else st.all = true; }
        draw();
      },
      build: st => {
        const list = st.all ? emps() : emps().filter(x => x.id === st.empId);
        return { page: 'a4', pages: (list.length ? list : [{}]).map(e => card(S(), e, st)) };
      },
      fname: st => st.all ? 'البطاقات_الشخصية_للأساتذة' : 'البطاقة_الشخصية_' + ((emps().find(x => x.id === st.empId) || {}).lastAr || '')
    });
  };
  /* ---- 1.9.4: printable sheet of staff photo cards («بطاقات بالصور»): cards of the employees page, several per A4 page ---- */
  const GCSS = `
  .eg{display:flex;flex-direction:column;height:100%;box-sizing:border-box;font-family:'MAJ','Amiri',serif}
  .eg-h{display:flex;justify-content:space-between;align-items:center;border-bottom:1.4px solid #1f3864;margin:0 0 2.5mm;padding:0 0 1.2mm;font-size:10pt;line-height:1.5}
  .eg-h b{font-family:'MAJT','Amiri',serif;font-size:14pt;color:#1f3864}
  .eg-t{width:100%;border-collapse:separate;border-spacing:2.6mm;table-layout:fixed}
  .eg-t td{border:1.2px solid #1f3864;border-radius:3mm;vertical-align:top;text-align:center;padding:2mm 1.6mm;background:#fff;overflow:hidden}
  .eg-t td.e{border:0;background:none}
  .eg-ph{margin:0 auto 1.6mm;border:1px solid #1f3864;border-radius:2mm;overflow:hidden;background:#eef2f8;display:flex;align-items:center;justify-content:center;color:#6b7a99;font-weight:700}
  .eg-ph img{width:100%;height:100%;object-fit:cover;display:block}
  .eg-n{font-weight:700;font-size:11pt;line-height:1.35;color:#10213f}
  .eg-c{font-size:8.6pt;line-height:1.45;color:#333}
  .eg-c b{color:#1f3864}.eg-c .k{color:#555}
  .eg-ft{margin-top:auto;font-size:8pt;text-align:center;color:#555;padding-top:1.5mm}`;
  if (Dx) Dx.modCss = (Dx.modCss || '') + GCSS;
  const GL = { '2x3': [2, 3], '3x3': [3, 3], '3x4': [3, 4], '4x4': [4, 4], '4x5': [4, 5] };
  const GF = [['ppr', 'رقم التأجير'], ['cin', 'رقم البطاقة الوطنية'], ['cadre', 'الإطار'], ['task', 'المادة / المهمة'], ['unit', 'الوحدة المدرسية'], ['phone', 'الهاتف'], ['levels', 'المستويات المسندة']];
  const G = { layout: '3x3', cat: '', unit: '', fields: [true, false, true, true, true, false, false], title: true, onlyPhoto: false, q: '' };
  const gCat = (e, B) => (B.a.has(e.id) ? 'admin' : B.t.has(e.id) ? 'teacher' : B.as.has(e.id) ? 'assigned' : B.p.has(e.id) ? 'preschool' : 'other');
  function galleryList() {
    const B = window.Board ? { a: new Set(Board.admins().map(e => e.id)), t: new Set(Board.teachers().map(e => e.id)), as: new Set(Board.assigned().map(e => e.id)), p: new Set(Board.preschool().map(e => e.id)) } : { a: new Set(), t: new Set(), as: new Set(), p: new Set() };
    const q = String(G.q || '').trim().toLowerCase();
    return emps().filter(e => (!q || [Dx.fullName ? Dx.fullName(e) : e.firstAr + ' ' + e.lastAr, e.firstFr, e.lastFr, e.ppr, e.cin, e.cadre].join(' ').toLowerCase().includes(q))
      && (!G.cat || gCat(e, B) === G.cat) && (!G.unit || (window.K && K.U ? K.U.same(e.unit, G.unit) : e.unit === G.unit)) && (!G.onlyPhoto || e.photo));
  }
  function galleryPages(s, sy) {
    const [cols, rows] = GL[G.layout] || GL['3x3'], per = cols * rows, list = galleryList(), pages = [];
    // the photo (3:4) fills what the card leaves under the text; the rows share the height of the page
    const nl = G.fields.filter(Boolean).length, rowH = 250 / rows - 2.6, textH = 6 + 4.3 * (nl + 0.5), colC = (186 - 2.6 * (cols + 1)) / cols - 5.6;
    let ph = Math.max(16, Math.min(56, rowH - 6.4 - textH - 2)); const pw = Math.round(Math.min(ph * 0.75, colC)); ph = Math.round(pw / 0.75);
    const cell = e => {
      const nm = Dx.fullName ? Dx.fullName(e) : [e.firstAr, e.lastAr].filter(Boolean).join(' ');
      const lines = GF.map(([k, l], i) => {
        if (!G.fields[i]) return '';
        const v = k === 'task' ? (e.subject || e.task || '') : e[k];
        if (!String(v || '').trim()) return '';
        return k === 'cadre' ? `<div>${esc(v)}</div>` : `<div><span class="k">${l}:</span> <b>${esc(v)}</b></div>`;
      }).join('');
      return `<div class="eg-ph" style="width:${pw}mm;height:${ph}mm">${e.photo ? `<img src="${e.photo}" alt="">` : `<span style="font-size:${Math.round(ph / 2.4)}pt">${esc(initials(e) || '؟')}</span>`}</div><div class="eg-n">${esc(nm)}</div><div class="eg-c">${lines}</div>`;
    };
    const total = Math.max(1, Math.ceil(list.length / per));
    for (let p = 0; p < total; p++) {
      const chunk = list.slice(p * per, (p + 1) * per);
      let t = '<table class="eg-t">';
      for (let r = 0; r < rows; r++) {
        t += '<tr>';
        for (let c = 0; c < cols; c++) { const e = chunk[r * cols + c]; t += e ? `<td style="height:${(rowH - 6.4).toFixed(1)}mm">${cell(e)}</td>` : `<td class="e" style="height:${(rowH - 6.4).toFixed(1)}mm"></td>`; }
        t += '</tr>';
      }
      t += '</table>';
      pages.push(`<div class="eg">${G.title ? `<div class="eg-h"><div><b>بطاقات موظفي المؤسسة</b><br>${esc(s.school || '')}</div><div style="text-align:left">الموسم الدراسي ${esc(MK.syDash(sy))}<br>${list.length} موظف(ة)</div></div>` : ''}${t}${total > 1 ? `<div class="eg-ft" dir="ltr">${p + 1} / ${total}</div>` : ''}</div>`);
    }
    return pages;
  }
  window.pageEmpGallery = function (v, arg) {
    arg = arg || {};
    if (arg.q != null) G.q = arg.q;
    MK.docPage(v, {
      title: 'بطاقات الموظفين بالصور', icon: '🪪', modes: false, state: { sy: MK.curSy() }, word: true,
      back: () => go('employees'),
      form: (box, st, refresh) => {
        const units = () => { const u = window.Units ? Units.names() : []; return [['', 'كل الوحدات']].concat(u.map(n => [n, n])); };
        const defs = () => [{ sec: 'الموظفون المعنيون' },
          { k: 'q', l: 'بحث (الاسم، رقم التأجير، الإطار...)', t: 'text', ph: 'اتركه فارغا لكل الموظفين' },
          { k: 'cat', l: 'الفئة', t: 'select', half: true, opts: [['', 'كل الفئات'], ['teacher', 'هيئة التدريس'], ['admin', 'هيئة الإدارة'], ['assigned', 'أساتذة مكلفون'], ['preschool', 'مربو التعليم الأولي'], ['other', 'أطر وأعوان آخرون']] },
          (window.Cyc && Cyc.single()) ? null : { k: 'unit', l: 'الوحدة المدرسية', t: 'select', half: true, opts: units },
          { k: 'onlyPhoto', l: '', t: 'checks', opts: ['الموظفون الذين لهم صورة فقط'], map: true },
          { sec: 'التصميم' },
          { k: 'layout', l: 'عدد البطاقات في الصفحة', t: 'select', opts: [['2x3', '6 بطاقات (2 × 3) — صور كبيرة'], ['3x3', '9 بطاقات (3 × 3)'], ['3x4', '12 بطاقة (3 × 4)'], ['4x4', '16 بطاقة (4 × 4)'], ['4x5', '20 بطاقة (4 × 5) — صور صغيرة']] },
          { k: 'fields', l: 'المعطيات المعروضة تحت الصورة', t: 'checks', opts: GF.map(x => x[1]) },
          { k: 'title', l: '', t: 'checks', opts: ['عنوان أعلى كل صفحة (المؤسسة والموسم)'], map: true },
          { note: 'لإضافة صورة لموظف(ة): افتح «البطاقة» الخاصة به أو بطاقته الشخصية ثم «إضافة صورة». المحاذاة والقص (3:4) تتم تلقائيا.' }].filter(Boolean);
        // booleans edited as one-box «checks» fields
        const st2 = Object.assign({}, G, { onlyPhoto: [!!G.onlyPhoto], title: [!!G.title] });
        let tm = null;
        const sync = k => { if (k === 'onlyPhoto') G.onlyPhoto = !!st2.onlyPhoto[0]; else if (k === 'title') G.title = !!st2.title[0]; else G[k] = st2[k]; clearTimeout(tm); tm = setTimeout(refresh, k === 'q' ? 350 : 0); };
        K.form(box, defs, st2, sync);
      },
      build: st => ({ page: 'a4', pages: galleryPages(S(), st.sy) }),
      fname: () => 'بطاقات_الموظفين_بالصور'
    });
  };
  window.EmpPhoto = { pick: pickPhoto, fit: fitPhoto, initials, galleryList, G };
})();
