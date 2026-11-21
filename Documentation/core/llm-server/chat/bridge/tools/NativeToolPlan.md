# NativeToolPlan

`core/llm-server/chat/bridge/tools/NativeToolPlan.js`

Whether this run's model takes tools natively, which tools its family keeps out
of the array, and the array itself, which is fixed for the conversation.

## Methods

- `NativeToolPlan.forRun({ router, modelRef, override = null })`: enabled from
  `router.modelNativeToolsActive(modelRef)` (else `HarmonyModel.matches`);
  `override: 'off'` disables it except for harmony models. `exclude` from
  `router.modelNativeToolExclude(modelRef)` when enabled.
- `enabled`, `exclude`.
- `build(toolSet)`: null when disabled, else every allowed tool's real schema
  (`ToolSchemas.buildHarmonyTools({ allows, extTools })`) without the tools
  owned only by groups outside `toolSet.groups.registeredKeys()`
  ([LazySchemaStubber](../../tool-schemas/LazySchemaStubber.md)`.dropInactive`),
  then `call_tool` when the run has lazy groups at all
  (`ToolSchemas.callToolSchema`), minus the family's excluded names.
  `activate_tools` is always in it.
- `estimateTokens(toolSet)`: the array's `TokenEstimator` size, 0 when
  disabled or on failure.

## Why the array never changes

Chat templates render the tools ahead of everything else, so one schema added
mid-conversation moves every later token and the server reads the whole
prompt again. The array used to be rebuilt from the groups active at each
request: a tool of a group loaded mid-run got its real schema on the next
request. Measured 2026-11-20 on Inkling 2 Mini (a 27k token prompt, the
dashboard attached, the Hub tools to load): each activation cost a full
re-read, about 50 s, three times in one turn of four minutes.

Now the array is built from the registered groups
([ToolGroupState](../groups/ToolGroupState.md)`.registeredKeys`: the groups the
system prompt carries, frozen at the conversation's first turn), so it is
byte-identical on every request and every later turn. A tool of a group
loaded afterwards is not a registered function; the model runs it through
`call_tool`, which [CallToolCall](CallToolCall.md) unwraps, and its manual
says so ([ToolGroupState](../groups/ToolGroupState.md)`.callNote`). The same
turn then read its prompt once and each tool step added 0.4k to 1.3k tokens.

Inactive groups used to be registered as parameterless stubs when they fit a
quarter of the context window, and left out otherwise (DeepSeek-V4.1-Flash
on a 16k window, 2026-11-04: 98 schemas rendered to about 12k tokens and
overflowed the window). A stub could not stay a stub and take real arguments,
so the stubs went: every unregistered tool is reached the same way, whatever
the window, and the context share rule with them.
