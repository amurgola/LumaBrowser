# WorldDelta

`extensions/roleplay-mode/stage/WorldDelta.js`

What one turn's reconciliation changed.

## Methods

- Fields `changed`, `newCharIds`, `newSceneId`, `sceneChanged`, `pendingOutfits`.
- `addCharacter(data, fields)` pushes a blank character with an id and seed,
  stamped `origin: 'story'`: one the story introduced, not the player
  ([CastRole](../world/CastRole.md) tells walk-ons from the cast by it).
- `announcement()` the `mode:world` extras.
