# TabErrorPage

`core/browser/tab-view/TabErrorPage.js` (page: `core/browser/tab-view/error.html`)

The branded page a tab shows when a main-frame navigation fails or its renderer
dies twice in a row.

## Methods

- `TabErrorPage.URL`: the `file://` URL of `error.html`.
- `TabErrorPage.isErrorPage(url)`, `TabErrorPage.targetOf(errorUrl)` (the failed URL it carries, or null).
- `TabErrorPage.show(entry, { code, desc, url, gen })` loads
  `error.html?code=&desc=&url=` and sets `entry._errorPageFor`. Skipped for a
  destroyed webContents and when `gen` is older than the entry's newest
  navigation generation.

## Behaviour

The failed URL rides along as a query parameter. When the error page commits,
[TabLoadEvents](TabLoadEvents.md) keeps `entry.url` on the failed URL, adds no
history row and emits no `tabNavigated`; the serialized tab reports `errorPage: true`.
Reloading from the error page retries the original URL ([TabLoader](TabLoader.md)).
The page classifies Chromium net error codes (not found, refused, timeout,
certificate, blocked, offline) and `desc=CRASHED`; it inlines its colour tokens
because a file:// page in a tab session cannot load the shared CSS.
