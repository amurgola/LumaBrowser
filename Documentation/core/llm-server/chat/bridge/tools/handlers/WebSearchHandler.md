# WebSearchHandler

`core/llm-server/chat/bridge/tools/handlers/WebSearchHandler.js`

`web_search`: a headless search or page read, run by [WebLookup](../../../WebLookup.md). A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: `WebLookup.run({ params, tabRender:
  ctx.webTabRender, ctxPerSlot, session: ctx.webSession })`. `ctxPerSlot`
  sizes each page part; the session holds the run's numbered results and read pages.
