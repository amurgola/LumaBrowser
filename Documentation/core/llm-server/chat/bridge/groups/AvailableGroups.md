# AvailableGroups

`core/llm-server/chat/bridge/groups/AvailableGroups.js`

The lazy tool groups available for one turn.

## Methods (all static)

- `for(allows, extTools, { kbHasDocs = true })`: `ToolGroups.staticGroups()`
  plus `ToolGroups.extGroupsFor(extTools)`, kept when one of their tools passes
  `allows`, minus `knowledge_base` when `kbHasDocs` is false.
- `knowledgeBaseHasDocs(ragService, scope = 'kb')`: `ragService.count(scope) > 0`;
  false when absent or throwing.
- `KNOWLEDGE_BASE`, `DEFAULT_KB_SCOPE`.
