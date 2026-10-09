# WhisperRuntimeServer

`core/whisper-server/server/WhisperRuntimeServer.js`

Supervises one whisper-server child (whisper.cpp's HTTP server). Extends
[BaseRuntimeServer](../../shared/runtime/BaseRuntimeServer.md) (runs
`BaseRuntimeServerContract`).

## Methods

- `WhisperRuntimeServer.findFreePort(opts)` a free port in the `whisper` window
  (`WhisperRuntimeServer.PORT_RANGE`, 8140-8159).
- Hooks: `_logTag` `[whisper]`, `_processNoun` `whisper-server`,
  `_loadingLabel` `voice model`, `_healthCheck` true when `GET /` on 127.0.0.1
  answers any status from 200 to 499 (1.5 s).

## Why

whisper-server serves its demo page at `/` once the model is loaded, so any
non-error answer there means `POST /inference` is ready too.
