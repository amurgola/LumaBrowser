# ArtifactStreamPreview

`core/llm-server/chat/bridge/turn/ArtifactStreamPreview.js`

Pushes a partially streamed create_artifact document into the side panel.

## Methods

- `new ArtifactStreamPreview(hooks, allows, { now })`.
- `onBuffer(buf)`: only with `onArtifactStream`, a buffer up to 200000
  characters, `create_artifact` allowed and mentioned. Emits `open` once,
  then `chunk` `{ title, type, content }` at most every 140 ms.
