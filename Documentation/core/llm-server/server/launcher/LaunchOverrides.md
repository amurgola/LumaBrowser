# LaunchOverrides

`core/llm-server/server/launcher/LaunchOverrides.js`

Builds the planner overrides for a local start.

## Methods

- `LaunchOverrides.apply(ctx, { freeMemory })` sets `ctx.kvMode`
  (`defaults.kvCacheType`), `ctx.userArgs` (`service.resolveModelLaunchFlags(path)`
  or `''`), `ctx.layout` and `ctx.overrides`:
  `{ contextSize, cacheTypeK, cacheTypeV, maxConcurrent, tensorSplitMode, cacheReuse,
  promptCacheRam, cpuMoe, noSpecDrafter, noNgramSpec, suppressMmprojLoad, ramPin }`
  plus, when they apply, `noKvOffload`, `vramCapBytes` and `measuredVramBytes`.
  - The KV pair is `KvCacheModes.pair(kvMode)`; tensor split forces `f16`/`f16`.
  - `promptCacheRam` is the `LaunchPlanner.PROMPT_CACHE_RAM_SETTING_KEY` setting, default `'auto'`.
  - `suppressMmprojLoad` is `!withVision`.
  - `ramPin` is `{ freeBytes: freeMemory() }` when `service.ramPin.isActiveFor(path)`, else null.
  - `measuredVramBytes` is `ContextEstimator.measuredComboVram(fitEntry, contextSize, kvMode)`,
    plus `model.mmprojTotalBytes` for a vision start.

## Why

The measured fit is keyed by the mode id, not the K type: an asymmetric mode
shares its K type with another mode. Fit tests measure text-only, so a vision
start adds the projector bytes, or the placement could pin a card the projector
does not fit. Forcing f16 for tensor split keeps the fit lookup and the probe
sizing the same KV the launch will use.
