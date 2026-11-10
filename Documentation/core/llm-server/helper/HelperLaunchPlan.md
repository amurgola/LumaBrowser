# HelperLaunchPlan

`core/llm-server/helper/HelperLaunchPlan.js`

How the helper model's llama-server is launched: fully offloaded on one card,
a small window, two slots, the fastest installed llama.cpp build.

## Methods

- `HelperLaunchPlan.pickRuntime(runtimes, defaultRuntimeId)` the first
  installed build in `RUNTIME_PREFERENCE` (luma, cuda13, cuda12, cpu), else the
  default, else the first llama.cpp build; throws with none.
- `HelperLaunchPlan.pickDevice(setting, diagnostics)` the `CUDA_VISIBLE_DEVICES`
  value: the explicit setting (undefined is automatic, null every card), else
  with two or more cards the one with the most free VRAM (`CudaDevicePicker`
  over `CudaDeviceProbe.readDevices`; the chat model's card is the fullest),
  else null (one card: shared).
- `HelperLaunchPlan.buildArgs({ modelPath, port, contextSize })`:
  `-m, --host 127.0.0.1, --port, -ngl 99, -c, -np 2, --jinja, -fa on`.
- `HelperLaunchPlan.build({ runtime, modelPath, port, contextSize, cudaDevice })`
  the launch object `HelperRuntimeServer#start` takes; its `plan` carries the
  file, window, card and runtime so the service can tell an unchanged launch.
