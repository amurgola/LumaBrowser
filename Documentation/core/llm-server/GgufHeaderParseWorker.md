# GgufHeaderParseWorker

`core/llm-server/GgufHeaderParseWorker.js` (class) and
`core/llm-server/ggufParseWorker.js` (worker entry)

Answers GGUF header-parse requests on a worker thread so the tensor-name walk
(about 10 MB per model) never runs on the main process's event loop.

## Methods

- `GgufHeaderParseWorker.listen(parentPort)` routes every `message` to `handle`.
- `GgufHeaderParseWorker.handle(parentPort, { id, filePath })` (async) posts
  exactly one `{ id, res }`, where `res` is
  [GgufParser](GgufParser.md)`.parseHeader(filePath)`. If the parser ever
  throws despite its contract, `res` is
  `{ ok: false, error, bytesRead: 0, durationMs: 0 }`.
- `ggufParseWorker.js` is the entry the models scanner loads by path
  (`new Worker(path.join(__dirname, 'ggufParseWorker.js'))`); it only calls
  `listen(parentPort)`.

## Why a worker, and why these names

A model-directory rescan can fire while the app is busy (boot, a fit test
streaming a 26 GB GGUF). The scanner falls back to an in-process parse when the
worker cannot spawn or exits unexpectedly. Merging split-model shards
(`GgufTensorLayout.merge`) and deriving the layout (`GgufTensorLayout.derive`)
stay in the scanner, on the main side.

Worker isolates reject bytecode compiled in the main process. The bytecode
build skips any file whose name ends in `worker.js` (case-insensitive), so both
files must keep that ending. The entry keeps its legacy path so the scanner and
the build scripts (`scripts/compile-bytecode.js`,
`scripts/_verify-bytecode-asar.js`) need no change. The class cannot be named
`GgufParseWorker.js`: on a case-insensitive filesystem it would collide with
the entry.
