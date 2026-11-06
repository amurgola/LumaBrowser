# PasswordsPanel

`ui/shell/settings/passwords/PasswordsPanel.js`

Settings > Passwords & autofill (`#passwordsSettings`; logins only, addresses are [AddressesPanel](AddressesPanel.md); styles in `ui/shell/css/settings-passwords.css`). It has:
- the "Offer to save passwords" switch;
- search;
- an Add / Edit form (site, username, password with Show and Generate, note);
- rows with Show / Copy / Edit / Delete (Delete asks for a second click within 3 s);
- CSV Import (Chrome, Edge, Firefox, Bitwarden) and Export, the export toast warning that the file is not encrypted;
- the never-saved sites with Remove.

The status line says how the vault is stored. A warning shows for an unreadable vault or a system without a keychain.

Lists arrive without passwords. A password is fetched only on Show, Copy or Edit, and shown ones are dropped on every
refresh and when Settings closes.

## Methods

- `new PasswordsPanel({ feedback })`, `install()`, `refresh()`, `render()`, `openEditor(id)`, `closeEditor()`.
- Statics: `filter(items, query)`, `rowHtml(item, revealed)`, `neverRowHtml(origin)`, `warningFor(status)`,
  `importSummary(res)`.

## Globals

Reads `window.vaultAPI`.

## Master password and assistant access

`new PasswordsPanel({ feedback, security })`. Show, Copy, Edit and Export first call `security.request()`
([VaultSecurityPanel](VaultSecurityPanel.md)). The editor's "Let the assistant sign in with this login" box sets
`aiAccess`, and rows with it carry an "Assistant" tag.

## Two-factor

The editor has a "2FA secret" field (setup key or otpauth:// link). Rows with one carry a "2FA" tag and a Code button that copies the current code (behind the master password).
