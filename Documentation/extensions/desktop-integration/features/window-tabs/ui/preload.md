# preload (window-tabs)

`extensions/desktop-integration/features/window-tabs/ui/preload.js`

The bridge a window tab's page gets (context-isolated), `window.windowTab`:

- `call(name, data)` -> `ipcRenderer.invoke('ext.desktop-integration.window-tabs.page.<name>', data)`.

The feature's handlers check that the caller is one of its own pages (by URL)
and act only on the window that page was opened for
([WindowTabsFeature](../WindowTabsFeature.md)). Passed as the tab's
`preloadPath`, so the page has this bridge and not the regular tab preload.
