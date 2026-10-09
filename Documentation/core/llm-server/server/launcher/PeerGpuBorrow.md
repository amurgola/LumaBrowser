# PeerGpuBorrow

`core/llm-server/server/launcher/PeerGpuBorrow.js`

Borrows network-sharing peers' GPUs (llama.cpp RPC) for a local start.

## Methods

- `new PeerGpuBorrow({ rpcPeers, log })`.
- `borrow(ctx)` does nothing unless the layout places the LLM on remote GPUs, or
  `defaults.usePeerGpus` is on and the layout leaves the LLM unplaced. Then:
  - it probes a plan with `noAutoCpuMoe: true` (against the group's local cards
    when the layout names remote GPUs); a `fullOffload` probe sets
    `overrides.rpcSkippedFitsLocal` and borrows nothing;
  - otherwise `rpcPeers.acquireForLaunch({ want })` (layout) or
    `acquireForLaunch(undefined)` (every attached peer); any servers go to
    `overrides.rpcServers` and set `ctx.rpcAcquired`. Skips and failures are logged.
- `release(ctx)` calls `rpcPeers.releaseAll()` when `ctx.rpcAcquired`; errors are
  swallowed. It does not clear the flag (the rescues read it).
- `PeerGpuBorrow.wantList(remoteRefs)` merges refs per peer, a peer's first
  appearance fixing its position: `[{ peerId, devices }]`.

## Why

Measured on the LAN, RPC costs about 35% of generation speed and 3-4x prompt
processing, so a model that fits locally runs faster alone. The probe disables
auto expert-offload because a MoE model fully offloaded across peers beats local
experts-in-RAM. A busy or offline peer never fails a start.
