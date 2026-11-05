# ClipPlacement

`core/image-server/server/ClipPlacement.js`

Decides, per launch, whether an image model's text encoders stay on the CPU
(the catalog's `--clip-on-cpu`). On a GPU runtime they never do.

## Methods

- `ClipPlacement.decide({ model, cudaDevice, offloadToCpu, autoFit, cpuOnly?, env? })`
  returns `{ clipOnCpu, note }`:
  - `clipOnCpu: undefined, note: null` when `model.launchArgs` lacks `--clip-on-cpu`;
  - `true` (keep the posture) on a CPU-only runtime or when `env.SD_CLIP_ON_CPU`
    is `1`;
  - otherwise `false` (drop the flag). `note` reads `text encoders on GPU: <why>`
    naming the budget, the offload staging, the pinned card or sd-server's own
    placement, or `text encoders on CPU: <why>`.
- Statics: `ENV` (`SD_CLIP_ON_CPU`).

## Why

Flux-class and Qwen rows pin `--clip-on-cpu` so small cards give the diffusion
model the whole card. A CPU conditioner is the slowest part of an edit by far:
on a Qwen-Image 2.1 edit the Qwen3-VL text and vision pass took 26.9 s on the
CPU against 2.1 s on the 5090 (measured 2026-11-04). The same measurement showed
sd-server needs no help with the memory side: under a `--max-vram` budget the
encoders lived in pinned RAM and the conditioner still ran on the GPU in 2.5 s,
and `--offload-to-cpu` stages whole modules into VRAM when there is room. So the
room arithmetic this module used to do (weights plus encoder bytes against the
pinned card's free VRAM) is gone; the flag is dropped on every GPU placement and
kept only where there is no GPU, or when the user forces it with the env
variable to reproduce the old behaviour.
