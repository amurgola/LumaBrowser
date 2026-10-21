# ToolTrace

`core/llm-server/chat/bridge/turn/ToolTrace.js`

One turn's tool trace, persisted on the assistant message.

## Methods

- `entries`, `length`.
- `open(tool, params, callId?)`: `{ tool, params, status: 'run' }`; the id is
  remembered beside the entries, never persisted with them.
- `close(evt)`: the entry opened with `evt.callId`, else the OLDEST open entry
  of that tool, gets `status` `ok`/`err`, `error`, `summary` and `meta`.
- `addFailure(tool, error)`: `{ tool, params: null, status: 'err', error }`.
