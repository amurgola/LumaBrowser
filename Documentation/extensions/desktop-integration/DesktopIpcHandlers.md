# DesktopIpcHandlers

`extensions/desktop-integration/DesktopIpcHandlers.js`

IPC controller of the Desktop Integration settings tab. Every channel is
`ext.desktop-integration.<name>` with the `{ success, ...payload }` /
`{ success: false, error }` envelope
([IpcEnvelope](../../core/shared/ipc/IpcEnvelope.md)).

## Channels

- `getInfo` -> the public API's `info()`.
- `rotateToken` -> `{ token }`.
- `setFeatureEnabled(id, enabled)` -> `{ feature }`.
- `setFeatureSetting(id, key, value)` -> `{ feature }`.
- `speechState(update)` -> `{ accepted }`: the renderer's SpeechPlayer reporting playback to `speech.report`.
- `listClients` -> `{ clients }`.
- `clearClients` -> `{ cleared }`.

Feature modules register their own channels through `deps.ipc`, under
`ext.desktop-integration.<featureId>.*`.
