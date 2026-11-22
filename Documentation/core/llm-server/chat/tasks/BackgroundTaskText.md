# BackgroundTaskText

`core/llm-server/chat/tasks/BackgroundTaskText.js`

Everything the model is told about background tasks, in one wording: the prompt note,
the answer to starting a task, the answer to a direct call that was moved to the
background, a task's status line, the two forms a finished result reaches the model in,
and the line at the prompt's tail.

## Members

- `NOTE`: appended to the system prompt
  ([BackgroundTaskTools](BackgroundTaskTools.md)`.note`). A call still going after a few
  seconds is moved to the background by the app and its answer names a task id; a call
  known to take minutes is started there with `run_in_background` (`tool`, `arguments`,
  `title`, once per task); while a task runs the model goes on with whatever else the
  user asked; the result is handed over the moment it is ready, inside the reply when
  the model is still working, otherwise in a message marked as automated; with nothing
  left to do it tells the user what is still running and ends the reply. Renders are named
  as the exception: a queued render does not start until the reply has ended, so the
  model queues every one asked for and ends the reply. It forbids waiting, sleeping or
  checking in a loop and stating a result not yet given (a task has made nothing until
  its result is in front of the model), and keeps the status tool for when the user
  asks. The text is the same on every turn, so the
  cached prompt prefix holds.
- `GO_ON`: what the model does once a task is under way, in the same words wherever one
  starts: the result is handed over when ready, go on with anything that does not need
  it, end the reply when nothing is left, do not wait or check, never state the result
  early.
- `started(task, queuedAhead)`: the answer to `run_in_background`. A running task: that
  it runs, then `GO_ON`. A queued one (a render): queued until this reply has ended, or
  behind N others; that it has not run yet and has made nothing; to queue anything else
  the user asked for, say what is queued and end the reply, because a render starts only
  then; and not to describe the results before they are sent.
- `movedToBackground(task, waitedMs)`: the answer to a direct call that outlived its
  time in the reply ([SlowCallBudget](SlowCallBudget.md)): the tool was still going
  after that long, it now runs as the named task, "You do not have its result yet.",
  then `GO_ON`.
- `line(task, progress?)`: `bg-1 "Back up the photos" (terminal_run): running for 12 min,
  copying 2024-08`. An ended task reads `finished after 58 min`, `failed after 41 s`
  or `stopped by the user after 3 min`.
- `handOver(tasks)`: what a reply still being written is given the moment tasks end:
  `IN_REPLY_HEAD` (automated, not written by the user, a task ended while you were
  working on this reply, the user has not seen its result), one `outcome` per task, and
  `IN_REPLY_FOOT` (use it in the reply you are writing).
- `notice(tasks, stillRunning)`: the user-role message of the results turn.
  `AUTOMATED_HEAD` (from LumaBrowser, not written by the user, the user has not seen
  these results), one `outcome` per task, a "Still going, and reported to you later"
  line for the conversation's other running tasks, and `AUTOMATED_FOOT` (tell the user
  the outcome in your own words, from what is written above only; say plainly when a
  task failed or was stopped).
- `outcome(task)`: the task's line, then `Result:` or `Error:` and its text
  (`(nothing was returned)` when empty), and what it made by artifact id, which the user
  can already see. A stopped task gives the output it had before it stopped, if any.
- `tail(tasks, progressOf)`: one bracketed line for the prompt's tail: the tasks still
  going (their results come by themselves: do not wait, poll or guess them), and the
  ended ones not handed over yet (a task that made something to show: it is shown and
  reported in an automated message after the reply, or can be read now with
  `background_task_status`). Null when there is neither.
- `duration(ms)`: `8 s`, `12 min`, `1 h 05 min`.
