# VoiceAudioInput

`core/network-sharing/host/media/VoiceAudioInput.js`

Reads one utterance from a `/sharing/voice/transcribe` request.

## Methods

- `VoiceAudioInput.read(req)`: `{ wav, language }`. A Buffer body (raw
  `audio/wav`) is the WAV with `?language=`; a JSON `{ wav: base64, language? }`
  is decoded, its `language` winning over the query; anything else gives `wav: null`.
- `VoiceAudioInput.isUsable(wav)`: at least `MIN_BYTES` (100).
