'use strict';
/* 1.9.4 — الحياة المدرسية ← «مجلة المؤسسة»: مجلة مدرسية قابلة للتحيين والتغيير (عدد لكل موسم أو أكثر).
   كل عدد: غلاف (العنوان، رقم العدد، الموسم، صورة، شعار المؤسسة، الألوان) + أقسام مرتبة يمكن تحريكها وتعديلها وحذفها:
   الفهرس (تلقائي)، صفحة صورة (مثل صورة صاحب الجلالة)، مقال / افتتاحية، الفريق التربوي والإداري ولجنة الإعداد، ألبوم صور الأنشطة،
   تصميم من «تصاميمي» (إعلان، تهنئة...)، وأي وثيقة من وثائق البرنامج (بطائق الأندية، برنامج الأنشطة، الجمعيات، المجالس...)
   تدرج كما هي في صفحات المجلة (الوثائق الأفقية تدار لتملأ الصفحة). الطبع A4 أو الحفظ PDF.
   Data: DB.mag = { issues: [{ id, title, no, sy, date, sub, color, color2, coverImg, sections: [{ id, type, title, ... }] }] } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const R = () => { const m = (DB.mag = DB.mag && typeof DB.mag === 'object' ? DB.mag : {}); m.issues = Array.isArray(m.issues) ? m.issues : []; return m; };
  const byId = id => R().issues.find(x => x.id === id) || null;
  const TYPES = {
    toc: ['📑', 'الفهرس (تلقائي)'], image: ['🖼', 'صفحة صورة (مثل صورة صاحب الجلالة)'], text: ['📝', 'مقال / افتتاحية / إبداعات التلاميذ'], team: ['👥', 'الفريق التربوي والإداري ولجنة الإعداد'],
    photos: ['📷', 'ألبوم صور الأنشطة'], design: ['🎨', 'تصميم من «تصاميمي»'], doc: ['📄', 'وثيقة من وثائق البرنامج'], sep: ['🔖', 'صفحة فاصلة (عنوان باب)']
  };
  const THEMES = [['#0e5a4a', '#d4a52c'], ['#1d2a8c', '#e53935'], ['#7b1fa2', '#ffb300'], ['#c62828', '#1565c0'], ['#00695c', '#8bc34a'], ['#37474f', '#ff7043']];
  const st = { id: '' };

  /* ---------- images: picked from the computer, reduced (JPEG) so that the data file stays small ---------- */
  const jpeg = (url, maxW) => new Promise(res => { const im = new Image(); im.onload = () => { const sc = Math.min(1, (maxW || 1400) / Math.max(im.naturalWidth, im.naturalHeight)); const c = document.createElement('canvas'); c.width = Math.round(im.naturalWidth * sc); c.height = Math.round(im.naturalHeight * sc); const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .82)); }; im.onerror = () => res(null); im.src = url; });
  function pickImages(multi, maxW) {
    return new Promise(res => {
      const inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.multiple = !!multi; inp.style.display = 'none'; document.body.appendChild(inp);
      inp.onchange = async () => { const out = []; for (const f of Array.from(inp.files || [])) { const u = await new Promise(r => { const rd = new FileReader(); rd.onload = () => r(rd.result); rd.onerror = () => r(null); rd.readAsDataURL(f); }); const j = u && await jpeg(u, maxW); if (j) out.push(j); } inp.remove(); res(out); };
      inp.click();
    });
  }

  /* ---------- a new issue, with the sections of the usual school magazine ---------- */
  function newIssue() {
    const s = S(), sy = MK.curSy(), n = R().issues.length + 1;
    const team = [['الإشراف', 'مدير(ة) المؤسسة', s.director || ''], ['التنسيق العام', 'المنسق(ة) العام(ة)', ''], ['لجنة الإعداد', 'منسق(ة) نادي القراءة', ''], ['لجنة الإعداد', 'منسق(ة) النادي الثقافي', ''], ['الجمع والتوضيب', '', ''], ['ضبط أرشيف المجلة', '', '']];
    return { id: uid('mg'), title: 'مجلة الحياة المدرسية', no: String(n), sy, date: Dx.todayIso(), sub: 'مجلة الأنشطة المدرسية ل' + (s.school || 'المؤسسة'), color: THEMES[0][0], color2: THEMES[0][1], coverImg: '',
      sections: [
        { id: uid('sc'), type: 'toc', title: 'فهرس العدد' },
        { id: uid('sc'), type: 'image', title: 'صاحب الجلالة الملك محمد السادس نصره الله', img: '', cap: 'صاحب الجلالة الملك محمد السادس نصره الله وأيده' },
        { id: uid('sc'), type: 'text', title: 'افتتاحية العدد', author: s.director ? 'مدير المؤسسة: ' + s.director : '', body: 'تعتبر الحياة المدرسية جزءا من الحياة العامة المتميزة بالسرعة والتدفق، التي تستدعي التجاوب والتفاعل مع المتغيرات الاقتصادية والاجتماعية والثقافية والقيمية...\n\nيسعدنا أن نضع بين أيديكم هذا العدد من مجلة المؤسسة، ثمرة مجهودات الأطر التربوية والإدارية والمتعلمات والمتعلمين وشركاء المؤسسة.' },
        { id: uid('sc'), type: 'team', title: 'الفريق التربوي والإداري', rows: team },
        { id: uid('sc'), type: 'sep', title: 'النوادي التربوية', sub: 'بطائق الأندية وبرامجها' },
        { id: uid('sc'), type: 'photos', title: 'أنشطة وصور', per: 4, photos: [] }
      ] };
  }

  /* ---------- page ---------- */
  function page(v, arg) {
    arg = arg || {};
    if (arg.id) st.id = arg.id;
    const I = st.id && byId(st.id);
    if (I) return editor(v, I);
    const L = R().issues;
    v.innerHTML = `<div class="page-h"><h1>مجلة المؤسسة</h1><span class="sp"></span><button class="btn pri" id="mgNew">${ic('plus')} عدد جديد</button></div>
      <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">أنشئ مجلة المؤسسة وحيّنها متى شئت: الغلاف (العنوان، رقم العدد، الموسم، صورة وشعار المؤسسة)، الفهرس التلقائي، صورة صاحب الجلالة، الافتتاحية، الفريق التربوي ولجنة الإعداد، المقالات وإبداعات التلاميذ، ألبومات صور الأنشطة، التصاميم (الإعلانات والتهاني)، وأي وثيقة من وثائق البرنامج (بطائق الأندية، برنامج الأنشطة المندمجة، الجمعيات، المجالس، التعاونية...) تدرج تلقائيا بمعطياتها المحينة. رتب الأقسام كما تريد ثم اطبع المجلة أو احفظها PDF.</div>
      ${L.length ? `<div class="mg-list">${L.map(x => `<div class="card mg-it" data-op="${x.id}"><div class="mg-cv" style="background:linear-gradient(160deg,${esc(x.color)},${esc(x.color2)})">${x.coverImg ? `<img src="${x.coverImg}">` : ''}<b>${esc(x.title)}</b><span>العدد ${esc(x.no)} — ${esc(MK.syDash(x.sy || MK.curSy()).replace('-', '/'))}</span></div>
          <div class="mg-ib"><span class="muted">${x.sections.length} قسم</span><div class="btn-row"><button class="btn sm" data-op="${x.id}">${ic('edit')} فتح</button><button class="btn sm" data-pv="${x.id}">${ic('print')}</button><button class="btn sm" data-cp="${x.id}" title="نسخة (عدد جديد بنفس الأقسام)">نسخة</button><button class="btn sm danger" data-del="${x.id}">${ic('trash')}</button></div></div></div>`).join('')}</div>`
        : '<div class="empty-state">لا يوجد أي عدد بعد. اضغط «عدد جديد»: تنشأ المجلة بأقسامها المعتادة لتعدلها وتكملها.</div>'}`;
    const again = () => page(v);
    $('#mgNew', v).onclick = () => { const x = newIssue(); R().issues.unshift(x); persist(); st.id = x.id; again(); };
    $$('[data-op]', v).forEach(b => b.onclick = e => { if (e.target.closest('[data-pv],[data-cp],[data-del]')) return; st.id = b.dataset.op; again(); });
    $$('[data-pv]', v).forEach(b => b.onclick = () => go('magDoc', { id: b.dataset.pv }));
    $$('[data-cp]', v).forEach(b => b.onclick = () => { const x = JSON.parse(JSON.stringify(byId(b.dataset.cp))); x.id = uid('mg'); x.no = String((+x.no || 0) + 1); x.sy = MK.curSy(); x.sections.forEach(s2 => { s2.id = uid('sc'); }); R().issues.unshift(x); persist(); again(); });
    $$('[data-del]', v).forEach(b => b.onclick = async () => { if (!(await confirmBox('حذف هذا العدد من المجلة نهائيا؟', 'حذف'))) return; R().issues = R().issues.filter(x => x.id !== b.dataset.del); persist(); again(); });
  }

  const centers = () => ((window.K && K.centers) || []).filter(c => { try { return c.docs().length; } catch (_) { return false; } });
  function editor(v, I) {
    const again = () => editor(v, I);
    const desc = s2 => s2.type === 'doc' ? (() => { const c = centers().find(x => x.id === s2.cid), d = c && c.docs().find(x => x.k === s2.dk); return d ? `${c.title} ← ${d.t}` : 'وثيقة غير متوفرة'; })()
      : s2.type === 'photos' ? `${(s2.photos || []).length} صورة` : s2.type === 'design' ? ((DB.designs || []).find(d => d.id === s2.did) || {}).name || 'لم يختر بعد' : s2.type === 'text' ? String(s2.body || '').slice(0, 80) + '…' : s2.type === 'team' ? `${(s2.rows || []).filter(r => nm(r[2])).length} اسم` : s2.type === 'image' ? (s2.img ? 'صورة مضافة' : 'بدون صورة') : '';
    v.innerHTML = `<div class="page-h"><button class="btn" id="mgBack">${ic('back')} الأعداد</button><h1>${esc(I.title)} — العدد ${esc(I.no)}</h1><span class="sp"></span><button class="btn pri" id="mgPv">${ic('print')} معاينة وطباعة المجلة</button></div>
      <div class="mg-ed"><div class="card mg-cvf"><div class="card-h"><h3>الغلاف</h3></div><div class="card-b">
        <div class="fld"><label>عنوان المجلة</label><input class="inp" data-i="title" value="${esc(I.title)}"></div>
        <div class="fgrid"><div class="fld"><label>رقم العدد</label><input class="inp" data-i="no" value="${esc(I.no)}"></div><div class="fld"><label>تاريخ الصدور</label><input class="inp" type="date" data-i="date" value="${esc(I.date)}"></div></div>
        <div class="fld"><label>العنوان الفرعي</label><input class="inp" data-i="sub" value="${esc(I.sub)}"></div>
        <div class="fld"><label>ألوان المجلة</label><div class="mg-th">${THEMES.map((t, i) => `<button data-th="${i}" style="background:linear-gradient(135deg,${t[0]} 50%,${t[1]} 50%)" class="${t[0] === I.color ? 'on' : ''}"></button>`).join('')}<input type="color" data-i="color" value="${esc(I.color)}"><input type="color" data-i="color2" value="${esc(I.color2)}"></div></div>
        <div class="fld"><label>صورة الغلاف</label><div class="btn-row"><button class="btn sm" id="mgCI">${ic('up')} ${I.coverImg ? 'تغيير' : 'إضافة'} صورة</button>${I.coverImg ? '<button class="btn sm danger" id="mgCD">حذف</button>' : ''}</div>${I.coverImg ? `<img src="${I.coverImg}" style="max-width:100%;max-height:140px;margin-top:6px;border-radius:6px">` : ''}</div>
        <p class="muted" style="font-size:12px;line-height:1.7">${S().logo ? 'يظهر شعار المؤسسة المعتمد على الغلاف.' : 'لإظهار شعار المؤسسة على الغلاف: صممه من «الإعلانات والتصاميم ← شعار وترويسة المؤسسة» ثم «اعتماد كشعار».'}</p>
      </div></div>
      <div class="card"><div class="card-h"><h3>أقسام العدد وترتيبها</h3><span class="sp"></span><select class="inp" id="mgAddT" style="width:auto">${Object.entries(TYPES).map(([k, t]) => `<option value="${k}">${t[0]} ${t[1]}</option>`).join('')}</select><button class="btn sm pri" id="mgAdd">${ic('plus')} إضافة قسم</button></div><div class="card-b">
        <div class="mg-sec mg-cover"><span class="mg-n">1</span><span class="mg-ic">📘</span><div><b>الغلاف</b><div class="muted">${esc(I.sub)}</div></div></div>
        ${I.sections.map((s2, i) => `<div class="mg-sec"><span class="mg-n">${i + 2}</span><span class="mg-ic">${(TYPES[s2.type] || ['•'])[0]}</span><div style="flex:1;min-width:0"><b>${esc(s2.title || (TYPES[s2.type] || ['', ''])[1])}</b><div class="muted mg-d">${esc(desc(s2))}</div></div>
          <button class="btn sm" data-up="${i}" ${i ? '' : 'disabled'}>▲</button><button class="btn sm" data-dn="${i}" ${i < I.sections.length - 1 ? '' : 'disabled'}>▼</button><button class="btn sm" data-ed="${i}">${ic('edit')}</button><button class="btn sm danger" data-rm="${i}">${ic('trash')}</button></div>`).join('')}
      </div></div></div>`;
    const save = () => { persist(); };
    $('#mgBack', v).onclick = () => { st.id = ''; page(v); };
    $('#mgPv', v).onclick = () => go('magDoc', { id: I.id });
    $$('[data-i]', v).forEach(el => el.oninput = el.onchange = () => { I[el.dataset.i] = el.value; save(); });
    $$('[data-th]', v).forEach(b => b.onclick = () => { const t = THEMES[+b.dataset.th]; I.color = t[0]; I.color2 = t[1]; save(); again(); });
    $('#mgCI', v).onclick = async () => { const L = await pickImages(false, 1600); if (L[0]) { I.coverImg = L[0]; save(); again(); } };
    if ($('#mgCD', v)) $('#mgCD', v).onclick = () => { I.coverImg = ''; save(); again(); };
    const A = I.sections;
    $$('[data-up]', v).forEach(b => b.onclick = () => { const i = +b.dataset.up; [A[i - 1], A[i]] = [A[i], A[i - 1]]; save(); again(); });
    $$('[data-dn]', v).forEach(b => b.onclick = () => { const i = +b.dataset.dn; [A[i + 1], A[i]] = [A[i], A[i + 1]]; save(); again(); });
    $$('[data-rm]', v).forEach(b => b.onclick = async () => { if (!(await confirmBox('حذف هذا القسم من العدد؟', 'حذف'))) return; A.splice(+b.dataset.rm, 1); save(); again(); });
    $$('[data-ed]', v).forEach(b => b.onclick = () => secForm(A[+b.dataset.ed], () => { save(); again(); }));
    $('#mgAdd', v).onclick = () => { const t = $('#mgAddT', v).value, s2 = { id: uid('sc'), type: t, title: t === 'toc' ? 'فهرس العدد' : t === 'team' ? 'لجنة الإعداد' : t === 'photos' ? 'أنشطة وصور' : '', per: 4, photos: [], rows: t === 'team' ? [['', '', '']] : undefined };
      secForm(s2, () => { A.push(s2); save(); again(); }, true); };
  }

  /* ---------- the form of a section ---------- */
  function secForm(s2, done, isNew) {
    const x = JSON.parse(JSON.stringify(s2)), b = document.createElement('div');
    const draw = () => {
      const T = x.type;
      let h = `<div class="fld"><label>عنوان القسم (يظهر في الفهرس)</label><input class="inp" data-x="title" value="${esc(x.title)}"></div>`;
      if (T === 'text') h += `<div class="fld"><label>الكاتب(ة) / التوقيع</label><input class="inp" data-x="author" value="${esc(x.author)}"></div>
        <div class="fld"><label>النص (سطر فارغ بين الفقرات؛ السطر الذي يبدأ بـ - يصبح عنصر لائحة)</label><textarea class="inp" rows="12" data-x="body">${esc(x.body)}</textarea></div>
        <div class="fld"><label>صورة مرافقة (اختيارية)</label><div class="btn-row"><button class="btn sm" id="sfI">${ic('up')} ${x.img ? 'تغيير' : 'إضافة'} صورة</button>${x.img ? '<button class="btn sm danger" id="sfID">حذف</button>' : ''}</div>${x.img ? `<img src="${x.img}" style="max-height:110px;margin-top:6px">` : ''}</div>`;
      if (T === 'image') h += `<div class="fld"><label>التعليق تحت الصورة</label><input class="inp" data-x="cap" value="${esc(x.cap)}"></div>
        <div class="fld"><label>الصورة (تملأ الصفحة)</label><div class="btn-row"><button class="btn sm" id="sfI">${ic('up')} ${x.img ? 'تغيير' : 'اختيار'} الصورة</button></div>${x.img ? `<img src="${x.img}" style="max-height:160px;margin-top:6px">` : ''}</div>`;
      if (T === 'sep') h += `<div class="fld"><label>عنوان فرعي</label><input class="inp" data-x="sub" value="${esc(x.sub)}"></div>`;
      if (T === 'team') h += `<table class="tbl compact"><thead><tr><th>المجموعة (الإشراف، لجنة الإعداد...)</th><th>المهمة</th><th>الاسم الكامل</th><th></th></tr></thead><tbody>${(x.rows || []).map((r, i) => `<tr>${[0, 1, 2].map(j => `<td><input class="inp" data-r="${i}" data-j="${j}" value="${esc(r[j])}" ${j === 2 ? 'list="mgEmp"' : ''}></td>`).join('')}<td><button class="btn sm danger" data-rr="${i}">${ic('trash')}</button></td></tr>`).join('')}</tbody></table>
        <div class="btn-row" style="margin-top:6px"><button class="btn sm" id="sfRA">${ic('plus')} سطر</button><button class="btn sm" id="sfRC" title="منسقو الأندية من «الأندية التربوية»">إضافة منسقي الأندية</button></div>${K.dl('mgEmp', K.E ? K.E.names() : [])}`;
      if (T === 'photos') h += `<div class="fgrid"><div class="fld"><label>عدد الصور في الصفحة</label><select class="inp" data-x="per">${[1, 2, 4, 6, 9].map(n => `<option ${+x.per === n ? 'selected' : ''}>${n}</option>`).join('')}</select></div><div class="fld"><label>نص تقديمي (اختياري)</label><input class="inp" data-x="intro" value="${esc(x.intro)}"></div></div>
        <button class="btn sm pri" id="sfP">${ic('up')} إضافة صور (يمكن اختيار عدة صور)</button>
        <div class="mg-ph">${(x.photos || []).map((p, i) => `<div><img src="${p.src}"><input class="inp" data-pc="${i}" placeholder="تعليق" value="${esc(p.cap)}"><div class="btn-row"><button class="btn sm" data-pu="${i}" ${i ? '' : 'disabled'}>▶</button><button class="btn sm danger" data-pd="${i}">${ic('trash')}</button></div></div>`).join('')}</div>`;
      if (T === 'design') { const D = (DB.designs || []); h += D.length ? `<div class="mg-dz">${D.map(d => `<button class="${d.id === x.did ? 'on' : ''}" data-dz="${d.id}"><img src="${d.thumb}"><span>${esc(d.name)}</span></button>`).join('')}</div>` : '<p class="muted">لا توجد تصاميم محفوظة بعد في «تصاميمي» (الحياة المدرسية ← الإعلانات والتصاميم).</p>'; }
      if (T === 'doc') {
        const C = centers(), c = C.find(y => y.id === x.cid) || C[0]; if (c && !x.cid) { x.cid = c.id; }
        h += `<div class="fld"><label>الخانة</label><select class="inp" id="sfC">${C.map(y => `<option value="${y.id}" ${c && y.id === c.id ? 'selected' : ''}>${esc(y.title)}</option>`).join('')}</select></div>
          <div class="fld"><label>الوثيقة</label><select class="inp" id="sfD">${c ? c.docs().map(d => `<option value="${d.k}" ${d.k === x.dk ? 'selected' : ''}>${esc(d.t)}</option>`).join('') : ''}</select></div>
          <p class="muted" style="font-size:12px;line-height:1.7">تدرج الوثيقة بمعطياتها المحينة للموسم الحالي كما تطبع من خانتها (الوثائق الأفقية تدار لتملأ صفحة المجلة).</p>`;
      }
      if (T === 'toc') h += '<p class="muted">يبنى الفهرس تلقائيا من عناوين الأقسام وأرقام صفحاتها.</p>';
      b.innerHTML = h;
      $$('[data-x]', b).forEach(el => el.oninput = el.onchange = () => { x[el.dataset.x] = el.value; });
      $$('[data-r]', b).forEach(el => el.oninput = () => { x.rows[+el.dataset.r][+el.dataset.j] = el.value; });
      $$('[data-rr]', b).forEach(el => el.onclick = () => { x.rows.splice(+el.dataset.rr, 1); draw(); });
      if ($('#sfRA', b)) $('#sfRA', b).onclick = () => { x.rows.push([(x.rows[x.rows.length - 1] || [''])[0], '', '']); draw(); };
      if ($('#sfRC', b)) $('#sfRC', b).onclick = () => { const L = clubCoords(); if (!L.length) return toast('لم يتم العثور على منسقي الأندية في «الأندية التربوية»', true); L.forEach(r => x.rows.push(['لجنة الإعداد', 'منسق(ة) ' + r[0], r[1]])); draw(); };
      if ($('#sfI', b)) $('#sfI', b).onclick = async () => { const L = await pickImages(false, x.type === 'image' ? 1800 : 1200); if (L[0]) { x.img = L[0]; draw(); } };
      if ($('#sfID', b)) $('#sfID', b).onclick = () => { x.img = ''; draw(); };
      if ($('#sfP', b)) $('#sfP', b).onclick = async () => { const L = await pickImages(true, 1300); x.photos = (x.photos || []).concat(L.map(src => ({ src, cap: '' }))); draw(); };
      $$('[data-pc]', b).forEach(el => el.oninput = () => { x.photos[+el.dataset.pc].cap = el.value; });
      $$('[data-pu]', b).forEach(el => el.onclick = () => { const i = +el.dataset.pu, P = x.photos; [P[i - 1], P[i]] = [P[i], P[i - 1]]; draw(); });
      $$('[data-pd]', b).forEach(el => el.onclick = () => { x.photos.splice(+el.dataset.pd, 1); draw(); });
      $$('[data-dz]', b).forEach(el => el.onclick = () => { x.did = el.dataset.dz; if (!nm(x.title)) x.title = ((DB.designs || []).find(d => d.id === x.did) || {}).name || ''; draw(); });
      if ($('#sfC', b)) $('#sfC', b).onchange = e => { x.cid = e.target.value; x.dk = ''; draw(); };
      if ($('#sfD', b)) { if (!x.dk) x.dk = $('#sfD', b).value; $('#sfD', b).onchange = e => { x.dk = e.target.value; const c = centers().find(y => y.id === x.cid), d = c && c.docs().find(y => y.k === x.dk); if (d && (!nm(x.title) || x._auto)) { x.title = d.t; x._auto = 1; } }; }
      if (T === 'doc' && !nm(x.title)) { const c = centers().find(y => y.id === x.cid), d = c && c.docs().find(y => y.k === x.dk); if (d) { x.title = d.t; x._auto = 1; $('[data-x=title]', b).value = d.t; } }
    };
    draw();
    modal({ title: (isNew ? 'إضافة قسم: ' : 'تعديل القسم: ') + (TYPES[x.type] || ['', ''])[1], size: x.type === 'photos' || x.type === 'design' || x.type === 'team' ? 'xl' : 'lg', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (x.type === 'doc' && !x.dk) { toast('اختر الوثيقة', true); return false; }
      if (x.type === 'design' && !x.did) { toast('اختر التصميم', true); return false; }
      if (x.type === 'team') x.rows = (x.rows || []).filter(r => r.some(nm));
      Object.keys(s2).forEach(k => delete s2[k]); Object.assign(s2, x); done();
    } }, { label: 'إلغاء' }] });
  }
  const clubCoords = () => { try { const B = window.Budget && Budget.F ? Budget.F('cl_list', MK.curSy()) : null; return ((B && B.rows) || []).filter(r => nm(r[0])).map(r => [nm(r[0]), nm(r[1] || r[2] || '')]); } catch (_) { return []; } };

  /* ---------- the printed magazine ---------- */
  const fold = p => `<!--cls:mg-full-->${p}`;
  const markOf = p => { const m = typeof p === 'string' && /^<!--cls:([\w -]+)-->/.exec(p); return m ? m[1] : ''; };
  const runP = (p, i) => (typeof p === 'function' ? p(i) : p);
  function frame(I, title, inner, n) {
    return `<div class="mg-pg" style="--c1:${esc(I.color)};--c2:${esc(I.color2)}"><div class="mg-hd"><span>${esc(I.title)} — العدد ${esc(I.no)}</span><span>${esc(title || '')}</span></div><div class="mg-bd">${inner}</div><div class="mg-ft"><span>${esc(S().school || '')}</span><b>${n}</b></div></div>`;
  }
  const paras = t => { const out = []; let ul = []; String(t || '').split(/\n/).forEach(l => { const s2 = l.trim(); if (/^[-•●▪]\s*/.test(s2)) { ul.push(s2.replace(/^[-•●▪]\s*/, '')); return; } if (ul.length) { out.push(`<ul>${ul.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`); ul = []; } if (s2) out.push(`<p>${esc(s2)}</p>`); }); if (ul.length) out.push(`<ul>${ul.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`); return out; };
  function textPages(I, s2) {
    const P = [].concat(...paras(s2.body).map(p => { const t = p.replace(/<[^>]+>/g, ''); if (t.length < 1400 || !/^<p>/.test(p)) return [p]; const w = t.split(' '), out = []; let c = ''; w.forEach(x => { if ((c + ' ' + x).length > 1200) { out.push(c); c = x; } else c = c ? c + ' ' + x : x; }); if (c) out.push(c); return out.map((x, i) => `<p${i ? ' class="cont"' : ''}>${x}</p>`); })), pages = []; let cur = [], len = 0; const cap = s2.img ? 2100 : 3000;
    P.forEach(p => { const l = p.replace(/<[^>]+>/g, '').length + 60; if (len + l > (pages.length ? 3600 : cap) && cur.length) { pages.push(cur); cur = []; len = 0; } cur.push(p); len += l; });
    if (cur.length || !pages.length) pages.push(cur);
    return pages.map((c, i) => ({ title: s2.title, html: `${i ? '' : `<h2 class="mg-h2">${esc(s2.title)}</h2>`}${!i && s2.img ? `<img class="mg-tim" src="${s2.img}">` : ''}<div class="mg-txt">${c.join('')}</div>${i === pages.length - 1 && s2.author ? `<div class="mg-au">${esc(s2.author)}</div>` : ''}` }));
  }
  function teamPage(I, s2) {
    const groups = []; (s2.rows || []).forEach(r => { const g = nm(r[0]) || ' '; let G = groups.find(x => x.g === g); if (!G) groups.push(G = { g, L: [] }); G.L.push(r); });
    return [{ title: s2.title, html: `<h2 class="mg-h2">${esc(s2.title)}</h2>${S().logo ? `<img src="${S().logo}" class="mg-tlogo">` : ''}<div class="mg-team">${groups.map(G => `<div class="mg-tg"><div class="mg-tgt">${esc(G.g)}</div>${G.L.map(r => `<div class="mg-tr">${r[1] ? `<span>${esc(r[1])}</span>` : ''}<b>${esc(r[2])}</b></div>`).join('')}</div>`).join('')}</div>` }];
  }
  function photoPages(I, s2) {
    const per = Math.max(1, +s2.per || 4), P = s2.photos || [], out = [];
    const cols = per === 1 ? 1 : per <= 4 ? 2 : 3;
    for (let i = 0; i < Math.max(1, P.length); i += per) {
      const chunk = P.slice(i, i + per);
      out.push({ title: s2.title, html: `${i ? '' : `<h2 class="mg-h2">${esc(s2.title)}</h2>${s2.intro ? `<p class="mg-in">${esc(s2.intro)}</p>` : ''}`}<div class="mg-grid c${cols} n${per}">${chunk.map(p => `<figure><img src="${p.src}">${p.cap ? `<figcaption>${esc(p.cap)}</figcaption>` : ''}</figure>`).join('') || '<p class="muted" style="text-align:center">أضف صور الأنشطة لهذا القسم.</p>'}</div>` });
    }
    return out;
  }
  function docPages(s2) {
    const c = centers().find(x => x.id === s2.cid); if (!c) return [];
    let r = null; try { r = c.render(s2.dk, MK.curSy()); } catch (_) { r = null; } if (!r || !r.pages) return [];
    return r.pages.map(p => {
      if (r.page === 'a4') return { raw: p };
      const inner = r.page === 'a4l' ? `<div class="page-a4l ${markOf(p)}">${runP(p, 0)}</div>` : r.page === 'single' ? `<div class="sheet single"><div class="copy">${runP(p, 0)}</div></div>` : `<div class="sheet"><div class="copy">${runP(p, 0)}</div><div class="copy">${runP(p, 1)}</div></div>`;
      return r.page === 'single' ? { raw: fold(`<div class="mg-ins">${inner}</div>`) } : { raw: fold(`<div class="mg-rot">${inner}</div>`) };
    });
  }
  function build(I) {
    const s = S(), sy = I.sy || MK.curSy();
    const list = []; // { sec, pages: [{ title, html } | { raw }] }
    I.sections.forEach(s2 => {
      let pg = [];
      if (s2.type === 'text') pg = textPages(I, s2);
      else if (s2.type === 'team') pg = teamPage(I, s2);
      else if (s2.type === 'photos') pg = photoPages(I, s2);
      else if (s2.type === 'image') pg = [{ raw: fold(`<div class="mg-imgp" style="--c1:${esc(I.color)};--c2:${esc(I.color2)}">${s2.img ? `<img src="${s2.img}">` : '<div class="mg-noimg">الصورة</div>'}${s2.cap ? `<div class="mg-cap">${esc(s2.cap)}</div>` : ''}</div>`) }];
      else if (s2.type === 'sep') pg = [{ raw: fold(`<div class="mg-sep" style="--c1:${esc(I.color)};--c2:${esc(I.color2)}"><div class="mg-sep-i"><span>${esc(I.title)}</span><h1>${esc(s2.title)}</h1>${s2.sub ? `<h3>${esc(s2.sub)}</h3>` : ''}</div></div>`) }];
      else if (s2.type === 'design') { const d = (DB.designs || []).find(x => x.id === s2.did); if (d && window.Designer) { let u = ''; try { u = Designer.toCanvas(d.doc, Math.min(2.4, 2000 / Math.max(d.doc.w, d.doc.h))).toDataURL('image/jpeg', .9); } catch (_) {} pg = [{ raw: fold(`<div class="mg-dzp${d.doc.w > d.doc.h ? ' land' : ''}"><img src="${u}"></div>`) }]; } }
      else if (s2.type === 'doc') pg = docPages(s2);
      else if (s2.type === 'toc') pg = [{ toc: true, title: s2.title }];
      list.push({ s2, pages: pg });
    });
    // page numbers (cover = 1)
    let n = 2; list.forEach(x => { x.start = n; n += x.pages.length; });
    const tocHtml = t => `<h2 class="mg-h2">${esc(t || 'فهرس العدد')}</h2><div class="mg-toc">${list.filter(x => x.s2.type !== 'toc' && x.pages.length).map(x => `<div><span>${esc(x.s2.title || (TYPES[x.s2.type] || ['', ''])[1])}</span><i></i><b>${x.start}</b></div>`).join('')}</div>`;
    const out = [cover(I, s, sy)];
    list.forEach(x => x.pages.forEach((p, i) => { out.push(p.raw != null ? p.raw : fold(frame(I, p.title, p.toc ? tocHtml(p.title) : p.html, x.start + i))); }));
    return out;
  }
  function cover(I, s, sy) {
    return fold(`<div class="mg-cover" style="--c1:${esc(I.color)};--c2:${esc(I.color2)}">
      <div class="mg-ch">${Dx.header ? `<div class="mg-chh">${Dx.header(s)}</div>` : ''}</div>
      <div class="mg-ct"><div class="mg-cl">${s.logo ? `<img src="${s.logo}">` : ''}</div><h1>${esc(I.title)}</h1><div class="mg-csub">${esc(I.sub)}</div></div>
      <div class="mg-cimg">${I.coverImg ? `<img src="${I.coverImg}">` : '<div class="mg-cdeco"></div>'}</div>
      <div class="mg-cf"><div><b>العدد ${esc(I.no)}</b></div><div>الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}</div><div>${esc(Dx.fmtDate ? Dx.fmtDate(I.date) : I.date)}</div></div></div>`);
  }
  Dx.modCss += `
  .page-a4.mg-full{padding:0}
  .mg-pg{height:100%;display:flex;flex-direction:column;padding:9mm 12mm 7mm}
  .mg-hd{display:flex;justify-content:space-between;border-bottom:2.2px solid var(--c1);color:var(--c1);font-weight:700;font-size:9pt;padding-bottom:1.2mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-bd{flex:1;min-height:0;overflow:hidden;padding-top:4mm}
  .mg-ft{display:flex;justify-content:space-between;align-items:center;border-top:1px solid #bbb;padding-top:1.2mm;font-size:8.6pt;color:#555}.mg-ft b{background:var(--c1);color:#fff;border-radius:50%;width:7mm;height:7mm;display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-h2{font-family:'MAJT','Amiri',serif;font-size:22pt;color:var(--c1);margin:0 0 4mm;text-align:center;position:relative;padding-bottom:2mm}.mg-h2:after{content:'';position:absolute;bottom:0;left:35%;right:35%;height:1.2mm;background:var(--c2);border-radius:1mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-txt{font-size:12pt;line-height:1.95;text-align:justify}.mg-txt p{margin:0 0 2.4mm;text-indent:6mm}.mg-txt p.cont{text-indent:0}.mg-txt ul{margin:0 0 2.4mm;padding-right:7mm}.mg-txt li{margin-bottom:.8mm}
  .mg-tim{float:left;width:72mm;max-height:70mm;object-fit:cover;margin:0 4mm 3mm 0;border-radius:3mm;border:1px solid #ccc}
  .mg-au{text-align:left;font-weight:700;margin-top:4mm;color:var(--c1)}
  .mg-tlogo{display:block;margin:0 auto 4mm;height:32mm}
  .mg-team{display:grid;gap:4mm}.mg-tg{border:1.3px solid var(--c1);border-radius:3mm;overflow:hidden}.mg-tgt{background:var(--c1);color:#fff;font-weight:700;text-align:center;padding:1.5mm;font-size:12.5pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-tr{display:flex;justify-content:space-between;gap:4mm;padding:1.6mm 4mm;border-top:1px dashed #ccc;font-size:11.5pt}.mg-tr:first-of-type{border-top:0}.mg-tr span{color:#555}
  .mg-in{text-align:center;font-size:11.5pt;margin:0 0 3mm}
  .mg-grid{display:grid;gap:4mm;height:calc(100% - 18mm)}.mg-grid.c1{grid-template-columns:1fr}.mg-grid.c2{grid-template-columns:1fr 1fr}.mg-grid.c3{grid-template-columns:1fr 1fr 1fr}
  .mg-grid.n2{grid-template-rows:1fr 1fr;grid-template-columns:1fr}.mg-grid.n4{grid-template-rows:1fr 1fr}.mg-grid.n6{grid-template-rows:1fr 1fr 1fr;grid-template-columns:1fr 1fr}.mg-grid.n9{grid-template-rows:1fr 1fr 1fr}
  .mg-grid figure{margin:0;display:flex;flex-direction:column;min-height:0;border:1px solid #ddd;border-radius:2.5mm;overflow:hidden;background:#fafafa}.mg-grid img{flex:1;min-height:0;width:100%;object-fit:cover}.mg-grid figcaption{font-size:9.5pt;text-align:center;padding:1mm;font-weight:700;color:var(--c1)}
  .mg-imgp{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:14mm;background:linear-gradient(170deg,#fff 60%,color-mix(in srgb,var(--c2) 18%,#fff));-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-imgp img{max-width:100%;max-height:235mm;object-fit:contain;border:2mm solid #fff;box-shadow:0 0 0 1.2mm var(--c2);border-radius:2mm}.mg-noimg{width:140mm;height:190mm;border:1px dashed #999;display:flex;align-items:center;justify-content:center;color:#999}
  .mg-cap{margin-top:7mm;font-family:'MAJT','Amiri',serif;font-size:19pt;color:var(--c1);text-align:center;font-weight:700}
  .mg-sep{height:100%;background:linear-gradient(150deg,var(--c1),color-mix(in srgb,var(--c1) 60%,#000));display:flex;align-items:center;justify-content:center;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-sep-i{text-align:center;color:#fff;border-top:2mm solid var(--c2);border-bottom:2mm solid var(--c2);padding:14mm 18mm;width:72%}.mg-sep-i span{font-size:12pt;opacity:.85}.mg-sep-i h1{font-family:'MAJT','Amiri',serif;font-size:40pt;margin:5mm 0}.mg-sep-i h3{font-size:15pt;font-weight:400;margin:0}
  .mg-dzp{height:100%;display:flex;align-items:center;justify-content:center;padding:6mm}.mg-dzp img{max-width:100%;max-height:100%;object-fit:contain}
  .mg-dzp.land img{transform:rotate(90deg);max-width:285mm;max-height:198mm}
  .mg-rot{position:relative;width:210mm;height:296.5mm;overflow:hidden}.mg-rot>.page-a4l,.mg-rot>.sheet{position:absolute;top:0;left:0;transform-origin:top left;transform:translateX(210mm) rotate(90deg);break-after:auto;page-break-after:auto}
  .mg-ins{width:210mm;height:296.5mm;overflow:hidden}
  .mg-toc>div{display:flex;align-items:baseline;gap:2mm;font-size:13pt;padding:2.2mm 0;border-bottom:1px dotted #ccc}.mg-toc i{flex:1}.mg-toc b{color:#fff;background:var(--c1);border-radius:2mm;padding:.3mm 2.6mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-cover{height:100%;display:flex;flex-direction:column;background:linear-gradient(165deg,#fff 0,#fff 42%,color-mix(in srgb,var(--c1) 12%,#fff));position:relative;overflow:hidden;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .mg-cover:before{content:'';position:absolute;top:-30mm;left:-40mm;width:120mm;height:120mm;border-radius:50%;background:var(--c2);opacity:.18}
  .mg-chh{padding:8mm 11mm 0}.mg-ct{text-align:center;padding:2mm 10mm 0;position:relative}.mg-cl img{height:30mm;margin-bottom:1mm}
  .mg-ct h1{font-family:'MAJT','Amiri',serif;font-size:40pt;line-height:1.25;margin:0;color:var(--c1)}.mg-csub{display:inline-block;margin-top:2mm;background:var(--c2);color:#fff;font-weight:700;font-size:14pt;padding:1.5mm 8mm;border-radius:6mm}
  .mg-cimg{flex:1;min-height:0;margin:6mm 14mm;border-radius:5mm;overflow:hidden;border:2mm solid #fff;box-shadow:0 0 0 1.2mm var(--c1);display:flex}.mg-cimg img{width:100%;height:100%;object-fit:cover}
  .mg-cdeco{flex:1;background:repeating-linear-gradient(45deg,color-mix(in srgb,var(--c1) 12%,#fff) 0 8mm,#fff 8mm 16mm)}
  .mg-cf{display:flex;justify-content:space-between;align-items:center;background:var(--c1);color:#fff;padding:5mm 14mm;font-size:13pt}.mg-cf b{background:var(--c2);padding:1mm 6mm;border-radius:4mm;font-size:15pt}`;
  const css = document.createElement('style');
  css.textContent = `.mg-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px}.mg-it{padding:6px;cursor:pointer}.mg-cv{height:240px;border-radius:8px;color:#fff;display:flex;flex-direction:column;justify-content:flex-end;padding:10px;position:relative;overflow:hidden}.mg-cv img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.45}.mg-cv b,.mg-cv span{position:relative}.mg-cv b{font-size:18px}
    .mg-ib{display:flex;justify-content:space-between;align-items:center;padding:6px 2px 0;gap:6px;flex-wrap:wrap}
    .mg-ed{display:grid;grid-template-columns:330px 1fr;gap:12px;align-items:start}@media(max-width:900px){.mg-ed{grid-template-columns:1fr}}
    .mg-th{display:flex;gap:6px;align-items:center;flex-wrap:wrap}.mg-th button{width:30px;height:30px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #bbb;cursor:pointer}.mg-th button.on{box-shadow:0 0 0 3px #222}.mg-th input{width:36px;height:30px;padding:0;border:1px solid #ccc;border-radius:6px}
    .mg-sec{display:flex;align-items:center;gap:8px;padding:8px;border:1px solid var(--line);border-radius:8px;margin-bottom:6px}.mg-n{background:#0e5a4a;color:#fff;border-radius:50%;min-width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px}.mg-ic{font-size:20px}.mg-d{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .mg-ph{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:8px}.mg-ph>div{border:1px solid var(--line);border-radius:8px;padding:4px}.mg-ph img{width:100%;height:100px;object-fit:cover;border-radius:6px}
    .mg-dz{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px}.mg-dz button{border:2px solid var(--line);border-radius:8px;background:#fff;padding:4px;cursor:pointer;display:flex;flex-direction:column;gap:4px;font-family:inherit}.mg-dz button.on{border-color:#0e5a4a;box-shadow:0 0 0 2px #bfe0d4}.mg-dz img{width:100%;height:120px;object-fit:contain;background:#f4f4f4}`;
  document.head.appendChild(css);

  window.pageMag = (v, a) => {
    // the documents centres are created when their page is first opened: open the sections once so that every document can be embedded
    if (window.Tools && Tools.warm && Tools.warm()) { setTimeout(() => go('mag', a), 50); v.innerHTML = '<div class="empty-state">…</div>'; return; }
    page(v, a);
  };
  window.pageMagDoc = function (v, arg) {
    arg = arg || {};
    if (window.Tools && Tools.warm && Tools.warm()) { setTimeout(() => go('magDoc', arg), 50); v.innerHTML = '<div class="empty-state">…</div>'; return; }
    const I = byId(arg.id || st.id) || R().issues[0];
    MK.docPage(v, {
      title: 'مجلة المؤسسة', icon: '📰', modes: false, state: {},
      back: () => go('mag', { id: I ? I.id : '' }),
      form: box => { box.innerHTML = I ? `<p class="muted" style="line-height:1.8">${esc(I.title)} — العدد ${esc(I.no)}: الغلاف + ${I.sections.length} قسم. تحيّن المجلة من صفحة العدد (الأقسام، الترتيب، الصور، الوثائق المدرجة).</p>` : '<p class="muted">لا يوجد أي عدد.</p>'; },
      build: () => ({ page: 'a4', pages: I ? build(I) : [] }),
      fname: () => (I ? `${I.title}_العدد_${I.no}`.replace(/\s+/g, '_') : 'مجلة_المؤسسة')
    });
  };
  window.Mag = { R, build, newIssue };
})();
