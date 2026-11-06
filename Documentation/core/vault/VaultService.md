# VaultService

`core/vault/VaultService.js`

The password manager. Built in FoundationServices (`services.vaultService`); TabSurfaces calls `attachTabs` once the
TabViewManager exists.

## Tab side

The tab preload's [LoginFormWatcher](../browser/tab-preload/LoginFormWatcher.md) sends `vault:capture`,
`vault:field-focus` and `vault:field-blur`. They are heard on each tab's own `webContents.ipc` (`watchTab`, wired on
the TabViewManager's `viewAttached`), so no other renderer can send them. Only regular browsing tabs take part:
agent, internal and automation tabs are ignored. The page URL is always the tab's live URL, never anything the page
reports.

- `onCapture(wc, { username, password })`: with "Offer to save" on and the origin not on the never list, offers to save
  a new login or update a changed password (`vault:save-prompt` to the tab's window: `{ promptId, tabId, host,
  username, update }`, never the password). An unchanged login just records a use. A username-only capture (step one
  of a two-step sign-in) is remembered for 10 minutes and paired with the next password on the same site. One offer
  per tab; it closes after 3 minutes (`vault:save-prompt-close`).
- `onFieldFocus(wc, { kind, newPassword, rect })` (a new-password field gets only the generator, no saved logins) sends `vault:field` `{ tabId, rect, zoom, matches: [{ id, username,
  host, related }], canGenerate }` when there is something to offer.
- `onFieldBlur(wc)` sends `vault:field-gone`.
- `fill(tabId, itemId)` checks the login against the tab's live URL ([VaultSites](VaultSites.md)) and sends
  `vault:do-fill` `{ username, password }` straight to the tab. Another site gets
  `{ success: false, error: 'This login belongs to another site' }`.
- `fillGenerated(tabId)` sends a fresh password (`{ password, generated: true }`).
- `loginsForTab(tabId)` the address bar key menu's list, without secrets.
- `answerPrompt(promptId, 'save' | 'never' | other)`.

## Address and contact profiles

Profiles are not bound to a site: an address is meant for any checkout form.

- `onProfileFocus(wc, { rect })` sends `vault:field` with `profiles: [{ id, title, summary }]` (and no logins) when
  any profile exists.
- `onProfileCapture(wc, { fields })`: with "Offer to save addresses" on (`core.vault.offerAddresses`), an address
  worth saving that no saved profile already covers is offered (`vault:save-prompt` `{ kind: 'profile', summary,
  update }`). The same person and place updates that profile; anything else is a new profile titled by its city.
  Never is ignored for addresses.
- `fillProfile(tabId, itemId)` sends `vault:do-fill-profile` `{ profile }` to the tab.
- `offerAddresses()`, `setOfferAddresses(on)`; `save({ type: 'profile', ... })` needs at least one field.
- Save offers for logins and addresses share one per-tab slot (`_openPrompt`): a repeat of the same offer is ignored, a
  different one replaces it.

## Settings side

`status()` (store status plus `offerToSave`, `offerAddresses` and `profileFields: [{ key, label }]`), `offerToSave()`, `setOfferToSave(on)` (`core.vault.offerToSave`),
`neverList()`, `removeNever(origin)` (`core.vault.neverSave`), `list()` (items without `password`, with `host` and
`hasPassword`), `reveal(id)`, `save(fields)` (add, or update with `id`; needs a site and a password), `remove(id)`,
`importCsv(text)` -> `{ success, added, updated, skipped }` (same site and username updates a changed password; an
identical row is skipped), `exportCsv()`, `generate()`.

## Assistant access, master password, audit

- `agent` ([VaultAgentAccess](VaultAgentAccess.md)), `audit` ([VaultAudit](VaultAudit.md)), `redactor`
  ([VaultRedactor](VaultRedactor.md)).
- `secrets()` the saved login passwords with names, for redaction.
- `tabUrl(tabId)`, `activeTabId()`, `describeCall(params)` (the approval card's item name, site and tab site).
- Master password ([VaultLock](VaultLock.md)): `isLocked()`, `lockedError()`, `unlock(pw)`, `lockNow()`,
  `setMasterPassword(current, next)`, `removeMasterPassword(current)`, `setAutoLockMinutes(m)`, `touchLock()`.
  `reveal`, `exportCsv`, editing a login's password and turning on `aiAccess` all refuse while locked.
- `status()` also carries `lock` and `allowExternal`. `setAudit(fn)` replaces the recorder (tests).

## Keys and two-factor

- `save({ type: 'key', title, value, notes, aiAccess })`: names are unique by slug; editing without a value keeps the saved one; needs the vault unlocked.
- Logins take an optional `totp` (validated by [Totp](Totp.md)). `totpCode(id)` (behind the master password), `fillOtp(tabId, itemId)` (the login's site only; sends `vault:do-fill` `{ otp }`).
- A focused code field (`kind: 'otp'`) sends `vault:field` with `otp: true` and the site's logins that hold a secret.
- `reveal` returns a key's value as `password`, and a login's `totp` alongside its password. Lists carry `hasTotp`, `hasValue` and a key's `placeholder`, never the secrets.
- `secrets()` also covers two-factor secrets and key values, so they are redacted too.

## Autofill keyboard

`vault:field-key` from the tab is relayed to the chrome (`onFieldKey`); `menuState(tabId, { open, active })` tells the tab's FieldMenuKeys about the list.
