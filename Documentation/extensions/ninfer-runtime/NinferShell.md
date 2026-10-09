# NinferShell

`extensions/ninfer-runtime/NinferShell.js`

Runs a short shell command where NInfer lives.

## Methods

- `NinferShell.currentMode(platform = process.platform)` returns `'wsl'` on
  win32, else `'native'`.
- `NinferShell.spawnArgs(mode, distro, cmd)` returns `[bin, args]` for
  `bash -lc <cmd>`: through `WSL_EXE` (`-d <distro>` when given) in WSL mode,
  plain `bash` natively.
- `NinferShell.run(mode, distro, cmd, { timeout = PROBE_TIMEOUT_MS })` always
  resolves `{ ok, stdout, stderr }`: core `Wsl.runInWsl` in WSL mode, a local
  `bash -lc` natively (killed on timeout with `timed out` appended to stderr).
- Statics: `PROBE_TIMEOUT_MS` (20 s), `WSL_EXE` (`C:\Windows\System32\wsl.exe`).
