'use strict';
/* Shared helpers for the 1.8 modules (stock management, school certificates):
   paginated A4 tables, signature blocks, a document preview page, Excel import helpers. */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate, header } = Dx;

  const pad2 = n => String(n).padStart(2, '0');
  const isoToday = () => Dx.todayIso();
  // school year of a date: 2026-10-06 -> 2026/2027
  const schoolYear = iso => { const m = /^(\d{4})-(\d{2})/.exec(iso || isoToday()); if (!m) return ''; const y = +m[1]; return +m[2] >= 9 ? `${y}/${y + 1}` : `${y - 1}/${y}`; };
  const syBounds = iso => { const sy = schoolYear(iso); const y = +sy.slice(0, 4); return { from: `${y}-09-01`, to: `${y + 1}-08-31` }; };
  // date shown in documents: ISO -> dd/mm/yyyy, anything else as typed
  const showDate = v => { v = String(v == null ? '' : v).trim(); return /^\d{4}-\d{2}-\d{2}$/.test(v) ? fmtDate(v) : v; };
  const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : 0; };
  const fmtQty = n => { n = +n || 0; return Number.isInteger(n) ? String(n) : String(+n.toFixed(2)); };

  /* ---------- documents ---------- */
  const signBlock = (s, o) => {
    o = o || {};
    const left = o.left || 'توقيع وخاتم مدير(ة) المؤسسة';
    return `<div class="mk-sign ${o.cls || ''}">
      ${o.right ? `<div class="c b">${o.right}</div>` : '<div></div>'}
      <div class="c"><div>حرر ب: ${esc(o.city || s.city || '')} &nbsp; في: ${esc(fmtDate(o.date || isoToday()))}</div><div class="b mt">${left}</div></div>
    </div>`;
  };

  /* Paginated table document (A4 portrait or landscape).
     o: { s, title, info (html under title), cols: [{h, w ('12%'), cls}], rows: [[cell html...]], foot (html after table), footH (mm),
          sign (html), page: 'a4'|'a4l', minRows, dirOnly }
     Pages have a fixed size, so rows are distributed by an estimate of their printed height (long text wraps). */
  function tablePages(o) {
    const land = o.page === 'a4l';
    const img = !!(o.s && o.s.headerMode === 'image' && o.s.letterhead && !o.dirOnly);
    const innerW = land ? 275 : 186, innerH = land ? 193.5 : 276.5;
    // portrait: the letterhead spans the whole page width (its height follows the image ratio, at most 80 mm)
    const nrm = img && o.s.letterheadP && o.s.lhNorm !== false;
    const ratio = !img ? 0 : nrm ? (land ? o.s.llW / o.s.llH : o.s.lpW / o.s.lpH) : (o.s.letterheadW && o.s.letterheadH ? o.s.letterheadW / o.s.letterheadH : 0);
    const v2 = !img && o.s && (o.s.headerStyle || 'ruqaa') !== 'classic';
    const hdrH = img ? (ratio ? Math.min(land ? 75 : 80, (land ? 297 : 210) / ratio) - 8 + 1 : (land ? 46 : 40)) : v2 ? (land ? 36 : 42) : (land ? 26 : 31);
    const titleH = 14 + (o.info ? 8 : 0), theadH = 11, pnoH = 7, safety = 6;
    const tailH = (o.sign ? 32 : 0) + (o.footH || (o.foot ? 10 : 0));
    const rows = o.rows.slice();
    const minRows = o.minRows == null ? 0 : o.minRows;
    while (rows.length < minRows) rows.push(o.cols.map(() => ''));
    // column widths (mm)
    const fixed = o.cols.reduce((t, c) => t + (c.w ? parseFloat(c.w) : 0), 0);
    const nAuto = o.cols.filter(c => !c.w).length || 1;
    const colW = o.cols.map(c => (c.w ? parseFloat(c.w) : Math.max(5, (100 - fixed) / nAuto)) * innerW / 100);
    const strip = h => String(h == null ? '' : h).replace(/<[^>]+>/g, '').replace(/&[a-z#0-9]+;/gi, 'x');
    const rowH = r => Math.max(6.5, ...r.map((v, i) => {
      const sm = /\bsm\b/.test(o.cols[i].cls || ''), cw = Math.max(4, colW[i] - 2.6);
      const perLine = Math.max(1, Math.floor(cw / (sm ? 1.42 : 1.62)));
      const len = strip(v).length;
      return Math.max(1, Math.ceil(len / perLine)) * (sm ? 3.9 : 4.3) + 1.8;
    }));
    const chunks = [[]];
    let used = 0, budget = innerH - hdrH - titleH - theadH - pnoH - safety;
    rows.forEach(r => {
      const h = rowH(r);
      if (used + h > budget && chunks[chunks.length - 1].length) { chunks.push([]); used = 0; budget = innerH - theadH - pnoH - safety; }
      chunks[chunks.length - 1].push(r); used += h;
    });
    // keep room for the totals / signature block on the last page (1.9.3: never a signature alone on a page — the last rows go with it)
    if ((o.foot || o.sign) && used + tailH > budget) {
      const lastC = chunks[chunks.length - 1];
      if (lastC.length > 2) chunks.push(lastC.splice(-2)); else chunks.push([]);
    }
    const tail = (o.foot || '') + (o.sign || '');
    const thead = `<thead><tr>${o.cols.map(c => `<th${c.w ? ` style="width:${c.w}"` : ''}>${c.h}</th>`).join('')}</tr></thead>`;
    const total = chunks.length;
    return chunks.map((ch, pi) => {
      const body = ch.map(r => `<tr>${r.map((v, ci) => `<td class="${o.cols[ci].cls || ''}">${v}</td>`).join('')}</tr>`).join('');
      const first = pi === 0, last = pi === total - 1;
      return `
        ${first ? `<div class="mk-hdr">${header(o.s, o.service || '', { dirOnly: !!o.dirOnly })}</div>
          <div class="mk-title">${o.title}</div>${o.info || ''}` : ''}
        ${ch.length ? `<table class="tbl mk-tbl">${thead}<tbody>${body}</tbody></table>` : ''}
        ${last ? `<div class="mk-tail">${tail}</div>` : ''}
        <div class="spacer"></div>
        ${total > 1 ? `<div class="mk-pno" dir="ltr">${pi + 1} / ${total}</div>` : ''}`;
    });
  }

  Dx.modCss = `
  .page-a4l{width:297mm;height:209.5mm;padding:8mm 11mm;font-size:10pt;line-height:1.55;display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}
  .page-a4{page-break-after:always;break-after:page}
  .page-a4:last-child,.page-a4l:last-child{page-break-after:auto;break-after:auto}
  .page-a4l .hdr-g{grid-template-columns:1fr 20mm 1fr}.page-a4l .hdr-emb img{width:20mm}.page-a4l .hdr-txt{--fs:8pt;--fsk:10pt;--lh:3.9mm;--lhk:5mm}.page-a4l .hdr-tif{--fs:7.6pt;--fsk:9pt}.page-a4l .hdr-sch2{font-size:11pt}
  .page-a4l .hdr-img{margin:-8mm -11mm 2mm}.page-a4l .hdr-img img{display:block;width:100%;height:auto;max-height:75mm;object-fit:fill}
  .page-a4 .mk-hdr .hdr-img{margin:-10mm -12mm 2mm}.page-a4 .mk-hdr .hdr-img img{display:block;width:100%;height:auto;max-height:80mm;object-fit:fill}
  .half .ct-hdr .hdr-img img{display:block;width:100%;height:auto;max-height:42mm;object-fit:fill}
  .mk-title{align-self:center;text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:15pt;border:1.5px solid #000;border-radius:3mm;padding:0 8mm;margin:1mm auto 2.5mm;line-height:1.55}
  .mk-info{text-align:center;margin:0 0 2.5mm;line-height:1.7}
  .mk-info2{display:flex;justify-content:space-between;gap:4mm;margin:0 0 2mm}
  .mk-tbl{font-size:9.2pt;line-height:1.3}
  .mk-tbl td{height:6.7mm;padding:.6mm 1.2mm}
  .mk-tbl td.r,.mk-pv-t td.r{text-align:right;vertical-align:middle;line-height:1.3}.mk-tbl td.nw{white-space:nowrap}.mk-tbl td.sm{font-size:8.2pt}
  .mk-pv{font-size:10.2pt}.mk-pv .mk-lines{line-height:1.95}.mk-pv .mk-lines p{margin:0 0 .8mm}
  .mk-pv-t{font-size:9.4pt}.mk-pv-t td{height:7.4mm;padding:.5mm 1.2mm}
  .mk-pv .sigs{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin-top:3mm}.mk-pv .sigs>div{border:1px solid #000;min-height:24mm;padding:1mm 2mm;text-align:center;font-weight:700;font-size:9.2pt}
  .mk-tbl tr.tot td{font-weight:700;background:#f2f2f2}
  .mk-tail{margin-top:3mm}
  .mk-sign{display:grid;grid-template-columns:1fr 1fr;gap:4mm;margin-top:3mm;min-height:24mm}
  .mk-pno{text-align:center;font-size:8pt;color:#444}
  .mk-lines p{margin:0 0 1.3mm}
  .mk-cert{line-height:2.15;font-size:10.4pt}.mk-cert p{margin:0}
  .mk-cert .v{font-weight:700}
  .mk-certt{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:19pt;text-decoration:underline;margin:1mm 0 0}
  .mk-certno{text-align:center;font-weight:700;margin-bottom:2mm}
  .mk-pv .tbl td{height:6.4mm}
  .ct-title{align-self:center;border:1.5px solid #000;border-radius:3.5mm;padding:1.5mm 24mm;font-size:21pt;font-weight:700;margin:7mm auto 11mm;line-height:1.5}
  .ct{font-size:13.6pt;font-weight:700;line-height:2.15;padding:0 2mm}
  .ct-intro{margin:0 0 5mm}
  .ct-name{text-align:center;font-size:16pt;line-height:1.75}
  .ct-name b,.ct-p b{font-weight:700}
  .ct-p{padding:0 10mm;text-align:justify;margin-top:5mm}
  .ct-p+.ct-p{margin-top:1mm}
  .ct-foot{display:grid;grid-template-columns:1fr 1fr;margin-top:8mm;font-size:13pt;font-weight:700}
  .ct-d{margin-top:2mm}
  .ct-sig{text-align:center;font-size:13pt;font-weight:700;margin-top:12mm}
  `;

  /* ---------- flowing documents (reports): blocks measured in a hidden copy of the document, then packed into A4 pages ----------
     The measuring frame holds the same CSS and fonts as the printed document, so heights are exact. */
  let MF = null;
  function measurer() {
    if (MF && MF.f.isConnected && MF.doc.body) return MF;
    const f = document.createElement('iframe');
    f.setAttribute('aria-hidden', 'true'); f.tabIndex = -1;
    f.style.cssText = 'position:fixed;left:-4000px;top:0;width:1300px;height:900px;visibility:hidden;border:0;pointer-events:none';
    document.body.appendChild(f);
    const d = f.contentDocument;
    d.open(); d.write(Dx.buildRaw({ page: 'a4', pages: [''], title: 'm', base: BASE })); d.close();
    d.body.innerHTML = '';
    let ready;
    try {
      ready = Promise.all(['400 10pt NSA', '500 10pt NSA', '600 10pt NSA', '700 10pt NSA', '400 10pt Amiri', '700 10pt Amiri', '400 10pt Tif', '400 10pt MAJ', '700 10pt MAJ', '700 10pt MAJT']
        .map(x => d.fonts.load(x, 'اب ⵜ').catch(() => null))).then(() => d.fonts.ready);
    } catch (e) { ready = Promise.resolve(); }
    MF = { f, doc: d, ready };
    return MF;
  }
  const fontsReady = () => measurer().ready;
  const PX = 96 / 25.4;
  /* o: { page: 'a4'|'a4l', cls, head: html at the top of the first page, blocks: [...], pno: true }
     block: 'html' | { html, keepNext } | { before, keepNext, table: { cls, head: '<tr>..</tr>', rows: ['<tr>..</tr>'] }, minRows } */
  function flowPages(o) {
    const land = o.page === 'a4l';
    const M = measurer(), d = M.doc;
    const blocks = (o.blocks || []).filter(b => b !== '' && b != null).map(b => typeof b === 'string' ? { html: b } : b);
    const tblHtml = (b, rows) => `${b.before || ''}<table class="tbl ${b.table.cls || ''}">${b.table.colgroup || ''}<thead>${b.table.head || ''}</thead><tbody>${rows.join('')}</tbody></table>`;
    const wrap = h => `<div class="fb">${h}</div>`;
    const pageCls = (land ? 'page-a4l' : 'page-a4') + ' ' + (o.cls || '');
    d.body.innerHTML = `<div class="${pageCls}" style="height:auto;overflow:visible">${wrap(o.head || '')}${blocks.map(b => wrap(b.table ? tblHtml(b, b.table.rows) : b.html)).join('')}</div>`;
    const pg = d.body.firstChild;
    const H = el => el.getBoundingClientRect().height;
    const measure = () => {
      const ws = Array.from(pg.children);
      return { headH: H(ws[0]), info: blocks.map((b, i) => {
        const w = ws[i + 1];
        if (!b.table) return { h: H(w) };
        const t = w.querySelector('table'), top = w.getBoundingClientRect().top;
        const th = t.tHead ? H(t.tHead) : 0;
        const rows = Array.from(t.tBodies[0].rows).map(H);
        return { h: H(w), pre: t.getBoundingClientRect().top - top, th, rows, extra: Math.max(0, H(w) - (t.getBoundingClientRect().top - top) - H(t)) };
      }) };
    };
    const cs0 = d.defaultView.getComputedStyle(pg);
    const padX = parseFloat(cs0.paddingLeft) + parseFloat(cs0.paddingRight);
    const contentW = pg.clientWidth - padX;
    const setScale = z => { pg.style.width = (contentW / z + padX) + 'px'; };
    const { headH, info } = measure();
    const pageIn = (land ? 193.5 : 276.5) * PX;
    const full = pageIn - (o.pno === false ? 0 : 5 * PX) - 3 * PX;
    const fullOne = pageIn - 3 * PX;           // a single page carries no page number: 5 mm more
    const sumH = inf => inf.reduce((a, x) => a + x.h, 0);
    const FIT_MIN = 0.87;                       // 1.9.3: a document that overflows by up to ~15 % is gathered on one sheet (slightly reduced) instead of leaving a few lines alone on a second one
    if (o.fit !== false && headH + sumH(info) > full) {
      if (headH + sumH(info) <= fullOne) {
        return [`${o.cls ? `<!--cls:${o.cls}-->` : ''}${wrap(o.head || '')}${blocks.map(b => wrap(b.table ? tblHtml(b, b.table.rows) : b.html)).join('')}<div class="spacer"></div>`];
      }
      const vis = z => { setScale(z); const m = measure(); return headH + z * sumH(m.info); };
      let lo = FIT_MIN, hi = 0.99, best = 0;
      if (vis(FIT_MIN) <= fullOne - 2) {
        best = FIT_MIN;
        for (let k = 0; k < 7; k++) { const mid = (lo + hi) / 2; if (vis(mid) <= fullOne - 2) { best = mid; lo = mid; } else hi = mid; }
      }
      if (best) {
        const z = Math.floor(best * 1000) / 1000, hv = vis(z) - headH;
        const inner = blocks.map(b => wrap(b.table ? tblHtml(b, b.table.rows) : b.html)).join('');
        setScale(1);
        return [`${o.cls ? `<!--cls:${o.cls}-->` : ''}${wrap(o.head || '')}<div class="fit" style="height:${Math.ceil(hv) + 2}px"><div class="fit-in" style="width:${(100 / z).toFixed(3)}%;transform:scale(${z})">${inner}</div></div><div class="spacer"></div>`];
      }
      setScale(1);
    }
    pg.style.width = '';
    // 1.9.3: «حرر في… + signature» is never left alone on a page: the blocks that lead to it (the last rows of a table, the closing paragraphs) travel with it
    const SIGN_RX = /class="[^"]*\b(?:sb-sign|mk-sign|att-sign|rp-sig3?|ct-foot|ct-sig|sig-keep|lt-sign|kd-sign)\b/;
    const isSign = e => !e.b.table && (e.b.sign === true || SIGN_RX.test(String(e.b.html || '')));
    const list = blocks.map((b, i) => ({ b, m: info[i] }));
    const signIdx = () => { for (let j = Math.max(0, list.length - 3); j < list.length; j++) if (isSign(list[j])) return j; return -1; };
    // the block just before the signature (a paragraph, a note) travels with it: height of that block + the signature, counted from block i
    const chainFrom = (i, sIdx) => {
      if (sIdx < 0 || i !== sIdx - 1 || list[i].b.table) return 0;
      return list[i].m.h + list[sIdx].m.h;
    };

    /* ---- splitting a text block at a line / paragraph boundary, so that the bottom of a page is filled ----
       e: list entry (non table block), roomPx: free height. Returns { first, rest, hFirst, hRest } (html) or null.
       Rules: ≥ 2 lines stay on the page, ≥ 1 line goes on, a heading never stays alone at the bottom, boxes / tables / figures are never cut. */
    const MIN_LINES = 2;
    const lhOf = el => { const c = d.defaultView.getComputedStyle(el); const v = parseFloat(c.lineHeight); return isFinite(v) ? v : parseFloat(c.fontSize) * 1.5; };
    const mkHost = html => { const h = d.createElement('div'); h.className = 'fb'; h.innerHTML = html; pg.appendChild(h); return h; };
    const hOfHtml = html => { const h = mkHost(html); const v = H(h); h.remove(); return v; };
    const isHead = el => el.tagName && (/^H[1-6]$/.test(el.tagName) || /\b(?:sb-cap|rp-h|sb-ttl|sb-sub|keep-next)\b/.test(el.className || ''));
    const plainInline = el => !el.querySelector('table,svg,img,div,p,ul,ol,li,canvas,hr,figure');
    const boxy = el => { const c = d.defaultView.getComputedStyle(el); return parseFloat(c.borderTopWidth) > 0 || parseFloat(c.borderBottomWidth) > 0 || (c.backgroundColor && c.backgroundColor !== 'rgba(0, 0, 0, 0)' && c.backgroundColor !== 'transparent') || c.display === 'grid' || c.display === 'flex' || c.display === 'table'; };
    function lineCut(el, limAbs) {
      // text nodes of the paragraph
      const tw = d.createTreeWalker(el, 4), nodes = []; let N = 0;
      for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!/\S/.test(n.nodeValue) && !n.nodeValue.length) continue; nodes.push({ n, s: N }); N += n.nodeValue.length; }
      if (N < 8) return null;
      const at = idx => { let k = nodes.length - 1; while (k > 0 && nodes[k].s > idx) k--; return [nodes[k].n, idx - nodes[k].s]; };
      const rg = d.createRange();
      const rectOf = idx => { for (let j = idx; j < N; j++) { const [nd, off] = at(j); rg.setStart(nd, off); rg.setEnd(nd, off + 1); const r = rg.getBoundingClientRect(); if (r.height > 1) return r; } return null; };
      const lh = lhOf(el), top0 = el.getBoundingClientRect().top;
      const lastR = rectOf(N - 1) || el.getBoundingClientRect();
      const totalLines = Math.max(1, Math.round((lastR.bottom - top0) / lh));
      // first character whose line ends below the limit
      let lo = 0, hi = N - 1, over = -1;
      while (lo <= hi) { const mid = (lo + hi) >> 1; const r = rectOf(mid); if (!r) { hi = mid - 1; continue; } if (r.bottom > limAbs + 0.5) { over = mid; hi = mid - 1; } else lo = mid + 1; }
      if (over <= 0) return null;
      // back to the first character of that line
      const ro = rectOf(over); let c = over;
      while (c > 0) { const rp = rectOf(c - 1); if (!rp || Math.abs(rp.top - ro.top) > lh * 0.45) break; c--; }
      const before = Math.round((ro.top - top0) / lh), after = totalLines - before;
      if (c <= 0 || before < MIN_LINES || after < 1) return null;   // ≥ 2 lines stay at the bottom, at least one goes on
      return { c, at, before };
    }
    // cuts a copy of el at character index c (counted over its text nodes): returns [first, second] elements, with the open inline tags closed / reopened
    function cutAt(el, c) {
      const clone = el.cloneNode(true);
      const tw = d.createTreeWalker(clone, 4), nds = []; let N = 0;
      for (let n = tw.nextNode(); n; n = tw.nextNode()) { if (!/\S/.test(n.nodeValue) && !n.nodeValue.length) continue; nds.push({ n, s: N }); N += n.nodeValue.length; }
      let q = nds.length - 1; while (q > 0 && nds[q].s > c) q--;
      const rg2 = d.createRange(); rg2.selectNodeContents(clone); rg2.setStart(nds[q].n, c - nds[q].s);
      const tail = rg2.extractContents();
      const second = el.cloneNode(false); second.appendChild(tail);
      if (/justify/.test(d.defaultView.getComputedStyle(el).textAlign)) clone.style.textAlignLast = 'justify';
      return [clone, second];
    }
    // a table row taller than the free space: its cells are cut at the same height (every cell keeps ≥ 2 lines on the page and ≥ 2 on the next). Returns [row1, row2, h1, h2] or null
    function splitRow(b, rowHtml, availPx) {
      const host = mkHost(tblHtml(b, [rowHtml]));
      try {
        const tr = host.querySelector('tbody tr');
        if (!tr || tr.querySelector('[rowspan]')) return null;
        const lim = tr.getBoundingClientRect().top + availPx - 4;
        const f1 = [], f2 = []; let any = false;
        for (const td of Array.from(tr.cells)) {
          const empty = td.cloneNode(false); empty.innerHTML = '';
          const crg = d.createRange(); crg.selectNodeContents(td);
          const cbot = (/\S/.test(td.textContent) || td.querySelector('img,svg') ? crg.getBoundingClientRect().bottom : td.getBoundingClientRect().top) + parseFloat(d.defaultView.getComputedStyle(td).paddingBottom);
          if (cbot <= lim + 0.5) { f1.push(td.outerHTML); f2.push(empty.outerHTML); continue; }
          if (!plainInline(td) || !/\S/.test(td.textContent)) return null;
          const lc = lineCut(td, lim); if (!lc) return null;
          const [a, z] = cutAt(td, lc.c); f1.push(a.outerHTML); f2.push(z.outerHTML); any = true;
        }
        if (!any) return null;
        const sh = tr.cloneNode(false).outerHTML, k = sh.lastIndexOf('</');
        const row1 = sh.slice(0, k) + f1.join('') + sh.slice(k), row2 = sh.slice(0, k) + f2.join('') + sh.slice(k);
        const rowH = html => { const h2 = mkHost(tblHtml(b, [html])); const v = H(h2.querySelector('tbody tr')); h2.remove(); return v; };
        const h1 = rowH(row1), h2 = rowH(row2);
        if (h1 > availPx + 0.5) return null;
        return [row1, row2, h1, h2];
      } finally { host.remove(); }
    }
    function splitBlock(e, roomPx, minRestPx) {
      const b = e.b; if (b.table || b.noSplit) return null;
      const host = mkHost(b.html);
      try {
        const topAbs = host.getBoundingClientRect().top, lim = topAbs + roomPx;
        let root = host, kids = Array.from(root.children);
        if (Array.from(root.childNodes).some(n => n.nodeType === 3 && /\S/.test(n.nodeValue))) return null;
        if (kids.length === 1 && kids[0].tagName === 'DIV' && !boxy(kids[0]) && kids[0].children.length >= 2 && !kids[0].querySelector('table,svg,img')) { root = kids[0]; kids = Array.from(root.children); }
        if (!kids.length) return null;
        if (root !== host && Array.from(root.childNodes).some(n => n.nodeType === 3 && /\S/.test(n.nodeValue))) return null;
        const shell = root === host ? ['', ''] : (() => { const s = root.cloneNode(false).outerHTML; const k = s.lastIndexOf('</'); return [s.slice(0, k), s.slice(k)]; })();
        let k = kids.findIndex(x => x.getBoundingClientRect().bottom > lim + 0.5);
        if (k < 0) return null;
        const part1 = [], part2 = [];
        const el = kids[k];
        let done = false;
        if (el.tagName === 'TABLE' && el.tBodies[0] && el.tBodies[0].rows.length >= 3 && !el.querySelector('[rowspan]') && !el.tFoot) {
          // a table inside a text block: cut between two rows (the header row is repeated); at least two rows stay and one goes on
          const rows = Array.from(el.tBodies[0].rows), j = rows.findIndex(r => r.getBoundingClientRect().bottom > lim + 0.5);
          if (j >= 2) {
            const c1 = el.cloneNode(true), c2 = el.cloneNode(true);
            Array.from(c1.tBodies[0].rows).forEach((r, q) => { if (q >= j) r.remove(); });
            Array.from(c2.tBodies[0].rows).forEach((r, q) => { if (q < j) r.remove(); });
            part1.push(...kids.slice(0, k).map(x => x.outerHTML), c1.outerHTML);
            part2.push(c2.outerHTML, ...kids.slice(k + 1).map(x => x.outerHTML));
            done = true;
          }
        } else if (!boxy(el) && plainInline(el) && /\S/.test(el.textContent)) {
          const lc = lineCut(el, lim);
          if (lc) {
            const [clone, second] = cutAt(el, lc.c);
            part1.push(...kids.slice(0, k).map(x => x.outerHTML), clone.outerHTML);
            part2.push(second.outerHTML, ...kids.slice(k + 1).map(x => x.outerHTML));
            done = true;
          }
        }
        if (!done) {
          let cut = k;
          while (cut > 0 && isHead(kids[cut - 1])) cut--;       // a heading goes with what follows
          if (cut <= 0) return null;
          part1.push(...kids.slice(0, cut).map(x => x.outerHTML)); part2.push(...kids.slice(cut).map(x => x.outerHTML));
        }
        if (!part1.length || !part2.length) return null;
        const first = shell[0] + part1.join('') + shell[1], rest = shell[0] + part2.join('') + shell[1];
        const hFirst = hOfHtml(first), hRest = hOfHtml(rest);
        if (hFirst > roomPx + 0.5 || hFirst < 1.8 * lhOf(host) || hRest < 0.9 * lhOf(host)) return null;
        if (minRestPx && hRest < minRestPx) return null;
        return { first, rest, hFirst, hRest };
      } finally { host.remove(); }
    }

    const pages = [[]];
    let used = headH;
    const room = () => full - used;
    const newPage = () => { pages.push([]); used = 0; };
    for (let i = 0; i < list.length; i++) {
      const e = list[i], b = e.b, m = e.m;
      if (!b.table) {
        // a heading stays with the beginning of the next block
        let need = m.h;
        const nx = b.keepNext ? list[i + 1] : null;
        if (nx) need += nx.m.rows ? nx.m.pre + nx.m.th + nx.m.rows.slice(0, 2).reduce((a, c) => a + c, 0) : Math.min(nx.m.h, 3.4 * lhOf(pg));
        const sIdx = signIdx();
        let ch = chainFrom(i, sIdx);
        if (ch && !(ch < full * 0.8)) ch = 0;
        need = Math.max(need, ch);
        // a heading followed by a text block that neither fits nor can be cut: both go to the next page
        let lonely = false;
        if (nx && !nx.m.rows && need <= room() && nx.m.h > room() - m.h) lonely = !splitBlock(nx, room() - m.h, 0);
        if ((need > room() || lonely) && pages[pages.length - 1].length) {
          // does not fit: fill the bottom of this page with the first lines / paragraphs and carry the rest over
          const sp = room() > 3 * lhOf(pg) ? splitBlock(e, room(), 0) : null;
          if (sp) {
            pages[pages.length - 1].push(sp.first); used += sp.hFirst;
            list.splice(i + 1, 0, { b: Object.assign({}, b, { html: sp.rest, keepNext: false }), m: { h: sp.hRest } });
            newPage();
            continue;
          }
          newPage();
        }
        pages[pages.length - 1].push(b.html); used += m.h;
        continue;
      }
      // splittable table: header row repeated on every page
      const rowsHtml = b.table.rows.slice(), rowsH = m.rows.slice();
      let r = 0, n = rowsH.length;
      const minR = Math.min(n, b.minRows == null ? 2 : b.minRows);
      const firstNeed = m.pre + m.th + rowsH.slice(0, minR).reduce((a, c) => a + c, 0);
      // a first row taller than the free space is cut across the two pages (below); otherwise the heading + the first rows move together
      if (firstNeed > room() && pages[pages.length - 1].length && m.pre + m.th + (rowsH[0] || 0) <= room()) newPage();
      let first = true;
      const tailSign = (signIdx() === i + 1) ? list[i + 1].m.h : 0;   // the signature that directly follows this table travels with its last rows
      while (r < n || first) {
        let h = (first ? m.pre : 0) + m.th, k = r;
        while (k < n && h + rowsH[k] <= room()) { h += rowsH[k]; k++; }
        if (k === r && k < n) {
          if (pages[pages.length - 1].length) {
            // fill the page with the beginning of a tall row (a cell holding a long text)
            const sp = room() - h > 4 * lhOf(pg) ? splitRow(b, rowsHtml[r], room() - h) : null;
            if (sp) { rowsHtml.splice(r, 1, sp[0], sp[1]); rowsH.splice(r, 1, sp[2], sp[3]); n++; continue; }
            newPage(); continue;
          }
          h += rowsH[k]; k++;
        }
        if (tailSign && k >= n && h + m.extra + tailSign > room()) {
          // the rest of the table does not leave room for the signature: its last rows go to the next page with it
          if (k - r > 2) { k -= 2; h -= rowsH[k] + rowsH[k + 1]; }
          else if (pages[pages.length - 1].length) { newPage(); continue; }
        }
        const part = Object.assign({}, b, { before: first ? b.before : '', table: Object.assign({}, b.table, { rows: rowsHtml.slice(r, k) }) });
        pages[pages.length - 1].push(tblHtml(part, part.table.rows));
        used += h + (k >= n ? m.extra : 0);
        r = k; first = false;
        if (r < n) newPage();
      }
    }
    const total = pages.length;
    const mk = o.cls ? `<!--cls:${o.cls}-->` : '';
    return pages.map((p, pi) => `${mk}${pi === 0 ? wrap(o.head || '') : ''}${p.map(wrap).join('')}<div class="spacer"></div>${total > 1 && o.pno !== false ? `<div class="mk-pno" dir="ltr">${pi + 1} / ${total}</div>` : ''}`);
  }

  /* simple bar chart (SVG) — values: [{label, v (number|null)}], alert: threshold drawn in red */
  function svgBars(values, o) {
    o = o || {};
    const W = o.w || 640, Hh = o.h || 220, padB = 34, padT = 18, padS = 34;
    const vals = values.map(x => (x.v == null || !isFinite(x.v)) ? null : +x.v);
    const max = Math.max(o.min || 1, ...vals.filter(v => v != null)) * 1.15;
    const n = values.length || 1, bw = (W - padS - 10) / n;
    const y = v => padT + (Hh - padT - padB) * (1 - v / max);
    const ticks = 4;
    let s = `<svg class="mk-chart" viewBox="0 0 ${W} ${Hh}" width="100%" xmlns="http://www.w3.org/2000/svg" font-family="MAJ, NSA, sans-serif" direction="ltr">`;
    for (let t = 0; t <= ticks; t++) { const v = max * t / ticks, yy = y(v); s += `<line x1="${padS}" x2="${W - 6}" y1="${yy}" y2="${yy}" stroke="#d5d9d7" stroke-width="0.7"/><text x="${padS - 4}" y="${yy + 3.5}" font-size="9" text-anchor="end" fill="#555">${v.toFixed(v < 10 ? 1 : 0)}</text>`; }
    values.forEach((x, i) => {
      // right-to-left: first value on the right
      const cx = W - 6 - bw * (i + .5), v = vals[i];
      if (v != null) {
        const hot = o.alert != null && v > o.alert;
        s += `<rect x="${cx - bw * .32}" y="${y(v)}" width="${bw * .64}" height="${Math.max(0, Hh - padB - y(v))}" fill="${hot ? '#c0392b' : (o.color || '#2f6f5e')}" rx="1.5"/>`;
        s += `<text x="${cx}" y="${y(v) - 4}" font-size="9.5" text-anchor="middle" font-weight="700" fill="#222">${v.toFixed(2)}</text>`;
      } else s += `<text x="${cx}" y="${Hh - padB - 4}" font-size="9" text-anchor="middle" fill="#888">-</text>`;
      s += `<text x="${cx}" y="${Hh - padB + 14}" font-size="${o.fs || 10}" text-anchor="middle" direction="rtl" fill="#111">${esc(x.label)}</text>`;
    });
    if (o.alert != null && o.alert < max) s += `<line x1="${padS}" x2="${W - 6}" y1="${y(o.alert)}" y2="${y(o.alert)}" stroke="#c0392b" stroke-width="1" stroke-dasharray="4 3"/>`;
    s += `<line x1="${padS}" x2="${W - 6}" y1="${Hh - padB}" y2="${Hh - padB}" stroke="#333" stroke-width="1"/></svg>`;
    return s;
  }

  // reports (communication with partners, attendance)
  Dx.modCss += `
  .fb{flex:none}.fit{flex:none;position:relative}.fit-in{position:absolute;top:0;right:0;transform-origin:top right;display:flex;flex-direction:column}
  .rp{font-size:10pt;line-height:1.55}
  .rp-t{text-align:center;border:1.6px solid #1f4e44;border-radius:3mm;padding:1.4mm 6mm 1.6mm;margin:0 0 2.6mm;background:#eef4f1}
  .rp-t .t1{font-family:'MAJT','Amiri',serif;font-weight:700;font-size:16pt;line-height:1.35;color:#123b33}
  .rp-t .t2{font-weight:700;font-size:10.6pt;line-height:1.45}.rp-t .t3{font-size:9pt;line-height:1.4;color:#333}
  .rp-h{font-weight:700;font-size:11pt;margin:2.4mm 0 1.2mm;padding:.5mm 2.2mm;background:#e3ece8;border-right:2.2mm solid #1f4e44;line-height:1.5}
  .rp-sh{font-weight:700;margin:1.4mm 0 .5mm;text-decoration:underline;text-underline-offset:1mm}
  .rp-p{text-align:justify;margin:0 0 .7mm}
  .rp-li{position:relative;padding-right:5mm;margin:0 0 .5mm;text-align:justify}.rp-li:before{content:'';position:absolute;right:1.2mm;top:2.3mm;width:1.5mm;height:1.5mm;border-radius:50%;background:#000}
  .rp-ol{position:relative;padding-right:6mm;margin:0 0 .5mm}.rp-ol .n{position:absolute;right:0;font-weight:700}
  .rp-dots{border-bottom:1px dotted #444;height:6.2mm;margin:0 0 .4mm}
  .rp-kv{display:flex;flex-wrap:wrap;column-gap:6mm;margin:0 0 .6mm}.rp-kv .lb{font-weight:700}
  .rp-g td{text-align:right;height:6.6mm}.rp-g td.k{background:#eef2f0;font-weight:700;white-space:nowrap;width:1%}
  .rp .tbl{font-size:9pt}.rp .tbl td.r{text-align:right}
  .rp-cbs{display:flex;flex-wrap:wrap;column-gap:7mm;row-gap:.4mm;margin:0 0 .6mm}.rp-cbs .cb{margin-left:1.2mm}
  .rp-sig{display:grid;gap:4mm;margin-top:3mm}.rp-sig>div{border:1px solid #000;min-height:26mm;padding:1mm 2mm;text-align:center;font-weight:700;font-size:9.4pt}
  .rp-sig>div .nm{font-weight:400;margin-top:1mm}
  .rp-sig3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:4mm;margin-top:4mm;text-align:center;font-weight:700;min-height:22mm}
  .rp-note{border:1px solid #1f4e44;border-radius:2mm;padding:1mm 3mm;font-size:8.8pt;margin-top:3mm;text-align:center}
  .rp-photos{display:grid;grid-template-columns:1fr 1fr;gap:3mm;margin:1mm 0}.rp-photos img{width:100%;height:58mm;object-fit:cover;border:1px solid #999;display:block}
  .rp-place{text-align:left;font-weight:700;margin:0 0 1.5mm}
  .rp-ttl{text-align:center;font-family:'MAJT','Amiri',serif;font-weight:700;font-size:15pt;line-height:1.4;margin:1mm 0 0}
  .rp-ttl2{text-align:center;font-weight:700;font-size:11pt;margin:0 0 2mm}
  .rp-agenda .it{margin:0 0 1.4mm}.rp-agenda .it .q{font-weight:700}
  .att-tbl{font-size:8.6pt}.att-tbl th{font-size:8pt;padding:.5mm .4mm;height:auto}.att-tbl td{height:5.7mm;padding:.3mm .5mm}
  .att-tbl td.hot{color:#b00000;font-weight:700}.att-tbl tr.tot td{font-weight:700;background:#f2f2f2}
  .att-kpi{display:flex;justify-content:center;gap:8mm;margin:2mm 0;font-size:10.5pt}.att-kpi b{font-size:12pt}
  .mk-chart{display:block;margin:1mm auto 0;max-height:75mm}
  .hol-print td.r{text-align:right}.hol-print td{height:8mm}
  .roz-pt td.r{text-align:right}.roz-pt td{height:6.6mm}.roz-pt tr.tot td{font-weight:700;background:#f2f2f2}
  .rz-kp{flex-wrap:wrap;gap:3mm 7mm;font-size:9.6pt;margin:1mm 0 2mm}.rz-kp b{font-size:11pt}
  .rz-row{display:flex;gap:4mm;align-items:center}.rz-col{min-width:0}.rz-one{margin:1mm 0}
  .rz-cap{text-align:center;font-weight:700;font-size:9.5pt;margin:0 0 2mm}.rz-cap small{font-weight:400;font-size:8pt;color:#444}
  .rz-gauge{max-width:64mm;margin:0 auto}.rz-hbars,.rz-stack,.rz-line{max-height:none}
  table.rz-pt{width:100%;border-collapse:collapse;font-size:9pt}.rz-pt th,.rz-pt td{border:.3mm solid #444;padding:.6mm 1mm;text-align:center;height:6.4mm}.rz-pt th{background:#e7ecf5;font-size:8.6pt}.rz-pt td.b{text-align:right;font-weight:700}
  .rz-pt .rz-up{color:#0e7a4b;font-weight:700}.rz-pt .rz-dn{color:#b00000;font-weight:700}
  .rz-notes-p ul{margin:0 0 2mm;padding-inline-start:6mm;line-height:1.9;font-size:10pt}.rz-defs{font-size:8.4pt;color:#444;line-height:1.7;margin:1mm 0 0}
  .att-sign{display:grid;grid-template-columns:1fr 1fr;margin-top:2mm;min-height:17mm;line-height:1.8}
  `;

  /* ---------- generic document page (form on the right, live preview on the left) ----------
     cfg: { title, icon, back(), modes: true (A5 two copies / single) | false, form(box, st, refresh), build(st) -> {page, pages},
            fname(st), validate(st) -> bool, beforeOutput(st) -> Promise<bool>, saveLabel, onSave(st) } */
  function docPage(v, cfg) {
    const st = Object.assign({}, cfg.state || {});
    if (!st.mode) st.mode = (DB && DB.settings && DB.settings.twoCopies === false) ? 'single' : 'two';
    v.innerHTML = `
      <div class="page-h">
        <button class="btn" id="mkBack">${ic('back')} رجوع</button>
        <h1>${cfg.icon || ''} ${cfg.title}</h1>
        <span class="sp"></span>
        ${cfg.modes ? '<div class="seg" id="mkMode"><button data-m="two">نسختان (A4 أفقي)</button><button data-m="single">نسخة واحدة (A4)</button></div>' : ''}
        ${cfg.onSave ? `<button class="btn" id="mkSave">${ic('save')} ${cfg.saveLabel || 'حفظ'}</button>` : ''}
        ${cfg.word !== false && window.APP_WORD !== false ? `<button class="btn" id="mkWord" style="display:none" title="تحويل الوثيقة إلى ملف Word قابل للتعديل (بعد التفعيل)">${ic('file')} حفظ Word</button>` : ''}
        ${window.DocCustom && cfg.custom !== false ? `<select class="inp" id="mkVar" style="width:auto;max-width:200px" title="النسخة المستعملة"></select><button class="btn" id="mkCust" title="نسخة خاصة بمؤسستك من هذه الوثيقة مع بقاء الأصل">${ic('edit')} تخصيص النموذج</button>` : ''}
        ${window.Stamp ? Stamp.chk() : ''}
        <button class="btn" id="mkPdf">${ic('pdf')} حفظ PDF</button>
        <button class="btn pri" id="mkPrint">${ic('print')} طباعة</button>
      </div>
      <div class="editor">
        <div class="card form"><div class="card-b" id="mkForm"></div></div>
        <div class="prev-wrap mk-prev"><div class="prev-box" id="mkBox"><iframe id="mkFrame"></iframe>${LIC.active ? '' : `<div class="wm"><span>${(typeof licText!=='undefined'?licText():(LIC.reason==='expired'?'انتهت صلاحية التفعيل':'نسخة غير مفعلة'))}</span></div>`}</div></div>
      </div>`;
    const frame = $('#mkFrame'), box = $('#mkBox');
    let built = null;
    const pageType = () => (built.page === 'two' || !built.page) ? (st.mode === 'single' ? 'single' : 'two') : built.page;
    const land = () => !!built && (pageType() === 'a4l' || pageType() === 'two');
    const vkey = 'p:' + cfg.title;
    const selMap = () => { const g = (DB.settings = DB.settings || {}); return (g.docVariantSel = g.docVariantSel || {}); };
    let variant = null;
    const pickVariant = () => { const id = selMap()[vkey]; variant = id && window.DocCustom ? DocCustom.byId(id) : null; if (variant && variant.type !== vkey) variant = null; };
    const rawHtml = () => Dx.buildRaw({ page: pageType(), pages: built.pages, title: cfg.title, base: BASE, cls: built.cls });
    const html = () => Dx.bidi(variant && window.DocCustom ? DocCustom.apply(rawHtml(), variant.rules) : rawHtml());
    const drawVar = () => {
      const sel = $('#mkVar'); if (!sel) return;
      pickVariant();
      const L = DocCustom.byType(vkey);
      sel.style.display = L.length ? '' : 'none';
      sel.innerHTML = `<option value="">النموذج الأصلي</option>` + L.map(x => `<option value="${esc(x.id)}" ${variant && variant.id === x.id ? 'selected' : ''}>${esc(x.name)}</option>`).join('');
    };
    const layout = () => {
      if (!built) return;
      const L = land();
      const W = L ? 1123 : 794, H = L ? 794 : 1123;
      const n = Math.max(1, built.pages.length);
      const avail = box.parentElement.clientWidth - 32;
      const sc = Math.min(avail / W, 1.25);
      frame.style.width = W + 'px'; frame.style.height = H * n + 'px';
      frame.style.transform = `scale(${sc})`;
      box.style.width = W * sc + 'px'; box.style.height = H * n * sc + 'px';
    };
    let rt = null;
    const wordOn = () => window.APP_WORD !== false && cfg.word !== false && (typeof cfg.word === 'function' ? !!cfg.word(st) : true); // 1.9.2: every document can be saved in Word
    const showWord = () => { const b = $('#mkWord'); if (b) b.style.display = wordOn() ? '' : 'none'; };
    const refresh = () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        showWord();
        built = cfg.build(st);
        layout();
        frame.srcdoc = html().replace('</style>', '@media screen{.page-a4,.page-a4l,.sheet{outline:1px dashed #b9c2be;outline-offset:-1px}}</style>');
      }, 100);
    };
    cfg.form($('#mkForm'), st, refresh);
    if ($('#mkVar')) {
      drawVar();
      $('#mkVar').onchange = e => { selMap()[vkey] = e.target.value; persist(); pickVariant(); refresh(); };
      $('#mkCust').onclick = () => { if (!built) built = cfg.build(st); pickVariant(); DocCustom.dialog({ type: vkey, title: cfg.title, v: variant, html: rawHtml(), cb: nv => { selMap()[vkey] = nv ? nv.id : ''; persist(); drawVar(); refresh(); } }); };
    }
    if (cfg.modes) {
      const drawMode = () => $$('#mkMode button').forEach(b => b.classList.toggle('on', b.dataset.m === st.mode));
      $$('#mkMode button').forEach(b => b.onclick = () => { st.mode = b.dataset.m; drawMode(); refresh(); });
      drawMode();
    }
    const out0 = async kind => {
      if (cfg.validate && !cfg.validate(st)) return;
      built = cfg.build(st);
      if (cfg.beforeOutput && (await cfg.beforeOutput(st)) === false) return;
      built = cfg.build(st);
      const nm = (cfg.fname ? cfg.fname(st) : cfg.title).replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, '');
      if (kind === 'word') {
        if (!LIC.active) return lockedBox();
        // 1.9.3: a page that was scaled to fit the sheet (.fit) is given back its natural size: Word flows the content by itself
        const wordHtml = h => h.replace(/<\/style>(?![\s\S]*<\/style>)/, '.fit{height:auto!important;position:static!important}.fit-in{position:static!important;transform:none!important;width:auto!important}</style>');
        const w = await window.api.docx(wordHtml(window.Stamp ? Stamp.strip(html()) : html()), nm);
        if (w && w.locked) return lockedBox();
        if (w && w.ok) toast('تم حفظ الوثيقة بصيغة Word'); else if (w && w.err) toast('تعذر إنشاء ملف Word', true);
        refresh(); return;
      }
      const r = kind === 'print' ? await window.api.print(html(), land()) : await window.api.pdf(html(), land(), (cfg.fname ? cfg.fname(st) : cfg.title).replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, ''));
      if (r && r.locked) return lockedBox();
      if (r && r.ok) toast(kind === 'print' ? 'تم إرسال الوثيقة إلى الطابعة' : 'تم حفظ الملف PDF');
      if (r && r.ok && cfg.afterOut) { try { html(); cfg.afterOut(st, kind); } catch (e) { console.error(e); } }
      refresh();
    };
    // 1.9.4: the document is told which output is requested (st.out), e.g. real pictures for Word, a lighter page for the screen
    const out = async kind => { st.out = kind; try { return await out0(kind); } finally { st.out = ''; } };
    if ($('#stmChk')) $('#stmChk').onchange = e => { Stamp.set(e.target.checked); refresh(); };
    $('#mkPrint').onclick = () => out('print');
    if ($('#mkWord')) $('#mkWord').onclick = () => out('word');
    $('#mkPdf').onclick = () => out('pdf');
    if ($('#mkSave')) $('#mkSave').onclick = async () => { if (cfg.validate && !cfg.validate(st)) return; await cfg.onSave(st); refresh(); };
    $('#mkBack').onclick = () => cfg.back();
    window.onresize = () => layout();
    refresh();
    // flowing documents are measured with the document fonts: build again once they are loaded
    if (cfg.flow) fontsReady().then(() => { if (frame.isConnected) refresh(); });
    return { st, refresh };
  }

  /* ---------- Excel helpers ---------- */
  // header row = first row (within the first 15) holding at least `min` known titles
  function headerRow(rows, keyOf, min) {
    for (let i = 0; i < Math.min(rows.length, 15); i++) {
      const m = (rows[i] || []).map(keyOf);
      if (m.filter(Boolean).length >= (min || 2)) return { hi: i, map: m };
    }
    return null;
  }
  // rows of every sheet of an opened table (CSV or Excel)
  const allSheets = res => {
    if (res.sheets && res.sheets.length) return res.sheets.map(s => ({ name: s.name, rows: (s.rows || []).map(r => (r || []).map(x => String(x == null ? '' : x).trim())) }));
    const rows = (res.rows || parseCsv(res.text || '')).map(r => (r || []).map(x => String(x == null ? '' : x).trim()));
    return [{ name: '', rows }];
  };
  // 1.9.3 — every import accepts several files at once. Returns [{ name, sheets:[{ name, rows }] }] (null when cancelled / nothing readable)
  async function openFiles() {
    if (window.api.openTables) {
      const res = await window.api.openTables({ csv: true });
      if (!res) return null;
      const locked = res.locked || [], bad = (res.errors || []).filter(n => !locked.includes(n));
      const files = (res.files || []).map(f => ({ name: f.name || '', sheets: allSheets(f) }));
      if (locked.length) toast('ملف xls محمي بكلمة سر (احفظ نسخة منه بدون كلمة سر ثم أعد المحاولة): ' + locked.join('، '), true);
      else if (!files.length) toast(bad.length ? 'تعذرت قراءة الملفات المختارة: ' + bad.join('، ') : 'تعذرت قراءة الملفات المختارة', true);
      else if (bad.length) toast('تعذرت قراءة: ' + bad.join('، '), true);
      return files.length ? files : null;
    }
    const res = await window.api.openTable();
    if (!res || (res.text == null && !res.rows && !res.error)) return null;
    if (res.error === 'xls-pw') { toast('ملف xls محمي بكلمة سر. احفظ نسخة منه بدون كلمة سر ثم أعد المحاولة.', true); return null; }
    if (res.error === 'xls') { toast('تعذرت قراءة ملف xls. احفظه في Excel بصيغة xlsx ثم أعد المحاولة.', true); return null; }
    if (res.error) { toast('تعذرت قراءة ملف Excel', true); return null; }
    return [{ name: res.name || '', sheets: allSheets(res) }];
  }
  // the sheets of all the chosen files in one list (each sheet keeps the name of its file in .file)
  async function openTable() {
    const files = await openFiles(); if (!files) return null;
    return [].concat(...files.map(f => f.sheets.map(sh => Object.assign({}, sh, { file: f.name }))));
  }
  const hkey = h => normHead(h);
  // builds a header matcher from { key: [titles...] }
  // (built lazily: normHead lives in app.js, loaded after the modules)
  const matcher = spec => {
    let idx = null;
    return h => {
      if (!idx) { idx = []; Object.entries(spec).forEach(([k, arr]) => arr.forEach(t => idx.push([hkey(t), k]))); }
      const n = hkey(h); if (!n) return null; const f = idx.find(x => x[0] === n); return f ? f[1] : null;
    };
  };

  // reports and minutes (since 1.9.2 every document is offered in Word; kept for the modules that test it)
  const WORD_RX = /تقرير|التقرير|تقارير|محضر|محاضر|الجمع العام/;
  window.MK = { wordRx: t => WORD_RX.test(String(t || '')), pad2, schoolYear, syBounds, showDate, num, fmtQty, signBlock, tablePages, docPage, headerRow, openTable, openFiles, allSheets, matcher, hkey, flowPages, fontsReady, svgBars };
})();
