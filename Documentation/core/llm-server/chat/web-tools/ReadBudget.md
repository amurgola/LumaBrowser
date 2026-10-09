# ReadBudget

`core/llm-server/chat/web-tools/ReadBudget.js`

How many characters of a page one read (one part) may return.

## Methods (static)

- `partChars(ctxPerSlotTokens)`: `TEXT_SHARE` (0.8) of the single-tool-result
  allowance from `ToolOutputTruncator.forSlotBudget` (its default allowance when
  the slot is unknown), held between `MIN_PART_TOKENS` (1,000) and
  `MAX_PART_TOKENS` (12,000) converted with `TokenEstimator.tokensToChars`.

## Why

The agent compacts any tool result larger than its single-result share of the
slot ([ContextBudget](../../../shared/llm/ContextBudget.md)). Sizing parts from
that same allowance means a part is never cut again downstream, so its
continuation footer always survives. The 20% left over carries the headline,
notes and footer. Below about 1,000 tokens a part cannot hold one article
section; past about 12,000 one result dilutes attention, and with parts the
rest is one follow-up call away.
