# StageReconciler

`extensions/roleplay-mode/stage/StageReconciler.js`

Applies the stage call's decisions to the working data.

## Methods

- `StageReconciler.apply(data, ex, delta)` new characters join (known ones get
  blank looks backfilled), the location switches to a known scene or creates one
  (when new, or when there are no scenes), the present cast becomes the moment
  state with outfit, layers and accessories, queueing outfit bodies through
  [OutfitWardrobe](../pipeline/OutfitWardrobe.md).
