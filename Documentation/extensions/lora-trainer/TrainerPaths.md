# TrainerPaths

`extensions/lora-trainer/TrainerPaths.js`

Folder layout under the app's managed base folder.

- `runtimes/lora-trainer/`: `uv/`, `uv-cache/`, `python/` (uv's managed CPython), `src/ai-toolkit-<ref>/`,
  `venv/`, `trainer.json`, the resolved requirements and torch constraints files.
- `lora-training/hf-cache/`: the base weights ai-toolkit downloads (`HF_HOME`).
- `lora-training/jobs/<job id>/`: `dataset/`, `output/`, `config.json`, `train.log`, `job.json`.

Getters and helpers: `runtimeDir`, `uvDir`, `pythonPath`, `sourceDir(ref)`, `hubCacheDir`,
`jobsDir`, `jobDir(id)`, `datasetDir(id)`, `outputDir(id)`, `configPath(id)`, `logPath(id)`, `jobFile(id)`.
