# ChatToolTable

`core/llm-server/chat/bridge/tools/ChatToolTable.js`

The built-in pseudo-tool handlers by name.

## Methods

- `new ChatToolTable(handlers?)`: defaults to one instance of each
  `HANDLER_CLASSES` entry (a test seam).
- `handlerFor(name)`: the [ChatToolHandler](handlers/ChatToolHandler.md) or null.
- `names()`.
- `HANDLER_CLASSES`: Takeover, CreateArtifact, CreateLiveArtifact,
  EditArtifact, WebSearch, SendWebhook, KnowledgeBase, ValidateCode,
  ArtifactData, ScheduleArtifactUpdates, GenerateImage, EditImage, Video, Music.

A built-in name wins over a mode or extension tool of the same name.
