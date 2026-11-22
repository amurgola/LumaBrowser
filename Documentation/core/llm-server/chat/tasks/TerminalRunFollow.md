# TerminalRunFollow

`core/llm-server/chat/tasks/TerminalRunFollow.js`

Runs a `terminal_run` call to its real end for a background task. `terminal_run` itself
stops waiting after ten minutes with the command still going, so this keeps waiting on
the same terminal with `terminal_read` until the prompt is back (or the program stops to
ask something), gathering what was printed.

## Methods

- `new TerminalRunFollow({ call, isStopped, report })`: `call(tool, params)` is one tool
  call run apart from any reply ([DetachedToolCalls](../bridge/tools/DetachedToolCalls.md)
  `.run`), `isStopped()` the task's stop flag, `report({ detail })` its progress line.
- `TerminalRunFollow.handles(tool)`: true for `terminal_run`.
- `run(params)`: `terminal_run` with the model's arguments and `timeout_seconds: 600`,
  then `terminal_read({ id, wait_seconds: 300 })` on the terminal named in the reply's
  head line for as long as the head says `running` or the read says `wait ended:
  timeout`, and the task has not been stopped. Resolves `{ success, data }` with
  everything printed; `success` is false when the last call failed.
- `resume(firstResult)`: follows a `terminal_run` that is already under way (one the
  reply started itself and handed on, [BackgroundTaskTools](BackgroundTaskTools.md)):
  `firstResult` is the promise of that call's own result, and the reads go on from it as
  in `run`. `run` is `resume` of the call it starts.
- `stop()`: Ctrl+C into the command's terminal (`terminal_send`); nothing before the
  first reply has named the terminal.

## What is gathered

The head line (`[terminal t1 | running | 600.0 s | C:\work]`) is read for the terminal
id and state and left out of the output. The tool's own advice lines (`[Still running
after ...]`, `[This shell does not report ...]`) are for a model that waits itself and
are dropped, as is `(nothing new)`. At most the last `KEEP_CHARS` (24000) are kept; the
task's result is cut again for the model
([BackgroundTaskResult](BackgroundTaskResult.md)). The last line printed becomes the
task's progress detail in the strip above the composer.
