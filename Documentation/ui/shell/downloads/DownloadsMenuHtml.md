# DownloadsMenuHtml

`ui/shell/downloads/DownloadsMenuHtml.js`

Markup of the downloads popup (newest first, escaped names, per-state actions), ending in a "Show all downloads" row (`data-bd-action="all"`) that opens the downloads page.

The popup lists the newest `RECENT` (6) downloads plus any older one still running; the rest is on the downloads page. Keeping it short keeps the last row in view: with the whole history listed, the popup grew past the window and the way to the page was scrolled out of sight.

## Methods

- `DownloadsMenuHtml.render(list)`.
- `DownloadsMenuHtml.shown(list)`: the downloads the popup lists, newest first.

## Globals

None.
