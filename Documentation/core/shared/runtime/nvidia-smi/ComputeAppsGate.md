# ComputeAppsGate

`core/shared/runtime/nvidia-smi/ComputeAppsGate.js`

Decides when [NvidiaSmiStream](../NvidiaSmiStream.md) should re-query the
per-process VRAM list (`--query-compute-apps`): only when some card's used
bytes moved since the last list, or on explicit request.

## Methods

- `changed(rows)` true until a list is recorded, then whenever the signature of
  `rows` differs from the recorded one.
- `record(rows)` remembers the signature of the rows the list was queried for.
- `reset()`.
- `ComputeAppsGate.signature(rows)` one token per card, `index:usedBytes`
  joined by `|`; unknown total or free VRAM is spelled `unknown` so it still
  compares.

## Why

A card whose used bytes did not move has the same process list it had; asking
nvidia-smi for it on every placement or sampler tick was a spawn for nothing.
