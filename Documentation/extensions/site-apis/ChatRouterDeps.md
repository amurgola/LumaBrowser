# ChatRouterDeps

`extensions/site-apis/ChatRouterDeps.js`

Reaches the chat router the LLM server publishes on `global` (through `core/shell/extensions/ExtensionGlobals`):
`agentDeps()`, `aggregator()` (the MCP aggregator the dynamic `siteapi_*` tool set registers with) and
`chatStore()` (for the builder mode). Read on every call because the router does not exist yet when the extension
activates at boot. Same shape as the tool-forge extension's helper.
