# SystemClipboard

`core/desktop/service/SystemClipboard.js`

The system clipboard as the app uses it, over Electron's asynchronous clipboard
module (W3C shaped since Electron 44): its text, its picture as PNG bytes,
whether it holds anything worth sending, the Linux primary selection, and a
snapshot of every format so a paste can put the user's clipboard back. Every
method returns a promise.

## Methods

- `new SystemClipboard({ clipboard, ClipboardItem })`: Electron's clipboard
  module and its `ClipboardItem` class (used to write a snapshot back).
- `SystemClipboard.fromElectron(electron)` builds one from the `electron`
  module, or null where there is no clipboard (plain Node), so callers keep their
  "no clipboard" paths.
- `readText()` the clipboard text, `''` when empty.
- `writeText(text)` replaces the clipboard with `text`.
- `readSelectionText()` the X11/Wayland primary selection (the text highlighted
  right now) through `clipboard.selection`; `''` where there is none.
- `readImagePng()` the first entry's `image/png` payload as a Buffer, or null.
- `hasTextOrImage()` whether any entry has a `text/*` or `image/*` format
  (`SENDABLE`).
- `snapshot()` every format of every entry, as `[{ mimeType: Blob }]`, raw
  platform formats included; a format that cannot be read (delayed rendering
  that never arrives) is left out rather than losing the rest. Empty entries are
  dropped. Null when the clipboard cannot be read.
- `restore(snapshot)` writes the snapshot back whole as `ClipboardItem`s; when
  the platform refuses one of its own raw formats, it retries with
  `STANDARD_TYPES` only (`text/plain`, `text/html`, `text/rtf`, `image/png`). An
  empty or missing snapshot clears the clipboard.
- `restoreIfStill(text, snapshot)` restores only while the clipboard still holds
  `text` (what we wrote): something the user copied meanwhile wins. Resolves
  whether it restored; never throws.

## Why

Electron 44 replaced the synchronous clipboard with an asynchronous one: `read()`
returns ClipboardItem objects, `readImage`, `readHTML` and `availableFormats`
were removed, and the Linux selection moved to `clipboard.selection`. This class
is the one place that knows that shape, so paste in
[DesktopKeyboard](DesktopKeyboard.md), the hotkeys'
[SelectionClipboard](../../../extensions/desktop-integration/features/hotkeys/SelectionClipboard.md)
and the clipboard-to-chat action share it. A snapshot keeps every format, raw
platform formats included, not only text, HTML, RTF and image.
