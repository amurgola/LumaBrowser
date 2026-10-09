# LoopSpeech

`core/llm-server/ui/js/voice/LoopSpeech.js`

The loop's synth requests: one `api.voice.synthesize({ requestId: 'v-...', text })`
per sentence, tracked until done, error, refusal or a 60 s watchdog.

## Methods

- `new LoopSpeech({ api, onChunk, onSettled })`; `listen()` (subscribes to
  `onTtsEvent` once), `speak(text)`, `abortAll()`, `pendingCount`.
