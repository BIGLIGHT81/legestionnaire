'use strict';
/* العطل المدرسية — official Moroccan school-holidays list (editable), per school year.
   Shown on the dashboard (next holiday) and manageable / printable from the settings page. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();

  // default list: الموسم الدراسي 2026/2027 (as published, مصدر 2M.ma). hijri feasts keep their wording;
  // `from` carries an approximate Gregorian date only for ordering ("القادمة").
  const DEFAULT_2627 = [
    { name: 'الفترة البينية الأولى', when: 'من الأحد 18 أكتوبر إلى الأحد 25 أكتوبر 2026', from: '2026-10-18', to: '2026-10-25', days: '8' },
    { name: 'عيد الوحدة', when: 'السبت 31 أكتوبر 2026', from: '2026-10-31', to: '2026-10-31', days: '1' },
    { name: 'ذكرى المسيرة الخضراء', when: 'الجمعة 6 نونبر 2026', from: '2026-11-06', to: '2026-11-06', days: '1' },
    { name: 'عيد الاستقلال', when: 'الأربعاء 18 نونبر 2026', from: '2026-11-18', to: '2026-11-18', days: '1' },
    { name: 'الفترة البينية الثانية', when: 'من الأحد 6 دجنبر إلى الأحد 13 دجنبر 2026', from: '2026-12-06', to: '2026-12-13', days: '8' },
    { name: 'فاتح السنة الميلادية', when: 'الجمعة فاتح يناير 2027', from: '2027-01-01', to: '2027-01-01', days: '1' },
    { name: 'ذكرى تقديم وثيقة الاستقلال', when: 'الإثنين 11 يناير 2027', from: '2027-01-11', to: '2027-01-11', days: '1' },
    { name: 'فاتح السنة الأمازيغية', when: 'الخميس 14 يناير 2027', from: '2027-01-14', to: '2027-01-14', days: '1' },
    { name: 'عطلة منتصف السنة الدراسية', when: 'من الأحد 24 يناير إلى الأحد 31 يناير 2027', from: '2027-01-24', to: '2027-01-31', days: '8' },
    { name: 'عيد الفطر', when: 'من 29 رمضان إلى 2 شوال 1448', from: '2027-03-19', to: '2027-03-22', days: '3 أو 4', hijri: true },
    { name: 'الفترة البينية الثالثة', when: 'من الأحد 21 مارس إلى الأحد 28 مارس 2027', from: '2027-03-21', to: '2027-03-28', days: '8' },
    { name: 'عيد الشغل', when: 'السبت فاتح ماي 2027', from: '2027-05-01', to: '2027-05-01', days: '1' },
    { name: 'الفترة البينية الرابعة', when: 'من الأحد 9 ماي إلى الأحد 16 ماي 2027', from: '2027-05-09', to: '2027-05-16', days: '8' },
    { name: 'عيد الأضحى', when: 'من 9 إلى 11 ذي الحجة 1448', from: '2027-05-27', to: '2027-05-29', days: '3', hijri: true },
    { name: 'فاتح السنة الهجرية', when: 'فاتح محرم 1449', from: '2027-06-17', to: '2027-06-17', days: '1', hijri: true }
  ];

  function migrate(db) {
    const g = db.settings = db.settings || {};
    if (!g.holidays || !Array.isArray(g.holidays)) g.holidays = [];
    if (!g.holidaysSeeded) {
      if (!g.holidays.length) g.holidays = DEFAULT_2627.map(h => Object.assign({ id: uid('hol'), sy: '2026/2027' }, h));
      g.holidaysSeeded = true;
    }
  }
  const HD = () => DB.settings.holidays;
  const syOf = h => h.sy || (window.MK ? MK.schoolYear(h.from || today()) : '');
  const curSy = () => window.MK ? (MK.curSy ? MK.curSy() : MK.schoolYear(today())) : '';
  const forSy = sy => HD().filter(h => syOf(h) === sy).sort((a, b) => String(a.from || '').localeCompare(String(b.from || '')));
  const years = () => Array.from(new Set([curSy()].concat(HD().map(syOf)).filter(Boolean))).sort().reverse();

  // next upcoming holiday of the current school year (for the dashboard)
  function summary() {
    migrate(DB);
    const sy = curSy();
    const list = forSy(sy);
    const t = today();
    const next = list.find(h => (h.to || h.from || '') >= t) || null;
    return { sy, count: list.length, next: next ? { name: next.name, when: next.when, days: next.days, hijri: !!next.hijri } : null };
  }

  window.Holidays = { migrate, summary, openManager, printList, forSy, curSy, years };

  /* ---------- manager (view / add / edit / delete) ---------- */
  let mSy = null;
  function openManager() {
    migrate(DB);
    if (!mSy) mSy = curSy();
    const body = document.createElement('div');
    body.className = 'hol-mgr';
    const draw = () => {
      const list = forSy(mSy);
      const t = today();
      body.innerHTML = `<div class="hol-bar">
          <select class="inp" id="holSy" style="width:auto">${years().map(y => `<option value="${y}" ${y === mSy ? 'selected' : ''}>الموسم الدراسي ${esc(y.replace('/', '-'))}</option>`).join('')}</select>
          <span style="flex:1"></span>
          <button class="btn sm" id="holAdd">${ic('plus')} إضافة عطلة</button>
          <button class="btn sm" id="holPrint">${ic('print')} طباعة اللائحة</button></div>
        ${list.length ? `<table class="tbl compact hol-tbl"><thead><tr><th style="width:34px">#</th><th>العطلة المدرسية</th><th>التواريخ</th><th style="width:70px">الأيام</th><th style="width:88px"></th></tr></thead><tbody>
          ${list.map((h, i) => `<tr data-id="${h.id}" class="${(h.to || h.from || '') < t ? 'hol-past' : ''}"><td class="muted num">${i + 1}</td>
            <td><b>${esc(h.name)}</b>${h.hijri ? ' <span class="hol-hj">هجري</span>' : ''}</td><td>${esc(h.when || '')}</td><td class="num">${esc(h.days || '')}</td>
            <td class="act"><button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}
          </tbody></table>` : '<div class="empty-state">لا توجد عطل لهذا الموسم. أضف عطلة أو استعمل موسما آخر.</div>'}
        <p class="muted" style="font-size:12px;line-height:1.7;margin:10px 0 0">اللائحة قابلة للتعديل: عدّل التواريخ حسب المذكرة الرسمية لمؤسستك. تواريخ الأعياد الدينية (هجري) تقريبية للترتيب وتظهر بصيغتها الهجرية.</p>`;
      $('#holSy', body).onchange = e => { mSy = e.target.value; draw(); };
      $('#holAdd', body).onclick = () => editHol(null);
      $('#holPrint', body).onclick = () => printList(mSy);
      $$('tr[data-id]', body).forEach(tr => {
        const h = HD().find(x => x.id === tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          if (btn.dataset.a === 'edit') return editHol(h);
          if (btn.dataset.a === 'del' && await confirmBox(`حذف «${esc(h.name)}» من لائحة العطل؟`, 'حذف')) {
            DB.settings.holidays = HD().filter(x => x.id !== h.id); persist(); draw();
          }
        });
      });
    };
    function editHol(h) {
      const d = Object.assign({ name: '', when: '', from: '', to: '', days: '', hijri: false, sy: mSy }, h || {});
      const fb = document.createElement('div');
      fb.innerHTML = `<div class="fld"><label>اسم العطلة <span style="color:var(--red)">*</span></label><input class="inp" data-k="name" value="${esc(d.name)}"></div>
        <div class="fld"><label>التواريخ (كما تظهر في اللائحة)</label><input class="inp" data-k="when" value="${esc(d.when)}" placeholder="مثال: من الأحد 18 أكتوبر إلى الأحد 25 أكتوبر 2026"></div>
        <div class="fgrid"><div class="fld"><label>من (للترتيب)</label><input class="inp" type="date" data-k="from" value="${esc(d.from)}"></div>
          <div class="fld"><label>إلى</label><input class="inp" type="date" data-k="to" value="${esc(d.to)}"></div>
          <div class="fld"><label>عدد الأيام</label><input class="inp" data-k="days" value="${esc(d.days)}"></div>
          <div class="fld"><label>الموسم الدراسي</label><input class="inp" data-k="sy" value="${esc(d.sy)}" placeholder="2026/2027"></div></div>
        <label class="chk" style="margin-top:4px"><input type="checkbox" data-k="hijri" ${d.hijri ? 'checked' : ''}> عطلة دينية (تاريخ هجري تقريبي)</label>`;
      modal({ title: h ? 'تعديل عطلة' : 'إضافة عطلة', body: fb, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
        const o = {}; $$('[data-k]', fb).forEach(el => { o[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value.trim(); });
        if (!o.name) { toast('المرجو كتابة اسم العطلة', true); return false; }
        if (!o.when && o.from) o.when = o.to && o.to !== o.from ? `من ${fmtDate(o.from)} إلى ${fmtDate(o.to)}` : fmtDate(o.from);
        if (!o.sy) o.sy = window.MK ? MK.schoolYear(o.from || today()) : mSy;
        if (h) Object.assign(h, o); else HD().push(Object.assign({ id: uid('hol') }, o));
        mSy = o.sy; persist(); draw();
      } }, { label: 'إلغاء' }] });
    }
    draw();
    modal({ title: '📅 العطل المدرسية', body, size: 'lg', actions: [{ label: 'إغلاق' }] });
  }

  // open the printable list (preview + print / PDF, with the licence watermark) in its own page
  function printList(sy) { go('holidaysDoc', { sy: sy || mSy || curSy() }); }

  /* ---------- printable list (A4) ---------- */
  function docPages(s, sy) {
    const list = forSy(sy);
    const rows = list.map((h, i) => `<tr><td>${i + 1}</td><td class="r b">${esc(h.name)}</td><td class="r">${esc(h.when || '')}</td><td>${esc(h.days || '')}</td></tr>`);
    return MK.flowPages({ page: 'a4', head: `<div class="mk-hdr">${Dx.header(s)}</div><div class="mk-title">لائحة العطل المدرسية — الموسم الدراسي ${esc(String(sy).replace('/', '-'))}</div>`,
      blocks: [{ table: { cls: 'hol-print', head: '<tr><th style="width:9%">ر.ت</th><th>العطلة المدرسية</th><th style="width:44%">التواريخ</th><th style="width:14%">عدد الأيام</th></tr>', rows, minRows: 1 } },
        MK.signBlock(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' })] });
  }
  window.pageHolidaysDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    MK.docPage(v, {
      title: 'لائحة العطل المدرسية', icon: '📅', modes: false, flow: true,
      state: { sy: arg.sy || curSy() },
      back: () => go('settings'),
      form: (box, st, refresh) => {
        box.innerHTML = `<div class="sec-t">الموسم الدراسي</div><div class="fld"><select class="inp" id="hY">${years().map(y => `<option value="${y}" ${y === st.sy ? 'selected' : ''}>${esc(y.replace('/', '-'))}</option>`).join('')}</select></div>
          <p class="muted" style="font-size:12px;line-height:1.7">لتعديل اللائحة ارجع إلى «الإعدادات» ← «العطل المدرسية».</p>`;
        $('#hY', box).onchange = e => { st.sy = e.target.value; refresh(); };
      },
      build: st => ({ page: 'a4', pages: docPages(S(), st.sy) }),
      fname: st => 'لائحة_العطل_' + String(st.sy).replace('/', '-')
    });
  };
})();
