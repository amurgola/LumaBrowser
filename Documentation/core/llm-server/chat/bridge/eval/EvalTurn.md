# EvalTurn

`core/llm-server/chat/bridge/eval/EvalTurn.js`

One eval or gambit turn, driven through the router's production `chat()` with a
capturing sink, so every decision chat() makes applies by construction.

## Methods

- `new EvalTurn(router)`: needs `chat(opts)`, optionally `chatStore` and `abort()`.
- `run({ task, variant = {}, modelRef = null, timeoutMs = TIMEOUT_MS, prompt =
  null, priorMessages = [], conversationId = null, nativeHistory = false,
  nativeTools = null, agentEffort = null, parallel = null, promptExperiments =
  null })` resolves `{ finalResponse, iterations, durationMs, timings,
  turnTimings, toolCalls: [{ tool, params, success, error }], artifacts, error,
  health }`.
  - Conversation id defaults to `eval-<task.id>`; on a first turn (no prior
    messages) it is deleted and recreated hidden (`[eval] <id>`).
  - `chat()` gets the wire history (user/assistant, content stringified) plus
    this turn, `userMessage`, `agent: true` and `evalOverrides`:
    `systemPromptOverride` (variant `buildPrompt` or `systemPrompt`),
    `allowedTools`, `nativeHistory`, `nativeTools` (`'off'` or null),
    `agentEffort`, `parallel` (>1 or null), `promptExperiments` (non-empty or null).
  - A `{ success: false }` result or a throw ends the turn with that error;
    the timeout aborts through `router.abort()` with `eval run timed out after Ns`.
  - Tool calls and artifacts are read from the persisted assistant row; a
    still-`run` entry is a failure. `iterations` falls back to tool calls + 1.
  - `health`: `repetitionAborted`, `timedOut`, `offFormatCalls`,
    `offFormatShapes`, `emptyReply`, `stopReason`, `compactions`,
    `lengthCutCompletions`, `missingArgCalls`, `overflowRecoveries`.
- `EvalTurn.TIMEOUT_MS` (5 minutes).

## Why

The old private path re-resolved chat()'s decisions and drifted five times
(history, artifacts, reasoning budget, reply cap, compaction), each time making
the model look wrong. Serial use only: chat() supersedes an in-flight turn.
