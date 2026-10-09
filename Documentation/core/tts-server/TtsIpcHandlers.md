# TtsIpcHandlers

`core/tts-server/TtsIpcHandlers.js`

IPC controller for the text-to-speech half of voice mode. Routes only.

## Methods

- `TtsIpcHandlers.register(service)` registers, on `ipcMain`, with `service` the
  TtsServerService:
  - `core.voiceServer.tts.getView` -> `{ success, ...service.getView() }`
  - `core.voiceServer.tts.installRuntime` -> `new SherpaRuntimeInstaller().install`,
    progress on `VoiceChannels.VOICE_EVENT_CHANNEL` (`scope: 'tts-runtime'`,
    `id: 'tts-sherpa'`); failures carry `code` and `detail` (null when absent)
  - `core.voiceServer.tts.downloadModel(id)` -> `service.downloadModel`, progress
    with `scope: 'tts-model'`
  - `core.voiceServer.tts.cancelDownload` -> `{ canceled }`
  - `core.voiceServer.tts.setDefaults(patch)` -> `setDefaultModelId`, `setSid`,
    `setSpeed` for the fields present
  - `core.voiceServer.tts.prewarm` -> `{ success, ...service.ensureRunning() }`,
    failures carry `code`
  - `core.voiceServer.tts.stop`
  - `core.voiceServer.synthesize(args)` -> `TtsSynthesisStreams#start`,
    failures carry `code`
  - `core.voiceServer.ttsAbort(requestId)` -> `{ success: true, found }`
- `TtsIpcHandlers._withErrorFields(fields, fn)` is `IpcEnvelope.enveloped` plus
  null-filling of the named error fields.

## Why

Both voice halves render into one setup panel, so an installer failure must
carry the same `code` and `detail` keys on both sides (legacy bug M29: the TTS
handler dropped `detail`). The STT half reports `null` for absent fields, hence
the null-filling.
