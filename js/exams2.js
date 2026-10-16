'use strict';
/* 1.9.4 — «تدبير الامتحانات الإشهادية» الذكي، لجميع الأسلاك (السادس ابتدائي، الثالثة إعدادي، الأولى والثانية باكالوريا):
   طبقة فوق exams.js تجمع خصائص تطبيقات مراكز الامتحان المتداولة (Gestion Exam / GesExmPrim / تطبيقات Excel للامتحان المحلي والإقليمي):
   - التوزيع الذكي للمترشحين على القاعات (حسب اللائحة، أبجديا، بالأقسام، بالمزج بين المؤسسات الأصلية، حسب المسالك، بالتناوب ذكور/إناث) مع أرقام الطاولات؛
   - التوزيع الذكي للمراقبين: لا يحرس الأستاذ(ة) في مادة تخصصه، احترام عدم التوفر، العدالة في الحصص وأنصاف الأيام، التناوب على القاعات،
     تفادي تكرار نفس الثنائي، المزج بين المؤسسات الأصلية، مع تقرير العدالة؛
   - المساعد الذكي (مراقبة الجاهزية واكتشاف التعارضات) في رأس صفحة الامتحان؛
   - الأرقام السرية للتصحيح (جدول رفع السرية، الملصقات، أوراق التنقيط، إدخال النقط بالأرقام السرية ورفع السرية آليا)؛
   - ملف نقط مسار «نقط الامتحان حسب مركز الامتحان»: يُستورد فارغا ويُعاد معبأ بالنقط والتغيبات دون المس بباقي محتواه؛
   - وثائق جديدة: واجهات الأظرفة (عدد الأوراق + 10%)، إقرار تسلم الأظرفة، تكليفات بإشعار الاستلام، استدعاءات الأطر، البادجات، لوائح الأساتذة
     حسب المادة، بطائق المترشحين، دعوة الأولياء، ورقة غياب مترشح، إحصاء المترشحين، ملصقات (نصف التوقيت، منع الهاتف، تعليمات المترشح،
     النصوص القانونية للغش، التشوير، مهام المراقبين)، ومحاضر مركز التصحيح.
   Data (لكل موسم، داخل DB.exams.years[sy]): secretMap { mode, by: { [si|'all']: { [no]: secret } } }, massar { name, b64, sheet, hi, rows, cols } */
(function () {
  if (!window.Exams || !Exams.X) return;
  const X = Exams.X, Dx = window.Docs, { esc } = Dx, { SB, tr, thr, tbl } = window.K;
  const { Y, info, cands, subjects, rooms, staff, guardRows, byRoom, sub, signHead, C, isF, examTitle, levelName, add, kv, roomPages, sessLabel, sessOf, sortRooms, f2, rng, subjOpts, subjIdx, sjDate, gCount, pb, dots, nm, num } = X;
  const DOCS = X.DOCS;
  const docOf = k => DOCS.find(d => d.k === k);
  const persistSoon = () => { clearTimeout(persistSoon.t); persistSoon.t = setTimeout(() => persist(), 200); };

  /* ================= helpers ================= */
  // canonical subjects of a text (to compare the subject of an exam with the subject a teacher teaches)
  const SUBJ_RX = [['ar', /عربي/], ['fr', /فرنسي|fran[cç]ais/i], ['en', /إنجليزي|انجليزي|انكليزي|anglais/i], ['es', /إسباني|اسباني|espagnol/i], ['de', /ألماني|الماني|allemand/i],
    ['math', /رياضيات|math/i], ['pc', /فيزياء|كيمياء|physique/i], ['svt', /علوم الحياة|الأرض|svt/i], ['isl', /إسلامي|اسلامي|islamique/i], ['hg', /اجتماعيات|تاريخ|جغرافيا|histoire/i],
    ['phil', /فلسف|philo/i], ['sci', /النشاط العلمي|activit[eé] scientifique/i], ['tech', /تكنولوجيا|technolog/i], ['eps', /البدنية|eps/i], ['info', /معلوميات|informatique/i], ['amz', /أمازيغي|امازيغي|amazigh/i],
    ['eco', /اقتصاد|تدبير|محاسب/], ['tr', /ترجمة/]];
  const keysOf = t => new Set(SUBJ_RX.filter(([, rx]) => rx.test(String(t || ''))).map(([k]) => k));
  const share = (a, b) => { for (const k of a) if (b.has(k)) return true; return false; };
  const subjOfStaff = r => { const e = K.E && K.E.byName ? K.E.byName(r[0]) : null; return [r[2], e && e.subject].filter(Boolean).join(' '); };
  // the sessions a person is not available for: «2,5» «3-4» «2 و 6»
  const unavail = t => { const out = new Set(); String(t || '').replace(/(\d+)\s*[-–]\s*(\d+)/g, (m, a, b) => { for (let i = +a; i <= +b; i++) out.add(i); return ''; }).replace(/\d+/g, d => { out.add(+d); return ''; }); return out; };
  const tMin = t => { const m = /(\d{1,2})\s*[:hHس.]\s*(\d{0,2})/.exec(nm(t)); return m ? +m[1] * 60 + (+m[2] || 0) : null; };
  const halfOf = sj => `${sj[1] || '?'}|${(tMin(sj[2]) == null ? 0 : tMin(sj[2])) < 13 * 60 ? 'ص' : 'م'}`;
  const tracksOf = sj => String(sj[5] || '').split(/[،,;+\/]| و /).map(nm).filter(Boolean);
  const trackHit = (c, sj) => { const T = tracksOf(sj); if (!T.length) return true; const t = nm(c[C.track]); return !t || T.some(x => t.includes(x) || x.includes(t)); };
  const candsOfSubj = (sy, si) => { const sj = subjects(sy)[si] || []; return cands(sy).filter(c => trackHit(c, sj)); };
  // the rooms used in a session: the rooms of the candidates concerned by the subject
  const roomsOfSubj = (sy, si) => { const R = rooms(sy).map(r => nm(r[0])); const L = candsOfSubj(sy, si); if (!L.some(c => nm(c[C.room]))) return R; const used = new Set(L.map(c => nm(c[C.room])).filter(Boolean)); return R.filter(r => used.has(r)).concat(Array.from(used).filter(r => !R.includes(r))); };
  const staffRows = sy => staff(sy);
  const isGuard = r => /مراقب|احتياط/.test(r[3] || 'مراقب') && !/الجودة/.test(r[3] || '');
  const S0 = () => S();
  const cutLine = '<div class="ex-cut"></div>';
  const hdr = s => `<div class="mk-hdr">${Dx.header(s)}</div>`;
  const today = () => K.ldate(Dx.todayIso());
  const rnd = seed => { let x = (seed >>> 0) || 1; return () => { x ^= x << 13; x >>>= 0; x ^= x >> 17; x ^= x << 5; x >>>= 0; return x / 4294967296; }; };
  const hash = s => { let h = 2166136261; for (const ch of String(s)) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; } return h; };

  /* ================= 1. smart distribution of the candidates over the rooms ================= */
  const MODES = [['order', 'ترتيب اللائحة كما هي'], ['alpha', 'الترتيب الأبجدي للأسماء'], ['cls', 'حسب الأقسام ثم الأسماء'], ['mix', 'المزج بين المؤسسات الأصلية (لا يجلس تلميذان من نفس المؤسسة متجاورين)'],
    ['track', 'حسب المسالك / الشعب (قاعات لكل مسلك)'], ['gender', 'التناوب ذكور / إناث'], ['code', 'حسب الرقم الوطني (مسار)']];
  const byName = (a, b) => nm(a[C.name]).localeCompare(nm(b[C.name]), 'ar');
  function ordered(L, mode) {
    L = L.slice();
    if (mode === 'alpha') return L.sort(byName);
    if (mode === 'code') return L.sort((a, b) => nm(a[C.code]).localeCompare(nm(b[C.code])));
    if (mode === 'cls') return L.sort((a, b) => nm(a[C.cls]).localeCompare(nm(b[C.cls]), 'ar', { numeric: true }) || byName(a, b));
    if (mode === 'track') return L.sort((a, b) => nm(a[C.track]).localeCompare(nm(b[C.track]), 'ar') || byName(a, b));
    if (mode === 'gender') { const M = L.filter(c => !isF(c[C.g])).sort(byName), F = L.filter(c => isF(c[C.g])).sort(byName), o = []; while (M.length || F.length) { if (M.length) o.push(M.shift()); if (F.length) o.push(F.shift()); } return o; }
    if (mode === 'mix') {
      const g = new Map(); L.forEach(c => { const k = nm(c[C.origin]) || '—'; if (!g.has(k)) g.set(k, []); g.get(k).push(c); });
      const G = Array.from(g.values()).map(a => a.sort(byName)).sort((a, b) => b.length - a.length), o = []; let last = null;
      while (G.some(a => a.length)) {
        G.sort((a, b) => b.length - a.length);
        const pick = G.find(a => a.length && a !== last) || G.find(a => a.length);
        o.push(pick.shift()); last = pick;
      }
      return o;
    }
    return L;
  }
  function smartDistribute(sy, c) {
    const R = rooms(sy), F = Y(sy).rooms || {}, mode = F.mode || 'order';
    const L = (Y(sy).cands.rows || []).filter(r => nm(r[1]) || nm(r[2]));
    if (!R.length) return c.toast('أدخل القاعات وسعتها أولا (خطوة «القاعات وتوزيع أرقام الامتحان»)', true);
    if (!L.length) return c.toast('لا يوجد مترشحون بعد', true);
    const cap = r => Math.max(1, parseInt(r[1], 10) || 20), total = R.reduce((t, r) => t + cap(r), 0);
    if (total < L.length) return c.toast(`سعة القاعات (${total}) أقل من عدد المترشحين (${L.length}): أضف قاعة أو زد السعة`, true);
    // rooms reserved for a track first, then the others in their order
    const left = ordered(L, mode), seats = new Map(R.map(r => [nm(r[0]), []]));
    R.filter(r => nm(r[2])).forEach(r => { const t = nm(r[2]); for (let i = 0; i < left.length && seats.get(nm(r[0])).length < cap(r);) { const x = left[i]; if (nm(x[C.track]) && (nm(x[C.track]).includes(t) || t.includes(nm(x[C.track])))) { seats.get(nm(r[0])).push(x); left.splice(i, 1); } else i++; } });
    R.forEach(r => { const S2 = seats.get(nm(r[0])); while (S2.length < cap(r) && left.length) S2.push(left.shift()); });
    // inside each room, the seats follow the chosen order again (the reserved rooms and the cut between rooms must not put two pupils of the same school side by side)
    if (mode === 'mix' || mode === 'gender') R.forEach(r => seats.set(nm(r[0]), ordered(seats.get(nm(r[0])), mode)));
    // balance: no almost empty last room (spread the candidates evenly over the rooms needed, when every room is equal and no track is reserved)
    if (F.balance === '1' && !R.some(r => nm(r[2]))) {
      const need = R.filter(r => seats.get(nm(r[0])).length).length, all = R.slice(0, need).reduce((a, r) => a.concat(seats.get(nm(r[0]))), []);
      const per = Math.ceil(all.length / Math.max(1, need)); R.slice(0, need).forEach((r, i) => seats.set(nm(r[0]), all.slice(i * per, (i + 1) * per)));
    }
    let first = parseInt(info(sy).first, 10); if (!isFinite(first)) first = 1;
    let n = first;
    const renum = F.renum !== '0';
    R.forEach(r => seats.get(nm(r[0])).forEach((x, i) => { if (renum) x[C.no] = String(n++); x[C.room] = nm(r[0]); x[C.desk] = String(i + 1); }));
    // the order of the candidates list follows the exam numbers
    Y(sy).cands.rows = L.slice().sort((a, b) => (parseInt(a[C.no], 10) || 0) - (parseInt(b[C.no], 10) || 0));
    persist(); c.toast(`تم توزيع ${L.length} مترشحا على ${R.filter(r => seats.get(nm(r[0])).length).length} قاعة (${MODES.find(m => m[0] === mode)[1]})`);
  }
  const roomsDoc = docOf('rooms');
  if (roomsDoc) {
    roomsDoc.init = () => ({ rows: [['1', '20', ''], ['2', '20', '']], mode: 'order', renum: '1', balance: '' });
    roomsDoc.d = 'القاعات وسعتها، ثم التوزيع الذكي للمترشحين وترقيمهم (أبجديا، بالأقسام، بالمزج بين المؤسسات، حسب المسالك...) مع رقم الطاولة.';
    roomsDoc.defs = () => [{ k: 'rows', l: 'القاعات', t: 'grid', cols: ['القاعة', 'السعة (عدد المترشحين)', 'قاعة خاصة بمسلك (اختياري)'], widths: ['.8fr', '.8fr', '1.4fr'], types: ['text', 'num', 'text'] },
      { k: 'mode', l: 'طريقة التوزيع', t: 'select', opts: MODES }, { k: 'renum', l: 'أرقام الامتحان', t: 'select', opts: [['1', 'ترقيم جديد ابتداء من «أول رقم امتحان»'], ['0', 'الاحتفاظ بأرقام الامتحان الحالية (ملف GEXA)']], half: true },
      { k: 'balance', l: 'التوازن بين القاعات', t: 'select', opts: [['', 'ملء القاعات بالترتيب'], ['1', 'توزيع متساو على القاعات المستعملة']], half: true },
      { t: 'html', html: '<button type="button" class="btn sm pri" data-act="dist">التوزيع الذكي للمترشحين على القاعات</button>' },
      { note: 'رقم الطاولة = ترتيب المترشح داخل قاعته. القاعة الخاصة بمسلك تُملأ أولا بمترشحي ذلك المسلك (مثال: مسار دولي، علوم رياضية...).' }];
    roomsDoc.act = { dist: (f, sy, c) => { smartDistribute(sy, c); c.redraw && c.redraw(); } };
  }
  const candsDoc = docOf('cands');
  if (candsDoc && candsDoc.act) candsDoc.act.dist = (f, sy, c) => { smartDistribute(sy, c); f.rows = Y(sy).cands.rows; c.redraw && c.redraw(); };

  /* ================= 2. smart distribution of the invigilators ================= */
  function smartGuards(sy, f, c) {
    const ss = subjects(sy), pool = staffRows(sy).filter(isGuard);
    if (!ss.length || !rooms(sy).length) return c.toast('أدخل جدولة الامتحان والقاعات أولا', true);
    if (pool.length < 2) return c.toast('أضف المراقبين في «طاقم مركز الامتحان» (المهمة: مراقب(ة) الإجراء)', true);
    const per = Math.max(1, parseInt(f.per, 10) || 2), reserve0 = Math.max(0, parseInt(f.reserve, 10) || 0);
    const rule = { own: f.own !== '0', mix: f.mix !== '0', rot: f.rot !== '0', gender: f.gmix === '1', half: f.half === '1' };
    // 1.9.4 (Gestion Exam V26.11): the reserves of each subject — a number per subject, or a percentage of the rooms of the session (نسبة الاحتياط)
    const resOf = (sj, si) => { const o = (f.resBy || []).find(r => nm(r[0]) && nm(r[0]) === nm(sj[0])); const v = o ? parseInt(o[1], 10) : NaN; if (isFinite(v) && v >= 0) return v;
      if (f.resMode === 'pct') return Math.ceil(roomsOfSubj(sy, si).length * Math.max(0, num(f.resPct) || 0) / 100); return reserve0; };
    const pri = info(sy).level === 'P6';
    // primary (polyvalent teachers): the teacher of a 6th-level class does not guard the candidates of his own school
    const roomOrig = new Map(); cands(sy).forEach(c => { const k = nm(c[C.room]); if (!roomOrig.has(k)) roomOrig.set(k, new Set()); roomOrig.get(k).add(nm(c[C.origin]) || nm(S().school)); });
    const teachesP6 = r => { const e = K.E && K.E.byName ? K.E.byName(r[0]) : null; return /6|السادس/.test([e && e.levels, r[2]].filter(Boolean).join(' ')); };
    const P = pool.map(r => ({ p6: pri && teachesP6(r), n: nm(r[0]), keys: pri ? new Set() : keysOf(subjOfStaff(r)), off: unavail(r[5]), wp: nm(r[4]), g: (() => { const e = K.E && K.E.byName ? K.E.byName(r[0]) : null; return (e && e.sex) || (/أنثى|انثى|^F$/i.test(nm(r[6])) ? 'F' : /ذكر|^M$/i.test(nm(r[6])) ? 'M' : ''); })(), load: 0, halves: new Set(), rooms: new Map(), mates: new Map(), resv: 0 }));
    const rand = rnd(hash(sy + P.map(p => p.n).join('|')));
    P.forEach(p => { p.tie = rand(); });
    // look-ahead: the sessions still open to each person (a teacher who cannot guard the last subjects is called earlier)
    P.forEach(p => { p.rem = ss.map((x, i) => ss.slice(i + 1).filter((sj, j) => !p.off.has(i + j + 2) && !(rule.own && share(p.keys, keysOf(sj[0])))).length); });
    const rows = [], warn = [];
    ss.forEach((sj, si) => {
      const busy = new Set(), hk = halfOf(sj), sk = keysOf(sj[0]);
      const ok = (p, strict, room) => !busy.has(p.n) && !p.off.has(si + 1) && (!strict || !rule.half || !p.halves.has(hk)) && (!strict || !rule.own || (pri ? !(p.p6 && room && (roomOrig.get(room) || new Set()).has(p.wp || nm(S().school))) : !share(p.keys, sk)));
      const score = (p, room, mate) => p.load * 20 + (p.halves.has(hk) ? 0 : 3) + p.halves.size + p.rem[si] * 0.8 + (rule.rot ? (p.rooms.get(room) || 0) * 3 : 0)
        + (mate ? (p.mates.get(mate.n) || 0) * 6 + (rule.mix && p.wp && p.wp === mate.wp ? 3 : 0) + (rule.gender && p.g && mate.g && p.g === mate.g ? 2 : 0) : 0) + p.tie;
      const pick = (room, mate) => {
        let L = P.filter(p => ok(p, true, room)), forced = false;
        if (!L.length) { L = P.filter(p => ok(p, false, room)); forced = !!L.length; }
        L.sort((a, b) => score(a, room, mate) - score(b, room, mate));
        const p = L[0]; if (!p) return null;
        busy.add(p.n); p.load++; p.halves.add(hk); p.rooms.set(room, (p.rooms.get(room) || 0) + 1);
        if (mate) { p.mates.set(mate.n, (p.mates.get(mate.n) || 0) + 1); mate.mates.set(p.n, (mate.mates.get(p.n) || 0) + 1); }
        if (forced) warn.push(`${p.n}: ${sj[0]}`);
        return { p, forced };
      };
      roomsOfSubj(sy, si).forEach(room => {
        const a = pick(room, null), b = per > 1 ? pick(room, a && a.p) : null;
        const why = pri ? 'تلاميذ مؤسسته' : 'مادته', note = [a && a.forced ? `⚠ ${a.p.n}: ${why}` : '', b && b.forced ? `⚠ ${b.p.n}: ${why}` : ''].filter(Boolean).join(' — ');
        rows.push([String(si + 1), room, a ? a.p.n : '', b ? b.p.n : '', note || (a && b ? '' : '⚠ نقص في المراقبين')]);
      });
      for (let k = 0, reserve = resOf(sj, si); k < reserve; k++) { const a = pick('احتياط', null); if (a) { a.p.resv++; rows.push([String(si + 1), 'احتياط', a.p.n, '', '']); } }
    });
    f.rows = rows; c.save && c.save('rows');
    const loads = P.map(p => p.load), mn = Math.min(...loads), mx = Math.max(...loads);
    c.toast(`تم التوزيع الذكي: ${rows.length} سطرا — الحصص لكل مراقب من ${mn} إلى ${mx}${warn.length ? ` — ${warn.length} حالة اضطرارية (${pri ? 'تلاميذ مؤسسته' : 'مادة التخصص'})` : pri ? ' — لا يحرس أستاذ(ة) السادس تلاميذ مؤسسته' : ' — لا أحد يحرس في مادة تخصصه'}`, !!warn.length);
  }
  const guardsDoc = docOf('guards');
  if (guardsDoc) {
    guardsDoc.d = 'التوزيع الذكي للمراقبين: لا يحرس الأستاذ(ة) في مادة تخصصه، احترام عدم التوفر، العدالة في الحصص وأنصاف الأيام، التناوب على القاعات وتفادي تكرار نفس الثنائي.';
    guardsDoc.init = (s, sy) => ({ reserve: '1', per: '2', own: '1', mix: '1', rot: '1', gmix: '', half: '', resMode: '', resPct: '10', resBy: subjects(sy).map(r => [r[0], '']), rows: [] });
    const yes = [['1', 'نعم'], ['0', 'لا']];
    const syncRes = (f, sy) => { if (!f) return; const old = f.resBy || []; f.resBy = subjects(sy).map(r => [r[0], ((old.find(o => nm(o[0]) === nm(r[0])) || [])[1]) || '']); };
    guardsDoc.defs = (f, sy) => (syncRes(f, sy), [{ k: 'per', l: 'عدد المراقبين بكل قاعة', t: 'select', opts: [['2', 'اثنان'], ['1', 'واحد'], ['3', 'ثلاثة']], half: true }, { k: 'reserve', l: 'عدد الاحتياطيين في كل حصة', t: 'num', half: true },
      { k: 'own', l: info(sy).level === 'P6' ? 'لا يحرس أستاذ(ة) السادس تلاميذ مؤسسته' : 'لا يحرس الأستاذ(ة) في مادة تخصصه', t: 'select', opts: yes, half: true }, { k: 'rot', l: 'التناوب على القاعات', t: 'select', opts: yes, half: true },
      { k: 'mix', l: 'المزج بين مقرات العمل في نفس القاعة', t: 'select', opts: yes, half: true }, { k: 'gmix', l: 'المزج بين الجنسين في نفس القاعة', t: 'select', opts: [['', 'لا يهم'], ['1', 'نعم']], half: true },
      { k: 'half', l: 'حصة واحدة على الأكثر لكل مراقب في نصف اليوم', t: 'select', opts: [['', 'لا'], ['1', 'نعم']], half: true },
      { k: 'resMode', l: 'الاحتياطيون في كل حصة', t: 'select', opts: [['', 'عدد ثابت (الخانة أعلاه)'], ['pct', 'نسبة من عدد القاعات (نسبة الاحتياط)']], half: true },
      ...(f && f.resMode === 'pct' ? [{ k: 'resPct', l: 'نسبة الاحتياط % من عدد قاعات الحصة', t: 'num', half: true }] : []),
      { k: 'resBy', l: 'عدد الاحتياطيين بكل مادة (فارغ = حسب الاختيار أعلاه)', t: 'grid', cols: ['المادة', 'عدد الاحتياطيين'], widths: ['1.6fr', '.6fr'], types: ['text', 'num'], fixed: true },
      { t: 'html', html: '<button type="button" class="btn sm pri" data-act="gen">التوزيع الذكي للمراقبين</button>' },
      { note: `الحصص: ${subjects(sy).map((r, i) => `${i + 1}) ${esc(r[0])}${tracksOf(r).length ? ' [' + esc(tracksOf(r).join('، ')) + ']' : ''}`).join(' — ') || 'أدخل جدولة الامتحان أولا'}. «غير متوفر» يكتب في طاقم المركز بأرقام الحصص (مثال: 2,5).` },
      { k: 'rows', l: 'التوزيع (رقم الحصة، القاعة، المراقبون)', t: 'grid', cols: ['الحصة', 'القاعة', 'المراقب(ة) 1', 'المراقب(ة) 2', 'ملاحظة'], widths: ['.45fr', '.6fr', '1.3fr', '1.3fr', '.9fr'], list: [null, null, 'k2Emps', 'k2Emps', null] }]);
    guardsDoc.act = { gen: (f, sy, c) => smartGuards(sy, f, c) };
    guardsDoc.onSave = k => (k === 'resMode' ? 'redraw' : undefined);
  }

  /* ================= 3. the smart assistant (readiness and conflicts) ================= */
  function audit(sy) {
    const I = info(sy), L = cands(sy), ss = subjects(sy), R = rooms(sy), St = staffRows(sy), G = guardRows(sy), out = [];
    const put = (lvl, t, doc, n) => out.push({ lvl, t, doc, n });
    // general data
    if (!nm(I.center) || !nm(I.head)) put('err', 'المعطيات العامة ناقصة (مركز الامتحان أو رئيسه)', 'info'); else put('ok', `مركز الامتحان: ${I.center} — الرئيس(ة): ${I.head}`, 'info');
    // candidates
    if (!L.length) put('err', 'لا يوجد مترشحون: استورد ملف GEXA / مسار أو أضفهم من بطاقة التلاميذ', 'cands');
    else {
      const noNo = L.filter(c => !nm(c[C.no])).length, noRoom = L.filter(c => !nm(c[C.room])).length;
      const dup = (k) => { const m = new Map(); L.forEach(c => { const v = nm(c[k]); if (v) m.set(v, (m.get(v) || 0) + 1); }); return Array.from(m.values()).filter(x => x > 1).length; };
      put(noNo || noRoom ? 'warn' : 'ok', `${L.length} مترشحا (${gCount(L).w} إناث)${noNo ? ` — ${noNo} بدون رقم امتحان` : ''}${noRoom ? ` — ${noRoom} بدون قاعة` : ''}`, noNo || noRoom ? 'rooms' : 'cands');
      if (dup(C.no)) put('err', `أرقام امتحان مكررة (${dup(C.no)})`, 'cands');
      if (dup(C.code)) put('warn', `أرقام وطنية مكررة (${dup(C.code)})`, 'cands');
    }
    // timetable
    if (!ss.length) put('err', 'جدولة الامتحان فارغة', 'subjects');
    else {
      const miss = ss.filter(r => !r[1] || !nm(r[2])).length;
      const clash = []; ss.forEach((a, i) => ss.forEach((b, j) => { if (j <= i || a[1] !== b[1] || !a[1]) return; const a1 = tMin(a[2]), a2 = tMin(a[3]), b1 = tMin(b[2]), b2 = tMin(b[3]); if (a1 != null && b1 != null && a2 != null && b2 != null && a1 < b2 && b1 < a2 && !(tracksOf(a).length && tracksOf(b).length && !tracksOf(a).some(t => tracksOf(b).includes(t)))) clash.push(`${a[0]} / ${b[0]}`); }));
      put(miss ? 'warn' : 'ok', `${ss.length} مادة${miss ? ` — ${miss} بدون تاريخ أو توقيت` : ''}`, 'subjects');
      if (clash.length) put('err', `تداخل في التوقيت: ${clash.join('، ')}`, 'subjects');
    }
    // rooms
    if (!R.length) put('err', 'لم تُدخل القاعات', 'rooms');
    else {
      const cap = R.reduce((t, r) => t + (parseInt(r[1], 10) || 0), 0), m = byRoom(sy), over = R.filter(r => (m.get(nm(r[0])) || []).length > (parseInt(r[1], 10) || 1e9)).map(r => r[0]);
      put(cap < L.length ? 'err' : over.length ? 'warn' : 'ok', `${R.length} قاعة بسعة ${cap}${cap < L.length ? ` أقل من عدد المترشحين (${L.length})` : ''}${over.length ? ` — قاعات تجاوزت سعتها: ${over.join('، ')}` : ''}`, 'rooms');
    }
    // staff and invigilation
    const pool = St.filter(isGuard), need = ss.reduce((t, sj, si) => t + roomsOfSubj(sy, si).length * 2, 0);
    if (!St.length) put('err', 'طاقم المركز فارغ', 'staff');
    else put(pool.length * ss.length < need ? 'warn' : 'ok', `${St.length} عضوا منهم ${pool.length} مراقبا — حاجيات الحراسة: ${need} حصة-مراقب لـ ${ss.length} مادة (≈ ${pool.length ? Math.ceil(need / pool.length) : '؟'} حصة لكل مراقب)`, 'staff');
    if (!St.some(r => /رئيس مركز الامتحان/.test(r[3] || ''))) put('warn', 'لم يحدد رئيس مركز الامتحان ضمن الطاقم', 'staff');
    if (!G.length) put(ss.length && R.length && pool.length ? 'warn' : 'err', 'جدول الحراسة لم يُنجز بعد', 'guards');
    else {
      const dbl = [], own = [], off = [], short = [];
      ss.forEach((sj, si) => {
        const rows = G.filter(r => +r[0] === si + 1), seen = new Map(), sk = keysOf(sj[0]);
        rows.forEach(r => [r[2], r[3]].filter(nm).forEach(n => seen.set(n, (seen.get(n) || 0) + 1)));
        seen.forEach((v, n) => { if (v > 1) dbl.push(`${n} (${sj[0]})`); });
        rows.forEach(r => [r[2], r[3]].filter(nm).forEach(n => { const s0 = St.find(x => nm(x[0]) === nm(n)); if (s0 && I.level !== 'P6' && share(keysOf(subjOfStaff(s0)), sk)) own.push(`${n} (${sj[0]})`); if (s0 && unavail(s0[5]).has(si + 1)) off.push(`${n} (${sj[0]})`); }));
        rows.filter(r => r[1] !== 'احتياط' && (!nm(r[2]) || !nm(r[3]))).forEach(r => short.push(`${sj[0]} — ${r[1]}`));
      });
      const loads = pool.map(p => G.filter(r => r[2] === p[0] || r[3] === p[0]).length), mn = loads.length ? Math.min(...loads) : 0, mx = loads.length ? Math.max(...loads) : 0;
      put(mx - mn > 1 ? 'warn' : 'ok', `جدول الحراسة: ${G.length} سطرا — عدد الحصص لكل مراقب من ${mn} إلى ${mx}${mx - mn > 1 ? ' (توزيع غير متوازن)' : ' (توزيع عادل)'}`, 'guards');
      if (dbl.length) put('err', `مراقب في قاعتين في نفس الحصة: ${dbl.slice(0, 4).join('، ')}${dbl.length > 4 ? '…' : ''}`, 'guards');
      if (own.length) put('warn', `يحرس في مادة تخصصه: ${own.slice(0, 4).join('، ')}${own.length > 4 ? '…' : ''}`, 'guards');
      if (off.length) put('warn', `مكلف في حصة غير متوفر فيها: ${off.slice(0, 4).join('، ')}`, 'guards');
      if (short.length) put('warn', `قاعات بمراقب واحد أو بدون مراقب: ${short.slice(0, 4).join('، ')}${short.length > 4 ? '…' : ''}`, 'guards');
    }
    // secret numbers and marks
    const sm = Y(sy).secretMap; put(sm && sm.by && Object.keys(sm.by).length ? 'ok' : 'info', sm && sm.by && Object.keys(sm.by).length ? 'الأرقام السرية للتصحيح جاهزة' : 'الأرقام السرية للتصحيح لم تُولد بعد (اختياري)', 'ex_secret');
    const M = Y(sy).marks.rows || [], full = M.filter(r => ss.every((x, i) => nm(r[3 + i]) !== '')).length;
    put(!M.length ? 'info' : full < L.length ? 'warn' : 'ok', !M.length ? 'النقط لم تُدخل بعد' : `النقط: ${full} / ${L.length} مترشحا مكتملة`, 'marks');
    const ms = Y(sy).massar; put(ms && ms.b64 ? 'ok' : 'info', ms && ms.b64 ? `ملف نقط مسار مستورد (${ms.name}) — جاهز للتعبئة` : 'ملف نقط مسار: استورده من مسار عند نهاية التصحيح لإعادته معبأ', 'ex_massar');
    return out;
  }
  function assistant(v) {
    const sy = MK.curSy(), A = audit(sy), h = v.querySelector('.page-h'); if (!h) return;
    const steps = ['info', 'cands', 'subjects', 'rooms', 'staff', 'guards', 'marks'];
    const done = steps.filter(k => !A.some(a => a.doc === k && a.lvl === 'err') && A.some(a => a.doc === k)).length;
    const pct = Math.round(done / steps.length * 100), err = A.filter(a => a.lvl === 'err').length, wr = A.filter(a => a.lvl === 'warn').length;
    const ic2 = { ok: '✅', warn: '⚠️', err: '⛔', info: 'ℹ️' };
    h.insertAdjacentHTML('afterend', `<div class="card ex-ai"><div class="ex-ai-h"><span class="ex-ai-t">🧠 المساعد الذكي لمركز الامتحان</span><span class="tag">${esc({ pri: 'السلك الابتدائي', col: 'السلك الإعدادي', lyc: 'السلك التأهيلي' }[X.kindNow()] || '')} — ${esc(levelName(info(sy).level))} — ${esc(X.typeName(info(sy).type))}</span><span class="ex-ai-p"><i style="width:${pct}%"></i></span><b>${pct}%</b>
      <span class="muted">${err ? `${err} خطأ` : 'لا أخطاء'}${wr ? ` — ${wr} تنبيه` : ''}</span><span class="sp"></span><button class="btn sm" id="exAiT">${ic('list')} التفاصيل</button></div>
      <div class="ex-ai-b" ${err ? '' : 'hidden'}>${A.map(a => `<div class="ex-ai-r ${a.lvl}"><span>${ic2[a.lvl]}</span><span class="tx">${esc(a.t)}</span>${a.doc ? `<button class="btn sm" data-exgo="${a.doc}">فتح</button>` : ''}</div>`).join('')}</div></div>`);
    const b = v.querySelector('.ex-ai-b'); v.querySelector('#exAiT').onclick = () => { b.hidden = !b.hidden; };
    v.querySelectorAll('[data-exgo]').forEach(x => x.onclick = () => go('examsDoc', { kind: x.dataset.exgo }));
  }
  const pageExams0 = window.pageExams;
  window.pageExams = (v, a) => { pageExams0(v, a); try { assistant(v); } catch (e) { /* the assistant never blocks the page */ } };

  /* ================= 4. staff documents ================= */
  const myRows = (sy, n) => guardRows(sy).filter(g => nm(g[2]) === nm(n) || nm(g[3]) === nm(n));
  const roleOf = (sy, r) => { const G = myRows(sy, r[0]); const t = [nm(r[3]) || 'مراقب(ة) الإجراء']; if (G.some(g => g[1] === 'احتياط') && !/احتياط/.test(t[0])) t.push('الاحتياط'); return t.join(' و'); };
  const firstDay = sy => { const d = subjects(sy).map(r => r[1]).filter(Boolean).sort()[0]; return d ? `${K.dayName(d)} ${K.ldate(d)}` : '....................'; };
  add({ k: 'ex_mission', t: 'تكليف بمهمة مع إشعار بالاستلام (لكل عضو)', grp: 's', d: 'تكليف مختصر لكل عضو من الطاقم حسب مهمته (الحراسة، الكتابة، الاحتياط، المداومة، التصحيح...) مع قسيمة «إشعار باستلام» يوقعها المعني(ة) — تكليفان في الصفحة.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4',
    init: () => ({ who: '', ref: '' }), defs: (f, sy) => [{ k: 'who', l: 'العضو', t: 'select', opts: [['', 'كل أعضاء الطاقم']].concat(staffRows(sy).map(r => [r[0], r[0]])) }, { k: 'ref', l: 'المرجع (اختياري)' }],
    build: (s, f, sy) => {
      const I = info(sy), L = staffRows(sy).filter(r => !f.who || r[0] === f.who);
      const one = r => `<div class="ex-mi"><p><b>من رئيس(ة) مركز الامتحان:</b> ${esc(I.center)}</p><p><b>إلى السيد(ة):</b> ${esc(dots(r[0], 30))} &nbsp; — &nbsp; <b>رقم التأجير:</b> <span dir="ltr">${esc(dots(r[1], 10))}</span></p>
        <p class="c"><b>الموضوع:</b> تكليف بمهمة${f.ref ? ` — <b>المرجع:</b> ${esc(f.ref)}` : ''}</p><p class="c"><b>سلام تام بوجود مولانا الإمام المؤيد بالله</b></p>
        <p>وبعد، علاقة بالموضوع المشار إليه أعلاه، وفي إطار تنظيم ${esc(examTitle(I))} — دورة ${esc(I.session)} —، يشرفني إخباركم بأنه تقرر تكليفكم بمهمة <b>${esc(roleOf(sy, r))}</b> بمركز الامتحان <b>${esc(I.center)}</b>، وذلك ابتداء من يوم <b>${esc(firstDay(sy))}</b> إلى غاية الانتهاء من ذات المهمة، وبذلك أهيب بكم الحضور إلى مركز الامتحان قبل نصف ساعة من بداية المهمة وإيلاء العملية ما تستحق من العناية حتى تمر في أحسن الظروف.</p>
        <p class="c">وتقبلوا أزكى التحيات والسلام.</p><div class="ex-mi-s"><span>${esc(s.city || '')} في: ${esc(today())}</span><b>رئيس(ة) المركز</b></div>
        <div class="ex-mi-r"><b>إشعار باستلام:</b> يشهد السيد(ة): ........................................................ أنه(ا) تسلم(ت) هذا التكليف بتاريخ: ........................ &nbsp; التوقيع: ....................</div></div>`;
      const list = L.length ? L : [['', '', '', 'مراقب(ة) الإجراء', '']], pages = [];
      for (let i = 0; i < list.length; i += 2) pages.push(`<div class="ex-mis">${list.slice(i, i + 2).map(r => `<div class="ex-mih">${hdr(s)}${one(r)}</div>`).join(cutLine)}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_staffconv', t: 'استدعاء فردي للأطر مع برنامج حصصهم', grp: 's', d: 'لكل عضو من الطاقم: مهمته، وجدول حصصه (التاريخ، المادة، التوقيت، القاعة، الدور: أساسي أو احتياطي) — استدعاءان في الصفحة.', auto: 'طاقم المركز وجدول الحراسة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), L = staffRows(sy);
      const one = r => { const G = myRows(sy, r[0]); return `<div class="ex-sc"><div class="ex-sc-h"><b>استدعاء</b><span>${esc(examTitle(I))} — دورة ${esc(I.session)}</span></div>
        <div class="ex-sc-g"><div>الاسم الكامل: <b>${esc(r[0])}</b></div><div>رقم التأجير: <b dir="ltr">${esc(r[1] || '')}</b></div><div>المهمة: <b>${esc(roleOf(sy, r))}</b></div><div>مركز الامتحان: <b>${esc(I.center)}</b></div></div>
        <table class="sb-t cmp ex-sc-t"><thead>${thr(['التاريخ', 'المادة', 'التوقيت', 'القاعة', 'الدور'])}</thead><tbody>${G.length ? G.map(g => { const sj = sessOf(sy, g[0]); return tr([sjDate(sj), { t: sj[0], c: 'b' }, { t: `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`, c: 'ltr' }, { t: g[1], c: 'b' }, g[1] === 'احتياط' ? 'احتياطي(ة)' : nm(g[2]) === nm(r[0]) ? 'مراقب(ة) أول(ى)' : 'مراقب(ة) ثان(ية)']); }).join('') : `<tr><td colspan="5">${esc(nm(r[3]) || '')} — طيلة أيام الامتحان (${esc(firstDay(sy))})</td></tr>`}</tbody></table>
        <div class="ex-sc-n">- الحضور إلى مركز الامتحان نصف ساعة قبل بداية كل حصة. - يمنع استعمال الهاتف النقال داخل قاعات الامتحان. - الاحتياطي(ة) يبقى رهن إشارة رئيس المركز طيلة الحصة.</div>
        <div class="ex-sc-s">خاتم وتوقيع رئيس(ة) المركز</div></div>`; };
      const list = L.length ? L : [['', '', '', '', '']], pages = [];
      for (let i = 0; i < list.length; i += 2) pages.push(`${hdr(s)}${list.slice(i, i + 2).map(one).join(cutLine)}`);
      return { page: 'a4', pages };
    } });
  const BADGE_C = r => (/رئيس/.test(r) ? '#8e1b1b' : /الكتابة|كتابة/.test(r) ? '#1d5fa6' : /ملاحظ|الجودة/.test(r) ? '#7b3fb0' : /مداوم/.test(r) ? '#a4570b' : /تصحيح|المسك/.test(r) ? '#2f7d32' : /أمن|نظافة|طاقم/.test(r) ? '#455a64' : '#0b7a8a');
  add({ k: 'ex_badges', t: 'بادجات الطاقم (شارات التعريف)', grp: 's', d: 'شارة لكل عضو من الطاقم بلون حسب المهمة (رئيس المركز، المراقبون، الكتابة، الملاحظون، المداومون، التصحيح...) — 8 شارات في الصفحة.', auto: 'طاقم المركز', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), L = staffRows(sy), pages = [], list = L.length ? L : Array.from({ length: 8 }, () => ['', '', '', 'مراقب(ة) الإجراء', '']);
      for (let i = 0; i < list.length; i += 8) pages.push(`<div class="ex-bdg">${list.slice(i, i + 8).map(r => `<div style="--c:${BADGE_C(r[3] || '')}"><div class="h">${esc(s.directorate || '')}<br>${esc(examTitle(I))} — ${esc(I.session)}</div><div class="r">${esc(nm(r[3]) || 'مراقب(ة) الإجراء')}</div><div class="n">${esc(dots(r[0], 22))}</div><div class="c">مركز الامتحان: ${esc(I.center)}</div></div>`).join('')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_subjlists', t: 'لوائح الأساتذة حسب المادة (المراقبون، الاحتياطيون، غير المكلفين)', grp: 's', d: 'لكل مادة: المراقبون وقاعاتهم، الاحتياطيون، والأساتذة الذين لا يحرسون (مادة تخصصهم أو غير مكلفين في تلك الحصة).', auto: 'طاقم المركز وجدول الحراسة', page: 'a4', init: () => ({ subj: 'all' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), G = guardRows(sy), pool = staffRows(sy).filter(isGuard), pages = [];
      subjIdx(f, sy).forEach(i => {
        const sj = ss[i] || ['', '', '', '', ''], rows = G.filter(r => +r[0] === i + 1), sk = keysOf(sj[0]);
        const g = rows.filter(r => r[1] !== 'احتياط'), res = rows.filter(r => r[1] === 'احتياط'), inn = new Set(rows.reduce((a, r) => a.concat([nm(r[2]), nm(r[3])]), []).filter(Boolean));
        const free = pool.filter(r => !inn.has(nm(r[0])));
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, `لوائح الأساتذة — مادة ${esc(sj[0] || '')}`, `${sub(sy)}<br>${esc(sessLabel(sj))}`), blocks: [
          SB.cap('الأساتذة المراقبون بالمادة', 'r'), tbl(thr(['ر.ت', 'القاعة', 'المراقب(ة) الأول(ى)', 'المراقب(ة) الثاني(ة)']), g.map((r, j) => tr([j + 1, { t: r[1], c: 'b' }, r[2], r[3]])), 'cmp'),
          SB.cap('الأساتذة الاحتياطيون بالمادة', 'r'), tbl(thr(['ر.ت', 'الاسم الكامل', 'التوقيع']), (res.length ? res : [['', '', '']]).map((r, j) => tr([j + 1, { t: r[2], c: 'r b' }, { t: '', st: 'width:30%' }])), 'cmp'),
          SB.cap('الأساتذة الذين لا يحرسون بالمادة', 'r'), tbl(thr(['ر.ت', 'الاسم الكامل', 'المادة / الإطار', 'السبب']), (free.length ? free : [['', '', '']]).map((r, j) => tr([j + 1, { t: r[0], c: 'r b' }, { t: subjOfStaff(r), c: 'sm' }, share(keysOf(subjOfStaff(r)), sk) ? 'مادة تخصصه' : unavail(r[5]).has(i + 1) ? 'غير متوفر' : 'غير مكلف في هذه الحصة'])), 'cmp'),
          signHead(s)] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p)));
      });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_fair', t: 'تقرير عدالة توزيع الحراسة', grp: 's', d: 'لكل مراقب(ة): عدد الحصص الأساسية والاحتياطية، أنصاف الأيام، الصباح والمساء، القاعات المختلفة، مع الحكم على عدالة التوزيع.', auto: 'جدول الحراسة', page: 'a4l', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const pool = staffRows(sy).filter(isGuard), G = guardRows(sy);
      const st = pool.map(r => { const M = myRows(sy, r[0]), base = M.filter(g => g[1] !== 'احتياط'), res = M.filter(g => g[1] === 'احتياط'); const h = new Set(M.map(g => halfOf(sessOf(sy, g[0])))); const am = M.filter(g => halfOf(sessOf(sy, g[0])).endsWith('ص')).length;
        return { r, base: base.length, res: res.length, all: M.length, half: h.size, am, pm: M.length - am, rooms: new Set(base.map(g => g[1])).size }; });
      const loads = st.map(x => x.all), mn = loads.length ? Math.min(...loads) : 0, mx = loads.length ? Math.max(...loads) : 0, avg = loads.length ? loads.reduce((a, b) => a + b, 0) / loads.length : 0;
      const hl = st.map(x => x.half), hmn = hl.length ? Math.min(...hl) : 0, hmx = hl.length ? Math.max(...hl) : 0;
      const verdict = (mx - mn <= 1 ? '*** توزيع المهام عادل ***' : '*** تحذير: توزيع المهام غير عادل ***') + ' — ' + (hmx - hmn <= 1 ? 'توزيع أنصاف الأيام عادل' : 'تحذير: توزيع أنصاف الأيام غير عادل');
      return { title: 'تقرير عدالة توزيع الحراسة', sub: sub(sy), page: 'a4l', sign: signHead(s), blocks: [
        { html: `<div class="ex-verd ${mx - mn <= 1 && hmx - hmn <= 1 ? 'ok' : 'bad'}">${esc(verdict)}<br><small>عدد الحصص لكل مراقب: من ${mn} إلى ${mx} (المتوسط ${f2(avg)}) — أنصاف الأيام: من ${hmn} إلى ${hmx} — مجموع أسطر الجدول: ${G.length}</small></div>` },
        tbl(thr(['ر.ت', 'المراقب(ة)', 'المادة / الإطار', 'حصص أساسية', 'احتياط', 'المجموع', 'أنصاف الأيام', 'صباحا', 'مساء', 'قاعات مختلفة', 'الفارق عن المتوسط']), st.map((x, i) => tr([i + 1, { t: x.r[0], c: 'r b' }, { t: subjOfStaff(x.r), c: 'sm' }, x.base, x.res, { t: x.all, c: 'b' }, x.half, x.am, x.pm, x.rooms, { t: (x.all - avg >= 0 ? '+' : '') + f2(x.all - avg), st: Math.abs(x.all - avg) > 1 ? 'color:#c62828;font-weight:700' : '' }])), 'cmp')] };
    } });
  add({ k: 'ex_envreceipt', t: 'إقرار بتسلم أظرفة الامتحان (المكلف بالإشراف)', grp: 'e', d: 'إقرار يوقعه الأستاذ(ة) المكلف(ة) بالإشراف على الامتحان بكل مركز أو وحدة مدرسية: تسلم أظرفة المواد مغلقة والتعهد بعدم فتحها إلا عند موعد الامتحان (إقراران في الصفحة).', auto: 'الجدولة والمعطيات العامة', page: 'a4',
    init: () => ({ rows: [['', '']], date: '' }), defs: (f, sy) => [{ k: 'date', l: 'تاريخ التسلم', t: 'date', half: true },
      { k: 'rows', l: 'المكلفون بالإشراف ومراكزهم', t: 'grid', cols: ['الأستاذ(ة) المكلف(ة)', 'مركز الامتحان / الوحدة المدرسية'], widths: ['1.3fr', '1.3fr'], list: ['k2Emps', 'k2Units'] }],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy).map(r => r[0]).filter(Boolean), R = (f.rows || []).filter(r => nm(r[0]) || nm(r[1]));
      const one = r => `<div class="ex-mi"><p>أنا الموقع(ة) أدناه الأستاذ(ة): <b>${esc(dots(r[0], 30))}</b> المكلف(ة) بالإشراف على ${esc(examTitle(I))} دورة ${esc(I.session)} بمركز الامتحان: <b>${esc(nm(r[1]) || I.center)}</b>.</p>
        <p>أقر وأصرح أني تسلمت ${ss.length ? `${ss.length === 1 ? 'ظرف' : ss.length === 2 ? 'ظرفي' : ss.length + ' أظرفة'} الامتحان الخاصة بكل من المواد: <b>${esc(ss.join('؛ '))}</b>` : 'أظرفة الامتحان'} مغلقة من لدن السيد(ة) مدير(ة) المؤسسة يوم <b>${esc(f.date ? `${K.dayName(f.date)} ${K.ldate(f.date)}` : '....................')}</b>، كما أتعهد بعدم فتحها إلا عند حلول موعد الامتحان المشار إليه في المذكرة المنظمة للامتحان.</p>
        <div class="ex-mi-s"><span>توقيع المعني(ة) بالأمر</span><b>رئيس(ة) المؤسسة</b></div></div>`;
      const list = R.length ? R : [['', '']], pages = [];
      for (let i = 0; i < list.length; i += 2) pages.push(`<div class="ex-mis">${list.slice(i, i + 2).map(r => `<div class="ex-mih">${hdr(s)}<div class="sb-cap">إقرار بتسلم أظرفة الامتحان</div>${one(r)}</div>`).join(cutLine)}</div>`);
      return { page: 'a4', pages };
    } });

  /* ================= 5. envelopes ================= */
  add({ k: 'ex_envlabel', t: 'واجهات أظرفة المواضيع وأوراق التحرير (لكل قاعة ومادة)', grp: 'e', d: 'واجهة لكل ظرف: المركز، المادة، التاريخ والتوقيت، القاعة، أرقام الامتحان من… إلى…، عدد المترشحين وعدد الأوراق بالظرف (المترشحون + الاحتياط %)، وظرف خاص بمركز الامتحان.', auto: 'القاعات والجدولة', page: 'a4',
    init: () => ({ subj: 'all', extra: '10', kind: 'subj', center: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }, { k: 'kind', l: 'نوع الظرف', t: 'select', opts: [['subj', 'ظرف مواضيع الامتحان'], ['copies', 'ظرف أوراق التحرير'], ['draft', 'ظرف أوراق التسويد']], half: true },
      { k: 'extra', l: 'نسبة الاحتياط من الأوراق %', t: 'num', half: true }, { k: 'center', l: 'ظرف خاص بمركز الامتحان', t: 'select', opts: [['1', 'نعم'], ['', 'لا']], half: true }],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), m = byRoom(sy), pct = Math.max(0, num(f.extra) == null ? 10 : num(f.extra)), items = [];
      const nameK = { subj: 'ظرف مواضيع الامتحان', copies: 'ظرف أوراق التحرير', draft: 'ظرف أوراق التسويد' }[f.kind || 'subj'];
      subjIdx(f, sy).forEach(i => {
        const sj = ss[i] || ['', '', '', '', ''], RR = roomsOfSubj(sy, i).filter(r => m.has(r));
        const Lsj = candsOfSubj(sy, i), inSj = new Set(Lsj);
        RR.forEach(rm => { const L = (m.get(rm) || []).filter(c => inSj.has(c)); const r0 = rng(L); items.push({ sj, room: rm, n: L.length, from: r0[0], to: r0[1] }); });
        if (f.center) items.push({ sj, room: '', n: Lsj.length, from: rng(Lsj)[0], to: rng(Lsj)[1], center: true, rooms: RR.length });
      });
      const one = x => `<div class="ex-env"><div class="h">${esc(s.directorate || '')} — مركز الامتحان: <b>${esc(I.center)}</b>${I.code ? ` (${esc(I.code)})` : ''}</div><div class="k">${esc(x.center ? `${nameK} — الظرف الخاص بمركز الامتحان` : nameK)}</div>
        <div class="t">${esc(examTitle(I))} — دورة ${esc(I.session)}</div><div class="s">المادة: <b>${esc(x.sj[0] || '..........')}</b></div><div class="d">${esc(sjDate(x.sj))} — <span dir="ltr">${esc(x.sj[2] || '')}${x.sj[3] ? ' - ' + esc(x.sj[3]) : ''}</span></div>
        <div class="g">${x.center ? `<div>عدد القاعات بالظرف: <b>${x.rooms}</b></div>` : `<div class="rm">القاعة <b>${esc(x.room)}</b></div>`}<div>أرقام الامتحان من <b>${x.from}</b> إلى <b>${x.to}</b></div><div>عدد المترشحين: <b>${x.n}</b></div>${f.kind === 'copies' ? '<div>عدد الأوراق بالظرف: ..........</div>' : `<div>عدد الأوراق بالظرف: <b>${x.n + Math.ceil(x.n * pct / 100)}</b> <small>(+${pct}%)</small></div>`}</div>
        <div class="f">${f.kind === 'copies' ? 'يغلق ويوقع بحضور المراقبين — لا يفتح إلا بمركز التصحيح' : 'لا يفتح إلا داخل القاعة وبحضور المترشحين عند حلول موعد الاختبار'}</div></div>`;
      const pages = [], list = items.length ? items : [{ sj: ['', '', '', '', ''], room: '', n: 0, from: '', to: '' }];
      for (let i = 0; i < list.length; i += 2) pages.push(`<div class="ex-envs">${list.slice(i, i + 2).map(one).join(cutLine)}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_envcheck', t: 'محضر التأكد من معلومات الظرف وفتحه (لكل قاعة)', grp: 'e', d: 'يحرره المراقبان داخل القاعة أمام المترشحين: سلامة الظرف وأختامه، مطابقة المادة والمستوى والتاريخ، عدد الأوراق، ساعة الفتح.', auto: 'القاعات والجدولة وجدول الحراسة', page: 'a4', init: () => ({ subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), G = guardRows(sy), m = byRoom(sy), pages = [];
      subjIdx(f, sy).forEach(i => roomsOfSubj(sy, i).forEach(rm => {
        const sj = ss[i] || ['', '', '', '', ''], g = G.find(r => +r[0] === i + 1 && nm(r[1]) === rm) || [], n = (m.get(rm) || []).length, cb = '☐';
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'محضر التأكد من معلومات الظرف وفتحه', sub(sy)), blocks: [kv([['المادة', sj[0]], ['التاريخ', sjDate(sj)], ['التوقيت', `${sj[2] || ''}${sj[3] ? ' - ' + sj[3] : ''}`], ['القاعة', rm], ['عدد المترشحين', String(n)], ['مركز الامتحان', info(sy).center]]),
          { html: `<div class="sb-pv"><p>نحن الموقعين أسفله، المراقبين بالقاعة المذكورة، نشهد أننا قمنا أمام المترشحين بالتأكد من:</p>
            <p>${cb} سلامة الظرف وأختامه &nbsp; ${cb} مطابقة المادة &nbsp; ${cb} مطابقة المستوى &nbsp; ${cb} مطابقة التاريخ والحصة &nbsp; ${cb} مطابقة رقم القاعة</p>
            <p>وتم فتح الظرف على الساعة: .................. وعدد أوراق الموضوع: .................. (العدد المطلوب: ${n})</p><p>ملاحظات: ..........................................................................................................</p></div>` },
          SB.sign(s, { three: [`المراقب(ة) الأول(ى): ${esc(nm(g[2]) || '..........')}`, `المراقب(ة) الثاني(ة): ${esc(nm(g[3]) || '..........')}`, 'توقيع مترشحين (شاهدان)'] })] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p)));
      }));
      return { page: 'a4', pages: pages.length ? pages : [''] };
    } });

  /* ================= 6. candidates documents ================= */
  add({ k: 'ex_cards', t: 'بطائق المترشحين (بطاقة تعريف لكل مترشح)', grp: 'k', d: 'بطاقة لكل مترشح(ة): الاسم، رقم الامتحان، القاعة ورقم الطاولة، الرقم الوطني، تاريخ الازدياد، المركز، مكان الصورة — 8 بطائق في الصفحة.', auto: 'المترشحون والقاعات', page: 'a4', init: () => ({ photo: '1' }),
    defs: () => [{ k: 'photo', l: 'مكان الصورة', t: 'select', opts: [['1', 'نعم'], ['', 'لا']] }],
    build: (s, f, sy) => {
      const I = info(sy), L = cands(sy), pages = [], list = L.length ? L : Array.from({ length: 8 }, () => []);
      for (let i = 0; i < list.length; i += 8) pages.push(`<div class="ex-crd">${list.slice(i, i + 8).map(c => `<div>${f.photo ? '<i class="ph">الصورة</i>' : ''}<div class="h">${esc(examTitle(I))} — ${esc(I.session)}</div><div class="n">${esc(dots(c[C.name], 22))}</div>
        <div class="g"><span>رقم الامتحان: <b class="big">${esc(c[C.no] || '')}</b></span><span>القاعة: <b>${esc(c[C.room] || '')}</b>${c[C.desk] ? ` — الطاولة: <b>${esc(c[C.desk])}</b>` : ''}</span><span>الرقم الوطني: <b dir="ltr">${esc(c[C.code] || '')}</b></span><span>تاريخ الازدياد: ${esc(c[C.birth] || '')}</span><span>المركز: ${esc(I.center)}</span></div></div>`).join('')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_invite', t: 'دعوة المترشح(ة) والأولياء لاجتياز الامتحان', grp: 'k', d: 'رسالة من الإدارة التربوية إلى الأولياء: موعد الامتحان ومركزه ورقم الامتحان والقاعة والجدولة والتوجيهات — دعوتان في الصفحة.', auto: 'المترشحون والجدولة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const I = info(sy), ss = subjects(sy), L = cands(sy), list = L.length ? L : [[]], pages = [];
      const one = c => `<div class="ex-mi"><p>تتشرف الإدارة التربوية لـ<b>${esc(s.school || '')}</b> بدعوة التلميذ(ة): <b>${esc(dots(c[C.name], 30))}</b> — القسم: ${esc(c[C.cls] || '')}</p>
        <p>لاجتياز ${esc(examTitle(I))} — دورة ${esc(I.session)} — بمركز الامتحان: <b>${esc(I.center)}</b> — رقم الامتحان: <b class="big">${esc(c[C.no] || '....')}</b> — القاعة: <b>${esc(c[C.room] || '...')}</b></p>
        <table class="ex-cv-t"><tr>${ss.map(r => `<th>${esc(r[0])}</th>`).join('')}</tr><tr>${ss.map(r => `<td>${esc(sjDate(r))}<br><span dir="ltr">${esc(r[2] || '')}${r[3] ? ' - ' + esc(r[3]) : ''}</span></td>`).join('')}</tr></table>
        <p class="ex-cv-n">نرجو من السيد(ة) ولي(ة) الأمر الحرص على حضور ابنه(ا) نصف ساعة قبل موعد كل مادة، مصحوبا بالاستدعاء وبجميع لوازمه، وتحسيسه بمنع إحضار الهاتف النقال وبعواقب الغش.</p>
        <div class="ex-mi-s"><span>${esc(s.city || '')} في: ${esc(today())}</span><b>الإدارة التربوية</b></div></div>`;
      for (let i = 0; i < list.length; i += 2) pages.push(`<div class="ex-mis">${list.slice(i, i + 2).map(c => `<div class="ex-mih">${hdr(s)}${one(c)}</div>`).join(cutLine)}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_absone', t: 'ورقة غياب مترشح(ة) (لكل غائب ومادة)', grp: 'e', d: 'ورقة فردية تملأ عن كل مترشح(ة) متغيب(ة) في مادة وتوضع في ظرف أوراق التحرير مكان ورقته (4 أوراق في الصفحة).', auto: 'المترشحون والجدولة', page: 'a4', init: () => ({ nos: '', subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjects(sy).map((r, i) => [String(i + 1), r[0]]) }, { k: 'nos', l: 'أرقام امتحان المتغيبين (مفصولة بفاصلة، فارغ = أوراق فارغة)', dir: 'ltr' }],
    build: (s, f, sy) => {
      const I = info(sy), sj = sessOf(sy, f.subj), L = cands(sy), nos = String(f.nos || '').split(/[\s,،;]+/).map(nm).filter(Boolean);
      const list = nos.length ? nos.map(n => L.find(c => nm(c[C.no]) === n) || [n]) : Array.from({ length: 4 }, () => []), pages = [];
      const one = c => `<div class="ex-ab"><div class="t">ورقة غياب المترشح(ة)</div><div class="e">${esc(examTitle(I))} — دورة ${esc(I.session)} — ${esc(I.center)}</div>
        <div class="g"><span>الاسم الكامل: <b>${esc(dots(c[C.name], 26))}</b></span><span>رقم الامتحان: <b class="big">${esc(dots(c[C.no], 8))}</b></span><span>القاعة: <b>${esc(dots(c[C.room], 4))}</b></span><span>المادة: <b>${esc(sj[0] || '')}</b></span><span>التاريخ: ${esc(sjDate(sj))}</span><span>التوقيت: <span dir="ltr">${esc(sj[2] || '')}${sj[3] ? ' - ' + esc(sj[3]) : ''}</span></span></div>
        <div class="w">غـائـب(ة)</div><div class="s"><span>المراقب(ة) الأول(ى) والتوقيع</span><span>المراقب(ة) الثاني(ة) والتوقيع</span></div></div>`;
      for (let i = 0; i < list.length; i += 4) pages.push(`<div class="ex-abs">${list.slice(i, i + 4).map(one).join('')}</div>`);
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_candstats', t: 'إحصاء المترشحين (حسب المؤسسة الأصلية والجنس والمسلك والقسم)', grp: 'k', d: 'جداول إحصائية للمترشحين: حسب المؤسسة الأصلية × الجنس، حسب المسلك، حسب القسم، وحسب القاعات.', auto: 'المترشحون', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const L = cands(sy), grp = key => { const mm = new Map(); L.forEach(c => { const k = nm(c[key]) || '—'; if (!mm.has(k)) mm.set(k, []); mm.get(k).push(c); }); return Array.from(mm.entries()).sort((a, b) => String(a[0]).localeCompare(String(b[0]), 'ar', { numeric: true })); };
      const T = (title, key) => { const G = grp(key); if (G.length < 2 && G[0] && G[0][0] === '—') return null; const g = gCount(L);
        return { before: SB.cap(title, 'r'), table: { cls: 'sb-t', head: thr([title.replace('حسب ', ''), 'ذكور', 'إناث', 'المجموع', 'النسبة']), rows: G.map(([k, X2]) => { const q = gCount(X2); return tr([{ t: k, c: 'r b' }, q.m, q.w, { t: q.t, c: 'b' }, L.length ? Math.round(q.t / L.length * 1000) / 10 + '%' : '']); }).concat([`<tr class="tot"><td>المجموع</td><td>${g.m}</td><td>${g.w}</td><td>${g.t}</td><td>100%</td></tr>`]) } }; };
      return { title: 'إحصاء المترشحين', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [T('حسب المؤسسة الأصلية', C.origin), T('حسب المسلك / الشعبة', C.track), T('حسب القسم', C.cls), T('حسب القاعة', C.room)].filter(Boolean) };
    } });

  /* ================= 7. posters and signs ================= */
  const poster = (s, inner, cls) => `${hdr(s)}<div class="ex-pst ${cls || ''}">${inner}</div>`;
  add({ k: 'ex_halftime', t: 'إعلان مرور نصف التوقيت (لكل مادة)', grp: 'a', d: 'ملصق كبير يرفع داخل القاعة: «مر نصف الوقت المخصص» مع الساعة المحسوبة من توقيت المادة.', auto: 'الجدولة', page: 'a4l', init: () => ({ subj: 'all' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), pages = [];
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || ['', '', '', '', '']; const a = tMin(sj[2]), b = tMin(sj[3]); const h = a != null && b != null && b > a ? a + (b - a) / 2 : null; const hh = h == null ? '....' : `${String(Math.floor(h / 60)).padStart(2, '0')}:${String(Math.round(h % 60)).padStart(2, '0')}`;
        pages.push(poster(s, `<div class="e">${esc(examTitle(X.info(sy)))} — ${esc(sj[0] || '')}</div><div class="big">مـرّ نـصـف الـتـوقـيـت</div><div class="m">الساعة <b dir="ltr">${hh}</b></div><div class="n">يمكن للمترشحين الذين أنهوا الإنجاز تسليم أوراقهم ومغادرة القاعة بهدوء</div>`, 'half')); });
      return { page: 'a4l', pages };
    } });
  add({ k: 'ex_phone', t: 'ملصق منع الهاتف النقال والآلات الإلكترونية', grp: 'a', d: 'ملصق للقاعات والممرات: يمنع إدخال الهاتف النقال وكل آلة إلكترونية إلى مركز الامتحان.', auto: 'المعطيات العامة', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => ({ page: 'a4', pages: [poster(s, `<div class="e">${esc(examTitle(info(sy)))} — دورة ${esc(info(sy).session)}</div><div class="ico">📵</div><div class="big red">ممنوع استعمال الهاتف النقال</div>
      <div class="n">يمنع منعا كليا إدخال أو حيازة الهواتف النقالة وجميع الآلات والوسائل الإلكترونية داخل قاعات الامتحان، ولو كانت غير مشغلة.<br>كل مترشح(ة) ضبط في حوزته هاتف نقال أو آلة إلكترونية يعتبر في حالة غش.</div>`, 'phone')] }) });
  const INSTR = ['الحضور إلى مركز الامتحان نصف ساعة على الأقل قبل الموعد المحدد لكل مادة.', 'إحضار الاستدعاء وبطاقة التعريف (أو ما يثبت الهوية) وجميع اللوازم المدرسية الضرورية.', 'الجلوس في المكان المخصص الذي يحمل رقم الامتحان، وعدم تغييره.', 'كتابة المعلومات الشخصية في المكان المخصص لها فقط، وعدم وضع أي علامة مميزة على ورقة التحرير.', 'عدم تبادل الأدوات أو التحدث مع باقي المترشحين خلال الاختبار.', 'يمنع إدخال الهاتف النقال أو أي آلة إلكترونية أو وثيقة غير مسموح بها.', 'لا يسمح بالدخول إلى القاعة بعد توزيع المواضيع، ولا بمغادرتها قبل انصرام نصف المدة.', 'تسليم ورقة التحرير للمراقب(ة) والتوقيع في محضر التوقيعات قبل مغادرة القاعة.', 'الامتثال لتعليمات المراقبين ورئيس المركز.'];
  add({ k: 'ex_instr', t: 'تعليمات إلى المترشح(ة)', grp: 'a', d: 'ورقة / ملصق تعليمات المترشح(ة) يوم الامتحان (قابلة للتعديل).', auto: 'المعطيات العامة', page: 'a4', init: () => ({ txt: INSTR.join('\n') }), defs: () => [{ k: 'txt', l: 'التعليمات (سطر لكل تعليمة)', t: 'area', rows: 10 }],
    build: (s, f, sy) => ({ page: 'a4', pages: [poster(s, `<div class="e">${esc(examTitle(info(sy)))} — دورة ${esc(info(sy).session)}</div><div class="big">تعليمات إلى المترشح(ة)</div><ol class="l">${String(f.txt || INSTR.join('\n')).split(/\n/).map(nm).filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')}</ol>`, 'instr')] }) });
  const LAW = 'القانون رقم 02.13 المتعلق بزجر الغش في الامتحانات المدرسية:\nيعتبر غشا كل فعل أو محاولة من شأنها الحصول على امتياز غير مشروع أثناء اجتياز الامتحان، كاستعمال أو حيازة وثائق أو وسائل غير مرخص بها، أو الاستعانة بالغير، أو انتحال الصفة، أو تسريب المواضيع أو الأجوبة.\nيعرض المترشح(ة) الذي ثبت في حقه الغش للعقوبات التأديبية المنصوص عليها في هذا القانون وفي النصوص التنظيمية الجاري بها العمل، دون الإخلال بالمتابعات القضائية عند الاقتضاء.\nيعاقب كل من ساهم في تسريب مواضيع الامتحانات أو أجوبتها أو سهل الغش بالعقوبات المنصوص عليها في القانون.\n(يمكن تعويض هذا النص بالنص الرسمي للقانون والمذكرة المنظمة للامتحان)';
  add({ k: 'ex_law', t: 'النصوص القانونية المتعلقة بالغش في الامتحانات', grp: 'a', d: 'ملصق / إعلان يعلق بمركز الامتحان حول زجر الغش (القانون 02.13) — النص قابل للتعويض بالنص الرسمي.', auto: 'نص قابل للتعديل', page: 'a4', init: () => ({ txt: LAW }), defs: () => [{ k: 'txt', l: 'النص (السطر الأول عنوان)', t: 'area', rows: 10 }],
    build: (s, f, sy) => { const L = String(f.txt || LAW).split(/\n/).map(nm).filter(Boolean); return { page: 'a4', pages: [poster(s, `<div class="e">${esc(examTitle(info(sy)))} — دورة ${esc(info(sy).session)}</div><div class="big red">إعلان: زجر الغش في الامتحانات</div><div class="w">${esc(L[0] || '')}</div>${L.slice(1).map(t => `<p class="p">${esc(t)}</p>`).join('')}<div class="f">⚠ الغش جريمة يعاقب عليها القانون</div>`, 'law')] }; } });
  const SIGNS = 'مركز الامتحان ←\nقاعات الامتحان ←\nالقاعة 1 →\nالقاعة 2 →\nالإدارة / كتابة المركز ←\nالمرافق الصحية →\nممنوع الدخول لغير المترشحين\nالمخرج →';
  add({ k: 'ex_signage', t: 'التشوير (لوحات الإرشاد والاتجاهات)', grp: 'a', d: 'لوحات توجيه كبيرة لمركز الامتحان (القاعات، الإدارة، المرافق، المخرج، منع الدخول) بأسهم الاتجاه — لوحة في كل صفحة أفقية.', auto: 'القاعات', page: 'a4l', init: () => ({ txt: '' }),
    defs: (f, sy) => [{ k: 'txt', l: 'اللوحات (سطر لكل لوحة، ضع ← أو → أو ↑ للاتجاه)', t: 'area', rows: 9, ph: SIGNS }],
    build: (s, f, sy) => { const L = (nm(f.txt) ? f.txt : ['مركز الامتحان ←'].concat(rooms(sy).map(r => `قاعة الامتحان ${nm(r[0])} →`)).concat(['الإدارة / كتابة المركز ←', 'المرافق الصحية →', 'ممنوع الدخول لغير المترشحين', 'المخرج →']).join('\n')).split(/\n/).map(nm).filter(Boolean);
      return { page: 'a4l', pages: L.map(t => { const ar = (t.match(/[←→↑↓]/) || [''])[0]; return `<div class="ex-sign"><div class="t">${esc(t.replace(/[←→↑↓]/g, '').trim())}</div>${ar ? `<div class="a">${ar}</div>` : ''}<div class="c">${esc(info(sy).center)} — ${esc(examTitle(info(sy)))}</div></div>`; }) }; } });
  const TASKS = ['الحضور إلى مركز الامتحان نصف ساعة قبل بداية الحصة والتوقيع في لائحة الحضور.', 'تهيئة القاعة: ترقيم الطاولات، التأكد من الإنارة والتهوية، إزالة كل الوثائق والملصقات.', 'التحقق من هوية المترشحين ومطابقتها مع الاستدعاء ولائحة القاعة، وإجلاس كل مترشح(ة) في مكانه.', 'فتح ظرف الموضوع أمام المترشحين بعد التأكد من سلامته ومطابقة معلوماته، وتحرير المحضر.', 'توزيع أوراق التحرير والتسويد والموضوع، وتسجيل المتغيبين وملء أوراق غيابهم.', 'المراقبة الفعلية المستمرة طيلة الحصة، والتنقل بين الصفوف دون إزعاج المترشحين.', 'الإعلان عن مرور نصف التوقيت وعن ربع الساعة الأخير.', 'ضبط حالات الغش وسحب الوسائل وتحرير تقرير الغش لكل حالة.', 'استلام أوراق التحرير والتأكد من عددها ومن توقيع المترشحين في المحضر.', 'إغلاق الظرف وتوقيعه وتسليمه لرئيس المركز مع المحاضر ومطبوع الإجراء.', 'يمنع على المراقب(ة) استعمال الهاتف النقال أو الانشغال بأي عمل آخر داخل القاعة.'];
  add({ k: 'ex_tasks', t: 'مهام المكلفين بالمراقبة', grp: 'a', d: 'ورقة توزع على مراقبي الإجراء: مهامهم قبل الحصة وأثناءها وبعدها (قابلة للتعديل).', auto: 'نص قابل للتعديل', page: 'a4', init: () => ({ txt: TASKS.join('\n') }), defs: () => [{ k: 'txt', l: 'المهام (سطر لكل مهمة)', t: 'area', rows: 12 }],
    build: (s, f, sy) => ({ title: 'مهام المكلفين بالمراقبة', sub: sub(sy), page: 'a4', sign: signHead(s), blocks: [{ html: `<ol class="ex-ol">${String(f.txt || TASKS.join('\n')).split(/\n/).map(nm).filter(Boolean).map(t => `<li>${esc(t)}</li>`).join('')}</ol>` }] }) });

  /* ================= 8. correction centre: secret numbers ================= */
  const SM = sy => { const y = Y(sy); y.secretMap = y.secretMap && typeof y.secretMap === 'object' ? y.secretMap : {}; y.secretMap.by = y.secretMap.by || {}; return y.secretMap; };
  const secretOf = (sy, si, no) => { const m = SM(sy); const t = m.mode === 'subj' ? m.by[String(si)] : m.by.all; return t ? t[nm(no)] || '' : ''; };
  function genSecret(sy, f, c) {
    const L = cands(sy).filter(x => nm(x[C.no])); if (!L.length) return c.toast('رقّم المترشحين أولا (أرقام الامتحان)', true);
    const m = SM(sy), start = Math.max(1, parseInt(f.start, 10) || 10001), seed = Date.now() >>> 0, R2 = rnd(seed);
    m.mode = f.mode === 'subj' ? 'subj' : 'all'; m.by = {}; m.seed = seed; m.date = Dx.todayIso();
    const make = () => { const nums = L.map((x, i) => start + i); for (let i = nums.length - 1; i > 0; i--) { const j = Math.floor(R2() * (i + 1)); [nums[i], nums[j]] = [nums[j], nums[i]]; } const o = {}; L.forEach((x, i) => { o[nm(x[C.no])] = String(nums[i]); }); return o; };
    if (m.mode === 'subj') subjects(sy).forEach((sj, si) => { m.by[String(si)] = make(); }); else m.by.all = make();
    persist(); c.toast(`تم توليد الأرقام السرية لـ ${L.length} مترشحا${m.mode === 'subj' ? ' (رقم مختلف في كل مادة)' : ''}`);
  }
  add({ k: 'ex_secret', t: 'الأرقام السرية: التوليد وجدول رفع السرية (سري)', grp: 'c', d: 'توليد رقم سري عشوائي لكل ورقة تحرير (رقم واحد لكل مترشح أو رقم مختلف لكل مادة)، وجدول رفع السرية لكل قاعة ومادة — وثيقة سرية لرئيس مركز التصحيح.', auto: 'المترشحون', page: 'a4',
    init: () => ({ mode: 'all', start: '10001', subj: '1' }),
    defs: (f, sy) => [{ k: 'mode', l: 'نوع الترقيم', t: 'select', opts: [['all', 'رقم سري واحد لكل مترشح(ة)'], ['subj', 'رقم سري مختلف لكل مادة']], half: true }, { k: 'start', l: 'أول رقم سري', t: 'num', half: true },
      { t: 'html', html: `<button type="button" class="btn sm pri" data-act="gen">توليد الأرقام السرية</button> <span class="muted" style="font-size:12px">${SM(sy).date ? 'آخر توليد: ' + esc(MK.showDate(SM(sy).date)) : 'لم تولد بعد'}</span>` },
      { k: 'subj', l: 'المادة (للطبع)', t: 'select', opts: subjOpts(sy) }, { note: 'تحذير: إعادة التوليد تغير كل الأرقام السرية. لا يطلع على هذا الجدول إلا رئيس(ة) مركز التصحيح.' }],
    act: { gen: (f, sy, c) => genSecret(sy, f, c) },
    build: (s, f, sy) => {
      const ss = subjects(sy), m = byRoom(sy), pages = [];
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || ['', '', '', '', ''];
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'جدول رفع السرية (وثيقة سرية)', `${sub(sy)}<br>المادة: ${esc(sj[0] || '')}`), blocks: Array.from(m.keys()).sort(sortRooms).map(k => ({ before: SB.cap('القاعة ' + esc(k), 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'رقم الامتحان', 'الاسم الكامل', 'الرقم السري']), rows: (m.get(k) || []).map((c, j) => tr([j + 1, { t: c[C.no], c: 'b' }, { t: c[C.name], c: 'r' }, { t: secretOf(sy, i, c[C.no]) || '—', c: 'b' }])) } })).concat([SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' })]) });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p))); });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_secretlabels', t: 'ملصقات الأرقام السرية (لكل ورقة تحرير)', grp: 'c', d: 'ملصق مزدوج لكل ورقة: جزء يحمل رقم الامتحان (يُنزع) وجزء يحمل الرقم السري (يبقى على الورقة) — 24 ملصقا في الصفحة.', auto: 'الأرقام السرية', page: 'a4', init: () => ({ subj: '1' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => {
      const ss = subjects(sy), L = cands(sy).filter(c => nm(c[C.no])), pages = [];
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || ['']; const Ls = L.filter(c => trackHit(c, sj));
        for (let k = 0; k < Math.max(1, Ls.length); k += 24) pages.push(`<div class="ex-sl">${Ls.slice(k, k + 24).map(c => `<div><span class="a">${esc(sj[0] || '')}<br>رقم الامتحان <b>${esc(c[C.no])}</b><br>القاعة ${esc(c[C.room] || '')}</span><span class="b">الرقم السري<br><b>${esc(secretOf(sy, i, c[C.no]) || '—')}</b><br>${esc(sj[0] || '')}</span></div>`).join('')}</div>`); });
      return { page: 'a4', pages };
    } });
  add({ k: 'ex_secretsheet', t: 'ورقة التنقيط بالأرقام السرية (للمصحح)', grp: 'c', d: 'لكل مادة: الأرقام السرية مرتبة دون أسماء ولا أرقام امتحان، مع خانات النقطة بالأرقام وبالحروف وتوقيع المصحح.', auto: 'الأرقام السرية', page: 'a4', init: () => ({ subj: '1', per: '40' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }, { k: 'per', l: 'عدد الأوراق لكل مصحح(ة)', t: 'num' }],
    build: (s, f, sy) => {
      const ss = subjects(sy), pages = [], per = Math.max(5, parseInt(f.per, 10) || 40);
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || [''], S2 = candsOfSubj(sy, i).map(c => secretOf(sy, i, c[C.no])).filter(Boolean).sort((a, b) => +a - +b);
        for (let k = 0; k < Math.max(1, S2.length); k += per) { const part = S2.slice(k, k + per);
          const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'ورقة التنقيط بالأرقام السرية', `${sub(sy)}<br>المادة: ${esc(sj[0] || '')} — الحزمة ${Math.floor(k / per) + 1} (${part.length} ورقة)`), blocks: [tbl(thr(['ر.ت', 'الرقم السري', 'النقطة بالأرقام', 'النقطة بالحروف', 'ملاحظة']), (part.length ? part : ['']).map((x, j) => tr([j + 1, { t: x, c: 'b' }, '', { t: '', st: 'width:34%' }, ''])), 'big'), SB.sign(s, { three: ['اسم المصحح(ة) ورقم التأجير', 'التوقيع', 'تأشيرة رئيس(ة) مركز التصحيح'] })] });
          P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p))); } });
      return { page: 'a4', pages };
    } });
  // marks typed with the secret numbers, then the anonymity is lifted: the marks go to «النقط والنتائج»
  add({ k: 'ex_secretentry', t: 'إدخال النقط بالأرقام السرية ورفع السرية', grp: 'c', d: 'أدخل نقط مادة حسب الأرقام السرية كما في أوراق التنقيط، ثم «رفع السرية» يضع كل نقطة لصاحبها في جدول النقط والنتائج.', auto: 'الأرقام السرية', page: 'a4', init: () => ({ subj: '1', rows: [] }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjects(sy).map((r, i) => [String(i + 1), r[0]]) },
      { t: 'html', html: '<div class="btn-row"><button type="button" class="btn sm" data-act="fill">ملء الجدول بالأرقام السرية للمادة</button><button type="button" class="btn sm pri" data-act="lift">رفع السرية ونقل النقط</button></div>' },
      { k: 'rows', l: 'النقط حسب الأرقام السرية', t: 'grid', cols: ['الرقم السري', 'النقطة'], widths: ['1fr', '1fr'], types: ['ro', 'num'], fixed: true }],
    act: {
      fill: (f, sy, c) => { const si = (parseInt(f.subj, 10) || 1) - 1, old = new Map((f.rows || []).map(r => [nm(r[0]), r[1]])); const S2 = candsOfSubj(sy, si).map(x => secretOf(sy, si, x[C.no])).filter(Boolean).sort((a, b) => +a - +b);
        if (!S2.length) return c.toast('ولّد الأرقام السرية أولا', true); f.rows = S2.map(x => [x, old.get(x) || '']); c.save('rows'); },
      lift: (f, sy, c) => {
        const si = (parseInt(f.subj, 10) || 1) - 1, m = SM(sy), t = m.mode === 'subj' ? m.by[String(si)] : m.by.all; if (!t) return c.toast('ولّد الأرقام السرية أولا', true);
        const back = new Map(Object.entries(t).map(([no, sc]) => [sc, no])), Mk = Y(sy).marks; Mk.rows = Mk.rows || [];
        cands(sy).forEach(cd => { if (!Mk.rows.some(r => nm(r[0]) === nm(cd[C.no]))) Mk.rows.push([cd[C.no], cd[C.name]]); });
        let n = 0; (f.rows || []).forEach(([sc, v]) => { const no = back.get(nm(sc)); if (!no || nm(v) === '') return; const r = Mk.rows.find(x => nm(x[0]) === nm(no)); if (r) { r[3 + si] = String(v).replace(',', '.'); n++; } });
        persist(); c.toast(`تم رفع السرية: ${n} نقطة نقلت إلى جدول النقط (${subjects(sy)[si] ? subjects(sy)[si][0] : ''})`);
      } },
    build: (s, f, sy) => { const si = (parseInt(f.subj, 10) || 1) - 1, sj = subjects(sy)[si] || [''], t = SM(sy); const tb = t.mode === 'subj' ? t.by[String(si)] : t.by.all; const back = new Map(Object.entries(tb || {}).map(([no, sc]) => [sc, no]));
      return { title: 'محضر رفع السرية ونقل النقط', sub: `${sub(sy)}<br>المادة: ${esc(sj[0] || '')}`, page: 'a4', sign: SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' }), blocks: [tbl(thr(['ر.ت', 'الرقم السري', 'النقطة', 'رقم الامتحان', 'الاسم الكامل']), (f.rows || []).map((r, j) => { const no = back.get(nm(r[0])) || '', c = cands(sy).find(x => nm(x[C.no]) === no) || []; return tr([j + 1, { t: r[0], c: 'b' }, { t: r[1] || '', c: 'b' }, no, { t: c[C.name] || '', c: 'r' }]); }), 'cmp')] }; } });
  // the minutes of the correction centre
  const corrPV = (k, t, txt) => add({ k, t, grp: 'c', d: 'محضر رسمي لمركز التصحيح يوقعه أعضاء اللجنة.', auto: 'الجدولة', page: 'a4', init: () => ({ subj: 'all', ctr: '' }),
    defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }, { k: 'ctr', l: 'مركز التصحيح', ph: info(sy).center }],
    build: (s, f, sy) => { const ss = subjects(sy), pages = [];
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || ['', '', '', '', ''];
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, t, sub(sy)), blocks: [kv([['مركز التصحيح', nm(f.ctr) || info(sy).center], ['المادة', sj[0]], ['تاريخ الاختبار', sjDate(sj)], ['عدد المترشحين', String(candsOfSubj(sy, i).length)]]), { html: `<div class="sb-pv">${txt}</div>` },
          tbl(thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الصفة', 'التوقيع']), [1, 2, 3, 4, 5].map(j => tr([j, '', '', '', { t: '', st: 'height:8mm;width:22%' }])), 'big'), SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' })] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p))); });
      return { page: 'a4', pages }; } });
  corrPV('ex_open2', 'محضر فتح أظرفة أوراق التحرير بمركز التصحيح', '<p>تم بتاريخ .................. على الساعة .................. فتح أظرفة أوراق تحرير المترشحين الواردة من مراكز الامتحان وعددها: .................. بعد التأكد من سلامتها وأختامها ومطابقة عدد الأوراق بكل ظرف لما هو مدون عليه.</p><p>عدد أوراق التحرير: .................. — الأظرفة التي لوحظ عليها ما يستدعي التدوين: ..................</p><p>ملاحظات: ..........................................................................................................</p>');
  corrPV('ex_open3', 'محضر فتح أظرفة عناصر الإجابة وسلم التنقيط', '<p>تم بتاريخ .................. على الساعة .................. فتح ظرف عناصر الإجابة وسلم التنقيط الخاص بالمادة المذكورة، بعد التأكد من سلامته وأختامه، وتم تسليم نسخ منه للسادة المصححين.</p><p>عدد النسخ الموزعة: .................. — ملاحظات: ..........................................................................................................</p>');
  add({ k: 'ex_correpv', t: 'محضر التصحيح (لكل مادة)', grp: 'c', d: 'لكل مادة: المصححون، عدد الأوراق المصححة لكل واحد، التواريخ، والملاحظات والتوقيعات.', auto: 'الجدولة وطاقم المركز', page: 'a4', init: () => ({ subj: 'all' }), defs: (f, sy) => [{ k: 'subj', l: 'المادة', t: 'select', opts: subjOpts(sy) }],
    build: (s, f, sy) => { const ss = subjects(sy), St = staffRows(sy).filter(r => /تصحيح/.test(r[3] || '')), pages = [];
      subjIdx(f, sy).forEach(i => { const sj = ss[i] || ['', '', '', '', ''], sk = keysOf(sj[0]); const Cr = St.filter(r => !keysOf(subjOfStaff(r)).size || share(keysOf(subjOfStaff(r)), sk));
        const P = MK.flowPages({ page: 'a4', cls: 'sb', head: SB.head(s, 'محضر التصحيح', `${sub(sy)}<br>المادة: ${esc(sj[0] || '')}`), blocks: [kv([['عدد أوراق التحرير', String(candsOfSubj(sy, i).length)], ['تاريخ الاختبار', sjDate(sj)], ['بداية التصحيح', '....................'], ['نهاية التصحيح', '....................']]),
          tbl(thr(['ر.ت', 'المصحح(ة)', 'رقم التأجير', 'عدد الأوراق المصححة', 'من رقم سري', 'إلى رقم سري', 'التوقيع']), (Cr.length ? Cr : [[], [], [], []]).map((r, j) => tr([j + 1, { t: r[0] || '', c: 'r b' }, r[1] || '', '', '', '', { t: '', st: 'height:8mm;width:16%' }])), 'cmp'),
          { html: '<div class="vs-box ex-box"><div class="vs-bt">ملاحظات حول الموضوع وسلم التنقيط وسير عملية التصحيح</div><div class="vs-bb" style="min-height:26mm"></div></div>' }, SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح', right: 'منسق(ة) المادة' })] });
        P.forEach((p, j) => pages.push(j || !pages.length ? p : pb(p))); });
      return { page: 'a4', pages }; } });
  add({ k: 'ex_correport', t: 'تقرير حول سير عملية التصحيح', grp: 'c', d: 'تقرير رئيس مركز التصحيح: فتح الأظرفة، عملية التصحيح، المسك، الحالات المسجلة والملاحظات (قابل للتحرير).', auto: 'معطيات الامتحان', page: 'a4',
    init: () => ({ open: 'تم فتح أظرفة أوراق التحرير وعناصر الإجابة بحضور أعضاء اللجنة وكانت سليمة.', corr: 'مرت عملية التصحيح في ظروف عادية مع احترام سلم التنقيط.', entry: 'تم مسك النقط ومراجعتها ورفع السرية وفق المساطر المعمول بها.', cases: 'لا شيء يذكر.', other: '' }),
    defs: () => [{ k: 'open', l: 'فتح الأظرفة', t: 'area', rows: 2 }, { k: 'corr', l: 'عملية التصحيح', t: 'area', rows: 2 }, { k: 'entry', l: 'مسك النقط ورفع السرية', t: 'area', rows: 2 }, { k: 'cases', l: 'الحالات المسجلة', t: 'area', rows: 2 }, { k: 'other', l: 'ملاحظات واقتراحات', t: 'area', rows: 2 }],
    build: (s, f, sy) => ({ title: 'تقرير حول سير عملية التصحيح', sub: sub(sy), page: 'a4', sign: SB.sign(s, { left: 'خاتم وتوقيع رئيس(ة) مركز التصحيح' }), blocks: [kv([['عدد المترشحين', String(cands(sy).length)], ['عدد المواد', String(subjects(sy).length)], ['عدد المصححين', String(staffRows(sy).filter(r => /تصحيح/.test(r[3] || '')).length)], ['التاريخ', today()]]),
      ...[['فتح الأظرفة', f.open], ['عملية التصحيح', f.corr], ['مسك النقط ورفع السرية', f.entry], ['الحالات المسجلة', f.cases], ['ملاحظات واقتراحات', f.other]].map(([h, t]) => ({ html: `<div class="rp-h">${esc(h)}</div><p class="sb-p">${esc(nm(t) || '..............................................................................................................')}</p>` }))] }) });

  /* ================= 9. Massar: «نقط الامتحان حسب مركز الامتحان» ================= */
  function readMassar(rows) {
    const hi = rows.findIndex((r, i) => i < 40 && (r || []).some(x => /رقم الامتحان/.test(String(x))) && (r || []).some(x => /رمز التلميذ|الرقم الوطني|رمز مسار/.test(String(x))));
    if (hi < 0) return null;
    const H = rows[hi] || [], H2 = rows[hi + 1] || [], col = rx => H.findIndex(x => rx.test(String(x || '')));
    const c = { code: col(/رمز التلميذ|الرقم الوطني|رمز مسار/), name: col(/الاسم و?\s*النسب|الإسم/), no: col(/رقم الامتحان/), sch: col(/^المؤسسة$/), gresa: col(/رمز المؤسسة/) };
    const subj = []; H.forEach((x, j) => { const t = String(x || '').trim(); if (!t || j <= Math.max(c.no, c.name, c.code)) return; const isMark = /النقطة/.test(String(H2[j] || '')) || !String(H2[j] || '').trim(); if (!isMark) return; subj.push({ name: t, mark: j, abs: /التغيب|الغياب/.test(String(H2[j + 1] || '')) ? j + 1 : -1 }); });
    const list = []; for (let i = hi + 2; i < rows.length; i++) { const r = rows[i] || []; const code = String(r[c.code] || '').trim(), no = String(r[c.no] || '').trim(); if (!code && !no) continue; list.push({ row: i + 1, code: code.toUpperCase(), no, name: String(r[c.name] || '').trim(), sch: c.sch >= 0 ? String(r[c.sch] || '').trim() : '' }); }
    const meta = rx => { for (let i = 0; i < hi; i++) { const r = rows[i] || []; for (let j = 0; j < r.length; j++) if (rx.test(String(r[j] || ''))) { for (let k = j + 1; k < r.length; k++) if (String(r[k] || '').trim()) return String(r[k]).trim(); } } return ''; };
    return { hi, subj, list, level: meta(/^المستوى/), center: meta(/مركز الامتحان/) };
  }
  const L2C = i => { let s2 = ''; i++; while (i > 0) { const m = (i - 1) % 26; s2 = String.fromCharCode(65 + m) + s2; i = Math.floor((i - 1) / 26); } return s2; };
  const matchSubj = (name, ss) => { const k = keysOf(name); let j = ss.findIndex(r => nm(r[0]) === nm(name)); if (j < 0 && k.size) j = ss.findIndex(r => share(keysOf(r[0]), k)); return j; };
  async function importMassar(f, sy, c, withCands) {
    const res = await window.api.openTables(); if (!res || !res.files || !res.files.length) return;
    const F = res.files[0], sh = (F.sheets || []).find(x => readMassar(x.rows)) || null, p = sh ? readMassar(sh.rows) : null;
    if (!p) return c.toast('لم يتم العثور على جدول «نقط الامتحان حسب مركز الامتحان» (رقم الامتحان، رمز التلميذ...) في الملف', true);
    if (!F.b64) return c.toast('الملف كبير جدا للاحتفاظ به', true);
    Y(sy).massar = { name: F.name, b64: F.b64, sheet: sh.name, hi: p.hi, list: p.list, subj: p.subj, level: p.level, center: p.center, date: Dx.todayIso() };
    let added = 0;
    if (withCands) {
      const L = Y(sy).cands.rows = Y(sy).cands.rows || [];
      p.list.forEach(x => { let r = L.find(y => nm(y[C.code]) && nm(y[C.code]).toUpperCase() === x.code); if (!r) { r = [x.no, x.name, x.code, '', '', '', '', x.sch, '', '']; L.push(r); added++; } else if (!nm(r[C.no])) r[C.no] = x.no; });
      if (p.center && !nm(Y(sy).info.center)) Y(sy).info.center = p.center;
    }
    persist(); c.toast(`تم استيراد ملف مسار: ${p.list.length} مترشحا و${p.subj.length} مادة${withCands ? ` — أضيف ${added} مترشحا` : ''}`);
  }
  function massarCells(sy, f) {
    const ms = Y(sy).massar, ss = subjects(sy), M = Y(sy).marks.rows || [], L = cands(sy), cells = {}, rep = { ok: 0, miss: 0, abs: 0, nomatch: [] };
    if (!ms) return { cells, rep };
    const absTxt = nm(f.abs) || 'غ', mx = num(info(sy).max) || 20;
    ms.list.forEach(x => {
      const cd = L.find(c => nm(c[C.code]).toUpperCase() === x.code) || L.find(c => nm(c[C.no]) === x.no) || L.find(c => nm(c[C.name]) === x.name);
      if (!cd) { rep.nomatch.push(x.name || x.code); return; }
      const mr = M.find(r => nm(r[0]) === nm(cd[C.no]) && nm(r[0])) || M.find(r => nm(r[1]) === nm(cd[C.name])) || [];
      ms.subj.forEach(sb => {
        const j = matchSubj(sb.name, ss); if (j < 0) return;
        const v = nm(mr[3 + j]), ref = L2C(sb.mark) + x.row, refA = sb.abs >= 0 ? L2C(sb.abs) + x.row : '';
        if (/^(غ|غائب|abs|a)$/i.test(v)) { cells[ref] = ''; if (refA) cells[refA] = absTxt; rep.abs++; return; }
        const n2 = num(v); if (n2 == null) { rep.miss++; return; }
        cells[ref] = Math.round(Math.min(mx, Math.max(0, n2)) * 100) / 100; if (refA) cells[refA] = ''; rep.ok++;
      });
    });
    return { cells, rep };
  }
  add({ k: 'ex_massar', t: 'ملف نقط مسار (نقط الامتحان حسب مركز الامتحان)', grp: 'r', d: 'استورد من مسار ملف «نقط الامتحان حسب مركز الامتحان» فارغا، فيعيده البرنامج معبأ بنقط كل مادة والتغيبات (من جدول النقط) دون المس بباقي محتواه، جاهزا لإعادة رفعه في مسار.', auto: 'النقط والمترشحون', page: 'a4l',
    init: () => ({ abs: 'غ' }),
    defs: (f, sy) => { const ms = Y(sy).massar; return [{ t: 'html', html: `<div class="btn-row"><button type="button" class="btn sm" data-act="imp">استيراد ملف مسار (فارغ)</button><button type="button" class="btn sm" data-act="impc">استيراده مع إضافة المترشحين</button><button type="button" class="btn sm pri" data-act="exp" ${ms && ms.b64 ? '' : 'disabled'}>تصدير الملف معبأ بالنقط</button></div>` },
      { note: ms && ms.b64 ? `الملف: ${esc(ms.name)} — ${ms.list.length} مترشحا — المواد: ${esc(ms.subj.map(x => x.name).join('، '))} — مطابقة المواد: ${esc(ms.subj.map(x => { const j = matchSubj(x.name, subjects(sy)); return j < 0 ? x.name + ' ← ؟' : x.name + ' ← ' + subjects(sy)[j][0]; }).join(' | '))}` : 'لم يستورد بعد. في مسار: الامتحانات ← مسك النقط حسب مركز الامتحان ← تصدير الملف (Excel)، ثم استورده هنا.' },
      { k: 'abs', l: 'رمز التغيب في خانة «التغيب» (كما يقبله ملف مسار)', half: true, dir: 'auto' }, { note: 'النقطة «غ» أو «غائب» في جدول النقط تعني غياب المترشح(ة) في تلك المادة.' }]; },
    act: { imp: (f, sy, c) => importMassar(f, sy, c, false).then(() => c.redraw && c.redraw()), impc: (f, sy, c) => importMassar(f, sy, c, true).then(() => c.redraw && c.redraw()),
      exp: async (f, sy, c) => {
        const ms = Y(sy).massar; if (!ms || !ms.b64) return c.toast('استورد ملف مسار أولا', true);
        if (!window.api.patchXlsxMany) return c.toast('التصدير غير متوفر في هذه النسخة', true);
        const { cells, rep } = massarCells(sy, f); if (!rep.ok && !rep.abs) return c.toast('لا توجد نقط مطابقة لملء الملف (تحقق من جدول النقط ومطابقة المواد)', true);
        const r = await window.api.patchXlsxMany([{ b64: ms.b64, sheet: ms.sheet, cells, name: ms.name.replace(/\.xlsx?$/i, '') + '_معبأ.xlsx' }]);
        if (r && r.ok) c.toast(`تم حفظ ملف مسار المعبأ: ${rep.ok} نقطة و${rep.abs} تغيبا${rep.nomatch.length ? ` — ${rep.nomatch.length} مترشحا غير موجود في لائحة البرنامج` : ''}`); } },
    build: (s, f, sy) => {
      const ms = Y(sy).massar; if (!ms) return { title: 'ملف نقط مسار', sub: sub(sy), page: 'a4l', blocks: [{ html: '<p class="sb-p">استورد ملف «نقط الامتحان حسب مركز الامتحان» من مسار.</p>' }] };
      const { cells, rep } = massarCells(sy, f), ss = subjects(sy);
      const rows = ms.list.map((x, i) => tr([i + 1, { t: x.no, c: 'b' }, { t: x.code, c: 'ltr' }, { t: x.name, c: 'r' }].concat(ms.subj.map(sb => { const v = cells[L2C(sb.mark) + x.row], a = sb.abs >= 0 ? cells[L2C(sb.abs) + x.row] : ''; return { t: a ? a : v == null || v === '' ? '' : String(v), c: a ? 'b' : '' }; }))));
      return { title: 'معاينة ملف نقط مسار قبل التصدير', sub: `${sub(sy)}<br>${esc(ms.name)} — نقط: ${rep.ok} — تغيبات: ${rep.abs} — ناقصة: ${rep.miss}${rep.nomatch.length ? ' — غير مطابقين: ' + rep.nomatch.length : ''}`, page: 'a4l', blocks: [tbl(thr(['ر.ت', 'رقم الامتحان (مسار)', 'رمز التلميذ', 'الاسم والنسب'].concat(ms.subj.map(x => x.name))), rows, 'cmp')] };
    } });

  /* ================= 9b. documents shown according to the cycle and the kind of exam ================= */
  const centralized = I => I.type !== 'local';     // provincial / regional / national exams: correction centres and anonymity
  const WHEN = { ex_secret: centralized, ex_secretlabels: centralized, ex_secretsheet: centralized, ex_secretentry: centralized, ex_open2: centralized, ex_open3: centralized, ex_correport: centralized, ex_seccorr: centralized,
    ex_envreceipt: (I, k) => I.level === 'P6' || k === 'pri', ex_invite: I => !/^B/.test(I.level) };
  DOCS.forEach(d => { if (WHEN[d.k]) d.when = WHEN[d.k]; });

  /* ================= 10. order of the documents in the groups (fourth level of the navigation) ================= */
  X.GROUPS.length = 0;
  [['d', 'إعداد الامتحان (بالترتيب)', 'المعطيات، المترشحون، الجدولة، القاعات، الطاقم، الحراسة، النقط'], ['k', 'المترشحون والاستدعاءات', 'لوائح، استدعاءات، بطائق، ملصقات الطاولات، الإحصاء'],
    ['s', 'الطاقم والحراسة', 'التكليفات، الاستدعاءات، البادجات، العدالة، الساعات'], ['e', 'الأظرفة والمحاضر', 'الأظرفة، فتحها وإغلاقها، التوقيعات، الغياب، الحراسة، الغش، التقارير'],
    ['a', 'الملصقات والتشوير', 'التوجيهات، نصف التوقيت، منع الهاتف، تعليمات المترشح، القانون، التشوير'], ['c', 'مركز التصحيح', 'الأرقام السرية، الأظرفة، التنقيط، رفع السرية، المحاضر'],
    ['r', 'النتائج ومسار', 'محضر المداولات، الإحصائيات، الاستحقاق، ملف نقط مسار']].forEach(g => X.GROUPS.push(g));
  const MOVE = { ex_byroom: 'k', ex_convoc: 'k', ex_labels: 'k', ex_receipt: 'k', ex_tech: 'k', ex_assign: 's', ex_gstats: 's', ex_ghours: 's', ex_secexam: 's', ex_seccorr: 'c', ex_marksheet: 'c',
    ex_sign: 'e', ex_absent: 'e', ex_covers: 'e', ex_handover: 'e', ex_absgrid: 'e', ex_abstrack: 'e', ex_guardpv: 'e', ex_envopen: 'e', ex_envclose: 'e', ex_open: 'e', ex_close: 'e', ex_proc: 'e', ex_fraud: 'e', ex_report: 'e', ex_rules: 'a' };
  DOCS.forEach(d => { if (MOVE[d.k]) d.grp = MOVE[d.k]; if (d.grp === 'o') d.grp = 'e'; if (d.grp === 'p') d.grp = 'e'; });

  Dx.modCss += `
  .ex-mis{display:flex;flex-direction:column;height:100%}.ex-mih{flex:1;overflow:hidden}.ex-mi{font-size:10.6pt;line-height:1.75}.ex-mi p{margin:0 0 1.2mm}.ex-mi .c{text-align:center}.ex-mi .big{font-size:13pt}
  .ex-mi-s{display:flex;justify-content:space-between;margin:2mm 0;font-weight:700}.ex-mi-r{border-top:1px dashed #555;padding-top:1.5mm;font-size:9.6pt;line-height:1.9}
  .ex-sc{border:1.3px solid #1f3864;border-radius:2mm;padding:2mm 3mm;margin:0 0 2mm;font-size:9.8pt;line-height:1.55}.ex-sc-h{display:flex;justify-content:space-between;color:#1f3864;border-bottom:1px solid #4472c4;margin-bottom:1mm}.ex-sc-h b{font-size:14pt}
  .ex-sc-g{display:grid;grid-template-columns:1fr 1fr;column-gap:4mm}.ex-sc-t{margin:1.5mm 0;width:100%}.ex-sc-n{font-size:8.2pt;color:#333}.ex-sc-s{text-align:left;font-weight:700;min-height:10mm}
  .ex-bdg{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:64mm;gap:4mm}.ex-bdg>div{border:2px solid var(--c);border-radius:4mm;overflow:hidden;display:flex;flex-direction:column;text-align:center}
  .ex-bdg .h{font-size:8.6pt;padding:1.5mm;color:#333}.ex-bdg .r{background:var(--c);color:#fff;font-weight:700;font-size:15pt;padding:2mm;-webkit-print-color-adjust:exact;print-color-adjust:exact}.ex-bdg .n{flex:1;display:flex;align-items:center;justify-content:center;font-size:16pt;font-weight:700;padding:0 2mm}.ex-bdg .c{font-size:9pt;padding:1.5mm;border-top:1px solid #ccc}
  .ex-verd{text-align:center;font-weight:700;font-size:13pt;padding:3mm;border-radius:2mm;margin-bottom:2mm}.ex-verd.ok{background:#e7f6ec;color:#1f7a45}.ex-verd.bad{background:#fdecea;color:#c62828}.ex-verd small{font-weight:400;font-size:9.5pt;color:#333}
  .ex-envs{display:flex;flex-direction:column;height:100%}.ex-env{flex:1;border:2.5px solid #1f3864;border-radius:4mm;padding:5mm 7mm;display:flex;flex-direction:column;justify-content:space-around;text-align:center;color:#1f3864}
  .ex-env .h{font-size:11pt}.ex-env .k{font-size:20pt;font-weight:700}.ex-env .t{font-size:12pt}.ex-env .s{font-size:18pt}.ex-env .d{font-size:12pt}.ex-env .g{font-size:13pt;line-height:1.8}.ex-env .g .rm b{font-size:40pt;border:2px solid #1f3864;border-radius:3mm;padding:0 6mm}.ex-env .f{font-size:10pt;color:#c0392b;font-weight:700}
  .ex-crd{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:64mm;gap:3mm}.ex-crd>div{border:1.4px solid #1f3864;border-radius:3mm;padding:2.5mm;position:relative;font-size:9.8pt;line-height:1.7}
  .ex-crd .ph{position:absolute;left:2.5mm;top:9mm;width:22mm;height:28mm;border:1px dashed #888;display:flex;align-items:center;justify-content:center;font-style:normal;color:#999;font-size:8pt}
  .ex-crd .h{font-size:8.6pt;color:#1f3864;border-bottom:1px solid #4472c4;margin-bottom:1mm}.ex-crd .n{font-size:13pt;font-weight:700;margin-bottom:1mm}.ex-crd .g{display:flex;flex-direction:column;padding-left:26mm}.ex-crd .big{font-size:14pt}
  .ex-abs{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:128mm;gap:4mm}.ex-ab{border:2px solid #c0392b;border-radius:3mm;padding:3mm;display:flex;flex-direction:column;text-align:center}
  .ex-ab .t{font-size:16pt;font-weight:700;color:#c0392b}.ex-ab .e{font-size:9pt}.ex-ab .g{display:flex;flex-direction:column;text-align:right;line-height:2;margin:2mm 0;font-size:10.5pt}.ex-ab .big{font-size:14pt}.ex-ab .w{flex:1;display:flex;align-items:center;justify-content:center;font-size:34pt;font-weight:700;color:#c0392b;border:2px dashed #c0392b;border-radius:3mm;margin:2mm 0}.ex-ab .s{display:flex;justify-content:space-between;font-size:9pt;min-height:14mm}
  .ex-pst{text-align:center;margin-top:6mm}.ex-pst .e{font-size:13pt;font-weight:700;color:#1f3864}.ex-pst .big{font-size:40pt;font-weight:700;color:#1f3864;margin:6mm 0;font-family:'MAJT','Amiri',serif}.ex-pst .red{color:#c0392b}
  .ex-pst .m{font-size:30pt}.ex-pst .m b{font-size:60pt;border:3px solid #1f3864;border-radius:4mm;padding:0 8mm}.ex-pst .n{font-size:17pt;line-height:1.8;margin-top:6mm}.ex-pst .ico{font-size:110pt;line-height:1.1}
  .ex-pst .l{text-align:right;font-size:15pt;line-height:1.9;padding-right:10mm}.ex-pst .w{font-size:16pt;font-weight:700;text-align:right}.ex-pst .p{text-align:justify;font-size:14pt;line-height:1.85;margin:2mm 0}.ex-pst .f{margin-top:8mm;background:#fdecea;border:2px solid #c0392b;border-radius:3mm;padding:4mm;font-size:20pt;font-weight:700;color:#c0392b;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  .ex-pst.half .big{font-size:56pt;color:#c0392b}
  .ex-sign{height:100%;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:5px solid #1f3864;border-radius:8mm;color:#1f3864}.ex-sign .t{font-size:62pt;font-weight:700;font-family:'MAJT','Amiri',serif;line-height:1.3}.ex-sign .a{font-size:120pt;line-height:1}.ex-sign .c{font-size:13pt;margin-top:6mm;color:#555}
  .ex-ol{font-size:12pt;line-height:1.9;padding-right:7mm}.ex-ol li{margin-bottom:1.2mm}
  .ex-sl{display:grid;grid-template-columns:1fr 1fr 1fr;grid-auto-rows:33mm;gap:2mm}.ex-sl>div{display:flex;border:1px solid #333;border-radius:1.5mm;overflow:hidden;font-size:8.6pt;text-align:center}.ex-sl .a{flex:1;border-left:1.5px dashed #333;padding:1mm;display:flex;flex-direction:column;justify-content:center}.ex-sl .b{flex:1;padding:1mm;display:flex;flex-direction:column;justify-content:center;background:#f2f5fa}.ex-sl b{font-size:15pt}`;
  { const c = document.createElement('style'); c.textContent = `
    .ex-ai{margin-bottom:12px;border-inline-start:5px solid var(--sec,#0f6e5a)}.ex-ai-h{display:flex;align-items:center;gap:10px;padding:10px 14px;flex-wrap:wrap}.ex-ai-t{font-weight:700;font-size:15px}
    .ex-ai-p{width:160px;height:9px;background:#e8ecf2;border-radius:5px;overflow:hidden}.ex-ai-p i{display:block;height:100%;background:linear-gradient(90deg,#2f7d32,#7cb342)}
    .ex-ai-b{padding:0 14px 10px}.ex-ai-r{display:flex;align-items:center;gap:8px;padding:5px 8px;border-radius:7px;margin-bottom:3px;font-size:13px}.ex-ai-r .tx{flex:1}
    .ex-ai-r.err{background:#fdecea}.ex-ai-r.warn{background:#fff6e0}.ex-ai-r.ok{background:#eef8f0}.ex-ai-r.info{background:#eef3fb}`; document.head.appendChild(c); }
  window.Exams2 = { audit, smartDistribute, smartGuards, readMassar, massarCells, keysOf };
})();
