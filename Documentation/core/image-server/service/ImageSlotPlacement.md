# ImageSlotPlacement

`core/image-server/service/ImageSlotPlacement.js`

Places one image slot's model on the GPUs through the shared
[VramCoordinator](../../shared/runtime/VramCoordinator.md).

## Methods

- `new ImageSlotPlacement({ vramCoordinator, capabilities })`; `capabilities`
  is an [SdServerCapabilities](SdServerCapabilities.md).
- `place({ role, runtime, requiredBytes, settingsDb, diagnostics })` resolves
  `{ cudaDevice, offloadToCpu, autoFit }`:
  1. A CPU-only runtime: `{ null, false, null }`, nothing reserved.
  2. `reserve({ serverId: role, role: 'image', allowSplit: false, ... })`; a
     throwing coordinator leaves the slot unpinned and resident.
  3. When that offloads, the auto-fit rescue: with 2+ debited cards and a binary
     that lists `--auto-fit`, reserve again with `allowSplit: true`. A resident
     result pins the devices in order (`cudaDevice` `"0,1"`) and, for 2+ cards,
     `autoFit` is the budget string. Otherwise (or on any throw) the offload
     placement stands.
- `ImageSlotPlacement.requiredBytes(model, role)` `minVramBytes` (else 16 GB for
  video-class, 12 GB for edit-class, 8 GB) plus `PAD_BYTES` (2 GB).
- `ImageSlotPlacement.isCpuOnlyRuntime(runtime)` id `sd-cpp-cpu` or ending `-cpu`.
- `ImageSlotPlacement.budgetString(devices, debitedCards)`
  `cuda<i>=<GiB>` per device in child-visible order, from
  `CudaDevicePicker.cardRoomBytes` of that physical card, at least 1.0.

## Why

One card is still the fastest home when the model fits. Edit models run with
VAE tiling, so the requirement is weights plus a small pad, not plus the 8 GB
un-tiled VAE buffer, and a heavy edit model stays resident on its card between
edits. Newer sd-server builds can place modules on different cards (MiniMax-H3's
text encoder on one card, diffusion and VAEs on another), turning "stream every
weight from RAM each step" into "fully resident across the box". Budgets come
from the ledger-debited room because nvidia-smi cannot see a sibling server
mid-load. A retry that still offloads re-records the same placement, so the
ledger stays truthful.
