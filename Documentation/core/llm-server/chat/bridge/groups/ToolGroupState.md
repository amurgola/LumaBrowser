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
- `refresh(allows, extTools)`: re-derives `available` after admission; keys only grow.
- `docsFor(keys)`, `owningGroups(name)`, `groupFor(name)`
  (`ToolGroups.groupForTool`), `keysOwning(names)`.

Persistence (`setMeta(id, { data: { ...data, activeToolGroups } })`) is
best-effort and skipped for a conversation `getConversation` does not know
(the sharing proxy's throwaway ids).
