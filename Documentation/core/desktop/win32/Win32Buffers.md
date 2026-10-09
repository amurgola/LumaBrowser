# Win32Buffers

`core/desktop/win32/Win32Buffers.js`

Reads the raw Buffers Win32 calls fill.

## Methods

- `Win32Buffers.readWide(buf, chars)` the first `chars` UTF-16 characters (negative counts read nothing).
- `Win32Buffers.readWideZ(buf)` a NUL-terminated UTF-16 string.
- `Win32Buffers.rectFrom(buf)` a RECT as `{ x, y, width, height }`.
