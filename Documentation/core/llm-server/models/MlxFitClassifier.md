# MlxFitClassifier

`core/llm-server/models/MlxFitClassifier.js`

The pre-download fit badge for an MLX model on Apple Silicon.

## Methods

- `MlxFitClassifier.classify(totalBytes, hw)` returns `{ tier, badge, label }`
  against `hw.usableRamBytes`: unknown RAM is `spill`/amber
  (`Unknown memory, proceed with care`); up to 70% `fits`/green
  (`Fits, runs on the Apple GPU`); up to 85% `tight`/amber
  (`Tight, close other apps`); up to 100% `spill`/orange (`Very tight, may swap`);
  else `too-big`/red (`Too large for this Mac`). Edges are inclusive.
- `FITS_FRACTION` (0.7), `TIGHT_FRACTION` (0.85).

## Why

There is no discrete VRAM on Apple Silicon: the GPU shares system RAM, so the
bound is total RAM with headroom left for the KV cache and the OS. MLX loads the
whole model directory, so the whole repo is sized.
