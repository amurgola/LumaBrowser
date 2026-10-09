# VramSnapshotBuilder

`core/placement/service/VramSnapshotBuilder.js`

Builds the VRAM snapshot the placement canvas renders.

## Methods

- `new VramSnapshotBuilder({ servers, gpu, vram, getSharingClient })`; `gpu` has
  `readDevices(diagnostics)` and `readComputeApps()`, `vram` has `snapshot()`.
- `build()` -> `{ devices, remoteDevices, servers }`:
  - `devices` `[{ index, name, totalBytes, freeBytes }]` from `readDevices(null)`;
  - `remoteDevices` per peer GPU from `getGpuPeerDevices()`: `{ ref: 'r:<peer>:<idx>',
    peerId, peerName, index, name, totalBytes, freeBytes, online, attached, busy }`
    (MB scaled to bytes); `[]` on any failure;
  - `servers.{llm, imageGenerate, imageEdit, imageVideo, music, grounding}`
    `{ modelId, available, state, devices, offloadToCpu, vaeTiling, pid,
    usedBytes, estBytes, contextSize }`. `devices` and `estBytes` come from the
    ledger claim; `usedBytes` from the per-process VRAM of the server's pid, null
    when not reported. The LLM's `modelId` is its file label; music is
    `available` only when platform-supported and enabled; grounding only when
    configured (its `modelId` is `getView().modelName`).

## Why

`usedBytes` is null under Windows WDDM (nvidia-smi reports `[N/A]`), and the UI
then draws `estBytes` hatched as an estimate. Offline peers still list so a
saved layout stays editable; launches skip them.
