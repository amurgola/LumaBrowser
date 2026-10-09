# OnDemandKnowledgeBase

`extensions/on-demand-mode/OnDemandKnowledgeBase.js`

The On Demand web-navigation knowledge base in the RAG scope `webnav`.

## Methods

- `seed(docsDir)` ingests every `*.md` in `docsDir` with
  `rag.ingestFile(path, { scope: 'webnav' })`, fire-and-forget (rejections are
  swallowed; RagService dedupes by content hash, so re-seeding is idempotent).
  Returns the file count, or 0 with no RAG service or an unreadable folder.
- `docCount()` `rag.count('webnav')`, 0 when absent or throwing.
- `OnDemandKnowledgeBase.SCOPE` `'webnav'`.

## Why a global

The RAG service is read lazily from `global.__lumaRagService` (parked by
main.js), as legacy and game-mode do, so activation order never matters and a
missing service never blocks activation. The extension context has no RAG
surface yet.
