# FitRuntimePicker

`core/llm-server/ipc/FitRuntimePicker.js`

Picks the installed runtime a model is measured (fit test) or estimated
(picker options) with: the one a launch would start, among the builds the fit test can drive.

## Methods

- `FitRuntimePicker.pick(model, runtimesView, diagnostics, chooser)` the runtime
  row `chooser.forModel(model, { runtimesView, diagnostics, usable })` resolves
  ([RuntimeChooser](../service/RuntimeChooser.md), the service's `runtimeChooser`),
  else null. `usable` narrows the resolver to builds that are installed, with a
  `binaryPath`, not listing `--flash-attn` in `unsupportedFlags`, and not a build
  whose backend check found no device (`backend.checked && backend.ok === false`:
  it would measure the CPU). So the framework is the launch's, and so is the build
  unless the active one cannot be driven, when the resolver's next build of that
  framework is used.
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

The fit test forces `--flash-attn`, and its numbers are only worth having when it
measures the runtime a Start would use, so `pick` asks the same chooser a launch
asks. `hostOrder` is the chooser's tie-break between builds (the service feeds it to
[RuntimeChooser](../service/RuntimeChooser.md)), and it must match the runtime the
model card calls recommended, so this order mirrors
the Setup tab's own host advice (`HostRuntimeAdvice`).
Only installed runtimes are picked, so a vendor build ahead of Vulkan means the
user chose to install it.
