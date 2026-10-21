# ToolProgress

`core/llm-server/chat/bridge/tools/ToolProgress.js`

The one way a running built-in or MCP tool reports on itself to the chat.

## Methods

- `ToolProgress.reporter(ctx, tool)`: `report(fields)` emitting
  `hooks.onToolEvent({ phase: 'status', tool, step?, totalSteps?, elapsedMs?,
  message? })`; only numeric counts and a string message pass, anything else
  in `fields` is dropped. Silent after a Stop (`ctx.isAborted()`), without an
  `onToolEvent` hook, and when the renderer throws.
- `ToolProgress.messenger(ctx, tool)`: `say(message)`, a reporter taking one
  line of words; an empty line says nothing.

## Who reports

- `web_search` ([WebSearchHandler](handlers/WebSearchHandler.md)): the engine
  being asked, the host being fetched or rendered.
- Extension and MCP tools ([ToolDispatch](ToolDispatch.md) hands the reporter
  to the aggregator as `opts.onProgress`; the mcp-connector maps the server's
  `notifications/progress` onto it).
- Image, video and music tools report through
  [MediaProgressSink](media/MediaProgressSink.md), which predates this class
  and emits the same event.

The renderer keeps the latest report on the step
([ToolEventReducer](../../../ui/js/chat/stream/ToolEventReducer.md) `status`)
and ticks the card's detail in place
([ToolCardText](../../../ui/js/chat/turns/ToolCardText.md)`.progress`).

## Why

A 40-second image render or a slow MCP server showed a bare spinner although
the server was reporting every step; the media sink already emitted the event
but nothing in the renderer read it. One reporter with one shape keeps every
tool's progress line looking the same, and keeps a UI throw out of the tool.
