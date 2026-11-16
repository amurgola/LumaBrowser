# DownloadsPageViewers

`core/browser/downloads/DownloadsPageViewers.js`

The downloads page's tab and its live updates.

- **One tab per window.** `openTab(windowId)` switches to the window's downloads tab when it has one, and opens
  `luma://downloads/` there otherwise, so asking twice never leaves two.
- **Live list.** `watch(sender)` answers the [DownloadManager](../DownloadManager.md)'s list and remembers the page.
  From then on every `'download'` event reaches it as `{ type: 'download', download }` and every `'changed'` event as
  `{ type: 'changed' }`, on the channel `core.downloads.event`.
- A page is forgotten when its webContents is destroyed, and the first time a change finds its tab on another
  address (the user typed a URL into the downloads tab). Coming back to the page lists again, which watches again.

The DownloadManager belongs to the TabViewManager, which does not exist until the first window does, so it is read
through `getTabViewManager()` on each call and the relay is attached on the first `watch`.

## Methods

- `new DownloadsPageViewers({ getTabViewManager })`.
- `downloads()`: the DownloadManager, or null before the first window.
- `openTab(windowId)` -> `{ success, tab? }`.
- `watch(sender)` -> the list.
- `DownloadsPageViewers.EVENT_CHANNEL`.
