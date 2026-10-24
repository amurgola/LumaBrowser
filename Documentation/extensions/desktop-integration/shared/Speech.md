# Speech

`extensions/desktop-integration/shared/Speech.js`

Speaks text aloud for desktop features (`deps.speech`) through the app's own
text-to-speech, the `ttsServer` core service
([TtsServerService](../../../core/tts-server/TtsServerService.md): built-in
sherpa voices such as KittenTTS, or an extension engine such as Chatterbox).
The main process cannot play audio, so the PCM chunks are pushed to the main
window, where [SpeechPlayer](../ui/SpeechPlayer.md) plays them through the
chat's PcmScheduler. One utterance at a time.

## Methods

- `new Speech({ getTts, send })`: `getTts()` returns the ttsServer (read per
  call); `send(channel, payload)` is `RendererBroadcast.send`.
- `available()`: the voice view has a runtime and at least one voice.
- `speak(text, { voice? })`: stops the previous utterance, then synthesizes
  sentence-sized pieces in order (`ttsServer.synthesize({ text, sid? })`),
  pushing every chunk on `ext.desktop-integration.speech.audio` as
  `{ utteranceId, requestId, seq, sampleRate, pcm, sentence, sentences }`, then
  `ext.desktop-integration.speech.done` `{ utteranceId, chunks }`. Resolves when synthesis
  ends: `{ success: true, utteranceId, chunks, canceled }`, or
  `{ success: false, error, code }` (`NO_TTS`, `NO_TTS_MODEL`, or the engine's
  code such as `TTS_RUNTIME_MISSING`). Never rejects. `voice` is a speaker
  index of the default voice model; anything else is ignored. Text is cut at
  4000 characters.
- `stop()`: cancels synthesis in flight (`ttsServer.cancel`) and sends
  `ext.desktop-integration.speech.stop`; what was audible ends as `stopped`.
  -> `{ success, stopped }`.
- `pause()` / `resume()`: send `speech.pause` / `speech.resume` to the player
  (it freezes the audio clock) -> `{ success, state }`.
- `playback()`: what the user hears, `{ utteranceId, state: 'synthesizing' |
  'playing' | 'paused' | 'ended', progress, text, reason?, error? }` (reason
  `stopped`, `failed` or `empty`), or null. `onState(fn)` -> unsubscribe.
- `report({ utteranceId, state, progress })`: the renderer's
  [SpeechPlayer](../ui/SpeechPlayer.md) reports through the `speechState` IPC
  channel; stale utterances and unknown states are ignored.
- `Speech.sentences(text)`: the pieces (at most 280 characters, cut at a space).
