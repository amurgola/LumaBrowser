# CollectedCompletion

`core/llm-server/chat/router/CollectedCompletion.js`

Runs one dispatch to completion and resolves with the whole reply text.

## Methods

- `new CollectedCompletion(dispatch)`.
- `run({ modelRef, messages, temperature, images = [], extra = null, timeoutMs, timeoutMessage })`: resolves the concatenated deltas on done; rejects on a model error (non-Errors wrapped), a rejected or throwing dispatch, or after `timeoutMs` with `timeoutMessage` (latched before the stream is aborted, so a terminal the abort provokes cannot win). A handle arriving after the end is aborted.

## Why

Side completions and title generation had copies of the same promise.
