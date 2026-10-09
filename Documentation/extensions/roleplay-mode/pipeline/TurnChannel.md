# TurnChannel

`extensions/roleplay-mode/pipeline/TurnChannel.js`

One assistant turn's outlets: emit, save, progress and the world announcement.

## Methods

- `new TurnChannel({ emit, setMeta, messageId })`; fields `messageId`, `progress`
  ([ReactionProgress](../images/ReactionProgress.md)).
- `emit(type, payload)`, `save(data)` (propagates), `trySave(data)` (swallows),
  `announceWorld(data, { newCharIds, newSceneId, sceneChanged })`.
