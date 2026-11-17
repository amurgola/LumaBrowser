# TrainerPaths

`extensions/lora-trainer/TrainerPaths.js`

Folder layout, all under `runtimes/lora-trainer/` in the app's managed base folder.

- `uv/`, `python/` (uv's managed CPython), `src/ai-toolkit-<ref>/`, `venv/`,
  `trainer.json`, the resolved requirements and torch constraints files.
- `work/hf/`: the base weights ai-toolkit downloads (`HF_HOME`).
- `work/jobs/<job id>/`: `dataset/`, `output/`, `config.json`, `train.log`, `job.json`.

`uvCacheDir` is `<temp folder>/luma-uv`, outside this layout: uv builds source packages
inside its cache, and the build tree of the pinned diffusers commit under a deep runtime
path ran past the 260 character limit of Windows (seen on the first real install,
2026-11-16). The cache is deleted when an install succeeds.

## Why

In a dev run the managed base folder is the repo root, where only `/runtimes` and the
models folder are git-ignored, and an installed build relocates exactly those managed
folders. Keeping the working area inside the runtime folder covers both. The names are
short because Windows paths into the Hugging Face cache run long.

Getters and helpers: `runtimeDir`, `uvDir`, `pythonPath`, `sourceDir(ref)`, `hubCacheDir`,
`jobsDir`, `jobDir(id)`, `datasetDir(id)`, `outputDir(id)`, `configPath(id)`, `logPath(id)`, `jobFile(id)`.
