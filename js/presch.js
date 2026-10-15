'use strict';
/* 1.9.4 — الموظفون ← «مربو التعليم الأولي»: بطاقات مربيات ومربي التعليم الأولي (رقم البطاقة الوطنية، الجمعية / المؤسسة المشغلة:
   المؤسسة المغربية للنهوض بالتعليم الأولي، مؤسسة زاكورة أو أي مؤسسة أخرى تكتب يدويا، الشهادات الجامعية)، ربطهم بالوحدات المدرسية
   المسجلة في الإعدادات، استعمالات الزمن الخاصة بهم، ولائحة أطفال التعليم الأولي لكل مرب(ية). استيراد اللائحة المصدرة من منظومة مسار
   (المديرية الإقليمية، جماعة، رمز المؤسسة، المؤسسة، نوع المؤسسة، الإسم الكامل، ر.ب.و، الجنس، تاريخ الإزدياد، الهاتف المحمول، البريد الإلكتروني).
   The educators are employees (DB.employees, cat 'preschool'), so they appear in the reference board, the gallery of photo cards, the
   congratulations... Extra fields: org, degs [{ t, spec, year, inst }], levels (sections), tt { slots [], cells { 'd|i': text } }, pre { dir, commune, code, type } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const ORGS = ['المؤسسة المغربية للنهوض بالتعليم الأولي', 'مؤسسة زاكورة للتربية'];
  const ORG_SH = o => (/النهوض/.test(o) ? 'FMPS' : /زاكورة/.test(o) ? 'زاكورة' : o);
  const DEGS = ['الباكالوريا', 'دبلوم الدراسات الجامعية العامة (DEUG)', 'الإجازة', 'الإجازة المهنية', 'الماستر', 'الماستر المتخصص', 'الدكتوراه', 'دبلوم التقني المتخصص', 'شهادة التأهيل المهني في التعليم الأولي'];
  const DAYS = ['الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const SLOTS0 = ['08:30 - 09:30', '09:30 - 10:30', '10:45 - 11:45', '14:30 - 15:30', '15:30 - 16:30'];
  const ACTS = ['الاستقبال والأنشطة الحرة', 'التعبير الشفهي واللغة', 'الأنشطة الرياضية / الحركية', 'التفتح الحسي والحركي', 'الأنشطة الفنية والتشكيلية', 'الرياضيات (الأعداد والأشكال)', 'التربية الإسلامية', 'اللغة الفرنسية', 'اللغة الأمازيغية', 'القصة والحكاية', 'الألعاب التربوية', 'الإيقاع والأناشيد', 'الاستراحة', 'التقويم والحصيلة'];
  const fullN = e => (Dx.fullName ? Dx.fullName(e) : [e.firstAr, e.lastAr].filter(Boolean).join(' '));
  const isEd = e => e && (e.cat === 'preschool' || (!e.cat && window.K && K.E && K.E.cat(e) === 'preschool'));
  const eds = () => (DB.employees || []).filter(isEd).sort((a, b) => String(a.unit || '').localeCompare(String(b.unit || ''), 'ar') || fullN(a).localeCompare(fullN(b), 'ar'));
  const ld = iso => (iso ? (window.K && K.ldate ? K.ldate(iso) : iso) : '');
  const gAr = (g, f) => (g === 'F' ? (f || 'أنثى') : g === 'M' ? 'ذكر' : '');
  const sameU = (a, b) => (window.K && K.U ? K.U.same(a, b) : nm(a) === nm(b));
  const secs = e => String(e.levels || '').split(/[،,;\/]+/).map(nm).filter(Boolean);
  const st = { unit: '', org: '' };

  /* ---------- children of an educator: pre-school pupils of the unit (and of the sections given to him/her) ---------- */
  const preKids = sy => (window.Pupils && Pupils.people ? Pupils.people(sy || MK.curSy()).filter(p => p.pre) : []);
  function kidsOf(e, sy) {
    const S2 = secs(e), L = preKids(sy).filter(p => !e.unit || sameU(p.unit, e.unit));
    if (S2.length) { const f = L.filter(p => S2.some(s => nm(p.cls) === s || nm(p.lvlSh) === s)); if (f.length) return f; }
    // several educators in the unit with no sections: they share the children
    return L;
  }

  /* ---------- form ---------- */
  function form(e0, done) {
    const e = e0 ? JSON.parse(JSON.stringify(e0)) : { id: uid('e'), firstAr: '', lastAr: '', cin: '', sex: 'F', birth: '', phone: '', email: '', unit: (K.U.names()[0] || ''), org: ORGS[0], degs: [], levels: '', cat: 'preschool', cadre: 'مربية التعليم الأولي' };
    e.degs = Array.isArray(e.degs) ? e.degs : [];
    const b = document.createElement('div');
    const isOther = () => e.org && !ORGS.includes(e.org);
    const draw = () => {
      const units = K.U.names();
      b.innerHTML = `<div class="fgrid">
        <div class="fld"><label>الاسم العائلي</label><input class="inp" data-f="lastAr" value="${esc(e.lastAr)}"></div>
        <div class="fld"><label>الاسم الشخصي</label><input class="inp" data-f="firstAr" value="${esc(e.firstAr)}"></div>
        <div class="fld"><label>رقم البطاقة الوطنية (ر.ب.و)</label><input class="inp" data-f="cin" dir="ltr" value="${esc(e.cin)}"></div>
        <div class="fld"><label>الجنس</label><select class="inp" data-f="sex"><option value="F" ${e.sex === 'F' ? 'selected' : ''}>أنثى</option><option value="M" ${e.sex === 'M' ? 'selected' : ''}>ذكر</option></select></div>
        <div class="fld"><label>تاريخ الازدياد</label><input class="inp" type="date" data-f="birth" value="${esc(e.birth)}"></div>
        <div class="fld"><label>الهاتف المحمول</label><input class="inp" data-f="phone" dir="ltr" value="${esc(e.phone)}"></div>
        <div class="fld"><label>البريد الإلكتروني</label><input class="inp" data-f="email" dir="ltr" value="${esc(e.email)}"></div>
        <div class="fld"><label>تاريخ الالتحاق بالمؤسسة</label><input class="inp" type="date" data-f="affDate" value="${esc(e.affDate || '')}"></div>
        <div class="fld"><label>الوحدة المدرسية</label>${K.unitSelect('data-f="unit"', e.unit)}<span class="hint">الوحدات المدرسية المسجلة في الإعدادات فقط (مع رمز GRESA)</span></div>
        <div class="fld"><label>الأقسام / الأفواج المسندة (اختياري)</label><input class="inp" data-f="levels" value="${esc(e.levels)}" placeholder="مثال: الأولى أولي، الثانية أولي"></div>
        <div class="fld"><label>المؤسسة / الجمعية المشغلة</label><select class="inp" id="psOrg">${ORGS.map(o => `<option ${o === e.org ? 'selected' : ''}>${esc(o)}</option>`).join('')}<option value="__o" ${isOther() || !e.org ? 'selected' : ''}>مؤسسة أخرى (تكتب يدويا)</option></select></div>
        <div class="fld" id="psOrgO" style="${isOther() || !e.org ? '' : 'display:none'}"><label>اسم المؤسسة / الجمعية</label><input class="inp" id="psOrgT" value="${esc(isOther() ? e.org : '')}"></div>
        <div class="fld"><label>رقم العقد / التسجيل (اختياري)</label><input class="inp" data-f="contract" dir="ltr" value="${esc(e.contract || '')}"></div>
        <div class="fld"><label>تاريخ بداية العقد</label><input class="inp" type="date" data-f="hire" value="${esc(e.hire || '')}"></div></div>
        <div class="sec-t" style="margin-top:10px">الشهادات الجامعية والمهنية المحصل عليها</div>
        <table class="tbl compact"><thead><tr><th>الشهادة</th><th>التخصص</th><th>السنة</th><th>المؤسسة الجامعية</th><th></th></tr></thead><tbody>
        ${e.degs.map((d, i) => `<tr><td><input class="inp" list="psDg" data-d="${i}" data-k="t" value="${esc(d.t)}"></td><td><input class="inp" data-d="${i}" data-k="spec" value="${esc(d.spec)}"></td><td><input class="inp" data-d="${i}" data-k="year" dir="ltr" style="width:80px" value="${esc(d.year)}"></td><td><input class="inp" data-d="${i}" data-k="inst" value="${esc(d.inst)}"></td><td><button class="btn sm danger" data-dd="${i}">${ic('trash')}</button></td></tr>`).join('')}
        </tbody></table><button class="btn sm" id="psDA" style="margin-top:6px">${ic('plus')} إضافة شهادة</button>${K.dl('psDg', DEGS)}`;
      $$('[data-f]', b).forEach(el => el.oninput = el.onchange = () => { e[el.dataset.f] = el.value; });
      $$('[data-d]', b).forEach(el => el.oninput = () => { e.degs[+el.dataset.d][el.dataset.k] = el.value; });
      $$('[data-dd]', b).forEach(x => x.onclick = () => { e.degs.splice(+x.dataset.dd, 1); draw(); });
      $('#psDA', b).onclick = () => { e.degs.push({ t: '', spec: '', year: '', inst: '' }); draw(); };
      $('#psOrg', b).onchange = ev => { if (ev.target.value === '__o') { e.org = nm($('#psOrgT', b).value); $('#psOrgO', b).style.display = ''; } else { e.org = ev.target.value; $('#psOrgO', b).style.display = 'none'; } };
      $('#psOrgT', b).oninput = ev => { e.org = ev.target.value; };
    };
    draw();
    modal({ title: e0 ? 'تعديل بطاقة المربي(ة)' : 'إضافة مرب(ية) للتعليم الأولي', size: 'lg', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (!nm(e.lastAr) && !nm(e.firstAr)) { toast('اكتب الاسم', true); return false; }
      e.cat = 'preschool'; e.cadre = e.cadre && /مربي|أولي/.test(e.cadre) ? e.cadre : (e.sex === 'M' ? 'مربي التعليم الأولي' : 'مربية التعليم الأولي');
      e.degs = e.degs.filter(d => nm(d.t) || nm(d.spec));
      if (e.unit && K.U.canon) e.unit = K.U.canon(e.unit);
      const L = DB.employees, i = L.findIndex(x => x.id === e.id); if (i >= 0) L[i] = Object.assign(L[i], e); else L.push(e);
      persist(); done();
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- timetable editor ---------- */
  function ttOf(e) { const t = e.tt && typeof e.tt === 'object' ? e.tt : {}; return { slots: Array.isArray(t.slots) && t.slots.length ? t.slots.slice() : SLOTS0.slice(), cells: Object.assign({}, t.cells || {}), days: Array.isArray(t.days) && t.days.length ? t.days.slice() : DAYS.slice(0, 5) }; }
  function ttForm(e, done) {
    const t = ttOf(e), b = document.createElement('div');
    const draw = () => {
      b.innerHTML = `<p class="muted" style="margin:0 0 8px;line-height:1.8">اكتب الأنشطة في الخانات (أو اخترها من القائمة). يمكن تعديل الحصص الزمنية وإضافة حصة أو يوم السبت.</p>
        <div style="margin-bottom:8px">${DAYS.map(d => `<label class="chk" style="margin-left:10px"><input type="checkbox" data-day="${d}" ${t.days.includes(d) ? 'checked' : ''}> ${d}</label>`).join('')}</div>
        <div style="overflow:auto"><table class="tbl compact ps-tt"><thead><tr><th>الحصة</th>${t.days.map(d => `<th>${d}</th>`).join('')}<th></th></tr></thead><tbody>
        ${t.slots.map((s, i) => `<tr><td><input class="inp" data-sl="${i}" dir="ltr" value="${esc(s)}" style="width:118px"></td>${t.days.map(d => `<td><input class="inp" list="psAc" data-c="${d}|${i}" value="${esc(t.cells[d + '|' + i] || '')}"></td>`).join('')}<td><button class="btn sm danger" data-sd="${i}">${ic('trash')}</button></td></tr>`).join('')}
        </tbody></table></div><button class="btn sm" id="psSA" style="margin-top:6px">${ic('plus')} إضافة حصة</button>${K.dl('psAc', ACTS)}`;
      $$('[data-sl]', b).forEach(x => x.oninput = () => { t.slots[+x.dataset.sl] = x.value; });
      $$('[data-c]', b).forEach(x => x.oninput = () => { t.cells[x.dataset.c] = x.value; });
      $$('[data-sd]', b).forEach(x => x.onclick = () => { const i = +x.dataset.sd; t.slots.splice(i, 1); const c = {}; Object.keys(t.cells).forEach(k => { const [d, j] = k.split('|'); if (+j < i) c[k] = t.cells[k]; else if (+j > i) c[d + '|' + (+j - 1)] = t.cells[k]; }); t.cells = c; draw(); });
      $$('[data-day]', b).forEach(x => x.onchange = () => { t.days = DAYS.filter(d => d === x.dataset.day ? x.checked : t.days.includes(d)); draw(); });
      $('#psSA', b).onclick = () => { t.slots.push(''); draw(); };
    };
    draw();
    modal({ title: 'استعمال الزمن — ' + fullN(e), size: 'xl', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => { e.tt = t; persist(); done(); } }, { label: 'إلغاء' }] });
  }

  /* ---------- import of the list exported from Massar (or pasted) ---------- */
  const HD = { dir: ['المديرية الإقليمية', 'المديرية'], commune: ['جماعة', 'الجماعة'], code: ['رمز المؤسسة'], school: ['المؤسسة', 'اسم المؤسسة'], type: ['نوع المؤسسة'], name: ['الإسم الكامل', 'الاسم الكامل', 'الإسم والنسب', 'الاسم والنسب'],
    cin: ['ر.ب.و', 'ر ب و', 'رقم البطاقة الوطنية', 'رقم البطاقة الوطنية للتعريف', 'cin'], sex: ['الجنس', 'النوع'], birth: ['تاريخ الإزدياد', 'تاريخ الازدياد'], phone: ['الهاتف المحمول', 'الهاتف'], email: ['البريد الإلكتروني', 'البريد الالكتروني', 'email'],
    org: ['المؤسسة المشغلة', 'الجمعية', 'الشريك', 'الجهة المشغلة'], last: ['النسب', 'الإسم العائلي'], first: ['الإسم', 'الإسم الشخصي'] };
  const nh = h => (typeof normHead === 'function' ? normHead(h) : String(h || '').replace(/[إأآ]/g, 'ا').replace(/\s+/g, ' ').trim());
  function headIdx(row) {
    const m = {}; (row || []).forEach((c, i) => { const n = nh(c); if (!n) return; Object.entries(HD).forEach(([k, arr]) => { if (m[k] == null && arr.some(t => nh(t) === n)) m[k] = i; }); });
    return (m.name != null || m.last != null) && (m.cin != null || m.birth != null || m.school != null) ? m : null;
  }
  const isoD = v => { const s = nm(v); let m; if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; if (/^\d{5}(\.\d+)?$/.test(s)) { const d = new Date(Math.round((+s - 25569) * 864e5)); return isNaN(d) ? '' : d.toISOString().slice(0, 10); } return s; };
  function parseRows(rows) {
    const out = []; let m = null;
    (rows || []).forEach(r => {
      const h = headIdx(r); if (h) { m = h; return; } if (!m) return;
      const g = k => (m[k] == null ? '' : nm(r[m[k]]));
      let last = g('last'), first = g('first');
      if (!last && !first) { const p = g('name').split(/\s+/).filter(Boolean); if (!p.length) return; last = p[0]; first = p.slice(1).join(' '); }
      if (!last && !first) return;
      out.push({ lastAr: last, firstAr: first, cin: g('cin').toUpperCase(), sex: /أنث|انث|^f/i.test(g('sex')) ? 'F' : /ذكر|^m/i.test(g('sex')) ? 'M' : '', birth: isoD(g('birth')), phone: g('phone').replace(/\s/g, ''), email: g('email'),
        unit: g('school'), org: g('org'), pre: { dir: g('dir').replace(/^عمالة\s*:?\s*/, ''), commune: g('commune'), code: g('code'), type: g('type') } });
    });
    return out;
  }
  function merge(list, org) {
    let n = 0, u = 0;
    list.forEach(x => {
      if (x.unit && K.U.canon) { const R0 = K.U.names(), c = K.U.canon(x.unit); x.unit = R0.includes(c) ? c : (R0.length && nh(x.unit.replace(/^(م\/م|مدرسة|م\.م)\s*/, '')) === nh(String(S().school || '').replace(/^(م\/م|مدرسة|م\.م)\s*/, '')) ? (R0.find(u => /مركز/.test(u)) || R0[0]) : c); }
      const key = nm(x.cin).toUpperCase(), byName = nh(x.lastAr + ' ' + x.firstAr);
      let e = (DB.employees || []).find(y => (key && nm(y.cin).toUpperCase() === key) || (!key && nh((y.lastAr || '') + ' ' + (y.firstAr || '')) === byName));
      const vals = Object.assign({}, x, { org: x.org || org || '', cat: 'preschool', cadre: x.sex === 'M' ? 'مربي التعليم الأولي' : 'مربية التعليم الأولي' });
      if (e) { Object.keys(vals).forEach(k => { if (vals[k] && (typeof vals[k] !== 'object' || Object.values(vals[k]).some(Boolean))) e[k] = vals[k]; }); u++; }
      else { DB.employees.push(Object.assign({ id: uid('e'), degs: [] }, vals)); n++; }
    });
    persist(); return { n, u };
  }
  function importDlg(done) {
    const b = document.createElement('div');
    b.innerHTML = `<p style="line-height:1.85;margin-top:0">استورد لائحة المربين المصدرة من منظومة مسار (Excel) أو الصق الجدول مباشرة بعد نسخه من الصفحة. الأعمدة المعتمدة:
      <b>المديرية الإقليمية، جماعة، رمز المؤسسة، المؤسسة، نوع المؤسسة، الإسم الكامل، ر.ب.و، الجنس، تاريخ الإزدياد، الهاتف المحمول، البريد الإلكتروني</b>. تربط «المؤسسة» تلقائيا بالوحدة المدرسية المسجلة في الإعدادات، ويحيّن المربي(ة) الموجود(ة) سابقا حسب رقم البطاقة الوطنية.</p>
      <div class="fld"><label>المؤسسة / الجمعية المشغلة (للائحة المستوردة)</label><input class="inp" id="psIO" list="psIOl" value="${esc(ORGS[0])}">${K.dl('psIOl', ORGS)}</div>
      <div class="fld"><label>أو الصق اللائحة هنا (منسوخة من مسار أو Excel، مع سطر العناوين)</label><textarea class="inp" id="psIT" rows="6" dir="rtl" placeholder="المديرية الإقليمية	جماعة	رمز المؤسسة	المؤسسة	..."></textarea></div>`;
    const finish = list => { if (!list.length) { toast('لم يتم العثور على سطر العناوين (الإسم الكامل، ر.ب.و...) أو على أي مرب(ية)', true); return false; } const r = merge(list, nm($('#psIO', b).value)); toast(`تم استيراد ${r.n} مرب(ية) جديد(ة)${r.u ? ` وتحيين ${r.u}` : ''}`); done(); return true; };
    modal({ title: 'استيراد لائحة مربي التعليم الأولي', size: 'lg', body: b, actions: [
      { label: ic('up') + ' اختيار ملف Excel', cls: 'pri', onClick: async () => { const sh = await MK.openTable(); if (!sh) return false; return finish([].concat(...sh.map(s => parseRows(s.rows)))); } },
      { label: 'استيراد النص الملصق', onClick: () => { const t = $('#psIT', b).value; const rows = t.split(/\r?\n/).map(l => (l.includes('\t') ? l.split('\t') : l.split(/\s{2,}|;/))); return finish(parseRows(rows)); } },
      { label: 'إلغاء' }] });
  }

  /* ---------- page ---------- */
  function filtered() { return eds().filter(e => (!st.unit || sameU(e.unit, st.unit)) && (!st.org || (st.org === '__o' ? !ORGS.includes(e.org) : e.org === st.org))); }
  function page(v) {
    const sy = MK.curSy(), A = eds(), L = filtered(), kids = preKids(sy), units = K.U.names();
    const byOrg = {}; A.forEach(e => { const k = e.org ? ORG_SH(e.org) : 'غير محددة'; byOrg[k] = (byOrg[k] || 0) + 1; });
    const uRows = (units.length ? units : Array.from(new Set(A.map(e => e.unit).filter(Boolean)))).map(u => { const E = A.filter(e => sameU(e.unit, u)), K2 = kids.filter(p => sameU(p.unit, u)); return { u, e: E.length, k: K2.length, f: K2.filter(p => p.g === 'F').length, ps1: K2.filter(p => p.lvl === 'PS1').length, ps2: K2.filter(p => p.lvl === 'PS2').length }; }).filter(r => r.e || r.k);
    v.innerHTML = `<div class="page-h"><h1>مربو التعليم الأولي</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="psImp">${ic('up')} استيراد لائحة مسار</button><button class="btn" id="psDoc">${ic('print')} الوثائق</button><button class="btn pri" id="psAdd">${ic('plus')} إضافة مرب(ية)</button></div>
      <div class="att-kpis big" style="margin-bottom:10px"><span>المربون: <b>${A.length}</b> (إناث ${A.filter(e => e.sex === 'F').length})</span>${Object.entries(byOrg).map(([k, n]) => `<span>${esc(k)}: <b>${n}</b></span>`).join('')}<span>أطفال التعليم الأولي: <b>${kids.length}</b></span><span>معدل الأطفال لكل مرب(ية): <b>${A.length ? Math.round(kids.length / A.length * 10) / 10 : '—'}</b></span></div>
      ${uRows.length ? `<div class="card" style="margin-bottom:10px"><div class="card-h"><h3>التوزيع حسب الوحدات المدرسية</h3></div><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>الوحدة المدرسية</th><th>المربون</th><th>الأطفال</th><th>منهم إناث</th><th>الأولى أولي</th><th>الثانية أولي</th></tr></thead><tbody>${uRows.map(r => `<tr><td class="b">${esc(r.u)}</td><td class="num">${r.e || '<span style="color:#c0392b">0</span>'}</td><td class="num">${r.k}</td><td class="num">${r.f}</td><td class="num">${r.ps1}</td><td class="num">${r.ps2}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="toolbar" style="margin-bottom:8px"><select class="inp" id="psU" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
        <select class="inp" id="psO" style="width:auto"><option value="">كل المؤسسات المشغلة</option>${ORGS.map(o => `<option ${o === st.org ? 'selected' : ''}>${esc(o)}</option>`).join('')}<option value="__o" ${st.org === '__o' ? 'selected' : ''}>مؤسسات أخرى</option></select></div>
      ${L.length ? `<div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th></th><th>الاسم الكامل</th><th>ر.ب.و</th><th>الجنس</th><th>تاريخ الازدياد</th><th>الوحدة المدرسية</th><th>المؤسسة المشغلة</th><th>الشهادات</th><th>الهاتف</th><th>الأطفال</th><th></th></tr></thead><tbody>
        ${L.map(e => `<tr><td>${e.photo ? `<img src="${e.photo}" style="width:30px;height:40px;object-fit:cover;border-radius:4px">` : ''}</td><td class="b">${esc(fullN(e))}</td><td dir="ltr">${esc(e.cin || '')}</td><td>${gAr(e.sex)}</td><td>${esc(ld(e.birth))}</td><td>${esc(e.unit || '')}</td><td>${esc(ORG_SH(e.org || ''))}</td><td style="font-size:12px">${esc((e.degs || []).map(d => d.t + (d.spec ? ' (' + d.spec + ')' : '')).join('، '))}</td><td dir="ltr">${esc(e.phone || '')}</td><td class="num">${kidsOf(e, sy).length}</td>
          <td style="white-space:nowrap"><button class="btn sm" data-ed="${e.id}" title="تعديل">${ic('edit')}</button><button class="btn sm" data-ph="${e.id}" title="الصورة">📷</button><button class="btn sm" data-tt="${e.id}" title="استعمال الزمن">🕘</button><button class="btn sm" data-cd="${e.id}" title="البطاقة">${ic('print')}</button><button class="btn sm danger" data-del="${e.id}">${ic('trash')}</button></td></tr>`).join('')}</tbody></table></div></div>`
        : '<div class="empty-state">لا يوجد مربون مسجلون بعد. أضف المربين أو استورد اللائحة المصدرة من منظومة مسار.</div>'}`;
    const again = () => page(v);
    $('#psAdd', v).onclick = () => form(null, again);
    $('#psImp', v).onclick = () => importDlg(again);
    $('#psDoc', v).onclick = () => go('preschDoc', { kind: 'list' });
    $('#psU', v).onchange = ev => { st.unit = ev.target.value; again(); };
    $('#psO', v).onchange = ev => { st.org = ev.target.value; again(); };
    const by = id => DB.employees.find(x => x.id === id);
    $$('[data-ed]', v).forEach(x => x.onclick = () => form(by(x.dataset.ed), again));
    $$('[data-tt]', v).forEach(x => x.onclick = () => ttForm(by(x.dataset.tt), again));
    $$('[data-cd]', v).forEach(x => x.onclick = () => go('preschDoc', { kind: 'card', id: x.dataset.cd }));
    $$('[data-ph]', v).forEach(x => x.onclick = async () => { const p = window.EmpPhoto ? await EmpPhoto.pick() : null; if (p) { by(x.dataset.ph).photo = p; persist(); again(); } });
    $$('[data-del]', v).forEach(x => x.onclick = async () => { if (!(await confirmBox('حذف هذا المربي(ة) من اللائحة؟', 'حذف'))) return; const i = DB.employees.findIndex(y => y.id === x.dataset.del); if (i >= 0) DB.employees.splice(i, 1); persist(); again(); });
  }

  /* ---------- documents ---------- */
  const thr = cells => K.thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  const kv = (k, v2) => `<tr><td class="k">${k}</td><td class="r">${v2 || ''}</td></tr>`;
  function card(s, e, sy) {
    const t = ttOf(e), K2 = kidsOf(e, sy);
    return `<div class="ps-card"><div class="ps-ch">بطاقة مرب(ية) التعليم الأولي — الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}</div>
      <div class="ps-cb"><div class="ps-ph">${e.photo ? `<img src="${e.photo}">` : 'الصورة'}</div>
      <table class="tbl sb-t sb-kv ps-kv"><tbody>${kv('الاسم الكامل', `<b>${esc(fullN(e))}</b>`)}${kv('رقم البطاقة الوطنية', `<span dir="ltr">${esc(e.cin || '')}</span>`)}${kv('الجنس / تاريخ الازدياد', `${gAr(e.sex)} — ${esc(ld(e.birth))}`)}
        ${kv('الوحدة المدرسية', esc(e.unit || ''))}${kv('الأقسام المسندة', esc(e.levels || (K2.length ? Array.from(new Set(K2.map(p => p.lvlSh))).join('، ') : '')))}${kv('المؤسسة المشغلة', esc(e.org || ''))}
        ${kv('الهاتف / البريد', `<span dir="ltr">${esc([e.phone, e.email].filter(Boolean).join(' — '))}</span>`)}${kv('تاريخ الالتحاق', esc(ld(e.affDate || e.hire)))}${kv('عدد الأطفال', K2.length ? `${K2.length} (منهم ${K2.filter(p => p.g === 'F').length} إناث)` : '')}</tbody></table></div>
      <div class="ps-cap">الشهادات المحصل عليها</div>
      <table class="tbl sb-t cmp"><thead>${thr(['الشهادة', 'التخصص', 'السنة', 'المؤسسة الجامعية'])}</thead><tbody>${((e.degs || []).length ? e.degs : [{}, {}]).map(d => `<tr><td class="r">${esc(d.t || '')}</td><td class="r">${esc(d.spec || '')}</td><td>${esc(d.year || '')}</td><td class="r">${esc(d.inst || '')}</td></tr>`).join('')}</tbody></table>
      <div class="ps-cap">استعمال الزمن الأسبوعي</div>${ttTable(t, true)}
      <div class="ps-sg"><span>توقيع المعني(ة) بالأمر</span><span data-stm>توقيع مدير(ة) المؤسسة</span></div></div>`;
  }
  function ttTable(t, small) {
    const used = t.slots.map((s, i) => i).filter(i => nm(t.slots[i]) || t.days.some(d => nm(t.cells[d + '|' + i])));
    return `<table class="tbl sb-t ${small ? 'cmp ps-ttp sm' : 'big ps-ttp'}"><thead>${thr(['الحصة'].concat(t.days))}</thead><tbody>${used.map(i => `<tr><td class="b nw" dir="ltr">${esc(t.slots[i])}</td>${t.days.map(d => `<td>${esc(t.cells[d + '|' + i] || '')}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }
  function docList(s, sy, f) {
    const L = eds().filter(e => !f.unit || sameU(e.unit, f.unit));
    const rows = L.map((e, i) => `<tr><td>${i + 1}</td><td class="r b">${esc(fullN(e))}</td><td dir="ltr">${esc(e.cin || '')}</td><td>${gAr(e.sex)}</td><td>${esc(ld(e.birth))}</td><td class="r">${esc(e.unit || '')}</td><td class="r sm">${esc(e.org || '')}</td><td class="r sm">${esc((e.degs || []).map(d => d.t + (d.spec ? ' — ' + d.spec : '')).join('، '))}</td><td dir="ltr" class="sm">${esc(e.phone || '')}</td><td class="sm" dir="ltr">${esc(e.email || '')}</td><td>${kidsOf(e, sy).length}</td></tr>`);
    return K.SB.pages(s, { title: 'لائحة مربيات ومربي التعليم الأولي', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${f.unit ? ' — ' + esc(f.unit) : ''}`, page: 'a4l', blocks: [{ table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'ر.ب.و', 'الجنس', 'تاريخ الازدياد', 'الوحدة المدرسية', 'المؤسسة المشغلة', 'الشهادات', 'الهاتف', 'البريد الإلكتروني', 'الأطفال']), rows }, minRows: 6 }] });
  }
  function docKids(s, sy, f) {
    const L = eds().filter(e => (!f.unit || sameU(e.unit, f.unit)) && (!f.id || e.id === f.id));
    const blocks = [];
    L.forEach(e => {
      const K2 = kidsOf(e, sy).slice().sort((a, b) => String(a.lvl).localeCompare(String(b.lvl)) || a.name.localeCompare(b.name, 'ar'));
      blocks.push({ before: `<div class="sb-cap r" style="margin-top:3mm">المربي(ة): ${esc(fullN(e))} — ${esc(e.unit || '')}${e.org ? ' — ' + esc(ORG_SH(e.org)) : ''} — عدد الأطفال: ${K2.length} (إناث ${K2.filter(p => p.g === 'F').length})</div>`, keepNext: true,
        table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'رمز مسار', 'الاسم الكامل', 'الجنس', 'تاريخ الازدياد', 'المستوى', 'القسم', 'ملاحظات']), rows: K2.map((p, i) => `<tr><td>${i + 1}</td><td dir="ltr">${esc(p.code)}</td><td class="r b">${esc(p.name)}</td><td>${esc(p.gender)}</td><td>${esc(p.birth)}</td><td>${esc(p.lvlSh)}</td><td>${esc(p.cls)}</td><td></td></tr>`) }, minRows: K2.length ? 1 : 6 });
    });
    if (!blocks.length) blocks.push({ html: '<p class="sb-p">لا يوجد مربون مسجلون.</p>' });
    return K.SB.pages(s, { title: 'لائحة أطفال التعليم الأولي حسب المربي(ة)', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4', blocks });
  }
  function docTT(s, sy, f) {
    const L = eds().filter(e => (!f.unit || sameU(e.unit, f.unit)) && (!f.id || e.id === f.id));
    const out = [];
    L.forEach(e => out.push(...K.SB.pages(s, { title: 'استعمال الزمن — التعليم الأولي', sub: `${esc(fullN(e))} — ${esc(e.unit || '')} — الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4l', blocks: [{ html: ttTable(ttOf(e), false) }, { html: `<p class="sb-note">المؤسسة المشغلة: ${esc(e.org || '—')} — الأقسام: ${esc(e.levels || '—')} — عدد الأطفال: ${kidsOf(e, sy).length}</p>` }], sign: K.SB.sign(s, { three: ['توقيع المربي(ة)', `حرر ب: ${esc(s.city || '')}`, '<span data-stm>توقيع مدير(ة) المؤسسة</span>'] }) })));
    return out.length ? out : K.SB.pages(s, { title: 'استعمال الزمن — التعليم الأولي', page: 'a4l', blocks: [{ html: '<p class="sb-p">لا يوجد مربون مسجلون.</p>' }] });
  }
  function docCards(s, sy, f) {
    const L = eds().filter(e => (!f.unit || sameU(e.unit, f.unit)) && (!f.id || e.id === f.id));
    return MK.flowPages({ page: 'a4', cls: 'sb', head: `<div class="mk-hdr">${Dx.header(s)}</div>`, blocks: (L.length ? L : []).map(e => ({ html: card(s, e, sy) })) });
  }
  Dx.modCss += `
  .ps-card{border:1.4px solid #1f6f50;border-radius:3mm;margin:2mm 0 4mm;overflow:hidden;break-inside:avoid;page-break-inside:avoid}
  .ps-ch{background:#1f6f50;color:#fff;font-weight:700;text-align:center;padding:1.4mm;font-size:11pt;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ps-cb{display:flex;gap:3mm;padding:2mm 2.5mm 0}.ps-ph{flex:0 0 28mm;height:36mm;border:1px dashed #888;border-radius:2mm;display:flex;align-items:center;justify-content:center;color:#888;overflow:hidden}.ps-ph img{width:100%;height:100%;object-fit:cover}
  .ps-kv{flex:1}.ps-kv td{height:5.4mm}.ps-kv td.k{width:34mm}
  .ps-card>table{width:calc(100% - 5mm);margin:0 2.5mm}.ps-cap{font-weight:700;color:#1f6f50;margin:1.6mm 2.5mm .8mm;font-size:10pt}
  .tbl.sb-t.ps-ttp td{font-size:8.6pt}.tbl.sb-t.ps-ttp.big td{height:13mm;font-size:10.5pt}
  .ps-sg{display:flex;justify-content:space-between;padding:2mm 8mm 9mm;font-weight:700;font-size:10pt}`;
  const css = document.createElement('style'); css.textContent = '.ps-tt td{padding:2px}.ps-tt .inp{min-width:120px;padding:4px 6px;font-size:12.5px}'; document.head.appendChild(css);

  window.pagePresch = v => page(v);
  window.pagePreschDoc = function (v, arg) {
    arg = arg || {};
    const sy = MK.curSy();
    const KD = [['list', 'لائحة المربين'], ['card', 'بطاقات المربين'], ['tt', 'استعمالات الزمن'], ['kids', 'لائحة الأطفال حسب المربي(ة)']];
    MK.docPage(v, {
      title: 'وثائق التعليم الأولي', icon: '🧸', modes: false, flow: true, state: { kind: arg.kind || 'list', id: arg.id || '', unit: st.unit || '' },
      back: () => go('presch'),
      form: function F(box, s2, refresh) {
        const units = K.U.names(), E = eds();
        box.innerHTML = `<div class="fld"><label>الوثيقة</label><select class="inp" id="pdK">${KD.map(k => `<option value="${k[0]}" ${k[0] === s2.kind ? 'selected' : ''}>${k[1]}</option>`).join('')}</select></div>
          ${units.length > 1 ? `<div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="pdU"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === s2.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>` : ''}
          ${s2.kind !== 'list' ? `<div class="fld"><label>المربي(ة)</label><select class="inp" id="pdE"><option value="">الكل</option>${E.map(e => `<option value="${e.id}" ${e.id === s2.id ? 'selected' : ''}>${esc(fullN(e))}</option>`).join('')}</select></div>` : ''}`;
        $('#pdK', box).onchange = ev => { s2.kind = ev.target.value; F(box, s2, refresh); refresh(); };
        if ($('#pdU', box)) $('#pdU', box).onchange = ev => { s2.unit = ev.target.value; refresh(); };
        if ($('#pdE', box)) $('#pdE', box).onchange = ev => { s2.id = ev.target.value; refresh(); };
      },
      build: s2 => { const s = S(); return s2.kind === 'card' ? { page: 'a4', pages: docCards(s, sy, s2) } : s2.kind === 'tt' ? { page: 'a4l', pages: docTT(s, sy, s2) } : s2.kind === 'kids' ? { page: 'a4', pages: docKids(s, sy, s2) } : { page: 'a4l', pages: docList(s, sy, s2) }; },
      fname: s2 => ({ list: 'لائحة_مربي_التعليم_الأولي', card: 'بطاقات_مربي_التعليم_الأولي', tt: 'استعمال_الزمن_التعليم_الأولي', kids: 'أطفال_التعليم_الأولي' })[s2.kind]
    });
  };
  window.Presch = { eds, kidsOf, parseRows, merge, ORGS };
})();
