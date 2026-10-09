# HostProbe

`core/llm-server/diagnostics/HostProbe.js`

Host facts from Node's `os` module.

## Methods

- `HostProbe.platform()` returns `{ os, arch, release, hostname }`.
- `HostProbe.memory()` returns `{ totalBytes, freeBytes }`.
- `HostProbe.cpu()` returns `{ model, speedMHz, logicalCores }` from the first
  CPU (model whitespace collapsed, `Unknown` when absent).
