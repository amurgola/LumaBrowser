# WavEncoder

`core/llm-server/ui/js/voice/WavEncoder.js`

Encodes Float32 microphone frames as mono PCM16 WAV (clamped to [-1, 1]) and measures RMS.

## Methods

- `encode(frames, sampleRate)` returns a `Uint8Array` with the 44-byte header.
- `rms(samples)`.
