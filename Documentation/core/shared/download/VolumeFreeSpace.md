# VolumeFreeSpace

`core/shared/download/VolumeFreeSpace.js`

Free space on the volume a folder lives on, read through the nearest existing
ancestor when the folder itself does not exist yet.

## Methods

- `VolumeFreeSpace.read(dir, { statfs? })` resolves `{ freeBytes, totalBytes }`
  (`bavail * bsize`, `blocks * bsize`), or both null when the volume cannot be
  read. `statfs` is a test seam.
- `VolumeFreeSpace.nearestExisting(dir)` walks up at most `MAX_ANCESTOR_STEPS`
  (8) levels, stopping at the root.

## Who uses it

- [FreeSpaceGuard](FreeSpaceGuard.md) before any download byte lands.
- [ModelsDirStorage](../../llm-server/ipc/ModelsDirStorage.md) for the storage
  figure the models view shows; it delegates here and keeps its own name for
  its callers.

## Why

The reader used to live in the LLM server's IPC layer, which made the shared
download guard reach upward into a server module. Moving the statfs walk into
the shared layer keeps the dependency direction one way.
