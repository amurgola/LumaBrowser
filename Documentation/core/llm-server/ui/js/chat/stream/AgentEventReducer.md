# AgentEventReducer

`core/llm-server/ui/js/chat/stream/AgentEventReducer.js`

Folds one `agent` event into the live message's `agentRuns`, one run per
invocation id: start (name), reasoning, delta (answer), rollback (takes back
`chars` of streamed answer, as on the main text), tool steps, done, error. Any
event carrying `conversationId` (a delegated sub-conversation) records it on the
run; a run starts with `conversationId: null`.

Tool steps follow the main turn's [ToolEventReducer](ToolEventReducer.md): the
bridge re-fires `pending` every tick while a call's arguments stream, so pending
fills ONE placeholder step (`pending: true`, named once the tool is known) that
`run` adopts; `cancel` drops it; `done` closes the newest running step of that
tool.

## Methods

- `AgentEventReducer.apply(message, payload)`: returns the run.
