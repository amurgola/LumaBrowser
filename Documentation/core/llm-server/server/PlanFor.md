# PlanFor

`core/llm-server/server/PlanFor.js`

Chooses the launch planner for a runtime and runs it: MLX runtimes go to
[MlxLaunchPlanner](MlxLaunchPlanner.md), extension runtimes to the `planLaunch`
hook they registered, everything else to [LaunchPlanner](LaunchPlanner.md).

## Methods

- `PlanFor.shared` the instance over `LlmRuntimeCatalog.shared`.
- `new PlanFor({ catalog, launchPlanner, mlxPlanner })` (all optional) for tests.
- `plan({ model, runtime, runtimeCatalogEntry, diagnostics, port, overrides, apiKey, userArgs })`
  returns `{ binaryPath, args, plan, authKey?, cudaDevice?, healthTimeoutMs? }`:
  - `runtimeCatalogEntry.launchStyle === 'mlx-server'`: the MLX plan with
    `authKey: null` (mlx_lm.server has no `--api-key`) and `cudaDevice: null`;
  - `acquisition: 'extension'` with a `planLaunch` hook: the hook gets
    `{ model, runtime, entry, diagnostics, port, overrides, apiKey, userArgs }`;
    a result without `binaryPath`, an `args` array or `plan` throws
    `<name>: planLaunch returned an invalid launch`; missing `authKey` and
    `cudaDevice` become null;
  - otherwise `LaunchPlanner#plan({ model, runtime, diagnostics, port, overrides, apiKey, userArgs })`.
    A missing entry falls back to llama.cpp.
- `PlanFor.isMlx(entry)` keys off `launchStyle` only.
- `isCustomLaunch(entry)` MLX or an extension planner: callers that reason about
  llama.cpp specifics (fit-test `-ngl` sweep, CUDA pin, VramCoordinator, hotswap)
  branch on this so a third style never falls into the llama.cpp path.

## Why

Bug H12: the context estimator called the llama.cpp planner unconditionally, so
an MLX model (no GGUF, no darwin GPU probe) planned `ngl 0` and the picker said
"doesn't fit" at every context of every MLX model, on the platform where MLX is
always fully GPU-resident. Making the choice one call rather than an inline
branch means no caller can forget there is more than one planner.
