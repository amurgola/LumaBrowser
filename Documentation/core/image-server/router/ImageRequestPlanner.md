# ImageRequestPlanner

`core/image-server/router/ImageRequestPlanner.js`

Resolves one image request against its model record into the exact parameters
the adapter receives.

## Methods

- `new ImageRequestPlanner({ lorasDir?, presize? })`; `presize` defaults to
  [RefImagePresizer](../RefImagePresizer.md)`.presize`.
- `plan({ request, model, send? })` returns `{ params, refCount, refSizes }`.
  `params` holds `prompt, negativePrompt, width, height, steps, cfgScale,
  sampler, scheduler, seed, loras, customSigmas, refImageArgs, cacheMode,
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
     no step count, or named the node count; steps become `sigmas - 1`.
  6. Families with `presizeRefs` presize the references (refArea: caller, model,
     profile; grid: the model's, else 32); a fully sized result sends
     `refImageArgs: 'resize_before_vae=false'`.
  7. LoRAs via [ImageLoraSpecs](ImageLoraSpecs.md) (a caller array, even `[]`,
     replaces the model's), cache mode and option, and `strength` (only with an
     init image; default 0.75, clamped to [0, 1]).
- `ImageRequestPlanner.metaFields(plan)` returns the resolved values the `meta`
  event reports (`sigmas`, `loras` as `path@multiplier`, `refSizes` as `WxH`).

## Why

Every caller (chat, roleplay, a Network Sharing client whose prompt was written
for another model) is covered because the wording and sizing happen on the
resolved model. A caller that names a different step count wants the runtime's
schedule at that count, not the model's nodes. References are sized here
because the runtime would give every one of them the full canvas area.
