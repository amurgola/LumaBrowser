# ImageRuntimePicker

`core/llm-server/ui/js/setup/ImageRuntimePicker.js`

Picks the image runtime for setup.

## Methods

- `ImageRuntimePicker.pick(view)` walks `ORDER` (`sd-cpp-cuda12`,
  `sd-cpp-vulkan`, `sd-cpp-cpu`): first a runtime whose `hardware.ready` is true
  and that is obtainable (installed, or a prebuilt asset exists for this host),
  then any with `assetSupported !== false`, then `sd-cpp-cpu`, then the first
  row, else `null`. On Linux the CUDA row is filtered out of the view, so an
  NVIDIA host gets Vulkan.

## Globals

None.
