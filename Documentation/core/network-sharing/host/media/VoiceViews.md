# VoiceViews

`core/network-sharing/host/media/VoiceViews.js`

Readiness views of the host's voice engines, trimmed to what a remote client
needs: ids, names and states, never model paths or directories.

## Methods

- `VoiceViews.stt(service)`: `{ runtimeReady, models: [{ id, name }],
  language (default 'auto'), serverState }`, or `{ runtimeReady: false, models: [] }`
  without a `getView`.
- `VoiceViews.tts(service)`: `{ runtimeReady, platformSupported, models: [{ id,
  name, engine }], modelCatalog: [{ id, name, quality, sizeBytes, description }],
  defaultModelId, workerState }`, or the not-ready shape.
- `notSharedStt()`, `notSharedTts()`: the not-ready shapes.
