-- ============================================================
--  SIPANDU BEDAS — Dummy Data (PostgreSQL UUID Version)
--  Wilayah: RW 11, Rancamanyar, Baleendah, Kab. Bandung
--  Dibuat  : 2026-03-12
--  Catatan : Support Laravel SoftDeletes & Audit Trail
--            (created_by, updated_by, deleted_at, deleted_by)
--            akan otomatis diisi NULL pada skrip seed ini.
--  PENTING : Semua ID sekarang ditenagai oleh static UUIDs.
-- ============================================================

-- ============================================================
-- 1. USERS
-- ============================================================
INSERT INTO users (id, nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, role) VALUES
('11111111-1111-1111-1111-111111111111', 'Kader Ayu',        '3204320101900001', 'ayu@rw11.id',         '081200000001', '$2y$10$placeholder_hash_ayu',    '11', '01', 'RANCAMANYAR', 'BALEENDAH', 'BANDUNG', 'kader'),
('22222222-2222-2222-2222-222222222222', 'Kader Budi',       '3204320102900002', 'budi@rw11.id',        '081200000002', '$2y$10$placeholder_hash_budi',   '11', '02', 'RANCAMANYAR', 'BALEENDAH', 'BANDUNG', 'kader'),
('33333333-3333-3333-3333-333333333333', 'Admin Desa Ranca', '3204320103900003', 'admin@rancamanyar.id','081200000003', '$2y$10$placeholder_hash_admin',  '11', '-',  'RANCAMANYAR', 'BALEENDAH', 'BANDUNG', 'admin_desa'),
('44444444-4444-4444-4444-444444444444', 'Dinas Sosial',     '3204320104900004', 'dinsos@bandung.go.id','081200000004', '$2y$10$placeholder_hash_dinsos', '00', '00', 'SOREANG',     'SOREANG',   'BANDUNG', 'dinas');

-- ============================================================
-- 2. KELUARGA
-- ============================================================
INSERT INTO keluarga (id, no_kk, kader_id, alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran) VALUES
('aaaaaaaa-1111-1111-1111-111111111111', '3204321111111111', '11111111-1111-1111-1111-111111111111', 'Kp. Rancamanyar RT 01 RW 11 No. 5', '01', '11', 'pra_sejahtera', 'tidak_memiliki', 'Buruh Harian Lepas', 'lt_1jt', '2026-01-10'),
('aaaaaaaa-2222-2222-2222-222222222222', '3204322222222222', '11111111-1111-1111-1111-111111111111', 'Kp. Rancamanyar RT 01 RW 11 No. 8', '01', '11', 'sejahtera_1',   'bpjs_pbi',       'Pedagang',           '1_3jt',  '2026-01-15'),
('aaaaaaaa-3333-3333-3333-333333333333', '3204323333333333', '22222222-2222-2222-2222-222222222222', 'Kp. Rancamanyar RT 02 RW 11 No. 2', '02', '11', 'sejahtera_2',   'bpjs_mandiri',   'Karyawan Swasta',    'gt_3jt', '2026-02-05');

-- ============================================================
-- 3. ANGGOTA KELUARGA
-- ============================================================
INSERT INTO anggota_keluarga (id, keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan) VALUES
-- Keluarga 1 (KK: Asep, Istri: Ani, Anak: Caca)
('bbbbbbbb-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', '3204321111111101', 'Asep Saepudin', 'L', '1985-06-15', 'kepala_keluarga', 'tidak_memiliki', 'smp',           'Buruh Harian Lepas'),
('bbbbbbbb-1111-1111-1111-111111111112', 'aaaaaaaa-1111-1111-1111-111111111111', '3204321111111102', 'Ani Suryani',   'P', '1988-08-20', 'istri',           'tidak_memiliki', 'sd',            'Mengurus Rumah Tangga'),
('bbbbbbbb-1111-1111-1111-111111111113', 'aaaaaaaa-1111-1111-1111-111111111111', '3204321111111103', 'Caca Marica',   'P', '2023-11-10', 'anak',            'tidak_memiliki', 'tidak_sekolah', 'Belum/Tidak Bekerja'),
-- Keluarga 2 (KK: Joko, Lansia: Karto)
('bbbbbbbb-2222-2222-2222-222222222221', 'aaaaaaaa-2222-2222-2222-222222222222', '3204322222222201', 'Joko Susanto',  'L', '1975-12-01', 'kepala_keluarga', 'bpjs_pbi',       'sma',           'Pedagang'),
('bbbbbbbb-2222-2222-2222-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222', '3204322222222202', 'Karto Miharja', 'L', '1945-05-15', 'lainnya',         'bpjs_pbi',       'tidak_sekolah', 'Pensiunan'),
-- Keluarga 3 (KK: Tini)
('bbbbbbbb-3333-3333-3333-333333333331', 'aaaaaaaa-3333-3333-3333-333333333333', '3204323333333301', 'Tini Kartini',  'P', '1995-03-25', 'kepala_keluarga', 'bpjs_mandiri',   's1',            'Karyawan Swasta');

-- ============================================================
-- 4. KUNJUNGAN POSYANDU
-- ============================================================
INSERT INTO kunjungan_posyandu (id, keluarga_id, kader_id, tgl_kunjungan, bulan, tahun, catatan, no_hp_pendaftar) VALUES
('cccccccc-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-03-05', 3, 2026, 'Kunjungan penimbangan balita Caca', '0811111111'),
('cccccccc-2222-2222-2222-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-03-06', 3, 2026, 'Pemeriksaan kesehatan lansia Karto', '0822222222'),
('cccccccc-3333-3333-3333-333333333333', 'aaaaaaaa-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2026-03-08', 3, 2026, 'Edukasi gizi ibu hamil Tini',       '0833333333');

-- ============================================================
-- 5. POSYANDU ASSESMENT (READINESS)
-- ============================================================
INSERT INTO posyandu_assesment (id, kader_id, tgl_assesment, meja_1_pendaftaran, meja_2_penimbangan, meja_3_pencatatan, meja_4_penyuluhan, meja_5_pelayanan, alat_timbangan_ok, alat_ukur_tinggi_ok, stok_vitamin_a, stok_obat_cacing, catatan_kendala) VALUES
('dddddddd-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-03-01', 1, 1, 1, 1, 1, 1, 1, 1, 1, 'Fasilitas dan stok obat lengkap bulan ini.'),
('dddddddd-2222-2222-2222-222222222222', '22222222-2222-2222-2222-222222222222', '2026-03-01', 1, 1, 1, 1, 0, 1, 0, 1, 0, 'Alat ukur tinggi sedang rusak.');

-- ============================================================
-- 6. SIMULASI SPM & HIERARCHICAL VERIFICATION (PENGAJUAN SPM)
-- ============================================================

-- SKENARIO 1: Balita Caca mengalami Gizi Buruk (SPM Kesehatan) -> Baru masuk, Menunggu Validasi Desa
INSERT INTO spm_kesehatan (id, keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran, berat_badan, tinggi_badan, lingkar_kepala_cm, lingkar_lengan_cm, status_kms, latitude, longitude, status_pengajuan, nik, keterangan) 
VALUES ('eeeeeeee-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', '2026-03-05', 'balita', 8.5, 75.0, 45.0, 12.0, 'merah', -6.9991, 107.6012, 'menunggu_validasi_desa', '3204321111111103', 'Balita gizi kurang, perlu PMT');
INSERT INTO pengajuan_spm (id, kader_id, keluarga_id, jenis_spm, ref_id, status, catatan)
VALUES ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'kesehatan', 'eeeeeeee-1111-1111-1111-111111111111', 'menunggu_validasi_desa', 'Pengajuan PMT Pemulihan');

-- SKENARIO 2: Lansia Karto Terlantar (SPM Sosial) -> Sedang Assesment Lapangan
INSERT INTO spm_sosial (id, keluarga_id, kader_id, tgl_pengajuan, kategori_sasaran, nik_sasaran, nama_sasaran, penjelasan_kondisi, bantuan_mendesak, latitude, longitude, status_pengajuan, keterangan)
VALUES ('eeeeeeee-2222-2222-2222-222222222222', 'aaaaaaaa-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', '2026-03-06', 'lansia', '3204322222222202', 'Karto Miharja', 'Lansia sebatang kara, sakit-sakitan', 'Sembako dan Obat', -6.9992, 107.6015, 'menunggu_rtl_desa', 'Perlu bantuan kursi roda');
INSERT INTO pengajuan_spm (id, kader_id, keluarga_id, jenis_spm, ref_id, status, catatan)
VALUES ('eeeeeeee-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-2222-2222-2222-222222222222', 'sosial', 'eeeeeeee-2222-2222-2222-222222222222', 'menunggu_rtl_desa', 'Pengajuan Bantuan Sosial Lansia');
INSERT INTO pengajuan_assesment (id, pengajuan_id, foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment)
VALUES ('ffffffff-0000-0000-0000-000000000002', 'eeeeeeee-0000-0000-0000-000000000002', 'kk_joko.jpg', 'rumah_joko.jpg', '-6.9992', '107.6015', 'Telah diverifikasi, Karto memang lumpuh di ranjang.');

-- SKENARIO 3: Rumah Asep Roboh (SPM Perumahan) -> Dirujuk, Selesai di Dinas
INSERT INTO spm_perumahan (id, keluarga_id, kader_id, tgl_pengajuan, status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai, pernyataan_belum_pernah_terima, status_pengajuan, nik, keterangan)
VALUES ('eeeeeeee-3333-3333-3333-333333333333', 'aaaaaaaa-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111111', '2026-02-15', 'milik_sendiri', 'asbes_seng', 'bilik_bambu', 'tanah', 1, 'selesai_di_dinas', '3204321111111101', 'Kondisi atap bocor parah');
INSERT INTO pengajuan_spm (id, kader_id, keluarga_id, jenis_spm, ref_id, status, catatan)
VALUES ('eeeeeeee-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-1111-1111-1111-111111111111', 'perumahan', 'eeeeeeee-3333-3333-3333-333333333333', 'selesai_di_dinas', 'Pengajuan Bantuan Rutilahu Bp Asep');
INSERT INTO pengajuan_assesment (id, pengajuan_id, foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment)
VALUES ('ffffffff-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', 'kk_asep.jpg', 'rumah_asep.jpg', '-6.9995', '107.6010', 'Rumah miring, perlu Rutilahu.');
INSERT INTO pengajuan_rujukan (id, pengajuan_id, no_surat_pengantar, file_surat_pengantar, tgl_upload, validasi_kecamatan, validasi_kabupaten, tindak_lanjut_dinas)
VALUES ('aaaaaabb-0000-0000-0000-000000000003', 'eeeeeeee-0000-0000-0000-000000000003', '460/01/DS/2026', 'rujukan_asep.pdf', '2026-02-20', 1, 1, 'Bantuan material perbaikan rumah telah turun senilai 15 Jt.');

-- SKENARIO 4: Bencana Angin Puting Beliung (SPM Trantibum) -> Validasi Kecamatan
INSERT INTO spm_trantibum (id, kader_id, tgl_pengajuan, waktu_kejadian, kategori_laporan, detail_kejadian, latitude, longitude, is_anonim, nama_pelapor, status_pengajuan, nik, keterangan)
VALUES ('eeeeeeee-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', '2026-03-11', '2026-03-10 15:30:00', 'bencana_alam', 'Pohon tumbang menimpa atap', -6.9990, 107.6000, 0, 'Kader Budi', 'menunggu_validasi_kabupaten', '3204320102900002', 'Laporan awal dari warga');

-- SKENARIO 5: Bantuan Seragam (SPM Pendidikan)
INSERT INTO spm_pendidikan (id, keluarga_id, anggota_id, kader_id, tgl_pengajuan, jenjang_pendidikan, kelas, nama_institusi, jenis_bantuan, keterangan_alasan, status_pengajuan, nik, keterangan)
VALUES ('eeeeeeee-5555-5555-5555-555555555555', 'aaaaaaaa-1111-1111-1111-111111111111', 'bbbbbbbb-1111-1111-1111-111111111113', '11111111-1111-1111-1111-111111111111', '2026-03-07', 'sd_mi', '1', 'SDN Rancamanyar 01', 'seragam_alat_tulis', 'Orang tua tidak mampu beli seragam', 'menunggu_validasi_desa', '3204321111111103', 'Sangat mendesak');

-- SKENARIO 6: Sanitasi Septic Tank (SPM PU)
INSERT INTO spm_pu (id, keluarga_id, kader_id, tgl_pengajuan, jenis_kebutuhan, detail_lokasi, status_pengajuan, nik, keterangan)
VALUES ('eeeeeeee-6666-6666-6666-666666666666', 'aaaaaaaa-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', '2026-03-08', 'sanitasi_septic_tank', 'Kampung Tengah RT 02 RW 11', 'menunggu_validasi_desa', '3204323333333301', 'Area padat penduduk');
INSERT INTO pengajuan_spm (id, kader_id, jenis_spm, ref_id, status, catatan)
VALUES ('eeeeeeee-0000-0000-0000-000000000004', '22222222-2222-2222-2222-222222222222', 'trantibum', 'eeeeeeee-4444-4444-4444-444444444444', 'menunggu_validasi_kabupaten', 'Evakuasi Pohon Tumbang');
INSERT INTO pengajuan_assesment (id, pengajuan_id, foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment)
VALUES ('ffffffff-0000-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000004', NULL, 'pohon_tumbang.jpg', '-6.9990', '107.6000', 'Kerusakan atap sekitar 40%.');
INSERT INTO pengajuan_rujukan (id, pengajuan_id, no_surat_pengantar, file_surat_pengantar, tgl_upload, validasi_kecamatan, validasi_kabupaten)
VALUES ('aaaaaabb-0000-0000-0000-000000000004', 'eeeeeeee-0000-0000-0000-000000000004', '360/02/DS/2026', 'rujukan_bpbd.pdf', '2026-03-12', 1, 0);

-- ============================================================
-- 7. PESAN (MESSAGING)
-- ============================================================
INSERT INTO pesan (id, pengirim_id, penerima_id, isi_pesan, is_read) VALUES
('00000000-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', 'Pak Admin, mohon validasi pengajuan SPM.', 0),
('00000000-0000-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', '11111111-1111-1111-1111-111111111111', 'Sedang saya tinjau, terima kasih.', 1),
('00000000-0000-0000-0000-000000000003', '22222222-2222-2222-2222-222222222222', '44444444-4444-4444-4444-444444444444', 'Buku laporan BPBD sudah di-upload.', 0);

-- ============================================================
-- 8. NOTIFIKASI
-- ============================================================
INSERT INTO notifikasi (id, user_id, judul, pesan, is_read) VALUES
('11111111-1111-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Pengajuan Selesai', 'Bantuan disalurkan.', 0),
('11111111-1111-0000-0000-000000000002', '33333333-3333-3333-3333-333333333333', 'Pengajuan Baru', 'Terdapat pengajuan baru', 0);
