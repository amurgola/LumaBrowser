# TtsWorker

`core/tts-server/TtsWorker.js`

Entry script of the text-to-speech utilityProcess. Loading the file starts the
worker: it connects to its parent through `RamPinMessagePort` and hands every
message to a [TtsWorkerSession](worker/TtsWorkerSession.md). Never `require` it;
fork it.

## Methods

- `TtsWorker.main()` runs at load. With no parent port (run directly) the
  process exits with code 1.

## Protocol

Over `process.parentPort` (Electron `utilityProcess`), or `process.send` under a
plain `child_process.fork` (tests):

- in `{ type: 'init', config: { addonDir, modelConfig, pocket?: { voices: [{ id, name, path }], numSteps } } }`
- out `{ type: 'ready', numSpeakers, sampleRate }` or `{ type: 'init-error', message }`
- in `{ type: 'synthesize', id, text, sid, speed }`
- out `{ type: 'chunk', id, seq, sampleRate, pcm }` (0..n, Int16 LE bytes),
  then `{ type: 'done', id, canceled }` or `{ type: 'error', id, message }`
- in `{ type: 'cancel', id }`, takes effect at the next progress callback
- in `{ type: 'shutdown' }` exits with code 0

## Why a separate process

Synthesis is CPU-heavy native work and the addon links GPL espeak-ng (see
THIRD-PARTY-LICENSES); the worker keeps both out of the main process. Killing
the worker is also the one reliable way to reclaim the model's RAM.

## Build constraint

The file name must keep ending in `worker.js` (case-insensitive): the bytecode
build ships `*worker.js` as plain JS because utilityProcess isolates reject
main-process bytecode. Everything it requires must also load as plain JS inside
the worker: `RamPinMessagePort`, `TtsWorkerSession`, `PocketVoices`,
`TtsSynthesisRequest`, `SherpaAddon`, `WavCodec`, `PcmSamples`. The ported build
script's exclusion list must name them.
