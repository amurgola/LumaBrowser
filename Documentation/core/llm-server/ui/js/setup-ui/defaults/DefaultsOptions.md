# DefaultsOptions

`core/llm-server/ui/js/setup-ui/defaults/DefaultsOptions.js`

The closed option sets of the Defaults card and its option lists.

## Methods

- `EFFORT`, `KV`, `PARALLEL_LADDER`, `APPROVAL`, `GPU_HEADROOM` (1, 2, 3, 4 GB; ids are GiB), `GIB`, `headroomPosition(bytes)` (the matching id, `''` off the ladder), `OPENVINO_RUNTIME_ID`; `openvinoDeviceOptions(npuNames = [])` (Auto (GPU) as `''`, GPU, NPU, CPU; the NPU position names the detected Intel NPUs, else reads "NPU (not detected)"); `effortPosition(defaults)`, `effortLabel(id)`, `parallelValue(defaults)`, `parallelOptions(current)`, `contextOptionsHtml(current)`, `runtimeOptionsHtml(runtimes, selectedId)`, `modelOptionsHtml(scoped, selectedPath, fitSummary)` (the shared [ModelTree](../../models/ModelTree.md): one `<optgroup>` per family and size line, "Qwen 3.8 · 27B", options largest quant first named by what sets them apart, the full label as tooltip; a lone locked model is a bare option under its full label).

## Globals

None.
