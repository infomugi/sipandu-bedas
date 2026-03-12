# Sipandu Bedas API Documentation

Base URL: `http://localhost:3000`

---

## 1. AUTH
Endpoints for user authentication and account management.

- **POST `/api/auth/login`**: User login.
  - Body: `{ nik, password }`
- **POST `/api/auth/register`**: User registration.
  - Body: `{ nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, role }`
- **POST `/api/auth/forgot-password`**: Forgot password request.
  - Body: `{ nik, no_hp }`

---

## 2. DASHBOARD
Summary statistics for the kader's dashboard.

- **GET `/api/dashboard?kader_id=`**: Get totals for families, visits, and pending SPM submissions.

---

## 3. KELUARGA (Family)
Manage household data.

- **GET `/api/keluarga?kader_id=&search=`**: List families with search and filtering.
- **GET `/api/keluarga/:id`**: Detail view of a family including its members.
- **POST `/api/keluarga`**: Create a new family record.
  - Body: `{ no_kk, kader_id, alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran }`
- **PUT `/api/keluarga/:id`**: Update family information.
- **DELETE `/api/keluarga/:id`**: Soft delete (is_aktif=0).

---

## 4. ANGGOTA KELUARGA (Members)
Manage individuals within families.

- **GET `/api/keluarga/:keluarga_id/anggota`**: List all members in a family with calculated age and Posyandu category.
- **POST `/api/anggota`**: Add a new member to a family.
  - Body: `{ keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir, status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan }`
- **PUT `/api/anggota/:id`**: Update member details.
- **DELETE `/api/anggota/:id`**: Soft delete.

---

## 5. KUNJUNGAN POSYANDU
Record physical visits by kaders.

- **GET `/api/kunjungan?keluarga_id=&kader_id=&bulan=&tahun=`**: List visits with filters.
- **POST `/api/kunjungan`**: Record a new visit.
  - Body: `{ keluarga_id, kader_id, tgl_kunjungan, catatan, no_hp_pendaftar, foto_kk, foto_warga }`

---

## 6-11. SPM MODULES (6 Standar Pelayanan Minimal)
Services and submissions for specialized aid/monitoring.

- **Kesehatan**: `GET`, `POST` `/api/spm/kesehatan` (Gizi balita, Bumil KEK, etc.)
- **Pendidikan**: `GET`, `POST` `/api/spm/pendidikan` (Dropout tracking, school supplies)
- **Perumahan**: `GET`, `POST` `/api/spm/perumahan` (RTLH - Rumah Tidak Layak Huni)
- **PU**: `GET`, `POST` `/api/spm/pu` (Infrastruktur, sanitasi, air bersih)
- **Sosial**: `GET`, `POST` `/api/spm/sosial` (Disabilitas, lansia terlantar, bantuan sosial)
- **Trantibum**: `GET`, `POST` `/api/spm/trantibum` (Laporan kejadian, ketertiban umum)

---

## 12. MASTER PENGAJUAN SPM
Centralized tracking for all SPM submissions.

- **GET `/api/pengajuan?kader_id=&status=&jenis_spm=`**: List all applications.
- **POST `/api/pengajuan`**: Link an SPM detail record to a master application.
- **PUT `/api/pengajuan/:id/validasi-desa`**: Step 1 - Desa validation.
- **POST `/api/pengajuan/:id/assesment`**: Step 2 - Field assessment (Body: foto_kk, foto_rumah, coords).
- **PUT `/api/pengajuan/:id/rtl-desa`**: Step 3 - Desa Follow-up (Body: keputusan = selesai / rujuk).
- **POST `/api/pengajuan/:id/rujukan`**: Step 4 - Upload referral letter (Body: surat_pengantar).
- **PUT `/api/pengajuan/:id/validasi-kecamatan`**: Step 5 - Kecamatan validation.
- **PUT `/api/pengajuan/:id/validasi-kabupaten`**: Step 6 - Kabupaten validation.
- **PUT `/api/pengajuan/:id/rtl-dinas`**: Step 7 - Dinas Follow-up and completion.

---

## 13. LAPORAN & ANALITIK
Reporting endpoints for analysis.

- **GET `/api/laporan/dashboard?kader_id=&bulan=&tahun=`**: Distribution of SPM by type and status.
- **GET `/api/laporan/gizi?bulan=&tahun=&kader_id=`**: Nutritonal status tracking (balita).
- **GET `/api/laporan/bumil-kek?kader_id=`**: Risk monitoring for pregnant women (KEK).

---

## 14. PROFIL KADER
User profile and security settings.

- **GET `/api/profil/:id`**: Get detailed user profile.
- **PUT `/api/profil/:id`**: Update profile data.
- **PUT `/api/profil/:id/password`**: Update password.

---

## 15. ASSESMENT, PESAN & NOTIFIKASI
Endpoints for internal coordination and system feedback.

- **GET `/api/assesment?kader_id=`**: List posyandu assessments.
- **POST `/api/assesment`**: Save a new assessment.
  - Body: `{ kader_id, tgl_assesment, meja_1_pendaftaran, ..., catatan_kendala }`
- **GET `/api/pesan?user_id=`**: Get messages for a user.
- **POST `/api/pesan`**: Send a message.
  - Body: `{ pengirim_id, penerima_id, isi_pesan }`
- **GET `/api/notifikasi?user_id=`**: Get user notifications.
- **PUT `/api/notifikasi/:id/read`**: Mark notification as read.

---

## 16. VIEWS & ADMIN
Administrative and global overview endpoints.

- **GET `/api/view/keluarga-lengkap?rt=`**: Comprehensive flat view of family and head of household data.
- **GET `/api/users`**: List all users (Admin only).
- **PUT `/api/users/:id/toggle-active`**: Activate/Deactivate user accounts.

---
*Note: Semua response menggunakan format `{ success: boolean, data: ... }` atau `{ success: false, message: "..." }`.*
