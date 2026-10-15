'use strict';
/* global Docs */
const { MONTHS, TYPES, RESUME_CASES, buildDocHtml, isLandscape, fmtDate, toDate, isoOf, daysBetween, durationText, fullName, todayIso, esc } = Docs;
const BASE = new URL('.', location.href).href;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const uid = p => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const licText = () => (typeof LIC !== 'undefined' && LIC.reason === 'expired') ? 'انتهت صلاحية التفعيل' : 'نسخة غير مفعلة';

/* ---------------- icons ---------------- */
const ICONS = {
  home: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.2 7.8-8 9-4.8-1.2-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16.5 14.6c2.6.1 4.4 1.8 5 4.9"/>',
  file: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/><path d="M8.5 13h7M8.5 16.5h7"/>',
  cal: '<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/><path d="M8 13.5h2M14 13.5h2M8 17h2"/>',
  hist: '<path d="M4 12a8 8 0 1 0 2.4-5.7"/><path d="M4 4v4.5h4.5"/><path d="M12 8v4.5l3 2"/>',
  gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z"/>',
  print: '<path d="M7 9V3.5h10V9"/><rect x="3.5" y="9" width="17" height="8" rx="1.5"/><path d="M7 14h10v6.5H7z"/>',
  pdf: '<path d="M14 3H6.5A1.5 1.5 0 0 0 5 4.5v15A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M14 3v5h5"/><path d="M12 11v6M9.5 14.5 12 17l2.5-2.5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6"/><path d="M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4-4"/>',
  down: '<path d="M12 4v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 19.5h16"/>',
  up: '<path d="M12 15V4M7.5 8.5 12 4l4.5 4.5"/><path d="M4 19.5h16"/>',
  back: '<path d="M9 5l7 7-7 7"/>',
  save: '<path d="M5 3.5h11l3.5 3.5V19a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 19V5A1.5 1.5 0 0 1 6 3.5z"/><path d="M8 3.5V9h7V3.5M7.5 20.5v-6h9v6"/>',
  folder: '<path d="M3.5 6.5A1.5 1.5 0 0 1 5 5h4.5l2 2.5H19a1.5 1.5 0 0 1 1.5 1.5v9A1.5 1.5 0 0 1 19 19.5H5A1.5 1.5 0 0 1 3.5 18z"/>',
  alert: '<path d="M12 3.5 2.5 20h19z"/><path d="M12 10v4.5M12 17.2v.3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 20.5c.8-4.2 4-6.5 8-6.5s7.2 2.3 8 6.5"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3M14 9l2 2"/>',
  lock: '<rect x="5" y="11" width="14" height="9.5" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5.5A1.5 1.5 0 0 0 14.5 4h-9A1.5 1.5 0 0 0 4 5.5v9A1.5 1.5 0 0 0 5.5 16H8"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  box: '<path d="M3.5 7.5 12 3l8.5 4.5v9L12 21l-8.5-4.5z"/><path d="M3.5 7.5 12 12l8.5-4.5M12 12v9"/><path d="m7.8 5.3 8.5 4.5"/>',
  cap: '<path d="M2.5 9 12 4.5 21.5 9 12 13.5z"/><path d="M6.5 11v4.6c1.4 1.4 3.4 2.2 5.5 2.2s4.1-.8 5.5-2.2V11"/><path d="M21.5 9v5.5"/>',
  inbox: '<path d="M3.5 13.5 6 5h12l2.5 8.5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/><path d="M3.5 13.5h5l1 2.5h5l1-2.5h5"/>',
  outbox: '<path d="M12 14V3.5M8 7.5l4-4 4 4"/><path d="M3.5 13.5h5l1 2.5h5l1-2.5h5V19a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 19z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  chart: '<path d="M4 3.5V20h16.5"/><rect x="7.5" y="11" width="3" height="6" rx=".6"/><rect x="12.5" y="6.5" width="3" height="10.5" rx=".6"/><rect x="17.5" y="13" width="3" height="4" rx=".6"/>',
  chat: '<path d="M4 4.5h10.5A1.5 1.5 0 0 1 16 6v6.5a1.5 1.5 0 0 1-1.5 1.5H9l-4 3.5V14H4a1.5 1.5 0 0 1-1.5-1.5V6A1.5 1.5 0 0 1 4 4.5z"/><path d="M16 8.5h4A1.5 1.5 0 0 1 21.5 10v6a1.5 1.5 0 0 1-1.5 1.5h-1v3l-3.5-3H11a1.5 1.5 0 0 1-1.5-1.5"/>',
  target: '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4.2"/><circle cx="12" cy="12" r="1"/>',
  pupil: '<rect x="4" y="3.5" width="16" height="17" rx="2"/><circle cx="12" cy="10" r="2.8"/><path d="M7.5 17.5c.7-2.3 2.4-3.6 4.5-3.6s3.8 1.3 4.5 3.6"/>',
  board: '<rect x="3" y="4" width="18" height="12" rx="1.5"/><path d="M8 20l4-4 4 4"/><path d="M7 8.5h6M7 11.5h10"/>',
  council: '<path d="M3 20h18"/><path d="M5 20V10l7-5 7 5v10"/><path d="M9 20v-6h6v6"/><circle cx="12" cy="9.5" r="1.3"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 16.8 6.6 19.8l1.1-6.1L3.2 9.4l6.1-.8z"/>',
  coin: '<ellipse cx="12" cy="6.5" rx="7" ry="2.8"/><path d="M5 6.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/><path d="M5 11.5v5c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8v-5"/>'
};
// default size 18px (CSS rules still win where a size is set): an icon can never fill a whole window again
const ic = (n, extra = '') => `<svg viewBox="0 0 24 24" ${/\bwidth=/.test(extra) ? '' : 'width="18" height="18" '}fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${ICONS[n]}</svg>`;

/* ---------------- state ---------------- */
let DB = null;
let saveTimer = null;
const INST_KEYS = ['school', 'director', 'city', 'directorate', 'academy', 'ministry', 'email', 'phone', 'address', 'headerMode', 'letterhead', 'letterheadW', 'letterheadH', 'letterheadP', 'lpW', 'lpH', 'letterheadL', 'llW', 'llH', 'lhv', 'lhNorm', 'cycle', 'orgMode', 'gresa', 'commune', 'tifKingdom', 'tifMinistry', 'tifAcademy', 'tifRegion', 'tifDirectorate', 'stamp', 'stampW', 'stampH', 'stampOn', 'logo'];
const instList = () => DB.settings.institutions;
const instById = id => instList().find(i => i.id === id) || instList().find(i => i.id === DB.settings.activeInst) || instList()[0];
const curInst = () => instById(DB.settings.activeInst);
const settingsFor = id => Object.assign({}, DB.settings, instById(id));
const S = () => settingsFor(DB.settings.activeInst);
// downscale big uploads (keeps data file small, plenty for print)
function imageSize(dataUrl) {
  return new Promise(res => { const img = new Image(); img.onload = () => res({ w: img.naturalWidth, h: img.naturalHeight }); img.onerror = () => res(null); img.src = dataUrl; });
}
// letterheadW/H on every institution with an image letterhead (older data: computed once at start)
async function letterheadSizes() {
  let changed = false;
  for (const i of instList()) {
    if (i.letterhead && !(i.letterheadW && i.letterheadH)) { const z = await imageSize(i.letterhead); if (z && z.w && z.h) { i.letterheadW = z.w; i.letterheadH = z.h; changed = true; } }
    if (i.letterhead && i.lhv !== LH_VER) { try { await normalizeLetterhead(i); changed = true; } catch (_) {} }
  }
  if (changed) persist();
}
/* 1.9.2: every school's letterhead takes the same place on the page: white margins cut off, then the picture is widened
   (its first and last columns of pixels are drawn out to the right and to the left) up to the proportions of the page band:
   210 x 42 mm on a portrait page, 297 x 40 mm on a landscape page. The picture is never distorted; the original is kept. */
const LH_VER = 2, LH_AP = 210 / 42, LH_AL = 297 / 40;
const loadImgEl = src => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('صورة غير صالحة')); im.src = src; });
function lhCrop(im) {
  const W = im.naturalWidth, H = im.naturalHeight, c = document.createElement('canvas'); c.width = W; c.height = H;
  const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, W, H); g.drawImage(im, 0, 0);
  const d = g.getImageData(0, 0, W, H).data;
  const ink = (x, y) => { const k = (y * W + x) * 4; return d[k] < 236 || d[k + 1] < 236 || d[k + 2] < 236; };
  const rowOk = y => { let n = 0; for (let x = 0; x < W; x += 1) if (ink(x, y)) n++; return n > W * 0.002; };
  const colOk = x => { let n = 0; for (let y = 0; y < H; y += 1) if (ink(x, y)) n++; return n > H * 0.004; };
  let t = 0, b = H - 1, l = 0, r = W - 1;
  while (t < b && !rowOk(t)) t++;
  while (b > t && !rowOk(b)) b--;
  while (l < r && !colOk(l)) l++;
  while (r > l && !colOk(r)) r--;
  if (b - t < H * 0.2 || r - l < W * 0.2) return { c, x: 0, y: 0, w: W, h: H };
  const pad = Math.round((b - t) * 0.025);
  t = Math.max(0, t - pad); b = Math.min(H - 1, b + pad); l = Math.max(0, l - pad); r = Math.min(W - 1, r + pad);
  return { c, x: l, y: t, w: r - l + 1, h: b - t + 1 };
}
function lhBand(cr, aspect, maxW) {
  const w0 = cr.w, h0 = cr.h;
  const W = Math.max(w0, Math.round(h0 * aspect)), side = Math.floor((W - w0) / 2);
  const sc = Math.min(1, maxW / W);
  const c = document.createElement('canvas'); c.width = Math.round(W * sc); c.height = Math.round(h0 * sc);
  const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.scale(sc, sc);
  if (side > 0) { // the edges of the letterhead (background, lines, bands) continue to the edges of the page
    g.drawImage(cr.c, cr.x, cr.y, 1, h0, 0, 0, side + 1, h0);
    g.drawImage(cr.c, cr.x + w0 - 1, cr.y, 1, h0, side + w0 - 1, 0, W - side - w0 + 1, h0);
  }
  g.drawImage(cr.c, cr.x, cr.y, w0, h0, side, 0, w0, h0);
  let url = c.toDataURL('image/png');
  if (url.length > 900000) url = c.toDataURL('image/jpeg', 0.92);
  return { url, w: c.width, h: c.height };
}
async function normalizeLetterhead(i) {
  i.lhv = LH_VER;
  if (!i.letterhead || i.lhNorm === false) { delete i.letterheadP; delete i.letterheadL; return; }
  const cr = lhCrop(await loadImgEl(i.letterhead));
  const P = lhBand(cr, LH_AP, 2200), L = lhBand(cr, LH_AL, 2800);
  Object.assign(i, { letterheadP: P.url, lpW: P.w, lpH: P.h });
  if (Math.abs(L.w / L.h - P.w / P.h) < 0.05) { delete i.letterheadL; i.llW = P.w; i.llH = P.h; } else Object.assign(i, { letterheadL: L.url, llW: L.w, llH: L.h });
}
function shrinkImage(dataUrl, maxW = 2400) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const sc = Math.min(1, maxW / img.naturalWidth);
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * sc); c.height = Math.round(img.naturalHeight * sc);
      const g = c.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
      res(c.toDataURL('image/png'));
    };
    img.onerror = () => rej(new Error('صورة غير صالحة'));
    img.src = dataUrl;
  });
}

async function persist(now) {
  clearTimeout(saveTimer);
  const run = async () => { try { await window.api.save(DB); } catch (e) { toast('تعذر حفظ البيانات: ' + e.message, true); } };
  if (now) return run();
  saveTimer = setTimeout(run, 250);
}

function toast(msg, err) {
  const t = document.createElement('div');
  t.className = 'toast' + (err ? ' err' : '');
  t.textContent = msg;
  $('#toasts').appendChild(t);
  setTimeout(() => t.remove(), err ? 5000 : 2800);
}

/* ---------------- modal ---------------- */
function modal({ title, body, actions, size }) {
  const root = $('#modalRoot');
  const bg = document.createElement('div');
  bg.className = 'modal-bg';
  bg.innerHTML = `<div class="modal ${size || ''}"><div class="modal-h"><h3>${title}</h3><button class="btn icon" data-x>✕</button></div>
    <div class="modal-b"></div><div class="modal-f"></div></div>`;
  const b = $('.modal-b', bg);
  if (typeof body === 'string') b.innerHTML = body; else b.appendChild(body);
  const close = () => { bg.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  document.addEventListener('keydown', onKey);
  $('[data-x]', bg).onclick = close;
  bg.addEventListener('mousedown', e => { if (e.target === bg) close(); });
  const f = $('.modal-f', bg);
  (actions || []).forEach(a => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (a.cls || '');
    btn.innerHTML = a.label;
    btn.onclick = async () => { const r = a.onClick ? await a.onClick(bg) : true; if (r !== false) close(); };
    f.appendChild(btn);
  });
  root.appendChild(bg);
  const first = $('input,select,textarea', b);
  if (first) setTimeout(() => first.focus(), 30);
  return { el: bg, close };
}
function confirmBox(msg, okLabel = 'تأكيد', danger = true) {
  return new Promise(res => {
    modal({ title: 'تأكيد', size: 'sm', body: `<p style="margin:0;line-height:1.8">${msg}</p>`,
      actions: [{ label: okLabel, cls: danger ? 'danger' : 'pri', onClick: () => res(true) }, { label: 'إلغاء', onClick: () => res(false) }] });
  });
}

/* ---------------- helpers ---------------- */
const empById = id => DB.employees.find(e => e.id === id);
const empLabel = e => `${fullName(e)} — ${e.ppr || ''}`;
const sortedEmps = () => DB.employees.slice().sort((a, b) => fullName(a).localeCompare(fullName(b), 'ar'));
// 1.9.4: the pre-school educators (employed by FMPS, Zakoura...) have their own section: they are not in the staff list, its statistics or its absences
const isEdu = e => !!e && (e.cat === 'preschool' || (!e.cat && !!(window.K && K.E && K.E.cat(e) === 'preschool')));
const staffEmps = () => sortedEmps().filter(e => !isEdu(e));
const staffAll = () => (DB.employees || []).filter(e => !isEdu(e));
const addDays = (iso, n) => { const d = toDate(iso); if (!d) return ''; d.setUTCDate(d.getUTCDate() + n); return isoOf(d); };
const lastF = (type, k) => { const r = DB.records.filter(x => x.type === type && x.f && x.f[k]).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''))[0]; return r ? r.f[k] : ''; };
const recName = r => { const e = empById(r.empId); return e ? fullName(e) : (r.snap && r.snap.name) || '—'; };

// an absence / leave that covers guard duties of the teacher (جداول الحراسة) is flagged right away
function guardNote(empId, from, to) { try { const n = window.Guard && Guard.note(empId, from, to); if (n) setTimeout(() => toast(n, true), 400); } catch (_) {} }

function absenceOf(r) {
  // returns {from,to,reason} if record counts as an absence
  const f = r.f || {};
  if (!f.from || !f.to || f.excluded) return null;
  if (r.type === 'leave') return { from: f.from, to: f.to, reason: 'رخصة ' + (f.leaveType || '') };
  if (r.type === 'medical') return { from: f.from, to: f.to, reason: 'رخصة مرضية' };
  if (r.type === 'inquiry') return { from: f.from, to: f.to, reason: 'غياب غير مبرر' };
  if (r.type === 'absence') return { from: f.from, to: f.to, reason: f.reason || 'غياب' };
  if (r.type === 'medicalDir') return { from: f.from, to: f.to, reason: 'رخصة مرضية' };
  if (r.type === 'inquiryDir') return { from: f.from, to: f.to, reason: 'غياب غير مبرر' };
  if (r.type === 'paternity') return { from: f.from, to: f.to, reason: 'رخصة الأبوة' };
  if (r.type === 'marriage') return { from: f.from, to: f.to, reason: 'رخصة استثنائية للزواج' };
  if (r.type === 'permission') return f.timeFrom || f.timeTo ? null : { from: f.from, to: f.to, reason: 'إذن بالتغيب' };
  if (r.type === 'exceptional') return { from: f.from, to: f.to, reason: f.kind === 'ولادة' ? 'رخصة ولادة' : 'رخصة استثنائية' + (f.kindDetail ? ' (' + f.kindDetail + ')' : '') };
  return null;
}
// all absence entries (deduplicated per employee+period)
function absenceEntries() {
  const seen = new Map();
  DB.records.forEach(r => {
    const a = absenceOf(r);
    if (!a) return;
    if (isEdu(empById(r.empId))) return;   // 1.9.4: the pre-school educators are not in the staff absences
    const key = r.empId + '|' + a.from + '|' + a.to;
    const prev = seen.get(key);
    // prefer a medical receipt / manual entry reason over a generic leave request
    if (!prev || (prev.rec.type === 'leave' && r.type !== 'leave')) seen.set(key, { rec: r, ...a });
  });
  return Array.from(seen.values());
}
function monthBounds(y, m) { const from = `${y}-${String(m).padStart(2, '0')}-01`; const last = new Date(Date.UTC(y, m, 0)).getUTCDate(); return { from, to: `${y}-${String(m).padStart(2, '0')}-${last}` }; }
function overlap(a1, a2, b1, b2) { const s = a1 > b1 ? a1 : b1; const e = a2 < b2 ? a2 : b2; return s <= e ? { from: s, to: e, days: daysBetween(s, e) } : null; }
function monthRows(y, m) {
  const mb = monthBounds(y, m);
  return absenceEntries().map(a => {
    const o = overlap(a.from, a.to, mb.from, mb.to);
    if (!o) return null;
    const e = empById(a.rec.empId) || {};
    return { rec: a.rec, ppr: e.ppr || (a.rec.snap && a.rec.snap.ppr) || '', name: recName(a.rec), cadre: e.cadre || (a.rec.snap && a.rec.snap.cadre) || '',
      from: o.from, to: o.to, days: o.days, reason: a.reason, fullFrom: a.from, fullTo: a.to };
  }).filter(Boolean).sort((p, q) => p.name.localeCompare(q.name, 'ar') || p.from.localeCompare(q.from));
}
function historyFor(empId, refDate, excludeId) {
  const ref = refDate || todayIso();
  const since = addDays(ref, -365);
  return absenceEntries().filter(a => a.rec.empId === empId && a.rec.id !== excludeId && a.to >= since && a.from <= ref)
    .sort((p, q) => q.from.localeCompare(p.from))
    .map(a => ({ from: a.from, to: a.to, duration: durationText(daysBetween(a.from, a.to)), reason: a.reason }));
}

/* ---------------- navigation ----------------
   Two levels. Level 1 (dark sidebar): the main sections. Level 2 (light-green bar at the top of the page, right to left): the
   sub-sections of the active section. Every page keeps its route name; a tab is { r: route, a: argument, l: label, w: visible? }. */
// short labels of the categories of administrative documents for the secondary bar (the page title keeps the full name)
const DOC_SHORT = { leave: 'الرخص والغياب', work: 'الاستئناف والاستفسار', peda: 'التأطير والتتبع', cert: 'الشهادات والبطاقات', mail: 'المراسلات' };
const isSecCycle = () => !!(window.Cyc && Cyc.isSec());
// 1.9.4: what belongs to the primary / preschool only (hidden for the collège and the lycée)
const isPriCycle = () => !isSecCycle();
const PRI_ONLY = ['presch', 'preschDoc', 'roaiz', 'roaizDoc', 'roaizx', 'roaizxDoc', 'level1'];
const noPre = o => (isSecCycle() ? (o || []).filter(x => x[0] !== 'preschool') : o);
// 1.9.4: one independent institution (collège / lycée / primary «مدرسة مستقلة»): no school units anywhere
const isSingleOrg = () => !!(window.Cyc && Cyc.single());
const tab = (r, l, a, o) => Object.assign({ r, l, a: a || null, k: r + (a && a.cat ? ':' + a.cat : '') }, o || {});
/* 1.9.4: four levels in every axis — the axis (sidebar) › its domains (coloured, secondary bar) › the sections of the domain (third bar)
   › the tabs inside each page. Related axes are gathered (التقويم + التنظيم التربوي = التدبير التربوي, الوثائق الإدارية of the staff go
   to الموارد البشرية, مكتب الضبط to التدبير الإداري...) and named as in the Moroccan public school administration. */
const NAV = [
  { id: 'home', c: '#0f6e5a', label: 'لوحة القيادة', icon: 'home', grps: [['لوحة القيادة والمؤشرات', ['home', 'dash']], ['الطبع الشامل', ['printAll']]],
    tabs: () => [tab('home', 'لوحة القيادة'), tab('dash', 'المؤشرات والمبيانات'), tab('printAll', 'الطبع الشامل لوثائق الخانات')] },
  { id: 'staff', c: '#5b3fb0', label: 'شؤون الموارد البشرية', icon: 'users', grps: [['شؤون الموظفين', ['employees']], ['مربيات ومربو التعليم الأولي', ['presch']], ['أعوان الحراسة والنظافة', ['sagents', 'sagents:log', 'sagents:sum']], ['المتابعة اليومية للموظفين', ['track', 'guard']], ['الغياب والرخص', ['absences', 'attoffSt', 'documents:leave']], ['الوضعية الإدارية', ['documents:work', 'documents:cert', 'svcAcc']]],
    tabs: () => [tab('employees', 'لائحة الموظفين'), tab('presch', 'بطاقات المربيات والمربين ووثائقهم', null, { w: isPriCycle }),
      tab('sagents', 'بطاقات الأعوان والشركات المشغلة', { v: 'list' }, { k: 'sagents' }), tab('sagents', 'تتبع القيام بالأعمال', { v: 'log' }, { k: 'sagents:log' }), tab('sagents', 'الحصيلة الشهرية وتقييم الخدمة', { v: 'sum' }, { k: 'sagents:sum' }), tab('track', 'شبكة تتبع العمل التربوي'), tab('guard', 'جداول الحراسة'), tab('absences', 'سجل الغياب والرخص'), tab('attoffSt', 'النماذج الرسمية للغياب'),
      tab('documents', 'طلبات الرخص', { cat: 'leave' }), tab('documents', 'الاستئناف والانقطاع والاستفسار', { cat: 'work' }), tab('documents', 'الشهادات الإدارية وبطاقات التقديم', { cat: 'cert' }), tab('svcAcc', 'حوادث الشغل (المصلحة)')] },
  { id: 'pupils', c: '#0b7a8a', label: 'شؤون التلاميذ', icon: 'pupil', grps: [['التمدرس والتسجيل', ['pupils', 'preins']], ['الملفات والشواهد المدرسية', ['mail:dos', 'documents:files', 'certsCur', 'certs']], ['المواظبة والانضباط', ['attend', 'absreg', 'vschool']], ['الصحة والسلامة المدرسية', ['incid']]],
    tabs: () => [tab('pupils', 'بطاقة التلاميذ (مسار)'), tab('preins', 'طلبات التسجيل الجديدة'),
      tab('mail', 'طلب وإرسال الملفات المدرسية', { dir: 'dos' }, { k: 'mail:dos' }), tab('documents', 'مراسلات الملفات والوثائق', { cat: 'files' }), tab('certsCur', 'الشواهد المدرسية (المتمدرسون)'), tab('certs', 'الشواهد المدرسية (ملفات الأرشيف)'),
      tab('attend', 'مواظبة التلاميذ'), tab('absreg', 'سجل غياب التلاميذ'), tab('vschool', 'الحراسة العامة', null, { w: isSecCycle, k: 'vschool' }), tab('vschool', 'حراسة التلاميذ', null, { w: isPriCycle, k: 'vschool' }),
      tab('incid', 'الحوادث المدرسية')] },
  { id: 'eval', c: '#a4570b', label: 'التدبير التربوي', icon: 'chart', grps: [['التنظيم التربوي', ['teach', 'councils', 'plan']], ['التقويم والدعم', ['roaiz', 'cceval', 'roaizx', 'support']], ['الامتحانات الإشهادية', ['exams']], ['التأطير والتتبع التربوي', ['documents:peda']]],
    tabs: () => [tab('teach', 'توزيع الأساتذة على الأقسام'), tab('councils', 'مجالس المؤسسة'), tab('plan', 'مشروع المؤسسة وبرنامج العمل'),
      tab('roaiz', 'الروائز التشخيصية (TaRL)', null, { w: isPriCycle }), tab('cceval', 'المراقبة المستمرة'), tab('roaizx', 'تقارير الروائز وشبكات التفريغ', null, { w: isPriCycle }), tab('support', 'الدعم التربوي الممتد'),
      tab('exams', 'الامتحانات الإشهادية'), tab('documents', 'التأطير والتتبع التربوي', { cat: 'peda' })] },
  // 1.9.4: «السبورة المرجعية» is a main section; its sub-sections are the groups of documents of the board
  { id: 'board', c: '#3949ab', label: 'السبورة المرجعية', icon: 'board', grps: [['المؤسسة والأطر', ['board:a1', 'board:a2', 'board:a3']], ['التلاميذ', ['board:b']], ['الوثائق المستوردة', ['board:c']]],
    tabs: () => [tab('board', 'التعريف بالمؤسسة والتنظيم التربوي', { g: 'a1', only: ['a1'], title: 'السبورة المرجعية — التعريف بالمؤسسة والتنظيم التربوي' }, { k: 'board:a1' }), tab('board', 'الأطر والعاملون بالمؤسسة', { g: 'a2', only: ['a2'], title: 'السبورة المرجعية — الأطر والعاملون بالمؤسسة' }, { k: 'board:a2' }), tab('board', 'الجمعيات والمجالس والخلايا', { g: 'a3', only: ['a3'], title: 'السبورة المرجعية — الجمعيات والمجالس والخلايا' }, { k: 'board:a3' }), tab('board', 'إحصائيات التلاميذ', { g: 'b', only: ['b'], title: 'السبورة المرجعية — إحصائيات التلاميذ' }, { k: 'board:b' }), tab('board', 'وثائق مستوردة من أقسام البرنامج', { g: 'c', only: ['c'], title: 'السبورة المرجعية — وثائق مستوردة من أقسام البرنامج' }, { k: 'board:c' })] },
  { id: 'life', c: '#b0215e', label: 'الحياة المدرسية', icon: 'star', grps: [['الأندية والأنشطة التربوية', ['clubs', 'events', 'kudos']], ['خليتا اليقظة والإنصات والمصالحة', ['vigil', 'listen']], ['الانفتاح والشراكة', ['partners']], ['الإعلام والتواصل', ['flyers', 'mag']]],
    tabs: () => [tab('clubs', 'الأندية التربوية'), tab('events', 'الأنشطة والاحتفالات'), tab('kudos', 'التحفيز والتهاني'), tab('vigil', 'خلية اليقظة'), tab('listen', 'خلية الإنصات والمصالحة'),
      tab('partners', 'الشركاء وجمعية الآباء'), tab('flyers', 'الإعلانات والتصاميم'), tab('mag', 'مجلة المؤسسة')] },
  { id: 'docs', c: '#1d5fa6', label: 'التدبير الإداري', icon: 'file', grps: [['الضبط', ['mail', 'records']], ['المراسلات والمذكرات', ['documents:mail', 'memos']], ['المتابعة اليومية', ['dayrep']]],
    tabs: () => [tab('mail', 'الواردات والصادرات والأرشيف'), tab('records', 'سجل الوثائق المنجزة'), tab('documents', 'المراسلات الإدارية', { cat: 'mail' }), tab('memos', 'المذكرات الداخلية'), tab('dayrep', 'التقارير اليومية للأنشطة المنجزة')]
      .concat((Docs.CATS || []).filter(([c]) => !['leave', 'work', 'peda', 'cert', 'mail'].includes(c)).map(([c, n]) => tab('documents', n, { cat: c }))) },
  { id: 'fin', c: '#7a4a1e', label: 'التدبير المالي والمادي', icon: 'coin', grps: [['التدبير المالي', ['dues', 'budget']], ['الجمعيات المدرسية', ['budget:najah', 'budget:sport', 'budget:coop']], ['التدبير المادي', ['stock', 'conso']]],
    tabs: () => [tab('dues', 'الاشتراكات والتسجيل'), tab('budget', 'الميزانية (نظرة شاملة)'),
      tab('budget', 'جمعية دعم مدرسة النجاح', { part: 'najah', only: ['nj_', 'rg_nj'], title: 'جمعية دعم مدرسة النجاح' }, { k: 'budget:najah' }),
      tab('budget', 'الجمعية الرياضية المدرسية', { part: 'sport', only: ['sp_', 'rg_sp'], title: 'الجمعية الرياضية المدرسية' }, { k: 'budget:sport' }),
      tab('budget', 'جمعية تنمية التعاون المدرسي', { part: 'coop', only: ['cp_', 'rg_cp'], title: 'جمعية تنمية التعاون المدرسي (التعاونية المدرسية)' }, { k: 'budget:coop', w: isPriCycle }), tab('stock', 'العتاد والوسائل التعليمية'), tab('conso', 'استهلاك الماء والكهرباء')] },
  { id: 'settings', c: '#455a64', label: 'الإعدادات', icon: 'gear', tabs: () => [tab('settings', 'الإعدادات')] },
  { id: 'license', c: '#37474f', label: 'التفعيل', icon: 'key', tabs: () => [tab('license', 'التفعيل')] }
];
// detail pages -> the tab they belong to (the route of the tab, or «route:cat» for the tabs of the documents page)
const NAV_PARENT = { level1: 'roaiz', stockDoc: 'stock', equipDoc: 'stock', certDoc: 'certs', attendDoc: 'attend', attoff: 'attend', attoffDoc: 'attend', attoffStDoc: 'attoffSt', incidDoc: 'incid', certsCurDoc: 'certsCur', svcAccDoc: 'svcAcc', mailDoc: 'mail', ccevalDoc: 'cceval', roaizxDoc: 'roaizx', partnerDoc: 'partners', holidaysDoc: 'settings', roaizDoc: 'roaiz',
  pupilDoc: 'pupils', boardDoc: 'board', councilDoc: 'councils', budgetDoc: 'budget', clubsDoc: 'clubs', eventsDoc: 'events', kudosDoc: 'kudos', memosDoc: 'memos', examsDoc: 'exams', supportDoc: 'support',
  teachDoc: 'teach', receiptDoc: 'license', duesDoc: 'dues', absregDoc: 'absreg', vigilDoc: 'vigil', listenDoc: 'listen', empCard: 'employees', empGallery: 'employees', filesDoc: 'documents:files',
  consoDoc: 'conso', preinsDoc: 'preins', magDoc: 'mag', preschDoc: 'presch', visits: 'documents:peda', visitsDoc: 'documents:peda', trackDoc: 'track', guardDoc: 'guard', dayrepDoc: 'dayrep', vschoolDoc: 'vschool' };
let current = 'home', currentArg = null;
const lastTab = {};
const visibleTabs = g => g.tabs().filter(t => !t.w || t.w());
// key of the tab that holds the page being shown
function curTabKey() {
  let r = current, a = currentArg || {};
  if (r === 'editor') {
    const f = a.from;
    if (f && f !== 'documents') return f === 'records' ? 'records' : (NAV_PARENT[f] || f);
    const T = TYPES[a.type];
    return 'documents:' + ((T && T.cat) || ((Docs.CATS || [['all']])[0][0]));
  }
  if (r === 'documents' && a.cat === 'follow') return 'dayrep';
  if (r === 'documents') return 'documents:' + (a.cat || ((Docs.CATS || [['all']])[0][0]));
  if (r === 'board') return 'board:' + ((a.only && a.only[0]) || a.g || 'a1');
  if (r === 'boardDoc') { try { const c = K.centers.find(x => x.id === 'board'), d = c && c.docs().find(x => x.k === a.kind); if (d && d.grp) return 'board:' + d.grp; } catch (_) {} return 'board:a1'; }
  if (r === 'sagents') return a.v && a.v !== 'list' ? 'sagents:' + a.v : 'sagents';
  if (r === 'sagentsDoc') return a.kind === 'eval' ? 'sagents:sum' : a.kind === 'month' ? 'sagents:log' : 'sagents';
  if (r === 'budget' && a.part) return 'budget:' + a.part;
  if (r === 'budgetDoc' && window.Budget) { const d = Budget.docs().find(x => x.k === a.kind), g = d ? String(d.grp || '') : ''; const p = /^(nj_|rg_nj)/.test(g) ? 'najah' : /^(sp_|rg_sp)/.test(g) ? 'sport' : /^(cp_|rg_cp)/.test(g) ? 'coop' : ''; if (p) return 'budget:' + p; }
  if ((r === 'mail' && a.dir === 'dos') || (r === 'mailDoc' && /^dos/.test(a.kind || ''))) return 'mail:dos';
  return NAV_PARENT[r] || r;
}
function curNav() {
  const key = curTabKey();
  for (const g of NAV) { const t = visibleTabs(g).find(x => x.k === key || (x.r === key && !x.a)); if (t) return { g, t }; }
  for (const g of NAV) { const t = g.tabs().find(x => x.k === key || x.r === key); if (t) return { g, t }; }
  return { g: NAV[0], t: NAV[0].tabs()[0] };
}
const NAV_GC = ['#1d5fa6', '#c2410c', '#7b3fb0', '#0b7a8a', '#2f7d32', '#b0215e'];
function navShade(hex, f) {
  const n = parseInt(String(hex).slice(1), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(v => Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f));
  return '#' + c.map(v => Math.max(0, Math.min(255, v)).toString(16).padStart(2, '0')).join('');
}
// the groups of the sub-sections of a section (tabs not listed fall into the group of the previous tab, or a group «أخرى»)
function navGroups(g, vt) {
  if (!g.grps) return [{ i: 0, n: g.label, c: g.c, tabs: vt }];
  const G = g.grps.map(([n, ks], i) => ({ i, n, c: NAV_GC[i % NAV_GC.length], ks, tabs: [] }));
  vt.forEach(t => { const x = G.find(y => y.ks.includes(t.k)) || (!t.a ? G.find(y => y.ks.includes(t.r)) : null); if (x) x.tabs.push(t); else { const o = G.find(y => y.n === 'أخرى') || (G.push({ i: G.length, n: 'أخرى', c: NAV_GC[G.length % NAV_GC.length], ks: [], tabs: [] }), G[G.length - 1]); o.tabs.push(t); } });
  return G.filter(x => x.tabs.length).map((x, i) => Object.assign(x, { i }));
}
function renderNav() {
  const todayCount = absentToday().length;
  const { g: cg, t: ct } = curNav();
  lastTab[cg.id] = ct;
  const bAbs = `<span class="badge" title="غائبون اليوم">${todayCount}</span>`;
  // 1.9.4: every section has its colour (sidebar, secondary bar, sub-sections, selectors inside the pages), like the stages of «شؤون التلاميذ»
  const root = document.documentElement.style; root.setProperty('--sec', cg.c || '#0f6e5a'); root.setProperty('--sec2', navShade(cg.c || '#0f6e5a', -0.22)); root.setProperty('--secl', navShade(cg.c || '#0f6e5a', 0.9));
  $('#nav').innerHTML = NAV.map(g => `<a data-g="${g.id}" data-go="${g.id}" class="${cg.id === g.id ? 'on' : ''}" style="--gc:${g.c || '#0f6e5a'}"><i class="nv-ic">${ic(g.icon)}</i><span>${g.label}</span>
    ${g.id === 'staff' && todayCount ? bAbs : ''}${g.id === 'license' && !LIC.active ? `<span class="badge red" title="${licText()}">!</span>` : ''}</a>`).join('');
  $$('#nav [data-g]').forEach(a => a.onclick = () => {
    const g = NAV.find(x => x.id === a.dataset.g), vt = visibleTabs(g);
    const G0 = navGroups(g, vt), t = (G0[0] && G0[0].tabs[0]) || vt[0];   // 1.9.4: opening a section = its first sub-section
    go(t.r, t.a);
  });
  // the secondary bar (only when the section has several sub-sections)
  const sn = $('#subnav'), vt = visibleTabs(cg);
  if (vt.length > 1) {
    sn.hidden = false;
    const tabA = t => `<a data-k="${t.k}" class="${t.k === ct.k ? 'on' : ''}">${t.l}${t.r === 'absences' && todayCount ? bAbs : ''}</a>`;
    const G = navGroups(cg, vt), cur = G.find(x => x.tabs.some(t => t.k === ct.k)) || G[0];
    if (G.length > 1) {
      // three levels: the section (sidebar) -> its groups (coloured, like الكل / الأولي / الابتدائي) -> the sub-sections of the group
      sn.innerHTML = `<div class="sn-in"><span class="sn-t">${ic(cg.icon)}${cg.label}</span><div class="sn-tabs sn-grps">${G.map(x => `<a data-gk="${x.i}" class="sn-g ${x === cur ? 'on' : ''}" style="--gc:${x.c}"><i></i>${x.n}<b>${x.tabs.length}</b></a>`).join('')}</div></div>
        <div class="sn-l3" style="--gc:${cur.c}"><div class="sn-in"><span class="sn-t3">${cg.label} › ${cur.n}</span><div class="sn-tabs">${cur.tabs.map(tabA).join('')}</div></div></div>`;
    } else sn.innerHTML = `<div class="sn-in"><span class="sn-t">${ic(cg.icon)}${cg.label}</span><div class="sn-tabs">${vt.map(tabA).join('')}</div></div>`;
    $$('#subnav [data-k]').forEach(a => a.onclick = () => { const t = vt.find(x => x.k === a.dataset.k); go(t.r, t.a); });
    $$('#subnav [data-gk]').forEach(a => a.onclick = () => { const x = G[+a.dataset.gk]; const t = x.tabs[0]; go(t.r, t.a); });
    if (cur) lastTab['g:' + cg.id + ':' + cur.i] = ct;
  } else { sn.hidden = true; sn.innerHTML = ''; }
  document.documentElement.style.setProperty('--sn', sn.hidden ? '0px' : (sn.offsetHeight || 48) + 'px');
  $('#brandSchool').textContent = S().school || '';
  renderSy();
}
// active school year (الموسم الدراسي): sidebar picker, followed by every page
function renderSy() {
  const sel = $('#syPick'); if (!sel || !window.MK || !MK.curSy) return;
  const cur = MK.curSy();
  sel.innerHTML = MK.syList().map(y => `<option value="${y}" ${y === cur ? 'selected' : ''}>${MK.syDash(y)}${y === MK.schoolYear(todayIso()) ? ' (الحالي)' : ''}</option>`).join('');
  sel.onchange = () => { MK.setSy(sel.value); toast('الموسم الدراسي النشط: ' + MK.syDash(MK.curSy())); go(current === 'editor' ? 'home' : current); };
}
function go(page, arg) {
  if (PRI_ONLY.includes(page) && isSecCycle()) { page = 'home'; arg = null; }
  $('#modalRoot').innerHTML = '';
  current = page; currentArg = arg || null;
  try { if (window.Pupils && Pupils.normLv && Pupils.normLv()) persist(); } catch (_) {}
  try { if (window.Units && Units.normSec && Units.normSec()) persist(); } catch (e) { /* alignment of the units with the institution (collège / lycée) is best effort */ }
  renderNav();
  const v = $('#view');
  v.innerHTML = '';
  $('.main').scrollTop = 0;
  ({ home: pageHome, employees: pageEmployees, documents: pageDocuments, absences: pageAbsences, records: pageRecords, settings: pageSettings, editor: pageEditor, license: pageLicense,
    stock: (vv, a) => window.pageStock(vv, a), stockDoc: (vv, a) => window.pageStockDoc(vv, a), equipDoc: (vv, a) => window.pageEquipDoc(vv, a),
    certs: (vv, a) => window.pageCerts(vv, a), certDoc: (vv, a) => window.pageCertDoc(vv, a),
    attend: (vv, a) => window.pageAttend(vv, a), attendDoc: (vv, a) => window.pageAttendDoc(vv, a),
    partners: (vv, a) => window.pagePartners(vv, a), partnerDoc: (vv, a) => window.pagePartnerDoc(vv, a),
    holidaysDoc: (vv, a) => window.pageHolidaysDoc(vv, a),
    roaiz: (vv, a) => window.pageRoaiz(vv, a), roaizDoc: (vv, a) => window.pageRoaizDoc(vv, a),
    pupils: (vv, a) => window.pagePupils(vv, a), pupilDoc: (vv, a) => window.pagePupilDoc(vv, a),
    board: (vv, a) => window.pageBoard(vv, a), boardDoc: (vv, a) => window.pageBoardDoc(vv, a),
    absreg: (vv, a) => window.pageAbsReg(vv, a), absregDoc: (vv, a) => window.pageAbsRegDoc(vv, a),
    dues: (vv, a) => window.pageDues(vv, a), duesDoc: (vv, a) => window.pageDuesDoc(vv, a),
    vigil: (vv, a) => window.pageVigil(vv, a), vigilDoc: (vv, a) => window.pageVigilDoc(vv, a), listen: (vv, a) => window.pageListen(vv, a), listenDoc: (vv, a) => window.pageListenDoc(vv, a),
    councils: (vv, a) => window.pageCouncils(vv, a), councilDoc: (vv, a) => window.pageCouncilDoc(vv, a),
    empGallery: (vv, a) => window.pageEmpGallery(vv, a),
    plan: (vv, a) => window.pagePlan(vv, a), dash: (vv, a) => window.pageDash(vv, a),
    budget: (vv, a) => window.pageBudget(vv, a), budgetDoc: (vv, a) => window.pageBudgetDoc(vv, a),
    clubs: (vv, a) => window.pageClubs(vv, a), clubsDoc: (vv, a) => window.pageClubsDoc(vv, a), events: (vv, a) => window.pageEvents(vv, a), eventsDoc: (vv, a) => window.pageEventsDoc(vv, a),
    attoff: (vv, a) => window.pageAttoff(vv, a), attoffDoc: (vv, a) => window.pageAttoffDoc(vv, a),
    roaizx: (vv, a) => window.pageRoaizx(vv, a), roaizxDoc: (vv, a) => window.pageRoaizxDoc(vv, a), level1: (vv, a) => window.pageLevel1(vv, a),
    cceval: (vv, a) => window.pageCceval(vv, a), ccevalDoc: (vv, a) => window.pageCcevalDoc(vv, a),
    printAll: vv => window.pagePrintAll(vv),
    sagents: (vv, a) => window.pageSAgents(vv, a), sagentsDoc: (vv, a) => window.pageSAgentsDoc(vv, a), mail: (vv, a) => window.pageMail(vv, a), mailDoc: (vv, a) => window.pageMailDoc(vv, a),
    flyers: (vv, a) => window.pageFlyers(vv, a),
    certsCur: (vv, a) => window.pageCertsCur(vv, a), certsCurDoc: (vv, a) => window.pageCertsCurDoc(vv, a),
    incid: (vv, a) => window.pageIncid(vv, a), incidDoc: (vv, a) => window.pageIncidDoc(vv, a), svcAcc: (vv, a) => window.pageSvcAcc(vv, a), svcAccDoc: (vv, a) => window.pageSvcAccDoc(vv, a),
    attoffSt: (vv, a) => window.pageAttoffSt(vv, a), attoffStDoc: (vv, a) => window.pageAttoffStDoc(vv, a),
    kudos: (vv, a) => window.pageKudos(vv, a), kudosDoc: (vv, a) => window.pageKudosDoc(vv, a),
    memos: (vv, a) => window.pageMemos(vv, a), memosDoc: (vv, a) => window.pageMemosDoc(vv, a),
    track: (vv, a) => window.pageTrack(vv, a), trackDoc: (vv, a) => window.pageTrackDoc(vv, a),
    conso: (vv, a) => window.pageConso(vv, a), preins: (vv, a) => window.pagePreins(vv, a), preinsDoc: (vv, a) => window.pagePreinsDoc(vv, a), mag: (vv, a) => window.pageMag(vv, a), magDoc: (vv, a) => window.pageMagDoc(vv, a), presch: (vv, a) => window.pagePresch(vv, a), preschDoc: (vv, a) => window.pagePreschDoc(vv, a), consoDoc: (vv, a) => window.pageConsoDoc(vv, a), visits: (vv, a) => window.pageVisits(vv, a), visitsDoc: (vv, a) => window.pageVisitsDoc(vv, a),
    guard: (vv, a) => window.pageGuard(vv, a), guardDoc: (vv, a) => window.pageGuardDoc(vv, a), dayrep: (vv, a) => window.pageDayRep(vv, a), dayrepDoc: (vv, a) => window.pageDayRepDoc(vv, a), vschool: (vv, a) => window.pageVSchool(vv, a), vschoolDoc: (vv, a) => window.pageVSchoolDoc(vv, a),
    filesDoc: (vv, a) => window.pageFilesDoc(vv, a),
    receiptDoc: (vv, a) => window.pageReceiptDoc(vv, a),
    empCard: (vv, a) => window.pageEmpCard(vv, a),
    exams: (vv, a) => window.pageExams(vv, a), examsDoc: (vv, a) => window.pageExamsDoc(vv, a),
    support: (vv, a) => window.pageSupport(vv, a), supportDoc: (vv, a) => window.pageSupportDoc(vv, a),
    teach: (vv, a) => window.pageTeach(vv, a), teachDoc: (vv, a) => window.pageTeachDoc(vv, a) })[page](v, arg);
}
function absentToday() {
  const t = todayIso();
  return absenceEntries().filter(a => a.from <= t && a.to >= t);
}

/* ================================================================= */
/* HOME */
function pageHome(v) {
  const now = new Date();
  const y = now.getFullYear(), m = now.getMonth() + 1;
  const rows = monthRows(y, m);
  const daysMonth = rows.reduce((s, r) => s + r.days, 0);
  const docsMonth = DB.records.filter(r => r.type !== 'absence' && (r.created || '').startsWith(`${y}-${String(m).padStart(2, '0')}`)).length;
  const today = absentToday().filter(a => !isEdu(empById(a.rec.empId)));
  const recent = DB.records.slice().sort((a, b) => (b.updated || '').localeCompare(a.updated || '')).slice(0, 6);
  // figures of every part of the application
  const sy = window.MK ? MK.curSy() : '';
  const syB = window.MK ? MK.syBoundsOf(sy) : { from: '', to: '' };
  const absSy = absenceEntries().filter(a => a.to >= syB.from && a.from <= syB.to);
  const medSy = absSy.filter(a => /مرضية|رخصة مرض/.test(a.reason)).length;
  const STF = staffAll(), EDU = (DB.employees || []).filter(isEdu);
  const teachers = STF.filter(e => /أستاذ|استاذ/.test(e.cadre || '')).length;
  const C = DB.certs || { students: [], issued: [] };
  const certsYear = (C.issued || []).filter(r => +r.year === y).length;
  const curPupils = (C.students || []).filter(x => x.status === 'current').length;
  const A = window.Attend && Attend.summary ? Attend.summary() : null;
  const P = window.Partners && Partners.summary ? Partners.summary() : null;
  const K = window.Stock && Stock.summary ? Stock.summary() : null;
  const R = window.Roaiz && Roaiz.summary ? Roaiz.summary() : null;
  const PU = window.Pupils && Pupils.summary ? Pupils.summary() : null;
  const BU = window.Budget && Budget.summary ? Budget.summary() : null;
  const BL = window.Budget && Budget.summary ? Budget.summary('life') : null;
  const dsec = id => { const g = NAV.find(x => x.id === id); if (!g) return ''; const t = visibleTabs(g)[0]; return `<div class="dsec" data-go2="${t.r}">${ic(g.icon)}${g.label}</div>`; };
  const fr = r => window.Attend ? Attend.fmt(r) : '-';
  const hot = r => A && r != null && r > A.alert;
  const kv = (l, val, cls) => `<div class="kv-r"><span>${l}</span><b class="${cls || ''}">${val}</b></div>`;
  const bar = (n, t) => `<div class="mbar"><span style="width:${t ? Math.round(n / t * 100) : 0}%"></span></div>`;
  const mod = (id, icon, title, body, foot) => `<div class="card mod" data-go2="${id}"><div class="mod-h">${ic(icon)}<h3>${title}</h3><span class="go">${ic('back', 'style="transform:scaleX(-1)"')}</span></div><div class="mod-b">${body}</div>${foot ? `<div class="mod-f">${foot}</div>` : ''}</div>`;
  v.innerHTML = `${!S().school ? `<div class="card setup-note"><div><b>مرحبا بك!</b> ابدأ بإدخال معطيات مؤسستك (الاسم، المدير، المديرية) وتحميل رأسية المؤسسة، ثم استورد لائحة الموظفين من ملف <b dir="ltr">agent</b> المحمل من موقع تبليغ (<span dir="ltr">Téléchargement de données → Source DRH</span>).</div>
      <button class="btn pri" data-go2="settings">${ic('gear')} الإعدادات</button><button class="btn" data-go2="employees">${ic('users')} الموظفون</button></div>` : ''}
    <div class="page-h" style="margin-bottom:12px"><h1>لوحة القيادة</h1><span class="sub">${sy ? 'الموسم الدراسي ' + esc(sy.replace('/', '-')) : ''}</span><span class="sp"></span>
      <div class="search h-search" title="بحث في كل البرنامج (Ctrl+K)">${ic('search')}<input class="inp" id="hSearchQ" placeholder="بحث: خانة، وثيقة، موظف، تلميذ..." autocomplete="off"></div>
      <button class="btn pri" id="hSearch" title="بحث في كل البرنامج (Ctrl+K)">${ic('search')} بحث</button>
      <button class="btn" id="hPrintAll" title="طبع أو حفظ PDF لكل وثائق الخانات دفعة واحدة">${ic('print')} الطبع الشامل</button>
      <button class="btn" data-go2="settings" title="معطيات المؤسسة، الرأسية، الحماية، النسخ الاحتياطية">${ic('gear')} الإعدادات</button>
      <button class="btn" data-go2="employees" title="لائحة الموظفين">${ic('users')} الموظفون</button>
      <span class="muted">${new Date().toLocaleDateString('ar-MA', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
    <div class="card hello">
      <img src="assets/emblem.png" style="width:58px">
      <div style="flex:1">
        <h2>${esc(S().school)}</h2>
        <p>${esc(S().directorate)}${S().director ? ' — المدير(ة): ' + esc(S().director) : ''}</p>
      </div>
      <div class="hello-tags">
        <span class="tag2 ${LIC.active ? 'ok' : 'bad'}" data-go2="license">${ic(LIC.active ? 'check' : 'alert')} ${LIC.active ? 'نسخة مفعلة' : licText()}</span>
        <span class="tag2 ${PROT.enabled ? 'ok' : ''}" data-go2="settings">${ic('lock')} ${PROT.enabled ? 'البيانات محمية بكلمة سر' : 'البيانات غير محمية'}</span>
        <span class="tag2" title="تاريخ بناء هذه النسخة">الإصدار ${window.APP_VER || '1.9'}${window.APP_EDITION === 'extra' ? ' EXTRA' : ''}${window.APP_BUILD ? ' (' + window.APP_BUILD + ')' : ''}${LIC.maxPc > 1 ? ' — حاسوبان' : ''}</span>
      </div>
    </div>
    <div class="stats">
      ${stat('users', STF.length, 'عدد الموظفين', '#e3f0ec', '#0e5a4a')}
      ${stat('user', today.length, 'غائبون اليوم', '#fbe9e7', '#b3261e')}
      ${stat('cal', daysMonth, `أيام غياب الموظفين في ${MONTHS[m - 1]}`, '#e6f0fa', '#1f5f9e')}
      ${stat('file', docsMonth, 'وثائق هذا الشهر', '#f7efdc', '#8a6418')}
    </div>
    ${miniCharts()}
    ${dsec('staff')}<div class="mods">
      ${mod('employees', 'users', 'الموظفون', kv('مجموع الموظفين', STF.length) + kv('هيئة التدريس', teachers) + kv('أطر أخرى', STF.length - teachers))}
      ${isPriCycle() ? mod('presch', 'pupil', 'مربيات ومربو التعليم الأولي', kv('عدد المربيات والمربين', EDU.length) + kv('المربيات', EDU.filter(e => e.sex === 'F').length) + (isSingleOrg() ? '' : kv('الوحدات المدرسية', new Set(EDU.map(e => e.unit).filter(Boolean)).size)) + kv('الجهات المشغلة', Array.from(new Set(EDU.map(e => (/النهوض/.test(e.org || '') ? 'FMPS' : /زاكورة/.test(e.org || '') ? 'زاكورة' : e.org)).filter(Boolean))).join('، ') || '—')) : ''}
      ${window.SAgents && SAgents.summary ? (x => mod('sagents', 'shield', 'أعوان الحراسة والنظافة', kv('عدد الأعوان', x.n) + kv('الشركات المشغلة', x.firms || '—')))(SAgents.summary()) : ''}
      ${mod('absences', 'cal', 'الغياب والرخص', kv('غائبون اليوم', today.length, today.length ? 'red' : '') + kv(`أيام الغياب في ${MONTHS[m - 1]}`, daysMonth) + kv('حالات الغياب خلال الموسم', absSy.length) + kv('منها رخص مرضية', medSy))}
    </div>
    ${dsec('docs')}<div class="mods">
      ${mod('records', 'hist', 'الوثائق الإدارية', kv('وثائق هذا الشهر', docsMonth) + kv('مجموع الوثائق في السجل', DB.records.filter(r => r.type !== 'absence').length) + kv('أنواع الوثائق المتوفرة', Object.values(TYPES).filter(t => !t.hidden).length))}
    </div>
    ${dsec('pupils')}<div class="mods">
      ${PU ? mod('pupils', 'pupil', 'بطاقة التلاميذ', PU.n ? (PU.pre ? kv('تلاميذ التعليم الابتدائي', PU.pri) + kv('أطفال التعليم الأولي', PU.pre) : kv('عدد التلاميذ', PU.n)) + kv('الإناث', `${PU.f} (${PU.fp})`) + (isSingleOrg() ? kv('الأقسام', PU.classes) : kv('الأقسام / الوحدات المدرسية', `${PU.classes} / ${PU.units}`)) + kv('الوافدون / المغادرون', `${PU.joined} / ${PU.left}`) + kv('المنقطعون / غير الملتحقين', `${PU.drop} / ${PU.notjoined}`, PU.drop || PU.notjoined ? 'red' : '')
        : '<span class="muted">استورد لوائح التلاميذ من منظومة مسار لتظهر هنا الإحصائيات والمبيانات.</span>', PU.n ? PU.chart : '') : ''}
      ${mod('certs', 'cap', 'الشواهد المدرسية (ملفات الأرشيف)', kv('التلاميذ في السجل', (C.students || []).length) + kv('منهم متمدرسون حاليا', curPupils) + kv(`شواهد مسلمة سنة ${y}`, certsYear) + kv('مجموع الشواهد المسلمة', (C.issued || []).length))}
    </div>
    ${dsec('eval')}<div class="mods">
      ${A ? mod('attend', 'chart', 'مواظبة التلاميذ', kv(A.last ? `نسبة الغياب (${esc(A.last.label)})` : 'نسبة الغياب', A.last ? fr(A.last.rate) + '%' : '-', hot(A.last && A.last.rate) ? 'red' : '')
        + kv('نسبة الغياب السنوية', A.rate == null ? '-' : fr(A.rate) + '%', hot(A.rate) ? 'red' : '') + kv('نسبة الحضور السنوية', A.rate == null ? '-' : (100 - A.rate).toFixed(2) + '%', 'green') + kv('الأشهر المملوءة', `${A.n} من 10`),
        A.n ? MK.svgBars(A.monthly, { alert: A.alert, w: 420, h: 120, fs: 8.5 }) : '<span class="muted">أدخل معطيات المواظبة الشهرية لتظهر هنا النسب والمبيان.</span>') : ''}
      ${R && R.groups && !isSecCycle() ? mod('roaiz', 'target', 'استثمار الروائز', kv('الفئات المستوردة', R.phases + ' من 8') + kv('مجموعات الدعم', R.groups) + (isSingleOrg() ? '' : kv('الوحدات المدرسية', R.units)) + kv('التلاميذ المعنيون', R.pupils)) : ''}
    </div>
    ${dsec('life')}<div class="mods">
      ${BL && BL.rows.length ? mod('clubs', 'star', 'الأندية والأنشطة', BL.rows.map(r => kv(r[0], r[1], r[2])).join('')) : ''}
      ${P ? mod('partners', 'chat', 'التواصل مع الشركاء', `<div class="kv-r"><span>المحطات التواصلية المنجزة</span><b>${P.done} من ${P.total}</b></div>${bar(P.done, P.total)}`
        + kv('المحطة القادمة', P.next ? `${esc(P.next.act)} (${esc(P.next.m)})` : 'أنجزت كل المحطات') + kv('وثائق الموسم (تقارير، محاضر، لوائح)', P.docs) + kv('أعضاء مكتب الجمعية', P.members) + kv('الشركاء المسجلون', P.others)) : ''}
    </div>
    ${dsec('fin')}<div class="mods">
      ${BU ? mod('budget', 'coin', 'الميزانية', BU.rows.map(r => kv(r[0], r[1], r[2])).join('')) : ''}
      ${K ? mod('stock', 'box', 'العتاد والوسائل التعليمية', kv('العتاد المسجل', K.equip) + kv('مسلم للموظفين', K.assigned) + (K.broken ? kv('عتاد معطل', K.broken, 'red') : '') + kv('المواد في المخزون', K.items) + kv('مواد نفدت', K.empty, K.empty ? 'red' : '')) : ''}
    </div>
    ${dsec('settings')}<div class="mods">
      ${window.Holidays ? (() => { const H = Holidays.summary(); return `<div class="card mod" data-hol="1"><div class="mod-h">${ic('cal')}<h3>العطل المدرسية</h3><span class="go">${ic('back', 'style="transform:scaleX(-1)"')}</span></div><div class="mod-b">
        ${H.next ? `<div class="kv-r"><span>العطلة القادمة</span><b>${esc(H.next.name)}</b></div><div class="kv-r"><span>التاريخ</span><b style="font-weight:600;font-size:12px">${esc(H.next.when)}</b></div>` + kv('عدد الأيام', esc(H.next.days)) : kv('العطلة القادمة', 'لا عطل قادمة هذا الموسم')}
        ${kv('مجموع عطل الموسم', H.count)}</div></div>`; })() : ''}
      ${mod('settings', 'gear', 'البرنامج والبيانات', kv('المؤسسات المسجلة', instList().length) + kv('الرأسية', S().headerMode === 'image' && S().letterhead ? 'صورة رأسية المؤسسة' : 'رأسية نصية') + kv('حماية البيانات', PROT.enabled ? 'مفعلة' : 'غير مفعلة', PROT.enabled ? 'green' : '') + kv('النسخ الاحتياطية', 'يومية تلقائية (30 يوما)') + kv('التفعيل', LIC.active ? 'مفعل' : 'غير مفعل', LIC.active ? 'green' : 'red'))}
    </div>
    <div class="dash2">
      <div class="card">
        <div class="card-h"><h3>إنشاء وثيقة</h3><span style="flex:1"></span><button class="btn sm" data-go2="documents">كل الوثائق (${Object.values(TYPES).filter(t => !t.hidden).length})</button></div>
        <div class="card-b"><div class="quick">${Object.entries(TYPES).filter(([k]) => ['inquiryDir', 'exceptional', 'workAttAr', 'workAttFr', 'resume', 'medicalDir', 'monthly'].includes(k)).map(([k, t]) => `
          <button class="qbtn" data-doc="${k}"><span class="e">${t.icon}</span><span><b>${t.title}</b><small>${t.desc}</small></span></button>`).join('')}
        </div></div>
      </div>
      <div class="grid">
        <div class="card">
          <div class="card-h"><h3>غائبون اليوم</h3></div>
          <div class="card-b" style="padding:6px 16px">${today.length ? `<table class="tbl">${today.map(a => `<tr><td class="name-cell"><b>${esc(recName(a.rec))}</b><small>${esc(a.reason)}</small></td>
            <td class="num muted">${fmtDate(a.from)} ← ${fmtDate(a.to)}</td></tr>`).join('')}</table>` : '<div class="empty-state" style="padding:16px">لا يوجد غياب مسجل اليوم</div>'}</div>
        </div>
        <div class="card">
          <div class="card-h"><h3>آخر الوثائق</h3><span style="flex:1"></span><button class="btn sm" data-go2="records">عرض الكل</button></div>
          <div class="card-b" style="padding:6px 16px">${recent.length ? `<table class="tbl">${recent.map(r => `<tr><td><span class="tag ${r.type}">${esc(typeTitle(r.type))}</span></td>
            <td>${esc(recName(r))}</td><td class="num muted">${fmtDate((r.updated || '').slice(0, 10))}</td></tr>`).join('')}</table>` : '<div class="empty-state" style="padding:16px">لم تُنشأ أي وثيقة بعد</div>'}</div>
        </div>
      </div>
    </div>`;
  $$('[data-doc]', v).forEach(b => b.onclick = () => go('editor', { type: b.dataset.doc }));
  $$('[data-go2]', v).forEach(b => b.onclick = e => { e.stopPropagation(); go(b.dataset.go2); });
  const search = t => { try { if (!window.Tools || !Tools.openSearch) throw new Error('Tools'); Tools.openSearch(t); } catch (e) { toast('تعذر فتح البحث: ' + (e && e.message || e), true); } };
  if ($('#hSearch')) $('#hSearch').onclick = () => search($('#hSearchQ') ? $('#hSearchQ').value : '');
  // 1.9.4: typing in the search box of the dashboard opens the search with the typed words
  if ($('#hSearchQ')) { const q = $('#hSearchQ'); q.oninput = () => { if (q.value.trim()) { const t = q.value; q.value = ''; search(t); } }; q.onkeydown = e => { if (e.key === 'Enter') search(q.value); }; }
  if ($('#hPrintAll')) $('#hPrintAll').onclick = () => go('printAll');
  $$('[data-hol]', v).forEach(b => b.onclick = () => Holidays.openManager());
}
// 1.9.4: a few charts on the dashboard + the entry to the complete (printable) indicators page
function miniCharts() {
  let L = [];
  try { L = window.Dash ? Dash.mini() : []; } catch (e) { L = []; }
  return `<div class="card dh-home"><div class="card-h"><h3>المؤشرات الرئيسية</h3><span style="flex:1"></span><button class="btn sm pri" data-go2="dash">${ic('chart')} المؤشرات والمبيانات الكاملة (طباعة / PDF / Word)</button></div>
    ${L.length ? `<div class="card-b dh-mini">${L.map(c => `<div class="dh-mc"><div class="dh-ct">${c.t}</div>${c.h}</div>`).join('')}</div>` : '<div class="card-b muted" style="font-size:12.5px;padding:10px 16px">أدخل معطيات الموظفين والتلاميذ والغياب لتظهر هنا المبيانات، وافتح «المؤشرات والمبيانات الكاملة» لوثيقة قابلة للطباعة بعشرات المؤشرات.</div>'}</div>`;
}
const stat = (icon, n, t, bg, fg) => `<div class="card stat"><div class="ic" style="background:${bg};color:${fg}">${ic(icon)}</div><div><div class="n">${n}</div><div class="t">${t}</div></div></div>`;
const typeTitle = t => t === 'absence' ? 'غياب مسجل' : (TYPES[t] ? TYPES[t].title : t);

/* ================================================================= */
/* EMPLOYEES */
const EMP_FIELDS = [
  ['firstAr', 'الاسم الشخصي (بالعربية)', 'text', true], ['lastAr', 'الاسم العائلي (بالعربية)', 'text', true],
  ['firstFr', 'Prénom', 'text', false, 'ltr'], ['lastFr', 'Nom', 'text', false, 'ltr'],
  ['cadreFr', 'Cadre (بالفرنسية)', 'text', false, 'ltr'],
  ['ppr', 'رقم التأجير (الرقم المالي)', 'text', true], ['cin', 'رقم البطاقة الوطنية', 'text'],
  ['birth', 'تاريخ الازدياد', 'date'], ['hire', 'تاريخ التوظيف', 'date'],
  ['affDate', 'تاريخ التعيين بالمؤسسة', 'date'], ['sex', 'الجنس', 'sex'],
  ['birthPlace', 'مكان الازدياد', 'text'], ['cadre', 'الإطار', 'text'],
  ['grade', 'الدرجة', 'text'], ['scale', 'السلم', 'text'],
  ['echelon', 'الرتبة', 'text'], ['index', 'الرقم الاستدلالي', 'text'],
  ['task', 'المهمة', 'text'], ['subject', 'مادة التدريس', 'text'],
  ['origin', 'مقر العمل الأصلي', 'text'], ['assigned', 'مؤسسة التكليف', 'text'],
  ['asgFrom', 'تاريخ التكليف بالمؤسسة: من', 'date'], ['asgTo', 'تاريخ التكليف بالمؤسسة: إلى', 'date'],
  ['address', 'العنوان الشخصي', 'text', false, '', true], ['phone', 'الهاتف', 'text'],
  ['rib', 'رقم الحساب البنكي RIB (24 رقما — للدعم الممتد والتعويضات)', 'text', false, 'ltr'],
  ['-', 'معطيات الموسم الدراسي والسبورة المرجعية (اختيارية)'],
  ['cat', 'الفئة', 'sel', false, '', false, [['', 'تلقائي حسب الإطار'], ['admin', 'هيئة الإدارة'], ['teacher', 'هيئة التدريس'], ['assigned', 'أستاذ(ة) مكلف(ة) بالمؤسسة'], ['preschool', 'مربي(ة) التعليم الأولي'], ['other', 'أطر وأعوان آخرون']]],
  ['unit', 'الوحدة المدرسية', 'unit'], ['formation', 'التكوين / لغة التكوين', 'sel', false, '', false, [['', ''], ['مزدوج', 'مزدوج'], ['معرب', 'معرب'], ['مفرنس', 'مفرنس']]],
  ['teachLang', 'لغة التدريس', 'sel', false, '', false, [['', ''], ['عربية', 'عربية'], ['فرنسية', 'فرنسية'], ['مزدوج', 'مزدوج'], ['أمازيغية', 'أمازيغية']]],
  ['status', 'وضعية الأستاذ(ة)', 'sel', false, '', false, [['', ''], ['أصلي', 'أصلي(ة)'], ['مكلف', 'مكلف(ة)'], ['متعاقد', 'متعاقد(ة) / أطر الأكاديمية']]],
  ['levels', 'المستويات / الأقسام المسندة', 'text'], ['alsoAt', 'خدمة بوحدات مدرسية أخرى', 'text', false, '', true], ['position', 'الوضعية الإدارية (إن لم يكن نشيطا)', 'text'], ['dirDate', 'تاريخ الالتحاق بالمديرية', 'date'],
  ['gradeDate', 'تاريخ الدرجة', 'date'], ['echelonDate', 'تاريخ الرتبة', 'date'],
  ['inspScore', 'نقطة التفتيش', 'text'], ['inspDate', 'تاريخ التفتيش', 'date'],
  ['email', 'البريد الإلكتروني', 'text', false, 'ltr'], ['diploma', 'آخر شهادة دراسية', 'text'],
  ['proDiploma', 'آخر شهادة مهنية', 'text'], ['assignDate', 'تاريخ التكليف (للمكلفين)', 'date'],
  ['assignReason', 'أسباب التكليف', 'text'],
  ['-', 'معطيات البطاقة الشخصية للأستاذ(ة) (اختيارية)'],
  ['marital', 'الحالة العائلية', 'sel', false, '', false, [['', ''], ['أعزب', 'أعزب / عزباء'], ['متزوج', 'متزوج(ة)'], ['مطلق', 'مطلق(ة)'], ['أرمل', 'أرمل(ة)']]],
  ['tenure', 'تاريخ الترسيم', 'date'], ['acadDate', 'تاريخ التعيين بالأكاديمية', 'date'],
  ['bac', 'شهادة الباكالوريا (الشعبة)', 'text'], ['bacDate', 'تاريخ الباكالوريا', 'date'],
  ['licence', 'الإجازة (التخصص)', 'text'], ['licDate', 'تاريخ الإجازة', 'date'],
  ['otherCert', 'شواهد أخرى', 'text'], ['otherDate', 'تاريخ الشهادة الأخرى', 'date'],
  ['spec', 'التخصص', 'text'], ['trainCenter', 'مركز التكوين', 'text'], ['gradDate', 'تاريخ التخرج', 'date']
];
let empQuery = '';
let empView = 'table';
function pageEmployees(v) {
  v.innerHTML = `
    <div class="page-h"><h1>لائحة العاملين بالمؤسسة</h1><span class="sub" id="empCount"></span><span class="sp"></span>
      <div class="seg" id="empSeg"><button data-v="table">جدول</button><button data-v="cards">بطاقات بالصور</button></div>
      <button class="btn" id="empCards" title="البطاقة الشخصية للأستاذ(ة) بالصورة">${ic('file')} البطاقات الشخصية</button>
      <button class="btn" id="empGal" title="طباعة بطاقات الموظفين بالصور (عدة بطاقات في الصفحة الواحدة) أو حفظها PDF / Word">${ic('print')} طباعة البطاقات بالصور</button>
      <button class="btn" id="tplCsv" title="نموذج Excel فارغ يملأ ثم يستورد">${ic('down')} نموذج الاستيراد (Excel)</button>
      <button class="btn gold" id="impRH2" title="ملفات XML المصدَّرة من منظومة Esise (معطيات الموارد البشرية)">${ic('up')} استيراد XML (Esise)</button>
      <button class="btn" id="impCsv">${ic('up')} استيراد Excel / CSV</button>
      <button class="btn" id="expCsv">${ic('down')} تصدير Excel</button>
      <button class="btn pri" id="addEmp">${ic('plus')} إضافة موظف</button></div>
    ${agentNote()}
    <div class="card">
      <div class="toolbar"><div class="search">${ic('search')}<input class="inp" id="q" placeholder="بحث بالاسم أو رقم التأجير أو البطاقة..." value="${esc(empQuery)}"></div></div>
      <div id="empTable"></div>
    </div>`;
  const draw = () => {
    const q = empQuery.trim().toLowerCase();
    const list = staffEmps().filter(e => !q || [fullName(e), e.firstFr, e.lastFr, e.ppr, e.cin, e.cadre].join(' ').toLowerCase().includes(q));
    $('#empCount').textContent = `${DB.employees.length} موظف`;
    $$('#empSeg button').forEach(b => b.classList.toggle('on', b.dataset.v === empView));
    if (empView === 'cards') {
      $('#empTable').innerHTML = list.length ? `<div class="emp-cards">${list.map(e => `<div class="emp-c" data-id="${e.id}">
        <div class="emp-ph">${e.photo ? `<img src="${e.photo}" alt="">` : `<span>${esc((window.EmpPhoto ? EmpPhoto.initials(e) : '') || '؟')}</span>`}</div>
        <b>${esc(fullName(e))}</b><small>${esc(e.cadre || e.task || '')}</small>
        <div class="emp-ca"><button class="btn sm" data-a="card">البطاقة</button><button class="btn sm" data-a="edit">${ic('edit')}</button></div></div>`).join('')}</div>` : `<div class="empty-state">لا توجد نتائج مطابقة</div>`;
      $$('#empTable .emp-c').forEach(c => { const e = empById(c.dataset.id);
        $$('[data-a]', c).forEach(b => b.onclick = ev => { ev.stopPropagation(); if (b.dataset.a === 'edit') empForm(e, draw); else go('empCard', { empId: e.id }); });
        c.ondblclick = () => empProfile(e); });
      return;
    }
    $('#empTable').innerHTML = list.length ? `<table class="tbl"><thead><tr><th style="width:40px">#</th><th>الاسم الكامل</th><th>رقم التأجير</th><th>الإطار</th><th>الدرجة</th><th>المهمة</th><th>الهاتف</th><th></th></tr></thead><tbody>
      ${list.map((e, i) => `<tr data-id="${e.id}">
        <td class="muted num">${i + 1}</td>
        <td class="name-cell"><b>${esc(fullName(e))}</b><small dir="ltr">${esc(`${e.lastFr || ''} ${e.firstFr || ''}`)}</small></td>
        <td class="num">${esc(e.ppr)}</td><td>${esc(e.cadre)}</td><td>${esc(e.grade)}</td><td>${esc(e.task)}</td><td class="num" dir="ltr" style="text-align:right">${esc(e.phone)}</td>
        <td class="act"><button class="btn sm" data-a="view">الملف</button> <button class="btn sm" data-a="card" title="البطاقة الشخصية">${ic('file')}</button> <button class="btn sm" data-a="edit">${ic('edit')} تعديل</button> <button class="btn sm danger icon" data-a="del" title="حذف">${ic('trash')}</button></td></tr>`).join('')}
      </tbody></table>` : `<div class="empty-state">${DB.employees.length ? 'لا توجد نتائج مطابقة' : 'لا يوجد موظفون بعد. استورد ملف agent المحمل من موقع تبليغ (Source DRH)، أو أضف موظفا، أو استورد لائحة من Excel.'}</div>`;
    $$('#empTable tr[data-id]').forEach(tr => {
      const e = empById(tr.dataset.id);
      $$('[data-a]', tr).forEach(b => b.onclick = ev => {
        ev.stopPropagation();
        if (b.dataset.a === 'edit') empForm(e, draw);
        if (b.dataset.a === 'view') empProfile(e);
        if (b.dataset.a === 'card') go('empCard', { empId: e.id });
        if (b.dataset.a === 'del') delEmp(e, draw);
      });
      tr.ondblclick = () => empProfile(e);
    });
  };
  draw();
  $('#q').oninput = e => { empQuery = e.target.value; draw(); };
  $('#addEmp').onclick = () => empForm(null, draw);
  $$('#empSeg button').forEach(b => b.onclick = () => { empView = b.dataset.v; draw(); });
  $('#empCards').onclick = () => go('empCard', { all: true });
  $('#empGal').onclick = () => go('empGallery', { q: empQuery });
  $('#expCsv').onclick = exportCsv;
  $('#impCsv').onclick = () => importCsv(draw);
  $('#tplCsv').onclick = downloadTemplate;
  $('#impAgent').onclick = () => importAgent(draw);
  $('#impRH').onclick = () => importRH(draw);
  $('#impRH2').onclick = () => importRH(draw);
}
async function delEmp(e, after) {
  const n = DB.records.filter(r => r.empId === e.id).length;
  if (!await confirmBox(`حذف الموظف <b>${esc(fullName(e))}</b>؟${n ? `<br><span class="muted">سيبقى سجله (${n}) محفوظا في السجل.</span>` : ''}`, 'حذف')) return;
  DB.employees = DB.employees.filter(x => x.id !== e.id);
  persist(); after(); toast('تم حذف الموظف');
}
function empForm(e, after) {
  const isNew = !e;
  const data = Object.assign({}, e || {});
  const body = document.createElement('div');
  body.innerHTML = `<div class="emp-phrow"><div class="emp-ph big" id="efPh"></div><div class="btn-row"><button class="btn sm" id="efPick">${ic('up')} صورة الموظف(ة)</button><button class="btn sm danger" id="efDel" type="button">${ic('trash')} حذف الصورة</button></div></div>
    <div class="fgrid">${EMP_FIELDS.filter(f0 => !(isSingleOrg() && (f0[0] === 'unit' || f0[0] === 'alsoAt'))).map(f0 => (f0[0] === 'cat' ? f0.slice(0, 6).concat([noPre(f0[6])]) : f0)).map(([k, l, t, req, dir, full, opts]) => k === '-' ? `<div class="fld-sep">${l}</div>` : `
    <div class="fld ${full ? 'full' : ''}"><label>${l}${req ? ' <span style="color:var(--red)">*</span>' : ''}</label>
    ${t === 'sex' ? `<select class="inp" data-k="${k}"><option value=""></option><option value="M" ${data[k] === 'M' ? 'selected' : ''}>ذكر</option><option value="F" ${data[k] === 'F' ? 'selected' : ''}>أنثى</option></select>`
      : t === 'sel' ? `<select class="inp" data-k="${k}">${opts.map(([v, lb]) => `<option value="${esc(v)}" ${String(data[k] || '') === v ? 'selected' : ''}>${esc(lb)}</option>`).join('')}</select>`
      : t === 'unit' ? (window.K && K.unitSelect ? K.unitSelect(`data-k="${k}"`, data[k] || '', { empty: '— بدون —' }) : `<input class="inp" data-k="${k}" value="${esc(data[k] || '')}">`)
      : `<input class="inp" data-k="${k}" type="${t}" ${dir ? `dir="${dir}"` : ''} value="${esc(data[k] || '')}">`}</div>`).join('')}</div>
    ${window.K ? K.dl('empUnits', K.U.names()) : ''}`;
  const drawPh = () => { $('#efPh', body).innerHTML = data.photo ? `<img src="${data.photo}" alt="">` : '<span>صورة</span>'; $('#efDel', body).style.display = data.photo ? '' : 'none'; };
  drawPh();
  $('#efPick', body).onclick = async () => { const p = window.EmpPhoto && await EmpPhoto.pick(); if (p) { data.photo = p; drawPh(); } };
  $('#efDel', body).onclick = () => { delete data.photo; drawPh(); };
  modal({ title: isNew ? 'إضافة موظف' : 'تعديل معطيات الموظف', body,
    actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
      $$('[data-k]', body).forEach(i => { data[i.dataset.k] = i.value.trim(); });
      if (!data.firstAr || !data.lastAr || !data.ppr) { toast('المرجو ملء الاسم ورقم التأجير', true); return false; }
      const dup = DB.employees.find(x => x.ppr === data.ppr && x.id !== data.id);
      if (dup) { toast('رقم التأجير مستعمل لموظف آخر: ' + fullName(dup), true); return false; }
      if (isNew) { data.id = uid('e'); DB.employees.push(data); } else Object.assign(e, data);
      persist(); after && after(); toast(isNew ? 'تمت إضافة الموظف' : 'تم حفظ التعديلات');
    } }, { label: 'إلغاء' }] });
}
function empProfile(e) {
  const recs = DB.records.filter(r => r.empId === e.id).sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
  const y = new Date().getFullYear();
  const ab = absenceEntries().filter(a => a.rec.empId === e.id);
  const daysYear = ab.reduce((s, a) => { const o = overlap(a.from, a.to, `${y}-01-01`, `${y}-12-31`); return s + (o ? o.days : 0); }, 0);
  const f = (l, val) => `<div><span>${l}:</span> <bdi>${esc(val || '—')}</bdi></div>`;
  const body = `
    <div class="prof">${f('رقم التأجير', e.ppr)}${f('البطاقة الوطنية', e.cin)}${f('الإطار', e.cadre)}${f('الدرجة', e.grade)}${f('المهمة', e.task)}${f('مادة التدريس', e.subject)}
      ${f('تاريخ الازدياد', fmtDate(e.birth))}${f('تاريخ التوظيف', fmtDate(e.hire))}${e.affDate ? f('تاريخ التعيين بالمؤسسة', fmtDate(e.affDate)) : ''}${e.asgFrom || e.asgTo ? f('تاريخ التكليف بالمؤسسة', `من ${e.asgFrom ? fmtDate(e.asgFrom) : '....'} إلى ${e.asgTo ? fmtDate(e.asgTo) : '....'}`) : ''}${f('الهاتف', e.phone)}${e.unit && !isSecCycle() ? f('الوحدة المدرسية', e.unit) : ''}${e.formation ? f('التكوين', e.formation) : ''}${e.teachLang ? f('لغة التدريس', e.teachLang) : ''}${e.levels ? f('المستويات المسندة', e.levels) : ''}${e.email ? f('البريد الإلكتروني', e.email) : ''}</div>
    <div class="prof" style="grid-template-columns:1fr">${f('العنوان', e.address)}</div>
    <div class="kpis" style="margin:12px 0"><div>أيام الغياب سنة ${y}: <b>${daysYear}</b></div><div>عدد الوثائق: <b>${recs.length}</b></div></div>
    ${recs.length ? `<table class="tbl"><thead><tr><th>الوثيقة</th><th>الفترة</th><th>التاريخ</th></tr></thead><tbody>${recs.map(r => `<tr><td><span class="tag ${r.type}">${esc(typeTitle(r.type))}</span></td>
      <td class="num">${r.f && r.f.from ? `${fmtDate(r.f.from)} ← ${fmtDate(r.f.to)}` : '—'}</td><td class="num muted">${fmtDate((r.updated || '').slice(0, 10))}</td></tr>`).join('')}</tbody></table>` : '<div class="muted">لا توجد وثائق لهذا الموظف بعد.</div>'}
    <div class="btn-row" style="margin-top:14px">${Object.entries(TYPES).filter(([, t]) => !t.noEmp && !t.hidden).map(([k, t]) => `<button class="btn sm" data-doc="${k}">${t.icon} ${t.title}</button>`).join('')}</div>`;
  const m = modal({ title: esc(fullName(e)), body, actions: [{ label: 'إغلاق' }] });
  $$('[data-doc]', m.el).forEach(b => b.onclick = () => { m.close(); go('editor', { type: b.dataset.doc, empId: e.id }); });
}

/* CSV */
const CSV_COLS = [['firstAr', 'الاسم'], ['lastAr', 'النسب'], ['lastFr', 'Nom'], ['firstFr', 'Prénom'], ['ppr', 'رقم التأجير'], ['cin', 'رقم البطاقة'],
  ['birth', 'تاريخ الازدياد'], ['hire', 'تاريخ التوظيف'], ['cadre', 'الإطار'], ['grade', 'الدرجة'], ['scale', 'السلم'], ['echelon', 'الرتبة'], ['index', 'الرقم الاستدلالي'], ['birthPlace', 'مكان الازدياد'], ['task', 'المهمة'], ['subject', 'مادة التدريس'],
  ['origin', 'مقر العمل الأصلي'], ['assigned', 'مؤسسة التكليف'], ['address', 'العنوان الشخصي'], ['phone', 'الهاتف'], ['cadreFr', 'الإطار بالفرنسية'], ['affDate', 'تاريخ التعيين بالمؤسسة'], ['asgFrom', 'تاريخ التكليف من'], ['asgTo', 'تاريخ التكليف إلى'],
  ['unit', 'الوحدة المدرسية'], ['formation', 'التكوين'], ['teachLang', 'لغة التدريس'], ['levels', 'المستويات المسندة'], ['dirDate', 'تاريخ الالتحاق بالمديرية'],
  ['gradeDate', 'تاريخ الدرجة'], ['echelonDate', 'تاريخ الرتبة'], ['inspScore', 'نقطة التفتيش'], ['inspDate', 'تاريخ التفتيش'], ['email', 'البريد الإلكتروني'], ['sex', 'الجنس (M/F)']];
const XL_WIDTHS = [6, 16, 16, 16, 16, 14, 12, 14, 14, 24, 16, 8, 8, 12, 16, 16, 18, 24, 24, 28, 14, 26, 16, 14, 14, 18, 12, 12, 16, 16, 14, 14, 12, 14, 26, 10];
const DATE_KEYS = ['birth', 'hire', 'affDate', 'asgFrom', 'asgTo', 'dirDate', 'gradeDate', 'echelonDate', 'inspDate'];
// collège / lycée: one institution — no «الوحدة المدرسية» column in the export / import model
const csvCols = () => isSingleOrg() ? CSV_COLS.filter(c => c[0] !== 'unit') : CSV_COLS;
const xlWidths = () => isSingleOrg() ? XL_WIDTHS.filter((w, i) => i !== CSV_COLS.findIndex(c => c[0] === 'unit') + 1) : XL_WIDTHS;
async function exportCsv() {
  const rows = [['ر.ت'].concat(csvCols().map(c => c[1]))].concat(staffEmps().map((e, i) => [String(i + 1)].concat(csvCols().map(([k]) => DATE_KEYS.includes(k) ? fmtDate(e[k]) : (e[k] == null ? '' : String(e[k]))))));
  const r = await window.api.saveXlsx(rows, 'لائحة_الموظفين.xlsx', 'الموظفون', xlWidths());
  if (r.ok) toast('تم تصدير اللائحة إلى Excel');
}
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const sep = (first.match(/;/g) || []).length >= (first.match(/,/g) || []).length ? ';' : ',';
  const rows = []; let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += c; }
    else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter(r => r.some(x => x.trim()));
}
const normDate = s => {
  s = String(s == null ? '' : s).trim(); if (!s) return '';
  if (/^\d+(\.\d+)?$/.test(s) && +s > 1000 && +s < 80000) { // Excel serial date
    const d = new Date(Math.round((+s - 25569) * 86400000)); return d.toISOString().slice(0, 10);
  }
  let m = /^(\d{1,2})[/.\- ](\d{1,2})[/.\- ](\d{2,4})$/.exec(s);
  if (m) { let y = m[3]; if (y.length === 2) y = (+y > 30 ? '19' : '20') + y; return `${y}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`; }
  m = /^(\d{4})[/.\-](\d{1,2})[/.\-](\d{1,2})/.exec(s);
  return m ? `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}` : s;
};
// tolerant header matching: ignores spaces, diacritics, hamza forms, case, punctuation
const normHead = h => String(h || '').toLowerCase().normalize('NFD').replace(/[̀-ًͯ-ٟـ]/g, '')
  .replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/[^a-z0-9ء-ي]/g, '');
const CSV_ALIASES = {
  firstAr: ['الاسم الشخصي', 'الإسم', 'الاسم بالعربية'], lastAr: ['الاسم العائلي', 'النسب بالعربية'],
  lastFr: ['NOM', 'Nom de famille'], firstFr: ['PRENOM', 'Prénoms'],
  ppr: ['رقم التأجير (الرقم المالي)', 'الرقم المالي', 'PPR', 'Matricule', 'DRPP', 'Som'], sex: ['الجنس', 'Sexe'], email: ['Email', 'البريد الالكتروني'], cin: ['رقم البطاقة الوطنية', 'ب.و', 'CIN', 'CNIE'],
  birth: ['تاريخ الولادة', 'تاريخ الإزدياد', 'Date de naissance'], hire: ['تاريخ التعيين', 'Date de recrutement'],
  cadre: ['Cadre'], grade: ['Grade'], scale: ['Echelle'], echelon: ['Echelon'], index: ['الرقم الإستدلالي', 'Indice'],
  birthPlace: ['مكان الولادة', 'Lieu de naissance'], task: ['Fonction'], subject: ['المادة', 'Matière'],
  origin: ['مقر العمل', 'المؤسسة الأصلية'], assigned: ['مؤسسة التعيين'], address: ['العنوان', 'Adresse'], phone: ['رقم الهاتف', 'Téléphone', 'Tel'],
  cadreFr: ['Cadre (FR)', 'Cadre FR', 'الإطار (بالفرنسية)']
};
const csvKeyOf = h => { const n = normHead(h); if (!n) return null;
  for (const [k, l] of CSV_COLS) if (normHead(l) === n || (CSV_ALIASES[k] || []).some(a => normHead(a) === n)) return k; return null; };
function parseCsv(text) {
  text = text.replace(/^﻿/, '');
  const first = text.split(/\r?\n/)[0] || '';
  const cnt = ch => (first.match(new RegExp(ch, 'g')) || []).length;
  const sep = cnt('\t') > cnt(';') && cnt('\t') > cnt(',') ? '\t' : cnt(';') >= cnt(',') ? ';' : ',';
  const rows = []; let row = [], cell = '', inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) { if (c === '"') { if (text[i + 1] === '"') { cell += '"'; i++; } else inQ = false; } else cell += c; }
    else if (c === '"') inQ = true;
    else if (c === sep) { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows;
}
async function downloadTemplate() {
  const save = async filled => {
    const rows = [['ر.ت'].concat(csvCols().map(c => c[1]))];
    if (filled) staffEmps().forEach((e, i) => rows.push([String(i + 1)].concat(csvCols().map(([k]) => DATE_KEYS.includes(k) ? fmtDate(e[k]) : (e[k] == null ? '' : String(e[k]))))));
    const upTo = Math.max(50, rows.length + 9);
    for (let i = rows.length; i <= upTo; i++) rows.push([String(i)].concat(csvCols().map(() => '')));
    const r = await window.api.saveXlsx(rows, filled ? 'لائحة_الموظفين_للاستكمال.xlsx' : 'نموذج_استيراد_الموظفين.xlsx', 'الموظفون', xlWidths());
    if (r.ok) toast(filled ? 'تم حفظ اللائحة (Excel): أكمل الخانات الناقصة (الدرجة، السلم، الرتبة...) ثم استوردها' : 'تم حفظ النموذج (Excel). املأه ثم احفظه كما هو بصيغة xlsx واستورده');
  };
  if (!DB.employees.length) return save(false);
  modal({ title: 'نموذج الاستيراد (Excel)', size: 'sm', body: `<p style="margin:0;line-height:1.9">يمكنك تحميل النموذج مملوءا بموظفيك الحاليين (${DB.employees.length})، مثلا بعد استيراد ملف agent من تبليغ،
    لتكمل فيه المعلومات الناقصة (الدرجة، السلم، الرتبة، الرقم الاستدلالي، الهاتف...) ثم تستورده: يتعرف البرنامج على كل موظف برقم التأجير ويستكمل معلوماته.</p>`,
    actions: [{ label: ic('down') + ' نموذج مملوء بالموظفين', cls: 'pri', onClick: () => { save(true); } }, { label: 'نموذج فارغ', onClick: () => { save(false); } }] });
}
// employee list (template / export / any sheet with known titles) -> { list:[{...employee fields}], skipped } | { error }
function parseEmpList(rows) {
  let hi = -1, map = [];
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const m = (rows[i] || []).map(csvKeyOf);
    if (m.filter(Boolean).length >= 2) { hi = i; map = m; break; }
  }
  if (hi < 0) return { error: 'head' };
  if (!map.some(k => k === 'firstAr' || k === 'lastAr' || k === 'lastFr' || k === 'ppr')) return { error: 'cols' };
  const list = []; let skipped = 0;
  rows.slice(hi + 1).forEach(r => {
    const o = {};
    map.forEach((k, i) => { const x = String((r || [])[i] == null ? '' : r[i]).trim(); if (k && x) o[k] = x; });
    if (!o.firstAr && !o.lastAr && !o.lastFr && !o.firstFr && !o.ppr) { if (Object.keys(o).length) skipped++; return; }
    DATE_KEYS.forEach(k => { if (o[k]) o[k] = normDate(o[k]); });
    ['ppr', 'cin', 'index', 'scale', 'echelon'].forEach(k => { if (o[k] && /^\d+\.0+$/.test(o[k])) o[k] = o[k].replace(/\.0+$/, ''); });
    if (o.cin) o.cin = o.cin.toUpperCase().replace(/\s+/g, '');
    if (o.phone) { o.phone = o.phone.replace(/\.0+$/, ''); if (/^[5-7]\d{8}$/.test(o.phone)) o.phone = '0' + o.phone; }
    list.push(o);
  });
  return { list, skipped };
}
// the same person in a list: رقم التأجير، ثم البطاقة، ثم الاسم الكامل (بالعربية أو بالفرنسية، بأي ترتيب)
const pprKey = v => String(v || '').trim().replace(/\.0+$/, '').replace(/^0+/, '');
const nameKeys = (a, b) => { const x = normHead(a), y = normHead(b); return x || y ? [x + y, y + x] : []; };
function findEmpIn(arr, o) {
  const p = pprKey(o.ppr), c = String(o.cin || '').toUpperCase().replace(/\s+/g, '');
  let m = p && arr.find(e => pprKey(e.ppr) === p);
  if (!m && c) m = arr.find(e => e.cin && String(e.cin).toUpperCase().replace(/\s+/g, '') === c);
  const free = e => !p || !e.ppr || pprKey(e.ppr) === p; // never pair two different PPR
  if (!m) { const k = nameKeys(o.firstAr, o.lastAr); if (k.length) m = arr.find(e => free(e) && k.includes(nameKeys(e.firstAr, e.lastAr)[0])); }
  if (!m) { const k = nameKeys(o.firstFr, o.lastFr); if (k.length && k[0].length > 3) m = arr.find(e => free(e) && k.includes(nameKeys(e.firstFr, e.lastFr)[0])); }
  return m || null;
}
// complete employee e with list row o (o wins, but a lone name cell never splits an existing full name)
function completeEmp(e, o, keepKeys) {
  const keys = [];
  [['firstAr', 'lastAr'], ['firstFr', 'lastFr']].forEach(([a, b]) => {
    if ((o[a] && o[b]) || (!e[a] && !e[b])) [a, b].forEach(k => { if (o[k] && o[k] !== e[k]) { e[k] = o[k]; keys.push(k); } });
  });
  Object.entries(o).forEach(([k, v]) => {
    if (!v || /^(first|last)(Ar|Fr)$/.test(k) || k === 'id' || (keepKeys && keepKeys.includes(k) && e[k])) return;
    if (e[k] !== v) { e[k] = v; keys.push(k); }
  });
  return keys;
}
// 1.9.3 — one or several files (Excel / CSV): an agent file among them opens the Tabligh dialog, the others complete it
const cleanRows = rs => (rs || []).map(r => (r || []).map(x => String(x == null ? '' : x).trim()));
const sheetsOf = f => f.sheets || (f.text != null ? [{ name: f.name, rows: parseCsv(f.text) }] : (f.rows ? [{ name: f.name, rows: f.rows }] : []));
const garbled = rows => { const flat = rows.slice(0, 20).map(r => r.join(' ')).join(' '); return (flat.match(/\?{3,}/g) || []).length >= 3 && !/[\u0600-\u06FF]/.test(flat); };
async function importCsv(after) {
  if (!window.api.openTables) return importCsvOne(after);
  const res = await window.api.openTables({ csv: true });
  if (!res) return;
  const locked = res.locked || [], bad = (res.errors || []).filter(n => !locked.includes(n)), files = res.files || [];
  if (locked.length) toast('ملف xls محمي بكلمة سر (احفظ نسخة منه بدون كلمة سر ثم أعد المحاولة): ' + locked.join('، '), true);
  if (!files.length) { if (!locked.length) toast(bad.length ? 'تعذرت قراءة الملفات المختارة: ' + bad.join('، ') : 'تعذرت قراءة الملفات المختارة', true); return; }
  if (window.Agent && files.some(f => sheetsOf(f).some(sh => Agent.isAgent(cleanRows(sh.rows))))) {   // agent file(s) from Tabligh (+ Excel lists to complete it)
    const F = await readAgentFiles(false, res);
    if (F.agents.length) { if (F.bad.length) toast('تعذرت قراءة: ' + F.bad.join('، '), true); return agentDialog(F.agents[0].rows, F.agents[0].name, after, F.lists); }
  }
  let added = 0, updated = 0, skipped = 0, nOk = 0, mojibake = false;
  const fail = [];
  files.forEach(f => {
    const sheets = sheetsOf(f).map(sh => cleanRows(sh.rows)).filter(rs => rs.length);
    if (!sheets.length) { fail.push([f.name, 'empty']); return; }
    if (sheets.every(garbled)) { mojibake = true; fail.push([f.name, 'garbled']); return; }
    let P = null, err = '';
    for (const rs of sheets) { const x = parseEmpList(rs); if (!x.error) { P = x; break; } err = err === 'head' ? err : x.error; }
    if (!P) { fail.push([f.name, err]); return; }
    let a1 = 0, u1 = 0;
    P.list.forEach(o => {
      const ex = findEmpIn(DB.employees, o);
      if (ex) { completeEmp(ex, o); u1++; } else { o.id = uid('e'); DB.employees.push(o); a1++; }
    });
    if (!a1 && !u1) { fail.push([f.name, 'none']); return; }
    added += a1; updated += u1; skipped += P.skipped || 0; nOk++;
  });
  if (!nOk) {
    if (mojibake && fail.length === files.length) { await confirmBox('تعذرت قراءة الحروف العربية في هذا الملف: عند حفظه في Excel بصيغة CSV تم تعويض الحروف العربية بعلامات استفهام (؟) ولا يمكن استرجاعها.<br><br><b>الحل:</b> حمّل «نموذج الاستيراد (Excel)» من هذه الصفحة، املأه، ثم احفظه بصيغة <b>xlsx</b> (Classeur Excel) وأعد الاستيراد.', 'حسنا', false); return; }
    const one = fail.length === 1 ? fail[0][1] : '';
    toast(one === 'head' ? 'لم يتم العثور على رؤوس الأعمدة (الاسم، النسب، رقم التأجير...). استعمل نموذج الاستيراد.'
      : one === 'none' ? 'لم يتم العثور على أي موظف في الملف. تأكد من ملء الاسم والنسب أو رقم التأجير.'
      : fail.length > 1 ? 'لم يتم العثور على أي موظف في الملفات المختارة: ' + fail.map(x => x[0]).join('، ') : 'يجب أن يحتوي الملف على عمود الاسم أو النسب أو رقم التأجير', true);
    return;
  }
  persist(); after();
  toast(`تمت إضافة ${added} موظف واستكمال/تحديث معلومات ${updated} موظف${files.length > 1 ? ` من ${nOk === 2 ? 'ملفين' : nOk >= 3 && nOk <= 10 ? nOk + ' ملفات' : nOk + ' ملفا'}` : ''}${skipped ? ` (تم تجاهل ${skipped} سطر بدون اسم)` : ''}${fail.length ? ` — ملفات لم تُستورد: ${fail.map(x => x[0]).join('، ')}` : ''}`, fail.length > 0);
}
// single-file fallback (older preload without openTables)
async function importCsvOne(after) {
  const res = window.api.openTable ? await window.api.openTable() : { text: await window.api.openText(['csv', 'txt'], 'CSV') };
  if (!res || (res.text == null && !res.rows && !res.error)) return;
  if (res.error === 'xls') { toast('صيغة xls القديمة غير مدعومة. احفظ الملف في Excel بصيغة xlsx أو CSV ثم أعد المحاولة.', true); return; }
  if (res.error) { toast('تعذرت قراءة ملف Excel', true); return; }
  const rows = cleanRows(res.rows || parseCsv(res.text));
  if (window.Agent && Agent.isAgent(rows)) return agentDialog(rows, res.name, after); // ملف agent من تبليغ
  if (garbled(rows)) {
    await confirmBox('تعذرت قراءة الحروف العربية في هذا الملف: عند حفظه في Excel بصيغة CSV تم تعويض الحروف العربية بعلامات استفهام (؟) ولا يمكن استرجاعها.<br><br><b>الحل:</b> حمّل «نموذج الاستيراد (Excel)» من هذه الصفحة، املأه، ثم احفظه بصيغة <b>xlsx</b> (Classeur Excel) وأعد الاستيراد.', 'حسنا', false);
    return;
  }
  const P = parseEmpList(rows);
  if (P.error === 'head') { toast('لم يتم العثور على رؤوس الأعمدة (الاسم، النسب، رقم التأجير...). استعمل نموذج الاستيراد.', true); return; }
  if (P.error) { toast('يجب أن يحتوي الملف على عمود الاسم أو النسب أو رقم التأجير', true); return; }
  let added = 0, updated = 0;
  P.list.forEach(o => {
    const ex = findEmpIn(DB.employees, o);
    if (ex) { completeEmp(ex, o); updated++; } else { o.id = uid('e'); DB.employees.push(o); added++; }
  });
  if (!added && !updated) { toast('لم يتم العثور على أي موظف في الملف. تأكد من ملء الاسم والنسب أو رقم التأجير.', true); return; }
  persist(); after(); toast(`تمت إضافة ${added} موظف واستكمال/تحديث معلومات ${updated} موظف${P.skipped ? ` (تم تجاهل ${P.skipped} سطر بدون اسم)` : ''}`);
}

/* ---- ملف agent من منصة تبليغ (Téléchargement de données > Source DRH) ---- */
const AGENT_PATH = `<span class="path" dir="ltr">Téléchargement de données</span> ← <span class="path" dir="ltr">Source DRH</span> ← <span class="path" dir="ltr">agent</span>`;
function agentNote() {
  const last = DB.settings.agentLast;
  return `<div class="card agent-note"><div class="ic">${ic('inbox')}</div><div class="tx"><b>استيراد الموظفين من منصة «تبليغ»:</b> حمّل ملف <b dir="ltr">agent</b> من موقع تبليغ عبر
    ${AGENT_PATH}، ثم اضغط «استيراد ملف agent» واختر الملف كما هو (Excel).
    <b>لاستكمال المعلومات بين الملفين</b> اختر معه لائحة الموظفين (نموذج الاستيراد Excel): يأخذ البرنامج من agent الأسماء ورقم التأجير والبطاقة وتاريخ الازدياد والتعيين،
    ومن لائحة Excel الدرجة والسلم والرتبة والرقم الاستدلالي والهاتف وباقي المعلومات. يُحدَّث الموظفون الموجودون حسب رقم التأجير دون حذف معطياتهم.
    ${last ? `<div class="muted" style="font-size:12px">آخر استيراد: ${fmtDate(last.date)}${last.file ? ` — <bdi>${esc(last.file)}</bdi>` : ''}</div>` : ''}</div>
    <button class="btn gold" id="impAgent">${ic('up')} استيراد ملف agent (تبليغ)</button></div>
  <div class="card agent-note"><div class="ic">${ic('inbox')}</div><div class="tx"><b>استيراد معطيات الموارد البشرية (XML) من منظومة <bdi dir="ltr">Esise</bdi>:</b> من منظومة <bdi dir="ltr">Esise</bdi> افتح
    <span class="path" dir="ltr">Accueil</span> ← <span class="path" dir="ltr">Module RH</span> ← <span class="path" dir="ltr">Export</span>${isSingleOrg() ? '' : ' لكل وحدة مدرسية'}، فيُنتج ملفا باسم رمز GRESA والتاريخ (مثل <bdi dir="ltr">04975G_20261009.xml</bdi>).
    اضغط «استيراد XML (Esise)» واختر ${isSingleOrg() ? 'ملف المؤسسة' : 'ملفات كل الوحدات دفعة واحدة'}: يستخرج البرنامج الاسم بالعربية والفرنسية، رقم التأجير والبطاقة الوطنية، تاريخ ومكان الازدياد، الإطار والدرجة والرتبة وتواريخها، المهمة، المستويات ولغة التدريس،
    الشهادات، الحالة العائلية، الهاتف والبريد والعنوان، ${isSingleOrg() ? 'ويضمها إلى لائحة موظفي المؤسسة.' : 'ويربط كل موظف بوحدته المدرسية حسب رمز GRESA.'} لا يُحذف أي موظف ولا أي معطى أدخلتَه. القراءة محلية تماما دون أي اتصال بالإنترنت.
    ${DB.settings.rhLast ? `<div class="muted" style="font-size:12px">آخر استيراد: ${fmtDate(DB.settings.rhLast.date)} — ${esc(String(DB.settings.rhLast.n))} موظف من ${esc(String(DB.settings.rhLast.files))} ملف</div>` : ''}</div>
    <button class="btn gold" id="impRH" title="ملفات XML المصدَّرة من منظومة Esise">${ic('up')} استيراد XML (Esise)</button></div>`;
}
// read one or several files (agent + Excel lists) -> { agents:[{name, rows}], lists:[{name, list}], bad:[names] }
async function readAgentFiles(listsOnly, pre) {
  const res = pre || (window.api.openTables ? await window.api.openTables({ csv: true }) : null);
  if (!res || !res.files) return null;
  const out = { agents: [], lists: [], bad: (res.errors || []).slice() };
  res.files.forEach(f => {
    const sheets = f.sheets || (f.text != null ? [{ name: f.name, rows: parseCsv(f.text) }] : []);
    const clean = rs => (rs || []).map(r => (r || []).map(x => String(x == null ? '' : x).trim()));
    const ag = sheets.find(sh => Agent.isAgent(clean(sh.rows)));
    if (ag && !listsOnly) { out.agents.push({ name: f.name, rows: clean(ag.rows) }); return; }
    const lst = sheets.map(sh => parseEmpList(clean(sh.rows))).find(x => x.list && x.list.length);
    if (lst) out.lists.push({ name: f.name, list: lst.list }); else out.bad.push(f.name);
  });
  return out;
}
const notAgentMsg = () => confirmBox(`لم يتم العثور على ملف <b dir="ltr">agent</b> (أعمدة <span dir="ltr">COD_AG / NOM_AR / PRENOM_AR</span>) ضمن الملفات المختارة.<br><br>
  حمّل الملف من موقع تبليغ عبر: ${AGENT_PATH}، ثم اختره كما هو دون تعديل (يمكنك اختيار لائحة الموظفين Excel معه في نفس الوقت).
  <br><span class="muted">لاستيراد لائحة Excel وحدها استعمل زر «استيراد Excel / CSV».</span>`, 'حسنا', false);
async function importRH(after) {
  const res = window.api.openXml ? await window.api.openXml() : null;
  if (!res || !res.files) return;
  if (!res.files.length) { toast('تعذرت قراءة الملفات المختارة', true); return; }
  const P = RH.build(res.files);
  const bad = (res.errors || []).concat(P.bad || []);
  if (!P.people.length) { await confirmBox(`لم يتم العثور على موظفين في الملفات المختارة.<br>اختر ملفات <b dir="ltr">XML</b> المصدَّرة من منظومة <bdi dir="ltr">Esise</bdi> عبر <span dir="ltr">Accueil ← Module RH ← Export</span> (اسم الملف مثل <bdi dir="ltr">04975G_20261009.xml</bdi>).${bad.length ? `<br><span class="muted">ملفات غير صالحة: ${esc(bad.join('، '))}</span>` : ''}`, 'حسنا', false); return; }
  if (bad.length) toast('ملفات غير صالحة تم تجاهلها: ' + bad.join('، '), true);
  agentDialog(null, res.files.map(f => f.name).join(' + '), after, [], P, res.files.length);
}
async function importAgent(after) {
  const F = await readAgentFiles();
  if (!F) return;
  if (!F.agents.length) { await notAgentMsg(); return; }
  if (F.bad.length) toast('تعذرت قراءة: ' + F.bad.join('، '), true);
  agentDialog(F.agents[0].rows, F.agents[0].name, after, F.lists);
}
const AGENT_KEEP = ['ppr', 'cin', 'birth', 'affDate']; // official DRH data: agent wins over the Excel list
// official data of the HR system (XML): wins over the Excel list; «تعويض» also replaces what is already in the application
const RH_KEEP = ['ppr', 'cin', 'birth', 'birthPlace', 'hire', 'tenure', 'affDate', 'dirDate', 'acadDate', 'cadre', 'cadreFr', 'grade', 'echelon', 'gradeDate', 'echelonDate', 'diploma', 'proDiploma', 'gradDate', 'trainCenter', 'marital', 'position'];
function agentDialog(rows, fileName, after, lists, pre, nFiles) {
  lists = lists || [];
  const P = pre || Agent.parse(rows, { today: todayIso() });
  const rh = !!(P && P.kind === 'rh');
  if (!P || !P.people.length) { toast(rh ? 'لم يتم العثور على أي موظف في ملفات Esise' : 'لم يتم العثور على أي موظف في ملف agent', true); return; }
  const items = P.people.map((p, i) => Object.assign({}, p, { i, e: Object.assign({}, p.e), on: !p.left, src: rh ? 'rh' : 'agent', xl: [] }));
  // unit of each GRESA code (XML): found in the units register, or chosen below
  const unitMap = {};
  const SECI = isSingleOrg();                       // collège / lycée: one institution — no school units to link
  if (!SECI) (P.codes || []).forEach(c => { const u = window.Units && Units.byGresa(c.code); unitMap[c.code] = u ? u.name : ''; });
  const unitOf = it => unitMap[it.unitCode] || '';
  // complete with the Excel list(s): same person by PPR / CIN / name; persons only in the list are added
  let xlOnly = 0, xlMatched = 0;
  lists.forEach(L => L.list.forEach(o => {
    const hit = findEmpIn(items.map(x => x.e), o);
    const it = hit && items.find(x => x.e === hit);
    if (it) {
      const inferredFr = it.e.cadreFr && !it.raw.cadreFr;
      it.xl = it.xl.concat(completeEmp(it.e, o, rh ? RH_KEEP : AGENT_KEEP));
      if (o.cadre && !o.cadreFr && inferredFr && !/أستاذ|استاذ/.test(o.cadre)) delete it.e.cadreFr;
      if (o.firstAr && o.lastAr) it.sure = true;
      it.src = 'both'; xlMatched++;
    } else {
      items.push({ i: items.length, e: Object.assign({}, o), on: true, src: 'excel', xl: Object.keys(o), sure: !!(o.firstAr && o.lastAr), left: '', raw: {} }); xlOnly++;
    }
  }));
  items.forEach(x => { x.ex = findEmpIn(DB.employees, x.e); });
  const cur = items.filter(x => !x.left), gone = items.filter(x => x.left);
  const inst = curInst();
  const instFill = [['school', 'اسم المؤسسة'], ['gresa', 'رمز المؤسسة (GRESA)'], ['commune', 'الجماعة'], ['city', 'حرر ب'], ['schoolFr', 'اسم المؤسسة بالفرنسية'],
    ['cityFr', 'المدينة بالفرنسية'], ['directorateFr', 'المديرية بالفرنسية']].filter(([k]) => !inst[k] && P.inst[k]);
  const body = document.createElement('div');
  const srcTag = it => it.src === 'rh' ? '' : it.src === 'both' ? '<span class="tag certificate" title="معلومات مكملة من لائحة Excel">agent + Excel</span>' : it.src === 'excel' ? '<span class="tag absence">لائحة Excel فقط</span>' : '';
  const stTag = it => (it.left ? `<span class="tag">${esc(it.left)}${it.ex ? ' — في لائحتك' : ''}</span>` : it.ex ? '<span class="tag leave">موجود: تحديث</span>' : '<span class="tag resume">جديد</span>')
    + (rh && it.posLabel && !it.left ? ` <span class="tag absence" title="الوضعية الإدارية">${esc(it.posLabel)}</span>` : '');
  const unCell = it => { const u = unitOf(it), adm = it.adminCode && it.adminCode !== it.unitCode ? unitOf({ unitCode: it.adminCode }) || it.adminCode : '';
    return `${SECI ? '' : `<b${u ? '' : ' style="color:var(--red)"'}>${esc(u || 'غير مرتبط بوحدة')}</b><small class="muted" dir="ltr">${esc(it.unitCode || '')}</small>`}${it.e.levels ? `<small class="muted">المستويات: ${esc(it.e.levels)}${it.e.teachLang ? ' — ' + esc(it.e.teachLang) : ''}</small>` : ''}${adm && !SECI ? `<small class="muted">التعيين الإداري: ${esc(adm)}</small>` : ''}${it.other && it.other.length && !SECI ? `<small class="muted">${esc(RH.alsoText(it, c => unitMap[c] || c))}</small>` : ''}`; };
  const row = it => `<tr data-i="${it.i}" class="${it.left ? 'off' : ''} ${it.sure ? '' : 'chk-me'}">
      <td><input type="checkbox" data-on ${it.on ? 'checked' : ''}></td>
      <td><input class="inp ag" data-k="firstAr" value="${esc(it.e.firstAr || '')}"></td>
      <td><button class="btn sm icon" data-sw title="تبديل الاسم الشخصي والعائلي">⇄</button></td>
      <td><input class="inp ag" data-k="lastAr" value="${esc(it.e.lastAr || '')}"></td>
      <td class="fr" dir="ltr"><span data-fr>${esc(`${it.e.firstFr || ''} — ${it.e.lastFr || ''}`)}</span></td>
      <td class="num">${esc(it.e.ppr || '')}</td><td class="num" dir="ltr">${esc(it.e.cin || '')}</td>
      <td class="cd">${esc(it.e.cadre || '—')}${it.e.subject || it.e.grade ? `<small class="muted">${esc([it.e.subject, it.e.grade ? 'الدرجة: ' + it.e.grade : ''].filter(Boolean).join(' — '))}</small>` : ''}</td>
      ${rh ? `<td class="un" data-un="${it.i}">${it.unitCode ? unCell(it) : '—'}</td>` : ''}
      <td class="nw">${stTag(it)} ${srcTag(it)}</td></tr>`;
  const codesBox = () => {
    if (!rh || SECI || !(P.codes || []).length) return '';
    const names = window.Units ? Units.names() : [];
    return `<div class="ag-codes"><b>ربط رموز GRESA بالوحدات المدرسية:</b>
      ${P.codes.map(c => `<span class="cd-row"><bdi dir="ltr" class="gc">${esc(c.code)}</bdi> <small class="muted">(${c.n} موظف)</small>
        <select class="inp" data-code="${esc(c.code)}"><option value="">— بدون وحدة —</option>${names.map(n => `<option value="${esc(n)}" ${unitMap[c.code] === n ? 'selected' : ''}>${esc(n)}</option>`).join('')}<option value="__new">+ وحدة جديدة…</option></select>
        <input class="inp" data-newun="${esc(c.code)}" placeholder="اسم الوحدة الجديدة" style="display:none"></span>`).join('')}
      <label class="chk"><input type="checkbox" id="agSaveCodes" checked> حفظ الرموز في سجل الوحدات المدرسية (الإعدادات) لتُعرف تلقائيا في المرات القادمة</label></div>`;
  };
  const review = cur.filter(x => !x.sure).length;
  body.innerHTML = `
    <div class="ag-src">${ic('inbox')}<div>${rh ? `ملفات ${'<bdi dir="ltr">Esise</bdi>'} (XML)${nFiles ? ' (' + nFiles + ')' : ''}` : 'ملف agent'}: <bdi><b>${esc(fileName || 'agent')}</b></bdi>${P.inst.school ? ` — المؤسسة: <b>${esc(P.inst.school)}</b>` : ''}${P.inst.gresa ? ` (<bdi>${esc(P.inst.gresa)}</bdi>)` : ''}
      <div class="muted" style="font-size:12px">${rh ? 'المصدر: منظومة <bdi dir="ltr">Esise</bdi> ← <span class="path" dir="ltr">Accueil</span> ← <span class="path" dir="ltr">Module RH</span> ← <span class="path" dir="ltr">Export</span>' : `المصدر: موقع تبليغ ← ${AGENT_PATH}`}</div>
      ${lists.length ? `<div style="font-size:12.5px">لائحة Excel: ${lists.map(L => `<bdi><b>${esc(L.name)}</b></bdi> (${L.list.length})`).join('، ')} — استكمال معلومات <b>${xlMatched}</b> موظف${xlOnly ? `، و<b>${xlOnly}</b> غير موجود في agent` : ''}</div>` : ''}</div>
      <button class="btn sm" id="agAddXl" title="الدرجة، السلم، الرتبة، الهاتف... من لائحة الموظفين (نموذج الاستيراد)">${ic('up')} ${lists.length ? 'إضافة لائحة Excel أخرى' : 'إضافة لائحة Excel لاستكمال المعلومات'}</button></div>
    <div class="kpis" style="margin:10px 0 12px">
      <div>العاملون حاليا بالمؤسسة: <b>${cur.length}</b></div><div>جدد: <b>${cur.filter(x => !x.ex).length}</b></div>
      <div>موجودون في لائحتك (تحديث): <b>${cur.filter(x => x.ex).length}</b></div>
      ${gone.length ? `<div>غادروا المؤسسة / متقاعدون: <b>${gone.length}</b> <span class="muted">(غير محددين)</span></div>` : ''}</div>
    ${codesBox()}
    ${review ? `<div class="ag-warn">${ic('alert')} <span>تحقق من الأسماء المظللة (${review}): ${rh ? 'في منظومة Esise يُكتب الاسم العربي كاملا في خانة واحدة وقد يتقدم النسب على الاسم الشخصي.' : 'في ملف agent يُكتب الاسم الكامل أحيانا في خانة واحدة أو تُقلب الخانتان.'} صحّح الاسم مباشرة أو اضغط ⇄ للتبديل.</span></div>` : ''}
    <div class="ag-wrap"><table class="tbl ag-tbl"><thead><tr><th style="width:30px"><input type="checkbox" id="agAll" ${cur.length ? 'checked' : ''}></th><th>الاسم الشخصي</th><th></th><th>الاسم العائلي</th><th>Prénom — Nom</th>
      <th>رقم التأجير</th><th>ب.و</th><th>الإطار / المادة</th>${rh ? (SECI ? '<th>المستويات</th>' : '<th>الوحدة / المستويات</th>') : ''}<th>الحالة</th></tr></thead>
      <tbody>${cur.map(row).join('')}${gone.length ? `<tr class="ag-sep"><td colspan="${rh ? 10 : 9}">لم يعودوا يعملون بالمؤسسة حسب الملف (حدّدهم إن أردت استيرادهم):</td></tr>${gone.map(row).join('')}` : ''}</tbody></table></div>
    <div class="ag-opts">
      <label class="chk"><input type="checkbox" id="agOver"> ${rh ? 'تعويض المعطيات الموجودة (الأسماء، الإطار، الدرجة، الرتبة، التواريخ، الوحدة، المستويات...) بمعطيات Esise للموظفين الموجودين' : 'تعويض الأسماء والمعطيات الموجودة (البطاقة، تاريخ الازدياد، تاريخ التعيين) بمعطيات ملف agent للموظفين الموجودين'}</label>
      ${instFill.length ? `<div><label class="chk"><input type="checkbox" id="agInst" checked> ملء معطيات المؤسسة الفارغة (في الإعدادات) من ملف agent:</label>
        <div class="ag-inst">${instFill.map(([k, l]) => `<span>${l}: <b dir="auto">${esc(P.inst[k])}</b></span>`).join('')}</div></div>` : ''}
      <div class="muted" style="font-size:12px;line-height:1.8">${rh ? 'يُملأ فقط ما كان فارغا عند الموظفين الموجودين (إلا إذا حدّدت «تعويض»). السلم والرقم الاستدلالي ورقم الحساب البنكي لا ترد في ملفات Esise: أضف لائحة Excel لاستكمالها. ' : 'الإطار يُقترح حسب السلك ومادة التدريس الواردة في ملف agent ويُملأ فقط إن كان فارغا. معلومات لائحة Excel (الدرجة، السلم، الرتبة، الهاتف...) تُكمل ملف agent وتُحدّث لائحتك. '}
        لا يحذف الاستيراد أي موظف ولا أي معطيات أدخلتها.</div>
    </div>`;
  const it = tr => items[+tr.dataset.i];
  $$('tr[data-i]', body).forEach(tr => {
    const x = it(tr);
    $('[data-on]', tr).onchange = ev => { x.on = ev.target.checked; };
    $$('input.ag', tr).forEach(inp => inp.oninput = () => { x.e[inp.dataset.k] = inp.value.trim(); x.edited = true; });
    $('[data-sw]', tr).onclick = () => {
      [x.e.firstAr, x.e.lastAr] = [x.e.lastAr || '', x.e.firstAr || ''];
      [x.e.firstFr, x.e.lastFr] = [x.e.lastFr || '', x.e.firstFr || ''];
      $('[data-k=firstAr]', tr).value = x.e.firstAr; $('[data-k=lastAr]', tr).value = x.e.lastAr;
      $('[data-fr]', tr).textContent = `${x.e.firstFr || ''} — ${x.e.lastFr || ''}`; x.edited = true; tr.classList.remove('chk-me');
    };
  });
  $('#agAll', body).onchange = ev => cur.forEach(x => { x.on = ev.target.checked; const c = $(`tr[data-i="${x.i}"] [data-on]`, body); if (c) c.checked = x.on; });
  // GRESA code -> unit (XML): selection or a new unit
  const refreshUnits = () => $$('td.un[data-un]', body).forEach(td => { const x = items[+td.dataset.un]; if (x && x.unitCode) td.innerHTML = unCell(x); });
  $$('select[data-code]', body).forEach(sel => sel.onchange = () => {
    const c = sel.dataset.code, inp = $(`input[data-newun="${c}"]`, body);
    inp.style.display = sel.value === '__new' ? '' : 'none';
    if (sel.value === '__new') { inp.value = inp.value || `وحدة ${c}`; unitMap[c] = inp.value.trim(); inp.focus(); inp.select(); } else unitMap[c] = sel.value;
    refreshUnits();
  });
  $$('input[data-newun]', body).forEach(inp => inp.oninput = () => { unitMap[inp.dataset.newun] = inp.value.trim(); refreshUnits(); });
  const m = modal({ title: rh ? 'استيراد الموظفين من ملفات منظومة Esise (XML)' : 'استيراد الموظفين من ملف agent (تبليغ)', size: 'xl', body, actions: [{ label: ic('up') + ' استيراد المحددين', cls: 'pri', onClick: () => {
    const sel = items.filter(x => x.on);
    if (!sel.length) { toast('لم تحدد أي موظف', true); return false; }
    if (sel.some(x => !x.e.firstAr && !x.e.lastAr)) { toast('يوجد موظف محدد بدون اسم', true); return false; }
    const over = $('#agOver', body).checked;
    const OVER = rh ? ['firstAr', 'lastAr', 'firstFr', 'lastFr', 'ppr', 'sex', 'unit', 'unitGresa', 'unitServices', 'levels', 'teachLang', 'formation', 'status', 'task', 'subject', 'alsoAt'].concat(RH_KEEP) : ['firstAr', 'lastAr', 'firstFr', 'lastFr', 'cin', 'birth', 'affDate', 'ppr'];
    let added = 0, updated = 0;
    if (rh && window.Units && !SECI) {
      // new units are created; the GRESA code is saved on a unit that has none (a code already typed is never replaced)
      const save = $('#agSaveCodes', body) && $('#agSaveCodes', body).checked;
      Object.entries(unitMap).forEach(([c, name]) => { if (!name) return; const u = Units.ensure(name); if (u && save && !u.gresa) u.gresa = Units.normCode(c); });
    }
    sel.forEach(x => {
      const e = x.e;
      if (rh && !SECI) {
        const un = unitOf(x); if (un) e.unit = un; const al = RH.alsoText(x, c => unitMap[c] || c); if (al) e.alsoAt = al;
        // 1.9.4: the GRESA code of the unit where the person teaches (and of the other units served) is kept: the teacher stays linked to its unit through the code
        if (x.unitCode) e.unitGresa = window.Units ? Units.normCode(x.unitCode) : x.unitCode;
        if ((x.other || []).length) e.unitServices = x.other.map(o => ({ code: window.Units ? Units.normCode(o.code) : o.code, unit: unitMap[o.code] || '', levels: o.levels || '' }));
      }
      Object.keys(e).forEach(k => { if (e[k] === '') delete e[k]; });
      const ex = findEmpIn(DB.employees, e);
      if (ex) {
        // agent data fills the gaps (or replaces with «تعويض»); Excel list data and names edited here update the employee
        Object.entries(e).forEach(([k, val]) => {
          if (!val || k === 'id') return;
          const names = /^(first|last)(Ar|Fr)$/.test(k);
          if (!ex[k] || (over && OVER.includes(k)) || (x.edited && names) || (x.xl.includes(k) && !(names && !(e.firstAr && e.lastAr)))) ex[k] = val;
        });
        updated++;
      } else { DB.employees.push(Object.assign({ id: uid('e') }, e)); added++; }
    });
    if (instFill.length && $('#agInst', body) && $('#agInst', body).checked) instFill.forEach(([k]) => { inst[k] = P.inst[k]; });
    if (rh) DB.settings.rhLast = { date: todayIso(), files: nFiles || 1, n: sel.length };
    else DB.settings.agentLast = { date: todayIso(), file: [fileName].concat(lists.map(L => L.name)).filter(Boolean).join(' + '), n: sel.length };
    persist();
    if (current === 'employees') go('employees'); else { if (after) after(); renderNav(); }
    toast(`تم الاستيراد: إضافة ${added} وتحديث ${updated} موظف${rh ? (lists.length ? ' (Esise + لائحة Excel)' : ' من ملفات Esise') : lists.length ? ' (ملف agent + لائحة Excel)' : ' من ملف agent'}`);
  } }, { label: 'إلغاء' }] });
  $('#agAddXl', body).onclick = async () => {
    const F = await readAgentFiles(true);
    if (!F) return;
    if (!F.lists.length) { toast('لم يتم العثور على لائحة موظفين في الملف (أعمدة الاسم، النسب، رقم التأجير...). استعمل «نموذج الاستيراد».', true); return; }
    m.close(); agentDialog(rows, fileName, after, lists.concat(F.lists), pre, nFiles);
  };
}

/* ================================================================= */
/* DOCUMENTS */
function pageDocuments(v, arg) {
  const cats = Docs.CATS || [['all', 'الوثائق']];
  const cat = (arg && arg.cat && (cats.some(c => c[0] === arg.cat) || ['files', 'follow'].includes(arg.cat))) ? arg.cat : cats[0][0];
  const SECS = cats.map(([id, title]) => ({ id, title })).concat([{ id: 'files', title: 'طلب وبعث الملفات (التلاميذ والأساتذة)' }, { id: 'follow', title: 'المتابعة والتتبع والحراسة' }]);
  const vsec = isSecCycle();
  const typeCards = (cid, q) => {
    const list = Object.entries(TYPES).filter(([k, t]) => (!t.hidden || (window.DocCustom && DocCustom.byType(k).length)) && (t.cat || 'all') === cid && (!q || (t.title + ' ' + t.desc).includes(q)));
    return list.map(([k, t]) => `${t.hidden ? '' : `<div class="card doc-card" data-doc="${k}"><div class="e">${t.icon}</div>
        <div><h3>${t.title}</h3><p>${t.desc}</p></div></div>`}${(window.DocCustom ? DocCustom.list().filter(x => x.type === k && (!q || x.name.includes(q) || t.title.includes(q))) : []).map(x => `<div class="card doc-card" data-doc="${k}" data-var="${x.id}" style="border-style:dashed"><div class="e">${t.icon}</div><div><h3>${esc(x.name)}</h3><p>نسخة مخصصة من «${t.title}» (الأصل محفوظ)</p></div></div>`).join('')}`).join('');
  };
  const fileCards = q => (window.Files ? Files.DOCS().filter(d => !q || (d.t + ' ' + d.d).includes(q)) : []).map(d => `<div class="card doc-card" data-fl="${d.k}"><div class="e">${d.grp === 'p' ? '🎒' : '📨'}</div>
        <div><h3>${d.t}</h3><p>${d.d}</p></div></div>`).join('');
  const followCards = q => {
    const t = 'شبكة تتبع العمل التربوي بالمؤسسة', d = cycT('جدول بالأساتذة والمهام المطلوبة منهم (الأبواب المفتوحة، الورشات، الروائز، استعمال الزمن، الغياب…) والمنجز يظهر بوجه مبتسم أخضر');
    const sm = window.Track ? Track.summary() : { n: 0, avg: 0 };
    const gt = 'جداول الحراسة', gd = `جدول الحراسة${vsec ? '' : ' لكل وحدة مدرسية'} (صباحا ومساء: الاسم، رقم التأجير، التوقيع، التوجيهات) — تناوب تلقائي من الموظفين، حراسة اليوم وبديل الغائب، إحصاء الحصص`;
    const gs = window.Guard ? Guard.summary() : { units: 0, teachers: 0 };
    const showG = !q || (gt + ' ' + gd + ' حراسة').includes(q), showT = !q || (t + ' ' + d + ' تتبع شبكة').includes(q);
    const rt = 'التقارير اليومية للأنشطة المنجزة', rd = 'التقرير اليومي على النموذج المعتمد: حركة التلاميذ، غياب الأطر والتأخرات واستئناف العمل، الأنشطة، التأطير، الزيارات والحوادث — تعبئة تلقائية وحصيلة شهرية';
    const showR = !q || (rt + ' ' + rd + ' تقرير يومي').includes(q);
    const vt = vsec ? 'الحراسة العامة' : 'حراسة التلاميذ', vd = 'مراسلات المتغيبين وغير الملتحقين والاستدعاءات، ورقة الدخول وزيارة الطبيب، إشعار المخالفة وتقرير الأستاذ(ة)، التزام ولي الأمر وطلب الإدماج' + (vsec ? '، نقطة المواظبة والسلوك، إحصاء الغياب' : '') + ' — تُولَّد من سجل غياب التلاميذ';
    const showV = !q || (vt + ' ' + vd + ' حراسة غياب استدعاء التزام').includes(q);
    return `${showT ? `<div class="card doc-card" data-trk="1"><div class="e">🙂</div><div><h3>${t}</h3><p>${d}${sm.n ? ` — ${sm.n} شبكة، الإنجاز ${sm.avg}%` : ''}</p></div></div>` : ''}${showG ? `<div class="card doc-card" data-grd="1"><div class="e">🛡️</div><div><h3>${gt}</h3><p>${gd}${gs.teachers ? ` — ${gs.teachers} أستاذ(ة) مكلف(ة)` : ''}</p></div></div>` : ''}${showR ? `<div class="card doc-card" data-drp="1"><div class="e">📋</div><div><h3>${rt}</h3><p>${rd}</p></div></div>` : ''}${showV ? `<div class="card doc-card" data-vsc="1"><div class="e">📨</div><div><h3>${vt}</h3><p>${vd}</p></div></div>` : ''}`;
  };
  // 1.9.4: the digital register of the inspection and follow-up visits, first card of «التأطير والتتبع»
  const visitCard = q => { const t = 'سجل الزيارات التفقدية والتتبع التربوي', d = cycT('توثيق زيارات أساتذة الوحدات المدرسية: التاريخ، الأستاذ(ة)، الوحدة، التأشير على المذكرة اليومية وسجل الغياب ودفاتر التلاميذ والجذاذات واستعمال الزمن واحترام التوصيات السابقة، الملاحظات والتوصيات'); if (q && !(t + ' ' + d + ' زيارة').includes(q)) return ''; const sm = window.Visits ? Visits.summary() : { n: 0 }; return `<div class="card doc-card" data-vst="1"><div class="e">🗂️</div><div><h3>${t}</h3><p>${d}${sm.n ? ` — ${sm.n} زيارة` : ''}</p></div></div>`; };
  const cardsOf = (id, q) => id === 'files' ? fileCards(q) : id === 'follow' ? followCards(q) : id === 'peda' ? visitCard(q) + typeCards(id, q) : typeCards(id, q);
  const nOf = id => (id === 'files' ? (window.Files ? Files.DOCS().length : 0) : id === 'follow' ? 4 : id === 'peda' ? 1 + Object.values(TYPES).filter(t => !t.hidden && t.cat === 'peda').length : Object.values(TYPES).filter(t => !t.hidden && (t.cat || 'all') === id).length);
  const cur = SECS.find(x => x.id === cat);
  v.innerHTML = `<div class="page-h"><h1>${cur.title}</h1><span class="sub">اختر الوثيقة المطلوب إنشاؤها (${nOf(cat)} نموذجا في هذا الصنف)</span><span class="sp"></span>
      <div class="search" style="width:280px">${ic('search')}<input class="inp" id="dq" placeholder="بحث في كل الوثائق..."></div></div>
    <div id="docGroups"></div>`;
  const draw = q => {
    q = (q || '').trim();
    // typing a search looks in every section; otherwise only the section chosen in the bar at the top is shown
    const secs = q ? SECS : [cur];
    const html = secs.map(sc => { const c = cardsOf(sc.id, q); return c ? `${q ? `<h3 class="cat-h">${sc.title}</h3>` : ''}<div class="doc-cards">${c}</div>` : ''; }).join('');
    $('#docGroups').innerHTML = html || '<div class="empty-state">لا توجد وثيقة مطابقة</div>';
    $$('[data-doc]', v).forEach(c => c.onclick = () => go('editor', { type: c.dataset.doc, variant: c.dataset.var || '' }));
    $$('[data-fl]', v).forEach(c => c.onclick = () => go('filesDoc', { kind: c.dataset.fl }));
    $$('[data-trk]', v).forEach(c => c.onclick = () => go('track'));
    $$('[data-vst]', v).forEach(c => c.onclick = () => go('visits'));
    $$('[data-grd]', v).forEach(c => c.onclick = () => go('guard'));
    $$('[data-drp]', v).forEach(c => c.onclick = () => go('dayrep'));
    $$('[data-vsc]', v).forEach(c => c.onclick = () => go('vschool'));
  };
  $('#dq').oninput = e => draw(e.target.value);
  draw('');
}

Object.assign(TYPES.leave, { cat: 'leave' }); Object.assign(TYPES.medical, { cat: 'leave' }); Object.assign(TYPES.monthly, { cat: 'leave', noEmp: true });
Object.assign(TYPES.inquiry, { cat: 'work' }); Object.assign(TYPES.resume, { cat: 'work' }); Object.assign(TYPES.certificate, { cat: 'cert' });
const LEAVE_TYPES = ['مرضية', 'أغراض شخصية', 'استثنائية', 'ولادة'];
// أسباب الغياب (حالات التغيب ووضعيات الموظف المعتمدة)
const ABS_REASONS = ['الاستيداع', 'الإلحاق', 'رخصة الأبوة', 'رخصة الولادة', 'رخصة استثنائية',
  'رخصة مرض قصيرة الأمد', 'رخصة مرض متوسطة الأمد', 'رخصة مرض طويلة الأمد', 'تكليف بمهمة', 'تغيب أو انقطاع العمل'];
// 1.9.3: «استأنف عمله بعد» offers every absence reason of the section «الغياب والرخص» (the ten reasons of the register, the reasons of the
// leave / certificate / inquiry documents and the free reasons typed by the user), and the cases of the resume forms follow them
const EXTRA_REASONS = Docs.RESUME_EXTRA_REASONS;
const knownReason = r => ABS_REASONS.includes(r) || EXTRA_REASONS.includes(r) || r === 'رخصة مرضية' || r === 'تغيب' || reasonIdx(r) >= 0;
const customReasons = () => { const out = []; try { absenceEntries().forEach(a => { const r = String(a.reason || '').replace(/\s*\(.*\)\s*$/, '').trim(); if (r && !knownReason(r) && !out.includes(r)) out.push(r); }); } catch (_) {} return out; };
const afterTypes = () => ABS_REASONS.concat(['رخصة مرضية'], EXTRA_REASONS, Docs.RESUME_MORE_REASONS || [], customReasons());
const AFTER_TYPES = ABS_REASONS.concat(['رخصة مرضية'], EXTRA_REASONS, Docs.RESUME_MORE_REASONS || []);
const CERT_TYPES = ['شهادة العمل', 'شهادة العمل باللغة الفرنسية', 'بيان الالتزام', 'بيان الالتزام باللغة الفرنسية'];
// «استأنف عمله بعد» -> the matching case of each resume-of-work form (the 10 absence reasons share the order of RESUME_CASES)
const ownCase = after => (after && (EXTRA_REASONS.includes(after) || !knownReason(after)) ? Docs.extraCase(after) : '');
const caseOpts = base => Docs.casesWith(base).concat(customReasons().map(Docs.extraCase));
const caseFor = after => ownCase(after) || ({ 'رخصة مرضية': RESUME_CASES[5], 'رخصة ولادة': RESUME_CASES[3], 'رخصة استثنائية': RESUME_CASES[4], 'رخصة الأبوة': RESUME_CASES[2],
  'تغيب': RESUME_CASES[9], 'الاستيداع': RESUME_CASES[0], 'الإلحاق': RESUME_CASES[1], 'تكليف بمهمة': RESUME_CASES[8], 'رخصة أغراض شخصية': RESUME_CASES[9] }[after]
  || (reasonIdx(after) >= 0 ? RESUME_CASES[reasonIdx(after)] : ''));
const caseFor2 = after => ownCase(after) || ({ 'رخصة مرضية': Docs.RESUME2_CASES[5], 'رخصة ولادة': Docs.RESUME2_CASES[3], 'رخصة استثنائية': Docs.RESUME2_CASES[4],
  'رخصة الأبوة': Docs.RESUME2_CASES[4], 'تغيب': Docs.RESUME2_CASES[9], 'الاستيداع': Docs.RESUME2_CASES[0], 'الإلحاق': Docs.RESUME2_CASES[1],
  'تكليف بمهمة': Docs.RESUME2_CASES[8], 'رخصة أغراض شخصية': Docs.RESUME2_CASES[9] }[after]
  || (reasonIdx(after) >= 0 ? Docs.RESUME2_CASES[[0, 1, 4, 3, 4, 5, 6, 7, 8, 9][reasonIdx(after)]] : ''));
const caseForDir = after => { const R = Docs.RESUMEDIR_CASES; return ({ 'رخصة مرضية': R[0], 'رخصة ولادة': R[1], 'رخصة الولادة': R[1], 'تكليف بمهمة': R[2], 'تغيب': R[3] }[after])
  || (reasonIdx(after) >= 0 ? R[[4, 4, 4, 1, 4, 0, 0, 0, 2, 3][reasonIdx(after)]] : (after ? R[4] : '')); };
// شهادة العمل: المهمة، الدرجة والوظيفة بالفرنسية انطلاقا من معطيات الموظف
const isTeacher = e => /أستاذ|استاذ|مدرس/.test(e.cadre || '') || (!!e.subject && !/مدير|متصرف|ملحق|حارس|عون/.test(e.cadre || ''));
const taskAr = e => e.task || (/مدير/.test(e.cadre || '') ? 'مدير(ة) المؤسسة' : isTeacher(e) ? 'التدريس' + (e.subject ? ` (${e.subject})` : '') : '');
const gradeFr = g => { g = String(g || ''); return /الأولى|الاولى|1/.test(g) ? '1ER GRADE' : /الثانية|2/.test(g) ? '2EME GRADE' : /الثالثة|3/.test(g) ? '3EME GRADE' : /الرابعة/.test(g) ? '4EME GRADE' : /الممتازة/.test(g) ? 'GRADE EXCEPTIONNEL' : /الرئيسية/.test(g) ? 'GRADE PRINCIPAL' : /خارج/.test(g) ? 'HORS GRADE' : ''; };
const fonctionFr = (e, sex) => { const F = (sex || e.sex) === 'F', M = (sex || e.sex) === 'M';
  if (/مدير/.test((e.task || '') + (e.cadre || ''))) return F ? 'DIRECTRICE' : M ? 'DIRECTEUR' : 'DIRECTEUR (TRICE)';
  return isTeacher(e) ? (F ? 'ENSEIGNANTE' : M ? 'ENSEIGNANT' : 'ENSEIGNANT(E)') : ''; };
/* field: k,l(label),t(type),o(options),d(default fn),auto(fn computing from state),sec,hint,full */
const FORMS = {
  inquiry: [
    { sec: 'فترة الغياب' },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { sec: 'معطيات الاستفسار' },
    { k: 'date', l: 'تاريخ الاستفسار', t: 'date', d: todayIso },
    { k: 'deadline', l: 'أجل الجواب (بالأيام)', t: 'number', d: () => 15 },
    { k: 'receiptDate', l: 'تاريخ الإشعار بالاستلام', t: 'date', hint: 'اتركه فارغا ليُملأ باليد' }
  ],
  leave: [
    { sec: 'الرخصة' },
    { k: 'leaveType', l: 'نوع الرخصة', t: 'select', o: LEAVE_TYPES, d: () => 'مرضية', full: true },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'duration', l: 'المدة', t: 'text', auto: f => durationText(daysBetween(f.from, f.to)), full: true },
    { k: 'address', l: 'العنوان الشخصي للموظف', t: 'text', auto: (f, e) => e.address || '', full: true },
    { k: 'city', l: 'حرر ب', t: 'text', d: () => S().city }, { k: 'date', l: 'في (تاريخ الطلب)', t: 'date', d: todayIso },
    { sec: 'خاص بالإدارة' },
    { k: 'opinion', l: 'رأي السيد المدير', t: 'text', full: true },
    { k: 'stopDate', l: 'تاريخ توقيف الموظف عن العمل', t: 'date' },
    { k: 'date2', l: 'تاريخ توقيع رئيس المؤسسة', t: 'date', d: todayIso },
    { k: 'withHistory', l: 'ملء جدول الرخص (12 شهرا) تلقائيا من السجل', t: 'check', d: () => true, full: true }
  ],
  certificate: [
    { sec: 'الشهادة' },
    { k: 'certType', l: 'نوع الشهادة', t: 'combo', o: CERT_TYPES, d: () => CERT_TYPES[0], full: true },
    { k: 'purpose', l: 'الغرض', t: 'text', d: () => 'لأغراض إدارية', full: true },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso },
    { sec: 'الإرسال (اختياري)' },
    { k: 'sentDate', l: 'أرسل بتاريخ', t: 'date' }, { k: 'sentNo', l: 'تحت عدد', t: 'text' }
  ],
  resume: [
    { sec: 'الاستئناف' },
    { k: 'afterType', l: 'استأنف عمله بعد', t: 'combo', get o() { return afterTypes(); }, d: () => 'رخصة مرضية', full: true },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'duration', l: 'المدة', t: 'text', auto: f => durationText(daysBetween(f.from, f.to)) },
    { k: 'resumeDate', l: 'تاريخ استئناف العمل', t: 'date', auto: f => f.to ? addDays(f.to, 1) : '' },
    { k: 'case', l: 'الحالة', t: 'select', get o() { return caseOpts(RESUME_CASES); }, auto: f => caseFor(f.afterType), full: true },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', auto: f => f.resumeDate || todayIso() }
  ],
  medical: [
    { sec: 'الشهادة الطبية' },
    { k: 'receivedDate', l: 'تاريخ التسلم', t: 'date', d: todayIso },
    { k: 'doctor', l: 'الطبيب (ة)', t: 'text' },
    { k: 'from', l: 'ابتداء من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'duration', l: 'المدة', t: 'text', auto: f => durationText(daysBetween(f.from, f.to)), full: true },
    { k: 'sickAddress', l: 'العنوان أثناء فترة المرض', t: 'text', auto: (f, e) => e.address || '', full: true },
    { sec: 'المدلي بالشهادة' },
    { k: 'deliveredBy', l: 'من طرف السيد (ة)', t: 'text', auto: (f, e) => fullName(e) },
    { k: 'delivererCin', l: 'رقم بطاقته الوطنية', t: 'text', auto: (f, e) => e.cin || '' },
    { k: 'notes', l: 'ملاحظات', t: 'text', d: () => 'تسلمت الشهادة الطبية داخل الآجال القانونية', full: true },
    { k: 'date', l: 'حرر بتاريخ', t: 'date', auto: f => f.receivedDate || todayIso() }
  ],
  exceptional: [
    { sec: 'الرخصة' },
    { k: 'kind', l: 'نوع الطلب', t: 'select', o: [['استثنائية', 'رخصة استثنائية'], ['ولادة', 'رخصة ولادة']], d: () => 'استثنائية' },
    { k: 'kindDetail', l: 'نوع الرخصة الاستثنائية', t: 'combo', o: ['زواج الموظف(ة)', 'زواج أحد الأبناء', 'ازدياد مولود', 'ختان ابن', 'وفاة الزوج(ة) أو أحد الأصول أو الفروع', 'عملية جراحية للزوج(ة) أو أحد الأبناء'] },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'days', l: 'المدة (بالأيام)', t: 'text', auto: f => { const n = daysBetween(f.from, f.to); return n ? String(n) : ''; } },
    { k: 'endWork', l: 'تاريخ انتهاء العمل بعد الدروس', t: 'date' },
    { k: 'address', l: 'عنوان الإقامة أثناء الرخصة (إجباري)', t: 'text', auto: (f, e) => e.address || '', full: true },
    { sec: 'خاص بالإدارة' },
    { k: 'ref', l: 'الرقم', t: 'text' }, { k: 'date', l: 'حرر في (تاريخ)', t: 'date', d: todayIso },
    { k: 'discipline', l: 'سوابق تأديبية للمعني(ة) بالأمر', t: 'textarea', full: true },
    { k: 'proposal', l: 'اقتراح رئيس(ة) المؤسسة', t: 'text', full: true },
    { k: 'withHistory', l: 'ملء جدول الرخص الاستثنائية (12 شهرا) تلقائيا من السجل', t: 'check', d: () => true, full: true }
  ],
  marriage: [
    { sec: 'الطلب' },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'تاريخ الطلب', t: 'date', d: todayIso },
    { k: 'from', l: 'ابتداء من تاريخ', t: 'date' },
    { k: 'to', l: 'إلى (لسجل الغياب)', t: 'date', hint: 'لا يظهر في الطلب، يُستعمل لاحتساب الغياب' }
  ],
  assignReq: [
    { sec: 'الطلب' },
    { k: 'variant', l: 'نوع الطلب', t: 'select', o: [['list', 'طلب تكليف مؤقت بإحدى المؤسسات (جدول)'], ['swap', 'طلب تكليف مؤقت بالتبادل']], d: () => 'list', full: true },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'تاريخ الطلب', t: 'date', d: todayIso },
    { k: 'sy', l: 'الموسم الدراسي', t: 'text', d: () => (window.MK ? MK.syDash(MK.curSy()).replace('-', '/') : '') },
    { k: 'items', l: 'المؤسسات المطلوبة (للطلب بالجدول)', t: 'rows', cols: [['المؤسسة', '48%'], ['نوعها', '20%'], ['الجماعة', '24%']], full: true, hint: 'نوعها: مستقلة، م/م (مجموعة مدرسية)، فرعية، إعدادية...' },
    { sec: 'الطلب بالتبادل' },
    { k: 'pTitle', l: 'الصفة', t: 'select', o: ['الأستاذ', 'الأستاذة'], d: () => 'الأستاذ' }, { k: 'pName', l: 'الاسم الكامل للطرف الآخر', t: 'text' },
    { k: 'pCin', l: 'رقم البطاقة الوطنية', t: 'text', dir: 'ltr' }, { k: 'pPpr', l: 'رقم التأجير', t: 'text', dir: 'ltr' },
    { k: 'pSchool', l: 'المؤسسة التي يعمل بها', t: 'text', full: true },
    { sec: 'اختياري' },
    { k: 'reason', l: 'فقرة إضافية (سبب الطلب...)', t: 'textarea', full: true }, { k: 'att', l: 'المرفقات', t: 'text', full: true }
  ],
  paternity: [
    { sec: 'الطلب' },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'تاريخ الطلب', t: 'date', d: todayIso },
    { k: 'from', l: 'بداية الرخصة', t: 'date', hint: 'لسجل الغياب فقط' }, { k: 'to', l: 'نهاية الرخصة', t: 'date', hint: 'لسجل الغياب فقط' }
  ],
  breastfeeding: [
    { sec: 'الطلب' },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso },
    { k: 'resumeDate', l: 'تاريخ استئناف العمل بعد رخصة الولادة', t: 'date' },
    { k: 'childGender', l: 'المولود(ة)', t: 'select', o: [['أنثى', 'بنت'], ['ذكر', 'ولد']], d: () => 'أنثى' },
    { k: 'childBirth', l: 'تاريخ الازدياد', t: 'date' },
    { k: 'slot', l: 'توزيع ساعة الرضاعة', t: 'text', d: () => 'تخصيص الساعة الأخيرة من الفترة الصباحية أو الفترة المسائية', full: true }
  ],
  medicalDir: [
    { sec: 'الشهادة الطبية' },
    { k: 'receivedDate', l: 'تاريخ التسلم', t: 'date', d: todayIso },
    { k: 'doctor', l: 'الطبيب (ة)', t: 'text' },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'duration', l: 'المدة', t: 'text', auto: f => durationText(daysBetween(f.from, f.to)), full: true },
    { k: 'sickAddress', l: 'العنوان الشخصي', t: 'text', auto: (f, e) => e.address || '', full: true },
    { sec: 'المدلي بالشهادة' },
    { k: 'deliveredBy', l: 'من طرف السيد (ة)', t: 'text', auto: (f, e) => fullName(e) },
    { k: 'delivererCin', l: 'رقم بطاقته الوطنية', t: 'text', auto: (f, e) => e.cin || '' },
    { k: 'notes', l: 'ملاحظات', t: 'text', d: () => 'تسلمت الشهادة الطبية داخل الآجال القانونية', full: true },
    { k: 'date', l: 'التاريخ', t: 'date', auto: f => f.receivedDate || todayIso() }
  ],
  counterExam: [
    { sec: 'الشهادة الطبية موضوع الفحص' },
    { k: 'from', l: 'بمفعول (تاريخ البداية)', t: 'date' },
    { k: 'duration', l: 'مدتها', t: 'text' },
    { k: 'doctor', l: 'الطبيب (ة)', t: 'text', full: true },
    { sec: 'المراسلة' },
    { k: 'ref', l: 'الرقم', t: 'text' }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso },
    { k: 'healthCity', l: 'مدينة المندوبية', t: 'text', d: () => S().city },
    { k: 'withTable', l: 'إدراج جدول الشواهد الطبية السابقة خلال الموسم الدراسي (تلقائيا)', t: 'check', d: () => true, full: true }
  ],
  inquiryDir: [
    { sec: 'الاستفسار' },
    { k: 'from', l: 'بداية الغياب', t: 'date' }, { k: 'to', l: 'نهاية الغياب', t: 'date' },
    { k: 'reasons', l: 'موضوع الاستفسار', t: 'textarea', full: true,
      auto: f => (f.from ? `تغيبك عن العمل خلال الفترة الممتدة من ${fmtDate(f.from)} إلى ${fmtDate(f.to || f.from)} بدون إشعار أو مبرر.` : '') },
    { k: 'deadline', l: 'أجل الجواب (بالأيام)', t: 'number', d: () => 3 },
    { k: 'ref', l: 'الرقم', t: 'text' }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso },
    { k: 'receiptDate', l: 'تاريخ الاستلام', t: 'date', hint: 'اتركه فارغا ليُملأ باليد' }
  ],
  resume2: [
    { sec: 'الاستئناف' },
    { k: 'afterType', l: 'استأنف عمله بعد', t: 'combo', get o() { return afterTypes(); }, d: () => 'رخصة مرضية', full: true },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'resumeDate', l: 'تاريخ استئناف العمل', t: 'date', auto: f => f.to ? addDays(f.to, 1) : '' },
    { k: 'case', l: 'الحالة', t: 'select', get o() { return caseOpts(Docs.RESUME2_CASES); }, auto: f => caseFor2(f.afterType), full: true },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', auto: f => f.resumeDate || todayIso() }
  ],
  resumeDir: [
    { sec: 'الاستئناف' },
    { k: 'afterType', l: 'بعد (1)', t: 'combo', get o() { return afterTypes(); }, d: () => 'رخصة مرضية', full: true },
    { k: 'from', l: 'من', t: 'date' }, { k: 'to', l: 'إلى', t: 'date' },
    { k: 'resumeDate', l: 'تاريخ استئناف العمل', t: 'date', auto: f => f.to ? addDays(f.to, 1) : '' },
    { k: 'case', l: 'الحالة', t: 'select', o: Docs.RESUMEDIR_CASES, auto: f => caseForDir(f.afterType), full: true },
    { k: 'otherCase', l: 'تحديد الحالة الأخرى', t: 'text', auto: f => (caseForDir(f.afterType) === Docs.RESUMEDIR_CASES[4] ? String(f.afterType || '') : ''), full: true },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', auto: f => f.resumeDate || todayIso() }
  ],
  joinWork: [
    { sec: 'الالتحاق' },
    { k: 'joinDate', l: 'تاريخ الالتحاق بالعمل', t: 'date', d: todayIso },
    { k: 'task', l: 'بصفته(ا)', t: 'text', auto: (f, e) => e.task || e.cadre || '' },
    { k: 'fromSchool', l: 'قادما(ة) من (المؤسسة السابقة)', t: 'text', auto: (f, e) => e.origin || '' },
    { k: 'basis', l: 'وذلك بناء على (قرار التعيين أو الانتقال، رقمه وتاريخه)', t: 'text', full: true },
    { k: 'case', l: 'الحالة', t: 'select', o: Docs.JOIN_CASES, full: true },
    { k: 'otherCase', l: 'تحديد الحالة الأخرى', t: 'text', full: true },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', auto: f => f.joinDate || todayIso() }
  ],
  absenceNotice: [
    { sec: 'الانقطاع' },
    { k: 'joinDate', l: 'تاريخ الالتحاق بالمؤسسة', t: 'date' },
    { k: 'stopDate', l: 'انقطع عن العمل بتاريخ', t: 'date' },
    { k: 'reason', l: 'السبب', t: 'select', o: Docs.STOP_REASONS.map((r, i) => [String(i + 1), r]), d: () => '1', full: true },
    { k: 'docs', l: 'الوثائق المصحوبة (الحالات 3 إلى 6)', t: 'text', full: true },
    { k: 'lastAddress', l: 'آخر عنوان أدلى به الموظف', t: 'text', auto: (f, e) => e.address || '', full: true },
    { sec: 'الإرسال' },
    { k: 'sendDate', l: 'تاريخ الإرسال إلى المديرية', t: 'date' }, { k: 'sendNo', l: 'تحت رقم', t: 'text' }
  ],
  absInform: [
    { sec: 'التغيب' },
    { k: 'stopDate', l: 'تاريخ الانقطاع عن العمل', t: 'date', d: todayIso }, { k: 'toDate', l: 'إلى غاية (اختياري)', t: 'date' },
    { k: 'reason', l: 'سبب التغيب', t: 'combo', o: ['مرض', 'مرافقة أحد الأبناء إلى المستشفى', 'ظروف عائلية', 'سبب غير معروف', 'وفاة أحد الأقارب'], full: true },
    { k: 'notes', l: 'ملاحظات رئيس المؤسسة', t: 'text', full: true, d: () => '' },
    { k: 'task', l: 'المهمة', t: 'text', auto: (f, e) => e.task || (isTeacher(e) ? 'التدريس' : '') }, { k: 'post', l: 'مقر العمل', t: 'text', auto: (f, e) => e.unit || S().school },
    { k: 'copies', l: 'عدد النسخ في الورقة', t: 'select', o: [['2', 'نسختان'], ['1', 'نسخة واحدة']], d: () => '2' },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso }
  ],
  returnWarn: [
    { sec: 'الانقطاع والإنذار' },
    { k: 'ref', l: 'رقم الإرسال', t: 'text' }, { k: 'stopDate', l: 'انقطع(ت) عن العمل بتاريخ', t: 'date' },
    { k: 'sex', l: 'الجنس', t: 'select', o: [['M', 'ذكر (السيد)'], ['F', 'أنثى (السيدة)']], auto: (f, e) => e.sex || '' },
    { k: 'address', l: 'العنوان', t: 'text', auto: (f, e) => e.address || '', full: true },
    { k: 'delay', l: 'الأجل', t: 'text', d: () => 'سبعة أيام' },
    { k: 'refs', l: 'المرجع (سطر لكل مرجع)', t: 'textarea', full: true, d: () => 'إعلان بانقطاع عن العمل عدد ............ بتاريخ ............\nالظهير الشريف رقم 1.58.008 بتاريخ 24 فبراير 1958 بمثابة النظام الأساسي العام للوظيفة العمومية، ولا سيما الفصل 75 مكرر منه.' },
    { k: 'sanction', l: 'عبارة الإجراء في حالة عدم الالتحاق', t: 'textarea', full: true, d: () => 'فسيتم تطبيق مسطرة ترك الوظيفة في حقك طبقا للنصوص التشريعية والتنظيمية الجاري بها العمل، ولا سيما الفصل 75 مكرر من النظام الأساسي العام للوظيفة العمومية' },
    { k: 'copies', l: 'النسخ (سطر لكل نسخة)', t: 'textarea', full: true, d: () => 'نسخة ترسل للمعني(ة) بالأمر عبر البريد المضمون مع الإشعار بالتوصل.\nنسخة إلى السيد المدير الإقليمي (مصلحة تدبير الموارد البشرية).' },
    { k: 'receipt', l: 'إشعار بالتوصل في أسفل الوثيقة', t: 'select', o: [['yes', 'نعم'], ['no', 'لا']], d: () => 'yes' },
    { k: 'city', l: 'حرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso }
  ],
  missionArrival: [
    { sec: 'المؤسسة الأصلية' },
    { k: 'origGresa', l: 'رمز المؤسسة (GRESA)', t: 'text' }, { k: 'departDate', l: 'تاريخ المغادرة', t: 'date' },
    { k: 'origCommune', l: 'الجماعة', t: 'text' }, { k: 'origZone', l: 'المنطقة', t: 'text' },
    { sec: 'المؤسسة المستقبلة' },
    { k: 'joinDate', l: 'تاريخ الالتحاق', t: 'date', d: todayIso },
    { k: 'recvSchool', l: 'المؤسسة', t: 'text', d: () => S().school },
    { k: 'recvGresa', l: 'رمزها (GRESA)', t: 'text', d: () => S().gresa || '' },
    { k: 'recvTask', l: 'المهمة', t: 'text', auto: (f, e) => e.task || '' },
    { k: 'recvCommune', l: 'الجماعة', t: 'text', d: () => S().commune || '' }, { k: 'recvZone', l: 'المنطقة', t: 'text' },
    { k: 'address', l: 'العنوان الشخصي', t: 'text', auto: (f, e) => e.address || '', full: true },
    { k: 'city', l: 'حرر ب', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso }
  ],
  certificate2: [
    { sec: 'الشهادة' },
    { k: 'certType', l: 'شهادة', t: 'combo', o: ['العمل', 'العمل باللغة الفرنسية', 'الأجرة', 'الالتزام'], d: () => 'العمل', full: true },
    { k: 'purpose', l: 'الغرض', t: 'text', d: () => 'لأغراض إدارية', full: true },
    { k: 'city', l: 'المدينة', t: 'text', d: () => S().city }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso }
  ],
  workAttAr: [
    { sec: 'شهادة العمل (بالعربية)' },
    { k: 'sex', l: 'الجنس', t: 'select', o: [['M', 'ذكر (السيد)'], ['F', 'أنثى (السيدة)']], auto: (f, e) => e.sex || '' },
    { k: 'ref', l: 'رقم الشهادة (اختياري)', t: 'text' },
    { k: 'signer', l: 'صيغة الإشهاد', t: 'text', d: () => `يشهد مدير(ة) ${S().school || 'المؤسسة'}`, full: true },
    { k: 'task', l: 'المهمة', t: 'text', auto: (f, e) => taskAr(e), full: true },
    { k: 'place', l: 'مقر العمل', t: 'text', d: () => S().school || '', full: true, hint: 'تضاف تحته المديرية الإقليمية تلقائيا' },
    { k: 'withGrade', l: 'إضافة الدرجة بعد الإطار', t: 'check', d: () => true },
    { k: 'withAff', l: 'إضافة تاريخ التعيين بالمؤسسة', t: 'check', d: () => true },
    { k: 'still', l: 'إضافة عبارة: «ولا يزال يزاول مهامه بالمؤسسة إلى حدود تاريخ تسليم الشهادة»', t: 'check', d: () => true, full: true },
    { k: 'city', l: 'حرر ب', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso }
  ],
  workAttFr: [
    { sec: 'Attestation de travail (بالفرنسية)' },
    { k: 'sex', l: 'الجنس', t: 'select', o: [['M', 'ذكر (Monsieur)'], ['F', 'أنثى (Madame)']], auto: (f, e) => e.sex || '' },
    { k: 'ref', l: 'N° (اختياري)', t: 'text' },
    { dir: 'ltr', k: 'signerFr', l: 'صيغة الإشهاد بالفرنسية', t: 'text', d: () => `Le Directeur de l'établissement ${S().schoolFr || ''} atteste`.replace(/\s+/g, ' '), full: true },
    { dir: 'ltr', k: 'cadreFr', l: 'Grade (الإطار بالفرنسية)', t: 'text', auto: (f, e) => e.cadreFr || '', full: true, hint: 'يُملأ من «الإطار بالفرنسية» في معطيات الموظف' },
    { dir: 'ltr', k: 'gradeFr', l: 'الدرجة بالفرنسية', t: 'combo', o: ['1ER GRADE', '2EME GRADE', '3EME GRADE', 'GRADE EXCEPTIONNEL', 'HORS GRADE'], auto: (f, e) => gradeFr(e.grade) },
    { dir: 'ltr', k: 'fonctionFr', l: 'Fonction', t: 'combo', o: ['ENSEIGNANT', 'ENSEIGNANTE', 'DIRECTEUR', 'DIRECTRICE', 'ADMINISTRATEUR', 'SURVEILLANT GENERAL'], auto: (f, e) => fonctionFr(e, f.sex) },
    { dir: 'ltr', k: 'placeFr', l: 'Affectation (اسم المؤسسة بالفرنسية)', t: 'text', d: () => S().schoolFr || '', full: true },
    { dir: 'ltr', k: 'dirFr', l: 'المديرية بالفرنسية', t: 'text', d: () => S().directorateFr || lastF('workAttFr', 'dirFr') || '', full: true, hint: 'مثال: DIRECTION PROVINCIALE AGADIR IDA OUTANANE' },
    { k: 'withAff', l: "إضافة تاريخ التعيين بالمؤسسة (Date d'affectation)", t: 'check', d: () => true, full: true },
    { k: 'still', l: "إضافة عبارة: «L'intéressé exerce toujours ses fonctions...»", t: 'check', d: () => true, full: true },
    { dir: 'ltr', k: 'cityFr', l: 'Fait à', t: 'text', d: () => S().cityFr || '' }, { k: 'date', l: 'Le', t: 'date', d: todayIso }
  ],
  birthCard: [
    { sec: 'البطاقة' },
    { k: 'event', l: 'الحدث', t: 'select', o: ['ازدياد', 'وفاة'], d: () => 'ازدياد' },
    { k: 'officePhone', l: 'هاتف المكتب (الكتابة الخاصة)', t: 'text' },
    { k: 'children', l: 'معلومات الابن (ة)', t: 'textarea', full: true, hint: 'سطر لكل ابن: ترتيب الابن | ترتيب الزوج | الاسم والنسب | التاريخ' }
  ],
  spouseCard: [
    { sec: 'الوضعية العائلية' },
    { k: 'marriageDate', l: 'تاريخ الزواج', t: 'date' }, { k: 'divorceDate', l: 'تاريخ الطلاق', t: 'date' },
    { k: 'deathDate', l: 'تاريخ الوفاة', t: 'date' },
    { sec: 'معلومات الزوج (ة)' },
    { k: 'spouseLast', l: 'الاسم العائلي', t: 'text' }, { k: 'spouseFirst', l: 'الاسم الشخصي', t: 'text' },
    { k: 'spouseJob', l: 'المهنة', t: 'text' }, { k: 'spousePpr', l: 'رقم التأجير', t: 'text' },
    { k: 'spouseCin', l: 'رقم البطاقة الوطنية', t: 'text' }, { k: 'spouseRank', l: 'ترتيب الزوج (ة)', t: 'text' }
  ],
  transmittal: [
    { sec: 'المراسلة' },
    { k: 'ref', l: 'الرقم', t: 'text' }, { k: 'date', l: 'التاريخ', t: 'date', d: todayIso },
    { k: 'sender', l: 'المرسل', t: 'text', d: () => 'مدير(ة) ' + (S().school || ''), full: true },
    { k: 'recipient', l: 'إلى', t: 'text', d: () => 'السيد المدير الإقليمي ل' + (S().ministry || ''), full: true },
    { k: 'service', l: 'المصلحة المرسل إليها', t: 'select', o: Docs.DIR_SERVICES, d: () => 'مصلحة تدبير الموارد البشرية', full: true },
    { k: 'recipient2', l: 'السطر الثاني', t: 'text', auto: f => [S().directorate, f.service].filter(Boolean).join(' - '), full: true },
    { k: 'items', l: 'الوثائق المرسلة (الموضوع والعدد)', t: 'rows', cols: [['الموضوع', '70%'], ['العدد', '18%']], full: true },
    { k: 'notes', l: 'ملاحظات', t: 'textarea', d: () => 'قصد الاطلاع والعمل.\nوتقبلوا أزكى التحيات، والسلام.', full: true }
  ],
  // 1.9.4: transmittal slip, model of the provincial directorate (service → office, count of each document, registry-office frame)
  transmittalDir: [
    { sec: 'الإرسال' },
    { k: 'date', l: 'تاريخ الإرسال', t: 'date', d: todayIso }, { k: 'no', l: 'رقم الإرسال', t: 'text', d: () => lastF('transmittalDir', 'no') },
    { k: 'no2', l: 'الرقم بعد الخط المائل / (اختياري)', t: 'text', d: () => lastF('transmittalDir', 'no2') },
    { k: 'sender', l: 'من (المرسل)', t: 'text', d: () => 'مدير المؤسسة' },
    { sec: 'المرسل إليه' },
    { k: 'recipient', l: 'إلى السيد', t: 'text', d: () => { const pl = Docs.placeOfDir(S().directorate); return 'المدير الإقليمي' + (pl ? ' ب' + pl : ''); }, full: true },
    { k: 'service', l: 'المصلحة', t: 'combo', o: Docs.TX_SERVICES || [], d: () => 'مصلحة تدبير الموارد البشرية', full: true },
    { k: 'office', l: 'المكتب', t: 'combo', oFn: f => Docs.TX_OFFICES(f.service), dep: 'service', d: () => 'مكتب الرخص والغياب', full: true },
    { sec: 'موضوع المراسلة والعدد والملاحظات' },
    { k: 'items', l: 'الوثائق المرسلة', t: 'rows', cols: [['موضوع المراسلة', '52%'], ['العدد', '12%'], ['ملاحظات', '28%']], full: true,
      presets: [['شهادة طبية', 'شهادة طبية تتعلق بـ ........ | 1 | للاختصاص\nنسخة من الشهادة الطبية | 1\nنظير إيصال باستلام شهادة طبية | 1'],
        ['محضر استئناف العمل', 'محضر استئناف العمل | 1 | للاختصاص'], ['إعلان بانقطاع عن العمل', 'إعلان بانقطاع عن العمل | 3 | للاختصاص'], ['طلب رخصة', 'طلب رخصة | 1 | للاختصاص']] },
    { sec: 'أسفل الورقة' },
    { k: 'showFooter', l: 'إظهار ملاحظة المديرية أسفل الورقة', t: 'check', d: () => true },
    { k: 'footer', l: 'نص أسفل الورقة (اكتب بيانات الاتصال بالمديرية في الأسطر التالية)', t: 'textarea', d: () => lastF('transmittalDir', 'footer') || Docs.TX_FOOT(S()), full: true }
  ],
  permission: [
    { sec: 'التغيب' },
    { k: 'from', l: 'من (يوم)', t: 'date', d: todayIso }, { k: 'to', l: 'إلى (يوم)', t: 'date', auto: f => f.from || '' },
    { k: 'timeFrom', l: 'من الساعة (اختياري)', t: 'time', hint: 'للتغيب بضع ساعات فقط' }, { k: 'timeTo', l: 'إلى الساعة', t: 'time' },
    { k: 'reason', l: 'سبب التغيب', t: 'combo', o: ['ظروف عائلية طارئة', 'أسباب صحية', 'قضاء أغراض إدارية', 'المشاركة في امتحان أو مباراة', 'حضور جنازة', 'ظروف خاصة'], d: () => 'ظروف عائلية طارئة', full: true },
    { k: 'compensate', l: 'الالتزام بتعويض الحصص', t: 'check', d: () => true, full: true },
    { k: 'city', l: 'حرر ب', t: 'text', d: () => S().city }, { k: 'date', l: 'في (تاريخ الطلب)', t: 'date', d: todayIso },
    { sec: 'قرار رئيس المؤسسة' },
    { k: 'decision', l: 'القرار', t: 'select', o: ['موافق', 'غير موافق'] },
    { k: 'notes', l: 'ملاحظات', t: 'text', full: true }
  ],
  visit: [
    { sec: 'الزيارة' },
    { k: 'district', l: 'مقاطعة التفتيش', t: 'text', d: () => lastF('visit', 'district') },
    { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso },
    { k: 'visitor', l: 'قام بها السيد(ة)', t: 'text', d: () => S().director }, { k: 'visitorRole', l: 'بصفته', t: 'combo', o: ['مدير', 'مديرة', 'مفتش تربوي', 'مفتشة تربوية'], d: () => 'مدير' },
    { k: 'unit', l: 'الوحدة المدرسية', t: 'text', auto: (f, e) => e.assigned || e.origin || '' },
    { k: 'lastMark', l: 'آخر نقطة التفتيش', t: 'text' }, { k: 'lastMarkDate', l: 'تاريخها', t: 'date' },
    { k: 'diplomas', l: 'الشهادات', t: 'text' }, { k: 'attendance', l: 'نسبة المواظبة الشهرية', t: 'text' },
    { sec: 'الحصة الملاحظة' },
    { k: 'subject', l: 'المادة', t: 'text', auto: (f, e) => e.subject || '' }, { k: 'lesson', l: 'الدرس الملاحظ', t: 'text' },
    { k: 'session', l: 'الحصة', t: 'text' }, { k: 'unitLesson', l: 'الوحدة', t: 'text' },
    { k: 'klass', l: 'القسم', t: 'text' }, { k: 'pupils', l: 'عدد التلاميذ', t: 'text' },
    { k: 'boys', l: 'ذكور', t: 'text' }, { k: 'girls', l: 'إناث', t: 'text' }, { k: 'present', l: 'الحاضرون منهم', t: 'text' },
    ...(() => { const out = []; let n = 0; Docs.VISIT.forEach(([g, , inds]) => { out.push({ sec: 'مستويات التقويم: ' + g.replace(/ـ/g, '') }); inds.forEach(ind => out.push({ k: 'ev' + (n++), l: ind, t: 'select', o: Docs.VISIT_LEVELS, full: true })); }); return out; })(),
    { sec: 'ملاحظات وتوجيهات' },
    { k: 'n1', l: 'مدى استجابة الاستاذ(ة) للتوجيهات', t: 'textarea', full: true },
    { k: 'n2', l: 'النواحي التي تحتاج إلى تتبع', t: 'textarea', full: true },
    { k: 'n3', l: 'الخطة العلاجية المتفق على تنفيذها خلال هذه الزيارة', t: 'textarea', full: true },
    { k: 'n4', l: 'قابلية الاستاذ(ة) للنمو المهني', t: 'textarea', full: true },
    { k: 'overall', l: 'التقدير الإجمالي', t: 'textarea', full: true },
    { k: 'withHeader', l: 'إدراج رأسية المؤسسة أعلى التقرير', t: 'check', d: () => false, full: true }
  ],
  monthly: [
    { sec: 'الشهر' },
    { k: 'month', l: 'الشهر', t: 'select', o: MONTHS.map((m, i) => [String(i + 1), m]), d: () => String(new Date().getMonth() + 1) },
    { k: 'year', l: 'السنة', t: 'number', d: () => new Date().getFullYear() },
    { k: 'city', l: 'وحرر في', t: 'text', d: () => S().city }, { k: 'date', l: 'بتاريخ', t: 'date', d: todayIso }
  ]
};

function pageEditor(v, arg) {
  const type = arg.type;
  const T = TYPES[type];
  const fields = FORMS[type].filter(x => x.k);
  let variant = (arg.variant && window.DocCustom && DocCustom.byId(arg.variant)) || null;
  const needsEmp = !T.noEmp;
  // state
  const rec = arg.recordId ? DB.records.find(r => r.id === arg.recordId) : null;
  const st = { empId: rec ? rec.empId : (arg.empId || ''), f: {}, touched: new Set(), recordId: rec ? rec.id : null, mode: T.page === 'a4' ? (S().a4Two ? 'two' : 'single') : (S().twoCopies === false ? 'single' : 'two'),
    instId: (rec && rec.instId && instList().some(i => i.id === rec.instId)) ? rec.instId : curInst().id };
  if (rec) { Object.assign(st.f, rec.f); fields.forEach(x => st.touched.add(x.k)); }
  else fields.forEach(x => { if (x.d) st.f[x.k] = x.d(); });
  if (arg.preset) Object.assign(st.f, arg.preset);
  const emp = () => empById(st.empId) || {};

  v.innerHTML = `
    <div class="page-h">
      <button class="btn" id="back">${ic('back')} رجوع</button>
      <h1>${T.icon} ${T.title}</h1><span class="tag" id="vTag" style="${variant ? '' : 'display:none'}">${variant ? 'نسخة مخصصة: ' + esc(variant.name) : ''}</span>${rec ? '<span class="tag">تعديل وثيقة محفوظة</span>' : ''}
      <span class="sp"></span>
      <div class="seg" id="mode" title="${T.page === 'a4' ? 'نسختان مصغّرتان إلى A5 في ورقة A4 أفقية، أو نسخة واحدة بالحجم الكامل' : 'نسختان A5 في ورقة A4 أفقية، أو نسخة واحدة مكبّرة'}"><button data-m="two">نسختان (A4 أفقي)</button><button data-m="single">نسخة واحدة (A4)</button></div>
      <button class="btn" id="custBtn" title="نسخة خاصة بمؤسستك من هذه الوثيقة مع بقاء الأصل">${ic('edit')} تخصيص النموذج</button>${variant ? '<button class="btn" id="origBtn">النموذج الأصلي</button>' : ''}
      <button class="btn" id="saveRec">${ic('save')} حفظ في السجل</button>
      ${window.APP_WORD === false ? '' : `<button class="btn" id="word" title="تحويل الوثيقة إلى ملف Word قابل للتعديل (بعد التفعيل)">${ic('file')} حفظ Word</button>`}
      ${window.Stamp ? Stamp.chk() : ''}
      <button class="btn" id="pdf">${ic('pdf')} حفظ PDF</button>
      <button class="btn pri" id="print">${ic('print')} طباعة</button>
    </div>
    <div class="editor">
      <div class="card form"><div class="card-b" id="form"></div></div>
      <div class="prev-wrap"><div class="prev-box" id="pbox"><iframe id="pframe"></iframe>${LIC.active ? '' : `<div class="wm"><span>${licText()}</span></div>`}</div></div>
    </div>`;

  const form = $('#form');
  let html = '';
  if (instList().length > 1) {
    html += `<div class="sec-t">المؤسسة</div><div class="fld"><select class="inp" id="instSel">${instList().map(i => `<option value="${i.id}">${esc(i.school || 'مؤسسة بدون اسم')}</option>`).join('')}</select></div>`;
  }
  if (needsEmp) {
    html += `<div class="sec-t">الموظف</div><div class="fld"><div class="picker" id="picker">
      <div class="search">${ic('search')}<input class="inp" id="pk" placeholder="ابحث بالاسم أو رقم التأجير..." autocomplete="off"></div><div class="list"></div></div>
      <div id="chip"></div></div>`;
  }
  html += '<div class="fgrid">';
  FORMS[type].forEach(x => {
    if (x.sec) { html += `<div class="sec-t full">${x.sec}</div>`; return; }
    const id = 'f_' + x.k;
    let input;
    if (x.t === 'select') input = `<select class="inp" id="${id}" data-k="${x.k}"><option value=""></option>${x.o.map(o => Array.isArray(o) ? `<option value="${esc(o[0])}">${esc(o[1])}</option>` : `<option>${esc(o)}</option>`).join('')}</select>`;
    else if (x.t === 'combo') input = `<input class="inp" id="${id}" data-k="${x.k}" list="${id}_l"${x.dir ? ` dir="${x.dir}"` : ''}><datalist id="${id}_l">${(x.o || (x.oFn ? x.oFn(st.f) : [])).map(o => `<option value="${esc(o)}">`).join('')}</datalist>`;
    else if (x.t === 'rows') input = `<div class="rows-ed" id="${id}_g"></div><textarea class="inp" id="${id}" data-k="${x.k}" hidden></textarea>`;
    else if (x.t === 'check') input = `<label class="chk"><input type="checkbox" id="${id}" data-k="${x.k}"> ${x.l}</label>`;
    else if (x.t === 'textarea') input = `<textarea class="inp" id="${id}" data-k="${x.k}" rows="4"></textarea>`;
    else input = `<input class="inp" id="${id}" data-k="${x.k}" type="${x.t}"${x.dir ? ` dir="${x.dir}"` : ''}>`;
    html += `<div class="fld ${x.full ? 'full' : ''}">${x.t === 'check' ? '' : `<label for="${id}">${x.l}${x.auto ? ' <span class="muted" style="font-weight:400">(تلقائي)</span>' : ''}</label>`}${input}${x.hint ? `<span class="hint">${x.hint}</span>` : ''}</div>`;
  });
  html += '</div>';
  if (type === 'monthly') html += `<div id="mInfo" class="muted" style="font-size:12.5px;line-height:1.7"></div><button class="btn sm" id="toAbs" style="margin-top:6px">${ic('cal')} مراجعة سجل الغياب</button>`;
  if (['resume', 'resume2', 'resumeDir'].includes(type)) html += `<div class="sec-t" style="margin-top:12px">الربط مع «الغياب والرخص»</div>
    <div class="fld"><select class="inp" id="absPick"></select><span class="hint">تُملأ خانات «بعد» و«من» و«إلى» و«الحالة» تلقائيا من الرخصة أو الغياب المسجل للموظف.</span></div>
    <div class="btn-row" style="margin-top:2px"><button class="btn sm" id="fromLast">جلب آخر رخصة/غياب للموظف</button><button class="btn sm" id="toAbsReg">${ic('cal')} سجل الغياب والرخص</button></div>`;
  if (type === 'counterExam') html += `<button class="btn sm" id="lastMed" style="margin-top:2px">جلب آخر شهادة طبية للموظف</button>`;
  form.innerHTML = html;

  if ($('#instSel')) {
    $('#instSel').value = st.instId;
    $('#instSel').onchange = e => {
      st.instId = e.target.value;
      const city = instById(st.instId).city;
      fields.forEach(x => { if (x.k === 'city') st.f.city = city; });
      fillInputs(); refresh();
    };
  }
  // recompute auto fields
  const recompute = () => {
    fields.forEach(x => {
      if (x.auto && !st.touched.has(x.k)) st.f[x.k] = x.auto(st.f, emp());
    });
  };
  // 1.9.4: grid of lines (t:'rows'): every line is «cell | cell | cell» in the stored text, typed in its own boxes (e.g. subject | count | notes)
  const drawRows = x => {
    const el = $('#f_' + x.k), g = $('#f_' + x.k + '_g'); if (!el || !g) return;
    if (g.dataset.v === el.value && g.children.length) return;          // the grid already shows this text (do not redraw while typing)
    g.dataset.v = el.value;
    const cols = x.cols || [['الموضوع', '70%'], ['العدد', '18%']];
    const R = String(el.value || '').split('\n').filter(l => l.trim() !== '').map(l => l.split('|').map(c => c.trim()));
    if (!R.length) R.push([]);
    const rowHtml = r => `<tr>${cols.map((c, j) => `<td><input class="inp" data-c="${j}" value="${esc(r[j] || '')}" placeholder="${esc(c[0])}"></td>`).join('')}<td class="rw-x"><button type="button" class="btn sm icon danger" data-rx title="حذف السطر">✕</button></td></tr>`;
    g.innerHTML = `<table class="rows-t"><thead><tr>${cols.map(c => `<th style="width:${c[1]}">${esc(c[0])}</th>`).join('')}<th></th></tr></thead><tbody>${R.map(rowHtml).join('')}</tbody></table>
      <div class="btn-row" style="margin-top:6px"><button type="button" class="btn sm" data-radd>${ic('plus')} إضافة سطر</button>${x.presets ? `<select class="inp" data-rpre style="width:auto;max-width:220px"><option value="">نماذج جاهزة للتعبئة…</option>${x.presets.map((p, i) => `<option value="${i}">${esc(p[0])}</option>`).join('')}</select>` : ''}</div>`;
    const commit = () => {
      const lines = $$('tbody tr', g).map(tr => $$('input', tr).map(i => i.value.replace(/[|\n]/g, ' ').trim())).map(c => { while (c.length && !c[c.length - 1]) c.pop(); return c.join(' | '); }).filter(Boolean);
      el.value = lines.join('\n'); g.dataset.v = el.value; el.dispatchEvent(new Event('input'));
    };
    const wire = tr => { $$('input', tr).forEach(i => i.oninput = commit); const b = $('[data-rx]', tr); if (b) b.onclick = () => { tr.remove(); if (!$('tbody tr', g)) $('tbody', g).insertAdjacentHTML('beforeend', rowHtml([])), wire($('tbody tr', g)); commit(); }; };
    $$('tbody tr', g).forEach(wire);
    $('[data-radd]', g).onclick = () => { $('tbody', g).insertAdjacentHTML('beforeend', rowHtml([])); const tr = $('tbody tr:last-child', g); wire(tr); $('input', tr).focus(); };
    const pre = $('[data-rpre]', g);
    if (pre) pre.onchange = () => { if (pre.value === '') return; el.value = x.presets[+pre.value][1]; g.dataset.v = ''; el.dispatchEvent(new Event('input')); };
  };
  const fillInputs = () => {
    fields.forEach(x => {
      const el = $('#f_' + x.k);
      if (!el) return;
      if (x.t === 'rows') { el.value = st.f[x.k] == null ? '' : st.f[x.k]; drawRows(x); return; }
      if (x.t === 'combo' && x.oFn) { const dl = $('#f_' + x.k + '_l'), L = x.oFn(st.f), key = L.join('\u0001'); if (dl && dl.dataset.k !== key) { dl.innerHTML = L.map(o => `<option value="${esc(o)}">`).join(''); dl.dataset.k = key; } }
      if (x.t === 'check') el.checked = !!st.f[x.k];
      else if (document.activeElement !== el) el.value = st.f[x.k] == null ? '' : st.f[x.k];
      el.classList.toggle('auto', !!x.auto && !st.touched.has(x.k));
    });
  };
  fields.forEach(x => {
    const el = $('#f_' + x.k);
    const h = () => {
      st.f[x.k] = x.t === 'check' ? el.checked : el.value;
      if (el.type !== 'checkbox' && document.activeElement === el) fields.filter(y => y.dep === x.k).forEach(y => { st.f[y.k] = ''; st.touched.delete(y.k); });
      if (x.auto) { if (el.value === '') st.touched.delete(x.k); else st.touched.add(x.k); }
      recompute(); fillInputs(); refresh();
    };
    el.addEventListener('input', h); el.addEventListener('change', h);
  });

  // employee picker
  if (needsEmp) {
    const pk = $('#pk'), box = $('#picker'), list = $('.list', box);
    let hl = 0, items = [];
    const showChip = () => {
      const e = empById(st.empId), chip = $('#chip'); if (!chip) return;   // the page may have been left before the blur timer fires
      chip.innerHTML = e ? `<div class="emp-chip">${ic('user', 'style="width:22px;height:22px;color:var(--pri)"')}<div><b>${esc(fullName(e))}</b><br>${esc(e.cadre || '')} — ${esc(e.ppr || '')}</div></div>` : '';
      pk.value = e ? empLabel(e) : '';
    };
    const drawList = () => {
      const q = pk.value.trim().toLowerCase();
      items = sortedEmps().filter(e => !q || empLabel(e).toLowerCase().includes(q) || (e.lastFr + ' ' + e.firstFr).toLowerCase().includes(q));
      hl = Math.min(hl, Math.max(0, items.length - 1));
      list.innerHTML = items.length ? items.map((e, i) => `<div class="it ${i === hl ? 'hl' : ''}" data-i="${i}"><span>${esc(fullName(e))}</span><small>${esc(e.ppr)}</small></div>`).join('') : '<div class="it muted">لا توجد نتائج</div>';
      $$('.it[data-i]', list).forEach(d => d.onmousedown = ev => { ev.preventDefault(); pick(items[+d.dataset.i]); });
    };
    const pick = e => {
      st.empId = e.id; box.classList.remove('open'); pk.blur(); showChip();
      if (['resume', 'resume2', 'resumeDir'].includes(type) && !st.touched.has('from')) fillFromLast(true);
      if (type === 'counterExam' && !st.touched.has('from')) fillLastMed(true);
      recompute(); fillInputs(); refresh(); drawAbsPick();
    };
    pk.onfocus = () => { pk.select(); hl = 0; drawList(); box.classList.add('open'); };
    pk.oninput = () => { hl = 0; drawList(); box.classList.add('open'); };
    pk.onblur = () => setTimeout(() => { box.classList.remove('open'); showChip(); }, 120);
    pk.onkeydown = ev => {
      if (ev.key === 'ArrowDown') { hl = Math.min(hl + 1, items.length - 1); drawList(); ev.preventDefault(); }
      if (ev.key === 'ArrowUp') { hl = Math.max(hl - 1, 0); drawList(); ev.preventDefault(); }
      if (ev.key === 'Enter' && items[hl]) { pick(items[hl]); ev.preventDefault(); }
      if (ev.key === 'Escape') pk.blur();
    };
    showChip();
  }
  // the absence entries (section «الغياب والرخص») of the chosen employee, newest first
  const empAbs = () => absenceEntries().filter(a => a.rec.empId === st.empId).sort((p, q) => q.to.localeCompare(p.to) || q.from.localeCompare(p.from));
  const afterOf = reason => { reason = String(reason || '').trim(); return reason === 'غياب' ? 'تغيب أو انقطاع العمل' : reason || 'تغيب أو انقطاع العمل'; };
  const applyAbs = (a, silent) => {
    st.f.from = a.from; st.f.to = a.to; st.f.afterType = afterOf(a.reason);
    ['from', 'to', 'afterType'].forEach(k => { st.touched.add(k); });
    st.touched.delete('case'); st.touched.delete('otherCase'); st.touched.delete('resumeDate'); st.touched.delete('duration');
    recompute(); fillInputs(); refresh();
    if (!silent) toast('تم جلب: ' + a.reason + ' ' + fmtDate(a.from) + ' ← ' + fmtDate(a.to));
  };
  const fillFromLast = silent => {
    const last = empAbs()[0];
    if (!last) { if (!silent) toast('لا توجد رخصة أو غياب مسجل لهذا الموظف'); return; }
    applyAbs(last, silent);
  };
  // 1.9.3: list of every absence of the employee, picked to fill the resume form (link with «الغياب والرخص»)
  const drawAbsPick = () => {
    const sel = $('#absPick'); if (!sel) return;
    const L = st.empId ? empAbs() : [];
    sel.innerHTML = `<option value="">${st.empId ? (L.length ? 'اختر الرخصة أو الغياب المراد استئناف العمل بعده…' : 'لا توجد رخصة أو غياب مسجل لهذا الموظف') : 'اختر الموظف أولا'}</option>` + L.map((a, i) => `<option value="${i}">${esc(a.reason)} — ${fmtDate(a.from)} ← ${fmtDate(a.to)} (${esc(durationText(daysBetween(a.from, a.to)))})</option>`).join('');
    sel.disabled = !L.length;
    sel.onchange = () => { if (sel.value === '') return; applyAbs(L[+sel.value], false); sel.value = ''; };
  };
  const medRecs = () => DB.records.filter(r => r.empId === st.empId && ['medical', 'medicalDir'].includes(r.type) && r.f && r.f.from && !r.f.excluded)
    .sort((p, q) => q.f.from.localeCompare(p.f.from));
  const fillLastMed = silent => {
    const r = medRecs()[0];
    if (!r) { if (!silent) toast('لا توجد شهادة طبية مسجلة لهذا الموظف'); return; }
    st.f.from = r.f.from; st.f.duration = r.f.duration || durationText(daysBetween(r.f.from, r.f.to)); st.f.doctor = r.f.doctor || '';
    ['from', 'duration', 'doctor'].forEach(k => st.touched.add(k));
    fillInputs(); refresh();
    if (!silent) toast('تم جلب الشهادة الطبية بتاريخ ' + fmtDate(r.f.from));
  };
  if ($('#lastMed')) $('#lastMed').onclick = () => { if (!st.empId) return toast('اختر الموظف أولا', true); fillLastMed(false); };
  if ($('#fromLast')) $('#fromLast').onclick = () => { if (!st.empId) return toast('اختر الموظف أولا', true); fillFromLast(false); };
  if ($('#toAbs')) $('#toAbs').onclick = () => go('absences', { y: +st.f.year, m: +st.f.month });
  if ($('#toAbsReg')) $('#toAbsReg').onclick = () => { const d = String(st.f.from || todayIso()); go('absences', { y: +d.slice(0, 4), m: +d.slice(5, 7) }); };
  drawAbsPick();

  // mode
  if ($('#mode')) {
    const drawMode = () => $$('#mode button').forEach(b => b.classList.toggle('on', b.dataset.m === st.mode));
    $$('#mode button').forEach(b => b.onclick = () => { st.mode = b.dataset.m; if (T.page === 'a4') { S().a4Two = st.mode === 'two'; persist(); } drawMode(); layoutPreview(); refresh(); });
    drawMode();
  }

  const ctx = () => {
    const c = { s: settingsFor(st.instId), e: emp(), f: st.f };
    if (type === 'leave') c.history = st.f.withHistory ? historyFor(st.empId, st.f.date, st.recordId) : [];
    if (type === 'exceptional') c.history = st.f.withHistory ? historyFor(st.empId, st.f.date, st.recordId).filter(h => /استثنائية/.test(h.reason)) : [];
    if (type === 'counterExam') {
      const now = new Date(); const sy = now.getMonth() >= 8 ? now.getFullYear() : now.getFullYear() - 1;
      c.prevCerts = st.f.withTable ? medRecs().filter(r => r.f.from >= `${sy}-09-01` && r.f.from !== st.f.from && r.id !== st.recordId)
        .map(r => ({ from: r.f.from, duration: r.f.duration || durationText(daysBetween(r.f.from, r.f.to)), doctor: r.f.doctor, notes: '' })) : [];
    }
    if (type === 'monthly') c.rows = monthRows(+st.f.year, +st.f.month);
    return c;
  };
  const rawHtml = mode => buildDocHtml(type, ctx(), { base: BASE, mode: mode || st.mode });
  const docHtml = mode => Docs.bidi(variant && window.DocCustom ? DocCustom.apply(rawHtml(mode), variant.rules) : rawHtml(mode));
  const landscape = () => isLandscape(type, { mode: st.mode });

  // preview
  const frame = $('#pframe'), pbox = $('#pbox');
  const layoutPreview = () => {
    const land = landscape();
    const W = land ? 1123 : 794, H = land ? 794 : 1123;
    const avail = pbox.parentElement.clientWidth - 32;
    const maxH = window.innerHeight - 190;
    const sc = Math.min(avail / W, land ? 10 : maxH / H, 1.3);
    frame.style.width = W + 'px'; frame.style.height = H + 'px';
    frame.style.transform = `scale(${sc})`;
    pbox.style.width = W * sc + 'px'; pbox.style.height = H * sc + 'px';
  };
  let rt = null;
  const refresh = () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      frame.srcdoc = docHtml();
      if (type === 'monthly') {
        const rows = monthRows(+st.f.year, +st.f.month);
        $('#mInfo').innerHTML = `تحتسب اللائحة تلقائيا من سجل الغياب: <b>${rows.length}</b> حالة، مجموع <b>${rows.reduce((s, r) => s + r.days, 0)}</b> يوم غياب خلال الشهر.`;
      }
    }, 120);
  };
  window.onresize = () => { if (current === 'editor') layoutPreview(); };

  // save / print
  const validate = () => {
    if (needsEmp && !st.empId) { toast('المرجو اختيار الموظف', true); return false; }
    if (st.f.from && st.f.to && st.f.to < st.f.from) { toast('تاريخ النهاية قبل تاريخ البداية', true); return false; }
    return true;
  };
  const saveRecord = () => {
    if (type === 'monthly') return null;
    const now = new Date().toISOString();
    const e = emp();
    const snap = { name: fullName(e), ppr: e.ppr, cadre: e.cadre };
    let r = st.recordId && DB.records.find(x => x.id === st.recordId);
    if (r) Object.assign(r, { empId: st.empId, instId: st.instId, f: Object.assign({}, st.f), updated: now, snap, variant: variant ? variant.id : '' });
    else { r = { id: uid('r'), type, empId: st.empId, instId: st.instId, f: Object.assign({}, st.f), created: now, updated: now, snap, variant: variant ? variant.id : '' }; DB.records.push(r); st.recordId = r.id; }
    persist(); renderNav();
    guardNote(st.empId, st.f.from, st.f.to);
    return r;
  };
  $('#custBtn').onclick = () => DocCustom.dialog({ type, title: T.title, v: variant, html: rawHtml(), cb: nv => go('editor', Object.assign({}, arg, { variant: nv ? nv.id : '' })) });
  if ($('#origBtn')) $('#origBtn').onclick = () => go('editor', Object.assign({}, arg, { variant: '' }));
  $('#saveRec').style.display = type === 'monthly' ? 'none' : '';
  $('#saveRec').onclick = () => { if (!validate()) return; saveRecord(); toast('تم الحفظ في السجل'); };
  const fname = () => { const e = emp(); return type === 'monthly' ? `لائحة_الغياب_${MONTHS[+st.f.month - 1]}_${st.f.year}` : `${T.title}_${fullName(e)}`.replace(/\s+/g, '_').replace(/[\\/:*?"<>|]/g, ''); };
  if ($('#stmChk')) $('#stmChk').onchange = e => { Stamp.set(e.target.checked); refresh(); };
  $('#print').onclick = async () => {
    if (!validate()) return;
    saveRecord();
    const r = await window.api.print(docHtml(), landscape());
    if (r && r.locked) return lockedBox();
    if (r && r.ok) toast('تم إرسال الوثيقة إلى الطابعة');
  };
  $('#pdf').onclick = async () => {
    if (!validate()) return;
    saveRecord();
    const r = await window.api.pdf(docHtml(), landscape(), fname());
    if (r && r.locked) return lockedBox();
    if (r && r.ok) toast('تم حفظ الملف PDF');
  };
  if ($('#word')) $('#word').onclick = async () => {
    if (!validate()) return;
    if (!LIC.active) return lockedBox();
    saveRecord();
    const wh = docHtml(T.page === 'a4' ? 'single' : undefined);   // a Word file holds a single editable page
    const r = await window.api.docx(window.Stamp ? Stamp.strip(wh) : wh, fname());
    if (r && r.locked) return lockedBox();
    if (r && r.ok) toast('تم حفظ الوثيقة بصيغة Word'); else if (r && r.err) toast('تعذر إنشاء ملف Word', true);
  };
  $('#back').onclick = () => (arg.from ? go(arg.from) : go('documents', { cat: T.cat || undefined }));

  recompute(); fillInputs(); layoutPreview(); refresh();
  if (needsEmp && !st.empId) setTimeout(() => $('#pk').focus(), 50);
}

/* ================================================================= */
/* ABSENCES */
let absY = new Date().getFullYear(), absM = new Date().getMonth() + 1;
/* 1.9.3: link between «الغياب والرخص» and the resume-of-work documents */
const RESUME_MODELS = [['resume', 'النموذج المدرسي (نسختان A4 أفقي)'], ['resume2', 'النموذج المدرسي (A4)'], ['resumeDir', 'نموذج المديرية']];
const RESUME_TYPES = RESUME_MODELS.map(x => x[0]);
const hasResume = (empId, from, to) => DB.records.some(x => RESUME_TYPES.includes(x.type) && x.empId === empId && x.f && x.f.from === from && x.f.to === to);
function openResume(empId, from, to, reason, back) {
  const body = document.createElement('div');
  body.innerHTML = `<p style="margin:0 0 8px;line-height:1.8">محضر استئناف العمل بعد <b>${esc(reason)}</b> (${fmtDate(from)} ← ${fmtDate(to)}). اختر النموذج:</p>
    <div class="btn-row" style="flex-direction:column;align-items:stretch">${RESUME_MODELS.map(([k, l]) => `<button class="btn" data-m="${k}">${esc(l)}</button>`).join('')}</div>`;
  modal({ title: 'محضر استئناف العمل', body, actions: [{ label: 'إلغاء' }] });
  $$('[data-m]', body).forEach(b => b.onclick = () => go('editor', { type: b.dataset.m, empId, preset: { from, to, afterType: String(reason || '').trim() === 'غياب' ? 'تغيب أو انقطاع العمل' : reason }, from: back || 'absences' }));
}
// ended absences of the school year for which no resume-of-work document was made yet
// 1.9.4: a resumption marked as done (green tick) leaves the list of the pending reports
const resKey = a => `${a.rec.empId}|${a.from}|${a.to}`;
const resDone = () => (DB.resumeDone = DB.resumeDone && typeof DB.resumeDone === 'object' ? DB.resumeDone : {});
function pendingResumes() {
  const t = todayIso(), y0 = MK.syStart(MK.curSy()) + '-09-01', D = resDone();
  return absenceEntries().filter(a => a.to < t && a.to >= y0 && a.reason !== 'إذن بالتغيب' && !D[resKey(a)] && !hasResume(a.rec.empId, a.from, a.to))
    .sort((p, q) => q.to.localeCompare(p.to));
}
function pageAbsences(v, arg) {
  if (arg && arg.y) { absY = arg.y; absM = arg.m; }
  v.innerHTML = `
    <div class="page-h"><h1>الغياب والرخص</h1><span class="sp"></span>
      <select class="inp" id="am" style="width:auto">${MONTHS.map((m, i) => `<option value="${i + 1}">${m}</option>`).join('')}</select>
      <input class="inp" id="ay" type="number" style="width:100px">
      <button class="btn" id="addAbs">${ic('plus')} تسجيل غياب</button>
      <button class="btn pri" id="printM">${ic('print')} لائحة التتبع الشهري</button>
      <button class="btn pri" id="printY" title="جدول الموسم الدراسي كله: أيام الغياب في كل شهر لكل موظف، المبرر وغير المبرر، أنواع الرخص">${ic('print')} التتبع الشامل</button></div>
    <div class="card" style="margin-bottom:16px"><div class="card-b kpis" id="akpi"></div></div>
    <div id="aPend"></div>
    <div class="card"><div class="card-h"><h3 id="aTitle"></h3></div><div id="aTable"></div></div>
    <p class="muted" style="font-size:12.5px;margin-top:10px">تُحتسب الغيابات تلقائيا من: طلبات الرخص، وصولات الشواهد الطبية، الاستفسارات، والغيابات المسجلة يدويا. يمكن استبعاد أي حالة من اللائحة الشهرية.</p>`;
  $('#am').value = absM; $('#ay').value = absY;
  const draw = () => {
    const rows = monthRows(absY, absM);
    const total = rows.reduce((s, r) => s + r.days, 0);
    const people = new Set(rows.map(r => r.rec.empId)).size;
    // excluded in month
    const mb = monthBounds(absY, absM);
    const excluded = DB.records.filter(r => r.f && r.f.excluded && r.f.from && r.f.to && overlap(r.f.from, r.f.to, mb.from, mb.to));
    $('#akpi').innerHTML = `<div>عدد الحالات: <b>${rows.length}</b></div><div>عدد الموظفين المعنيين: <b>${people}</b></div><div>مجموع أيام الغياب: <b>${total}</b></div>`;
    $('#aTitle').textContent = `الغياب خلال شهر ${MONTHS[absM - 1]} ${absY}`;
    { // ended absences without a «محضر استئناف العمل»: one click creates it
      const P = pendingResumes();
      $('#aPend').innerHTML = P.length ? `<div class="card" style="margin-bottom:16px;border-color:#e6c36a;background:#fffaf0"><div class="card-h"><h3>محاضر استئناف العمل المنتظرة (${P.length})</h3></div>
        <div class="card-b" style="padding:6px 16px"><table class="tbl"><tbody>${P.slice(0, 8).map((a, i) => `<tr><td class="name-cell"><b>${esc(recName(a.rec))}</b><small>${esc(a.reason)}</small></td><td class="num">${fmtDate(a.from)} ← ${fmtDate(a.to)}</td><td class="act" style="white-space:nowrap"><button class="btn sm pri" data-pr="${i}">إنشاء محضر الاستئناف</button> <button class="btn sm" data-prok="${i}" title="استأنف الموظف(ة) عمله: يُحذف من اللائحة" style="background:#e8f7ee;border-color:#2e9e5b;color:#1e7d45;font-weight:700">✔ استأنف عمله</button></td></tr>`).join('')}</tbody></table>
        ${P.length > 8 ? `<div class="muted" style="font-size:12px;margin-top:4px">و${P.length - 8} حالات أخرى…</div>` : ''}</div></div>` : '';
      $$('#aPend [data-pr]').forEach(b => b.onclick = () => { const a = P[+b.dataset.pr]; openResume(a.rec.empId, a.from, a.to, a.reason); });
      $$('#aPend [data-prok]').forEach(b => b.onclick = () => { const a = P[+b.dataset.prok]; resDone()[resKey(a)] = todayIso(); persist(); draw(); toast(`تم تسجيل استئناف ${recName(a.rec)} لعمله`); });
    }
    const line = (r, off) => `<tr data-id="${r.rec.id}" class="${off ? 'off' : ''}">
      <td class="name-cell"><b>${esc(r.name)}</b><small>${esc(r.ppr)}</small></td>
      <td><span class="tag ${r.rec.type}">${esc(typeTitle(r.rec.type))}</span></td>
      <td>${esc(r.reason)}</td>
      <td class="num">${fmtDate(r.fullFrom)} ← ${fmtDate(r.fullTo)}</td>
      <td class="num"><b>${r.days}</b></td>
      <td class="act">${r.rec.type === 'absence' ? `<button class="btn sm" data-a="edit">${ic('edit')}</button>` : `<button class="btn sm" data-a="open">فتح الوثيقة</button>`}
        ${hasResume(r.rec.empId, r.fullFrom, r.fullTo) ? `<span class="tag" title="تم إنشاء محضر استئناف العمل لهذه الفترة" style="background:#e3f4ea;color:#14653a">✓ استأنف</span>` : `<button class="btn sm" data-a="resume" title="محضر استئناف العمل بعد هذه الفترة">استئناف العمل</button>`}
        <button class="btn sm" data-a="toggle">${off ? 'إدراج' : 'استبعاد'}</button>
        ${r.rec.type === 'absence' ? `<button class="btn sm danger icon" data-a="del">${ic('trash')}</button>` : ''}</td></tr>`;
    const exRows = excluded.map(r => { const o = overlap(r.f.from, r.f.to, mb.from, mb.to); return { rec: r, name: recName(r), ppr: (empById(r.empId) || r.snap || {}).ppr || '', reason: (absenceOf({ ...r, f: { ...r.f, excluded: false } }) || {}).reason || '', fullFrom: r.f.from, fullTo: r.f.to, days: o.days }; });
    $('#aTable').innerHTML = (rows.length || exRows.length) ? `<table class="tbl"><thead><tr><th>الموظف</th><th>المصدر</th><th>السبب</th><th>الفترة الكاملة</th><th>أيام هذا الشهر</th><th></th></tr></thead>
      <tbody>${rows.map(r => line(r, false)).join('')}${exRows.map(r => line(r, true)).join('')}</tbody></table>` : '<div class="empty-state">لا يوجد غياب مسجل خلال هذا الشهر</div>';
    $$('#aTable tr[data-id]').forEach(tr => {
      const r = DB.records.find(x => x.id === tr.dataset.id);
      $$('[data-a]', tr).forEach(b => b.onclick = async () => {
        const a = b.dataset.a;
        if (a === 'toggle') { r.f.excluded = !r.f.excluded; persist(); draw(); renderNav(); }
        if (a === 'open') go('editor', { type: r.type, recordId: r.id, variant: r.variant || '', from: 'absences' });
        if (a === 'edit') absForm(r, draw);
        if (a === 'resume') { const row = rows.concat(exRows).find(x => x.rec.id === r.id); if (row) openResume(r.empId, row.fullFrom, row.fullTo, row.reason); }
        if (a === 'del' && await confirmBox('حذف هذا الغياب؟', 'حذف')) { DB.records = DB.records.filter(x => x.id !== r.id); persist(); draw(); renderNav(); }
      });
    });
  };
  draw();
  $('#am').onchange = e => { absM = +e.target.value; draw(); };
  $('#ay').onchange = e => { absY = +e.target.value || absY; draw(); };
  $('#addAbs').onclick = () => absForm(null, draw);
  $('#printM').onclick = () => go('editor', { type: 'monthly', preset: { month: String(absM), year: absY }, from: 'absences' });
  $('#printY').onclick = () => go('attoffStDoc', { kind: 'ao_year' });
}
// any reason text (old records, documents) -> index in ABS_REASONS, -1 if none
function reasonIdx(r) {
  r = String(r || '');
  if (/استيداع/.test(r)) return 0; if (/[إا]لحاق/.test(r)) return 1; if (/[أا]بوة/.test(r)) return 2; if (/ولادة/.test(r)) return 3;
  if (/قصيرة/.test(r)) return 5; if (/متوسطة/.test(r)) return 6; if (/طويلة/.test(r)) return 7; if (/مرض/.test(r)) return 5;
  if (/استثنائية/.test(r)) return 4; if (/تكليف/.test(r)) return 8; if (/تغيب|غياب|انقطاع/.test(r)) return 9;
  return -1;
}
function absForm(r, after) {
  const f = r ? Object.assign({}, r.f) : { from: todayIso(), to: todayIso(), reason: '' };
  const known = ABS_REASONS.includes(f.reason);
  const other = !!f.reason && !known;
  const body = document.createElement('div');
  body.innerHTML = `<div class="fgrid">
    <div class="fld full"><label>الموظف</label><select class="inp" id="aEmp"><option value=""></option>${staffEmps().map(e => `<option value="${e.id}">${esc(empLabel(e))}</option>`).join('')}</select></div>
    <div class="fld"><label>من</label><input class="inp" type="date" id="aFrom" value="${esc(f.from)}"></div>
    <div class="fld"><label>إلى</label><input class="inp" type="date" id="aTo" value="${esc(f.to)}"></div>
    <div class="fld full"><label>سبب الغياب <span style="color:var(--red)">*</span></label>
      <div class="abs-reasons" id="aReasons">${ABS_REASONS.map((x, i) => `<label class="rs"><input type="radio" name="aR" value="${i}" ${f.reason === x ? 'checked' : ''}><span>${x}</span></label>`).join('')}</div>
      <label class="rs rs-other"><input type="radio" name="aR" value="other" ${other ? 'checked' : ''}><span>سبب آخر:</span>
        <input class="inp" id="aOther" placeholder="يحدد (مثلا: إضراب، تكوين...)" value="${other ? esc(f.reason) : ''}" ${other ? '' : 'disabled'}></label></div>
    <div class="fld full"><label>ملاحظة</label><input class="inp" id="aNote" value="${esc(f.note || '')}"></div>
    <div class="full muted" id="aDays"></div></div>`;
  const upd = () => { $('#aDays', body).textContent = 'المدة: ' + (durationText(daysBetween($('#aFrom', body).value, $('#aTo', body).value)) || '—'); };
  const syncOther = () => { const on = $('input[name=aR][value=other]', body).checked; $('#aOther', body).disabled = !on; if (on) $('#aOther', body).focus(); };
  $$('input[name=aR]', body).forEach(x => x.onchange = syncOther);
  modal({ title: r ? 'تعديل غياب' : 'تسجيل غياب', body, actions: [{ label: ic('save') + ' حفظ', cls: 'pri', onClick: () => {
    const empId = $('#aEmp', body).value, from = $('#aFrom', body).value, to = $('#aTo', body).value;
    if (!empId || !from || !to) { toast('المرجو ملء الموظف والتواريخ', true); return false; }
    if (to < from) { toast('تاريخ النهاية قبل البداية', true); return false; }
    const pick = $('input[name=aR]:checked', body);
    if (!pick) { toast('المرجو اختيار سبب الغياب', true); return false; }
    const reason = pick.value === 'other' ? $('#aOther', body).value.trim() : ABS_REASONS[+pick.value];
    if (!reason) { toast('المرجو تحديد سبب الغياب', true); return false; }
    const nf = Object.assign(f, { from, to, reason, note: $('#aNote', body).value.trim() });
    const e = empById(empId); const now = new Date().toISOString();
    if (r) Object.assign(r, { empId, f: nf, updated: now, snap: { name: fullName(e), ppr: e.ppr, cadre: e.cadre } });
    else DB.records.push({ id: uid('r'), type: 'absence', empId, f: nf, created: now, updated: now, snap: { name: fullName(e), ppr: e.ppr, cadre: e.cadre } });
    persist(); after(); renderNav(); toast('تم الحفظ'); guardNote(empId, from, to);
  } }, { label: 'إلغاء' }] });
  if (r) $('#aEmp', body).value = r.empId;
  $('#aFrom', body).oninput = upd; $('#aTo', body).oninput = upd; upd();
}

/* ================================================================= */
/* RECORDS */
let recFilter = { type: '', q: '' };
function pageRecords(v) {
  v.innerHTML = `<div class="page-h"><h1>سجل الوثائق</h1><span class="sub" id="rc"></span></div>
    <div class="card"><div class="toolbar">
      <div class="search">${ic('search')}<input class="inp" id="rq" placeholder="بحث باسم الموظف..." value="${esc(recFilter.q)}"></div>
      <select class="inp" id="rt" style="width:auto"><option value="">كل الأنواع</option>${Object.entries(TYPES).filter(([k]) => k !== 'monthly').map(([k, t]) => `<option value="${k}">${t.title}</option>`).join('')}<option value="absence">غياب مسجل</option></select>
    </div><div id="rTable"></div></div>`;
  $('#rt').value = recFilter.type;
  const draw = () => {
    const q = recFilter.q.trim().toLowerCase();
    const list = DB.records.filter(r => (!recFilter.type || r.type === recFilter.type) && (!q || recName(r).toLowerCase().includes(q) || ((r.snap && r.snap.ppr) || '').includes(q)))
      .sort((a, b) => (b.updated || '').localeCompare(a.updated || ''));
    $('#rc').textContent = `${DB.records.length} عنصر`;
    $('#rTable').innerHTML = list.length ? `<table class="tbl"><thead><tr><th>التاريخ</th><th>الوثيقة</th><th>الموظف</th><th>التفاصيل</th><th></th></tr></thead><tbody>
      ${list.map(r => `<tr data-id="${r.id}"><td class="num muted">${fmtDate((r.updated || '').slice(0, 10))}</td><td><span class="tag ${r.type}">${esc(typeTitle(r.type))}</span></td>
      <td>${esc(recName(r))}</td><td class="muted">${esc(recDetail(r))}</td>
      <td class="act">${r.type !== 'absence' ? `<button class="btn sm" data-a="open">${ic('print')} فتح / طباعة</button>` : ''} <button class="btn sm danger icon" data-a="del">${ic('trash')}</button></td></tr>`).join('')}
      </tbody></table>` : '<div class="empty-state">لا توجد عناصر في السجل</div>';
    $$('#rTable tr[data-id]').forEach(tr => {
      const r = DB.records.find(x => x.id === tr.dataset.id);
      $$('[data-a]', tr).forEach(b => b.onclick = async () => {
        if (b.dataset.a === 'open') go('editor', { type: r.type, recordId: r.id, variant: r.variant || '', from: 'records' });
        if (b.dataset.a === 'del' && await confirmBox('حذف هذا العنصر من السجل؟ سيُحذف أيضا من احتساب الغياب.', 'حذف')) { DB.records = DB.records.filter(x => x.id !== r.id); persist(); draw(); renderNav(); }
      });
    });
  };
  draw();
  $('#rq').oninput = e => { recFilter.q = e.target.value; draw(); };
  $('#rt').onchange = e => { recFilter.type = e.target.value; draw(); };
}
function recDetail(r) {
  const f = r.f || {};
  const per = f.from ? `${fmtDate(f.from)} ← ${fmtDate(f.to)}` : '';
  switch (r.type) {
    case 'leave': return `رخصة ${f.leaveType || ''} ${per}`;
    case 'medical': return `شهادة طبية ${f.duration || ''} ${per}`;
    case 'inquiry': return `تغيب ${per}`;
    case 'resume': return `بعد ${f.afterType || ''} — استئناف ${fmtDate(f.resumeDate)}`;
    case 'certificate': return f.certType || '';
    case 'absence': return `${f.reason || ''} ${per}`;
    default: return [f.kindDetail || f.afterType || f.certType || '', per].filter(Boolean).join(' ');
  }
}

/* ================================================================= */
/* SETTINGS */
async function pageSettings(v) {
  await refreshLic();
  const g = DB.settings;
  const info = await window.api.info();
  const CYCLES = [['التعليم الابتدائي', 'ابتدائي'], ['التعليم الثانوي الإعدادي', 'ثانوي إعدادي'], ['التعليم الثانوي التأهيلي', 'ثانوي تأهيلي']];
  const TIF_DEF = { tifKingdom: 'ⵜⴰⴳⵍⴷⵉⵜ ⵏ ⵍⵎⵖⵔⵉⴱ', tifMinistry: 'ⵜⴰⵎⴰⵡⴰⵙⵜ ⵏ ⵓⵙⴳⵎⵉ ⴰⵏⴰⵎⵓⵔ ⴷ ⵓⵙⵍⵎⴷ ⴰⵎⵣⵡⴰⵔⵓ ⴷ ⵜⵓⵏⵏⵓⴼⴰ',
    tifAcademy: 'ⵜⴰⴽⴰⴷⵉⵎⵉⵜ ⵜⴰⵏⴳⵎⴰⵢⵜ ⵏ ⵓⵙⴳⵎⵉ ⴷ ⵓⵙⵎⴰⵢⵏ', tifDirectorate: 'ⵜⴰⵎⵀⵍⴰ ⵜⴰⵙⴳⴰⵡⴰⵏⵜ' };
  const F = [['school', 'اسم المؤسسة'], ['director', 'اسم المدير'], ['cycle', 'السلك', 'cycle'], ['orgMode', 'نوع المؤسسة', 'org'], ['city', 'المدينة أو الجماعة (حرر ب)'], ['directorate', 'المديرية الإقليمية'],
    ['academy', 'الأكاديمية'], ['ministry', 'الوزارة'], ['email', 'البريد الإلكتروني لإرسال لائحة الغياب (اختياري)'],
    ['phone', 'هاتف المؤسسة'], ['address', 'عنوان المؤسسة'],
    ['gresa', 'رمز المؤسسة (GRESA)'], ['commune', 'الجماعة'],
    ['schoolFr', 'اسم المؤسسة بالفرنسية (للوثائق الفرنسية)'], ['cityFr', 'المدينة بالفرنسية (مثال: IMSOUANE)'],
    ['directorateFr', 'المديرية الإقليمية بالفرنسية (مثال: DIRECTION PROVINCIALE AGADIR IDA OUTANANE)'],
    ['-', 'الرأسية بالأمازيغية (يسار الشعار في الرأسية النصية): سطر لكل سطر عربي. لتقسيم خانة على سطرين افصل بينهما بالعلامة / . الجهة واسم المديرية يُكتبان تلقائيا بتيفيناغ ويمكن تصحيحهما.'],
    ['tifKingdom', 'المملكة المغربية (بالأمازيغية)', 'tif'], ['tifMinistry', 'الوزارة (بالأمازيغية)', 'tif'],
    ['tifAcademy', 'الأكاديمية (بالأمازيغية)', 'tif'], ['tifRegion', 'الجهة (بالأمازيغية) — اتركها فارغة للكتابة التلقائية', 'tifr'], ['tifDirectorate', 'المديرية الإقليمية (بالأمازيغية)', 'tif']];
  v.innerHTML = `<div class="page-h"><h1>الإعدادات</h1><span class="sp"></span>
      <div class="seg no-i18n" id="langSeg" title="لغة البرنامج / Langue du programme"><button data-l="ar" class="${(g.lang || 'ar') === 'ar' ? 'on' : ''}">العربية</button><button data-l="fr" class="${g.lang === 'fr' ? 'on' : ''}">Français</button></div></div>
    <div class="card" style="margin-bottom:16px"><div class="card-b inst-bar">
      <label class="b" for="instPick">المؤسسة الحالية :</label>
      <select class="inp" id="instPick" style="width:auto;min-width:280px"></select>
      <button class="btn sm" id="instAdd">${ic('plus')} إضافة مؤسسة</button>
      <button class="btn sm" id="instDup">نسخ المؤسسة الحالية</button>
      <button class="btn sm danger" id="instDel">${ic('trash')} حذف</button>
      <span class="muted" style="font-size:12px">لكل مؤسسة معطياتها ورأسيتها الخاصة. تُستعمل المؤسسة الحالية افتراضيا في الوثائق.</span>
    </div></div>
    <div class="settings-grid">
      <div class="card"><div class="card-h"><h3>معطيات المؤسسة</h3></div><div class="card-b" id="instFields"></div></div>
      <div class="grid">
        <div class="card"><div class="card-h"><h3>رأسية الوثائق</h3></div><div class="card-b">
          <div class="radio-row"><label><input type="radio" name="hm" value="image"> صورة الرأسية الخاصة بالمؤسسة</label><label><input type="radio" name="hm" value="text"> نص بالعربية + الشعار الملكي + نص بالأمازيغية</label></div>
          <div class="fld" id="hsBox" style="margin:2px 0 10px"><label>شكل الرأسية النصية</label><select class="inp" id="hStyle">${Docs.HDR_STYLES.map(([k, l]) => `<option value="${k}" ${(g.headerStyle || 'ruqaa') === k ? 'selected' : ''}>${l}</option>`).join('')}</select></div>
          <div class="fld" id="hfBox" style="margin:2px 0 10px"><label>خط الرأسية النصية (اختياري: اختر أو اكتب اسم أي خط مثبت في حاسوبك)</label>
            <div class="btn-row"><input class="inp" id="hFont" list="hFontList" value="${esc(g.hdrFont || '')}" placeholder="الافتراضي: Sakkal Majalla" style="max-width:340px" autocomplete="off"><datalist id="hFontList"></datalist><button class="btn sm" id="hFontReset">الخط الافتراضي</button></div></div>
          <div class="btn-row" style="margin-bottom:10px">
            <button class="btn pri sm" id="pickImg">${ic('up')} تحميل صورة الرأسية</button>
            <button class="btn gold sm" id="designLh" title="تصميم ترويسة أو شعار المؤسسة بالمصمم ثم اعتماده">🎨 تصميم ترويسة / شعار</button>
            <button class="btn sm danger" id="delImg">${ic('trash')} حذف الصورة</button>
          </div>
          <label class="chk" style="margin:0 0 8px"><input type="checkbox" id="lhNorm"> توحيد حجم صورة الرأسية: قص الهوامش البيضاء ومدها يمينا ويسارا لتملأ أعلى الصفحة بنفس الحجم في كل المؤسسات</label>
          <div class="hdr-prev" id="dropZone"><iframe id="hp" style="width:100%;height:120px;border:0;display:block;pointer-events:none" scrolling="no"></iframe></div>
          <p class="muted" id="hdrHint" style="font-size:12px;margin:8px 0 0">يمكنك أيضا سحب صورة الرأسية وإفلاتها هنا. الصيغ المقبولة: PNG أو JPG، ويُفضل عرض الصورة كاملا دون هوامش.</p>
        </div></div>
        <div class="card"><div class="card-h"><h3>الموسم الدراسي</h3></div><div class="card-b">
          <div class="btn-row"><label class="b" for="sySet">الموسم الدراسي النشط :</label><select class="inp" id="sySet" style="width:auto;min-width:200px"></select>
            <label class="chk"><input type="checkbox" id="syAuto" ${MK.isAutoSy() ? 'checked' : ''}> تلقائي حسب التاريخ</label></div>
          <p class="muted" style="font-size:12.5px;line-height:1.7;margin:8px 0 0">تعمل كل الأقسام (بطاقة التلاميذ، المواظبة، ${isSecCycle() ? 'التقويم' : 'الروائز'}، التواصل، السبورة المرجعية، الميزانية، العطل، لوحة القيادة) على الموسم النشط، ويمكن تغييره أيضا من القائمة الجانبية. تبقى معطيات كل موسم محفوظة للرجوع إليها.</p>
        </div></div>
        <div class="card"><div class="card-h"><h3>العطل المدرسية</h3></div><div class="card-b">
          <p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.7">لائحة العطل الرسمية (الفترات البينية، الأعياد، عطلة منتصف السنة...) قابلة للتعديل، وتظهر العطلة القادمة في لوحة القيادة.</p>
          <div class="btn-row"><button class="btn" id="holMgr">${ic('cal')} عرض / تعديل لائحة العطل</button><button class="btn" id="holPrn">${ic('print')} طباعة اللائحة</button></div>
        </div></div>
        <div class="card"><div class="card-h"><h3>الطباعة</h3></div><div class="card-b">
          <label class="chk"><input type="checkbox" id="twoCopies" ${g.twoCopies !== false ? 'checked' : ''}> طباعة نسختين في ورقة A4 أفقية افتراضيا (نسخة للموظف ونسخة للأرشيف)</label>
          <label class="chk"><input type="checkbox" id="a4Two" ${g.a4Two ? 'checked' : ''}> الوثائق ذات الصفحة الكاملة (A4): طباعة نسختين مصغّرتين في ورقة أفقية افتراضيا (بدل نسخة واحدة)</label>
        </div></div>
        <div class="card"><div class="card-h"><h3>حماية البيانات بكلمة سر</h3></div><div class="card-b" id="protBox"></div>
          <div class="note2" style="margin:0 16px 14px;padding:9px 12px;border-radius:8px;background:#eef6f3;font-size:12.8px;line-height:1.9">${ic('lock', 'style="width:15px;height:15px;vertical-align:-3px"')} <b>حماية المعطيات الشخصية:</b> يحترم البرنامج القانون رقم 09.08 المتعلق بحماية الأشخاص الذاتيين تجاه معالجة المعطيات ذات الطابع الشخصي؛ تبقى جميع المعطيات (الموظفون، التلاميذ، الوثائق) مخزنة على حاسوبك وحده، <b>ولا يرتبط البرنامج بالإنترنت</b> ولا يرسل أي معطى إلى أي جهة.</div></div>
        <div class="card"><div class="card-h"><h3>البيانات والنسخ الاحتياطية</h3></div><div class="card-b">
          <p class="muted" style="margin-top:0;font-size:12.5px;line-height:1.7">تحفظ البيانات تلقائيا في: <span dir="ltr" style="font-family:monospace;font-size:11.5px">${esc(info.dataDir)}</span><br>ويتم إنشاء نسخة احتياطية يومية تلقائيا (آخر 30 يوما).</p>
          <div class="btn-row">
            <button class="btn" id="bExp">${ic('down')} تصدير نسخة احتياطية</button>
            <button class="btn" id="bImp">${ic('up')} استرجاع نسخة احتياطية</button>
            <button class="btn" id="bDir">${ic('folder')} فتح مجلد البيانات</button>
          </div>
        </div></div>
        <div class="card" id="unitsBox"></div>
        <div class="card" id="xferBox"></div>
        <div class="card" id="stampBox"></div>
      </div>
    </div>`;
  $$('#langSeg button').forEach(b => b.onclick = () => { g.lang = b.dataset.l === 'fr' ? 'fr' : ''; persist(); if (window.I18N) I18N.set(g.lang); renderNav(); renderFoot(); go('settings'); });
  const hp = $('#hp');
  const inst = () => curInst();
  const drawPick = () => {
    $('#instPick').innerHTML = instList().map(i => `<option value="${i.id}">${esc(i.school || 'مؤسسة بدون اسم')}</option>`).join('');
    $('#instPick').value = inst().id;
    $('#instDel').disabled = instList().length < 2;
  };
  const drawHdr = () => {
    const i = inst();
    const hasImg = !!i.letterhead;
    $('#delImg').style.display = hasImg ? '' : 'none';
    $('#lhNorm').checked = i.lhNorm !== false; $('#lhNorm').parentElement.style.display = hasImg ? '' : 'none';
    $$('[name=hm]').forEach(r => { r.checked = ((i.headerMode === 'image' && hasImg) ? 'image' : 'text') === r.value; });
    const html = buildDocHtml('inquiry', { s: S(), e: {}, f: {} }, { base: BASE, mode: 'single' });
    const z = (hp.clientWidth || 500) / 794;
    hp.srcdoc = html.replace('</style>', `.copy>*:not(.hdr):not(.hdr-img){display:none!important}.sheet.single{height:auto}.copy{height:auto!important}html,body{overflow:hidden}body{zoom:${z}}</style>`);
    hp.onload = () => { try { const d = hp.contentDocument; hp.style.height = Math.ceil(Math.max(d.documentElement.scrollHeight, d.body.scrollHeight) + 6) + 'px'; } catch (_) {} };
  };
  const drawFields = () => {
    const i = inst();
    $('#instFields').innerHTML = F.map(([k, l0, t]) => { let l = l0;
      if (k === '-') return `<div class="fld-sep">${l}</div>`;
      if (t === 'cycle') {
        const cur = i[k] || '';
        const opts = CYCLES.slice(); if (cur && !opts.some(o => o[0] === cur)) opts.push([cur, cur]);
        return `<div class="fld"><label>${l}</label><select class="inp" data-k="${k}"><option value="">— اختر السلك —</option>${opts.map(([v, lb]) => `<option value="${esc(v)}" ${v === cur ? 'selected' : ''}>${esc(lb)}</option>`).join('')}</select></div>`;
      }
      if (t === 'org') {
        if (Cyc.kind(i) !== 'pri') return '';          // collège / lycée are always one independent institution
        const single = i[k] === 'single', comm = i[k] === 'community';   // 1.9.4: «مدرسة جماعاتية» = one independent school (no units)
        return `<div class="fld org-fld"><label>${l} (التعليم الابتدائي)</label>
          <div class="org-opts">
            <label class="org-opt ${single ? 'on' : ''}"><input type="radio" name="orgMode" value="single" ${single ? 'checked' : ''}><span><b>مؤسسة / مدرسة مستقلة</b><small>دون وحدات مدرسية: مدرسة واحدة برمز GRESA واحد</small></span></label>
            <label class="org-opt ${comm ? 'on' : ''}"><input type="radio" name="orgMode" value="community" ${comm ? 'checked' : ''}><span><b>مدرسة جماعاتية</b><small>مؤسسة واحدة برمز GRESA واحد تستقبل تلاميذ عدة دواوير (الداخلية والنقل المدرسي)</small></span></label>
            <label class="org-opt ${single || comm ? '' : 'on'}"><input type="radio" name="orgMode" value="group" ${single || comm ? '' : 'checked'}><span><b>مجموعة مدرسية</b><small>تتكون من عدة وحدات: المركزية والفرعيات، ولكل وحدة رمز GRESA الخاص بها</small></span></label>
          </div></div>`;
      }
      if (t === 'tifr') { const auto = (() => { const r = Docs.regionOf(i.academy); return r ? 'ⵜⴰⵎⵏⴰⴹⵜ ' + Docs.tifName(r) : ''; })();
        return `<div class="fld"><label>${l}</label><input class="inp tif" data-k="${k}" value="${esc(i[k] || '')}" dir="ltr" placeholder="${esc(auto || 'ⵜⴰⵎⵏⴰⴹⵜ ...')}"></div>`; }
      if (k === 'school' && Cyc.kind(i) === 'pri' && Cyc.group(i)) l = 'اسم المجموعة المدرسية';
      if (k === 'school' && Cyc.kind(i) === 'pri' && i.orgMode === 'community') l = 'اسم المدرسة الجماعاتية';
      if (k === 'gresa') l = Cyc.kind(i) === 'pri' && Cyc.group(i) ? 'رمز المجموعة المدرسية (GRESA) — لكل وحدة رمزها في بطاقة «الوحدات المدرسية»' : (Cyc.kind(i) === 'pri' ? 'رمز المدرسة (GRESA)' : 'رمز المؤسسة (GRESA)');
      const val = t === 'tif' && (i[k] == null || String(i[k]).trim() === '') ? (TIF_DEF[k] || '') : (i[k] || '');
      return `<div class="fld"><label>${l}</label><input class="inp${t === 'tif' ? ' tif' : ''}" data-k="${k}" value="${esc(val)}" ${['email', 'schoolFr', 'cityFr', 'directorateFr', 'phone'].includes(k) ? 'dir="ltr"' : ''}${t === 'tif' ? ' dir="ltr" placeholder="ⵜⵉⴼⵉⵏⴰⵖ"' : ''}></div>`;
    }).join('');
    // 1.9.4: independent primary school  <->  school group (units): every section follows the choice
    const applyOrg = () => { try { if (window.Pupils && Pupils.normLv) Pupils.normLv(); } catch (_) {} try { if (window.Units) { Units.normSec(); Units.card($('#unitsBox')); } } catch (_) {} persist(); drawFields(); renderNav(); };
    $$('#instFields [name=orgMode]').forEach(r => r.onchange = async () => {
      if (!r.checked) return;
      const i = inst(), want = r.value, B = (DB.board = DB.board || {}), nUnits = (B.units || []).filter(u => u && u.name).length;
      const one = m => m === 'single' || m === 'community';
      if (one(want) && one(i.orgMode)) { i.orgMode = want; applyOrg(); return toast(want === 'community' ? 'اعتمدت مدرسة جماعاتية' : 'اعتمدت المدرسة مستقلة: لا وحدات مدرسية'); }
      if (one(want) && !one(i.orgMode)) {
        if (nUnits > 1 && !await confirmBox(`اعتماد <b>${esc(i.school || 'المؤسسة')}</b> مدرسة مستقلة: تُدمج الوحدات المسجلة (${nUnits}) في وحدة واحدة باسم المدرسة، وتُحذف الوحدات والفلاتر الخاصة بها من كل الخانات (الموظفون، التلاميذ، المواظبة، الشواهد...). يمكن الرجوع إلى «مجموعة مدرسية» وسيُستعاد سجل الوحدات. متابعة؟`, 'اعتماد')) { drawFields(); return; }
        if (nUnits > 1) B.unitsGroup = JSON.parse(JSON.stringify(B.units));          // kept to restore the group
        i.orgMode = want;
      } else if (want === 'group' && one(i.orgMode)) {
        i.orgMode = 'group';
        if (B.unitsGroup && B.unitsGroup.length && (B.units || []).length <= 1) { B.units = B.unitsGroup; }
      }
      applyOrg();
      toast(want === 'community' ? 'اعتمدت مدرسة جماعاتية: مؤسسة واحدة دون وحدات مدرسية' : want === 'single' ? 'اعتمدت المدرسة مستقلة: لا وحدات مدرسية' : 'اعتمدت مجموعة مدرسية: أضف الوحدات ورموز GRESA في بطاقة «الوحدات المدرسية»');
    });
    $$('#instFields [data-k]').forEach(el => el.oninput = () => {
      inst()[el.dataset.k] = el.value; persist(); drawHdr();
      if (el.dataset.k === 'cycle') applyOrg();
      if (el.dataset.k === 'school') { const o = $('#instPick').selectedOptions[0]; if (o) o.textContent = el.value || 'مؤسسة بدون اسم'; $('#brandSchool').textContent = el.value; }
    });
  };
  const drawAll = () => { drawPick(); drawFields(); drawHdr(); renderNav(); };
  const setImage = async dataUrl => {
    try {
      inst().letterhead = await shrinkImage(dataUrl);
      const z = await imageSize(inst().letterhead); if (z) { inst().letterheadW = z.w; inst().letterheadH = z.h; }
      await normalizeLetterhead(inst());
      inst().headerMode = 'image';
      persist(); drawHdr(); toast('تم اعتماد صورة الرأسية لـ ' + (inst().school || 'المؤسسة'));
    } catch (e) { toast(e.message, true); }
  };
  $('#instPick').onchange = e => { g.activeInst = e.target.value; persist(); drawAll(); };
  $('#instAdd').onclick = () => {
    const base = inst();
    const n = { id: uid('i'), school: '', director: '', city: base.city, directorate: base.directorate, academy: base.academy, ministry: base.ministry, cycle: base.cycle, tifKingdom: base.tifKingdom, tifMinistry: base.tifMinistry, tifAcademy: base.tifAcademy, tifRegion: base.tifRegion, tifDirectorate: base.tifDirectorate, email: '', headerMode: 'text', letterhead: null };
    instList().push(n); g.activeInst = n.id; persist(); drawAll();
    setTimeout(() => { const el = $('#instFields [data-k=school]'); if (el) el.focus(); }, 30);
    toast('أضيفت مؤسسة جديدة: املأ معطياتها وحمّل رأسيتها');
  };
  $('#instDup').onclick = () => {
    const n = Object.assign({}, inst(), { id: uid('i'), school: (inst().school || '') + ' (نسخة)' });
    instList().push(n); g.activeInst = n.id; persist(); drawAll();
  };
  $('#instDel').onclick = async () => {
    if (instList().length < 2) return;
    if (!await confirmBox(`حذف المؤسسة <b>${esc(inst().school || '')}</b> ورأسيتها من الإعدادات؟`, 'حذف')) return;
    const id = inst().id;
    g.institutions = instList().filter(i => i.id !== id); g.activeInst = g.institutions[0].id; persist(); drawAll();
  };
  $$('[name=hm]').forEach(r => r.onchange = async () => {
    if (r.value === 'image' && !inst().letterhead) { r.checked = false; const d = await window.api.openImage(); if (d) await setImage(d); else drawHdr(); return; }
    inst().headerMode = r.value; persist(); drawHdr();
  });
  if ($('#designLh')) $('#designLh').onclick = () => go('flyers', { cat: 'brand' });
  $('#pickImg').onclick = async () => { const d = await window.api.openImage(); if (d) setImage(d); };
  $('#delImg').onclick = async () => {
    if (!await confirmBox('حذف صورة الرأسية لهذه المؤسسة؟ ستُستعمل الرأسية النصية مع الشعار.', 'حذف')) return;
    inst().letterhead = null; inst().letterheadW = inst().letterheadH = null; delete inst().letterheadP; delete inst().letterheadL; inst().headerMode = 'text'; persist(); drawHdr();
  };
  const dz = $('#dropZone');
  dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('drag'); });
  dz.addEventListener('dragleave', () => dz.classList.remove('drag'));
  dz.addEventListener('drop', e => {
    e.preventDefault(); dz.classList.remove('drag');
    const file = e.dataTransfer.files && e.dataTransfer.files[0];
    if (!file || !/^image\//.test(file.type)) return toast('المرجو إفلات ملف صورة', true);
    const rd = new FileReader(); rd.onload = () => setImage(rd.result); rd.readAsDataURL(file);
  });
  $('#twoCopies').onchange = e => { g.twoCopies = e.target.checked; persist(); };
  $('#a4Two').onchange = e => { g.a4Two = e.target.checked; persist(); };
  $('#lhNorm').onchange = async e => { inst().lhNorm = e.target.checked; await normalizeLetterhead(inst()); persist(); drawHdr(); };
  $('#hStyle').onchange = e => { g.headerStyle = e.target.value; persist(); drawHdr(); toast('تم اعتماد شكل الرأسية في كل الوثائق'); };
  // 1.9.3: font of the text letterhead = any font installed on this computer
  if (window.api.fontsList) window.api.fontsList().then(l => { if (Array.isArray(l) && $('#hFontList')) $('#hFontList').innerHTML = l.map(f => `<option value="${esc(f)}">`).join(''); }).catch(() => {});
  $('#hFont').onchange = e => { g.hdrFont = String(e.target.value || '').replace(/["'<>;{}\\]/g, '').trim(); e.target.value = g.hdrFont; persist(); drawHdr(); toast(g.hdrFont ? 'تم اعتماد الخط «' + g.hdrFont + '» في رأسية كل الوثائق' : 'تمت العودة إلى الخط الافتراضي'); };
  $('#hFontReset').onclick = () => { g.hdrFont = ''; $('#hFont').value = ''; persist(); drawHdr(); };
  const drawSy = () => { $('#sySet').innerHTML = MK.syList().map(y => `<option value="${y}" ${y === MK.curSy() ? 'selected' : ''}>${MK.syDash(y)}</option>`).join(''); $('#syAuto').checked = MK.isAutoSy(); renderSy(); };
  $('#sySet').onchange = e => { MK.setSy(e.target.value); drawSy(); toast('الموسم الدراسي النشط: ' + MK.syDash(MK.curSy())); };
  $('#syAuto').onchange = e => { if (e.target.checked) MK.setSy(''); else DB.settings.sy = MK.curSy(), persist(); drawSy(); };
  drawSy();
  if ($('#holMgr')) $('#holMgr').onclick = () => Holidays.openManager();
  if ($('#holPrn')) $('#holPrn').onclick = () => Holidays.printList();
  const drawProt = () => {
    const b = $('#protBox'); if (!b) return;
    b.innerHTML = PROT.enabled
      ? `<p style="margin-top:0;line-height:1.8"><b style="color:var(--pri)">${ic('check', 'style="width:16px;height:16px;vertical-align:-3px"')} الحماية مفعلة:</b> البيانات ونسخها الاحتياطية مشفرة، وتطلب كلمة السر عند كل فتح للبرنامج.${PROT.hint ? `<br><span class="muted">التلميح: ${esc(PROT.hint)}</span>` : ''}</p>
        <div class="btn-row"><button class="btn" id="prC">${ic('key')} تغيير كلمة السر</button><button class="btn" id="prL">${ic('lock')} قفل البرنامج الآن</button><button class="btn danger" id="prR">${ic('trash')} إلغاء الحماية</button></div>`
      : `<p class="muted" style="margin-top:0;line-height:1.8;font-size:13px">اختياري: احم بيانات البرنامج بكلمة سر تختارها بنفسك. تُشفر البيانات على الحاسوب ولا يمكن فتح البرنامج أو قراءة ملف البيانات بدونها. يعطيك البرنامج «رمز استرجاع» تستعمله إذا نسيت كلمة السر.</p>
        <button class="btn pri" id="prE">${ic('lock')} تفعيل الحماية بكلمة سر</button>`;
    if ($('#prE')) $('#prE').onclick = () => protDialog('enable');
    if ($('#prC')) $('#prC').onclick = () => protDialog('change');
    if ($('#prR')) $('#prR').onclick = () => protDialog('remove');
    if ($('#prL')) $('#prL').onclick = lockNow;
  };
  drawProt();
  if (window.Units && $('#unitsBox')) Units.card($('#unitsBox'));
  if (window.Xfer && $('#xferBox')) Xfer.card($('#xferBox'), LIC);
  if (window.Stamp && $('#stampBox')) Stamp.card($('#stampBox'));
  $('#bExp').onclick = async () => {
    if (PROT.enabled && !await confirmBox('النسخة الاحتياطية المصدرة تكون غير مشفرة (يمكن فتحها دون كلمة السر). احفظها في مكان آمن. متابعة؟', 'تصدير', false)) return;
    const r = await window.api.saveText(JSON.stringify(DB, null, 1), `نسخة_احتياطية_${todayIso()}.json`, 'json', 'JSON'); if (r.ok) toast('تم حفظ النسخة الاحتياطية');
  };
  $('#bImp').onclick = async () => {
    const t = await window.api.openText(['json'], 'JSON');
    if (t == null) return;
    let d; try { d = JSON.parse(t); } catch (_) { return toast('ملف غير صالح', true); }
    if (d && d.__enc) return toast('هذه نسخة احتياطية مشفرة من مجلد البيانات: استعمل «تصدير نسخة احتياطية» للحصول على نسخة قابلة للاسترجاع.', true);
    if (!d.settings || !Array.isArray(d.employees) || !Array.isArray(d.records)) return toast('ملف غير صالح', true);
    if (!await confirmBox(`سيتم استبدال البيانات الحالية بالنسخة المختارة (${d.employees.length} موظف، ${d.records.length} عنصر في السجل). متابعة؟`, 'استرجاع')) return;
    DB = d; migrate(); await persist(true); toast('تم استرجاع النسخة الاحتياطية'); go('settings');
  };
  $('#bDir').onclick = () => window.api.openDataDir();
  drawAll();
}

function migrate() {
  DB.settings = DB.settings || {};
  DB.employees = DB.employees || [];
  DB.records = DB.records || [];
  if (window.Stock) Stock.migrate(DB);
  if (window.Certs) Certs.migrate(DB);
  if (window.Attend) Attend.migrate(DB);
  if (window.Partners) Partners.migrate(DB);
  if (window.Holidays) Holidays.migrate(DB);
  if (window.Roaiz) Roaiz.migrate(DB);
  if (window.Pupils) Pupils.migrate(DB);
  if (window.Board) Board.migrate(DB);
  if (window.Council) Council.migrate(DB);
  if (window.Budget) Budget.migrate(DB);
  if (window.Attoff) Attoff.migrate(DB);
  if (window.Incid) Incid.migrate(DB);
  if (window.Mail) Mail.migrate(DB);
  if (window.CCEval) CCEval.migrate(DB);
  if (window.RoaizX) RoaizX.migrate(DB);
  if (window.Kudos) Kudos.migrate(DB);
  const g = DB.settings;
  if (!g.headerV2) { if (!g.headerMode) g.headerMode = 'text'; g.headerV2 = true; }
  if (!Array.isArray(g.institutions) || !g.institutions.length) {
    const i = { id: uid('i') };
    INST_KEYS.forEach(k => { i[k] = g[k] == null ? '' : g[k]; delete g[k]; });
    if (!i.headerMode) i.headerMode = 'text';
    if (!i.letterhead) i.letterhead = null;
    g.institutions = [i]; g.activeInst = i.id;
    return true;
  }
  if (!instList().some(i => i.id === g.activeInst)) g.activeInst = instList()[0].id;
  return false;
}

/* ================================================================= */
/* ================================================================= */
/* LICENSE */
let LIC = { active: false, machine: '', seller: false };
const VENDOR = window.VENDOR || {};
async function refreshLic() { try { LIC = await window.api.licStatus(); } catch (_) {} }
function lockedBox() {
  const expired = LIC.reason === 'expired';
  const m = modal({ title: ic(expired ? 'alert' : 'lock', 'style="width:20px;height:20px;vertical-align:-4px"') + (expired ? ' انتهت صلاحية التفعيل' : ' نسخة غير مفعلة'), size: 'sm',
    body: `<p style="margin-top:0;line-height:1.9">${expired ? 'انتهت صلاحية تفعيل البرنامج على هذا الجهاز. لتجديده أرسل رمز الجهاز إلى المصمم.' : 'الطباعة وحفظ الوثائق بصيغة PDF متاحان فقط بعد تفعيل البرنامج على هذا الجهاز.'}</p>
      <p style="line-height:1.9">أرسل <b>رمز الجهاز</b> إلى المصمم ليرسل لك مفتاح التفعيل${expired ? ' الجديد' : ''}.</p>
      <div class="mcode sm">${esc(LIC.machine)}</div>${vendorHtml(LIC.machine)}`,
    actions: [{ label: ic('key') + ' صفحة التفعيل', cls: 'pri', onClick: () => go('license') }, { label: 'إغلاق' }] });
  bindWa(m.el, LIC.machine);
}
// 1.9.3 — the program never opens a browser or any internet address: the activation message is only copied for the user to paste himself.
const waMsg = code => { const c2 = ($('#code2') && $('#code2').value.trim()) || ''; return 'السلام عليكم، أريد تفعيل برنامج Le Gestionnaire.\nرمز الجهاز: ' + (code || '') + (c2 ? '\nرمز الجهاز الثاني: ' + c2 : ''); };
const WA_ICON = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.8 2.3 1 2.5c.1.2 1.6 2.5 4 3.5 1.5.6 2 .7 2.8.6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.4-.2z"/></svg>';
const vendorHtml = code => VENDOR.whatsapp ? `<div class="vendor">
    <div>للحصول على مفتاح التفعيل، تواصل مع <b>${esc(VENDOR.title || 'المصمم')}</b> عبر واتساب:</div>
    <div class="wa-row"><span class="wa-num" dir="ltr">${esc(VENDOR.whatsapp)}</span>
      <button class="btn wa" data-wa="1">${WA_ICON} نسخ رسالة التفعيل</button></div>
    <div class="muted" style="font-size:12px">يعمل البرنامج دون أي اتصال بالإنترنت: تُنسخ رسالة جاهزة فيها رمز جهازك، فالصقها في محادثة واتساب مع المصمم.</div>
  </div>` : '';
const bindWa = (root, code) => $$('[data-wa]', root).forEach(b => b.onclick = () => { try { window.api.copy(waMsg(code)); toast('تم نسخ رسالة التفعيل — الصقها في محادثة المصمم'); } catch (_) { toast('تعذر النسخ', true); } });
async function pageLicense(v) {
  await refreshLic();
  const st = LIC;
  v.innerHTML = `<div class="page-h"><h1>تفعيل البرنامج</h1></div>
    <div class="settings-grid">
      <div class="grid">
        <div class="card"><div class="card-b lic-state ${st.active ? 'ok' : 'no'}">
          ${st.active ? `${ic('check')}<div><b>البرنامج مفعل على هذا الجهاز</b><br><span>مرخص لـ: ${esc(st.name || '—')}</span></div>`
            : st.reason === 'machine' ? `${ic('alert')}<div><b>مفتاح التفعيل المحفوظ لا يطابق رمز هذا الحاسوب</b><br><span>المفتاح${st.name ? ' (باسم ' + esc(st.name) + ')' : ''} صادر للرمز: <b dir="ltr">${esc((st.keyCodes || []).join(' / '))}</b>، ورمز هذا الحاسوب: <b dir="ltr">${esc(st.machine || '')}</b>. أرسل رمز هذا الحاسوب إلى المصمم ليرسل لك مفتاحا محدثا.</span></div>`
            : st.reason === 'expired' ? `${ic('alert')}<div><b>انتهت صلاحية تفعيل البرنامج</b><br><span>لتجديد التفعيل أرسل رمز هذا الجهاز إلى المصمم ليرسل لك مفتاحا جديدا. تبقى جميع بياناتك محفوظة.</span></div>`
              : `${ic('lock')}<div><b>نسخة غير مفعلة</b><br><span>يمكنك استعمال البرنامج وتجربة كل الوثائق، لكن الطباعة وحفظ PDF يتطلبان التفعيل.</span></div>`}
        </div></div>
        <div class="card"><div class="card-h"><h3>رمز هذا الجهاز</h3></div><div class="card-b">
          <div class="mcode" id="mcode">${esc(st.machine)}</div>
          <div class="btn-row" style="justify-content:center;margin-top:10px"><button class="btn" id="cpCode">${ic('copy')} نسخ الرمز</button></div>
          ${(st.maxPc || 1) > 1 ? `<div class="note2" style="margin-top:12px;padding:9px 12px;border-radius:8px;background:#eef6f3;font-size:12.8px;line-height:1.8">${ic('check', 'style="width:15px;height:15px;vertical-align:-3px"')} <b>مفتاح واحد لحاسوبين:</b> يمكن تشغيل البرنامج على حاسوبك المحمول وحاسوبك المكتبي بنفس مفتاح التفعيل. أرسل للمصمم رمز هذا الجهاز ورمز الجهاز الثاني (يظهر في نفس الصفحة على الحاسوب الآخر)، ثم الصق نفس المفتاح في الجهازين.
            ${st.active ? '' : `<div class="fld" style="margin:8px 0 0"><label>رمز الجهاز الثاني (اختياري)</label><input class="inp mono" id="code2" dir="ltr" placeholder="XXXX-XXXX-XXXX-XXXX"></div>`}</div>` : ''}
          ${st.active ? '' : `<ol class="steps"><li>انسخ رمز الجهاز وأرسله إلى المصمم${st.reason === 'expired' ? ' لتجديد التفعيل' : ''}.</li><li>سيرسل لك المصمم مفتاح التفعيل الخاص بهذا الجهاز.</li><li>الصق المفتاح في الخانة أسفله واضغط «تفعيل».</li></ol>${vendorHtml(st.machine)}`}
        </div></div>
        ${st.active ? `<div class="card"><div class="card-h"><h3>سند تسلم مبلغ نقدي</h3></div><div class="card-b">
          <p class="muted" style="margin:0 0 10px;font-size:13px;line-height:1.8">سند بشعار البرنامج ورمز QR خاص بهذا التفعيل، يوقعه رئيس جمعية دعم مدرسة النجاح أو رئيس جمعية الآباء.${st.amount ? ` المبلغ المحدد في مفتاحك: <b>${esc(st.amount)} درهم</b>.` : ''}</p>
          <div class="btn-row"><button class="btn pri" id="goReceipt">${ic('file')} تحميل سند التسلم</button></div></div></div>` : ''}
        ${st.active ? `<div class="card"><div class="card-h"><h3>تحديث مفتاح التفعيل</h3></div><div class="card-b">
          <p class="muted" style="margin:0 0 8px;font-size:12.8px;line-height:1.8">إذا أرسل لك المصمم مفتاحا محدثا لهذا الجهاز (مثلا بعد تسجيل المبلغ ليظهر في سند التسلم)، الصقه هنا.${+st.amount > 0 ? '' : ' <b style="color:var(--red)">المبلغ غير مسجل في مفتاحك الحالي.</b>'}</p>
          <textarea class="inp mono" id="lkey" rows="3" placeholder="الصق المفتاح المحدث هنا..."></textarea>
          <div class="btn-row" style="margin-top:10px"><button class="btn" id="doAct">${ic('key')} تحديث المفتاح</button></div>
        </div></div>` : `<div class="card"><div class="card-h"><h3>مفتاح التفعيل</h3></div><div class="card-b">
          <textarea class="inp mono" id="lkey" rows="4" placeholder="الصق مفتاح التفعيل هنا..."></textarea>
          <div class="btn-row" style="margin-top:10px"><button class="btn pri" id="doAct">${ic('key')} تفعيل</button></div>
        </div></div>`}
      </div>
    </div>`;
  $('#cpCode').onclick = () => { window.api.copy(st.machine); toast('تم نسخ رمز الجهاز'); };
  if ($('#goReceipt')) $('#goReceipt').onclick = () => go('receiptDoc');
  bindWa(v, st.machine);
  if ($('#doAct')) $('#doAct').onclick = async () => {
    const key = $('#lkey').value.trim();
    if (!key) return toast('الصق مفتاح التفعيل أولا', true);
    const r = await window.api.licActivate(key);
    if (r.active) {
      LIC = { ...LIC, ...r }; renderNav();
      // the designer fixed an amount inside the key: the cash receipt (سند تسلم) opens right after activation, ready to fill, print or save
      if (+LIC.amount > 0) { toast('تم تفعيل البرنامج بنجاح — سند التسلم جاهز للتحميل'); go('receiptDoc'); }
      else { toast('تم تفعيل البرنامج بنجاح'); go('license'); }
    }
    else toast(r.reason === 'machine' ? 'هذا المفتاح خاص بجهاز آخر. تأكد من إرسال رمز هذا الجهاز للمصمم.' : 'مفتاح التفعيل غير صحيح.', true);
  };
}

/* ---------------- data protection (optional password chosen by the customer) ---------------- */
let PROT = { enabled: false, hint: '' };
async function refreshProt() { try { if (window.api.protStatus) PROT = await window.api.protStatus(); } catch (_) {} }
function renderFoot() {
  $('#sideFoot').innerHTML = `<a class="foot-lang no-i18n" id="langQuick" title="${(DB.settings || {}).lang === 'fr' ? 'العربية' : 'Français'}">${(DB.settings || {}).lang === 'fr' ? 'ع' : 'FR'}</a> الإصدار ${window.APP_VER || '1.9'}${window.APP_EDITION === 'extra' ? ' EXTRA' : ''}${PROT.enabled ? ` &nbsp;·&nbsp; <a class="foot-lock" id="lockNow" title="قفل البرنامج (يطلب كلمة السر)">${ic('lock')} قفل</a>` : ''}${VENDOR.whatsapp ? `<br><a class="foot-wa" data-wa="1" title="نسخ رسالة التفعيل">${WA_ICON} المصمم: <span dir="ltr">${esc(VENDOR.whatsapp)}</span></a>` : ''}`;
  bindWa($('#sideFoot'), LIC.machine);
  if ($('#lockNow')) $('#lockNow').onclick = lockNow;
  if ($('#langQuick')) $('#langQuick').onclick = () => { const g = DB.settings; g.lang = g.lang === 'fr' ? '' : 'fr'; persist(); if (window.I18N) I18N.set(g.lang); renderNav(); renderFoot(); go(current === 'editor' ? 'home' : current, currentArg); };
}
async function lockNow() { await persist(true); await window.api.lock(); location.reload(); }
function lockScreen(hint) {
  return new Promise(res => {
    const el = document.createElement('div');
    el.className = 'lock-scr';
    el.innerHTML = `<div class="lock-box"><img src="assets/emblem.png" alt=""><div class="lock-brand" dir="ltr">Le Gestionnaire</div>
      <h2>${ic('lock')} البيانات محمية بكلمة سر</h2>
      <input class="inp" type="password" id="lkP" placeholder="كلمة السر" autocomplete="off">
      ${hint ? `<div class="lk-hint">تلميح: ${esc(hint)}</div>` : ''}
      <div class="lk-err" id="lkE"></div>
      <button class="btn pri" id="lkB">${ic('key')} فتح</button>
      <a class="lk-f" id="lkF">نسيت كلمة السر؟</a>
      <div class="lk-help" id="lkH" hidden>اكتب «رمز الاسترجاع» (20 حرفا) الذي ظهر عند تفعيل الحماية في نفس الخانة، ثم اضغط «فتح» واختر كلمة سر جديدة.<br>بدون كلمة السر أو رمز الاسترجاع لا يمكن فتح البيانات، حتى من طرف المصمم.</div></div>`;
    document.body.appendChild(el);
    const inp = $('#lkP', el), btn = $('#lkB', el);
    const tryIt = async () => {
      if (!inp.value) return inp.focus();
      btn.disabled = true; $('#lkE', el).textContent = '';
      const r = await window.api.unlock(inp.value);
      btn.disabled = false;
      if (r && r.ok) { const secret = inp.value; el.remove(); res(Object.assign({ secret }, r)); }
      else { $('#lkE', el).textContent = 'كلمة السر غير صحيحة'; inp.select(); }
    };
    btn.onclick = tryIt;
    inp.onkeydown = e => { if (e.key === 'Enter') tryIt(); };
    $('#lkF', el).onclick = () => { $('#lkH', el).hidden = false; inp.placeholder = 'كلمة السر أو رمز الاسترجاع'; inp.type = 'text'; inp.focus(); };
    setTimeout(() => inp.focus(), 50);
  });
}
// enable / change / remove the password
function protDialog(mode, preset) {
  const body = document.createElement('div');
  const T = { enable: 'تفعيل حماية البيانات', change: 'تغيير كلمة السر', remove: 'إلغاء حماية البيانات' }[mode];
  body.innerHTML = `${mode === 'enable' ? `<p class="muted" style="margin-top:0;line-height:1.8;font-size:13px">عند تفعيل الحماية تُشفر بيانات البرنامج (الموظفون، الوثائق، التلاميذ...) ونسخها الاحتياطية، ويُطلب إدخال كلمة السر عند كل فتح للبرنامج.</p>` : ''}
    ${mode !== 'enable' ? `<div class="fld"><label>كلمة السر الحالية (أو رمز الاسترجاع)</label><input class="inp" type="password" id="pC" value="${esc(preset || '')}" autocomplete="off"></div>` : ''}
    ${mode !== 'remove' ? `<div class="fgrid"><div class="fld"><label>كلمة السر الجديدة</label><input class="inp" type="password" id="p1" autocomplete="off"><span class="hint">6 أحرف أو أرقام على الأقل</span></div>
      <div class="fld"><label>تأكيد كلمة السر</label><input class="inp" type="password" id="p2" autocomplete="off"></div></div>
      <div class="fld"><label>تلميح يساعدك على تذكرها (اختياري، يظهر في شاشة الفتح)</label><input class="inp" id="pH" value="${esc(PROT.hint || '')}"></div>`
      : '<p class="muted" style="font-size:13px;line-height:1.8">تعود البيانات والنسخ الاحتياطية غير مشفرة، ولا تطلب كلمة السر عند فتح البرنامج.</p>'}`;
  modal({ title: T, body, actions: [{ label: ic(mode === 'remove' ? 'trash' : 'lock') + ' ' + (mode === 'remove' ? 'إلغاء الحماية' : 'حفظ'), cls: mode === 'remove' ? 'danger' : 'pri', onClick: async () => {
    const cur = $('#pC', body) ? $('#pC', body).value : '';
    if (mode !== 'remove') {
      const p1 = $('#p1', body).value, p2 = $('#p2', body).value;
      if (p1.length < 6) { toast('كلمة السر قصيرة جدا (6 أحرف أو أرقام على الأقل)', true); return false; }
      if (p1 !== p2) { toast('كلمتا السر غير متطابقتين', true); return false; }
      clearTimeout(saveTimer);
      const r = await window.api.setPassword(p1, cur, $('#pH', body).value.trim(), DB);
      if (!r || !r.ok) { toast(r && r.reason === 'current' ? 'كلمة السر الحالية غير صحيحة' : 'تعذر حفظ كلمة السر', true); return false; }
      await refreshProt(); renderFoot(); if (current === 'settings' || current === 'home') go(current);
      if (r.recovery) recoveryBox(r.recovery); else toast('تم تغيير كلمة السر');
      return true;
    }
    clearTimeout(saveTimer);
    const r = await window.api.removePassword(cur, DB);
    if (!r || !r.ok) { toast('كلمة السر غير صحيحة', true); return false; }
    await refreshProt(); renderFoot(); if (current === 'settings' || current === 'home') go(current);
    toast('تم إلغاء حماية البيانات');
    return true;
  } }, { label: 'إلغاء' }] });
}
function recoveryBox(code) {
  const body = document.createElement('div');
  body.innerHTML = `<p style="margin-top:0;line-height:1.8">تم تفعيل الحماية. هذا هو <b>رمز الاسترجاع</b>: احتفظ به في مكان آمن (اكتبه على ورقة أو احفظه في ملف خارج الحاسوب). يمكنك استعماله لفتح البيانات إذا نسيت كلمة السر.</p>
    <div class="rec-code" dir="ltr">${esc(code)}</div>
    <p class="lk-warn">${ic('alert')} بدون كلمة السر أو رمز الاسترجاع لا يمكن استرجاع البيانات، حتى من طرف المصمم.</p>`;
  modal({ title: 'رمز الاسترجاع', body, actions: [
    { label: ic('copy') + ' نسخ', onClick: () => { window.api.copy(code); toast('تم نسخ الرمز'); return false; } },
    { label: ic('down') + ' حفظ في ملف', onClick: async () => { await window.api.saveText(`Le Gestionnaire — رمز الاسترجاع\r\n${S().school || ''}\r\n\r\n${code}\r\n`, 'رمز_الاسترجاع_Le_Gestionnaire.txt', 'txt', 'Text'); return false; } },
    { label: 'احتفظت بالرمز', cls: 'pri' }] });
}

(async function init() {
  await refreshLic();
  DB = await window.api.load();
  let opened = null;
  if (DB && DB.__locked) { opened = await lockScreen(DB.hint); DB = await window.api.load(); }
  await refreshProt();
  if (migrate()) persist();
  await letterheadSizes();
  renderFoot();
  if (window.I18N) I18N.set((DB.settings || {}).lang); // 1.9.4: interface in French when chosen
  go('home');
  if (opened && opened.recovery) { toast('تم الفتح برمز الاسترجاع: اختر الآن كلمة سر جديدة'); protDialog('change', opened.secret); }
  document.addEventListener('keydown', e => { if (e.ctrlKey && e.key.toLowerCase() === 'p' && current === 'editor') { e.preventDefault(); $('#print').click(); } });
  window.__app = { go, get DB() { return DB; }, monthRows, absenceEntries, overlap, persist: () => persist(true) };
})();
