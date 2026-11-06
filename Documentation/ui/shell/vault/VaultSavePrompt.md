# VaultSavePrompt

`ui/shell/vault/VaultSavePrompt.js`

The "Save your password for <host>?" / "Update ...?" bubble under the address bar, in the chrome overlay's `vault`
layer. It shows the username and dots, never the password (that stays in main). Buttons: Save / Update, Never for
this site (new logins only), Not now. An address offer (`kind: 'profile'`) reads "Save this address for autofill?"
with its summary and Save / Not now. Only the active tab's offer is on screen.

## Methods

- `new VaultSavePrompt({ store, addressBar, onAnswered })`, `install()`, `current()`, `render()`,
  `handleAction(payload)` (routed by OverlayActionRouter for `layer: 'vault'`), `size`.
- `VaultSavePrompt.html(p)`.

## Globals

Reads `window.vaultAPI` (`onSavePrompt`, `onSavePromptClose`, `answerPrompt`), `window.chromeOverlayAPI`.
