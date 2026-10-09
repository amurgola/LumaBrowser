# SherpaSttWorker

`core/whisper-server/sherpa/SherpaSttWorker.js`

Entry script of the sherpa speech-to-text utilityProcess, the STT twin of
[TtsWorker](../../tts-server/TtsWorker.md). Loading the file starts the worker:
it connects to its parent through `RamPinMessagePort` and hands every message to
a [SherpaSttWorkerSession](SherpaSttWorkerSession.md). Never `require` it; fork it.

## Methods

- `SherpaSttWorker.main()` runs at load; with no parent port it exits with code 1.

## Protocol

- in `{ type: 'init', config: { addonDir, recognizerConfig } }`
- out `{ type: 'ready' }` or `{ type: 'init-error', message }`
- in `{ type: 'transcribe', id, wav, language? }` (`wav` is complete WAV bytes)
- out `{ type: 'result', id, text, lang, durationMs, audioSec }` or `{ type: 'error', id, message }`
- in `{ type: 'shutdown' }` exits with code 0

## Why not inside the TTS worker

Voice mode re-transcribes the utterance so far about every 1.2 s while the user
talks, and speaks sentence by sentence while the model answers. One shared FIFO
would make each side wait behind the other; two workers keep both latencies
independent.

## Build constraint

The name must keep ending in `worker.js` (bytecode build skips those). Its
requires (`RamPinMessagePort`, `SherpaSttWorkerSession`, `SherpaAddon`,
`WavCodec`) must also ship as plain JS, since a utilityProcess cannot load
main-process `.jsc` modules.
