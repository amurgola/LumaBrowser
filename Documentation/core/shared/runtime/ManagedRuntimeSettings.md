# ManagedRuntimeSettings

`core/shared/runtime/ManagedRuntimeSettings.js`

The persisted runtime-detection view and the manually registered binary map,
shared by the LLM and image services.

## Methods

- `new ManagedRuntimeSettings({ settingsDb, cacheKey, manualBinaryPrefix, catalog, runtimeKind, fallbackIds, detectRuntimes, getRuntimesDir, getDiagnostics })`.
  `catalog` is a [RuntimeCatalog](RuntimeCatalog.md) (or anything with
  `getCatalog()` and `fingerprint()`); `detectRuntimes(inputs)` is the side's
  detector; `getDiagnostics()` resolves `{ cuda, gpu }`.
- `getManualRuntimeBinary(id)` returns the registered path or `null`.
- `setManualRuntimeBinary(id, path)` stores it (a falsy path deletes it) and
  invalidates the view. A missing id is a no-op.
- `getAllManualRuntimeBinaries()` returns `{ id: path }` for every catalog
  runtime of `runtimeKind` that has one; uses `fallbackIds` when the catalog
  throws.
- `getCachedRuntimesView()` returns the persisted view when it is an object,
  else `null`. `setCachedRuntimesView(view)` stores it; `null` deletes it.
- `invalidateRuntimesCache()` deletes the view and forgets the in-flight probe.
- `ensureRuntimesView({ force })` returns the cached view when fresh, else the
  in-flight probe, else probes: calls `detectRuntimes({ runtimesRoot, cuda, gpu, manualBinaries })`,
  stamps `_cuda` (`{ available, reason }` or `null`) and `_catalogHash`, and
  persists it. `force` always probes and is not shared with other callers. A
  rejected probe is not cached.

A cached view is fresh only when it has a `_cuda` stamp (older builds did not
write one), that stamp is not a transient CUDA failure
([CudaSnapshot](CudaSnapshot.md)), and `_catalogHash` equals the catalog's
current fingerprint.

## Persisted keys

Keys are passed in whole, never derived, because the two sides already differ
(`core.llmServer.runtimesCache` vs `core.imageServer.runtimesViewCache`) and
renaming one would turn the cache into a permanent miss and orphan users'
registered binaries. Binaries live at `<manualBinaryPrefix><id>.manualBinaryPath`.

## Why

Both services grew the same logic independently: serve detection from disk so
opening a section never spawns a `--version` probe per runtime, distrust a view
built on a transient CUDA failure so status pills cannot outlive a healed
driver, recompute when an update ships a catalog change, and coalesce
concurrent callers. It is composed, not inherited, because the two services
sit on unrelated bases and only overlap here.
