# ClipboardSnapshot

`core/desktop/service/ClipboardSnapshot.js`

Best-effort copy of the user's clipboard before a paste, and putting it back.

## Methods

- `ClipboardSnapshot.take(clipboard)` `{ text, html, rtf, image }` (HTML, RTF and
  image only when Electron's clipboard has the reader; an empty image is null), or
  null when the clipboard cannot be read.
- `ClipboardSnapshot.restore(clipboard, snapshot)` writes back the non-empty parts,
  or clears the clipboard when there were none.

Electron round-trips text, HTML, RTF and images; copied files and app-private
formats are not restorable and are lost.
