# PersistedTabsMenu

`ui/shell/tabs/PersistedTabsMenu.js`

The persisted-tabs strip button (visible only while persisted tabs exist) and its quick view, which shows a hidden tab or switches to a visible one.

The quick view is two headed sections parted by a hairline: "In the background" (hidden tabs, first, because this list is the only way to reach them) and "Open tabs". A section with no tabs is left out. Each row is the site's icon, the page title and the host under it, since titles alone ("Inbox (157)") do not say which site.

## Methods

- `new PersistedTabsMenu({ store, popupMenu, favicons })`.
- `refreshButton()`, `show()`.
- `PersistedTabsMenu.build(list, favicons)` -> `{ items, map }` for [PopupMenu](../overlay/PopupMenu.md).
- `PersistedTabsMenu.GROUPS`, `PersistedTabsMenu.WIDTH`.

## Globals

Reads `window.tabAPI`.
