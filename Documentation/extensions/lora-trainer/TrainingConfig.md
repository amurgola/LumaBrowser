# TrainingConfig

`extensions/lora-trainer/TrainingConfig.js`

Builds the ai-toolkit job file (JSON, which the trainer accepts beside YAML).

## Methods

- `TrainingConfig.build({ recipe, job, datasetDir, outputDir, basePath })`: one
  `sd_trainer` process with `network`, `save`, `datasets`, `train`, `model` and `sample`
  blocks. The defaults mirror the trainer's own defaults for a new job; the recipe's
  blocks are laid over them; the job's rank and steps win over the recipe's.

## Notes

- Preview sampling is switched off (`disable_sampling`): it costs time and memory on
  every save, and the finished LoRA is tried in the app instead.
- Checkpoints are saved about four times per run and the last two kept.
- The LoRA is saved as float16 in the trainer's default `safetensors` layout.
