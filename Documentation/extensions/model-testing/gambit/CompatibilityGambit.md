# CompatibilityGambit

`extensions/model-testing/gambit/CompatibilityGambit.js`

The LumaBrowser compatibility gambit as a selectable test suite (id `compatibility-gambit`).
Implements the suite contract of [TestSuiteCatalog](../TestSuiteCatalog.md).

## Methods

- `new CompatibilityGambit({ llmServerService, chatRouter, runner?, capabilities?, bridgeTurn?, store? })`
  (defaults `GambitRunner`, `GambitCapabilities`, `GambitBridgeTurn` and a
  [GambitResultStore](GambitResultStore.md) over the service's settings database).
- `describe()` `{ id, label: 'LumaBrowser compatibility gambit', description, duration: '30 to 60 minutes', taskCount }`.
- `run({ target, options, startedAt, isAborted, onProgress })`:
  1. detects capabilities, loads the suite and applies `options.filter`
     (`No tasks matched that filter.` is thrown when it matches nothing);
  2. reports `{ phase: 'resolved', total, capabilities, capabilityReasons, filtered }`;
  3. runs [GambitRunner](GambitRunner.md)`.runGambit` with a
     [GambitBridgeTurn](GambitBridgeTurn.md) over `router.agentBridge`, the target's deps
     and model ref, the experiment switches and the [GambitProvenance](GambitProvenance.md) meta;
  4. records context drift and resolves the report (with `aborted` and `raw`).
- `results()` the stored grades by model path.
- `save(modelPath, report, ranAt)` stores a persistable run and returns its `ranAt`; a
  filtered or experimental run returns null and is not stored.
- `CompatibilityGambit.options(options)` the defaulted
  `{ filter: { groups, taskIds }, nativeHistory, nativeTools, agentEffort, parallel, promptExperiments }`;
  `CompatibilityGambit.filterSuite(suite, filter)` the tasks in the named groups or ids
  (unchanged when both lists are empty), null when none match.

## Why

A filtered or experimental score stored under the model's key would claim a grade the
model never earned, so only a full stock run is kept. The task filter and the switches
come from the `run-gambit` command; the tab always runs the full suite.
