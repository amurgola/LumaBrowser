# MicPreference

`core/llm-server/ui/js/voice/MicPreference.js`

The chosen microphone (`localStorage` `lumaVoice.micDeviceId`) and opening a
stream with echo cancellation, noise suppression and auto gain. A stale saved
device falls back to the default and is forgotten; an explicit pick surfaces
its failure.

## Methods

- `savedId()`, `save(id)` (`''` is the system default), `openStream(deviceId?)`.
