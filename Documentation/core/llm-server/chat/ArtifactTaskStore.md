# ArtifactTaskStore

`core/llm-server/chat/ArtifactTaskStore.js`

Scheduled artifact tasks (`llm_artifact_tasks`) and their runs
(`llm_artifact_task_runs`): a recurring background agent run that refreshes
one live artifact's saved data, e.g. "every 30 min pull the BTC price and
update the widget". ArtifactTaskScheduler drives execution. Extends
[IntervalTaskStore](IntervalTaskStore.md).

## Declarations

- Owner: `rootId` (`root_id`), the target artifact chain. Create errors:
  `a task needs the target artifact rootId`, `a task needs a prompt`.
- Interval 5 min .. 24 h, default 30 min. Default title `Scheduled update`.
- Ids `atask_...` and `atrun_...`.
- Task extra: `modelRef` (`model_ref`), cleared by a falsy patch value.
- Run outcome: `summary`, capped at 500 chars. Run pages default to 20.

## Extra methods

- `listByRoot(rootId)`: the chain's tasks, newest first.
- `deleteByRoot(rootId)`: every task of the chain and their run rows; returns
  the number of tasks removed. Used by the artifact delete paths and
  [ConversationArtifactPurge](ConversationArtifactPurge.md).
