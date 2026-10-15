'use strict';
/* 1.9.4 — شؤون التلاميذ ← «طلبات التسجيل الجديدة» (التسجيل القبلي بمنظومة مسار: RentreeScolaire / PreInscription).
   كل طلب: المؤسسة، حالة الطلب (مقبول / مرفوض / في طور الدراسة)، معلومات التلميذ(ة) بالعربية والفرنسية، الجنس، تاريخ ومكان الازدياد، الجنسية،
   المستوى، وثائق التلميذ(ة) ووثائق التلقيح، ومعلومات الوالدين (الأب، الأم، الولي الشرعي: الاسم، ر.ب.و، المهنة، الهاتف، البريد، العنوان).
   الإدخال يدويا أو بلصق صفحة «تفاصيل طلب التسجيل» كما هي من مسار (يمكن لصق عدة طلبات دفعة واحدة).
   الوثائق: سجل طلبات التسجيل، بطاقة الطلب، إشعار ولي الأمر بقبول أو رفض الطلب، إحصائيات.
   Data: DB.preins = { items: [{ id, sy, date, school, status, lastFr, lastAr, firstFr, firstAr, g, birth, nat, place, level, docs: [], parents: [{ role, lastFr, lastAr, firstFr, firstAr, cin, job, phone, email, addr, guardian }], notes, reason }] } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).replace(/[‎‏‪-‮]/g, '').trim();
  const R = () => { const m = (DB.preins = DB.preins && typeof DB.preins === 'object' ? DB.preins : {}); m.items = Array.isArray(m.items) ? m.items : []; return m; };
  const STATUS = { ok: ['مقبول', '#1e8449'], no: ['مرفوض', '#c0392b'], wait: ['في طور الدراسة', '#d68910'] };
  const stOf = t => (/مرفوض|rejet|refus/i.test(t) ? 'no' : /مقبول|accept|valid/i.test(t) ? 'ok' : 'wait');
  const LEVELS_P = ['التعليم الأولي', 'الأول ابتدائي عام', 'الثاني ابتدائي عام', 'الثالث ابتدائي عام', 'الرابع ابتدائي عام', 'الخامس ابتدائي عام', 'السادس ابتدائي عام', 'الأولى ثانوي إعدادي', 'الجذع المشترك'];
  // 1.9.4: the levels follow the cycle of the institution (no pre-school for the collège / lycée)
  const LVL = () => { const c = (typeof S === 'function' && S().cycle) || ''; return /إعدادي/.test(c) ? ['الأولى إعدادي', 'الثانية إعدادي', 'الثالثة إعدادي'] : /تأهيلي/.test(c) ? ['الجذع المشترك', 'الأولى باكالوريا', 'الثانية باكالوريا'] : LEVELS_P; };
  const DOCS = ['صورة شخصية الطفل(ة)', 'عقد الازدياد الطفل(ة)', 'وثيقة معطيات عامة حول الطفل', 'وثيقة التلقيحات والتكملة الضرورية فيما يخص فيتامينات أ و د', 'شهادة المغادرة', 'شهادة الإقامة'];
  const ROLES = ['الأب', 'الأم', 'الولي الشرعي'];
  const fullAr = x => [x.lastAr, x.firstAr].filter(Boolean).join(' ');
  const fullFr = x => [x.lastFr, x.firstFr].filter(Boolean).join(' ');
  const ld = iso => (iso ? (window.K && K.ldate ? K.ldate(iso) : iso) : '');
  const gAr = g => (g === 'F' ? 'أنثى' : g === 'M' ? 'ذكر' : '');
  const guard = x => (x.parents || []).find(p => p.guardian) || (x.parents || [])[0] || {};
  const st = { sy: '', status: '', level: '', q: '' };

  /* ---------- parsing of the page «تفاصيل طلب التسجيل» copied from Massar ---------- */
  const LBL = { 'المؤسسة': 'school', 'حالة الطلب': 'status', 'النسب بالفرنسية': 'lastFr', 'النسب بالعربية': 'lastAr', 'الإسم بالفرنسية': 'firstFr', 'الاسم بالفرنسية': 'firstFr', 'الإسم بالعربية': 'firstAr', 'الاسم بالعربية': 'firstAr',
    'الجنس': 'g', 'تاريخ الإزدياد': 'birth', 'تاريخ الازدياد': 'birth', 'الجنسية': 'nat', 'مكان الميلاد': 'place', 'مكان الازدياد': 'place', 'المستوى': 'level', 'البطاقة الوطنية للتعريف (CIN)': 'cin', 'البطاقة الوطنية للتعريف': 'cin', 'مهنة': 'job', 'المهنة': 'job', 'هاتف': 'phone', 'الهاتف': 'phone', 'البريد الإلكتروني': 'email', 'البريد الالكتروني': 'email', 'العنوان': 'addr' };
  const HEADS = /^(تفاصيل طلب التسجيل|معلومات التلميذ\(ة\)|وثائق التلميذ\(ة\)|المؤسسة والمستوى|وثائق التلقيح|وثائق التلقيح الإلزامية|معلومات الوالدين)$/;
  const isoD = v => { const s = nm(v); let m; if ((m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s))) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`; if ((m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s))) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; return s; };
  function parseOne(text) {
    const L = text.split(/\r?\n/).map(l => nm(l.replace(/^[*•\-]\s*/, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1'))).filter(Boolean);
    const x = { id: uid('pi'), sy: MK.curSy(), date: Dx.todayIso(), status: 'wait', docs: [], parents: [], notes: '' };
    let sec = 'pupil', P = null, roles = [], docSec = false;
    for (let i = 0; i < L.length; i++) {
      const l = L[i];
      if (/^معلومات الوالدين/.test(l)) { sec = 'parents'; docSec = false; continue; }
      if (/^(وثائق التلميذ|وثائق التلقيح)/.test(l)) { docSec = true; continue; }
      if (/^المؤسسة والمستوى/.test(l)) { docSec = false; continue; }
      if (HEADS.test(l)) { docSec = false; continue; }
      if (sec === 'parents' && /^(الأب|الأم|الولي)/.test(l) && !LBL[l]) { roles.push(/الأم/.test(l) ? 'الأم' : /الأب/.test(l) ? 'الأب' : 'الولي الشرعي'); continue; }
      if (/^الولي الشرعي\s*-/.test(l) || /تم تعيين هذا الشخص كولي شرعي/.test(l)) { if (P) P.guardian = true; continue; }
      const k = LBL[l];
      if (k) {
        docSec = false;
        const nx = L[i + 1], val = nx && !LBL[nx] && !HEADS.test(nx) && !/^الولي الشرعي\s*-/.test(nx) ? nx : '';
        if (val) i++;
        if (sec === 'parents') {
          if (!P || (k === 'lastFr' && P.lastFr != null) || (k === 'lastAr' && P.lastAr != null && P.lastFr == null)) { P = { role: roles[x.parents.length] || ROLES[x.parents.length] || 'الولي الشرعي', guardian: false }; x.parents.push(P); }
          P[k] = val;
        } else if (k === 'school') { if (!x.school) x.school = val; }
        else if (k === 'status') x.status = stOf(val);
        else if (k === 'g') x.g = /أنث|^f/i.test(val) ? 'F' : 'M';
        else if (k === 'birth') x.birth = isoD(val);
        else x[k] = val;
        continue;
      }
      if (docSec && sec === 'pupil') x.docs.push(l);
    }
    if (x.parents.length && !x.parents.some(p => p.guardian)) x.parents[0].guardian = true;
    return x.lastAr || x.firstAr || x.lastFr ? x : null;
  }
  const parseMany = text => String(text || '').split(/(?=تفاصيل طلب التسجيل)/).map(parseOne).filter(Boolean);
  function merge(list) {
    let n = 0, u = 0;
    list.forEach(x => {
      const k = (fullFr(x) + '|' + x.birth).toUpperCase(), e = R().items.find(y => (fullFr(y) + '|' + y.birth).toUpperCase() === k && (fullFr(y) || y.birth));
      if (e) { const id = e.id; Object.assign(e, x, { id, date: e.date, notes: e.notes || x.notes }); u++; } else { R().items.push(x); n++; }
    });
    persist(); return { n, u };
  }

  /* ---------- the form ---------- */
  function form(x0, done) {
    const x = x0 ? JSON.parse(JSON.stringify(x0)) : { id: uid('pi'), sy: MK.curSy(), date: Dx.todayIso(), school: S().school || '', status: 'wait', g: 'M', nat: 'مغربية', level: (LVL()[1] || LVL()[0]), docs: [], parents: [{ role: 'الأب', guardian: true }, { role: 'الأم' }], notes: '' };
    x.parents = Array.isArray(x.parents) ? x.parents : [];
    const b = document.createElement('div');
    const fld = (k, l, o) => `<div class="fld"><label>${l}</label><input class="inp" data-f="${k}" ${o || ''} value="${esc(x[k] || '')}"></div>`;
    const draw = () => {
      b.innerHTML = `<div class="fgrid">
        <div class="fld"><label>حالة الطلب</label><select class="inp" data-f="status">${Object.entries(STATUS).map(([k, v]) => `<option value="${k}" ${x.status === k ? 'selected' : ''}>${v[0]}</option>`).join('')}</select></div>
        ${fld('date', 'تاريخ الطلب', 'type="date"')}${fld('school', 'المؤسسة')}
        <div class="fld"><label>المستوى</label><input class="inp" data-f="level" list="piLv" value="${esc(x.level || '')}"></div>
        ${fld('lastAr', 'النسب بالعربية')}${fld('firstAr', 'الإسم بالعربية')}${fld('lastFr', 'النسب بالفرنسية', 'dir="ltr"')}${fld('firstFr', 'الإسم بالفرنسية', 'dir="ltr"')}
        <div class="fld"><label>الجنس</label><select class="inp" data-f="g"><option value="M" ${x.g !== 'F' ? 'selected' : ''}>ذكر</option><option value="F" ${x.g === 'F' ? 'selected' : ''}>أنثى</option></select></div>
        ${fld('birth', 'تاريخ الازدياد', 'type="date"')}${fld('place', 'مكان الميلاد')}${fld('nat', 'الجنسية')}</div>
        ${x.status === 'no' ? `<div class="fld"><label>سبب الرفض</label><input class="inp" data-f="reason" value="${esc(x.reason || '')}" placeholder="مثال: عدم استيفاء السن القانوني، خارج المجال الجغرافي للمؤسسة..."></div>` : ''}
        <div class="sec-t" style="margin-top:8px">الوثائق المدلى بها</div><div class="pi-docs">${DOCS.concat(x.docs.filter(d => !DOCS.includes(d))).map((d, i) => `<label class="chk"><input type="checkbox" data-d="${esc(d)}" ${x.docs.includes(d) ? 'checked' : ''}> ${esc(d)}</label>`).join('')}</div>
        <div class="sec-t" style="margin-top:8px">معلومات الوالدين</div>
        ${x.parents.map((p, i) => `<div class="pi-par"><div class="fgrid"><div class="fld"><label>الصفة</label><input class="inp" list="piRo" data-p="${i}" data-k="role" value="${esc(p.role || '')}"></div>
          <label class="chk" style="align-self:end"><input type="radio" name="piG" data-g="${i}" ${p.guardian ? 'checked' : ''}> الولي الشرعي</label>
          ${[['lastAr', 'النسب بالعربية'], ['firstAr', 'الإسم بالعربية'], ['lastFr', 'النسب بالفرنسية', 1], ['firstFr', 'الإسم بالفرنسية', 1], ['cin', 'ر.ب.و (CIN)', 1], ['job', 'المهنة'], ['phone', 'الهاتف', 1], ['email', 'البريد الإلكتروني', 1]].map(([k, l, ltr]) => `<div class="fld"><label>${l}</label><input class="inp" ${ltr ? 'dir="ltr"' : ''} data-p="${i}" data-k="${k}" value="${esc(p[k] || '')}"></div>`).join('')}</div>
          <div class="fld"><label>العنوان</label><input class="inp" data-p="${i}" data-k="addr" value="${esc(p.addr || '')}"></div><button class="btn sm danger" data-pd="${i}">${ic('trash')} حذف</button></div>`).join('')}
        <button class="btn sm" id="piPA">${ic('plus')} إضافة أحد الوالدين / الولي</button>
        <div class="fld" style="margin-top:8px"><label>ملاحظات</label><textarea class="inp" rows="2" data-f="notes">${esc(x.notes || '')}</textarea></div>${K.dl('piLv', LVL())}${K.dl('piRo', ROLES)}`;
      $$('[data-f]', b).forEach(el => el.oninput = el.onchange = () => { x[el.dataset.f] = el.value; if (el.dataset.f === 'status') draw(); });
      $$('[data-d]', b).forEach(el => el.onchange = () => { const d = el.dataset.d; x.docs = x.docs.filter(y => y !== d); if (el.checked) x.docs.push(d); });
      $$('[data-p]', b).forEach(el => el.oninput = () => { x.parents[+el.dataset.p][el.dataset.k] = el.value; });
      $$('[data-g]', b).forEach(el => el.onchange = () => { x.parents.forEach((p, i) => { p.guardian = i === +el.dataset.g; }); });
      $$('[data-pd]', b).forEach(el => el.onclick = () => { x.parents.splice(+el.dataset.pd, 1); draw(); });
      $('#piPA', b).onclick = () => { x.parents.push({ role: ROLES[Math.min(x.parents.length, 2)] }); draw(); };
    };
    draw();
    modal({ title: x0 ? 'تعديل طلب التسجيل' : 'تسجيل طلب جديد', size: 'xl', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (!nm(x.lastAr) && !nm(x.firstAr) && !nm(x.lastFr)) { toast('اكتب اسم التلميذ(ة)', true); return false; }
      const L = R().items, i = L.findIndex(y => y.id === x.id); if (i >= 0) L[i] = x; else L.push(x); persist(); done();
    } }, { label: 'إلغاء' }] });
  }
  function pasteDlg(done) {
    const b = document.createElement('div');
    b.innerHTML = `<p style="margin-top:0;line-height:1.85">افتح في مسار «التسجيل القبلي ← تفاصيل طلب التسجيل»، حدد كل محتوى الصفحة (Ctrl+A) وانسخه (Ctrl+C)، ثم الصقه هنا (Ctrl+V). يمكن لصق عدة طلبات متتالية. يتعرف البرنامج على: حالة الطلب، معلومات التلميذ(ة)، الوثائق، المستوى، ومعلومات الوالدين والولي الشرعي.</p><textarea class="inp" id="piT" rows="14" placeholder="تفاصيل طلب التسجيل&#10;المؤسسة&#10;..."></textarea><div id="piPv" class="muted" style="margin-top:6px"></div>`;
    const ta = $('#piT', b); ta.oninput = () => { const L = parseMany(ta.value); $('#piPv', b).textContent = L.length ? `تم التعرف على ${L.length} طلب: ` + L.map(x => `${fullAr(x)} (${STATUS[x.status][0]})`).join('، ') : ''; };
    modal({ title: 'لصق طلبات التسجيل من مسار', size: 'lg', body: b, actions: [{ label: ic('save') + ' إضافة', cls: 'pri', onClick: () => { const L = parseMany(ta.value); if (!L.length) { toast('لم يتم التعرف على أي طلب (تأكد من نسخ الصفحة كاملة)', true); return false; } const r = merge(L); toast(`أضيف ${r.n} طلب${r.u ? ` وحُيّن ${r.u}` : ''}`); done(); } }, { label: 'إلغاء' }] });
  }

  /* ---------- page ---------- */
  const list = sy => R().items.filter(x => (x.sy || MK.curSy()) === sy);
  const filtered = sy => list(sy).filter(x => (!st.status || x.status === st.status) && (!st.level || x.level === st.level) && (!st.q || [fullAr(x), fullFr(x), x.place, guard(x).cin, guard(x).phone].join(' ').toLowerCase().includes(st.q.toLowerCase())))
    .sort((a, b) => String(a.level).localeCompare(String(b.level), 'ar') || fullAr(a).localeCompare(fullAr(b), 'ar'));
  function page(v) {
    st.sy = MK.curSy();
    const sy = st.sy, A = list(sy), L = filtered(sy), levels = Array.from(new Set(A.map(x => x.level).filter(Boolean)));
    const c = k => A.filter(x => x.status === k).length;
    v.innerHTML = `<div class="page-h"><h1>طلبات التسجيل الجديدة</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="piPaste">${ic('up')} لصق من مسار</button><button class="btn" id="piDoc">${ic('print')} الوثائق</button><button class="btn pri" id="piNew">${ic('plus')} طلب جديد</button></div>
      <div class="att-kpis big" style="margin-bottom:10px"><span>الطلبات: <b>${A.length}</b></span>${Object.entries(STATUS).map(([k, s]) => `<span style="color:${s[1]}">${s[0]}: <b>${c(k)}</b></span>`).join('')}<span>إناث: <b>${A.filter(x => x.g === 'F').length}</b></span>${levels.slice(0, 4).map(l => `<span>${esc(l)}: <b>${A.filter(x => x.level === l).length}</b></span>`).join('')}</div>
      <div class="toolbar" style="margin-bottom:8px"><select class="inp" id="piS" style="width:auto"><option value="">كل الحالات</option>${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${st.status === k ? 'selected' : ''}>${s[0]}</option>`).join('')}</select>
        <select class="inp" id="piL" style="width:auto"><option value="">كل المستويات</option>${levels.map(l => `<option ${st.level === l ? 'selected' : ''}>${esc(l)}</option>`).join('')}</select>
        <div class="search">${ic('search')}<input class="inp" id="piQ" placeholder="بحث بالاسم، ر.ب.و أو هاتف الولي..." value="${esc(st.q)}"></div></div>
      ${L.length ? `<div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>الاسم الكامل</th><th>Nom</th><th>الجنس</th><th>تاريخ ومكان الازدياد</th><th>المستوى</th><th>الحالة</th><th>الوثائق</th><th>الولي الشرعي</th><th>الهاتف</th><th></th></tr></thead><tbody>
        ${L.map(x => { const g = guard(x), s = STATUS[x.status] || STATUS.wait; return `<tr><td class="b">${esc(fullAr(x))}</td><td dir="ltr">${esc(fullFr(x))}</td><td>${gAr(x.g)}</td><td>${esc(ld(x.birth))}${x.place ? ' — ' + esc(x.place) : ''}</td><td>${esc(x.level || '')}</td><td><b style="color:${s[1]}">${s[0]}</b></td><td class="num">${(x.docs || []).length}</td><td>${esc(fullAr(g))}${g.role ? ` <small class="muted">(${esc(g.role)})</small>` : ''}</td><td dir="ltr">${esc(g.phone || '')}</td>
          <td style="white-space:nowrap"><button class="btn sm" data-ed="${x.id}">${ic('edit')}</button><button class="btn sm" data-cd="${x.id}" title="بطاقة الطلب">${ic('print')}</button><button class="btn sm" data-nt="${x.id}" title="إشعار ولي الأمر">✉</button><button class="btn sm danger" data-del="${x.id}">${ic('trash')}</button></td></tr>`; }).join('')}</tbody></table></div></div>`
        : '<div class="empty-state">لا توجد طلبات تسجيل بعد. اضغط «طلب جديد» أو «لصق من مسار».</div>'}`;
    const again = () => page(v);
    $('#piNew', v).onclick = () => form(null, again);
    $('#piPaste', v).onclick = () => pasteDlg(again);
    $('#piDoc', v).onclick = () => go('preinsDoc', { kind: 'list' });
    $('#piS', v).onchange = e => { st.status = e.target.value; again(); };
    $('#piL', v).onchange = e => { st.level = e.target.value; again(); };
    $('#piQ', v).oninput = e => { st.q = e.target.value; clearTimeout(page.t); page.t = setTimeout(() => { again(); const q = $('#piQ'); q.focus(); q.setSelectionRange(q.value.length, q.value.length); }, 300); };
    const by = id => R().items.find(x => x.id === id);
    $$('[data-ed]', v).forEach(b => b.onclick = () => form(by(b.dataset.ed), again));
    $$('[data-cd]', v).forEach(b => b.onclick = () => go('preinsDoc', { kind: 'card', id: b.dataset.cd }));
    $$('[data-nt]', v).forEach(b => b.onclick = () => go('preinsDoc', { kind: 'notice', id: b.dataset.nt }));
    $$('[data-del]', v).forEach(b => b.onclick = async () => { if (!(await confirmBox('حذف هذا الطلب؟', 'حذف'))) return; R().items = R().items.filter(x => x.id !== b.dataset.del); persist(); again(); });
  }

  /* ---------- documents ---------- */
  const thr = cells => K.thr(cells.map(c => (typeof c === 'object' ? c : { t: c, c: 'd' })));
  const kvr = (a, b, c, d) => `<tr><td class="k">${a}</td><td class="r">${b || ''}</td>${c != null ? `<td class="k">${c}</td><td class="r">${d || ''}</td>` : ''}</tr>`;
  function card(s, x) {
    const P = x.parents || [];
    return K.SB.pages(s, { title: 'بطاقة طلب التسجيل', sub: `الموسم الدراسي ${esc(MK.syDash(x.sy || MK.curSy()).replace('-', '/'))}`, page: 'a4', blocks: [
      { html: `<table class="tbl sb-t sb-kv pi-kv"><tbody>${kvr('المؤسسة', esc(x.school || s.school || ''), 'حالة الطلب', `<b style="color:${(STATUS[x.status] || STATUS.wait)[1]}">${(STATUS[x.status] || STATUS.wait)[0]}</b>`)}${kvr('تاريخ الطلب', esc(ld(x.date)), 'المستوى', esc(x.level || ''))}</tbody></table>` },
      { html: '<div class="sb-cap r">معلومات التلميذ(ة)</div>' },
      { html: `<table class="tbl sb-t sb-kv pi-kv"><tbody>${kvr('النسب بالعربية', `<b>${esc(x.lastAr || '')}</b>`, 'النسب بالفرنسية', `<b dir="ltr">${esc(x.lastFr || '')}</b>`)}${kvr('الإسم بالعربية', `<b>${esc(x.firstAr || '')}</b>`, 'الإسم بالفرنسية', `<b dir="ltr">${esc(x.firstFr || '')}</b>`)}${kvr('الجنس', gAr(x.g), 'الجنسية', esc(x.nat || ''))}${kvr('تاريخ الازدياد', esc(ld(x.birth)), 'مكان الميلاد', esc(x.place || ''))}</tbody></table>` },
      { html: `<div class="sb-cap r">الوثائق</div><div class="pi-dl">${DOCS.concat((x.docs || []).filter(d => !DOCS.includes(d))).map(d => `<span><span class="sb-chk">${(x.docs || []).includes(d) ? '✔' : ''}</span> ${esc(d)}</span>`).join('')}</div>` },
      { html: '<div class="sb-cap r">معلومات الوالدين</div>' },
      { table: { cls: 'sb-t cmp', head: thr(['الصفة', 'الاسم الكامل', 'Nom complet', 'ر.ب.و', 'المهنة', 'الهاتف', 'العنوان']), rows: (P.length ? P : [{}, {}]).map(p => `<tr><td class="b">${esc(p.role || '')}${p.guardian ? '<br><small>(الولي الشرعي)</small>' : ''}</td><td class="r b">${esc(fullAr(p))}</td><td dir="ltr">${esc(fullFr(p))}</td><td dir="ltr">${esc(p.cin || '')}</td><td>${esc(p.job || '')}</td><td dir="ltr">${esc(p.phone || '')}</td><td class="r sm">${esc(p.addr || '')}</td></tr>`) } },
      x.status === 'no' && x.reason ? { html: `<p class="sb-p"><b>سبب الرفض:</b> ${esc(x.reason)}</p>` } : null,
      x.notes ? { html: `<p class="sb-p"><b>ملاحظات:</b> ${esc(x.notes)}</p>` } : null].filter(Boolean),
      sign: K.SB.sign(s, {}) });
  }
  function notice(s, x) {
    const g = guard(x), ok = x.status === 'ok', no = x.status === 'no', f = x.g === 'F';
    const body = ok ? `يشرفني أن أخبركم بأنه تم <b>قبول</b> طلب تسجيل ${f ? 'ابنتكم' : 'ابنكم'}: <b>${esc(fullAr(x))}</b> ${f ? 'المزدادة' : 'المزداد'} بتاريخ ${esc(ld(x.birth))} ب${esc(x.place || '..........')} بمستوى <b>${esc(x.level || '')}</b> برسم الموسم الدراسي ${esc(MK.syDash(x.sy || MK.curSy()).replace('-', '/'))}. ونطلب منكم الحضور إلى إدارة المؤسسة لاستكمال ملف التسجيل مصحوبين بالوثائق المطلوبة.`
      : no ? `يؤسفني أن أخبركم بأن طلب تسجيل ${f ? 'ابنتكم' : 'ابنكم'}: <b>${esc(fullAr(x))}</b> ${f ? 'المزدادة' : 'المزداد'} بتاريخ ${esc(ld(x.birth))} بمستوى <b>${esc(x.level || '')}</b> قد <b>رُفض</b>${x.reason ? `، وذلك ل${esc(x.reason.replace(/^ل/, ''))}` : ''}. ولمزيد من المعلومات يمكنكم الاتصال بإدارة المؤسسة.`
        : `نخبركم بأن طلب تسجيل ${f ? 'ابنتكم' : 'ابنكم'}: <b>${esc(fullAr(x))}</b> بمستوى <b>${esc(x.level || '')}</b> في طور الدراسة، وسيتم إخباركم بالنتيجة في أقرب الآجال.`;
    const one = `<div class="pi-nt"><div class="pi-nh">إشعار لولي الأمر بنتيجة طلب التسجيل</div><p>إلى السيد(ة): <b>${esc(fullAr(g) || '....................')}</b> ${g.role ? `(${esc(g.role)})` : ''} — الهاتف: <span dir="ltr">${esc(g.phone || '..........')}</span></p>
      <p>${body}</p><div class="pi-ns"><span>حرر ب: ${esc(s.city || '')} في: ${esc(ld(Dx.todayIso()))}</span><span data-stm>توقيع وخاتم مدير(ة) المؤسسة</span></div></div>`;
    return MK.flowPages({ page: 'a4', cls: 'sb', head: `<div class="mk-hdr">${Dx.header(s)}</div>`, blocks: [{ html: one }, { html: '<div class="pi-cut"></div>' }, { html: one }] });
  }
  function docList(s, sy, f) {
    const L = list(sy).filter(x => !f.status || x.status === f.status).sort((a, b) => String(a.level).localeCompare(String(b.level), 'ar') || fullAr(a).localeCompare(fullAr(b), 'ar'));
    const rows = L.map((x, i) => { const g = guard(x); return `<tr><td>${i + 1}</td><td class="r b">${esc(fullAr(x))}</td><td dir="ltr" class="sm">${esc(fullFr(x))}</td><td>${gAr(x.g)}</td><td class="nw">${esc(ld(x.birth))}</td><td class="sm">${esc(x.place || '')}</td><td class="sm">${esc(x.level || '')}</td><td style="color:${(STATUS[x.status] || STATUS.wait)[1]}" class="b">${(STATUS[x.status] || STATUS.wait)[0]}</td><td class="r sm">${esc(fullAr(g))}</td><td dir="ltr" class="sm">${esc(g.cin || '')}</td><td dir="ltr" class="sm">${esc(g.phone || '')}</td><td>${(x.docs || []).length}</td></tr>`; });
    const c = k => L.filter(x => x.status === k).length;
    return K.SB.pages(s, { title: 'سجل طلبات التسجيل الجديدة', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${f.status ? ' — ' + STATUS[f.status][0] : ''}`, page: 'a4l', blocks: [
      { table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'Nom complet', 'الجنس', 'تاريخ الازدياد', 'مكان الميلاد', 'المستوى', 'الحالة', 'الولي الشرعي', 'ر.ب.و', 'الهاتف', 'الوثائق']), rows }, minRows: 8 },
      { html: `<p class="sb-note">المجموع: ${L.length} — مقبول: ${c('ok')} — مرفوض: ${c('no')} — في طور الدراسة: ${c('wait')} — إناث: ${L.filter(x => x.g === 'F').length}</p>` }] });
  }
  Dx.modCss += `.pi-kv td.k{width:20%}.pi-dl{display:grid;grid-template-columns:1fr 1fr;gap:1.4mm 4mm;font-size:10pt;margin-bottom:2mm}
  .pi-nt{border:1.3px solid #1f3864;border-radius:3mm;padding:4mm 6mm;font-size:11.5pt;line-height:1.9}.pi-nh{text-align:center;font-weight:700;font-size:13pt;color:#1f3864;margin-bottom:2mm}.pi-nt p{margin:0 0 1.5mm;text-align:justify}
  .pi-ns{display:flex;justify-content:space-between;margin-top:3mm;font-weight:700;min-height:22mm}.pi-cut{border-top:1px dashed #888;margin:5mm 0}`;
  { const c = document.createElement('style'); c.textContent = '.pi-docs{display:grid;grid-template-columns:1fr 1fr;gap:4px 12px}.pi-par{border:1px solid var(--line);border-radius:8px;padding:8px;margin-bottom:6px}'; document.head.appendChild(c); }

  window.pagePreins = v => page(v);
  window.pagePreinsDoc = function (v, arg) {
    arg = arg || {};
    const sy = MK.curSy();
    MK.docPage(v, {
      title: 'وثائق طلبات التسجيل', icon: '📝', modes: false, flow: true, state: { kind: arg.kind || 'list', id: arg.id || '', status: '' },
      back: () => go('preins'),
      form: function F(box, s2, refresh) {
        const L = list(sy);
        box.innerHTML = `<div class="fld"><label>الوثيقة</label><select class="inp" id="pdK"><option value="list" ${s2.kind === 'list' ? 'selected' : ''}>سجل طلبات التسجيل</option><option value="card" ${s2.kind === 'card' ? 'selected' : ''}>بطاقة الطلب</option><option value="notice" ${s2.kind === 'notice' ? 'selected' : ''}>إشعار ولي الأمر بالنتيجة</option></select></div>
          ${s2.kind === 'list' ? `<div class="fld"><label>الحالة</label><select class="inp" id="pdS"><option value="">الكل</option>${Object.entries(STATUS).map(([k, s]) => `<option value="${k}" ${s2.status === k ? 'selected' : ''}>${s[0]}</option>`).join('')}</select></div>`
            : `<div class="fld"><label>التلميذ(ة)</label><select class="inp" id="pdI"><option value="">كل الطلبات</option>${L.map(x => `<option value="${x.id}" ${x.id === s2.id ? 'selected' : ''}>${esc(fullAr(x))}</option>`).join('')}</select></div>`}`;
        $('#pdK', box).onchange = e => { s2.kind = e.target.value; F(box, s2, refresh); refresh(); };
        if ($('#pdS', box)) $('#pdS', box).onchange = e => { s2.status = e.target.value; refresh(); };
        if ($('#pdI', box)) $('#pdI', box).onchange = e => { s2.id = e.target.value; refresh(); };
      },
      build: s2 => {
        const s = S(), X = list(sy).filter(x => !s2.id || x.id === s2.id);
        if (s2.kind === 'list') return { page: 'a4l', pages: docList(s, sy, s2) };
        const pages = []; X.forEach(x => pages.push(...(s2.kind === 'card' ? card(s, x) : notice(s, x))));
        return { page: 'a4', pages };
      },
      fname: s2 => ({ list: 'سجل_طلبات_التسجيل', card: 'بطاقة_طلب_التسجيل', notice: 'إشعار_نتيجة_طلب_التسجيل' })[s2.kind]
    });
  };
  window.Preins = { parseMany, parseOne, merge, R };
})();
