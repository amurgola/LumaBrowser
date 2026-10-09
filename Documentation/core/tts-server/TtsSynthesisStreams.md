# TtsSynthesisStreams

`core/tts-server/TtsSynthesisStreams.js`

Streams each renderer synthesize request's audio back to that renderer and maps
renderer request ids to service synthesis ids so an abort finds its target.

## Methods

- `new TtsSynthesisStreams(service)`; `service.synthesize({ text, sid, speed }, onChunk)`
  returns `{ id, done }`, and `service.cancel(id)` stops one.
- `start(event, args)` returns `{ requestId }` at once (`args.requestId`, or a
  minted `tts-req-<ms>`). Events go to `event.sender` on
  `VoiceChannels.TTS_STREAM_CHANNEL` as `{ requestId, type, payload }`: `chunk`
  per PCM chunk, then `done { canceled }` or `error { message }`. A throwing
  `synthesize` propagates to the caller.
- `abort(requestId)` cancels the mapped synthesis and returns `{ found }`; the
  mapping is dropped when the synthesis settles.

## Why

Synthesis is streaming so the renderer can start playback before generation
finishes. The renderer mints request ids the way the chat does, but the service
has its own ids, hence the map. Events to a closed window are dropped silently
(`SenderStream`).
