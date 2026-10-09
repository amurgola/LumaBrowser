# ConfinedFile

`app/gateway/ConfinedFile.js`

Serves files from one directory over the REST gateway with a traversal guard.

## Methods

- `ConfinedFile.resolve(rootDir, reqPath, prefixRe, { fallback? })`: strips the
  prefix, URL-decodes, applies `fallback` to an empty remainder, and returns
  `{ path }` inside `rootDir`, or `{ status: 400 }` (bad encoding, empty, NUL
  byte) or `{ status: 403 }` (resolves outside, including `../` and encoded or
  absolute paths).
- `ConfinedFile.isInside(rootDir, resolved)`: a separator-aware prefix check,
  so `<root>-evil` is outside.
- `ConfinedFile.handler(rootDir, prefixRe, options)` an Express handler.
- `ConfinedFile.send(res, rootDir, absolutePath)`: `Cache-Control: no-store`
  and `sendFile` relative to `root`, no Last-Modified; a send error answers its
  status (404 default) unless headers went out.

## Why

`sendFile` with a bare absolute path dotfile-checks every segment and 404s an
AppImage's `/tmp/.mount_X/` path (the "blank LLM tab" bug); relative to `root`,
only the request-controlled part is policed. `no-store`: a cached body severed
mid-stream would otherwise revalidate 304 against the intact file forever (seen
live as a mangled persisted LLM tab). Express 5 takes the ETag choice from the
app setting, so the `etag: false` option is kept for intent only.
