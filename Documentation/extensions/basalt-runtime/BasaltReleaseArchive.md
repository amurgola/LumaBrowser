# BasaltReleaseArchive

`extensions/basalt-runtime/BasaltReleaseArchive.js`

Downloads one Basalt build's pinned release archive and unpacks it.

## Methods

- `new BasaltReleaseArchive({ build, runtimesRoot, managedDir, emit, canceled, platformKey, download?, extractor? }).install()`
  resolves `{ binaryPath, asset }`:
  1. emits `resolved` (the build's tag and asset), downloads the build's
     [BasaltCatalog](BasaltCatalog.md) asset into the runtimes staging folder
     (under the build's row id)
     with core `ResumableDownload` (`expectedSize` and `expectedSha256` from the
     catalog), emitting `download` progress;
  2. emits `extract` start, empties the managed dir (core
     `ManagedDir.wipeContents`) and unpacks with core `ArchiveExtractor`;
  3. finds `bin/basalt(.exe)` with core `BinaryLookup` (depth 3).
- Errors (`RuntimeInstallError`): `ASSET_NOT_FOUND` (the build has no archive for the host),
  `CANCELED`, `RUNTIME_IN_USE` (a file the wipe could not remove, naming up to
  four), `BINARY_NOT_FOUND_AFTER_EXTRACT`.

## Why

The tag is pinned, so the URL is known without the GitHub API. A file that
survives the wipe on Windows is held by a running Basalt, and unpacking over it
would fail on every file it holds, the same rule as core's GitHub-release
install.
