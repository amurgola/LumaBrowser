# KeysPanel

`ui/shell/settings/passwords/KeysPanel.js`

Settings > Passwords & autofill > API keys and tokens: secrets the assistant can use by placeholder without reading
them. A key named "openai" is written `{{vault:openai}}`. Rows show the name, the placeholder and a masked value,
with Show / Copy / Edit / Delete (Delete asks for a second click). Show, Copy and Save first unlock the vault
(`security.request()`). Editing leaves the value empty, and an empty value keeps the saved one. "Let the assistant use
this key" sets `aiAccess`.

## Methods

- `new KeysPanel({ feedback, security })`, `install()`, `refresh()`, `render()`, `openEditor(id)`, `closeEditor()`.
- `KeysPanel.rowHtml(key, revealed)`.
