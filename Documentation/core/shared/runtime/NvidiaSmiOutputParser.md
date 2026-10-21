# NvidiaSmiOutputParser

`core/shared/runtime/NvidiaSmiOutputParser.js`

Parses raw nvidia-smi stdout. Pure, so it is testable without a GPU. The
invocation side is [NvidiaSmi](NvidiaSmi.md); the looping reader is
[NvidiaSmiBlockReader](nvidia-smi/NvidiaSmiBlockReader.md).

## Methods

- `NvidiaSmiOutputParser.parseGpuCount(stdout)` counts `GPU n:` lines of
  `nvidia-smi -L`. MIG sub-device lines are not counted. Garbage reads as 0.
- `NvidiaSmiOutputParser.parseGpuRow(line)` parses one
  `index, pci.bus_id, name, memory.total, memory.free` line into
  `{ index, busId, name, totalBytes, freeBytes }`, or `null` when it has fewer
  than five fields or its index is not a non-negative integer. An empty bus id
  is `null`.
- `NvidiaSmiOutputParser.parseGpuRows(stdout)` every parsable row, sorted by
  `index`; a repeated index (two loop iterations in one buffer) keeps the last.
  Non-numeric memory becomes `null`.
- `NvidiaSmiOutputParser.parseComputeApps(stdout)` parses
  `--query-compute-apps=pid,used_memory` into `{ pid: bytes }`, summing a pid
  that spans several cards. Malformed rows are skipped.
- `NvidiaSmiOutputParser.MIB` is 1048576, `GPU_ROW_MIN_FIELDS` 5.

## Why

The two memory numbers are read from the end of the row and the index and bus
id from the front, so a comma inside a GPU name only shifts the name.

Non-numeric memory (`[N/A]`) becomes `null`, not `NaN`, because `NaN` compares
false against everything and would silently exclude the card from placement.

`index` is nvidia-smi's own device index, which is the CUDA ordinal under
`CUDA_DEVICE_ORDER=PCI_BUS_ID`. It used to be the non-empty line position, so a
malformed first line shifted the next card to index 1 and the watchdog or
placement then watched the wrong card. That legacy behaviour was dropped
deliberately in the stream rework.

Drift settled here: fitTester queried `used_gpu_memory` and cudaPin queried
`used_memory`, different aliases for one field. `used_memory` won because it is
accepted by every supported driver. Also, fitTester returned `null` for "no
row for this pid" and cudaPin returned `{}`. An empty map is now the single
encoding: an absent pid means zero attributed VRAM; callers that need "did the
probe run at all" check the map's size.
