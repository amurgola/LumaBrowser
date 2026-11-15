# PromptApiIpcHandlers

`core/prompt-api/PromptApiIpcHandlers.js`

IPC controller for the Settings switch "Local model for web pages"
([PromptApiSwitch](../../ui/shell/settings/general/PromptApiSwitch.md)). Routes
only; the logic is in [PromptApiService](PromptApiService.md). Registered by
[CoreIpcRegistrar](../../app/ipc/CoreIpcRegistrar.md) when the service exists.

## Methods

- `new PromptApiIpcHandlers(service)`.
- `register()` handles (`CHANNELS`):
  - `core.promptApi.getStatus` -> `service.status()` (`{ enabled, running }`)
  - `core.promptApi.setEnabled(enabled)` -> `{ success: true, status }`
