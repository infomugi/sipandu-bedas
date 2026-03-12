# 🎨 Analisis UI/UX — Sipandu Bedas
### Menuju Desain Premium, Clean & Professional

> **Cakupan Analisis:** [login.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/login.html) · [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html) · [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) · [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) · [spm-menu.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/spm-menu.html) · [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html)

---

## Ringkasan Kondisi Saat Ini

| Aspek | Kondisi | Penilaian |
|---|---|---|
| Fondasi Teknikal | Tailwind CSS + Plus Jakarta Sans | ✅ Solid |
| Pendekatan Layout | Mobile-First, max 414px | ✅ Tepat sasaran |
| Konsistensi Komponen | Beberapa variasi antar halaman | ⚠️ Perlu seragam |
| Tipografi | Terlalu banyak ukuran < 12px | ❌ Perlu perbaikan |
| Sistem Warna | Emerald dominan, ada warna tidak konsisten | ⚠️ Perlu standarisasi |
| Ruang Kosong (Whitespace) | Rapat, kurang lapang | ⚠️ Perlu ditingkatkan |
| Micro-Interactions | Hanya `.btn-press` (scale 0.96) | ⚠️ Masih dasar |
| Aksesibilitas | Tidak ada `aria-label`, contrast rendah di beberapa area | ❌ Perlu perhatian |

---

## 1. Tipografi & Hierarki Visual

### Masalah Ditemukan

Penggunaan ukuran font yang sangat kecil tersebar luas di hampir seluruh halaman:

| File | Contoh Penggunaan | Masalah |
|---|---|---|
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | `text-[10px]` untuk label data KK | ❌ Terlalu kecil untuk data penting |
| [spm-menu.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/spm-menu.html) | `text-[8px]` untuk label "Keluarga Sasaran" | ❌ Nyaris tidak terbaca |
| [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html) | `text-[10px]` untuk deskripsi sub-judul | ❌ Konten penting, sulit dibaca |
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | `text-[9px]` untuk label nav bawah | ❌ Di bawah batas minimal |
| [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) | `text-[8px]` pada info lokasi di header | ❌ Membuat header tampak berantakan |

### Rekomendasi

```
❌ Hindari  →  text-[8px], text-[9px], text-[10px]
✅ Gunakan  →  text-xs (12px) sebagai ukuran MINIMUM ABSOLUTE
✅ Hierarki →  
   Judul Halaman     : text-xl / text-2xl font-bold
   Sub-judul         : text-sm / text-base font-semibold
   Konten utama      : text-sm font-medium
   Label / keterangan: text-xs font-medium text-slate-500
   metadata kecil    : text-xs (TIDAK BOLEH LEBIH KECIL)
```

**Prinsip:** Gunakan **bobot font** dan **kontras warna** untuk membedakan hierarki, bukan perbedaan *ukuran* font yang ekstrem.

---

## 2. Sistem Warna & Konsistensi

### Masalah Ditemukan

Tidak ada sistem warna yang terdefinisi secara ketat, mengakibatkan inkonsistensi antar halaman:

| Halaman | Temuan | Masalah |
|---|---|---|
| [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) | Tombol menu solid `bg-emerald-600` | Warna dominan, berat secara visual |
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | Header `bg-indigo-600`, tombol tambah `bg-indigo-600` | Inkonsisten — indigo muncul tiba-tiba |
| [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) | Header `bg-indigo-600` | Warna indigo bertentangan dengan brand emerald |
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | Tombol "Informasi" `bg-rose-500` | Tombol destruktif digunakan untuk aksi informasional |
| [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html) / [login.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/login.html) | Tombol utama `bg-slate-900` | Tidak konsisten dengan warna brand utama (emerald) |

### Rekomendasi: Design Token Warna

```
Brand Primary    → Emerald (#059669 / emerald-600)  
                   →  gunakan untuk: CTA utama, ikon aktif, link
Brand Dark       → #064e3b (emerald-900)             
                   →  background gelap (login screen)
Surface          → #f8fafc (slate-50)               
                   →  latar halaman konten
Card             → #ffffff                          
                   →  semua kartu, form
Secondary        → Slate (#64748b)                  
                   →  teks deskriptif, label
Danger           → Rose (#f43f5e)                   
                   →  HANYA tindakan destruktif (hapus, logout)
Warning          → Amber                            →  peringatan
Info             → Indigo / Blue                    →  informasi kontekstual
```

> [!IMPORTANT]
> Hapus penggunaan `bg-indigo-600` pada header [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) dan [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html). Standarkan header seluruh halaman menjadi `bg-white` dengan *border-bottom* tipis, atau gunakan `bg-emerald-700` sebagai konsistensi brand.

---

## 3. Layout, Whitespace & Kartu (Cards)

### Masalah Ditemukan

**a. Blok Warna Terlalu Berat (Dashboard)**
Empat tombol menu utama di [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) menggunakan `bg-emerald-600` solid dengan luas yang besar. Ini membuat layar terasa berat dan "penuh".

**b. Kartu Data Terlalu Padat (Pendaftaran)**
Di [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html), data informasi keluarga (No KK, NIK, Nama, RT/RW, Kunjungan) ditampilkan dalam teks `text-[10px]` yang rapat, membuat kartu sulit dibaca secara cepat (*scannability* rendah).

**c. Rasio Banner Tidak Optimal (Dashboard)**
Proporsi banner 2:1 memakan >40% layar di awal, memaksa pengguna untuk scroll sebelum melihat menu utama.

### Rekomendasi

**Kartu Menu Dashboard — Sebelum & Sesudah:**

```
❌ Sebelum:
bg-emerald-600 (blok warna solid penuh) · icon putih · label putih

✅ Sesudah:
bg-white · border border-slate-100 · shadow-sm
  ↳ ikon di container bulat: bg-emerald-50, text-emerald-600
  ↳ label teks: text-sm font-bold text-slate-800
  ↳ efek hover: hover:border-emerald-200 hover:shadow-md
```

**Kartu Data Keluarga — Sebelum & Sesudah:**

```
❌ Sebelum:
Semua info dalam text-[10px] vertikal rapat

✅ Sesudah:
Baris utama: Nama KK (text-sm font-bold, slate-900)
             No KK   (text-xs, slate-400)  ← lebih kecil, bukan info primer
Sub-baris:   Chip status kunjungan + tanggal
Tombol aksi: Full-width di bawah kartu, bukan 2 tombol kecil bersebelahan
```

**Banner Dashboard:**
- Kurangi aspek rasio menjadi `aspect-[3/1]` atau `aspect-[21/9]`
- Atau ganti dengan komponen **Selamat Datang / Summary Card** yang lebih informatif dan ringan

---

## 4. Navigasi & Struktur Alur (Flow)

### Masalah Ditemukan

| Halaman | Masalah |
|---|---|
| [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) | *Bottom nav* hanya berisi 1 item (Beranda). Navigasi tidak fungsional |
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | *Bottom nav* kembali 1 item saja tanpa konteks halaman aktif |
| [spm-menu.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/spm-menu.html) | Tidak ada *bottom nav* — pengguna hanya bisa kembali via header |
| [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) | Tidak ada tombol "Kembali" yang jelas di body, hanya di header |

### Rekomendasi

**Struktur Bottom Navigation yang Konsisten:**

```
[ 🏠 Beranda ] [ 👨‍👩‍👧 Keluarga ] [ 📋 Laporan ] [ 👤 Profil ]
     Aktif           Normal            Normal          Normal
```

- Item aktif: `text-emerald-600` + garis/pill indicator di atas
- Item normal: `text-slate-400`
- Nav selalu hadir di semua layar *in-app* (kecuali layar autentikasi)

---

## 5. Form & Input Design

### Masalah Ditemukan

**a. Tidak ada Label yang Jelas di [login.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/login.html) dan [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html)**
Input hanya mengandalkan `placeholder` — saat pengguna mulai mengetik, label hilang dan pengguna tidak tahu konteks field tersebut.

**b. Input Tanggal yang Kasar di [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html)**
```js
// Teknik yang digunakan saat ini — kasar
onfocus="(this.type='date')"
```
Ini mengakibatkan *placeholder* "dd/mm/yyyy" menghilang tiba-tiba dan pengalaman yang tidak mulus di iOS Safari.

**c. Banyak Field Tanpa Label di [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html)**
Dari 10+ field pendaftaran, sebagian besar hanya menggunakan placeholder tanpa `<label>` yang terpisah.

**d. Header Form [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) Memakan Tempat Berlebih**
Header `bg-indigo-600` dengan `pt-12 pb-6` mengambil ~25% layar hanya untuk judul.

### Rekomendasi

```html
<!-- ✅ Pola Form Premium yang Direkomendasikan -->
<div class="form-group">
  <label class="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
    Nama Lengkap
  </label>
  <input 
    type="text" 
    class="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium 
           text-slate-800 
           focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10
           placeholder:text-slate-300
           transition-all duration-200"
    placeholder="Masukkan nama lengkap"
  >
</div>
```

**Perbaikan Khusus:**
- Ganti `onfocus` hack tanggal dengan `<input type="date">` langsung dengan styling kustom
- Tambahkan ikon di dalam input (leading icon) untuk tipe data yang kontekstual (📍 lokasi, 📱 telp)

---

## 6. Komponen & Micro-Interactions

### Masalah Ditemukan

- Hanya satu efek interaksi `.btn-press` (scale 0.96 saat ditekan)
- Tidak ada *state* loading / disabled pada tombol submit
- Tidak ada *feedback* visual saat input salah
- Tidak ada animasi transisi antar halaman
- Modal sukses di [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) sudah bagus (ada scale + opacity), tapi bisa ditingkatkan

### Rekomendasi

**a. Tombol Dengan States Lengkap:**
```
Normal  →  bg-emerald-600 text-white
Hover   →  bg-emerald-700 (transisi 200ms)
Active  →  scale(0.97) + bg-emerald-800
Loading →  spinner + "Menyimpan..." (disabled + opacity-70)
Success →  ✓ checkmark + "Tersimpan!" (2 detik) → kembali normal
```

**b. Input Error State:**
```
Border  →  border-rose-400
Ring    →  ring-2 ring-rose-400/10
Label   →  text-rose-500
Teks    →  "NIK tidak valid." di bawah input (text-xs text-rose-500 mt-1)
Animasi →  subtle shake (3 keyframe oscillation)
```

**c. Komponen Toast Notification (menggantikan modal untuk feedback ringan):**
```
Posisi  : fixed top-4 right-4 (atau top-20 untuk menghindari header)
Style   : bg-emerald-900 text-white rounded-2xl px-4 py-3 shadow-2xl
Animasi : slide down + fade in → auto dismiss setelah 3 detik
```

---

## 7. Aksesibilitas (A11y)

### Masalah Kritis

| Masalah | Detail |
|---|---|
| Tidak ada `aria-label` pada tombol ikon | Tombol back, tombol logout tidak terbaca screen reader |
| Kontras rendah | `text-[8px] text-indigo-400` pada [spm-menu.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/spm-menu.html) tidak memenuhi WCAG AA |
| Input tanpa label eksplisit | Hanya `placeholder` — tidak aksesibel untuk screen reader |
| `<button>` tanpa type | Beberapa button dalam form tidak memiliki `type="button"` yang bisa memicu submit tidak sengaja |

### Rekomendasi Minimal

```html
<!-- ✅ Tambahkan aria-label pada tombol ikon -->
<button aria-label="Kembali ke halaman sebelumnya" onclick="history.back()">
  <i class="fa-solid fa-arrow-left" aria-hidden="true"></i>
</button>

<!-- ✅ Pastikan semua input punya label -->
<label for="input-nik">NIK</label>
<input id="input-nik" type="text" ...>
```

---

## 8. Halaman Per Halaman — Prioritas Perbaikan

### 🔴 Prioritas Tinggi

| Halaman | Perubahan Utama |
|---|---|
| [pendaftaran.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/pendaftaran.html) | Kartu data keluarga: naikkan ukuran teks, pisahkan info primer vs sekunder, perbaiki warna tombol Informasi (bukan rose) |
| [tambah-kunjungan.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/tambah-kunjungan.html) | Ganti header indigo dengan white, kurangi tinggi header yang berlebihan |
| Semua halaman | Ganti semua instance `text-[8px]` dan `text-[9px]` ke minimal `text-xs` |

### 🟡 Prioritas Menengah

| Halaman | Perubahan Utama |
|---|---|
| [index.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/index.html) | Ubah kartu menu dari solid emerald ke white+ikon emerald |
| [register.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/register.html) | Tambahkan `<label>` eksplisit untuk semua field |
| [spm-menu.html](file:///Volumes/Data/Aplikasi%20-%20WEB/2026/sipandu-bedas/spm-menu.html) | Tambahkan bottom navigation |
| Semua halaman | Standardisasi header — pilih satu pola (white atau emerald gelap) |

### 🟢 Prioritas Rendah / Enhancement

| Fitur | Detail |
|---|---|
| Skeleton loaders | Untuk state loading data |
| Toast notifications | Menggantikan modal untuk feedback sukses |
| Transisi halaman | Slide atau fade antar screen |
| Dark mode | Opsional — untuk penggunaan malam hari lapangan |

---

## Referensi Desain Premium yang Disarankan

Aplikasi yang bisa dijadikan inspirasi gaya *Government Civic Tech* yang premium:

| Aplikasi | Elemen yang Bisa Diadopsi |
|---|---|
| **Dukcapil Mobile** | Kartu data yang bersih, tipografi presisi |
| **myBCA / BCA Mobile** | Hierarki visual, whitespace, bottom nav |
| **Halodoc** | Card pasien, status chip, navigasi bawah |
| **GovTech Singapore Apps** | Clean layout, aksesibilitas tinggi, warna minimal |

---

## Kesimpulan Eksekutif

Sipandu Bedas memiliki fondasi teknis yang baik. Dengan 3 perbaikan utama berikut, tampilan dapat meningkat drastis ke level **Premium & Professional**:

1. **Naikkan ukuran font minimum ke 12px** — satu perubahan ini langsung meningkatkan keterbacaan dan kepercayaan pengguna secara signifikan.

2. **Standardisasi sistem warna** — hapus penggunaan indigo yang tidak konsisten, jadikan emerald sebagai satu-satunya warna brand, gunakan warna lain hanya untuk konteks semantik (bahaya, peringatan, info).

3. **Ubah kartu menu dari blok warna solid ke desain white card + ikon berwarna** — membuat keseluruhan antarmuka terasa lebih ringan, modern, dan bernilai tinggi (*premium feel*).
