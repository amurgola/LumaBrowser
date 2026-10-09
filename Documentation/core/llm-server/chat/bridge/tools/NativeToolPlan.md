# NativeToolPlan

`core/llm-server/chat/bridge/tools/NativeToolPlan.js`

Whether this run's model takes tools natively, which tools its family keeps out
of the array, and the array itself.

## Methods

- `NativeToolPlan.forRun({ router, modelRef, override = null })`: enabled from
  `router.modelNativeToolsActive(modelRef)` (else `HarmonyModel.matches`);
  `override: 'off'` disables it except for harmony models. `exclude` from
  `router.modelNativeToolExclude(modelRef)` when enabled.
- `enabled`, `exclude`.
- `build(toolSet)`: null when disabled, else `ToolSchemas.buildHarmonyTools({
  allows, extTools, activeGroups, groups })` minus excluded names. Rebuilt per
  iteration because a group can activate mid-run.
- `estimateTokens(toolSet)`: the array's `TokenEstimator` size, 0 when
  disabled or on failure.
