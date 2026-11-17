# TrainerRuntimeInstall

`extensions/lora-trainer/TrainerRuntimeInstall.js`

One install run.

## Steps

1. Download and unpack uv.
2. Download and unpack the pinned ai-toolkit source.
3. `uv venv <venv> --python 3.12 --managed-python --seed` (the old venv is removed first).
4. Pick the CUDA flavor from the driver banner and `uv pip install` the torch trio from that index.
5. Write the resolved requirements and the torch constraints, then `uv pip install -r ... --constraint ...`.
6. Delete uv's cache (it lives in the temp folder, see [TrainerPaths](TrainerPaths.md)) and write `trainer.json`.
   A failed install keeps the cache, so a retry does not download PyTorch again.

`execute()` resolves the manifest and throws a readable message on failure (code
`CANCELED` on cancel). `onStep(label, detail)` reports progress.

## Notes

The order and flags follow ai-toolkit's own installer (`manager/env.py`). The constraints
file keeps a later pass from replacing the CUDA torch build with a CPU one.
