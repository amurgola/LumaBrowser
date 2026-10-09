# AssetJob

`extensions/game-mode/assets/AssetJob.js`

The generation job of one prepared asset (prompt, render size, model, output size, pixel grid, transparency), the shape queued on `session.pendingAssets`.

## Methods

- `fromSpec(spec, modelRef)`; `queue(s, spec, modelRef)` pushes the job and marks the asset pending; `request(job)` the `chat.generateImage` options; `mark(s, rel, status, emit)` records a status and emits game:state.
