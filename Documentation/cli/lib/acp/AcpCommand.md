# AcpCommand

`cli/lib/acp/AcpCommand.js`

`luma acp [--agent <name>] [--yes] [--no-start]`: LumaBrowser as an Agent Client
Protocol agent over stdio, for the editors that host ACP agents (JetBrains Air,
Zed, ...). Routed by [AgentCli](../AgentCli.md) before the shared argument parser.

## Methods (static)

- `parse(argv)` -> `{ agent, yes, noStart, help }`; throws on an unknown argument.
- `run(argv, { stdin?, stdout?, stderr?, connect?, version? })` resolves the exit
  code: 1 with the help on stderr for bad arguments, 0 after `--help` (stdout), else
  it wires a [JsonRpcStdio](JsonRpcStdio.md) on stdin/stdout to an
  [AcpAgent](AcpAgent.md) (`--agent` and `--yes` as its defaults), logs
  `luma acp: ...` lines on stderr, and returns 0 when the editor closes stdin.
- `connect(opts, log)`: [AppDiscovery](../connect/AppDiscovery.md) (auto-start
  unless `--no-start`) then [BridgeConnector](../connect/BridgeConnector.md).
- `version()`: the CLI package version.

## Registering

JetBrains Air: `~/.jetbrains/acp.json`

```json
{ "agent_servers": { "LumaBrowser": { "command": "<app binary>", "args": ["<cli>/bin/luma.js", "acp"], "env": { "ELECTRON_RUN_AS_NODE": "1" } } } }
```

Settings > LLM > Connect your agent > JetBrains Air writes this entry
([JetBrainsAirConnector](../../../core/shell/harness-connections/connectors/JetBrainsAirConnector.md),
command from [AcpAgentEntry](../../../core/shell/settings/AcpAgentEntry.md)). Any
`luma` on PATH works too: `"command": "<path to luma>", "args": ["acp"]`.
