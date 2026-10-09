# HumanWait

`core/llm-server/chat/bridge/waits/HumanWait.js`

Base for a question the agent loop blocks on until a person (or a timer)
answers. Subclasses: [ApprovalWait](ApprovalWait.md), [TakeoverWait](TakeoverWait.md).

## Methods

- `wait(timeoutMs?)`: one pending question at a time; a second settles the first
  with `_supersededAnswer()`; times out with `'timeout'`.
- `respond(answer)`: settles with `_normalize(answer)`; false when nothing waits.
- `cancel(answer)`: settles with `answer` when something waits.
- `isPending()`.
- Subclasses implement `_defaultTimeoutMs`, `_normalize`, `_supersededAnswer`,
  `_resultFor(answer)`.
