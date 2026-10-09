# AiChatRunRequest

`extensions/ai-chat/AiChatRunRequest.js`

Turns ai_chat_run input (MCP arguments or a REST body) into AgentRunner run
options with the front doors' shared defaults.

## Methods

- `AiChatRunRequest.isValidPrompt(prompt)` true for a non-empty string.
- `AiChatRunRequest.toRunOptions(input, defaultTimeoutMs)` -> `{ prompt,
  tabId (Number, undefined when null), autoCloseTab (default true),
  includeScreenshot (boolean), maxIterations (default 15), timeout (default
  defaultTimeoutMs), tools (arrays only), systemPromptAppend (empty -> undefined) }`.
- `MCP_TIMEOUT_MS` 300000, `REST_TIMEOUT_MS` 120000, `DEFAULT_MAX_ITERATIONS` 15.
