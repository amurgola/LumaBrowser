# PcmScheduler

`core/llm-server/ui/js/voice/PcmScheduler.js`

Plays streamed Int16 PCM back to back on an AudioContext at the TTS rate
(24 kHz default; a new rate recreates the context once nothing plays), with a
4 ms de-click ramp per chunk, a 0.15 s lead and a 0.12 s breath between
sentences. The loop and the reader each own one.

## Methods

- `schedule(requestId, payload, onEnded)` returns `false` for an empty chunk.
- `ensureContext(rate?)`, `stop()` (stops live sources, resets the schedule),
  `resetSchedule()`, `close()`, `liveCount`, `context`.
- `new PcmScheduler(AudioContextClass?)`: `window.AudioContext` by default, read lazily.
