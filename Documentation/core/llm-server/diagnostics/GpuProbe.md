# GpuProbe

`core/llm-server/diagnostics/GpuProbe.js`

GPU adapters from Chromium (`app.getGPUInfo('complete')`), enriched with VRAM
and PCIe data. Requires `electron`.

## Methods

- `GpuProbe.probe({ nvidiaByName, nvidiaByPci, winRegistryVram, linuxDrm })` resolves
  `{ available: true, adapters, totalVramBytes, freeVramBytes, features,
  glRenderer, glVendor, glVersion }` or `{ available: false, reason }`.
  Each adapter is `{ vendorId, deviceId, vendor, driverVendor, driverVersion,
  driverDate, deviceString, displayName, active, vramTotalBytes, vramFreeBytes,
  vramSource, pcie }`.
  - NVIDIA match (PCI id first, then name): VRAM total and free, PCIe link,
    `vramSource: 'nvidia-smi'`, and nvidia-smi's name when Chromium gave none
    ("NVIDIA GeForce RTX 5090", not "NVIDIA device 0x2b85").
  - Otherwise, on Windows, the registry row matched by name gives
    `vramTotalBytes` and `vramSource: 'win-registry'`.
  - Otherwise, on Linux, the [LinuxDrmVramProbe](LinuxDrmVramProbe.md) row
    matched by vendor and device id sets `integrated: true` for an iGPU (even
    without a VRAM figure) and, when sysfs reports VRAM, `vramTotalBytes`,
    `vramFreeBytes` (total minus used) and `vramSource: 'linux-sysfs'`.
  - Duplicates collapse via [GpuAdapterMatcher](GpuAdapterMatcher.md)`.dedupe`;
    totals count only adapters that reported a number.

## Why

Without the sysfs source an AMD or Intel card on Linux had no VRAM figure, so
the launch planner offloaded nothing (`-ngl 0`). Integrated GPUs are sized later
by [SharedGpuMemory](SharedGpuMemory.md), which reads the `integrated` flag.
