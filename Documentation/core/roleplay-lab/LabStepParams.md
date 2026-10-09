# LabStepParams

`core/roleplay-lab/LabStepParams.js`

The image-step parameters the Roleplay Lab shows and lets the user tune.

## Methods

- `LabStepParams.scrub(opts)` copies the scalar params (`modelRef`, `slot`,
  `prompt`, `negativePrompt`, `width`, `height`, `steps`, `cfgScale`, `sampler`,
  `scheduler`, `strength`, `seed`) and replaces image inputs with descriptors:
  `initImage` -> `<N bytes>`, `mask` -> `<mask N bytes>` (decoded base64 size),
  `refImages` -> `K ref image(s)` (non-empty entries).
- `LabStepParams.overlayResolved(params, effective)` writes the router's
  resolved `width`, `height`, `steps`, `cfgScale`, `sampler`, `scheduler`,
  `seed`, `strength` over `params` (skipping null and undefined); returns `params`.
- `LabStepParams.SCALARS`, `LabStepParams.RESOLVED`.

## Why

Big base64 blobs would make the step manifest unreadable; the Lab only needs
to know they were there. The overlay makes a step that left values to model
defaults show the real number instead of a blank field.
