# WatcherMcpTools

`extensions/network-watcher/WatcherMcpTools.js`

The `watcher_*` MCP tools for the chat agent and external MCP clients. Each
call is routed to the core
[NetworkWatcherService](../../core/network-watcher/NetworkWatcherService.md)
and answered with a [McpResult](../../core/shell/McpResult.md) envelope.

## Tools

| Tool | Mutating | Reply (`structuredContent`) |
|---|---|---|
| `watcher_list` | no | `{ success: true, watchers, count }` |
| `watcher_add(urlPattern, sendTo, method?, note?)` | yes | `{ success: true, watcher, message: 'Network watcher created successfully' }` |
| `watcher_remove(id)` | yes | `{ success: true, message: 'Watcher deleted successfully' }` |
| `watcher_toggle(id, enabled)` | yes | `{ success: true, watcher, message: 'Watcher enabled successfully' }` (or `disabled`) |

`mutating: true` is read from the definition by `ApprovalGate.mutatingNamesOf`
(through `McpAggregator.getToolDefinitions` and `AgentToolCatalog`), so the
chat asks the user before a watcher is created, removed or toggled: a watcher
forwards matching traffic to a webhook.

Refusals come back as `McpResult.error` (`isError: true`, no
`structuredContent`):

- `Missing required field: urlPattern is required` / `sendTo is required` /
  `id is required`, `enabled field must be a boolean` (from
  [WatcherInput](WatcherInput.md), shared with the REST routes);
- the core model and service errors (`NetworkWatcher: sendTo must be an http
  or https URL, got "file:"`, `NetworkWatcher: sendTo must be a valid URL: ...`,
  `NetworkWatcher: urlPattern is required and must be a string`, `A watcher for
  pattern "..." with method "..." already exists`);
- `Watcher not found` for an unknown id.

`watcher_add` passes only `urlPattern`, `sendTo`, `method` and `note` to the
service: the model cannot set an id, counters, a stored capture or the capture
flags (which stay off, as legacy MCP-created watchers always were).

## Methods (static)

- `TOOLS`: the four definitions above; names, descriptions and schemas are the
  legacy ones, plus `mutating`.
- `handle(api, toolName, args = {})`: throws `Network Watcher is not active`
  without an API (`main.getApi()` is null while inactive) and `Unknown watcher
  tool: <name>` for an unknown name; a service throw becomes `McpResult.error`.
- `view(watcher)`: the watcher JSON the model reads, with
  `lastCapturedResponse.request` passed through
  `HeaderRedactor.redactCapturePayload`.

## Security

Every watcher a tool returns goes through `view`. Captures are already
redacted when recorded by `NetworkWatcherService.forwardToWebhook`, but a row
stored before that rule existed may still hold `Cookie` / `Authorization` /
`Set-Cookie` / `Proxy-Authorization`, so the stored capture is redacted again on
the way out. The redaction rule itself is unchanged.
