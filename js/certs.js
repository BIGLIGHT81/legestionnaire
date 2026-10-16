'use strict';
/* الشواهد المدرسية — register of former (or current) pupils, numbered school certificates (2 copies on one A4),
   register of delivered certificates, Excel import / export. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();

  /* levels follow the cycle chosen in the settings (K.LV = Massar levels):
     primary -> روض الأطفال / الأولى والثانية أولي / الأول … السادس ابتدائي;  collège -> الأولى والثانية والثالثة إعدادي;
     qualifying -> الجذع المشترك / الأولى باكالوريا / الثانية باكالوريا (+ المسلك أو الشعبة), then the collège levels
     (many qualifying schools keep a collège section).  The field stays free text for older files. */
  const LV = () => window.K.LV;
  const kindNow = () => (window.Cyc ? Cyc.kind() : 'pri');
  const cycleKeys = kind => (window.Cyc ? Cyc.levels(kind) : ['P1', 'P2', 'P3', 'P4', 'P5', 'P6']);
  const levelsFor = kind => {
    if (!/^(pri|col|lyc)$/.test(kind || '')) kind = /تأهيل/.test(kind || '') ? 'lyc' : /إعداد/.test(kind || '') ? 'col' : 'pri';
    // a lycée also delivers certificates for the collège years of its former pupils (their own names, not mapped to the cycle)
    return Array.from(new Set(cycleKeys(kind).map(k => LV().name(k)).concat(kind === 'lyc' ? cycleKeys('col').map(k => ((window.K && K.LV.byK(k)) || {}).ar || LV().name(k)) : [])));
  };
  // key of a level text typed / imported («الثانية باكالوريا», «الأول ابتدائي»...), '' when free text
  const lvKey = t => { try { const s = LV().splitLabel(t); if (s) return s.k; return LV().fromLabel(t); } catch (e) { return ''; } };
  const lvRank = t => { const k = lvKey(t); return k ? LV().idx(k) : 99; };
  const cmpLv = (a, b) => lvRank(a) - lvRank(b) || String(a).localeCompare(String(b), 'ar');
  // level + number between brackets + pathway, as written in the certificate
  const lvFull = (x, withNo) => {
    const lv = String((x && x.level) || '').trim(); if (!lv) return '';
    const k = lvKey(lv), n = withNo ? levelNo(lv) : '', br = String((x && x.branch) || '').trim();
    let t = lv + (n ? ` (${n})` : '');
    if (br) t += k === 'TC' ? ` ${br}` : ` — ${k === 'B1' || k === 'B2' ? 'مسلك ' : ''}${br}`;
    return t;
  };
  const showBranchNow = () => kindNow() === 'lyc';
  const lvExample = () => { const k = kindNow(); return k === 'lyc' ? 'الثانية باكالوريا (02)' : k === 'col' ? 'الثالثة إعدادي (03)' : 'الخامس ابتدائي (05)'; };
  // a typed or imported level may carry its pathway («الثانية باكالوريا علوم رياضية», «2BACSVT»): split it
  const normLevel = o => {
    if (!o || !o.level) return o;
    const s = LV().splitLabel(o.level);
    if (s) { o.level = s.level; if (s.branch && !o.branch) o.branch = s.branch; }
    return o;
  };
  const YEARS = (() => { const y = +MK.schoolYear(today()).slice(0, 4); const a = []; for (let i = y; i >= 1960; i--) a.push(`${i}/${i + 1}`); return a; })();
  const KIND = { left: 'غادر المؤسسة (منقطع / منتقل)', current: 'يتابع دراسته حاليا بالمؤسسة' };

  function migrate(db) {
    const c = db.certs = db.certs || {};
    c.students = Array.isArray(c.students) ? c.students : [];
    c.issued = Array.isArray(c.issued) ? c.issued : [];
    if (!c.purpose) c.purpose = 'لأغراض إدارية';
    // 1.8: the school's own model («أنا الموقع أسفله ... أشهد بأن») becomes the default certificate
    if (!c.v2) { if (c.purpose === 'لغرض إداري') c.purpose = 'لأغراض إدارية'; if (!c.model) c.model = 'attest'; c.v2 = true; }
    if (!c.model) c.model = 'attest';
  }
  window.Certs = { migrate };
  const CD = () => DB.certs;
  const stById = id => CD().students.find(x => x.id === id);
  const key = s => MK.hkey(s);
  const showD = v => MK.showDate(v);
  // dates typed or imported: ISO when recognisable, otherwise kept as typed (e.g. "1985" or "1985-1986")
  const cleanDate = v => { v = String(v == null ? '' : v).trim(); if (!v) return ''; const d = normDate(v); return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : v; };
  const cleanSY = v => { v = String(v == null ? '' : v).trim().replace(/\s+/g, ''); const m = /^(\d{4})[/\-](\d{4})$/.exec(v); if (m) { const a = +m[1], b = +m[2]; return a < b ? `${a}/${b}` : `${b}/${a}`; } return v === '/' ? '' : v; };
  const gender = g => /^(أنثى|انثى|انثي|أنثي|f|fille|féminin|feminin|ث)$/i.test(String(g || '').trim()) ? 'أنثى' : /^(ذكر|m|garçon|garcon|masculin|ذ)$/i.test(String(g || '').trim()) ? 'ذكر' : '';
  const certNo = r => r && r.no ? `${MK.pad2(r.no)}/${String(r.year || '').slice(-2)}` : '';
  const nextNo = year => CD().issued.filter(r => +r.year === +year).reduce((m, r) => Math.max(m, +r.no || 0), 0) + 1;
  const issuedOf = id => CD().issued.filter(r => r.studentId === id);
  const sortedStudents = () => CD().students.slice().sort((a, b) => a.name.localeCompare(b.name, 'ar'));

  /* ================================================================= */
  let tab = 'students';
  const flt = { q: '', unit: '', level: '', year: '', iq: '' };
  const SECC = () => !!(window.Cyc && Cyc.single());            // collège / lycée: one institution, no school units
  const autoSync = () => { try { if (window.Pupils && Pupils.toCerts) Pupils.toCerts(MK.curSy(), true); } catch (e) {} };
  window.pageCerts = function (v, arg) {
    migrate(DB); autoSync();
    if (arg && arg.tab) tab = arg.tab;
    const T = [['students', 'سجل التلاميذ'], ['issued', 'الشواهد المسلمة']];
    v.innerHTML = `<div class="page-h"><h1>الشواهد المدرسية (ملفات الأرشيف)</h1><span class="sub">${CD().students.length} تلميذ(ة) — ${CD().issued.length} شهادة مسلمة</span><span class="sp"></span>
        <button class="btn" id="cAdd">${ic('plus')} إضافة تلميذ(ة)</button>
        <button class="btn pri" id="cNew">${ic('cap')} شهادة مدرسية</button></div>
      <div class="mk-tabs"><div class="seg" id="cTabs">${T.map(([k, l]) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}">${l}</button>`).join('')}</div></div>
      <div id="cBody"></div>`;
    $$('#cTabs button').forEach(b => b.onclick = () => { tab = b.dataset.t; go('certs'); });
    $('#cAdd').onclick = () => studentForm(null, () => go('certs', { tab: 'students' }));
    $('#cNew').onclick = () => go('certDoc', { kind: 'cert' });
    (tab === 'issued' ? tabIssued : tabStudents)($('#cBody'));
  };

  function tabStudents(b) {
    const units = SECC() ? [] : Array.from(new Set(CD().students.map(x => x.unit).filter(Boolean))).sort((x, y) => x.localeCompare(y, 'ar'));
    const levels = Array.from(new Set(CD().students.map(x => x.level).filter(Boolean))).sort(cmpLv);
    b.innerHTML = `<div class="card"><div class="toolbar">
        <div class="search">${ic('search')}<input class="inp" id="sq" placeholder="بحث بالاسم أو رقم التسجيل أو مكان الازدياد..." value="${esc(flt.q)}"></div>
        ${units.length ? `<select class="inp" id="su" style="width:auto"><option value="">كل الوحدات المدرسية</option>${units.map(u => `<option ${flt.unit === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>` : ''}
        ${levels.length ? `<select class="inp" id="sl" style="width:auto"><option value="">كل المستويات</option>${levels.map(u => `<option ${flt.level === u ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>` : ''}
        <span style="flex:1"></span>
        <button class="btn sm" id="sTpl" title="نموذج Excel فارغ يملأ ثم يستورد">${ic('down')} نموذج الاستيراد</button>
        <button class="btn sm" id="sImp">${ic('up')} استيراد Excel</button>
        <button class="btn sm" id="sExp">${ic('down')} تصدير Excel</button>
        <button class="btn sm" id="sPrn">${ic('print')} طباعة اللائحة</button></div>
      <div id="sT"></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">الاستيراد والتصدير يعتمدان «لائحة التلاميذ» (${SECC() ? 'ورقة واحدة' : 'ورقة لكل وحدة مدرسية'}): ر.ت، الاسم الكامل باللغة العربية، الاسم الكامل باللغة الفرنسية، الجنس، تاريخ الازدياد، مكان الازدياد، رقم التسجيل، تاريخ الإلتحاق، أخر مستوى دراسي، الموسم الدراسي، تاريخ المغادرة أو الانقطاع،${SECC() ? '' : ' الوحدة المدرسية،'} رقم الحالة المدنية. يقبل أيضا ملف برنامج الشواهد القديم (xlsb) مع سجل الشواهد المسلمة.</p>`;
    const draw = () => {
      const qq = key(flt.q);
      const list = sortedStudents().filter(x => (!flt.unit || x.unit === flt.unit) && (!flt.level || x.level === flt.level)
        && (!qq || key([x.name, x.nameFr, x.regNo, x.birthPlace, x.code, x.civilNo].join(' ')).includes(qq)));
      $('#sT').innerHTML = list.length ? `<table class="tbl compact"><thead><tr><th style="width:40px">#</th><th>الاسم والنسب</th><th>تاريخ ومكان الازدياد</th><th>آخر مستوى</th><th>رقم التسجيل</th><th>الموسم الدراسي</th><th>تاريخ المغادرة</th>${SECC() ? '' : '<th>الوحدة</th>'}<th></th></tr></thead><tbody>
        ${list.map((x, i) => { const n = issuedOf(x.id).length; return `<tr data-id="${x.id}"><td class="muted num">${i + 1}</td>
          <td class="name-cell"><b>${esc(x.name)}</b><small>${x.nameFr ? `<span dir="ltr">${esc(x.nameFr)}</span> — ` : ''}${esc(x.gender || '')}${x.status === 'current' ? ' — متمدرس(ة)' : ''}${n ? ` — ${n} شهادة` : ''}</small></td>
          <td><span class="num nw">${esc(showD(x.birth))}</span><br><small class="muted">${esc(x.birthPlace || '')}</small></td><td class="${x.branch ? '' : 'nw'}">${esc(lvFull(x))}</td><td class="num">${esc(x.regNo || '')}</td>
          <td class="num nw">${esc(x.schoolYear || '')}</td><td class="num nw">${esc(showD(x.leaveDate))}</td>${SECC() ? '' : `<td class="muted">${esc(x.unit || '')}</td>`}
          <td class="act"><button class="btn sm pri" data-a="cert">${ic('print')} شهادة</button> <button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`; }).join('')}
        </tbody></table>` : `<div class="empty-state">${CD().students.length ? 'لا توجد نتائج مطابقة' : 'لا يوجد تلاميذ بعد. أضف تلميذا أو استورد لائحة من Excel.'}</div>`;
      $$('#sT tr[data-id]').forEach(tr => {
        const x = stById(tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async ev => {
          ev.stopPropagation();
          if (btn.dataset.a === 'cert') go('certDoc', { kind: 'cert', studentId: x.id });
          if (btn.dataset.a === 'edit') studentForm(x, draw);
          if (btn.dataset.a === 'del') {
            const n = issuedOf(x.id).length;
            if (!await confirmBox(`حذف التلميذ(ة) <b>${esc(x.name)}</b> من السجل؟${n ? `<br><span class="muted">تبقى الشواهد المسلمة له (${n}) في سجل الشواهد.</span>` : ''}`, 'حذف')) return;
            if (x.code) { DB.certs.skip = DB.certs.skip || []; if (!DB.certs.skip.includes(x.code)) DB.certs.skip.push(x.code); }
            CD().students = CD().students.filter(y => y.id !== x.id); persist(); draw();
          }
        });
        tr.ondblclick = () => go('certDoc', { kind: 'cert', studentId: x.id });
      });
    };
    $('#sq').oninput = e => { flt.q = e.target.value; draw(); };
    if ($('#su')) $('#su').onchange = e => { flt.unit = e.target.value; draw(); };
    if ($('#sl')) $('#sl').onchange = e => { flt.level = e.target.value; draw(); };
    $('#sTpl').onclick = downloadTemplate;
    $('#sImp').onclick = importStudents;
    $('#sExp').onclick = exportStudents;
    $('#sPrn').onclick = () => go('certDoc', { kind: 'students', unit: flt.unit, level: flt.level });
    draw();
  }

  function tabIssued(b) {
    const years = Array.from(new Set(CD().issued.map(r => String(r.year)).filter(Boolean))).sort().reverse();
    b.innerHTML = `<div class="card"><div class="toolbar">
        <select class="inp" id="iy" style="width:auto"><option value="">كل السنوات</option>${years.map(y => `<option ${flt.year === y ? 'selected' : ''}>${y}</option>`).join('')}</select>
        <div class="search">${ic('search')}<input class="inp" id="iq" placeholder="بحث بالاسم أو الرقم..." value="${esc(flt.iq)}"></div>
        <span style="flex:1"></span>
        <button class="btn sm" id="iExp">${ic('down')} تصدير Excel</button>
        <button class="btn sm" id="iPrn">${ic('print')} طباعة سجل الشواهد</button></div>
      <div id="iT"></div></div>`;
    const draw = () => {
      const qq = key(flt.iq);
      const list = CD().issued.filter(r => (!flt.year || String(r.year) === flt.year) && (!qq || key((r.snap || {}).name + ' ' + certNo(r)).includes(qq) || certNo(r).includes(flt.iq.trim())))
        .sort((a, c) => (c.date || '').localeCompare(a.date || '') || (+c.no || 0) - (+a.no || 0));
      $('#iT').innerHTML = list.length ? `<table class="tbl"><thead><tr><th>الرقم</th><th>تاريخ التسليم</th><th>الاسم والنسب</th><th>المستوى</th><th>الموسم الدراسي</th><th>الغرض</th><th></th></tr></thead><tbody>
        ${list.map(r => { const sn = r.snap || {}; return `<tr data-id="${r.id}"><td class="num"><b>${esc(certNo(r)) || '—'}</b></td><td class="num">${fmtDate(r.date)}</td><td><b>${esc(sn.name || '')}</b></td>
          <td>${esc(lvFull(sn))}</td><td class="num">${esc(sn.schoolYear || '')}</td><td class="muted">${esc(r.purpose || '')}</td>
          <td class="act"><button class="btn sm" data-a="open">${ic('print')} فتح / طباعة</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`; }).join('')}
        </tbody></table>` : '<div class="empty-state">لم تُسلم أي شهادة بعد</div>';
      $$('#iT tr[data-id]').forEach(tr => {
        const r = CD().issued.find(x => x.id === tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          if (btn.dataset.a === 'open') go('certDoc', { kind: 'cert', issuedId: r.id });
          if (btn.dataset.a === 'del' && await confirmBox(`حذف الشهادة رقم <b>${esc(certNo(r))}</b> (${esc((r.snap || {}).name || '')}) من السجل؟`, 'حذف')) {
            CD().issued = CD().issued.filter(x => x.id !== r.id); persist(); draw();
          }
        });
      });
    };
    $('#iy').onchange = e => { flt.year = e.target.value; draw(); };
    $('#iq').oninput = e => { flt.iq = e.target.value; draw(); };
    $('#iExp').onclick = exportIssued;
    $('#iPrn').onclick = () => go('certDoc', { kind: 'issuedReg', year: flt.year });
    draw();
  }

  /* ---------- student form ---------- */
  const SFIELDS = [['name', 'الاسم الكامل باللغة العربية', true], ['nameFr', 'الاسم الكامل باللغة الفرنسية'], ['father', 'اسم الأب (من أبيه/ها)'], ['gender', 'الجنس'], ['status', 'الوضعية'], ['birth', 'تاريخ الازدياد'], ['birthPlace', 'مكان الازدياد'],
    ['regNo', 'رقم التسجيل'], ['joinDate', 'تاريخ الالتحاق'], ['level', 'آخر مستوى دراسي'], ['branch', 'المسلك / الشعبة (الجذع المشترك، الباكالوريا)'], ['schoolYear', 'الموسم الدراسي'], ['leaveDate', 'تاريخ المغادرة أو الانقطاع'], ['unit', 'الوحدة المدرسية'],
    ['civilNo', 'رقم الحالة المدنية'], ['code', 'رمز مسار (اختياري)'], ['note', 'ملاحظة', false, 'full']];
  // columns of the school's pupils list (import / export / template)
  const LIST_BASE = [['n', 'ر.ت'], ['name', 'الاسم الكامل باللغة العربية'], ['nameFr', 'الاسم الكامل باللغة الفرنسية'], ['gender', 'الجنس'], ['birth', 'تاريخ الازدياد'], ['birthPlace', 'مكان الازدياد'],
    ['regNo', 'رقم التسجيل'], ['joinDate', 'تاريخ الإلتحاق'], ['level', 'أخر مستوى دراسي'], ['schoolYear', 'الموسم الدراسي'], ['leaveDate', 'تاريخ المغادرة أو الانقطاع'], ['unit', 'الوحدة المدرسية'], ['civilNo', 'رقم الحالة المدنية'], ['father', 'اسم الأب']];
  const LIST_BASE_W = [6, 28, 28, 8, 16, 22, 12, 16, 18, 16, 18, 20, 16, 22];
  // qualifying cycle (or a register that already has pathways): one more column after the level
  const withBranch = () => showBranchNow() || CD().students.some(x => x.branch);
  const listAll = () => withBranch() ? LIST_BASE.slice(0, 9).concat([['branch', 'المسلك / الشعبة']], LIST_BASE.slice(9)) : LIST_BASE;
  const listWAll = () => withBranch() ? LIST_BASE_W.slice(0, 9).concat([22], LIST_BASE_W.slice(9)) : LIST_BASE_W;
  const listCols = () => SECC() ? listAll().filter(c => c[0] !== 'unit') : listAll();
  const listW = () => { const all = listAll(), w = listWAll(); return SECC() ? w.filter((x, i) => all[i] && all[i][0] !== 'unit') : w; };
  const DATE_K = ['birth', 'joinDate', 'leaveDate'];
  const listRow = (x, i) => listCols().map(([k]) => k === 'n' ? String(i + 1) : DATE_K.includes(k) ? showD(x[k]) : String(x[k] == null ? '' : x[k]));
  // suggestions of the pathway for the typed level (common core, 1st / 2nd baccalaureate)
  const branchOpts = lv => { const k = lvKey(lv), L = k && LV().BRANCHES[k] ? LV().BRANCHES[k] : Array.from(new Set([].concat(...Object.values(LV().BRANCHES)))); return L.map(o => `<option value="${esc(o)}">`).join(''); };
  function studentForm(x, after) {
    const d = Object.assign({ gender: '', status: 'left' }, x || {});
    const units = Array.from(new Set(CD().students.map(y => y.unit).filter(Boolean)));
    const inp = ([k, l, req, full]) => {
      let h;
      if (k === 'gender') h = `<select class="inp" data-k="gender"><option value=""></option><option ${d.gender === 'ذكر' ? 'selected' : ''}>ذكر</option><option ${d.gender === 'أنثى' ? 'selected' : ''}>أنثى</option></select>`;
      else if (k === 'status') h = `<select class="inp" data-k="status">${Object.entries(KIND).map(([v, t]) => `<option value="${v}" ${d.status === v ? 'selected' : ''}>${t}</option>`).join('')}</select>`;
      else if (k === 'level') h = `<input class="inp" data-k="level" list="lvL" value="${esc(d.level || '')}"><datalist id="lvL">${levelsFor(kindNow()).map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
      else if (k === 'branch') h = `<input class="inp" data-k="branch" list="brL" value="${esc(d.branch || '')}" placeholder="مثال: العلوم التجريبية"><datalist id="brL">${branchOpts(d.level)}</datalist>`;
      else if (k === 'schoolYear') h = `<input class="inp" data-k="schoolYear" list="syL" value="${esc(d.schoolYear || '')}" placeholder="مثال: 2015/2016"><datalist id="syL">${YEARS.map(o => `<option value="${o}">`).join('')}</datalist>`;
      else if (k === 'unit') h = `<input class="inp" data-k="unit" list="unL" value="${esc(d.unit || '')}"><datalist id="unL">${units.map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
      else if (DATE_K.includes(k)) h = `<input class="inp" data-k="${k}" value="${esc(showD(d[k]))}" placeholder="يوم/شهر/سنة">`;
      else if (k === 'nameFr') h = `<input class="inp" data-k="nameFr" dir="ltr" value="${esc(d.nameFr || '')}">`;
      else h = `<input class="inp" data-k="${k}" value="${esc(d[k] || '')}">`;
      return `<div class="fld ${full ? 'full' : ''}"><label>${l}${req ? ' <span style="color:var(--red)">*</span>' : ''}</label>${h}</div>`;
    };
    const body = document.createElement('div');
    const pl = window.K && K.PP ? K.PP : null;
    // the pathway is asked in the qualifying cycle (or when the pupil already has one)
    const FIELDS = SFIELDS.filter(f => !(SECC() && f[0] === 'unit')).filter(f => f[0] !== 'branch' || showBranchNow() || d.branch || /باكالوريا|الجذع/.test(d.level || ''));
    body.innerHTML = `${!x && pl ? `<div class="fld full" style="margin-bottom:8px"><label>اختيار من بطاقة التلاميذ (اكتب الاسم أو رمز مسار فتُملأ المعطيات تلقائيا)</label><input class="inp" id="stPick" list="k2Pupils" placeholder="ابحث بالاسم أو برمز مسار..." autocomplete="off"></div>` : ''}<div class="fgrid">${FIELDS.map(inp).join('')}</div>${pl ? `<datalist id="k2Pupils">${pl.options('k2Pupils')}</datalist>` : ''}`;
    const pk = $('#stPick', body);
    if (pk) pk.onchange = () => {
      const r = K.PP.resolve('pupil', pk.value); if (!r) return;
      const q = r.rec, set = (k, v) => { const el = $(`[data-k="${k}"]`, body); if (el && v) el.value = v; };
      set('name', q.name); set('code', q.code); set('gender', q.gender); set('birth', showD(q.birth)); set('birthPlace', q.place); set('level', LV().name(q.lvl)); set('branch', LV().branchOfClass(q.cls)); set('schoolYear', MK.curSy()); set('unit', q.unit);
      pk.value = q.name; syncBranch();
    };
    // typing «الثانية باكالوريا علوم رياضية» (or a Massar class code) fills the level and the pathway; the suggestions follow the level
    const syncBranch = () => { const lv = $('[data-k="level"]', body), dl = $('#brL', body); if (dl && lv) dl.innerHTML = branchOpts(lv.value); };
    const lvEl = $('[data-k="level"]', body);
    if (lvEl) { lvEl.oninput = syncBranch; lvEl.onchange = () => { const o = normLevel({ level: lvEl.value.trim(), branch: '' }); lvEl.value = o.level; const br = $('[data-k="branch"]', body); if (br && o.branch && !br.value.trim()) br.value = o.branch; syncBranch(); }; }
    modal({ title: x ? 'تعديل معطيات التلميذ(ة)' : 'إضافة تلميذ(ة)', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      const o = {}; $$('[data-k]', body).forEach(el => { o[el.dataset.k] = el.value.trim(); });
      if (!o.name) { toast('المرجو كتابة الاسم الكامل باللغة العربية', true); return false; }
      normLevel(o); if (o.branch == null) o.branch = (x && x.branch) || '';
      DATE_K.forEach(k => { o[k] = cleanDate(o[k]); }); o.schoolYear = cleanSY(o.schoolYear);
      if (x) Object.assign(x, o); else CD().students.push(Object.assign({ id: uid('st') }, o));
      persist(); after && after(); toast(x ? 'تم حفظ التعديلات' : 'تمت إضافة التلميذ(ة)');
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- Excel import / export ---------- */
  const IMP = MK.matcher({
    name: ['الاسم الكامل باللغة العربية', 'الاسم الكامل بالعربية', 'الاسم والنسب', 'الإسم والنسب', 'الاسم و النسب', 'الاسم الكامل', 'الإسم الكامل', 'Nom et prénom (arabe)'],
    father: ['اسم الأب', 'اسم الاب', 'إسم الأب', 'من أبيه', 'من ابيه', 'الأب', 'الاب', 'Nom du père', 'Prénom du père'],
    nameFr: ['الاسم الكامل باللغة الفرنسية', 'الاسم الكامل بالفرنسية', 'الاسم بالفرنسية', 'Nom et prénom', 'Nom complet'],
    joinDate: ['تاريخ الإلتحاق', 'تاريخ الالتحاق', 'Date d\'inscription'], civilNo: ['رقم الحالة المدنية', 'رقم عقد الازدياد', 'N° état civil'],
    last: ['النسب', 'الاسم العائلي', 'Nom'], first: ['الاسم', 'الإسم', 'الاسم الشخصي', 'Prénom'],
    gender: ['الجنس', 'النوع', 'Sexe', 'Genre'], birth: ['تاريخ الازدياد', 'تاريخ الإزدياد', 'تاريخ الولادة', 'Date de naissance'],
    birthPlace: ['مكان الازدياد', 'مكان الإزدياد', 'مكان الولادة', 'Lieu de naissance'],
    level: ['آخر مستوى دراسي', 'آخر مستوى', 'المستوى', 'المستوى الدراسي', 'Niveau'], branch: ['المسلك / الشعبة', 'المسلك أو الشعبة', 'المسلك', 'الشعبة', 'المسلك والشعبة', 'Filière', 'Parcours', 'Option'], regNo: ['رقم التسجيل', 'رقم التسجيل بالسجل', 'رقم التسجيل في السجل', 'N° inscription'],
    schoolYear: ['الموسم الدراسي', 'السنة الدراسية', 'Année scolaire'], leaveDate: ['تاريخ المغادرة أو الانقطاع', 'تاريخ المغادرة او الانقطاع', 'تاريخ المغادرة', 'تاريخ الانقطاع', 'تاريخ الإنقطاع', 'Date de sortie'],
    n: ['ر.ت', 'ر ت', 'الرقم الترتيبي'], issued: ['تاريخ تسليم الشهادة', 'تاريخ التسليم'], unit: ['الوحدة المدرسية', 'الوحدة', 'الفرعية'], code: ['رمز مسار', 'رقم التلميذ', 'الرمز', 'Code Massar', 'CNE']
  });
  const stKey = o => [key(o.name), cleanDate(o.birth), String(o.regNo || '')].join('|');
  // the same pupil in an imported list: code Massar, or registration number (same name or birth date), or name + birth date
  function findStudent(o) {
    const L = CD().students, nk = key(o.name), b = cleanDate(o.birth);
    return (o.code && L.find(x => x.code && String(x.code).trim().toUpperCase() === String(o.code).trim().toUpperCase()))
      || (o.regNo && L.find(x => x.regNo && String(x.regNo) === String(o.regNo) && (key(x.name) === nk || (b && cleanDate(x.birth) === b))))
      || (nk && L.find(x => key(x.name) === nk && (!b || !x.birth || cleanDate(x.birth) === b) && (!o.regNo || !x.regNo || String(x.regNo) === String(o.regNo))))
      || null;
  }
  async function importStudents() {
    const sheets = await MK.openTable(); if (!sheets) return;
    const isig = new Set(CD().issued.map(r => [r.studentId, r.date, r.imp || ''].join('|')));
    let added = 0, updated = 0, iss = 0, used = 0;
    const now = new Date().toISOString();
    // the sheet of delivered certificates first (it creates its pupils), then the pupils' register
    const parsed = sheets.map(sh => { const h = MK.headerRow(sh.rows, IMP, 3); if (!h) return null; const col = {}; h.map.forEach((k, i) => { if (k && col[k] == null) col[k] = i; }); return { sh, h, col }; })
      .filter(p => p && (p.col.name != null || p.col.last != null || p.col.first != null));
    // a workbook with one sheet per school unit: the sheet name gives the unit when the column is empty
    const unitOfSheet = n => parsed.length > 1 ? String(n || '').replace(/احصاء|إحصاء|ارشيف|أرشيف|لائحة|التلاميذ/g, '').replace(/[()]/g, ' ').replace(/^\s*ب\s+/, '').replace(/\s+/g, ' ').trim() : '';
    parsed.forEach(({ sh, h, col }) => {
      used++;
      const shUnit = unitOfSheet(sh.name);
      const g = (r, k) => (col[k] == null ? '' : String(r[col[k]] == null ? '' : r[col[k]]).trim());
      const pending = [];
      sh.rows.slice(h.hi + 1).forEach(r => {
        const name = g(r, 'name') || [g(r, 'last'), g(r, 'first')].filter(Boolean).join(' ');
        if (!name || /^\d+$/.test(name)) return;
        const o = { name, nameFr: g(r, 'nameFr'), father: g(r, 'father'), gender: gender(g(r, 'gender')), birth: cleanDate(g(r, 'birth')), birthPlace: g(r, 'birthPlace'), level: g(r, 'level'), branch: g(r, 'branch'),
          regNo: g(r, 'regNo').replace(/\.0+$/, ''), joinDate: cleanDate(g(r, 'joinDate')), schoolYear: cleanSY(g(r, 'schoolYear')), leaveDate: cleanDate(g(r, 'leaveDate')),
          unit: g(r, 'unit') || shUnit, civilNo: g(r, 'civilNo').replace(/\.0+$/, ''), code: g(r, 'code') };
        normLevel(o);   // «الثانية باكالوريا علوم رياضية» / «2BACSVT» -> level + pathway
        Object.keys(o).forEach(k => { if (!o[k]) delete o[k]; });
        // the imported list is the reference: its filled cells update the pupil (empty cells keep what was entered)
        let st = findStudent(o);
        if (st) { Object.keys(o).forEach(f => { if (o[f]) st[f] = o[f]; }); updated++; } else { st = Object.assign({ id: uid('st'), status: 'left' }, o); CD().students.push(st); added++; }
        const di = cleanDate(g(r, 'issued'));
        if (col.issued != null && /^\d{4}-\d{2}-\d{2}$/.test(di)) pending.push({ st, date: di, n: g(r, 'n') });
      });
      // delivered certificates: numbered per calendar year in delivery order
      pending.sort((a, c) => a.date.localeCompare(c.date)).forEach(p => {
        const s = [p.st.id, p.date, p.n || ''].join('|');
        if (isig.has(s)) return; isig.add(s);
        const year = +p.date.slice(0, 4);
        CD().issued.push({ id: uid('ce'), studentId: p.st.id, no: nextNo(year), year, date: p.date, purpose: CD().purpose, kind: 'left', snap: snapOf(p.st), created: now, imp: p.n || 'x' });
        iss++;
      });
    });
    if (!used) return toast('لم يتم العثور على رؤوس الأعمدة (الاسم والنسب، تاريخ الازدياد، المستوى...). استعمل نموذج الاستيراد.', true);
    if (!added && !updated && !iss) return toast('لم يتم العثور على أي تلميذ في الملف', true);
    persist(); go('certs');
    toast(`تمت إضافة ${added} تلميذ(ة)${updated ? `، وتحديث ${updated}` : ''}${iss ? `، واستيراد ${iss} شهادة مسلمة` : ''}`);
  }
  // template: the school's list, one sheet per school unit (or a single sheet)
  async function downloadTemplate() {
    const LC = listCols(), LIST_W = listW();
    const head = LC.map(c => c[1]);
    const blank = () => { const rows = [head]; for (let i = 1; i <= 100; i++) rows.push([String(i)].concat(head.slice(1).map(() => ''))); return rows; };
    const units = SECC() ? [] : Array.from(new Set(CD().students.map(x => x.unit).filter(Boolean)));
    const sheets = units.length ? units.map(u => ({ name: u, rows: blank().map((r, i) => i ? r.map((v, j) => LC[j][0] === 'unit' ? u : v) : r), widths: LIST_W })) : [{ name: 'لائحة التلاميذ', rows: blank(), widths: LIST_W }];
    const r = await saveBook(sheets, 'لائحة_التلاميذ.xlsx');
    if (r && r.ok) toast('تم حفظ النموذج (لائحة التلاميذ): املأه في Excel ثم استورده');
  }
  // export in the same format: one sheet per school unit
  async function exportStudents() {
    const all = sortedStudents();
    const units = SECC() ? [] : Array.from(new Set(all.map(x => x.unit || ''))).sort((a, b) => a.localeCompare(b, 'ar'));
    const LIST_W = listW();
    const head = listCols().map(c => c[1]);
    const sheets = units.length > 1 || (units.length === 1 && units[0])
      ? units.map(u => ({ name: u || 'بدون وحدة', rows: [head].concat(all.filter(x => (x.unit || '') === u).map(listRow)), widths: LIST_W }))
      : [{ name: 'لائحة التلاميذ', rows: [head].concat(all.map(listRow)), widths: LIST_W }];
    const r = await saveBook(sheets, 'لائحة_التلاميذ.xlsx');
    if (r && r.ok) toast(SECC() ? 'تم التصدير إلى Excel' : 'تم التصدير إلى Excel (ورقة لكل وحدة مدرسية)');
  }
  const saveBook = (sheets, name) => window.api.saveXlsxBook ? window.api.saveXlsxBook(sheets, name)
    : window.api.saveXlsx([].concat(...sheets.map((s, i) => i ? s.rows.slice(1) : s.rows)), name, 'التلاميذ', listW());
  async function exportIssued() {
    const list = CD().issued.filter(r => !flt.year || String(r.year) === flt.year).sort((a, b) => (a.date || '').localeCompare(b.date || ''));
    const wb = CD().issued.some(r => r.snap && r.snap.branch) || showBranchNow();
    const ins0 = (a, v) => wb ? a.slice(0, 7).concat([v], a.slice(7)) : a;   // pathway column right after the level
    const ins = (a, v) => { const r = ins0(a, v); return SECC() ? r.filter((_, i) => i !== (wb ? 12 : 11)) : r; };   // no school-unit column in a collège / lycée
    const rows = [ins(['ر.ت', 'الرقم', 'الاسم والنسب', 'الجنس', 'تاريخ الازدياد', 'مكان الازدياد', 'آخر مستوى دراسي', 'رقم التسجيل', 'الموسم الدراسي', 'تاريخ المغادرة', 'تاريخ تسليم الشهادة', 'الوحدة المدرسية', 'الغرض'], 'المسلك / الشعبة')]
      .concat(list.map((r, i) => { const s = r.snap || {}; return ins([String(i + 1), certNo(r), s.name || '', s.gender || '', showD(s.birth), s.birthPlace || '', s.level || '', s.regNo || '', s.schoolYear || '', showD(s.leaveDate), fmtDate(r.date), s.unit || '', r.purpose || ''], s.branch || ''); }));
    const r = await window.api.saveXlsx(rows, 'سجل_الشواهد_المسلمة.xlsx', 'الشواهد المسلمة', ins([6, 10, 28, 8, 14, 22, 16, 12, 14, 14, 14, 20, 18], 22));
    if (r.ok) toast('تم التصدير إلى Excel');
  }
  const snapOf = x => { const o = {}; ['name', 'nameFr', 'father', 'gender', 'birth', 'birthPlace', 'level', 'branch', 'regNo', 'joinDate', 'schoolYear', 'leaveDate', 'unit', 'civilNo', 'code'].forEach(k => { o[k] = x[k] || ''; }); return o; };

  /* ================================================================= */
  /* certificate (one A5 copy) */
  const G = g => g === 'أنثى'
    ? { the: 'التلميذة', of: 'من أبيها', born: 'المولودة', reg: 'والمسجلة', was: 'كانت تتابع دراستها', is: 'تتابع دراستها', left: 'غادرت', to: 'لها' }
    : g === 'ذكر' ? { the: 'التلميذ', of: 'من أبيه', born: 'المولود', reg: 'والمسجل', was: 'كان يتابع دراسته', is: 'يتابع دراسته', left: 'غادر', to: 'له' }
      : { the: 'التلميذ(ة)', of: 'من أبيه(ا)', born: 'المولود(ة)', reg: 'والمسجل(ة)', was: 'كان يتابع دراسته(ها)', is: 'يتابع دراسته(ها)', left: 'غادر(ت)', to: 'له(ها)' };
  // gender used in the text: the pupil's, else the one chosen / suggested in the certificate form
  const genderFor = (x, st) => x.gender || (st && st.gender) || '';
  function certCopy(s, x, st) {
    const g = G(genderFor(x, st));
    const V = Dx.V;
    const sy = st.kind === 'current' ? (st.sy || MK.schoolYear(st.date)) : x.schoolYear;
    return `
      <div class="ct-hdr">${Dx.header(s)}</div>
      <div class="mk-certt">شهادة مدرسية</div>
      <div class="mk-certno">رقم: ${st.noText ? `<span dir="ltr">${esc(st.noText)}</span>` : V('')}</div>
      <div class="mk-cert">
        <p>يشهد الموقع(ة) أسفله: ${V(s.director)}</p>
        <p>مدير(ة) المؤسسة: ${V(s.school)}</p>
        <p>أن ${g.the}: ${V(x.name)}</p>
        ${st.showFather !== false ? `<p>${g.of}: ${V(x.father)}</p>` : ''}
        <p>${g.born} ب: ${V(x.birthPlace)} &nbsp; بتاريخ: ${V(showD(x.birth))}</p>
        <p>${g.reg} تحت رقم: ${V(x.regNo)}</p>
        <p>${st.kind === 'current' ? g.is : g.was} بالمستوى: ${V(lvFull(x, false))}</p>
        <p>برسم الموسم الدراسي: ${V(sy)}</p>
        ${st.showUnit && x.unit && !SECC() ? `<p>بالوحدة المدرسية: ${V(x.unit)}</p>` : ''}
        ${st.kind === 'current' ? '' : `<p>${g.left} المؤسسة بتاريخ: ${V(showD(x.leaveDate))}</p>`}
        <p>سلمت ${g.to} هذه الشهادة ${esc(st.purpose || 'لغرض إداري')}.</p>
      </div>
      <div class="l b mt">حرر ب: ${esc(st.city || s.city || '')} &nbsp; في: ${esc(fmtDate(st.date))}</div>
      <div class="l b mt2" style="margin-left:6mm">توقيع وخاتم السيد(ة) رئيس(ة) المؤسسة:</div>
      <div class="spacer"></div>`;
  }

  /* the school's model (one A4 page): «أنا الموقع(ة) أسفله مدير(ة) ... أشهد بأن: السيد(ة) ... من أبيه(ا) ...» */
  const GA = (g, cur) => g === 'أنثى'
    ? { who: cur ? 'التلميذة' : 'السيدة', of: 'من أبيها', born: 'المزدادة', reg: 'والمسجلة', was: cur ? 'تتابع دراستها' : 'كانت تتابع دراستها', left: 'غادرت', to: 'لها' }
    : g === 'ذكر' ? { who: cur ? 'التلميذ' : 'السيد', of: 'من أبيه', born: 'المزداد', reg: 'والمسجل', was: cur ? 'يتابع دراسته' : 'كان يتابع دراسته', left: 'غادر', to: 'له' }
      : { who: cur ? 'التلميذ(ة)' : 'السيد(ة)', of: 'من أبيه(ا)', born: 'المزداد(ة)', reg: 'والمسجل(ة)', was: cur ? 'يتابع(تتابع) دراسته(ها)' : 'كان(ت) يتابع(تتابع) دراسته(ها)', left: 'غادر(ت)', to: 'له(ها)' };
  const longDate = v => { const d = cleanDate(v); const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d); return m ? `${+m[3]} ${Dx.MONTHS[+m[2] - 1]} ${m[1]}` : String(v || ''); };
  // «(05)» for الخامس ابتدائي, «(03)» for الثالثة إعدادي, «(02)» for الثانية باكالوريا; the common core has no number.
  // Free texts that K.LV does not know keep the old reading of the ordinal word.
  const ORDN = [[/الأول|الاول|الأولى|الاولى/, 1], [/الثاني|الثانية/, 2], [/الثالث|الثالثة/, 3], [/الرابع/, 4], [/الخامس/, 5], [/السادس/, 6]];
  function levelNo(lv) {
    const k = lvKey(lv);
    if (k) return LV().no(k) ? MK.pad2(LV().no(k)) : '';
    const f = ORDN.find(([rx]) => rx.test(String(lv || ''))); return f ? MK.pad2(f[1]) : '';
  }
  function certAttest(s, x, st) {
    const cur = st.kind === 'current';
    const g = GA(genderFor(x, st), cur);
    const B = v => String(v == null ? '' : v).trim() ? `<b>${esc(v)}</b>` : '<span class="v empty" style="min-width:40mm"></span>';
    const sy = cur ? (st.sy || MK.schoolYear(st.date)) : x.schoolYear;
    return `<div class="mk-hdr">${Dx.header(s)}</div>
      <div class="ct-title">شهادة مدرسية</div>
      ${st.showNo ? `<div class="mk-certno" style="margin-top:-6mm">رقم: <span dir="ltr">${esc(st.noText || '')}</span></div>` : ''}
      <div class="ct">
        <div class="ct-intro">أنا الموقع(ة) أسفله مدير(ة) ${esc(s.school || '')} أشهد بأن:</div>
        <div class="ct-name">${g.who}: ${B(x.name)}</div>
        <div class="ct-name">${g.of}: ${B(x.father)}</div>
        <div class="ct-p">${g.born}: ${B(x.birthPlace)} في: ${B(longDate(x.birth))}
          ${g.reg} بالمؤسسة${st.showReg && x.regNo ? ` تحت رقم: <b>${esc(x.regNo)}</b>` : ''}، ${g.was} بهذه المؤسسة${st.showUnit && x.unit && !SECC() ? ` (الوحدة المدرسية: ${esc(x.unit)})` : ''}
          بالمستوى: ${B(lvFull(x, st.showLvNo !== false))} ${cur ? 'برسم الموسم الدراسي' : 'للموسم الدراسي'} ${sy ? `<b>(${esc(sy)})</b>` : B('')}.
          ${!cur && st.showLeave && x.leaveDate ? `${g.left} المؤسسة بتاريخ: <b>${esc(longDate(x.leaveDate))}</b>.` : ''}</div>
        <div class="ct-p">سلمت ${g.to} هذه الشهادة ${esc(st.purpose || 'لأغراض إدارية')}.</div>
      </div>
      <div class="ct-foot"><div></div><div class="c">حرر بتاريخ:<div class="ct-d">${esc(fmtDate(st.date))}</div></div></div>
      <div class="ct-sig">توقيع رئيس(ة) المؤسسة:</div>
      <div class="spacer"></div>`;
  }

  function regPages(s, st) {
    const sign = MK.signBlock(s, { city: st.city, date: st.date });
    if (st.kind === 'issuedReg') {
      const list = CD().issued.filter(r => !st.year || String(r.year) === String(st.year)).sort((a, b) => (a.date || '').localeCompare(b.date || '') || (+a.no || 0) - (+b.no || 0));
      const rows = list.map((r, i) => { const x = r.snap || {}; return [i + 1, `<b>${esc(certNo(r))}</b>`, esc(x.name), esc(x.gender), esc(showD(x.birth)), esc(x.birthPlace), esc(lvFull(x)), esc(x.regNo), esc(x.schoolYear), esc(showD(x.leaveDate)), fmtDate(r.date)].concat(SECC() ? [] : [esc(x.unit)]); });
      return MK.tablePages({ s, page: 'a4l', title: 'سجل الشواهد المدرسية المسلمة', info: `<div class="mk-info">${st.year ? `سنة: <b>${esc(st.year)}</b> — ` : ''}العدد: <b>${list.length}</b></div>`,
        cols: [{ h: 'ر.ت', w: '4%' }, { h: 'الرقم', w: '6%' }, { h: 'الاسم والنسب', cls: 'r' }, { h: 'الجنس', w: '5%' }, { h: 'تاريخ الازدياد', w: '9%' }, { h: 'مكان الازدياد', w: '12%', cls: 'sm' },
          { h: 'آخر مستوى', w: '9%', cls: 'sm' }, { h: 'رقم التسجيل', w: '7%' }, { h: 'الموسم', w: '8%' }, { h: 'تاريخ المغادرة', w: '9%' }, { h: 'تاريخ التسليم', w: '9%' }].concat(SECC() ? [] : [{ h: 'الوحدة', w: '10%', cls: 'sm' }]),
        rows, sign, minRows: 8 });
    }
    const list = sortedStudents().filter(x => (!st.unit || x.unit === st.unit) && (!st.level || x.level === st.level));
    const rows = list.map((x, i) => [i + 1, `<b>${esc(x.name)}</b>`, `<span dir="ltr">${esc(x.nameFr || '')}</span>`, esc(x.gender), esc(showD(x.birth)), esc(x.birthPlace), esc(x.regNo), esc(showD(x.joinDate)), esc(lvFull(x)), esc(x.schoolYear), esc(showD(x.leaveDate))].concat(SECC() ? [] : [esc(x.unit)], [esc(x.civilNo)]));
    return MK.tablePages({ s, page: 'a4l', title: esc(st.title || 'لائحة التلاميذ المنقطعين وغير الملتحقين'),
      info: `<div class="mk-info">${st.unit && !SECC() ? `الوحدة المدرسية: <b>${esc(st.unit)}</b> — ` : ''}${st.level ? `المستوى: <b>${esc(st.level)}</b> — ` : ''}العدد: <b>${list.length}</b></div>`,
      cols: [{ h: 'ر.ت', w: '3.5%' }, { h: 'الاسم الكامل باللغة العربية', cls: 'r' }, { h: 'الاسم الكامل باللغة الفرنسية', w: '13%', cls: 'sm' }, { h: 'الجنس', w: '4.5%', cls: 'sm' }, { h: 'تاريخ الازدياد', w: '7.5%', cls: 'sm' },
        { h: 'مكان الازدياد', w: '10%', cls: 'sm' }, { h: 'رقم التسجيل', w: '5.5%', cls: 'sm' }, { h: 'تاريخ الإلتحاق', w: '7.5%', cls: 'sm' }, { h: 'أخر مستوى دراسي', w: '8%', cls: 'sm' },
        { h: 'الموسم الدراسي', w: '7.5%', cls: 'sm' }, { h: 'تاريخ المغادرة أو الانقطاع', w: '8%', cls: 'sm' }, ].concat(SECC() ? [] : [{ h: 'الوحدة المدرسية', w: '8%', cls: 'sm' }], [{ h: 'رقم الحالة المدنية', w: '6%', cls: 'sm' }]),
      rows, sign, minRows: 8 });
  }

  window.pageCertDoc = function (v, arg) {
    autoSync();
    migrate(DB);
    arg = arg || {};
    const kind = arg.kind || 'cert';
    if (kind !== 'cert') {
      const KR = [['students', 'لائحة التلاميذ'], ['issuedReg', 'سجل الشواهد المدرسية المسلمة']];
      MK.docPage(v, {
        title: kind === 'students' ? 'لائحة التلاميذ' : 'سجل الشواهد المدرسية المسلمة', icon: '🎓', modes: false,
        state: { kind, unit: arg.unit || '', level: arg.level || '', year: arg.year || '', city: S().city || '', date: today(), title: 'لائحة التلاميذ المنقطعين وغير الملتحقين' },
        back: () => go('certs', { tab: kind === 'students' ? 'students' : 'issued' }),
        form: (box, st, refresh) => {
          const units = Array.from(new Set(CD().students.map(x => x.unit).filter(Boolean)));
          const levels = Array.from(new Set(CD().students.map(x => x.level).filter(Boolean))).sort(cmpLv);
          const years = Array.from(new Set(CD().issued.map(r => String(r.year)))).sort().reverse();
          box.innerHTML = `<div class="sec-t">الوثيقة</div><div class="fld"><select class="inp" id="rK">${KR.map(([k, l]) => `<option value="${k}" ${k === kind ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
            ${kind === 'students' ? `<div class="fld"><label>العنوان</label><input class="inp" id="rTi" value="${esc(st.title)}"></div>
              ${SECC() ? '' : `<div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="rU"><option value="">الكل</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>`}
              <div class="fld"><label>المستوى</label><select class="inp" id="rL"><option value="">الكل</option>${levels.map(u => `<option ${u === st.level ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>`
              : `<div class="fld"><label>السنة</label><select class="inp" id="rY"><option value="">كل السنوات</option>${years.map(y => `<option ${y === String(st.year) ? 'selected' : ''}>${y}</option>`).join('')}</select></div>`}
            <div class="sec-t">التحرير</div><div class="fgrid"><div class="fld"><label>حرر ب</label><input class="inp" id="rC" value="${esc(st.city)}"></div>
            <div class="fld"><label>في</label><input class="inp" type="date" id="rD" value="${esc(st.date)}"></div></div>`;
          $('#rK', box).onchange = e => go('certDoc', { kind: e.target.value });
          const bind = (id, k, ev) => { const el = $(id, box); if (el) el[ev || 'onchange'] = e => { st[k] = e.target.value; refresh(); }; };
          bind('#rTi', 'title', 'oninput'); bind('#rU', 'unit'); bind('#rL', 'level'); bind('#rY', 'year'); bind('#rC', 'city', 'oninput'); bind('#rD', 'date');
        },
        build: st => ({ page: 'a4l', pages: regPages(S(), st) }),
        fname: () => kind === 'students' ? 'لائحة_التلاميذ' : 'سجل_الشواهد_المسلمة'
      });
      return;
    }

    // certificate
    const rec = arg.issuedId ? CD().issued.find(r => r.id === arg.issuedId) : null;
    const st0 = rec
      ? { mode: arg.mode || undefined, studentId: rec.studentId, issuedId: rec.id, kind: rec.kind || 'left', date: rec.date, city: rec.city || S().city || '', purpose: rec.purpose || CD().purpose, no: rec.no, year: rec.year, showUnit: !!rec.showUnit, sy: rec.sy || '', model: rec.model || 'classic', showNo: !!rec.showNo, showReg: !!rec.showReg, showLeave: !!rec.showLeave, showLvNo: rec.showLvNo !== false, showFather: rec.showFather !== false }
      : { studentId: arg.studentId || '', issuedId: '', kind: '', date: today(), city: S().city || '', purpose: CD().purpose, no: '', year: '', showUnit: false, sy: '', model: CD().model || 'attest', showNo: !!CD().showNo, showReg: !!CD().showReg, showLeave: !!CD().showLeave, showLvNo: CD().showLvNo !== false, showFather: CD().showFather !== false };
    const stud = st => (st.issuedId && !stById(st.studentId)) ? (CD().issued.find(r => r.id === st.issuedId) || {}).snap || {} : stById(st.studentId) || {};
    const noFor = st => { if (st.issuedId) return { no: st.no, year: st.year }; const y = +(st.date || today()).slice(0, 4); return { no: st.no && +st.noYear === y ? st.no : nextNo(y), year: y }; };
    MK.docPage(v, {
      title: 'شهادة مدرسية', icon: '🎓', modes: true, state: st0, saveLabel: 'حفظ في السجل',
      back: () => go('certs', { tab: rec ? 'issued' : 'students' }),
      form: (box, st, refresh) => {
        const x0 = stud(st);
        if (!st.kind) st.kind = x0.status === 'current' ? 'current' : 'left';
        box.innerHTML = `<div class="sec-t">التلميذ(ة)</div>
          ${st.issuedId ? `<div class="emp-chip">${ic('cap', 'style="width:22px;height:22px;color:var(--pri)"')}<div><b>${esc(x0.name || '')}</b><br>شهادة رقم ${esc(certNo({ no: st.no, year: st.year }))} — مسجلة بتاريخ ${fmtDate(st.date)}</div></div>`
            : `<div class="fld"><div class="picker" id="cpk"><div class="search">${ic('search')}<input class="inp" id="cpq" placeholder="ابحث بالاسم أو رقم التسجيل..." autocomplete="off"></div><div class="list"></div></div><div id="cchip"></div></div>`}
          <div class="btn-row" style="margin:4px 0 6px">${!st.issuedId ? `<button class="btn sm" id="cNewSt">${ic('plus')} تلميذ(ة) جديد(ة)</button>` : ''}<button class="btn sm" id="cEdSt">${ic('edit')} تعديل معطيات التلميذ(ة)</button></div>
          <div class="fgrid">
            <div class="fld"><label>الجنس <span class="muted" style="font-weight:400">(أبيه / أبيها)</span></label><select class="inp" id="cG"><option value=""></option><option>ذكر</option><option>أنثى</option></select><span class="hint" id="cGh"></span></div>
            <div class="fld"><label id="cFl">اسم الأب (من أبيه / أبيها)</label><input class="inp" id="cF" placeholder="يكتب يدويا إن لم يكن في اللائحة"></div>
          </div>
          <label class="chk" id="cFsh" style="${st.model === 'attest' ? 'display:none' : ''}"><input type="checkbox" data-o="showFather" ${st.showFather !== false ? 'checked' : ''}> إظهار «من أبيه / من أبيها» في النموذج المختصر</label>
          <div class="sec-t">الشهادة</div>
          <div class="fld"><label>النموذج</label><select class="inp" id="cM"><option value="attest" ${st.model === 'attest' ? 'selected' : ''}>نموذج المؤسسة: «أنا الموقع(ة) أسفله... أشهد بأن» (A4)</option><option value="classic" ${st.model !== 'attest' ? 'selected' : ''}>النموذج المختصر (نسختان A5)</option></select></div>
          <div class="fld"><label>الوضعية</label><select class="inp" id="cK">${Object.entries(KIND).map(([k, t]) => `<option value="${k}" ${st.kind === k ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
          <div class="fld" id="cSyF" style="${st.kind === 'current' ? '' : 'display:none'}"><label>الموسم الدراسي الحالي</label><input class="inp" id="cSy" list="cSyL" value="${esc(st.sy || MK.curSy())}"><datalist id="cSyL">${YEARS.slice(0, 5).map(o => `<option value="${o}">`).join('')}</datalist></div>
          <div class="fgrid">
            <div class="fld"><label>الرقم</label><input class="inp" id="cNo" type="number" min="1" value="${esc(noFor(st).no)}" ${st.issuedId ? 'disabled' : ''}><span class="hint">يُعطى تلقائيا عند الطباعة (${String(noFor(st).year)})</span></div>
            <div class="fld"><label>التاريخ</label><input class="inp" type="date" id="cD" value="${esc(st.date)}"></div>
            <div class="fld"><label>حرر ب</label><input class="inp" id="cC" value="${esc(st.city)}"></div>
            <div class="fld"><label>الغرض</label><input class="inp" id="cP" value="${esc(st.purpose)}"></div>
          </div>
          ${SECC() ? '' : `<label class="chk"><input type="checkbox" id="cU" ${st.showUnit ? 'checked' : ''}> إظهار الوحدة المدرسية في الشهادة</label>`}
          <div id="cAopt" style="${st.model === 'attest' ? '' : 'display:none'}">
            <label class="chk" style="margin-top:6px"><input type="checkbox" data-o="showLvNo" ${st.showLvNo !== false ? 'checked' : ''}> رقم المستوى بين قوسين، مثال: ${esc(lvExample())}</label>
            <label class="chk" style="margin-top:6px"><input type="checkbox" data-o="showNo" ${st.showNo ? 'checked' : ''}> إظهار رقم الشهادة تحت العنوان</label>
            <label class="chk" style="margin-top:6px"><input type="checkbox" data-o="showReg" ${st.showReg ? 'checked' : ''}> إظهار رقم التسجيل</label>
            <label class="chk" style="margin-top:6px"><input type="checkbox" data-o="showLeave" ${st.showLeave ? 'checked' : ''}> إظهار تاريخ المغادرة</label>
          </div>
          <p class="muted" style="font-size:12px;line-height:1.7;margin-top:12px">تُسجل الشهادة في «سجل الشواهد المسلمة» برقمها عند الطباعة أو الحفظ PDF.</p>`;
        // pupil picker
        if (!st.issuedId) {
          const pk = $('#cpq', box), wrap = $('#cpk', box), list = $('.list', wrap);
          let items = [], hl = 0;
          const chip = () => {
            const x = stById(st.studentId);
            $('#cchip', box).innerHTML = x ? `<div class="emp-chip">${ic('cap', 'style="width:22px;height:22px;color:var(--pri)"')}<div><b>${esc(x.name)}</b><br>${esc(lvFull(x))}${x.regNo ? ' — رقم التسجيل: ' + esc(x.regNo) : ''}${x.unit && !SECC() ? ' — ' + esc(x.unit) : ''}</div></div>` : '';
            pk.value = x ? x.name : '';
          };
          const drawList = () => {
            const qq = key(pk.value);
            items = sortedStudents().filter(x => !qq || key(x.name + ' ' + (x.regNo || '')).includes(qq)).slice(0, 60);
            hl = Math.min(hl, Math.max(0, items.length - 1));
            list.innerHTML = items.length ? items.map((x, i) => `<div class="it ${i === hl ? 'hl' : ''}" data-i="${i}"><span>${esc(x.name)}</span><small>${esc(lvFull(x))} ${esc(x.regNo || '')}</small></div>`).join('') : '<div class="it muted">لا توجد نتائج — أضف التلميذ(ة) أولا</div>';
            $$('.it[data-i]', list).forEach(d => d.onmousedown = ev => { ev.preventDefault(); pick(items[+d.dataset.i]); });
          };
          const pick = x => { st.studentId = x.id; st.kind = x.status === 'current' ? 'current' : 'left'; wrap.classList.remove('open'); pk.blur(); chip(); $('#cK', box).value = st.kind; $('#cSyF', box).style.display = st.kind === 'current' ? '' : 'none'; if (st.__sync) st.__sync(); refresh(); };
          pk.onfocus = () => { pk.select(); hl = 0; drawList(); wrap.classList.add('open'); };
          pk.oninput = () => { hl = 0; drawList(); wrap.classList.add('open'); };
          pk.onblur = () => setTimeout(() => { wrap.classList.remove('open'); chip(); }, 120);
          pk.onkeydown = ev => {
            if (ev.key === 'ArrowDown') { hl = Math.min(hl + 1, items.length - 1); drawList(); ev.preventDefault(); }
            if (ev.key === 'ArrowUp') { hl = Math.max(hl - 1, 0); drawList(); ev.preventDefault(); }
            if (ev.key === 'Enter' && items[hl]) { pick(items[hl]); ev.preventDefault(); }
          };
          chip();
          if (!st.studentId) setTimeout(() => pk.focus(), 60);
          $('#cNewSt', box).onclick = () => studentForm(null, () => { const last = CD().students[CD().students.length - 1]; if (last) pick(last); });
        }
        const target = () => stById(st.studentId) || (st.issuedId ? ((CD().issued.find(r => r.id === st.issuedId) || {}).snap || null) : null);
        const syncSt = () => {
          const x = target() || {};
          const sug = !x.gender && x.name && window.Agent && Agent.genderOfName ? ({ M: 'ذكر', F: 'أنثى' }[Agent.genderOfName(x.name)] || '') : '';
          st.gender = x.gender || sug;
          $('#cG', box).value = st.gender; $('#cF', box).value = x.father || '';
          $('#cGh', box).textContent = sug ? 'مقترح حسب الاسم — تأكد منه' : (!x.gender && x.name ? 'غير محدد: تكتب الصيغة (ة) / (ا)' : '');
          $('#cFl', box).textContent = `اسم الأب (${st.gender === 'أنثى' ? 'من أبيها' : st.gender === 'ذكر' ? 'من أبيه' : 'من أبيه / أبيها'})`;
        };
        const saveSt = (k, val) => {
          const x = target(); if (!x) { toast('اختر التلميذ(ة) أولا', true); return; }
          x[k] = val;
          if (st.issuedId) { const r = CD().issued.find(y => y.id === st.issuedId); if (r && r.snap && r.snap !== x) r.snap[k] = val; }
          persist(); refresh();
        };
        $('#cG', box).onchange = e => { saveSt('gender', e.target.value); syncSt(); };
        $('#cF', box).oninput = e => { const x = target(); if (x) { x.father = e.target.value.trim(); persist(); refresh(); } };
        $('#cF', box).onchange = e => saveSt('father', e.target.value.trim());
        st.__sync = syncSt; syncSt();
        $('#cEdSt', box).onclick = () => { const x = stById(st.studentId); if (!x) return toast('اختر التلميذ(ة) أولا', true); studentForm(x, () => { syncSt(); refresh(); }); };
        $('#cK', box).onchange = e => { st.kind = e.target.value; $('#cSyF', box).style.display = st.kind === 'current' ? '' : 'none'; refresh(); };
        $('#cSy', box).oninput = e => { st.sy = e.target.value; refresh(); };
        $('#cNo', box).oninput = e => { st.no = +e.target.value || ''; st.noYear = +(st.date || today()).slice(0, 4); refresh(); };
        $('#cD', box).onchange = e => { st.date = e.target.value || today(); if (!st.issuedId) { const n = noFor(st); $('#cNo', box).value = n.no; $('.hint', $('#cNo', box).parentElement).textContent = `يُعطى تلقائيا عند الطباعة (${n.year})`; } refresh(); };
        $('#cC', box).oninput = e => { st.city = e.target.value; refresh(); };
        $('#cP', box).oninput = e => { st.purpose = e.target.value; refresh(); };
        if ($('#cU', box)) $('#cU', box).onchange = e => { st.showUnit = e.target.checked; refresh(); };
        const modeSeg = () => { const m = $('#mkMode'); if (m) m.style.display = st.model === 'attest' ? 'none' : ''; };
        $('#cM', box).onchange = e => { st.model = e.target.value; CD().model = st.model; persist(); $('#cAopt', box).style.display = st.model === 'attest' ? '' : 'none'; $('#cFsh', box).style.display = st.model === 'attest' ? 'none' : ''; modeSeg(); refresh(); };
        $$('[data-o]', box).forEach(el => el.onchange = () => { st[el.dataset.o] = el.checked; CD()[el.dataset.o] = el.checked; persist(); refresh(); });
        setTimeout(modeSeg, 0);
      },
      build: st => {
        const s = S(), x = stud(st);
        const n = noFor(st);
        st.noText = certNo(n);
        if (st.model === 'attest') return { page: 'a4', pages: [certAttest(s, x, st)] };
        return { page: 'two', pages: [() => certCopy(s, x, st)] };
      },
      validate: st => { if (!st.studentId && !st.issuedId) { toast('المرجو اختيار التلميذ(ة)', true); return false; } return true; },
      beforeOutput: async st => { saveIssued(st); return true; },
      onSave: async st => { saveIssued(st); toast('تم الحفظ في سجل الشواهد المسلمة: رقم ' + certNo({ no: st.no, year: st.year })); },
      fname: st => 'شهادة_مدرسية_' + (stud(st).name || '')
    });
    function saveIssued(st) {
      const x = stud(st);
      if (!x.gender && st.gender && stById(st.studentId)) { stById(st.studentId).gender = st.gender; }
      const now = new Date().toISOString();
      if (st.issuedId) {
        const r = CD().issued.find(y => y.id === st.issuedId);
        if (r) Object.assign(r, { date: st.date, city: st.city, purpose: st.purpose, kind: st.kind, showUnit: st.showUnit, model: st.model, showNo: st.showNo, showReg: st.showReg, showLeave: st.showLeave, showLvNo: st.showLvNo, showFather: st.showFather, sy: st.kind === 'current' ? st.sy || MK.schoolYear(st.date) : '', snap: stById(st.studentId) ? snapOf(x) : r.snap, updated: now });
      } else {
        const n = noFor(st);
        if (CD().issued.some(r => +r.year === n.year && +r.no === +n.no)) { n.no = nextNo(n.year); }
        const r = { id: uid('ce'), studentId: st.studentId, no: n.no, year: n.year, date: st.date, city: st.city, purpose: st.purpose, kind: st.kind, showUnit: st.showUnit, model: st.model, showNo: st.showNo, showReg: st.showReg, showLeave: st.showLeave, showLvNo: st.showLvNo, showFather: st.showFather,
          sy: st.kind === 'current' ? st.sy || MK.schoolYear(st.date) : '', snap: snapOf(x), created: now };
        CD().issued.push(r);
        Object.assign(st, { issuedId: r.id, no: r.no, year: r.year });
        // reopen as a saved certificate (the pupil can no longer be changed for this number)
        setTimeout(() => { if (current === 'certDoc') go('certDoc', { kind: 'cert', issuedId: r.id, mode: st.mode }); }, 0);
      }
      persist();
    }
  };
})();
