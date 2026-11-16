# LumaPages

`core/browser/LumaPages.js`

The app's own pages on the `luma:` scheme: `luma://newtab` ([NewTabPage](newtab/NewTabPage.md)), `luma://terminal`
([TerminalPage](../terminal/TerminalPage.md)) and `luma://downloads`
([DownloadsPage](downloads/DownloadsPage.md)). A scheme has one registration per session, so the pages' routes are
gathered here and registered together on every tab session (SessionSetup).

Where the session has `protocol.registerSource` (Electron 45) the folders are served by Chromium with no JavaScript
handler, so the pages open just as fast while the main process is busy. An Electron without it gets a
`protocol.handle` handler that asks the page whose host the URL names; any other host is a 404.

A new page adds itself to `PAGES` with `HOST`, `routes()` and `serve(url, fetchFile)`.

## Methods

- Statics: `attach(session, fetchFile)` (once per session), `source()`, `serve(url, fetchFile)`.
