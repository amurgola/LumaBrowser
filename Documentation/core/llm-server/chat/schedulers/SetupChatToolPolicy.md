# SetupChatToolPolicy

`core/llm-server/chat/schedulers/SetupChatToolPolicy.js`

The tools a background run of a setup conversation gets: the full
[AgentToolCatalog](../../../llm-service/AgentToolCatalog.md) minus the global
denylist (`core.chat.disabledAgentTools`), the conversation's gear-panel
`disabledTools` and `ALWAYS_DENIED` (`schedule_artifact_updates`: a background
run must not mint more recurring work). A run sees exactly what a turn typed
into that chat would see.

## Methods

- `new SetupChatToolPolicy({ settingsDb, getRouter })`; the conversation is
  read from `getRouter().chatStore`.
- `denySet(conversationId)`: `{ conversation, denied: Set }`.
- `runConfig(conversationId, deps)`: `{ modelRef, allowedTools }`;
  `allowedTools` is null when the catalog cannot be read (the run is then
  unrestricted, as in legacy).
- `describe(conversationId, deps)`: `[{ id, label, description, tools: [{ name,
  label, description }] }]` with catalog descriptions for dynamic tools; empty
  groups are left out; null without deps. The setup chats list these so the
  model writes run prompts that name real tools (without it the setup model
  asked for ClickUp credentials while a ClickUp tool sat enabled).

Used by [ScheduledTaskScheduler](../ScheduledTaskScheduler.md) and
[TriggerRunConfig](../trigger-runner/TriggerRunConfig.md).
