# SglOmniAdapter

`core/music-server/server/SglOmniAdapter.js`

The wire protocol behind `protocol: 'sgl-omni-audio'`: one
`POST /v1/audio/speech` with lyrics and a music-style description, WAV bytes back.

## Methods

- `SglOmniAdapter.generate({ baseUrl, model, lyrics, instructions, seed?, maxNewTokens? })`
  returns `{ promise, abort }`. The body is
  `{ model, input: lyrics, instructions, response_format: 'wav', stream: false }`
  plus `seed` and `max_new_tokens` (truncated) when finite. The promise resolves
  `{ audio: { bytes, mime: 'audio/wav', sampleRate: 32000 } }` and rejects with:
  `Music generation aborted.` (`code: 'ABORTED'`) after `abort()`;
  `Music server request failed: <message>` on a network error;
  `Music server returned <status>: <body or 'no detail'>` on a non-200;
  `Music server returned an empty audio body.` under 64 bytes.
- Statics: `REQUEST_TIMEOUT_MS` (30 min), `MAX_RESPONSE_BYTES` (512 MiB),
  `MAX_REQUEST_BYTES` (16 MiB), `MIN_AUDIO_BYTES`, `SAMPLE_RATE`, `DETAIL_MAX`.

## Why

Non-streaming by design: upstream only supports non-streaming music generation,
so the whole song arrives in one body and the router layers elapsed-time
heartbeats on top. A 5-minute song can legitimately take many minutes to render,
hence the long timeout. Error bodies come back as JSON or text even with
arraybuffer decoding, so they are decoded for the message.

Its shape (a static call returning `{ promise, abort }`) differs from the image
side's `ImageAdapter` (instance with health check and callbacks), so it does not
share a base class.
