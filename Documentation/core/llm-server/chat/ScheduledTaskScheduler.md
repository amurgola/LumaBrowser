# ScheduledTaskScheduler

`core/llm-server/chat/ScheduledTaskScheduler.js`

Runs chat scheduled tasks ([ScheduledTaskStore](ScheduledTaskStore.md)):
recurring background agent runs the user defined in the `scheduled-task` chat
mode. Extends [IntervalTaskScheduler](schedulers/IntervalTaskScheduler.md).
Each run's model and tools come live from the task's setup conversation
([SetupChatToolPolicy](schedulers/SetupChatToolPolicy.md)), so the user
configures a task's runs exactly like a normal chat through the gear panel.

## Methods

- `new ScheduledTaskScheduler({ taskStore, settingsDb, getAgentDeps, getRouter,
  emitEvent?, gate?, bridgeFactory?, now? })`.
- `start()`, `stop()`, `tick()` (run kind `scheduled`), `runNow(taskId)` (kind
  `manual`; a paused task refuses with `task is paused`) from the base.
- `runInline(taskId, { kind = 'test' })`: the creation flow's test run. Called
  from a mode tool while the setup chat's own turn is streaming, so it skips the
  streaming-chat guard; still refuses while any background run is in flight.
  Returns `{ success, run }` or `{ success: false, error }`.
- `describeRunTools(conversationId)`: the run's tools grouped like the gear
  panel (see SetupChatToolPolicy), null until the agent runtime is up. The
  setup chat lists these so the model names real tools.

## Declarations

Gate owner `scheduled-tasks`; keep key `core.scheduledTasks.keepTranscripts`;
message ids `stask-msg-<taskId>`; first tick 7 s after `start()`; outcome
field `response`. Run rows and events carry `kind`. The preamble reads
`TEST RUN of the scheduled task ...` for tests, else `SCHEDULED BACKGROUND RUN
of the task ...`, and asks for a self-contained final report.
