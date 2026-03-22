## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - Privilege Escalation via Mass Assignment
**Vulnerability:** The `/api/auth/register` endpoint allowed mass assignment by accepting the `role` field directly from the user request payload. A malicious actor could easily provide `"role": "admin"` during registration and grant themselves immediate administrative access.
**Learning:** Destructuring request bodies without explicit field picking/omitting can lead to privilege escalation if sensitive columns (like role, permissions, status) are included in the SQL `INSERT` or `UPDATE` statements.
**Prevention:** Never blindly pass user-controlled input into database models. Always filter or strictly define which fields can be updated by the client. For roles and status, hardcode defaults during initial insertion.

## 2024-05-20 - Sanitize Server Error Messages
**Vulnerability:** The generic error handler `catch (e) { err(res, e.message); }` directly passed unhandled database and system errors to the client for 500 status codes, leaking sensitive internal information (e.g., database schema details, stack traces).
**Learning:** Returning unhandled exception messages directly to the client exposes the system's inner workings, which attackers can exploit to craft targeted attacks like SQL injection or identify running services.
**Prevention:** Implement a centralized error handling mechanism that logs the original error details internally (e.g., `console.error()`) but returns a generic "Internal Server Error" message to the user for status codes >= 500.
