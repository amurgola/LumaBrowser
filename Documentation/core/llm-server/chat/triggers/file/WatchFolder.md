# WatchFolder

`core/llm-server/chat/triggers/file/WatchFolder.js`

The safety rules for a file trigger's folder.

## Methods

- `WatchFolder.validate(dir, { forbiddenRoots = [] })` returns the folder's
  real path, or throws:
  - `the watch folder must be an absolute path`
  - `the watch folder does not exist: <dir>`
  - `the watch folder cannot be read: <dir>`
  - `not a folder: <dir>`
  - `refusing to watch a drive root; pick a folder`
  - `refusing to watch inside the application or its data folder` (the folder
    equals or is inside a forbidden root; roots are compared by real path when
    they exist)
- `WatchFolder.resolveInside(dir, candidate)`: resolves a relative or absolute
  path against the folder; the folder itself or anything inside it is allowed,
  anything else throws `path is outside the watch folder`.

## Why

Every path a trigger run's file tools touch is pinned under the folder
(`triggers/fileTools.js` uses `resolveInside`), and a trigger must never watch
the app's own files or data, which it would then be able to read or write.
Containment uses [ContainedPath](../../../../shared/fs/ContainedPath.md).
