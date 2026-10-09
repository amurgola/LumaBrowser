# MicCapture

`core/llm-server/ui/js/voice/MicCapture.js`

The live microphone graph: the device into a 16 kHz AudioContext (resumed if
suspended) and a ScriptProcessor routed through a zero-gain sink (Chromium
gives a sinkless processor no callbacks).

## Methods

- `start(onFrame)`, `stop()`, `sampleRate`, `active`.
