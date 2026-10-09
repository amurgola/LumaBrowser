# KnowledgeBaseHandler

`core/llm-server/chat/bridge/tools/handlers/KnowledgeBaseHandler.js`

`search_knowledge_base`: retrieves passages from the run's scope. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: `UNAVAILABLE` without `deps.ragService`; else
  `ragService.search(query | q, { scope: ctx.kbScope })`, emitting
  `onAgentEvent({ type: 'citations', payload: { sources } })` when found (the
  [SourceCardBuilder](../../../../../rag/SourceCardBuilder.md) cards), and
  returning `{ success: true, found, message }`.
