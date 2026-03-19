## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2024-05-18 - Authorization Bypass in Admin Endpoint
**Vulnerability:** The `/api/view/keluarga-lengkap` endpoint was grouped under an administrative comment block but did not actually use the `isAdmin` middleware, leading to an authorization bypass where any authenticated user (or unauthenticated, depending on the route) could access admin-level data.
**Learning:** Relying on code comments or structural grouping to imply authorization is dangerous. Each endpoint must explicitly enforce its required authorization level. Grouping routes under a comment block does not secure them.
**Prevention:** Always explicitly attach authorization middleware (like `isAdmin`) directly to the route definition for every endpoint that requires restricted access.
