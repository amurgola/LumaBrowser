# AssetSweepPlanner

`extensions/roleplay-mode/pipeline/AssetSweepPlanner.js`

Plans a turn's image work from world state so failed renders are rescheduled.

## Methods

- `AssetSweepPlanner.plan(data, { newCharIds, newSceneId })` ->
  `{ sceneArtId, faceIds, outfitBackfills }`; at most `FACE_CAP` (3) backfilled faces.
