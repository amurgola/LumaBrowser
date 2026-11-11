# ImageRequestPlanner

`core/image-server/router/ImageRequestPlanner.js`

Resolves one image request against its model record into the exact parameters
the adapter receives.

## Methods

- `new ImageRequestPlanner({ lorasDir?, presize? })`; `presize` defaults to
  [RefImagePresizer](../RefImagePresizer.md)`.presize`.
- `plan({ request, model, send? })` returns `{ params, refCount, refSizes, outputSize }`.
  `outputSize` is `null` unless the render canvas was enlarged (see the edit
  render step below); it is then the canvas that was asked for, which
  [LocalImageRun](LocalImageRun.md) scales the finished image back to.
  `params` holds `prompt, negativePrompt, width, height, steps, cfgScale,
  sampler, scheduler, seed, loras, customSigmas, refImageArgs, refMaxPixels, cacheMode,
  cacheOption, initImage, strength, refImages, mask`. In order:
  1. Defaults: caller value, then the model's defaults over its
     [family scaffold](ImageFamilyScaffold.md), then 512x512, 20 steps, cfg 7,
     `euler`. cfg and seed accept 0; seed is `null` when not a number; the
     prompt gets the scaffold's prefix and suffix.
  2. `qwen-image-edit` snaps to a native size unless `snapNative === false`
     (`status { phase: 'native-resolution', from, to }`).
  3. Alignment to `constraints.dimensionMultiple` (`status { phase: 'grid-aligned', from, to }`).
  4. With references, [EditProfiles](../prompt/EditProfiles.md)`.applyEditProfile` rewords the prompt.
  5. Sigma nodes (caller's, else the model's) become
     [FlowSchedule](../FlowSchedule.md) sigmas when the caller passed nodes, named
     no step count, or named the node count; steps become `sigmas - 1`. With no
     nodes, the model's `fixedSigmas` (a checkpoint's own final grid) run
     unshifted under the same step-count rule, so a speed LoRA's nodes win.
  6. Families with `presizeRefs` presize the references (refArea: caller, model,
     profile; grid: the model's, else 32); a fully sized result sends
     `refImageArgs: 'resize_before_vae=false'`. A family whose edit profile sets
     `refMaxPixels` (MiniMax-H3-Image: 1 MP) sends that as `refMaxPixels` on a
     request with references, else `null`.
  7. LoRAs via [ImageLoraSpecs](ImageLoraSpecs.md) (a caller array, even `[]`,
     replaces the model's), cache mode and option, and `strength` (only with an
     init image; default 0.75, clamped to [0, 1]).
- `ImageRequestPlanner.metaFields(plan)` returns the resolved values the `meta`
  event reports (`sigmas`, `loras` as `path@multiplier`, `refSizes` and
  `outputSize` as `WxH`).
- Render floor step (after grid alignment): for a request with no init image
  or mask, on a model whose `constraints.minRenderPixels` is above the canvas
  area (MiniMax-H3-Image: 4 MP), [ImageCanvas](ImageCanvas.md)
  `raiseToMinArea` enlarges the canvas with a `render-floor` status and
  `outputSize` holds the size asked for. It covers generations and reference
  edits alike.
- Edit render step (after the render floor): for a request with references and
  no init image or mask, on a family whose edit profile sets `renderScale`
  (MiniMax-H3-Image: 1.5, at least 2304x2304, capped at 16 MP), [EditRenderScale](EditRenderScale.md)
  sizes the render from the first reference's own pixel size (the picture
  being edited) and the canvas is enlarged with an `edit-render-enlarged`
  status. `outputSize` stays the size first asked for when the floor already
  raised the canvas. img2img and masked edits keep their canvas, because the init image
  and the mask are sized to it.
- Harsh canvas step (after the edit render step): for a request with
  references and an init image, on a family whose edit profile sets
  `harshSides` (MiniMax-H3-Image: sides strictly between 1792 and 2304), the
  init image and the mask are resized to the profile's `renderMinPixels`
  canvas with an `edit-canvas-moved` status and `outputSize` holds the size
  asked for. Left as asked when either picture cannot be resized. The
  constructor's `resize` option replaces the scaler in tests.
- `ImageRequestPlanner.measureRef(ref)` reads `{ width, height }` from a
  reference's PNG or JPEG header (Buffer, base64 or data URL), else `null`.
  The constructor's `measure` option replaces it in tests.

## Why

Every caller (chat, roleplay, a Network Sharing client whose prompt was written
for another model) is covered because the wording and sizing happen on the
resolved model. A caller that names a different step count wants the runtime's
schedule at that count, not the model's nodes. References are sized here
because the runtime would give every one of them the full canvas area.
