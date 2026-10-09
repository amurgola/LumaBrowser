# RunToolSet

`core/llm-server/chat/bridge/tools/RunToolSet.js`

The tool set of one agent run.

## Methods

- `new RunToolSet({ router, deps, modelRef, allowedTools = null, extraTools =
  null, refreshAllowedTools = null, kbScope = null, conversationId = null })`.
  Fields: `visionActive`, `mcpAggregator`, `allows(name)` (bound), `injected`
  ([ExtraTools](ExtraTools.md)), `extTools` (allowed discovered tools),
  `extToolNames`, `allExtTools` (discovered then mode tools), `requiredArgs`
  (`ToolRequiredArgs`), `mutatingDeclared`, `kbScope` (`'kb'` default),
  `groups` ([ToolGroupState](../groups/ToolGroupState.md), mode tools forced
  active, knowledge base only with documents).
- `allows(name)`: false for `screenshot`/`click_at` without vision, false for
  `locate` without a grounding model, else the allow-list (a copy; null is
  unrestricted).
- `runToolList({ allowTakeover })`: the names AgentRunner gates on; undefined
  when unrestricted and vision is on. Without vision the full catalog
  (`AgentToolCatalog.getAllToolNames` plus extension tools) minus vision-only
  tools. `activate_tools` (and `ask_user_takeover` when allowed) is always
  added. The returned array is kept live.
- `admitCatalogChanges()`: under a fresh policy from `refreshAllowedTools`
  (none: admit nothing; a throw: nothing; undefined: unrestricted),
  `ToolAdmission.admitNewTools` against `getDynamicTools`; admitted tools join
  `extTools`, the allow-list and the live run list, the index and groups are
  rebuilt and their groups activated. Returns the admitted tools.
- `VISION_ONLY_TOOLS`, `ACTIVATE_TOOLS`, `TAKEOVER_TOOL`.
