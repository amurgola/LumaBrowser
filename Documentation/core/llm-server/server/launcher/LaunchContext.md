# LaunchContext

`core/llm-server/server/launcher/LaunchContext.js`

The state of one local llama-server start, shared by the
[ServerLauncher](../ServerLauncher.md) steps.

## Fields and methods

- `new LaunchContext({ service, planFor, withVision })` reads
  `service.getLaunchDefaults()` (the defaults plus the loaded model's own launch
  overrides, such as its KV cache; `getDefaults()` on a service without it) and
  `service.settingsDb` once.
- Resolved by the steps: `diag`, `runtimeRow` (the detector row), `runtime` (with
  learned unsupported flags), `model`, `catalogEntry`, `launchKey`, `port`, `kvMode`,
  `userArgs`, `overrides`, `layout` ([LlmLayoutIntent](LlmLayoutIntent.md)),
  `openvinoDevice` (set by [LaunchOverrides](LaunchOverrides.md), null off OpenVINO), `cudaDevice`, `tensorSplit`, `planDiag`, `rpcAcquired`, `launch`.
- `plan({ diagnostics, overrides, runtime })` calls `PlanFor#plan` with this start's
  model, catalog entry, port, key and user args; each argument defaults to the
  context's own value.
- `runtimeServer` the service's supervisor.
- `syncQueue(plan)` mirrors `plan.maxConcurrent` onto the LLM queue; errors are swallowed.
- `succeed(plan, extra)` returns `{ success: true, status, plan, ...extra }`.

## Why

Every step (borrow, placement, finalize, two rescues) replans with the same fixed
inputs and a different slice of state; one holder keeps them from passing a dozen
arguments around.
