# LinuxDrmVramProbe

`core/llm-server/diagnostics/LinuxDrmVramProbe.js`

Reads each Linux GPU's PCI ids, VRAM and placement from sysfs
(`/sys/class/drm/cardN/device`).

## Methods

- `LinuxDrmVramProbe.probe({ platform, fsLike })` returns rows `{ vendorId,
  deviceId, pciAddress, vramTotalBytes, vramUsedBytes, integrated }` (one per
  distinct vendor, device and address), `[]` when there are none, or null off
  Linux or when the DRM directory cannot be read. VRAM comes from amdgpu's
  `mem_info_vram_total` / `mem_info_vram_used` (null when absent or 0); the
  PCI address is the basename of the resolved `device` symlink.
- `LinuxDrmVramProbe.isIntegrated(vendorId, pciAddress, vramTotalBytes)`: Intel
  at `0000:00:02.0`, or AMD with under 2 GiB of VRAM (an APU's carve-out).
- Constants `DRM_ROOT`, `INTEL`, `AMD`, `INTEL_IGPU_ADDRESS`, `APU_MAX_VRAM_BYTES`.

## Why

Linux had no VRAM source for non-NVIDIA cards, so AMD and Intel GPUs planned
against 0 bytes and llama-server launched with `-ngl 0`. The `integrated` flag
lets [SharedGpuMemory](SharedGpuMemory.md) size an iGPU from RAM even without a
sysfs VRAM figure. [GpuProbe](GpuProbe.md) matches rows by vendor and device id.
