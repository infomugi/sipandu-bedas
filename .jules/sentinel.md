## 2024-05-18 - [Authentication Bypass in Login]
**Vulnerability:** The `/api/auth/login` endpoint retrieved user data using only the NIK, completely skipping password validation (`if (password !== rows[0].password)` was missing). It also returned the entire user row, leaking the password hash.
**Learning:** An endpoint might exist that asks for a password but fails to check it against the database record, leading to an easy authentication bypass. The codebase also returned `SELECT *` essentially (fetching password too) and returning it to the user.
**Prevention:** Always verify passwords explicitly. Destructure or `delete` sensitive fields from response objects to avoid unintentional data leaks.

## 2024-05-18 - [Missing Authentication on Admin Endpoints]
**Vulnerability:** The `/api/users` and `/api/users/:id/toggle-active` endpoints in the backend API completely lacked authentication and authorization checks. Any unauthenticated user could retrieve the full list of users and toggle the active status of any user.
**Learning:** Admin endpoints were exposed without any `requireAdmin` or `requireAuth` middleware, which is a common security gap when developers assume endpoints are "hidden" or only accessed via the admin panel.
**Prevention:** Always apply authentication middleware by default to all endpoints, and specifically ensure authorization (e.g., `requireAdmin`) is implemented and tested for endpoints that perform sensitive operations.
