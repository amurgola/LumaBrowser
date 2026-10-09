# ArtifactTaskScheduler

`core/llm-server/chat/ArtifactTaskScheduler.js`

Runs scheduled artifact tasks ([ArtifactTaskStore](ArtifactTaskStore.md)):
recurring background agent runs that refresh a live artifact's saved data so
its widget updates without the user asking. Extends
[IntervalTaskScheduler](schedulers/IntervalTaskScheduler.md).

## Methods

- `new ArtifactTaskScheduler({ taskStore, artifactDataStore?, settingsDb,
  getAgentDeps, getRouter, emitEvent?, gate?, bridgeFactory?, now? })`.
- `start()`, `stop()`, `tick()`, `runNow(taskId)` from the base. A disabled
  task refuses with `task is disabled`.
- `ArtifactTaskScheduler.SCHEDULED_RUN_TOOLS`: the fixed allow-list (web search,
  the artifact data tools, browser read and navigation tools). Deliberately
  absent: creating or editing artifacts, images, video,
  `schedule_artifact_updates` and code tools, so a task cannot replicate itself.

## Declarations

Gate owner `artifact-tasks`; keep key `core.artifactTasks.keepTranscripts`;
message ids `atask-msg-<taskId>`; first tick 5 s after `start()`; outcome
field `summary`. The run uses the task's own `modelRef`. Events carry
`rootId`. The run preamble names the widget and its artifact id and, when the
data store can read the chain, its saved keys (up to 32) or "The widget has no
saved data yet."
