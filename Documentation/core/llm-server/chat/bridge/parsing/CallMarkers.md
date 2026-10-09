# CallMarkers

`core/llm-server/chat/bridge/parsing/CallMarkers.js`

The recovery markers a parsed tool call carries, moved onto its params under
symbol keys.

## Methods (all static)

- `transfer(call)`: moves `__repaired`, `__argsLost` (its preview string) and
  `__argsCut` onto `call.params` as `REPAIRED`, `ARGS_LOST`, `ARGS_CUT`;
  deletes those keys and `__coerced`; returns whether it was repaired.
- `isRepaired(params)`, `lostArguments(params)` (string or null), `wasCut(params)`.
- `REPAIRED`, `ARGS_LOST`, `ARGS_CUT` (symbols), `MALFORMED_TOOL`
  (`'__malformed_tool_call__'`).

## Why

A symbol travels with the call through a batch and AgentRunner's tab-id
rewrite, and `JSON.stringify` skips it, so it never reaches a tool, a card, the
ledger key or the trace.
