# GpuAdapterMatcher

`core/llm-server/diagnostics/GpuAdapterMatcher.js`

Pairs Chromium GPU adapters with nvidia-smi devices and Windows registry rows.

## Methods

- `vendorName(vendorId)` NVIDIA, AMD, Intel, Apple, Microsoft, else `0x<hex>`;
  null for null.
- `pciKey(vendorId, deviceId)` the `vendor:device` key.
- `indexNvidiaByName(cuda)`, `indexNvidiaByPci(cuda)` Maps (lower-cased name,
  PCI key) or null when CUDA is unavailable.
- `matchNvidiaByPci(adapter, index)` deterministic; works when Chromium leaves
  `deviceString` empty (common for NVIDIA on Windows).
- `matchNvidiaByName(name, index)` exact, then substring either way (Chromium
  may add `(Compute Engine)`).
- `matchRegistry(name, rows)` by `DriverDesc`, same exact/substring rule.
- `dedupe(adapters)` one row per PCI id (Chromium lists a card once per DXGI,
  ANGLE and OpenGL surface), preferring an active duplicate; adapters without
  ids are kept.
