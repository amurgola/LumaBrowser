# ModelsDirStorage

`core/llm-server/ipc/ModelsDirStorage.js`

Free space where models land, shown before a multi-GB download.

## Methods

- `ModelsDirStorage.freeSpace(dir, { statfs? })` resolves `{ freeBytes, totalBytes }`
  (`bavail * bsize`, `blocks * bsize`) of the nearest existing ancestor, or both
  null when the volume cannot be read.
- `ModelsDirStorage.nearestExisting(dir)` walks up at most `MAX_ANCESTOR_STEPS` (8)
  levels, stopping at the root.

Both delegate to the shared [VolumeFreeSpace](../../shared/download/VolumeFreeSpace.md);
this class keeps the name its callers know.

## Why

The configured models folder may not exist yet, which is explicitly allowed.
