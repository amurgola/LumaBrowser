# AgentBudget

`core/llm-server/chat/bridge/AgentBudget.js`

Resolves a chat mode's requested agent-run budget against the defaults and
ceilings.

## Methods (all static)

- `resolve(req, { nativeTools = false })` returns AgentRunner run options
  `{ maxIterations, timeout, maxParallelToolCalls, carriedReasoning }`. `req`:
  `{ maxIterations?, timeoutMs?, noTimeout?, userTimeoutMs?, userMaxIterations?,
  maxParallelToolCalls?, reasoningCharsPerStep?, reasoningCharsTotal? }`.
  - iterations: `max(floor, min(MAX_ITERATIONS (100), req.maxIterations))`
    where the floor is `userMaxIterations` when that is a finite number of at
    least 0, else 24; junk counts as 0.
  - timeout: `max(floor, min(MAX_TIMEOUT_MS (45 min), req.timeoutMs))` where
    the floor is `userTimeoutMs` when finite and at least 0, else 8 min; a
    floor of 0 is `Infinity` (no wall clock), as is `noTimeout: true`.
  - `userTimeoutMs` and `userMaxIterations` are the model's Tune knobs ("Run
    timeout", "Run steps"), handed down by [ChatTurn](../router/ChatTurn.md)
    through `modelBudget`. They replace the default floor in either direction
    and are not clamped by the mode ceilings; a mode may still raise the run
    above them, never shrink it.
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
the pool is the exception because 1 is the kill switch. The user's own knobs
move the floor instead: a slow local reasoning model needs more than 8 minutes
for an ordinary browser turn, and the person who set that must not be undone
by a mode, while a mode that asked for a longer run (Code) keeps it. `noTimeout` is an
explicit flag rather than `timeoutMs: 0`: a productive 31-minute build is not
failing, and the run stays bounded by iterations, per-completion timeouts and
Stop. Re-prompts scale with the run because a flat 3 ended long builds on
transient truncation.
