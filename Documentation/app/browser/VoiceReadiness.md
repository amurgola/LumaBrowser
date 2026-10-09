# VoiceReadiness

`app/browser/VoiceReadiness.js`

Whether voice input and output are usable (runtime ready and a model present),
for the Luma On Demand panel.

## Methods

- `new VoiceReadiness({ stt, tts })`: the WhisperServerService and TtsServerService.
- `sttReady()` the last known speech-to-text answer; each read starts a refresh.
- `refreshStt()` awaits `stt.getView()` (one refresh in flight) and resolves the
  fresh answer; a failing view means not ready.
- `ttsReady()` reads the synchronous TTS view.
- `VoiceReadiness.isReady(view)`: `runtimeReady` and at least one model.

## Why

`WhisperServerService.getView()` became async in the rebuild, while
OnDemandOverlay reads `sttReady()` synchronously inside `state()`. Legacy's
inline `whisperServerService.getView()` would now return a promise, which reads
as "not ready" forever (the change request). The cache is warmed at window
creation and refreshed on every state push.
