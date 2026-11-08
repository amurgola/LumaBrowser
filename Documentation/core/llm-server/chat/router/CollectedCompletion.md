# CollectedCompletion

`core/llm-server/chat/router/CollectedCompletion.js`

Runs one dispatch to completion and resolves with the whole reply text.

## Methods

- `new CollectedCompletion(dispatch)`.
- `run({ modelRef, messages, temperature, images = [], extra = null, timeoutMs, timeoutMessage, signal = null })`: resolves the concatenated deltas on done; rejects on a model error (non-Errors wrapped), a rejected or throwing dispatch, or after `timeoutMs` with `timeoutMessage` (latched before the stream is aborted, so a terminal the abort provokes cannot win). When `signal` aborts it rejects with `CollectedCompletion.abortError()` (name `AbortError`) and aborts the stream, freeing the model; an already aborted signal never dispatches. A handle arriving after the end is aborted.

## Why

Side completions and title generation had copies of the same promise.
