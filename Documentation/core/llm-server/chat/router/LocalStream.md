# LocalStream

`core/llm-server/chat/router/LocalStream.js`

Streams one chat request through the managed local server, guarded against a concurrent vision restart.

## Methods

- `new LocalStream({ llmServerService, prep, request })`.
- `stream(wantBasename, messages, temperature, hooks, images = [], tools = null, extra = null)`: awaits `whenVisionSettled()`, holds `beginLocalPrepare()` / `endLocalPrepare()` (each optional) around `prep.prepare(...)` then `request.send(...)` with one `StreamPhaseLog`, and resolves the request's handle. `endLocalPrepare` runs on failure too.

## Why

A vision restart picks a new port, so it must never start between a turn's server check and its POST; once sent, the in-flight count protects it.
