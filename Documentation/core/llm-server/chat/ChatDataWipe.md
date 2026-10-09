# ChatDataWipe

`core/llm-server/chat/ChatDataWipe.js`

"Clear conversations & artifacts" (LLM Setup > Advanced > Data).

## Methods

- `new ChatDataWipe({ settingsDb, dashboardService?, artifactStore? })`.
  Throws `wipeChatData requires a SettingsDatabase with an open handle`.
- `execute()` returns `{ deleted: { <table>: rows }, files }` after:
  1. emptying every table in `ChatDataWipe.WIPED_TABLES` in one transaction,
     child tables first (scheduled-task runs and tasks, artifact-task runs and
     tasks, artifact data, artifacts, messages, conversation meta,
     conversations). A table no migration has created yet counts 0.
  2. resetting the Dashboard: `setLayout([])` and un-hiding every hidden
     widget. Dashboard failures are ignored.
  3. deleting every `.html` file in `artifactStore.dir` (`files` counts them;
     a locked file is a harmless leftover).
  4. `VACUUM`, best-effort, to give back the space base64 media used.

## Why

Dashboard-pinned live modules are NOT spared, unlike the per-conversation
cascade ([ConversationArtifactPurge](ConversationArtifactPurge.md)), so the
layout and hidden-widget lists are reset too or the grid would point at chains
that no longer exist.

This is database-only by design. It does not go through
`ChatStore.deleteConversation` or `ChatModeRegistry.notifyConversationDeleted`,
so no chat mode's on-disk cleanup runs: Code mode's project folder (a
user-selected directory) and Game mode's game folders are never touched. The
artifacts dir is app-owned (userData), so sweeping it is safe. The settings
table and every non-chat table survive.

The caller (the IPC controller) also wipes traces and spilled tool results
(`LlmTrace.wipeAll`, `ToolResultSpill.wipeAll`).
