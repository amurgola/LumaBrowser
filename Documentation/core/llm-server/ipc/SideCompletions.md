# SideCompletions

`core/llm-server/ipc/SideCompletions.js`

One-shot side completions for mode setup forms, never stored and never touching
the in-flight turn.

## Methods

- `new SideCompletions(chatRouter)`.
- `complete(args)` `router.complete({ messages, temperature, modelRef, timeoutMs, noThink })`
  -> `{ success: true, text }`, or `{ success: false, error }` (`completion failed` when none).
- `start(args, send)` `router.completeStream(...)` streaming `delta`, `reasoning`,
  `done { text }` and `error { message }`; the handle is kept by `requestId`
  until it ends. `requestId is required` otherwise.
- `abort(requestId)` aborts and forgets a live stream; always `{ success: true }`.
- `SideCompletions.request(args)` the five forwarded fields.

## Why

The stream rides the chat event channel under the caller's own requestId, so it
never collides with a live turn; an abort ends as a normal `done` with the
partial text, which the AI-fill field keeps.
