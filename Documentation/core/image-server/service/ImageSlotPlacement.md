# ImageSlotPlacement

`core/image-server/service/ImageSlotPlacement.js`

Places one image slot's model on the GPUs through the shared
[VramCoordinator](../../shared/runtime/VramCoordinator.md).

## Methods

- `new ImageSlotPlacement({ vramCoordinator, capabilities, gpuReady? })`; `capabilities`
  is an [SdServerCapabilities](SdServerCapabilities.md); `gpuReady()` defaults to
  `CudaDeviceProbe.whenReady(GPU_READY_MS)` (3 s).
- `place({ role, runtime, requiredBytes, settingsDb, diagnostics })` resolves
  `{ cudaDevice, offloadToCpu, autoFit }`:
  1. A CPU-only runtime: `{ null, false, null }`, nothing reserved.
  1. Otherwise `gpuReady()` is awaited first, so a launch right after boot waits
     (bounded) for the nvidia-smi stream's first reading.
  2. `reserve({ serverId: role, role: 'image', allowSplit: false, ... })`; a
     throwing coordinator leaves the slot unpinned and resident.
  3. When that is resident on a card that is not the strongest (most VRAM) of 2+
     debited cards, and the strongest still has `MIN_SHARED_BUDGET_BYTES` (8 GB)
     of room, and the binary lists `--max-vram`, and the user did not pin the
     slot in the placement canvas ([UserGpuPin](UserGpuPin.md)): the slot moves
     to the strongest card with `autoFit` set to its room as a budget string
     (`cuda0=11.0`) and the ledger holds that room. Otherwise the single-card
     placement stands.
  4. When that offloads, the auto-fit rescue: with 2+ debited cards and a binary
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
- `ImageSlotPlacement.strongestCard(cards)` the card with the most VRAM, lowest
  index on a tie, `null` for none.

## Why

One card is still the fastest home when the model fits, but the coordinator
ranks cards by free VRAM, so a 3090 beat a 5090 that held the LLM. Measured on a
Qwen-Image 2.1 edit (2026-11-04): the 3090 takes 1.31 s per step against 0.58 s
on the 5090, while the 5090 under a 12 GiB `--max-vram` budget still ran 0.57 s
per step (sd-server cut the graph into 34 segments and streamed the weights it
could not hold from pinned RAM). So the strongest card with room is preferred
under a budget; 8 GB is the floor because the edit's compute buffers alone take
about 2 GB and below that most of the model streams. Edit models run with
VAE tiling, so the requirement is weights plus a small pad, not plus the 8 GB
un-tiled VAE buffer, and a heavy edit model stays resident on its card between
edits. Newer sd-server builds can place modules on different cards (MiniMax-H3's
text encoder on one card, diffusion and VAEs on another), turning "stream every
weight from RAM each step" into "fully resident across the box". Budgets come
from the ledger-debited room because nvidia-smi cannot see a sibling server
mid-load. A retry that still offloads re-records the same placement, so the
ledger stays truthful.
