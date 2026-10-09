# NinferStreamingCommand

`extensions/ninfer-runtime/NinferStreamingCommand.js`

Runs one long install step (clone, build, extract) with streamed progress.

## Methods

- `NinferStreamingCommand.run({ mode, distro, cmd, timeout, isCanceled?, onLine? })`
  (shorthand for `new ...(o).execute()`) resolves:
  - `{ ok: true, out, tail: '' }` on exit 0;
  - `{ ok: false, out, tail }` on a non-zero exit (last 12 output lines), a
    spawn error (its message) or the timeout (`timed out after <n> min`);
  - `{ ok: false, out, canceled: true }` when `isCanceled()` turns true (polled
    every 500 ms; the child is killed).
- `onLine(line)` receives trimmed lines (max 200 chars) that look like
  progress: `[n/m]`, cloning, receiving, resolving, building, linking,
  configuring, generating, extracting, error, `warning: unused`.

## Why

NUL characters are stripped because wsl.exe can interleave UTF-16 output. The
captured output is capped (512 KiB, trimmed to the last 256 KiB) because a CUDA
build prints a lot. It mirrors the music installer's streaming runner, which is
not exported.
