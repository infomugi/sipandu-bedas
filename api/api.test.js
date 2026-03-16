const test = require('node:test');
const assert = require('node:assert');
const { app, pool } = require('./api.js');

test('POST /api/auth/register handles duplicate NIK or email (error 23505)', async (t) => {
    // Mock pool.query to simulate PostgreSQL error 23505
    const originalQuery = pool.query;
    pool.query = async (text, params) => {
        if (text && typeof text === 'string' && text.includes('INSERT INTO users')) {
            const error = new Error('duplicate key value violates unique constraint "users_nik_key"');
            error.code = '23505';
            throw error;
        }
        return originalQuery.call(pool, text, params);
    };

    let server;
    try {
        // Start a temporary server to test the endpoint
        server = app.listen(0);

        // Wait for the server to be listening
        await new Promise((resolve, reject) => {
            server.on('listening', resolve);
            server.on('error', reject);
        });

        const port = server.address().port;
        const url = `http://localhost:${port}/api/auth/register`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nama_lengkap: 'Test User',
                nik: '1234567890123456',
                password: 'password123',
                no_hp: '08123456789'
            })
        });

        const data = await response.json();

        assert.strictEqual(response.status, 409);
        assert.strictEqual(data.success, false);
        assert.strictEqual(data.message, 'NIK atau email sudah terdaftar');

    } finally {
        // Restore original pool.query and close server
        pool.query = originalQuery;
        if (server) {
            server.close();
        }
    }
});
