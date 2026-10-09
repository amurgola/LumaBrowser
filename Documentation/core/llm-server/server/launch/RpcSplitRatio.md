# RpcSplitRatio

`core/llm-server/server/launch/RpcSplitRatio.js`

The explicit `--tensor-split` for a distributed (`--rpc`) launch.

## Methods

- `RpcSplitRatio.compute(rpcServers, diagnostics, localAdapterCount, needBytes)`
  returns MiB shares, remote devices first then local, or `null`.
  - remote share: free (else total) minus `DEVICE_RESERVE` (2 GiB);
  - local share: [CudaDeviceProbe](../../../shared/runtime/CudaDeviceProbe.md)`.readDevices`
    free (else total) minus the 1 GiB per-card reserve;
  - remote devices join only until local + joined capacity reaches
    `needBytes x TRIM_MARGIN (1.05)`; the rest get 0;
  - null when any server lacks per-device data, the local count differs from
    `localAdapterCount`, or every share is 0. A throwing probe counts as no cards.

## Why

llama.cpp registers RPC devices first, then local CUDA devices, verified against
the shipped CUDA 13 runtime. The shipped rpc-server fabricates its free memory
(total minus a margin), so an occupied remote card gets overallocated and the load
dies; the acquire-time probe is trusted instead. A wrong-length split misassigns
every device, which is worse than the default. Every device is a pipeline stage
(122B: 3 stages 41-57 tok/s, 4 stages ~10), hence the trimming.
