# NativeToolPlan

`core/llm-server/chat/bridge/tools/NativeToolPlan.js`

Whether this run's model takes tools natively, which tools its family keeps out
of the array, and the array itself.

## Methods

- `NativeToolPlan.forRun({ router, modelRef, override = null, ctxPerSlot = null })`: enabled from
  `router.modelNativeToolsActive(modelRef)` (else `HarmonyModel.matches`);
  `override: 'off'` disables it except for harmony models. `exclude` from
  `router.modelNativeToolExclude(modelRef)` when enabled. `ctxPerSlot` bounds
  the array.
- `enabled`, `exclude`, `ctxPerSlot`.
- `build(toolSet)`: null when disabled, else `ToolSchemas.buildHarmonyTools({
  allows, extTools, activeGroups, groups })` minus excluded names; when that
  array's estimated tokens exceed `MAX_CONTEXT_SHARE` (0.25) of `ctxPerSlot`,
  the inactive groups' stubs are left out
  ([LazySchemaStubber](../../tool-schemas/LazySchemaStubber.md)`.dropInactive`).
  Rebuilt per iteration because a group can activate mid-run.
- `trimsInactive(toolSet)`: whether `build` leaves the inactive groups out.
- `estimateTokens(toolSet)`: the array's `TokenEstimator` size, 0 when
  disabled or on failure.

## Why the array is bounded

DeepSeek-V4.1-Flash on a 16k window (2026-11-04): the 98 registered schemas
(51k characters of JSON) rendered to about 12k tokens through its chat
template, and with the 5k-token system prompt every request overflowed the
window before the task was read (HTTP 400, 17.7k of 16.4k tokens). Without the
inactive groups' stubs the array is a quarter of that. The estimate is
`TokenEstimator`'s four characters per token, which matched that template.
