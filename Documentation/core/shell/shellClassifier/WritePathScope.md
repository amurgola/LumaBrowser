# WritePathScope

`core/shell/shellClassifier/WritePathScope.js`

The directories a shell command may write into, with path rules taken from the roots rather than the host.

## Methods

- `new WritePathScope(start, roots, env)`: Windows rules (`path.win32`, case-insensitive, backslashes) when `start`
  or any root is a drive or UNC path, else posix. The temp dirs `os.tmpdir()`, `/tmp`, `/var/tmp`, `/private/tmp` and
  the `TEMP`/`TMP` env values are always allowed.
- `WritePathScope.isWindowsRoot(root)`.
- `isWindows`, `path` (the `path.win32` or `path.posix` in use).
- `allows(absolute)`: inside (or equal to) any root or temp dir.
- `normalize(target)`: resolved, lowercased with backslashes on Windows, no trailing separator.
