# Analisis Alur Verifikasi Berjenjang SiPandu Bedas

Berdasarkan dokumen presentasi (Sipandubedas App Presentation (2).pdf), berikut adalah analisis alur verifikasi laporan 6 SPM secara berjenjang beserta rekomendasi pembaruan untuk UI, Database, API, dan Postman Collection.

## 1. Alur Verifikasi Berjenjang

Sistem memiliki 7 tahapan utama untuk setiap laporan layanan SPM dari masyarakat:
1. **Posyandu RW**: Input laporan masyarakat (Buku Register & Layanan 6 SPM).
2. **Posyandu Desa/Kel. (Validasi)**: Menerima notifikasi dan melakukan validasi laporan dari RW.
3. **Posyandu RW / Desa (Assesment Lapangan)**: Setelah divalidasi, dilakukan assesment lapangan (upload foto KK, foto rumah, koordinat, deskripsi).
4. **Posyandu Desa/Kel. (RTL - Rencana Tindak Lanjut)**: Memutuskan apakah masalah diselesaikan di Desa atau dirujuk ke Dinas.
   - Jika dirujuk, Desa harus mencetak surat pengantar, lalu meng-upload file surat pengantar rujukan yang sudah di-TTD.
5. **Posyandu Kecamatan (Validasi Rujukan)**: Menerima notifikasi dan melakukan validasi pengantar rujukan.
6. **Posyandu Kabupaten (Validasi Rujukan)**: Melakukan validasi lanjutan dari Kecamatan.
7. **Dinas (RTL Dinas & Selesai)**: Menerima rujukan tervalidasi, melakukan tindak lanjut (penyelesaian), dan sistem mengirim pesan WhatsApp ke Pelapor bahwa laporan selesai.

---

## 2. Potensi Kebutuhan UI (User Interface)

Untuk mendukung alur di atas, perlu ada penambahan/penyesuaian UI untuk masing-masing level user:

### Posyandu Desa/Kelurahan:
- **Menu Menunggu Validasi**: Daftar laporan baru dari RW yang butuh divalidasi.
- **Menu Menunggu RTL**: Daftar laporan yang sudah di-assesment lapangan untuk ditindaklanjuti.
  - **Form RTL Desa**: Pilihan "Selesaikan di Desa" atau "Rujuk ke Dinas".
- **Menu Cetak & Upload Rujukan**: Form untuk input nomor surat, cetak format surat, dan upload file PDF/Foto surat pengantar rujukan yang sudah ditandatangani Kepala Desa.

### Posyandu Tingkat RW / Desa:
- **Form Assesment Lapangan**: Terbuka setelah laporan divalidasi Desa. Berisi field untuk upload Foto Kartu Keluarga, Foto Rumah kondisi lapangan, titik koordinat peta (Bisa ambil dari GPS HP), dan deskripsi hasil assesment.

### Posyandu Kecamatan & Kabupaten:
- **Dashboard Verifikator**: Menampilkan jumlah laporan yang butuh validasi berjenjang.
- **Menu Validasi Rujukan**: Daftar laporan rujukan dari Desa.
  - **Detail Validasi**: Menampilkan surat pengantar dari desa, tombol "Validasi / Tolak".

### Tingkat Dinas:
- **Menu Menunggu RTL Dinas**: Daftar rujukan yang sudah lulus validasi Kabupaten.
- **Form Penyelesaian Dinas**: Input kolom Rencana Tindak Lanjut Dinas / penyelesaian masalah, lalu tombol "Selesai di Dinas" yang mend-trigger WhatsApp gateway.

---

## 3. Update Database (`db/sipandu_bedas.sql`)

Struktur tabel `pengajuan_spm` perlu disesuaikan statusnya, serta perlu ditambahkan tabel baru untuk mendokumentasikan assesment dan rujukan.

### A. Update Tipe Enum Status
Ubah `status_pengajuan_type` agar lebih mendetail (Berjenjang):
```sql
CREATE TYPE status_pengajuan_type AS ENUM (
    'menunggu_validasi_desa',
    'menunggu_assesment',
    'menunggu_rtl_desa',
    'selesai_di_desa',
    'menunggu_validasi_kecamatan',
    'menunggu_validasi_kabupaten',
    'menunggu_rtl_dinas',
    'selesai_di_dinas',
    'ditolak'
);
```

### B. Tabel `pengajuan_assesment` (Baru)
Tabel ini digunakan untuk mencatat detail assesment lapangan yang diinput oleh RW/Desa.
```sql
CREATE TABLE pengajuan_assesment (
    id BIGSERIAL PRIMARY KEY,
    pengajuan_id BIGINT NOT NULL REFERENCES pengajuan_spm(id) ON DELETE CASCADE,
    foto_kk VARCHAR(255),
    foto_rumah VARCHAR(255),
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    deskripsi_assesment TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### C. Tabel `pengajuan_rujukan` (Baru)
Tabel ini digunakan jika RTL Desa memutuskan "Rujuk ke Dinas" untuk melacak surat dan validasi kecamatan/kabupaten.
```sql
CREATE TABLE pengajuan_rujukan (
    id BIGSERIAL PRIMARY KEY,
    pengajuan_id BIGINT NOT NULL REFERENCES pengajuan_spm(id) ON DELETE CASCADE,
    no_surat_pengantar VARCHAR(100),
    file_surat_pengantar VARCHAR(255),
    tgl_upload TIMESTAMP,
    validasi_kecamatan SMALLINT DEFAULT 0, -- 0=Menunggu, 1=Valid
    validasi_kabupaten SMALLINT DEFAULT 0, -- 0=Menunggu, 1=Valid
    tindak_lanjut_dinas TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

---

## 4. Update API (`api/api.js`)

Perlu menambahkan endpoint baru khusus untuk menangani transisi status (Workflow) dari sistem berjenjang:

1. **PUT `/api/pengajuan/:id/validasi-desa`**
   - Merubah status menjadi `menunggu_assesment`.
2. **POST `/api/pengajuan/:id/assesment`**
   - Menerima foto KK, foto rumah, koordinat, deskripsi.
   - Menyimpan ke tabel `pengajuan_assesment` dan merubah status di `pengajuan_spm` menjadi `menunggu_rtl_desa`.
3. **PUT `/api/pengajuan/:id/rtl-desa`**
   - Jika "selesai": status menjadi `selesai_di_desa`.
   - Jika "rujuk": status menjadi `menunggu_validasi_kecamatan` (setelah upload surat).
4. **POST `/api/pengajuan/:id/rujukan`**
   - Upload surat pengantar rujukan. Menyimpan ke tabel `pengajuan_rujukan`.
5. **PUT `/api/pengajuan/:id/validasi-kecamatan`**
   - Update tabel `pengajuan_rujukan`. Merubah status pengajuan ke `menunggu_validasi_kabupaten`.
6. **PUT `/api/pengajuan/:id/validasi-kabupaten`**
   - Update tabel `pengajuan_rujukan`. Merubah status pengajuan ke `menunggu_rtl_dinas`.
7. **PUT `/api/pengajuan/:id/rtl-dinas`**
   - Input log/tindak lanjut dinas, merubah status `selesai_di_dinas`. Trigger notifikasi WA ke `no_hp_pendaftar` / pelapor.

*(Catatan: Perlu dipastikan route URL untuk masing-masing tingkatan memiliki autentikasi sesuai tingkatan role/area.)*

---

## 5. Update Postman Collection

Di dalam Postman, folder baru "**12. MASTER PENGAJUAN**" harus dipecah atau ditambahkan request baru untuk mensimulasikan workflow:
- `[PUT] Validasi Desa` (Merubah dari waiting ke assesment)
- `[POST] Assesment Lapangan` (Body: form-data untuk upload foto & input deskripsi)
- `[PUT] RTL Desa - Selesai`
- `[POST] Upload Rujukan Desa`
- `[PUT] Validasi Kecamatan`
- `[PUT] Validasi Kabupaten`
- `[PUT] Rencana Tindak Lanjut Dinas (Penyelesaian)`

Setiap request di atas harus menyertakan Header Authorization Token (sesuai user role masing-masing) yang membatasi bahwa Kecamatan A hanya bisa mem-validasi rujukan dari Desa di bawah Kecamatan A.
