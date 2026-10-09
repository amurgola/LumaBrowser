# ProviderList

`ui/shell/settings/providers/ProviderList.js`

AI & Providers: the Defaults control, one card per provider and the Add Provider form; re-rendered on every open and after changes.

## Methods

- `install()`, `render()`, `save()`, `add(config)`, `remove(id)`, `configs`.
- `ProviderList.pingChatPanel()`.

## Globals

Reads `window.ipcBridge`, `window.electronAPI.getLlmProviderConfig`, `window.sharingAPI.listPeers`, `window.imageServersAPI.getServerConfigs`, `window.lumaAiChatPanel`.
