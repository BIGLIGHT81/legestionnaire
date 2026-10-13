'use strict';
/* نقل البيانات بين حاسوبين بواسطة USB (1.9.2; 1.9.4: between any two activated computers, file encrypted for the receiving computer only).
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
    if (window.APP_MOBILE) { box.innerHTML = '<div class="card-h"><h3>نقل البيانات بين حاسوبين (USB)</h3></div><div class="card-b"><p class="muted" style="margin:0;font-size:12.8px;line-height:1.9">ملفات نقل البيانات (.lgx) خاصة بنسخة الحاسوب. في الهاتف استعمل «حفظ نسخة احتياطية» و«استرجاع نسخة احتياطية».</p></div>'; return; }
    const on = !!(st && st.active), dis = on ? '' : 'disabled';
    box.innerHTML = `<div class="card-h"><h3>نقل البيانات بين حاسوبين (USB)</h3></div><div class="card-b">
      <p class="muted" style="margin-top:0;font-size:12.8px;line-height:1.95">انقل المعطيات بين أي حاسوبين مفعَّلين (بنفس مفتاح التفعيل أو بمفتاح مختلف) دون إنترنت. الملف يُشفَّر لحاسوب واحد فقط، فلا يستطيع أي حاسوب آخر فتحه:<br>
        <b>1)</b> على الحاسوب <b>المستقبِل</b>: «رمز هذا الحاسوب» ثم «حفظ الرمز على USB» (أو انسخه وأرسله).<br>
        <b>2)</b> على الحاسوب <b>المرسِل</b> (الذي فيه المعطيات): «تصدير لحاسوب آخر»، ضع الرمز ثم احفظ الملف على USB.<br>
        <b>3)</b> على الحاسوب <b>المستقبِل</b>: «استيراد من USB» واختر الملف، ثم «دمج المعطيات الجديدة» أو «استبدال».<br>
        تُحفظ تلقائيا نسخة احتياطية من بياناتك قبل كل استيراد.</p>
      ${on ? '' : '<p style="color:var(--red);font-size:12.8px;margin:0 0 8px">فعّل البرنامج أولا لاستعمال نقل البيانات.</p>'}
      <div class="btn-row"><button class="btn" id="xfMe" ${dis}>${ic('key')} رمز هذا الحاسوب</button><button class="btn" id="xfOut" ${dis}>${ic('up')} تصدير لحاسوب آخر</button><button class="btn" id="xfIn" ${dis}>${ic('down')} استيراد من USB</button></div></div>`;
    const need = r => toast(r.error === 'inactive' ? 'فعّل البرنامج أولا لاستعمال نقل البيانات'
      : r.error === 'code' ? 'رمز الاستقبال غير صحيح: تأكد من نسخه كاملا'
      : r.error === 'other' ? 'هذا الملف مُعَدّ لحاسوب آخر (' + (r.to || '') + '). اطلب من المرسِل إعادة التصدير برمز هذا الحاسوب' + (r.me ? ' (' + r.me + ')' : '')
      : r.error === 'old' ? 'ملف من نسخة تجريبية سابقة: أعد التصدير بالطريقة الجديدة (رمز الحاسوب المستقبِل)'
      : r.error === 'key' ? 'تعذر فتح الملف: ملف تالف أو ليس ملف نقل بيانات من هذا البرنامج' : 'ملف غير صالح', true);
    const showMe = async renew => {
      const r = await window.api.xferMyCode(renew); if (r.error) return need(r);
      const body = document.createElement('div');
      body.innerHTML = `<p style="margin-top:0;line-height:1.9">أعطِ هذا الرمز للحاسوب المرسِل. الملف الذي يُصدَّر به لا يُفتح إلا على هذا الحاسوب.</p>
        <div style="direction:ltr;text-align:center;font:600 15px/1.8 Consolas,monospace;background:#f3f6f5;border:1px solid var(--line,#ddd);border-radius:10px;padding:10px;word-break:break-all;user-select:all">${esc(r.code)}</div>
        <p class="muted" style="font-size:12.5px;line-height:1.8">بصمة هذا الحاسوب: <b style="direction:ltr;display:inline-block">${esc(r.fp)}</b> — تظهر عند المرسِل للتأكد. الرمز ليس سرّيا ويمكن إرساله عبر واتساب أو البريد.</p>`;
      modal({ title: 'رمز الاستقبال لهذا الحاسوب', body, actions: [
        { label: ic('down') + ' حفظ الرمز على USB', cls: 'pri', onClick: async () => { const s = await window.api.xferSaveCode(r.code); if (s && s.ok) toast('تم حفظ ملف الرمز. خذه إلى الحاسوب المرسِل'); return false; } },
        { label: 'نسخ', onClick: () => { window.api.copy(r.code); toast('تم نسخ الرمز'); return false; } },
        { label: 'رمز جديد', onClick: async () => { if (!await confirmBox('الملفات المُعدّة بالرمز الحالي ولم تُستورد بعد لن تُفتح. إنشاء رمز جديد؟', 'رمز جديد')) return false; setTimeout(() => showMe(true), 50); } },
        { label: 'إغلاق' }] });
    };
    $('#xfMe', box).onclick = () => showMe(false);
    $('#xfOut', box).onclick = () => {
      const body = document.createElement('div');
      body.innerHTML = `<p style="margin-top:0;line-height:1.9">ضع رمز الاستقبال الخاص بالحاسوب الذي ستُنقل إليه المعطيات (يظهر فيه عند الضغط على «رمز هذا الحاسوب»)، أو افتح ملف الرمز من USB.</p>
        <textarea class="inp" id="xfCode" rows="3" dir="ltr" style="width:100%;font-family:Consolas,monospace" placeholder="LG-XXXX-XXXX-XXXX-..."></textarea>
        <div class="btn-row" style="margin-top:8px"><button class="btn" id="xfOpenCode">${ic('up')} فتح ملف الرمز</button><span id="xfFp" class="muted" style="font-size:12.8px;align-self:center"></span></div>`;
      const ta = $('#xfCode', body), fpEl = $('#xfFp', body);
      const chk = async () => { const v = ta.value.trim(); if (!v) { fpEl.textContent = ''; return null; } const c = await window.api.xferCheckCode(v);
        fpEl.innerHTML = c.ok ? (c.own ? '<span style="color:#b45309">هذا رمز هذا الحاسوب نفسه</span>' : '✓ رمز صحيح — بصمة الحاسوب المستقبِل: <b dir="ltr">' + esc(c.fp) + '</b>') : '<span style="color:var(--red)">رمز غير صحيح</span>'; return c; };
      ta.addEventListener('input', chk);
      $('#xfOpenCode', body).onclick = async () => { const r = await window.api.xferReadCode(); if (r && r.ok) { ta.value = r.code; chk(); } else if (r && r.error) need(r); };
      modal({ title: 'تصدير المعطيات لحاسوب آخر', body, actions: [
        { label: ic('down') + ' تصدير وحفظ الملف', cls: 'pri', onClick: async () => {
          const c = await chk(); if (!c || !c.ok) { toast('ضع رمز الاستقبال الصحيح أولا', true); return false; }
          await persist(true);
          const r = await window.api.xferExport(DB, ta.value.trim());
          if (r.error) { need(r); return false; }
          if (!r.ok) return false;
          toast('تم حفظ ملف النقل للحاسوب ' + r.fp + '. على ذلك الحاسوب اختر «استيراد من USB».');
        } },
        { label: 'إلغاء' }] });
      setTimeout(() => ta.focus(), 60);
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
