# VoiceController

`core/llm-server/ui/js/voice/VoiceController.js`

The voice conversation loop of the chat and read aloud for one reply. It is
transport-agnostic: everything goes through the injected `api.voice` (the
desktop preload's `llmDiagAPI.voice`, or the PWA shim's HTTP-backed copy with
`remote: true`) and the injected chat. Used by the LLM tab and the PWA.

## States

`off` > `starting` > `listening` > `capturing` > `transcribing` > `waiting` >
`speaking` > `listening` ...

- Click the mic (off): no `navigator.mediaDevices` gives a note (an `http://`
  page is told to use https); engines not ready (`stt`/`tts` `getView` without
  `runtimeReady` and models) open the setup panel; otherwise both engines are
  pre-warmed and the microphone picker opens. Its Start button enters the loop.
  A failed start reopens the picker with the reason.
- Click while live: exit (`off`), microphone and playback released.
- An utterance shorter than 350 ms or a transcript of fewer than two words
  (whisper's silence fillers) goes back to listening. Recognition not set up
  (`NO_STT_MODEL`, `STT_RUNTIME_MISSING`) stops the loop and opens setup.
- Talking over an in-flight turn (thinking, tool calls, speech) is an
  interrupt: playback and synthesis stop, `chat.abort()`, then it waits up to
  8 s for `chat.isStreaming()` to clear before `chat.submit(text)`.
- While speaking, a louder, sustained voice (4 frames) barges in at once.
- Replies are spoken sentence by sentence as deltas arrive; fenced code is never
  spoken. After `onTurnDone` and the last chunk played, back to listening.
- While waiting, a soft two-note blip every 2.6 s (after a 1.4 s grace).

## Methods

- `VoiceController.create({ api, chat, onReadingChange })` returns `null`
  without `api.voice` (legacy `window.LumaVoice.create`).
- `chat`: `{ submit(text), abort(), isStreaming() }`.
  `onReadingChange(key, state)`: read aloud started, started playing, or ended.
- `wireButton(button)` per composer render; buttons show `cm-mic-on`,
  `data-voice-state` and a state title.
- `toggle(anchor?)`.
- `active`, `state` getters. The chat shell reads `active` per turn (noThink and
  no reply-choice chips for voice turns).
- `onChatDelta(text)`, `onTurnDone()`, `onTurnError()` from the chat stream.
- `readAloud(text, key, anchor?)` resolves `true` when reading started. Same key
  again stops it; a different key replaces it. A no-op while the loop is live.
  Not ready opens the "Set up read aloud" panel.
- `stopReading()`, `readingKey`, `readingState` (`'starting'`, `'playing'`, `null`).

Public methods are bound (the chat shell may pass them around).

## Collaborators

[VoiceActivityDetector](VoiceActivityDetector.md), [MicCapture](MicCapture.md),
[PcmScheduler](PcmScheduler.md), [SpeechStreamChunker](SpeechStreamChunker.md),
[SpeechText](SpeechText.md), [LoopSpeech](LoopSpeech.md),
[LiveTranscript](LiveTranscript.md), [PartialTranscriber](PartialTranscriber.md),
[IdleCue](IdleCue.md), [VoicePanels](VoicePanels.md),
[ReadAloudReader](ReadAloudReader.md), [VoiceStyles](VoiceStyles.md),
[WavEncoder](WavEncoder.md).

## Globals

Reads `navigator.mediaDevices`, `window.isSecureContext`, `window.AudioContext`,
`performance.now`, `localStorage` (`lumaVoice.micDeviceId`). Writes none
(the legacy `window.LumaVoice` is gone: the chat shell and the PWA import the
class).
