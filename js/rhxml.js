'use strict';
/* 1.9.3 — استيراد معطيات الموظفين من ملفات XML المصدَّرة من منظومة Esise
   (الرئيسية Accueil ← وحدة الموارد البشرية Module RH ← تصدير Export): ملف DsAgentExport لكل وحدة مدرسية، اسمه رمز GRESA ثم التاريخ (04975G_20261009.xml).
   القراءة محلية تماما (DOMParser) دون أي اتصال أو تحميل خارجي. الملفات المتعددة تُدمج: الشخص الواحد بحسب رقم التأجير.
   window.RH = { parseText(text), build(files, opts), CADRES } */
(function () {
  const clean = s => String(s == null ? '' : s).replace(/ /g, ' ').replace(/\s+/g, ' ').trim();
  const pad2 = n => String(n).padStart(2, '0');
  const dt = s => { s = clean(s); const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s); return m && +m[1] > 1900 ? `${m[1]}-${m[2]}-${m[3]}` : ''; };
  const code = s => clean(s).toUpperCase().replace(/\s+/g, '');
  const num = s => clean(s).replace(/\.0+$/, '');

  /* ---------- reading one XML file ---------- */
  function recs(doc, tag) {
    return Array.from(doc.getElementsByTagNameNS('*', tag)).map(el => { const o = {}; Array.from(el.children).forEach(c => { o[c.localName] = clean(c.textContent); }); return o; });
  }
  function parseText(text) {
    text = String(text || '').replace(/^﻿/, '');
    if (/<!DOCTYPE|<!ENTITY/i.test(text)) return { error: 'unsafe' };
    const doc = new DOMParser().parseFromString(text, 'application/xml');
    if (doc.getElementsByTagName('parsererror').length) return { error: 'xml' };
    const root = doc.documentElement;
    if (!root || root.localName !== 'DsAgentExport') return { error: 'format' };
    const T = t => recs(doc, t);
    return { people: T('DATAIDENTIFPERSONNEL'), acts: T('ACTIVITE'), ts: T('R_TABSERV'), fonc: T('R_FONCT'), dips: T('R_DipSCol'), dipp: T('R_DipProf'), grades: T('R_GRADE') };
  }

  /* ---------- Arabic wording of the codes ---------- */
  // cadre code -> [Arabic masculine, feminine, French masculine, French feminine]
  const CADRES = {
    '110901': ['أستاذ التعليم الابتدائي', 'أستاذة التعليم الابتدائي', "Professeur de l'enseignement primaire", "Professeure de l'enseignement primaire", 'pri'],
    '110902': ['أستاذ التعليم الثانوي الإعدادي', 'أستاذة التعليم الثانوي الإعدادي', "Professeur de l'enseignement secondaire collégial", "Professeure de l'enseignement secondaire collégial", 'col'],
    '110903': ['أستاذ التعليم الثانوي التأهيلي', 'أستاذة التعليم الثانوي التأهيلي', "Professeur de l'enseignement secondaire qualifiant", "Professeure de l'enseignement secondaire qualifiant", 'lyc'],
    '110904': ['أستاذ مجاز بالتعليم الثانوي التأهيلي', 'أستاذة مجازة بالتعليم الثانوي التأهيلي', "Professeur agrégé de l'enseignement secondaire qualifiant", "Professeure agrégée de l'enseignement secondaire qualifiant", 'lyc'],
    '110203': ['معلم', 'معلمة', 'Instituteur', 'Institutrice', 'pri'],
    '110202': ['أستاذ السلك الأول من التعليم الثانوي', 'أستاذة السلك الأول من التعليم الثانوي', 'Professeur du premier cycle', 'Professeure du premier cycle', 'col'],
    '110201': ['أستاذ السلك الثاني من التعليم الثانوي', 'أستاذة السلك الثاني من التعليم الثانوي', 'Professeur du second cycle', 'Professeure du second cycle', 'lyc'],
    '111204': ['متصرف تربوي', 'متصرفة تربوية', 'Administrateur pédagogique', 'Administratrice pédagogique', ''],
    '111201': ['ملحق تربوي', 'ملحقة تربوية', 'Attaché pédagogique', 'Attachée pédagogique', ''],
    '111202': ['ملحق الاقتصاد والإدارة', 'ملحقة الاقتصاد والإدارة', "Attaché d'économie et d'administration", "Attachée d'économie et d'administration", ''],
    '111203': ['ملحق اجتماعي', 'ملحقة اجتماعية', 'Attaché social', 'Attachée sociale', ''],
    '111001': ['مقتصد', 'مقتصدة', 'Intendant', 'Intendante', ''],
    '111101': ['مستشار في التوجيه التربوي', 'مستشارة في التوجيه التربوي', "Conseiller en orientation de l'éducation", "Conseillère en orientation de l'éducation", ''],
    '111103': ['مستشار في التخطيط التربوي', 'مستشارة في التخطيط التربوي', "Conseiller en planification de l'éducation", "Conseillère en planification de l'éducation", ''],
    '111102': ['مفتش في التوجيه التربوي', 'مفتشة في التوجيه التربوي', "Inspecteur en orientation de l'éducation", "Inspectrice en orientation de l'éducation", ''],
    '111104': ['مفتش في التخطيط التربوي', 'مفتشة في التخطيط التربوي', "Inspecteur en planification de l'éducation", "Inspectrice en planification de l'éducation", ''],
    '110601': ['حارس الخارجية والداخلية', 'حارسة الخارجية والداخلية', "Surveillant d'externat et d'internat", "Surveillante d'externat et d'internat", '']
  };
  // grade label (French, from the grade table) -> «الدرجة» as the application writes it (الأولى، الثانية…)
  function gradeOf(label) {
    const g = String(label || '').toUpperCase();
    if (!g) return { grade: '', scale: '' };
    const sc = /ECHELLE\s*(\d+)/.exec(g);
    if (/HORS\s*(ECHELLE|GRADE|CADRE)/.test(g)) return { grade: 'خارج السلم', scale: '' };
    if (/EXCEPTIONNEL/.test(g)) return { grade: 'الممتازة', scale: '' };
    if (/(GR\.?|GRADE)\s*PRINCIPAL|PRINCIPAL/.test(g)) return { grade: 'الرئيسية', scale: '' };
    if (/\b1\s*ER\b|1ER|PREMIER\s*GRADE/.test(g)) return { grade: 'الأولى', scale: '' };
    if (/\b2\s*(EME|ME)\b|2EME|2ME/.test(g)) return { grade: 'الثانية', scale: '' };
    if (/\b3\s*(EME|ME)\b|3EME|GRADE\s*3/.test(g)) return { grade: 'الثالثة', scale: '' };
    if (/\b4\s*(EME|ME)\b|4EME/.test(g)) return { grade: 'الرابعة', scale: '' };
    return { grade: '', scale: sc ? sc[1] : '' };
  }
  const POS = { 10: 'في وضعية نشيطة', 11: 'وضع رهن الإشارة (حزب سياسي)', 12: 'وضع رهن الإشارة (نقابة)', 13: 'وضع رهن الإشارة', 14: 'وضع رهن الإشارة (هيئة أخرى)', 15: 'عطلة قصيرة الأمد', 16: 'عطلة متوسطة الأمد', 17: 'عطلة طويلة الأمد',
    18: 'عطلة إدارية', 19: 'عطلة الولادة', 20: 'إلحاق بالقطاع الخاص', 21: 'إلحاق بقطاع وزاري آخر', 22: 'إلحاق بمنظمة دولية', 23: 'إلحاق بهيئة أخرى', 24: 'إلحاق لدى مكتب', 25: 'إلحاق لدى دولة أجنبية', 26: 'إلحاق لمهمة عمومية', 27: 'تجديد الإلحاق',
    30: 'في حالة عدم الاستعداد (Disponibilité)', 31: 'تدريب', 32: 'تدريب بمركز التوجيه والتخطيط', 33: 'تدريب بمركز تكوين المفتشين', 34: 'تدريب بالمركز الجهوي لمهن التربية والتكوين', 35: 'تكوين سلك التبريز', 40: 'تحت الراية', 50: 'انتهاء الخدمة (تقاعد، عزل)',
    51: 'ترك الوظيفة', 52: 'غياب غير مبرر', 53: 'توقيف مؤقت', 54: 'وفاة', 55: 'انتهاء الإلحاق / الوضع رهن الإشارة', 60: 'منحدر من الأقاليم الجنوبية وغير نشيط' };
  const LEFT = new Set(['50', '51', '54', '55']);
  const MARITAL = { M: 'متزوج', C: 'أعزب', D: 'مطلق', V: 'أرمل' };
  const DISC_AR = { '0011': 'اللغة العربية', '0012': 'اللغة الفرنسية', '0013': 'اللغة الإنجليزية', '0014': 'اللغة الإسبانية', '0015': 'اللغة الألمانية', '0016': 'اللغة الإيطالية', '0017': 'اللغة الأمازيغية',
    '0018': 'الاجتماعيات', '0019': 'الرياضيات', '0020': 'علوم الحياة والأرض', '0023': 'الفيزياء والكيمياء', '0024': 'التربية الإسلامية', '0026': 'التربية البدنية', '0027': 'التربية الأسرية', '0028': 'التربية التشكيلية',
    '0029': 'التربية الموسيقية', '0030': 'المعلوميات', '0036': 'الفلسفة', '0037': 'الترجمة', '0035': 'التوثيق' };
  // teaching language of a service line / training option
  const LANG = { '0011': 'عربية', '0012': 'فرنسية', '0017': 'أمازيغية' };
  function lvlOf(c) {
    c = code(c); let m;
    if (c === '001') return { k: 0, t: 'أولي' };
    if ((m = /^10([1-6])$/.exec(c))) return { k: +m[1], t: m[1] };
    if ((m = /^2A([1-3])$/.exec(c))) return { k: 10 + +m[1], t: `${m[1]} إعدادي` };
    if (c === '3A1') return { k: 20, t: 'جذع مشترك' };
    if (c === '3A2') return { k: 21, t: '1 باك' };
    if (c === '3A3') return { k: 22, t: '2 باك' };
    if (c === '999') return { k: 30, t: 'أقسام الاحتياجات الخاصة' };
    return null;
  }
  const DIRECTOR_FN = /^(D012|D016|D017|D019|C042|C043|C044|C045)$/;
  const telOf = s => { s = clean(s).replace(/[^\d+]/g, ''); return /^[5-7]\d{8}$/.test(s) ? '0' + s : s; };

  /* ---------- build the people of one or several files ---------- */
  // files: [{ name, text }] -> { people:[{e, sex, left, sure, noAr, swapped, status, raw, unitCode, teachCode, codes:[], levels, pos, posLabel, gone}], inst, codes:[{code, n}], bad:[names] }
  function build(files, opts) {
    const bad = [], persons = new Map(), acts = new Map(), tsl = new Map();
    const FONC = new Map(), DIPS = new Map(), DIPP = new Map(), GRADES = new Map();
    const order = [];
    (files || []).forEach(f => {
      const x = parseText(f.text);
      if (x.error) { bad.push(f.name); return; }
      x.people.forEach(p => { if (p.PPR && !persons.has(num(p.PPR))) { persons.set(num(p.PPR), p); order.push(num(p.PPR)); } });
      x.acts.forEach(a => { if (a.CD_ACTIVITES && !acts.has(a.CD_ACTIVITES)) acts.set(a.CD_ACTIVITES, a); });
      x.ts.forEach(s => { const k = s.CD_TSERVICE || (s.CD_ACTIVITES + '|' + s.CD_NIVENS + '|' + s.CD_DISCIP); if (!tsl.has(k)) tsl.set(k, s); });
      x.fonc.forEach(r => FONC.set(r.CD_Fonc, r)); x.dips.forEach(r => DIPS.set(r.CD_DIPS, r)); x.dipp.forEach(r => DIPP.set(r.CD_DIPP, r)); x.grades.forEach(r => GRADES.set(r.CD_GRADE, r));
    });
    const actsOf = new Map();
    acts.forEach(a => { const k = num(a.PPR); if (!actsOf.has(k)) actsOf.set(k, []); actsOf.get(k).push(a); });
    const tsOf = new Map();
    tsl.forEach(s => { if (!tsOf.has(s.CD_ACTIVITES)) tsOf.set(s.CD_ACTIVITES, []); tsOf.get(s.CD_ACTIVITES).push(s); });
    const A = window.Agent;
    const people = [], codeCount = {}, dirCodes = {};
    order.forEach(ppr => {
      const d = persons.get(ppr);
      const sex = /^F/i.test(d.GENRE) ? 'F' : /^M/i.test(d.GENRE) ? 'M' : '';
      const raw = { nomAr: clean(d.NOMA), preAr: '', nomFr: clean(d.NOML), preFr: '', sex };
      const n = A.splitNames(raw);
      let { firstAr, lastAr } = n; const noAr = !firstAr && !lastAr;
      if (noAr) { firstAr = n.firstFr; lastAr = n.lastFr; }
      const myActs = actsOf.get(ppr) || [];
      // principal activity (administrative appointment) and the activity where the person really teaches (service lines)
      const princ = myActs.find(a => a.ACTIV_PRINC === 'true') || myActs.find(a => a.CD_ACTIVITES === d.CD_LAST_ACTIVITES) || myActs[0] || null;
      const lines = a => (tsOf.get(a.CD_ACTIVITES) || []);
      const teachActs = myActs.filter(a => lines(a).length);
      const main = princ && lines(princ).length ? princ : (teachActs[0] || princ);
      const others = teachActs.filter(a => a !== main);
      const levelsOf = a => { const seen = new Map(); lines(a).forEach(s => { const l = lvlOf(s.CD_NIVENS); if (l) seen.set(l.k, l.t); }); return Array.from(seen.entries()).sort((x, y) => x[0] - y[0]).map(x => x[1]); };
      const langsOf = a => { const g = new Set(); lines(a).forEach(s => { if (LANG[s.CD_DISCIP]) g.add(LANG[s.CD_DISCIP]); }); return g; };
      const unitCode = main ? code(main.CD_ETAB) : code(d.CD_LAST_ETAB);
      const adminCode = princ ? code(princ.CD_ETAB) : unitCode;
      const levels = main ? levelsOf(main).join('+') : '';
      const langs = main ? langsOf(main) : new Set();
      const teachLang = langs.size > 1 ? 'مزدوج' : langs.size === 1 ? Array.from(langs)[0] : '';
      // cadre / grade / function
      const cd = CADRES[clean(d.CD_CADRE)];
      const cadre = cd ? (sex === 'F' ? cd[1] : sex === 'M' ? cd[0] : cd[0].replace(/^(\S+)/, '$1(ة)')) : '';
      const cadreFr = cd ? (sex === 'F' ? cd[3] : cd[2]) : '';
      const gr = gradeOf((GRADES.get(clean(d.CD_GRADE)) || {}).LL_GRADE);
      const fnCode = main ? clean(main.CD_FONC) : clean(d.CD_LAST_FONC);
      const fr = FONC.get(fnCode) || {};
      let task = '';
      if (fnCode === 'E001') task = 'التدريس';
      else if (fnCode === 'E002') task = 'التدريس (في وضعية فائض)';
      else if (fnCode && fnCode !== '9999' && fnCode !== 'S000') { task = clean(fr.LA_Fonc); if (sex === 'F') task = task.replace(/^مدير(\s|$)/, 'مديرة$1').replace(/^مساعد(\s|$)/, 'مساعدة$1'); }
      if (DIRECTOR_FN.test(fnCode) && princ) dirCodes[code(princ.CD_ETAB)] = (dirCodes[code(princ.CD_ETAB)] || 0) + 1;
      const dips = DIPS.get(clean(d.CD_DIPS)) || {}, dipp = DIPP.get(clean(d.CD_DIPP)) || {};
      const cds = clean(d.CD_DIPS), cdp = clean(d.CD_DIPP);
      const diploma = cds && cds !== '33' ? clean(dips.LA_DIPS) : '';
      const proDiploma = cdp && cdp !== '00' ? clean(dipp.LA_DIPP) : '';
      const dDipS = dt(d.DT_DIPSCOL);
      const posCode = clean(d.CD_POSITION), posLabel = POS[+posCode] || '';
      const stt = clean(d.CD_STATUT);
      const other = others.map(a => { const l = levelsOf(a).join('+'); return { code: code(a.CD_ETAB), levels: l }; });
      const addr = [clean(d.ADRESSE), clean(d.VILLE)].filter((x, i, arr) => x && !(i === 1 && arr[0].includes(x))).join(' ');
      const e = {
        ppr, cin: code(d.CINA) + num(d.CINN), firstAr, lastAr, firstFr: n.firstFr, lastFr: n.lastFr, sex,
        birth: d.AN_NAIS && d.MOIS_NAIS && d.JOUR_NAIS ? `${d.AN_NAIS}-${pad2(d.MOIS_NAIS)}-${pad2(d.JOUR_NAIS)}` : '', birthPlace: clean(d.LIEU_NAIS),
        hire: dt(d.DATE_REC), tenure: dt(d.DT_TITUL), affDate: princ ? dt(princ.DT_AFF_ETAB) : '', dirDate: princ ? dt(princ.DT_AFF_PROV) : '', acadDate: princ ? dt(princ.DT_AFF_REG) : '',
        cadre, cadreFr, grade: gr.grade, scale: gr.scale, echelon: num(d.ECHELON), gradeDate: dt(d.DT_GRADE), echelonDate: dt(d.DT_ECHELON), task,
        subject: cd && cd[4] !== 'pri' && cd[4] && DISC_AR[clean(d.CD_DISCIP)] ? DISC_AR[clean(d.CD_DISCIP)] : '',
        formation: clean(d.CD_DISCIP) === '0011' ? 'معرب' : clean(d.CD_DISCIP) === '0012' ? 'مفرنس' : '',
        teachLang, levels, status: stt === '9' ? 'متعاقد' : (stt === '1' || stt === '2' || stt === '4') ? 'أصلي' : '',
        diploma, proDiploma, gradDate: dt(d.DT_DIPPROF), trainCenter: clean(d.VILLEFORM), marital: MARITAL[clean(d.SIT_FAM)] || '',
        address: addr, phone: telOf(d.TEL_PORTABLE), email: clean(d.ADRESSE_ELEC).toLowerCase(), position: posCode && posCode !== '10' ? posLabel : ''
      };
      if (cds === '05') e.licDate = dDipS; else if (cds === '03') e.bacDate = dDipS; else if (cds && cds !== '33' && dDipS) { e.otherCert = diploma; e.otherDate = dDipS; }
      Object.keys(e).forEach(k => { if (!e[k]) delete e[k]; });
      const left = LEFT.has(posCode) ? posLabel : '';
      if (!left) { codeCount[unitCode] = (codeCount[unitCode] || 0) + 1; }
      people.push({ e, sex, left, sure: n.sure && !noAr, noAr, swapped: n.swapped, status: stt, raw, unitCode, adminCode, other, posLabel: posCode && posCode !== '10' ? posLabel : '' });
    });
    // the institution code = the code of the director's activity, else the busiest unit
    const top = o => Object.keys(o).sort((a, b) => o[b] - o[a])[0] || '';
    const gresa = top(dirCodes) || top(codeCount);
    const codes = people.map(p => p.unitCode).concat(people.reduce((a, p) => a.concat(p.other.map(o => o.code)), [])).filter((c, i, a) => c && a.indexOf(c) === i)
      .map(c => ({ code: c, n: people.filter(p => p.unitCode === c && !p.left).length }));
    return { kind: 'rh', people, inst: { gresa }, codes, bad };
  }

  // «يدرّس كذلك بـ …» for the services given in another unit of the school
  const alsoText = (p, nameOf) => p.other.length ? 'يدرّس كذلك بـ: ' + p.other.map(o => `${nameOf(o.code)}${o.levels ? ' (المستويات ' + o.levels + ')' : ''}`).join('، ') : '';
  window.RH = { parseText, build, CADRES, gradeOf, POS, alsoText };
})();
