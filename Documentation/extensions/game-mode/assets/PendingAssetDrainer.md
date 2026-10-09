# PendingAssetDrainer

`extensions/game-mode/assets/PendingAssetDrainer.js`

Generates the assets queued during a turn after the turn ends (the mode's postProcess), replacing placeholders, inside one exclusive-image window and grouped by model.

## Methods

- `drain({ context, s, emit })`: no queue is a no-op; no image stack marks every queued asset `placeholder`; otherwise each job ends `done`, `placeholder` (render failed) or `error` (write failed), with a game:state after each.
