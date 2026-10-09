# ImageModelCatalog

`core/image-server/models/ImageModelCatalog.js`

The curated image and video model catalog, merged at read time with rows that
extensions contribute (for example the Anima model). Extends
[MediaModelCatalog](../../media-shared/MediaModelCatalog.md); the shipped rows
live in [ImageModelEntries](ImageModelEntries.md).

## Methods

- `new ImageModelCatalog({ registry? })`; `registry` defaults to
  `ImageCatalogRegistry.shared` (tests pass a fresh one).
- `list()` returns the shipped rows followed by the registry rows.
- `getById(id)` returns a shipped row, else a contributed row, else `null`. A
  shipped row wins over a contributed row with the same id.
- `fingerprint()` (inherited) hashes the shipped rows only.
- `ImageModelCatalog.totalApproxBytes(model)` sums `approxBytes` across the
  model's `files` bag; 0 for a missing model or bag.

## Why

- Extension rows join through `context.imageCatalog.register()`; they appear
  once their extension activates, which always precedes a catalog read (panel,
  download, scan), so merging at read time is safe.
- The registry is injected so tests can run against an empty one; production
  callers use the default shared instance.
