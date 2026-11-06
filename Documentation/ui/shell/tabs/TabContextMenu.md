# TabContextMenu

`ui/shell/tabs/TabContextMenu.js`

The tab right-click menu: reload, duplicate, Pin tab / Unpin tab (regular tabs), move tab to new window (regular tabs, when the strip has more than one; the keyboard way to tear a tab off), copy URL, mute, zoom, persist, extension items, close / close others / close to the right (never the pinned LLM tab; close others / to the right also skip user-pinned tabs).

## Methods

- `show(x, y, tabId)`.
- `build(tab, tabId)` -> `{ items, map }`.

## Globals

Reads `window.tabAPI`.
