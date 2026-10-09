# RemoteDeviceRef

`core/shared/runtime/placement/RemoteDeviceRef.js`

Encodes a GPU borrowed from a network-sharing peer as `r:<peerId>:<gpuIndex>`.

## Methods

- `RemoteDeviceRef.isRef(value)` true only for strings matching the pattern.
- `RemoteDeviceRef.parse(value)` -> `{ peerId, index }` or null. The peer id is
  everything between `r:` and the last `:<digits>`.
- `RemoteDeviceRef.format(peerId, index)` -> `r:<peerId>:<index>`.

## Why

A gpu or gpu-group resource may mix remote GPUs with local CUDA indices.
Remote devices are LLM-only and never reach `CUDA_VISIBLE_DEVICES`: the
launcher borrows the peers (`PlacementLayout.remoteRefsFor`) and llama.cpp
reaches them over `--rpc`.
