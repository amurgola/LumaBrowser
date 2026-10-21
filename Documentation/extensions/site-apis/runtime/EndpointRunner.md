# EndpointRunner

`extensions/site-apis/runtime/EndpointRunner.js`

Replays one endpoint and answers the RunResult of [Design.md](../Design.md): resolves the params, opens a run
row, takes the site's hidden tab (one call at a time per site), runs the steps under the retry policy, checks
the returns shape, closes the run row. It only wires the runtime classes per run.

## Methods

- `new EndpointRunner({ store, browser, chat, llm?, logger, onSiteStatus(siteId, status, note), showSiteTab(siteId) })`:
  `browser` is `context.browser` (null outside the app: every run then faults `browser_unavailable`), `chat` is
  `context.chat` (the LLM transform and, without `llm`, the selector fallback), `llm` is `context.llm` when the
  extension passes it (the fallback then uses the app's `selector-resolver` slot). Test seams:
  `fallbackService`, `loginCheck`, `retry`, `sleep`.
- `run(site, endpoint, params, { kind: 'call' | 'test', signal })` -> `{ success, data, runId, durationMs, fault?,
  advice?, healed: [{ step, selector }], stepsLog: [{ index, kind, ok, ms, via, note?, attempt }] }`. Never throws.
  - `invalid_params` (from `ParamTemplate.resolve`) answers before any run row (`runId: null`).
  - the run row: `store.startRun` then `store.finishRun(runId, { ok, fault, result, stepsLog, durationMs })`.
  - the steps are copied per run; a healed selector lands in the copy, the endpoint record and the store.
  - a success runs [ReturnsCheck](ReturnsCheck.md) (`shape_mismatch`) and then `LoginCheck.markOk(site)`.
- `dispose()`: closes every replay tab.

## Decisions

- One [SiteTab](SiteTab.md) per site, kept in a map; the attempt loop ([RetryPolicy](RetryPolicy.md)) runs
  inside the tab's lock so two calls on one site never interleave.
- The fallback service is built on first use ([FallbackService](FallbackService.md)): the chat router does not
  exist yet when the extension activates at boot.
- `stepsLog` entries carry an `attempt` number (and `recoveryMs` when a selector was recovered) on top of the
  contract fields, so a retried run shows both tries.
