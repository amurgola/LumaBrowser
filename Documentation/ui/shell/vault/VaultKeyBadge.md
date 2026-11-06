# VaultKeyBadge

`ui/shell/vault/VaultKeyBadge.js`

The key icon in the address bar (`#urlBarKey`), shown while the active web page has saved logins
(`vaultAPI.loginsForTab`). Its menu fills one ("Fill <username>") or opens Settings > Passwords. It reaches a login
when the page's fields were not detected. TabEventSync updates it when the active tab's URL changes or another tab
becomes active; VaultSavePrompt updates it after an answer.

## Methods

- `new VaultKeyBadge({ store, popupMenu, openPasswords })`, `install()`, `update(tab)`, `openMenu()`.
