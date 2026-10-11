# UnifiedMemoryProbe

`core/llm-server/diagnostics/UnifiedMemoryProbe.js`

The share of unified memory the GPU of an Apple Silicon Mac can use, reported
as its VRAM.

## Methods

- `UnifiedMemoryProbe.applies(platform?, arch?)` true only for darwin arm64.
- `UnifiedMemoryProbe.probe(totalRamBytes, { platform, arch, run })` resolves
  `{ bytes, source }` on Apple Silicon, else null (also null without a positive
  RAM total). Reads `sysctl -n iogpu.wired_limit_mb` through `run`
  ([DiagnosticsCommand](DiagnosticsCommand.md)`.run`, a test seam).
- `UnifiedMemoryProbe.workingSet(totalRamBytes, wiredLimitMb = 0)`: a set
  wired limit gives `min(RAM, limit)` with `source: 'iogpu.wired_limit_mb'`;
  otherwise two thirds of RAM (three quarters above 36 GiB) with
  `source: 'unified-memory'`.
- Constants `MIB`, `GIB`, `LARGE_HOST_BYTES`, `SMALL_HOST_FRACTION`,
  `LARGE_HOST_FRACTION`.

## Why

Only nvidia-smi and the Windows registry supplied VRAM figures, so the launch
planner saw 0 bytes on a Mac and launched llama-server with `-ngl 0`: Apple
Silicon ran on the CPU despite the Metal build. The fractions mirror Metal's
`recommendedMaxWorkingSetSize`; a wired limit of 0 (the default) means macOS
decides, and a user who raised it gets their figure.
