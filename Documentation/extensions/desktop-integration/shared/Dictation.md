# Dictation

`extensions/desktop-integration/shared/Dictation.js`

Listens to the microphone and turns what was said into text with the app's own
speech recognizer (the `sttServer` core service,
[WhisperServerService](../../../core/whisper-server/WhisperServerService.md):
the sherpa or whisper.cpp model that voice setup installed). It is the
speech-in twin of [Speech](Speech.md) and is handed to features as
`deps.dictation`.

The microphone belongs to a window, so the capture runs in the main window's
renderer ([DictationRecorder](../ui/DictationRecorder.md)). The main process
only directs it:

| Step | Main sends | Renderer answers on `dictationReport` |
| --- | --- | --- |
| `begin()` | `ext.desktop-integration.dictation.start { sessionId }` | `{ sessionId, type: 'started' }`, or `{ type: 'failed', error }` when the microphone will not open |
| `finish()` | `ext.desktop-integration.dictation.stop { sessionId }` | `{ sessionId, type: 'audio', wav, durationMs }` (one mono 16 kHz WAV) |
| `cancel()` | `ext.desktop-integration.dictation.cancel { sessionId }` | nothing |

One session at a time. Only the answer the current session is waiting for is
taken, so a second window's recorder answering the same broadcast is ignored.

## What "set up" means

`refresh()` reads the recognizer's `getView()` and answers true when
`runtimeReady` is true and `models` is not empty: the same rule voice mode and
[VoiceReadiness](../../../app/browser/VoiceReadiness.md) use. The view is
asynchronous, so `available()` returns the last known answer and starts a
refresh; `begin()` always asks afresh.

## Methods

- `new Dictation({ getStt, send, setTimeout?, clearTimeout? })`: `getStt()`
  returns the `sttServer` service or null and is read per call; `send(channel,
  payload)` pushes to the renderers (`RendererBroadcast.send` in the app).
- `available()`, `refresh()`: see above.
- `active` (a session exists), `listening` (the microphone is open).
- `begin()` -> `{ success: true, sessionId }` once the microphone is open. It
  also starts the recognizer (`ensureRunning`) so the model loads while the
  user is still talking. Failures: `BUSY`, `NO_STT` (no recognizer service),
  `NO_STT_MODEL` (not set up), `NO_MICROPHONE` (no window answered within
  8 s), `MIC_FAILED` (the renderer's message, such as "Microphone access was
  denied."), `CANCELED`.
- `finish()` -> `{ success: true, text, durationMs }`. A recording under
  300 ms, or one whose transcript holds no words, is `EMPTY` ("Nothing was
  heard"). Other failures: `NOT_LISTENING`, `CANCELED`, `FAILED`, or the
  recognizer's own code (`STT_RUNTIME_MISSING`).
- `cancel()` -> `{ success, canceled }`: drops the session and tells the
  recorder to close the microphone. A `finish()` in flight resolves `CANCELED`.
- `report(update)`: the renderer's answer (see the table); returns whether it
  was taken.
- `Dictation.clean(text)`: collapses whitespace and drops the fillers
  recognizers write for silence and noise in brackets or parentheses
  (`[BLANK_AUDIO]`, `(music)`).

None of the methods reject.
