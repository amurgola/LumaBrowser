# PageNotes

`core/llm-server/chat/web-tools/PageNotes.js`

The caveats appended to a page read.

## Methods (static)

- `redirect(document)`: when `url` and `requestedUrl` differ by
  [UrlIdentity](UrlIdentity.md), says where it led and that the original
  address probably does not exist.
- `rawCut(document)`: the download hit the byte limit, so the end is missing.
- `thin()`: little prose loaded; reading the URL again returns the same; use
  another source or the browser tools (`get_source`).
- `collect(document, { thin })`: every applicable note, blank-line separated.

## Why

Sites often redirect a missing path to a hub page with HTTP 200, which must not
read as proof a guessed URL was right. The thin note is a warning, not a
failure: a short page can be a good read, but a shell whose article never
rendered used to send the model round re-reading it.
