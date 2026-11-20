# BackgroundTaskText

`core/llm-server/chat/tasks/BackgroundTaskText.js`

Everything the model is told about background tasks, in one wording: the prompt note,
the answer to starting a task, a task's status line, the automated message that carries
finished results back, and the line at the prompt's tail.

## Members

- `NOTE`: appended to the system prompt
  ([BackgroundTaskTools](BackgroundTaskTools.md)`.note`). A call that takes minutes or
  longer may run in the background; call `run_in_background` with `tool`, `arguments`
  and `title`, once per task; tell the user what was started and end the reply; the
  results come in a message marked as automated once every task of the reply has
  finished. It forbids waiting, sleeping or checking in a loop and stating a result
  not yet given, keeps the status tool for when the user asks, and says to run a call
  directly when it is quick or its result is needed to go on. The text is the same on
  every turn, so the cached prompt prefix holds.
- `started(task, queuedAhead)`: the answer to `run_in_background`: running, queued
  until this reply has ended, or queued behind N others; that the result comes
  automatically; and to end the reply without waiting or checking.
- `line(task, progress?)`: `bg-1 "Back up the photos" (terminal_run): running for 12 min,
  copying 2024-08`. An ended task reads `finished after 58 min`, `failed after 41 s`
  or `stopped by the user after 3 min`.
- `notice(tasks, stillRunning)`: the user-role message that hands a batch back.
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
  ended ones not handed over yet (they arrive once this reply and their batch have
  ended, or can be read now with `background_task_status`). Null when there is neither.
- `duration(ms)`: `8 s`, `12 min`, `1 h 05 min`.
