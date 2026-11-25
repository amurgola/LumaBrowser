# mcp-tools

`extensions/android/mcp-tools.js`

MCP tools entry of the Android add-on, loaded by name from the manifest and registered by core as the source
`ext.android`.

## Exports

- `tools`: [AndroidToolSet](tools/AndroidToolSet.md)`.TOOLS`.
- `handler(toolName, args)`: answered by the running extension's [AndroidToolCalls](tools/AndroidToolCalls.md).
