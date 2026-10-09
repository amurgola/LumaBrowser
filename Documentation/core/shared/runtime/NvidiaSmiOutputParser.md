# NvidiaSmiOutputParser

`core/shared/runtime/NvidiaSmiOutputParser.js`

Parses raw nvidia-smi stdout. Pure, so it is testable without a GPU. The
invocation side is [NvidiaSmi](NvidiaSmi.md).

## Methods

- `NvidiaSmiOutputParser.parseGpuCount(stdout)` counts `GPU n:` lines of
  `nvidia-smi -L`. MIG sub-device lines are not counted. Garbage reads as 0.
- `NvidiaSmiOutputParser.parseGpuRows(stdout)` parses
  `--query-gpu=name,memory.total,memory.free --format=csv,noheader,nounits` into
  `[{ index, name, totalBytes, freeBytes }]`. Rows with fewer than three fields
  are skipped. Non-numeric memory becomes `null`.
- `NvidiaSmiOutputParser.parseComputeApps(stdout)` parses
  `--query-compute-apps=pid,used_memory` into `{ pid: bytes }`, summing a pid
  that spans several cards. Malformed rows are skipped.
- `NvidiaSmiOutputParser.MIB` is 1048576.

## Why

The two memory numbers are read from the end of the row, so a comma inside a
GPU name only shifts the name.

Non-numeric memory (`[N/A]`) becomes `null`, not `NaN`, because `NaN` compares
false against everything and would silently exclude the card from placement.

`index` is the non-empty line position, not nvidia-smi's device index, so a
skipped malformed line still consumes an index. Legacy behaviour, kept.

Drift settled here: fitTester queried `used_gpu_memory` and cudaPin queried
`used_memory`, different aliases for one field. `used_memory` won because it is
accepted by every supported driver. Also, fitTester returned `null` for "no
row for this pid" and cudaPin returned `{}`. An empty map is now the single
encoding: an absent pid means zero attributed VRAM; callers that need "did the
probe run at all" check the map's size.
