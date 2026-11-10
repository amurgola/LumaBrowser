# LabServerService

`tools/roleplay/LabServerService.js`

The `llmServerService` the Lab's own chat router runs on outside the app: a
llama-server that is already up (one the CLI launched, or the app's Local
API) presented as the managed local server, so the router's real local path
sends the exact request body the app sends.

## Methods

- `new LabServerService({ chatStore, host, port, ctx, effort, modelStem, runtimeId })`:
  `ctx` the served window (`getEffectiveContext().ctxPerSlot`, settable later
  through the public `ctxPerSlot`, which a scenario's window hint uses);
  `effort` the thinking dial's global default (`getDefaults().reasoningEffort`;
  `off` also sets `noThink`); `modelStem` the `local::` stem the router lists;
  `runtimeId` the catalog entry whose adapter talks to the server (default
  `llama-cpp-luma`).
- What the router reads: `chatStore`, `modelSettings` (null: no Tune
  overrides outside the app), `runtimeServer` (`getStatus()` ready at the
  host and port, `plan` null, `authKey` null, `markActive`), `getDefaults`,
  `getEffectiveContext`, `computeLocalProviderEntry`, `getLastModelRef`,
  `setLastModelRef`, `getRunningThinking` (null), the slot counters.

## Why

Only what the router reads is here, and the two defaults a user could change
(the thinking dial, the window) are options, so a run can match a given setup.

## Changes (2026-11-09, helper model)

`helperModel`: a [LabHelperModel](LabHelperModel.md) or null (no `helper::` route).
