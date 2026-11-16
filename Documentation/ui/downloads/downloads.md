# Downloads page files

`ui/downloads/downloads.html`, `ui/downloads/downloads.css`, `ui/downloads/downloads.js`,
`ui/downloads/downloads-icon.svg`

Served at `luma://downloads/` by [DownloadsPage](../../core/browser/downloads/DownloadsPage.md). The gear menu's
Downloads, Ctrl+J and the toolbar popup's "Show all downloads" open it.

- **HTML.** A strict CSP (own scripts, own styles, nothing inline), the title, the search box and Clear all in a
  header that stays in view, the list, the empty line and the notice. It also holds the icon sprite the rows draw
  with `<use>`: one stroked set, by file kind (`dl-kind-*`) and by action (`dl-act-*`).
- **CSS.** The shell's own tokens under their own names, inlined (the page is served alone and cannot reach
  `tokens.css`), dark whatever the system prefers like the app around it, and the app's quiet scrollbars. It follows
  the [design system](../DesignSystem.md): a day is one panel whose downloads are parted by hairlines, actions are
  28px ghost icon buttons, accent only on the progress bar and focus rings.
- **Script.** Starts a [DownloadsView](DownloadsView.md) on the document with `window.lumaDownloads`.
- **Icon.** The tab's favicon.

The page's classes: [DownloadsView](DownloadsView.md), [DownloadGroups](DownloadGroups.md),
[DownloadRowView](DownloadRowView.md), [FileKind](FileKind.md), [DownloadText](DownloadText.md). They are plain ES
modules loaded from the page's folder with no build step, so they may only import files inside `ui/downloads`.

## Checking it live

`tmp/` is git-ignored, so these are local kits: `node tmp/dl-site.js` serves test files, and
`node tmp/downloads-live.js <step>` drives an isolated dev instance through the main-process inspector (real
downloads without the save dialog, the gear menu, Ctrl+J, row clicks with real mouse events).
