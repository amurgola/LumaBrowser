# GgufCursor

`core/llm-server/GgufCursor.js`

Forward-only, page-buffered reader over an open file handle, bounded by a byte
cap and a deadline.

## Methods

- `new GgufCursor(fileHandle, fileSize, byteCap, deadline)`
- `take(byteCount)` resolves to the next `byteCount` bytes (a view, not a copy).
- `skip(byteCount)` advances without disk I/O. A jump inside the buffered
  window keeps the buffer; a jump past it drops the buffer and refills lazily.
- `skipStringArray(count, lengthBytes, maxStringBytes)` skips `count`
  length-prefixed strings.
- `extendDeadline(extraMs)` pushes the deadline out to at least now + `extraMs`.
- Getters: `position`, `fileSize`, `bytesPaged`.
- `PAGE_BYTES` is the 256 KB disk read granularity.

Errors are plain `Error`s; the byte-cap error carries `cap: true`.

## Why

The byte cap bounds cumulative reads, not held memory: consumed bytes are
trimmed so peak memory stays about two pages, and the cap exists to stop a
corrupt header from streaming a whole weights file.

`skipStringArray` decodes as many length prefixes per buffered page as it can
synchronously. The tokenizer vocab and merges are 150k+ entries each; one
await per entry allocated about 600k promises per model and was the largest
main-process CPU cost of a model scan. This does one await per page.

Keeping the buffer on in-window skips matters for the same walks, which
alternate tiny reads with tiny skips.
