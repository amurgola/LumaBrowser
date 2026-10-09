# AcquisitionGuard

`core/shared/runtime/install/AcquisitionGuard.js`

Refuses an install before any network call when the entry cannot be
auto-downloaded on this host.

## Methods

- `AcquisitionGuard.entryFor(catalog, id)` returns the entry or throws
  `Unknown runtime id: <id>`.
- `AcquisitionGuard.assertKind(entry, expectedKind, kindNoun)` throws
  `Runtime <id> is not an <kindNoun> binary.`
- `AcquisitionGuard.assetPatternOrThrow(catalog, entry)` returns the host
  asset regex, or throws a [RuntimeInstallError](RuntimeInstallError.md):
  - `acquisition: 'manual-source'`: `MANUAL_SOURCE_ONLY`, detail
    `{ manualSourceUrl, manualSourceNote }` (nulls when absent)
  - no asset here but a `manualSourceUrl`: `MANUAL_SOURCE_ONLY` naming
    `<platform>-<arch>` and asking the user to register the binary with Locate
  - otherwise `NO_ASSET_FOR_PLATFORM`, detail `{ acquisition: 'manual', releasesUrl }`

## Why

The UI renders `MANUAL_SOURCE_ONLY` as the same "Build from source" card it
shows for mlx-lm, so a runtime that is only source-only on some hosts (CUDA
builds that upstream ships for Windows only) gets that card too.
