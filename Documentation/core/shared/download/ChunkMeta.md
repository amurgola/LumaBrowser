# ChunkMeta

`core/shared/download/ChunkMeta.js`

The `.partial.meta` sidecar of a parallel download: which fixed-grid chunks are
complete.

## Methods

- `ChunkMeta.pathFor(partPath)` returns `partPath + '.meta'`.
- `ChunkMeta.plan(total, chunkSize)` returns `{ total, chunkSize, done }` with
  `ceil(total / chunkSize)` false entries. `done[i]` covers bytes
  `[i*chunkSize, min((i+1)*chunkSize, total))`.
- `ChunkMeta.load(metaPath, total, chunkSize)` returns the stored meta, or
  `null` when missing, unparseable, or not matching `total`/`chunkSize`/chunk
  count/boolean entries.
- `ChunkMeta.save(metaPath, meta)` writes via `<metaPath>.tmp` and rename.
- `ChunkMeta.clear(metaPath)` removes the sidecar and its temp file, quietly.
- `ChunkMeta.exists(metaPath)` is true if either the sidecar or its temp file exists.

## Why

Resume must survive an app restart, so completion is persisted after each
chunk. Temp plus rename means a crash never leaves torn JSON. A sidecar for a
different total is rejected because the URL may now point at a different file
than the interrupted run's.
