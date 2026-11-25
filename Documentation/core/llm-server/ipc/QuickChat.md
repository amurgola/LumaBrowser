# QuickChat

`core/llm-server/ipc/QuickChat.js`

The Setup tab's quick chat straight against the running local server.

## Methods

- `new QuickChat({ llmServerService, chatRouter, catalog?, adapters? })` (defaults
  `LlmRuntimeCatalog.shared`, `ChatAdapterRegistry`).
- `start({ messages, temperature }, send)` is async and resolves `{ success: true }`
  once streaming starts. Rejects with `Server is <state>, not ready.` (also without a port) and
  `Catalog entry for <runtimeId> not found.`. The runtime is the running plan's
  (`runtimeServer.getStatus().plan.runtimeId`), else the stored `defaults.runtimeId`
  for a plan that names none. Then `llmServerService.reclaimCard()` (when the
  service has it) takes back a hotswap card a pool member displaced the server
  from. Aborts the previous quick chat, then
  streams through the runtime's adapter at `http://<host or 127.0.0.1>:<port>` with
  the supervisor's launch-time `authKey` and the plan's `apiModelName`
  ([LocalServerConnection](../server/LocalServerConnection.md)`.of`): `delta`,
  `reasoning-delta`, `done` (summary or `{}`), `error { message }`.
- `abort()` aborts the live quick chat.
- `abortAll()` aborts it and the router's turn; returns `{ success: true }`.

## Why

The key the supervisor was launched with, not the current setting, so a rotated
key never 401s a live server. The adapter follows the running plan for the same
reason: the server speaks the protocol of the runtime it was started on.
