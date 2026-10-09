# FileProbe

`core/llm-server/models/libraries/FileProbe.js`

Never-throwing filesystem checks for scanning other tools' libraries.

## Methods

- `FileProbe.stat(path)` returns `fs.Stats` or `null`.
- `FileProbe.isDirectory(path)` is true only for an existing directory.
- `FileProbe.sizeIfAtLeast(path, minBytes)` returns the size of a regular file
  at least `minBytes` big, else `null`.
- `FileProbe.readDirectory(path)` returns `Dirent[]`, or `[]` when unreadable.
- `FileProbe.realPath(path)` returns the resolved path, or `path` itself when it
  cannot be resolved.

## Why

Any path in someone else's library may vanish, be unreadable or point somewhere
odd mid-scan; a scan must degrade to "not found", never throw.
