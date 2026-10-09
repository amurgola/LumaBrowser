# UtteranceDetector

`core/on-demand/ui/voice/UtteranceDetector.js`

Voice activity detection over 2048-sample frames at 16 kHz.

## Methods

- `feed(f32, { now, speaking, ducked })` -> `'start' | 'end' | null`. The noise
  floor tracks quiet frames; the threshold is max(0.012, 3 x floor), x2.4 while
  speaking. Two loud frames start (four while speaking); 1 s of pre-roll is
  kept. 800 ms under 70% of the threshold, or 30 s, ends. A `ducked` frame while
  speaking (just after playback started) is ignored after the floor update.
- `take()`, `capturedFrames()`, `isCapturing()`, `reset()`,
  `UtteranceDetector.durationMs(frames)`.
