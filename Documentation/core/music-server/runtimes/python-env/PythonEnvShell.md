# PythonEnvShell

`core/music-server/runtimes/python-env/PythonEnvShell.js`

Runs the python-env install commands. Never rejects.

## Methods

- `PythonEnvShell.stream({ mode, distro, cmd, timeout, canceled, onLine })`
  spawns `wsl.exe [-d <distro>] -- bash -lc <cmd>` in wsl mode, else
  `bash -lc <cmd>` (hidden window, piped output). Resolves
  `{ ok, out, tail, canceled }`:
  - exit 0: `ok: true`, `tail: ''`; non-zero: `tail` is the last 8 non-blank
    output lines (max 2000 chars);
  - spawn error: `tail` is its message;
  - `canceled()` polled every 500 ms: kills the child, `tail: 'canceled'`,
    `canceled: true`;
  - timeout: kills the child, `tail: 'timed out after <n> min'`.
  `onLine(line)` gets only informative lines (downloading, installed, building,
  preparing, resolved, bytecode, creat...), NUL-stripped, trimmed, max 200 chars.
  `out` keeps the last 256 KiB once it passes 512 KiB.
- `PythonEnvShell.exec(cmd, args, timeout)` runs `execFile` (hidden, 4 MiB
  buffer) and resolves `{ ok: true, stdout, stderr }` or
  `{ ok: false, reason }` (stderr, else the error message, max 500 chars).
- `PythonEnvShell.lastLines(text, n = 8)`, `PythonEnvShell.informativeLines(text)`.

## Why

`uv pip install` of torch and flashinfer runs for many minutes, so progress is
streamed and pip's carriage-return spinner noise is filtered out. Output is
capped so a huge log cannot grow without bound, and only the tail is ever
reported in an error. Cancel is polled because the install's cancel flag is a
function owned by the caller.
