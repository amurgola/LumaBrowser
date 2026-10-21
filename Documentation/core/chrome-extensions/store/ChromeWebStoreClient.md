# ChromeWebStoreClient

`core/chrome-extensions/store/ChromeWebStoreClient.js`

Talks to the Chrome Web Store's public update service
(`clients2.google.com/service/update2/crx`).

## Methods

- `new ChromeWebStoreClient({ fetchImpl, chromeVersion, timeoutMs })`: all
  optional. `fetchImpl` defaults to Electron's `net.fetch` (system proxy, like a
  tab) and falls back to global `fetch`; `chromeVersion` defaults to
  `process.versions.chrome`.
- `ChromeWebStoreClient.resolveId(input)`: a bare 32-letter id, or the id inside
  any store URL (`chromewebstore.google.com/detail/<slug>/<id>`, the legacy
  `chrome.google.com/webstore/detail/...` and `?id=` forms); `null` otherwise.
- `ChromeWebStoreClient.detailUrl(id)`: the store listing.
- `downloadUrl(id)` / `updateCheckUrl(id, version)`: the update-service URLs.
- `downloadCrx(id)`: the `.crx` bytes. Throws for 204/404 ("does not serve"),
  other HTTP errors, an empty body, a body over 64 MB, a timeout, or a network
  failure.
- `latestVersion(id)`: the version the store serves, or `null`.
- `ChromeWebStoreClient.parseUpdateCheck(xml)`: the `<updatecheck>` version
  when its status is `ok`.

## Why

`prodversion` is Electron's own Chromium version: the store refuses packages
whose `minimum_chrome_version` is newer than the client, so this is the honest
answer and keeps it from serving builds that cannot load.
