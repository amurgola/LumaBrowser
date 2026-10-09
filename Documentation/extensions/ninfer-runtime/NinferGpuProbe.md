# NinferGpuProbe

`extensions/ninfer-runtime/NinferGpuProbe.js`

Finds the RTX 5090 as the NInfer server will see it, at install time.

## Methods

- `NinferGpuProbe.probe(mode, distro)` runs `nvidia-smi --query-gpu=index,name,memory.total`
  where NInfer runs and resolves `{ devices, match }` (`match` is the first
  device whose name matches `RTX 5090`, or null), or `null` when nvidia-smi failed.
- `NinferGpuProbe.parseRows(stdout)` returns `[{ index, name, vramBytes }]`.

## Why

The planner is synchronous, so the CUDA ordinal and VRAM of the 5090 are probed
once and frozen into the manifest. Inside WSL the ordinal need not match Windows'.
