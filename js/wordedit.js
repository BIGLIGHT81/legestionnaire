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
  // 1.9.4 — Conception / Mise en page
  const THEMES = [
    { n: 'كلاسيكي (أسود)', h: '#000000', f: '' },
    { n: 'أزرق رسمي', h: '#16325f', f: 'Sakkal Majalla' },
    { n: 'أخضر', h: '#0e5a4a', f: 'Traditional Arabic' },
    { n: 'أحمر عنابي', h: '#8b1e2d', f: 'Simplified Arabic' },
    { n: 'بنفسجي', h: '#4b2a7b', f: 'Arial' },
    { n: 'ذهبي', h: '#8a6a12', f: 'Amiri' }
  ];
  const BORDERS = [
    { n: 'بدون حدود', css: '' },
    { n: 'خط بسيط', css: 'border:.5mm solid {c}' },
    { n: 'خط مزدوج', css: 'border:1.6mm double {c}' },
    { n: 'خط سميك', css: 'border:1.4mm solid {c}' },
    { n: 'متقطع', css: 'border:.6mm dashed {c}' },
    { n: 'منقط', css: 'border:.8mm dotted {c}' },
    { n: 'مزخرف (خطان)', css: 'border:.5mm solid {c};outline:.3mm solid {c};outline-offset:1.2mm' },
    { n: 'زوايا مستديرة', css: 'border:.7mm solid {c};border-radius:5mm' }
  ];
  const MARGINS = [
    { n: 'عادية (2.5 سم)', v: [25, 25, 25, 25] }, { n: 'ضيقة (1.27 سم)', v: [12.7, 12.7, 12.7, 12.7] }, { n: 'معتدلة', v: [25.4, 19.1, 25.4, 19.1] },
    { n: 'عريضة', v: [25.4, 50.8, 25.4, 50.8] }, { n: 'الأصلية للوثيقة', v: null }
  ];
  const SHAPES = {
    rect: ['مستطيل', w => `<rect x="2" y="2" width="96" height="${w - 4}"`],
    round: ['مستطيل مستدير', w => `<rect x="2" y="2" width="96" height="${w - 4}" rx="12"`],
    ellipse: ['دائرة / بيضوي', w => `<ellipse cx="50" cy="${w / 2}" rx="48" ry="${w / 2 - 2}"`],
    tri: ['مثلث', w => `<polygon points="50,2 98,${w - 2} 2,${w - 2}"`],
    star: ['نجمة', w => `<polygon points="${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => { const r = i % 2 ? 0.42 : 1, a = Math.PI / 2 + i * Math.PI / 5; return `${(50 + 48 * r * Math.cos(a)).toFixed(1)},${(w / 2 - (w / 2 - 2) * r * Math.sin(a)).toFixed(1)}`; }).join(' ')}"`],
    arrowL: ['سهم ←', w => `<polygon points="98,${w * .3} 40,${w * .3} 40,2 2,${w / 2} 40,${w - 2} 40,${w * .7} 98,${w * .7}"`],
    arrowR: ['سهم →', w => `<polygon points="2,${w * .3} 60,${w * .3} 60,2 98,${w / 2} 60,${w - 2} 60,${w * .7} 2,${w * .7}"`],
    banner: ['شريط عنوان', w => `<polygon points="2,2 98,2 90,${w / 2} 98,${w - 2} 2,${w - 2} 10,${w / 2}"`],
    line: ['خط', w => `<line x1="2" y1="${w / 2}" x2="98" y2="${w / 2}"`],
    hex: ['مضلع سداسي', w => `<polygon points="25,2 75,2 98,${w / 2} 75,${w - 2} 25,${w - 2} 2,${w / 2}"`]
  };
  const SYMBOLS = '✓ ✔ ✗ ✘ ☐ ☑ ☒ • ◦ ▪ ■ □ ● ○ ◆ ◇ ★ ☆ → ← ↑ ↓ ⇒ ⇐ « » “ ” ‰ § ¶ ° ± × ÷ ≤ ≥ ≠ ≈ ½ ¼ ¾ © ® ™ € $ ✆ ☎ ✉ ✂ ✎ ✍ ☺ ♥ ♦ ♣ ♠ ﷺ ﷻ ۞ ۩ ٪ ؛ ، ؟'.split(' ');
  const WORDART = [
    { n: 'تدرج ذهبي', css: 'background:linear-gradient(180deg,#f7d774,#b8860b);-webkit-background-clip:text;background-clip:text;color:transparent' },
    { n: 'تدرج أزرق', css: 'background:linear-gradient(90deg,#1e88e5,#16325f);-webkit-background-clip:text;background-clip:text;color:transparent' },
    { n: 'قوس قزح', css: 'background:linear-gradient(90deg,#e53935,#fb8c00,#fdd835,#43a047,#1e88e5,#8e24aa);-webkit-background-clip:text;background-clip:text;color:transparent' },
    { n: 'حدود فقط', css: 'color:#fff;-webkit-text-stroke:.5mm #16325f' },
    { n: 'ظل', css: 'color:#0e5a4a;text-shadow:.8mm .8mm 0 #9fc9bb' },
    { n: 'توهج', css: 'color:#fff;text-shadow:0 0 1mm #1e88e5,0 0 2.5mm #1e88e5' },
    { n: 'بارز ثلاثي الأبعاد', css: 'color:#c62828;text-shadow:.3mm .3mm 0 #8e1b1b,.6mm .6mm 0 #8e1b1b,.9mm .9mm 0 #5d1212' }
  ];
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
      <div class="we-tabs" id="weTabs"><button type="button" data-p="home" class="on">الصفحة الرئيسية</button><button type="button" data-p="ins">إدراج <small>Insertion</small></button><button type="button" data-p="des">تصميم <small>Conception</small></button><button type="button" data-p="lay">تخطيط الصفحة <small>Mise en page</small></button></div>
      <div class="we-bar" data-p="home">
        ${B('undo', '↶', 'تراجع (Ctrl+Z)')}${B('redo', '↷', 'إعادة (Ctrl+Y)')}<span class="we-sep"></span>
        <select class="we-sel" id="weFont" title="الخط (خطوط الحاسوب)" style="width:150px"></select>
        <button type="button" class="we-b" id="weImpFont" title="استيراد خط من الحاسوب (TTF / OTF / WOFF)">＋Aa</button>
        <select class="we-sel" id="weSize" title="حجم الخط (pt)" style="width:62px">${SIZES.map(z => `<option value="${z}">${z}</option>`).join('')}</select>${B('grow', 'A⁺', 'تكبير الخط')}${B('shrink', 'A⁻', 'تصغير الخط')}<span class="we-sep"></span>
        ${B('bold', '<b>B</b>', 'غامق (Ctrl+B)')}${B('italic', '<i>I</i>', 'مائل (Ctrl+I)')}${B('underline', '<u>U</u>', 'تسطير (Ctrl+U)')}${B('strikeThrough', '<s>S</s>', 'يتوسطه خط')}
        ${B('superscript', 'x²', 'نص مرتفع')}${B('subscript', 'x₂', 'نص منخفض')}
        <label class="we-b we-col" title="لون النص">A<input type="color" id="weFore" value="#c00000"></label>
        <label class="we-b we-col" title="لون التظليل" style="background:#fff59d">ab<input type="color" id="weBack" value="#fff59d"></label><span class="we-sep"></span>
        ${B('justifyRight', '⇥', 'محاذاة لليمين')}${B('justifyCenter', '≡', 'توسيط')}${B('justifyLeft', '⇤', 'محاذاة لليسار')}${B('justifyFull', '☰', 'ضبط')}
        ${B('dirRtl', '¶←', 'اتجاه من اليمين إلى اليسار')}${B('dirLtr', '→¶', 'اتجاه من اليسار إلى اليمين')}<span class="we-sep"></span>
        ${B('insertUnorderedList', '•≡', 'تعداد نقطي')}${B('insertOrderedList', '1≡', 'تعداد رقمي')}${B('indent', '⇉', 'زيادة المسافة البادئة')}${B('outdent', '⇇', 'إنقاص المسافة البادئة')}
        <select class="we-sel" id="weLine" title="تباعد الأسطر" style="width:70px"><option value="">↕</option>${['1', '1.15', '1.5', '1.8', '2', '2.5'].map(x => `<option>${x}</option>`).join('')}</select>
        <select class="we-sel" id="weBlock" title="نمط الفقرة" style="width:96px"><option value="">الفقرة…</option><option value="p">عادي</option><option value="h1">عنوان 1</option><option value="h2">عنوان 2</option><option value="h3">عنوان 3</option></select>${B('removeFormat', '⌫A', 'مسح التنسيق')}<span class="we-sep"></span>
        <input class="we-sel" id="weFind" placeholder="بحث" style="width:96px"><input class="we-sel" id="weRep" placeholder="استبدال بـ" style="width:96px">${B('replace', 'استبدال الكل', 'استبدال كل المواضع')}
        <span class="we-sep"></span><select class="we-sel" id="weZoom" title="التكبير" style="width:70px">${[50, 75, 90, 100, 125, 150].map(z => `<option value="${z}" ${z === 100 ? 'selected' : ''}>${z}%</option>`).join('')}</select>
      </div>
      <div class="we-bar" data-p="ins" hidden>
        <span class="we-grp">${B('table', '▦ جدول', 'إدراج جدول')}${B('rowAdd', '▦+', 'إضافة صف بعد الصف الحالي')}${B('colAdd', '▥+', 'إضافة عمود بعد العمود الحالي')}${B('rowDel', '▦−', 'حذف الصف الحالي')}${B('colDel', '▥−', 'حذف العمود الحالي')}${B('cellColor', '▦🎨', 'لون خلفية الخلية')}<i>الجداول</i></span>
        <span class="we-grp">${B('image', '🖼 صورة', 'إدراج صورة من الحاسوب')}${B('shape', '⬭ شكل', 'إدراج شكل: مستطيل، دائرة، نجمة، سهم، خط…')}${B('textBox', '▭ مربع نص', 'إدراج مربع نص')}${B('wordArt', '𝒜 نص فني', 'نص فني (WordArt): تدرج، حدود، ظل')}<i>الرسوم</i></span>
        <span class="we-grp">${B('symbol', 'Ω رمز', 'إدراج رمز خاص')}${B('date', '📅 التاريخ', 'إدراج تاريخ اليوم')}${B('link', '🔗 رابط', 'إدراج رابط')}${B('insertHorizontalRule', '― خط', 'خط أفقي')}${B('pageBreak', '⤓ فاصل صفحة', 'فاصل صفحات')}<i>عناصر</i></span>
        <span class="we-grp">${B('header', '⬒ رأس الصفحة', 'نص في أعلى كل صفحة')}${B('footer', '⬓ تذييل', 'نص في أسفل كل صفحة')}${B('pageNum', '# ترقيم الصفحات', 'رقم الصفحة / عدد الصفحات في أسفل كل صفحة')}${B('hfDel', '✕', 'حذف رأس الصفحة والتذييل والترقيم')}<i>رأس الصفحة والتذييل</i></span>
      </div>
      <div class="we-bar" data-p="des" hidden>
        <span class="we-grp"><select class="we-sel" id="weTheme" title="سمة الوثيقة" style="width:150px"><option value="">السمات…</option>${THEMES.map((t, i) => `<option value="${i}">${t.n}</option>`).join('')}</select><select class="we-sel" id="weDocFont" title="خط الوثيقة كلها" style="width:150px"></select><i>السمات والخطوط</i></span>
        <span class="we-grp"><select class="we-sel" id="weParaSp" title="تباعد الفقرات في كل الوثيقة" style="width:130px"><option value="">تباعد الفقرات…</option><option value="0">بدون تباعد</option><option value="1">مضغوط</option><option value="2">عادي</option><option value="3">مريح</option><option value="4">مزدوج</option></select><i>تباعد الفقرات</i></span>
        <span class="we-grp"><label class="we-b we-col" title="لون الصفحة" style="color:#0e5a4a">🎨 لون الصفحة<input type="color" id="wePageCol" value="#fffdf5"></label>${B('pageColNone', '⬜', 'بدون لون صفحة')}
          <select class="we-sel" id="weBorder" title="حدود الصفحة" style="width:130px"><option value="">حدود الصفحة…</option>${BORDERS.map((b, i) => `<option value="${i}">${b.n}</option>`).join('')}</select><label class="we-b we-col" title="لون الحدود" style="color:#16325f">▢<input type="color" id="weBorderCol" value="#16325f"></label>
          ${B('watermark', '💧 علامة مائية', 'علامة مائية (Filigrane)')}${B('wmDel', '✕', 'حذف العلامة المائية')}<i>خلفية الصفحة</i></span>
      </div>
      <div class="we-bar" data-p="lay" hidden>
        <span class="we-grp"><select class="we-sel" id="weMargins" title="الهوامش" style="width:150px"><option value="">الهوامش…</option>${MARGINS.map((m, i) => `<option value="${i}">${m.n}</option>`).join('')}<option value="c">هوامش مخصصة…</option></select>
          <select class="we-sel" id="weOrient" title="الاتجاه" style="width:110px"><option value="">الاتجاه…</option><option value="p">عمودي (Portrait)</option><option value="l">أفقي (Paysage)</option></select><i>إعداد الصفحة</i></span>
        <span class="we-grp"><select class="we-sel" id="weCols" title="أعمدة للفقرات المحددة" style="width:110px"><option value="">الأعمدة…</option><option value="1">عمود واحد</option><option value="2">عمودان</option><option value="3">ثلاثة أعمدة</option></select>${B('pageBreak', '⤓ فاصل', 'فاصل صفحات')}<i>الأعمدة والفواصل</i></span>
        <span class="we-grp"><label class="we-lab">بادئة يمين<input class="we-sel" id="weIndR" type="number" min="0" max="80" step="1" style="width:56px" title="mm"></label><label class="we-lab">يسار<input class="we-sel" id="weIndL" type="number" min="0" max="80" step="1" style="width:56px" title="mm"></label><i>المسافة البادئة (مم)</i></span>
        <span class="we-grp"><label class="we-lab">قبل<input class="we-sel" id="weSpB" type="number" min="0" max="60" step="1" style="width:56px" title="pt"></label><label class="we-lab">بعد<input class="we-sel" id="weSpA" type="number" min="0" max="60" step="1" style="width:56px" title="pt"></label><i>التباعد (نقطة)</i></span>
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
    // nothing is inserted inside a drawn shape: the caret goes just after it
    const outOfShape = () => { const s0 = doc.getSelection(); if (!s0 || !s0.rangeCount) return; let n = s0.getRangeAt(0).startContainer; n = n.nodeType === 1 ? n : n.parentElement; const sh = n && n.closest ? n.closest('.we-shape') : null; if (!sh) return; const r = doc.createRange(); r.setStartAfter(sh); r.collapse(true); s0.removeAllRanges(); s0.addRange(r); };
    // our own elements (shapes, text boxes, WordArt) are put in place as they are: the browser command would rewrite their styles
    const put = html => {
      frame.contentWindow.focus(); outOfShape();
      const s0 = doc.getSelection(); let r = s0 && s0.rangeCount ? s0.getRangeAt(0) : null;
      if (!r || !doc.body.contains(r.startContainer)) { r = doc.createRange(); const pg = doc.querySelector('.page-a4,.page-a4l,.sheet') || doc.body; r.selectNodeContents(pg); r.collapse(false); }
      r.deleteContents();
      const t = doc.createElement('template'); t.innerHTML = html; const frag = t.content, last = frag.lastChild;
      r.insertNode(frag);
      if (last) { const r2 = doc.createRange(); r2.setStartAfter(last); r2.collapse(true); s0.removeAllRanges(); s0.addRange(r2); }
      dirty = true;
    };
    const exec = (c, val) => { frame.contentWindow.focus(); if (c === 'insertHTML' || c === 'insertText') outOfShape(); doc.execCommand(c, false, val == null ? null : val); dirty = true; };
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

    const pages = () => Array.from(doc.querySelectorAll('.page-a4,.page-a4l,.sheet'));
    const relPos = pg => { if (frame.contentWindow.getComputedStyle(pg).position === 'static') pg.style.position = 'relative'; };
    const keepSel = () => { const s0 = sel(), rg = s0 && s0.rangeCount ? s0.getRangeAt(0).cloneRange() : null; return () => { if (rg) { frame.contentWindow.focus(); const s1 = sel(); s1.removeAllRanges(); s1.addRange(rg); } }; };
    const hfOne = (pg, cls, text, pos) => { relPos(pg); pg.querySelectorAll(':scope > .' + cls).forEach(x => x.remove()); const d = doc.createElement('div'); d.className = cls; d.textContent = text; d.style.cssText = `position:absolute;left:12mm;right:12mm;${pos};text-align:center;font-size:9pt;color:#444;z-index:2`; pg.appendChild(d); };
    const hf = (cls, text, pos) => { if (!String(text).trim()) { doc.querySelectorAll('.' + cls).forEach(x => x.remove()); dirty = true; return; } pages().forEach(pg => hfOne(pg, cls, text, pos)); dirty = true; };
    const shapeHtml = o => {
      const vb = Math.max(10, Math.round(100 * o.h / o.w)), sh = SHAPES[o.k] || SHAPES.rect, line = o.k === 'line';
      return `<span class="we-shape" contenteditable="false" style="display:inline-block;width:${o.w}mm;height:${line ? 4 : o.h}mm;position:relative;vertical-align:middle;resize:both;overflow:hidden"><svg viewBox="0 0 100 ${line ? 10 : vb}" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%">${sh[1](line ? 10 : vb)} fill="${line || o.noFill ? 'none' : o.fill}" stroke="${o.stroke}" stroke-width="${o.sw}" vector-effect="non-scaling-stroke"/></svg>${o.text && !line ? `<span contenteditable="true" style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;font-weight:700;font-size:${o.ts}pt;color:${o.tc};padding:1mm">${escH(o.text)}</span>` : ''}</span>`;
    };
    const formBox = (title, inner, read) => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      const m = modal({ title, body: inner, actions: [{ label: 'إدراج', cls: 'pri', onClick: bg => fin(read(bg)) }, { label: 'إلغاء', onClick: () => fin(null) }] });
      const obs = new MutationObserver(() => { if (!m.el.isConnected) { obs.disconnect(); fin(null); } }); obs.observe(document.getElementById('modalRoot'), { childList: true }); });
    const pickColor = (title, def) => formBox(title, `<div class="fld"><label>اللون</label><input class="inp" type="color" id="wpc" value="${def}" style="height:40px"></div>`, bg => bg.querySelector('#wpc').value);
    const shapeBox = () => formBox('إدراج شكل', `<div class="fgrid">
        <div class="fld full"><label>الشكل</label><div class="we-shapes">${Object.entries(SHAPES).map(([k, v], i) => `<label class="we-shp"><input type="radio" name="wsk" value="${k}" ${i ? '' : 'checked'}><svg viewBox="0 0 100 60">${v[1](60)} fill="${k === 'line' ? 'none' : '#cfe2f1'}" stroke="#16325f" stroke-width="3"/></svg><span>${v[0]}</span></label>`).join('')}</div></div>
        <div class="fld"><label>العرض (مم)</label><input class="inp" type="number" id="wsw" value="50"></div><div class="fld"><label>الارتفاع (مم)</label><input class="inp" type="number" id="wsh" value="25"></div>
        <div class="fld"><label>لون التعبئة</label><input class="inp" type="color" id="wsf" value="#e8f1fb" style="height:36px"></div><div class="fld"><label>لون الحدود</label><input class="inp" type="color" id="wss" value="#16325f" style="height:36px"></div>
        <div class="fld"><label>سمك الحدود</label><select class="inp" id="wsb"><option value="0">بدون</option><option value="1">رفيع</option><option value="2" selected>متوسط</option><option value="4">سميك</option></select></div>
        <div class="fld"><label class="chk"><input type="checkbox" id="wsn"> بدون تعبئة</label></div>
        <div class="fld full"><label>نص داخل الشكل (اختياري)</label><input class="inp" id="wst"></div>
        <div class="fld"><label>حجم النص</label><input class="inp" type="number" id="wsz" value="14"></div><div class="fld"><label>لون النص</label><input class="inp" type="color" id="wsc" value="#16325f" style="height:36px"></div></div>`,
      bg => { const q = id => bg.querySelector(id); return { k: (bg.querySelector('input[name=wsk]:checked') || {}).value || 'rect', w: Math.max(5, +q('#wsw').value || 50), h: Math.max(3, +q('#wsh').value || 25), fill: q('#wsf').value, stroke: q('#wss').value, sw: +q('#wsb').value, noFill: q('#wsn').checked, text: q('#wst').value.trim(), ts: +q('#wsz').value || 14, tc: q('#wsc').value }; });
    const wordArtBox = () => formBox('نص فني (WordArt)', `<div class="fld"><label>النص</label><input class="inp" id="wat" value="${escH(S().school || 'نص فني')}"></div>
        <div class="fld"><label>النمط</label><div class="we-was">${WORDART.map((w, i) => `<label class="we-wa1"><input type="radio" name="wak" value="${i}" ${i ? '' : 'checked'}><span style="font-weight:800;font-size:20px;${w.css}">أبجد Abc</span><small>${w.n}</small></label>`).join('')}</div></div>
        <div class="fld"><label>الحجم (pt)</label><input class="inp" type="number" id="was" value="32"></div>`,
      bg => { const t = bg.querySelector('#wat').value.trim(); return t ? { text: t, k: +((bg.querySelector('input[name=wak]:checked') || {}).value || 0), size: +bg.querySelector('#was').value || 32 } : null; });
    const symbolBox = () => new Promise(res => { let done = false; const fin = v => { if (!done) { done = true; res(v); } };
      const m = modal({ title: 'إدراج رمز', body: `<div class="we-syms">${SYMBOLS.map(c => `<button type="button" class="we-b" data-sy="${escH(c)}">${escH(c)}</button>`).join('')}</div>`, actions: [{ label: 'إغلاق', onClick: () => fin(null) }] });
      m.el.querySelectorAll('[data-sy]').forEach(b => b.onclick = () => { fin(b.dataset.sy); m.close(); });
      const obs = new MutationObserver(() => { if (!m.el.isConnected) { obs.disconnect(); fin(null); } }); obs.observe(document.getElementById('modalRoot'), { childList: true }); });
    const wmBox = () => formBox('علامة مائية (Filigrane)', `<div class="fgrid"><div class="fld full"><label>النص</label><input class="inp" id="wmt" value="نسخة" list="wmL"><datalist id="wmL"><option>نسخة</option><option>سري</option><option>مسودة</option><option>نسخة طبق الأصل</option><option>للاستعمال الداخلي</option><option>${escH(S().school || '')}</option></datalist></div>
        <div class="fld"><label>الحجم (pt)</label><input class="inp" type="number" id="wms" value="72"></div><div class="fld"><label>اللون</label><input class="inp" type="color" id="wmc" value="#16325f" style="height:36px"></div>
        <div class="fld"><label>الشفافية</label><select class="inp" id="wmo"><option value=".08">خفيفة جدا</option><option value=".13" selected>خفيفة</option><option value=".22">متوسطة</option></select></div>
        <div class="fld"><label>الاتجاه</label><select class="inp" id="wmr"><option value="-35" selected>مائل</option><option value="0">أفقي</option></select></div></div>`,
      bg => { const t = bg.querySelector('#wmt').value.trim(); return t ? { text: t, size: +bg.querySelector('#wms').value || 72, color: bg.querySelector('#wmc').value, op: +bg.querySelector('#wmo').value, rot: +bg.querySelector('#wmr').value } : null; });
    const styleEl = id => { let st = doc.getElementById(id); if (!st) { st = doc.createElement('style'); st.id = id; doc.head.appendChild(st); } return st; };
    let orient = null;
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
      grow: () => { const el = curEl(); const pt = el ? Math.round(parseFloat(frame.contentWindow.getComputedStyle(el).fontSize) * 0.75) : 12; setSize(Math.min(96, pt + 2)); },
      shrink: () => { const el = curEl(); const pt = el ? Math.round(parseFloat(frame.contentWindow.getComputedStyle(el).fontSize) * 0.75) : 12; setSize(Math.max(6, pt - 2)); },
      cellColor: async () => { const c = cellOf(); if (!c) return toast('ضع المؤشر داخل الجدول', true); const v = await pickColor('لون خلفية الخلية', '#e7ecf7'); if (v) { c.style.background = v; c.style.webkitPrintColorAdjust = 'exact'; dirty = true; } },
      shape: async () => { const back = keepSel(); const o = await shapeBox(); if (!o) return; back(); put(shapeHtml(o) + '&nbsp;'); },
      textBox: () => put(`<div class="we-tb" style="display:inline-block;width:60mm;min-height:14mm;border:.4mm solid #16325f;border-radius:2mm;padding:2mm 3mm;vertical-align:top;resize:both;overflow:hidden;background:#fff">اكتب النص هنا</div>&nbsp;`),
      wordArt: async () => { const back = keepSel(); const o = await wordArtBox(); if (!o) return; back(); put(`<span class="we-wa" style="font-size:${o.size}pt;font-weight:700;${WORDART[o.k].css};-webkit-print-color-adjust:exact;print-color-adjust:exact">${escH(o.text)}</span>&nbsp;`); },
      symbol: async () => { const back = keepSel(); const ch = await symbolBox(); if (!ch) return; back(); exec('insertText', ch); },
      date: () => { const d = window.K && K.ldate ? K.ldate(Docs.todayIso()) : new Date().toLocaleDateString('ar-MA'); exec('insertText', d); },
      link: async () => { const back = keepSel(); const u = await ask('إدراج رابط', 'العنوان (https://...)', 'https://'); if (!u || u === 'https://') return; back(); exec('createLink', u); },
      header: async () => { const t = await ask('رأس الصفحة', 'النص في أعلى كل صفحة', (doc.querySelector('.we-hd') || {}).textContent || (S().school || '')); if (t == null) return; hf('we-hd', t, 'top:5mm;border-bottom:.2mm solid #999'); },
      footer: async () => { const t = await ask('تذييل الصفحة', 'النص في أسفل كل صفحة', (doc.querySelector('.we-ft') || {}).textContent || ''); if (t == null) return; hf('we-ft', t, 'bottom:5mm;border-top:.2mm solid #999'); },
      pageNum: () => { const P = pages(); P.forEach((pg, i) => hfOne(pg, 'we-pn', `الصفحة ${i + 1} / ${P.length}`, 'bottom:3mm;left:0;right:0;font-size:8.5pt')); dirty = true; toast('تم ترقيم الصفحات'); },
      hfDel: () => { doc.querySelectorAll('.we-hd,.we-ft,.we-pn').forEach(x => x.remove()); dirty = true; },
      watermark: async () => { const o = await wmBox(); if (!o) return; doc.querySelectorAll('.we-wm').forEach(x => x.remove()); pages().forEach(pg => { relPos(pg); const w = doc.createElement('div'); w.className = 'we-wm'; w.contentEditable = 'false'; w.textContent = o.text; w.style.cssText = `position:absolute;left:0;right:0;top:45%;text-align:center;font-size:${o.size}pt;font-weight:700;color:${o.color};opacity:${o.op};transform:rotate(${o.rot}deg);pointer-events:none;z-index:0;white-space:nowrap;-webkit-print-color-adjust:exact;print-color-adjust:exact`; pg.appendChild(w); }); dirty = true; },
      wmDel: () => { doc.querySelectorAll('.we-wm').forEach(x => x.remove()); dirty = true; },
      pageColNone: () => { pages().forEach(pg => { pg.style.background = ''; }); dirty = true; },
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
    // ribbon tabs
    root.querySelectorAll('#weTabs [data-p]').forEach(t => t.onclick = () => { root.querySelectorAll('#weTabs [data-p]').forEach(x => x.classList.toggle('on', x === t)); root.querySelectorAll('.we-bar[data-p]').forEach(b => { b.hidden = b.dataset.p !== t.dataset.p; }); });
    const dfont = root.querySelector('#weDocFont'); dfont.innerHTML = '<option value="">خط الوثيقة كلها…</option>' + fontList().map(f => `<option value="${escH(f)}" style="font-family:'${escH(f)}'">${escH(f)}</option>`).join('');
    dfont.onchange = e => { if (!doc) return; const f = e.target.value; styleEl('we-dfont').textContent = f ? `.page-a4,.page-a4 *,.page-a4l,.page-a4l *,.sheet,.sheet *{font-family:'${f.replace(/'/g, '')}',sans-serif!important}` : ''; dirty = true; };
    root.querySelector('#weTheme').onchange = e => { if (!doc || e.target.value === '') return; const t = THEMES[+e.target.value]; styleEl('we-theme').textContent = `h1,h2,h3,h4,.sb-cap,.mk-title,.mk-certt,.title,.doc-title,.ct-title,th{color:${t.h}!important}th{border-color:${t.h}}` + (t.f ? `.page-a4,.page-a4l,.sheet{font-family:'${t.f}',sans-serif}` : ''); dirty = true; e.target.value = ''; toast('تم تطبيق السمة: ' + t.n); };
    root.querySelector('#weParaSp').onchange = e => { if (!doc || e.target.value === '') return; const v = [[0, 1.15], [2, 1.3], [6, 1.5], [10, 1.7], [12, 2]][+e.target.value]; styleEl('we-psp').textContent = `.page-a4 p,.page-a4l p,.sheet p{margin:0 0 ${v[0]}pt!important;line-height:${v[1]}}`; dirty = true; e.target.value = ''; };
    root.querySelector('#wePageCol').oninput = e => { if (!doc) return; pages().forEach(pg => { pg.style.background = e.target.value; pg.style.webkitPrintColorAdjust = 'exact'; pg.style.printColorAdjust = 'exact'; }); dirty = true; };
    const applyBorder = () => { if (!doc) return; const i = root.querySelector('#weBorder').value; const c = root.querySelector('#weBorderCol').value; doc.querySelectorAll('.we-pbd').forEach(x => x.remove()); if (i === '' || !BORDERS[+i].css) { dirty = true; return; }
      pages().forEach(pg => { relPos(pg); const d = doc.createElement('div'); d.className = 'we-pbd'; d.contentEditable = 'false'; d.style.cssText = `position:absolute;inset:6mm;pointer-events:none;z-index:1;-webkit-print-color-adjust:exact;print-color-adjust:exact;${BORDERS[+i].css.replace(/\{c\}/g, c)}`; pg.appendChild(d); }); dirty = true; };
    root.querySelector('#weBorder').onchange = applyBorder; root.querySelector('#weBorderCol').oninput = applyBorder;
    root.querySelector('#weMargins').onchange = async e => { if (!doc) return; let v = e.target.value; e.target.value = ''; if (v === '') return;
      let m = v === 'c' ? null : MARGINS[+v].v;
      if (v === 'c') { const r = await ask('هوامش مخصصة', 'أعلى، يمين، أسفل، يسار (مم)', '20, 20, 20, 20'); if (!r) return; const a = r.split(/[,،\s]+/).map(Number).filter(x => !isNaN(x)); if (a.length < 4) return toast('أدخل أربعة أرقام', true); m = a.slice(0, 4); }
      pages().forEach(pg => { pg.style.padding = m ? `${m[0]}mm ${m[1]}mm ${m[2]}mm ${m[3]}mm` : ''; pg.style.boxSizing = m ? 'border-box' : ''; }); dirty = true; };
    root.querySelector('#weOrient').onchange = e => { if (!doc) return; const v = e.target.value; e.target.value = ''; if (!v) return;
      if (doc.querySelector('.sheet')) return toast('هذه الوثيقة بنسختين في ورقة أفقية: لا يمكن تغيير اتجاهها', true);
      doc.querySelectorAll('.page-a4,.page-a4l').forEach(pg => { pg.classList.remove('page-a4', 'page-a4l'); pg.classList.add(v === 'l' ? 'page-a4l' : 'page-a4'); });
      styleEl('we-page').textContent = `@page{size:A4 ${v === 'l' ? 'landscape' : 'portrait'};margin:0}`; orient = v; dirty = true; };
    root.querySelector('#weCols').onchange = e => { if (!doc) return; const n = +e.target.value; e.target.value = ''; if (!n) return;
      const bl = blocks().filter(b => !b.closest('td,th')); if (!bl.length) return toast('حدد الفقرات أولا', true);
      const ex = bl[0].closest('.we-cols');
      if (ex) { if (n === 1) { while (ex.firstChild) ex.before(ex.firstChild); ex.remove(); } else ex.style.columnCount = n; dirty = true; return; }
      if (n === 1) return;
      const par = bl[0].parentElement, same = bl.filter(b => b.parentElement === par);
      const w = doc.createElement('div'); w.className = 'we-cols'; w.style.cssText = `column-count:${n};column-gap:8mm;column-rule:.2mm solid #ccc`; same[0].before(w); same.forEach(b => w.appendChild(b)); dirty = true; };
    const blockStyle = (id, prop, unit) => { root.querySelector(id).onchange = e => { if (!doc) return; const v = e.target.value; blocks().forEach(b => { b.style[prop] = v === '' ? '' : v + unit; }); dirty = true; }; };
    blockStyle('#weIndR', 'paddingRight', 'mm'); blockStyle('#weIndL', 'paddingLeft', 'mm'); blockStyle('#weSpB', 'marginTop', 'pt'); blockStyle('#weSpA', 'marginBottom', 'pt');

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
    const land = () => (orient ? orient === 'l' : typeof landscape === 'function' ? landscape() : landscape != null ? !!landscape : /size:\s*A4\s+landscape/i.test(html));
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
  .we-tabs{display:flex;gap:2px;padding:4px 10px 0;background:#e3ebe7;direction:rtl}.we-tabs button{border:0;background:transparent;padding:6px 14px;border-radius:7px 7px 0 0;cursor:pointer;font-size:13px;color:#24423a;font-family:inherit}.we-tabs button small{opacity:.6;font-size:10.5px}.we-tabs button.on{background:#fff;font-weight:700;color:#0e5a4a;box-shadow:0 -1px 0 #cfd8d4 inset}
  .we-bar[hidden]{display:none!important}.we-grp{display:inline-flex;align-items:center;gap:3px;padding:0 8px 14px;position:relative;border-left:1px solid #e1e7e4}.we-grp>i{position:absolute;bottom:0;left:0;right:0;text-align:center;font-style:normal;font-size:10.5px;color:#6b7f78}
  .we-lab{display:inline-flex;align-items:center;gap:4px;font-size:12px;color:#31514a}
  .we-shapes{display:grid;grid-template-columns:repeat(5,1fr);gap:6px}.we-shp{display:flex;flex-direction:column;align-items:center;gap:2px;border:1px solid #d4dcd8;border-radius:8px;padding:5px;cursor:pointer;font-size:11px}.we-shp svg{width:60px;height:36px}.we-shp input{display:none}.we-shp:has(input:checked){border-color:#0e5a4a;background:#e8f2ee}
  .we-was{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.we-wa1{display:flex;flex-direction:column;align-items:center;border:1px solid #d4dcd8;border-radius:8px;padding:6px;cursor:pointer}.we-wa1 input{display:none}.we-wa1:has(input:checked){border-color:#0e5a4a;background:#e8f2ee}
  .we-syms{display:grid;grid-template-columns:repeat(10,1fr);gap:4px}.we-syms .we-b{font-size:17px;height:36px}
  .we-area{flex:1;min-height:0}.we-area iframe{width:100%;height:100%;border:0;background:#8a948f}`;
  document.head.appendChild(style);
  window.WordEdit = { open, fontList, userFonts, fontFaceCss };
})();
