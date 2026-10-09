# TokenEstimator

`core/shared/text/TokenEstimator.js`

Estimates token counts at a fixed 4 characters per token, because the main
process has no tokenizer.

## Methods

- `TokenEstimator.estimateTokens(text)` returns the estimated token count,
  rounded up. Non-string input is coerced; `null` and `undefined` count as empty.
- `TokenEstimator.tokensToChars(tokens)` returns the character budget for a
  token allowance, rounded down and never less than 1.
- `TokenEstimator.CHARS_PER_TOKEN` is the ratio itself, for callers that size
  byte budgets directly.

## Why one shared ratio

Context budgets are computed in one place and consumed in another (chat
compaction, tool output truncation, RAG chunking, web page extracts). If two of
those used different ratios, the context window would silently overfill or go
to waste. Every caller uses this class so they always agree.

The ratio is deliberately conservative. Overestimating tokens truncates early,
which is recoverable. Underestimating overflows the model's context, which is not.

This lives in `core/shared` rather than next to the context estimator because
that module pulls in the whole launch planner, and RAG chunking should not
depend on launch planning just to divide by four.
