'use strict';
/* 1.9.4 — الشواهد المدرسية (المتمدرسين): شهادة مدرسية على نموذج منظومة مسار للتلاميذ المستوردين من لوائح مسار (بطاقة التلاميذ):
   نسختان في ورقة A4، رقم «الموسم/الرتبة» (2026/2027/1)، الاسم والنسب، مكان وتاريخ الازدياد، رمز مسار، المستوى والقسم، ملاحظات،
   «حرر ب ... في ...»، خاتم وتوقيع الحارس العام / الناظر وخاتم وتوقيع رئيس المؤسسة. شهادة لتلميذ واحد أو لكل تلاميذ قسم دفعة واحدة،
   والأرقام تُسجل في «سجل الشواهد المسلمة» عند الطبع أو الحفظ PDF فقط (المعاينة لا تستهلك رقما). */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const nm = t => String(t == null ? '' : t).trim();
  const LV = () => window.K.LV;
  const slashSy = sy => MK.syDash(sy).replace('-', '/');

  function migrate(db) {
    const o = db.certsCur = db.certsCur && typeof db.certsCur === 'object' ? db.certsCur : {};
    o.reg = Array.isArray(o.reg) ? o.reg : [];
    o.years = o.years && typeof o.years === 'object' ? o.years : {};
  }
  const CC = () => { migrate(DB); return DB.certsCur; };
  const store = sy => { const y = CC().years; return y[sy] || (y[sy] = {}); };

  /* ---------- pupils of the year (Massar lists, in the order of the lists) ---------- */
  const pupilsOf = sy => { try { return window.Pupils ? Pupils.current(sy) : []; } catch (_) { return []; } };
  const unitsOf = sy => Array.from(new Set(pupilsOf(sy).map(p => p.unit).filter(Boolean)));
  const lvName = k => { try { return LV().name(k) || k || ''; } catch (_) { return k || ''; } };
  const lvlsOf = (sy, unit) => { const a = Array.from(new Set(pupilsOf(sy).filter(p => !unit || p.unit === unit).map(p => p.lvl).filter(Boolean))); try { return LV().sort(a); } catch (_) { return a; } };
  const clsOf = (sy, unit, lvl) => Array.from(new Set(pupilsOf(sy).filter(p => (!unit || p.unit === unit) && (!lvl || p.lvl === lvl)).map(p => p.cls).filter(Boolean)));
  const fullAr = p => [p.last, p.first].map(nm).filter(Boolean).join(' ');
  const fullFr = p => [p.lastFr, p.firstFr].map(nm).filter(Boolean).join(' ').toUpperCase();
  const fem = p => p.g === 'F';
  const dmy = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}-${m[2]}-${m[1]}` : nm(iso); };
  const dmyS = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${m[3]}/${m[2]}/${m[1]}` : nm(iso); };
  const pick = (f, sy) => {
    const all = pupilsOf(sy).filter(p => (!f.unit || p.unit === f.unit) && (!f.lvl || p.lvl === f.lvl) && (!f.cls || p.cls === f.cls));
    if (f.scope === 'cls') return all;
    const one = pupilsOf(sy).find(p => p.code === f.code);
    return one ? [one] : [];
  };

  /* ---------- numbers: «2026/2027/1» — kept per school year, given for good when the certificate is printed or saved ---------- */
  const regOf = sy => CC().reg.filter(r => r.sy === sy);
  const maxNo = sy => regOf(sy).reduce((m, r) => Math.max(m, +r.no || 0), 0);
  function numbers(f, sy, list) {
    let next = Math.max(maxNo(sy) + 1, +f.start || 0);
    return list.map(p => {
      const ex = regOf(sy).find(r => r.code === p.code && r.date === f.date);
      return ex ? { p, no: +ex.no, old: true } : { p, no: next++, old: false };
    });
  }

  /* ---------- the certificate (Massar model) ---------- */
  const STATUS = [
    ['cur', 'يتابع(تتابع) دراسته(ها) حاليا بهذه المؤسسة'],
    ['was', 'كان(ت) يتابع(تتابع) دراسته(ها) بهذه المؤسسة'],
    ['massar', 'كان(ت) يتابع(تتابع) دراسته(ها) بهذه المؤسسة ولم يلتحق(تلتحق) بالدراسة (عبارة مسار)']
  ];
  const statusText = (k, p) => {
    const F = fem(p);
    if (k === 'was') return F ? 'كانت تتابع دراستها بهذه المؤسسة' : 'كان يتابع دراسته بهذه المؤسسة';
    if (k === 'massar') return F ? 'كانت تتابع دراستها بهذه المؤسسة' : 'كان يتابع دراسته بهذه المؤسسة';
    return F ? 'تتابع دراستها حاليا بهذه المؤسسة' : 'يتابع دراسته حاليا بهذه المؤسسة';
  };
  const levelLine = (k, p) => (k === 'massar' ? (fem(p) ? 'ولم تلتحق بالدراسة بالمستوى' : 'ولم يلتحق بالدراسة بالمستوى') : 'بالمستوى');
  const noteOf = (f, p) => {
    const t = nm(f.note); if (t) return t.replace(/له\(ا\)/g, fem(p) ? 'لها' : 'له').replace(/منه\(ا\)/g, fem(p) ? 'منها' : 'منه');
    return `سلمت ${fem(p) ? 'لها' : 'له'} هذه الشهادة بطلب ${fem(p) ? 'منها' : 'منه'} لغرض إداري`;
  };

  function copy(s, f, sy, n) {
    const p = n.p, sch = nm(s.school), unit = nm(p.unit), F = fem(p);
    const showUnit = unit && window.Pupils && !(Pupils.unitNames().length <= 1) && unit !== sch;
    const v = (x, w) => (nm(x) ? `<b>${esc(x)}</b>` : `<span class="cs-dots" style="min-width:${w || 30}mm"></span>`);
    const lv = lvName(p.lvl);
    return `<div class="cs-copy">
      <div class="cs-hdr">${Dx.header(s)}</div>
      <div class="cs-meta">
        <div><span class="k">المؤسسة :</span> ${v(showUnit ? `${unit} — ${sch}` : sch, 50)}</div>
        <div><span class="k">الجماعة :</span> ${v(s.commune, 30)}</div>
        ${nm(s.gresa) || nm(s.phone) ? `<div>${nm(s.gresa) ? `<span class="k">رمز المؤسسة :</span> <b dir="ltr">${esc(s.gresa)}</b>` : ''}${nm(s.gresa) && nm(s.phone) ? ' &nbsp; ' : ''}${nm(s.phone) ? `<span class="k">الهاتف :</span> <b dir="ltr">${esc(s.phone)}</b>` : ''}</div>` : ''}
      </div>
      <div class="cs-title"><span>شهادة مدرسية</span> <span class="cs-no">رقم : <b dir="ltr">${esc(slashSy(sy))}/${n.no}</b></span></div>
      <div class="cs-body">
        ${f.photo === 'no' ? '' : '<div class="cs-photo">الصورة</div>'}
        <p class="cs-l">${F ? 'تشهد' : 'يشهد'} ${nm(f.signer) === 'dir' ? 'مدير(ة) المؤسسة' : 'الموقع(ة) أسفله'}</p>
        <p class="cs-l">أن ${F ? 'التلميذة' : 'التلميذ'} : <span class="k">الاسم والنسب :</span> ${v(fullAr(p), 60)}</p>
        ${fullFr(p) || f.fr === 'yes' ? `<p class="cs-l" dir="ltr" style="text-align:left"><span class="k">Nom et Prénom :</span> ${v(fullFr(p), 60)}</p>` : ''}
        <p class="cs-l">${F ? 'المولودة' : 'المولود'} في : ${v(p.place, 30)} &nbsp; بتاريخ : ${nm(p.birth) ? `<b dir="ltr">${esc(dmy(p.birth))}</b>` : v('', 25)}</p>
        <p class="cs-l">رمز ${F ? 'التلميذة' : 'التلميذ'} (مسار) : ${nm(p.code) ? `<b dir="ltr">${esc(p.code)}</b>` : v('', 30)}</p>
        <p class="cs-l cs-st">${statusText(f.status, p)} ${levelLine(f.status, p)} : <b>${esc(lv || '')}</b>${nm(p.cls) && f.cls2 !== 'no' ? ` &nbsp; القسم : <b dir="ltr">${esc(p.cls)}</b>` : ''} &nbsp; خلال الموسم الدراسي : <b dir="ltr">${esc(slashSy(sy))}</b></p>
        <p class="cs-l"><span class="k">ملاحظات :</span> ${esc(noteOf(f, p))}</p>
      </div>
      <div class="cs-date"><span>حرر ب : ${v(f.city || s.city, 30)}</span><span>في : ${f.date ? `<b dir="ltr">${esc(dmyS(f.date))}</b>` : v('', 25)}</span></div>
      <div class="cs-sig"${(() => { try { const c = window.Stamp && Stamp.cfg(); return c && c.on ? ` style="min-height:${(c.h + 6).toFixed(1)}mm"` : ''; } catch (_) { return ''; } })()}>${f.guard === 'no' ? '<div></div>' : '<div>خاتم وتوقيع الحارس العام / الناظر المسؤول عن المعلومات الواردة في الشهادة</div>'}<div>خاتم وتوقيع رئيس المؤسسة</div></div>
    </div>`;
  }

  function certPages(s, f, sy, st) {
    const list = pick(f, sy);
    if (!list.length) return [`<div class="cs-page"><div class="cs-empty">${pupilsOf(sy).length ? 'اختر التلميذ(ة) أو القسم.' : 'لا يوجد تلاميذ: استورد لوائح التلاميذ من منظومة مسار في «بطاقة التلاميذ» أولا.'}</div></div>`];
    const nums = numbers(f, sy, list);
    if (st) st.assign = nums;
    const two = f.layout !== 'pair';
    const pages = [];
    if (two) nums.forEach(n => pages.push(`<div class="cs-page">${copy(s, f, sy, n)}<div class="cs-cut">✂</div>${copy(s, f, sy, n)}</div>`));
    else for (let i = 0; i < nums.length; i += 2) pages.push(`<div class="cs-page">${copy(s, f, sy, nums[i])}${nums[i + 1] ? `<div class="cs-cut">✂</div>${copy(s, f, sy, nums[i + 1])}` : ''}</div>`);
    return pages;
  }

  function register(f, sy, st) {
    const a = (st && st.assign) || [];
    let n = 0;
    a.forEach(x => { if (x.old) return; CC().reg.push({ id: uid('cs'), sy, no: x.no, code: x.p.code, name: fullAr(x.p), g: x.p.g, lvl: x.p.lvl, cls: x.p.cls || '', unit: x.p.unit || '', date: f.date || Dx.todayIso(), at: new Date().toISOString() }); n++; });
    if (n) { persist(); toast(`سُجلت ${n} شهادة في سجل الشواهد المسلمة`); }
  }

  const DOCS = [
    {
      k: 'cert', t: 'شهادة مدرسية (نموذج مسار)', grp: 'c', page: 'a4', word: false,
      d: 'نسختان في ورقة A4، بالرقم «الموسم/الرتبة»، لتلميذ(ة) واحد(ة) أو لكل تلاميذ قسم دفعة واحدة',
      auto: 'بطاقة التلاميذ (لوائح مسار: الاسم والنسب، تاريخ ومكان الازدياد، الرمز، المستوى، القسم)',
      init: (s, sy) => { const U = unitsOf(sy); return { unit: U.length === 1 ? U[0] : '', lvl: '', cls: '', scope: 'one', code: '', status: 'cur', city: s.city || '', date: Dx.todayIso(), note: '', start: '', layout: 'two', photo: 'yes', guard: 'yes', cls2: 'yes', fr: 'no', signer: 'me' }; },
      defs: (f, sy, st) => {
        if (st && st.o && st.o.code && !st.oDone) {
          st.oDone = true; const p = pupilsOf(sy).find(x => x.code === st.o.code);
          if (p) Object.assign(f, { scope: 'one', code: p.code, unit: p.unit || '', lvl: p.lvl || '', cls: p.cls || '' });
        }
        const U = unitsOf(sy), L = lvlsOf(sy, f.unit), C = clsOf(sy, f.unit, f.lvl);
        const P = pupilsOf(sy).filter(p => (!f.unit || p.unit === f.unit) && (!f.lvl || p.lvl === f.lvl) && (!f.cls || p.cls === f.cls));
        const n = pick(f, sy).length;
        return [
          { sec: 'التلميذ(ة)' },
          ...(U.length > 1 ? [{ k: 'unit', l: 'الوحدة المدرسية', t: 'select', half: true, opts: [['', 'كل الوحدات']].concat(U.map(u => [u, u])) }] : []),
          { k: 'lvl', l: 'المستوى', t: 'select', half: true, opts: [['', 'كل المستويات']].concat(L.map(l => [l, lvName(l)])) },
          { k: 'cls', l: 'القسم', t: 'select', half: true, opts: [['', 'كل الأقسام']].concat(C.map(c => [c, c])) },
          { k: 'scope', l: 'الشواهد', t: 'select', half: true, opts: [['one', 'تلميذ(ة) واحد(ة)'], ['cls', 'كل تلاميذ الاختيار (القسم أو المستوى)']] },
          ...(f.scope === 'cls' ? [{ t: 'html', html: `<div class="muted" style="font-size:12.5px">عدد الشواهد: <b>${n}</b></div>` }]
            : [{ k: 'code', l: 'التلميذ(ة)', t: 'select', opts: [['', '— اختر —']].concat(P.map(p => [p.code, `${fullAr(p)} — ${p.code}${p.cls ? ' — ' + p.cls : ''}`])) }]),
          { sec: 'الشهادة' },
          { k: 'status', l: 'العبارة', t: 'select', opts: STATUS },
          { k: 'note', l: 'ملاحظات', ph: 'سلمت له(ا) هذه الشهادة بطلب منه(ا) لغرض إداري' },
          { k: 'city', l: 'حرر ب', half: true }, { k: 'date', l: 'في', t: 'date', half: true },
          { k: 'start', l: 'أول رقم (اختياري)', t: 'num', half: true, ph: String(maxNo(sy) + 1), hint: `آخر رقم مسجل: ${maxNo(sy) || '—'}` },
          { k: 'layout', l: 'الطبع', t: 'select', half: true, opts: [['two', 'نسختان لكل تلميذ(ة) في ورقة'], ['pair', 'تلميذان في كل ورقة (نسخة لكل واحد)']] },
          { k: 'photo', l: 'إطار الصورة', t: 'select', half: true, opts: [['yes', 'نعم'], ['no', 'لا']] },
          { k: 'guard', l: 'توقيع الحارس العام / الناظر', t: 'select', half: true, opts: [['yes', 'نعم'], ['no', 'لا']] },
          { k: 'cls2', l: 'ذكر القسم', t: 'select', half: true, opts: [['yes', 'نعم'], ['no', 'لا']] },
          { k: 'fr', l: 'سطر Nom et Prénom', t: 'select', half: true, opts: [['no', 'عند توفر الاسم بالفرنسية'], ['yes', 'دائما (فارغ للكتابة)']] },
          { note: 'الرقم يُسجل في «سجل الشواهد المسلمة» عند الطبع أو الحفظ PDF فقط، والشهادة المعادة لنفس التلميذ(ة) بنفس التاريخ تحتفظ برقمها.' }
        ];
      },
      onSave: k => (['unit', 'lvl', 'cls', 'scope'].includes(k) ? 'redraw' : null),
      build: (s, f, sy, st) => ({ page: 'a4', pages: certPages(s, f, sy, st) }),
      afterOut: (f, sy, st, kind) => { if (kind === 'print' || kind === 'pdf') register(f, sy, st); }
    },
    {
      k: 'reg', t: 'سجل الشواهد المدرسية المسلمة (المتمدرسون)', grp: 'r', page: 'a4l',
      d: 'رقم الشهادة، التلميذ(ة)، الرمز، المستوى، القسم، تاريخ التسليم', auto: 'الشواهد المطبوعة أو المحفوظة PDF',
      init: () => ({ lvl: '' }),
      defs: (f, sy) => [{ k: 'lvl', l: 'المستوى', t: 'select', opts: [['', 'كل المستويات']].concat(lvlsOf(sy).map(l => [l, lvName(l)])) }],
      build: (s, f, sy) => {
        const R = regOf(sy).filter(r => !f.lvl || r.lvl === f.lvl).sort((a, b) => a.no - b.no);
        return { title: 'سجل الشواهد المدرسية المسلمة', sub: `الموسم الدراسي ${MK.syDash(sy)}`, page: 'a4l',
          blocks: [{ table: { cls: 'sb-t', head: K.thr(['الرقم', 'الاسم والنسب', 'رمز مسار', 'المستوى', 'القسم', 'تاريخ التسليم', 'ملاحظات']),
            rows: R.length ? R.map(r => K.tr([{ t: `${slashSy(sy)}/${r.no}` }, { t: r.name }, { t: r.code }, { t: lvName(r.lvl) }, { t: r.cls }, { t: dmyS(r.date) }, { t: '' }])) : [K.tr([{ t: 'لا توجد شواهد مسجلة بعد' }, { t: '' }, { t: '' }, { t: '' }, { t: '' }, { t: '' }, { t: '' }])] } }] };
      }
    }
  ];

  const C = K.center({
    id: 'certscur', title: 'الشواهد المدرسية (المتمدرسين)', icon: '🎓', route: 'certsCurDoc', hubRoute: 'certsCur',
    groups: [['c', 'الشهادة المدرسية'], ['r', 'السجل']], docs: () => DOCS, store: sy => store(sy),
    intro: () => `شهادة مدرسية على نموذج منظومة مسار للتلاميذ <b>المتمدرسين حاليا</b> المستوردين من لوائح مسار في «بطاقة التلاميذ» (${pupilsOf(MK.curSy()).length} تلميذ(ة) هذا الموسم). اختر تلميذا من الجدول أسفله أو افتح «شهادة مدرسية» لطبع شواهد قسم كامل.`,
    onHub: v => {
      const sy = MK.curSy(), all = pupilsOf(sy);
      const box = document.createElement('div'); box.className = 'card'; box.style.marginTop = '12px';
      const fl = { q: '', cls: '' };
      const draw = () => {
        const q = MK.hkey(fl.q);
        const L = all.filter(p => (!fl.cls || p.cls === fl.cls) && (!q || MK.hkey(fullAr(p) + ' ' + p.code).includes(q)));
        const issued = new Set(regOf(sy).map(r => r.code));
        box.innerHTML = `<div class="card-h"><h3>التلاميذ المتمدرسون</h3><span class="sp"></span>
            <input class="inp" id="csQ" placeholder="بحث بالاسم أو الرمز" style="width:200px" value="${esc(fl.q)}">
            <select class="inp" id="csC" style="width:auto"><option value="">كل الأقسام</option>${Array.from(new Set(all.map(p => p.cls).filter(Boolean))).map(c => `<option ${c === fl.cls ? 'selected' : ''}>${esc(c)}</option>`).join('')}</select></div>
          <div class="card-b" style="max-height:60vh;overflow:auto">${L.length ? `<table class="tbl compact"><thead><tr><th>#</th><th>الاسم والنسب</th><th>الرمز</th><th>المستوى</th><th>القسم</th><th>تاريخ الازدياد</th><th></th></tr></thead><tbody>
            ${L.slice(0, 400).map((p, i) => `<tr><td class="num">${i + 1}</td><td>${esc(fullAr(p))}</td><td dir="ltr">${esc(p.code)}</td><td>${esc(lvName(p.lvl))}</td><td dir="ltr">${esc(p.cls || '')}</td><td dir="ltr">${esc(dmy(p.birth))}</td>
              <td><button class="btn sm ${issued.has(p.code) ? '' : 'pri'}" data-cs="${esc(p.code)}">${ic('cap')} شهادة</button></td></tr>`).join('')}</tbody></table>${L.length > 400 ? '<p class="muted">… استعمل البحث لإظهار الباقي</p>' : ''}`
            : `<div class="empty-state">${all.length ? 'لا نتائج' : 'لا يوجد تلاميذ: استورد لوائح التلاميذ من مسار في «بطاقة التلاميذ».'}</div>`}</div>`;
        $('#csQ', box).oninput = e => { fl.q = e.target.value; const p = e.target.selectionStart; draw(); const i = $('#csQ', box); i.focus(); i.setSelectionRange(p, p); };
        $('#csC', box).onchange = e => { fl.cls = e.target.value; draw(); };
        $$('[data-cs]', box).forEach(b => b.onclick = () => go('certsCurDoc', { kind: 'cert', o: { code: b.dataset.cs } }));
      };
      draw(); v.appendChild(box);
    }
  });

  Dx.modCss += `
  .cs-page{display:flex;flex-direction:column;flex:1;min-height:0;height:100%}
  .cs-copy{flex:1 1 0;min-width:0;border:1px solid #000;padding:2mm 4mm;display:flex;flex-direction:column;font-size:10.8pt;line-height:1.5;overflow:hidden;min-height:0;box-sizing:border-box;width:100%}
  .cs-hdr{zoom:.8;flex:none}.cs-hdr .hdr,.cs-hdr .hdr-img{margin-bottom:.5mm!important}
  .cs-meta{display:flex;flex-wrap:wrap;gap:1mm 8mm;font-size:10pt;margin:.5mm 0 1.5mm}.cs-meta .k,.cs-l .k{font-weight:700}
  .cs-title{margin:1mm auto 2mm;border:2px solid #000;padding:1mm 8mm;font-weight:700;font-size:14pt;display:inline-flex;gap:4mm;align-items:baseline;align-self:center}
  .cs-title>span:first-child{text-decoration:underline;text-underline-offset:1.2mm}.cs-no{font-size:12pt}
  .cs-body{position:relative;flex:1}.cs-l{margin:.35mm 0}.cs-st{font-weight:700;margin-top:1.6mm}
  .cs-photo{position:absolute;left:0;top:0;width:26mm;height:32mm;border:1px solid #000;display:flex;align-items:center;justify-content:center;color:#888;font-size:8.5pt}
  .cs-body .cs-l{padding-left:30mm}
  .cs-date{display:flex;justify-content:space-between;margin-top:1mm;font-weight:700}
  .cs-sig{display:flex;justify-content:space-between;gap:10mm;margin-top:.5mm;font-weight:700;font-size:10pt;min-height:18mm;flex:none}.cs-sig>div{max-width:60%}.cs-sig>div:last-child{text-align:center}
  .cs-cut{text-align:left;border-top:1.2px dashed #555;margin:2.2mm 0;line-height:0;font-size:12pt}
  .cs-dots{display:inline-block;border-bottom:1px dotted #333;height:4mm;vertical-align:bottom}
  .cs-empty{margin:40mm auto;text-align:center;color:#666;font-size:13pt}`;

  window.CertsCur = { migrate, reg: () => CC().reg, DOCS };
  window.pageCertsCur = (v, a) => { migrate(DB); C.hub(v, a); };
  window.pageCertsCurDoc = (v, a) => { migrate(DB); C.doc(v, a); };
})();
