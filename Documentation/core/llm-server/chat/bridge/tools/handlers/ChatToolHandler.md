# ChatToolHandler

`core/llm-server/chat/bridge/tools/handlers/ChatToolHandler.js`

Base class for the chat agent's built-in pseudo-tools.

## Methods

- `names()`: the tool names it answers (throws unless overridden).
- `execute(name, params, ctx)`: resolves the `{ success, ... }` result the model
  reads (throws unless overridden). `ctx`, one per run: `{ conversationId,
  assistantMessageId, deps, hooks, artifacts, isAborted(), ctxPerSlot, kbScope,
  webSession, webTabRender, allowTakeover, takeoverWait, mediaModels() }`.
- `ChatToolHandler.publish(ctx, artifact)`: pushes onto the run's artifacts and
  fires `hooks.onArtifact`.
- `ChatToolHandler.mediaModels(ctx)`: resolves the conversation's own model per
  media job, `{ image?, edit?, video? }`
  ([ConversationMediaModels](../../../router/ConversationMediaModels.md)); `{}`
  for a run whose context carries none. The image, edit and video handlers
  render on these instead of the Setup defaults.

Subclasses: [TakeoverHandler](TakeoverHandler.md),
[CreateArtifactHandler](CreateArtifactHandler.md),
[CreateLiveArtifactHandler](CreateLiveArtifactHandler.md),
[EditArtifactHandler](EditArtifactHandler.md), [WebSearchHandler](WebSearchHandler.md),
[SendWebhookHandler](SendWebhookHandler.md), [KnowledgeBaseHandler](KnowledgeBaseHandler.md),
[ValidateCodeHandler](ValidateCodeHandler.md), [ArtifactDataHandler](ArtifactDataHandler.md),
[ScheduleArtifactUpdatesHandler](ScheduleArtifactUpdatesHandler.md),
[GenerateImageHandler](GenerateImageHandler.md), [EditImageHandler](EditImageHandler.md),
[VideoHandler](VideoHandler.md), [MusicHandler](MusicHandler.md).
