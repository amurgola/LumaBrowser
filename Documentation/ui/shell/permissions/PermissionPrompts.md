# PermissionPrompts

`ui/shell/permissions/PermissionPrompts.js`

Camera / microphone prompts in the overlay's 'perm' layer, anchored under the address bar, only for the active tab; answers go back through `permissionPromptAPI.respond`.

## Methods

- `install()`, `current()`, `render()`, `handleAction(payload)`, `size`.
- `PermissionPrompts.html(p)`.

## Globals

Reads `window.permissionPromptAPI`, `window.chromeOverlayAPI`.
