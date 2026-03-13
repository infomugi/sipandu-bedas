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
- **Mobile App**: Aplikasi mobile berbasis Expo untuk pendataan lapangan.

## 🛠️ Tech Stack

- **Web Frontend**: HTML5, CSS3, JavaScript (Vanilla).
- **Mobile App**: React Native, Expo, TypeScript.
- **Backend API**: [Node.js](https://nodejs.org/) & [Express.js](https://expressjs.com/).
- **Database**: [PostgreSQL](https://www.postgresql.org/).

## 📂 Struktur Proyek

```text
sipandu-bedas/
├── api/             # Backend API (Node.js/Express)
│   ├── api.js       # Main API logic
│   └── ...
├── html/            # Web Frontend
│   ├── assets/      # Static files (CSS, Images) moved here
│   └── ...          # HTML Pages
├── mobile/          # Mobile Application (Expo)
│   ├── app/         # Expo Router pages
│   └── ...
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
3. Konfigurasikan koneksi database di file `api.js`.

### 3. Mobile Setup
1. Masuk ke direktori `mobile`:
   ```bash
   cd mobile
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Jalankan aplikasi:
   ```bash
   npx expo start
   ```

## 💻 Menjalankan Aplikasi Web

1. Jalankan server backend:
   ```bash
   cd api
   node api.js
   ```
   *Secara default, API akan berjalan di port `3000`.*
2. Buka file `html/login.html` melalui browser untuk mengakses Web Frontend.

---
© 2026 Sipandu Bedas Team
