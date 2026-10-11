# RuntimeHardwareCheck

`core/shared/runtime/detect/RuntimeHardwareCheck.js`

Whether this host meets a runtime's `requiresHw`, for the "Hardware ready" pill.
Never gates installs.

## Methods

- `RuntimeHardwareCheck.evaluate(entry, { cuda, gpu, intel })` returns `{ ready, note }`
  (`intel`, an [IntelComputeRuntime](IntelComputeRuntime.md) probe, is read
  lazily on Linux when an Intel kind needs it; tests inject one):
  - no `requiresHw` or an unknown kind: ready
  - `nvidia-cuda`: needs `cuda.available`; `cudaMajor` compares against
    `cuda.cudaVersion`'s major; `gpuNameMatch` (a string regex, case-insensitive)
    needs a matching `cuda.devices[].name`, note `gpuNameNote` or a default
    (an invalid pattern passes)
  - `gpu-any`: needs an adapter whose vendor is not Microsoft; on Linux also a
    GPU-backed Vulkan device (`gpu.vulkanDevice` if given, else
    `linuxVulkanDeviceLikely()`)
  - `amd-gpu` / `intel-gpu`: needs an adapter whose vendor is `AMD` / `Intel`,
    else note "No AMD GPU detected." / "No Intel GPU detected."
  - `intel-sycl`: an Intel adapter, and on Linux the Level Zero GPU driver
    (`libze_intel_gpu`), else `SYCL_NOTE` naming the packages
  - `intel-openvino`: an Intel adapter, and on Linux Intel's OpenCL ICD
    (`intel.icd`), else `OPENVINO_NOTE`, which says Mesa's rusticl is not a
    substitute and that Panther Lake needs compute-runtime 26.18 or newer.
    Windows needs neither check: the display driver bundles OpenCL and Level Zero
  - `apple-silicon`: darwin arm64 only
- `RuntimeHardwareCheck.cudaUnavailableNote(cuda)`: the reboot hint for an NVML
  init failure / driver-library mismatch, else "No CUDA-capable NVIDIA driver detected."
- `RuntimeHardwareCheck.linuxVulkanDeviceLikely(fsLike = fs)`: a
  `/dev/dri/renderD*` node or an NVIDIA ICD in `/usr/share/vulkan/icd.d` or
  `/etc/vulkan/icd.d`.

## Why

WSL2 lists the NVIDIA card but only has Mesa's software lavapipe for Vulkan,
where sd-server's Vulkan build aborts at load. The vendor kinds back the ROCm,
SYCL and OpenVINO llama.cpp builds; the Intel kinds exist because an Intel
adapter in Chromium's list proves only the display driver, and a Panther Lake
laptop with Mesa alone sends OpenVINO's GPU plugin into rusticl, where it
aborts. A driver/library mismatch means
"reboot", not "reinstall drivers".
