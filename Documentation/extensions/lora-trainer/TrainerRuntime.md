# TrainerRuntime

`extensions/lora-trainer/TrainerRuntime.js`

The runtime as the rest of the add-on sees it.

## Methods

- `status()` -> `{ installed, manifest }`: installed while `trainer.json` matches the
  pinned spec and its Python and source folder still exist.
- `ensureInstalled({ onStep, isCanceled })`: installs when needed; concurrent callers share one install.
- `trainCommand({ configPath, logPath, cudaDevice })` -> `{ command, args, cwd, env }`:
  the venv's Python running `run.py <config> --log <log>` in the source folder.
