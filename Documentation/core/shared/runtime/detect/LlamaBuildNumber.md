# LlamaBuildNumber

`core/shared/runtime/detect/LlamaBuildNumber.js`

Reads the llama.cpp build number from a tag or version label.

## Methods

- `LlamaBuildNumber.parse(version)` returns the number after the first `b`
  (case-insensitive) followed by digits, or `null`.

## Why

Capability gates (minimum build for Harmony, for a flag) compare build numbers.
The managed manifest's release tag is preferred over `--version` because some
forks report a rebased version.
