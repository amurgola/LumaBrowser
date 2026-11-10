# ProviderList

`ui/shell/settings/providers/ProviderList.js`

AI & Providers: the Defaults control, one card per provider and the Add Provider form; re-rendered on every open and after changes. Cards are compact rows ([ProviderCardShell](ProviderCardShell.md)) that open in place: one that still needs setting up (`needsSetup`) starts open, and the ones the user opened stay open across re-renders.

## Methods

- `install()`, `render()`, `save()`, `add(config)`, `remove(id)`, `configs`.
- `ProviderList.pingChatPanel()`, `ProviderList.needsSetup(config)`.

## Globals

Reads `window.ipcBridge`, `window.electronAPI.getLlmProviderConfig`, `window.sharingAPI.listPeers`, `window.imageServersAPI.getServerConfigs`, `window.lumaAiChatPanel`.
