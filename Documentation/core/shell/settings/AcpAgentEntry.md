# AcpAgentEntry

`core/shell/settings/AcpAgentEntry.js`

The command an editor runs to get LumaBrowser as an Agent Client Protocol agent
(`luma acp`, see [AcpCommand](../../../cli/lib/acp/AcpCommand.md)).

## Methods (static)

- `build({ cliShim, exists? })` -> `{ command, args, env }` or null without a
  [CliShim](../CliShim.md) (a build with no CLI): the app binary (`cliShim.exePath`)
  in Node mode (`env.ELECTRON_RUN_AS_NODE = '1'`) on `luma.js acp`. The script is the
  copy the terminal command installed (`cliShim.cliScript()`) when it exists, since an
  AppImage's own resources vanish when it unmounts; else the bundled copy under
  `cliShim.cliSource`.

Handed to [AgentHarnessSettings](AgentHarnessSettings.md) as `endpoints.acp` by
[SettingsIpcHandlers](../SettingsIpcHandlers.md).
