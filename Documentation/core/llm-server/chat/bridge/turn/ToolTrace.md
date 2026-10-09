# ToolTrace

`core/llm-server/chat/bridge/turn/ToolTrace.js`

One turn's tool trace, persisted on the assistant message.

## Methods

- `entries`, `length`.
- `open(tool, params)`: `{ tool, params, status: 'run' }`.
- `close(evt)`: the OLDEST open entry of that tool gets `status` `ok`/`err`,
  `error`, `summary` and `meta`.
- `addFailure(tool, error)`: `{ tool, params: null, status: 'err', error }`.
