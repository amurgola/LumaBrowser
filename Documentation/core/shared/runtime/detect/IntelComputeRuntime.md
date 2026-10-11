# IntelComputeRuntime

`core/shared/runtime/detect/IntelComputeRuntime.js`

What of Intel's Linux compute stack is installed: the pieces an inference
backend actually opens, as opposed to the display driver Chromium reports.

## Methods

- `IntelComputeRuntime.probe({ platform, fsLike, libDirs })` returns
  `{ linux, openclIcd, levelZeroGpu, levelZeroLoader, npuDriver, accelNode }`;
  off Linux every flag is null and `linux` is false:
  - `openclIcd`: an `intel*.icd` under `/etc/OpenCL/vendors` (the NEO compute
    runtime's ICD; Mesa's `rusticl.icd` or `mesa.icd` does not count);
  - `levelZeroGpu`: `libze_intel_gpu.so(.1)` in a lib dir;
  - `levelZeroLoader`: `libze_loader.so(.1)`;
  - `npuDriver`: `libze_intel_npu.so(.1)` or the older `libze_intel_vpu.so(.1)`,
    also under the `intel-npu` prefixes the Ubuntu driver installs to;
  - `accelNode`: an `accelN` under `/dev/accel`.
- `IntelComputeRuntime.PACKAGES`: the Ubuntu and Arch package names for each
  piece (`openclIcd`, `levelZeroGpu`, `levelZeroLoader`, `npuDriver`), used in
  readiness notes and failure advice.
- Constants `ICD_DIR`, `ACCEL_DIR`, `LIB_DIRS`, `LEVEL_ZERO_GPU`,
  `LEVEL_ZERO_LOADER`, `NPU_DRIVER`.

## Why

A Panther Lake laptop with Mesa only lists its Intel GPU to Chromium and
Vulkan, yet OpenVINO's GPU plugin goes through the OpenCL ICD loader, which
then finds Mesa's rusticl and aborts ("Incompatible OpenCL runtime"), and the
SYCL build goes through Level Zero. The NPU needs its user-space driver and
the Level Zero loader on top of the kernel driver.
[RuntimeHardwareCheck](RuntimeHardwareCheck.md) reads this for the `intel-sycl`
and `intel-openvino` kinds, [NpuProbe](../../../llm-server/diagnostics/NpuProbe.md)
for the NPU's `usable` flag.
