# MidTurnCompactor

`core/llm-server/agent/MidTurnCompactor.js`

Mid-turn compaction for one agent run. One agentic turn is many completions
over one growing list, and the assistant's own messages (every write_file
carries a whole file) are in no ledger, so a long code turn could outgrow the
window. This summarizes the older steps in place with
[Compaction](../chat/Compaction.md) (`boundary: 'step'`).

## Methods

- `MidTurnCompactor.isEnabled(ctxPerSlot, db)`: needs a known window and
  `core.llmServer.chat.compaction` not false.
- `new MidTurnCompactor({ enabled, ctxPerSlot, nativeToolsTokens, history,
  sender, steps, emit, shouldAbort })`, `count`, `enabled`.
- `calibrate(chars, tokens)`: chars-per-token clamped to 1.5..8, from
  `usage.prompt_tokens` or an overflow error's count.
- `compactIfOverTrigger(iteration)`: compacts (`'proactive'`) when the
  calibrated estimate (chars / ratio + 3 per message + schema tokens) exceeds
  `ContextBudget.resolveBudget(...).compactionTriggerTokens`.
- `compact(iteration, reason, force)`: at most `MAX_PER_RUN` (4) per run and
  not after a cancel. Emits `compacting`, then `compacted` with `{ reason,
  removed, contextWindow, freedChars }`; records a `compaction` step either
  way. Returns the characters freed.
