# CreateArtifactHandler

`core/llm-server/chat/bridge/tools/handlers/CreateArtifactHandler.js`

`create_artifact`: stores a document, code file, SVG or page shown in the
docked side panel. A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: `artifactStore.create({ conversationId,
  messageId, title, type, language, content })`, publishes it and returns
  `{ success: true, artifact, message }` with the
  [ArtifactValidation](../artifacts/ArtifactValidation.md) code note; a throw
  reads `create_artifact failed: <message>`.
