## 2026-03-12 - Cartesian Product in PostgreSQL JOINs
**Learning:** Joining multiple one-to-many relationships (like members and visits) with LEFT JOIN and then grouping creates a Cartesian product (M * V rows per parent) before aggregation, causing severe performance issues as data grows.
**Action:** Replace multiple one-to-many LEFT JOINs with correlated subqueries or lateral joins to avoid the Cartesian explosion entirely.

## 2024-05-28 - Database Optimization: Avoiding Redundant Subqueries in PostgreSQL

**Learning:** When a complex aggregate function (like `MAX()`) on a related table is needed in multiple parts of a query (e.g., `SELECT` clause and multiple `HAVING` or `WHERE` conditions), duplicating the identical subquery leads to multiple executions per row. This, coupled with an unnecessary `GROUP BY` when no other aggregations are performed on the main table, significantly degrades performance. PostgreSQL's `LEFT JOIN LATERAL` is a powerful construct for calculating the correlated subquery exactly once per outer row, storing the result, and then referencing it across `SELECT`, `WHERE`, and `ORDER BY` clauses.
**Action:** Always scrutinize queries that use the exact same correlated subquery multiple times. Replace them with `LEFT JOIN LATERAL` (or similar CTE/subquery expressions in the `FROM` clause) to compute the value once. Additionally, avoid `GROUP BY` if the `SELECT` clause does not contain aggregate functions and the uniqueness of rows is already guaranteed by the schema.

## 2026-04-07 - Optimize duplicate AGE() evaluations in selective queries
**Learning:** In PostgreSQL queries where selective scoping reduces row count, using CTEs for calculating intermediate alias values (like AGE intervals) might inadvertently force full table scans.
**Action:** When optimizing duplicated function executions (e.g., `EXTRACT(YEAR FROM AGE(...)) + EXTRACT(MONTH FROM AGE(...))`), prefer `LEFT JOIN LATERAL (SELECT AGE(...) AS alias)` to compute it exactly once. This maintains nested loops for fast indexed access paths instead of hash aggregates or full scans.

## 2026-04-07 - Concurrency in the Database Access Layer
**Learning:** Performing multiple independent database queries sequentially via `await pool.query(...)` creates unnecessary compounding of network round-trip time. In the `GET /api/keluarga/:id` endpoint, fetching the family record and fetching the family members were incorrectly sequenced.
**Action:** When fetching independent datasets for a single response (e.g., parent and children records where the parent ID is already known), always batch the asynchronous calls using `Promise.all([query1, query2])` to execute them concurrently. This effectively halves the latency introduced by database network I/O.
