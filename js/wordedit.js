'use strict';
/* 1.9.4 — «تخصيص النموذج» كمحرر كامل على طريقة Word:
   الوثيقة المولدة تُفتح في محرر قابل للتعديل الكامل (نص، خطوط الحاسوب، الحجم، الألوان، المحاذاة، اللوائح، المسافات، الجداول، الصور،
   فواصل الصفحات، البحث والاستبدال، التراجع...). الخطوط المثبتة في الحاسوب متاحة كلها، ويمكن استيراد خط (TTF/OTF/WOFF) يُحفظ مع
   المعطيات ويُستعمل في كل الوثائق. الطبع يتم بصيغة PDF (أو مباشرة إلى الطابعة).
   الحفظ: «نسخة مخصصة» = الوثيقة كما حُررت (rules.html) تُستعمل بدل النموذج الأصلي عند اختيارها، أو تحرير لهذه المرة فقط. */
(function () {
  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const userFonts = () => { const g = (DB.settings = DB.settings || {}); return (g.userFonts = Array.isArray(g.userFonts) ? g.userFonts : []); };
  const MIME = { ttf: 'font/ttf', otf: 'font/otf', woff: 'font/woff', woff2: 'font/woff2' };
  const fontFaceCss = () => userFonts().map(f => `@font-face{font-family:'${String(f.name).replace(/'/g, '')}';src:url(data:${MIME[f.ext] || 'font/ttf'};base64,${f.b64})}`).join('');
  // imported fonts are available in every printed document
  try { Object.defineProperty(window.Docs, 'fontCss', { configurable: true, get: () => { try { return typeof DB !== 'undefined' && DB ? fontFaceCss() : ''; } catch (_) { return ''; } } }); } catch (_) {}
  let sysFonts = [];
  if (window.api && window.api.fontsList) window.api.fontsList().then(l => { if (Array.isArray(l)) sysFonts = l; }).catch(() => {});
  const APP_FONTS = ['Sakkal Majalla', 'Traditional Arabic', 'Arabic Typesetting', 'Simplified Arabic', 'Arial', 'Times New Roman', 'Calibri', 'Tahoma', 'Amiri', 'NSA'];
  const fontList = () => Array.from(new Set(APP_FONTS.concat(userFonts().map(f => f.name), sysFonts))).filter(Boolean);
  const SIZES = [8, 9, 10, 10.5, 11, 12, 13, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72];
  // Electron has no window.prompt: a small input box
  const ask = (title, label, def) => new Promise(res => {
    let done = false; const fin = v => { if (!done) { done = true; res(v); } };
    const m = modal({ title, size: 'sm', body: `<div class="fld"><label>${escH(label)}</label><input class="inp" id="weAsk" value="${escH(def || '')}"></div>`,
      actions: [{ label: 'موافق', cls: 'pri', onClick: bg => fin(bg.querySelector('#weAsk').value) }, { label: 'إلغاء', onClick: () => fin(null) }] });
    const inp = m.el.querySelector('#weAsk'); inp.onkeydown = e => { if (e.key === 'Enter') { fin(inp.value); m.close(); } };
    const obs = new MutationObserver(() => { if (!m.el.isConnected) { obs.disconnect(); fin(null); } }); obs.observe(document.getElementById('modalRoot'), { childList: true });
  });
  const B = (cmd, label, title, extra) => `<button type="button" class="we-b" data-cmd="${cmd}" title="${escH(title || '')}"${extra || ''}>${label}</button>`;

  function open({ html, title, v, onSave, onSimple, onDelete, landscape }) {
    const root = document.createElement('div');
    root.className = 'we-root';
    root.innerHTML = `
      <div class="we-top"><b class="we-title">✎ ${escH(title || '')}</b><span class="we-hint">محرر كامل: عدّل أي نص أو جدول مباشرة في الوثيقة (النسخ إلى برنامج آخر غير متاح)</span><span style="flex:1"></span>
        <button type="button" class="btn sm" id="weSimple" title="تبديل عبارات وإضافة فقرات مع بقاء التعبئة التلقائية">الوضع البسيط</button>
        ${v && onDelete ? '<button type="button" class="btn sm danger" id="weDel">حذف هذه النسخة</button>' : ''}
        <button type="button" class="btn sm" id="weSaveV">${ic('save')} حفظ كنسخة مخصصة</button>
        <button type="button" class="btn sm" id="wePdf">${ic('pdf')} حفظ PDF</button>
        <button type="button" class="btn sm pri" id="wePrint">${ic('print')} طباعة (PDF)</button>
        <button type="button" class="btn sm" id="weClose">✕ إغلاق</button></div>
      <div class="we-bar">
        ${B('undo', '↶', 'تراجع (Ctrl+Z)')}${B('redo', '↷', 'إعادة (Ctrl+Y)')}<span class="we-sep"></span>
        <select class="we-sel" id="weFont" title="الخط (خطوط الحاسوب)" style="width:150px"></select>
        <button type="button" class="we-b" id="weImpFont" title="استيراد خط من الحاسوب (TTF / OTF / WOFF)">＋Aa</button>
        <select class="we-sel" id="weSize" title="حجم الخط (pt)" style="width:62px">${SIZES.map(z => `<option value="${z}">${z}</option>`).join('')}</select><span class="we-sep"></span>
        ${B('bold', '<b>B</b>', 'غامق (Ctrl+B)')}${B('italic', '<i>I</i>', 'مائل (Ctrl+I)')}${B('underline', '<u>U</u>', 'تسطير (Ctrl+U)')}${B('strikeThrough', '<s>S</s>', 'يتوسطه خط')}
        ${B('superscript', 'x²', 'نص مرتفع')}${B('subscript', 'x₂', 'نص منخفض')}
        <label class="we-b we-col" title="لون النص">A<input type="color" id="weFore" value="#c00000"></label>
        <label class="we-b we-col" title="لون التظليل" style="background:#fff59d">ab<input type="color" id="weBack" value="#fff59d"></label><span class="we-sep"></span>
        ${B('justifyRight', '⇥', 'محاذاة لليمين')}${B('justifyCenter', '≡', 'توسيط')}${B('justifyLeft', '⇤', 'محاذاة لليسار')}${B('justifyFull', '☰', 'ضبط')}
        ${B('dirRtl', '¶←', 'اتجاه من اليمين إلى اليسار')}${B('dirLtr', '→¶', 'اتجاه من اليسار إلى اليمين')}<span class="we-sep"></span>
        ${B('insertUnorderedList', '•≡', 'تعداد نقطي')}${B('insertOrderedList', '1≡', 'تعداد رقمي')}${B('indent', '⇉', 'زيادة المسافة البادئة')}${B('outdent', '⇇', 'إنقاص المسافة البادئة')}
        <select class="we-sel" id="weLine" title="تباعد الأسطر" style="width:70px"><option value="">↕</option>${['1', '1.15', '1.5', '1.8', '2', '2.5'].map(x => `<option>${x}</option>`).join('')}</select>
        <select class="we-sel" id="weBlock" title="نمط الفقرة" style="width:96px"><option value="">الفقرة…</option><option value="p">عادي</option><option value="h1">عنوان 1</option><option value="h2">عنوان 2</option><option value="h3">عنوان 3</option></select><span class="we-sep"></span>
        ${B('table', '▦', 'إدراج جدول')}${B('rowAdd', '▦+', 'إضافة صف بعد الصف الحالي')}${B('colAdd', '▥+', 'إضافة عمود بعد العمود الحالي')}${B('rowDel', '▦−', 'حذف الصف الحالي')}${B('colDel', '▥−', 'حذف العمود الحالي')}
        ${B('image', '🖼', 'إدراج صورة')}${B('insertHorizontalRule', '―', 'خط أفقي')}${B('pageBreak', '⤓', 'فاصل صفحات')}${B('removeFormat', '⌫A', 'مسح التنسيق')}<span class="we-sep"></span>
        <input class="we-sel" id="weFind" placeholder="بحث" style="width:96px"><input class="we-sel" id="weRep" placeholder="استبدال بـ" style="width:96px">${B('replace', 'استبدال الكل', 'استبدال كل المواضع')}
        <span class="we-sep"></span><select class="we-sel" id="weZoom" title="التكبير" style="width:70px">${[50, 75, 90, 100, 125, 150].map(z => `<option value="${z}" ${z === 100 ? 'selected' : ''}>${z}%</option>`).join('')}</select>
      </div>
      <div class="we-area"><iframe id="weFrame"></iframe></div>`;
    document.body.appendChild(root);
    const frame = root.querySelector('#weFrame');
    const css = '<style id="we-ed">html{background:#8a948f}body{margin:0;padding:16px 0}.page-a4,.page-a4l,.sheet{margin:0 auto 16px!important;box-shadow:0 2px 12px rgba(0,0,0,.35);background:#fff;outline:none}[contenteditable]:focus{outline:none}.we-pb{page-break-after:always;break-after:page;border-top:2px dashed #4472c4;margin:4mm 0;height:0}@media print{.we-pb{border:0;margin:0}}</style>';
    const fonts = `<style id="we-fonts">${fontFaceCss()}</style>`;
    frame.srcdoc = String(html).replace('</head>', fonts + css + '</head>');
    let doc = null, dirty = false;
    frame.onload = () => {
      doc = frame.contentDocument;
      doc.designMode = 'on';
      try { doc.execCommand('styleWithCSS', false, true); } catch (_) {}
      doc.addEventListener('input', () => { dirty = true; });
      doc.addEventListener('keyup', syncState); doc.addEventListener('mouseup', syncState);
      doc.addEventListener('keydown', e => { if (e.ctrlKey && e.key.toLowerCase() === 'p') { e.preventDefault(); out('print'); } if (e.ctrlKey && e.key.toLowerCase() === 's') { e.preventDefault(); saveVariant(); } });
      // 1.9.4: the text is edited only inside the program — no «select all», no copy / cut / drag towards another program (Word...)
      const deny = e => { e.preventDefault(); e.stopPropagation(); try { if (e.clipboardData) e.clipboardData.setData('text/plain', ''); } catch (_) {} toast('النسخ إلى برنامج آخر غير مسموح: التعديل يتم داخل البرنامج فقط', true); return false; };
      ['copy', 'cut', 'beforecopy', 'beforecut'].forEach(ev => doc.addEventListener(ev, deny, true));
      doc.addEventListener('dragstart', e => { e.preventDefault(); }, true);
      doc.addEventListener('contextmenu', e => { e.preventDefault(); }, true);
      doc.addEventListener('keydown', e => {
        const k = e.key.toLowerCase(), mod = e.ctrlKey || e.metaKey;
        if ((mod && (k === 'a' || k === 'c' || k === 'x')) || (mod && k === 'insert') || (e.shiftKey && k === 'delete')) { e.preventDefault(); e.stopPropagation(); if (k !== 'a') deny(e); }
      }, true);
      doc.addEventListener('selectionchange', () => { const sl = doc.getSelection(); if (sl && doc.body && sl.toString().length > 2000) sl.collapseToEnd(); });
      zoom();
    };
    const fontSel = root.querySelector('#weFont');
    const drawFonts = () => { fontSel.innerHTML = `<option value="">الخط…</option>` + fontList().map(f => `<option value="${escH(f)}" style="font-family:'${escH(f)}'">${escH(f)}</option>`).join(''); };
    drawFonts();
    const exec = (c, val) => { frame.contentWindow.focus(); doc.execCommand(c, false, val == null ? null : val); dirty = true; };
    const sel = () => doc.getSelection();
    const curEl = () => { const s = sel(); if (!s || !s.rangeCount) return null; let n = s.getRangeAt(0).startContainer; return n.nodeType === 1 ? n : n.parentElement; };
    const blocks = () => { const s = sel(); if (!s || !s.rangeCount) return []; const r = s.getRangeAt(0); const out = new Set(); const blk = n => (n && n.closest ? n.closest('p,div,li,td,th,h1,h2,h3,h4') : null);
      const a = blk(r.startContainer.nodeType === 1 ? r.startContainer : r.startContainer.parentElement); if (a) out.add(a);
      doc.body.querySelectorAll('p,div,li,td,th,h1,h2,h3,h4').forEach(el => { if (r.intersectsNode(el) && !el.querySelector('p,div,li,td,th')) out.add(el); });
      const z = blk(r.endContainer.nodeType === 1 ? r.endContainer : r.endContainer.parentElement); if (z) out.add(z); return Array.from(out); };
    // size in pt: execCommand marks the selection with size 7, replaced by an explicit size
    const setSize = pt => { exec('fontSize', 7); doc.querySelectorAll('font[size="7"]').forEach(f => { const sp = doc.createElement('span'); sp.style.fontSize = pt + 'pt'; while (f.firstChild) sp.appendChild(f.firstChild); f.replaceWith(sp); }); doc.querySelectorAll('[style*="xxx-large"]').forEach(el => { el.style.fontSize = pt + 'pt'; }); };
    const setFont = name => { exec('fontName', name); };
    function syncState() {
      const el = curEl(); if (!el) return;
      const cs = frame.contentWindow.getComputedStyle(el);
      const fam = cs.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
      if (fontList().includes(fam)) fontSel.value = fam;
      const pt = Math.round(parseFloat(cs.fontSize) * 0.75 * 2) / 2; const zs = root.querySelector('#weSize'); if (SIZES.includes(pt)) zs.value = pt;
      root.querySelectorAll('[data-cmd]').forEach(b => { const c = b.dataset.cmd; if (['bold', 'italic', 'underline', 'strikeThrough', 'superscript', 'subscript', 'justifyRight', 'justifyCenter', 'justifyLeft', 'justifyFull', 'insertUnorderedList', 'insertOrderedList'].includes(c)) { try { b.classList.toggle('on', doc.queryCommandState(c)); } catch (_) {} } });
    }
    const cellOf = () => { const el = curEl(); return el ? el.closest('td,th') : null; };
    const actions = {
      dirRtl: () => blocks().forEach(b => { b.dir = 'rtl'; b.style.textAlign = 'right'; }),
      dirLtr: () => blocks().forEach(b => { b.dir = 'ltr'; b.style.textAlign = 'left'; }),
      table: async () => {
        const s0 = sel(), rg = s0 && s0.rangeCount ? s0.getRangeAt(0).cloneRange() : null;
        const r = await ask('إدراج جدول', 'عدد الأسطر × عدد الأعمدة (مثال: 3×4)', '3×4'); if (!r) return;
        if (rg) { frame.contentWindow.focus(); const s1 = sel(); s1.removeAllRanges(); s1.addRange(rg); }
        const m = /(\d+)\s*[×x*]\s*(\d+)/.exec(r); if (!m) return; const R = Math.min(60, +m[1]), Cn = Math.min(20, +m[2]);
        exec('insertHTML', `<table style="width:100%;border-collapse:collapse;margin:2mm 0" border="1">${Array.from({ length: R }, (_, i) => `<tr>${Array.from({ length: Cn }, () => `<${i ? 'td' : 'th'} style="border:1px solid #000;padding:1mm 2mm;${i ? '' : 'background:#e7ecf7'}">&nbsp;</${i ? 'td' : 'th'}>`).join('')}</tr>`).join('')}</table><p><br></p>`);
      },
      rowAdd: () => { const c = cellOf(); if (!c) return toast('ضع المؤشر داخل الجدول', true); const tr = c.parentElement, n = tr.cloneNode(true); n.querySelectorAll('td,th').forEach(x => { x.innerHTML = '&nbsp;'; }); tr.after(n); dirty = true; },
      rowDel: () => { const c = cellOf(); if (!c) return toast('ضع المؤشر داخل الجدول', true); const tr = c.parentElement; if (tr.parentElement.children.length > 1) tr.remove(); else tr.closest('table').remove(); dirty = true; },
      colAdd: () => { const c = cellOf(); if (!c) return toast('ضع المؤشر داخل الجدول', true); const i = Array.from(c.parentElement.children).indexOf(c); c.closest('table').querySelectorAll('tr').forEach(tr => { const x = tr.children[i]; if (x) { const n = x.cloneNode(false); n.innerHTML = '&nbsp;'; x.after(n); } }); dirty = true; },
      colDel: () => { const c = cellOf(); if (!c) return toast('ضع المؤشر داخل الجدول', true); const i = Array.from(c.parentElement.children).indexOf(c); c.closest('table').querySelectorAll('tr').forEach(tr => { const x = tr.children[i]; if (x) x.remove(); }); dirty = true; },
      image: async () => { const d = await window.api.openImage(); if (d) exec('insertHTML', `<img src="${d}" style="max-width:100%;height:auto">`); },
      pageBreak: () => exec('insertHTML', '<div class="we-pb"></div><p><br></p>'),
      replace: () => {
        const a = root.querySelector('#weFind').value, b = root.querySelector('#weRep').value; if (!a) return;
        const w = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT); const L = []; while (w.nextNode()) L.push(w.currentNode);
        let n = 0; L.forEach(t => { if (t.nodeValue.includes(a)) { n += t.nodeValue.split(a).length - 1; t.nodeValue = t.nodeValue.split(a).join(b); } });
        dirty = true; toast(n ? `تم استبدال ${n} موضع` : 'لم يتم العثور على العبارة', !n);
      }
    };
    root.querySelectorAll('[data-cmd]').forEach(b => b.addEventListener('mousedown', e => e.preventDefault()));
    root.querySelectorAll('[data-cmd]').forEach(b => b.onclick = () => { const c = b.dataset.cmd; if (!doc) return; if (actions[c]) actions[c](); else exec(c); syncState(); });
    fontSel.onchange = () => { if (fontSel.value) setFont(fontSel.value); };
    root.querySelector('#weSize').onchange = e => setSize(+e.target.value);
    root.querySelector('#weFore').oninput = e => exec('foreColor', e.target.value);
    root.querySelector('#weBack').oninput = e => exec('hiliteColor', e.target.value);
    root.querySelector('#weLine').onchange = e => { if (e.target.value) blocks().forEach(b => { b.style.lineHeight = e.target.value; }); dirty = true; e.target.value = ''; };
    root.querySelector('#weBlock').onchange = e => { if (e.target.value) exec('formatBlock', e.target.value); e.target.value = ''; };
    const zoom = () => { if (!doc) return; const z = +root.querySelector('#weZoom').value / 100; doc.body.style.zoom = z; };
    root.querySelector('#weZoom').onchange = zoom;
    root.querySelector('#weImpFont').onclick = async () => {
      const L = window.api.openFont ? await window.api.openFont() : null; if (!L || !L.length) return;
      L.forEach(f => { const i = userFonts().findIndex(x => x.name === f.name); if (i >= 0) userFonts()[i] = f; else userFonts().push(f); });
      persist(); drawFonts();
      if (doc) { const st = doc.getElementById('we-fonts'); if (st) st.textContent = fontFaceCss(); }
      toast(`تم استيراد الخط: ${L.map(f => f.name).join('، ')} — متاح في كل الوثائق`);
    };
    // the edited document: editor styles removed
    const edited = () => {
      const d = doc.documentElement.cloneNode(true);
      d.querySelectorAll('#we-ed').forEach(x => x.remove());
      const body = d.querySelector('body'); if (body) { body.removeAttribute('contenteditable'); body.style.zoom = ''; }
      return '<!DOCTYPE html>' + d.outerHTML;
    };
    const land = () => (typeof landscape === 'function' ? landscape() : landscape != null ? !!landscape : /size:\s*A4\s+landscape/i.test(html));
    const out = async kind => {
      if (!doc) return;
      if (!LIC.active) return lockedBox();
      const h = edited();
      const r = kind === 'print' ? await window.api.print(h, land()) : await window.api.pdf(h, land(), String(title || 'وثيقة').replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, ''));
      if (r && r.locked) return lockedBox();
      if (r && r.ok) toast(kind === 'print' ? 'تم إرسال الوثيقة إلى الطابعة' : 'تم حفظ الملف PDF');
    };
    root.querySelector('#wePrint').onclick = () => out('print');
    root.querySelector('#wePdf').onclick = () => out('pdf');
    const saveVariant = async () => {
      if (!doc) return;
      const name = await ask('حفظ كنسخة مخصصة', 'اسم النسخة المخصصة (تظهر بجانب النموذج الأصلي وتُستعمل عند اختيارها)', (v && v.name) || ('نسخة ' + (title || '')));
      if (!name || !name.trim()) return;
      onSave && onSave(name.trim(), edited());
      dirty = false; toast('تم حفظ النسخة المخصصة');
    };
    root.querySelector('#weSaveV').onclick = saveVariant;
    const close = async () => { if (dirty && !(await confirmBox('إغلاق المحرر دون حفظ التعديلات كنسخة مخصصة؟', 'إغلاق'))) return; root.remove(); document.removeEventListener('keydown', esc); };
    const esc = e => { if (e.key === 'Escape' && !document.querySelector('.modal-bg')) close(); };
    document.addEventListener('keydown', esc);
    root.querySelector('#weClose').onclick = close;
    root.querySelector('#weSimple').onclick = () => { root.remove(); document.removeEventListener('keydown', esc); onSimple && onSimple(); };
    const delB = root.querySelector('#weDel');
    if (delB) delB.onclick = async () => { if (onDelete && (await onDelete()) !== false) { root.remove(); document.removeEventListener('keydown', esc); } };
    return { root, close };
  }

  const style = document.createElement('style');
  style.textContent = `.we-root{position:fixed;inset:0;z-index:90;background:#eef1f0;display:flex;flex-direction:column}
  .we-top{display:flex;align-items:center;gap:8px;padding:8px 12px;background:#0d5345;color:#fff}.we-top .btn{background:#fff;color:#17302a;border-color:#fff}.we-top .btn svg{color:#0d5345}.we-top .btn.danger{background:#fff;color:#b42318}.we-top .btn.pri{background:#f0c84b;color:#222;border-color:#f0c84b}
  .we-title{font-size:15px}.we-hint{font-size:12px;opacity:.8}
  .we-bar{display:flex;flex-wrap:wrap;align-items:center;gap:3px;padding:6px 10px;background:#fff;border-bottom:1px solid #cfd8d4;direction:rtl}
  .we-b{min-width:30px;height:30px;padding:0 6px;border:1px solid #d4dcd8;border-radius:6px;background:#fafbfa;cursor:pointer;font-size:13.5px;display:inline-flex;align-items:center;justify-content:center;position:relative}
  .we-b:hover{background:#e8f2ee}.we-b.on{background:#cfe9de;border-color:#0e5a4a}
  .we-col input{position:absolute;opacity:0;inset:0;cursor:pointer}.we-col{color:#c00000;font-weight:700}
  .we-sel{height:30px;border:1px solid #d4dcd8;border-radius:6px;padding:0 4px;font-size:13px;background:#fff}
  .we-sep{width:1px;height:22px;background:#d4dcd8;margin:0 3px}
  .we-area{flex:1;min-height:0}.we-area iframe{width:100%;height:100%;border:0;background:#8a948f}`;
  document.head.appendChild(style);
  window.WordEdit = { open, fontList, userFonts, fontFaceCss };
})();
