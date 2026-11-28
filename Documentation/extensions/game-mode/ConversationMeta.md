# ConversationMeta

`extensions/game-mode/ConversationMeta.js`

Reads a conversation's persisted setup (`meta.data`) and model pin straight from the chat store, and stores its game snapshot there, for code that runs outside a chat turn (routes, play-time AI calls, renders that end after the reply).

## Methods

- `new ConversationMeta(getRouter?)` (default `() => global.__lumaChatRouter`).
- `dataFor(conversationId)` `chatStore.getMeta(id).data`, or `{}` on any failure.
- `modelRefFor(conversationId)` the game's own language model (`meta.data.llmModel`, the setup form's pick or a later pick in the gear) when it is a string with more than whitespace in it (trimmed), else `chatStore.getConversation(id).modelRef`, or undefined.
- `saveGame(conversationId, game)` writes `game` as `meta.data.game` through `chatStore.setMeta`, keeping the rest of `data`; returns whether it was written (false without a store, without `setMeta`, or when the write throws).
