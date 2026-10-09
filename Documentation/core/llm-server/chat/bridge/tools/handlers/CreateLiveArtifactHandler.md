# CreateLiveArtifactHandler

`core/llm-server/chat/bridge/tools/handlers/CreateLiveArtifactHandler.js`

`create_live_artifact`: stores an interactive module rendered inline. A
[ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: `html`, `js`, `libs` from the params (a lone
  `content` document is unwrapped by
  [LiveHtmlUnwrapper](../artifacts/LiveHtmlUnwrapper.md)); neither html nor js
  -> `NO_CONTENT`; a fatal JS error is refused before persisting. Stores type
  `live` with JSON content (title default `Live module`), publishes the
  artifact with its spec, and returns the "It's DONE" message with the lint note.
- `NO_CONTENT`, `DEFAULT_TITLE`.
