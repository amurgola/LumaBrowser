# MdnsBrowser

`core/network-sharing/MdnsBrowser.js`

Browses for sharing peers over mDNS on every LAN interface.

## Methods

- `new MdnsBrowser(pool, { serviceType, onUp, onDown })`.
- `start()` starts one Bonjour browser per pooled instance, then every 8 s
  re-queries, or restarts all browsers when the interface set changed. A no-op
  when discovery is unavailable. Returns `this`.
- `stop()` stops the timer and every browser.
- `list()` returns the currently known peers, deduplicated by fqdn (or name).
- `MdnsBrowser.normalize(service)` returns `{ name, host, addresses, port, txt, fqdn }`.

`onUp`/`onDown` receive normalized records; a throwing listener is swallowed.

## Why

A Bonjour browser sends its PTR query once, so one lost packet used to mean an
empty peer list forever. Re-querying turns that into a delay. RFC 6762 asks for
at least 1 s between queries; 8 s is gentle on the LAN. The same peer answers
on every interface that reaches it, hence the dedupe.
