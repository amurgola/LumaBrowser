# McpResultUnwrapper

`core/llm-server/chat/bridge/tools/McpResultUnwrapper.js`

Turns an MCP tool result into the shape the agent loop threads back.

## Methods (all static)

- `unwrap(res)`: with an image part, `{ success, message (the text parts or
  'Image captured.'), imageBase64, mimeType }`; a first text part that parses
  to an object with `success` passes through flat; other JSON becomes
  `{ success, data }`; plain text `{ success, data: text }`; anything else
  `{ success, data: res }`. `success` is `!res.isError`.
