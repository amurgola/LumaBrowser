# ContextBudget

`core/shared/llm/ContextBudget.js`

The one place that says how a decode slot's context window is spent, and the
one place that checks whether the sum still makes sense. It only computes;
trimming, compaction and truncation stay with their owners, which read their
shares from here.

## Members

- `ContextBudget.SHARES` (frozen): `carriedReasoningTotal` 0.4 and `toolHistory` 0.35 (AgentRunner, concurrent
  claims across a run), `singleToolResult` 0.25 (ToolOutputTruncator, a bound on one item inside the tool history,
  not an addition), `compactionKeep` 0.5 and `compactionReserve` 0.15 (Compaction).
- `ContextBudget.FIXED` (frozen): `nativeToolSchemasTokens` 4100, `systemPromptTokens` 1500, `minGenerationTokens` 4096.
- `ContextBudget.resolveBudget({ ctxPerSlot, nativeTools = false, fixedTokens = null })` returns
  `{ ctxPerSlot, fixedTokens, usableTokens, carriedReasoningChars, toolHistoryChars, singleToolResultChars,
  compactionTriggerTokens, compactionKeepTokens, headroomTokens, generationReserveTokens }`.
  `fixedTokens` is the measured per-request cost (rendered system prompt plus tool schemas) and wins when it is a
  positive number; otherwise the estimate is `systemPromptTokens` plus `nativeToolSchemasTokens` when `nativeTools`.
  `usableTokens = max(0, window - fixed)`; char allowances are `usable * share * TokenEstimator.CHARS_PER_TOKEN`.
  `generationReserveTokens = min(minGenerationTokens, usable * 0.5)`. A junk or missing window counts as 0.
- `ContextBudget.headroomShare()` is `1 - (carriedReasoningTotal + toolHistory)`.
- `ContextBudget.compactionTrigger()` is `1 - compactionReserve` (0.85), derived so the two cannot disagree.
- `ContextBudget.assertCoherent({ ctxPerSlot = 32768, nativeTools = true })` returns readable problems, empty when
  coherent: concurrent claims at or over 1 (or over 0.8), a single result larger than the history, compaction keeping
  as much as it triggers at, fixed costs plus concurrent claims leaving under a tenth of the window spare, a window
  smaller than the fixed costs, or fixed costs over a quarter of the window.

## Why

The shares used to live in three files that could not see each other, and 0.25 + 0.35 + 0.4 was 1.0 before the
system prompt or the task. Native tool schemas then added about 4k tokens per request that no share knew about. The
check for "fixed costs plus concurrent claims, together" was the one originally missing: on a 32k window they came to
92%, and the turn that ran out returned an HTTP 500 from llama.cpp. The system prompt also grows as tool group
manuals are appended (1356 tokens cold, about 7650 with every group), which is why a measured `fixedTokens` wins.
The generation reserve exists because the agent path once sent no `max_tokens`, so replies stopped mid-document at
the context wall.

`assertCoherent` is run by a test rather than at runtime: the answer only changes when someone edits a constant.
