# ManualDelivery

`core/llm-server/chat/bridge/prompt/ManualDelivery.js`

Renders the manuals of tool groups activated after the conversation's system
prompt was frozen, at the head of a turn's task.

## Methods (all static)

- `render(groups, keys, { nativeTools = false })`: `HEADER`, a blank line, the
  `doc` of every available group in `keys` (available order, fence examples
  stripped by `ToolGroups.docWithoutFenceExamples` on a native route), joined
  by blank lines, then a blank line; `''` when nothing is pending or known.
- `HEADER`: tells the model the groups are already active and must not be
  activated again (the frozen system prompt still lists them as inactive).

## Why

Folding a newly activated group's manual into the system prompt changed the
prompt near its top, and llama-server then re-read the whole conversation on
the next turn. The task message is new on every turn anyway, so the manual
rides there once; [BridgeRun](../BridgeRun.md) persists that message's sent form
and [TurnPrompt](TurnPrompt.md) re-sends it byte for byte afterwards, so the
manual stays in the model's history at no further cost.
[ToolGroupState](../groups/ToolGroupState.md) decides what is pending.
