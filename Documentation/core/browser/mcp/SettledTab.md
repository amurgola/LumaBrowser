# SettledTab

`core/browser/mcp/SettledTab.js`

Answers a new tab's post-load state for `browser_create_tab`.

## Methods

- `SettledTab.read(browserService, tab)`: when `tab.id` is a number, `waitForLoad(id, 15000)` then
  re-reads it from `getTabs({ includeSilent: true })` (keeping the snapshot if it is gone). Returns a
  copy with `createdAt` and `lastNavigatedAt` as ISO strings.

## Why

`createTab` returns as the load starts, so its snapshot is racy (blank title, `loading: true`) and the
agent would otherwise have to poll.
