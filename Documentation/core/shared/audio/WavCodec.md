# WavCodec

`core/shared/audio/WavCodec.js`

Dependency-free WAV reader and writer shared by the voice workers, the TTS
stream and extension TTS engines.

## Methods

- `WavCodec.parse(bytes)` takes a complete WAV file (Buffer or Uint8Array) and
  returns `{ samples: Float32Array, sampleRate, channels }`, samples mixed down
  to mono in [-1, 1]. Throws on non-RIFF/WAVE input, a missing fmt or data
  chunk, zero channels or rate, or a bit depth other than 8/16/24/32.
- `WavCodec.encode(samples, sampleRate)` encodes mono Float32 samples as a
  16-bit PCM WAV `Buffer`.
- `WavCodec.durationSec(bytes)` returns the duration in seconds (it decodes the
  samples to count frames).

## Why

Sherpa needs Float32 samples plus a sample rate, while the renderer and
whisper-server speak WAV bytes, so one tolerant codec sits between them.
It handles PCM 8/16/24/32-bit and IEEE float32, any channel count,
`WAVE_FORMAT_EXTENSIBLE` (real tag read from the sub-format GUID), odd chunk
padding, and the `0xffffffff` data length streaming encoders write.

Workers (`ttsWorker.js`, `sherpaSttWorker.js`) require this file, and
`*Worker.js` entries are not bytecode compiled, so the build's bytecode
exclusion list must name `core/shared/audio/WavCodec.js` and
`core/shared/audio/PcmSamples.js` (legacy listed `core/shared/audio/wav.js` in
`scripts/compile-bytecode.js`).
