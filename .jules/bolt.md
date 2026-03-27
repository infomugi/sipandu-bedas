## 2026-03-12 - Cartesian Product in PostgreSQL JOINs
**Learning:** Joining multiple one-to-many relationships (like members and visits) with LEFT JOIN and then grouping creates a Cartesian product (M * V rows per parent) before aggregation, causing severe performance issues as data grows.
**Action:** Replace multiple one-to-many LEFT JOINs with correlated subqueries or lateral joins to avoid the Cartesian explosion entirely.

## 2024-05-28 - Database Optimization: Avoiding Redundant Subqueries in PostgreSQL

**Learning:** When a complex aggregate function (like `MAX()`) on a related table is needed in multiple parts of a query (e.g., `SELECT` clause and multiple `HAVING` or `WHERE` conditions), duplicating the identical subquery leads to multiple executions per row. This, coupled with an unnecessary `GROUP BY` when no other aggregations are performed on the main table, significantly degrades performance. PostgreSQL's `LEFT JOIN LATERAL` is a powerful construct for calculating the correlated subquery exactly once per outer row, storing the result, and then referencing it across `SELECT`, `WHERE`, and `ORDER BY` clauses.
**Action:** Always scrutinize queries that use the exact same correlated subquery multiple times. Replace them with `LEFT JOIN LATERAL` (or similar CTE/subquery expressions in the `FROM` clause) to compute the value once. Additionally, avoid `GROUP BY` if the `SELECT` clause does not contain aggregate functions and the uniqueness of rows is already guaranteed by the schema.

## 2026-03-15 - In-Memory Caching for Frequent Aggregate Queries
**Learning:** Dashboard endpoints often perform multiple heavy `COUNT(*)` or `SUM()` queries across several tables. If real-time precision is not critical, these operations can be significantly optimized by introducing a simple in-memory cache with a TTL. This reduces database I/O and CPU usage, leading to sub-millisecond response times for subsequent requests.
**Action:** Implement simple in-memory caches (using `Map` or `LRU-cache`) for high-traffic dashboard or reporting endpoints that don't require sub-second data freshness.
