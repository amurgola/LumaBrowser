# ModelDownloadJob

`extensions/chatterbox-voice/ModelDownloadJob.js`

One background Chatterbox GGUF download started from the Setup tab.

## Methods

- `new ModelDownloadJob({ entry, modelsDir, stopEngine })`.
- `start()` starts core `ModelDownload.start` into `<modelsDir>/<entry.file>`
  and returns the job; `finished` resolves once it settled and the engine was
  stopped (the server registers model files at launch).
- `cancel()` returns whether a running download was asked to stop.
- `state`: `{ id, phase, received, total, bytesPerSec, done, error, startedAt }`;
  `phase` is `download`, `verify`, `finalize`, then `done`, `canceled` or
  `error` (`Download failed.` or the thrown message).
