# KnowledgeLookup

`core/rag/KnowledgeLookup.js`

The `search_knowledge_base` chat tool's engine: reads the request, retrieves
passages and shapes the outcome.

## Methods

- `KnowledgeLookup.lookup(store, query, { scope, k })` resolves
  [KnowledgeLookupOutcome](KnowledgeLookupOutcome.md)'s `{ found, rendered,
  sources, message }` and never rejects for a blank query or no match.
  - The query is trimmed; blank -> `KnowledgeLookupOutcome.blank()` without
    touching the store.
  - `scope` falls back to `store.scope` (a prebuilt index carries its own, see
    [ReadOnlyRagStore](ReadOnlyRagStore.md)), then `RagStore.DEFAULT_SCOPE`;
    `k` falls back to `KnowledgeRetriever.DEFAULT_LIMIT` (5).
  - Passages come from [KnowledgeRetriever](KnowledgeRetriever.md); the
    outcome is built with the query's terms
    ([QueryTermExtractor](QueryTermExtractor.md)) for excerpt highlighting.

## Why

Callers ([RagService](RagService.md), [DocsKnowledgeBase](DocsKnowledgeBase.md))
only need one call. The model receives `[S1]`-tagged passages; the structured
`sources` go to the chat as a typed `citations` event (see
`KnowledgeBaseHandler` and `DocsSourceGrant`), never into the model's context.
