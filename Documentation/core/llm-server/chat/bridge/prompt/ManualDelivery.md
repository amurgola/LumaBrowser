# ManualDelivery

`core/llm-server/chat/bridge/prompt/ManualDelivery.js`

Renders the manuals of tool groups activated after the conversation's system
prompt was frozen, at the head of a turn's task.

## Methods (all static)

- `render(groups, keys, { nativeTools = false })`: `HEADER`, a blank line, the
  `doc` of every available group in `keys` (available order, fence examples
  stripped by `ToolGroups.docWithoutFenceExamples` on a native route), joined
  by blank lines, then a blank line; `''` when nothing is pending or known.
- `carriedKeys(groups, turns, { nativeTools = false })`: the Set of group keys
  whose manual, as `render` would write it now, sits in a prior user turn that
  holds a delivery block (`turns`: `[{ role, content }]` or null). A manual
  that left the history, or whose text changed, is not carried and is
  delivered again.
- `carryOver(groups, keys, head, recent, { nativeTools = false })`: what a
  mid-run compaction must carry out of the messages it summarizes away: the
  delivery block for the groups in `keys` whose manual sits in `head` and
  nowhere in `recent` (a manual that arrived as an `activate_tools` result
  counts), without a trailing blank line; `''` for none.
  [BridgeRun](../BridgeRun.md) passes it to the agent run as
  `compactionCarry`, so a group never stays active with its manual
  summarized away (live trace, 2026-11-10: the manual count dropped to 0 for
  the rest of a compacted run).
- `HEADER`: tells the model the groups are already active and must not be
  activated again (the frozen system prompt still lists them as inactive).

## Why

Folding a newly activated group's manual into the system prompt changed the
prompt near its top, and llama-server then re-read the whole conversation on
the next turn. The task message is new on every turn anyway, so the manual
rides there once; [BridgeRun](../BridgeRun.md) persists that message's sent form
and [SentForm](SentForm.md) replays the manual with that turn afterwards, so
it stays in the model's history at no further cost.
[ToolGroupState](../groups/ToolGroupState.md) decides what is pending.
