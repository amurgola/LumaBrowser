# TriggerServices

`app/services/TriggerServices.js`

Builds reactive triggers.

## Methods

- `new TriggerServices(ctx)`; `build()` adds:
  - `triggerStore`; `triggerEvents` and `emitTriggersEvent` ([TriggerEvents](../events/TriggerEvents.md));
    `triggerSecrets`;
  - `triggerRunner` on the shared `backgroundRunGate`, with the desktop
    [TriggerNotifier](../events/TriggerNotifier.md) and configured agents from
    `global.__lumaAgentManager`;
  - `pageChangeSource` over `extensionManager.getApi('page-change-detector')`
    (null until that extension is active), also set as `triggerRunner.pageSource`;
  - `hookBaseUrls` / `getHookBaseUrls` ([HookBaseUrls](../sharing/HookBaseUrls.md));
  - `fileWatchManager` ([FileWatchSource](../../core/llm-server/chat/triggers/FileWatchSource.md)),
    never watching the app path, the data folder or the managed models base;
  - `notificationSource` over the window's TabViewManager;
  - the core `trigger` chat mode, registered;
  - `hooksRouter` ([WebhookSource](../../core/llm-server/chat/triggers/WebhookSource.md)), mounted at `/hooks`.
