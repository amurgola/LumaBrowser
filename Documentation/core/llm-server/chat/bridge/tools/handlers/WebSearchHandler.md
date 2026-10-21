# WebSearchHandler

`core/llm-server/chat/bridge/tools/handlers/WebSearchHandler.js`

`web_search`: a headless search or page read, run by [WebLookup](../../../WebLookup.md). A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(name, params, ctx)`: `WebLookup.run({ params, tabRender:
  ctx.webTabRender, ctxPerSlot, session: ctx.webSession, onProgress })`.
  `ctxPerSlot` sizes each page part; the session holds the run's numbered
  results and read pages; `onProgress` is
  [ToolProgress](../ToolProgress.md)`.messenger(ctx, name)`, so the lookup's
  phases tick the card.
