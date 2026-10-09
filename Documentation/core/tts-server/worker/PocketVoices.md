# PocketVoices

`core/tts-server/worker/PocketVoices.js`

The Pocket TTS reference voices, decoded once at worker init. Pocket has no
speaker table: every utterance is conditioned on a short reference clip, so a
speaker id is an index into this list.

## Methods

- `PocketVoices.load(pocketConfig, { readFile?, warn? })` decodes each
  `voices[].path` with `WavCodec.parse` into `{ ...entry, samples, sampleRate }`.
  Unreadable clips are skipped with `[tts-worker] skipping unreadable voice clip
  <path>: <message>`. Throws `Pocket TTS needs at least one reference voice clip
  (voices/*.wav).` when none survive. `numSteps` defaults to 2 when not positive.
- `new PocketVoices(voices, numSteps)`; `voices`, `numSteps`, `count`.
- `voiceFor(sid)` clamps `sid` into the list.
- `PocketVoices.DEFAULT_NUM_STEPS` is 2.

## Why

Clips are a few MB of Float32 each, decoded once; the addon caches the derived
embedding per clip.
