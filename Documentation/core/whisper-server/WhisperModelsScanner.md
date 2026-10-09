# WhisperModelsScanner

`core/whisper-server/WhisperModelsScanner.js`

Finds whisper.cpp ggml model files in the flat whisper models directory.
Extends `ModelDirectoryScanner`.

## Methods

- `new WhisperModelsScanner().scan(dir)` returns
  `[{ id, name, path, sizeBytes }]` sorted by file `name`. `id` is the file name
  without `.bin`. A missing directory gives `[]`.
- `WhisperModelsScanner.MIN_MODEL_BYTES` is 10 MiB.

## Rules

- Only regular files ending in `.bin` count; folders never do.
- `.partial` files (an in-flight resumable download) are skipped.
- Files under 10 MiB are skipped: a real ggml whisper model is at least tens of MB,
  so anything smaller is stray junk.
