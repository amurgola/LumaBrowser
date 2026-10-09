# BinaryLookup

`core/shared/runtime/BinaryLookup.js`

Finds a runtime executable inside an extracted release archive by a bounded
breadth-first walk.

## Methods

- `BinaryLookup.findBinaryIn(dir, names, { maxDepth = 3 } = {})` returns the
  absolute path of the first existing candidate, or `null`. At each directory
  the `names` are tried in order; shallower hits win over deeper ones.
  `maxDepth` 0 searches `dir` only. Returns `null` for a missing `dir` or an
  empty or non-array `names`.
- `BinaryLookup.pathExists(target)` resolves `true` when the path exists.
- `BinaryLookup.DEFAULT_MAX_DEPTH` is 3, the depth both installers use.

## Why

Upstream projects ship their binary at inconsistent depths: the archive root,
`build/bin/`, or a versioned folder such as `llama-<ver>-bin-win-cuda/`. When a
new upstream ships one level deeper, this is the file that changes. It is not a
generic fs utility.

The walk keeps a visited set because symlinked release trees occur. Unreadable
directories are skipped rather than thrown, because a partially extracted
archive is a normal transient state during install. A missing root is rejected
before any `readdir` is attempted.

The logic used to be duplicated between the runtime detector and installer.
