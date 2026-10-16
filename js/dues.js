'use strict';
/* 1.9.2 — الاشتراكات والتسجيل: التأمين المدرسي (مبلغ حسب كل سلك، ويشمل الأولي اختياريا)، الانخراط في التعاونية المدرسية (التعليم الابتدائي فقط)، الانخراط في الجمعية الرياضية المدرسية (الابتدائي والإعدادي والتأهيلي).
   «واجب التسجيل» حُذف من الواجهة؛ ما سُجّل سابقا في المعطيات (pay.reg / rates.reg) يبقى محفوظا دون عرض.
   Per pupil payments are kept by year; printable lists of members / non-members per class, level or unit, and a summary by class. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const { SB, tr, thr } = window.K;

  const STAGES = [['pre', 'التعليم الأولي'], ['pri', 'التعليم الابتدائي'], ['col', 'التعليم الثانوي الإعدادي'], ['lyc', 'التعليم الثانوي التأهيلي']];
  // 1.9.4: the contributions of Massar «تهيئة مبالغ المساهمات» (in its order): the school cooperatives, the school sports association, the school insurance, the registration
  const BASE_ITEMS = [['coop', 'الانخراط في التعاونية المدرسية'], ['sport', 'الانخراط في الجمعية الرياضية المدرسية'], ['ins', 'التأمين المدرسي'], ['reg', 'التسجيل']];
  // the share of each institution in what is collected (Massar «مسك التحويلات»)
  const DEF_ALLOC = { ins: [['شركة التأمين', 100]], sport: [['الجمعية الرياضية المدرسية للمؤسسة', 65], ['الفرع الإقليمي بالمديرية الإقليمية', 10], ['الفرع الجهوي بالأكاديمية', 5], ['الجامعة الملكية المغربية للرياضة المدرسية', 20]],
    coop: [['جمعية تنمية التعاون المدرسي (التعاونية المدرسية)', 100]], reg: [['المؤسسة', 100]] };
  // 1.9.4: other contributions can be added (as in Massar «تهيئة مبالغ المساهمات»), each for the cycles chosen
  const custom = () => { try { migrate(DB); return DB.dues.custom; } catch (e) { return []; } };
  const ITEMS_ = () => BASE_ITEMS.concat(custom().map(c => [c.k, c.n]));
  const STG_OF = lvl => { const k = String(lvl || ''); return /^(DEPE|PS)/.test(k) ? 'pre' : /^P\d/.test(k) ? 'pri' : /^C\d/.test(k) ? 'col' : k ? 'lyc' : 'pri'; };
  const hasItem = (stage, it) => { const c = custom().find(x => x.k === it); if (c) return !c.stages || !c.stages.length || c.stages.includes(stage); return it === 'coop' ? stage === 'pri' : it === 'sport' ? stage !== 'pre' : it === 'reg' ? stage !== 'pre' : true; };
  const cycleStage = () => { const c = (S().cycle || ''); return /إعدادي/.test(c) ? 'col' : /تأهيلي/.test(c) ? 'lyc' : 'pri'; };

  function migrate(db) {
    const d = db.dues = db.dues || {};
    d.years = d.years && typeof d.years === 'object' ? d.years : {};
    d.custom = Array.isArray(d.custom) ? d.custom : [];
  }
  const Y = sy => { migrate(DB); const y = DB.dues.years[sy] || (DB.dues.years[sy] = {}); y.rates = y.rates || {}; y.pay = y.pay || {}; y.lrates = y.lrates || {}; y.vir = Array.isArray(y.vir) ? y.vir : []; y.benef = y.benef || {}; y.alloc = y.alloc || {}; return y; };
  // the beneficiaries of a contribution: [{ who, pct, rib, d (date of the transfer), a (amount transferred), ref }]
  const allocOf = (sy, it) => { const y = Y(sy); if (!Array.isArray(y.alloc[it]) || !y.alloc[it].length) y.alloc[it] = (DEF_ALLOC[it] || [[(y.benef[it] || {}).who || 'الجهة المستفيدة', 100]]).map(([who, pct]) => ({ who, pct: String(pct), rib: '', d: '', a: '', ref: '' })); return y.alloc[it]; };
  const sentOf = (sy, it) => allocOf(sy, it).reduce((t, l) => t + (+l.a || 0), 0) + Y(sy).vir.filter(x => x.it === it).reduce((t, x) => t + (+x.a || 0), 0);
  const rate = (sy, stage, it) => { const r = (Y(sy).rates[stage] || {})[it]; return r === undefined || r === '' ? 0 : (+r || 0); };
  // the amount of a level (Massar: one amount per level and contribution), else the amount of its cycle
  const rateL = (sy, lvl, it) => { const r = (Y(sy).lrates[lvl] || {})[it]; return r === undefined || r === '' ? rate(sy, STG_OF(lvl), it) : (+r || 0); };
  const pkey = p => p.code || p.mid || `${p.last || ''}|${p.first || ''}|${p.birth || ''}`;
  const paid = (sy, p, it) => (Y(sy).pay[pkey(p)] || {})[it] || null;   // { a: amount, d: date } | null

  const pupils = sy => (window.Pupils ? Pupils.current(sy) : []).slice().sort((a, b) => String(a.cls || '').localeCompare(String(b.cls || ''), 'fr', { numeric: true }) || `${a.last} ${a.first}`.localeCompare(`${b.last} ${b.first}`, 'ar'));
  const nameOf = p => `${p.last || ''} ${p.first || ''}`.trim();
  const money = n => (Math.round((+n || 0) * 100) / 100).toLocaleString('en-US').replace(/,/g, '\u00A0');

  function setPaid(sy, p, it, on, amount, no) {
    const o = Y(sy).pay, k = pkey(p), rec = o[k] || (o[k] = {});
    if (on) {
      const old = rec[it] || {};
      rec[it] = { a: amount != null ? amount : (old.a != null ? old.a : rateL(sy, p.lvl, it)), d: old.d || todayIso() };
      const n = no != null ? no : old.n; if (n) rec[it].n = String(n);   // receipt number (رقم وصل التأمين)
    } else delete rec[it];
    if (!Object.keys(rec).length) delete o[k];
  }

  /* ---------- totals ---------- */
  function stats(sy, arr) {
    const out = {};
    ITEMS_().forEach(([it]) => {
      let n = 0, sum = 0, tot = 0;
      arr.forEach(p => { if (!hasItem(STG_OF(p.lvl), it)) return; tot++; const r = paid(sy, p, it); if (r) { n++; sum += +r.a || 0; } });
      out[it] = { n, sum, tot };
    });
    return out;
  }

  /* ---------- the page ---------- */
  const st = { sy: '', unit: '', cls: '', q: '', only: '' };
  // 1.9.4: the four steps of Massar «رسوم التسجيل / المساهمات»: setting of the amounts, entry of the contributions, entry of the transfers, outputs
  const TABS = [['param', 'تهيئة مبالغ المساهمات'], ['pay', 'مسك المساهمات'], ['vir', 'مسك التحويلات'], ['out', 'المخرجات']];
  window.pageDues = function (v, arg) {
    migrate(DB);
    if (arg && arg.tab) st.tab = arg.tab;
    const tab = st.tab || (st.tab = 'pay');
    const sy = st.sy || (st.sy = MK.curSy());
    const years = Array.from(new Set([MK.curSy()].concat(Object.keys((DB.pupils || {}).years || {}), Object.keys(DB.dues.years)))).sort().reverse();
    v.innerHTML = `<div class="page-h"><div><h2>الاشتراكات والتسجيل (المساهمات)</h2><div class="muted">${esc(ITEMS_().map(x => x[1]).join('، '))}</div></div>
      <div class="btn-row"><select class="inp" id="dsY" style="width:auto">${years.map(y => `<option value="${y}" ${y === sy ? 'selected' : ''}>${esc(MK.syDash(y).replace('-', '/'))}</option>`).join('')}</select>
      <button class="btn pri" id="dsPrint">${ic('print')} المخرجات للطباعة</button></div></div>
      <div class="mk-tabs"><div class="seg" id="dsTabs">${TABS.map(([k, l], i) => `<button data-t="${k}" class="${tab === k ? 'on' : ''}"><b class="ds-n">${i + 1}</b> ${l}</button>`).join('')}</div></div>
      <div id="dsBody"></div>`;
    $('#dsY', v).onchange = e => { st.sy = e.target.value; st.unit = st.cls = ''; window.pageDues(v); };
    $('#dsPrint', v).onclick = () => go('duesDoc');
    $$('#dsTabs button', v).forEach(b => b.onclick = () => { st.tab = b.dataset.t; go('dues', { tab: b.dataset.t }); });
    const b = $('#dsBody', v);
    ({ param: paramTab, pay: payTab, vir: virTab, out: outTab })[tab](v, b, sy, years);
  };
  const LVS = sy => { const P = pupils(sy); const L = K.LV.sort(Array.from(new Set(P.map(p => p.lvl).filter(Boolean)))); return L.length ? L : (window.Cyc ? Cyc.levels() : []); };
  const itemName = it => (ITEMS_().find(x => x[0] === it) || [])[1] || it;
  /* ---------- 1. setting of the amounts ---------- */
  function paramTab(v, b, sy) {
    const all = pupils(sy), stages = STAGES.filter(([k]) => all.some(p => STG_OF(p.lvl) === k) || k === cycleStage()), y = Y(sy), L = LVS(sy);
    const a0 = 'التعليم الأولي: التأمين المدرسي فقط (اختياري)؛ الانخراط في التعاونية يخص التعليم الابتدائي فقط؛ التأمين والانخراط في الجمعية الرياضية يخصان الابتدائي والإعدادي والتأهيلي.';
    b.innerHTML = `<div class="card"><div class="card-h"><h3>المبالغ حسب السلك (بالدرهم)</h3></div><div class="card-b">
        <p class="muted" style="margin-top:0;font-size:12.8px">حدد مبلغ كل مساهمة لكل سلك؛ يمكن تحديد مبلغ خاص بكل مستوى في الجدول الموالي (كما في منظومة مسار). ${window.Cyc && Cyc.isSec() ? '' : a0}</p>
        <table class="tbl"><thead><tr><th>السلك</th>${ITEMS_().map(([, n]) => `<th>${esc(n)}</th>`).join('')}</tr></thead><tbody>
        ${stages.map(([k, n]) => `<tr><td class="b">${n}</td>${ITEMS_().map(([it]) => hasItem(k, it) ? `<td><input class="inp ds-rate" type="number" min="0" step="0.5" data-s="${k}" data-i="${it}" value="${esc((y.rates[k] || {})[it] ?? '')}" style="width:100px" placeholder="0"></td>` : '<td class="muted">—</td>').join('')}</tr>`).join('')}
        </tbody></table></div></div>
      <div class="card" style="margin-top:12px"><div class="card-h"><h3>المبالغ حسب المستوى (اختياري)</h3></div><div class="card-b">
        <p class="muted" style="margin-top:0;font-size:12.8px">خانة فارغة = مبلغ السلك. يُطبَّق المبلغ على التلاميذ الذين يُحدَّدون كمؤدين بعد ذلك، ويمكن تحيين المبالغ المسجلة بالزر أسفله.</p>
        <table class="tbl"><thead><tr><th>المستوى</th>${ITEMS_().map(([, n]) => `<th>${esc(n)}</th>`).join('')}<th>عدد التلاميذ</th></tr></thead><tbody>
        ${L.map(l => `<tr><td class="b">${esc(K.LV.ar(l))}</td>${ITEMS_().map(([it]) => hasItem(STG_OF(l), it) ? `<td><input class="inp ds-lrate" type="number" min="0" step="0.5" data-l="${l}" data-i="${it}" value="${esc((y.lrates[l] || {})[it] ?? '')}" style="width:90px" placeholder="${esc(rate(sy, STG_OF(l), it))}"></td>` : '<td class="muted">—</td>').join('')}<td class="num">${all.filter(p => p.lvl === l).length}</td></tr>`).join('')}
        </tbody></table><div class="btn-row" style="margin-top:8px"><button class="btn sm" id="dsApply">${ic('hist')} تطبيق المبالغ على المساهمات المسجلة</button></div></div></div>
      <div class="card" style="margin-top:12px"><div class="card-h"><h3>المساهمات والجهات المستفيدة (للتحويلات)</h3></div><div class="card-b">
        <table class="tbl"><thead><tr><th>المساهمة</th><th>الأسلاك المعنية</th><th>الجهة المستفيدة</th><th>رقم الحساب (RIB)</th><th>البنك</th><th></th></tr></thead><tbody>
        ${ITEMS_().map(([it, n]) => { const c = custom().find(x => x.k === it), bf = y.benef[it] || {}; return `<tr><td class="b">${esc(n)}</td><td class="sm">${c ? STAGES.map(([k, sn]) => `<label style="white-space:nowrap;margin-inline-end:6px"><input type="checkbox" class="ds-cst" data-i="${it}" data-s="${k}" ${!c.stages || !c.stages.length || c.stages.includes(k) ? 'checked' : ''}> ${sn}</label>`).join(' ') : esc(it === 'coop' ? 'التعليم الابتدائي' : it === 'sport' ? 'الابتدائي والإعدادي والتأهيلي' : 'كل الأسلاك')}</td>
          <td><input class="inp ds-bf" data-i="${it}" data-f="who" value="${esc(bf.who || '')}" placeholder="${esc(it === 'ins' ? 'شركة التأمين / المديرية الإقليمية' : it === 'sport' ? 'الجمعية الرياضية المدرسية' : it === 'coop' ? 'جمعية تنمية التعاون المدرسي' : '')}"></td>
          <td><input class="inp ds-bf" data-i="${it}" data-f="rib" value="${esc(bf.rib || '')}" dir="ltr" style="width:200px"></td><td><input class="inp ds-bf" data-i="${it}" data-f="bank" value="${esc(bf.bank || '')}" style="width:120px"></td>
          <td>${c ? `<button class="btn sm danger icon" data-cdel="${it}" title="حذف المساهمة">✕</button>` : ''}</td></tr>`; }).join('')}
        </tbody></table>
        <div class="btn-row" style="margin-top:8px"><b>مساهمات أخرى:</b><input class="inp" id="dsNewC" placeholder="المساهمة (مثال: الأنشطة الموازية)" style="max-width:260px"><input class="inp" id="dsNewA" type="number" min="0" step="0.5" placeholder="المبلغ بالدرهم" style="max-width:130px"><button class="btn sm" id="dsAddC">${ic('plus')} إضافة</button></div></div></div>`;
    const re = () => window.pageDues(v);
    $$('.ds-rate', b).forEach(el => el.onchange = () => { (y.rates[el.dataset.s] = y.rates[el.dataset.s] || {})[el.dataset.i] = el.value; persist(); re(); });
    $$('.ds-lrate', b).forEach(el => el.onchange = () => { const o = y.lrates[el.dataset.l] = y.lrates[el.dataset.l] || {}; if (el.value === '') delete o[el.dataset.i]; else o[el.dataset.i] = el.value; persist(); });
    $$('.ds-bf', b).forEach(el => el.onchange = () => { (y.benef[el.dataset.i] = y.benef[el.dataset.i] || {})[el.dataset.f] = el.value.trim(); persist(); });
    $$('.ds-cst', b).forEach(el => el.onchange = () => { const c = custom().find(x => x.k === el.dataset.i); if (!c) return; const S0 = new Set(c.stages && c.stages.length ? c.stages : STAGES.map(x => x[0])); if (el.checked) S0.add(el.dataset.s); else S0.delete(el.dataset.s); c.stages = Array.from(S0); persist(); });
    $$('[data-cdel]', b).forEach(el => el.onclick = async () => { if (!(await confirmBox(`حذف المساهمة «${esc(itemName(el.dataset.cdel))}» ومبالغها؟`, 'حذف'))) return; DB.dues.custom = custom().filter(x => x.k !== el.dataset.cdel); persist(); re(); });
    $('#dsAddC', b).onclick = () => { const n = $('#dsNewC', b).value.trim(), am = $('#dsNewA', b).value.trim(); if (!n) return; const k = uid('dc'); custom().push({ k, n, stages: [] }); if (am) stages.forEach(([sg]) => { (y.rates[sg] = y.rates[sg] || {})[k] = am; }); persist(); re(); };
    $('#dsApply', b).onclick = async () => {
      const P = pupils(sy); let n = 0;
      P.forEach(p => ITEMS_().forEach(([it]) => { const r = paid(sy, p, it); if (r) { const a = rateL(sy, p.lvl, it); if (+r.a !== a) { r.a = a; n++; } } }));
      persist(); toast(n ? `تم تحيين ${n} مبلغا مسجلا` : 'المبالغ المسجلة مطابقة');
    };
  }
  /* ---------- 3. transfers (Massar «مسك التحويلات»): for each income, the collected amount shared between the institutions (percentages), then the transfer of each share ---------- */
  function virTab(v, b, sy) {
    const P = pupils(sy), T = stats(sy, P);
    const card = ([it, n]) => {
      const c = T[it] || { sum: 0, n: 0 }, L = allocOf(sy, it), pct = L.reduce((t, l) => t + (+l.pct || 0), 0), sent = sentOf(sy, it);
      return `<div class="card ds-vc" data-it="${it}"><div class="card-h"><h3>المداخيل: ${esc(n)}</h3><span style="flex:1"></span><span class="tag2">المبلغ المستخلص: <b>${money(c.sum)}</b> د (${c.n} تلميذ(ة))</span></div><div class="card-b">
        <table class="tbl compact"><thead><tr><th>المؤسسة</th><th style="width:70px">النسبة %</th><th>المبلغ المخصص (د)</th><th>تاريخ التحويل</th><th>مبلغ التحويل (د)</th><th>حساب التحويل (RIB)</th><th>المرجع</th><th></th></tr></thead><tbody>
        ${L.map((l, i) => { const al = Math.round(c.sum * (+l.pct || 0)) / 100, done = +l.a > 0, ok = done && Math.abs(+l.a - al) < 0.01;
          return `<tr><td><input class="inp ds-al" data-i="${i}" data-f="who" value="${esc(l.who)}"></td><td><input class="inp ds-al" data-i="${i}" data-f="pct" type="number" min="0" max="100" step="0.5" value="${esc(l.pct)}" style="width:78px"></td>
            <td class="num b">${money(al)}</td><td><input class="inp ds-al" data-i="${i}" data-f="d" type="date" value="${esc(l.d || '')}"></td>
            <td><input class="inp ds-al" data-i="${i}" data-f="a" type="number" min="0" step="0.01" value="${esc(l.a || '')}" placeholder="${al || ''}" style="width:110px;${done ? (ok ? 'border-color:#1f7a45' : 'border-color:#c0392b') : ''}"></td>
            <td><input class="inp ds-al" data-i="${i}" data-f="rib" dir="ltr" value="${esc(l.rib || '')}" style="width:210px"></td><td><input class="inp ds-al" data-i="${i}" data-f="ref" dir="ltr" value="${esc(l.ref || '')}" style="width:110px" placeholder="رقم التحويل"></td>
            <td><button class="btn sm" data-full="${i}" title="تحويل المبلغ المخصص كاملا اليوم">✓</button>${L.length > 1 ? `<button class="btn sm danger icon" data-adel="${i}">✕</button>` : ''}</td></tr>`; }).join('')}
        <tr class="tot"><td><b>المجموع</b></td><td class="num ${Math.abs(pct - 100) > 0.01 ? 'att-hot' : ''}"><b>${pct}%</b></td><td class="num b">${money(c.sum * pct / 100)}</td><td></td><td class="num b">${money(sent)}</td><td colspan="3" class="${c.sum - sent > 0.004 ? 'att-hot' : ''}">الباقي غير المحول: <b>${money(c.sum - sent)}</b> د</td></tr></tbody></table>
        <div class="btn-row" style="margin-top:6px"><button class="btn sm" data-aadd="1">${ic('plus')} إضافة مؤسسة مستفيدة</button><button class="btn sm" data-areset="1">${ic('hist')} النسب المعتمدة</button>${Math.abs(pct - 100) > 0.01 ? '<span class="att-hot" style="font-size:12.5px">مجموع النسب يجب أن يساوي 100%</span>' : ''}</div></div></div>`;
    };
    b.innerHTML = `<p class="muted" style="margin:0 0 10px;line-height:1.8">لكل مدخول: المبلغ المستخلص من «مسك المساهمات»، يوزع على المؤسسات المستفيدة حسب النسب (التأمين المدرسي: شركة التأمين 100%؛ الجمعية الرياضية المدرسية: جمعية المؤسسة 65%، الفرع الإقليمي 10%، الفرع الجهوي 5%، الجامعة الملكية المغربية للرياضة المدرسية 20%)، ثم يُسجل تاريخ ومبلغ وحساب تحويل كل حصة.</p>
      ${ITEMS_().map(card).join('')}`;
    const re = () => { const y0 = b.closest('.page') ? 0 : window.scrollY; window.pageDues(v); };
    $$('.ds-vc', b).forEach(cd => {
      const it = cd.dataset.it, L = allocOf(sy, it);
      $$('.ds-al', cd).forEach(el => el.onchange = () => { const l = L[+el.dataset.i]; l[el.dataset.f] = el.value.trim(); if (el.dataset.f === 'rib' && l.rib && !(Y(sy).benef[it] || {}).rib && +el.dataset.i === 0) (Y(sy).benef[it] = Y(sy).benef[it] || {}).rib = l.rib; persist(); if (['pct', 'a'].includes(el.dataset.f)) re(); });
      $$('[data-full]', cd).forEach(el => el.onclick = () => { const l = L[+el.dataset.full], c = T[it] || { sum: 0 }; l.a = String(Math.round(c.sum * (+l.pct || 0)) / 100); if (!l.d) l.d = todayIso(); persist(); re(); });
      $$('[data-adel]', cd).forEach(el => el.onclick = () => { L.splice(+el.dataset.adel, 1); persist(); re(); });
      $('[data-aadd]', cd).onclick = () => { L.push({ who: '', pct: '0', rib: '', d: '', a: '', ref: '' }); persist(); re(); };
      $('[data-areset]', cd).onclick = async () => { if (!(await confirmBox('العودة إلى المؤسسات والنسب المعتمدة لهذا المدخول؟ تُحذف التحويلات المسجلة له.', 'العودة'))) return; delete Y(sy).alloc[it]; persist(); re(); };
    });
  }
  /* ---------- 4. outputs ---------- */
  function outTab(v, b, sy) {
    const P = pupils(sy), T = stats(sy, P), y = Y(sy);
    const sent = it => sentOf(sy, it);
    const OUT = [['gen', 'مداخيل التسجيل', 'لكل مساهمة: عدد المعنيين والمؤدين والمبلغ المستخلص والمحول والباقي، مع التوزيع حسب المستوى.'], ['vir', 'التحويلات المالية', 'لكل مدخول: المبلغ المستخلص، المؤسسات المستفيدة ونسبها، المبلغ المخصص، تاريخ ومبلغ وحساب كل تحويل، والباقي.'],
      ['sum', 'حصيلة حسب الأقسام', 'لكل قسم: عدد التلاميذ، المؤدون وغير المؤدين والمبلغ.'], ['list', 'المنخرطون / المؤدون', 'اللائحة الاسمية للمنخرطين في التعاونية أو الجمعية الرياضية أو التأمين المدرسي، مع المبلغ ورقم الوصل.'], ['miss', 'لائحة غير المؤدين', 'التلاميذ المعنيون الذين لم يؤدوا المساهمة.'], ['rcpt', 'وصولات الأداء', 'وصل أداء لكل تلميذ(ة) بالمساهمات المؤداة (4 في الصفحة).']];
    b.innerHTML = `<div class="card"><div class="card-b"><table class="tbl"><thead><tr><th>المساهمة</th><th>المعنيون</th><th>المؤدون</th><th>نسبة الأداء</th><th>المحصل (د)</th><th>المحول (د)</th><th>الباقي (د)</th></tr></thead><tbody>
      ${ITEMS_().map(([it, n]) => { const c = T[it] || { n: 0, tot: 0, sum: 0 }, s2 = sent(it); return `<tr><td class="b">${esc(n)}</td><td class="num">${c.tot}</td><td class="num">${c.n}</td><td class="num">${c.tot ? Math.round(c.n / c.tot * 100) : 0}%</td><td class="num b">${money(c.sum)}</td><td class="num">${money(s2)}</td><td class="num b">${money(c.sum - s2)}</td></tr>`; }).join('')}
      </tbody></table></div></div>
      <div class="doc-cards" style="margin-top:12px">${OUT.map(([k, t, d]) => `<div class="card doc-card" data-out="${k}"><div class="e">🧾</div><div><h3>${t}</h3><p>${d}</p></div></div>`).join('')}</div>`;
    $$('[data-out]', b).forEach(el => el.onclick = () => go('duesDoc', { kind: el.dataset.out }));
  }
  function payTab(v, b, sy, years) {
    const all = pupils(sy);
    const stages = STAGES.filter(([k]) => all.some(p => STG_OF(p.lvl) === k) || k === cycleStage());
    const units = Array.from(new Set(all.map(p => p.unit).filter(Boolean)));
    const classes = Array.from(new Set(all.filter(p => !st.unit || K.U.same(p.unit, st.unit)).map(p => p.cls).filter(Boolean)));
    const rows = all.filter(p => (!st.unit || K.U.same(p.unit, st.unit)) && (!st.cls || p.cls === st.cls) && (!st.q || MK.hkey(nameOf(p) + p.code).includes(MK.hkey(st.q))));
    const tot = stats(sy, all);
    const a0 = 'التعليم الأولي: التأمين المدرسي فقط (اختياري)؛ الانخراط في التعاونية يخص التعليم الابتدائي فقط؛ التأمين والانخراط في الجمعية الرياضية يخصان الابتدائي والإعدادي والتأهيلي.';
    b.innerHTML = `      <div class="kpis" style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:10px;margin:12px 0">${ITEMS_().map(([it, n]) => `<div class="card"><div class="card-b"><div class="muted" style="font-size:12.5px">${n}</div><div style="font-size:22px;font-weight:800">${tot[it].n} <span class="muted" style="font-size:13px">/ ${tot[it].tot}</span></div><div style="font-size:13px">المبلغ المحصل: <b>${money(tot[it].sum)}</b> د</div></div></div>`).join('')}</div>
      <div class="card"><div class="card-h"><h3>التلاميذ</h3></div><div class="card-b">
        <div class="btn-row" style="margin-bottom:8px;flex-wrap:wrap">
          <input class="inp" id="dsQ" placeholder="بحث بالاسم أو الرمز" value="${esc(st.q)}" style="width:200px">
          ${units.length > 1 ? `<select class="inp" id="dsU" style="width:auto"><option value="">كل الوحدات</option>${units.map(u => `<option ${u === st.unit ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>` : ''}
          <select class="inp" id="dsC" style="width:auto"><option value="">كل الأقسام</option>${classes.map(u => `<option ${u === st.cls ? 'selected' : ''}>${esc(u)}</option>`).join('')}</select>
          ${ITEMS_().map(([it, n]) => { const ap = rows.filter(p => hasItem(STG_OF(p.lvl), it)), allOn = ap.length > 0 && ap.every(p => paid(sy, p, it)), anyOn = ap.some(p => paid(sy, p, it));
            return `<button class="btn sm ${allOn ? 'danger' : ''}" data-all="${it}" data-on="${allOn ? 1 : 0}" ${ap.length ? '' : 'disabled'} title="${allOn ? 'إلغاء تحديد كل التلاميذ المعروضين' : 'تحديد كل التلاميذ المعروضين'}">${esc(n)}: ${allOn ? 'إلغاء تحديد الكل' : 'تحديد الكل'}</button>${anyOn && !allOn ? `<button class="btn sm" data-none="${it}" title="إلغاء تحديد المعروضين">إلغاء</button>` : ''}`; }).join('')}
        </div>
        <div class="btn-row" style="margin-bottom:8px;flex-wrap:wrap"><button class="btn sm" id="dsImp">${ic('up')} استيراد لائحة المنخرطين (Excel / xls)</button><button class="btn sm" id="dsNum">${ic('list')} ترقيم وصولات التأمين تباعا</button><button class="btn sm" id="dsExp">${ic('down')} تصدير Excel</button></div>
        ${all.length ? `<div style="max-height:60vh;overflow:auto"><table class="tbl"><thead><tr><th>ر.ت</th><th>الاسم والنسب</th><th>القسم</th>${ITEMS_().map(([, n]) => `<th>${n}</th>`).join('')}</tr></thead><tbody>
        ${rows.slice(0, 600).map((p, i) => `<tr><td class="num">${i + 1}</td><td class="b">${esc(nameOf(p))}</td><td dir="ltr" style="text-align:right">${esc(p.cls || '')}</td>${ITEMS_().map(([it]) => { const sg = STG_OF(p.lvl); if (!hasItem(sg, it)) return '<td class="muted">—</td>'; const r = paid(sy, p, it); return `<td><label style="display:flex;gap:6px;align-items:center"><input type="checkbox" class="ds-ck" data-k="${esc(pkey(p))}" data-i="${it}" ${r ? 'checked' : ''}>${r ? `<input class="inp ds-amt" type="number" min="0" step="0.5" data-k="${esc(pkey(p))}" data-i="${it}" value="${esc(r.a)}" style="width:72px" title="المبلغ">${it === 'ins' ? `<input class="inp ds-no" data-k="${esc(pkey(p))}" data-i="${it}" value="${esc(r.n || '')}" placeholder="رقم الوصل" style="width:104px" dir="ltr">` : ''}` : ''}</label></td>`; }).join('')}</tr>`).join('')}
        </tbody></table></div>${rows.length > 600 ? '<p class="muted">يُعرض أول 600 تلميذ؛ استعمل المرشحات.</p>' : ''}` : '<p class="muted">لا توجد لائحة تلاميذ لهذا الموسم. استورد لوائح التلاميذ من «بطاقة التلاميذ» أولا.</p>'}
      </div></div>`;
    const re = () => window.pageDues(v);
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
      if (b.dataset.on === '1') { if (!await confirmBox(`إلغاء <b>${esc((ITEMS_().find(x => x[0] === it) || [])[1])}</b> لـ <b>${ap.length}</b> تلميذ(ة) معروضين؟ ستحذف مبالغهم وأرقام وصولاتهم.`, 'إلغاء التحديد')) return; ap.forEach(p => setPaid(sy, p, it, false)); }
      else ap.forEach(p => { if (!paid(sy, p, it)) setPaid(sy, p, it, true); });
      persist(); re();
    });
    $$('[data-none]', v).forEach(b => b.onclick = () => { const it = b.dataset.none; rows.forEach(p => { if (paid(sy, p, it)) setPaid(sy, p, it, false); }); persist(); re(); });
    $('#dsImp', v).onclick = () => importList(sy, re);
    $('#dsNum', v).onclick = () => numberReceipts(sy, all, re);
    $('#dsExp', v).onclick = () => exportList(sy, rows);
  }

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
      <div class="fld"><label>الواجب الذي يخصه الملف</label><select class="inp" id="diIt${sfx(i)}">${ITEMS_().map(([k, n]) => `<option value="${k}" ${k === x.guess ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></div>
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
        msgs.push(`تم تسجيل ${n} تلميذ(ة) في «${(ITEMS_().find(y => y[0] === it) || [])[1]}»${skipped ? ` — ${skipped} لا يخصهم هذا الواجب` : ''}${x.miss.length ? ` — ${x.miss.length} غير موجودين في بطاقة التلاميذ` : ''}`);
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
    const rowsX = [['ر.ت', 'الوحدة المدرسية', 'القسم', 'رمز مسار', 'النسب', 'الاسم'].concat(ITEMS_().map(([, n]) => n + ' (المبلغ)'), ['رقم وصل التأمين'])];
    rows.forEach((p, i) => rowsX.push([i + 1, p.unit || '', p.cls || '', p.code || '', p.last || '', p.first || ''].concat(ITEMS_().map(([it]) => { if (!hasItem(STG_OF(p.lvl), it)) return ''; const r = paid(sy, p, it); return r ? +r.a || 0 : ''; }), [(paid(sy, p, 'ins') || {}).n || ''])));
    const r = await window.api.saveXlsx(rowsX, `الاشتراكات_${MK.syDash(sy)}.xlsx`, 'الاشتراكات');
    if (r && r.ok) toast('تم التصدير إلى Excel');
  }

  /* ---------- printable lists ---------- */
  const KINDS = [['gen', 'مداخيل التسجيل (الحصيلة العامة)'], ['vir', 'التحويلات المالية'], ['sum', 'حصيلة حسب الأقسام'], ['list', 'لائحة المنخرطين / المؤدين'], ['miss', 'لائحة غير المؤدين'], ['rcpt', 'وصولات الأداء']];
  function build(s, f) {
    const sy = f.sy, all = pupils(sy).filter(p => (!f.unit || K.U.same(p.unit, f.unit)) && (!f.cls || p.cls === f.cls) && (!f.stage || STG_OF(p.lvl) === f.stage));
    const it = f.item, name = (ITEMS_().find(x => x[0] === it) || ITEMS_()[0])[1];
    const sub = `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}${f.unit ? ' — ' + esc(f.unit) : ''}${f.cls ? ' — القسم ' + esc(f.cls) : ''}`;
    const mem = all.filter(p => hasItem(STG_OF(p.lvl), it));
    const y = Y(sy), sent = i2 => sentOf(sy, i2);
    if (f.kind === 'gen') {
      const T = stats(sy, all), lv = K.LV.sort(Array.from(new Set(all.map(p => p.lvl).filter(Boolean))));
      const rows = ITEMS_().map(([i2, n], i) => { const c = T[i2] || { n: 0, tot: 0, sum: 0 }, s2 = sent(i2); return tr([i + 1, { t: n, c: 'b r' }, c.tot, c.n, c.tot - c.n, `${c.tot ? Math.round(c.n / c.tot * 100) : 0}%`, { t: money(c.sum), c: 'nw b' }, { t: money(s2), c: 'nw' }, { t: money(c.sum - s2), c: 'nw b' }]); });
      const tl = ITEMS_().reduce((a, [i2]) => { const c = T[i2] || { sum: 0 }; a.s += c.sum; a.v += sent(i2); return a; }, { s: 0, v: 0 });
      rows.push(tr([{ t: 'المجموع', c: 'd', s: 6 }, { t: money(tl.s), c: 'nw' }, { t: money(tl.v), c: 'nw' }, { t: money(tl.s - tl.v), c: 'nw' }]));
      const lrows = lv.map(l => { const A = all.filter(p => p.lvl === l); return tr([{ t: K.LV.ar(l), c: 'b r' }, A.length].concat(ITEMS_().map(([i2]) => { if (!hasItem(STG_OF(l), i2)) return '—'; const pd = A.filter(p => paid(sy, p, i2)); return `${pd.length} — ${money(pd.reduce((a, p) => a + (+paid(sy, p, i2).a || 0), 0))}`; }))); });
      return SB.pages(s, { title: 'مداخيل التسجيل', sub, page: 'a4', blocks: [SB.tbl(thr(['ر.ت', 'المساهمة', 'المعنيون', 'المؤدون', 'غير المؤدين', 'نسبة الأداء', 'المحصل (د)', 'المحول (د)', 'الباقي (د)'].map(t => ({ t, c: 'd' }))), rows, 'big'),
        SB.cap('التوزيع حسب المستوى (عدد المؤدين — المبلغ بالدرهم)'), SB.tbl(thr(['المستوى', 'التلاميذ'].concat(ITEMS_().map(x => x[1])).map(t => ({ t, c: 'd' }))), lrows.length ? lrows : [tr([''])], 'cmp')] });
    }
    if (f.kind === 'vir') {
      const T = stats(sy, pupils(sy)), its = ITEMS_().filter(([i2]) => !f.item || f.item === '*' || i2 === f.item), blocks = [];
      its.forEach(([i2, n]) => {
        const c = T[i2] || { sum: 0 }, L = allocOf(sy, i2);
        const rows = L.map(l => { const al = Math.round(c.sum * (+l.pct || 0)) / 100; return tr([{ t: l.who, c: 'b r' }, `${+l.pct || 0}%`, { t: money(al), c: 'nw' }, l.d ? fmtDate(l.d) : '', { t: +l.a ? money(l.a) : '', c: 'nw b' }, { t: l.rib || '', c: 'ltr sm' }, { t: l.ref || '', c: 'ltr sm' }]); });
        rows.push(tr([{ t: 'المجموع', c: 'b' }, `${L.reduce((t, l) => t + (+l.pct || 0), 0)}%`, { t: money(c.sum * L.reduce((t, l) => t + (+l.pct || 0), 0) / 100), c: 'nw' }, '', { t: money(sentOf(sy, i2)), c: 'nw b' }, { t: `الباقي: ${money(c.sum - sentOf(sy, i2))} د`, s: 2 }], 'tot'));
        blocks.push({ html: `<div class="sb-cap r" style="margin-top:3mm">المداخيل: ${esc(n)} — المبلغ المستخلص: ${money(c.sum)} درهم</div>`, keepNext: true }, SB.tbl(thr(['المؤسسة', 'النسبة', 'المبلغ المخصص (د)', 'تاريخ التحويل', 'مبلغ التحويل (د)', 'حساب التحويل', 'المرجع'].map(t => ({ t, c: 'd' }))), rows, 'cmp'));
      });
      return SB.pages(s, { title: 'التحويلات المالية', sub: `الموسم الدراسي ${esc(MK.syDash(sy).replace('-', '/'))}`, page: 'a4l', blocks });
    }
    if (f.kind === 'rcpt') {
      const L = all.filter(p => ITEMS_().some(([i2]) => paid(sy, p, i2)));
      const one = p => { const its = ITEMS_().filter(([i2]) => paid(sy, p, i2)), tot = its.reduce((a, [i2]) => a + (+paid(sy, p, i2).a || 0), 0);
        return `<div class="ds-rc"><div class="ds-rc-h"><b>وصل أداء المساهمات</b><span>${esc(s.school || '')} — ${esc(MK.syDash(sy).replace('-', '/'))}</span></div>
          <div class="ds-rc-g"><div>التلميذ(ة): <b>${esc(nameOf(p))}</b></div><div>رمز مسار: <b dir="ltr">${esc(p.code || '')}</b></div><div>القسم: <b dir="ltr">${esc(p.cls || '')}</b></div><div>المستوى: <b>${esc(K.LV.ar(p.lvl))}</b></div></div>
          <table class="sb-t cmp"><thead>${thr(['المساهمة', 'المبلغ (د)', 'التاريخ', 'رقم الوصل'])}</thead><tbody>${its.map(([i2, n]) => { const r = paid(sy, p, i2); return tr([{ t: n, c: 'r' }, { t: money(r.a), c: 'nw' }, r.d ? fmtDate(r.d) : '', { t: r.n || '', c: 'ltr' }]); }).join('')}${tr([{ t: 'المجموع', c: 'b' }, { t: money(tot), c: 'nw b' }, '', ''])}</tbody></table>
          <div class="ds-rc-s"><span>توقيع المستلم(ة)</span><span>خاتم المؤسسة</span></div></div>`; };
      const pages = []; for (let i = 0; i < Math.max(1, L.length); i += 4) pages.push(`<div class="ds-rcs">${L.slice(i, i + 4).map(one).join('')}</div>`);
      return pages;
    }
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

  window.pageDuesDoc = function (v, arg) {
    migrate(DB);
    const sy0 = st.sy || MK.curSy();
    MK.docPage(v, {
      title: 'مخرجات الاشتراكات والتسجيل', icon: '🧾', modes: false, word: true, state: { sy: sy0, item: 'ins', kind: (arg && arg.kind) || 'gen', unit: '', cls: '', stage: '' },
      back: () => go('dues'),
      form: function form(box, s0, refresh) {
        const all = pupils(s0.sy), units = Array.from(new Set(all.map(p => p.unit).filter(Boolean))), classes = Array.from(new Set(all.map(p => p.cls).filter(Boolean)));
        const sel = (id, l, opts, cur) => `<div class="fld"><label>${l}</label><select class="inp" id="${id}">${opts.map(([v2, t]) => `<option value="${esc(v2)}" ${v2 === cur ? 'selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
        box.innerHTML = sel('dd2', 'الوثيقة', KINDS, s0.kind) + (['gen', 'rcpt'].includes(s0.kind) ? '' : sel('dd1', 'المساهمة', (s0.kind === 'vir' ? [['*', 'كل المساهمات']] : []).concat(ITEMS_()), s0.item)) + sel('dd3', 'السلك', [['', 'كل الأسلاك']].concat(STAGES), s0.stage)
          + (units.length > 1 ? sel('dd4', 'الوحدة المدرسية', [['', 'كل الوحدات']].concat(units.map(u => [u, u])), s0.unit) : '') + sel('dd5', 'القسم', [['', 'كل الأقسام']].concat(classes.map(c => [c, c])), s0.cls);
        [['dd1', 'item'], ['dd2', 'kind', true], ['dd3', 'stage'], ['dd4', 'unit'], ['dd5', 'cls']].forEach(([id, k, again]) => { const el = $('#' + id, box); if (el) el.onchange = e => { s0[k] = e.target.value; if (k === 'kind' && s0.kind !== 'vir' && s0.item === '*') s0.item = 'ins'; if (again) form(box, s0, refresh); refresh(); }; });
      },
      build: s0 => ({ page: s0.kind === 'vir' ? 'a4l' : 'a4', pages: build(S(), s0) }),
      fname: s0 => 'لائحة_' + (ITEMS_().find(x => x[0] === s0.item) || ITEMS_()[0])[1].replace(/\s+/g, '_')
    });
  };
  Dx.modCss += `
  .ds-rcs{display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:128mm;gap:5mm}.ds-rc{border:1.4px solid #1f3864;border-radius:3mm;padding:3mm;font-size:10pt;line-height:1.6;display:flex;flex-direction:column}
  .ds-rc-h{display:flex;flex-direction:column;align-items:center;border-bottom:1px solid #4472c4;margin-bottom:2mm;color:#1f3864}.ds-rc-h b{font-size:14pt}.ds-rc-g{display:grid;grid-template-columns:1fr 1fr;gap:0 3mm;margin-bottom:2mm}
  .ds-rc-s{display:flex;justify-content:space-between;margin-top:auto;font-weight:700;min-height:18mm}`;
  { const c = document.createElement('style'); c.textContent = '.ds-n{display:inline-flex;align-items:center;justify-content:center;width:19px;height:19px;border-radius:50%;background:var(--sec,#7a4a1e);color:#fff;font-size:11px;margin-inline-end:4px}'; document.head.appendChild(c); }
  window.Dues = { tab: () => st.tab || 'pay', migrate, rate, rateL, paid, setPaid, stats, STG_OF, items: () => ITEMS_() };
})();
