# AssetSweepPlanner

`extensions/roleplay-mode/pipeline/AssetSweepPlanner.js`

Plans a turn's image work from world state so failed renders are rescheduled.

## Methods

- `AssetSweepPlanner.plan(data, { newCharIds, newSceneId })` ->
  `{ sceneArtId, faceIds, outfitBackfills }`; at most `FACE_CAP` (3) backfilled faces.
  Outfit bodies are backfilled only when `drawsFigures(data)`.
- `AssetSweepPlanner.drawsFigures(data)` true with `options.autoImage` or
  `options.autoAvatarArt`, the two options that show an outfit body. With both
  off every present character's outfit record still asked for a render after
  every reply: the reaction opened the exclusive image window (on a one-card
  machine that stops the language model), found no figure to dress and wrote
  a failure to the retry ledger.
