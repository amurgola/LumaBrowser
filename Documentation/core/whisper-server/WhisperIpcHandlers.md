# WhisperIpcHandlers

`core/whisper-server/WhisperIpcHandlers.js`

IPC controller for the speech-to-text half of voice mode. Routes only.

## Methods

- `WhisperIpcHandlers.register(service, { platform? })` registers, on `ipcMain`,
  with `service` the [WhisperServerService](WhisperServerService.md)
  (`platform` defaults to `process.platform`, a test seam):
  - `core.voiceServer.stt.getView` -> `{ success, ...await service.getView() }`
  - `core.voiceServer.stt.installRuntime(id)` -> `sherpa-onnx`
    (`WhisperServerService.SHERPA_RUNTIME_ID`): `new SherpaRuntimeInstaller().install`,
    the same addon the TTS half installs; otherwise a `RuntimeInstaller` over
    `WhisperRuntimeCatalog` (`LumaBrowser-VoiceSetup`, `stt-inference`,
    `speech-to-text`). Progress on `VoiceChannels.VOICE_EVENT_CHANNEL` with
    `scope: 'stt-runtime'` and the id; failures carry `code` and `detail` (null when absent)
  - `core.voiceServer.stt.downloadModel(id)` -> `service.downloadModel`, progress
    with `scope: 'stt-model'`
  - `core.voiceServer.stt.cancelDownload` -> `{ canceled }`
  - `core.voiceServer.stt.setDefaultModel(modelPath)`, `core.voiceServer.stt.setLanguage(language)`
  - `core.voiceServer.stt.prewarm` -> `{ success, ...service.ensureRunning() }`,
    failures carry `code`
  - `core.voiceServer.stt.stop`
  - `core.voiceServer.micAccessStatus` -> `{ status }`: macOS reads
    `systemPreferences.getMediaAccessStatus('microphone')` and asks once when
    `not-determined` (`granted` or `denied`); Windows reads the status; elsewhere `granted`
  - `core.voiceServer.openMicPrivacySettings` -> opens `ms-settings:privacy-microphone`
    (Windows) or the macOS Privacy_Microphone pane; elsewhere
    `{ success: false, error: 'No microphone privacy panel on this platform' }`
  - `core.voiceServer.transcribe({ wav, language })` -> `service.transcribe(toAudioBuffer(wav), { language })`,
    failures carry `code`
- `WhisperIpcHandlers.toAudioBuffer(wav)` base64 string, `ArrayBuffer` or typed
  array view to a `Buffer`; anything else is returned as is.
- Statics: `PRIVACY_SETTINGS_URLS`, `NO_PRIVACY_PANEL_ERROR`.

## Why

Both voice halves render into one setup panel, so failures carry the same
`code` and `detail` keys as [TtsIpcHandlers](../tts-server/TtsIpcHandlers.md)
(legacy bug M29). OS privacy settings can block the whole app even when
Chromium grants the microphone; the status lets the picker say "Windows is
blocking this app" instead of showing a dead level meter.
