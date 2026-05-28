# Product Requirements Document (PRD)

**Nama Proyek:** APC Research Website Redesign (Prototype)
**Klien:** Applied Physics and Chemistry (APC) Research Group @ Nano Center Indonesia
**Versi:** v2.0 — Revisi berdasarkan feedback & analisis gap
**Tanggal:** Mei 2026
**Status:** AKTIF — Siap untuk Sprint 1

---

## 1. Ringkasan Proyek

APC Research membutuhkan website profil yang modern, profesional, dan dapat dikelola secara mandiri oleh tim internal. Website ini berfungsi untuk mempublikasikan hasil riset, memperkenalkan anggota tim dan subteam riset, serta membuka peluang kerja sama (partnership) dengan pihak industri maupun akademisi.

> **Perubahan Utama dari Versi Sebelumnya:**
> Sistem Substack dihapus sepenuhnya dan digantikan oleh Admin Dashboard internal berbasis multi-user dengan autentikasi server-side yang aman. Graphical Abstract menggunakan Vercel Blob untuk penyimpanan file gambar.

---

## 2. Target Audiens & Kebutuhan

### 2.1 Akademisi & Peneliti
- Mencari referensi paper, jurnal, atau peluang riset bersama.
- Membutuhkan akses cepat ke DOI dan abstrak paper.
- Mengharapkan desain yang terasa profesional dan terpercaya.

### 2.2 Mahasiswa & Calon Intern
- Mencari informasi lowongan magang (openings) secara aktif.
- Ingin melihat profil anggota aktif dan alumni (former members) sebagai referensi.
- Berharap menemukan kontak yang jelas untuk menghubungi tim.

### 2.3 Mitra Industri
- Mencari teknologi terapan (wastewater treatment, nanomaterials, nano-petro).
- Membutuhkan halaman partnership yang jelas dengan call-to-action yang mudah ditemukan.
- Mengharapkan penjelasan teknis yang mudah dipahami oleh non-akademisi.

---

## 3. Fitur Inti & Halaman

### 3.1 Homepage (Landing Page)
- Hero Banner dengan headline utama dan tombol CTA menuju halaman Partnership dan Publikasi.
- Section **"What's New"**: Menampilkan 3 publikasi terbaru secara otomatis dari data JSON/YAML.
- Section **"Research Subteams"**: Preview ringkas 4 subteam dengan tombol expand untuk detail lebih lanjut.
- FAQ (Pertanyaan Umum) tentang cara bergabung dan kerja sama.
- CTA Partnership di bagian bawah halaman.
- **[DIHAPUS]** Tidak ada lagi elemen Substack, tombol "Submit via Substack", atau badge Substack di mana pun.

### 3.2 Publications Page
- Menampilkan daftar paper/jurnal ilmiah yang dikelola via Admin Dashboard.
- Setiap kartu publikasi menampilkan: Graphical Abstract (gambar), judul, penulis, tahun, dan topik.
- Tombol **"Read Full Paper"** mengarah langsung ke link eksternal (DOI/Publisher) — bukan ke halaman internal.
- Fitur Filter/Search berdasarkan tahun dan topik riset, diproses di sisi klien (client-side JS).

### 3.3 Teams / People Page
- Hierarki tim: Leadership → Subteam Leads → Researchers → PhD Candidates.
- Setiap profil menampilkan: foto, nama, posisi, dan tautan ke profil eksternal (ResearchGate/LinkedIn).
- **[BARU]** Section **"Former Members & Alumni/Interns"** di bagian bawah halaman, dirender secara dinamis dari data JSON.

### 3.4 Research Subteams (Expandable Cards)
- Sistem **Expandable Card**: kartu yang dapat diklik/diperluas tanpa berpindah halaman.
- Isi dalam setiap card saat diperluas:
  - Penjelasan fokus riset dan metodologi.
  - Daftar ongoing projects.
  - Daftar anggota spesifik subteam.
  - Galeri kegiatan / showcase foto laboratorium.
  - Daftar paper spesifik subteam (subset dari Publications).

### 3.5 Admin Dashboard (Content Management System)

> ⚠️ **Catatan Keamanan Kritis:**
> Autentikasi HARUS diproses di sisi server (Vercel Serverless Function). Token GitHub dan secret lainnya DILARANG ditempatkan di kode frontend/JavaScript yang dapat diakses publik.

- Halaman `/admin/login.html`: Form login dengan username dan password.
- Autentikasi diverifikasi oleh Vercel Serverless Function — bukan oleh JavaScript di browser.
- Sistem **multi-user**: setiap peneliti memiliki akun masing-masing.
- Setelah login, pengguna mendapatkan session token yang disimpan di `httpOnly` cookie.

**Manajemen Publikasi (`/admin/artikel.html`)**
- Form CRUD (Create, Read, Update, Delete) untuk data publikasi.
- Field form: Judul Paper, Link DOI/Publisher, Nama Penulis, Tahun Rilis, Topik/Subteam, Upload Graphical Abstract (gambar).
- Gambar diunggah ke **Vercel Blob** — URL gambar disimpan di data YAML/JSON.

**Manajemen Tim & Alumni (`/admin/people.html`)**
- Form CRUD untuk data anggota tim aktif dan alumni.
- Field form: Nama, Posisi/Role, Subteam, Foto, Profil Eksternal URL, Status (Aktif / Alumni).
- Perubahan status dari Aktif menjadi Alumni memindahkan profil ke section Former Members di halaman publik.

---

## 4. Alur Kerja Konten (Ringkasan)

```
Peneliti/Admin login via /admin/login.html
  → Diverifikasi oleh Vercel Function
  → Mengisi form di /admin/artikel.html atau /admin/people.html
  → Data dikirim ke Vercel Function
  → Function commit perubahan ke repo GitHub (JSON/YAML)
  → GitHub Actions/Vercel Pipeline mendeteksi perubahan
  → Jekyll build otomatis
  → Website publik diperbarui dalam < 2 menit
```

---

## 5. Persyaratan Non-Fungsional

### 5.1 Keamanan
- Semua secret (GitHub token, kredensial) disimpan sebagai environment variable di Vercel — tidak pernah di kode frontend.
- Session autentikasi menggunakan `httpOnly` cookie untuk mencegah akses JavaScript dari halaman.
- Folder `/admin/` tidak diindeks oleh mesin pencari (`robots.txt`: `Disallow: /admin/`).

### 5.2 Performa
- Target Lighthouse Score: **≥ 85** untuk Performance, Accessibility, dan SEO.
- Gambar Graphical Abstract dikompresi sebelum disimpan (maks. 500KB per file).
- Filter/Search publikasi diproses di client-side tanpa request tambahan ke server.

### 5.3 SEO & Aksesibilitas
- Setiap halaman memiliki meta title, meta description, dan Open Graph tags yang unik.
- Gambar memiliki atribut `alt` text yang deskriptif.
- Sitemap XML (`sitemap.xml`) dihasilkan otomatis oleh Jekyll.

---

## 6. Roadmap Sprint

| Fitur / Item | Sprint | Prioritas | Keterangan |
|---|---|---|---|
| Hapus semua elemen Substack | Sprint 1 | 🔴 Harus | Homepage refactor |
| Keamanan Admin (server-side auth) | Sprint 1 | 🔴 Harus | Prerequisite semua fitur admin |
| Setup Vercel Blob untuk gambar | Sprint 1 | 🔴 Harus | Prerequisite upload gambar |
| Publications Page + Graphical Abstract | Sprint 1 | 🟡 Penting | Fitur inti website |
| Expandable Subteam Cards | Sprint 1 | 🟡 Penting | Peningkatan UX signifikan |
| Former Members Section | Sprint 2 | 🟡 Penting | Sudah ada di PRD, belum di TRD lama |
| Admin Dashboard UI (Artikel) | Sprint 2 | 🟡 Penting | Setelah backend aman |
| Admin Dashboard UI (People) | Sprint 2 | 🟡 Penting | Setelah backend aman |
| SEO Meta Tags & Sitemap | Sprint 2 | 🟢 Nice to Have | Untuk visibilitas akademisi |
| Multi-user auth & session management | Sprint 2 | 🟡 Penting | Sesuai kebutuhan multi-peneliti |

---

## 7. Kriteria Penerimaan (Definition of Done)

Sebuah fitur dianggap selesai (Done) jika memenuhi semua kriteria berikut:

- Fungsional sesuai deskripsi di PRD ini.
- Tidak ada secret/token yang terekspos di kode frontend.
- Tampil dengan benar di mobile (≥ 375px) dan desktop (≥ 1280px).
- Telah diuji secara manual di browser Chrome dan Firefox terbaru.
- Lighthouse Performance Score ≥ 85 (khusus halaman publik).
