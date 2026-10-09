# MicCapture

`core/on-demand/ui/voice/MicCapture.js`

Opens the mic (echo cancellation, noise suppression, auto gain) on a 16 kHz
AudioContext and delivers 2048-sample frames through a ScriptProcessor routed
to a muted gain (an unconnected ScriptProcessor is silent in Chromium).

## Methods

- `open(onFrame)` (rejects with the getUserMedia error), `close()`, `sampleRate`.

## Globals

`navigator.mediaDevices`, `AudioContext` (from the window passed in).
