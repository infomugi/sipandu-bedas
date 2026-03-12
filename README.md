# Sipandu Bedas (Sistem Informasi Pelayanan Terpadu Bedas)

Sipandu Bedas adalah platform digital yang dirancang untuk mengintegrasikan layanan 6 SPM (Standar Pelayanan Minimal) dengan kegiatan PKK (Pemberdayaan Kesejahteraan Keluarga) di tingkat desa/kelurahan. Aplikasi ini bertujuan untuk mempermudah pendataan, monitoring, dan pelaporan layanan sosial bagi masyarakat.

## 🚀 Fitur Utama

- **6 Layanan SPM Terintegrasi**:
  - 🏥 **Kesehatan**: Pemantauan gizi, imunisasi, dan layanan kesehatan dasar.
  - 🎓 **Pendidikan**: Pendataan anak usia sekolah dan akses pendidikan.
  - 🏠 **Perumahan**: Layanan terkait hunian layak bagi keluarga.
  - 🏗️ **Pekerjaan Umum (PU)**: Infrastruktur dasar pendukung layanan sosial.
  - 🤝 **Sosial**: Bantuan sosial dan jaminan kesejahteraan masyarakat.
  - 👮 **Trantibum**: Ketenteraman, ketertiban umum, dan perlindungan masyarakat.
- **Keluarga & Anggota**: Manajemen data profil keluarga dan anggota keluarga secara detail.
- **Kunjungan**: Pencatatan aktivitas kunjungan petugas ke rumah tangga.
- **Laporan & Dashboard**: Visualisasi data real-time untuk pengambilan keputusan.
- **Profil & Admin**: Manajemen akses dan pengaturan aplikasi.

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla).
- **Backend**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Database**: [PostgreSQL](https://www.postgresql.org/).

## 📂 Struktur Proyek

```text
sipandu-bedas/
├── api/             # Backend API (Node.js/Express)
│   ├── api.js       # Main API logic
│   ├── package.json # Node.js dependencies
│   └── ...
├── html/            # Frontend HTML pages
├── assets/          # Static files (CSS, Images)
├── db/              # Database scripts
│   └── sipandu_bedas.sql
└── docs/            # Dokumentasi tambahan
```

## ⚙️ Persiapan Instalasi

### 1. Database Setup
Pastikan PostgreSQL telah terinstall di sistem Anda.
1. Buat database baru (misal: `sipandu_bedas`).
2. Import schema dari folder `db`:
   ```bash
   psql -U username -d sipandu_bedas -f db/sipandu_bedas.sql
   ```

### 2. Backend Setup
1. Masuk ke direktori `api`:
   ```bash
   cd api
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Konfigurasikan koneksi database di file `api.js` (pastikan sesuai dengan kredensial PostgreSQL Anda).

### 3. Menjalankan Aplikasi
1. Jalankan server backend:
   ```bash
   node api.js
   ```
   *Secara default, API akan berjalan di port `3000`.*
2. Buka file `html/login.html` atau `html/index.html` melalui browser untuk mengakses tampilan antarmuka (Frontend).

## 📝 Kontribusid
Untuk melakukan pengembangan lebih lanjut:
1. Dokumentasikan perubahan fungsionalitas di folder `docs`.
2. Pastikan setiap penambahan menu baru di frontend (HTML) sinkron dengan endpoint di `api.js`.

---
© 2026 Sipandu Bedas Team
