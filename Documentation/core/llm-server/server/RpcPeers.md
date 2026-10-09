# RpcPeers

`core/llm-server/server/RpcPeers.js`

Consumer half of distributed inference: borrows peers' GPUs for a llama-server
launch, heartbeats the leases, and releases them.

## Methods

- `RpcPeers.acquireForLaunch({ want }?)` borrows peer GPUs and resolves
  `{ servers, skipped }`.
  - Without `want`: every peer the user attached (`getAttachedGpuPeers`), all GPUs.
  - With `want: [{ peerId, devices }]`: exactly those peers and device subsets, in
    list order, from the full peer view (`getGpuPeerDevices`). Placing a remote
    GPU in the Advanced-tab layout is itself the opt-in, so attach toggles are
    not consulted.
  - Each server is `{ addr, label, peerId, totalBytes, freeBytes, devices:[{ index, name, totalBytes, freeBytes }] }`.
    `addr` values become llama-server's `--rpc` flag, in this order.
  - Each skip is `{ name, reason }` with reason `peer no longer paired`,
    `offline`, `requested GPUs not advertised`, `busy (in use by another machine)`,
    the peer's error text, or `unreachable`.
- `RpcPeers.isActive()` whether any lease is held.
- `RpcPeers.activePeers()` copies of `{ peerId, addr, label }` for each lease.
- `RpcPeers.releaseAll()` returns every lease and stops the heartbeat. Idempotent;
  release errors are swallowed because the peer's lease TTL reaps it.
- `RpcPeers.HEARTBEAT_MS` (20 s) and `RpcPeers.BUSY_RETRY_DELAY_MS` (3 s).

## Why it works this way

State is process-wide (static fields), mirroring VramCoordinator: there is exactly
one local llama-server, so there is one active borrow set. The sharing client
service is read lazily from `global.__lumaSharingClientService` because network
sharing wires itself in main.js; tests and headless runs simply have no peers.

A busy peer is retried once after a short pause (its previous consumer may be
mid-release), then skipped for this boot, so the launch proceeds on local capacity
rather than wedging behind a remote queue. Unavailable peers and devices are
skipped, never a launch failure (optional-GPU rule).

Device sizes prefer the acquire-time probe (`devicesInfo`) over the manifest,
which can lag behind real free VRAM; the planner's per-device layer split must
match what the remote cards can hold now. Older hosts send no probe, so the
manifest devices that were lent are used instead.

When a heartbeat reports a lease gone, the entry is dropped and a warning logged;
the running llama-server keeps its TCP connection and usually survives.

Callers: the server launcher acquires before planning and releases on launch
failure; LLMServerService releases on the supervisor's idle/error transition; the
LLM IPC status handler reads `isActive` and `activePeers`.
