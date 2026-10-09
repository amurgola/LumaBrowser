# AudioAnalysis

`extensions/chatterbox-voice/AudioAnalysis.js`

Loudness and pitch analysis of reference clips, and their preparation for storage.

## Methods

- `AudioAnalysis.rmsDb(samples)` (`-Infinity` for none), `AudioAnalysis.peakDb(samples)`.
- `AudioAnalysis.normalizeLoudness(samples)` gains toward `TARGET_RMS_DB` (-20)
  capped so the peak stays under `PEAK_CEIL_DB` (-1); returns the input itself
  when the change is under 0.5 dB or the clip is empty.
- `AudioAnalysis.analyzeWav(wav)` returns `{ seconds, sampleRate, rmsDb, peakDb, medianHz }`
  (one decimal; pitch from [PitchEstimator](PitchEstimator.md)).
- `AudioAnalysis.prepareReferenceClip(wav, { trimStartSec })` trims the start
  (ignored when it would leave under a second), normalizes, re-encodes and
  returns `{ wav, analysis }`.

## Why

The upstream Chatterbox voice tools normalize loudness before extracting a
speaker; quiet laptop-mic recordings otherwise condition the model on a whisper.
