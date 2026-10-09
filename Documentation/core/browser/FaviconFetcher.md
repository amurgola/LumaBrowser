# FaviconFetcher

`core/browser/FaviconFetcher.js`

Turns a favicon source into a size-capped image data URL, or null for anything
that is not a small image.

## Methods

- `new FaviconFetcher({ fetchImpl, timeoutMs = 5000, maxBytes = 65536 })`. Without
  `fetchImpl` it uses Electron's `net.fetch`, required lazily so the class loads in
  plain Node.
- `toDataUrl(src)`:
  - a `data:` source passes through when its length is at most `2 * maxBytes`
    (base64 text, so twice the byte cap is a loose equivalent), else null;
  - otherwise it fetches with an abort after `timeoutMs`, and returns
    `data:<mime>;base64,...` when the response is ok, has an `image/*` content type
    (missing type is treated as `image/x-icon`), and a body of 1 to `maxBytes` bytes.
    Any failure returns null.
