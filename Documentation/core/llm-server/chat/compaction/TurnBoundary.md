# TurnBoundary

`core/llm-server/chat/compaction/TurnBoundary.js`

Where a compaction cut may land.

## Methods (all static)

- `isTurnStart(message)`: a `user` message whose text does not start with
  `TOOL_RESULT_PREFIX` (`[Tool Result for `).
- `isCutPoint(messages, index, boundary)`: a turn start, or under
  `boundary === 'step'` also an `assistant` message.

## Why

AgentRunner files tool output as a `user` message with that prefix. A
role-only test would cut between an assistant tool call and its result, and
the kept tail would open with an answer to a call the model can no longer see.
The step boundary is the only seam inside one agentic turn: the head ends with
a completed call and result, the tail opens with the model's next move.
