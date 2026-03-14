## 2026-03-12 - Cartesian Product in PostgreSQL JOINs
**Learning:** Joining multiple one-to-many relationships (like members and visits) with LEFT JOIN and then grouping creates a Cartesian product (M * V rows per parent) before aggregation, causing severe performance issues as data grows.
**Action:** Replace multiple one-to-many LEFT JOINs with correlated subqueries or lateral joins to avoid the Cartesian explosion entirely.
## 2026-03-12 - Redundant Correlated Subqueries & GROUP BY in PostgreSQL
**Learning:** Using multiple identical correlated subqueries in SELECT and HAVING clauses forces PostgreSQL to execute the same expensive subquery multiple times per outer row. When combined with a GROUP BY to deduplicate, it causes a severe performance hit.
**Action:** Use a single LEFT JOIN LATERAL to calculate the aggregate exactly once per outer row. Then reference the lateral column in both the SELECT and WHERE clauses, removing the need for both redundant subqueries and unnecessary GROUP BYs.
