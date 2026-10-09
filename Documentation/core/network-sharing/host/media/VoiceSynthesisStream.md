# VoiceSynthesisStream

`core/network-sharing/host/media/VoiceSynthesisStream.js`

`POST /sharing/voice/synthesize`: one text chunk in, PCM out as NDJSON.

## Methods

- `new VoiceSynthesisStream(service)`; `run(req, res)`.

## Behaviour

1. `SharedVoice.synthesisRefusal(text)` answers JSON before any stream.
2. Streams `application/x-ndjson`: `{ type: 'chunk', payload: { seq,
   sampleRate (default 24000), pcm: base64 Int16 LE } }` per engine chunk,
   then `{ type: 'done', payload: { canceled } }` or `{ type: 'error', payload:
   { message, code } }`.
3. `tts.synthesize({ text, sid, speed }, onChunk)` throwing synchronously
   sends the error line and ends.
4. The response closing before the end cancels the synthesis (`tts.cancel(handle.id)`).
