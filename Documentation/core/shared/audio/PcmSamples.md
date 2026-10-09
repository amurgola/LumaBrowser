# PcmSamples

`core/shared/audio/PcmSamples.js`

Converts between Float32 speech samples and 16-bit PCM bytes, and resamples
linearly.

## Methods

- `PcmSamples.floatToInt16Bytes(f32)` clips to [-1, 1] and returns Int16 LE
  bytes as a `Uint8Array` (the PCM chunk shape the TTS stream uses).
- `PcmSamples.int16BytesToFloat(bytes)` decodes Int16 LE bytes (any typed-array
  view, offset respected, trailing odd byte ignored) to Float32 in [-1, 1].
- `PcmSamples.resampleLinear(samples, fromRate, toRate)` returns the input
  unchanged at equal rates, else a linearly interpolated Float32Array of
  `max(1, floor(length * toRate / fromRate))` samples. Good enough for a
  reference clip or an STT feed, not for mastering.
