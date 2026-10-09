# renderer.js (personal-hub)

`extensions/personal-hub/renderer.js`

Renderer entry of the Hub extension, loaded by the shell as a module script
(bundled, not `distributable`). Sets `window.__ext_personal_hub`
(`{ activate(context), deactivate() }`, the shell's extension renderer
contract) over one [HubRenderer](ui/HubRenderer.md).

The Dashboard widgets under `ui/widgets/` are not loaded here: the Dashboard
page imports them itself from `manifest.dashboard.widgets`.

## Globals

Writes `window.__ext_personal_hub`.
