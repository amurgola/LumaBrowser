# WebSession

`core/llm-server/chat/web-tools/WebSession.js`

One agent run's web lookup state.

## Members

- `new WebSession({ results?, pages? })`.
- `results`: a [ResultMemory](ResultMemory.md) (the latest search's numbers).
- `pages`: a [PageCache](PageCache.md) (pages already read).

## Why

[BridgeRun](../bridge/BridgeRun.md) creates one per run and hands it to
[WebSearchHandler](../bridge/tools/handlers/WebSearchHandler.md) as
`ctx.webSession`, so "result 2" and "part 3" resolve against this run only and
nothing leaks between conversations.
