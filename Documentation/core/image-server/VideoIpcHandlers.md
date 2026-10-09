# VideoIpcHandlers

`core/image-server/VideoIpcHandlers.js`

IPC controller for video generation (`core.videoGen.*`). Routes only. Models,
downloads, runtimes and defaults are shared with `core.imageServer.*`
([ImageIpcHandlers](ImageIpcHandlers.md)): video models live in the same models
directory and the video default is the `videoModelId` image default.

## Methods

- `VideoIpcHandlers.register(service, { notify })` builds a
  [VideoRouter](VideoRouter.md), registers the channels below and relays the
  video slot's `state-change` and `log` events to every renderer on
  `core.videoGen.serverEvent` `{ type, payload }`. Returns `{ router }` for the
  chat agent bridge (`generate_video`, `animate_image`). `service` is the
  ImageServerService.

| Channel | Routed to |
|---|---|
| `getServerStatus` (raw) | `service.videoRuntimeServer.getStatus()`; a throw is `{ state: 'idle', error }` |
| `stopServer` | `{ status: await videoRuntimeServer.stop() }` (the video slot only) |
| `generate` | `ImageGenerationRequests#generate` over the VideoRouter; events on `core.videoGen.videoEvent` `{ requestId, type, payload }` |
| `generateAbort` | `router.abort()` |

All but `getServerStatus` are `IpcEnvelope.enveloped`.
