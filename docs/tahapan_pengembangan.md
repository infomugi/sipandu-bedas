# 📱 Sipandu Bedas — Analisa Modul Mobile (Expo)

> **Dokumen Rujukan Pengembangan** — Dibuat: 2026-03-12  
> Basis analisa: `db/sipandu_bedas.sql` (14 tabel) · `api/api.js` (16 modul, 50+ endpoint) · `html/` (24 halaman)  
> Target stack: **React Native (Expo)** · folder project: `mobile/`

---

## 1. Arsitektur Sistem

```
┌─────────────────────────────────────────────────────────┐
│                   MOBILE APP (Expo)                     │
│  mobile/                                                │
│  ├─ app/         (Expo Router — file-based routing)     │
│  ├─ components/  (UI reusable)                          │
│  ├─ hooks/       (custom hooks, API fetch)              │
│  ├─ store/       (Zustand / context auth)               │
│  ├─ services/    (axios instance, helper)               │
│  └─ constants/   (theme, enums dari DB)                 │
└────────────────────────┬────────────────────────────────┘
                         │ HTTP / REST
┌────────────────────────▼────────────────────────────────┐
│          API SERVER  (Express.js — api/api.js)          │
│  Base URL: http://<server>:3000                         │
└────────────────────────┬────────────────────────────────┘
                         │ pg
┌────────────────────────▼────────────────────────────────┐
│         DATABASE  (PostgreSQL — sipandu_bedas)          │
│  14 tabel · 7 ENUM type · 1 VIEW                        │
└─────────────────────────────────────────────────────────┘
```

---

## 2. Peta Role & Hak Akses

| Role | Deskripsi | Halaman Utama |
|------|-----------|---------------|
| `kader` | Kader posyandu RW | Dashboard, Keluarga, Kunjungan, SPM, Riwayat, Laporan, Profil |
| `admin_desa` | Admin kantor desa | Validasi desa, RTL desa, Assesment |
| `dinas` | Petugas dinas kabupaten | Validasi kecamatan, Validasi kabupaten, RTL dinas |

---

## 3. Modul-Modul yang Wajib Dibangun (Step by Step)

Setiap modul diberikan **prioritas** dan **urutan pengerjaan**.

---

### FASE 1 — Foundation (Wajib Pertama)

---

#### 📦 Modul 1: Autentikasi & Sesi
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `users` |
| Referensi API | **1. AUTH** (`docs/api_documentation_postman.json`)<br>• `Login` (`POST /api/auth/login`)<br>• `Register` (`POST /api/auth/register`)<br>• `Forgot Password` (`POST /api/auth/forgot-password`) |
| Referensi UI/UX | 🎨 `html/login.html`<br>🎨 `html/register.html`<br>🎨 `html/forgot-password.html` |

**Field Form Login:**
- NIK (16 digit)
- Password

**Field Form Register:**
- `nama_lengkap`, `nik`, `email`, `no_hp`, `password`
- `rw`, `rt`, `desa = RANCAMANYAR`, `kecamatan = BALEENDAH`, `kabupaten = BANDUNG`
- `role` (default: `kader`)

**Field Forgot Password:**
- `nik`, `no_hp`

**Screen Expo yang dibutuhkan:**
```
app/
  (auth)/
    login.tsx
    register.tsx
    forgot-password.tsx
```

**State yang harus disimpan (AsyncStorage + Zustand):**
```js
{
  token: string,
  user: { id, nama_lengkap, nik, role, rw, rt, desa, kecamatan, foto_profil }
}
```

---

#### 📦 Modul 2: Profil Kader
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `users` |
| Referensi API | **14. PROFIL KADER** (`docs/api_documentation_postman.json`)<br>• `Detail Profil` (`GET /api/profil/:id`)<br>• `Update Profil` (`PUT /api/profil/:id`)<br>• `Update Password` (`PUT /api/profil/:id/password`) |
| Referensi UI/UX | 🎨 `html/profil.html` |

**Field yang ditampilkan:**
- Foto profil, Nama, NIK, Email, No HP, RT/RW, Desa/Kecamatan, Role

**Field yang bisa diedit:**
- `nama_lengkap`, `email`, `no_hp`, `rw`, `rt`, `foto_profil`

**Screen Expo:**
```
app/
  (tabs)/
    profil/
      index.tsx
      edit.tsx
      ganti-password.tsx
```

---

### FASE 2 — Core Utama Kader

---

#### 📦 Modul 3: Dashboard
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `keluarga`, `kunjungan_posyandu`, `pengajuan_spm` |
| Referensi API | **2. DASHBOARD** (`docs/api_documentation_postman.json`)<br>• `Get Dashboard Data` (`GET /api/dashboard`) |
| Referensi UI/UX | 🎨 `html/index.html` |

**Komponen yang ditampilkan di dashboard:**
- Total keluarga binaan
- Kunjungan bulan ini
- Pengajuan SPM menunggu
- Distribusi SPM bulan ini (chart pie)

**Screen Expo:**
```
app/
  (tabs)/
    index.tsx    ← home dashboard
```

---

#### 📦 Modul 4: Manajemen Keluarga (KK)
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `keluarga`, `anggota_keluarga` |
| Referensi API | **3. KELUARGA** (`docs/api_documentation_postman.json`)<br>• `List Keluarga` (`GET /api/keluarga`)<br>• `Get Detail` (`GET /api/keluarga/:id`)<br>• `Create` (`POST /api/keluarga`)<br>• `Update` (`PUT /api/keluarga/:id`)<br>• `Delete` (`DELETE /api/keluarga/:id`) |
| Referensi UI/UX | 🎨 `html/pendaftaran.html`<br>🎨 `html/tambah-keluarga.html` |

**Field Pendaftaran Keluarga:**
| Field | Type | Wajib |
|-------|------|-------|
| `no_kk` | CHAR(16) | ✅ |
| `kader_id` | UUID | ✅ |
| `alamat_lengkap` | TEXT | ✅ |
| `rt`, `rw` | VARCHAR | ✅ |
| `desa`, `kecamatan`, `kabupaten` | VARCHAR | default |
| `status_kesejahteraan` | ENUM | ✅ |
| `status_asuransi` | ENUM | ✅ |
| `pekerjaan_kk` | VARCHAR | - |
| `estimasi_pendapatan` | ENUM | - |
| `tgl_pendaftaran` | DATE | ✅ |

**ENUM Values:**
```js
// status_kesejahteraan
['pra_sejahtera', 'sejahtera_1', 'sejahtera_2', 'sejahtera_3']
// status_asuransi
['bpjs_pbi', 'bpjs_mandiri', 'asuransi_swasta', 'tidak_memiliki']
// estimasi_pendapatan
['lt_1jt', '1_3jt', 'gt_3jt']
```

**Screen Expo:**
```
app/
  (tabs)/
    keluarga/
      index.tsx       ← list keluarga + search
      [id].tsx        ← detail keluarga + list anggota
      tambah.tsx      ← form tambah KK
      edit/[id].tsx   ← edit data KK
```

---

#### 📦 Modul 5: Manajemen Anggota Keluarga
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `anggota_keluarga` |
| Referensi API | **4. ANGGOTA KELUARGA** (`docs/api_documentation_postman.json`)<br>• `Get Anggota` (`GET /api/keluarga/:id/anggota`)<br>• `Create` (`POST /api/anggota`)<br>• `Update` (`PUT /api/anggota/:id`)<br>• `Delete` (`DELETE /api/anggota/:id`) |
| Referensi UI/UX | 🎨 `html/pendaftaran.html`<br>🎨 `html/tambah-keluarga.html`<br>*(UI Anggota menyatu di dalam Pendaftaran Keluarga)* |

**Field Anggota:**
| Field | Type | Wajib |
|-------|------|-------|
| `keluarga_id` | UUID | ✅ |
| `nik` | CHAR(16) | ✅ |
| `nama_lengkap` | VARCHAR | ✅ |
| `jenis_kelamin` | ENUM(L/P) | ✅ |
| `tanggal_lahir` | DATE | ✅ |
| `tempat_lahir` | VARCHAR | - |
| `status_keluarga` | ENUM | ✅ |
| `status_asuransi` | ENUM | - |
| `pendidikan_terakhir` | ENUM | - |
| `pekerjaan` | VARCHAR | - |

**Kategori Posyandu (dihitung otomatis oleh API):**
- `balita` = 0–59 bulan
- `pus` = perempuan 15–49 tahun
- `lansia` = ≥ 60 tahun
- `bumil` = (dari data SPM kesehatan)

**Screen Expo:**
```
app/
  keluarga/
    [id]/anggota/
      tambah.tsx
      edit/[anggotaId].tsx
```

---

#### 📦 Modul 6: Kunjungan Posyandu
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `kunjungan_posyandu` |
| Referensi API | **5. KUNJUNGAN** (`docs/api_documentation_postman.json`)<br>• `List Kunjungan` (`GET /api/kunjungan`)<br>• `Post Kunjungan` (`POST /api/kunjungan`) |
| Referensi UI/UX | 🎨 `html/tambah-kunjungan.html` |

**Field Form Tambah Kunjungan:**
| Field | Type | Wajib | Catatan |
|-------|------|-------|---------|
| `keluarga_id` | UUID | ✅ | dari context KK |
| `kader_id` | UUID | ✅ | dari sesi login |
| `tgl_kunjungan` | DATE | ✅ | date picker |
| `no_hp_pendaftar` | VARCHAR | - | input tel |
| `foto_kk` | VARCHAR | - | upload gambar |
| `foto_warga` | VARCHAR | - | kamera/galeri |
| `latitude` | DECIMAL | - | expo-location |
| `longitude` | DECIMAL | - | expo-location |
| `catatan` | TEXT | - | textarea |
| `bulan`, `tahun` | INT | auto | dari tgl_kunjungan |

**Dependensi Expo:**
```bash
expo install expo-location expo-image-picker
```

**Screen Expo:**
```
app/
  kunjungan/
    index.tsx       ← list kunjungan
    tambah.tsx      ← form + map + kamera
    [id].tsx        ← detail kunjungan
```

---

### FASE 3 — Modul SPM (6 Layanan)

---

#### 📦 Modul 7: Menu SPM
**Prioritas: 🟠 Tinggi**

| Referensi UI/UX | 🎨 `html/spm-menu.html` |

**Screen Expo:**
```
app/
  (tabs)/
    spm/
      index.tsx     ← grid 6 menu SPM
```

---

#### 📦 Modul 7a: SPM Kesehatan
**Prioritas: 🟠 Tinggi**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_kesehatan` |
| Referensi API | **6. SPM KESEHATAN** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/kesehatan`)<br>• `Post` (`POST /api/spm/kesehatan`)<br>• `Detail` (`GET /api/spm/kesehatan/:id`)<br>• `Update` (`PUT /api/spm/kesehatan/:id`)<br>• `Delete` (`DELETE /api/spm/kesehatan/:id`) |
| Referensi UI/UX | 🎨 `html/spm-kesehatan.html` |

**Form dinamis berdasarkan `jenis_sasaran`:**

**Balita:**
| Field | Type |
|-------|------|
| `berat_badan` | DECIMAL(5,2) |
| `tinggi_badan` | DECIMAL(5,2) |
| `lingkar_kepala_cm` | DECIMAL(4,2) |
| `status_kms` | ENUM: hijau/kuning/merah |
| `jenis_imunisasi` | VARCHAR |
| `terima_vitamin_a` | boolean (0/1) |
| `terima_obat_cacing` | boolean (0/1) |

**Ibu Hamil (bumil):**
| Field | Type |
|-------|------|
| `usia_kehamilan_mgg` | SMALLINT |
| `tekanan_darah` | VARCHAR |
| `lingkar_lengan_cm` | DECIMAL(4,2) |

**Semua Sasaran:**
| Field | Type | Wajib |
|-------|------|-------|
| `keluarga_id`, `anggota_id`, `kader_id` | UUID | ✅ |
| `tgl_pelayanan` | DATE | ✅ |
| `jenis_sasaran` | ENUM | ✅ |
| `nik` | VARCHAR | - |
| `catatan_tindak_lanjut` | TEXT | - |
| `ajukan_bantuan` | boolean | - |
| `latitude`, `longitude` | DECIMAL | - |
| `keterangan` | TEXT | - |

**Screen Expo:**
```
app/spm/kesehatan/
  index.tsx     ← list + filter sasaran
  tambah.tsx    ← form dinamis + GPS + NIK toggle
  [id].tsx      ← detail
```

---

#### 📦 Modul 7b: SPM Pendidikan
**Prioritas: 🟠 Tinggi**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_pendidikan` |
| Referensi API | **7. SPM PENDIDIKAN** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/pendidikan`)<br>• `Post` (`POST /api/spm/pendidikan`)<br>• `Detail` (`GET /api/spm/pendidikan/:id`)<br>• `Update` (`PUT /api/spm/pendidikan/:id`)<br>• `Delete` (`DELETE /api/spm/pendidikan/:id`) |
| Referensi UI/UX | 🎨 `html/spm-pendidikan.html` |

**Field Form:**
| Field | Type | Wajib |
|-------|------|-------|
| `keluarga_id`, `anggota_id`, `kader_id` | UUID | ✅ |
| `jenjang_pendidikan` | ENUM | ✅ |
| `kelas` | VARCHAR | - |
| `nama_institusi` | VARCHAR | - |
| `jenis_bantuan` | ENUM | ✅ |
| `keterangan_alasan` | TEXT | ✅ |
| `nik` | VARCHAR | - |
| `file_bukti` | VARCHAR | - |
| `latitude`, `longitude` | DECIMAL | - |
| `keterangan` | TEXT | - |

**ENUM Values:**
```js
// jenjang_pendidikan
['paud_tk', 'sd_mi', 'smp_mts', 'sma_smk_ma', 'putus_sekolah']
// jenis_bantuan
['pelunasan_tunggakan', 'seragam_alat_tulis', 'fasilitas_belajar', 'beasiswa_lanjutan']
```

---

#### 📦 Modul 7c: SPM Perumahan
**Prioritas: 🟠 Tinggi**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_perumahan` |
| Referensi API | **8. SPM PERUMAHAN** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/perumahan`)<br>• `Post` (`POST /api/spm/perumahan`)<br>• `Detail` (`GET /api/spm/perumahan/:id`)<br>• `Update` (`PUT /api/spm/perumahan/:id`)<br>• `Delete` (`DELETE /api/spm/perumahan/:id`) |
| Referensi UI/UX | 🎨 `html/spm-perumahan.html` |

**Field Form:**
| Field | Type | Wajib |
|-------|------|-------|
| `keluarga_id`, `kader_id` | UUID | ✅ |
| `status_kepemilikan_lahan` | ENUM | - |
| `jenis_atap` | ENUM | - |
| `jenis_dinding` | ENUM | - |
| `jenis_lantai` | ENUM | - |
| `pernyataan_belum_pernah_terima` | boolean | - |
| `nik` | VARCHAR | - |
| `keterangan` | TEXT | - |
| `file_ktp`, `file_kk` | VARCHAR | - |
| `file_sk_penghasilan`, `file_bukti_lahan` | VARCHAR | - |
| `foto_rumah_depan/samping/belakang` | VARCHAR | - |
| `latitude`, `longitude` | DECIMAL | - |

**ENUM Values:**
```js
// status_kepemilikan_lahan
['milik_sendiri', 'sewa', 'numpang']
// jenis_atap
['rumbia', 'asbes_seng', 'genteng', 'beton']
// jenis_dinding
['bilik_bambu', 'setengah_tembok', 'tembok_penuh']
// jenis_lantai
['tanah', 'plesteran', 'keramik']
```

---

#### 📦 Modul 7d: SPM Pekerjaan Umum (PU)
**Prioritas: 🟡 Sedang**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_pu` |
| Referensi API | **9. SPM PU** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/pu`)<br>• `Post` (`POST /api/spm/pu`)<br>• `Detail` (`GET /api/spm/pu/:id`)<br>• `Update` (`PUT /api/spm/pu/:id`)<br>• `Delete` (`DELETE /api/spm/pu/:id`) |
| Referensi UI/UX | 🎨 `html/spm-pu.html` |

**Field Form:**
| Field | Type | Wajib |
|-------|------|-------|
| `keluarga_id`, `kader_id` | UUID | ✅ |
| `jenis_kebutuhan` | ENUM | ✅ |
| `detail_lokasi` | TEXT | ✅ |
| `estimasi_dimensi` | VARCHAR | - |
| `file_surat_permohonan` | VARCHAR | - |
| `nik`, `keterangan` | VARCHAR/TEXT | - |
| `latitude`, `longitude` | DECIMAL | - |

**ENUM Values:**
```js
// jenis_kebutuhan
['sanitasi_septic_tank', 'mck_umum', 'sarana_air_bersih']
```

---

#### 📦 Modul 7e: SPM Sosial
**Prioritas: 🟡 Sedang**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_sosial` |
| Referensi API | **10. SPM SOSIAL** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/sosial`)<br>• `Post` (`POST /api/spm/sosial`)<br>• `Detail` (`GET /api/spm/sosial/:id`)<br>• `Update` (`PUT /api/spm/sosial/:id`)<br>• `Delete` (`DELETE /api/spm/sosial/:id`) |
| Referensi UI/UX | 🎨 `html/spm-sosial.html` |

**Field Form:**
| Field | Type | Wajib |
|-------|------|-------|
| `kader_id` | UUID | ✅ |
| `keluarga_id` | UUID | opsional |
| `kategori_sasaran` | ENUM | ✅ |
| `nik_sasaran` | CHAR(16) | - |
| `nama_sasaran` | VARCHAR | - |
| `penjelasan_kondisi` | TEXT | ✅ |
| `bantuan_mendesak` | VARCHAR | - |
| `file_identitas_sasaran`, `file_sk_desa` | VARCHAR | - |
| `latitude`, `longitude` | DECIMAL | - |
| `keterangan` | TEXT | - |

**ENUM Values:**
```js
// kategori_sasaran
['penyandang_disabilitas', 'lansia', 'anak_terlantar', 'tuna_sosial', 'korban_bencana']
```

---

#### 📦 Modul 7f: SPM Trantibum
**Prioritas: 🟡 Sedang**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `spm_trantibum` |
| Referensi API | **11. SPM TRANTIBUM** (`docs/api_documentation_postman.json`)<br>• `List` (`GET /api/spm/trantibum`)<br>• `Post` (`POST /api/spm/trantibum`)<br>• `Detail` (`GET /api/spm/trantibum/:id`)<br>• `Update` (`PUT /api/spm/trantibum/:id`)<br>• `Delete` (`DELETE /api/spm/trantibum/:id`) |
| Referensi UI/UX | 🎨 `html/spm-trantibum.html` |

**Field Form:**
| Field | Type | Wajib |
|-------|------|-------|
| `kader_id` | UUID | ✅ |
| `kategori_laporan` | ENUM | ✅ |
| `detail_kejadian` | TEXT | ✅ |
| `waktu_kejadian` | TIMESTAMP | - |
| `is_anonim` | boolean | - |
| `nama_pelapor`, `no_kontak_pelapor` | VARCHAR | - |
| `file_ktp_pelapor` | VARCHAR | - |
| `estimasi_korban` | SMALLINT | - |
| `estimasi_kerugian` | BIGINT | - |
| `latitude`, `longitude` | DECIMAL | - |
| `nik`, `keterangan` | VARCHAR/TEXT | - |

**ENUM Values:**
```js
// kategori_laporan
['kebakaran', 'kdrt_asusila', 'bencana_alam', 'narkoba_premanisme', 'illegal_logging_fishing']
```

---

### FASE 4 — Pengajuan & Alur Verifikasi

---

#### 📦 Modul 8: Pengajuan SPM (Master)
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `pengajuan_spm` |
| Referensi API | **12. PENGAJUAN SPM** (`docs/api_documentation_postman.json`)<br>• `List Pengajuan` (`GET /api/pengajuan`)<br>• `Get Detail` (`GET /api/pengajuan/:id`)<br>• `Create Pengajuan` (`POST /api/pengajuan`) |
| Referensi UI/UX | 🎨 `html/riwayat-pengajuan.html` |

**Alur Pengajuan:**
```
Kader input SPM data
          ↓
POST /api/spm/{jenis}  →  dapat ref_id
          ↓
POST /api/pengajuan   →  dapat kode_pengajuan
          ↓
Status: menunggu_validasi_desa
```

**Field POST pengajuan:**
```json
{
  "kader_id": "UUID",
  "keluarga_id": "UUID",
  "jenis_spm": "kesehatan|pendidikan|perumahan|pekerjaan_umum|sosial|trantibum",
  "ref_id": "UUID (dari spm_{jenis}.id)",
  "created_by": "UUID"
}
```

---

#### 📦 Modul 9: Riwayat Pengajuan & Timeline
**Prioritas: 🔴 Kritis**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `pengajuan_spm`, `pengajuan_assesment`, `pengajuan_rujukan` |
| Referensi API | **12. PENGAJUAN SPM (Riwayat)** (`docs/api_documentation_postman.json`)<br>• `Riwayat Detail & Timeline` (`GET /api/v1/riwayat/:id`)<br>• `List Pengajuan` (`GET /api/pengajuan`) |
| Referensi UI/UX | 🎨 `html/riwayat-pengajuan.html`<br>🎨 `html/riwayat-detail.html` |

**Status Flow:**
```
menunggu_validasi_desa
        ↓ (Validasi Desa)
menunggu_assesment
        ↓ (Assesment)
menunggu_rtl_desa
        ↓ (RTL Desa)
  ┌─────┴──────┐
selesai_di_desa  menunggu_validasi_kecamatan
                           ↓
                 menunggu_validasi_kabupaten
                           ↓
                   menunggu_rtl_dinas
                           ↓
                   selesai_di_dinas
```

**Timeline dari `GET /api/v1/riwayat/:id`:**
```json
{
  "timeline": [
    { "title": "Pengajuan Diterima", "status": "success" },
    { "title": "Validasi Desa",      "status": "success|process|pending" },
    { "title": "Assesment Lapangan", "status": "..." },
    { "title": "Validasi Kecamatan", "status": "..." },
    { "title": "Selesai",            "status": "..." }
  ]
}
```

**Screen Expo:**
```
app/
  (tabs)/
    riwayat/
      index.tsx         ← list semua pengajuan
      [id].tsx          ← detail + timeline
```

---

#### 📦 Modul 10: Verifikasi Berjenjang
**Prioritas: 🟠 Tinggi (role: admin_desa, dinas)**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `pengajuan_spm`, `pengajuan_assesment`, `pengajuan_rujukan` |
| Referensi API | **12. PENGAJUAN SPM (Verifikasi Berjenjang)** (`docs/api_documentation_postman.json`)<br>• `Validasi Desa` (`PUT /api/pengajuan/:id/validasi-desa`)<br>• `Assesment` (`POST /api/pengajuan/:id/assesment`)<br>• `RTL Desa` (`PUT /api/pengajuan/:id/rtl-desa`)<br>• `Rujukan` (`POST /api/pengajuan/:id/rujukan`)<br>• `Validasi Kecamatan` (`PUT /api/pengajuan/:id/validasi-kecamatan`)<br>• `Validasi Kabupaten` (`PUT /api/pengajuan/:id/validasi-kabupaten`)<br>• `RTL Dinas` (`PUT /api/pengajuan/:id/rtl-dinas`) |
| Referensi UI/UX | 🎨 `html/verifikasi-desa.html`<br>🎨 `html/verifikasi-berjenjang.html`<br>🎨 `html/assesment-lapangan.html`<br>🎨 `html/rujukan-desa.html`<br>🎨 `html/rtl-dinas.html` |

**Assesment Field:**
```json
{
  "foto_kk": "path",
  "foto_rumah": "path",
  "latitude": "-6.1",
  "longitude": "107.5",
  "deskripsi_assesment": "text"
}
```

**Rujukan Field:**
```json
{
  "no_surat_pengantar": "...",
  "file_surat_pengantar": "path"
}
```

---

### FASE 5 — Laporan & Monitoring

---

#### 📦 Modul 11: Laporan & Analitik
**Prioritas: 🟠 Tinggi**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `pengajuan_spm`, `spm_kesehatan`, `keluarga`, `kunjungan_posyandu` |
| Referensi API | **13. LAPORAN & ANALITIK** (`docs/api_documentation_postman.json`)<br>• `Dashboard` (`GET /api/laporan/dashboard`)<br>• `Gizi` (`GET /api/laporan/gizi`)<br>• `Bumil KEK` (`GET /api/laporan/bumil-kek`) |
| Referensi UI/UX | 🎨 `html/laporan.html` |

**Data dari `/api/laporan/dashboard`:**
- Distribusi SPM per jenis dan status
- Ringkasan per RT (jumlah KK, anggota, pra-sejahtera, tanpa BPJS)
- Keluarga yang tidak berkunjung > 3 bulan

**Data dari `/api/laporan/gizi`:**
- Status KMS balita (hijau/kuning/merah) + rekomendasi

**Data dari `/api/laporan/bumil-kek`:**
- Ibu hamil berisiko KEK (LiLA < 23.5 cm)

**Dependensi Expo:**
```bash
npx expo install victory-native  # atau react-native-chart-kit
```

**Screen Expo:**
```
app/
  (tabs)/
    laporan/
      index.tsx         ← charts + ringkasan
      gizi.tsx          ← list balita status KMS
      bumil-kek.tsx     ← list ibu hamil KEK
```

---

### FASE 6 — Komunikasi & Notifikasi

---

#### 📦 Modul 12: Notifikasi
**Prioritas: 🟡 Sedang**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `notifikasi` |
| Referensi API | **15. ASSESMENT, PESAN & NOTIFIKASI** (`docs/api_documentation_postman.json`)<br>• `List Notifikasi` (`GET /api/notifikasi?user_id=`)<br>• `Mark as Read` (`PUT /api/notifikasi/:id/read`) |
| Referensi UI/UX | 🎨 *(Komponen Modal / Dropdown Navbar)* |

**Komponen:**
- Badge jumlah notifikasi belum dibaca
- List notifikasi (judul, pesan, waktu)
- Tandai sudah baca

---

#### 📦 Modul 13: Pesan Internal
**Prioritas: 🟢 Rendah**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `pesan` |
| Referensi API | **15. ASSESMENT, PESAN & NOTIFIKASI** (`docs/api_documentation_postman.json`)<br>• `Get Pesan` (`GET /api/pesan?user_id=`)<br>• `Kirim Pesan` (`POST /api/pesan`) |
| Referensi UI/UX | 🎨 *(Disesuaikan)* |

---

#### 📦 Modul 14: Assesment Posyandu
**Prioritas: 🟡 Sedang**

| Aspek | Detail |
|-------|--------|
| DB Tabel | `posyandu_assesment` |
| Referensi API | **15. ASSESMENT, PESAN & NOTIFIKASI** (`docs/api_documentation_postman.json`)<br>• `Get Assesment` (`GET /api/assesment`)<br>• `Post Assesment` (`POST /api/assesment`) |
| Referensi UI/UX | 🎨 `html/assesment-lapangan.html` |

**Field Checklist (semua boolean 0/1):**
- `meja_1_pendaftaran`, `meja_2_penimbangan`, `meja_3_pencatatan`
- `meja_4_penyuluhan`, `meja_5_pelayanan`
- `alat_timbangan_ok`, `alat_ukur_tinggi_ok`
- `stok_vitamin_a`, `stok_obat_cacing`
- `catatan_kendala` (text)

---

## 4. Struktur Folder Expo yang Direkomendasikan

```
mobile/
├── app/
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx
│   │   ├── register.tsx
│   │   └── forgot-password.tsx
│   ├── (tabs)/
│   │   ├── _layout.tsx       ← 5 tab: Beranda, Keluarga, SPM, Riwayat, Profil
│   │   ├── index.tsx         ← Dashboard
│   │   ├── keluarga/
│   │   │   ├── index.tsx
│   │   │   ├── tambah.tsx
│   │   │   └── [id]/
│   │   │       ├── index.tsx
│   │   │       ├── edit.tsx
│   │   │       └── anggota/
│   │   │           ├── tambah.tsx
│   │   │           └── [anggotaId]/edit.tsx
│   │   ├── spm/
│   │   │   ├── index.tsx
│   │   │   ├── kesehatan/
│   │   │   │   ├── index.tsx
│   │   │   │   └── tambah.tsx
│   │   │   ├── pendidikan/
│   │   │   ├── perumahan/
│   │   │   ├── pu/
│   │   │   ├── sosial/
│   │   │   └── trantibum/
│   │   ├── riwayat/
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx      ← dengan timeline
│   │   ├── laporan/
│   │   │   ├── index.tsx
│   │   │   ├── gizi.tsx
│   │   │   └── bumil-kek.tsx
│   │   └── profil/
│   │       ├── index.tsx
│   │       ├── edit.tsx
│   │       └── ganti-password.tsx
│   ├── kunjungan/
│   │   ├── index.tsx
│   │   ├── tambah.tsx
│   │   └── [id].tsx
│   ├── verifikasi/
│   │   ├── desa/[id].tsx
│   │   ├── assesment/[id].tsx
│   │   ├── rujukan/[id].tsx
│   │   ├── kecamatan/[id].tsx
│   │   ├── kabupaten/[id].tsx
│   │   └── rtl-dinas/[id].tsx
│   └── _layout.tsx           ← root layout / auth guard
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── Badge.tsx
│   │   ├── MapPicker.tsx     ← expo-maps / leaflet
│   │   ├── Timeline.tsx
│   │   └── UploadBox.tsx
│   ├── forms/
│   │   ├── KeluargaForm.tsx
│   │   ├── AnggotaForm.tsx
│   │   ├── KunjunganForm.tsx
│   │   └── spm/
│   │       ├── KesehatanForm.tsx
│   │       ├── PendidikanForm.tsx
│   │       ├── PerumahanForm.tsx
│   │       ├── PuForm.tsx
│   │       ├── SosialForm.tsx
│   │       └── TrantibumForm.tsx
│   └── layout/
│       ├── Header.tsx
│       └── BottomNav.tsx
├── services/
│   ├── api.ts               ← axios instance + interceptor
│   ├── auth.service.ts
│   ├── keluarga.service.ts
│   ├── kunjungan.service.ts
│   ├── spm.service.ts
│   ├── pengajuan.service.ts
│   ├── laporan.service.ts
│   └── profil.service.ts
├── store/
│   ├── auth.store.ts         ← user + token (Zustand)
│   └── app.store.ts
├── hooks/
│   ├── useLocation.ts
│   ├── useCamera.ts
│   └── useDebounce.ts  
├── constants/
│   ├── enums.ts              ← semua ENUM dari DB
│   ├── theme.ts
│   └── api.ts                ← BASE_URL config
└── assets/
    └── images/
```

---

## 5. Dependensi Expo yang Dibutuhkan

```bash
# Core
npx create-expo-app@latest mobile --template

# Navigasi
npx expo install expo-router

# Storage
npx expo install @react-native-async-storage/async-storage

# State management
npm install zustand

# HTTP
npm install axios

# Lokasi GPS
npx expo install expo-location

# Kamera & Galeri
npx expo install expo-image-picker expo-camera

# File Upload
npx expo install expo-document-picker

# Maps
npx expo install react-native-maps

# Charts (laporan)
npm install victory-native

# Icons
npx expo install @expo/vector-icons

# Form
npm install react-hook-form @hookform/resolvers zod

# Tanggal
npm install date-fns

# UI Library (opsional)
npm install @rneui/themed @rneui/base
```

---

## 6. Konfigurasi API Service

```typescript
// mobile/services/api.ts
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://192.168.x.x:3000'; // ganti dengan IP server

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
});

// Inject token dari storage
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
  (res) => res.data,
  async (err) => {
    if (err.response?.status === 401) {
      await AsyncStorage.removeItem('token');
      // navigasi ke login
    }
    return Promise.reject(err.response?.data?.message || 'Terjadi kesalahan');
  }
);
```

---

## 7. Urutan Pengembangan (Sprint Plan)

| Sprint | Modul | Estimasi |
|--------|-------|----------|
| Sprint 1 | Setup Expo, Auth (Login, Register, Lupa PW), Session, Profil | 1 minggu |
| Sprint 2 | Dashboard, Manajemen Keluarga (CRUD), Anggota | 1 minggu |
| Sprint 3 | Kunjungan (form + GPS + kamera), Map Picker | 1 minggu |
| Sprint 4 | SPM Menu, SPM Kesehatan, SPM Pendidikan | 1 minggu |
| Sprint 5 | SPM Perumahan, SPM PU, SPM Sosial, SPM Trantibum | 1 minggu |
| Sprint 6 | Pengajuan SPM, Riwayat, Timeline | 1 minggu |
| Sprint 7 | Verifikasi Berjenjang (role-based), Assesment | 1 minggu |
| Sprint 8 | Laporan, Notifikasi, Pesan, Polish UI | 1 minggu |

---

## 8. Konstan ENUM dari Database

```typescript
// mobile/constants/enums.ts

export const STATUS_KESEJAHTERAAN = [
  { value: 'pra_sejahtera',  label: 'Pra-Sejahtera (Sangat Miskin)' },
  { value: 'sejahtera_1',    label: 'Sejahtera I (Miskin)' },
  { value: 'sejahtera_2',    label: 'Sejahtera II (Menengah)' },
  { value: 'sejahtera_3',    label: 'Sejahtera III (Mampu)' },
];

export const STATUS_ASURANSI = [
  { value: 'bpjs_pbi',        label: 'BPJS Kesehatan (PBI/Gratis)' },
  { value: 'bpjs_mandiri',    label: 'BPJS Mandiri' },
  { value: 'asuransi_swasta', label: 'Asuransi Swasta' },
  { value: 'tidak_memiliki',  label: 'Tidak Memiliki' },
];

export const ESTIMASI_PENDAPATAN = [
  { value: 'lt_1jt',  label: '< Rp 1 Juta' },
  { value: '1_3jt',   label: 'Rp 1 - 3 Juta' },
  { value: 'gt_3jt',  label: '> Rp 3 Juta' },
];

export const STATUS_KELUARGA = [
  { value: 'kepala_keluarga', label: 'Kepala Keluarga' },
  { value: 'istri',           label: 'Istri' },
  { value: 'anak',            label: 'Anak' },
  { value: 'lainnya',         label: 'Lainnya' },
];

export const JENIS_SASARAN = [
  { value: 'balita', label: 'Bayi & Balita (0-59 Bln)' },
  { value: 'bumil',  label: 'Ibu Hamil & Nifas' },
  { value: 'pus',    label: 'Pasangan Usia Subur' },
  { value: 'lansia', label: 'Lansia (≥60 Thn)' },
];

export const STATUS_KMS = [
  { value: 'hijau',  label: 'Hijau (Naik Normal)' },
  { value: 'kuning', label: 'Kuning (BGM)' },
  { value: 'merah',  label: 'Merah (Gizi Buruk)' },
];

export const JENJANG_PENDIDIKAN = [
  { value: 'paud_tk',     label: 'PAUD / TK' },
  { value: 'sd_mi',       label: 'SD / MI' },
  { value: 'smp_mts',     label: 'SMP / MTs' },
  { value: 'sma_smk_ma',  label: 'SMA / SMK / MA' },
  { value: 'putus_sekolah', label: 'Putus Sekolah' },
];

export const JENIS_BANTUAN_PENDIDIKAN = [
  { value: 'pelunasan_tunggakan', label: 'Pelunasan Tunggakan Biaya' },
  { value: 'seragam_alat_tulis', label: 'Seragam & Alat Tulis' },
  { value: 'fasilitas_belajar',  label: 'Fasilitas Belajar' },
  { value: 'beasiswa_lanjutan',  label: 'Beasiswa Lanjutan' },
];

export const JENIS_LAHAN = [
  { value: 'milik_sendiri', label: 'Milik Sendiri' },
  { value: 'sewa',          label: 'Sewa' },
  { value: 'numpang',       label: 'Numpang' },
];

export const JENIS_ATAP = [
  { value: 'rumbia',    label: 'Rumbia / Daun' },
  { value: 'asbes_seng', label: 'Asbes / Seng' },
  { value: 'genteng',   label: 'Genteng' },
  { value: 'beton',     label: 'Beton' },
];

export const JENIS_DINDING = [
  { value: 'bilik_bambu',    label: 'Bilik Bambu' },
  { value: 'setengah_tembok', label: 'Setengah Tembok' },
  { value: 'tembok_penuh',   label: 'Tembok Penuh' },
];

export const JENIS_LANTAI = [
  { value: 'tanah',     label: 'Tanah' },
  { value: 'plesteran', label: 'Plesteran' },
  { value: 'keramik',   label: 'Keramik' },
];

export const KATEGORI_PU = [
  { value: 'sanitasi_septic_tank', label: 'Sanitasi / Septic Tank' },
  { value: 'mck_umum',            label: 'MCK Umum' },
  { value: 'sarana_air_bersih',   label: 'Sarana Air Bersih' },
];

export const KATEGORI_SOSIAL = [
  { value: 'penyandang_disabilitas', label: 'Penyandang Disabilitas' },
  { value: 'lansia',                 label: 'Lansia Terlantar' },
  { value: 'anak_terlantar',         label: 'Anak Terlantar' },
  { value: 'tuna_sosial',            label: 'Tuna Sosial' },
  { value: 'korban_bencana',         label: 'Korban Bencana' },
];

export const KATEGORI_TRANTIBUM = [
  { value: 'kebakaran',              label: 'Kebakaran' },
  { value: 'kdrt_asusila',           label: 'KDRT / Asusila' },
  { value: 'bencana_alam',           label: 'Bencana Alam' },
  { value: 'narkoba_premanisme',     label: 'Narkoba / Premanisme' },
  { value: 'illegal_logging_fishing', label: 'Illegal Logging/Fishing' },
];

export const STATUS_PENGAJUAN = [
  { value: 'menunggu_validasi_desa',     label: 'Menunggu Validasi Desa',     color: '#f59e0b' },
  { value: 'menunggu_assesment',         label: 'Menunggu Assesment',          color: '#3b82f6' },
  { value: 'menunggu_rtl_desa',          label: 'Menunggu RTL Desa',           color: '#8b5cf6' },
  { value: 'selesai_di_desa',            label: 'Selesai di Desa',             color: '#10b981' },
  { value: 'menunggu_validasi_kecamatan', label: 'Menunggu Validasi Kecamatan', color: '#f59e0b' },
  { value: 'menunggu_validasi_kabupaten', label: 'Menunggu Validasi Kabupaten', color: '#f59e0b' },
  { value: 'menunggu_rtl_dinas',         label: 'Menunggu RTL Dinas',          color: '#8b5cf6' },
  { value: 'selesai_di_dinas',           label: 'Selesai di Dinas',            color: '#10b981' },
  { value: 'ditolak',                    label: 'Ditolak',                     color: '#ef4444' },
];
```

---

## 9. Checklist Kesiapan Sebelum Build Mobile

- [ ] API server running & accessible dari perangkat fisik
- [ ] PostgreSQL terinstall & schema `sipandu_bedas.sql` sudah dijalankan
- [ ] Data dummy sudah di-insert (`sipandu_bedas_dummy.sql`)
- [ ] `BASE_URL` di `constants/api.ts` sudah menggunakan IP LAN (bukan `localhost`)
- [ ] Izin `LOCATION`, `CAMERA`, `MEDIA_LIBRARY` sudah dikonfigurasi di `app.json`
- [ ] EAS Build dikonfigurasi untuk testing di device fisik

```json
// mobile/app.json (permissions)
{
  "expo": {
    "plugins": [
      ["expo-location", {
        "locationAlwaysAndWhenInUsePermission": "Allow Sipandu Bedas to use your location."
      }],
      ["expo-camera", {
        "cameraPermission": "Allow Sipandu Bedas to access your camera."
      }],
      ["expo-image-picker", {
        "photosPermission": "Allow Sipandu Bedas to access your photos."
      }]
    ]
  }
}
```

---

*Dokumen ini adalah rujukan utama pengembangan mobile app Sipandu Bedas menggunakan Expo. Update sesuai perubahan API/DB yang terjadi.*
