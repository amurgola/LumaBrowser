# TurnConversation

`core/llm-server/chat/router/TurnConversation.js`

The conversation side of starting a chat turn.

## Methods

- `new TurnConversation({ chatStore, llmServerService })`.
- `open({ conversationId, regenerateMessageId, editMessageId, userMessage, messages, modelRef, agentMode, disabledTools, choicesEnabled })`: `{ convId }` or `{ error }` (`Message to regenerate was not found.`, `Message to edit was not found.` when the edit target is missing or not a user message, `Conversation x not found`). A regeneration's or edit's target message owns the conversation; no id creates one titled by `ConversationTitle.fromText`, carrying `toolsEnabled`, `disabledTools` (array or null) and `choicesEnabled` (boolean or null).
- `syncTools(convId, agentMode)` (never throws).
- `rememberDocsSource(convId, on)`: the "@lumabrowser-documentation" pill, a boolean on every chat-UI turn, kept in the conversation meta as `data.docsSources` (`['lumabrowser-documentation']` or `[]`) with the rest of the meta data preserved; written only when it changes, left alone when the caller sends no boolean (scheduled runs, older clients); never throws. See [DocsSourceGrant](DocsSourceGrant.md).
- `resolveChoices(convId, choicesEnabled)`: persists a boolean and returns it; otherwise the row's value, NULL as off.
- `addUserMessage(convId, userMessage, modelRef, regenerating, editMessageId?)`: the row, or null when regenerating or empty. With `editMessageId` the new wording is added as a variant of that prompt (`startVariant`: same group, parent and slot), so the edit is a branch with its own reply.
- `rememberModel(convId, ref)`: conversation and `setLastModelRef`. `pinModel(convId, ref)`: conversation only.

## Why

The renderer's conversation id can be stale or wrong during a regeneration, which landed variants elsewhere or spawned duplicate rows. A mode's model pin must not change the default for new plain chats.
