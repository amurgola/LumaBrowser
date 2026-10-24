# SdcppVideoBody

`core/image-server/server/image/SdcppVideoBody.js`

Builds the `POST /sdcpp/v1/vid_gen` request body from a video request.

## Methods

- `SdcppVideoBody.build(request)` returns the body. Defaults: 832 x 480, 33
  frames, 16 fps, 20 steps, `euler`, cfg 5.0, `webm`, seed `-1`. Every body also
  carries `preview: 'proj'` and `preview_interval: 1` (`SdcppVideoBody.PREVIEW`):
  sd-server reports the step counter only inside its `preview` object, so the
  near-free latent projection is always requested.
  - `flowShift > 0` -> `sample_params.flow_shift` (inside, not top level).
  - `moeBoundary` in (0, 1] -> `moe_boundary`.
  - `highNoiseSteps` (floored; a positive count, or -1 for the automatic split
    at `moe_boundary`), `highNoiseCfgScale` (finite) and `highNoiseSampler` ->
    `high_noise_sample_params`, only when any is set.
  - `loras`, `negativePrompt`, `cacheMode` (+ `cacheOption`) as for images.
  - `firstFrame` -> `init_image`, `lastFrame` -> `end_image` (base64).
- `SdcppVideoBody.frameCount(videoFrames)` and `SdcppVideoBody.fps(fps)` are
  the coercions (a positive value, else the default).

## Why

webm plays natively in a Chromium `<video>`, so the server's bytes are used
as-is with no muxing. `moe_boundary` (the Wan 2.2 expert switch point) is sent
only when set, so single-expert models never see it. The Lightning 4-step recipe
runs both experts at 4 steps; -1 asks for the automatic split, which the planner
sends for every other two-expert model, because the server's own default is a
20-step high-noise pass ADDED to `sample_steps` (an AniSora "10-step" render ran
30 steps, measured 2026-10-22). `firstFrame` drives image-to-video; `lastFrame` adds an end
anchor (FLF2V).
