# LabHarness

`core/roleplay-lab/LabHarness.js`

The Roleplay Lab's instrumentation seam (WIP research playground). The Lab
drives the real roleplay reaction pipeline (extensions/roleplay-mode postProcess)
so the prompts, params and images it shows are exactly what production does.
Instead of forking the pipeline, a harness is installed at `global.__rpLab` and
consulted by two inert-by-default hooks in ExtensionManager's `context.chat`:

- `generateImage(opts)` -> `beforeImage(opts)`, then `afterImage(result, effective)`
- `complete(opts)` -> `completeMock(opts)`

With no harness installed (the normal case) the hooks are skipped and
production behaviour is unchanged.

## Methods

- `new LabHarness({ outDir?, emit?, overrides?, frozen?, completeMocks? })`
  - `outDir` scratch folder for step PNGs (created if missing)
  - `emit(type, payload)` live step events (`lab:step`)
  - `overrides` stepKey -> partial generateImage params
  - `frozen` stepKey -> `{ b64, mime }` cached output to replay
  - `completeMocks` agent kind (`stage`, `extract`, `wardrobe`, `director`, `default`) -> text
- `beforeImage(opts)` assigns the step key; for a frozen step records a replay
  and returns `{ frozen: { b64, mime }, record }` (skip the model); otherwise
  applies any override and returns `{ opts }` (run).
- `afterImage(result, effective)` records the pending step. `effective` is the
  router's resolved params (`meta` event), overlaid so steps that left
  sampler, cfg and so on to model defaults show what actually ran.
- `completeMock(opts)` `{ text }` for the sniffed agent kind (LabCompletionKind),
  else the `default` mock, else null (run the real completion).
- `manifest()` `{ steps, outDir }` with copies of the step records.
- Public fields read by LabService and the hooks: `active`, `outDir`, `steps`
  (records in execution order), `fullOpts` (stepKey -> full opts, image bytes
  included, so one step can be re-run alone).
- `LabHarness.install(harness)`, `LabHarness.uninstall()` (returns the removed
  harness), `LabHarness.current()` manage `global.__rpLab`.

## Step records

`{ key, label, seq, replayed, params, ok, mime, file }`. `params` are
LabStepParams-scrubbed. `file` is `NN-<key>.png` in `outDir` (key sanitised to
`[a-z0-9_#-]`), or null when there is no output dir, no image, or the write
failed. The live `lab:step` event adds `b64` (the output) and
`inputs: { initImage, refImages }` so the window can show what fed each step.

## Why the step keys

Keys are the step's `label`, plus `#n` when a label repeats (per-character
figures), so they are stable across runs of the same scenario. That is what
makes freezing and overriding addressable: "regenerate from here" replays the
cheap upstream steps and only re-runs the target step and what follows.
