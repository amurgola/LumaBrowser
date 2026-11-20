# OverlayActionRouter

`ui/shell/overlay/OverlayActionRouter.js`

Routes overlay clicks and hovers to the permission prompt, the save-password bubble (`layer: 'vault'`), the notification log or the open popup (suggestions, folder, context/gear menu, downloads list).

## Methods

- `install()`, `handleAction(payload)`, `handleHover(payload)`.
- Notification log actions: `close-log` -> `log.hide()`; `log-action` -> `log.runAction(payload.id)` (an entry's button).

## Globals

Reads `window.chromeOverlayAPI.onAction`, `onHover`.
