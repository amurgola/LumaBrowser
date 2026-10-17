# RequestSettings

`core/llm-server/chat/router/RequestSettings.js`

Applies a model's (or profile's) request overrides to one model call. Used by [ModelDispatcher](ModelDispatcher.md).

## Methods

All static.

- `apply({ settings, temperature, extra, callType })` returns `{ temperature, extra }`. A numeric `settings.temperature` replaces the caller's temperature and adds `pinTemperature: true` to extra, except for the `HOUSEKEEPING` call types (`compact`, `title`), which keep their own. A numeric `settings.maxReplyTokens` rides as `extra.maxReplyTokens` on every call. With nothing to apply, extra is returned as given (null stays null).
- `maxTokens(extra)`: the smaller of `extra.maxTokens` (the agent loop's window-sized cap) and `extra.maxReplyTokens` (the user's), counting only positive numbers; undefined when neither.

## Why

The user chose that a temperature they set on a model or profile beats the hardcoded per-mode and agent-loop temperatures; `pinTemperature` also stops the model family's tuned temperature from overriding it in the local body. Compaction summaries and titles are housekeeping, so they stay at their deliberately low temperatures.
