# McpServerConfig

`extensions/mcp-connector/McpServerConfig.js`

Shapes and checks a user-supplied server config before it is stored.

## Methods (all static)

- `normalize(input)`: `{ name (trimmed), transport, enabled (default true) }`
  plus, for `stdio` (also the fallback for an unknown transport):
  `command` (trimmed), `args` (tokenized), `env` (string map), `cwd` (or null);
  for `http`/`sse`: `url` (trimmed), `headers` (string map). Fields of the
  other transport are dropped. String maps keep non-empty keys with non-null
  values, as strings.
- `validate(config)`: throws `Server name is required`,
  `A command is required for a stdio server`,
  `A URL is required for an HTTP/SSE server`, `The URL is not valid`.
- `tokenizeArgs(value)`: an array is stringified; a string is split on
  whitespace honouring simple double quotes (`-y "@scope/x" /data` ->
  `['-y', '@scope/x', '/data']`).
- `TRANSPORTS`: `stdio`, `http`, `sse`.
