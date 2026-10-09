# ProcessTreeKiller

`core/shell/command-runner/ProcessTreeKiller.js`

Kills a command's whole process tree. Never throws.

## Methods

- `new ProcessTreeKiller({ platform, spawn })`.
- `kill(child)` no-op without a pid. Windows: `taskkill /pid <pid> /T /F`. POSIX:
  `SIGKILL` to the process group (`-pid`; the runner spawns children detached so
  they lead one), falling back to the child itself.
