# TriggerEvents

`app/events/TriggerEvents.js`

The trigger event emitter the trigger runner, the trigger mode and the LLM IPC
handlers share.

## Methods

- `new TriggerEvents({ renderers, getFileWatch, getSources, setTimeoutFn? })`.
  `getFileWatch()` returns the [FileWatchSource](../../core/llm-server/chat/triggers/FileWatchSource.md)
  or null; `getSources()` the page-change and notification sources (either may
  be null).
- `emit(type, payload)` sends `{ type, payload }` on `core.llmServer.triggers.event`
  to every renderer. On `triggers-changed` it schedules one reconcile 50 ms out
  (a burst of changes reconciles once): `fileWatch.reconcile()`, then
  `ensureSubscribed()` on each source, each step isolated.
- `emitter()` the `(type, payload)` function to hand out.

## Why

Any trigger change can start, stop or re-create a folder watch or a source
subscription; reconciling from the event keeps them in step without every
caller knowing about the watches.
