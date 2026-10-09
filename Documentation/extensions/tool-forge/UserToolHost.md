# UserToolHost

`extensions/tool-forge/UserToolHost.js`

Turns the published user tools into one McpAggregator tool set and runs their
calls through the sandbox.

## Methods

- `new UserToolHost({ store, configStore, sandbox, getAggregator, logger })`.
- `buildToolSet()`: `{ tools: [{ name, description (default
  'User-created tool "<name>".'), inputSchema }], handler }` from the published tools.
- `refresh()`: `registerExtension('user-tools', buildToolSet())`; false without
  an aggregator. The chat sees a publish or delete on its next turn.
- `handle(toolName, args)`: the aggregator handler; an unknown or unpublished
  tool is an error envelope `Unknown user tool "<name>".`
- `run(tool, args, overrides)`: config = stored + overrides; a missing
  required slot returns `{ success: false, error: 'This tool needs
  configuration before it can run. Missing: ... Setup → My Tools ...',
  missingConfig }` without running. Otherwise `sandbox.exec({ code, args,
  config, allowedHosts })`; success -> `JSON.stringify` -> `SandboxPolicy.capText`
  -> ToolOutputTruncator -> secret redaction, `{ success, result, truncated }`;
  failure -> redacted `{ success: false, error }`.
- `UserToolHost.SOURCE_ID` (`'user-tools'`; AgentToolCatalog groups
  `ext.user-tools` as `user_created_tools`).
