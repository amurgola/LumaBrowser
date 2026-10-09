# McpAggregator

`core/shell/McpAggregator.js`

Collects MCP tool sets from core services and extensions into one tool list,
routes each call to the set that owns the tool, and applies the external-MCP
disabled-tool list.

## Tool set shape

`{ tools: [{ name, description, inputSchema, ...extra }], handler(toolName, args, opts) }`

The handler returns an MCP result (see [McpResult](McpResult.md)). It receives
`opts` as a third argument; handlers written for `(toolName, args)` ignore it.

## Methods

- `registerCore(sourceId, toolSet)`: source id as given, e.g. `core.browser`.
- `registerExtension(extensionId, toolSet)`: source id `ext.<extensionId>`.
  Registering the same source again replaces it.
- `unregisterExtension(extensionId)`: runtime disable of an extension.
- `setDisabledTools(toolNames)`: replaces the external-MCP denylist.
- `getAllTools()`: every enabled tool definition, in registration order. This is
  what external MCP clients see (`GET /api/mcp/tools`).
- `getRegisteredTools()`: every tool including disabled ones, as
  `{ name, description, inputSchema, source }` (in-app agent catalog).
- `getToolDefinitions()`: `Map<name, rawDefinition>`, first source wins, for
  callers that need extra fields such as `mutating`.
- `getAvailableToolsList()`: `{ name, description, source, enabled }` for the
  settings UI.
- `getStats()`: `{ [sourceId]: toolCount }`.
- `handleToolCall(toolName, args, opts = {})` routes to the first set that lists
  the tool and has a handler. Throws `tool "<name>" is disabled` (unless
  `opts.ignoreDisabled`) or `unknown tool "<name>"`. Other `opts`: `emit`
  (live-event sink so a tool can stream progress), `chat` (`{ conversationId,
  assistantMessageId, onArtifact }` so a delegating tool can bubble artifacts
  back). Both pass through untouched.

## Mapping for callers

| Legacy call | New call |
|---|---|
| `mcpAggregator.registerCore(id, set)` | same |
| `mcpAggregator.registerExtension(id, set)` | same |
| `mcpAggregator.unregisterExtension(id)` | same |
| `mcpAggregator.setDisabledTools(names)` | same |
| `mcpAggregator.getAllTools()` | same |
| `mcpAggregator.getRegisteredTools()` | same |
| `mcpAggregator.getAvailableToolsList()` | same |
| `mcpAggregator.getStats()` | same |
| `mcpAggregator.handleToolCall(name, args, opts)` | same |
| reading `mcpAggregator.toolSets` directly (`core/llm-service/AgentToolCatalog.js` `_rawToolDefs`) | `mcpAggregator.getToolDefinitions()` |
| reading `mcpAggregator.disabledTools` | not exposed; use `getAvailableToolsList()` |

## Why

The disabled list only governs the external MCP surface. The in-app agent
enforces its own allow and deny lists, so it reads `getRegisteredTools()` and
calls with `ignoreDisabled`.
