'use strict';
/* Le Gestionnaire — نسخة الهاتف (تطبيق ويب PWA): يعوّض وظائف الحاسوب (Electron) بوظائف المتصفح.
   - المعطيات: IndexedDB في هذا الهاتف (نسخ احتياطية يومية)، مع حماية اختيارية بكلمة سر (AES-GCM).
   - التفعيل: نفس مفاتيح المصمم (توقيع Ed25519)، ولكل هاتف رمز جهاز خاص به.
   - الطبع / PDF: نافذة الطباعة في الهاتف (اختيار «حفظ بصيغة PDF»). Word و Excel يُنشآن في الهاتف ويُحمَّلان.
   - ملف نقل البيانات (.lgx) متوافق مع الحاسوب إذا كان المفتاح يشمل الحاسوب والهاتف. */
(function () {
  const W = window.WebCore, Buf = W.Buffer;
  const MAX_PC = 2;
  const PUB = Uint8Array.from(atob('MCowBQYDK2VwAyEAXYy6DeyRQEBKJL4rXB8LU28yfxWmyhG7C1NdGX07Ok0='), c => c.charCodeAt(0)).slice(12);
  const LOCKED = { ok: false, locked: true };
  const enc = new TextEncoder(), dec = new TextDecoder();
  const b64 = u8 => Buf.from(u8).toString('base64');
  const unb64 = s => Buf.from(String(s || ''), 'base64');
  const unb64u = s => unb64(String(s).replace(/-/g, '+').replace(/_/g, '/'));

  /* ---------- storage (IndexedDB) ---------- */
  let dbp = null;
  const idb = () => dbp || (dbp = new Promise((res, rej) => {
    const r = indexedDB.open('LeGestionnaire', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('kv');
    r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
  }));
  const tx = async (mode, fn) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', mode), s = t.objectStore('kv'); const q = fn(s); t.oncomplete = () => res(q && q.result); t.onerror = () => rej(t.error); }); };
  const get = k => tx('readonly', s => s.get(k));
  const set = (k, v) => tx('readwrite', s => s.put(v, k));
  const del = k => tx('readwrite', s => s.delete(k));
  const keys = () => tx('readonly', s => s.getAllKeys());
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persist(); } catch (_) {}

  /* ---------- crypto helpers (same format as the computer: { iv, tag, ct } base64) ---------- */
  const sha256 = async u8 => new Uint8Array(await crypto.subtle.digest('SHA-256', u8));
  const aesKey = raw => crypto.subtle.importKey('raw', raw, 'AES-GCM', false, ['encrypt', 'decrypt']);
  async function gcmEnc(raw, data) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const out = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await aesKey(raw), data));
    return { iv: b64(iv), tag: b64(out.slice(out.length - 16)), ct: b64(out.slice(0, out.length - 16)) };
  }
  async function gcmDec(raw, o) {
    const ct = unb64(o.ct), tag = unb64(o.tag), all = new Uint8Array(ct.length + tag.length); all.set(ct); all.set(tag, ct.length);
    return new Uint8Array(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(o.iv) }, await aesKey(raw), all));
  }
  const PBKDF = 310000;
  async function kdf(secret, salt) {
    const k = await crypto.subtle.importKey('raw', enc.encode(String(secret).normalize('NFC')), 'PBKDF2', false, ['deriveBits']);
    return new Uint8Array(await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF }, k, 256));
  }

  /* ---------- licence ---------- */
  const normCode = s => (String(s || '').toUpperCase().replace(/[^0-9A-F]/g, '').slice(0, 16).match(/.{1,4}/g) || []).join('-');
  async function machineId() {
    let id = await get('mid');
    if (!id) { try { id = localStorage.getItem('lg-mid'); } catch (_) {} }
    if (!id) { const r = crypto.getRandomValues(new Uint8Array(8)); id = Array.from(r, x => x.toString(16).padStart(2, '0')).join('').toUpperCase().match(/.{4}/g).join('-'); }
    await set('mid', id); try { localStorage.setItem('lg-mid', id); } catch (_) {}
    return id;
  }
  function parseKey(key) {
    const clean = String(key || '').replace(/\s+/g, ''); const [p, sig] = clean.split('.');
    if (!p || !sig) return null;
    let ok = false; try { ok = nacl.sign.detached.verify(enc.encode(p), unb64u(sig), PUB); } catch (_) { ok = false; }
    if (!ok) return null;
    try { return JSON.parse(dec.decode(unb64u(p))); } catch (_) { return null; }
  }
  const todayStr = () => new Date().toISOString().slice(0, 10);
  const addDays = (iso, n) => { const d = new Date(iso + 'T00:00:00Z'); if (isNaN(d.getTime())) return ''; d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };
  const isLifetime = v => v == null || v === '' || /^(دائم|lifetime|inf|9999)/i.test(String(v));
  const expiryOf = info => (info.e != null && info.e !== '' ? (isLifetime(info.e) ? '' : String(info.e).slice(0, 10)) : info.t ? addDays(String(info.t).slice(0, 10), 365) : '');
  async function check(key, now) {
    const info = parseKey(key);
    if (!info) return { active: false, reason: 'invalid' };
    const codes = (Array.isArray(info.m) ? info.m : [info.m]).map(normCode).slice(0, MAX_PC);
    if (!codes.includes(await machineId())) return { active: false, reason: 'machine' };
    const exp = expiryOf(info);
    const tag = Array.from(await sha256(enc.encode(String(key || '').replace(/\s+/g, ''))), x => x.toString(16).padStart(2, '0')).join('').slice(0, 10).toUpperCase();
    const extra = { amount: Math.max(0, Math.round(Number(info.a) || 0)), rno: Math.max(0, Math.round(Number(info.r) || 0)), tag };
    if (exp && now > exp) return { active: false, reason: 'expired', name: info.n || '', issued: info.t || '', expires: exp, ...extra };
    return { active: true, name: info.n || '', issued: info.t || '', expires: exp, ...extra };
  }
  // the date used for the expiry never goes back (clock guard)
  const effNow = async () => { const t = todayStr(), ls = (await get('lastSeen')) || ''; return ls > t ? ls : t; };
  const bumpLS = async () => { const n = await effNow(); if (n !== (await get('lastSeen'))) await set('lastSeen', n); };
  let licCache = null;
  async function recheck() { const r = await check((await get('license')) || '', await effNow()); await bumpLS(); licCache = r; return r; }
  const active = async () => (licCache && licCache.active) || (await recheck()).active;

  /* ---------- data (+ optional password protection) ---------- */
  let dataKey = null, protMeta = null, locked = false;
  const isEnc = o => !!(o && o.__enc === 'lg1' && o.data && o.wrapP);
  const metaOf = o => ({ salt: o.salt, wrapP: o.wrapP, salt2: o.salt2, wrapR: o.wrapR, hint: o.hint || '', kdf: o.kdf || 'pbkdf2' });
  const normRec = s => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
  async function unwrap(meta, secret) {
    try { return { key: await gcmDec(await kdf(secret, unb64(meta.salt)), meta.wrapP), rec: false }; } catch (_) {}
    const r = normRec(secret);
    if (r.length >= 16 && meta.wrapR) try { return { key: await gcmDec(await kdf(r, unb64(meta.salt2)), meta.wrapR), rec: true }; } catch (_) {}
    return null;
  }
  async function writeData(obj) {
    const json = JSON.stringify(obj);
    const v = dataKey ? Object.assign({ __enc: 'lg1', v: 1 }, protMeta, { data: await gcmEnc(dataKey, enc.encode(json)) }) : json;
    await set('data', v);
    // one backup per day, the last 14 kept
    const day = 'bk:' + todayStr();
    if (!(await get(day))) { await set(day, v); const ks = (await keys()).filter(k => /^bk:/.test(k)).sort(); while (ks.length > 14) await del(ks.shift()); }
  }
  async function readData(v) {
    if (v == null) return null;
    const o = typeof v === 'string' ? JSON.parse(v) : v;
    if (!isEnc(o)) return o;
    if (!dataKey) { protMeta = metaOf(o); locked = true; return { __locked: true, hint: protMeta.hint }; }
    return JSON.parse(dec.decode(await gcmDec(dataKey, o.data)));
  }

  /* ---------- files (picker / download) ---------- */
  function pick(accept, multiple) {
    return new Promise(res => {
      const i = document.createElement('input'); i.type = 'file'; if (accept) i.accept = accept; if (multiple) i.multiple = true;
      i.style.display = 'none'; document.body.appendChild(i);
      let done = false; const fin = v => { if (done) return; done = true; i.remove(); res(v); };
      i.onchange = () => fin(Array.from(i.files || []));
      i.addEventListener('cancel', () => fin([]));
      window.addEventListener('focus', function f() { window.removeEventListener('focus', f); setTimeout(() => { if (!i.files || !i.files.length) fin([]); }, 1500); });
      i.click();
    });
  }
  const readBuf = f => f.arrayBuffer().then(a => Buf.from(new Uint8Array(a)));
  const readURL = f => new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(f); });
  const safeName = n => String(n || 'ملف').replace(/[\\/:*?"<>|]/g, '_');
  async function download(data, name, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const file = (() => { try { return new File([blob], safeName(name), { type: blob.type }); } catch (_) { return null; } })();
    // phone: the share sheet (WhatsApp, Drive, Files...) when available, otherwise a normal download
    if (file && navigator.canShare && navigator.canShare({ files: [file] }) && window.matchMedia('(pointer:coarse)').matches) {
      try { await navigator.share({ files: [file], title: safeName(name) }); return { ok: true, path: safeName(name) }; } catch (e) { if (e && e.name === 'AbortError') return { ok: false }; }
    }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = safeName(name); document.body.appendChild(a); a.click();
    setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 4000);
    return { ok: true, path: safeName(name) };
  }
  const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const ACC_TAB = '.xlsx,.xlsm,.xlsb,.xls,.csv,.txt,application/vnd.ms-excel,' + XLSX_MIME + ',text/csv,text/plain';
  function bookOf(buf) {
    if (buf[0] === 0x50 && buf[1] === 0x4B) return W.readBook(buf);
    if (buf[0] === 0xD0 && buf[1] === 0xCF) return W.readXlsBook(buf);
    return null;
  }

  /* ---------- documents: hidden frame (print / PDF / Word) ---------- */
  async function docFrame(html, width) {
    const f = document.createElement('iframe');
    f.style.cssText = `position:fixed;left:-20000px;top:0;width:${width || 1100}px;height:1500px;border:0;visibility:hidden`;
    document.body.appendChild(f);
    await new Promise(r => { f.onload = r; f.srcdoc = html; });
    try { await f.contentDocument.fonts.ready; } catch (_) {}
    await new Promise(r => setTimeout(r, 250));
    return f;
  }
  async function printHtml(html, title) {
    if (title) html = html.replace(/<title>[^<]*<\/title>/i, '').replace(/<head>/i, `<head><title>${String(title).replace(/[<&]/g, '')}</title>`);
    const f = await docFrame(html);
    f.style.visibility = 'visible';
    const w = f.contentWindow;
    const old = document.title; if (title) document.title = title;   // Android uses the page title as the PDF file name
    await new Promise(res => { let d = false; const fin = () => { if (!d) { d = true; res(); } }; w.addEventListener('afterprint', fin); w.focus(); w.print(); setTimeout(fin, 1500); });
    setTimeout(() => { f.remove(); document.title = old; }, 60000);
    return { ok: true };
  }
  const tip = (t, err) => { try { if (typeof toast === 'function') toast(t, err); } catch (_) {} };

  /* ---------- API (same names as the computer) ---------- */
  window.api = {
    async load() {
      const v = await get('data');
      try { const d = await readData(v); if (d) return d; } catch (e) {
        // corrupted: latest readable backup
        const ks = (await keys()).filter(k => /^bk:/.test(k)).sort().reverse();
        for (const k of ks) { try { const d = await readData(await get(k)); if (d) return d; } catch (_) {} }
      }
      const r = await fetch('data/seed.json'); return r.json();
    },
    async save(obj) { if (locked) return false; await writeData(obj); return true; },
    async protStatus() { return { enabled: !!(dataKey && protMeta), locked, hint: protMeta ? protMeta.hint || '' : '' }; },
    async unlock(secret) {
      await new Promise(r => setTimeout(r, 250));
      const v = await get('data'); const o = typeof v === 'string' ? JSON.parse(v) : v;
      const meta = protMeta || (isEnc(o) ? metaOf(o) : null);
      if (!meta) { locked = false; return { ok: true }; }
      const u = await unwrap(meta, secret); if (!u) return { ok: false };
      dataKey = u.key; protMeta = meta; locked = false; return { ok: true, recovery: u.rec };
    },
    async lock() { if (dataKey && protMeta) { dataKey = null; locked = true; } return true; },
    async setPassword(password, current, hint, obj) {
      if (locked || !password || String(password).length < 6) return { ok: false, reason: 'weak' };
      if (dataKey && protMeta) {
        const u = await unwrap(protMeta, current || ''); if (!u || b64(u.key) !== b64(dataKey)) return { ok: false, reason: 'current' };
        const salt = crypto.getRandomValues(new Uint8Array(16));
        protMeta = Object.assign({}, protMeta, { salt: b64(salt), wrapP: await gcmEnc(await kdf(password, salt), dataKey), hint: String(hint || '') });
        await writeData(obj); return { ok: true };
      }
      dataKey = crypto.getRandomValues(new Uint8Array(32));
      const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      const rec = Array.from(crypto.getRandomValues(new Uint8Array(20)), b => A[b % 32]).join('').replace(/(.{5})(?=.)/g, '$1-');
      const salt = crypto.getRandomValues(new Uint8Array(16)), salt2 = crypto.getRandomValues(new Uint8Array(16));
      protMeta = { kdf: 'pbkdf2', salt: b64(salt), wrapP: await gcmEnc(await kdf(password, salt), dataKey), salt2: b64(salt2), wrapR: await gcmEnc(await kdf(normRec(rec), salt2), dataKey), hint: String(hint || '') };
      await writeData(obj);
      // the older daily backups are re-written protected
      for (const k of (await keys()).filter(k => /^bk:/.test(k))) { try { const v = await get(k); if (!isEnc(typeof v === 'string' ? JSON.parse(v) : v)) await set(k, Object.assign({ __enc: 'lg1', v: 1 }, protMeta, { data: await gcmEnc(dataKey, enc.encode(typeof v === 'string' ? v : JSON.stringify(v))) })); } catch (_) {} }
      return { ok: true, recovery: rec };
    },
    async removePassword(current, obj) {
      if (!dataKey || !protMeta) return { ok: true };
      const u = await unwrap(protMeta, current || ''); if (!u || b64(u.key) !== b64(dataKey)) return { ok: false, reason: 'current' };
      for (const k of (await keys()).filter(k => /^bk:/.test(k))) { try { const v = await get(k); const o = typeof v === 'string' ? JSON.parse(v) : v; if (isEnc(o)) await set(k, dec.decode(await gcmDec(dataKey, o.data))); } catch (_) {} }
      dataKey = null; protMeta = null; locked = false; await writeData(obj); return { ok: true };
    },
    async info() { return { dataDir: 'ذاكرة هذا الهاتف (التطبيق)', version: window.APP_VER, mobile: true }; },
    async openDataDir() { tip('المعطيات محفوظة داخل التطبيق في هذا الهاتف. احفظ نسخة احتياطية من «الإعدادات» بانتظام.'); return true; },

    async print(html, landscape) { if (!(await active())) return LOCKED; return printHtml(html); },
    async pdf(html, landscape, name) {
      if (!(await active())) return LOCKED;
      tip('في نافذة الطباعة اختر «حفظ بصيغة PDF» (Save as PDF) ثم «تنزيل»');
      await printHtml(html, name || 'وثيقة');
      return { ok: false, canceled: true };   // the phone's own dialog saves the file
    },
    async docx(html, name) {
      if (!(await active())) return LOCKED;
      try {
        const f = await docFrame(html, 1200);
        const imgs = {};
        try { const b = await (await fetch('assets/emblem.png')).blob(); imgs['assets/emblem.png'] = await readURL(b); } catch (_) {}
        f.contentWindow.__LOCAL_IMGS = imgs;
        const src = await (await fetch('js/docx_dom.js')).text();
        const r = await f.contentWindow.eval(src);
        f.remove();
        return download(W.buildDocx(r), (name || 'وثيقة') + '.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      } catch (e) { return { ok: false, err: String(e && e.message || e) }; }
    },

    async saveText(text, name, ext) { return download(new Blob([text], { type: ext === 'csv' ? 'text/csv' : ext === 'json' ? 'application/json' : 'text/plain' }), name); },
    async openText(exts) { const [f] = await pick((exts || []).map(e => '.' + e).join(',')); return f ? W.decodeText(await readBuf(f)) : null; },
    async saveXlsx(rows, name, sheet, widths) { return download(W.buildXlsx(rows, sheet, widths), name, XLSX_MIME); },
    async saveXlsxBook(sheets, name) { return download(W.buildXlsxBook(sheets), name, XLSX_MIME); },
    async openTable() {
      const [f] = await pick(ACC_TAB); if (!f) return null;
      const buf = await readBuf(f);
      try { const sheets = bookOf(buf); if (sheets) return { rows: sheets.length ? sheets[0].rows : [], sheets, name: f.name }; }
      catch (e) { return { error: buf[0] === 0xD0 ? (e && e.message === 'encrypted' ? 'xls-pw' : 'xls') : 'xlsx' }; }
      return { text: W.decodeText(buf) };
    },
    async openTables(opts) {
      const csv = !!(opts && opts.csv);
      const fs = await pick(csv ? ACC_TAB : '.xlsx,.xlsm,.xlsb,.xls,application/vnd.ms-excel,' + XLSX_MIME, true); if (!fs.length) return null;
      const out = [], errors = [], lockedF = [];
      for (const f of fs) {
        try {
          const buf = await readBuf(f);
          if (csv && /\.(csv|txt)$/i.test(f.name) && !(buf[0] === 0x50 && buf[1] === 0x4B)) { out.push({ name: f.name, text: W.decodeText(buf) }); continue; }
          if (buf[0] === 0xD0 && buf[1] === 0xCF) { out.push({ name: f.name, sheets: W.readXlsBook(buf) }); continue; }
          if (buf[0] !== 0x50 || buf[1] !== 0x4B) { errors.push(f.name); continue; }
          out.push({ name: f.name, sheets: W.readBook(buf), b64: buf.length < 4e6 ? buf.toString('base64') : '' });
        } catch (e) { errors.push(f.name); if (e && e.message === 'encrypted') lockedF.push(f.name); }
      }
      return { files: out, errors, locked: lockedF };
    },
    async patchXlsxMany(items) {
      const done = [], errors = [];
      for (const it of items || []) {
        try { const r = W.patchXlsx(unb64(it.b64), it.sheet, it.cells || {}); await download(r.buf, it.name, XLSX_MIME); done.push(it.name); await new Promise(r2 => setTimeout(r2, 700)); }
        catch (e) { errors.push(it.name); }
      }
      return { ok: true, dir: 'التنزيلات', done, errors };
    },
    async openXml() { const fs = await pick('.xml,text/xml,application/xml', true); if (!fs.length) return null; const files = [], errors = []; for (const f of fs) { try { files.push({ name: f.name, text: W.decodeText(await readBuf(f)) }); } catch (_) { errors.push(f.name); } } return { files, errors }; },
    async openImage() { const [f] = await pick('image/*'); return f ? readURL(f) : null; },
    async openAny(label, exts) {
      const [f] = await pick(Array.isArray(exts) && exts.length ? exts.map(e => '.' + e).join(',') : ''); if (!f) return null;
      if (f.size > 15 * 1024 * 1024) return { error: 'big', name: f.name, size: f.size };
      return { name: f.name, size: f.size, b64: (await readBuf(f)).toString('base64') };
    },
    async saveBin(b64s, name) { return download(unb64(b64s), name); },
    async openFont() { const fs = await pick('.ttf,.otf,.woff,.woff2', true); if (!fs.length) return null; const out = []; for (const f of fs) { if (f.size <= 12 * 1024 * 1024) out.push({ name: f.name.replace(/\.(ttf|otf|woff2?)$/i, ''), ext: f.name.split('.').pop().toLowerCase(), b64: (await readBuf(f)).toString('base64') }); } return out; },
    async fontsList() { return ['Arial', 'Times New Roman', 'Roboto', 'Noto Sans Arabic', 'Noto Naskh Arabic', 'Amiri', 'Tahoma', 'Courier New']; },

    async licStatus() { const r = await recheck(); return { ...r, machine: await machineId(), seller: false, maxPc: MAX_PC }; },
    async licActivate(key) {
      const r = await check(key, await effNow());
      if (r.active) { await set('license', String(key).replace(/\s+/g, '')); licCache = r; await bumpLS(); }
      return { ...r, machine: await machineId(), maxPc: MAX_PC };
    },
    // transfer files (.lgx) are a computer feature: their key is never put in the phone version (its code is public on the web)
    async xferExport() { return { error: 'mobile' }; },
    async xferImport() { return { error: 'mobile' }; },
    copy(text) { try { navigator.clipboard.writeText(String(text || '')); } catch (_) {} }
  };
  window.APP_MOBILE = true;
})();
