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
- `ChildProcessRegistry.killTree(pid, { platform, spawn, kill })` ends one process the same way (`taskkill /PID
  <pid> /T /F` on Windows, `kill(pid, 'SIGKILL')` elsewhere). `ChildReaper` uses it to stop a runtime whose launch
  says it starts helpers of its own.
- `ChildProcessRegistry.reset()` forgets every child (tests).

## Why

The only consumer of the whole list is the quit-failure path: when an orderly shutdown hangs and the user picks
Force quit, the app exits right after `killAll`, so a stuck runtime would otherwise keep its VRAM after the window is
gone. `/T` matters on Windows because runtimes start helper processes of their own.

State is static because there is exactly one registry per process and every spawn site must share it.

## Changes (2026-11-25)

- `adopt(owner, descendants)` / `release(owner)`: the helpers a launcher child started under it (Basalt's Python
  server and engine), which `killAll` (the forced quit) ends too, even once their launcher is gone.
- `killTreeNamed(pid, name)`: `taskkill /F /T /FI "PID eq <pid>" /FI "IMAGENAME eq <name>"`, so a pid reused by
  another program is left alone. No-op off Windows.
