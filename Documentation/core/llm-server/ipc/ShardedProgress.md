# ShardedProgress

`core/llm-server/ipc/ShardedProgress.js`

One progress bar across every part of a sharded GGUF.

## Methods

- `new ShardedProgress(send, grandTotal)`.
- `relay()` the `onEvent` for a part: `download` events become
  `{ received: finished + part received, total (or null), bytesPerSec, etaMs }`
  (the ETA against the grand total, null without a rate or remaining bytes);
  other events pass through.
- `addFinished(bytes)` adds a finished part's on-disk size.

## Why

A resumed or already-present part reports no progress, so the finished part's
real size is added instead of trusting streamed counts.
