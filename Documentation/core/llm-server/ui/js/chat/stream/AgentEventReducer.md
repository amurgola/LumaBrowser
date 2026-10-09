# AgentEventReducer

`core/llm-server/ui/js/chat/stream/AgentEventReducer.js`

Folds one `agent` event into the live message's `agentRuns`, one run per
invocation id: start (name), reasoning, delta (answer), tool steps, done, error.

## Methods

- `AgentEventReducer.apply(message, payload)`: returns the run.
