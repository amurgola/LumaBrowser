# VoiceApi

`core/network-sharing/webapp/public/js/transport/VoiceApi.js`

The host's speech engines over `/sharing/voice`. Not-ready engines answer with a
code instead of throwing, so the voice controller can route it to its setup panel.

## Methods

- `new VoiceApi(http)`.
- `status()`: `GET /sharing/voice/status` to `{ shared, stt, tts }`; throws `Voice status unavailable`.
- `prewarm()`: `POST /sharing/voice/prewarm`; resolves its JSON or `{ success: false }`.
- `transcribe(wav, { language? })`: `POST /sharing/voice/transcribe[?language=]`
  as `audio/wav`; resolves the host's JSON or `{ success: false, error: 'Transcription failed (<status>)' }`.
- `synthesize({ text, sid, speed, signal, onChunk })`: `POST /sharing/voice/synthesize`
  (NDJSON). `chunk` events call `onChunk({ seq, sampleRate (default 24000), pcm: Uint8Array })`;
  resolves `{ success: true, canceled }` after `done`, or `{ success: false, error, code }`
  after `error`; a non-OK reply resolves its JSON or `Speech unavailable (<status>)`.
  Aborting the signal cancels synthesis on the host.
- `VoiceApi.base64ToBytes(b64)`.

All 401s throw Unauthorized.
