# ExistingImageModelLinker

`core/image-server/models/existing/ExistingImageModelLinker.js`

Places one found checkpoint into the app's image library without copying it.
The caller owns the model folder and manifest; this is only the placement.

## Methods

- `ExistingImageModelLinker.link({ sourcePath, destDir, fileName? })` returns
  `{ success: true, destPath, mode }` (`hardlink`, `symlink` or `existing`) or
  `{ success: false, clash?: true, error }`. The file name defaults to the
  source basename and `destDir` is created. A vanished source, a missing
  argument or a link failure is an error result, never a throw.

## Why

Linking uses [FileLinker](../../../shared/fs/FileLinker.md): a hardlink first,
then a symlink, and an honest failure instead of a silent multi-GB copy. On
Windows a symlink needs Developer Mode or admin, so the failure message points
at "Import custom model" (which copies).
