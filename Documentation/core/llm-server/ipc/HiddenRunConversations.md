# HiddenRunConversations

`core/llm-server/ipc/HiddenRunConversations.js`

Deletes the hidden run-transcript conversations a scheduled task or trigger owns.

## Methods

- `new HiddenRunConversations({ llmServerService, modeRegistry? })` (default `ChatModeRegistry.shared`).
- `purge(conversationIds)` for each id: tells its chat mode
  (`notifyConversationDeleted(meta)`), then deletes the conversation. Each step is
  best effort; a null list is fine.
