# ShimVoice

`core/network-sharing/webapp/public/js/shim/ShimVoice.js`

The desktop's `llmDiagAPI.voice` surface over `/sharing/voice`, driven by
[VoiceController](../../../../../llm-server/ui/js/voice/VoiceController.md). The
device captures and plays audio; the host's engines do the speech work.

## Methods

- `new ShimVoice(api)`; `surface()` returns `{ remote: true, transcribe,
  synthesize, synthesizeAbort, onTtsEvent, onVoiceEvent (no-op), stt, tts }`.
  `stt`/`tts` have `getView` and `prewarm`; their setup actions
  (`installRuntime`, `downloadModel`, `cancelDownload`, `setDefaultModel`,
  `setLanguage` / `setDefaults`, `stop`) resolve `ShimVoice.HOST_ONLY`
  (`code: 'HOST_ONLY'`).
- `transcribe(wav, opts)`: the host reply, or `{ success: false, error }`.
- `synthesize({ requestId?, text, sid, speed })`: streams; PCM chunks and the
  terminal `done`/`error` go to `onTtsEvent` listeners keyed by `requestId`.
  Resolves `{ success: true, requestId }`, or `{ success: false, error, code, requestId }`
  when the engine failed before any audio (not aborted).
- `synthesizeAbort(requestId)`: `{ success: true, found }`.
- `view(half)`: `{ success: true, shared, ...status[half] }`; `shared: false`
  keeps the engines not-ready so the controller opens its remote setup panel.
