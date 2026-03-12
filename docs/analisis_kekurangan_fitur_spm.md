# Analisis Potensi Kekurangan Field dan Menu Aplikasi Sipandu Bedas (6 Layanan SPM)

Berdasarkan struktur antarmuka dan alur (flow) yang telah dibangun pada _prototype_ saat ini, berikut adalah analisis mengenai potensi kekurangan baik dari segi kelengkapan kolom input (field) maupun fitur/menu yang sebaiknya ada agar aplikasi ini dapat beroperasi sacara komprehensif di dunia nyata.

---

## 1. Modul Global & Sistem (Missing Menus/Features)

Meskipun _prototype_ sudah mencakup alur utama, ada beberapa menu penunjang yang krusial untuk pelaporan resmi tingkat desa/kabupaten:

- **Menu Pelacakan Status (Tracking Pengajuan)**
  - Saat ini pengguna hanya bisa menekan tombol "Ajukan" atau "Simpan". Perlu ada menu khusus (misal: "Riwayat Pengajuan") di mana Kader RW bisa memantau status SPM yang diajukan (Status: _Menunggu Verifikasi Desa_, _Diterima_, _Diproses Dinas_, _Selesai_, _Ditolak_).
- **Menu Manajemen Profil Lengkap**
  - Diperlukan halaman untuk mengatur profil Kader RW, mengubah _password_, dan mengatur notifikasi.
- **Modul Pengelolaan Anggota Keluarga (Detail)**
  - Halaman `tambah-keluarga.html` saat ini hanya difokuskan pada **Kepala Keluarga**. Di lapangan, sasaran Posyandu adalah _individu_ dalam keluarga tersebut (Anak balita, Ibu hamil, Lansia). Perlu ada fitur untuk **Menambah Anggota Keluarga** di dalam satu nomor KK.
- **Dashboard Laporan & Statistik (Analitik)**
  - Menu "Laporan" perlu dijabarkan menjadi _Filter_ rentang tanggal, grafik perbandingan partisipasi warga per RT, dan tombol **Export (PDF/Excel)** untuk diserahkan ke Kepala Desa.

---

## 2. Kekurangan Field per Modul / Layanan

Berikut adalah rincian fild/input yang berpotensi kurang untuk mengakomodasi kebutuhan data riil dari 6 Layanan SPM:

### A. Modul Pendaftaran & Keluarga (`tambah-keluarga.html`)

Data dasar keluarga masih terlalu umum.

- **Kekurangan Field:**
  - _Status Kesejahteraan Ekonomi_ (Pra-Sejahtera, Sejahtera I, dsb.) - Penting untuk prioritas bantuan.
  - _Status Asuransi Kesehatan_ (Memiliki BPJS/KIS atau mandiri).
  - _Pekerjaan_ dan _Pendapatan Rata-rata_ Kepala Keluarga.

### B. SPM Kesehatan (`spm-kesehatan.html`)

Posyandu identik dengan sistem **Sistem 5 Meja**. Konsep saat ini terlalu disederhanakan.

- **Kekurangan Field / Fitur:**
  - _Pilihan Menu Sasaran_: Perlu ditambahkan _Pasangan Usia Subur (PUS)_ dan _Lansia_.
  - **Untuk Balita**: Kurang riwayat Imunisasi, Status Gizi (Garis Merah/Kuning/Hijau berdasarkan algoritma TB/BB), Pemberian Vitamin A & Obat Cacing.
  - **Untuk Ibu Hamil**: Kurang Ukuran Lingkar Lengan Atas (LiLA) untuk deteksi KEK, Usia Kehamilan (Minggu), dan Tekanan Darah.

### C. SPM Pendidikan (`spm-pendidikan.html`)

- **Kekurangan Field:**
  - _Nama Spesifik Anak_ yang membutuhkan pendampingan/pembiayaan pendidikan (harus merujuk ke database anggota keluarga).
  - _Usia_ sasaran pendidikan.
  - _Jenjang Target_ (PAUD, TK, SD, SMP).
  - _Nama Institusi Sekolah_ (jika sudah masuk dan menunggak biaya).

### D. SPM Pekerjaan Umum (`spm-pu.html`)

Proyek infrastruktur desa/RW membutuhkan bukti spasial yang kuat.

- **Kekurangan Field:**
  - **Titik Koordinat Geografis (GPS Latitude/Longitude)** dari lokasi yang diajukan.
  - _Foto Lokasi Saat Ini_ (Kondisi sebelum pembangunan).
  - _Estimasi Dimensi Pembangunan_ (Contoh: Panjang saluran sekian meter, Luas MCK sekian meter persegi).

### E. SPM Perumahan (Rutilahu) (`spm-perumahan.html`)

Bantuan Rutilahu (Rumah Tidak Layak Huni) sangat ketat secara administrasi.

- **Kekurangan Field:**
  - **Titik Koordinat Geografis (GPS)** rumah sasaran.
  - _Status Kepemilikan Lahan_ (Milik Sendiri / Sewa / Numpang). (Syarat utama rutilahu biasanya lahan harus milik sendiri).
  - _Checklist_ Kondisi Bangunan Eksisting: Jenis Atap (Rumbia/Asbes/Seng), Jenis Dinding (Bilik/Setengah Tembok), Jenis Lantai (Tanah/Plesteran).

### F. SPM Trantibumlinmas (`spm-trantibum.html`)

Laporan kejadian keamanan dan ketertiban butuh aspek kronologis.

- **Kekurangan Field:**
  - _Tanggal dan Waktu (Jam) Kejadian_ secara akurat.
  - **Titik Koordinat Geografis (GPS)** lokasi kejadian.
  - _Estimasi Jumlah Korban / Kerugian_ (Opsional).

### G. SPM Sosial (`spm-sosial.html`)

Menangani masalah Penyandang Masalah Kesejahteraan Sosial (PMKS).

- **Kekurangan Field:**
  - _Nomor Induk Kependudukan (NIK)_ sasaran secara spesifik (jika ada identitas).
  - _Titik Lokasi Ditemukan_ (jika target adalah Anak Jalanan/Gelandangan/Orang Terlantar).
  - _Deskripsi Bantuan Mendesak_ yang paling dibutuhkan (Pakaian, Makanan, Medis, dsb).

---

## 3. Kesimpulan & Rekomendasi Alur (Flow)

- **Integrasi Data Spasial:** Untuk SPM PU, Perumahan, dan Trantibum, sangat direkomendasikan untuk menambahkan integrasi _Google Maps API / Leaflet_ agar kader bisa _pinpoint_ lokasi kejadian secara akurat dari _smartphone_.
- **Pemisahan Entitas Keluarga & Anggota:** Alur terbaik adalah: Kader Mendaftarkan No KK -> Kader menambahkan NIK dan nama Istri, Anak ke-1, Anak ke-2, dsb. -> Saat ke menu SPM kesehatan, Kader memilih nama anaknya (bukan nama Bapak/Kepala Keluarga).
