# setup-ui.js (tool-forge entry)

`extensions/tool-forge/setup-ui.js`, `extensions/tool-forge/setup-ui.css`

The "My Tools" Setup-tab entry, loaded by the LLM tab as a module (bundled, not
`distributable`): registers `{ id: 'tool-forge', label: 'My Tools', mount }`
with `window.LumaSetupExt`, where `mount(el, api)` runs
[MyToolsTab](ui/MyToolsTab.md); logs "[tool-forge] LumaSetupExt not present"
without the host. `setup-ui.css` is unchanged apart from header em-dashes.

The manifest's `setupTab.assets` lists the `ui/` modules, because the
`/llm-ui/ext/` asset gate serves only declared files.

## Globals

Reads `window.LumaSetupExt`.
