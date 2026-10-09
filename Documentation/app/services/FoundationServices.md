# FoundationServices

`app/services/FoundationServices.js`

Builds the services everything else leans on, over the one settings database.

## Methods

- `new FoundationServices(ctx)`; `build()` adds to `ctx.services`:
  - `historyService`, `bookmarkService` (over the db), `faviconCache` at
    `<userData>/favicons.json`;
  - `lmStudioService` ([OpenAICompatibleProvider](../../core/llm-service/providers/OpenAICompatibleProvider.md)),
    `anthropicService`, `llmService` over both, `llmQueueManager` set as its queue;
  - `networkWatcherService`, `networkInterceptor` over it;
  - `machineIdentity` (`LUMA_MACHINE_ID` honoured), `telemetryConsent`
    (`isDev` counts as opted out), `pulseService` over both;
  - `chromeExtensionService`, `adblockerService` (store and engine cache in the data folder);
  - `apiSecurity`;
  - `activityLogService` over its own `<dataDir>/activity-log.db`, with the
    callers `core.browser`, `core.llm`, `core.shell` registered.
