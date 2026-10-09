# BatchDispatchTool

`extensions/code-mode/tools/batch/BatchDispatchTool.js`

`dispatch_batch { tasks: [{ kind?, instruction, files? }] }` (a [CodeTool](../CodeTool.md)).

## Methods

- `new BatchDispatchTool({ scheduler, concurrency, runSubAgent })`; the
  description advertises "Up to <concurrency> run at once".
- `handle(params, opts)`: rejects invalid specs ([BatchSpecs](BatchSpecs.md))
  before running anything; an already stopped turn returns "Batch not started:
  the turn was stopped."; otherwise runs the tasks through the core
  BatchScheduler with live [BatchLanes](BatchLanes.md), and returns the digest.
  `opts.isAborted` is adapted into the scheduler's `{ aborted }` signal and also
  passed to every `runSubAgent(task, { emit, isAborted })`, so Stop reaches
  sub-agents already running.
