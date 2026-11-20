# BackgroundTaskWake

`core/llm-server/chat/tasks/BackgroundTaskWake.js`

Wakes the model when the background tasks of one of its replies have all ended: waits
until no reply is being written, then starts the turn that hands it their results
([BackgroundTaskTurn](BackgroundTaskTurn.md)).

## Methods

- `new BackgroundTaskWake({ tasks, idle, turn, notices })`: `tasks` is
  [BackgroundTasks](BackgroundTasks.md), `idle` [ChatIdleWait](ChatIdleWait.md), `notices`
  [AgentNotices](../../../shared/AgentNotices.md) (a test seam).
- `watch()` -> unsubscribe: `deliver(conversationId)` on every `onBatchEnded`. A failed
  delivery is logged, never thrown.
- `deliver(conversationId)`: one delivery per conversation at a time; tasks that end
  while one is under way are picked up by another pass right after it.

## One delivery

1. `idle.until(SETTLE_MS)`: no reply streaming for 1.5 s in a row. A message the user
   queued behind the reply is sent the moment that reply ends, and the settle time lets
   it go first.
2. `tasks.endedUndelivered(conversationId)`: the undelivered tasks of every batch that
   has wholly ended. Results the model already read with `background_task_status` are
   delivered and not among them, so they start no turn.
3. Which are worth a turn: tasks the model stopped itself are no news to it and are
   left out; of the rest, a turn is started only if at least one did not end as
   stopped. A turn that would only say "it was stopped" answers nothing.
4. The turn, with the conversation's tasks still going named as such. When it answers
   `BUSY` (a reply began while it was being set up) the loop waits for idle again.
5. No turn: each task the user stopped leaves a note through `AgentNotices.enqueue` for
   the model's next turn ("It did not finish; do not start it again unless the user
   asks.").
6. Everything ended is marked delivered.

The results stay undelivered until the turn that carries them has started, so a reply
that wins the race only delays them.
