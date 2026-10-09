# ToolNames

`extensions/tool-forge/ToolNames.js`

Name bookkeeping for user tools.

## Methods

- `new ToolNames({ store, getExistingNames })`.
- `collides(name)`: another catalog tool (not one of the forge's records) has it.
- `freeName(base)`: `base`, `base_2`, `base_3`, ... free of records and collisions.
- `summary(exceptName)`: `["<name> (<status>)", ...]`.
- `notFound(name)`: `{ success: false, error: 'No tool named "<name>". Your
  existing tools: ... Use one of those exact names, or create_tool to start a
  new one.' (or '... Create it first with create_tool.'), existingTools }`.

## Why

The summary rides on results and not-found errors so a model whose earlier
results were culled from context recovers the draft name instead of minting a
duplicate (seen live: `clickup_post` next to `clickup_post_message`).
