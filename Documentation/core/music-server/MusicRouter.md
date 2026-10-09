# MusicRouter

`core/music-server/MusicRouter.js`

The one entry point for music generation. Sibling of the video router: resolves
the model, makes the supervisor serve it ([MusicServerGate](MusicServerGate.md)),
calls [SglOmniAdapter](server/SglOmniAdapter.md) and reports events on the shared
per-request IPC shape.

## Methods

- `new MusicRouter({ musicServerService, notify?, catalog? })` throws
  `MusicRouter: musicServerService is required`. The service provides
  `server` (`getStatus`, `waitUntilSettled`, `markActive`, `stop`),
  `getDefaults()` (`modelId`, `seed`) and `startServerResolved(modelId)`.
  `notify(message, level)` is the toast hook. `catalog` defaults to
  `new MusicModelCatalog()`.
- `generate({ lyrics, instructions, modelRef?, durationSec?, seed?, send })`
  resolves `{ success, audio?, error?, aborted? }`. A new call aborts the one in
  flight. Refusals: `lyrics is required`,
  `instructions (style description) is required`,
  `Music model "<id>" not found. Pick one in Music Setup.`, and any server-gate error.
- `abort()` aborts the active generation and returns `{ success: true }`.
- `MusicRouter.HEARTBEAT_MS` is 10 s.

## Events (`send(type, payload)`)

- `status { phase }`: `starting-server`, `switching-model` (both from the gate), `generating`
- `meta { modelId, runtimeId, port, seed, maxNewTokens }`
- `progress { elapsedMs }`: heartbeat while the song renders
- `done { audio: { b64, mime, sampleRate, durationSec }, modelId }`
- `error { message }`: `aborted` after an abort

## Why

- Model order: the explicit ref, then the service default, then the first catalog row.
- Generation is non-streaming (the whole WAV in one response), so the
  heartbeat keeps a multi-minute render from reading as a hang.
- The request `model` is `plan.apiModelName` (the exact `--model-path` the
  server registered), falling back to the catalog's `apiModelName`, then the id,
  for statuses from before that field existed.
- Duration and seed maths live in [MusicGenerationParams](MusicGenerationParams.md).
