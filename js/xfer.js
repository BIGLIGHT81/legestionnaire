'use strict';
/* نقل البيانات بين حاسوبين بواسطة USB (1.9.2) — shown in the settings page when the key activates two computers.
   Export: an encrypted .lgx file holding all the data. Import: merge the new data (records are matched by their id,
   the newer one wins) or replace this computer's data entirely. */
(function () {
  const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
  const stamp = o => { const v = o && (o.updated || o.upd || o.modified); return v == null || v === '' ? null : (typeof v === 'number' ? v : String(v)); };
  // 1 = incoming is newer, -1 = local is newer, 0 = unknown
  const newer = (loc, inc) => { const a = stamp(loc), b = stamp(inc); if (a == null || b == null || typeof a !== typeof b) return 0; return b > a ? 1 : b < a ? -1 : 0; };
  const idArr = a => Array.isArray(a) && a.length && a.every(x => isObj(x) && typeof x.id === 'string');

  // merge(local, incoming, pref): pref 1 = incoming wins unknown conflicts (default), -1 = local wins
  function merge(loc, inc, pref) {
    if (inc === undefined) return loc;
    if (loc === undefined || loc === null) return inc;
    if (Array.isArray(loc) && Array.isArray(inc)) {
      if (idArr(loc) && idArr(inc)) {
        const out = loc.slice(), pos = new Map(loc.map((x, i) => [x.id, i]));
        for (const x of inc) {
          if (!pos.has(x.id)) { pos.set(x.id, out.length); out.push(x); continue; }
          const i = pos.get(x.id), n = newer(out[i], x);
          out[i] = merge(out[i], x, n || pref);
        }
        return out;
      }
      if (!loc.length) return inc;
      if (!inc.length) return loc;
      return pref >= 0 ? inc : loc; // tables of rows / lists of values: cannot be told apart, keep one side
    }
    if (isObj(loc) && isObj(inc)) {
      const n = newer(loc, inc), p = n || pref, out = Object.assign({}, loc);
      for (const k of Object.keys(inc)) out[k] = merge(loc[k], inc[k], p);
      return out;
    }
    if (inc === '' || inc === null) return loc;
    if (loc === '' || loc === null) return inc;
    return pref >= 0 ? inc : loc;
  }

  const count = d => {
    const n = x => Array.isArray(x) ? x.length : 0;
    const y = o => Object.values((o && o.years) || {}).reduce((s, v) => s + (Array.isArray(v) ? v.length : (v && Array.isArray(v.pupils) ? v.pupils.length : 0)), 0);
    return { emps: n(d.employees), recs: n(d.records), pupils: y(d.pupils) };
  };

  function card(box, st) {
    const two = (st.maxPc || 1) > 1;
    box.innerHTML = `<div class="card-h"><h3>نقل البيانات بين حاسوبين (USB)</h3></div><div class="card-b">
      <p class="muted" style="margin-top:0;font-size:12.8px;line-height:1.9">${two
        ? 'إذا فعّلت البرنامج على حاسوبين فقط (محمول ومكتبي) فيمكنك نقل المعطيات الجديدة بينهما بمفتاح USB: <b>1)</b> على الحاسوب الذي أدخلت فيه المعطيات الجديدة اضغط «تصدير إلى USB» واحفظ الملف على المفتاح. <b>2)</b> على الحاسوب الآخر اضغط «استيراد من USB» واختر الملف، ثم اختر «دمج المعطيات الجديدة» (تُضاف المعطيات الجديدة وتُحدَّث الأحدث دون مسح ما عندك) أو «استبدال» (تصبح بيانات هذا الحاسوب نسخة طبق الأصل من الملف).<br>الملف مشفر ولا يفتحه إلا حاسوب مفعّل بنفس مفتاح التفعيل، ولا يمر عبر الإنترنت. تُحفظ تلقائيا نسخة احتياطية من بياناتك قبل كل استيراد.'
        : 'هذه الميزة متاحة في النسخة المفعلة لحاسوبين (الإصدار 1.9.2 فما فوق) لمن يشتغل على حاسوب محمول وآخر مكتبي. نسختك الحالية مرخصة لحاسوب واحد.'}</p>
      ${two ? `<div class="btn-row"><button class="btn" id="xfOut">${ic('up')} تصدير إلى USB</button><button class="btn" id="xfIn">${ic('down')} استيراد من USB</button></div>` : ''}</div>`;
    if (!two) return;
    const need = r => toast(r.error === 'inactive' ? 'فعّل البرنامج أولا لاستعمال نقل البيانات' : r.error === 'single' ? 'هذه الميزة خاصة بالنسخة المفعلة لحاسوبين' : r.error === 'key' ? 'هذا الملف لا يخص حاسوبيك: لا يمكن فتحه إلا بنفس مفتاح التفعيل' : 'ملف غير صالح', true);
    $('#xfOut', box).onclick = async () => {
      await persist(true);
      const r = await window.api.xferExport(DB);
      if (r.error) return need(r);
      if (r.ok) toast('تم حفظ ملف النقل. انقل المفتاح إلى الحاسوب الآخر ثم اختر «استيراد من USB».');
    };
    $('#xfIn', box).onclick = async () => {
      const r = await window.api.xferImport();
      if (!r || r.ok === false) return;
      if (r.error) return need(r);
      const d = r.data;
      if (!d || !d.settings || !Array.isArray(d.employees)) return toast('ملف غير صالح', true);
      const a = count(DB), b = count(d);
      const body = document.createElement('div');
      body.innerHTML = `<p style="margin-top:0;line-height:1.9">ملف مصدّر بتاريخ <b>${esc(fmtDate((r.at || '').slice(0, 10)))}</b> ${r.own ? '<span style="color:#b45309">(من هذا الحاسوب نفسه)</span>' : ''}</p>
        <table class="tbl"><thead><tr><th></th><th>هذا الحاسوب</th><th>الملف</th></tr></thead><tbody>
        <tr><td>الموظفون</td><td class="num">${a.emps}</td><td class="num">${b.emps}</td></tr>
        <tr><td>الوثائق في السجل</td><td class="num">${a.recs}</td><td class="num">${b.recs}</td></tr>
        <tr><td>التلاميذ</td><td class="num">${a.pupils}</td><td class="num">${b.pupils}</td></tr></tbody></table>
        <p class="muted" style="font-size:12.5px;line-height:1.8">«دمج»: تُضاف المعطيات الجديدة وتُحدَّث العناصر الأحدث، ولا يُحذف شيء (الحذف لا ينتقل بين الحاسوبين). «استبدال»: تُحذف بيانات هذا الحاسوب وتحل محلها بيانات الملف.</p>`;
      modal({ title: 'استيراد ملف نقل البيانات', body, actions: [
        { label: ic('check') + ' دمج المعطيات الجديدة', cls: 'pri', onClick: async () => { DB = merge(DB, d, 1); migrate(); await persist(true); toast('تم دمج المعطيات الجديدة'); go('settings'); } },
        { label: 'استبدال بيانات هذا الحاسوب', cls: 'danger', onClick: async () => { if (!await confirmBox('ستُستبدل جميع بيانات هذا الحاسوب ببيانات الملف. متابعة؟', 'استبدال')) return false; DB = d; migrate(); await persist(true); toast('تم استبدال البيانات'); go('settings'); } },
        { label: 'إلغاء' }] });
    };
  }
  window.Xfer = { card, merge, count };
})();
