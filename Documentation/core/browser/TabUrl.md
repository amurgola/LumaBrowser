# TabUrl

`core/browser/TabUrl.js`

The single definition of what a tab can load: turns typed addresses into
loadable URLs and says whether a URL is navigable.

## Methods

- `TabUrl.normalize(url)` returns the URL a tab should load. Empty input
  becomes `about:blank`. `http:`, `https:`, `about:`, `file:` and any other real
  scheme (`data:`, `blob:`, `luma:`, `chrome:`) pass through untouched. A bare
  address gets `http://` when its host is loopback, private or single-label
  (like Chrome), otherwise `https://`.
- `TabUrl.isNavigable(url)` is true exactly when `normalize(url)` parses with
  `new URL()`.
- `TabUrl.isLoopbackOrPrivateHost(url)` is true for `localhost`, `*.localhost`,
  `::1`, `127.x`, `10.x`, `192.168.x`, `172.16-31.x` and single-label intranet
  hosts. The port, path, query and fragment are ignored.

## Why one definition

Bug M10: the REST front door used its own narrower check
(`new URL(url.startsWith('http') ? url : 'https://' + url)`) and rejected
`about:` URLs the tab loader explicitly supports. Defining "navigable" as
"the normalizer's output parses" makes the two agree by construction.

A bare `host:port` is not a scheme, so the scheme pattern refuses a colon
followed by port digits and then the end, `/`, `?` or `#`.
