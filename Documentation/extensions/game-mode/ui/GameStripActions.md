# GameStripActions

`extensions/game-mode/ui/GameStripActions.js`

The game strip's export, share and reset actions; progress shows on the
strip's note line. Each does nothing without a conversation.

## Methods

- `new GameStripActions(strip, conversationId)`: `strip` is a
  [GameStrip](GameStrip.md) (for `note()`); `conversationId()` the active id.
- `exportZip()`: `Exporting…`, downloads the zip through a temporary anchor
  (object URL revoked after 2 s), then `Zip downloaded. Unzip it and open
  index.html.`; failures `Export failed: <message>`.
- `publishShare()`: `Publishing…`; an available link is copied to the
  clipboard (a clipboard failure is ignored) and shown as `Share link copied:
  <url>`, else `Published as an artifact (share links unavailable: <reason or
  'sharing off'>).`; failures `Share failed: <message>`.
- `resetStores()`: asks `Dialogs.confirm(RESET_CONFIRM)` first; then
  `Resetting…` and `Saved data wiped. Press Play (or Reload) to start fresh.`
  or `Reset failed: <message>`.

## Globals

Reads `navigator.clipboard`, `URL.createObjectURL`/`revokeObjectURL`,
`document`; `Dialogs` reads `window.LumaModal` / `window.confirm`.
