# ResourceBudget

`core/llm-server/diagnostics/ResourceBudget.js`

How much RAM and VRAM local models may plan to use.

## Methods

- `ResourceBudget.compute(memory, gpu, cuda)` returns `{ ram, vram }`.
  - `ram`: `{ totalBytes, reserveBytes, maxBytes, currentlyFreeBytes, note }`.
    The reserve is 25 percent of total clamped to 2..8 GB; `maxBytes` is total
    minus reserve; `currentlyFreeBytes` is free minus a 1 GB safety margin,
    capped at `maxBytes`.
  - `vram`: `{ totalBytes, reserveBytes, maxBytes, currentlyFreeBytes, perAdapter, note, hasFreeData }`.
    One `perAdapter` row (`{ name, vendor, source, totalBytes, reserveBytes,
    maxBytes, currentlyFreeBytes }`) per nvidia-smi device and per non-NVIDIA
    adapter with a known VRAM size, each reserving 1 GB and keeping a 512 MB
    free-VRAM safety margin. `currentlyFreeBytes` is `null` when no adapter
    reports free VRAM.

## Why

Reserves keep a chosen model from OOM-ing the OS or starving the compositor.
Each adapter is charged from its most authoritative source: nvidia-smi for
NVIDIA (live free VRAM), the Windows registry merge for the rest. Working from
`cuda.devices` directly keeps the budget populated even when Chromium reports
NVIDIA adapters with empty names (seen on driver R596+) and the adapter merge
fails. An adapter whose PCI id nvidia-smi already charged is skipped, so a card
is never counted twice.
