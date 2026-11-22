# LaunchOverrides

`core/llm-server/server/launcher/LaunchOverrides.js`

Builds the planner overrides for a local start, and resolves the OpenVINO
device.

## Methods

- `LaunchOverrides.apply(ctx, { freeMemory })` first replaces `ctx.defaults` with
  `service.getLaunchDefaults(RuntimeFrameworks.frameworkIdOf(ctx.runtime))`, the defaults of the framework of the
  runtime preflight resolved (kept as they are on a service without `getLaunchDefaults`). Then it sets `ctx.kvMode`
  (`defaults.kvCacheType`), `ctx.userArgs` (`service.resolveModelLaunchFlags(path)`
  or `''`), `ctx.layout` and `ctx.overrides`:
  `{ contextSize, cacheTypeK, cacheTypeV, maxConcurrent, tensorSplitMode, cacheReuse,
  promptCacheRam, cpuMoe, noMoeGpuCache, noSpecDrafter, noNgramSpec, suppressMmprojLoad, ramPin, moeProfileDir }`
  plus, when they apply, `noKvOffload`, `vramCapBytes`, `measuredVramBytes` and `frameworkOptions`.
  - `frameworkOptions` is `service.frameworkOptions.launchValues(ctx.runtime)`
    ([FrameworkOptions](../../service/FrameworkOptions.md)): the resolved build's custom option values with their
    declared defaults; left out when the build declares none.
  - The KV pair is `KvCacheModes.pair(kvMode)`; tensor split forces `f16`/`f16`.
  - `promptCacheRam` is the `LaunchPlanner.PROMPT_CACHE_RAM_SETTING_KEY` setting, default `'auto'`.
  - `suppressMmprojLoad` is `!withVision`.
  - `ramPin` is `{ freeBytes: freeMemory() }` when `service.ramPin.isActiveFor(path)`, else null.
  - `moeProfileDir` is `service.moeProfileDir()` when the service offers one, else the app's
    `userData/moe-profiles` (`MOE_PROFILE_DIR`), created before the spawn since the luma runtime writes the
    model's expert use profile there itself ([MoeRamTierPlan](../launch/MoeRamTierPlan.md)); null outside Electron.
  - `measuredVramBytes` is `ContextEstimator.measuredComboVram(fitEntry, contextSize, kvMode)`,
    plus `model.mmprojTotalBytes` for a vision start.
  - Last, `ctx.openvinoDevice`: for the `llama-cpp-openvino` runtime,
    [OpenVinoDevice](../../runtimes/OpenVinoDevice.md)`.resolve(defaults.openvinoDevice, ctx.diag)`,
    else null; on the NPU `overrides.maxConcurrent` is forced to 1.

Known options the resolved build does not declare are switched off before the overrides are built
(`FrameworkOptions.declaredOnly`): before this, a global tensor split forced full precision KV on every runtime,
Basalt included.

## Why

The measured fit is keyed by the mode id, not the K type: an asymmetric mode
shares its K type with another mode. Fit tests measure text-only, so a vision
start adds the projector bytes, or the placement could pin a card the projector
does not fit. Forcing f16 for tensor split keeps the fit lookup and the probe
sizing the same KV the launch will use. The OpenVINO NPU runs stateless with a
static graph, so llama-server `-np` above 1 is not supported there.

## measuredShape (2026-11-20)

`_applyMeasuredFit` sets `overrides.measuredShape` beside
`measuredVramBytes`: the launch shape the stored peak was measured under
([FitRows](../../context/FitRows.md)`.measuredComboShape`, null for an older
row). The planner sets a peak of another shape aside
([FitShape](../launch/FitShape.md)).

## Framework options (2026-11-22)

The context reads the defaults before preflight resolves the runtime, so they are those of the framework that
serves the default model. A launch that resolves another framework re-reads them here, so its KV precision, slots
and switches are that framework's own. Custom options (Basalt's sleep) reach planners only as
`overrides.frameworkOptions`, and only for a build that declares some, so every other planner's overrides are
unchanged.
