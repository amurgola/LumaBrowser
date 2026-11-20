# PendingQueue

`core/llm-server/ui/js/chat/pending/PendingQueue.js`

The messages waiting to be sent, per conversation and in the order they were written,
with a hold per conversation. Plain data: no DOM, no API.

## Methods

- `add(conversationId, staged)`: returns the queued item, `{ id, ...staged }` (`staged`
  is what [TurnSender](../stream/TurnSender.md)`.takeStaged` returns: `text`,
  `attachments`, `context`).
- `list(conversationId)`.
- `remove(conversationId, itemId)`: the item taken out, or null.
- `shift(conversationId)`: the oldest item taken out, or null.
- `hold(conversationId)`, `release(conversationId)`, `isHeld(conversationId)`.

Used by [PendingMessages](PendingMessages.md).
