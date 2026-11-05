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
- `pendingManualKeys()`: active groups neither in `promptKeys` nor in the
  recorded `deliveredToolGroups`; `markDelivered(keys)` records them (returns
  whether anything changed). [BridgeRun](../BridgeRun.md) renders the pending
  manuals at the head of the task through [ManualDelivery](../prompt/ManualDelivery.md).
- `refresh(allows, extTools)`: re-derives `available` after admission; keys only grow.
- `docsFor(keys)`, `owningGroups(name)`, `groupFor(name)`
  (`ToolGroups.groupForTool`), `keysOwning(names)`.

Persistence (`setMeta(id, { data: { ...data, activeToolGroups,
promptToolGroups?, deliveredToolGroups? } })`, the last two only once frozen
or non-empty) is best-effort and skipped for a conversation `getConversation`
does not know (the sharing proxy's throwaway ids), which then freezes in
memory every turn, so its system prompt carries the active set as before.
`forcedActive` names are never written: they belong to the mode running this
turn, not to the conversation.

The prompt set is frozen because a manual folded into the system prompt after
the first turn changed the prompt near its top and made llama-server re-read
the whole conversation on the next turn. Delivering it at the tail instead,
once, keeps the cached prefix; the recorded `deliveredToolGroups` stops it
being delivered twice. In-run activations are delivered by the
`activate_tools` result for that run and again, once, by the next turn's task,
since tool results are not part of the stored history.
