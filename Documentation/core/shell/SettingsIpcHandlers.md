# SettingsIpcHandlers

`core/shell/SettingsIpcHandlers.js`

IPC controller for `core.settings.*`. It routes only; the work is in the
classes under [core/shell/settings/](settings/). Replies are raw values (not
enveloped), the shapes the renderer has always read.

## Methods

- `new SettingsIpcHandlers({ db, restGateway, mcpAggregator, apiSecurity,
  mainWindowGetter, rootDir, onSetupFinalized?, cliShim?, idePlugin?, vscodeExtension? })`.
- `register()` registers the 52 channels below.

## Channels

| Channels | Routes to |
|---|---|
| `cliShim.status/install/uninstall` | [OptionalServiceCall](settings/OptionalServiceCall.md) over [CliShim](CliShim.md) |
| `idePlugin.status/install(ids)/uninstall(ids)` | OptionalServiceCall over [IdePluginInstaller](IdePluginInstaller.md), ids via `ideIds` |
| `vscodeExtension.status/install(ids)/uninstall(ids)` | OptionalServiceCall over [VscodeExtensionInstaller](VscodeExtensionInstaller.md) |
| `getApiPort`, `getEffectiveApiPort`, `setApiPort`, `get/setApiEnabled`, `get/setMcpEnabled` | [ApiServerSettings](settings/ApiServerSettings.md) |
| `getPersona`, `setPersona` | [OnboardingPersona](settings/OnboardingPersona.md) |
| `get/setAutoCheckUpdates`, `get/setDnsProvider`, `get/setShowBookmarksBar` | [AppPreferences](settings/AppPreferences.md) |
| `getGuide(type)` | [SettingsGuides](settings/SettingsGuides.md) |
| `get/setRunOnStartup`, `getStartupConfig`, `setStartHidden` | [StartupSettings](settings/StartupSettings.md) |
| `relaunch` | `app.relaunch()` then `app.exit(0)`; the "Restart now" link |
| `exportMcpConfig` | [McpServerEntry](settings/McpServerEntry.md) with a save dialog (`luma-mcp-config.json`) |
| `harness.list/connect(id)/disconnect(id)/writeSkills` | [AgentHarnessSettings](settings/AgentHarnessSettings.md) |
| `get/setSetupComplete`, `resetSetupComplete`, `setDisabledExtensions`, `setWebhookUrl` | [SetupCompletion](settings/SetupCompletion.md) |
| `testWebhook(url)` | [WebhookTester](settings/WebhookTester.md) |
| `getAvailableEndpoints`, `setEndpointConfig` | [EndpointSettings](settings/EndpointSettings.md) |
| `apiSecurity.get/revealKey/setNetworkMode/setWhitelist/setRequireApiKey/createKey/updateKeyLabel/refreshKey/deleteKey` | [ApiSecuritySettings](settings/ApiSecuritySettings.md) |
