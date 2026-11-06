# VaultIpcHandlers

`core/vault/VaultIpcHandlers.js`

The password manager's `core.vault.*` channels (registered by CoreIpcRegistrar). Every one answers only the browser
chrome, a window's index.html (`TabViewManager.isChromeSender`). Any other sender (a tab, the LLM tab, an extension
page) gets `{ success: false, error: 'Not allowed' }`. Errors become `{ success: false, error }`.

Channels: `status`, `list`, `reveal`, `save`, `remove`, `generate`, `setOfferToSave`, `neverList`, `neverRemove`,
`answerPrompt`, `fill`, `fillGenerated`, `fillProfile`, `setOfferAddresses`, `loginsForTab`, `importFile` (open dialog, then
`VaultService.importCsv`), `exportFile` (save dialog, writes `LumaBrowser Passwords.csv`).

The tab preload's messages are not here: VaultService hears them per tab.

## Master password and assistant access

`unlock`, `lock`, `setMasterPassword`, `removeMasterPassword`, `setAutoLock`, `setAllowExternal`, `auditList`,
`auditClear`. `exportFile` refuses while the vault is locked.

## Two-factor

`totpCode`, `fillOtp`.

`menuState` relays the autofill list's state to the tab.
