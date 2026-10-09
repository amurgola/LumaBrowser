# ConversationArtifactPurge

`core/llm-server/chat/ConversationArtifactPurge.js`

The artifact cascade for conversation deletion.

## Methods

- `new ConversationArtifactPurge({ conversationId, artifactStore,
  artifactDataStore?, artifactTaskStore?, pinnedRootIds? })`
- `execute()` returns `{ purged: rootId[], kept: rootId[] }`. Every chain from
  `artifactStore.list(conversationId)` is deleted (data, then tasks, then
  `deleteRoot`), except chains whose root id is in `pinnedRootIds`, which are
  reparented with `reparent(rootId, { conversationId: null, messageId: null })`.
  A chain counts as purged only when `deleteRoot` returned more than 0. Returns
  empty lists without a conversation id or an artifact store.

## Why

`ChatStore.deleteConversation` only cascades messages and mode meta. Artifact
chains live in their own tables (`llm_artifacts`, `llm_artifact_data`,
`llm_artifact_tasks`) and would otherwise orphan with their full content,
base64 images and videos included.

A live module pinned to the Dashboard outlives its chat: the widget is a
standing surface, not chat scrollback, so it keeps its saved data and scheduled
tasks and is merely unowned.

Data and tasks are deleted before the chain because resolving their root needs
the artifact rows `deleteRoot` drops (the same order as the deleteRoot IPC).

Per-chain failures are swallowed: a locked file or missing row must never block
the delete the user asked for, and re-running the purge is harmless.
