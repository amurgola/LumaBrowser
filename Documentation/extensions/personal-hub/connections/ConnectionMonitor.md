# ConnectionMonitor

`extensions/personal-hub/connections/ConnectionMonitor.js`

Watches the sign-ins the Hub depends on and raises an alert when one is lost.

## Rows

`list()` answers `{ checkedAt, connections }`, one row per:

- persisted tab of a known app (`kind: 'tab'`; Gmail, Google Calendar,
  Messages, Slack, Teams, Outlook, ClickUp, Proton, Discord, WhatsApp,
  Telegram). Google hosts are probed with [GoogleAccounts](GoogleAccounts.md)
  and Teams/Outlook with [MicrosoftAccounts](MicrosoftAccounts.md), once per
  partition; their `accounts` carry the calendars. A tab on a
  [sign-in page](SignInPages.md) is `signed_out` (unless still loading).
- calendar read through a session whose tab is no longer persisted
  (`kind: 'missing'`, status `missing`).
- ClickUp task source whose last error is a refused token (`kind: 'tracker'`).

Each row: `{ key, kind, app, appLabel, name, title, partition, tabId, url,
provider, accounts, status ('ok' | 'signed_out' | 'error' | 'missing'),
detail, areas ('queue' | 'calendar' | 'tasks'), calendarsInUse, needsAttention }`.
A lapsed sign-in keeps the accounts it last had so its name stays the account's.

## Alerts

`needsAttention` is `signed_out`, or a Microsoft `error` (the token did not
renew after the wake-up and reload). A row that newly needs attention emits
`connection.alert` and shows one [DesktopAlert](DesktopAlert.md) whose click
brings the tab forward; it alerts again only after recovering. A changed list
emits `connection.changed`.

## Timing

- `start()`: a full check `FIRST_CHECK_MS` after boot and every `CHECK_MS`,
  plus navigation events. A persisted tab moving onto a sign-in page is
  confirmed `CONFIRM_MS` later (apps pass through their sign-in host while
  loading); one leaving it, or a new persisted app tab, triggers a check after
  `RECHECK_AFTER_SIGN_IN_MS`. `stop()` clears everything.
- `check()`: one full check (a second caller joins it); resolves `list()`.
- The Microsoft tab is reloaded only when the previous check did not already
  find it stale.

## Other methods

- `show(key)`: brings the row's tab forward.
- `describe(row)` (static): `'Slack (Vendera)'`, `'Gmail (andy@example.com)'`.
- `appFor(host)`, `isGoogleHost(host)`, `needsAttention(row)` (static).
