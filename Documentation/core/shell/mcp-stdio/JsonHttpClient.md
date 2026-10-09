# JsonHttpClient

`core/shell/mcp-stdio/JsonHttpClient.js`

Minimal JSON-over-HTTP(S) client on Node built-ins.

## Methods

- `JsonHttpClient.request(method, url, { body?, timeout?, headers? })` resolves
  `{ status, data }` for any HTTP response, where `data` is the parsed JSON or
  `null` (empty or non-JSON body). A `body` is sent as JSON with content type
  and length. Rejects only on network failure or timeout
  (`timeout of <ms>ms exceeded`).

## Why

The stdio MCP server cannot use axios or fetch polyfills from `node_modules`
(see [McpServer](../McpServer.md)). Resolving on every status lets callers turn
HTTP errors into tool results instead of exceptions.
