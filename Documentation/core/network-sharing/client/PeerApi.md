# PeerApi

`core/network-sharing/client/PeerApi.js`

The HTTP calls a sharing client makes to a host's `/sharing` API, over axios.
Every call resolves a result object and never throws. Every call to a pinned
https origin carries the pin-enforcing agent from [PinnedTls](../tls/PinnedTls.md);
a public-CA https endpoint keeps normal verification; plain http gets nothing.
All calls accept any status (`validateStatus: () => true`).

## Methods

- `PeerApi.info(base)` `GET /sharing/info` (5 s): `{ success: true, base, info }`
  or `Not a LumaBrowser sharing host (HTTP n).` / the network error message.
- `PeerApi.pair(base, pin, peerHint)` `POST /sharing/pair` with
  `{ pin: String(pin), peerHint }` (8 s): `{ success: true, token }` or the
  host's `error` / `Pairing failed (HTTP n).`.
- `PeerApi.fetchManifest(peer)` `GET /sharing/resources` with the bearer token
  (8 s): `{ success: true, manifest }`; 401 is `Pairing token rejected. Re-pair with the PIN.`
- `PeerApi.rpcAcquire(peer, devices)` `POST /sharing/rpc/acquire` (30 s, the
  peer spawns rpc-server first): `{ success: true, addr: '<peer host>:<port>',
  devices, devicesInfo (or null), leaseMs (default 60000) }`; 409 is
  `{ success: false, busy: true, error }`.
- `PeerApi.rpcHeartbeat(peer)` (8 s): 410 is `{ success: false, gone: true }`,
  200 `{ success: true }`, a network error `{ success: false }` (not gone, so
  the caller keeps beating; the peer's lease TTL decides).
- `PeerApi.rpcRelease(peer)` (8 s) always `{ success: true }`.
