# ConversationDeletion

`core/llm-server/ipc/ConversationDeletion.js`

Deletes a conversation and everything that hangs off it.

## Methods

- `new ConversationDeletion({ llmServerService, deps, schedTasks, triggers, workspaceFiles, modeRegistry?, spill?, trace? })`
  (defaults `ChatModeRegistry.shared`, `ToolResultSpill`, `LlmTrace`).
- `delete(id)` returns `{ success }` from `chatStore.deleteConversation(id)` after,
  in order and each best effort:
  1. the scheduled tasks and triggers this conversation set up (`deleteOwnedBy`);
  2. its artifact chains (`ConversationArtifactPurge`): dashboard-pinned chains are
     reparented, the rest purged with their data and scheduled tasks;
  3. its chat mode's own state (`notifyConversationDeleted(meta)`);
  4. its spilled tool results (app-owned and workspace-rooted) and its LLM trace.

## Why

The artifact purge needs the conversation's rows and the workspace spill needs
the mode's root, which resolves only while the meta row exists, so all of it
runs before the delete. The delete the user asked for never fails on cleanup.
