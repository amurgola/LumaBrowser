# ScheduleArtifactUpdatesHandler

`core/llm-server/chat/bridge/tools/handlers/ScheduleArtifactUpdatesHandler.js`

`schedule_artifact_updates`: a recurring task that refreshes a live widget's
data. A [ChatToolHandler](ChatToolHandler.md).

## Methods

- `execute(_, params, ctx)`: needs `deps.artifactTaskStore`, an artifact id,
  `prompt` and `everyMinutes` (aliases `every_minutes`, `minutes`; the error
  names the `ToolSchemas` bounds); the root id comes from
  `artifactDataStore.resolveRootId`. Creates the task and returns `{ success,
  taskId, everyMinutes, nextRunAt, message }`; a throw reads
  `schedule_artifact_updates failed: <message>`.
