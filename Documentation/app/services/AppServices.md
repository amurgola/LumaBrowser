# AppServices

`app/services/AppServices.js`

Builds every main-process service before the app is ready, in dependency order,
into `ctx.services`. Window-time services come later from
[WindowServices](../browser/WindowServices.md).

## Methods

- `new AppServices(ctx, { log? })`.
- `build()` returns `ctx.services`:
  1. [SettingsBoot](SettingsBoot.md)`.open()` -> `db`
  2. [FoundationServices](FoundationServices.md)
  3. [ModelServers](ModelServers.md), then [ModelStatusNotifier](../events/ModelStatusNotifier.md)`.watchAll`
  4. [GatewayServices](GatewayServices.md)
  5. [ChatTaskServices](ChatTaskServices.md)
  6. [TriggerServices](TriggerServices.md)
  7. [ExtensionHost](ExtensionHost.md)
  8. `SettingsBoot#markMigrated` (after the extension manager, as legacy)
  9. [SharingServices](SharingServices.md)
  10. [AuxiliaryServices](AuxiliaryServices.md)

## Service names

`db`; foundation: `historyService`, `bookmarkService`, `faviconCache`,
`lmStudioService`, `anthropicService`, `llmService`, `llmQueueManager`,
`networkWatcherService`, `networkInterceptor`,
`machineIdentity`, `telemetryConsent`, `pulseService`, `chromeExtensionService`,
`adblockerService`, `apiSecurity`, `activityLogService`; models:
`llmServerService`, `imageServerService`, `musicServerService`,
`whisperServerService`, `ttsServerService`, `groundingServerService`; gateway:
`ipcBridge`, `restGateway`, `cliHandshake`, `cliShim`, `idePlugin`,
`vscodeExtension`, `dashboardService`, `mcpAggregator`; chat tasks:
`artifactStore`, `artifactDataStore`, `liveApi`, `backgroundRunGate`,
`artifactTaskStore`, `artifactTaskScheduler`, `scheduledTaskStore`,
`scheduledTaskScheduler`, `emitSchedTasksEvent`, `ragService`; triggers:
`triggerStore`, `triggerEvents`, `emitTriggersEvent`, `triggerSecrets`,
`triggerRunner`, `pageChangeSource`, `hookBaseUrls`, `getHookBaseUrls`,
`fileWatchManager`, `notificationSource`, `hooksRouter`; `extensionManager`;
sharing: `sharingNotices`, `sharingHostService`, `sharingWebServer`,
`sharingTlsServer`, `rpcLendingService`, `sharingClientService`, `sharingPorts`;
`localApiServer`, `placementService`. The names match legacy `main.js`'s
variables.
