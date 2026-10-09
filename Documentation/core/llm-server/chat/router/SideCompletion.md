# SideCompletion

`core/llm-server/chat/router/SideCompletion.js`

One-shot side completions for extension chat modes and AI-fill fields (`context.chat.complete` and its streaming twin).

## Methods

- `new SideCompletion({ dispatch, models })`; `models` is a ChatModelList.
- `complete({ messages, temperature = 0.2, modelRef, timeoutMs = 30000, noThink = false, images = [], trace = null })` resolves `{ text }` or `{ error }` (`messages is required`, `No model configured.`, `complete timeout`, the model's error). `noThink` applies `ThinkingOff.resolve` (body knobs and in-message directive). Image attachments are filtered with `MessageImages.imagesOf`. The trace tag defaults to `{ conversationId: null, callType: 'side' }`. Up to `ATTEMPTS` (3), `RETRY_DELAY_MS` apart, while the error is transient.
- `completeStream({ messages, temperature = 0.9, modelRef, timeoutMs = 300000, noThink = false }, ext)` returns `{ abort }` synchronously; `ext.onDelta`, `ext.onReasoning`, `ext.onDone(fullText)`, `ext.onError(err)`. An abort ends as `onDone` with the partial text. Argument errors go to `onError` with a no-op handle.

## Why

Bug M14: noThink must send both levers, because some Qwen templates ignore the body knobs. Never persisted and never touching the in-flight turn, so a mode's post-turn reaction cannot disturb the chat.
