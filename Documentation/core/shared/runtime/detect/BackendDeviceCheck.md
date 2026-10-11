# BackendDeviceCheck

`core/shared/runtime/detect/BackendDeviceCheck.js`

Asks an installed GPU build of llama.cpp which devices its backend really
loaded (`llama-server --list-devices`) and records the answer on the detection
row.

## Methods

- `BackendDeviceCheck.run({ binaryPath, entry, platform, exec, sysdeps, fsLike })`
  (async) resolves `{ checked, ok, devices: [{ id, name, software }], error }`,
  or null when the entry declares no `backendDevice` or there is no binary.
  The child runs `--list-devices` through
  [SysdepsCommandRunner](../SysdepsCommandRunner.md) with the launch
  environment from [RuntimeSpawnEnv](../server/RuntimeSpawnEnv.md) (the
  runtime dir as cwd and on the library path, plus the entry's `spawnEnv`) and
  a 20 s timeout (`TIMEOUT_MS`).
  - `ok: true` when a device whose name starts with `entry.backendDevice`
    (`ROCm`, `SYCL`, `CUDA`, `Vulkan`, `OPENVINO`) and is not a software
    rasteriser was listed; the OpenVINO build must also have listed the device
    its `GGML_OPENVINO_DEVICE` asks for (marked `(selected)` by the backend);
  - `ok: false` with an `error` sentence otherwise: a crashed listing reports
    the exit code and the last stderr lines; a listing without the build's own
    device names what was listed; an OpenVINO listing without the selected
    device names the devices it found. On Linux, when `entry.backendLib` is set
    and `libggml-<lib>.so` sits next to the binary, `sysdeps.checkBinary` (an
    [SysdepsChecker](../SysdepsChecker.md)) runs `ldd` on it and the missing
    sonames, with their package or vendor hint, are appended;
  - `checked: false, ok: null` when the listing timed out (the verdict stays
    open rather than condemning a slow cold start).
- `BackendDeviceCheck.parse(text)` reads every `<Name><n>: <description>` line
  (the memory suffix dropped) into `{ id, name, software }`.
- Constants `TIMEOUT_MS`, `ERROR_TAIL_CHARS`, `LINE`, `MEMORY`, `SOFTWARE`,
  `OPENVINO_SELECTED`.

## Why

The ggml backends are opened with `dlopen` at start, and release builds load
them silently (`NDEBUG`), so a build whose HIP, SYCL, CUDA or OpenVINO library
cannot find its vendor runtime still runs `--version` cleanly and then computes
on the CPU without a word. Upstream's Windows ROCm zip ships `ggml-hip.dll`
and the HIP runtime but no hipBLAS or rocBLAS, and the Linux ROCm and SYCL
tarballs ship no vendor runtime at all. The device list is the one signal every
host gives; the Linux `ldd` pass turns "no device" into the sonames to install.
[LlmRuntimeDetector](../../../llm-server/runtimes/LlmRuntimeDetector.md) runs
the check and [RuntimeDetailFields](RuntimeDetailFields.md)`.applyBackend`
turns a failure into the row's "not ready" note.
