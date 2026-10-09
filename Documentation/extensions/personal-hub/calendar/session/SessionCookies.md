# SessionCookies

`extensions/personal-hub/calendar/session/SessionCookies.js`

Reads a browser session's cookies for a domain from Electron, so a provider
can act as the signed-in user of a persisted tab. Outside Electron the reader
answers an empty list, so the same provider degrades to public data in tests
and tools.

## Methods (static)

- `reader(electronModule?)`: an async `({ partition, domain }) => [{ name,
  value, domain }]` over `session.fromPartition(partition).cookies.get({ domain })`.
  `partition` defaults to `persist:main`, the partition new regular tabs share
  (restored persisted tabs usually have a `persist:main-<n>` of their own, so
  session calendars store theirs in `config.partition`). Any failure answers `[]`.
