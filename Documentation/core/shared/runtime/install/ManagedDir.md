# ManagedDir

`core/shared/runtime/install/ManagedDir.js`

Paths and housekeeping for `<runtimesRoot>/<id>` and the `.tmp` staging folder.

## Methods

- `ManagedDir.pathFor(runtimesRoot, id)`.
- `ManagedDir.stagingPathFor(runtimesRoot, id, assetName, label)` ->
  `<root>/.tmp/<id>[-<label>]-<timestamp>-<basename(assetName)>`.
- `ManagedDir.ensure(dir)` mkdir -p.
- `ManagedDir.wipeContents(dir, { rm? })` empties the folder, keeping it, and
  resolves the names it could not delete (`[]` when clean or missing); `rm` is a
  test seam for the per-entry delete.
- `ManagedDir.remove(dir)` resolves whether anything was removed.
- `ManagedDir.removeQuietly(file)` fire-and-forget unlink.

## Why

Wiping before extraction stops a stale layout from an older release shadowing
the new binary. The installer and detector both derive the managed dir here.
On Windows an executable or DLL loaded by a running process cannot be deleted,
so the survivors tell [GithubRuntimeInstall](GithubRuntimeInstall.md) the
runtime is in use before any extractor fails on them.
