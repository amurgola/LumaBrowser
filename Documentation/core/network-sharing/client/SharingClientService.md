# SharingClientService

`core/network-sharing/client/SharingClientService.js`

The client side of Network Sharing. Pairs with other LumaBrowsers by PIN, keeps
their manifests fresh, and registers their LLMs, image slots and GPUs into this
instance so they show up in the normal model picker, image-server config and
placement canvas.

Peer LLMs become an ordinary `type: 'openai'` provider config pointed at the
peer's `/sharing/llm` proxy ([PeerProviderConfigs](PeerProviderConfigs.md));
peer image slots become remote image servers ([PeerImageServers](PeerImageServers.md)).

## Methods

- `new SharingClientService({ db, imageServerService?, hostService?, onResourcesChanged? })`
  throws without `db`. Rebuilds the in-memory TLS pins from persisted peers.
  `hostService` supplies `instanceId` (skip self) and `getInstanceName()` (the
  pairing hint, falling back to the OS hostname).
- `setResourcesChangedNotifier(fn)` replaces the callback fired after a poll
  re-registers a peer (main.js tells renderers to re-list models).
- `listPeers()` returns the public rows from [PeerView](PeerView.md); no tokens or certs.
- `probe(address, port?)` normalises the address ([PeerAddress](PeerAddress.md))
  and calls `GET /sharing/info`. `{ success, base, info }` or `{ success: false, error }`.
- `pair(address, pin, { port })`: probe, refuse self, TLS upgrade
  ([PeerTlsUpgrade](PeerTlsUpgrade.md)) BEFORE the PIN is sent, exchange the PIN
  for a token, fetch the manifest, persist, register. A manifest failure still
  stores the peer (with `error`) so the user can retry. Returns `{ success, peer }`.
- `refreshPeer(id)` offers the TLS upgrade, re-fetches the manifest and
  re-registers an enabled peer. On failure it records `error` and returns it.
- `startPolling(intervalMs = 15000)`, `stopPolling()`: see [PeerPoller](PeerPoller.md).
- `setPeerEnabled(id, enabled)` registers (enabled with a manifest) or unregisters.
- `removePeer(id)` drops the pin, the resources and the record.
- `setPeerGpusAttached(id, attached)` opts in or out of borrowing the peer's
  GPUs at the next local llama-server start.
- `getAttachedGpuPeers()`, `getGpuPeerDevices()`: GPU views from PeerView.
- `rpcAcquire(id, { devices })`, `rpcHeartbeat(id)`, `rpcRelease(id)`: see
  [PeerApi](PeerApi.md). Unknown peer: `{ success: false, error: 'Peer not found.' }`,
  `{ success: false, gone: true }` and `{ success: true }` respectively.
- `startDiscovery()`, `stopDiscovery()`, `getDiscovered()`: mDNS through
  [PeerDiscovery](PeerDiscovery.md); already-paired hosts are filtered out.
- `shutdown()` stops polling and discovery.

## Why

The legacy class was 850 lines doing persistence, HTTP, TLS, polling,
registration and discovery. Each is now its own class; this one only sequences
them. Every public method name and reply shape is unchanged, because RpcPeers
reads the instance through `global.__lumaSharingClientService`
(`getAttachedGpuPeers`, `getGpuPeerDevices`, `rpcAcquire`, `rpcHeartbeat`,
`rpcRelease`) and the sharing IPC handlers call the rest.
