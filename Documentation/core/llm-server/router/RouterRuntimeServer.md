# RouterRuntimeServer

`core/llm-server/router/RouterRuntimeServer.js`

Supervises the tool-group router's own llama-server: a tiny CPU-only model that
stays resident beside the chat model. Extends
[BaseRuntimeServer](../../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`).

## Methods

- `RouterRuntimeServer.findFreePort(opts)` a free port in the `router` window
  (`RouterRuntimeServer.PORT_RANGE`, 8180-8199).
- Hooks: `_logTag` `[group-router]`, `_processNoun` `router llama-server`,
  `_loadingLabel` `router model`, `_healthCheck` true when `GET /health` on
  127.0.0.1 answers 200 (1.5 s; llama-server answers 503 while loading).
- Everything else is inherited.
