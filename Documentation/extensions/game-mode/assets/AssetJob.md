# AssetJob

`extensions/game-mode/assets/AssetJob.js`

The generation job of one prepared asset (prompt, render size, model, output size, pixel grid, transparency, RD Flow 64 and the game palette), and the asset's status mark on the session.

## Methods

- `fromSpec(spec, modelRef)` (carries `rdFlow` and `palette`, `null` when none); `request(job)` the `chat.generateImage` options: `prompt`, `width`, `height`, `modelRef`, and for an RD Flow 64 job also `opaqueBackground` (true when the asset is not transparent) and the game `palette` when there is one, since that model draws the palette and the background itself; `mark(s, rel, status, emit)` records a status and emits game:state. Queueing a render is [AssetRenderQueue](AssetRenderQueue.md)`.enqueue`.
