# DataFileDownloadHook

`core/browser/tab-view/DataFileDownloadHook.js`

Watches a session's downloads: CSV/TSV files render inline in the tab that asked
for them; everything else goes to the downloads shelf.

## Methods

- `new DataFileDownloadHook({ registry, downloads, closeTab })`.
- `install(session)`: one `will-download` listener per session (flagged on the
  session object, so shared and private partitions are each hooked once).

## Behaviour

- [DataFileRender](../DataFileRender.md)`.isRenderableDataFile` decides. A data file
  is diverted to a temp file (no save dialog), read when done, deleted, rendered
  with `buildDataFileHtml`, and loaded into the originating tab as a base64 data
  URL. The tab's `_renderedSourceUrl` makes its next commit show the file URL.
  Failed downloads, closed tabs and unreadable temp files render nothing.
- Any other download is tracked by [DownloadManager](../DownloadManager.md) (the
  chrome's shelf). A regular user tab that exists only because a link opened the
  download (no committed page, or about:blank) is then closed, Chrome parity,
  unless it is the last visible user tab.

## Why

Chromium hands tabular MIME types straight to the downloader, leaving the tab with
no DOM: the AI agent navigating to a CSV could not read it, and users got a save
prompt. The in-flight download is diverted rather than re-fetched, because
re-fetching could double-hit a one-shot or authenticated endpoint and loses POST
and redirect context.
