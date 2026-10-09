# RunTranscript

`core/llm-server/chat/schedulers/RunTranscript.js`

The hidden conversation a background run is recorded in (the bridge never
writes `llm_messages`, so the runner does), and the retention rule that
deletes old transcripts while run rows are kept forever.

## Methods

- `RunTranscript.open(chatStore, { title, label, modelRef })`: creates a
  hidden, tools-on conversation titled `<title> <label> YYYY-MM-DD HH:MM`
  (`run` for tasks, `fire` for triggers).
- `conversationId`, `conversation`.
- `addUser(content)`; `addAssistant(result, modelRef)` with a
  [CapturedBridgeRun](CapturedBridgeRun.md) result (content, error text,
  `toolCalls: { tools, artifacts: [] }`).
- `RunTranscript.errorText(error)`: the message, or null.
- `RunTranscript.keepCount(settingsDb, key)`: a non-negative integer setting,
  else `DEFAULT_KEEP` (20).
- `RunTranscript.prune(store, ownerId, keep, chatStore)`: deletes the
  conversations `store.pruneTranscripts` releases; never throws.
