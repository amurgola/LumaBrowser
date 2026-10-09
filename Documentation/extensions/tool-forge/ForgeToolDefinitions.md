# ForgeToolDefinitions

`extensions/tool-forge/ForgeToolDefinitions.js`

The `create_tool`, `test_tool` and `publish_tool` definitions. Their
descriptions are the model's manual (local models read the prose, not the
schema), so the build workflow and the sandbox contract live here.

## Members (static)

- `RUN_CONTRACT`: the sandbox contract appended to create_tool's description
  (`async function run(args, ctx)`, no require/Node/fs/DOM, `ctx.fetch`,
  `ctx.luma.fetchPage`, `ctx.luma.openTab`, allowedHosts only, secrets via
  `ctx.config`).
- `CREATE_TOOL` (required `name`, `description`, `code`; optional `label`,
  `inputSchema`, `configSlots`, `allowedHosts`), `TEST_TOOL` (`name`, `args`,
  `configOverrides`), `PUBLISH_TOOL` (`name`).
- `TOOLS`: the three, in that order (what `mcp-tools.js` exports as `tools`).
