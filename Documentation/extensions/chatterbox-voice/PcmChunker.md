# PcmChunker

`extensions/chatterbox-voice/PcmChunker.js`

Slices decoded audio into ~1 s Int16 PCM chunks for the voice pipeline.

## Methods

- `PcmChunker.deliver({ samples, sampleRate }, onChunk)` calls
  `onChunk({ seq, sampleRate, pcm })` per slice of `CHUNK_SEC` (1 s), `seq` from
  0, `pcm` Int16 LE bytes (core `PcmSamples.floatToInt16Bytes`). A throwing
  listener does not stop delivery.

## Why

The renderer schedules chunks back to back. One giant chunk works too; slices
let playback start a hair earlier on long sentences and give cancel a seam.
