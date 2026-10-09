# MessageStore

`core/network-sharing/webapp/public/js/store/MessageStore.js`

Messages embedded in their conversation record. Every write is one
read-modify-write of that record that bumps its `updatedAt`.

## Methods

- `new MessageStore(repo)`.
- `list(conversationId)`: the messages, `[]` for an unknown conversation.
- `add(conversationId, msg)`: fills `id` (`m_...`), `conversationId`,
  `createdAt`; creates the conversation under that id when missing. The first
  user line names a conversation still titled `New chat` (whitespace collapsed,
  60 characters); an assistant message with `modelRef` sets the conversation's
  `modelRef` and `provider`. Resolves the stored message.
- `update(conversationId, messageId, patch)`: the patched message, or `null`.
- `delete(conversationId, messageId)`, `clear(conversationId)`.
- `truncateFrom(conversationId, messageId)`: drops that message and every later
  one (regenerate); an unknown id changes nothing.
