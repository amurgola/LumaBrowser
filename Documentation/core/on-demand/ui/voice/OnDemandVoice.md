# OnDemandVoice

`core/on-demand/ui/voice/OnDemandVoice.js`

The panel's voice loop, a compact form of the LLM tab's voice controller.

## Methods

- `OnDemandVoice.create({ api, win, hooks, parts })`: null without `api.voice`.
  Hooks: `onState`, `onPartial`, `onUtterance`, `onSetupNeeded`, `onMicError`,
  `onBargeIn`. `parts` (tests): `{ mic, player, detector, now }`.
- `start()`, `stop()`, `isOn()`, `state` (`off | starting | listening | capturing |
  transcribing | waiting | speaking`).
- `setWaiting()`, `onDelta(text)`, `onTurnDone()`, `onTurnError()`,
  `setSpeak(on)`, `speaks()`, `stopSpeaking()`.

## Behaviour

Frames go to [UtteranceDetector](UtteranceDetector.md). A start while speaking
is a barge-in (playback stopped, synthesis aborted, `onBargeIn`). While
capturing, a preview transcription runs every 1.2 s. An utterance under 350 ms,
or under two words once bracketed noise is removed, returns to listening;
`NO_STT_MODEL`/`STT_RUNTIME_MISSING` stops the voice and calls
`onSetupNeeded`. Reply text goes through [SpeakableChunker](SpeakableChunker.md)
to `synthesize`; PCM chunks play on [PcmPlayer](PcmPlayer.md); once the turn
is over and nothing is pending or playing, the state returns to listening. A
synthesis that never reports back is dropped after 60 s.
