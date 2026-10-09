# PendingToolCard

`core/llm-server/chat/bridge/turn/PendingToolCard.js`

The "preparing" tool card shown while a call is still being generated.

## Methods

- `new PendingToolCard(hooks, { now })`, `begin(startIdx)`.
- `update(buf, force)`: emits `{ phase: 'pending', tool, target, chars }`
  (sniffed by [ToolCallSniffer](../parsing/ToolCallSniffer.md); `chars` since
  the call's start) when forced, when the name or target just grew, or every
  `EMIT_MS` (250). Renderer throws are swallowed.
