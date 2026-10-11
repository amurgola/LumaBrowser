# NpuProbe

`core/llm-server/diagnostics/NpuProbe.js`

Finds the neural processing units on the machine: Intel's NPU ("Intel(R) AI
Boost") and the other compute accelerators Windows lists, or the Linux accel
devices (`intel_vpu`, `amdxdna`).

## Methods

- `NpuProbe.probe({ platform, fsLike, runPowerShell, intel })` resolves `{ available,
  devices: [{ vendor, name, driver, status, usable }] }` (`available` is true when at
  least one device was found), or `{ available: false, reason }` when the probe
  failed or the platform is neither Windows nor Linux. `intel` is an
  [IntelComputeRuntime](../../shared/runtime/detect/IntelComputeRuntime.md)
  probe (read on Linux when absent):
  - Linux: every `accelN` under `/sys/class/accel`; the vendor comes from the
    PCI `vendor` file, the driver from the resolved `driver` symlink, the name
    from `LINUX_NAMES` (else `<vendor> NPU`, else `NPU`), the status `OK` or
    `No driver`. An Intel NPU whose kernel driver is bound but whose user-space
    driver (`libze_intel_npu`) or Level Zero loader is missing reads
    `usable: false` with `USER_SPACE_MISSING` as its status, naming the
    packages. An unreadable accel directory is `[]`, a device without a
    vendor file is skipped;
  - Windows: `Win32_PnPEntity` rows of PnP class `ComputeAccelerator` via
    [PowerShellRunner](PowerShellRunner.md); the vendor comes from the
    `VEN_xxxx` of the PnP id (else `Manufacturer`), `driver` is null and
    `status` is the PnP status; `usable` when that status is `OK` (the Windows
    driver package carries the Level Zero adapter).
- `NpuProbe.hasIntelNpu(npu)`: true when any device's vendor is `Intel`, the
  one OpenVINO's NPU plugin drives.
- `NpuProbe.intelNpus(npu)`, `NpuProbe.usableIntelNpus(npu)`: the Intel
  devices, and those OpenVINO can open now.
- Constants `ACCEL_ROOT`, `VENDORS` (PCI vendor id to name), `LINUX_NAMES`,
  `SCRIPT`.

## Why

Only the OpenVINO runtime can run a model on an Intel NPU, so the NPU is
reported in the diagnostics (the `npu` section) and offered as an OpenVINO
device ([OpenVinoDevice](../runtimes/OpenVinoDevice.md)), never assumed.
`Manufacturer` is sometimes blank on Windows, hence the PCI vendor id first.
