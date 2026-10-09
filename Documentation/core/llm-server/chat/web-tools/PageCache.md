# PageCache

`core/llm-server/chat/web-tools/PageCache.js`

A short-lived, size-bounded memory of pages read in one run.

## Methods

- `new PageCache({ ttlMs?, capacity?, now? })`.
- `get(url)`: the stored [PageReader](PageReader.md) document, or `null` when
  absent or older than the TTL. A hit becomes most recently used.
- `put(document)`: stores it under both `requestedUrl` and `url`
  ([UrlIdentity](UrlIdentity.md) keys), evicting least recently used keys past
  capacity.
- `size()`: keys held.
- `TTL_MS` (5 min), `CAPACITY` (16 keys).

## Why

Reading part 2, running a `find` on a page just read, or a repeated read costs
no second download, and part numbering stays stable between calls. Five minutes
covers paging through one document during a task while keeping prices and
news fresh. Sixteen keys is about eight pages, a few MB of text at most. Only
successful reads are stored, so a transient failure is retried for real.
