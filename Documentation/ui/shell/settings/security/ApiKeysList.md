# ApiKeysList

`ui/shell/settings/security/ApiKeysList.js`

The API key list: rename, Reveal/Copy fetched on demand, Refresh, Delete, and the one-time reveal panel; plaintext is never kept in state and is masked again on close.

## Methods

- `install()`, `render()`, `maskAll()`, `hideReveal()`.
- `ApiKeysList.masked(k)`, `ApiKeysList.rowHtml(k)`.

## Globals

Reads `window.ipcBridge.invoke('core.settings.apiSecurity.revealKey')`, `navigator.clipboard`.
