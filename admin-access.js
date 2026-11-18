/**
 * admin-access.js  —  Akses Admin Tersembunyi
 * ------------------------------------------------------------
 * - Dipakai di index.html  : menampilkan menu "Admin" di sebelah "Kontak"
 *                            HANYA jika pengelola sudah masuk. Pengunjung biasa
 *                            tidak melihat apa pun (link dibuat lewat JavaScript,
 *                            tidak ada di HTML).
 * - Dipakai di admin.html  : menjaga halaman; yang belum masuk dialihkan ke index.html.
 *
 * Cara masuk (hanya pengelola yang tahu):
 *   1. Buka   index.html#login-admin     atau tekan  Ctrl + Alt + L
 *   2. Masukkan kata sandi pengelola.
 *   3. Menu "Admin" muncul di sebelah "Kontak".
 * Keluar: buka kembali index.html#login-admin lalu klik "Keluar".
 *
 * Mengganti kata sandi: buka Console (F12) di index.html, ketik
 *   adminHash('KataSandiBaru')
 * lalu tempel hasilnya ke PASS_HASH di bawah.
 */
(function () {
  'use strict';

  // ====== PENGATURAN ======
  var PASS_HASH  = 'ef797c8118f02dfb649607dd5d3f8c7623048c9c063d532cc95c5ed7a898a64f'; // sandi awal: Aisyiyah#2026 (WAJIB diganti)
  var SESSION_H  = 8;      // lama sesi admin (jam)
  var MAX_TRY    = 5;      // salah sandi maksimal sebelum dikunci
  var LOCK_MIN   = 5;      // lama kunci (menit)
  var ADMIN_PAGE = 'admin.html';
  var HOME_PAGE  = 'index.html';
  var K_SESSION  = 'baAdminSession', K_FAIL = 'baAdminFail';

  // ====== SHA-256 (cadangan jika crypto.subtle tidak tersedia) ======
  function sha256Fallback(s) {
    function frac(x) { return ((x - Math.floor(x)) * 4294967296) | 0; }
    function r(n, x) { return (x >>> n) | (x << (32 - n)); }
    var K = [], p = 2, c = 0, m, i, j;
    for (; c < 64; p++) { for (m = 2; m * m <= p; m++) if (p % m === 0) break; if (m * m > p) K[c++] = frac(Math.cbrt(p)); }
    var H = [], h0 = [];
    for (p = 2, c = 0; c < 8; p++) { for (m = 2; m * m <= p; m++) if (p % m === 0) break; if (m * m > p) h0[c++] = frac(Math.sqrt(p)); }
    H = h0.slice();
    var b = unescape(encodeURIComponent(s)), l = b.length * 8, w = [];
    for (i = 0; i < (((l + 64) >> 9) << 4) + 16; i++) w[i] = 0;
    for (i = 0; i < b.length; i++) w[i >> 2] |= b.charCodeAt(i) << (24 - (i % 4) * 8);
    w[l >> 5] |= 0x80 << (24 - l % 32); w[(((l + 64) >> 9) << 4) + 15] = l;
    for (j = 0; j < w.length; j += 16) {
      var W = w.slice(j, j + 16), a = H.slice();
      for (i = 16; i < 64; i++) {
        var s0 = r(7, W[i - 15]) ^ r(18, W[i - 15]) ^ (W[i - 15] >>> 3), s1 = r(17, W[i - 2]) ^ r(19, W[i - 2]) ^ (W[i - 2] >>> 10);
        W[i] = (W[i - 16] + s0 + W[i - 7] + s1) | 0;
      }
      for (i = 0; i < 64; i++) {
        var S1 = r(6, a[4]) ^ r(11, a[4]) ^ r(25, a[4]), ch = (a[4] & a[5]) ^ (~a[4] & a[6]),
            t1 = (a[7] + S1 + ch + K[i] + W[i]) | 0,
            S0 = r(2, a[0]) ^ r(13, a[0]) ^ r(22, a[0]), mj = (a[0] & a[1]) ^ (a[0] & a[2]) ^ (a[1] & a[2]),
            t2 = (S0 + mj) | 0;
        a = [(t1 + t2) | 0, a[0], a[1], a[2], (a[3] + t1) | 0, a[4], a[5], a[6]];
      }
      for (i = 0; i < 8; i++) H[i] = (H[i] + a[i]) | 0;
    }
    return H.map(function (x) { return ('00000000' + (x >>> 0).toString(16)).slice(-8); }).join('');
  }
  function sha256(text) {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      return crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (x) { return ('0' + x.toString(16)).slice(-2); }).join('');
      }).catch(function () { return sha256Fallback(text); });
    }
    return Promise.resolve(sha256Fallback(text));
  }
  window.adminHash = function (t) { sha256(String(t)).then(function (h) { console.log(h); }); return 'Hash dicetak di bawah ini ↓'; };

  // ====== SESI ======
  function isAdmin() {
    try {
      var s = JSON.parse(localStorage.getItem(K_SESSION) || 'null');
      if (s && s.exp > Date.now() && s.h === PASS_HASH) return true;
      localStorage.removeItem(K_SESSION);
    } catch (e) {}
    return false;
  }
  function login() {
    try { localStorage.setItem(K_SESSION, JSON.stringify({ h: PASS_HASH, exp: Date.now() + SESSION_H * 3600000 })); localStorage.removeItem(K_FAIL); } catch (e) {}
  }
  function logout() { try { localStorage.removeItem(K_SESSION); } catch (e) {} }

  function lockLeft() {
    try {
      var f = JSON.parse(localStorage.getItem(K_FAIL) || 'null');
      if (f && f.until && f.until > Date.now()) return Math.ceil((f.until - Date.now()) / 60000);
    } catch (e) {}
    return 0;
  }
  function addFail() {
    try {
      var f = JSON.parse(localStorage.getItem(K_FAIL) || '{"n":0}') || { n: 0 };
      f.n = (f.until && f.until <= Date.now() ? 0 : f.n || 0) + 1;
      if (f.n >= MAX_TRY) { f.until = Date.now() + LOCK_MIN * 60000; f.n = 0; } else { delete f.until; }
      localStorage.setItem(K_FAIL, JSON.stringify(f));
      return MAX_TRY - f.n;
    } catch (e) { return 0; }
  }

  // ====== A. HALAMAN ADMIN: jaga akses ======
  var isAdminPage = /(^|\/)admin\.html$/i.test(location.pathname) || document.title.indexOf('Admin Dashboard') === 0;
  if (isAdminPage) {
    if (!isAdmin()) { location.replace(HOME_PAGE + '#login-admin'); }
    else { document.documentElement.style.visibility = ''; }
    return;
  }

  // ====== B. HALAMAN PUBLIK: menu Admin tersembunyi ======
  function injectLink() {
    var menu = document.getElementById('menu');
    if (!menu || menu.querySelector('.admin-nav-link')) return;
    var a = document.createElement('a');
    a.className = 'admin-nav-link';
    a.href = ADMIN_PAGE;
    a.innerHTML = '<svg class="i" viewBox="0 0 24 24" aria-hidden="true" style="width:1em;height:1em;vertical-align:-.12em;margin-right:.3em"><use href="#i-user"/></svg>Admin';
    var kontak = menu.querySelector('a[href="#kontak"]');
    if (kontak && kontak.nextSibling) menu.insertBefore(a, kontak.nextSibling);
    else if (kontak) menu.appendChild(a);
    else menu.insertBefore(a, menu.querySelector('.btn-nav-daftar'));
  }
  function removeLink() { var a = document.querySelector('.admin-nav-link'); if (a) a.remove(); }

  // Kotak dialog (dibuat hanya saat dibutuhkan)
  function dialog(html) {
    closeDialog();
    var o = document.createElement('div');
    o.id = 'adminAccessModal';
    o.setAttribute('role', 'dialog'); o.setAttribute('aria-modal', 'true');
    o.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(13,112,104,.55);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit';
    o.innerHTML = '<div style="background:#fff;color:#1f2d2b;border-radius:20px;padding:26px 24px;width:100%;max-width:360px;box-shadow:0 20px 50px rgba(0,0,0,.25)">' + html + '</div>';
    o.addEventListener('click', function (e) { if (e.target === o) closeDialog(); });
    document.body.appendChild(o);
    return o;
  }
  function closeDialog() { var o = document.getElementById('adminAccessModal'); if (o) o.remove(); }
  var BTN = 'border:0;border-radius:999px;padding:10px 18px;font-weight:800;font-family:inherit;cursor:pointer;font-size:14px;';

  function openLogin() {
    if (isAdmin()) {
      var o = dialog('<h3 style="margin:0 0 6px;font-size:18px">Anda sudah masuk sebagai admin</h3>' +
        '<p style="margin:0 0 16px;font-size:14px;color:#526360">Menu Admin tampil di sebelah Kontak.</p>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap"><a href="' + ADMIN_PAGE + '" style="' + BTN + 'background:#158c82;color:#fff;text-decoration:none">Buka Admin</a>' +
        '<button id="aaOut" style="' + BTN + 'background:#fdeee7;color:#d25016">Keluar</button>' +
        '<button id="aaX" style="' + BTN + 'background:#f0f2f5;color:#1f2d2b">Tutup</button></div>');
      o.querySelector('#aaOut').onclick = function () { logout(); removeLink(); closeDialog(); history.replaceState(null, '', location.pathname + location.search); };
      o.querySelector('#aaX').onclick = closeDialog;
      return;
    }
    var left = lockLeft();
    var o2 = dialog('<h3 style="margin:0 0 6px;font-size:18px">Masuk Pengelola</h3>' +
      '<p style="margin:0 0 14px;font-size:14px;color:#526360">Khusus pengelola website.</p>' +
      '<form id="aaForm" autocomplete="off"><input id="aaPass" type="password" placeholder="Kata sandi" autocomplete="current-password" ' +
      'style="width:100%;box-sizing:border-box;padding:11px 14px;border:2px solid #d8dedc;border-radius:12px;font:inherit;font-size:15px;margin-bottom:8px">' +
      '<div id="aaMsg" role="alert" style="min-height:20px;font-size:13px;color:#d25016;margin-bottom:8px"></div>' +
      '<div style="display:flex;gap:8px"><button type="submit" style="' + BTN + 'background:#158c82;color:#fff">Masuk</button>' +
      '<button type="button" id="aaX" style="' + BTN + 'background:#f0f2f5;color:#1f2d2b">Batal</button></div></form>');
    var msg = o2.querySelector('#aaMsg'), pass = o2.querySelector('#aaPass');
    o2.querySelector('#aaX').onclick = closeDialog;
    if (left) msg.textContent = 'Terlalu banyak percobaan. Coba lagi dalam ' + left + ' menit.';
    pass.focus();
    o2.querySelector('#aaForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var l = lockLeft();
      if (l) { msg.textContent = 'Terlalu banyak percobaan. Coba lagi dalam ' + l + ' menit.'; return; }
      sha256(pass.value).then(function (h) {
        if (h === PASS_HASH) { login(); closeDialog(); injectLink(); history.replaceState(null, '', location.pathname + location.search); }
        else { var sisa = addFail(); pass.value = ''; msg.textContent = sisa > 0 ? 'Kata sandi salah. Sisa percobaan: ' + sisa + '.' : 'Terkunci selama ' + LOCK_MIN + ' menit.'; }
      });
    });
  }

  function init() {
    if (isAdmin()) injectLink();
    if (location.hash === '#login-admin') openLogin();
    window.addEventListener('hashchange', function () { if (location.hash === '#login-admin') openLogin(); });
    document.addEventListener('keydown', function (e) {
      if (e.ctrlKey && e.altKey && (e.key === 'l' || e.key === 'L')) { e.preventDefault(); openLogin(); }
      if (e.key === 'Escape') closeDialog();
    });
    // sinkron antar tab: kalau keluar di tab lain, menu ikut hilang
    window.addEventListener('storage', function (e) { if (e.key === K_SESSION) { isAdmin() ? injectLink() : removeLink(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
