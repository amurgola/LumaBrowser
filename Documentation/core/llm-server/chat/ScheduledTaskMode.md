# ScheduledTaskMode

`core/llm-server/chat/ScheduledTaskMode.js`

The core `scheduled-task` chat mode: a conversation that defines, tests and
later edits one recurring background agent run, stored in
[ScheduledTaskStore](ScheduledTaskStore.md). Registered in
[ChatModeRegistry](ChatModeRegistry.md) at boot next to the scheduler wiring
(core mode, no owning extension).

## Methods

- `new ScheduledTaskMode({ taskStore, getScheduler, getChatStore?, emitEvent?, registry? })`.
  Throws `ScheduledTaskMode requires a taskStore`. `getScheduler` and
  `getChatStore` are late-bound getters that may return null (the store exists
  at boot, the scheduler needs the agent runtime). `registry` defaults to
  `ChatModeRegistry.shared`.
- `register()` registers `descriptor()` and returns the mode; `unregister()` removes it.
- `descriptor()`: `{ id: 'scheduled-task', label: 'Scheduled Task', icon, description,
  requirements: ['llm'], launcher: 'sidebar', agent: true, buildTurn }`.
- `buildTurn({ conversationId })` returns `{ systemPrompt, temperature: 0.3,
  agent: true, tools, allowedTools, noBrowser: true }`. The prompt is
  [ScheduledTaskPrompt](scheduled-task/ScheduledTaskPrompt.md) with the
  conversation's task and the scheduler's `describeRunTools(conversationId)`
  (null, so no tool list, when the scheduler is missing or throws). The tools
  are [ScheduledTaskTools](scheduled-task/ScheduledTaskTools.md), and
  `allowedTools` pins the turn to exactly them.

## Why

The setup conversation stays the task's live config: the model in its model
pill and the tools in its gear panel are what every run uses (the scheduler
reads them per run). `agent: true` makes the UI start these chats with Tools
on. Pinning the setup turn to its own tools stops a local model wandering off
into artifacts or browsing before setup is done; the runs get the full
configured toolset, never these setup tools.
