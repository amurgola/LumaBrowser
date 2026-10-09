# GambitProvenance

`core/llm-server/ipc/GambitProvenance.js`

The provenance block of a gambit report and the rule for which runs are stored.

## Methods

- `GambitProvenance.meta({ llmServerService, defaults, livePath, modelRef, modelLabel, startedAt, filtered, options })`
  returns `report.meta`: `modelPath, modelRef, modelName` (label, else the default's
  name), the effective context and placement below, `kvCacheType, startedAt,
  filtered`, and the experiment switches `nativeHistory` (boolean), `nativeTools`
  (`off` or `default`), `agentEffort` (or null), `parallel` (only when > 1),
  `promptExperiments` (a copy, or null when empty).
- `GambitProvenance.effectiveContext(svc, defaults)` `{ contextSize, contextRequested,
  ctxPerSlot, slots, contextSource }`: the live `getEffectiveContext()` window when
  positive, else the requested (floored) size. Never throws.
- `GambitProvenance.placement(svc)` `{ placement: { gpus, tensorSplit, splitMode, ngl } }`
  from the running plan's argv (`--tensor-split` part count, `--split-mode`, `-ngl`),
  or `{ placement: null }`.
- `GambitProvenance.noteContextDrift(report, svc, defaults)` sets
  `report.meta.contextChangedDuringRun = { from, to }` when the effective context at
  the end differs. Never throws.
- `GambitProvenance.isPersistable(meta)` true only for a full, stock run (no
  filter, no experiment switch) or no meta.

## Why

The planner clamps for VRAM, slot count and the GGUF's own limit, and placement
is decided from free VRAM at launch (a split run measured about twice as slow per
iteration). A report that misdescribes its configuration makes two runs look
comparable when they are not, and a filtered or experimental score stored under
the model's key would claim a grade it never earned.
