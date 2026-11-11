# ConversationCheckpoint

`core/llm-server/chat/bridge/ConversationCheckpoint.js`

Where a conversation's compaction checkpoint lives: the `compactionCheckpoint`
entry of its meta data (`llm_conversation_meta.data`), read and written for
the agent run's [CompactionCheckpoint](../../agent/CompactionCheckpoint.md).

## Methods (all static)

- `storeFor(chatStore, conversationId)`: the `{ load, save }` pair for one
  conversation; null without a store, an id, or `getMeta`/`setMeta`.
  `load()` returns the stored entry or null. `save(entry)` reads the meta
  data and writes it back with the entry in one synchronous step, so the
  other writers of the meta data (the tool groups) are kept; a conversation
  with no stored row (the sharing proxy's throwaway `web_*` ids) is skipped.
- `META_KEY`: `'compactionCheckpoint'`.

[BridgeRun](BridgeRun.md) passes the pair as the run's `compactionCheckpoint`
on native-history turns.
