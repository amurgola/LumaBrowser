# TtsSynthesisRequest

`core/tts-server/worker/TtsSynthesisRequest.js`

Turns a worker `synthesize` message into the sherpa `OfflineTts` generate request.

## Methods

- `TtsSynthesisRequest.build(message, pocketVoices)` returns
  `{ text, sid, speed }`: `text` stringified (empty when missing), `sid` 0 unless
  a finite number, `speed` 1 unless positive. With `pocketVoices` it adds
  `generationConfig { speed, referenceAudio, referenceSampleRate, numSteps }`
  from `pocketVoices.voiceFor(sid)` and resets `sid` to 0.
- `TtsSynthesisRequest.DEFAULT_SPEED` is 1.0.

## Why

Without a reference clip the addon logs "reference_sample_rate 0 is invalid" and
returns no audio at all, so a Pocket request always carries one.
