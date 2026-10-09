# SysdepsCommandRunner

`core/shared/runtime/SysdepsCommandRunner.js`

Runs a probe command (`ldconfig`, `ldd`) for `SysdepsChecker` and always
resolves a plain record. It is the default `exec` seam of `SysdepsChecker`.

## Methods

- `SysdepsCommandRunner.run(cmd, args, options)` resolves
  `{ ok, code, stdout, stderr }`. Never rejects: a non-zero exit gives
  `ok: false` with the exit code and whatever was printed; a spawn failure
  (e.g. command not installed) gives `ok: false, code: 'ENOENT'` (or the
  error code, else `'ERR'`) with empty stdout. `options` are merged over the
  defaults (hidden window, `TIMEOUT_MS`, `MAX_BUFFER_BYTES`), so callers can
  pass `env` and `cwd`.
- `SysdepsCommandRunner.TIMEOUT_MS` (10 s), `MAX_BUFFER_BYTES` (4 MiB).

## Why

A missing `ldconfig` or `ldd` is an answer ("probe the lib dirs instead",
"nothing to conclude"), not an error. A spawn failure can be reported both by
the `error` event and the exec callback, so only the first settles.
