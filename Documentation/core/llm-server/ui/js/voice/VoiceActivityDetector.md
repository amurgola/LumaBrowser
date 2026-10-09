# VoiceActivityDetector

`core/llm-server/ui/js/voice/VoiceActivityDetector.js`

Finds utterances by RMS against an adaptive noise floor (slow EMA while not
capturing; threshold `max(0.012, floor * 3)`), with a pre-roll ring of about a
second so late starts keep the first words. Two loud frames start an
utterance; over the assistant it needs four frames at 2.4 times the threshold
and ignores the first 350 ms of its own audio. Silence below 0.7 times the
threshold for `silenceMs` (800) or 30 s of capture ends it.

## Methods

- `process(samples, now, { speaking, lastAudioStart })` returns `'start'`, `'end'` or `null`.
- `takeUtterance()` returns `{ frames, startedAt }` and clears the capture; field `capture`.
- `reset()`; `VoiceActivityDetector.durationMs(frames)` (2048-sample frames at 16 kHz).
