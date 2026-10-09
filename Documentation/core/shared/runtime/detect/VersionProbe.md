# VersionProbe

`core/shared/runtime/detect/VersionProbe.js`

Runs `<binary> --version` and turns the result into `{ version, probeError }`.

## Methods

- `VersionProbe.read(binaryPath, parse)` resolves `{ version, probeError }`.
  `parse(stdout, stderr)` sees only a clean exit's output; a throwing parser
  gives `probeError: 'version output could not be parsed'`. Runs with cwd =
  the binary's directory, 4 s timeout, 256 KB buffer, and on Linux the binary
  directory prepended to `LD_LIBRARY_PATH`.
- `VersionProbe.normalize(result)` accepts `{ version, probeError }` or a bare
  string / null (a clean probe).
- `VersionProbe.describeFailure(err, stderr)`: `binary not found` (ENOENT),
  `version probe timed out` (killed), else the first non-blank stderr line (or
  the error message), capped at 200 characters, plus ` (exit N)`.

## Why

A loader failure such as "error while loading shared libraries: libgomp.so.1"
used to be cached as the runtime's version label. The raw text now goes to a
warning chip and the log, never the dropdown.
