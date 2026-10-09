# LlmCallRecorder

`core/llm-server/chat/trace/LlmCallRecorder.js`

Watches one model call through its dispatch hooks and produces exactly one
[LlmTrace](../LlmTrace.md) record.

## Methods

- `new LlmCallRecorder({ tag, model, requestBody, onRecord })`. The clock starts
  here. `onRecord(conversationId, record)` receives the record.
- `wrap(hooks)` returns `{ ...hooks }` with `onDelta`, `onReasoningDelta`,
  `onUsage`, `onTimings`, `onDone` and `onError` replaced by versions that
  record and then call the original (if any) with the same arguments and
  return its result. Other hooks such as `onStatus` pass through untouched.

## Behaviour

- Text and reasoning accumulate up to `MAX_ACCUMULATED_CHARS` (twice the
  record's text cap). The first text or reasoning chunk sets the time to first
  token.
- `onDone(summary)` takes `usage` and `timings` from the summary when present
  and records `{ text, reasoning?, toolCalls?, finishReason, stopReason }`.
- `onError(err)` records `{ text, reasoning?, error }`.
- Whichever of the two comes first records; later calls do not.
- Usage is normalised from `prompt_tokens`/`completion_tokens` or the camelCase
  forms to `{ promptTokens, completionTokens }`.
- `request` summarises the body: message count, system prompt length (JSON
  length for structured content), tool names (`?` when unnamed) and every other
  body key as `params`.
