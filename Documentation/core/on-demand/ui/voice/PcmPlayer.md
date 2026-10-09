# PcmPlayer

`core/on-demand/ui/voice/PcmPlayer.js`

Plays streamed PCM16 TTS chunks back to back.

## Methods

- `schedule(requestId, { pcm, sampleRate })` -> false when empty. 0.15 s lead-in,
  0.12 s gap between requests, 4 ms edge fades. A new sample rate replaces the
  context only when nothing is playing.
- `stop()`, `activeCount`, `PcmPlayer.toFloat32(bytes)`. `onEnded` fires per chunk.
