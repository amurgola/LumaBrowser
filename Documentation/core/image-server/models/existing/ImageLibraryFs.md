# ImageLibraryFs

`core/image-server/models/existing/ImageLibraryFs.js`

Fail-soft filesystem reads for the existing-image-library scan: a missing or
unreadable path is "nothing there", never an exception that aborts the scan.

## Methods

- `statOrNull(p)`, `isDir(p)`, `listDirs(dir)` (full paths of child dirs, `[]` on error).
- `firstDir(dir, names)` returns the first existing child among `names`, tried
  in order because Linux is case-sensitive.
- `homedir()` returns `os.homedir()` or `null`.
- `realPathOr(p, fallback)` returns the real path or `fallback`.
