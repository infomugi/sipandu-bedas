## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.
## 2025-02-14 - Secure Password Hashing
**Vulnerability:** Plaintext password storage and comparison in authentication endpoints (`/api/auth/login`, `/api/auth/register`, `/api/profil/:id/password`).
**Learning:** Hardcoded comparisons against plaintext or loosely validated prefixes (e.g., fallback logic) create severe authentication backdoors and expose credentials if the database is breached.
**Prevention:** Always use secure hashing (e.g., `PBKDF2`, `bcrypt`) for storing and verifying passwords. Ensure `comparePassword` functions strictly validate hash formats and reject plaintext or invalid legacy hashes entirely.
