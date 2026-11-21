# CallToolCall

`core/llm-server/chat/bridge/tools/CallToolCall.js`

`call_tool`: the registered function through which a native-tool model calls
a tool that is not in its registered array.

## Members (all static)

- `NAME`: `call_tool`. Its schema is
  [PseudoToolSchemaTable](../../tool-schemas/PseudoToolSchemaTable.md)`.CALL_TOOL`
  (`name`: the tool, required; `params`: any object).
- `unwrap(call)`: a parsed `{ tool: 'call_tool', params: { name, params } }`
  becomes `{ tool: name, params }`, keeping the parser's string markers
  (`__repaired`, `__argsLost`, `__argsCut`, `__coerced`) so
  [CallMarkers](../parsing/CallMarkers.md) can still move them onto the
  parameters. The wrapped parameters are also read from a JSON string and
  from `arguments` or `args`; anything that is not an object is `{}`. Any
  other call, and a `call_tool` that names no tool or names itself, is
  returned as is.
- `streamed(name, args)`: what a card shows while a native call streams:
  `{ name, args }` unchanged for any other tool; for a `call_tool` the tool
  it names once that has arrived (`null` until then) and the text of its own
  parameters so far.
- `REFUSAL`: the result for a `call_tool` that named nothing, saying it needs
  `name` and `params`.

## Where it runs

[RunToolCallParser](../parsing/RunToolCallParser.md) unwraps every parsed call,
so the agent loop, the tool card, the approval, the loop monitor and the
dispatch all deal with the real tool. The assistant message in the history
keeps the call as the model wrote it, so the model goes on calling the same
way. [NativeCallStream](../turn/NativeCallStream.md) uses `streamed` for the
live card, and [ToolCallPipeline](ToolCallPipeline.md) answers `REFUSAL` to a
`call_tool` that could not be unwrapped.

## Why

The registered array is fixed for a conversation
([NativeToolPlan](NativeToolPlan.md)): changing it makes the server read the
whole prompt again. A tool of a group loaded after the first turn therefore
has no schema of its own, and one stable function stands in for all of them.
The same shortcut as on the text fence still works through it: `call_tool` on
a tool whose group is not loaded bounces with the manual
([AutoActivation](../groups/AutoActivation.md)).

Verified live 2026-11-20: Inkling 2 Mini loaded two Hub tools mid-turn and
ran both through `call_tool`; the turn went from four minutes to 89 seconds.
