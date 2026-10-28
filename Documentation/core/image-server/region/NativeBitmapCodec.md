# NativeBitmapCodec

`core/image-server/region/NativeBitmapCodec.js`

Decodes, resizes and PNG-encodes bitmaps through Electron's `nativeImage`, the
one pixel codec the main process ships. Every method returns null outside an
Electron main process so callers fail soft.

## Methods (all static)

- `available()`.
- `decode(bytes)`: PNG or JPEG (Buffer, base64 or data URL) to
  `{ width, height, data }`, four bytes per pixel in the platform's native
  order (BGRA under Chromium); null when unreadable.
- `encodePng(bitmap)`: a PNG Buffer or null.
- `resize(bitmap, width, height)`: `quality: 'best'`.
- `toBuffer(value)`: Buffer, base64 or data URL to a Buffer.

## Why

`nativeImage` is required lazily so the module loads under Jest and in the
stdio MCP server; the region code treats a null as "keep the raw render".
