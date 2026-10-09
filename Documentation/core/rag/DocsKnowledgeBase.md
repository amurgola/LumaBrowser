# DocsKnowledgeBase

`core/rag/DocsKnowledgeBase.js`

The app's own documentation as a knowledge base: the prebuilt index
[DocsRagBuilder](../../tools/build/docs-rag/DocsRagBuilder.md) writes, opened
read-only ([ReadOnlyRagStore](ReadOnlyRagStore.md)) on first use. It backs the
chat's "@lumabrowser-documentation" source
([DocsSourceGrant](../llm-server/chat/router/DocsSourceGrant.md) on the main
side, [DocsSourceContext](../llm-server/ui/js/chat/composer/DocsSourceContext.md)
in the composer). Built by [ChatTaskServices](../../app/services/ChatTaskServices.md),
published as `global.__lumaDocsKnowledgeBase` for extensions, handed to the LLM
IPC controller as `docsKnowledgeBase`, closed by
[AppLifecycle](../../app/shutdown/AppLifecycle.md).

A build without the index (or a corrupt file) is not an error: `available()` is
false, `status()` says so and `search()` reports no passages, so the composer
simply never offers the source.

## Methods

- `DocsKnowledgeBase.resolvePath({ isPackaged, resourcesPath, rootDir })`:
  `<resourcesPath>/docs-rag/docs-rag.db` when packaged (electron-builder's
  `extraResources`), else `<rootDir>/dist/docs-rag/docs-rag.db` (the output of
  `npm run build:docs-rag`).
- `new DocsKnowledgeBase({ dbPath, store? })`: nothing is opened yet; `store` is
  an injectable ReadOnlyRagStore (tests).
- `store`: the ReadOnlyRagStore, opened on first access, `null` when the file is
  missing or cannot be opened.
- `available()`.
- `status()`: `{ available: false, name }` or `{ available: true, name, documents,
  chunks, builtAt, appVersion, contentHash }` from the prebuilt metadata.
- `search(query, { k = 5 })`: [KnowledgeLookup](KnowledgeLookup.md)'s
  `{ found, rendered, sources, message }` over the store's own scope; a
  not-found result when the index is absent or the search throws.
- `close()`: closes the store; a later call reopens it.
- `DocsKnowledgeBase.NAME` (`LumaBrowser documentation`), `DIR`, `FILE`, `DEFAULT_K`.

## Why

The user's knowledge base ([RagService](RagService.md)) and the shipped index
are separate files on purpose: the index is replaced wholesale by the next app
version and must never mix with, or be deleted through, the user's documents.
