# WslFormat

`core/music-server/runtimes/WslFormat.js`

Pure string helpers for driving WSL2 from Windows. Nothing here spawns a process.

## Methods

- `WslFormat.toWslPath(winPath)` maps `C:\a\b` to `/mnt/c/a/b`; any other shape
  falls through with forward slashes so the caller's error shows the real path.
- `WslFormat.shellQuote(value)` POSIX single-quotes a value for a `bash -lc`
  command string (`'` becomes `'\''`).
- `WslFormat.killPortCommand(port, pattern = 'sgl-omni')` returns
  `fuser -k <port>/tcp 2>/dev/null || pkill -f '<pattern>.*--port <port>' || true`.
  The port is coerced with `Number()` (a string injection becomes `NaN`) and the
  pattern is stripped to `[A-Za-z0-9_.-]`.
- `WslFormat.parseList(text)` parses `wsl -l -v` rows after the header into
  `{ isDefault, name, state, version }`.
- `WslFormat.decodeOutput(buffer)` decodes wsl.exe output, picking UTF-16LE when
  more than a quarter of the first 64 bytes are NUL, else UTF-8; strips NULs and trims.
- `WslFormat.DEFAULT_KILL_PATTERN` is `'sgl-omni'`.

## Why

wsl.exe writes its own messages (for example `wsl -l -v`) as UTF-16LE but
passes distro command output through as UTF-8, so output is captured as buffers
and sniffed. Terminating wsl.exe on the Windows side does not reliably kill the
Linux process inside the VM, and a survivor would hold the port and the VRAM,
hence the in-distro kill. Callers supervising other servers pass their own
process-name pattern.
