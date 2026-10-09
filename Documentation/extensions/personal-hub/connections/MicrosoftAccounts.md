# MicrosoftAccounts

`extensions/personal-hub/connections/MicrosoftAccounts.js`

The Microsoft 365 account signed in to a persisted Teams or Outlook tab, read
through the tab's own sign-in: the web app keeps a Microsoft Graph access
token with calendar scope in its MSAL cache (plain JSON in the page's storage)
and renews it while it runs. No app registration is needed.

## Token fallback

When the tab holds no token with at least `MIN_LIFETIME_S` left:

1. the tab is woken (`SessionTabs.wake`) and read again after `WAKE_WAIT_MS`;
2. with `reload` on, and only if the tab is not the one in view, it is
   reloaded and read again after `RELOAD_SETTLE_MS`;
3. otherwise the call fails with `reason` `'signed_out'` (the tab is on a
   [sign-in page](SignInPages.md)) or `'stale'`.

A partition without a Teams or Outlook tab fails with `'no_tab'` at once.
Concurrent callers for one partition share a single attempt.

## Methods

- `new MicrosoftAccounts({ tabs, fetchImpl?, sleep? })`.
- `token(partition, { reload = true })`: the Graph token, or a thrown Error
  with `.reason`. The calendar provider passes `reload: false`; the
  [ConnectionMonitor](ConnectionMonitor.md) reloads at most once per lapse.
- `probe(partition, { reload })`: `{ status: 'ok' | 'signed_out' | 'error',
  account: { email, calendars: [{ id, name, primary, color }] } | null, error?,
  reason? }` from Graph `/me` and `/me/calendars`; a 401 is `signed_out`.
- `tabFor(partition)`: the persisted Microsoft tab of the partition, or null.
- `isMicrosoftHost(host)` (static): Teams and Outlook hosts (`HOSTS`).
- `READ_TOKEN_JS` (static): the page snippet picking the freshest Graph token
  whose target includes `Calendars.Read` (a target without a resource prefix is Graph's).
