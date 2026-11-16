# DownloadsView

`ui/downloads/DownloadsView.js`

The downloads page: every download main knows of, grouped by day ([DownloadGroups](DownloadGroups.md)) and narrowed
by the search box, drawn as rows ([DownloadRowView](DownloadRowView.md)), kept current while downloads run. It reads
and acts through `window.lumaDownloads`
([DownloadsPageBridge](../../core/browser/tab-preload/DownloadsPageBridge.md)).

## What the user can do

- **Search** by file name or by the address a file came from.
- **Open** a finished file from its name. A file that has since been moved or deleted says so in a notice, and the
  row turns to Deleted.
- **Copy download link**, confirmed with "Link copied".
- **Show in folder**, for a file that is still there.
- **Cancel** a running download.
- **Remove from list** for one finished download; **Clear all** for every finished one. The files stay on disk.

## How it stays current

- `{ type: 'download', download }` from main is merged into what is known. A running download's progress updates
  the row on screen in place (see DownloadRowView.refresh); a download that started, finished or failed redraws the
  list. Progress of a download the search hides changes nothing on screen.
- `{ type: 'changed' }` (entries left the list, here or in the toolbar popup) reads the whole list again.
- One click listener on the list acts on the row buttons' `data-action`.

## Methods

- `new DownloadsView(document, bridge, { now })`, `start()`, `reload()`, `render()`.
- Text constants: `EMPTY`, `NO_MATCH(query)`, `MISSING_BRIDGE`, `FILE_GONE`, `LINK_COPIED`; `NOTICE_MS`.

## Globals

Reads the elements `dlSearch`, `dlClear`, `dlList`, `dlEmpty`, `dlNotice` of
[downloads.html](downloads.md).
