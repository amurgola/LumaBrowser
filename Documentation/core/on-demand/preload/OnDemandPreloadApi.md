# OnDemandPreloadApi

`core/on-demand/preload/OnDemandPreloadApi.js` (entry: `core/on-demand/on-demand-preload.js`)

The On Demand panel's `window.onDemandAPI`. The view is unsandboxed
(OnDemandWindowFactory: `sandbox: false`), so the entry requires this class.

## Methods

- `OnDemandPreloadApi.expose(contextBridge, ipcRenderer)`, `build(ipcRenderer)`.
  Subscriptions come from [IpcSubscription](../../shared/ipc/IpcSubscription.md)
  (detach removes only its listener).

## Surface

- Lifecycle (sends): `ready`, `drag(dx, dy)`, `dragEnd`, `setExpanded(expanded)`
  (`on-demand:*`); `getState()` (invoke), `onState(cb)`.
- Conversation: `send(args)`, `abort()`, `history()`, `onChatEvent(cb)`.
- `voice`: `transcribe(wav, opts)`, `synthesize(args)`, `synthesizeAbort(id)`,
  `micAccessStatus`, `sttPrewarm`, `ttsPrewarm` (the shared
  `core.voiceServer.*` handlers) and `onTtsEvent(cb)` on
  `VoiceChannels.TTS_STREAM_CHANNEL` (required from core/shared/ipc, so the
  channel can no longer drift).

## Packaging

Required by a preload: must ship as plain JS together with
`core/shared/ipc/VoiceChannels.js` and `core/shared/ipc/IpcSubscription.js` (change request in the wave report).
