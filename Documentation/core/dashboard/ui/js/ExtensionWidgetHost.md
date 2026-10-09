# ExtensionWidgetHost

`core/dashboard/ui/js/ExtensionWidgetHost.js`

Builds the `host` object an extension's Dashboard widget receives.

## Methods (static)

- `create(api, extensionId)` -> a plain object of closures (widget code may
  destructure it):
  - `extensionId`.
  - `call(method, ...args)`: `dashboardAPI.ext.call(extensionId, method, args)`
    unwrapped: resolves the result, throws the host error (or
    `extension call failed`). Only methods the extension's manifest lists under
    `dashboard.api` succeed ([ExtensionApiCall](../../../shell/extensions/ExtensionApiCall.md)).
  - `onEvent(cb)` -> detach: the extension's `{ type, payload }` events over
    `dashboardAPI.ext.onEvent` ([DashboardEventBroadcast](../../../shell/extensions/DashboardEventBroadcast.md));
    a no-op detach without a callback.
  - `openTab(url)`: a real browser tab through `dashboardAPI.liveApi.openTab`;
    throws the host error.
  - `openChat()`: focuses the LLM tab (`dashboardAPI.openChat(null)`); resolves
    whether it opened.
