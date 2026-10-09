# RpcLendingService

`core/network-sharing/host/RpcLendingService.js`

The lender half of distributed inference: lends this machine's GPUs to one
paired peer at a time by spawning llama.cpp's `ggml-rpc-server` on demand. The
`/sharing/rpc/*` routes ([GpuLendRoutes](routes/GpuLendRoutes.md) through
[SharedGpuLease](SharedGpuLease.md)) call `acquire`, `heartbeatFor` and `releaseFor`;
the manifest advertises the inventory via `describeShare`. The consumer half is
[RpcPeers](../../llm-server/server/RpcPeers.md).

## Construction

`new RpcLendingService({ db?, llmServerService?, vramCoordinator?, spawn?,
readDevices?, waitForPort?, findFreePort?, platform? })`

- `llmServerService` supplies `getRuntimesDir()`, `getDefaults().runtimeId` and
  `getCachedDiagnostics()`.
- Defaults: `VramCoordinator.shared`, `child_process.spawn`,
  `CudaDeviceProbe.readDevices`, [RpcPortWaiter](rpc/RpcPortWaiter.md)`.wait`,
  a free port in the `rpcLend` window (50052-50059), `process.platform`.
- Public fields kept from legacy: `db`, `llmServerService`.

## Methods

- `resolveBinary()` / `isSupported()` ([RpcServerBinary](rpc/RpcServerBinary.md)).
- `describeShare()` `{ available, busy, devices }`: the inventory
  ([RpcDeviceInventory](rpc/RpcDeviceInventory.md)) and `available` (devices and
  a binary) are cached for 60 s; `busy` is always live.
- `isActive()`, `getStatus()` (`{ active: false }` or `{ active: true, holder,
  port, host, devices }`), `getPortRange()` (a copy).
- `acquire({ devices?, holder?, holderId?, bindAddress? })` in order (`holderId`
  is the paired credential id that owns the lease):
  1. refuses while a lend is live: `{ success: false, busy: true, error: 'GPUs are already lent to another consumer.' }`;
  2. `No llama.cpp rpc-server binary is installed on this host.`;
  3. probes free VRAM now (not the cache): `This host has no CUDA devices to lend.`;
  4. grants the requested indexes that exist (all cards when none are asked):
     `None of the requested devices exist on this host.`;
  5. picks the bind address ([RpcBindAddress](rpc/RpcBindAddress.md)):
     `Could not determine a LAN address to bind the RPC listener to.`;
  6. takes a free port, then holds `gpu-lend` in the VRAM ledger on the granted
     cards with their full total VRAM (role `llm`) before spawning;
  7. spawns `<binary> -H <host> -p <port> -c` from the binary's folder with
     `CUDA_VISIBLE_DEVICES` set to the granted cards, tracked in
     ChildProcessRegistry; a throwing spawn releases the hold
     (`Could not start rpc-server: <reason>`); the child's exit or error ends
     the lease;
  8. waits up to 20 s for the port to accept connections, else tears down and
     returns `rpc-server started but its port never opened. Check the host firewall.`;
  9. returns `{ success: true, port, devices, leaseMs: 75000, devicesInfo }`
     (`devicesInfo` the acquire-time inventory rows, in lent order).
- `heartbeat()` `{ success: true, leaseMs }`, or `{ success: false, gone: true }`.
- `release()` ends the lease (`released by consumer`); `{ success: true }` either way.
  The host itself uses it (sharing turned off, shutdown).
- `heartbeatFor(holderId)` / `releaseFor(holderId)`: the peer-facing versions.
  They answer `{ success: false, notHolder: true }` unless `holderId` matches the
  credential that acquired the lease (a lease acquired without an id accepts any).
- `waitUntilFree(timeoutMs = 30000)` true at once when idle, true when the lend
  ends, false on timeout ([LendWaiters](rpc/LendWaiters.md)).
- `shutdown()` ends a live lease (`host shutting down`).
- Teardown releases the ledger hold, stops the watchdog, logs
  `[sharing] GPU lend ended: <reason>`, terminates the child
  ([RpcChildTerminator](rpc/RpcChildTerminator.md)) and wakes the waiters. A
  watchdog every 15 s ends a lease with no heartbeat for 75 s.
- Statics: `RPC_PORT_RANGE`, `LEASE_TTL_MS`, `WATCHDOG_TICK_MS`,
  `DESCRIBE_CACHE_MS`, `READY_TIMEOUT_MS`, `DEFAULT_WAIT_FREE_MS`, `LEND_SERVER_ID`.

## Security

llama.cpp's RPC protocol has no authentication and no encryption, and this port
adds neither: anyone who can reach `<bind address>:<port>` while a lease is
live can drive the lent GPUs, and the tensors cross the LAN in clear. What
protects a lend, all unchanged from legacy:

- The lease API is gated: every `/sharing/rpc/*` route needs a valid pairing
  token (or the core API key) and the host's `shareGpus` flag (403 when off,
  503 without a lender). Turning `shareGpus` off or disabling sharing releases
  a live lend at once.
- The rpc-server process exists only while a lease is live; it is spawned on
  `acquire` and killed on release, child death, heartbeat expiry (75 s) or
  shutdown. Termination escalates to SIGKILL and, on Windows, `taskkill /T /F`.
- It binds to exactly one IPv4 address: the one the consumer reached the
  sharing API on, else the first private (RFC1918) LAN address. Never
  `0.0.0.0` and never `127.0.0.1`; with no usable address the lend is refused.
- One consumer at a time; a second `acquire` gets `busy`.
- Only the granted cards are visible to the child (`CUDA_VISIBLE_DEVICES`).

Fixed in the port (2026-10-04): legacy let any paired peer heartbeat or release
another peer's lease, because the routes never checked the holder. Only the
acquiring credential can now keep a lease alive or end it (403 for others).

Still open: nothing limits which LAN host connects to the rpc-server port during
a lease. llama.cpp RPC has no authentication or encryption of its own.

## Why

The free VRAM in `devicesInfo` is probed at acquire time because rpc-server's
own memory report is fabricated (total minus a fixed margin) and the consumer
sizes its `--tensor-split` against it. The ledger hold is taken before the
child spawns so a local launch racing the lend sees the cards as busy.
