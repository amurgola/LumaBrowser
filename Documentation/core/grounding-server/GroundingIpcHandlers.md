# GroundingIpcHandlers

`core/grounding-server/GroundingIpcHandlers.js`

IPC controller for the managed grounding server (LLM tab, Visual grounding
card). Routes only; model choice and slot routing live in
[GroundingModelSelection](GroundingModelSelection.md).

## Methods

- `GroundingIpcHandlers.register({ groundingServerService, llmService })`
  registers every channel below as `IpcEnvelope.enveloped`.

| Channel `core.groundingServer.*` | Routed to |
|---|---|
| `getView` | `svc.getView()` |
| `setModel` | `GroundingModelSelection#setModel(sel)` |
| `pickModel` | `GroundingModelSelection#pickModel()` (dialog parented to the caller via PathPicker) |
| `downloadRecommended` | `GroundingModelSelection#downloadRecommended(id, emit)`; progress on `core.groundingServer.event` `{ scope: 'grounding-model', id, type, payload }` |
| `cancelDownload` | `svc.cancelDownload()` |
| `setAutoUnload` | `svc.setAutoUnloadMs(ms)` |
| `start` | `svc.ensureRunning()` |
| `stop` | `svc.stop()` |

Statics `EVENT_CHANNEL`, `DOWNLOAD_SCOPE`.
