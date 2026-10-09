# Wsl

`core/music-server/runtimes/Wsl.js`

Runs commands inside a WSL2 distro through wsl.exe and detects WSL2 + NVIDIA
readiness for CUDA workloads on Windows.

## Methods

- `Wsl.exec(args, { timeout })` runs `wsl.exe` (hidden window, buffer output,
  4 MiB max) and always resolves `{ ok, stdout, stderr, reason }`. `reason` is
  `wsl.exe not found` for ENOENT, else stderr or the error message (max 500 chars).
- `Wsl.runInWsl(distro, command, { timeout })` runs `bash -lc <command>` in the
  distro (`-d <distro>` when given, else the default distro).
- `Wsl.detect()` resolves `{ present, wsl2, distro, nvidiaDriverOk, note }`:
  non-Windows hosts short-circuit; no wsl.exe means not present; only WSL1
  distros or none means not usable (with a fix-it note); otherwise the default
  WSL2 distro (else the first) is checked with `nvidia-smi -L`.
- `Wsl.killPortInWsl(distro, port, { timeout, pattern })` runs
  `WslFormat.killPortCommand` inside the distro.
- Statics: `PROBE_TIMEOUT_MS` (15 s), `MAX_BUFFER`, `REASON_MAX`.

## Why

SGLang-Omni is CUDA/Linux-only, so on Windows the music venv lives inside a WSL2
distro and is spawned through wsl.exe. Everything goes through `execFile` of
wsl.exe directly, never a Windows shell, so the only quoting that matters is the
POSIX quoting of the command handed to bash. Every probe is fail-soft because
detection runs on every runtimes-view refresh. WSL1 has no GPU passthrough,
hence the version-2 requirement.

User-facing notes had their em-dashes replaced during the port.
