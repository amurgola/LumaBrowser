# ConversationMeta

`extensions/game-mode/ConversationMeta.js`

Reads a conversation's persisted setup (`meta.data`) and model pin straight from the chat store, for code that runs outside a chat turn (routes, play-time AI calls).

## Methods

- `new ConversationMeta(getRouter?)` (default `() => global.__lumaChatRouter`).
- `dataFor(conversationId)` `chatStore.getMeta(id).data`, or `{}` on any failure.
- `modelRefFor(conversationId)` `chatStore.getConversation(id).modelRef`, or undefined.
