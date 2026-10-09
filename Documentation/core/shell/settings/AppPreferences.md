# AppPreferences

`core/shell/settings/AppPreferences.js`

Small browser preferences kept in the settings store.

## Methods

- `new AppPreferences(db, { dnsResolver = DnsResolver })`.
- `getAutoCheckUpdates()` (`core.app.autoCheckUpdates`, default true),
  `setAutoCheckUpdates(b)` -> `{ success: true }`.
- `getShowBookmarksBar()` (`core.ui.showBookmarksBar`, null until chosen),
  `setShowBookmarksBar(b)` -> `{ success: true }`.
- `getDnsProvider()` (`core.network.dnsProvider`, default `default`).
- `setDnsProvider(p)` refuses `Unknown DNS provider: <p>`; otherwise applies it
  with [DnsResolver](../DnsResolver.md)`.applyProvider` and saves it only when
  that succeeded; returns the apply result.

## Why

A provider is applied before it is persisted so a resolver failure never saves
a provider that is not in effect. The bookmarks bar setting used to live in
renderer localStorage, which neither synced across windows nor survived a
userData move.
