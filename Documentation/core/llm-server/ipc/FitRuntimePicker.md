# FitRuntimePicker

`core/llm-server/ipc/FitRuntimePicker.js`

Picks the installed runtime a model is measured (fit test) or estimated
(picker options) with.

## Methods

- `FitRuntimePicker.pick(model, runtimesView, diagnostics, catalog?)` the first
  usable runtime of `model.preferredRuntimes`, else the first usable one in
  `hostOrder` that is in `model.compatibleRuntimes`, else null. Usable means
  installed, with a `binaryPath`, not listing `--flash-attn` in
  `unsupportedFlags`, and not a build whose backend check found no device
  (`backend.checked && backend.ok === false`: it would measure the CPU).
- `FitRuntimePicker.hostOrder(diagnostics, catalog?, platform = process.platform, runtimesView?)`
  on darwin only `llama-cpp-cpu` (the Metal build there); elsewhere the CUDA
  builds from `catalog.cudaRuntimePreference(cudaVersion)` when CUDA works, then
  the vendor builds (`llama-cpp-rocm` with an AMD adapter, `llama-cpp-sycl`
  with an Intel adapter) whose backend listed a device per `runtimesView`,
  `llama-cpp-vulkan` when a non-Microsoft adapter exists or CUDA does not, the
  vendor builds not yet known to have loaded, `llama-cpp-openvino` with an
  Intel adapter, then `llama-cpp-cpu`.
- `FitRuntimePicker.backendLoaded(runtimesView, id)`, `backendFailed(runtime)`.
- Constants `FLASH_ATTN`, `VULKAN`, `CPU`, `ROCM`, `SYCL`, `OPENVINO`.

## Why

The fit test forces `--flash-attn`, and it must load with the same runtime the
model card calls recommended, so this order mirrors
[RuntimeRecommender](../ui/js/setup-ui/models/RuntimeRecommender.md)`.hostOrder`.
Only installed runtimes are picked, so a vendor build ahead of Vulkan means the
user chose to install it.
