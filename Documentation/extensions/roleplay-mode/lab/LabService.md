# LabService

`extensions/roleplay-mode/lab/LabService.js`

The Roleplay Lab: drives the REAL roleplay image flow for a seeded scenario with
a mocked LLM under a core LabHarness that records, overrides or freezes every
image step. Phase 1 renders the setup modal's art, phase 2 runs the production
postProcess.

## Methods

- Public field `broadcast(type, payload)`, pointed at the invoking renderer by
  core [LabIpcHandlers](../../../core/roleplay-lab/LabIpcHandlers.md).
- `getScenario()`, `getImageProfiles()` (deep copy of the profile matrix).
- `run({ overrides, options })` -> `{ success, error, outDir, steps, comparison, scenario }`;
  `options.emotion` sets the present mood, `options.beat` overrides the shot,
  `options.integratedCompare` adds the A/B render and `lab:comparison`.
- `regenerateFrom({ fromKey, overrides, options })` replays the steps before
  `fromKey` from their saved PNGs.
- `regenerateStep({ stepKey, overrides })` -> `{ success, error, stepKey, step }`,
  a fresh seed unless the override pins one.
- `LabService.NOT_REGISTERED`.

## Wiring

[RoleplayExtension](../RoleplayExtension.md) builds it on activation and parks
it on `global.__lumaRpLabService`. The core `core.rpLab.*` controller needs to
resolve it there per call (change request filed); until then the app's main.js
must pass that global to `new LabIpcHandlers(...)` after the extension activates.
