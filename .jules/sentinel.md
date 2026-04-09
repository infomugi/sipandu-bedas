## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2024-05-24 - [CRITICAL] Plaintext Password Storage and Silent Upgrades
**Vulnerability:** User passwords were stored in plaintext in the database, and authentication relied on a simple string equality check (`password !== rows[0].password`).
**Learning:** Legacy systems might rely on plaintext passwords if initial development didn't include a robust authentication strategy or if bcrypt wasn't available due to environment constraints. Since new dependencies couldn't be easily added, Node's built-in `crypto` was required.
**Prevention:** Always use strong, salted cryptographic hashing functions (like `crypto.pbkdf2`, `bcrypt`, or `argon2`) for storing passwords from the very beginning. Furthermore, implement a "silent upgrade" mechanism during login (checking a flag like `needsUpgrade`) to transparently migrate users from legacy plaintext storage to secure hashes without requiring password resets.
