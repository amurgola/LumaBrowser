# BrowserDataPreferences

`core/browser-data/BrowserDataPreferences.js`

The start page, search engine and dark-mode preferences, stored in the settings db.

## Methods

- `new BrowserDataPreferences({ db, nativeTheme })`; `db` is `{ get(key, fallback), set(key, value) }`.
- `getStartPage()` / `setStartPage(url)`: key `startPageUrl`, default
  `https://duckduckgo.com`. The setter trims; a blank or missing url stores the
  default. Returns the stored value.
- `getSearchEngine()` / `setSearchEngine(id)`: an unknown id is stored as the
  default engine's id (via [SearchEngines](../browser/SearchEngines.md)).
- `listSearchEngines()`: copies of `SearchEngines.ENGINES`.
- `searchUrl(query)`: the results URL on the current engine.
- `getDarkMode()` / `setDarkMode(enabled)`: key `darkMode`, default `true`. The
  setter stores a boolean and forces `nativeTheme.themeSource` to `dark` or `light`.
- `applyStoredDarkMode()`: applies the stored value; call after `app.whenReady()`.
- Constants: `DEFAULT_START_PAGE`, `DEFAULT_DARK_MODE`, `START_PAGE_KEY`, `DARK_MODE_KEY`.

## Why nativeTheme

`themeSource` is what every tab's WebContents reports to pages as
`prefers-color-scheme`, so one switch forces dark or light on every site. It is
only writable once the app is ready; a write that throws is ignored and the
stored value applies on the next start.
