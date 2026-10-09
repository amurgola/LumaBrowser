# EvalEventCapture

`core/llm-server/chat/bridge/eval/EvalEventCapture.js`

The capturing `send` sink an eval turn hands the chat router; accumulates the
stream the way the renderer does.

## Methods

- `new EvalEventCapture(onSettled)`; fields `text`, `doneInfo`, `error`,
  `assistantMessageId`, `compactions`; `send(type, payload)` (bound).
  - `meta`: records `assistantMessageId`; `delta`: appends `text`;
    `rollback`: drops the last `chars` (all when too many);
    `status` with `phase: 'compacted'`: counts; `error`: fails with the
    message (or `chat failed`) and settles; `done`: stores the payload, fails
    with `aborted` when `aborted: true`, settles. Other events are ignored.
- `fail(error)`: keeps the first error only.
