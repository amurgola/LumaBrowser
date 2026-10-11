# LlamaDeviceProbe

`core/llm-server/diagnostics/LlamaDeviceProbe.js`

Asks an installed llama.cpp build which GPUs its backend sees and how much
memory each has (`llama-server --list-devices`).

## Methods

- `LlamaDeviceProbe.probe({ runtimesRoot, platform, run, findBinary })`
  resolves `{ runtimeId, devices: [{ id, name, totalBytes, freeBytes }] }` from
  the first of `RUNTIME_IDS` (Vulkan, SYCL, ROCm) whose installed
  `llama-server` lists a GPU, or null off Linux, without `runtimesRoot`, or
  when no build is installed or none listed one. The binary is found under
  `ManagedDir.pathFor(runtimesRoot, id)` (depth 3) and run through
  [DiagnosticsCommand](DiagnosticsCommand.md) with a 15 s timeout and the
  launch environment from `RuntimeSpawnEnv.build`; stdout and stderr are both
  parsed.
- `LlamaDeviceProbe.parse(text)` reads lines like
  `Vulkan0: Intel(R) Arc(tm) A770 Graphics (DG2) (16032 MiB, 15890 MiB free)`
  into devices, skipping software rasterisers (llvmpipe, lavapipe,
  SwiftShader, softpipe) and rows with no memory.
- Constants `RUNTIME_IDS`, `BINARY_NAMES`, `SEARCH_DEPTH`, `TIMEOUT_MS`, `MIB`,
  `LINE`, `SOFTWARE`.

## Why

On Linux this is the only VRAM source for Intel cards, whose i915 and xe
drivers publish no memory figure in sysfs, and it is the figure the backend
really allocates against. Vulkan goes first because Mesa's driver starts fast
and rarely crashes, where a vendor build whose runtime is missing fails to
start and a Level Zero driver bug can take the SYCL build down; the vendor
builds follow, as they report the card the way the matching runtime launches
on it. CUDA is covered by nvidia-smi and OpenVINO lists devices without memory. The child gets the launch
environment so the build's sibling shared libraries resolve as at launch.
[LlamaDeviceVram](LlamaDeviceVram.md) folds the result into the adapters.
