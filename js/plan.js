'use strict';
/* برنامج عمل المؤسسة (1.9.4) — the annual action programme of the school: axes, stations, operations, periods, references,
   the signature table of the management council and the references. A ready model (the 2025/2026 programme) is dated for any school year;
   «تحيين» copies the programme of a previous year and moves every date to the new year (years, weekdays) and marks the dated stations to review. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB } = window.K;

  /* ---------- dates: moving a programme to another school year ---------- */
  const MONTHS = [['يناير', 1], ['فبراير', 2], ['مارس', 3], ['أبريل', 4], ['ابريل', 4], ['ماي', 5], ['مايو', 5], ['يونيو', 6], ['يونيه', 6], ['يوليوز', 7], ['يوليو', 7], ['غشت', 8], ['أغسطس', 8],
    ['شتنبر', 9], ['سبتمبر', 9], ['أكتوبر', 10], ['اكتوبر', 10], ['نونبر', 11], ['نوفمبر', 11], ['دجنبر', 12], ['ديسمبر', 12]];
  const WD = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const MRX = MONTHS.map(m => m[0]).join('|');
  const WRX = 'الأحد|الاحد|الإثنين|الاثنين|الثلاثاء|الأربعاء|الاربعاء|الخميس|الجمعة|السبت';
  const monthNo = n => (MONTHS.find(m => m[0] === n) || [0, 0])[1];
  const DATED = new RegExp(`(${MRX})\\s*\\d{4}|\\d{4}\\s*/\\s*\\d{4}`);
  // a text with years: «شتنبر 2025» -> the year of that month in the school year sy (September-December: first year, January-August: second year),
  // «2025/2026» -> sy, «يوم الإثنين 09 شتنبر 2025» -> the right weekday of that date (weekday = true)
  function seasonize(t, sy, weekday) {
    const y1 = MK.syStart(sy);
    t = String(t == null ? '' : t);
    t = t.replace(/(\d{4})\s*\/\s*(\d{4})/g, (m, a, b) => (+b === +a + 1 ? `${y1}/${y1 + 1}` : m));
    if (weekday) {
      t = t.replace(new RegExp(`(${WRX})(\\s+)(\\d{1,2})(\\s+)(${MRX})(\\s*)(\\d{4})`, 'g'), (m, w, s1, d, s2, mo, s3) => {
        const mn = monthNo(mo), yy = mn >= 9 ? y1 : y1 + 1, dt = new Date(yy, mn - 1, +d);
        return dt.getMonth() === mn - 1 ? `${WD[dt.getDay()]}${s1}${d}${s2}${mo}${s3}${yy}` : m;
      });
    }
    return t.replace(new RegExp(`(${MRX})(\\s*)(\\d{4})`, 'g'), (m, mo, sp) => `${mo}${sp}${monthNo(mo) >= 9 ? y1 : y1 + 1}`);
  }

  /* ---------- data ---------- */
  const nid = () => 'p' + Math.random().toString(36).slice(2, 9);
  function migrate(db) {
    const p = db.plan = db.plan || {};
    p.years = p.years && typeof p.years === 'object' ? p.years : {};
  }
  const syLabel = sy => MK.syDash(sy).replace('-', '/');
  const OUTLINE = `# المجال الأول: أنشطة العمل التربوي
- أنشطة العمل التربوي
- منظومة مسار: مسك النقط واستصدار البيانات
- أنشطة الدعم الاجتماعي
- أنشطة العمل التربوي المرتبط بمشروع المؤسسة
# المجال الثاني: الأنشطة المندمجة
- أنشطة التفتح
- أنشطة الدعم
-- الدعم الاجتماعي
-- الدعم التربوي والنفسي
- أنشطة التوجيه التربوي
# المجال الثالث: الأنشطة الموازية
- أنشطة الحياة المدرسية من خلال الأيام الوطنية والدولية`;
  const SIGN_T = 'صادق على البرنامج السنوي أعضاء مجلس التدبير بعد الاطلاع عليه';
  const refsFor = sy => [sy === '2025/2026' ? 'المقرر الوزاري رقم 051-25 بتاريخ 03 يوليوز 2025' : `المقرر الوزاري المنظم للسنة الدراسية ${syLabel(sy)} (رقمه وتاريخه)`,
    'دليل الاحتفال بالأيام الوطنية والعالمية؛', 'المذكرات الوزارية والجهوية والإقليمية.'].join('\n');
  // what only concerns the primary school (exam of the primary certificate, pre-school, level 6) is left out of the model for collège / lycée
  const PRI_ONLY = /الابتدائ|التعليم الأولي|المستوى السادس|السنة الأولى من/;

  function seedYear(sy) {
    const sd = window.PLAN_SEED || { sections: [] };
    const pri = !window.Cyc || Cyc.kind() === 'pri';
    const sz = t => seasonize(t, sy, false);
    const secs = sd.sections.map(s => ({
      id: nid(), h: sz(s.h),
      rows: s.rows.map(r => ({ id: nid(), st: sz(r[0]), ops: (pri ? r[1] : r[1].filter(o => !PRI_ONLY.test(o))).map(sz).join('\n'), per: sz(r[2]), ref: r[3] || '' })).filter(r => r.ops || pri)
    }));
    return { title: 'برنامج العمل السنوي للمؤسسة', outline: OUTLINE, secs, council: null, signOn: true, signT: SIGN_T, refs: refsFor(sy), auto: true, src: '' };
  }
  // the programme of a previous year moved to sy: every date follows the new year, the dated stations are marked «à revoir»
  function updateFrom(f0, srcSy, sy) {
    const f = JSON.parse(JSON.stringify(f0)), wd = srcSy !== sy;
    const sz = t => seasonize(t, sy, wd);
    f.title = sz(f.title); f.outline = sz(f.outline);
    (f.secs || []).forEach(s => {
      s.id = nid(); s.h = sz(s.h);
      (s.rows || []).forEach(r => {
        const dated = DATED.test(r.per || '') || DATED.test(r.ops || '') || DATED.test(r.st || '');
        r.id = nid(); r.st = sz(r.st); r.per = sz(r.per); r.ops = sz(r.ops);
        if (wd && dated) r.rv = 1; else delete r.rv;
      });
    });
    f.council = null; f.auto = false; f.src = srcSy; f.rvRefs = wd;
    return f;
  }
  // the programme of a school year (created on first use: from the latest previous programme edited by the user, otherwise from the ready model)
  function Y(sy) {
    migrate(DB);
    const ys = DB.plan.years;
    if (ys[sy]) return ys[sy];
    const prev = Object.keys(ys).filter(k => k < sy && ys[k] && !ys[k].auto).sort().pop();
    return (ys[sy] = prev ? updateFrom(ys[prev], prev, sy) : seedYear(sy));
  }
  // the members of the management council (from «المجالس التقنية» → تركيبة المجالس)
  function autoCouncil(sy) {
    try { if (window.Council) return Council.comp(sy).mgmt.map(r => [r[0] || '', r[1] || '', r[2] || '', '']); } catch (e) {}
    return [['', '', 'مدير المؤسسة', '']];
  }
  const councilRows = (f, sy) => (Array.isArray(f.council) ? f.council : autoCouncil(sy));

  /* ---------- the document ---------- */
  Dx.modCss += `
  .pl-cover{text-align:center}
  .pl-school{font-weight:700;font-size:14pt;color:#1f3864;margin:3mm 0 0}
  .pl-big{font-family:'MAJT','Amiri',serif;font-weight:700;font-size:34pt;line-height:1.25;color:#000;margin:22mm 4mm 6mm}
  .pl-season{font-size:17pt;margin:0 0 20mm}
  .pl-oh{font-weight:700;font-size:17pt;text-align:center;margin:0 0 5mm}
  .pl-od{font-weight:700;font-size:13pt;text-align:right;text-decoration:underline;text-underline-offset:1.2mm;margin:4mm 0 1.5mm}
  .pl-oi{text-align:right;font-size:12.5pt;padding-right:9mm;line-height:1.7}
  .pl-oi b{display:inline-block;width:6mm;font-weight:700}
  .pl-os{text-align:right;font-size:12pt;padding-right:20mm;line-height:1.6}
  .pl-h{text-align:center;font-weight:700;font-size:14pt;color:#000;margin:3mm 0 2mm;line-height:1.5}
  .tbl.sb-t.pl{font-size:9pt}
  .tbl.sb-t.pl th{background:#8eaadb;color:#000;border-color:#000}
  .tbl.sb-t.pl td{border-color:#000;vertical-align:middle;height:auto;padding:1mm 1.4mm}
  .tbl.sb-t.pl td.c{text-align:center}
  .tbl.sb-t.pl td.b{font-weight:700}
  ul.pl-ops{list-style:none;margin:0;padding:0;text-align:right}
  ul.pl-ops li{position:relative;padding-right:3.5mm;line-height:1.4}
  ul.pl-ops li:before{content:'-';position:absolute;right:0;top:0}
  .tbl.sb-t.plsig td{height:11mm;text-align:center}
  .tbl.sb-t.plsig td.r{text-align:right}
  ul.pl-refs{list-style:none;margin:0;padding:0;text-align:right;font-size:11pt}
  ul.pl-refs li{position:relative;padding-right:5mm;line-height:1.7}
  ul.pl-refs li:before{content:'';position:absolute;right:0;top:2.6mm;width:1.7mm;height:1.7mm;background:#000}
  `;
  const nl = t => esc(t).replace(/\n/g, '<br>');
  const lines = t => String(t || '').split(/\n/).map(x => x.trim()).filter(Boolean);
  function outlineHtml(txt) {
    let h = '', n = 0;
    lines(txt).forEach(l => {
      if (/^#\s*/.test(l)) { n = 0; h += `<div class="pl-od">${esc(l.replace(/^#\s*/, ''))}</div>`; }
      else if (/^--\s*/.test(l)) h += `<div class="pl-os">✓ ${esc(l.replace(/^--\s*/, ''))}</div>`;
      else { n++; h += `<div class="pl-oi"><b>${n}.</b> ${esc(l.replace(/^-\s*/, ''))}</div>`; }
    });
    return h;
  }
  function buildPages(s, sy) {
    const f = Y(sy);
    const cover = `<div class="pl-cover">${Dx.header(s)}${s.headerMode === 'image' && s.school ? `<div class="pl-school">${esc(s.school)}</div>` : ''}
      <div class="pl-big">${esc(f.title || 'برنامج العمل السنوي للمؤسسة')}</div><div class="pl-season">الموسم الدراسي ${esc(syLabel(sy))}</div>
      <div class="pl-oh">محاور برنامج العمل السنوي</div>${outlineHtml(f.outline)}</div>`;
    const blocks = [];
    const cg = '<colgroup><col style="width:17%"><col style="width:51%"><col style="width:16%"><col style="width:16%"></colgroup>';
    (f.secs || []).forEach(sec => {
      blocks.push({ html: `<div class="pl-h">${esc(sec.h)}</div>`, keepNext: true });
      blocks.push({ table: { cls: 'sb-t pl', colgroup: cg, head: '<tr><th>المحطة</th><th>العمليات والأنشطة المبرمجة</th><th>فترة الإنجاز</th><th>المرجع</th></tr>',
        rows: (sec.rows || []).map(r => `<tr><td class="c b">${nl(r.st)}</td><td class="r"><ul class="pl-ops">${lines(r.ops).map(o => `<li>${esc(o)}</li>`).join('')}</ul></td><td class="c">${nl(r.per)}</td><td class="c" style="font-size:8pt">${nl(r.ref)}</td></tr>`) } });
    });
    if (f.signOn !== false) {
      const rows = councilRows(f, sy);
      blocks.push({ html: `<div class="pl-h">${esc(f.signT || SIGN_T)}</div>`, keepNext: true });
      blocks.push({ table: { cls: 'sb-t plsig', colgroup: '<colgroup><col style="width:5%"><col style="width:25%"><col style="width:15%"><col style="width:25%"><col style="width:15%"><col style="width:15%"></colgroup>',
        head: '<tr><th>ر. ت</th><th>الاسم والنسب</th><th>رقم التأجير</th><th>بصفته</th><th>التوقيع</th><th>ملاحظات</th></tr>',
        rows: rows.map((r, i) => `<tr><td>${i + 1}</td><td>${esc(r[0])}</td><td>${esc(r[1])}</td><td>${esc(r[2])}</td><td></td><td>${esc(r[3] || '')}</td></tr>`) } });
    }
    if (lines(f.refs).length) blocks.push({ html: `<div class="pl-h" style="text-align:right;margin-top:5mm">المراجع:</div><ul class="pl-refs">${lines(f.refs).map(x => `<li>${esc(x)}</li>`).join('')}</ul>` });
    const body = MK.flowPages({ page: 'a4', cls: 'sb', head: '', blocks });
    return [cover].concat(body);
  }

  /* ---------- the page: editor on the right, preview on the left ---------- */
  function formUi(box, st, refresh) {
    let rt = null, sv = null;
    const touch = () => { const f = Y(st.sy); f.auto = false; clearTimeout(sv); sv = setTimeout(() => persist(), 300); };
    const later = () => { touch(); clearTimeout(rt); rt = setTimeout(refresh, 350); };
    const now = () => { touch(); refresh(); };
    const years = () => Object.keys(DB.plan.years).filter(k => k !== st.sy).sort().reverse();
    const draw = () => {
      const f = Y(st.sy), sc = box.scrollTop, others = years();
      const rowH = (si, r, ri, n) => `<div class="pl-row${r.rv ? ' rv' : ''}" data-s="${si}" data-r="${ri}">
        <div class="pl-rh"><span class="n">${ri + 1}</span><input class="inp" data-f="st" value="${esc(r.st)}" placeholder="المحطة">
          <button type="button" class="btn sm icon" data-a="rUp" title="أعلى" ${ri ? '' : 'disabled'}>▲</button><button type="button" class="btn sm icon" data-a="rDn" title="أسفل" ${ri < n - 1 ? '' : 'disabled'}>▼</button><button type="button" class="btn sm danger icon" data-a="rDel" title="حذف المحطة">✕</button></div>
        <textarea class="inp" data-f="ops" rows="${Math.min(9, Math.max(2, lines(r.ops).length + 1))}" placeholder="العمليات والأنشطة المبرمجة — سطر لكل عملية">${esc(r.ops)}</textarea>
        <div class="pl-r2"><input class="inp" data-f="per" value="${esc(r.per)}" placeholder="فترة الإنجاز"><textarea class="inp" data-f="ref" rows="2" placeholder="المرجع (سطر لكل مرجع)">${esc(r.ref)}</textarea></div>
        ${r.rv ? '<div class="pl-rvb"><span>📅 راجع التاريخ حسب المقرر الوزاري لهذا الموسم</span><button type="button" class="btn sm" data-a="rOk">تمت المراجعة</button></div>' : ''}</div>`;
      const nrv = (f.secs || []).reduce((a, s) => a + (s.rows || []).filter(r => r.rv).length, 0);
      box.innerHTML = `<div class="sec-t">برنامج عمل المؤسسة</div>
        <div class="fld"><label>الموسم الدراسي</label><select class="inp" id="plSy">${MK.syList(Object.keys(DB.plan.years)).map(y => `<option value="${y}" ${y === st.sy ? 'selected' : ''}>${MK.syDash(y)}${DB.plan.years[y] && !DB.plan.years[y].auto ? ' ●' : ''}</option>`).join('')}</select></div>
        <p class="muted" style="font-size:12px;line-height:1.8;margin:2px 0 8px">${f.src ? `حُيِّن هذا البرنامج من برنامج الموسم ${esc(syLabel(f.src))}: التواريخ والسنوات والأيام تتبع الموسم الحالي. ${nrv ? `راجع <b>${nrv}</b> محطة معلَّمة 📅 ` : ''}${f.rvRefs ? 'وسطر المقرر الوزاري في «المراجع».' : ''}` : f.auto ? 'نموذج جاهز (برنامج 2025/2026 محيَّن إلى هذا الموسم): عدّل ما يلزم وسيُحفظ تلقائيا. التواريخ تقريبية، فراجعها حسب المقرر الوزاري لتنظيم السنة الدراسية.' : 'برنامج معدَّل ومحفوظ. يمكنك تحيينه في الموسم الموالي بضغطة واحدة.'}</p>
        <div class="pl-upd"><label>تحيين من</label><select class="inp" id="plSrc"><option value="seed">النموذج الجاهز</option>${others.map(k => `<option value="${k}" ${k === others[0] ? 'selected' : ''}>برنامج ${MK.syDash(k)}</option>`).join('')}</select>
          <button type="button" class="btn sm pri" data-a="upd">${ic('hist')} تحيين إلى ${MK.syDash(st.sy)}</button></div>
        <div class="fld"><label>عنوان الوثيقة</label><input class="inp" data-k="title" value="${esc(f.title || '')}"></div>
        <div class="fld"><label>محاور البرنامج (صفحة الغلاف)</label><textarea class="inp" data-k="outline" rows="9">${esc(f.outline || '')}</textarea>
          <span class="hint">سطر «# ...» = عنوان مجال، «- ...» = محور مرقّم، «-- ...» = فقرة فرعية</span></div>
        <div class="sec-t" style="margin-top:12px">المحاور والجداول</div>
        ${(f.secs || []).map((s, si) => `<details class="pl-sec" data-s="${si}" ${st.open[s.id] ? 'open' : ''}><summary>${esc(s.h || 'محور بلا عنوان')} <span class="muted">— ${(s.rows || []).length} محطة</span></summary>
          <div class="pl-sb"><div class="fld"><label>عنوان المحور</label><input class="inp" data-sf="h" value="${esc(s.h)}"></div>
          ${(s.rows || []).map((r, ri) => rowH(si, r, ri, s.rows.length)).join('')}
          <div class="btn-row"><button type="button" class="btn sm" data-a="rAdd">${ic('plus')} إضافة محطة</button><span class="sp"></span>
            <button type="button" class="btn sm icon" data-a="sUp" title="تقديم المحور" ${si ? '' : 'disabled'}>▲</button><button type="button" class="btn sm icon" data-a="sDn" title="تأخير المحور" ${si < f.secs.length - 1 ? '' : 'disabled'}>▼</button><button type="button" class="btn sm danger" data-a="sDel">${ic('trash')} حذف المحور</button></div></div></details>`).join('')}
        <div class="btn-row" style="margin:8px 0 4px"><button type="button" class="btn sm" data-a="sAdd">${ic('plus')} إضافة محور جديد</button></div>
        <div class="sec-t" style="margin-top:12px">المصادقة والمراجع</div>
        <label class="chk" style="display:block;margin:4px 0 8px"><input type="checkbox" data-k="signOn" ${f.signOn !== false ? 'checked' : ''}> إدراج جدول مصادقة أعضاء مجلس التدبير</label>
        ${f.signOn !== false ? `<div class="fld"><label>عنوان جدول المصادقة</label><input class="inp" data-k="signT" value="${esc(f.signT || SIGN_T)}"></div>
          ${Array.isArray(f.council) ? `<div class="pl-cn">${f.council.map((r, i) => `<div class="pl-cr" data-c="${i}"><input class="inp" data-cc="0" list="k2Emps" value="${esc(r[0])}" placeholder="الاسم والنسب"><input class="inp" data-cc="1" value="${esc(r[1])}" placeholder="رقم التأجير"><input class="inp" data-cc="2" value="${esc(r[2])}" placeholder="بصفته"><button type="button" class="btn sm danger icon" data-a="cDel">✕</button></div>`).join('')}</div>
            <div class="btn-row"><button type="button" class="btn sm" data-a="cAdd">${ic('plus')} إضافة عضو</button><button type="button" class="btn sm" data-a="cAuto">${ic('hist')} إعادة التعبئة من تركيبة المجالس</button></div>`
            : `<p class="muted" style="font-size:12px;line-height:1.8;margin:2px 0 6px">${ic('check')} يُملأ تلقائيا من «المجالس التقنية ← تركيبة المجالس» (${councilRows(f, st.sy).filter(r => r[0]).length} عضوا مسمّى).</p><div class="btn-row"><button type="button" class="btn sm" data-a="cEdit">${ic('edit')} تخصيص الجدول</button></div>`}` : ''}
        <div class="fld"><label>المراجع (سطر لكل مرجع)</label><textarea class="inp" data-k="refs" rows="4">${esc(f.refs || '')}</textarea></div>
        <div class="btn-row" style="margin-top:10px"><button type="button" class="btn sm danger" data-a="reset">${ic('hist')} العودة إلى النموذج الجاهز</button></div>
        <datalist id="k2Emps">${K.PP.options('k2Emps')}</datalist>`;
      box.scrollTop = sc;
    };
    box.addEventListener('toggle', e => { const d = e.target; if (d && d.classList && d.classList.contains('pl-sec')) { const s = Y(st.sy).secs[+d.dataset.s]; if (s) st.open[s.id] = d.open; } }, true);
    box.oninput = e => {
      const el = e.target, ds = el.dataset, f = Y(st.sy);
      if (ds.k && el.type !== 'checkbox') { f[ds.k] = el.value; return later(); }
      if (ds.sf) { const si = +el.closest('.pl-sec').dataset.s; f.secs[si][ds.sf] = el.value; const sm = el.closest('.pl-sec').querySelector('summary'); if (sm) sm.firstChild.textContent = (el.value || 'محور بلا عنوان') + ' '; return later(); }
      if (ds.f) {
        const rw = el.closest('.pl-row'), r = f.secs[+rw.dataset.s].rows[+rw.dataset.r];
        r[ds.f] = el.value;
        if (r.rv && (ds.f === 'per' || ds.f === 'ops')) { delete r.rv; rw.classList.remove('rv'); const b = rw.querySelector('.pl-rvb'); if (b) b.remove(); }
        return later();
      }
      if (ds.cc != null) { const i = +el.closest('.pl-cr').dataset.c; f.council[i][+ds.cc] = el.value; return later(); }
    };
    box.onchange = e => {
      const el = e.target, ds = el.dataset, f = Y(st.sy);
      if (el.id === 'plSy') { st.sy = el.value; st.open = {}; draw(); return refresh(); }
      if (ds.k === 'signOn') { f.signOn = el.checked; draw(); return now(); }
      if (ds.cc === '0') { // a name picked from the employees list fills the PPR
        const i = +el.closest('.pl-cr').dataset.c, emp = K.E.byName(el.value);
        if (emp) { f.council[i][0] = el.value; f.council[i][1] = emp.ppr || f.council[i][1]; if (!f.council[i][2]) f.council[i][2] = emp.cadre || ''; draw(); now(); }
      }
    };
    box.onclick = async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      const a = b.dataset.a, f = Y(st.sy), sec = b.closest('.pl-sec'), si = sec ? +sec.dataset.s : -1, rw = b.closest('.pl-row'), ri = rw ? +rw.dataset.r : -1;
      const mv = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return false; arr.splice(j, 0, arr.splice(i, 1)[0]); return true; };
      if (a === 'rAdd') { const s = f.secs[si]; s.rows.push({ id: nid(), st: '', ops: '', per: '', ref: '' }); st.open[s.id] = true; draw(); now(); const ins = box.querySelectorAll(`.pl-sec[data-s="${si}"] .pl-row`); const last = ins[ins.length - 1]; if (last) { last.scrollIntoView({ block: 'center' }); const i0 = last.querySelector('input'); if (i0) i0.focus(); } }
      else if (a === 'rDel') { if (!(await confirmBox('حذف هذه المحطة من البرنامج؟', 'حذف'))) return; f.secs[si].rows.splice(ri, 1); draw(); now(); }
      else if (a === 'rUp' || a === 'rDn') { if (mv(f.secs[si].rows, ri, a === 'rUp' ? -1 : 1)) { draw(); now(); } }
      else if (a === 'rOk') { delete f.secs[si].rows[ri].rv; draw(); now(); }
      else if (a === 'sAdd') { const s = { id: nid(), h: 'محور جديد', rows: [{ id: nid(), st: '', ops: '', per: '', ref: '' }] }; f.secs.push(s); st.open[s.id] = true; draw(); now(); }
      else if (a === 'sDel') { if (!(await confirmBox('حذف هذا المحور وجميع محطاته؟', 'حذف'))) return; f.secs.splice(si, 1); draw(); now(); }
      else if (a === 'sUp' || a === 'sDn') { if (mv(f.secs, si, a === 'sUp' ? -1 : 1)) { draw(); now(); } }
      else if (a === 'cEdit') { f.council = autoCouncil(st.sy); draw(); now(); }
      else if (a === 'cAuto') { if (!(await confirmBox('استبدال الجدول بتركيبة مجلس التدبير الحالية؟', 'إعادة التعبئة'))) return; f.council = null; draw(); now(); }
      else if (a === 'cAdd') { f.council.push(['', '', '', '']); draw(); now(); }
      else if (a === 'cDel') { f.council.splice(+b.closest('.pl-cr').dataset.c, 1); draw(); now(); }
      else if (a === 'upd') {
        const src = $('#plSrc', box).value;
        if (!(await confirmBox(`استبدال برنامج الموسم ${syLabel(st.sy)} الحالي ببرنامج ${src === 'seed' ? 'النموذج الجاهز' : 'الموسم ' + syLabel(src)} محيَّنا؟ ستُفقد التعديلات الحالية.`, 'تحيين'))) return;
        DB.plan.years[st.sy] = src === 'seed' ? Object.assign(seedYear(st.sy), { auto: false }) : updateFrom(DB.plan.years[src], src, st.sy);
        st.open = {}; draw(); now(); toast('تم تحيين البرنامج');
      }
      else if (a === 'reset') {
        if (!(await confirmBox('العودة إلى النموذج الجاهز؟ ستُفقد جميع تعديلاتك على برنامج هذا الموسم.', 'العودة'))) return;
        DB.plan.years[st.sy] = seedYear(st.sy); st.open = {}; draw(); persist(); refresh();
      }
    };
    draw();
  }
  window.pagePlan = function (v, arg) {
    migrate(DB);
    MK.docPage(v, {
      title: 'برنامج عمل المؤسسة', icon: '🗓️', modes: false, flow: true,
      state: { sy: (arg && arg.sy) || MK.curSy(), open: {} },
      back: () => go('board'),
      form: formUi,
      build: st => ({ page: 'a4', pages: buildPages(S(), st.sy) }),
      fname: st => `برنامج_عمل_المؤسسة_${MK.syDash(st.sy)}`
    });
  };
  window.Plan = { migrate, seasonize, seedYear, updateFrom, year: Y, summary: () => { migrate(DB); const f = Y(MK.curSy()); return { stations: (f.secs || []).reduce((a, s) => a + (s.rows || []).length, 0), sections: (f.secs || []).length }; } };
})();
