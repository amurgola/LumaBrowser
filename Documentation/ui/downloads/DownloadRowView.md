# DownloadRowView

`ui/downloads/DownloadRowView.js`

One download on the downloads page, built with DOM calls (no markup strings, so a file name is never read as HTML):
the kind icon ([FileKind](FileKind.md)), the name, the status and the site it came from
([DownloadText](DownloadText.md)), a progress bar while it runs, and the actions its state allows.

| State | Name | Actions |
|---|---|---|
| running | text | Copy download link, Cancel |
| finished, file on disk | button that opens the file | Copy download link, Show in folder, Remove from list |
| finished, file gone ("Deleted") | text | Copy download link, Remove from list |
| failed, cancelled | text | Copy download link, Remove from list |

Copy download link is left out for a download with no address. Buttons carry `data-action` (`open`, `copy`, `folder`,
`cancel`, `remove`) and the row `data-id`; [DownloadsView](DownloadsView.md) listens once for the whole list. Icon
buttons have a tooltip and an `aria-label`.

## Why refresh exists

Chromium reports progress several times a second. Rebuilding the row each time would swap the Cancel button out
between mouse down and mouse up and lose the click, so `refresh(row, download)` updates the status text and the bar
of the row that is there. It answers false when the row no longer fits (the download finished or failed, the file
went missing, the size became known, the saved name changed), and the caller rebuilds.

## Methods

- `DownloadRowView.build(document, download)` -> `<li class="dl-row">`.
- `DownloadRowView.refresh(row, download)` -> whether the row took the change.

## Globals

None. The icons are `<use>` references into the sprite in [downloads.html](downloads.md).
