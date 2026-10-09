# VersionCompare

`core/shell/ide-installers/VersionCompare.js`

Compares dotted version strings numerically.

## Methods

- `VersionCompare.compare(a, b)` is positive when `a` is newer, negative when
  older, `0` when equal. Missing or non-numeric parts count as `0`, so `1.0`
  equals `1` and `1.10.0` is newer than `1.9.9`.

## Why

Plugin and IDE versions sort wrong as strings. Used by the JetBrains IDE
ordering, the VS Code installed-version pick and the VS Code boot refresh.

Reuse candidate for `core/shared` if anything outside the IDE installers needs
version ordering.
