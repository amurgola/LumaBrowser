# SharedGpuLease

`core/network-sharing/host/SharedGpuLease.js`

GPU lending (llama.cpp RPC) to one paired consumer at a time. Methods return
`{ status, body }` replies.

## Methods

- `new SharedGpuLease(service)` (`getShareFlags`, `getRpcLending`).
- `gate()`: 403 `GPU sharing is disabled on the host`, 503 `GPU lending is not
  available on the host`, else null.
- `acquire(credential, { devices }, bindAddress)`: calls the lender with the
  holder name and the credential id as `holderId`; failure is 409 (busy) or 500 with `{ error, busy }`; success is
  `{ port, devices, leaseMs, devicesInfo|null }`.
- `heartbeat(credential)`: 403 `This GPU lease belongs to another peer` when the
  caller is not the holder, 410 `No active GPU lease`, else `{ leaseMs }`.
- `release(credential)`: 403 for a non-holder, else `{ success: true }`.
- `SharedGpuLease.idOf(credential)`: the credential id, or null.
- `SharedGpuLease.holderOf(credential)`: `peerHint`, else `label`, else `'peer'`.

## Why

`acquire` spawns ggml-rpc-server bound to the address the consumer reached us
on (`req.socket.localAddress`). A second consumer gets 409 and queues on its
side, mirroring the local slot queue.
