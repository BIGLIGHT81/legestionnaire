'use strict';
/* استيراد الموظفين من ملف agent الذي يُحمَّل من منصة «تبليغ»
   (Téléchargement de données > Source DRH > agent).
   window.Agent = { isAgent(rows), parse(rows, { today }), splitNames(...), SOURCE } */
(() => {
  const SOURCE = 'موقع تبليغ ← Téléchargement de données ← Source DRH ← agent';

  /* ---------- text helpers ---------- */
  const AR = s => String(s == null ? '' : s).normalize('NFC').replace(/[ً-ٰٟـ]/g, '')
    .replace(/[أإآٱ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();
  // empty markers used by the DRH export: '', ' ', '-', '.', '_'
  const clean = s => { s = String(s == null ? '' : s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim(); return /^[-._\s]*$/.test(s) ? '' : s; };
  const normDate = s => {
    s = String(s == null ? '' : s).trim(); if (!s) return '';
    if (/^\d+(\.\d+)?$/.test(s) && +s > 1000 && +s < 80000) return new Date(Math.round((+s - 25569) * 86400000)).toISOString().slice(0, 10);
    let m = /^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/.exec(s);
    if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`;
    m = /^(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/.exec(s);
    return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
  };
  const num = s => clean(s).replace(/\.0+$/, '');

  /* ---------- common Moroccan first names (to tell the first name from the family name) ---------- */
  const M_NAMES = `محمد امحمد أمحمد محمادي أحمد احماد حماد محمود مصطفى المصطفى يوسف إبراهيم ابراهيم براهيم إسماعيل اسماعيل علي عمر عثمان حسن الحسن لحسن حسين الحسين لحسين
    حمزة خالد رشيد سعيد سعد صالح صلاح جمال كمال هشام طارق ياسين يونس أيوب أنس أمين الأمين إدريس ادريس دريس إلياس الياس بلال توفيق جواد حميد حكيم خليل رضوان رضى رضا
    زكرياء زكريا زهير سفيان سمير شكيب عادل عزيز عماد فؤاد فيصل كريم لطفي مراد مهدي المهدي منير نبيل نجيب نوفل هاشم وليد ياسر يحيى أسامة أشرف أكرم أنور أيمن بدر
    بوشعيب بوجمعة الجيلالي جلال حسام حفيظ الحبيب حبيب خليفة رحال رمضان سليمان سلمان شعيب صابر طه الطاهر الطيب العربي علال العياشي الغالي فاروق فريد قاسم القاسم مبارك امبارك
    محسن مختار المختار مروان المعطي منصف موسى ناصر عيسى بوبكر أبوبكر الصديق الصادق العباس عباس عصام وائل هيثم زياد رياض رامي مازن باسم حاتم نزار مالك معاد معاذ آدم
    عمران إسحاق يعقوب داود سليم شريف الشريف بوعزة بناصر الكبير المكي حمادي الحاج ايدر يدير ماسين اكسيل يوبا مسعود عدي باها محند امحند عبدو عبدالله أحمد_أمين
    عبد_الله نور_الدين صلاح_الدين عز_الدين جمال_الدين بدر_الدين خير_الدين نصر_الدين محي_الدين سيف_الدين علاء_الدين شمس_الدين زين_العابدين محمد_أمين محمد_علي محمد_رضا
    محمد_ياسين محمد_الأمين أبو_بكر حسن_علي العربي إسماعيل عزالدين نورالدين صلاح الدين حسني رشيد الحسان التهامي الفاطمي الهاشمي المحجوب محجوب الميلودي ميلود الصافي المامون
    مامون العلمي سعيد ابراهيم بنعيسى البشير بشير الحسين امبارك لهوسين بلعيد العربي الطاهر البوهالي مولود الحبيب حمو احمادو أوعلي إبراهيم عبد_الرحيم عبد_الرحمان عبد_الكريم`;
  const F_NAMES = `فاطمة فاطنة فطومة فاطمة_الزهراء خديجة عائشة عيشة مريم زينب أمينة مينة نعيمة حكيمة سميرة سعيدة رشيدة سناء سهام سلمى سارة سكينة سعاد سمية صفاء هدى هند هاجر
    حنان حسناء حياة حليمة حفيظة خلود دنيا رجاء رحمة رقية زهرة الزهرة زهور زكية سلوى سليمة شيماء صباح ضحى عزيزة غزلان غيثة فدوى فتيحة فوزية فرح كريمة كوثر لبنى لطيفة
    ليلى ليلي لمياء مليكة منال منى مونية ماجدة نادية ناديا نجاة نجوى نزهة نوال نورة نور_الهدى نهيلة نهاد هناء وفاء وداد وئام ياسمين ياسمينة يسرى يمنى أسماء أسية آسية إيمان
    إلهام أمال آمال ابتسام إكرام بشرى بهيجة جميلة حورية حسنية خيرة ربيعة زبيدة سعدية السعدية شفيقة صفية عتيقة العالية عواطف كلثوم أم_كلثوم مباركة امباركة محجوبة ميلودة
    نجية يامنة طامو إيطو يطو تودة حادة زينة صوفيا إيناس ملاك هبة آية أية ريم رانيا لينا دعاء مروة أميمة شروق سهى جيهان بثينة نسرين كنزة وصال سهيلة ثورية رحيمة حبيبة فريدة
    نبيلة مجيدة حميدة وردة زهيرة صليحة نصيرة منيرة بديعة فضيلة نزيهة نفيسة سعيدة خديجة فاطمة_الزهرة نورا نورة_الهدى أسماء سلمى حسنة حسناء حنان صبرينة سارة ماريا
    مارية أسماء عزيزة حياة نجاة نعيمة الباتول البتول بتول مليكة لالة_فاطمة شامة الشامة إجة رابحة تاجة يزة تلايتماس تيليلا تودا أمال سهام رشيدة`;
  const X_NAMES = 'نور إيمان';
  const NAMES = new Map();
  const add = (list, g) => list.split(/\s+/).filter(Boolean).forEach(n => { const k = AR(n.replace(/_/g, ' ')); if (!NAMES.has(k)) NAMES.set(k, g); });
  add(M_NAMES, 'M'); add(F_NAMES, 'F'); add(X_NAMES, 'X');
  const SUFFIX = new Set(['الدين', 'الله', 'الزهراء', 'الزهره', 'العابدين', 'الهدي', 'الاسلام', 'الحق', 'الرحمان', 'الرحمن', 'الرحيم', 'اليقين', 'الايمان'].map(AR));
  const PREFIX = new Set(['عبد', 'ابو', 'مولاي', 'سيدي', 'لالة', 'ام', 'بن', 'ابن', 'بنت', 'ايت', 'نايت', 'اولاد', 'ولد', 'اوت'].map(AR));
  function fnGender(chunk) {
    const n = AR(chunk);
    if (!n) return null;
    if (NAMES.has(n)) return NAMES.get(n);
    const w = n.split(' ');
    if (/^عبد/.test(n) && n.replace(/ /g, '').length > 4) return 'M';
    if (w[0] === 'مولاي' || w[0] === 'سيدي') return 'M';
    if (w[0] === AR('لالة')) return 'F';
    if (w.length === 1 && /(الدين|الله)$/.test(n) && n.length > 5) return 'M';
    if (w.length > 1 && SUFFIX.has(w[w.length - 1])) { const g = NAMES.get(w.slice(0, -1).join(' ')); return g || (w[w.length - 1] === AR('الزهراء') ? 'F' : 'M'); }
    if (w.length > 1 && w.every(x => NAMES.has(x))) return w.some(x => NAMES.get(x) === 'F') ? 'F' : 'M';
    return null;
  }
  const compat = (g, sex) => !sex || g === 'X' || g === sex;
  // Arabic words -> name chunks (عبد الله، نور الدين، فاطمة الزهراء، نايت اكرض... stay together)
  function chunks(full) {
    const w = clean(full).split(' ').filter(Boolean), out = [];
    for (let i = 0; i < w.length; i++) {
      let c = w[i];
      while (PREFIX.has(AR(w[i])) && i + 1 < w.length) { i++; c += ' ' + w[i]; }
      while (i + 1 < w.length && SUFFIX.has(AR(w[i + 1]))) { i++; c += ' ' + w[i]; }
      out.push(c);
    }
    return out;
  }

  /* ---------- phonetic skeletons (Arabic <-> Latin spelling of the same name) ---------- */
  const AR_MAP = { 'ب': 'B', 'پ': 'B', 'ت': 'T', 'ث': 'T', 'ج': 'J', 'ح': 'H', 'خ': 'K', 'د': 'D', 'ذ': 'D', 'ر': 'R', 'ز': 'Z', 'ژ': 'Z', 'س': 'S', 'ش': 'X',
    'ص': 'S', 'ض': 'D', 'ط': 'T', 'ظ': 'Z', 'غ': 'K', 'ف': 'F', 'ڤ': 'F', 'ق': 'K', 'ك': 'K', 'گ': 'K', 'ڭ': 'K', 'ل': 'L', 'م': 'M', 'ن': 'N', 'ه': 'H' };
  const dedup = s => s.replace(/(.)\1+/g, '$1');
  function skAr(word, keepArticle) {
    let w = AR(word).replace(/\s+/g, '');
    if (!keepArticle && /^ال/.test(w) && w.length > 3) w = w.slice(2);
    let o = ''; for (const c of w) if (AR_MAP[c]) o += AR_MAP[c];
    return dedup(o);
  }
  const ARTICLES = new Set(['el', 'al', 'l', 'ed', 'es', 'et', 'ez', 'er', 'en', 'ad', 'as', 'at', 'az']);
  function skFr(text) {
    return dedup(String(text || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').split(/[^a-z]+/).filter(x => x && !ARTICLES.has(x)).join('')
      .replace(/tch/g, 'X').replace(/ch|sh/g, 'X').replace(/kh/g, 'K').replace(/gh/g, 'K').replace(/ph/g, 'F').replace(/th/g, 'T').replace(/dj/g, 'J')
      .replace(/ou/g, '').replace(/g(?=[eiy])/g, 'J').replace(/c(?=[eiy])/g, 'S').replace(/[cqkg]/g, 'K').replace(/x/g, 'KS').replace(/v/g, 'F').replace(/p/g, 'B')
      .replace(/[bdfhjlmnrstz]/g, c => c.toUpperCase()).replace(/[a-z]/g, ''));
  }
  function lev(a, b) {
    const d = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      let prev = d[0]; d[0] = i;
      for (let j = 1; j <= b.length; j++) { const t = d[j]; d[j] = Math.min(d[j] + 1, d[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = t; }
    }
    return d[b.length];
  }
  const sim = (a, b) => (!a || !b) ? 0 : 1 - lev(a, b) / Math.max(a.length, b.length);
  // best similarity of a Latin text with an Arabic name (any word / chunk / whole, with or without the article)
  function simArFr(arParts, fr) {
    const f = skFr(fr); if (!f) return 0;
    const cands = new Set();
    arParts.forEach(p => {
      [false, true].forEach(k => { cands.add(skAr(p, k)); p.split(' ').forEach(w => cands.add(skAr(w, k))); });
    });
    const all = arParts.join(' ');
    cands.add(all.split(' ').map(w => skAr(w)).join('')); cands.add(skAr(all, true));
    let best = 0; cands.forEach(c => { best = Math.max(best, sim(c, f)); });
    return best;
  }

  /* ---------- split the Arabic and French names ---------- */
  function splitAr(nom, pre, sex, frNom, frPre) {
    nom = clean(nom); pre = clean(pre);
    if (nom && pre) {
      // DRH fields are sometimes inverted (الاسم الشخصي في خانة النسب): swap only on clear evidence
      const gN = fnGender(nom), gP = fnGender(pre);
      const okN = !!gN && compat(gN, sex), okP = !!gP && compat(gP, sex);
      if (okN && !okP) return { first: nom, last: pre, sure: true, swapped: true };
      return { first: pre, last: nom, sure: true };
    }
    const full = nom || pre;
    if (!full) return { first: '', last: '', sure: false };
    const ch = chunks(full);
    if (ch.length < 2) return { first: '', last: full, sure: false };
    let best = null;
    const score = (F, L, prefix) => {
      let s = prefix ? 0.5 : 0, ev = 0;
      const fg = F.map(fnGender);
      if (fg.every(Boolean)) { const ok = fg.every(g => compat(g, sex)); s += ok ? 3 : -1.5; if (ok) ev++; }
      s -= 0.8 * (F.length - 1);
      if (L.map(fnGender).every(g => g && compat(g, sex))) s -= 1;
      if (frPre) { const a = simArFr(F, frPre), b = simArFr(L, frNom); s += 4 * a + 2 * b; if (a >= 0.6) ev++; }
      if (!best || s > best.s) best = { s, first: F.join(' '), last: L.join(' '), sure: ev > 0 };
    };
    for (let k = 1; k < ch.length; k++) { score(ch.slice(0, k), ch.slice(k), true); score(ch.slice(k), ch.slice(0, k), false); }
    return best;
  }
  const FR_PART = new Set(['el', 'al', 'l', 'ben', 'bel', 'bou', 'ait', 'nait', 'ould', 'abd', 'abdel', 'abdou', 'moulay', 'sidi', 'lalla', 'oum', 'ibn', 'bent', 'ou', 'oulad']);
  function frGroups(text, side) {
    const w = clean(text).split(' ').filter(Boolean), out = [];
    for (let i = 0; i < w.length; i++) {
      let c = w[i];
      while (FR_PART.has(w[i].toLowerCase()) && i + 1 < w.length) { i++; c += ' ' + w[i]; }
      out.push({ t: c, side });
    }
    return out;
  }
  function splitFr(nom, pre, ar) {
    nom = clean(nom); pre = clean(pre);
    const G = frGroups(nom, pre ? 'L' : null).concat(frGroups(pre, 'F'));
    if (!G.length) return { first: '', last: '', sure: false };
    const F = ar.first ? chunks(ar.first) : [], L = ar.last ? chunks(ar.last) : [];
    if (F.length && L.length) {
      G.forEach(g => {
        const a = simArFr(F, g.t), b = simArFr(L, g.t);
        g.to = a >= 0.5 && a > b + 0.05 ? 'F' : b >= 0.5 && b > a + 0.05 ? 'L' : null;
      });
      G.forEach((g, i) => { if (!g.to) g.to = g.side || (G[i - 1] && G[i - 1].to) || (G.slice(i + 1).find(x => x.to) || {}).to || null; });
      const fi = G.filter(g => g.to === 'F'), la = G.filter(g => g.to === 'L');
      if (fi.length && la.length && G.every(g => g.to)) return { first: fi.map(g => g.t).join(' '), last: la.map(g => g.t).join(' '), sure: true };
    }
    if (pre) return { first: pre, last: nom, sure: !!(F.length && L.length) };
    if (G.length === 1) return { first: '', last: nom, sure: false };
    return { first: '', last: nom, sure: false };
  }
  function splitNames(r) {
    const ar = splitAr(r.nomAr, r.preAr, r.sex, clean(r.nomFr), clean(r.preFr));
    const fr = splitFr(r.nomFr, r.preFr, ar);
    return { firstAr: ar.first, lastAr: ar.last, firstFr: fr.first, lastFr: fr.last, sure: !ar.swapped && ar.sure && (fr.sure || !(clean(r.nomFr) || clean(r.preFr))), swapped: !!ar.swapped };
  }

  /* ---------- file reading ---------- */
  const H = h => String(h == null ? '' : h).trim().toUpperCase().replace(/\s+/g, '_');
  function headerRow(rows) {
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const hs = (rows[i] || []).map(H);
      if ((hs.includes('COD_AG') || hs.includes('PPR_NUM')) && (hs.includes('NOM_AR') || hs.includes('NOM_FR'))) return i;
    }
    return -1;
  }
  const isAgent = rows => headerRow(rows || []) >= 0;

  const DISCIP = { FRANCAIS: 'اللغة الفرنسية', ARABE: 'اللغة العربية', AMAZIGHIA: 'اللغة الأمازيغية', AMAZIGH: 'اللغة الأمازيغية', ANGLAIS: 'اللغة الإنجليزية',
    ESPAGNOL: 'اللغة الإسبانية', ALLEMAND: 'اللغة الألمانية', ITALIEN: 'اللغة الإيطالية', MATHEMATIQUES: 'الرياضيات', MATHS: 'الرياضيات', PHYSIQUE: 'الفيزياء والكيمياء',
    'PHYSIQUE CHIMIE': 'الفيزياء والكيمياء', 'SCIENCES PHYSIQUES': 'الفيزياء والكيمياء', SVT: 'علوم الحياة والأرض', 'SCIENCES DE LA VIE ET DE LA TERRE': 'علوم الحياة والأرض',
    'EDUCATION ISLAMIQUE': 'التربية الإسلامية', 'HISTOIRE GEOGRAPHIE': 'الاجتماعيات', 'HISTOIRE ET GEOGRAPHIE': 'الاجتماعيات', PHILOSOPHIE: 'الفلسفة', INFORMATIQUE: 'المعلوميات',
    'EDUCATION PHYSIQUE': 'التربية البدنية', EPS: 'التربية البدنية', 'EDUCATION PHYSIQUE ET SPORTIVE': 'التربية البدنية', 'EDUCATION ARTISTIQUE': 'التربية التشكيلية',
    'ARTS PLASTIQUES': 'التربية التشكيلية', 'EDUCATION FAMILIALE': 'التربية الأسرية', TECHNOLOGIE: 'التكنولوجيا', 'EDUCATION MUSICALE': 'التربية الموسيقية', TRADUCTION: 'الترجمة' };
  const CYCLE = c => { c = String(c || '').toUpperCase();
    if (/PRIM/.test(c)) return ['التعليم الابتدائي', "l'enseignement primaire"];
    if (/COLL|ESGC|INTERM|PREP/.test(c)) return ['التعليم الثانوي الإعدادي', "l'enseignement secondaire collégial"];
    if (/QUAL|LYC|ESQ/.test(c)) return ['التعليم الثانوي التأهيلي', "l'enseignement secondaire qualifiant"];
    if (/PRESCO|PRE-SCO|PRE_SCO/.test(c)) return ['التعليم الأولي', "l'enseignement préscolaire"];
    return null; };

  function parse(rows, opts) {
    const today = (opts && opts.today) || new Date().toISOString().slice(0, 10);
    const hi = headerRow(rows || []);
    if (hi < 0) return null;
    const hs = rows[hi].map(H);
    const col = name => hs.indexOf(name);
    const people = [], counts = {};
    const tally = (k, v) => { if (!v) return; counts[k] = counts[k] || {}; counts[k][v] = (counts[k][v] || 0) + 1; };
    rows.slice(hi + 1).forEach(r => {
      if (!r || !r.some(x => clean(x))) return;
      const g = name => { const i = col(name); return i < 0 ? '' : clean(r[i]); };
      const ppr = num(g('PPR_NUM')) || num(g('COD_AG'));
      const raw = { nomAr: g('NOM_AR'), preAr: g('PRENOM_AR'), nomFr: g('NOM_FR'), preFr: g('PRENOM_FR'), sex: /^F/i.test(g('SEX')) ? 'F' : /^M/i.test(g('SEX')) ? 'M' : '' };
      if (!ppr && !raw.nomAr && !raw.nomFr) return;
      const n = splitNames(raw);
      let { firstAr, lastAr } = n;
      const noAr = !firstAr && !lastAr;
      if (noAr) { firstAr = n.firstFr; lastAr = n.lastFr; }
      const affFrom = normDate(g('DATE_DEBUT_AFF')), affTo = normDate(g('DATE_FIN_AFF'));
      const death = normDate(g('DATE_DECES')), retire = normDate(g('DAT_RET_REEL'));
      let left = '';
      if (death) left = 'متوفى';
      else if (affTo && affTo < today) left = retire && retire <= affTo ? 'متقاعد' : 'انتهى تعيينه بالمؤسسة';
      else if (retire && retire < today) left = 'متقاعد';
      const dFr = g('LL_DISCIP').toUpperCase(), dAr = g('LA_DISCIP'), dCode = num(g('CD_DISCIPLINE'));
      const realDiscip = (dFr || dAr) && !/AUTRE/.test(dFr) && dCode !== '9999' && !/أخرى|اخرى/.test(dAr);
      const subject = realDiscip ? (dAr && /[؀-ۿ]/.test(dAr) && !/^\s*$/.test(dAr) ? dAr : (DISCIP[dFr] || g('LL_DISCIP'))) : '';
      const cyc = CYCLE(g('LL_CYCLE') || g('LA_CYCLE'));
      const cadre = realDiscip && cyc ? `${raw.sex === 'F' ? 'أستاذة' : 'أستاذ'} ${cyc[0]}` : '';
      const cadreFr = realDiscip && cyc ? `${raw.sex === 'F' ? 'Professeure' : 'Professeur'} de ${cyc[1]}` : '';
      const e = { ppr, cin: g('CIN').toUpperCase().replace(/\s+/g, ''), firstAr, lastAr, firstFr: n.firstFr, lastFr: n.lastFr, birth: normDate(g('DATE_NAISSANCE')),
        affDate: affFrom, sex: raw.sex, subject, cadre, cadreFr, address: g('ADRESSE_AR') || g('ADRESSE_FR'), phone: num(g('TEL')).replace(/^([5-7]\d{8})$/, '0$1') };
      Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
      people.push({ e, sex: raw.sex, left, sure: n.sure && !noAr, noAr, swapped: n.swapped, status: g('T_AGT'), raw });
      if (!left) { tally('school', g('LIBELLE_AR_AFF')); tally('schoolFr', g('LIBELLE_FR_AFF')); tally('gresa', g('CD_ETAB')); tally('commune', g('LIB_COMMUNE_AR')); tally('province', g('LIB_PROVINCE_AR'));
        tally('communeFr', g('LIB_COMMUNE_FR')); tally('provinceFr', g('LIB_PROVINCE_FR')); }
    });
    const top = k => { const o = counts[k] || {}; return Object.keys(o).sort((a, b) => o[b] - o[a])[0] || ''; };
    const up = t => String(t || '').toUpperCase().replace(/\s*-\s*/g, ' ').replace(/\s+/g, ' ').trim();
    return { people, inst: { school: top('school'), schoolFr: up(top('schoolFr')), gresa: top('gresa'), commune: top('commune'), city: top('commune'), province: top('province'),
      cityFr: up(top('communeFr')), directorateFr: top('provinceFr') ? 'DIRECTION PROVINCIALE ' + up(top('provinceFr')) : '' } };
  }

  // gender suggested by a full name (pupils without «الجنس»): one known first name, or several of the same gender
  function genderOfName(full) { const gs = new Set(chunks(full).map(fnGender).filter(g => g && g !== "X")); return gs.size === 1 ? Array.from(gs)[0] : ""; }
  window.Agent = { SOURCE, isAgent, parse, splitNames, fnGender, genderOfName, chunks, skAr, skFr, sim };
})();
