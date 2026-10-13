'use strict';
/* 1.9 shared toolkit, part 2: table builders, text templates (minutes), the "document centre"
   (a hub of cards + a live-preview editor shared by السبورة المرجعية، مجالس المؤسسة، الميزانية، المواظبة) */
(function () {
  const Dx = window.Docs;
  const { esc, fmtDate } = Dx;
  const today = () => Dx.todayIso();
  const { SB } = window.K;

  /* ---------- table cells ---------- */
  // cell: string|number (escaped text) | { t: text } | { h: raw html } with optional c (class), s (colspan), r (rowspan)
  const cell = (c, tag) => {
    if (c == null) return `<${tag}></${tag}>`;
    if (typeof c !== 'object') return `<${tag}>${esc(c)}</${tag}>`;
    const body = c.h != null ? c.h : esc(c.t == null ? '' : c.t);
    return `<${tag}${c.c ? ` class="${c.c}"` : ''}${c.s ? ` colspan="${c.s}"` : ''}${c.r ? ` rowspan="${c.r}"` : ''}${c.st ? ` style="${c.st}"` : ''}>${body}</${tag}>`;
  };
  const tr = (cells, cls) => `<tr${cls ? ` class="${cls}"` : ''}>${cells.map(c => cell(c, 'td')).join('')}</tr>`;
  const thr = cells => `<tr>${cells.map(c => cell(c, 'th')).join('')}</tr>`;
  const tbl = (head, rows, cls) => SB.tbl(head, rows, cls);

  const WORD_NUM = n => (n === 1 ? 'سنة واحدة' : n === 2 ? 'سنتان' : n >= 3 && n <= 10 ? `${n} سنوات` : `${n} سنة`);
  const ldate = iso => { const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || ''); return m ? `${+m[3]} ${Dx.MONTHS[+m[2] - 1]} ${m[1]}` : (iso || ''); };
  const DAYS = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  const dayName = iso => { const d = Dx.toDate ? Dx.toDate(iso) : new Date(iso); return d && !isNaN(d) ? DAYS[d.getDay()] : ''; };
  const yearOf = v => { const m = /(\d{4})/.exec(String(v || '')); return m ? +m[1] : 0; };

  /* ---------- text templates ---------- */
  // «{{school}}» tokens, then blocks: «# heading», «- bullet», «1. item» (kept), blank line skipped, anything else = paragraph
  function tokens(extra) {
    const s = S(), sy = MK.curSy();
    return Object.assign({ school: s.school || '..........', director: s.director || '..........', city: s.city || '..........', commune: s.commune || '..........',
      directorate: s.directorate || '..........', academy: s.academy || '..........', sy: MK.syDash(sy), syslash: sy, y1: MK.syStart(sy), y2: MK.syStart(sy) + 1, y3: MK.syStart(sy) + 2, today: ldate(today()) }, extra || {});
  }
  const fill = (str, ctx) => String(str == null ? '' : str).replace(/\{\{(\w+)\}\}/g, (m, k) => (ctx && ctx[k] != null && ctx[k] !== '' ? ctx[k] : '..........'));
  function textBlocks(str, ctx) {
    const out = [];
    fill(str, ctx).split(/\r?\n/).forEach(line => {
      const t = line.replace(/\s+$/, '');
      if (!t.trim()) return;
      if (/^#\s/.test(t)) out.push({ html: `<div class="sb-cap r" style="text-decoration:underline;text-underline-offset:1mm">${esc(t.replace(/^#\s+/, ''))}</div>`, keepNext: true });
      else if (/^[-•]\s/.test(t)) out.push({ html: `<div class="rp-li sb-p">${esc(t.replace(/^[-•]\s+/, ''))}</div>` });
      else out.push({ html: `<p class="sb-p">${esc(t.trim())}</p>` });
    });
    return out;
  }

  /* ---------- the document centre ----------
     cfg: { id, title, icon, sub, route: 'boardDoc', hubRoute, docs: [doc] | () => [doc], store: sy => object,
            groups: [[key, label, hint]] , back }
     doc: { k, t, grp, d (short description), auto (what fills it), page: 'a4'|'a4l', init(s, sy, st), defs(f, sy, st) -> form defs,
            build(s, f, sy, st) -> { title, sub, blocks, sign, page, pages } , act: { name(f, sy, ctx) }, onSave(k, f, sy) } */
  function center(cfg) {
    const docsOf = () => (typeof cfg.docs === 'function' ? cfg.docs() : cfg.docs);
    const groupsOf = () => (typeof cfg.groups === 'function' ? cfg.groups() : cfg.groups);
    const getStore = sy => { const st = cfg.store(sy); return st; };
    const flds = (doc, sy, st) => {
      const s = S();
      const base = doc.init ? doc.init(s, sy, st || {}) : {};
      const saved = getStore(sy)[doc.k] || {};
      return Object.assign({}, base, saved);
    };

    function hub(v, arg) {
      const docs = docsOf(), sy = MK.curSy();
      const groups = groupsOf() || [['', cfg.title]];
      v.innerHTML = `<div class="page-h"><h1>${cfg.title}</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}${cfg.sub ? ' — ' + cfg.sub : ''}</span><span class="sp"></span>${cfg.hubButtons ? cfg.hubButtons() : ''}</div>
        ${(typeof cfg.intro === 'function' ? cfg.intro() : cfg.intro) ? `<div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">${typeof cfg.intro === 'function' ? cfg.intro() : cfg.intro}</div>` : ''}
        ${groups.map(([g, label, hint]) => {
          const list = docs.filter(d => (d.grp || '') === g);
          if (!list.length) return '';
          return `<div class="sec-t" style="margin:14px 0 8px">${label}${hint ? `<span class="muted" style="font-weight:400;font-size:12px"> — ${hint}</span>` : ''}</div>
            <div class="hub-grid">${list.map(d => `<div class="card hub-card" data-k="${d.k}"><div class="hub-t">${d.t}</div><div class="hub-d">${d.d || ''}</div>${d.auto ? `<div class="hub-a">${ic('check')} ${d.auto}</div>` : ''}</div>`).join('')}</div>`;
        }).join('')}`;
      $$('.hub-card', v).forEach(c => c.onclick = () => go(cfg.route, { kind: c.dataset.k }));
      if (cfg.onHub) cfg.onHub(v, arg);
    }

    function doc(v, arg) {
      arg = arg || {};
      const docs = docsOf();
      const sy0 = MK.curSy();
      const first = docs.find(d => d.k === arg.kind) || docs[0];
      MK.docPage(v, {
        word: st => { const d = docs.find(x => x.k === st.kind) || docs[0]; return d.word != null ? !!d.word : true; },
        title: cfg.title, icon: cfg.icon || '', modes: false, flow: true,
        state: { kind: first.k, sy: sy0, o: arg.o || {} },
        back: () => go(cfg.hubRoute),
        form: (box, st, refresh) => {
          let draw = null, f = null, saveT = null;
          const cur = () => docs.find(d => d.k === st.kind) || docs[0];
          const defsOf = () => { const d = cur(); const x = d.defs ? d.defs(f, st.sy, st) : []; return x; };
          const persistKey = k => {
            const d = cur();
            const store = getStore(st.sy);
            store[d.k] = store[d.k] || {};
            store[d.k][k] = f[k];
            const rd = d.onSave ? d.onSave(k, f, st.sy, store[d.k], st) : null;
            clearTimeout(saveT); saveT = setTimeout(() => persist(), 300);
            if (rd === 'redraw' && draw) draw();
            refresh();
          };
          const mount = () => {
            const d = cur();
            f = flds(d, st.sy, st);
            st.f = f;
            box.innerHTML = `<div class="sec-t">${cfg.docLabel || 'الوثيقة'}</div>
              <div class="fld"><select class="inp" id="cfDoc">${(groupsOf() || [['', '']]).map(([g, label]) => { const l = docs.filter(x => (x.grp || '') === g); return l.length ? `<optgroup label="${esc(label)}">${l.map(x => `<option value="${x.k}" ${x.k === st.kind ? 'selected' : ''}>${x.t}</option>`).join('')}</optgroup>` : ''; }).join('')}</select></div>
              ${cfg.noSy ? '' : `<div class="fld"><label>الموسم الدراسي</label><select class="inp" id="cfSy">${MK.syList(cfg.years ? cfg.years() : []).map(y => `<option value="${y}" ${y === st.sy ? 'selected' : ''}>${MK.syDash(y)}</option>`).join('')}</select></div>`}
              ${d.auto ? `<p class="muted" style="font-size:12px;line-height:1.7;margin:2px 0 6px">${ic('check')} يُملأ تلقائيا من: ${d.auto}. يمكن تعديل أي خانة وستُحفظ تعديلاتك.</p>` : ''}
              <div id="cfBody"></div>
              <div class="btn-row" style="margin-top:10px"><button class="btn sm" id="cfReset">${ic('hist')} إعادة التعبئة التلقائية</button></div>`;
            $('#cfDoc', box).onchange = e => { st.kind = e.target.value; mount(); refresh(); };
            if ($('#cfSy', box)) $('#cfSy', box).onchange = e => { st.sy = e.target.value; mount(); refresh(); };
            $('#cfReset', box).onclick = async () => {
              if (!(await confirmBox('حذف تعديلاتك على هذه الوثيقة والعودة إلى التعبئة التلقائية؟', 'إعادة التعبئة'))) return;
              delete getStore(st.sy)[cur().k]; persist(); mount(); refresh();
            };
            const body = $('#cfBody', box);
            draw = K.form(body, () => defsOf(), f, persistKey);
            // auto-fill a grid row when the first cell (a name) is picked from the employees list
            body.addEventListener('change', e => {
              const ds = e.target.dataset;
              if (!ds.g) return;
              const df = defsOf().find(x => x.k === ds.g);
              if (df && df.fill && +ds.c === (df.fillCol || 0)) {
                const nr = df.fill(f[ds.g][+ds.r].slice(), +ds.r);
                if (nr) { f[ds.g][+ds.r] = nr; draw(); persistKey(ds.g); }
              }
            });
            body.addEventListener('click', e => {
              const b = e.target.closest('[data-act]');
              const dd = cur();
              if (!b || !dd.act || !dd.act[b.dataset.act]) return;
              e.preventDefault();
              Promise.resolve(dd.act[b.dataset.act](f, st.sy, { redraw: () => { draw(); }, save: k => persistKey(k), st, toast })).then(() => { draw(); });
            });
          };
          mount();
          st.remount = mount;
        },
        build: st => {
          const s = S();
          const d = docs.find(x => x.k === st.kind) || docs[0];
          const f = st.f || flds(d, st.sy, st);
          const o = d.build(s, f, st.sy, st);
          if (o.pages) return { page: o.page || d.page || 'a4', pages: o.pages };
          const page = o.page || d.page || 'a4l';
          return { page, pages: SB.pages(s, Object.assign({ page }, o)) };
        },
        fname: st => { const d = docs.find(x => x.k === st.kind) || docs[0]; return `${d.t}_${MK.syDash(st.sy)}`; }
      });
    }
    // 1.9.4: every documents centre is registered (global search and «الطبع الشامل» of the dashboard)
    const render = (kind, sy) => {
      const docs = docsOf(), d = docs.find(x => x.k === kind); if (!d) return null;
      const s = S(), st = { kind, sy }, f = flds(d, sy, st); st.f = f;
      const o = d.build(s, f, sy, st);
      if (o.pages) return { page: o.page || d.page || 'a4', pages: o.pages };
      const page = o.page || d.page || 'a4l';
      return { page, pages: SB.pages(s, Object.assign({ page }, o)) };
    };
    const reg = { id: cfg.id, title: cfg.title, icon: cfg.icon || '', route: cfg.route, hubRoute: cfg.hubRoute, groups: groupsOf, docs: docsOf, render };
    const L = (window.K.centers = window.K.centers || []); const i = L.findIndex(x => x.id === cfg.id); if (i >= 0) L[i] = reg; else L.push(reg);
    return { hub, doc, flds, store: getStore };
  }

  /* employee grid helpers */
  const empRow = (e, extra) => Object.assign({ name: fullName(e), ppr: e.ppr || '', cin: e.cin || '', phone: e.phone || '', address: e.address || '', email: e.email || '' }, extra || {});
  const empByName = name => K.E.byName(name);

  Object.assign(window.K, { tr, thr, tbl, cell, ldate, dayName, DAYS, yearOf, WORD_NUM, tokens, fill, textBlocks, center, empRow, empByName });
  Dx.modCss += `
  .hub-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:10px}
  .hub-card{padding:12px 14px;cursor:pointer;transition:.12s;border:1px solid var(--line)}
  .hub-card:hover{border-color:#4472c4;box-shadow:0 2px 10px rgba(68,114,196,.18);transform:translateY(-1px)}
  .hub-t{font-weight:700;font-size:14px;margin-bottom:3px}.hub-d{font-size:12px;color:var(--muted);line-height:1.7}
  .hub-a{font-size:11.5px;color:#0e5a4a;margin-top:5px}.hub-a svg{width:13px;height:13px;vertical-align:-2px}
  .tbl.sb-t.kv td.k{background:#d9e2f3;color:#1f3864}
  .rp-li.sb-p{position:relative;padding-right:5mm;margin:0 0 .5mm}.rp-li.sb-p:before{content:'';position:absolute;right:1.2mm;top:2.6mm;width:1.5mm;height:1.5mm;border-radius:50%;background:#000}
  `;
})();
