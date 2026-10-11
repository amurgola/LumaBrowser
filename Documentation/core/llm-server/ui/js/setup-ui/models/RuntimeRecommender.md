# RuntimeRecommender

`core/llm-server/ui/js/setup-ui/models/RuntimeRecommender.js`

Picks the runtime to recommend for a model on this host and renders its runtime tags.

## Methods

- `recommend(model)`: `{ id, explicit }` or null; the first usable (installed, backend not known to have failed) runtime in `hostOrder()` that the model supports, else the first supported one not in `OPT_IN`.
- `hostOrder()`: `['llama-cpp-cpu']` on darwin (the Metal build there); elsewhere CUDA 13 build first on CUDA 13 drivers, CUDA 12, then ROCm (AMD GPU) or SYCL (Intel GPU) when the store says its backend listed a device, Vulkan on a GPU or without CUDA, the vendor builds not yet known to have loaded, OpenVINO with an Intel GPU, CPU. Mirrors [FitRuntimePicker](../../../../ipc/FitRuntimePicker.md)`.hostOrder`.
- `tagsHtml(model)`: required formats, the recommendation, then the other compatible runtimes.
- `OPT_IN`: `llama-cpp-rocm`, `llama-cpp-sycl`, `llama-cpp-openvino`.

## Why

The ROCm, SYCL and OpenVINO builds are faster on their vendor's GPU but need a vendor SDK or are experimental, so they are preferred once installed and never the "install this" suggestion; Vulkan stays the suggestion.

## Globals

None.
