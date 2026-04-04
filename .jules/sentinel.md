## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.
## 2024-04-04 - [CRITICAL] Hardcoded / Plaintext Password Storage and Authentication
**Vulnerability:** User passwords in the database and authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/profil/:id/password`) were entirely stored and verified as plaintext strings.
**Learning:** The implementation used simple string comparisons `password !== rows[0].password` to authenticate users, leaving the system completely vulnerable if the database was compromised. There was no cryptographic protection.
**Prevention:** Always implement secure password hashing (e.g., using `crypto.pbkdf2` with a random salt and sufficient iterations like 100k for SHA-512). Implement a migration strategy for existing users (like the `needsUpgrade` flag) to seamlessly convert legacy plaintext passwords into hashes upon their next login without breaking the application.
