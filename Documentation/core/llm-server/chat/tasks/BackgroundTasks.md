# BackgroundTasks

`core/llm-server/chat/tasks/BackgroundTasks.js`

The tool calls chat models have running in the background. It starts each one, shows it
in its conversation through [ConversationJobs](../jobs/ConversationJobs.md) (job kind
`background-task`, so the page's strip draws it like any other job), keeps what it
returned, and says when every task a reply started has ended, which is when their
results go back to the model.

## Methods

- `BackgroundTasks.shared`: the one instance the chat uses. The constructor takes `jobs`
  and `now` as test seams.
- `useChatIdle(untilChatIdle)`: a function that resolves when no reply is being written
  ([ChatIdleWait](ChatIdleWait.md), wired by
  [LlmServerIpcHandlers](../../LlmServerIpcHandlers.md)). A laned task waits for it
  before it starts.
- `start({ conversationId, batchId, tool, title, lane?, run, stop? })` -> the task's
  view ([BackgroundTask](BackgroundTask.md)). `run({ report, isStopped, artifacts })`
  does the work: `report({ detail, step, totalSteps })` moves the task's job line,
  `artifacts` is the list the call pushes onto. A task with a `lane` queues in that
  lane's [SerialLane](SerialLane.md); one without starts at once. The job starts with
  detail `queued`, cleared when the task begins.
- `stop(id, by = BY_USER)` -> whether a task was still going. A queued task ends at once
  as canceled; a running one has its `stop` called and ends as canceled when its run
  settles.
- `get(id)`, `listFor(conversationId)` (oldest first), `queuedAhead(id)` (tasks before
  it in its lane, 0 when it is running or has no lane).
- `markRead(id)`: the model read a finished task itself (`background_task_status`). It
  needs no automated message for it; returns the artifacts not shown yet.
- `endedUndelivered(conversationId)`: the undelivered tasks of the batches that have
  wholly ended. A batch with one task still going holds back the others.
- `markDelivered(ids)`: their results were handed to the model. Ended, delivered tasks
  beyond the newest `KEEP_DELIVERED` (30) are dropped, oldest first.
- `onBatchEnded(listener)` -> unsubscribe. `listener({ conversationId, batchId })` is
  called when the last task of a batch ends.
  [BackgroundTaskWake](BackgroundTaskWake.md) listens.

## Ending

A run that throws is a failed result, never a crashed registry. The end state is
`canceled` when a stop was asked, else `done` or `failed` by
[BackgroundTaskResult](BackgroundTaskResult.md)`.succeeded`. The job is finished with no
message of its own: the result reaches the model, which answers, so nothing is posted
by [ConversationJobPoster](../jobs/ConversationJobPoster.md).

## Why a lane and the idle wait

Media renders share the `media` lane ([BackgroundTaskRules](BackgroundTaskRules.md)):
the image router runs one render at a time and a new render aborts the one in flight,
so two background renders started together would cancel each other. Each also waits
until no chat reply is streaming, so a render never takes the cards from the chat model
in the middle of a reply.

Tasks live in memory only: they do not survive an app restart.
