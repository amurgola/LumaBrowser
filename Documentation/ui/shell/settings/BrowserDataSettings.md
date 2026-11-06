# BrowserDataSettings

`ui/shell/settings/BrowserDataSettings.js`

Start page, search engine, Luma On Demand, bookmarks-bar visibility (migrating the old localStorage value once) and force dark mode.

## Methods

- `load()`.
- `BrowserDataSettings.bookmarksBarPreference()`.

## Globals

Reads `window.browserSettingsAPI`, `window.ipcBridge`, `localStorage`.

## New tabs open

The `gsNewTabMode` select (`core.newtab.getMode` / `setMode`). The URL new tabs open (`core.newtab.url`) feeds `tabActions.startPageUrl` and is re-read after the start page or the mode changes.
