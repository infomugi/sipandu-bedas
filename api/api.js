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
const requiredEnvVars = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error(`❌ FATAL ERROR: Missing required database environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const pool = new Pool({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect()
    .then(c => { console.log('✅ Koneksi PostgreSQL berhasil'); c.release(); })
    .catch(e => console.error('❌ Koneksi DB gagal:', e.message));

// ─── Helper ───────────────────────────────────────────────────
const ok  = (res, data, code = 200) => res.status(code).json({ success: true,  data });
const err = (res, msg,  code = 500) => res.status(code).json({ success: false, message: msg });

// 🛡️ Sentinel: Add authentication middleware for admin endpoints
const isAdmin = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    // In a real application, this should verify a JWT or session token.
    // For now, it checks the mock token format returned by the login endpoint.
    if (!authHeader || !authHeader.startsWith('Bearer mock-token-')) {
        return err(res, 'Unauthorized', 401);
    }

    // Extract the user ID from the mock token.
    // ⚠️ Security Note: This is insecure for production and must be replaced with true token validation.
    const userId = authHeader.split('mock-token-')[1];
    try {
        const { rows } = await pool.query('SELECT role FROM users WHERE id = $1 AND is_active = 1 AND deleted_at IS NULL', [userId]);
        if (rows.length === 0 || rows[0].role !== 'admin') {
            return err(res, 'Forbidden: Admin access required', 403);
        }
        next();
    } catch (e) {
        // 🛡️ Sentinel: Do not expose internal database error details
        console.error('Authorization error:', e);
        err(res, 'Internal Server Error', 500);
    }
};

// ============================================================
// 1. AUTH
// ============================================================

// POST /api/auth/login
app.post('/api/auth/login', async (req, res) => {
    try {
        const { nik, password } = req.body;
        if (!nik || !password) return err(res, 'NIK dan password wajib diisi', 400);
        const { rows } = await pool.query(
            'SELECT id, nama_lengkap, nik, email, no_hp, password, role, rw, rt, desa, kecamatan, foto_profil, is_active FROM users WHERE nik = $1 AND deleted_at IS NULL',
            [nik]
        );
        if (rows.length === 0) return err(res, 'NIK tidak ditemukan', 401);
        if (!rows[0].is_active) return err(res, 'Akun tidak aktif', 403);
        // NOTE: Di produksi gunakan bcrypt.compare(password, rows[0].password)
        if (password !== rows[0].password) return err(res, 'Password salah', 401); // 🛡️ Sentinel: Fix authentication bypass

        const user = { ...rows[0] };
        delete user.password; // 🛡️ Sentinel: Don't leak password

        ok(res, { user, token: `mock-token-${user.id}` });
    } catch (e) { err(res, e.message); }
});

// POST /api/auth/register
app.post('/api/auth/register', async (req, res) => {
    try {
        // 🛡️ Sentinel: Removed 'role' from req.body to prevent mass assignment privilege escalation.
        // Users should never be able to register as 'admin'.
        const { nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, created_by } = req.body;
        if (!nama_lengkap || !nik || !password || !no_hp) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO users (nama_lengkap, nik, email, no_hp, password, rw, rt, desa, kecamatan, kabupaten, role, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id, nama_lengkap, nik, role`,
            [nama_lengkap, nik, email, no_hp, password, rw, rt,
             desa || 'RANCAMANYAR', kecamatan || 'BALEENDAH', kabupaten || 'BANDUNG', 'kader', created_by]
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
            pool.query('SELECT COUNT(*) FROM keluarga WHERE kader_id=$1 AND is_aktif=1 AND deleted_at IS NULL', [kader_id]),
            pool.query('SELECT COUNT(*) FROM kunjungan_posyandu WHERE kader_id=$1 AND bulan=$2 AND tahun=$3 AND deleted_at IS NULL', [kader_id, bulan, tahun]),
            pool.query('SELECT COUNT(*) FROM pengajuan_spm WHERE kader_id=$1 AND status=\'menunggu_validasi_desa\' AND deleted_at IS NULL', [kader_id]),
            pool.query(
                `SELECT jenis_spm, COUNT(*) AS total FROM pengajuan_spm
                 WHERE kader_id=$1 AND EXTRACT(MONTH FROM created_at)=$2 AND EXTRACT(YEAR FROM created_at)=$3 AND deleted_at IS NULL
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
        // ⚡ Bolt Optimization: Replaced multiple LEFT JOINs with correlated subqueries
        // to prevent Cartesian product explosion (M members * V visits per family).
        // This reduces time complexity from O(N * M * V) to O(N) and eliminates the need for GROUP BY.
        let query = `
            SELECT k.*, a.nama_lengkap AS nama_kepala_keluarga, a.nik AS nik_kepala_keluarga,
                   (SELECT COUNT(id) FROM anggota_keluarga WHERE keluarga_id = k.id AND deleted_at IS NULL) AS jumlah_anggota,
                   (SELECT MAX(tgl_kunjungan) FROM kunjungan_posyandu WHERE keluarga_id = k.id AND deleted_at IS NULL) AS kunjungan_terakhir
            FROM keluarga k
            LEFT JOIN anggota_keluarga a  ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga' AND a.deleted_at IS NULL
            WHERE k.is_aktif = 1 AND k.deleted_at IS NULL`;
        const params = [];
        if (kader_id) { params.push(kader_id); query += ` AND k.kader_id = $${params.length}`; }
        if (search) {
            params.push(`%${search}%`);
            query += ` AND (k.no_kk ILIKE $${params.length} OR a.nama_lengkap ILIKE $${params.length} OR a.nik ILIKE $${params.length})`;
        }
        query += ' ORDER BY a.nama_lengkap';
        const { rows } = await pool.query(query, params);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// GET /api/keluarga/:id  (detail + anggota)
app.get('/api/keluarga/:id', async (req, res) => {
    try {
        const { rows: kRows } = await pool.query('SELECT * FROM keluarga WHERE id=$1 AND is_aktif=1 AND deleted_at IS NULL', [req.params.id]);
        if (!kRows.length) return err(res, 'Keluarga tidak ditemukan', 404);
        const { rows: aRows } = await pool.query('SELECT * FROM anggota_keluarga WHERE keluarga_id=$1 AND is_aktif=1 AND deleted_at IS NULL ORDER BY status_keluarga', [req.params.id]);
        ok(res, { ...kRows[0], anggota: aRows });
    } catch (e) { err(res, e.message); }
});

// POST /api/keluarga
app.post('/api/keluarga', async (req, res) => {
    try {
        const { no_kk, kader_id, alamat_lengkap, rt, rw, desa, kecamatan, kabupaten,
                status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran, created_by } = req.body;
        if (!no_kk || !kader_id || !tgl_pendaftaran) return err(res, 'no_kk, kader_id, tgl_pendaftaran wajib', 400);
        const { rows } = await pool.query(
            `INSERT INTO keluarga (no_kk, kader_id, alamat_lengkap, rt, rw, desa, kecamatan, kabupaten,
             status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
            [no_kk, kader_id, alamat_lengkap, rt, rw,
             desa || 'RANCAMANYAR', kecamatan || 'BALEENDAH', kabupaten || 'BANDUNG',
             status_kesejahteraan || 'pra_sejahtera', status_asuransi || 'tidak_memiliki',
             pekerjaan_kk, estimasi_pendapatan, tgl_pendaftaran, created_by]
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
        const { alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE keluarga SET alamat_lengkap=$1, rt=$2, rw=$3, status_kesejahteraan=$4,
             status_asuransi=$5, pekerjaan_kk=$6, estimasi_pendapatan=$7, updated_by=$8 WHERE id=$9 AND deleted_at IS NULL`,
            [alamat_lengkap, rt, rw, status_kesejahteraan, status_asuransi, pekerjaan_kk, estimasi_pendapatan, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Keluarga tidak ditemukan', 404);
        ok(res, { message: 'Keluarga diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/keluarga/:id  (soft delete)
app.delete('/api/keluarga/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE keluarga SET is_aktif=0, deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Keluarga tidak ditemukan', 404);
        ok(res, { message: 'Keluarga dinonaktifkan (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 4. ANGGOTA KELUARGA
// ============================================================

// GET /api/keluarga/:keluarga_id/anggota
app.get('/api/keluarga/:keluarga_id/anggota', async (req, res) => {
    try {
        // ⚡ Bolt Optimization: Compute expensive AGE() and EXTRACT() functions exactly once
        // inside a subquery, then reference their aliases in the outer query to prevent duplicate computations.
        const { rows } = await pool.query(
            `SELECT *,
             (umur_tahun * 12 + umur_bulan_mod) AS umur_bulan_total,
             CASE
               WHEN (umur_tahun * 12 + umur_bulan_mod) BETWEEN 0 AND 59 THEN 'balita'
               WHEN jenis_kelamin = 'P' AND umur_tahun BETWEEN 15 AND 49 THEN 'pus'
               WHEN umur_tahun >= 60 THEN 'lansia'
               ELSE 'umum'
             END AS kategori_posyandu
             FROM (
                 SELECT *,
                 EXTRACT(YEAR FROM AGE(CURRENT_DATE, tanggal_lahir))  AS umur_tahun,
                 EXTRACT(MONTH FROM AGE(CURRENT_DATE, tanggal_lahir)) AS umur_bulan_mod
                 FROM anggota_keluarga
                 WHERE keluarga_id=$1 AND is_aktif=1 AND deleted_at IS NULL
             ) sub
             ORDER BY status_keluarga`,
            [req.params.keluarga_id]
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// POST /api/anggota
app.post('/api/anggota', async (req, res) => {
    try {
        const { keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir, tempat_lahir,
                status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan, created_by } = req.body;
        if (!keluarga_id || !nik || !nama_lengkap || !jenis_kelamin || !tanggal_lahir) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO anggota_keluarga (keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir,
             tempat_lahir, status_keluarga, status_asuransi, pendidikan_terakhir, pekerjaan, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
            [keluarga_id, nik, nama_lengkap, jenis_kelamin, tanggal_lahir,
             tempat_lahir, status_keluarga || 'anak', status_asuransi, pendidikan_terakhir, pekerjaan, created_by]
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
                status_asuransi, pendidikan_terakhir, pekerjaan, is_aktif, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE anggota_keluarga SET nama_lengkap=$1, jenis_kelamin=$2, tanggal_lahir=$3,
             status_keluarga=$4, status_asuransi=$5, pendidikan_terakhir=$6, pekerjaan=$7, is_aktif=$8, updated_by=$9 WHERE id=$10 AND deleted_at IS NULL`,
            [nama_lengkap, jenis_kelamin, tanggal_lahir, status_keluarga,
             status_asuransi, pendidikan_terakhir, pekerjaan, is_aktif ?? 1, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Anggota tidak ditemukan', 404);
        ok(res, { message: 'Anggota diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/anggota/:id  (soft delete)
app.delete('/api/anggota/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE anggota_keluarga SET is_aktif=0, deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Anggota tidak ditemukan', 404);
        ok(res, { message: 'Anggota dinonaktifkan (soft delete)' });
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
        const { keluarga_id, kader_id, tgl_kunjungan, catatan, no_hp_pendaftar, foto_kk, foto_warga, latitude, longitude, created_by } = req.body;
        if (!keluarga_id || !kader_id || !tgl_kunjungan) return err(res, 'Field wajib tidak lengkap', 400);
        const d = new Date(tgl_kunjungan);
        const { rows } = await pool.query(
            `INSERT INTO kunjungan_posyandu (keluarga_id, kader_id, tgl_kunjungan, bulan, tahun, catatan, no_hp_pendaftar, foto_kk, foto_warga, latitude, longitude, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [keluarga_id, kader_id, tgl_kunjungan, d.getMonth() + 1, d.getFullYear(), catatan, no_hp_pendaftar, foto_kk, foto_warga, latitude, longitude, created_by]
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
                 JOIN anggota_keluarga a ON a.id=sk.anggota_id WHERE sk.deleted_at IS NULL`;
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
                berat_badan, tinggi_badan, lingkar_kepala_cm, status_kms, jenis_imunisasi, terima_vitamin_a,
                terima_obat_cacing, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm,
                catatan_tindak_lanjut, ajukan_bantuan, nik, keterangan, latitude, longitude, created_by } = req.body;
        if (!keluarga_id || !anggota_id || !kader_id || !tgl_pelayanan || !jenis_sasaran) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_kesehatan (keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran,
             berat_badan, tinggi_badan, lingkar_kepala_cm, status_kms, jenis_imunisasi, terima_vitamin_a, terima_obat_cacing,
             usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm, catatan_tindak_lanjut, ajukan_bantuan, nik, keterangan, latitude, longitude, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22) RETURNING id`,
            [keluarga_id, anggota_id, kader_id, tgl_pelayanan, jenis_sasaran,
             berat_badan, tinggi_badan, lingkar_kepala_cm, status_kms, jenis_imunisasi, terima_vitamin_a || 0,
             terima_obat_cacing || 0, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm,
             catatan_tindak_lanjut, ajukan_bantuan || 0, nik, keterangan, latitude, longitude, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Data SPM Kesehatan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/spm/kesehatan/:id
app.get('/api/spm/kesehatan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT sk.*, a.nama_lengkap AS nama_anggota FROM spm_kesehatan sk JOIN anggota_keluarga a ON a.id=sk.anggota_id WHERE sk.id=$1 AND sk.deleted_at IS NULL',
            [req.params.id]
        );
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/kesehatan/:id
app.put('/api/spm/kesehatan/:id', async (req, res) => {
    try {
        const { berat_badan, tinggi_badan, lingkar_kepala_cm, status_kms, jenis_imunisasi, terima_vitamin_a, terima_obat_cacing, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm, catatan_tindak_lanjut, ajukan_bantuan, nik, keterangan, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_kesehatan SET berat_badan=$1, tinggi_badan=$2, lingkar_kepala_cm=$3, status_kms=$4, jenis_imunisasi=$5, terima_vitamin_a=$6, terima_obat_cacing=$7, usia_kehamilan_mgg=$8, tekanan_darah=$9, lingkar_lengan_cm=$10, catatan_tindak_lanjut=$11, ajukan_bantuan=$12, nik=$13, keterangan=$14, updated_by=$15 WHERE id=$16 AND deleted_at IS NULL`,
            [berat_badan, tinggi_badan, lingkar_kepala_cm, status_kms, jenis_imunisasi, terima_vitamin_a, terima_obat_cacing, usia_kehamilan_mgg, tekanan_darah, lingkar_lengan_cm, catatan_tindak_lanjut, ajukan_bantuan, nik, keterangan, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Kesehatan diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/kesehatan/:id
app.delete('/api/spm/kesehatan/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_kesehatan SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Kesehatan dihapus (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 7. SPM PENDIDIKAN
// ============================================================

app.get('/api/spm/pendidikan', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT sp.*, a.nama_lengkap AS nama_anak FROM spm_pendidikan sp JOIN anggota_keluarga a ON a.id=sp.anggota_id WHERE sp.deleted_at IS NULL';
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
                kelas, nama_institusi, jenis_bantuan, keterangan_alasan, nik, keterangan, file_bukti, latitude, longitude, created_by } = req.body;
        if (!keluarga_id || !anggota_id || !kader_id || !jenjang_pendidikan || !jenis_bantuan || !keterangan_alasan) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_pendidikan (keluarga_id, anggota_id, kader_id, tgl_pengajuan, jenjang_pendidikan,
             kelas, nama_institusi, jenis_bantuan, keterangan_alasan, nik, keterangan, file_bukti, latitude, longitude, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [keluarga_id, anggota_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             jenjang_pendidikan, kelas, nama_institusi, jenis_bantuan, keterangan_alasan, nik, keterangan, file_bukti, latitude, longitude, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Pendidikan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/spm/pendidikan/:id
app.get('/api/spm/pendidikan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query(
            'SELECT sp.*, a.nama_lengkap AS nama_anak FROM spm_pendidikan sp JOIN anggota_keluarga a ON a.id=sp.anggota_id WHERE sp.id=$1 AND sp.deleted_at IS NULL',
            [req.params.id]
        );
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/pendidikan/:id
app.put('/api/spm/pendidikan/:id', async (req, res) => {
    try {
        const { jenjang_pendidikan, kelas, nama_institusi, jenis_bantuan, keterangan_alasan, nik, keterangan, file_bukti, latitude, longitude, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_pendidikan SET jenjang_pendidikan=$1, kelas=$2, nama_institusi=$3, jenis_bantuan=$4, keterangan_alasan=$5, nik=$6, keterangan=$7, file_bukti=$8, latitude=$9, longitude=$10, updated_by=$11 WHERE id=$12 AND deleted_at IS NULL`,
            [jenjang_pendidikan, kelas, nama_institusi, jenis_bantuan, keterangan_alasan, nik, keterangan, file_bukti, latitude, longitude, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Pendidikan diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/pendidikan/:id
app.delete('/api/spm/pendidikan/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_pendidikan SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Pendidikan dihapus (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 8. SPM PERUMAHAN
// ============================================================

app.get('/api/spm/perumahan', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT * FROM spm_perumahan WHERE deleted_at IS NULL';
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
                pernyataan_belum_pernah_terima, nik, keterangan, file_ktp, file_kk, created_by } = req.body;
        if (!keluarga_id || !kader_id) return err(res, 'keluarga_id dan kader_id wajib', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_perumahan (keluarga_id, kader_id, tgl_pengajuan, latitude, longitude,
             status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai, pernyataan_belum_pernah_terima, nik, keterangan, file_ktp, file_kk, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             latitude, longitude, status_kepemilikan_lahan, jenis_atap, jenis_dinding,
             jenis_lantai, pernyataan_belum_pernah_terima || 0, nik, keterangan, file_ktp, file_kk, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Perumahan disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/spm/perumahan/:id
app.get('/api/spm/perumahan/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_perumahan WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/perumahan/:id
app.put('/api/spm/perumahan/:id', async (req, res) => {
    try {
        const { latitude, longitude, status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai, pernyataan_belum_pernah_terima, nik, keterangan, file_ktp, file_kk, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_perumahan SET latitude=$1, longitude=$2, status_kepemilikan_lahan=$3, jenis_atap=$4, jenis_dinding=$5, jenis_lantai=$6, pernyataan_belum_pernah_terima=$7, nik=$8, keterangan=$9, file_ktp=$10, file_kk=$11, updated_by=$12 WHERE id=$13 AND deleted_at IS NULL`,
            [latitude, longitude, status_kepemilikan_lahan, jenis_atap, jenis_dinding, jenis_lantai, pernyataan_belum_pernah_terima || 0, nik, keterangan, file_ktp, file_kk, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Perumahan diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/perumahan/:id
app.delete('/api/spm/perumahan/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_perumahan SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Perumahan dihapus (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 9. SPM PU (PEKERJAAN UMUM)
// ============================================================

app.get('/api/spm/pu', async (req, res) => {
    try {
        const { kader_id, status_pengajuan } = req.query;
        let q = 'SELECT * FROM spm_pu WHERE deleted_at IS NULL';
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
                detail_lokasi, nik, keterangan, latitude, longitude, estimasi_dimensi, file_surat_permohonan, created_by } = req.body;
        if (!keluarga_id || !kader_id || !jenis_kebutuhan || !detail_lokasi) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_pu (keluarga_id, kader_id, tgl_pengajuan, jenis_kebutuhan, detail_lokasi, nik, keterangan, latitude, longitude, estimasi_dimensi, file_surat_permohonan, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             jenis_kebutuhan, detail_lokasi, nik, keterangan, latitude, longitude, estimasi_dimensi, file_surat_permohonan, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM PU disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/spm/pu/:id
app.get('/api/spm/pu/:id', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM spm_pu WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/pu/:id
app.put('/api/spm/pu/:id', async (req, res) => {
    try {
        const { jenis_kebutuhan, detail_lokasi, nik, keterangan, latitude, longitude, estimasi_dimensi, file_surat_permohonan, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_pu SET jenis_kebutuhan=$1, detail_lokasi=$2, nik=$3, keterangan=$4, latitude=$5, longitude=$6, estimasi_dimensi=$7, file_surat_permohonan=$8, updated_by=$9 WHERE id=$10 AND deleted_at IS NULL`,
            [jenis_kebutuhan, detail_lokasi, nik, keterangan, latitude, longitude, estimasi_dimensi, file_surat_permohonan, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM PU diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/pu/:id
app.delete('/api/spm/pu/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_pu SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM PU dihapus (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 10. SPM SOSIAL
// ============================================================

app.get('/api/spm/sosial', async (req, res) => {
    try {
        const { kader_id, status_pengajuan, kategori_sasaran } = req.query;
        let q = 'SELECT * FROM spm_sosial WHERE deleted_at IS NULL';
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
        const { rows } = await pool.query('SELECT * FROM spm_sosial WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/sosial', async (req, res) => {
    try {
        const { keluarga_id, kader_id, tgl_pengajuan, kategori_sasaran, nik_sasaran,
                nama_sasaran, penjelasan_kondisi, keterangan, bantuan_mendesak, latitude, longitude,
                file_identitas_sasaran, file_sk_desa, created_by } = req.body;
        if (!kader_id || !kategori_sasaran || !penjelasan_kondisi) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_sosial (keluarga_id, kader_id, tgl_pengajuan, kategori_sasaran, nik_sasaran,
             nama_sasaran, penjelasan_kondisi, keterangan, bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING id`,
            [keluarga_id, kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0],
             kategori_sasaran, nik_sasaran, nama_sasaran, penjelasan_kondisi, keterangan,
             bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pengajuan SPM Sosial disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/sosial/:id
app.put('/api/spm/sosial/:id', async (req, res) => {
    try {
        const { kategori_sasaran, nik_sasaran, nama_sasaran, penjelasan_kondisi, keterangan, bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_sosial SET kategori_sasaran=$1, nik_sasaran=$2, nama_sasaran=$3, penjelasan_kondisi=$4, keterangan=$5, bantuan_mendesak=$6, latitude=$7, longitude=$8, file_identitas_sasaran=$9, file_sk_desa=$10, updated_by=$11 WHERE id=$12 AND deleted_at IS NULL`,
            [kategori_sasaran, nik_sasaran, nama_sasaran, penjelasan_kondisi, keterangan, bantuan_mendesak, latitude, longitude, file_identitas_sasaran, file_sk_desa, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Sosial diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/sosial/:id
app.delete('/api/spm/sosial/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_sosial SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data SPM Sosial dihapus (soft delete)' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 11. SPM TRANTIBUM
// ============================================================

app.get('/api/spm/trantibum', async (req, res) => {
    try {
        const { kader_id, status_pengajuan, kategori_laporan } = req.query;
        let q = 'SELECT * FROM spm_trantibum WHERE deleted_at IS NULL';
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
        const { rows } = await pool.query('SELECT * FROM spm_trantibum WHERE id=$1 AND deleted_at IS NULL', [req.params.id]);
        if (!rows.length) return err(res, 'Data tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

app.post('/api/spm/trantibum', async (req, res) => {
    try {
        const { kader_id, tgl_pengajuan, waktu_kejadian, kategori_laporan, detail_kejadian,
                nik, keterangan, latitude, longitude, is_anonim, nama_pelapor, no_kontak_pelapor,
                file_ktp_pelapor, estimasi_korban, estimasi_kerugian, created_by } = req.body;
        if (!kader_id || !kategori_laporan || !detail_kejadian) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO spm_trantibum (kader_id, tgl_pengajuan, waktu_kejadian, kategori_laporan, detail_kejadian,
             nik, keterangan, latitude, longitude, is_anonim, nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING id`,
            [kader_id, tgl_pengajuan || new Date().toISOString().split('T')[0], waktu_kejadian,
             kategori_laporan, detail_kejadian, nik, keterangan, latitude, longitude, is_anonim || 0,
             nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pengaduan Trantibum disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// PUT /api/spm/trantibum/:id
app.put('/api/spm/trantibum/:id', async (req, res) => {
    try {
        const { waktu_kejadian, kategori_laporan, detail_kejadian, nik, keterangan, latitude, longitude, is_anonim, nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE spm_trantibum SET waktu_kejadian=$1, kategori_laporan=$2, detail_kejadian=$3, nik=$4, keterangan=$5, latitude=$6, longitude=$7, is_anonim=$8, nama_pelapor=$9, no_kontak_pelapor=$10, file_ktp_pelapor=$11, estimasi_korban=$12, estimasi_kerugian=$13, updated_by=$14 WHERE id=$15 AND deleted_at IS NULL`,
            [waktu_kejadian, kategori_laporan, detail_kejadian, nik, keterangan, latitude, longitude, is_anonim || 0, nama_pelapor, no_kontak_pelapor, file_ktp_pelapor, estimasi_korban, estimasi_kerugian, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data Trantibum diperbarui' });
    } catch (e) { err(res, e.message); }
});

// DELETE /api/spm/trantibum/:id
app.delete('/api/spm/trantibum/:id', async (req, res) => {
    try {
        const { deleted_by } = req.body;
        const result = await pool.query('UPDATE spm_trantibum SET deleted_at=NOW(), deleted_by=$1 WHERE id=$2', [deleted_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Data tidak ditemukan', 404);
        ok(res, { message: 'Data Trantibum dihapus (soft delete)' });
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
            LEFT JOIN keluarga k ON k.id = p.keluarga_id AND k.deleted_at IS NULL
            LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga' AND a.deleted_at IS NULL
            WHERE p.deleted_at IS NULL`;
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
             LEFT JOIN keluarga k ON k.id = p.keluarga_id AND k.deleted_at IS NULL
             LEFT JOIN anggota_keluarga a ON a.keluarga_id = k.id AND a.status_keluarga = 'kepala_keluarga' AND a.deleted_at IS NULL
             WHERE p.id=$1 AND p.deleted_at IS NULL`, [req.params.id]
        );
        if (!rows.length) return err(res, 'Pengajuan tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// GET /api/v1/riwayat/:id
app.get('/api/v1/riwayat/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // 1. Get fundamental pengajuan info
        const pengajuanQuery = `
            SELECT p.*, k.no_kk, u.nama_lengkap AS nama_kader,
                   CASE 
                     WHEN p.jenis_spm = 'sosial' THEN (SELECT nama_sasaran FROM spm_sosial WHERE id = p.ref_id)
                     WHEN p.jenis_spm = 'pendidikan' THEN (SELECT ak.nama_lengkap FROM spm_pendidikan sp JOIN anggota_keluarga ak ON ak.id = sp.anggota_id WHERE sp.id = p.ref_id)
                     WHEN p.jenis_spm = 'kesehatan' THEN (SELECT ak.nama_lengkap FROM spm_kesehatan sk JOIN anggota_keluarga ak ON ak.id = sk.anggota_id WHERE sk.id = p.ref_id)
                     ELSE (SELECT ak.nama_lengkap FROM anggota_keluarga ak WHERE ak.keluarga_id = p.keluarga_id AND ak.status_keluarga = 'kepala_keluarga' LIMIT 1)
                   END AS nama_sasaran,
                   CASE
                     WHEN p.jenis_spm = 'sosial' THEN (SELECT nik_sasaran FROM spm_sosial WHERE id = p.ref_id)
                     WHEN p.jenis_spm = 'pendidikan' THEN (SELECT ak.nik FROM spm_pendidikan sp JOIN anggota_keluarga ak ON ak.id = sp.anggota_id WHERE sp.id = p.ref_id)
                     WHEN p.jenis_spm = 'kesehatan' THEN (SELECT ak.nik FROM spm_kesehatan sk JOIN anggota_keluarga ak ON ak.id = sk.anggota_id WHERE sk.id = p.ref_id)
                     ELSE (SELECT ak.nik FROM anggota_keluarga ak WHERE ak.keluarga_id = p.keluarga_id AND ak.status_keluarga = 'kepala_keluarga' LIMIT 1)
                   END AS nik_sasaran
            FROM pengajuan_spm p
            LEFT JOIN keluarga k ON k.id = p.keluarga_id
            LEFT JOIN users u ON u.id = p.kader_id
            WHERE p.id = $1 AND p.deleted_at IS NULL
        `;
        
        const { rows: pRows } = await pool.query(pengajuanQuery, [id]);
        if (pRows.length === 0) return err(res, 'Data riwayat tidak ditemukan', 404);
        
        const data = pRows[0];
        
        // 2. Build Timeline
        const timeline = [];
        
        // Step 1: Pengajuan (Always exists if record found)
        timeline.push({
            title: 'Pengajuan Diterima',
            desc: 'Usulan telah berhasil dicatat oleh Kader.',
            time: data.created_at,
            status: 'success'
        });
        
        // Step 2: Validasi Desa
        const statusOrder = [
            'menunggu_validasi_desa',
            'menunggu_assesment',
            'menunggu_rtl_desa',
            'selesai_di_desa',
            'menunggu_validasi_kecamatan',
            'menunggu_validasi_kabupaten',
            'menunggu_rtl_dinas',
            'selesai_di_dinas'
        ];
        
        const currentStatusIdx = statusOrder.indexOf(data.status);
        
        // Helper to add timeline item based on status
        if (currentStatusIdx >= 1) {
            timeline.push({
                title: 'Validasi Desa',
                desc: 'Dokumen telah diverifikasi di tingkat Desa.',
                time: null, // In real app, fetch from audit logs/updated_at
                status: 'success'
            });
        }
        
        // Step 3: Assesment
        const { rows: aRows } = await pool.query('SELECT created_at, deskripsi_assesment FROM pengajuan_assesment WHERE pengajuan_id = $1', [id]);
        if (aRows.length > 0) {
            timeline.push({
                title: 'Assesment Lapangan',
                desc: aRows[0].deskripsi_assesment || 'Petugas telah melakukan kunjungan lapangan.',
                time: aRows[0].created_at,
                status: 'success'
            });
        } else if (data.status === 'menunggu_assesment') {
            timeline.push({
                title: 'Assesment Lapangan',
                desc: 'Petugas sedang menjadwalkan kunjungan lapangan.',
                time: 'Sedang diproses',
                status: 'process'
            });
        }
        
        // Step 4: Validasi Kecamatan
        if (currentStatusIdx >= 5) { // 'menunggu_validasi_kabupaten' or higher
             timeline.push({
                title: 'Validasi Kecamatan',
                desc: 'Rujukan telah disetujui oleh Kecamatan.',
                time: null,
                status: 'success'
            });
        } else if (data.status === 'menunggu_validasi_kecamatan') {
            timeline.push({
                title: 'Validasi Kecamatan',
                desc: 'Menunggu verifikasi dari tingkat Kecamatan.',
                time: 'Sedang diproses',
                status: 'process'
            });
        }
        
        // Step 5: Selesai
        if (data.status.startsWith('selesai')) {
            timeline.push({
                title: 'Selesai',
                desc: 'Hasil akhir dari pengajuan SPM telah ditetapkan.',
                time: data.updated_at,
                status: 'success'
            });
        } else {
             timeline.push({
                title: 'Selesai',
                desc: 'Hasil akhir dari pengajuan SPM.',
                time: null,
                status: 'pending'
            });
        }
        
        ok(res, {
            ...data,
            timeline
        });
        
    } catch (e) {
        err(res, e.message);
    }
});

// POST /api/pengajuan
app.post('/api/pengajuan', async (req, res) => {
    try {
        const { kader_id, keluarga_id, jenis_spm, ref_id, created_by } = req.body;
        if (!kader_id || !jenis_spm || !ref_id) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            `INSERT INTO pengajuan_spm (kader_id, keluarga_id, jenis_spm, ref_id, created_by) VALUES ($1,$2,$3,$4,$5) RETURNING id, kode_pengajuan`,
            [kader_id, keluarga_id, jenis_spm, ref_id, created_by]
        );
        ok(res, { id: rows[0].id, kode_pengajuan: rows[0].kode_pengajuan, message: 'Pengajuan SPM dicatat' }, 201);
    } catch (e) { err(res, e.message); }
});

// PUT /api/pengajuan/:id/validasi-desa
app.put('/api/pengajuan/:id/validasi-desa', async (req, res) => {
    try {
        const { updated_by } = req.body;
        const result = await pool.query("UPDATE pengajuan_spm SET status='menunggu_assesment', updated_by=$1 WHERE id=$2 AND deleted_at IS NULL", [updated_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Pengajuan tidak ditemukan', 404);
        ok(res, { message: 'Pengajuan divalidasi oleh desa, lanjut ke assesment lapangan' });
    } catch (e) { err(res, e.message); }
});

// POST /api/pengajuan/:id/assesment
app.post('/api/pengajuan/:id/assesment', async (req, res) => {
    try {
        const { foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment, created_by } = req.body;
        await pool.query('BEGIN');
        await pool.query(
            `INSERT INTO pengajuan_assesment (pengajuan_id, foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment, created_by) 
             VALUES ($1,$2,$3,$4,$5,$6,$7)`,
            [req.params.id, foto_kk, foto_rumah, latitude, longitude, deskripsi_assesment, created_by]
        );
        await pool.query("UPDATE pengajuan_spm SET status='menunggu_rtl_desa', updated_by=$1 WHERE id=$2", [created_by, req.params.id]);
        await pool.query('COMMIT');
        ok(res, { message: 'Assesment lapangan berhasil disimpan' });
    } catch (e) { await pool.query('ROLLBACK'); err(res, e.message); }
});

// PUT /api/pengajuan/:id/rtl-desa
app.put('/api/pengajuan/:id/rtl-desa', async (req, res) => {
    try {
        const { keputusan, updated_by } = req.body; // 'selesai' atau 'rujuk'
        if (keputusan === 'selesai') {
            await pool.query("UPDATE pengajuan_spm SET status='selesai_di_desa', updated_by=$1 WHERE id=$2", [updated_by, req.params.id]);
            ok(res, { message: 'Pengajuan diselesaikan di tingkat desa' });
        } else if (keputusan === 'rujuk') {
            ok(res, { message: 'Silakan upload surat pengantar rujukan' });
        } else {
            err(res, 'Keputusan tidak valid', 400);
        }
    } catch (e) { err(res, e.message); }
});

// POST /api/pengajuan/:id/rujukan
app.post('/api/pengajuan/:id/rujukan', async (req, res) => {
    try {
        const { no_surat_pengantar, file_surat_pengantar, created_by } = req.body;
        await pool.query('BEGIN');
        await pool.query(
            `INSERT INTO pengajuan_rujukan (pengajuan_id, no_surat_pengantar, file_surat_pengantar, tgl_upload, created_by) 
             VALUES ($1,$2,$3,NOW(),$4)`,
            [req.params.id, no_surat_pengantar, file_surat_pengantar, created_by]
        );
        await pool.query("UPDATE pengajuan_spm SET status='menunggu_validasi_kecamatan', updated_by=$1 WHERE id=$2", [created_by, req.params.id]);
        await pool.query('COMMIT');
        ok(res, { message: 'Surat rujukan berhasil diupload, menunggu validasi kecamatan' });
    } catch (e) { await pool.query('ROLLBACK'); err(res, e.message); }
});

// PUT /api/pengajuan/:id/validasi-kecamatan
app.put('/api/pengajuan/:id/validasi-kecamatan', async (req, res) => {
    try {
        const { updated_by } = req.body;
        await pool.query('BEGIN');
        await pool.query("UPDATE pengajuan_rujukan SET validasi_kecamatan=1, updated_by=$1 WHERE pengajuan_id=$2", [updated_by, req.params.id]);
        await pool.query("UPDATE pengajuan_spm SET status='menunggu_validasi_kabupaten', updated_by=$1 WHERE id=$2", [updated_by, req.params.id]);
        await pool.query('COMMIT');
        ok(res, { message: 'Rujukan divalidasi oleh kecamatan' });
    } catch (e) { await pool.query('ROLLBACK'); err(res, e.message); }
});

// PUT /api/pengajuan/:id/validasi-kabupaten
app.put('/api/pengajuan/:id/validasi-kabupaten', async (req, res) => {
    try {
        const { updated_by } = req.body;
        await pool.query('BEGIN');
        await pool.query("UPDATE pengajuan_rujukan SET validasi_kabupaten=1, updated_by=$1 WHERE pengajuan_id=$2", [updated_by, req.params.id]);
        await pool.query("UPDATE pengajuan_spm SET status='menunggu_rtl_dinas', updated_by=$1 WHERE id=$2", [updated_by, req.params.id]);
        await pool.query('COMMIT');
        ok(res, { message: 'Rujukan divalidasi oleh kabupaten' });
    } catch (e) { await pool.query('ROLLBACK'); err(res, e.message); }
});

// PUT /api/pengajuan/:id/rtl-dinas
app.put('/api/pengajuan/:id/rtl-dinas', async (req, res) => {
    try {
        const { tindak_lanjut_dinas, updated_by } = req.body;
        await pool.query('BEGIN');
        await pool.query("UPDATE pengajuan_rujukan SET tindak_lanjut_dinas=$2, updated_by=$3 WHERE pengajuan_id=$1", [req.params.id, tindak_lanjut_dinas, updated_by]);
        const result = await pool.query("UPDATE pengajuan_spm SET status='selesai_di_dinas', updated_by=$2 WHERE id=$1 RETURNING kader_id", [req.params.id, updated_by]);
        await pool.query('COMMIT');
        
        if (result.rowCount) {
            const kaderId = result.rows[0].kader_id;
            await pool.query("INSERT INTO notifikasi (user_id, judul, pesan, created_by) VALUES ($1, 'Pengajuan Selesai', 'Pengajuan Anda telah diselesaikan oleh Dinas.', $2)", [kaderId, updated_by]);
        }
        
        ok(res, { message: 'Tindak lanjut dinas selesai, pemberitahuan dikirim ke pelapor' });
    } catch (e) { await pool.query('ROLLBACK'); err(res, e.message); }
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
                `-- ⚡ Bolt Optimization: Replaced correlated subquery inside SUM with LEFT JOIN LATERAL to prevent repeated query execution during grouping.
                 SELECT k.rt,
                 COUNT(k.id)   AS jumlah_keluarga,
                 SUM(ak.jml) AS jumlah_anggota,
                 SUM(CASE WHEN k.status_kesejahteraan='pra_sejahtera' THEN 1 ELSE 0 END) AS pra_sejahtera,
                 SUM(CASE WHEN k.status_asuransi='tidak_memiliki'     THEN 1 ELSE 0 END) AS tanpa_bpjs
                 FROM keluarga k
                 LEFT JOIN LATERAL (
                    SELECT COUNT(id) AS jml FROM anggota_keluarga WHERE keluarga_id = k.id AND deleted_at IS NULL
                 ) ak ON true
                 WHERE k.is_aktif=1 ${kader_id ? 'AND k.kader_id=$1' : ''}
                 GROUP BY k.rt ORDER BY k.rt`, kader_id ? [kader_id] : []
            ),
            pool.query(
                `-- ⚡ Bolt Optimization: Used LEFT JOIN LATERAL to calculate MAX(tgl_kunjungan) once per family,
                 -- eliminating 3 identical subqueries and a redundant GROUP BY.
                 SELECT k.no_kk, a.nama_lengkap AS kepala_keluarga, k.rt, k.rw,
                 kp.kunjungan_terakhir
                 FROM keluarga k
                 JOIN anggota_keluarga a ON a.keluarga_id=k.id AND a.status_keluarga='kepala_keluarga' AND a.deleted_at IS NULL
                 LEFT JOIN LATERAL (
                    SELECT MAX(tgl_kunjungan) as kunjungan_terakhir
                    FROM kunjungan_posyandu
                    WHERE keluarga_id=k.id AND deleted_at IS NULL
                 ) kp ON true
                 WHERE k.is_aktif=1 ${kader_id ? 'AND k.kader_id=$1' : ''}
                 AND (kp.kunjungan_terakhir IS NULL OR kp.kunjungan_terakhir < CURRENT_DATE - INTERVAL '3 months')
                 ORDER BY kp.kunjungan_terakhir`, kader_id ? [kader_id] : []
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
             JOIN anggota_keluarga a ON a.id=sk.anggota_id AND a.deleted_at IS NULL
             JOIN keluarga k         ON k.id=sk.keluarga_id AND k.deleted_at IS NULL
             WHERE sk.jenis_sasaran='balita' AND sk.deleted_at IS NULL
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
             JOIN anggota_keluarga a ON a.id=sk.anggota_id AND a.deleted_at IS NULL
             JOIN keluarga k         ON k.id=sk.keluarga_id AND k.deleted_at IS NULL
             WHERE sk.jenis_sasaran='bumil' AND sk.deleted_at IS NULL
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
            'SELECT id, nama_lengkap, nik, email, no_hp, rw, rt, desa, kecamatan, kabupaten, role, foto_profil, created_at FROM users WHERE id=$1 AND deleted_at IS NULL',
            [req.params.id]
        );
        if (!rows.length) return err(res, 'Profil tidak ditemukan', 404);
        ok(res, rows[0]);
    } catch (e) { err(res, e.message); }
});

// PUT /api/profil/:id
app.put('/api/profil/:id', async (req, res) => {
    try {
        const { nama_lengkap, email, no_hp, rw, rt, desa, kecamatan, kabupaten, foto_profil, updated_by } = req.body;
        const result = await pool.query(
            `UPDATE users SET nama_lengkap=$1, email=$2, no_hp=$3, rw=$4, rt=$5, desa=$6, kecamatan=$7, kabupaten=$8, foto_profil=$9, updated_by=$10 WHERE id=$11 AND deleted_at IS NULL`,
            [nama_lengkap, email, no_hp, rw, rt, desa, kecamatan, kabupaten, foto_profil, updated_by, req.params.id]
        );
        if (!result.rowCount) return err(res, 'User tidak ditemukan', 404);
        ok(res, { message: 'Profil diperbarui' });
    } catch (e) { err(res, e.message); }
});

// PUT /api/profil/:id/password
app.put('/api/profil/:id/password', async (req, res) => {
    try {
        const { password_lama, password_baru, updated_by } = req.body;
        if (!password_lama || !password_baru) return err(res, 'Password lama dan baru wajib diisi', 400);
        // NOTE: Di produksi gunakan bcrypt.compare dan bcrypt.hash
        const { rows } = await pool.query('SELECT id FROM users WHERE id=$1 AND password=$2 AND deleted_at IS NULL', [req.params.id, password_lama]);
        if (!rows.length) return err(res, 'Password lama tidak cocok', 401);
        await pool.query('UPDATE users SET password=$1, updated_by=$2 WHERE id=$3', [password_baru, updated_by, req.params.id]);
        ok(res, { message: 'Password berhasil diperbarui' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 15. ASSESMENT, PESAN & NOTIFIKASI
// ============================================================

// GET /api/assesment?kader_id=
app.get('/api/assesment', async (req, res) => {
    try {
        const { kader_id } = req.query;
        let q = 'SELECT * FROM posyandu_assesment WHERE deleted_at IS NULL';
        const p = [];
        if (kader_id) { p.push(kader_id); q += ' AND kader_id=$1'; }
        q += ' ORDER BY tgl_assesment DESC';
        const { rows } = await pool.query(q, p);
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// POST /api/assesment
app.post('/api/assesment', async (req, res) => {
    try {
        const { kader_id, tgl_assesment, meja_1_pendaftaran, meja_2_penimbangan, meja_3_pencatatan,
                meja_4_penyuluhan, meja_5_pelayanan, alat_timbangan_ok, alat_ukur_tinggi_ok,
                stok_vitamin_a, stok_obat_cacing, catatan_kendala, created_by } = req.body;
        if (!kader_id) return err(res, 'kader_id wajib', 400);
        const { rows } = await pool.query(
            `INSERT INTO posyandu_assesment (kader_id, tgl_assesment, meja_1_pendaftaran, meja_2_penimbangan,
             meja_3_pencatatan, meja_4_penyuluhan, meja_5_pelayanan, alat_timbangan_ok, alat_ukur_tinggi_ok,
             stok_vitamin_a, stok_obat_cacing, catatan_kendala, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
            [kader_id, tgl_assesment || new Date(), meja_1_pendaftaran || 1, meja_2_penimbangan || 1,
             meja_3_pencatatan || 1, meja_4_penyuluhan || 1, meja_5_pelayanan || 1, alat_timbangan_ok || 1,
             alat_ukur_tinggi_ok || 1, stok_vitamin_a || 1, stok_obat_cacing || 1, catatan_kendala, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Assesment berhasil disimpan' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/pesan?user_id=
app.get('/api/pesan', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return err(res, 'user_id wajib', 400);
        const { rows } = await pool.query(
            `SELECT p.*, u.nama_lengkap AS nama_pengirim FROM pesan p
             JOIN users u ON u.id = p.pengirim_id AND u.deleted_at IS NULL
             WHERE (p.penerima_id = $1 OR p.pengirim_id = $1) AND p.deleted_at IS NULL
             ORDER BY p.created_at DESC`, [user_id]
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// POST /api/pesan
app.post('/api/pesan', async (req, res) => {
    try {
        const { pengirim_id, penerima_id, isi_pesan, created_by } = req.body;
        if (!pengirim_id || !penerima_id || !isi_pesan) return err(res, 'Field wajib tidak lengkap', 400);
        const { rows } = await pool.query(
            'INSERT INTO pesan (pengirim_id, penerima_id, isi_pesan, created_by) VALUES ($1,$2,$3,$4) RETURNING id',
            [pengirim_id, penerima_id, isi_pesan, created_by]
        );
        ok(res, { id: rows[0].id, message: 'Pesan terkirim' }, 201);
    } catch (e) { err(res, e.message); }
});

// GET /api/notifikasi?user_id=
app.get('/api/notifikasi', async (req, res) => {
    try {
        const { user_id } = req.query;
        if (!user_id) return err(res, 'user_id wajib', 400);
        const { rows } = await pool.query(
            'SELECT * FROM notifikasi WHERE user_id = $1 AND deleted_at IS NULL ORDER BY created_at DESC', [user_id]
        );
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// PUT /api/notifikasi/:id/read
app.put('/api/notifikasi/:id/read', async (req, res) => {
    try {
        const { updated_by } = req.body;
        const result = await pool.query('UPDATE notifikasi SET is_read=1, updated_by=$1 WHERE id=$2 AND deleted_at IS NULL', [updated_by, req.params.id]);
        if (!result.rowCount) return err(res, 'Notifikasi tidak ditemukan', 404);
        ok(res, { message: 'Notifikasi ditandai sudah dibaca' });
    } catch (e) { err(res, e.message); }
});

// ============================================================
// 16. VIEWS & REKAP (ADMIN)
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
app.get('/api/users', isAdmin, async (req, res) => {
    try {
        const { rows } = await pool.query("SELECT id, nama_lengkap, nik, email, no_hp, role, rw, rt, is_active, created_at FROM users WHERE deleted_at IS NULL ORDER BY nama_lengkap");
        ok(res, rows);
    } catch (e) { err(res, e.message); }
});

// PUT /api/users/:id/toggle-active  (admin)
app.put('/api/users/:id/toggle-active', isAdmin, async (req, res) => {
    try {
        const { updated_by } = req.body;
        const result = await pool.query('UPDATE users SET is_active = CASE WHEN is_active=1 THEN 0 ELSE 1 END, updated_by=$1 WHERE id=$2 AND deleted_at IS NULL RETURNING is_active', [updated_by, req.params.id]);
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
    console.log('   ASSESMENT → GET/POST /api/assesment');
    console.log('   PESAN     → GET/POST /api/pesan');
    console.log('   NOTIFIKASI→ GET/PUT /api/notifikasi');
    console.log('   VIEWS     → GET  /api/view/keluarga-lengkap');
});
