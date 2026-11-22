# StaticGroupTable

`core/llm-server/chat/tool-groups/StaticGroupTable.js`

Data only: the built-in lazy tool groups, frozen, in canonical prompt order.

## Members

- Stubs are plain sentences without all-caps emphasis (the `live_artifacts` stub still
  spells out the call shape, since a model may call it before loading the manual).
- `rulesFirst: true` on `images`, `video` and `music`: a call into one of these before it
  is loaded is sent back with the doc instead of run
  ([AutoActivation](../bridge/groups/AutoActivation.md)), because the doc decides what the
  call should say and a wrong call costs a render. Every other group's first call runs.
- `StaticGroupTable.GROUPS`: `{ key, label, tools, stub, doc, rulesFirst? }` for
  `artifacts`, `live_artifacts`, `artifact_data`, `images`, `video`, `music`,
  `web`, `knowledge_base`, `code_validation`, `programmatic`.

`edit_artifact` belongs to both `artifacts` and `live_artifacts`, so editing a
live module never needs a second activation. `programmatic` is default-off via
`AgentToolCatalog.seedDefaultOffAgentTools`. Callers read copies through
[ToolGroups](../ToolGroups.md)`.staticGroups()`.

## Password manager

The `vault` group (Password manager): `vault_list`, `vault_fill`, manual `UtilityManuals.VAULT`.
