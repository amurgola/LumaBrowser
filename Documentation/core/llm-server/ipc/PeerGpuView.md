# PeerGpuView

`core/llm-server/ipc/PeerGpuView.js`

The GPUs attached network-sharing peers offer for distributed inference.

## Methods

- `PeerGpuView.view({ client?, rpcPeers? })` returns `{ peers: [{ id, name, devices }], active, activePeers }`.
  `client` defaults to `global.__lumaSharingClientService` (no client, no peers);
  `rpcPeers` to [RpcPeers](../server/RpcPeers.md).
