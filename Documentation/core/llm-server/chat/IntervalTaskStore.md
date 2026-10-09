# IntervalTaskStore

`core/llm-server/chat/IntervalTaskStore.js`

Base class for stores of recurring background agent tasks and their run
history. Each subclass owns a task table scanned by `next_run_at` on the
scheduler's tick and a run table whose rows are kept forever while their
transcript conversations are pruned. The store only owns state; a scheduler
drives execution.

## Declarations

Subclasses declare statics instead of overriding methods; the constructor
throws `<Class> must declare ...` when one is missing.

| static | meaning |
|---|---|
| `TASK_TABLE`, `RUN_TABLE` | table names |
| `TASK_ID_PREFIX`, `RUN_ID_PREFIX` | [RecordId](../../database/RecordId.md) prefixes |
| `MIN_INTERVAL_MS` (5 min), `MAX_INTERVAL_MS`, `DEFAULT_INTERVAL_MS` | interval clamp and the value for non-numeric input |
| `DEFAULT_TITLE` | title for a blank one |
| `DEFAULT_RUN_LIMIT` (20), `MAX_RUN_LIMIT` (200), `DEFAULT_KEEP_TRANSCRIPTS` (20) | paging and retention |
| `OWNER` | `{ column, field, missing }`: what a task belongs to and the create error without it |
| `MISSING_PROMPT` | the create error without a prompt |
| `OUTCOME` | `{ column, field, maxChars }`: the run's persisted outcome text |
| `TASK_EXTRAS`, `RUN_EXTRAS` | extra columns `[{ column, field, fallback }]` |

Table and column names come only from these declarations; every value is a
bound parameter.

## Methods

- `new Store({ settingsDb })` borrows the open handle (`StoreHandle.requireOpen`).
- `Store.clampInterval(ms)`, `Store.newTaskId()`, `Store.newRunId()`.
- `create(input)`: needs the owner field and a prompt (trimmed non-empty).
  The first run is due one interval from now; `enabled: false` (or any falsy
  value other than `undefined`) creates it disabled with no `next_run_at`.
- `get(id)`, `list()` (newest first), `due(nowIso)` (enabled, at or past
  `next_run_at`, soonest first).
- `update(id, patch)`: `title`, `prompt`, `intervalMs`, `enabled` and the task
  extras. Blank title or prompt keeps the current one. Changing the interval
  re-anchors `next_run_at` from now, enabling gives a fresh one, disabling nulls
  it. `null` for an unknown id.
- `markDueNow(id)`: due immediately; false when disabled or unknown.
- `recordCompletion(id, { status })`: stamps `last_run_at` and `last_status`
  and reschedules from completion time (not from when it was due).
- `delete(id)`: the task and its run rows.
- `recordRunStart(taskId, { conversationId, ...runExtras })` returns the run
  (`status: 'running'`).
- `recordRunFinish(runId, { status = 'ok', error, <outcome field> })` caps the
  outcome at `OUTCOME.maxChars`.
- `getRun(id)`, `listRuns(taskId, { limit, offset })` (newest first).
- `pruneTranscripts(taskId, keep)`: keeps the newest `keep` transcripts, nulls
  the rest's `conversation_id` and returns those conversation ids for the
  caller (which owns ChatStore) to delete.

Hydrated tasks: `{ id, <owner field>, title, prompt, intervalMs, ...extras,
enabled, lastRunAt, nextRunAt, lastStatus, createdAt, updatedAt }`. Runs:
`{ id, taskId, conversationId, ...extras, status, startedAt, completedAt,
error, <outcome field> }`.

## Implementations

- [ArtifactTaskStore](ArtifactTaskStore.md)
- [ScheduledTaskStore](ScheduledTaskStore.md)

## Why

The two legacy stores were line-for-line twins (same columns, same scheduling
rules, same retention) differing only in table names, owner column, interval
bounds, outcome column and one extra column each. Birds of a feather share one
base so a scheduling fix lands in both.
