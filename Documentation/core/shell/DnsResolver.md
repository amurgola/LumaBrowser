# DnsResolver

`core/shell/DnsResolver.js`

Switches all Chromium DNS resolution between the system resolver and a pinned
DNS-over-HTTPS provider.

## Methods

- `DnsResolver.PROVIDERS` maps provider keys (`default`, `google`,
  `cloudflare`) to their DoH server list; `default` is `null`.
- `DnsResolver.isValidProvider(provider)` is true only for an own key of
  `PROVIDERS` (so `toString` and friends are rejected).
- `DnsResolver.applyProvider(provider)` applies the provider and returns
  `{ success: true }` or `{ success: false, error }`. Never throws.

## Why

`app.configureHostResolver` is app-global (it configures the network service),
so one call covers every session, including `persist:main` and private ones. It
may only be called after app ready; before that Electron throws and the error is
returned.

`default` restores Chromium's stock behaviour: the OS resolver, silently upgraded
to DoH only when the OS DNS server is a known DoH provider. Named providers use
`secure` mode so lookups never fall back to the OS resolver.

The default session's resolver cache is cleared on every apply so hosts already
visited re-resolve through the new provider. Settings changes apply live, so the
method is safe to call repeatedly.
