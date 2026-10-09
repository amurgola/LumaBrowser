# CudaSnapshot

`core/shared/runtime/CudaSnapshot.js`

Decides whether a cached failed CUDA probe is stable (safe to serve from cache)
or transient (must force a re-probe).

## Methods

- `CudaSnapshot.isTransientCudaFailure(cuda)` takes the `cuda` section of a
  diagnostics snapshot (`{ available, reason }`) and returns `true` only when
  `available === false`, `reason` is non-empty, and `reason` does not match
  `not found` or `not available` (case-insensitive).
- `CudaSnapshot.STABLE_FAILURE_PATTERN` is that regex.

## Why

The diagnostics and runtimes-view caches in the LLM and image server services
persist their snapshots across boots. "No NVIDIA stack installed" is stable and
fine to cache. But if nvidia-smi exists and errored (NVML driver/library
mismatch after a driver update, a timeout, permissions), the state usually
fixes itself after a reboot. Caching it would report "no CUDA" forever.

A failure with no reason is treated as stable, matching legacy behaviour.
