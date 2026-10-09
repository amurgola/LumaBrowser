# PopupMenu

`ui/shell/overlay/PopupMenu.js`

Every popup menu (context menus, gear menu, bookmark folders): one open path, one action dispatch, and arrow/Home/End/Enter/Space/Escape keys.

## Methods

- `open(mode, items, actionMap, { x, y, width })`, `openFolder(children, html, geometry)`, `folderChild(i)`, `runAction(action)`, `setActive(i)`, `handleKeydown(e)`, `bindChooser(fn)`.

## Globals

Reads `window.chromeOverlayAPI.setActive`.
