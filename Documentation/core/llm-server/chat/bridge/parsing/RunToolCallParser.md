# RunToolCallParser

`core/llm-server/chat/bridge/parsing/RunToolCallParser.js`

The tool-call parser one run hands AgentRunner.

## Methods

- `new RunToolCallParser({ health, maxMalformedReprompts })`.
- `parseToolCalls(content)`: `BrowserTools.parseToolCalls`, else
  [LooseToolCallParser](LooseToolCallParser.md)`.parseAll`. A loose recovery,
  or a strict call carrying `__coerced`, sets `sawOffFormat` and records the
  shape on [RunHealth](../turn/RunHealth.md). Markers move onto params
  ([CallMarkers](CallMarkers.md)). With no calls and text that looks like an
  attempt, returns `[{ tool: MALFORMED_TOOL, params: {} }]`, at most
  `maxMalformedReprompts` times.
- `parseToolCall(content)`: the first call or null.
- `takeLastCallRepaired()`: true once for a lone call that was repaired.
- `sawOffFormat`: latches once the run drifted.

## Why

Drift is counted where it happens; counting on the latched flag inflated one
drift into every later iteration (27 counted for a real 15).
