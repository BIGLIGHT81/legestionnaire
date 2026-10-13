'use strict';
/* Document templates. Each template renders ONE copy (A5 portrait) as HTML.
   buildDocHtml() assembles a full printable page. */
(function () {
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const fmtDate = iso => { if (!iso) return ''; const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso); return m ? `${m[3]}/${m[2]}/${m[1]}` : iso; };
  const toDate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? new Date(Date.UTC(+m[1], m[2] - 1, +m[3])) : null; };
  const isoOf = d => d.toISOString().slice(0, 10);
  const daysBetween = (a, b) => { const x = toDate(a), y = toDate(b); if (!x || !y || y < x) return 0; return Math.round((y - x) / 864e5) + 1; };
  const durationText = n => { n = +n || 0; if (n <= 0) return ''; if (n === 1) return 'يوم واحد'; if (n === 2) return 'يومان'; if (n <= 10) return `${n} أيام`; return `${n} يوما`; };
  const fullName = e => e ? `${e.firstAr || ''} ${e.lastAr || ''}`.trim() : '';
  const todayIso = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };

  // value placeholder: dotted line when empty
  const V = (v, cls = '') => {
    const s = String(v == null ? '' : v).trim();
    return s ? `<span class="v ${cls}">${esc(s)}</span>` : `<span class="v empty ${cls}"></span>`;
  };
  const D = (iso, cls) => V(fmtDate(iso), cls);
  const L = t => `<span class="lb">${t}</span>`;
  const CB = on => `<span class="cb">${on ? '✕' : ''}</span>`;
  const LTR = h => `<span dir="ltr" class="ltr">${h}</span>`;

  const TIF = { kingdom: 'ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ', ministry: 'ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ',
    academy: 'ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⴳⵎⴰⵢⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⴰⵢⵏ', directorate: 'ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ' };
  // one header line, never wrapped: shrinks to fit its column (container query units), so Arabic and Tifinagh stay on 4 parallel lines
  const hline = (t, first, tif) => {
    const n = Math.max(6, String(t || '').length) * (tif ? 0.53 : first ? 0.36 : 0.47);
    return `<div class="${first ? 'k' : ''}" style="font-size:min(var(${first ? '--fsk' : '--fs'}), calc(100cqw / ${n.toFixed(2)}))">${esc(t || '')}</div>`;
  };
  /* ---------- 1.9.2: header «رقعة» (the shape of the official letterhead: blue wave, emblem, 6 lines in Arabic and in Tifinagh, brown rule) ---------- */
  // Arabic letters -> Tifinagh (IRCAM) for place names that are not in the list below
  const TFL = { 'ا': 'ⴰ', 'أ': 'ⴰ', 'إ': 'ⵉ', 'آ': 'ⴰ', 'ب': 'ⴱ', 'ت': 'ⵜ', 'ث': 'ⵜ', 'ج': 'ⵊ', 'ح': 'ⵃ', 'خ': 'ⵅ', 'د': 'ⴷ', 'ذ': 'ⴷ', 'ر': 'ⵔ', 'ز': 'ⵣ', 'س': 'ⵙ', 'ش': 'ⵛ',
    'ص': 'ⵚ', 'ض': 'ⴹ', 'ط': 'ⵟ', 'ظ': 'ⴹ', 'ع': 'ⵄ', 'غ': 'ⵖ', 'ف': 'ⴼ', 'ق': 'ⵇ', 'ك': 'ⴽ', 'ڭ': 'ⴳ', 'گ': 'ⴳ', 'ل': 'ⵍ', 'م': 'ⵎ', 'ن': 'ⵏ', 'ه': 'ⵀ', 'ة': 'ⴰ', 'و': 'ⵓ', 'ي': 'ⵉ', 'ى': 'ⴰ', 'ئ': 'ⵉ', 'ؤ': 'ⵓ', 'ء': '' };
  const TFN = { // official / usual Tifinagh names (regions and provinces of the Souss-Massa area first)
    'سوس ماسة': 'ⵙⵓⵙ ⵎⴰⵙⵙⴰ', 'اكادير اداوتنان': 'ⴰⴳⴰⴷⵉⵔ ⵉⴷⴰⵡⵜⴰⵏⴰⵏ', 'انزكان ايت ملول': 'ⵉⵏⵣⴳⴳⴰⵏ ⴰⵢⵜ ⵎⵍⵍⵓⵍ', 'اشتوكة ايت باها': 'ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ', 'شتوكة ايت باها': 'ⵛⵜⵓⴽⴰ ⴰⵢⵜ ⴱⴰⵀⴰ',
    'تارودانت': 'ⵜⴰⵔⵓⴷⴰⵏⵜ', 'تيزنيت': 'ⵜⵉⵣⵏⵉⵜ', 'طاطا': 'ⵟⴰⵟⴰ', 'مراكش اسفي': 'ⵎⵕⵕⴰⴽⵛ ⴰⵙⴼⵉ', 'كلميم واد نون': 'ⴳⵍⵎⵉⵎ ⵡⴰⴷ ⵏⵓⵏ', 'درعة تافيلالت': 'ⴷⵔⵄⴰ ⵜⴰⴼⵉⵍⴰⵍⵜ',
    'الرباط سلا القنيطرة': 'ⵕⵕⴱⴰⵟ ⵙⵍⴰ ⵇⵏⵉⵟⵕⴰ', 'الدار البيضاء سطات': 'ⴰⵏⴼⴰ ⵙⵟⵟⴰⵜ', 'فاس مكناس': 'ⴼⴰⵙ ⵎⴽⵏⴰⵙ', 'بني ملال خنيفرة': 'ⴰⵢⵜ ⵎⵍⵍⴰⵍ ⵅⵏⵉⴼⵕⴰ', 'الشرق': 'ⴰⴳⵎⵎⵓⴹ',
    'طنجة تطوان الحسيمة': 'ⵟⴰⵏⵊⴰ ⵜⵉⵟⵟⴰⵡⵉⵏ ⵍⵃⵓⵙⵉⵎⴰ', 'العيون الساقية الحمراء': 'ⵍⵄⵢⵓⵏ ⵙⴰⴳⵉⵢⵜ ⵍⵃⴰⵎⵔⴰ', 'الداخلة وادي الذهب': 'ⴷⴷⴰⵅⵍⴰ ⵡⴰⴷ ⴷⴷⴰⵀⴰⴱ',
    'ورزازات': 'ⵡⴰⵔⵣⴰⵣⴰⵜ', 'زاكورة': 'ⵣⴰⴳⵓⵔⴰ', 'تنغير': 'ⵜⵉⵏⵖⵉⵔ', 'الرشيدية': 'ⵔⵔⴰⵛⵉⴷⵉⵢⴰ', 'ميدلت': 'ⵎⵉⴷⵍⵜ', 'كلميم': 'ⴳⵍⵎⵉⵎ', 'سيدي افني': 'ⵙⵉⴷⵉ ⵉⴼⵏⵉ', 'طانطان': 'ⵟⴰⵏⵟⴰⵏ', 'الحوز': 'ⵍⵃⴰⵡⵣ' };
  const nAr = t => String(t || '').replace(/[ًٌٍَُِّْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
  const tifName = ar => {
    const k = nAr(ar).replace(/^(جهة|لجهة|بجهة|اقليم|عمالة|مديرية)\s+/, '');
    if (!k) return '';
    if (TFN[k]) return TFN[k];
    const hit = Object.keys(TFN).find(x => x.replace(/\s/g, '') === k.replace(/\s/g, '').replace(/^ال/, '') || x.replace(/\s/g, '') === k.replace(/\s/g, ''));
    if (hit) return TFN[hit];
    return k.split(' ').map(w => Array.from(w.replace(/^ال(?=..)/, '')).map(c => (TFL[c] != null ? TFL[c] : c)).join('')).join(' ');
  };
  // «الأكاديمية الجهوية للتربية والتكوين لجهة سوس ماسة» -> [«الأكاديمية الجهوية للتربية والتكوين», «سوس ماسة»]
  const splitAcademy = a => {
    a = String(a || '').trim();
    const m = /^(.*?(?:والتكوين|و التكوين))\s*[-–:،,]?\s*(?:ل?جهة\s*:?\s*|ل)?(.*)$/.exec(a);
    if (!m) return [a, ''];
    return [m[1].trim(), m[2].trim()];
  };
  const regionOf = a => splitAcademy(a)[1];
  const placeOfDir = d => String(d || '').replace(/^\s*(?:ال)?مديرية\s+(?:ال)?إ?ا?قليمية\s*(?:ل|ب|-|–|:)?\s*/, '').replace(/^(?:عمالة|إقليم|اقليم)\s+/, '').trim();
  // a long ministry name on two lines, cut at the «و» nearest to the middle
  const splitMinistry = t => {
    t = String(t || '').trim();
    if (t.length <= 26) return [t];
    const idx = []; const rx = /\sو(?=\S)/g; let m; while ((m = rx.exec(t))) idx.push(m.index);
    if (!idx.length) return [t];
    const mid = t.length / 2; const k = idx.reduce((b, x) => (Math.abs(x - mid) < Math.abs(b - mid) ? x : b), idx[0]);
    return [t.slice(0, k).trim(), t.slice(k).trim()];
  };
  const tifLines = v => String(v || '').split(/\s*(?:\n|\/|\|)\s*/).map(x => x.trim()).filter(Boolean);
  function headerLines(s) {
    const tv = (k, d) => (s[k] == null || String(s[k]).trim() === '' ? d : s[k]);
    const [acad, reg] = splitAcademy(s.academy);
    const ar = ['المملكة المغربية'].concat(splitMinistry(s.ministry), [acad], reg ? ['جهة ' + reg.replace(/^جهة\s+/, '')] : [], [String(s.directorate || '').trim()]).filter(Boolean);
    const min = tv('tifMinistry', TIF.ministry);
    const tf = [tv('tifKingdom', TIF.kingdom)];
    tf.push(...(min === TIF.ministry ? ['ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ', 'ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ'] : tifLines(min)));
    tf.push(...tifLines(tv('tifAcademy', TIF.academy)));
    const tr = String(s.tifRegion || '').trim();
    if (tr) tf.push(...tifLines(tr)); else if (reg) tf.push('ⵜⴰⵎⵏⴰⴹⵜ ' + tifName(reg));
    const td = tv('tifDirectorate', TIF.directorate);
    const place = placeOfDir(s.directorate);
    tf.push(...(td === TIF.directorate && place ? [td + ' ' + tifName(place)] : tifLines(td)));
    return { ar, tf: tf.filter(Boolean) };
  }
  // one block of lines with one common size (the longest line fills its column, as on the official letterhead)
  const block = (lines, k, cls, attrs) => {
    const n = Math.max(8, ...lines.map(t => String(t).length)) * k;
    return `<div class="hdr-txt ${cls}"${attrs || ''} style="--fit:calc(100cqw / ${n.toFixed(2)})">${lines.map(t => `<div>${esc(t)}</div>`).join('')}</div>`;
  };
  const WAVE = '<svg class="hdr-wave" viewBox="0 0 1000 40" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg"><path d="M0 29H120C142 29 146 11 168 11H866C888 11 892 30 914 30H990" fill="none" stroke="#183c8c" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/></svg>';
  const HDR_STYLES = [['ruqaa', 'الشكل الجديد: موجة زرقاء وخط بني (مثل الرأسية الرسمية)'], ['classic', 'الشكل الكلاسيكي (خط أميري، 4 أسطر)']];
  // 1.9.3: the Arabic lines of the text letterhead use «Sakkal Majalla» by default, or any font installed on this computer (setting hdrFont)
  const cleanFont = f => String(f || '').replace(/["'<>;{}\\\n]/g, '').trim().slice(0, 60);
  const hdrFam = s => { const f = cleanFont(s && s.hdrFont); return (f ? "'" + f + "'," : '') + "'MAJT','Amiri',serif"; };
  function headerV2(s, service, dirOnly) {
    const L = headerLines(s);
    const custom = !!cleanFont(s.hdrFont);
    return `<div class="hdr hv2" style="--hf:${hdrFam(s).replace(/"/g, '&quot;')}">${WAVE}
      <div class="hdr-g">
        ${block(L.ar, custom ? 0.5 : 0.36, 'hdr-ar')}
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        ${block(L.tf, 0.56, 'hdr-tif', ' lang="zgh" dir="ltr"')}
      </div>
      ${s.school && !dirOnly ? `<div class="hdr-sch2">${esc(s.school)}</div>` : ''}
      ${service ? `<div class="srv">${esc(service)}</div>` : ''}
    </div>`;
  }
  // opts.dirOnly: directorate header only (text + emblem), never the school's letterhead image nor the school name
  function header(s, service, opts) {
    const dirOnly = !!(opts && opts.dirOnly);
    if (!dirOnly && s.headerMode === 'image' && s.letterhead) {
      const srv = service ? `<div class="srv-l">${esc(service)}</div>` : '';
      if (s.letterheadP && s.lhNorm !== false) { // 1.9.2: same band on every page (portrait / landscape variants)
        const L = s.letterheadL ? `<img class="lh-l" src="${esc(s.letterheadL)}" width="${+s.llW}" height="${+s.llH}">` : '';
        return `<div class="hdr-img lhn${L ? '' : ' one'}"><img class="lh-p" src="${esc(s.letterheadP)}" width="${+s.lpW}" height="${+s.lpH}">${L}</div>${srv}`;
      }
      const wh = s.letterheadW && s.letterheadH ? ` width="${+s.letterheadW}" height="${+s.letterheadH}"` : '';
      return `<div class="hdr-img"><img src="${esc(s.letterhead)}"${wh}></div>${srv}`;
    }
    if ((s.headerStyle || 'ruqaa') !== 'classic') return headerV2(s, service, dirOnly);
    const tv = (k, d) => (s[k] == null || String(s[k]).trim() === '' ? d : s[k]);
    const ar = ['المملكة المغربية', s.ministry, s.academy, s.directorate];
    const tif = [tv('tifKingdom', TIF.kingdom), tv('tifMinistry', TIF.ministry), tv('tifAcademy', TIF.academy), tv('tifDirectorate', TIF.directorate)];
    return `<div class="hdr">
      <div class="hdr-g">
        <div class="hdr-txt">${ar.map((t, i) => hline(t, i === 0, false)).join('')}</div>
        <div class="hdr-emb"><img src="assets/emblem.png"></div>
        <div class="hdr-txt hdr-tif" lang="zgh">${tif.map((t, i) => hline(t, i === 0, true)).join('')}</div>
      </div>
      ${s.school && !dirOnly ? `<div class="hdr-sch2">${esc(s.school)}</div>` : ''}
      ${service ? `<div class="srv">${esc(service)}</div>` : ''}
    </div>`;
  }

  /* ------------------------------------------------------------------ */
  const T = {};

  T.inquiry = ({ s, e, f }) => `
    ${header(s)}
    <div class="row2 mt2">
      <div>${L('المؤسسة :')} ${V(s.school, 'b')}</div>
      <div class="to">
        <div>${L('إلى :')}</div>
        <div>${L('السيد (ة) :')} ${V(fullName(e), 'b')}</div>
        <div>${L('رقم التأجير :')} ${V(e.ppr)}</div>
      </div>
    </div>
    <p class="mt">${L('<u>الموضوع</u> :')} <b>استفسار.</b></p>
    <p>${L('<u>المرجع</u> :')} المرسوم رقم 2.99.1216 الصادر في 6 صفر 1421 (2000/05/10).</p>
    <p class="c b mt">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p class="j">وبعد، لقد بلغ إلى علمي أنك(م) تغيبت(م) عن عملك(م) خلال الفترة المتراوحة ما بين: ${L('من')} ${D(f.from, 'b')} ${L('إلى')} ${D(f.to, 'b')}
      بدون إشعار أو إذن سابق، الشيء الذي يتنافى والقوانين الجاري بها العمل.</p>
    <p class="j">لذا، وقبل اتخاذ قرار الخصم من مرتبك(م) طبقا لمقتضيات المرسوم المشار إليه في المرجع أعلاه ولاسيما المادة 4 منه،
      يشرفني أن أطلب منك(م) موافاتي بالبيانات المفصلة في الموضوع مصحوبة بالوثائق المبررة وذلك في أجل لا يتعدى
      <b>${esc(f.deadline || 15)}</b> يوما ابتداء من تاريخ توصلك(م) بهذا الاستفسار.</p>
    <p class="l b">والسلام.</p>
    <div class="row2">
      <div>${L('التاريخ :')} ${D(f.date)}</div>
      <div class="c b">توقيع الرئيس المباشر :</div>
    </div>
    <div class="spacer"></div>
    <div class="cut"><span>✂</span></div>
    <div class="subtitle">إشعار باستلام استفسار</div>
    <p>${L('يشهد السيد (ة) :')} ${V(fullName(e), 'b')} &nbsp; ${L('رقم التأجير :')} ${V(e.ppr)}</p>
    <p>أنه توصل(ت) باستفسار عن التغيب خلال الفترة المتراوحة ${L('من :')} ${D(f.from)} ${L('إلى :')} ${D(f.to)}</p>
    <div class="row2 mt">
      <div>${L('التاريخ :')} ${D(f.receiptDate)}</div>
      <div class="c b">التوقيع :</div>
    </div>`;

  T.leave = ({ s, e, f, history }) => {
    const types = ['مرضية', 'أغراض شخصية', 'استثنائية', 'ولادة'];
    const rows = (history || []).slice(0, 4);
    while (rows.length < 4) rows.push(null);
    return `
    ${header(s, 'مصلحة الموارد البشرية ـ مكتب الرخص الإدارية والتغيبات')}
    <div class="title-box">طلب رخصة</div>
    <div class="grid2">
      <div>${L('الاسم الكامل :')} ${V(fullName(e), 'b')}</div><div>${L('ر.ت :')} ${V(e.ppr)}</div>
      <div>${L('الإطار :')} ${V(e.cadre)}</div><div>${L('تاريخ الازدياد :')} ${D(e.birth)}</div>
    </div>
    <div class="types">${L('نوع الرخصة :')} ${types.map(t => `<span class="opt">${CB(f.leaveType === t)} ${t}</span>`).join('')}</div>
    <p>${L('مدتها :')} ${V(f.duration, 'b')} &nbsp; ${L('من :')} ${D(f.from, 'b')} &nbsp; ${L('إلى :')} ${D(f.to, 'b')}</p>
    <p>${L('العنوان الشخصي للموظف :')} ${V(f.address)}</p>
    <div class="row2 mt">
      <div class="b">توقيع الموظف :</div>
      <div>${L('حرر ب :')} ${V(f.city)} ${L('في :')} ${D(f.date)}</div>
    </div>
    <div class="spacer-s"></div>
    <p class="mt">${L('رأي السيد المدير :')} ${V(f.opinion)}</p>
    <p>${L('تاريخ توقيف الموظف عن العمل :')} ${D(f.stopDate)}</p>
    <div class="tcap">جدول الرخص والتغيبات التي استفاد منها الموظف خلال 12 شهرا الأخيرة</div>
    <table class="tbl">
      <thead><tr><th style="width:22%">المدة</th><th style="width:20%">من</th><th style="width:20%">إلى</th><th>السبب</th></tr></thead>
      <tbody>${rows.map(r => `<tr><td>${r ? esc(r.duration) : ''}</td><td>${r ? fmtDate(r.from) : ''}</td><td>${r ? fmtDate(r.to) : ''}</td><td>${r ? esc(r.reason) : ''}</td></tr>`).join('')}</tbody>
    </table>
    <div class="row2 mt">
      <div>${L('حرر ب :')} ${V(f.city)} ${L('في :')} ${D(f.date2)}</div>
      <div class="c"><div class="b">توقيع رئيس المؤسسة :</div><div class="sigbox"></div></div>
    </div>`;
  };

  T.certificate = ({ s, e, f }) => {
    const fr = /الفرنسية/.test(f.certType || '');
    const line = (lab, val, frLab, frVal) => `<tr><td class="lbc">${lab}</td><td class="vc">${val}</td>${frLab !== undefined ? `<td class="frc">${fr ? LTR(`${frLab} : <b>${esc(frVal || '')}</b>`) : ''}</td>` : '<td></td>'}</tr>`;
    return `
    <div class="row2 top">
      <div class="b">الحمد لله وحده</div>
      <div>${V(f.city)} ${L('في :')} ${D(f.date)}</div>
    </div>
    <table class="kv mt">
      ${line('الاسم العائلي :', V(e.lastAr, 'b'), 'Nom', e.lastFr)}
      ${line('الاسم الشخصي :', V(e.firstAr, 'b'), 'Prénom', e.firstFr)}
      ${line('الرقم المالي :', V(e.ppr))}
      ${line('تاريخ الازدياد :', D(e.birth))}
      ${line('رقم ب.ت.و :', V(e.cin, 'ltr'))}
      ${line('تاريخ التوظيف :', D(e.hire))}
      ${line('الإطار :', V(e.cadre))}
      ${line('المهمة :', V(e.task))}
      ${line('مقر العمل الأصلي :', V(e.origin))}
      ${line('مؤسسة التكليف <sup>(1)</sup> :', V(e.assigned))}
    </table>
    <div class="addr">
      <div class="c b">إلــى</div>
      <div class="c">السيد المدير الإقليمي ل${esc(s.ministry)}</div>
      <div class="c">مصلحة الموارد البشرية</div>
      <div class="c">مكتب تتبع الحياة الإدارية للموظفين</div>
      <div class="c">${esc(s.directorate)}</div>
      <div class="c">تحت إشراف السيد مدير : <b>${esc(s.school)}</b></div>
    </div>
    <p class="mt">${L('الموضوع <sup>(2)</sup> :')} <b>طلب ${esc(f.certType || '')}</b></p>
    <p class="c b">سلام تام بوجود مولانا الإمام المؤيد بالله،</p>
    <p>وبعد،</p>
    <p class="j">يشرفني أن أطلب من سيادتكم موافاتي بالشهادة المذكورة في الموضوع أعلاه قصد الإدلاء بها ${esc(f.purpose || 'لأغراض إدارية')}.</p>
    <div class="row2 mt">
      <div class="c b">إمضاء الموظف :</div>
      <div class="c b">توقيع وطابع رئيس المؤسسة :</div>
    </div>
    <div class="spacer"></div>
    <div class="row2 small">
      <div></div>
      <div><div>${L('أرسل بتاريخ :')} ${D(f.sentDate)}</div><div>${L('تحت عدد :')} ${V(f.sentNo)}</div></div>
    </div>
    <div class="notes">
      <div>(1): ضرورة الإشارة إلى مؤسسة التكليف إذا كان المعني مكلفا خارج مقر عمله الأصلي.</div>
      <div>(2): في حالة طلب وثيقة باللغة الفرنسية ينبغي الإشارة إلى ذلك في الموضوع مع كتابة الاسم الكامل بالحروف اللاتينية.</div>
      <div>* يعتمد هذا المطبوع لطلب شهادة إدارية واحدة.</div>
    </div>`;
  };

  const RESUME_CASES = [
    'استئناف العمل بعد الاستيداع', 'استئناف العمل بعد الإلحاق', 'استئناف العمل بعد رخصة الأبوة',
    'استئناف العمل بعد رخصة الولادة', 'استئناف العمل بعد رخصة استثنائية',
    'استئناف العمل بعد رخصة مرض قصيرة الأمد', 'استئناف العمل بعد رخصة مرض متوسطة الأمد',
    'استئناف العمل بعد رخصة مرض طويلة الأمد', 'استئناف العمل بعد انهاء تكليف بمهمة',
    'استئناف العمل بعد تغيب أو انقطاع عن العمل'
  ];

  // 1.9.3: every absence reason of «الغياب والرخص» that has no case of its own is added to the cases of the form (and a custom reason typed there when it is the chosen one)
  // 1.9.4: the cases printed on the «محضر استئناف العمل» are exactly the twenty cases of the administration (10 base + these 10, in this order);
  // the other reasons stay proposed in the field «استأنف عمله بعد» and, when chosen, are added as their own ticked line
  const RESUME_EXTRA_REASONS = ['رخصة أغراض شخصية', 'غياب غير مبرر', 'إذن بالتغيب', 'رخصة سنوية', 'رخصة الحج', 'رخصة الدراسة',
    'رخصة التكوين أو التداريب', 'المشاركة في امتحان أو مباراة', 'التوقيف عن العمل', 'الإضراب عن العمل'];
  const RESUME_MORE_REASONS = ['رخصة استثنائية للزواج', 'رخصة استثنائية لوفاة قريب', 'رخصة استثنائية لزواج أحد الأبناء', 'رخصة استثنائية لختان الابن', 'رخصة التبني', 'حادثة شغل', 'حادثة مصلحة'];
  const extraCase = r => 'استئناف العمل بعد ' + r;
  const casesWith = (base, f) => { const l = base.concat(RESUME_EXTRA_REASONS.map(extraCase)); if (f && f.case && !l.includes(f.case)) l.push(f.case); return l; };
  const resumeCases = f => casesWith(RESUME_CASES, f);

  T.resume = ({ s, e, f }) => `
    ${header(s)}
    <div class="title-box">محضر استئناف العمل</div>
    <div class="airy${resumeCases(f).length > 16 ? ' tt' : ''}">
    <p>${L('أنا الموقع أسفله :')} ${V(s.director, 'b')}</p>
    <p>${L('أشهد أن السيد (ة) :')}</p>
    <div class="grid2 ind">
      <div>${L('الاسم الشخصي :')} ${V(e.firstAr, 'b')}</div><div>${LTR(`Prénom : <b>${esc(e.firstFr || '')}</b>`)}</div>
      <div>${L('الاسم العائلي :')} ${V(e.lastAr, 'b')}</div><div>${LTR(`Nom : <b>${esc(e.lastFr || '')}</b>`)}</div>
      <div>${L('الإطار :')} ${V(e.cadre)}</div><div>${L('الدرجة :')} ${V(e.grade)}</div>
      <div>${L('رقم التأجير :')} ${V(e.ppr)}</div><div>${L('بطاقة التعريف الوطنية :')} ${V(e.cin, 'ltr')}</div>
    </div>
    <p class="mt">${L('قد استأنف(ت) عمله(ها) بتاريخ :')} ${D(f.resumeDate, 'b')} &nbsp; ${L('بعد :')} ${V(f.afterType, 'b')}</p>
    <p>${L('لمدة :')} ${V(f.duration)} &nbsp; ${L('من :')} ${D(f.from)} &nbsp; ${L('إلى :')} ${D(f.to)}</p>
    <p>${L('المهام الإدارية أو التربوية :')} ${V(e.task)}</p>
    <p>${L('العنوان الشخصي :')} ${V(e.address)}</p>
    <p>${L('الهاتف :')} ${V(e.phone, 'ltr')}</p>
    <p class="l">${L('حرر في :')} ${V(f.city)} &nbsp; ${L('بتاريخ :')} ${D(f.date)}</p>
    </div>
    <div class="boxes grow${resumeCases(f).length > 16 ? ' sm' : ''}">
      <div class="box"><div class="b">توقيع المعني (ة) بالأمر :</div></div>
      <div class="box"><div class="b">توقيع وملاحظة الرئيس المباشر :</div></div>
    </div>
    <div class="b mt small">مختلف الحالات :</div>
    <div class="cases${resumeCases(f).length > 16 ? ' c3' : ''}">${resumeCases(f).map(c => `<div>${CB(f.case === c)} ${c}</div>`).join('')}</div>`;

  T.medical = ({ s, e, f }) => `
    ${header(s)}
    <div class="title-box">وصل استلام شهادة(ات) طبية</div>
    <div class="airy2">
    <p>${L('أنا الممضي أسفله :')} ${V(s.director, 'b')}</p>
    <p>${L('مدير مؤسسة :')} ${V(s.school, 'b')}</p>
    <p>${L('أشهد أني تسلمت بتاريخ :')} ${D(f.receivedDate, 'b')} &nbsp; ${L('من طرف السيد (ة) :')} ${V(f.deliveredBy)}</p>
    <p>${L('شهادة طبية مسلمة من الطبيب السيد (ة) :')} ${V(f.doctor)}</p>
    <p>${L('مدتها :')} ${V(f.duration, 'b')} &nbsp; ${L('ابتداء من :')} ${D(f.from, 'b')} &nbsp; ${L('إلى :')} ${D(f.to, 'b')}</p>
    <div class="grid2">
      <div>${L('تتعلق بالسيد (ة) :')} ${V(fullName(e), 'b')}</div><div>${L('الرقم المالي :')} ${V(e.ppr)}</div>
      <div>${L('الإطار :')} ${V(e.cadre)}</div><div>${L('مادة التدريس :')} ${V(e.subject)}</div>
    </div>
    <p>${L('العنوان الشخصي أثناء فترة المرض :')} ${V(f.sickAddress)}</p>
    <p class="mt">${L('ملاحظات :')} ${V(f.notes)}</p>
    <p class="l">${L('حرر بتاريخ :')} ${D(f.date)}</p>
    </div>
    <div class="boxes tall">
      <div class="box"><div class="b">توقيع وخاتم الرئيس المباشر :</div></div>
      <div class="box"><div class="b">توقيع المدلي بالشهادة (ات) الطبية :</div>
        <div class="foot">${L('رقم بطاقة تعريفه الوطنية :')} ${V(f.delivererCin, 'ltr')}</div></div>
    </div>`;

  /* Monthly absence list: A4 portrait page */
  T.monthly = ({ s, f, rows }) => {
    const list = (rows || []).slice();
    const n = Math.max(20, list.length);
    let body = '';
    for (let i = 0; i < n; i++) {
      const r = list[i];
      body += `<tr><td>${i + 1}</td><td>${r ? esc(r.ppr) : ''}</td><td class="nm">${r ? esc(r.name) : ''}</td><td class="cd">${r ? esc(r.cadre) : ''}</td>
        <td>${r ? fmtDate(r.from) : ''}</td><td>${r ? fmtDate(r.to) : ''}</td><td>${r ? esc(r.days) : ''}</td><td class="rs">${r ? esc(r.reason) : ''}</td></tr>`;
    }
    const mi = +(f.month || 1) - 1;
    return `
    ${header(s, 'مصلحة الموارد البشرية')}
    <div class="title-box wide">لائحة التتبع الشهري للغياب خلال شهر : ${MONTHS[mi] || ''} ${esc(f.year || '')}</div>
    <p>${L('المؤسسة :')} ${V(s.school, 'b')}</p>
    <table class="tbl mtab">
      <thead>
        <tr><th rowspan="2" style="width:6%">ر.ت</th><th rowspan="2" style="width:11%">رقم التأجير</th><th rowspan="2">الاسم الكامل</th><th rowspan="2" style="width:17%">الإطار</th>
          <th colspan="2">فترة الغياب</th><th rowspan="2" style="width:7%">المدة بالأيام</th><th rowspan="2" style="width:17%">سبب التغيب</th></tr>
        <tr><th style="width:10%">من</th><th style="width:10%">إلى</th></tr>
      </thead>
      <tbody>${body}</tbody>
    </table>
    ${list.length === 0 ? `<p class="c b mt">لا شيء يذكر</p>` : ''}
    <div class="row2 mt2">
      <div class="small">
        <div>* ملحوظة : ترسل هذه اللائحة إلى المديرية في اليوم الرابع من الشهر الموالي${s.email ? `، وعبر البريد الإلكتروني : <span dir="ltr">${esc(s.email)}</span> في اليوم الأخير من كل شهر` : ''}.</div>
      </div>
      <div class="c">
        <div>${L('وحرر في :')} ${V(f.city)} ${L('بتاريخ :')} ${D(f.date)}</div>
        <div class="b mt">توقيع وطابع السيد مدير المؤسسة :</div>
      </div>
    </div>`;
  };

  const TYPES = {
    leave: { title: 'طلب رخصة', icon: '📝', desc: 'رخصة مرضية، أغراض شخصية، استثنائية أو ولادة', absence: true, cat: 'leave', quick: true },
    medical: { title: 'وصل استلام شهادة طبية', icon: '🩺', desc: 'تسلم الشهادة الطبية من الموظف', absence: 'رخصة مرضية', cat: 'leave', quick: true },
    monthly: { title: 'لائحة التتبع الشهري للغياب', icon: '📅', desc: 'تُحتسب تلقائيا من سجل الغياب', page: 'a4', cat: 'leave', quick: true },
    inquiry: { title: 'استفسار', icon: '❓', desc: 'استفسار عن التغيب بدون إشعار', absence: 'غياب غير مبرر', cat: 'work', quick: true },
    resume: { title: 'محضر استئناف العمل', icon: '✅', desc: 'بعد انتهاء رخصة أو تغيب', cat: 'work', quick: true },
    certificate: { title: 'طلب شهادة', icon: '📄', desc: 'شهادة العمل أو بيان الالتزام', cat: 'cert', quick: true }
  };

  const CSS = `
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Regular.ttf');font-weight:400}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Medium.ttf');font-weight:500}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-SemiBold.ttf');font-weight:600}
  @font-face{font-family:'NSA';src:url('fonts/NotoSansArabic-Bold.ttf');font-weight:700}
  @font-face{font-family:'Amiri';src:url('fonts/Amiri-Regular.ttf');font-weight:400}
  @font-face{font-family:'Amiri';src:url('fonts/Amiri-Bold.ttf');font-weight:700}
  @font-face{font-family:'Tif';src:url('fonts/NotoSansTifinagh-Regular.ttf');font-weight:400}
  /* 1.9.2: «Sakkal Majalla» (font of Windows) everywhere; Noto Sans Arabic / Amiri when it is missing */
  @font-face{font-family:'MAJ';src:local('Sakkal Majalla'),local('SakkalMajalla');font-weight:400 500;size-adjust:128%}
  @font-face{font-family:'MAJ';src:local('Sakkal Majalla Bold'),local('SakkalMajalla-Bold');font-weight:600 800;size-adjust:128%}
  @font-face{font-family:'MAJT';src:local('Sakkal Majalla Bold'),local('SakkalMajalla-Bold');font-weight:600 800;size-adjust:120%}
  @font-face{font-family:'MAJT';src:local('Sakkal Majalla'),local('SakkalMajalla');font-weight:400 500;size-adjust:120%}
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:#fff}
  body{font-family:'MAJ','NSA','Segoe UI',Tahoma,Arial,sans-serif;color:#000;direction:rtl;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .sheet{width:297mm;height:209.5mm;display:flex;flex-direction:row;overflow:hidden;page-break-after:always;break-after:page}
  .sheet:last-child{page-break-after:auto;break-after:auto}
  .copy{width:148.5mm;height:209.5mm;padding:7mm 8mm 6mm;font-size:9.6pt;line-height:1.62;display:flex;flex-direction:column;overflow:hidden}
  .sheet .copy+.copy{border-right:1px dashed #999}
  .sheet.single{width:210mm;height:296.5mm}
  .sheet.single .copy{zoom:1.4141}
  .sheet.two-a4{width:297mm;height:209.5mm}
  .copy-a4{flex:none;width:148.5mm;height:209.5mm;overflow:hidden;position:relative}
  .sheet.two-a4 .copy-a4+.copy-a4{border-right:1px dashed #999}
  .copy-a4 .page-a4{position:absolute;top:0;right:0;zoom:.7066}
  .page-a4{width:210mm;height:296.5mm;padding:10mm 12mm;font-size:10.5pt;line-height:1.6;display:flex;flex-direction:column;overflow:hidden}
  p{margin:0 0 1.2mm}
  .hdr{border-bottom:1.4px solid #000;padding-bottom:1.2mm;margin-bottom:2mm}
  .hdr-g{display:grid;grid-template-columns:1fr 17mm 1fr;align-items:start;column-gap:1.5mm}
  .hdr-txt{text-align:center;font-weight:600;container-type:inline-size;--fs:7pt;--fsk:9pt;--lh:3.55mm;--lhk:4.6mm}
  .hdr-txt>div{white-space:nowrap;overflow:hidden;height:var(--lh);line-height:var(--lh)}
  .hdr-txt>div.k{font-family:'MAJT','Amiri',serif;font-weight:700;height:var(--lhk);line-height:var(--lhk)}
  .hdr-tif{font-family:'Tif','MAJ','NSA',sans-serif;font-weight:400;--fs:6.8pt;--fsk:8.4pt}.hdr-tif>div.k{font-family:'Tif',sans-serif;font-weight:400}
  .hdr-emb{text-align:center}.hdr-emb img{width:17mm;height:auto}
  .hdr-sch2{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:10pt;line-height:1.3;margin-top:.6mm}
  .hdr .srv{text-align:center;font-weight:500;font-size:7pt;margin-top:.3mm}
  .page-a4 .hdr-g{grid-template-columns:1fr 24mm 1fr}.page-a4 .hdr-emb img{width:24mm}.page-a4 .hdr-txt{--fs:9pt;--fsk:11pt;--lh:4.5mm;--lhk:5.8mm}.page-a4 .hdr-tif{--fs:8.6pt;--fsk:10pt}.page-a4 .hdr-sch2{font-size:12pt}.page-a4 .hdr .srv{font-size:8.5pt}
  .hdr-img{margin:-7mm -8mm 2mm}.srv-l{text-align:center;font-weight:600;font-size:8pt;margin:-1mm 0 1.5mm;border-bottom:1px solid #000;padding-bottom:1mm}.hdr-img img{width:100%;height:auto;display:block}
  /* 1.9: the letterhead image always spans the whole width of the page (right to left), whatever the page type */
  .page-a4 .hdr-img{margin:-10mm -12mm 2mm}.page-a4 .hdr-img img{width:100%;height:auto;max-height:80mm;object-fit:fill}
  /* 1.9.2 header (wave + brown line); 1.9.3: font chosen in the settings */
  .hdr-img.lhn .lh-l{display:none!important}.page-a4l .hdr-img.lhn:not(.one) .lh-p{display:none!important}.page-a4l .hdr-img.lhn .lh-l{display:block!important}
  .hdr-img.lhn img.lh-p,.hdr-img.lhn img.lh-l{object-fit:contain!important;margin:0 auto}
  .hv2{border-bottom:.55mm solid #a3461a;padding-bottom:1mm;margin-bottom:2.2mm;position:relative}
  .hdr-wave{display:block;width:calc(100% + 16mm);height:3.2mm;margin:-4.6mm -8mm .6mm}
  .page-a4 .hdr-wave{width:calc(100% + 24mm);height:4.6mm;margin:-7.6mm -12mm .6mm}.page-a4l .hdr-wave{width:calc(100% + 22mm);height:4mm;margin:-6mm -11mm .5mm}
  .vis-a4 .hdr-wave{width:calc(100% + 20mm);margin:-6mm -10mm .5mm}.half .hdr-wave{width:calc(100% + 24mm);margin:0 -12mm .6mm}
  .hv2 .hdr-g{grid-template-columns:1fr 18mm 1fr;align-items:center;column-gap:2mm}
  .hv2 .hdr-txt{font-weight:700;color:#2c4c76;--lh:3.06mm;--fs:9.2pt}
  .hv2 .hdr-txt>div{white-space:nowrap;overflow:hidden;height:var(--lh);line-height:var(--lh);font-size:min(var(--fs),var(--fit))}
  .hv2 .hdr-ar{font-family:var(--hf,'MAJT','Amiri',serif)}
  .hv2 .hdr-tif{font-family:'Tif',sans-serif;font-weight:700;--fs:7.2pt;direction:ltr;-webkit-text-stroke:.012em currentColor}
  .hv2 .hdr-sch2{font-family:var(--hf,'MAJT','Amiri',serif);color:#1d3f86;font-weight:700;font-size:10.5pt;margin-top:.4mm}
  .hv2 .srv{color:#1d3f86}
  .page-a4 .hv2 .hdr-g{grid-template-columns:1fr 31mm 1fr}.page-a4 .hv2 .hdr-emb img{width:31mm}.page-a4 .hv2 .hdr-txt{--lh:5.25mm;--fs:15.5pt}.page-a4 .hv2 .hdr-tif{--fs:11.6pt}.page-a4 .hv2 .hdr-sch2{font-size:14pt}
  .page-a4l .hv2 .hdr-g{grid-template-columns:1fr 25mm 1fr;max-width:205mm;margin:0 auto}.page-a4l .hv2 .hdr-emb img{width:25mm}.page-a4l .hv2 .hdr-txt{--lh:4.25mm;--fs:12.6pt}.page-a4l .hv2 .hdr-tif{--fs:9.6pt}.page-a4l .hv2 .hdr-sch2{font-size:12.5pt}
  .hv2 .hdr-emb img{width:18mm}
  .title-box{align-self:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:15pt;border:1.6px solid #000;border-radius:3mm;padding:0 7mm;margin:1mm 0 3mm;line-height:1.5}
  .title-box.wide{font-size:13pt}
  .subtitle{text-align:center;font-weight:700;text-decoration:underline;margin-bottom:1.5mm}
  .lb{font-weight:600}
  .v{font-weight:400;padding:0 1mm}
  .v.b{font-weight:700}
  .v.ltr{direction:ltr;unicode-bidi:isolate;display:inline-block}
  .v.empty{display:inline-block;min-width:24mm;border-bottom:1px dotted #555;height:1em;vertical-align:baseline}
  .b{font-weight:700}.c{text-align:center}.l{text-align:left}.j{text-align:justify}
  .mt{margin-top:2mm}.mt2{margin-top:3.5mm}.ind{padding-right:4mm}
  .small{font-size:8pt;line-height:1.5}
  .row2{display:grid;grid-template-columns:1fr 1fr;gap:3mm;align-items:start;margin-bottom:1.2mm}
  .row2.top{margin-bottom:2mm}
  .to{padding-right:6mm}
  .grid2{display:grid;grid-template-columns:1.25fr 1fr;column-gap:3mm;row-gap:.3mm;margin-bottom:1.2mm}
  .types{margin:1mm 0 1.6mm}.opt{margin-inline-start:3mm;white-space:nowrap}
  .cb{display:inline-block;width:3.6mm;height:3.6mm;border:1.2px solid #000;text-align:center;line-height:3.3mm;font-size:8pt;font-weight:700;vertical-align:middle;margin-left:.6mm}
  .spacer{flex:1 1 auto;min-height:3mm}.spacer-s{flex:.5 1 auto;min-height:1mm}
  .cut{border-top:1.2px dashed #000;margin:2mm 0 2mm;position:relative}.cut span{position:absolute;top:-2.6mm;left:2mm;background:#fff;font-size:9pt;padding:0 1mm}
  .tcap{text-align:center;font-weight:700;font-size:8.6pt;margin:1.5mm 0 1mm}
  .tbl{width:100%;border-collapse:collapse;font-size:8.6pt;line-height:1.3}
  .tbl th,.tbl td{border:1px solid #000;padding:.9mm 1mm;text-align:center;height:5.6mm}
  .tbl th{background:#ececec;font-weight:700}
  .mtab{font-size:9pt}.mtab td{height:7.2mm}.mtab td.nm{text-align:right}.mtab td.cd,.mtab td.rs{font-size:8pt}
  .sigbox{height:13mm}
  .kv{width:100%;border-collapse:collapse}.kv td{padding:.15mm 0;vertical-align:baseline}
  .kv .lbc{font-weight:600;width:33%;white-space:nowrap}.kv .frc{text-align:left;width:30%;font-size:8.8pt}
  .ltr{unicode-bidi:isolate}
  .addr{margin:3mm 0 1mm;line-height:1.55}
  .notes{border-top:1px solid #000;padding-top:1mm;font-size:7.4pt;line-height:1.5;margin-top:1.5mm}
  .boxes{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:1.5mm}
  .box{border:1px solid #000;min-height:17mm;padding:1mm 2mm;font-size:8.8pt;display:flex;flex-direction:column}
  .airy{line-height:1.7}.airy p{margin-bottom:1.1mm}.airy2{line-height:2.05}.airy2 p{margin-bottom:2.6mm}
  .boxes.grow .box{min-height:24mm}
  .airy.tt{line-height:1.5}.airy.tt p{margin-bottom:.5mm}.boxes.grow.sm .box{min-height:21mm}
  .boxes.tall .box{min-height:42mm}.box .foot{margin-top:auto;font-size:8.4pt}
  .cases{display:grid;grid-template-columns:1fr 1fr;column-gap:3mm;font-size:7.8pt;line-height:1.75}
  .cases .cb{width:3.2mm;height:3.2mm;line-height:2.9mm;font-size:7pt}
  .cases.c3{grid-template-columns:1fr 1fr 1fr;column-gap:2mm;font-size:6.9pt;line-height:1.5}.cases.c3 .cb{width:2.8mm;height:2.8mm;line-height:2.5mm;font-size:6pt}
  sup{font-size:65%}
  @page{size:A4 landscape;margin:0}
  `;

  /* Build a complete HTML document. mode: 'two' | 'single' */
  function buildDocHtml(type, ctx, opts) {
    opts = opts || {};
    const base = opts.base || '';
    const tpl = T[type];
    const isA4 = TYPES[type].page === 'a4';
    let body, pageCss;
    if (isA4 && opts.mode === 'two') {
      // 1.9.3: a full-page (A4) document can also be printed twice on one landscape A4 sheet: each copy is the page reduced to A5
      const one = i => `<div class="copy-a4"><div class="page-a4 ${TYPES[type].pageClass || ''}">${tpl(Object.assign({}, ctx, { copy: i }))}</div></div>`;
      body = `<div class="sheet two-a4">${one(0)}${one(1)}</div>`;
      pageCss = '@page{size:A4 landscape;margin:0}';
    } else if (isA4) {
      body = `<div class="page-a4 ${TYPES[type].pageClass || ''}">${tpl(ctx)}</div>`;
      pageCss = '@page{size:A4 portrait;margin:0}';
    } else if (opts.mode === 'single') {
      body = `<div class="sheet single"><div class="copy">${tpl(Object.assign({}, ctx, { copy: 0 }))}</div></div>`;
      pageCss = '@page{size:A4 portrait;margin:0}';
    } else {
      body = `<div class="sheet"><div class="copy">${tpl(Object.assign({}, ctx, { copy: 0 }))}</div><div class="copy">${tpl(Object.assign({}, ctx, { copy: 1 }))}</div></div>`;
      pageCss = '@page{size:A4 landscape;margin:0}';
    }
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${base ? `<base href="${base}">` : ''}
      <title>${esc(TYPES[type].title)}</title><style>${CSS}${window.Docs.fontCss || ''}${window.Docs.extraCss || ''}${pageCss}</style></head><body>${body}</body></html>`;
  }
  const isLandscape = (type, opts) => (TYPES[type].page === 'a4' ? !!(opts && opts.mode === 'two') : !(opts && opts.mode === 'single'));

  /* Digit strings are always read left to right (phone numbers, RIB / bank and postal accounts, IBAN, dates typed with spaces, signed
     amounts). Inside right-to-left text the browser puts every space-separated group of digits in its own run and reverses their order
     («0661 65 48 11» showed «48 11 65 0661»; «-1 234,50» showed «1 234,50-»). This wraps each such string, in the text of the finished page
     only (never in tags, styles, scripts or SVG), in a left-to-right isolate. Applied last, after any wording customisation, so the saved
     text of a document is untouched. */
  const NG = '(?:[A-Za-z]{0,4}\\d+(?:[.,/-]\\d+)*[A-Za-z]?)';       // 0661 | 1 234,50 | 12/11/2025 | MA64 | 1027682w
  const NUM_RUN = new RegExp(`(?<![\\w\\u0600-\\u06FF])(?:[+\\u2212-]?\\(?${NG}\\)?(?:[ \\u00A0]\\(?${NG}\\)?)+|[+\\u2212-]${NG})(?!\\w)`, 'g');
  const HTML_TOKEN = /(<!--[\s\S]*?-->|<(style|script|title|textarea)\b[\s\S]*?<\/\2>)|<(\/?)([a-zA-Z][\w:-]*)[^>]*>|(&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]*);)|([^<&]+)|[<&]/gi;
  const LTR_OPEN = '<span style="direction:ltr;unicode-bidi:isolate">';
  function bidi(html) {
    if (typeof html !== 'string' || !/\d/.test(html)) return html;
    let svg = 0;
    return html.replace(HTML_TOKEN, (m, skip, _n, close, tag, ent, text) => {
      if (skip || ent) return m;
      if (tag) { if (tag.toLowerCase() === 'svg') { if (close) svg = Math.max(0, svg - 1); else if (!/\/>$/.test(m)) svg++; } return m; }
      if (text === undefined || svg) return m;
      return text.replace(NUM_RUN, r => LTR_OPEN + r + '</span>');
    });
  }

  /* Generic multi-page builder (stock & school certificates modules).
     page: 'a4' (portrait) | 'a4l' (landscape) | 'two' (2 x A5 on A4 landscape) | 'single' (A5 copy enlarged to A4)
     pages: array of page contents; for 'two'/'single' an item may be a function(copyIndex) */
  function buildRaw(o) {
    const page = o.page || 'a4';
    const cls = o.cls || '';
    const pages = (o.pages && o.pages.length ? o.pages : ['']);
    const run = (p, i) => (typeof p === 'function' ? p(i) : p);
    // 1.9.3: flowing documents (MK.flowPages) mark their pages with <!--cls:sb--> so the printed page gets the same class (font size, line height) as the measuring frame
    const mark = p => { const m = typeof p === 'string' && /^<!--cls:([\w -]+)-->/.exec(p); return m ? ' ' + m[1] : ''; };
    let body, pageCss;
    if (page === 'a4' || page === 'a4l') {
      body = pages.map(p => `<div class="${page === 'a4' ? 'page-a4' : 'page-a4l'} ${cls}${mark(p)}">${run(p, 0)}</div>`).join('');
      pageCss = `@page{size:A4 ${page === 'a4' ? 'portrait' : 'landscape'};margin:0}`;
    } else if (page === 'single') {
      body = pages.map(p => `<div class="sheet single"><div class="copy ${cls}">${run(p, 0)}</div></div>`).join('');
      pageCss = '@page{size:A4 portrait;margin:0}';
    } else {
      body = pages.map(p => `<div class="sheet"><div class="copy ${cls}">${run(p, 0)}</div><div class="copy ${cls}">${run(p, 1)}</div></div>`).join('');
      pageCss = '@page{size:A4 landscape;margin:0}';
    }
    const base = o.base ? `<base href="${o.base}">` : '';
    return `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8">${base}
      <title>${esc(o.title || '')}</title><style>${CSS}${window.Docs.fontCss || ''}${window.Docs.extraCss || ''}${window.Docs.modCss || ''}${pageCss}</style></head><body>${body}</body></html>`;
  }
  const rawLandscape = page => page === 'a4l' || page === 'two';

  window.Docs = { MONTHS, TYPES, RESUME_CASES, RESUME_EXTRA_REASONS, RESUME_MORE_REASONS, extraCase, casesWith, resumeCases, buildDocHtml, isLandscape, bidi, fmtDate, toDate, isoOf, daysBetween, durationText, fullName, todayIso, esc,
    T, V, D, L, CB, LTR, header, buildRaw, rawLandscape, headerLines, tifName, splitAcademy, regionOf, placeOfDir, HDR_STYLES, TIF };
})();
