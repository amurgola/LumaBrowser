# PinnedLlmTab

`core/llm-server/service/PinnedLlmTab.js`

The pinned, non-closeable "LLM" tab: creates and removes it, brings it forward
with a message for its renderer, and keeps its load from stranding on an error page.

## Methods

- `new PinnedLlmTab({ rootDir, isEnabled })`. Public fields: `tabHtmlPath`
  (`<rootDir>/ui/llm-tab.html`), `tabHtmlFileUrl`, `tabHtmlUrl` (file:// until
  `setWebBaseUrl`), `tabPreloadPath` (`<rootDir>/llm-tab-preload.js`),
  `tabViewManager`, `pinnedTabId`, `tabLoadedOk`. The first three URL fields plus
  `tabLoadedOk` are the [InternalTabLoader](../../shell/InternalTabLoader.md) host contract.
- `setWebBaseUrl(baseUrl)` `tabHtmlUrl = <base without trailing slashes>/llm-ui/llm-tab.html`; falsy keeps file://.
- `attach(tabViewManager)` and forget the id when that tab is closed underneath.
- `ensure({ activate = false })` null while the feature is off or unattached;
  reuses a live tab (switching to it when `activate`), else creates
  `{ pinned: true, kind: 'llm', title: 'LLM', activate, preloadPath }` and wires
  `InternalTabLoader.wire(this, wc)`. Returns the id.
- `remove()` `closeTabInternal(id)` (bypasses the pinned close protection); a failure only warns.
- `openIn(channel, payload = null)` ensures and activates, sends the message
  (deferred to `did-finish-load` for a tab this call created that is still
  loading); false without a tab.
- `send(channel, payload)` to the existing tab only; never creates one.
- `notifyGatewayReady()` `InternalTabLoader.reloadIfStale` for a live tab.
- Statics: `GATEWAY_PATH`, `TITLE`, `KIND`.

## Why

The tab is served over the REST gateway so users see a clean URL, with the
file:// fallback for a gateway that is off or not bound yet. On first run the
tab is created minutes before the deferred gateway starts, so without the reload
it would stay blank until restart. Its own preload exposes only `llmDiagAPI`, so
pages in other tabs cannot reach the diagnostics channels.
