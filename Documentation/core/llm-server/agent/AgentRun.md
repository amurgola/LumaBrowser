# AgentRun

`core/llm-server/agent/AgentRun.js`

One execution of the agent tool loop, built fresh by
[AgentRunner](AgentRunner.md)`.run` for every call. Holds the run's state and
wires its parts together.

## Methods

- `new AgentRun(deps, options)`: `deps` is `{ llm, browserTools,
  browserService, db }`; `options` go through
  [RunOptions](RunOptions.md)`.normalize`.
- `execute()` resolves to the run result described in AgentRunner.md.

## Steps

`execute` sets up the components, opens the [WorkTab](WorkTab.md), seeds the
messages (system prompt, prior turns, task), registers with
[AgentNotices](../../shared/AgentNotices.md), loops, and builds the result. The
registration is ended in a `finally`.

Seeding ends with `_resumeCheckpoint`: when the conversation has a stored
[CompactionCheckpoint](CompactionCheckpoint.md) (`compactionCheckpoint`
option) whose messages still lead the history, and it was written for this
window (or the seeded request is past the compaction trigger anyway), the
stored summary takes their place (a `{ compaction: { reason: 'checkpoint' } }`
step); every compaction of the run is offered back to the checkpoint.

Per iteration: `_shouldStop` (wall clock, then cancel), `_prepareRequest`
(expire the screenshot note, last-steps warning, proactive compaction on every
iteration including the first, since a long conversation's prior turns can
already fill the window, notice relay), `_complete` (first completion gets the warm-up retry, then overflow
recovery), then `_handleReply`: calibrate from `usage.prompt_tokens`, split the reply's
calls into the batch and (at a pool of one) the dropped rest, push the
assistant message, and either review a no-tool reply with the
[FinalAnswerGate](FinalAnswerGate.md) or run the batch with
[ToolBatchRunner](ToolBatchRunner.md), which answers the dropped calls too. The reasoning tail rides as carried
notes on the batch's first result.

## Iteration events

Every iteration starts with `onEvent({ type: 'iteration', iteration (1-based),
maxIterations, elapsedMs })`, before the request is prepared, so a display
outside the chat can show the run's place in its budget.
