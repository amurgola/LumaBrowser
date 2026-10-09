# WslHostFailover

`core/music-server/server/WslHostFailover.js`

Health probing and teardown for a runtime child that may live inside WSL2 behind
wsl.exe. Used by [MusicRuntimeServer](MusicRuntimeServer.md) and
[LlmRuntimeServer](../../llm-server/server/LlmRuntimeServer.md) (WSL-hosted
extension runtimes).

## Methods and fields

- `new WslHostFailover({ plan, logTag, onHostChange })`. From `plan`: `mode`
  (`'wsl'`, anything else is native), `distro` (kept in WSL mode only),
  `processPattern`, `host` (default `127.0.0.1`).
- `probe(port, { path = '/health', timeoutMs = 1500 })` true when the current
  host, or the fallback distro IP, answers 200. A different answering host
  becomes `host` and is passed to `onHostChange(host)`. A hit resets the miss
  count; in WSL mode, from the 20th consecutive miss (`FALLBACK_AFTER_MISSES`)
  each miss asks `hostname -I` inside the distro (5 s) until an IPv4 is found,
  which then joins the candidates.
- `killPort(port)` awaits [Wsl](../runtimes/Wsl.md)`.killPortInWsl(distro, port, { pattern })`
  in WSL mode; logs failures, never throws. No-op natively or without a port.
- `killPortDetached(port)` the same, fire and forget.
- Fields `mode`, `distro`, `host`, getter `isWsl`.

## Why

Killing wsl.exe does not kill the Linux process, which keeps its VRAM; the port
has to be freed inside the distro. Health goes over WSL2's localhost forwarding,
which can be off (`.wslconfig`, mirrored-networking edge cases); then the
distro's own IP is the only address the server answers on.
