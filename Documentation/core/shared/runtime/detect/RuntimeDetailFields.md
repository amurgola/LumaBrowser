# RuntimeDetailFields

`core/shared/runtime/detect/RuntimeDetailFields.js`

Stamps a catalog entry's facts and host-derived fields onto its detection row.

## Methods

- `RuntimeDetailFields.stamp(detail, { entry, catalog, manualBinaryPath, hooks, cuda, gpu })`
  sets and returns `detail`:
  - `manualBinaryPath, id, name, kind, description, requirementNote`
  - `assetSupported` (host asset regex exists), `repo` (`catalog.getRepo`)
  - `acquisition`: `entry.acquisition`, else `github-release` with an asset,
    `manual-source` with a `manualSourceUrl`, else `manual`
  - `supportsManualRegister` (`acquisition === 'manual-source'`),
    `manualSourceUrl`, `manualSourceNote`
  - `installable`: an asset here or an extension `install` hook
  - copies of `unsupportedFlags`, `skipFeatures`, `extraArgs` (default `[]`),
    `platforms` (default `null`), `modelKinds` (`null` when empty);
    `launchStyle`, `specDialect` (default `null`)
  - `hardware` from [RuntimeHardwareCheck](RuntimeHardwareCheck.md)

## Why

`launchStyle` picks an alternate launch planner (`mlx-server`); `specDialect`
picks the `--spec-type` grammar (`ik`); `modelKinds` restricts the Setup tab's
model picker. `installable` lets the launcher choose between a one-click
Download and a plain error.
