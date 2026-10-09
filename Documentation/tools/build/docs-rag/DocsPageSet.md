# DocsPageSet

`tools/build/docs-rag/DocsPageSet.js`

The `Documentation/` pages [DocsRagBuilder](DocsRagBuilder.md) indexes: exactly
the pages the prod mirror ships, with the same scrubbing, so the shipped
knowledge base matches the shipped docs.

Two modes, detected from the checkout:

- `prod` (the mirror, where prod-sync does not exist): every `.md` under
  `Documentation/` as written, since the folder already is that set.

Scrubbing is idempotent, so both modes produce the same pages and the same
`contentHash`.

## Methods

- `new DocsPageSet({ rootDir, mode?, listFiles? })`: `mode` defaults to
  `detectMode(rootDir)`; `listFiles` is the injectable repo listing for the dev
  mode (defaults to git).
- `list()` returns `[{ rel, text }]` sorted by `rel`, the page path inside
  `Documentation/` with forward slashes.
- `mode`, `DocsPageSet.detectMode(rootDir)`, `DocsPageSet.DOCS_DIR`.
