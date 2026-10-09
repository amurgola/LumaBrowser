# BuildSidecar

`tools/ide/BuildSidecar.js`

The `{ version, builtAt, sourceMtime, ... }` JSON next to a build's output, used to skip unchanged rebuilds.

## Methods

- `new BuildSidecar(file)`; `isUpToDate(version, sourceMtime)`, `read()`, `write(fields)` (adds `builtAt`).
