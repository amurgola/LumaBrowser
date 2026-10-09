# UserGpuPin

`core/image-server/service/UserGpuPin.js`

Whether the unified placement canvas pins an image slot to a GPU.

## Methods

- `UserGpuPin.isPinnedToGpu(settingsDb, role)` true when the slot's effective
  resource (a singularity's resource wins over the item's own) is a card or card
  group, not RAM and not automatic. Any read error is `false`.

## Why

An explicit pin is the user's call on speed versus VRAM, so per-launch
decisions follow it (ClipPlacement keeps text encoders on the pinned GPU).
