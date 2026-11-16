# TrainingRequest

`extensions/lora-trainer/TrainingRequest.js`

Turns `train_lora` arguments into one checked request.

## Methods

- `parse(args)` -> `{ name, trigger, subject, artifactIds, paths, folder, modelRef, steps, rank, applyWhenDone }`.
  The name becomes a file-safe slug (48 characters), the trigger defaults to the name,
  steps are bounded to 200..10000 and rank to 4..128 (null leaves them to the recipe).
  Throws without a usable name or without any picture source.
- `slug(value)`; `assertEnoughImages(count)` (at least 4; `MAX_IMAGES` is 200).
