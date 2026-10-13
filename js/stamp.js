'use strict';
/* 1.9.3 — طابع المؤسسة الرقمي (اختياري): صورة PNG تُحمَّل مرة واحدة في «الإعدادات»، وتُوضع فوق عنوان توقيع رئيس المؤسسة («توقيع وخاتم رئيس المؤسسة»،
   «إمضاء رئيس المؤسسة»، «توقيع وطابع السيد المدير»…) في كل الوثائق المطبوعة أو المحفوظة PDF، عند تحديد خانة «الطابع الرقمي» في شريط الوثيقة.
   Aucune connexion: l'image reste dans les données de l'établissement. Mode «multiply»: un fond blanc disparaît sur le papier.
   Data (par établissement): settings.institutions[i].stamp (data URL), stampW (mm), stampH (mm), stampOn (bool) */
(function () {
  const Dx = window.Docs;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inst = () => (typeof instById === 'function' ? instById(DB.settings.activeInst) : null);
  const cfg = () => { const i = inst() || {}; return { url: i.stamp || '', w: +i.stampW || 32, h: +i.stampH || 32, on: !!(i.stamp && i.stampOn) }; };

  // labels of the director's signature: «توقيع رئيس المؤسسة» / «توقيع وخاتم السيد مدير المؤسسة» / «إمضاء رئيس المؤسسة» / «خاتم وتوقيع رئيس المؤسسة»…
  const LABEL = /(?:توقيع|إمضاء|امضاء|خاتم|طابع)[^<>\n]{0,28}?(?:رئيس(?:ة)?|مدير(?:ة)?)[^<>\n]{0,14}?المؤسس[ـة]{0,3}/;
  const LABEL_G = new RegExp(LABEL.source, 'g');

  function apply(html) {
    const c = cfg();
    if (!c.on || typeof html !== 'string') return html;
    let n = 0;
    const out = html.replace(/>([^<>]+)</g, (m, t) => (LABEL.test(t) ? '>' + t.replace(LABEL_G, x => { n++; return `<span class="stm-h">${x}<i class="stm"></i></span>`; }) + '<' : m));
    if (!n) return html;
    const css = `.stm-h{position:relative}.stm{position:absolute;left:50%;bottom:-4mm;margin-left:-${(c.w / 2).toFixed(1)}mm;width:${c.w}mm;height:${c.h}mm;background:url("${c.url}") center/contain no-repeat;mix-blend-mode:multiply;opacity:.92;pointer-events:none;z-index:6;-webkit-print-color-adjust:exact;print-color-adjust:exact}`;
    return out.includes('</style>') ? out.replace('</style>', css + '</style>') : out.replace('</head>', `<style>${css}</style></head>`);
  }
  // every document goes through Docs.bidi just before it is displayed, printed or saved
  if (Dx && typeof Dx.bidi === 'function' && !Dx.bidi.__stamp) {
    const b0 = Dx.bidi;
    Dx.bidi = h => apply(b0(h));
    Dx.bidi.__stamp = true;
  }

  // PNG kept with its transparency, reduced to a reasonable size
  function load(dataUrl) {
    return new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => {
        const sc = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.naturalWidth * sc)); c.height = Math.max(1, Math.round(img.naturalHeight * sc));
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        res({ url: c.toDataURL('image/png'), ratio: c.height / c.width });
      };
      img.onerror = () => rej(new Error('صورة غير صالحة'));
      img.src = dataUrl;
    });
  }

  function set(on) { const i = inst(); if (!i || !i.stamp) return; i.stampOn = !!on; persist(); }
  // checkbox of the document toolbar (only when a stamp has been uploaded)
  const chk = () => { const c = cfg(), i = inst(); return i && i.stamp ? `<label class="stm-chk" title="يوضع الطابع الرقمي فوق توقيع رئيس المؤسسة في الطباعة وحفظ PDF"><input type="checkbox" id="stmChk" ${c.on ? 'checked' : ''}> الطابع الرقمي</label>` : ''; };

  function card(box) {
    const draw = () => {
      const i = inst() || {}, c = cfg();
      box.innerHTML = `<div class="card-h"><h3>طابع المؤسسة الرقمي (اختياري)</h3></div><div class="card-b">
        <p class="muted" style="margin:0 0 10px;font-size:13px;line-height:1.9">حمّل صورة الطابع بصيغة PNG (يُفضل بخلفية شفافة). يوضع الطابع فوق عنوان توقيع رئيس المؤسسة في الوثائق عند تحديد خانة «الطابع الرقمي» في شريط كل وثيقة، أو من الخيار أدناه ليكون مفعلا دائما. لا يغادر الصورة هذا الحاسوب، ولا يُدرج في ملفات Word.</p>
        <div class="btn-row" style="flex-wrap:wrap;align-items:center">
          <button class="btn pri" id="stmUp">${i.stamp ? 'تغيير صورة الطابع' : 'تحميل صورة الطابع (PNG)'}</button>
          ${i.stamp ? '<button class="btn danger" id="stmDel">حذف الطابع</button>' : ''}
        </div>
        ${i.stamp ? `<div style="display:flex;gap:18px;align-items:center;flex-wrap:wrap;margin-top:12px">
          <div style="width:${Math.max(60, c.w * 3)}px;height:${Math.max(60, c.h * 3)}px;border:1px dashed #b9c2be;border-radius:8px;background:#fff url('${i.stamp}') center/contain no-repeat"></div>
          <div style="flex:1;min-width:230px">
            <div class="fld"><label>حجم الطابع في الوثيقة: <b id="stmWv">${c.w}</b> ملم</label><input type="range" id="stmW" min="18" max="55" step="1" value="${c.w}" style="width:100%"></div>
            <label class="hint" style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="stmOn" ${i.stampOn ? 'checked' : ''}> إدراج الطابع الرقمي في الوثائق (يمكن إلغاؤه لكل وثيقة)</label>
          </div></div>` : ''}
      </div>`;
      $('#stmUp').onclick = async () => {
        const d = await window.api.openImage(); if (!d) return;
        try {
          const r = await load(d), ii = inst(); ii.stamp = r.url; ii.stampW = ii.stampW || 32; ii.stampH = Math.round(ii.stampW * r.ratio * 10) / 10; if (ii.stampOn == null) ii.stampOn = true;
          persist(); draw(); toast('تم اعتماد الطابع الرقمي');
        } catch (e) { toast(e.message, true); }
      };
      if ($('#stmDel')) $('#stmDel').onclick = async () => { if (!await confirmBox('حذف صورة الطابع الرقمي؟', 'حذف')) return; const ii = inst(); delete ii.stamp; delete ii.stampW; delete ii.stampH; delete ii.stampOn; persist(); draw(); };
      if ($('#stmW')) $('#stmW').oninput = e => { const ii = inst(), w = +e.target.value, old = (+ii.stampW || 32), h = (+ii.stampH || 32); ii.stampH = Math.round(h * w / old * 10) / 10; ii.stampW = w; $('#stmWv').textContent = w; persist(); };
      if ($('#stmOn')) $('#stmOn').onchange = e => { inst().stampOn = e.target.checked; persist(); };
    };
    draw();
  }

  // the Word file never carries the digital stamp
  const strip = h => (typeof h === 'string' ? h.replace(/<i class="stm"><\/i>/g, '') : h);
  window.Stamp = { apply, set, chk, card, cfg, strip, LABEL };
})();
