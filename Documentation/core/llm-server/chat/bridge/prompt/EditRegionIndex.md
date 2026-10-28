# EditRegionIndex

`core/llm-server/chat/bridge/prompt/EditRegionIndex.js`

The edit regions a conversation's earlier turns recorded
(`toolCalls.editRegions` on user rows), by id and by the image they were
painted on, with the ones from the newest user message marked as current.

## Methods

- `EditRegionIndex.collect(priorMessages)`: rows in message order, each with
  `current: true` when it sits on the last user message (the turn being
  answered). Junk rows (no id or artifact id) are skipped.
- `get(id)`, `list()` (oldest first), `forArtifact(artifactId)`,
  `currentFor(artifactId)` (the last current region on that image, or null:
  an older region never sticks to an image silently), `size`.

## Why

Built once per run in `BridgeRun#_toolContext` as `ctx.editRegions`, so
`edit_image` resolves a region without reaching for the chat store, and the
sharing proxy's synthetic prior messages need nothing new.
