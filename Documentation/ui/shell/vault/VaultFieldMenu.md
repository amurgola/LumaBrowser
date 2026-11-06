# VaultFieldMenu

`ui/shell/vault/VaultFieldMenu.js`

The autofill list under a focused sign-in field. It is a chrome-overlay popup (PopupMenu 'context'), so the page
cannot read which accounts exist. Rows: the matching logins (a related subdomain names its host) or, in an address form,
the saved profiles (pick fills the whole form through `vaultAPI.fillProfile`), "Use a strong password" on new-password
fields, then "Manage passwords" / "Manage addresses". Placed at the tab view's origin
(`ViewBoundsReporter.lastSent`) plus the field rect times the tab zoom. Only the active tab's field opens it;
`vault:field-gone` for that tab closes it.

## Methods

- `new VaultFieldMenu({ store, popupMenu, host, bounds, openPasswords })`, `install()`, `show(p)`, `openFor`.
- `VaultFieldMenu.build(p, { fill, generate, manage })`, `VaultFieldMenu.position(p, viewBounds)`.

## Two-factor

With `otp: true` the rows read "2FA code for <username>" and pick through `vaultAPI.fillOtp`.

## Keyboard

`onKey({ tabId, key })` drives the open list with PopupMenu's keyboard handling (move, Enter picks, Escape closes) and tells the tab `{ open, active }` through `vaultAPI.menuState`, also when the list closes.
