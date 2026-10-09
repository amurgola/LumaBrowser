# PeerView

`core/network-sharing/client/PeerView.js`

Read-only projections of stored peers. Tokens and certificates never appear in them.

## Methods

- `PeerView.toPublic(peer)` the Settings row: `{ id, name, endpoint, addedAt,
  lastSeenAt, enabled, online, secure, tlsFingerprint, error, llmCount,
  imageGen, imageEdit, gpuCount, gpusBusy, gpusAttached }`.
- `PeerView.isSecure(peer)` is true for a pinned peer or an `https:` endpoint.
- `PeerView.hasGpus(peer)` is true when the manifest advertises at least one GPU.
- `PeerView.attachedGpuPeers(peers)` peers the next server start should borrow
  from (enabled, opted in, last seen online, advertising GPUs):
  `{ id, name, endpoint, devices: [{ index, name, vramTotalMB, vramFreeMB }] }`.
- `PeerView.gpuPeerDevices(peers)` every enabled peer advertising GPUs, for the
  placement canvas: `{ id, name, online, attached, busy, devices }`. It does not
  require the attach toggle or online state; dropping a GPU into the layout is
  itself the opt-in.
