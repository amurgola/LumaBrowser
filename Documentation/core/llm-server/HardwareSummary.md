# HardwareSummary

`core/llm-server/HardwareSummary.js`

Builds the one-line hardware snapshot stored with fit-test results, for
example `96 GB RAM · 1× RTX 5090, 2× RTX 3090`.

## Methods

- `HardwareSummary.summarize(diagnostics)` takes a `gatherDiagnostics()`
  snapshot and returns the line; `no GPU detected` is appended when RAM is
  known but no GPU is, and the result is `''` only if nothing could be derived.
- `HardwareSummary.shortGpuName(raw)` strips vendor chrome
  (`NVIDIA GeForce RTX 5090` -> `RTX 5090`), keeping the series token.

## Why

Fit-test numbers (VRAM, RAM, tok/s) only mean something next to the machine
that produced them, so the host is snapshotted with every run.

GPU source preference: the budget's per-adapter view (already deduped across
nvidia-smi, the registry and Chromium), then CUDA devices, then Chromium
adapters minus the Microsoft Basic Render driver. Identical cards are counted
in first-seen order so a mixed rig reads the way the user thinks of it.
