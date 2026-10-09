# StdioJsonRpc

`core/shell/mcp-stdio/StdioJsonRpc.js`

Newline-delimited JSON-RPC 2.0 over an input and output stream (the MCP stdio
transport). Node built-ins only.

## Methods

- `new StdioJsonRpc({ input, output, handleRequest(method, params), onClose? })`.
- `open()` starts reading lines; `close()` stops; `isOpen`.
- `handleLine(line)`: requests (string `method` and non-null `id`) are answered
  with `handleRequest`'s result. `undefined` becomes `-32601 Method not found`,
  a throw becomes `-32603` with its message. Blank lines, notifications (no id)
  and responses (no method) get no reply. Unparseable JSON is `-32700 Parse error`
  and a non-object is `-32600 Invalid Request`, both with `id: null`.

## Why

When the client closes the input stream the server must shut down, but requests
already read still get their reply first; `onClose` runs only after every
in-flight reply is written.
