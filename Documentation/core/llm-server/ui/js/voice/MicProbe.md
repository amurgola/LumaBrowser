# MicProbe

`core/llm-server/ui/js/voice/MicProbe.js`

The picker's preview stream: drives the level meter (RMS times 700, capped at
100%) on animation frames and unlocks device labels.

## Methods

- `new MicProbe(AudioContextClass?)`; `start(deviceId, getFill)`, `stop()`.
