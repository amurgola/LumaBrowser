# BrowserToolSchemas

`core/llm-server/chat/tool-schemas/BrowserToolSchemas.js`

JSON schemas for the browser tools, derived from
[BrowserTools](../../../llm-service/BrowserTools.md)`.TOOL_DEFINITIONS`.

## Methods (all static)

- `build(allows)`: one schema per allowed definition, with its `required` list.
  `tabId` descriptions are prefixed `Use -1 (the active working tab). ` because
  the agent works one lazy tab.
- `paramToSchema(typeStr)`: a type-string starting `number`, `boolean`,
  `array` or `object` maps to that JSON type, anything else to `string`; the
  whole type-string is kept as the description. Arrays get
  `items: { type: 'object' }`.
