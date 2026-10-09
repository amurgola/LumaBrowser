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

Per iteration: `_shouldStop` (wall clock, then cancel), `_prepareRequest`
(expire the screenshot note, last-steps warning, proactive compaction, notice
relay), `_complete` (first completion gets the warm-up retry, then overflow
recovery), then `_handleReply`: calibrate from `usage.prompt_tokens`, parse the
batch, push the assistant message, and either review a no-tool reply with the
[FinalAnswerGate](FinalAnswerGate.md) or run the batch with
[ToolBatchRunner](ToolBatchRunner.md). The reasoning tail rides as carried
notes on the batch's first result.
