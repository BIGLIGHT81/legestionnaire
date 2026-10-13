'use strict';
/* 1.9.2 — الاشتراكات والتسجيل: التأمين المدرسي (مبلغ حسب كل سلك، ويشمل الأولي اختياريا)، الانخراط في التعاونية المدرسية (التعليم الابتدائي فقط)، الانخراط في الجمعية الرياضية المدرسية (الابتدائي والإعدادي والتأهيلي).
   «واجب التسجيل» حُذف من الواجهة؛ ما سُجّل سابقا في المعطيات (pay.reg / rates.reg) يبقى محفوظا دون عرض.
   Per pupil payments are kept by year; printable lists of members / non-members per class, level or unit, and a summary by class. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { SB, tr, thr } = window.K;

  const STAGES = [['pre', 'التعليم الأولي'], ['pri', 'التعليم الابتدائي'], ['col', 'التعليم الثانوي الإعدادي'], ['lyc', 'التعليم الثانوي التأهيلي']];
  const ITEMS = [['ins', 'التأمين المدرسي'], ['coop', 'الانخراط في التعاونية المدرسية'], ['sport', 'الانخراط في الجمعية الرياضية المدرسية']];
  const STG_OF = lvl => { const k = String(lvl || ''); return /^(DEPE|PS)/.test(k) ? 'pre' : /^P\d/.test(k) ? 'pri' : /^C\d/.test(k) ? 'col' : k ? 'lyc' : 'pri'; };
  const hasItem = (stage, it) => it === 'coop' ? stage === 'pri' : it === 'sport' ? stage !== 'pre' : true;
  const cycleStage = () => { const c = (S().cycle || ''); return /إعدادي/.test(c) ? 'col' : /تأهيلي/.test(c) ? 'lyc' : 'pri'; };

  function migrate(db) {
    const d = db.dues = db.dues || {};
    d.years = d.years && typeof d.years === 'object' ? d.years : {};
  }
  const Y = sy => { migrate(DB); const y = DB.dues.years[sy] || (DB.dues.years[sy] = {}); y.rates = y.rates || {}; y.pay = y.pay || {}; return y; };
  const rate = (sy, stage, it) => { const r = (Y(sy).rates[stage] || {})[it]; return r === undefined || r === '' ? 0 : (+r || 0); };
  const pkey = p => p.code || p.mid || `${p.last || ''}|${p.first || ''}|${p.birth || ''}`;
  const paid = (sy, p, it) => (Y(sy).pay[pkey(p)] || {})[it] || null;   // { a: amount, d: date } | null

  const pupils = sy => (window.Pupils ? Pupils.current(sy) : []).slice().sort((a, b) => String(a.cls || '').localeCompare(String(b.cls || ''), 'fr', { numeric: true }) || `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`, 'ar'));
  const nameOf = p => `${p.last || ''} ${p.first || ''}`.trim();
  const money = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US').replace(/,/g, '\u00A0');

  function setPaid(sy, p, it, on, amount, no) {
    const o = Y(sy).pay, k = pkey(p), rec = o[k] || (o[k] = {});
    if (on) {
      const old = rec[it] || {};
      rec[it] = { a: amount != null ? amount : (old.a != null ? old.a : rate(sy, STG_OF(p.lvl), it)), d: old.d || todayIso() };
      const n = no != null ? no : old.n; if (n) rec[it].n = String(n);   // receipt number (رقم وصل التأمين)
    } else delete rec[it];
    if (!Object.keys(rec).length) delete o[k];
  }

  /* ---------- totals ---------- */
  function stats(sy, arr) {
    const out = {};
    ITEMS.forEach(([it]) => {
      let n = 0, sum = 0, tot = 0;
      arr.forEach(p => { if (!hasItem(STG_OF(p.lvl), it)) return; tot++; const r = paid(sy, p, it); if (r) { n++; sum += +r.a || 0; } });
      out[it] = { n, sum, tot };
    });
    return out;
  }

  /* ---------- the page ---------- */
  const st = { sy: '', unit: '', cls: '', q: '', only: '' };
  window.pageDues = function (v) {
    migrate(DB);
    const sy = st.sy || (st.sy = MK.curSy());
    const years = Array.from(new Set([MK.curSy()].concat(Object.keys((DB.pupils || {}).years || {})))).sort().reverse();
    const all = pupils(sy);
    const stages = STAGES.filter(([k]) => all.some(p => STG_OF(p.lvl) === k) || k === cycleStage());
    const units = Array.from(new Set(all.map(p => p.unit).filter(Boolean)));
    const classes = Array.from(new Set(all.filter(p => !st.unit || p.unit === st.unit).map(p => p.cls).filter(Boolean)));
    const rows = all.filter(p => (!st.unit || p.unit === st.unit) && (!st.cls || p.cls === st.cls) && (!st.q || MK.hkey(nameOf(p) + p.code).includes(MK.hkey(st.q))));
    const tot = stats(sy, all);
    const a0 = 'التعليم الأولي: التأمين المدرسي فقط (اختياري)؛ الانخراط في التعاونية يخص التعليم الابتدائي فقط؛ التأمين والانخراط في الجمعية الرياضية يخصان الابتدائي والإعدادي والتأهيلي.';
    v.innerHTML = `<div class="page-h"><div><h2>الاشتراكات والتسجيل</h2><div class="muted">${window.Cyc && Cyc.isSec() ? 'التأمين المدرسي، والانخراط في الجمعية الرياضية المدرسية' : 'التأمين المدرسي، والانخراط في التعاونية المدرسية (للابتدائي)، والانخراط في الجمعية الرياضية المدرسية'}</div></div>
      <div class="btn-row"><select class="inp" id="dsY" style="width:auto">${years.map(y => `<option value="${y}" ${y === sy ? 'selected' : ''}>${esc(MK.syDash(y).replace('-', '/'))}</option>`).join('')}</select>
      <button class="btn pri" id="dsPrint">${ic('print')} لوائح للطباعة</button></div></div>
      <div class="card"><div class="card-h"><h3>المبالغ حسب السلك (بالدرهم)</h3></div><div class="card-b">
        <p class="muted" style="margin-top:0;font-size:12.8px">حدد مبلغ كل واجب لكل سلك مرة واحدة؛ يُسجَّل المبلغ تلقائيا عند تحديد التلميذ كمؤدٍّ ويمكن تغييره لكل تلميذ على حدة. ${window.Cyc && Cyc.isSec() ? 'التأمين المدرسي والانخراط في الجمعية الرياضية المدرسية.' : a0}</p>
        <table class="tbl"><thead><tr><th>السلك</th>${ITEMS.map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>
        ${stages.map(([k, n]) => `<tr><td class="b">${n}</td>${ITEMS.map(([it]) => hasItem(k, it) ? `<td><input class="inp ds-rate" type="number" min="0" step="0.5" data-s="${k}" data-i="${it}" value="${esc((Y(sy).rates[k] || {})[it] ?? '')}" style="width:100px" placeholder="0"></td>` : '<td class="muted">—</td>').join('')}</tr>`).join('')}
        </tbody></table></div></div>
      <div class="kpis" style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:12px 0">${ITEMS.map(([it, n]) => `<div class="card"><div class="card-b"><div class="muted" style="font-size:12.5px">${n}</div><div style="font-size:22px;font-weight:800">${tot[it].n} <span class="muted" style="font-size:13px">/ ${tot[it].tot}</span></div><div style="font-size:13px">المبلغ المحصل: <b>${money(tot[it].sum)}</b> د</div></div></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3>التلاميذ</h3></div><div class="card-b">
        <div class="btn-row" style="margin-bottom:8px;flex-wrap:wrap">
          <input class="inp" id="dsQ" placeholder="بحث بالاسم أو الرمز" value="${esc(st.q)}" style="width:200px">
          ${units.length > 1 ? `<select class="inp" id="dsU" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>` : ''}
          <select class="inp" id="dsC" style="width:auto"><option value="">كل الأقسام</option>${classes.map(u => `<option ${u === st.cls ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
          ${ITEMS.map(([it, n]) => { const ap = rows.filter(p => hasItem(STG_OF(p.lvl), it)), allOn = ap.length > 0 && ap.every(p => paid(sy, p, it)), anyOn = ap.some(p => paid(sy, p, it));
            return `<button class="btn sm ${allOn ? 'danger' : ''}" data-all="${it}" data-on="${allOn ? 1 : 0}" ${ap.length ? '' : 'disabled'} title="${allOn ? 'إلغاء تحديد كل التلاميذ المعروضين' : 'تحديد كل التلاميذ المعروضين'}">${esc(n)}: ${allOn ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>${anyOn && !allOn ? `<button class="btn sm" data-none="${it}" title="إلغاء تحديد المعروضين">إلغاء</button>` : ''}`; }).join('')}
        </div>
        <div class="btn-row" style="margin-bottom:8px;flex-wrap:wrap"><button class="btn sm" id="dsImp">${ic('up')} استيراد لائحة المنخرطين (Excel / xls)</button><button class="btn sm" id="dsNum">${ic('list')} ترقيم وصولات التأمين تباعا</button><button class="btn sm" id="dsExp">${ic('down')} تصدير Excel</button></div>
        ${all.length ? `<div style="max-height:60vh;overflow:auto"><table class="tbl"><thead><tr><th>ر.ت</th><th>الاسم والنسب</th><th>القسم</th>${ITEMS.map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>
        ${rows.slice(0, 600).map((p, i) => `<tr><td class="num">${i + 1}</td><td class="b">${esc(nameOf(p))}</td><td dir="ltr" style="text-align:right">${esc(p.cls || '')}</td>${ITEMS.map(([it]) => { const sg = STG_OF(p.lvl); if (!hasItem(sg, it)) return '<td class="muted">—</td>'; const r = paid(sy, p, it); return `<td><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="ds-ck" data-k="${esc(pkey(p))}" data-i="${it}" ${r ? 'checked' : ''}>${r ? `<input class="inp ds-amt" type="number" min="0" step="0.5" data-k="${esc(pkey(p))}" data-i="${it}" value="${esc(r.a)}" style="width:72px" title="المبلغ">${it === 'ins' ? `<input class="inp ds-no" data-k="${esc(pkey(p))}" data-i="${it}" value="${esc(r.n || '')}" placeholder="رقم الوصل" style="width:104px" dir="ltr">` : ''}` : ''}</label></td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div>${rows.length > 600 ? '<p class="muted">يُعرض أول 600 تلميذ؛ استعمل المرشحات.</p>' : ''}` : '<p class="muted">لا توجد لائحة تلاميذ لهذا الموسم. استورد لوائح التلاميذ من «بطاقة التلاميذ» أولا.</p>'}
      </div></div>`;
    const re = () => window.pageDues(v);
    $('#dsY', v).onchange = e => { st.sy = e.target.value; st.unit = st.cls = ''; re(); };
    $('#dsPrint', v).onclick = () => go('duesDoc');
    $$('.ds-rate', v).forEach(el => el.onchange = () => { const y = Y(sy); (y.rates[el.dataset.s] = y.rates[el.dataset.s] || {})[el.dataset.i] = el.value; persist(); re(); });
    const q = $('#dsQ', v); q.onchange = () => { st.q = q.value; re(); };
    if ($('#dsU', v)) $('#dsU', v).onchange = e => { st.unit = e.target.value; st.cls = ''; re(); };
    $('#dsC', v).onchange = e => { st.cls = e.target.value; re(); };
    const byKey = k => all.find(p => pkey(p) === k);
    $$('.ds-ck', v).forEach(el => el.onchange = () => { const p = byKey(el.dataset.k); if (!p) return; setPaid(sy, p, el.dataset.i, el.checked); persist(); re(); });
    $$('.ds-amt', v).forEach(el => el.onchange = () => { const p = byKey(el.dataset.k); if (!p) return; setPaid(sy, p, el.dataset.i, true, +el.value || 0); persist(); re(); });
    $$('.ds-no', v).forEach(el => el.onchange = () => { const p = byKey(el.dataset.k); if (!p) return; const r = paid(sy, p, el.dataset.i); if (!r) return; const n = el.value.trim(); if (n) r.n = n; else delete r.n; persist(); });
    // «تحديد الكل» is a switch: when every displayed pupil is already ticked it becomes «إلغاء تحديد الكل»
    $$('[data-all]', v).forEach(b => b.onclick = async () => {
      const it = b.dataset.all, ap = rows.filter(p => hasItem(STG_OF(p.lvl), it));
      if (b.dataset.on === '1') { if (!await confirmBox(`إلغاء <b>${esc((ITEMS.find(x => x[0] === it) || [])[1])}</b> لـ <b>${ap.length}</b> تلميذ(ة) معروضين؟ ستحذف مبالغهم وأرقام وصولاتهم.`, 'إلغاء التحديد')) return; ap.forEach(p => setPaid(sy, p, it, false)); }
      else ap.forEach(p => { if (!paid(sy, p, it)) setPaid(sy, p, it, true); });
      persist(); re();
    });
    $$('[data-none]', v).forEach(b => b.onclick = () => { const it = b.dataset.none; rows.forEach(p => { if (paid(sy, p, it)) setPaid(sy, p, it, false); }); persist(); re(); });
    $('#dsImp', v).onclick = () => importList(sy, re);
    $('#dsNum', v).onclick = () => numberReceipts(sy, all, re);
    $('#dsExp', v).onclick = () => exportList(sy, rows);
  };

  /* ---------- import of the list of members (Excel or old .xls) + insurance receipt numbers ---------- */
  const CODE = /^[A-Za-z]\d{8,10}$/;
  const itemOfTitle = t => /التأمين|تأمين/.test(t) ? 'ins' : /التعاونية|تعاونية/.test(t) ? 'coop' : /الرياضية|رياضي/.test(t) ? 'sport' : '';
  function parseList(sheets) {
    const out = []; let title = '';
    sheets.forEach(sh => {
      const rows = sh.rows || [];
      rows.slice(0, 25).forEach(r => (r || []).forEach(c => { const t = String(c == null ? '' : c); if (!title && /منخرط|التأمين|التعاونية|الجمعية|الانخراط|اشتراك/.test(t)) title = t.trim(); }));
      rows.forEach(r => {
        const cells = (r || []).map(x => String(x == null ? '' : x).trim());
        const ci = cells.findIndex(x => CODE.test(x));
        if (ci < 0) return;
        const no = cells.find((x, i) => i !== ci && /^\d{5,}$/.test(x)) || '';      // the receipt number (the serial «ر.ت» is short)
        const unit = cells.find(x => x && !/^[\d.,\s]+$/.test(x) && !CODE.test(x) && !/^(ذكر|أنثى|انثى)$/.test(x)) || '';
        out.push({ code: cells[ci].toUpperCase(), no, unit });
      });
    });
    return { rows: out, title };
  }
  async function importList(sy, re) {
    const files = await MK.openFiles(); if (!files) return;       // 1.9.3 — several files at once: each file is a list of one due
    const all = pupils(sy), byCode = new Map(all.map(p => [String(p.code || '').toUpperCase(), p]));
    const parts = [], empty = [];
    files.forEach(f => {
      const L = parseList(f.sheets);
      if (!L.rows.length) { empty.push(f.name); return; }
      const hit = L.rows.filter(r => byCode.has(r.code)), miss = L.rows.filter(r => !byCode.has(r.code));
      parts.push({ f, L, hit, miss, nNo: hit.filter(r => r.no).length, guess: itemOfTitle(L.title) || 'ins' });
    });
    if (!parts.length) return toast(files.length > 1 ? 'لم يتم العثور على رموز مسار (مثل R231040958) في أي من الملفات المختارة' : 'لم يتم العثور على رموز مسار (مثل R231040958) في الملف', true);
    if (empty.length) toast('ملفات بدون رموز مسار تم تجاهلها: ' + empty.join('، '), true);
    const many = parts.length > 1, sfx = i => (i ? String(i) : '');
    const body = document.createElement('div');
    body.innerHTML = parts.map((x, i) => `<div class="di-part" data-p="${i}" ${many ? 'style="border:1px solid var(--line,#d8dfd9);border-radius:10px;padding:10px 12px;margin:0 0 10px"' : ''}>
      ${many ? `<div style="font-weight:700;margin:0 0 6px">${i + 1}/${parts.length} — <bdi>${esc(x.f.name)}</bdi></div>` : ''}
      <p style="margin:0 0 8px;line-height:1.9">عدد التلاميذ في الملف: <b>${x.L.rows.length}</b> — الموجودون في بطاقة التلاميذ: <b>${x.hit.length}</b>${x.miss.length ? ` — غير الموجودين: <b class="att-hot">${x.miss.length}</b>` : ''}.${x.L.title ? `<br><span class="muted">عنوان الملف: ${esc(x.L.title)}</span>` : ''}</p>
      <div class="fld"><label>الواجب الذي يخصه الملف</label><select class="inp" id="diIt${sfx(i)}">${ITEMS.map(([k, n]) => `<option value="${k}" ${k === x.guess ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
      <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" id="diNo${sfx(i)}" ${x.nNo ? 'checked' : ''} ${x.nNo ? '' : 'disabled'}><span>تسجيل أرقام الوصولات (${x.nNo} رقم في الملف)</span></label>
      <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" id="diRep${sfx(i)}"><span>إلغاء الأداء عن التلاميذ غير الواردين في الملف (استبدال اللائحة الحالية)</span></label>
      ${x.miss.length ? `<p class="muted" style="font-size:12px;line-height:1.7;margin:6px 0 0">رموز غير موجودة في بطاقة التلاميذ: ${esc(x.miss.slice(0, 8).map(r => r.code).join('، '))}${x.miss.length > 8 ? '…' : ''}. استورد لوائح التلاميذ أولا إن كانت ناقصة.</p>` : ''}</div>`).join('');
    modal({ title: many ? `استيراد ${parts.length} لوائح للمنخرطين` : 'استيراد لائحة المنخرطين', size: many ? '' : 'sm', body, actions: [{ label: 'استيراد', cls: 'pri', onClick: () => {
      const msgs = [];
      parts.forEach((x, i) => {
        const it = $('#diIt' + sfx(i), body).value, withNo = $('#diNo' + sfx(i), body).checked, rep = $('#diRep' + sfx(i), body).checked;
        const inFile = new Set(x.hit.map(r => r.code));
        let n = 0, skipped = 0;
        if (rep) all.forEach(p => { if (hasItem(STG_OF(p.lvl), it) && paid(sy, p, it) && !inFile.has(String(p.code || '').toUpperCase())) setPaid(sy, p, it, false); });
        x.hit.forEach(r => { const p = byCode.get(r.code); if (!hasItem(STG_OF(p.lvl), it)) { skipped++; return; } setPaid(sy, p, it, true, null, withNo && r.no ? r.no : null); n++; });
        msgs.push(`تم تسجيل ${n} تلميذ(ة) في «${(ITEMS.find(y => y[0] === it) || [])[1]}»${skipped ? ` — ${skipped} لا يخصهم هذا الواجب` : ''}${x.miss.length ? ` — ${x.miss.length} غير موجودين في بطاقة التلاميذ` : ''}`);
      });
      persist(); re();
      toast(many ? `${parts.length} لوائح: ${msgs.join(' | ')}` : msgs[0]);
    } }, { label: 'إلغاء' }] });
  }
  // consecutive receipt numbers for the insured pupils (in the order of the list: class, then name)
  function numberReceipts(sy, all, re) {
    const ins = all.filter(p => hasItem(STG_OF(p.lvl), 'ins') && paid(sy, p, 'ins'));
    if (!ins.length) return toast('حدد التلاميذ المؤمَّنين أولا', true);
    const used = ins.map(p => paid(sy, p, 'ins').n).filter(n => /^\d+$/.test(String(n || '')));
    const next = used.length ? String(Math.max(...used.map(Number)) + 1) : '';
    const body = document.createElement('div');
    body.innerHTML = `<p style="margin:0 0 8px;line-height:1.9">سيتم ترقيم وصولات <b>${ins.length}</b> تلميذ(ة) مؤمَّن(ة) ترقيما متتابعا حسب ترتيب اللائحة (القسم ثم الاسم).</p>
      <div class="fld"><label>رقم الوصل الأول</label><input class="inp" id="dnS" dir="ltr" value="${esc(next)}" placeholder="5094442"></div>
      <label style="display:flex;gap:8px;margin:8px 0"><input type="checkbox" id="dnAll"><span>إعادة ترقيم الجميع (وإلا يُرقَّم من لا رقم له فقط، مع تجاوز الأرقام المستعملة)</span></label>`;
    modal({ title: 'ترقيم وصولات التأمين', size: 'sm', body, actions: [{ label: 'ترقيم', cls: 'pri', onClick: () => {
      const s0 = $('#dnS', body).value.trim(); if (!/^\d+$/.test(s0)) { toast('أدخل رقما صحيحا للوصل الأول', true); return false; }
      const all2 = $('#dnAll', body).checked, w = s0.length;
      const taken = new Set(all2 ? [] : used.map(String));
      let cur = +s0, n = 0;
      ins.forEach(p => {
        const r = paid(sy, p, 'ins'); if (!all2 && r.n) return;
        while (taken.has(String(cur).padStart(w, '0'))) cur++;
        r.n = String(cur).padStart(w, '0'); taken.add(r.n); cur++; n++;
      });
      persist(); re(); toast(`تم ترقيم ${n} وصل(ا) تباعا`);
    } }, { label: 'إلغاء' }] });
  }
  async function exportList(sy, rows) {
    const rowsX = [['ر.ت', 'الوحدة المدرسية', 'القسم', 'رمز مسار', 'النسب', 'الاسم'].concat(ITEMS.map(([, n]) => n + ' (المبلغ)'), ['رقم وصل التأمين'])];
    rows.forEach((p, i) => rowsX.push([i + 1, p.unit || '', p.cls || '', p.code || '', p.last || '', p.first || ''].concat(ITEMS.map(([it]) => { if (!hasItem(STG_OF(p.lvl), it)) return ''; const r = paid(sy, p, it); return r ? +r.a || 0 : ''; }), [(paid(sy, p, 'ins') || {}).n || ''])));
    const r = await window.api.saveXlsx(rowsX, `الاشتراكات_${MK.syDash(sy)}.xlsx`, 'الاشتراكات');
    if (r && r.ok) toast('تم التصدير إلى Excel');
  }

  /* ---------- printable lists ---------- */
  const KINDS = [['list', 'لائحة المنخرطين / المؤدين'], ['miss', 'لائحة غير المؤدين'], ['sum', 'حصيلة حسب الأقسام']];
  function build(s, f) {
    const sy = f.sy, all = pupils(sy).filter(p => (!f.unit || p.unit === f.unit) && (!f.cls || p.cls === f.cls) && (!f.stage || STG_OF(p.lvl) === f.stage));
    const it = f.item, name = (ITEMS.find(x => x[0] === it) || ITEMS[0])[1];
    const sub = `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${f.unit ? ' — ' + esc(f.unit) : ''}${f.cls ? ' — القسم ' + esc(f.cls) : ''}`;
    const mem = all.filter(p => hasItem(STG_OF(p.lvl), it));
    if (f.kind === 'sum') {
      const groups = new Map();
      mem.forEach(p => { const k = p.cls || '—'; (groups.get(k) || groups.set(k, []).get(k)).push(p); });
      const rows = [], T = { n: 0, a: 0, m: 0 };
      Array.from(groups.keys()).sort((a, b) => a.localeCompare(b, 'fr', { numeric: true })).forEach((k, i) => {
        const g = groups.get(k), pd = g.filter(p => paid(sy, p, it)), sum = pd.reduce((x, p) => x + (+paid(sy, p, it).a || 0), 0);
        T.n += g.length; T.a += pd.length; T.m += sum;
        rows.push(tr([i + 1, { t: k, c: 'b' }, g.length, pd.length, g.length - pd.length, { t: money(sum), c: 'nw' }]));
      });
      rows.push(tr([{ t: 'المجموع', c: 'd', span: 2 }, T.n, T.a, T.n - T.a, money(T.m)]));
      return SB.pages(s, { title: `حصيلة ${name}`, sub, page: 'a4', blocks: [SB.tbl(thr(['ر.ت', 'القسم', 'عدد التلاميذ', 'المؤدون', 'غير المؤدين', 'المبلغ (درهم)'].map(t => ({ t, c: 'd' }))), rows, 'big')] });
    }
    const pick = mem.filter(p => !!paid(sy, p, it) === (f.kind === 'list'));
    const withNo = f.kind === 'list' && it === 'ins' && pick.some(p => (paid(sy, p, it) || {}).n);
    const head = thr(['ر.ت', 'رمز مسار', 'الاسم والنسب', 'القسم'].concat(f.kind === 'list' ? (withNo ? ['رقم الوصل'] : []).concat(['المبلغ', 'تاريخ الأداء']) : ['ملاحظات']).map(t => ({ t, c: 'd' })));
    const rows = pick.map((p, i) => { const r = paid(sy, p, it); return tr([i + 1, { t: p.code || '', c: 'ltr sm' }, { t: nameOf(p), c: 'b r' }, { t: p.cls || '', c: 'ltr' }].concat(f.kind === 'list' ? (withNo ? [{ t: r.n || '', c: 'ltr' }] : []).concat([{ t: money(r.a), c: 'nw' }, r.d ? fmtDate(r.d) : '']) : [''])); });
    const total = f.kind === 'list' ? pick.reduce((x, p) => x + (+paid(sy, p, it).a || 0), 0) : 0;
    const title = f.kind === 'list' ? `لائحة ${it === 'coop' ? 'المنخرطين في التعاونية المدرسية' : it === 'sport' ? 'المنخرطين في الجمعية الرياضية المدرسية' : 'التلاميذ المؤمَّنين'}` : `لائحة التلاميذ غير المؤدين: ${name}`;
    const note = `<p class="sb-p">العدد: <b>${pick.length}</b>${f.kind === 'list' ? ` — مجموع المبالغ: <b>${money(total)}</b> درهم` : ''}</p>`;
    return SB.pages(s, { title, sub, page: 'a4', blocks: [note, SB.tbl(head, rows.length ? rows : [tr(['', '', '', '', '', ''].slice(0, 5))], 'big')] });
  }

  window.pageDuesDoc = function (v) {
    migrate(DB);
    const sy0 = st.sy || MK.curSy();
    MK.docPage(v, {
      title: 'لوائح الاشتراكات والتسجيل', icon: '🧾', modes: false, word: true, state: { sy: sy0, item: 'ins', kind: 'list', unit: '', cls: '', stage: '' },
      back: () => go('dues'),
      form: (box, s0, refresh) => {
        const all = pupils(s0.sy), units = Array.from(new Set(all.map(p => p.unit).filter(Boolean))), classes = Array.from(new Set(all.map(p => p.cls).filter(Boolean)));
        const sel = (id, l, opts, cur) => `<div class="fld"><label>${l}</label><select class="inp" id="${id}">${opts.map(([v2, t]) => `<option value="${esc(v2)}" ${v2 === cur ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
        box.innerHTML = sel('dd1', 'الواجب', ITEMS, s0.item) + sel('dd2', 'الوثيقة', KINDS, s0.kind) + sel('dd3', 'السلك', [['', 'كل الأسلاك']].concat(STAGES), s0.stage)
          + (units.length > 1 ? sel('dd4', 'الوحدة المدرسية', [['', 'كل الوحدات']].concat(units.map(u => [u, u])), s0.unit) : '') + sel('dd5', 'القسم', [['', 'كل الأقسام']].concat(classes.map(c => [c, c])), s0.cls);
        [['dd1', 'item'], ['dd2', 'kind'], ['dd3', 'stage'], ['dd4', 'unit'], ['dd5', 'cls']].forEach(([id, k]) => { const el = $('#' + id, box); if (el) el.onchange = e => { s0[k] = e.target.value; refresh(); }; });
      },
      build: s0 => ({ page: 'a4', pages: build(S(), s0) }),
      fname: s0 => 'لائحة_' + (ITEMS.find(x => x[0] === s0.item) || ITEMS[0])[1].replace(/\s+/g, '_')
    });
  };
  window.Dues = { migrate, rate, paid, setPaid, stats, STG_OF };
})();
