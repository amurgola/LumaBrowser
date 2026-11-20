# StoredHistory

`core/llm-server/chat/router/StoredHistory.js`

A stored conversation as the chat history a model is sent, for turns the app starts by
itself ([BackgroundTaskTurn](../tasks/BackgroundTaskTurn.md)). The chat page builds the
same list from what it has on screen.

## Methods

- `StoredHistory.messages(chatStore, conversationId)` -> `[{ role, content }]`: the
  active branch's messages (`listActiveMessages`) by role and text, with the empty
  assistant rows (placeholders, tool-only replies) left out; a user row is kept even
  when empty. `[]` when the conversation cannot be read.
