# PitchEstimator

`extensions/chatterbox-voice/PitchEstimator.js`

Median fundamental frequency of a voice clip.

## Methods

- `PitchEstimator.medianF0(samples, rate)` returns `{ medianHz, voicedFrames }`
  (`{ 0, 0 }` when nothing is voiced). 40 ms windows every 20 ms, 60-400 Hz,
  frames under 1e-4 energy or 0.6 normalized correlation are skipped.

## Why

Good enough to tell 120 Hz from 220 Hz, so a "the clone sounds higher than me"
report can be checked against numbers; it is not a pitch tracker. A periodic
signal correlates as well at 2T as at T, so the shortest lag that is a local
peak within 10% of the best is taken (octave guard).
