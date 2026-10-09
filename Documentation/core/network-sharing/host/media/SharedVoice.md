# SharedVoice

`core/network-sharing/host/media/SharedVoice.js`

The host's speech engines (whisper.cpp STT, sherpa-onnx TTS) as offered to
shared chat clients. Errors carry the desktop IPC's codes so the shared voice
controller shows the same setup panel.

## Methods

- `new SharedVoice(service)` (`getShareFlags`, `getVoiceServices`).
- `engines()`: `{ stt, tts }` when either exists, else null.
- `gate()`: 403 `VOICE_NOT_SHARED` when `shareVoice` is false, 503
  `VOICE_UNAVAILABLE` without engines, else null. Bodies `{ success: false, error, code }`.
- `status()`: `{ success: true, shared, stt, tts }` with [VoiceViews](VoiceViews.md); never a 403.
- `prewarm()`: `ensureRunning()` on both halves, each `{ ok: true }` or `{ ok:
  false, code, error }` (`VOICE_UNAVAILABLE` for a missing half).
- `transcribe(req)`: 503 without an STT engine; 400 when
  [VoiceAudioInput](VoiceAudioInput.md) finds under 100 bytes; else `{ success:
  true, text, durationMs }`, or the engine error with `errorStatus`.
- `synthesisRefusal(text)`: 503 without a TTS engine, 400 `text is required`,
  503 `TTS_RUNTIME_MISSING`, 503 `NO_TTS_MODEL` (in that order), else null.
- `SharedVoice.errorStatus(err)`: 503 for `NO_STT_MODEL`, `STT_RUNTIME_MISSING`,
  `NO_TTS_MODEL`, `TTS_RUNTIME_MISSING`; else 500.
