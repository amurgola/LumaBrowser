# FallbackMessage

`core/llm-server/chat/bridge/turn/FallbackMessage.js`

The honest answer for a run that ended without a clean final message.

## Methods (all static)

- `compose(result, toolTrace)`: the last step's prose (fences removed) when
  longer than 8 characters, else `TOOL_FAILED` (a step failed) or the
  empty-reply message; then `**Steps I took:**` with `- [ok|error|pending]
  <tool>: <error>` lines (errors clipped to 140).
