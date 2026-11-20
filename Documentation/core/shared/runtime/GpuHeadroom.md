# GpuHeadroom

`core/shared/runtime/GpuHeadroom.js`

The VRAM every launch leaves free on each card it places on, after whatever already
occupies that card. One process-wide number read by the launch planner
([GpuOverhead](../../llm-server/server/launch/GpuOverhead.md)), the placement picker
([CudaDevicePicker](CudaDevicePicker.md)) and the VRAM-pressure watchdog.

## Methods

- `GpuHeadroom.bytes()`: the current value (default `DEFAULT_BYTES`, 1 GiB).
- `GpuHeadroom.softFloorBytes()`: half of `bytes()`, rounded down. The soft floor
  a launch that keeps a whole model on one card may shrink the headroom to before
  it spreads to another card or the CPU ([CudaDevicePicker](CudaDevicePicker.md)
  `SOFT_RESERVE_BYTES`, the planner's `GpuOverhead.SOFT_CARD_RESERVE`).
- `GpuHeadroom.normalize(value)`: a whole byte count in `[MIN_BYTES, MAX_BYTES]`
  (256 MiB to 16 GiB); anything else, junk included, is the default.
- `GpuHeadroom.set(value)`: normalizes, stores in memory and returns it.
- `GpuHeadroom.load(settingsDb)`: reads `SETTING_KEY` (`core.llm.gpuHeadroomBytes`)
  into memory; called by [LlmServerSettings](../../llm-server/service/LlmServerSettings.md)
  at construction.
- `GpuHeadroom.save(settingsDb, value)`: sets it and persists it; the default is
  stored as an absent key.

## Why

The planner used to hold back a flat 1 GiB per card that had to absorb both the
desktop's share of a display card and the free margin, so on a card driving monitors
(about 3 GB in use at idle) a load left about 0.5 GB free and the watchdog, which
warns below the same 1 GiB, fired. Live occupancy is now netted out separately
(`GpuInventory` `occupiedBytes`), and this number is only the margin. Because the
watchdog bands on the same value, a plan that honours it cannot trip its own warning.
The user sets it on the Setup Defaults card (GPU headroom, 1 to 4 GB).

The soft floor exists because the alternatives to a slightly tighter card cost far
more than the missing half of the margin. Measured 2026-11-18 on an RTX 5090 + RTX
3090 with Qwen3.8-27B Q6, 64k context and a DFlash drafter: 101 tok/s whole on the
5090 (1.5 GiB left free), 63 to 72 tok/s split over both cards, 23 tok/s with 7
layers on the CPU. It applies only to a whole model on one card; any spread still
keeps the full headroom, and the watchdog bands against the soft floor while such a
plan runs, so it does not warn about a margin the plan chose.
