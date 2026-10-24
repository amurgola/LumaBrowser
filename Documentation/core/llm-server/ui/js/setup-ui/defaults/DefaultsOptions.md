# DefaultsOptions

`core/llm-server/ui/js/setup-ui/defaults/DefaultsOptions.js`

The closed option sets of the Defaults card and its option lists.

## Methods

- `EFFORT`, `KV`, `PARALLEL_LADDER`, `APPROVAL`, `GPU_HEADROOM` (1, 2, 3, 4 GB; ids are GiB), `GIB`, `headroomPosition(bytes)` (the matching id, `''` off the ladder), `OPENVINO_RUNTIME_ID`; `openvinoDeviceOptions(npuNames = [])` (Auto (GPU) as `''`, GPU, NPU, CPU; the NPU position names the detected Intel NPUs, else reads "NPU (not detected)"); `effortPosition(defaults)`, `effortLabel(id)`, `parallelValue(defaults)`, `parallelOptions(current)`, `contextOptionsHtml(current)`, `runtimeOptionsHtml(runtimes, selectedId)`, `modelOptionsHtml(scoped, selectedPath, fitSummary)`.

## Globals

None.
