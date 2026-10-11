# OpenVinoDevice

`core/llm-server/runtimes/OpenVinoDevice.js`

Which device the OpenVINO runtime computes on (`GGML_OPENVINO_DEVICE`).

## Methods

- `OpenVinoDevice.normalize(value)`: `GPU`, `NPU` or `CPU` (case-insensitive),
  else null, which is Auto.
- `OpenVinoDevice.resolve(choice, diagnostics)`: the normalized choice, else
  `GPU` when the diagnostics list an Intel adapter, else `CPU`.
- `OpenVinoDevice.appliesTo(runtimeId)`: true for `llama-cpp-openvino`.
- `OpenVinoDevice.spawnEnv(baseEnv, device)`: `baseEnv` with
  `GGML_OPENVINO_DEVICE` set to the device; without a device, `baseEnv` or null.
- Constants `RUNTIME_ID`, `ENV`, `DEVICES`, `GPU`, `NPU`, `CPU`.

## Why

Auto is the Intel GPU: on every chip with an Intel NPU the Arc iGPU beside it
decodes faster, takes any context size and serves parallel slots. The NPU is
the user's pick (it saves power) and serves one sequence at a time, so
[LaunchOverrides](../server/launcher/LaunchOverrides.md) runs one slot on it.
A user's own `GGML_OPENVINO_DEVICE` still wins at spawn
(`RuntimeSpawnEnv`). The choice is the `openvinoDevice` launch default
([LlmDefaults](../service/LlmDefaults.md)).
