/* Converts the document rendered in the page (A4 pages made by Docs.buildRaw) into WordprocessingML.
   This file is NOT loaded by index.html: main.js injects it into the hidden document window used for PDF export
   and receives { body, rels, media } from it (the package itself is zipped by main.js).
   Everything is read from the real layout (getBoundingClientRect / getComputedStyle), so tables, spans,
   colours, borders, images and right-to-left text follow what the user sees in the preview. */
(async () => {
  const PX = 15, EMU = 9525; // 1 CSS px = 15 twips = 9525 EMU
  const esc = s => String(s).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F￾￿]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cs = el => getComputedStyle(el);
  const px = v => { const n = parseFloat(v); return isFinite(n) ? n : 0; };
  const tw = v => Math.round(px(v) * PX);
  const hex = c => {
    const m = /rgba?\(([^)]+)\)/.exec(c || ''); if (!m) return null;
    const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number);
    if (p.length > 3 && p[3] < 0.05) return null;
    return p.slice(0, 3).map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase();
  };
  const media = [], rels = [], imgCache = new Map();
  let drawId = 1;
  const SKIP = el => el.classList && (el.classList.contains('mk-pno') || el.classList.contains('spacer') || el.classList.contains('no-word'));

  /* ---------- fonts / runs ---------- */
  const fontOf = fam => {
    const f = String(fam || '').split(',')[0].replace(/["']/g, '').trim();
    if (/^MAJT?$/.test(f)) return 'Sakkal Majalla';
    if (/amiri|serif|times|naskh/i.test(f) && !/sans/i.test(f)) return 'Traditional Arabic';
    if (/^tif/i.test(f)) return 'Ebrima';
    if (!f || /nsa|noto|segoe|tahoma|arial|sans|inherit/i.test(f)) return 'Arial';
    return f;
  };
  const AR = /[֐-ࣿיִ-﷿ﹰ-﻿]/, TF = /[ⴰ-⵿]/;
  const splitScript = t => { // arabic-script segments (rtl) vs the rest, neutrals stay with the previous segment
    const out = []; let cur = '', rtl = null;
    for (const ch of t) {
      const a = AR.test(ch), neutral = !a && !/[A-Za-z0-9ⴰ-⵿]/.test(ch);
      const r = neutral && rtl !== null ? rtl : a;
      if (rtl !== null && r !== rtl) { out.push([cur, rtl]); cur = ''; }
      rtl = r; cur += ch;
    }
    if (cur) out.push([cur, rtl]);
    return out;
  };
  const rPr = (st, o) => {
    o = o || {};
    const tif = o.tif, f = tif ? 'Ebrima' : fontOf(st.fontFamily);
    const fam0 = String(st.fontFamily || '').split(',')[0].replace(/["']/g, '').trim();
    const adj = tif ? 1 : fam0 === 'MAJ' ? 1.28 : fam0 === 'MAJT' ? 1.2 : 1; // the size-adjust of the document fonts
    const fs = px(st.fontSize) * adj, sz = Math.max(2, Math.min(400, Math.round(fs * 0.75 * 2)));
    const bold = (+st.fontWeight >= 600) || st.fontWeight === 'bold', it = st.fontStyle === 'italic';
    const ul = /underline/.test(st.textDecorationLine || ''), strike = /line-through/.test(st.textDecorationLine || '');
    const col = hex(st.color), bg = hex(st.backgroundColor);
    return `<w:rPr><w:rFonts w:ascii="${esc(f)}" w:hAnsi="${esc(f)}" w:cs="${esc(f)}"/>${bold ? '<w:b/><w:bCs/>' : ''}${it ? '<w:i/><w:iCs/>' : ''}${strike ? '<w:strike/>' : ''}${col && col !== '000000' ? `<w:color w:val="${col}"/>` : ''}<w:sz w:val="${sz}"/><w:szCs w:val="${sz}"/>${ul ? '<w:u w:val="single"/>' : ''}${bg ? `<w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>` : ''}${o.sup ? '<w:vertAlign w:val="superscript"/>' : ''}${o.sub ? '<w:vertAlign w:val="subscript"/>' : ''}${o.rtl ? '<w:rtl/>' : ''}</w:rPr>`;
  };
  const textRuns = (text, st, o) => {
    if (!text) return '';
    return splitScript(text).map(([t, rtl]) => {
      const parts = t.split('\n');
      return parts.map((p, i) => (i ? '<w:r><w:br/></w:r>' : '') + (p ? `<w:r>${rPr(st, Object.assign({ rtl, tif: TF.test(p) }, o))}<w:t xml:space="preserve">${esc(p)}</w:t></w:r>` : '')).join('');
    }).join('');
  };

  /* ---------- images ---------- */
  const b64 = u8 => { let s = ''; const CH = 0x8000; for (let i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH)); return btoa(s); };
  const LOCAL = window.__LOCAL_IMGS || {};
  const localSrc = src => { const k = Object.keys(LOCAL).find(x => String(src || '').endsWith(x)); return k ? LOCAL[k] : src; };
  const loadImg = src => new Promise(res => { const i = new Image(); i.onload = () => res(i); i.onerror = () => res(null); i.src = localSrc(src); });
  const toPng = c => { try { return c.toDataURL('image/png'); } catch (e) { return ''; } };
  const addMedia = (key, ext, data) => {
    if (imgCache.has(key)) return imgCache.get(key);
    const id = 'rIdImg' + (media.length + 1), name = `image${media.length + 1}.${ext}`;
    media.push({ name, b64: data }); rels.push({ id, target: 'media/' + name });
    imgCache.set(key, id); return id;
  };
  const drawing = (rid, w, h, name) => {
    const cx = Math.max(1, Math.round(w * EMU)), cy = Math.max(1, Math.round(h * EMU)), id = drawId++;
    return `<w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="${cx}" cy="${cy}"/><wp:docPr id="${id}" name="${esc(name || 'Picture ' + id)}"/><wp:cNvGraphicFramePr><a:graphicFrameLocks xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="${esc(name || 'img')}"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${cx}" cy="${cy}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
  };
  const fit = (w, h) => { const m = (window.__contentW || 700) - 2; return w > m ? [m, h * m / w] : [w, h]; };
  async function imgRun(img) {
    const r0 = img.getBoundingClientRect(); if (r0.width < 1 || r0.height < 1) return '';
    const r = { width: fit(r0.width, r0.height)[0], height: fit(r0.width, r0.height)[1] };
    const src = img.currentSrc || img.src; let rid = null;
    const m = /^data:image\/(png|jpe?g);base64,(.*)$/i.exec(src);
    if (m) rid = addMedia(src.length + ':' + src.slice(-60), m[1].toLowerCase().replace('jpeg', 'jpg'), m[2]);
    else {
      const i = await loadImg(src); if (!i) return '';
      const c = document.createElement('canvas'); c.width = i.naturalWidth || Math.round(r.width * 2); c.height = i.naturalHeight || Math.round(r.height * 2);
      c.getContext('2d').drawImage(i, 0, 0, c.width, c.height);
      const u = toPng(c); if (!u) return '';
      rid = addMedia('c:' + src, 'png', u.split(',')[1]);
    }
    return drawing(rid, r.width, r.height);
  }
  async function svgRun(svg) {
    const r1 = svg.getBoundingClientRect(); if (r1.width < 4 || r1.height < 4) return '';
    const r = { width: fit(r1.width, r1.height)[0], height: fit(r1.width, r1.height)[1] };
    const cl = svg.cloneNode(true);
    cl.setAttribute('width', r.width); cl.setAttribute('height', r.height); cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    let s = new XMLSerializer().serializeToString(cl).replace(/font-family="[^"]*"/g, 'font-family="Arial, Tahoma, sans-serif"');
    const i = await loadImg('data:image/svg+xml;charset=utf-8,' + encodeURIComponent(s)); if (!i) return '';
    const k = 2, c = document.createElement('canvas'); c.width = Math.round(r.width * k); c.height = Math.round(r.height * k);
    const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(i, 0, 0, c.width, c.height);
    const u = toPng(c); if (!u) return '';
    const rid = addMedia('s:' + s.length + ':' + s.slice(0, 80) + s.slice(-80), 'png', u.split(',')[1]);
    return drawing(rid, r.width, r.height, 'Chart');
  }

  /* ---------- 1.9.2: a block drawn exactly as on screen (the «رقعة» letterhead) -> one picture ---------- */
  const unionRect = el => {
    let L = 1e9, T = 1e9, R = -1e9, B = -1e9;
    [el].concat(Array.from(el.querySelectorAll('*'))).forEach(x => { const r = x.getBoundingClientRect(); if (r.width < .5 || r.height < .5) return; L = Math.min(L, r.left); T = Math.min(T, r.top); R = Math.max(R, r.right); B = Math.max(B, r.bottom); });
    return { left: L, top: T, width: Math.max(1, R - L), height: Math.max(1, B - T) };
  };
  async function paint(el, k) {
    const R = unionRect(el), cv = document.createElement('canvas');
    cv.width = Math.ceil(R.width * k); cv.height = Math.ceil(R.height * k);
    const g = cv.getContext('2d'); g.scale(k, k); g.translate(-R.left, -R.top);
    const boxes = [el].concat(Array.from(el.querySelectorAll('*')));
    for (const x of boxes) { // borders (the brown rule of the letterhead, frames...)
      const c = cs(x), r = x.getBoundingClientRect();
      if (c.display === 'none' || c.visibility === 'hidden') continue;
      const bg = hex(c.backgroundColor); if (bg && x !== el) { g.fillStyle = '#' + bg; g.fillRect(r.left, r.top, r.width, r.height); }
      [['Top', r.left, r.top, r.width, 0], ['Bottom', r.left, r.bottom, r.width, 0], ['Left', r.left, r.top, 0, r.height], ['Right', r.right, r.top, 0, r.height]].forEach(([sd, x0, y0, w0, h0]) => {
        const w = px(c['border' + sd + 'Width']), st = c['border' + sd + 'Style']; if (!(w > 0) || st === 'none') return;
        g.fillStyle = c['border' + sd + 'Color'];
        if (sd === 'Top') g.fillRect(x0, y0, w0, w); else if (sd === 'Bottom') g.fillRect(x0, y0 - w, w0, w); else if (sd === 'Left') g.fillRect(x0, y0, w, h0); else g.fillRect(x0 - w, y0, w, h0);
      });
    }
    for (const x of el.querySelectorAll('img,svg')) {
      if (x.closest('svg') && x.tagName.toLowerCase() !== 'svg') continue;
      if (x.tagName.toLowerCase() === 'svg' && x.parentElement && x.parentElement.closest('svg')) continue;
      const r = x.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
      let src;
      if (x.tagName.toLowerCase() === 'img') src = x.currentSrc || x.src;
      else { const cl = x.cloneNode(true); cl.setAttribute('width', r.width); cl.setAttribute('height', r.height); cl.setAttribute('xmlns', 'http://www.w3.org/2000/svg'); src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(new XMLSerializer().serializeToString(cl)); }
      const im = await loadImg(src); if (im) g.drawImage(im, r.left, r.top, r.width, r.height);
    }
    for (const x of boxes) { // text, line by line, with the same fonts (loaded by the document) and the same stretching
      const own = Array.from(x.childNodes).filter(n => n.nodeType === 3 && /\S/.test(n.nodeValue));
      if (!own.length) continue;
      const c = cs(x); if (c.display === 'none' || c.visibility === 'hidden') continue;
      const rg = document.createRange(); rg.selectNodeContents(x);
      const rr = rg.getBoundingClientRect(); if (rr.width < .5) continue;
      const m = /matrix\(([^,]+),/.exec(c.transform || ''); const sx = m ? parseFloat(m[1]) || 1 : 1;
      g.save();
      g.font = `${c.fontStyle} ${c.fontWeight} ${c.fontSize} ${c.fontFamily}`;
      g.fillStyle = c.color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.direction = c.direction === 'rtl' ? 'rtl' : 'ltr';
      g.translate((rr.left + rr.right) / 2, (rr.top + rr.bottom) / 2); g.scale(sx, 1);
      const t = own.map(n => n.nodeValue).join('').replace(/\s+/g, ' ').trim();
      const sw = px(c.webkitTextStrokeWidth);
      if (sw > 0) { g.lineWidth = sw * 2; g.strokeStyle = c.color; g.lineJoin = 'round'; g.strokeText(t, 0, 0); }
      g.fillText(t, 0, 0);
      g.restore();
    }
    return { url: toPng(cv), R };
  }
  async function snapPara(el) {
    const { url, R } = await paint(el, 3);
    if (!url) return blocks(el, {}, true);
    const rid = addMedia('snap:' + url.length + ':' + url.slice(-80), 'png', url.split(',')[1]);
    const [w, h] = fit(R.width, R.height);
    return `<w:p><w:pPr><w:spacing w:before="0" w:after="${Math.round(Math.max(0, px(cs(el).marginBottom)) * PX)}"/><w:jc w:val="center"/></w:pPr>${drawing(rid, w, h, 'Header')}</w:p>`;
  }
  // decoration behind the text (certificate frames): picture anchored to the page, behind the text
  async function bgPara(el) {
    const { url, R } = await paint(el, 2.2);
    if (!url) return '';
    const rid = addMedia('bg:' + url.length + ':' + url.slice(-80), 'png', url.split(',')[1]);
    const pg = el.closest('.page-a4, .page-a4l, .sheet') || document.body, P0 = pg.getBoundingClientRect();
    const id = drawId++, E = v => Math.max(0, Math.round(v * EMU));
    return `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="20" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr><w:r><w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="0" behindDoc="1" locked="1" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="page"><wp:posOffset>${E(R.left - P0.left)}</wp:posOffset></wp:positionH><wp:positionV relativeFrom="page"><wp:posOffset>${E(R.top - P0.top)}</wp:posOffset></wp:positionV><wp:extent cx="${E(R.width)}" cy="${E(R.height)}"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="${id}" name="Background ${id}"/><wp:cNvGraphicFramePr/><a:graphic xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:nvPicPr><pic:cNvPr id="${id}" name="bg"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="${rid}"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${E(R.width)}" cy="${E(R.height)}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing></w:r></w:p>`;
  }

  /* ---------- paragraph properties ---------- */
  const bdr = (side, c) => {
    const w = px(c['border' + side + 'Width']), st = c['border' + side + 'Style'];
    if (!(w > 0.3) || !st || st === 'none' || st === 'hidden') return null;
    return { sz: Math.max(2, Math.min(96, Math.round(w * 6))), val: /dotted/.test(st) ? 'dotted' : /dashed/.test(st) ? 'dashed' : /double/.test(st) ? 'double' : 'single', color: hex(c['border' + side + 'Color']) || '000000' };
  };
  const bdrXml = (tag, b, space) => b ? `<w:${tag} w:val="${b.val}" w:sz="${b.sz}" w:space="${space == null ? 1 : space}" w:color="${b.color}"/>` : '';
  // decorations (borders / background / side padding) of a block element, handed down to its paragraphs
  const decor = (c, inh) => {
    const d = Object.assign({}, inh || {});
    const b = { Top: bdr('Top', c), Right: bdr('Right', c), Bottom: bdr('Bottom', c), Left: bdr('Left', c) };
    if (b.Top || b.Right || b.Bottom || b.Left) d.bd = b;
    const bg = hex(c.backgroundColor); if (bg) d.shd = bg;
    return d;
  };
  const algn = (c, rtl) => {
    let t = c.textAlign;
    if (t === 'start') t = rtl ? 'right' : 'left'; else if (t === 'end') t = rtl ? 'left' : 'right';
    if (t === 'justify') return 'both';
    if (t === 'center') return 'center';
    if (rtl) return t === 'right' ? 'left' : 'right'; // in a right-to-left paragraph Word's "left" is the leading (right) edge
    return t === 'right' ? 'right' : 'left';
  };
  const pPr = (el, c, inh, extra) => {
    const rtl = c.direction === 'rtl';
    const fs = px(c.fontSize), lh = c.lineHeight === 'normal' ? 0 : px(c.lineHeight);
    let sp = '';
    const noS = extra && extra.noOwn;
    const before = noS ? 0 : Math.max(0, Math.min(900, tw(c.marginTop))), after = noS ? 0 : Math.max(0, Math.min(900, tw(c.marginBottom)));
    const line = lh && fs ? Math.max(200, Math.min(700, Math.round(lh / fs * 240))) : 0;
    // text only: the exact line height of the page (Sakkal Majalla has tall natural lines); pictures keep an automatic height
    const exact = lh && extra && extra.exact ? Math.round(Math.max(lh, fs * 1.15) * PX) : 0;
    sp = `<w:spacing w:before="${before}" w:after="${after}"${exact ? ` w:line="${exact}" w:lineRule="exact"` : line ? ` w:line="${line}" w:lineRule="auto"` : ''}/>`;
    const ind = [];
    const no = extra && extra.noOwn;
    const lead = no ? 0 : (rtl ? px(c.paddingRight) + px(c.marginRight) : px(c.paddingLeft) + px(c.marginLeft));
    if (lead > 3) ind.push(`w:${rtl ? 'right' : 'left'}="${Math.round(Math.min(lead, 1500) * PX)}"`);
    const b = inh && inh.bd, d = inh && inh.shd;
    const own = no ? {} : decor(c, null);
    const B = own.bd || b, D = own.shd || d;
    const pb = B ? `<w:pBdr>${bdrXml('top', B.Top, 2)}${bdrXml('left', rtl ? B.Right : B.Left, 4)}${bdrXml('bottom', B.Bottom, 2)}${bdrXml('right', rtl ? B.Left : B.Right, 4)}</w:pBdr>` : '';
    const shd = D ? `<w:shd w:val="clear" w:color="auto" w:fill="${D}"/>` : '';
    return `<w:pPr>${(extra && extra.keepNext) ? '<w:keepNext/>' : ''}${pb}${shd}${rtl ? '<w:bidi/>' : ''}${sp}${ind.length ? `<w:ind ${ind.join(' ')}/>` : ''}<w:jc w:val="${algn(c, rtl)}"/>${extra && extra.rpr ? extra.rpr : ''}</w:pPr>`;
  };

  /* ---------- inline content ---------- */
  const hasBlockKids = el => Array.from(el.children).some(k => { const c = cs(k); return c.display !== 'none' && !c.display.startsWith('inline') && k.tagName !== 'BR'; });
  const isInline = (el, c) => {
    const t = el.tagName.toLowerCase();
    if (t === 'table') return false;
    if (t === 'img' || t === 'svg' || t === 'br') return true;
    return c.display.startsWith('inline') && c.display !== 'inline-flex' && c.display !== 'inline-grid' && !hasBlockKids(el);
  };
  // collects {t:'text'|'x'|'br', ...} for a run of inline nodes
  async function collect(node, items) {
    for (const ch of node.childNodes) {
      if (ch.nodeType === 3) { items.push({ t: 'text', v: ch.nodeValue, st: cs(ch.parentElement), pre: /^pre/.test(cs(ch.parentElement).whiteSpace), el: ch.parentElement }); continue; }
      if (ch.nodeType !== 1 || SKIP(ch)) continue;
      const c = cs(ch); if (c.display === 'none' || c.visibility === 'hidden') continue;
      const t = ch.tagName.toLowerCase();
      if (t === 'br') items.push({ t: 'br' });
      else if (t === 'img') items.push({ t: 'x', xml: await imgRun(ch) });
      else if (t === 'svg') items.push({ t: 'x', xml: await svgRun(ch) });
      else if (c.display.startsWith('inline-block') && !ch.textContent.trim() && !ch.querySelector('img,svg') && bdr('Bottom', c)) {
        items.push({ t: 'text', v: ' ' + '.'.repeat(Math.max(4, Math.round(ch.getBoundingClientRect().width / 5))) + ' ', st: cs(ch.parentElement), el: ch.parentElement, raw: true });
      } else {
        const o = t === 'sup' ? { sup: 1 } : t === 'sub' ? { sub: 1 } : null;
        const n = items.length; await collect(ch, items);
        if (o) for (let i = n; i < items.length; i++) if (items[i].t === 'text') items[i].o = o;
      }
    }
  }
  // a digit string isolated left-to-right on the page (phone, RIB, signed amount: Docs.bidi) is kept left-to-right in Word too
  const ltrWrap = (t, st) => (st && st.direction === 'ltr' && /isolate|embed|override/.test(st.unicodeBidi || '') && /\d/.test(t) && /[ \u00A0]\S|^[-\u2212+]/.test(t.trim()) ? '\u202A' + t + '\u202C' : t);
  const runsOf = items => {
    let x = '', prevSpace = true, last = -1;
    items.forEach((it, i) => { if (it.t === 'text') last = i; });
    items.forEach((it, i) => {
      if (it.t === 'br') { x += '<w:r><w:br/></w:r>'; prevSpace = true; return; }
      if (it.t === 'x') { x += it.xml || ''; prevSpace = false; return; }
      let v = it.v;
      if (!it.pre && !it.raw) {
        v = v.replace(/[ \t\r\n\f]+/g, ' ');
        if (prevSpace && v.startsWith(' ')) v = v.slice(1);
        if (i === last && v.endsWith(' ')) v = v.slice(0, -1);
      }
      if (!v) return;
      prevSpace = v.endsWith(' ');
      x += textRuns(ltrWrap(v, it.st), it.st, it.o);
    });
    return x;
  };
  const hasContent = items => items.some(it => it.t === 'x' || it.t === 'br' || (it.t === 'text' && /\S/.test(it.v)));

  const para = (items, el, inh, extra) => {
    const c = cs(el);
    const empty = !hasContent(items);
    const fs = Math.max(2, Math.round(px(c.fontSize) * 0.75 * 2));
    const rpr = empty ? `<w:rPr><w:sz w:val="${fs}"/><w:szCs w:val="${fs}"/></w:rPr>` : '';
    const exact = !items.some(it => it.t === 'x' || it.t === 'br');
    return `<w:p>${pPr(el, c, inh, Object.assign({ rpr, exact }, extra))}${empty ? '' : runsOf(items)}</w:p>`;
  };

  /* ---------- blocks ---------- */
  const visibleKids = el => Array.from(el.children).filter(k => !SKIP(k) && cs(k).display !== 'none');
  const isRow = (el, c) => (/flex|grid/.test(c.display) && !/column/.test(c.flexDirection || '') && visibleKids(el).length > 1);

  async function blocks(el, inh, noOwn) {
    let out = '', items = [];
    const flush = () => { if (hasContent(items)) out += para(items, el, inh, noOwn ? { noOwn: true } : null); items = []; };
    for (const ch of el.childNodes) {
      if (ch.nodeType === 3) { items.push({ t: 'text', v: ch.nodeValue, st: cs(el), pre: /^pre/.test(cs(el).whiteSpace), el }); continue; }
      if (ch.nodeType !== 1 || SKIP(ch)) continue;
      const c = cs(ch); if (c.display === 'none') continue;
      if (isInline(ch, c)) { await collect({ childNodes: [ch] }, items); continue; }
      flush();
      const t = ch.tagName.toLowerCase();
      if (ch.classList.contains('hv2') || ch.classList.contains('docx-snap')) { out += await snapPara(ch); continue; }
      if (ch.classList.contains('docx-bg')) { out += await bgPara(ch); continue; }
      if (el.classList && el.classList.contains('docx-gaps')) { // free layout (certificates): keep the vertical room between the blocks
        const prev = ch.previousElementSibling, r = ch.getBoundingClientRect();
        const top = prev ? prev.getBoundingClientRect().bottom : el.getBoundingClientRect().top;
        const gap = Math.max(0, Math.min(400, r.top - top));
        if (gap > 6) out += `<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="${Math.max(20, Math.round(gap * PX))}" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>`;
      }
      if (t === 'table') out += await htmlTable(ch, c) + spacerP();
      else if (ch.classList.contains('sb-ttl')) out += titleP(ch);
      else if (isRow(ch, c)) out += await rowTable(ch, c) + spacerP();
      else if (c.display === 'list-item') {
        const sub = []; await collect(ch, sub); sub.unshift({ t: 'text', v: '• ', st: c, el: ch, raw: true });
        out += para(sub, ch, inh);
      } else {
        const kids = ch.childNodes, only = !Array.from(ch.children).some(k => { const kc = cs(k); return kc.display !== 'none' && !isInline(k, kc); });
        const nin = decor(c, inh);
        if (only) { const sub = []; await collect(ch, sub); if (hasContent(sub)) out += para(sub, ch, inh); else out += emptyBox(ch, c); }
        else { out += await blocks(ch, nin); }
        void kids;
      }
    }
    flush();
    return out;
  }
  const spacerP = () => '<w:p><w:pPr><w:spacing w:before="0" w:after="0" w:line="40" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>';
  const emptyBox = (el, c) => {
    const h = el.getBoundingClientRect().height; if (h < 9 || SKIP(el)) return '';
    const b = decor(c, null); if (!b.bd && !b.shd && px(c.minHeight) < 9 && h < 14) return '';
    return `<w:p><w:pPr>${b.bd ? `<w:pBdr>${bdrXml('bottom', b.bd.Bottom)}</w:pBdr>` : ''}<w:spacing w:before="${Math.round(Math.max(0, h - 4) * PX)}" w:after="0" w:line="40" w:lineRule="exact"/><w:rPr><w:sz w:val="2"/></w:rPr></w:pPr></w:p>`;
  };
  // the blue pill that frames the title of board documents
  const titleP = el => {
    const t = el.querySelector('.t') || el, c = cs(t);
    const st = Object.assign({}, c);
    const items = [{ t: 'text', v: t.textContent, st: c, el: t }];
    const sz = Math.round(px(c.fontSize) * 0.75 * 2);
    const run = textRuns(t.textContent.replace(/\s+/g, ' ').trim(), { fontFamily: c.fontFamily, fontSize: c.fontSize, fontWeight: '700', fontStyle: 'normal', textDecorationLine: '', color: 'rgb(14,42,102)', backgroundColor: 'rgba(0,0,0,0)' });
    void st; void items; void sz;
    const bd = '<w:pBdr><w:top w:val="single" w:sz="12" w:space="3" w:color="23488D"/><w:left w:val="single" w:sz="12" w:space="6" w:color="23488D"/><w:bottom w:val="single" w:sz="12" w:space="3" w:color="23488D"/><w:right w:val="single" w:sz="12" w:space="6" w:color="23488D"/></w:pBdr>';
    return `<w:p><w:pPr><w:keepNext/>${bd}<w:shd w:val="clear" w:color="auto" w:fill="D9E2F3"/><w:bidi/><w:spacing w:before="60" w:after="120"/><w:ind w:left="567" w:right="567"/><w:jc w:val="center"/></w:pPr>${run}</w:p>`;
  };

  /* ---------- tables ---------- */
  // cells: [[{el, r (rect), rs, cs?, head}]] ; xs: sorted physical column edges
  const edges = rows => {
    const e = [];
    rows.forEach(r => r.forEach(c => { e.push(c.r.left, c.r.right); }));
    e.sort((a, b) => a - b);
    const out = [];
    e.forEach(x => { if (!out.length || x - out[out.length - 1] > 2.5) out.push(x); });
    return out;
  };
  const idxOf = (xs, x) => { let b = 0, bd = 1e9; xs.forEach((v, i) => { const d = Math.abs(v - x); if (d < bd) { bd = d; b = i; } }); return b; };
  async function gridTable(rows, rtl, o) {
    o = o || {};
    rows = rows.filter(r => r.length);
    if (!rows.length) return '';
    const xs = edges(rows), n = xs.length - 1;
    if (n < 1) return '';
    const widths = []; for (let k = 0; k < n; k++) widths.push(Math.max(60, Math.round((xs[k + 1] - xs[k]) * PX)));
    const order = rtl ? widths.slice().reverse() : widths;
    const total = order.reduce((a, b) => a + b, 0);
    // placement of each cell on the grid (emission order = visual right-to-left for rtl tables)
    const place = c => { const a = idxOf(xs, c.r.left), b = idxOf(xs, c.r.right); const lo = Math.min(a, b), hi = Math.max(a, b, lo + 1); return rtl ? { start: n - hi, span: hi - lo } : { start: lo, span: hi - lo }; };
    const cont = rows.map(() => []);
    rows.forEach((r, ri) => r.forEach(c => { c.p = place(c); c.rs = Math.min(c.rs || 1, rows.length - ri); for (let k = 1; k < (c.rs || 1); k++) if (cont[ri + k]) cont[ri + k].push({ p: c.p, cont: true }); }));
    let xml = '';
    for (let ri = 0; ri < rows.length; ri++) {
      const cells = rows[ri].map(c => c).concat(cont[ri]).sort((a, b) => a.p.start - b.p.start);
      const rh = Math.max(...rows[ri].filter(c => (c.rs || 1) === 1).map(c => c.r.height), 0);
      let tcs = '', pos = 0, lastBd = '';
      const filler = (from, to) => { const wtw = order.slice(from, to).reduce((a, b) => a + b, 0); return `<w:tc><w:tcPr><w:tcW w:w="${wtw}" w:type="dxa"/>${to - from > 1 ? `<w:gridSpan w:val="${to - from}"/>` : ''}${lastBd}</w:tcPr><w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:rPr><w:sz w:val="4"/></w:rPr></w:pPr></w:p></w:tc>`; };
      for (const c of cells) {
        if (c.p.start > pos) tcs += filler(pos, c.p.start);
        pos = Math.max(pos, c.p.start + c.p.span);
        const wtw = order.slice(c.p.start, c.p.start + c.p.span).reduce((a, b) => a + b, 0);
        let pr = `<w:tcW w:w="${wtw}" w:type="dxa"/>${c.p.span > 1 ? `<w:gridSpan w:val="${c.p.span}"/>` : ''}`;
        if (c.cont) { tcs += `<w:tc><w:tcPr>${pr}<w:vMerge/></w:tcPr><w:p/></w:tc>`; continue; }
        const cc = cs(c.el);
        if ((c.rs || 1) > 1) pr += '<w:vMerge w:val="restart"/>';
        const B = o.noBorder ? {} : { Top: bdr('Top', cc), Right: bdr('Right', cc), Bottom: bdr('Bottom', cc), Left: bdr('Left', cc) };
        if (B.Top || B.Right || B.Bottom || B.Left) { const bx = `<w:tcBorders>${bdrXml('top', B.Top, 0)}${bdrXml('left', rtl ? B.Right : B.Left, 0)}${bdrXml('bottom', B.Bottom, 0)}${bdrXml('right', rtl ? B.Left : B.Right, 0)}</w:tcBorders>`; pr += bx; lastBd = bx; }
        const bg = hex(cc.backgroundColor); if (bg) pr += `<w:shd w:val="clear" w:color="auto" w:fill="${bg}"/>`;
        const pt = tw(cc.paddingTop), pbm = tw(cc.paddingBottom), pl = tw(cc.paddingLeft), pr2 = tw(cc.paddingRight);
        pr += `<w:tcMar><w:top w:w="${pt}" w:type="dxa"/><w:left w:w="${rtl ? pr2 : pl}" w:type="dxa"/><w:bottom w:w="${pbm}" w:type="dxa"/><w:right w:w="${rtl ? pl : pr2}" w:type="dxa"/></w:tcMar>`;
        const va = cc.verticalAlign; pr += `<w:vAlign w:val="${va === 'top' ? 'top' : va === 'bottom' ? 'bottom' : 'center'}"/>`;
        let inner = await blocks(c.el, {}, true);
        if (!inner) { const f = Math.max(2, Math.round(px(cc.fontSize) * 0.75 * 2)); inner = `<w:p><w:pPr><w:spacing w:before="0" w:after="0"/><w:rPr><w:sz w:val="${f}"/></w:rPr></w:pPr></w:p>`; }
        if (!/<\/w:p>$/.test(inner)) inner += '<w:p/>';
        tcs += `<w:tc><w:tcPr>${pr}</w:tcPr>${inner}</w:tc>`;
      }
      if (pos < n) tcs += filler(pos, n);
      const head = rows[ri].some(c => c.head);
      xml += `<w:tr><w:trPr><w:cantSplit/>${rh > 4 && !o.noHeight ? `<w:trHeight w:val="${Math.round(rh * PX * 0.9)}" w:hRule="atLeast"/>` : ''}${head ? '<w:tblHeader/>' : ''}</w:trPr>${tcs}</w:tr>`;
    }
    const tr = o.rect, pw = o.pageW || 0;
    const center = tr && pw && Math.abs((tr.left + tr.right) / 2 - pw / 2) < 8 && tr.width < pw - 40;
    return `<w:tbl><w:tblPr>${rtl ? '<w:bidiVisual/>' : ''}<w:tblW w:w="${total}" w:type="dxa"/>${center ? '<w:jc w:val="center"/>' : ''}<w:tblLayout w:type="fixed"/><w:tblCellMar><w:left w:w="0" w:type="dxa"/><w:right w:w="0" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>${order.map(w => `<w:gridCol w:w="${w}"/>`).join('')}</w:tblGrid>${xml}</w:tbl>`;
  }
  async function htmlTable(t, c) {
    const rtl = c.direction === 'rtl';
    const skip = window.__skipHead; window.__skipHead = false;
    const rows = Array.from(t.rows).filter(tr => !(skip && tr.parentElement && tr.parentElement.tagName === 'THEAD')).map(tr => {
      const inHead = tr.parentElement && tr.parentElement.tagName === 'THEAD';
      return Array.from(tr.cells).map(td => ({ el: td, r: td.getBoundingClientRect(), rs: td.rowSpan || 1, head: inHead }));
    });
    return gridTable(rows, rtl, { rect: t.getBoundingClientRect(), pageW: window.__pageW });
  }
  async function rowTable(el, c) {
    const rtl = c.direction === 'rtl';
    const kids = visibleKids(el).map(k => ({ el: k, r: k.getBoundingClientRect() })).filter(k => k.r.width > 1);
    kids.sort((a, b) => a.r.top - b.r.top);
    const rows = [];
    kids.forEach(k => { const last = rows[rows.length - 1]; if (last && Math.abs(last[0].r.top - k.r.top) < 5) last.push(k); else rows.push([k]); });
    rows.forEach(r => r.sort((a, b) => (rtl ? b.r.left - a.r.left : a.r.left - b.r.left)));
    return gridTable(rows, rtl, { noHeight: true, rect: el.getBoundingClientRect(), pageW: window.__pageW });
  }

  /* ---------- pages ---------- */
  // The pages made for the preview are laid end to end (Word paginates by itself, so the document stays easy to edit).
  // A table that the preview split over two pages (header row repeated) is joined back into one table.
  const pageEls = Array.from(document.querySelectorAll('.page-a4, .page-a4l, .sheet'));
  const rootOf = pg => (pg.classList.contains('sheet') ? (pg.querySelector('.copy') || pg) : pg);
  const fbs = root => Array.from(root.children).filter(k => !SKIP(k) && cs(k).display !== 'none');
  const sig = t => t && t.tHead ? t.tHead.textContent.replace(/\s+/g, ' ').trim() : '';
  const lone = fb => { if (!fb || fb.children.length !== 1 || fb.firstElementChild.tagName !== 'TABLE') return null; return fb.firstElementChild; };
  let body = '', sect = '';
  for (let i = 0; i < pageEls.length; i++) {
    const pg = pageEls[i], root = rootOf(pg), c = cs(root);
    const a5 = pg.classList.contains('sheet') && !pg.classList.contains('single');
    const land = pg.classList.contains('page-a4l');
    const W = a5 ? 8391 : land ? 16838 : 11906, H = a5 ? 11906 : land ? 11906 : 16838;
    const mt = Math.max(567, tw(c.paddingTop)), mb = Math.max(567, tw(c.paddingBottom)), ml = Math.max(567, tw(c.paddingLeft)), mr = Math.max(567, tw(c.paddingRight));
    window.__pageW = root.getBoundingClientRect().width; window.__contentW = (W - ml - mr) / PX;
    if (i === 0) sect = `<w:sectPr><w:pgSz w:w="${W}" w:h="${H}"${land ? ' w:orient="landscape"' : ''}/><w:pgMar w:top="${mt}" w:right="${mr}" w:bottom="${mb}" w:left="${ml}" w:header="300" w:footer="300" w:gutter="0"/></w:sectPr>`;
    window.__skipHead = false;
    const alone = pg.querySelector('.kd, .docx-pb') || pg.classList.contains('docx-pb') || pg.classList.contains('sheet');
    if (i > 0 && alone) { body += '<w:p><w:pPr><w:spacing w:before="0" w:after="0"/></w:pPr><w:r><w:br w:type="page"/></w:r></w:p>'; }
    else if (i > 0) {
      const prevLast = fbs(rootOf(pageEls[i - 1])).slice(-1)[0], first = fbs(root)[0];
      const a = prevLast && prevLast.lastElementChild && prevLast.lastElementChild.tagName === 'TABLE' ? prevLast.lastElementChild : null, b = lone(first);
      const ws = (t, last) => { const r = last ? t.rows[t.rows.length - 1] : (Array.from(t.rows).find(x => x.parentElement.tagName !== 'THEAD') || t.rows[0]); return r ? Array.from(r.cells).map(c => c.getBoundingClientRect().width) : []; };
      const same = a && b && (x => x.length === (y => y.length)(ws(b, false)) && x.every((v, k) => Math.abs(v - ws(b, false)[k]) < 4))(ws(a, true));
      if (a && b && same && sig(a) && sig(a) === sig(b) && body.endsWith(spacerP())) { body = body.slice(0, -spacerP().length); window.__skipHead = true; }
    }
    body += await blocks(root, {}, true);
  }
  body += spacerP() + sect;
  return { body, rels, media, pages: pageEls.length };
})()
