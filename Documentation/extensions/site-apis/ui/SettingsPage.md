# SettingsPage

`extensions/site-apis/ui/SettingsPage.js`

The settings page over [settings.html](../settings.md): summary, the New site API picker and one
[SiteCard](SiteCard.md) per site.

## Methods

- `new SettingsPage(root, { invoke, reload, openBuilder, getPersistedTabs? })`; `getPersistedTabs` defaults to
  `window.tabAPI.getPersisted()` (the same list the strip's persisted-tabs button shows).
- `render(sites)`: the summary line (`StatusText.summary`) and the cards, or the empty state.
- `togglePicker()`: New site API lists the persisted tabs (title plus URL); picking one calls
  `openBuilder({ tabId })` and closes the picker; no persisted tabs shows how to persist one. `closePicker()`.
- `cards`: the rendered SiteCards (tests).

## Decisions

All text goes through `textContent` or `Dom.el` with fixed strings; nothing from a record reaches innerHTML.
