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
   - 1.9.4: مكتبة صور ورسوم مضمنة، أوضاع المزج، إزالة الخلفية، القص، الحدة، التحبيب، تبسيط الألوان، الفسيفساء، الصبغة، تظليل الأطراف،
     تلاشي الحواف، حد الملصق، الرسم الحر، القطارة، الشبكة، النص المقوس والمجوف، نسخ / لصق النمط، علامة مائية، PNG شفاف.
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

  /* 1.9.4 — vector pictures drawn in the program (crisp at any size) */
  const SVGU = s => 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">${s}</svg>`);
  const GOLD = '<defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe9a0"/><stop offset=".55" stop-color="#e2b33c"/><stop offset="1" stop-color="#b07a12"/></linearGradient></defs>';
  const starP = (cx, cy, r, r2, n) => { let d = ''; for (let i = 0; i < n * 2; i++) { const rr = i % 2 ? r2 : r, a = -Math.PI / 2 + i * Math.PI / n; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ' ' + (cy + rr * Math.sin(a)).toFixed(1); } return d + 'Z'; };
  const CLIP = [
    ['كأس التتويج', 'prize', GOLD + '<path d="M58 28h84v42c0 32-19 50-42 54-23-4-42-22-42-54z" fill="url(#g)" stroke="#8a5d0b" stroke-width="4"/><path d="M60 40H32c0 28 13 40 32 42M140 40h28c0 28-13 40-32 42" fill="none" stroke="#c8901a" stroke-width="8" stroke-linecap="round"/><rect x="89" y="122" width="22" height="26" fill="#c8901a"/><rect x="60" y="148" width="80" height="20" rx="4" fill="#6b3f12"/><rect x="72" y="168" width="56" height="12" rx="3" fill="#8a5d0b"/><path d="' + starP(100, 66, 20, 9, 5) + '" fill="#fff8d0"/>'],
    ['ميدالية ذهبية', 'prize', GOLD + '<path d="M62 8h28l26 70H88zM138 8h-28l-26 70h28z" fill="#c0392b"/><path d="M70 8h12l26 70H96zM130 8h-12l-26 70h12z" fill="#1e88e5"/><circle cx="100" cy="128" r="58" fill="url(#g)" stroke="#8a5d0b" stroke-width="5"/><circle cx="100" cy="128" r="44" fill="none" stroke="#fff3c4" stroke-width="3"/><path d="' + starP(100, 128, 30, 13, 5) + '" fill="#fff8d0" stroke="#b07a12" stroke-width="2"/>'],
    ['وسام / شارة', 'prize', '<path d="M70 120l-24 70 30-14 16 26 18-74zM130 120l24 70-30-14-16 26-18-74z" fill="#16325f"/><path d="' + starP(100, 88, 78, 64, 16) + '" fill="#d4a52c"/><circle cx="100" cy="88" r="54" fill="#fff" stroke="#d4a52c" stroke-width="5"/><path d="' + starP(100, 88, 34, 15, 5) + '" fill="#d4a52c"/>'],
    ['إكليل الغار', 'prize', '<g fill="#3a8a3a">' + Array.from({ length: 9 }, (_, i) => { const a = (200 - i * 17) * Math.PI / 180, x = 100 + 70 * Math.cos(a), y = 105 + 70 * Math.sin(a); return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="16" ry="7" transform="rotate(${(200 - i * 17 + 60).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/><ellipse cx="${(200 - x).toFixed(1)}" cy="${y.toFixed(1)}" rx="16" ry="7" transform="rotate(${(-(200 - i * 17 + 60)).toFixed(0)} ${(200 - x).toFixed(1)} ${y.toFixed(1)})"/>`; }).join('') + '</g><path d="M80 178q20-14 40 0" stroke="#c0392b" stroke-width="8" fill="none" stroke-linecap="round"/>'],
    ['قبعة التخرج', 'school', '<path d="M100 40L10 82l90 42 90-42z" fill="#1b1b1b"/><path d="M50 102v40c0 14 100 14 100 0v-40l-50 24z" fill="#2b2b2b"/><path d="M178 88v52" stroke="#d4a52c" stroke-width="5"/><circle cx="178" cy="146" r="8" fill="#d4a52c"/>'],
    ['كتاب مفتوح', 'school', '<path d="M100 52C74 34 40 32 14 40v118c26-8 60-6 86 12z" fill="#1e88e5"/><path d="M100 52c26-18 60-20 86-12v118c-26-8-60-6-86 12z" fill="#1565c0"/><path d="M100 60C78 46 50 44 26 50v100c24-6 52-4 74 8zM100 60c22-14 50-16 74-10v100c-24-6-52-4-74 8z" fill="#fff"/><path d="M40 72h44M40 88h44M40 104h44M40 120h36M116 72h44M116 88h44M116 104h44M116 120h36" stroke="#9fb8d8" stroke-width="4"/><path d="M100 60v108" stroke="#0d3c66" stroke-width="3"/>'],
    ['قلم رصاص', 'school', '<g transform="rotate(-40 100 100)"><rect x="30" y="84" width="118" height="32" fill="#f7c331"/><rect x="30" y="84" width="118" height="11" fill="#ffd95a"/><rect x="18" y="84" width="16" height="32" rx="4" fill="#ef6fa4"/><rect x="32" y="84" width="10" height="32" fill="#b0b8c1"/><path d="M148 84l34 16-34 16z" fill="#f3d3a6"/><path d="M170 94l12 6-12 6z" fill="#333"/></g>'],
    ['المسطرة والكوس', 'school', '<rect x="20" y="120" width="160" height="34" rx="4" fill="#f7c331" stroke="#b8860b" stroke-width="3"/>' + Array.from({ length: 15 }, (_, i) => `<path d="M${30 + i * 10} 120v${i % 2 ? 9 : 16}" stroke="#7a5a00" stroke-width="2"/>`).join('') + '<path d="M40 104V24l90 80z" fill="#7cc5a6" fill-opacity=".85" stroke="#0e5a4a" stroke-width="4"/><path d="M58 86V64l24 22z" fill="#fff"/>'],
    ['المدرسة', 'school', '<path d="M20 90L100 40l80 50" fill="#b3202a"/><rect x="34" y="86" width="132" height="90" fill="#fdf2e0" stroke="#8a5a2b" stroke-width="3"/><rect x="86" y="128" width="28" height="48" fill="#8a5a2b"/>' + [48, 128].map(x => `<rect x="${x}" y="104" width="24" height="22" fill="#9fd3f2" stroke="#8a5a2b" stroke-width="2"/>`).join('') + '<circle cx="100" cy="100" r="11" fill="#fff" stroke="#8a5a2b" stroke-width="3"/><path d="M100 18v24" stroke="#555" stroke-width="3"/><path d="M100 18h26l-6 7 6 7h-26z" fill="#c1272d"/>'],
    ['الجرس', 'school', GOLD + '<path d="M100 26c-32 0-50 28-50 62v34l-16 22h132l-16-22V88c0-34-18-62-50-62z" fill="url(#g)" stroke="#8a5d0b" stroke-width="4"/><circle cx="100" cy="162" r="14" fill="#b07a12"/><rect x="92" y="14" width="16" height="16" rx="5" fill="#b07a12"/>'],
    ['بالونات', 'party', [['#e53935', 64, 70], ['#1e88e5', 104, 52], ['#43a047', 140, 78], ['#fdd835', 92, 96]].map(([c, x, y]) => `<path d="M${x} ${y + 36}q-6 30 6 60" stroke="#777" stroke-width="2" fill="none"/><ellipse cx="${x}" cy="${y}" rx="26" ry="32" fill="${c}"/><ellipse cx="${x - 9}" cy="${y - 12}" rx="6" ry="10" fill="#fff" fill-opacity=".5"/><path d="M${x - 5} ${y + 33}h10l-5 6z" fill="${c}"/>`).join('')],
    ['هدية', 'party', '<rect x="30" y="80" width="140" height="100" rx="6" fill="#e53935"/><rect x="22" y="62" width="156" height="30" rx="5" fill="#ef5350"/><rect x="90" y="62" width="20" height="118" fill="#fdd835"/><path d="M100 62c-30-36-60-14-40 0zM100 62c30-36 60-14 40 0z" fill="none" stroke="#fdd835" stroke-width="9"/>'],
    ['قصاصات الاحتفال', 'party', Array.from({ length: 34 }, (_, i) => { const x = (i * 53) % 190 + 5, y = (i * 37) % 190 + 5, c = ['#e53935', '#1e88e5', '#fdd835', '#43a047', '#8e24aa', '#fb8c00'][i % 6]; return i % 3 ? `<rect x="${x}" y="${y}" width="9" height="5" fill="${c}" transform="rotate(${i * 29} ${x} ${y})"/>` : `<circle cx="${x}" cy="${y}" r="4" fill="${c}"/>`; }).join('')],
    ['الهلال والنجمة', 'religion', GOLD + '<path d="M120 30a72 72 0 1 0 0 140a58 58 0 1 1 0-140z" fill="url(#g)"/><path d="' + starP(150, 74, 22, 9, 5) + '" fill="url(#g)"/>'],
    ['فانوس رمضان', 'religion', GOLD + '<path d="M100 10v18" stroke="#8a5d0b" stroke-width="5"/><circle cx="100" cy="12" r="7" fill="none" stroke="#8a5d0b" stroke-width="4"/><path d="M70 40h60l-10-12H80z" fill="url(#g)"/><path d="M66 40h68l14 40-14 70H66L52 80z" fill="#fff3c4" stroke="url(#g)" stroke-width="8"/><path d="M100 40v110M60 80h80" stroke="#c8901a" stroke-width="5"/><path d="M66 150h68l-8 18H74z" fill="url(#g)"/><circle cx="100" cy="98" r="14" fill="#ffd54f" fill-opacity=".8"/>'],
    ['علم المغرب', 'nation', '<rect x="10" y="40" width="180" height="120" fill="#c1272d"/><path d="M100 66l14 44-38-27h48l-38 27z" fill="none" stroke="#006233" stroke-width="5" stroke-linejoin="round"/>'],
    ['شجرة', 'nature', '<rect x="90" y="118" width="20" height="60" rx="4" fill="#7a4b22"/><circle cx="100" cy="80" r="50" fill="#43a047"/><circle cx="66" cy="104" r="30" fill="#388e3c"/><circle cx="134" cy="104" r="30" fill="#388e3c"/><circle cx="100" cy="56" r="30" fill="#66bb6a"/>'],
    ['شمس', 'nature', '<circle cx="100" cy="100" r="44" fill="#fdd835"/>' + Array.from({ length: 12 }, (_, i) => `<path d="M100 28v-18" stroke="#fb8c00" stroke-width="8" stroke-linecap="round" transform="rotate(${i * 30} 100 100)"/>`).join('')],
    ['كرة القدم', 'sport', '<circle cx="100" cy="100" r="80" fill="#fff" stroke="#222" stroke-width="5"/><path d="' + starP(100, 100, 26, 26, 5).replace(/L/g, 'L') + '" fill="#222"/>' + [0, 72, 144, 216, 288].map(a => `<path d="M100 74L100 30" stroke="#222" stroke-width="4" transform="rotate(${a} 100 100)"/><path d="M100 22l-16 8 4 18h24l4-18z" fill="#222" transform="rotate(${a + 36} 100 100) translate(0 -2)"/>`).join('')],
    ['لوحة الألوان', 'arts', '<path d="M100 22c-50 0-84 34-84 76 0 34 26 56 52 52 16-2 14-20 26-22 14-2 18 16 36 14 32-4 54-30 54-58 0-36-38-62-84-62z" fill="#f3d3a6" stroke="#8a5a2b" stroke-width="4"/><circle cx="62" cy="70" r="13" fill="#e53935"/><circle cx="98" cy="54" r="13" fill="#fdd835"/><circle cx="136" cy="64" r="13" fill="#1e88e5"/><circle cx="156" cy="98" r="13" fill="#43a047"/><circle cx="52" cy="108" r="11" fill="#8e24aa"/>'],
    ['نوتة موسيقية', 'arts', '<path d="M76 150V50l90-20v100" stroke="#5b2a86" stroke-width="10" fill="none"/><path d="M76 50l90-20v22l-90 20z" fill="#5b2a86"/><ellipse cx="58" cy="152" rx="24" ry="17" fill="#5b2a86" transform="rotate(-18 58 152)"/><ellipse cx="148" cy="132" rx="24" ry="17" fill="#5b2a86" transform="rotate(-18 148 132)"/>'],
    ['زاوية مزخرفة', 'frame', '<path d="M10 190V40Q10 10 40 10h150" fill="none" stroke="#b8860b" stroke-width="7"/><path d="M26 190V48q0-22 22-22h142" fill="none" stroke="#b8860b" stroke-width="3"/><path d="M40 40q30 10 30 40q-30-6-30-40zM40 40q10 30 40 30q-6-30-40-30z" fill="#b8860b"/><circle cx="40" cy="40" r="7" fill="#7a5a00"/>'],
    ['فاصل زخرفي', 'frame', '<path d="M10 100h70M120 100h70" stroke="#16325f" stroke-width="5" stroke-linecap="round"/><path d="' + starP(100, 100, 20, 9, 8) + '" fill="#d4a52c"/><circle cx="70" cy="100" r="6" fill="#16325f"/><circle cx="130" cy="100" r="6" fill="#16325f"/>'],
    ['زليج مغربي', 'frame', '<rect width="200" height="200" fill="#0e5a4a"/><path d="' + starP(100, 100, 92, 68, 8) + '" fill="#f6f1e3"/><path d="' + starP(100, 100, 60, 44, 8) + '" fill="#b3202a"/><path d="' + starP(100, 100, 30, 22, 8) + '" fill="#d4a52c"/>'],
    ['فقاعة كلام', 'misc', '<path d="M30 30h140a16 16 0 0 1 16 16v80a16 16 0 0 1-16 16H90l-36 34 6-34H30a16 16 0 0 1-16-16V46a16 16 0 0 1 16-16z" fill="#fff" stroke="#16325f" stroke-width="6"/>'],
    ['مصباح الفكرة', 'misc', '<path d="M100 22c-34 0-58 26-58 56 0 22 12 34 24 46 6 6 8 14 8 22h52c0-8 2-16 8-22 12-12 24-24 24-46 0-30-24-56-58-56z" fill="#fdd835" stroke="#b8860b" stroke-width="4"/><rect x="74" y="150" width="52" height="12" rx="3" fill="#90a4ae"/><rect x="78" y="164" width="44" height="12" rx="3" fill="#78909c"/><path d="M86 120l14-34 14 34" stroke="#b8860b" stroke-width="4" fill="none"/>']
  ];
  const CLIP_CATS = [['prize', 'جوائز وتتويج'], ['school', 'مدرسة وتعليم'], ['party', 'احتفالات'], ['religion', 'مناسبات دينية'], ['nation', 'وطني'], ['nature', 'طبيعة'], ['sport', 'رياضة'], ['arts', 'فنون'], ['frame', 'زخارف وإطارات'], ['misc', 'متفرقة']];
  const ASSET_CATS = { kids: 'أطفال', deco: 'زخرفة', frame: 'زخارف وإطارات', bg: 'خلفيات', text: 'عبارات بالخط العربي', tech: 'تكنولوجيا', arts: 'فنون', road: 'السلامة الطرقية' };
  let GAL = null;
  const gallery = () => GAL || (GAL = CLIP.map(([n, c, s]) => ({ n, c, src: SVGU(s), vec: 1 })).concat((window.DZ_ASSETS || []).map(a => Object.assign({}, a))));
  const galCats = () => { const seen = new Map(); gallery().forEach(g => { if (!seen.has(g.c)) seen.set(g.c, (CLIP_CATS.find(x => x[0] === g.c) || [])[1] || ASSET_CATS[g.c] || g.c); }); return Array.from(seen); };
  /* 1.9.4 — pixel effects of a picture (computed once, kept in memory): crop, background removal, sharpening, pixels, posterize,
     grain, colour wash, vignette, faded edges, sticker outline */
  const fxCache = new Map();
  const hexRgb = h => { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); const n = m ? parseInt(m[1], 16) : 0; return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  function fxImage(o, im) {
    const f = o.f || {};
    const crop = (f.ct || 0) + (f.cb || 0) + (f.cl || 0) + (f.cr || 0) > 0;
    if (!crop && !f.rmbg && !f.sharp && !f.pix && !f.post && !f.noise && !f.outl && !f.fade && !f.tint && !f.vig) return im;
    const key = [o.src.length, o.src.slice(-48), f.ct, f.cb, f.cl, f.cr, f.rmbg, f.sharp, f.pix, f.post, f.noise, f.outl, f.outlC, f.fade, f.fadeA, f.tint, f.tintC, f.vig].join('|');
    if (fxCache.has(key)) return fxCache.get(key);
    const W0 = im.naturalWidth || im.width, H0 = im.naturalHeight || im.height;
    const sx = W0 * (f.cl || 0) / 100, sy = H0 * (f.ct || 0) / 100, sw = Math.max(4, W0 * (1 - ((f.cl || 0) + (f.cr || 0)) / 100)), sh = Math.max(4, H0 * (1 - ((f.ct || 0) + (f.cb || 0)) / 100));
    const k = Math.min(1, 1600 / Math.max(sw, sh)), w = Math.max(1, Math.round(sw * k)), h = Math.max(1, Math.round(sh * k));
    let c = document.createElement('canvas'); c.width = w; c.height = h;
    let x = c.getContext('2d');
    x.drawImage(im, sx, sy, sw, sh, 0, 0, w, h);
    try {
      if (f.rmbg || f.sharp || f.post || f.noise) {
        const D = x.getImageData(0, 0, w, h), d = D.data;
        if (f.rmbg) { // the colour of the borders spreads inward (flood fill) and becomes transparent
          const tol = f.rmbg * 2.2, seen = new Uint8Array(w * h), q = [];
          const corner = (i) => [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
          const refs = [corner(0), corner(w - 1), corner((h - 1) * w), corner(h * w - 1)];
          const near = i => refs.some(r => Math.abs(d[i * 4] - r[0]) + Math.abs(d[i * 4 + 1] - r[1]) + Math.abs(d[i * 4 + 2] - r[2]) <= tol);
          for (let i = 0; i < w; i++) { q.push(i, (h - 1) * w + i); } for (let j = 0; j < h; j++) { q.push(j * w, j * w + w - 1); }
          while (q.length) { const i = q.pop(); if (seen[i]) continue; seen[i] = 1; if (!near(i)) continue; d[i * 4 + 3] = 0; const xx = i % w; if (xx > 0) q.push(i - 1); if (xx < w - 1) q.push(i + 1); if (i >= w) q.push(i - w); if (i < w * (h - 1)) q.push(i + w); }
          // soft edge: half-transparent pixels next to the removed ones
          for (let i = 0; i < w * h; i++) if (d[i * 4 + 3] && ((i % w > 0 && !d[(i - 1) * 4 + 3]) || (i % w < w - 1 && !d[(i + 1) * 4 + 3]) || (i >= w && !d[(i - w) * 4 + 3]) || (i < w * (h - 1) && !d[(i + w) * 4 + 3]))) d[i * 4 + 3] = 140;
        }
        if (f.post) { const n = Math.max(2, 10 - Math.round(f.post / 12)), st = 255 / (n - 1); for (let i = 0; i < d.length; i += 4) for (let j = 0; j < 3; j++) d[i + j] = Math.round(Math.round(d[i + j] / st) * st); }
        if (f.noise) { const a = f.noise * 1.2; for (let i = 0; i < d.length; i += 4) { const r = (Math.random() - .5) * a; d[i] += r; d[i + 1] += r; d[i + 2] += r; } }
        if (f.sharp) { const a = f.sharp / 100, s = new Uint8ClampedArray(d); for (let j = 1; j < h - 1; j++) for (let i = 1; i < w - 1; i++) { const p = (j * w + i) * 4; for (let ch = 0; ch < 3; ch++) d[p + ch] = s[p + ch] * (1 + 4 * a) - a * (s[p + ch - 4] + s[p + ch + 4] + s[p + ch - w * 4] + s[p + ch + w * 4]); } }
        x.putImageData(D, 0, 0);
      }
      if (f.pix) { const n = Math.max(2, Math.round(Math.max(w, h) / (f.pix * 3 + 6))), t = document.createElement('canvas'); t.width = Math.max(1, Math.round(w / Math.max(w, h) * n)); t.height = Math.max(1, Math.round(h / Math.max(w, h) * n)); t.getContext('2d').drawImage(c, 0, 0, t.width, t.height); x.clearRect(0, 0, w, h); x.imageSmoothingEnabled = false; x.drawImage(t, 0, 0, w, h); x.imageSmoothingEnabled = true; }
      if (f.tint) { x.save(); x.globalCompositeOperation = 'source-atop'; x.globalAlpha = f.tint / 100; x.fillStyle = f.tintC || '#1e88e5'; x.fillRect(0, 0, w, h); x.restore(); }
      if (f.vig) { x.save(); x.globalCompositeOperation = 'source-atop'; const g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * .25, w / 2, h / 2, Math.max(w, h) * .72); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, `rgba(0,0,0,${(f.vig / 100).toFixed(2)})`); x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore(); }
      if (f.fade) { // faded edges (a soft mask)
        const a = Math.max(.05, Math.min(.9, (f.fadeA || 35) / 100)); x.save(); x.globalCompositeOperation = 'destination-in';
        let g;
        if (f.fade === 'all') { g = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * (.5 - a / 2), w / 2, h / 2, Math.max(w, h) * .62); g.addColorStop(0, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
        else { const v = { b: [0, 0, 0, h], t: [0, h, 0, 0], l: [w, 0, 0, 0], r: [0, 0, w, 0] }[f.fade] || [0, 0, 0, h]; g = x.createLinearGradient(...v); g.addColorStop(0, '#000'); g.addColorStop(1 - a, '#000'); g.addColorStop(1, 'rgba(0,0,0,0)'); }
        x.fillStyle = g; x.fillRect(0, 0, w, h); x.restore();
      }
      if (f.outl) { // sticker: a coloured outline around the shape of the picture (transparent pictures)
        const p = Math.round(f.outl * Math.max(w, h) / 400) + 1, o2 = document.createElement('canvas'); o2.width = w + p * 2; o2.height = h + p * 2;
        const sil = document.createElement('canvas'); sil.width = w; sil.height = h; const sx2 = sil.getContext('2d'); sx2.drawImage(c, 0, 0); sx2.globalCompositeOperation = 'source-in'; sx2.fillStyle = f.outlC || '#ffffff'; sx2.fillRect(0, 0, w, h);
        const ox = o2.getContext('2d'); for (let i = 0; i < 24; i++) { const a2 = i / 24 * Math.PI * 2; ox.drawImage(sil, p + Math.cos(a2) * p, p + Math.sin(a2) * p); }
        ox.drawImage(c, p, p); c = o2; x = ox;
      }
    } catch (_) { /* a picture that cannot be read pixel by pixel keeps its other effects */ }
    if (fxCache.size > 40) fxCache.delete(fxCache.keys().next().value);
    fxCache.set(key, c); return c;
  }
  const BLENDS = [['', 'عادي'], ['multiply', 'ضرب (Multiply)'], ['screen', 'تفتيح (Screen)'], ['overlay', 'تراكب (Overlay)'], ['soft-light', 'ضوء ناعم'], ['hard-light', 'ضوء قوي'], ['darken', 'تعتيم'], ['lighten', 'إضاءة'], ['color-dodge', 'تفادي الألوان'], ['color-burn', 'حرق الألوان'], ['difference', 'فرق'], ['exclusion', 'استبعاد'], ['hue', 'تدرج اللون'], ['saturation', 'التشبع'], ['color', 'اللون'], ['luminosity', 'الإضاءة']];

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
    if (o.blend) ctx.globalCompositeOperation = o.blend; // 1.9.4: blending modes (Photoshop)
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
      ctx.fillStyle = o.hollow ? 'transparent' : paintFill(ctx, o, o.w, o.h);
      // 1.9.4: text on a curve (each word follows the arc, so the Arabic letters stay joined)
      if (o.curve && lines.length) {
        const all = lines.join(' ').trim(), ltr = o.dir === 'ltr', many = all.split(/\s+/).length > 1, parts = many || !ltr ? all.split(/\s+/) : Array.from(all);
        const sp = many || !ltr ? ctx.measureText(' ').width : 0, ws = parts.map(t => ctx.measureText(t).width), W = Math.max(1, ws.reduce((a, b) => a + b, 0) + sp * (parts.length - 1));
        const A = o.curve * Math.PI / 180, sg = A > 0 ? 1 : -1, R = W / Math.abs(A), sag = R - R * Math.cos(Math.abs(A) / 2);
        ctx.textAlign = 'center'; let u = 0;
        o.h = Math.max(o.size * 1.4, sag + o.size * 1.4);
        parts.forEach((t, i) => {
          const c = u + ws[i] / 2, th = (ltr ? c - W / 2 : W / 2 - c) / R;
          ctx.save(); ctx.translate(R * Math.sin(th), sg * (R - R * Math.cos(th)) - sg * sag / 2); ctx.rotate(sg * th);
          if (o.stroke && o.sw > 0) { ctx.save(); ctx.shadowColor = 'transparent'; ctx.lineJoin = 'round'; ctx.lineWidth = o.sw * 2; ctx.strokeStyle = o.stroke; ctx.strokeText(t, 0, 0); ctx.restore(); }
          if (!o.hollow) ctx.fillText(t, 0, 0);
          ctx.restore(); u += ws[i] + sp;
        });
        ctx.restore(); return;
      }
      lines.forEach((ln, i) => {
        const y = -o.h / 2 + lh * (i + .5);
        if (o.stroke && o.sw > 0) { ctx.save(); ctx.shadowColor = 'transparent'; ctx.lineJoin = 'round'; ctx.lineWidth = o.sw * 2; ctx.strokeStyle = o.stroke; ctx.strokeText(ln, x, y); ctx.restore(); }
        if (!o.hollow) ctx.fillText(ln, x, y);
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
        const pic = fxImage(o, im), NW = pic.naturalWidth || pic.width, NH = pic.naturalHeight || pic.height;
        // «cover»: the picture fills the frame (cropped), «contain»: whole picture
        const r = NW / NH, R = w / h;
        if (o.fit === 'contain') { const dw = r > R ? w : h * r, dh = r > R ? w / r : h; ctx.drawImage(pic, -dw / 2, -dh / 2, dw, dh); }
        else { let sw = NW, sh = NH, sx = 0, sy = 0; if (r > R) { sw = sh * R; sx = (NW - sw) / 2; } else { sh = sw / R; sy = (NH - sh) / 2; } ctx.drawImage(pic, sx, sy, sw, sh, -w / 2, -h / 2, w, h); }
      } else if (!forExport) { ctx.fillStyle = '#e6ecea'; ctx.fillRect(-w / 2, -h / 2, w, h); }
      ctx.restore();
      if (o.stroke && o.sw > 0) { ctx.beginPath(); if (o.circle) ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); else roundRect(ctx, -w / 2, -h / 2, w, h, o.round || 0); strokeIt(); }
    } else if (o.type === 'path') { // 1.9.4: free drawing (brush)
      const P = o.pts || [];
      if (P.length > 1) {
        ctx.beginPath(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = o.sw || 6; ctx.strokeStyle = o.stroke || '#16325f';
        const X = q => q[0] * w, Y = q => q[1] * h;
        ctx.moveTo(X(P[0]), Y(P[0])); for (let i = 1; i < P.length - 1; i++) ctx.quadraticCurveTo(X(P[i]), Y(P[i]), (X(P[i]) + X(P[i + 1])) / 2, (Y(P[i]) + Y(P[i + 1])) / 2);
        ctx.lineTo(X(P[P.length - 1]), Y(P[P.length - 1])); ctx.stroke();
      }
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
          <div class="dz-tabs">${[['tpl', '🧩 القوالب'], ['el', '🔷 العناصر'], ['txt', '🅰 النصوص'], ['img', '🖼 الصور'], ['bg', '🎨 الخلفية'], ['tools', '🛠 أدوات احترافية'], ['lay', '🗂 الطبقات']].map(([k, l], i) => `<button data-t="${k}" class="${i ? '' : 'on'}">${l}</button>`).join('')}</div>
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
      if (grid.on) { ctx.save(); ctx.strokeStyle = 'rgba(26,140,255,.22)'; ctx.lineWidth = 1 / zoom; for (let x = grid.s; x < doc.w; x += grid.s) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, doc.h); ctx.stroke(); } for (let y = grid.s; y < doc.h; y += grid.s) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(doc.w, y); ctx.stroke(); } ctx.restore(); }
      if (stroke && stroke.length > 1) { ctx.save(); ctx.globalAlpha = brush.op; ctx.lineCap = ctx.lineJoin = 'round'; ctx.lineWidth = brush.sw; ctx.strokeStyle = brush.c; ctx.beginPath(); stroke.forEach(([x, y], i) => ctx[i ? 'lineTo' : 'moveTo'](x, y)); ctx.stroke(); ctx.restore(); }
      if (guides.x || guides.y) { ctx.save(); ctx.strokeStyle = '#ff2d7a'; ctx.lineWidth = 1 / zoom; ctx.setLineDash([6 / zoom, 4 / zoom]); if (guides.x) { ctx.beginPath(); ctx.moveTo(doc.w / 2, 0); ctx.lineTo(doc.w / 2, doc.h); ctx.stroke(); } if (guides.y) { ctx.beginPath(); ctx.moveTo(0, doc.h / 2); ctx.lineTo(doc.w, doc.h / 2); ctx.stroke(); } ctx.restore(); }
    }
    redrawHook = () => draw();
    const guides = { x: false, y: false };
    // 1.9.4: professional tools: brush, eyedropper, grid, clipboard
    let tool = '', stroke = null, clip = null, styleClip = null;
    const brush = { c: '#c0392b', sw: 8, op: 1 }, grid = { on: false, snap: false, s: 40 };
    const setTool = t => { tool = tool === t ? '' : t; cv.style.cursor = tool === 'brush' ? 'crosshair' : tool === 'pick' ? 'copy' : 'default'; if (panelTab === 'tools') panel(); };
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
      const [x, y] = pt(e);
      if (tool === 'brush') { stroke = [[x, y]]; return; }
      if (tool === 'pick') {
        const r = cv.getBoundingClientRect(), d = ctx.getImageData(Math.round((e.clientX - r.left) * px), Math.round((e.clientY - r.top) * px), 1, 1).data;
        const hex = '#' + [d[0], d[1], d[2]].map(v => v.toString(16).padStart(2, '0')).join(''), o = selObj();
        if (o) { snap(); if (o.type === 'text') o.color = o.fill = hex; else if (o.type === 'path' || /line|arc/.test(o.shape || '')) o.stroke = hex; else if (o.type === 'image') o.f = Object.assign({}, o.f, { tint: (o.f || {}).tint || 40, tintC: hex }); else o.fill = hex; }
        brush.c = hex; tool = ''; cv.style.cursor = 'default'; toast('اللون المأخوذ: ' + hex); props(); draw(); if (panelTab === 'tools') panel(); return;
      } let o = selObj(), h = o && !o.lock ? handleAt(o, x, y) : null;
      if (!h) { o = hit(x, y); sel = o ? o.id : null; }
      if (o && !o.lock) drag = { h: h || 'move', x0: x, y0: y, o0: clone(o), moved: false };
      props(); draw(); if (panelTab === 'lay') panel();
    });
    window.addEventListener('pointermove', mm);
    function mm(e) {
      if (stroke) { const [x, y] = pt(e), l = stroke[stroke.length - 1]; if (Math.hypot(x - l[0], y - l[1]) > 1.5 / zoom) { stroke.push([x, y]); draw(); } return; }
      if (!drag) return; const o = selObj(); if (!o) return;
      const [x, y] = pt(e), O = drag.o0;
      if (!drag.moved) { snap(); drag.moved = true; }
      if (drag.h === 'move') {
        o.x = O.x + x - drag.x0; o.y = O.y + y - drag.y0;
        guides.x = Math.abs(o.x - doc.w / 2) < 6 / zoom; guides.y = Math.abs(o.y - doc.h / 2) < 6 / zoom;
        if (guides.x) o.x = doc.w / 2; if (guides.y) o.y = doc.h / 2;
        if (grid.snap && !guides.x) o.x = Math.round((o.x - o.w / 2) / grid.s) * grid.s + o.w / 2; if (grid.snap && !guides.y) o.y = Math.round((o.y - o.h / 2) / grid.s) * grid.s + o.h / 2;
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
    const mu = () => {
      if (stroke) { // the stroke becomes an element (moved, resized, coloured like the others)
        const P = stroke; stroke = null;
        if (P.length > 1) { const xs = P.map(q => q[0]), ys = P.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), w = Math.max(2, x1 - x0), h = Math.max(2, y1 - y0);
          addObj({ type: 'path', x: (x0 + x1) / 2, y: (y0 + y1) / 2, w, h, pts: P.map(([x, y]) => [(x - (x0 + x1) / 2) / w, (y - (y0 + y1) / 2) / h]), stroke: brush.c, sw: brush.sw, op: brush.op }); sel = null; props(); }
        draw(); return;
      }
      if (drag && drag.moved) { props(); } drag = null; guides.x = guides.y = false; draw();
    };
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
      if (mod && e.key.toLowerCase() === 'c' && selObj()) { clip = clone(selObj()); return; }
      if (mod && e.key.toLowerCase() === 'v' && clip) { e.preventDefault(); const c = clone(clip); c.id = uidD(); c.x += 24; c.y += 24; clip = clone(c); addObj(c); return; }
      if (e.key === 'Escape' && tool) { setTool(tool); return; }
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
      lock: () => { const o = selObj(); if (o) { o.lock = !o.lock; props(); draw(); panel(); } },
      al: k => { const o = selObj(); if (!o) return; snap(); const m = 20; if (k === 'r') o.x = doc.w - m - o.w / 2; if (k === 'l') o.x = m + o.w / 2; if (k === 't') o.y = m + o.h / 2; if (k === 'b') o.y = doc.h - m - o.h / 2; draw(); },
      copyStyle: () => { const o = selObj(); if (!o) return toast('اختر عنصرا أولا', true); const S2 = {}; ['fill', 'fill2', 'gAng', 'gType', 'color', 'stroke', 'sw', 'dash', 'sh', 'shC', 'shB', 'shX', 'shY', 'op', 'blend', 'font', 'size', 'bold', 'it', 'box', 'boxR', 'f', 'round', 'circle', 'hollow', 'curve'].forEach(k => { if (o[k] !== undefined) S2[k] = clone(o[k]); }); styleClip = { t: o.type, s: S2 }; toast('تم نسخ النمط: اختر عنصرا آخر ثم «لصق النمط»'); },
      pasteStyle: () => { const o = selObj(); if (!o || !styleClip) return toast(styleClip ? 'اختر عنصرا أولا' : 'انسخ نمط عنصر أولا', true); snap(); Object.entries(styleClip.s).forEach(([k, v]) => { if ((k === 'f' && o.type !== 'image') || (['font', 'size', 'bold', 'it', 'box', 'curve', 'hollow'].includes(k) && o.type !== 'text')) return; o[k] = clone(v); }); props(); draw(); }
    };
    root.querySelectorAll('.dz-top [data-a]').forEach(b => b.onclick = () => act[b.dataset.a]());

    /* ---- side panels ---- */
    let panelTab = 'tpl', tplCat = cat, tplLay = -1, galCat = '';
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
          <div class="dz-h">مكتبة الصور (${gallery().length})</div><div class="dz-chips" id="dzGc"><button data-gc="" class="${galCat ? '' : 'on'}">الكل</button>${galCats().map(([k, n]) => `<button data-gc="${k}" class="${galCat === k ? 'on' : ''}">${escH(n)}</button>`).join('')}</div>
          <div class="dz-gal">${gallery().filter(g => !galCat || g.c === galCat).map((g, i) => `<button data-gi="${gallery().indexOf(g)}" title="${escH(g.n)}${g.c === 'bg' ? ' — نقرة: عنصر، نقرتان: خلفية للتصميم' : ''}"><img src="${g.src}" alt=""></button>`).join('')}</div>
          <div class="dz-note">نقرة على صورة لإضافتها، ونقرتان على صور «خلفيات» لجعلها خلفية للتصميم.</div>
          <div class="dz-note">بعد اختيار الصورة: غيّر حجمها من الزوايا، وعدّلها من لوحة الخصائص (السطوع، التباين، التشبع، الضبابية، الأبيض والأسود، القناع الدائري، الإطار...). الصورة تبقى داخل البرنامج ولا تُرسل إلى أي مكان.</div>`;
        const addImg = (src, w0, h0) => { const im = new Image(); im.onload = () => { const r = im.naturalWidth / im.naturalHeight, w = Math.min(doc.w * .6, w0 || im.naturalWidth); addObj({ type: 'image', src, w, h: w / r, fit: 'cover', f: {} }); }; im.src = src; };
        pn.querySelector('#dzUp').onclick = async () => { const d = await window.api.openImage(); if (d) addImg(d); };
        pn.querySelector('#dzEmb').onclick = () => addObj({ type: 'image', src: (window.EMBLEM_DATA || 'assets/emblem.png'), w: 140, h: 140, fit: 'contain', f: {} });
        if (pn.querySelector('#dzLh')) pn.querySelector('#dzLh').onclick = () => addImg(S().letterhead, doc.w * .9);
        pn.querySelectorAll('[data-gc]').forEach(b => b.onclick = () => { galCat = b.dataset.gc; panel(); });
        pn.querySelectorAll('[data-gi]').forEach(b => { const g = gallery()[+b.dataset.gi];
          b.onclick = () => { const im = new Image(); im.onload = () => { const r = (im.naturalWidth || 200) / (im.naturalHeight || 200), w = g.c === 'bg' ? doc.w * .9 : Math.min(doc.w * .4, 320); addObj({ type: 'image', src: g.src, w, h: w / r, fit: 'contain', f: {} }); }; im.src = g.src; };
          b.ondblclick = () => { if (g.c !== 'bg') return; snap(); doc.objs = doc.objs.filter(o => o.src !== g.src || o.id !== sel); sel = null; doc.bg = Object.assign({}, doc.bg, { img: g.src, imgOp: 1 }); props(); draw(); toast('صارت الصورة خلفية للتصميم'); }; });
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
      } else if (panelTab === 'tools') {
        pn.innerHTML = `<div class="dz-h">الرسم الحر (الفرشاة)</div>
          <button class="btn ${tool === 'brush' ? 'pri' : ''}" id="tBr" style="width:100%">🖌 ${tool === 'brush' ? 'إيقاف الرسم' : 'الرسم بالفرشاة'}</button>
          <div class="dz-row"><label>اللون</label><input type="color" id="tBc" value="${brush.c}"><label>السمك</label><input type="range" id="tBs" min="1" max="60" value="${brush.sw}"></div>
          <div class="dz-row"><label>الشفافية</label><input type="range" id="tBo" min="10" max="100" value="${Math.round(brush.op * 100)}"></div>
          <div class="dz-row dz-btns"><button class="dz-b" data-bp="#c0392b|8|1">قلم أحمر</button><button class="dz-b" data-bp="#16325f|4|1">قلم رفيع</button><button class="dz-b" data-bp="#fdd835|26|.45">قلم تحديد</button><button class="dz-b" data-bp="#ffffff|30|1">ممحاة بيضاء</button></div>
          <div class="dz-h">القطارة</div><button class="btn ${tool === 'pick' ? 'pri' : ''}" id="tPk" style="width:100%">💧 أخذ لون من التصميم</button>
          <div class="dz-note">انقر على أي نقطة في التصميم: يُطبق لونها على العنصر المحدد (نص، شكل، خط، أو صبغة الصورة) ويصير لون الفرشاة.</div>
          <div class="dz-h">الشبكة والمحاذاة</div>
          <label class="chk dz-ck"><input type="checkbox" id="tGr" ${grid.on ? 'checked' : ''}> إظهار الشبكة</label><label class="chk dz-ck"><input type="checkbox" id="tGs" ${grid.snap ? 'checked' : ''}> الالتصاق بالشبكة</label>
          <div class="dz-row"><label>حجم الخانة</label><input type="range" id="tGz" min="10" max="120" value="${grid.s}"></div>
          <div class="dz-row dz-btns"><button class="dz-b" data-al="r" title="إلى يمين الصفحة">⇥ يمين</button><button class="dz-b" data-al="l" title="إلى يسار الصفحة">يسار ⇤</button><button class="dz-b" data-al="t">⤒ أعلى</button><button class="dz-b" data-al="b">⤓ أسفل</button><button class="dz-b" data-x2="cx">↔ وسط</button><button class="dz-b" data-x2="cy">↕ وسط</button></div>
          <div class="dz-h">النمط</div><div class="dz-row dz-btns"><button class="dz-b" data-x2="copyStyle">نسخ نمط العنصر</button><button class="dz-b" data-x2="pasteStyle">لصق النمط</button></div>
          <div class="dz-h">إضافات</div>
          <button class="btn" id="tWm" style="width:100%">علامة مائية (نص شفاف مائل)</button>
          <button class="btn" id="tPt" style="width:100%;margin-top:6px">تصدير PNG شفاف (بدون خلفية)</button>
          <div class="dz-note">اختصارات: Ctrl+C / Ctrl+V نسخ ولصق عنصر، Ctrl+D تكرار، Ctrl+Z تراجع، Esc لإيقاف الأداة.</div>`;
        pn.querySelector('#tBr').onclick = () => setTool('brush'); pn.querySelector('#tPk').onclick = () => setTool('pick');
        pn.querySelector('#tBc').oninput = e => { brush.c = e.target.value; }; pn.querySelector('#tBs').oninput = e => { brush.sw = +e.target.value; }; pn.querySelector('#tBo').oninput = e => { brush.op = +e.target.value / 100; };
        pn.querySelectorAll('[data-bp]').forEach(b => b.onclick = () => { const [c, w2, op] = b.dataset.bp.split('|'); Object.assign(brush, { c, sw: +w2, op: +op }); if (tool !== 'brush') setTool('brush'); else panel(); });
        pn.querySelector('#tGr').onchange = e => { grid.on = e.target.checked; draw(); }; pn.querySelector('#tGs').onchange = e => { grid.snap = e.target.checked; };
        pn.querySelector('#tGz').oninput = e => { grid.s = +e.target.value; draw(); };
        pn.querySelectorAll('[data-al]').forEach(b => b.onclick = () => act.al(b.dataset.al));
        pn.querySelectorAll('[data-x2]').forEach(b => b.onclick = () => act[b.dataset.x2]());
        pn.querySelector('#tWm').onclick = () => addObj({ type: 'text', text: schoolTxt().school, w: doc.w * .9, h: 90, size: Math.round(doc.w / 11), font: 'Amiri', bold: true, color: '#16325f', fill: '#16325f', align: 'center', lh: 1.2, op: .12, rot: -32 });
        pn.querySelector('#tPt').onclick = () => exportImg('png', true);
      } else if (panelTab === 'lay') {
        const lab = o => o.type === 'text' ? '🅰 ' + String(o.text).split('\n')[0].slice(0, 22) : o.type === 'image' ? '🖼 صورة' : o.type === 'icon' ? o.text + ' رمز' : o.type === 'path' ? '🖌 رسم حر' : '🔷 ' + (SHAPE_NAMES[o.shape] || 'شكل');
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
      let h = `<div class="dz-h">${o.type === 'text' ? 'النص' : o.type === 'image' ? 'الصورة' : o.type === 'icon' ? 'الرمز' : o.type === 'path' ? 'الرسم الحر' : 'الشكل'} ${o.lock ? '🔒' : ''}</div>
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
          ${r('curve', 'تقويس النص °', -300, 300, o.curve || 0, 5)}${ck('hollow', 'نص مجوف (الحدود فقط)', !!o.hollow)}
          ${ck('bx', 'مربع خلفية للنص', !!o.box)}${o.box ? c('box', 'لون المربع', o.box) + r('boxR', 'استدارة', 0, 60, o.boxR || 0) : ''}`;
      } else if (o.type === 'image') {
        h += `<div class="dz-row dz-btns"><button class="dz-b ${o.fit !== 'contain' ? 'on' : ''}" data-fit="cover">ملء الإطار</button><button class="dz-b ${o.fit === 'contain' ? 'on' : ''}" data-fit="contain">الصورة كاملة</button><button class="dz-b" data-x="repl">تغيير الصورة</button></div>
          <div class="dz-h2">تعديل الصورة</div>
          ${r('f.b', 'السطوع', 0, 200, f.b == null ? 100 : f.b)}${r('f.c', 'التباين', 0, 200, f.c == null ? 100 : f.c)}${r('f.s', 'التشبع', 0, 300, f.s == null ? 100 : f.s)}
          ${r('f.blur', 'الضبابية', 0, 20, f.blur || 0)}${r('f.gray', 'أبيض وأسود', 0, 100, f.gray || 0)}${r('f.sepia', 'لون قديم', 0, 100, f.sepia || 0)}${r('f.hue', 'تدوير الألوان', 0, 360, f.hue || 0)}${r('f.inv', 'عكس الألوان', 0, 100, f.inv || 0)}
          <div class="dz-row dz-btns">${[['أصلي', {}], ['أبيض وأسود', { gray: 100, c: 115 }], ['قديم', { sepia: 80, c: 90, b: 105 }], ['زاهي', { s: 170, c: 115 }], ['دافئ', { sepia: 30, s: 130, b: 105 }], ['بارد', { hue: 190, s: 80 }], ['درامي', { c: 160, b: 90, s: 120 }], ['باهت', { s: 50, b: 115, c: 85 }], ['سينمائي', { c: 125, s: 85, b: 95, vig: 45, tint: 12, tintC: '#0b6b8a' }], ['HDR', { c: 140, s: 140, sharp: 55 }], ['ليلي', { b: 75, s: 70, tint: 30, tintC: '#1a237e', vig: 50 }], ['ذهبي', { sepia: 40, s: 140, tint: 18, tintC: '#d4a52c' }], ['رسم كرتوني', { post: 70, s: 150, c: 120, sharp: 40 }], ['ذكريات', { sepia: 55, noise: 35, vig: 55, c: 90 }]].map(([n, v], i) => `<button class="dz-b" data-pre="${i}" data-v='${JSON.stringify(v)}'>${n}</button>`).join('')}</div>
          <div class="dz-h2">أدوات احترافية</div>
          ${r('f.rmbg', 'إزالة الخلفية', 0, 60, f.rmbg || 0)}${r('f.sharp', 'الحدة', 0, 100, f.sharp || 0)}${r('f.noise', 'تحبيب', 0, 100, f.noise || 0)}${r('f.post', 'تبسيط الألوان', 0, 100, f.post || 0)}${r('f.pix', 'فسيفساء', 0, 40, f.pix || 0)}
          ${r('f.vig', 'تظليل الأطراف', 0, 100, f.vig || 0)}${r('f.tint', 'صبغة لونية', 0, 100, f.tint || 0)}${f.tint ? c('f.tintC', 'لون الصبغة', f.tintC || '#1e88e5') : ''}
          <div class="dz-row"><label>تلاشي الحواف</label><select class="dz-s" data-k="f.fade"><option value="">بدون</option>${[['all', 'كل الحواف'], ['b', 'الأسفل'], ['t', 'الأعلى'], ['r', 'اليمين'], ['l', 'اليسار']].map(([k2, n]) => `<option value="${k2}" ${f.fade === k2 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>${f.fade ? r('f.fadeA', 'قوة التلاشي', 10, 90, f.fadeA || 35) : ''}
          ${r('f.outl', 'حد ملصق (Sticker)', 0, 30, f.outl || 0)}${f.outl ? c('f.outlC', 'لون الحد', f.outlC || '#ffffff') : ''}
          <div class="dz-h2">قص الصورة %</div>${r('f.ct', 'من الأعلى', 0, 45, f.ct || 0)}${r('f.cb', 'من الأسفل', 0, 45, f.cb || 0)}${r('f.cr', 'من اليمين', 0, 45, f.cr || 0)}${r('f.cl', 'من اليسار', 0, 45, f.cl || 0)}
          ${ck('circle', 'قناع دائري', !!o.circle)}${r('round', 'زوايا مستديرة', 0, 200, o.round || 0)}
          ${ck('strk', 'إطار', !!(o.stroke && o.sw))}${o.stroke && o.sw ? c('stroke', 'لون الإطار', o.stroke) + r('sw', 'سمك الإطار', 1, 40, o.sw) : ''}`;
      } else if (o.type === 'icon') {
        h += `<div class="dz-row"><label>الرمز</label><input class="dz-s" data-k="text" value="${escH(o.text)}" style="width:80px;font-size:20px"></div>`;
      } else if (o.type === 'path') {
        h += '';
      } else {
        const ln = /line|arc/.test(o.shape);
        h += `<div class="dz-row"><select class="dz-s full" data-k="shape">${Object.keys(SHAPE_NAMES).map(k => `<option value="${k}" ${k === o.shape ? 'selected' : ''}>${SHAPE_NAMES[k]}</option>`).join('')}</select></div>
          ${ln ? '' : `${ck('nofill', 'بدون تعبئة', !o.fill || o.fill === 'none')}${o.fill && o.fill !== 'none' ? c('fill', 'لون التعبئة', o.fill) + ck('grad', 'تدرج لوني', !!o.fill2) + (o.fill2 ? c('fill2', 'اللون الثاني', o.fill2) + r('gAng', 'زاوية التدرج', 0, 360, o.gAng || 0) + ck('rad', 'تدرج دائري', o.gType === 'radial') : '') : ''}`}
          ${c('stroke', ln ? 'لون الخط' : 'لون الحدود', o.stroke || '#000000')}${r('sw', ln ? 'السمك' : 'سمك الحدود', 0, 40, o.sw || 0)}${ln ? '' : ck('dash', 'حدود متقطعة', !!o.dash)}
          ${o.shape === 'round' || o.shape === 'rect' ? r('r', 'استدارة الزوايا', 0, 300, o.r || 0) : ''}${o.shape === 'wave' ? r('waves', 'عدد الموجات', 1, 8, o.waves || 2) : ''}`;
      }
      if (o.type === 'path') h += `${c('stroke', 'لون الخط', o.stroke || '#16325f')}${r('sw', 'السمك', 1, 80, o.sw || 6)}`;
      h += `<div class="dz-h2">عام</div><div class="dz-row"><label>مزج الطبقة</label><select class="dz-s" data-k="blend" style="flex:1">${BLENDS.map(([k2, n]) => `<option value="${k2}" ${(o.blend || '') === k2 ? 'selected' : ''}>${n}</option>`).join('')}</select></div>${r('op', 'الشفافية %', 5, 100, Math.round((o.op == null ? 1 : o.op) * 100))}${r('rot', 'الدوران °', -180, 180, Math.round(o.rot || 0))}
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
            else if (k === 'hollow') { o.hollow = on; if (on && !(o.stroke && o.sw)) { o.stroke = o.color || '#16325f'; o.sw = 2; } }
            else setK(k, on);
            props(); draw(); return;
          }
          let v = el.value;
          if (el.type === 'range' || el.type === 'number') v = +v;
          const prev = k.startsWith('f.') ? (o.f || {})[k.slice(2)] : o[k];
          if (k === 'op') v = v / 100;
          if (k === 'color') o.fill = v;
          setK(k, v);
          const sp = el.parentElement.querySelector('.dz-v'); if (sp) sp.textContent = el.value;
          if (k === 'shape' || k === 'font' || k === 'f.fade' || (['f.tint', 'f.outl'].includes(k) && !prev !== !v)) props();
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
    const exportImg = async (kind, transparent) => {
      await document.fonts.ready;
      const c = transparent ? (() => { const d2 = clone(doc); d2.bg = { t: 'solid', c1: 'rgba(0,0,0,0)' }; return toCanvas(d2, Math.min(3, 3508 / Math.max(doc.w, doc.h))); })() : hiRes(), u = c.toDataURL(kind === 'jpg' ? 'image/jpeg' : 'image/png', .93);
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
        <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">صمّم إعلانات الأنشطة والملصقات والتهاني والدعوات: أكثر من ${LAYOUTS.length * PAL.length * CATS.length} قالبا جاهزا (${CATS.length} مواضيع)، كل الخطوط، الأشكال والرموز، مكتبة صور ورسوم (جوائز، مدرسة، احتفالات، مناسبات، زخارف، خلفيات...)، الصور مع أدوات احترافية (السطوع والتباين والتشبع، إزالة الخلفية، القص، الحدة، الصبغة، تظليل الأطراف، تلاشي الحواف، حد الملصق، مرشحات جاهزة)، أوضاع مزج الطبقات، الرسم الحر بالفرشاة، القطارة، الشبكة والمحاذاة، النص المقوس والمجوف، نسخ النمط، الخلفيات والتدرجات والزخارف، الطبقات، ثم الحفظ صورة PNG (أو PNG شفاف) أو PDF أو الطباعة مباشرة. يعمل دون إنترنت.</div>
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
  .dz-tabs{display:grid;grid-template-columns:repeat(4,1fr);gap:2px;padding:6px;border-bottom:1px solid #e4e9e6}.dz-tabs button{border:0;background:#f3f1f8;border-radius:6px;padding:6px 2px;font-size:12px;cursor:pointer;font-family:inherit}.dz-tabs button.on{background:#5b2a86;color:#fff}
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
  .dz-row{display:flex;align-items:center;gap:6px;margin:5px 0;font-size:12.3px}.dz-row label{min-width:72px;color:#3b4a45}.dz-row input[type=range]{flex:1}.dz-row input[type=color]{flex:none;width:44px;min-width:44px;height:26px;border:1px solid #ccc;border-radius:5px;padding:0}.dz-v{min-width:28px;font-size:11px;color:#666}
  .dz-btns{flex-wrap:wrap;gap:3px}.dz-ck{display:flex;margin:6px 0;font-size:12.3px}.dz-ta{width:100%;border:1px solid #d4dcd8;border-radius:6px;padding:6px;font-family:inherit;font-size:14px;box-sizing:border-box}
  .dz-ly{display:flex;align-items:center;gap:4px;border:1px solid #e4e9e6;border-radius:6px;padding:4px 6px;margin-bottom:3px;cursor:pointer;font-size:12.3px}.dz-ly span{flex:1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}.dz-ly button{border:0;background:none;cursor:pointer}.dz-ly.on{border-color:#5b2a86;background:#f4effb}
  .dz-gal{display:grid;grid-template-columns:repeat(3,1fr);gap:5px}.dz-gal button{border:1px solid #e1e6e3;background:repeating-conic-gradient(#f1f1f1 0 25%,#fff 0 50%) 0 0/14px 14px;border-radius:6px;padding:3px;cursor:pointer;height:74px;display:flex;align-items:center;justify-content:center}.dz-gal img{max-width:100%;max-height:66px}.dz-gal button:hover{border-color:#5b2a86}
  .dz-start{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px}.dz-cat{padding:6px;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:4px;border:1px solid var(--line)}.dz-cat img{width:100%;border-radius:4px}.dz-cat span{font-size:12.5px;font-weight:700}
  @media (max-width:900px){.dz-main{flex-direction:column;overflow:auto}.dz-side{width:auto;height:40vh;flex:none;border:0;border-top:1px solid #d7dfdb;order:3}.dz-props{width:auto;height:30vh;flex:none;order:2;border:0;border-top:1px solid #d7dfdb}.dz-stage{order:1;padding:8px;flex:none;height:52vh}.dz-tabs{grid-template-columns:repeat(7,1fr)}.dz-name{width:120px}}
  .dz-mine{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:10px}.dz-my{padding:6px}.dz-my img{width:100%;height:170px;object-fit:contain;background:#f3f4f3;border-radius:6px;cursor:pointer}.dz-myb{display:flex;flex-direction:column;gap:3px;padding-top:5px;font-size:12.5px}`;
  document.head.appendChild(style);

  // 1.9.4: buttons of other pages that open the designer (no inline handler: the security policy of the app forbids them)
  document.addEventListener('click', e => { const b = e.target.closest && e.target.closest('[data-go-flyers]'); if (b) go('flyers', { cat: b.dataset.goFlyers || '' }); });
  window.Designer = { open, page, template, toCanvas, render, CATS, PAL, LAYOUTS, SIZES };
  window.pageFlyers = (v, a) => page(v, a);
})();
