# RagSchema

`core/rag/RagSchema.js`

Creates the knowledge base tables if missing:

- `documents`: `id`, `scope`, `filename`, `sha256`, `pages`, `created` (epoch
  ms); indexes on `scope` and a unique index on `(scope, sha256)`.
- `chunks`: `id`, `doc_id`, `scope`, `page`, `text`, `char_start`,
  `char_end`, `embedding` (float32 BLOB or null); indexes on `doc_id`, `scope`.
- `chunks_fts`: external-content FTS5 over `chunks.text`, kept in sync by
  insert, delete and update triggers.

## Methods

- `RagSchema.ensure(db)` runs the DDL on a better-sqlite3 handle. Idempotent.
- `RagSchema.DDL` the statements themselves.

## Why

Scope is a column on every row so a per-agent or per-project knowledge base is
a `WHERE` clause, not a schema change (agent-manager already uses per-agent
scopes).
