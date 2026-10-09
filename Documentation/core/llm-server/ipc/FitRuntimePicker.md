# FitRuntimePicker

`core/llm-server/ipc/FitRuntimePicker.js`

Picks the installed runtime a model is measured (fit test) or estimated
(picker options) with.

## Methods

- `FitRuntimePicker.pick(model, runtimesView, diagnostics, catalog?)` the first
  usable runtime of `model.preferredRuntimes`, else the first usable one in
  `hostOrder` that is in `model.compatibleRuntimes`, else null. Usable means
  installed, with a `binaryPath`, and not listing `--flash-attn` in `unsupportedFlags`.
- `FitRuntimePicker.hostOrder(diagnostics, catalog?)` the CUDA builds from
  `catalog.cudaRuntimePreference(cudaVersion)` when CUDA works, then
  `llama-cpp-vulkan` when a non-Microsoft adapter exists or CUDA does not, then
  `llama-cpp-cpu`.

## Why

The fit test forces `--flash-attn`, and it must load with the same runtime the
model card calls recommended.
