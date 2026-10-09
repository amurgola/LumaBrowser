# RuntimeHardwareCheck

`core/shared/runtime/detect/RuntimeHardwareCheck.js`

Whether this host meets a runtime's `requiresHw`, for the "Hardware ready" pill.
Never gates installs.

## Methods

- `RuntimeHardwareCheck.evaluate(entry, { cuda, gpu })` returns `{ ready, note }`:
  - no `requiresHw` or an unknown kind: ready
  - `nvidia-cuda`: needs `cuda.available`; `cudaMajor` compares against
    `cuda.cudaVersion`'s major; `gpuNameMatch` (a string regex, case-insensitive)
    needs a matching `cuda.devices[].name`, note `gpuNameNote` or a default
    (an invalid pattern passes)
  - `gpu-any`: needs an adapter whose vendor is not Microsoft; on Linux also a
    GPU-backed Vulkan device (`gpu.vulkanDevice` if given, else
    `linuxVulkanDeviceLikely()`)
  - `apple-silicon`: darwin arm64 only
- `RuntimeHardwareCheck.cudaUnavailableNote(cuda)`: the reboot hint for an NVML
  init failure / driver-library mismatch, else "No CUDA-capable NVIDIA driver detected."
- `RuntimeHardwareCheck.linuxVulkanDeviceLikely(fsLike = fs)`: a
  `/dev/dri/renderD*` node or an NVIDIA ICD in `/usr/share/vulkan/icd.d` or
  `/etc/vulkan/icd.d`.

## Why

WSL2 lists the NVIDIA card but only has Mesa's software lavapipe for Vulkan,
where sd-server's Vulkan build aborts at load. A driver/library mismatch means
"reboot", not "reinstall drivers".
