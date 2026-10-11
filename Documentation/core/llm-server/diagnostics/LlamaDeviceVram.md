# LlamaDeviceVram

`core/llm-server/diagnostics/LlamaDeviceVram.js`

Folds a [LlamaDeviceProbe](LlamaDeviceProbe.md) listing into the Chromium
adapters that still have no VRAM figure.

## Methods

- `LlamaDeviceVram.apply(gpu, listing)` mutates and returns the
  [GpuProbe](GpuProbe.md) summary. Only Intel and AMD adapters without a
  positive `vramTotalBytes`, and Intel and AMD devices, take part; each pair
  gets `vramTotalBytes`, `vramFreeBytes` (null when not positive),
  `vramSource: 'llama-list-devices'`, `llamaDevice` (the device id, such as
  `Vulkan0`) and, when missing, `displayName`. A null listing or summary is a
  no-op.
- `LlamaDeviceVram.vendorOf(name)`: `NVIDIA`, `AMD`, `Intel` or null, from the
  device name.
- `LlamaDeviceVram.pair(adapters, devices)` returns `[adapter, device]` pairs:
  first by model number (a lowercased word of 3+ characters with a digit,
  `(R)` and `(TM)` stripped) shared with exactly one adapter of the same
  vendor; then, per vendor, the one leftover adapter with the one leftover
  device.
- Constants `SOURCE`, `VENDOR_PATTERNS`, `FILLABLE_VENDORS`.

## Why

One shared token is enough because Vulkan appends a codename (such as `DG2`)
that Chromium omits, but it must single out one adapter so two cards of one
family never swap figures. NVIDIA cards are left alone: they already carry the
nvidia-smi figure.
