# CommandOutputRelay

`extensions/code-mode/tools/project/CommandOutputRelay.js`

The live side of one run_command call.

## Methods

- `new CommandOutputRelay(command, { emit, isAborted })`.
- `signal` (getter): an AbortSignal the runner honours; a 250 ms poll of
  `isAborted()` aborts it (the bridge hands tools a predicate, not a signal).
- `onOutput(chunk)` buffers and flushes `command:output { command, chunk }`
  every 100 ms.
- `close()` stops the poll and flushes what is buffered.
