# AudioFrames

`core/on-demand/ui/voice/AudioFrames.js`

- `AudioFrames.rms(f32)`.
- `AudioFrames.encodeWav(frames, sampleRate)` -> mono PCM16 WAV bytes (clamped
  samples, 44-byte header), the format `voice.transcribe` takes.
