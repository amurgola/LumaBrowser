# ToolGroups

`core/llm-server/chat/ToolGroups.js`

The chat agent's lazy tool-group registry, and the prose doc surface for its
tools. Each capability is a group with two faces: a one-line `stub` always
shown in an inactive registry, and a full `doc` (manual) spliced into the
system prompt only once the group is active for the conversation. The model
activates a group with the `activate_tools` meta-tool, or by calling one of
its tools directly (the bridge auto-activates and hands back the doc).
Active groups persist per conversation in
`llm_conversation_meta.data.activeToolGroups`.

[ToolSchemas](ToolSchemas.md) is the JSON twin of this surface.

## Methods (all static)

- `staticGroups()`: fresh copies of the built-in groups
  `{ key, label, tools, stub, doc }` in canonical render order
  ([StaticGroupTable](tool-groups/StaticGroupTable.md)). A group is available
  when one of its tools passes the host allow-list.
- `extGroupsFor(extTools)`: lazy groups for discovered extension/MCP tools,
  one per tool, except merged sources (desktop, games, tool forge) which share
  one group ([ExtensionGroupBuilder](tool-groups/ExtensionGroupBuilder.md)).
- `extToolDoc(tool)`: the full manual line for one discovered tool.
- `groupForTool(name, groups)`: key of the first group owning the tool, or
  `null` (browser tools belong to no group).
- `buildInactiveRegistry(inactiveGroups)`: the activate_tools manual, one
  `  - key: stub` line per available-but-inactive group, then the "match the
  request and USE it" directive ([ActivationManual](tool-groups/ActivationManual.md)).
  `''` when nothing is left to activate.
- `docWithoutFenceExamples(doc)`: the manual minus its `{ "tool": ... }`
  examples, for native-tool routes ([FenceExampleStripper](tool-groups/FenceExampleStripper.md)).
- `carriesGeneratedPayload(toolName, params)`: whether a call to an inactive
  tool already carries generated content and should skip the bounce
  ([GeneratedPayload](tool-groups/GeneratedPayload.md)).
- `ACTIVATE_TOOL_DOC`, `PAYLOAD_TOOLS`.

The manuals themselves are data classes: [ArtifactManuals](tool-groups/ArtifactManuals.md),
[MediaManuals](tool-groups/MediaManuals.md), [UtilityManuals](tool-groups/UtilityManuals.md).

## Why

A Tools-on turn used to ship every manual on every turn, even for a one-line
answer. Lazy groups keep the default prompt small; the manuals are written
long on purpose because a weak local quant reads nothing else.
