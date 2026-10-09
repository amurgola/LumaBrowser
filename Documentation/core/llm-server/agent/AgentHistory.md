# AgentHistory

`core/llm-server/agent/AgentHistory.js`

The message list of one agent run plus the ledgers that keep it inside the
window: tool results under the tool-history budget, carried reasoning under its
own ([CarriedNotesLedger](CarriedNotesLedger.md)), and the one screenshot whose
"attached" note is still true.

## Methods

- `new AgentHistory({ ctxPerSlot, nativeToolsTokens, carriedTotal, onEvicted })`.
- `messages` (the live array, replaced in place by compaction), `length`,
  `push(role, content)`, `last()`, `popLast()`, `chars()`.
- `AgentHistory.charsOf(messages)`: content characters across string or
  text-part content.
- `fixedTokens()`: system prompt chars / 4 plus native schema tokens, re-read
  every time because activating a tool group grows the prompt mid-run.
- `softToolBudget()` / `hardToolBudget()`: [ToolHistoryBudget](ToolHistoryBudget.md) for the current fixed cost.
- `pushToolResult(base, notes = '', tool = 'tool', params = null)`: appends a
  user-role result (notes suffixed), tracks it, evicts to budget, tracks the notes.
- `evictToolHistory(budget, hardBudget)`, `toolHistoryChars()`.
- `shrinkNewestToolResult(target)`: keeps `max(2000, target / 2)` chars of the
  newest result plus a notice; returns the chars taken off the ledger.
- `appendToLastUser(block)`: on the last user message, else a new one.
- `markScreenshot()`, `expireScreenshotNote()`: swaps the attached note for the
  stale one once anything newer exists.
- `applyCompaction({ keptFrom, prefixLength, messages })`: remaps or drops
  every ledger index, then replaces the array contents.

## Why

Notes ride on the user-role tool result, never the assistant message: a model
that sees itself write notes imitates them in visible replies.
