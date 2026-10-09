# StaticGroupTable

`core/llm-server/chat/tool-groups/StaticGroupTable.js`

Data only: the built-in lazy tool groups, frozen, in canonical prompt order.

## Members

- `StaticGroupTable.GROUPS`: `{ key, label, tools, stub, doc }` for
  `artifacts`, `live_artifacts`, `artifact_data`, `images`, `video`, `music`,
  `web`, `knowledge_base`, `code_validation`, `programmatic`.

`edit_artifact` belongs to both `artifacts` and `live_artifacts`, so editing a
live module never needs a second activation. `programmatic` is default-off via
`AgentToolCatalog.seedDefaultOffAgentTools`. Callers read copies through
[ToolGroups](../ToolGroups.md)`.staticGroups()`.
