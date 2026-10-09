# BrowserTools

`core/llm-service/BrowserTools.js`

The browser tools the in-app chat agent reads about and calls. Callers pass
the class itself around as `browserTools` (LLMService, AgentRunner,
AgentChatBridge), so every member is static and none uses `this`.

## Methods (all static)

- `TOOL_DEFINITIONS`: `[{ name, description, params: { name: 'type (doc)' }, required? }]`,
  the prose docs local models read. Names must equal
  `BrowserActions.chatActionIds()` (tested). `required` is also enforced at
  the agent's dispatch point; `tabId` is never required.
- `getToolPrompt(toolNames?)`: the fenced ```` ```tool ```` instructions plus
  one line per (filtered) tool.
- `executeTool(toolName, params, browserService, defaults = {})`: see
  [BrowserToolExecutor](tools/BrowserToolExecutor.md).
- `parseToolCalls(content)`, `parseToolCall(content)`,
  `fixIllegalJsonEscapes(text)`: see [ToolFenceParser](tools/ToolFenceParser.md).
- `normalizeToolCall(value)`: see [ToolCallNormalizer](tools/ToolCallNormalizer.md).
