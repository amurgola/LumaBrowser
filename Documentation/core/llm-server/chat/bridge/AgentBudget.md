# AgentBudget

`core/llm-server/chat/bridge/AgentBudget.js`

Resolves a chat mode's requested agent-run budget against the defaults and
ceilings.

## Methods (all static)

- `resolve(req, { nativeTools = false })` returns AgentRunner run options
  `{ maxIterations, timeout, maxParallelToolCalls, carriedReasoning }`. `req`:
  `{ maxIterations?, timeoutMs?, noTimeout?, maxParallelToolCalls?,
  reasoningCharsPerStep?, reasoningCharsTotal? }`.
  - iterations: `max(24, req)` capped at `MAX_ITERATIONS` (100); junk counts as 0.
  - timeout: `max(8 min, req)` capped at `MAX_TIMEOUT_MS` (45 min), or
    `Infinity` with `noTimeout: true`.
  - pool: `ToolConcurrency.resolveMaxParallel(req, fallback)` where the
    fallback is `NATIVE_MAX_PARALLEL_TOOL_CALLS` for a native-tool model,
    else `DEFAULT.maxParallelToolCalls`.
  - `carriedReasoning`: `{ charsPerStep, charsTotal }` (missing ones
    `undefined`), or null when neither is asked.
- `maxMalformedReprompts(budget)`: `min(12, max(3, ceil(maxIterations / 4)))`.
- Constants: `DEFAULT` (`maxIterations` 24, `timeoutMs` 8 min,
  `maxParallelToolCalls` the ToolConcurrency default), `MAX_ITERATIONS`,
  `MAX_TIMEOUT_MS`, `MIN_MALFORMED_REPROMPTS`, `MAX_MALFORMED_REPROMPTS`.

## Why

A mode can only RAISE the budget, so it cannot quietly starve its own turn;
the pool is the exception because 1 is the kill switch. `noTimeout` is an
explicit flag rather than `timeoutMs: 0`: a productive 31-minute build is not
failing, and the run stays bounded by iterations, per-completion timeouts and
Stop. Re-prompts scale with the run because a flat 3 ended long builds on
transient truncation.
