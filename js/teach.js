'use strict';
/* 1.9.2 — توزيع الأساتذة (خانة جديدة) + وثيقتان في السبورة المرجعية:
   - الابتدائي: توزيع الأساتذة على الوحدات المدرسية والأقسام، مع المادة المدرسة خلال فترة الدعم (TaRL) وخلال إرساء الموارد (التعليم الصريح)
   - الثانوي الإعدادي: لا وحدات مدرسية؛ لكل أستاذ(ة) مادة التخصص والأقسام المسندة وعدد الساعات
   - «التنظيم التربوي للسنة الدراسية» (نموذج المديرية: هيئة الإدارة، هيئة التأطير، هيئة التدريس، المكلفون، مربو التعليم الأولي، أنصاف أيام العمل)
   - «قراءة في المقرر الوزاري المنظم للسنة الدراسية» (المستجدات، الأنشطة والعمليات، المراقبة المستمرة والامتحانات، العطل) */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl } = window.K;
  const nm = t => String(t == null ? '' : t).trim();
  function migrate(db) { const o = db.teach = db.teach || {}; o.years = o.years && typeof o.years === 'object' ? o.years : {}; }
  const Y = sy => { migrate(DB); const y = DB.teach.years[sy] || (DB.teach.years[sy] = {}); ['assign', 'org'].forEach(k => { if (!y[k] || typeof y[k] !== 'object') y[k] = {}; }); return y; };
  const isCol = () => typeof S === 'function' && /إعدادي|تأهيلي/.test(S().cycle || '');   // 1.9.3: collège AND lycée (no school units, no TaRL)
  const cycTxt = () => (window.Cyc ? Cyc.label() : 'الثانوي الإعدادي');
  const modeOf = sy => (isCol() ? 'col' : (Y(sy).assign.mode || 'pri'));   // a collège / lycée never uses the primary layout
  const emp = n => K.E.byName(n);
  const D7 = ['الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت', 'الأحد'];   // 1.9.4: the whole week (the Sunday is shown on demand)
  const nh = s => MK.hkey(s);
  // «الأربعاء م، السبت م» -> set of rest half-days
  const restSet = txt => {
    const out = new Set(); const t = nh(txt || '');
    D7.forEach((d, i) => { const k = nh(d).replace(/^ال/, ''); const rx = new RegExp(k + '\\s*(ص|م|صباحا|مساء|كامل)?', 'g'); let m; while ((m = rx.exec(t))) { const w = m[1] || 'كامل'; if (/^ص/.test(w)) out.add(i + 'ص'); else if (/^م/.test(w)) out.add(i + 'م'); else { out.add(i + 'ص'); out.add(i + 'م'); } } });
    return out;
  };
  // work half-days of a teacher: the default week is Monday–Friday (morning + afternoon) and Saturday morning; the Sunday is a rest day
  const workFromRest = txt => { const R = restSet(txt); const W = new Set(); for (let i = 0; i < 6; i++) ['ص', 'م'].forEach(h => { const k = i + h; if (R.size ? !R.has(k) : !(i === 5 && h === 'م')) W.add(k); }); return W; };
  // rest half-days (Monday–Saturday) written as text: «الأربعاء م، السبت»
  const restText = W => { const o = []; for (let i = 0; i < 6; i++) { const a = W.has(i + 'ص'), b = W.has(i + 'م'); if (!a && !b) o.push(D7[i]); else if (!a) o.push(D7[i] + ' ص'); else if (!b) o.push(D7[i] + ' م'); } return o.join('، '); };
  // the detailed choice (matrix) is used while the rest text of the row is the one it generated; a text typed afterwards takes over
  const workOf = (sy, name, rest) => { const h = (Y(sy).assign.half || {})[name]; return h && Array.isArray(h.w) && nm(h.t) === nm(rest) ? new Set(h.w) : workFromRest(rest); };
  const restIdx = sy => (modeOf(sy) === 'col' ? 5 : 6);
  const PRI_COLS = ['الأستاذ(ة)', 'الوحدة المدرسية', 'المستويات / الأقسام', 'المادة: فترة الدعم TaRL', 'المادة: إرساء الموارد (التعليم الصريح)', 'عدد التلاميذ', 'أنصاف أيام الراحة'];
  const COL_COLS = ['الأستاذ(ة)', 'مادة التخصص', 'الأقسام المسندة', 'عدد الساعات الأسبوعية', 'عدد التلاميذ', 'أنصاف أيام الراحة'];
  const rows = sy => (Y(sy).assign.rows || []).filter(r => nm(r[0]));
  const subjOf = e => nm(e.subject) || (/فرنسية|فرنسي/.test(e.teachLang || '') ? 'فر' : /عربية/.test(e.teachLang || '') ? 'عر + ر' : /أمازيغية/.test(e.teachLang || '') ? 'امازيغية' : '');
  const pupilsOfLevels = (sy, unit, lv) => {
    if (!window.Pupils) return '';
    const L = Pupils.current(sy).filter(p => (!unit || K.U.same(p.unit, unit)));
    const ds = String(lv || '').match(/[1-6]/g) || [];
    const n = ds.length ? L.filter(p => ds.includes(String(p.lvl || '').replace(/\D/g, ''))).length : 0;
    return n ? String(n) : '';
  };

  /* ---------- 1.9.4: teachers <-> school units through the GRESA code (Esise XML) ---------- */
  const grp = () => !!(window.Cyc ? Cyc.group() : !isCol());
  // the unit of a teacher: its GRESA code (kept from the XML file) when the unit is registered, otherwise the name typed / imported
  const unitOfEmp = e => {
    if (e.unitGresa && window.Units) { const u = Units.byGresa(e.unitGresa); if (u) return u.name; }
    return nm(e.unit);
  };
  const servesAt = (e, name, u) => (e.unitServices || []).some(sv => (u && u.gresa && sv.code === u.gresa) || (sv.unit && K.U.same(sv.unit, name))) || (!!e.alsoAt && nh(e.alsoAt).includes(nh(name)));
  const servLevels = (e, name, u) => { const sv = (e.unitServices || []).find(x => (u && u.gresa && x.code === u.gresa) || (x.unit && K.U.same(x.unit, name))); return sv ? nm(sv.levels) : ''; };
  // distribution of the teachers and the pupils over the units registered in the settings
  function distribution(sy) {
    const T = K.E.teachers(), units = window.Units ? Units.list() : [], names = units.map(u => u.name);
    T.forEach(e => { const u = unitOfEmp(e); if (u && !names.some(n => K.U.same(n, u))) names.push(u); });
    const pup = window.Pupils ? Pupils.current(sy) : [];
    pup.forEach(p => { if (p.unit && !names.some(n => K.U.same(n, p.unit))) names.push(p.unit); });
    const out = names.map(n => {
      const u = units.find(x => K.U.same(x.name, n)) || null;
      const mine = T.filter(e => K.U.same(unitOfEmp(e), n)), also = T.filter(e => !K.U.same(unitOfEmp(e), n) && servesAt(e, n, u));
      const P = pup.filter(p => K.U.same(p.unit, n));
      const c = { m: P.filter(p => p.g === 'M').length, f: P.filter(p => p.g === 'F').length, t: P.length };
      return { name: n, gresa: u ? u.gresa : '', mine, also, P, c, classes: new Set(P.map(p => p.cls).filter(Boolean)).size };
    });
    const none = T.filter(e => !unitOfEmp(e));
    return { units: out, none, T };
  }
  const units1 = u => (window.Units ? Units.list().find(x => K.U.same(x.name, u.name)) : null);
  const ratio = (p, t) => (t ? (p / t).toFixed(1).replace(/\.0$/, '') : '');

  const DOCS = [];
  const add = d => DOCS.push(d);
  add({
    k: 'assign', t: 'إسناد الأقسام والمواد للأساتذة', grp: 'd', get d() { return isCol() ? 'مادة التخصص والأقسام المسندة وعدد الساعات لكل أستاذ(ة).' : 'الوحدة المدرسية والمستويات والمادة خلال فترة TaRL وخلال التعليم الصريح.'; }, get auto() { return isCol() ? 'لائحة الموظفين (المستويات، المادة) وبطاقة التلاميذ' : 'لائحة الموظفين (الوحدة، المستويات، المادة) وبطاقة التلاميذ'; }, page: 'a4l',
    init: () => ({ mode: isCol() ? 'col' : 'pri', rows: [] }),
    defs: (f) => {
      const col = isCol() || (f.mode || 'pri') === 'col';
      return [{ k: 'mode', l: 'السلك', t: 'select', opts: (isCol() ? [] : [['pri', 'التعليم الابتدائي (وحدات مدرسية + TaRL / التعليم الصريح)']]).concat([['col', 'الثانوي (إعدادي / تأهيلي: مواد التخصص والأقسام والساعات)']]) },
        { t: 'html', html: '<button type="button" class="btn sm pri" data-act="all">ملء الجدول من لائحة الأساتذة</button>' },
        { note: col ? 'الأقسام هكذا: 1APIC-1، 2APIC-3 ... أو 1/1، 2/3. أنصاف أيام الراحة مثلا: «الأربعاء م، السبت م» (أو حدّدها بالتفصيل لكل أيام الأسبوع من وثيقة «التنظيم التربوي»).' : 'المادة: عر، فر، ر، عر + ر، فر + ر، امازيغية... المستويات مثلا: (1+2) (3+4). أنصاف أيام الراحة مثلا: «الأربعاء م، السبت م».' },
        { k: 'rows', l: 'الإسناد', t: 'grid', cols: col ? COL_COLS : PRI_COLS, widths: col ? ['1.3fr', '1fr', '1.4fr', '.6fr', '.6fr', '1fr'] : ['1.2fr', '.9fr', '1fr', '.8fr', '.8fr', '.5fr', '.9fr'],
          list: col ? ['k2Emps', 'teSubj', null, null, null, null] : ['k2Emps', 'k2Units', null, 'teS', 'teS', null, null], dls: { teSubj: ['اللغة العربية', 'اللغة الفرنسية', 'اللغة الإنجليزية', 'الرياضيات', 'علوم الحياة والأرض', 'الفيزياء والكيمياء', 'الاجتماعيات', 'التربية الإسلامية', 'التربية البدنية', 'المعلوميات', 'التربية التشكيلية', 'التربية الموسيقية', 'التربية الأسرية', 'التكنولوجيا'], teS: ['عر', 'فر', 'ر', 'عر + ر', 'فر + ر', 'امازيغية', 'إنجليزية'] },
          link: { src: 'emp', n: 0, cols: {}, post: (row, r) => { const e = r.rec || {}; if (col) { row[1] = row[1] || e.subject || ''; row[2] = row[2] || e.levels || ''; } else { row[1] = row[1] || e.unit || ''; row[2] = row[2] || e.levels || ''; row[3] = row[3] || subjOf(e); row[4] = row[4] || subjOf(e); } } } }];
    },
    act: { all: (f, sy, c) => {
      const col = isCol() || (f.mode || modeOf(sy)) === 'col';
      const L = K.E.teachers();
      if (!L.length) return c.toast('لا يوجد أساتذة في لائحة الموظفين', true);
      const old = f.rows || [];
      f.rows = L.map(e => { const n = fullName(e), o = old.find(r => nm(r[0]) === n); if (o) return o;
        return col ? [n, e.subject || '', e.levels || '', '', '', ''] : [n, unitOfEmp(e), e.levels || '', subjOf(e), subjOf(e), pupilsOfLevels(sy, unitOfEmp(e), e.levels), '']; });
      c.save('rows');
    } },
    onSave: k => { if (k === 'mode') setTimeout(() => { const b = document.querySelector('#cfDoc'); if (b) b.dispatchEvent(new Event('change')); }, 50); },
    build: (s, f, sy) => {
      const col = modeOf(sy) === 'col', R = rows(sy);
      if (col) return { title: 'توزيع الأساتذة حسب مواد التخصص والأقسام', sub: `${cycTxt()} — الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }),
        blocks: [tbl(thr(['ر.ت', 'الأستاذ(ة)', 'رقم التأجير', 'مادة التخصص', 'الأقسام المسندة', 'الساعات', 'التلاميذ', 'أنصاف أيام الراحة']), R.map((r, i) => tr([i + 1, { t: r[0], c: 'r b' }, (emp(r[0]) || {}).ppr || '', { t: r[1], c: 'b' }, { t: r[2], c: 'ltr' }, r[3], r[4], { t: r[5], c: 'sm' }])), 'big')] };
      return { title: grp() ? 'توزيع الأساتذة على الوحدات المدرسية والأقسام' : 'توزيع الأساتذة على الأقسام', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }),
        blocks: [tbl(thr(['ر.ت', 'الوحدة المدرسية', 'الأستاذ(ة)', 'رقم التأجير', 'المستويات / الأقسام', 'المادة (TaRL)', 'المادة (إرساء الموارد)', 'التلاميذ', 'أنصاف أيام الراحة']), R.map((r, i) => tr([i + 1, { t: r[1], c: 'k' }, { t: r[0], c: 'r b' }, (emp(r[0]) || {}).ppr || '', r[2], r[3], r[4], r[5], { t: r[6], c: 'sm' }])), 'big')] };
    }
  });
  add({
    k: 'te_units', unitsPri: true, get t() { return isCol() ? 'توزيع الأساتذة حسب مواد التخصص' : 'توزيع الأساتذة على الوحدات المدرسية'; }, grp: 'o', get d() { return isCol() ? 'لكل مادة: الأساتذة والأقسام المسندة والساعات.' : 'لكل وحدة مدرسية: الأساتذة والمستويات وعدد التلاميذ.'; }, auto: 'إسناد الأقسام', page: 'a4', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const R = rows(sy), col = modeOf(sy) === 'col';
      const key = r => nm(col ? r[1] : r[1]) || 'غير محدد';
      const groups = []; R.forEach(r => { const k = key(r); if (!groups.includes(k)) groups.push(k); });
      return { title: col ? 'توزيع الأساتذة حسب مواد التخصص' : 'توزيع الأساتذة على الوحدات المدرسية', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }),
        blocks: groups.map(g => { const L = R.filter(r => key(r) === g); return { before: SB.cap(`${col ? 'المادة' : 'الوحدة المدرسية'}: ${esc(g)} — عدد الأساتذة: ${L.length}`, 'r'), table: { cls: 'sb-t', head: thr(col ? ['ر.ت', 'الأستاذ(ة)', 'الأقسام', 'الساعات', 'التلاميذ'] : ['ر.ت', 'الأستاذ(ة)', 'المستويات / الأقسام', 'TaRL', 'إرساء الموارد', 'التلاميذ']),
          rows: L.map((r, i) => tr(col ? [i + 1, { t: r[0], c: 'r b' }, { t: r[2], c: 'ltr' }, r[3], r[4]] : [i + 1, { t: r[0], c: 'r b' }, r[2], r[3], r[4], r[5]])) } }; }) };
    }
  });
  add({
    k: 'te_dist', t: 'توزيع الأساتذة والتلاميذ على الوحدات المدرسية (حسب رمز GRESA)', grp: 'o', unitsOnly: true, page: 'a4l',
    d: 'لكل وحدة مسجلة في الإعدادات: رمز GRESA، الأساتذة المرتبطون بها (من ملفات Esise XML)، الأقسام وعدد التلاميذ ومتوسط التلاميذ لكل أستاذ(ة).',
    auto: 'لائحة الموظفين (الوحدة ورمز GRESA) وبطاقة التلاميذ', init: () => ({ note: '' }), defs: () => [{ k: 'note', l: 'ملاحظة أسفل الوثيقة', t: 'area', rows: 2 }],
    build: (s, f, sy) => {
      const D = distribution(sy), U = D.units.filter(u => u.mine.length || u.also.length || u.c.t || u.gresa);
      const tot = U.reduce((a, u) => ({ t: a.t + u.mine.length, a: a.a + u.also.length, cl: a.cl + u.classes, m: a.m + u.c.m, f: a.f + u.c.f, p: a.p + u.c.t }), { t: 0, a: 0, cl: 0, m: 0, f: 0, p: 0 });
      const head = thr(['ر.ت', 'الوحدة المدرسية', 'رمز GRESA', 'عدد الأساتذة', 'يدرّسون كذلك بها', 'الأقسام', 'الذكور', 'الإناث', 'مجموع التلاميذ', 'تلميذ(ة) لكل أستاذ(ة)'].map(t => ({ t, c: 'd' })));
      const sum = U.map((u, i) => tr([i + 1, { t: u.name, c: 'k' }, { t: u.gresa, c: 'ltr' }, u.mine.length, u.also.length || '', u.classes || '', u.c.m, u.c.f, { t: u.c.t, c: 'y' }, ratio(u.c.t, u.mine.length)]))
        .concat([tr([{ t: 'المجموع', c: 's', s: 3 }, { t: tot.t, c: 's' }, { t: tot.a || '', c: 's' }, { t: tot.cl, c: 's' }, { t: tot.m, c: 's' }, { t: tot.f, c: 's' }, { t: tot.p, c: 't' }, { t: ratio(tot.p, tot.t), c: 's' }])]);
      const blocks = [{ before: SB.cap('ملخص التوزيع حسب الوحدات المدرسية', 'r'), table: { cls: 'sb-t', head, rows: sum } }];
      U.forEach(u => {
        const L = u.mine.concat(u.also);
        if (!L.length) return;
        blocks.push({ before: SB.cap(`الوحدة المدرسية: ${esc(u.name)}${u.gresa ? ` — رمز <bdi dir="ltr">GRESA: ${esc(u.gresa)}</bdi>` : ''} — <bdi>${u.mine.length}</bdi> أستاذ(ة) — <bdi>${u.c.t}</bdi> تلميذ(ة) في <bdi>${u.classes}</bdi> قسم`, 'r'),
          table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الأستاذ(ة)', 'رقم التأجير', 'الإطار', 'المستويات المسندة', 'المادة / اللغة', 'التلاميذ', 'ملاحظات'].map(t => ({ t, c: 'd' }))),
            rows: L.map((e, i) => { const also = u.also.includes(e), lv = also ? servLevels(e, u.name, units1(u)) : nm(e.levels);
              return tr([i + 1, { t: fullName(e), c: 'r b' }, e.ppr || '', { t: e.cadre || '', c: 'sm' }, { t: lv, c: 'ltr' }, subjOf(e), pupilsOfLevels(sy, u.name, lv), { t: also ? `يدرّس كذلك بهذه الوحدة (الأصل: ${unitOfEmp(e)})` : '', c: 'sm' }]); }) } });
      });
      if (D.none.length) blocks.push({ before: SB.cap(`أساتذة غير مرتبطين بوحدة مدرسية (${D.none.length})`, 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الأستاذ(ة)', 'رقم التأجير', 'المستويات'].map(t => ({ t, c: 'd' }))), rows: D.none.map((e, i) => tr([i + 1, { t: fullName(e), c: 'r b' }, e.ppr || '', { t: nm(e.levels), c: 'ltr' }])) } });
      if (f.note) blocks.push({ html: `<div class="sb-note">${esc(f.note)}</div>` });
      return { title: 'توزيع الأساتذة والتلاميذ على الوحدات المدرسية', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }), blocks };
    }
  });
  add({
    k: 'te_classes', t: 'توزيع الأساتذة على الأقسام', grp: 'o', get d() { return isCol() ? 'جدول الأقسام × المواد: أستاذ(ة) كل مادة بكل قسم.' : 'لكل قسم (أو مستوى): الأستاذ(ة) المسؤول(ة) والمادة المدرسة.'; }, auto: 'إسناد الأقسام', page: 'a4l', init: () => ({}), defs: () => [],
    build: (s, f, sy) => {
      const R = rows(sy), col = modeOf(sy) === 'col';
      const split = t => String(t || '').split(/[\s،,؛;+()]+/).map(x => x.trim()).filter(Boolean);
      if (col) {
        const classes = Array.from(new Set([].concat(...R.map(r => split(r[2]))))).sort((a, b) => a.localeCompare(b, 'ar', { numeric: true }));
        const subs = Array.from(new Set(R.map(r => nm(r[1])).filter(Boolean)));
        return { title: 'جدول إسناد الأقسام حسب المواد', sub: `${cycTxt()} — الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }),
          blocks: [tbl(thr(['القسم'].concat(subs)), classes.map(c => tr([{ t: c, c: 'k ltr' }].concat(subs.map(sb => ({ t: R.filter(r => nm(r[1]) === sb && split(r[2]).includes(c)).map(r => r[0]).join(' / '), c: 'sm' }))))), 'cmp')] };
      }
      const L = []; R.forEach(r => { const u = nm(r[1]); (String(r[2] || '').match(/\([^)]*\)|[1-6](?:\s*\+\s*[1-6])*/g) || [r[2] || '']).forEach(c => L.push([u, c.replace(/[()]/g, '').trim(), r[0], r[3], r[4], r[5]])); });
      L.sort((a, b) => a[0].localeCompare(b[0], 'ar') || a[1].localeCompare(b[1], 'ar', { numeric: true }));
      return { title: 'توزيع الأساتذة على الأقسام', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l', sign: SB.sign(s, { left: 'توقيع وخاتم مدير(ة) المؤسسة' }),
        blocks: [tbl(thr(['الوحدة المدرسية', 'القسم / المستويات', 'الأستاذ(ة)', 'المادة خلال TaRL', 'المادة خلال إرساء الموارد', 'التلاميذ']), L.map(x => tr([{ t: x[0], c: 'k' }, { t: x[1], c: 'b' }, { t: x[2], c: 'r' }, x[3], x[4], x[5]])), 'big')] };
    }
  });

  /* ---------- «التنظيم التربوي» (also in السبورة المرجعية) ---------- */
  const halfCells = (W, nd) => D7.slice(0, nd).map((d, i) => ['ص', 'م'].map(h => (W.has(i + h) ? { t: '×', c: 'sm wk' } : { t: '', c: 'sm rs' }))).reduce((a, b) => a.concat(b), []);
  const orgDefs = () => [{ sec: 'هيئة التأطير التربوي (المفتشون)' }, { k: 'insp', l: 'المفتشون', t: 'grid', cols: ['الاسم الكامل', 'اللغة / المادة', 'المقاطعة'], widths: ['1.2fr', '1fr', '1fr'] },
    { sec: 'أنصاف أيام العمل الأسبوعية' },
    { t: 'html', html: '<button type="button" class="btn sm pri" data-act="halfs">تحديد أنصاف أيام العمل (صباحا / مساء) لكل أيام الأسبوع</button>' },
    { k: 'days', l: 'الأيام المعروضة في الجدول', t: 'select', opts: [['auto', 'الاثنين–السبت (ويظهر الأحد إذا اشتغل به أحد)'], ['6', 'الاثنين–السبت'], ['7', 'الأسبوع كاملا (مع الأحد)']] },
    { note: 'الافتراضي: العمل صباحا ومساء من الاثنين إلى الجمعة وصباح السبت، والأحد راحة أسبوعية. يُحدَّد لكل أستاذ(ة) ما يخالف ذلك من الزر أعلاه، ويظهر المفتاح (×) أسفل الجدول.' },
    { k: 'phone', l: 'هاتف المؤسسة', half: true }, { k: 'note', l: 'ملاحظة أسفل الوثيقة', half: true }];
  // matrix dialog: one row per teacher, two boxes (morning / afternoon) for each day of the week
  function halfDialog(sy, f, c) {
    const R = rows(sy), ri = restIdx(sy);
    if (!R.length) { c.toast('جدول الإسناد فارغ: افتح «إسناد الأقسام والمواد» واضغط «ملء الجدول من لائحة الأساتذة» أولا', true); return; }
    const A = Y(sy).assign; A.half = A.half && typeof A.half === 'object' ? A.half : {};
    const W = R.map(r => workOf(sy, nm(r[0]), r[ri]));
    const body = document.createElement('div');
    const std = () => workFromRest('');
    const draw = () => {
      body.innerHTML = `<p class="muted" style="font-size:12.5px;line-height:1.8;margin:0 0 8px">ضع علامة على كل نصف يوم يشتغل فيه الأستاذ(ة). اضغط على اسم اليوم أو على «ص» / «م» لتحديد العمود كله، وعلى اسم الأستاذ(ة) لتحديد صفه كله.</p>
        <div class="btn-row" style="margin-bottom:8px"><button type="button" class="btn sm" data-q="std">الافتراضي للجميع (الاثنين–الجمعة + صباح السبت)</button><button type="button" class="btn sm" data-q="six">الاثنين–السبت كاملة للجميع</button><button type="button" class="btn sm" data-q="clr">مسح الكل</button></div>
        <div style="overflow:auto;max-height:56vh"><table class="tbl hd-tbl"><thead><tr><th rowspan="2">الأستاذ(ة)</th>${D7.map((d, i) => `<th colspan="2" class="hd-d" data-day="${i}" style="cursor:pointer;text-align:center">${d}</th>`).join('')}<th rowspan="2">المجموع</th><th rowspan="2"></th></tr>
          <tr>${D7.map((d, i) => `<th class="hd-h" data-hh="${i}ص" style="cursor:pointer;text-align:center">ص</th><th class="hd-h" data-hh="${i}م" style="cursor:pointer;text-align:center">م</th>`).join('')}</tr></thead>
        <tbody>${R.map((r, n) => `<tr><td data-row="${n}" style="cursor:pointer;white-space:nowrap"><b>${esc(nm(r[0]))}</b></td>${D7.map((d, i) => ['ص', 'م'].map(h => `<td style="text-align:center"><input type="checkbox" data-n="${n}" data-k="${i}${h}" ${W[n].has(i + h) ? 'checked' : ''}></td>`).join('')).join('')}<td style="text-align:center"><b>${W[n].size}</b></td><td><button type="button" class="btn sm" data-copy="${n}" title="تطبيق نفس الأيام على جميع الأساتذة">نسخ للجميع</button></td></tr>`).join('')}</tbody></table></div>`;
    };
    draw();
    const all = k => W.every(w => w.has(k));
    body.addEventListener('change', ev => { const t = ev.target; if (t.dataset.n == null) return; const w = W[+t.dataset.n]; if (t.checked) w.add(t.dataset.k); else w.delete(t.dataset.k); draw(); });
    body.addEventListener('click', ev => {
      const t = ev.target.closest('[data-q],[data-day],[data-hh],[data-row],[data-copy]'); if (!t) return;
      const d = t.dataset;
      if (d.q) W.forEach((w, n) => { w.clear(); if (d.q === 'std') std().forEach(k => w.add(k)); else if (d.q === 'six') for (let i = 0; i < 6; i++) { w.add(i + 'ص'); w.add(i + 'م'); } });
      else if (d.day != null) { const ks = [d.day + 'ص', d.day + 'م'], on = !ks.every(all); W.forEach(w => ks.forEach(k => (on ? w.add(k) : w.delete(k)))); }
      else if (d.hh) { const on = !all(d.hh); W.forEach(w => (on ? w.add(d.hh) : w.delete(d.hh))); }
      else if (d.row != null) { const w = W[+d.row], ks = []; D7.forEach((x, i) => ks.push(i + 'ص', i + 'م')); const on = !ks.every(k => w.has(k)); ks.forEach(k => (on ? w.add(k) : w.delete(k))); }
      else if (d.copy != null) { const src = W[+d.copy]; W.forEach((w, n) => { if (n === +d.copy) return; w.clear(); src.forEach(k => w.add(k)); }); }
      draw();
    });
    modal({ title: 'أنصاف أيام العمل الأسبوعية', size: 'xl', body, actions: [{ label: 'حفظ', cls: 'pri', onClick: () => {
      R.forEach((r, n) => { const t = restText(W[n]); A.half[nm(r[0])] = { w: Array.from(W[n]).sort(), t }; r[ri] = t; });
      persist(); f.halfRev = (f.halfRev || 0) + 1; c.save('halfRev'); toast('تم حفظ أنصاف أيام العمل');
    } }, { label: 'إلغاء' }] });
  }
  const orgBuild = (s, f, sy) => {
    const R = rows(sy), col = modeOf(sy) === 'col', d = v => MK.showDate(v || ''), ri = restIdx(sy);
    const Ws = R.map(r => workOf(sy, nm(r[0]), r[ri]));
    const sun = Ws.some(w => w.has('6ص') || w.has('6م'));
    const nd = f.days === '7' ? 7 : f.days === '6' ? 6 : (sun ? 7 : 6), base = col ? 13 : 15;
    const adm = (window.Board ? Board.admins() : []).map((e, i) => tr([i + 1, { t: fullName(e), c: 'b' }, e.ppr || '', d(e.hire), { t: [e.cadre, e.grade ? 'د ' + e.grade : ''].filter(Boolean).join(' '), c: 'sm' }, d(e.gradeDate), e.echelon || '', d(e.echelonDate), d(e.affDate)]));
    const insp = (f.insp || []).filter(r => nm(r[0]));
    const head2 = `<tr><th rowspan="3" class="d">ر.ت</th>${col ? '' : '<th rowspan="3" class="d">الوحدة المدرسية</th>'}<th rowspan="3" class="d">اسم الأستاذ(ة)</th><th rowspan="3" class="d">رقم التأجير</th>${col ? '<th rowspan="3" class="d">مادة التخصص</th>' : '<th colspan="2" class="d">المادة المدرسة خلال</th>'}<th rowspan="3" class="d">تاريخ التوظيف</th><th rowspan="3" class="d">تاريخ الالتحاق بالمؤسسة</th><th rowspan="3" class="d">الدرجة</th><th rowspan="3" class="d">الرتبة</th><th rowspan="3" class="d">تاريخها</th><th rowspan="3" class="d">نقطة التفتيش</th><th rowspan="3" class="d">تاريخها</th><th rowspan="3" class="d">${col ? 'الأقسام' : 'المستوى'}</th><th rowspan="3" class="d">التلاميذ</th><th colspan="${nd * 2}" class="d">أنصاف أيام العمل الأسبوعية</th><th rowspan="3" class="d">المجموع</th></tr>
      <tr>${col ? '' : '<th rowspan="2" class="d">فترة الدعم TaRL</th><th rowspan="2" class="d">إرساء الموارد</th>'}${D7.slice(0, nd).map(x => `<th colspan="2" class="d">${x}</th>`).join('')}</tr><tr>${D7.slice(0, nd).map(() => '<th class="d">ص</th><th class="d">م</th>').join('')}</tr>`;
    const main = R.map((r, i) => { const e = emp(r[0]) || {}, W = Ws[i], cnt = Array.from(W).filter(k => +k[0] < nd).length;
      return tr([i + 1].concat(col ? [] : [{ t: r[1], c: 'k sm' }]).concat([{ t: r[0], c: 'r b' }, e.ppr || ''], col ? [{ t: r[1], c: 'sm' }] : [{ t: r[3], c: 'sm' }, { t: r[4], c: 'sm' }],
        [{ t: d(e.hire), c: 'xs' }, { t: d(e.affDate), c: 'xs' }, e.grade || '', e.echelon || '', { t: d(e.echelonDate), c: 'xs' }, e.inspScore || '', { t: d(e.inspDate), c: 'xs' }, { t: r[2], c: 'xs' }, col ? r[4] : r[5]], halfCells(W, nd), [{ t: cnt, c: 'b' }])); });
    // number of teachers working in every half-day
    const per = []; for (let i = 0; i < nd; i++) ['ص', 'م'].forEach(h => per.push(Ws.filter(w => w.has(i + h)).length));
    if (R.length) main.push(tr([{ t: 'عدد الأساتذة العاملين في كل نصف يوم', c: 's', s: base }].concat(per.map(n => ({ t: n, c: 's' })), [{ t: per.reduce((a, b) => a + b, 0), c: 's' }])));
    const out = window.Board ? Board.assigned() : [], pre = window.Board ? Board.preschool() : [];
    const key = { before: SB.cap('مفتاح أنصاف أيام العمل', 'r'), table: { cls: 'sb-t cmp te-key', colgroup: '<colgroup>' + ['5', '20', '5', '20', '5', '20', '5', '20'].map(w => `<col style="width:${w}%">`).join('') + '</colgroup>', head: thr([{ t: 'كيف تُقرأ خانات أنصاف أيام العمل الأسبوعية؟', c: 'd', s: 8 }]),
      rows: [tr([{ t: '×', c: 'wk b' }, { t: 'نصف يوم عمل: يشتغل الأستاذ(ة) في هذه الفترة', c: 'sm' }, { t: '', c: 'rs' }, { t: 'نصف يوم راحة: لا يشتغل الأستاذ(ة) في هذه الفترة', c: 'sm' }, { t: 'ص', c: 'd' }, { t: 'الفترة الصباحية (قبل الزوال)', c: 'sm' }, { t: 'م', c: 'd' }, { t: 'الفترة المسائية (بعد الزوال)', c: 'sm' }]),
        tr([{ t: 'المجموع: عدد أنصاف أيام العمل الأسبوعية للأستاذ(ة). الصف الأخير: عدد الأساتذة الذين يشتغلون في كل نصف يوم. الأيام والفترات غير المحددة تُعتمد فيها القاعدة العامة: الاثنين–الجمعة صباحا ومساء، السبت صباحا، والأحد راحة أسبوعية.', c: 'sm r', s: 8 }])] } };
    return { title: `التنظيم التربوي للسنة الدراسية ${MK.syDash(sy).replace('-', '/')}`, sub: col ? cycTxt() : 'فترة الدعم (TaRL) وفترة إرساء الموارد (التعليم الصريح)', page: 'a4l', sign: SB.sign(s, { three: ['مدير(ة) المؤسسة', 'السيد(ة) المفتش(ة)', 'السيد المدير الإقليمي'] }),
      blocks: [
        { before: SB.cap('هيئة الإدارة', 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'تاريخ التوظيف', 'الإطار والدرجة', 'تاريخها', 'الرتبة', 'تاريخها', 'تاريخ الالتحاق بالمؤسسة'].map(t => ({ t, c: 'd' }))), rows: adm.length ? adm : [tr(new Array(9).fill(''))] } },
        insp.length ? { before: SB.cap('هيئة التأطير التربوي', 'r'), table: { cls: 'sb-t cmp', head: thr(['الاسم الكامل', 'اللغة / المادة', 'المقاطعة'].map(t => ({ t, c: 'd' }))), rows: insp.map(r => tr([{ t: r[0], c: 'b' }, r[1], r[2]])) } } : '',
        { before: SB.cap('هيئة التدريس', 'r'), table: { cls: 'sb-t cmp te-org', head: head2, rows: main.length ? main : [tr(new Array(base + nd * 2 + 1).fill(''))] } },
        key,
        { before: SB.cap('الأساتذة المكلفون خارج المؤسسة', 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'رقم التأجير', 'الدرجة', 'الرتبة', 'مؤسسة التكليف', 'تاريخ التكليف', 'أسباب التكليف'].map(t => ({ t, c: 'd' }))), rows: out.length ? out.map((e, i) => tr([i + 1, { t: fullName(e), c: 'b' }, e.ppr || '', e.grade || '', e.echelon || '', e.assigned || '', d(e.assignDate), { t: e.assignReason || '', c: 'sm' }])) : [tr([{ t: 'لا أحد', s: 8 }])] } },
        col ? '' : { before: SB.cap('مربيات ومربو التعليم الأولي', 'r'), table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'الاسم الكامل', 'ب.ت.و', 'تاريخ الالتحاق بالمؤسسة', 'آخر شهادة دراسية', 'الوحدة المدرسية'].map(t => ({ t, c: 'd' }))), rows: pre.length ? pre.map((e, i) => tr([i + 1, { t: fullName(e), c: 'b' }, e.cin || '', d(e.affDate), e.diploma || '', e.unit || ''])) : [tr([{ t: 'لا أحد', s: 6 }])] } },
        f.note ? { html: `<div class="sb-note">${esc(f.note)}</div>` } : ''] };
  };
  add({ k: 'org', get t() { return isCol() ? 'التنظيم التربوي للسنة الدراسية' : 'التنظيم التربوي للسنة الدراسية (TaRL والتعليم الصريح)'; }, grp: 'o', get d() { return isCol() ? 'نموذج المديرية: هيئة الإدارة، هيئة التأطير، هيئة التدريس مع مادة التخصص والأقسام، الأساتذة المكلفون.' : 'نموذج المديرية: هيئة الإدارة، هيئة التأطير، هيئة التدريس مع المادة المدرسة خلال فترة الدعم TaRL وفترة إرساء الموارد، المكلفون، مربو الأولي، أنصاف أيام العمل.'; }, auto: 'إسناد الأقسام ولائحة الموظفين', page: 'a4l',
    init: () => ({ insp: [['', 'اللغة العربية', ''], ['', 'اللغة الفرنسية', '']], phone: '', note: '', days: 'auto' }), defs: orgDefs, build: orgBuild, act: { halfs: (f, sy, c) => halfDialog(sy, f, c) } });

  /* ---------- «قراءة في المقرر الوزاري» ---------- */
  const DEC = { // 2026/2027: decree n° 017.26 of 3 July 2026
    '2026/2027': {
      ref: 'مقرر السيد وزير التربية الوطنية والتعليم الأولي والرياضة رقم 017.26 الصادر بتاريخ 03 يوليوز 2026 بشأن تنظيم السنة الدراسية 2026/2027، تحت شعار "من أجل مدرسة ذات جودة للجميع"',
      news: 'مواصلة تعميم التعليم الأولي وتحسين جودته.\nتوسيع تعميم مؤسسات الريادة بالسلك الابتدائي.\nمواصلة تعميم مؤسسات الريادة بالسلك الثانوي الإعدادي.\nمواصلة توسيع المؤسسات التعليمية الابتدائية التي تدرَّس فيها اللغة الأمازيغية.\nمواصلة توسيع تدريس اللغة الإنجليزية بالمستويات الثلاثة بسلك الثانوي الإعدادي.\nترسيخ إرساء مشروع المؤسسة المندمج، وفق الإطار المنهجي الجديد لإعداده وأجرأته.\nتوسيع إرساء آلية المواكبة في أفق تعميمها التدريجي على مستوى مؤسسات التربية والتعليم العمومي والأحواض المدرسية.\nتكثيف الأنشطة الموازية والرياضية، وتنزيل مخطط تعميم الأنشطة الاعتيادية.\nمواصلة عملية رقمنة تنظيم امتحانات البكالوريا.\nمواصلة الجهود الحثيثة للتقليص من الهدر المدرسي، ولا سيما من خلال تفعيل آليات المواكبة واليقظة والمقاربات الاستباقية.\nمواصلة توسيع عرض مدارس الفرصة الثانية وربطها بمؤسسات التعليم الإعدادي، وتوفير التأطير والمراقبة التربوية لهذه المدارس.\nمواصلة توسيع وتقوية شبكة المؤسسات التعليمية الدامجة، وتجويد التعلمات لدى المتعلمين والمتعلمات في وضعية إعاقة، وتعميم وإحداث وتفعيل اللجان الجهوية والإقليمية والمحلية للتربية الدامجة.\nأجرأة الالتزامات المضمّنة بعقود نجاعة الأداء المركزية والجهوية والإقليمية.',
      acts: [['الثلاثاء 1 شتنبر 2026', 'بداية السنة الدراسية 2026/2027 (المادة 2).\nالتحاق أطر وموظفي هيئة الإدارة التربوية والتدبير، وهيئة التفتيش والتأطير والمراقبة والتقييم، وهيئة متصرفي التربية الوطنية بمقرات عملهم، وتوقيع محاضر الدخول.'],
        ['الأربعاء 2 شتنبر 2026', 'التحاق أطر وموظفي هيئة التربية والتعليم وهيئة الأساتذة الباحثين في التربية والتكوين بمقرات عملهم.\nالاطلاع على مستجدات السنة الدراسية.\nتقاسم مضامين مشروع المؤسسة المندمج، وخاصة الشق التربوي المتعلق بالتعلمات الأساس.\nالتزويد بملف تربوي يتضمن مقرر تنظيم السنة الدراسية ولوائح المتعلمين وجداول الحصص ودفاتر النصوص.\nالتداول في الصيغ المناسبة لاستقبال المتعلمين والتواصل مع الأسر.'],
        ['الخميس 3 شتنبر 2026', 'التحاق أطفال التعليم الأولي بمستوييه، ومتعلمي السنة الأولى والثانية من السلك الابتدائي.\n(التحاق السنة الأولى إعدادي، والجذع المشترك بالسلك التأهيلي).'],
        ['الجمعة 4 شتنبر 2026', 'التحاق متعلمي السنة الثالثة والرابعة من السلك الابتدائي.\n(التحاق السنة الثانية إعدادي، والسنة الأولى بكالوريا).'],
        ['السبت 5 شتنبر 2026', 'التحاق متعلمي السنة الخامسة والسادسة من السلك الابتدائي.\n(التحاق السنة الثالثة إعدادي، والسنة الثانية بكالوريا).\nخلال هذه الفترة: إطلاع المتعلمين على النظام الداخلي للمؤسسة، والتعريف بخدمات المؤسسة وأنديتها، والتحسيس بأدوار خلايا الإنصات والوساطة واليقظة.'],
        ['الإثنين 7 شتنبر 2026', 'انطلاق الدراسة بشكل فعلي وإلزامي بالنسبة للتعليم الأولي وأسلاك التعليم الابتدائي والثانوي الإعدادي والثانوي التأهيلي (المادة 6).'],
        ['الإثنين 5 أكتوبر 2026', 'انطلاق الدراسة بالنسبة لأقسام التربية غير النظامية وأقسام الفرصة الثانية (المادة 6).'],
        ['السبت 5 دجنبر 2026', 'إجراء امتحانات الكفاءة المهنية برسم دورة 2026 (المادة 11).'],
        ['ابتداء من مارس 2027', 'انطلاق عمليات التحسيس بإلزامية التمدرس وتسجيل الجدد بالسنة الأولى من التعليم الابتدائي (المادة 12).'],
        ['من فاتح إلى 30 أبريل 2027', 'التسجيل الرقمي للتلميذات والتلاميذ الجدد بالمؤسسات التعليمية الابتدائية عبر الخدمة الإلكترونية "مسار" (المادة 12).'],
        ['من 1 إلى 10 يوليوز 2027', 'إعادة تسجيل التلاميذ بأسلاك التعليم الابتدائي والثانوي الإعدادي والثانوي التأهيلي (المادة 12).'],
        ['السبت 10 يوليوز 2027', 'توقيع محاضر الخروج لأطر وموظفي هيئة التربية والتعليم وهيئة الأساتذة الباحثين (مع استثناء المكلفين بمهام تتطلب تجاوز هذا التاريخ).']],
      cc: [['من 4 إلى 9 يناير 2027', 'إجراء آخر فروض المراقبة المستمرة للأسدوس الأول.'], ['16 يناير 2027', 'انتهاء مسك آخر فروض المراقبة المستمرة للأسدوس الأول.'], ['18 و19 يناير 2027', 'إجراء الامتحان الموحد المحلي لنيل شهادة الدروس الابتدائية.'],
        ['20 يناير 2027', 'انتهاء مسك نقط الامتحان الموحد المحلي.'], ['ابتداء من 21 يناير 2027', 'استصدار بيانات النقط عبر منظومة مسار.'], ['21 و22 يناير 2027', 'عقد مجالس الأقسام.'], ['23 يناير 2027', 'توزيع بيانات النقط على المتعلمين.'],
        ['ما بين 14 و19 يونيو 2027', 'إجراء آخر فروض المراقبة المستمرة للأسدوس الثاني.'], ['22 يونيو 2027', 'انتهاء مسك آخر فروض المراقبة المستمرة للأسدوس الثاني.'], ['من 21 إلى 24 يونيو 2027', 'الإعداد الجماعي للامتحان الموحد الإقليمي لنيل شهادة الدروس الابتدائية.'],
        ['25 و26 يونيو 2027', 'إجراء الامتحان الموحد الإقليمي لنيل شهادة الدروس الابتدائية.'], ['30 يونيو 2027', 'انتهاء مسك نقط الامتحان الموحد الإقليمي.'], ['ابتداء من فاتح يوليوز 2027', 'استصدار بيانات النقط عبر منظومة مسار.'], ['1 و2 يوليوز 2027', 'عقد مجالس الأقسام لنهاية الموسم الدراسي.'], ['3 يوليوز 2027', 'توزيع بيانات النقط على المتعلمين.']],
      hol: [['من الأحد 18 إلى الأحد 25 أكتوبر 2026', 'العطلة البينية الأولى (8 أيام).'], ['السبت 31 أكتوبر 2026', 'عطلة عيد الوحدة (يوم واحد).'], ['الجمعة 6 نونبر 2026', 'عطلة ذكرى المسيرة الخضراء (يوم واحد).'], ['الأربعاء 18 نونبر 2026', 'عطلة عيد الاستقلال (يوم واحد).'],
        ['من الأحد 6 إلى الأحد 13 دجنبر 2026', 'العطلة البينية الثانية (8 أيام).'], ['الجمعة فاتح يناير 2027', 'عطلة فاتح السنة الميلادية (يوم واحد).'], ['الإثنين 11 يناير 2027', 'عطلة ذكرى تقديم وثيقة الاستقلال (يوم واحد).'], ['الخميس 14 يناير 2027', 'عطلة فاتح السنة الأمازيغية (يوم واحد).'],
        ['من الأحد 24 إلى الأحد 31 يناير 2027', 'عطلة منتصف السنة الدراسية (8 أيام).'], ['من 29 رمضان إلى 2 شوال 1448هـ', 'عطلة عيد الفطر (3 أو 4 أيام).'], ['من الأحد 21 إلى الأحد 28 مارس 2027', 'العطلة البينية الثالثة (8 أيام).'], ['السبت فاتح ماي 2027', 'عطلة عيد الشغل (يوم واحد).'],
        ['من الأحد 9 إلى الأحد 16 ماي 2027', 'العطلة البينية الرابعة (8 أيام).'], ['من 9 إلى 11 ذي الحجة 1448هـ', 'عطلة عيد الأضحى (3 أيام).'], ['فاتح محرم 1449هـ', 'عطلة فاتح السنة الهجرية (يوم واحد).']]
    }
  };
  const decInit = (s, sy) => {
    const d = DEC[sy];
    // 1.9.4: collège / lycée: the lines about the pre-school and the primary school are left out
    const noPri = t => (isCol() ? String(t || '').replace('بالنسبة للتعليم الأولي وأسلاك التعليم الابتدائي والثانوي الإعدادي و', 'بالنسبة لسلكي التعليم الثانوي الإعدادي و').replace(/بأسلاك التعليم الابتدائي والثانوي الإعدادي والثانوي التأهيلي/g, 'بسلكي التعليم الثانوي الإعدادي والتأهيلي').replace(/أسلاك التعليم الابتدائي والثانوي الإعدادي والثانوي التأهيلي/g, 'سلكي التعليم الثانوي الإعدادي والتأهيلي').split('\n').filter(l => !/التعليم الأولي|السلك الابتدائي|مؤسسات الريادة بالسلك الابتدائي|الابتدائ/.test(l) || /وزير/.test(l)).join('\n').replace(/^\((.*)\)$/gm, '$1') : t);
    if (d) return { date: `${MK.syStart(sy)}-09-01`, ref: d.ref, news: noPri(d.news), acts: d.acts.map(r => r.map((x, i) => (i ? noPri(x) : x))).filter(r => r.slice(1).some(x => String(x || '').trim())), cc: d.cc.map(r => r.map((x, i) => (i ? noPri(x) : x))).filter(r => r.slice(1).some(x => String(x || '').trim())), hol: d.hol.map(r => r.slice()) };
    const H = window.Holidays ? Holidays.forSy(sy) : [];
    return { date: `${MK.syStart(sy)}-09-01`, ref: `مقرر السيد وزير التربية الوطنية والتعليم الأولي والرياضة رقم .......... الصادر بتاريخ .......... بشأن تنظيم السنة الدراسية ${sy}`, news: '', acts: [['', '']], cc: [['', '']],
      hol: H.length ? H.map(h => [h.when || '', `${h.name || ''}${h.days ? ' (' + h.days + ')' : ''}.`]) : [['', '']] };
  };
  const lines = t => String(t || '').split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const decBuild = (s, f, sy) => {
    const T2 = (rows, h) => ({ table: { cls: 'sb-t dec-t', head: thr([{ t: 'التاريخ', c: 'd' }, { t: h, c: 'd' }]), colgroup: '<colgroup><col style="width:27%"><col style="width:73%"></colgroup>', rows: (rows || []).filter(r => nm(r[0]) || nm(r[1])).map(r => tr([{ t: r[0], c: 'b' }, { h: lines(r[1]).map(l => `<div class="rp-li">${esc(l)}</div>`).join(''), c: 'r' }])) } });
    return { title: `قراءة في المقرر الوزاري المنظم للسنة الدراسية ${sy}`, sub: '', page: 'a4', sign: SB.sign(s, { left: 'الإدارة', noDate: true }),
      blocks: [{ html: `<div style="text-align:left;font-weight:700">${esc(s.city || '')} في: ${esc(f.date ? MK.showDate(f.date) : '..........')}</div>` }, { html: `<p class="sb-p">استنادا إلى ${esc(f.ref || '')}:</p>` },
        { html: '<div class="rp-h">I. مستجدات وبرامج ومشاريع السنة</div>', keepNext: true }, ...lines(f.news).map(l => ({ html: `<div class="rp-li sb-p">${esc(l)}</div>` })),
        { html: '<div class="rp-h">II. الأنشطة والعمليات</div>', keepNext: true }, T2(f.acts, 'الأنشطة والعمليات'),
        { html: '<div class="rp-h">III. المراقبة المستمرة والامتحانات الإشهادية والمجالس</div>', keepNext: true }, T2(f.cc, 'العمليات'),
        { html: '<div class="rp-h">IV. العطل المدرسية</div>', keepNext: true }, T2(f.hol, 'العطلة')] };
  };
  const decDefs = () => [{ k: 'date', l: 'التاريخ', t: 'date', half: true }, { k: 'ref', l: 'مرجع المقرر الوزاري', t: 'area', rows: 2 }, { k: 'news', l: 'I. المستجدات والبرامج (سطر لكل عنصر)', t: 'area', rows: 6 },
    { k: 'acts', l: 'II. الأنشطة والعمليات (افصل العمليات بسطر جديد داخل الخانة)', t: 'grid', cols: ['التاريخ', 'الأنشطة والعمليات'], widths: ['1fr', '3fr'] },
    { k: 'cc', l: 'III. المراقبة المستمرة والامتحانات والمجالس', t: 'grid', cols: ['التاريخ', 'العمليات'], widths: ['1fr', '3fr'] },
    { k: 'hol', l: 'IV. العطل المدرسية', t: 'grid', cols: ['التاريخ', 'العطلة'], widths: ['1.2fr', '2fr'] }];
  Dx.modCss += '.dec-t td{height:auto;padding:.8mm 1.2mm;vertical-align:middle}.dec-t td.r .rp-li{margin:0}.te-org th,.te-org td{font-size:7.2pt;padding:.3mm .35mm}.sb-t td.wk{background:#e2efda;color:#1e5e1e;font-weight:700;text-align:center}.sb-t td.rs{background:#ededed}.te-key td{height:auto;padding:.8mm 1.2mm}';

  // the two documents of السبورة المرجعية
  if (window.Board && Board.DOCS) {
    const B = Board.DOCS();
    const at = B.findIndex(d => d.k === 'massar');
    const pos = at < 0 ? B.length : at;
    B.splice(pos, 0, { k: 'decree', t: 'قراءة في المقرر الوزاري المنظم للسنة الدراسية', grp: 'a', d: 'المستجدات والبرامج، الأنشطة والعمليات، المراقبة المستمرة والامتحانات والمجالس، والعطل المدرسية (2026/2027 جاهزة، وقابلة للتعديل).', auto: 'المقرر الوزاري 017.26 ولائحة العطل', page: 'a4', init: decInit, defs: decDefs, build: decBuild });
    B.splice(pos + 2, 0, { k: 'pedaOrg', get t() { return isCol() ? 'التنظيم التربوي للسنة الدراسية' : 'التنظيم التربوي: فترة الدعم TaRL وفترة التعليم الصريح'; }, grp: 'a', get d() { return isCol() ? 'هيئة الإدارة والتأطير والتدريس مع مادة التخصص والأقسام والأساتذة المكلفون.' : 'هيئة الإدارة والتأطير والتدريس مع المادة المدرسة خلال فترة الدعم (TaRL) وإرساء الموارد، المكلفون، مربو الأولي وأنصاف أيام العمل.'; }, auto: 'خانة «توزيع الأساتذة» ولائحة الموظفين', page: 'a4l',
      init: () => ({ insp: [['', 'اللغة العربية', ''], ['', 'اللغة الفرنسية', '']], phone: '', note: '', days: 'auto' }), defs: orgDefs, build: orgBuild, act: { halfs: (f, sy, c) => halfDialog(sy, f, c) } });
  }

  let c0 = null;
  const center = () => c0 || (c0 = K.center({
    id: 'teach', title: 'توزيع الأساتذة على الوحدات والأقسام', icon: '🧑‍🏫', route: 'teachDoc', hubRoute: 'teach', docLabel: 'الخطوة / الوثيقة',
    groups: () => [['d', 'الإسناد', isCol() ? 'مواد التخصص والأقسام والساعات' : 'الوحدات والأقسام وTaRL / التعليم الصريح'], ['o', 'الوثائق']],
    docs: () => DOCS.filter(d => (!d.unitsOnly || (grp() && !isCol())) && (!d.unitsPri || isCol() || grp())), store: sy => Y(sy), years: () => Object.keys((DB.teach || {}).years || {}),
    intro: () => isCol() ? 'املأ جدول الإسناد مرة واحدة (زر «ملء الجدول من لائحة الأساتذة» يقترح مادة التخصص والأقسام من بطاقات الموظفين)، فتُستخرج وثائق التوزيع والتنظيم التربوي، وتُستعمل أيضا في «السبورة المرجعية». يُسند لكل أستاذ(ة) مادة تخصصه والأقسام وعدد الساعات.' : 'املأ جدول الإسناد مرة واحدة (زر «ملء الجدول من لائحة الأساتذة» يقترح الوحدة والمستويات والمادة من بطاقات الموظفين)، فتُستخرج وثائق التوزيع والتنظيم التربوي، وتُستعمل أيضا في «السبورة المرجعية».'
  }));
  window.Teach = { migrate, DOCS: () => DOCS, rows, modeOf, distribution, unitOfEmp };
  window.pageTeach = (v, a) => { migrate(DB); center().hub(v, a); };
  window.pageTeachDoc = (v, a) => { migrate(DB); center().doc(v, a); };
})();
