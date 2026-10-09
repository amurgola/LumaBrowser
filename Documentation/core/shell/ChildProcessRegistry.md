# ChildProcessRegistry

`core/shell/ChildProcessRegistry.js`

Process-wide inventory of the native children the app spawns (llama-server, sd-server, rpc-server, music, whisper,
grounding runtimes), so force quit can kill whatever is still alive.

## Methods

- `ChildProcessRegistry.track(child)` registers a spawned child and returns it, so a spawn call can be wrapped
  inline. Children without a numeric `pid` are ignored. The entry drops itself on `exit` or `error`.
- `ChildProcessRegistry.pids()` returns the pids of tracked children that have neither an `exitCode` nor a
  `signalCode`.
- `ChildProcessRegistry.killAll({ platform, spawn, kill, log })` kills every live tracked child and returns the
  pids it targeted. Windows uses `taskkill /PID <pid> /T /F`; elsewhere `kill(pid, 'SIGKILL')`. Never throws.
- `ChildProcessRegistry.reset()` forgets every child (tests).

## Why

The only consumer of the whole list is the quit-failure path: when an orderly shutdown hangs and the user picks
Force quit, the app exits right after `killAll`, so a stuck runtime would otherwise keep its VRAM after the window is
gone. `/T` matters on Windows because runtimes start helper processes of their own.

State is static because there is exactly one registry per process and every spawn site must share it.
