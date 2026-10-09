# SherpaSttWorkerSession

`core/whisper-server/sherpa/SherpaSttWorkerSession.js`

One STT worker lifetime: loads a single sherpa `OfflineRecognizer` (Parakeet TDT
about 8 s, Qwen3-ASR about 15 s), then transcribes WAV requests FIFO. Driven by
[SherpaSttWorker](SherpaSttWorker.md); the protocol is documented there.

## Methods

- `new SherpaSttWorkerSession({ post, exit, loadAddon? })` (`loadAddon`
  defaults to `SherpaAddon.load`).
- `handle(message)` dispatches `init`, `transcribe`, `shutdown`.
- `SherpaSttWorkerSession.cleanText(text)` collapses whitespace and trims.

## Behaviour

- A transcribe decodes the WAV (`WavCodec.parse`, mono Float32), throws
  `transcribe: empty audio` for no samples, opens a stream, applies the language
  hint, feeds the waveform at its own rate (the addon resamples to 16 kHz), and
  decodes with `decodeAsync` or the sync `decode` + `getResult` fallback.
- Result: `text` cleaned, `lang` (or `''`), `durationMs` wall time,
  `audioSec = samples / sampleRate`. Errors reply `error` and the queue goes on.
- Language hint: lowercased, skipped for empty or `auto`, set through
  `stream.setOption('language', ...)` only when the stream has it; a throw is
  ignored. Multilingual models (Qwen3-ASR, Nemotron) read it; others ignore it.
