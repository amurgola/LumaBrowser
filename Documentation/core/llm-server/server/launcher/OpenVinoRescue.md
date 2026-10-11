# OpenVinoRescue

`core/llm-server/server/launcher/OpenVinoRescue.js`

One-shot OpenVINO device rescue for a failed start.

## Methods

- `new OpenVinoRescue({ finalizer, log })`.
- `attempt(ctx, failure)` returns null unless `failure.kind ===
  'openvino-device'` ([FailureInterpreter](../FailureInterpreter.md)), the
  runtime is `llama-cpp-openvino`, `ctx.openvinoDevice` is `GPU` or `NPU`, and
  no peers are borrowed. Then: `ensureStopped()`, `ctx.openvinoDevice = 'CPU'`,
  replan and finalize (so the launch's `extraEnv` carries
  `GGML_OPENVINO_DEVICE=CPU`), add the note from `OpenVinoRescue.note(failed)`,
  start, return `{ ..., openvinoRescue: '<GPU|NPU>' }`. A second failure
  propagates.
- `OpenVinoRescue.note(failed)`: the plan note, naming the Intel OpenCL compute
  runtime for a GPU failure or the NPU user-space driver and Level Zero loader
  for an NPU one.

## Why

OpenVINO does not fall back: when the device `GGML_OPENVINO_DEVICE` names
cannot be opened it aborts. On a Linux laptop whose only OpenCL ICD is Mesa's
rusticl that is every GPU start, so the model would never come up. One retry
on the CPU device gets it up and the note says what to install.
