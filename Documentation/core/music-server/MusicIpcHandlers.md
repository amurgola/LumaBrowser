# MusicIpcHandlers

`core/music-server/MusicIpcHandlers.js`

IPC controller for the music server. Routes only; the logic lives in the music
server service and [MusicRouter](MusicRouter.md).

## Methods

- `MusicIpcHandlers.register(service, { notify })` registers every channel and
  returns `{ router }` (a new MusicRouter), so main can park the router for the
  chat agent bridge (`generate_music`), like the image and video routers.

## Channels

Setup surface, `core.musicServer.*`:

- `getView({ force })` -> `{ success, platformSupported, enabled, defaults, runtimes, models, status }`
- `getWslStatus()` -> `{ success, applicable: false }` off Windows, else `{ success, applicable: true, wsl }`
- `installRuntime(id)` -> `{ success: true, result }` or
  `{ success: false, error, code, detail }` (code and detail `null` when absent).
  Streams `core.musicServer.runtimeEvent { id, type, payload }`: `start`, the
  installer's events, and `error { message, code, detail }`. The runtimes cache
  is invalidated before `finalize` goes out.
- `cancelInstall()` -> `{ success: true }`; `uninstallRuntime(id)`;
  `checkRuntimeUpdates({ force })` -> `{ success, runtimes }`
- `getModelsView()`; `downloadModel(modelId)` -> the download result with
  `success` forced to a boolean, streaming `core.musicServer.modelEvent
  { modelId, type, payload }` plus `canceled` and `error`; `cancelDownload()`
  (raw service reply); `deleteModel(modelId)`
- `getDefaults()` (raw), `setDefaults(patch)` -> `{ success, defaults }`,
  `setEnabled(v)` -> `{ success, enabled }`
- `getStatus()` -> the service status, or `{ state: 'idle', error }` if it throws
- `stopServer()`

Generate surface, `core.musicGen.*` (a sibling of `core.videoGen.*`):

- `getServerStatus()`, `stopServer()`
- `generate(args)` -> `router.generate({ ...args, send })`, streaming
  `core.musicGen.musicEvent { requestId, type, payload }` (and `error` on a throw)
- `generateAbort()` -> `router.abort()`
- the supervisor's `state-change` and `log` events are broadcast to every
  window as `core.musicGen.serverEvent { type, payload }`.

## Why

Two namespaces mirror the image/video split: setup lives in the Music Setup
view, generation is shared with the chat agent bridge. Failures are also pushed
as `error` events because progress UIs listen to the stream, not the reply.
