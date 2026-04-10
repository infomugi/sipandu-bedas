## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2025-02-27 - Hardcoded Default Credentials in api.js
**Vulnerability:** The Node.js Express server in `api/api.js` had hardcoded database credentials (`postgres`, `postgress`, `localhost`, etc.) acting as a fallback if environment variables were missing.
**Learning:** Hardcoded credentials even as fallbacks introduce significant risk. If an environment variable fails to load, the server might inadvertently start connecting using weak or incorrect default credentials, potentially opening up a vector for exploitation or confusing local/prod environments.
**Prevention:** Implement a 'fail-fast' pattern for database connections. The application should explicitly verify that all required environment variables are present on startup. If any are missing, it should log a fatal error and immediately exit (`process.exit(1)`) rather than falling back to default values.
