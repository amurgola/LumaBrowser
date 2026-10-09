# SapisidHash

`extensions/personal-hub/calendar/session/SapisidHash.js`

The `Authorization` header Google's own web apps send to Google APIs from a
signed-in browser session: `SAPISIDHASH <seconds>_<sha1("<seconds> <SAPISID> <origin>")>`.
With it (and the session's cookies) the Calendar API answers for the
signed-in account without an OAuth token, which is how the Calendar web app
and its embed page read calendars.

## Methods (static)

- `sapisidOf(cookies)`: the `SAPISID` cookie value, else `__Secure-3PAPISID`,
  else null (not signed in).
- `header(sapisid, origin, nowMs)`: the header value.
- `cookieHeader(cookies, host?)`: `name=value; ...` for the request; with a
  host, only the cookies a browser would send there (parent-domain cookies and
  the host's own), one per name, so Gmail's and Accounts' host cookies never
  bloat the header into a 400.

## Why

It is an undocumented but long-stable convention (every Google web app uses
it). The Hub uses it only for reading calendars the user can already see in
a persisted tab, and only when no OAuth client is configured.
