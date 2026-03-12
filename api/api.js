// ============================================================
//  SIPANDU BEDAS — Comprehensive REST API
//  Mencakup: Auth, Dashboard, Keluarga, Anggota, Kunjungan,
//             6 SPM, Pengajuan, Laporan, Profil
// ============================================================

const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Database Connection ──────────────────────────────────────
const pool = new Pool({
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5433,
    user:     process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgress',
    database: process.env.DB_NAME     || 'dpmd_sipandu_bedas',
});

pool.connect()
    .then(c => { console.log('✅ Koneksi PostgreSQL berhasil'); c.release(); })
    .catch(e => console.error('❌ Koneksi DB gagal:', e.message));

// ─── Helper ───────────────────────────────────────────────────
const ok  = (res, data, code = 200) => res.status(code).json({ success: true,  data });
const err = (res, msg,  code = 500) => res.status(code).json({ success: false, message: msg });

// ============================================================
// 1. AUTH
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { nik, password } = req.body;
        if (!nik || !password) return err(res, 'NIK dan password wajib diisi', 400);
        const { rows } = await pool.query(
            'SELECT id, nama_lengkap, nik, email, no_hp, role, rw, rt, desa, kecamatan, foto_profil, is_active FROM users WHERE nik = $1',
            [nik]
        );
        if (rows.length === 0) return err(res, 'NIK tidak ditemukan', 401);
        if (!rows[0].is_active) return err(res, 'Akun tidak aktif', 403);
        // NOTE: Di produksi gunakan bcrypt.compare(password, rows[0].password)
        ok(res, { user: rows[0], token: `mock-token-${rows[0].id}` });
    } catch (e) { err(res, e.message); }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        const { nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, role } = req.body;
        if (!nama_lengkap || !nik || !password || !no_hp) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO users (nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, role)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id, nama_lengkap, nik, role`,
            [nama_lengkap, nik, email, no_hp, password, rw, rt,
             desa || 'RANCAMANYAR', kecamatan || 'BALEENDAH', kabupaten || 'BANDUNG', role || 'kader']
        );
        ok(res, rows[0], 201);
    } catch (e) {
        if (e.code === '23505') return err(res, 'NIK atau email sudah terdaftar', 409);
        err(res, e.message);
    }
});

// POST /api/auth/forgot-password
app.post('/api/auth/forgot-password', async (req, res) => {
    try {
        const { nik, no_hp } = req.body;
        if (!nik || !no_hp) return err(res, 'NIK dan No. HP wajib diisi', 400);
        const { rows } = await pool.query('SELECT id FROM users WHERE nik=$1 AND no_hp=$2', [nik, no_hp]);
        if (rows.length === 0) return err(res, 'Data tidak ditemukan', 404);
        // NOTE: Di produksi, kirim OTP ke no_hp via SMS gateway
        ok(res, { message: 'Verifikasi berhasil. OTP dikirim ke nomor HP terdaftar.' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 2. DASHBOARD
// ============================================================

// GET /api/dashboard?kader_id=
app.get('/api/dashboard', async (req, res) => {
    try {
        const { kader_id } = req.query;
        if (!kader_id) return err(res, 'kader_id wajib', 400);

        const now = new Date();
        const bulan = now.getMonth() + 1;
        const tahun = now.getFullYear();

        const [keluarga, kunjungan, pengajuan, spmBulanIni] = await Promise.all([
            pool.query('SELECT COUNT(*) FROM keluarga WHERE kader_id=$1 AND is_aktif=1', [kader_id]),
            pool.query('SELECT COUNT(*) FROM kunjungan_posyandu WHERE kader_id=$1 AND bulan=$2 AND tahun=$3', [kader_id, bulan, tahun]),
            pool.query('SELECT COUNT(*) FROM pengajuan_spm WHERE kader_id=$1 AND status=\'menunggu_verifikasi\'', [kader_id]),
            pool.query(
                `SELECT jenis_spm, COUNT(*) AS total FROM pengajuan_spm
                 WHERE kader_id=$1 AND EXTRACT(MONTH FROM created_at)=$2 AND EXTRACT(YEAR FROM created_at)=$3
                 GROUP BY jenis_spm`, [kader_id, bulan, tahun]
            )
        ]);

        ok(res, {
            total_keluarga:          parseInt(keluarga.rows[0].count),
            kunjungan_bulan_ini:     parseInt(kunjungan.rows[0].count),
            pengajuan_menunggu:      parseInt(pengajuan.rows[0].count),
            distribusi_spm_bulan_ini: spmBulanIni.rows,
        });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 3. KELUARGA
// ============================================================

// GET /api/keluarga?kader_id=&search=
app.get('/api/keluarga', async (req, res) => {
    try {
        const { kader_id, search } = req.query;
        let query = `
            SELECT k.*, a.nama_lengkap AS nama_kepala_keluarga, a.nik AS nik_kepala_keluarga,
                   COUNT(DISTINCT an.id) AS jumlah_anggota, MAX(kj.tgl_kunjungan) AS kunjungan_terakhir
            FROM keluarga k
            LEFT JOIN anggota_keluarga a  ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
            LEFT JOIN anggota_keluarga an ON an.keluarga_id = k.id
            LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id = k.id
            WHERE k.is_aktif = 1`;
        const params = [];
        if (kader_id) { params.push(kader_id); query += ` AND k.kader_id = $${params.length}`; }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (k.no_kk ILIKE $${params.length} OR a.nama_lengkap ILIKE $${params.length} OR a.nik ILIKE $${params.length})`;
        }
        query += ' GROUP BY k.id, a.nama_lengkap, a.nik ORDER BY a.nama_lengkap';
        const { rows } = await pool.query(query, params);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/keluarga/:id  (detail + anggota)
app.get('/api/keluarga/:id', async (req, res) => {
    try {
        const { rows: kRows } = await pool.query('SELECT * FROM keluarga WHERE id=$1 AND is_aktif=1', [req.params.id]);
        if (!kRows.length) return err(res, 'Keluarga tidak ditemukan', 404);
        const { rows: aRows } = await pool.query('SELECT * FROM anggota_keluarga WHERE keluarga_id=$1 AND is_aktif=1 ORDER BY status_keluarga', [req.params.id]);
        ok(res, { ...kRows[0], anggota: aRows });
    } catch (e) { err(res, e.message); }
});

// POST /api/keluarga
app.post('/api/keluarga', async (req, res) => {
    try {
        const { no_kk, kader_id, alamat_lengkap, rt, rw, desa, kecamatan, kabupaten,
                status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran } = req.body;
        if (!no_kk || !kader_id || !tgl_pendaftaran) return err(res, 'no_kk, kader_id, tgl_pendaftaran wajib', 400);
        const { rows } = await pool.query(
            `INSERT INTO keluarga (no_kk, kader_id, alamat_lengkap, rt, rw, desa, kecamatan, kabupaten,
             status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [no_kk, kader_id, alamat_lengkap, rt, rw,
             desa || 'RANCAMANYAR', kecamatan || 'BALEENDAH', kabupaten || 'BANDUNG',
             status_kesejahteraan || 'pra_sejahtera', status_asuransi || 'tidak_memiliki',
             pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran]
        );
        ok(res, { id: rows[0].id, message: 'Keluarga berhasil ditambahkan' }, 201);
    } catch (e) {
        if (e.code === '23505') return err(res, 'No. KK sudah terdaftar', 409);
        err(res, e.message);
    }
});

// PUT /api/keluarga/:id
app.put('/api/keluarga/:id', async (req, res) => {
    try {
        const { alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan } = req.body;
        const result = await pool.query(
            `UPDATE keluarga SET alamat_lengkap=$1, rt=$2, rw=$3, status_kesejahteraan=$4,
             status_asuransi=$5, pekerjaan_kk=$6, estimasi_pendapatan=$7 WHERE id=$8`,
            [alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Keluarga tidak ditemukan', 404);
        ok(res, { message: 'Keluarga diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/keluarga/:id  (soft delete)
app.delete('/api/keluarga/:id', async (req, res) => {
    try {
        const result = await pool.query('UPDATE keluarga SET is_aktif=0 WHERE id=$1', [req.params.id]);
        if (!result.rowCount) return err(res, 'Keluarga tidak ditemukan', 404);
        ok(res, { message: 'Keluarga dinonaktifkan' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 4. ANGGOTA KELUARGA
// ============================================================

// GET /api/keluarga/:keluarga_id/anggota
app.get('/api/keluarga/:keluarga_id/anggota', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT *, 
             EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir))  AS umur_tahun,
             EXTRACT(MONTH FROM AGE(CURRENT_DATE, tanggal_lahir)) AS umur_bulan_mod,
             (EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir)) * 12 + 
              EXTRACT(MONTH FROM AGE(CURRENT_DATE, tanggal_lahir))) AS umur_bulan_total,
             CASE
               WHEN (EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir)) * 12 + EXTRACT(MONTH FROM AGE(CURRENT_DATE, tanggal_lahir))) BETWEEN 0 AND 59 THEN 'balita'
               WHEN jenis_kelamin = 'P' AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir)) BETWEEN 15 AND 49 THEN 'pus'
               WHEN EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir)) >= 60 THEN 'lansia'
               ELSE 'umum'
             END AS kategori_posyandu
             FROM anggota_keluarga WHERE keluarga_id=$1 AND is_aktif=1 ORDER BY status_keluarga`,
            [req.params.keluarga_id]
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// POST /api/anggota
app.post('/api/anggota', async (req, res) => {
    try {
        const { keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir,
                status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan } = req.body;
        if (!keluarga_id || !nik || !nama_lengkap || !jenis_kelamin || !tanggal_lahir) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO anggota_keluarga (keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir,
             tempat_lahir, status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
            [keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir,
             tempat_lahir, status_keluarga || 'anak', status_asuransi, pendidikan_terakhir, pekerjaan]
        );
        ok(res, { id: rows[0].id, message: 'Anggota ditambahkan' }, 201);
    } catch (e) {
        if (e.code === '23505') return err(res, 'NIK sudah terdaftar', 409);
        err(res, e.message);
    }
});

// PUT /api/anggota/:id
app.put('/api/anggota/:id', async (req, res) => {
    try {
        const { nama_lengkap, jenis_kelamin, tanggal_lahir, status_keluarga,
                status_asuransi, pendidikan_terakhir, pekerjaan, is_aktif } = req.body;
        const result = await pool.query(
            `UPDATE anggota_keluarga SET nama_lengkap=$1, jenis_kelamin=$2, tanggal_lahir=$3,
             status_keluarga=$4, status_asuransi=$5, pendidikan_terakhir=$6, pekerjaan=$7, is_aktif=$8 WHERE id=$9`,
            [nama_lengkap, jenis_kelamin, tanggal_lahir, status_keluarga,
             status_asuransi, pendidikan_terakhir, pekerjaan, is_aktif ?? 1, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Anggota tidak ditemukan', 404);
        ok(res, { message: 'Anggota diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/anggota/:id  (soft delete)
app.delete('/api/anggota/:id', async (req, res) => {
    try {
        const result = await pool.query('UPDATE anggota_keluarga SET is_aktif=0 WHERE id=$1', [req.params.id]);
        if (!result.rowCount) return err(res, 'Anggota tidak ditemukan', 404);
        ok(res, { message: 'Anggota dinonaktifkan' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 5. KUNJUNGAN POSYANDU
// ============================================================

// GET /api/kunjungan?keluarga_id=&kader_id=&bulan=&tahun=
app.get('/api/kunjungan', async (req, res) => {
    try {
        const { keluarga_id, kader_id, bulan, tahun } = req.query;
        let q = 'SELECT kj.*, u.nama_lengkap AS nama_kader FROM kunjungan_posyandu kj JOIN users u ON u.id=kj.kader_id WHERE 1=1';
        const p = [];
        if (keluarga_id) { p.push(keluarga_id); q += ` AND kj.keluarga_id=$${p.length}`; }
        if (kader_id)    { p.push(kader_id);    q += ` AND kj.kader_id=$${p.length}`; }
        if (bulan)       { p.push(bulan);        q += ` AND kj.bulan=$${p.length}`; }
        if (tahun)       { p.push(tahun);        q += ` AND kj.tahun=$${p.length}`; }
        q += ' ORDER BY kj.tgl_kunjungan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/kunjungan/:id
app.get('/api/kunjungan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM kunjungan_posyandu WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Kunjungan tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// POST /api/kunjungan
app.post('/api/kunjungan', async (req, res) => {
    try {
        const { keluarga_id, kader_id, tgl_kunjungan, catatan } = req.body;
        if (!keluarga_id || !kader_id || !tgl_kunjungan) return err(res, 'Field wajib tidak lengkap', 400);
        const d = new Date(tgl_kunjungan);
        const { rows } = await pool.query(
            `INSERT INTO kunjungan_posyandu (keluarga_id, kader_id, tgl_kunjungan, bulan, tahun, catatan)
             VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
            [keluarga_id, kader_id, tgl_kunjungan, d.getMonth() + 1, d.getFullYear(), catatan]
        );
        ok(res, { id: rows[0].id, message: 'Kunjungan dicatat' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 6. SPM KESEHATAN
// ============================================================

// GET /api/spm/kesehatan?keluarga_id=&jenis_sasaran=
app.get('/api/spm/kesehatan', async (req, res) => {
    try {
        const { keluarga_id, jenis_sasaran, kader_id } = req.query;
        let q = `SELECT sk.*, a.nama_lengkap AS nama_anggota FROM spm_kesehatan sk
                 JOIN anggota_keluarga a ON a.id=sk.anggota_id WHERE 1=1`;
        const p = [];
        if (keluarga_id)   { p.push(keluarga_id);   q += ` AND sk.keluarga_id=$${p.length}`; }
        if (jenis_sasaran) { p.push(jenis_sasaran);  q += ` AND sk.jenis_sasaran=$${p.length}`; }
        if (kader_id)      { p.push(kader_id);       q += ` AND sk.kader_id=$${p.length}`; }
        q += ' ORDER BY sk.tgl_pelayanan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/spm/kesehatan/:id
app.get('/api/spm/kesehatan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_kesehatan WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// POST /api/spm/kesehatan
app.post('/api/spm/kesehatan', async (req, res) => {
    try {
        const { keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran,
                berat_badan, tinggi_badan, status_kms, jenis_imunisasi, terima_vitamin_a,
                terima_obat_cacing, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm,
                catatan_tindak_lanjut, ajukan_bantuan, latitude, longitude } = req.body;
        if (!keluarga_id || !anggota_id || !kader_id || !tgl_pelayanan || !jenis_sasaran) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_kesehatan (keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran,
             berat_badan, tinggi_badan, status_kms, jenis_imunisasi, terima_vitamin_a, terima_obat_cacing,
             usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm, catatan_tindak_lanjut, ajukan_bantuan, latitude, longitude)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
            [keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran,
             berat_badan, tinggi_badan, status_kms, jenis_imunisasi, terima_vitamin_a || 0,
             terima_obat_cacing || 0, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm,
             catatan_tindak_lanjut, ajukan_bantuan || 0, latitude, longitude]
        );
        ok(res, { id: rows[0].id, message: 'Data SPM Kesehatan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 7. SPM PENDIDIKAN
// ============================================================

app.get('/api/spm/pendidikan', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT sp.*, a.nama_lengkap AS nama_anak FROM spm_pendidikan sp JOIN anggota_keluarga a ON a.id=sp.anggota_id WHERE 1=1';
        const p = [];
        if (kader_id)        { p.push(kader_id);        q += ` AND sp.kader_id=$${p.length}`; }
        if (status_pengajuan){ p.push(status_pengajuan); q += ` AND sp.status_pengajuan=$${p.length}`; }
        q += ' ORDER BY sp.tgl_pengajuan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

app.get('/api/spm/pendidikan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_pendidikan WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/pendidikan', async (req, res) => {
    try {
        const { keluarga_id, anggota_id, kader_id, tgl_pengajuan, jenjang_pendidikan,
                kelas, nama_institusi, jenis_bantuan, keterangan_alasan, file_bukti, latitude, longitude } = req.body;
        if (!keluarga_id || !anggota_id || !kader_id || !jenjang_pendidikan || !jenis_bantuan || !keterangan_alasan) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_pendidikan (keluarga_id, anggota_id, kader_id, tgl_pengajuan, jenjang_pendidikan,
             kelas, nama_institusi, jenis_bantuan, keterangan_alasan, file_bukti, latitude, longitude)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [keluarga_id, anggota_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             jenjang_pendidikan, kelas, nama_institusi, jenis_bantuan, keterangan_alasan, file_bukti, latitude, longitude]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Pendidikan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 8. SPM PERUMAHAN
// ============================================================

app.get('/api/spm/perumahan', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT * FROM spm_perumahan WHERE 1=1';
        const p = [];
        if (kader_id)         { p.push(kader_id);        q += ` AND kader_id=$${p.length}`; }
        if (status_pengajuan) { p.push(status_pengajuan); q += ` AND status_pengajuan=$${p.length}`; }
        q += ' ORDER BY tgl_pengajuan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

app.get('/api/spm/perumahan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_perumahan WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/perumahan', async (req, res) => {
    try {
        const { keluarga_id, kader_id, tgl_pengajuan, latitude, longitude,
                status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai,
                pernyataan_belum_pernah_terima, file_ktp, file_kk } = req.body;
        if (!keluarga_id || !kader_id) return err(res, 'keluarga_id dan kader_id wajib', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_perumahan (keluarga_id, kader_id, tgl_pengajuan, latitude, longitude,
             status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai, pernyataan_belum_pernah_terima, file_ktp, file_kk)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             latitude, longitude, status_kepemilikan_lahan, jenis_atap, jenis_dinding,
             jenis_lantai, pernyataan_belum_pernah_terima || 0, file_ktp, file_kk]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Perumahan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 9. SPM PU (PEKERJAAN UMUM)
// ============================================================

app.get('/api/spm/pu', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT * FROM spm_pu WHERE 1=1';
        const p = [];
        if (kader_id)         { p.push(kader_id);        q += ` AND kader_id=$${p.length}`; }
        if (status_pengajuan) { p.push(status_pengajuan); q += ` AND status_pengajuan=$${p.length}`; }
        q += ' ORDER BY tgl_pengajuan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

app.get('/api/spm/pu/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_pu WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/pu', async (req, res) => {
    try {
        const { keluarga_id, kader_id, tgl_pengajuan, jenis_kebutuhan,
                detail_lokasi, latitude, longitude, estimasi_dimensi, file_surat_permohonan } = req.body;
        if (!keluarga_id || !kader_id || !jenis_kebutuhan || !detail_lokasi) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_pu (keluarga_id, kader_id, tgl_pengajuan, jenis_kebutuhan, detail_lokasi, latitude, longitude, estimasi_dimensi, file_surat_permohonan)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             jenis_kebutuhan, detail_lokasi, latitude, longitude, estimasi_dimensi, file_surat_permohonan]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM PU disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 10. SPM SOSIAL
// ============================================================

app.get('/api/spm/sosial', async (req, res) => {
    try {
        const { kader_id, status_pengajuan, kategori_sasaran } = req.query;
        let q = 'SELECT * FROM spm_sosial WHERE 1=1';
        const p = [];
        if (kader_id)         { p.push(kader_id);         q += ` AND kader_id=$${p.length}`; }
        if (status_pengajuan) { p.push(status_pengajuan);  q += ` AND status_pengajuan=$${p.length}`; }
        if (kategori_sasaran) { p.push(kategori_sasaran);  q += ` AND kategori_sasaran=$${p.length}`; }
        q += ' ORDER BY tgl_pengajuan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

app.get('/api/spm/sosial/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_sosial WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/sosial', async (req, res) => {
    try {
        const { keluarga_id, kader_id, tgl_pengajuan, kategori_sasaran, nik_sasaran,
                nama_sasaran, penjelasan_kondisi, bantuan_mendesak, latitude, longitude,
                file_identitas_sasaran, file_sk_desa } = req.body;
        if (!kader_id || !kategori_sasaran || !penjelasan_kondisi) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_sosial (keluarga_id, kader_id, tgl_pengajuan, kategori_sasaran, nik_sasaran,
             nama_sasaran, penjelasan_kondisi, bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             kategori_sasaran, nik_sasaran, nama_sasaran, penjelasan_kondisi,
             bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Sosial disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 11. SPM TRANTIBUM
// ============================================================

app.get('/api/spm/trantibum', async (req, res) => {
    try {
        const { kader_id, status_pengajuan, kategori_laporan } = req.query;
        let q = 'SELECT * FROM spm_trantibum WHERE 1=1';
        const p = [];
        if (kader_id)         { p.push(kader_id);         q += ` AND kader_id=$${p.length}`; }
        if (status_pengajuan) { p.push(status_pengajuan);  q += ` AND status_pengajuan=$${p.length}`; }
        if (kategori_laporan) { p.push(kategori_laporan);  q += ` AND kategori_laporan=$${p.length}`; }
        q += ' ORDER BY tgl_pengajuan DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

app.get('/api/spm/trantibum/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_trantibum WHERE id=$1', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/trantibum', async (req, res) => {
    try {
        const { kader_id, tgl_pengajuan, waktu_kejadian, kategori_laporan, detail_kejadian,
                latitude, longitude, is_anonim, nama_pelapor, no_kontak_pelapor,
                file_ktp_pelapor, estimasi_korban, estimasi_kerugian } = req.body;
        if (!kader_id || !kategori_laporan || !detail_kejadian) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_trantibum (kader_id, tgl_pengajuan, waktu_kejadian, kategori_laporan, detail_kejadian,
             latitude, longitude, is_anonim, nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0], waktu_kejadian,
             kategori_laporan, detail_kejadian, latitude, longitude, is_anonim || 0,
             nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian]
        );
        ok(res, { id: rows[0].id, message: 'Pengaduan Trantibum disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 12. MASTER PENGAJUAN SPM
// ============================================================

// GET /api/pengajuan?kader_id=&status=&jenis_spm=
app.get('/api/pengajuan', async (req, res) => {
    try {
        const { kader_id, status, jenis_spm, limit = 50 } = req.query;
        let q = `
            SELECT p.*, k.no_kk, a.nama_lengkap AS nama_kepala_keluarga
            FROM pengajuan_spm p
            LEFT JOIN keluarga k ON k.id = p.keluarga_id
            LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
            WHERE 1=1`;
        const params = [];
        if (kader_id)  { params.push(kader_id);   q += ` AND p.kader_id=$${params.length}`; }
        if (status)    { params.push(status);       q += ` AND p.status=$${params.length}`; }
        if (jenis_spm) { params.push(jenis_spm);    q += ` AND p.jenis_spm=$${params.length}`; }
        params.push(parseInt(limit));
        q += ` ORDER BY p.created_at DESC LIMIT $${params.length}`;
        const { rows } = await pool.query(q, params);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/pengajuan/:id
app.get('/api/pengajuan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            `SELECT p.*, k.no_kk, a.nama_lengkap AS nama_kepala_keluarga
             FROM pengajuan_spm p
             LEFT JOIN keluarga k ON k.id = p.keluarga_id
             LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga'
             WHERE p.id=$1`, [req.params.id]
        );
        if (!rows.length) return err(res, 'Pengajuan tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// POST /api/pengajuan
app.post('/api/pengajuan', async (req, res) => {
    try {
        const { kader_id, keluarga_id, jenis_spm, ref_id } = req.body;
        if (!kader_id || !jenis_spm || !ref_id) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO pengajuan_spm (kader_id, keluarga_id, jenis_spm, ref_id) VALUES ($1,$2,$3,$4) RETURNING id, kode_pengajuan`,
            [kader_id, keluarga_id, jenis_spm, ref_id]
        );
        ok(res, { id: rows[0].id, kode_pengajuan: rows[0].kode_pengajuan, message: 'Pengajuan SPM dicatat' }, 201);
    } catch (e) { err(res, e.message); }
});

// PUT /api/pengajuan/:id/status
app.put('/api/pengajuan/:id/status', async (req, res) => {
    try {
        const { status, catatan, updated_by } = req.body;
        if (!status) return err(res, 'Status wajib diisi', 400);
        const result = await pool.query(
            `UPDATE pengajuan_spm SET status=$1, catatan=$2, updated_by=$3 WHERE id=$4`,
            [status, catatan, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Pengajuan tidak ditemukan', 404);
        ok(res, { message: 'Status pengajuan diperbarui' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 13. LAPORAN & ANALITIK
// ============================================================

// GET /api/laporan/dashboard?kader_id=&bulan=&tahun=
app.get('/api/laporan/dashboard', async (req, res) => {
    try {
        const { kader_id, bulan, tahun } = req.query;
        const now = new Date();
        const b = bulan || (now.getMonth() + 1);
        const t = tahun || now.getFullYear();
        const p = kader_id ? [kader_id, b, t] : [b, t];
        const filterKader = kader_id ? 'AND p.kader_id=$1' : '';
        const offset      = kader_id ? 1 : 0;

        const [distribusi, ringkasanRt, keluargaAbsen] = await Promise.all([
            pool.query(
                `SELECT jenis_spm, status, COUNT(*) AS total FROM pengajuan_spm p
                 WHERE 1=1 ${filterKader}
                 AND EXTRACT(MONTH FROM p.created_at)=$${1+offset}
                 AND EXTRACT(YEAR  FROM p.created_at)=$${2+offset}
                 GROUP BY jenis_spm, status ORDER BY jenis_spm`, p
            ),
            pool.query(
                `SELECT k.rt,
                 COUNT(DISTINCT k.id)   AS jumlah_keluarga,
                 COUNT(DISTINCT an.id)  AS jumlah_anggota,
                 SUM(CASE WHEN k.status_kesejahteraan='pra_sejahtera' THEN 1 ELSE 0 END) AS pra_sejahtera,
                 SUM(CASE WHEN k.status_asuransi='tidak_memiliki'     THEN 1 ELSE 0 END) AS tanpa_bpjs
                 FROM keluarga k
                 LEFT JOIN anggota_keluarga an ON an.keluarga_id=k.id
                 WHERE k.is_aktif=1 ${kader_id ? 'AND k.kader_id=$1' : ''}
                 GROUP BY k.rt ORDER BY k.rt`, kader_id ? [kader_id] : []
            ),
            pool.query(
                `SELECT k.no_kk, a.nama_lengkap AS kepala_keluarga, k.rt, k.rw,
                 MAX(kj.tgl_kunjungan) AS kunjungan_terakhir
                 FROM keluarga k
                 JOIN anggota_keluarga a ON a.keluarga_id=k.id AND a.status_keluarga='kepala_keluarga'
                 LEFT JOIN kunjungan_posyandu kj ON kj.keluarga_id=k.id
                 WHERE k.is_aktif=1 ${kader_id ? 'AND k.kader_id=$1' : ''}
                 GROUP BY k.id, k.no_kk, a.nama_lengkap, k.rt, k.rw
                 HAVING MAX(kj.tgl_kunjungan) IS NULL
                    OR MAX(kj.tgl_kunjungan) < CURRENT_DATE - INTERVAL '3 months'
                 ORDER BY kunjungan_terakhir`, kader_id ? [kader_id] : []
            )
        ]);

        ok(res, {
            distribusi_spm:    distribusi.rows,
            ringkasan_per_rt:  ringkasanRt.rows,
            keluarga_absen_3bln: keluargaAbsen.rows,
        });
    } catch (e) { err(res, e.message); }
});

// GET /api/laporan/gizi?bulan=&tahun=&kader_id=
app.get('/api/laporan/gizi', async (req, res) => {
    try {
        const { bulan, tahun, kader_id } = req.query;
        const now = new Date();
        const b = bulan || (now.getMonth() + 1);
        const t = tahun || now.getFullYear();
        const p = kader_id ? [b, t, kader_id] : [b, t];
        const { rows } = await pool.query(
            `SELECT a.nama_lengkap,
             (EXTRACT(YEAR FROM AGE(sk.tgl_pelayanan, a.tanggal_lahir))*12 +
              EXTRACT(MONTH FROM AGE(sk.tgl_pelayanan, a.tanggal_lahir))) AS umur_bulan,
             sk.berat_badan, sk.tinggi_badan, sk.status_kms, sk.tgl_pelayanan, k.rt, k.rw,
             CASE sk.status_kms
               WHEN 'merah'  THEN 'GIZI BURUK - Rujuk Puskesmas Segera'
               WHEN 'kuning' THEN 'BGM - Perlu PMT Pemulihan'
               WHEN 'hijau'  THEN 'Normal'
             END AS rekomendasi
             FROM spm_kesehatan sk
             JOIN anggota_keluarga a ON a.id=sk.anggota_id
             JOIN keluarga k         ON k.id=sk.keluarga_id
             WHERE sk.jenis_sasaran='balita'
             AND EXTRACT(MONTH FROM sk.tgl_pelayanan)=$1
             AND EXTRACT(YEAR  FROM sk.tgl_pelayanan)=$2
             ${kader_id ? 'AND sk.kader_id=$3' : ''}
             ORDER BY sk.status_kms, a.nama_lengkap`, p
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/laporan/bumil-kek?kader_id=
app.get('/api/laporan/bumil-kek', async (req, res) => {
    try {
        const { kader_id } = req.query;
        const p = kader_id ? [kader_id] : [];
        const { rows } = await pool.query(
            `SELECT a.nama_lengkap, a.tanggal_lahir, sk.usia_kehamilan_mgg,
             sk.tekanan_darah, sk.lingkar_lengan_cm, sk.tgl_pelayanan, k.rt, k.rw,
             CASE WHEN sk.lingkar_lengan_cm < 23.5 THEN 'BERISIKO KEK' ELSE 'Normal' END AS status_kek
             FROM spm_kesehatan sk
             JOIN anggota_keluarga a ON a.id=sk.anggota_id
             JOIN keluarga k         ON k.id=sk.keluarga_id
             WHERE sk.jenis_sasaran='bumil'
             AND sk.tgl_pelayanan >= CURRENT_DATE - INTERVAL '3 months'
             ${kader_id ? 'AND sk.kader_id=$1' : ''}
             ORDER BY sk.lingkar_lengan_cm ASC`, p
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 14. PROFIL KADER
// ============================================================

// GET /api/profil/:id
app.get('/api/profil/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT id, nama_lengkap, nik, email, no_hp, rw, rt, desa, kecamatan, kabupaten, role, foto_profil, created_at FROM users WHERE id=$1',
            [req.params.id]
        );
        if (!rows.length) return err(res, 'Profil tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/profil/:id
app.put('/api/profil/:id', async (req, res) => {
    try {
        const { nama_lengkap, email, no_hp, rw, rt, desa, kecamatan, kabupaten, foto_profil } = req.body;
        const result = await pool.query(
            `UPDATE users SET nama_lengkap=$1, email=$2, no_hp=$3, rw=$4, rt=$5, desa=$6, kecamatan=$7, kabupaten=$8, foto_profil=$9 WHERE id=$10`,
            [nama_lengkap, email, no_hp, rw, rt, desa, kecamatan, kabupaten, foto_profil, req.params.id]
        );
        if (!result.rowCount) return err(res, 'User tidak ditemukan', 404);
        ok(res, { message: 'Profil diperbarui' });
    } catch (e) { err(res, e.message); }
});

// PUT /api/profil/:id/password
app.put('/api/profil/:id/password', async (req, res) => {
    try {
        const { password_lama, password_baru } = req.body;
        if (!password_lama || !password_baru) return err(res, 'Password lama dan baru wajib diisi', 400);
        // NOTE: Di produksi gunakan bcrypt.compare dan bcrypt.hash
        const { rows } = await pool.query('SELECT id FROM users WHERE id=$1 AND password=$2', [req.params.id, password_lama]);
        if (!rows.length) return err(res, 'Password lama tidak cocok', 401);
        await pool.query('UPDATE users SET password=$1 WHERE id=$2', [password_baru, req.params.id]);
        ok(res, { message: 'Password berhasil diperbarui' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 15. VIEWS & REKAP (ADMIN)
// ============================================================

// GET /api/view/keluarga-lengkap?rt=
app.get('/api/view/keluarga-lengkap', async (req, res) => {
    try {
        const { rt } = req.query;
        const p = rt ? [rt] : [];
        const q = `SELECT * FROM v_keluarga_lengkap ${rt ? 'WHERE rt=$1' : ''} ORDER BY nama_kk`;
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/users  (admin only)
app.get('/api/users', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT id, nama_lengkap, nik, email, no_hp, role, rw, rt, is_active, created_at FROM users ORDER BY nama_lengkap');
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// PUT /api/users/:id/toggle-active  (admin)
app.put('/api/users/:id/toggle-active', async (req, res) => {
    try {
        const result = await pool.query('UPDATE users SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END WHERE id=$1 RETURNING is_active', [req.params.id]);
        if (!result.rowCount) return err(res, 'User tidak ditemukan', 404);
        ok(res, { is_active: result.rows[0].is_active });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// START SERVER
// ============================================================
app.listen(PORT, () => {
    console.log(`🚀 Server Sipandu Bedas berjalan di http://localhost:${PORT}`);
    console.log('📌 Endpoint tersedia:');
    console.log('   AUTH      → POST /api/auth/login|register|forgot-password');
    console.log('   DASHBOARD → GET  /api/dashboard');
    console.log('   KELUARGA  → CRUD /api/keluarga');
    console.log('   ANGGOTA   → CRUD /api/anggota');
    console.log('   KUNJUNGAN → CRUD /api/kunjungan');
    console.log('   SPM       → CRUD /api/spm/{kesehatan|pendidikan|perumahan|pu|sosial|trantibum}');
    console.log('   PENGAJUAN → CRUD /api/pengajuan');
    console.log('   LAPORAN   → GET  /api/laporan/{dashboard|gizi|bumil-kek}');
    console.log('   PROFIL    → GET/PUT /api/profil/:id');
    console.log('   VIEWS     → GET  /api/view/keluarga-lengkap');
});
