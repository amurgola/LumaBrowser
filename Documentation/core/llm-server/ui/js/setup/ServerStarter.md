# ServerStarter

`core/llm-server/ui/js/setup/ServerStarter.js`

Starts the LLM server idempotently.

## Methods

- `ServerStarter.startIdempotent(api)` resolves `{ ok: true }` when
  `startServer()` succeeds. A refusal matching `ALREADY_RUNNING_RE` ("Cannot
  start: server is ready/starting") is what setup wanted, so it calls
  `restartServer()` when offered (a just-changed default model takes effect;
  a failed restart is ignored) and resolves `{ ok: true, alreadyRunning: true }`.
  Any other failure is `{ ok: false, message }` ("Server failed to start" when
  the reply has no error).

## Globals

None.
