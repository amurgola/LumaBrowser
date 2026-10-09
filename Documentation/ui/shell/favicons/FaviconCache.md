# FaviconCache

`ui/shell/favicons/FaviconCache.js`

Favicons by hostname, learned from visited pages (never a third-party icon service), with letter badges as the fallback.

## Methods

- `remember(url, icon)`, `store(host, dataUrl)`, `urlFor(url)`, `prefetch(urls)`, `element(url, title)`, `html(url, title)`.
- `FaviconCache.host(url)`, `FaviconCache.letter(url, title)`.

## Globals

Reads `window.browserDataAPI.getFavicons`.
