# VoiceBridge

`core/llm-server/ui/js/chat/voice/VoiceBridge.js`

The chat's side of voice. It builds the controller from the injected
`voiceFactory` on first composer render (only when the API has `voice`), lets
it submit and abort turns, feeds it stream deltas and turn ends, and owns the
Read aloud button on each settled reply (offered only when the API exposes
`voice.tts`).

## Methods

- `ensure()`, `active()`.
- `onDelta(text)`, `onTurnDone(aborted)`, `onTurnError()`.
- `canReadAloud()`, `readAloud(message, btn)` (the reply minus its choices fence;
  reasoning is never included), `stopReading()`.
- `readButtonHtml(message)`, `paintReadButtons(key, state)` (the controller's
  `onReadingChange`).
