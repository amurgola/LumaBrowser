# RecommenderRuntimePicker

`core/llm-server/models/RecommenderRuntimePicker.js`

Picks the llama.cpp runtime a pre-download recommendation should install.

## Methods

- `RecommenderRuntimePicker.pick(hw, platform = process.platform)`: on `darwin`
  always `llama-cpp-cpu`; with CUDA, `llama-cpp-cuda13` for driver major 13+ else
  `llama-cpp-cuda12`; any other GPU `llama-cpp-vulkan`; else `llama-cpp-cpu`.

## Why

macOS ships its Metal-accelerated build under the CPU runtime id (the only darwin
asset pattern); picking Vulkan on an Intel Mac yields "No prebuilt asset for
darwin-x64", and Apple Silicon users are offered MLX separately. CUDA 13 drivers
get native Blackwell kernels, mirroring the runtime catalog's CUDA preference.
