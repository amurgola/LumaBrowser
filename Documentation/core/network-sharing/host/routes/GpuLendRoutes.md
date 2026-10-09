# GpuLendRoutes

`core/network-sharing/host/routes/GpuLendRoutes.js`

`/sharing/rpc` routes for lending this host's GPUs. Routing only; the work is
in [SharedGpuLease](../SharedGpuLease.md).

## Methods

- `new GpuLendRoutes(service, auth)`; `mount(router)` adds, each behind
  `requireToken` then `SharedGpuLease.gate()`:
  - `POST /rpc/acquire` (`{ devices }`; bind address is `req.socket.localAddress`)
  - `POST /rpc/heartbeat`
  - `POST /rpc/release`
