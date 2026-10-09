# FitGenerationClient

`core/llm-server/server/fit-test/FitGenerationClient.js`

The fit test's HTTP calls to a loaded llama-server.

## Methods

- `new FitGenerationClient({ http })` (default axios).
- `generateAndTime(port, cancelled, apiKey, { messages, maxTokens, timeoutMs })`
  POSTs a non-streaming `/v1/chat/completions` (`temperature: 0`; defaults: the
  `FIT_PROMPT` user message, 256 tokens, 180 s) and resolves
  `{ completionTokens, promptTokens, promptMs, tokensPerSec, promptTokensPerSec }`.
  A `cancelled()` poll every 500 ms aborts the request.
- `countTokens(port, content, apiKey)` POSTs `/tokenize` (30 s); the token count or null.
- `FitGenerationClient.readTimings(data, wallSec)`: tok/s from
  `timings.predicted_per_second`, else completion tokens over wall time; prefill
  from `timings.prompt_per_second`, else prompt tokens over `prompt_ms`; rates and
  `promptMs` rounded to 2 decimals; missing values null.
- `FIT_PROMPT`, `GEN_MAX_TOKENS`, `GEN_TIMEOUT_MS`, `TOKENIZE_TIMEOUT_MS`, `CANCEL_POLL_MS`.

Both requests carry `Authorization: Bearer <apiKey>` when a key is given: an
ephemeral server launched with `--api-key` answers 401 without it.
