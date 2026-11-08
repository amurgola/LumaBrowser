# TurnChannel

`extensions/roleplay-mode/pipeline/TurnChannel.js`

One assistant turn's outlets: emit, save, progress, the reply's activity, its
point on the story [timeline](../timeline.md) and the world announcement.

## Methods

- `new TurnChannel({ emit, setMeta, messageId, conversationId, scope, paths })`;
  fields `messageId`, `conversationId`, `scope` ([ReactionScope](ReactionScope.md)),
  `paths` (a [ConversationPath](../world/ConversationPath.md) that tracks this
  reply, or null), `phase`, `activity` ([TurnActivity](TurnActivity.md)),
  `progress` ([ReactionProgress](../images/ReactionProgress.md), labels stamped
  with the phase; world-phase labels also become activity steps).
- `beginWorld()`, `beginImages()`: the phase (the scope's too).
- `commit(data, before)`: the reply's changes since `before` (a snapshot) close
  the activity and the head is recorded as the reply's point. Returns the changes.
- `guard()`: throws the scope's stop, or stops it as `deleted` when the reply no
  longer exists.
- `save(data)` (propagates): guards, re-records the point after the commit, and
  with `paths` stores `Timeline.mergeForSave` of the freshly stored data instead
  of overwriting it. `trySave(data)` (swallows).
- `emit(type, payload)`, `announceWorld(data, { newCharIds, newSceneId,
  sceneChanged })`: `mode:world` with the head last stored (the active path's),
  `story`, `headId` and `timelineEntry { id, entry }`.
