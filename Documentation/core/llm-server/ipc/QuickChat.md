# QuickChat

`core/llm-server/ipc/QuickChat.js`

The Setup tab's quick chat straight against the running local server.

## Methods

- `new QuickChat({ llmServerService, chatRouter, catalog?, adapters? })` (defaults
  `LlmRuntimeCatalog.shared`, `ChatAdapterRegistry`).
- `start({ messages, temperature }, send)` returns `{ success: true }` once streaming
  starts. Throws `Server is <state>, not ready.` (also without a port) and
  `Catalog entry for <runtimeId> not found.`. Aborts the previous quick chat, then
  streams through the runtime's adapter at `http://<host or 127.0.0.1>:<port>` with
  the supervisor's launch-time `authKey` and the plan's `apiModelName`: `delta`,
  `reasoning-delta`, `done` (summary or `{}`), `error { message }`.
- `abort()` aborts the live quick chat.
- `abortAll()` aborts it and the router's turn; returns `{ success: true }`.

## Why

The key the supervisor was launched with, not the current setting, so a rotated
key never 401s a live server.
