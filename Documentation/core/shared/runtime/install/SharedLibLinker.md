# SharedLibLinker

`core/shared/runtime/install/SharedLibLinker.js`

Linux: gathers every shared library in an install beside the binary.

## Methods

- `SharedLibLinker.consolidate(rootDir, binDir)` walks `rootDir` (5 levels,
  skipping `binDir`) and symlinks each `*.so` / `*.so.N...` into `binDir` by a
  relative link. Existing names are kept; failures are ignored.
- `SharedLibLinker.isSharedLib(name)`.

## Why

Release layouts scatter libs (binary in `build/bin/`, cudart at the root, NCCL
under `lib/`), and the Linux loader never searches the executable's directory.
With every lib beside the binary, the launcher and the `--version` probe only
need `LD_LIBRARY_PATH=<binary dir>`.
