# SpeechPlayer

`extensions/desktop-integration/ui/SpeechPlayer.js`

Plays, in the main window, the speech [Speech](../shared/Speech.md)
synthesizes in the main process: chunks from
`ext.desktop-integration.speech.audio` go back to back through the chat's
[PcmScheduler](../../../core/llm-server/ui/js/voice/PcmScheduler.md); a message
on `ext.desktop-integration.speech.stop` silences it, `speech.pause` suspends the
AudioContext (chunks that arrive meanwhile are held, since scheduling would wake
the clock) and `speech.resume` resumes it. It reports what is audible on the
`ext.desktop-integration.speechState` IPC channel: `playing` at the first chunk,
progress as sentences finish, `paused`, and `ended` once the last chunk announced
by `speech.done` has played.

## Methods

- `new SpeechPlayer({ scheduler? })`: a PcmScheduler is created on first audio.
- `activate(ipcBridge)`, `deactivate()` (detaches and stops).
- `play({ utteranceId, requestId, sampleRate, pcm, sentence, sentences })`: a chunk of a new utterance stops the previous one first.
- `done({ utteranceId, chunks })`, `pause(msg)`, `resume(msg)` (ignored for another utterance), `stop()`.
