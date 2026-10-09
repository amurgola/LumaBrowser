# LiveApi

`core/llm-server/chat/LiveApi.js`

The host side of a live artifact's injected `luma` value. Live modules are
sandboxed renderer code: they cannot fetch external pages (CORS) and have no tab
access, so this class reads pages and opens tabs for them.

## Methods

- `new LiveApi({ getAgentDeps, getExtensionManager?, fetcher = SafeFetch.fetch })`:
  `getAgentDeps()` returns `{ browserService }` or null and is read on every
  call (the browser may arrive later); `getExtensionManager()` likewise
  (extensions activate after boot). `fetcher` is a test seam. Construct ONE instance and share
  it between the IPC handlers and the gateway route so the fetch cap is global.
- `fetchPage({ url, mode?, timeoutMs?, maxChars? })`: never rejects. Runs
  through a [FetchQueue](live-api/FetchQueue.md) (2 concurrent, 8 queued),
  validates with [LivePageRequest](live-api/LivePageRequest.md) (error
  `fetchPage needs an absolute http(s) URL.`) and reads with
  [LivePageFetch](live-api/LivePageFetch.md), using a
  [SilentTab](web-tools/SilentTab.md) in the shared `persist:websearch` partition
  when a browser is available. Success:
  `{ success: true, url, content, truncated, totalChars, status? | viaBrowser? }`.
- `openTab({ url })`: opens a real, focused user tab
  (`browserService.createTab(url, { kind: 'user' })`) and returns
  `{ success: true, tabId }`; errors `openTab needs an absolute http(s) URL.`,
  `The browser is not available yet.`, or the createTab error message.
- `extCall({ extensionId, method, args })`: a live module's
  `luma.ext(id).call(...)`, through
  [ExtensionApiCall](../../shell/extensions/ExtensionApiCall.md) (only methods
  the extension's manifest publishes); `Extensions are not available yet.`
  before the manager exists. Never rejects.
- `LiveApi.validHttpUrl(url)`: the parsed href for absolute http(s), else null.
- Statics `MAX_CONCURRENT` (2), `MAX_QUEUED` (8).

## Why

It reuses the chat agent's page-reading machinery but returns RAW content: the
widget's code parses it, unlike `web_search`, which formats for a model. The
module code is model-authored and runs in the app, so the hard boundaries are
SafeFetch's SSRF guard (private and IP-literal targets refused, and never
retried in the browser tab), http(s)-only URLs and the concurrency cap. Remote
surfaces (LAN sharing PWA, public `/share`) deliberately get no endpoint: a
shared viewer must not drive this machine's browser.

Exposed on desktop surfaces over IPC (`core.llmServer.liveApi.fetch`,
`core.llmServer.liveApi.openTab`, `core.llmServer.liveApi.extCall`), to the pop-out doc over the gateway
(`POST /artifacts/api/fetch`), and to Tool Forge's sandbox.
