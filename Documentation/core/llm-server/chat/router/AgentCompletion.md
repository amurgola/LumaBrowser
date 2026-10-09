# AgentCompletion

`core/llm-server/chat/router/AgentCompletion.js`

One non-streaming completion for the agent loop, with retries.

## Methods

- `new AgentCompletion({ dispatch, nativeToolsActive, isBridgeAborted })`.
- `completeOnce(modelRef, messages, temperature, onStatus, onToken, onReasoningToken, onUsage, onTimings, images = [], tools = null, extra = null, ctl = null)`: up to `MAX_ATTEMPTS` (3); before each, `ctl.isAborted()` (or, without a control, `isBridgeAborted()`) returns `{ success: false, error: 'aborted' }`; a transient failure (`TransientLlmError`) emits `onStatus({ phase: 'retrying', attempt })` and waits `RETRY_STEP_MS * attempt`. Never rejects.
- `attempt(modelRef, messages, temperature, sinks, images, tools, extra, stallTimeoutMs = STALL_TIMEOUT_MS, ctl = null)`: one `CompletionAttempt`, with `nativeToolsActive(modelRef)` read once.
- `STALL_TIMEOUT_MS` 10 minutes.

## Why

The loop fires many back-to-back calls at the local server and one dropped keep-alive socket would kill the run.
