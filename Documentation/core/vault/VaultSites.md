# VaultSites

`core/vault/VaultSites.js`

Which saved logins belong to a page. A login is saved for an origin. It matches a page on that exact origin
(`'exact'`) and on other origins of the same registrable domain (`'related'`, from tldts with private suffixes, so
`a.github.io` and `b.github.io` are different sites). It never matches another site, and an https login never fills a
plain-http page. This is the guard that keeps a lookalike page from receiving a login.

## Methods

- `VaultSites.originOf(url)` the http(s) origin or null.
- `VaultSites.hostOf(url)`, `VaultSites.siteOf(url)` (registrable domain, or the host for IPs and single labels).
- `VaultSites.match(savedOrigin, pageUrl)` -> `'exact' | 'related' | null`.
- `VaultSites.normalizeOrigin(value)` turns `example.com` or a full URL into an origin; other schemes give null.
