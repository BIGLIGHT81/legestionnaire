'use strict';
/* 1.9.4 — لوحة القيادة: «بحث» شامل (الخانات، الوثائق، الموظفون، التلاميذ) و«الطبع الشامل» لكل وثائق الخانات دفعة واحدة. */
(function () {
  const Dx = window.Docs;
  const { esc } = Dx;
  const nh = s => (window.MK ? MK.hkey(s) : String(s || '').toLowerCase());
  const tr = s => (window.I18N && I18N.get() === 'fr' ? (I18N.tr(s) || s) : s);

  /* ================= search ================= */
  function index() {
    const out = [];
    const safe = f => { try { f(); } catch (e) { console.error('search index', e); } };
    const push = (kind, label, sub, go2, icon) => out.push({ kind, label, sub: sub || '', go: go2, icon: icon || '', key: nh(label + ' ' + (sub || '')) + ' ' + String(tr(label) + ' ' + tr(sub || '')).toLowerCase() });
    // sections and tabs
    safe(() => (typeof NAV !== 'undefined' ? NAV : []).forEach(g => safe(() => (typeof visibleTabs === 'function' ? visibleTabs(g) : g.tabs()).forEach(t => push('tab', t.l, g.label, () => go(t.r, t.a), '📂')))));
    // documents of «الوثائق»
    safe(() => Object.entries(Dx.TYPES || {}).forEach(([k, t]) => { if (!t.hidden) push('doc', t.title, (t.desc || '') + ' — الوثائق', () => go('editor', { type: k }), t.icon || '📄'); }));
    // documents of every module (documents centres)
    ((window.K && K.centers) || []).forEach(c => safe(() => (c.docs() || []).forEach(d => safe(() => push('doc', String(typeof d.t === 'function' ? d.t() : d.t), c.title, () => go(c.route, { kind: d.k }), c.icon || '📄')))));
    // employees
    safe(() => (DB.employees || []).forEach(e => push('emp', fullName(e), [e.ppr, e.cadre, e.cin].filter(Boolean).join(' — '), () => (typeof empProfile === 'function' ? (go('employees'), empProfile(e)) : go('employees')), '👤')));
    // pupils of the current year
    try { (window.Pupils ? Pupils.current(MK.curSy()) : []).forEach(p => push('pupil', `${p.last || ''} ${p.first || ''}`.trim(), [p.code, p.cls, p.unit].filter(Boolean).join(' — '), () => go('pupils', { tab: 'list', q: p.code }), '🎒')); } catch (_) {}
    return out;
  }
  const KIND = { tab: 'خانة', doc: 'وثيقة', emp: 'موظف(ة)', pupil: 'تلميذ(ة)' };
  function openSearch(q0) { try { openSearch0(q0); } catch (e) { console.error('search', e); try { toast('تعذر فتح البحث: ' + (e && e.message || e), true); } catch (_) {} } }
  function openSearch0(q0) {
    if (typeof DB === 'undefined' || !DB) return;
    const I = index();
    const body = document.createElement('div');
    body.innerHTML = `<input class="inp" id="gsQ" placeholder="ابحث عن خانة، وثيقة، موظف(ة) أو تلميذ(ة)..." autocomplete="off" style="font-size:15px;padding:10px 12px">
      <div class="seg" id="gsK" style="margin:8px 0"><button data-k="" class="on">الكل</button><button data-k="tab">الخانات</button><button data-k="doc">الوثائق</button><button data-k="emp">الموظفون</button><button data-k="pupil">التلاميذ</button></div>
      <div id="gsR" style="max-height:56vh;overflow:auto"></div>`;
    let kind = '', sel = 0, res = [];
    const draw = () => {
      const q = $('#gsQ', body).value.trim(), words = q ? q.split(/\s+/).map(w => [nh(w), w.toLowerCase()]) : [];
      res = q ? I.filter(x => (!kind || x.kind === kind) && words.every(([a, b]) => (a && x.key.includes(a)) || x.key.includes(b))).slice(0, 80) : [];
      if (sel >= res.length) sel = 0;
      $('#gsR', body).innerHTML = !q ? '<div class="muted" style="padding:14px;text-align:center">اكتب كلمة أو أكثر (مثال: استئناف، حادثة، شهادة العمل، اسم موظف أو رمز مسار تلميذ)</div>'
        : res.length ? res.map((x, i) => `<div class="gs-it${i === sel ? ' on' : ''}" data-i="${i}"><span class="gs-ic">${x.icon}</span><div style="flex:1;min-width:0"><b>${esc(x.label)}</b><div class="muted gs-sub">${esc(x.sub)}</div></div><span class="tag">${KIND[x.kind]}</span></div>`).join('')
        : '<div class="muted" style="padding:14px;text-align:center">لا توجد نتائج</div>';
      $$('.gs-it', body).forEach(el => el.onclick = () => pick(+el.dataset.i));
    };
    const m = modal({ title: ic('search') + ' بحث', size: 'lg', body, actions: [{ label: 'إغلاق' }] });
    const pick = i => { const x = res[i]; if (!x) return; if (m && m.close) m.close(); else document.querySelectorAll('.modal-bg').forEach(b => b.remove()); x.go(); };
    $('#gsQ', body).oninput = () => { sel = 0; draw(); };
    $('#gsQ', body).onkeydown = e => {
      if (e.key === 'ArrowDown') { sel = Math.min(res.length - 1, sel + 1); draw(); e.preventDefault(); }
      if (e.key === 'ArrowUp') { sel = Math.max(0, sel - 1); draw(); e.preventDefault(); }
      if (e.key === 'Enter') pick(sel);
    };
    $$('#gsK button', body).forEach(b => b.onclick = () => { kind = b.dataset.k; $$('#gsK button', body).forEach(x => x.classList.toggle('on', x === b)); draw(); $('#gsQ', body).focus(); });
    if (q0) $('#gsQ', body).value = String(q0);
    draw(); setTimeout(() => { const i = $('#gsQ', body); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 30);
  }
  document.addEventListener('keydown', e => { if (e.ctrlKey && (e.key === 'k' || e.key === 'K' || e.key === 'f' || e.key === 'F') && !document.querySelector('.modal-bg') && typeof DB !== 'undefined' && DB) { e.preventDefault(); openSearch(); } });

  /* ================= print everything ================= */
  const pst = { sel: null, sy: '' };
  // the documents centres of some sections are created when their page is first opened: open each section once (quickly) to list them all
  let warmed = false;
  function warm() {
    if (warmed || typeof NAV === 'undefined') return false;
    warmed = true;
    const tabs = NAV.flatMap(g => g.tabs()).filter(t => !['home', 'printAll', 'license', 'settings', 'editor'].includes(t.r));
    tabs.forEach(t => { try { go(t.r, t.a); } catch (_) {} });
    $('#modalRoot').innerHTML = '';
    return true;
  }
  function pagePrintAll(v) {
    if (warm()) { setTimeout(() => go('printAll'), 50); v.innerHTML = '<div class="empty-state">…</div>'; return; }
    const sy = MK.curSy();
    const C = ((window.K && K.centers) || []).filter(c => c.docs().length);
    if (!pst.sel) pst.sel = {};
    const total = C.reduce((a, c) => a + c.docs().length, 0), nSel = Object.values(pst.sel).filter(Boolean).length;
    v.innerHTML = `<div class="page-h"><button class="btn" id="paBack">${ic('back')} رجوع</button><h1>الطبع الشامل للوثائق</h1><span class="sub">الموسم الدراسي ${esc(MK.syDash(sy))}</span><span class="sp"></span>
        <button class="btn" id="paAll">تحديد الكل</button><button class="btn" id="paNone">إلغاء التحديد</button>
        <button class="btn" id="paPdf">${ic('pdf')} حفظ PDF</button><button class="btn pri" id="paPrint">${ic('print')} طباعة</button></div>
      <div class="card" style="padding:12px 16px;margin-bottom:12px;line-height:1.9;font-size:13px">اختر الوثائق التي تريد طبعها من كل الخانات (${total} وثيقة)، ثم اضغط «طباعة» أو «حفظ PDF»: تُجمع كل الوثائق المختارة في ملف واحد بمعطياتها الحالية (ما عدّلته في كل وثيقة محفوظ). الوثائق العمودية والأفقية تُطبع في دفعتين (ملفان PDF). المحدد الآن: <b id="paN">${nSel}</b>.</div>
      ${C.map(c => { const groups = (c.groups && c.groups()) || [['', '']]; const ds = c.docs(); const lab = g => (groups.find(x => x[0] === (g || '')) || ['', ''])[1];
        return `<div class="card" style="margin-bottom:10px"><div class="card-h"><h3>${c.icon} ${esc(c.title)}</h3><span class="sp"></span><label class="chk" style="font-size:12.5px"><input type="checkbox" data-c="${esc(c.id)}" ${ds.every(d => pst.sel[c.id + '|' + d.k]) ? 'checked' : ''}> الكل</label></div>
          <div class="card-b pa-grid">${ds.map(d => `<label class="chk pa-it" title="${esc(lab(d.grp))}"><input type="checkbox" data-d="${esc(c.id + '|' + d.k)}" ${pst.sel[c.id + '|' + d.k] ? 'checked' : ''}> ${esc(String(typeof d.t === 'function' ? d.t() : d.t))}</label>`).join('')}</div></div>`; }).join('')}`;
    const count = () => { $('#paN').textContent = Object.values(pst.sel).filter(Boolean).length; };
    $$('[data-d]', v).forEach(el => el.onchange = () => { pst.sel[el.dataset.d] = el.checked; count(); });
    $$('[data-c]', v).forEach(el => el.onchange = () => { const c = C.find(x => x.id === el.dataset.c); c.docs().forEach(d => { pst.sel[c.id + '|' + d.k] = el.checked; }); pagePrintAll(v); });
    $('#paAll').onclick = () => { C.forEach(c => c.docs().forEach(d => { pst.sel[c.id + '|' + d.k] = true; })); pagePrintAll(v); };
    $('#paNone').onclick = () => { pst.sel = {}; pagePrintAll(v); };
    $('#paBack').onclick = () => go('home');
    const out = async kind => {
      const keys = Object.keys(pst.sel).filter(k => pst.sel[k]);
      if (!keys.length) return toast('اختر وثيقة واحدة على الأقل', true);
      if (!LIC.active) return lockedBox();
      const groups = {}; let n = 0, bad = [];
      keys.forEach(k => {
        const [cid, dk] = k.split('|'); const c = C.find(x => x.id === cid); if (!c) return;
        try { const r = c.render(dk, sy); if (!r || !r.pages || !r.pages.length) return; (groups[r.page] = groups[r.page] || []).push(...r.pages); n++; }
        catch (e) { bad.push(dk); }
      });
      const base = typeof BASE !== 'undefined' ? BASE : '';
      for (const [page, pages] of Object.entries(groups)) {
        const html = Dx.bidi(Dx.buildRaw({ page, pages, title: 'الطبع الشامل', base }));
        const land = page === 'a4l' || page === 'two';
        const r = kind === 'print' ? await window.api.print(html, land) : await window.api.pdf(html, land, `الوثائق_${MK.syDash(sy)}_${land ? 'أفقي' : 'عمودي'}`);
        if (r && r.locked) return lockedBox();
      }
      toast(`${kind === 'print' ? 'أرسلت إلى الطابعة' : 'حُفظت'} ${n} وثيقة${bad.length ? ` (تعذر إنشاء ${bad.length})` : ''}`);
    };
    $('#paPrint').onclick = () => out('print');
    $('#paPdf').onclick = () => out('pdf');
  }
  Dx.modCss += '';
  const css = document.createElement('style');
  css.textContent = `.gs-it{display:flex;gap:10px;align-items:center;padding:8px 10px;border-radius:8px;cursor:pointer;border:1px solid transparent}.gs-it:hover,.gs-it.on{background:#eef6f3;border-color:#bfe0d4}
    .gs-ic{font-size:20px;width:28px;text-align:center}.gs-sub{font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .h-search{width:260px;max-width:100%}.pa-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:4px 12px}.pa-it{font-size:13px}`;
  document.head.appendChild(css);
  window.Tools = { openSearch, index, warm };
  window.pagePrintAll = v => pagePrintAll(v);
})();
