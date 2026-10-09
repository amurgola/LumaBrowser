# TtsWorkerSession

`core/tts-server/worker/TtsWorkerSession.js`

One TTS worker lifetime: loads a single sherpa `OfflineTts`, then serves
synthesize requests FIFO, streaming Int16 PCM chunks as the engine produces
them. Driven by [TtsWorker](../TtsWorker.md); the protocol is documented there.

## Methods

- `new TtsWorkerSession({ post, exit, loadAddon?, readFile?, warn? })`. `post`
  sends to the parent, `exit(code)` ends the process, `loadAddon(dir)` returns
  the sherpa module (default `SherpaAddon.load`); `readFile` and `warn` reach
  `PocketVoices.load`.
- `handle(message)` dispatches `init`, `synthesize`, `cancel`, `shutdown`;
  anything else is ignored.

## Behaviour

- `init` loads the addon, decodes Pocket voices when `config.pocket` is set,
  creates the engine (`createAsync` when available), and replies `ready` with
  `numSpeakers` (the voice count for Pocket) and `sampleRate`, or `init-error`.
- Requests run one at a time in arrival order, which keeps sentence order.
- `generateAsync` streams chunks through `onProgress` (seq from 0). A build that
  ignores the callback, or has only sync `generate`, returns the final waveform,
  which is sent as one chunk. Then `done { canceled }`; a throw becomes `error`.
- `cancel` drops queued requests with that id at once and aborts an in-flight
  one by returning 0 from the next progress callback. A cancel that arrives
  first marks the id, so its request answers `done { canceled: true }` unrun.

## Why

`enableExternalBuffer: false` on every generate: the addon defaults it to true,
Electron's V8 memory cage forbids external ArrayBuffers, and the final
GeneratedAudio allocation killed the whole worker after the chunks had streamed
(the first sentence of a turn played and every queued one died with the process).
