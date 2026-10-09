# FileLinker

`core/shared/fs/FileLinker.js`

Places a large model file at a second path without copying it, for the LLM and
image "adopt a model another tool already has" flows.

## Methods

- `FileLinker.link(sourcePath, destPath)` returns one of:
  - `{ success: true, mode: 'hardlink' | 'symlink' | 'existing' }`
  - `{ success: false, clash: true, error }` when a different file already
    sits at `destPath` (it is left untouched)
  - `{ success: false, error }` when neither link kind could be made
- `FileLinker.isSameFile(a, b)` is true when both paths are the same file on
  disk (same device and inode, or same realpath). Never throws.

## Why

Hardlink first: on the same volume it is free, duplicates no bytes and
survives the source app removing its own entry. Symlink second covers
cross-volume. Both can fail on Windows without Developer Mode, and the caller
is told so rather than this silently copying 20 GB.

A hardlink is not a symlink: `realpath` of a hardlink is its own path, so
identity is checked by device and inode first. A destination that already is
the source (a re-run) is success (`existing`), not a clash.
