# ToolGroupState

`core/llm-server/chat/bridge/groups/ToolGroupState.js`

One run's lazy tool-group state.

## Methods

- `new ToolGroupState({ allows, extTools, kbHasDocs, chatStore, conversationId,
  forcedActive = [] })`: `available` from [AvailableGroups](AvailableGroups.md),
  `availableKeys` (Set), `active` (Set) seeded from
  `chatStore.getMeta(id).data.activeToolGroups` plus `forcedActive` (mode tool
  names).
- `activate(keys)`: adds available, inactive keys; persists when anything
  changed; returns whether it did.
- `promptKeys` (Set): the groups whose manuals the system prompt carries, read
  from `data.promptToolGroups` plus `forcedActive`; `freezePromptKeys()` sets
  it to the active set on a conversation's first turn (no recorded list yet),
  records it, and returns whether it did.
- `pendingManualKeys(carried)`: active groups neither in `promptKeys` nor in
  `carried` (the keys whose manual the history being sent already holds, from
  [ManualDelivery](../prompt/ManualDelivery.md)`.carriedKeys`).
  [BridgeRun](../BridgeRun.md) renders the pending manuals at the head of the
  task through ManualDelivery.
- `refresh(allows, extTools)`: re-derives `available` after admission; keys only grow.
- `docsFor(keys)`, `owningGroups(name)`, `groupFor(name)`
  (`ToolGroups.groupForTool`), `keysOwning(names)`.
- `nativeTools` (boolean, false until [BridgeRun](../BridgeRun.md) sets it from the run's
  NativeToolPlan): when true `docsFor` returns the manuals without their text-fence call
  examples (`ToolGroups.docWithoutFenceExamples`), so the manual an `activate_tools` call
  or an auto-activation hands back matches the ones the system prompt carries on that route.

Persistence (`setMeta(id, { data: { ...data, activeToolGroups,
promptToolGroups? } })`, the last only once frozen) is best-effort and skipped for a conversation `getConversation`
does not know (the sharing proxy's throwaway ids), which then freezes in
memory every turn, so its system prompt carries the active set as before.
`forcedActive` names are never written: they belong to the mode running this
turn, not to the conversation.

The prompt set is frozen because a manual folded into the system prompt after
the first turn changed the prompt near its top and made llama-server re-read
the whole conversation on the next turn. Delivering it with a turn's task
instead keeps the cached prefix. In-run activations are delivered by the
`activate_tools` result for that run and again by the next turn's task, since
tool results are not part of the stored history.

Whether a manual still needs delivering is asked of the history, not of a
recorded flag. A `deliveredToolGroups` list used to mark a group for good the
moment its manual was sent, but the message carrying it can leave the history:
a regenerated turn has no row to record it on, an edited turn becomes an
inactive variant, compaction and a mode's trim cut old turns. The group then
stayed active and "delivered" with no manual anywhere (the frozen system
prompt lists it as inactive), and calling its tools directly no longer
auto-activated it, so the model called them blind. Conversations still
holding that list ignore it.

## Registered groups and the call note (2026-11-20)

- `registeredKeys()`: the groups whose tools a native-tool run registers as
  functions: `promptKeys` once the conversation's first turn froze them,
  `active` before that. [NativeToolPlan](../tools/NativeToolPlan.md) builds
  the `tools` array from it, so the array is as byte-identical across requests
  and turns as the system prompt.
- `callNote(keys)`: on a native route, `\n\n` plus
  `ActivationManual.CALL_THROUGH_CALL_TOOL` when any available group in `keys`
  is outside the registered set; `''` otherwise and on the text fence.
- `docsFor(keys)` now ends with `callNote(keys)`, so every manual an
  activation hands back (the `activate_tools` result, the auto-activate
  bounce, a tool admitted mid-run) tells a native model to run those tools
  through `call_tool`. The manuals themselves are unchanged, so
  [ManualDelivery](../prompt/ManualDelivery.md) still finds them in the
  history.
