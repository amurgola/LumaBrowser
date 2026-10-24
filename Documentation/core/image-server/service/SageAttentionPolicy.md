# SageAttentionPolicy

`core/image-server/service/SageAttentionPolicy.js`

Decides whether an image launch runs its diffusion model with sd.cpp's native
CUDA SageAttention (`--sage-attn`).

## Methods

- `SageAttentionPolicy.decide({ model, runtime, cudaDevice, diagnostics, supportsFlag, env? })`
  resolves `{ sageAttention, note }`. `supportsFlag(flag)` probes the runtime's
  binary ([SdServerCapabilities](SdServerCapabilities.md)); `cudaDevice` is the
  pin (`"0"`, `"0,1"` or null for the whole box).
  1. `SD_SAGE_ATTN=0` is off for everyone; `=1` skips the model and card checks
     (the flag probe still applies).
  2. A model without `sageAttention: true` gets `{ false, note: null }`.
  3. Off, with a reason in the note, when the runtime id is not CUDA (`cuda` or
     `luma`), the diagnostics have no CUDA card reading, any pinned card's
     `computeCapability` is unknown or below `MIN_COMPUTE_CAPABILITY` (8.0), or
     the binary's help does not list the flag.
  4. Otherwise `{ true, note: 'SageAttention on' }`.
- Statics: `FLAG`, `MIN_COMPUTE_CAPABILITY`, `ENV`, `CUDA_RUNTIME`.

## Why

Measured 2026-10-22 on MiniMax-H3 (sd-cli, 864x480, seed 42): a 124-frame
sampling step went from 7.7 s to 4.5 s on an RTX 5090 and 4.0 s to 3.5 s on an
RTX 3090 at 39 frames, with no visible difference at equal step counts. Attention
quantization does change numerics, so only rows that measured it opt in. sd.cpp's
kernels need compute capability 8.0 (Ampere) and fail context creation below it,
and a Vulkan or CPU build errors on the flag, hence the hard refusals. The probe
is the last check so most launches never spawn `--help` for it.
