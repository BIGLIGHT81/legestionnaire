'use strict';
/* 1.9.3 — طابع المؤسسة الرقمي (اختياري): صورة PNG تُحمَّل مرة واحدة في «الإعدادات»، وتُوضع تحت عنوان توقيع رئيس المؤسسة («توقيع وخاتم رئيس المؤسسة»،
   «إمضاء رئيس المؤسسة»، «توقيع وطابع السيد المدير»…) في كل الوثائق المطبوعة أو المحفوظة PDF، عند تحديد خانة «الطابع الرقمي» في شريط الوثيقة.
   Aucune connexion: l'image reste dans les données de l'établissement. Mode «multiply»: un fond blanc disparaît sur le papier.
   Data (par établissement): settings.institutions[i].stamp (data URL), stampW (mm), stampH (mm), stampOn (bool) */
(function () {
  const Dx = window.Docs;
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const inst = () => (typeof instById === 'function' ? instById(DB.settings.activeInst) : null);
  const cfg = () => { const i = inst() || {}; return { url: i.stamp || '', w: +i.stampW || 32, h: +i.stampH || 32, on: !!(i.stamp && i.stampOn) }; };

  // labels of the director's signature: «توقيع رئيس المؤسسة» / «توقيع وخاتم السيد مدير المؤسسة» / «إمضاء رئيس المؤسسة» / «خاتم وتوقيع رئيس المؤسسة»…
  // 1.9.4: also «توقيع وخاتم المدير(ة)», «توقيع السيد المدير», «توقيع الرئيس المباشر» (= the director for the staff), «Signature du Directeur»…
  // (never the provincial / regional director, the association, the centres)
  const NOT_PROV = '(?![ \\u00a0]*(?:الإقليمي|الاقليمي|الجهوي|الإقليمية|الاقليمية))';
  const LABEL = new RegExp('(?:توقيع|إمضاء|امضاء|خاتم|طابع)[^<>\\n]{0,28}?(?:'
    + '(?:رئيس(?:ة)?|مدير(?:ة)?)[^<>\\n]{0,14}?المؤسس[ـة]{0,3}'
    + '|(?:السيد(?:\\(ة\\)|ة)? )?المدير(?:\\(ة\\)|ة)?(?!ي)' + NOT_PROV
    + '|الرئيس(?:\\(ة\\))? المباشر(?:\\(ة\\))?)'
    + '|رأي (?:السيد )?(?:رئيس|مدير)(?:\\(ة\\)|ة)? المؤسس[ـة]{0,3} و(?:توقيعه|خاتمه)'
    + '|(?:Signature|Cachet|Visa)[^<>\\n]{0,25}?(?:d[ue] (?:la |l[\'’])?)?(?:[Dd]irect(?:eur|rice)(?! provincial| régional)|[Cc]hef d[\'’]établissement)');
  const LABEL_G = new RegExp(LABEL.source, 'g');
  // a caption that is only the title, under which the director signs: «رئيس المؤسسة», «مدير(ة) المؤسسة»، «المدير(ة)»، «Le Directeur (cachet et signature)»
  const TITLE = /^\s*(?:(?:رئيس المجلس[،,] ?)?(?:السيد(?:\(ة\)|ة)? )?(?:رئيس|مدير)(?:\(ة\)|ة)? المؤسس[ـة]{0,3}(?: ?\/ ?رئيس(?:\(ة\))? المجلس)?|(?:السيد(?:\(ة\)|ة)? )?المدير(?:\(ة\)|ة)?|(?:Le |La )?(?:Directeur|Directrice)(?: de l[’']établissement)?(?: \([^()]{0,30}\))?|(?:Le |La )?[Cc]hef d[’']établissement)\s*[:：]?\s*$/;

  function apply(html) {
    const c = cfg();
    if (!c.on || typeof html !== 'string') return html;
    let n = 0;
    const mark = x => { n++; return `<span class="stm-h">${x}<i class="stm"></i></span>`; };
    const plain = h => h.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
    let out = html.replace(/>([^<>]+)</g, (m, t, off, all) => {
      if (LABEL.test(t)) return '>' + t.replace(LABEL_G, mark) + '<';
      if (TITLE.test(t)) {
        // not the sender of a letter («مدير المؤسسة / إلى / السيد المدير الإقليمي»), not «أنا الموقع(ة) أسفله: … مدير المؤسسة»
        const next = plain(all.slice(off + m.length - 1, off + m.length + 400)).trim(), prev = plain(all.slice(Math.max(0, off - 400), off));
        if (/^(?:إلى|الى|إلي|ألى|à|A)\b|^(?:إلى|الى)/.test(next) || /الموقع/.test(prev.slice(-120)) || /(?:^|\s)(?:من|من لدن|من طرف|De|de)\s*:?\s*$/.test(prev)) return m;
        // a caption only at the end of its page / copy (a role in a table in the middle of the page is not a signature)
        const rest = all.slice(off + m.length - 1), e = rest.search(/class="(?:page-a4l?|sheet|copy|cs-copy|vs-let|iv|ivo|iv-cut|inc-rc)[" ]|<!--cls:/); // 1.9.4: each copy of a sheet holding several copies ends here too
        if (plain(e < 0 ? rest : rest.slice(0, e)).replace(/[.…_\-—–ـ:]/g, '').trim().length > 260) return m;
        const a = t.match(/^\s*/)[0], b = t.match(/\s*$/)[0]; return '>' + a + mark(t.trim()) + b + '<';
      }
      return m;
    });
    // an element marked in the template (data-stm) = the place of the director's signature
    out = out.replace(/(<[a-z0-9]+\b[^>]*\bdata-stm\b[^>]*>)([^<>]*)/g, (m, tag, t, off, all) => { if (/class="stm-h"/.test(m) || all.startsWith('<span class="stm-h"', off + m.length)) return m; return tag + mark(t); });
    if (!n) return html;
    // the director's name printed just under the label: the stamp goes under the name, so it never covers it
    const nm = String((inst() || {}).director || '').trim();
    if (nm) {
      const q = esc(nm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      out = out.replace(new RegExp('<i class="stm"></i></span>((?:(?!class="stm-h")[^]){0,400}?>)([^<>]{0,25}' + q + '[^<>]{0,25})<', 'g'),
        (m, mid, t) => '</span>' + mid + '<span class="stm-h">' + t + '<i class="stm"></i></span><');
    }
    // certificates (شهادات التقدير والتهاني): the stamp goes into the circle «الختم» of the certificate
    const seal = /class="kd-seal"/.test(out);
    if (seal) out = out.replace(/<i class="stm"><\/i>/g, '').replace(/<div class="kd-seal"><span>الختم<\/span><\/div>/g, '<div class="kd-seal stm-seal"><i class="stm-in"></i></div>');
    // the stamp goes UNDER the label (where the director signs), never over the writing of the label
    const img = `background:url("${c.url}") center/contain no-repeat;mix-blend-mode:multiply;opacity:.92;pointer-events:none;-webkit-print-color-adjust:exact;print-color-adjust:exact`;
    const css = `.stm-h{position:relative;display:inline-block}.stm{position:absolute;left:50%;top:100%;margin-top:.5mm;margin-left:-${(c.w / 2).toFixed(1)}mm;width:${c.w}mm;height:${c.h}mm;z-index:6;${img}}`
      + `.stm-seal{border:0!important;opacity:1!important;overflow:visible;position:relative}.stm-in{position:absolute;inset:0;${img}}`;
    out = out.includes('</style>') ? out.replace('</style>', css + '</style>') : out.replace('</head>', `<style>${css}</style></head>`);
    return seal ? out : place(out, c);
  }

  // 1.9.4 — the stamp never covers writing and never leaves the page: the document is laid out once in a hidden frame and, for every
  // stamp, the first free place is kept: under the label (or the director's name), a little lower, shifted toward the middle, then beside
  // the label. The chosen place is written in the document itself, so the preview, the printing and the PDF are identical.
  let mf = null;
  const mm = 96 / 25.4;
  // one measuring document kept for the whole session: the fonts (@font-face) and the images of the documents are loaded once
  // and stay ready, so the layout measured here is the layout of the printed page
  const fonts = new Set();
  function frame() {
    if (mf && mf.isConnected) return mf.contentDocument;
    mf = document.createElement('iframe');
    mf.setAttribute('aria-hidden', 'true'); mf.tabIndex = -1;
    mf.style.cssText = 'position:fixed;left:-30000px;top:0;width:1400px;height:1000px;border:0;visibility:hidden;pointer-events:none';
    document.body.appendChild(mf);
    const d = mf.contentDocument;
    d.open(); d.write('<!DOCTYPE html><html><head><meta charset="utf-8"><style id="ff"></style><style id="cs"></style></head><body></body></html>'); d.close();
    fonts.clear();
    return d;
  }
  function loadDoc(d, html) {
    const src = new DOMParser().parseFromString(html, 'text/html');
    let css = Array.from(src.querySelectorAll('style')).map(x => x.textContent).join('\n');
    const ff = d.getElementById('ff');
    css = css.replace(/@font-face\s*{[^}]*}/g, f => { if (!fonts.has(f)) { fonts.add(f); ff.appendChild(d.createTextNode(f + '\n')); } return ''; });
    // the layout measured is the printed one: the print rules of the document apply here too
    d.getElementById('cs').textContent = css.replace(/@media\s+print\b/g, '@media all').replace(/@media\s+screen\b/g, '@media not all');
    for (const a of Array.from(d.documentElement.attributes)) d.documentElement.removeAttribute(a.name);
    for (const a of Array.from(src.documentElement.attributes)) d.documentElement.setAttribute(a.name, a.value);
    for (const a of Array.from(d.body.attributes)) d.body.removeAttribute(a.name);
    for (const a of Array.from(src.body.attributes)) d.body.setAttribute(a.name, a.value);
    src.querySelectorAll('script').forEach(x => x.remove());
    d.body.innerHTML = src.body.innerHTML;
  }
  // warm-up: the fonts and the header images of the documents are made ready in the measuring document before the first use
  function warm() { try { if (cfg().on && Dx && Dx.buildRaw && Dx.header && typeof DB !== 'undefined' && DB) apply(Dx.buildRaw({ page: 'a4', pages: ['<div>' + Dx.header(settingsFor0()) + '<p>توقيع رئيس المؤسسة</p></div>'], title: '', base: typeof BASE !== 'undefined' ? BASE : '' })); } catch (_) {} }
  const settingsFor0 = () => (typeof settingsFor === 'function' ? settingsFor(DB.settings.activeInst) : DB.settings);
  const dots = /^[\s.…_\-—–ـ:/|()]*$/;
  function place(html, c) {
    if (typeof document === 'undefined' || !document.body || !/class="stm"/.test(html)) return html;
    try {
      const d = frame(); loadDoc(d, html);
      const st = Array.from(d.querySelectorAll('.stm'));
      if (!st.length) return html;
      // obstacles: every written text of the document (dotted lines left for writing are free)
      const obs = [];
      const tw = d.createTreeWalker(d.body, 4);
      while (tw.nextNode()) {
        const n = tw.currentNode, pe = n.parentElement;
        if (!pe || dots.test(n.textContent) || pe.closest('style,script,title')) continue;
        const r = d.createRange(); r.selectNodeContents(n);
        for (const b of r.getClientRects()) if (b.width > 1 && b.height > 1) obs.push({ l: b.left, t: b.top, r: b.right, b: b.bottom });
      }
      const W0 = c.w * mm, H0 = c.h * mm, tol = -.8 * mm, gap = .6 * mm; // a small clear margin around the writing
      const area = (x, y, W, H) => { let a = 0; for (const o of obs) { const w = Math.min(x + W, o.r) - Math.max(x, o.l) - tol, h = Math.min(y + H, o.b) - Math.max(y, o.t) - tol; if (w > 0 && h > 0) a += w * h; } return a; };
      const pos = [];
      for (const el of st) {
        const L = el.parentElement.getBoundingClientRect();
        if (!L.width && !L.height) { pos.push(''); continue; }
        const pg = el.closest('.copy,.cs-copy,.iv,.ivo,.page-a4,.page-a4l,.sheet,.kd-in') || d.body;
        const P0 = pg.getBoundingClientRect();
        // content that runs past its page box (printed on the next sheet): the page goes on below
        const isCopy = pg.matches('.copy,.cs-copy,.iv,.ivo'); // a copy among several on the sheet hides what goes out of it
        const P = { left: P0.left, right: P0.right, top: P0.top, bottom: !isCopy && L.bottom > P0.bottom - 4 * mm ? L.bottom + H0 * 2 : P0.bottom };
        // 1.9.4: a copy of a school certificate (.cs-copy hides what goes out of it) is a page of its own: the stamp is never cut
        const cx = (L.left + L.right) / 2, cy = (L.top + L.bottom) / 2, mid = (P.left + P.right) / 2;
        const toMid = cx > mid ? -1 : 1; // the free side is usually toward the middle of the page
        const cands = (W, H) => { const side = toMid < 0 ? L.left - gap - W : L.right + gap; return [
          [cx - W / 2, L.bottom + gap], [cx - W / 2 + toMid * W * .35, L.bottom + gap], [cx - W / 2 + toMid * W * .7, L.bottom + gap],
          [cx - W / 2, L.bottom + 5 * mm], [cx - W / 2 + toMid * W * .5, L.bottom + 5 * mm],
          // 1.9.4: under the lines written just below the label (the director's name, a date…), still close to the label
          ...(() => { let yb = 0; for (const o of obs) if (o.t >= L.bottom - 1 && o.t <= L.bottom + 12 * mm && o.r > cx - W / 2 && o.l < cx + W / 2) yb = Math.max(yb, o.b); return yb ? [[cx - W / 2, yb + gap], [cx - W / 2 + toMid * W * .35, yb + gap]] : []; })(),
          [cx - W / 2, L.bottom + 9 * mm], [cx - W / 2, L.bottom + 12 * mm],
          [side, cy - H / 2], [side, L.top - H * .25], [side, L.bottom - H * .75], [side, L.top], [side + toMid * W * .5, cy - H / 2], [side, L.bottom - H]
        ]; };
        // last choices: in the free space just above the label
        const above = (W, H) => { const side = toMid < 0 ? L.left - gap - W : L.right + gap; return [
          [cx - W / 2 + toMid * W * .6, L.top - gap - H], [cx - W / 2, L.top - gap - H], [side, L.top - H], [cx - W / 2 + toMid * W * 1.1, L.top - gap - H]
        ]; };
        // never far from its label (a stamp in another part of the page would be wrong); a smaller stamp in a small box
        const near = (x, y, W, H) => Math.max(L.left - (x + W), x - L.right, 0) <= 12 * mm && Math.max(L.top - (y + H), y - L.bottom, 0) <= 12 * mm;
        let best = null;
        // under or beside the label first (a smaller stamp if the box is small), above it only when there is no other free place
        for (const [list, sc] of [[cands, 1], [cands, .85], [cands, .72], [cands, .62], [above, 1], [above, .85], [above, .72]]) {
          const W = W0 * sc, H = H0 * sc;
          for (const [x0, y] of list(W, H)) {
            const x = Math.max(P.left + 2 * mm, Math.min(x0, P.right - 2 * mm - W));
            if (y < P.top + 2 * mm || y + H > P.bottom - 1.5 * mm || !near(x, y, W, H)) continue;
            const a = area(x, y, W, H) * (sc === 1 ? 1 : 1.0001);
            if (!best || a < best.a - 1) best = { x, y, a, W, H, sc };
            if (a <= 0) break;
          }
          if (best && best.a <= 0) break;
        }
        if (!best) { // no place at all: under the label, never far from it
          const x = Math.max(P.left + 2 * mm, Math.min(cx - W0 / 2, P.right - 2 * mm - W0));
          best = { x, y: Math.max(L.bottom + gap - 12 * mm, Math.min(L.bottom + gap, P.bottom - 1.5 * mm - H0)), a: 0, W: W0, H: H0, sc: 1 };
        }
        const W = best.W, H = best.H;
        obs.push({ l: best.x, t: best.y, r: best.x + W, b: best.y + H }); // two stamps never on each other
        pos.push(`left:${(best.x - L.left).toFixed(1)}px;top:${(best.y - L.top).toFixed(1)}px;margin:0` + (best.sc < 1 ? `;width:${(c.w * best.sc).toFixed(1)}mm;height:${(c.h * best.sc).toFixed(1)}mm` : ''));
      }
      let k = 0;
      return html.replace(/<i class="stm"><\/i>/g, m => { const p = pos[k++]; return p ? `<i class="stm" style="${p}"></i>` : m; });
    } catch (_) { return html; }
  }
  // every document goes through Docs.bidi just before it is displayed, printed or saved
  if (Dx && typeof Dx.bidi === 'function' && !Dx.bidi.__stamp) {
    const b0 = Dx.bidi;
    // 1.9.4: a stray «undefined» / «NaN» / «null» left by an empty value is never printed
    const clean = h => (typeof h === 'string' ? h.replace(/>(\s*)(?:undefined|NaN|null)(\s*)</g, '>$1$2<') : h);
    Dx.bidi = h => apply(clean(b0(h)));
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

  function set(on) { const i = inst(); if (!i || !i.stamp) return; i.stampOn = !!on; persist(); if (on) setTimeout(warm, 30); }
  window.addEventListener('load', () => setTimeout(warm, 1200));
  // checkbox of the document toolbar (only when a stamp has been uploaded)
  const chk = () => { const c = cfg(), i = inst(); return i && i.stamp ? `<label class="stm-chk" title="يوضع الطابع الرقمي تحت عبارة توقيع رئيس المؤسسة في الطباعة وحفظ PDF"><input type="checkbox" id="stmChk" ${c.on ? 'checked' : ''}> الطابع الرقمي</label>` : ''; };

  function card(box) {
    const draw = () => {
      const i = inst() || {}, c = cfg();
      box.innerHTML = `<div class="card-h"><h3>طابع المؤسسة الرقمي (اختياري)</h3></div><div class="card-b">
        <p class="muted" style="margin:0 0 10px;font-size:13px;line-height:1.9">حمّل صورة الطابع بصيغة PNG (يُفضل بخلفية شفافة). يوضع الطابع تحت عبارة توقيع رئيس المؤسسة في الوثائق عند تحديد خانة «الطابع الرقمي» في شريط كل وثيقة، أو من الخيار أدناه ليكون مفعلا دائما. لا يغادر الصورة هذا الحاسوب، ولا يُدرج في ملفات Word.</p>
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
  const strip = h => (typeof h === 'string' ? h.replace(/<i class="stm"[^>]*><\/i>/g, '').replace(/<i class="stm-in"><\/i>/g, '').replace(/<div class="kd-seal stm-seal">/g, '<div class="kd-seal"><span>الختم</span>') : h);
  window.Stamp = { apply, set, chk, card, cfg, strip, LABEL };
})();
