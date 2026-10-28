# IntelDriverPlan

`core/shared/runtime/detect/IntelDriverPlan.js`

What to install so Intel's compute stack can serve inference on this Linux
host, as a plan the user reads before anything runs. Nothing here executes.

## Methods

- `IntelDriverPlan.build({ intel, distro, hasIntelGpu, hasIntelNpu, renderGroupMember })`
  takes an [IntelComputeRuntime](IntelComputeRuntime.md) probe, a
  [LinuxDistro](LinuxDistro.md) probe, whether the diagnostics listed an Intel
  GPU adapter or an Intel NPU, and whether the user is in the `render` group
  (true, false or null for unknown). Returns
  `{ applicable, reason, pieces, packages, manager, distro, command, notes }`.
- Pieces, each `{ key, label, why, packages, manual }`:
  - `gpuCompute` when an Intel GPU is present and the OpenCL ICD or the Level
    Zero GPU driver is missing (the OpenVINO and SYCL builds; Vulkan needs
    neither);
  - `levelZeroLoader` when an Intel GPU or NPU is present and `libze_loader`
    is missing;
  - `npuDriver` when an Intel NPU is present and its user-space driver is
    missing.
  A piece the distribution packages lists its packages (`PACKAGES`: pacman
  and apt; apt has no NPU driver); otherwise `packages` is null and `manual`
  carries the note (`MANUAL`).
- `command`: the one line a terminal runs (`COMMANDS`: pacman with
  `--needed --noconfirm`, apt-get update then install), only when a manager
  is known and at least one package is listed.
- `notes`: `NO_MANAGER_NOTE` without a recognised manager, every manual note,
  and `RENDER_GROUP_NOTE` when an NPU is involved and the user is outside the
  `render` group.
- `applicable` is false, with a `reason`, off Linux, without Intel hardware,
  or once every piece is installed.

## Why

The hardware pills and the NPU row already say what is missing; this turns
that into the exact packages and the exact command, so
[DriverInstallPanel](../../../../llm-server/ui/js/setup-ui/diagnostics/DriverInstallPanel.md)
can show the user what will be attempted and
[IntelDriverInstall](../../../../llm-server/ipc/IntelDriverInstall.md) can run
precisely that. Package names are only listed where they are known to exist;
anything else is a manual note rather than a guess.
