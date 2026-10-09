# VoiceDownloadProgress

`core/llm-server/ui/js/voice/VoiceDownloadProgress.js`

Shows engine and model download progress from `api.voice.onVoiceEvent` on a
note ("Downloading X: N%", then "Unpacking…").

## Methods

- `listen(api, note, { accept?, label })` returns the unsubscribe function.
