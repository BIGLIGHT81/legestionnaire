'use strict';
/* 1.9.4 — التدبير المالي والمادي ← «استهلاك الماء والكهرباء»: شبكة تتبع استهلاك الماء والكهرباء بالمؤسسة.
   العدادات (النوع، الرقم، الوحدة المدرسية / المرفق)، القراءات (الفترة، القراءة السابقة والحالية، الكمية، المبلغ، الملاحظات حول
   التسربات والأعطاب)، المؤشرات والمبيانات، رصد الارتفاع غير الاعتيادي، المقارنة بين الفترات، والتقارير الدورية القابلة للطباعة.
   Data: DB.conso = { meters: [{ id, kind: 'water'|'elec', no, unit, place, provider, price }], reads: [{ id, mid, from, to, prev, cur, qty, amount, inv, note }] } */
(function () {
  const Dx = window.Docs, esc = Dx.esc;
  const nm = t => String(t == null ? '' : t).trim();
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.').replace(/\s/g, '')); return isFinite(n) ? n : null; };
  const R = () => { const c = (DB.conso = DB.conso && typeof DB.conso === 'object' ? DB.conso : {}); c.meters = Array.isArray(c.meters) ? c.meters : []; c.reads = Array.isArray(c.reads) ? c.reads : []; return c; };
  const KIND = { water: { n: 'الماء', u: 'م³', c: '#1e88e5', ic: '💧' }, elec: { n: 'الكهرباء', u: 'ك.و.س', c: '#f0a020', ic: '⚡' } };
  const fmt = (v, d) => (v == null || !isFinite(v) ? '—' : (Math.round(v * Math.pow(10, d || 0)) / Math.pow(10, d || 0)).toLocaleString('fr-FR').replace(/ /g, ' '));
  const ld = iso => (iso ? (window.K && K.ldate ? K.ldate(iso) : iso) : '');
  const days = (a, b) => { const x = Date.parse(a), y = Date.parse(b); return isFinite(x) && isFinite(y) ? Math.max(1, Math.round((y - x) / 864e5) + 1) : null; };
  const addDay = (iso, n) => { const d = new Date(Date.parse(iso) + (n || 1) * 864e5); return isNaN(d) ? '' : d.toISOString().slice(0, 10); };
  const meter = id => R().meters.find(m => m.id === id) || null;
  const qtyOf = r => (num(r.qty) != null ? num(r.qty) : num(r.cur) != null && num(r.prev) != null ? Math.max(0, num(r.cur) - num(r.prev)) : null);
  const readsOf = mid => R().reads.filter(r => r.mid === mid).sort((a, b) => String(a.to || '').localeCompare(String(b.to || '')));
  const perDay = r => { const q = qtyOf(r), d = days(r.from, r.to); return q != null && d ? q / d : null; };
  // unusual: the daily average of the period is 30 % above the average of the previous periods of the same meter (at least 2)
  function alertOf(r) {
    const L = readsOf(r.mid), i = L.indexOf(r); if (i < 2) return null;
    const prev = L.slice(0, i).map(perDay).filter(v => v != null); if (prev.length < 2) return null;
    const avg = prev.reduce((a, b) => a + b, 0) / prev.length, v = perDay(r);
    return v != null && avg > 0 && v > avg * 1.3 ? Math.round((v / avg - 1) * 100) : null;
  }
  const inRange = (r, a, b) => String(r.to || '') >= a && String(r.to || '') <= b;
  const syRange = sy => { const y = MK.syStart(sy); return [`${y}-09-01`, `${y + 1}-08-31`]; };
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'ماي', 'يونيو', 'يوليوز', 'غشت', 'شتنبر', 'أكتوبر', 'نونبر', 'دجنبر'];
  const syMonths = sy => { const y = MK.syStart(sy); return Array.from({ length: 12 }, (_, i) => { const m = (8 + i) % 12, yy = i < 4 ? y : y + 1; return { key: `${yy}-${String(m + 1).padStart(2, '0')}`, n: MONTHS[m] }; }); };
  const totals = (kind, a, b, unit) => { let q = 0, amt = 0, n = 0; R().reads.forEach(r => { const m = meter(r.mid); if (!m || m.kind !== kind || !inRange(r, a, b) || (unit && !K.U.same(m.unit, unit))) return; const v = qtyOf(r); if (v != null) { q += v; n++; } amt += num(r.amount) || 0; }); return { q, amt, n }; };
  const monthly = (kind, sy, unit) => syMonths(sy).map(mo => R().reads.reduce((t, r) => { const m = meter(r.mid); return m && m.kind === kind && String(r.to || '').slice(0, 7) === mo.key && (!unit || K.U.same(m.unit, unit)) ? t + (qtyOf(r) || 0) : t; }, 0));
  const st = { sy: '', unit: '' };
  const STATUS = { ok: 'مربوط بالشبكة', none: 'لم يتم الربط بعد', prog: 'في طور الربط', assoc: 'تسيره جمعية محلية', other: 'وضعية أخرى' };
  /* 1.9.4: «مراسلة في شأن تدقيق الربط بشبكة الماء والكهرباء» (one row per school unit: water and electricity meters, address, unit, GRESA code) */
  const UI = () => { const c = R(); c.uinfo = c.uinfo && typeof c.uinfo === 'object' ? c.uinfo : {}; return c.uinfo; };
  const unitRows = () => {
    const U = K.U.names(), M = R().meters, names = U.length ? U : Array.from(new Set(M.map(m => nm(m.unit)).filter(Boolean)));
    return (names.length ? names : [S().school || '']).map(u => {
      const mm = M.filter(m => (U.length ? K.U.same(m.unit, u) : nm(m.unit) === u) || (!m.unit && names.length === 1)), info = UI()[u] || {};
      const cell = kind => { const L = mm.filter(m => m.kind === kind); if (!L.length) return info[kind] || STATUS.none; return L.map(m => (m.status && m.status !== 'ok' ? STATUS[m.status] + (m.no ? ' (' + m.no + ')' : '') : [m.provider && /ONEE|المكتب/i.test(m.provider) ? 'ONEE' : '', m.no].filter(Boolean).join(' '))).join(' / '); };
      const g = window.Pupils && Pupils.gresaOf ? Pupils.gresaOf(u) : '';
      return { u, water: cell('water'), elec: cell('elec'), addr: info.addr || (mm.find(m => m.addr) || {}).addr || '', fr: info.fr || '', gresa: info.gresa || g || '' };
    });
  };
  function letter(s, f) {
    if (!window.Letter) return [];
    const rows = unitRows().map(r => `<tr><td dir="ltr">${esc(r.gresa)}</td><td dir="ltr" class="b">${esc(r.fr || r.u)}</td><td dir="ltr">${esc(r.addr)}</td><td dir="ltr">${esc(r.elec)}</td><td dir="ltr">${esc(r.water)}</td></tr>`);
    const dir = String(s.directorate || '').replace(/^(?:ال)?مديرية\s+(?:ال)?إ?ا?قليمية\s*(?:ل|ب)?\s*/, '');
    return Letter.pages(s, Letter.blocks({ s, f, noSup: true, subject: f.subject, refs: [f.ref],
      to: ['إلى السيد: المدير الإقليمي للأكاديمية الجهوية للتربية والتكوين' + (Letter.myReg ? ' ' + esc(Letter.myReg(s) || '') : ''), 'بالمديرية الإقليمية ' + esc(dir || '..........'), esc(f.service || 'مصلحة الشؤون الإدارية والمالية'), esc(f.office || 'مكتب ترشيد استهلاك الماء والكهرباء والهاتف')],
      body: 'وبعد، فعلاقة بالموضوع والمرجع المشار إليهما أعلاه، يشرفني أن أبعث لكم البيانات التالية:',
      table: { head: `<tr><th>Code GRESA</th><th>Nom de l’unité</th><th>Adresse</th><th>N° Compteur d’électricité</th><th>N° Compteur d’eau</th></tr>`, rows },
      close: 'وتقبلوا فائق التقدير والاحترام.', sign: 'خاتم وتوقيع مدير المؤسسة' }));
  }

  /* ---------- forms ---------- */
  function meterForm(m0, done) {
    const m = m0 ? Object.assign({}, m0) : { id: uid('mt'), kind: 'water', no: '', unit: '', place: '', provider: '', price: '' };
    const b = document.createElement('div');
    b.innerHTML = `<div class="fgrid"><div class="fld"><label>نوع المرفق</label><select class="inp" data-f="kind"><option value="water" ${m.kind === 'water' ? 'selected' : ''}>💧 الماء</option><option value="elec" ${m.kind === 'elec' ? 'selected' : ''}>⚡ الكهرباء</option></select></div>
      <div class="fld"><label>رقم العداد</label><input class="inp" data-f="no" dir="ltr" value="${esc(m.no)}"></div>
      <div class="fld"><label>الوحدة المدرسية</label><input class="inp" data-f="unit" list="cnU" value="${esc(m.unit)}"></div>
      <div class="fld"><label>المرفق / المكان</label><input class="inp" data-f="place" value="${esc(m.place)}" placeholder="الإدارة، الأقسام، السكن الوظيفي، المرافق الصحية..."></div>
      <div class="fld"><label>الجهة الموزعة</label><input class="inp" data-f="provider" value="${esc(m.provider)}" placeholder="المكتب الوطني للكهرباء والماء / الوكالة المستقلة..."></div>
      <div class="fld"><label>ثمن الوحدة التقريبي (درهم، اختياري)</label><input class="inp" data-f="price" dir="ltr" value="${esc(m.price)}"></div>
      <div class="fld"><label>وضعية الربط بالشبكة</label><select class="inp" data-f="status">${Object.entries(STATUS).map(([k, t]) => `<option value="${k}" ${k === (m.status || 'ok') ? 'selected' : ''}>${t}</option>`).join('')}</select></div>
      <div class="fld"><label>العنوان (يظهر في مراسلة تدقيق الربط)</label><input class="inp" data-f="addr" value="${esc(m.addr || '')}" placeholder="مثال: Douar Sidi Belkassem"></div></div>${K.dl('cnU', K.U.names())}`;
    b.querySelectorAll('[data-f]').forEach(el => el.oninput = el.onchange = () => { m[el.dataset.f] = el.value; });
    modal({ title: m0 ? 'تعديل العداد' : 'إضافة عداد', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (!nm(m.no) && !nm(m.place)) { toast('اكتب رقم العداد أو المرفق', true); return false; }
      const L = R().meters, i = L.findIndex(x => x.id === m.id); if (i >= 0) L[i] = m; else L.push(m); persist(); done();
    } }, { label: 'إلغاء' }] });
  }
  function readForm(r0, done, mid0) {
    const M = R().meters; if (!M.length) return toast('أضف العداد أولا', true);
    const r = r0 ? Object.assign({}, r0) : { id: uid('rd'), mid: mid0 || M[0].id, from: '', to: Dx.todayIso(), prev: '', cur: '', qty: '', amount: '', inv: '', note: '' };
    const fillPrev = () => { if (r0) return; const L = readsOf(r.mid).filter(x => x.id !== r.id), last = L[L.length - 1]; r.prev = last ? last.cur : ''; r.from = last && last.to ? addDay(last.to, 1) : ''; };
    if (!r0) fillPrev();
    const b = document.createElement('div');
    const draw = () => {
      const m = meter(r.mid) || {}, u = (KIND[m.kind] || KIND.water).u, q = qtyOf(r), price = num(m.price);
      b.innerHTML = `<div class="fgrid"><div class="fld"><label>العداد</label><select class="inp" data-f="mid">${M.map(x => `<option value="${x.id}" ${x.id === r.mid ? 'selected' : ''}>${KIND[x.kind].ic} ${esc(KIND[x.kind].n)} — ${esc(x.no || '')} ${esc(x.unit || x.place || '')}</option>`).join('')}</select></div>
        <div class="fld"><label>رقم الفاتورة (اختياري)</label><input class="inp" data-f="inv" dir="ltr" value="${esc(r.inv)}"></div>
        <div class="fld"><label>الفترة من</label><input type="date" class="inp" data-f="from" value="${esc(r.from)}"></div>
        <div class="fld"><label>إلى</label><input type="date" class="inp" data-f="to" value="${esc(r.to)}"></div>
        <div class="fld"><label>القراءة السابقة (${u})</label><input class="inp" data-f="prev" dir="ltr" value="${esc(r.prev)}"></div>
        <div class="fld"><label>القراءة الحالية (${u})</label><input class="inp" data-f="cur" dir="ltr" value="${esc(r.cur)}"></div>
        <div class="fld"><label>الكمية المستهلكة (${u})</label><input class="inp" data-f="qty" dir="ltr" value="${esc(r.qty)}" placeholder="${q != null && !nm(r.qty) ? fmt(q, 2) + ' (محسوبة)' : 'تحسب من القراءتين'}"></div>
        <div class="fld"><label>المبلغ (درهم)</label><input class="inp" data-f="amount" dir="ltr" value="${esc(r.amount)}" placeholder="${price && q != null ? fmt(q * price, 2) + ' (تقديري)' : ''}"></div></div>
        <div class="fld"><label>ملاحظات (تسربات، أعطاب، إصلاحات...)</label><textarea class="inp" rows="2" data-f="note">${esc(r.note)}</textarea></div>`;
      b.querySelectorAll('[data-f]').forEach(el => { el.oninput = () => { r[el.dataset.f] = el.value; }; el.onchange = () => { r[el.dataset.f] = el.value; if (el.dataset.f === 'mid') fillPrev(); if (['mid', 'prev', 'cur'].includes(el.dataset.f)) draw(); }; });
    };
    draw();
    modal({ title: r0 ? 'تعديل القراءة' : 'تسجيل قراءة / فاتورة', body: b, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      if (!r.to) { toast('حدد نهاية الفترة', true); return false; }
      if (num(r.cur) != null && num(r.prev) != null && num(r.cur) < num(r.prev)) { toast('القراءة الحالية أصغر من السابقة: تحقق من الأرقام', true); return false; }
      if (qtyOf(r) == null) { toast('أدخل القراءتين أو الكمية المستهلكة', true); return false; }
      if (!nm(r.amount)) { const p = num((meter(r.mid) || {}).price); if (p) r.amountEst = Math.round(qtyOf(r) * p * 100) / 100; }
      const L = R().reads, i = L.findIndex(x => x.id === r.id); if (i >= 0) L[i] = r; else L.push(r); persist(); done();
      const a = alertOf(r); if (a) toast(`تنبيه: استهلاك هذه الفترة أعلى بـ ${a}% من المعدل المعتاد لهذا العداد`, true);
    } }, { label: 'إلغاء' }] });
  }

  /* ---------- the page ---------- */
  function page(v) {
    st.sy = st.sy || MK.curSy();
    const sy = st.sy, [a, b] = syRange(sy), y0 = MK.syStart(sy), [pa, pb] = [`${y0 - 1}-09-01`, `${y0}-08-31`];
    const M = R().meters.filter(m => !st.unit || K.U.same(m.unit, st.unit));
    const reads = R().reads.filter(r => M.some(m => m.id === r.mid)).sort((x, y) => String(y.to || '').localeCompare(String(x.to || '')));
    const kpi = k => { const t = totals(k, a, b, st.unit), p = totals(k, pa, pb, st.unit), d = p.q && t.n ? Math.round((t.q / p.q - 1) * 100) : null; return `<div class="card" style="padding:12px 14px;border-top:4px solid ${KIND[k].c}"><div style="font-weight:700">${KIND[k].ic} ${KIND[k].n}</div><div style="font-size:24px;font-weight:700;color:${KIND[k].c}">${fmt(t.q, 1)} <small style="font-size:13px">${KIND[k].u}</small></div><div class="muted" style="font-size:12.5px">${t.amt ? fmt(t.amt, 2) + ' درهم — ' : ''}${t.n} قراءة${d != null ? ` — <b style="color:${d > 0 ? '#c0392b' : '#1e8449'}">${d > 0 ? '+' : ''}${d}%</b> مقارنة بالموسم السابق` : ''}</div></div>`; };
    const alerts = reads.map(r => [r, alertOf(r)]).filter(x => x[1]);
    const units = K.U.names();
    v.innerHTML = `<div class="page-h"><h1>تدبير وتتبع استهلاك الماء والكهرباء</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="cnMeter">${ic('plus')} عداد</button><button class="btn pri" id="cnRead">${ic('plus')} قراءة / فاتورة</button><button class="btn" id="cnLet" title="مراسلة المديرية: أرقام عدادات الماء والكهرباء لكل وحدة مدرسية">${ic('file')} مراسلة تدقيق الربط</button><button class="btn" id="cnPrint">${ic('print')} التقارير</button></div>
      <div class="card" style="padding:10px 14px;margin-bottom:10px;line-height:1.85;font-size:13px">سجّل عدادات الماء والكهرباء (لكل وحدة مدرسية أو مرفق)، ثم القراءات أو الفواتير: الفترة، القراءة السابقة والحالية، الكمية والمبلغ، والملاحظات حول التسربات والأعطاب. يرصد البرنامج تلقائيا كل ارتفاع يفوق المعدل المعتاد للعداد بأكثر من 30%، ويقارن الاستهلاك بين الأشهر والمواسم، ويُعد تقارير دورية للطباعة.</div>
      ${units.length > 1 ? `<div class="toolbar" style="margin-bottom:8px"><select class="inp" id="cnU" style="width:auto"><option value="">كل الوحدات المدرسية</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>` : ''}
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:10px;margin-bottom:10px">${kpi('water')}${kpi('elec')}<div class="card" style="padding:12px 14px;border-top:4px solid #c0392b"><div style="font-weight:700">⚠️ ارتفاع غير اعتيادي</div><div style="font-size:24px;font-weight:700;color:#c0392b">${alerts.length}</div><div class="muted" style="font-size:12.5px">${alerts.length ? 'راجع العدادات المعنية وابحث عن التسربات' : 'لا توجد فترات مرتفعة بشكل غير عادي'}</div></div></div>
      ${alerts.length ? `<div class="card" style="padding:10px 14px;margin-bottom:10px;background:#fdecea;border-color:#f5b7b1;line-height:1.9">${alerts.map(([r, p]) => { const m = meter(r.mid); return `⚠️ <b>${esc(KIND[m.kind].n)} — ${esc(m.no || m.place || '')}${m.unit ? ' (' + esc(m.unit) + ')' : ''}</b>: الفترة ${esc(ld(r.from))} — ${esc(ld(r.to))} أعلى بـ <b>${p}%</b> من المعدل اليومي المعتاد${r.note ? ' — ' + esc(r.note) : ''}`; }).join('<br>')}</div>` : ''}
      <div class="roz-two">${['water', 'elec'].map(k => `<div class="card"><div class="card-h"><h3>${KIND[k].ic} ${KIND[k].n}: الاستهلاك الشهري (${KIND[k].u})</h3></div><div class="card-b">${K.bars(syMonths(sy).map(x => x.n), [{ name: MK.syDash(sy), color: KIND[k].c, vals: monthly(k, sy, st.unit) }, { name: MK.syDash(`${y0 - 1}/${y0}`) || 'الموسم السابق', color: '#b0bec5', vals: monthly(k, `${y0 - 1}/${y0}`, st.unit) }], { w: 560, h: 220, fs: 9, fmt: x => (x ? fmt(x) : '') })}</div></div>`).join('')}</div>
      <div class="sec-t" style="margin-top:12px">العدادات (${M.length})</div>
      ${M.length ? `<div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>النوع</th><th>رقم العداد</th><th>الوحدة</th><th>المرفق</th><th>الجهة الموزعة</th><th>آخر قراءة</th><th>استهلاك الموسم</th><th></th></tr></thead><tbody>${M.map(m => { const L = readsOf(m.id), l = L[L.length - 1], t = L.filter(r => inRange(r, a, b)).reduce((s2, r) => s2 + (qtyOf(r) || 0), 0); return `<tr><td>${KIND[m.kind].ic} ${KIND[m.kind].n}</td><td dir="ltr">${esc(m.no)}</td><td>${esc(m.unit)}</td><td>${esc(m.place)}</td><td>${esc(m.provider)}${m.status && m.status !== 'ok' ? ` <span class="badge" style="background:#fdecea;color:#b03a2e">${STATUS[m.status]}</span>` : ''}</td><td>${l ? esc(fmt(num(l.cur), 0)) + ' — ' + esc(ld(l.to)) : '—'}</td><td class="num"><b>${fmt(t, 1)}</b> ${KIND[m.kind].u}</td><td style="white-space:nowrap"><button class="btn sm" data-rm="${m.id}">${ic('plus')} قراءة</button><button class="btn sm" data-em="${m.id}">${ic('edit')}</button><button class="btn sm danger" data-dm="${m.id}">${ic('trash')}</button></td></tr>`; }).join('')}</tbody></table></div></div>` : '<div class="empty-state">لا توجد عدادات بعد: اضغط «عداد» لإضافة عداد الماء أو الكهرباء.</div>'}
      <div class="sec-t" style="margin-top:12px">القراءات والفواتير</div>
      ${reads.length ? `<div class="card"><div class="card-b" style="overflow:auto"><table class="tbl compact"><thead><tr><th>العداد</th><th>الفترة</th><th>السابقة</th><th>الحالية</th><th>الكمية</th><th>المعدل اليومي</th><th>المبلغ (درهم)</th><th>ملاحظات</th><th></th></tr></thead><tbody>${reads.map(r => { const m = meter(r.mid) || {}, k = KIND[m.kind] || KIND.water, al = alertOf(r); return `<tr ${al ? 'style="background:#fdecea"' : ''}><td>${k.ic} ${esc(m.no || m.place || '')}</td><td>${esc(ld(r.from))} — ${esc(ld(r.to))}</td><td class="num">${esc(r.prev)}</td><td class="num">${esc(r.cur)}</td><td class="num"><b>${fmt(qtyOf(r), 2)}</b> ${k.u}</td><td class="num">${fmt(perDay(r), 2)}${al ? ` <b style="color:#c0392b">▲${al}%</b>` : ''}</td><td class="num">${r.amount ? fmt(num(r.amount), 2) : r.amountEst ? '≈ ' + fmt(r.amountEst, 2) : '—'}</td><td style="font-size:12px">${esc(r.note)}</td><td style="white-space:nowrap"><button class="btn sm" data-er="${r.id}">${ic('edit')}</button><button class="btn sm danger" data-dr="${r.id}">${ic('trash')}</button></td></tr>`; }).join('')}</tbody></table></div></div>` : '<div class="empty-state">لا توجد قراءات بعد.</div>'}`;
    const again = () => page(v);
    $('#cnMeter', v).onclick = () => meterForm(null, again);
    $('#cnRead', v).onclick = () => readForm(null, again);
    $('#cnPrint', v).onclick = () => go('consoDoc', {});
    $('#cnLet', v).onclick = () => go('consoDoc', { kind: 'letter' });
    if ($('#cnU', v)) $('#cnU', v).onchange = e => { st.unit = e.target.value; again(); };
    $$('[data-rm]', v).forEach(x => x.onclick = () => readForm(null, again, x.dataset.rm));
    $$('[data-em]', v).forEach(x => x.onclick = () => meterForm(meter(x.dataset.em), again));
    $$('[data-dm]', v).forEach(x => x.onclick = async () => { if (!(await confirmBox('حذف هذا العداد وكل قراءاته؟', 'حذف'))) return; const c = R(); c.meters = c.meters.filter(m => m.id !== x.dataset.dm); c.reads = c.reads.filter(r => r.mid !== x.dataset.dm); persist(); again(); });
    $$('[data-er]', v).forEach(x => x.onclick = () => readForm(R().reads.find(r => r.id === x.dataset.er), again));
    $$('[data-dr]', v).forEach(x => x.onclick = async () => { if (!(await confirmBox('حذف هذه القراءة؟', 'حذف'))) return; const c = R(); c.reads = c.reads.filter(r => r.id !== x.dataset.dr); persist(); again(); });
  }

  /* ---------- periodic report ---------- */
  const PERIODS = sy => { const y = MK.syStart(sy); return [['sy', `الموسم الدراسي ${MK.syDash(sy)}`, `${y}-09-01`, `${y + 1}-08-31`], ['s1', 'الأسدس الأول', `${y}-09-01`, `${y + 1}-01-31`], ['s2', 'الأسدس الثاني', `${y + 1}-02-01`, `${y + 1}-08-31`], ['t1', 'الفصل الأول (شتنبر — دجنبر)', `${y}-09-01`, `${y}-12-31`], ['t2', 'الفصل الثاني (يناير — مارس)', `${y + 1}-01-01`, `${y + 1}-03-31`], ['t3', 'الفصل الثالث (أبريل — غشت)', `${y + 1}-04-01`, `${y + 1}-08-31`]].concat(syMonths(sy).map(m => ['m' + m.key, 'شهر ' + m.n + ' ' + m.key.slice(0, 4), m.key + '-01', m.key + '-31'])); };
  const shiftY = (iso, n) => String(+iso.slice(0, 4) + n) + iso.slice(4);
  function report(s, sy, f) {
    const P = PERIODS(sy).find(p => p[0] === (f.per || 'sy')) || PERIODS(sy)[0], [, pn, a, b] = P, la = shiftY(a, -1), lb = shiftY(b, -1);
    const thr = cells => K.thr(cells.map(c => ({ t: c, c: 'd' })));
    const blocks = [{ html: `<p class="sb-p">الفترة: <b>${esc(pn)}</b> (${esc(ld(a))} — ${esc(ld(b.replace(/-31$/, '-' + new Date(+b.slice(0, 4), +b.slice(5, 7), 0).getDate())))})${f.unit ? ' — الوحدة المدرسية: <b>' + esc(f.unit) + '</b>' : ''}</p>` }];
    ['water', 'elec'].forEach(k => {
      const M = R().meters.filter(m => m.kind === k && (!f.unit || K.U.same(m.unit, f.unit)));
      if (!M.length) return;
      const rows = M.map(m => { const L = readsOf(m.id).filter(r => inRange(r, a, b)), q = L.reduce((t, r) => t + (qtyOf(r) || 0), 0), amt = L.reduce((t, r) => t + (num(r.amount) || r.amountEst || 0), 0), lq = readsOf(m.id).filter(r => inRange(r, la, lb)).reduce((t, r) => t + (qtyOf(r) || 0), 0), d = lq && L.length ? Math.round((q / lq - 1) * 100) : null, al = L.filter(r => alertOf(r)).length;
        return `<tr><td class="r b">${esc(m.no || '')}</td><td class="r">${esc([m.unit, m.place].filter(Boolean).join(' — '))}</td><td>${L.length}</td><td><b>${fmt(q, 1)}</b></td><td>${lq ? fmt(lq, 1) : '—'}</td><td>${d == null ? '—' : (d > 0 ? '+' : '') + d + '%'}</td><td>${amt ? fmt(amt, 2) : '—'}</td><td>${al || ''}</td></tr>`; });
      const t = totals(k, a, b, f.unit), lt = totals(k, la, lb, f.unit), d = lt.q && t.n ? Math.round((t.q / lt.q - 1) * 100) : null;
      rows.push(`<tr class="tot"><td class="r" colspan="3">المجموع</td><td><b>${fmt(t.q, 1)}</b></td><td>${lt.q ? fmt(lt.q, 1) : '—'}</td><td>${d == null ? '—' : (d > 0 ? '+' : '') + d + '%'}</td><td>${t.amt ? fmt(t.amt, 2) : '—'}</td><td></td></tr>`);
      blocks.push({ before: `<div class="sb-cap" style="margin-top:2mm">${KIND[k].n} (${KIND[k].u})</div>`, keepNext: true, table: { cls: 'sb-t cmp', head: thr(['رقم العداد', 'الوحدة / المرفق', 'القراءات', 'الاستهلاك', 'نفس الفترة من السنة السابقة', 'التطور', 'المبلغ (درهم)', 'ارتفاع غير اعتيادي']), rows }, minRows: 1 });
      if (f.per === 'sy' || !f.per) blocks.push(`<div class="c" style="width:150mm;margin:0 auto">${K.bars(syMonths(sy).map(x => x.n), [{ name: MK.syDash(sy), color: KIND[k].c, vals: monthly(k, sy, f.unit) }], { w: 640, h: 190, fs: 9, fmt: x => (x ? fmt(x) : '') })}</div>`);
    });
    const notes = R().reads.filter(r => inRange(r, a, b) && (nm(r.note) || alertOf(r)) && (!f.unit || K.U.same((meter(r.mid) || {}).unit, f.unit)));
    if (notes.length) blocks.push({ before: '<div class="sb-cap" style="margin-top:2mm">الملاحظات والارتفاعات غير الاعتيادية (تسربات، أعطاب...)</div>', keepNext: true, table: { cls: 'sb-t cmp', head: thr(['العداد', 'الفترة', 'الكمية', 'الارتفاع', 'الملاحظة']), rows: notes.map(r => { const m = meter(r.mid) || {}; return `<tr><td class="r">${(KIND[m.kind] || {}).n || ''} — ${esc(m.no || m.place || '')}</td><td>${esc(ld(r.from))} — ${esc(ld(r.to))}</td><td>${fmt(qtyOf(r), 2)}</td><td>${alertOf(r) ? '+' + alertOf(r) + '%' : ''}</td><td class="r">${esc(r.note)}</td></tr>`; }) }, minRows: 1 });
    blocks.push({ html: `<div class="sb-box" style="margin-top:2mm"><h4>الإجراءات والتوصيات</h4><p class="sb-p" style="min-height:16mm">${esc(f.recs || '').replace(/\n/g, '<br>')}</p></div>` });
    return K.SB.pages(s, { title: 'تقرير حول استهلاك الماء والكهرباء', sub: esc(pn), page: 'a4', blocks, sign: K.SB.sign(s, {}) });
  }
  function register(s, sy, f) {
    const [a, b] = syRange(sy), thr = cells => K.thr(cells.map(c => ({ t: c, c: 'd' })));
    const L = R().reads.filter(r => inRange(r, a, b) && (!f.unit || K.U.same((meter(r.mid) || {}).unit, f.unit))).sort((x, y) => String(x.to).localeCompare(String(y.to)));
    const rows = L.map((r, i) => { const m = meter(r.mid) || {}, k = KIND[m.kind] || KIND.water; return `<tr><td>${i + 1}</td><td>${k.n}</td><td>${esc(m.no || '')}</td><td class="r">${esc(m.unit || m.place || '')}</td><td>${esc(ld(r.from))}</td><td>${esc(ld(r.to))}</td><td>${esc(r.prev)}</td><td>${esc(r.cur)}</td><td><b>${fmt(qtyOf(r), 2)}</b> ${k.u}</td><td>${r.amount ? fmt(num(r.amount), 2) : r.amountEst ? '≈' + fmt(r.amountEst, 2) : ''}</td><td class="r" style="font-size:8.6pt">${alertOf(r) ? '<b>▲' + alertOf(r) + '%</b> ' : ''}${esc(r.note)}</td></tr>`; });
    return K.SB.pages(s, { title: 'سجل تتبع استهلاك الماء والكهرباء', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${f.unit ? ' — ' + esc(f.unit) : ''}`, page: 'a4l', blocks: [{ table: { cls: 'sb-t cmp', head: thr(['ر.ت', 'النوع', 'رقم العداد', 'الوحدة / المرفق', 'من', 'إلى', 'القراءة السابقة', 'القراءة الحالية', 'الكمية', 'المبلغ (درهم)', 'ملاحظات (تسربات، أعطاب)']), rows }, minRows: 8 }], sign: K.SB.sign(s, {}) });
  }
  window.pageConso = v => page(v);
  window.pageConsoDoc = function (v, arg) {
    const sy = st.sy || MK.curSy();
    MK.docPage(v, {
      title: 'تقارير استهلاك الماء والكهرباء', icon: '💧', modes: false, flow: true, state: { kind: (arg && arg.kind) || 'rep', per: 'sy', unit: st.unit || '', recs: '', no: '', date: Dx.todayIso(), subject: 'في شأن تدقيق الربط بشبكة الماء والكهرباء', ref: '', service: 'مصلحة الشؤون الإدارية والمالية', office: 'مكتب ترشيد استهلاك الماء والكهرباء والهاتف' },
      back: () => go('conso'),
      form: function F(box, s2, refresh) {
        const units = K.U.names();
        box.innerHTML = `<div class="fld"><label>الوثيقة</label><select class="inp" id="cdK"><option value="rep" ${s2.kind === 'rep' ? 'selected' : ''}>تقرير دوري حول الاستهلاك</option><option value="reg" ${s2.kind === 'reg' ? 'selected' : ''}>سجل القراءات (الموسم)</option><option value="letter" ${s2.kind === 'letter' ? 'selected' : ''}>مراسلة: تدقيق الربط بشبكة الماء والكهرباء</option></select></div>
          ${s2.kind === 'letter' ? `<div class="fgrid"><div class="fld"><label>رقم الإرسال</label><input class="inp" data-l="no" dir="ltr" value="${esc(s2.no)}"></div><div class="fld"><label>التاريخ</label><input class="inp" type="date" data-l="date" value="${esc(s2.date)}"></div></div>
            <div class="fld"><label>الموضوع</label><input class="inp" data-l="subject" value="${esc(s2.subject)}"></div><div class="fld"><label>المرجع</label><input class="inp" data-l="ref" value="${esc(s2.ref)}" placeholder="مراسلتكم رقم ... بتاريخ ..."></div>
            <div class="fld"><label>المصلحة / المكتب</label><input class="inp" data-l="service" value="${esc(s2.service)}"><input class="inp" data-l="office" value="${esc(s2.office)}" style="margin-top:4px"></div>
            <div class="sec-t">معطيات الوحدات (تحفظ)</div><p class="muted" style="font-size:12px;line-height:1.7;margin:0 0 6px">أرقام العدادات ووضعية الربط تؤخذ من العدادات المسجلة. اكتب هنا ما ينقص: العنوان، اسم الوحدة بالفرنسية، رمز GRESA، أو وضعية وحدة بدون عداد (مثال: في طور الربط، تسيره جمعية محلية).</p>
            ${unitRows().map(r => `<div class="cn-u"><b>${esc(r.u)}</b><input class="inp" dir="ltr" data-u="${esc(r.u)}" data-k="addr" placeholder="Adresse" value="${esc(r.addr)}"><input class="inp" dir="ltr" data-u="${esc(r.u)}" data-k="fr" placeholder="Nom de l’unité (FR)" value="${esc(r.fr)}"><input class="inp" dir="ltr" data-u="${esc(r.u)}" data-k="gresa" placeholder="GRESA" value="${esc(r.gresa)}">
              <input class="inp" data-u="${esc(r.u)}" data-k="water" list="cnSt" placeholder="الماء بدون عداد" value="${esc((UI()[r.u] || {}).water || '')}"><input class="inp" data-u="${esc(r.u)}" data-k="elec" list="cnSt" placeholder="الكهرباء بدون عداد" value="${esc((UI()[r.u] || {}).elec || '')}"></div>`).join('')}${K.dl('cnSt', Object.values(STATUS).slice(1))}` : ''}
          ${s2.kind === 'rep' ? `<div class="fld"><label>الفترة</label><select class="inp" id="cdP">${PERIODS(sy).map(p => `<option value="${p[0]}" ${p[0] === s2.per ? 'selected' : ''}>${esc(p[1])}</option>`).join('')}</select></div>` : ''}
          ${units.length > 1 ? `<div class="fld"><label>الوحدة المدرسية</label><select class="inp" id="cdU"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === s2.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select></div>` : ''}
          ${s2.kind === 'rep' ? `<div class="fld"><label>الإجراءات والتوصيات</label><textarea class="inp" rows="4" id="cdR" placeholder="إصلاح التسربات، إطفاء الأجهزة بعد الاستعمال، تحسيس التلاميذ بترشيد الاستهلاك...">${esc(s2.recs)}</textarea></div>` : ''}`;
        $('#cdK', box).onchange = e => { s2.kind = e.target.value; F(box, s2, refresh); refresh(); };
        $$('[data-l]', box).forEach(el => el.oninput = () => { s2[el.dataset.l] = el.value; clearTimeout(box._t); box._t = setTimeout(refresh, 400); });
        $$('[data-u]', box).forEach(el => el.oninput = () => { const u = el.dataset.u, o = (UI()[u] = UI()[u] || {}); o[el.dataset.k] = el.value; persist(); clearTimeout(box._t); box._t = setTimeout(refresh, 400); });
        if ($('#cdP', box)) $('#cdP', box).onchange = e => { s2.per = e.target.value; refresh(); };
        if ($('#cdU', box)) $('#cdU', box).onchange = e => { s2.unit = e.target.value; refresh(); };
        if ($('#cdR', box)) $('#cdR', box).oninput = e => { s2.recs = e.target.value; clearTimeout(box._t); box._t = setTimeout(refresh, 400); };
      },
      build: s2 => (s2.kind === 'letter' ? { page: 'a4', pages: letter(S(), s2) } : s2.kind === 'reg' ? { page: 'a4l', pages: register(S(), sy, s2) } : { page: 'a4', pages: report(S(), sy, s2) }),
      fname: s2 => (s2.kind === 'letter' ? 'مراسلة_تدقيق_الربط_بالماء_والكهرباء' : s2.kind === 'reg' ? 'سجل_استهلاك_الماء_والكهرباء' : 'تقرير_استهلاك_الماء_والكهرباء')
    });
  };
  { const c = document.createElement('style'); c.textContent = '.cn-u{display:grid;grid-template-columns:1fr 1fr;gap:4px;border:1px solid var(--line);border-radius:8px;padding:6px;margin-bottom:6px}.cn-u b{grid-column:1/-1}.cn-u .inp{font-size:12.5px;padding:5px 7px}'; document.head.appendChild(c); }
  window.Conso = { summary: () => ({ meters: R().meters.length, reads: R().reads.length }) };
})();
