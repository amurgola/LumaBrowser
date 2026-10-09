# MicFailure

`core/llm-server/ui/js/voice/MicFailure.js`

Explains a getUserMedia failure (no device, busy, denied, other) on the
picker's note line, and when `api.voice.micAccessStatus` reports the OS
blocking the app, says so and adds "Open microphone privacy settings".

## Methods

- `message(err)`, `explain(api, err, note)`.
