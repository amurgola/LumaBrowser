# ImageDimensions

`core/shared/content/ImageDimensions.js`

Reads pixel dimensions from PNG/JPEG headers without decoding, and fits a source
aspect ratio into a pixel-area budget.

## Methods

- `ImageDimensions.read(buf)` returns `{ width, height }` from a PNG IHDR or the
  first JPEG Start-Of-Frame segment, or `null` for anything else (non-Buffer,
  under 24 bytes, unknown format, zero dimension, corrupt JPEG segment).
- `ImageDimensions.fitToBudget({ srcWidth, srcHeight, budgetWidth, budgetHeight, multiple = 16 })`
  returns `{ width, height }` with the source's aspect and an area close to
  `budgetWidth * budgetHeight`, each side rounded to the nearest `multiple`
  (never below one `multiple`). Returns `null` if any input is not positive.

## Why

Used by the chat bridge (edit_image canvas sizing), the video router (I2V frame
aspect) and image reference sizing, without pulling in an image library.

The area is what bounds compute and VRAM, so a portrait source gets a portrait
canvas of the same cost instead of being squashed into the landscape default.
Video models want `/16` (VAE `/8` then 2x2 patchify); the video router passes
the model's own `dimensionMultiple` so the fit lands on its grid inside the
budget rather than being aligned up past it later.
