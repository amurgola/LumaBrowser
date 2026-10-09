# VideoRequestPlanner

`core/image-server/video/VideoRequestPlanner.js`

Resolves a video request into the sd-server adapter parameters.

## Methods

- `new VideoRequestPlanner({ lorasDir })`.
- `plan({ request, model, wantId })` returns `{ params, adjustments }`:
  - caller value, else `model.defaults`, else `VideoRequestPlanner.DEFAULTS`
    (832x480, 20 steps, cfg 5.0, `euler`, 16 fps, 33 frames) for size, steps,
    cfg, sampler, scheduler, negative prompt, fps and flow shift; `seed` only from
    the caller (null otherwise);
  - model-only knobs: `outputFormat`, `moeBoundary`, `highNoiseSteps`,
    `highNoiseCfgScale`, `cacheMode`, `cacheOption`;
  - `loras` from [ImageLoraSpecs](../router/ImageLoraSpecs.md)`.resolve(model.defaults, lorasDir)`;
  - `firstFrame`, `lastFrame` (null when absent);
  - then `VideoConstraints.normalizeVideoRequest` snaps width, height, frames and
    fps to `model.constraints`; any change is logged as
    `[video-server] "<id>" request adjusted to the model grid: ...`.
- `VideoRequestPlanner.metaFields(plan, i2v)` the `meta` event fields
  (`adjustments` only when there are any).
- `VideoRequestPlanner.frameCount(request, md, fps)` explicit `videoFrames`
  (floored), else `durationSec` x fps (capped at `MAX_DURATION_SEC` = 15, at
  least 1), else `md.videoFrames`, else 33.
- `VideoRequestPlanner.fps(requested, modelFps)` the first positive, else 16.

## Why

The chat tool exposes `durationSec` because callers think in seconds; the cap
stops "make it a minute long" from OOMing the slot. Snapping here, not only inside
sd.cpp, means the meta event, the log and the artifact describe the clip that
actually renders.
