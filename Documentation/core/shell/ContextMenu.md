# ContextMenu

`core/shell/ContextMenu.js`

The app-wide right-click menu. Electron shows none by default, so this wires
one to every webContents the app creates. Webcontents that belong to a browser
tab get a full page menu; anything else (the chrome window, overlays, devtools)
gets the editing subset. Main process.

## Methods

- `new ContextMenu({ getTabViewManager, db })`; both optional.
  `getTabViewManager()` returns the TabViewManager or `null`; `db` is the
  settings db the search engine is read from.
- `install(app)` attaches to every webContents from `web-contents-created`.
- `attach(webContents)` binds the `context-menu` handler once per webContents
  (a `_lumaContextMenuBound` flag on the webContents, so two instances never
  double-bind).

On each right click it recovers a withheld image src
([ImageSrcRecovery](context-menu/ImageSrcRecovery.md)), resolves the tab
([MenuTab](context-menu/MenuTab.md)), builds the items
([ContextMenuTemplate](context-menu/ContextMenuTemplate.md)) and pops the menu
up in the hosting window. No items means no menu. Any error is logged as
`[ContextMenu] popup failed:` and never thrown.
