# DownloadsIpcHandlers

`core/browser/downloads/DownloadsIpcHandlers.js`

IPC for the downloads page. A refused call answers null.

- **From the page** (a sender whose URL is `luma://downloads`, so no website can read the list or open a downloaded
  file): `core.downloads.list` (which also starts the live updates, see
  [DownloadsPageViewers](DownloadsPageViewers.md)), `open`, `show`, `copyLink`, `cancel`, `remove`, `clear`. Each acts
  on the [DownloadManager](../DownloadManager.md) by download id.
- **From a window's chrome:** `core.downloads.openPage` opens the downloads tab in the window that asked.

Controller only: it checks the sender and routes.

## Methods

- `new DownloadsIpcHandlers({ viewers, getTabViewManager, ipc })`, `register()`.
- `DownloadsIpcHandlers.isPage(sender)`.
