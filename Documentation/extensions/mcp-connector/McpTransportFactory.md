# McpTransportFactory

`extensions/mcp-connector/McpTransportFactory.js`

Builds the MCP SDK client transport for a server config.

## Methods

- `build(config)`: `StdioClientTransport(stdioOptions(config))` for `stdio`;
  `SSEClientTransport(url, { requestInit })` for `sse`;
  `StreamableHTTPClientTransport(url, { requestInit })` otherwise. SDK modules
  are required lazily.
- `McpTransportFactory.stdioOptions(config, platform = process.platform, env = process.env)`:
  `{ command, args, cwd (undefined when empty), env: { ...env, ...config.env }, stderr: 'pipe' }`.
  On `win32`, a command in `WIN_SHELL_LAUNCHERS` (npx, npm, npm.cmd, npx.cmd,
  uvx, uv, yarn, pnpm, bunx, bun, deno; case-insensitive) runs as
  `COMSPEC (or cmd.exe) /c <command> ...args`, because spawn cannot run those
  `.cmd` shims without a shell.
- `McpTransportFactory.requestInit(headers)`: `{ headers: copy }`, or
  undefined with no headers.
