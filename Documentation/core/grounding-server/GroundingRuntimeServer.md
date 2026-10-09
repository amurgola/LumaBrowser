# GroundingRuntimeServer

`core/grounding-server/GroundingRuntimeServer.js`

Supervises the grounding model's llama-server. Extends
[BaseRuntimeServer](../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`).

## Methods

- `GroundingRuntimeServer.findFreePort(opts)` a free port in the `grounding`
  window (`GroundingRuntimeServer.PORT_RANGE`, 8200-8219).
- Hooks: `_logTag` `[grounding-server]`, `_processNoun` `grounding llama-server`,
  `_loadingLabel` `grounding model`, `_healthCheck` true only for a 200 from
  `GET /health` on 127.0.0.1 (1.5 s).

## Why

llama-server answers `/health` with 200 only once the model is loaded.
