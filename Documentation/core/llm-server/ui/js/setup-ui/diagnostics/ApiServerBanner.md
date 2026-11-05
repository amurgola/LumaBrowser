# ApiServerBanner

`core/llm-server/ui/js/setup-ui/diagnostics/ApiServerBanner.js`

The Setup header's warning (`#apiServerBanner`, a `.luma-callout.bad` under the
page head in `llm-tab.html`) while the REST gateway is not listening. The page
then runs from its `file://` copy ([InternalTabLoader](../../../../../shell/InternalTabLoader.md)),
so no extension tab, Monaco or Dashboard can load; the banner says why, names
the program holding the port when the main process found it
([PortConflict](../../../../../../app/ready/PortConflict.md)), and links to
Settings > API & MCP. Rendered by [DiagnosticsLoader](DiagnosticsLoader.md)
after the cards.

## Methods

- `ApiServerBanner.render(doc, api, bannerId = 'apiServerBanner')`: `api` is
  `window.llmDiagAPI`; reads `api.apiServer.status()`
  ([AppLinksApi](../../../../preload/AppLinksApi.md)) and wires the
  `[data-open-settings]` button to `api.openAppSettings('apimcp')`. Hidden when
  the gateway listens, the API is off, the status is unreadable or the preload
  lacks the getter; never throws.
- `ApiServerBanner.view(status)`: `{ html }` for an enabled gateway that is not
  listening, else null. "port N is in use by <owner>" when the error or the
  diagnosed conflict says so (owner escaped), otherwise the escaped error text.

## Globals

Reads `document` by id.
