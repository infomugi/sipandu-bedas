-- ============================================================
--  SIPANDU BEDAS — Database Schema (PostgreSQL Version)
--  Aplikasi Mobile Posyandu & 6 Layanan SPM
--  Wilayah: RW 11, Rancamanyar, Baleendah, Kab. Bandung
--  Dibuat  : 2026-03-12
-- ============================================================

-- ============================================================
-- 0. INITIAL SETUP & CLEANUP
-- ============================================================

-- Drop tables if they exist (PostgreSQL cascade handles foreign keys)
DROP TABLE IF EXISTS notifikasi CASCADE;
DROP TABLE IF EXISTS pesan CASCADE;
DROP TABLE IF EXISTS posyandu_assesment CASCADE;
DROP TABLE IF EXISTS pengajuan_rujukan CASCADE;
DROP TABLE IF EXISTS pengajuan_assesment CASCADE;
DROP TABLE IF EXISTS pengajuan_spm CASCADE;
DROP TABLE IF EXISTS spm_trantibum CASCADE;
DROP TABLE IF EXISTS spm_sosial CASCADE;
DROP TABLE IF EXISTS spm_pu CASCADE;
DROP TABLE IF EXISTS spm_perumahan CASCADE;
DROP TABLE IF EXISTS spm_pendidikan CASCADE;
DROP TABLE IF EXISTS spm_kesehatan CASCADE;
DROP TABLE IF EXISTS kunjungan_posyandu CASCADE;
DROP TABLE IF EXISTS anggota_keluarga CASCADE;
DROP TABLE IF EXISTS keluarga CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP VIEW IF EXISTS v_keluarga_lengkap CASCADE;

-- Drop custom types if they exist
DROP TYPE IF EXISTS role_type CASCADE;
DROP TYPE IF EXISTS status_kesejahteraan_type CASCADE;
DROP TYPE IF EXISTS status_asuransi_type CASCADE;
DROP TYPE IF EXISTS pendapatan_type CASCADE;
DROP TYPE IF EXISTS gender_type CASCADE;
DROP TYPE IF EXISTS status_keluarga_type CASCADE;
DROP TYPE IF EXISTS pendidikan_type CASCADE;
DROP TYPE IF EXISTS sasaran_type CASCADE;
DROP TYPE IF EXISTS kms_type CASCADE;
DROP TYPE IF EXISTS jenjang_pendidikan_type CASCADE;
DROP TYPE IF EXISTS jenis_bantuan_type CASCADE;
DROP TYPE IF EXISTS lahan_type CASCADE;
DROP TYPE IF EXISTS atap_type CASCADE;
DROP TYPE IF EXISTS dinding_type CASCADE;
DROP TYPE IF EXISTS lantai_type CASCADE;
DROP TYPE IF EXISTS pu_type CASCADE;
DROP TYPE IF EXISTS sosial_type CASCADE;
DROP TYPE IF EXISTS trantibum_type CASCADE;
DROP TYPE IF EXISTS spm_type CASCADE;
DROP TYPE IF EXISTS status_pengajuan_type CASCADE;

-- ============================================================
-- 1. CREATE CUSTOM ENUM TYPES
-- ============================================================

CREATE TYPE role_type AS ENUM ('kader', 'admin_desa', 'dinas');
CREATE TYPE status_kesejahteraan_type AS ENUM ('pra_sejahtera', 'sejahtera_1', 'sejahtera_2', 'sejahtera_3');
CREATE TYPE status_asuransi_type AS ENUM ('bpjs_pbi', 'bpjs_mandiri', 'asuransi_swasta', 'tidak_memiliki');
CREATE TYPE pendapatan_type AS ENUM ('lt_1jt', '1_3jt', 'gt_3jt');
CREATE TYPE gender_type AS ENUM ('L', 'P');
CREATE TYPE status_keluarga_type AS ENUM ('kepala_keluarga', 'istri', 'anak', 'lainnya');
CREATE TYPE pendidikan_type AS ENUM ('tidak_sekolah', 'sd', 'smp', 'sma', 'd3', 's1', 's2_plus');
CREATE TYPE sasaran_type AS ENUM ('balita', 'bumil', 'pus', 'lansia');
CREATE TYPE kms_type AS ENUM ('hijau', 'kuning', 'merah');
CREATE TYPE jenjang_pendidikan_type AS ENUM ('paud_tk', 'sd_mi', 'smp_mts', 'sma_smk_ma', 'putus_sekolah');
CREATE TYPE jenis_bantuan_type AS ENUM ('pelunasan_tunggakan', 'seragam_alat_tulis', 'fasilitas_belajar', 'beasiswa_lanjutan');
CREATE TYPE lahan_type AS ENUM ('milik_sendiri', 'sewa', 'numpang');
CREATE TYPE atap_type AS ENUM ('rumbia', 'asbes_seng', 'genteng', 'beton');
CREATE TYPE dinding_type AS ENUM ('bilik_bambu', 'setengah_tembok', 'tembok_penuh');
CREATE TYPE lantai_type AS ENUM ('tanah', 'plesteran', 'keramik');
CREATE TYPE pu_type AS ENUM ('sanitasi_septic_tank', 'mck_umum', 'sarana_air_bersih');
CREATE TYPE sosial_type AS ENUM ('penyandang_disabilitas', 'lansia', 'anak_terlantar', 'tuna_sosial', 'korban_bencana');
CREATE TYPE trantibum_type AS ENUM ('kebakaran', 'kdrt_asusila', 'bencana_alam', 'narkoba_premanisme', 'illegal_logging_fishing');
CREATE TYPE spm_type AS ENUM ('kesehatan', 'pendidikan', 'perumahan', 'pekerjaan_umum', 'sosial', 'trantibum');
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

-- ============================================================
-- 2. AUTOMATION: TIMESTAMP UPDATE TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 3. CREATE TABLES
-- ============================================================

-- 1. users
CREATE TABLE users (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama_lengkap      VARCHAR(150) NOT NULL,
    nik               CHAR(16) NOT NULL UNIQUE,
    email             VARCHAR(150) UNIQUE,
    no_hp             VARCHAR(20) NOT NULL,
    password          VARCHAR(255) NOT NULL,
    foto_profil       VARCHAR(255) NULL,
    rw                VARCHAR(10) NOT NULL DEFAULT '11',
    rt                VARCHAR(10) NULL,
    desa              VARCHAR(100) NOT NULL DEFAULT 'RANCAMANYAR',
    kecamatan         VARCHAR(100) NOT NULL DEFAULT 'BALEENDAH',
    kabupaten         VARCHAR(100) NOT NULL DEFAULT 'BANDUNG',
    role              role_type NOT NULL DEFAULT 'kader',
    is_active         SMALLINT NOT NULL DEFAULT 1,
    email_verified_at TIMESTAMP NULL,
    remember_token    VARCHAR(100) NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE users IS 'Akun kader posyandu, admin desa, dan dinas';

-- 2. keluarga
CREATE TABLE keluarga (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    no_kk                CHAR(16) NOT NULL UNIQUE,
    kader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    alamat_lengkap       TEXT NOT NULL,
    rt                   VARCHAR(10) NOT NULL,
    rw                   VARCHAR(10) NOT NULL,
    desa                 VARCHAR(100) NOT NULL DEFAULT 'RANCAMANYAR',
    kecamatan            VARCHAR(100) NOT NULL DEFAULT 'BALEENDAH',
    kabupaten            VARCHAR(100) NOT NULL DEFAULT 'BANDUNG',
    status_kesejahteraan status_kesejahteraan_type NOT NULL DEFAULT 'pra_sejahtera',
    status_asuransi      status_asuransi_type NOT NULL DEFAULT 'tidak_memiliki',
    pekerjaan_kk         VARCHAR(150) NULL,
    estimasi_pendapatan  pendapatan_type NULL,
    tgl_pendaftaran      DATE NOT NULL,
    is_aktif             SMALLINT NOT NULL DEFAULT 1,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
COMMENT ON TABLE keluarga IS 'Data Kartu Keluarga yang dibina kader posyandu';

-- 3. anggota_keluarga
CREATE TABLE anggota_keluarga (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    nik                 CHAR(16) NOT NULL UNIQUE,
    nama_lengkap        VARCHAR(150) NOT NULL,
    jenis_kelamin       gender_type NOT NULL,
    tanggal_lahir       DATE NOT NULL,
    tempat_lahir        VARCHAR(100) NULL,
    status_keluarga     status_keluarga_type NOT NULL DEFAULT 'anak',
    status_asuransi     status_asuransi_type NULL,
    pendidikan_terakhir pendidikan_type NULL,
    pekerjaan           VARCHAR(150) NULL,
    foto_ktp            VARCHAR(255) NULL,
    is_aktif            SMALLINT NOT NULL DEFAULT 1,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. kunjungan_posyandu
CREATE TABLE kunjungan_posyandu (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id) ON DELETE CASCADE,
    kader_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    tgl_kunjungan    DATE NOT NULL,
    bulan            SMALLINT NOT NULL,
    tahun            SMALLINT NOT NULL,
    catatan          TEXT NULL,
    no_hp_pendaftar  VARCHAR(20) NULL,
    foto_kk          VARCHAR(255) NULL,
    foto_warga       VARCHAR(255) NULL,
    latitude         DECIMAL(10,7) NULL,
    longitude        DECIMAL(11,7) NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. spm_kesehatan
CREATE TABLE spm_kesehatan (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id),
    anggota_id UUID NOT NULL REFERENCES anggota_keluarga(id),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pelayanan         DATE NOT NULL,
    jenis_sasaran         sasaran_type NOT NULL,
    berat_badan           DECIMAL(5,2) NULL,
    tinggi_badan          DECIMAL(5,2) NULL,
    status_kms            kms_type NULL,
    jenis_imunisasi       VARCHAR(100) NULL,
    terima_vitamin_a      SMALLINT NULL DEFAULT 0,
    terima_obat_cacing    SMALLINT NULL DEFAULT 0,
    usia_kehamilan_mgg    SMALLINT NULL,
    tekanan_darah         VARCHAR(20) NULL,
    lingkar_kepala_cm     DECIMAL(4,2) NULL,
    lingkar_lengan_cm     DECIMAL(4,2) NULL,
    catatan_tindak_lanjut TEXT NULL,
    ajukan_bantuan        SMALLINT NOT NULL DEFAULT 0,
    nik                   VARCHAR(20) NULL,
    keterangan            TEXT NULL,
    latitude              DECIMAL(10,7) NULL,
    longitude             DECIMAL(11,7) NULL,
    status_pengajuan      status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator   TEXT NULL,
    created_by            UUID NULL REFERENCES users(id),
    updated_by            UUID NULL REFERENCES users(id),
    deleted_at            TIMESTAMP NULL,
    deleted_by            UUID NULL REFERENCES users(id),
    created_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. spm_pendidikan
CREATE TABLE spm_pendidikan (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id),
    anggota_id UUID NOT NULL REFERENCES anggota_keluarga(id),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pengajuan       DATE NOT NULL,
    jenjang_pendidikan  jenjang_pendidikan_type NOT NULL,
    kelas               VARCHAR(10) NULL,
    nama_institusi      VARCHAR(200) NULL,
    jenis_bantuan       jenis_bantuan_type NOT NULL,
    keterangan_alasan   TEXT NOT NULL,
    nik                 VARCHAR(20) NULL,
    keterangan          TEXT NULL,
    file_bukti          VARCHAR(255) NULL,
    latitude            DECIMAL(10,7) NULL,
    longitude           DECIMAL(11,7) NULL,
    status_pengajuan    status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. spm_perumahan
CREATE TABLE spm_perumahan (
    id                           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pengajuan                DATE NOT NULL,
    latitude                     DECIMAL(10,7) NULL,
    longitude                    DECIMAL(11,7) NULL,
    file_ktp                     VARCHAR(255) NULL,
    file_kk                      VARCHAR(255) NULL,
    file_sk_penghasilan          VARCHAR(255) NULL,
    file_bukti_lahan             VARCHAR(255) NULL,
    foto_rumah_depan             VARCHAR(255) NULL,
    foto_rumah_samping           VARCHAR(255) NULL,
    foto_rumah_belakang          VARCHAR(255) NULL,
    status_kepemilikan_lahan     lahan_type NULL,
    jenis_atap                   atap_type NULL,
    jenis_dinding                dinding_type NULL,
    jenis_lantai                 lantai_type NULL,
    pernyataan_belum_pernah_terima SMALLINT NOT NULL DEFAULT 0,
    nik                          VARCHAR(20) NULL,
    keterangan                   TEXT NULL,
    status_pengajuan             status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator          TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at                   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. spm_pu
CREATE TABLE spm_pu (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NOT NULL REFERENCES keluarga(id),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pengajuan         DATE NOT NULL,
    jenis_kebutuhan       pu_type NOT NULL,
    detail_lokasi         TEXT NOT NULL,
    latitude              DECIMAL(10,7) NULL,
    longitude             DECIMAL(11,7) NULL,
    estimasi_dimensi      VARCHAR(200) NULL,
    file_surat_permohonan VARCHAR(255) NULL,
    nik                   VARCHAR(20) NULL,
    keterangan            TEXT NULL,
    status_pengajuan      status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator   TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. spm_sosial
CREATE TABLE spm_sosial (
    id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keluarga_id UUID NULL REFERENCES keluarga(id),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pengajuan          DATE NOT NULL,
    kategori_sasaran       sosial_type NOT NULL,
    nik_sasaran            CHAR(16) NULL,
    nama_sasaran           VARCHAR(150) NULL,
    penjelasan_kondisi     TEXT NOT NULL,
    keterangan             TEXT NULL,
    bantuan_mendesak       VARCHAR(200) NULL,
    latitude               DECIMAL(10,7) NULL,
    longitude              DECIMAL(11,7) NULL,
    file_identitas_sasaran VARCHAR(255) NULL,
    file_sk_desa           VARCHAR(255) NULL,
    status_pengajuan       status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator    TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at             TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 10. spm_trantibum
CREATE TABLE spm_trantibum (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_pengajuan       DATE NOT NULL,
    waktu_kejadian      TIMESTAMP NULL,
    kategori_laporan    trantibum_type NOT NULL,
    detail_kejadian     TEXT NOT NULL,
    latitude            DECIMAL(10,7) NULL,
    longitude           DECIMAL(11,7) NULL,
    is_anonim           SMALLINT NOT NULL DEFAULT 0,
    nama_pelapor        VARCHAR(150) NULL,
    no_kontak_pelapor   VARCHAR(20) NULL,
    file_ktp_pelapor    VARCHAR(255) NULL,
    estimasi_korban     SMALLINT NULL,
    estimasi_kerugian   BIGINT NULL,
    nik                 VARCHAR(20) NULL,
    keterangan          TEXT NULL,
    status_pengajuan    status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    catatan_verifikator TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11. pengajuan_spm
CREATE TABLE pengajuan_spm (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kader_id UUID NOT NULL REFERENCES users(id),
    keluarga_id UUID NULL REFERENCES keluarga(id),
    jenis_spm      spm_type NOT NULL,
    ref_id UUID NOT NULL,
    status         status_pengajuan_type NOT NULL DEFAULT 'menunggu_validasi_desa',
    kode_pengajuan VARCHAR(30) UNIQUE,
    catatan        TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11a. pengajuan_assesment
CREATE TABLE pengajuan_assesment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID NOT NULL REFERENCES pengajuan_spm(id) ON DELETE CASCADE,
    foto_kk VARCHAR(255),
    foto_rumah VARCHAR(255),
    latitude VARCHAR(50),
    longitude VARCHAR(50),
    deskripsi_assesment TEXT,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 11b. pengajuan_rujukan
CREATE TABLE pengajuan_rujukan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID NOT NULL REFERENCES pengajuan_spm(id) ON DELETE CASCADE,
    no_surat_pengantar VARCHAR(100),
    file_surat_pengantar VARCHAR(255),
    tgl_upload TIMESTAMP,
    validasi_kecamatan SMALLINT DEFAULT 0, -- 0=Menunggu, 1=Valid
    validasi_kabupaten SMALLINT DEFAULT 0, -- 0=Menunggu, 1=Valid
    tindak_lanjut_dinas TEXT,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 12. posyandu_assesment
CREATE TABLE posyandu_assesment (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    kader_id UUID NOT NULL REFERENCES users(id),
    tgl_assesment     DATE NOT NULL DEFAULT CURRENT_DATE,
    meja_1_pendaftaran SMALLINT NOT NULL DEFAULT 1,
    meja_2_penimbangan SMALLINT NOT NULL DEFAULT 1,
    meja_3_pencatatan  SMALLINT NOT NULL DEFAULT 1,
    meja_4_penyuluhan  SMALLINT NOT NULL DEFAULT 1,
    meja_5_pelayanan   SMALLINT NOT NULL DEFAULT 1,
    alat_timbangan_ok  SMALLINT NOT NULL DEFAULT 1,
    alat_ukur_tinggi_ok SMALLINT NOT NULL DEFAULT 1,
    stok_vitamin_a     SMALLINT NOT NULL DEFAULT 1,
    stok_obat_cacing   SMALLINT NOT NULL DEFAULT 1,
    catatan_kendala    TEXT NULL,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 13. pesan (Messaging)
CREATE TABLE pesan (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengirim_id UUID NOT NULL REFERENCES users(id),
    penerima_id UUID NOT NULL REFERENCES users(id),
    isi_pesan     TEXT NOT NULL,
    is_read       SMALLINT NOT NULL DEFAULT 0,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 14. notifikasi
CREATE TABLE notifikasi (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    judul         VARCHAR(150) NOT NULL,
    pesan         TEXT NOT NULL,
    link          VARCHAR(255) NULL,
    is_read       SMALLINT NOT NULL DEFAULT 0,
    created_by UUID NULL REFERENCES users(id),
    updated_by UUID NULL REFERENCES users(id),
    deleted_at          TIMESTAMP NULL,
    deleted_by UUID NULL REFERENCES users(id),
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- 4. TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- ============================================================

CREATE TRIGGER trg_users_timestamp BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_keluarga_timestamp BEFORE UPDATE ON keluarga FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_anggota_keluarga_timestamp BEFORE UPDATE ON anggota_keluarga FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_kunjungan_posyandu_timestamp BEFORE UPDATE ON kunjungan_posyandu FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_kesehatan_timestamp BEFORE UPDATE ON spm_kesehatan FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_pendidikan_timestamp BEFORE UPDATE ON spm_pendidikan FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_perumahan_timestamp BEFORE UPDATE ON spm_perumahan FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_pu_timestamp BEFORE UPDATE ON spm_pu FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_sosial_timestamp BEFORE UPDATE ON spm_sosial FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_spm_trantibum_timestamp BEFORE UPDATE ON spm_trantibum FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_pengajuan_spm_timestamp BEFORE UPDATE ON pengajuan_spm FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_pengajuan_assesment_timestamp BEFORE UPDATE ON pengajuan_assesment FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_pengajuan_rujukan_timestamp BEFORE UPDATE ON pengajuan_rujukan FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_posyandu_assesment_timestamp BEFORE UPDATE ON posyandu_assesment FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_pesan_timestamp BEFORE UPDATE ON pesan FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_notifikasi_timestamp BEFORE UPDATE ON notifikasi FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Trigger for Generated Column-like behavior for kode_pengajuan (since PG 12 STORED has limitations with expressions based on current time)
CREATE OR REPLACE FUNCTION generate_kode_pengajuan()
RETURNS TRIGGER AS $$
BEGIN
    NEW.kode_pengajuan = UPPER(SUBSTRING(NEW.jenis_spm::text, 1, 3)) || SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6) || EXTRACT(YEAR FROM CURRENT_TIMESTAMP);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_pengajuan_spm_kode AFTER INSERT ON pengajuan_spm FOR EACH ROW EXECUTE FUNCTION generate_kode_pengajuan();

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX idx_anggota_nik        ON anggota_keluarga(nik);
CREATE INDEX idx_anggota_keluarga   ON anggota_keluarga(keluarga_id);
CREATE INDEX idx_keluarga_kader_aktif   ON keluarga(kader_id, is_aktif);
CREATE INDEX idx_keluarga_nokk          ON keluarga(no_kk);
CREATE INDEX idx_kunjungan_bulan_tahun  ON kunjungan_posyandu(kader_id, bulan, tahun);
CREATE INDEX idx_pengajuan_status       ON pengajuan_spm(kader_id, status, created_at);
CREATE INDEX idx_spmkes_sasaran         ON spm_kesehatan(jenis_sasaran, tgl_pelayanan);

-- ============================================================
-- 6. VIEW
-- ============================================================

CREATE OR REPLACE VIEW v_keluarga_lengkap AS
SELECT
    k.id                     AS keluarga_id,
    k.no_kk,
    k.rt,
    k.rw,
    k.desa,
    k.kecamatan,
    k.status_kesejahteraan,
    k.status_asuransi,
    k.pekerjaan_kk,
    k.estimasi_pendapatan,
    a.nik                    AS nik_kk,
    a.nama_lengkap           AS nama_kk,
    COUNT(DISTINCT an.id)    AS jumlah_anggota,
    MAX(kj.tgl_kunjungan)    AS kunjungan_terakhir,
    COUNT(DISTINCT p.id)     AS total_pengajuan_spm
FROM keluarga k
JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
LEFT JOIN anggota_keluarga an ON an.keluarga_id = k.id
LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id = k.id
LEFT JOIN pengajuan_spm p ON p.keluarga_id = k.id
WHERE k.is_aktif = 1 AND k.deleted_at IS NULL
GROUP BY
    k.id, k.no_kk, k.rt, k.rw, k.desa, k.kecamatan,
    k.status_kesejahteraan, k.status_asuransi, k.pekerjaan_kk,
    k.estimasi_pendapatan, a.nik, a.nama_lengkap;

