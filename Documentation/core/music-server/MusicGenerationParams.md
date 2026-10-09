# MusicGenerationParams

`core/music-server/MusicGenerationParams.js`

Pure request maths for music generation.

## Methods

- `MusicGenerationParams.maxNewTokens(model, durationSec)` maps a soft duration
  target to the acoustic-frame budget: the duration is clamped to
  `[30, constraints.maxDurationSec]` and scaled by
  `maxAcousticFrames / maxDurationSec`, rounded, capped at `maxAcousticFrames`.
  Without a positive duration it returns `defaults.maxNewTokens`, else the frame
  ceiling. Missing constraints use 9000 frames and 300 s.
- `MusicGenerationParams.effectiveSeed(seed, defaults)` truncates a finite
  request seed, else returns a finite `defaults.seed`, else `undefined`.
- `MusicGenerationParams.wavDurationSec(bytes, sampleRate)` is
  `(length - 44) / (sampleRate * 4)` (16-bit stereo PCM), or `null` for a
  header-only body or missing rate.
- Statics: `DEFAULT_MAX_FRAMES`, `DEFAULT_MAX_DURATION_SEC`, `MIN_DURATION_SEC`,
  `WAV_HEADER_BYTES`, `BYTES_PER_FRAME`.

## Why

MiniMax-Music3's 9000-frame ceiling covers 5 minutes, so it runs at about 30
frames per second; deriving the rate from the row keeps a future model with a
different grid correct. The WAV duration is computed from the byte length
rather than by decoding (as `WavCodec.durationSec` would) because sgl-omni's
format is fixed and a 5-minute song is tens of megabytes.
