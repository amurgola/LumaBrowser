# FullBodyBuilder

`extensions/roleplay-mode/pipeline/FullBodyBuilder.js`

Builds a character's canonical full body from a head-only portrait.

## Methods

- `new FullBodyBuilder(chat, { pause })`; `build(data, char, headB64, { turn, abortSeq })`
  the body b64 or null. Re-rolls a non-chroma plate once on a new seed, never
  keeps a mis-shaped render, re-plates the result, stores `char.figure`, queues an
  audit and saves.
