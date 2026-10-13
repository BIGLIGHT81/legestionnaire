'use strict';
/* العتاد والأجهزة — equipment lent to employees (laptops, laser pointers, wireless LAN keys, projectors...):
   register, assignment / return, French "Attestation de mise à disposition", Excel import (DONNE ENS3 files) / export. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();

  // French grammar of each kind: d'un/d'une, de l'/du/de la, cet/ce/cette
  const KINDS = [
    { k: 'pc', ar: 'حاسوب محمول', fr: 'ordinateur portable', g: 'm' },
    { k: 'ptr', ar: 'مؤشر ليزر (جهاز تحكم في العرض)', fr: 'pointeur laser', g: 'm' },
    { k: 'wlan', ar: 'مفتاح الشبكة اللاسلكية (Wireless LAN)', fr: 'clef WIRELESS LAN UNIT', short: 'clef WIRELESS LAN', g: 'f' },
    { k: 'proj', ar: 'جهاز العرض (Data show)', fr: 'vidéoprojecteur', g: 'm' },
    { k: 'tab', ar: 'لوحة إلكترونية', fr: 'tablette', g: 'f' },
    { k: 'prn', ar: 'طابعة', fr: 'imprimante', g: 'f' },
    { k: 'tbi', ar: 'سبورة تفاعلية', fr: 'tableau blanc interactif', g: 'm' },
    { k: 'spk', ar: 'مكبر صوت', fr: 'haut-parleur', g: 'm', aspH: true }
  ];
  const vowel = (s, aspH) => /^[aeéèêëiîïoôuûy]/i.test(s) || (!aspH && /^h/i.test(s));
  const kindOf = k => KINDS.concat((DB.stock.equipKinds || [])).find(x => x.k === k) || { k, ar: k, fr: k, g: 'm' };
  const fr = (kd, form) => {
    const n = kd.short || kd.fr, full = kd.fr, v = vowel(n, kd.aspH), f = kd.g === 'f';
    if (form === 'un') return (f ? "d'une " : "d'un ") + full;
    if (form === 'de') return (v ? "de l'" : f ? 'de la ' : 'du ') + n;
    if (form === 'ce') return (f ? 'cette ' : v ? 'cet ' : 'ce ') + n;
    return n;
  };
  const guessKind = txt => {
    const t = String(txt || '').toLowerCase();
    if (/imprimante|printer|laserjet|deskjet|officejet|pixma|ecotank|i-sensys/.test(t)) return 'prn';
    if (/laser|lazer|pointeur|presenter|presentation|remote|r500|r400/.test(t)) return 'ptr';
    if (/wireless|wirless|wlan|lan unit|elpap|clef|clé/.test(t)) return 'wlan';
    if (/projecteur|projector|data ?show|epson eb|vidéo/.test(t)) return 'proj';
    if (/tablette|tablet|ipad|galaxy tab/.test(t)) return 'tab';
    if (/imprimante|printer|laserjet|deskjet/.test(t)) return 'prn';
    if (/interactif|interactive|tbi/.test(t)) return 'tbi';
    if (/ordinateur|laptop|portable|lenovo|hp |dell|acer|asus|pc/.test(t)) return 'pc';
    return '';
  };

  const ED = () => DB.stock.equip;
  const key = s => MK.hkey(s);
  const empName = e => e ? fullName(e) : '';
  const nameFrOf = (e, r) => (r && r.nameFr) || (e ? `${(e.lastFr || '').toUpperCase()} ${(e.firstFr || '').toUpperCase()}`.trim() : '') || empName(e);
  const holder = r => (r.empId && empById(r.empId)) || null;
  const holderName = r => { const e = holder(r); return e ? empName(e) : (r.empName || ''); };

  function migrate(db) {
    const s = db.stock; if (!s) return;
    s.equip = Array.isArray(s.equip) ? s.equip : [];
    s.equipKinds = Array.isArray(s.equipKinds) ? s.equipKinds : [];
  }

  /* ---------------- tab ---------------- */
  const flt = { q: '', kind: '', st: '' };
  function tab(b) {
    migrate(DB);
    const all = ED();
    const assigned = all.filter(r => r.empId).length;
    const kindsUsed = Array.from(new Set(all.map(r => r.kind)));
    b.innerHTML = `<div class="card">
      <div class="card-b kpis"><div>مجموع العتاد: <b>${all.length}</b></div><div>مسلم للموظفين: <b style="color:var(--pri)">${assigned}</b></div><div>متوفر بالمؤسسة: <b>${all.length - assigned}</b></div>${all.filter(r => r.status === 'panne').length ? `<div>معطل: <b style="color:var(--red)">${all.filter(r => r.status === 'panne').length}</b></div>` : ''}</div>
      <div class="toolbar">
        <div class="search">${ic('search')}<input class="inp" id="eq" placeholder="بحث بالرقم التسلسلي، رقم الجرد، المستفيد..." value="${esc(flt.q)}"></div>
        <select class="inp" id="ek" style="width:auto"><option value="">كل الأنواع</option>${kindsUsed.map(k => `<option value="${esc(k)}" ${flt.kind === k ? 'selected' : ''}>${esc(kindOf(k).ar)}</option>`).join('')}</select>
        <select class="inp" id="es" style="width:auto"><option value="">الكل</option><option value="a" ${flt.st === 'a' ? 'selected' : ''}>مسلم</option><option value="f" ${flt.st === 'f' ? 'selected' : ''}>متوفر بالمؤسسة</option></select>
        <span style="flex:1"></span>
        <button class="btn sm" id="eTpl">${ic('down')} نموذج Excel</button>
        <button class="btn sm" id="eImp" title="يمكنك اختيار عدة ملفات دفعة واحدة، ملف لكل نوع تجهيز">${ic('up')} استيراد Excel (عدة ملفات)</button>
        <button class="btn sm" id="eExp">${ic('down')} تصدير Excel</button>
        <button class="btn sm" id="eReg">${ic('print')} سجل العتاد</button>
        <button class="btn sm" id="eAtt">${ic('print')} شهادات التسليم</button>
        <button class="btn sm danger" id="eDel" title="حذف العتاد والأجهزة من السجل دفعة واحدة" ${all.length ? '' : 'disabled'}>${ic('trash')} مسح العتاد</button>
        <button class="btn sm pri" id="eAdd">${ic('plus')} إضافة عتاد</button></div>
      <div id="eT"></div></div>
      <p class="muted" style="font-size:12.5px;margin-top:10px">المستفيدون هم موظفو المؤسسة (لائحة «الموظفون»). تطبع «Attestation de mise à disposition» بالفرنسية: أدخل اسم المؤسسة والمدينة بالفرنسية في «الإعدادات»، والإطار بالفرنسية واسم الموظف بالحروف اللاتينية في «الموظفون».</p>`;
    const list = () => {
      const qq = key(flt.q);
      return ED().filter(r => (!flt.kind || r.kind === flt.kind) && (!flt.st || (flt.st === 'a' ? !!r.empId : !r.empId))
        && (!qq || key([r.serial, r.inv, r.brand, r.model, holderName(r), r.nameFr, (holder(r) || {}).ppr].join(' ')).includes(qq)))
        .sort((a, c) => String(a.inv || '').localeCompare(String(c.inv || ''), 'fr', { numeric: true }) || String(a.serial || '').localeCompare(String(c.serial || '')));
    };
    const draw = () => {
      const L = list();
      $('#eT').innerHTML = L.length ? `<table class="tbl compact"><thead><tr><th style="width:36px">#</th><th>النوع</th><th>العلامة / الطراز</th><th>الرقم التسلسلي</th><th>رقم الجرد</th><th>المستفيد(ة)</th><th>تاريخ التسليم</th><th></th></tr></thead><tbody>
        ${L.map((r, i) => { const e = holder(r); return `<tr data-id="${r.id}"><td class="muted num">${i + 1}</td><td class="nw">${esc(kindOf(r.kind).ar.replace(/ \(.*\)$/, ''))}${r.status === 'panne' ? ' <span class="tag inquiry">معطل</span>' : ''}</td>
          <td><b dir="ltr">${esc(r.brand || '')}</b><br><small class="muted" dir="ltr">${esc(r.model || '')}</small></td>
          <td class="num" dir="ltr" style="text-align:right">${esc(r.serial || '')}</td><td class="num">${esc(r.inv || '')}</td>
          <td class="name-cell">${r.empId ? `<b>${esc(holderName(r))}</b><small title="${esc(r.etab || '')}">${esc((e && e.ppr) || '')}</small>` : '<span class="tag">متوفر بالمؤسسة</span>'}</td>
          <td class="num">${r.empId ? fmtDate(r.since) : ''}</td>
          <td class="act">${r.empId ? `<button class="btn sm pri" data-a="att">${ic('print')} الشهادة</button> <button class="btn sm" data-a="ret">استرجاع</button>` : `<button class="btn sm" data-a="give">${ic('outbox')} تسليم</button>`}
            <button class="btn sm" data-a="edit">${ic('edit')}</button> <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`; }).join('')}
        </tbody></table>` : `<div class="empty-state">${ED().length ? 'لا توجد نتائج مطابقة' : 'لا يوجد عتاد بعد. أضف جهازا أو استورد ملف Excel (DONNE ENS3...).'}</div>`;
      $$('#eT tr[data-id]').forEach(tr => {
        const r = ED().find(x => x.id === tr.dataset.id);
        $$('[data-a]', tr).forEach(btn => btn.onclick = async () => {
          const a = btn.dataset.a;
          if (a === 'att') go('equipDoc', { kind: 'att', ids: [r.id] });
          if (a === 'edit') equipForm(r, draw);
          if (a === 'give') equipForm(r, draw, true);
          if (a === 'ret') returnForm(r, draw);
          if (a === 'del' && await confirmBox(`حذف ${esc(kindOf(r.kind).ar)} <b dir="ltr">${esc(r.serial || r.inv || '')}</b> من سجل العتاد؟`, 'حذف')) { DB.stock.equip = ED().filter(x => x.id !== r.id); persist(); draw(); }
        });
        tr.ondblclick = () => equipForm(r, draw);
      });
    };
    $('#eq').oninput = e => { flt.q = e.target.value; draw(); };
    $('#ek').onchange = e => { flt.kind = e.target.value; draw(); };
    $('#es').onchange = e => { flt.st = e.target.value; draw(); };
    $('#eAdd').onclick = () => equipForm(null, () => go('stock', { tab: 'equip' }));
    $('#eDel').onclick = () => bulkDelete(list());
    $('#eImp').onclick = importEquip;
    $('#eTpl').onclick = downloadTemplate;
    $('#eExp').onclick = exportEquip;
    $('#eReg').onclick = () => go('equipDoc', { kind: 'reg' });
    $('#eAtt').onclick = () => { const ids = list().filter(r => r.empId).map(r => r.id); if (!ids.length) return toast('لا يوجد عتاد مسلم في اللائحة الحالية', true); go('equipDoc', { kind: 'att', ids }); };
    draw();
  }

  /* ---------------- مسح العتاد والأجهزة دفعة واحدة ---------------- */
  function bulkDelete(shown) {
    const all = ED(); if (!all.length) return;
    const kinds = Array.from(new Set(all.map(r => r.kind)));
    const filtered = shown.length && shown.length < all.length;
    const custom = (DB.stock.equipKinds || []).length;
    const body = document.createElement('div');
    body.innerHTML = `<div class="radio-col">
        <label class="chk"><input type="radio" name="dS" value="all" checked> كل العتاد والأجهزة المسجلة (<b>${all.length}</b>)</label>
        ${filtered ? `<label class="chk"><input type="radio" name="dS" value="shown"> العتاد المعروض حاليا حسب البحث والتصفية (<b>${shown.length}</b>)</label>` : ''}
        <label class="chk"><input type="radio" name="dS" value="kind"> نوع محدد:
          <select class="inp" id="dK" style="width:auto;min-height:30px;padding:3px 8px">${kinds.map(k => `<option value="${esc(k)}">${esc(kindOf(k).ar)} (${all.filter(r => r.kind === k).length})</option>`).join('')}</select></label>
        <label class="chk"><input type="radio" name="dS" value="free"> المتوفر بالمؤسسة فقط، غير المسلم للموظفين (<b>${all.filter(r => !r.empId).length}</b>)</label>
        ${custom ? `<label class="chk" style="margin-top:6px"><input type="checkbox" id="dKinds"> حذف أنواع العتاد المضافة يدويا أيضا (${custom})</label>` : ''}
      </div>
      <p class="ag-warn" style="margin:12px 0 0">${ic('alert')} <span>الحذف نهائي: يُمسح العتاد من السجل ومن شهادات التسليم. يمكن استرجاعه فقط من النسخ الاحتياطية (الإعدادات). يُستحسن «تصدير Excel» قبل المسح.</span></p>`;
    $('#dK', body).onfocus = () => { $('input[value=kind]', body).checked = true; };
    modal({ title: 'مسح العتاد والأجهزة', size: 'sm', body, actions: [{ label: ic('trash') + ' مسح', cls: 'danger', onClick: async () => {
      const sc = $('input[name=dS]:checked', body).value, k = $('#dK', body).value;
      const del = sc === 'all' ? all : sc === 'shown' ? shown : sc === 'kind' ? all.filter(r => r.kind === k) : all.filter(r => !r.empId);
      if (!del.length) { toast('لا يوجد عتاد مطابق', true); return false; }
      const kd = $('#dKinds', body) && $('#dKinds', body).checked && sc === 'all';
      if (!await confirmBox(`تأكيد المسح النهائي لـ <b>${del.length}</b> جهاز/عتاد${del.filter(r => r.empId).length ? ` (منها <b>${del.filter(r => r.empId).length}</b> مسلم للموظفين)` : ''}؟`, 'مسح نهائي')) return false;
      const ids = new Set(del.map(r => r.id));
      DB.stock.equip = all.filter(r => !ids.has(r.id));
      if (kd) DB.stock.equipKinds = [];
      persist(); go('stock', { tab: 'equip' }); toast(`تم مسح ${del.length} من العتاد والأجهزة`);
    } }, { label: 'إلغاء' }] });
  }

  /* ---------------- forms ---------------- */
  const kindOptions = sel => KINDS.concat(DB.stock.equipKinds).map(k => `<option value="${esc(k.k)}" ${k.k === sel ? 'selected' : ''}>${esc(k.ar)} — ${esc(k.fr)}</option>`).join('') + '<option value="__new">+ نوع آخر...</option>';
  function equipForm(r, after, focusGive) {
    const d = Object.assign({ kind: 'pc', since: today(), etab: S().schoolFr || '', status: 'ok' }, r || {});
    const body = document.createElement('div');
    body.innerHTML = `<div class="fgrid">
      <div class="fld full"><label>النوع</label><select class="inp" id="qK">${kindOptions(d.kind)}</select>
        <div id="qKn" class="fgrid" style="display:none;margin-top:8px"><input class="inp" id="qKar" placeholder="الاسم بالعربية"><input class="inp" id="qKfr" dir="ltr" placeholder="Nom en français (ex: caméra)">
          <select class="inp" id="qKg"><option value="m">masculin (un / du / ce)</option><option value="f">féminin (une / de la / cette)</option></select></div></div>
      <div class="fld"><label>Marque (العلامة)</label><input class="inp" id="qB" dir="ltr" value="${esc(d.brand || '')}"></div>
      <div class="fld"><label>Modèle (الطراز)</label><input class="inp" id="qM" dir="ltr" value="${esc(d.model || '')}"></div>
      <div class="fld"><label>Numéro de série (الرقم التسلسلي)</label><input class="inp" id="qS" dir="ltr" value="${esc(d.serial || '')}"></div>
      <div class="fld"><label>Numéro d'inventaire (رقم الجرد)</label><input class="inp" id="qI" dir="ltr" value="${esc(d.inv || '')}"></div>
      <div class="fld full"><label>Accessoires (الملحقات)</label><input class="inp" id="qA" dir="ltr" value="${esc(d.acc || '')}" placeholder="CABLE + CHARGEUR + CARTABLE + SOURIS"></div>
      <div class="fld"><label>الحالة</label><select class="inp" id="qSt"><option value="ok" ${d.status !== 'panne' ? 'selected' : ''}>صالح</option><option value="panne" ${d.status === 'panne' ? 'selected' : ''}>معطل</option></select></div>
      <div class="fld"><label>ملاحظة</label><input class="inp" id="qN" value="${esc(d.note || '')}"></div>
      <div class="full sec-t">التسليم</div>
      <div class="fld full"><label>المستفيد(ة)</label><select class="inp" id="qE"><option value="">— متوفر بالمؤسسة (غير مسلم) —</option>${sortedEmps().map(e => `<option value="${e.id}" ${e.id === d.empId ? 'selected' : ''}>${esc(fullName(e))}${e.ppr ? ' — ' + esc(e.ppr) : ''}</option>`).join('')}</select></div>
      <div class="fld"><label>تاريخ التسليم</label><input class="inp" type="date" id="qD" value="${esc(d.since || today())}"></div>
      <div class="fld"><label>Etablissement scolaire</label><input class="inp" id="qEt" dir="ltr" value="${esc(d.etab || '')}"></div>
      <div class="fld"><label>M., Mme, Mlle (الاسم بالفرنسية)</label><input class="inp" id="qNf" dir="ltr"></div>
      <div class="fld"><label>Cadre</label><input class="inp" id="qC" dir="ltr"></div>
      <div class="fld"><label>Numéro de la CNIE</label><input class="inp" id="qCn" dir="ltr"></div>
      <div class="full hint muted" style="font-size:11.5px">معطيات المستفيد بالفرنسية تؤخذ من لائحة الموظفين، وما تكتبه هنا يحفظ أيضا في ملف الموظف إن كان فارغا.</div></div>`;
    const empFill = () => {
      const e = empById($('#qE', body).value);
      $('#qNf', body).value = e ? nameFrOf(e, r && r.empId === e.id ? r : null) : '';
      $('#qC', body).value = e ? (e.cadreFr || (r && r.empId === e.id && r.cadreFr) || '') : '';
      $('#qCn', body).value = e ? (e.cin || (r && r.empId === e.id && r.cnie) || '') : '';
    };
    empFill();
    $('#qE', body).onchange = empFill;
    $('#qK', body).onchange = () => { $('#qKn', body).style.display = $('#qK', body).value === '__new' ? '' : 'none'; };
    modal({ title: r ? (focusGive ? 'تسليم عتاد لموظف(ة)' : 'تعديل عتاد') : 'إضافة عتاد', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      let kind = $('#qK', body).value;
      if (kind === '__new') {
        const ar = $('#qKar', body).value.trim(), frn = $('#qKfr', body).value.trim();
        if (!ar || !frn) { toast('المرجو كتابة اسم النوع بالعربية والفرنسية', true); return false; }
        kind = 'x' + Date.now().toString(36);
        DB.stock.equipKinds.push({ k: kind, ar, fr: frn, g: $('#qKg', body).value });
      }
      const o = { kind, brand: $('#qB', body).value.trim(), model: $('#qM', body).value.trim(), serial: $('#qS', body).value.trim(), inv: $('#qI', body).value.trim(),
        acc: $('#qA', body).value.trim(), status: $('#qSt', body).value, note: $('#qN', body).value.trim(), etab: $('#qEt', body).value.trim() };
      if (!o.serial && !o.inv) { toast('المرجو إدخال الرقم التسلسلي أو رقم الجرد', true); return false; }
      const dup = ED().find(x => x !== r && ((o.serial && key(x.serial) === key(o.serial)) || (o.inv && x.kind === o.kind && key(x.inv) === key(o.inv))));
      if (dup) { toast(`هذا الجهاز مسجل مسبقا (${dup.serial || dup.inv})`, true); return false; }
      const empId = $('#qE', body).value, e = empById(empId);
      const nameFr = $('#qNf', body).value.trim(), cadreFr = $('#qC', body).value.trim(), cnie = $('#qCn', body).value.trim();
      if (e) { if (!e.cadreFr && cadreFr) e.cadreFr = cadreFr; if (!e.cin && cnie) e.cin = cnie; }
      const rec = r || { id: uid('eq'), history: [] };
      if (r && r.empId && r.empId !== empId) (rec.history = rec.history || []).push({ empId: r.empId, name: holderName(r), from: r.since, to: today() });
      Object.assign(rec, o, { empId: e ? e.id : '', empName: e ? fullName(e) : '', since: e ? $('#qD', body).value || today() : '', nameFr: e && nameFr !== nameFrOf(e) ? nameFr : '', cadreFr: e && !e.cadreFr ? cadreFr : '', cnie: e && !e.cin ? cnie : '' });
      if (!r) ED().push(rec);
      persist(); after && after(); toast('تم الحفظ');
    } }, { label: 'إلغاء' }] });
    if (focusGive) setTimeout(() => $('#qE', body).focus(), 60);
  }
  function returnForm(r, after) {
    const body = `<p style="margin-top:0">استرجاع ${esc(kindOf(r.kind).ar)} <b dir="ltr">${esc(r.serial || r.inv)}</b> من ${esc(holderName(r))}.</p>
      <div class="fld"><label>تاريخ الاسترجاع</label><input class="inp" type="date" id="rD" value="${today()}"></div>`;
    modal({ title: 'استرجاع عتاد', size: 'sm', body, actions: [{ label: 'استرجاع', cls: 'pri', onClick: m => {
      (r.history = r.history || []).push({ empId: r.empId, name: holderName(r), from: r.since, to: $('#rD', m).value || today() });
      Object.assign(r, { empId: '', empName: '', since: '', nameFr: '', cadreFr: '', cnie: '' });
      persist(); after && after(); toast('تم الاسترجاع: الجهاز متوفر بالمؤسسة');
    } }, { label: 'إلغاء' }] });
  }

  /* ---------------- Excel ---------------- */
  const COLS = [['kind', 'Type (النوع)'], ['brand', 'Marque'], ['model', 'Modèle'], ['serial', 'Numéro de série'], ['inv', "Numéro d'inventaire"], ['acc', 'Accessoires'],
    ['etab', 'Etablissement scolaire'], ['cadre', 'Cadre'], ['cnie', 'Numéro de la CNIE'], ['ppr', 'Numéro de PPR'], ['name', 'M., Mme, Mlle'], ['since', 'Date de remise (تاريخ التسليم)']];
  const keyOf = h => {
    const n = key(h); if (!n) return null;
    if (/^type|^النوع/.test(n)) return 'kind';
    if (/^marque|^العلامه/.test(n)) return 'brand';
    if (/^modele|^الطراز/.test(n)) return 'model';
    if (/^numerodeserie|^nserie|^serie|الرقمالتسلسلي/.test(n)) return 'serial';
    if (/inventaire|رقمالجرد/.test(n)) return 'inv';
    if (/^accessoire|الملحقات/.test(n)) return 'acc';
    if (/^etablissement|^ecole|المؤسسه/.test(n)) return 'etab';
    if (/^cadre|الاطار/.test(n)) return 'cadre';
    if (/cnie|^cin|البطاقه/.test(n)) return 'cnie';
    if (/ppr|رقمالتاجير/.test(n)) return 'ppr';
    if (/^mmmemlle|^mmme|^nometprenom|^nomcomplet|^beneficiaire|المستفيد|الاسم/.test(n)) return 'name';
    if (/^datederemise|^date|تاريخالتسليم/.test(n)) return 'since';
    return null;
  };
  // one Excel file (or sheet) = one lot of equipment; several files can be imported at once (a type of equipment per file)
  function parseEquipFile(name, sheets) {
    let found = null;
    for (const sh of sheets) { const h = MK.headerRow(sh.rows, keyOf, 3); if (h) { found = { sh, h }; break; } }
    if (!found) return { name, error: true };
    const col = {}; found.h.map.forEach((k, i) => { if (k && col[k] == null) col[k] = i; });
    const g = (r, k) => (col[k] == null ? '' : String(r[col[k]] == null ? '' : r[col[k]]).trim());
    const rows = found.sh.rows.slice(found.h.hi + 1).filter(r => g(r, 'serial') || g(r, 'inv') || g(r, 'ppr'));
    const headerTxt = (found.sh.rows[found.h.hi] || []).join(' ');
    const guess = col.kind != null ? '' : (guessKind(name) || guessKind(found.sh.name) || guessKind(rows.map(r => g(r, 'brand') + ' ' + g(r, 'model')).join(' ')) || guessKind(headerTxt) || 'pc');
    return { name, col, g, rows, guess };
  }
  async function importEquip() {
    let files = [];
    if (window.api.openTables) {
      const res = await window.api.openTables({ csv: true });
      if (!res) return;
      (res.files || []).forEach(f => {
        if (f.sheets || f.text != null) files.push({ name: f.name, sheets: MK.allSheets(f.sheets ? { sheets: f.sheets } : { text: f.text }) });
      });
      if (res.errors && res.errors.length) toast(`تعذرت قراءة: ${res.errors.join('، ')}`, true);
    } else {
      const sheets = await MK.openTable(); if (!sheets) return;
      files = [{ name: '', sheets }];
    }
    if (!files.length) return;
    const parsed = files.map(f => parseEquipFile(f.name, f.sheets));
    const bad = parsed.filter(p => p.error), okf = parsed.filter(p => !p.error && p.rows.length);
    if (!okf.length) return toast(bad.length === parsed.length ? 'لم يتم العثور على أعمدة العتاد (Marque, Modèle, Numéro de série, Numéro d\'inventaire...)' : 'الملفات لا تحتوي على أجهزة (الرقم التسلسلي / رقم الجرد / رقم التأجير فارغة)', true);
    const runFile = (P, kindAll, accAll, st) => {
      const { col, g, rows } = P;
      rows.forEach(r => {
        const kind = kindAll || guessKind(g(r, 'kind')) || guessKind(g(r, 'brand') + ' ' + g(r, 'model')) || 'pc';
        const ppr = g(r, 'ppr').replace(/\.0+$/, ''), nameFr = g(r, 'name'), cnie = g(r, 'cnie'), cadreFr = g(r, 'cadre');
        let e = null;
        if (ppr) e = DB.employees.find(x => String(x.ppr || '') === ppr);
        if (!e && nameFr) e = DB.employees.find(x => key(`${x.lastFr || ''} ${x.firstFr || ''}`) === key(nameFr) || key(`${x.firstFr || ''} ${x.lastFr || ''}`) === key(nameFr));
        if (!e && (ppr || nameFr)) { e = { id: uid('e'), firstAr: nameFr, lastAr: '', lastFr: nameFr, ppr, cin: cnie, cadreFr }; DB.employees.push(e); st.emps++; }
        if (e) { if (!e.cin && cnie) e.cin = cnie; if (!e.cadreFr && cadreFr) e.cadreFr = cadreFr; }
        const o = { kind, brand: g(r, 'brand'), model: g(r, 'model'), serial: g(r, 'serial'), inv: g(r, 'inv').replace(/\.0+$/, ''), acc: g(r, 'acc') || accAll || '', etab: g(r, 'etab'), status: 'ok' };
        const since = normDate(g(r, 'since')) || today();
        let rec = ED().find(x => (o.serial && key(x.serial) === key(o.serial)) || (!o.serial && o.inv && x.kind === kind && key(x.inv) === key(o.inv)));
        if (rec) { Object.keys(o).forEach(k => { if (o[k]) rec[k] = o[k]; }); st.updated++; } else { rec = Object.assign({ id: uid('eq'), history: [] }, o); ED().push(rec); st.added++; }
        if (e) Object.assign(rec, { empId: e.id, empName: fullName(e), since: rec.since || since, nameFr: nameFr && nameFr !== nameFrOf(e) ? nameFr : '' });
      });
    };
    const finish = st => {
      persist(); go('stock', { tab: 'equip' });
      toast(`تم استيراد ${st.added} جهاز${st.updated ? `، وتحديث ${st.updated}` : ''}${st.emps ? `، وأضيف ${st.emps} موظف(ة) إلى لائحة الموظفين` : ''}${okf.length > 1 ? ` من ${okf.length} ملفات` : ''}`);
    };
    const ACC = { pc: 'CABLE + CHARGEUR + CARTABLE + SOURIS' };
    const kindOpts = sel => KINDS.concat(DB.stock.equipKinds).map(k => `<option value="${k.k}" ${k.k === sel ? 'selected' : ''}>${esc(k.ar)} — ${esc(k.fr)}</option>`).join('');
    const ask = okf.filter(P => P.col.kind == null);
    if (!ask.length) { const st = { added: 0, updated: 0, emps: 0 }; okf.forEach(P => runFile(P, '', '', st)); return finish(st); }
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin-top:0;line-height:1.8">${okf.length > 1 ? `تم العثور على <b>${okf.length}</b> ملفات تضم <b>${okf.reduce((a, P) => a + P.rows.length, 0)}</b> جهازا. حدّد نوع العتاد لكل ملف (اقترحه البرنامج من اسم الملف ومحتواه):` : `تم العثور على <b>${okf[0].rows.length}</b> جهاز في الملف. ما نوع هذا العتاد؟`}</p>
      ${bad.length ? `<p class="ag-warn" style="margin:0 0 8px">${ic('alert')} <span>تم تجاهل ${bad.length} ملف بدون أعمدة العتاد: ${esc(bad.map(b => b.name).join('، '))}</span></p>` : ''}
      ${okf.map((P, i) => `<div class="fld" data-i="${i}" style="border-bottom:1px solid var(--line);padding-bottom:8px">${P.name ? `<label dir="auto"><b>${esc(P.name)}</b> — ${P.rows.length} جهاز</label>` : ''}
        ${P.col.kind == null ? `<select class="inp iK">${kindOpts(P.guess)}</select>${P.col.acc == null ? `<input class="inp iA" dir="ltr" style="margin-top:6px" placeholder="Accessoires (اختياري)" value="${esc(ACC[P.guess] || '')}">` : ''}` : '<span class="muted">النوع محدد داخل الملف</span>'}</div>`).join('')}`;
    const m0 = modal({ title: 'استيراد العتاد', size: okf.length > 1 ? 'md' : 'sm', body, actions: [{ label: ic('up') + ' استيراد', cls: 'pri', onClick: m => {
      const st = { added: 0, updated: 0, emps: 0 };
      okf.forEach((P, i) => { const box = $(`[data-i="${i}"]`, m); const k = $('.iK', box), a = $('.iA', box); runFile(P, k ? k.value : '', a ? a.value.trim() : '', st); });
      finish(st);
    } }, { label: 'إلغاء' }] });
    $$('.fld', m0.el).forEach(box => { const k = $('.iK', box), a = $('.iA', box); if (k && a) k.onchange = () => { a.value = ACC[k.value] || ''; }; });
  }
  async function downloadTemplate() {
    const rows = [COLS.map(c => c[1])];
    for (let i = 0; i < 30; i++) rows.push(COLS.map(() => ''));
    const r = await window.api.saveXlsx(rows, 'نموذج_العتاد.xlsx', 'العتاد', [16, 16, 30, 18, 14, 30, 40, 26, 16, 14, 30, 16]);
    if (r.ok) toast('تم حفظ النموذج: املأه ثم استورده');
  }
  async function exportEquip() {
    const rows = [COLS.map(c => c[1]).concat(['المستفيد(ة)'])].concat(ED().map(r => { const e = holder(r); return [kindOf(r.kind).fr, r.brand || '', r.model || '', r.serial || '', r.inv || '', r.acc || '', r.etab || '',
      e ? (e.cadreFr || r.cadreFr || '') : '', e ? (e.cin || r.cnie || '') : '', e ? e.ppr || '' : '', e ? nameFrOf(e, r) : '', r.since ? fmtDate(r.since) : '', holderName(r)]; }));
    const r = await window.api.saveXlsx(rows, 'سجل_العتاد.xlsx', 'العتاد', [16, 16, 30, 18, 14, 30, 40, 26, 16, 14, 30, 16, 26]);
    if (r.ok) toast('تم التصدير إلى Excel');
  }

  /* ---------------- documents ---------------- */
  const B = v => `<b>${esc(v || '')}</b>`;
  function attestation(s, r, st) {
    const kd = kindOf(r.kind), e = holder(r) || {};
    const date = st.useSince && r.since ? r.since : st.date;
    return `
      ${Dx.header(s)}
      <div class="att" dir="ltr" lang="fr">
        <p class="att-city">${esc((st.city || '').toUpperCase())} LE : ${esc(fmtDate(date))}</p>
        <h1>Attestation de mise à disposition ${esc(fr(kd, 'un'))}</h1>
        <p class="att-h">Bénéficiaire</p>
        <p>M., Mme, Mlle : ${B(nameFrOf(e, r))}</p>
        <p>Numéro de PPR : ${B(e.ppr)}</p>
        <p>Numéro de la CNIE : ${B(e.cin || r.cnie)}</p>
        <p>Cadre : ${B(e.cadreFr || r.cadreFr)}</p>
        <p>Etablissement scolaire : ${B(r.etab || s.schoolFr)}</p>
        <p class="att-h">Contenu et références ${esc(fr(kd, 'de'))}</p>
        <ul>
          <li>Marque ${esc(fr(kd, 'de'))} : ${B(r.brand)}</li>
          <li>Modèle ${esc(fr(kd, 'de'))} : ${B(r.model)}</li>
          <li>Numéro de série ${esc(fr(kd, 'de'))} : ${B(r.serial)}</li>
          <li>Numéro d’inventaire ${esc(fr(kd, 'de'))} : ${B(r.inv)}</li>
          <li>Accessoires : ${B(r.acc)}</li>
        </ul>
        <p class="att-mt">Par la présente, Je, soussigné, m’engage à :</p>
        <ul>
          <li>Maintenir cet outil de travail dans un parfait état de fonctionnement ;</li>
          <li>A restituer ${esc(fr(kd, 'ce'))}, à la direction de l’établissement scolaire à la demande de l’Administration.</li>
        </ul>
        <p class="att-ps"><i>PS : En cas de panne ${esc(fr(kd, 'de'))}, veuillez en avertir le service concerné au niveau de la Direction Provinciale sous couvert de la Direction de l’établissement scolaire.</i></p>
        <table class="att-sig"><tr><td>Direction de l’établissement scolaire<br>……………………………………<br>Signature et cachet</td>
          <td>Bénéficiaire<br>……………………………………<br>Signature (avec la mention lu et approuvé)</td></tr></table>
      </div>
      <div class="spacer"></div>`;
  }
  Dx.modCss = (Dx.modCss || '') + `
  .att{font-family:'Calibri','Carlito','Segoe UI',Arial,sans-serif;font-size:11.5pt;line-height:1.45;text-align:left;margin-top:2mm}
  .att p{margin:0 0 .6mm}.att ul{margin:0 0 1mm;padding-left:9mm}.att li{margin:0 0 .4mm}
  .att h1{text-align:center;font-size:17pt;font-weight:700;margin:5mm 12mm 6mm;line-height:1.25}
  .att-city{text-align:right;font-weight:700;margin-top:1mm!important}
  .att-h{font-weight:700;text-decoration:underline;margin-top:4mm!important}
  .att-mt{margin-top:4mm!important}.att-ps{margin-top:3mm!important;padding-left:5mm}
  .att-sig{width:100%;border-collapse:collapse;margin-top:6mm}.att-sig td{border:1px solid #000;width:50%;text-align:center;vertical-align:top;height:38mm;padding:2mm;line-height:2.1}
  `;

  window.pageEquipDoc = function (v, arg) {
    migrate(DB);
    arg = arg || {};
    if (arg.kind === 'reg') {
      MK.docPage(v, {
        title: 'سجل العتاد المسلم', icon: '💻', modes: false, state: { kind: '', city: S().city || '', date: today() },
        back: () => go('stock', { tab: 'equip' }),
        form: (box, st, refresh) => {
          const kinds = Array.from(new Set(ED().map(r => r.kind)));
          box.innerHTML = `<div class="sec-t">السجل</div><div class="fld"><label>النوع</label><select class="inp" id="rk"><option value="">كل الأنواع</option>${kinds.map(k => `<option value="${esc(k)}">${esc(kindOf(k).ar)}</option>`).join('')}</select></div>
            <div class="sec-t">التحرير</div><div class="fgrid"><div class="fld"><label>حرر ب</label><input class="inp" id="rc" value="${esc(st.city)}"></div><div class="fld"><label>في</label><input class="inp" type="date" id="rd" value="${esc(st.date)}"></div></div>`;
          $('#rk', box).onchange = e => { st.kind = e.target.value; refresh(); };
          $('#rc', box).oninput = e => { st.city = e.target.value; refresh(); };
          $('#rd', box).onchange = e => { st.date = e.target.value; refresh(); };
        },
        build: st => {
          const s = S();
          const L = ED().filter(r => !st.kind || r.kind === st.kind).sort((a, c) => String(a.inv || '').localeCompare(String(c.inv || ''), 'fr', { numeric: true }));
          const rows = L.map((r, i) => { const e = holder(r); return [i + 1, esc(kindOf(r.kind).ar), `<span dir="ltr">${esc(r.brand || '')}</span>`, `<span dir="ltr">${esc(r.model || '')}</span>`, `<span dir="ltr">${esc(r.serial || '')}</span>`, esc(r.inv || ''),
            r.empId ? `<b>${esc(holderName(r))}</b>` : 'متوفر بالمؤسسة', esc((e && e.ppr) || ''), `<span dir="ltr">${esc(r.etab || '')}</span>`, r.since ? fmtDate(r.since) : '', '']; });
          return { page: 'a4l', pages: MK.tablePages({ s, page: 'a4l', title: st.kind ? `سجل العتاد: ${esc(kindOf(st.kind).ar)}` : 'سجل العتاد المسلم للموظفين',
            info: `<div class="mk-info">العدد: <b>${L.length}</b> — مسلم: <b>${L.filter(r => r.empId).length}</b></div>`,
            cols: [{ h: 'ر.ت', w: '4%' }, { h: 'النوع', w: '9%', cls: 'sm' }, { h: 'Marque', w: '7%', cls: 'sm' }, { h: 'Modèle', w: '13%', cls: 'sm' }, { h: 'N° de série', w: '10%', cls: 'sm' }, { h: 'N° inventaire', w: '6%' },
              { h: 'المستفيد(ة)', cls: 'r' }, { h: 'رقم التأجير', w: '7%' }, { h: 'Etablissement', w: '14%', cls: 'sm' }, { h: 'تاريخ التسليم', w: '8%' }, { h: 'التوقيع', w: '8%' }],
            rows, sign: MK.signBlock(s, { city: st.city, date: st.date }), minRows: 8 }) };
        },
        fname: () => 'سجل_العتاد'
      });
      return;
    }
    const ids = (arg.ids || []).filter(id => ED().some(r => r.id === id));
    MK.docPage(v, {
      title: 'Attestation de mise à disposition', icon: '💻', modes: false, state: { ids, city: S().cityFr || S().city || '', date: today(), useSince: true },
      back: () => go('stock', { tab: 'equip' }),
      form: (box, st, refresh) => {
        const L = ED().filter(r => st.ids.includes(r.id));
        const missing = L.filter(r => { const e = holder(r) || {}; return !(e.cadreFr || r.cadreFr) || !(e.cin || r.cnie) || !(r.etab || S().schoolFr); }).length;
        box.innerHTML = `<div class="sec-t">العتاد (${L.length})</div>
          <div style="max-height:220px;overflow:auto;font-size:12.5px;line-height:1.8">${L.map(r => `<div>${esc(kindOf(r.kind).ar)} <b dir="ltr">${esc(r.serial || r.inv)}</b> — ${esc(holderName(r))}</div>`).join('')}</div>
          ${missing ? `<p class="muted" style="font-size:12px;color:var(--red)">تنبيه: ${missing} شهادة ناقصة المعطيات (Cadre / CNIE / Etablissement). أتممها من «الموظفون» أو من نافذة تعديل العتاد.</p>` : ''}
          <div class="sec-t">التحرير</div>
          <div class="fgrid"><div class="fld"><label>المدينة (بالفرنسية)</label><input class="inp" id="ac" dir="ltr" value="${esc(st.city)}"></div>
            <div class="fld"><label>التاريخ</label><input class="inp" type="date" id="ad" value="${esc(st.date)}"></div></div>
          <label class="chk"><input type="checkbox" id="au" ${st.useSince ? 'checked' : ''}> استعمال تاريخ تسليم كل جهاز (إن وجد)</label>`;
        $('#ac', box).oninput = e => { st.city = e.target.value; refresh(); };
        $('#ad', box).onchange = e => { st.date = e.target.value; refresh(); };
        $('#au', box).onchange = e => { st.useSince = e.target.checked; refresh(); };
      },
      build: st => { const s = S(); const L = ED().filter(r => st.ids.includes(r.id)); return { page: 'a4', pages: L.length ? L.map(r => attestation(s, r, st)) : [''] }; },
      validate: st => { if (!st.ids.length) { toast('لا يوجد عتاد', true); return false; } return true; },
      fname: st => 'Attestation_' + (st.ids.length === 1 ? (ED().find(r => r.id === st.ids[0]) || {}).serial || '' : st.ids.length)
    });
  };

  window.Equip = { tab, migrate };
})();
