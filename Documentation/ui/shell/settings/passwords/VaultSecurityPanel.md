# VaultSecurityPanel

`ui/shell/settings/passwords/VaultSecurityPanel.js`

Settings > Passwords & autofill > Master password and assistant access:
- set, change or remove the master password;
- lock now;
- "Lock after" (5, 15, 60 or 240 minutes);
- "Outside AI tools may use the vault";
- "Recent assistant use", the latest 20 rows of the audit, with Clear.

It also owns the inline unlock form. `request()` resolves true at once without a master password; with one it shows
the form and resolves when the user unlocks (false on Cancel or when Settings closes). PasswordsPanel and
AddressesPanel call it before showing, copying, editing or exporting a password, and before opening an item to the
assistant.

## Methods

- `new VaultSecurityPanel({ feedback })`, `install()`, `refresh()`, `render()`, `request()`, `onChange(fn)`, `state`.
- Statics: `stateText(state)`, `auditRowHtml(row)`.
