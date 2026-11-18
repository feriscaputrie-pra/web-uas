# Website TK Bustanul Athfal 'Aisyiyah Pacitan

Isi folder:
- index.html, style.css, script.js
- images/logo.png  (logo asli, sudah ada)

## Menjalankan
Buka `index.html` dengan klik dua kali (Chrome/Edge/Firefox). Tidak perlu server atau internet
(kecuali font Nunito dan peta Google Maps).

## Menguji intro logo
- Tambahkan `?intro=1` di alamat: `index.html?intro=1` (selalu tampil).
- Atau buka Console (F12) lalu ketik `resetIntro()`.
- Atau tutup tab lalu buka lagi (sessionStorage kembali kosong).
- Klik layar / tombol "Lewati" / tekan Esc untuk melewati intro.
- Durasi: ubah `HOLD` (lama tampil, 1900 ms) dan `SLIDE` (transisi keluar, 1100 ms; samakan dengan `1s` pada `.intro` di style.css) di `script.js`.

## Mengganti logo
Timpa `images/logo.png` (PNG transparan, rasio hampir persegi). Dipakai di intro, header, dan favicon.

## Foto hero & galeri
Taruh foto di folder `images/` dengan nama persis:
- `hero.jpg`
- `galeri-1.jpg` ... `galeri-6.jpg`
Foto otomatis menggantikan placeholder. Jika file tidak ada, placeholder ikon tetap tampil.

## Mengganti ikon
Semua ikon ada di sprite SVG di bagian atas `index.html` (`<symbol id="i-nama">`).
Pakai di mana saja: `<svg class="i"><use href="#i-nama"/></svg>`.
Untuk ikon baru, salin path SVG dari https://lucide.dev (ukuran 24x24) ke dalam `<symbol>` baru.
Warna ikon diatur di style.css (`.blue .ico`, `.mint .ico`, dst).

## Mengganti data guru dan staf

1. **Letak blok HTML:**
   Buka file `index.html` dan cari bagian bertanda `<!-- SECTION: PROFIL GURU & STAF -->` di dalam `<section id="guru" class="sec">`.

2. **Mengganti nama dan jabatan:**
   Pada setiap kartu `<article class="guru-card">`:
   - Ganti teks pada `<h3 class="guru-nama">[Nama Guru 1]</h3>` dengan nama lengkap guru atau staf.
   - Ganti teks pada `<span class="guru-jabatan">Guru Kelas A</span>` dengan jabatan yang sesuai (contoh: *Guru Kelas A*, *Guru Kelas B*, *Guru Pendamping*, *Staf Tata Usaha*, *Penjaga Sekolah*).
   - Perbarui juga teks atribut `alt` pada `<img>`, misalnya: `alt="Foto Ibu Fulanah, Guru Kelas A"`.

3. **Nama file foto di folder `images/`:**
   Simpan file foto guru di dalam folder `images/` dengan nama berurutan:
   - `guru-1.jpg` (kartu 1)
   - `guru-2.jpg` (kartu 2)
   - `guru-3.jpg` sampai `guru-8.jpg` (dan seterusnya).
   *Catatan:* Jika file foto belum ada atau gagal dimuat, kartu otomatis menampilkan placeholder siluet pengguna dengan warna lembut yang serasi tanpa ikon gambar rusak.

4. **Saran foto:**
   - Gunakan foto berorientasi potret dengan rasio **4:5** (misalnya 400x500 piksel atau 800x1000 piksel).
   - Pastikan wajah berada di **tengah atas** (*center top*) agar tampil proporsional di dalam bingkai lengkung kubah (*arch*).

5. **Menambah atau menghapus kartu:**
   - **Menambah:** Salin satu blok `<article class="guru-card">...</article>` di dalam `<div class="guru-grid">`, lalu sesuaikan nomor foto (misal: `guru-9.jpg`), nama, dan jabatan. Warna border (tosca, oranye, kuning) akan otomatis bergantian secara selang-seling melalui CSS.
   - **Menghapus:** Cukup hapus blok `<article class="guru-card">...</article>` yang tidak diinginkan.

