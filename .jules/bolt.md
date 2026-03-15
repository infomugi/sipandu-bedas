## 2026-03-12 - Cartesian Product in PostgreSQL JOINs
**Learning:** Joining multiple one-to-many relationships (like members and visits) with LEFT JOIN and then grouping creates a Cartesian product (M * V rows per parent) before aggregation, causing severe performance issues as data grows.
**Action:** Replace multiple one-to-many LEFT JOINs with correlated subqueries or lateral joins to avoid the Cartesian explosion entirely.

## 2026-03-15 - Redundant Subqueries in HAVING Clauses
**Learning:** Correlated subqueries used multiple times across SELECT and HAVING clauses (e.g. `MAX(tgl_kunjungan)`) are re-evaluated each time by PostgreSQL, causing a massive performance hit. Combining them with GROUP BY makes the query exponentially slower.
**Action:** Use LEFT JOIN LATERAL to calculate the aggregate once per outer row, alias the result, and filter directly in the WHERE clause to eliminate redundant calculations and expensive GROUP BY operations.
