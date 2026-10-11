# HostCaps

`core/llm-server/ui/js/setup-ui/diagnostics/HostCaps.js`

Host GPU capabilities captured from the diagnostics load, for the runtime recommendation; the NPUs found feed the OpenVINO device picker.

## Methods

- `update(diagnostics)`: `cudaAvailable`, `cudaVersion`, `hasGpu` (any adapter not from Microsoft, the software renderer), `platform` (`diagnostics.platform.os`, else null), `vendors` (a Set of adapter vendors), `npus` (`diagnostics.npu.devices`, else `[]`); `hasVendor(vendor)`; `intelNpuNames()` (the names of the Intel NPUs OpenVINO can open, `usable` not false, `Intel NPU` when unnamed); `cudaMajor()`.

## Globals

None.
