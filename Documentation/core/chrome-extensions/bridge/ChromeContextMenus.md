# ChromeContextMenus

`core/chrome-extensions/bridge/ChromeContextMenus.js` (main process)

The `chrome.contextMenus` registry behind the shim, and the Electron menu
items it contributes to the page's right-click menu.

## Methods

- `new ChromeContextMenus({ onClick })`: `onClick(session, extId, info, tab)`
  delivers a click (ShimBridge sends it to the extension's worker).
- `setName(session, extId, name)`: the extension's display name for its
  submenu.
- `create(session, extId, props)`: stores the item, keyed per session and
  extension, and returns the id as given (string or number). Duplicate ids
  throw `Cannot create item with duplicate id`. Defaults: `contexts
  ['page']`, `type 'normal'`, enabled and visible.
- `update(session, extId, id, props)`, `remove(session, extId, id)` (children
  go with their parent), `removeAll(session, extId)`, `list(session, extId)`.
- `templateFor({ webContents, params, entry, order })`: the items for one
  right click, from `webContents.session`'s registry. An item shows when its
  `contexts` include `all` or one of the click's contexts (`page`,
  `selection`, `link`, `editable`, `image`, `video`, `audio`, `frame`), it is
  visible, its `documentUrlPatterns` match the page URL and its
  `targetUrlPatterns` match the link or media URL
  ([MatchPattern](MatchPattern.md)). `%s` in a title becomes the selection,
  shortened to 32 characters. An extension with one top-level item shows it
  directly; with several, a submenu named after the extension. `parentId`
  nests, `separator`, `checkbox` and `radio` map to Electron's types, and
  `enabled` is honoured.

A click toggles checkbox state, makes a radio item the checked one among its
siblings, and reports `info` in Chrome's shape (`menuItemId`,
`parentMenuItemId`, `editable`, `frameId`, `frameUrl`, `pageUrl`, `linkUrl`,
`srcUrl`, `mediaType`, `selectionText`, `checked`, `wasChecked`) with the
[ChromeTab](ChromeTab.md) built from the webContents and tab entry.

## Why

Items are kept per session because each session runs its own copy of the
extension's background, and a click must go back to the copy that can message
the tab it happened in.
