# ModelDownload

`core/llm-server/models/ModelDownload.js`

One resumable single-file model download with pause and cancel. Used for GGUF
models and, by other servers, for whisper, TTS, grounding and router models.

## Methods

- `ModelDownload.start({ url, destPath, onEvent })` starts (or resumes) and
  returns a handle `{ promise, cancel, pause }` whose functions are safe to
  destructure. `promise` resolves to:
  - `{ success: true, destPath, resumed, alreadyPresent? }` on completion;
  - `{ success: false, canceled: true, paused: false }` after `cancel()`;
  - `{ success: false, canceled: false, paused: true }` after `pause()`;
  - or rejects with the transfer error.
- `onEvent(type, payload)`: `'resume' { have }`, `'download' { received, total,
  bytesPerSec, etaMs }` (rate 0 and ETA null when unknown), `'verify' { read,
  total }`, `'finalize' { destPath, bytes }`, which is emitted only on success
  (including the already-present fast path).

## Why

The transfer mechanics (`.partial`, Range resume, parallel chunks, atomic
rename) live in [ResumableDownload](../../shared/download/ResumableDownload.md);
this wrapper owns the single-file event vocabulary and result shape. Pause and
cancel are the same transfer-level stop (sockets aborted, `.partial` and chunk
map kept on disk); they differ only in what the caller is told, so the UI can
offer Resume for a paused download instead of reporting it abandoned.
