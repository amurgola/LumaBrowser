# ToolHistoryBudget

`core/llm-server/agent/ToolHistoryBudget.js`

Character budgets for the tool-result messages of one agent run, from the
decode slot's usable window ([ContextBudget](../../shared/llm/ContextBudget.md)).

## Methods

- `ToolHistoryBudget.forSlot(ctxPerSlot, nativeTools = false)`: `max(4000,
  usable * 4 * SHARES.toolHistory)` with the estimated fixed cost; 48000 when
  the window is unknown.
- `ToolHistoryBudget.soft(ctxPerSlot, fixedTokens)`: the same share with the
  measured fixed cost, capped so history leaves the reply reserve clear.
- `ToolHistoryBudget.hard(ctxPerSlot, fixedTokens)`: what the window has left
  after the fixed cost and the reply reserve, minus the carried-reasoning share;
  Infinity when the window is unknown.
- `DEFAULT_CHARS` (48000), `MIN_CHARS` (4000), `FRACTION`.

## Why

Individually bounded results were never removed, so a 40-step build grew past
the window and llama.cpp evicted from the oldest end: the system prompt.
