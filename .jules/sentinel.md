## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2024-05-18 - Missing Authentication on Admin Endpoint
**Vulnerability:** The `/api/view/keluarga-lengkap` endpoint, which exposes sensitive and complete family data, lacked authentication and authorization checks. It was placed in the `VIEWS & REKAP (ADMIN)` section but the `isAdmin` middleware was missing, allowing any user (even unauthenticated ones) to access it.
**Learning:** Endpoints intended for administrative use or those that expose comprehensive data must have explicit authentication and authorization middleware applied. Grouping endpoints by comments does not enforce security.
**Prevention:** Always verify that sensitive endpoints have the necessary authorization middleware (e.g., `isAdmin`) applied directly to the route handler. Regularly audit routes to ensure intended access controls are enforced.
