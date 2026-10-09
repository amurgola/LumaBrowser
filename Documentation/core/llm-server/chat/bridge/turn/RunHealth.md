# RunHealth

`core/llm-server/chat/bridge/turn/RunHealth.js`

One run's health tally and usage figures.

## Methods

- Fields: `repetitionAborted`, `offFormatCalls`, `offFormatShapes`,
  `lengthCutCompletions`, `missingArgCalls`, `lastUsage`, `lastTimings`,
  `turnTotals`.
- `noteOffFormat(shape)`, `noteMissingArgs()`.
- `watchToolLoop(monitor)`: the run's [ToolLoopMonitor](../../ToolLoopMonitor.md);
  its `report()` becomes `toolLoop` in `doneFields` (omitted if none or it throws).
- `noteCompletion(completion)`: counts a repetition stop and a length cut;
  returns whether it was cut.
- `onUsage(usage)`, `onTimings(timings)` (sums `predicted_n`, `predicted_ms`,
  `prompt_n`, `prompt_ms`, `completions`).
- `doneFields(result)`: the `onDone` payload `{ finishReason: 'stop', usage,
  timings, turnTimings (with predicted_per_second), iterations, stopReason,
  offFormatCalls, offFormatShapes, lengthCutCompletions, missingArgCalls,
  overflowRecoveries, toolLoop }`.
