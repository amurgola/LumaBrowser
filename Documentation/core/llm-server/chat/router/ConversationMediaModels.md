# ConversationMediaModels

`core/llm-server/chat/router/ConversationMediaModels.js`

One conversation's own image, edit and video model, kept in its meta
(`data.mediaModels`, `{ image?, edit?, video? }` of image model ids). The media
tools of every run in that conversation render on them instead of the Setup
defaults. A job the conversation never picked is absent and follows Setup.

## Methods

- `new ConversationMediaModels(store, conversationId)`: `store` a ChatStore
  (`getMeta`, `setMeta`).
- `read()`: the stored picks through
  [ImageModelPicks](../../../image-server/router/ImageModelPicks.md)`.normalize`;
  `{}` when nothing is stored, there is no store, or the read throws.
- `save(picks)`: replaces the stored picks (an empty object clears them) and
  keeps the rest of the meta data. An unchanged set writes nothing. Throws what
  the store throws; [TurnConversation](TurnConversation.md) swallows it.
- `usable(imageServerService)`: resolves the stored picks whose model is still
  installed for its job (`listInstalledModels()` through
  `ImageModelPicks.installedOnly`). With no picks the installed models are not
  listed at all. No image service, or one that fails, applies no pick. Never
  rejects.
- `META_KEY` (`mediaModels`).

## Flow

1. The gear panel's rows
   ([MediaModelChoice](../../ui/js/chat/composer/MediaModelChoice.md)) put the
   picks on every chat turn (`mediaModels`,
   [TurnFlags](../../ui/js/chat/stream/TurnFlags.md)) and write them straight
   onto an open conversation's meta.
2. [ChatTurn](ChatTurn.md) hands the turn's picks to
   `TurnConversation.rememberMediaModels`, which saves them here. That is how a
   landing chat's pick, made before the conversation row exists, is stored.
3. [BridgeRun](../bridge/BridgeRun.md) gives every built-in tool handler
   `ctx.mediaModels()`, which resolves `usable(...)` fresh on each call, and
   passes the same picks to [ImagePromptHint](../bridge/prompt/ImagePromptHint.md).
4. `generate_image`, `edit_image`, `generate_video` and `animate_image` run on
   the pick for their job.

## Why

The meta is the one place the picks live, so a run that sends no flags (a
regeneration from an older client, a scheduled run in the conversation) still
uses them. Checking against the installed models at use means a model removed
in Setup falls back to the default instead of failing the tool call with "not
found".
