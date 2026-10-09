# ImageSrcRecovery

`core/shell/context-menu/ImageSrcRecovery.js`

Recovers an image's src from the DOM at the right-click point when Chromium
withheld it from the [ContextMenu](../ContextMenu.md) params.

## Methods

- `ImageSrcRecovery.isNeeded(params)` is true when `mediaType` is `'image'`
  and `srcURL` is empty.
- `ImageSrcRecovery.recover(webContents, params)` runs `SCRIPT` at the rounded
  hit point and resolves the img's `currentSrc || src`, or `''` on any failure
  or after `TIMEOUT_MS` (400 ms). Never rejects.
- `ImageSrcRecovery.scriptFor(params)` is the script with the point filled in.

## Why

Chromium blanks `srcURL` for a data: URL past its roughly 2 MB URL cap, which is
every inline base64 image the chat generates. The menu used to require
`srcURL`, so right-clicking a generated picture showed a lone "Select All".
The script walks from the top document down through up to 8 same-origin frames
(the artifact side panel is one), translating the point into each frame. The
timeout keeps a hung renderer from delaying the menu.
