# HostRuntimeAdvice

`core/llm-server/ui/js/setup-ui/runtimes/HostRuntimeAdvice.js`

Which inference runtime this host should start with, and why, for the
Runtimes card: one recommended build, the rest placed as worth trying, a
fallback, or not for this machine, each with a sentence saying what it gives
and what it needs.

## Methods

- `HostRuntimeAdvice.forRows(rows, caps)`: `{ [runtimeId]: { tier, why } }`
  for the runtime rows given, from the [HostCaps](../diagnostics/HostCaps.md);
  ids naming no backend are skipped.
- `HostRuntimeAdvice.host(caps)`: the host in the rules' terms (`nvidia`,
  `cudaMajor`, `intel`, `amd`, `darwin`, `gpu`, `npu`, `npuUsable`) and the
  `primary` id: the CPU build on macOS (it is the Metal build there), the
  CUDA 13 or 12 build on an NVIDIA driver, Vulkan on any other GPU, else CPU.
- `HostRuntimeAdvice.backendOf(row)`: `cuda`, `vulkan`, `rocm`, `sycl`,
  `openvino`, `mlx`, `cpu` or null, from the id (extension forks follow the
  same naming; `ninfer` and `llama-cpp-luma` are CUDA builds).
- `HostRuntimeAdvice.adviceFor(row, host)`: the primary is `recommended`; a
  row with `assetSupported: false` that is not installed and not an extension
  runtime is `unsuited` (no prebuilt download for this platform, e.g. CUDA 12
  on Windows on Arm); `RULES` place every other backend: a vendor build on its vendor's GPU is an
  `alternative` with what it needs (ROCm or HIP SDK, the oneAPI runtime, the
  Intel compute runtime), a vendor build without that vendor is `unsuited`,
  CPU builds are a `fallback`, ik_llama.cpp forks are alternatives to the
  standard build. OpenVINO on a host with an Intel NPU is named as the only
  build that can use it, with whether its drivers are in place.
- `HostRuntimeAdvice.sortRows(rows, advice)`: recommended, alternative,
  fallback, unadvised, unsuited; order kept within a tier.
- `TIERS`, `BADGES`.

[RuntimesCard](RuntimesCard.md) computes the map on each paint and
[RuntimeRowHtml](RuntimeRowHtml.md) renders the badge and the line.

## Why

A machine with an Intel GPU and an NPU sees seven llama.cpp builds and
nothing that says which to click. The pills already say what is installed and
what hardware is ready; this says which to start with and why the others
exist.
