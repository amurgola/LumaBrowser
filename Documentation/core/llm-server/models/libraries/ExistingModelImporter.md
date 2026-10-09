# ExistingModelImporter

`core/llm-server/models/libraries/ExistingModelImporter.js`

Adopts one found model into the app's models directory by linking it, never
copying.

## Methods

- `ExistingModelImporter.importModel({ sourcePath, fileName, modelsDir })`
  links `sourcePath` to `<modelsDir>/imported/<name>.gguf` (`fileName`, else the
  source basename; `.gguf` appended when missing) with
  [FileLinker](../../../shared/fs/FileLinker.md). Returns
  `{ success: true, destPath, mode: 'hardlink' | 'symlink' | 'existing' }` or
  `{ success: false, error }`:
  - `A source path and models directory are required.`
  - `That file is no longer there. Rescan and try again.`
  - `Could not create <dir>: <reason>`
  - `<name> already exists in your models folder.` (a different file holds the name)
  - on Windows when both link kinds are refused: `Windows would not let
    LumaBrowser link to that file (linking needs Developer Mode or admin). You
    can instead point your models directory at that folder in Setup.`; elsewhere
    `Could not link that file: <error>`.
- `ExistingModelImporter.SUBDIRECTORY` is `'imported'`.

## Why

A hardlink costs nothing and duplicates no bytes; a symlink covers cross-volume.
Silently copying 20 GB behind a button labelled "Use this" would be worse than
saying no. Re-adopting the same file (a wizard re-run) is success (`existing`),
not a clash.

Adopted models live in their own subdirectory because a projector in the flat
models dir pairs with every weight file beside it, and a borrowed library is
exactly where a stray projector comes from. Ollama blobs have no extension, so
they get a real `.gguf` name for the models scanner.
