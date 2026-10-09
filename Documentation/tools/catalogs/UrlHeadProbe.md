# UrlHeadProbe

`tools/catalogs/UrlHeadProbe.js`

One HEAD request that follows redirects. HF `/resolve/` URLs answer HEAD with the redirect target's headers, so
this proves a file exists without downloading it.

## Methods

- `UrlHeadProbe.head(url, { fetchImpl = fetch, timeoutMs = 30000 })` resolves `{ ok, status, length }` (`length` is
  the content-length header), or `{ ok: false, status: null, error }` on a network error or timeout.
