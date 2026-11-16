# DictationRecorder

`extensions/desktop-integration/ui/DictationRecorder.js`

Records the microphone in the main window for
[Dictation](../shared/Dictation.md), which runs in the main process and has no
microphone of its own.

- `ext.desktop-integration.dictation.start { sessionId }`: opens the
  microphone with the chat's
  [MicCapture](../../../core/llm-server/ui/js/voice/MicCapture.md) (the device
  picked in voice mode, 16 kHz) and keeps a copy of every frame. Reports
  `{ sessionId, type: 'started' }`, or `{ type: 'failed', error }` with
  [MicFailure](../../../core/llm-server/ui/js/voice/MicFailure.md)'s message.
- `ext.desktop-integration.dictation.stop { sessionId }`: closes the
  microphone and reports `{ sessionId, type: 'audio', wav, durationMs }`, the
  frames as one WAV file
  ([WavEncoder](../../../core/llm-server/ui/js/voice/WavEncoder.md)). A stop
  for another session is ignored.
- `ext.desktop-integration.dictation.cancel`: closes the microphone and drops
  the frames. A cancel that arrives while the microphone is still opening
  closes it as soon as it is open, and nothing is reported.

Reports go to the `ext.desktop-integration.dictationReport` IPC channel.

## Methods

- `new DictationRecorder({ mic? })`: a MicCapture is created on first use.
- `activate(ipcBridge)`, `deactivate()` (detaches and cancels).
- `start(msg)`, `stop(msg)`, `cancel()`.
