# ToolCallGuard

`core/llm-server/agent/ToolCallGuard.js`

The per-call check run immediately before a tool call would start: the run's
tool allow-list.

## Methods

- `new ToolCallGuard({ allowedTools })`; a null allow-list admits everything.
- `check(call)`: null to run it, else `{ tool: null, text }` to append in its
  place: `Error: tool "x" is not allowed for this run. Allowed tools: ...`
  (`tool` is null because the rejection is not attributed to the call).
