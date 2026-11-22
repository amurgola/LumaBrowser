# BackgroundTaskTools

`core/llm-server/chat/tasks/BackgroundTaskTools.js`

What a Tools-on chat turn gets so long tool calls run in the background: the
`run_in_background`, `background_task_status` and `stop_background_task` session tools,
the budget that moves a slow direct call there by itself, the prompt note on how it all
works, the results a reply still being written is handed as tasks end, and the line at
the prompt's tail while tasks of the conversation are still going or wait to be handed
over. The tasks themselves are kept by [BackgroundTasks](BackgroundTasks.md).

## Which turns get them

`BackgroundTaskTools.forTurn({ convId, modeTurn, evalOverrides }, { tasks, jobs })`
returns an instance for a plain chat turn with a conversation id, and null for a mode's
turn or an eval run, which keep the tools they pinned.
[AgentTurnDispatch](../router/AgentTurnDispatch.md) is the one caller, so Network Sharing
guests, scheduled tasks and triggers, which do not go through it, do not get the tools.

## The tools

- `run_in_background({ tool, arguments, title })` (also read: `name` for `tool`, `args`
  or `params` for `arguments`, and `arguments` as JSON text). It needs the session tool
  context's `detached` ([DetachedToolCalls](../bridge/tools/DetachedToolCalls.md));
  without it the model is told to call the tool directly. The call is checked by
  [BackgroundTaskRules](BackgroundTaskRules.md)`.refusal`, then admitted like a direct
  call (`detached.admit`: active group, required arguments, the approval question). A
  call sent back so the model reads the tool's instructions first gets the card line
  "Read the tool's instructions first". An admitted call becomes a task whose batch is
  the reply's assistant message, in the tool's lane, with the given title (or the tool
  and its `command`, `prompt`, `query`, `title` or `name` argument, up to 80 characters).
  A `terminal_run` is run through [TerminalRunFollow](TerminalRunFollow.md). The answer
  is `{ success, task_id, summary: "In the background: <title>", message }`, `message`
  from [BackgroundTaskText](BackgroundTaskText.md)`.started`, followed by the manual of a
  tool group the call loaded (`admitted.manualNote`), as on a direct call's result.
- `background_task_status({ task_id? })`: the running tasks' lines with their progress
  and the ended tasks' outcomes; without `task_id`, only the tasks whose results the
  model does not have yet. An ended task read here is marked read
  (`BackgroundTasks.markRead`), so no automated message repeats it, and what it made is
  shown in this reply (pushed on the context's `artifacts` and `onArtifact`). While
  tasks are going the answer ends with "Nothing for you to do until they end".
- `stop_background_task({ task_id })`: stops a task of this conversation
  (`BY_MODEL`), or says it had already ended.

## A direct call that outlives its time

`slowCalls` is the turn's [SlowCallBudget](SlowCallBudget.md), which the run's
[YieldingDispatch](../bridge/tools/YieldingDispatch.md) asks about every direct call. A
call that is still going after the budget is handed here (`_adopt`): it becomes a task
of the reply that made it, titled from the tool and its main argument, counted from the
moment the call really started, with no second start. The call's progress, artifacts and
stop signal go over to the task (`call.handTo`); a `terminal_run` is followed from its
own result ([TerminalRunFollow](TerminalRunFollow.md)`.resume`). The model is answered
`{ success, task_id, summary: "Still running, now in the background: <title>", message }`,
`message` from `BackgroundTaskText.movedToBackground`, and the turn counts as having
started a task.

## Results inside the reply

`endedNotices()` is asked before every request of the run (the bridge's `stepNotices`).
It takes the tasks that have ended since (`BackgroundTasks.takeEnded`) and returns their
outcomes as one text (`BackgroundTaskText.handOver`), or nothing. The run puts it on the
message the model reads next, so a result that is ready while the model is still working
is used in the same reply. What was handed over here is not repeated by the results turn
([BackgroundTaskWake](BackgroundTaskWake.md)), which is left with whatever ends after
the reply's last request.

## Members

- `extraTools`: the three tools for the run's `extraTools`, forced active and
  documented from their schemas.
- `note`: `BackgroundTaskText.NOTE`, for the system prompt.
- `awaitsLaterResult`: true once this turn started a task; the run's
  [FinalAnswerGate](../../agent/FinalAnswerGate.md) then accepts a short "I will tell you
  when it is done" as the answer.
- `tail()`: asked on every request (the bridge's `stepReminder`). The
  `BackgroundTaskText.tail` line, given only when it says something new: every tail
  stays in the history, and running times alone (`for 12 min`) are no reason to repeat
  it. A running task's progress is its job's detail and step count
  ([ConversationJobReminder](../jobs/ConversationJobReminder.md)`.progress`).
