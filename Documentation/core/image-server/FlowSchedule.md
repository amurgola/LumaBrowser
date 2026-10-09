# FlowSchedule

`core/image-server/FlowSchedule.js`

Turns a few-step model's raw sigma nodes into shifted flow-matching sigmas that
sd-server accepts verbatim as `sample_params.custom_sigmas`.

## Methods

- `FlowSchedule.flowMu(family, width, height)` returns the time-shift mu for a
  canvas (linear in the number of image tokens), or `null` for a family with no
  known shift or a canvas smaller than one token.
- `FlowSchedule.timeShift(mu, t)` returns the flux time shift of raw node `t`
  (0 and 1 are pinned).
- `FlowSchedule.sigmasFromNodes({ nodes, family, width, height })` returns the
  shifted nodes rounded to 6 decimals plus a closing `0`, or `null` when the
  nodes are not a strictly descending list in (0, 1] or the family is unknown.
  `null` means "keep the runtime's own schedule".
- `FlowSchedule.FAMILIES` holds the per-family shift constants (base/max shift,
  base/max sequence length, patch pixel size).

## Why

A few-step distilled model (a turbo LoRA) is trained to land on specific noise
levels. The Viggle Qwen-Image 2.1 turbo wants `[1, 0.9375, 0.875, 0.75, 0.5,
0.25]`, three of six steps spent in the first eighth of the noise range where
composition is decided. The runtime's own schedule for the same step count
spaces nodes evenly and stretches the last call to sigma 0.02, a different
schedule and a wasted step for such a model.

sd-server applies no time shift to `custom_sigmas`, while the published nodes
are meant to go through the model's resolution-dependent shift, so the shift is
applied here. Constants mirror the runtime's FluxScheduler
(stable-diffusion.cpp `src/runtime/denoiser.hpp`) and the model's scheduler
config. No terminal stretch is applied.
