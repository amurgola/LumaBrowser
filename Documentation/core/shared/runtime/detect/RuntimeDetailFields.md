# RuntimeDetailFields

`core/shared/runtime/detect/RuntimeDetailFields.js`

Stamps a catalog entry's facts and host-derived fields onto its detection row.

## Methods

- `RuntimeDetailFields.stamp(detail, { entry, catalog, manualBinaryPath, hooks, cuda, gpu })`
  sets and returns `detail`:
  - `manualBinaryPath, id, name, kind, description, requirementNote`; `name`
    and `description` come from `entry.hostLabels[catalog.platformKey()]` when
    present (the macOS arm64 CPU build reads "llama.cpp (Metal)")
  - `assetSupported` (host asset regex exists), `repo` (`catalog.getRepo`)
  - `acquisition`: `entry.acquisition`, else `github-release` with an asset,
    `manual-source` with a `manualSourceUrl`, else `manual`
  - `supportsManualRegister` (`acquisition === 'manual-source'`),
    `manualSourceUrl`, `manualSourceNote`
  - `installable`: an asset here or an extension `install` hook
  - copies of `unsupportedFlags`, `skipFeatures`, `extraArgs` (default `[]`),
    `platforms` (default `null`), `modelKinds` (`null` when empty);
    `launchStyle`, `specDialect` (default `null`); a copy of `spawnEnv` (or `null`)
  - `hardware` from [RuntimeHardwareCheck](RuntimeHardwareCheck.md)
  - `backend: null` (filled later by `applyBackend`)
- `RuntimeDetailFields.applyBackend(detail, backend)` stores a
  [BackendDeviceCheck](BackendDeviceCheck.md) result as `detail.backend`. When
  the check ran and found no device, a row that was hardware-ready becomes
  `{ ready: false, note }` with "The <name> backend did not load, so it would
  run on the CPU: <error>. <requirementNote>"; a row already not ready (the
  vendor GPU is absent) keeps its simpler note.

## Why

`launchStyle` picks an alternate launch planner (`mlx-server`); `specDialect`
picks the `--spec-type` grammar (`ik`); `modelKinds` restricts the Setup tab's
model picker. `spawnEnv` reaches the child process through the launch's
`extraEnv` (OpenVINO's `GGML_OPENVINO_DEVICE`). `installable` lets the launcher choose between a one-click
Download and a plain error.
