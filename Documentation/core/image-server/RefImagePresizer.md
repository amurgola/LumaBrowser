# RefImagePresizer

`core/image-server/RefImagePresizer.js`

Resizes an edit's reference images to [RefSizePlanner](RefSizePlanner.md)'s
targets with Electron's `nativeImage`, so the runtime can encode them as sent.

## Methods

- `RefImagePresizer.presize({ refImages, canvas, refArea?, grid = 32, resize? })`
  returns `{ refImages, sized, sizes }`. Falsy entries are dropped. A reference
  already on target passes through as given; others become PNG Buffers. `sized`
  is true only when every reference ended on the grid, which the runtime
  requires before it may skip its own resize. Any unreadable image, or a failed
  or throwing resize, returns every reference untouched (`sized: false`, `sizes`
  all null). `resize(buf, w, h)` is a test seam.
- `RefImagePresizer.nativeResize(buf, w, h)` resizes with a lazily required
  `nativeImage`, or returns `null` outside an Electron main process.
- `RefImagePresizer.toBuffer(value)` accepts a Buffer, base64, or a data URL.

## Why

The fail-safe paths mean presizing can never break a request: the worst case is
the runtime's own, slower resize.
