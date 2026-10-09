# ToolSchemas

`core/llm-server/chat/ToolSchemas.js`

The OpenAI `tools` array for native-tool-calling turns. Harmony / gpt-oss
models will not emit a usable tool call unless the tools are registered
(llama.cpp discards a commentary-channel call to an unregistered function), and
opted-in families read the same array. Registered tools come back as native
`tool_calls`, which the router folds into the agent's ```` ```tool ```` fence,
so the rest of the agent loop is unchanged.

This is the JSON doc surface; [ToolGroups](ToolGroups.md) is the prose one.
Both must change together (see `ToolDocSurfaces.test.js`).

## Methods (all static)

- `buildHarmonyTools({ allows, extTools, activeGroups = null, groups = null })`:
  browser tools, pseudo-tools, extension tools, then `activate_tools` (always,
  in full). With `groups`, tools in inactive groups become parameterless stubs
  ([LazySchemaStubber](tool-schemas/LazySchemaStubber.md)); `activeGroups` may
  be a Set or an array. Without `groups` everything is full (harmony behaviour).
- `browserToolSchemas(allows)`: from `BrowserTools.TOOL_DEFINITIONS`
  ([BrowserToolSchemas](tool-schemas/BrowserToolSchemas.md)); `tabId` is
  steered to `-1`.
- `pseudoToolSchemas(allows)`: the chat pseudo-tools from
  [PseudoToolSchemaTable](tool-schemas/PseudoToolSchemaTable.md), each gated by
  `allows(name)`, in table order.
- `activateToolSchema()`, `extToolSchemas(extTools)` (description falls back
  to the name), `stubToolSchema(name, group)`, `paramToSchema(typeStr)`.
- `fenceFallbackDoc(names, schemas = null)`: the text-fence contract for tools
  a family keeps out of the native array, or `null` when none
  ([FenceFallbackDoc](tool-schemas/FenceFallbackDoc.md)). Reads every
  pseudo-tool unless `schemas` is given.
- `MIN_EVERY_MINUTES`, `MAX_EVERY_MINUTES`: the schedule bound
  ([ScheduleBounds](tool-groups/ScheduleBounds.md)).

Every call returns fresh objects ([FunctionSchema](tool-schemas/FunctionSchema.md)
deep-copies properties).

## Why

The full set is about 4000 tokens, 12% of a 32k window, on every request;
stubbing inactive groups gives the native path the same saving the prose path
gets from lazy groups (a native run at 32k once hit "Context size has been
exceeded"). The pseudo-tool descriptions carry the same teaching as the prose,
not terse labels: a native-path model reads only these, and llama.cpp's jinja
templating does not enforce `required`.
