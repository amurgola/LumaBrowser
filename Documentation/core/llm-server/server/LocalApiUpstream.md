# LocalApiUpstream

`core/llm-server/server/LocalApiUpstream.js`

What the localhost API ([LocalApiServer](LocalApiServer.md)) sees of the running
chat model. Reads live LLM service state on every call and never starts a model.

## Methods

- `new LocalApiUpstream(llmServerService)`; every service member is optional
  (`runtimeServer`, `getDefaults`, `listInstalledChatModels`,
  `getRunningThinking`) and anything missing or throwing reads as nothing loaded.
- `current()` `{ baseUrl, apiKey, modelId, requestModel? }` only for a `ready`
  server with a port. Address, key and served name come from
  [LocalServerConnection](LocalServerConnection.md)`.of`, as the chat reads them:
  - `baseUrl` from the status host (a WSL child can move hosts), else loopback, and port;
  - `apiKey` the key the server was launched with (the supervisor's `authKey`),
    else null, so a key changed in settings while it runs cannot desync;
  - `modelId` the file stem of `status.modelPath`, else `plan.modelPath`, else
    the default model, else `'local'`: the name clients are shown;
  - `requestModel` the running plan's `apiModelName`, present only when the
    runtime serves under its own name (Basalt answers `The model '<name>'
    does not exist` to the file's name).
- `LocalApiUpstream.requestModel(upstream)`: the model name a request to this
  upstream must carry: `requestModel`, else `modelId`. The three routers use it
  for the body they send; replies keep naming `modelId`.
- `hostDial()` `'off'` when the defaults say `noThink`, else `reasoningEffort` or null.
- `getThinking()` `getRunningThinking()` when the service has it, else null.
- `listModels()` installed stems as `{ id }` (the disk scan cached for
  `MODELS_CACHE_MS`, 15 s; a failing scan is empty) with the loaded model first
  as `{ id, current: true }` and not repeated.
