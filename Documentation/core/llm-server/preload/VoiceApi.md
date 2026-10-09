# VoiceApi

`core/llm-server/preload/VoiceApi.js`

llmDiagAPI section `voice`: local speech-to-text and text-to-speech for voice conversation mode and read aloud, the OS microphone checks, and the setup surfaces of both engines with their event streams.

A [PreloadSection](PreloadSection.md) merged into `window.llmDiagAPI` by
[LlmTabPreloadApi](LlmTabPreloadApi.md). Subscriptions return their detach.

## Members

| Member | IPC |
|---|---|
| `voice.transcribe(wav, opts)` | invoke `core.voiceServer.transcribe` |
| `voice.synthesize(args)` | invoke `core.voiceServer.synthesize` |
| `voice.synthesizeAbort(requestId)` | invoke `core.voiceServer.ttsAbort` |
| `voice.micAccessStatus()` | invoke `core.voiceServer.micAccessStatus` |
| `voice.openMicPrivacySettings()` | invoke `core.voiceServer.openMicPrivacySettings` |
| `voice.stt.getView()` | invoke `core.voiceServer.stt.getView` |
| `voice.stt.installRuntime(id)` | invoke `core.voiceServer.stt.installRuntime` |
| `voice.stt.downloadModel(id)` | invoke `core.voiceServer.stt.downloadModel` |
| `voice.stt.cancelDownload()` | invoke `core.voiceServer.stt.cancelDownload` |
| `voice.stt.setDefaultModel(p)` | invoke `core.voiceServer.stt.setDefaultModel` |
| `voice.stt.setLanguage(l)` | invoke `core.voiceServer.stt.setLanguage` |
| `voice.stt.prewarm()` | invoke `core.voiceServer.stt.prewarm` |
| `voice.stt.stop()` | invoke `core.voiceServer.stt.stop` |
| `voice.tts.getView()` | invoke `core.voiceServer.tts.getView` |
| `voice.tts.installRuntime()` | invoke `core.voiceServer.tts.installRuntime` |
| `voice.tts.downloadModel(id)` | invoke `core.voiceServer.tts.downloadModel` |
| `voice.tts.cancelDownload()` | invoke `core.voiceServer.tts.cancelDownload` |
| `voice.tts.setDefaults(patch)` | invoke `core.voiceServer.tts.setDefaults` |
| `voice.tts.prewarm()` | invoke `core.voiceServer.tts.prewarm` |
| `voice.tts.stop()` | invoke `core.voiceServer.tts.stop` |
| `voice.onVoiceEvent(cb)` | subscribe `core.voiceServer.event` |
| `voice.onTtsEvent(cb)` | subscribe `core.voiceServer.ttsEvent` |
