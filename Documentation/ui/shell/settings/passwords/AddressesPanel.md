# AddressesPanel

`ui/shell/settings/passwords/AddressesPanel.js`

Settings > Passwords & autofill > Addresses and contact info. Lists the saved profiles, with add, edit and delete
(Delete asks for a second click within 3 s), and the "Offer to save addresses" switch. The editor's fields come from
main (`vaultAPI.status().profileFields`), so the form and the page-side field matching never disagree.

## Methods

- `install()`, `refresh()`, `render()`, `openEditor(id)`, `closeEditor()`.
- Statics: `summary(profile)`, `rowHtml(profile)`, `fieldsHtml(fields, profile)`.

## Globals

Reads `window.vaultAPI`.

## Assistant access

`new AddressesPanel({ security })`. The editor's "Let the assistant fill forms with this address" box sets
`aiAccess` (after `security.request()`); rows with it carry an "Assistant" tag.
