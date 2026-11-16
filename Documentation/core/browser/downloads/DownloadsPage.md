# DownloadsPage

`core/browser/downloads/DownloadsPage.js`

The downloads page at `luma://downloads/`: its address, the test that tells its tab from any other tab, and the folder
it is served from. The page is a regular tab (kind `user`), so it sits in the tab strip, shows its address, and is
restored like any tab. The gear menu's Downloads, Ctrl+J and the toolbar popup's "Show all downloads" open it
([DownloadsPageViewers](DownloadsPageViewers.md)).

- **Files.** `ui/downloads` is the page ([downloads](../../../ui/downloads/downloads.md)).
  [LumaPages](../LumaPages.md) registers the route with the other `luma:` pages.
- `isDownloads(url)` is what the rest of the app asks: the IPC sender check
  ([DownloadsIpcHandlers](DownloadsIpcHandlers.md)), the live-update relay and the page tools' refusal
  ([TabManager](../TabManager.md)).

## Methods

- Statics: `isDownloads(url)`, `routes()` (for `protocol.registerSource`), `serve(url, fetchFile)` (the handler
  fallback; another host, or a path leaving the folder, is a 404).
- Constants: `HOST`, `URL`, `TITLE`, `DIR`, `INDEX`.
