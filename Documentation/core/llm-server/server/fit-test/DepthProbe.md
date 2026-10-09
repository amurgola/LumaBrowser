# DepthProbe

`core/llm-server/server/fit-test/DepthProbe.js`

One generation behind about 16K tokens of history on the already-loaded server,
so the fit table also carries the speed an agent session sees.

## Methods

- `new DepthProbe({ client })` (a [FitGenerationClient](FitGenerationClient.md)).
- `measure(port, contextTokens, cancelled, apiKey)` resolves
  `{ promptTokens, prefillMs, promptTokensPerSec, tokensPerSec, completionTokens }`,
  or null (no request) when the rung cannot hold the probe. The filler is counted
  with `/tokenize` and, when over budget, trimmed once to `budget / count * 0.97`
  of its length. The request asks for 128 tokens with a 600 s timeout.
- `DepthProbe.budgetTokens(contextTokens)` 0 below `MIN_CTX`, else
  `min(TARGET_TOKENS, ctx - OUTPUT_RESERVE)`.
- `DepthProbe.buildPrompt(targetTokens)` lines
  `Entry <i>: <clause>, filed on day <(i*13)%365+1> of the year <1900+i%120>.` with
  clause `CLAUSES[(i*7)%16]`, until `targetTokens * 3.4` characters.
- `TARGET_TOKENS` (16384), `MIN_CTX` (20480), `OUTPUT_RESERVE` (1024),
  `GEN_MAX_TOKENS` (128), `TIMEOUT_MS`, `CHARS_PER_TOKEN` (3.4), `TRIM_MARGIN`,
  `SYSTEM_PROMPT`, `QUESTION`, `CLAUSES`.

## Why

The short prompt measures a chat opener; the per-token KV read grows with depth.
The filler carries a serial number per sentence and cycles distinct clauses, so
no two lines repeat and prompt caching has nothing to reuse. 3.4 chars per token
is conservative (this prose tokenizes near 4), and the real count comes back
from the server.
