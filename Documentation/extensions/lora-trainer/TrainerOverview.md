# TrainerOverview

`extensions/lora-trainer/TrainerOverview.js`

Builds the answer of `lora_training_status`.

## Methods

- `describe(jobId = null)` -> `{ job, recentJobs, trainerInstalled, trainableModels, trainedLoras }`.
  `job` is the one asked for, else the running one, else the latest. `trainableModels` rows
  carry the recipe label, usual steps, the VRAM the recipe wants and the size of the
  first-run weights download. `trainedLoras` lists library LoRAs that have a sidecar.
  A failing image side yields empty lists, not an error.
