'use strict';
/* التهاني والتقديرات — شواهد تقدير وتهاني وشكر بتصاميم زخرفية (صفحة أفقية A4 بإطار وترويسة المؤسسة كاملة العرض)
   - شواهد تقدير الأساتذة والأطر (المشاركة / المساهمة / المجهودات المتميزة / الإشراف) + شهادة شكر جماعية
   - التهاني: الأعياد الدينية، اليوم العالمي للمدرس
   - شواهد التفوق: المراتب الثلاث الأولى بكل قسم (+ لائحة المتفوقين)
   - الشكر والتقدير: رئيس جمعية الآباء، رئيس المجلس الجماعي، جمعية مدنية، شريك أو متعاون */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const { SB, tr, thr, tbl } = window.K;

  function migrate(db) {
    const k = db.kudos = db.kudos || {};
    k.years = k.years && typeof k.years === 'object' ? k.years : {};
  }
  const gridDef = (k, l, cols, o) => Object.assign({ k, l, t: 'grid', cols, widths: cols.map(() => '1fr') }, o || {});
  const KD = () => { migrate(DB); return DB.kudos; };
  const store = sy => { const y = KD().years; return y[sy] || (y[sy] = {}); };

  /* ---------------- colour themes ---------------- */
  const TH = {
    navy: { n: 'أزرق ملكي وذهبي', m: '#16325f', a: '#b8892b', l: '#e8edf8', p: '#fffdf6', g1: '#f0d68a', g2: '#b8892b', g3: '#8a621a' },
    emerald: { n: 'أخضر زمردي وذهبي', m: '#0b5d46', a: '#b9922f', l: '#e2f1ea', p: '#fffdf5', g1: '#efd588', g2: '#b9922f', g3: '#86651a' },
    plum: { n: 'بنفسجي وذهبي', m: '#4a2a6e', a: '#c39a33', l: '#efe8f7', p: '#fffcf7', g1: '#f1d78d', g2: '#c39a33', g3: '#8d6a1c' },
    burgundy: { n: 'عنابي وذهبي', m: '#7b1f2e', a: '#b8892b', l: '#f7e6e8', p: '#fffcf6', g1: '#efd186', g2: '#b8892b', g3: '#85601b' },
    teal: { n: 'أخضر مزرق', m: '#0f6670', a: '#c8923a', l: '#e0f1f2', p: '#fffdf8', g1: '#f2d99a', g2: '#c8923a', g3: '#8e6320' },
    ocean: { n: 'أزرق سماوي وفضي', m: '#1b5a96', a: '#7d97b8', l: '#e5eef9', p: '#fdfeff', g1: '#dfe8f3', g2: '#8ea6c4', g3: '#5d7798' },
    amber: { n: 'عنبري دافئ', m: '#86480a', a: '#d09a24', l: '#fbefd6', p: '#fffaf0', g1: '#f6dc96', g2: '#d09a24', g3: '#946616' },
    gold: { n: 'ذهبي (المرتبة الأولى)', m: '#7d5a0e', a: '#d1a22b', l: '#fbf2d3', p: '#fffbee', g1: '#fbe7a1', g2: '#d1a22b', g3: '#94700f' },
    silver: { n: 'فضي (المرتبة الثانية)', m: '#46515d', a: '#98a5b2', l: '#eceff3', p: '#fcfdfe', g1: '#eef1f5', g2: '#a3afbb', g3: '#6b7784' },
    bronze: { n: 'برونزي (المرتبة الثالثة)', m: '#74431f', a: '#c0803f', l: '#f6e8da', p: '#fffaf4', g1: '#efc496', g2: '#c0803f', g3: '#8a5426' }
  };
  const themeOpts = auto => (auto ? [['auto', 'تلقائي حسب السياق']] : []).concat(Object.keys(TH).map(k => [k, TH[k].n])).concat([['custom', 'ألوان مخصصة (اختر أدناه)']]);
  const thOf = k => TH[k] || TH.navy;

  /* ---------------- ornaments (SVG, mm units) ---------------- */
  let seq = 0;
  const f1 = n => (+n).toFixed(2);
  const starPts = (cx, cy, R, r, n, rot) => {
    const pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = (rot || 0) * Math.PI / 180 + i * Math.PI / n - Math.PI / 2, rr = i % 2 ? r : R;
      pts.push(f1(cx + rr * Math.cos(a)) + ',' + f1(cy + rr * Math.sin(a)));
    }
    return pts.join(' ');
  };
  function frame(th, W, H) {
    const u = 'kd' + (++seq);
    const { m, a, l, p } = th;
    const corner = (tf) => `<g transform="${tf}">
      <path d="M4 4H24A20 20 0 0 1 4 24Z" fill="${l}" stroke="url(#${u}g)" stroke-width=".6"/>
      <path d="M4 4H19A15 15 0 0 1 4 19Z" fill="none" stroke="${a}" stroke-width=".35"/>
      <path d="M4 4H14A10 10 0 0 1 4 14Z" fill="none" stroke="${m}" stroke-width=".25" opacity=".6"/>
      <polygon points="${starPts(11.6, 11.6, 5.4, 2.4, 8, 22.5)}" fill="url(#${u}g)" stroke="${m}" stroke-width=".28"/>
      <circle cx="11.6" cy="11.6" r="1.15" fill="${p}" stroke="${m}" stroke-width=".2"/></g>`;
    const mid = tf => `<g transform="${tf}">
      <path d="M-13 0L0-3.6 13 0 0 3.6Z" fill="url(#${u}g)" stroke="${m}" stroke-width=".25"/>
      <path d="M-7.5 0L0-1.9 7.5 0 0 1.9Z" fill="${p}"/><circle r=".85" fill="${m}"/>
      <circle cx="-18" r="1.15" fill="${a}"/><circle cx="18" r="1.15" fill="${a}"/>
      <circle cx="-23" r=".7" fill="${m}"/><circle cx="23" r=".7" fill="${m}"/></g>`;
    return `<svg class="kd-svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.g1}"/><stop offset=".5" stop-color="${th.g2}"/><stop offset="1" stop-color="${th.g3}"/></linearGradient>
        <pattern id="${u}p" width="12" height="12" patternUnits="userSpaceOnUse">
          <g fill="none" stroke="${m}" stroke-width=".22" opacity=".26"><rect x="2.6" y="2.6" width="6.8" height="6.8"/><rect x="2.6" y="2.6" width="6.8" height="6.8" transform="rotate(45 6 6)"/></g>
          <g fill="${a}" opacity=".55"><circle cx="0" cy="0" r=".55"/><circle cx="12" cy="0" r=".55"/><circle cx="0" cy="12" r=".55"/><circle cx="12" cy="12" r=".55"/></g>
        </pattern>
        <radialGradient id="${u}r" cx=".5" cy=".5" r=".62"><stop offset="0" stop-color="${p}" stop-opacity="1"/><stop offset=".6" stop-color="${p}" stop-opacity=".95"/><stop offset="1" stop-color="${p}" stop-opacity=".25"/></radialGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="${p}"/>
      <rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="url(#${u}p)"/>
      <rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="url(#${u}r)"/>
      <g fill="none" stroke="${m}" opacity=".07" stroke-width=".5"><polygon points="${starPts(W / 2, H / 2 + 12, 78, 64, 16, 0)}"/><circle cx="${W / 2}" cy="${H / 2 + 12}" r="48"/><circle cx="${W / 2}" cy="${H / 2 + 12}" r="44"/></g>
      <rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="url(#${u}g)" stroke-width="2.4"/>
      <rect x="6.5" y="6.5" width="${W - 13}" height="${H - 13}" fill="none" stroke="${m}" stroke-width=".5"/>
      <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="${a}" stroke-width=".9" stroke-dasharray=".01 2.2" stroke-linecap="round"/>
      <rect x="9.6" y="9.6" width="${W - 19.2}" height="${H - 19.2}" fill="none" stroke="url(#${u}g)" stroke-width=".6"/>
      ${corner('')}${corner(`translate(${W} 0) scale(-1 1)`)}${corner(`translate(0 ${H}) scale(1 -1)`)}${corner(`translate(${W} ${H}) scale(-1 -1)`)}
      ${mid(`translate(${f1(W / 2)} 4)`)}${mid(`translate(${f1(W / 2)} ${H - 4})`)}${mid(`translate(4 ${f1(H / 2)}) rotate(90)`)}${mid(`translate(${W - 4} ${f1(H / 2)}) rotate(90)`)}
    </svg>`;
  }
  /* ---------------- 1.9.2: more frames (each one in every colour theme) ---------------- */
  const svgOpen = (W, H, defs) => `<svg class="kd-svg" viewBox="0 0 ${W} ${H}" width="${W}mm" height="${H}mm" xmlns="http://www.w3.org/2000/svg"><defs>${defs || ''}</defs>`;
  const goldGrad = (u, th) => `<linearGradient id="${u}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.g1}"/><stop offset=".5" stop-color="${th.g2}"/><stop offset="1" stop-color="${th.g3}"/></linearGradient>`;
  const four = (W, H, g) => g('') + g(`translate(${W} 0) scale(-1 1)`) + g(`translate(0 ${H}) scale(1 -1)`) + g(`translate(${W} ${H}) scale(-1 -1)`);
  // 1) royal: heavy double gilt border with scroll corners and a crest on top
  function frameRoyal(th, W, H) {
    const u = 'kr' + (++seq), { m, a, l, p } = th;
    const scroll = tf => `<g transform="${tf}" fill="none" stroke-linecap="round">
      <path d="M7 34C7 18 18 7 34 7" stroke="url(#${u}g)" stroke-width="1.6"/>
      <path d="M12 30C12 20 20 12 30 12" stroke="${m}" stroke-width=".5"/>
      <path d="M10 46C15 40 14 30 9 27M46 10C40 15 30 14 27 9" stroke="${a}" stroke-width=".8"/>
      <path d="M16 16C22 22 27 24 33 23M16 16C22 22 24 27 23 33" stroke="url(#${u}g)" stroke-width="1"/>
      <circle cx="16" cy="16" r="3.2" fill="url(#${u}g)" stroke="${m}" stroke-width=".3"/><circle cx="16" cy="16" r="1.2" fill="${p}"/>
      <circle cx="35" cy="22.6" r="1.1" fill="${a}"/><circle cx="22.6" cy="35" r="1.1" fill="${a}"/></g>`;
    const crest = (x, y, r) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M-30 0C-18 0-12-5 0-5S18 0 30 0C18 0 12 5 0 5S-18 0-30 0Z" fill="${l}" stroke="url(#${u}g)" stroke-width=".7"/>
      <polygon points="${starPts(0, 0, 4.4, 1.9, 8, 22.5)}" fill="url(#${u}g)" stroke="${m}" stroke-width=".25"/><circle cx="-14" r="1" fill="${m}"/><circle cx="14" r="1" fill="${m}"/></g>`;
    return svgOpen(W, H, goldGrad(u, th)) + `<rect width="${W}" height="${H}" fill="${p}"/>
      <rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="${m}" stroke-width="3"/>
      <rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="url(#${u}g)" stroke-width="1.8"/>
      <rect x="10.6" y="10.6" width="${W - 21.2}" height="${H - 21.2}" fill="none" stroke="${m}" stroke-width=".4"/>
      <rect x="12" y="12" width="${W - 24}" height="${H - 24}" fill="none" stroke="${a}" stroke-width=".3" stroke-dasharray="2 1.2"/>
      <g opacity=".08" fill="none" stroke="${m}" stroke-width=".6"><polygon points="${starPts(W / 2, H / 2 + 14, 60, 50, 12, 0)}"/><circle cx="${W / 2}" cy="${H / 2 + 14}" r="40"/></g>
      ${four(W, H, scroll)}${crest(W / 2, 6.5, 0)}${crest(W / 2, H - 6.5, 0)}${crest(6.5, H / 2, 90)}${crest(W - 6.5, H / 2, 90)}</svg>`;
  }
  // 2) zellige: a band of Moroccan eight-pointed stars all around
  function frameZellige(th, W, H) {
    const u = 'kz' + (++seq), { m, a, l, p } = th, T = 9;
    const tile = `<pattern id="${u}t" width="${T}" height="${T}" patternUnits="userSpaceOnUse"><rect width="${T}" height="${T}" fill="${l}"/>
      <polygon points="${starPts(T / 2, T / 2, 4.1, 2.6, 8, 22.5)}" fill="${m}"/><polygon points="${starPts(T / 2, T / 2, 2.6, 1.5, 8, 0)}" fill="${a}"/><circle cx="${T / 2}" cy="${T / 2}" r=".8" fill="${p}"/>
      <circle cx="0" cy="0" r="1.2" fill="${a}"/><circle cx="${T}" cy="0" r="1.2" fill="${a}"/><circle cx="0" cy="${T}" r="1.2" fill="${a}"/><circle cx="${T}" cy="${T}" r="1.2" fill="${a}"/></pattern>`;
    return svgOpen(W, H, goldGrad(u, th) + tile) + `<rect width="${W}" height="${H}" fill="${p}"/>
      <path d="M4 4H${W - 4}V${H - 4}H4Z M13 13V${H - 13}H${W - 13}V13Z" fill="url(#${u}t)" fill-rule="evenodd"/>
      <rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${m}" stroke-width="1.2"/>
      <rect x="13" y="13" width="${W - 26}" height="${H - 26}" fill="none" stroke="url(#${u}g)" stroke-width="1.4"/>
      <rect x="14.6" y="14.6" width="${W - 29.2}" height="${H - 29.2}" fill="none" stroke="${m}" stroke-width=".35"/>
      ${four(W, H, tf => `<g transform="${tf}"><rect x="2" y="2" width="15" height="15" fill="${m}"/><polygon points="${starPts(9.5, 9.5, 6.4, 3.2, 8, 22.5)}" fill="url(#${u}g)"/><circle cx="9.5" cy="9.5" r="1.6" fill="${p}"/></g>`)}
      <g opacity=".07" fill="none" stroke="${m}" stroke-width=".6"><polygon points="${starPts(W / 2, H / 2 + 14, 70, 52, 8, 22.5)}"/><polygon points="${starPts(W / 2, H / 2 + 14, 52, 38, 8, 0)}"/></g></svg>`;
  }
  // 3) laurel: fine double border and two golden laurel branches rising on both sides
  function frameLaurel(th, W, H) {
    const u = 'kl' + (++seq), { m, a, p } = th;
    const branch = (flip) => {
      let g = '';
      const pts = []; for (let i = 0; i <= 16; i++) { const t = i / 16; pts.push([9.5 + 3 * Math.sin(t * Math.PI), H - 16 - t * (H * .62)]); }
      g += `<path d="M${pts.map(q => q.map(f1).join(' ')).join('L')}" fill="none" stroke="url(#${u}g)" stroke-width=".9"/>`;
      pts.forEach((q, i) => { if (!i) return; const r = i % 2 ? 1 : -1; g += `<ellipse cx="${f1(q[0] + r * 3.2)}" cy="${f1(q[1])}" rx="3.6" ry="1.35" transform="rotate(${r * -35 - 90} ${f1(q[0] + r * 3.2)} ${f1(q[1])})" fill="url(#${u}g)" stroke="${m}" stroke-width=".15"/>`; });
      return `<g transform="${flip ? `translate(${W} 0) scale(-1 1)` : ''}">${g}</g>`;
    };
    return svgOpen(W, H, goldGrad(u, th)) + `<rect width="${W}" height="${H}" fill="${p}"/>
      <rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="url(#${u}g)" stroke-width="2.2"/>
      <rect x="7" y="7" width="${W - 14}" height="${H - 14}" fill="none" stroke="${m}" stroke-width=".5"/>
      <rect x="8.2" y="8.2" width="${W - 16.4}" height="${H - 16.4}" fill="none" stroke="${a}" stroke-width=".3"/>
      ${branch(false)}${branch(true)}
      <g transform="translate(${W / 2} ${H - 7.6})"><path d="M-22 0H22" stroke="url(#${u}g)" stroke-width="1"/><polygon points="${starPts(0, 0, 4, 1.7, 5, 0)}" fill="url(#${u}g)" stroke="${m}" stroke-width=".2"/></g>
      <g opacity=".05" fill="${m}"><polygon points="${starPts(W / 2, H / 2 + 14, 62, 26, 5, 0)}"/></g></svg>`;
  }
  // 4) arch: the inner panel under a Moroccan horseshoe arch, spandrels filled with a light pattern
  function frameArch(th, W, H) {
    const u = 'ka' + (++seq), { m, a, l, p } = th;
    const x0 = 12, x1 = W - 12, y0 = 12, y1 = H - 12, top = 40, cx = W / 2;
    const arch = `M${x0} ${y1}V${top}Q${x0} ${y0 + 6} ${x0 + 30} ${y0 + 4}H${cx - 26}C${cx - 14} ${y0 + 4} ${cx - 8} ${y0 - 2} ${cx} ${y0 - 4}C${cx + 8} ${y0 - 2} ${cx + 14} ${y0 + 4} ${cx + 26} ${y0 + 4}H${x1 - 30}Q${x1} ${y0 + 6} ${x1} ${top}V${y1}Z`;
    const pat = `<pattern id="${u}p" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="${l}"/><path d="M4 0L8 4 4 8 0 4Z" fill="none" stroke="${a}" stroke-width=".4"/><circle cx="4" cy="4" r=".7" fill="${m}"/></pattern>`;
    return svgOpen(W, H, goldGrad(u, th) + pat) + `<rect width="${W}" height="${H}" fill="url(#${u}p)"/>
      <path d="${arch}" fill="${p}" stroke="url(#${u}g)" stroke-width="2"/>
      <path d="${arch}" fill="none" stroke="${m}" stroke-width=".5" transform="translate(${cx} ${H / 2}) scale(.985) translate(${-cx} ${-H / 2})"/>
      <rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="${m}" stroke-width="2"/>
      <rect x="5.2" y="5.2" width="${W - 10.4}" height="${H - 10.4}" fill="none" stroke="url(#${u}g)" stroke-width=".9"/>
      <g transform="translate(${cx} ${y0 - 5})"><circle r="3.4" fill="url(#${u}g)" stroke="${m}" stroke-width=".3"/><polygon points="${starPts(0, 0, 2.4, 1, 5, 0)}" fill="${m}"/></g></svg>`;
  }
  // 5) ribbons: modern certificate with diagonal ribbons in two corners
  function frameRibbon(th, W, H) {
    const u = 'kb' + (++seq), { m, a, l, p } = th;
    const band = tf => `<g transform="${tf}"><path d="M0 0H70L0 70Z" fill="${m}"/><path d="M76 0H86L0 86V76Z" fill="url(#${u}g)"/><path d="M92 0H95L0 95V92Z" fill="${a}"/><path d="M0 0H44L0 44Z" fill="${l}" opacity=".18"/></g>`;
    return svgOpen(W, H, goldGrad(u, th)) + `<rect width="${W}" height="${H}" fill="${p}"/>
      ${band('')}${band(`translate(${W} ${H}) scale(-1 -1)`)}
      <rect x="6" y="6" width="${W - 12}" height="${H - 12}" fill="none" stroke="url(#${u}g)" stroke-width="1.2"/>
      <rect x="8.4" y="8.4" width="${W - 16.8}" height="${H - 16.8}" fill="none" stroke="${m}" stroke-width=".4"/>
      <g opacity=".07"><circle cx="${W / 2}" cy="${H / 2 + 14}" r="55" fill="none" stroke="${m}" stroke-width="6"/></g></svg>`;
  }
  // 6) guilloche: interlaced waves around the page, like a diploma
  function frameGuilloche(th, W, H) {
    const u = 'kg' + (++seq), { m, a, p } = th;
    const wave = (ph, amp, col, sw) => {
      const pts = [], per = [[8, 8, W - 8, 8], [W - 8, 8, W - 8, H - 8], [W - 8, H - 8, 8, H - 8], [8, H - 8, 8, 8]];
      per.forEach(([xa, ya, xb, yb]) => { const L = Math.hypot(xb - xa, yb - ya), n = Math.round(L / 2), nx = -(yb - ya) / L, ny = (xb - xa) / L;
        for (let i = 0; i <= n; i++) { const t = i / n, w = amp * Math.sin(t * L / 6 * Math.PI + ph); pts.push([xa + (xb - xa) * t + nx * w, ya + (yb - ya) * t + ny * w]); } });
      return `<path d="M${pts.map(q => q.map(f1).join(' ')).join('L')}Z" fill="none" stroke="${col}" stroke-width="${sw}"/>`;
    };
    let w = ''; for (let k = 0; k < 6; k++) w += wave(k * Math.PI / 3, 3.2, k % 2 ? m : a, k % 2 ? .28 : .35);
    return svgOpen(W, H, goldGrad(u, th)) + `<rect width="${W}" height="${H}" fill="${p}"/>${w}
      <rect x="3" y="3" width="${W - 6}" height="${H - 6}" fill="none" stroke="${m}" stroke-width="1.1"/>
      <rect x="13" y="13" width="${W - 26}" height="${H - 26}" fill="none" stroke="url(#${u}g)" stroke-width="1.1"/>
      ${four(W, H, tf => `<g transform="${tf}"><circle cx="8" cy="8" r="5.4" fill="${p}" stroke="url(#${u}g)" stroke-width="1"/><polygon points="${starPts(8, 8, 4.2, 1.8, 6, 0)}" fill="${m}"/></g>`)}</svg>`;
  }
  const FRAMES = { classic: ['الإطار الكلاسيكي (زخرفة هندسية)', frame], royal: ['ملكي: إطار مذهب مزدوج بزخارف ملتوية', frameRoyal], zellige: ['زليج مغربي: شريط نجوم ثمانية', frameZellige],
    laurel: ['أغصان الغار الذهبية (للتفوق)', frameLaurel], arch: ['قوس مغربي بزخرفة', frameArch], ribbon: ['عصري: أشرطة مائلة', frameRibbon], guilloche: ['شهادة رسمية: تموجات متشابكة', frameGuilloche] };
  /* ---------------- 1.9.2: 90 generated frames (10 borders × 9 corner ornaments), all colour themes ---------------- */
  const BORDERS = [
    ['خط مزدوج رفيع', (u, th, W, H) => `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="${th.m}" stroke-width="1.2"/><rect x="8" y="8" width="${W - 16}" height="${H - 16}" fill="none" stroke="url(#${u}g)" stroke-width=".7"/>`],
    ['ذهبي عريض', (u, th, W, H) => `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="url(#${u}g)" stroke-width="3.4"/><rect x="8.4" y="8.4" width="${W - 16.8}" height="${H - 16.8}" fill="none" stroke="${th.m}" stroke-width=".6"/>`],
    ['منقط', (u, th, W, H) => `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="${th.m}" stroke-width=".8"/><rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" fill="none" stroke="${th.a}" stroke-width="1.6" stroke-dasharray=".01 3" stroke-linecap="round"/>`],
    ['متقطع', (u, th, W, H) => `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" fill="none" stroke="url(#${u}g)" stroke-width="1.6"/><rect x="8.5" y="8.5" width="${W - 17}" height="${H - 17}" fill="none" stroke="${th.m}" stroke-width=".8" stroke-dasharray="4 2.2"/>`],
    ['ثلاثي', (u, th, W, H) => `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${th.m}" stroke-width="2"/><rect x="7.2" y="7.2" width="${W - 14.4}" height="${H - 14.4}" fill="none" stroke="url(#${u}g)" stroke-width="1.2"/><rect x="9.6" y="9.6" width="${W - 19.2}" height="${H - 19.2}" fill="none" stroke="${th.m}" stroke-width=".4"/>`],
    ['زوايا مستديرة', (u, th, W, H) => `<rect x="5" y="5" width="${W - 10}" height="${H - 10}" rx="13" fill="none" stroke="${th.m}" stroke-width="1.6"/><rect x="8.4" y="8.4" width="${W - 16.8}" height="${H - 16.8}" rx="10" fill="none" stroke="url(#${u}g)" stroke-width="1.1"/>`],
    ['حواف مسننة', (u, th, W, H) => { let c = ''; const put = (x, y) => { c += `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.7" fill="url(#${u}g)"/>`; }; for (let x = 12; x <= W - 12; x += 5) { put(x, 6.5); put(x, H - 6.5); } for (let y = 12; y <= H - 12; y += 5) { put(6.5, y); put(W - 6.5, y); } return `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${th.m}" stroke-width=".9"/><rect x="9.5" y="9.5" width="${W - 19}" height="${H - 19}" fill="none" stroke="${th.m}" stroke-width=".5"/>${c}`; }],
    ['زوايا مقطوعة', (u, th, W, H) => { const k = 15, o = (d) => `M${d + k} ${d}H${W - d - k}L${W - d} ${d + k}V${H - d - k}L${W - d - k} ${H - d}H${d + k}L${d} ${H - d - k}V${d + k}Z`; return `<path d="${o(5)}" fill="none" stroke="${th.m}" stroke-width="1.8"/><path d="${o(8.5)}" fill="none" stroke="url(#${u}g)" stroke-width="1.1"/>`; }],
    ['شريط مربعات', (u, th, W, H) => { let c = ''; const put = (x, y) => { c += `<rect x="${f1(x - 1.5)}" y="${f1(y - 1.5)}" width="3" height="3" transform="rotate(45 ${f1(x)} ${f1(y)})" fill="${th.m}"/>`; }; for (let x = 14; x <= W - 14; x += 6.5) { put(x, 7); put(x, H - 7); } for (let y = 14; y <= H - 14; y += 6.5) { put(7, y); put(W - 7, y); } return `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="url(#${u}g)" stroke-width="1.4"/><rect x="10" y="10" width="${W - 20}" height="${H - 20}" fill="none" stroke="${th.a}" stroke-width=".6"/>${c}`; }],
    ['متعرج', (u, th, W, H) => { const z = (d, a) => { let p = `M${d} ${d}`; for (let x = d; x <= W - d; x += 4) p += `L${x} ${d + (((x - d) / 4) % 2 ? a : 0)}`; for (let y = d; y <= H - d; y += 4) p += `L${W - d - (((y - d) / 4) % 2 ? a : 0)} ${y}`; for (let x = W - d; x >= d; x -= 4) p += `L${x} ${H - d - (((W - d - x) / 4) % 2 ? a : 0)}`; for (let y = H - d; y >= d; y -= 4) p += `L${d + (((H - d - y) / 4) % 2 ? a : 0)} ${y}`; return p + 'Z'; }; return `<rect x="4" y="4" width="${W - 8}" height="${H - 8}" fill="none" stroke="${th.m}" stroke-width="1.4"/><path d="${z(8, 2.2)}" fill="none" stroke="url(#${u}g)" stroke-width=".7"/><rect x="13" y="13" width="${W - 26}" height="${H - 26}" fill="none" stroke="${th.m}" stroke-width=".4"/>`; }]
  ];
  const CORNERS = [
    ['نجمة ثمانية', (u, th) => `<polygon points="${starPts(14, 14, 11, 5, 8, 22.5)}" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".4"/><circle cx="14" cy="14" r="2.2" fill="${th.p}" stroke="${th.m}" stroke-width=".3"/>`],
    ['وردة', (u, th) => { let c = ''; for (let i = 0; i < 8; i++) { const a = i * 45; c += `<ellipse cx="14" cy="8.2" rx="2.6" ry="5.2" transform="rotate(${a} 14 14)" fill="${i % 2 ? th.l : 'url(#' + u + 'g)'}" stroke="${th.m}" stroke-width=".3"/>`; } return c + `<circle cx="14" cy="14" r="2.4" fill="${th.m}"/>`; }],
    ['دوائر متداخلة', (u, th) => `<circle cx="14" cy="14" r="11" fill="${th.l}" stroke="url(#${u}g)" stroke-width="1"/><circle cx="14" cy="14" r="7.4" fill="none" stroke="${th.m}" stroke-width=".6"/><circle cx="14" cy="14" r="3.6" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".3"/>`],
    ['لولب أرابيسك', (u, th) => `<path d="M6 6C6 20 12 26 26 26M6 6C20 6 26 12 26 26" fill="none" stroke="url(#${u}g)" stroke-width="1.5" stroke-linecap="round"/><path d="M9 9C9 17 13 21 21 21M9 9C17 9 21 13 21 21" fill="none" stroke="${th.m}" stroke-width=".6"/><circle cx="9" cy="9" r="2.6" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".3"/>`],
    ['معين متداخل', (u, th) => `<path d="M14 2L26 14 14 26 2 14Z" fill="${th.l}" stroke="url(#${u}g)" stroke-width="1.2"/><path d="M14 7L21 14 14 21 7 14Z" fill="${th.m}"/><path d="M14 10.4L17.6 14 14 17.6 10.4 14Z" fill="url(#${u}g)"/>`],
    ['هلال ونجمة', (u, th) => `<circle cx="13" cy="14" r="9" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".4"/><circle cx="16" cy="12.6" r="8" fill="${th.p}"/><polygon points="${starPts(20, 13.4, 4.2, 1.8, 5, 0)}" fill="${th.m}"/>`],
    ['أوراق', (u, th) => { let c = ''; for (let i = 0; i < 5; i++) { c += `<path d="M5 5Q${12 + i * 3} ${6 + i * 1} ${22 + i * 1.4} ${9 + i * 4.2}Q${12 + i * 1} ${14 + i * 3} 5 5Z" transform="rotate(${-8 + i * 4} 5 5)" fill="${i % 2 ? th.l : 'url(#' + u + 'g)'}" stroke="${th.m}" stroke-width=".3"/>`; } return c + `<circle cx="5.5" cy="5.5" r="2" fill="${th.m}"/>`; }],
    ['زهرة رباعية', (u, th) => `<g fill="url(#${u}g)" stroke="${th.m}" stroke-width=".35"><circle cx="14" cy="7.4" r="5.2"/><circle cx="14" cy="20.6" r="5.2"/><circle cx="7.4" cy="14" r="5.2"/><circle cx="20.6" cy="14" r="5.2"/></g><circle cx="14" cy="14" r="4.4" fill="${th.p}" stroke="${th.m}" stroke-width=".4"/><circle cx="14" cy="14" r="1.6" fill="${th.m}"/>`],
    ['مربعات متدرجة', (u, th) => `<rect x="3" y="3" width="24" height="24" fill="${th.m}"/><rect x="6.5" y="6.5" width="17" height="17" fill="url(#${u}g)"/><rect x="10.5" y="10.5" width="9" height="9" fill="${th.p}" stroke="${th.m}" stroke-width=".4"/><rect x="13" y="13" width="4" height="4" fill="${th.m}"/>`]
  ];
  const BGS = ['', (u, th, W, H) => `<pattern id="${u}b" width="6" height="6" patternUnits="userSpaceOnUse"><circle cx="3" cy="3" r=".5" fill="${th.a}" opacity=".5"/></pattern><rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="url(#${u}b)"/>`, (u, th, W, H) => `<pattern id="${u}b" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 5L5 0 10 5 5 10Z" fill="none" stroke="${th.m}" stroke-width=".2" opacity=".35"/></pattern><rect x="9" y="9" width="${W - 18}" height="${H - 18}" fill="url(#${u}b)"/>`];
  const genFrame = (bi, ci) => (th, W, H) => {
    const u = 'kx' + (++seq), { p } = th;
    const mids = (bi + ci) % 2 ? `<g transform="translate(${W / 2} 6.4)"><path d="M-9 0L0-2.6 9 0 0 2.6Z" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".3"/></g><g transform="translate(${W / 2} ${H - 6.4})"><path d="M-9 0L0-2.6 9 0 0 2.6Z" fill="url(#${u}g)" stroke="${th.m}" stroke-width=".3"/></g>` : '';
    const bg = BGS[(bi + 2 * ci) % 3];
    return svgOpen(W, H, goldGrad(u, th)) + `<rect width="${W}" height="${H}" fill="${p}"/>${bg ? bg(u, th, W, H) : ''}${BORDERS[bi][1](u, th, W, H)}`
      + four(W, H, tf => `<g transform="${tf} translate(4 4)">${CORNERS[ci][1](u, th)}</g>`) + mids + '</svg>';
  };
  for (let bi = 0; bi < BORDERS.length; bi++) for (let ci = 0; ci < CORNERS.length; ci++) FRAMES['g' + bi + ci] = [`${BORDERS[bi][0]} + ${CORNERS[ci][0]}`, genFrame(bi, ci)];

  /* ---------------- 1.9.2: surface shape (cuts the whole certificate) and custom colours ---------------- */
  const SHAPES = { rect: ['مستطيل (الافتراضي)', null],
    round: ['زوايا مستديرة', (W, H) => { const r = 16; return `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`; }],
    round2: ['زوايا مستديرة كبيرة', (W, H) => { const r = 34; return `M${r} 0H${W - r}A${r} ${r} 0 0 1 ${W} ${r}V${H - r}A${r} ${r} 0 0 1 ${W - r} ${H}H${r}A${r} ${r} 0 0 1 0 ${H - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`; }],
    cut: ['زوايا مقطوعة', (W, H) => { const k = 18; return `M${k} 0H${W - k}L${W} ${k}V${H - k}L${W - k} ${H}H${k}L0 ${H - k}V${k}Z`; }],
    scoop: ['زوايا مقعرة (تذكرة)', (W, H) => { const r = 14; return `M${r} 0H${W - r}A${r} ${r} 0 0 0 ${W} ${r}V${H - r}A${r} ${r} 0 0 0 ${W - r} ${H}H${r}A${r} ${r} 0 0 0 0 ${H - r}V${r}A${r} ${r} 0 0 0 ${r} 0Z`; }],
    arch: ['قوس علوي', (W, H) => { const r = 60; return `M0 ${H}V${r}Q0 0 ${r} 0H${W - r}Q${W} 0 ${W} ${r}V${H}Z`; }],
    ogee: ['قوس مغربي (حدوة)', (W, H) => `M0 ${H}V46Q0 14 38 12H${W / 2 - 40}C${W / 2 - 18} 12 ${W / 2 - 10} 0 ${W / 2} 0C${W / 2 + 10} 0 ${W / 2 + 18} 12 ${W / 2 + 40} 12H${W - 38}Q${W} 14 ${W} 46V${H}Z`],
    oval: ['شبه بيضاوي', (W, H) => { const r = 52; return `M${r} 0H${W - r}A${r} ${H / 2} 0 0 1 ${W - r} ${H}H${r}A${r} ${H / 2} 0 0 1 ${r} 0Z`; }] };
  const shapeOpts = () => Object.keys(SHAPES).map(k => [k, SHAPES[k][0]]);
  function applyShape(svg, shape, th) {
    const d = SHAPES[shape] && SHAPES[shape][1];
    if (!d) return svg;
    const m = /^(<svg[^>]*viewBox="0 0 ([\d.]+) ([\d.]+)"[^>]*>)([\s\S]*)<\/svg>$/.exec(svg);
    if (!m) return svg;
    const W = +m[2], H = +m[3], u = 'ks' + (++seq), path = d(W, H);
    return `${m[1]}<defs><clipPath id="${u}"><path d="${path}"/></clipPath></defs><g clip-path="url(#${u})">${m[4]}</g><path d="${path}" fill="none" stroke="${th.m}" stroke-width="1.6"/></svg>`;
  }
  const shade = (hex, k) => { const n = parseInt(String(hex).replace('#', ''), 16) || 0, c = i => Math.max(0, Math.min(255, Math.round(((n >> i) & 255) * k))); return '#' + [16, 8, 0].map(i => c(i).toString(16).padStart(2, '0')).join(''); };
  const mix = (hex, t) => { const n = parseInt(String(hex).replace('#', ''), 16) || 0, c = i => Math.round(((n >> i) & 255) * (1 - t) + 255 * t); return '#' + [16, 8, 0].map(i => c(i).toString(16).padStart(2, '0')).join(''); };
  const okHex = v => /^#[0-9a-f]{6}$/i.test(String(v || ''));
  const customTh = c => { const m = okHex(c.cMain) ? c.cMain : '#16325f', a = okHex(c.cAcc) ? c.cAcc : '#b8892b', p = okHex(c.cPaper) ? c.cPaper : '#fffdf6'; return { n: 'مخصص', m, a, p, l: mix(m, .88), g1: mix(a, .45), g2: a, g3: shade(a, .72) }; };
  /* fonts installed on the computer (read once from the main process; falls back to a short list) */
  let FONTS = ['MAJT', 'MAJ', 'Amiri', 'NSA'];
  if (window.api && window.api.fontsList) window.api.fontsList().then(l => { if (Array.isArray(l) && l.length) FONTS = Array.from(new Set(FONTS.concat(l))); }).catch(() => {});
  const fontOpts = () => [['', 'الخط الافتراضي للشهادة']].concat(FONTS.map(f => [f, f]));
  const frameOpts = () => [['auto', 'تلقائي حسب نوع الشهادة'], ['mix', 'إطار مختلف لكل شهادة']].concat(Object.keys(FRAMES).map((k, i) => [k, (i < 7 ? '' : (i - 6) + '. ') + FRAMES[k][0]]));
  const FKEYS = Object.keys(FRAMES);
  const frameAuto = c => (c.rank ? 'laurel' : c.crescent ? 'arch' : /اليوم العالمي/.test(c.title || '') ? 'ribbon' : /شكر/.test(c.title || '') ? 'zellige' : 'royal');
  const divider = (th, w, crescent) => {
    const c = crescent
      ? `<circle cx="60" cy="4" r="3.1" fill="${th.a}"/><circle cx="61.3" cy="3.4" r="2.7" fill="${th.p}"/><polygon points="${starPts(64.4, 3.2, 1.35, .55, 5, 0)}" fill="${th.a}"/>`
      : `<path d="M60 .4L64.2 4 60 7.6 55.8 4Z" fill="${th.a}"/><path d="M60 2L62.4 4 60 6 57.6 4Z" fill="${th.p}"/>`;
    return `<svg class="kd-div" viewBox="0 0 120 8" width="${w}mm" height="${f1(w / 15)}mm" xmlns="http://www.w3.org/2000/svg">
      <line x1="2" y1="4" x2="49" y2="4" stroke="${th.a}" stroke-width=".55"/><line x1="71" y1="4" x2="118" y2="4" stroke="${th.a}" stroke-width=".55"/>
      <circle cx="51.5" cy="4" r="1.1" fill="${th.m}"/><circle cx="68.5" cy="4" r="1.1" fill="${th.m}"/><circle cx="46" cy="4" r=".7" fill="${th.a}"/><circle cx="74" cy="4" r=".7" fill="${th.a}"/>${c}</svg>`;
  };
  const medal = (th, rank) => {
    const u = 'kdm' + (++seq);
    return `<svg class="kd-medal" viewBox="0 0 40 54" width="21mm" height="28.4mm" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${th.g1}"/><stop offset=".5" stop-color="${th.g2}"/><stop offset="1" stop-color="${th.g3}"/></linearGradient></defs>
      <path d="M10 28L3 53 13 47.5 19 53 22 31Z" fill="${th.m}"/><path d="M30 28L37 53 27 47.5 21 53 18 31Z" fill="${th.a}"/>
      <polygon points="${starPts(20, 19, 18.6, 16.6, 22, 0)}" fill="url(#${u})" stroke="${th.m}" stroke-width=".4"/>
      <circle cx="20" cy="19" r="14.2" fill="${th.m}"/><circle cx="20" cy="19" r="12.4" fill="none" stroke="url(#${u})" stroke-width=".7"/>
      <text x="20" y="25.8" text-anchor="middle" font-family="MAJT, Amiri, serif" font-weight="700" font-size="19" fill="${th.g1}">${esc(String(rank))}</text></svg>`;
  };

  /* ---------------- certificate page ---------------- */
  const titleSize = t => { const n = String(t || '').length; return n <= 12 ? 46 : n <= 20 ? 40 : n <= 28 ? 33 : 27; };
  const nameSize = t => { const n = String(t || '').length; return n <= 22 ? 34 : n <= 32 ? 29 : n <= 44 ? 24 : 20; };
  const sg = (label, name) => (label || name ? `<div class="kd-sg"><div class="l">${esc(label || '')}</div>${name ? `<div class="n">${esc(name)}</div>` : ''}<div class="sp"></div></div>` : '<div class="kd-sg"></div>');
  function card(s, c) {
    const th = c.theme === 'custom' ? customTh(c) : thOf(c.theme);
    const fam = c.font ? `font-family:'${String(c.font).replace(/['"<>;]/g, '')}','MAJT','Amiri',serif;` : '';
    const lines = (c.lines || []).map(l => `<p>${esc(l)}</p>`).join('');
    const city = c.city || s.city || '..........';
    const dateLine = c.noDate ? '' : `حرر ب${esc(city)} في ${c.date ? esc(K.ldate(c.date)) : '..........'}`;
    const mid = c.rank ? medal(th, c.rank) : '<div class="kd-seal"><span>الختم</span></div>';
    return `<div class="kd" style="--m:${th.m};--a:${th.a};--l:${th.l};--p:${th.p};${fam}">
      <div class="kd-bgw docx-bg">${applyShape((FRAMES[c.frame] || FRAMES.classic)[1](th, 297, 209.5), c.shape, th)}</div>
      <div class="kd-in docx-gaps">
        <div class="kd-hdr">${Dx.header(s)}</div>
        <div class="kd-title" style="font-size:${titleSize(c.title)}pt">${esc(c.title)}</div>
        ${c.sub ? `<div class="kd-sub">${esc(c.sub)}</div>` : ''}
        ${divider(th, 86, c.crescent)}
        ${c.pre ? `<div class="kd-pre">${esc(c.pre)}</div>` : ''}
        ${c.namesHtml || (c.name ? `<div class="kd-name" style="font-size:${nameSize(c.name)}pt">${esc(c.name)}</div>` : '')}
        ${c.role ? `<div class="kd-role">${esc(c.role)}</div>` : ''}
        <div class="kd-body">${lines}</div>
        ${dateLine ? `<div class="kd-date">${dateLine}</div>` : ''}
        <div class="kd-sign">${sg(c.sr, c.srn)}${mid}${sg(c.sl, c.sln)}</div>
      </div></div>`;
  }

  /* ---------------- text helpers ---------------- */
  // «{{token}}» → value; tokens whose name starts with o_ vanish when empty, the others show dots
  const fillK = (str, ctx) => String(str == null ? '' : str).replace(/\{\{(\w+)\}\}/g, (m, k) => {
    const v = ctx[k];
    if (v != null && v !== '') return v;
    return /^o_/.test(k) ? '' : '..........';
  }).replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+([،.؛])/g, '$1');
  const linesOf = (str, ctx) => fillK(str, ctx).split(/\r?\n/).map(x => x.trim()).filter(Boolean);
  const isFem = t => /(ة|ات)$|السيدة|الأستاذة|المربية|\(ة\)/.test(String(t || '')) && !/\(ة\)/.test(String(t || ''));
  const gctx = (title) => {
    const t = String(title || '');
    if (/\(ة\)|\(/.test(t) || !t) return { h: 'ه(ا)', lah: 'له/لها', hu: 'هو/هي' };
    return /ة$/.test(t.trim()) ? { h: 'ها', lah: 'لها', hu: 'هي' } : { h: 'ه', lah: 'له', hu: 'هو' };
  };
  const titleOf = (name, dflt) => {
    const e = K.E.byName(name);
    if (!e) return dflt || 'الأستاذ(ة)';
    const f = e.sex === 'F', c = K.E.cat(e);
    if (c === 'admin' || c === 'other') return f ? 'السيدة' : 'السيد';
    if (c === 'preschool') return f ? 'المربية' : 'المربي';
    return f ? 'الأستاذة' : 'الأستاذ';
  };
  const ltr = x => (x == null || x === '' ? '' : '\u2066' + x + '\u2069');
  const base = (s, sy, extra) => Object.assign(K.tokens(), { sy: ltr(MK.syDash(sy)) }, extra || {});

  /* common fields: theme, date, city, signatures */
  const commonInit = (s, o) => Object.assign({ theme: 'auto', frame: 'auto', shape: 'rect', font: '', cMain: '#16325f', cAcc: '#b8892b', cPaper: '#fffdf6', date: Dx.todayIso(), city: s.city || '', sl: 'رئيس المؤسسة', sln: s.director || '', sr: '', srn: '' }, o || {});
  const commonDefs = autoTheme => [
    { sec: 'التصميم والتوقيعات' },
    { k: 'frame', l: 'شكل الإطار', t: 'select', opts: frameOpts(), half: true },
    { k: 'theme', l: 'لون الشهادة وزخرفتها', t: 'select', opts: themeOpts(autoTheme), half: true },
    { k: 'shape', l: 'شكل سطح الشهادة', t: 'select', opts: shapeOpts, half: true },
    { k: 'font', l: 'الخط (من خطوط حاسوبك)', t: 'select', opts: fontOpts, half: true },
    { k: 'cMain', l: 'اللون الأساسي (للألوان المخصصة)', t: 'color', half: true }, { k: 'cAcc', l: 'لون الزخرفة / الذهبي', t: 'color', half: true }, { k: 'cPaper', l: 'لون الورق', t: 'color', half: true },
    { k: 'date', l: 'تاريخ التحرير', t: 'date', half: true },
    { k: 'city', l: 'مكان التحرير', half: true }, { k: 'sln', l: 'اسم الموقّع الأيسر', half: true },
    { k: 'sl', l: 'صفة الموقّع الأيسر', half: true }, { k: 'sr', l: 'صفة الموقّع الأيمن (اختياري)', half: true },
    { k: 'srn', l: 'اسم الموقّع الأيمن', half: true }
  ];
  const themeFor = (f, auto) => (f.theme && f.theme !== 'auto' ? f.theme : auto);
  const txtDef = (note) => ({ k: 'text', l: 'نص الشهادة', t: 'area', rows: 5, hint: note || 'اتركه فارغا لاستعمال النص الجاهز، أو اضغط «إدراج النص الجاهز» ثم عدّله كما تشاء. يمكنك استعمال {{name}} {{activity}} {{school}} {{date}}.' });
  const tplBtn = '<button type="button" class="btn sm" data-act="tpl">إدراج النص الجاهز للتعديل</button>';
  const pageOf = (s, f, cards) => ({ page: 'a4l', title: '', pages: cards.map((c, i) => card(s, Object.assign({}, c, { shape: f.shape, font: f.font, cMain: f.cMain, cAcc: f.cAcc, cPaper: f.cPaper,
    frame: !f.frame || f.frame === 'auto' ? frameAuto(c) : f.frame === 'mix' ? FKEYS[(i + 1) % FKEYS.length] : f.frame }))) });

  const DOCS_ = [];
  const add = d => { DOCS_.push(d); return d; };
  const emps = () => sortedEmps();

  /* ===================== A — شواهد تقدير الأساتذة ===================== */
  const OCC = [
    ['part', 'المشاركة في نشاط'], ['contrib', 'المساهمة في نشاط'], ['effort', 'المجهودات المتميزة في إنجاح نشاط'], ['sup', 'التأطير والإشراف على نشاط'], ['year', 'العطاء المتميز خلال الموسم الدراسي']
  ];
  const OCC_TXT = {
    part: 'اعترافا بمشاركة {{title}} {{name}}{{o_role}} الفاعلة والمتميزة في {{activity}}{{o_date}} المنظم بمؤسسة {{school}}،\nوتنويها بروح المسؤولية والالتزام التي أبان عنها خدمة للتلميذات والتلاميذ،\nتتقدم إدارة المؤسسة بأسمى عبارات الشكر والتقدير، متمنية {{lah}} مزيدا من العطاء والتألق.',
    contrib: 'تقديرا للمساهمة القيمة التي قدمها {{title}} {{name}}{{o_role}} في {{activity}}{{o_date}} بمؤسسة {{school}}،\nولما أبان عنه من حس تربوي وروح تعاون عالية ساهمت في نجاح هذا النشاط،\nتتقدم إدارة المؤسسة بجزيل الشكر والعرفان، متمنية {{lah}} دوام التوفيق والنجاح.',
    effort: 'نظرا للمجهودات الجبارة والمتميزة التي بذلها {{title}} {{name}}{{o_role}} في إنجاح {{activity}}{{o_date}} بمؤسسة {{school}}،\nوإسهامه المتواصل في إشعاع المؤسسة وخدمة المتعلمين،\nتتقدم إدارة المؤسسة بخالص الشكر والامتنان، وتشيد بعطاءاته النبيلة.',
    sup: 'عرفانا بالتأطير المحكم والإشراف المتميز الذي أبان عنه {{title}} {{name}}{{o_role}} في {{activity}}{{o_date}} بمؤسسة {{school}}،\nوتثمينا لجهوده في مواكبة التلميذات والتلاميذ وتأطيرهم،\nتتقدم إدارة المؤسسة بأصدق عبارات الشكر والتقدير، متمنية {{lah}} المزيد من التألق.',
    year: 'تقديرا للعطاء المتميز والالتزام المهني الرفيع اللذين أبان عنهما {{title}} {{name}}{{o_role}} طيلة الموسم الدراسي {{sy}} بمؤسسة {{school}}،\nوإسهامه الفعال في الارتقاء بجودة التعلمات وفي مختلف الأنشطة التربوية،\nتتقدم إدارة المؤسسة بخالص الشكر والتقدير، وتتمنى {{lah}} دوام النجاح والعطاء.'
  };
  const empRowFill = r => { const e = K.E.byName(r[0]); if (!e) return null; return [r[0], r[1] || titleOf(r[0]), r[2] || '']; };
  add({
    k: 'kd_teacher', t: 'شهادة تقدير للأستاذ(ة) — المشاركة والمساهمة في نشاط', grp: 't', d: 'شهادة فاخرة لكل أستاذ(ة) بمناسبة المشاركة في نشاط أو المساهمة فيه أو المجهود المتميز في إنجاحه.', auto: 'لائحة الأساتذة والأطر (الاسم والصفة بحسب الجنس)', page: 'a4l',
    init: s => commonInit(s, { occ: 'part', activity: '', adate: '', text: '', rows: [['', '', '']] }),
    defs: f => [{ sec: 'الشهادة' }, { k: 'occ', l: 'مناسبة التقدير', t: 'select', opts: OCC, half: true }, { k: 'activity', l: 'اسم النشاط', half: true, ph: 'مثال: الاحتفال باليوم الوطني للمدرسة المغربية' },
      { k: 'adate', l: 'تاريخ النشاط', t: 'date', half: true }, { t: 'html', half: true, html: `<label>&nbsp;</label><button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة</button>` },
      gridDef('rows', 'الأساتذة المكرَّمون (شهادة لكل سطر)', ['الاسم الكامل', 'الصفة', 'الدور في النشاط (اختياري)'], { widths: ['1.7fr', '.8fr', '1.5fr'], list: ['k2Emps', null, null], fill: empRowFill }),
      txtDef(), { t: 'html', html: tplBtn }].concat(commonDefs(false)),
    act: {
      all: (f, sy, c) => { f.rows = K.E.teachers().map(e => [fullName(e), titleOf(fullName(e)), '']); c.save('rows'); },
      tpl: (f, sy, c) => { f.text = OCC_TXT[f.occ] || ''; c.save('text'); }
    },
    build: (s, f, sy) => {
      const rows = (f.rows || []).filter(r => String(r[0] || '').trim());
      const list = rows.length ? rows : [['..........', 'الأستاذ(ة)', '']];
      const occTitle = { part: 'شهادة تقدير', contrib: 'شهادة تقدير', effort: 'شهادة شكر وتقدير', sup: 'شهادة شكر وتقدير', year: 'شهادة تقدير وعرفان' }[f.occ] || 'شهادة تقدير';
      return pageOf(s, f, list.map(r => {
        const title = r[1] || titleOf(r[0]);
        const ctx = base(s, sy, Object.assign({ title, name: r[0], activity: f.activity, o_role: r[2] ? ` (${r[2]})` : '', o_date: f.adate ? ` بتاريخ ${K.ldate(f.adate)}` : '' }, gctx(title)));
        return { theme: themeFor(f, 'navy'), title: occTitle, pre: 'تتشرف إدارة مؤسسة ' + (s.school || '..........') + ' بمنح هذه الشهادة إلى', name: `${title} ${r[0]}`.trim(), lines: linesOf(f.text || OCC_TXT[f.occ], ctx), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn };
      }));
    }
  });

  add({
    k: 'kd_team', t: 'شهادة شكر وتقدير جماعية لفريق عمل', grp: 't', d: 'شهادة واحدة تضم أسماء الأساتذة والأطر المساهمين في إنجاح نشاط معيّن.', auto: 'لائحة الأساتذة والأطر', page: 'a4l',
    init: s => commonInit(s, { activity: '', adate: '', text: '', names: [['']] }),
    defs: () => [{ sec: 'الشهادة' }, { k: 'activity', l: 'اسم النشاط', half: true }, { k: 'adate', l: 'تاريخ النشاط', t: 'date', half: true },
      { t: 'html', html: `<button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة والأطر</button>` },
      gridDef('names', 'أسماء المكرَّمين', ['الاسم الكامل'], { widths: ['1fr'], list: ['k2Emps'] }),
      { k: 'text', l: 'نص الشهادة', t: 'area', rows: 4, hint: 'اتركه فارغا لاستعمال النص الجاهز.' }].concat(commonDefs(false)),
    act: { all: (f, sy, c) => { f.names = emps().filter(e => ['admin', 'teacher', 'assigned', 'preschool'].includes(K.E.cat(e))).map(e => [fullName(e)]); c.save('names'); } },
    build: (s, f, sy) => {
      const names = (f.names || []).map(r => String(r[0] || '').trim()).filter(Boolean);
      const fs = names.length > 24 ? 12 : names.length > 14 ? 14.5 : 17;
      const namesHtml = `<div class="kd-names" style="font-size:${fs}pt">${(names.length ? names : ['..........', '..........', '..........']).map(n => `<span>${esc(n)}</span>`).join('<i></i>')}</div>`;
      const ctx = base(s, sy, { activity: f.activity, o_date: f.adate ? ` بتاريخ ${K.ldate(f.adate)}` : '' });
      const txt = f.text || 'تقديرا للمجهودات المتميزة والروح الجماعية العالية التي أبان عنها الفريق في إنجاح {{activity}}{{o_date}} بمؤسسة {{school}}،\nتتقدم إدارة المؤسسة بأسمى عبارات الشكر والعرفان، متمنية للجميع دوام التألق والنجاح.';
      return pageOf(s, f, [{ theme: themeFor(f, 'navy'), title: 'شهادة شكر وتقدير', pre: 'تتقدم إدارة المؤسسة بالشكر الجزيل والتقدير الخالص إلى السيدات والسادة', namesHtml, lines: linesOf(txt, ctx), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn }]);
    }
  });

  /* ===================== B — التهاني ===================== */
  const FEAST = {
    ramadan: { n: 'حلول شهر رمضان الأبرك', title: 'رمضان كريم', theme: 'plum', cres: true, txt: 'بمناسبة حلول شهر رمضان الأبرك{{o_hy}}، أعاده الله علينا وعليكم باليمن والإيمان والسلامة والإسلام،\nوتقبل الله منا ومنكم الصيام والقيام وصالح الأعمال،\nوكل عام وأنتم بخير.' },
    fitr: { n: 'عيد الفطر المبارك', title: 'عيد فطر مبارك', theme: 'emerald', cres: true, txt: 'بمناسبة حلول عيد الفطر المبارك{{o_hy}}، أعاده الله علينا وعليكم باليمن والخير والبركات،\nوتقبل الله منا ومنكم صالح الأعمال،\nوكل عام وأنتم بألف خير.' },
    adha: { n: 'عيد الأضحى المبارك', title: 'عيد أضحى مبارك', theme: 'burgundy', cres: true, txt: 'بمناسبة حلول عيد الأضحى المبارك{{o_hy}}، أعاده الله علينا وعليكم بالصحة والسعادة والمسرات،\nوتقبل الله منا ومنكم صالح الأعمال،\nوكل عام وأنتم بألف خير.' },
    hijri: { n: 'رأس السنة الهجرية', title: 'سنة هجرية سعيدة', theme: 'teal', cres: true, txt: 'بمناسبة حلول السنة الهجرية الجديدة{{o_hy}}، أعادها الله علينا وعليكم بالخير واليمن والبركات،\nوجعلها سنة عطاء وتوفيق وصلاح للأحوال،\nوكل عام وأنتم بخير.' },
    mawlid: { n: 'ذكرى المولد النبوي الشريف', title: 'المولد النبوي الشريف', theme: 'emerald', cres: true, txt: 'بمناسبة ذكرى المولد النبوي الشريف{{o_hy}}، أعادها الله علينا وعليكم بالخير والبركات،\nوجعلها ذكرى تجمعنا على الهدى والمحبة وصلاح الأحوال،\nوكل عام وأنتم بخير.' }
  };
  const toLabel = 'السادة الأساتذة والأطر الإدارية والتربوية والعاملين بالمؤسسة';
  add({
    k: 'kd_feast', t: 'تهنئة بمناسبة الأعياد الدينية', grp: 'f', d: 'بطاقة تهنئة بعيد الفطر أو الأضحى أو رمضان أو رأس السنة الهجرية أو المولد النبوي.', auto: 'اسم المؤسسة والتوقيع', page: 'a4l',
    init: s => commonInit(s, { feast: 'fitr', hy: '', to: toLabel, text: '', names: [['']] }),
    defs: () => [{ sec: 'التهنئة' }, { k: 'feast', l: 'المناسبة', t: 'select', opts: Object.keys(FEAST).map(k => [k, FEAST[k].n]), half: true }, { k: 'hy', l: 'السنة الهجرية (اختياري)', half: true, ph: 'مثال: 1448 هـ' },
      { k: 'to', l: 'الموجهة إلى', ph: toLabel },
      { note: 'لإصدار بطاقة شخصية لكل فرد أدخل الأسماء في الجدول التالي (يُصدر سطر = بطاقة)، وإن تركته فارغا تُصدر بطاقة عامة واحدة.' },
      gridDef('names', 'أسماء المهنَّئين (اختياري)', ['الاسم الكامل', 'الصفة'], { widths: ['1.7fr', '.8fr'], list: ['k2Emps', null], fill: r => (K.E.byName(r[0]) ? [r[0], r[1] || titleOf(r[0])] : null) }),
      { t: 'html', html: `<button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة والأطر</button> ${tplBtn}` },
      txtDef('اتركه فارغا لاستعمال النص الجاهز.')].concat(commonDefs(true)),
    act: {
      all: (f, sy, c) => { f.names = emps().filter(e => ['admin', 'teacher', 'assigned', 'preschool'].includes(K.E.cat(e))).map(e => [fullName(e), titleOf(fullName(e))]); c.save('names'); },
      tpl: (f, sy, c) => { f.text = (FEAST[f.feast] || FEAST.fitr).txt; c.save('text'); }
    },
    build: (s, f, sy) => {
      const F = FEAST[f.feast] || FEAST.fitr;
      const names = (f.names || []).filter(r => String(r[0] || '').trim());
      const mk = (to) => {
        const ctx = base(s, sy, { o_hy: f.hy ? ' ' + f.hy : '' });
        return { theme: themeFor(f, F.theme), crescent: F.cres, title: F.title, pre: `تتقدم إدارة مؤسسة ${s.school || '..........'} بأحر التهاني وأطيب التبريكات إلى`, name: to, lines: linesOf(f.text || F.txt, ctx), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn };
      };
      return pageOf(s, f, names.length ? names.map(r => mk(`${r[1] || titleOf(r[0])} ${r[0]}`.trim())) : [mk(f.to || toLabel)]);
    }
  });

  const TD_TXT = 'بمناسبة اليوم العالمي للمدرس (5 أكتوبر{{o_year}})، نرفع أسمى عبارات الشكر والعرفان والتقدير،\nعلى رسالتكم النبيلة وعطائكم المتواصل في بناء الأجيال وصناعة المستقبل،\nوكل عام وأنتم منارة للعلم والمعرفة وقدوة في الإخلاص والعطاء.';
  add({
    k: 'kd_teacherday', t: 'تهنئة بمناسبة اليوم العالمي للمدرس', grp: 'f', d: 'بطاقة تهنئة عامة أو شخصية لكل أستاذ(ة) بمناسبة اليوم العالمي للمدرس (5 أكتوبر).', auto: 'لائحة الأساتذة والأطر', page: 'a4l',
    init: s => commonInit(s, { to: 'السيدات والسادة الأساتذة', text: '', names: [['']], theme: 'auto', date: `${MK.syStart(MK.curSy())}-10-05` }),
    defs: () => [{ sec: 'التهنئة' }, { k: 'to', l: 'الموجهة إلى (بطاقة عامة)', ph: 'السيدات والسادة الأساتذة' },
      { note: 'للبطاقات الشخصية أدخل الأسماء في الجدول (سطر = بطاقة)، وإن تركته فارغا تُصدر بطاقة عامة واحدة.' },
      gridDef('names', 'أسماء الأساتذة (اختياري)', ['الاسم الكامل', 'الصفة'], { widths: ['1.7fr', '.8fr'], list: ['k2Emps', null], fill: r => (K.E.byName(r[0]) ? [r[0], r[1] || titleOf(r[0])] : null) }),
      { t: 'html', html: `<button type="button" class="btn sm" data-act="all">إضافة جميع الأساتذة</button> ${tplBtn}` },
      txtDef('اتركه فارغا لاستعمال النص الجاهز.')].concat(commonDefs(true)),
    act: {
      all: (f, sy, c) => { f.names = K.E.teachers().map(e => [fullName(e), titleOf(fullName(e))]); c.save('names'); },
      tpl: (f, sy, c) => { f.text = TD_TXT; c.save('text'); }
    },
    build: (s, f, sy) => {
      const names = (f.names || []).filter(r => String(r[0] || '').trim());
      const yr = /^(\d{4})/.test(f.date || '') ? RegExp.$1 : '';
      const mk = to => ({ theme: themeFor(f, 'amber'), title: 'اليوم العالمي للمدرس', sub: 'تحية إجلال وتقدير لحَمَلة رسالة العلم', pre: `تتقدم إدارة مؤسسة ${s.school || '..........'} بأحر التهاني إلى`, name: to, lines: linesOf(f.text || TD_TXT, base(s, sy, { o_year: yr ? ' ' + yr : '' })), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn });
      return pageOf(s, f, names.length ? names.map(r => mk(`${r[1] || titleOf(r[0])} ${r[0]}`.trim())) : [mk(f.to || 'السيدات والسادة الأساتذة')]);
    }
  });

  /* ===================== C — شواهد التفوق ===================== */
  const fullP = p => `${p.last || ''} ${p.first || ''}`.trim();
  const ORD = { 1: 'الأولى', 2: 'الثانية', 3: 'الثالثة' };
  const PERIODS = ['الدورة الأولى', 'الدورة الثانية', 'السنة الدراسية'];
  const pupilsOf = sy => (window.Pupils ? Pupils.current(sy) : []);
  const pupilByName = (sy, name) => { const k = String(name || '').trim(); return k ? pupilsOf(sy).find(p => fullP(p) === k) : null; };
  const EX_TXT = 'نظير تفوق{{h}} الدراسي واحتلال{{h}} المرتبة {{ord}} بقسم {{class}}{{o_avg}} برسم {{period}} من الموسم الدراسي {{sy}}،\nوتشجيعا {{lah}} على مواصلة الجد والاجتهاد، مع أطيب تمنياتنا {{lah}} بدوام التألق والنجاح.';
  const classRows = sy => {
    const lists = window.Pupils ? Pupils.Y(sy).lists : [];
    const out = [];
    lists.forEach(l => { for (let r = 1; r <= 3; r++) out.push([l.cls, String(r), '', '', l.unit || '']); });
    return out;
  };
  add({
    k: 'kd_excel', t: 'شواهد التفوق — الثلاثة الأوائل بكل قسم', grp: 'p', d: 'شهادة تفوق لكل تلميذ(ة) احتل المرتبة الأولى أو الثانية أو الثالثة بقسمه، بوسام ولون خاص بكل مرتبة (ذهبي/فضي/برونزي).', auto: 'لوائح التلاميذ المستوردة (الأقسام والأسماء والجنس)', page: 'a4l',
    init: (s, sy) => commonInit(s, { period: PERIODS[0], text: '', rows: [['', '1', '', '', '']], sr: 'الأستاذ(ة) المسؤول(ة) عن القسم' }),
    defs: (f, sy) => [{ sec: 'الشواهد' }, { k: 'period', l: 'الفترة', t: 'select', opts: PERIODS },
      { t: 'html', html: `<button type="button" class="btn sm" data-act="gen">${'توليد 3 أسطر لكل قسم من اللوائح المستوردة'}</button> ${tplBtn}` },
      { note: 'اكتب اسم التلميذ(ة) (يقترح البرنامج الأسماء من اللوائح) فيُملأ القسم والوحدة تلقائيا، ثم أدخل المعدل. السطر الذي لا اسم فيه لا تُصدر له شهادة.' },
      Object.assign(gridDef('rows', 'المتفوقون', ['القسم', 'الرتبة', 'الاسم الكامل', 'المعدل', 'الوحدة'], { widths: ['.9fr', '.45fr', '1.7fr', '.55fr', '1fr'], list: [null, null, 'kdPupils', null, 'k2Units'], fillCol: 2,
        fill: r => { const p = pupilByName(sy, r[2]); if (!p) return null; return [p.cls || r[0], r[1], r[2], r[3], p.unit || r[4]]; } }), { dls: { kdPupils: () => pupilsOf(sy).map(fullP) } }),
      txtDef('اتركه فارغا لاستعمال النص الجاهز.')].concat(commonDefs(true)),
    act: {
      gen: (f, sy, c) => { const r = classRows(sy); if (!r.length) return c.toast('لا توجد لوائح تلاميذ مستوردة لهذا الموسم', true); f.rows = r; c.save('rows'); },
      tpl: (f, sy, c) => { f.text = EX_TXT; c.save('text'); }
    },
    build: (s, f, sy) => {
      const rows = (f.rows || []).filter(r => String(r[2] || '').trim());
      const list = rows.length ? rows : [['..........', '1', '..........', '', '']];
      return pageOf(s, f, list.map(r => {
        const rank = [1, 2, 3].includes(+r[1]) ? +r[1] : 1;
        const p = pupilByName(sy, r[2]);
        const noun = p ? (p.g === 'F' ? 'التلميذة' : 'التلميذ') : 'التلميذ(ة)';
        const gc = gctx(p ? (p.g === 'F' ? 'x ة' : 'x') : '');
        const ctx = base(s, sy, Object.assign({ ord: ORD[rank], class: ltr(r[0]), period: f.period, o_avg: String(r[3] || '').trim() ? ` بمعدل عام قدره ${ltr(String(r[3]).trim())}` : '' }, gc));
        return { theme: themeFor(f, ['gold', 'silver', 'bronze'][rank - 1]), rank, title: 'شهادة تفوق', sub: `المرتبة ${ORD[rank]} — ${f.period}`, pre: `تمنح إدارة مؤسسة ${s.school || '..........'} هذه الشهادة إلى ${noun}`, name: r[2], role: `قسم ${r[0] || '..........'}${r[4] ? ' — ' + r[4] : ''}`, lines: linesOf(f.text || EX_TXT, ctx), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn };
      }));
    }
  });

  add({
    k: 'kd_toplist', t: 'لائحة المتفوقين بالأقسام (الثلاثة الأوائل)', grp: 'p', d: 'جدول يضم المراتب الثلاث الأولى بكل قسم مع المعدلات، للنشر أو الأرشفة.', auto: 'شواهد التفوق المدخلة', page: 'a4l',
    init: (s, sy) => ({ title: 'لائحة المتفوقين' }),
    defs: () => [{ k: 'title', l: 'عنوان اللائحة' }, { note: 'تُملأ هذه اللائحة تلقائيا من جدول «شواهد التفوق»؛ أضف الأسماء والمعدلات هناك.' }],
    build: (s, f, sy, st) => {
      const ex = center().flds(DOCS().find(d => d.k === 'kd_excel'), sy);
      const rows = (ex.rows || []).filter(r => String(r[2] || '').trim());
      const classes = [];
      rows.forEach(r => { const key = (r[4] ? r[4] + '|' : '') + r[0]; if (!classes.includes(key)) classes.push(key); });
      const cell = (key, rk) => { const r = rows.find(x => ((x[4] ? x[4] + '|' : '') + x[0]) === key && +x[1] === rk); return r ? { t: `${r[2]}${String(r[3] || '').trim() ? ' (' + String(r[3]).trim() + ')' : ''}`, c: 'sm' } : { t: '' }; };
      const head = `<tr><th class="d" style="width:7%">رقم</th><th class="d" style="width:16%">القسم</th><th class="d" style="width:25.6%">المرتبة الأولى</th><th class="d" style="width:25.6%">المرتبة الثانية</th><th class="d" style="width:25.6%">المرتبة الثالثة</th></tr>`;
      const trs = classes.map((key, i) => tr([{ t: String(i + 1) }, { t: key.split('|').pop(), c: 'k' }, cell(key, 1), cell(key, 2), cell(key, 3)]));
      for (let i = trs.length; i < 8; i++) trs.push(tr(['', '', '', '', ''].map(x => ({ t: x, st: 'height:8mm' }))));
      return { title: f.title || 'لائحة المتفوقين', sub: `${ex.period || ''} — الموسم الدراسي ${MK.syDash(sy)}`, sign: SB.sign(s, { right: '', left: 'توقيع السيد رئيس المؤسسة' }), blocks: [tbl(head, trs, 'big')], page: 'a4l' };
    }
  });

  /* ===================== D — الشكر والتقدير ===================== */
  const thanks = o => add({
    k: o.k, t: o.t, grp: 'k', d: o.d, auto: 'اسم المؤسسة والجماعة', page: 'a4l',
    init: s => commonInit(s, Object.assign({ text: '', reason: o.reason }, o.init ? o.init(s) : {})),
    defs: () => [{ sec: 'الشهادة' }].concat(o.fields).concat([{ k: 'reason', l: 'سبب الشكر والتقدير', t: 'area', rows: 2 }, txtDef('اتركه فارغا لاستعمال النص الجاهز. الرمز {{reason}} يُعوَّض بسبب الشكر أعلاه.'), { t: 'html', html: tplBtn }]).concat(commonDefs(false)),
    act: { tpl: (f, sy, c) => { f.text = o.txt; c.save('text'); } },
    build: (s, f, sy) => {
      const nr = o.names(s, f);
      const ctx = base(s, sy, { name: nr.name, org: nr.org || '', reason: f.reason, who: nr.role });
      return pageOf(s, f, [{ theme: themeFor(f, o.theme), title: 'شهادة شكر وتقدير', sub: o.sub, pre: nr.pre || `تتقدم إدارة مؤسسة ${s.school || '..........'} بخالص الشكر وعظيم الامتنان إلى`, name: nr.name || '..........', role: nr.role, lines: linesOf(f.text || o.txt, ctx), date: f.date, city: f.city, sl: f.sl, sln: f.sln, sr: f.sr, srn: f.srn }]);
    }
  });
  thanks({
    k: 'kd_apel', t: 'شكر وتقدير — رئيس جمعية آباء وأولياء التلاميذ', theme: 'teal', sub: 'عرفانا بالشراكة التربوية البنّاءة', d: 'شهادة شكر لرئيس(ة) جمعية آباء وأولياء التلاميذ على دعمه ومساهمته.',
    reason: 'دعمه المتواصل للمؤسسة ومواكبته لأنشطتها التربوية والاجتماعية',
    fields: [{ k: 'person', l: 'اسم رئيس الجمعية', half: true }, { k: 'org', l: 'اسم الجمعية', half: true, ph: 'جمعية آباء وأولياء تلاميذ ...' }],
    init: s => ({ org: 'جمعية آباء وأولياء تلاميذ ' + (s.school || ''), person: '' }),
    txt: 'نظير {{reason}}،\nوتقديرا لروح المسؤولية والتعاون التي أبان عنها خدمة لمصلحة التلميذات والتلاميذ،\nجزاكم الله خيرا، وأدام التعاون المثمر بين الجمعية والمؤسسة.',
    names: (s, f) => ({ name: f.person, role: `رئيس(ة) ${f.org || 'جمعية آباء وأولياء التلاميذ'}` })
  });
  thanks({
    k: 'kd_commune', t: 'شكر وتقدير — رئيس المجلس الجماعي', theme: 'burgundy', sub: 'اعترافا بالتعاون المثمر مع المؤسسة', d: 'شهادة شكر لرئيس المجلس الجماعي على دعمه وتعاونه مع المؤسسة.',
    reason: 'دعمه وتجاوبه المتواصل مع حاجيات المؤسسة وانخراطه في إنجاح مشاريعها',
    fields: [{ k: 'person', l: 'اسم رئيس المجلس', half: true }, { k: 'org', l: 'الجماعة', half: true }],
    init: s => ({ org: s.commune ? 'الجماعة ' + s.commune : '', person: '' }),
    txt: 'نظير {{reason}}،\nوتثمينا لإسهاماته في تحسين ظروف التمدرس بالمؤسسة وخدمة التلميذات والتلاميذ،\nنعبر لكم عن خالص امتناننا، متمنين لكم دوام التوفيق في خدمة الساكنة.',
    names: (s, f) => ({ name: f.person, role: `رئيس المجلس الجماعي${f.org ? ' ل' + f.org : ''}` })
  });
  thanks({
    k: 'kd_assoc', t: 'شكر وتقدير — جمعية مدنية', theme: 'ocean', sub: 'تنويها بالشراكة وروح التطوع', d: 'شهادة شكر لجمعية مدنية شريكة ساهمت في أنشطة المؤسسة أو دعمها.',
    reason: 'مساهمتها الفعالة في دعم أنشطة المؤسسة وإنجاح مبادراتها لفائدة التلميذات والتلاميذ',
    fields: [{ k: 'person', l: 'اسم الجمعية' }, { k: 'rep', l: 'ممثلة في (رئيسها أو ممثلها)', half: true }],
    init: () => ({ person: '', rep: '' }),
    txt: 'نظير {{reason}}،\nوتقديرا لروح التطوع والعمل الجمعوي النبيل التي تحلت بها،\nنتقدم لها ولكافة أعضائها بجزيل الشكر، ونتطلع إلى مواصلة هذه الشراكة المثمرة.',
    names: (s, f) => ({ name: f.person, role: f.rep ? `ممثلة في ${f.rep}` : '' })
  });
  thanks({
    k: 'kd_thanks', t: 'شكر وتقدير — شريك أو متعاون (نموذج حر)', theme: 'navy', sub: 'عرفانا وامتنانا', d: 'شهادة شكر لأي شريك أو متعاون أو مؤسسة (سلطة محلية، مقاولة، متبرع، متطوع...).',
    reason: 'مساهمته الطيبة في دعم المؤسسة ومواكبة أنشطتها',
    fields: [{ k: 'person', l: 'الاسم (شخص أو هيأة)', half: true }, { k: 'role', l: 'الصفة', half: true, ph: 'مثال: مدير شركة ...' }],
    init: () => ({ person: '', role: '' }),
    txt: 'نظير {{reason}}،\nوتقديرا لما أبدى من حس تضامني وروح مسؤولية عالية،\nنتقدم بخالص الشكر وعظيم الامتنان، سائلين المولى أن يجزيه خير الجزاء.',
    names: (s, f) => ({ name: f.person, role: f.role })
  });

  /* ---------------- centre ---------------- */
  const DOCS = () => DOCS_;
  let C = null;
  function center() {
    if (C) return C;
    C = K.center({
      id: 'kudos', title: 'التهاني والتقديرات', icon: '🏅', route: 'kudosDoc', hubRoute: 'kudos', docLabel: 'الشهادة',
      groups: [['t', 'شواهد تقدير الأساتذة والأطر', 'المشاركة والمساهمة والمجهودات المتميزة'], ['f', 'التهاني بالأعياد والمناسبات', 'الأعياد الدينية واليوم العالمي للمدرس'], ['p', 'شواهد التفوق للتلاميذ', 'الثلاثة الأوائل بكل قسم'], ['k', 'الشكر والتقدير للشركاء', 'جمعية الآباء، المجلس الجماعي، الجمعيات المدنية']],
      docs: DOCS, store: sy => store(sy), years: () => Object.keys(KD().years),
      // 1.9.4: free designer for greetings, thanks and certificates
      hubButtons: () => `<button class="btn pri" onclick="go('flyers', { cat: 'congrats' })">🎨 المصمم الحر (تهاني وشواهد بتصميمك)</button>`,
      intro: 'شواهد وبطاقات بتصميم زخرفي فاخر على ورق A4 أفقي، بترويسة المؤسسة كاملة العرض، وبألوان تناسب كل مناسبة. اختر الشهادة وعدّل الأسماء والنص، ثم اطبعها أو احفظها بصيغة PDF؛ كل اسم يُصدر شهادة مستقلة.'
    });
    return C;
  }
  window.Kudos = { migrate, store, docs: DOCS, center, TH, FRAMES };
  window.pageKudos = (v, a) => { migrate(DB); center().hub(v, a); };
  window.pageKudosDoc = (v, a) => { migrate(DB); center().doc(v, a); };

  Dx.modCss += `
  .kd{position:relative;margin:-8mm -11mm;width:297mm;height:209.5mm;overflow:hidden;color:var(--m);font-family:'MAJT','Amiri','NSA',serif;flex:none}
  .kd-bgw{position:absolute;left:0;top:0}.kd-bgw svg{display:block}
  .kd-in{position:absolute;left:17mm;right:17mm;top:13mm;bottom:12mm;display:flex;flex-direction:column;align-items:center;text-align:center}
  .kd-hdr{width:100%;flex:none}.kd .hdr-wave{display:none}.kd .hv2{border-bottom-color:var(--a)}.kd .hdr{width:100%;border-bottom:.35mm solid var(--a);margin-bottom:0;padding-bottom:.8mm;color:#111}
  .kd .hdr-img{margin:0 0 1mm!important}.kd .hdr-img img{display:block;width:100%!important;height:auto!important;max-height:40mm!important;object-fit:fill!important}
  .kd-title{font-weight:700;line-height:1.15;margin-top:2.2mm;color:var(--m);letter-spacing:.2mm}
  .kd-sub{font-size:13.5pt;color:var(--a);font-weight:700;margin-top:.2mm;filter:brightness(.78)}
  .kd-div{display:block;margin:.8mm 0 1.2mm;flex:none}
  .kd-pre{font-size:15.5pt;color:#2a2a2a;line-height:1.5;flex:none}
  .kd-name{font-weight:700;line-height:1.3;margin:.8mm 0 0;padding:0 10mm .6mm;color:var(--m);border-bottom:.45mm solid var(--a);min-width:130mm;flex:none}
  .kd-names{font-weight:700;margin:1.6mm 0 0;line-height:2.05;max-width:232mm;flex:none}.kd-names span{display:inline-block;padding:0 1.2mm}
  .kd-names i{display:inline-block;width:2.1mm;height:2.1mm;background:var(--a);transform:rotate(45deg);margin:0 2.2mm;vertical-align:middle}
  .kd-role{font-size:14pt;color:#333;margin-top:.8mm;flex:none}
  .kd-body{flex:1;display:flex;flex-direction:column;justify-content:center;max-width:222mm;min-height:0}
  .kd-body p{margin:0 0 .6mm;font-size:15.5pt;line-height:1.85;color:#1d1d1d}
  .kd-date{font-size:11.5pt;color:#333;flex:none;margin-bottom:.6mm}
  .kd-sign{width:100%;display:flex;justify-content:space-between;align-items:flex-end;padding:0 6mm;flex:none}
  .kd-sg{width:78mm;font-size:13pt;font-weight:700;min-height:23mm}.kd-sg .n{font-weight:400;font-size:12pt;color:#333;margin-top:.4mm}.kd-sg .sp{height:9mm}
  .kd-seal{width:23mm;height:23mm;border:.45mm dashed var(--a);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:8.5pt;color:var(--a);opacity:.75;margin-bottom:1mm}
  .kd-medal{display:block;margin-bottom:-1.5mm}
  `;
})();
