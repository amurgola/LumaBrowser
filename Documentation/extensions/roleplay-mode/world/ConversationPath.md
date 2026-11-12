# ConversationPath

`extensions/roleplay-mode/world/ConversationPath.js`

Reads the conversation's message tree from the app's chat store
(`global.__lumaChatRouter.chatStore`) for the story [timeline](../timeline.md).

## Methods

- `new ConversationPath(store?)`: a chat store or a function returning one.
- `available()`, `tracks(conversationId, messageId)` (the store holds this
  reply in this conversation; false for the Roleplay Lab's synthetic ids),
  `exists(messageId)`.
- `activeMessages(conversationId)`, `ancestors(conversationId, messageId)` (its
  slice of the active path, else its parent links, root first),
  `liveIds(conversationId)` (a Set of every message id, any branch),
  `data(conversationId)` (the stored `meta.data`).

Every read is defensive; without a store the mode runs on the meta it was handed.

`tree(conversationId)` lists every message of the conversation, any branch,
oldest first, as `{ id, role, parentId, active, content }`, and
`message(messageId)` returns one stored message; both serve the turn journal.
