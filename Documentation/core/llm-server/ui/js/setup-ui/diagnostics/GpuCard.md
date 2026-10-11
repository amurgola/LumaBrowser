# GpuCard

`core/llm-server/ui/js/setup-ui/diagnostics/GpuCard.js`

The Server Info "GPU" card: every adapter Chromium reports with VRAM, driver and PCIe link, then the NPUs the probe found, then the adapter health block (in every branch, since a faulted card is when Chromium reports nothing).

## Methods

- `GpuCard.render(doc, gpu, npu = null)`; `GpuCard.pillText(gpu, adapters)`.
- `GpuCard.npuRunsModels(npu)`; each NPU row shows name, vendor, status and "Runs models": with the OpenVINO runtime (device NPU) for a usable Intel NPU, "not yet" pointing at the Status row for an Intel NPU whose user-space driver is missing (`usable: false`), else not supported by llama.cpp. NPUs are only listed when Chromium reports adapters.
- The totals footnote names the VRAM sources: nvidia-smi, the Windows registry, sysfs or an installed llama.cpp build on Linux, and unified or shared system memory.

## Globals

Reads `document` by id.
