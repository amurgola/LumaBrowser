# FoundationServices

`app/services/FoundationServices.js`

Builds the services everything else leans on, over the one settings database.

## Methods

- `new FoundationServices(ctx)`; `build()` adds to `ctx.services`:
  - `historyService`, `bookmarkService` (over the db), `vaultService`
    ([VaultService](../../core/vault/VaultService.md), the password manager), `faviconCache` at
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

## Chrome extension bridge

`_buildBrowserAddOns()` creates the `ChromeExtensionService` with a new
[ShimBridge](../../core/chrome-extensions/bridge/ShimBridge.md).

## Vault wiring

`_wireVault()` installs the vault's redactor (VaultRedaction), the approval-card resolver (VaultCallText) and mirrors
the vault audit into the activity log as caller `core.vault` (only when the service supports `forCaller`).

It also installs the key placeholder resolver (`VaultPlaceholders.install` -> `vault.agent.resolveKeys`).

`newTabPage` ([NewTabPage](../../core/browser/newtab/NewTabPage.md)) over the db, history and favicon cache.
