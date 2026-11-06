# PopupBlockedBadge

`ui/shell/nav/PopupBlockedBadge.js`

The blocked pop-up icon at the end of the address bar (`#urlBarPopups`). Visible while the active tab's
`blockedPopups` (from `tab:state`) is non-empty; clicking opens a menu with one "Open <url>" row per blocked
open (blank pop-ups are listed disabled) and "Always allow pop-ups from <host>".

## Methods

- `new PopupBlockedBadge({ store, popupMenu })`, `install()`.
- `update(tab)` shows or hides the icon for the active tab's mirror; called by TabEventSync on state and switch.
- `openMenu()` opens the list under the icon.
- `PopupBlockedBadge.build(tab, { open(index), allow() })` returns `{ items, map }` for PopupMenu.
- `PopupBlockedBadge.hostOf(url)`.

## Globals

Calls `window.tabAPI.openBlockedPopup(tabId, index)` and `window.tabAPI.allowPopups(tabId)`
(`tab-view:popup-open`, `tab-view:popup-allow-site`).
