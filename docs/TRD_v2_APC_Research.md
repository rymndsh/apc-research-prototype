# Technical Requirements Document (TRD)

**Nama Proyek:** APC Research Website Redesign (Prototype)
**Klien:** Applied Physics and Chemistry (APC) Research Group @ Nano Center Indonesia
**Versi:** v2.0 — Revisi dengan perbaikan arsitektur keamanan
**Tanggal:** Mei 2026
**Status:** AKTIF — Siap untuk Sprint 1

---

## 1. Technology Stack

### 1.1 Frontend
- **HTML5 & Vanilla JavaScript** — tidak ada framework JS berat untuk menjaga performa dan kemudahan maintenance.
- **Tailwind CSS** — untuk styling, utilitas, dan desain responsif (mobile-first).
- **Jekyll** (berbasis Ruby) — Static Site Generator (SSG) untuk kompilasi template, layout, includes, dan data YAML/JSON menjadi HTML statis.

### 1.2 Backend & API
- **Vercel Serverless Functions** (Node.js) — menangani semua operasi yang membutuhkan secret: autentikasi login, GitHub API calls, dan Vercel Blob uploads.
- **GitHub API** (REST) — digunakan oleh Vercel Function untuk melakukan commit perubahan data ke repository.

### 1.3 Storage
- **GitHub Repository (`_data/`)** — penyimpanan utama untuk data terstruktur (`publications.yml`, `members.json`).
- **Vercel Blob** — penyimpanan file gambar (Graphical Abstract). Dipilih karena: gratis hingga 1GB, tidak membebani repository GitHub dengan file biner, URL publik yang stabil, dan upload langsung dari browser via signed URL.

### 1.4 Hosting & Deployment
- **Website Publik:** Vercel (direkomendasikan) atau GitHub Pages.
- **Serverless API:** Vercel (terintegrasi dengan deployment utama).
- **CI/CD:** Vercel Pipeline atau GitHub Actions — build Jekyll otomatis saat ada commit baru ke branch `main`.

---

## 2. Arsitektur Sistem

### 2.1 Struktur Direktori

```
/
├── _config.yml                  # Konfigurasi Jekyll
├── _data/
│   ├── publications.yml         # Data semua publikasi
│   └── members.json             # Data anggota aktif dan alumni
├── _posts/                      # Artikel/berita format Markdown
├── pages/
│   ├── index.html
│   ├── publications.html
│   └── people.html
├── admin/
│   ├── login.html               # Halaman login Admin Dashboard
│   ├── artikel.html             # CRUD Publikasi
│   └── people.html              # CRUD Anggota Tim & Alumni
├── api/
│   ├── auth.js                  # Vercel Function: verifikasi login, issue session cookie
│   ├── publish.js               # Vercel Function: commit data ke GitHub via GitHub API
│   └── upload.js                # Vercel Function: generate Vercel Blob signed URL
├── assets/                      # CSS compiled, ikon, gambar statis non-Blob
└── vercel.json                  # Konfigurasi Vercel: routing, env, function settings
```

---

## 3. Alur Data & Keamanan (Arsitektur Revisi)

> ⚠️ **Perubahan Kritis dari TRD Lama:**
> TRD lama menggunakan autentikasi pure frontend (HTML/JS). Ini sudah diganti: semua operasi sensitif (login, GitHub API, Blob upload) **HARUS** melewati Vercel Serverless Function. Token GitHub dan secret **TIDAK BOLEH** ada di kode frontend.

### 3.1 Alur Autentikasi (Multi-User)

1. Admin membuka `/admin/login.html` dan mengisi username + password.
2. Browser mengirim POST request ke Vercel Function `/api/auth.js`.
3. Function memverifikasi kredensial dari environment variable (`ADMIN_USERS`) — bukan dari file yang bisa diakses publik.
4. Jika valid: Function men-set `httpOnly` cookie berisi session token (JWT). Cookie tidak bisa dibaca oleh JavaScript di browser.
5. Browser diarahkan ke `/admin/artikel.html` atau `/admin/people.html`.
6. Setiap request ke `/api/*` memeriksa keberadaan dan validitas cookie — jika tidak valid, dikembalikan HTTP 401.

### 3.2 Alur Submit Publikasi

1. Admin mengisi form di `/admin/artikel.html` (judul, DOI, penulis, tahun, topik).
2. Untuk Graphical Abstract: browser meminta signed URL ke `/api/upload.js` (Function memverifikasi session dulu).
3. Browser mengupload file gambar langsung ke Vercel Blob menggunakan signed URL — file tidak melewati server.
4. Vercel Blob mengembalikan URL publik gambar (mis. `https://blob.vercel-storage.com/abc123.jpg`).
5. Browser mengirim semua data form + URL gambar ke `/api/publish.js`.
6. Function memverifikasi session, lalu menggunakan GitHub API (dengan `GITHUB_TOKEN` dari env var) untuk membaca `_data/publications.yml`, menambahkan entry baru, dan commit kembali ke repo.
7. GitHub push men-trigger Vercel Pipeline untuk rebuild Jekyll.
8. Website publik diperbarui dalam waktu **< 2 menit**.

### 3.3 Environment Variables (Wajib Dikonfigurasi di Vercel)

| Variabel | Keterangan |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token GitHub dengan permission `contents: write`. WAJIB ada di env var Vercel, **TIDAK BOLEH** di kode. |
| `GITHUB_REPO` | Nama repo target, mis. `username/apc-research-website` |
| `JWT_SECRET` | String acak panjang untuk signing session token JWT. |
| `ADMIN_USERS` | JSON string berisi daftar username & hashed password. Mis: `[{"user":"arif","hash":"bcrypt..."}]` |
| `BLOB_READ_WRITE_TOKEN` | Token Vercel Blob untuk operasi upload/read via SDK. |

---

## 4. Langkah Implementasi per Sprint

### Sprint 1 — Fondasi & Keamanan

1. **Konfigurasi Vercel:** Setup environment variables (`GITHUB_TOKEN`, `JWT_SECRET`, `ADMIN_USERS`, `BLOB_READ_WRITE_TOKEN`).
2. **Buat `api/auth.js`:** Endpoint POST `/api/auth` untuk verifikasi login dan set `httpOnly` cookie.
3. **Buat `api/upload.js`:** Generate signed URL Vercel Blob untuk upload gambar.
4. **Buat `api/publish.js`:** Terima data form, commit ke GitHub API.
5. **Homepage Refactor:** Hapus semua elemen Substack dari HTML/CSS.
6. **Publications Page:** Tambahkan blok gambar (Graphical Abstract) di card publikasi. Ubah tombol "Read Full Paper" menjadi link dinamis dari data YAML.
7. **Tambahkan `robots.txt`** dengan `Disallow: /admin/` agar halaman admin tidak terindeks.

### Sprint 2 — Fitur Lanjutan & Admin UI

1. **Expandable Subteam Cards:** Implementasi DOM interaktif. Saat kartu diklik, expand section berisi anggota, galeri, projects, dan paper.
2. **People Page:** Tambahkan section Former Members & Alumni, dirender dari `members.json` berdasarkan field `status: alumni`.
3. **Admin Dashboard UI:** Bangun antarmuka `/admin/artikel.html` dan `/admin/people.html` dengan form CRUD yang terhubung ke Vercel Functions.
4. **SEO:** Tambahkan meta title, meta description, Open Graph tags, dan `sitemap.xml` via plugin Jekyll.
5. **Testing:** Uji manual di Chrome & Firefox. Jalankan Lighthouse audit untuk semua halaman publik.

---

## 5. Skema Data

### 5.1 `_data/publications.yml`

Setiap entry publikasi memiliki struktur berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| `title` | String | Judul paper |
| `authors` | String | Nama penulis, dipisah koma |
| `year` | Integer | Tahun publikasi |
| `doi_url` | String (URL) | Link DOI atau Publisher langsung |
| `topic` | String | Topik/subteam (mis. `wastewater`, `nanofibers`) |
| `abstract_short` | String | Abstrak singkat (maks. 300 karakter) |
| `graphical_abstract_url` | String (URL) | URL publik dari Vercel Blob |

Contoh entry:

```yaml
- title: "Effect of Nanobubbles on Wastewater Remediation Efficiency"
  authors: "Arramel, A., Santoso, B., Wijaya, C."
  year: 2025
  doi_url: "https://doi.org/10.1002/example.123"
  topic: "wastewater"
  abstract_short: "This study investigates the application of micro- and nanobubbles for wastewater treatment..."
  graphical_abstract_url: "https://blob.vercel-storage.com/ga-paper-001.jpg"
```

### 5.2 `_data/members.json`

Setiap entry anggota memiliki field berikut:

| Field | Tipe | Keterangan |
|---|---|---|
| `id` | String | ID unik anggota |
| `name` | String | Nama lengkap |
| `position` | String | Posisi/role (mis. `Researcher`, `PhD Candidate`) |
| `subteam` | String | Nama subteam |
| `photo_url` | String (URL) | URL foto profil |
| `external_profile_url` | String (URL) | Link ResearchGate atau LinkedIn |
| `status` | String | `active` atau `alumni` |
| `join_year` | Integer | Tahun bergabung |

Contoh entry:

```json
[
  {
    "id": "member-001",
    "name": "Budi Santoso",
    "position": "Researcher",
    "subteam": "wastewater",
    "photo_url": "https://blob.vercel-storage.com/photo-budi.jpg",
    "external_profile_url": "https://www.researchgate.net/profile/Budi-Santoso",
    "status": "active",
    "join_year": 2023
  }
]
```

---

## 6. Konfigurasi `vercel.json`

File `vercel.json` di root project wajib mengandung konfigurasi berikut:

- **Routing:** Semua request ke `/api/*` diarahkan ke Vercel Functions, bukan ke Jekyll output.
- **Headers:** `Content-Security-Policy` yang melarang inline scripts dari domain tidak dikenal.
- **Rewrites:** Pastikan Jekyll output di `_site/` dapat diakses sebagai root website.
- **Environment:** Semua variabel sensitif di-set via Vercel Dashboard, tidak di `vercel.json` itu sendiri.

Contoh struktur dasar:

```json
{
  "version": 2,
  "builds": [
    { "src": "api/**/*.js", "use": "@vercel/node" }
  ],
  "routes": [
    { "src": "/api/(.*)", "dest": "/api/$1" },
    { "src": "/(.*)", "dest": "/_site/$1" }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" }
      ]
    }
  ]
}
```

---

## 7. Checklist Keamanan Pra-Launch

Sebelum website diluncurkan ke publik, tim **wajib** memverifikasi semua item berikut:

- [ ] Tidak ada token/secret yang ditemukan di kode frontend dengan cara inspect element atau view-source.
- [ ] Endpoint `/api/auth.js` menolak semua request tanpa session cookie yang valid (return 401).
- [ ] Folder `/admin/` mengembalikan 404 atau redirect login jika diakses tanpa autentikasi.
- [ ] File `robots.txt` memuat `Disallow: /admin/`.
- [ ] Upload gambar ke Vercel Blob berhasil dan URL yang dikembalikan dapat diakses publik.
- [ ] Commit ke GitHub repo berhasil dipicu dari `/api/publish.js` dan build otomatis terjadi.
- [ ] Lighthouse Score ≥ 85 untuk halaman `index.html` dan `publications.html`.
