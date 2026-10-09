# GameKnowledgeBase

`extensions/game-mode/GameKnowledgeBase.js`

The shared `gamedev` RAG scope every game conversation searches: seeded from the bundled `docs/*.md` on activate and grown by `fetch_gamedev_doc`.

## Methods

- `GameKnowledgeBase.SCOPE` `'gamedev'`; `DOCS_DIR` the bundled docs.
- `GameKnowledgeBase.rag()` `global.__lumaRagService` when it has `ingestFile`, else null.
- `GameKnowledgeBase.seed(rag?, docsDir?)` fire-and-forget ingest of every `.md`; failures are swallowed (RagService dedupes by content hash, so re-seeding is cheap).
- `GameKnowledgeBase.ingestPage({ rag, url, text, cacheDir })` writes `<sha1(url)>.md` (`# <url>` + text) into the cache and ingests it; resolves the file path, rejects on failure.

## Bundled docs

`extensions/game-mode/docs/*.md` (Phaser 3 engineering, game design, AI game runtime recipes) were copied from legacy with em-dashes replaced by colons.
