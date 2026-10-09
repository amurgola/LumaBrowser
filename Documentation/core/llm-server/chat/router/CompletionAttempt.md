# CompletionAttempt

`core/llm-server/chat/router/CompletionAttempt.js`

One try of an agent-loop completion.

## Methods

- `new CompletionAttempt({ dispatch, nativeTools, stallTimeoutMs, ctl, sinks })`; `sinks` `{ onStatus, onToken, onReasoningToken, onUsage, onTimings }` (each optional, errors swallowed).
- `run(modelRef, messages, temperature, images, tools, extra)` resolves once, never rejects: `{ success: true, response: { choices: [{ message: { content, reasoning_content } }] }, stopReason, finishReason }` or `{ success: false, error }`. Terminal `usage` and `timings` go to their sinks. A native-tools model's `summary.toolCalls` become ```tool fences (`HarmonyToolFence.build`, cut when the finish reason is `length`). The stall timer (off when `<= 0`) is pushed by every token, reasoning, usage or status and ends in `completion stalled: no output for Ns` plus an abort. A `ctl` already aborted when dispatch resolves cancels at once; otherwise `ctl.onHandle({ abort })` gets a handle whose abort stops the stream and resolves `aborted`. Deltas after the end are dropped.

## Why

Adapters go silent after an abort, so the cancel itself must resolve the attempt; a stall, not a wall clock, so a long but live generation is never cut.
