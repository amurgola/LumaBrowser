# LoraTrainerExtension

`extensions/lora-trainer/LoraTrainerExtension.js`

The active add-on.

## Methods

- `new LoraTrainerExtension({ baseDir, tools })`: both are test seams (defaults:
  `AppPaths.appBaseDir()` and the shared `mcp-tools` module).
- `activate(context)`: registers every recipe of [TrainingRecipes](TrainingRecipes.md) with
  `context.imageTraining` (skipped on a core without that surface), builds the services,
  clears the working files of abandoned jobs ([TrainingJobs](TrainingJobs.md) `abandonedIds`),
  binds `{ flow, applier, overview }` to the tools. Returns `{ status(jobId), recipes() }`.
- `deactivate()`: unbinds the tools and asks a running job to stop.
