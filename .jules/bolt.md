## 2026-03-12 - Cartesian Product in PostgreSQL JOINs
**Learning:** Joining multiple one-to-many relationships (like members and visits) with LEFT JOIN and then grouping creates a Cartesian product (M * V rows per parent) before aggregation, causing severe performance issues as data grows.
**Action:** Replace multiple one-to-many LEFT JOINs with correlated subqueries or lateral joins to avoid the Cartesian explosion entirely.

## 2024-05-28 - Database Optimization: Avoiding Redundant Subqueries in PostgreSQL

**Learning:** When a complex aggregate function (like `MAX()`) on a related table is needed in multiple parts of a query (e.g., `SELECT` clause and multiple `HAVING` or `WHERE` conditions), duplicating the identical subquery leads to multiple executions per row. This, coupled with an unnecessary `GROUP BY` when no other aggregations are performed on the main table, significantly degrades performance. PostgreSQL's `LEFT JOIN LATERAL` is a powerful construct for calculating the correlated subquery exactly once per outer row, storing the result, and then referencing it across `SELECT`, `WHERE`, and `ORDER BY` clauses.
**Action:** Always scrutinize queries that use the exact same correlated subquery multiple times. Replace them with `LEFT JOIN LATERAL` (or similar CTE/subquery expressions in the `FROM` clause) to compute the value once. Additionally, avoid `GROUP BY` if the `SELECT` clause does not contain aggregate functions and the uniqueness of rows is already guaranteed by the schema.

## 2024-05-30 - Database Optimization: Avoiding Correlated Subqueries in SELECT Clause for Bulk Endpoints

**Learning:** Placing correlated subqueries directly within the `SELECT` clause for endpoints returning bulk unbounded lists (e.g., fetching a list of families) forces the database query planner to execute the subquery row-by-row in a procedural manner. This prevents it from utilizing optimized join algorithms like hash or merge joins, leading to N+1-style performance degradation as the dataset grows.
**Action:** Always move correlated subqueries from the `SELECT` clause into the `FROM` clause using `LEFT JOIN LATERAL` for bulk queries. This pattern correctly informs the planner that the operations can be aggregated and joined optimally, significantly reducing query execution time on large datasets.
