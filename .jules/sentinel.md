## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2025-04-07 - Critical: Hardcoded Database Fallback Credentials Removed
**Vulnerability:** The PostgreSQL connection pool in `api/api.js` was configured to fall back to hardcoded default credentials (like user `'postgres'`, password `'postgress'`) if environment variables were missing.
**Learning:** This is a common but dangerous pattern where development convenience compromises production security. If an environment is misconfigured or a `.env` file is accidentally omitted, the application might silently attempt to connect with guessable credentials, leading to potential unauthorized access or confusing error states.
**Prevention:** Always implement a "fail-fast" pattern for sensitive configuration parameters like database credentials. If required secrets are not provided via the environment, the application should throw a fatal error and refuse to start, forcing the operator to correctly supply the credentials.
