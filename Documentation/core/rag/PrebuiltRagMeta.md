# PrebuiltRagMeta

`core/rag/PrebuiltRagMeta.js`

The small key/value table (`prebuilt_meta`: `key` primary key, `value` text)
a prebuilt knowledge base carries beside the [RagSchema](RagSchema.md) tables.
[DocsRagBuilder](../../tools/build/docs-rag/DocsRagBuilder.md) writes it once;
[ReadOnlyRagStore](ReadOnlyRagStore.md) reads it so the app knows which scope
it opened, what content it was built from and when.

## Methods

- `PrebuiltRagMeta.ensure(db)` creates the table if missing.
- `PrebuiltRagMeta.write(db, entries)` ensures the table and stores every
  `{ key: value }` pair as strings, replacing existing keys, in one transaction.
- `PrebuiltRagMeta.read(db)` returns `{ key: value }` (strings, sorted by key),
  `{}` when the table is missing (a database that was never prebuilt).
- `PrebuiltRagMeta.exists(db)`, `PrebuiltRagMeta.TABLE`, `PrebuiltRagMeta.DDL`.

## Why

A user `rag.db` never has this table, so its absence is what tells a plain
knowledge base from a shipped one, without a schema change for the former.
