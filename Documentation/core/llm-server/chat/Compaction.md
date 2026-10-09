# Compaction

`core/llm-server/chat/Compaction.js`

Keeps a long conversation inside the model's context window by replacing the
older messages with one structured summary while keeping the recent turns
verbatim. Thresholds are window-relative, so it adapts to a decode slot's real
per-request context (`ctxPerSlot`). The summarizing model call is injected.

## Methods

- `new Compaction({ reserveFraction, keepFraction, charsPerToken })`: fractions
  outside (0, 1) fall back to `ContextBudget.SHARES.compactionReserve` (0.15)
  and `.compactionKeep` (0.5).
- `calibrate(charsPerToken)`: replace the 4 chars/token guess with a measured
  ratio, clamped to 1.5..8; junk leaves it unchanged. Returns the ratio in force.
- `estimateTokens(messages)`: (text chars + 8 per message) / ratio, rounded up.
  Multimodal parts count their text, `[image]` for images ([MessageText](compaction/MessageText.md)).
- `shouldCompact(messages, contextWindow)`: more than 4 messages, a positive
  window, and the estimate above `window * (1 - reserve)`.
- `findCutIndex(messages, window, boundary = 'turn', keepTokensOverride = null)`:
  walk back until ~`keepFraction` of the window is kept, then snap back to a
  cut point ([TurnBoundary](compaction/TurnBoundary.md)); 0 when no safe cut
  leaves at least 4 messages to summarize.
- `compact(messages, { contextWindow, summarize, boundary, force })` returns
  `{ compacted, messages, summary?, removed?, keptFrom?, prefixLength? }` and
  never throws. `boundary: 'step'` also allows a cut right before an assistant
  message (the only seam inside one agentic turn). `force` skips the size
  trigger (the server already said it does not fit) and keeps half of what is
  actually there. Index remap for callers with ledgers: input `i < keptFrom` is
  gone, otherwise it is at `i - keptFrom + prefixLength`.
- `buildSummaryPrompt(head, { system })`: system block, the replaced range
  verbatim, then the directive as the final user message.
- Statics: `SUMMARY_MARKER`, `SUMMARY_DIRECTIVE` ([SummaryDirective](compaction/SummaryDirective.md)),
  `MIN_HEAD_MESSAGES`.

## Rules compact() keeps

- The leading system block stays verbatim in front; a mid-history system
  message in the cut range is carried, never summarized away.
- A tool result (a `user` message starting `[Tool Result for `) is never a cut
  point, so no assistant call loses its result.
- A summary that is not smaller than what it replaces is rejected: compaction
  only ever shrinks the context.
- Summarizer failure, an empty answer or no `summarize` function returns the
  original array (same reference).

## Why

The summary request is a prefix of the conversation's own next request, so on
the local llama.cpp server only the directive is new input; a bespoke
summarizer prompt would force a full re-ingest exactly when the context is
already over budget.

Compaction is not the only spender of the window: AgentRunner separately caps
carried reasoning, tool history and one tool result per iteration (all in
[ContextBudget](../../shared/llm/ContextBudget.md)). Compaction runs once
before the turn; the runner re-budgets inside it. Change the numbers there, not
here.
