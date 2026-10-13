'use strict';
/* سند تسلم مبلغ نقدي — offered on the activation page once the program is activated.
   The amount is fixed by the designer inside the signed activation key; the receipt carries the program logo
   and a QR code (machine code, receipt number, amount, date, key tag) so the designer can check it. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;

  /* ---- amount in Arabic words (dirhams) ---- */
  const ONES = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة', 'عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const TENS = ['', '', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const HUND = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];
  function below1000(n) {
    const p = [];
    const h = Math.floor(n / 100), r = n % 100;
    if (h) p.push(HUND[h]);
    if (r) {
      if (r < 20) p.push(ONES[r]);
      else { const o = r % 10, t = Math.floor(r / 10); p.push(o ? ONES[o] + ' و' + TENS[t] : TENS[t]); }
    }
    return p.join(' و');
  }
  function words(n) {
    n = Math.floor(Math.abs(+n || 0));
    if (!n) return 'صفر';
    const th = Math.floor(n / 1000), r = n % 1000, p = [];
    if (th) {
      if (th === 1) p.push('ألف'); else if (th === 2) p.push('ألفان');
      else if (th <= 10) p.push(ONES[th] + ' آلاف');
      else p.push(below1000(th) + ' ألف');
    }
    if (r) p.push(below1000(r));
    return p.join(' و');
  }
  const dirham = n => { n = Math.floor(+n || 0); return words(n) + (n >= 3 && n <= 10 ? ' دراهم' : ' درهم') + ' ' + (n ? 'لا غير' : ''); };

  /* ---- data ---- */
  // the receipt is the designer's: he is the one who receives the money (not the school director)
  const store = () => { const g = DB.settings = DB.settings || {}; g.receipt = g.receipt || {}; return g.receipt; };
    const PROG = () => 'برنامج Le Gestionnaire';   // 1.9.4: no version number on the receipt
  // number of the receipt: 1, 2, 3... (assigned by the designer when the key is generated, and carried by the key)
  const receiptNo = lic => (lic && +lic.rno > 0 ? String(+lic.rno) : '');
  function qrText(lic, f) {
    // ASCII only (QR byte mode): LG|1|machine|no|amount|date|tag
    return ['LG', '1', lic.machine || '', receiptNo(lic), (f.amount || 0), (f.date || ''), lic.tag || ''].join('|');
  }
  const payeeOf = s => `${s.director ? s.director + '، ' : ''}مدير(ة) ${s.school || 'م/م ............'}`;

  // 1.9.4: the customer's institution, top right (academy, directorate, school, commune, GRESA)
  const instLines = s => [s.academy, s.directorate, s.school ? '<b>' + esc(s.school) + '</b>' : '', s.commune ? 'جماعة ' + esc(s.commune) : '', s.gresa ? 'رمز المؤسسة: <span dir="ltr">' + esc(s.gresa) + '</span>' : '']
    .map((x, i) => (i < 2 && x ? esc(x) : x)).filter(Boolean).join('<br>');
  function one(s, lic, f) {
    const amountTxt = f.amount ? `${Number(f.amount).toLocaleString('en-US').replace(/,/g, ' ')} درهم (${dirham(f.amount)})` : '.....................................................................................';
    const dots = (v, n) => v ? `<b>${esc(v)}</b>` : '<span class="rc-d">' + '.'.repeat(n || 40) + '</span>';
    const qr = window.QR ? window.QR.svg(qrText(lic, f), { size: 110, margin: 1, ec: 'M' }) : '';
    const no = receiptNo(lic);
    return `<div class="rc-copy">
      <div class="rc-top">
        <div class="rc-r">${instLines(s)}</div>
        <div class="rc-c"><img src="assets/icon256.png" alt=""><div class="rc-app" dir="ltr">Le Gestionnaire</div></div>
        <div class="rc-l">${esc(f.city || s.city || '')} في: ${f.date ? esc(fmtDate(f.date)) : '...............'}</div>
      </div>
      <div class="rc-title">سند تسلم</div>
      <div class="rc-no">رقم ${no ? esc(no) : '<span class="rc-d">........</span>'}</div>
      <div class="rc-body">
        <p>أنا الموقع أسفله${f.name ? ' <b>' + esc(f.name) + '</b>' : ''}، بصفتي: <b>مصمم ${esc(PROG())}</b> أشهد أني تسلمت من السيد: <b>${esc(f.payee || payeeOf(s))}</b></p>
        <p>مبلغا ماليا قدره: <b>${amountTxt}</b></p>
        <p>وذلك في مقابل: <b>${esc(f.purpose || ('اقتناء ترخيص استعمال ' + PROG()))}</b></p>
      </div>
      <div class="rc-foot"><div></div><div class="rc-qr"><div class="rc-sig">التوقيع</div>${qr}<div class="rc-qt" dir="ltr">${esc(lic.tag || '')}</div></div></div>
    </div>`;
  }

  const CSS = `
  .rc-page{display:flex;flex-direction:column;height:100%;box-sizing:border-box;padding:6mm 0}
  .rc-copy{flex:1;border:1.4px dashed #555;border-radius:3mm;margin:2mm 0;padding:5mm 7mm;display:flex;flex-direction:column;font-family:'MAJ','Amiri',serif;font-size:13.5pt;line-height:2.1;max-height:136mm}
  .rc-top{display:flex;justify-content:space-between;align-items:flex-start;font-size:11pt;line-height:1.45}
  .rc-r{text-align:right;flex:1}.rc-l{text-align:left;flex:1;white-space:nowrap}
  .rc-c{text-align:center;width:30mm}.rc-c img{width:15mm;height:15mm;display:block;margin:0 auto}.rc-app{font:700 8pt Arial,sans-serif;color:#0b4d3a}
  .rc-title{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:20pt;line-height:1.4;margin-top:1mm;text-decoration:underline}
  .rc-no{text-align:center;font-weight:700;margin-bottom:1mm}
  .rc-body p{margin:0}.rc-body b{font-weight:700}.rc-d{letter-spacing:0;color:#444;word-break:break-all}
  .rc-foot{display:flex;justify-content:space-between;align-items:flex-end;margin-top:auto}
  .rc-sig{font-weight:700;line-height:1.3}.rc-qr{text-align:center}.rc-qr svg{display:block;width:24mm;height:24mm}.rc-qt{font:7pt monospace}`;
  if (Dx) Dx.modCss = (Dx.modCss || '') + CSS;

  function pages(s, lic, f) {
    return [`<div class="rc-page">${one(s, lic, f)}${one(s, lic, f)}</div>`];
  }

  window.pageReceiptDoc = function (v) {
    const lic = LIC || {};
    if (!lic.active) { go('license'); return; }
    const sv = store(), s = S();
    const st0 = Object.assign({ name: '', cin: '', payee: '', city: s.city || '', date: lic.issued || todayIso(), purpose: '' }, sv);
    if (!sv.v193) st0.payee = '';   // before 1.9.3 «تسلمت من» held the receiver: the field now names the payer (the school director)
    st0.name = ''; st0.cin = ''; // 1.9.4: no name / CIN line on the receipt
    st0.amount = lic.amount || 0;
    // no licence duration in the wording («لمدة سنة» of older versions is dropped)
    st0.purpose = String(st0.purpose || '').replace(/\s*لمدة\s+(?:سنة|سنتين|\S+\s+سنوات|دائم\S*)\s*$/, '').trim();
    if (!st0.purpose) st0.purpose = 'اقتناء ترخيص استعمال ' + PROG();
    st0.purpose = String(st0.purpose).replace(/\s*\(\s*v?\d+(?:\.\d+)+\s*\)/g, '');
    if (!st0.payee) st0.payee = payeeOf(s);
    MK.docPage(v, {
      title: 'سند تسلم', icon: '🧾', modes: false, state: st0, word: true,
      back: () => go('license'),
      form: (box, st, refresh) => {
        box.innerHTML = `<div class="sec-t">السند</div>
          <div class="fld"><label>رقم السند (يحدده المصمم ضمن المفتاح: 1، 2، 3…)</label><input class="inp" value="${receiptNo(lic) ? esc(receiptNo(lic)) : 'غير محدد في المفتاح'}" disabled></div>
          <div class="fld"><label>تسلمت من السيد</label><input class="inp" id="rcP" value="${esc(st.payee)}"></div>
          <div class="fld"><label>المبلغ بالدرهم (حدده المصمم في مفتاح التفعيل)</label><input class="inp" value="${st.amount ? esc(st.amount) : 'غير محدد في المفتاح'}" disabled></div>${st.amount ? '' : '<p style="color:var(--red);font-size:12.5px;line-height:1.7;margin:-4px 0 8px">المبلغ غير مسجل في مفتاح التفعيل: اطلب من المصمم المفتاح المحدث (بعد تسجيل المبلغ) وأدخله في «التفعيل ← تحديث مفتاح التفعيل».</p>'}
          <div class="fld"><label>في مقابل</label><input class="inp" id="rcU" value="${esc(st.purpose)}"></div>
          <div class="fgrid"><div class="fld"><label>المدينة</label><input class="inp" id="rcCi" value="${esc(st.city)}"></div>
          <div class="fld"><label>التاريخ</label><input class="inp" type="date" id="rcD" value="${esc(st.date)}"></div></div>
          <p class="muted" style="font-size:12px;line-height:1.7">يحمل السند معطيات مؤسستك (أعلى اليمين) وشعار البرنامج، والتوقيع رمز QR خاص بهذا التفعيل (رمز الجهاز، رقم السند، المبلغ، التاريخ وبصمة المفتاح) ليتحقق منه المصمم.</p>`;
        const bind = (id, k, ev) => { const el = $(id, box); el[ev || 'oninput'] = e => { st[k] = e.target.value; Object.assign(store(), { v193: 1, name: st.name, cin: st.cin, payee: st.payee, city: st.city, purpose: st.purpose }); persist(); refresh(); }; };
        bind('#rcP', 'payee'); bind('#rcU', 'purpose'); bind('#rcCi', 'city'); bind('#rcD', 'date', 'onchange');
      },
      build: st => ({ page: 'a4', pages: pages(S(), lic, st) }),
      fname: () => 'سند_تسلم_' + (receiptNo(lic) || 'x')
    });
  };
  window.Receipt = { dirham, words, receiptNo, qrText };
})();
