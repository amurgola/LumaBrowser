# PathBinaryLookup

`core/shared/runtime/detect/PathBinaryLookup.js`

Finds a runtime binary on the host PATH.

## Methods

- `PathBinaryLookup.find(binaryName, env = process.env, platform = process.platform)`
  resolves the first existing `<dir>/<name>` across PATH entries, or `null`.
  On Windows a bare name tries each `PATHEXT` extension (default
  `.COM;.EXE;.BAT;.CMD`); a name already ending in one is tried as is.

## Why

Detection's last resort after a registered binary and the managed dir.
[ExecutableFinder](../../../shell/harness-connections/ExecutableFinder.md) is
similar but synchronous, stricter (X_OK, regular file, skips
`node_modules/.bin`) and lives in core/shell; merging them is a candidate once
both behaviours are confirmed equivalent for runtime binaries.
