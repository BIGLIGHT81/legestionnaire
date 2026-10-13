'use strict';
/* 1.9.4 — مصمم الإعلانات والتصاميم، بدون إنترنت:
   - إعلانات الأنشطة (الحياة المدرسية) والتهاني والشواهد (التهاني والتقديرات) وكل تصميم حر.
   - قوالب كثيرة جاهزة: تخطيطات × ألوان × مواضيع، تُملأ باسم المؤسسة والمدينة والتاريخ.
   - العناصر: نصوص بكل الخطوط (خطوط الحاسوب والخطوط المستوردة)، أشكال (مستطيل، دائرة، نجمة، سهم، قلب، شريط، فقاعة كلام...)،
     خطوط، رموز، صور من الحاسوب، شعار المملكة، خلفيات (لون، تدرج، زخارف).
   - الخصائص: اللون والتدرج، الحدود، الظل، الشفافية، الدوران، الانعكاس، الزوايا المستديرة، تباعد الأسطر.
   - معالجة الصور: السطوع، التباين، التشبع، الضبابية، تدرج الرمادي، البني القديم، تدوير الألوان، العكس، القناع الدائري.
   - الطبقات (تقديم، تأخير، قفل، إخفاء، تكرار)، تراجع / إعادة، تكبير، محاذاة على مركز الصفحة.
   - الحفظ في «تصاميمي»، والتصدير PNG / JPG، الحفظ PDF والطباعة.
   Data: DB.designs = [{ id, name, cat, doc, thumb, at }] ; doc = { w, h, bg, objs: [...] } (units: px at 96 dpi). */
(function () {
  const escH = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const SIZES = [
    ['a4p', 'A4 عمودي', 794, 1123], ['a4l', 'A4 أفقي', 1123, 794], ['a5p', 'A5 عمودي', 559, 794], ['a5l', 'A5 أفقي', 794, 559],
    ['sq', 'منشور مربع (فيسبوك / إنستغرام)', 1080, 1080], ['story', 'قصة / ستوري (1080×1920)', 1080, 1920], ['fbc', 'غلاف فيسبوك', 1640, 624], ['wa', 'صورة واتساب (1080×1350)', 1080, 1350]
  ];
  const FONTS0 = ['NSA', 'Amiri', 'MAJT', 'MAJ', 'Sakkal Majalla', 'Traditional Arabic', 'Arabic Typesetting', 'Simplified Arabic', 'Tahoma', 'Arial', 'Times New Roman', 'Calibri', 'Tif'];
  const fonts = () => Array.from(new Set(FONTS0.concat(window.WordEdit && WordEdit.fontList ? WordEdit.fontList() : [])));
  const uidD = () => 'o' + Math.random().toString(36).slice(2, 9);
  const clone = o => JSON.parse(JSON.stringify(o));
  const DG = () => { const d = (DB.designs = Array.isArray(DB.designs) ? DB.designs : []); return d; };

  /* ================= shapes (unit box -1..1) ================= */
  const star = (n, r2) => { const p = []; for (let i = 0; i < n * 2; i++) { const r = i % 2 ? r2 : 1, a = -Math.PI / 2 + i * Math.PI / n; p.push([r * Math.cos(a), r * Math.sin(a)]); } return p; };
  const POLY = {
    tri: [[0, -1], [1, 1], [-1, 1]], diamond: [[0, -1], [1, 0], [0, 1], [-1, 0]], hex: [[-.5, -1], [.5, -1], [1, 0], [.5, 1], [-.5, 1], [-1, 0]],
    star5: star(5, .45), star8: star(8, .62), burst: star(16, .78), star6: star(6, .55),
    arrowR: [[-1, -.35], [.25, -.35], [.25, -1], [1, 0], [.25, 1], [.25, .35], [-1, .35]], arrowL: [[1, -.35], [-.25, -.35], [-.25, -1], [-1, 0], [-.25, 1], [-.25, .35], [1, .35]],
    banner: [[-1, -1], [1, -1], [.82, 0], [1, 1], [-1, 1], [-.82, 0]], ribbon: [[-1, -.6], [-.75, -1], [.75, -1], [1, -.6], [.75, -.2], [.75, 1], [0, .55], [-.75, 1], [-.75, -.2]],
    bubble: [[-1, -1], [1, -1], [1, .5], [-.2, .5], [-.55, 1], [-.5, .5], [-1, .5]], penta: star(5, 1).filter((_, i) => i % 2 === 0),
    para: [[-.6, -1], [1, -1], [.6, 1], [-1, 1]], chevron: [[-1, -1], [.4, -1], [1, 0], [.4, 1], [-1, 1], [-.4, 0]], cross: [[-.3, -1], [.3, -1], [.3, -.3], [1, -.3], [1, .3], [.3, .3], [.3, 1], [-.3, 1], [-.3, .3], [-1, .3], [-1, -.3], [-.3, -.3]]
  };
  const SHAPE_NAMES = { rect: 'مستطيل', round: 'مستطيل مستدير', ellipse: 'دائرة', tri: 'مثلث', diamond: 'معين', hex: 'سداسي', penta: 'خماسي', star5: 'نجمة', star6: 'نجمة سداسية', star8: 'نجمة ثمانية', burst: 'شارة', heart: 'قلب', arrowR: 'سهم →', arrowL: 'سهم ←', banner: 'شريط', ribbon: 'وسام', bubble: 'فقاعة كلام', para: 'متوازي', chevron: 'شيفرون', cross: 'زائد', wave: 'موجة', line: 'خط', dline: 'خط متقطع', arc: 'قوس' };
  const ICONS = ['⭐', '🌟', '✨', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎓', '📚', '📖', '✏️', '🖍️', '🎨', '🎭', '🎵', '🎶', '⚽', '🏀', '🏃', '🚴', '🌳', '🌿', '🌸', '🌷', '🌍', '♻️', '💧', '☀️', '🌙', '🕌', '🇲🇦', '❤️', '💚', '💙', '🤝', '👏', '🙌', '👨‍🏫', '👩‍🏫', '🧒', '👧', '👦', '🏫', '📅', '⏰', '📍', '📢', '📣', '💡', '🔬', '🧪', '💻', '🖥️', '📷', '🎤', '🧩', '♟️', '🍎', '🩺', '😷', '🦷', '🚦', '✅', '☑️', '➡️', '⬅️', '🔔', '📌', '✉️', '☎️', '🏅', '🎖️', '🪔', '🌙', '🐑', '🕋', '📜', '🖊️', '🗓️'];

  /* ================= rendering ================= */
  const imgCache = new Map();
  let redrawHook = null;
  const getImg = src => {
    if (!src) return null;
    let im = imgCache.get(src);
    if (!im) { im = new Image(); im.onload = () => { if (redrawHook) redrawHook(); }; im.src = src; imgCache.set(src, im); }
    return im.complete && im.naturalWidth ? im : null;
  };
  function paintFill(ctx, o, w, h, key) {
    const c1 = o[key || 'fill'] || 'transparent';
    if (!o.fill2 || key === 'stroke') return c1;
    const a = (o.gAng || 0) * Math.PI / 180, dx = Math.cos(a) * w / 2, dy = Math.sin(a) * h / 2;
    const g = o.gType === 'radial' ? ctx.createRadialGradient(0, 0, 0, 0, 0, Math.max(w, h) / 2) : ctx.createLinearGradient(-dx, -dy, dx, dy);
    g.addColorStop(0, c1); g.addColorStop(1, o.fill2); return g;
  }
  function bgPaint(ctx, bg, W, H) {
    if (!bg) return '#fff';
    if (bg.t === 'grad' || bg.t === 'radial') {
      const a = (bg.ang || 0) * Math.PI / 180, cx = W / 2, cy = H / 2, dx = Math.cos(a) * W / 2, dy = Math.sin(a) * H / 2;
      const g = bg.t === 'radial' ? ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * .7) : ctx.createLinearGradient(cx - dx, cy - dy, cx + dx, cy + dy);
      g.addColorStop(0, bg.c1 || '#fff'); g.addColorStop(1, bg.c2 || '#ddd'); return g;
    }
    return bg.c1 || '#fff';
  }
  function bgPattern(ctx, bg, W, H) {
    if (!bg || !bg.pat) return;
    ctx.save(); ctx.globalAlpha = bg.patOp == null ? .18 : bg.patOp; ctx.strokeStyle = ctx.fillStyle = bg.patC || '#000'; ctx.lineWidth = 1.2;
    const s = bg.patS || 28;
    if (bg.pat === 'dots') { for (let y = s / 2; y < H; y += s) for (let x = s / 2; x < W; x += s) { ctx.beginPath(); ctx.arc(x, y, s * .1, 0, 7); ctx.fill(); } }
    else if (bg.pat === 'grid') { for (let x = 0; x < W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } }
    else if (bg.pat === 'diag') { for (let x = -H; x < W; x += s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); } }
    else if (bg.pat === 'stars') { for (let y = s; y < H; y += s * 2) for (let x = (y / s) % 4 ? s : s * 2; x < W; x += s * 2) { ctx.beginPath(); POLY.star5.forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](x + px * s * .25, y + py * s * .25)); ctx.closePath(); ctx.fill(); } }
    else if (bg.pat === 'zellige') { const r = s * .9; for (let y = 0; y < H + r; y += r * 1.5) for (let x = 0; x < W + r; x += r * 1.5) { ctx.beginPath(); star(8, .7).forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](x + px * r * .6, y + py * r * .6)); ctx.closePath(); ctx.stroke(); } }
    else if (bg.pat === 'waves') { for (let y = s; y < H; y += s) { ctx.beginPath(); for (let x = 0; x <= W; x += 6) ctx.lineTo(x, y + Math.sin(x / s * 2) * s * .2); ctx.stroke(); } }
    ctx.restore();
  }
  // text: wrapped lines (RTL aware); the box height follows the text
  function layoutText(ctx, o) {
    ctx.font = `${o.it ? 'italic ' : ''}${o.bold ? 700 : 400} ${o.size}px "${o.font || 'NSA'}", "NSA", sans-serif`;
    const out = [], maxW = Math.max(10, o.w - 4);
    String(o.text || '').split('\n').forEach(par => {
      const words = par.split(/\s+/); let line = '';
      if (!par) { out.push(''); return; }
      words.forEach(w => { const t = line ? line + ' ' + w : w; if (ctx.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; });
      out.push(line);
    });
    return out;
  }
  function drawObj(ctx, o, forExport) {
    if (o.hide) return;
    ctx.save();
    ctx.translate(o.x, o.y); ctx.rotate((o.rot || 0) * Math.PI / 180); ctx.scale(o.flipX ? -1 : 1, o.flipY ? -1 : 1);
    ctx.globalAlpha = o.op == null ? 1 : o.op;
    if (o.sh) { ctx.shadowColor = o.shC || 'rgba(0,0,0,.45)'; ctx.shadowBlur = o.shB == null ? 12 : o.shB; ctx.shadowOffsetX = o.shX == null ? 4 : o.shX; ctx.shadowOffsetY = o.shY == null ? 4 : o.shY; }
    const w = o.w, h = o.h;
    const strokeIt = () => { if (o.stroke && o.sw > 0) { ctx.shadowColor = 'transparent'; ctx.lineWidth = o.sw; ctx.strokeStyle = o.stroke; if (o.dash) ctx.setLineDash([o.sw * 3, o.sw * 2]); ctx.stroke(); } };
    if (o.type === 'text') {
      const lines = layoutText(ctx, o), lh = o.size * (o.lh || 1.3);
      o.h = Math.max(o.size * 1.1, lines.length * lh);
      if (o.box) { ctx.fillStyle = o.box; roundRect(ctx, -o.w / 2 - 8, -o.h / 2 - 6, o.w + 16, o.h + 12, o.boxR || 0); ctx.fill(); ctx.shadowColor = 'transparent'; }
      ctx.direction = o.dir === 'ltr' ? 'ltr' : 'rtl';
      ctx.textBaseline = 'middle';
      const al = o.align || 'center';
      ctx.textAlign = al === 'center' ? 'center' : al === 'right' ? 'right' : 'left';
      const x = al === 'center' ? 0 : al === 'right' ? o.w / 2 : -o.w / 2;
      ctx.fillStyle = paintFill(ctx, o, o.w, o.h);
      lines.forEach((ln, i) => {
        const y = -o.h / 2 + lh * (i + .5);
        if (o.stroke && o.sw > 0) { ctx.save(); ctx.shadowColor = 'transparent'; ctx.lineJoin = 'round'; ctx.lineWidth = o.sw * 2; ctx.strokeStyle = o.stroke; ctx.strokeText(ln, x, y); ctx.restore(); }
        ctx.fillText(ln, x, y);
        if (o.ul) { const m = ctx.measureText(ln).width, x0 = al === 'center' ? -m / 2 : al === 'right' ? o.w / 2 - m : -o.w / 2; ctx.fillRect(x0, y + o.size * .45, m, Math.max(1, o.size / 16)); }
      });
    } else if (o.type === 'image') {
      const im = getImg(o.src);
      ctx.save();
      if (o.round || o.circle) { ctx.beginPath(); if (o.circle) ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else roundRect(ctx, -w / 2, -h / 2, w, h, o.round); ctx.clip(); }
      const f = o.f || {};
      const flt = [f.b != null && f.b !== 100 ? `brightness(${f.b}%)` : '', f.c != null && f.c !== 100 ? `contrast(${f.c}%)` : '', f.s != null && f.s !== 100 ? `saturate(${f.s}%)` : '', f.blur ? `blur(${f.blur}px)` : '', f.gray ? `grayscale(${f.gray}%)` : '', f.sepia ? `sepia(${f.sepia}%)` : '', f.hue ? `hue-rotate(${f.hue}deg)` : '', f.inv ? `invert(${f.inv}%)` : ''].filter(Boolean).join(' ');
      if (flt) ctx.filter = flt;
      if (im) {
        // «cover»: the picture fills the frame (cropped), «contain»: whole picture
        const r = im.naturalWidth / im.naturalHeight, R = w / h;
        if (o.fit === 'contain') { const dw = r > R ? w : h * r, dh = r > R ? w / r : h; ctx.drawImage(im, -dw / 2, -dh / 2, dw, dh); }
        else { let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0; if (r > R) { sw = sh * R; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / R; sy = (im.naturalHeight - sh) / 2; } ctx.drawImage(im, sx, sy, sw, sh, -w / 2, -h / 2, w, h); }
      } else if (!forExport) { ctx.fillStyle = '#e6ecea'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.restore();
      if (o.stroke && o.sw > 0) { ctx.beginPath(); if (o.circle) ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else roundRect(ctx, -w / 2, -h / 2, w, h, o.round || 0); strokeIt(); }
    } else if (o.type === 'icon') {
      ctx.font = `${Math.min(w, h) * .86}px "Segoe UI Emoji","Noto Color Emoji","Apple Color Emoji",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(o.text || '⭐', 0, h * .04);
    } else {
      ctx.beginPath();
      const k = o.shape || 'rect';
      if (k === 'rect' || k === 'round') roundRect(ctx, -w / 2, -h / 2, w, h, k === 'round' ? (o.r == null ? Math.min(w, h) * .18 : o.r) : (o.r || 0));
      else if (k === 'ellipse') ctx.ellipse(0, 0, Math.abs(w / 2), Math.abs(h / 2), 0, 0, Math.PI * 2);
      else if (k === 'heart') { ctx.moveTo(0, h * .35); ctx.bezierCurveTo(-w * .55, -h * .05, -w * .4, -h * .6, 0, -h * .22); ctx.bezierCurveTo(w * .4, -h * .6, w * .55, -h * .05, 0, h * .35); ctx.moveTo(0, h * .5); }
      else if (k === 'wave') { ctx.moveTo(-w / 2, h / 2); for (let i = 0; i <= 40; i++) { const x = -w / 2 + w * i / 40; ctx.lineTo(x, -h / 2 + h * .35 + Math.sin(i / 40 * Math.PI * 2 * (o.waves || 2)) * h * .3); } ctx.lineTo(w / 2, h / 2); ctx.closePath(); }
      else if (k === 'line' || k === 'dline') { ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0); ctx.lineWidth = Math.max(1, o.sw || 4); ctx.strokeStyle = o.stroke || o.fill || '#000'; if (k === 'dline') ctx.setLineDash([o.sw * 3, o.sw * 2]); ctx.lineCap = 'round'; ctx.stroke(); ctx.restore(); return; }
      else if (k === 'arc') { ctx.arc(0, h / 2, Math.min(w / 2, h), Math.PI, 0); ctx.lineWidth = Math.max(1, o.sw || 4); ctx.strokeStyle = o.stroke || o.fill || '#000'; ctx.stroke(); ctx.restore(); return; }
      else { const P = POLY[k] || POLY.tri; P.forEach(([px, py], i) => ctx[i ? 'lineTo' : 'moveTo'](px * w / 2, py * h / 2)); ctx.closePath(); }
      if (o.fill && o.fill !== 'none') { ctx.fillStyle = paintFill(ctx, o, w, h); ctx.fill(); }
      strokeIt();
    }
    ctx.restore();
  }
  function roundRect(ctx, x, y, w, h, r) { r = Math.max(0, Math.min(r || 0, Math.abs(w) / 2, Math.abs(h) / 2)); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
  function render(ctx, doc, forExport) {
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = bgPaint(ctx, doc.bg, doc.w, doc.h); ctx.fillRect(0, 0, doc.w, doc.h);
    if (doc.bg && doc.bg.img) { const im = getImg(doc.bg.img); if (im) { ctx.globalAlpha = doc.bg.imgOp == null ? 1 : doc.bg.imgOp; const r = im.naturalWidth / im.naturalHeight, R = doc.w / doc.h; let sw = im.naturalWidth, sh = im.naturalHeight, sx = 0, sy = 0; if (r > R) { sw = sh * R; sx = (im.naturalWidth - sw) / 2; } else { sh = sw / R; sy = (im.naturalHeight - sh) / 2; } ctx.drawImage(im, sx, sy, sw, sh, 0, 0, doc.w, doc.h); ctx.globalAlpha = 1; } }
    bgPattern(ctx, doc.bg, doc.w, doc.h);
    ctx.restore();
    doc.objs.forEach(o => drawObj(ctx, o, forExport));
  }
  function toCanvas(doc, scale) {
    const c = document.createElement('canvas'); c.width = Math.round(doc.w * scale); c.height = Math.round(doc.h * scale);
    const ctx = c.getContext('2d'); ctx.scale(scale, scale); render(ctx, doc, true); return c;
  }

  /* ================= templates ================= */
  const PAL = [
    { n: 'أزرق وذهبي', a: '#16325f', b: '#d4a52c', c: '#f6f1e3', t: '#16325f', l: '#ffffff' },
    { n: 'أخضر', a: '#0e5a4a', b: '#7cc5a6', c: '#eef7f2', t: '#0e3b31', l: '#ffffff' },
    { n: 'أحمر مغربي', a: '#b3202a', b: '#0b6b3a', c: '#fff6ec', t: '#5a1015', l: '#ffffff' },
    { n: 'بنفسجي ووردي', a: '#5b2a86', b: '#ef6fa4', c: '#fbf1f8', t: '#3d1b5c', l: '#ffffff' },
    { n: 'برتقالي وفيروزي', a: '#f07b1d', b: '#159a9c', c: '#fff8ef', t: '#5b3008', l: '#ffffff' },
    { n: 'سماوي', a: '#1e88e5', b: '#ffca28', c: '#eef6fe', t: '#0d3c66', l: '#ffffff' },
    { n: 'أسود وذهبي', a: '#1b1b1b', b: '#d4af37', c: '#fffaf0', t: '#1b1b1b', l: '#f7e7b0' },
    { n: 'فاتح هادئ', a: '#6d9dc5', b: '#f4a6a6', c: '#fdfbf7', t: '#38506a', l: '#ffffff' },
    { n: 'أخضر زيتوني', a: '#5b6b2f', b: '#e0b04f', c: '#f8f6ec', t: '#3a4520', l: '#ffffff' },
    { n: 'نيلي داكن', a: '#0b2545', b: '#13c4a3', c: '#eef4f8', t: '#0b2545', l: '#ffffff' }
  ];
  const CATS = [
    ['activity', 'إعلان نشاط', { title: 'نشاط تربوي', sub: 'تنظم المؤسسة نشاطا تربويا لفائدة التلميذات والتلاميذ', det: 'اليوم: ..........  الساعة: ..........\nالمكان: ساحة المؤسسة', icon: '📢' }],
    ['celeb', 'احتفال بمناسبة', { title: 'احتفال بذكرى المسيرة الخضراء', sub: 'يسر إدارة المؤسسة دعوتكم لحضور الحفل', det: 'يوم ..........  على الساعة ..........\nبفضاء المؤسسة', icon: '🇲🇦' }],
    ['meeting', 'لقاء تواصلي / اجتماع', { title: 'لقاء تواصلي', sub: 'مع أمهات وآباء وأولياء أمور التلاميذ', det: 'يوم ..........  على الساعة ..........\nجدول الأعمال: تتبع التحصيل الدراسي', icon: '🤝' }],
    ['club', 'نادي تربوي', { title: 'نادي البيئة والصحة', sub: 'انخرط في أنشطة النادي', det: 'التسجيل لدى الأستاذ(ة) المنسق(ة)\nكل يوم أربعاء بعد الزوال', icon: '🌿' }],
    ['congrats', 'تهنئة', { title: 'تهنئة', sub: 'تتقدم إدارة المؤسسة بأحر التهاني', det: 'بمناسبة ..........\nكل عام وأنتم بخير', icon: '🎉' }],
    ['thanks', 'شكر وتقدير', { title: 'شكر وتقدير', sub: 'تتقدم إدارة المؤسسة بخالص الشكر والتقدير', det: 'إلى ..........\nعلى مجهوداته القيمة', icon: '🏆' }],
    ['back', 'الدخول المدرسي', { title: 'مرحبا بكم', sub: 'الدخول المدرسي', det: 'انطلاق الدراسة يوم ..........\nنتمنى للجميع سنة دراسية موفقة', icon: '🎒' }],
    ['exam', 'امتحانات ونتائج', { title: 'تهانينا للمتفوقين', sub: 'نتائج الأسدس الأول', det: 'لائحة المتفوقين معلقة بسبورة الإعلانات', icon: '🎓' }],
    ['contest', 'مسابقة', { title: 'مسابقة ثقافية', sub: 'شارك واربح جوائز قيمة', det: 'آخر أجل للمشاركة: ..........', icon: '🏅' }],
    ['health', 'حملة تحسيسية', { title: 'حملة تحسيسية', sub: 'صحتك أمانة', det: 'حول النظافة والتغذية السليمة\nيوم ..........', icon: '🩺' }],
    ['reading', 'القراءة والمكتبة', { title: 'تحدي القراءة', sub: 'اقرأ… تتعلم… تتألق', det: 'استعارة الكتب من المكتبة المدرسية\nكل يوم ..........', icon: '📚' }],
    ['sport', 'نشاط رياضي', { title: 'الدوري المدرسي', sub: 'لكرة القدم المصغرة', det: 'ابتداء من ..........\nبملعب المؤسسة', icon: '⚽' }]
  ];
  const LAYOUTS = ['band', 'diag', 'circle', 'frame', 'side', 'wave', 'ribbon', 'card', 'burst', 'minimal', 'arch', 'split'];
  function schoolTxt() { try { const s = S(); return { school: s.school || 'اسم المؤسسة', city: s.city || '', dir: s.directorate || '' }; } catch (_) { return { school: 'اسم المؤسسة', city: '', dir: '' }; } }
  // one template = layout × palette × category: a full document filled with the school's data
  function template(lay, pi, cat, size) {
    const [W, H] = size || [794, 1123], P = PAL[pi % PAL.length], C = (CATS.find(c => c[0] === cat) || CATS[0])[2], st = schoolTxt();
    const doc = { w: W, h: H, bg: { t: 'solid', c1: P.c }, objs: [] };
    const add = o => { const b = Object.assign({ id: uidD(), rot: 0, op: 1 }, o); doc.objs.push(b); return b; };
    const S0 = Math.min(W, H) / 794;
    const txt = (t, y, size, color, o) => add(Object.assign({ type: 'text', text: t, x: W / 2, y, w: W * .82, h: size * 1.3, size: size * S0, font: 'NSA', bold: true, color, fill: color, align: 'center', lh: 1.25 }, o || {}));
    const shp = (shape, x, y, w, h, fill, o) => add(Object.assign({ type: 'shape', shape, x, y, w, h, fill, stroke: '', sw: 0 }, o || {}));
    const emb = (x, y, s) => add({ type: 'image', src: (window.EMBLEM_DATA || 'assets/emblem.png'), x, y, w: s, h: s, fit: 'contain' });
    const top = H * .06;
    const head = (col) => { txt(st.school, top + 70 * S0, 22, col || P.t, { font: 'Amiri' }); emb(W / 2, top + 22 * S0, 52 * S0); };
    const foot = col => txt([st.city, st.dir].filter(Boolean).join(' — ') || st.school, H - 34 * S0, 15, col || P.t, { bold: false });
    const icon = (y, s) => add({ type: 'icon', text: C.icon, x: W / 2, y, w: s * S0, h: s * S0 });
    switch (LAYOUTS[lay % LAYOUTS.length]) {
      case 'band':
        shp('rect', W / 2, H * .17, W, H * .34, P.a); shp('wave', W / 2, H * .36, W, H * .06, P.a, { waves: 2 });
        head(P.l); txt(C.title, H * .25, 58, P.l, { font: 'Amiri' }); icon(H * .47, 120);
        txt(C.sub, H * .6, 28, P.t); shp('round', W / 2, H * .76, W * .8, H * .14, P.l, { stroke: P.b, sw: 4, sh: true, shB: 18 }); txt(C.det, H * .76, 22, P.t, { bold: false });
        shp('rect', W / 2, H - 16 * S0, W, 32 * S0, P.b); foot(P.t); break;
      case 'diag':
        shp('para', W * .35, H * .2, W * 1.1, H * .45, P.a, { rot: -8 }); shp('para', W * .7, H * .93, W * 1.1, H * .25, P.b, { rot: -8, op: .9 });
        head(P.l); txt(C.title, H * .29, 60, P.l, { font: 'Amiri', sh: true, shB: 6 }); icon(H * .5, 110);
        txt(C.sub, H * .63, 28, P.t); txt(C.det, H * .74, 22, P.t, { bold: false }); foot(P.l); break;
      case 'circle':
        shp('ellipse', W * .85, H * .1, W * .7, W * .7, P.b, { op: .35 }); shp('ellipse', W * .1, H * .92, W * .6, W * .6, P.a, { op: .25 });
        shp('ellipse', W / 2, H * .42, W * .62, W * .62, P.a, { stroke: P.b, sw: 10 }); head(P.t);
        icon(H * .33, 100); txt(C.title, H * .45, 54, P.l, { font: 'Amiri', w: W * .55 }); txt(C.sub, H * .7, 28, P.t); txt(C.det, H * .8, 22, P.t, { bold: false }); foot(); break;
      case 'frame':
        shp('rect', W / 2, H / 2, W - 40 * S0, H - 40 * S0, 'none', { stroke: P.a, sw: 10 }); shp('rect', W / 2, H / 2, W - 70 * S0, H - 70 * S0, 'none', { stroke: P.b, sw: 3 });
        ['star8'].forEach(k => [[60, 60], [W - 60, 60], [60, H - 60], [W - 60, H - 60]].forEach(([x, y]) => shp(k, x * 1, y, 46 * S0, 46 * S0, P.b)));
        head(); shp('line', W / 2, H * .2, W * .5, 6, '', { stroke: P.b, sw: 3 }); txt(C.title, H * .3, 62, P.a, { font: 'Amiri' }); icon(H * .45, 100);
        txt(C.sub, H * .58, 28, P.t); txt(C.det, H * .7, 22, P.t, { bold: false }); foot(); break;
      case 'side':
        shp('rect', W * .1, H / 2, W * .2, H, P.a); shp('rect', W * .205, H / 2, 10 * S0, H, P.b);
        add({ type: 'text', text: C.title, x: W * .1, y: H / 2, w: H * .8, h: 80, size: 54 * S0, font: 'Amiri', bold: true, color: P.l, fill: P.l, align: 'center', rot: -90 });
        txt(st.school, H * .08, 22, P.t, { x: W * .6, w: W * .7, font: 'Amiri' }); add({ type: 'icon', text: C.icon, x: W * .6, y: H * .3, w: 140 * S0, h: 140 * S0 });
        txt(C.sub, H * .5, 30, P.t, { x: W * .6, w: W * .7 }); txt(C.det, H * .66, 23, P.t, { x: W * .6, w: W * .7, bold: false }); txt(st.city, H * .92, 16, P.t, { x: W * .6, w: W * .7, bold: false }); break;
      case 'wave':
        doc.bg = { t: 'grad', c1: P.c, c2: '#ffffff', ang: 90 };
        shp('wave', W / 2, H * .9, W, H * .22, P.a, { waves: 3 }); shp('wave', W / 2, H * .93, W, H * .16, P.b, { waves: 2, op: .8 });
        shp('wave', W / 2, H * .1, W, H * .2, P.a, { waves: 2, flipY: true }); head(P.l);
        txt(C.title, H * .32, 62, P.a, { font: 'Amiri' }); icon(H * .47, 120); txt(C.sub, H * .6, 28, P.t); txt(C.det, H * .7, 22, P.t, { bold: false }); foot(P.l); break;
      case 'ribbon':
        doc.bg = { t: 'solid', c1: P.c, pat: 'dots', patC: P.a, patS: 30, patOp: .12 };
        head(); shp('banner', W / 2, H * .3, W * .92, 130 * S0, P.a, { sh: true }); txt(C.title, H * .3, 54, P.l, { font: 'Amiri' });
        icon(H * .47, 120); txt(C.sub, H * .6, 28, P.t); shp('ribbon', W / 2, H * .78, 150 * S0, 150 * S0, P.b, { op: .9 }); txt(C.det, H * .7, 22, P.t, { bold: false }); foot(); break;
      case 'card':
        doc.bg = { t: 'grad', c1: P.a, c2: P.b, ang: 135, pat: 'zellige', patC: '#ffffff', patS: 40, patOp: .1 };
        shp('round', W / 2, H / 2, W * .84, H * .82, '#ffffff', { r: 30 * S0, sh: true, shB: 30, shC: 'rgba(0,0,0,.35)' });
        head(); icon(H * .3, 110); txt(C.title, H * .42, 58, P.a, { font: 'Amiri' }); txt(C.sub, H * .55, 28, P.t); txt(C.det, H * .67, 22, P.t, { bold: false }); foot('#ffffff'); break;
      case 'burst':
        doc.bg = { t: 'radial', c1: P.l === '#ffffff' ? '#ffffff' : P.c, c2: P.c };
        shp('burst', W / 2, H * .42, W * .82, W * .82, P.b, { op: .9 }); shp('ellipse', W / 2, H * .42, W * .58, W * .58, P.a);
        head(); icon(H * .32, 90); txt(C.title, H * .44, 54, P.l, { font: 'Amiri', w: W * .52 }); txt(C.sub, H * .72, 28, P.t); txt(C.det, H * .81, 22, P.t, { bold: false }); foot(); break;
      case 'minimal':
        head(); shp('line', W / 2, H * .22, W * .2, 6, '', { stroke: P.b, sw: 4 }); txt(C.title, H * .34, 70, P.a, { font: 'Amiri' });
        shp('line', W / 2, H * .44, W * .2, 6, '', { stroke: P.b, sw: 4 }); icon(H * .54, 90); txt(C.sub, H * .66, 26, P.t, { bold: false }); txt(C.det, H * .76, 22, P.t, { bold: false }); foot(); break;
      case 'arch':
        shp('round', W / 2, H * .55, W * .74, H * .82, P.a, { r: W * .37 }); shp('round', W / 2, H * .56, W * .66, H * .76, P.c, { r: W * .33, stroke: P.b, sw: 4 });
        emb(W / 2, H * .22, 60 * S0); txt(st.school, H * .29, 20, P.t, { font: 'Amiri', w: W * .6 }); icon(H * .4, 100); txt(C.title, H * .52, 54, P.a, { font: 'Amiri', w: W * .58 });
        txt(C.sub, H * .64, 24, P.t, { w: W * .58 }); txt(C.det, H * .75, 20, P.t, { bold: false, w: W * .58 }); foot(); break;
      case 'split':
        shp('rect', W / 2, H * .25, W, H * .5, P.a); shp('ellipse', W / 2, H * .5, 220 * S0, 220 * S0, P.c, { stroke: P.b, sw: 10 });
        head(P.l); txt(C.title, H * .3, 60, P.l, { font: 'Amiri' }); add({ type: 'icon', text: C.icon, x: W / 2, y: H * .5, w: 130 * S0, h: 130 * S0 });
        txt(C.sub, H * .66, 28, P.t); txt(C.det, H * .77, 22, P.t, { bold: false }); shp('rect', W / 2, H - 20 * S0, W, 40 * S0, P.b); foot(P.t); break;
    }
    return doc;
  }

  /* ================= the editor ================= */
  function open(o0) {
    o0 = o0 || {};
    const rec = o0.id ? DG().find(d => d.id === o0.id) : null;
    let doc = rec ? clone(rec.doc) : o0.doc ? clone(o0.doc) : template(0, 0, o0.cat || 'activity');
    let name = rec ? rec.name : o0.name || 'تصميم جديد', cat = rec ? rec.cat : o0.cat || 'activity';
    let sel = null, zoom = 1, dirty = false;
    const hist = [], fut = [];
    const snap = () => { hist.push(JSON.stringify(doc)); if (hist.length > 80) hist.shift(); fut.length = 0; dirty = true; };
    const root = document.createElement('div'); root.className = 'dz-root';
    root.innerHTML = `
      <div class="dz-top"><b>🎨 مصمم الإعلانات والتصاميم</b><input class="dz-name" id="dzName" value="${escH(name)}" title="اسم التصميم">
        <button class="dz-b" data-a="undo" title="تراجع (Ctrl+Z)">↶</button><button class="dz-b" data-a="redo" title="إعادة (Ctrl+Y)">↷</button>
        <select class="dz-s" id="dzSize" title="حجم التصميم">${SIZES.map(s => `<option value="${s[0]}">${s[1]}</option>`).join('')}</select>
        <select class="dz-s" id="dzZoom" title="التكبير"><option value="fit">ملاءمة</option>${[25, 50, 75, 100, 150].map(z => `<option value="${z}">${z}%</option>`).join('')}</select>
        <span style="flex:1"></span>
        <button class="btn sm" id="dzSave">${ic('save')} حفظ في تصاميمي</button>
        <button class="btn sm" id="dzPng">${ic('down')} صورة PNG</button><button class="btn sm" id="dzJpg">JPG</button>
        <button class="btn sm" id="dzPdf">${ic('pdf')} PDF</button><button class="btn sm pri" id="dzPrint">${ic('print')} طباعة</button>
        <button class="btn sm" id="dzClose">✕ إغلاق</button></div>
      <div class="dz-main">
        <div class="dz-side">
          <div class="dz-tabs">${[['tpl', '🧩 القوالب'], ['el', '🔷 العناصر'], ['txt', '🅰 النصوص'], ['img', '🖼 الصور'], ['bg', '🎨 الخلفية'], ['lay', '🗂 الطبقات']].map(([k, l], i) => `<button data-t="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>
          <div class="dz-panel" id="dzPanel"></div>
        </div>
        <div class="dz-stage" id="dzStage"><div class="dz-wrap" id="dzWrap"><canvas id="dzCv"></canvas><textarea id="dzEdit" class="dz-edit" hidden></textarea></div></div>
        <div class="dz-props" id="dzProps"></div>
      </div>`;
    document.body.appendChild(root);
    const cv = root.querySelector('#dzCv'), ctx = cv.getContext('2d'), stage = root.querySelector('#dzStage'), wrap = root.querySelector('#dzWrap');
    const px = window.devicePixelRatio || 1;
    const sizeKey = () => (SIZES.find(s => s[2] === doc.w && s[3] === doc.h) || [''])[0];
    root.querySelector('#dzSize').value = sizeKey() || 'a4p';

    /* ---- drawing ---- */
    const fitZoom = () => Math.min((stage.clientWidth - 40) / doc.w, (stage.clientHeight - 40) / doc.h);
    let zMode = 'fit';
    const layout = () => { zoom = zMode === 'fit' ? fitZoom() : +zMode / 100; cv.width = Math.round(doc.w * zoom * px); cv.height = Math.round(doc.h * zoom * px); cv.style.width = doc.w * zoom + 'px'; cv.style.height = doc.h * zoom + 'px'; draw(); };
    function draw() {
      ctx.setTransform(px * zoom, 0, 0, px * zoom, 0, 0);
      render(ctx, doc, false);
      const o = selObj();
      if (o) {
        ctx.save(); ctx.translate(o.x, o.y); ctx.rotate((o.rot || 0) * Math.PI / 180);
        const w = o.w, h = o.h, k = 1 / zoom;
        ctx.strokeStyle = '#1a8cff'; ctx.lineWidth = 1.5 * k; ctx.setLineDash([5 * k, 3 * k]); ctx.strokeRect(-w / 2, -h / 2, w, h); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.strokeStyle = '#1a8cff';
        handles(o).forEach(([hx, hy, t]) => { ctx.beginPath(); if (t === 'rot') ctx.arc(hx, hy, 6 * k, 0, 7); else ctx.rect(hx - 5 * k, hy - 5 * k, 10 * k, 10 * k); ctx.fill(); ctx.stroke(); });
        ctx.beginPath(); ctx.moveTo(0, -h / 2); ctx.lineTo(0, -h / 2 - 26 * k); ctx.stroke();
        if (o.lock) { ctx.font = `${16 * k}px sans-serif`; ctx.fillStyle = '#1a8cff'; ctx.fillText('🔒', w / 2 + 6 * k, -h / 2); }
        ctx.restore();
      }
      if (guides.x || guides.y) { ctx.save(); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 1 / zoom; ctx.setLineDash([6 / zoom, 4 / zoom]); if (guides.x) { ctx.beginPath(); ctx.moveTo(doc.w / 2, 0); ctx.lineTo(doc.w / 2, doc.h); ctx.stroke(); } if (guides.y) { ctx.beginPath(); ctx.moveTo(0, doc.h / 2); ctx.lineTo(doc.w, doc.h / 2); ctx.stroke(); } ctx.restore(); }
    }
    redrawHook = () => draw();
    const guides = { x: false, y: false };
    const selObj = () => doc.objs.find(o => o.id === sel) || null;
    const handles = o => { const w = o.w / 2, h = o.h / 2, k = 1 / zoom; return [[-w, -h, 'nw'], [w, -h, 'ne'], [-w, h, 'sw'], [w, h, 'se'], [w, 0, 'e'], [-w, 0, 'w'], [0, h, 's'], [0, -h, 'n'], [0, -h - 26 * k, 'rot']]; };
    const toLocal = (o, x, y) => { const a = -(o.rot || 0) * Math.PI / 180, dx = x - o.x, dy = y - o.y; return [dx * Math.cos(a) - dy * Math.sin(a), dx * Math.sin(a) + dy * Math.cos(a)]; };
    const hit = (x, y) => { for (let i = doc.objs.length - 1; i >= 0; i--) { const o = doc.objs[i]; if (o.hide) continue; const [lx, ly] = toLocal(o, x, y); if (Math.abs(lx) <= Math.abs(o.w) / 2 + 2 && Math.abs(ly) <= Math.abs(o.h) / 2 + 2) return o; } return null; };
    const handleAt = (o, x, y) => { const [lx, ly] = toLocal(o, x, y), r = 9 / zoom; return (handles(o).find(([hx, hy]) => Math.abs(lx - hx) < r && Math.abs(ly - hy) < r) || [])[2] || null; };
    const pt = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) / zoom, (e.clientY - r.top) / zoom]; };

    /* ---- mouse ---- */
    let drag = null;
    cv.addEventListener('pointerdown', e => {
      hideEdit();
      const [x, y] = pt(e); let o = selObj(), h = o && !o.lock ? handleAt(o, x, y) : null;
      if (!h) { o = hit(x, y); sel = o ? o.id : null; }
      if (o && !o.lock) drag = { h: h || 'move', x0: x, y0: y, o0: clone(o), moved: false };
      props(); draw(); if (panelTab === 'lay') panel();
    });
    window.addEventListener('pointermove', mm);
    function mm(e) {
      if (!drag) return; const o = selObj(); if (!o) return;
      const [x, y] = pt(e), O = drag.o0;
      if (!drag.moved) { snap(); drag.moved = true; }
      if (drag.h === 'move') {
        o.x = O.x + x - drag.x0; o.y = O.y + y - drag.y0;
        guides.x = Math.abs(o.x - doc.w / 2) < 6 / zoom; guides.y = Math.abs(o.y - doc.h / 2) < 6 / zoom;
        if (guides.x) o.x = doc.w / 2; if (guides.y) o.y = doc.h / 2;
      } else if (drag.h === 'rot') {
        let a = Math.atan2(y - O.y, x - O.x) * 180 / Math.PI + 90; if (e.shiftKey) a = Math.round(a / 15) * 15; else if (Math.abs(a % 90) < 3) a = Math.round(a / 90) * 90; o.rot = Math.round(a);
      } else {
        const [lx, ly] = toLocal(O, x, y), hs = drag.h;
        let w = O.w, hh = O.h;
        if (/e/.test(hs)) w = Math.max(8, lx + O.w / 2); if (/w/.test(hs)) w = Math.max(8, O.w / 2 - lx);
        if (/s/.test(hs)) hh = Math.max(8, ly + O.h / 2); if (/n/.test(hs)) hh = Math.max(8, O.h / 2 - ly);
        const corner = hs.length === 2;
        if (corner && (o.type === 'image' || o.type === 'icon' || o.type === 'text' || e.shiftKey)) { const s = Math.max(w / O.w, hh / O.h); w = O.w * s; hh = O.h * s; if (o.type === 'text') o.size = Math.max(6, O.size * s); }
        // the opposite side stays in place
        const dx = (/e/.test(hs) ? 1 : /w/.test(hs) ? -1 : 0) * (w - O.w) / 2, dy = (/s/.test(hs) ? 1 : /n/.test(hs) ? -1 : 0) * (hh - O.h) / 2, a = (O.rot || 0) * Math.PI / 180;
        o.w = w; if (o.type !== 'text') o.h = hh;
        o.x = O.x + dx * Math.cos(a) - dy * Math.sin(a); o.y = O.y + dx * Math.sin(a) + dy * Math.cos(a);
      }
      draw();
    }
    const mu = () => { if (drag && drag.moved) { props(); } drag = null; guides.x = guides.y = false; draw(); };
    window.addEventListener('pointerup', mu);
    cv.addEventListener('dblclick', e => { const [x, y] = pt(e), o = hit(x, y); if (o && o.type === 'text' && !o.lock) editText(o); });
    // inline text editing
    const ed = root.querySelector('#dzEdit');
    function editText(o) {
      sel = o.id; draw();
      Object.assign(ed.style, { left: (o.x - o.w / 2) * zoom + 'px', top: (o.y - o.h / 2) * zoom + 'px', width: o.w * zoom + 'px', height: Math.max(o.h, o.size * 1.6) * zoom + 'px', fontSize: o.size * zoom + 'px', fontFamily: `"${o.font}",NSA,sans-serif`, fontWeight: o.bold ? 700 : 400, textAlign: o.align || 'center', color: o.color || '#000', transform: `rotate(${o.rot || 0}deg)`, lineHeight: o.lh || 1.3, direction: o.dir === 'ltr' ? 'ltr' : 'rtl' });
      ed.value = o.text; ed.hidden = false; ed.focus(); ed.select();
      ed.oninput = () => { o.text = ed.value; draw(); };
      ed.onblur = () => hideEdit();
      snap();
    }
    function hideEdit() { if (!ed.hidden) { ed.hidden = true; props(); draw(); } }

    /* ---- keyboard ---- */
    const key = e => {
      if (!root.isConnected) return;
      if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { if (e.key === 'Escape' && e.target === ed) hideEdit(); return; }
      const o = selObj(), mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); act.undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); act.redo(); return; }
      if (mod && e.key.toLowerCase() === 'd') { e.preventDefault(); act.dup(); return; }
      if (!o) return;
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); act.del(); return; }
      const st = e.shiftKey ? 10 : 1, mv = { ArrowLeft: [-st, 0], ArrowRight: [st, 0], ArrowUp: [0, -st], ArrowDown: [0, st] }[e.key];
      if (mv && !o.lock) { e.preventDefault(); snap(); o.x += mv[0]; o.y += mv[1]; draw(); }
      if (e.key === 'Enter' && o.type === 'text') { e.preventDefault(); editText(o); }
    };
    document.addEventListener('keydown', key);

    /* ---- actions ---- */
    const center = o => { o.x = doc.w / 2; o.y = doc.h / 2; return o; };
    const addObj = o => { snap(); const b = Object.assign({ id: uidD(), rot: 0, op: 1 }, o); if (b.x == null) center(b); doc.objs.push(b); sel = b.id; props(); draw(); if (panelTab === 'lay') panel(); return b; };
    const act = {
      undo: () => { if (!hist.length) return; fut.push(JSON.stringify(doc)); doc = JSON.parse(hist.pop()); sel = null; layout(); props(); panel(); },
      redo: () => { if (!fut.length) return; hist.push(JSON.stringify(doc)); doc = JSON.parse(fut.pop()); sel = null; layout(); props(); panel(); },
      del: () => { const o = selObj(); if (!o) return; snap(); doc.objs = doc.objs.filter(x => x !== o); sel = null; props(); draw(); panel(); },
      dup: () => { const o = selObj(); if (!o) return; const c = clone(o); c.id = uidD(); c.x += 20; c.y += 20; addObj(c); },
      front: () => { const o = selObj(); if (!o) return; snap(); doc.objs = doc.objs.filter(x => x !== o).concat([o]); draw(); panel(); },
      back: () => { const o = selObj(); if (!o) return; snap(); doc.objs = [o].concat(doc.objs.filter(x => x !== o)); draw(); panel(); },
      up: () => { const o = selObj(); const i = doc.objs.indexOf(o); if (!o || i === doc.objs.length - 1) return; snap(); doc.objs.splice(i, 1); doc.objs.splice(i + 1, 0, o); draw(); panel(); },
      down: () => { const o = selObj(); const i = doc.objs.indexOf(o); if (!o || i <= 0) return; snap(); doc.objs.splice(i, 1); doc.objs.splice(i - 1, 0, o); draw(); panel(); },
      cx: () => { const o = selObj(); if (o) { snap(); o.x = doc.w / 2; draw(); } }, cy: () => { const o = selObj(); if (o) { snap(); o.y = doc.h / 2; draw(); } },
      flipX: () => { const o = selObj(); if (o) { snap(); o.flipX = !o.flipX; draw(); } }, flipY: () => { const o = selObj(); if (o) { snap(); o.flipY = !o.flipY; draw(); } },
      lock: () => { const o = selObj(); if (o) { o.lock = !o.lock; props(); draw(); panel(); } }
    };
    root.querySelectorAll('.dz-top [data-a]').forEach(b => b.onclick = () => act[b.dataset.a]());

    /* ---- side panels ---- */
    let panelTab = 'tpl', tplCat = cat, tplLay = -1;
    const pn = root.querySelector('#dzPanel');
    root.querySelectorAll('.dz-tabs [data-t]').forEach(b => b.onclick = () => { panelTab = b.dataset.t; root.querySelectorAll('.dz-tabs [data-t]').forEach(x => x.classList.toggle('on', x === b)); panel(); });
    const thumbs = new Map();
    const thumb = (lay, pi, c) => {
      const k = `${lay}|${pi}|${c}|${doc.w}x${doc.h}`; if (thumbs.has(k)) return thumbs.get(k);
      const d = template(lay, pi, c, [doc.w, doc.h]); const cvs = toCanvas(d, 150 / Math.max(d.w, d.h)); const u = cvs.toDataURL('image/jpeg', .8); thumbs.set(k, u); return u;
    };
    function panel() {
      if (panelTab === 'tpl') {
        pn.innerHTML = `<div class="dz-h">الموضوع</div><select class="dz-s full" id="dzCat">${CATS.map(c => `<option value="${c[0]}" ${c[0] === tplCat ? 'selected' : ''}>${c[1]}</option>`).join('')}</select>
          <div class="dz-h">التخطيط</div><div class="dz-chips"><button data-lay="-1" class="${tplLay < 0 ? 'on' : ''}">الكل</button>${LAYOUTS.map((l, i) => `<button data-lay="${i}" class="${tplLay === i ? 'on' : ''}">${i + 1}</button>`).join('')}</div>
          <div class="dz-note">${LAYOUTS.length * PAL.length} قالبا لكل موضوع (${CATS.length} مواضيع). اضغط على قالب لتطبيقه، ثم عدّل النصوص والألوان.</div>
          <div class="dz-grid" id="dzTpl"></div>`;
        const g = pn.querySelector('#dzTpl'); const items = [];
        LAYOUTS.forEach((_, l) => { if (tplLay >= 0 && l !== tplLay) return; PAL.forEach((p, pi) => items.push([l, pi])); });
        let i = 0; const step = () => { const part = items.slice(i, i + 12); part.forEach(([l, pi]) => { const b = document.createElement('button'); b.className = 'dz-tp'; b.title = `تخطيط ${l + 1} — ${PAL[pi].n}`; b.innerHTML = `<img src="${thumb(l, pi, tplCat)}">`; b.onclick = async () => { if (doc.objs.length && dirty && !(await confirmBox('تطبيق القالب يعوض التصميم الحالي. متابعة؟', 'تطبيق', false))) return; snap(); doc = template(l, pi, tplCat, [doc.w, doc.h]); cat = tplCat; sel = null; layout(); props(); }; g.appendChild(b); }); i += 12; if (i < items.length && g.isConnected) setTimeout(step, 30); };
        step();
        pn.querySelector('#dzCat').onchange = e => { tplCat = e.target.value; panel(); };
        pn.querySelectorAll('[data-lay]').forEach(b => b.onclick = () => { tplLay = +b.dataset.lay; panel(); });
      } else if (panelTab === 'el') {
        pn.innerHTML = `<div class="dz-h">الأشكال</div><div class="dz-shapes">${Object.keys(SHAPE_NAMES).map(k => `<button data-sh="${k}" title="${SHAPE_NAMES[k]}"><canvas width="56" height="40" data-pv="${k}"></canvas></button>`).join('')}</div>
          <div class="dz-h">رموز وأيقونات</div><div class="dz-icons">${ICONS.map(c => `<button data-ic="${c}">${c}</button>`).join('')}</div>`;
        pn.querySelectorAll('canvas[data-pv]').forEach(c => { const x = c.getContext('2d'); drawObj(x, { type: 'shape', shape: c.dataset.pv, x: 28, y: 20, w: 46, h: 30, fill: '#7cc5a6', stroke: '#0e5a4a', sw: 2 }); });
        pn.querySelectorAll('[data-sh]').forEach(b => b.onclick = () => { const k = b.dataset.sh, ln = /line|arc/.test(k); addObj({ type: 'shape', shape: k, w: ln ? 300 : 220, h: ln ? (k === 'arc' ? 120 : 20) : (k === 'rect' || k === 'round' ? 140 : 200), fill: ln ? '' : '#1e88e5', fill2: '', stroke: ln ? '#16325f' : '', sw: ln ? 5 : 0 }); });
        pn.querySelectorAll('[data-ic]').forEach(b => b.onclick = () => addObj({ type: 'icon', text: b.dataset.ic, w: 120, h: 120 }));
      } else if (panelTab === 'txt') {
        const P = [['عنوان رئيسي', 64, 'Amiri', true], ['عنوان فرعي', 36, 'NSA', true], ['نص عادي', 24, 'NSA', false], ['نص صغير', 16, 'NSA', false]];
        const FX = [['ظل', { sh: true, shB: 8, shX: 3, shY: 3 }], ['حدود', { stroke: '#ffffff', sw: 3, sh: true, shB: 4 }], ['تدرج', { fill2: '#d4a52c', gAng: 90 }], ['مربع خلفية', { box: '#16325f', color: '#ffffff', fill: '#ffffff', boxR: 10 }], ['متوهج', { color: '#ffffff', fill: '#ffffff', sh: true, shC: '#1e88e5', shB: 18, shX: 0, shY: 0 }]];
        pn.innerHTML = `<div class="dz-h">إضافة نص</div>${P.map(([t, s, f, b], i) => `<button class="dz-tx" data-tx="${i}" style="font-family:'${f}';font-size:${Math.min(28, s / 2 + 6)}px;font-weight:${b ? 700 : 400}">${t}</button>`).join('')}
          <div class="dz-h">نصوص جاهزة بتأثيرات</div>${FX.map(([t], i) => `<button class="dz-tx" data-fx="${i}">${t}</button>`).join('')}
          <div class="dz-h">بيانات المؤسسة</div><button class="dz-tx" data-sch="school">اسم المؤسسة</button><button class="dz-tx" data-sch="city">المدينة والتاريخ</button><button class="dz-tx" data-sch="sy">الموسم الدراسي</button>`;
        pn.querySelectorAll('[data-tx]').forEach(b => b.onclick = () => { const [t, s, f, bd] = P[+b.dataset.tx]; addObj({ type: 'text', text: t, w: doc.w * .7, h: s * 1.3, size: s, font: f, bold: bd, color: '#16325f', fill: '#16325f', align: 'center', lh: 1.3 }); });
        pn.querySelectorAll('[data-fx]').forEach(b => b.onclick = () => { const fx = FX[+b.dataset.fx]; addObj(Object.assign({ type: 'text', text: fx[0], w: doc.w * .7, h: 70, size: 54, font: 'Amiri', bold: true, color: '#16325f', fill: '#16325f', align: 'center', lh: 1.3 }, fx[1])); });
        pn.querySelectorAll('[data-sch]').forEach(b => b.onclick = () => { const st = schoolTxt(); const t = b.dataset.sch === 'school' ? st.school : b.dataset.sch === 'city' ? `${st.city} في ${window.K && K.ldate ? K.ldate(Docs.todayIso()) : ''}` : 'الموسم الدراسي ' + MK.syDash(MK.curSy()); addObj({ type: 'text', text: t, w: doc.w * .8, h: 40, size: 26, font: 'NSA', bold: true, color: '#16325f', fill: '#16325f', align: 'center', lh: 1.3 }); });
      } else if (panelTab === 'img') {
        pn.innerHTML = `<button class="btn pri" id="dzUp" style="width:100%">${ic('up')} صورة من الحاسوب</button>
          <button class="btn" id="dzEmb" style="width:100%;margin-top:6px">شعار المملكة</button>
          ${(() => { try { const s = S(); return s.letterhead ? `<button class="btn" id="dzLh" style="width:100%;margin-top:6px">رأسية المؤسسة (الإعدادات)</button>` : ''; } catch (_) { return ''; } })()}
          <button class="btn" id="dzBgImg" style="width:100%;margin-top:6px">صورة كخلفية للتصميم</button>
          <div class="dz-note">بعد اختيار الصورة: غيّر حجمها من الزوايا، وعدّلها من لوحة الخصائص (السطوع، التباين، التشبع، الضبابية، الأبيض والأسود، القناع الدائري، الإطار...). الصورة تبقى داخل البرنامج ولا تُرسل إلى أي مكان.</div>`;
        const addImg = (src, w0, h0) => { const im = new Image(); im.onload = () => { const r = im.naturalWidth / im.naturalHeight, w = Math.min(doc.w * .6, w0 || im.naturalWidth); addObj({ type: 'image', src, w, h: w / r, fit: 'cover', f: {} }); }; im.src = src; };
        pn.querySelector('#dzUp').onclick = async () => { const d = await window.api.openImage(); if (d) addImg(d); };
        pn.querySelector('#dzEmb').onclick = () => addObj({ type: 'image', src: (window.EMBLEM_DATA || 'assets/emblem.png'), w: 140, h: 140, fit: 'contain', f: {} });
        if (pn.querySelector('#dzLh')) pn.querySelector('#dzLh').onclick = () => addImg(S().letterhead, doc.w * .9);
        pn.querySelector('#dzBgImg').onclick = async () => { const d = await window.api.openImage(); if (d) { snap(); doc.bg = Object.assign({}, doc.bg, { img: d, imgOp: 1 }); draw(); } };
      } else if (panelTab === 'bg') {
        const SW = ['#ffffff', '#fdfbf7', '#f6f1e3', '#eef7f2', '#eef6fe', '#fbf1f8', '#fff8ef', '#f2f2f2', '#16325f', '#0e5a4a', '#b3202a', '#5b2a86', '#f07b1d', '#1e88e5', '#1b1b1b', '#d4a52c'];
        const GR = [['#16325f', '#1e88e5'], ['#0e5a4a', '#7cc5a6'], ['#b3202a', '#f07b1d'], ['#5b2a86', '#ef6fa4'], ['#f7d774', '#b8860b'], ['#13c4a3', '#0b2545'], ['#ffecd2', '#fcb69f'], ['#a1c4fd', '#c2e9fb'], ['#d4fc79', '#96e6a1'], ['#fbc2eb', '#a6c1ee'], ['#1b1b1b', '#434343'], ['#ffffff', '#e6ecea']];
        const PT = [['', 'بدون'], ['dots', 'نقط'], ['grid', 'شبكة'], ['diag', 'خطوط مائلة'], ['stars', 'نجوم'], ['zellige', 'زليج'], ['waves', 'أمواج']];
        const b = doc.bg || {};
        pn.innerHTML = `<div class="dz-h">لون</div><div class="dz-sw">${SW.map(c => `<button data-c="${c}" style="background:${c}"></button>`).join('')}<label class="dz-cp" title="لون آخر">＋<input type="color" id="dzBgC" value="${/^#/.test(b.c1 || '') ? b.c1 : '#ffffff'}"></label></div>
          <div class="dz-h">تدرج</div><div class="dz-sw">${GR.map(([a, c]) => `<button data-g="${a}|${c}" style="background:linear-gradient(135deg,${a},${c})"></button>`).join('')}</div>
          <div class="dz-row"><label>زاوية التدرج</label><input type="range" id="dzBgA" min="0" max="360" value="${b.ang || 90}"></div>
          <div class="dz-h">زخرفة</div><div class="dz-chips">${PT.map(([k, n]) => `<button data-p="${k}" class="${(b.pat || '') === k ? 'on' : ''}">${n}</button>`).join('')}</div>
          <div class="dz-row"><label>لون الزخرفة</label><input type="color" id="dzPc" value="${b.patC || '#000000'}"><label>الشفافية</label><input type="range" id="dzPo" min="3" max="60" value="${Math.round((b.patOp == null ? .18 : b.patOp) * 100)}"></div>
          ${b.img ? `<div class="dz-row"><label>شفافية صورة الخلفية</label><input type="range" id="dzIo" min="5" max="100" value="${Math.round((b.imgOp == null ? 1 : b.imgOp) * 100)}"><button class="dz-b" id="dzIx">✕</button></div>` : ''}`;
        const setBg = o => { snap(); doc.bg = Object.assign({}, doc.bg, o); draw(); };
        pn.querySelectorAll('[data-c]').forEach(x => x.onclick = () => setBg({ t: 'solid', c1: x.dataset.c }));
        pn.querySelector('#dzBgC').oninput = e => { doc.bg = Object.assign({}, doc.bg, { t: 'solid', c1: e.target.value }); draw(); };
        pn.querySelectorAll('[data-g]').forEach(x => x.onclick = () => { const [c1, c2] = x.dataset.g.split('|'); setBg({ t: 'grad', c1, c2, ang: +pn.querySelector('#dzBgA').value }); });
        pn.querySelector('#dzBgA').oninput = e => { doc.bg = Object.assign({}, doc.bg, { ang: +e.target.value }); draw(); };
        pn.querySelectorAll('[data-p]').forEach(x => x.onclick = () => { setBg({ pat: x.dataset.p }); panel(); });
        pn.querySelector('#dzPc').oninput = e => { doc.bg.patC = e.target.value; draw(); };
        pn.querySelector('#dzPo').oninput = e => { doc.bg.patOp = +e.target.value / 100; draw(); };
        if (pn.querySelector('#dzIo')) { pn.querySelector('#dzIo').oninput = e => { doc.bg.imgOp = +e.target.value / 100; draw(); }; pn.querySelector('#dzIx').onclick = () => { setBg({ img: '' }); panel(); }; }
      } else if (panelTab === 'lay') {
        const lab = o => o.type === 'text' ? '🅰 ' + String(o.text).split('\n')[0].slice(0, 22) : o.type === 'image' ? '🖼 صورة' : o.type === 'icon' ? o.text + ' رمز' : '🔷 ' + (SHAPE_NAMES[o.shape] || 'شكل');
        pn.innerHTML = `<div class="dz-h">الطبقات (الأعلى أولا)</div>${doc.objs.slice().reverse().map(o => `<div class="dz-ly ${o.id === sel ? 'on' : ''}" data-id="${o.id}"><span>${escH(lab(o))}</span><button data-hide="${o.id}" title="إخفاء / إظهار">${o.hide ? '🙈' : '👁'}</button><button data-lock="${o.id}" title="قفل">${o.lock ? '🔒' : '🔓'}</button></div>`).join('') || '<div class="dz-note">لا عناصر</div>'}
          <div class="dz-row" style="margin-top:8px"><button class="dz-b" data-la="front" title="إلى الأمام">⤒</button><button class="dz-b" data-la="up" title="طبقة للأعلى">↑</button><button class="dz-b" data-la="down" title="طبقة للأسفل">↓</button><button class="dz-b" data-la="back" title="إلى الخلف">⤓</button><button class="dz-b" data-la="dup" title="تكرار">⧉</button><button class="dz-b" data-la="del" title="حذف">🗑</button></div>`;
        pn.querySelectorAll('.dz-ly').forEach(x => x.onclick = e => { if (e.target.closest('button')) return; sel = x.dataset.id; props(); draw(); panel(); });
        pn.querySelectorAll('[data-hide]').forEach(x => x.onclick = () => { const o = doc.objs.find(y => y.id === x.dataset.hide); snap(); o.hide = !o.hide; draw(); panel(); });
        pn.querySelectorAll('[data-lock]').forEach(x => x.onclick = () => { const o = doc.objs.find(y => y.id === x.dataset.lock); o.lock = !o.lock; draw(); panel(); });
        pn.querySelectorAll('[data-la]').forEach(x => x.onclick = () => act[x.dataset.la]());
      }
    }

    /* ---- properties of the selected element ---- */
    const pr = root.querySelector('#dzProps');
    function props() {
      const o = selObj();
      if (!o) { pr.innerHTML = `<div class="dz-h">التصميم</div><div class="dz-note">اختر عنصرا في التصميم لتعديله. نقرتان على نص لتحريره. اسحب الزوايا لتغيير الحجم، والدائرة العلوية للتدوير (Shift: كل 15°). الأسهم لتحريك العنصر، Delete للحذف، Ctrl+D للتكرار.</div>
        <div class="dz-row"><label>القياس</label><b>${doc.w} × ${doc.h}</b></div>`; return; }
      const fl = fonts(), f = o.f || {};
      const c = (k, l, v) => `<div class="dz-row"><label>${l}</label><input type="color" data-k="${k}" value="${/^#[0-9a-f]{6}$/i.test(v || '') ? v : '#000000'}"></div>`;
      const r = (k, l, min, max, v, step) => `<div class="dz-row"><label>${l}</label><input type="range" data-k="${k}" min="${min}" max="${max}" step="${step || 1}" value="${v}"><span class="dz-v">${v}</span></div>`;
      const ck = (k, l, v) => `<label class="chk dz-ck"><input type="checkbox" data-k="${k}" ${v ? 'checked' : ''}> ${l}</label>`;
      let h = `<div class="dz-h">${o.type === 'text' ? 'النص' : o.type === 'image' ? 'الصورة' : o.type === 'icon' ? 'الرمز' : 'الشكل'} ${o.lock ? '🔒' : ''}</div>
        <div class="dz-row dz-btns"><button class="dz-b" data-x="dup" title="تكرار">⧉</button><button class="dz-b" data-x="del" title="حذف">🗑</button><button class="dz-b" data-x="front" title="إلى الأمام">⤒</button><button class="dz-b" data-x="back" title="إلى الخلف">⤓</button><button class="dz-b" data-x="cx" title="توسيط أفقي">↔</button><button class="dz-b" data-x="cy" title="توسيط عمودي">↕</button><button class="dz-b" data-x="flipX" title="انعكاس أفقي">⇋</button><button class="dz-b" data-x="flipY" title="انعكاس عمودي">⥮</button><button class="dz-b" data-x="lock" title="قفل">${o.lock ? '🔓' : '🔒'}</button></div>`;
      if (o.type === 'text') {
        h += `<textarea class="dz-ta" data-k="text" rows="3">${escH(o.text)}</textarea>
          <div class="dz-row"><select class="dz-s full" data-k="font">${fl.map(x => `<option value="${escH(x)}" ${x === o.font ? 'selected' : ''} style="font-family:'${escH(x)}'">${escH(x)}</option>`).join('')}</select></div>
          ${r('size', 'الحجم', 8, 220, Math.round(o.size))}
          <div class="dz-row dz-btns"><button class="dz-b ${o.bold ? 'on' : ''}" data-tg="bold"><b>B</b></button><button class="dz-b ${o.it ? 'on' : ''}" data-tg="it"><i>I</i></button><button class="dz-b ${o.ul ? 'on' : ''}" data-tg="ul"><u>U</u></button>
            <button class="dz-b ${o.align === 'right' ? 'on' : ''}" data-al="right">⇥</button><button class="dz-b ${(o.align || 'center') === 'center' ? 'on' : ''}" data-al="center">≡</button><button class="dz-b ${o.align === 'left' ? 'on' : ''}" data-al="left">⇤</button><button class="dz-b ${o.dir === 'ltr' ? 'on' : ''}" data-tg="ltr" title="نص لاتيني (يسار → يمين)">Aa→</button></div>
          ${c('color', 'اللون', o.color)}${ck('grad', 'تدرج لوني', !!o.fill2)}${o.fill2 ? c('fill2', 'اللون الثاني', o.fill2) + r('gAng', 'زاوية التدرج', 0, 360, o.gAng || 0) : ''}
          ${r('lh', 'تباعد الأسطر', .8, 2.5, o.lh || 1.3, .05)}
          ${ck('strk', 'حدود الحروف', !!(o.stroke && o.sw))}${o.stroke && o.sw ? c('stroke', 'لون الحدود', o.stroke) + r('sw', 'سمك الحدود', 1, 12, o.sw) : ''}
          ${ck('bx', 'مربع خلفية للنص', !!o.box)}${o.box ? c('box', 'لون المربع', o.box) + r('boxR', 'استدارة', 0, 60, o.boxR || 0) : ''}`;
      } else if (o.type === 'image') {
        h += `<div class="dz-row dz-btns"><button class="dz-b ${o.fit !== 'contain' ? 'on' : ''}" data-fit="cover">ملء الإطار</button><button class="dz-b ${o.fit === 'contain' ? 'on' : ''}" data-fit="contain">الصورة كاملة</button><button class="dz-b" data-x="repl">تغيير الصورة</button></div>
          <div class="dz-h2">تعديل الصورة</div>
          ${r('f.b', 'السطوع', 0, 200, f.b == null ? 100 : f.b)}${r('f.c', 'التباين', 0, 200, f.c == null ? 100 : f.c)}${r('f.s', 'التشبع', 0, 300, f.s == null ? 100 : f.s)}
          ${r('f.blur', 'الضبابية', 0, 20, f.blur || 0)}${r('f.gray', 'أبيض وأسود', 0, 100, f.gray || 0)}${r('f.sepia', 'لون قديم', 0, 100, f.sepia || 0)}${r('f.hue', 'تدوير الألوان', 0, 360, f.hue || 0)}${r('f.inv', 'عكس الألوان', 0, 100, f.inv || 0)}
          <div class="dz-row dz-btns">${[['أصلي', {}], ['أبيض وأسود', { gray: 100, c: 115 }], ['قديم', { sepia: 80, c: 90, b: 105 }], ['زاهي', { s: 170, c: 115 }], ['دافئ', { sepia: 30, s: 130, b: 105 }], ['بارد', { hue: 190, s: 80 }], ['درامي', { c: 160, b: 90, s: 120 }], ['باهت', { s: 50, b: 115, c: 85 }]].map(([n, v], i) => `<button class="dz-b" data-pre="${i}" data-v='${JSON.stringify(v)}'>${n}</button>`).join('')}</div>
          ${ck('circle', 'قناع دائري', !!o.circle)}${r('round', 'زوايا مستديرة', 0, 200, o.round || 0)}
          ${ck('strk', 'إطار', !!(o.stroke && o.sw))}${o.stroke && o.sw ? c('stroke', 'لون الإطار', o.stroke) + r('sw', 'سمك الإطار', 1, 40, o.sw) : ''}`;
      } else if (o.type === 'icon') {
        h += `<div class="dz-row"><label>الرمز</label><input class="dz-s" data-k="text" value="${escH(o.text)}" style="width:80px;font-size:20px"></div>`;
      } else {
        const ln = /line|arc/.test(o.shape);
        h += `<div class="dz-row"><select class="dz-s full" data-k="shape">${Object.keys(SHAPE_NAMES).map(k => `<option value="${k}" ${k === o.shape ? 'selected' : ''}>${SHAPE_NAMES[k]}</option>`).join('')}</select></div>
          ${ln ? '' : `${ck('nofill', 'بدون تعبئة', !o.fill || o.fill === 'none')}${o.fill && o.fill !== 'none' ? c('fill', 'لون التعبئة', o.fill) + ck('grad', 'تدرج لوني', !!o.fill2) + (o.fill2 ? c('fill2', 'اللون الثاني', o.fill2) + r('gAng', 'زاوية التدرج', 0, 360, o.gAng || 0) + ck('rad', 'تدرج دائري', o.gType === 'radial') : '') : ''}`}
          ${c('stroke', ln ? 'لون الخط' : 'لون الحدود', o.stroke || '#000000')}${r('sw', ln ? 'السمك' : 'سمك الحدود', 0, 40, o.sw || 0)}${ln ? '' : ck('dash', 'حدود متقطعة', !!o.dash)}
          ${o.shape === 'round' || o.shape === 'rect' ? r('r', 'استدارة الزوايا', 0, 300, o.r || 0) : ''}${o.shape === 'wave' ? r('waves', 'عدد الموجات', 1, 8, o.waves || 2) : ''}`;
      }
      h += `<div class="dz-h2">عام</div>${r('op', 'الشفافية %', 5, 100, Math.round((o.op == null ? 1 : o.op) * 100))}${r('rot', 'الدوران °', -180, 180, Math.round(o.rot || 0))}
        ${ck('sh', 'ظل', !!o.sh)}${o.sh ? c('shC', 'لون الظل', /^#/.test(o.shC || '') ? o.shC : '#000000') + r('shB', 'نعومة الظل', 0, 60, o.shB == null ? 12 : o.shB) + r('shX', 'إزاحة أفقية', -40, 40, o.shX == null ? 4 : o.shX) + r('shY', 'إزاحة عمودية', -40, 40, o.shY == null ? 4 : o.shY) : ''}
        <div class="dz-row"><label>العرض</label><input class="dz-s" type="number" data-k="w" value="${Math.round(o.w)}" style="width:70px">${o.type !== 'text' ? `<label>الارتفاع</label><input class="dz-s" type="number" data-k="h" value="${Math.round(o.h)}" style="width:70px">` : ''}</div>`;
      pr.innerHTML = h;
      const setK = (k, v) => { if (k.startsWith('f.')) { o.f = o.f || {}; o.f[k.slice(2)] = v; } else o[k] = v; };
      let snapped = false; const sOnce = () => { if (!snapped) { snap(); snapped = true; } };
      pr.querySelectorAll('[data-k]').forEach(el => {
        const k = el.dataset.k, ev = el.type === 'range' || el.type === 'color' || el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type !== 'checkbox') ? 'input' : 'change';
        el.addEventListener(ev, () => {
          sOnce();
          if (el.type === 'checkbox') {
            const on = el.checked;
            if (k === 'grad') { o.fill2 = on ? (o.type === 'text' ? '#d4a52c' : '#ffffff') : ''; if (!o.gAng) o.gAng = 90; }
            else if (k === 'strk') { o.stroke = on ? (o.stroke || '#ffffff') : ''; o.sw = on ? (o.sw || 3) : 0; }
            else if (k === 'bx') { o.box = on ? '#16325f' : ''; if (on) { o.color = o.fill = '#ffffff'; } }
            else if (k === 'nofill') o.fill = on ? 'none' : '#1e88e5';
            else if (k === 'rad') o.gType = on ? 'radial' : '';
            else setK(k, on);
            props(); draw(); return;
          }
          let v = el.value;
          if (el.type === 'range' || el.type === 'number') v = +v;
          if (k === 'op') v = v / 100;
          if (k === 'color') o.fill = v;
          setK(k, v);
          const sp = el.parentElement.querySelector('.dz-v'); if (sp) sp.textContent = el.value;
          if (k === 'shape' || k === 'font') props();
          draw(); if (panelTab === 'lay' && k === 'text') panel();
        });
      });
      pr.querySelectorAll('[data-x]').forEach(b => b.onclick = async () => { if (b.dataset.x === 'repl') { const d = await window.api.openImage(); if (d) { snap(); o.src = d; draw(); } return; } act[b.dataset.x](); });
      pr.querySelectorAll('[data-tg]').forEach(b => b.onclick = () => { snap(); const k = b.dataset.tg; if (k === 'ltr') o.dir = o.dir === 'ltr' ? '' : 'ltr'; else o[k] = !o[k]; props(); draw(); });
      pr.querySelectorAll('[data-al]').forEach(b => b.onclick = () => { snap(); o.align = b.dataset.al; props(); draw(); });
      pr.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { snap(); o.fit = b.dataset.fit; props(); draw(); });
      pr.querySelectorAll('[data-pre]').forEach(b => b.onclick = () => { snap(); o.f = JSON.parse(b.dataset.v); props(); draw(); });
    }

    /* ---- size, zoom, output ---- */
    root.querySelector('#dzSize').onchange = e => {
      const s = SIZES.find(x => x[0] === e.target.value); if (!s) return; snap();
      const sx = s[2] / doc.w, sy = s[3] / doc.h, sc = Math.min(sx, sy);
      doc.objs.forEach(o => { o.x *= sx; o.y *= sy; o.w *= sc; o.h *= sc; if (o.size) o.size *= sc; });
      doc.w = s[2]; doc.h = s[3]; thumbs.clear(); layout(); if (panelTab === 'tpl') panel();
    };
    root.querySelector('#dzZoom').onchange = e => { zMode = e.target.value; layout(); };
    window.addEventListener('resize', layout);
    root.querySelector('#dzName').oninput = e => { name = e.target.value; dirty = true; };
    const fileName = () => String(name || 'تصميم').replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
    const hiRes = () => toCanvas(doc, Math.min(3, 3508 / Math.max(doc.w, doc.h) * (doc.w > 1100 || doc.h > 1200 ? 1 : 1)));
    const exportImg = async kind => {
      await document.fonts.ready;
      const c = hiRes(), u = c.toDataURL(kind === 'jpg' ? 'image/jpeg' : 'image/png', .93);
      const b64 = u.split(',')[1];
      const r = window.api.saveBin ? await window.api.saveBin(b64, fileName() + (kind === 'jpg' ? '.jpg' : '.png')) : null;
      if (r && r.ok) toast('تم حفظ الصورة'); else if (!window.api.saveBin) { const a = document.createElement('a'); a.href = u; a.download = fileName() + '.' + kind; a.click(); }
    };
    const pageHtml = () => {
      const c = hiRes(), u = c.toDataURL('image/png'), land = doc.w > doc.h;
      return { land, html: `<!DOCTYPE html><html><head><meta charset="utf-8"><style>@page{size:A4 ${land ? 'landscape' : 'portrait'};margin:0}html,body{margin:0;padding:0}body{width:${land ? 297 : 210}mm;height:${land ? 210 : 297}mm;display:flex;align-items:center;justify-content:center;overflow:hidden}img{max-width:100%;max-height:100%;display:block;-webkit-print-color-adjust:exact;print-color-adjust:exact}</style></head><body><img src="${u}"></body></html>` };
    };
    const out = async kind => {
      if (typeof LIC !== 'undefined' && !LIC.active) return lockedBox();
      await document.fonts.ready; const p = pageHtml();
      const r = kind === 'print' ? await window.api.print(p.html, p.land) : await window.api.pdf(p.html, p.land, fileName());
      if (r && r.locked) return lockedBox(); if (r && r.ok) toast(kind === 'print' ? 'تم إرسال التصميم إلى الطابعة' : 'تم حفظ الملف PDF');
    };
    root.querySelector('#dzPng').onclick = () => exportImg('png');
    root.querySelector('#dzJpg').onclick = () => exportImg('jpg');
    root.querySelector('#dzPdf').onclick = () => out('pdf');
    root.querySelector('#dzPrint').onclick = () => out('print');
    const save = () => {
      const th = toCanvas(doc, 220 / Math.max(doc.w, doc.h)).toDataURL('image/jpeg', .75);
      const r0 = (rec && DG().find(d => d.id === rec.id)) || null;
      const o = { id: r0 ? r0.id : uid('dz'), name: name || 'تصميم', cat, doc: clone(doc), thumb: th, at: new Date().toISOString() };
      if (r0) Object.assign(r0, o); else { DG().unshift(o); o0.id = o.id; }
      persist(); dirty = false; toast('تم حفظ التصميم في «تصاميمي»'); if (o0.onSaved) o0.onSaved(o);
      return o;
    };
    root.querySelector('#dzSave').onclick = save;
    const close = async () => {
      if (dirty && !(await confirmBox('إغلاق المصمم دون حفظ التصميم؟', 'إغلاق'))) return;
      root.remove(); document.removeEventListener('keydown', key); window.removeEventListener('pointermove', mm); window.removeEventListener('pointerup', mu); window.removeEventListener('resize', layout); redrawHook = null;
      if (o0.onClose) o0.onClose();
    };
    root.querySelector('#dzClose').onclick = close;

    panel(); props();
    requestAnimationFrame(() => { layout(); document.fonts.ready.then(() => draw()); });
    return { root, close, get doc() { return doc; }, select: id => { sel = id; props(); draw(); }, act, save };
  }

  /* ================= «تصاميمي» page (الحياة المدرسية / التهاني) ================= */
  function page(v, arg) {
    arg = arg || {};
    const kudos = arg.cat === 'congrats';
    const list = () => DG().filter(d => !kudos || ['congrats', 'thanks', 'exam'].includes(d.cat));
    const draw = () => {
      const L = list();
      v.innerHTML = `<div class="page-h"><h1>${kudos ? 'تصميم التهاني والشواهد (المصمم الحر)' : 'إعلانات الأنشطة والتصاميم'}</h1><span class="sp"></span>
          <button class="btn pri" id="dzNew">${ic('plus')} تصميم جديد</button></div>
        <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">صمّم إعلانات الأنشطة والملصقات والتهاني والدعوات: أكثر من ${LAYOUTS.length * PAL.length * CATS.length} قالبا جاهزا (${CATS.length} مواضيع)، كل الخطوط، الأشكال والرموز، الصور مع أدوات تعديلها (السطوع، التباين، التشبع، الضبابية، الأبيض والأسود...)، الخلفيات والتدرجات والزخارف، الطبقات، ثم الحفظ صورة PNG أو PDF أو الطباعة مباشرة. يعمل دون إنترنت.</div>
        <div class="sec-t">ابدأ من قالب</div>
        <div class="dz-start">${CATS.filter(c => !kudos || ['congrats', 'thanks', 'exam', 'celeb'].includes(c[0])).map(c => `<button class="card dz-cat" data-cat="${c[0]}"><img src="${toCanvas(template(CATS.indexOf(c) % LAYOUTS.length, CATS.indexOf(c) % PAL.length, c[0]), 120 / 1123).toDataURL('image/jpeg', .7)}"><span>${c[1]}</span></button>`).join('')}</div>
        <div class="sec-t" style="margin-top:16px">تصاميمي (${L.length})</div>
        ${L.length ? `<div class="dz-mine">${L.map(d => `<div class="card dz-my"><img src="${d.thumb}" data-open="${d.id}"><div class="dz-myb"><b>${escH(d.name)}</b><span class="muted">${escH(String(d.at || '').slice(0, 10))}</span>
            <div class="btn-row"><button class="btn sm" data-open="${d.id}">${ic('edit')} فتح</button><button class="btn sm" data-copy="${d.id}">نسخة</button><button class="btn sm danger" data-del="${d.id}">${ic('trash')}</button></div></div></div>`).join('')}</div>`
          : '<div class="empty-state">لا توجد تصاميم محفوظة بعد.</div>'}`;
      const openD = o => open(Object.assign({ onClose: draw, onSaved: () => {} }, o));
      $('#dzNew', v).onclick = () => openD({ cat: kudos ? 'congrats' : 'activity', doc: { w: 794, h: 1123, bg: { t: 'solid', c1: '#ffffff' }, objs: [] } });
      $$('[data-cat]', v).forEach(b => b.onclick = () => openD({ cat: b.dataset.cat, doc: template(CATS.findIndex(c => c[0] === b.dataset.cat) % LAYOUTS.length, 0, b.dataset.cat) }));
      $$('[data-open]', v).forEach(b => b.onclick = () => openD({ id: b.dataset.open }));
      $$('[data-copy]', v).forEach(b => b.onclick = () => { const d = DG().find(x => x.id === b.dataset.copy); if (!d) return; const c = clone(d); c.id = uid('dz'); c.name = d.name + ' (نسخة)'; c.at = new Date().toISOString(); DG().unshift(c); persist(); draw(); });
      $$('[data-del]', v).forEach(b => b.onclick = async () => { if (!(await confirmBox('حذف هذا التصميم نهائيا؟', 'حذف'))) return; DB.designs = DG().filter(x => x.id !== b.dataset.del); persist(); draw(); });
    };
    draw();
  }

  const style = document.createElement('style');
  style.textContent = `
  .dz-root{position:fixed;inset:0;z-index:95;background:#e9eeec;display:flex;flex-direction:column;direction:rtl}
  .dz-top{display:flex;align-items:center;gap:6px;padding:7px 10px;background:#2b2140;color:#fff;flex-wrap:wrap}.dz-top .btn{background:#fff;color:#222;border-color:#fff}.dz-top .btn.pri{background:#f0c84b;border-color:#f0c84b}
  .dz-name{height:30px;border:0;border-radius:6px;padding:0 8px;width:190px;font-family:inherit;color:#222;background:#fff}.dz-top .dz-s{color:#222}
  .dz-b{min-width:30px;height:30px;padding:0 7px;border:1px solid #d4dcd8;border-radius:6px;background:#fafbfa;cursor:pointer;font-size:13.5px;color:#222;font-family:inherit}.dz-b:hover{background:#ede7f8}.dz-b.on{background:#ddd1f5;border-color:#5b2a86}
  .dz-top .dz-b{background:#3d3159;color:#fff;border-color:#55487a}
  .dz-s{height:30px;border:1px solid #d4dcd8;border-radius:6px;padding:0 4px;font-size:13px;background:#fff;font-family:inherit}.dz-s.full{width:100%}
  .dz-main{flex:1;min-height:0;display:flex}
  .dz-side{width:300px;background:#fff;border-left:1px solid #d7dfdb;display:flex;flex-direction:column;min-height:0}
  .dz-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:2px;padding:6px;border-bottom:1px solid #e4e9e6}.dz-tabs button{border:0;background:#f3f1f8;border-radius:6px;padding:6px 2px;font-size:12px;cursor:pointer;font-family:inherit}.dz-tabs button.on{background:#5b2a86;color:#fff}
  .dz-panel{flex:1;overflow:auto;padding:8px 10px}
  .dz-props{width:270px;background:#fff;border-right:1px solid #d7dfdb;overflow:auto;padding:8px 10px}
  .dz-stage{flex:1;overflow:auto;display:flex;align-items:flex-start;justify-content:center;padding:20px}.dz-wrap{position:relative;box-shadow:0 4px 24px rgba(0,0,0,.25);margin:auto}.dz-wrap canvas{display:block;cursor:default;background:#fff;touch-action:none}
  .dz-edit{position:absolute;background:rgba(255,255,255,.85);border:1px dashed #1a8cff;outline:none;resize:none;padding:0;transform-origin:center;overflow:hidden}
  .dz-h{font-weight:700;font-size:12.5px;color:#3d2a5c;margin:10px 0 6px}.dz-h2{font-weight:700;font-size:12px;color:#5b2a86;margin:10px 0 4px;border-top:1px solid #eee;padding-top:6px}
  .dz-note{font-size:11.8px;color:#5e6b66;line-height:1.75;margin:6px 0}
  .dz-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px}.dz-tp{border:1px solid #dcd6e8;border-radius:6px;padding:2px;background:#fff;cursor:pointer}.dz-tp img{width:100%;display:block;border-radius:4px}.dz-tp:hover{border-color:#5b2a86;box-shadow:0 0 0 2px #e3d6f5}
  .dz-chips{display:flex;flex-wrap:wrap;gap:4px}.dz-chips button{border:1px solid #d4dcd8;background:#fff;border-radius:14px;padding:2px 9px;cursor:pointer;font-size:12px;font-family:inherit}.dz-chips button.on{background:#5b2a86;color:#fff;border-color:#5b2a86}
  .dz-shapes{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}.dz-shapes button{border:1px solid #e1e6e3;background:#fff;border-radius:6px;padding:2px;cursor:pointer}
  .dz-icons{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}.dz-icons button{border:0;background:#f6f6f8;border-radius:6px;font-size:21px;padding:3px 0;cursor:pointer}.dz-icons button:hover{background:#ede7f8}
  .dz-tx{display:block;width:100%;text-align:center;border:1px solid #e1e6e3;background:#fff;border-radius:7px;padding:8px;margin-bottom:5px;cursor:pointer;color:#16325f}
  .dz-sw{display:grid;grid-template-columns:repeat(8,1fr);gap:4px}.dz-sw button,.dz-cp{height:28px;border:1px solid #ccc;border-radius:6px;cursor:pointer;position:relative;display:flex;align-items:center;justify-content:center}.dz-cp input{position:absolute;inset:0;opacity:0;cursor:pointer}
  .dz-row{display:flex;align-items:center;gap:6px;margin:5px 0;font-size:12.3px}.dz-row label{min-width:72px;color:#3b4a45}.dz-row input[type=range]{flex:1}.dz-row input[type=color]{width:44px;height:26px;border:1px solid #ccc;border-radius:5px;padding:0}.dz-v{min-width:28px;font-size:11px;color:#666}
  .dz-btns{flex-wrap:wrap;gap:3px}.dz-ck{display:flex;margin:6px 0;font-size:12.3px}.dz-ta{width:100%;border:1px solid #d4dcd8;border-radius:6px;padding:6px;font-family:inherit;font-size:14px;box-sizing:border-box}
  .dz-ly{display:flex;align-items:center;gap:4px;border:1px solid #e4e9e6;border-radius:6px;padding:4px 6px;margin-bottom:3px;cursor:pointer;font-size:12.3px}.dz-ly span{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.dz-ly button{border:0;background:none;cursor:pointer}.dz-ly.on{border-color:#5b2a86;background:#f4effb}
  .dz-start{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}.dz-cat{padding:6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line)}.dz-cat img{width:100%;border-radius:4px}.dz-cat span{font-size:12.5px;font-weight:700}
  @media (max-width:900px){.dz-main{flex-direction:column;overflow:auto}.dz-side{width:auto;height:40vh;flex:none;border:0;border-top:1px solid #d7dfdb;order:3}.dz-props{width:auto;height:30vh;flex:none;order:2;border:0;border-top:1px solid #d7dfdb}.dz-stage{order:1;padding:8px;flex:none;height:52vh}.dz-tabs{grid-template-columns:repeat(6,1fr)}.dz-name{width:120px}}
  .dz-mine{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.dz-my{padding:6px}.dz-my img{width:100%;height:170px;object-fit:contain;background:#f3f4f3;border-radius:6px;cursor:pointer}.dz-myb{display:flex;flex-direction:column;gap:3px;padding-top:5px;font-size:12.5px}`;
  document.head.appendChild(style);

  window.Designer = { open, page, template, toCanvas, render, CATS, PAL, LAYOUTS, SIZES };
  window.pageFlyers = (v, a) => page(v, a);
})();
