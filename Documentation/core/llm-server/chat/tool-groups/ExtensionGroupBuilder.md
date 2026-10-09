# ExtensionGroupBuilder

`core/llm-server/chat/tool-groups/ExtensionGroupBuilder.js`

Turns discovered extension and MCP tools into lazy tool groups.

## Methods (all static)

- `groupsFor(extTools)`: one group per tool `{ key: name, label: name,
  tools: [name], stub: "<description> (<name>).", doc, isExtension: true }`,
  except tools of a [merged source](MergedSourceTable.md), which share one
  group keyed by the source spec, placed at its first tool's position, whose
  doc is its tools' lines joined by a blank line in registration order.
  Non-array input gives `[]`.
- `toolDoc(tool)`: `EXTENSION TOOL (...):\n- name: description Params: { "a": type, "b": type? (desc) }`.
  `?` marks optional params, a missing type is `string`, a missing description
  is `extension tool`.
