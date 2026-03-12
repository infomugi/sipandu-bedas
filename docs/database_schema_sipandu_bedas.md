# 📊 Database Schema & SQL Query — Sipandu Bedas

> Aplikasi Mobile Posyandu & 6 Layanan SPM (Standar Pelayanan Minimal)  
> Wilayah: RW 11, Rancamanyar, Baleendah, Kabupaten Bandung  
> Dibuat: 2026-03-12

---

## 🗂️ Ringkasan Analisa Project

Sipandu Bedas adalah aplikasi mobile web berbasis HTML/CSS (Progressive Web App) yang dioperasikan oleh **Kader Posyandu** tingkat RW. Aplikasi mencakup:

| Halaman                                                 | Fungsi                                                         |
| ------------------------------------------------------- | -------------------------------------------------------------- |
| `index.html`                                            | Dashboard utama, statistik keluarga & kunjungan                |
| `login.html` / `register.html` / `forgot-password.html` | Autentikasi kader                                              |
| `pendaftaran.html`                                      | Daftar & cari data keluarga binaan                             |
| `tambah-keluarga.html`                                  | Form pendaftaran keluarga baru (KK + anggota + sosek + alamat) |
| `tambah-kunjungan.html`                                 | Pencatatan kehadiran Posyandu                                  |
| `spm-menu.html`                                         | Menu 6 Layanan SPM                                             |
| `spm-kesehatan.html`                                    | Layanan 5 Meja Posyandu (Balita, Bumil, PUS, Lansia)           |
| `spm-pendidikan.html`                                   | Bantuan biaya / fasilitas belajar                              |
| `spm-perumahan.html`                                    | Bantuan renovasi rumah tidak layak huni (Rutilahu)             |
| `spm-pu.html`                                           | Sanitasi, MCK, sarana air bersih                               |
| `spm-sosial.html`                                       | Disabilitas, lansia terlantar, anak terlantar                  |
| `spm-trantibum.html`                                    | Pengaduan keamanan & ketertiban                                |
| `riwayat-pengajuan.html`                                | Tracking status pengajuan SPM                                  |
| `laporan.html`                                          | Laporan & statistik                                            |
| `profil.html`                                           | Profil & pengaturan kader                                      |

---

## 🏗️ ERD (Entity Relationship — Ringkasan)

```
users (kader)
  └──< keluarga (kepala_keluarga)
         └──< anggota_keluarga
                └──< kunjungan_posyandu
                └──< spm_kesehatan
                └──< spm_pendidikan
         └──< spm_perumahan
         └──< spm_pu
         └──< spm_sosial
         └──< spm_trantibum
         └──< pengajuan_spm (log status semua SPM)
```

---

## 📦 DDL — CREATE TABLE

### 1. Tabel `users` (Kader Posyandu)

```sql
CREATE TABLE users (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    nama_lengkap    VARCHAR(150)    NOT NULL,
    nik             CHAR(16)        NOT NULL UNIQUE,
    email           VARCHAR(150)    UNIQUE,
    no_hp           VARCHAR(20)     NOT NULL,
    password        VARCHAR(255)    NOT NULL,
    foto_profil     VARCHAR(255)    NULL,
    rw              VARCHAR(10)     NOT NULL DEFAULT '11',
    rt              VARCHAR(10)     NULL,
    desa            VARCHAR(100)    NOT NULL DEFAULT 'RANCAMANYAR',
    kecamatan       VARCHAR(100)    NOT NULL DEFAULT 'BALEENDAH',
    kabupaten       VARCHAR(100)    NOT NULL DEFAULT 'BANDUNG',
    role            ENUM('kader','admin_desa','dinas') NOT NULL DEFAULT 'kader',
    is_active       TINYINT(1)      NOT NULL DEFAULT 1,
    email_verified_at TIMESTAMP     NULL,
    remember_token  VARCHAR(100)    NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 2. Tabel `keluarga` (Data Kartu Keluarga)

```sql
CREATE TABLE keluarga (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    no_kk               CHAR(16)        NOT NULL UNIQUE COMMENT 'Nomor Kartu Keluarga 16 digit',
    kader_id            BIGINT UNSIGNED NOT NULL COMMENT 'Kader yang mendaftarkan',
    alamat_lengkap      TEXT            NOT NULL,
    rt                  VARCHAR(10)     NOT NULL,
    rw                  VARCHAR(10)     NOT NULL,
    desa                VARCHAR(100)    NOT NULL DEFAULT 'RANCAMANYAR',
    kecamatan           VARCHAR(100)    NOT NULL DEFAULT 'BALEENDAH',
    kabupaten           VARCHAR(100)    NOT NULL DEFAULT 'BANDUNG',
    -- Data Sosial Ekonomi KK
    status_kesejahteraan ENUM(
        'pra_sejahtera',
        'sejahtera_1',
        'sejahtera_2',
        'sejahtera_3'
    ) NOT NULL DEFAULT 'pra_sejahtera',
    status_asuransi     ENUM(
        'bpjs_pbi',
        'bpjs_mandiri',
        'asuransi_swasta',
        'tidak_memiliki'
    ) NOT NULL DEFAULT 'tidak_memiliki',
    pekerjaan_kk        VARCHAR(150)    NULL,
    estimasi_pendapatan ENUM(
        'lt_1jt',
        '1_3jt',
        'gt_3jt'
    ) NULL,
    tgl_pendaftaran     DATE            NOT NULL,
    is_aktif            TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_keluarga_kader FOREIGN KEY (kader_id) REFERENCES users(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 3. Tabel `anggota_keluarga` (Individu dalam KK)

```sql
CREATE TABLE anggota_keluarga (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id         BIGINT UNSIGNED NOT NULL,
    nik                 CHAR(16)        NOT NULL UNIQUE,
    nama_lengkap        VARCHAR(150)    NOT NULL,
    jenis_kelamin       ENUM('L','P')   NOT NULL,
    tanggal_lahir       DATE            NOT NULL,
    tempat_lahir        VARCHAR(100)    NULL,
    status_keluarga     ENUM(
        'kepala_keluarga',
        'istri',
        'anak',
        'lainnya'
    ) NOT NULL DEFAULT 'anak',
    -- Field tambahan yang relevan
    status_asuransi     ENUM('bpjs_pbi','bpjs_mandiri','asuransi_swasta','tidak_memiliki') NULL,
    pendidikan_terakhir ENUM('tidak_sekolah','sd','smp','sma','d3','s1','s2_plus') NULL,
    pekerjaan           VARCHAR(150)    NULL,
    foto_ktp            VARCHAR(255)    NULL,
    is_aktif            TINYINT(1)      NOT NULL DEFAULT 1,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_anggota_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Index untuk lookup cepat
CREATE INDEX idx_anggota_nik ON anggota_keluarga(nik);
CREATE INDEX idx_anggota_keluarga_id ON anggota_keluarga(keluarga_id);
```

---

### 4. Tabel `kunjungan_posyandu` (Absensi / Kehadiran)

```sql
CREATE TABLE kunjungan_posyandu (
    id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id     BIGINT UNSIGNED NOT NULL,
    kader_id        BIGINT UNSIGNED NOT NULL,
    tgl_kunjungan   DATE            NOT NULL,
    bulan           TINYINT UNSIGNED NOT NULL COMMENT '1-12',
    tahun           SMALLINT UNSIGNED NOT NULL,
    catatan         TEXT            NULL,
    created_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at      TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_kunjungan_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE,
    CONSTRAINT fk_kunjungan_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)    ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 5. Tabel `spm_kesehatan` (Layanan 5 Meja Posyandu)

```sql
CREATE TABLE spm_kesehatan (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id         BIGINT UNSIGNED NOT NULL,
    anggota_id          BIGINT UNSIGNED NOT NULL COMMENT 'Sasaran spesifik (balita/bumil/dll)',
    kader_id            BIGINT UNSIGNED NOT NULL,
    tgl_pelayanan       DATE            NOT NULL,
    jenis_sasaran       ENUM('balita','bumil','pus','lansia') NOT NULL,
    -- === BALITA ===
    berat_badan         DECIMAL(5,2)    NULL COMMENT 'kg',
    tinggi_badan        DECIMAL(5,2)    NULL COMMENT 'cm',
    status_kms          ENUM('hijau','kuning','merah') NULL COMMENT 'Status garis pita KMS',
    jenis_imunisasi     VARCHAR(100)    NULL,
    terima_vitamin_a    TINYINT(1)      NULL DEFAULT 0,
    terima_obat_cacing  TINYINT(1)      NULL DEFAULT 0,
    -- === IBU HAMIL ===
    usia_kehamilan_mgg  TINYINT UNSIGNED NULL COMMENT 'Usia kehamilan dalam minggu',
    tekanan_darah       VARCHAR(20)     NULL COMMENT 'Contoh: 120/80',
    lingkar_lengan_cm   DECIMAL(4,2)    NULL COMMENT 'LiLA untuk deteksi KEK (<23.5cm)',
    -- === MEJA 5: PENYULUHAN ===
    catatan_tindak_lanjut TEXT          NULL,
    ajukan_bantuan      TINYINT(1)      NOT NULL DEFAULT 0,
    -- === GPS ===
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(11,7)   NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmkes_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id),
    CONSTRAINT fk_spmkes_anggota  FOREIGN KEY (anggota_id)  REFERENCES anggota_keluarga(id),
    CONSTRAINT fk_spmkes_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 6. Tabel `spm_pendidikan` (Bantuan Biaya / Fasilitas Belajar)

```sql
CREATE TABLE spm_pendidikan (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id         BIGINT UNSIGNED NOT NULL,
    anggota_id          BIGINT UNSIGNED NOT NULL COMMENT 'Anak sasaran pendidikan',
    kader_id            BIGINT UNSIGNED NOT NULL,
    tgl_pengajuan       DATE            NOT NULL,
    jenjang_pendidikan  ENUM(
        'paud_tk',
        'sd_mi',
        'smp_mts',
        'sma_smk_ma',
        'putus_sekolah'
    ) NOT NULL,
    kelas               VARCHAR(10)     NULL,
    nama_institusi      VARCHAR(200)    NULL COMMENT 'Nama sekolah jika sudah terdaftar',
    jenis_bantuan       ENUM(
        'pelunasan_tunggakan',
        'seragam_alat_tulis',
        'fasilitas_belajar',
        'beasiswa_lanjutan'
    ) NOT NULL,
    keterangan_alasan   TEXT            NOT NULL,
    file_bukti          VARCHAR(255)    NULL COMMENT 'Path file dokumen tagihan/surat',
    -- GPS
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(11,7)   NULL,
    status_pengajuan    ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_verifikator TEXT            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmpend_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id),
    CONSTRAINT fk_spmpend_anggota  FOREIGN KEY (anggota_id)  REFERENCES anggota_keluarga(id),
    CONSTRAINT fk_spmpend_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 7. Tabel `spm_perumahan` (Bantuan Rutilahu)

```sql
CREATE TABLE spm_perumahan (
    id                      BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id             BIGINT UNSIGNED NOT NULL,
    kader_id                BIGINT UNSIGNED NOT NULL,
    tgl_pengajuan           DATE            NOT NULL,
    -- GPS lokasi rumah
    latitude                DECIMAL(10,7)   NULL,
    longitude               DECIMAL(11,7)   NULL,
    -- Dokumen (path file)
    file_ktp                VARCHAR(255)    NULL,
    file_kk                 VARCHAR(255)    NULL,
    file_sk_penghasilan     VARCHAR(255)    NULL,
    file_bukti_lahan        VARCHAR(255)    NULL,
    foto_rumah_depan        VARCHAR(255)    NULL,
    foto_rumah_samping      VARCHAR(255)    NULL,
    foto_rumah_belakang     VARCHAR(255)    NULL,
    -- Kondisi bangunan (dari analisis)
    status_kepemilikan_lahan ENUM('milik_sendiri','sewa','numpang') NULL,
    jenis_atap              ENUM('rumbia','asbes_seng','genteng','beton') NULL,
    jenis_dinding           ENUM('bilik_bambu','setengah_tembok','tembok_penuh') NULL,
    jenis_lantai            ENUM('tanah','plesteran','keramik') NULL,
    pernyataan_belum_pernah_terima TINYINT(1) NOT NULL DEFAULT 0,
    status_pengajuan        ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_verifikator     TEXT            NULL,
    created_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at              TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmrum_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id),
    CONSTRAINT fk_spmrum_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 8. Tabel `spm_pu` (Pekerjaan Umum — Sanitasi, MCK, Air Bersih)

```sql
CREATE TABLE spm_pu (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id         BIGINT UNSIGNED NOT NULL COMMENT 'KK pengusul',
    kader_id            BIGINT UNSIGNED NOT NULL,
    tgl_pengajuan       DATE            NOT NULL,
    jenis_kebutuhan     ENUM(
        'sanitasi_septic_tank',
        'mck_umum',
        'sarana_air_bersih'
    ) NOT NULL,
    detail_lokasi       TEXT            NOT NULL COMMENT 'Deskripsi lokasi RT/Dusun',
    -- GPS
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(11,7)   NULL,
    -- Dimensi estimasi (dari analisis)
    estimasi_dimensi    VARCHAR(200)    NULL COMMENT 'Cth: Panjang drainase 50m',
    -- Dokumen
    file_surat_permohonan VARCHAR(255)  NULL,
    status_pengajuan    ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_verifikator TEXT            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmpu_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id),
    CONSTRAINT fk_spmpu_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 9. Tabel `spm_sosial` (Disabilitas, Lansia, Anak Terlantar, PMKS)

```sql
CREATE TABLE spm_sosial (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    keluarga_id         BIGINT UNSIGNED NULL COMMENT 'NULL jika target tidak dikenal (gelandangan)',
    kader_id            BIGINT UNSIGNED NOT NULL,
    tgl_pengajuan       DATE            NOT NULL,
    kategori_sasaran    ENUM(
        'penyandang_disabilitas',
        'lansia',
        'anak_terlantar',
        'tuna_sosial',
        'korban_bencana'
    ) NOT NULL,
    -- NIK sasaran jika ada
    nik_sasaran         CHAR(16)        NULL,
    nama_sasaran        VARCHAR(150)    NULL,
    penjelasan_kondisi  TEXT            NOT NULL,
    bantuan_mendesak    VARCHAR(200)    NULL COMMENT 'Pakaian/Makanan/Medis/dll',
    -- GPS lokasi ditemukan
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(11,7)   NULL,
    -- Dokumen
    file_identitas_sasaran  VARCHAR(255) NULL,
    file_sk_desa            VARCHAR(255) NULL,
    status_pengajuan    ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_verifikator TEXT            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmsosial_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id),
    CONSTRAINT fk_spmsosial_kader    FOREIGN KEY (kader_id)    REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 10. Tabel `spm_trantibum` (Keamanan & Ketertiban)

```sql
CREATE TABLE spm_trantibum (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kader_id            BIGINT UNSIGNED NOT NULL,
    tgl_pengajuan       DATE            NOT NULL,
    waktu_kejadian      DATETIME        NULL COMMENT 'Tanggal & jam kejadian spesifik',
    kategori_laporan    ENUM(
        'kebakaran',
        'kdrt_asusila',
        'bencana_alam',
        'narkoba_premanisme',
        'illegal_logging_fishing'
    ) NOT NULL,
    detail_kejadian     TEXT            NOT NULL,
    -- GPS lokasi kejadian
    latitude            DECIMAL(10,7)   NULL,
    longitude           DECIMAL(11,7)   NULL,
    -- Identitas pelapor (opsional jika anonim)
    is_anonim           TINYINT(1)      NOT NULL DEFAULT 0,
    nama_pelapor        VARCHAR(150)    NULL,
    no_kontak_pelapor   VARCHAR(20)     NULL,
    file_ktp_pelapor    VARCHAR(255)    NULL,
    -- Estimasi kerugian
    estimasi_korban     TINYINT UNSIGNED NULL,
    estimasi_kerugian   BIGINT UNSIGNED NULL COMMENT 'Dalam rupiah',
    status_pengajuan    ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    catatan_verifikator TEXT            NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_spmtran_kader FOREIGN KEY (kader_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

### 11. Tabel `pengajuan_spm` (Master Log Status Semua Pengajuan)

```sql
CREATE TABLE pengajuan_spm (
    id                  BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    kader_id            BIGINT UNSIGNED NOT NULL,
    keluarga_id         BIGINT UNSIGNED NULL,
    jenis_spm           ENUM(
        'kesehatan',
        'pendidikan',
        'perumahan',
        'pekerjaan_umum',
        'sosial',
        'trantibum'
    ) NOT NULL,
    ref_id              BIGINT UNSIGNED NOT NULL COMMENT 'ID di tabel detail masing-masing SPM',
    status              ENUM(
        'menunggu_verifikasi',
        'diterima',
        'diproses_dinas',
        'selesai',
        'ditolak'
    ) NOT NULL DEFAULT 'menunggu_verifikasi',
    kode_pengajuan      VARCHAR(30)     GENERATED ALWAYS AS (
        CONCAT(UPPER(SUBSTR(jenis_spm,1,3)), LPAD(id, 6,'0'), YEAR(created_at))
    ) STORED UNIQUE,
    catatan             TEXT            NULL,
    updated_by          BIGINT UNSIGNED NULL,
    created_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pengajuan_kader    FOREIGN KEY (kader_id)    REFERENCES users(id),
    CONSTRAINT fk_pengajuan_keluarga FOREIGN KEY (keluarga_id) REFERENCES keluarga(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

---

## 🌱 DML — Sample Data (INSERT)

### Kader & Admin

```sql
-- Password: 'password' (hashed dengan bcrypt)
INSERT INTO users (nama_lengkap, nik, email, no_hp, password, rw, rt, role) VALUES
('HANSAH DARMAWAN',  '3204320305940004', 'hansah@rw11.id',  '081234567890', '$2y$10$...hash...', '11', '3', 'kader'),
('SITI RAHAYU',      '3204320601900011', 'siti@rw11.id',    '081298765432', '$2y$10$...hash...', '11', '5', 'kader'),
('ADMIN DESA RANCAMANYAR', '3204320701850001', 'admin@rancamanyar.id', '022123456', '$2y$10$...hash...', NULL, NULL, 'admin_desa');
```

### Data Keluarga

```sql
INSERT INTO keluarga (no_kk, kader_id, alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran) VALUES
('3204320305940004', 1, 'Kp. Rancamanyar RT 03 RW 11 No. 12', '3', '11', 'pra_sejahtera', 'bpjs_pbi', 'Buruh Tani', 'lt_1jt', '2025-01-15'),
('3204320432030594', 1, 'Kp. Rancamanyar RT 05 RW 11 No. 7',  '5', '11', 'sejahtera_1',   'bpjs_mandiri', 'Pedagang', '1_3jt', '2025-02-20');
```

### Anggota Keluarga

```sql
INSERT INTO anggota_keluarga (keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, status_keluarga) VALUES
-- KK 1
(1, '3204320305940004', 'HANSAH DARMAWAN', 'L', '1994-03-05', 'kepala_keluarga'),
(1, '3204326001980002', 'ATANG LESTARI',   'P', '1998-01-06', 'istri'),
(1, '3204310501230001', 'SUSI',            'P', '2023-05-01', 'anak'),
(1, '3204322508210002', 'BUDI',            'L', '2021-06-25', 'anak'),
-- KK 2
(2, '3504320305940111', 'ATANG OKTAVIANA', 'L', '1990-03-05', 'kepala_keluarga');
```

### Kunjungan Posyandu

```sql
INSERT INTO kunjungan_posyandu (keluarga_id, kader_id, tgl_kunjungan, bulan, tahun, catatan) VALUES
(1, 1, '2025-08-25', 8, 2025, 'Hadir lengkap'),
(1, 1, '2025-09-22', 9, 2025, 'Tidak hadir - sakit'),
(2, 1, '2025-08-26', 8, 2025, 'Hadir');
```

### SPM Kesehatan — Balita

```sql
INSERT INTO spm_kesehatan
    (keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran, berat_badan, tinggi_badan, status_kms, jenis_imunisasi, terima_vitamin_a, terima_obat_cacing, catatan_tindak_lanjut, ajukan_bantuan, latitude, longitude)
VALUES
    (1, 4, 1, '2025-08-25', 'balita', 11.5, 85.0, 'hijau', 'DPT-HB-Hib 1', 1, 0, 'Pertumbuhan normal, lanjut pantau bulan depan', 0, -7.0252123, 107.6190456),
    (1, 3, 1, '2025-08-25', 'balita', 9.2, 70.5, 'kuning', 'Tidak Ada', 1, 1, 'BGM - Perlu PMT Pemulihan, ajukan ke Puskesmas', 1, -7.0252123, 107.6190456);
```

### Pengajuan SPM (Master Log)

```sql
INSERT INTO pengajuan_spm (kader_id, keluarga_id, jenis_spm, ref_id, status) VALUES
(1, 1, 'kesehatan',     2, 'menunggu_verifikasi'),
(1, 1, 'pendidikan',    1, 'diterima'),
(1, 1, 'perumahan',     1, 'diproses_dinas');
```

---

## 🔍 DQL — Query Analitik & Operasional

### Q1. Dashboard Kader — Statistik Utama (index.html)

```sql
-- Jumlah keluarga binaan dan total kunjungan bulan ini
SELECT
    (SELECT COUNT(*) FROM keluarga WHERE kader_id = 1 AND is_aktif = 1)          AS total_keluarga,
    (SELECT COUNT(*) FROM kunjungan_posyandu
     WHERE kader_id = 1 AND bulan = MONTH(CURDATE()) AND tahun = YEAR(CURDATE())) AS kunjungan_bulan_ini;
```

---

### Q2. Daftar Keluarga dengan Info Kunjungan Terakhir (pendaftaran.html)

```sql
SELECT
    k.id,
    k.no_kk,
    k.rt,
    k.rw,
    a.nama_lengkap          AS nama_kepala_keluarga,
    a.nik                   AS nik_kepala_keluarga,
    kj.tgl_kunjungan        AS kunjungan_terakhir,
    p.status                AS status_spm_terakhir
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
LEFT JOIN kunjungan_posyandu kj ON kj.id = (
    SELECT id FROM kunjungan_posyandu
    WHERE keluarga_id = k.id ORDER BY tgl_kunjungan DESC LIMIT 1
)
LEFT JOIN pengajuan_spm p ON p.id = (
    SELECT id FROM pengajuan_spm
    WHERE keluarga_id = k.id ORDER BY created_at DESC LIMIT 1
)
WHERE k.kader_id = 1 AND k.is_aktif = 1
ORDER BY a.nama_lengkap ASC;
```

---

### Q3. Cari Keluarga Berdasarkan No KK atau NIK (fitur search)

```sql
SELECT
    k.no_kk,
    a.nik,
    a.nama_lengkap,
    k.rt,
    k.rw
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id
WHERE k.kader_id = 1
  AND (k.no_kk LIKE '%3204%' OR a.nik LIKE '%3204%' OR a.nama_lengkap LIKE '%HA%')
ORDER BY a.status_keluarga ASC;
```

---

### Q4. Daftar Anggota Keluarga untuk Dropdown SPM Kesehatan

```sql
-- Tampilkan anggota keluarga dengan info umur untuk pemilihan sasaran
SELECT
    a.id,
    a.nama_lengkap,
    a.jenis_kelamin,
    TIMESTAMPDIFF(YEAR, a.tanggal_lahir, CURDATE())   AS umur_tahun,
    TIMESTAMPDIFF(MONTH, a.tanggal_lahir, CURDATE())  AS umur_bulan,
    a.status_keluarga,
    CASE
        WHEN TIMESTAMPDIFF(MONTH, a.tanggal_lahir, CURDATE()) BETWEEN 0 AND 59 THEN 'balita'
        WHEN a.jenis_kelamin = 'P' AND TIMESTAMPDIFF(YEAR, a.tanggal_lahir, CURDATE()) BETWEEN 15 AND 49 THEN 'pus'
        WHEN TIMESTAMPDIFF(YEAR, a.tanggal_lahir, CURDATE()) >= 60 THEN 'lansia'
        ELSE 'umum'
    END AS kategori_posyandu
FROM anggota_keluarga a
WHERE a.keluarga_id = 1 AND a.is_aktif = 1
ORDER BY a.tanggal_lahir ASC;
```

---

### Q5. Riwayat Pengajuan SPM (riwayat-pengajuan.html)

```sql
-- Semua pengajuan SPM oleh kader, dengan info keluarga & status
SELECT
    p.id,
    p.kode_pengajuan,
    p.jenis_spm,
    p.status,
    p.created_at                    AS tgl_pengajuan,
    p.updated_at                    AS tgl_update_status,
    k.no_kk,
    a.nama_lengkap                  AS nama_kepala_keluarga
FROM pengajuan_spm p
LEFT JOIN keluarga k ON k.id = p.keluarga_id
LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
WHERE p.kader_id = 1
ORDER BY p.created_at DESC
LIMIT 20;
```

---

### Q6. Rekapitulasi SPM per Bulan (laporan.html)

```sql
SELECT
    p.jenis_spm,
    COUNT(*)                                                    AS total_pengajuan,
    SUM(CASE WHEN p.status = 'selesai'   THEN 1 ELSE 0 END)   AS selesai,
    SUM(CASE WHEN p.status = 'ditolak'   THEN 1 ELSE 0 END)   AS ditolak,
    SUM(CASE WHEN p.status IN ('menunggu_verifikasi','diterima','diproses_dinas') THEN 1 ELSE 0 END) AS on_progress,
    MONTH(p.created_at) AS bulan,
    YEAR(p.created_at)  AS tahun
FROM pengajuan_spm p
WHERE p.kader_id = 1
  AND p.created_at BETWEEN '2025-01-01' AND '2025-12-31'
GROUP BY p.jenis_spm, MONTH(p.created_at), YEAR(p.created_at)
ORDER BY tahun DESC, bulan DESC;
```

---

### Q7. Laporan Gizi Balita — Deteksi BGM & Gizi Buruk

```sql
SELECT
    a.nama_lengkap,
    TIMESTAMPDIFF(MONTH, a.tanggal_lahir, sk.tgl_pelayanan) AS umur_bulan,
    sk.berat_badan,
    sk.tinggi_badan,
    sk.status_kms,
    sk.tgl_pelayanan,
    k.rt, k.rw,
    CASE sk.status_kms
        WHEN 'merah'  THEN '🔴 GIZI BURUK — Rujuk Puskesmas'
        WHEN 'kuning' THEN '🟡 BGM — PMT Pemulihan'
        WHEN 'hijau'  THEN '🟢 Normal'
    END AS rekomendasi
FROM spm_kesehatan sk
JOIN anggota_keluarga a ON a.id = sk.anggota_id
JOIN keluarga k ON k.id = sk.keluarga_id
WHERE sk.jenis_sasaran = 'balita'
  AND sk.tgl_pelayanan BETWEEN '2025-08-01' AND '2025-08-31'
ORDER BY sk.status_kms ASC, a.nama_lengkap;
```

---

### Q8. Deteksi Ibu Hamil dengan Risiko KEK (LiLA < 23.5 cm)

```sql
SELECT
    a.nama_lengkap,
    a.tanggal_lahir,
    sk.usia_kehamilan_mgg,
    sk.tekanan_darah,
    sk.lingkar_lengan_cm,
    sk.tgl_pelayanan,
    k.rt, k.rw,
    CASE
        WHEN sk.lingkar_lengan_cm < 23.5 THEN 'BERISIKO KEK — Rujuk Segera'
        ELSE 'Normal'
    END AS status_kek
FROM spm_kesehatan sk
JOIN anggota_keluarga a ON a.id = sk.anggota_id
JOIN keluarga k ON k.id = sk.keluarga_id
WHERE sk.jenis_sasaran = 'bumil'
  AND sk.tgl_pelayanan >= DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
ORDER BY sk.lingkar_lengan_cm ASC;
```

---

### Q9. Keluarga yang Belum Hadir Posyandu 3 Bulan Terakhir

```sql
SELECT
    k.no_kk,
    a.nama_lengkap          AS kepala_keluarga,
    k.rt, k.rw,
    k.status_kesejahteraan,
    MAX(kj.tgl_kunjungan)   AS kunjungan_terakhir
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id = k.id
WHERE k.kader_id = 1 AND k.is_aktif = 1
GROUP BY k.id, k.no_kk, a.nama_lengkap, k.rt, k.rw, k.status_kesejahteraan
HAVING kunjungan_terakhir IS NULL
    OR kunjungan_terakhir < DATE_SUB(CURDATE(), INTERVAL 3 MONTH)
ORDER BY kunjungan_terakhir ASC;
```

---

### Q10. Keluarga Pra-Sejahtera yang Belum Punya BPJS

```sql
SELECT
    k.no_kk,
    a.nama_lengkap,
    k.status_kesejahteraan,
    k.status_asuransi,
    k.rt, k.rw
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
WHERE k.kader_id = 1
  AND k.status_kesejahteraan IN ('pra_sejahtera', 'sejahtera_1')
  AND k.status_asuransi = 'tidak_memiliki'
ORDER BY k.status_kesejahteraan;
```

---

### Q11. Summary Laporan Export PDF/Excel (per RT)

```sql
SELECT
    k.rt,
    COUNT(DISTINCT k.id)            AS jumlah_keluarga,
    COUNT(DISTINCT a.id)            AS jumlah_anggota,
    SUM(CASE WHEN k.status_kesejahteraan = 'pra_sejahtera' THEN 1 ELSE 0 END) AS pra_sejahtera,
    SUM(CASE WHEN k.status_asuransi = 'tidak_memiliki' THEN 1 ELSE 0 END) AS tanpa_bpjs,
    COUNT(DISTINCT kj.id)           AS total_kunjungan_tahun_ini
FROM keluarga k
LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id
LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id = k.id AND kj.tahun = YEAR(CURDATE())
WHERE k.kader_id = 1 AND k.is_aktif = 1
GROUP BY k.rt
ORDER BY k.rt;
```

---

### Q12. Update Status Pengajuan SPM oleh Admin Desa

```sql
-- Admin desa memverifikasi pengajuan
UPDATE pengajuan_spm
SET
    status              = 'diterima',
    catatan             = 'Dokumen lengkap. Diteruskan ke Dinas Sosial.',
    updated_by          = 3,  -- ID admin_desa
    updated_at          = NOW()
WHERE id = 1 AND status = 'menunggu_verifikasi';
```

---

### Q13. Soft Delete Keluarga (Pindah Domisili)

```sql
UPDATE keluarga SET is_aktif = 0, updated_at = NOW() WHERE id = 2 AND kader_id = 1;
```

---

### Q14. View: Ringkasan Keluarga Lengkap (untuk API / Export)

```sql
CREATE OR REPLACE VIEW v_keluarga_lengkap AS
SELECT
    k.id                        AS keluarga_id,
    k.no_kk,
    k.rt, k.rw,
    k.desa, k.kecamatan,
    k.status_kesejahteraan,
    k.status_asuransi,
    k.pekerjaan_kk,
    k.estimasi_pendapatan,
    a.nik                       AS nik_kk,
    a.nama_lengkap              AS nama_kk,
    COUNT(DISTINCT an.id)       AS jumlah_anggota,
    MAX(kj.tgl_kunjungan)       AS kunjungan_terakhir,
    COUNT(DISTINCT p.id)        AS total_pengajuan_spm
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
LEFT JOIN anggota_keluarga an ON an.keluarga_id = k.id
LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id = k.id
LEFT JOIN pengajuan_spm p ON p.keluarga_id = k.id
WHERE k.is_aktif = 1
GROUP BY k.id, k.no_kk, k.rt, k.rw, k.desa, k.kecamatan,
         k.status_kesejahteraan, k.status_asuransi, k.pekerjaan_kk,
         k.estimasi_pendapatan, a.nik, a.nama_lengkap;
```

---

## 🔒 Indeks Performa

```sql
-- Performa pencarian keluarga
CREATE INDEX idx_keluarga_kader_aktif ON keluarga(kader_id, is_aktif);
CREATE INDEX idx_keluarga_nokk        ON keluarga(no_kk);

-- Performa laporan per periode
CREATE INDEX idx_kunjungan_bulan_tahun ON kunjungan_posyandu(kader_id, bulan, tahun);
CREATE INDEX idx_pengajuan_status      ON pengajuan_spm(kader_id, status, created_at);
CREATE INDEX idx_spmkes_sasaran        ON spm_kesehatan(jenis_sasaran, tgl_pelayanan);

-- Pencarian SPM geospasial (jika menggunakan MySQL 8+)
CREATE INDEX idx_spmkes_gps ON spm_kesehatan(latitude, longitude);
```

---

## 📋 Catatan Implementasi

> [!IMPORTANT]
> **Rekomendasi Teknologi Backend:**
>
> - **Database:** MySQL 8.0+ / MariaDB 10.6+ (mendukung generated column untuk `kode_pengajuan`)
> - **File Storage:** Gunakan `storage/app/public/spm/{jenis}/{tahun}/{bulan}/` untuk menyimpan dokumen upload
> - **GPS:** Kolom `DECIMAL(10,7)` dan `DECIMAL(11,7)` memberikan presisi ~1cm untuk lat/lng

> [!NOTE]
> **Tentang `pengajuan_spm` (Master Log):**  
> Tabel ini adalah pusat tracking status. Setiap kali data dimasukkan ke tabel SPM spesifik (misal `spm_kesehatan`), buat juga record di `pengajuan_spm` untuk memungkinkan fitur "Riwayat Pengajuan" yang lintas-modul.

> [!TIP]
> **Untuk Export Laporan:**  
> Query Q11 dapat langsung di-wrap dengan library seperti `maatwebsite/excel` (Laravel) atau `phpspreadsheet` untuk menghasilkan file Excel yang bisa diserahkan ke Kepala Desa.
