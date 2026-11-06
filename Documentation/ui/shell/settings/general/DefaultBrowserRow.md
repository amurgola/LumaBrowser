# DefaultBrowserRow

`ui/shell/settings/general/DefaultBrowserRow.js`

Settings > General > Browsing > Default browser: a status line ("LumaBrowser opens web links from other apps" or not)
and Make default (hidden once LumaBrowser is the default). After Make default on Windows it re-reads the status when
the window regains focus, since the choice happens in the Windows page.

## Methods

- `new DefaultBrowserRow({ feedback })`, `install()`, `refresh()`, `DefaultBrowserRow.text(status)`.
