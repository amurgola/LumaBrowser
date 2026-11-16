# ProcessRunner

`extensions/lora-trainer/ProcessRunner.js`

Runs uv and the trainer.

## Methods

- `run({ command, args, cwd, env, onLine, isCanceled, timeoutMs })` ->
  `{ ok, code, canceled, timedOut, tail }`. Output is split on newlines and carriage
  returns (progress bars redraw with the latter). Cancel and timeout kill the whole
  process tree. Never rejects.

The child is entered in ChildProcessRegistry, so quitting the app never leaves a trainer
holding the graphics card.
