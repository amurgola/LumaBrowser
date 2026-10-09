# RestFallbackReply

`core/browser/controller/RestFallbackReply.js`

Turns a [SelectorFallback](SelectorFallback.md) outcome into an `/api/browser` reply.

## Methods

- `RestFallbackReply.build(outcome, spec)` with `spec = { ok, failed, failedStatus = 404,
  stampNavigation? }` returns `{ status, response }` (an [ApiResponse](../models/ApiResponse.md)):
  - primary success: 200, `result.data` as is (copied and navigation-stamped when `stampNavigation`),
    message `ok`;
  - direct / recovered: 200, `{ ...result.data, resolvedSelector }`, message
    `<ok> (resolved by LLM)` / `<ok> (resolved by LLM fallback)`;
  - failure: `failedStatus`, error = the primary error or `LLM could not resolve a selector`, message
    `failed`.
- `RestFallbackReply.NO_SELECTOR_ERROR`.
